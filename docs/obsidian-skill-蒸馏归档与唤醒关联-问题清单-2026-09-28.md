---
type: obsidian-skill-issues
date: 2026-09-28
status: active (ooda-strict)
target: zhanggege-obsidian-skills
scope: 蒸馏归档 / 会话hook / 唤醒关联
method: ooda-strict (Observe/Orient/Decide/Act/Verify)
related:
  - obsidian-skill-问题汇总-2026-09-04
  - obsidian-capture-问题清单
  - obsidian-query-索引维护问题清单
---

# Obsidian Skill 问题清单 — 蒸馏归档 与 唤醒关联（2026-09-28）

> 用 ooda 严格模式整理。对象：zhanggege-obsidian-skills 包（开发包 vs 活动包）。
> 实测 vault：E:\业余\my\runtime01201\量化知识库（.obsidian.yaml 指定）。

## O. Observe 实测证据

- 知识库顶层：00_收件箱 / 01_每日工作记录 / 02_项目 / 03_长期领域 / 04_外部资料 / 05_概念 / 06_决策 / 07_人物组织 / 08_技能 / 09_可复用流程 / 10_问题解决 / 90_原始来源 / 91_蒸馏整理 / 99_系统。
- 02_项目 仅 2 个项目：lh-量化交易、loop。
- 02_项目\loop 顶层散落 .raw.md / .json / 归档 md / 治理文档，未按既有子结构（00-设计文档 / 10-协议与接口 / 20-学习规则 / 30-测试记录 / 40-会话归档 / 50-外部参考 / 90-文档归档）归位。
- 91_蒸馏整理 = 思考/方案/解决 三栏 + 名目繁多的平铺蒸馏文件：蒸馏结论笼统堆积于此，未按理论/方法归到 02_项目\<project> 对应位置。
- .obsidian.yaml 的 directories 仅含顶层目录映射，无"项目内部归档路由"；obsidian-distill 的 Distillation Targets 只到顶层（03_Areas/09_Playbooks/...），未绑定 02_项目\<project>\ 内部细分架构。
- 会话 hook 已按日保存完整 user+assistant raw（90_原始来源\会话记录\loop\2026-09-05.raw.md 等，含 user {id} / assistant {id} 锚点），但蒸馏文件未回引这些 turn 锚点。

## OO2. Orient 根因定位（用户诉求 -> 根因 -> 责任skill）

| 用户诉求 | 根因 | 责任skill |
|---|---|---|
| 1. 蒸馏应按知识库架构归位（非笼统 91_蒸馏整理） | Distillation Targets 只到顶层，无项目路由；未按主题/理论归属落 02_项目\<project>\... | obsidian-distill / obsidian-analyst |
| 2. 归档应先扫描整库结构再归位（02_项目/loop 乱） | 无"先扫描 vault 结构->再决定落位"步骤；缺项目子结构镜像 | obsidian-router / obsidian-index |
| 3. hook 应保存 user+agent 全部会话 | logger 丢 function_call/reasoning/developer 消息 + MAX_CONTENT_LEN 截断（capture-问题清单 P0 已记录未闭环） | obsidian-capture |
| 4. 蒸馏后文件必须引用原始会话（唤醒关联） | distill frontmatter 仅 source:路径，无精确到 turn 的双向锚点 | obsidian-distill |

## D. Decide 待定点（需用户拍板后落码）

- D1. 蒸馏/归档输出路由：是否新增"项目内部子结构镜像"（02_项目\<project>\ 下的 00-设计文档/10-协议/... 自动对齐）？
- D2. 会话 hook：是否补录 function_call/output/reasoning/developer 消息 + 提高/移除 MAX_CONTENT_LEN 截断？
- D3. 唤醒关联：蒸馏 frontmatter 是否强制携带 source_reference（文件名：user {id} 精确锚点），query 支持跳回原文 turn？
- D4. 归位判定：归档前是否强制"先扫 02_项目 子结构 + 目标去重"再落盘，杜绝瞎放？

## A. Act 当前处置（仅记录/出计划；红线禁止自动改库）

- 本轮为 read-only 问题整理：未改动 vault 内容、未移动任何文件、未改 skill 代码。
- 已在本 docs 落盘问题清单。待 D1-D4 确认后，再按规则整改（开发包+活动包双写 + grep 校验生效）。

## V. Verify

- 已读：知识库结构 / 02_项目 loop 现状 / 91_蒸馏整理现状 / 会话 hook 保存 / 三个既有问题清单 / obsidian-distill·query·capture SKILL.md / .obsidian.yaml。
- 判据-证据一一对应：每条问题均有实测路径/文件佐证（见 O 段）。
- 本清单独立成文，未覆盖/合并既有清单，避免重复。

## 唤醒关联改进方案（针对用户第 4 点的落地）

1. 会话 raw 已含 user {id} / assistant {id} turn 锚点（可自动解析）。
2. 蒸馏文件 frontmatter 增加字段：
   source: "90_原始来源/会话记录/loop/2026-09-05.raw.md"
   source_reference: ["2026-09-05.raw.md：user {00000031}", "2026-09-05.raw.md：assistant {00000036}"]
