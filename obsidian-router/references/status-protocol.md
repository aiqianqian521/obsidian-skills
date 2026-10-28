# Status Protocol

Every Obsidian knowledge-base task must emit short OODA-like status lines.

## Format

Use one line per phase:

```text
O: 检查配置与现有笔记
O2: 判断内容类型和边界
D: 确定执行流程
A: 写入/读取目标文件
V: 校验结果
```

Keep each line short and concrete.

## Phase Meanings

| Phase | Meaning | Example |
| --- | --- | --- |
| `O` | Observe current state | `O: 读取 .obsidian.yaml` |
| `O2` | Orient and classify | `O2: 识别为会话蒸馏` |
| `D` | Decide workflow | `D: capture->daily->distill` |
| `A` | Act | `A: 更新 3 个文件` |
| `V` | Verify | `V: 链接与索引已校验` |

## Required Use

Emit status lines:

- before initialization dialog
- before every write task
- before read-only query reports
- after verification

## Read-Only Example

```text
O: 读取昨日记录
O2: 汇总工作详情
D: 只读不写
A: 输出报告
V: 未修改文件
```

## Write Example

```text
O: 读取项目配置
O2: 多角色分类完成
D: 写 raw/daily/problem
A: 更新 4 个文件
V: 索引重建通过
```

## Failure Example

```text
O: 未找到配置
O2: 缺少 vault_path
D: 暂停初始化
V: 等待用户填写
```

## Rules

- Keep status separate from the final report.
- Do not print long reasoning in status lines.
- Do not claim verification before reading the written files or index.
- If paused, end with `V: 等待用户填写` or `V: 等待用户确认`.

## Final Delivery Requirements

Every task must end with enough information for the user to verify the result.

For write tasks, include:

- Created files.
- Updated files.
- Skipped items and reasons.
- Items needing user review.
- Whether indexes were updated.
- Verification result after reading back the important written files.

For read-only query tasks, include:

- Exact date or date range queried.
- Directories or files read.
- Summary result.
- `V: 未修改文件`.

Do not end with only "已完成". The user must know where the content landed and how to find it later.

## Required Status Examples

Initialization:

```text
O: 检查项目配置
O2: 识别 vault 目录
D: 生成上下文脚手架
A: 写入 .obsidian.yaml 和框架说明
V: 配置已验证
```

Full session organization:

```text
O: 读取当前会话
O2: 多角色分类
D: capture->daily->solve->distill->index
A: 更新 source/daily/problem/knowledge
V: 链接与索引已校验
```

Solved-problem recording:

```text
O: 读取会话上下文
O2: 提取已解决问题
D: 写入 problem + daily
A: 更新问题记录
V: problem-index 已校验
```

Query:

```text
O: 读取指定日期
O2: 汇总相关记录
D: 只读不写
A: 输出查询结果
V: 未修改文件
```
