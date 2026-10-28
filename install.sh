#!/usr/bin/env bash
# 张格格 Obsidian 技能组 — 多环境安装脚本
# 自动检测当前环境（CodeFuse Codex / CodeFuse / Claude Code / Codex / Kilo Code）并安装到正确路径
# v1.5.2: 适配 CodeFuse Codex (cfuse --cx) —— 检测 codefuse/engine/codex/skills 并自动配置 codex hooks.json（同步执行，去掉 async）
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SHARED_DIR="$HOME/.agents/skills"

SKILL_NAMES=(
    "obsidian-router"
    "obsidian-analyst"
    "obsidian-capture"
    "obsidian-daily"
    "obsidian-distill"
    "obsidian-solve"
    "obsidian-project"
    "obsidian-query"
    "obsidian-index"
    "obsidian-suggest"
)

VENDOR_NAMES=(
    "obsidian-markdown"
    "obsidian-bases"
    "json-canvas"
    "obsidian-cli"
    "defuddle"
)

echo "=== 张格格 Obsidian 知识库技能组 安装 ==="

# 1. Deploy main skills to shared directory
echo "[1/3] 部署技能到 $SHARED_DIR ..."
mkdir -p "$SHARED_DIR"
for name in "${SKILL_NAMES[@]}"; do
    src="$SCRIPT_DIR/$name"
    dst="$SHARED_DIR/$name"
    if [ -d "$src" ]; then
        rm -rf "$dst" 2>/dev/null || true
        cp -r "$src" "$dst"
        echo "  $name : OK"
    else
        echo "  $name : SKIP (source missing)"
    fi
done

# 2. Deploy vendor skills if bundled
VENDOR_SRC="$SCRIPT_DIR/vendor/obsidian-skills"
if [ -d "$VENDOR_SRC" ]; then
    echo "[vendor] 部署基座技能..."
    for name in "${VENDOR_NAMES[@]}"; do
        src="$VENDOR_SRC/$name"
        dst="$SHARED_DIR/$name"
        if [ -d "$src" ]; then
            rm -rf "$dst" 2>/dev/null || true
            cp -r "$src" "$dst"
            echo "  $name : OK"
        fi
    done
fi

# 3. Detect and link/copy to each Agent environment
echo "[2/3] 检测 Agent 环境..."

link_or_copy() {
    local target="$1"
    local source="$2"
    local label="$3"

    echo -n "  $label : "
    if [ -L "$target" ] || [ -d "$target" ]; then
        echo "已存在，跳过"
        return
    fi

    mkdir -p "$(dirname "$target")"

    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
        cmd //c "mklink /J \"${target//\//\\}\" \"${source//\//\\}\"" 2>/dev/null && echo "junction OK" || {
            cp -r "$source" "$target"
            echo "复制完成（junction 不可用）"
        }
    else
        ln -sfn "$source" "$target"
        echo "symlink OK"
    fi
}

install_to_env() {
    local env_path="$1"
    local env_name="$2"

    if [ ! -d "$env_path" ]; then
        return
    fi

    echo ""
    echo "  === $env_name ==="
    for name in "${SKILL_NAMES[@]}"; do
        link_or_copy "$env_path/$name" "$SHARED_DIR/$name" "$name"
    done
    for name in "${VENDOR_NAMES[@]}"; do
        local vendor_shared="$SHARED_DIR/$name"
        if [ -d "$vendor_shared" ]; then
            link_or_copy "$env_path/$name" "$vendor_shared" "$name"
        fi
    done
}

# CodeFuse Codex (cfuse --codex / cfuse --cx) 优先，其次标准 Codex/etc
install_to_env "$HOME/.codefuse/engine/codex/skills" "Codex (CodeFuse)"
install_to_env "$HOME/.codefuse/engine/cc/skills" "CodeFuse"
install_to_env "$HOME/.claude/skills" "Claude Code"
install_to_env "$HOME/.codex/skills" "Codex"
install_to_env "$HOME/.kilocode/skills" "Kilo Code"

echo ""
echo "[3/3] 安装完成！"
echo ""

