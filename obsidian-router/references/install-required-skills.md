# Required Skill Installation

Use this file when a customer or agent asks how to install missing skills. Do not search for alternate repositories, renamed packages, or similar-looking skills unless the user explicitly asks to research alternatives.

## Install `kepano/obsidian-skills`

Preferred offline source:

```text
C:/code/obsidian-skills-main.zip
```

Bundled fallback inside this package:

```text
obsidian-router/assets/required-skills/obsidian-skills/
```

If the zip or bundled folder is available, install from local files first. Do not search the internet.

### Multi-Platform Install

The bundled `install.ps1` / `install.sh` in the package root handles auto-detection and installation for all platforms. Run the appropriate script first; manual install below is for special cases.

### Manual Install by Platform

**Any platform** — run the bundled install script:
```bash
# Windows
.\install.ps1
# Mac / Linux / Git Bash
bash install.sh
```

**Manual copy (all platforms)** — copy skill folders to the agent's skills directory:

| Platform | Skills Directory |
|----------|-----------------|
| CodeFuse | `~/.codefuse/engine/cc/skills/` |
| Claude Code | `~/.claude/skills/` |
| Codex | `~/.codex/skills/` |
| Kilo Code | `~/.kilocode/skills/` |

Required skill folders:
```text
obsidian-markdown
obsidian-bases
json-canvas
obsidian-cli
defuddle
```

If `node` or `npm` is missing or blocked, stop and tell the user to repair Node/npm before using the network command. Do not replace this command with another package manager or another repository.

Network command, only when local zip and bundled fallback are unavailable:

```powershell
npx skills add https://github.com/kepano/obsidian-skills
```

## Install This Skill Package

Run the bundled install script:
```bash
# Windows
.\install.ps1
# Mac / Linux / Git Bash
bash install.sh
```

Or manually copy these skill folders to your agent's skills directory:

```text
obsidian-router
obsidian-analyst
obsidian-capture
obsidian-daily
obsidian-distill
obsidian-solve
obsidian-query
obsidian-index
```

After installation, restart your agent or start a new session.

## Verify Installation

Ask your AI coding agent:

```text
检查知识库环境是否齐备。
```

The agent must inspect the vault root, `.obsidian.yaml`, required Obsidian plugins, `kepano/obsidian-skills`, and this package. Formal knowledge-base writes are allowed only when the Markdown-first environment gate passes and Obsidian is opened to the target vault.

## Do Not

- Do not install from unrelated Obsidian repos.
- Do not infer plugin IDs from display names.
- Do not rename these skill folders.
- Do not treat missing `kepano/obsidian-skills` as optional.
- Do not proceed with formal writes when any required skill is missing.