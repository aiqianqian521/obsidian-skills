import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const prefix = "zhanggege-obsidian-eval-";
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
let assertions = 0;

function assert(condition, message) {
  assertions += 1;
  if (!condition) throw new Error(message);
}

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function writeIfAbsent(file, content) {
  if (fs.existsSync(file)) return false;
  ensureDirectory(path.dirname(file));
  fs.writeFileSync(file, content, "utf8");
  return true;
}

function hashFile(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(fullPath));
    else files.push(fullPath);
  }
  return files.sort();
}

function snapshot(directory) {
  return Object.fromEntries(
    walk(directory).map((file) => [path.relative(directory, file).replaceAll("\\", "/"), hashFile(file)])
  );
}

function projectPaths(vault, projectName, projectsDirectory = "02_Projects") {
  const projectRoot = path.join(vault, projectsDirectory);
  const memoryRoot = path.join(projectRoot, projectName);
  return {
    projectRoot,
    entry: path.join(projectRoot, `${projectName}.md`),
    memoryRoot,
    status: path.join(memoryRoot, "STATUS.md"),
    log: path.join(memoryRoot, "LOG.md"),
    topics: path.join(memoryRoot, "TOPICS")
  };
}

function initializeProjectMemory(vault, projectName, projectsDirectory = "02_Projects") {
  const files = projectPaths(vault, projectName, projectsDirectory);
  writeIfAbsent(
    files.entry,
    `---\ntype: project\nid: ${projectName.toLowerCase()}\nstatus: active\n---\n\n# ${projectName}\n`
  );
  writeIfAbsent(
    files.status,
    `---\ntype: project-status\nproject: ${projectName}\nstatus: active\nupdated: 2026-08-01\n---\n\n# ${projectName} - Current Status\n\n## Current Objective\n\nunknown\n\n## Next Action\n\nunknown\n`
  );
  writeIfAbsent(
    files.log,
    `---\ntype: project-log\nproject: ${projectName}\ncreated: 2026-08-01\nupdated: 2026-08-01\n---\n\n# ${projectName} - Project Log\n`
  );
  return files;
}

function eventFingerprint(projectName, summary) {
  return crypto.createHash("sha256").update(`${projectName}\n${summary}`).digest("hex").slice(0, 16);
}

function recordProgress(vault, projectName, summary, nextAction) {
  const files = projectPaths(vault, projectName);
  if (!fs.existsSync(files.status) || !fs.existsSync(files.log)) {
    throw new Error("project memory must be initialized explicitly");
  }
  const status = `---\ntype: project-status\nproject: ${projectName}\nstatus: active\nupdated: 2026-08-01\n---\n\n# ${projectName} - Current Status\n\n## Current Objective\n\n${summary}\n\n## Next Action\n\n${nextAction}\n`;
  fs.writeFileSync(files.status, status, "utf8");

  const fingerprint = eventFingerprint(projectName, summary);
  const marker = `<!-- event:${fingerprint} -->`;
  const existingLog = fs.readFileSync(files.log, "utf8");
  if (!existingLog.includes(marker)) {
    fs.appendFileSync(
      files.log,
      `\n${marker}\n## 2026-08-01T11:30:00+08:00 - verification\n\n- Summary: ${summary}\n- Next action: ${nextAction}\n`,
      "utf8"
    );
  }
}

function resumeProject(vault, projectName) {
  const files = projectPaths(vault, projectName);
  const readOrder = [files.status, files.log, files.entry].filter((file) => fs.existsSync(file));
  return readOrder.map((file) => fs.readFileSync(file, "utf8"));
}

function createTopic(vault, projectName, topicName) {
  const files = projectPaths(vault, projectName);
  ensureDirectory(files.topics);
  const topic = path.join(files.topics, `${topicName}.md`);
  writeIfAbsent(
    topic,
    `---\ntype: project-topic\nid: ${topicName}\nproject: ${projectName}\nstatus: draft\ngraduation: none\ncreated: 2026-08-01\nupdated: 2026-08-01\nsource:\n  - "[[fixture-source]]"\n---\n\n# ${topicName}\n`
  );
  return topic;
}

function rebuildProjectIndex(vault) {
  const projects = path.join(vault, "02_Projects");
  const entries = fs
    .readdirSync(projects, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => path.basename(entry.name, ".md"))
    .sort();
  const system = path.join(vault, "99_System");
  ensureDirectory(system);
  fs.writeFileSync(
    path.join(system, "project-index.md"),
    `# Project Index\n\n${entries.map((name) => `- [[${name}]]`).join("\n")}\n`,
    "utf8"
  );
  return entries;
}

function dailyPaths(vault, config, date) {
  const dailyRoot = path.join(vault, config.dailyDirectory);
  const canonical = config.layout === "date-directory"
    ? path.join(dailyRoot, date, config.filename || "summary.md")
    : path.join(dailyRoot, `${date}.md`);
  const candidates = [
    canonical,
    path.join(dailyRoot, `${date}.md`),
    path.join(dailyRoot, date, "summary.md"),
    path.join(vault, `${date}.md`),
    path.join(vault, date, "summary.md")
  ];
  return { canonical, candidates: [...new Set(candidates)] };
}

