import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const warnings = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function walk(directory) {
  const result = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === "vendor" || entry.name === "required-skills") continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...walk(fullPath));
    else result.push(fullPath);
  }
  return result;
}

function fail(message) {
  errors.push(message);
}

const skillNames = fs
  .readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && /^obsidian-[a-z-]+$/.test(entry.name))
  .map((entry) => entry.name)
  .sort();

if (skillNames.length !== 13) fail(`expected 13 main skills, found ${skillNames.length}`);

for (const skillName of skillNames) {
  const skillPath = path.join(root, skillName, "SKILL.md");
  const agentPath = path.join(root, skillName, "agents", "openai.yaml");
  if (!fs.existsSync(skillPath)) {
    fail(`${skillName}: missing SKILL.md`);
    continue;
  }
  if (!fs.existsSync(agentPath)) fail(`${skillName}: missing agents/openai.yaml`);

  const content = fs.readFileSync(skillPath, "utf8");
  const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatter) {
    fail(`${skillName}: invalid frontmatter`);
    continue;
  }
  const declaredName = frontmatter[1].match(/^name:\s*(.+)$/m)?.[1]?.trim();
  const description = frontmatter[1].match(/^description:\s*(.+)$/m)?.[1]?.trim();
  if (declaredName !== skillName) fail(`${skillName}: frontmatter name is ${declaredName}`);
  if (!description) fail(`${skillName}: description is empty`);

  const procedure = content.match(/## Procedure\r?\n([\s\S]*?)(?=\r?\n## |$)/)?.[1];
  if (procedure) {
    const steps = [...procedure.matchAll(/^(\d+)\. /gm)].map((match) => Number(match[1]));
    if (steps.length > 1) {
      const expected = steps.map((_, index) => index + 1);
      if (steps.join(",") !== expected.join(",")) {
        fail(`${skillName}: Procedure numbering is ${steps.join(",")}`);
      }
    }
  }

  if (fs.existsSync(agentPath)) {
    const agentYaml = fs.readFileSync(agentPath, "utf8");
    if (!agentYaml.includes(`$${skillName}`)) {
      warnings.push(`${skillName}: default_prompt does not mention $${skillName}`);
    }
  }
}

for (const installer of ["install.ps1", "install.sh"]) {
  const content = read(installer);
  for (const skillName of skillNames) {
    if (!content.includes(`"${skillName}"`)) fail(`${installer}: missing ${skillName}`);
  }
}

const readmeLines = read("README.md").split(/\r?\n/).length;
if (readmeLines < 200 || readmeLines > 450) {
  fail(`README.md: ${readmeLines} lines, expected 200-450`);
}

const markdownFiles = walk(root).filter((file) => file.endsWith(".md"));
for (const file of markdownFiles) {
    const content = fs.readFileSync(file, "utf8");
  const linkContent = content.replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "");
  for (const match of linkContent.matchAll(/\[[^\]]+\]\(([^)#]+)(?:#[^)]+)?\)/g)) {
    const target = match[1];
    if (/^(https?:|mailto:)/.test(target)) continue;
    const resolved = path.resolve(path.dirname(file), target);
    if (!fs.existsSync(resolved)) {
      fail(`${path.relative(root, file)}: broken link ${target}`);
    }
  }
}

const schemaContent = read("obsidian-router/references/note-schema.md");
const schema = new Map();
for (const line of schemaContent.split(/\r?\n/)) {
  if (!line.startsWith("| ") || line.startsWith("| ---") || line.includes("| Type |")) continue;
  const columns = line.split("|").slice(1, -1).map((column) => column.trim());
  if (columns.length !== 4) continue;
  const type = columns[0];
  const fields = [...columns[1].matchAll(/`([^`]+)`/g)].map((match) => match[1]);
  if (type && fields.length) schema.set(type, fields);
}

for (const skillName of skillNames) {
  const templateDirectory = path.join(root, skillName, "assets", "templates");
  if (!fs.existsSync(templateDirectory)) continue;
  for (const file of walk(templateDirectory).filter((item) => item.endsWith(".md"))) {
    const content = fs.readFileSync(file, "utf8");
    const type = content.match(/^type:\s*([^\r\n]+)/m)?.[1]?.trim();
    if (!type || !schema.has(type)) continue;
    for (const field of schema.get(type)) {
      const expression = new RegExp(`^${field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:`, "m");
      if (!expression.test(content)) {
        fail(`${path.relative(root, file)}: ${type} missing required field ${field}`);
      }
    }
  }
}

const forbidden = [
  ["obsidian-distill/SKILL.md", "02_Projects/` for active outcomes"],
  ["obsidian-distill/SKILL.md", "project notes, or turn context"],
  ["obsidian-router/references/vault-contract.md", "Use status values:"],
  ["obsidian-router/SKILL.md", "Directly triggered atom skills"]
];
for (const [file, phrase] of forbidden) {
  if (read(file).includes(phrase)) fail(`${file}: forbidden legacy rule '${phrase}'`);
}

const requiredContractTokens = [
  ["obsidian-analyst/SKILL.md", "owner_skill"],
  ["obsidian-router/references/lifecycle-playbook.md", "Does it change current project state"],
  ["obsidian-router/references/write-policy.md", "project-status"],
  ["obsidian-router/references/write-policy.md", "project-log"],
  ["obsidian-router/references/write-policy.md", "project-topic"]
];
for (const [file, phrase] of requiredContractTokens) {
  if (!read(file).includes(phrase)) fail(`${file}: missing contract token '${phrase}'`);
}

if (warnings.length) {
  console.log(`WARN ${warnings.length}`);
  for (const warning of warnings) console.log(`- ${warning}`);
}

if (errors.length) {
  console.error(`FAIL ${errors.length}`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`PASS skills=${skillNames.length} markdown=${markdownFiles.length} readme_lines=${readmeLines}`);
