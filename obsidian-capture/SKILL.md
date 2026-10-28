---
name: obsidian-capture
description: Preserve raw source material for an Obsidian knowledge base. Use when the user asks to save the current conversation, capture context, archive raw chat, preserve sources, or create a source note before distilling knowledge.
---

# Obsidian Capture

## Role

Save complete useful context before any summarization. This protects provenance and lets later notes link back to the original evidence.

Emit short status lines using `obsidian-router/references/status-protocol.md`.

## 3. Codex（CodeFuse AntCodex）与 Claude 对称的对话落盘（Auto Capture）

与 Claude 的 PostToolUse hook 对称，本目录新增并部署了：
- `assets/session-logger.mjs`（Claude 用，已存在并修复了被吞反斜杠的路径）
- `assets/codex-session-logger.mjs`（Codex 用，新增）

数据源：Codex 的 rollout JSONL（`<CODEX_HOME>/sessions/YYYY/MM/DD/rollout-*.jsonl`）与 Claude 的 transcript JSONL。**保留全部会话**：用户与助手正文**不截断**（原 8000/5000 字上限会丢长消息，已移除）；并新增标记保留 `assistant-reasoning`（思考）、`function_call`（工具名+入参）、`function_output`（工具结果，限长防爆）；`developer` 中仅跳过自动注入的系统块（权限 / skills / AGENTS / 环境），其余保留。写入路径与格式与 Claude 版一致：`{vault}/90_原始来源/会话记录/{project}/{YYYY-MM-DD}.raw.md`，每条 `## HH:MM | user/assistant`（补充 `## HH:MM | assistant-reasoning/function_call/function_output/developer`），并用 `.session-state` 按 `session_id` 记行号做增量去重。`vault_path` / `project_name` 取自 `{cwd}/.obsidian.yaml`（最多向上 6 层）。

### 3.1 初始化守卫（必须先初始化才能使用 hook）

hook 在落盘前会从 cwd 向上最多 6 层查找 `.obsidian.yaml`：
- **找不到**（或没有 `vault_path`）时：**不写默认库、避免污染**；仅通过 stdout/stderr 输出一次性提醒（每项目每 30 分钟一次）。
- 提醒文案：`[obsidian-capture][<engine>] 未找到 .obsidian.yaml（已从 <cwd> 向上查找 6 层）。保存对话 hook 需先初始化：在项目根放 .obsidian.yaml，至少含 vault_path 与 project_name。本次跳过落盘。`
- 初始化方法：在项目根放 `.obsidian.yaml`，至少包含：
  ```yaml
  vault_path: "E:/your/obsidian/vault"
  project_name: "your-project-name"
  ```
  其余字段（`directory_style`、`timezone`、`directories` 等）见 `../obsidian-router/references/vault-contract.md`。

## 4. 在三个环境开启 / 确认 hook

| 环境 | hook 配置文件 | 触发事件 | 首次启用动作 |
|---|---|---|---|
| Claude Code（独立 CLI） | `~/.claude/settings.json` → `hooks` | `PostToolUse`（matcher `""`） | 确认条目命令为 `node "…/obsidian-capture/assets/session-logger.mjs"`；改后重启 Claude Code |
| CodeFuse 托管 Claude（cfuse / cc 引擎） | `~/.codefuse/engine/cc/settings.json` → `hooks` | `PostToolUse` + `Stop`（matcher `""`） | 加同款条目指向 `session-logger.mjs`；由 `cfuse-hook-cli.exe` 转发，无哈希信任环节 |
| Codex / AntCodex | `~/.codefuse/engine/codex/hooks.json` → `hooks` | `Stop` + `PostToolUse`（matcher `.*`） | 新增/改动后，下次启动 codex 会要求**信任一次**（`~/.codefuse/engine/codex/config.toml` 的 `[hooks.state.*].trusted_hash`），批准后生效 |

