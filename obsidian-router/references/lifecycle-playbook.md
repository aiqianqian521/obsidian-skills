# Lifecycle Playbook

This file defines the durable loop for turning fragments into reusable Obsidian knowledge.

Core loop:

```text
碎片 -> 整理 -> 归类 -> 存储 -> 检索 -> 使用 -> 反馈更新
```

The loop is mandatory for full session organization and reusable knowledge tasks. Do not stop at daily archive when the conversation contains reusable knowledge, solved problems, decisions, workflows, or future retrieval value.

## Operating Premise

The knowledge base stores complete things that are useful to the owner.

Hard rule: all user-provided data and current-session context must enter the database at least once. The minimum storage layer is raw source or inbox. Role analysis may decide that a fragment does not deserve a durable concept/problem/decision/playbook note, but it must not decide that the fragment disappears.

Useful means at least one of these is true:

- It helps solve a similar problem later.
- It preserves evidence, context, or a decision trail.
- It becomes a repeatable workflow, prompt, checklist, or skill rule.
- It helps future writing, content creation, architecture, product operation, or personal decision making.
- It creates a retrieval handle: date, project, topic, problem, person, source, tag, or status.

If none of these is true, store it as raw source or inbox context, not as durable knowledge. Do not drop it.

## Four-Lens Decomposition

Use these lenses before writing when the request says "整理到知识库", "长期使用", "沉淀", "归类", or mentions multiple roles.

| Lens | What it contributes | Required output |
| --- | --- | --- |
| P9 execution lens | Defines success, tradeoffs, owner, verification, and repeatability | A clear done standard and post-write verification |
| Nuwa role lens | Turns vague roles into operating lenses instead of personas | Selected roles, value rules, anti-patterns, output targets |
| ljg rank lens | Reduces the knowledge workflow to irreducible generators | The smallest set of storage decisions that can reproduce future use |
| dbs question lens | Converts vague archive intent into an agent-solvable problem brief | Object, goal, conflict, constraints, feedback entry |

For this skill package, the root generators are:

1. Preserve evidence before interpretation.
2. Classify by future use case, not by where the text happened to appear.
3. Store each atom at the lowest useful durable layer.
4. Link every interpretation back to source.
5. Maintain retrieval paths immediately after writing.
6. Reuse notes in later work and feed the result back into the note.
7. Knowledge librarian is mandatory for every write task and guarantees that all data has a storage target.

## Stage 1: 碎片

Fragments include:

- Current AI agent conversation.
- User ideas typed into chat.
- Bug reports, commands, logs, and file paths.
- Decisions made during work.
- External links, project references, articles, videos, or screenshots.
- Source project files, code snapshots, configs, logs, validation outputs, and attachments that must travel with the vault.
- Daily work traces.

Default action:

- If the fragment is part of an agent conversation, create or update a source note in `90_Sources/Sessions/`.
- If the fragment is a project file or artifact needed for future migration, copy it into `90_Sources/Project Files` or the configured Chinese equivalent before relying on a summary.
- If the fragment is a quick unsorted idea and the user did not ask for full processing, put it in `00_Inbox/` or only keep it in the source note.
- Mark partial captures honestly with `capture_scope: partial`.

Status example:

```text
O: 捕获碎片
O2: 判断为当前会话来源
D: 先存 source
A: 写入 90_Sources/Sessions
V: source 可追溯
```

## Stage 2: 整理

整理 means turning raw context into clear atoms before deciding where to store them.

Extract these atom types:

| Atom | Question | Possible target |
| --- | --- | --- |
| source | 原始证据是什么 | `90_Sources/Sessions` |
| daily fact | 今天发生了什么 | `01_Daily` |
| problem | 解决了什么问题，怎么验证 | `10_Problems` |
| decision | 做了什么取舍，为什么 | `06_Decisions` |
| concept | 形成了什么可复用理解 | `05_Concepts` |
| playbook | 下次如何重复执行 | `09_Playbooks` |
| skill | Agent 以后应如何触发和执行 | `08_Skills` |
| project | 当前项目状态如何变化 | `02_Projects` |
| resource | 外部资料有什么价值 | `04_Resources` |
| open question | 还有什么未解决 | `10_Problems` or `01_Daily` |

整理 output must include:

- One-line summary.
- Evidence/source backlink.
- Suggested target directory.
- Confidence: high, medium, or low.

For a fragment that touches an active project, first ask: **Does it change current project state**? If yes, record the status transition (via `obsidian-project` STATUS/LOG) in addition to the source/daily layers; if not, keep it in the relevant content layer without a project-status update.
- Uncertainty or user-review item when needed.

## Stage 3: 归类

Classify by future retrieval and use, not by topic labels alone.

Use this decision tree:

```text
Is it raw evidence?
  yes -> 90_Sources
  no -> Does it answer "what happened on a date"?
    yes -> 01_Daily
    no -> Does it solve or track a concrete problem?
      yes -> 10_Problems
      no -> Is it a reusable workflow?
        yes -> 09_Playbooks
        no -> Is it a decision/tradeoff?
          yes -> 06_Decisions
          no -> Is it a reusable idea/model?
            yes -> 05_Concepts
            no -> Is it an agent capability/prompt rule?
              yes -> 08_Skills
              no -> Is it external material?
                yes -> 04_Resources
                no -> 00_Inbox
```

When one fragment serves multiple uses, store the source once and create multiple durable notes only when each note passes the reuse test.

## Stage 4: 存储

Storage rules:

- Source first, then daily, then durable notes, then indexes.
- Every durable note must link back to a source note.
- Daily notes summarize the day; they are not the only storage layer.
- Existing notes should be appended or merged before creating new notes.
- Do not write unverifiable claims as facts. Mark them as assumptions or user-review items.
- If a fragment is not useful enough for a durable note, store it in source or inbox with a clear status instead of dropping it.

Minimum storage set for full session organization:

```text
90_Sources/Sessions/YYYY-MM-DD-HHMM-topic.md
90_Sources/Project Files/{project_name}/asset-index.md when local project files are part of the evidence
01_Daily/YYYY-MM-DD.md
10_Problems/*.md when solved/open problems exist
05_Concepts or 06_Decisions or 09_Playbooks or 08_Skills when durable knowledge exists
99_System indexes after writes
```

## Stage 5: 检索

A stored note is not finished until future retrieval paths exist.

Maintain at least these retrieval handles:

- Date: exact `YYYY-MM-DD`.
- Project: configured `project_name`.
- Type: source, daily, problem, concept, decision, playbook, skill, resource.
- Status: inbox, processed, needs-review, active, archived.
- Source backlink.
- Related note links.
- Tags or aliases when useful.

Query behavior:

- Resolve relative dates to exact dates.
- Read daily notes first for time-based queries.
- Read indexes for topic/problem/project queries.
- Follow backlinks to source only when the user asks for detail or evidence.
- Query tasks do not write files unless the user explicitly asks.

Example:

```text
User: 将昨天的工作内容目录的详情内容发给我
Exact date: 2026-07-29
Read: 01_Daily/2026-07-29.md, related source/problem/index notes
Write: no
```

## Stage 6: 使用

Knowledge must be returned in a form the user can act on.

Use modes:

| User intent | Output shape |
| --- | --- |
| Continue work | Current state, next concrete step, relevant files, open risks |
| Solve similar problem | Prior problem, reusable fix pattern, verification checklist |
| Write content | Claim, angle, examples, source links, reusable outline |
| Make decision | Options, tradeoffs, previous decisions, assumptions to verify |
| Improve a skill | Trigger gaps, workflow gaps, acceptance test gaps |
| Review history | Timeline, created notes, solved problems, open items |

If the user asks "怎么使用这条知识", answer with:

1. Applicable scenario.
2. Retrieval phrase to find it later.
3. How to apply it.
4. What evidence would update or invalidate it.

## Feedback Update

Long-term knowledge improves only when later results flow back.

After reuse, update the related note with:

- Date of reuse.
- Context where it was used.
- What worked.
- What failed.
- Whether the note should remain active, be revised, or be archived.

For repeated failures, create or update a problem note instead of silently rewriting the concept.

## Daily, Weekly, Monthly Cadence

Daily:

- Capture source.
- Update daily note.
- Record solved/open problems.
- Create only high-value durable notes.
- Update indexes.

Weekly:

- Review `00_Inbox`, `10_Problems`, and `99_System/*index*`.
- Merge duplicates.
- Promote repeated daily facts into concepts/playbooks.
- Mark stale or weak notes as `needs-review`.

Monthly:

- Summarize new durable knowledge.
- Identify top reusable playbooks.
- Review decisions and outcomes.
- Decide which notes should become articles, project plans, or skills.

## Trigger Phrases

| Phrase | Expected flow |
| --- | --- |
| `把这些碎片整理成以后能用的知识` | analyst -> capture -> daily -> solve -> distill -> index |
| `整理当前会话到知识库，并告诉我以后怎么检索和使用` | analyst -> capture -> daily -> solve -> distill -> index -> use report |
| `只保存原始上下文` | capture |
| `归档今天做了什么` | daily |
| `列举当前会话解决了哪些问题，提取并录入数据库` | analyst -> capture -> solve -> daily -> index |
| `昨天做了什么，发我详情` | query only |
| `用这条知识继续做` | query -> use mode; write only if user asks to update |

## Acceptance Rule

A full lifecycle task passes only when the final report answers:

- What source was preserved.
- What was written to daily archive.
- What durable notes were created, updated, or marked for review.
- Which fragments were kept only as source/inbox and why.
- How indexes were updated.
- How the user can retrieve the content later.
- How the user can use it in the next real task.
