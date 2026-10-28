#!/usr/bin/env node
/**
 * Obsidian Session Logger — PostToolUse hook for Claude Code
 * Captures user/assistant messages from transcript JSONL, appends to Obsidian vault.
 * Project isolation: reads {cwd}/.obsidian.yaml → project_name as subdirectory.
 *
 * Reference: claude-spy spy.mjs (stdin JSON), TencentDB capture.ts (message extraction)
 */

import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname, resolve, basename } from "node:path";
import os from "node:os";

const DEFAULT_VAULT = "D:/gongzuo/知识库/工作知识库";
const SESSIONS_DIR = "90_原始来源/会话记录";
const MAX_CONTENT_LEN = 100000; // user/assistant full body (old 5000 drops long msgs)
const MAX_REASON_LEN = 200000;
const MAX_TOOL_LEN = 20000;

// ── Minimal YAML reader ──
function readObsidianYaml(dir) {
  let current = resolve(dir);
  for (let i = 0; i < 5; i++) {
    const p = join(current, ".obsidian.yaml");
    if (existsSync(p)) {
      try {
        const cfg = {};
        for (const line of readFileSync(p, "utf-8").split("\n")) {
          const m = line.match(/^(\w[\w_]*):\s*(.+)/);
          if (m) cfg[m[1]] = m[2].trim().replace(/['"]/g, "");
        }
        return cfg;
      } catch {}
    }
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return null;
}

// ── Read stdin JSON (claude-spy pattern) ──
// 计算 raw 文件已有锚的最大序号（十进制），保证同文件内锚全局唯一（跨会话/跨批）
function computeFileMaxAnchor(outFile) {
  let max = 0;
  try {
    if (existsSync(outFile)) {
      const body = readFileSync(outFile, "utf-8");
      const re = /\{([0-9a-fA-F]{8})\}/g;
      let m;
      while ((m = re.exec(body)) !== null) {
        const v = parseInt(m[1], 16);
        if (v > max) max = v;
      }
    }
  } catch {}
  return max;
}

function readStdin() {
  return new Promise((resolve) => {
    let raw = "", settled = false;
    const t = setTimeout(() => { if (!settled) { settled = true; process.stdin.destroy(); resolve(""); } }, 1500);
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", c => { raw += c; });
    process.stdin.on("end", () => { if (!settled) { settled = true; clearTimeout(t); resolve(raw); } });
    process.stdin.on("error", () => { if (!settled) { settled = true; clearTimeout(t); resolve(""); } });
  });
}

// ── Extract user/assistant text from JSONL ──
function extractMessages(lines) {
  const msgs = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const e = JSON.parse(line);
      const cap = (s, n) => (typeof s === "string" ? s.slice(0, n) : "");
      const ts = e.timestamp;
      if (e.type === "user") {
        let text = "";
        if (typeof e.message?.content === "string") text = e.message.content;
        else if (Array.isArray(e.message?.content)) {
          text = e.message.content.filter(c => c && c.type === "text" && typeof c.text === "string").map(c => c.text).join("\n");
        }
        text = text.trim();
        if (text) {
          text = text.replace(/<relevant-memories[\s\S]*?<\/relevant-memories>/g, "").trim();
          if (text) msgs.push({ role: "user", content: cap(text, MAX_CONTENT_LEN), ts });
        }
      } else if (e.type === "assistant" && Array.isArray(e.message?.content)) {
        let txt = [], reason = [], calls = [];
        for (const c of e.message.content) {
          if (!c) continue;
          if (c.type === "text" && typeof c.text === "string") txt.push(c.text);
          else if (c.type === "thinking" && typeof c.thinking === "string") { const t = c.thinking.trim(); if (t) reason.push(cap(t, MAX_REASON_LEN)); }
          else if (c.type === "tool_use" && c.name) calls.push(c.name + " " + (c.input ? JSON.stringify(c.input) : ""));
        }
        for (const r of reason) msgs.push({ role: "assistant-reasoning", content: r, ts });
        const cleaned = txt.join("\n").replace(/<relevant-memories[\s\S]*?<\/relevant-memories>/g, "").trim();
        if (cleaned) msgs.push({ role: "assistant", content: cap(cleaned, MAX_CONTENT_LEN), ts });
        for (const call of calls) msgs.push({ role: "function_call", content: cap(call, MAX_TOOL_LEN), ts });
      }
    } catch {}
  }
  return msgs;
}

// 硬看门狗：hook 宿主若未关闭 stdin，node 不会自动退出，可能导致 hook 超时。
// 此处强制在 hook 超时阈值前退出（Claude/Codex hook 均以 10s 为限）。
setTimeout(() => process.exit(0), 7000).unref();

// ── Main ──

// ── Init guard: require .obsidian.yaml before writing (避免默认库污染) ──
function maybeWarnNoConfig(cwd, engineLabel) {
  const slug = String(cwd).replace(/[^A-Za-z0-9]+/g, "-").slice(0, 80);
  const marker = join(os.tmpdir(), "obsidian-capture-init-" + slug + ".ts");
  const now = Date.now();
  let last = 0;
  try { last = parseInt(readFileSync(marker, "utf-8"), 10) || 0; } catch {}
  if (now - last < 30 * 60 * 1000) return; // 30 分钟内每项目只提醒一次
  try { writeFileSync(marker, String(now), "utf-8"); } catch {}
  const msg = "[obsidian-capture][" + engineLabel + "] 未找到 .obsidian.yaml（已从 " + cwd + " 向上查找 6 层）。\n保存对话 hook 需先初始化：在项目根放 .obsidian.yaml，至少含 vault_path 与 project_name。\n本次跳过落盘（不写默认库，避免污染）。";
  try { process.stdout.write(msg + "\n"); } catch {}
  try { process.stderr.write(msg + "\n"); } catch {}
}
async function main() {
  const raw = await readStdin();
  if (!raw?.trim()) return;

  let input;
  try { input = JSON.parse(raw); } catch { return; }

  const transcriptPath = input.transcript_path;
  if (!transcriptPath || !existsSync(transcriptPath)) return;

  // ── Project isolation: read project_name from .obsidian.yaml ──
  const cwd = input.cwd || process.cwd();
  const obsCfg = readObsidianYaml(cwd);
  if (!obsCfg || !obsCfg.vault_path) { maybeWarnNoConfig(cwd, "claude"); return; }
  const projectName = obsCfg.project_name || basename(cwd);
  const vaultBase = obsCfg.vault_path;

  const sessionDir = join(vaultBase, SESSIONS_DIR, projectName);
  const stateFile = join(sessionDir, ".session-state");

  // ── Track transcript progress ──
  const sessionId = input.session_id || "unknown";
  const allLines = readFileSync(transcriptPath, "utf-8").replace(/\n+$/, "").split("\n");

  // 读取该 session 已消费行号与已用锚计数（格式："<id> <N> <counter>"，兼容旧 "<id> <N>"）
  let lastLine = 0;
  let lastCounter = 0;
  if (existsSync(stateFile)) {
    try {
      for (const s of readFileSync(stateFile, "utf-8").split("\n")) {
        const parts = s.split(" ");
        if (parts[0] === sessionId) {
          lastLine = parseInt(parts[1], 10) || 0;
          lastCounter = parseInt(parts[2], 10) || 0;
          break;
        }
      }
    } catch {}
  }
  if (lastLine >= allLines.length) return;

  const messages = extractMessages(allLines.slice(lastLine));
  if (messages.length === 0) return;

  // ── Update state（记录最后锚计数，避免跨批次锚碰撞）──
  const stateLines = existsSync(stateFile)
    ? readFileSync(stateFile, "utf-8").split("\n").filter(l => l.trim() && !l.startsWith(sessionId + " "))
    : [];
  stateLines.push(`${sessionId} ${allLines.length} ${lastCounter + messages.length}`);
  mkdirSync(sessionDir, { recursive: true });
  writeFileSync(stateFile, stateLines.join("\n") + "\n", "utf-8");

  // ── Format & write ──
  const today = new Date().toISOString().split("T")[0];
  const outFile = join(sessionDir, `${today}.raw.md`);

  let output = "";
  // 锚起点 = 本文件已有最大锚 与 会话自增计数器 的较大者 + 1，保证同文件内唯一（F4 修复）
  let blockCounter = Math.max(lastCounter, computeFileMaxAnchor(outFile)) + 1;
  for (const m of messages) {
    const ts = new Date(m.ts);
    const hhmm = `${String(ts.getHours()).padStart(2, "0")}:${String(ts.getMinutes()).padStart(2, "0")}`;
    const anchor = blockCounter.toString(16).padStart(8, "0");
    output += `\n## ${hhmm} | ${m.role} {${anchor}}\n${m.content}\n`;
    blockCounter++;
  }

  if (!existsSync(outFile)) {
    writeFileSync(outFile, `---\ndate: ${today}\nproject: ${projectName}\nsession: ${sessionId.substring(0, 8)}\n---\n`, "utf-8");
  }
  appendFileSync(outFile, output, "utf-8");
}

main().catch(() => process.exit(0));
