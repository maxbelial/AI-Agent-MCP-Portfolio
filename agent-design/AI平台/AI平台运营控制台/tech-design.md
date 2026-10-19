---
document_category: "TECH_DESIGN"
title: "AI 平台运营控制台 - 技术设计"
version: "v2.1"
last_updated: "2026-09-18"
status: "待架构评审"
---

# AI 平台运营控制台技术设计

## 1. 首期目标

首期只建设 EMS 内部 Agent 使用官方 CLI 访问 ITOM、ITSM、FSM、ITAM、PMS、CMDB、NPM 等内部产品的最小闭环。

```text
业务页面 / 业务事件
  -> 场景路由
  -> 指定 Agent
  -> 按需加载 Skill、查询 CLI 帮助
  -> 形成 CLI 命令
  -> 受控 CLI Runner
  -> EMS CLI
  -> EMS 产品 API
  -> 结构化结果、业务展示与审计
```

首期不建设外部应用连接、用户 CLI 注册、脚本上传、自由 Shell、面向外部 Agent 的 CLI 分发或通用命令编排平台。

## 2. MVP 范围

### 2.1 必须交付

| 能力 | 首期要求 |
| :--- | :--- |
| 场景路由 | 业务场景固定调用指定 Agent |
| Agent | 产品版本定义目标、场景、平台默认模型与备用模型；租户维护业务偏好，并通过治理申请变更自主权档位 |
| Skill | 提供官方任务知识、命令使用方法和结果解释 |
| EMS CLI | 提供首批内部产品查询命令和必要业务写命令 |
| 按需发现 | Agent 可读取命令索引、命令级 `--help` 和错误修正提示 |
| CLI Runner | 解析命令，校验命令范围、参数、身份、租户、风险和超时后执行 |
| 身份权限 | 交互任务继承当前用户身份，后台任务使用平台服务身份 |
| 结果契约 | 返回稳定 JSON、来源、错误和追踪标识 |
| 治理 | 写命令按 L1/L2/L3 执行、确认或审批 |
| 审计 | 记录场景、Agent、Skill、命令、身份、租户、对象和结果 |

### 2.2 暂不交付

- 外部应用连接、外部凭据托管和第三方 CLI 适配。
- 用户安装、登记、注册或上传 CLI、脚本和可执行程序。
- 任意 Shell、管道、重定向和非 EMS 命令执行。
- CLI 制品发布、灰度升级和多运行环境分发控制台。
- Skill 市场、第三方 Skill 安装和跨租户共享；首期仅支持官方 Skill 与本租户业务 Skill。
- Agent 自由选择其他 Agent 或跨 Agent 自主编排。

外部应用仍属于后续方向，但不进入首期页面、数据对象和验收范围。

## 3. 首期核心组件

| 组件 | 职责 |
| :--- | :--- |
| Scene Registry | 保存场景编码、目标 Agent、输入输出和治理策略 |
| Agent Runtime | 理解任务、加载 Skill、查询帮助、形成命令并解释结果 |
| Skill Loader | 按任务加载已发布的官方 Skill 或业务 Skill |
| Command Catalog | 提供首批命令索引、帮助、读写属性、权限和风险信息 |
| CLI Runner | 受控执行 EMS CLI，禁止调用目录外命令和自由 Shell |
| Policy Engine | 校验 Agent 范围、身份权限、租户、对象和自主权档位 |
| Audit Log | 记录调用链、状态、耗时和业务结果 |

## 4. 最小数据对象

### 4.1 CliCommand

`command_id`、`command_path`、`domain`、`description`、`access_type`、`parameters`、`output_contract`、`required_permissions`、`risk_level`、`status`。

### 4.2 SkillVersion

`skill_id`、`version`、`content`、`applicability`、`recommended_commands`、`output_contract`、`status`。

### 4.3 AgentVersion

`agent_id`、`version`、`scene_ids`、`model_ref`、`skill_scope`、`command_scope`、`autonomy_policy`、`status`。

### 4.4 AgentRun 与 CommandRun

记录场景、Agent、Skill、命令、身份类型、租户、对象、参数摘要、结果引用、耗时、错误和最终动作。

### 4.5 ModelSupply 与 ModelInstance

- `ModelSupply`：`supply_id`、`source_type`（平台模型池/BYOK 池）、`owner_tenant_id`、`deploy_scope`、`connection_type`、`credential_alias`、`status`。
- `ModelInstance`：`model_id`、`supply_id`、`provider`、`model_code`、`endpoint`、`capabilities`、`limits`、`price_policy`、`status`。
- `TenantModelOverride`：`tenant_id`、`deploy_scope`、`model_id`、`status`。MVP 对 `(tenant_id, deploy_scope, status=active)` 建立唯一约束。
- `ModelUsage`：`tenant_id`、`agent_id`、`model_id`、`source_type`、`input_tokens`、`output_tokens`、`credits`、`latency_ms`、`status`、`trace_id`。

