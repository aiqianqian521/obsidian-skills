#!/usr/bin/env node
/**
 * Session Summary — SessionEnd hook for Claude Code
 * Reads the L0 session file, extracts session metadata and key topics,
 * appends a structured summary to the daily note in Obsidian vault.
 *
 * Unlike obsidian-suggest (interactive confirmation), this runs fully automatic.
 */

import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname, resolve, basename } from "node:path";

const DEFAULT_VAULT = "D:/gongzuo/知识库/工作知识库";
const SESSIONS_DIR = "90_原始来源/会话记录";
const SUMMARY_MAX_LEN = 300;

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

// ── Read stdin ──
function readStdin() {
  return new Promise((resolve) => {
    let raw = "", settled = false;
    const t = setTimeout(() => { if (!settled) { settled = true; process.stdin.destroy(); resolve(""); } }, 3000);
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", c => { raw += c; });
    process.stdin.on("end", () => { if (!settled) { settled = true; clearTimeout(t); resolve(raw); } });
    process.stdin.on("error", () => { if (!settled) { settled = true; clearTimeout(t); resolve(""); } });
  });
}

// ── Extract session metadata from L0 file ──
function extractSessionMeta(content) {
  const lines = content.split("\n");
  const userMessages = [];
  let firstTimestamp = null;
  let lastTimestamp = null;
  let messageCount = 0;

  for (const line of lines) {
    const tsMatch = line.match(/^## (\d{2}:\d{2}) \| (user|assistant)/);
    if (tsMatch) {
      messageCount++;
      if (!firstTimestamp) firstTimestamp = tsMatch[1];
      lastTimestamp = tsMatch[1];
      if (tsMatch[2] === "user") {
        // Collect first line of each user message as topic hint
        const nextLine = lines[lines.indexOf(line) + 1];
        if (nextLine && nextLine.trim() && !nextLine.startsWith("##")) {
          userMessages.push(nextLine.trim().substring(0, 120));
        }
      }
    }
  }

  return {
    firstTimestamp,
    lastTimestamp,
    messageCount,
    topics: userMessages.slice(-5), // Last 5 user messages as context
  };
}

// ── Main ──
async function main() {
  const raw = await readStdin();
  if (!raw?.trim()) return;

  let input;
  try { input = JSON.parse(raw); } catch { return; }

  const sessionId = input.session_id || "unknown";
  const cwd = input.cwd || process.cwd();
  const obsCfg = readObsidianYaml(cwd);
  const projectName = obsCfg?.project_name || basename(cwd);
  const vaultBase = obsCfg?.vault_path || DEFAULT_VAULT;

  // Find today's L0 file for this project
  const today = new Date().toISOString().split("T")[0];
  const sessionDir = join(vaultBase, SESSIONS_DIR, projectName);
  const sessionFile = join(sessionDir, `${today}.raw.md`);

  if (!existsSync(sessionFile)) return;

  const content = readFileSync(sessionFile, "utf-8");
  const meta = extractSessionMeta(content);
  if (meta.messageCount === 0) return;

  // Write to daily note
  const dailyDir = join(vaultBase, "01_每日工作记录");
  const dailyFile = join(dailyDir, `${today}.md`);
  mkdirSync(dailyDir, { recursive: true });

  const topicsPreview = meta.topics.map(t => `  - ${t}`).join("\n");

  const summaryEntry = `
## ${meta.firstTimestamp}-${meta.lastTimestamp} | ${projectName}
- 消息数: ${meta.messageCount}
- 话题:
${topicsPreview}
- L0: [[${SESSIONS_DIR}/${projectName}/${today}|会话记录]]
`;

  if (!existsSync(dailyFile)) {
    writeFileSync(dailyFile, `# ${today}\n\n## 工作记录\n`, "utf-8");
  }
  appendFileSync(dailyFile, summaryEntry, "utf-8");
}

main().catch(() => process.exit(0));