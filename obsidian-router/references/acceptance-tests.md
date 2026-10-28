# Acceptance Tests

Use these tests before considering the skill package ready for a user.

Run tests against a real disposable Obsidian vault opened in Obsidian Desktop. Do not use a plain Markdown folder as a substitute. Do not run first tests against a customer's production vault. Every test that creates or updates vault notes must pass `environment-gate.md` first.

## Test 0: Required Environment Gate

User prompt:

```text
将当前会话整理到知识库。
```

Run this test with one required item intentionally missing.

Expected behavior:

- If Obsidian Desktop is missing, stop.
- If target vault is not opened in Obsidian, stop.
- If Templater, Calendar, Text Generator, Excalidraw, or Bases is missing, stop.
- If Node/npm is missing, stop.
- If `kepano/obsidian-skills` is missing, stop.
- If this skill package is not installed, stop.
- Do not create source, daily, problem, concept, decision, playbook, skill, project, or index notes.

Expected status:

```text
O: 检查必备环境
O2: 发现缺失项
D: 停止正式写入
A: 输出安装指引
V: 未修改文件
```

## Test 1: Initialize Project Config

User prompt:

```text
初始化当前项目的 Obsidian 知识库配置。
```

Expected behavior:

- If `.obsidian.yaml` is missing, ask only for missing required fields.
- Do not guess `vault_path`.
- Require Obsidian Desktop, target vault, required plugins, Node/npm for skill installation, `kepano/obsidian-skills`, and this skill package.
- After the user supplies `vault_path`, create `.obsidian.yaml` in the current project root.
- Create `99_System/vault-framework.md` and indexes for initialization.
- Do not create a full set of empty business directories unless the user explicitly requests the full standard tree.

Expected status:

```text
O: 检查项目配置
O2: 识别 vault 目录
D: 生成上下文脚手架
A: 写入 .obsidian.yaml 和框架说明
V: 配置已验证
```

Pass criteria:

- `.obsidian.yaml` exists in the project root.
- Config includes `owner`, `vault_path`, `project_name`, `timezone`, and `directories`.
- No config is created under `99_System/` as the primary config.
- Empty business directories are not created without context or explicit user request.

Directory language gate:

- If no directory language is supplied, the initialization dialog must ask `目录语言（必选：中文 / English）：`.
- Before the user chooses a language, `.obsidian.yaml` and business directories must not be written.
- Choosing `中文` produces mappings such as `01_每日工作记录` and `02_项目`.
- Choosing `English` produces mappings such as `01_Daily` and `02_Projects`.
- The implementation must not infer the language from the user's message language, operating-system locale, or a hard-coded default.

## Test 1A: Environment Gate Blocks Missing Skills

Prompt or manual test:

```text
检查知识库环境是否齐备。
```

Expected behavior:

- If `node`, `npm`, `kepano/obsidian-skills`, this package, or required plugins are missing, stop.
- Output the missing items.
- End with `V: 未修改文件`.
- Do not create `.obsidian.yaml`, vault notes, or index files.

Pass criteria:

- Missing skills are listed by exact folder names from `install-required-skills.md`.
- The output does not tell the agent to search for alternate skill packages.

## Test 1B: Empty Vault First Organization

User prompt:

```text
知识库目录还是空，第一次把当前会话整理进去。
```

Setup:

- Use a disposable Obsidian vault opened in Obsidian Desktop.
- The vault root contains `.obsidian/`.
- No managed directories or index files exist.
- Required environment gate passes.

Expected behavior:

- Read `empty-vault-bootstrap.md`.
- Detect the vault as empty.
- Read high-signal project context files before designing the vault structure.
- Use `obsidian-analyst` with at least knowledge librarian, architect, product operator, and skill designer roles.
- Create only active-lane directories derived from the current project context.
- Create `99_System/vault-framework.md` to explain active lanes, inactive lanes, and later creation conditions.
- Create seed indexes.
- Create a project profile note.
- Preserve the current conversation as the first source note.
- Write the first daily setup entry.
- Create durable notes only when the current context contains real reusable content.
- End with retrieval phrases and first-use instructions.

