# Vault Contract

The vault stores complete useful material, not only summaries.

## Canonical Principle

Model every input as a `knowledge event` first, then derive notes from it.

```
raw event -> daily timeline -> durable notes -> indexes -> retrieval/report
```

This mirrors the opal-bridge idea of a canonical intermediate representation: do not directly convert a conversation into one note. Preserve source data, then render multiple note types.

## Default Directories

These are logical directory mappings. They do not mean every directory must be physically created during initialization. Empty vault bootstrap should create a context-derived scaffold and activate only the directories needed by the first project context or first knowledge event.

| Purpose | Directory |
| --- | --- |
| unprocessed fragments | `00_Inbox/` |
| daily archive | `01_Daily/` |
| active projects | `02_Projects/` |
| long-term areas | `03_Areas/` |
| external resources | `04_Resources/` |
| evergreen concepts | `05_Concepts/` |
| decisions | `06_Decisions/` |
| people and organizations | `07_People/` |
| agent skills | `08_Skills/` |
| reusable workflows | `09_Playbooks/` |
| problems and fixes | `10_Problems/` |
| raw sessions and sources | `90_Sources/` |
| config, templates, indexes | `99_System/` |

Portable vault rule: when the user expects to migrate the vault later, key project files must be copied into the configured source directory, normally under `90_Sources/Project Files/{project_name}/` or `90_原始来源/项目文件/{project_name}/`. Summaries alone are not enough.

## Compatible Aliases

If an existing vault uses article-style folders, map them:

- `00-Inbox` -> `00_Inbox`
- `10-Sources` -> `90_Sources` or `04_Resources` depending on whether the content is raw or cleaned
- `20-Ideas` -> `05_Concepts`
- `30-Projects` -> `02_Projects`
- `40-Skills` -> `08_Skills`
- `50-Outputs` -> map only when the customer already uses an output directory
- `90-Reviews` -> `01_Daily` or `99_System/reviews` depending on date granularity

Do not rename existing vault directories automatically. Use the config mapping.

## Current Project Config

The current project's config must live at the project root:

- `.obsidian.yaml` preferred and canonical
- `.obsidian_conf.yaml` accepted only as a compatibility alias

Lookup order:

1. `.obsidian.yaml` in the current working directory
2. `.obsidian_conf.yaml` in the current working directory
3. User-provided vault path

The project config points to the real Obsidian vault. It is not a generated index file and should not be placed under `99_System/`.

Required fields:

```yaml
owner: 张格格
vault_path: "D:/Obsidian/ZhangGege"
project_name: "current-project-name"
directory_style: chinese
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
```

## Daily Layout

The config field `daily_layout` explicitly selects the daily-note layout used by the vault (for example `worklog` for a work-log daily note). It must be written explicitly; the workflow does not infer a layout from the directory language. obsidian-daily reads this field to know which template and sections to use for the daily note.


`directory_style` is written only after the initialization dialog has received an explicit language choice:

- `中文` -> `chinese`
- `English` -> `stable-numbered`

If the choice is missing, stop before writing `.obsidian.yaml` or creating vault directories. Never infer the choice from the user's message language, operating-system locale, or a hard-coded default.

`99_System/` is for indexes, templates, and generated system notes, not for the current project's primary config.

## Vault Root Config

A vault may also contain `.obsidian.yaml` at its own root when the vault itself is the current project. The same schema applies. Do not create `99_System/obsidian-config.json` as the primary config.

## Required Runtime Dependency

This workflow is Markdown-first inside a real Obsidian vault. Formal writes require the full Obsidian environment, required Obsidian plugins, required skills, and Node/npm for skill installation. They do not require Python.

## Obsidian Environment Gate

Use `environment-gate.md` as the canonical preflight checklist. The rules below restate the contract for this vault.

This skill package organizes knowledge for Obsidian. Obsidian Desktop is a hard prerequisite for formal knowledge-base writes.

Before creating or updating vault notes, confirm all of these:

