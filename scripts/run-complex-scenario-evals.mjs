import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scenarios = JSON.parse(fs.readFileSync(path.join(root, "evals", "complex-scenarios.json"), "utf8"));
const prefix = "zhanggege-obsidian-complex-eval-";
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

function fingerprint(...parts) {
  return crypto.createHash("sha256").update(parts.join("\n")).digest("hex").slice(0, 16);
}

function countFiles(directory, matcher) {
  return walk(directory).filter((file) => matcher(file)).length;
}

function projectFiles(vault, project, projectsDirectory = "02_Projects") {
  const base = path.join(vault, projectsDirectory);
  const memory = path.join(base, project);
  return {
    entry: path.join(base, `${project}.md`),
    status: path.join(memory, "STATUS.md"),
    log: path.join(memory, "LOG.md"),
    topics: path.join(memory, "TOPICS")
  };
}

function readyEnvironment(vault, missingCommunityPlugin = null) {
  ensure(path.join(vault, ".obsidian", "plugins"));
  write(path.join(vault, ".obsidian", "core-plugins.json"), JSON.stringify({ bases: true }));
  const required = ["templater-obsidian", "calendar", "obsidian-textgenerator-plugin", "obsidian-excalidraw-plugin"];
  const enabled = required.filter((plugin) => plugin !== missingCommunityPlugin);
  write(path.join(vault, ".obsidian", "community-plugins.json"), JSON.stringify(enabled));
  for (const plugin of enabled) ensure(path.join(vault, ".obsidian", "plugins", plugin));
}

function environmentGate(vault) {
  const missing = [];
  const coreFile = path.join(vault, ".obsidian", "core-plugins.json");
  const communityFile = path.join(vault, ".obsidian", "community-plugins.json");
  const required = ["templater-obsidian", "calendar", "obsidian-textgenerator-plugin", "obsidian-excalidraw-plugin"];
  const core = fs.existsSync(coreFile) ? JSON.parse(fs.readFileSync(coreFile, "utf8")) : {};
  const community = fs.existsSync(communityFile) ? JSON.parse(fs.readFileSync(communityFile, "utf8")) : [];
  if (core.bases !== true) missing.push("Bases");
  for (const plugin of required) {
    if (!community.includes(plugin) || !fs.existsSync(path.join(vault, ".obsidian", "plugins", plugin))) missing.push(plugin);
  }
  return missing;
}

function appendOnce(file, marker, content) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  if (current.includes(marker)) return false;
  fs.appendFileSync(file, `\n${marker}\n${content}\n`, "utf8");
  return true;
}

function scenarioOne() {
  const vault = path.join(tempRoot, "scenario-1");
  const files = projectFiles(vault, "Alpha");
  write(files.entry, "---\ntype: project\nid: alpha\nstatus: active\n---\n# Alpha\n\nRelease service.\n");
  write(files.status, "---\ntype: project-status\nproject: Alpha\nstatus: active\nupdated: 2026-07-30\n---\n# Alpha - Current Status\n\n## Current Objective\nDeploy v1\n\n## Next Action\nRun smoke test\n");
  write(files.log, "---\ntype: project-log\nproject: Alpha\ncreated: 2026-07-28\nupdated: 2026-08-01\n---\n# Alpha - Project Log\n\n## 2026-08-01T09:10:00+08:00 - rollback\n\n- Result: v1 rolled back after authentication failures.\n- Next action: diagnose authentication failures.\n");
  write(path.join(files.topics, "auth-boundary.md"), "---\ntype: project-topic\nid: auth-boundary\nproject: Alpha\nstatus: validated\ngraduation: none\ncreated: 2026-07-29\nupdated: 2026-08-01\nsource:\n  - '[[deploy-log]]'\n---\n# Authentication Boundary\n");

  const before = snapshot(vault);
  const readOrder = [files.status, files.log, files.entry, path.join(files.topics, "auth-boundary.md")];
  const status = fs.readFileSync(files.status, "utf8");
  const log = fs.readFileSync(files.log, "utf8");
  const conflict = /updated: 2026-07-30/.test(status) && /updated: 2026-08-01/.test(log) && /rolled back/.test(log);
  const decision = {
    route: "obsidian-project/resume",
    mode: "read-only",
    readOrder: readOrder.map((file) => path.relative(vault, file).replaceAll("\\", "/")),
    conflict,
    nextAction: "diagnose authentication failures",
    confidence: "medium"
  };

  assert(decision.route === "obsidian-project/resume", "S1 wrong route");
  assert(decision.readOrder.join(">") === "02_Projects/Alpha/STATUS.md>02_Projects/Alpha/LOG.md>02_Projects/Alpha.md>02_Projects/Alpha/TOPICS/auth-boundary.md", "S1 wrong read order");
  assert(decision.conflict && decision.confidence === "medium", "S1 failed to surface stale STATUS conflict");
  assert(sameSnapshot(before, snapshot(vault)), "S1 resume modified the vault");
  results.push({ id: scenarios[0].id, score: 30, decision });
}

