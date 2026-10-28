# Manual Operations

All Obsidian knowledge-base operations are Markdown-first agent file operations inside a real Obsidian vault.

Do not treat an arbitrary Markdown folder as a replacement for Obsidian. Before formal writes, verify Obsidian Desktop, the target vault, required Obsidian plugins, Node/npm for skill installation, `kepano/obsidian-skills`, and this skill package. Do not require Python for customer workflows.

## Create Current Project Config

When `.obsidian.yaml` is missing, create it in the current project root only after the required environment gate passes and the user supplies required fields.

Preflight:

1. Confirm the current project root.
2. Confirm Obsidian Desktop is installed and opened to the target vault.
3. Confirm the target vault path exists and contains `.obsidian/`.
4. Confirm required Obsidian plugins are installed and enabled: Templater, Calendar, Text Generator, Excalidraw, Bases.
5. Confirm Node/npm is available and `kepano/obsidian-skills` is installed.
6. Ask for `vault_path` if it is missing.
7. Ask for `directory language (中文 / English)` when it is not already explicitly selected.
8. Do not write `.obsidian.yaml` or create vault directories until the language choice is present.
9. Reject or pause on broad paths such as the user home directory, desktop, downloads, or system folders unless the user explicitly confirms that path is the Obsidian vault root.
10. Recommend backup before first write when the vault already contains important notes.

Template:

```yaml
owner: 张格格
vault_path: "{{vault_path}}"
directory_style: "{{directory_style}}"
project_name: "{{project_name}}"
timezone: Asia/Shanghai
directories:
  inbox: 00_收件箱
  daily: 01_每日工作记录
  projects: 02_项目
  areas: 03_长期领域
  resources: 04_外部资料
  concepts: 05_概念
  decisions: 06_决策
  people: 07_人物组织
  skills: 08_技能
  playbooks: 09_可复用流程
  problems: 10_问题解决
  sources: 90_原始来源
  sessions: 90_原始来源/会话记录
  system: 99_系统
daily_layout: single-file
daily_filename: YYYY-MM-DD.md
status_values:
  - inbox
  - processed
  - needs-review
  - active
  - archived
```

Status output:

```text
O: 未找到项目配置
O2: 收集初始化字段
D: 创建 .obsidian.yaml
A: 写入项目配置
V: 读取配置确认
```

## Initialize Vault Directories

After `vault_path` is known, do not pre-create every configured business directory. Keep the full directory mapping in `.obsidian.yaml`, then create a context-derived scaffold.

For initialization-only tasks, create only `99_System/` because index and framework files live there.

For first organization tasks, create only active-lane directories:

- `90_Sources/Sessions` when writing the first raw source.
- `01_Daily` when writing the first daily entry.
- `02_Projects` when writing the project profile.
- `09_Playbooks` only if the lifecycle playbook note is written.
- `10_Problems`, `05_Concepts`, `06_Decisions`, `08_Skills`, `04_Resources`, or `07_People` only when real content of that type exists.

Also write `99_System/vault-framework.md` during empty-vault bootstrap. It must explain:

- Current project purpose.
- Active lanes created in the first run.
- Inactive lanes that exist only in `.obsidian.yaml` mapping.
- Conditions that will create each inactive lane later.
- Directory naming style: stable English keys, Chinese names, or user-provided mapping.

Do not move existing files.
Do not rename existing folders. If the customer already uses a different folder style, update `.obsidian.yaml` directory mappings instead.

Status output:

```text
O: 检查 vault 目录
O2: 识别本次需要写入的目录
D: 生成上下文脚手架
A: 创建活跃通道和框架说明
V: 未创建无解释的空业务目录
```

## Empty Vault Bootstrap

When the target vault is empty or contains only `.obsidian/`, do not stop after creating indexes. Read `../../obsidian-router/references/empty-vault-bootstrap.md` and create the context-derived scaffold required for future retrieval.

Required order:

```text
project context scan
-> role-based architecture plan
-> missing directories
-> seed notes
-> index files
-> first retrieval/use report
```

Seed files:

```text
02_Projects/{project_name}.md
90_Sources/Sessions/YYYY-MM-DD-HHMM-{topic}.raw.md
{daily canonical path resolved from daily_layout}
09_Playbooks/knowledge-lifecycle-flow.md
99_System/vault-framework.md
99_System/problem-index.json
99_System/knowledge-index.md
99_System/daily-index.md
99_System/project-index.md
99_System/skill-index.md
99_System/playbook-index.md
```

Rules:

