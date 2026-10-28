# Obsidian Capture 全链路问题清单

> 梳理日期：2026-08-31
> 梳理范围：采集层（session-logger.mjs / codex-session-logger.mjs）→ 蒸馏层（distill-summary.mjs）→ 查询层（obsidian-query / build-index.mjs）→ 设计文档与实现一致性
> 依据代码：obsidian-capture/assets/*.mjs + SKILL.md + 实际 raw.md 样本（2026-08-28，2725 行）

---

## 一、P0 紧急（数据丢失 / 链路断裂 / Hook 不稳定）

### 1. Function Call / Reasoning / Developer 消息全丢

- **位置**：`codex-session-logger.mjs` L120-L122，`session-logger.mjs` L62
- **现象**：只保留 `role ∈ {user, assistant}` 的 `message` 类型，`function_call`、`function_call_output`、`reasoning`、`developer` 系统上下文全部被丢弃。
- **影响**：回看 raw.md 时看不到 agent 读了什么文件、执行了什么命令、改了什么代码，推理链断裂，像"凭空得出结论"。
- **根因**：设计时把 logger 定位为"轻量文件追加"，为了避免噪音过度过滤。

### 2. readStdin 3 秒超时导致 Hook 静默失败

- **位置**：`session-logger.mjs` L44，`codex-session-logger.mjs` L73
- **现象**：`setTimeout(..., 3000)`，stdin 传输慢时直接 `resolve("")`，后续逻辑拿不到 input，脚本静默退出。
- **影响**：用户以为 hook 在跑，实际数据根本没写入。Windows PowerShell 管道传输大 JSON 时尤其容易触发。
- **根因**：timeout 与 hook 外部配置（PostToolUse timeout=10s）不匹配，内部 3 秒先自杀，外部还以为任务完成。

### 3. findRollout 全量递归扫描 Sessions 目录（Codex 版独有）

- **位置**：`codex-session-logger.mjs` L93-L109
- **现象**：每次 hook 触发递归遍历 `~/.codefuse/engine/codex/sessions`，按 mtime 排序取最新 rollout。
- **影响**：session 积累多了（几百个文件）是磁盘 IO 瓶颈，极易超过 hook 总执行时间。
- **根因**：Codex 没有通过 stdin 传入 `transcript_path`，只能靠猜。Claude 版直接从 stdin 取路径，无此问题。

### 4. MAX_CONTENT_LEN 硬截断长消息

- **位置**：`session-logger.mjs` L16（5000），`codex-session-logger.mjs` L32（8000）
- **现象**：单条 assistant 长回复超过阈值后直接 `substring(0, MAX_CONTENT_LEN)` 截断。
- **影响**：模板 v6 完整内容、复杂 RUNBOOK、长替换脚本都被截断，丢失尾部关键信息。
- **根因**：没有区分"增量写入的轻量性"与"内容完整性"，一刀切截断。

### 5. Daily JSON 完全未实现（设计与实现严重脱节）

- **位置**：SKILL.md L211-L270 定义了 schema，但两个 logger 都没写
- **现象**：`{YYYY-MM-DD}_daily.json` 应该包含 `files_touched`、`key_decisions`、`problems_solved`、`rounds` 等结构化字段，实际不存在。
- **影响**：AI 快速召回能力完全丧失。设计文档说"future AI agent 可以读 summary 快速理解上次做了什么"，但文件根本没生成。
- **根因**：设计文档写了规范，实现时只做了 raw.md 落盘，没做 JSON 层。

### 6. Stop Hook 未生成 `{timestamp}-topic.raw.md`（设计与实现脱节）

- **位置**：SKILL.md Q1/Q3 说 Stop 时生成完整归档，`session-summary.mjs` 实际行为不同
- **现象**：Stop hook 只写了 `01_每日工作记录/YYYY-MM-DD.md`（消息数 + 最后 5 条话题），没有生成带 topic 的完整 raw.md。
- **影响**：设计说"Stop 生成完整会话归档"，实际只写了极简 daily note，没有 topic 级归档文件。
- **根因**：`session-summary.mjs` 被当成 Stop hook 的实现，但它只做摘要，不做完整归档。

---

## 二、P1 重要（内容质量差 / 无法回溯 / 关联弱）

### 7. 蒸馏只有关键词三类分类，无语义理解

- **位置**：`distill-summary.mjs` L19-L47
- **现象**：纯关键词匹配（思考 / 解决 / 方案），按单条 turn 分类，一条消息同时含思考+方案+执行时硬塞进一类。
- **影响**：高结构化工作流（模板迭代、RUNBOOK 修正、容器排查）被拍扁成三堆，丢失 2/3 信息。
- **根因**：没有使用 LLM 做语义提取，也没有按工作单元分段。

### 8. 会话内多工作单元边界丢失

- **位置**：`distill-summary.mjs` 整体逻辑
- **现象**：2026-08-28 这场会话实际含 4 个独立单元（模板 v3→v6 迭代、RUNBOOK 对齐、目录清理、容器基线排查），但蒸馏后全部搅在一起。
- **影响**：用户无法从蒸馏文件中看出"哪部分属于哪个任务"。
- **根因**：没有主题分段 / 工作单元识别逻辑。

### 9. Distill 与 Raw.md 关联弱

- **位置**：`distill-summary.mjs` L188
- **现象**：蒸馏文件 frontmatter 只有一个 `source: 90_原始来源/.../2026-08-28.raw.md`，正文里没有精确到 turn 的锚点。
- **影响**：看到蒸馏片段里的某句话，想回到原始上下文，只能打开 2725 行的 raw.md 手动翻。
- **根因**：没有建立" distill 段落 → raw.md turn 锚点"的双向链接。

### 10. 查询层无法从 Distill 跳转回 Raw.md 具体位置

- **位置**：`obsidian-query` / `build-index.mjs`
- **现象**：TF-IDF 索引按文件粒度，超大 raw.md（2725 行）被当成一个巨大文档，无法精确到内部段落。
- **影响**：搜索"模板 v6"可能命中 distill 文件，但无法一键定位到 raw.md 中用户说"模板 v6 修正结果"的那个 turn。
- **根因**：没有 turn-level 分块索引，也没有针对 UUID 锚点的召回能力。

### 11. UUID 锚点设计了但没被查询层利用

- **位置**：SKILL.md L303 设计要求，`obsidian-query` 实现缺失
- **现象**：raw.md 每条消息有 `{000001c3}` 这种 8 位 hex 锚点，但查询层没有按 UUID 索引或召回的能力。
- **影响**：设计了 block-level recall 的入口，但没有通路。
- **根因**：查询层（build-index.mjs）没有读取和利用这些锚点。

### 12. TopicSlug 由首条 User 消息决定

- **位置**：`distill-summary.mjs` L167-L168
- **现象**：`turns[0].text.substring(0, 60)` 作为整份蒸馏文件的标题。
- **影响**：2026-08-28 首条消息是"现在的模板修复的如何了？"，蒸馏文件就叫这个，完全不能代表后面 6 小时的容器排查工作。
- **根因**：没有按工作单元提取 topic，也没有用 LLM 生成摘要标题。

---

## 三、P2 优化（一致性 / 体验 / 可靠性）

### 13. Claude 版与 Codex 版过滤策略、截断标准不一致

- **位置**：`session-logger.mjs` vs `codex-session-logger.mjs`
- **现象**：
  - 截断：5000 vs 8000
  - 垃圾过滤：Claude 过滤 `<relevant-memories>`，Codex 过滤 `SYSTEM_MARKERS`
  - 获取 transcript：Claude 直接 stdin 传 path，Codex 递归扫描
- **影响**：两边维护两套逻辑，bug 修一边另一边漏掉。
- **根因**：Codex 版是后来"镜像"Claude 版的，但镜像时保留了差异。

### 14. Session-Summary.mjs O(n²) 循环 + 信息价值低

- **位置**：`session-summary.mjs` L67
- **现象**：`lines.indexOf(line)` 每次循环从头搜索数组；daily note 只记录最后 5 条 user 消息。
- **影响**：6 小时多主题长会话，daily note 里只有最后 5 条话题，前面工作完全丢失。
- **根因**：没有按工作单元汇总，也没有提取关键决策。

### 15. 同一天多 Session 写入同一个 Raw.md，Frontmatter 信息缺失

- **位置**：`codex-session-logger.mjs` L203，`session-logger.mjs` L142
- **现象**：文件名是 `YYYY-MM-DD.raw.md`，同一天多个 session 的内容追加到同一个文件。frontmatter 只记录了第一个 session 的 `session_id`。
- **影响**：无法从文件名区分当天有几个 session，frontmatter 的 session 字段与后面追加的内容对不上。
- **根因**：按天聚合的设计没有考虑多 session 边界。

### 16. 增量写入依赖行号，无内容哈希校验

- **位置**：`.session-state` 格式
- **现象**：state 文件记录 `<session_id> <lastLine> <counter>`，如果 rollout JSONL 中间插入/删除行，增量会错位。
- **影响**：重复写入或跳过内容，raw.md 里出现重复 turn 或缺失 turn。
- **根因**：没有行内容哈希校验（如记录最后一行的 checksum）。

---

## 四、问题分层总览

```
采集层（Logger）          蒸馏层（Distill）          查询层（Query）           设计一致性
─────────────────────────────────────────────────────────────────────────────────────────
P0-1 内容缺失              P0-7 关键词分类粗糙         P0-10 索引粒度粗          P0-5 Daily JSON 未实现
P0-2 超时                  P0-8 工作单元边界丢失       P0-11 UUID 锚点未利用      P0-6 Stop 归档未实现
P0-3 递归扫描              P0-9 关联弱                 P0-12 TopicSlug 不准
P0-4 截断
P0-15 多 session 混写
P0-16 增量无校验

P2-13 两版不一致
P2-14 Summary 价值低
```

---

## 五、修复优先级建议

| 阶段 | 目标 | 涉及问题 |
|------|------|----------|
| **第一阶段**（让 hook 稳定完整地跑） | 解决超时 + 补全内容 + 修复可靠性 | P0-1, P0-2, P0-3, P0-4, P0-15, P0-16 |
| **第二阶段**（让整理出来的东西能用） | 重建蒸馏逻辑 + 增强关联 | P0-7, P0-8, P0-9, P0-12, P1-14 |
| **第三阶段**（让查询能精准回溯） | 索引优化 + UUID 锚点利用 | P0-10, P0-11 |
| **第四阶段**（填补设计债务） | 实现 Daily JSON + Stop 归档 + 两版统一 | P0-5, P0-6, P2-13 |
