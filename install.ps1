# 张格格 Obsidian 技能组 — 多环境安装脚本 (PowerShell)
# 自动检测环境并安装到正确路径（CodeFuse Codex / CodeFuse / Claude Code / Codex / Kilo Code）
# v1.5.2: 适配 CodeFuse Codex (cfuse --cx) —— 检测 codefuse\engine\codex\skills 并自动配置 codex hooks.json（同步执行，去掉 async）
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SharedDir = "$env:USERPROFILE\.agents\skills"

Write-Host "=== ZhangGege Obsidian Skills Installer ===" -ForegroundColor Cyan

# Skill names
$SkillNames = @(
    "obsidian-router",
    "obsidian-analyst",
    "obsidian-capture",
    "obsidian-daily",
    "obsidian-distill",
    "obsidian-solve",
    "obsidian-project",
    "obsidian-query",
    "obsidian-index",
    "obsidian-suggest"
)

# Vendor skill names (from kepano/obsidian-skills)
$VendorNames = @(
    "obsidian-markdown",
    "obsidian-bases",
    "json-canvas",
    "obsidian-cli",
    "defuddle"
)

# 1. Deploy main skills to shared directory
Write-Host "[1/3] Deploying skills to $SharedDir ..."
foreach ($name in $SkillNames) {
    $src = "$ScriptDir\$name"
    $dst = "$SharedDir\$name"
    if (Test-Path $src) {
        New-Item -ItemType Directory -Force -Path $dst | Out-Null
        Copy-Item "$src\*" "$dst\" -Recurse -Force
        Write-Host "  $name : OK" -ForegroundColor Green
    } else {
        Write-Host "  $name : SKIP (source missing)" -ForegroundColor Yellow
    }
}

# 2. Deploy vendor skills if bundled
$VendorSrc = "$ScriptDir\vendor\obsidian-skills"
if (Test-Path $VendorSrc) {
    Write-Host "[vendor] Deploying bundled foundation skills..."
    foreach ($name in $VendorNames) {
        $src = "$VendorSrc\$name"
        $dst = "$SharedDir\$name"
        if (Test-Path $src) {
            New-Item -ItemType Directory -Force -Path $dst | Out-Null
            Copy-Item "$src\*" "$dst\" -Recurse -Force
            Write-Host "  $name : OK" -ForegroundColor Green
        }
    }
}

# 3. Detect and link/copy to each Agent environment
Write-Host "[2/3] Detecting Agent environments..."
function Link-Skill {
    param($TargetSkillsDir, $AgentName, $SkillName)
    $link = "$TargetSkillsDir\$SkillName"
    if (Test-Path $link) {
        Write-Host "  $AgentName\$SkillName : already exists, skipped" -ForegroundColor Gray
        return
    }
    New-Item -ItemType Directory -Force -Path $TargetSkillsDir | Out-Null
    $shared = "$SharedDir\$SkillName"
    try {
        cmd /c "mklink /J `"$link`" `"$shared`"" 2>$null
        Write-Host "  $AgentName\$SkillName : junction OK" -ForegroundColor Green
    } catch {
        Copy-Item $shared $link -Recurse -Force
        Write-Host "  $AgentName\$SkillName : copied" -ForegroundColor Yellow
    }
}

$envs = @(
    @{Path="$env:USERPROFILE\.codefuse\engine\codex\skills"; Name="Codex (CodeFuse)"},
    @{Path="$env:USERPROFILE\.codefuse\engine\cc\skills";    Name="CodeFuse"},
    @{Path="$env:USERPROFILE\.claude\skills";                Name="Claude Code"},
    @{Path="$env:USERPROFILE\.codex\skills";                 Name="Codex"},
    @{Path="$env:USERPROFILE\.kilocode\skills";              Name="Kilo Code"}
)

foreach ($e in $envs) {
    if (Test-Path $e.Path) {
        Write-Host ""; Write-Host "  === $($e.Name) ==="
        foreach ($name in $SkillNames) {
            Link-Skill $e.Path $e.Name $name
        }
        foreach ($name in $VendorNames) {
            $vendorShared = "$SharedDir\$name"
            if (Test-Path $vendorShared) {
                Link-Skill $e.Path $e.Name $name
            }
        }
    }
}

Write-Host ""
Write-Host "[3/3] Installation complete." -ForegroundColor Green
Write-Host ""

