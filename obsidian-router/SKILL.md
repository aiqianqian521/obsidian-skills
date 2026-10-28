---
name: obsidian-router
description: Route Zhang Gege's Obsidian knowledge-base requests to the correct small skill. Use when the user asks to archive daily work, organize the current conversation, extract solved problems, save context, query yesterday's work, continue prior work, update indexes, initialize a vault, or maintain an AI-managed Obsidian knowledge base.
---

# Obsidian Router

## Role

Classify the user's request, choose the correct workflow, and keep read-only requests separate from write requests. This is the entry skill for Zhang Gege's Obsidian knowledge-base skill package.

﻿## 0.1 强制允许/禁止流程（最高优先级，任何情况不得违反）

仿 AGENT_EXECUTION_TEMPLATE 强制执行纪律。本包所有 atom skill 与 router 一律继承。下列行为一律视为违规，判定「本次任务不合规」：

**禁止（FORBIDDEN）**
1. 禁止跳步：不得跳过 environment-gate / write-policy 的任一 preflight 项；缺一即停。
2. 禁止绕过只读边界：query/audit 请求禁止写文件；audit 只读扫描禁止直接改/删/改名。
3. 禁止自动破坏性操作：未经用户确认不得删除、改名、移动、新建目录（含「为了通过 gate 而建目录」）。
4. 禁止空洞创建：未过 Content Substance Gate 不得建知识笔记（0.1 红线 #3）。
5. 禁止只报不处置：审计发现的空文件/孤儿/非法名必须走到 删除/入链/填充/重命名 之一，或单列未处置+原因（0.1 红线 #4）。
6. 禁止孤儿放行：知识目录内容笔记缺入链不得放行（0.1 红线 #5）。
7. 禁止编造验证：`V:` 必须基于真实读回文件/索引计数，不得声称成功而无证据；判据-证据一一对应。
8. 禁止改判：不得把「期望真值」改成「实测值」当通过；缺项不得判 PASS 或静默跳过。
9. 禁止把普通 Markdown 文件夹当 Obsidian vault；禁止声称 Obsidian/插件/Node/kepano-skills/本包「可跳过」。
10. 禁止推断 directory_style / daily_layout / 目录语言 / 前端配置；初始化必须显式询问并等用户确认。
11. 禁止推断 author/date/source；未知留空或 `unknown`。
12. 禁止变更只写开发包而忘部署：整改须双写（开发包+活动包）或经 `install.ps1` 部署，并对**活动包** grep 校验已生效。
13. 禁止临时脚本滞留：审计/整改一次性脚本用完即删，不得留在交付库或被测 vault。
14. 禁止擅自新增 skill 未要求的文件；新增前须经用户确认。

**允许（ALLOWED，缺项受阻时）**
- 只读查询/审计/出报告；出删除/改名/移动计划（dry-run）等用户确认；给安装指引；问 `vault_path`；读源项目做分析。

**唯一例外**：用户明确确认要调整的环节可按用户指令调整，但必须当场记录「用户确认调整」+原因。

**遇阻即停**：任一强制项做不到（路径不存在/插件缺/权限不足）→ 立即停该项并上报「未满足 编号 原因」，不得绕过继续。



## Procedure

1. Read `references/profile.md`.
2. Read `references/status-protocol.md`.
3. Read `references/trigger-map.md`.
4. For full organization, reusable knowledge, lifecycle, or future retrieval/use requests, read `references/lifecycle-playbook.md`.
5. For first-run, initialization, empty vault, or bootstrap requests, read `references/empty-vault-bootstrap.md`.
6. For project file migration, asset archiving, or requests that the vault should be portable by itself, read `references/project-file-archive.md`.
7. For customer onboarding, reference-source, or plugin setup requests, read `references/source-plugin-guide.md`.
8. For missing skill installation, read `references/install-required-skills.md` and do not search for alternate skill sources.
9. Match the user's wording to exactly one intent.
10. Resolve the project config using `references/vault-contract.md`.
11. Before any formal write intent, enforce `references/environment-gate.md`: Obsidian Desktop, opened target vault, required Obsidian plugins, Node/npm for skill installation, `kepano/obsidian-skills`, and this skill package must all be ready.
12. If any required item is missing, stop and output only the missing-item checklist plus installation instructions.
13. If `.obsidian.yaml` is missing or incomplete, use `references/init-dialog.md`.
14. For write intents, read `references/write-policy.md` before invoking write skills.
15. If the chosen intent is read-only, do not write files.
16. Invoke or follow the matching atom skill:
   - `obsidian-analyst` for multi-role classification before writing
   - `obsidian-capture` for raw source preservation
   - `obsidian-daily` for daily archive notes
   - `obsidian-distill` for reusable knowledge notes
   - `obsidian-solve` for solved problem records
   - `obsidian-query` for yesterday/current/history reports and for topic lookup: trigger phrases `读取知识库中关于X的流程/文档`、`查一下知识库里X是怎么做的`、`找一下X的文档`。铁律：主题查档必须走 query 语义检索（assets/build-index.mjs --query），并返回带路径的命中排序；严禁用 shell 的 Get-ChildItem/文件名 grep 代替。
   - `obsidian-index` for indexes and maps
17. For lifecycle tasks, report future retrieval phrases and use modes from `lifecycle-playbook.md`.
18. For empty vault bootstrap, report the detected empty state, selected roles, created seed files, and first retrieval phrases.
19. For project file archives, report copied files, skipped files, manifest path, and whether original project files were left in place.
20. Report which intent was selected and which files were read, created, or updated.

## Guardrails

- Do not let a query request write files.
- Do not perform formal writes when required software, plugins, or skills are missing.
- Do not let a daily archive become the only knowledge output when reusable knowledge exists.
- Do not create duplicate notes before searching existing notes.
- Do not invent sources, dates, verification, or user confirmation.
- During first initialization, require an explicit directory language choice (`中文` or `English`); never infer it from locale, message language, or a hard-coded default.
- Preserve raw context before distilling.
- Preserve useful project files inside the vault when the user expects the vault to be portable; copy archives by default and do not delete runnable source project files.
- Every user-provided fragment must enter the database at least as source or inbox; role analysis may only decide whether extra durable notes are needed.
- For full organization, enforce the fragment-to-use lifecycle; storage alone is incomplete.
- Emit short OODA-like status lines for every task.
- Atom skills invoked directly must still load `references/contract-map.md` and follow `references/write-policy.md`.

## Canonical Flow

Use this shape for full session organization:

`analyst -> capture -> daily -> solve -> distill -> index -> report`

Use this shape for lifecycle organization:

`analyst -> capture -> daily -> solve -> distill -> index -> retrieval/use report`

Use this shape for first-run empty vault bootstrap:

`environment gate -> init/config -> empty-state detection -> project context scan -> analyst -> skeleton/index -> first knowledge event -> retrieval/use report`

Use this shape for yesterday reports:

`query -> report`

Use this shape for solved-problem recording:

`analyst -> capture -> solve -> daily -> index -> report`
