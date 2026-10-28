# Init Dialog

Use this dialog when `.obsidian.yaml` is missing from the current project root or when the user asks to initialize the knowledge-base workflow.

If the target vault is empty or this is the first organization run, also read `empty-vault-bootstrap.md`. Initialization must first understand the current project, then create a minimal architecture. Do not create a generic folder tree without project context.

## Rule

Ask for missing fields before writing config. Keep the dialog short. Do not ask for fields already known from context. Directory language is a required explicit choice; never infer it from the user's message language, Windows language, locale, or an old default.

Before writing config or creating vault directories, verify the required environment:

- Obsidian Desktop installed.
- Target vault created and opened in Obsidian.
- Templater, Calendar, Text Generator, Excalidraw, and Bases installed and enabled.
- Node/npm available.
- `kepano/obsidian-skills` installed.
- This skill package installed in agent's skills.

If any item is missing, stop initialization and output only the missing-item checklist.

## Required Fields

| Field | Meaning | Default |
| --- | --- | --- |
| `owner` | knowledge-base owner | `张格格` |
| `project_name` | current project name | current folder name |
| `project_path` | project root where `.obsidian.yaml` will be stored | current working directory |
| `vault_path` | real Obsidian vault path | none; must be supplied |
| `directory_style` | folder language selected during initialization | required: `中文` or `English` |
| `default_roles` | role priority for `obsidian-analyst` | profile default |

## First-Run Context Fields

Do not ask these by default when they can be inferred from local files or the current conversation. Ask at most three if project context is still unclear.

| Field | Meaning | When to ask |
| --- | --- | --- |
| `project_purpose` | what this project is for | no README/docs/conversation context |
| `primary_outputs` | code, skill, article, video, product plan, work log, or mixed | unclear after project scan |
| `sensitive_boundaries` | what must not be written or must be masked | before first production vault write |

## Dialog Text

Use this structure in chat:

```text
O: 未发现当前项目配置 `.obsidian.yaml`。

请提供初始化信息：
- Obsidian vault 路径：
- 项目名（默认：当前目录名）：
- 目录语言（必选：中文 / English）：
- 默认分析角色顺序（默认：知识管理员 > 架构师 > 程序员 > Skill 设计师）：
```

目录语言的结果必须统一应用到本次初始化生成的映射：

```text
中文   -> 01_每日工作记录、02_项目、05_概念、10_问题解决
English -> 01_Daily、02_Projects、05_Concepts、10_Problems
```

在用户选择目录语言前，不得写入 `.obsidian.yaml`，不得创建业务目录，也不得用中文或英文作为隐式默认值。

If only `vault_path` is missing and the directory language was already explicitly selected in the current configuration context, ask only for `vault_path`. Otherwise, ask for the directory language too.

For an empty vault first run, append this short context prompt only when needed:

```text
这个 vault 还是空的。为了先按项目生成知识库架构，请补充：
- 这个项目主要服务什么长期方向：
- 最终产物是什么：
- 哪些内容不能写入或必须脱敏：
```



## How Init Scans the Vault

Before mapping directories or creating a skeleton, initialization scans the vault to record **existing top-level directories**. The scan result drives the mapping: existing article-style or legacy folders are mapped via the compat aliases instead of being renamed or duplicated, and empty-state detection decides whether bootstrap or create first knowledge events. Do not build a generic folder tree without scanning these existing top-level directories first.

## After User Answers

Write `.obsidian.yaml` in the project root only after all required software, plugins, and skills are present and the user has explicitly chosen directory language. The agent writes the YAML file directly from the template; do not require Python. Then output:

```text
A: 已创建 `.obsidian.yaml`。
V: 配置已读取，vault_path 有效/待确认。
```

Before writing, validate the answer:

- `vault_path` must be supplied by the user or already known from context.
- `vault_path` must point to the Obsidian vault root, not a broad system directory.
- If the path does not exist, pause and ask whether to create/use that vault path.
- If the vault already contains important notes, recommend backup before the first write.
- If the user provides an article-style directory convention, store it in `directories` mapping instead of renaming existing folders.
- Required software, plugins, and skills must be installed before writing config or vault notes.

After config is valid and the vault is empty, continue with `empty-vault-bootstrap.md`:

1. Detect empty state.
2. Scan high-signal project context files.
3. Run role-based architecture analysis.
4. Create a context-derived scaffold: active-lane directories, seed files, and `99_System/vault-framework.md`.
5. Write the first knowledge event if the user requested organization, not only initialization.
6. Output retrieval and use instructions.

## Do Not

- Do not create config under `99_System/`.
- Do not guess `vault_path`.
- Do not create vault directories until `vault_path` is known.
- Do not ask for excessive preferences during first init.
- Do not ask the user to design the whole taxonomy manually.
- Do not create a full durable note taxonomy before understanding the project.
- Do not continue when Node/npm for skill installation, required plugins, required skills, or Obsidian Desktop are missing.
