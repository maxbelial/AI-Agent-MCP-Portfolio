# EMS AI 计费与部署模式定义

> 状态：核心计费模式已确认，价格参数待商务评审  
> 适用范围：EMS AI 平台、AI 计费中心、授权管理、模型接入、Agent Hub 及业务页面 AI 场景

## 1. 评审目标

统一 AI License、部署方式、租户类型、模型供给和模型用量计费的产品定义，明确不同客户形态下 AI 计费中心及相关页面的展示规则。

## 2. 核心原则

1. AI License 是软件供应商定义和收费的软件功能授权，同时是 Agent 功能可用性的上限。
2. 部署方式与租户类型相互独立。私有化部署客户可以是普通 ENT，也可以是管理下属租户的 MSP。
3. 保留 Credits 与 Token 两种对外用量模式：平台模型按 Credits 结算，BYOK 按输入/输出 Token 展示技术用量。
4. 平台模型的底层 Token 成本只用于内部核算，对外不展示供应商 Token 单价和 Credits 换算公式。
5. 租户自行 BYOK 时，模型成本由租户承担，不消耗或产生计费 Credits；EMS 只记录调用量和 Token 用量。
6. MSP 可以按下属租户分别选择模型服务模式，同一租户同一结算周期只允许一种模式生效。
7. SaaS MSP 转售平台模型时，平台定义结算基准，MSP 可以配置面向下属租户的 Credits 零售价。

## 3. 基础定义

### 3.1 部署方式

| 编码 | 定义 | 配置方 |
| --- | --- | --- |
| `saas` | 使用软件供应商运营的 SaaS 平台 | 软件供应商 |
| `private` | 在客户指定环境独立部署 | 软件供应商在交付时配置 |

部署方式属于实例级配置，租户管理员不可修改。

### 3.2 租户类型

| 编码 | 定义 | 是否管理下属租户 |
| --- | --- | --- |
| `ENT` | 普通企业租户 | 否 |
| `MSP` | 为多个下属租户提供运营或服务的租户 | 是 |

私有化部署不等于 MSP。普通企业私有化部署使用 `private + ENT`。

### 3.3 模型服务模式

| 编码 | 定义 | 模型成本承担方 | 对下属租户收费 |
| --- | --- | --- | --- |
| `platform_managed` | SaaS 平台提供模型 | 软件供应商或平台运营方 | 按 Credits；MSP 可配置零售价 |
| `msp_managed` | MSP 提供云模型 Key 或本地模型 | MSP | 按 Token 展示；是否收费及价格由 MSP 自营 |
| `tenant_byok` | 租户提供云模型 Key 或本地模型 | 使用模型的租户 | 不收模型用量费 |

`platform_managed` 仅适用于 SaaS。私有化 ENT 默认使用 `tenant_byok`。私有化 MSP 可以选择 `msp_managed` 或允许下属租户使用 `tenant_byok`。

## 4. AI License

### 4.1 定义

- AI 功能以 Agent 为授权单元。
- License 由软件供应商签发，包含 Agent、数量或适用范围、开始时间、到期时间和授权状态。
- SaaS 由授权服务在线校验；私有化支持授权服务同步或离线授权文件。
- 客户管理员只能把已授权 Agent 分配给内部用户，不能扩大供应商授权范围。

### 4.2 可用性公式

```text
Agent 可用
= 供应商 License 有效
∩ Agent 已启用
∩ 当前用户具有业务权限
∩ 模型实例可用
∩ 场景要求的 CLI 能力就绪
```

### 4.3 收费边界

AI License 与模型用量费分离。无论使用平台模型、MSP 模型或租户 BYOK，Agent License 均由软件供应商按合同收取。

## 5. Credits 与 Token 计量

### 5.1 内部计量

每次模型调用记录：

- 输入 Token、输出 Token。
- 模型供应商和模型实例。
- Agent、租户、业务场景和 trace ID。
- 模型实际成本或成本估算。
- 平台模型调用换算后的 Credits。

参考换算：

```text
模型成本 = 输入 Token × 内部输入成本价 + 输出 Token × 内部输出成本价
计量 Credits = 模型成本 ÷ Credit 基准价值 × 模型系数
```

换算参数由内部成本管理员维护，不出现在租户模型接入页面。BYOK 调用不执行面向客户的 Credits 换算。

### 5.2 两种对外用量模式

