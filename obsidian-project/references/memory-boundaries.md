# Memory Boundaries

The vault has five layers. Each layer answers a different question.

| Layer | Canonical artifact | Question answered | Truth role |
| --- | --- | --- | --- |
| control and guidance | `.obsidian.yaml`, skill contracts, templates | How should agents operate here? | operating contract |
| evidence archive | Source, Inbox, Daily | What was received or happened? | evidence and timeline |
| project working memory | project entry, `STATUS.md`, `LOG.md`, project Topics | Where is this project now and how did it get here? | current operational context |
| durable knowledge | Concepts, Decisions, Playbooks, Problems, Skills | What remains useful across projects? | reusable interpretation |
| derived navigation | indexes and maps | Where can an item be found? | rebuildable locator |

## Truth Boundaries

- Source preserves raw evidence. It does not claim the current project state.
- Daily preserves a date-oriented timeline. It does not replace project history.
- Project `LOG.md` records meaningful state-changing events. It does not copy raw transcripts.
- `STATUS.md` is the latest snapshot. It does not preserve the full timeline.
- Project Topic captures a conclusion that is useful inside the project. It is not automatically cross-project truth.
- Durable notes capture reusable knowledge and must link back to evidence.
- An index is never the source of truth and may always be rebuilt.

## Memory Horizon

Project memory is short-to-medium horizon memory. Keep it while the project is active, paused, or useful for later resumption. Durable knowledge has a longer horizon and must survive the project that produced it.

A project Topic may later become a durable note, but Phase 1 only records the separate graduation state. It does not perform automatic graduation.