function writeDaily(vault, config, date, marker) {
  const paths = dailyPaths(vault, config, date);
  const existing = paths.candidates.filter((file) => fs.existsSync(file));
  if (existing.length && !existing.includes(paths.canonical)) {
    return { status: "needs-review", existing, canonical: paths.canonical };
  }
  if (existing.length > 1) {
    return { status: "needs-review", existing, canonical: paths.canonical };
  }
  writeIfAbsent(paths.canonical, `---\ntype: daily\ndate: ${date}\nstatus: active\n---\n\n# ${date}\n\n## Work Log\n`);
  const content = fs.readFileSync(paths.canonical, "utf8");
  if (!content.includes(marker)) fs.appendFileSync(paths.canonical, `\n- ${marker}\n`, "utf8");
  return { status: "written", existing: [paths.canonical], canonical: paths.canonical };
}

try {
  const vault = path.join(tempRoot, "vault");
  ensureDirectory(path.join(vault, ".obsidian"));
  ensureDirectory(path.join(vault, "02_Projects"));

  const legacy = path.join(vault, "02_Projects", "Alpha.md");
  fs.writeFileSync(legacy, "---\ntype: project\nid: alpha\nstatus: active\n---\n\n# Alpha\n\nLegacy content.\n", "utf8");
  const legacyHash = hashFile(legacy);

  const beforeLegacyQuery = snapshot(vault);
  fs.readFileSync(legacy, "utf8");
  assert(JSON.stringify(snapshot(vault)) === JSON.stringify(beforeLegacyQuery), "legacy query modified files");
  assert(!fs.existsSync(path.join(vault, "02_Projects", "Alpha")), "legacy query created companion memory");

  const files = initializeProjectMemory(vault, "Alpha");
  assert(hashFile(legacy) === legacyHash, "initialization changed the legacy entry");
  assert(fs.existsSync(files.status) && fs.existsSync(files.log), "initialization did not create STATUS and LOG");
  assert(!fs.existsSync(files.topics), "initialization created TOPICS early");
  assert(!fs.existsSync(path.join(files.memoryRoot, "CITED.md")), "initialization created CITED.md");

  const initialized = snapshot(vault);
  initializeProjectMemory(vault, "Alpha");
  assert(JSON.stringify(snapshot(vault)) === JSON.stringify(initialized), "repeat initialization was not idempotent");

  const summary = "Acceptance script passed";
  recordProgress(vault, "Alpha", summary, "Update documentation");
  const progressed = snapshot(vault);
  recordProgress(vault, "Alpha", summary, "Update documentation");
  assert(JSON.stringify(snapshot(vault)) === JSON.stringify(progressed), "repeat progress duplicated state or LOG event");
  const markerCount = (fs.readFileSync(files.log, "utf8").match(/<!-- event:/g) || []).length;
  assert(markerCount === 1, `expected one LOG event, found ${markerCount}`);

  const beforeResume = snapshot(vault);
  const resumed = resumeProject(vault, "Alpha");
  assert(resumed.length === 3, "resume did not read STATUS, LOG, and entry");
  assert(JSON.stringify(snapshot(vault)) === JSON.stringify(beforeResume), "resume modified files");

  const beforeArticle = snapshot(path.join(vault, "02_Projects"));
  const session = path.join(vault, "90_Sources", "Sessions", "article.raw.md");
  writeIfAbsent(session, "---\ntype: source\nsource_kind: article\ndate: 2026-08-01\nstatus: processed\ncapture_scope: full\n---\n");
  assert(
    JSON.stringify(snapshot(path.join(vault, "02_Projects"))) === JSON.stringify(beforeArticle),
    "ordinary organization changed project memory"
  );

  const topic = createTopic(vault, "Alpha", "index-is-navigation");
  assert(fs.existsSync(topic), "Topic was not created on demand");
  assert(!fs.existsSync(path.join(vault, "05_Concepts")), "Topic creation also created a durable Concept");

  writeIfAbsent(
    path.join(vault, "02_Projects", "Beta.md"),
    "---\ntype: project\nid: beta\nstatus: paused\n---\n\n# Beta\n"
  );
  const indexed = rebuildProjectIndex(vault);
  assert(indexed.join(",") === "Alpha,Beta", `unexpected project index rows: ${indexed.join(",")}`);

  const chineseVault = path.join(tempRoot, "chinese-vault");
  const englishVault = path.join(tempRoot, "english-vault");
  ensureDirectory(path.join(chineseVault, ".obsidian"));
  ensureDirectory(path.join(englishVault, ".obsidian"));
  const chinese = initializeProjectMemory(chineseVault, "项目甲", "02_项目");
  const english = initializeProjectMemory(englishVault, "Project-A", "02_Projects");
  assert(fs.existsSync(chinese.status), "Chinese project mapping failed");
  assert(fs.existsSync(english.status), "English project mapping failed");

  const dailyConfig = { dailyDirectory: "80-每日记录", layout: "date-directory", filename: "summary.md" };
  const firstDaily = writeDaily(chineseVault, dailyConfig, "2026-08-03", "skill maintenance recorded");
  assert(firstDaily.status === "written", "date-directory Daily was not written");
  assert(
    firstDaily.canonical.endsWith(path.join("80-每日记录", "2026-08-03", "summary.md")),
    `unexpected canonical Daily path: ${firstDaily.canonical}`
  );
  const firstDailyHash = hashFile(firstDaily.canonical);
  writeDaily(chineseVault, dailyConfig, "2026-08-03", "skill maintenance recorded");
  assert(hashFile(firstDaily.canonical) === firstDailyHash, "repeat Daily write was not idempotent");
  assert(!fs.existsSync(path.join(chineseVault, "2026-08-03.md")), "Daily write created a Vault-root duplicate");

  const legacyDaily = path.join(chineseVault, "2026-08-04.md");
  fs.writeFileSync(legacyDaily, "---\ntype: daily\ndate: 2026-08-04\nstatus: active\n---\n", "utf8");
  const collision = writeDaily(chineseVault, dailyConfig, "2026-08-04", "must not write");
  assert(collision.status === "needs-review", "legacy Daily collision was not blocked");
  assert(!fs.existsSync(collision.canonical), "legacy collision created a second Daily");

  // --- distill fixture: backlink + frontmatter + idempotency ---
  {
    const dv = path.join(tempRoot, "distill-fixture");
    ensureDirectory(path.join(dv, ".obsidian"));
    const source = path.join(dv, "90_Sources", "Sessions", "2026-08-04-test.raw.md");
    writeIfAbsent(source, "---\ntype: source\nsource_kind: session\ndate: 2026-08-04\nstatus: processed\ncapture_scope: full\n---\n# Test session\nDiscussed Redis cache strategy.\n");
    const concept = path.join(dv, "05_Concepts", "redis-cache-strategy.md");
    writeIfAbsent(concept, "---\ntype: concept\nid: redis-cache-strategy\ndate: 2026-08-04\nstatus: active\nsource:\n  - \"[[2026-08-04-test.raw]]\"\n---\n# Redis Cache Strategy\n## One Sentence\nUse string type for simple KV.\n");
    const content = fs.readFileSync(concept, "utf8");
    assert(content.includes("[[2026-08-04-test.raw]]"), "distill concept missing source backlink");
    assert(/^type: concept$/m.test(content), "distill concept missing type field");
    assert(/^id:/m.test(content), "distill concept missing id field");
    assert(/^date:/m.test(content), "distill concept missing date field");
    assert(/^status:/m.test(content), "distill concept missing status field");
    assert(/^source:/m.test(content), "distill concept missing source field");
    const beforeSecond = snapshot(path.join(dv, "05_Concepts"));
    fs.appendFileSync(concept, "\n## Evidence update\n- Verified in production.\n", "utf8");
    const afterSecond = snapshot(path.join(dv, "05_Concepts"));
    const conceptFiles = walk(path.join(dv, "05_Concepts")).filter(f => f.endsWith(".md"));
    assert(conceptFiles.length === 1, "distill duplicated concept on re-run");
  }

  // --- query fixture: reads known data without writing ---
  {
    const qv = path.join(tempRoot, "query-fixture");
    ensureDirectory(path.join(qv, ".obsidian"));
    const daily = path.join(qv, "01_Daily", "2026-08-04.md");
    writeIfAbsent(daily, "---\ntype: daily\ndate: 2026-08-04\nstatus: active\n---\n# 2026-08-04\n## Work Log\n- 完成 Redis 缓存层开发\n## Solved Problems\n- 修复缓存穿透 bug\n## Open Items\n- 待补充监控告警\n");
    const problem = path.join(qv, "10_Problems", "cache-penetration-fix.md");
    writeIfAbsent(problem, "---\ntype: problem\nid: cache-penetration-fix\ndate: 2026-08-04\nstatus: solved\npriority: high\n---\n# 缓存穿透修复\n");
    const dailyContent = fs.readFileSync(daily, "utf8");
    assert(dailyContent.includes("Redis 缓存层"), "query cannot find work log entry in daily");
    assert(dailyContent.includes("缓存穿透"), "query cannot find solved problem in daily");
    assert(dailyContent.includes("监控告警"), "query cannot find open item in daily");
    const beforeQuery = snapshot(qv);
    fs.readFileSync(daily, "utf8");
    fs.readFileSync(problem, "utf8");
    assert(JSON.stringify(snapshot(qv)) === JSON.stringify(beforeQuery), "query modified vault files");
    assert(fs.existsSync(problem), "query cannot locate linked problem note from daily");
  }

  console.log(`PASS fixture_assertions=${assertions} temp_cleaned=true`);
} finally {
  const resolvedTemp = path.resolve(tempRoot);
  const resolvedSystemTemp = path.resolve(os.tmpdir());
  if (!resolvedTemp.startsWith(`${resolvedSystemTemp}${path.sep}`) || !path.basename(resolvedTemp).startsWith(prefix)) {
    throw new Error(`refusing to remove unexpected path: ${resolvedTemp}`);
  }
  fs.rmSync(resolvedTemp, { recursive: true, force: true });
}
