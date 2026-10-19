# AI 能力集成

> **需求归属**：EMS 产品线
> **状态**：原型阶段（Prototype）
> **关联 PR**：ems-product PR #178 ~ #192
> **最后更新**：2026-05-26

## 概述

EMS 平台集成 AI Agent 能力，为 ITOM 子产品提供智能运维支持。核心目标：

1. **告警智能分析** — 基于 AI Agent 对告警事件进行根因分析、置信度排序、修复建议生成、自动化处置推荐
2. **统一 Agent 管理** — 提供 Agent Hub 管理界面，集中管控模型配置、Agent 实例、调用记录、Token 用量

## 开发范围

本次需求需要开发 **2 个新页面**：

| # | 页面 | 原型路径 | 目标用户 |
|:--|:-----|:---------|:---------|
| 1 | 告警中心 + AI 根因分析 | `agent-demo-homepage/prototype/itom/alert-center-v2.html` | ITOM 运维工程师 |
| 2 | Agent Hub 管理页 | `agent-demo-homepage/prototype/ai/ai-management-v2.html` | 平台管理员 |

## 目录结构

```
AI能力集成/
├── README.md                  ← 本文件（需求概述）
└── agent-demo-homepage/
    ├── README.md              ← Feature PRD
    ├── design.md              ← 功能设计文档（开发参照）
    └── prototype/             ← 可交互 HTML 原型
        ├── index.html         # 导航入口
        ├── assets/            # 共享资源
        │   ├── ems-v2-common.css
        │   ├── itom-logo.png
        │   └── EMS-UI-Design-Specification-v2.md
        ├── itom/              # ITOM 新增页面
        │   └── alert-center-v2.html   # 告警中心 + AI 根因分析
        ├── ai/                # AI 新增页面
        │   └── ai-management-v2.html  # Agent Hub 管理页
        └── baseline/          # 基线页面（已有 EMS 功能，仅参考）
            ├── workspace-v2.html      # EMS 工作台
            └── ... (11 pages)
```

## 快速预览

直接在浏览器中打开 `agent-demo-homepage/prototype/index.html` 即可浏览所有原型页面。

## 技术架构

- **Agent API**：`POST /v1/agents/{agent_name}/analyze` → `GET /v1/agents/{agent_name}/result/{task_id}`（异步轮询模式）
- **网络代理**：AI Agent API 通过 EMS 后端统一代理访问，前端不直连 Agent 服务器地址
- **模型后端**：GLM-5.1（本地 10.10.10.61:28000）为主力模型，Qwen2.5 / Claude Opus 4.6 / ChatGPT 5.5 为备选
- **通信模式**：提交分析任务 → 获取 task_id → 每 3s 轮询结果 → 展示诊断报告
- **超时策略**：60s 未完成标记超时，前端展示超时状态 + 重试按钮
- **集成方式**：EMS 平台统一入口 → ITOM 模块通过 Agent Hub 消费 AI 能力
- **主题支持**：亮色/暗色双主题（CSS 变量 + `data-theme` 属性切换，localStorage 持久化）
- **国际化**：支持中文简体/繁体/英文切换

## 异常状态设计

原型中包含以下异常场景的交互展示（告警列表末尾 3 行 Demo 数据）：

| 状态 | 触发条件 | 用户看到 |
|:-----|:---------|:---------|
| 分析失败 | 后端返回错误 / 接口 5xx | 错误提示 + 重试按钮 + 联系管理员引导 |
| 分析超时 | 轮询 60s 无完成响应 | 超时提示 + 重试按钮 + Task ID 信息 |
| 服务离线 | Agent 服务不可达 | 离线提示 + 引导至 Agent Hub 检查 |
| 数据为空 | timeline/cases/recommendations 返回空数组 | 对应区域显示「暂无」占位 |
