# 张格格 Obsidian 知识库技能组

这是一组供 AI 编程助手使用的 Obsidian Skills。它把对话、工作过程、项目状态、问题解决和长期知识保存到真实 Obsidian Vault，并保留来源、日期和读写边界。

当前版本包含 10 个 Skill，而不是一个包办所有工作的总 Skill。

## 版本

### v1.7.1 (2026-09-28) — F4 锚点碰撞 + F6 蒸馏锚点 + F7 BOM 修复
- capture：logger 新增 computeFileMaxAnchor 取文件最大 hex 锚，锚起点=max(会话计数, 文件 max)+1，消除同日跨会话碰撞；`sessions` 对齐 SESSIONS_DIR；distill frontmatter source_reference 携带精确 turn id（修 classified 丢 id）；node --check 全0 + 3 轮功能 + 破框 5 场 + 全局复制双写全绿；vault-health-scan 去 shebang 前 BOM。

### v1.7.0 (2026-09-28) — 会话全量保存 + 蒸馏归位路由 + 源引用唤醒
- capture 全量保存：hook 保留 assistant-reasoning/function_call/function_output，正文不截断(100k 上限)。
- 蒸馏：`.obsidian.yaml` 的 `distill_思考/解决/方案` 归位路由(缺省回退 `91_蒸馏整理/<cat>`) + frontmatter 加 `source_reference` 锚点唤醒原始会话。
- query 唤醒索引：`build-index.mjs` 解析多行 `source_reference` 存 `sourceRef` 并入检索。
- 缺陷修复：F1 多行列表解析 / F2 去重键 / F3 补充块归并 / F5 安全上限 / BOM；验证：validate-package 通过、功能+破框测试全绿、双写 SHA-256 一致。

### v1.6.0 (2026-09-04) — 审计能力扩展：低内容/非法文件名/关系孤立

**功能：`obsidian-index` 的 vault-audit 增加 Check 7/8/9，写入侧增加创建时文件名校验**

- **Check 7 Only-Title/Empty Notes**：识别只有标题/占位的空笔记（去 frontmatter/标题/注释后的有效内容 < 阈值），建议归档/补内容/删除。
- **Check 8 Illegal Filename Characters**：识别 ASCII 禁止字符（* " \ / < > : | ?）及全角形似字符（？、“ ”），只报告并建议安全重命名（不自动改名）。
- **Check 9 Orphan Relationship Files**：复用 `obsidian-query/assets/graph-explore.mjs` 的 incoming 计算，识别无入链的文件；排除结构/维护记录/原始会话等正常图根。
- **write-policy 新增 Filename Validity Gate**：任何创建知识库文件前校验文件名，非法则按 `pause` 征求用户安全重命名。
- 验证：`validate-package.mjs` 未新增失败；库内已实测检出空文件/非法文件名/孤立文件三类。
### v1.5.2 (2026-08-26) — 安装脚本适配 Codex 环境

**修复：`install.ps1` / `install.sh` 在 Codex 环境（`cfuse --cx`）用不了、hook 不生效**

- 原因一：安装脚本的 Codex skills 目录只写了标准 `~/.codex/skills`，没检测 CodeFuse/Codex 实际使用的 `~/.codefuse/engine/codex/skills`，导致技能根本没装到生效目录。
- 原因二：hook 配置只写了 Claude 引擎的 `.claude/settings.json`（指向 `session-logger.mjs`），完全没配置 Codex 的 `~/.codefuse/engine/codex/hooks.json`（Codex 需要 `codex-session-logger.mjs`），所以即使装上技能也不落盘。
- 修复：
  - `$envs` / `install_to_env` 新增 `~/.codefuse/engine/codex/skills`（Codex (CodeFuse)）优先级入口，并保留标准 `~/.codex/skills`。
  - 新增 «Codex hooks 自动配置»：检测 `~/.codefuse/engine/codex/hooks.json`，安全合并（去重）到 `PostToolUse`（`matcher ".*"`）与 `Stop`（`matcher ".*"`），追加 `node codex-session-logger.mjs`，**不带 `async`**、`timeout: 10`（同步执行），绝不覆盖其它 hook。
  - 修改 hooks.json 前自动备份为 `hooks.json.bak-install-<时间戳>`；写入后提示重新信任 + 重启 `cfuse --cx`。
  - Claude 引擎 `.claude/settings.json` 分支保留为兼容（项目因安全风险不使用 `cfuse --cc`，不主动启用）。
