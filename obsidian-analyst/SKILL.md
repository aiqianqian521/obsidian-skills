---
name: obsidian-analyst
description: Multi-role Obsidian knowledge-base analyst for Obsidian archiving. Use before distilling or archiving when the user wants AI to analyze conversation context from different Obsidian knowledge-base roles such as programmer, architect, short-video creator, personal writer, product operator, or business decision maker, then produce routing and classification recommendations.
---

# Obsidian Analyst

## Role

Analyze context before writing. This skill produces classification, value, and routing recommendations. It does not write vault files directly.

Emit short status lines using `obsidian-router/references/status-protocol.md`.

## When To Use

Use before `obsidian-distill`, `obsidian-solve`, or `obsidian-daily` when:

- the conversation has mixed domains
- the user asks for multiple perspectives
- the archive target is unclear
- the same content may serve several knowledge bases
- the user mentions role-based analysis or Nuwa-style role construction

## Procedure

1. Read `references/role-matrix.md`.
2. Select 2-5 relevant roles based on the current context.
3. For each role, analyze:
   - what is useful
   - what should be ignored
   - which vault directory should receive it
   - which note type should be created
   - what backlinks are needed
   - what remains uncertain
4. Merge role outputs into one routing plan.
5. Pass each item to its owner skill. Project state, progress, and project-scoped conclusions go to `obsidian-project`; durable cross-project knowledge goes to `obsidian-distill`.

## Nuwa-Inspired Rule

Do not create vague personas. A role must be an operating lens:

- mental model: what it optimizes for
- decision rule: how it classifies value
- anti-pattern: what it refuses to store
- output target: which note types it produces
- boundary: what it cannot judge

## Output Contract

Return a structured plan:

```yaml
analysis_mode: multi-role
selected_roles:
  - role: programmer
    reason: ""
items:
  - title: ""
    value: ""
    recommended_type: concept|decision|problem|project|playbook|skill|resource|daily|source
    owner_skill: obsidian-distill|obsidian-solve|obsidian-project|obsidian-daily|obsidian-capture
    recommended_directory: ""
    source_backlink: ""
    roles_supporting: []
    confidence: high|medium|low
    uncertainty: ""
write_sequence:
  - obsidian-capture
  - obsidian-daily
  - obsidian-solve
  - obsidian-project # only when project memory exists or the user explicitly requested project tracking
  - obsidian-distill
  - obsidian-index
```

## Rules

- Do not write files.
- Do not invent facts or sources.
- Prefer fewer high-value notes over many weak notes.
- Preserve conflicts between roles; do not average them away.
- If a role needs domain facts not present in the conversation, mark uncertainty instead of guessing.
- Do not route project state through `obsidian-distill`. Use `obsidian-project` as the sole project-memory writer.
- Full organization may update existing project memory, but it must not initialize a companion directory unless the user explicitly requested project tracking.
