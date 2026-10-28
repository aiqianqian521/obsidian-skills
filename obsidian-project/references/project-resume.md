# Project Resume

Resume is a read-only recovery operation. Its purpose is to reconstruct the smallest accurate working set, not to summarize the whole vault.

## Lookup Order

1. Resolve the configured projects directory and exact project identity.
2. Find `02_Projects/{project-name}.md` and the optional companion directory.
3. When companion memory exists, read in this order:
   1. `STATUS.md`
   2. the latest relevant entries in `LOG.md`
   3. the project entry
   4. relevant `TOPICS/*.md` only when STATUS or the request names them
4. When only a legacy entry exists, read it as the project summary and current best-known state.
5. Use project index only to locate candidates. Do not use it as evidence.
6. Read Daily, Problems, Decisions, or Source only to fill a concrete gap or verify an important claim.

## Stop Conditions

Stop reading when all of these can be answered with evidence:

- current project status and objective;
- next concrete action;
- active blockers and open questions;
- recent decisions that constrain the next action;
- files or notes needed to continue;
- confidence and any stale or conflicting state.

## Output Contract

Return:

```text
Project: exact name
Status: active | paused | completed | archived | unknown
Current objective: ...
Next action: ...
Blockers/open questions: ...
Recent constraints or decisions: ...
Working set: exact file/note links
Evidence read: exact paths
Confidence: high | medium | low, with reason
V: 未修改文件
```

If STATUS conflicts with a newer LOG entry, report the conflict rather than silently choosing. If multiple projects match, pause and ask which one the user means.

