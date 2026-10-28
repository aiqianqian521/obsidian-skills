---
name: obsidian-query
description: Read and report Obsidian knowledge-base contents without modifying files. Use when the user asks for yesterday's work details, today's archive, current session summary, open problems, historical issues, project details, or to send/list/show Obsidian knowledge-base records.
---

# Obsidian Query

## Role

Answer Obsidian knowledge-base questions by reading existing files. Query mode is read-only by default.

Emit short status lines using `obsidian-router/references/status-protocol.md`.



## Content Search

**Content Search** is full-text search across the vault: term matching in note bodies and frontmatter over the configured directories, including source notes under `directories.sessions` (raw-session transcripts). Content search returns matching files with context snippets and relevance ranking; it never modifies files.

## Query Types

- yesterday work report
- today work report
- current project details
- open problems
- solved problems
- recent sessions
- notes linked to a topic
- content search: full-text search across vault notes
- **semantic search**: TF-IDF ranked search across all vault .md files (requires index built via `assets/build-index.mjs`)
- **graph explore**: BFS traversal of wikilink graph from a starting concept (`assets/graph-explore.mjs`)

## Semantic Search Setup

Build the search index once (re-run after significant vault changes):

```bash
node assets/build-index.mjs <vaultPath> [--indexDir <vaultPath>/99_系统]
```

Query with `--query` flag:

```bash
node assets/build-index.mjs <vaultPath> --query "agent 记忆分层"
```

The index file (`search-index.json`) is stored in `99_系统/`. When performing content search, load this index and use the `search()` function for TF-IDF ranked results, then merge with keyword matches for hybrid ranking.

## Source Wake-up（蒸馏↔原始会话唤醒）

蒸馏笔记（经 `obsidian-distill` 生成）的 frontmatter 会带 `source_reference` 字段，形如：

```yaml
source_reference: user {00000017}@2026-09-05.raw.md
```

`build-index.mjs` 会把该字段并入可检索文本并单独存为 `sourceRef`。因此：

- 按原始会话锚点检索：`node assets/build-index.mjs <vaultPath> --query "00000017"` 可命中所有引用该锚点的蒸馏笔记，且结果含 `sourceRef`。
- 跳回原文：读 `sourceRef` 解析出 `文件路径(2026-09-05.raw.md)` 与锚点号 `{00000017}`，再打开
  `90_原始来源/会话记录/<project>/2026-09-05.raw.md`，按 `## HH:MM | user {00000017}` 定位到对应会话 turn，
  即可把蒸馏结论与当时的思考/方案来源一一对应。
- 触发规则：当用户要求“唤醒/追溯这条结论的原始会话/当时怎么想的”，走本流程；用语义检索定位蒸馏笔记后，再按 `sourceRef` 跳原文。

## Graph Explore Setup

No pre-building needed — parses wikilinks on-the-fly:

```bash
node assets/graph-explore.mjs <vaultPath> --stats
node assets/graph-explore.mjs <vaultPath> --from "概念名" --depth 2
```

Returns subgraph with nodes (name/depth/type) and edges (from/to/direction). Useful for discovering related notes via wikilink traversal.

## Required References

Before querying, read:

1. `../obsidian-router/references/status-protocol.md`
2. `../obsidian-router/references/vault-contract.md`
3. `../obsidian-router/references/lifecycle-playbook.md` when the user asks how to retrieve, continue, reuse, or apply stored knowledge.

## Procedure

1. **主题查档必走语义检索**：当用户要“读取/找知识库里关于某主题的步骤、流程、文档、做法”（如 `读取知识库中关于X的流程`、`查一下知识库里X是怎么做的`、`找一下X的文档`）时，
   必须先用 `assets/build-index.mjs <vaultPath> --indexDir <临时或系统目录> --query "关键词"` 做 TF-IDF 语义检索并给出带路径的命中排序；
   不得只用 shell 的 `Get-ChildItem`/文件名 grep 代替。搜索索引可写临时目录以避免污染 query 只读语义。
2. Resolve relative dates into exact dates.
3. Read daily notes, source notes, problem notes, project notes, and indexes relevant to the date/topic.
4. For content search queries: search across all configured directories for matching terms in note bodies and frontmatter. Report matching files with context snippets and relevance ranking.
5. Summarize in chat:
   - what happened
   - what was created or changed
   - what problems were solved
   - what remains open
   - where details live
   - how to use the retrieved knowledge when the user asks for continuation or reuse
6. Do not write files unless the user explicitly asks to update or save the report.

## Output

Prefer a concise report with file links and exact dates.