> 说明：`cfuse`（`~/.codefuse/fuse/bin/cfuse*.cmd`）是 CodeFuse 总启动器，把同一套 Claude Code hook 协议转发到它托管的两个引擎——`cc`（Claude Code）和 `codex`（AntCodex），因此没有独立的第三个 hook 配置文件，“cfuse 环境”指的就是 **cc 引擎**的 `~/.codefuse/engine/cc/settings.json`。
> 三个环境共同依赖：① 落盘脚本存在于 `obsidian-capture/assets/`；② 当前项目有 `.obsidian.yaml`（否则触发 §3.1 守卫提醒、跳过落盘）；③ 对应引擎已启用 / 信任该 hook。

<!-- obsidian-capture:session-selfcheck:v1 -->
## 5. 对话落盘生效自检（触发模板）

用户说出以下任一意图时，**自动执行本节自检，不要反问、不要只答"不确定"**：
- "当前对话是否保存到知识库" / "这次对话落盘了吗"
- "当前所有会话是否开启 hook 保存到知识库" / "hook 是否生效" / "对话有没有在写知识库"

### 5.1 自检步骤（只读 + 一次真点火）
1. **接入检查**：读取 `~/.claude/settings.json`（PostToolUse）、`~/.codefuse/engine/cc/settings.json`（PostToolUse 与 Stop）、`~/.codefuse/engine/codex/hooks.json`（PostToolUse `.*` 与 Stop），确认条目命令含 `obsidian-capture/assets/session-logger.mjs`（Claude/cc）或 `codex-session-logger.mjs`（Codex）。
2. **Codex 信任**：涉及 Codex 时读 `~/.codefuse/engine/codex/config.toml`，确认落盘脚本所在 `post_tool_use:N:1` 与 `stop:N:1` 索引有 `trusted_hash`；缺失则提示下次启动需信任一次。
3. **守卫判定**：从当前 cwd 向上最多 6 层找 `.obsidian.yaml` 且 `vault_path` 非空；找不到→触发 §3.1 守卫跳过落盘（输出提醒 + 初始化命令）。
4. **真点火 + 写入证据**：在含 `.obsidian.yaml` 的项目执行一次安全工具调用触发 PostToolUse；随即检查写入目录 `<vault>/<directories.sessions>/<project_name>/` 下今日 `YYYY-MM-DD.raw.md` 与 `.session-state` 的 mtime/大小是否为"刚才"。该目录解析自 `.obsidian.yaml`：`vault_path` + `directories.sessions`（默认 `90_原始来源/会话记录`）+ `project_name`。出现"刚才"的新文件→真在落盘；否则当前引擎未真触发（被托管 harness 通常不跑本地 hook，应在本地 `claude`/`codex`/`cfuse` 起会话）。
5. **历史佐证**：列出 `<directories.sessions>/` 下各 `project_name` 子目录最新的 `.raw.md` mtime，说明最近一次真正写入时间。

### 5.2 必含的最终输出（无论结论如何都要给出写入路径）
```
[obsidian-capture] 落盘状态: <已生效 | 仅配置接入未点火 | 守卫跳过>
写入目录: <vault>/<directories.sessions>/<project_name>/
今日文件: <…/YYYY-MM-DD.raw.md>  (mtime=…, size=…)
Codex信任: <已信任 post_tool_use:…/stop:… | 待批准>
最近实写: <project=… 最近 mtime=YYYY-MM-DD>
```
守卫跳过时（无 `.obsidian.yaml`）额外给初始化命令：项目根放 `.obsidian.yaml` 至少含：
```yaml
vault_path: "E:/your/obsidian/vault"
project_name: "your-project-name"
```

﻿## 6. 蒸馏分类（Distill Categorization）

将捕获的原始会话内容自动归类为 **思考 / 解决 / 方案** 三类。**归位路由可配置**：从 `{cwd}/.obsidian.yaml` 读取 `distill_思考` / `distill_解决` / `distill_方案` 键，命中则写入该相对路径（如 `02_项目/loop`、`10_问题解决`）；未配置时缺省回退 `91_蒸馏整理/<类别>`（向后兼容）。

### 6.1 分类规则

