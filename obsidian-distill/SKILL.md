---
name: obsidian-distill
description: Distill an AI coding conversation into reusable cross-project Obsidian knowledge notes. Use when the user asks to organize the current conversation, extract reusable knowledge, create concepts, decisions, skills, playbooks, resources, or turn context into long-term knowledge. Route project status, progress, and project-scoped conclusions to obsidian-project instead.
---

# Obsidian Distill

## Role

Turn conversation content into reusable knowledge. This skill writes evergreen notes, not raw archives.

Emit short status lines using `obsidian-router/references/status-protocol.md`.

## Distillation Targets

Route distilled items to the configured directory mappings from `.obsidian.yaml`.

Default English examples:

- `03_Areas/` for long-term domains
- `04_Resources/` for external materials
- `05_Concepts/` for concepts and models
- `06_Decisions/` for choices and tradeoffs
- `08_Skills/` for agent skill specifications
- `09_Playbooks/` for repeatable workflows
- `10_Problems/` for solved or open problems

Chinese mappings use the same logical lanes, for example `02_项目/`, `05_概念/`, `06_决策/`, `09_可复用流程/`, and `10_问题解决/`.

## Required References

Before writing, read:

1. `../obsidian-router/references/status-protocol.md`
2. `../obsidian-router/references/environment-gate.md`
3. `../obsidian-router/references/vault-contract.md`
4. `../obsidian-router/references/write-policy.md`
5. `../obsidian-router/references/lifecycle-playbook.md` when the user asks for long-term use, reusable knowledge, full conversation organization, or the fragment-to-use lifecycle.

## Procedure

1. If the context spans multiple domains, run `obsidian-analyst` first and use its routing plan.
2. Ensure a raw source note exists. If not, use `obsidian-capture` first.
3. Extract useful atoms:
   - problem
   - conclusion
   - decision
   - method
   - concept
   - resource
   - skill idea
   - open question
   Project state is not a distillation target. Hand it to `obsidian-project`.
4. Search existing notes by title, synonym, tag, source link, and project name.
5. Use `write-policy.md` to choose `append`, `merge`, `create`, `source-only`, `link-existing`, or `pause`.
6. Update existing notes when possible.
7. Create new notes only for new durable knowledge.
8. Link every note back to the source note.
9. For every durable note, add or report how it can be retrieved and used later.
10. Never create or update project entry, STATUS, LOG, or project Topic files.

## Reuse Test

Before creating a durable note, answer each question yes or no. A note qualifies only when at least 2 answers are yes. Items that fail stay in Source or Inbox.

1. **Repeatable**: Can a future task follow the same steps without re-deriving them?
2. **Decision trail**: Will someone later need to know why this choice was made and what was rejected?
3. **Compresses**: Does this idea replace a long explanation with a short name or model?
4. **Cross-project**: Will this remain useful after the current project ends?
5. **Retrievable**: Can you name a concrete future scenario where someone will search for this?

## Use Report

When the request includes long-term knowledge use, the final report must include:

- Retrieval phrase: how the user can ask for this note later.
- Use mode: continue work, solve similar problem, write content, make decision, improve a skill, or review history.
- Update condition: what future evidence should revise or invalidate the note.

## 归位路由 + 源引用（2026-09-28 v2 增强）

- **归位路由**：蒸馏脚本读取 `.obsidian.yaml` 的 `distill_<类别>`（`distill_思考` / `distill_解决` / `distill_方案`）= vault 内相对目标目录。配置后蒸馏结论归到该目录（如 `02_项目/loop`、`10_问题解决`），**不再笼统进 `91_蒸馏整理`**；未配置则回退 `91_蒸馏整理/<类别>`（向后兼容）。
- **源引用（唤醒锚点）**：蒸馏文件 frontmatter 强制写入 `source_reference`，值为 `role {消息ID}@<raw文件名>`（如 `user {00000017}@2026-09-05.raw.md`）。据此可从蒸馏片段精确跳回原始会话对应 turn。
- **写作纪律**：新建蒸馏文件必须带 `source`（raw 路径）+ `source_reference`（turn 锚点列表）+ `project`；归位到对应项目子结构，禁随意堆 `91_蒸馏整理`。
- **代码落点**：`obsidian-capture/assets/distill-summary.mjs`（"归位路由 + 源引用" 模块，已双写开发包/活动包）。