Expected flow:

```text
environment gate -> init/config -> empty-state detection -> project context scan -> analyst -> skeleton/index -> first knowledge event -> retrieval/use report
```

Pass criteria:

- The configured `directories.projects` path contains `{project_name}.md`.
- The configured `directories.sessions` path contains the first raw source note.
- The configured `directories.daily` path contains `YYYY-MM-DD.md` and records the setup.
- The configured `directories.system` path contains seed index files.
- The configured `directories.system` path contains `vault-framework.md` and explains the scaffold.
- Final report states the detected empty state.
- Final report lists selected roles.
- Final report tells the user how to retrieve and use the first records.
- No unexplained empty business directories or empty concept/decision/problem notes are created without real content.

## Test 2: Full Session Organization

User prompt:

```text
将当前会话整理到知识库，并输出状态栏。
```

Expected behavior:

- Read `.obsidian.yaml`.
- Preserve or create a raw source note first.
- Ensure every user-provided fragment is stored at least in source or inbox.
- Write or append the daily note for the exact current date.
- Create problem notes only when real solved/open problems exist.
- Create durable notes only when the reuse test passes.
- Update indexes after writes.
- Read back changed files to verify frontmatter and source backlinks.

Expected flow:

```text
obsidian-analyst -> obsidian-capture -> obsidian-daily -> obsidian-solve -> obsidian-distill -> obsidian-index
```

Pass criteria:

- The configured `directories.sessions` path has a source note.
- The configured `directories.daily` path contains `YYYY-MM-DD.md` or was appended.
- Distilled notes link back to the source note.
- Duplicate notes are not created on the second run.
- Final report lists created files, updated files, source/inbox-only items, user-review items, and verification.

## Test 2A: Project File Archive For Portable Vault

User prompt:

```text
把当前项目关键文件移动归类到知识库，后续直接迁移知识库即可。
```

Expected behavior:

- Read `.obsidian.yaml` and resolve the configured source directory.
- Inventory source project files.
- Copy useful files into `90_原始来源/项目文件/{project_name}/` for Chinese mappings or `90_Sources/Project Files/{project_name}/` for English mappings.
- Classify files as `文档`, `代码`, `配置`, `验证输出`, or `附件` for Chinese mappings; use `Documents`, `Code`, `Config`, `Validation Outputs`, and `Attachments` for English mappings.
- Treat requirement/design `.txt` files as documents, not validation output.
- Skip cache/build artifacts such as `__pycache__`, `.pyc`, and `node_modules` unless the user explicitly asks.
- Generate `asset-index.md` and `asset-manifest.json`.
- Update `99_系统/asset-index.md`.
- Add an `Archived Project Files` section to the project note.
- Leave original runnable project files in place unless the user explicitly asks to delete them after backup.

Pass criteria:

- The vault contains copies of the important source documents, code snapshots, configs, and validation outputs.
- The asset manifest includes original path, vault path, size, SHA256, and category.
- Project/durable notes link to the asset archive or source note.
- Running the archive task twice does not create duplicate files or duplicate project-note entries.

## Test 3: Read-Only Yesterday Query

User prompt:

```text
将昨天的工作内容目录详情发给我。
```

Expected behavior:

- Resolve yesterday to an exact date.
- Read relevant configured daily, source, problem, project, and index files.
- Do not write, update, create, move, or delete files.
- End with `V: 未修改文件`.

Pass criteria:

- Report includes exact date queried.
- Report includes files or directories read.
- Report summarizes work, created knowledge, solved problems, open items, and detail locations.
- No file timestamps change because of the query.

## Test 4: Duplicate Problem Idempotency

User prompt:

```text
列举当前会话解决了哪些问题，提取并录入数据库。
```

Run the same prompt twice on the same conversation.

