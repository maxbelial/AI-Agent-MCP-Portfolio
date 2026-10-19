# AI - Theme

> 面向 EMS NEO 的 AI 底座能力主题，覆盖 AI 治理、AI 平台与 AI 计费中心，支撑模型接入、NEO Agent、Skill、EMS CLI、场景自主权配置、审计治理与用量计费。

## 1. 业务背景

EMS NEO 标准产品方案需要把 AI 能力沉淀为可运营、可治理、可计量的平台底座。EMS 采用官方 CLI 作为 Agent 访问产品能力的唯一工具接口，并通过配套 Skill 帮助 Agent 发现和使用命令。

## 2. 目标

1. 为 AI 能力提供统一的平台管理入口，覆盖模型、Agent、Skill、CLI、档位、治理与计费。
2. 保证业务页面中使用的 AI 能力均可追溯到场景、Agent、Skill、CLI 命令、模型和档位配置。
3. 支持 MSP / ENT 视角下的多租户隔离、配额控制、审计留痕与权限治理。
4. 为后续研发拆解提供 Theme / Epic / Feature 级需求文档结构。

## 3. 成功指标

| 指标 | 目标值 | 度量方式 |
| ---- | ------ | -------- |
| 内置 Agent 可运营率 | >= 90% | 已完成模型、业务偏好、启用配置并通过场景测试的 Agent 数 / 当期 Agent 数 |
| Agent 正式运行成功率 | >= 95% | 正常完成并返回符合输出契约结果的正式运行次数 / 已进入执行阶段的正式运行次数 |
| 配置发布成功率 | >= 99% | 配置保存后正确形成生效版本或待审批版本的次数 / 有效配置提交次数 |
| AI 运行问题可追溯率 | >= 95% | 能定位场景、Agent、Skill、CLI 命令、模型、业务对象和失败阶段的问题数 / 抽检问题总数 |
| 已评价结果满意率 | >= 80% | 用户评价为满意或评分达到 4 分及以上的 Agent 结果数 / 有效评价结果数 |

审计留痕、租户隔离、最小权限和高风险动作审批属于上线治理要求，不以成功率折算；发现越权访问、绕过审批或审计缺失时，应按产品安全与发布规则处理。

## 4. Epic 清单

| Epic | 说明 | 状态 |
| ---- | ---- | ---- |
| [AI 平台](AI平台/README.md) | 模型接入、Agent Hub、Skill、EMS CLI、场景档位配置 | Draft |
| AI 治理 | 审批、熔断、审计、反馈与治理策略 | 待拆解 |
| AI 计费中心 | credits、BYOK、模型用量、预算与账单 | 待拆解 |

## 5. 范围边界

- In Scope：AI 平台底座的配置、运营、治理、计量与审计能力。
- Out of Scope：业务页面中的具体 AI 使用体验；这些能力在各产品域 Feature 中定义，本文只维护平台侧承载关系。

## 6. 关联资源

- AI 计费与部署模式定义：[`AI计费与部署模式定义.md`](AI计费与部署模式定义.md)
- AI Agent、Skill 与 CLI 定位说明：[`AI-Agent-Skill-CLI定位说明.md`](AI-Agent-Skill-CLI定位说明.md)
- 内置 Agent 设计目录：[`AI平台/Agent设计/README.md`](AI平台/Agent设计/README.md)
- 标准方案原型：[`../prototype/ai/ai-platform.html`](../prototype/ai/ai-platform.html)

## 7. AI 设计约束

1. AI 平台及其 Agent、Skill、CLI 管理能力不适用 Corteza 低代码设计规范。
2. 后续 AI 产品原型、需求文档和技术设计必须遵守《AI Agent、Skill 与 EMS CLI 定位说明》。
3. 业务产品使用何种技术实现不影响 CLI 对外命令契约和 AI 平台设计。