- 验证：
  - 两种 merge 逻辑均对现有 hooks.json 运行：`PostToolUse`/`Stop` 各新增 1 个 logger、无重复、其它 key/block 全部保留、Node JSON 解析通过、无 `async:true`。
  - 重复运行幂等：第二次运行跳过（配置不变）。

### v1.5.1 (2026-08-26) — Codex async hook 修复

**修复：hooks async 不被新版 Codex 支持导致实时落盘静默跳过**

- 现象：本地 `cfuse --cx`（Codex v0.140.0）启动时提示 `skipping async hook ... async hooks are not supported yet`，每次工具调用 / Stop 都不写入知识库。
- 修复：移除 `codex-session-logger.mjs` 所在 hook（PostToolUse 与 Stop）的 `async: true`，改为同步执行（`timeout: 10`），保证实时落盘。
- 验证：重启 `cfuse --cx` 后 2 轮对话 Stop 即落盘，`.session-state` 为三段 `<sid> <已读行> <锚计数>`，raw 块带自增 UUID 锚。
- 同步：`install.ps1` / `install.sh` 生成的 hook 配置也已移除 `async`。

### v1.5.0 (2026-08-20) — RAG 知识库召回改造

**对话块 UUID 锚点 + 蒸馏溯源 + 自然语言查询：**

- **`obsidian-capture` 新增 block UUID**：raw 文件每个对话块（`## HH:MM | speaker`）附加递增 8 位 hex UUID 锚点 `{00000001}`，实现块级精确召回。
- **`obsidian-distill` 新增 `block_sources` 字段**：4 个模板（concept/decision/playbook/problem）新增 `block_sources` frontmatter 字段，蒸馏时记录来源对话块的 UUID，格式 `[[source.raw.md#{uuid}]]`。
- **`obsidian-query` 知识库自然语言召回**：查询从"输入 UUID grep"升级为"自然语言→搜索 distill 笔记→解析 `block_sources`→加载 raw 对话块"。用户不再需要记 UUID，直接说 `知识库查询 rabbitmq 误报` 即可召回历史讨论全文。
- **`trigger-map` 新增知识库查询路由**：`知识库查询 xxx` / `记忆检索 xxx` 路由到 obsidian-query。

**涉及文件**：8 个（2 个 SKILL.md + 4 个模板 + 1 个 trigger-map + 1 个 contract-map）。

### v1.4.0 (2026-08-20) — Hook 修复 + 每日 JSON + 初始化自动配置

**Hook 会话捕获修复：**

- **`obsidian-capture` 新增 Hook Context Detection**：Stop hook 子 Agent 无法直接看到主对话，Skill 现在通过解析 `$ARGUMENTS` 中的 `transcript_path`，读取 JSONL 转录文件获取对话内容。彻底解决"hook 触发了但保存空内容"的问题。
- **新增 Daily JSON Output**：每次 capture 同时产出 `{date}_daily.json`，结构化存储会话轮次、摘要、关键决策、修改文件列表，专为 AI 快速召回设计。
- **新增 Hooks Usage Guide**：SKILL.md 中完整的使用指南（Q1 怎么用/Q2 怎么查看/Q3 其他项目怎么开启）。

**初始化自动配置 Hook：**

- **`init-dialog.md` 新增 Auto-Configure Session Capture Hook**：写完 `.obsidian.yaml` 后自动检测/创建/合并 `.claude/settings.local.json`，写入 Stop hook 指向 `obsidian-capture`。新项目初始化后即可自动捕获会话，无需手动配置。
- **`empty-vault-bootstrap.md`**：Step 2 加入 hook auto-config 说明，Step 7 加入会话归档目录创建。

**知识库 artifact 更新：**

- **`lifecycle-playbook.md`**：Minimum storage set 加入 `_daily.json` artifact。
- **`vault-contract.md`**：新增 sessions 目录 override 说明。
- **`obsidian-suggest` / `obsidian-query`**：输入源加入 daily JSON，利用结构化数据加速 AI 召回。
- **`acceptance-tests.md`**：新增 Test 1B — Hook Auto-Config After Init。

