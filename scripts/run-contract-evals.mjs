import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cases = JSON.parse(fs.readFileSync(path.join(root, "evals", "cases.json"), "utf8"));
const errors = [];

const ids = new Set();
for (const item of cases) {
  if (!item.id || ids.has(item.id)) errors.push(`invalid or duplicate id: ${item.id}`);
  ids.add(item.id);
  if (!item.prompt) errors.push(`${item.id}: missing prompt`);
  if (!item.route) errors.push(`${item.id}: missing route`);
  if (!item.mode) errors.push(`${item.id}: missing mode`);
  if (item.route.startsWith("obsidian-") && !fs.existsSync(path.join(root, item.route))) {
    errors.push(`${item.id}: route does not exist: ${item.route}`);
  }
}

const contracts = {
  router: fs.readFileSync(path.join(root, "obsidian-router", "references", "trigger-map.md"), "utf8"),
  project: fs.readFileSync(path.join(root, "obsidian-project", "SKILL.md"), "utf8"),
  projectContract: fs.readFileSync(path.join(root, "obsidian-project", "references", "project-contract.md"), "utf8"),
  resume: fs.readFileSync(path.join(root, "obsidian-project", "references", "project-resume.md"), "utf8"),
  write: fs.readFileSync(path.join(root, "obsidian-router", "references", "write-policy.md"), "utf8"),
  index: fs.readFileSync(path.join(root, "obsidian-index", "references", "index-schemas.md"), "utf8"),
  noteSchema: fs.readFileSync(path.join(root, "obsidian-router", "references", "note-schema.md"), "utf8"),
  maintenance: fs.readFileSync(path.join(root, "obsidian-index", "references", "maintenance-record.md"), "utf8"),
  maintenanceTemplate: fs.readFileSync(path.join(root, "obsidian-index", "assets", "templates", "maintenance-record.md"), "utf8"),
  daily: fs.readFileSync(path.join(root, "obsidian-daily", "SKILL.md"), "utf8"),
  vault: fs.readFileSync(path.join(root, "obsidian-router", "references", "vault-contract.md"), "utf8"),
  environment: fs.readFileSync(path.join(root, "obsidian-router", "references", "environment-gate.md"), "utf8"),
  indexSkill: fs.readFileSync(path.join(root, "obsidian-index", "SKILL.md"), "utf8"),
  distill: fs.readFileSync(path.join(root, "obsidian-distill", "SKILL.md"), "utf8"),
  analyst: fs.readFileSync(path.join(root, "obsidian-analyst", "SKILL.md"), "utf8"),
  query: fs.readFileSync(path.join(root, "obsidian-query", "SKILL.md"), "utf8"),
  capture: fs.readFileSync(path.join(root, "obsidian-capture", "SKILL.md"), "utf8"),
  init: fs.readFileSync(path.join(root, "obsidian-router", "references", "init-dialog.md"), "utf8"),
  directoryRouting: fs.readFileSync(path.join(root, "obsidian-router", "references", "directory-routing.md"), "utf8"),
};

const assertions = [
  ["legacy query does not migrate", contracts.project, "Never auto-migrate legacy project notes"],
  ["initialize omits Topics", contracts.project, "do not create `TOPICS/` until"],
  ["initialize omits CITED", contracts.project, "Never create `CITED.md`"],
  ["progress max one event", contracts.project, "at most one structured event"],
  ["event fingerprint exists", contracts.write, "event fingerprint"],
  ["resume is read-only", contracts.resume, "read-only recovery operation"],
  ["resume reads STATUS first", contracts.resume, "1. `STATUS.md`"],
  ["Topic is not durable Concept", contracts.project, "Do not automatically create a durable Concept"],
  ["ordinary organization guard", contracts.router, "Do not select `obsidian-project`"],
  ["index supports legacy", contracts.index, "legacy entry"],
  ["index one identity", contracts.index, "one project identity"],
  ["maintenance schema exists", contracts.noteSchema, "| maintenance |"],
  ["maintenance gate exists", contracts.write, "Maintenance Record Gate"],
  ["maintenance record is required", contracts.maintenance, "not complete until"],
  ["chat cannot replace record", contracts.maintenance, "chat summary cannot replace"],
  ["maintenance index required", contracts.maintenance, "_index.md"],
  ["maintenance template is Chinese", contracts.maintenanceTemplate, "# 知识库维护记录"],
  ["maintenance template tracks moves", contracts.maintenanceTemplate, "路径变更"],
  ["daily layout is explicit", contracts.vault, "daily_layout"],
  ["date-directory daily is supported", contracts.daily, "date-directory"],
  ["daily legacy collision is searched", contracts.daily, "legacy candidates"],
  ["daily duplicate path is forbidden", contracts.daily, "Never create both"],
  ["daily index uses explicit link", contracts.index, "explicit path link"],
  ["stale config blocks writes", contracts.environment, "stale but syntactically valid config fails the gate"],
  ["index paths use config mapping", contracts.indexSkill, "{directories.system}/daily-index.md"],
  ["reuse test is quantifiable", contracts.distill, "Repeatable"],
  ["reuse test has threshold", contracts.distill, "at least 2"],
  ["chinese normalization is mechanical", contracts.write, "Chinese synonym"],
  ["chinese normalization has safety valve", contracts.write, "needs-review"],
  ["analyst output has analysis_mode", contracts.analyst, "analysis_mode:"],
  ["analyst output has owner_skill", contracts.analyst, "owner_skill:"],
  ["analyst output has confidence field", contracts.analyst, "confidence:"],
  ["analyst output has write_sequence", contracts.analyst, "write_sequence:"],
  ["query report lists exact date", contracts.query, "file links and exact dates"],
  ["query procedure forbids writes", contracts.query, "Do not write files"],
  ["capture has sharding rules", contracts.capture, "Sharding"],
  ["capture sharding names numbered suffix", contracts.capture, "numbered suffix"],
  ["capture requires extraction candidates", contracts.capture, "keyword-tagged"],
  ["query supports content search", contracts.query, "Content Search"],
  ["content search searches source notes", contracts.query, "directories.sessions"],
  ["init scans vault before mapping", contracts.init, "existing top-level directories"],
  ["env-gate reconciles directories", contracts.environment, "Directory reconciliation"],
  ["env-gate prohibits auto-create", contracts.environment, "not auto-create"],
  ["write-policy forbids silent dir creation", contracts.write, "do not create it silently"],
  ["write-policy has multi-path matching", contracts.write, "Multi-Path Matching"],
  ["write-policy has confidence levels", contracts.write, "Confidence Levels"],
  ["directory-routing exists", contracts.directoryRouting, "优先级链"],
  ["directory-routing forbids root", contracts.directoryRouting, "不写内容笔记"],
  ["note-schema has superseded for concept", contracts.noteSchema, "superseded"],
  ["note-schema has confidence field", contracts.noteSchema, "Confidence Field"],
  ["write-policy has supersede action", contracts.write, "supersede"]
];

for (const [name, content, token] of assertions) {
  if (!content.includes(token)) errors.push(`${name}: missing '${token}'`);
}

if (cases.length < 10) errors.push(`expected at least 10 cases, found ${cases.length}`);

if (errors.length) {
  console.error(`FAIL ${errors.length}`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`PASS cases=${cases.length} assertions=${assertions.length}`);
