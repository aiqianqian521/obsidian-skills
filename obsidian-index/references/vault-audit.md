# Vault Audit

Run a read-only scan of the entire vault to detect structural problems, contradictions, and stale content. Produce a structured report. Never auto-fix — the user confirms each category before changes are applied through existing write-policy mechanisms.

## 0.1 强制执行红线（最高优先级，任何情况不得违反）

> 审计是只读扫描；任何改动必须经用户确认后，通过既有 write-policy 机制执行。以下行为一律视为违规，判定「整改不合规」：

1. **禁止自动删除**：不得在用户确认前删除任何文件；删除必须先列删除计划并获批。
2. **禁止停搁隔离区**：空/仅标题文件进归档隔离区后，必须在本轮强制终审删除或补内容，不得无限期留存于隔离区。
3. **禁止空洞创建**：新笔记在创建时必须通过「内容实质校验」，只有标题/占位注释的不允许直接建成知识笔记。
4. **禁止只报不处置**：审计发现的空文件、孤儿文件不得只列报告不落地修复；每类必须走到删除/入链/填充之一。
5. **禁止孤儿通过**：知识目录下的内容笔记缺入链时不得放行；必须补入链或归档失效片段。

## Audit Checks

### Check 1: Root Drift Files

**Rule**: Scan vault root (not subdirectories) for `.md` files. Exclude `_index.md` and any file explicitly configured as a root-level index.

**Trigger**: Any `.md` file exists at vault root outside configured exclusions.

**Report**: File path + current `type` frontmatter (if present) + suggested target directory determined by `directory-routing.md` rules.

**Fix**: Move file to suggested directory, or user-specified directory.

### Check 2: Type-Directory Mismatch

**Rule**: For each `.md` file in configured knowledge directories (`05_概念/`, `06_决策/`, `09_操作手册/`, `10_问题解决/`), verify that frontmatter `type` matches the directory's expected note type. Mappings:

| Directory | Expected type |
|-----------|-------------|
| `05_概念/` | concept |
| `06_决策/` | decision |
| `09_操作手册/` | playbook |
| `10_问题解决/` | problem |

**Trigger**: Note type does not match directory expectation.

**Report**: File path + actual type + current directory + suggested directory per `directory-routing.md`.

**Fix**: User chooses: move to matching directory, or update type (explain why).

### Check 3: Same-Source Contradiction

**Rule**: Scan `source` frontmatter field across all durable notes (concept, decision, playbook, problem, skill). Find cases where ≥2 notes reference the same source note.

**Trigger**: Multiple active notes share the same `source` link.

**Report**: List of notes sharing the source + each note's one-line conclusion.

**Fix**: User judges whether this is a contradiction (→ `supersede` old note) or complementary angles (→ add cross-reference note in `## Related`).

### Check 4: Stale Open Problems

**Rule**: Scan `10_问题解决/` for notes with `status: open` and `date` older than 90 days.

**Trigger**: Any open problem older than 90 days.

**Report**: File path + days open + last updated date.

**Fix**: User confirms: close as `solved`/`archived`, or keep `open` with a note.

### Check 5: Missing Confidence Field

**Rule**: Scan `concept`, `playbook`, and `skill` notes for the `confidence` field in frontmatter (added in P2 note-schema update).

**Trigger**: Any concept/playbook/skill note without a `confidence` field.

**Report**: File path + current `status` + suggested default value (`active` → `probable`, `draft` → `speculative`, `needs-review` → skip recommendation).

**Fix**: Append `confidence` field with suggested or user-chosen value.

### Check 6: Promotion Candidates

**Rule**: Scan `02_项目/` for project Topics with `graduation: candidate` and `02_项目/{project}/STATUS.md` for project-scoped conclusions that pass the Reuse Test (5-item checklist, ≥2 hits).

**Trigger**: Any Topic marked `graduation: candidate`, or any STATUS.md containing conclusions with clear cross-project reuse potential.

**Report**: Topic/Conclusion title + source project + evidence of cross-project value.

**Fix**: Create a durable note (concept/playbook) in the appropriate directory using `obsidian-distill`, linking back to the original project Topic. Then update Topic `graduation` to `graduated`.

