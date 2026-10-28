# Note Schema

Canonical vocabularies for note types and status values. Referenced by write-policy, project-contract, index-schemas, and other skills that need consistent field definitions.

## Status Values

| Status | Meaning | Used by |
|--------|---------|---------|
| `inbox` | unprocessed, not yet classified | all note types |
| `processed` | classified and stored | all note types |
| `needs-review` | requires human attention (broken frontmatter, ambiguous link, uncertain fact) | all note types |
| `active` | currently relevant and maintained | projects, concepts, playbooks |
| `archived` | no longer active, preserved for history | projects, concepts, decisions |

## Project Status

| Value | Meaning |
|-------|---------|
| `active` | project is in progress |
| `paused` | project is temporarily suspended |
| `completed` | project has finished |
| `archived` | project is closed and archived |

## Topic Epistemic Status

| Value | Meaning |
|-------|---------|
| `draft` | conclusion is provisional |
| `validated` | conclusion has been verified |
| `superseded` | conclusion has been replaced by newer evidence |

## Graduation Status

| Value | Meaning |
|-------|---------|
| `none` | not a candidate for durable knowledge |
| `candidate` | may become durable knowledge |
| `graduated` | promoted to durable knowledge |
| `deferred` | graduation postponed |

## Note Types and Required Frontmatter

| Type | Required fields | Optional fields |
|------|----------------|-----------------|
| source | `type`, `source_kind`, `date`, `status`, `capture_scope` | `project`, `tags` |
| daily | `type`, `date`, `status` | `tags` |
| problem | `type`, `id`, `date`, `status`, `priority` | `project`, `source`, `verification`, `tags` |
| concept | `type`, `id`, `date`, `status`, `source` | `tags`, `aliases` |
| decision | `type`, `id`, `date`, `status`, `source` | `tags` |
| playbook | `type`, `id`, `date`, `status`, `source` | `tags` |
| project | `type`, `id`, `status` | `tags` |
| skill | `type`, `id`, `status` | `tags` |
| maintenance | `type`, `id`, `date`, `status`, `operation` | `_index.md`, `tags` |



## Confidence Field

Notes carry an optional `confidence` field that records how reliable the stored evidence is:

| Value | Meaning |
|-------|---------|
| `high` | explicit, verifiable evidence |
| `medium` | partial evidence, needs a check when reused |
| `low` | inferred or uncertain; treat as provisional |
| `needs-review` | ambiguous or broken; requires human attention |

The **Confidence Field** is referenced by write-policy to decide between `create`/merge and `source-only`/pause, and by distill/analyst outputs to expose how reliable a conclusion is. It never replaces the required `status` field.

## Write Decision Actions

| Action | Meaning |
|--------|---------|
| `append` | add content to existing note |
| `merge` | consolidate structure, keep old content |
| `create` | create new note |
| `source-only` | keep in source/inbox only |
| `link-existing` | link to existing note instead of duplicating |
| `pause` | stop and ask user |

## Delete Decision Actions

| Action | Meaning |
|--------|---------|
| `delete-confirmed` | user approved a specific delete plan |
| `delete-recommend` | suggest deletion, wait for approval |
| `pause` | ambiguous or risky delete, stop and ask |