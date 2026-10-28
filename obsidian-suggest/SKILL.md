---
name: obsidian-suggest
description: Scan the auto-generated L0 session file and propose extraction candidates (concepts, decisions, problems) for the user to confirm and write to Obsidian vault. Use after a productive conversation session.
version: 1.0.0
---

# Obsidian Suggest

## Role

Read today's auto-generated L0 session file from the Obsidian vault, analyze the conversation content, and propose a structured list of knowledge extraction candidates. The user confirms which items to keep — this skill never writes to vault without explicit user confirmation.

## Inputs

- Today's L0 session file: `{vault}/90_原始来源/会话记录/{project_name}/{YYYY-MM-DD}.raw.md`
- Project name auto-detected from `.obsidian.yaml` → `project_name` field, or from `cwd` basename
- Optional: specific time range, or `--project` flag to switch projects

## Required References

Before analyzing, read:
1. `../obsidian-router/references/vault-contract.md` — vault paths and naming rules
2. `../obsidian-router/references/write-policy.md` — dedup and merge rules
3. `../obsidian-router/references/note-schema.md` — required frontmatter fields

## Output Format

Present candidates in 3 groups, each item with a unique ID:

```
## 🧠 概念 (Concepts)
- [ ] CONCEPT-1: {title}
  - one-sentence: {what it is}
  - why matters: {why useful to remember}
  - source: L{N}-L{N} in today's session

## 📋 决策 (Decisions)
- [ ] DECISION-1: {title}
  - decision: {what was decided}
  - context: {why this decision}
  - alternatives: {what else was considered}
  - source: L{N}-L{N}

## 🔧 问题 (Problems)
- [ ] PROBLEM-1: {title}
  - symptom: {what went wrong}
  - root cause: {why it happened}
  - solution: {how it was fixed}
  - source: L{N}-L{N}
```

## Rules

1. **Max 8 candidates total** across all 3 groups. Fewer is fine. Quality over quantity.
2. **Must cite source lines** from the L0 file for each candidate.
3. **Skip obvious noise**: greetings, chitchat, repeated content, tool call traces.
4. **Prioritize reusable knowledge**: patterns, decisions, fixes that apply beyond this session.
5. **Check for duplicates** before suggesting: search existing vault notes for similar titles.
6. **Never write without confirmation**: display candidates, wait for user to check/uncheck, then write only confirmed items.

## Confirmation

After displaying candidates, ask: "以上哪些需要写入知识库？". User can reply with:
- "全部" → write all
- "1 3 5" → write those IDs
- "跳过概念" → skip the Concepts group
- "不要" → cancel, write nothing

## Write Action

For each confirmed item:
- CONCEPT → create `05_概念/{name}.md` using concept template
- DECISION → create `06_决策/{YYYY-MM-DD}-{name}.md` using decision template
- PROBLEM → create `10_问题解决/{YYYY-MM-DD}-{name}.md` using problem template

After writing, update the corresponding index file (`knowledge-index.md`, `problem-index.json`).