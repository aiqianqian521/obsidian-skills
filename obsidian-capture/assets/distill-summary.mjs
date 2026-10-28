#!/usr/bin/env node
/**
 * distill-summary.mjs — Distill session turns into thinking/solution/plan notes.
 * Reads hook stdin JSON (same shape as session-logger.mjs) or a raw.md file
 * directly, classifies each turn, and appends result to structured distill
 * files in the vault at 91_蒸馏整理/{category}/{YYYY-MM-DD}-{topic}.md.
 */

import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve, basename } from "node:path";
import os from "node:os";

const DEFAULT_VAULT = "D:/gongzuo/知识库/工作知识库";
const SESSIONS_DIR = "90_原始来源/会话记录";
const DISTILL_DIR = "91_蒸馏整理";

const CATEGORIES = ["思考", "解决", "方案"];

const CATEGORY_KEYWORDS = {
  "思考": ["背景", "上下文", "原因", "思考", "分析", "不确定", "考虑", "思路", "原理", "逻辑", "推演", "假设", "如果", "可能", "需要确认"],
  "解决": ["解决", "修复", "错误", "排查", "debug", "原因", "问题", "修复", "报错", "异常", "排查", "定位", "根因", "修复方法"],
  "方案": ["方案", "决定", "采用", "实现", "执行", "步骤", "计划", "架构", "选型", "设计", "搭建", "搭建", "配置", "方案:", "决定:", "接下来"],
};

function belongsToCategories(text) {
  const scores = {};
  for (const cat of CATEGORIES) scores[cat] = 0;
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (text.includes(kw)) scores[cat]++;
    }
  }
  return scores;
}

function classifyTurn(text) {
  if (!text || !text.trim()) return null;
  const scores = belongsToCategories(text);
  let bestCat = null;
  let bestScore = 0;
  for (const [cat, score] of Object.entries(scores)) {
    if (score > bestScore) { bestScore = score; bestCat = cat; }
  }
  // Priority: 解决 > 方案 > 思考
  if (bestScore === 0) return null;
  return bestCat;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\u4e00-\u9fff\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 60) || "untitled";
}

