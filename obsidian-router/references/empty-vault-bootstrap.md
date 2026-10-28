# Empty Vault Bootstrap

Use this when the user first triggers knowledge organization and the target vault has no usable knowledge structure yet.

Empty vault bootstrap is not the same as normal session archiving. The first run must build enough context and structure so future archiving has somewhere meaningful to land.

The target is a context-derived scaffold:

- Not a full generic folder tree.
- Not pure lazy creation with no architecture.
- A first framework inferred from the current project, with physical directories created only for active lanes and all inactive lanes documented as future expansion rules.

## Trigger Conditions

Run this protocol when any of these is true:

- `.obsidian.yaml` is missing and the user asks to initialize or organize knowledge.
- `vault_path` exists but contains only `.obsidian/` or no managed directories.
- Managed directories exist but indexes and seed notes are missing.
- The user asks what happens when the knowledge-base directory is still empty.
- The user asks for an industry-style AI + Obsidian bootstrap workflow.

## Three Empty States

| State | Signal | Required behavior |
| --- | --- | --- |
| No project config | no `.obsidian.yaml` or `.obsidian_conf.yaml` | Use `init-dialog.md`; do not guess `vault_path` |
| Empty Obsidian vault | vault root has `.obsidian/` but no managed folders or notes | Understand project context, propose architecture, then create missing folders and seed files |
| Skeleton only | folders exist but no source/daily/index/durable notes | Create seed indexes, project profile, first source note, and first daily entry when write is requested |

## Mandatory First-Run Flow

Use this sequence for the first real organization task:

```text
environment gate
-> config/init dialog
-> empty-state detection
-> project context scan
-> role-based architecture analysis
-> bootstrap plan
-> create context-derived scaffold
-> write first knowledge event
-> create indexes
-> retrieval/use report
```

## Step 1: Environment Gate

Before writing to a formal vault, apply the environment rules from:

```text
environment-gate.md
vault-contract.md
write-policy.md
```

If the environment is not ready, stop formal writes and output a dry-run plan only.

## Step 2: Config And Init Dialog

If project config is missing, ask only for missing required fields:

- `vault_path`
- `project_name` when it cannot be inferred from the current folder
- optional directory style when the user does not want the default
- optional role priority when the user already knows it

Do not ask for a complete taxonomy before understanding the project. The taxonomy should be generated from project context and user work modes.

## Step 3: Empty-State Detection

After `vault_path` is known, inspect:

- Whether the path exists.
- Whether it contains `.obsidian/`.
- Which managed directories exist.
- Whether `99_System/*index*` exists.
- Whether there are existing notes that must be preserved.

Never move or rename existing customer folders. Use `.obsidian.yaml` directory mappings to adapt.

Status example:

```text
O: 检查 vault 空状态
O2: 仅发现 .obsidian
D: 执行首轮建库
A: 生成目录和种子索引
V: 等待首条知识事件写入
```

## Step 4: Project Context Scan

Before creating durable architecture, understand the current project.

Read only high-signal local files when present:

- `README.md`
- `package.json`, `pyproject.toml`, `requirements.txt`, `Cargo.toml`, or equivalent manifest
- existing docs under `docs/`
- `SKILL.md` files when the project is a skill package
- recent user-provided requirements in the current conversation
- current working directory name

Do not bulk-read the whole repository. Use file names and manifests first, then read only relevant docs.

Context summary must answer:

- What is this project for?
- Who will use the knowledge base?
- What kinds of work happen here?
- What outputs should the vault help produce?
- What must be preserved as evidence?
- What should be skipped or left in Inbox?

## Step 5: Role-Based Architecture Analysis

Use `obsidian-analyst` and `role-matrix.md`.

Minimum roles for an empty vault:

| Role | Job in bootstrap |
| --- | --- |
| knowledge librarian | Source preservation, metadata, dedupe, indexes |
| architect | Directory contract, note types, backlinks, invariants |
| product operator | Daily/weekly/monthly workflow and user status output |
| skill designer | Trigger phrases, execution rules, acceptance tests |

Add domain roles only when the project requires them:

- programmer for code and debugging projects
- personal writer for essays, arguments, and long-form thinking
- short-video creator for content pipelines
- business decision maker for strategy and tradeoff-heavy work

The output is not a role debate. It must become a bootstrap architecture plan.

## Step 6: Bootstrap Architecture Plan

Before writing, produce or internally derive:

```yaml
project_profile:
  purpose: ""
  audience: ""
  work_modes: []
  default_roles: []
vault_architecture:
  directories:
    source: ""
    daily: ""
    durable: []
    system: ""
first_notes:
  - type: source|daily|project|playbook|skill|index
    reason: ""
    path: ""
retrieval_design:
  date_queries: []
  project_queries: []
  problem_queries: []
  reuse_queries: []
review_items: []
```