### Check 7: Only-Title / Empty Notes
**Rule**: Scan configured knowledge directories (05_概念, 06_决策, 09_操作手册, 10_问题解决, 02_项目, 01_每日工作记录) for `.md` files whose body has no real content: after stripping frontmatter, headings, and comment placeholders (`<!-- ... -->`), the remaining meaningful content is below a small threshold (recommend < 2 CJK/ASCII word groups). Index files (`_index.md`, `*-index.md`) and maintenance records are excluded from this check.

**Trigger**: A note in a knowledge directory with only a title / frontmatter / placeholder comment and no substantive body.

**Report**: File path + meaningful-content count + suggested action.

**Fix**: User confirms one of: move to `99_系统/归档/` (archive), fill in real content, or delete (following Delete Decision).

### Check 8: Illegal Filename Characters
**Rule**: Scan all `.md` files for filenames Obsidian cannot open or may reject:
- Any of the ASCII characters `* " \ / < > : | ?` in the filename.
- Full-width lookalikes that Obsidian may reject at open time: `？`, `“`, `”`.

**Trigger**: A filename contains an illegal / risky character.

**Report**: File path + offending character + suggested safe rename.

**Fix**: Do NOT auto-rename (respects "no auto move/rename"). Present a rename plan and ask the user.

### Check 9: Orphan Relationship Files
**Rule**: Parse all wikilinks across the vault (reuse `obsidian-query/assets/graph-explore.mjs` incoming/outgoing logic) and find note files with zero incoming links (backlinks).
**Trigger**: A note has incoming-link count = 0.
**Report**: File path + outgoing-link count + suggested action.
**Fix**: User confirms one of: add an inbound link from the relevant index/daily/downstream note (preferred for content notes), or archive the disconnected stub. Structural notes (`_index.md`, `*-index.md`, maintenance records) and raw session files (`90_原始来源/**/*.raw.md`) are excluded from this check because they are legitimate graph roots.
## Audit Procedure

1. Read `.obsidian.yaml` to resolve vault path and configured directories.
2. For each check, scan only the relevant directories. Do not read files outside the scan scope.
3. Build a structured report with findings per check.
4. Present the report to the user with per-category counts.
5. For each category the user confirms, execute fixes one at a time through existing write-policy actions (move, supersede, append confidence field, create durable note).
6. After all confirmed fixes, run `obsidian-index` index rebuild.
7. Report final state: files changed, files unchanged, items needing manual review.

## 通用闭环条款（所有审计整改一律适用）

| # | 条款 | 一句话 | 成功判据 |
|---|------|--------|----------|
| G-A | 删除门 | 空/仅标题文件在隔离区必须本轮终审删除或补内容 | 隔离区无新增滞留空文件；deleted 计数与终审清单一致 |
| G-B | 孤儿子杆 | 孤儿笔记必须补入链或归档 | 每个孤儿命中 入链 或 归档，无放行 |
| G-C | 创建门 | 新笔记通过内容实质校验才可 create | 无阈值以下内容被建成知识笔记 |
| G-D | 终审清点 | 审计结束后未处置项必须单列并说明原因 | 报告列出未处置项+原因，且不再滞留 |
| G-E | 记录门 | 改动落地后必须写维护记录并更新索引 | 维护记录+索引项存在且计数一致 |

## Report Format

```markdown
## 知识库审计报告 — YYYY-MM-DD

| # | 检查项 | 发现 |
|---|--------|------|
| 1 | 根目录漂流 | N |
| 2 | type-目录不匹配 | N |
| 3 | 同 source 矛盾 | N |
| 4 | stale open | N |
| 5 | 缺失 confidence | N |
| 6 | promotion candidates | N |
| 7 | only-title / empty notes | N |
| 8 | illegal filename characters | N |
| 9 | orphan relationship files | N |

### 详情

#### 1. 根目录漂流文件
- `file.md` — type=X, 建议移至 `目标目录/`

...
```

## Verification

After audit fixes complete:
- Read back changed files to verify frontmatter correctness.
- Rebuild indexes and verify counts match expected.
- Report any items left for manual review.