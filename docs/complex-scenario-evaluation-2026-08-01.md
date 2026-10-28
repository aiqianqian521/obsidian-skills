# P9 Complex Scenario Evaluation — 2026-08-01

## Result

- Disposable fixture behavior: 100/100
- P9 implementation-readiness score: 95/100
- Scenarios: 3
- Assertions: 25
- Production vault changes: none

The fixture score means the expected policy can be executed without violating the tested file invariants. It is not a multi-model consistency score. The P9 score also reviews whether the written skill contracts unambiguously force that behavior.

## Scenario 1 — Resume with stale STATUS and newer LOG

Prompt: `继续 Alpha 项目。`

Expected and observed route:

`obsidian-project/resume -> STATUS -> recent LOG -> project entry -> relevant Topic`

Result: PASS (30/30).

- The newer rollback event is reported as a conflict with stale STATUS.
- Confidence is reduced to medium instead of silently choosing one state.
- The next action comes from the newer evidence.
- The complete vault snapshot remains unchanged.

## Scenario 2 — Mixed session lifecycle and repeated execution

Prompt: `把当前会话完整整理到知识库：包括项目进展、已解决问题、项目结论、跨项目 Playbook，并合并已有概念。`

Expected and observed route:

`analyst -> capture -> daily -> project -> solve -> distill -> index`

Result: PASS (35/35).

- One Source is preserved.
- Daily contains timeline facts rather than the evergreen explanation.
- Existing project memory receives one STATUS update and one LOG event.
- The project-scoped conclusion remains a Topic and is not automatically promoted.
- The reusable workflow becomes a Playbook.
- The existing Concept is updated instead of duplicated.
- The index is rebuilt as navigation, not used as evidence.
- The second identical run is a no-op at the file-snapshot level.

## Scenario 3 — Chinese mapping, similar projects, missing plugin, stale index

Prompt: `查看星火项目状态并记录新进展。`

Fixture result: PASS (35/35). P9 contract score: 30/35.

- Both `星火平台` and `星火平台重构` are detected; no project is guessed.
- Missing `obsidian-textgenerator-plugin` blocks the formal write.
- The stale project index is not repaired as a side effect.
- After the environment is repaired and `星火平台重构` is named exactly, only that project's STATUS and LOG change.

Contract finding: `environment-gate.md` requires outputting only the missing-item checklist, while `obsidian-project` requires pausing on ambiguous identity. The individual safeguards are correct, but their precedence does not guarantee that one blocked response preserves both facts. A later contract change should define a single preflight report containing `missing_environment` and `unresolved_identity`, while still performing no writes.

## Reproduction

Run:

```powershell
node scripts/run-complex-scenario-evals.mjs
```

The script creates a uniquely prefixed directory under the system temporary directory, verifies its resolved path before recursive cleanup, and never reads or writes a production vault.
