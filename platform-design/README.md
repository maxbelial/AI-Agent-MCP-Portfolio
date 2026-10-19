---
category: "Directory README"
description: "AI 驱动 EMS 综合运维平台 · 设计文档目录索引"
version: "1.9"
status: "已完成"
author: "@pangxx-it188"
---

# AI 驱动 EMS 综合运维平台 — 设计文档目录

- 所属 Theme：`requirements/ems-driven-by-ai/`（AI 驱动 EMS 综合运维平台）
- 关联工单：[ems-product#235](https://github.com/it188-networkx/ems-product/issues/235)
- 关联总工单：[ems-product#234](https://github.com/it188-networkx/ems-product/issues/234) · Sprint 20260810

---

## 目录用途

本目录（`design/`）存放本 Theme 的**产品设计层文档**（Product Design docs），与 `prototype/`（原型）并列。

**这里只放 Theme 级产品设计文档**（Why / What / How / Who 层）。不放：
- ❌ 具体 Feature 的 PRD（属于各链段 各链段里程碑，放各 Feature 目录）
- ❌ 技术接口设计 / 数据库表结构（属于研发文档）
- ❌ 会议纪要 / 讨论记录（属于 `ops-playbook/meetings/`）
- ❌ 原型 HTML（放同级 `prototype/`）

---

## 文档全景

**产品设计的四个核心问题 + 一个收敛层** —— 每个文档回答一层：

```
┌─────────────────────────────────────────────────────────┐
│  Why  → 客户为什么会买、为什么敢用                          │
│         → 00-product-value-thesis.md（价值主张）              │
├─────────────────────────────────────────────────────────┤
│  Who  → 用户是谁、每天在做什么                             │
│         → 01-user-persona-workday.md（Persona × 工作日动线）  │
├─────────────────────────────────────────────────────────┤
│  What → 要设计什么、各链段做什么（2026-08-19 链段化）  │
│         → 02-design-split-plan.md（设计拆分规划）             │
├─────────────────────────────────────────────────────────┤
│  How  → 架构怎么组织、AI 边界、5 大产品协同                   │
│         → 03-overall-framework.md（总体设计框架）             │
├─────────────────────────────────────────────────────────┤
│  V1   → 5 月 demo 收敛到可交付的 6 个主线场景                 │
│         → 04-v1-mainline-spec.md（v1 主线 spec · 收敛）        │
├─────────────────────────────────────────────────────────┤
│ Form  → 产品到底长什么样 · Work Queue + Governance Console     │
│         → 05-product-form-factor.md（产品形态定义）            │
├─────────────────────────────────────────────────────────┤
│  工作台 · 高频操作聚合入口（06 PRD 已交付）   │
│         → 06-w2-workbench-prd.md（N1 PRD · A0304）           │
├─────────────────────────────────────────────────────────┤
│  MSP  → 两层客户结构 · CTE 测评解读 · PMS 产品边界             │
│         → 07-msps-as-primary-customer.md（MSP 定位深化）       │
├─────────────────────────────────────────────────────────┤
│ 闭环 → AI 商业化闭环 + 平台治理闭环（2026-08-21 · 计费部分已拆出）│
│         → 08-ai-commercialization-and-platform-governance.md  │
│              §P1-P3 计费口径已废弃 → 12-ai-pricing-model.md    │
│ 定价 → AI 定价模型（权威定稿 · 2026-08-27）                    │
│         → 12-ai-pricing-model.md（License + credits/tokens）   │
└─────────────────────────────────────────────────────────┘

引用输入（外部资产 · 不可修改，只能引用）：
├─ ref-industry-research.md         · 行业调研（AI Agent 生产落地）
├─ ref-product-domain-boundary.md   · 跨产品职责边界
└─ ref/subproduct-ai/               · 子产品 AI 规划（原始稿 + 对齐分析 · 来源 #263）
```

### 文档索引表

| # | 文件 | 类型 | 目的 | 目标读者 | 关联任务 | 依赖 |
|:---:|:---|:---|:---|:---|:---|:---|
| 1 | [README.md](README.md) | 目录索引 | 本文件 · 说明目录里每个文档 | 所有人 | — | — |
| 2 | [00-product-value-thesis.md](00-product-value-thesis.md) | **价值主张**（Why）| 三条价值 · Junior 场景 S01-S17 · T1-T8 商业动机 · 关键设计参数 | PM · 销售 · 财务 · 合规 | t100101 深化 | 无 |
| 3 | [01-user-persona-workday.md](01-user-persona-workday.md) | **用户画像**（Who）| 4 类 Persona（U1-U4）· 工作日动线 · 客户组织形态映射 | PM · UX · 销售 | t100101 §P2 深化 | 依赖 §Why |
| 4 | [02-design-split-plan.md](02-design-split-plan.md) | **设计拆分**（What）· A0402 | §P1 定位 + §P3 存量盘点 + §P4 链段路线图（A-F · 2026-08-19 链段化） | PM · 研发架构 | **t100101 主产物** | 依赖 §Why §Who |
| 5 | [03-overall-framework.md](03-overall-framework.md) | **总体框架**（How）· A0304 | 五层架构 · AI 能力边界 · 5 大产品协同关系 | PM · 研发架构 · CTO | **t100102 主产物** | 依赖 §Why §What |
| 6 | [04-v1-mainline-spec.md](04-v1-mainline-spec.md) | **v1 主线 spec**（收敛）| v1 交付 6 场景 M1-M6 · 每场景 4 要素 · Demo→v1 收敛 · 18 项 KPI · 客户现状对账单 | PM · 销售 · POC 客户 · 研发架构 | 承接 t100101/102 · 供 W2-W6 使用 | 依赖 §Why §Who §What §How + prototype/ |
| 7 | [05-product-form-factor.md](05-product-form-factor.md) | **产品形态**（Form）| Work Queue + Governance Console 两大模式 · 信息架构 · 场景覆盖矩阵 · 原型审计 · 千人千面可配置边界 | PM · UX · 研发架构 · 销售 | 承接 00-04 全部 | 依赖 §Why §Who §What §How §V1 |
| 8 | [ref-industry-research.md](ref/ref-industry-research.md) | 引用输入 · 只读 | 行业调研（Agent 生产落地 5 大判断） | PM · 研发 · 决策层 | 存量输入 | — |
| 9 | [ref-product-domain-boundary.md](ref/ref-product-domain-boundary.md) | 引用输入 · 只读 | 各子产品职责边界 · 三层架构基线 | PM · 研发架构 | 存量输入 | — |
| 10 | [ref/subproduct-ai/](ref/subproduct-ai/) | 引用输入 · 只读 | 子产品 AI 规划：原始方案稿（[corteza-itsm-itam-fsm-ai-v1.md](ref/subproduct-ai/corteza-itsm-itam-fsm-ai-v1.md) · 只读）+ 对齐分析（[ref-subproduct-ai-plan.md](ref/subproduct-ai/ref-subproduct-ai-plan.md) · 7 Agent / 9 MCP / 17 功能）· 来源 [ems-product#263](https://github.com/it188-networkx/ems-product/issues/263) | PM · 研发架构 | 待 Agent 归属拍板 | 引用来源 #263 |
| 11 | [06-w2-workbench-prd.md](06-w2-workbench-prd.md) | **Feature PRD**（A0304 · 2026-08-19 链段化） | 工作台：角色体系（U1/U2/U3 + PM/BM/客户方登记）· 高频操作清单（U1 9 / U2 8 / U3 8 + PM 5 / BM 3）· 三级归属边界 · **队列项状态模型（操作闭环）** · SMB 合并规则 · SN SOW 对标结论 | PM · UX · 研发架构 | **t100102 主产物** | 依赖 §Why §Who §What §How §Form |
| 12 | [07-msps-as-primary-customer.md](07-msps-as-primary-customer.md) | **客户定位深化**（MSP）· 2026-08-19 | 两层客户结构（MSP 买家 + 最终客户使用者）· CTE 期望需求清单解读（需求调研输入，非规格）· PMS（Champ-PMS）定位（PMBOK 行业基线）与 EMS 接口边界 · 形态/角色/平台能力含义 · 00-06 对齐清单 | PM · 研发架构 · 销售 | CTE 期望覆盖度校验 | 依赖 §Why §Who §Form + prototype/pms/ |
| 13 | [08-ai-commercialization-and-platform-governance.md](08-ai-commercialization-and-platform-governance.md) | **商业化与平台治理闭环** · 2026-08-21 · ⚠️ §P1-P3 计费口径已废弃（2026-08-27，见 12-ai-pricing-model） | **AI 审计与安全**（六要素/三道防护/脱敏/AI Gateway）· **8 场景 Agent + 7 能力组件** · 10 MCP Server + 18 内置模板 · 平台级报告中心（5 类报告）· P9 销售 AI 能力集（41 项）；计费部分（原 P1-P3）已删除，以 [12-ai-pricing-model.md](12-ai-pricing-model.md) 为准 | PM · 销售 · 财务 · 合规 · 研发架构 | 补齐 6 大闭环缺口（G1-G8） | 依赖 §Why §P7 §Form §MSP + ref-plan + 销售能力集 xlsx + SN 逆向文档 |
| 14 | [12-ai-pricing-model.md](12-ai-pricing-model.md) | **AI 定价模型（权威定稿）** · 2026-08-27 | 三层定价：**AI 功能 License**（Agent 逐项开关 · 功能费用 · 平台统一收 · Agent 数×期限）+ **平台模型池 credits**（谁调扣谁的 · token 费用）+ **BYOK token 消耗量**（MSP 自营定价 / 直客自用）；角色×部署矩阵（SaaS/私有化 × 平台/MSP/直客）· MSP 二级平台管理员定义 · 厂商收入 · 已废弃口径清单 | PM · 销售 · 财务 · 研发架构 · 商业化 | 取代 11 号文档 + 08 §P1-P3 | 依赖 08 §P4-P8 + 07 MSP + license-management 原型 |
| 15 | [13-ai-agent-mcp-catalog.md](13-ai-agent-mcp-catalog.md) | **AI Agent 与 MCP 目录（权威 · v2）** · 2026-08-28 | **54 项 AI 能力全景**（P14 / ITOM 9 / NPM 3 / CMDB 8 / ITSM 10 / FSM 7 / ITAM 3 · 含交付时间）+ **14 个内置 Agent 目录**（sa1-sa10 保留 7 + A1-A7 平台通用 · 归属/承载能力/埋点/档位）+ **7 MCP Server · 28+ Tools**（产品 6 + Multimodal 能力型 · NCM 并入 ITOM · 知识库 RAG 并入 ITSM）+ MCP 端点与调用管理（生成/轮换/吊销 · 组织级共享配额 · 不允许自定义）| PM · 销售 · 研发 · 交付 | 综合 EMS_智能运维AI能力集.xlsx + 低代码产品线 PM 文档 + 5 月架构页 | 原型 AGENT_DATA / MCP 目录 / EMS_EMBED 数据同步 |
| 16 | [14-ai-license-sku.md](14-ai-license-sku.md) | **AI 授权 SKU 清单** · 2026-09-03 | Agent 功能项（14 内置 Agent · SA1/A1 编号 · 功能费用 · Agent 数×期限）与 Credits 包（token 费用 · 独立控制）归 **EMS 平台产品线**；SKU 编号（沿用既有授权体系规范）· 版本规则（Agent 全版本 / Credits 仅 SaaS）· 控制规则（Agent 逐项 · SA2 ↔ ITOM 增强版 RCA 同步 · 菜单随产品域） | PM · 销售 · 研发 | 12 号文档 §一 + 13 号文档 + 授权原型 | license-management / ai-billing 原型同步 |
| 17 | [EMS-AI全局智能体与产品能力汇报.html](EMS-AI全局智能体与产品能力汇报.html) | **客户汇报 HTML** · 2026-09-18 | 六大运维产品域、CMDB 语义底座、全局调度 Agent、专业 Agent、Skill/MCP、治理护栏与重大告警闭环 | 客户 · 销售 · 售前 · 产品 | 客户反馈后的汇报升级 | 依赖 §Why §How + 标准方案原型 |

---

## 阅读顺序推荐

### 场景 A · 第一次接触本 Theme（新人）

按 Why → Who → What → How 顺序：

1. **00-product-value-thesis.md** —— 先理解"为什么做" · 20 分钟
2. **01-user-persona-workday.md** —— 再理解"给谁做" · 20 分钟
3. **02-design-split-plan.md** —— 然后看"做什么" · 30 分钟
4. **03-overall-framework.md** —— 最后看"怎么架构" · 20 分钟
5. （可选）**ref-industry-research.md** + **ref-product-domain-boundary.md** —— 深化背景

**首次全览耗时**：约 1.5-2 小时。

### 场景 B · 熟悉产品的评审人 / 销售 / POC 客户

直接看 **04-v1-mainline-spec.md**（v1 主线 6 场景 + 3 类指标 + 客户现状对账单），一次看清 v1 交付什么、能力目标多少、成本对比多少、什么明确不做。适合 30 分钟内快速决策。

### 场景 C · 设计师/UX 承接 W2 里程碑

必读顺序：
1. **04-v1-mainline-spec.md §P2**（6 场景 spec 的原型现状 + 待补页面清单 · 直接指路工作台补什么）
2. **01-user-persona-workday.md P1-P4**（4 类 Persona 作为工作台 · N1 高频操作聚合 PRD 的直接输入）
3. **00-product-value-thesis.md §P2**（17 项 S 场景 · 每项服务哪条加法）
4. **02-design-split-plan.md §P4 工作台 行**（工作台交付物与验收标准）
5. **06-w2-workbench-prd.md**（工作台 · N1 高频操作聚合 PRD：高频操作清单 + 归属边界 + SMB 合并规则，原型工作的直接输入）

---

## 文档间的关系

- **00-product-value-thesis.md** 是**价值主张层**，其他所有文档在具体 Feature/场景/T# 都必须能回答"服务于哪条价值"
- **01-user-persona-workday.md** 是**用户画像层**，S01-S17 场景归属到哪类用户由本文档决定
- **02-design-split-plan.md §P1 价值主张表** 与 **00-product-value-thesis.md §P1** 保持同步（前者是摘要 · 后者是深化）
- **02-design-split-plan.md §P1 目标用户表** 与 **01-user-persona-workday.md** 保持同步（前者是摘要 · 后者是深化）
- **03-overall-framework.md §P1 定位承接** 引用 00-product-value-thesis.md 的三条价值
- **03-overall-framework.md §P3 AI 能力边界** 与 **02-design-split-plan.md §P1 AI 落地边界** 保持一致（同一套档位定义 + 关键约束）
- **04-v1-mainline-spec.md** 是 Why/Who/What/How 之下的**收敛层**，把 [`prototype/`](../prototype/) 里 36 页 demo 与文字文档 00-03 收敛到 v1 交付主线的 6 场景；**主线场景 M1-M6 与 S01-S17 场景的映射见 [04 §P1](04-v1-mainline-spec.md#p1--v1-主线6-场景一览)**

**修改任何一份文档，必须检查上下游是否需要同步。**

---

## 版本与状态约定

### frontmatter 规范

每份文档顶部 YAML frontmatter：

```yaml
---
category: "..."
description: "..."
version: "X.Y"        # 每轮实质性修订都要 bump
status: "起草中 | 已完成 | 已对齐价值主张 | 已对齐四类用户"
author: "@github-handle"
---
```

### 起草记录规范

每份文档底部必须有"起草记录"表，记录每次 version bump 的**具体变更内容**（不是"更新文档"这种无信息量描述）。

### 证据置信度标签（源自 [01-user-persona-workday.md](01-user-persona-workday.md)）

涉及**推断性内容**的文档（尤其是 Persona / 场景 / 商业假设），每断言标注：

| 标签 | 含义 |
|:---:|:---|
| 🟢 | **有据** — 来自已确认的内部文档 / 用户明确输入 |
| 🟡 | **行业推断** — 来自 Wikipedia / Atlassian / ITIL 等权威源 · 符合行业常识 · 无一手校准 |
| 🔴 | **待访谈校准** — 完全推断 · 必须真人访谈才能定 · 工作台展开前需闭环 |

---

## 注意事项

### ⚠️ 修改文档前必看

1. **§P1 章节是"锚"**：product-value-thesis §P1 是所有价值论证的根 · design-split-plan §P1 是所有拆分的根 · 修改前先想清楚**下游有多少地方引用**
2. **相对路径**：文档内引用其他文档统一用相对路径 `[name](name.md)` · **不要**用绝对路径或 URL（除了外部资源）
3. **不新建文档**：本目录规模控制在 7-10 份以内 · 新想法先考虑加到已有文档 · 确需新文档时先看是否属于"下一层"（Feature PRD）
4. **PR 走 --auto merge**：所有变更走 PR + `gh pr merge --auto --squash --delete-branch` · 不要直接 push 到 main

### ⚠️ 引用输入文档（`ref-industry-research.md` · `ref-product-domain-boundary.md`）

- **只读** —— 除非发起专项修订，否则**不动**
- 内容来自 2026-05 v2 协同原型阶段，是**输入基线** · 本 Theme 设计不改这两份

### ⚠️ 与 prototype/ 目录的关系

- 本目录（`doc/`）= **文字层设计** · 用于评审与销售话术
- 兄弟目录（`prototype/`）= **可交互原型** · 用于用户/客户视觉沟通
- **两者不重复**：文字层不放原型截图 · 原型不放大段说明文字（说明放 doc/ 里的对应章节）

---

## 红队评审台账

各文档起草记录里出现的 C# / H# 编号统一在此索引，避免读者只看局部修复条目不知全貌。

| 编号 | 类别 | 问题描述 | 影响文档 | 修复版本 | 状态 |
|:---:|:---|:---|:---|:---|:---:|
| **C1** | 价值主张 | 效能倍数"×2-3"过于乐观 · 缺 POC 校准说明 | 00 §P1 · 02 §P1 · 03 §P3 | 00 v0.3 · 02 v0.5 · 03 v0.3 | ✅ |
| **C2** | 价值主张 | 缺定价与 ROI 硬数据（Token 单价 · IT 人力单价 · 商业化决策清单） | 00 §P7 | 00 v0.3 | ✅ |
| **C3** | — | *（预留 · 尚未使用）* | — | — | — |
| **C4** | — | *（预留 · 尚未使用）* | — | — | — |
| **C5** | 用户画像 | 客户规模只有单一档位 · 未覆盖 SMB / 中大型企业差异 · Persona 未处理"一人身兼多角色"情形 | 00 §P1 · 01 §P7 · 02 §P1 | 00 v0.3 · 01 v0.2 · 02 v0.5 | ✅ |
| **H1** | — | *（预留 · 尚未使用）* | — | — | — |
| **H2** | — | *（预留 · 尚未使用）* | — | — | — |
| **H3** | — | *（预留 · 尚未使用）* | — | — | — |
| **H4** | 延伸价值 | 缺"组织记忆沉淀 / 续约护城河"叙事（工程师流失痛点） | 00 §P8 | 00 v0.3 | ✅ |

> **约定**：C# = 内容层（Content）问题 · H# = 高度/深度层（Height/Depth）问题。新增红队评审条目时在此表登记，避免"看得到修复但看不到问题全貌"。

---

## 内部 Review 修复台账

由团队内部 review（非红队）识别的断点修复记录：

| 编号 | 类别 | 问题描述 | 影响文档 | 修复版本 | 状态 |
|:---:|:---|:---|:---|:---|:---:|
| **R-P0-1** | 一致性 | S07/S11/S12/S15 加法归属跨文档不一致（00 §P2 表 vs 00 §P6 加法映射 vs 02 §P1 三条加法表） | 00 §P2 §P6 · 02 §P1 | 00 v0.4 · 02 v0.6 | ✅ |
| **R-P1-1** | 排版 | 起草记录表格 v#/v# 之间未换行的 `\|\|` 分隔符异常 | 00 · 02 · 03 | 00 v0.4 · 02 v0.6 · 03 v0.4 | ✅ |
| **R-P1-2** | ROI 一致性 | U4 "总人力成本降 15-25%" 缺 §P7 推导支撑 | 00 §P4 §P7 · 01 §P5 | 00 v0.4 · 01 v0.3 | ✅ |
| **R-P2-1** | 一致性 | SMB 上限 40 vs 四类累加 37 口径差异未说明 | 01 §P0 | 01 v0.3 | ✅ |
| **R-P2-2** | 完整性 | 红队评审 C#/H# 缺全局索引 | README | 本次新增 | ✅ |
| **R-P2-3** | 一致性 | SMB U-Frontline 效能倍数未明说与中大型档 U1/U2 一致 | 01 §P7 | 01 v0.3 | ✅ |
| **R-P2-4** | 完整性 | 效能倍数 P0 待校准优先级未在下游文档（02/03）显式标注 | 02 §P1 · 03 §P3 | 02 v0.6 · 03 v0.4 | ✅ |

---

## 更新记录

| 日期 | 更新内容 | 作者 |
|:---|:---|:---|
| 2026-08-10 | 首建 · 索引 6 份文档 · 定义阅读顺序 · 版本约定 · 证据置信度标签 · 注意事项 | @pangxx-it188 |
| 2026-08-11 | 新增红队评审台账（索引 C1/C2/C5/H4）· 新增内部 Review 修复台账（R-P0-1 / R-P1-1 / R-P1-2 / R-P2-1..4） | @pangxx-it188 |
| 2026-08-11 | 新增 **04-v1-mainline-spec.md**（v1 主线 6 场景 M1-M6 收敛 spec · Demo→v1 翻译 · 18 项 KPI · 客户现状对账单）· 索引表/阅读顺序/文档关系同步更新 | @pangxx-it188 |
| 2026-08-13 | 所属 Theme 目录改名同步：requirements/ems-ai-driven-2608 → requirements/ems-driven-by-ai | @pangxx-it188 |
| 2026-08-14 | 术语统一：全文"商业根基"统一改为"价值主张"（索引表/文档关系/状态约定/红队台账类别），对齐 08-13 决策 | @pangxx-it188 |
| 2026-08-14 | 价值主张两条 → 三条（00 回填）：索引表/文档关系同步"三条价值"；01/02/03/04/05 锚点与标题联动 | @pangxx-it188 |
| 2026-08-14 | 红队台账 H4 类别"价值三"→"延伸价值"（00 §P8 组织记忆改名后消除编号歧义） | @pangxx-it188 |
| 2026-08-14 | 新增引用输入 ref-subproduct-ai-plan.md（子产品 AI 规划 · 来源 ems-product#263）：全景图/索引表/阅读顺序同步 | @pangxx-it188 |
| 2026-08-14 | ref/subproduct-ai 子目录化：原始方案稿 + 对齐分析移入 `ref/subproduct-ai/`，全景图/索引表路径同步 | @pangxx-it188 |
| 2026-08-17 | 新增 **06-w2-workbench-prd.md**（N1 高频操作聚合入口 PRD · W2 工作台基础形态）：全景图 W2 层/索引表/场景 C 阅读顺序同步；03/04/05 页面显示名「AI 中心」→「Agent Hub」术语回改（03 v0.21 · 04 v0.6 · 05 v1.0） | @pangxx-it188 |
| 2026-08-19 | **出海对齐 + ITAM 转正（公司定位「中企出海」）**：ITAM 从外部产品转正为 EMS 第六产品域（一级导航 ITSM 与 FSM 之间）· 原型新增 `prototype/itam/` 5 页（概览/台账/详情/合同/库存盘点 · 数据口径与 CMDB 对账 8,421/234 对齐）；doc 全库出海对齐修订——00 v0.14（三条价值补出海故事/出海档/多币种/全球知识共享）· 02 v0.16（定位句/六产品/ITAM 转正/出海支撑度盘点）· 03 v0.22（六产品协同/海外部署形态/数据驻留）· 01 v0.7（四类 Persona 出海变体/海外岗位映射）· 04 v0.7（跨境用例/对账单出海变体/ICT 服务边界）· 05 v1.1（ITAM 入信息架构/S23-S24 跨境场景/审计补 itam 5 页）· 06 v0.3（出海操作变体/资产事件队列项/区域时区字段）；定位输入：《EMS定位：为中企出海而生》报告（design/ref/ 目录 · 4 页） | @pangxx-it188 |
| 2026-08-19 | **MSP 客户定位深化 + PMS 原型（同日第二批）**：用户澄清两层客户结构（MSP/二类运营商如 CTE 为买家 · 周大福/达美乐为最终客户）· CTE 测评 5 条（统一管理项目/六角色协同/贯通 7 要素/运营闭环/多租户欧洲合规）；原型新增 `prototype/pms/` 5 页（总览/列表/详情/工时/报告 · 独立顶级域 · 色 --c-pms #0D9488 · Champ-PMS 授权已有占位）；新增 **07-msps-as-primary-customer.md**（两层客户结构 · CTE 测评解读 · PMS 边界与 EMS 接口 · 5 项待决问题） | @pangxx-it188 |
| 2026-08-19 | **路线图链段化重写（评审修订）**：02 §P4 从"按功能类型每周一个 N"改为"**按业务链段组织 · 每段可走通可验收**"（链段 A 工作台 / B 反应性处置链·降噪提前 / C 治理闭环·嵌链 / D 计划性与履约 / **E 出海与 MSP·多租户总览·客户门户·PMS 接口** / F 观察报告与整体闭环验收）；N1-N6 归并到链段；联动同步——04 里程碑表 / 00·01·03·05·07 旧周次引用（02 v0.17 · 00 v0.19 · 01 v0.8 · 03 v0.23 · 04 v0.9 · 05 v1.3 · 07 v0.6） | @pangxx-it188 |
| 2026-08-19 | **06 链段 A PRD 化（评审修订）**：06 定位从"N1 高频操作聚合入口"改为"链段 A · 工作台（所有链段的载体）"——P2 角色体系扩展（**PM 5 项 / BM 3 项登记** · 客户方边界声明）· P5 新增**项目事件类型**与**队列项状态模型**（操作闭环）· P8 验收对齐链段 A（06 v0.4） | @pangxx-it188 |
| 2026-08-21 | **新增 08-ai-commercialization-and-platform-governance.md（AI 商业化闭环 + 平台治理闭环）**：补齐用户指出的 6 大闭环缺口——AI Credits 双口径计量（credits 对外 × tokens 对内）· 三种计费模式（托管/BYOK/私有化 · BYOK 产品化）· MSP 二层转售计费 · AI 审计与安全（六要素审计详情/三道防护/PII 脱敏/AI Gateway）· 内置 7 Agent（A1-A7 · 编辑面/版本/灰度/测试 · D-A1 拍板）· 内置 10 MCP + 11 Skill（Agent×MCP 白名单矩阵）· 平台报告中心（5 类报告 + 模板/订阅/品牌化）；原型新增 `org/ai-billing.html` + `portal/reports.html`，改造 `ai/ai-center.html`（Agent 库/MCP/T2 双口径/T5 详情）、`portal/msp-overview.html`（租户 AI 维度）、`org/license-management.html`（AI Credits SKU）；联动 00 v0.20 · 03 v0.24 · 04 v0.10 · 07 v0.7 · ref-plan v1.3 | @pangxx-it188 |
| 2026-08-27 | **AI 定价模型定稿（用户逐项拍板）**：新增 **12-ai-pricing-model.md（权威定稿）**——三层定价（AI 功能 License·功能模块数×期限·平台统一收 / 平台模型池 credits·谁调扣谁的 / BYOK token 消耗量·MSP 自营定价）；删除 **11-ai-billing-model.md**（全部内容被取代）；08 文档 §P1-P3 计费口径整体废弃删除（导航/缺口表同步标注），保留 §P4-P8；原型 ai-billing 旧口径（BYOK 平台费 ¥0.05/credit 等）待改造，见 12 号文档遗留项 | @pangxx-it188 |
| 2026-09-03 | **AI 授权 SKU 归线**：AI 功能 License 与 AI Credits 包归入 **EMS 平台产品线**（原独立 AIFUNC 产品撤销 · CPE 下线）；还原归档 SKU 目录误改；新增 **14-ai-license-sku.md**（AI 授权 SKU 清单）；授权原型同步（PR #375/#376） | @pangxx-it188 |
| 2026-09-03 | **AI 功能 License 计费单元改为 Agent 逐项**：AI 功能授权从功能模块（AGOV/AHUB/NRSE/RCA 四模块）改为 **14 内置 Agent 逐项开关**（功能费用 · Agent 数 × 期限 · 对齐 13 号文档 Agent 目录）；AI 治理与 Agent Hub 编排引擎明确为平台底座能力随基础平台开通、不单独计费；12/14 号文档 · 原型 license-management（14 Agent 模块卡片 · Credits 仅 SaaS 校验）/ ai-billing（License 汇总按 Agent）· 08 文档废弃指引口径 · 方案演示 PPT 同步 | @pangxx-it188 |
