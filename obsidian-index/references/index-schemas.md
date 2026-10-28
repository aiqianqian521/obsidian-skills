# Index Schemas

Use these schemas when creating, validating, or rebuilding vault indexes.

## General Rules

- Indexes are derived artifacts. Rebuild them from notes, not from memory.
- Do not treat an index as the source of truth.
- If a note lacks required frontmatter, include it in a review section instead of inventing fields.
- Use exact dates in `YYYY-MM-DD` format.
- Keep source note backlinks as Obsidian wikilinks when available.

## Managed Index Files

| Index | Source notes | Purpose |
| --- | --- | --- |
| `99_System/problem-index.json` | `10_Problems/*.md` | machine-readable solved/open problem list |
| `99_System/knowledge-index.md` | `05_Concepts`, `06_Decisions`, `08_Skills`, `09_Playbooks` | human-readable durable knowledge map |
| `{directories.system}/daily-index.md` | canonical Daily notes resolved from `directories.daily`, `daily_layout`, and `daily_filename` | date timeline |
| `99_System/project-index.md` | `02_Projects/*.md` plus optional `02_Projects/*/STATUS.md` | active and archived project map across legacy and companion formats |
| `99_System/skill-index.md` | `08_Skills/*.md` | agent skill and prompt inventory |
| `99_System/playbook-index.md` | `09_Playbooks/*.md` | repeatable workflow inventory |

## Problem Index JSON

```json
{
  "last_updated": "2026-07-30T00:00:00+08:00",
  "problems": [
    {
      "id": "problem-20260730-readme-missing-install-guide",
      "title": "README 缺少安装说明",
      "date": "2026-07-30",
      "status": "processed",
      "priority": "medium",
      "project": "obsidian-1-2-3-4-codex",
      "file": "10_Problems/2026-07-30-readme-missing-install-guide.md",
      "source": ["[[2026-07-30-1119-obsidian-skill-fix.raw]]"],
      "verification": "quick_validate passed"
    }
  ],
  "needs_review": []
}
```

Required item fields: `id`, `title`, `date`, `status`, `priority`, `file`.

Optional item fields: `project`, `source`, `verification`, `tags`.

## Markdown Index Format

Use this section layout for Markdown indexes:

```markdown
---
type: index
index_type: knowledge|daily|project|skill|playbook
last_updated: YYYY-MM-DD
status: active
---

# {Index Title}

## Active

- [[note-title]] - one-line reason

## Needs Review

- [[note-title]] - missing field or broken link

## Archived

- [[note-title]] - archived reason
```

## Rebuild Rules

1. Read all source notes for the index.
2. Extract frontmatter and the first heading.
3. Validate required fields for the note type.
4. Sort by date descending, then title.
5. Write the index file.
6. Read it back and verify expected count.

### Daily Index Compatibility

1. Resolve the canonical Daily layout from config. Missing layout keys mean legacy-compatible `single-file`.
2. For `single-file`, scan `{directories.daily}/YYYY-MM-DD.md`.
3. For `date-directory`, scan `{directories.daily}/YYYY-MM-DD/{daily_filename}`, normally `summary.md`.
4. Search Vault-root legacy forms as a collision check, not as extra canonical rows.
5. Index exactly one canonical row per date using an explicit path link such as `[[80-每日记录/2026-08-03/summary|2026-08-03]]`.
6. Put same-date collisions, invalid frontmatter, and legacy-only dates under `Needs Review`; never silently choose one or create a duplicate.

### Project Index Compatibility

1. Treat each top-level `02_Projects/{project}.md` as one project identity.
2. If `02_Projects/{project}/STATUS.md` exists, use its `status`, `updated`, current objective, and next action as the fresher operational summary.
3. If companion memory does not exist, index the legacy entry exactly as before.
4. Do not require or create companion files during rebuild.
5. Do not index `LOG.md` or `TOPICS/*.md` as separate projects.
6. If entry and STATUS disagree, include the project once under `Needs Review` and identify the conflict; do not invent a resolution.

## Note Schema Authority

Read `../../obsidian-router/references/note-schema.md` for required frontmatter and type-specific status vocabularies. Index validation consumes that registry; it does not maintain a second copy.
