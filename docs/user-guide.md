# 使用指南

## 常用命令

| 目的 | 示例 |
| --- | --- |
| 保存原始上下文 | `先保存当前会话原文。` |
| 归档每日工作 | `归档今天的工作。` |
| 整理长期知识 | `将当前会话整理到知识库。` |
| 记录问题 | `列举当前会话解决的问题并录入。` |
| 查询历史 | `昨天做了什么，发我详情。` |
| 初始化项目记忆 | `为 Alpha 项目初始化项目记忆。` |
| 记录项目进展 | `记录 Alpha 项目进展：测试通过，下一步补文档。` |
| 恢复项目 | `继续 Alpha 项目。` |
| 维护索引 | `重建知识库索引。` |
| 扫描会话建议 | `有什么可以整理的`、`扫描会话` |
| 主题搜索 | `查找提到超时重试的会话`、`上次 Redis 缓存怎么修的` |
| 知识库召回 | `知识库查询 rabbitmq 管理插件误报`、`记忆检索 nginx 配置优化`（自然语言搜索蒸馏笔记→溯源原始对话块） |
| 查看 hook 状态 | 直接读取 `.claude/settings.local.json` 中的 `hooks` 配置 |

## 五层结构

```text
控制与引导
→ 原始证据和日期记录
→ 项目工作记忆
→ 跨项目长期知识
→ 可重建索引
```

职责边界以 `obsidian-router/references/vault-contract.md`、`note-schema.md` 和 `obsidian-project/references/project-contract.md` 为准。

## 项目工作记忆

旧项目可以继续只有一个入口文件：

```text
02_Projects/Alpha.md
```

明确初始化项目记忆后，可增加：

```text
02_Projects/Alpha/
├── STATUS.md
├── LOG.md
└── TOPICS/   # 首个真实 Topic 出现时才创建
```

- STATUS 保存当前快照。
- LOG 保存有意义的项目事件。
- Topic 保存项目范围内的结论。
- 跨项目可复用知识交给 Distill。
- `继续 Alpha 项目` 默认只读。

完整整理可以更新已经存在的项目记忆，但不能隐式为旧项目初始化伴随目录。

## 读写边界

只读请求：

```text
查看、发给我、列出来、汇总、报告、继续项目
```

写入请求：

```text
保存、记录、录入、写入、更新、归档、初始化项目记忆
```

一句话同时包含读写动作时，只写用户明确指定的目标。

## 知识如何沉淀

```text
Source 保存证据
Daily 保存日期事实
Project 保存当前推进状态
Problem 保存可复用的问题解决
Concept/Decision/Playbook/Skill 保存跨项目知识
Index 提供导航
```

每条解释性或长期笔记都应能返回来源。索引可以重建，不能作为事实依据。

## 日常节奏

- 每天：Source、Daily、必要的 Project/Problem 更新。
- 每周：处理 Inbox、未解决问题和索引异常。
- 每月：审查重复出现的事实是否值得成为长期知识。

## 故障处理

| 情况 | 行为 |
| --- | --- |
| 缺 `.obsidian.yaml` | 只询问缺失字段，不猜路径 |
| Vault 不存在或不是 Obsidian Vault | 停止正式写入 |
| 必备插件或 skills 缺失 | 输出缺失清单，不写 Vault |
| 重复笔记 | 更新或链接既有笔记 |
| 项目名称匹配多个候选 | 暂停并询问 |
| STATUS 与更新的 LOG 冲突 | 报告冲突，不静默选择 |

执行细节由 `obsidian-router/references/contract-map.md` 指向唯一权威契约。
