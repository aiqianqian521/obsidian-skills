# Required Environment Gate

This package is for a real Obsidian workflow. Formal knowledge-base writes must stop unless every required item below is ready.

## Required Items

| Item | Required condition |
| --- | --- |
| Obsidian Desktop | Installed on the user's machine. |
| Target vault | Created as an Obsidian vault. |
| Vault open state | Obsidian Desktop is opened to the target vault; the vault root contains `.obsidian/`. |
| Project config | `.obsidian.yaml` exists in the current project root, or initialization is being performed with user-supplied fields. |
| Agent file access | The AI coding agent can read and write the target vault path. |
| Required Obsidian plugins — core | Bases is enabled (`"bases": true` in `core-plugins.json`). |
| Required Obsidian plugins — community | Templater, Calendar, Text Generator, and Excalidraw are listed in `community-plugins.json` AND their folders exist under `.obsidian/plugins/`. |
| Node/npm | Installed and available for skill installation. |
| `kepano/obsidian-skills` | Installed with `npx skills add https://github.com/kepano/obsidian-skills`. |
| This package | Installed in the agent's skills directory. |

## Plugin Check Procedure

**Do not guess plugin status from memory or partial checks.** The agent must read both files:

1. Read `{vault_path}/.obsidian/core-plugins.json` — check `"bases": true`. Bases is a core plugin in Obsidian ≥1.5. Do NOT look for it in community-plugins.json or the plugins directory.

2. Read `{vault_path}/.obsidian/community-plugins.json` — check that `["templater-obsidian", "calendar", "obsidian-textgenerator-plugin", "obsidian-excalidraw-plugin"]` are all present in the array.

3. Verify the plugin folders exist: `ls {vault_path}/.obsidian/plugins/` — must contain `templater-obsidian`, `calendar`, `obsidian-textgenerator-plugin`, `obsidian-excalidraw-plugin`.

**User self-check** (tell the user this when they ask how to verify):
```
打开 Obsidian → Settings → Core plugins → 确认 Bases 已开启
Settings → Community plugins → 确认 Templater/Calendar/Text Generator/Excalidraw 已安装并开启
```



## Config Freshness

The gate checks that `.obsidian.yaml` is not only syntactically valid but also current. A **stale but syntactically valid config fails the gate**: if the vault path, directory mapping, or directory language has changed since the config was written, treat the config as invalid and ask the user to reconfirm before writing. Do not reuse cached or remembered config values.

## Directory Reconciliation

When the configured directories in `.obsidian.yaml` disagree with what actually exists at the vault root, run **Directory reconciliation** before writing: read the config mapping, list the real top-level directories, and report the difference (missing dirs, extra dirs, renamed dirs). Do not silently reconcile by creating paths.

## No Auto-Create

The gate does **not auto-create** missing vault directories or config. Missing directories, a missing `.obsidian.yaml`, or a missing `vault_path` are reported and resolved with the user; they are never created silently to make a write pass.

## Stop Rule

If any item is missing or cannot be confirmed, do not create or update vault notes. Output only:

```text
O: 检查必备环境
O2: 发现缺失项
D: 停止正式写入
A: 输出安装指引
V: 未修改文件
```

Allowed while stopped:

- Explain the missing item.
- Tell the user how to install or enable it.
- Ask for a future `vault_path`.
- Prepare a dry-run write plan without creating vault notes.
- Inspect source projects or existing skill files when the user asks for analysis.

Not allowed while stopped:

- Create `Source`, `Daily`, `Problem`, `Concept`, `Decision`, `Playbook`, `Skill`, `Project`, or index notes in a production vault.
- Treat a plain Markdown folder as a replacement for Obsidian.
- Tell the user that Obsidian, required plugins, Node/npm for skill installation, `kepano/obsidian-skills`, or this package can be skipped for formal writes.