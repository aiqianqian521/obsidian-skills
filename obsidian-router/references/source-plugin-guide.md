# Reference Sources and Required Setup

This guide is for users. It explains the required local setup and the reference projects that shaped this skill package. There are no optional prerequisites for formal knowledge-base writes.

## What Must Be Installed

Minimum environment:

| Item | Required | Why |
| --- | --- | --- |
| Obsidian Desktop | Yes | Opens and maintains the local vault. If it is not installed, stop formal knowledge-base writes. |
| One Obsidian vault | Yes | The vault is the real database. `.obsidian.yaml` must point to this folder. |
| Obsidian opened to the target vault | Yes | This skill package is designed to work with Obsidian, not replace it. |
| Agent file access | Yes | Agent must be able to read and write Markdown notes inside the Obsidian vault. |
| Node/npm | Yes | Required to install the Obsidian skill base and related skills. |
| `kepano/obsidian-skills` | Yes | Required Obsidian skill base for Markdown, frontmatter, wikilinks, Bases, and related conventions. |
| This skill package | Yes | Required Agent-side workflow package. |
| Obsidian plugins | Yes | Templater, Calendar, Text Generator, Excalidraw, and Bases must be installed and enabled. |

Required operating mode:

```text
1. Open Obsidian Desktop.
2. Open the target vault.
3. Keep Obsidian running in the background.
4. Confirm required Obsidian plugins are installed and enabled.
5. Confirm `kepano/obsidian-skills` and this skill package are installed.
6. Run Agent knowledge-base tasks from the current project.
7. Return to Obsidian to inspect notes, links, Calendar, Bases, and plugin views.
```

Formal write tasks must not proceed when any required software, plugin, or skill is missing. In that case, output setup instructions only.

For missing skill installation, use `install-required-skills.md`. Do not search for substitute skills or alternate repositories.

## Fresh Install Tutorial

Use this sequence for a customer who starts from an empty machine.

### 1. Install Obsidian Desktop

1. Open the official download page: `https://obsidian.md/download`.
2. Download and install the package for the current operating system.
3. Start Obsidian.
4. Create a new vault with `Create new vault`, or open an existing vault with `Open folder as vault`.
5. Confirm the vault root contains `.obsidian/`.
6. Keep Obsidian opened to the target vault.

If Obsidian is not installed or the target vault has not been opened, stop formal writes.

### 2. Install Required Obsidian Plugins

In Obsidian:

1. Open `Settings`.
2. Open `Community plugins`.
3. Enable community plugins.
4. Click `Browse`.
5. Install and enable `Templater`.
6. Install and enable `Calendar`.
7. Install and enable `Text Generator`.
8. Install and enable `Excalidraw`.
9. Search settings for `Bases` and enable it. If the current Obsidian version does not provide Bases, upgrade Obsidian first.

If any required plugin is missing or disabled, stop formal writes and list the missing plugin.

### 3. Install Node/npm

Install Node.js LTS from `https://nodejs.org/`, then verify:

```powershell
node -v
npm -v
```

If either command fails, stop formal writes.

### 4. Install `kepano/obsidian-skills`

Use the local zip first when available:

```text
C:/code/obsidian-skills-main.zip
```

This package also keeps a bundled fallback at:

```text
obsidian-router/assets/required-skills/obsidian-skills/
```

Read `install-required-skills.md` for the exact local copy commands. Do not search for substitute repositories.

After Node/npm works, and only when local install sources are unavailable:

```powershell
npx skills add https://github.com/kepano/obsidian-skills
```

This command is required. Do not skip it.

Expected installed skill folders:

```text
obsidian-markdown
obsidian-bases
json-canvas
obsidian-cli
defuddle
```

### 6. Install This Agent Skill Package

Copy all `obsidian-*` skill folders into the Agent skills directory:

```text
~/.agents/skills/  (or platform-specific: ~/.claude/skills/, ~/.codex/skills/, etc.)
```

Required folders:

```text
obsidian-router
obsidian-analyst
obsidian-capture
obsidian-daily
obsidian-distill
obsidian-solve
obsidian-query
obsidian-index
```

Restart Agent or start a new session after copying.

Use `install-required-skills.md` for the exact copy command. Do not let the agent search for unrelated skill packages.

### 7. Initialize Project Config

From the current project, use this trigger:

```text
初始化当前项目的 Obsidian 知识库配置。
```

The agent must ask for missing required fields and create `.obsidian.yaml` in the current project root only after the environment gate passes.

The agent writes `.obsidian.yaml` directly from the Markdown template in `manual-operations.md`. Do not require Python or a script command.

If the user chooses Chinese during initialization, use the Chinese directory mappings in `vault-contract.md`.

The vault path must already exist and contain `.obsidian/`.

### 8. Initialize Vault Layout

After project config exists, the agent directly creates the system index files and `vault-framework.md` according to `manual-operations.md`.

By default this creates system indexes and `99_System/vault-framework.md` only. It does not create a full set of empty business directories. Active directories are created by the first context-derived scaffold. Use `--create-standard-dirs` only when the user explicitly wants the full folder tree.

Active business directories are still created lazily from the first real context.

### 9. First Acceptance Commands

Run these in order:

```text
检查知识库环境是否齐备。
先保存当前会话原始上下文，不做知识蒸馏。
归档今天的工作。
列举当前会话解决了哪些问题，提取并录入数据库。
将当前会话整理到知识库，并输出状态栏。
昨天做了什么，发我详情。
```

