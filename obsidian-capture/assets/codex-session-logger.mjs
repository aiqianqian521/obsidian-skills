#!/usr/bin/env node
/**
 * Codex (CodeFuse AntCodex) Session Logger — Stop / PostToolUse hook
 * 镜像 obsidian-capture 的 session-logger.mjs，但读取 Codex 的 rollout JSONL，
 * 增量抽取 user/assistant 文本，追加到 Obsidian 知识库的每日会话原始文件。
 *
 * Codex rollout 记录结构（每行一个 JSON）：
 *   {"type":"session_meta","payload":{"id","cwd",...}}
 *   {"type":"turn_context","payload":{"turn_id","cwd",...}}
 *   {"type":"response_item","payload":{"type":"message","role":"user|assistant|developer","content":[{"type":"input_text|output_text","text":"..."}]}}
 *
 * 保存策略：仅保留 role ∈ {user, assistant} 的 message；跳过 developer（自动注入的系统上下文：
 * 权限/协作模式/skills/AGENTS/环境）、reasoning、function_call、function_call_output。
 *
 * 与 Claude 的 session-logger.mjs 保持一致：
 *   读 {cwd}/.obsidian.yaml -> vault_path/project_name
 *   追加到 {vault}/90_原始来源/会话记录/{project}/{YYYY-MM-DD}.raw.md
 *   每条消息：## HH:MM | user  /  ## HH:MM | assistant
 *   用 .session-state（按 session_id 记录已消费行号）做增量、去重。
 *
 * 环境变量：
 *   OBSIDIAN_RAW_VAULT  覆盖 vault 根路径（自测/临时重定向用）
 *   CODEX_HOME         覆盖 codex 引擎主目录（默认 ~/.codefuse/engine/codex）
 */

import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync, readdirSync, statSync, openSync, readSync, closeSync, fstatSync } from "node:fs";
import { join, dirname, resolve, basename } from "node:path";
import os from "node:os";

const DEFAULT_VAULT = "D:/gongzuo/知识库/工作知识库";
const SESSIONS_DIR = "90_原始来源/会话记录";
const MAX_CONTENT_LEN = 100000; // user/assistant full body (old 8000 drops long msgs)
const MAX_REASON_LEN = 200000;
const MAX_TOOL_LEN = 20000;
const MAX_OUTPUT_LEN = 20000;

const SYSTEM_MARKERS = [
  "<permissions instructions>",
  "<environment_context>",
  "<collaboration_mode>",
  "<skills_instructions>",
  "<INSTRUCTIONS>",
  "<system-reminder",
  "# AGENTS.md instructions",
];

// 硬看门狗：Codex 触发 Stop/PostToolUse 时若 stdin 未关闭，node 不会自动退出，
// 必须在此强制退出，避免 Codex hook 10s 超时报 "Stop hook (failed)"。
setTimeout(() => process.exit(0), 7000).unref();

function codexHome() {
  if (process.env.CODEX_HOME && existsSync(process.env.CODEX_HOME)) return process.env.CODEX_HOME;
  return join(os.homedir(), ".codefuse", "engine", "codex");
}

