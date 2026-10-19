# AI 授权 SKU 清单（Agent 功能项与 Credits 包）

> 权威对齐：`12-ai-pricing-model.md` §一（AI 功能 License · 授权层）· `13-ai-agent-mcp-catalog.md`（14 内置 Agent 目录）
> 状态：**定稿**（2026-09-03 · 产品经理拍板：AI 功能按 **Agent 逐项**控制 = 功能费用；Credits 独立控制 = token 费用）
> SKU 命名规则沿用既有授权体系规范（`[Product]-[Module]-[Edition]-[Region]`）

---

## 1 · 产品线归属

Agent 功能项与 AI Credits 包均归 **EMS 平台产品线**（不单设产品线）：

- **Agent 功能项**：14 个内置 Agent 每个都是可授权功能项（功能费用 · Agent 数 × 期限）
- **AI Credits 包**：平台模型池用量预购（token 费用 · 独立控制 · 仅 SaaS 订阅）

## 2 · Agent 功能项清单（14 项 · 命名与编号对齐 13 号文档）

| Agent 名称 | 编号 | 承载能力 | 服务域 |
|:---|:---|:---|:---|
| 告警降噪 Agent | SA1 | 业务级告警降噪（降噪规则/白名单） | ITOM 降噪页 |
| 根因分析 Agent | SA2 | 增强版 RCA 证据链 · L2 转单放行（**与 ITOM 增强版 RCA 同口径 · ITOM 侧单独售卖**） | ITOM 告警详情 |
| 工单起草 Agent | SA3 | 转单流水线 AI 起草 · L2 放行 | ITOM 转单页 |
| Copilot Agent | SA6 | 全局自然语言问答（⌘K / 右下角） | 全局 |
| 资产巡检 Agent | SA7 | CMDB 数据质量巡检 | CMDB 域 |
| 容量预测 Agent | SA9 | 容量趋势外推与预警 | ITOM 域 |
| 链路健康 Agent | SA10 | 拨测数据自动分析与劣化预测 | NPM/FSM 域 |
| 文本理解与标签 Agent | A1 | 工单/表单文本意图识别与实体抽取 | ITSM |
| 知识检索与推荐 Agent | A2 | RAG 语义检索与处置建议 | ITSM/FSM |
| 摘要与文档生成 Agent | A3 | 工单摘要与文档生成 | ITSM |
| 风险评估 Agent | A4 | 变更风险与影响面评估 | ITSM |
| 数据质量巡检 Agent | A5 | ITAM 台账数据质量巡检 | ITAM |
| 对话助手 Agent | A6 | 自助服务与语音交互 | ITSM |
| 调度推荐 Agent | A7 | 派工推荐 | FSM |

> 每个 Agent 功能项 = 一个开关（数量 1 = 开通），计费单元 **Agent/年**，功能费按 **Agent 数 × 期限**。

## 3 · AI Credits 包（token 费用 · 独立控制）

| 模块 | 计费单元 | 说明 |
|:---|:---|:---|
| AI-CRED-50K | 包（credits） | 50,000 credits · ≈¥0.09/credit |
| AI-CRED-200K | 包（credits） | 200,000 credits · ≈¥0.08/credit |
| AI-CRED-1M | 包（credits） | 1,000,000 credits · ≈¥0.07/credit |

## 4 · 版本规则

- **Agent 功能项（14）**：所有角色、所有部署都要 → 全版本：ENT-SAAS / ENT-OP / ENT-OPL（仅 CNY）/ MSP-SAAS / MSP-OP
- **AI Credits 包**：平台模型池仅 SaaS 可订阅 → 仅 ENT-SAAS / MSP-SAAS

## 5 · SKU 编号

### Agent 功能项（实际带区域后缀 `-C` / `-I`，下表省略）