| 类别 | 目录路径（默认→可配） | 触发关键词 / 模式 |
|------|------------|-------------------|
| **思考 Context** | `91_蒸馏整理/思考/` → `distill_思考`(如 `02_项目/loop`) | 上下文分析、背景思考、原因分析、不确定因素 |
| **解决 Solution** | `91_蒸馏整理/解决/` → `distill_解决`(如 `10_问题解决`) | 错误排查、问题修复、debug 过程、原因→修复 |
| **方案 Plan** | `91_蒸馏整理/方案/` → `distill_方案`(如 `02_项目/loop`) | 实现方案、设计决策、架构选型、执行步骤 |

### 6.2 蒸馏步骤
1. 从原始会话（`raw.md` 或 hook transcript）中提取每轮 `## HH:MM | user/assistant` 块。
2. 将每条消息归类到上表三类中的一类（可多类，优先级：解决 > 方案 > 思考）。
3. 去重：跳过纯确认、纯状态汇报（`OK` / `done` / `readonly`）等无实质内容的轮次。
4. 按类别分别写入蒸馏文件，每个文件一条类别，同一类别内容合并到同一文件中。

### 6.3 蒸馏文件模板（四元 Frontmatter）
```markdown
---
type: distill
category: <思考|解决|方案>
date: YYYY-MM-DD
project: <project_name>
source: <related raw.md path>
source_reference:
  - <role> {<anchor id>}@<raw file name>
  - <role> {<anchor id>}@<raw file name>
session_id: <session prefix>
---

# <一句话标题>

## 背景 / 上下文
<从用户上下文中提取的背景信息>

## 思考过程
<从 assistant 消息中提取的推理、分析过程>

## 解决方案 / 方案
<最终确定的解决方案或执行方案>

## 关键决策
- 决策1（原因）
- 决策2（原因）

## 关联
- 知识条目: <相关 Obsidian 笔记链接>
- 源代码: <相关文件路径>
- 会话记录: [[90_原始来源/会话记录/<project>/YYYY-MM-DD|当日会话]]
```

### 6.4 蒸馏输出路径
```
{vault_path}/91_蒸馏整理/{category}/{YYYY-MM-DD}-{topic-slug}.md
```
- `category` ∈ [思考, 解决, 方案]
- `topic-slug` 从第一条用户消息提取主题，kebab-case，≤ 60 字符
- 同一日同一类别同一 topic 合并，不重复创建文件

### 6.5 蒸馏脚本

`assets/distill-summary.mjs` 为独立蒸馏脚本，接收与 session-logger 相同的 hook stdin JSON 或直接从 `raw.md` 读取，解析 `## HH:MM | role` 块，按分类规则归类后追加到对应蒸馏文件。

触发方式：
- **Manual**：用户说 `蒸馏当前会话` / `将今天的会话整理放入知识库` → agent 运行 distill-summary.mjs
- **Auto（Stop hook 串联）**：session-summary.mjs 已在 Stop 时写 daily note；distill-summary.mjs 可在同一 Stop hook 中串联运行

### 6.6 蒸馏结果示例
```
[obsidian-capture] 蒸馏完成
类别: 思考 · 解决 · 方案（3 个文件）
思考目录: 91_蒸馏整理/思考/2026-08-25-eth信号异常排查.md
解决目录: 91_蒸馏整理/解决/2026-08-25-eth信号异常排查.md
方案目录: 91_蒸馏整理/方案/2026-08-25-eth日志增强.md
```



## Session Sharding

Large sessions are split across multiple source notes using **Sharding** to keep each raw file reviewable and to preserve provenance. Shards are named with a **numbered suffix** (`YYYY-MM-DD-topic.raw.001.md`, `.002`, ...) and share the same session id and daily JSON. Each shard continues the conversation block counters and points to the previous/next shard so the full session can be reassembled.

## Inputs

- Current conversation context (main conversation OR hook transcript)
- User-provided files, links, or notes
- Optional vault path
- Optional topic/title

## Hook Context Detection (mandatory first step)

This skill may be invoked from a Claude Code hook (Stop, UserPromptSubmit, etc.). When
running in a hook sub-agent, the agent does NOT have direct access to the main
conversation. You MUST detect this and recover the conversation from the transcript.

