# 安装与初始化

## 必备环境

当前版本执行正式 Vault 写入前要求：

- Obsidian Desktop 已安装并打开目标 Vault。
- Vault 根目录存在 `.obsidian/`。
- Bases 已启用。
- Templater、Calendar、Text Generator、Excalidraw 已安装并启用。
- Node/npm 可用。
- `kepano/obsidian-skills` 与本技能包已安装。

完整、可执行的环境判断以 `obsidian-router/references/environment-gate.md` 为准。本页不替代该契约。

## 安装技能包

Windows：

```powershell
.\install.ps1
```

macOS、Linux 或 Git Bash：

```bash
bash install.sh
```

安装脚本会把 10 个主 Skills 部署到共享目录，并连接已存在的 Agent 环境。

## 手动安装

复制以下目录到 Agent 的 skills 目录：

```text
obsidian-router
obsidian-analyst
obsidian-capture
obsidian-daily
obsidian-distill
obsidian-solve
obsidian-project
obsidian-query
obsidian-index
obsidian-suggest
```

同时安装 `vendor/obsidian-skills/` 中的 Obsidian 基座 Skills，或执行：

```powershell
npx skills add https://github.com/kepano/obsidian-skills
```

安装后重启 Agent 或开始新会话。

## 初始化项目连接

在需要连接 Vault 的项目根目录说：

```text
初始化当前项目的 Obsidian 知识库配置。
```

Agent 会询问缺失字段。目录语言必须明确选择 `中文` 或 `English`，不能根据系统或消息语言推断。

主配置位于当前项目根目录：

```text
.obsidian.yaml
```

最小字段：

```yaml
owner: 张格格
vault_path: "D:/Obsidian/ZhangGege"
project_name: "current-project"
directory_style: chinese
timezone: Asia/Shanghai
directories:
  daily: 01_每日工作记录
  projects: 02_项目
  concepts: 05_概念
  problems: 10_问题解决
  sources: 90_原始来源
  sessions: 90_原始来源/会话记录
  system: 99_系统
```

目录完整契约见 `obsidian-router/references/vault-contract.md`。

## 首次验收

按顺序执行：

```text
检查知识库环境是否齐备。
先保存当前会话原始上下文，不做知识蒸馏。
归档今天的工作。
昨天做了什么，发我详情。
为当前项目初始化项目记忆。
继续当前项目。
```

查询和项目恢复必须显示：

```text
V: 未修改文件
```

不要在正式 Vault 上做第一次行为测试。开发验证使用包内 disposable fixtures。

