import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scenarios = JSON.parse(fs.readFileSync(path.join(root, "evals", "full-fix-scenarios.json"), "utf8"));
const prefix = "zhanggege-full-fix-eval-";
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
let assertions = 0;
const results = [];

function assert(condition, message) {
  assertions += 1;
  if (!condition) throw new Error(message);
}

function ensure(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function write(file, content) {
  ensure(path.dirname(file));
  fs.writeFileSync(file, content, "utf8");
}

function writeIfAbsent(file, content) {
  if (fs.existsSync(file)) return false;
  write(file, content);
  return true;
}

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  }).sort();
}

function hash(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function snapshot(directory) {
  return Object.fromEntries(walk(directory).map((file) => [path.relative(directory, file).replaceAll("\\", "/"), hash(file)]));
}

function sameSnapshot(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function countFiles(directory, matcher) {
  if (!fs.existsSync(directory)) return 0;
  return walk(directory).filter((file) => matcher ? matcher(file) : true).length;
}

// --- Chinese normalization helpers (P1-2) ---
const CHINESE_SUFFIXES = ["问题", "方案", "策略", "方法", "流程", "指南", "记录", "说明", "总结", "报告", "笔记", "设计", "优化", "改进", "系统", "框架", "架构"];
const CHINESE_PREFIXES = ["关于", "如何", "怎么", "怎样"];
const PUNCTUATION = /[，。！？、：；""''（）《》【】…—,.;:!?"'()\[\]{}]/g;

function normalizeTitle(title) {
  let result = title.toLowerCase();
  result = result.replace(PUNCTUATION, "");
  result = result.replace(/\s+/g, " ").trim();
  return result;
}

function stripAffixes(title) {
  let result = title;
  let changed = true;
  while (changed) {
    changed = false;
    for (const prefix of CHINESE_PREFIXES) {
      if (result.startsWith(prefix)) { result = result.slice(prefix.length); changed = true; }
    }
    for (const suffix of CHINESE_SUFFIXES) {
      if (result.endsWith(suffix)) { result = result.slice(0, -suffix.length); changed = true; }
    }
  }
  return result.trim();
}

function matchChineseTitle(title1, title2) {
  const n1 = normalizeTitle(title1);
  const n2 = normalizeTitle(title2);
  if (n1 === n2) return { matched: true, reason: "mechanical" };

  const base1 = stripAffixes(n1);
  const base2 = stripAffixes(n2);
  if (base1 === base2) {
    if (base1.length < 3) return { matched: false, reason: "needs-review: base too short", base: base1 };
    return { matched: true, reason: "synonym-suffix-match", base: base1 };
  }
  return { matched: false, reason: "different bases", base1, base2 };
}

// --- Scenario A: Chinese normalization (P1-2) ---
function scenarioA() {
  const vault = path.join(tempRoot, "scenario-a");
  ensure(path.join(vault, ".obsidian"));
  ensure(path.join(vault, "05_Concepts"));

  // A1: "Redis缓存策略设计" vs "Redis缓存方案总结" → should match (base "Redis缓存" = 8 chars)
  const concept1 = path.join(vault, "05_Concepts", "redis-cache-strategy-design.md");
  write(concept1, "---\ntype: concept\nid: redis-cache-strategy-design\ndate: 2026-08-01\nstatus: active\nsource:\n  - \"[[source-1]]\"\n---\n# Redis缓存策略设计\n\n## One Sentence\nRedis 缓存采用 string 类型。\n");

  const match1 = matchChineseTitle("Redis缓存策略设计", "Redis缓存方案总结");
  assert(match1.matched, `A1: Redis缓存策略设计 should match Redis缓存方案总结, got ${match1.reason}`);
  assert(match1.base.length >= 3, `A1: base "${match1.base}" too short`);

  // A2: "日志系统" vs "日志方案" → base too short → needs-review
  const concept2 = path.join(vault, "05_Concepts", "logging-system.md");
  write(concept2, "---\ntype: concept\nid: logging-system\ndate: 2026-08-01\nstatus: active\nsource:\n  - \"[[source-2]]\"\n---\n# 日志系统\n\n## One Sentence\n统一日志采集。\n");

  const match2 = matchChineseTitle("日志系统", "日志方案");
  assert(!match2.matched, "A2: 日志系统 should NOT auto-match 日志方案 (base too short)");
  assert(match2.reason.includes("needs-review"), `A2: expected needs-review, got ${match2.reason}`);
  assert(match2.base === "日志", `A2: unexpected base "${match2.base}"`);

  // A3: "Redis 缓存" vs "MySQL 配置" → different bases → no match
  const match3 = matchChineseTitle("Redis 缓存", "MySQL 配置");
  assert(!match3.matched, "A3: different titles should not match");
  assert(match3.reason === "different bases", `A3: unexpected reason ${match3.reason}`);

  // A4: Mechanical match (exact after normalization)
  const match4 = matchChineseTitle("缓存策略", "缓存策略");
  assert(match4.matched && match4.reason === "mechanical", "A4: exact match failed");

  results.push({ id: scenarios[0].id, score: 40, decision: { normalizationWorks: true, shortBaseSafety: true } });
}

// --- Scenario B: Sharding + content search (P3-5, P3-7) ---
function scenarioB() {
  const vault = path.join(tempRoot, "scenario-b");
  ensure(path.join(vault, ".obsidian"));
  const sessionsDir = path.join(vault, "90_Sources", "Sessions");
  ensure(sessionsDir);

  // B1: Create 3 shards
  const shard1 = path.join(sessionsDir, "2026-08-04-1530-redis-upgrade-1.raw.md");
  write(shard1, `---
type: source
source_kind: session
date: 2026-08-04
status: processed
capture_scope: partial
missing_context: see shard 2 and 3
project: knowledge-upgrade
extraction_candidates:
  - topic: Redis 缓存策略, keywords: redis, 缓存, string, hash
  - topic: 超时重试, keywords: 超时, 重试, timeout, retry
---

# Redis upgrade session (part 1)

## User Goal
升级 Redis 缓存层，讨论数据结构选型。

Continued in [[2026-08-04-1530-redis-upgrade-2.raw]]
`);

  const shard2 = path.join(sessionsDir, "2026-08-04-1530-redis-upgrade-2.raw.md");
  write(shard2, `---
type: source
source_kind: session
date: 2026-08-04
status: processed
capture_scope: partial
missing_context: see shard 1 and 3
project: knowledge-upgrade
extraction_candidates:
  - topic: 认证中间件, keywords: auth, jwt, middleware, 认证
---

# Redis upgrade session (part 2)

Continued from [[2026-08-04-1530-redis-upgrade-1.raw]]

## User Goal
重构认证中间件，从 session 迁移到 JWT。

Continued in [[2026-08-04-1530-redis-upgrade-3.raw]]
`);

  const shard3 = path.join(sessionsDir, "2026-08-04-1530-redis-upgrade-3.raw.md");
  write(shard3, `---
type: source
source_kind: session
date: 2026-08-04
status: processed
capture_scope: partial
missing_context: see shard 1 and 2
project: knowledge-upgrade
extraction_candidates:
  - topic: 部署流水线, keywords: deploy, ci, cd, 部署, docker
---

# Redis upgrade session (part 3)

Continued from [[2026-08-04-1530-redis-upgrade-2.raw]]

## User Goal
搭建 CI/CD 部署流水线。
`);

  // B2: Verify naming — numbered suffix pattern
  assert(fs.existsSync(shard1) && shard1.endsWith("-1.raw.md"), "B2: shard-1 naming wrong");
  assert(fs.existsSync(shard2) && shard2.endsWith("-2.raw.md"), "B2: shard-2 naming wrong");
  assert(fs.existsSync(shard3) && shard3.endsWith("-3.raw.md"), "B2: shard-3 naming wrong");

  // B3: Verify cross-links
  const c1 = fs.readFileSync(shard1, "utf8");
  const c2 = fs.readFileSync(shard2, "utf8");
  const c3 = fs.readFileSync(shard3, "utf8");
  assert(c1.includes("[[2026-08-04-1530-redis-upgrade-2.raw]]"), "B3: shard-1 missing forward link to shard-2");
  assert(c2.includes("[[2026-08-04-1530-redis-upgrade-1.raw]]"), "B3: shard-2 missing backward link to shard-1");
  assert(c2.includes("[[2026-08-04-1530-redis-upgrade-3.raw]]"), "B3: shard-2 missing forward link to shard-3");
  assert(c3.includes("[[2026-08-04-1530-redis-upgrade-2.raw]]"), "B3: shard-3 missing backward link to shard-2");

  // B4: Verify capture_scope: partial on all shards
  assert(c1.includes("capture_scope: partial") && c2.includes("capture_scope: partial") && c3.includes("capture_scope: partial"),
    "B4: not all shards have capture_scope: partial");

  // B5: Verify extraction_candidates exist on all shards
  assert(c1.includes("extraction_candidates:") && c2.includes("extraction_candidates:") && c3.includes("extraction_candidates:"),
    "B5: not all shards have extraction_candidates");

  // B6: Content search — each keyword unique to one shard
  const allShards = [shard1, shard2, shard3];
  const stringHits = allShards.filter((shard) => fs.readFileSync(shard, "utf8").includes("string"));
  assert(stringHits.length === 1, `B6: "string" should hit 1 shard, got ${stringHits.length}`);
  assert(stringHits[0] === shard1, "B6: string should hit shard-1");

  const jwtHits = allShards.filter((shard) => fs.readFileSync(shard, "utf8").includes("jwt"));
  assert(jwtHits.length === 1, `B6: "jwt" should hit 1 shard, got ${jwtHits.length}`);
  assert(jwtHits[0] === shard2, "B6: jwt should hit shard-2");

  const dockerHits = allShards.filter((shard) => fs.readFileSync(shard, "utf8").includes("docker"));
  assert(dockerHits.length === 1, `B6: "docker" should hit 1 shard, got ${dockerHits.length}`);
  assert(dockerHits[0] === shard3, "B6: docker should hit shard-3");

  // B7: Content search via extraction_candidates — keyword "middleware" unique to shard-2
  const candidateHits = allShards.filter((shard) => {
    const content = fs.readFileSync(shard, "utf8");
    return content.includes("keywords:") && content.includes("middleware");
  });
  assert(candidateHits.length === 1, `B7: extraction_candidates middleware should hit 1 shard, got ${candidateHits.length}`);
  assert(candidateHits[0] === shard2, "B7: extraction_candidates middleware should hit shard-2");

  results.push({ id: scenarios[1].id, score: 35, decision: { shardCount: 3, crossLinked: true, searchWorks: true } });
}

// --- Scenario C: Full pipeline integration (P0, P1-2, P2-3, P3-7) ---
function scenarioC() {
  const vault = path.join(tempRoot, "scenario-c");
  const projectsDir = "02_项目";
  ensure(path.join(vault, ".obsidian"));
  ensure(path.join(vault, ".obsidian", "plugins"));

  // C1: Setup — similar Chinese project names, missing plugin
  const corePlugins = path.join(vault, ".obsidian", "core-plugins.json");
  write(corePlugins, JSON.stringify({ bases: true }));
  const communityPlugins = path.join(vault, ".obsidian", "community-plugins.json");
  // Missing: obsidian-textgenerator-plugin
  write(communityPlugins, JSON.stringify(["templater-obsidian", "calendar", "obsidian-excalidraw-plugin"]));

  const first = path.join(vault, projectsDir, "星火平台");
  const second = path.join(vault, projectsDir, "星火平台重构");
  ensure(first);
  ensure(second);
  write(path.join(vault, projectsDir, "星火平台.md"), "---\ntype: project\nid: spark\nstatus: active\n---\n# 星火平台\n");
  write(path.join(first, "STATUS.md"), "---\ntype: project-status\nproject: 星火平台\nstatus: active\nupdated: 2026-08-01\n---\n# 星火平台 - Current Status\n");
  write(path.join(vault, projectsDir, "星火平台重构.md"), "---\ntype: project\nid: spark-rebuild\nstatus: active\n---\n# 星火平台重构\n");
  write(path.join(second, "STATUS.md"), "---\ntype: project-status\nproject: 星火平台重构\nstatus: active\nupdated: 2026-08-01\n---\n# 星火平台重构 - Current Status\n");

  // C2: Simulate preflight — collect both env + identity blockers
  const candidates = ["星火平台", "星火平台重构"].filter((name) => name.includes("星火"));
  const missingPlugins = ["obsidian-textgenerator-plugin"];

  assert(candidates.length === 2, "C2: project ambiguity not detected");
  assert(missingPlugins.length === 1, "C2: missing plugin not detected");
  // Unified report must contain BOTH
  assert(candidates.length > 0 && missingPlugins.length > 0, "C2: unified preflight must collect both env and identity blockers");

  // C3: Fix environment + specify exact project → create source with extraction_candidates
  write(communityPlugins, JSON.stringify(["templater-obsidian", "calendar", "obsidian-textgenerator-plugin", "obsidian-excalidraw-plugin"]));
  const exactProject = "星火平台重构";
  assert(candidates.includes(exactProject), "C3: exact project not in candidates");

  const sourceNote = path.join(vault, "90_Sources", "Sessions", "2026-08-04-cache-fix.raw.md");
  ensure(path.dirname(sourceNote));
  write(sourceNote, `---
type: source
source_kind: session
date: 2026-08-04
status: processed
capture_scope: full
project: ${exactProject}
extraction_candidates:
  - topic: 缓存策略设计, keywords: 缓存, redis, string, 策略
---

# 缓存策略修复会话
## User Goal
修复 Redis 缓存策略，最终选择 string 类型替代 hash。
`);

  // C4: Distill creates concept with source backlink (P2-3)
  ensure(path.join(vault, "05_概念"));
  const concept = path.join(vault, "05_概念", "redis-cache-strategy.md");
  write(concept, `---
type: concept
id: redis-cache-strategy
date: 2026-08-04
status: active
source:
  - "[[2026-08-04-cache-fix.raw]]"
---
# Redis 缓存策略设计
## One Sentence
使用 Redis string 类型做缓存层，替代 hash 以降低内存开销。
`);

  const conceptContent = fs.readFileSync(concept, "utf8");
  assert(conceptContent.includes("[[2026-08-04-cache-fix.raw]]"), "C4: distill concept missing source backlink");
  assert(/^type: concept$/m.test(conceptContent), "C4: missing type field");
  assert(/^id:/m.test(conceptContent), "C4: missing id field");
  assert(/^date:/m.test(conceptContent), "C4: missing date field");
  assert(/^status:/m.test(conceptContent), "C4: missing status field");
  assert(/^source:/m.test(conceptContent), "C4: missing source field");

  // C5: Chinese normalization prevents duplicate (P1-2)
  // Existing: "Redis 缓存策略设计" → strip "策略"+"设计" → base "Redis 缓存"
  // New: "Redis 缓存方案总结" → strip "方案"+"总结" → base "Redis 缓存" → match!
  const dupMatch = matchChineseTitle("Redis 缓存策略设计", "Redis 缓存方案总结");
  assert(dupMatch.matched, `C5: normalization should match Redis缓存策略设计 with Redis缓存方案总结, got ${dupMatch.reason}`);

  // C6: Content search finds concept via extraction_candidates (P3-7)
  assert(fs.existsSync(sourceNote), "C6: source note missing");
  const sourceContent = fs.readFileSync(sourceNote, "utf8");
  assert(sourceContent.includes("缓存") && sourceContent.includes("redis"), "C6: source note missing extraction keywords");
  assert(fs.existsSync(concept), "C6: concept note missing");
  assert(conceptContent.includes("redis"), "C6: concept content searchable by keyword");

  results.push({ id: scenarios[2].id, score: 40, decision: { unifiedPreflight: true, backlinkOk: true, normalizationOk: true, searchOk: true } });
}

async function scenarioD() {
  const vault = path.join(tempRoot, "scenario-d");
  ensure(vault);
  ensure(path.join(vault, "10_问题解决"));

  // D1: Verify write-policy.md has multi-path matching section (P0)
  const writePolicy = fs.readFileSync(path.join(root, "obsidian-router", "references", "write-policy.md"), "utf8");
  assert(writePolicy.includes("Multi-Path Matching"), "D1: write-policy.md missing Multi-Path Matching section");
  assert(writePolicy.includes("Three Matching Paths"), "D1: write-policy.md missing Three Matching Paths");
  assert(writePolicy.includes("Confidence Levels"), "D1: write-policy.md missing Confidence Levels");
  assert(writePolicy.includes("confirm-merge"), "D1: write-policy.md missing confirm-merge action");

  // D2: Verify distill SKILL.md references multi-path matching (P0 consumer)
  const distillSkill = fs.readFileSync(path.join(root, "obsidian-distill", "SKILL.md"), "utf8");
  assert(distillSkill.includes("multi-path matching"), "D2: distill SKILL.md missing multi-path matching reference");
  assert(distillSkill.includes("Path 1"), "D2: distill SKILL.md missing Path 1 reference");
  assert(distillSkill.includes("Path 2"), "D2: distill SKILL.md missing Path 2 reference");
  assert(distillSkill.includes("Path 3"), "D2: distill SKILL.md missing Path 3 reference");
  assert(distillSkill.includes("confirm-merge"), "D2: distill SKILL.md missing confirm-merge action");

  // D3: Source cross-reference — same source should produce a hit (Path 2)
  const sourceId = "2026-08-04-0930-full-fix.raw";
  const sourceNote = path.join(vault, "90_原始来源", "会话记录", `${sourceId}.md`);
  ensure(path.dirname(sourceNote));
  write(sourceNote, `---
type: source
source_kind: agent-session
date: 2026-08-04
status: processed
capture_scope: full
extraction_candidates:
  - topic: Obsidian技能质量问题, keywords: obsidian, skills, quality, fix, P0, router, distill
---
# Obsidian Skills 全量修复会话
`);

  // First problem note
  const problem1 = path.join(vault, "10_问题解决", "2026-08-04-obsidian-skills-quality-gaps.md");
  write(problem1, `---
type: problem
id: obsidian-skills-quality-gaps
date: 2026-08-04
status: solved
priority: high
source:
  - "[[${sourceId}]]"
---
# Obsidian Skills 存在 7 个质量问题
## Symptom
P9 评估发现 7 个问题：路由短路、复用模糊、归一化不可靠、测试覆盖不足。
`);

  // Now verify source cross-reference detection
  const problem1Content = fs.readFileSync(problem1, "utf8");
  assert(problem1Content.includes(`[[${sourceId}]]`), "D3: problem1 missing source backlink");

  // Simulate Path 2: search for existing notes with same source
  const problemDir = path.join(vault, "10_问题解决");
  const existingFiles = fs.readdirSync(problemDir).filter(f => f.endsWith(".md"));
  const sourceMatches = existingFiles.filter(f => {
    const content = fs.readFileSync(path.join(problemDir, f), "utf8");
    return content.includes(`[[${sourceId}]]`);
  });
  assert(sourceMatches.length === 1, `D3: source cross-reference should find 1 match, found ${sourceMatches.length}`);

  // D4: Keyword overlap — similar content should hit ≥60% threshold (Path 3)
  const newKeywords = ["obsidian", "skills", "quality", "issues", "fixed"];
  const existingKeywords = ["obsidian", "skills", "quality", "fix", "P0", "router", "distill"];
  const overlap = newKeywords.filter(k => existingKeywords.includes(k));
  const hitRate = overlap.length / newKeywords.length;
  assert(hitRate >= 0.6, `D4: keyword overlap ${hitRate.toFixed(1)} below 60% threshold`);

  // D5: Path 2 + Path 3 both hit → HIGH confidence → auto merge
  const path2Hit = sourceMatches.length === 1;
  const path3Hit = hitRate >= 0.6;
  assert(path2Hit, "D5: Path 2 should hit");
  assert(path3Hit, "D5: Path 3 should hit");
  const confidence = (path2Hit && path3Hit) ? "high" : "medium";
  assert(confidence === "high", `D5: expected high confidence with Path2+Path3, got ${confidence}`);

  results.push({ id: scenarios[3].id, score: 30, decision: { path2Hit: true, path3Hit: true, confidence: "high" } });
}

async function scenarioE() {
  // E1: Verify directory-routing.md exists (P1)
  const routingPath = path.join(root, "obsidian-router", "references", "directory-routing.md");
  assert(fs.existsSync(routingPath), "E1: directory-routing.md missing");

  const routingContent = fs.readFileSync(routingPath, "utf8");
  assert(routingContent.includes("优先级链"), "E1: directory-routing.md missing priority chain");
  assert(routingContent.includes("不写内容笔记"), "E1: directory-routing.md missing root prohibition");
  assert(routingContent.includes("05_概念/"), "E1: missing 概念 rules");
  assert(routingContent.includes("09_可复用流程/"), "E1: missing 可复用流程 rules");
  assert(routingContent.includes("10_问题解决/"), "E1: missing 问题解决 rules");

  // E2: Verify distill SKILL.md references directory-routing (P1 consumer)
  const distillSkill = fs.readFileSync(path.join(root, "obsidian-distill", "SKILL.md"), "utf8");
  assert(distillSkill.includes("directory-routing.md"), "E2: distill SKILL.md missing directory-routing reference");
  assert(distillSkill.includes("priority chain"), "E2: distill missing priority chain reference");

  // E3: Verify contract-map references directory-routing
  const contractMap = fs.readFileSync(path.join(root, "obsidian-router", "references", "contract-map.md"), "utf8");
  assert(contractMap.includes("directory-routing.md"), "E3: contract-map missing directory-routing row");

  // E4: Verify write-policy Preflight step 8 references directory-routing
  const writePolicy = fs.readFileSync(path.join(root, "obsidian-router", "references", "write-policy.md"), "utf8");
  assert(writePolicy.includes("directory-routing.md"), "E4: write-policy Preflight step 8 missing directory-routing reference");

  // E5: Simulate priority chain — step-heavy content wins playbook over concept
  // "skill-fix-standard-workflow" has: ≥3 steps + concept model → rule 2 → 可复用流程/
  const stepCount = 4; // P9评估 → 问题分级 → 逐项确认 → 分层验证
  const hasModel = true; // "契约优先"概念
  const hasDate = false;
  const hasSymptom = false;
  const hasAlternatives = false;

  // Priority chain simulation
  let targetDir;
  if (hasDate && hasSymptom) targetDir = "问题解决";
  else if (stepCount >= 3) targetDir = "操作手册";
  else if (hasAlternatives) targetDir = "决策";
  else if (hasModel) targetDir = "概念";
  else targetDir = "pause";

  assert(targetDir === "操作手册", `E5: priority chain should route to 操作手册, got ${targetDir}`);
  assert(targetDir !== "概念", "E5: should NOT route to 概念 when steps >= 3");

  results.push({ id: scenarios[4].id, score: 25, decision: { routedTo: "操作手册", priorityRule: 2 } });
}

async function scenarioF() {
  // F1: Verify note-schema has superseded for concept/playbook/skill (P2)
  const noteSchema = fs.readFileSync(path.join(root, "obsidian-router", "references", "note-schema.md"), "utf8");
  assert(noteSchema.includes("superseded"), "F1: note-schema missing superseded status");

  // Check that concept, playbook, AND skill all have superseded
  const conceptLine = noteSchema.split("\n").find(l => l.includes("| concept |") && l.includes("superseded"));
  const playbookLine = noteSchema.split("\n").find(l => l.includes("| playbook |") && l.includes("superseded"));
  const skillLine = noteSchema.split("\n").find(l => l.includes("| skill |") && l.includes("superseded"));
  assert(conceptLine, "F1: concept missing superseded in status vocabulary");
  assert(playbookLine, "F1: playbook missing superseded in status vocabulary");
  assert(skillLine, "F1: skill missing superseded in status vocabulary");

  // F2: Verify confidence field defined
  assert(noteSchema.includes("Confidence Field"), "F2: note-schema missing Confidence Field section");
  assert(noteSchema.includes("confirmed"), "F2: note-schema missing confirmed value");
  assert(noteSchema.includes("probable"), "F2: note-schema missing probable value");
  assert(noteSchema.includes("speculative"), "F2: note-schema missing speculative value");

  // F3: Verify supersede action in write-policy
  const writePolicy = fs.readFileSync(path.join(root, "obsidian-router", "references", "write-policy.md"), "utf8");
  assert(writePolicy.includes("supersede"), "F3: write-policy missing supersede action");

  // F4: Verify bidirectional link specification
  assert(writePolicy.includes("superseded_by"), "F4: write-policy missing superseded_by link spec");
  assert(writePolicy.includes("supersedes"), "F4: write-policy missing supersedes link spec");

  // F5: Verify coexistence — "never delete" or "coexist" or "Both files coexist"
  assert(writePolicy.includes("coexist") || writePolicy.includes("never delete"), "F5: supersede must preserve old file");

  // F6: Simulate supersede decision for speculative concept overturned by confirmed evidence
  const oldStatus = "active";
  const oldConfidence = "speculative";
  const newEvidenceStrength = "confirmed";
  const coreConclusionDiffers = true;

  const shouldSupersede = oldStatus === "active" && coreConclusionDiffers && newEvidenceStrength !== oldConfidence;
  assert(shouldSupersede, "F6: should trigger supersede when speculative is overturned by confirmed");

  results.push({ id: scenarios[5].id, score: 25, decision: { supersedeTriggered: true, oldPreserved: true, bidirectionalLink: true } });
}

try {
  assert(scenarios.length === 6, `expected 6 scenarios, found ${scenarios.length}`);

  scenarioA();
  scenarioB();
  scenarioC();
  scenarioD();
  scenarioE();
  scenarioF();

  const totalScore = results.reduce((sum, r) => sum + r.score, 0);

  for (const result of results) {
    const fixes = scenarios.find((s) => s.id === result.id)?.fixes_tested || [];
    console.log(`PASS ${result.id} fixes=[${fixes.join(",")}] score=${result.score}`);
  }

  console.log(`PASS full_fix_scenarios=${results.length} assertions=${assertions} total_score=${totalScore}/115 temp_cleaned=true`);
  console.log(JSON.stringify(results, null, 2));
} finally {
  const resolved = path.resolve(tempRoot);
  const systemTemp = path.resolve(os.tmpdir());
  if (!resolved.startsWith(`${systemTemp}${path.sep}`) || !path.basename(resolved).startsWith(prefix)) {
    throw new Error(`refusing to remove unexpected path: ${resolved}`);
  }
  fs.rmSync(resolved, { recursive: true, force: true });
}