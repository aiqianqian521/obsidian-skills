---
name: obsidian-index
description: Maintain indexes, maps, and auditable maintenance records for an AI-managed Obsidian knowledge base using Markdown-first agent file operations. Use when the user asks to organize or optimize a vault, update indexes, rebuild problem-index.json, check vault completeness, initialize project .obsidian.yaml, initialize directories, repair broken links, deduplicate or migrate notes, list stale notes, classify project files into the vault, or maintain knowledge maps.
---

# Obsidian Index

## Role

Keep the vault navigable and machine-readable. Indexing is maintenance, not knowledge creation.

## Managed Files

- `.obsidian.yaml` in the current project root
- `{directories.system}/problem-index.json`
- `{directories.system}/knowledge-index.md`
- `{directories.system}/daily-index.md`
- `{directories.system}/project-index.md`
- `{directories.system}/skill-index.md`
- `{directories.system}/playbook-index.md`
- `{directories.system}/asset-index.md`
- `{directories.system}/维护记录/_index.md`
- `{directories.system}/维护记录/YYYY-MM-DD-HHmm-{operation}.md`

## Procedure

1. Emit status lines using `obsidian-router/references/status-protocol.md`.
2. If project config is missing, use `obsidian-router/references/init-dialog.md`.
3. Enforce `../obsidian-router/references/environment-gate.md` before formal writes.
4. Use `references/manual-operations.md` as the primary procedure.
5. Read `references/index-schemas.md` before creating or rebuilding indexes.
6. For broad maintenance that changes the vault, read `references/maintenance-record.md` before modifying files.
7. Scan managed directories.
8. Read frontmatter and first headings.
9. Rebuild indexes from notes, not from memory.
10. For the project index, support both legacy entry-only projects and entries with companion `STATUS.md`; never treat LOG or Topic files as separate projects.
11. Generate Markdown indexes using `index-schemas.md`.
12. After changes and verification, create or update the maintenance record and maintenance index, then read both back.
13. For vault-completeness checks, load `references/vault-audit.md` and report its findings (root drift, type-directory mismatch, same-source contradiction, stale open problems, missing confidence, promotion candidates, only-title/empty notes, illegal filenames, orphan relationship files) per category, then apply user-confirmed fixes via write-policy, rebuild indexes, and record the maintenance path.

## Markdown-First Operations

- Do not require Python for customer workflows.
- Perform initialization, archive classification, index rebuilds, and verification by reading the Markdown references and directly creating/updating files.
- Use `references/manual-operations.md` as the executable contract, not as a fallback.
- For project file portability, follow `../obsidian-router/references/project-file-archive.md`: copy files into the configured source directory, write `asset-manifest.json`, update `asset-index.md`, and verify by reading the files back.
- Development-only test harnesses, if created outside the shipped skill, must not become a customer prerequisite.

## Rules

- Do not delete user notes automatically.
- Do not move files unless the user explicitly asks.
- Prefer reporting proposed repairs before broad edits.
- Indexes must be rebuildable from the notes.
- Project entry notes own project identity. Companion STATUS may supply fresher operational state; LOG and Topics never become top-level project-index rows.
- A broad maintenance write is incomplete until its maintenance record and `_index.md` entry have been written and read back successfully.