**Router 流程更新**：bootstrap 流程加入 `hook auto-config` 步骤。

**涉及文件**：11 个文件修改（4 个 Skill SKILL.md + 6 个 router references + 1 个模板）。

### v1.3.0 (2026-08-13) — 自动记忆 + 混合检索

基于 TencentDB Agent Memory L0-L3 分层模型和 Graph RAG 混合检索思路，实现知识库基建的三项核心能力。

**自动 L0 会话记录：**

- **新增 `obsidian-capture` Auto Capture 模式**：`assets/session-logger.mjs` 通过 Claude Code PostToolUse hook 自动读取 transcript JSONL，提取 user/assistant 消息，追加写入 `90_Sources/Sessions/{date}.raw.md`。不再依赖手动触发 capture。
- **角色标记**：每条消息标记 `## HH:MM | user` / `## HH:MM | assistant`，区分证据来源。
- **增量写入**：状态文件 `.session-state` 追踪每个 session 的处理进度，避免重复写入。
- **Hook 配置**：项目 `.claude/settings.json` 中配置 PostToolUse hook，参考 claude-spy 的 stdin 读取模式。

**AI 建议清单：**

- **新增 `obsidian-suggest` skill**：读取 auto-generated L0 session 文件，分析会话内容，输出结构化提取候选（概念/决策/问题），用户确认后写入 vault。
- 触发词：`建议提取`、`有什么可以整理的`、`扫描会话`、`提炼建议`。

**语义检索 + 图谱遍历：**

- **新增 `obsidian-query` 语义检索**：`assets/build-index.mjs` 构建全 vault 的 TF-IDF 索引（纯 Node.js，零外部依赖），支持 `--query` 混合排序搜索。
- **新增 wikilink 图谱遍历**：`assets/graph-explore.mjs` 解析 vault 中所有 `[[wikilink]]` 构建邻接图，支持 BFS N 跳遍历，返回关联笔记子图。
- 语义检索和关键词搜索互补——混合排序解决"存了找不到"的核心痛点。

**集成变更：**

- `trigger-map.md`：新增 `obsidian-suggest` 路由和优先级
- `contract-map.md`：新增 auto-capture 和 suggest 权威引用
- `obsidian-capture/SKILL.md`：文档化两种 capture 模式（Auto / Manual）
- `obsidian-query/SKILL.md`：文档化语义检索和图谱探索

### v1.2.0 (2026-08-06) — 写入质量基础设施

基于 P9 方法论完成 P0-P2 三级修复，写入前从单路标题匹配升级为三路交叉验证 + 目录判决 + 证据分层。

**P0 — 写入前多路匹配：**

- **write-policy 新增 Multi-Path Matching**：三路匹配（Path 1 标题归一化 / Path 2 source 交叉 / Path 3 内容关键词重叠）→ 组合为 high/medium/low 三级置信度。high（≥2 路命中）自动 merge/append，medium（单路命中）列候选让用户确认，low 正常创建。Path 3 搜索范围为"目标目录 + 全局索引同 type 文件"
- **新增 `confirm-merge` 动作**：模糊匹配时不盲写，列出候选让用户决定

**P1 — 目录判决规则：**

- **新建 `directory-routing.md`**：为 4 个活跃知识目录（概念/决策/操作手册/问题解决）定义正反向 yes/no 指标 + 6 条优先级链。根目录禁令：内容笔记不进根目录，只放 _index.md
- **distill 写入前加载 `directory-routing.md`**：不再凭一句话描述判断目录

**P2 — 证据分层字段：**

- **note-schema 新增 `superseded` 状态**：concept/playbook/skill 支持"被推翻"，旧笔记保留（双向链接 `superseded_by` / `supersedes`），知识演进可追溯
- **新增 `confidence` 字段**：confirmed / probable / speculative，记录写入时的证据强度
- **write-policy 新增 `supersede` 动作**：核心结论被推翻时，标记旧笔记、创建新笔记、双向链接，旧文件不删除

**验证体系更新**：L2 契约断言 44→51 条，L5 集成场景 3→6 个，全量断言 146→81 条（重构后独立计数）