| 模式 | 适用范围 | 对外用量 | EMS 模型用量费 |
| --- | --- | --- | --- |
| Credits 模式 | `platform_managed` | Credits 消耗、额度、余额和超量 | 产生 |
| Token 模式 | `msp_managed`、`tenant_byok` | 输入 Token、输出 Token、调用次数 | 不产生平台计费 Credits |

计费规则：

```text
platform_managed：billable_credits = platform_metered_credits
msp_managed：billable_credits = 0，记录 input_tokens / output_tokens
tenant_byok：billable_credits = 0，记录 input_tokens / output_tokens
```

`msp_managed` 下 MSP 可以基于 Token 用量或固定订阅费自行向下属租户收费，但这属于 MSP 自营价格，不转换成 EMS 平台 Credits。

### 5.3 对外账单

Credits 模式对外账单展示：

- Agent License。
- Credits 套餐、内含额度、消耗、剩余和超量。
- 固定订阅费，启用时展示。
- 应付金额和结算周期。

Token 模式对外账单展示调用次数、输入 Token、输出 Token及 MSP 自营收费项目；租户自行 BYOK 时不展示模型应付金额。任何模式均不展示平台内部换算系数和内部模型成本。

## 6. MSP 商业模式

### 6.1 MSP 转售 SaaS 平台模型

下属租户选择 `platform_managed` 时，模型调用消耗 Credits：

- 平台按照与 MSP 约定的结算基准向 MSP 扣减或结算 Credits。
- MSP 可以配置面向下属租户的 Credits 零售价、内含额度、超量单价和固定订阅费。
- MSP 零售价不得改变调用量和 Credits 消耗量，只影响下属租户应付金额。
- 计费中心分别展示平台结算成本、租户收入和毛利，不向下属租户展示平台内部成本价。

### 6.2 MSP 提供自有模型并收费

MSP 选择 `msp_managed`，向下属租户提供模型服务。

可配置：

- Token 计价规则或仅展示用量。
- 订阅周期。
- 内含 Token 用量。
- 超量 Token 单价。
- 固定订阅费开关及金额。

计费中心展示 Token 用量、订阅费、超量费、收入、成本和毛利。该价格由 MSP 自营维护，不产生 EMS 平台计费 Credits。

### 6.3 租户自行 BYOK

MSP 选择允许下属租户使用 `tenant_byok`。租户自行接入模型并直接承担供应商或本地推理成本。

计费中心只展示连接状态、调用量、输入/输出 Token、异常和 Agent License；模型订阅费、Credits、超量费、收入和毛利全部隐藏。

### 6.4 AI 用量计费总开关

平台提供实例级 `ai_usage_billing_enabled` 商业开关，由软件供应商平台管理员配置，租户管理员和 MSP 管理员无权修改。该开关统一控制整个平台是否启用 Credits 或 Token AI 用量计费，适用于 MSP、MSP 下属租户和直客 ENT。

| 开关状态 | MSP 自有模型的产品行为 |
| --- | --- |
| 开启 | 按租户模型服务模式启用 Credits 或 Token 计费；MSP 可以按已授权规则维护下属租户价格 |
| 关闭 | 所有租户停止 Credits 和 Token 计费，不生成模型用量费用；保留输入/输出 Token、调用次数、成功/失败状态和调用记录 |

控制规则：

- 关闭总开关不删除历史价格、历史账单和审计记录。
- 关闭后，已有 Token 或 Credits 零售价仅对已结算账期保留；当前及后续未结算账期停止模型用量计费。
- 所有租户计费中心隐藏 Credits 额度、余额、超量、Token/Credits 单价和用量应付金额，保留输入/输出 Token、调用次数及调用记录。
- SaaS 平台模型产生的内部成本仍可供软件供应商内部核算，但不得生成 MSP 或直客租户账单。
- 固定订阅费是独立能力，不因模型用量计费权限关闭而自动取消；是否允许仍由 `fixed_subscription_enabled` 控制。
- 平台重新开启后，平台或 MSP 必须确认价格及生效日期，不能自动恢复旧价格。
- 所有开启、关闭和重新启用操作必须记录操作人、原因、生效时间及受影响租户。
- 原型与正式页面关闭后不展示解释横幅；计费模式、额度、价格、超量和金额字段直接移除，不使用`—`占位。关闭规则及影响范围只在需求文档和帮助文档中说明。

### 6.3 MSP 配置项