function readObsidianYaml(dir) {
  let current = resolve(dir);
  for (let i = 0; i < 6; i++) {
    const p = join(current, ".obsidian.yaml");
    if (existsSync(p)) {
      try {
        const cfg = {};
        for (const line of readFileSync(p, "utf-8").split("\n")) {
          const m = line.match(/^([^\s:]+):\s*(.*)$/);
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

function readStdin() {
  return new Promise((res) => {
    let raw = "", done = false;
    const t = setTimeout(() => { if (!done) { done = true; process.stdin.destroy(); res(""); } }, 3000);
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (c) => (raw += c));
    process.stdin.on("end", () => { if (!done) { done = true; clearTimeout(t); res(raw); } });
    process.stdin.on("error", () => { if (!done) { done = true; clearTimeout(t); res(""); } });
  });
}

async function main() {
  const raw = await readStdin();
  let input = {};
  if (raw && raw.trim()) {
    try { input = JSON.parse(raw); } catch {}
  }

  const cwd = (input && input.cwd) || process.cwd();
  const obsCfg = readObsidianYaml(cwd);
  if (!obsCfg || !obsCfg.vault_path) {
    console.error("[distill] No .obsidian.yaml with vault_path found, skipping.");
    process.exit(0);
  }

  const projectName = obsCfg.project_name || basename(cwd);
  const vaultBase = process.env.OBSIDIAN_RAW_VAULT || obsCfg.vault_path;
  const sessionsDir = obsCfg.directories?.sessions || SESSIONS_DIR;

  // Determine source: hook stdin transcript_path, or raw.md file
  let sourceFile = null;
  if (input && input.transcript_path && existsSync(input.transcript_path)) {
    sourceFile = input.transcript_path;
  } else {
    // Try to find today raw.md for this project
    const today = new Date().toISOString().split("T")[0];
    const candidate = join(vaultBase, sessionsDir, projectName, `${today}.raw.md`);
    if (existsSync(candidate)) sourceFile = candidate;
  }

  if (!sourceFile) {
    console.error("[distill] No source found (no transcript_path in stdin and no raw.md for today).");
    process.exit(0);
  }

  const content = readFileSync(sourceFile, "utf-8").replace(/^\uFEFF/, ""); // strip UTF-8 BOM if present
  const lines = content.split("\n");

  // Extract ## HH:MM | role blocks. 支持所有角色：user/assistant 主 turn，
  // 以及补充块 assistant-reasoning/function_call/function_output/developer（为区分而识别）。
  const LINE_RE = /^## (\d{2}:\d{2}) \| ([A-Za-z0-9_\-]+)(?:\s*\{([0-9a-fA-F]+)\})?/;
  const turns = [];
  let cur = null;
  const flush = () => {
    if (cur && cur.text.join("\n").trim()) {
      turns.push({ role: cur.role, text: cur.text.join("\n").trim(), ts: cur.ts, id: cur.id });
    }
  };
  for (const line of lines) {
    const m = line.match(LINE_RE);
    if (m) { flush(); cur = { role: m[2], ts: m[1], id: m[3] || null, text: [] }; }
    else if (cur) cur.text.push(line);
  }
  flush();

  // 补充块合并进紧随其后的 assistant 主 turn（作为标注子块），避免：
  //   1) assistant-reasoning 被并进前一个 user turn（错误归属）
  //   2) function_output(常含"方案/实现/配置"等词) 主导关键词打分、污染类别
  const SUPPLEMENTARY = new Set(["assistant-reasoning", "function_call", "function_output", "developer"]);
  const mergedTurns = [];
  const pending = [];
  for (const t of turns) {
    if (SUPPLEMENTARY.has(t.role)) { pending.push(t); continue; }
    if (t.role === "assistant" && pending.length) {
      const extra = pending.map(function (p) {
        return "> [" + p.role + " " + p.ts + (p.id ? " {" + p.id + "}" : "") + "]\n" + p.text;
      }).join("\n\n");
      t.text = t.text + "\n\n" + extra;
      pending.length = 0;
    }
    mergedTurns.push(t);
  }
  if (pending.length) {
    for (const p of pending) mergedTurns.push({ role: "assistant-notes", text: p.text, ts: p.ts, id: p.id });
  }

  if (mergedTurns.length === 0) {
    console.error("[distill] No turns found in source.");
    process.exit(0);
  }

  // Classify each turn —— 仅 user/assistant 正文进入类别判定；补充块已并入 assistant，不再单独打分
  const classified = { "思考": [], "解决": [], "方案": [] };
  for (const turn of mergedTurns) {
    if (turn.role !== "user" && turn.role !== "assistant") continue;
    // Skip system markers and filler
    const text = turn.text.trim();
    if (!text || text.length < 10) continue;
    if (text.includes("<permissions instructions>") || text.includes("<environment_context>")) continue;

    const cat = classifyTurn(text);
    if (cat) classified[cat].push({ role: turn.role, text, ts: turn.ts, id: turn.id });
  }

  // Write distill files (only for categories with content)
  const today = new Date().toISOString().split("T")[0];
  const topicHint = turns[0]?.text?.trim()?.substring(0, 60) || "session";
  const topicSlug = slugify(topicHint);

  let anyWritten = false;
  for (const cat of CATEGORIES) {
    const entries = classified[cat];
    if (entries.length === 0) continue;

    const srcRefs = entries.map(function (e) {
      return "  - " + (e.role || "") + " {" + (e.id || "?") + "}@" + basename(sourceFile);
    }).join("\n");

    // route: .obsidian.yaml distill_<cat>=<relative-path> overrides the default 91_蒸馏整理/<cat>
    const routed = obsCfg["distill_" + cat];
    const catDir = routed ? join(vaultBase, String(routed)) : join(vaultBase, DISTILL_DIR, cat);
    mkdirSync(catDir, { recursive: true });

    const outFile = join(catDir, `${today}-${topicSlug}.md`);
    const existing = existsSync(outFile);
    let body = "";

    if (existing) {
      body = readFileSync(outFile, "utf-8");
      // Check if this session already written (avoid dup by timestamp)
      const sessionRef = `session_id: ${today}-${topicSlug}`;
      if (body.includes(sessionRef)) continue;
    } else {
      body = `---\ntype: distill\ncategory: ${cat}\ndate: ${today}\nproject: ${projectName}\nsource: ${sourceFile.replace(vaultBase, "")}\nsource_reference:\n${srcRefs}\nsession_id: ${today}-${topicSlug}\nstatus: draft\n---\n\n`;
    }

    const sectionName = cat === "思考" ? "思考过程" : cat === "解决" ? "解决方案 / 方案" : "方案详情";
    const turnTexts = entries.map(e => `### ${e.role} (${e.ts})\n\n${e.text}\n`).join("\n");

    if (!existing) {
      body += `# ${topicHint}\n\n`;
      body += `## ${sectionName}\n\n`;
    }
    body += turnTexts + "\n";

    writeFileSync(outFile, body, "utf8");
    anyWritten = true;
    console.log(`[distill] Written ${cat}: ${outFile}`);
  }

  if (!anyWritten) {
    console.log("[distill] No turns classified into any category.");
  }
}

main().catch(() => process.exit(0));
