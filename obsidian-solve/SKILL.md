---
name: obsidian-solve
description: Extract and record solved problems from an AI coding conversation into an Obsidian knowledge base. Use when the user asks what problems the current conversation solved, to record solved issues, log fixes, create problem notes, or update the problem database.
---

# Obsidian Solve

## Role

Record problems as reusable work history: symptom, cause, solution, verification, and lesson.

Emit short status lines using `obsidian-router/references/status-protocol.md`.

## Output

Create or update a problem note in the configured `directories.problems` path:

- Chinese mapping example: `10_问题解决/YYYY-MM-DD-problem-title.md`
- English mapping example: `10_Problems/YYYY-MM-DD-problem-title.md`

Update:

Configured `directories.system` path, for example `99_系统/problem-index.json` or `99_System/problem-index.json`.

## Required References

Before writing, read:

1. `../obsidian-router/references/status-protocol.md`
2. `../obsidian-router/references/environment-gate.md`
3. `../obsidian-router/references/vault-contract.md`
4. `../obsidian-router/references/write-policy.md`
5. `../obsidian-index/references/index-schemas.md`

## Problem Record Fields

Use `assets/templates/problem.md`.

Required fields:

- title
- status
- priority
- date
- symptom
- root cause
- solution
- verification
- changed files or artifacts
- reusable lesson
- source note

## Rules

- Do not invent root cause or verification.
- Use `needs-review` when facts are uncertain.
- Do not mark `user_confirmed: true` unless the user explicitly confirmed.
- Search for duplicate problem notes before creating a new one.
- If a matching problem exists, append evidence or verification instead of creating a duplicate.
- Link related concepts, decisions, playbooks, and projects.
- If a fix created a reusable workflow, ask `obsidian-distill` to create or update a playbook.