Pass criteria:

- First run may create problem notes and update `problem-index.json`.
- Second run must not create duplicate problem notes.
- Second run must append evidence or link duplicates to existing notes with a clear reason.
- `problem-index.json` problem count stays stable unless a genuinely new problem is found.

## Test 5: Partial Context Capture

User prompt:

```text
先保存当前会话原始上下文。
```

Expected behavior:

- If the full session is unavailable, create a source note with `capture_scope: partial`.
- Fill `context_available` and `missing_context`.
- Do not pretend the capture is complete.

Pass criteria:

- Source note frontmatter includes `capture_scope`.
- Body states what was captured and what was unavailable.

## Test 6: Full Lifecycle Knowledge Use

User prompt:

```text
把这些碎片整理成以后能用的知识，并告诉我以后怎么检索和使用。
```

Expected behavior:

- Read `lifecycle-playbook.md`.
- Preserve source before interpretation.
- Ensure every fragment has a storage target: source, inbox, daily, problem, decision, concept, playbook, skill, project, or resource.
- Split the input into atoms: source, daily fact, problem, decision, concept, playbook, skill, resource, or open question.
- Classify by future use case, not only by topic.
- Create durable notes only when the reuse test passes; otherwise keep the fragment in source or inbox.
- Update indexes after writes.
- End with a retrieval and use report.

Expected flow:

```text
obsidian-analyst -> obsidian-capture -> obsidian-daily -> obsidian-solve -> obsidian-distill -> obsidian-index -> retrieval/use report
```

Pass criteria:

- Source note exists under the configured source/session path and durable notes link back to it.
- No user-provided fragment is dropped; low-value or uncertain fragments are retained in source/inbox.
- Daily note records what happened on the exact date.
- Durable notes explain future use, not only summary.
- Final report includes retrieval phrases such as "查找某项目的遗留问题" or "继续某 playbook".
- Final report includes at least one use mode: continue work, solve similar problem, write content, make decision, improve a skill, or review history.
- Query follow-up does not write files unless explicitly requested.

## Test 7: Empty Vault With Mixed Project Context

User prompt:

```text
知识库目录还是空，第一次把当前项目和这段会话整理进去。

当前项目里既有 skill 设计文档，也有历史测试输出、临时草稿、README、配置文件。
我希望以后可以直接迁移这个知识库继续开发，不要生成一堆空目录。
目录语言用中文。
```

Setup:

- `.obsidian.yaml` is missing in the current project root.
- The disposable vault contains `.obsidian/` only.
- The project contains at least these file types: `.md`, `.txt`, `.json`, `.yaml`, validation logs, and temporary drafts.
- Required environment gate passes.

Expected behavior:

- Ask for missing required initialization fields only; do not ask again for directory language because the prompt selected `中文`.
- Create `.obsidian.yaml` in the project root using Chinese directory mappings.
- Scan high-signal project context before creating the vault framework.
- Create only active lanes required by the actual context: daily, project, decisions/problems/playbooks if justified, sources/project files, and system indexes.
- Copy important project files into the configured project-file source archive, not move or delete originals.
- Treat requirement/design `.txt` files as documents and logs/results as validation output.
- Create `vault-framework.md` explaining why only these directories exist and when later directories should be added.
- Preserve the current conversation as the first raw source note.
- Write the first daily setup note and project note.
- Update seed indexes and asset manifest.

Expected status:

```text
O: 检查空库和项目配置
O2: 读取项目上下文
D: 选择中文目录和活跃知识通道
A: 写入配置、种子笔记和项目文件归档
V: 回读配置、索引和归档清单
```

Pass criteria:

- No English managed directory such as `01_Daily` appears when `中文` is selected.
- No unexplained empty business directory is created.
- The project archive contains useful files with stable original-path metadata.
- `asset-manifest.json` has no duplicate entries after the same task is run twice.
- The final report tells the user the first retrieval phrases and what was intentionally not created.

