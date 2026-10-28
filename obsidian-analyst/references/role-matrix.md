# Role Matrix

Use this matrix to select role lenses. Select only roles that match the context, except `knowledge librarian`.

Hard rule: `knowledge librarian` is mandatory for every write task. It guarantees that all user-provided data enters the database at least as raw source or inbox. Other roles decide which additional durable notes should be created.

## Core Roles

| Role | Optimizes for | Stores | Ignores | Main targets |
| --- | --- | --- | --- | --- |
| programmer | executable fixes, commands, code paths, test results | bugs, patches, commands, verification, reusable debugging lessons | vague inspiration without implementation | `10_Problems`, `09_Playbooks`, `02_Projects` |
| architect | system boundaries, invariants, data flow, interfaces | architecture decisions, schemas, contracts, failure modes | one-off implementation trivia | `06_Decisions`, `05_Concepts`, `09_Playbooks` |
| product operator | user workflows, adoption, operational loops | user jobs, workflows, metrics, bottlenecks, rollout steps | purely technical details with no user impact | `02_Projects`, `09_Playbooks`, `06_Decisions` |
| short-video creator | hooks, angles, audience tension, reusable content assets | hooks, scripts, scenes, claims, examples | backend detail that cannot become content | `04_Resources`, `05_Concepts`, `09_Playbooks`, `50_Outputs` if configured |
| personal writer | durable ideas, voice, essays, personal observations | concepts, arguments, metaphors, essay angles, source-backed claims | raw tool logs unless they reveal an idea | `05_Concepts`, `04_Resources`, `09_Playbooks` |
| business decision maker | tradeoffs, risk, resource allocation, strategic choices | decisions, options, constraints, expected consequences | low-leverage implementation detail | `06_Decisions`, `02_Projects`, `03_Areas` |
| knowledge librarian | provenance, dedupe, metadata, indexing | source links, status, frontmatter, aliases, duplicate candidates | opinions without source or owner | `90_Sources`, `99_System`, all note metadata |
| skill designer | repeatable agent behavior | triggers, workflows, resources, done criteria, failure modes | one-off prompt fragments | `08_Skills`, `09_Playbooks` |

## Selection Rules

- If no role order is specified, follow `obsidian-router/references/profile.md`.
- Any archive/write task: include `knowledge librarian` first.
- Current conversation about code or local files: include `programmer`.
- Conversation about skill-package design: include `architect`, `skill designer`, and `knowledge librarian`.
- Conversation about content creation: include `short-video creator` or `personal writer`.
- Conversation about business/project choices: include `business decision maker`.
- If a fragment is not valuable enough for a durable note, `knowledge librarian` still routes it to source or inbox instead of dropping it.

## Nuwa Example Role Policy

When the user mentions Nuwa-distilled roles, use the examples under:

```text
~/.codex/skills/huashu-nuwa/examples
```

Do not copy those roles as decorative personas. Extract their operating lens:

| Nuwa example type | Use as knowledge lens |
| --- | --- |
| `feynman-perspective` | Check whether a note explains the real mechanism instead of only naming concepts. |
| `munger-perspective` | Check incentives, second-order effects, and decision quality. |
| `paul-graham-perspective` | Check founder/user/problem clarity and whether the idea can become writing or product judgment. |
| `zhang-yiming-perspective` | Check system thinking, long-term compounding, and feedback loops. |
| `mrbeast-perspective` or `x-mastery-mentor` | Check content hook, audience retention, and reusable content assets. |
| `andrej-karpathy-perspective` or `ilya-sutskever-perspective` | Check AI/software learning, implementation, and technical understanding. |

Selected Nuwa lenses must end in a write plan:

```yaml
role: feynman-perspective
useful_items:
  - item: ""
    why_useful: ""
    target: ""
storage_floor: "90_Sources or 00_Inbox"
durable_note_needed: true
```

## Conflict Rules

Different roles may disagree:

- Programmer wants details; writer wants abstraction.
- Architect wants stable contracts; operator wants workflow.
- Librarian wants provenance; creator wants angle.

Keep both when both are useful. Store the same source once, then create separate distilled notes with backlinks.

## Role Output Template

```yaml
role: architect
useful_items:
  - item: ""
    why_useful: ""
    target: ""
ignore:
  - item: ""
    reason: ""
uncertainties:
  - ""
```