```text
模型服务方式
○ SaaS 平台模型（Credits）
○ MSP 自有模型（Token）
○ 租户自行 BYOK

收取固定订阅费     开 / 关
```

“收取固定订阅费”只在 MSP 对下属租户提供收费模型服务时显示。关闭后仍可按对应 Credits 或 Token 用量收费，但不产生固定订阅费。

## 7. 普通私有化 ENT

标准组合：

```text
deployment_mode = private
tenant_type = ENT
model_supply_mode = tenant_byok
model_resale_enabled = false
```

产品行为：

- 软件供应商收取软件 License、Agent License及约定的私有化部署或维护费用。
- ENT 管理员接入企业云模型 Key 或本地模型。
- 系统记录输入/输出 Token 和调用量，`billable_credits = 0`，不向客户展示 Credits。
- 不显示任何 MSP、下属租户、模型转售、订阅定价、收入或毛利功能。

## 8. 部署与租户矩阵

| 组合 | 模型供给 | Agent License 收费方 | 模型用量收费 | 计费中心主视图 |
| --- | --- | --- | --- | --- |
| SaaS ENT | 平台模型或 ENT BYOK | 软件供应商 | 平台模型按 Credits；BYOK 不收费 | 授权、Credits 或 BYOK 用量 |
| SaaS MSP | 平台模型、MSP 模型或租户 BYOK | 软件供应商 | 按所选商业模式 | 多租户 Credits、订阅、收入或 BYOK 用量 |
| 私有化 ENT | ENT BYOK | 软件供应商 | 不收模型用量费 | 授权与技术用量 |
| 私有化 MSP | MSP 模型或租户 BYOK | 软件供应商 | MSP 获得定价权限时可按 Token 自营收费；租户 BYOK 不收费 | 多租户 Token 用量、订阅或 BYOK 用量 |

## 9. 页面呈现清单

### 9.1 授权管理

所有组合均显示：

- 已授权 Agent。
- License 生效时间、到期时间和状态。
- 授权来源为软件供应商。

仅软件供应商角色可签发、续期、调整或撤销 Agent License。

### 9.2 模型接入

显示：

- 模型名称、供应商、连接类型、服务地址、凭证别名。
- 能力、上下文窗口、最大输出、QPS、超时和状态。
- 模型来源和归属租户。

隐藏：

- 输入 Token 单价。
- 输出 Token 单价。
- Credits 换算系数。
- 对租户售价。

### 9.3 Agent Hub

显示平台默认模型和平台备用模型配置。租户存在生效 BYOK 时，运行期使用租户 BYOK；租户 BYOK 失败不静默回退平台模型。

Agent Hub 不维护 Credits 价格、Token 价格或订阅费。

### 9.4 AI 计费中心：SaaS ENT

- 平台模型：显示 License、Credits 配额、消耗、余额、超量和账单。
- ENT BYOK：显示 License、连接状态、调用量和输入/输出 Token；隐藏 Credits 和模型费用。

### 9.5 AI 计费中心：SaaS MSP

- SaaS 平台模型：显示各租户 Credits、MSP 零售价、固定订阅费、超量费、收入、平台结算成本和毛利。
- MSP 自有模型：获得模型用量计费权限时显示各租户 Token 用量、标准价、订阅费、收入、成本和毛利；未获得权限时只显示用量。
- 租户自行 BYOK：显示各租户连接与技术用量；隐藏订阅费、售价、收入和毛利。
- 两种模式可以按租户配置，但同一租户同一结算周期只能有一种生效模型服务方式。

### 9.6 AI 计费中心：私有化 ENT

页面名称建议为“AI 用量与授权”。

显示：

- Agent License。
- BYOK 连接和模型健康。
- 调用次数和输入/输出 Token 用量。
- 成功率、失败原因和预算预警。

隐藏：

- MSP 视角和租户组合。
- Credits、Token 售价和应付模型金额。
- 固定订阅费和超量费。
- 收入、成本和毛利分析。

### 9.7 AI 计费中心：私有化 MSP

- `msp_managed`：获得模型用量计费权限时展示下属租户 Token 用量、订阅和经营分析；未获得权限时只展示用量。
- `tenant_byok`：展示下属租户连接及技术用量，不展示模型收费字段。
- 软件供应商 Agent License 与 MSP 模型服务收入分开显示，不合并为一笔费用。

### 9.8 业务 AI 页面