If confidence is low, ask at most three questions before writing.

Good questions:

- 这个 vault 主要服务哪个长期方向：工程项目、个人写作、内容生产、商业决策，还是混合？
- 当前项目的最终产物是什么：代码、Skill、文章、视频、课程、产品方案，还是工作记录？
- 哪些内容不能写入知识库，或必须脱敏？

## Step 7: Context-Derived Scaffold

Do not pre-create every directory from the configured mapping. The config may list all supported directories, but the vault should stay understandable from day one.

Create three layers:

| Layer | What to create | Purpose |
| --- | --- | --- |
| Logical map | Full directory mapping in `.obsidian.yaml` | Documents all supported note types and allows future expansion |
| Active scaffold | Physical directories needed by current project context | Gives the first run a real place to land |
| Framework note | `99_System/vault-framework.md` | Explains why this structure exists, which lanes are active, and when inactive lanes should be created |

Physical directory rule:

- Create a directory when the first run will write at least one note into it.
- Create a directory when the project context strongly predicts immediate use and `vault-framework.md` names its purpose.
- Do not create a directory merely because it exists in the default mapping.

Typical first-run directories:

- `99_System` for index files.
- `90_Sources/Sessions` for the first raw source.
- `01_Daily` for the first daily setup entry.
- `02_Projects` for the project profile.
- `09_Playbooks` only when writing a lifecycle playbook note.

All other directories are documented in the framework note and created later when real content exists:

- `10_Problems` when a concrete solved/open problem exists.
- `05_Concepts` when a reusable concept exists.
- `06_Decisions` when a real decision/tradeoff exists.
- `08_Skills` when a skill rule or prompt asset exists.
- `04_Resources` when an external resource exists.
- `07_People` when a person or organization note exists.
- `00_Inbox` when unsorted fragments must be stored outside the source note.

If the user already has a different directory style, do not rename it. Write mappings to `.obsidian.yaml`.

## Directory Naming

Directory names are configurable. The initialization dialog must ask the user to choose `中文` or `English`; there is no implicit language default. The Chinese example is:

```text
01_每日工作记录
02_项目
05_概念
```

If the user chooses Chinese, use `.obsidian.yaml` mappings instead of changing skill names:

```yaml
directory_style: chinese
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

Use the user's chosen style consistently. Do not mix Chinese and English directory names in the same vault unless the user explicitly requests compatibility aliases.

## Step 8: Seed Notes

For a truly empty vault, create these seed files when write permission and environment are ready:

| Seed | Path | Purpose |
| --- | --- | --- |
| Project profile | `02_Projects/{project_name}.md` | Captures what the current project is and how this vault supports it |
| First source note | `90_Sources/Sessions/YYYY-MM-DD-HHMM-{topic}.raw.md` | Preserves the first conversation or requirement |
| Daily note | `01_Daily/YYYY-MM-DD.md` | Records first setup actions |
| Lifecycle playbook note | `09_Playbooks/knowledge-lifecycle-flow.md` | Explains the ongoing operating loop inside the vault |
| Framework note | `99_System/vault-framework.md` | Explains active lanes, inactive lanes, and future creation conditions |
| Index files | `99_System/*index*` | Enables future retrieval |

Do not create many empty concept/decision/problem notes. Create durable notes only when the first context contains real durable content.

## Step 9: First Knowledge Event

The first organization task should create a `knowledge event`:

```text
raw source -> daily setup entry -> project profile -> optional durable notes -> indexes
```

The event records:

- date and time
- project name
- source backlink
- selected roles
- architecture decisions
- active and inactive lanes
- skipped items
- user-review items
- retrieval phrases

## Step 10: Retrieval And Use Report

The final report must tell the user how to use the new vault immediately:

- What was created.
- Where the first source lives.
- How to ask for yesterday/today/project/problem reports.
- How to add the next fragment.
- How to continue from this setup.
- What still needs user review.

Example final status:

```text
O: 识别空 vault
O2: 完成项目理解和角色分析
D: 建立最小知识架构
A: 创建目录、种子笔记、索引
V: 可用检索词已输出
```

## Anti-Patterns

- Creating dozens of empty category notes before understanding the project.
- Treating Daily as the whole knowledge base.
- Copying a generic PARA structure without directory mapping or use cases.
- Writing durable notes without source backlinks.
- Asking the user to design the whole taxonomy manually.
- Scanning the whole repository before reading obvious high-signal files.
- Renaming customer folders to fit this package.
- Skipping retrieval phrases after setup.
