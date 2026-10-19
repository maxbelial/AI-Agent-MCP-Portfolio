# AI Agent / MCP 产品设计作品集

> 6 年产品经理 + 10 年软件开发 · 企业级智能运维平台（EMS）的 AI 产品体系设计
> 覆盖：AI Agent 体系设计 · MCP 工具生态 · 自主权分级治理 · 执行闭环 · AI 商业化

## 作品集导读

本仓库是一套**完整落地到原型的企业级 AI Agent 产品设计**，从价值主张 → 平台架构 → Agent 目录 → MCP 工具生态 → 治理体系 → 计费模式 → 单 Agent PRD 全链路自洽：

| 维度 | 规模 |
|:---|:---|
| AI 能力全景 | 54 项，覆盖 6 大产品域（监控/CMDB/工单/现场服务/网络/资产） |
| 内置 Agent | 14 个（7 平台通用 A1-A7 + 7 产品域场景 Agent），每个有独立 PRD 与验收指标 |
| MCP 生态 | 6 个产品级 MCP Server（CMDB/ITOM/ITSM/FSM/NPM/ITAM），28+ Tools |
| 治理体系 | T1-T8 八大治理项 + L1/L2/L3 自主权档位 + 审计六要素 |
| 计费模式 | AI 功能 License + 模型用量双层计费（credits / BYOK / 私有化）+ MSP 转售 |

## 目录结构

```
AI-Agent-MCP-Portfolio/
├── README.md                  ← 本文件
├── summary/                   ← 能力总结（求职导向）
│   └── AI-Agent-MCP产品能力总结.md   量化数据 / STAR 故事 / 面试问答
├── platform-design/           ← 平台级设计方案（14 份编号文档）
│   ├── 00-product-value-thesis.md   价值主张（三条价值线 + ROI 口径）
│   ├── 02-design-split-plan.md      设计拆解计划
│   ├── 03-overall-framework.md      总体框架（五层架构 / 四种 AI 接入方式 / L1-L3 档位）
│   ├── 08-ai-commercialization-...  AI 商业化与治理闭环（T5 审计六要素 / SN 对标）
│   ├── 12-ai-pricing-model.md       AI 定价模型（权威定稿）
│   ├── 13-ai-agent-mcp-catalog.md   Agent 与 MCP 权威目录（54 能力 / 14 Agent / 6 MCP）
│   ├── 14-ai-license-sku.md         AI License SKU 化
│   └── ...                          用户画像 / 主线规格 / 工作台 PRD / 原型脚本等
├── agent-design/              ← 单 Agent PRD 与设计基线
│   ├── AI-Agent-Skill-CLI定位说明.md  Agent / Skill / CLI 三层工具抽象权威基线
│   └── AI平台/Agent设计/             根因分析 / 智能开单 / ITSM 智能分单 / FSM 调度推荐 Agent PRD
├── prototype/                 ← 可交互高保真原型（纯静态 HTML，浏览器直接打开）
│   ├── ai/ai-platform.html    AI 平台（Agent 库 / MCP 工具目录 / 端点管理）
│   ├── ai/ai-center.html      AI 中心（治理 Tab T1-T8）
│   ├── ai/ai-governance.html  AI 治理中心
│   └── assets/                共享组件与设计规范
└── integration-demo/          ← AI 能力集成 Feature（告警中心 + AI 根因分析 / Agent Hub）
    ├── README.md / design.md / prototype/
    └── agent-demo-homepage/
```

## 快速浏览

1. **先看** `summary/AI-Agent-MCP产品能力总结.md` —— 10 分钟看懂整个体系
2. **核心方案** `platform-design/13-ai-agent-mcp-catalog.md` —— Agent 与 MCP 全景目录
3. **深度设计** `agent-design/` 下各 Agent PRD —— 输入输出契约 / 确定性规则与模型职责切分 / 异常降级 / 验收指标
4. **打开原型** `prototype/ai/ai-platform.html` —— 可交互的 Agent 库与 MCP 管理

## 设计方法论亮点

- **Agent 六要素**：标识与目标 / 场景范围 / 输入输出契约 / Skill 使用 / CLI 范围 / 治理配置；业务页面通过稳定场景编码调用指定 Agent，模型不自由选 Agent
- **三层工具抽象**：Skill（带 JSON Schema 契约的 Markdown 工作流）+ CLI（Agent 友好的产品命令行，按需发现 / 结构化输出 / 身份继承 / 可审计）
- **确定性规则闸门**：不用 LLM 自报置信度做执行闸门；证据反查防幻觉（模型引用必须在原始工具返回中反查验证）
- **安全分级**：L1 辅助 / L2 推荐+审批 / L3 硬编码白名单自动执行，L4 明确不做；写操作 Tool 默认封锁对外端点
- **MCP 边界判断**：多模态是模型推理能力而非产品数据工具，移出 MCP 目录走模型接入层

## 说明

- 文档中的相对链接沿用原内部仓库路径，部分引用文档不在本仓库范围内，属正常现象
- 本仓库为个人求职作品集，请勿用于商业分发