# 4. Auto-configure session recording hooks
# t1) Claude Code 引擎契约（cfuse --cc）—— 项目不使用该引擎，仅保留兼容分支。
#      默认【关闭】：除非设置环境变量 $env:ENABLE_CLAUDE_HOOK=1 时才写 .claude/settings.json，
#      避免污染 dev 仓库、也避免在 claude 引擎上引入安全风险。
if ($env:ENABLE_CLAUDE_HOOK -eq "1") {
    $hookScript = "$SharedDir\obsidian-capture\assets\session-logger.mjs"
    if (Test-Path -LiteralPath $hookScript) {
        Write-Host "[Hook] (Claude engine, optional) Configuring auto session recording..." -ForegroundColor DarkGray
        $hookConfig = @{
            hooks = @{
                PostToolUse = @(
                    @{
                        matcher = ""
                        hooks = @(
                            @{
                                type = "command"
                                command = "node `"$($hookScript -replace '\\','\\')\`""
# async removed: async hooks not supported by Codex v0.140+; sync ensures write
                                timeout = 10
                            }
                        )
                    }
                )
            }
        } | ConvertTo-Json -Depth 4

        $projectSettings = Join-Path (Get-Location) ".claude\settings.json"
        $projectClaudeDir = Join-Path (Get-Location) ".claude"
        if (-not (Test-Path -LiteralPath $projectClaudeDir)) {
            New-Item -ItemType Directory -Force -Path $projectClaudeDir | Out-Null
        }
        if (-not (Test-Path -LiteralPath $projectSettings) -or (Get-Content $projectSettings -Raw).Trim() -eq '{}') {
            Set-Content -Path $projectSettings -Value $hookConfig -Encoding UTF8
            Write-Host "  Hook installed to $projectSettings" -ForegroundColor Green
        } else {
            Write-Host "  $projectSettings already has content, skipping (merge manually)" -ForegroundColor Yellow
        }
        Write-Host "  To enable globally, add the hook block to ~/.claude/settings.json" -ForegroundColor Gray
    }
}

# t2) Codex 引擎契约（cfuse --codex）—— 用户实际使用的环境
$codexLogger = "$SharedDir\obsidian-capture\assets\codex-session-logger.mjs"
$codexHooks = "$env:USERPROFILE\.codefuse\engine\codex\hooks.json"
if ((Test-Path -LiteralPath $codexLogger) -and (Test-Path -LiteralPath (Split-Path -Parent $codexHooks))) {
    Write-Host "[Hook] Codex engine: auto-configuring $codexHooks ..." -ForegroundColor Cyan

    # backup existing hooks.json before any change
    if (Test-Path $codexHooks) {
        $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
        $bak = "$codexHooks.bak-install-$stamp"
        Copy-Item -LiteralPath $codexHooks -Destination $bak
        Write-Host "  Backed up to $bak" -ForegroundColor Gray
    }

    # logger command uses forward slashes (as existing Codex config does)
    $loggerCmd = "node `"$($codexLogger -replace '\\','/')`""

    # build or merge hooks.json
    if (-not (Test-Path $codexHooks)) {
        Write-Host "  hooks.json not found; creating fresh config." -ForegroundColor Yellow
        $cfg = @{ hooks = @{} }
    } else {
        $cfg = Get-Content -LiteralPath $codexHooks -Raw | ConvertFrom-Json
    }

    # ensure hooks dict exists
    if ($null -eq $cfg.hooks) { $cfg.hooks = @{} }

    foreach ($event in @("PostToolUse", "Stop")) {
        # existing blocks as array
        if ($null -eq $cfg.hooks.$event) {
            $blocks = @()
        } else {
            $blocks = @($cfg.hooks.$event)
        }

        # candidate blocks = all-matching (matcher ".*" or empty/absent)
        $candidates = @($blocks | Where-Object { $null -eq $_.matcher -or $_.matcher -eq "" -or $_.matcher -eq ".*" })

        # if ANY candidate already carries the logger -> idempotent, skip
        $hasLogger = $false
        foreach ($c in $candidates) {
            foreach ($h in @($c.hooks)) {
                if ($h.command -like "*codex-session-logger.mjs*") { $hasLogger = $true; break }
            }
            if ($hasLogger) { break }
        }

        if ($hasLogger) {
            Write-Host "  $event : codex-session-logger already present, skipped" -ForegroundColor Gray
        } else {
            $hookEntry = @{
                type = "command"
                command = $loggerCmd
                timeout = 10
            }
            if ($candidates.Count -gt 0) {
                $target = $candidates[0]
            } else {
                $target = @{ matcher = ".*"; hooks = @() }
                $blocks += $target
            }
            $target.hooks = @($target.hooks) + $hookEntry
            Write-Host "  $event : added codex-session-logger hook" -ForegroundColor Green
        }

        $cfg.hooks.$event = $blocks
    }

    $cfgJson = $cfg | ConvertTo-Json -Depth 12
    # 用 ascii 编码写：保证无 BOM，避免 JSON 因 UTF-8 BOM 被 Codex 解析失败。
    # 前提：hooks.json 内命令/路径全为 ASCII（本机 C:/Users/... 路径满足）。
    # 若未来 hooks 路径含中文，须改为「UTF-8 无 BOM」写入，否则 ascii 会损坏非 ASCII 字符。
    Set-Content -LiteralPath $codexHooks -Value $cfgJson -Encoding ascii
    Write-Host "  Written to $codexHooks" -ForegroundColor Green
    Write-Host "  NOTE: hooks.json changed -> Codex will require re-trust." -ForegroundColor Yellow
    Write-Host "  Restart cfuse --codex (or cfuse --cx) to apply hook." -ForegroundColor Yellow
} elseif (-not (Test-Path $codexLogger)) {
    Write-Host "[Hook] codex-session-logger.mjs not found; skipping Codex hook config." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Example prompts:"
Write-Host "  - Organize this into the knowledge base"
Write-Host "  - Show what I did yesterday"
Write-Host "  - Initialize the knowledge base"