function readObsidianYaml(dir) {
  let current = resolve(dir);
  for (let i = 0; i < 6; i++) {
    const p = join(current, ".obsidian.yaml");
    if (existsSync(p)) {
      try {
        const cfg = {};
        for (const line of readFileSync(p, "utf-8").split("\n")) {
          const m = line.match(/^([\w_ -]+):\s*(.+)/);
          if (m) cfg[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, "");
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

// 计算 raw 文件已有锚的最大序号（只扫尾部 64KB：锚随追加单调递增，尾部即最大区，避免全量读大文件）
function computeFileMaxAnchor(outFile) {
  let max = 0;
  try {
    if (existsSync(outFile)) {
      const fd = openSync(outFile, "r");
      try {
        const size = fstatSync(fd).size;
        const start = size > 65536 ? size - 65536 : 0;
        const len = size - start;
        if (len > 0) {
          const buf = Buffer.allocUnsafe(len);
          let got = 0;
          while (got < len) {
            const n = readSync(fd, buf, got, len - got, start + got);
            if (n <= 0) break;
            got += n;
          }
          const body = buf.slice(0, got).toString("utf-8");
          const re = /\{([0-9a-fA-F]{8})\}/g;
          let m;
          while ((m = re.exec(body)) !== null) {
            const v = parseInt(m[1], 16);
            if (v > max) max = v;
          }
        }
      } finally {
        closeSync(fd);
      }
    }
  } catch {}
  return max;
}

// 从 offset 起增量读取，仅消费到最后一个完整行（'\n' 结尾），避免半行被吞
function readTailFrom(path, offset) {
  const fd = openSync(path, "r");
  try {
    const size = fstatSync(fd).size;
    if (offset >= size) return { text: "", endOffset: offset };
    const len = size - offset;
    const buf = Buffer.allocUnsafe(len);
    let got = 0;
    while (got < len) {
      const n = readSync(fd, buf, got, len - got, offset + got);
      if (n <= 0) break;
      got += n;
    }
    const chunk = buf.slice(0, got);
    const nl = chunk.lastIndexOf(0x0a);
    if (nl < 0) return { text: "", endOffset: offset };
    return { text: chunk.slice(0, nl + 1).toString("utf-8"), endOffset: offset + nl + 1 };
  } finally {
    closeSync(fd);
  }
}

function readStdin() {
  return new Promise((res) => {
    let raw = "", done = false;
    const t = setTimeout(() => { if (!done) { done = true; process.stdin.destroy(); res(""); } }, 1500);
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (c) => (raw += c));
    process.stdin.on("end", () => { if (!done) { done = true; clearTimeout(t); res(raw); } });
    process.stdin.on("error", () => { if (!done) { done = true; clearTimeout(t); res(""); } });
  });
}

// 定位当前会话的 rollout JSONL
function findRollout(input) {
  // 1) 若 hook stdin 直接给了 transcript/rollout 路径
  for (const k of ["transcript_path", "transcriptPath", "rollout_path", "rolloutPath", "path"]) {
    const v = input && input[k];
    if (v && existsSync(v) && /\.jsonl$/i.test(v)) return v;
  }
  const sid = (input && (input.session_id || input.sessionId)) || "";
  const sessRoot = join(codexHome(), "sessions");
  if (!existsSync(sessRoot)) return null;
  const cands = [];
  const stack = [{ dir: sessRoot, depth: 0 }];
  let scanned = 0;
  while (stack.length) {
    if (scanned > 4000) break; // 上限：避免超大 sessions 目录拖慢 Stop/PostToolUse hook
    const popped = stack.pop();
    const d = popped.dir, depth = popped.depth;
    if (depth > 3) continue;
    let entries;
    try { entries = readdirSync(d); } catch { continue; }
    for (const e of entries) {
      const full = join(d, e);
      let s;
      try { s = statSync(full); } catch { continue; }
      scanned++;
      if (s.isDirectory()) { stack.push({ dir: full, depth: depth + 1 }); continue; }
      if (/^rollout-.*\.jsonl$/i.test(e) && (!sid || basename(full).includes(sid))) {
        cands.push({ full, t: s.mtimeMs });
      }
    }
  }
  if (!cands.length) return null;
  cands.sort((a, b) => b.t - a.t);
  return cands[0].full; // 最新写入的 rollout
}

function joinText(x) {
  if (Array.isArray(x)) return x.filter(function(i){ return i && (i.type === "text" || i.type === "input_text" || i.type === "output_text") && typeof i.text === "string"; }).map(function(i){ return i.text; }).join("\n");
  if (x && typeof x.text === "string") return x.text;
  if (typeof x === "string") return x;
  return "";
}

function extractMessages(lines) {
  const msgs = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    let e;
    try { e = JSON.parse(line); } catch { continue; }
    if (!e || e.type !== "response_item") continue;
    const p = e.payload || {};
    const ptype = p.type;
    const ts = e.timestamp;
    const cap = (s, n) => (typeof s === "string" ? s.slice(0, n) : "");
    if (ptype === "reasoning") {
      const txt = cap(joinText(p.content), MAX_REASON_LEN).trim();
      if (txt) msgs.push({ role: "assistant-reasoning", content: txt, ts });
      continue;
    }
    if (ptype === "function_call") {
      const name = p.name || "fn";
      const args = cap(typeof p.arguments === "string" ? p.arguments : joinText(p.arguments), MAX_TOOL_LEN);
      msgs.push({ role: "function_call", content: (name + (args ? "\n" + args : "")), ts });
      continue;
    }
    if (ptype === "function_call_output") {
      const out = cap(typeof p.output === "string" ? p.output : joinText(p.output), MAX_OUTPUT_LEN).trim();
      if (out) msgs.push({ role: "function_output", content: out, ts });
      continue;
    }
    if (ptype !== "message") continue;
    const role = p.role;
    const text = joinText(p.content).trim();
    if (!text) continue;
    if (SYSTEM_MARKERS.some((m) => text.includes(m))) continue;
    const capLen = role === "developer" ? MAX_REASON_LEN : MAX_CONTENT_LEN;
    const content = cap(text, capLen);
    msgs.push({ role, content, ts });
  }
  return msgs;
}


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
  let input = {};
  if (raw && raw.trim()) {
    try { input = JSON.parse(raw); } catch {}
  }

  const cwd = (input && input.cwd) || process.cwd();
  const obsCfg = readObsidianYaml(cwd);
  if (!obsCfg || !obsCfg.vault_path) { maybeWarnNoConfig(cwd, "codex"); return; }
  const projectName = obsCfg.project_name || basename(cwd);
  const vaultBase = process.env.OBSIDIAN_RAW_VAULT || obsCfg.vault_path;

  const sessionDir = join(vaultBase, SESSIONS_DIR, projectName);
  const stateFile = join(sessionDir, ".session-state");

  const rollout = findRollout(input);
  if (!rollout || !existsSync(rollout)) return; // 找不到 transcript，静默退出

  const sidRaw = (input && (input.session_id || input.sessionId)) || basename(rollout).replace(/^rollout-.*?([0-9a-f-]{36})\.jsonl$/i, "$1");
  const sid = sidRaw || "unknown";

  // 读取该 session 进度： "<id> <已消费行数> <锚计数> <字节偏移>"（兼容旧 "<id> <N>" / "<id> <N> <counter>"）
  let lastLine = 0;
  let lastCounter = 0;
  let lastOffset = -1;
  if (existsSync(stateFile)) {
    try {
      for (const s of readFileSync(stateFile, "utf-8").split("\n")) {
        const idx = s.indexOf(" ");
        if (idx > 0 && s.slice(0, idx) === sid) {
          const rest = s.slice(idx + 1).split(" ");
          lastLine = parseInt(rest[0], 10) || 0;
          lastCounter = parseInt(rest[1], 10) || 0;
          const off = rest.length > 2 ? parseInt(rest[2], 10) : -1;
          lastOffset = (off >= 0) ? off : -1;
          break;
        }
      }
    } catch {}
  }

  // 写回进度（保留其它 session 的记录；记录锚计数避免跨批次锚碰撞）
  const saveState = (nLines, nCounter, nOffset) => {
    const stateLines = existsSync(stateFile)
      ? readFileSync(stateFile, "utf-8").split("\n").filter((l) => l.trim() && !l.startsWith(sid + " "))
      : [];
    stateLines.push(sid + " " + nLines + " " + nCounter + " " + nOffset);
    mkdirSync(sessionDir, { recursive: true });
    writeFileSync(stateFile, stateLines.join("\n") + "\n", "utf-8");
  };

  // 增量读取 rollout：有字节偏移只读新字节；否则回退全量读一次（旧 state 迁移）并补上偏移
  const sizeNow = statSync(rollout).size;
  let lines = [];
  let newOffset = sizeNow;
  if (lastOffset >= 0 && lastOffset <= sizeNow) {
    const t = readTailFrom(rollout, lastOffset);
    newOffset = t.endOffset;
    if (t.text) {
      lines = t.text.split("\n");
      if (lines.length && lines[lines.length - 1] === "") lines.pop();
    }
  } else {
    const full = readFileSync(rollout, "utf-8");
    const all = full.split("\n");
    const endsWithNl = all.length > 1 && all[all.length - 1] === "";
    const complete = endsWithNl ? all.slice(0, -1) : all;
    if (endsWithNl) {
      lines = complete.slice(lastLine);
      newOffset = sizeNow;
    } else {
      lines = complete.slice(lastLine, Math.max(lastLine, complete.length - 1));
      newOffset = sizeNow - Buffer.byteLength(complete[complete.length - 1] || "", "utf-8");
    }
  }
  if (lines.length === 0) return;

  const messages = extractMessages(lines);
  if (messages.length === 0) {
    // 没有可归档内容也要推进偏移，避免下次重复扫描同一段
    saveState(lastLine + lines.length, lastCounter, newOffset);
    return;
  }

  // 更新进度
  saveState(lastLine + lines.length, lastCounter + messages.length, newOffset);

  const today = new Date().toISOString().split("T")[0];
  const outFile = join(sessionDir, today + ".raw.md");

  let out = "";
  // 锚起点 = 本文件已有最大锚 与 会话自增计数器 的较大者 + 1，保证同文件内唯一（F4 修复）
  let blockCounter = Math.max(lastCounter, computeFileMaxAnchor(outFile)) + 1;
  for (const m of messages) {
    const ts = m.ts ? new Date(m.ts) : new Date();
    const hh = String(ts.getHours()).padStart(2, "0");
    const mm = String(ts.getMinutes()).padStart(2, "0");
    const anchor = blockCounter.toString(16).padStart(8, "0");
    out += "\n## " + hh + ":" + mm + " | " + m.role + " {" + anchor + "}\n" + m.content + "\n";
    blockCounter++;
  }
  if (!existsSync(outFile)) {
    writeFileSync(
      outFile,
      "---\ndate: " + today + "\nproject: " + projectName + "\nsession: " + String(sid).substring(0, 8) + "\nengine: codex\n---\n",
      "utf-8"
    );
  }
  appendFileSync(outFile, out, "utf-8");
}

main().catch(() => process.exit(0));
