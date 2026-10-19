---
doc_type: AGENT_DESIGN_INDEX
epic: AI平台
status: 持续设计
last_updated: "2026-09-23"
---

# 内置 Agent 设计目录

> 本目录分别管理 EMS 15 个内置 Agent 的业务设计、Skill 和 CLI 命令要求。AI 平台 Epic 仅维护统一运营、治理和配置能力。

## 1. 文档职责

每个 Agent 使用独立文档定义：

- 业务目标、用户角色、适用场景和范围边界。
- 触发条件、输入、输出和完整业务流程。
- 确定性规则、模型职责、状态和异常降级。
- 所需 Skill、CLI 命令域、输入输出、权限和审计要求。
- 自主权档位、治理要求、计量口径和验收标准。
- 已有生产能力的复用范围与必须保持的行为。

统一概念、职责边界和通用设计原则以 [AI Agent、Skill 与 CLI 定位说明](../../AI-Agent-Skill-CLI定位说明.md) 为准。

## 2. Agent 导航

| 编号 | Agent | 产品域 | 核心能力 | 主要 CLI 命令域 | 设计状态 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| sa1 | 告警降噪 Agent | ITOM | 告警聚合、动态基线、组合告警 | `itom alert`、`cmdb ci` | 待设计 |
| sa2 | [根因分析 Agent](根因分析Agent.md) | ITOM | 告警 RCA、日志分析、跨数据证据验证 | `itom`、`cmdb`、`npm`、`itsm` | 已形成复用设计 |
| sa3 | [智能开单 Agent](智能开单Agent.md) | ITOM / ITSM | 告警转事件、AI 建议、事件草稿、自动开单 | `itom alert`、`itsm incident`、`cmdb ci` | 方案草稿 |
| sa6 | NEO Agent | 平台 | 自然语言运维交互 | 按场景限制产品命令域 | 待设计 |
| sa7 | 资产巡检 Agent | CMDB | 分类、关系补全、异常和健康度 | `cmdb ci`、`itom metric` | 待设计 |
| sa9 | 容量预测 Agent | ITOM | 容量趋势预测 | `itom metric`、`itom capacity` | 待设计 |
| sa10 | 链路健康 Agent | NPM | 质量异常、路径诊断和劣化预测 | `npm probe`、`npm path`、`cmdb ci` | 待设计 |
| A1 | 文本理解与标签 Agent | ITSM | 工单分类、标签、优先级、资产关联 | `itsm ticket`、`itam asset` | 待设计 |
| A2 | 知识检索与推荐 Agent | ITSM | 知识、案例、清单和备件推荐 | `itsm knowledge`、`fsm work-order`、`itam spare` | 待设计 |
| A3 | 摘要与文档生成 Agent | ITSM | 工单摘要和知识草稿 | `itsm ticket`、`itsm knowledge` | 待设计 |
| A4 | 风险评估 Agent | ITSM | 变更影响、风险评估和同源聚类 | `itsm change`、`cmdb impact` | 待设计 |
| A5 | 数据质量巡检 Agent | ITAM | 台账质量和闲置资产分析 | `itam asset`、`cmdb ci` | 待设计 |
| A6 | 对话助手 Agent | ITSM | IT 自助和外勤对话辅助 | `itsm`、`fsm` | 待设计 |
| A7 | [FSM 调度推荐 Agent](FSM调度推荐Agent.md) | FSM | 工程师推荐、L1/L2 派工和履约反馈 | `fsm workorder`、`fsm engineer` | 待评审 |
| A8 | [ITSM 事件理解与分配 Agent](ITSM智能分单Agent.md) | ITSM | 事件自动分类、标签补全、处理组/处理人推荐与自动分配 | `itsm incident`、`itsm team`、`itsm sla` | 方案草稿 |

> “主要 CLI 命令域”只说明能力入口，不形成 Agent 绑定。最终权限由当前用户或平台服务身份、租户、产品角色、业务对象和场景治理策略共同决定。

## 3. 单 Agent 文档结构

每份 Agent 设计统一包含以下章节：

1. 定位与复用结论。
2. 用户、场景与业务目标。
3. 范围边界。
4. 触发方式与前置条件。
5. 输入与输出契约。
6. 业务流程与确定性规则。
7. 模型职责与提示词约束。
8. Skill 与 CLI 命令要求。
9. 状态、异常与降级。
10. 权限、审计、计量与自主权档位。
11. 验收标准。

## 4. 关联文档

- [AI Agent、Skill 与 CLI 定位说明](../../AI-Agent-Skill-CLI定位说明.md)
- [AI 平台 Epic](../README.md)
- [AI 平台运营控制台 PRD](../AI平台运营控制台/README.md)
