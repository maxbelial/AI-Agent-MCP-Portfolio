# AI 平台 - Epic

> AI 平台面向 AI 平台管理员、IT 中层（MSP IT 经理）与 IT 技术人员，提供模型接入、Agent Hub、Skill 管理、EMS CLI 与场景档位五类平台运营能力。

## 1. Epic 目标

1. 统一管理 EMS NEO 可用模型与模型供应商接入信息。
2. 统一托管产品预置的内置 NEO Agent，管理模型、租户业务偏好、启用状态、运行测试与档位治理；场景入口及运行边界随产品版本交付。
3. 统一管理可复用 Skill，并随 CLI 或平台版本向 Agent 提供专业任务知识。
4. 展示和治理 EMS 官方 CLI 的版本、命令目录、运行状态和调用记录。
5. 统一配置 AI 场景自主权档位，确保高风险动作可审批、可审计、可熔断。

## 2. 页面结构

```
AI
└── AI 平台
    ├── 模型接入
    ├── Agent Hub
    ├── Skill 管理
    ├── EMS CLI
    └── 场景档位
```

## 3. Feature 清单

| Feature | 说明 | PRD | 设计汇总 | 状态 |
| ------- | ---- | --- | -------- | ---- |
| AI 平台运营控制台 | 覆盖 `ai-platform.html` 完整页面：模型接入、Agent Hub、Skill、EMS CLI、场景档位 | [README.md](AI平台运营控制台/README.md) | [design.md](AI平台运营控制台/design.md) / [tech-design.md](AI平台运营控制台/tech-design.md) | Draft |

## 4. Agent 设计导航

- [14 个内置 Agent 设计目录](Agent设计/README.md)：每个 Agent 独立维护业务流程、模型职责、Skill、CLI 命令要求、异常降级和验收标准。
- [根因分析 Agent](Agent设计/根因分析Agent.md)：直接复用已在 ITOM 生产运行的 RCA 能力。

## 5. 关键边界

1. AI 平台只管理 AI 能力底座，不替代 ITOM / ITSM / FSM / ITAM / CMDB / NPM 的业务记录系统。
2. 产品预置埋点由产品定义，不允许普通用户在 Agent 库中任意新增业务页面挂载点。
3. 本期仅管理产品预置的内置 Agent，不提供新建、复制或自定义页面挂载能力。
4. CLI 为 EMS 官方产品能力接口，不提供命令注册、脚本上传或自定义二进制发布。
5. 高风险写命令受当前用户或平台服务身份权限、租户与对象权限和场景档位共同约束。
6. 页面通过场景配置调用指定 Agent；Agent 根据提示词和任务上下文从全局 Skill 库与当前租户可用 CLI 中动态选择能力，不在全平台自由选择 Agent。
7. Skill 不拥有命令权限，不能扩大 Agent、当前用户、平台服务身份或外部应用连接已有权限。
8. AI 平台是独立平台能力，不适用 Corteza 低代码设计规范。
9. Agent、默认模型、启停状态、Skill 和 CLI 契约为全局能力资产；业务提示词和运行档位为租户运行策略。
10. CLI 每次运行前必须校验目标租户的产品 License、模块、基础字段和状态映射；能力不完整时阻止相关 AI 场景运行。

## 6. 关联资源

- Agent、Skill 与 CLI 定位说明：[`../AI-Agent-Skill-CLI定位说明.md`](../AI-Agent-Skill-CLI定位说明.md)
- 原型：[`../../prototype/ai/ai-platform.html`](../../prototype/ai/ai-platform.html)