1. Obsidian Desktop is installed.
2. The user has created a target vault.
3. Obsidian is opened to that target vault.
4. `.obsidian.yaml` points to that target vault.
5. Required Obsidian plugins are installed and enabled: Templater, Calendar, Text Generator, Excalidraw, Bases.
6. Node/npm is installed.
7. `kepano/obsidian-skills` is installed.
8. This skill package is installed in the agent's skills directory.

If the user states that any required item is missing, or if the agent cannot confirm the above, stop formal write operations.

Allowed while stopped:

- Provide installation instructions.
- Ask for the future vault path.
- Prepare a dry-run write plan.
- Inspect source projects when the user asks for analysis.

Not allowed while stopped:

- Create or update source, daily, problem, concept, decision, playbook, skill, project, or index notes in a real vault.
- Pretend a plain folder is an Obsidian vault.
- Tell the user that Obsidian, required plugins, required skills, or Node/npm for skill installation are optional.

## Provenance Rules

- Raw source notes are only deleted with explicit user confirmation, following the Delete Decision procedure in write-policy.
- Raw project files that support the notes should be copied into the vault when portability matters.
- Every distilled note links to a source note.
- Facts, opinions, inferences, and decisions must stay separate.
- Unknown author/date/source fields stay blank or `unknown`; never guess.
- Status values (`inbox`, `processed`, `needs-review`, `active`, `archived`) are defined canonically in `note-schema.md` and applied consistently here.

## File Naming Rules

Use stable, searchable names.

| Note type | Pattern | Example |
| --- | --- | --- |
| raw session | `YYYY-MM-DD-HHMM-topic.raw.md` | `2026-07-30-1530-obsidian-skill-optimization.raw.md` |
| daily | `YYYY-MM-DD.md` | `2026-07-30.md` |
| problem | `YYYY-MM-DD-short-problem.md` | `2026-07-30-readme-missing-install-guide.md` |
| decision | `YYYY-MM-DD-short-decision.md` | `2026-07-30-use-obsidian-yaml-config.md` |
| concept | `concept-name.md` | `knowledge-event.md` |
| playbook | `action-object-flow.md` | `agent-session-archive-flow.md` |

Rules:

- Resolve relative dates to exact dates before reading or writing.
- Keep filenames short; put details inside the note body.
- If the target note exists, read it before deciding whether to append, merge, or create a numbered variant.
- Do not put the owner's name in skill names. Store owner identity in `.obsidian.yaml` or profile references.

## Safety Rules

- Do not delete raw sources without following the Delete Decision procedure in write-policy.
- Do not move existing customer files.
- Do not automatically rename existing vault directories; use config mappings instead.
- Do not accept `vault_path` values that point to a system directory, user home root, desktop, downloads, or another broad container unless the user explicitly confirms it is an Obsidian vault.
- Before writing, check whether the target file already exists.
- After writing, read back important files to verify frontmatter, source links, and indexes.
- If any required software, plugin, or skill is missing, stop formal writes and ask the user to complete installation first.

## Failure Recovery

| Failure | Required behavior |
| --- | --- |
| missing `.obsidian.yaml` | ask the init dialog only for missing required fields |
| invalid `.obsidian.yaml` | pause writes and identify the invalid field |
| missing `vault_path` | do not create vault notes; ask for the path |
| nonexistent `vault_path` | do not write knowledge notes; ask the user to confirm or create the vault |
| Obsidian not installed | stop formal writes and provide installation/setup instructions |
| Obsidian not opened to target vault | stop formal writes and ask the user to open the vault |
| required Obsidian plugin missing | stop formal writes and list missing plugins |
| Node/npm missing | stop formal writes and ask the user to install Node/npm |
| `kepano/obsidian-skills` missing | stop formal writes and ask the user to install it |
| this skill package missing from agent skills | stop formal writes and ask the user to install the package |
| existing daily note | append to the correct section; do not overwrite the full note |
| duplicate problem note | link and update the existing note instead of creating a duplicate |
| missing source link | create or identify the raw source note before distilling durable notes |