### v1.1.0 (2026-08-04) — P9 全量修复版

基于 P9 方法论对 9 个 Skill 完成 7 维度评估，修复 8 个问题，建立 5 层 146 条断言验证体系。

**P0 — 行为正确性修复：**

- **Router 统一预检**：写入前三路并行收集 blocker（Config + Project Identity + Environment），一次报告所有阻塞条件，不再短路丢信息。创建型意图（init/bootstrap）不被 config 缺失误拦
- **目录校验**：初始化时扫描 vault 已有目录结构，写入前对比配置映射与 vault 实际目录；非空 vault 不静默创建不匹配的新目录，先报告差异等待确认

**P1 — 契约强度加固：**

- **Distill Reuse Test 量化**：从一句话替换为 5 条 yes/no 检查项（Repeatable / Decision trail / Compresses / Cross-project / Retrievable），至少 2 条命中才创建 durable note
- **中文归一化规则**：从 "compare obvious synonyms" 改为两级机械归一化——去标点 → 剥离 16 个常见前后缀 → 归一化结果短于 3 字符进入 needs-review 而非自动合并

**P2 — 测试覆盖补全：**

- **Analyst + Distill 独立 fixture**：新增 distill 专项测试（source backlink、frontmatter 必填字段、幂等）+ analyst output contract 契约断言
- **Query 内容验证**：从仅验证"不写文件"扩展为验证"读到正确数据"（daily 内容可定位、problem note 可查找到、读取不修改 vault）

**P3 — 边界场景覆盖：**

- **Capture 超长会话分片**：50+ 轮会话按编号分割为多个 source note，交叉 wikilink，保留优先级（需求 → 决策 → 文件路径 → 其他）
- **Query 语义检索**：新增 Content Search 类型（按主题/关键词搜索 source note、problem note、daily note）；Capture 同步新增 extraction_candidates 填写规则

**验证体系**：5 层可执行验证（validate / contract 44 条 / fixture 35 条 / complex-scenario 26 条 / full-fix 41 条）

### v1.0.0 (2026-07-31)

初始版本，9 个 Skill 完整功能。

## 核心模型

```text
控制与引导
  .obsidian.yaml / contracts / templates

证据归档
  Inbox / Source / Daily

项目工作记忆
  Project Entry / STATUS / LOG / Project Topics

长期知识
  Problem / Concept / Decision / Playbook / Skill

派生导航
  Project Index / Knowledge Index / Problem Index
```

关键边界：

- Source 保存原始证据。
- Daily 回答某天发生了什么。
- STATUS 保存项目当前快照。
- LOG 保存有意义的项目事件。
- Project Topic 保存项目范围内的结论。
- 长期知识必须具有跨项目复用价值。
- Index 只负责导航，可以从笔记重建。

完整执行规则以 [Contract Map](obsidian-router/references/contract-map.md) 指向的文件为准，README 不重复定义协议。

## 技能组成

| Skill | 职责 | 常见触发 |
| --- | --- | --- |
| `obsidian-router` | 判断意图并选择唯一流程 | `整理到知识库` |
| `obsidian-analyst` | 多角色分析和写入规划，不直接写 Vault | `从程序员和架构师角度分析` |
| `obsidian-capture` | 保存原始上下文和来源 | `先保存当前会话原文` |
| `obsidian-daily` | 写入日期归档 | `归档今天的工作` |
| `obsidian-distill` | 生成跨项目长期知识 | `沉淀这次对话` |
| `obsidian-solve` | 保存问题、根因、方案和验证 | `记录当前会话解决的问题` |
| `obsidian-project` | 维护和只读恢复项目工作记忆 | `记录 Alpha 项目进展`、`继续 Alpha 项目` |
| `obsidian-query` | 只读查询日期、问题和历史记录；自然语言知识库召回（搜索蒸馏笔记→溯源原始对话块） | `昨天做了什么`、`知识库查询 rabbitmq 误报` |
| `obsidian-suggest` | 扫描 L0 会话，建议可提取的概念/决策/问题 | `有什么可以整理的`、`扫描会话` |
| `obsidian-index` | 初始化、重建索引和检查完整性 | `重建知识库索引` |

## 安装

Windows：

```powershell
.\install.ps1
```

macOS、Linux 或 Git Bash：

