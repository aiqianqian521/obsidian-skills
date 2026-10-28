---
name: obsidian-project
description: Maintain and resume project working memory in Zhang Gege's Obsidian vault. Use when the user explicitly asks to initialize project memory, update a project's current status, record meaningful project progress, preserve a project-scoped conclusion, or continue/resume a named project. Resume and continue requests are read-only by default; do not use for ordinary article organization, daily archives, or durable cross-project knowledge distillation.
---

# Obsidian Project

## Role

Maintain the short-lived operational memory between raw evidence and durable cross-project knowledge. Make the current project resumable without turning project state into the long-term knowledge base.

## Required References

Read only what the selected action needs:

1. Always read `references/memory-boundaries.md` and `references/project-contract.md`.
2. Read `../obsidian-router/references/vault-contract.md` to resolve the configured projects directory.
3. For writes, read `../obsidian-router/references/write-policy.md` and enforce `../obsidian-router/references/environment-gate.md`.
4. For continue/resume requests, read `references/project-resume.md`.
5. Emit short status lines using `../obsidian-router/references/status-protocol.md`.

## Actions

Choose exactly one primary action.

| Action | Example trigger | Default mode |
| --- | --- | --- |
| initialize memory | `为这个项目初始化项目记忆` | write |
| update status | `更新项目状态` | write |
| record progress | `记录这个项目的进展` | write |
| maintain topic | `把这个项目结论记为 Topic` | write |
| resume project | `继续知识库升级项目` | read-only |

Ordinary requests such as `整理这篇文章到知识库` do not select this skill.

## Procedure

1. Resolve the exact project name and configured projects directory. Do not guess between multiple matches.
2. Search for both forms:
   - legacy entry: `02_Projects/{project-name}.md`
   - companion memory: `02_Projects/{project-name}/STATUS.md` and `LOG.md`
3. If the action is resume, follow `references/project-resume.md`; do not create, touch, or normalize files.
4. Before a write, pass the shared environment gate and search the target files first.
5. For initialization:
   - preserve any existing legacy entry unchanged except for an explicit, necessary companion link;
   - create a minimal project entry only when none exists;
   - create the companion directory, `STATUS.md`, and `LOG.md`;
   - do not create `TOPICS/` until the first real project Topic is written.
6. For a status update, update only the current-state fields and sections in `STATUS.md`. Add no history-only prose there.
7. For substantive progress, update `STATUS.md` and append at most one structured event to `LOG.md` for the request. Skip narration, tool chatter, and no-op activity.
8. Create or update a Topic only when a project-scoped conclusion has evidence and a useful name. Do not automatically create a durable Concept.
9. Read changed files back and report exact created and updated paths.

## Write Threshold

A LOG event is substantive when at least one is true:

- project objective, next action, blocker, scope, or status changed;
- a decision was made;
- a deliverable or verification result changed what can happen next;
- a stable project-scoped conclusion was established or superseded.

Do not log status checks, repeated summaries, failed searches with no effect, or every agent step.

## Guardrails

- `STATUS.md` is a current snapshot, not a diary.
- `LOG.md` is append-only project history, not raw evidence.
- Project Topics are contextual conclusions, not automatically reusable knowledge.
- Source notes remain the evidence authority; indexes remain rebuildable navigation.
- Keep project status, Topic epistemic status, graduation status, and reuse events as separate dimensions.
- Never auto-migrate legacy project notes.
- Never create `CITED.md` in Phase 1.
- Never write during a resume request unless the user explicitly adds a write instruction.

## Templates

- `assets/templates/project-status.md`
- `assets/templates/project-log.md`
- `assets/templates/project-topic.md`

