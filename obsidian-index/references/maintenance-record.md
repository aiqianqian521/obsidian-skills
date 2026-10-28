# Maintenance Record Contract

This file is the canonical authority for Vault maintenance audit records. `obsidian-index` owns this note type.

## Purpose and Location

Maintenance records explain what an agent changed during broad Vault organization and make the operation auditable and reversible. They are system audit trails, not source evidence, Daily notes, project working memory, or durable knowledge.

Resolve the system directory from `.obsidian.yaml` or `.obsidian_conf.yaml` and store records at:

```text
{directories.system}/维护记录/
├─ _index.md
└─ YYYY-MM-DD-HHmm-{operation}.md
```

Do not assume `99_System`; use the configured mapping. For example, when `directories.system` is `00-导航`, use `00-导航/维护记录/`.

## Trigger

Create or update a record after actual changes and verification for:

- full-vault organization or optimization;
- directory migration or bulk rename/move;
- deduplication;
- index, broken-link, or relationship-graph repair;
- bulk frontmatter normalization;
- integrity audits that make changes;
- large source imports or archives.

Do not create a record for a pure read-only check, an ordinary single-note capture/daily/distill write, or a failed operation that changed nothing. Writing a maintenance record never recursively triggers another record.

## Schema

Required frontmatter fields are defined by the note schema registry:

```yaml
type: maintenance
id: maintenance-YYYYMMDD-HHmm-{operation-slug}
date: YYYY-MM-DD HH:mm
status: completed
operation: human-readable operation name
scope: paths or logical scope
project:
skills:
backup:
```

Allowed status values: `completed`, `partial`, `needs-review`, `rolled-back`. Use `partial` or `needs-review` when only part of the intended work is complete.

## Required Content

Use `../assets/templates/maintenance-record.md`. Record:

- objective and exact scope;
- created, updated, moved, and deleted counts or file lists;
- every meaningful old path -> new path mapping;
- preserved and skipped items with reasons;
- backup or recovery path, or explicitly `none` with reason;
- concrete verification performed and result;
- remaining issues and items needing review;
- related indexes and entry notes;
- executing skills.

Never include tokens, passwords, API keys, private credentials, or other secrets.

## Idempotency and Completion Gate

The match key is `date + operation + normalized scope fingerprint`. Re-running the same maintenance event updates its existing record and verification section instead of creating a duplicate.

After the Vault changes are verified:

1. Write or update the maintenance record.
2. Add or update exactly one entry in `_index.md`.
3. Read both files back.
4. Verify required frontmatter, links, scope, change summary, backup, verification, and remaining issues.

**Hard gate**: A maintenance record may only be marked `status: completed` when the recorded `deleted` / `linked` counts exactly match the final review checklist (a one-to-one `ls` / backlink re-scan). If any count is unverified, larger than expected, or the final checklist has pending items, the record must stay `needs-review` or `partial` and must not be marked complete.

Broad maintenance is not complete until these steps succeed. A chat summary cannot replace the Vault record.
