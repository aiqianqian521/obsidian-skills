---
name: obsidian-daily
description: Write and maintain daily archive notes in an Obsidian knowledge base. Use when the user explicitly asks to archive today's work, update the daily note, record daily activity, or maintain date-based work logs. Use obsidian-query for read-only daily reports.
---

# Obsidian Daily

## Role

Maintain date-based daily notes. Daily notes answer "what happened on this date"; they are not the whole knowledge base.

Emit short status lines using `obsidian-router/references/status-protocol.md`.

## Output

Create or update exactly one primary daily note using `directories.daily`, `daily_layout`, and `daily_filename`:

- `single-file`: `{directories.daily}/YYYY-MM-DD.md`
- `date-directory`: `{directories.daily}/YYYY-MM-DD/{daily_filename}`, normally `summary.md`

If layout keys are absent, use legacy-compatible `single-file` behavior.

## Required References

Before writing, read:

1. `../obsidian-router/references/status-protocol.md`
2. `../obsidian-router/references/environment-gate.md`
3. `../obsidian-router/references/vault-contract.md`
4. `../obsidian-router/references/write-policy.md`

## Daily Note Sections

Use `assets/templates/daily.md`.

Required sections:

- Work Log
- Solved Problems
- Knowledge Created
- Decisions
- Open Items
- Source Links

## Rules

- Keep entries short and chronological.
- Resolve the canonical path before any write. For a date-directory layout, the parent is the configured Daily directory, never the Vault root unless the config explicitly says so.
- Search the canonical path plus legacy candidates: `{directories.daily}/YYYY-MM-DD.md`, `{directories.daily}/YYYY-MM-DD/summary.md`, `vault/ YYYY-MM-DD.md`, and `vault/YYYY-MM-DD/summary.md`.
- If exactly one Daily exists, append to its relevant section when it is canonical. If a legacy note is the only match, do not create a competing canonical note; report a migration-needed collision or migrate only with explicit user approval and backup.
- If multiple same-date Daily notes exist, preserve all unique sections and report `needs-review`; merge and retire legacy paths only during an explicitly approved migration.
- Never create both `YYYY-MM-DD.md` and `YYYY-MM-DD/summary.md` for the same date.
- If the daily note exists, append to the relevant section; do not overwrite the full note.
- Link to source notes, problem notes, concept notes, and project notes.
- Do not duplicate full raw conversation content.
- Do not put long evergreen explanations in Daily; route them to `obsidian-distill`.
- Convert relative dates such as "today" and "yesterday" to exact dates before writing.
- After a Daily write or approved migration, update the configured system `daily-index.md` with one unambiguous link per date and read it back.