### Detection

Check your own prompt for a JSON payload. If you see `"transcript_path"` or
`"hook_event_name"` in the text you received, you are running in hook context.

The JSON payload has this structure:

```json
{
  "session_id": "uuid",
  "transcript_path": "/path/to/transcript.jsonl",
  "cwd": "/path/to/project",
  "hook_event_name": "Stop|UserPromptSubmit|..."
}
```

For `UserPromptSubmit` hooks, an additional `"prompt"` field contains the user's message.

### Recovery Procedure

1. Extract the JSON payload from your prompt text (find the `{...}` containing
   `transcript_path`).
2. Parse it to get `transcript_path`, `session_id`, `cwd`, and `hook_event_name`.
3. If `hook_event_name` is `UserPromptSubmit` and `prompt` is present, use it as
   the user message directly.
4. Read the file at `transcript_path`. It is a JSONL file where each line is a
   JSON object. Filter for `type: "user"` and `type: "assistant"` events.
5. Extract the `message.content` from each event as the conversation text.
6. Use this extracted content as the "current conversation context" for the source note.
7. Also read `.obsidian.yaml` at `cwd` (or parent directories) to resolve
   `project_name` and `vault_path` automatically.

### Incomplete Transcript

The transcript at Stop time may not include the final turn (not yet flushed). If the
extracted conversation ends abruptly or the last assistant message is missing:

- Set `capture_scope: partial`.
- Note in `missing_context`: "Transcript at Stop time may omit the final turn.
  transcript_path={path}, last event at line {N}".
- Do NOT fabricate missing content. Mark what you have honestly.

If `transcript_path` is empty or the file does not exist:
- Set `capture_scope: partial`.
- Set `missing_context`: "transcript_path unavailable at hook time".
- If `hook_event_name` is `UserPromptSubmit` and `prompt` is present, save the
  prompt as partial context.
- If nothing is recoverable, create a minimal source note with status `needs-review`
  and explain why.

## Daily JSON Output

In addition to the `.raw.md` source note, also maintain a daily JSON file for AI
quick-recall. This file stores conversation rounds in a structured format optimized
for future AI agents to rapidly understand "what happened last time."

### JSON Path

```
{vault_path}/{directories.sessions}/{project_name}/{YYYY-MM-DD}_daily.json
```

### JSON Schema

```json
{
  "date": "YYYY-MM-DD",
  "project": "project_name",
  "updated": "ISO8601 timestamp",
  "sessions": [
    {
      "session_id": "uuid prefix (8 chars)",
      "start_time": "HH:MM",
      "end_time": "HH:MM",
      "rounds": [
        {
          "round": 1,
          "role": "user|agent",
          "content": "message text",
          "ts": "HH:MM:SS"
        }
      ],
      "summary": "one-line summary of this session",
      "files_touched": ["path1", "path2"],
      "key_decisions": ["decision1"],
      "problems_solved": ["problem1"],
      "source_note": "path to .raw.md file"
    }
  ]
}
```

### Write Rules for Daily JSON

1. Read the existing daily JSON if it exists.
2. If the file exists, append the new session to the `sessions` array.
3. If a session with the same `session_id` already exists, merge/update it
   (last write wins for `rounds`, merge `files_touched` and `key_decisions`).
4. Update the `updated` timestamp.
5. Keep the file valid JSON at all times.
6. Do NOT delete old sessions from the array.

### AI Recall Optimization

The JSON format is designed so a future AI agent can:
- Read `summary` to get the gist without loading all rounds.
- Scan `key_decisions` to understand what was decided.
- Check `files_touched` to know what code changed.
- Read individual `rounds` only when detailed context is needed.

## Required References

Before writing, read:

1. `../obsidian-router/references/status-protocol.md`
2. `../obsidian-router/references/environment-gate.md`
3. `../obsidian-router/references/vault-contract.md`
4. `../obsidian-router/references/write-policy.md`

## Output

Create a source note in the configured `directories.sessions` path:

- Chinese mapping example: `90_原始来源/会话记录/{project_name}/YYYY-MM-DD-HHMM-topic.raw.md`
- English mapping example: `90_Sources/Sessions/{project_name}/YYYY-MM-DD-HHMM-topic.raw.md`

Also create or update the daily JSON at the same directory:
`{project_name}/{YYYY-MM-DD}_daily.json`

## Source Note Requirements

Use `assets/templates/raw-session.md`.

Every source note must include:

- exact date
- source kind
- capture scope: `full` or `partial`
- context available
- missing context
- user goal
- context outline
- raw conversation or useful transcript — each conversation block (`## HH:MM | speaker`) must include a unique 8-character hex UUID anchor, format: `## HH:MM | speaker {00000001}`. Use an incrementing 8-digit hex counter starting from `00000001` for each session (not random — LLM can't generate true random hex). The counter resets per session; combined with the session date in the filename, each UUID is globally unique. This enables future block-level recall by UUID.
- files, links, and artifacts mentioned
- follow-up actions, if present


When capturing a session that contains extraction candidates, mark the raw note with **keyword-tagged** extraction candidates (tags or a dedicated `candidates` frontmatter list) so `obsidian-suggest` can later scan it cleanly. Do not drop the tagged candidates when summarizing.

## Rules

- Do not clean up or rewrite the raw content too aggressively.
- Do not drop constraints, paths, dates, tool results, or user preferences.
- If the full conversation is unavailable, state what context was available.
- If only partial context is available, set `capture_scope: partial` and fill `missing_context`.
- Return the created source note title so other skills can backlink it.
- Always run Hook Context Detection first — before any other processing.
- Always write the daily JSON alongside the source note.

## Hooks Usage Guide

This section answers common questions about using Claude Code hooks with
obsidian-capture. Covers hook lifecycle, status checking, real-time capture setup
(PostToolUse), and both initialized and uninitialized project flows.

### Q1: How to use hooks in the current session?

Hooks are **event-driven and fully automatic**. You do not trigger them manually —
there is no slash command or button. They fire when specific events occur:

| Event | When it fires | What capture does |
|-------|--------------|-------------------|
| `PostToolUse` | After every tool call (real-time) | `session-logger.mjs` appends user/assistant messages to `{date}.raw.md` incrementally |
| `Stop` | Session ends (`/exit`, terminal close, or idle timeout) | Saves full conversation as `{timestamp}-topic.raw.md` + updates `{date}_daily.json` |
| `UserPromptSubmit` | Every time you send a message | Can capture your input immediately (incremental) |

**Lifecycle**:
1. Claude Code starts → reads all settings files → hooks are active.
2. During the session, hooks fire automatically on their events.
3. Session ends → Stop hook fires → capture runs.

**Hot-reload**: Changes to `settings.local.json` or `settings.json` generally require
**restarting Claude Code** to take effect. The safe rule: edit the JSON, then restart.

**How to know hooks worked**: After the session ends, check your project's
project sessions directory (`{directories.sessions}/{project_name}/`). If a new `.raw.md` file and updated `_daily.json` exist
with actual conversation content, the hook worked.

### Q2: How to check what hooks are enabled in the current session?

There is **no `/hooks` slash command** and no `claude --list-hooks` CLI flag.
The authoritative method is to **read the settings files directly** and ask the
AI agent to inspect them during a session.

**Settings file hierarchy** (all three are merged, not overridden):

| File | Scope | Path |
|------|-------|------|
| User settings | Global — all projects, all sessions | `~/.claude/settings.json` |
| Project settings | Shared via git, team-wide | `.claude/settings.json` |
| Local settings | Per-developer, gitignored | `.claude/settings.local.json` |

**Merge rule**: For the same hook event (e.g., `Stop`), hooks from all levels are
**concatenated** — user-level fires first, then project, then local. They do NOT
override each other.

**Quick check — ask the AI agent** (recommended, during a session):
```
检查当前项目是否配置了 obsidian-capture hook
```
The agent will read `.claude/settings.local.json` and report which hooks are active
(Stop, PostToolUse, etc.), the target vault path, and the capture skill being used.

**Quick check — command line** (when not in a session):
```bash
# Check local hooks (Node.js cross-platform):
node -e "try{const d=JSON.parse(require('fs').readFileSync('.claude/settings.local.json','utf8')); const h=d.hooks||{}; console.log('Hooks:',Object.keys(h)); const stop=h.Stop; if(stop) console.log('Stop hook:','configured'); else console.log('Stop hook: MISSING'); const ptu=h.PostToolUse; if(ptu) console.log('PostToolUse hook:','configured (real-time)'); else console.log('PostToolUse hook: MISSING (no real-time capture)')}catch(e){console.log('No settings.local.json or invalid JSON')}"

# Check user-level globals:
node -e "const os=require('os');const p=require('path').join(os.homedir(),'.claude/settings.json');try{const d=JSON.parse(require('fs').readFileSync(p,'utf8'));console.log('Global hooks:',Object.keys(d.hooks||{}))}catch(e){console.log('No global settings.json')}"
```

**What to look for**:

| Hook key | Meaning | Status when missing |
|----------|---------|---------------------|
| `hooks.Stop` with `obsidian-capture` | Full session capture on exit | Session NOT saved on exit |
| `hooks.PostToolUse` with `session-logger.mjs` | Real-time incremental capture | No real-time updates during session |
| Both present | Complete capture: real-time + end-of-session | — |

**How to read hook config from the JSON**:
1. Look for `"hooks"` → it lists all hook event types.
2. Under `"Stop"` → find entries with `"obsidian-capture"` in the prompt string.
3. Under `"PostToolUse"` → find entries with `"session-logger.mjs"` in the command.
4. The `"vault_path"` in the prompt tells you where files are saved.

### Q3: How to enable hooks in other sessions/projects?

**Automatic (recommended)**: When you initialize a project with `obsidian-router` /
`obsidian-index` (i.e., run the init dialog that creates `.obsidian.yaml`), the
initialization flow now **automatically** configures `.claude/settings.local.json`
with the Stop hook pointing to `obsidian-capture`. No manual steps needed — the
`project_name` and `vault_path` from `.obsidian.yaml` are used to generate the hook.

After init, just restart Claude Code and the hook is active. The init flow also
creates the sessions directory (`{directories.sessions}/{project_name}/`) in the vault if it doesn't exist.

**Manual (fallback)**: If you skipped init or need to add capture to an existing
project that was initialized before this auto-config feature existed:

**Step 1**: Create `.claude/settings.local.json` in the project root:
```json
{
  "hooks": {
    "Stop": [{
      "hooks": [{
        "type": "agent",
        "prompt": "使用 obsidian-capture skill 保存本次对话到知识库。\n\n项目信息: project=YOUR_PROJECT_NAME, vault_path=YOUR_VAULT_PATH\n\nHook 数据: $ARGUMENTS\n\n注意: 你在 hook 子 Agent 中运行，无法直接看到主对话。请按照 obsidian-capture skill 的 Hook Context Detection 流程，从上方 Hook 数据中解析 transcript_path，读取 JSONL 转录文件获取对话内容，然后写入 source note 和 daily JSON。",
        "timeout": 120
      }]
    }]
  }
}
```

**Step 2**: `.obsidian.yaml` should already exist from initialization. If not, run
`obsidian-router` initialization first.

**Step 3**: Restart Claude Code. The hook takes effect on next session.

### Q4: How to enable real-time capture (PostToolUse) in an already-initialized project?

If `.obsidian.yaml` already exists and a Stop hook is configured, real-time capture
may not be enabled yet. PostToolUse captures conversations incrementally during the
session — you can see `{date}.raw.md` growing in real time without waiting for exit.

**Prerequisites**:
- `.obsidian.yaml` exists with `vault_path` and `project_name`.
- `.claude/settings.local.json` exists (created during init or Q3 manual setup).
- Node.js is installed (`node --version`).

**Step 1**: Add the PostToolUse hook to `.claude/settings.local.json`.

The PostToolUse hook sits alongside the existing Stop hook. Example merged config:
```json
{
  "permissions": { "...": "keep existing permissions unchanged" },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "node \"C:/Users/lvfushuai/.agents/skills/obsidian-capture/assets/session-logger.mjs\"",
            "async": true,
            "timeout": 10
          }
        ]
      }
    ],
    "Stop": [ "...": "existing Stop hook, keep unchanged" ]
  }
}
```

Important details:
- `"matcher": ""` means fire after every tool call (no filter).
- `"type": "command"` runs a shell command (not an agent prompt).
- `"async": true` means don't block the main session.
- The `session-logger.mjs` path must be absolute and match your system. Find it with:
  ```bash
  ls ~/.agents/skills/obsidian-capture/assets/session-logger.mjs
  # or
  ls ~/.codefuse/engine/cc/skills/obsidian-capture/assets/session-logger.mjs
  ```
- If the file doesn't exist, copy it from the source skill project first.

**Step 2**: Verify the file was merged correctly:
```bash
node -e "const d=JSON.parse(require('fs').readFileSync('.claude/settings.local.json','utf8')); const h=d.hooks||{}; console.log('PostToolUse:',!!h.PostToolUse, 'Stop:',!!h.Stop)"
```
Expected output: `PostToolUse: true Stop: true`

**Step 3**: Restart Claude Code. Both hooks are now active:
- PostToolUse: writes to `{vault}/{directories.sessions}/{project}/{date}.raw.md` in real time.
- Stop: generates full `{timestamp}-topic.raw.md` + `{date}_daily.json` on exit.

**How to verify real-time capture is working**:
1. Start a session and send a few messages.
2. Check the file (do NOT wait for session to end):
   ```bash
   cat "D:/path/to/vault/90_原始来源/会话记录/{project}/{today}.raw.md"
   ```
3. You should see `## HH:MM | user` and `## HH:MM | assistant` entries appearing.

**Note**: The PostToolUse script is a lightweight Node.js process. Each invocation
reads the transcript JSONL, diffs against its last position (tracked in `.session-state`),
and appends only new messages. It does NOT run an LLM agent — it's a fast file append.

### Q5: How to set up capture hooks in a completely uninitialized project?

A project without `.obsidian.yaml` has no knowledge base configuration. Follow these
steps to bootstrap everything from scratch.

**Step 1**: Initialize the knowledge base.

Tell the AI agent:
```
初始化知识库
```
This triggers `obsidian-router` → `obsidian-index` flow, which:
1. Asks you for `vault_path` (Obsidian vault location) and directory language.
2. Creates `.obsidian.yaml` with project configuration.
3. Auto-configures `.claude/settings.local.json` with the Stop hook.
4. Creates the sessions directory `{vault}/{directories.sessions}/{project_name}/`.
5. If the vault is empty, creates seed indexes and framework notes.

**Step 2**: (Optional) Add real-time capture.

After Step 1, the Stop hook is active but real-time capture is not. Tell the agent:
```
帮我开启实时会话捕获 hook（PostToolUse）
```
Or follow Q4 above to manually add the PostToolUse hook.

**Step 3**: Restart Claude Code. All hooks now active.

**Quick bootstrap summary**:
```
用户: 初始化知识库
Agent: [runs obsidian-router init flow, asks vault_path and language]
用户: vault_path=/path/to/vault, 中文
Agent: [creates .obsidian.yaml, .claude/settings.local.json with Stop hook]
用户: 帮我开启实时会话捕获 hook
Agent: [adds PostToolUse hook to settings.local.json]
用户: [restart Claude Code]
→ Both Stop and PostToolUse hooks are active.
```

**What you get after full bootstrap**:
| Artifact | Path |
|----------|------|
| Project config | `.obsidian.yaml` |
| Hook config | `.claude/settings.local.json` |
| Real-time capture | `{vault}/{directories.sessions}/{project}/{YYYY-MM-DD}.raw.md` |
| Session archive | `{vault}/{directories.sessions}/{project}/{timestamp}-topic.raw.md` |
| Daily summary JSON | `{vault}/{directories.sessions}/{project}/{YYYY-MM-DD}_daily.json` |