| 编号 | ENT-SAAS | ENT-OP | ENT-OPL | MSP-SAAS | MSP-OP |
|:---|:---|:---|:---|:---|:---|
| SA1 | `EMS-SA1-ENT-SAAS` | `EMS-SA1-ENT-OP` | `EMS-SA1-ENT-OPL` | `EMS-SA1-MSP-SAAS` | `EMS-SA1-MSP-OP` |
| SA2 | `EMS-SA2-ENT-SAAS` | `EMS-SA2-ENT-OP` | `EMS-SA2-ENT-OPL` | `EMS-SA2-MSP-SAAS` | `EMS-SA2-MSP-OP` |
| SA3 | `EMS-SA3-ENT-SAAS` | `EMS-SA3-ENT-OP` | `EMS-SA3-ENT-OPL` | `EMS-SA3-MSP-SAAS` | `EMS-SA3-MSP-OP` |
| SA6 | `EMS-SA6-ENT-SAAS` | `EMS-SA6-ENT-OP` | `EMS-SA6-ENT-OPL` | `EMS-SA6-MSP-SAAS` | `EMS-SA6-MSP-OP` |
| SA7 | `EMS-SA7-ENT-SAAS` | `EMS-SA7-ENT-OP` | `EMS-SA7-ENT-OPL` | `EMS-SA7-MSP-SAAS` | `EMS-SA7-MSP-OP` |
| SA9 | `EMS-SA9-ENT-SAAS` | `EMS-SA9-ENT-OP` | `EMS-SA9-ENT-OPL` | `EMS-SA9-MSP-SAAS` | `EMS-SA9-MSP-OP` |
| SA10 | `EMS-SA10-ENT-SAAS` | `EMS-SA10-ENT-OP` | `EMS-SA10-ENT-OPL` | `EMS-SA10-MSP-SAAS` | `EMS-SA10-MSP-OP` |
| A1 | `EMS-A1-ENT-SAAS` | `EMS-A1-ENT-OP` | `EMS-A1-ENT-OPL` | `EMS-A1-MSP-SAAS` | `EMS-A1-MSP-OP` |
| A2 | `EMS-A2-ENT-SAAS` | `EMS-A2-ENT-OP` | `EMS-A2-ENT-OPL` | `EMS-A2-MSP-SAAS` | `EMS-A2-MSP-OP` |
| A3 | `EMS-A3-ENT-SAAS` | `EMS-A3-ENT-OP` | `EMS-A3-ENT-OPL` | `EMS-A3-MSP-SAAS` | `EMS-A3-MSP-OP` |
| A4 | `EMS-A4-ENT-SAAS` | `EMS-A4-ENT-OP` | `EMS-A4-ENT-OPL` | `EMS-A4-MSP-SAAS` | `EMS-A4-MSP-OP` |
| A5 | `EMS-A5-ENT-SAAS` | `EMS-A5-ENT-OP` | `EMS-A5-ENT-OPL` | `EMS-A5-MSP-SAAS` | `EMS-A5-MSP-OP` |
| A6 | `EMS-A6-ENT-SAAS` | `EMS-A6-ENT-OP` | `EMS-A6-ENT-OPL` | `EMS-A6-MSP-SAAS` | `EMS-A6-MSP-OP` |
| A7 | `EMS-A7-ENT-SAAS` | `EMS-A7-ENT-OP` | `EMS-A7-ENT-OPL` | `EMS-A7-MSP-SAAS` | `EMS-A7-MSP-OP` |

### AI Credits 包（仅 SaaS 版本）

| 包 | ENT-SAAS | MSP-SAAS |
|:---|:---|:---|
| AI-CRED-50K | `EMS-AICRED-50K-ENT-SAAS-C` / `-I` | `EMS-AICRED-50K-MSP-SAAS-C` / `-I` |
| AI-CRED-200K | `EMS-AICRED-200K-ENT-SAAS-C` / `-I` | `EMS-AICRED-200K-MSP-SAAS-C` / `-I` |
| AI-CRED-1M | `EMS-AICRED-1M-ENT-SAAS-C` / `-I` | `EMS-AICRED-1M-MSP-SAAS-C` / `-I` |

## 6 · 控制规则

> **依赖声明（2026-09-03 补）**：Agent 功能项依赖 P01 编排引擎（Agent 运行时底座）——编排引擎随 EMS 平台基础（PLAT）开通（不单独计费），其交付时间**不晚于 v1 上线**（研发对齐事项）。

- **Agent 逐项控制**（功能费用）：开通哪个 Agent 由 License 逐项开关决定；Agent 清单与 13 号文档动态对齐
- **子产品同步**：子产品单独售卖的功能 ↔ 对应 Agent（SA2 根因分析 Agent ↔ ITOM 增强版 RCA）；子产品新增单独售卖功能时对应 Agent 同步单列
- **Credits 独立控制**（token 费用）：与功能 License 分离收取
- **菜单随产品域**：买了产品菜单自动出现（域+子菜单不单独控制）
- **平台底座能力不单独计费**：AI 治理（T1-T8 审批/账单/审计/熔断）与 Agent Hub 编排引擎（Agent 库/MCP/Skill）为平台底座能力（13 号文档 §1.1 P01/P08/P09/P10/P11/P12），随 EMS 平台基础平台（PLAT）开通，不在 Agent 功能项清单内

## 7 · 原型落点

- `org/license-management.html`：PRODUCTS.EMS.modules = 基础平台 PLAT + 14 Agent 功能项 + Credits 三档；授权列表按 Agent 显示用量/剩余
- `ai/ai-billing.html`：AI 功能 License 汇总按 Agent 列出持有方；Credits 加购/价目表/池状态独立