Failure modes this test catches:

- Inferring directory language from locale instead of user choice.
- Creating a full empty PARA-style tree without context.
- Moving project files out of the working project.
- Losing portability because key source files were not copied into the vault.

## Test 8: Multi-Role Distillation With Conflicting Reuse Targets

User prompt:

```text
把当前会话整理到知识库。

这次会话同时包含：
1. 一个 AI 编程助手 skill 的触发词设计；
2. 一个 Obsidian 知识库初始化决策；
3. 一个程序员修复过程；
4. 一个短视频选题和 hook；
5. 一段个人写作素材。

你需要从程序员、架构师、skill designer、短视频创作者、个人作家五个维度分别判断怎么归档。
```

Setup:

- `.obsidian.yaml` exists and points to a writable vault.
- The vault already has daily, project, source, system, problem, decision, playbook, and skill directories configured.
- At least one similar problem note and one similar playbook note already exist.

Expected behavior:

- Use `obsidian-analyst` before writing durable notes.
- Preserve the full source first.
- Create or update daily note with only what happened today.
- Create problem notes only for actual solved/open problems.
- Route trigger rules and execution rules to skill or playbook notes.
- Route architecture decisions to decision/project notes.
- Route short-video material to resource/concept/playbook notes only if configured and reusable.
- Route personal writing material to resource/concept notes or source-only if it is not yet reusable.
- Link every durable note back to the raw source note.
- Mark uncertain fragments as source-only or inbox review, not as polished knowledge.

Expected status:

```text
O: 读取会话和现有索引
O2: 多角色识别可复用内容
D: 分流到每日、问题、决策、技能、素材
A: 写入或更新对应笔记
V: 检查反链、重复和待复核项
```

Pass criteria:

- Each of the five requested roles appears in the analyst result or final report.
- The daily note does not contain long evergreen explanations.
- Existing similar notes are updated or linked instead of duplicated.
- Every user fragment is accounted for as durable note, source-only, or user-review item.
- Final report explains how to retrieve each role dimension later.

Failure modes this test catches:

- Treating the whole conversation as one summary note.
- Turning uncertain fragments into authoritative knowledge.
- Creating duplicate notes because existing indexes were not read first.
- Losing role-specific future use cases.

## Test 9: Idempotent Second Run After Manual User Edits

User prompt:

```text
列举当前会话解决了哪些问题，提取并录入数据库。

注意：我刚刚手动改过一个问题笔记和 daily，不要覆盖我的改动。
```

Setup:

- Run the same problem-extraction prompt once.
- Manually edit the created problem note by adding a user-authored section.
- Manually edit the daily note by adding a free-form note.
- Run the prompt again on the same conversation.

Expected behavior:

- Read existing notes and indexes before writing.
- Detect existing problem identity by title, source link, date, aliases, and problem signature.
- Preserve user-authored sections and append only a small evidence/update block if needed.
- Keep `problem-index.json` problem count stable unless a genuinely new problem is present.
- Report that existing notes were reused.

Expected status:

```text
O: 读取已有问题和人工改动
O2: 匹配问题身份
D: 复用已有记录
A: 追加证据而非覆盖
V: 问题数量稳定
```

Pass criteria:

- Manual sections remain byte-for-byte present after the second run.
- No duplicate problem note is created.
- `problem-index.json` keeps the same problem count.
- The final report lists reused notes separately from created notes.

Failure modes this test catches:

- Overwriting user edits during regeneration.
- Relying only on filename for idempotency.
- Recreating the same problem because the source note changed slightly.

## Test 10: Read-Only Query With Hidden Write Temptation

User prompt:

```text
将昨天的工作内容目录详情发给我。
顺便看看有没有缺失索引、坏链、待整理碎片，也告诉我应该怎么修。
```

Setup:

- `.obsidian.yaml` exists.
- Yesterday's daily note, project note, problem index, source notes, and at least one stale/broken link fixture exist.
- Capture file timestamps before the query.

