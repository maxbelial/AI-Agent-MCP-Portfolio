---
category: "Product Form Factor"
description: "AI 驱动 EMS 综合运维平台 · 产品形态定义 — EMS 到底长什么样"
version: "1.3"
status: "起草中"
author: "@pangxx-it188"
---

# AI 驱动 EMS 综合运维平台 — 产品形态定义

- 关联工单：[ems-product#235](https://github.com/it188-networkx/ems-product/issues/235)
- 前置文档：[00-product-value-thesis.md](00-product-value-thesis.md) · [01-user-persona-workday.md](01-user-persona-workday.md) · [03-overall-framework.md](03-overall-framework.md) · [04-v1-mainline-spec.md](04-v1-mainline-spec.md)
- 起草日期：2026-08-12

---

## 章节导航

| 章节 | 标题 | 回答的问题 |
|:---|:---|:---|
| [P0](#p0--本文档要解决什么问题) | 本文档要解决什么问题 | 00-04 文档留下的缺口 |
| [P1](#p1--产品形态第一性原理推导) | 产品形态 · 第一性原理推导 | EMS 的交互范式是什么 |
| [P2](#p2--两个核心模式) | 两个核心模式 | Work Queue + Governance Console 的完整定义 |
| [P2.5](#p25--cmdb-数据底座在产品形态中的角色) | CMDB 数据底座 | CMDB 如何支撑 Work Queue 和 Governance Console |
| [P3](#p3--信息架构) | 信息架构 | 页面层级、导航结构、URL 设计 |
| [P4](#p4--场景覆盖矩阵) | 场景覆盖矩阵 | S01-S17 + 新增场景在两个模式中如何落地 |
| [P5](#p5--原型页面审计) | 原型页面审计 | 现有 67 页保留/合并/退役/新增 |
| [P6](#p6--千人千面可配置边界) | 千人千面 · 可配置边界 | 什么能改、什么不能改 |
| [P7](#p7--与-04-v1-mainline-spec-的对齐) | 与 04 v1 主线 spec 的对齐 | 产品形态如何承载 M1-M6 |

---

## P0 · 本文档要解决什么问题

**00-04 文档定义了 Why / Who / What / How / V1 Scope，但缺了一层：产品形态（Form Factor）。**

| 已定义 | 未定义 |
|:---|:---|
| 客户为什么买、为什么敢用（00） | 客户打开浏览器看到什么？ |
| 给谁做（01 四类用户） | 每类用户的主屏幕长什么样？ |
| 做什么（02 路线图各链段） | 做出来的东西组织成什么结构？ |
| 架构怎么组织（03 五层） | 架构层怎么映射到用户界面？ |
| v1 做哪 6 个场景（04） | 6 个场景在界面上怎么串起来？ |

没有产品形态定义，67 页原型就是"一堆各自独立的页面"，sidebar 随便堆菜单。开发看不懂"产品的核心体验是什么"，销售不知道"演示时先给客户看哪个页面"。

**本文档回答一个问题：EMS 到底长什么样。**

---

## P1 · 产品形态 · 第一性原理推导

### 从三条价值推导交互范式

**价值一"倍增 junior"→ 产品必须做事，不是展示信息**

| 传统 IT 工具 | EMS 应该是 |
|:---|:---|
| 监控大屏（展示数据） | ❌ 看数据不能替代 junior |
| ITSM 表单（填写流程） | ❌ 填表单反而增加 junior 工作量 |
| 搜索引擎（找信息） | ❌ 找到了还得自己判断和行动 |
| **AI 驱动的工作队列** | ✅ 系统告诉你该做什么、AI 预填信息、你只需审批/放行 |

"倍增 junior"意味着：**原来 junior 做的事（盯屏→判断→建单→派工→通知→日报），现在系统替 junior 做了大部分，junior 只需要审核/放行/处理例外。**

这推导出的交互范式是 **Work Queue**——以"待办队列"为中心，AI 排序 + 预填，人做决策。

参考：ServiceNow Agent Workspace（2024-2026 主推）、PagerDuty Incident Console、Datadog On-Call。

**价值二"治理可信"→ 管理层需要一个控制台**

| 管理层需要什么 | 对应功能 |
|:---|:---|
| AI 做了什么？ | 调用日志 + 场景分布（T5/T7） |
| 花了多少钱？ | 成本账单 + 预算告警（T2） |
| 效果怎么样？ | AI 建议直接使用率 · override 率 · KPI 达成（T7） |
| 出问题怎么刹车？ | 熔断开关 + 降级策略（T3） |
| 谁有权做什么？ | 权限矩阵 · 档位配置（T8） |

这推导出的交互范式是 **Governance Console**——以"可视化 + 可控制"为中心。

**价值三"一个平台打通运维闭环"→ 处置链路不能断**

| 传统 IT 工具 | EMS 应该是 |
|:---|:---|
| 多个孤立系统（告警在 A、工单在 B、派工在 C） | ❌ 每次切换丢失上下文，信息靠复制粘贴 |
| 人肉接力（电话/消息通知下一步） | ❌ 链路状态靠人脑记忆，无法追溯 |
| **端到端联动链 + 数据标签** | ✅ 告警→RCA→转单→派工一次闭环，链路进度一屏跟踪，跨产品跳转上下文不掉线 |

"平台闭环"意味着：**处置链路（发现→定位→建单→派工→通知）在 EMS 内一次完成，同一个业务实体（服务/CI/工单/告警/派工/诊断报告）在任何产品页面上都有统一数据标签，点击跨产品跳转后自动定位详情。**

这推导出的交互范式是 **跨产品联动链 + 数据标签**——链路状态可视化跟踪（对应 03 §P4 联动链 L01-L04），实体跨产品跳转上下文贯穿（对应 03 §P4 数据标签体系）。

参考：ServiceNow Now Platform 流程编排（Flow Designer）、跨应用统一导航与实体上下文保持。

### 结论：EMS 的产品形态

> **EMS = AI 驱动的工作执行平台**
> 
> 不是监控大屏（passive）、不是表单系统（manual）、不是聊天机器人（conversational only）。
> 
> 核心交互是：**系统做事 → 人审批** —— 而不是"人操作 → 系统记录"。

产品由两个核心模式组成：

| 模式 | 服务对象 | 核心交互 | 类比 |
|:---|:---|:---|:---|
| **Work Queue** | U1 一线 · U2 专业 | "我的待办"——AI 排序、预填、建议 → 我审批/放行/处理 | ServiceNow Agent Workspace |
| **Governance Console** | U3 中层 · U4 领导 | "AI 治理"——指标、审批队列、控制面板 → 我决策/调参 | ServiceNow IT Operations Management Dashboard |

两个模式共享：
- 统一 sidebar（Domain Pages 的导航入口）
- 统一 Copilot（Cmd+K / Cmd+J / 右下 Fab）
- 统一 L2 起草放行抽屉
- 统一 tier badge 系统

---

## P2 · 两个核心模式

### Work Queue（U1/U2 默认首屏）

**一句话：打开 EMS 就是你的待办清单，不用找、不用切系统、不用自己判断优先级。**

#### 布局

```
┌─ sidebar ─┬──────────────────────────────────────────────────────┐
│            │  ┌─ 顶部 KPI 条 ──────────────────────────────────┐ │
│  Domain    │  │ 待处理 23 │ 处理中 8 │ 今日降噪 67% │ SLA ⚠ 2  │ │
│  Pages     │  └────────────────────────────────────────────────┘ │
│  导航      │  ┌─ 队列面板 (40%) ────┬─ 详情面板 (60%) ────────┐ │
│            │  │                      │                         │ │
│  ─────     │  │ ▸ [P1] SW-Core CPU   │  告警详情               │ │
│  ITOM      │  │   95% · 2m · AI建议  │  ├ AI 根因 Top3         │ │
│  CMDB      │  │                      │  ├ 关联 CI · 影响面     │ │
│  ITSM      │  │ ▸ [P1] DB-Master     │  ├ 历史相似案例         │ │
│  FSM       │  │   连接超限 · 5m      │  ├ 建议操作             │ │
│  Agent Hub │  │                      │  │                      │ │
│  ...       │  │ ▸ [P2] AP-307 离线   │  └ [转工单] [派工] [关闭]│ │
│            │  │   12m · NPM          │                         │ │
│            │  │                      │  ┌─ AI 助手 ──────────┐ │ │
│            │  │ ▸ [审批] 转单放行     │  │ Copilot 抽屉        │ │ │
│            │  │   张明触发 · 20m     │  │ (Cmd+J 唤起)        │ │ │
│            │  │                      │  └────────────────────┘ │ │
│            │  └──────────────────────┴─────────────────────────┘ │
└────────────┴─────────────────────────────────────────────────────┘
```

#### 队列项来源（Work Queue 吃什么输入）

| 来源 | 触发条件 | 队列项类型 | AI 预填内容 | 操作集 |
|:---|:---|:---|:---|:---|
| ITOM 告警 | 经 M1 降噪后的有效告警 | 告警 | AI 根因 Top3 + 证据链 + 影响面 | 转工单 · 认领 · 静默 · 升级 |
| ITSM 工单 | 分配给我 / 我创建的工单 | 工单 | AI 建议操作 + SLA 倒计时 | 处理 · 升级 · 关闭 |
| FSM 派工 | 待接 / 待确认的派工单 | 派工 | AI 推荐路线 + 预估时长 | 接单 · 拒绝 · 转派 |
| 审批项 | M3 转单 / M4 变更 / M5 服务请求 | 审批 | AI 起草内容 + 风险评估 | 放行 · 编辑 · 驳回 |
| 交接项 | 上一班遗留的未闭事项 | 交接 | AI 交接摘要 + 上下文 | 认领 · 跳过 |
| SLA 预警 | 工单即将 breach SLA | 预警 | 当前进度 + 建议加速操作 | 升级 · 加急 · 通知 |

**关键设计决策**：
- 队列项**统一数据模型**：不管来源是告警/工单/审批，在队列里都是一个"待办项"（item），包含：类型、优先级、标题、来源、AI 建议、操作按钮、时间
- 队列**默认按 AI 排序**：综合优先级 × 时间 × SLA 紧迫度 × AI 置信度排序（L1 建议档）
- 用户可切换排序/分组：按时间 / 按域 / 按优先级 / 按类型
- 点击队列项 → 右侧面板加载对应详情页内容（不跳转，iframe 或动态加载）
- 需要深入操作时 → 点击"在新标签打开"进入完整 Domain Page

#### U1 vs U2 的队列差异

| 维度 | U1 一线 | U2 专业 |
|:---|:---|:---|
| 默认队列 | 所有类型（告警 + 工单 + 派工 + 交接） | 仅 escalate 工单 + 待接派工 + 变更实施 |
| AI 建议深度 | L1 摘要（"建议转工单"） | L1 详细（RCA Top3 + 证据链 + 历史案例） |
| 操作集 | 转单 · 认领 · 升级 · 静默 | 排查 · 确认根因 · 实施变更 · 回填工单 |
| 右侧详情 | 简要上下文 | 完整 RCA 分析台 |

#### SMB 档 U-Frontline 合并视图

SMB 客户 U1+U2 合并为 U-Frontline：队列显示所有类型 + AI 建议深度为完整版。一个人同时处理简单告警和疑难排查，不需要切角色。

### Governance Console（U3/U4 默认首屏）

**一句话：一屏看清 AI 做得怎么样、花了多少钱、效果好不好、出问题怎么刹车。**

#### 布局

```
┌─ sidebar ─┬──────────────────────────────────────────────────────┐
│            │  ┌─ 4 KPI 卡 ───────────────────────────────────┐   │
│            │  │ 待审批 5 │ SLA 94.2% │ AI 月成本 ¥328 │ 健康 96%│  │
│            │  └──────────────────────────────────────────────┘   │
│            │  ┌─ 左栏 (50%) ─────────┬─ 右栏 (50%) ──────────┐  │
│            │  │                       │                        │  │
│            │  │ 审批队列               │  团队效能               │  │
│            │  │ (M3/M4/M5 审批项)      │  ├ MTTR · SLA · 闭环率 │  │
│            │  │ 按紧急度排序           │  ├ AI 直接使用 72%       │  │
│            │  │                       │  ├ Override 率 8%       │  │
│            │  │ ──────────────         │  └ 趋势图              │  │
│            │  │                       │                        │  │
│            │  │ AI 治理面板            │  服务健康度             │  │
│            │  │ ├ 成本账单 (T2)       │  ├ 5 业务服务状态       │  │
│            │  │ ├ 熔断状态 (T3)       │  ├ SLA breach 预警      │  │
│            │  │ ├ 效果看板 (T7)       │  └ → 下钻到 CMDB 服务   │  │
│            │  │ └ 控制面板 (T8)       │                        │  │
│            │  └───────────────────────┴────────────────────────┘  │
└────────────┴─────────────────────────────────────────────────────┘
```

#### 审批队列（Governance Console 的核心）

与 Work Queue 共享数据源，但只显示"需要 U3 审批"的项目：

| 审批类型 | 来源 | AI 预填 | U3 操作 |
|:---|:---|:---|:---|
| M3 转单放行 | U1 触发 AI 起草工单 | 工单内容 + 分单建议 + 优先级 | 放行 · 编辑 · 驳回 |
| M4 变更审批 | U2 提交变更单 | AI 风险评估 + 影响面 + 缓解建议 | 批准 · 驳回 · 要求补充 |
| M5 服务请求 | 员工提交服务请求 | AI 分类 + 合规检查 + 审批建议 | 批准 · 驳回 · 转审 |
| L3 白名单申请 | U1/U2 申请新增白名单规则 | 规则影响范围 + 历史统计 | 批准 · 驳回 |

#### AI 治理面板（T1-T8 在 Governance Console 的落地）

| T# | 治理项 | 在 Governance Console 的位置 | 交互 |
|:---|:---|:---|:---|
| T1 | 审批卡点 | 审批队列（左栏上部） | 逐项审批 + 批量放行 |
| T2 | 成本账单 | AI 治理面板 · 成本 Tab | 日/周/月 + 按场景/模型下钻 |
| T3 | 熔断 | AI 治理面板 · 状态卡 | 当前成本%/阈值 · 手动触发/解除 |
| T4 | 证据链 | 审批项详情内嵌 | 点击审批项查看 AI 证据 |
| T5 | 审计日志 | AI 治理面板 · 审计 Tab | 按时间/用户/场景筛选 + 导出 |
| T6 | Override | 审计日志内高亮 | override 原因记录 |
| T7 | 效果看板 | 右栏上部（团队效能卡） | M1-M6 KPI 达成 + 趋势 |
| T8 | 权限矩阵 | AI 治理面板 · 控制 Tab | 角色 × 档位 开关矩阵 |

#### U3 vs U4 的差异

| 维度 | U3 中层 | U4 领导 |
|:---|:---|:---|
| 审批队列 | 有（日常审批是主工作） | 无（不做日常审批） |
| 成本视角 | 本月成本 + 趋势 | 季度/年度 ROI + 人力对比 |
| 效能视角 | 团队 MTTR/SLA/闭环率 | 全局 SLA + 跨团队对比 |
| 控制面板 | 档位 + 白名单 + 熔断 | 预算阈值 + 供应商选择 |

#### SMB 档 U-Manager 合并视图

SMB 客户 U3+U4 合并为 U-Manager：审批队列 + 成本 + 效能一屏看完，不区分"管理审批"和"执行概览"。

---

## P2.5 · CMDB 数据底座在产品形态中的角色

### 为什么单独拿出来说

CMDB 不是一个与 ITOM/ITSM/FSM 并列的"功能模块"。**CMDB 是 EMS 整个平台的数据底座**——类似 ServiceNow 的 CMDB/CMS，所有产品都依赖它提供 CI 上下文、服务关系、影响面分析。

在产品形态中，CMDB 的角色是**底层数据供应者**，不是用户直接操作的主界面。用户通过 Work Queue 和 Governance Console 间接消费 CMDB 数据，只有 CMDB 管理员才直接进入 CMDB Domain Pages。

### CMDB 对两个核心模式的数据支撑

| 消费方 | 消费场景 | CMDB 提供什么 | 体现在 UI 的哪里 |
|:---|:---|:---|:---|
| **Work Queue · 告警队列项** | U1 看到一条告警 | CI 名称 + 归属服务 + 物理位置 + 关联设备 | 队列项标题下方（"SW-Core-01 · 核心网络 · 总部 IDC"） |
| **Work Queue · RCA 详情** | U2 分析根因 | 上下游拓扑关系 + 影响面 CI 列表 + 历史变更记录 | 详情面板"影响面"区域 + "关联 CI"表 |
| **Work Queue · 派工队列项** | U2 接派工 | CI 位置 + 配置参数 + 历史维修记录 | 派工详情"现场信息"区域 |
| **Governance · 变更审批** | U3 审变更单 | 变更影响的 CI 数量 + 依赖链 + 服务归属 | 审批详情"AI 影响面分析"区域 |
| **Governance · 服务健康** | U3/U4 看服务状态 | 服务 → CI 映射 + CI 健康状态聚合 | Governance 右栏"服务健康度"卡 |
| **Copilot** | "这个服务有多少设备" | CI 查询 + 关系查询 + 统计 | Copilot 回答中引用 CMDB 数据 |

### CMDB 的三种使用模式

| 模式 | 用户 | 入口 | 说明 |
|:---|:---|:---|:---|
| **被动消费** | U1/U2/U3（大多数时候） | 不需要主动进入 CMDB | Work Queue 详情自动关联 CI 上下文，用户看到的是"这个告警影响了哪个服务"而不是"我要去 CMDB 查一下" |
| **按需查询** | U2（排查时） | sidebar → CMDB · CI 列表 / 关系图谱 / 影响面分析 | 需要深入查看某个 CI 的详细配置、变更历史、拓扑关系时进入 |
| **主动管理** | CMDB 管理员 | sidebar → CMDB 全套 34 页 | Class 管理、发现任务、数据质量、认证、审计——这是 CMDB 产品自身的管理面 |

### 对产品形态设计的约束

1. **Work Queue 的每个队列项必须关联 CI**：告警必须显示 CI 名称和服务归属（来自 CMDB），不能只是一个纯文本告警摘要
2. **Governance 的变更审批必须调用 CMDB 影响面**：AI 风险评估必须引用 CMDB 依赖关系图，审批人看到的不是"影响 23 个设备"的文字，而是可点击下钻到 CI 列表
3. **Copilot 的 MCP Tools 必须包含 CMDB 查询能力**：用户问"这个服务有哪些 CI"时，Copilot 能实时查 CMDB 返回结构化结果
4. **sidebar 的 CMDB 入口保持完整**：34 页 CMDB Domain Pages 全部保留，是 CMDB 管理员的主战场

### v1 必须实现的 CMDB 集成点

| 集成点 | 对应 M 场景 | 实现要求 |
|:---|:---|:---|
| 告警 → CI 关联 | M1/M2 | Work Queue 告警队列项显示 CI 名 + 服务 + 位置 |
| RCA → CMDB 影响面 | M2 | 详情面板展示影响面 CI 列表（可下钻到 cmdb-v2-impact.html） |
| 转工单 → 服务归属 | M3 | L2 抽屉预填工单的"影响服务"字段（从 CMDB 查服务映射） |
| 变更审批 → 依赖链 | M4 | Governance 审批详情展示 CMDB 依赖关系图 |
| 服务健康 → CI 聚合 | Governance | 服务健康卡的数据来源 = CMDB 服务定义 × ITOM CI 状态 |

---

## P3 · 信息架构

### 页面层级

```
EMS Platform
├── Work Queue (portal/work-queue.html) ← U1/U2 默认首屏
│   ├── 队列面板（左）
│   └── 详情面板（右）→ 动态加载 Domain Page 内容 + CMDB CI 上下文
│
├── Governance Console (portal/governance.html) ← U3/U4 默认首屏
│   ├── 审批队列（左上）
│   ├── AI 治理面板（左下）
│   └── 效能 + 服务健康（右）← 数据来源依赖 CMDB 服务映射
│
├── Dashboard (portal/dashboard.html) ← 监控/可视化入口（sidebar "大屏"）
│   ├── 可拖拽组件画布（17 类视图 · 100+ 组件 · 已交付）
│   ├── 内置大屏（运维总览 / 设备健康 / 告警中心）
│   └── 用户自建画布
│
├── Domain Pages（各领域专业页面，从 sidebar 或 Work Queue 进入）
│   ├── ITOM: alert-list · alert-detail · alert-noise-reduction · alert-to-incident · capacity-forecast · npm-overview
│   ├── ITSM: incidents · incident-detail · change-impact · change-detail · service-request
│   ├── ITAM (2026-08-19 转正): overview · asset-ledger · asset-detail · contracts · inventory
│   ├── FSM: dispatch · dispatch-detail
│   ├── CMDB: (34 页完整原型) ← 数据底座的管理面
│   ├── Agent Hub: ai-center（总览）· ai-governance（AI 治理）· ai-platform（AI 平台）
│   └── 平台管理: org/* · settings/*
│
└── Copilot (全局覆盖 · Cmd+K / Cmd+J / 右下 Fab · MCP 查询 CMDB)
```

### 导航结构

| 导航元素 | 位置 | 内容 | 作用 |
|:---|:---|:---|:---|
| **App Launcher** | Domain rail 最顶部（左侧竖条第一项 · 指南针图标） | 我的收藏 + 产品图标（ITOM / ITSM / CMDB / FSM / NPM / **ITAM** / Agent Hub） | 收藏与跨产品快速进入（产品 icon 直达各产品默认首页） |
| **Domain Sidebar** | 左侧 | Portal（Work Queue / Governance / Dashboard）· ITOM / CMDB / ITSM / **ITAM** / FSM / Agent Hub / 设置 | 进入领域专业页面（下钻） |
| **Copilot** | 右下 Fab + Cmd+K | AI 对话（含 CMDB MCP 查询） | 自然语言查询 + 操作 |
| **Breadcrumb** | Header 中间 | 当前路径 | 位置感知 + 返回 |

### 关键设计决策

1. **角色绑定默认首屏**：U1/U2 默认进入 Work Queue，U3/U4 默认进入 Governance Console；三个入口并列在 sidebar Portal 分组（Work Queue / Governance / Dashboard），页面内不做模式切换器（与 sidebar 入口冗余，且跨模式切换为低频操作）
2. **Domain Pages 不在首屏出现**：sidebar 是导航入口，但默认首屏是 Work Queue 或 Governance Console，不是某个 Domain Page
3. **详情面板使用 split view**：Work Queue 点击队列项，右侧面板加载详情（含 CMDB CI 上下文），不离开队列页面（提高效率，减少上下文切换）
4. **Dashboard保留为独立入口**：不退役 dashboard.html，保留其可拖拽组件画布能力，作为"观察模式"的入口（值班大屏/汇报大屏/客户演示）

### URL 设计

| URL | 页面 |
|:---|:---|
| `/portal/work-queue.html` | Work Queue（U1/U2 首屏） |
| `/portal/governance.html` | Governance Console（U3/U4 首屏） |
| `/itom/alert-list.html` | ITOM 告警列表（Domain Page） |
| `/itom/alert-detail.html?id=xxx` | 告警详情（从 Work Queue split view 或独立打开） |
| `/ai/ai-center.html?tab=governance` | Agent Hub 治理 Tab（从 Governance Console 下钻） |
| `/itam/itam-asset-ledger.html` | ITAM 资产台账（Domain Page · 独立顶级域 · 2026-08-19 转正） |
| `/itam/itam-asset-detail.html?id=AST-2024-0173` | 资产详情（资产-站点-合同-CI 关联视图 · ?id= 契约） |
| ... | 其他 Domain Pages 保持不变 |

---

## P4 · 场景覆盖矩阵

### S01-S17 在两个模式中的落地

| # | 场景 | 落地位置 | 落地方式 |
|:---:|:---|:---|:---|
| S01 | 告警盯屏 + AI 摘要 | Work Queue 顶部 KPI | KPI 条"待处理 N"+ 队列自动刷新 |
| S02 | 告警转工单 L1/L3 | Work Queue 队列项操作 | 点击"转工单"→ L2 抽屉 |
| S03 | AI 派工 | Work Queue 队列项操作 | 转工单后自动关联派工建议 |
| S04 | 通知自动化 | Work Queue 队列项操作 | 转工单/派工后 L3 自动通知 |
| S05 | 增强 RCA | Work Queue 详情面板 | alert-detail 内嵌在右侧面板 |
| S06 | 全栈诊断 | Work Queue 详情面板 | 关联 NPM+ITOM+CMDB 上下文 |
| S07 | 变更影响面 | Governance 审批详情 | change-detail 内嵌 AI 影响面 |
| S08 | 变更说明 AI 起草 | Governance 审批队列 | L2 抽屉预填变更说明 |
| S09 | AI 日报 | Copilot | "生成今日日报"→ AI 输出 |
| S10 | AI 周报 | Copilot | "生成本周周报"→ AI 输出 |
| S11 | 一屏聚合查询 | Work Queue | 队列面板本身就是"一屏聚合" |
| S12 | 派工态势 | Work Queue + Governance | 队列筛选"派工"类型 / Governance 团队效能 |
| S13 | 容量扩容 | Domain Page (ITOM) | 从 Work Queue 队列项下钻 |
| S14 | 复盘 | Copilot + Domain Page | AI 起草复盘（知识库沉淀见 S20 · v1.5） |
| S15 | 值班交接 | Work Queue | 交接类型的队列项 |
| S16 | 服务请求 AI 审批 | Governance 审批队列 | L2/L3 抽屉 |
| S17 | 全局对话 Copilot | 全局 | Cmd+K / Fab |

### 新增场景（v1 应覆盖）

| # | 场景 | 落地位置 | 理由 |
|:---:|:---|:---|:---|
| S18 | **SLA breach 预警** | Work Queue 队列项（预警类型） | U1 需要知道"哪个工单快 breach 了"→ 加急处理 |
| S19 | **队列排序 AI 建议** | Work Queue 顶部 | AI 动态调整队列排序 → "先处理这个因为它影响 3 个业务服务" |

### 新增场景（v1.5）

| # | 场景 | 落地位置 | 理由 |
|:---:|:---|:---|:---|
| S20 | 知识库沉淀与复用 | Domain Page (KB) + Work Queue 详情 | U2 排查完毕 → 沉淀 KB → 下次 AI 引用 |
| S21 | 客户满意度闭环 | 工单关闭后推送 | 反馈影响 AI 分单/派工优化 |
| S22 | 资产生命周期事件 | Work Queue 队列项 | EOL/保修到期 → 触发变更/采购（**ITAM 转正后升为出海核心场景** · 联动 ITAM 合同到期 → ITSM 变更 · 2026-08-19） |
| S23 | **跨境链路拨测处置**（出海 · 2026-08-19） | Work Queue 队列项 + ITAM 线路资产上下文 | 跨境专线 DIA/SD-WAN 抖动 → NPM 拨测告警 → ITAM 定位线路资产/合同 → 处置/换线（对应 00 §P2 出海变体） |
| S24 | **海外站点值守交接**（出海 · 2026-08-19） | Work Queue 交接队列项 | 多时区班次交接 · AI 起草英文交接单 · 海外站点跨时区值守兜底（对应 00 §P2 出海变体） |

---

## P5 · 原型页面审计

### 审计标准

每个现有页面回答三个问题：
1. **在新架构中它属于哪层？**（Work Queue / Governance / Domain Page / 应退役）
2. **它服务哪个 M 场景和 S 场景？**
3. **对产品价值有什么贡献？**（价值一"倍增 junior" / 价值二"治理可信" / 价值三"平台闭环" / 无直接贡献）

### portal/ (3 页)

| 页面 | 决策 | 理由 |
|:---|:---|:---|
| `dashboard.html` | **保留 · Dashboard入口** | 复用已有可拖拽组件画布系统（17 类视图 100+ 组件），作为监控/可视化入口保留。不再是默认首屏，从 sidebar "大屏"进入 |
| `dashboard-old.html` | **退役** | 更旧的版本，无价值 |
| `workstation.html` | **重建** | 当前实现是"3 Tab"思路，需按 Work Queue 模式重建 → 改名为 `work-queue.html` |

### itom/ (6 页)

| 页面 | 决策 | 理由 |
|:---|:---|:---|
| `alert-list.html` | **保留 · Domain Page** | M1 告警列表，从 sidebar 或 Work Queue 下钻进入 |
| `alert-detail.html` | **保留 · 关键页** | M2 RCA 详情，Work Queue 右侧面板的主力加载页 |
| `alert-noise-reduction.html` | **保留 · Domain Page** | M1 降噪中心，配置降噪规则 |
| `alert-to-incident.html` | **保留 · Domain Page** | M3 告警转工单流水线，从 Work Queue 操作触发 |
| `capacity-forecast.html` | **保留 · Domain Page** | S13 容量→扩容（W2 下午主线 · 2026-09-02 新建），线路带宽/磁盘/CPU 内存三类指标，sa9 容量预测 Agent 场景载体（SN Predictive AIOps 同形态趋势外推） |
| `npm-overview.html` | **保留 · Domain Page** | NPM 网络质量，S06 关联上下文 |

**已从导航移除**：`itom-topology.html` 网络拓扑不再从 sidebar 进入（文件保留，不再作为 ITOM Domain Page 审计）。

**ITOM 缺失页面**：
- ❌ 无 **SLA 预警列表/面板**（S18 新增场景）
- ✅ RCA 深度分析**不缺**——ITOM Coach-ITOM 已有完整场景化 RCA 体系（6 场景·独立详情页·列表预览抽屉），EMS 通过 `requirements/AI能力集成` 复用，不在 EMS 原型内重造

### itsm/ (5 页)

| 页面 | 决策 | 理由 |
|:---|:---|:---|
| `itsm-incidents.html` | **保留 · Domain Page** | 事件管理列表 |
| `itsm-incident-detail.html` | **保留 · 关键页** | 事件详情，Work Queue 右侧加载 |
| `change-impact.html` | **保留 · Domain Page** | 变更管理列表 |
| `change-detail.html` | **保留 · 关键页** | 变更详情 + AI 风险评估，Governance 审批详情加载 |
| `service-request.html` | **保留 · Domain Page** | 服务请求管理 |

**ITSM 无缺失**：当前覆盖完整。

### fsm/ (2 页)

| 页面 | 决策 | 理由 |
|:---|:---|:---|
| `fsm-dispatch.html` | **保留 · Domain Page** | 派工列表 |
| `fsm-dispatch-detail.html` | **保留 · Domain Page** | 派工详情 |

**FSM 无缺失**。

### ai/ (1 页)

| 页面 | 决策 | 理由 |
|:---|:---|:---|
| `ai-center.html` | **保留 · 关键页** | Agent Hub 总览（2026-08-21 拆分：治理 → ai-governance.html · 平台 → ai-platform.html），Governance Console 的下钻入口 |

**AI 无缺失**：Governance Console 将吸收 ai-center 治理 Tab 的核心内容作为顶层摘要。

### cmdb/ (34 页)

| 决策 | 理由 |
|:---|:---|
| **全部保留 · Domain Page** | CMDB v2 完整原型，接入 EMS 统一 shell（统一 header + 域名竖条 + CMDB 导航面板，移除 cmdb 独立侧边栏） |

### org/ (5 页) + settings/ (5 页)

| 决策 | 理由 |
|:---|:---|
| **全部保留 · Domain Page** | 平台管理功能，从 sidebar 进入 |

### 汇总

| 决策 | 页面数 | 明细 |
|:---|:---:|:---|
| 保留 | 59 | Domain Pages（itom 6 + itsm 5 + fsm 2 + ai 1 + cmdb 34 + org 5 + settings 5）+ dashboard.html（Dashboard） |
| 退役 | 1 | dashboard-old.html |
| 重建 | 1 | workstation.html → work-queue.html |
| **新增** | **8** | **work-queue.html**（Work Queue）· **governance.html**（Governance Console）· **itam 5 页**（overview / asset-ledger / asset-detail / contracts / inventory · 2026-08-19 ITAM 转正交付）· **capacity-forecast.html**（容量预测 · 2026-09-02 新增） |
| 待补 | 1 | SLA 预警面板（v1 应有） |
| 复用 ITOM | — | Coach-ITOM RCA 场景化详情页（6 场景）· 通过 iframe/跳转集成 |

> **ITAM 审计补充（2026-08-19）**：`itam/` 5 页（2026-08-19 新交付）全部保留 · Domain Page（独立顶级域）——资产台账承载 ITAM→CMDB 双向对账（8,421 匹配 / 234 差异）与资产-站点-合同关联视图；库存盘点承载全球备件仓（6 仓 · 4h SLA）与盘点差异闭环。

---

## P6 · 千人千面 · 可配置边界

### 不可配置（产品固定）

| 项目 | 理由 |
|:---|:---|
| 两个核心模式（Work Queue / Governance Console） | 产品形态的骨架，不能让客户"关掉 Work Queue 只用 Dashboard" |
| L2 起草放行抽屉 | 价值二的核心载体，不可关闭 |
| 档位系统（L1/L2/L3 badge） | 治理可信的视觉标识 |
| Copilot | 价值一 M6 的核心功能 |
| **跨产品数据标签 / 联动链** | **价值三"平台闭环"的核心载体，不可关闭** |
| 审计日志 | 合规硬性要求 |

### 可配置（客户 IT 主管 / 管理员）

| 配置项 | 范围 | 默认值 |
|:---|:---|:---|
| **角色 → 默认模式映射** | U1→Work Queue / U3→Governance / 可调 | 按 Persona 文档定义 |
| **队列排序规则** | AI 排序 / 按时间 / 按优先级 / 自定义 | AI 排序 |
| **队列过滤器** | 按域 / 按类型 / 按优先级 | 全部 |
| **Sidebar 菜单项** | 显示/隐藏 Domain Pages（按购买模块） | 全部显示 |
| **Governance KPI 卡** | 选择显示哪 4 个 KPI | 待审批 / SLA / AI 成本 / 服务健康 |
| **AI 档位开关** | 每个 M 场景独立配置 L1/L2/L3；拨 L3 需至少存在一条已审批的白名单规则（无规则时 L3 灰置）；拨档位不审批；降级自由 | 04 spec 定义的默认值 |
| **白名单规则** | L3 自动执行的条件 | 空（需客户主动配置） |
| **熔断阈值** | 成本 % 和 错误率 % | 成本 80% · 错误率 10% |
| **通知渠道** | 邮件 / 钉钉 / 企微 / Webhook | 邮件 |

### 与Dashboard系统的关系（关键）

EMS 线上已有一套完整的**Dashboard系统**（已交付，详见 `requirements/Dashboard/`）：
- **画布（Dashboard）**：用户自建的可视化画布，从空白创建，拖拽组件构建
- **组件（Component）**：17 类视图分类，100+ 个可拖拽组件（设备/LAN/WAN/服务器/告警/拓扑/EMS/ITSM/ITAM...）
- **内置大屏**：3 个开箱即用大屏（运维总览/设备健康/告警中心），可二次编辑
- **按租户隔离、支持共享**

**AI 驱动模式与Dashboard的关系：**

| 模式 | 定位 | Dashboard的角色 |
|:---|:---|:---|
| **Work Queue** | 产品默认首屏 · 工作执行入口 | Work Queue 本身**不是**Dashboard，但可以从 Work Queue 切换到大屏模式 |
| **Governance Console** | U3/U4 治理入口 | Governance 的 KPI 区域**复用**千人千面组件机制——可配置显示哪些 KPI 卡、拖拽排序 |
| **Dashboard** | 监控/可视化/展示入口 | 作为独立入口保留（sidebar "大屏"），用户可创建自定义画布用于值班大屏/汇报大屏/客户演示 |

**结论**：Work Queue 和 Governance Console 是**行动入口**（做事），Dashboard是**观察入口**（看数据）。三者并存，不是互斥。角色默认首屏 = Work Queue 或 Governance，但用户随时可从 sidebar 切到Dashboard看监控数据。

### 千人千面的实现层次

| 层次 | 机制 | 控制者 |
|:---|:---|:---|
| **角色视图** | 角色 → 默认模式 + 队列过滤器 | 管理员配置角色模板 |
| **租户定制** | 购买模块 → sidebar 菜单裁剪 + 内置大屏模板 | License / SKU 控制 |
| **大屏自定义** | 拖拽组件 · 创建画布 · 按角色分配 | 用户自行编辑（已有能力） |
| **个人偏好** | 排序方式 / 展开/折叠 / 暗色模式 | 用户自行设置 |

---

## P7 · 与 04 v1 主线 spec 的对齐

### M1-M6 在产品形态中的位置

| 场景 | Work Queue | Governance Console | Domain Page |
|:---|:---|:---|:---|
| **M1 降噪** | 队列只展示降噪后的告警 | KPI "今日降噪率" | alert-noise-reduction |
| **M2 RCA** | 详情面板加载 ITOM Coach-ITOM 场景化 RCA（抽屉预览 + 下钻详情页） | — | alert-detail + **ITOM Coach-ITOM RCA 详情页**（复用，不重造） |
| **M3 转工单** | 队列操作"转工单"→ L2 抽屉 | 审批队列"转单放行" | alert-to-incident |
| **M4 变更审批** | — | 审批队列"变更审批"→ L2 抽屉 | change-detail |
| **M5 服务请求** | — | 审批队列"服务请求"→ L2 抽屉 | service-request |
| **M6 Copilot** | 右下 Fab / Cmd+K | 右下 Fab / Cmd+K | ai-center |

### 交付优先级对齐

W2 路线图的 N1"高频操作聚合入口"→ 就是 **Work Queue**。不再是"工作台 Tab"，而是一个完整的工作模式。

| 路线图 | 产品形态对应 |
|:---|:---|
| W2 N1 高频操作聚合 | Work Queue = 高频操作的唯一入口 |
| W3 N2 联动链 | Work Queue 队列项的操作链（告警→转单→派工→通知） |
| W3 N3 增强 RCA | Work Queue 详情面板 + RCA 独立页 |
| W4 N5 AI 治理面板 | Governance Console = 治理面板的落地形态 |
| W5 N4 降噪 | Work Queue 的输入过滤器（降噪后才进队列） |
| W5 N6 Dashboard 增强 | Dashboard组件扩展（新增 AI 相关组件：AI 建议直接使用率 / 成本趋势 / 场景分布） |

---

## 不做清单

- ❌ 不做独立的"监控大屏"页面作为默认首屏（monitoring 作为Dashboard中的一个可选画布存在，不是产品入口）
- ❌ 不做 U4 专属的"执行驾驶舱"（v1 U4 用 Governance Console + Copilot + 千人千面自定义画布）
- ❌ 不做 mobile-first 设计（v1 仅桌面端）
- ❌ 不为 AI 驱动模式重新造一套大屏组件系统（复用千人千面已有 17 类视图 100+ 组件）

---

## 起草记录

| 版本 | 日期 | 变更 | 作者 |
|:---|:---|:---|:---|
| v0.1 | 2026-08-12 | 首稿：产品形态定义（Work Queue + Governance Console）· 信息架构 · 场景覆盖矩阵（S01-S19 + S20-S22 v1.5）· 61 页原型审计（保留 59 · 退役 1 · 重建 1 · 新增 2 · 待补 2）· 千人千面可配置边界 · 与 04 v1 spec 对齐 | @pangxx-it188 |
| v0.2 | 2026-08-12 | 修复两个问题：（a）Dashboard是线上已有能力（17 类视图 100+ 可拖拽组件），dashboard.html 保留为独立入口而非退役，Work Queue / Governance / Dashboard三者并存（行动入口/治理入口/观察入口）；（b）新增 §P2.5 CMDB 数据底座章节 — 明确 CMDB 对 Work Queue（告警→CI 关联/RCA 影响面）和 Governance Console（变更审批→依赖链/服务健康→CI 聚合）的数据支撑关系，定义 v1 必须实现的 5 个 CMDB 集成点 | @pangxx-it188 |
| v0.3 | 2026-08-13 | **移除 Mode Switcher**：与 sidebar Portal 分组入口冗余、跨模式切换为低频操作、且实现已偏离 spec（dashboard 页缺失、位置非 Header 左侧）。原型 work-queue/governance 删除组件；导航结构表删除 Mode Switcher 行；关键设计决策 #1 由"Mode Switcher 取代 Tab"改为"角色绑定默认首屏 + sidebar 直达"；dashboard 入口描述同步 | @pangxx-it188 |
| v0.4 | 2026-08-13 | 审计口径核对：汇总表「待补 1」仅指 SLA 预警面板；v0.1 首稿记录中的「待补 2」系拆分前的历史口径（Coach-ITOM RCA 场景化复用已单列为「复用 ITOM」行），以汇总表为准 | @pangxx-it188 |
| v0.5 | 2026-08-13 | 导航结构表新增 **App Launcher**（Header 左侧 Logo 旁：我的收藏 + 产品图标直达默认首页）；菜单展示体系三层定义详见 03 §P4 | @pangxx-it188 |
| v0.6 | 2026-08-13 | cmdb/ 34 页接入 EMS 统一 shell：统一 header（Logo 最左 + 指南针启动器 + 星标收藏）+ 域名竖条 + CMDB 导航面板（补充「发现历史」「IRE 仿真」两项）；移除 cmdb 独立侧边栏与 48px 独立 header；下钻页按路径前缀归属域面板 | @pangxx-it188 |
| v0.7 | 2026-08-13 | App Launcher 位置随 03 v0.6 调整：Header 内 → Domain rail 最顶部（指南针图标），导航结构表同步 | @pangxx-it188 |
| v0.8 | 2026-08-14 | **标题同步（00 回填联动）**：§P1"从两条价值推导交互范式" → "从三条价值推导交互范式" | @pangxx-it188 |
| v0.9 | 2026-08-14 | **价值三推导补全（00 回填联动）**：§P1 新增"价值三 · 一个平台打通运维闭环 → 处置链路不能断"推导段（孤立系统/人肉接力 → 端到端联动链 + 数据标签，推导出跨产品联动链 + 数据标签范式，参考 SN Now Platform Flow）；§P6 不可关闭清单补"跨产品数据标签 / 联动链"（价值三核心载体） | @pangxx-it188 |
| v1.0 | 2026-08-17 | **Agent Hub 术语回改（2026-08-17 决策）**：AI 资产管理页面显示名统一为 Agent Hub——§P2 Work Queue 布局图侧边栏、§P3 信息架构、§P3 导航结构（App Launcher / Domain Sidebar）、§P3 URL 设计、§P5 页面审计 6 处同步（文件名 ai-center.html 不变） | @pangxx-it188 |
| v1.1 | 2026-08-19 | **出海对齐 + ITAM 转正（公司定位「中企出海」）**：§P1 推导结论补"出海客户视角"验证（Work Queue 跨时区交接队列项 · Governance T2 多币种账单 · 资产数据标签）；§P3 页面层级新增 **ITAM 域 5 页** · 导航结构 App Launcher / Domain Sidebar 补 ITAM · URL 设计补 itam 页（独立顶级域 · ITSM 与 FSM 之间）；§P4 v1.5 场景表 S22 升为出海核心场景 + 新增 **S23 跨境链路拨测处置 / S24 海外站点值守交接**（对应 00 §P2 出海变体）；§P5 审计汇总"新增 2 → 7"（+ itam 5 页）· 补 ITAM 审计说明 | @pangxx-it188 |
| v1.2 | 2026-08-19 | **页面审计数字同步（评审修订）**：§P5 审计汇总"新增 7 → 12"（+ **pms 5 页** · 2026-08-19 同日交付）· 补 PMS 审计说明（演示形态 · Champ-PMS 独立产品线指向 doc/07）；§P0 / 章节导航"61 页"→"71 页"（59 保留 + 12 新增，与实际目录一致） | @pangxx-it188 |
| v1.3 | 2026-08-19 | **链段化术语同步（02 §P4 重写联动）**：P0 定位表"02 路线图 W1-W5"改为"链段 A-F" | @pangxx-it188 |
| v1.4 | 2026-09-02 | **PMS 移出 + 容量预测入列**：PMS 处于设计早期、不在当前 EMS 需求范围——§P5 审计汇总删除 pms 5 页（新增 12 → 8 · 补 capacity-forecast 2026-09-02 新增）· 删除 PMS 审计说明 · §P0 / 章节导航 71 → 67 页 · 原型导航 PMS 域隐藏（文件保留） | — |