Read-only tasks must end with `V: 未修改文件`. Write tasks must list created files, updated files, index updates, and review items.

## Project Configuration

Each Agent project should keep its Obsidian connection in the project root:

```text
.obsidian.yaml
```

Compatible legacy name:

```text
.obsidian_conf.yaml
```

Do not store the project connection config inside the vault `99_System/` folder. `99_System/` is for indexes and system notes inside the vault.

Minimum config:

```yaml
owner: 张格格
vault_path: "D:/Obsidian/ZhangGege"
project_name: "my-project"
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

## Required Obsidian Plugins

All listed Obsidian plugins are required. This package is designed for an Obsidian-based knowledge workflow, not for plain Markdown-only folders.

Required plugins:

| Plugin | Required | Use |
| --- | --- | --- |
| Templater | Yes | Create consistent Daily, Problem, Concept, Decision, and Playbook notes. |
| Calendar | Yes | Browse `01_Daily/` by date. |
| Bases | Yes | Turn frontmatter into tables for problems, decisions, projects, and sources. |
| Text Generator | Yes | Continue writing or rewriting from inside Obsidian. |
| Excalidraw | Yes | Draw architecture, workflows, and content maps. |

If any plugin is missing, stop formal writes and tell the user which plugin must be installed/enabled.

## Required Skill Base

Required command:

```powershell
npx skills add https://github.com/kepano/obsidian-skills
```

Purpose:

- Adds Obsidian-specific skill conventions such as Markdown, frontmatter, wikilinks, Bases, Canvas, and Obsidian CLI conventions.
- Improves compatibility with Obsidian writing norms.
- Does not replace this skill package.

If Node/npm is not available, stop formal writes and install Node/npm first. Do not skip this command.

The exact install and verification rules for both `kepano/obsidian-skills` and this package are in:

```text
obsidian-router/references/install-required-skills.md
```

## Reference Projects

These projects are references. The required dependency from this list is `kepano/obsidian-skills`; the others are design references only.

| Project | What to learn | How this package uses it |
| --- | --- | --- |
| `anthropics/skills` | Official Agent Skills structure, assets, references, and task-specific decomposition. | Split the package into small skills: router, capture, daily, solve, distill, query, index, analyst. |
| `kepano/obsidian-skills` | Obsidian Markdown, frontmatter, wikilinks, Bases, Canvas, CLI conventions. | Use as Obsidian writing and metadata baseline. |
| `obsidian-second-brain` | Multi-command, multi-agent second-brain workflows. | Learn from the idea that the vault can evolve over time while keeping this package focused on Agent + Obsidian execution. |
| `stevesolun/ctx` | Large skill/agent/MCP indexing and on-demand loading. | Keep references small and load only the needed rule files. |
| `lingxling/awesome-skills-cn` | Chinese skill examples and onboarding style. | Use Chinese-friendly naming, triggers, and usage examples. |
| `chacosoldier/compabob` | Agent hooks plus Obsidian knowledge-worker setup. | Borrow safety boundaries and agent-vault collaboration patterns. |
| `anliberant/obsidian-ai-setup` | Fast personalized AI vault bootstrap. | Borrow the initialization-dialog idea while keeping formal execution Markdown-first. |
| `ibrahimkobeissy/ai-second-brain-template` | Self-organizing vault and AI collaboration template. | Borrow long-term maintenance and self-organization patterns. |
| `inkeep/open-knowledge` | AI-first knowledge-management product direction. | Treat knowledge as something that must be searchable and usable, not just stored. |
| `1va7/opal-bridge` | Agent bridge, adapter, sync, and tool-mapping architecture. | Useful when this package later needs cross-agent or cross-CLI synchronization. Not required for the current Obsidian-first workflow. |

## Why These References Matter

This package combines four ideas:

1. Agent Skills should be small and composable.
2. Obsidian notes should preserve source, metadata, and links.
3. The vault is a long-term system, not a one-time summary.
4. Every fragment must enter the database at least as raw source or inbox; durable notes are additional value layers.

## Customer Setup Checklist

Before first real use:

- Obsidian Desktop is installed.
- A target vault exists.
- Obsidian is opened to that vault.
- Templater, Calendar, Text Generator, Excalidraw, and Bases are installed and enabled.
- Node/npm is installed.
- `kepano/obsidian-skills` is installed.
- This skill package is installed in the Agent skills directory.
- `.obsidian.yaml` exists in the current Agent project root.
- `vault_path` points to the vault root.
- Agent can read and write the vault.
- The user has backed up the vault if it already contains important notes.
- A short test session has been captured before running a full organization task.

First three test commands:

```text
初始化当前项目的 Obsidian 知识库配置。
先保存当前会话原始上下文，不做知识蒸馏。
将当前会话整理到知识库，并告诉我以后怎么检索和使用。
```

## Stop Condition

If the user says "本机没有安装 Obsidian" or the agent cannot confirm that all required software, plugins, and skills are ready, stop formal write operations.

Allowed actions while stopped:

- Explain that Obsidian Desktop is required.
- Tell the user to install Obsidian Desktop.
- Tell the user to create or open a vault.
- Tell the user to install Node/npm, `kepano/obsidian-skills`, this skill package, and the required Obsidian plugins.
- Prepare a dry-run write plan without creating vault notes.
- Create no `Daily`, `Problem`, `Concept`, `Decision`, `Playbook`, `Skill`, or `Source` notes in the production vault.
