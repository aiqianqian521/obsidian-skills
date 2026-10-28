# Write Policy

Use this policy before any write to the Obsidian vault.

## Required Preflight

1. Confirm Obsidian Desktop is installed and opened to the target vault.
2. Confirm Templater, Calendar, Text Generator, Excalidraw, and Bases are installed and enabled.
3. Confirm Node/npm is available for skill installation, and confirm `kepano/obsidian-skills` plus this skill package are installed.
4. Read the current project `.obsidian.yaml` or `.obsidian_conf.yaml`.
5. Resolve `vault_path` and configured directories.
6. Check whether `vault_path` exists and is the intended Obsidian vault root.
7. Resolve relative dates such as today, yesterday, and last week into exact dates.
8. Identify the target note type and target directory.
9. Search existing notes before creating a new note.
10. Preserve or create a source note before writing distilled notes.
11. Validate the target filename against Obsidian filename rules before creating any note:

If any required environment item or required field is missing, pause and ask only for the missing item. Do not write notes.

## Filename Validity Gate

Before creating any vault note, validate the intended filename (the note title, without the .md extension) against Obsidian filename rules. In Obsidian, a note filename cannot contain any of: * " \ / < > : | ?. If the title would produce an illegal filename, do NOT create it as-is. Fix by replacing each illegal character with a safe equivalent and state the mapping in the write report.

Rules:
- Reject: any of * " \ / < > : | ? in the intended filename.
- Replace full-width lookalikes that Obsidian rejects at open time (e.g. ？, "/") with safe characters (? -> not used; “/” -> - or （）).
- Normalize leading/trailing whitespace and collapse consecutive spaces before validation.
- Keep filenames short; put details in the body.
- If a needed title is illegal, suggest a safe rename and ask the user before writing (per pause in Write Decision).

Do not create a missing note simply because it would be convenient. If a target directory or intermediate path is missing, report it and ask the user; **do not create it silently**. Only create durable notes after preflight, matching, and a chosen write action.


## Content Substance Gate（内容实质校验）

Before `create` or `append` to a durable knowledge note, compute the valid content: after stripping frontmatter, headings, and comment placeholders (`<!-- ... -->`), count the remaining meaningful word groups (recommend threshold < 2 CJK/ASCII word groups).

- If the target note body would be empty or below the threshold, do NOT create it as a durable note.
- Route the content to `source` / `inbox`, or `pause` and ask the user, instead of creating a hollow note.
- Appending to an existing note is allowed only when the existing body already passes substance; otherwise fill the note first.
- Index files and maintenance records are exempt from this check.

## Idempotent Write Rules

The same request can be run more than once. Re-running must not create duplicate durable notes.

Use these matching keys before writing:

| Note type | Primary match | Secondary match |
| --- | --- | --- |
| raw source | `source_kind + date + topic + project_name` | referenced files, conversation title |
| daily | exact `date` | configured daily directory |
| problem | normalized title + project_name | symptom, source backlink, changed files |
| concept | normalized title or alias | source backlink, related tags |
| decision | exact date + decision title | alternatives, source backlink |
| playbook | workflow name + trigger/use case | steps, source backlink |
| project | project_name | source backlink, active status |

Normalization means lowercase ASCII when possible, remove punctuation, collapse spaces, and compare obvious Chinese synonyms from the current context.

Every knowledge event is fingerprinted before matching. The **event fingerprint** combines {date, source_kind, topic/project, and a normalized title} so that a re-run of the same request produces the same fingerprint and is matched to the existing note instead of creating a duplicate. When a fingerprint is ambiguous (two candidate notes match), prefer `pause` over creating a new note.



## Multi-Path Matching

A single request may resolve to several candidate paths (a note that exists in the current project plus the same topic in a shared area). Match against **all** candidate paths, not just the first hit, and list every matched path in the write report so the user can see where content already lives before a new note is created.

## Confidence Levels

Each write carries a confidence level used to pick an action and to guard against guessed writes:

| Level | Meaning | Allowed actions |
| --- | --- | --- |
| high | evidence is explicit and verifiable | `create`, `append`, `merge` |
| medium | evidence exists but is partial | `append`, `merge`, `pause` |
| low | evidence is inferred or uncertain | `source-only`, `pause` |