# 4a. Claude Code 引擎契约（cfuse --cc）—— 项目不使用该引擎，仅保留兼容分支
HOOK_SCRIPT="$SHARED_DIR/obsidian-capture/assets/session-logger.mjs"
if [ -f "$HOOK_SCRIPT" ]; then
    echo "[Hook] (Claude engine, optional) 配置自动会话记录..."
    HOOK_SCRIPT_ESC=$(echo "$HOOK_SCRIPT" | sed 's/\\/\\\\/g')

    HOOK_JSON=$(cat <<EOFH
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "node \\"$HOOK_SCRIPT_ESC\\"",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
EOFH
)
    PROJECT_SETTINGS=".claude/settings.json"
    mkdir -p ".claude"
    if [ ! -f "$PROJECT_SETTINGS" ] || [ "$(cat "$PROJECT_SETTINGS" 2>/dev/null)" = "{}" ]; then
        echo "$HOOK_JSON" > "$PROJECT_SETTINGS"
        echo "  Hook installed to $PROJECT_SETTINGS"
    else
        echo "  $PROJECT_SETTINGS already has content, skipping (merge manually)"
    fi
    echo "  To enable globally, add the hook block to ~/.claude/settings.json"
fi

# 4b. Codex 引擎契约（cfuse --codex / cfuse --cx）—— 用户实际使用的环境
CODEX_LOGGER="$SHARED_DIR/obsidian-capture/assets/codex-session-logger.mjs"
CODEX_HOOKS="$HOME/.codefuse/engine/codex/hooks.json"
if [ -f "$CODEX_LOGGER" ]; then
    mkdir -p "$(dirname "$CODEX_HOOKS")"
    echo "[Hook] Codex engine: 自动配置 $CODEX_HOOKS..."
    if [ -f "$CODEX_HOOKS" ]; then
        STAMP=$(date +%Y%m%d-%H%M%S)
        cp "$CODEX_HOOKS" "$CODEX_HOOKS.bak-install-$STAMP"
        echo "  已备份到 $CODEX_HOOKS.bak-install-$STAMP"
    fi
    # 用 node 安全合并（去重 + 保留其它 hooks + 同步执行，不带 async）
    CODEX_LOGGER_JSON=$(node -e 'console.log(JSON.stringify(process.argv[1]))' "$CODEX_LOGGER")
    if node -e '
        const fs=require("fs");
        const p=process.argv[1], logger=process.argv[2];
        const cmd = "node \"" + logger + "\"";
        const cfg = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p,"utf8")) : { hooks: {} };
        if (!cfg.hooks) cfg.hooks = {};
        for (const ev of ["PostToolUse","Stop"]) {
            const blocks = Array.isArray(cfg.hooks[ev]) ? cfg.hooks[ev] : (cfg.hooks[ev]?[cfg.hooks[ev]]:[]);
            const candidates = blocks.filter(b => (b.matcher==null||b.matcher===""||b.matcher===".*"));
            const has = candidates.some(c => (Array.isArray(c.hooks)?c.hooks:[c.hooks]).some(h=>String(h.command||"").includes("codex-session-logger.mjs")));
            if (!has) {
                const h = { type:"command", command:cmd, timeout:10 };
                let target = candidates.length ? candidates[0] : { matcher:".*", hooks:[] };
                if (!candidates.length) blocks.push(target);
                target.hooks = (Array.isArray(target.hooks)?target.hooks:[target.hooks].filter(Boolean)).concat(h);
                console.log("  "+ev+" : added codex-session-logger hook");
            } else {
                console.log("  "+ev+" : already present, skipped");
            }
            cfg.hooks[ev] = blocks;
        }
        const tmp = p+".tmp";
        fs.writeFileSync(tmp, JSON.stringify(cfg,null,2)+"\n");
        fs.renameSync(tmp,p);
    ' "$CODEX_HOOKS" "$CODEX_LOGGER"
    echo "  已写入 $CODEX_HOOKS"
    echo "  注意：hooks.json 有改动 -> Codex 将要求重新 trust。"
    echo "  重启 cfuse --codex (或 cfuse --cx) 使 hook 生效。"
elif [ -z "$CODEX_LOGGER" ] || [ ! -f "$CODEX_LOGGER" ]; then
    echo "[Codex] codex-session-logger.mjs 不存在，跳过 Codex hook 配置。"
fi

echo ""
echo "使用方式: 在对应的 Agent 中输入触发词，如："
echo "  - 「整理到知识库」→ 自动运行完整沉淀链路"
echo "  - 「昨天做了什么」→ 查询每日记录"
echo "  - 「初始化知识库」→ 创建项目配置"