业务页面只显示 Agent 是否可用、执行状态、结果、失败原因及必要的用量提示，不显示 Token 单价和模型成本。

不可用时按原因区分：

- License 未开通或已过期。
- 模型未接入或不可用。
- Credits 不足，仅适用于可计费模型服务。
- CLI 或业务数据不完整。

## 10. 配置与显隐规则

建议保存以下实例级或租户级配置：

```json
{
  "deployment_mode": "saas | private",
  "tenant_type": "ENT | MSP",
  "model_supply_mode": "platform_managed | msp_managed | tenant_byok",
  "model_resale_enabled": false,
  "ai_usage_billing_enabled": false,
  "fixed_subscription_enabled": false
}
```

关键规则：

1. `tenant_type = ENT` 时隐藏全部下属租户和转售功能。
2. `deployment_mode = private` 时不提供 SaaS 公共模型池。
3. `model_supply_mode = tenant_byok` 时强制 `model_resale_enabled = false`。
4. `model_resale_enabled = false` 时隐藏面向下属租户的订阅费、Credits/Token 售价、超量价格、收入和毛利。
5. `ai_usage_billing_enabled = false` 时，对所有租户关闭 Credits 和 Token 计费，隐藏价格、额度、超量与应付金额，保留 Token 技术用量和调用量。
6. `fixed_subscription_enabled` 仅控制固定订阅费字段，不影响 Credits 或 Token 用量收费。

### 10.1 权限要求

| 权限 | 建议权限码 | 使用者 |
| --- | --- | --- |
| 开启或关闭全平台 AI 用量计费 | `ai.billing.usage-billing.manage` | 软件供应商平台管理员 |
| 维护 Token 价格 | `ai.billing.token-price.manage` | 已获授权的 MSP 计费管理员 |
| 查看 Token 价格和账单 | `ai.billing.token-price.view` | MSP 财务或计费用户 |

前端显隐不能替代服务端鉴权。所有价格保存、发布和账单计算接口必须先校验 `ai_usage_billing_enabled`；关闭时任何租户均不得产生新的模型用量费用。

## 11. 内部会议决策

| # | 决策事项 | 已确认结论 |
| --- | --- | --- |
| 1 | Credits 是否作为唯一对外模型用量单位 | 否，保留双模式：平台模型使用 Credits，BYOK 使用 Token 用量 |
| 2 | 租户自行 BYOK 是否收模型用量费 | 不收，`billable_credits = 0` |
| 3 | BYOK 是否仍记录 Credits | 不作为客户用量单位，不消耗或产生计费 Credits；记录输入/输出 Token |
| 4 | MSP 是否可以按租户选择商业模式 | 可以，同租户同周期只允许一种模式 |
| 5 | 固定订阅费是否必选 | 否，由开关控制；模型用量计费权限开启时，关闭固定订阅费后仍可按 Credits 或 Token 用量收费 |
| 6 | 普通私有化 ENT 是否进入 MSP 页面 | 不进入，只显示“AI 用量与授权” |
| 7 | 谁维护底层 Token 成本和 Credits 换算 | 软件供应商或部署方内部成本管理员 |
| 8 | 谁签发 Agent License | 软件供应商；客户只能分配已授权能力 |
| 9 | 私有化 MSP 的模型服务收入是否与软件供应商分成 | 首期不分成，合同另有约定时扩展 |
| 10 | SaaS MSP 使用平台模型时由谁定 Credits 零售价 | 允许 MSP 在平台结算基准上配置面向下属租户的零售价 |
| 11 | 是否可以整体关闭 AI 用量计费 | 可以，由软件供应商平台管理员控制；关闭后所有租户不产生 Credits 或 Token 费用，仅保留 Token 用量和调用量 |

## 12. 首期范围建议

首期支持：

- Agent License 校验和授权状态展示。
- 平台模型、MSP 模型、租户 BYOK 三种模型供给标识。
- Token 内部计量及 Credits 换算。
- 平台模型记录 `platform_metered_credits` 与 `billable_credits`；BYOK 记录输入/输出 Token。
- MSP 模型收费与租户 BYOK两种显隐。
- 普通私有化 ENT 的“AI 用量与授权”视图。

首期不支持：

- 按 Agent、模型、时段定义不同 Credits 换算公式。
- 同一租户同周期混用两种商业模式。
- 自动生成供应商对账单。
- MSP 多级分销及多级分润。
