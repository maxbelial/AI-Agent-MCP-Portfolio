# AI 定价模型（权威定稿）

- **状态**：定稿 · 2026-08-27 · 来源：产品经理直接讨论拍板
- **取代范围**：`11-ai-billing-model.md`（整份删除）· `08-ai-commercialization-and-platform-governance.md` §P1-P3（已删除，见该文档头部废弃指引）
- **生效原则**：本文档为 AI 定价唯一权威口径；任何其他文档/原型与本文档冲突时，以本文档为准

---

## 一、三层定价结构

### 第 1 层 · AI 功能 License（授权层）—— 所有人、所有部署都要

- **AI 功能 = Agent，License 逐项控制开关**：14 个内置 Agent 每个都是可授权功能项，开通哪些 Agent 由 License 控制（功能费用）
- **复用现有授权体系**：`org/license-management.html` 的产品线 × 功能模块 × 数量 × 有效期 SKU 制，不另起炉灶
- **计费维度**：按 **Agent 数** × 期限
- **定价主体**：平台/厂商（唯一收方，与模型供给无关）
- **SKU 归属（2026-09-03 修订）**：Agent 功能项（14 个内置 Agent · 编号 SA1/A1 系列）与 AI Credits 包（50K/200K/1M）均归 **EMS 平台产品线**（原独立 AIFUNC 产品撤销）——SA2 根因分析 Agent 与 ITOM 增强版 RCA 同口径（ITOM 侧单独售卖）；子产品新增单独售卖的功能时，对应 Agent 同步单列。SKU 编号与清单见 `14-ai-license-sku.md`
- AI 功能使用费（License）与模型用量费（credits/tokens）**分离收取**

### 第 2 层 · 模型用量（用量层）—— 按供给来源分流

**A. 平台模型池（仅 SaaS 可订阅）→ credits 计量**
- 平台自建模型池，MSP / 直客订阅后按调用扣 credits
- **谁调扣谁的**：租户调用扣租户的 credits；MSP 自用调用扣 MSP 自用份额
- 定价主体：平台（credits 售卖形态沿用"订阅内含池 + 年度池 + 超量"机制）

**B. BYOK 池（云端 API Key / 本地模型）→ token 消耗量显示**
- 支持两种方式：**云端 API Key**（MSP/客户自购云厂商额度）、**本地模型**（私有化环境本地推理）
- **不产生平台 credits**，按 **token 消耗量**显示（成本透明/运营分析口径）
- **不收模型费**：客户直付供应商（云端 Key）或本地自建成本自担
- MSP 的 BYOK 池 = **池主自营**：MSP 按自己的方式定价、销售给名下租户，赚模型订阅利润（厂商暂不抽成）
- 直客的 BYOK 池 = **自用**（无转售）

### 两层关系（一句话）

> **模型从哪来决定用量怎么收（平台池=credits、BYOK=token 显示）；AI 功能开不开由 License 决定（平台统一收）。**

---

## 二、角色 × 部署矩阵

| 角色 | SaaS | 私有化 |
|:---|:---|:---|
| **平台管理员** | 运营平台 + 模型池；租户/MSP 订阅平台模型 → 平台收 credits | 部署方；收 License + 平台软件费 |
| **MSP** | 订阅平台（credits，平台定价）**或** BYOK（tokens，MSP 自营定价）；租户用 MSP 自己的 API 接口调用大模型时，本质是 MSP 自己的服务，按 MSP 方式定价销售 | **只能 BYOK**（无法订阅平台）；名下租户可订阅 MSP → MSP 赚订阅利润；私有化 MSP 实质 = 平台管理员：可控制租户/产品/大模型，**除 License 外与平台管理员无区别** |
| **直客** | 订阅平台（credits）**或** BYOK（tokens 自用） | **只能 BYOK** |

**SaaS 与私有化在模型供给上的差异**：仅"能否订阅平台模型池"一项——SaaS 可以，私有化不能。**BYOK 逻辑跨部署统一**：任何 BYOK 池（SaaS 或私有化）都是 token 计量 + 池主自营定价，产品只做一套"MSP 自营 token 订阅"能力。

---

## 三、MSP 特殊性（角色定义）

- MSP = **二级平台管理员**，不是终端租户
- **不能直接开通产品**：只能通过给名下租户开通产品来使用 ITOM、ITSM 等
- **自己使用产品需开通租户**：MSP 要自己用产品，先开通一个租户，再看名下租户的数据；MSP 本身没有产品
- **MSP 池 = 转售 + 自用混合**：租户消耗走转售份额；MSP 自用（治理面板/报表等 AI 功能）消耗走 MSP 自用份额的 credits。自用与转售份额的配置尽量简化，若绕不过去可接受单独配置（实现方式待定，见遗留项）

---

## 四、厂商收入

| 部署 | 收入来源 |
|:---|:---|
| SaaS | AI 功能 License + credits 销售收入（平台模型池） |
| 私有化 | AI 功能 License + 平台软件费（MSP 自营 token 订阅利润**不抽成**，暂定） |

**License 始终在平台手里**：即使私有化 MSP 自营 token 订阅，AI 功能授权费仍由平台/厂商收取——这是私有化场景下厂商的保底收入之一。

