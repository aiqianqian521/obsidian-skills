# Contract Map

Use this file to locate the single authority for a rule. Do not copy complete rules into README or other skills.

| Rule | Canonical authority |
| --- | --- |
| directory mappings, memory layers, provenance | `vault-contract.md` |
| directory routing rules and priority chain | `directory-routing.md` |
| note types, required fields, status vocabularies (including superseded and confidence), owner skill | `note-schema.md` |
| intent priority and read/write routing | `trigger-map.md` |
| project file archive rules for portable vault | `project-file-archive.md` |
| empty vault bootstrap procedure | `empty-vault-bootstrap.md` |
| source and plugin setup guide | `source-plugin-guide.md` |
| owner profile and role preferences | `profile.md` |
| environment prerequisites, stop behavior, preflight bundling, and directory reconciliation | `environment-gate.md` |
| idempotency (including 2-layer Chinese normalization, multi-path matching with confidence levels), write decisions, verification, directory existence checks | `write-policy.md` |
| fragment-to-use lifecycle | `lifecycle-playbook.md` |
| project entry, STATUS, LOG, Topic behavior | `../../obsidian-project/references/project-contract.md` |
| project memory boundaries and truth roles | `../../obsidian-project/references/memory-boundaries.md` |
| project read-only recovery | `../../obsidian-project/references/project-resume.md` |
| reuse test for durable-note creation (5-item checklist) | `../../obsidian-distill/SKILL.md` |
| source-note sharding (>50 exchanges) and extraction_candidates | `../../obsidian-capture/SKILL.md` |
| auto-capture hook setup and session-logger.mjs | `../../obsidian-capture/SKILL.md` |
| session-end suggestion protocol and confirmation flow | `../../obsidian-suggest/SKILL.md` |
| topic/keyword content search across sources, problems, and daily notes | `../../obsidian-query/SKILL.md` |
| index schemas and rebuild rules | `../../obsidian-index/references/index-schemas.md` |
| executable customer operations | `../../obsidian-index/references/manual-operations.md` |
| maintenance record triggers, schema, content, idempotency, and verification | `../../obsidian-index/references/maintenance-record.md` |
| vault audit checks, report format, and fix workflow | `../../obsidian-index/references/vault-audit.md` |
| behavioral acceptance scenarios | `acceptance-tests.md` and package `evals/` |

## Change Rule

For one behavior change:

1. Edit its canonical authority.
2. Update only direct consumers that change behavior.
3. Add or update an acceptance case.
4. Run the package validator and relevant evals.