### 4.6 模型解析

1. 校验租户是否具有目标 Agent License。
2. 查询租户当前部署环境的生效 BYOK；存在时校验状态和能力后使用。
3. 不存在 BYOK 时使用 Agent 的平台默认模型；默认模型不可用时使用平台备用模型。
4. BYOK 已配置但调用失败时返回明确错误，不静默回退平台模型池。
5. 所有结果写入统一 `ModelUsage`，平台池计算 credits，BYOK 只记录 token 和成本归属。

首期不建立外部连接、CLI 制品仓库和多环境分发对象。

## 5. CLI 生成与执行

1. Agent 根据业务目标按需加载 Skill。
2. Agent 通过命令索引或 `--help` 获取相关命令、参数和示例，不加载全部命令定义。
3. 模型在 Agent 允许的命令范围内形成 EMS CLI 命令。
4. CLI Runner 将命令解析为命令路径和参数，拒绝未知命令、Shell 运算符、重定向和未声明参数。
5. CLI Runner 注入当前用户或平台服务身份，校验租户、对象权限和自主权策略。
6. EMS CLI 调用内部产品 API，并返回结构化结果。
7. Agent 依据结果继续分析、请求确认或形成审批动作。

CLI Runner 是安全执行边界，不把 CLI 重新包装成需要在模型上下文中完整注册的工具 Schema。

## 6. 权限模型

```text
有效命令权限 =
  Agent 允许的命令范围
  ∩ 当前用户或平台服务身份权限
  ∩ 租户范围
  ∩ 业务对象权限
  ∩ 场景治理策略
```

- 交互任务自动继承当前 EMS 用户身份。
- 后台任务使用预先配置的平台服务身份。
- MSP 跨租户任务必须由具备相应租户范围的平台服务身份执行，并逐次记录目标租户。
- Skill 只能推荐命令，不能授予权限。
- 用户无需为内部产品 CLI 登记、安装或提前授权。

## 7. CLI 最小契约

- 命令路径稳定并提供命令级 `--help`。
- 帮助至少包含用途、参数、示例、输出字段、权限和风险说明。
- 默认返回 JSON，包含 `success`、`data`、`error`、`source`、`page`、`trace_id`。
- 错误至少区分参数错误、权限不足、对象不存在、冲突、限流、超时和服务异常。
- 查询命令支持筛选、分页和字段选择，避免向模型返回无关数据。
- 写命令支持幂等键，并在执行前重新校验对象状态。
- L2 展示拟执行动作并由用户确认；L3 冻结动作与参数摘要后进入审批。
- 凭证不得出现在命令文本、标准输出或模型上下文中。

## 8. 首期命令选择

首期不追求覆盖全部产品能力。每个试点场景只提供完成闭环所需的最小命令集：

1. 优先提供只读查询命令。
2. 每个场景最多补充少量可验证、可回滚或有明确确认流程的写命令。
3. 首个闭环以 ITOM 告警根因分析为基准，覆盖告警、指标、CI、拓扑、历史事件和近期变更查询。
4. 创建 ITSM 事件作为首期受控写命令，按 L2 手工确认执行。
5. 其他产品域按已确定的业务场景逐批增加，不因建设 CLI 而一次性封装全部 API。

## 9. 安全与审计

- Runner 只执行 Command Catalog 中已启用的 EMS 命令。
- 禁止自由 Shell、任意二进制、管道、重定向和命令替换。
- 参数按命令定义校验，敏感参数只通过安全运行环境注入。
- 日志保存命令 ID 和参数摘要，不保存令牌、密码和敏感原文。
- AI 推测结果与人工确认事实分别记录。
- 审计写入失败时阻止正式写命令。

## 10. 后续演进

完成内部产品 CLI 闭环后，再单独评审以下能力：

- 外部应用官方 CLI 适配与连接管理。
- CLI 版本分发、升级、回滚和多环境兼容。
- Skill 市场、第三方 Skill 安装和跨租户共享。
- 长任务、流式输出、批量任务和取消协议。

后续能力不得反向扩大首期范围。

## 11. 首期架构确认项

1. ITOM 根因分析首批命令清单及输入输出。
2. CLI Runner 的命令解析、隔离和超时方案。
3. 当前用户身份与平台服务身份传递方式。
4. L2 写命令确认快照和幂等实现。
5. Agent、Skill、CommandRun 的最小审计字段。