---

## 五、计量与显示口径

| 场景 | 计量 | 显示 | 收费 |
|:---|:---|:---|:---|
| 租户/MSP 订阅平台模型（SaaS） | credits（按调用扣） | credits 余额/消耗 | 平台收 credits 费 |
| MSP 自用调平台模型 | credits（MSP 自用份额） | 同上 | 平台收（MSP 自用成本 = 批发口径） |
| 租户订阅 MSP 的 BYOK 池（云端 Key/本地模型） | **token 消耗量**（MSP 池） | token 用量 | **MSP 自定义定价**收订阅费 |
| 直客 BYOK 自用 | token 消耗量 | token 用量 | 无（License 已收） |
| AI 功能开关 | 无 | License 状态 | 平台按 Agent 数 × 期限收 License |

---

## 六、已废弃口径（禁止使用）

> 以下旧口径与本文档冲突，已从对应文档删除；任何后续任务不得再引用。

1. **BYOK 收"平台费 = credits × 50%"**（08 §P2 B 旧口径）→ 废除。BYOK 不收模型费，只收 AI 功能 License
2. **"三模式并存（托管 / BYOK / 私有化），租户级可选、场景级可混合"框架**（08 §P2）→ 由"License 授权层 + 模型供给（平台池/BYOK 池）"二维结构取代
3. **MSP 统一批发/零售 credits 转售框架**（08 §P3 单一转售）→ 拆分为两套独立逻辑：平台定价转售（credits，SaaS）与 MSP 自营订阅（tokens，BYOK 池），**不得混同**
4. **"纯 BYOK 下 credits 概念不成立 / 无订阅纯 BYOK 场景"**（11 号文档场景 3 扩展假设）→ 不成立，不再讨论
5. **原型 ai-billing 中 BYOK 行"平台费 ¥0.05/credit、¥1,985"等旧口径数据** → 待原型改造（见遗留项），改造前不作为标准
6. **"credits = 平台价值计价、BYOK 下照常消耗"**（08 §P1 双口径）→ credits 仅计量平台模型池调用；BYOK 按 token 显示，不消耗 credits

---

## 七、遗留待定项（2026-08-27 已全部闭环）

| # | 待定项 | 拍板/落地 | 状态 |
|---|--------|-----------|------|
| 1 | MSP 自用份额配置方案 | 转售 + 自用混合池，池状态机旁「调整自用份额」弹窗（份额 + 超量策略），KPI/Allocation 联动（PR #325） | ✅ 闭环 |
| 2 | AI 功能 License SKU 设计 | AI 功能按 **Agent 逐项**控制（14 内置 Agent · 功能费用 · Agent 数 × 期限）· AI Credits 包独立（token 费用）· 均归 **EMS 平台产品线**（2026-09-03 修订：原独立 AIFUNC 产品撤销），license-management 租户授权行落地（PR #323） | ✅ 闭环 |
| 3 | ai-billing 原型改造方案 | **5 管理员角色分视图**（SystemAdmin / MSP Admin SaaS / MSP Admin OP / UserAdmin SaaS / UserAdmin OP），AI 模块独立切换器不跟全局角色；BYOK 行改 token 消耗量；MSP 池拆转售+自用；T2 账单/msp-overview 口径同步（PR #323）；BYOK 连接按角色过滤（直客仅自己租户，PR #324） | ✅ 闭环 |
| 4 | 私有化"平台软件费"形态 | **按部署节点**（每套私有化部署一份平台软件费，¥50,000/节点/年示例，msp-op 视图展示）（PR #326） | ✅ 闭环 |
| 5 | 私有化 MSP 自营订阅的产品化程度 | **系统内 MSP 定价配置 + 订阅账单**：msp-op「配置订阅价/出账单」弹窗（每租户 token 单价、订阅周期、导出订阅账单，订阅表/利润实时联动）（PR #326） | ✅ 闭环 |

**交互实测验证（2026-08-27，Chrome 远程调试）**：5 角色切换/KPI/租户表/BYOK 连接/section 显隐全部正确；定价计算（89.2M×¥0.015/1K=¥1,338）、自用份额联动、账单列头随模式切换（BYOK→token 消耗）通过（PR #327 修复联动 bug）。

---

## 八、关联文档与原型

- 取代：~~`11-ai-billing-model.md`~~（已删除）
- 上游保留：`08-ai-commercialization-and-platform-governance.md` §P4-P8（AI 审计与安全 / Agent 体系 / MCP 与 Skill / 报告中心 / 落地清单——与定价无关，保留）
- 原型联动（2026-08-27 已完成改造）：`org/ai-billing.html`（5 角色视图）· `org/license-management.html`（AIFUNC License）· `ai/ai-governance.html`（T2 账单下钻 BYOK=token）· `portal/msp-overview.html`（租户 AI 维度口径同步）· `ai/ai-center.html`（无冲突，预算 ¥500 口径保留）
- 方案演示：`design/ppt/ai-billing-demo.html`（AI 计费方案演示单文件 HTML，10 页 · 2026-08-27）
