# Feature: 集成 Agent Demo 到 EMS 首页

> **Feature ID**：agent-demo-homepage
> **归属 Epic**：AI 能力集成
> **关联工单**：[ops-playbook#1047](https://github.com/it188-networkx/ops-playbook/issues/1047)
> **状态**：原型评审通过 → 待开发
> **最后更新**：2026-05-26

---

## 1. 背景

季冠 POC 要求在当前 EMS 版本新增 2 个页面承载 AI Agent 能力展示与管理，并将告警 AI 根因分析、自动化处置触发与 Agent 管理能力接入 EMS 统一入口，供本地演示使用。

## 2. 目标

在 EMS 平台新增 2 个页面，实现告警 AI 分析的完整闭环展示和 Agent 管理后台：

| # | 页面 | 目标用户 | 入口位置 |
|:--|:-----|:---------|:---------|
| 1 | 告警中心 + AI 根因分析 | ITOM 运维工程师 | 侧边栏「ITOM 模块 → 告警中心」 |
| 2 | Agent Hub 管理页 | 平台管理员 | 侧边栏「AI 管理 → Agent Hub」 |

## 3. 范围边界

### 本次做

- 告警列表 + AI 分析状态列
- 全屏抽屉展示诊断报告（根因排名 / 时间线 / 相似案例 / 处置方案）
- 异步分析流程（提交 → 轮询 → 展示结果）
- 告警中心复用 ITOM 现有自动化处置能力，包括执行脚本、Netmiko/Ansible 执行链路、L1/L2/L3 分级规则，并继承 ITOM 现有自动化审批流程
- 分析中 / 成功 / 失败 / 超时 / 服务离线 5 种状态的完整 UI
- Agent Hub 概览 / Agent 管理 / 调用记录 三个 Tab
- 仅已接入运行中的 Agent 提供真实启停；规划中 Agent 仅展示状态，不提供可操作开关
- GLM-5.1 作为当前告警分析主模型，其余模型以预配置/备用状态展示

### 本次不做

- "创建 Agent" / "添加模型" 弹窗的实际 CRUD
- 在 EMS 侧新增或重写自动化执行引擎、审批链路与通知能力
- capacity_agent / noise_reduce_agent 实际上线
- Token 计费真实数据
- 云模型接入当前告警分析主链路
- 相似案例向量检索对接

## 4. 技术约束

| 项目 | 决策 |
|:-----|:-----|
| API 端点 | `POST /v1/agents/alert_agent/analyze` + `GET /v1/agents/alert_agent/result/{task_id}` |
| 网络代理 | 前端不直连 Agent 服务器，通过 EMS 后端统一代理（具体代理方案由后端架构确定） |
| 轮询间隔 | 3 秒 |
| 超时阈值 | 60 秒（超时后停止轮询，展示超时 UI + 重试按钮） |
| 模型 | GLM-5.1（本地 10.10.10.61:28000），单次 ~20K Token，耗时 ~30-40s |
| 自动化处置 | 复用 ITOM 现有执行脚本、Netmiko/Ansible 执行链路与 L1/L2/L3 分级规则；审批流程继承 ITOM 自动化审批流程，EMS 仅负责展示、触发与结果回显 |
| Agent 启停 | 仅已接入运行中的 Agent 提供真实启停；规划中 Agent 仅展示状态，不提供可操作开关 |
| 备用模型 | Qwen2.5 / Claude Opus 4.6 / ChatGPT 5.5 仅作为预配置备用模型展示，不参与当前告警分析主流程 |
| 主题 | CSS 变量 + `data-theme` 属性，localStorage 持久化 |

## 5. 统计口径

| 指标/字段 | 口径 |
|:----------|:-----|
| 分析成功率 | `completed / (completed + failed + timeout)` |
| 平均耗时 | `completed` 状态分析任务的 `duration_seconds` 平均值 |
| 本月调用 | 当前自然月内发起的 AI 分析任务总数 |
| 相似度 | 复用 ITOM 相似案例服务返回的分值，页面默认过滤 `>= 50%` 的结果，最多展示 3 条 |
| 风险等级 | 复用 ITOM 智能告警自动化处置规则：L1 自动执行、L2 确认执行、L3 提交审批后执行 |

## 6. 异常状态设计

| 状态 | 触发条件 | 前端表现 |
|:-----|:---------|:---------|
| 分析失败 | 后端返回错误 / 接口 5xx | 抽屉展示错误提示 + 重试按钮 + "联系管理员" 引导 |
| 分析超时 | 轮询 60s 未收到 completed | 抽屉展示超时提示 + Task ID + 重试按钮 |
| 服务离线 | Agent 服务不可达 | 抽屉展示离线提示 + 引导至 Agent Hub 检查 |
| 数据为空 | `timeline` / `similar_cases` / `recommendations` 返回 `[]` | 对应区域显示「暂无数据」占位文案 |

## 7. 字段可空性

以下字段实测可能为空，前端需兜底：

| 字段 | 可空形式 | 兜底展示 |
|:-----|:---------|:---------|
| `timeline` | `[]` | 「暂无关联事件」 |
| `similar_cases` | `[]` | 「暂无相似案例」 |
| `recommendations` | `[]` | 右栏显示「暂无匹配处置方案」 |
| `causes[].evidence` | `""` | 隐藏证据行 |
| `thinking_steps[].detail` | `""` | 仅展示步骤标题 |
| `summary` | 不为空（必返回） | — |

## 8. 验收标准

### 告警中心

- [ ] 告警列表正常加载，含 AI 分析状态列
- [ ] 点击「AI 分析」触发异步任务，抽屉展示 4 步进度条
- [ ] 轮询完成后展示完整诊断报告（根因排名 + 时间线 + 相似案例）
- [ ] 超时/失败场景展示错误状态 + 重试按钮
- [ ] 空数据场景展示占位提示
- [ ] 右栏自动化处置方案按 ITOM 既有分级规则正确触发：L1 自动执行、L2 确认执行、L3 提交审批后执行
- [ ] 暗色模式下所有组件可读性正常

### Agent Hub

- [ ] 概览 Tab：5 张统计卡片 + 7 日趋势图 + 系统状态 + Token 用量 + 模型配置表
- [ ] Agent 管理 Tab：仅 alert_agent 提供真实启停开关，capacity_agent / noise_reduce_agent 仅展示规划状态且不可操作
- [ ] 模型配置表中仅 GLM-5.1 为当前启用模型，其余模型显示为预配置/备用状态
- [ ] 调用记录 Tab：带筛选的明细表格可按 Agent / 状态（completed / failed / timeout）/ 时间范围过滤
- [ ] 暗色模式全功能可用

### 不纳入本次验收

- "创建 Agent" / "添加模型" 的实际 CRUD
- EMS 侧新增自动化执行引擎或审批链路
- capacity_agent / noise_reduce_agent 实际运行
- 云模型进入当前告警分析主链路
- Token 计费真实数据

## 9. 交付物

| 文件 | 说明 |
|:-----|:-----|
| `README.md` | 产品需求文档（功能范围、技术约束、验收标准） |
| `design.md` | 功能设计文档（交互细节、API 规格、页面结构） |
| `prototype/itom/alert-center-v2.html` | 告警中心原型（含异常状态 Demo） |
| `prototype/ai/ai-management-v2.html` | Agent Hub 原型 |
| `prototype/index.html` | 原型导航入口 |