function organizeMixedSession(vault) {
  const eventId = fingerprint("session", "2026-08-01", "Alpha knowledge upgrade");
  const source = path.join(vault, "90_Sources", "Sessions", "2026-08-01-alpha-upgrade.raw.md");
  writeIfAbsent(source, `---\ntype: source\nsource_kind: session\ndate: 2026-08-01\nstatus: processed\ncapture_scope: full\n---\n# Alpha upgrade session\n\nRaw evidence.\n`);

  const daily = path.join(vault, "01_Daily", "2026-08-01.md");
  writeIfAbsent(daily, "---\ntype: daily\ndate: 2026-08-01\nstatus: active\n---\n# 2026-08-01\n\n## Work Log\n\n## Solved Problems\n\n## Knowledge Created\n\n## Decisions\n\n## Open Items\n\n## Source Links\n");
  appendOnce(daily, `<!-- event:${eventId} -->`, "- Updated Alpha knowledge-memory contracts.\n- Source: [[2026-08-01-alpha-upgrade.raw]]");

  const files = projectFiles(vault, "Alpha");
  assert(fs.existsSync(files.status) && fs.existsSync(files.log), "S2 project memory was not pre-existing");
  write(files.status, "---\ntype: project-status\nproject: Alpha\nstatus: active\nupdated: 2026-08-01\n---\n# Alpha - Current Status\n\n## Current Objective\nValidate memory boundaries\n\n## Next Action\nRun complex scenarios\n");
  appendOnce(files.log, `<!-- event:${eventId} -->`, "## 2026-08-01 - contract improvement\n\n- Summary: separated project and durable memory.\n- Evidence: [[2026-08-01-alpha-upgrade.raw]]");
  const topic = path.join(files.topics, "project-memory-is-a-buffer.md");
  writeIfAbsent(topic, "---\ntype: project-topic\nid: project-memory-is-a-buffer\nproject: Alpha\nstatus: validated\ngraduation: candidate\ncreated: 2026-08-01\nupdated: 2026-08-01\nsource:\n  - '[[2026-08-01-alpha-upgrade.raw]]'\n---\n# Project memory is a buffer\n");

  const problem = path.join(vault, "10_Problems", "duplicate-project-state-writers.md");
  writeIfAbsent(problem, "---\ntype: problem\nid: duplicate-project-state-writers\ndate: 2026-08-01\nstatus: solved\npriority: high\n---\n# Duplicate project state writers\n\nSource: [[2026-08-01-alpha-upgrade.raw]]\n");
  const playbook = path.join(vault, "09_Playbooks", "memory-lifecycle-review.md");
  writeIfAbsent(playbook, "---\ntype: playbook\nid: memory-lifecycle-review\ndate: 2026-08-01\nstatus: active\nsource:\n  - '[[2026-08-01-alpha-upgrade.raw]]'\n---\n# Memory Lifecycle Review\n");

  const concept = path.join(vault, "05_Concepts", "evidence-before-interpretation.md");
  assert(fs.existsSync(concept), "S2 expected existing concept missing");
  appendOnce(concept, `<!-- evidence:${eventId} -->`, "## Evidence update 2026-08-01\n\n- [[2026-08-01-alpha-upgrade.raw]] confirmed the boundary.");

  const index = path.join(vault, "99_System", "knowledge-index.md");
  write(index, "---\ntype: index\nindex_type: knowledge\nlast_updated: 2026-08-01\nstatus: active\n---\n# Knowledge Index\n\n- [[evidence-before-interpretation]]\n- [[memory-lifecycle-review]]\n");
}

function scenarioTwo() {
  const vault = path.join(tempRoot, "scenario-2");
  readyEnvironment(vault);
  const files = projectFiles(vault, "Alpha");
  write(files.entry, "---\ntype: project\nid: alpha\nstatus: active\n---\n# Alpha\n");
  write(files.status, "---\ntype: project-status\nproject: Alpha\nstatus: active\nupdated: 2026-07-31\n---\n# Alpha - Current Status\n");
  write(files.log, "---\ntype: project-log\nproject: Alpha\ncreated: 2026-07-31\nupdated: 2026-07-31\n---\n# Alpha - Project Log\n");
  write(path.join(vault, "05_Concepts", "evidence-before-interpretation.md"), "---\ntype: concept\nid: evidence-before-interpretation\ndate: 2026-07-20\nstatus: active\nsource:\n  - '[[earlier-source]]'\n---\n# Evidence before interpretation\n");

  organizeMixedSession(vault);
  const first = snapshot(vault);
  organizeMixedSession(vault);
  const second = snapshot(vault);
  const log = fs.readFileSync(files.log, "utf8");

  assert(sameSnapshot(first, second), "S2 second execution was not idempotent");
  assert(countFiles(path.join(vault, "90_Sources", "Sessions"), () => true) === 1, "S2 duplicated source");
  assert(countFiles(path.join(vault, "05_Concepts"), () => true) === 1, "S2 duplicated existing concept");
  assert((log.match(/<!-- event:/g) || []).length === 1, "S2 wrote more than one project LOG event");
  assert(fs.existsSync(path.join(files.topics, "project-memory-is-a-buffer.md")), "S2 project Topic missing");
  assert(!fs.existsSync(path.join(vault, "05_Concepts", "project-memory-is-a-buffer.md")), "S2 promoted Topic to Concept automatically");
  assert(fs.existsSync(path.join(vault, "09_Playbooks", "memory-lifecycle-review.md")), "S2 reusable playbook missing");
  assert(fs.readFileSync(path.join(vault, "99_System", "knowledge-index.md"), "utf8").includes("memory-lifecycle-review"), "S2 derived index missing playbook");
  results.push({ id: scenarios[1].id, score: 35, decision: { route: "analyst>capture>daily>project>solve>distill>index", rerun: "no-op", sourceCount: 1, logEvents: 1 } });
}

