# Trigger Map

Route by intent before doing any file operation.

## Priority

1. `obsidian-query`: read-only reports win when the user says show/send/list/report without save/write/update.
2. `obsidian-solve`: solved-problem extraction wins when the user asks what problems were solved and to record them.
3. `obsidian-capture`: raw preservation wins when the user asks to save context/source only.
4. `obsidian-daily`: daily archive wins when the user asks what happened today or to update the date log.
5. Lifecycle organization wins when the user asks how fragments become reusable knowledge or asks "以后怎么检索/使用".
6. `obsidian-suggest`: extraction candidate suggestion wins when the user asks what's worth extracting or to scan the session.
7. Empty vault bootstrap wins when the user asks what happens on first organization or when the vault is empty.
7. Project file archive wins when the user asks to move/classify key files into the vault or make the vault portable for migration.
8. `obsidian-distill`: reusable knowledge wins when the user asks to organize/distill the current conversation.
9. `obsidian-index`: maintenance wins when the user asks to initialize, repair, rebuild, or check the vault.

## Trigger Table

| Intent | Chinese triggers | Required skills | Write |
| --- | --- | --- | --- |
| solved problems to database | `列举当前会话解决了哪些问题`, `提取并录入数据库`, `已解决问题入库`, `问题和解决方案记录` | `obsidian-analyst`, `obsidian-capture`, `obsidian-solve`, `obsidian-daily`, `obsidian-index` | Yes |
| current session full organization | `将当前会话整理到知识库`, `沉淀这次对话`, `保存为长期知识`, `整理上下文` | `obsidian-analyst`, `obsidian-capture`, `obsidian-daily`, `obsidian-solve`, `obsidian-distill`, `obsidian-index` | Yes |
| full lifecycle organization | `碎片整理成以后能用的知识`, `碎片 -> 整理 -> 归类 -> 存储 -> 检索 -> 使用`, `告诉我以后怎么检索和使用`, `长期累积知识库` | `obsidian-analyst`, `obsidian-capture`, `obsidian-daily`, `obsidian-solve`, `obsidian-distill`, `obsidian-index`, `lifecycle-playbook.md` | Yes |
| empty vault bootstrap | `知识库目录还是空`, `第一次整理知识库`, `空 vault 初始化`, `最初触发整理`, `先理解项目再建知识库架构` | `empty-vault-bootstrap.md`, `obsidian-analyst`, `obsidian-index`, then selected write skills | Yes |
| project file archive | `关键文件移动到知识库`, `关键文件归类`, `项目文件归档`, `后续直接迁移知识库`, `迁移知识库即可`, `把目录下的文件移动归类到知识库` | `project-file-archive.md`, `obsidian-index` | Yes |
| role-based analysis | `程序员维度`, `架构师维度`, `短视频`, `个人作家知识库`, `多角色分析`, `知识库分析师`, `女娲视角` | `obsidian-analyst`, then selected write/query skills | Maybe |
| customer setup docs | `参考来源`, `插件安装说明`, `客户上手文档`, `需要安装什么`, `Obsidian 插件怎么装` | `source-plugin-guide.md`, maybe `obsidian-query` or `obsidian-index` | No unless user asks to update docs |
| raw capture only | `保存原始会话`, `保存上下文`, `先存原文`, `归档原始记录` | `obsidian-capture` | Yes |
| daily archive | `归档今天`, `更新每日记录`, `今天做了什么写进去`, `每日归档` | `obsidian-daily` | Yes |
| query/report | `昨天做了什么`, `将昨天的工作内容目录详情发给我`, `查看遗留问题`, `发我记录`, `列出来`, `读取知识库中关于X的步骤/流程`, `查一下知识库里X是怎么做的`, `找一下X的文档/做法`, `knowledge-related query` | `obsidian-query` | No |
| continue work | `继续昨天`, `接着上次`, `续上`, `恢复上下文`, `继续XX项目`, `上次做到哪了` | `obsidian-query`, maybe `obsidian-daily` or `obsidian-solve` or `obsidian-project` | Maybe |
| vault maintenance | `初始化知识库`, `重建索引`, `检查完整性`, `修复索引`, `整理目录结构` | `obsidian-index` | Yes |
| suggest extraction candidates | `建议提取`, `有什么可以整理的`, `扫描会话`, `提炼建议`, `有哪些值得记录的` | `obsidian-suggest` | No (displays candidates; user confirms before write) |

## Read/Write Guard

Read-only verbs:

- 查看
- 发给我
- 列出来
- 汇总
- 报告
- show
- send
- list
- summarize

Write verbs:

- 保存
- 记录
- 录入
- 写入
- 更新
- 归档
- save
- record
- update
- archive

If both appear, write only the explicitly requested target.

## Organization Guard

Ordinary read/list/report organization requests are served by `obsidian-query`, `obsidian-suggest`, or `obsidian-index`. **Do not select `obsidian-project`** for ordinary organization: it is reserved for continuing an explicitly named project's context or resuming previously recorded project work. If "project" is only implied (a topic, a session, or a general request to tidy the vault), route to the lighter skills instead. Example: "list solved problems and record them" writes problem records but should still report the list.

## Example Routes

`列举出当前会话都解决了那些问题，提取并录入数据库`

Use: `obsidian-analyst -> obsidian-capture -> obsidian-solve -> obsidian-daily -> obsidian-index`

`将当前会话的内容开始整理到知识库`

Use: `obsidian-analyst -> obsidian-capture -> obsidian-daily -> obsidian-solve -> obsidian-distill -> obsidian-index`

`把这些碎片整理成以后能用的知识，并告诉我以后怎么检索和使用`

Use: read `lifecycle-playbook.md`, then `obsidian-analyst -> obsidian-capture -> obsidian-daily -> obsidian-solve -> obsidian-distill -> obsidian-index -> retrieval/use report`

`知识库目录还是空，最初触发整理时应该怎么执行`

Use: read `empty-vault-bootstrap.md`, then `environment gate -> init/config -> empty-state detection -> project context scan -> analyst -> skeleton/index -> first knowledge event -> retrieval/use report`

`补充参考来源和插件安装说明`

Use: read `source-plugin-guide.md`; if the user asks to modify the skill package, update README and related references.

`将昨天的工作内容目录的详情内容发给我`

Use: `obsidian-query` only. Resolve "yesterday" to an exact date and do not write files.
