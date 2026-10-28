# Obsidian Skill 问题汇总（2026-09-04）

> 评估对象：13-skill 包
> - 开发包（源）：`E:\业余\skill\wend\zhanggege-obsidian-skills`
> - 活动包（agent 实际加载）：`C:\Users\lvfushuai\.agents\skills\obsidian-*`
> 评估方法：实测真实 vault `D:/gongzuo/知识库/工作知识库` + 静态通读 router/index 的 references
> 参照基线：`D:\gongzuo\知识库\工作知识库\500-AI Agent\组合工作流\AGENT_EXECUTION_TEMPLATE.md`（强制执行纪律）

---

## 一、真实 vault 暴露的三类用户问题（根因：skill 无检测能力）

| # | 问题 | 现象 | 实测命中样例 |
|---|------|------|------------|
| P1 | 空文件 / 仅标题占位 | 仅 frontmatter 或标题/占位注释，无有效内容 | `vault_audit2.js` 扫描命中（知识目录内） |
| P2 | 非法文件名字符 | 含全角 `？ ／ ＂` 等，Obsidian 点击报 `File name cannot contain...` | `vault_audit2.js` Check8 命中 |
| P3 | 关系图谱孤立文件 | `incoming=0`，图谱无入链 | `orphan5.js` 命中：`91_蒸馏整理/解决/2026-09-04-obsidian审计回归修复-非法文件名与孤立文件.md`、`91_蒸馏整理/方案/2026-09-04-鲁班基线接口需求.md`、`02_项目/lvfs_git/日志平台/README.md`、`08_工单问题/常见问题索引.md`、`10_问题解决/2026-08-07-ooda-problem-verification-test.md`、`90_原始来源/日志/2026-07-31.md`、`Build AI Agents Course/3.9 / 4.12` 等 |

> 这三类是**用户实际遇到**的，但现有审计 skill 完全没有覆盖。

---

## 二、Skill 能力缺口

1. **`obsidian-index/references/vault-audit.md` 原 6 项检查（Root Drift / Type-Dir 不匹配 / 同源矛盾 / Stale 问题 / 缺 confidence / promotion）对 P1/P2/P3 的覆盖 = 0。**
2. **Check 7（空/仅标题）、Check 8（非法文件名）、Check 9（孤儿）的检查本体（Rule/Trigger/Report/Fix）缺失。** 更严重的是 `obsidian-index/SKILL.md` 第 13 步已对外**宣称**含这三类检查 → **文档与实现脱节**（声称有能力，实际 reference 里没有）。
3. **`vault-health-scan.mjs` 从未产出。** `obsidian-index/assets/` 下只有 `templates/`，评估报告 §五承诺的"可复用健康扫描脚本"（复用 `graph-explore.mjs` 的入链能力）没有落地。
4. 查询/主题查档依赖 `obsidian-query/assets/build-index.mjs --query`，但孤儿检测本可复用同目录 `graph-explore.mjs`，二者未被串成一个统一健康扫描入口。

---

## 三、工程流程问题（最严重，直接导致整改失效）

### 3.1 开发包 / 活动包 同步缺口（最高优先级）
- 今日（2026-09-04 早些）用 `_tmp_edit_vault*.cjs / _tmp_edit_wp.cjs / _tmp_edit_mr.cjs` 把"0.1 红线 + 闭环条款 + Content Substance Gate + Hard gate"**只写进了开发包**。
- agent 实际加载的是**活动包** `C:\Users\lvfushuai\.agents\skills\obsidian-*`。
- 校验前实测：活动包 `vault-audit.md` / `write-policy.md` / `maintenance-record.md` **三个文件均不含**任何整改字样。
- **后果：写了红线，agent 真正跑的时候根本看不见。** 这正是缺乏"双写/部署 + grep 校验活动包"纪律的直接后果。

### 3.2 文档完整性损坏（paste/merge 错位）
- `obsidian-router/references/write-policy.md` 的 **Maintenance Record Gate / Verification** 段错位粘贴：`## Verification` 标题被拼成了 `## Verification` if the template already exists; otherwise add ## Updates before ## Related |`，且前面 Append Locations 表的 `problem` 行被截断。属真实文档 bug，非排版问题。

