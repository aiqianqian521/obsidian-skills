# Project Memory Contract

## Compatible Layout

The existing single-file project entry remains canonical for identity and discovery:

```text
02_Projects/
├── project-name.md
└── project-name/
    ├── STATUS.md
    ├── LOG.md
    └── TOPICS/              # create only with the first real Topic
```

The companion directory is an optional enhancement for active or complex projects. Never migrate every old project automatically.

## Minimal Project Entry

If no entry exists during explicit initialization, create:

```markdown
---
type: project
id: {{project_id}}
status: active
created: {{date}}
updated: {{date}}
---

# {{project_name}}

## Purpose

{{purpose}}

## Project Memory

- Status: [[{{project_name}}/STATUS|Current status]]
- Log: [[{{project_name}}/LOG|Project log]]
```

If a legacy entry exists, preserve its structure. A companion link may be added only when the user explicitly initialized memory and the link can be added without restructuring the note.

## Artifact Responsibilities

| Artifact | Mutable? | Contains | Must not contain |
| --- | --- | --- | --- |
| project entry | low churn | identity, purpose, stable navigation | detailed event stream |
| `STATUS.md` | overwrite current sections | objective, next action, blockers, active decisions/files, open questions | historical narration |
| `LOG.md` | append-only entries | meaningful progress, decision, blocker, verification, scope change | raw transcript or every tool action |
| `TOPICS/*.md` | update by conclusion | project-scoped conclusion, evidence, uncertainty | unsupported universal claim |

## Independent Status Dimensions

The canonical vocabularies live in `../../obsidian-router/references/note-schema.md`. The list below explains their independence; it does not define a second schema.

Do not combine these fields into one lifecycle enum:

- Project status: `active | paused | completed | archived`
- Topic epistemic status: `draft | validated | superseded`
- Graduation status: `none | candidate | graduated | deferred`
- Reuse: dated event history, not a status value

Phase 1 may store `graduation: none|candidate|graduated|deferred`, but does not implement the graduation workflow.

## Update Rules

- Replace the current snapshot in `STATUS.md`; preserve unrelated sections.
- Append no more than one `LOG.md` event per substantive user request.
- Link LOG and Topic claims to source, daily, decision, problem, file, commit, or validation evidence when available.
- Unknown values remain `unknown` or explicit open questions. Never infer completion or validation.
- Create `TOPICS/` only when the first Topic passes the evidence and naming threshold.