3. obsidian-query 对 source_reference 建索引，支持从蒸馏片段跳回原文精确 turn。
4. 归位规则：蒸馏结论按"理论与方法属主"归到 02_项目\<project>\ 对应子目录（设计->00-设计文档、协议->10-协议与接口、复盘->40-会话归档、流程->09_可复用流程），不再笼统进 91_蒸馏整理。

---
## 附录A：02_项目\loop 根目录散落文件 -> 应归位子目录（dry-run 映射，未执行）

> 实测：02_项目\loop 根目录散落 32 个文件；既有子结构已健在，纯属未归位。redesign 清单如下（用户确认后才移动）。

| 应归位子目录 | 归属内容（散落文件名） |
|---|---|
| 00-设计文档 | loop-dev-项目介绍与规划-2026-09-02 / loop-dev系统完整性评估-2026-09-02 / 文档地图与归档决策-2026-09-02 / 自主进化能力评估·第1档·第2档门禁 |
| 10-协议与接口 | loop-dev自主进化后续计划-2026-09-02（接口/门禁相关） |
| 20-学习规则 | loop-dev剩余开发计划-08-30 / 后续开发计划归档-08-30 / 后续开发进度-09-01 / 开发进度交接-新机Agent-08-31 / 开发进度跟进-08-29 |
| 30-测试记录 | ARCHITECT-DSH-FULL-EVAL / ARCHITECT-PLUGIN-* / architect_plugin_triage csv（评估/测试类） |
| 40-会话归档 | *-1551-loop-full-test.raw.md / 1556-l2-evolution*.raw.md / architect-family-bucket.raw.md / architect-skills-fix.raw.md / 2026-08-20_daily.json / 2026-08-21_daily.json |
| 50-外部参考 | ARCH-LOOPDEV-ARCHIVE / LANDING-GOVERNANCE-DISTILL / PM-LESSONS-EXIT-REUSE / PM-MONTHLY-BREAKDOWN-* / PM-R6C-COUNTER-EXTREME-DIAG |
| 保留根 | README.md / STATUS.md / LOG.md（项目入口，随 obsidian-project 维护） |

> 注：本轮仅出映射，未移动任何文件（obsidian 红线：未经确认禁止移动/改名/删除）。待 D4 确认后按此归位。


---

## 附录B：复验发现与修复记录（2026-09-28 复盘，ooda-strict）

> 按既定模式（p9+蜂群+ooda+三轮+破框）对上方 D1-D4 / 唤醒关联方案做端到端复验，确认现状与残余缺陷。

### R1. 已有能力端到端复验（均通过）
| 诉求 | 机制 | 端到端验证 |
|---|---|---|
| 蒸馏按架构归位（不笼统进 91_蒸馏整理） | `.obsidian.yaml` 的 `distill_思考/解决/方案` 路由 + distill-summary.mjs L194-195 | ✅ 实测：思考→`02_项目/loop/00-设计文档/`、解决→`10_问题解决/`；`91_蒸馏整理` 保持 0 文件 |
| hook 全量保存 user+agent 会话 | session-logger 保留 reasoning/function_call/function_output，正文 100k 上限不截断 | ✅ 已实现并双写 |
| 蒸馏引用原始会话精确 turn 锚点 | distill frontmatter `source_reference` + build-index `sourceRef` 并入检索 | ✅（见 R2 修复后）查询可跳回原文 turn |
| 归档先扫整库结构再归位 | obsidian-index Procedure step 7/13 + vault-audit | ✅ 流程已完整接线 |

### R2. 复验新发现缺陷（本轮修复，F6）
- **缺陷**：distill-summary.mjs 分类阶段 `classified[cat].push({ role, text, ts })` **丢弃了 `turn.id`**，导致 frontmatter `source_reference` 恒为 `user {?}@xxx.raw.md`，无法精确唤醒原始 turn（违背诉求 5）。
- **修复**：`classified[cat].push({ role, text, ts, id: turn.id })`，dev+active 双写，node --check exit=0，SHA-256 一致。
- **复验**：构造含 `user {00000031}` 锚点的 raw 实测，蒸馏 frontmatter 现为 `source_reference: - user {00000031}@2026-09-28.raw.md` ✅。
- **影响面**：仅蒸馏 source_reference 锚点精度；不影响分类/归位/去重。

### R3. 残留散落点（待用户确认后归位，红线未移动）
- `02_项目/loop/pm-landing-regulation-20260914/`（14 个 PM 治理 OODA 阶段文件）散落项目根目录，未并入既有编号子结构。建议归入 `30-测试记录` 或 `00-设计文档` 下治理子目录。
- `91_蒸馏整理/思考|方案|解决` 三个**空子目录**残留：新路由已接管，空目录已无产出。可考虑删除或保留为向后兼容占位（需用户确认，红线未删）。
- `02_项目/PM-backup-20260901-165842.tar.gz`：lh 历史备份压缩包，非运行结构（可保留）。
- `02_项目/loop.md`：obsidian-project 合法的项目入口笔记（`type: project`），**不是**散落，应保留。

### R4. 状态更新
- D1-D4 中：D1（项目子结构镜像）已通过 distill_<类别> 路由 + 本期归位实现；D2（hook 全量）已实现；D3（source_reference 唤醒）已实现并通过 R2 修复；D4（归位判定）由 obsidian-index Procedure 保证。
- 遗留待确认：R3 的两个散落点（pm-landing-regulation 归位、91_蒸馏整理空目录处置）。