### 3.3 滞留产物 / 卫生
- `obsidian-router/references/trigger-map.md.bak`（备份滞留 references 内）
- 开发包 `obsidian-capture-bak-20260826-132034/`（整目录备份滞留，破坏 13-skill 结构断言）
- 仓库根 `_tmp_edit_vault.mjs` 与 `_tmp_edit_vault.cjs`（**内容完全相同的两份**重复临时脚本）、`_tmp_edit_wp.cjs`、`_tmp_edit_mr.cjs`
- `tmp/` 下 `vault_audit.js / vault_audit2.js / orphan3-5.js / course_refs.js` 一堆审计/调试脚本滞留
- 无"临时脚本用完即删"纪律 → 直接产物。

### 3.4 治理/纪律缺口（对比 AGENT_EXECUTION_TEMPLATE §0.1）
- router 仅有**软 Guardrails**，**无最高优先级"强制允许/禁止"流程**；atom skill 无统一硬约束继承点。
- 无"变更须双写或经 `install.ps1` 部署 + 对活动包 grep 校验"纪律。
- 无"判据-证据一一对应 / `V:` 必须真读回文件"硬约束（验证可被随口声称）。
- 无"遇阻即停上报、不得绕过"的统一条款。

---

## 四、悬空决策（评估报告 §七 未答，阻塞落码）

1. 非法文件名处理：**仅报告** 还是 **允许一键改名为合法名**？
2. 标题-only 处理：**默认归档（移动）** 还是 **补内容**？
3. 是否按方案落码 Check 7/8/9 + 扫描脚本 + 测试？

---

## 五、本次（2026-09-04）已落地的整改（阶段一 · 零破坏，已 grep 校验）

> 说明：本轮已对以下项做了整改并校验通过（活动包与开发包均 OK）。列出以便核对当前真实状态。

| 项 | 落点 | 活动包校验 |
|---|------|----------|
| Check 7/8/9 检查本体（Rule/Trigger/Report/Fix） | 两包 `vault-audit.md` | OK |
| `vault-health-scan.mjs` 只读扫描脚本 | 两包 `obsidian-index/assets/` | OK（3148B，docs 小目录自检 exit 0） |
| 0.1 强制执行红线 + G-A..G-E 闭环条款 | 活动包 `vault-audit.md`（补同步缺口） | OK |
| Content Substance Gate（内容实质校验） | 活动包 `write-policy.md` | OK |
| Hard gate（维护记录完成判据） | 活动包 `maintenance-record.md` | OK |
| 强制允许/禁止流程（仿 AGENT_EXECUTION_TEMPLATE §0.1） | 两包 `obsidian-router/SKILL.md` | OK |

遗留：本次注入用的临时片段 `tmp/_obsidian_repair_fragments/` 与 `_obsidian_repair_inject.cjs` 尚未清理（应删）。

---

## 六、仍待处置（阶段二 · 需用户逐类确认，红线禁止自动执行）

1. **真实 vault 的 P1/P2/P3 实际处置**：删除空文件、非法名重命名、孤儿补入链/归档——按 0.1 红线 #1/#3/#5，必须先出dry-run计划等用户确认，不得自动执行。
2. **修复 `write-policy.md` Maintenance Record Gate / Verification 错位段**（两包）。
3. **清理滞留产物**：`trigger-map.md.bak`、`obsidian-capture-bak-*` 目录、`_tmp_edit_*.cjs/.mjs`、`tmp/` 下审计脚本、本次注入片段。
4. **回答 §四 三项悬空决策**，据此定 Check 7/8/9 的 Fix 默认动作。
5. **建立部署纪律**：以 `install.ps1` 为单一部署通道，或固定"双写 + 活动包 grep 校验"，防 3.1 同步缺口复发。

---

## 七、防复发建议（一句话）

把 AGENT_EXECUTION_TEMPLATE 的"强制执行纪律 + 判据-证据一一对应 + 临时脚本用完即删 + 缺一不合格"迁移进 obsidian-router 作为最高优先级 hard rules，并强制"任何 skill 整改必须双写开发包/活动包且对活动包 grep 校验生效"——本次同步缺口就是缺这一条导致的。