A low-confidence write never creates a durable note; it is kept in source or inbox and reported for review.

## Supersede Action

`supersede` is an explicit write action: replace a prior conclusion, playbook step, or decision that newer evidence has invalidated while keeping a dated pointer to the old note so history is preserved. Prefer `supersede` over silent overwrite when the note's topic status becomes `superseded`.

## Write Decision

After matching, choose exactly one action:

- `append`: target note exists and the new content is an update, new evidence, or daily entry.
- `merge`: target note exists but structure needs consolidating; keep old content and add a dated update section.
- `create`: no matching note exists.
- `source-only`: content does not deserve a durable note but must remain in source or inbox.
- `link-existing`: content is duplicate and should link to the existing note instead of creating another note.
- `pause`: writing would rely on guessing, broad path risk, or user confirmation.

Never overwrite a full note by default. Do not delete source notes without following the Delete Decision procedure below. Never drop user-provided data; if it is low-value, unverifiable, or outside the durable-note scope, keep it in source or inbox and report that decision.

## Delete Decision

Deleting vault files is a destructive action. A delete is not a write — it does not fall under Write Decision.

Before any delete, choose exactly one action:

- `delete-confirmed`: the user has explicitly asked to delete specific files and confirmed a delete plan.
- `delete-recommend`: files appear to be safe to remove (empty, duplicate, or orphan with zero links), but the user has not yet confirmed. Present a delete plan and wait for approval.
- `pause`: the delete request is ambiguous, affects more than 5 files, or targets files with active backlinks. Stop and ask.

Rules:

- Never delete files silently. Always present a delete plan listing every file path and the reason for deletion.
- Never delete files with incoming backlinks unless the user explicitly confirms each one.
- Never delete index files, configuration files, or source notes without a separate explicit confirmation for each category.
- If a delete plan contains more than 5 files, group them by reason and ask for batch confirmation per group.
- After deletion, report every removed file path and the reason in the write/delivery report.



## Project Note Handling

A project note is made of three related notes, each handled by the same write decision:

- `project-status` (STATUS.md): the current project state, only one status event at a time.
- `project-log` (LOG.md): a chronological work log of the project.
- `project-topic` (TOPICS.md or per-topic notes): durable topic records, created only when the topic passes the reuse test.

Before writing a project note, read the existing STATUS, LOG, and topic notes so updates append or merge instead of overwriting.

## Append Locations

| Note type | Append location |
| --- | --- |
| daily | the relevant section: Work Log, Solved Problems, Knowledge Created, Decisions, Open Items, Source Links |
| problem | `## Updates` or `

## Maintenance Record Gate

Any maintenance operation (initialize, repair, rebuild, index update, or batch reorganization) is **not complete** until a maintenance record is appended to the vault's maintenance index and, when applicable, a dated maintenance record note is created. The gate fails if the operation modified the vault but produced no record. Chat confirmation in the reply is not a substitute for the recorded maintenance note.

## Verification` if the template already exists; otherwise add `## Updates` before `## Related` |
| concept | `## Evidence`, `## Boundaries`, or a dated `## Updates` section |
| decision | `## Consequences` or a dated `## Updates` section |
| playbook | `## Failure Modes`, `## Steps`, or a dated `## Updates` section |

## Dry-Run Conditions

Do not write immediately. Show a proposed change plan first when:

- The request affects more than 10 notes.
- The vault path or directory mapping is ambiguous.
- The user asks to reorganize, rename, move, clean, deduplicate, or repair broadly.
- Existing notes would need structural merges.
- The operation could expose private or sensitive information.

## Required Write Report

Every write task must report:

- Created files.
- Updated files.
- Existing files left unchanged.
- Source-only or inbox-only items and reasons.
- Duplicate items linked to existing notes.
- Items needing user review (flag low-confidence or ambiguous writes with status `needs-review` so a human can confirm later).
- Verification performed after reading back the changed files.

## Verification

After writing:

1. Read the changed files back.
2. Check frontmatter has required fields for that note type.
3. Check source backlinks exist for distilled notes.
4. Check index files are valid and reflect expected counts when indexes were updated.
5. Report `V:` with concrete verification, not a vague success claim.