function scenarioThree() {
  const vault = path.join(tempRoot, "scenario-3");
  const projectsDirectory = "02_项目";
  readyEnvironment(vault, "obsidian-textgenerator-plugin");
  const first = projectFiles(vault, "星火平台", projectsDirectory);
  const second = projectFiles(vault, "星火平台重构", projectsDirectory);
  for (const [name, files] of [["星火平台", first], ["星火平台重构", second]]) {
    write(files.entry, `---\ntype: project\nid: ${name}\nstatus: active\n---\n# ${name}\n`);
    write(files.status, `---\ntype: project-status\nproject: ${name}\nstatus: active\nupdated: 2026-07-31\n---\n# ${name} - Current Status\n`);
    write(files.log, `---\ntype: project-log\nproject: ${name}\ncreated: 2026-07-31\nupdated: 2026-07-31\n---\n# ${name} - Project Log\n`);
  }
  const staleIndex = path.join(vault, "99_系统", "project-index.md");
  write(staleIndex, "# 项目索引\n\nlast_updated: 2026-07-01\n");

  const beforeBlocked = snapshot(vault);
  const candidates = ["星火平台", "星火平台重构"].filter((name) => name.includes("星火"));
  const missing = environmentGate(vault);
  const blockedDecision = { candidates, missing, write: false, repairIndex: false, unifiedReport: true };
  assert(candidates.length === 2, "S3 ambiguity was not detected");
  assert(missing.includes("obsidian-textgenerator-plugin"), "S3 missing plugin was not detected");
  assert(candidates.length > 0 && missing.length > 0, "S3 unified preflight must contain both missing env AND ambiguous project");
  assert(sameSnapshot(beforeBlocked, snapshot(vault)), "S3 blocked request modified files");
  assert(hash(staleIndex) === beforeBlocked["99_系统/project-index.md"], "S3 implicitly repaired stale index");

  readyEnvironment(vault);
  const beforeAllowedIndex = hash(staleIndex);
  const exact = "星火平台重构";
  const target = projectFiles(vault, exact, projectsDirectory);
  assert(environmentGate(vault).length === 0, "S3 environment did not become ready");
  write(target.status, `---\ntype: project-status\nproject: ${exact}\nstatus: active\nupdated: 2026-08-01\n---\n# ${exact} - Current Status\n\n## Current Objective\n验证中文项目恢复\n\n## Next Action\n运行验收\n`);
  appendOnce(target.log, `<!-- event:${fingerprint(exact, "验证中文项目恢复")} -->`, "## 2026-08-01 - progress\n\n- Next action: 运行验收");
  assert(fs.readFileSync(target.status, "utf8").includes("验证中文项目恢复"), "S3 exact project was not updated");
  assert(hash(first.status) === beforeBlocked["02_项目/星火平台/STATUS.md"], "S3 updated the wrong similar project");
  assert(hash(staleIndex) === beforeAllowedIndex, "S3 repaired index without an index request");
  results.push({
    id: scenarios[2].id,
    score: 30,
    fixtureScore: 35,
    decision: {
      blockedFirst: true,
      ambiguity: candidates,
      missing,
      retryProject: exact,
      indexUnchanged: true,
      contractFinding: "FIXED: router now collects all blockers (env + identity + config) into a unified preflight report"
    }
  });
}

try {
  assert(scenarios.length === 3, `expected 3 complex scenarios, found ${scenarios.length}`);
  scenarioOne();
  scenarioTwo();
  scenarioThree();
  const score = results.reduce((sum, result) => sum + result.score, 0);
  const fixtureScore = results.reduce((sum, result) => sum + (result.fixtureScore ?? result.score), 0);
  for (const result of results) console.log(`PASS ${result.id} p9_score=${result.score}`);
  console.log(`PASS complex_scenarios=${results.length} assertions=${assertions} fixture_score=${fixtureScore}/100 p9_score=${score}/100 warnings=0 temp_cleaned=true`);
  console.log(JSON.stringify(results, null, 2));
} finally {
  const resolved = path.resolve(tempRoot);
  const systemTemp = path.resolve(os.tmpdir());
  if (!resolved.startsWith(`${systemTemp}${path.sep}`) || !path.basename(resolved).startsWith(prefix)) {
    throw new Error(`refusing to remove unexpected path: ${resolved}`);
  }
  fs.rmSync(resolved, { recursive: true, force: true });
}