Expected behavior:

- Resolve yesterday to an exact date.
- Read only relevant daily, source, project, problem, and system index files.
- Detect and report missing index entries, stale links, or fragments as recommendations only.
- Do not create repair notes.
- Do not rebuild indexes.
- Do not update timestamps.
- End with `V: 未修改文件`.

Expected status:

```text
O: 解析查询日期
O2: 读取相关目录
D: 只报告不修复
A: 输出目录详情和修复建议
V: 未修改文件
```

Pass criteria:

- The report includes the exact queried date.
- The report includes directories/files read.
- The report separates "已记录内容" from "建议修复项".
- No file timestamp changes.
- No new or modified vault file appears.

Failure modes this test catches:

- Query request accidentally触发 write skills.
- Reporting relative dates without exact date.
- Silently repairing indexes during a read-only request.

## Test 11: Cross-Project Portable Vault Migration

User prompt:

```text
把当前项目关键文件归类到知识库。
这个 vault 后续会迁移到另一台电脑，所以我要能从知识库里看懂项目来源、文件分类、触发词、配置和验收结果。
不要复制 node_modules、缓存和构建产物。
```

Setup:

- `.obsidian.yaml` points to a Chinese-directory vault.
- Project contains nested skill folders, config files, source docs, generated validation outputs, ignored cache/build directories, and large binary attachments.
- The vault already has an earlier project-file archive for the same project.

Expected behavior:

- Resolve the configured project name and source archive directory from `.obsidian.yaml`.
- Inventory project files and skip configured heavy/noise paths.
- Copy useful files into deterministic archive paths.
- Preserve relative paths so the archive can be understood after migration.
- Classify each copied file as `文档`, `代码`, `配置`, `验证输出`, or `附件`.
- For changed files, update the copied artifact and manifest hash.
- For unchanged files, do not create duplicate copies.
- Update project note with one `Archived Project Files` section that links to `asset-index.md`.
- Update `99_系统/asset-index.md`.

Expected status:

```text
O: 扫描项目文件
O2: 识别可迁移资产和噪音
D: 分类复制而非移动
A: 更新 manifest、asset-index 和项目说明
V: 校验数量、哈希和重复项
```

Pass criteria:

- `asset-manifest.json` contains original path, vault path, category, size, and SHA256 for every copied file.
- Re-running the task does not increase manifest count for unchanged files.
- Ignored directories such as `node_modules`, `.git`, cache folders, and build outputs are absent unless explicitly requested.
- Project note has exactly one archive section for the current project.
- Final report includes copied, updated, skipped, and unchanged counts.

Failure modes this test catches:

- Producing a vault that cannot stand alone after migration.
- Duplicating archived files on repeated runs.
- Treating every file as a document.
- Copying heavyweight dependency folders by default.

## Test: Vault Audit Covers Low-Content / Illegal-Filename / Orphan Checks

User prompt:

```text
检查知识库完整性（审计）。
```

Expected behavior:

- `obsidian-index` runs the vault-audit procedure (read-only scan of the configured vault).
- Check 7 detects only-title / empty notes (after stripping frontmatter, headings, and `<!-- ... -->` placeholders, meaningful content below threshold).
- Check 8 detects filenames containing ASCII forbidden characters (`* " \ / < > : | ?`) or full-width lookalikes (`？`, `“`, `”`).
- Check 9 detects files with zero incoming links, excluding structural notes (`_index.md`, `*-index.md`), maintenance records, and raw session files under `90_原始来源/**/*.raw.md`.
- The report is presented per category; the agent does NOT auto-fix. Each fix (rename, archive, add inbound link) is applied only after user confirms, through write-policy actions.
- After confirmed fixes, indexes are rebuilt and a maintenance record is written.

Failure modes this test catches:

- Auto-fixing illegal filenames instead of asking the user.
- Counting raw session files as orphans.
- Missing the only-title / empty note category.
- Producing a report without per-category counts.