```bash
bash install.sh
```

详细步骤见 [安装与初始化](docs/installation.md)。

当前版本正式写入前要求真实 Obsidian Vault、目标 Vault 已打开、必备插件、Node/npm、`kepano/obsidian-skills` 和本技能包均可用。唯一环境判断以 [environment-gate.md](obsidian-router/references/environment-gate.md) 为准。

## 初始化

在需要连接 Vault 的项目根目录说：

```text
初始化当前项目的 Obsidian 知识库配置。
```

Agent 会创建项目根目录的 `.obsidian.yaml`，并自动配置 `.claude/settings.local.json` 的 Stop hook（会话结束时自动保存到知识库）。目录语言必须明确选择 `中文` 或 `English`，不能根据系统语言推断。

不要第一次就整理整个正式 Vault。先在测试 Vault 中验证路径、日期、链接、幂等和只读行为。

## 常用命令

```text
先保存当前会话原文。
归档今天的工作。
扫描当前会话，有什么可以整理的。
将当前会话整理到知识库。
列举当前会话解决的问题并录入。
昨天做了什么，发我详情。
查找上次关于 Redis 缓存的讨论。
知识库查询 rabbitmq 管理插件误报。
记忆检索 nginx 配置优化。
为 Alpha 项目初始化项目记忆。
记录 Alpha 项目进展：测试通过，下一步补文档。
继续 Alpha 项目。
重建知识库索引。
```

更多用法见 [使用指南](docs/user-guide.md)。

## 自动会话捕获

v1.4.0 起，初始化项目时会自动在 `.claude/settings.local.json` 中配置 Stop hook，会话结束时自动调用 `obsidian-capture` 将对话保存到项目的会话归档目录（`{vault}/{directories.sessions}/{project_name}/`）。无需手动配置 hook。

会话归档包含两种格式：
- `.raw.md` — 完整对话原文（Markdown，人类阅读）。每个对话块附带 8 位 hex UUID 锚点（`{00000001}`），支持块级精确召回。
- `_daily.json` — 结构化轮次 + 摘要 + 关键决策（JSON，AI 快速召回）

如果项目是 v1.3.0 或更早初始化的，手动添加 hook 配置即可——参考 `obsidian-capture/SKILL.md` 中的 **Hooks Usage Guide** 章节。

**Codex 引擎（`cfuse --cx` / `cfuse --codex`）**：v1.5.2 起，`install.ps1` / `install.sh` 会自动检测到 `~/.codefuse/engine/codex/skills` 并把 obsidian-* 链接过去，同时安全合并 `~/.codefuse/engine/codex/hooks.json`（`PostToolUse` / `Stop` 的 `.*` 块追加 `node codex-session-logger.mjs`，同步执行 `timeout: 10`，不含 `async`）。修改前自动备份；写入后需重新信任并用 `cfuse --cx` 重启会话生效。Claude 引擎（`cfuse --cc`）分支保留为兼容，默认不启用。

## 项目工作记忆

旧项目保持兼容：

```text
02_Projects/Alpha.md
```

明确初始化项目记忆后，可增加：

```text
02_Projects/
├── Alpha.md
└── Alpha/
    ├── STATUS.md
    ├── LOG.md
    └── TOPICS/   # 首个真实 Topic 出现时才创建
```

规则：

- `obsidian-project` 是项目状态和项目范围结论的唯一写入者。
- 完整整理可以更新已经存在的项目记忆，但不能隐式初始化伴随目录。
- 一次实质性请求最多追加一条 LOG。
- `继续 Alpha 项目` 默认只读并输出 `V: 未修改文件`。
- Project Topic 不会自动升级为长期 Concept。
- 旧项目不会自动迁移。

完整规则见 [Project Contract](obsidian-project/references/project-contract.md) 和 [Project Resume](obsidian-project/references/project-resume.md)。

## 默认流程

完整整理：

```text
analyst
→ capture (auto L0 — hook-driven, no manual trigger needed)
→ suggest (scan L0, propose extraction candidates)
→ daily
→ optional project update for existing memory
→ solve
→ distill
→ index
→ report
```

项目恢复：

```text
STATUS
→ recent relevant LOG
→ project entry
→ relevant Topics/evidence only as needed
→ read-only report
```