- Create source/daily/project seed notes only when the user requested first organization or setup recording.
- For pure "check empty vault" requests, report a dry-run bootstrap plan without writing notes.
- Do not create unexplained empty business directories merely because they exist in `.obsidian.yaml`.
- Do not create empty concept, decision, or problem notes without real content.
- All seed notes must include source/project/date/status metadata when applicable.
- The final report must include example retrieval phrases.

## Initialize Index Files

Create missing index files only:

```text
99_System/problem-index.json
99_System/knowledge-index.md
99_System/daily-index.md
99_System/project-index.md
99_System/skill-index.md
99_System/playbook-index.md
```

`problem-index.json` initial content:

```json
{
  "last_updated": null,
  "problems": []
}
```

Read `index-schemas.md` before creating or rebuilding any index.

## Daily Index Rebuild

1. Read `.obsidian.yaml` and resolve `directories.daily`, `directories.system`, `daily_layout`, and `daily_filename`.
2. Scan the canonical Daily pattern defined in `index-schemas.md`.
3. Search both supported layouts and Vault-root legacy variants for same-date collisions.
4. Write one explicit-path link per canonical date to `{directories.system}/daily-index.md`.
5. Put collisions and legacy-only dates under `Needs Review` rather than indexing two rows for one date.
6. Read the index back and verify the canonical Daily count equals the Active row count.

## Problem Index Rebuild

Use this section as the normal Markdown-first index rebuild procedure.

1. Read all `10_Problems/*.md`.
2. Select notes with `type: problem` in frontmatter.
3. Extract first `# Heading` as title.
4. Extract `id`, `date`, `status`, `priority`, `project`, `source`, and `verification` from frontmatter/body when available.
5. Write `99_System/problem-index.json`.
6. Read the written index to verify valid JSON and expected count.

## Project Index Rebuild

1. Read top-level `02_Projects/*.md` project entries.
2. For each entry, check for an optional same-name `02_Projects/{project}/STATUS.md`.
3. Use the entry for identity and the companion STATUS for fresher operational status, objective, next action, and updated date.
4. Keep entry-only legacy projects in the index without creating or migrating files.
5. Do not create separate project rows from `LOG.md` or `TOPICS/*.md`.
6. Put entry/STATUS conflicts in `Needs Review` and report both values.
7. Write `99_System/project-index.md`, then read it back and verify one row per project entry.

## Project File Archive

When the user wants a portable vault, follow `../../obsidian-router/references/project-file-archive.md` directly:

1. Read `.obsidian.yaml`.
2. Resolve `vault_path`, `project_name`, `directory_style`, and `directories.sources`.
3. Inventory project files with normal file listing tools.
4. Skip cache/build artifacts by rule.
5. Copy useful files into the configured source archive path.
6. Write `asset-manifest.json` manually as valid JSON.
7. Write `asset-index.md` manually as an Obsidian navigation note.
8. Update the project note and system asset index.
9. Read back manifest and index to verify.

## Maintenance Record Write

For any broad maintenance operation that changed Vault files:

1. Read `maintenance-record.md` and resolve `{directories.system}` from project configuration.
2. Inventory the actual created, updated, moved, and deleted files after verification.
3. Match `date + operation + scope fingerprint`; update the matching record or create one from `../assets/templates/maintenance-record.md`.
4. Update `{directories.system}/维护记录/_index.md` with one link and summary row for the event.
5. Read the record and `_index.md` back and verify required frontmatter, paths, backup, results, and remaining issues.
6. Report the record path. The chat report cannot replace this Vault record.

The maintenance-record write itself does not recursively trigger another maintenance record.

## Manual Failure Recovery

| Situation | Manual fallback |
| --- | --- |
| `.obsidian.yaml` is invalid | Stop writes, show the invalid key, and ask for correction |
| Obsidian Desktop is not installed | Stop writes and ask the user to install Obsidian |
| Required Obsidian plugin is missing | Stop writes and ask the user to install/enable missing plugins |
| Node/npm is missing | Stop writes and ask the user to install Node/npm |
| `kepano/obsidian-skills` is missing | Stop writes and ask the user to install it |
| `vault_path` does not exist | Do not write notes; ask the user to confirm the path or create the vault in Obsidian |
| Daily note already exists | Append under the most relevant heading; never replace the entire file |
| A problem note already exists | Add a new evidence/update section to the existing note |
| Source note is missing | Create the raw source note first, then link distilled notes back to it |
| Index file is stale | Rebuild by reading notes directly, then write only the index file |

## Manual Delivery Report

At the end of any manual operation, report:

- Created files.
- Updated files.
- Existing files left unchanged.
- Files that need user review.
- Verification performed.

For read-only tasks, report the files read and explicitly state `V: 未修改文件`.