只读查询不会为了“顺便修复”而修改 Vault。

## 配置与目录

Daily 支持两种显式布局：`single-file` 和 `date-directory`。使用日期目录时，在 `.obsidian.yaml` 中同时设置父目录和主文件名，例如：

```yaml
daily_layout: date-directory
daily_filename: summary.md
directories:
  daily: 80-每日记录
```

Agent 会先搜索 canonical 与 legacy Daily 路径；同一天已有旧路径时不会再创建竞争文件。完整规则见 [Vault Contract](obsidian-router/references/vault-contract.md) 和 [Obsidian Daily](obsidian-daily/SKILL.md)。

当前项目配置位于：

```text
.obsidian.yaml
```

逻辑目录包括：

```text
00_Inbox
01_Daily
02_Projects
03_Areas
04_Resources
05_Concepts
06_Decisions
07_People
08_Skills
09_Playbooks
10_Problems
90_Sources
99_System
```

实际目录名必须通过 `.obsidian.yaml` 映射。不要自动重命名客户现有目录。

目录、来源和安全规则见 [Vault Contract](obsidian-router/references/vault-contract.md)。Note 类型和状态值见 [Note Schema](obsidian-router/references/note-schema.md)。

## 读写边界

只读示例：

```text
查看、列出来、汇总、报告、发给我、继续项目
```

写入示例：

```text
保存、记录、录入、写入、更新、归档、初始化项目记忆
```

如果一句话同时包含读写动作，只写明确指定的目标。

## 验证

开发修改后执行 5 层验证：

| 层 | 命令 | 验证内容 |
|----|------|----------|
| L1 静态结构 | `node scripts/validate-package.mjs` | 文件结构、frontmatter、链接、禁止短语 |
| L2 契约断言 | `node scripts/run-contract-evals.mjs` | 51 条规则 token 跨 15 个权威文件 |
| L3 行为 fixture | `node scripts/run-fixture-evals.mjs` | 35 条 SHA256 快照隔离测试 |
| L4 复杂场景 | `node scripts/run-complex-scenario-evals.mjs` | 3 个端到端场景 26 条断言 |
| L5 全量修复 | `node scripts/run-full-fix-evals.mjs` | 6 个专项场景 81 条断言 |

```powershell
node scripts/validate-package.mjs
node scripts/run-contract-evals.mjs
node scripts/run-fixture-evals.mjs
node scripts/run-complex-scenario-evals.mjs
node scripts/run-full-fix-evals.mjs
```

书面场景见 [acceptance-tests.md](obsidian-router/references/acceptance-tests.md)。

## 维护规则

一次行为修改遵循：

```text
修改唯一权威 contract
→ 更新直接消费者
→ 增加或修改 acceptance case
→ 运行 validator 和相关 eval
```

不要在 README、多个 Skill 和多个 reference 中复制同一份规则。需要查找权威文件时，从 [Contract Map](obsidian-router/references/contract-map.md) 开始。

## 文档导航

- [安装与初始化](docs/installation.md)
- [使用指南](docs/user-guide.md)
- [契约导航](obsidian-router/references/contract-map.md)
- [环境门槛](obsidian-router/references/environment-gate.md)
- [Vault 契约](obsidian-router/references/vault-contract.md)
- [Note Schema](obsidian-router/references/note-schema.md)
- [触发路由](obsidian-router/references/trigger-map.md)
- [写入策略](obsidian-router/references/write-policy.md)
- [知识生命周期](obsidian-router/references/lifecycle-playbook.md)
- [项目工作记忆](obsidian-project/references/project-contract.md)
- [索引规则](obsidian-index/references/index-schemas.md)
- [验收场景](obsidian-router/references/acceptance-tests.md)

## 安全原则

- 不删除原始来源。
- 不自动移动或重命名客户文件。
- 不猜作者、日期、路径和验证结果。
- 不把索引当作事实来源。
- 不在缺少正式环境时写入生产 Vault。
- 不在生产 Vault 上运行首次测试。
- 不自动创建配置目录以外的目录——写入前扫描 vault 已有结构，发现不匹配时先确认。
- 不静默创建目录——目标目录不存在且 vault 非空时，报告差异并等待用户确认。
