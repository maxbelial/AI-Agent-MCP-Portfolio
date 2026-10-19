/**
 * EMS v6 Unified Platform — Shared Components
 * Injects: Sidebar, Header, AI Drawer + FAB, Command Palette, Common Scripts
 *
 * Usage: In each HTML page, add before </body>:
 *   <script>
 *     window.EMS_PAGE = {
 *       activeMenu: 'index.html',       // filename of current page
 *       breadcrumb: 'AI 管理',           // current breadcrumb text
 *       aiQuickActions: [                // optional — 4 quick cards
 *         { title: '全局概览', desc: '各模块健康', prompt: '概述状态' },
 *         ...
 *       ]
 *     };
 *   </script>
 *   <script src="ems-v6-components.js"></script>
 */
(function () {
  'use strict';

  // Embed mode: skip all shell injection when loaded inside iframe/embed
  if (window.location.search.indexOf('embed=1') !== -1) {
    document.documentElement.classList.add('ems-embed');
    // Hide shell containers if they exist in HTML
    var style = document.createElement('style');
    style.textContent = '.header,.sidebar,.ems-ai-fab,.ems-ai-drawer,.ems-cmd-palette{display:none!important}.main{position:static!important;left:0!important;top:0!important;height:100vh!important;overflow:auto!important}';
    document.head.appendChild(style);
    return; // Skip all component injection
  }

  var CFG = window.EMS_PAGE || {};
  var basePath = CFG.basePath || '';
  var captureMode = new URLSearchParams(window.location.search || '').get('capture') === '1';
  if (captureMode) {
    document.documentElement.classList.add('ems-capture-mode');
    var captureStyle = document.createElement('style');
    captureStyle.textContent = [
      'html.ems-capture-mode{overflow:hidden!important;background:var(--c-bg,#f5f7fa)}',
      'html.ems-capture-mode body{width:2560px!important;height:2200px!important;min-width:2560px!important;min-height:2200px!important;overflow:hidden!important;transform:scale(.5);transform-origin:top left}',
      'html.ems-capture-mode .header{right:auto!important;width:2560px!important}',
      'html.ems-capture-mode .domain-rail{height:calc(2200px - var(--header-h) - 56px)!important}',
      'html.ems-capture-mode .domain-panel{height:calc(2200px - var(--header-h))!important}',
      'html.ems-capture-mode .main,html.ems-capture-mode body.ds-active .main{right:auto!important;bottom:auto!important;width:calc(2560px - 236px)!important;height:auto!important;min-height:calc(2200px - var(--header-h))!important;overflow:visible!important}',
      'html.ems-capture-mode body.ds-panel-collapsed .main{width:calc(2560px - 56px)!important}',
      'html.ems-capture-mode .ai-fab{display:none!important}'
    ].join('');
    document.head.appendChild(captureStyle);
  }
  var solutionQueryContext = /(?:^|&)solution=1(?:&|$)/.test((window.location.search || '').slice(1));
  var solutionContext = solutionQueryContext;
  try {
    solutionContext = solutionContext || sessionStorage.getItem('ems-menu-context') === 'solution';
  } catch (e) {}
  // ─── 本地原型链接 ────────────────────────────────────────────────
  // ems-standard-solution 已同步 EMS NEO 平台页，默认所有域内跳转都回到本目录；
  // 如需接入外部完整原型，可通过 CFG.deepBase 显式覆盖。
  var DEEP_BASE = CFG.deepBase || basePath;
  // 幂等判据：href 已带 DEEP_BASE 前缀（_u() 产物或上一轮改写结果）即视为已深链，不再重复加前缀
  function _isDeepLinked(href) {
    return !!href && !!DEEP_BASE && href.indexOf(DEEP_BASE) === 0;
  }
  function _u(href) {
    if (!href) return 'javascript:void(0)';
    if (/^([a-z]+:\/\/|#)/i.test(href)) return href;
    if (_isDeepLinked(href)) return href;
    if (/^(pms|assets)\//.test(href)) return basePath + href;
    return DEEP_BASE + href;
  }
  // 页面正文中的 `../域/` 相对链接默认保持本地；配置 deepBase 时可统一切到外部原型
  // 幂等：DEEP_BASE 本身以 ../ 开头，改写产物仍命中 a[href^="../"]；不跳过会二次加前缀 → 双前缀死链
  function _rewriteDeepLinks() {
    document.querySelectorAll('a[href^="../"]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (_isDeepLinked(href)) return;
      var rest = href.slice(3);
      if (/^(pms|assets)\//.test(rest)) return;
      a.setAttribute('href', DEEP_BASE + rest);
    });
  }
  window._rewriteDeepLinks = _rewriteDeepLinks;

  var activeMenu = CFG.activeMenu || '';
  if (/^master-data\//.test(activeMenu)) {
    solutionContext = true;
  }
  if (!solutionQueryContext && solutionContext && !/^(solution|itsm|itam|fsm|pms|master-data)\//.test(activeMenu)) {
    solutionContext = false;
  }
  // CMDB/ITOM/NPM 页面已由 EMS 场景承载：无论残留 solution 上下文还是显式 ?solution=1，都保持最终菜单结构
  if (/^(itom|cmdb)\//.test(activeMenu)) {
    solutionContext = false;
  }
  // 标记 EMS 统一 shell 已接管，cmdb-v2-shell.js 检测到后跳过自身的 header/sidebar 注入
  window.EMS_UNIFIED_SHELL = true;
  var breadcrumb = CFG.breadcrumb || '';
  var aiQuickActions = CFG.aiQuickActions || [
    { title: '全局概览', desc: '各模块健康状态一览', prompt: '概述当前各产品模块的运行状态' },
    { title: '待办事项', desc: '汇总高优先级待处理项', prompt: '有哪些需要立即处理的事项？' },
    { title: '创建工单', desc: '事件工单或现场工单', prompt: '创建工单' },
    { title: '智能派工', desc: '查询待派工并推荐工程师', prompt: '查看待派工的现场工单' }
  ];

  // ─── I18N: English design-language layer ─────────────────────────
  var I18N_KEY = 'ems-prototype-language';
  var currentLang = 'zh-CN';
  try {
    currentLang = localStorage.getItem(I18N_KEY) || 'zh-CN';
  } catch (e) {}
  try {
    document.documentElement.lang = currentLang;
  } catch (e) {}
  var EN_TERMS = {
    'EMS NEO• AI驱动的企业IT运维平台': 'EMS NEO · AI-Driven IT Operations Platform',
    '解决方案总览': 'Solution Overview',
    '五域联动全景': 'Cross-Domain Operations Map',
    '项目全生命周期': 'Project Lifecycle',
    'EMS NEO 标准方案': 'EMS NEO Standard Solution',
    '运维概览': 'Operations Overview',
    '租户运营汇总': 'Tenant Operations Summary',
    '项目 / 客户运营汇总': 'Project / Customer Operations Summary',
    '工作台': 'Workspace',
    '工作台总览': 'Workspace Overview',
    '我的待办': 'My To-dos',
    '我的工作台': 'My Workspace',
    '待办事项': 'Work Items',
    '治理中心': 'Governance Center',
    'Governance Console': 'Governance Console',
    '仪表盘': 'Dashboard',
    '报告中心': 'Report Center',
    'UMP 总览': 'UMP Overview',
    '报表预览': 'Report Preview',
    '编辑报表规则': 'Edit Report Rule',
    'NOC 监控中心': 'NOC Monitoring Center',
    '平台运营看板': 'Platform Operations Dashboard',
    '客户视图': 'Customer View',
    '看板设置': 'Dashboard Settings',
    '组织': 'Organization',
    '设置': 'Settings',
    '产品': 'Products',
    '我的收藏': 'Favorites',
    '点击页面右上角星标收藏常用页面': 'Use the star in the header to add frequent pages',
    '组织管理': 'Organization Management',
    '租户管理': 'Tenant Management',
    '授权管理': 'License Management',
    '产品管理': 'Product Management',
    '组织架构': 'Organization Structure',
    '角色管理': 'Role Management',
    '角色权限': 'Roles and Permissions',
    '系统设置': 'System Settings',
    '通用设置': 'General Settings',
    '个人信息': 'Profile',
    '同步管理': 'Synchronization Management',
    '三方对接': 'Third-Party Integrations',
    'AI 治理': 'AI Governance',
    'AI 平台': 'AI Platform',
    'AI 计费中心': 'AI Billing Center',
    'NEO Agent Hub': 'NEO Agent Hub',
    'AI 管理': 'AI Management',
    'NEO Copilot': 'NEO Copilot',
    'AI 智能运维中心': 'AI Operations Center',
    'AI 智能运维 · 实时洞察': 'AI Operations · Real-Time Insights',
    'AI 智能运维': 'AI Operations',
    '自然语言查询': 'natural language query',
    '根因分析': 'root cause analysis',
    '变更评估': 'change assessment',
    '上传附件': 'Upload Attachment',
    '附件': 'Attachment',
    '选择模型': 'Select Model',
    '发送': 'Send',
    '给 NEO Copilot 发消息…  输入 / 查看命令': 'Message NEO Copilot... Type / for commands',
    '输入关键词搜索设备、告警、工单': 'Search devices, alerts, and tickets by keyword',
    '或使用 /alert /ci /ticket 筛选范围': 'Or use /alert /ci /ticket to filter the scope',
    '问 NEO Copilot': 'Ask NEO Copilot',
    '导航': 'Navigation',
    '快速导航': 'Quick Navigation',
    '最近访问': 'Recent Visits',
    '操作': 'Actions',
    '打开': 'Open',
    '关闭': 'Close',
    '设备': 'Devices',
    '告警': 'Alerts',
    '工单': 'Tickets',
    '工程师级别': 'Engineer Levels',
    '告警中心': 'Alert Center',
    '告警列表': 'Alert List',
    '告警管理': 'Alert Management',
    '告警降噪': 'Alert Noise Reduction',
    '降噪中心': 'Noise Reduction Center',
    '告警转工单': 'Alert-to-Ticket',
    '告警→事件': 'Alert-to-Incident',
    '容量预测': 'Capacity Forecast',
    '容量趋势': 'Capacity Trend',
    '容量与可用性': 'Capacity and Availability',
    '扩容建议': 'Capacity Expansion Recommendations',
    '预警复核': 'Alert Review',
    '容量周报': 'Capacity Weekly Report',
    '网络拓扑': 'Network Topology',
    '服务拓扑': 'Service Topology',
    '基础设施拓扑': 'Infrastructure Topology',
    '定位设备': 'Locate Device',
    '网络质量': 'Network Quality',
    '网络与拨测': 'Network and Synthetic Monitoring',
    '劣化预测': 'Degradation Prediction',
    '逐跳诊断': 'Hop-by-Hop Diagnosis',
    '备用线路': 'Backup Link',
    '监控对象': 'Monitored Objects',
    '对象健康': 'Object Health',
    '业务可用性': 'Service Availability',
    '自动化运维': 'Operations Automation',
    '自动化': 'Automation',
    '自动发现': 'Auto Discovery',
    '配置管理': 'Configuration Management',
    '配置中心': 'Configuration Center',
    '配置项与关系': 'CIs and Relationships',
    '配置项列表': 'Configuration Item List',
    'CI 资产': 'CI Assets',
    'CI 列表': 'CI List',
    'CMDB 资产': 'CMDB Assets',
    '数据源': 'Data Sources',
    '凭据': 'Credentials',
    '服务映射': 'Service Mapping',
    '影响分析': 'Impact Analysis',
    '质量治理': 'Data Quality Governance',
    '审计合规': 'Audit and Compliance',
    '事件管理': 'Incident Management',
    '事件工单': 'Incident Tickets',
    '服务请求': 'Service Request',
    '服务请求管理': 'Service Request Management',
    '服务运营': 'Service Operations',
    '服务目录': 'Service Catalog',
    '知识库': 'Knowledge Base',
    '问题管理': 'Problem Management',
    '变更管理': 'Change Management',
    '变更影响': 'Change Impact',
    '变更影响分析': 'Change Impact Analysis',
    '优先级': 'Priority',
    '紧急度': 'Urgency',
    '影响度': 'Impact',
    'SLA 管理': 'SLA Management',
    '现场服务': 'Field Service',
    '现场派工': 'Field Dispatch',
    '现场工单工作台': 'Field Work Order Workspace',
    '派工管理': 'Dispatch Management',
    '工程师': 'Engineer',
    '工程师资源': 'Engineer Resources',
    '排班': 'Schedule',
    '工时管理': 'Time Tracking',
    '服务网点': 'Service Sites',
    '客户管理': 'Customer Management',
    '客户': 'Customer',
    '项目与交付': 'Projects and Delivery',
    '项目列表': 'Project List',
    '客户项目管理': 'Customer Project Management',
    '项目报告': 'Project Reports',
    '组合报表': 'Portfolio Reports',
    '任务管理': 'Task Management',
    '项目任务': 'Project Tasks',
    '交付物管理': 'Deliverable Management',
    '交付物': 'Deliverables',
    '验收与关闭': 'Acceptance and Closure',
    '人员目录': 'People Directory',
    '团队目录': 'Team Directory',
    'Team 目录': 'Team Directory',
    'team目录': 'Team Directory',
    '审计日志': 'Audit Logs',
    '配置中心': 'Configuration Center',
    '项目': 'Project',
    '模型与识别': 'Modeling and Identification',
    '模型识别': 'Model Identification',
    'Class 体系': 'Class Hierarchy',
    'Class体系': 'Class Hierarchy',
    '关系词汇': 'Relationship Vocabulary',
    '识别规则': 'Identification Rules',
    'IRE 仿真': 'IRE Simulation',
    '产品模型': 'Product Model',
    '蓝图管理': 'Blueprint Management',
    '发现任务': 'Discovery Jobs',
    '发现模式': 'Discovery Patterns',
    '发现历史': 'Discovery History',
    '凭据库': 'Credential Vault',
    '影响面分析': 'Impact Scope Analysis',
    '关系图谱': 'Relationship Graph',
    '服务定义': 'Service Definitions',
    '数据接入': 'Data Ingestion',
    '数据治理': 'Data Governance',
    '外部集成': 'External Integrations',
    '数据源': 'Data Sources',
    '集成连接器': 'Integration Connectors',
    '数据质量': 'Data Quality',
    '冲突处理': 'Conflict Handling',
    '去重管理': 'Deduplication Management',
    '生命周期': 'Lifecycle',
    '认证管理': 'Attestation Management',
    '审计合规': 'Audit and Compliance',
    '出站订阅': 'Outbound Subscriptions',
    '投递失败': 'Delivery Failures',
    '报表与设置': 'Reports and Settings',
    '报表中心': 'Report Center',
    '设置中心': 'Settings Center',
    '项目交付': 'Project Delivery',
    'PMS · 共享主数据': 'PMS · Shared Master Data',
    'PMS · 治理与配置': 'PMS · Governance and Configuration',
    'SLA配置': 'SLA Configuration',
    '变更窗口': 'Change Windows',
    '变更分类': 'Change Categories',
    '风险等级': 'Risk Levels',
    '规则类型': 'Rule Types',
    '任务类型': 'Task Type',
    '技能要求': 'Skill Requirements',
    '品牌名称': 'Brand Name',
    '请求单号': 'Request ID',
    '权限有效期（天）': 'Permission Validity (Days)',
    '修改内容': 'Changed Content',
    '你的决策': 'Your Decision',
    '批准附加条件（可选）': 'Additional Approval Conditions (Optional)',
    '匹配条件（AI 起草）': 'Matching Conditions (AI Drafted)',
    '任务说明 · AI 起草': 'Task Description · AI Drafted',
    '描述 · AI 辅助起草（可编辑）': 'Description · AI Assisted Draft (Editable)',
    'AI 调用记录': 'AI Invocation Logs',
    'AI 访问设置': 'AI Access Settings',
    'AI 风险等级': 'AI Risk Level',
    'AI 风险评估摘要（可编辑）': 'AI Risk Assessment Summary (Editable)',
    'AI 建议依据': 'AI Recommendation Rationale',
    'AI 起草说明（合规检查结果）': 'AI Drafting Notes (Compliance Check Results)',
    'AI 说明 · 为什么建议这条规则': 'AI Explanation · Why This Rule Is Recommended',
    'AI 派工依据 · 技能/位置/负载三维度': 'AI Dispatch Rationale · Skill / Location / Workload',
    'AI 分析历史事件 · 12 起 OSPF 震荡': 'AI Analysis of Historical Incidents · 12 OSPF Flapping Events',
    'AI 调用记录 · Skills:告警根因分析': 'AI Invocation Log · Skill: Alert Root Cause Analysis',
    'AI 调用记录 · DeepSeek V4 · 2.1k in / 0.6k out · ¥0.005': 'AI Invocation Log · DeepSeek V4 · 2.1k in / 0.6k out · ¥0.005',
    'AI 调用记录 · DeepSeek V4 · 3.2k in / 0.8k out · ¥0.008': 'AI Invocation Log · DeepSeek V4 · 3.2k in / 0.8k out · ¥0.008',
    'AI 风险评估调用记录 · Opus 4.7 · 8.2k in / 2.1k out · ¥0.033': 'AI Risk Assessment Invocation Log · Opus 4.7 · 8.2k in / 2.1k out · ¥0.033',
    '变更窗口冲突检测 · 无冲突': 'Change Window Conflict Check · No Conflict',
    '变更窗口与业务高峰冲突': 'Change Window Conflicts with Business Peak',
    '分单团队不正确': 'Incorrect Assignment Team',
    '合规规则库 · VPN 类型规则 v3.2': 'Compliance Rule Library · VPN-Type Rule v3.2',
    '申请人合规风险': 'Applicant Compliance Risk',
    '申请人历史请求 · 12 条 · 通过 10 拒绝 2': 'Applicant Request History · 12 Items · 10 Approved / 2 Rejected',
    '相似变更历史 · 近 90 天 38 次 · 失败率 8%': 'Similar Change History · 38 in Last 90 Days · 8% Failure Rate',
    '相似历史工单': 'Similar Historical Tickets',
    '相似请求 · SR-2024-0798（3 天前拒绝）': 'Similar Request · SR-2024-0798 (Rejected 3 Days Ago)',
    '优先级低估': 'Priority Underestimated',
    'CMDB 关联错误': 'CMDB Correlation Error',
    'CMDB 设备位置 · Web-Server-01 · HKT-DC-A': 'CMDB Device Location · Web-Server-01 · HKT-DC-A',
    'CMDB 影响面查询': 'CMDB Impact Scope Query',
    'CMDB 影响面分析 · 23 个下联设备': 'CMDB Impact Scope Analysis · 23 Downstream Devices',
    'CMDB OSPF 邻居拓扑': 'CMDB OSPF Neighbor Topology',
    '工程师历史工单 · P.Y. Lau · 完成率 96%': 'Engineer Historical Tickets · P.Y. Lau · 96% Completion Rate',
    '关联设备': 'Linked Devices',
    '客户地点': 'Customer Location',
    '来源工单': 'Source Ticket',
    '派单团队': 'Dispatch Team',
    '推荐工程师': 'Recommended Engineer',
    '预计到达时间': 'Estimated Arrival Time',
    '作用范围': 'Scope of Impact',
    '决策': 'Decision',
    '资产管理': 'Asset Management',
    '资产概览': 'Asset Overview',
    '资产台账': 'Asset Ledger',
    '全球资产台账': 'Global Asset Ledger',
    '资产清单': 'Asset List',
    '资产请求': 'Asset Requests',
    '库存盘点': 'Inventory Stocktaking',
    '备件仓与盘点': 'Spare Parts Warehouse and Stocktaking',
    '耗材管理': 'Consumables Management',
    '入库管理': 'Inbound Management',
    '未入库': 'Pending Inbound',
    '已入库': 'Inbound Completed',
    '发货单': 'Delivery Orders',
    '差异报告': 'Variance Report',
    '合同管理': 'Contract Management',
    '销售合同': 'Sales Contracts',
    '采购合同': 'Purchase Contracts',
    '预警中心': 'Warning Center',
    '预警历史': 'Warning History',
    '预警规则': 'Warning Rules',
    '基础设置': 'Basic Settings',
    '使用指引': 'Getting Started',
    '语言切换': 'Language',
    '暗色/亮色模式': 'Dark / Light Mode',
    '全屏': 'Fullscreen',
    '收藏当前页面': 'Add Current Page to Favorites',
    '应用启动器': 'App Launcher',
    '切换租户': 'Switch Tenant',
    '搜索租户…': 'Search tenants...',
    '搜索设备、告警、工单…': 'Search devices, alerts, and tickets...',
    'Ask NEO Copilot · 搜索设备、告警、工单…': 'Ask NEO Copilot · Search devices, alerts, and tickets...',
    '搜索设备、告警、工单，或直接问 NEO Copilot…': 'Search devices, alerts, tickets, or ask NEO Copilot...',
    '查询租户名称': 'Search tenant name',
    '租户': 'Tenant',
    '切换到租户': 'Switched to tenant',
    '收起': 'Collapse',
    '展开 / 收起侧边栏': 'Expand / Collapse Sidebar',
    '待开发': 'To Be Developed',
    '规划中': 'Planned',
    '视角': 'Perspective',
    '当前企业租户': 'Current Enterprise Tenant',
    'ENT 企业租户': 'ENT Enterprise Tenant',
    '企业租户': 'Enterprise Tenant',
    '分组': 'Group',
    '范围': 'Scope',
    '周期': 'Period',
    '窗口': 'Window',
    '近 30 天': 'Last 30 Days',
    '近 24 小时': 'Last 24 Hours',
    '24 小时': '24 Hours',
    '本周': 'This Week',
    '本月': 'This Month',
    '今日': 'Today',
    'MSP 视角': 'MSP Perspective',
    '全部租户': 'All Tenants',
    '纳管租户': 'Managed Tenants',
    '多租户': 'Multi-Tenant',
    '跨租户': 'Cross-Tenant',
    '跨租户纳管资产、服务、现场与项目。管理看态势，执行进工作台。': 'Cross-tenant asset, service, field, and project operations. Managers review posture; operators work from the workspace.',
    '当前租户': 'Current Tenant',
    '跨租户': 'Cross-Tenant',
    '本租户': 'Current Tenant',
    '租户范围': 'Tenant Scope',
    '租户健康排行': 'Tenant Health Ranking',
    '项目 / 客户健康排行': 'Project / Customer Health Ranking',
    '健康排行': 'Health Ranking',
    '健康度': 'Health Score',
    '可用性': 'Availability',
    '活跃告警': 'Active Alerts',
    '待处理工单': 'Pending Tickets',
    'AI 处理率': 'AI Resolution Rate',
    '实时洞察': 'Real-Time Insights',
    '最近更新': 'Last Updated',
    '可配置': 'Configurable',
    '调用明细': 'Usage Details',
    '监控中心': 'Monitoring Center',
    '服务器': 'Servers',
    '网络设备': 'Network Devices',
    '安全设备': 'Security Devices',
    'CI 总数': 'Total CIs',
    '关系拓扑': 'Relationship Topology',
    '服务管理': 'Service Management',
    '本月工单': 'Tickets This Month',
    '变更单': 'Changes',
    'SLA达标': 'SLA Compliance',
    '在途任务': 'Active Tasks',
    '满意度': 'Satisfaction',
    '拨测任务': 'Synthetic Tests',
    '自动工单': 'Automated Tickets',
    'RCA准确率': 'RCA Accuracy',
    '智能运维中心': 'Intelligent Operations Center',
    '智能运维数据管线': 'Intelligent Operations Data Pipeline',
    '告警生成': 'Alert Generation',
    '原始告警': 'Raw Alerts',
    '有效告警': 'Actionable Alerts',
    'AI 降噪': 'AI Noise Reduction',
    'CMDB 关联': 'CMDB Correlation',
    '智能工单': 'Intelligent Ticketing',
    '现场派单': 'Field Dispatch',
    '平台通用': 'Platform-Wide',
    '运行中': 'Running',
    '对话触发': 'Conversation Trigger',
    '快捷卡命中': 'Quick Action Hit Rate',
    '详情调用明细': 'Details / Usage Details',
    '容量报告': 'Capacity Report',
    '降噪报告': 'Noise Reduction Report',
    '降噪详情': 'Noise Reduction Details',
    '查看 SOP': 'View SOP',
    '查看 NEO Agent Hub': 'View NEO Agent Hub',
    '端到端自动化': 'End-to-End Automation',
    'AI 起草': 'AI Drafting',
    'AI 建议': 'AI Recommendations',
    '人工确认': 'Human Approval',
    '派工确认': 'Dispatch Confirmation',
    '硬编码规则': 'Hard-Coded Rules',
    '压缩率': 'Compression Rate',
    '指标': 'Metrics',
    '拓扑 + 影响面': 'Topology + Impact Scope',
    '档位口径': 'Tier Definition',
    '可用率': 'Availability',
    '全量 CI 资产及关系图谱，AI 根因分析知识底座': 'Full CI asset graph and relationship topology, the knowledge base for AI root cause analysis',
    '事件、变更、问题全生命周期，ITIL4 合规': 'Full lifecycle for incidents, changes, and problems, aligned with ITIL 4',
    '云拨测 + 网络质量监控（延迟/丢包/抖动）': 'Cloud synthetic monitoring + network quality monitoring (latency / packet loss / jitter)',
    '7×24 监控覆盖 HKT DC / GBA / Retail 三大区域': '24x7 monitoring coverage across HKT DC, GBA, and Retail regions',
    'GBA 区域 78 个零售门店现场运维调度': 'Field operations dispatch for 78 retail stores in the GBA region',
    '主线场景': 'Core Scenarios',
    '6 主线场景（M1-M6）+ EMS CLI + NEO Agent 自然语言': '6 Core Scenarios (M1-M6) + EMS CLI + NEO Agent Natural Language',
    '协议': 'Protocol',
    '自然语言': 'Natural Language',
    '治理': 'Governance',
    '一览': 'Overview',
    '生成今日运维摘要': 'Generate Today\'s Operations Brief',
    '周环比关键指标变化': 'Week-over-Week KPI Change',
    '汇总高优先级待处理项': 'Summarize High-Priority Work Items',
    '各模块健康状态一览': 'Module Health Overview',
    '每日简报': 'Daily Brief',
    '趋势对比': 'Trend Comparison',
    '降噪率': 'Noise Reduction Rate',
    '自动处置': 'Auto Remediation',
    '容量风险': 'Capacity Risk',
    '服务工单': 'Service Tickets',
    '现场任务': 'Field Tasks',
    '在途项目': 'In-Flight Projects',
    '运营风险': 'Operational Risks',
    '需要关注': 'Require Attention',
    'SLA 风险': 'SLA Risk',
    '红色风险': 'Red Risk',
    '合同 / SLA / 交付': 'Contract / SLA / Delivery',
    'AI 跨租户运营助手': 'AI Cross-Tenant Operations Assistant',
    '跨租户 SLA / 项目风险自动分析 · 审计留痕': 'Automated cross-tenant SLA and project-risk analysis with audit traceability',
    'SLA 预警': 'SLA Warning',
    '项目风险汇总': 'Project Risk Summary',
    '查看租户运营': 'View Tenant Operations',
    '查看项目风险': 'View Project Risks',
    '工时计费': 'Time and Billing',
    '计费结构': 'Billing Structure',
    '查看工时分析': 'View Time Analysis',
    '能力域态势': 'Capability Domain Posture',
    '摘要 + 下钻': 'Summary + Drilldown',
    '台账、合同、库存、盘点。': 'Ledger, contracts, inventory, and stocktaking.',
    '请求、事件、问题、变更。': 'Requests, incidents, problems, and changes.',
    '工单、派工、排班、利用率。': 'Tickets, dispatch, scheduling, and utilization.',
    '待派': 'Pending Dispatch',
    '利用率': 'Utilization',
    '客户项目': 'Customer Projects',
    '资产总量': 'Total Assets',
    '维保到期': 'Maintenance Expiring',
    '库存风险': 'Inventory Risk',
    '盘点差异': 'Stocktaking Variance',
    '配置项': 'Configuration Items',
    '关系完整度': 'Relationship Completeness',
    '影响分析请求': 'Impact Analysis Requests',
    '质量问题': 'Data Quality Issues',
    '服务请求': 'Service Requests',
    '事件': 'Incidents',
    '变更': 'Changes',
    '知识命中': 'Knowledge Hit Rate',
    '待派工': 'Pending Dispatch',
    '工程师利用率': 'Engineer Utilization',
    '一次修复率': 'First-Time Fix Rate',
    '延期风险': 'Delay Risk',
    '待验收': 'Pending Acceptance',
    '离线对象': 'Offline Objects',
    '未关联 CI': 'Unlinked CIs',
    '发现异常': 'Discovery Exceptions',
    '链路健康': 'Link Health',
    '拨测成功率': 'Synthetic Test Success Rate',
    '高延迟链路': 'High-Latency Links',
    '受影响站点': 'Impacted Sites',
    '已转事件': 'Converted Incidents',
    '平均确认': 'Average Acknowledge Time',
    '自动处置率': 'Auto Remediation Rate',
    '转事件': 'Converted to Incidents',
    '失败重试': 'Failed Retries',
    '节省工时': 'Hours Saved',
    '高水位对象': 'High-Watermark Objects',
    '优化建议': 'Optimization Recommendations',
    '状态': 'Status',
    '类型': 'Type',
    '名称': 'Name',
    '编号': 'ID',
    '描述': 'Description',
    '负责人': 'Owner',
    '创建人': 'Created By',
    '创建时间': 'Created At',
    '更新时间': 'Updated At',
    '操作时间': 'Operation Time',
    '优先级': 'Priority',
    '严重级别': 'Severity',
    '来源': 'Source',
    '对象': 'Object',
    '服务': 'Service',
    '分类': 'Category',
    '标签': 'Tags',
    '动作': 'Action',
    '操作': 'Actions',
    '更多': 'More',
    '查看': 'View',
    '编辑': 'Edit',
    '删除': 'Delete',
    '新增': 'Create',
    '新建': 'Create',
    '保存': 'Save',
    '取消': 'Cancel',
    '确认': 'Confirm',
    '提交': 'Submit',
    '审批': 'Approval',
    '导出': 'Export',
    '导入': 'Import',
    '筛选': 'Filter',
    '搜索': 'Search',
    '重置': 'Reset',
    '刷新': 'Refresh',
    '详情': 'Details',
    '总览': 'Overview',
    '列表': 'List',
    '规则': 'Rules',
    '模板': 'Template',
    '报表': 'Report',
    '分析': 'Analysis',
    '趋势': 'Trend',
    '风险': 'Risk',
    '建议': 'Recommendations',
    '告警根因分析': 'Alert Root Cause Analysis',
    'CMDB 影响分析': 'CMDB Impact Analysis',
    '容量规划': 'Capacity Planning',
    '周报生成': 'Weekly Report Generation'
  };
  Object.assign(EN_TERMS, {
    '问卷调查': 'Survey',
    '证书管理': 'Certificate Management',
    '入驻审核': 'Engineer Onboarding Review',
    '档案访问申请': 'Profile Access Requests',
    '档案访问授权': 'Profile Access Authorizations',
    '审核中心': 'Review Center',
    '资源与人员': 'Resources and Personnel',
    '调度员与客服': 'Dispatchers and Customer Service',
    'TAC工程师': 'TAC Engineers',
    'TAC工程师排班': 'TAC Engineer Scheduling',
    '客服排班': 'Customer Service Scheduling',
    '班次定义': 'Shift Definitions',
    'SLA管理': 'SLA Management',
    '时间管理': 'Time Management',
    '银行账户': 'Bank Accounts',
    '证书类型': 'Certificate Types',
    '受理提单': 'Ticket Intake',
    '工单列表': 'Work Orders',
    '工单模板': 'Work Order Templates',
    '现场工程师': 'Field Engineers',
    '现场工程师工作台': 'Field Engineer Workspace',
    '排班日历': 'Scheduling Calendar',
    '工单管理': 'Work Order Management',
    '服务网点': 'Service Sites',
    '备件管理': 'Spare Parts Management',
    '结算记录': 'Settlement Records',
    '移动端详情': 'Mobile Detail',
    '菜单配置详情': 'Menu Configuration Detail',
    '服务项详情': 'Service Item Detail',
    '新建服务项': 'Create Service Item',
    '新建证书类型': 'Create Certificate Type',
    '证书类型详情': 'Certificate Type Detail',
    '证书管理详情': 'Certificate Management Detail',
    '入驻申请': 'Onboarding Application',
    '档案访问申请详情': 'Profile Access Request Detail',
    '档案访问授权详情': 'Profile Access Authorization Detail',
    '服务请求': 'Service Requests',
    '服务门户': 'Service Portal',
    '服务目录管理': 'Service Catalog Management',
    '知识库管理': 'Knowledge Base Management',
    '服务报告': 'Service Reports',
    '团队管理': 'Team Management',
    '团队与报告': 'Teams and Reports',
    '服务效率': 'Service Efficiency',
    '问题任务': 'Problem Tasks',
    '变更任务': 'Change Tasks',
    '问题细分': 'Problem Subcategories',
    '故障类别': 'Fault Categories',
    '紧急性': 'Urgency',
    '影响度': 'Impact',
    '优先级配置': 'Priority Configuration',
    '优先级': 'Priority',
    '分类': 'Categories',
    '资产分析看板': 'Asset Analytics Dashboard',
    '资产概览': 'Asset Overview',
    '资产台账': 'Asset Ledger',
    '资产请求': 'Asset Requests',
    '我的请求 / 全部请求': 'My Requests / All Requests',
    '发货单': 'Delivery Orders',
    '固定资产管理': 'Fixed Asset Management',
    '资产清单': 'Asset Inventory',
    '自采清单': 'Self-Procured Assets',
    '代管清单': 'Managed Assets',
    '固定资产发货明细': 'Fixed Asset Delivery Details',
    '固定资产申请明细': 'Fixed Asset Request Details',
    '资产入库明细': 'Asset Inbound Details',
    '耗材与库存': 'Consumables and Inventory',
    '耗材表': 'Consumables',
    '耗材库存': 'Consumable Inventory',
    '耗材入库明细': 'Consumable Inbound Details',
    '耗材发货明细': 'Consumable Delivery Details',
    '耗材申请明细': 'Consumable Request Details',
    '未入库': 'Pending Inbound',
    '已入库': 'Inbound Completed',
    '盘点任务': 'Stocktaking Tasks',
    '盘点任务定义': 'Stocktaking Task Definitions',
    '所有任务': 'All Tasks',
    '差异报告': 'Variance Reports',
    '合同与预警': 'Contracts and Alerts',
    '销售合同': 'Sales Contracts',
    '采购合同': 'Purchase Contracts',
    '预警历史': 'Alert History',
    '预警规则': 'Alert Rules',
    '基础设置': 'Basic Settings',
    '网点管理': 'Site Management',
    '客户管理': 'Customer Management',
    '供应商管理': 'Supplier Management',
    '货架管理': 'Shelf Management',
    '仓库管理': 'Warehouse Management',
    '型号管理': 'Model Management',
    '品牌管理': 'Brand Management',
    '资产类别': 'Asset Categories',
    '状态管理': 'Status Management',
    '项目列表': 'Project List',
    '任务管理': 'Task Management',
    '交付物管理': 'Deliverable Management',
    '验收与关闭': 'Acceptance and Closure',
    '项目报告': 'Project Reports',
    '组合报表': 'Portfolio Reports',
    '项目与交付': 'Projects and Delivery',
    '共享主数据': 'Shared Master Data',
    '治理与配置': 'Governance and Configuration',
    '报表中心': 'Report Center',
    '报告中心': 'Report Center',
    '系统设置': 'System Settings',
    '基础信息': 'Basic Information',
    '操作日志': 'Operation Log',
    '操作人': 'Operator',
    '操作类型': 'Operation Type',
    '操作内容': 'Operation Details',
    '操作时间': 'Operation Time',
    '操作后余额': 'Balance After Operation',
    '时间': 'Time',
    '名称': 'Name',
    '编码': 'Code',
    '状态': 'Status',
    '备注': 'Remarks',
    '更新时间': 'Updated At',
    '最后更新时间': 'Last Updated At',
    '创建时间': 'Created At',
    '创建人': 'Created By',
    '修改时间': 'Modified At',
    '最后修改': 'Last Modified',
    '操作': 'Actions',
    '类型': 'Type',
    '描述': 'Description',
    '邮箱': 'Email',
    '姓名': 'Name',
    '日期': 'Date',
    '班次': 'Shift',
    '开始时间': 'Start Time',
    '结束时间': 'End Time',
    '排班状态': 'Schedule Status',
    '人员姓名': 'Personnel Name',
    '记录编号': 'Record ID',
    '档案编号': 'Profile ID',
    '档案状态': 'Profile Status',
    '工程师类型': 'Engineer Type',
    '服务区域': 'Service Region',
    '所属组织单元': 'Organization Unit',
    '技能标签': 'Skill Tags',
    '颁发机构': 'Issuing Authority',
    '颁发日期': 'Issue Date',
    '有效期至': 'Valid Until',
    '被授权账号': 'Authorized Account',
    '申请人': 'Applicant',
    '发起人': 'Requester',
    '审批意见': 'Approval Comment',
    '当前审批人': 'Current Approver',
    '合同编号': 'Contract ID',
    '合同名称': 'Contract Name',
    '金额': 'Amount',
    '到期日': 'Expiry Date',
    '关联单据': 'Linked Document',
    '资产': 'Asset',
    '资产编号': 'Asset ID',
    '资产名称': 'Asset Name',
    '资产分类': 'Asset Category',
    '资产型号': 'Asset Model',
    '资产状态': 'Asset Status',
    '资产单位': 'Asset Unit',
    '站点': 'Site',
    '仓库': 'Warehouse',
    '仓库名称': 'Warehouse Name',
    '仓库编码': 'Warehouse Code',
    '仓库类型': 'Warehouse Type',
    '单位': 'Unit',
    '单价': 'Unit Price',
    '总价': 'Total Price',
    '总金额': 'Total Amount',
    '数量': 'Quantity',
    '库存': 'Inventory',
    '总库存': 'Total Inventory',
    '安全库存': 'Safety Stock',
    '差异类型': 'Variance Type',
    '差异数量': 'Variance Quantity',
    '差异数': 'Variance Count',
    '预期数量': 'Expected Quantity',
    '预期状态': 'Expected Status',
    '处理状态': 'Processing Status',
    '处理说明': 'Handling Notes',
    '处置方式': 'Handling Method',
    '报告编号': 'Report ID',
    '报告名称': 'Report Name',
    '报表类型': 'Report Type',
    '导出编号': 'Export ID',
    '项目编号': 'Project ID',
    '项目': 'Project',
    '客户': 'Customer',
    '进度': 'Progress',
    '当前里程碑': 'Current Milestone',
    '风险': 'Risk',
    '里程碑': 'Milestone',
    '计划日期': 'Planned Date',
    '剩余': 'Remaining',
    '负责人': 'Owner',
    '责任人': 'Responsible Owner',
    '总负责人': 'Master Owner',
    '下钻': 'Drilldown',
    '层级': 'Hierarchy',
    '所属总项目': 'Parent Master Project',
    '问题编号': 'Issue ID',
    '问题描述': 'Issue Description',
    '影响': 'Impact',
    '处理进展': 'Handling Progress',
    '闭环状态': 'Closure Status',
    '闭环 N/M': 'Closure N/M',
    '来源系统': 'Source System',
    '最后成功同步时间': 'Last Successful Sync Time',
    '失败原因': 'Failure Reason',
    '重试状态': 'Retry Status',
    '关联项目': 'Linked Project',
    '服务项名称': 'Service Item Name',
    '所属目录': 'Catalog',
    '表单页面配置': 'Form Page Configuration',
    '单据类型': 'Document Type',
    '时间表': 'Schedule',
    '重复频率': 'Repeat Frequency',
    '日期范围': 'Date Range',
    '结算单号': 'Settlement ID',
    '归属工程师': 'Assigned Engineer',
    '关联工单': 'Linked Work Order',
    '完工时间': 'Completion Time',
    '结算状态': 'Settlement Status',
    '工单编号': 'Work Order ID',
    '工单类型': 'Work Order Type',
    '客户/地点': 'Customer / Location',
    '关联合同': 'Linked Contract',
    '催单状态': 'Reminder Status',
    '是否超时': 'Overdue',
    '当前任务 / 位置': 'Current Task / Location',
    '预计空闲': 'Estimated Available',
    '风险提示': 'Risk Tip'
  });

  Object.assign(EN_TERMS, {
    '租户健康排行': 'Tenant Health Ranking',
    '租户运营报告': 'Tenant Operations Report',
    '租户运营': 'Tenant Operations',
    '工作台总览': 'Workspace Overview',
    '报告编号': 'Report ID',
    '报告名称': 'Report Name',
    '高级设置': 'Advanced Settings',
    '页面配置': 'Page Configuration',
    '场景配置': 'Scenario Configuration',
    '目录配置': 'Catalog Configuration',
    '配置预算 / 熔断': 'Configure Budget / Circuit Breaker',
    '熔断阈值 & 预算配置': 'Circuit Breaker Threshold and Budget Configuration',
    '进入全量目录': 'Open Full Catalog',
    '进入容量预测': 'Open Capacity Forecast',
    '进入变更管理': 'Open Change Management',
    '进入完整配置页': 'Open Full Configuration',
    '查看全部': 'View All',
    '查看全部事项': 'View All Items',
    '查看服务请求': 'View Service Requests',
    '查看事件管理': 'View Incident Management',
    '查看影响评估': 'View Impact Assessment',
    '查看事件分析': 'View Incident Analysis',
    '查看分析': 'View Analysis',
    '查看影响面': 'View Impact Scope',
    '查看知识': 'View Knowledge',
    '查看容量详情': 'View Capacity Details',
    '查看预测曲线': 'View Forecast Curve',
    '查看临界对象': 'View Critical Objects',
    '查看本月账单': 'View Monthly Bill',
    '起草扩容工单': 'Draft Capacity Expansion Ticket',
    '起草扩容变更': 'Draft Capacity Expansion Change',
    '创建拨测': 'Create Synthetic Test',
    '创建模板': 'Create Template',
    '配置资产申请': 'Configure Asset Request',
    '优化审批 SLA': 'Optimize Approval SLA',
    '提交服务请求': 'Submit Service Request',
    '导出合规报告': 'Export Compliance Report',
    '导出合规审计报告': 'Export Compliance Audit Report',
    '添加': 'Add',
    '选择图片': 'Choose Image',
    '停用': 'Disable',
    '启用': 'Enable',
    '禁用': 'Disable',
    '发布': 'Publish',
    '归档': 'Archive',
    '批准': 'Approve',
    '放行': 'Approve',
    '驳回': 'Reject',
    '处理': 'Process',
    '处理审批': 'Process Approval',
    '进入': 'Open',
    '告警根因': 'Alert Root Cause',
    '根因定位': 'Root Cause Localization',
    '容量预警': 'Capacity Alert',
    '自动修复': 'Auto Remediation',
    '根因事件': 'Root Cause Incident',
    '查看容量预测、可用性趋势、风险对象与优化建议。': 'View capacity forecasts, availability trends, risk objects, and optimization recommendations.',
    'AI 容量预测助手': 'AI Capacity Forecast Assistant',
    '容量预测助手': 'Capacity Forecast Assistant',
    '趋势异常': 'Trend Exceptions',
    '需专家复核': 'Expert Review Required',
    '7 日内需处理': 'Requires Action Within 7 Days',
    '近 30 天': 'Last 30 Days',
    '扩容工单起草': 'Capacity Expansion Ticket Drafting',
    '扩容工单': 'Capacity Expansion Ticket',
    '趋势外推 / 耗尽预测 / 扩容工单起草': 'Trend extrapolation / exhaustion forecast / capacity expansion ticket drafting',
    '临界对象可 AI 起草扩容工单，带入建议动作、派单组、优先级和 SLA。': 'For critical objects, AI can draft capacity expansion tickets with recommended actions, assignment groups, priority, and SLA.',
    '建议本周': 'Recommend This Week',
    '建议立即': 'Recommend Immediate',
    '派单组': 'Assignment Group',
    '7 日内需 Process': 'Requires Action Within 7 Days',
    '历史 90 日': 'Last 90 Days',
    '4 周 Risk': '4-Week Risk',
    'DB-Master-02 磁盘增长由 10 GB/天加速至 12 GB/天，Exhaustion Forecast 从 21 天修正为 14 天。': 'DB-Master-02 disk growth accelerated from 10 GB/day to 12 GB/day, revising the exhaustion forecast from 21 days to 14 days.',
    'GBA-SZ-Core-SW01 汇聚上联利用率 6 周内将饱和，建议本周评估链路聚合扩容。': 'The aggregation uplink on GBA-SZ-Core-SW01 is expected to saturate within 6 weeks; evaluate link aggregation capacity expansion this week.',
    'GBA-SZ-Core-SW 01 汇聚上联 Utilization 6 周内将饱和，Recommend This Week 评估链路聚合 Capacity Expansion。': 'The aggregation uplink on GBA-SZ-Core-SW01 is expected to saturate within 6 weeks; evaluate link aggregation capacity expansion this week.',
    '耗尽预测': 'Exhaustion Forecast',
    '趋势外推': 'Trend Extrapolation',
    '链路饱和': 'Link Saturation',
    '扩容起草': 'Capacity Expansion Drafting',
    '历史 90 日': 'Last 90 Days',
    '4 周风险': '4-Week Risk',
    'L2 手工确认': 'L2 Drafting',
    '7 日风险': '7-Day Risk',
    '资源类型': 'Resource Type',
    '可转变更': 'Convertible to Change',
    '自动化建议': 'Automation Recommendations',
    'Top 3 容量线索': 'Top 3 Capacity Signals',
    '按预计耗尽时间、资源利用率和是否可转变更排序；更多对象进入容量预测页面。': 'Sorted by estimated exhaustion time, resource utilization, and change eligibility; more objects are available on the Capacity Forecast page.',
    '当前利用率': 'Current Utilization',
    '预计耗尽': 'Estimated Exhaustion',
    '扩容': 'Capacity Expansion',
    '归档历史日志': 'Archive Historical Logs',
    '保持观察': 'Keep Monitoring',
    '高风险': 'High Risk',
    '关注': 'Watch',
    '正常': 'Normal',
    '稳定': 'Stable',
    '存储': 'Storage',
    '数据库': 'Database',
    '计算': 'Compute',
    '专家复核': 'Expert Review',
    '链路风险': 'Link Risk',
    '切换建议': 'Failover Recommendation',
    '启用服务目录': 'Enabled Service Catalogs',
    '常用服务优先': 'Prioritize Frequent Services',
    '处理建议': 'Remediation Recommendation',
    '变更影响评估': 'Change Impact Assessment',
    'Top 4 服务延伸事项': 'Top 4 Service Extension Items',
    'Top 3 目录运营项': 'Top 3 Catalog Operations Items',
    '按是否能补齐服务能力和是否有明确配置入口排序；更多事项进入服务报告。': 'Sorted by service-capability completion and clear configuration entry; more items are available in Service Reports.',
    '按 SLA 风险、请求/事件压力和可配置动作排序；更多目录进入 ITSM 服务目录。': 'Sorted by SLA risk, request / incident pressure, and configurable actions; more catalog items are available in the ITSM Service Catalog.',
    '服务延伸事项': 'Service Extension Items',
    '目录运营项': 'Catalog Operations Items',
    '全部目录': 'All Catalogs',
    '本月使用': 'Used This Month',
    '可扩展': 'Extensible',
    '待处理': 'Pending',
    '请求量': 'Request Volume',
    '事件量': 'Incident Volume',
    '推荐动作': 'Recommended Action',
    '当前节点': 'Current Node',
    '提交人': 'Requester',
    '处理人': 'Assignee',
    '影响服务': 'Impacted Service',
    '关联告警': 'Related Alerts',
    '关联事件': 'Related Incidents',
    '根因进度': 'RCA Progress',
    '适用服务': 'Applicable Service',
    '命中': 'Hits',
    '剩余': 'Remaining',
    '审批中': 'In Approval',
    '处理中': 'In Progress',
    '已发布': 'Published',
    '待配置': 'To Configure',
    '待优化': 'To Optimize',
    '自动审批': 'Auto Approval',
    '知识': 'Knowledge',
    '租户名称': 'Tenant Name',
    '租户状态': 'Tenant Status',
    '租户类型': 'Tenant Type',
    '上级租户': 'Parent Tenant',
    '开通产品数量': 'Enabled Products',
    '开通时间': 'Enabled At',
    '产品名称': 'Product Name',
    '产品类别': 'Product Category',
    '域名': 'Domain',
    '版本': 'Version',
    '数据存储周期(天)': 'Data Retention Period (Days)',
    '最近更新时间': 'Last Updated At',
    '编辑租户信息': 'Edit Tenant Information',
    '正式': 'Active',
    '最终客户': 'End Customer',
    '高风险项目': 'High-Risk Projects',
    '交付风险': 'Delivery Risk',
    '验收风险': 'Acceptance Risk',
    '需要关注': 'Require Attention',
    '待审批': 'Pending Approval',
    '待审批快照': 'Pending Approval Snapshot',
    '快速操作': 'Quick Actions',
    '高频操作': 'Frequent Actions',
    '商业计费': 'Commercial Billing',
    '租户方案': 'Tenant Plan',
    '分模型下钻': 'Drill Down by Model',
    '接入配置': 'Integration Configuration',
    'Agent 库': 'Agent Library',
    '近 30 日': 'Last 30 Days',
    '审批 + 审计 + 人工推翻 + 账单全打包': 'Approval + Audit + Human Override + Billing Package',
    '本周调用': 'Calls This Week',
    '核心 KPI': 'Core KPI',
    '目标': 'Target',
    '成本': 'Cost',
    '档位': 'Tier',
    '场景': 'Scenario'
  });
  Object.assign(EN_TERMS, {
    'EMS NEO 场景': 'EMS NEO Scenario',
    '跨租户跟进请求、事件、问题、变更与知识。待办进工作台。': 'Track requests, incidents, problems, changes, and knowledge across tenants. Work items flow into the workspace.',
    '发布服务目录': 'Publish Service Catalog',
    '发起服务请求': 'Create Service Request',
    '新建事件': 'Create Incident',
    '目录发起请求': 'Catalog-Initiated Requests',
    '资产类请求占': 'Asset Requests Share',
    '目录关联事件': 'Catalog-Related Incidents',
    '门店联网事件最高': 'Store networking has the highest incident volume',
    '服务扩展机会': 'Service Extension Opportunities',
    '可转服务项或模板': 'Convertible to service items or templates',
    'AI 服务运营助手': 'AI Service Operations Assistant',
    '审计留痕': 'Audit Traceability',
    '根因与动作': 'Root Cause and Action',
    'SLA 跟踪': 'SLA Tracking',
    '升级与派工': 'Escalation and Dispatch',
    'CI 依赖风险': 'CI Dependency Risk',
    '白名单建议': 'Whitelist Recommendation',
    '派工至现场': 'Dispatch to Field',
    '常用服务目录': 'Frequent Service Catalog',
    'Top 3 常用服务目录': 'Top 3 Frequent Service Catalog Items',
    '门店联网与链路支持': 'Store Network and Link Support',
    '面向门店网络中断、链路降级、拨测失败和网络变更的统一入口。': 'A unified entry point for store network outages, link degradation, synthetic test failures, and network changes.',
    '终端与资产支持': 'Endpoint and Asset Support',
    '承接资产领用、终端故障、备件更换、资产回收和库存联动。': 'Handles asset checkout, endpoint faults, spare-parts replacement, asset recovery, and inventory coordination.',
    '账号权限与访问开通': 'Account Permission and Access Provisioning',
    '覆盖账号开通、权限变更、VPN 访问、离职回收和审批白名单。': 'Covers account provisioning, permission changes, VPN access, offboarding recovery, and approval whitelists.',
    '发起': 'Create',
    '进入处理': 'Open Work Item',
    '派工升级': 'Escalate to Dispatch',
    '申请资产': 'Request Asset',
    '更多服务可': 'More services can be',
    '检索。': 'searched.',
    '门店联网补拨测配置': 'Add Synthetic Monitoring for Store Networking',
    '资产支持补现场模板': 'Add Field Template for Asset Support',
    '账号权限补审批规则': 'Add Approval Rules for Account Permissions',
    '业务系统补知识条目': 'Add Knowledge Articles for Business Systems',
    '待建模板': 'Template Required',
    '待补充': 'To Be Added',
    '补充知识': 'Add Knowledge',
    '优化 SLA': 'Optimize SLA',
    '来源服务：门店联网': 'Source Service: Store Networking',
    '来源服务：终端与资产': 'Source Service: Endpoint and Asset',
    '来源服务：账号权限': 'Source Service: Account Permissions',
    '来源服务：业务系统': 'Source Service: Business Systems',
    '门店联网服务中已有多次链路波动处理记录，可补充标准拨测和告警转事件规则。': 'Store networking already has multiple link-flap handling records; standard synthetic tests and alert-to-incident rules can be added.',
    '终端更换和备件处理需要到场执行，可补充现场工单模板、技能要求和验收字段。': 'Endpoint replacement and spare-parts handling require on-site execution; field work order templates, skill requirements, and acceptance fields can be added.',
    '账号权限服务已有标准申请路径，可补充审批白名单、处理组和 SLA 升级规则。': 'Account permission services already have a standard request path; approval whitelists, assignment groups, and SLA escalation rules can be added.',
    '业务系统服务已有重复处理场景，可补充排查步骤、回退说明和服务台话术。': 'Business system services already have recurring handling scenarios; troubleshooting steps, rollback notes, and service desk scripts can be added.',
    '服务目录使用统计': 'Service Catalog Usage Statistics',
    '生成服务报告': 'Generate Service Report',
    '问题': 'Problems',
    '请求': 'Requests',
    '事件': 'Incidents',
    '建议': 'Recommendation',
    '页面导览': 'Page Guide',
    '事件 Remediation Recommendation / SLA Warning / Change Impact Assessment': 'Incident Recommendation / SLA Warning / Change Impact Assessment',
    'Web 服务器 CPU 过载已关联 CMDB 拓扑定位根因，建议优先重启 App-Server-03 应用进程。': 'The web server CPU overload has been correlated through CMDB topology to localize the root cause. Restart the App-Server-03 application process first.',
    '核心交换机延迟告警 SLA 仅剩 0h 28m，建议立即升级处理或派工至现场。': 'The core switch latency alert has only 0h 28m of SLA time remaining. Escalate immediately or dispatch to field service.',
    '核心交换机延迟 Alerts SLA 仅剩 0h 28m，Recommend ImmediateEscalationProcess 或 Dispatch to Field。': 'The core switch latency alert has only 0h 28m of SLA time remaining. Escalate immediately or dispatch to field service.',
    'CHG-20260813-001 影响 23 个 CI、覆盖 3 个业务系统，建议在 02:00-05:00 维护窗口执行。': 'CHG-20260813-001 impacts 23 CIs across 3 business systems. Execute it during the 02:00-05:00 maintenance window.',
    'CHG-20260813-001 影响 23 个 CI、覆盖 3 个业务系统，Recommendation 在 02:00-05:00 维护 Window 执行。': 'CHG-20260813-001 impacts 23 CIs across 3 business systems. Execute it during the 02:00-05:00 maintenance window.',
    'Override（附原因）': 'Override (With Reason)',
    '一键批准': 'Approve',
    '确认执行': 'Approve',
    '附原因': 'With Reason',
    '先看请求、事件、问题、变更和 SLA 风险的队列摘要。': 'Start with queue summaries for requests, incidents, problems, changes, and SLA risk.',
    '一线从待办进入处理，管理者从风险排行进入下钻。': 'Frontline users process work from the work queue; managers drill down from risk rankings.',
    '流程模板、SLA 和服务目录配置进入服务管理设置。': 'Process templates, SLA, and service catalog configuration are managed in Service Management settings.',
    '租户:': 'Tenant:',
    '来源服务：': 'Source Service:',
    '全部': 'All',
    '管理': 'Management',
    '资产': 'Assets',
    '现场': 'Field',
    '服务': 'Service',
    '一线运维': 'Frontline Operations',
    '执行档位': 'Execution Tier',
    '只回答不动手': 'answer-only, no action execution',
    '会话与 Token 消耗留痕于 T5b': 'sessions and token usage are logged in T5b',
    '根因': 'Root Cause',
    '动作': 'Action',
    '升级': 'Escalation',
    '派工': 'Dispatch',
    '库存联动': 'Inventory Coordination'
  });
  Object.assign(EN_TERMS, {
    '多租户统一运营 · 每租户 SLA / 工单 / 项目 / 资产 / 成本（对齐 07-msps-as-primary-customer §P4）': 'Unified multi-tenant operations · per-tenant SLA / tickets / projects / assets / cost (aligned with 07-msps-as-primary-customer §P4)',
    '在管租户': 'Tenants',
    '在管Tenant': 'Tenants',
    '在管 Tenant': 'Tenants',
    '在管项目': 'Projects',
    '本月活跃 96 · 风险 12 · 重点关注 4': 'Activity 96 · Risks 12 · Watchlist 4',
    '执行中 8 · 出海 2 · GDPR 1': 'In Progress 8 · Overseas 2 · GDPR 1',
    '本月工时': 'Hours This Month',
    '可计费 881h · 68.5%': 'Billable 881h · 68.5%',
    '跨 96 个活跃租户': 'Across 96 active tenants',
    '项目 SLA 达标率': 'Project SLA Compliance',
    '长期托管/运维类口径': 'Managed services / operations scope',
    '待办审批': 'Pending Approvals',
    '含 5 条超 3 天未处理': 'Includes 5 items pending for over 3 days',
    '跨租户贯通': 'Cross-Tenant Service Orchestration',
    '跨租户贯通：项目数据来自': 'Cross-Tenant Service Orchestration: project data from',
    '资产来自': 'assets from',
    '工单来自': 'tickets from',
    '客户视图见': 'customer view in',
    'Dashboard 客户视图 →': 'Dashboard Customer View ->',
    'AI 跨租户运营助手': 'AI Cross-Tenant Operations Assistant',
    'L3 · 多层审批': 'L3 · Multi-level Approval',
    '跨租户 SLA / 项目风险自动分析 ·': 'Automated cross-tenant SLA / project risk analysis ·',
    '审计留痕 →': 'Audit Trail ->',
    '[SLA 预警]': '[SLA Warning]',
    '美心MX 租户 SLA 96.5% 低于其他租户（均值 98%），近 30 天香港站点工单积压 5 单 → 建议加急处理': 'Maxim MX tenant SLA is 96.5%, below the tenant average of 98%; 5 tickets are backlogged at Hong Kong sites in the last 30 days -> expedite handling',
    '[项目风险汇总]': '[Project Risk Summary]',
    '高风险项目 2 个均属': 'Both high-risk projects belong to',
    '（PRJ-2026-001 割接延期 · PRJ-2026-003 属达美乐）→': '(PRJ-2026-001 cutover delayed · PRJ-2026-003 for Domino) ->',
    '查看详情': 'View Details',
    '[工时计费]': '[Time Billing]',
    '周大福计费率 78% 最高（含 GDPR 审计工时）· 美心MX 筹备期计费率 25% 属预期': 'CTF has the highest billable rate at 78% including GDPR audit hours · Maxim MX preparation-phase billable rate at 25% is expected',
    '租户组合运营视图': 'Tenant Portfolio Operations View',
    '面向多租户规模化管理，默认按风险优先展示，可下钻到租户上下文。': 'Built for scaled multi-tenant management. Defaults to risk-prioritized display with drill-down into tenant context.',
    '全量租户': 'Total Tenants',
    '风险租户': 'At-Risk Tenants',
    'SLA 风险工单': 'SLA-Risk Tickets',
    '来自 EMS NEO 租户范围，本页列表仅展示第 1 页样例，可通过分页或报告中心核对全量租户。': 'Sourced from EMS NEO tenant scope. This page shows only page 1 samples; use pagination or Report Center to validate the full tenant set.',
    '健康度低于 90 的租户计入风险租户；下方当前页显示其中 4 个，剩余租户通过分页或风险明细查看。': 'Tenants with a health score below 90 are counted as at-risk tenants. The current page shows 4 of them; view the rest through pagination or risk details.',
    '来自 ITSM 工单与 SLA 规则聚合，统计当前周期内触发 SLA 风险的未关闭工单。': 'Aggregated from ITSM tickets and SLA rules; counts open tickets that triggered SLA risk in the current period.',
    '来自 PMS 项目风险等级，统计延期、阻塞或验收风险为高的在途项目。': 'Sourced from PMS project risk levels; counts active projects with high delay, blocker, or acceptance risk.',
    '搜索租户 / 编码 / 区域': 'Search tenant / code / region',
    '全部状态': 'All Statuses',
    'SLA 风险': 'SLA Risk',
    '项目风险': 'Project Risk',
    '运维关注': 'Operations Watch',
    '稳定租户': 'Stable Tenants',
    '风险优先': 'Risk Priority',
    'SLA 由低到高': 'SLA Low to High',
    '工单由高到低': 'Tickets High to Low',
    '项目风险由高到低': 'Project Risk High to Low',
    'AI 用量由高到低': 'AI Usage High to Low',
    'SLA 96.5%，香港站点积压 5 单，AI 用量接近平台池配额。': 'SLA is 96.5%; 5 tickets are backlogged at Hong Kong sites; AI usage is nearing the platform pool quota.',
    'GDPR 审计项目延期，法兰克福节点容量 30 天内触顶。': 'GDPR audit project is delayed; Frankfurt node capacity is projected to hit the ceiling within 30 days.',
    '门店网络改造进入割接期，项目风险与现场派工需要联动。': 'Store network transformation is entering cutover; project risk and field dispatch need coordinated handling.',
    '配额': 'Quota',
    '积压': 'Backlog',
    '合规': 'Compliance',
    '交付': 'Delivery',
    '健康度 = SLA 35% + 工单积压 20% + 告警/容量 20% + 项目风险 15% + 资产/AI 配额 10%。数据来自 ITSM、MOP/ITOM、PMS、ITAM 与 AI 计费中心聚合。': 'Health score = SLA 35% + ticket backlog 20% + alerts / capacity 20% + project risk 15% + asset / AI quota 10%. Data is aggregated from ITSM, MOP/ITOM, PMS, ITAM, and AI Billing Center.',
    'AI 用量': 'AI Usage',
    '状态': 'Status',
    '项目关注': 'Project Watch',
    '割接风险': 'Cutover Risk',
    '合规关注': 'Compliance Watch',
    '告警偏高': 'Elevated Alerts',
    '交付关注': 'Delivery Watch',
    '46,800 次': '46,800 calls',
    '没有匹配的租户，请调整搜索或状态筛选。': 'No matching tenants. Adjust the search term or status filter.',
    '已显示': 'Showing',
    '当前页风险': 'Current Page Risk',
    '当前筛选': 'Current Filter',
    '第 1 / 16 页': 'Page 1 / 16',
    '上一页': 'Previous',
    '下一页': 'Next',
    '原型仅展示第一页样例；真实产品进入下一页继续查看': 'The prototype only shows page 1 samples; the production product continues on the next page.',
    '查看风险明细': 'View Risk Details',
    'global（MSP 共享域）': 'global (MSP Shared Domain)',
    '：': ':',
    '3 个内部项目（建站交付 · 东京带宽扩容': '3 internal projects (site delivery · Tokyo bandwidth expansion',
    '已验收）· 共享资产与备件仓由 MSP 统一管理 →': 'accepted) · shared assets and spare-parts warehouse are centrally managed by the MSP ->',
    '跨租户 SLA 分析': 'Cross-Tenant SLA Analysis',
    '各租户 SLA 对比': 'Compare tenant SLA',
    '对比各租户 SLA 达标情况并预警': 'Compare tenant SLA compliance and raise warnings',
    '租户项目汇总': 'Tenant Project Summary',
    '按租户项目进度': 'Project progress by tenant',
    '汇总各租户在管项目的进度与风险': 'Summarize tenant project progress and risk',
    '工时计费结构': 'Time Billing Structure',
    '租户计费对比': 'Tenant billing comparison',
    '分析各租户工时计费结构': 'Analyze tenant time billing structure',
    '客户健康度报告': 'Customer Health Report',
    '生成客户月报': 'Generate customer monthly report',
    '生成各租户运营健康度月报': 'Generate monthly tenant operations health reports',
    '已聚焦租户运营列表': 'Tenant operations list focused',
    '已显示全部租户（MSP 视角）': 'All tenants displayed (MSP perspective)',
    'Compliance 容量 Delivery': 'Compliance Capacity Delivery',
    'Project Field 网络': 'Project Field Network',
    'HKT 托管客户': 'HKT Managed Customer',
    '中国华南': 'South China',
    '华东金融': 'East China Finance',
    '香港': 'Hong Kong',
    '容量': 'Capacity',
    '网络': 'Network',
    'NEO Agent，支持自然语言查询、根因分析、': 'NEO Agent, supporting natural language query, root cause analysis, ',
    '变更评估等 AI 能力': 'change assessment, and other AI capabilities',
    'AI 能力': 'AI capabilities',
    '支持': 'supports',
    '等 AI 能力': 'and other AI capabilities',
    '审计 →': 'Audit ->',
    'CLI 命令': 'CLI Commands',
    '加载 Skills': 'Load Skills',
    'GovernanceTier 定义': 'Governance Tier Definition',
    'View NEO Agent Hub · GovernanceTier 定义': 'View NEO Agent Hub · Governance Tier Definition',
    '定义': 'Definition'
  });
  Object.assign(EN_TERMS, {
    '我的待办 · EMS NEO': 'My To-dos · EMS NEO · AI-Driven IT Operations Platform',
    'KPI 为全天累计统计口径 · 队列列表为当前未处理项（原型 mock 简化）': 'KPIs use daily cumulative metrics · queue lists show current open work items (prototype mock)',
    '选择左侧队列项查看详情': 'Select a queue item on the left to view details',
    '我的待办': 'My To-dos',
    '我的待办 · 排查': 'My To-dos · Investigation',
    '我的待办 · U-Frontline': 'My To-dos · U-Frontline',
    '项目经理工作台': 'Project Manager Workspace',
    '业务经理审批台': 'Business Manager Approval Desk',
    '排序': 'Sort',
    'AI 排序（推荐）': 'AI Ranking (Recommended)',
    '按时间': 'By Time',
    '按优先级': 'By Priority',
    '按类型': 'By Type',
    '租户：': 'Tenant: ',
    '全部租户（MSP 视角）': 'All Tenants (MSP Perspective)',
    'MSP 视角 · 全部租户': 'MSP Perspective · All Tenants',
    'MSP 视角 ·': 'MSP Perspective ·',
    '当前': 'Current',
    '条': 'items',
    '已按租户过滤：': 'Filtered by tenant: ',
    '已切回全部租户（MSP 视角）': 'Switched back to all tenants (MSP perspective)',
    '已选': 'Selected',
    '批量确认': 'Batch Acknowledge',
    '批量关闭': 'Batch Close',
    '批量转派': 'Batch Reassign',
    '单次最多 100 条（SN F-04 BR-03）': 'Up to 100 items per batch (SN F-04 BR-03)',
    '单次批量操作最多 100 条': 'A single batch operation supports up to 100 items',
    '新标签打开 ↗': 'Open in New Tab ↗',
    '在新标签打开完整详情页 →': 'Open Full Detail in New Tab ->',
    '告警': 'Alert',
    '升级工单': 'Escalated Ticket',
    '变更实施': 'Change Implementation',
    '排查': 'Investigate',
    '确认根因': 'Confirm Root Cause',
    '回填工单': 'Update Ticket',
    '接单': 'Accept',
    '拒绝': 'Reject',
    '实施变更': 'Implement Change',
    '影响面评估': 'Impact Assessment',
    '回填变更结果': 'Update Change Result',
    '加急': 'Expedite',
    '通知': 'Notify',
    '认领': 'Claim',
    '跳过': 'Skip',
    '查看项目': 'View Project',
    '待排查': 'Pending Investigation',
    '排查中': 'Investigating',
    '今日降噪率': 'Noise Reduction Rate Today',
    'AI 直接使用率': 'AI Direct Adoption Rate',
    'AI 根因直接使用率': 'AI RCA Direct Adoption Rate',
    '变更成功率': 'Change Success Rate',
    '项目待办': 'Project Work Items',
    '项目 SLA': 'Project SLA',
    '30 天到期合同': 'Contracts Expiring in 30 Days',
    '在管合同': 'Contracts',
    '年化合同额': 'Annualized Contract Value',
    '视图：U2 专业技术工程师（原型演示 · 生产由 RBAC 角色决定）': 'View: U2 Specialist Engineer (prototype demo · production is determined by RBAC roles)',
    '视图：U-Frontline 一线复合角色（SMB 档 · 01 §P7 降级模型 · 原型演示）': 'View: U-Frontline composite frontline role (SMB tier · 01 §P7 downgraded model · prototype demo)',
    '视图：PM 项目经理（2026-08-19 出海定位新增 · 原型演示）': 'View: PM Project Manager (added for overseas positioning on 2026-08-19 · prototype demo)',
    '视图：BM 业务经理（2026-08-19 出海定位新增 · 原型演示）': 'View: BM Business Manager (added for overseas positioning on 2026-08-19 · prototype demo)',
    '租户上下文': 'Tenant Context',
    '服务等级': 'Service Tier',
    '区域/数据范围': 'Region / Data Scope',
    '同一队列按租户过滤与汇总，无需切换登录租户': 'Use the same queue for tenant filtering and aggregation without switching the login tenant.',
    'CMDB 上下文': 'CMDB Context',
    '线路资产上下文（ITAM · 出海扩展）': 'Circuit Asset Context (ITAM · Overseas Extension)',
    'NPM 拨测诊断': 'NPM Synthetic Diagnosis',
    '出海扩展 · 跨境链路告警源': 'Overseas Extension · Cross-Border Link Alert Source',
    'SLA 状态': 'SLA Status',
    '现场信息': 'Field Information',
    '交接信息': 'Handover Information',
    '交接时间': 'Handover Time',
    'AI 交接摘要': 'AI Handover Summary',
    '英文交接单 · AI 起草 · 出海扩展（S24 跨时区值守）': 'English handover note · AI drafted · overseas extension (S24 cross-time-zone coverage)',
    '夜班观察项': 'Night-Shift Watch Items',
    '建议跟进事项': 'Recommended Follow-Up Items',
    '升级工单信息': 'Escalated Ticket Information',
    'AI 根因 Top3（完整版）': 'AI Root Cause Top 3 (Full)',
    'AI 建议操作（采纳后记录到 T5 审计）': 'AI Recommended Actions (adoption logged to T5 audit)',
    '项目事件': 'Project Event',
    'AI 项目建议': 'AI Project Recommendation',
    'T4 证据链': 'T4 Evidence Chain',
    '变更信息': 'Change Information',
    'AI 风险评估（CMDB 影响面引擎）': 'AI Risk Assessment (CMDB Impact Engine)',
    '实施步骤': 'Implementation Steps',
    '历史变更': 'Change History',
    '预警信息': 'Warning Information',
    'SLA 倒计时': 'SLA Countdown',
    '当前进度': 'Current Progress',
    '审批信息': 'Approval Information',
    '审批编号': 'Approval ID',
    '审批类型': 'Approval Type',
    '提交时间': 'Submitted At',
    'AI 起草内容（放行后自动创建工单）': 'AI Draft Content (ticket is created automatically after approval)',
    'AI 风险评估': 'AI Risk Assessment',
    '派工信息': 'Dispatch Information',
    '派工单号': 'Dispatch ID',
    '工单类型': 'Ticket Type',
    '计划时间': 'Planned Time',
    'SLA 截止': 'SLA Deadline',
    '外勤态势': 'Field Dispatch Posture',
    '查看全部外勤派工 →': 'View All Field Dispatch ->',
    '任务目标与现场检查项': 'Task Objective and Field Checklist',
    '现场位置': 'Site Location',
    '现场联系人': 'Site Contact',
    '所需工具/备件': 'Required Tools / Spare Parts',
    'AI 派工推荐': 'AI Dispatch Recommendation',
    '工单编号': 'Ticket ID',
    'SLA 等级': 'SLA Tier',
    '当前处理人': 'Current Assignee',
    '最后更新': 'Last Updated',
    '响应时限': 'Response Target',
    '解决时限': 'Resolution Target',
    'AI 预测': 'AI Prediction',
    '班次': 'Shift',
    '移交人': 'Handover From',
    '位置': 'Location',
    'CI 类型': 'CI Type',
    '所属业务': 'Business Service',
    '环境': 'Environment',
    '机房': 'Data Center',
    '最近变更': 'Recent Change',
    '历史相似案例': 'Similar Historical Cases',
    '事件编号': 'Event ID',
    '所属项目': 'Project',
    '站点': 'Site',
    '变更单号': 'Change ID',
    '变更类型': 'Change Type',
    '窗口时间': 'Change Window',
    '申请人': 'Applicant',
    '关联工单': 'Related Ticket',
    '风险等级：': 'Risk Level: ',
    '风险说明': 'Risk Description',
    '影响面': 'Impact Scope',
    '缓解措施': 'Mitigation',
    '解决目标': 'resolution target',
    '已耗时': 'Elapsed',
    '剩余': 'Remaining',
    '关联 CI': 'Related CI',
    '归属服务': 'Service',
    '关联告警': 'Related Alerts',
    '提交人': 'Submitter',
    '分类': 'Category',
    '升级人': 'Escalated By',
    '升级理由': 'Escalation Reason',
    '工单标题': 'Ticket Title',
    '分配团队': 'Assignment Team',
    '工单描述': 'Ticket Description',
    '建议操作': 'Recommended Actions',
    '相似历史案例': 'Similar Historical Case',
    '刚刚': 'Just Now',
    '分钟前': 'min ago',
    '小时前': 'h ago',
    '昨天': 'Yesterday',
    '总部': 'Headquarters',
    '上海': 'Shanghai',
    '深圳': 'Shenzhen',
    '新加坡': 'Singapore',
    '法兰克福': 'Frankfurt',
    '门店网络': 'Store Network',
    '新加坡 / 上海 / 法兰克福': 'Singapore / Shanghai / Frankfurt',
    '深圳 / 门店网络': 'Shenzhen / Store Network',
    '跨境': 'Cross-Border',
    '生产环境': 'Production',
    '办公网': 'Office Network',
    '服务器': 'Server',
    '数据库服务器': 'Database Server',
    '跨境专线': 'Cross-Border Dedicated Line',
    '无线 AP': 'Wireless AP',
    '监控采集': 'Monitoring Collection',
    '核心业务服务': 'Core Business Service',
    'ERP 系统': 'ERP System',
    '跨境链路': 'Cross-Border Link',
    '办公网络': 'Office Network',
    'VPN 网关': 'VPN Gateway',
    '安全运维 → 证书管理': 'Security Operations -> Certificate Management',
    '性能优化': 'Performance Optimization',
    '容量管理 → 存储': 'Capacity Management -> Storage',
    '已转单': 'Ticket Created',
    '已确认': 'Acknowledged',
    '已关闭': 'Closed',
    '已确认执行': 'Confirmed and Executed',
    '已解决': 'Resolved',
    '待确认': 'Pending Confirmation',
    '待接单': 'Pending Acceptance',
    '待认领': 'Pending Claim',
    '活跃': 'Active',
    '高': 'High'
  });
  Object.assign(EN_TERMS, {
    '交接': 'Handover',
    '取消收藏': 'Remove from Favorites',
    '告警信息': 'Alert Information',
    '级别': 'Severity',
    '监控指标': 'Metric',
    '阈值规则': 'Threshold Rule',
    '当前值': 'Current Value',
    '设备名称': 'Device Name',
    '设备 IP': 'Device IP',
    '首次触发': 'First Triggered',
    '触发次数': 'Trigger Count',
    '指标趋势（最近 6 小时）': 'Metric Trend (Last 6 Hours)',
    'L1 摘要': 'L1 Summary',
    'AI 建议（摘要）': 'AI Recommendation (Summary)',
    'T4 证据': 'T4 Evidence',
    '完整根因分析（Top3 + 证据链）见告警详情页 / U2 排查队列 ·': 'Full RCA (Top 3 + evidence chain) is available in Alert Details / U2 Investigation Queue ·',
    '深入排查 →': 'Deep Investigation ->',
    '操作集（原型演示）': 'Action Set (Prototype Demo)',
    '持续 5 分钟': 'for 5 minutes',
    '12 次': '12 times',
    '已完成': 'Completed',
    'Web 服务器 Web-Server-01 CPU 利用率 95%': 'Web Server Web-Server-01 CPU Utilization at 95%',
    'Top1 根因：Java 应用（PID 23456）内存泄漏导致频繁 GC（87%）': 'Top 1 Root Cause: Java application (PID 23456) memory leak causing frequent GC (87%)',
    '跨境链路 GBA-SZ ↔ GBA-GZ MPLS 丢包 2.4%（连续 6 小时）': 'Cross-Border Link GBA-SZ ↔ GBA-GZ MPLS Packet Loss at 2.4% (6 Consecutive Hours)',
    '运营商维护窗口（02:00-06:00）已结束仍未恢复 · 建议升级 P2 并联动线路资产处置': 'Carrier maintenance window (02:00-06:00) has ended but service has not recovered · escalate to P2 and coordinate circuit asset handling',
    '数据库服务器 DB-Master-02 连接数超限 (2048/2000)': 'Database Server DB-Master-02 Connection Count Exceeded (2048/2000)',
    '关联告警：Web-App-01/02 同时响应延迟': 'Related Alert: Web-App-01/02 response latency at the same time',
    '办公楼 3F AP-307 离线': 'Office Building 3F AP-307 Offline',
    '影响终端 12 台 · 建议派工现场检查': '12 endpoints impacted · dispatch field inspection',
    'VPN 证书续期 — 2 天后过期': 'VPN Certificate Renewal - Expires in 2 Days',
    '建议立即安排证书更新，影响全公司远程接入': 'Schedule certificate renewal immediately; impacts company-wide remote access',
    '[转单放行] AI 起草工单 INC-20260813-003 · Web-Server-01 CPU 异常处置': '[Ticket Approval] AI-Drafted Ticket INC-20260813-003 · Web-Server-01 CPU Exception Handling',
    'AI 起草完毕 · 待手工确认': 'AI draft completed · pending manual confirmation',
    '[容量放行] AI 起草扩容工单 · DB-Master-02 存储 87%（预测 3 天耗尽）': '[Capacity Approval] AI-Drafted Capacity Expansion Ticket · DB-Master-02 Storage at 87% (3-Day Exhaustion Forecast)',
    'AI 起草完毕 · 待手工确认（L04 容量→扩容）': 'AI draft completed · pending manual confirmation (L04 capacity -> expansion)',
    '[待接] 3F AP-307 现场检查': '[Pending Acceptance] 3F AP-307 Field Inspection',
    '预估耗时 30 分钟 · 需带备用 AP': 'Estimated duration 30 minutes · bring a spare AP',
    '[SLA 预警] INC-20260811-018 即将 breach（剩余 2h）': '[SLA Warning] INC-20260811-018 Approaching Breach (2h Remaining)',
    '建议加急处理或升级': 'Expedite handling or escalate',
    '[交接] 夜班遗留 · Collector-SZ-02 数据延迟': '[Handover] Night-Shift Carryover · Collector-SZ-02 Data Latency',
    '夜班未处理 · 非紧急 · 持续观察': 'Not processed by night shift · non-urgent · continue monitoring',
    '[交接] 法兰克福夜班 → 总部白班 · DE01 遗留 2 项（AI 起草 · 中英双语）': '[Handover] Frankfurt Night Shift -> HQ Day Shift · 2 DE01 Carryover Items (AI Drafted · Bilingual)',
    '跨时区交接 · AI 已起草英文交接单 · 总部兜底': 'Cross-time-zone handover · AI drafted English handover note · HQ backup coverage',
    '10.162.9.67 内存利用率 78%': '10.162.9.67 Memory Utilization at 78%',
    '备份任务 BK-Daily-ERP 执行超时': 'Backup Job BK-Daily-ERP Execution Timeout',
    '历史频率：月均 2 次 · 通常自行恢复': 'Historical frequency: twice per month on average · usually self-recovers',
    'Collector-SZ-02 数据延迟 > 30s': 'Collector-SZ-02 Data Latency > 30s',
    '[工时审批] 孙磊 · 法兰克福巡检复核 · 6h（可计费）': '[Timesheet Approval] Sun Lei · Frankfurt Inspection Review · 6h (Billable)',
    '工时与派工记录一致 · 计费率 92%（该项目本月最高）': 'Timesheet matches dispatch records · billable rate 92% (highest for this project this month)',
    '[报告审批] 新加坡搬迁运维月报（7 月）· AI 起草': '[Report Approval] Singapore Relocation Operations Monthly Report (July) · AI Drafted',
    '报告已按模板完成 · 待 PM 审批后交付客户': 'Report completed using template · pending PM approval before customer delivery',
    '[里程碑] M4 应用迁移计划 09-05 · 已延期需确认': '[Milestone] M4 Application Migration Plan 09-05 · Delayed and Requires Confirmation',
    'M4 连续 2 次推迟，预计整体延期 4 天 → 建议压缩验证排期': 'M4 has slipped twice; overall delay is estimated at 4 days -> compress validation schedule',
    'Web 集群 Nginx 配置变更': 'Web Cluster Nginx Configuration Change',
    'Java 应用': 'Java application',
    '内存泄漏导致频繁 GC': 'memory leak causing frequent GC',
    'Web 服务器': 'Web Server',
    '利用率': 'Utilization',
    '连接数超限': 'Connection Count Exceeded',
    '丢包': 'Packet Loss',
    '连续 6 小时': '6 Consecutive Hours',
    '离线': 'Offline',
    '证书续期': 'Certificate Renewal',
    '数据延迟': 'Data Latency',
    '执行超时': 'Execution Timeout',
    '法兰克福托管运维': 'Frankfurt Managed Operations',
    '新加坡数据中心搬迁': 'Singapore Data Center Relocation',
    'PMS 工时': 'PMS Timesheet',
    'PMS 报告': 'PMS Report',
    'PMS 里程碑': 'PMS Milestone',
    '边界安全': 'Perimeter Security',
    '出海站点': 'Overseas Site',
    '中英双语': 'Bilingual',
    '总部白班': 'HQ Day Shift',
    '夜班': 'Night Shift',
    '遗留': 'Carryover',
    '非紧急': 'Non-Urgent',
    '持续观察': 'Continue Monitoring'
    ,
    '全局概览 各模块健康状态一览': 'Global Overview Module Health Overview',
    '事件复盘': 'Incident Review',
    '事件复盘 AI 起草复盘报告（时间线+关键动作）': 'Incident Review AI-Drafted Review Report (timeline + key actions)',
    'AI 起草复盘报告（时间线+关键动作）': 'AI-Drafted Review Report (timeline + key actions)',
    '复盘报告': 'Review Report',
    '复盘': 'Review',
    '时间线': 'Timeline',
    '关键动作': 'Key Actions',
    'M3 转单': 'M3 Ticket Conversion',
    'L04 容量预警': 'L04 Capacity Warning',
    'T4 Evidence': 'T4 Evidence',
    'T 4 Evidence': 'T4 Evidence'
    ,
    '夜班（08-12 22:00 ~ 08-13 08:00）': 'Night Shift (08-12 22:00 ~ 08-13 08:00)',
    '王强（U1 夜班值班）': 'Wang Qiang (U1 Night-Shift Duty)',
    '夜班 23:40 发现 Collector-SZ-02 数据上报延迟 > 30s（正常 < 5s）。夜班判断：非紧急（仅影响深圳 DC 5 台设备的数据时效性，不影响告警触发），建议早班持续观察，如延迟超过 60s 再介入。': 'At 23:40, the night shift found Collector-SZ-02 data reporting latency > 30s (normal < 5s). Night-shift assessment: non-urgent, impacting only data freshness for 5 network devices in Shenzhen DC and not alert triggering. Recommend day shift continue monitoring and intervene if latency exceeds 60s.',
    '影响：深圳 DC 5 台网络设备的性能数据延迟': 'Impact: performance data latency for 5 network devices in Shenzhen DC',
    '原因推测：Collector 所在 VM 可能资源不足': 'Probable cause: insufficient resources on the Collector VM',
    '夜班操作：无（标记为观察项移交早班）': 'Night-shift action: none (marked as a watch item and handed over to day shift)',
    '延迟 > 60s 时立即介入': 'Intervene immediately if latency exceeds 60s',
    '检查 Collector VM CPU / 内存资源': 'Check Collector VM CPU / memory resources',
    '如持续恶化升级给 U2': 'Escalate to U2 if deterioration continues',
    '数据上报延迟': 'data reporting latency',
    '正常': 'normal',
    '早班': 'day shift',
    '介入': 'intervene',
    '原因推测': 'Probable Cause',
    '夜班操作': 'Night-Shift Action',
    '资源不足': 'insufficient resources'
  });
  Object.assign(EN_TERMS, {
    '激活': 'Activate',
    '生效': 'Effective',
    '有效': 'Valid',
    '已删除': 'Deleted',
    '基本信息': 'Basic Information',
    '通过': 'Approved',
    '否': 'No',
    '是': 'Yes',
    '低': 'Low',
    '中': 'Medium',
    '成功': 'Success',
    '所有条件必须满足（AND）': 'All conditions must be met (AND)',
    '已付款': 'Paid',
    '首页': 'Home',
    '在岗': 'On Duty',
    '已启用': 'Enabled',
    '未选择任何选项': 'No options selected',
    '已通过': 'Approved',
    '在用': 'In Use',
    '紧急': 'Critical',
    '在库': 'In Stock',
    '未上传': 'Not Uploaded',
    '调度员': 'Dispatcher',
    '字段': 'Field',
    '回写': 'Writeback',
    '解决': 'Resolve',
    '添加过滤条件': 'Add Filter Condition',
    '所属仓库': 'Warehouse',
    '已归档': 'Archived',
    '已停用': 'Disabled',
    '待结算': 'Pending Settlement',
    '响应': 'Response',
    '监控软件产品': 'Monitoring Software Product',
    '内部员工': 'Internal Employee',
    '时间': 'Time',
    '‹ 后退': '< Back',
    '操作人': 'Operator',
    '邮箱': 'Email',
    '草稿': 'Draft',
    '编码': 'Code',
    '开始输入以搜索记录': 'Start typing to search records',
    '规则名称': 'Rule Name',
    '工单追踪': 'Ticket Tracking',
    '已回收': 'Recovered',
    '已达成': 'Achieved',
    '等价': 'Equivalent',
    '运营管理员': 'Operations Administrator',
    '相对天数': 'Relative Days',
    'P2-高': 'P2-High',
    'P3-中': 'P3-Medium',
    'P1-紧急': 'P1-Critical',
    '未达成': 'Not Achieved',
    '供应商': 'Supplier',
    '成员': 'Members',
    '运行状态': 'Runtime Status',
    '原型说明': 'Prototype Notes',
    '+ 添加': '+ Add',
    '待审核': 'Pending Review',
    '已上传': 'Uploaded',
    '完成': 'Complete',
    '催单': 'Remind',
    '初验': 'Initial Acceptance',
    '终验': 'Final Acceptance',
    '收益': 'Benefits',
    '项': 'items',
    '资产类别': 'Asset Category',
    '资产编号': 'Asset ID',
    '已过期': 'Expired',
    '姓名': 'Name',
    '每页 14 ▾': '14 / page ▾',
    '每页 20 ▾': '20 / page ▾',
    '10 条/页': '10 / page',
    '20 条/页': '20 / page',
    '50 条/页': '50 / page',
    '自定义页面': 'Custom Page',
    '确认删除': 'Confirm Delete',
    '已暂停': 'Paused',
    '收尾中': 'Closing',
    '管理员': 'Administrator',
    '托管': 'Managed',
    '导出 CSV': 'Export CSV',
    '报告预览入口': 'Report Preview Entry',
    '进入 →': 'Open ->',
    '框架合同': 'Framework Contract',
    '合同名称': 'Contract Name',
    '待派单': 'Pending Dispatch',
    '提示': 'Tip',
    '标题': 'Title',
    '第 2 层 · 关联工单': 'Layer 2 · Related Tickets',
    '第 2 层 · 交付物': 'Layer 2 · Deliverables',
    '第 1 层 · 任务': 'Layer 1 · Tasks',
    '字段为推导': 'Derived Field',
    '网络运维组': 'Network Operations Group',
    '资产型号': 'Asset Model',
    '当前状态': 'Current Status',
    '历史版本': 'Version History',
    '保存草稿': 'Save Draft',
    '交付报告': 'Delivery Report',
    '进度图': 'Progress Chart',
    '待开始': 'Not Started',
    '周期性': 'Recurring',
    '每天': 'Daily',
    '中班': 'Middle Shift',
    '晚班': 'Night Shift',
    '失败': 'Failed',
    '状态 (status)': 'Status (status)',
    '运维软件产品': 'Operations Software Product',
    '验收单照片': 'Acceptance Form Photo',
    '序列号照片': 'Serial Number Photo',
    '维保合同': 'Maintenance Contract',
    '客户名称': 'Customer Name',
    '申请单号': 'Request ID',
    '网络服务': 'Network Service',
    '确认入库': 'Confirm Inbound',
    '关联资产': 'Related Assets',
    '入驻申请': 'Onboarding Application',
    '备件仓': 'Spare Parts Warehouse',
    '待提交': 'Pending Submission',
    '筹备中': 'Preparing',
    '未配置': 'Not Configured',
    '管理层': 'Management',
    '下一步': 'Next',
    '一次性': 'One-Time',
    '错误': 'Error',
    '单位': 'Unit',
    '全量': 'Full',
    '出发': 'Depart',
    '采购': 'Procurement',
    '模块': 'Module',
    '移除': 'Remove',
    '无': 'None',
    '现场作业照片': 'Field Work Photos',
    '涉及旧件回收': 'Includes Old-Part Recovery',
    '今日无排班': 'No Schedule Today',
    '技能标签': 'Skill Tags',
    '耗材名称': 'Consumable Name',
    '手动触发': 'Manual Trigger',
    '交付一部': 'Delivery Team 1',
    '交付二部': 'Delivery Team 2',
    '业务服务': 'Business Service',
    '现场支持': 'Field Support',
    '识别规则': 'Identification Rule',
    '网点名称': 'Service Site Name',
    '运维月报': 'Operations Monthly Report',
    '序列号': 'Serial Number',
    '未开始': 'Not Started',
    '无停留': 'No Dwell',
    '已催单': 'Reminded',
    '工单号': 'Ticket No.',
    '双向': 'Bidirectional',
    '手动': 'Manual',
    '每周': 'Weekly',
    '值': 'Value',
    '未找到符合条件的数据': 'No matching data found',
    '已闭环 · 无停留': 'Closed · No Dwell',
    '【对接的 API】': '[Connected API]',
    '关联工单闭环': 'Related Ticket Closure',
    '销售合同名称': 'Sales Contract Name',
    '销售合同编号': 'Sales Contract No.',
    '数据中心搬迁': 'Data Center Relocation',
    '工作内容：': 'Work Content:',
    '任务目标：': 'Task Objective:',
    '里程碑完成': 'Milestone Complete',
    '创建时间：': 'Created At:',
    '交付物齐全': 'Deliverables Complete',
    '边界多边形': 'Boundary Polygon',
    '交付物未齐': 'Deliverables Incomplete',
    '关联合同': 'Related Contract',
    '此处只读，编辑请到 ITSM 产品': 'Read-only here. Edit in the ITSM product.',
    '此处只读，编辑请到 FSM 产品': 'Read-only here. Edit in the FSM product.',
    '此处只读，编辑请到 ITAM 产品': 'Read-only here. Edit in the ITAM product.',
    '资产分析看板': 'Asset Analytics Dashboard',
    '第 1 / 1 页': 'Page 1 / 1',
    '状态: 全部': 'Status: All',
    '回写通道 ITSM → PMS': 'Writeback Channel ITSM -> PMS',
    '报告预览': 'Report Preview',
    '报告模板': 'Report Template',
    '产品实例': 'Product Instances',
    'License 总量': 'Total Licenses',
    'License数量': 'License Quantity',
    '剩余License': 'Remaining Licenses',
    '有效期至': 'Valid Until',
    '选择显示列': 'Select Columns',
    '活跃授权': 'Active Licenses',
    '用量紧张': 'Usage Pressure',
    '更新License': 'Update License',
    '历史': 'History',
    '功能模块 LICENSE 明细': 'Feature Module License Details',
    '功能模块': 'Feature Module',
    '授权/状态': 'License / Status',
    '已用/剩余': 'Used / Remaining',
    '已开通': 'Enabled',
    '未开通': 'Not Enabled',
    '开关': 'Toggle',
    '数量': 'Quantity',
    '有效期': 'Validity Period',
    '仅 SaaS 版本可订阅': 'Available for SaaS versions only',
    '确认提交': 'Confirm Submit',
    '请先上传 CSV 授权文件': 'Upload the CSV license file first',
    '提交成功（原型演示）': 'Submitted successfully (prototype demo)',
    '格式错误': 'Format Error',
    '仅支持 .csv 格式，请重新选择': 'Only .csv files are supported. Select again.',
    '点击可重新选择': 'Click to reselect',
    '产品线：': 'Product Line:',
    'License版本：': 'License Version:',
    '发行区域：': 'Release Region:',
    'SKU前缀：': 'SKU Prefix:',
    '国内（CNY）': 'China (CNY)',
    '海外（USD）': 'Overseas (USD)',
    '数量:': 'Quantity:',
    '有效期:': 'Validity:',
    '确认删除？': 'Confirm Delete?',
    '删除后该产品的所有授权数据将被永久清除，此操作不可恢复。': 'All license data for this product will be permanently deleted. This action cannot be undone.',
    '确认停用？': 'Confirm Disable?',
    '停用后该产品的所有功能将不可用，租户下的用户将无法访问相关服务。': 'After disabling, all features of this product become unavailable and tenant users cannot access related services.',
    '未找到匹配租户': 'No matching tenants found',
    '联动位裁剪预览': 'Linkage Slot Trimming Preview',
    '当前授权组合：': 'Current License Bundle:',
    '联动位': 'Linkage Slot',
    '依赖产品': 'Dependent Product',
    '未授权处理': 'Unauthorized Handling',
    '当前状态': 'Current Status',
    '生效中': 'Active',
    '已裁剪': 'Trimmed',
    '隐藏': 'Hide',
    '降级': 'Degrade',
    '引导': 'Guide',
    '未授权域不显示': 'Unauthorized domains are hidden',
    '必装底座 · 不裁剪': 'Required foundation · not trimmed'
  });

  Object.assign(EN_TERMS, {
    '方案概览': 'Solution Overview',
    '双引擎与能力来源': 'Dual Engines and Capability Sources',
    '联动链路': 'Orchestration Flows',
    '三条联动链说明': 'Three Orchestration Flow Descriptions',
    '说明告警处置/变更影响/资产合同三条联动链': 'Explain the alert handling, change impact, and asset contract orchestration flows',
    '概述 EMS NEO 的 UMP、MOP 双引擎与标准产品能力来源': 'Summarize EMS NEO UMP / MOP dual engines and standard product capability sources',
    '走通路径': 'End-to-End Path',
    '从立项到结算': 'From Initiation to Settlement',
    '给出从项目立项到交付结算的端到端走通路径': 'Provide the end-to-end path from project initiation to delivery settlement',
    '联动全景': 'Orchestration Map',
    '五域谁写谁读': 'Who Writes and Reads Across Five Domains',
    '联动链': 'Orchestration Flows',
    '三条核心链路': 'Three Core Flows',
    '数据底座': 'Data Foundation',
    'CMDB 底座作用': 'CMDB Foundation Role',
    '说明 CMDB 数据底座在联动中的作用': 'Explain the CMDB data foundation role in orchestration',
    '说明告警/变更/资产三条联动链的步骤': 'Explain the steps in the alert, change, and asset orchestration flows',
    '概述五域的数据流向': 'Summarize data flows across five domains',
    '生命周期': 'Lifecycle',
    '7 个阶段概览': 'Seven-Stage Overview',
    '概述项目全生命周期的 7 个阶段': 'Summarize the seven stages of the project lifecycle',
    '联动点': 'Orchestration Points',
    '各阶段如何联动': 'How Stages Are Orchestrated',
    '说明各阶段五域是如何联动的': 'Explain how the five domains are orchestrated at each stage',
    '端到端价值': 'End-to-End Value',
    '总结项目全生命周期的闭环价值': 'Summarize the closed-loop value of the project lifecycle',
    '一句话定位': 'One-Line Positioning',
    '完整能力清单': 'Full Capability List',
    '在联动中的角色': 'Role in Orchestration',
    '上游 · 谁喂给我': 'Upstream · Who Feeds Me',
    '下游 · 我喂给谁': 'Downstream · Who I Feed',
    '深入核心功能': 'Explore Core Capabilities',
    '上下游数据流': 'Upstream / Downstream Data Flow',
    '域定位 →': 'Domain Positioning ->',
    '本域职责': 'Domain Responsibilities',
    '联动角色': 'Orchestration Role',
    '能力清单': 'Capability List',
    '能力': 'Capability',
    '定位': 'Positioning',
    '一句话定位 ITOM 监控域': 'One-line positioning for the ITOM monitoring domain',
    '一句话定位 ITSM 服务域': 'One-line positioning for the ITSM service domain',
    '一句话定位 FSM 现场服务域': 'One-line positioning for the FSM field service domain',
    '一句话定位 ITAM 资产管理域': 'One-line positioning for the ITAM asset management domain',
    '一句话定位 PMS 项目管理域': 'One-line positioning for the PMS project management domain',
    '列出 ITOM 监控域的能力清单': 'List capabilities of the ITOM monitoring domain',
    '列出 ITSM 服务域的能力清单': 'List capabilities of the ITSM service domain',
    '列出 FSM 现场服务域的能力清单': 'List capabilities of the FSM field service domain',
    '列出 ITAM 资产管理域的能力清单': 'List capabilities of the ITAM asset management domain',
    '列出 PMS 项目管理域的能力清单': 'List capabilities of the PMS project management domain',
    '说明 ITOM 在五域联动中的角色': 'Explain ITOM role in five-domain orchestration',
    '说明 ITSM 在五域联动中的角色': 'Explain ITSM role in five-domain orchestration',
    '说明 FSM 在五域联动中的角色': 'Explain FSM role in five-domain orchestration',
    '说明 ITAM 在五域联动中的角色': 'Explain ITAM role in five-domain orchestration',
    '说明 PMS 在五域联动中的角色': 'Explain PMS role in five-domain orchestration',
    'ITOM 监控': 'ITOM Monitoring',
    'ITSM 服务': 'ITSM Services',
    'FSM 现场': 'FSM Field Service',
    'ITAM 资产': 'ITAM Assets',
    'ITAM 回写': 'ITAM Writeback',
    'PMS 项目': 'PMS Projects',
    'UMP 统一纳管': 'UMP Unified Management',
    'MOP 监控运维': 'MOP Monitoring Operations',
    'ITOM 告警': 'ITOM Alerts',
    'ITSM 触发变更': 'ITSM-Triggered Change',
    'FSM 派工': 'FSM Dispatch',
    'CMDB 回写': 'CMDB Writeback',
    '项目立项管控': 'Project Initiation Governance',
    '项目执行管控': 'Project Execution Governance',
    '协同联动中心': 'Collaborative Orchestration Hub',
    '审批卡点': 'Approval Control Point',
    '拓扑视图': 'Topology View',
    '看板报表与审计': 'Dashboards, Reports, and Audit',
    '三条核心联动链': 'Three Core Orchestration Flows',
    '联动全景图': 'Orchestration Map',
    '联动点：': 'Orchestration Point:',
    '闭环成果': 'Closed-Loop Outcomes',
    '告警处置链 · 反应性闭环': 'Alert Handling Flow · Reactive Closure',
    '变更影响链 · 计划性合规': 'Change Impact Flow · Planned Compliance',
    '资产合同链 · 主数据联动': 'Asset Contract Flow · Master Data Orchestration',
    '自动发现（强写入 · 最大来源）': 'Auto Discovery (strong write · largest source)',
    '变更影响面评估（强读取）': 'Change impact assessment (strong read)',
    '工单闭环（弱写入 · 数据链路终点）': 'Ticket closure (weak write · data flow endpoint)',
    '全五域': 'All Five Domains',
    '项目全生命周期': 'Project Lifecycle',
    '域间数据流（谁写 · 谁读）': 'Inter-Domain Data Flow (Who Writes · Who Reads)',
    '每条链均可进入产品逐环节走通': 'Each flow can be walked through step by step in the product',
    'CMDB 数据质量是 AI 的天花板：': 'CMDB data quality is the ceiling for AI:',
    'EMS NEO 标准产品解决方案 · UMP 统一纳管 + MOP 监控运维 · 标准产品能力支撑': 'EMS NEO Standard Product Solution · UMP Unified Management + MOP Monitoring Operations · Powered by Standard Product Capabilities',
    '标准产品能力仍由 ITSM / FSM / ITAM / PMS / CMDB / ITOM / NPM 支撑，用户日常入口按业务场景组织。': 'Standard product capabilities are still provided by ITSM / FSM / ITAM / PMS / CMDB / ITOM / NPM, while daily user entry points are organized by business scenarios.',
    '面向 MSP 多客户租户运营和 ENT 企业租户运营，聚合 ITAM / ITSM / FSM / PMS 的高频能力，提供统一运营入口。': 'For MSP multi-customer tenant operations and ENT enterprise tenant operations, this aggregates high-frequency ITAM / ITSM / FSM / PMS capabilities into a unified operations entry point.',
    '面向企业 IT 底座的可见性和稳定性，聚合 ITOM / NPM / CMDB 的高频能力，并与 ITSM 事件处置闭环联动。': 'For enterprise IT foundation visibility and stability, this aggregates high-frequency ITOM / NPM / CMDB capabilities and links them with ITSM incident handling closure.',
    '核心差异：一个平台打通运维闭环 — 谁写数据、谁读数据、如何端到端串联': 'Core difference: one platform connects the operations loop: who writes data, who reads data, and how it is orchestrated end to end',
    'PMS 协同中枢 —— 承接 ITSM 工单升级 · 任务派发 FSM 现场 · 关闭回写 ITAM/CMDB，串联项目全生命周期': 'PMS Collaborative Hub: consumes ITSM ticket escalations, dispatches tasks to FSM field service, writes closure data back to ITAM / CMDB, and connects the full project lifecycle',
    'CMDB 准确率 &lt;60% 时，依赖 CI 上下文的 AI（根因分析/影响面/变更风险）基本不可用。因此 EMS NEO 把 ITOM 自动发现作为 CMDB 最大数据来源，把 ITSM 变更作为 CI 属性更新的合规通道，把 FSM 闭环作为数据链路终点——三端共同保证底座数据准确、完整、可审计。': 'When CMDB accuracy is below 60%, AI capabilities that depend on CI context, such as RCA, impact analysis, and change risk assessment, are largely unavailable. EMS NEO therefore uses ITOM auto discovery as the largest CMDB data source, ITSM change as the compliant channel for CI attribute updates, and FSM closure as the data flow endpoint. Together, the three ends keep the foundation accurate, complete, and auditable.',
    'CMDB 准确率 <60% 时，依赖 CI 上下文的 AI（根因分析/影响面/变更风险）基本不可用。因此 EMS NEO 把 ITOM 自动发现作为 CMDB 最大数据来源，把 ITSM 变更作为 CI 属性更新的合规通道，把 FSM 闭环作为数据链路终点——三端共同保证底座数据准确、完整、可审计。': 'When CMDB accuracy is below 60%, AI capabilities that depend on CI context, such as RCA, impact analysis, and change risk assessment, are largely unavailable. EMS NEO therefore uses ITOM auto discovery as the largest CMDB data source, ITSM change as the compliant channel for CI attribute updates, and FSM closure as the data flow endpoint. Together, the three ends keep the foundation accurate, complete, and auditable.',
    '以 PMS 项目为主线，走通五大产品域 — 从一个项目立项到交付结算的端到端闭环': 'Use PMS projects as the main thread to connect five product domains, forming an end-to-end loop from project initiation to delivery settlement',
    '当作 IT 服务项目的协同中枢：立项审批时绑定合同与资产，执行中承接 ITSM 变更与工单、派发 FSM 现场任务，验收关闭时回写 ITAM/CMDB。下面 7 个阶段展示一个项目如何在 EMS NEO 里完整走通。': 'As the collaboration hub for IT service projects: bind contracts and assets during initiation approval, consume ITSM changes and tickets during execution, dispatch FSM field tasks, and write back to ITAM / CMDB during acceptance and closure. The seven stages below show how a project runs end to end in EMS NEO.',
    '创建项目并发起立项审批，定义范围、里程碑与任务。项目成为后续资产、告警、工单、派工、工时的归属锚点。': 'Create a project, initiate approval, and define scope, milestones, and tasks. The project becomes the ownership anchor for assets, alerts, tickets, dispatch, and time tracking.',
    '采购硬件、登记资产、关联服务合同与 SLA。资产财务属性进入 ITAM，技术属性进入 CMDB，二者双向对账。': 'Procure hardware, register assets, and link service contracts and SLAs. Financial attributes enter ITAM, technical attributes enter CMDB, and the two are reconciled bidirectionally.',
    'ITOM 自动发现纳管设备，写入 CMDB 拓扑；NPM 拨测监控链路质量。项目内的设备开始产生告警与性能数据。': 'ITOM auto discovery manages devices and writes topology into CMDB. NPM synthetic monitoring tracks link quality. Devices in the project begin producing alerts and performance data.',
    '告警降噪后，根因分析给出证据链；需人工处置的 L2 告警转成 ITSM 工单，需现场处置的派发 FSM 工单。': 'After alert noise reduction, RCA provides an evidence chain. L2 alerts requiring manual handling become ITSM tickets, while field work is dispatched to FSM.',
    '变更申请由 AI 起草 + 风险评估，CMDB 计算依赖链影响面；T1 变更永不自动通过，审批后 ITAM 回写资产状态。': 'Change requests are drafted by AI with risk assessment, while CMDB calculates dependency-chain impact. T1 changes never auto-approve, and ITAM writes back asset status after approval.',
    '工程师上门执行，签到/签退、上传现场证据；更换硬件后序列号回写 CMDB，工单闭环，台账自动更新。': 'Engineers perform onsite work, check in and out, and upload field evidence. After hardware replacement, serial numbers are written back to CMDB, tickets are closed, and ledgers are updated automatically.',
    'FSM 工单工时回流 PMS，项目自动汇总工时成本、SLA 达成率、告警/工单/变更统计，生成客户交付报告。': 'FSM ticket time flows back to PMS. The project automatically summarizes labor cost, SLA attainment, alert / ticket / change statistics, and generates the customer delivery report.',
    '条核心联动链端到端串联': 'core orchestration flows connected end to end',
    '双引擎，一站式全球 IT 管理': 'Dual engines for one-stop global IT management',
    '点击卡片查看各域定位与完整菜单': 'Click a card to view domain positioning and the full menu',
    '一个平台运营多个最终客户（每租户 = 一个客户）': 'Operate multiple end customers on one platform (each tenant equals one customer)',
    '承接资产、服务、现场和项目交付，以': 'Handles asset, service, field, and project delivery with',
    '跨租户总览：SLA / 工单量 / 项目进度 / 成本': 'Cross-tenant overview: SLA / ticket volume / project progress / cost',
    '工时可核算 · 客户数据隔离 · 多币种分账': 'Billable time · customer data isolation · multi-currency settlement',
    '统一监控运维 · 数据在自己租户内': 'Unified monitoring operations · data stays inside the tenant',
    '资产 · 服务 · 现场 · 项目': 'Assets · Services · Field Service · Projects',
    '监控 · 拨测 · 配置 · 告警 · 自动化 · 容量': 'Monitoring · Synthetic Tests · Configuration · Alerts · Automation · Capacity',
    'IT Operations Management · 监控': 'IT Operations Management · Monitoring',
    'IT Service Management · 服务': 'IT Service Management · Services',
    'Field Service Management · 现场': 'Field Service Management · Field Service',
    'IT Asset Management · 资产': 'IT Asset Management · Assets',
    'Project Management · 项目': 'Project Management · Projects',
    '五域之一 · 数据生产者': 'One of Five Domains · Data Producer',
    '五域之一 · 数据消费者 / 合规卡点': 'One of Five Domains · Data Consumer / Compliance Gate',
    '五域之一 · 数据消费者 / 执行闭环': 'One of Five Domains · Data Consumer / Execution Closure',
    '五域之一 · 财务视角 / 资产账本': 'One of Five Domains · Financial View / Asset Ledger',
    '五域之一 · ITIL 服务项目管理中枢': 'One of Five Domains · ITIL Service Project Management Hub',
    '看见问题 —— 实时监控与告警，是运维闭环的「眼睛」与数据源头': 'See issues: real-time monitoring and alerts are the eyes and data source of the operations loop',
    '管好过程 —— 服务请求与变更治理，是闭环的「大脑」与合规卡点': 'Govern the process: service requests and change governance are the decision center and compliance gate of the loop',
    '落地执行 —— 现场服务调度与执行，是闭环的「手脚」': 'Execute in the field: field service dispatch and execution turn the loop into onsite action',
    '算清账 —— 资产全生命周期与财务视角，是闭环的「资产账本」': 'Account for assets: asset lifecycle and financial views form the asset ledger of the loop',
    '协同中枢 —— ITIL 视角的 IT 服务项目管理，串起 ITSM / FSM / ITAM': 'Collaboration hub: ITIL-oriented IT service project management connecting ITSM / FSM / ITAM',
    '采集指标、降噪告警、定位根因，产出「发生了什么、影响谁」。': 'Collect metrics, reduce alert noise, locate root causes, and answer what happened and who is affected.',
    '承接监控、网络拨测、配置、告警、自动化、容量与可用性。': 'Covers monitoring, synthetic network tests, configuration, alerts, automation, capacity, and availability.',
    '设备与网络环境 —— 通过自动发现协议主动纳管，无需人工录入。': 'Device and network environments are actively managed through auto-discovery protocols without manual entry.',
    '受理、分级、审批、编排处置流程，是闭环的决策与合规中枢。': 'Triage, classify, approve, and orchestrate handling workflows as the decision and compliance hub of the loop.',
    '派工、执行、留痕，把「线上决策」落到「现场动作」。': 'Dispatch, execute, and keep evidence so online decisions become field actions.',
    '维护资产财务属性（成本/折旧/合同），与 CMDB 技术属性对账。': 'Maintain asset financial attributes (cost, depreciation, contracts) and reconcile them with CMDB technical attributes.',
    'ITAM 管理采购、合同、折旧与盘点，提供资产的财务视角。它与 CMDB 双向对账，合同到期主动触发 ITSM 变更，变更后回写资产状态。': 'ITAM manages procurement, contracts, depreciation, and stocktaking to provide the financial view of assets. It reconciles bidirectionally with CMDB, proactively triggers ITSM changes on contract expiry, and writes back asset status after changes.',
    'ITOM 自动发现纳管设备、采集指标、降噪告警并做根因分析。它是 CMDB 最大的数据来源，也是告警处置链的起点。': 'ITOM discovers and manages devices, collects metrics, reduces alert noise, and performs RCA. It is the largest CMDB data source and the starting point of the alert handling flow.',
    'ITSM 承接告警转来的事件、处理服务请求、治理变更。它读取 CMDB 影响面做决策，是 T1 变更永不自动通过的合规关口。': 'ITSM consumes incidents converted from alerts, handles service requests, and governs changes. It reads CMDB impact scope for decisions and is the compliance gate where T1 changes never auto-approve.',
    'FSM 把需现场处置的工单派给最合适的工程师，执行签到、处置、回写。硬件更换后序列号/状态回写 CMDB，工时回流 PMS。': 'FSM dispatches field tickets to the best-fit engineer, manages check-in, handling, and writeback. After hardware replacement, serial numbers and status are written back to CMDB, and labor time flows to PMS.',
    'PMS 承接临时性 IT 项目从立项到服务转换的全过程治理：立项审批 → 里程碑/任务 → 风险/交付物 → 验收关闭，过程中调用 ITSM 变更、派发 FSM 现场工单、关闭时回写 ITAM/CMDB。': 'PMS governs temporary IT projects from initiation to service transition: initiation approval, milestones / tasks, risks / deliverables, acceptance and closure. It invokes ITSM changes, dispatches FSM field tickets, and writes back to ITAM / CMDB at closure.',
    '基础设施全栈监控：设备 / 网络 / 拓扑 / 告警引擎 / 自动发现，告警降噪 + RCA 定位根因。': 'Full-stack infrastructure monitoring: devices / networks / topology / alert engine / auto discovery, with alert noise reduction and RCA.',
    '事件 / 变更 / 问题 / 服务请求 / 知识库，AI 起草 + 审批卡点，CMDB 变更的合规通道。': 'Incidents / changes / problems / service requests / knowledge base, with AI drafting, approval gates, and a compliant channel for CMDB changes.',
    '智能派工 / 现场执行 / 备件 / SLA 追踪，把工单送到现场，完工闭环回写 CMDB。': 'Intelligent dispatch / field execution / spare parts / SLA tracking sends tickets to the field and writes closure data back to CMDB.',
    '资产生命周期：采购 / 合同 / 折旧 / 成本 / 报废，与 CMDB 双向对账，财务视角台账。': 'Asset lifecycle: procurement / contracts / depreciation / cost / retirement, reconciled bidirectionally with CMDB through a financial ledger view.',
    'ITIL 服务项目管理中枢：立项审批 → 里程碑/任务 → 验收关闭，串联 ITSM / FSM / ITAM 协同。': 'ITIL service project management hub: initiation approval, milestones / tasks, acceptance and closure, connecting ITSM / FSM / ITAM collaboration.',
    '采购/财务系统：采购入库与合同信息进入 ITAM 台账。': 'Procurement / finance systems: procurement inbound and contract information enter the ITAM ledger.',
    'CI 基本属性（技术）⇄ 资产财务属性（成本/折旧/合同）': 'CI basic attributes (technical) ⇄ asset financial attributes (cost / depreciation / contracts)',
    '▲ 影响面分析 · CI 上下文 · 位置/配置': '▲ Impact analysis · CI context · location / configuration',
    '▼ 强写入 CI · 拓扑关系 · 路径质量': '▼ Strong CI write · topology relationships · path quality',
    'CI 资产 · L2/L3 拓扑关系 · 设备发现结果': 'CI assets · L2 / L3 topology relationships · device discovery results',
    'CI 资产 · 关系图谱 · 影响面': 'CI assets · relationship graph · impact scope',
    'L2/L3 告警自动升级为 ITSM 事件工单': 'L2 / L3 alerts automatically escalate to ITSM incident tickets',
    'L2/L3 依赖关系与服务映射': 'L2 / L3 dependencies and service mapping',
    'L2/L3 依赖关系与服务映射可视化': 'Visualization of L2 / L3 dependencies and service mapping',
    '扫描网段纳管设备，自动写入 CI 与拓扑': 'Scan network segments, manage devices, and automatically write CIs and topology',
    'CPU/内存/磁盘/流量等性能指标实时采集': 'Real-time collection of CPU / memory / disk / traffic performance metrics',
    '合并重复告警、抑制抖动、去重归因': 'Merge duplicate alerts, suppress flapping, and deduplicate attribution',
    '基于拓扑与历史给 RCA 证据链': 'Provide RCA evidence chains based on topology and history',
    '告警自动升级 → 创建事件工单': 'Auto-escalate alerts -> create incident tickets',
    '告警 → 降噪 → RCA → 转单 → 派工': 'Alert -> Noise Reduction -> RCA -> Ticket Conversion -> Dispatch',
    '告警 → 降噪 → RCA →': 'Alert -> Noise Reduction -> RCA ->',
    '自动发现 → 纳管 → 拓扑 → 告警': 'Auto Discovery -> Management -> Topology -> Alerts',
    '变更 → 影响面 → 审批卡点 → 资产回写': 'Change -> Impact Scope -> Approval Gate -> Asset Writeback',
    '采购 → 入库 → CI 登记 → 合同关联': 'Procurement -> Inbound -> CI Registration -> Contract Linking',
    '派工 → 签到 → 处置 → 回写 → 闭环': 'Dispatch -> Check-In -> Handling -> Writeback -> Closure',
    '工时回流 → SLA → 成本 → 交付报告': 'Time Flowback -> SLA -> Cost -> Delivery Report',
    '新建/编辑 · 立项审批流 · 驳回重提': 'Create / edit · initiation approval flow · reject and resubmit',
    '新建/编辑 · 立项审批流': 'Create / edit · initiation approval flow',
    '里程碑 · 任务 · 风险问题 · 交付物': 'Milestones · tasks · risks / issues · deliverables',
    '里程碑 · 任务 · 风险 · 交付物': 'Milestones · tasks · risks · deliverables',
    '验收前置校验 · 验收审批 · 关闭归档': 'Pre-acceptance checks · acceptance approval · closure archive',
    '验收校验 · 审批 · 关闭归档': 'Acceptance checks · approval · closure archive',
    '项目类型状态 · 验收规则 · 通知规则': 'Project type status · acceptance rules · notification rules',
    '管理看板 · 报表导出 · 审计日志': 'Management dashboards · report export · audit logs',
    '管理看板 · 报表 · 审计日志': 'Management dashboards · reports · audit logs',
    '立项审批 → 里程碑/任务 → 风险/交付物 → 验收关闭，全流程治理与审计闭环。': 'Initiation approval -> milestones / tasks -> risks / deliverables -> acceptance closure, with full-process governance and audit closure.',
    '立项审批 → 里程碑 → 任务拆解': 'Initiation Approval -> Milestones -> Task Breakdown',
    '影响面 → 风险审批 → 执行 →': 'Impact Scope -> Risk Approval -> Execution ->',
    '协同中枢 · 承接工单升级 / 派发 FSM / 回写资产': 'Collaboration hub · consumes ticket escalations / dispatches FSM / writes back assets',
    'PMS-ITSM / FSM / ITAM 联动': 'PMS-ITSM / FSM / ITAM Orchestration',
    'Alert-to-Incident 联动链路': 'Alert-to-Incident Orchestration Flow',
    'Alert-to-Incident（L3 端到端）': 'Alert-to-Incident (L3 End-to-End)',
    '合同与资产为项目提供资产基础。': 'Contracts and assets provide the asset foundation for projects.',
    '变更/工单可升级为项目；': 'Changes / tickets can be escalated to projects;',
    '事件/变更需现场处理 → 派工工单': 'Incidents / changes requiring field handling -> dispatch tickets',
    '：事件/变更需现场处置的工单。': ': tickets for incidents / changes requiring field handling.',
    '：合同到期自动发起续约/替换。': ': automatically initiate renewal / replacement when contracts expire.',
    '合同到期预警 → 触发变更请求（续约/替换）': 'Contract expiry warning -> trigger change request (renewal / replacement)',
    '合同到期前 N 天自动触发': 'Automatically triggered N days before contract expiry',
    '续约/替换需求转 ITSM 变更请求': 'Renewal / replacement demand becomes an ITSM change request',
    '基于 CMDB 依赖链评估变更风险': 'Assess change risk based on CMDB dependency chains',
    '基于 CMDB 依赖链的风险评估': 'Risk assessment based on CMDB dependency chains',
    'T1 变更永不自动通过、人工复核': 'T1 changes never auto-approve and require human review',
    'AI 起草 + 风险评估 + 分级审批': 'AI drafting + risk assessment + tiered approval',
    'AI 起草 + 风险评估': 'AI drafting + risk assessment',
    '告警转事件工单时，CMDB 提供 CI 影响面；派工时 FSM 按技能/位置/可用性推荐工程师。': 'When alerts are converted to incident tickets, CMDB provides CI impact scope; during dispatch, FSM recommends engineers by skill, location, and availability.',
    '现场更换硬件是 CMDB 数据链路终点——回写保证台账与实际资产一致。': 'Field hardware replacement is the endpoint of the CMDB data flow. Writeback keeps ledgers aligned with actual assets.',
    '按技能/位置/可用性推荐工程师': 'Recommend engineers by skill, location, and availability',
    '到场/修复时限倒计时与超时提醒': 'Arrival / repair SLA countdown and overdue reminders',
    '人员技能、资质、日程与负载': 'Personnel skills, qualifications, schedules, and workload',
    '工单工时自动回流 PMS 成本': 'Ticket labor time automatically flows back to PMS cost',
    '硬件更换后序列号/状态回写 CMDB': 'Write serial numbers / status back to CMDB after hardware replacement',
    '硬件更换后序列号/状态回写': 'Write serial numbers / status back after hardware replacement',
    '现场工程师工作台（移动端 H5）': 'Field Engineer Workspace (Mobile H5)',
    '进入现场工程师工作台 →': 'Open Field Engineer Workspace ->',
    '服务合同、维保与 SLA 条款': 'Service contracts, maintenance, and SLA terms',
    '资产全量登记、分类与生命周期状态': 'Full asset registration, classification, and lifecycle status',
    '合同/维保到期前 N 天自动提醒': 'Automatic reminders N days before contract / maintenance expiry',
    '与 CMDB 的技术属性实时比对': 'Real-time comparison with CMDB technical attributes',
    '折旧计算、成本分摊与资产价值': 'Depreciation calculation, cost allocation, and asset value',
    '合同台账、到期预警与续约': 'Contract ledger, expiry warnings, and renewals',
    '财务视角 · 采购/合同/成本': 'Financial View · Procurement / Contracts / Cost',
    '双向对账（8,421 匹配 / 234 差异）': 'Bidirectional Reconciliation (8,421 matched / 234 variances)',
    '数据生产者 · 发现/告警/拓扑': 'Data Producer · Discovery / Alerts / Topology',
    '数据生产者 · 拨测/链路质量': 'Data Producer · Synthetic Tests / Link Quality',
    '数据消费者 · 工单/变更/合规': 'Data Consumer · Tickets / Changes / Compliance',
    '数据消费者 · 派工/执行/闭环': 'Data Consumer · Dispatch / Execution / Closure',
    '项目进度可见 · SLA 与报告可查': 'Visible project progress · searchable SLA and reports',
    '客户自助门户：提单 / 看进度 / 看报告': 'Customer self-service portal: submit tickets / view progress / view reports',
    '工时 · SLA · 报告闭环': 'Time · SLA · Report Closure',
    '根因沉淀、已知错误、规避方案': 'Root cause knowledge, known errors, and workarounds',
    '工单经验沉淀、AI 检索推荐': 'Ticket experience capture and AI search recommendations',
    '告警转工单、事件分级、处置流程': 'Alert-to-ticket, incident classification, and handling workflow',
    '影响分析 · CI 依赖链 · 服务映射': 'Impact Analysis · CI Dependency Chain · Service Mapping',
    '阈值告警、趋势分析、健康度评分': 'Threshold alerts, trend analysis, and health scoring'
  });

  Object.assign(EN_TERMS, {
    '返回': 'Back',
    '执行中': 'In Progress',
    '进行中': 'In Progress',
    '已闭环': 'Closed',
    '已交付': 'Delivered',
    '已拒绝': 'Rejected',
    '已验收': 'Accepted',
    '待确认': 'Pending Confirmation',
    '即将到期': 'Expiring Soon',
    '已接单': 'Accepted',
    '维修中': 'Under Repair',
    '未催单': 'Not Expedited',
    '请选择': 'Please Select',
    '请输入': 'Please Enter',
    '搜索...': 'Search...',
    '备注': 'Remarks',
    '复制': 'Copy',
    '预览': 'Preview',
    '创建': 'Create',
    '继续新建': 'Create Another',
    '暂停': 'Pause',
    '终止': 'Terminate',
    '重试': 'Retry',
    '自定义': 'Custom',
    '其他': 'Other',
    '异常': 'Exception',
    '完整性': 'Completeness',
    '时间表': 'Timeline',
    '开始时间': 'Start Time',
    '启用状态': 'Enable Status',
    '联系电话': 'Contact Number',
    '负责角色': 'Responsible Role',
    '关联客户企业': 'Associated Customer Enterprise',
    '固定资产': 'Fixed Assets',
    '里程碑': 'Milestone',
    '验收报告': 'Acceptance Report',
    '工单状态': 'Ticket Status',
    '工单范围': 'Ticket Scope',
    '授权范围': 'Authorization Scope',
    '耗材': 'Consumables',
    '进度': 'Progress',
    '报废': 'Retirement',
    '角色': 'Role',
    '容器': 'Container',
    '每月': 'Monthly',
    '计入': 'Included',
    '到场': 'Arrival',
    '次': 'Times',
    '天': 'Days',
    '月': 'Month',
    '且': 'And',
    '共': 'Total',
    '第': 'Page',
    '页': 'Page',
    '个': 'Items',
    '个 CI': 'CIs',
    '· 缺 2': '· Missing 2',
    '意见：': 'Comments:',
    'P4-低': 'P4-Low',
    'Agent/年': 'Agent / Year',
    'L1 自动执行': 'L1 Whitelist',
    'CI 名称': 'CI Name',
    'PMS 任务': 'PMS Task',
    'ITSM 工单': 'ITSM Ticket',
    'FSM 派工与 ITAM 采购': 'FSM Dispatch and ITAM Procurement',
    '回写': 'Writeback',
    '里程碑校验': 'Milestone Validation',
    '任务详情抽屉': 'Task Detail Drawer',
    '查看任务详情与链路状态': 'View Task Details and Flow Status',
    '链路时间线 &middot; 推送与回写记录（只读）': 'Flow Timeline &middot; Push and Writeback Records (Read-Only)',
    '链路口径：PMS 对外唯一集成出口为 ITSM；本链路中的 FSM 派工与 ITAM 采购均为经 ITSM 派生后的回写快照，PMS 侧只读展示、可下钻查看，不产生下游执行动作。异常处置在 PMS 侧只有「重新推送 ITSM」一种动作。': 'Flow rule: the only external integration outlet from PMS is ITSM. FSM dispatch and ITAM procurement in this flow are writeback snapshots derived by ITSM. PMS provides read-only display and drilldown only, and does not trigger downstream execution. The only exception action in PMS is Repush to ITSM.',
    '链路口径：PMS 对外唯一集成出口为 ITSM；FSM 现场派工由 ITSM 判断后派生、ITAM 资产申请在 ITSM 工单内提出，二者在 PMS 内均为只读回写快照，PMS 侧出向动作只有「推送 ITSM 生成工单」。': 'Flow rule: the only external integration outlet from PMS is ITSM. FSM field dispatch is derived after ITSM assessment, and ITAM asset requests are raised inside ITSM tickets. Both are read-only writeback snapshots in PMS, and the only outbound PMS action is Push to ITSM to Generate Ticket.',
    '下游已取消，需重新推送': 'Downstream Canceled, Repush Required',
    '重新推送 ITSM': 'Repush to ITSM',
    '推送 ITSM 生成工单': 'Push to ITSM to Generate Ticket',
    '任务推送 ITSM': 'Task Pushed to ITSM',
    '已退回': 'Returned',
    '已停留': 'Dwell Time',
    '卡住': 'Blocked',
    '正常': 'Normal',
    '无停留': 'No Dwell',
    '差什么才能达成：': 'What Is Missing:',
    '未达成原因归类：': 'Unmet Reason Category:',
    '任务未完成': 'Task Incomplete',
    '工单未闭环': 'Ticket Not Closed',
    '交付物未齐': 'Deliverables Incomplete',
    '三类均未命中': 'None of the Three Categories Hit',
    '三类全中': 'All Three Categories Hit',
    '命中': 'Hit',
    '里程碑未到期': 'Milestone Not Due',
    '达成校验': 'Achievement Validation',
    '达成校验口径：里程碑达成 ＝ 下属任务全部完成 ＋ 关联 ITSM 工单全部闭环 ＋ 计划交付物齐全（齐全＝已归档 + 已提交，与交付物管理页同源），三项缺一不可。点「达成校验」展开三层下钻（': 'Achievement validation rule: milestone achievement equals all subordinate tasks completed plus all associated ITSM tickets closed plus all planned deliverables complete (complete means archived and submitted, from the same source as Deliverable Management). All three are required. Click Achievement Validation to expand a three-level drilldown (',
    '），逐层写明': '), with each level explaining',
    '，不只给百分比。负责人取自 PMS 任务管理页的任务负责人（多人时标「等 N 人」，尚未分解任务的里程碑由项目 PM 归口）；工单 / 派工 / 资产申请状态为各产品域回写快照，PMS 侧只读。': ', instead of only showing a percentage. Owners come from the PMS Task Management task owner field (multiple owners are shown as "and N others"; milestones without decomposed tasks are owned by the project PM). Ticket / dispatch / asset request status values are writeback snapshots from each product domain and are read-only in PMS.',
    '工单 / 派工 / 资产申请状态为 ITSM 回写快照，PMS 侧只读；处置动作请在任务管理页「重新推送 ITSM」，PMS 不直接干预 FSM / ITAM。': 'Ticket / dispatch / asset request status values are ITSM writeback snapshots and read-only in PMS. Handle exceptions from Task Management by using Repush to ITSM; PMS does not directly intervene in FSM / ITAM.',
    '关键操作过滤覆盖': 'Key operation filters cover',
    '五类。': 'five categories.',
    '「回写」为外部对象状态回到 PMS 任务与里程碑的留痕记录（WritebackRecord）：执行工单来自 ITSM，现场工单由 ITSM 判断后派生至 FSM，资产申请在 ITSM 工单内发起并流转 ITAM 完成采购与资产调度；项目关闭触发的 ITAM/CMDB 资产状态更新按既有约定直连，回执同样留痕。回写条目在 PMS 内只读，PMS 只留痕、不编辑，编辑请到 ITSM / FSM / ITAM 产品。': 'Writeback records external object status returning to PMS tasks and milestones (WritebackRecord): execution tickets come from ITSM, field tickets are derived to FSM after ITSM assessment, asset requests are raised inside ITSM tickets and flow to ITAM for procurement and asset dispatch. ITAM / CMDB asset status updates triggered by project closure follow the existing direct-link agreement, with receipts also retained. Writeback entries are read-only in PMS; PMS records evidence only and does not edit them. Edit in ITSM / FSM / ITAM.',
    '已开始下载报告': 'Report download started',
    '任务详情抽屉入口': 'Task detail drawer entry',
    '已打开 FSM 派工（执行盘点）': 'FSM dispatch opened (execute stocktaking)',
    '此处只读，编辑请到 ITSM 产品': 'Read-only here. Edit in ITSM.',
    '开始输入以搜索记录': 'Start typing to search records'
  });

  Object.assign(EN_TERMS, {
    'EMS NEO 标准产品解决方案': 'EMS NEO Standard Product Solution',
    '解决方案': 'Solution',
    '解决方案总览 - EMS NEO 标准产品解决方案': 'Solution Overview - EMS NEO Standard Product Solution',
    '五域联动全景 - EMS NEO 标准产品解决方案': 'Cross-Domain Orchestration Map - EMS NEO Standard Product Solution',
    '项目全生命周期 - EMS NEO 标准产品解决方案': 'Project Lifecycle - EMS NEO Standard Product Solution',
    'ITOM 监控 - EMS NEO 标准产品解决方案': 'ITOM Monitoring - EMS NEO Standard Product Solution',
    'ITSM 服务 - EMS NEO 标准产品解决方案': 'ITSM Services - EMS NEO Standard Product Solution',
    'FSM 现场 - EMS NEO 标准产品解决方案': 'FSM Field Service - EMS NEO Standard Product Solution',
    'ITAM 资产 - EMS NEO 标准产品解决方案': 'ITAM Assets - EMS NEO Standard Product Solution',
    'PMS 项目 - EMS NEO 标准产品解决方案': 'PMS Projects - EMS NEO Standard Product Solution',
    '标准产品能力': 'Standard Product Capabilities',
    '标准产品能力演示': 'Standard Product Capability Demo',
    '标准产品能力支撑': 'Standard Product Capability Foundation',
    'EMS NEO 双引擎': 'EMS NEO Dual Engines',
    '点击进入引擎级总览': 'Open Engine-Level Overview',
    '两层客户结构': 'Two-Tier Customer Structure',
    '面向合作伙伴共建标准方案': 'Standard Solution Co-Built with Partners',
    '买家 · 多租户': 'Buyer · Multi-Tenant',
    '使用者 · 租户内': 'User · Inside Tenant',
    '最终客户': 'End Customer',
    'MSP 多租户运营': 'MSP Multi-Tenant Operations',
    'ENT 企业租户运营': 'ENT Enterprise Tenant Operations',
    '查看联动全景 →': 'View Orchestration Map ->',
    '告警处置链': 'Alert Handling Flow',
    '变更影响链': 'Change Impact Flow',
    '资产合同链': 'Asset Contract Flow',
    '资产合同链 · 主动触发': 'Asset Contract Flow · Proactive Trigger',
    'ITSM 变更申请': 'ITSM Change Request',
    'CMDB 影响面': 'CMDB Impact Scope',
    'ITAM 合同/资产': 'ITAM Contracts / Assets',
    'FSM 现场处置': 'FSM Field Handling',
    '转工单': 'Convert to Ticket',
    '完工回写': 'Completion Writeback',
    '完工关闭': 'Completion Closure',
    '台账回写': 'Ledger Writeback',
    '台账更新': 'Ledger Update',
    '变更申请': 'Change Request',
    '合同到期/资产报废': 'Contract Expiry / Asset Retirement',
    '触发变更/工单': 'Trigger Change / Ticket',
    '现场处置': 'Field Handling',
    '降噪': 'Noise Reduction',
    '告警降噪': 'Alert Noise Reduction',
    'RCA 证据链': 'RCA Evidence Chain',
    'L2 转单确认': 'L2 Ticket Conversion Confirmation',
    '智能派工推荐': 'Intelligent Dispatch Recommendation',
    '依赖链 / 服务映射': 'Dependency Chain / Service Mapping',
    'T1 永不自动通过': 'T1 Never Auto-Approves',
    '资产状态/序列号': 'Asset Status / Serial Number',
    '到期/报废预警': 'Expiry / Retirement Warning',
    '续约/替换工单': 'Renewal / Replacement Ticket',
    '更换/盘点': 'Replacement / Stocktaking',
    '从告警中心进入 →': 'Enter from Alert Center ->',
    '从变更影响分析进入 →': 'Enter from Change Impact Analysis ->',
    '从合同管理进入 →': 'Enter from Contract Management ->',
    '源域': 'Source Domain',
    '流向': 'Flow Direction',
    '目标域': 'Target Domain',
    '内容': 'Content',
    '触发场景': 'Trigger Scenario',
    'NPM 网络': 'NPM Network',
    'CMDB 数据底座': 'CMDB Data Foundation',
    '承接 ITSM 工单升级': 'consumes ITSM ticket escalation',
    '任务派发 FSM 现场': 'dispatches tasks to FSM field service',
    '关闭回写 ITAM/CMDB': 'writes closure data back to ITAM / CMDB',
    '串联项目全生命周期': 'connects the full project lifecycle'
  });

  Object.assign(EN_TERMS, {
    '待办中心 · PMO / PM 双视角': 'Work Queue · PMO / PM Dual View',
    '说明 MSP 与最终客户的两层结构': 'Explain the two-tier structure between MSP and end customers',
    '项目-任务-工单-资产全程可追溯': 'Project-task-ticket-asset traceability across the full process',
    '拨测与链路质量补齐应用与网络视角': 'Synthetic tests and link quality complete the application and network view',
    '标准化服务目录与自助请求': 'Standardized Service Catalog and Self-Service Requests',
    '响应/解决时限、超时升级': 'Response / resolution targets and overdue escalation',
    '标准化服务请求与自助门户': 'Standardized Service Requests and Self-Service Portal',
    'PMS 协同中枢贯通套件': 'PMS Collaborative Hub Suite',
    '资产登记与生命周期管理': 'Asset Registration and Lifecycle Management',
    '盘点计划、盘点差异处理': 'Stocktaking Plans and Variance Handling',
    '资产全景与关键指标': 'Asset Panorama and Key Metrics',
    '采购申请、入库与验收': 'Purchase Requests, Inbound, and Acceptance',
    'CMDB 双向对账': 'CMDB Bidirectional Reconciliation',
    '智能派工与工程师调度': 'Intelligent Dispatch and Engineer Scheduling',
    '到场定位打卡、离场确认': 'Location Check-In and Departure Confirmation',
    '拍照/录音/签名留痕': 'Photo / Audio / Signature Evidence',
    '备件申领、库存与退换': 'Spare Parts Requests, Inventory, and Returns',
    '性能/可用性监控': 'Performance / Availability Monitoring',
    '告警列表、降噪与处置': 'Alert List, Noise Reduction, and Handling',
    '事件列表与处置流程': 'Incident List and Handling Workflow',
    '服务目录/请求': 'Service Catalog / Requests',
    '基础配置与规则': 'Basic Configuration and Rules',
    '验收与关闭中心': 'Acceptance and Closure Center',
    '交付报告与审计。': 'Delivery reports and audit.',
    '个阶段从立项走到结算': 'stages from initiation to settlement',
    '以现场工程师视角演示 FSM：登录 → 首页 / 当前工单 → 工单列表 → 工单详情（信息 · 资料 · 流程 · SLA · 验收 · 费用）→ 收益 / 我的。iPhone 17 手机壳 + 微信浏览器环境模拟。': 'Demonstrates FSM from the field engineer perspective: login -> home / current work order -> work order list -> work order detail (information · materials · workflow · SLA · acceptance · expenses) -> earnings / profile. Simulated in an iPhone 17 shell and WeChat browser environment.',
    '现场工程师视角演示 FSM': 'FSM Demo from Field Engineer Perspective',
    'PMS 立项管控 →': 'PMS Initiation Governance ->',
    'PMS 看板报表 →': 'PMS Dashboards and Reports ->',
    'FSM 派工看板 →': 'FSM Dispatch Board ->',
    'ITOM 拓扑视图 →': 'ITOM Topology View ->',
    'ITAM 合同管理 →': 'ITAM Contract Management ->',
    '变更影响分析 →': 'Change Impact Analysis ->',
    '告警中心 →': 'Alert Center ->',
    'UMP 总览 →': 'UMP Overview ->',
    '进入 UMP 总览 →': 'Open UMP Overview ->',
    '7 个阶段走通': 'Seven-Stage Walkthrough',
    'MSP 两层客户': 'MSP Two-Tier Customer Model',
    'MSP / 二类运营商': 'MSP / Type-II Operator',
    'UMP（统一纳管）': 'UMP (Unified Management)',
    'MOP（监控运维）': 'MOP (Monitoring Operations)',
    'NPM 网络监控': 'NPM Network Monitoring',
    'NPM 协同': 'NPM Collaboration',
    '强写入 CMDB': 'Strong Write to CMDB',
    'ITSM 派工': 'ITSM Dispatch',
    '告警升级 ITSM': 'Alert Escalation to ITSM',
    'ITAM 合同到期': 'ITAM Contract Expiry',
    'PMS 工时回流': 'PMS Time Flowback',
    'ITSM 转工单': 'ITSM Ticket Conversion',
    '工单执行与现场回写': 'Ticket Execution and Field Writeback',
    '派工 → 完工回写': 'Dispatch -> Completion Writeback',
    '触发变更/工单 →': 'Trigger Change / Ticket ->',
    '合同到期/资产报废 →': 'Contract Expiry / Asset Retirement ->',
    '现场处置 → 回写台账': 'Field Handling -> Ledger Writeback',
    '任务派工现场；': 'dispatch tasks to the field;',
    '触发变更请求；': 'trigger change requests;',
    '关闭回写资产；': 'write closure data back to assets;',
    '提供影响面。': 'provide impact scope.',
    '转事件工单；': 'convert to incident tickets;',
    '：CI 与拓扑；': ': CIs and topology;',
    '：序列号/状态；': ': serial number / status;',
    '：成本与 SLA 汇总。': ': cost and SLA summary.',
    '：转事件工单触发处置。': ': convert to incident tickets and trigger handling.',
    '：变更后资产状态更新。': ': update asset status after change.',
    '：需现场处置的工单；': ': tickets requiring field handling;'
  });

  Object.assign(EN_TERMS, {
    'EMS NEO 以': 'EMS NEO uses',
    '客户结构': 'Customer Structure',
    '拨测与链路质量视角': 'Synthetic Test and Link Quality View',
    '资产合同就绪': 'Asset Contract Ready',
    '变更申请 →': 'Change Request ->',
    '转工单 →': 'Convert to Ticket ->',
    '变更影响面': 'Change Impact Scope',
    'SLA 计时': 'SLA Timer',
    '折旧/成本': 'Depreciation / Cost',
    '工程师管理': 'Engineer Management',
    '签到/签退': 'Check-In / Check-Out',
    '到期预警': 'Expiry Warning',
    '事件响应': 'Incident Response',
    '变更合规': 'Change Compliance',
    '触发变更': 'Trigger Change',
    '派工详情': 'Dispatch Details',
    '现场证据': 'Field Evidence',
    '指标采集': 'Metric Collection',
    '派工看板': 'Dispatch Board',
    '双向对账': 'Bidirectional Reconciliation',
    '阶段 01': 'Stage 01',
    '阶段 02': 'Stage 02',
    '阶段 03': 'Stage 03',
    '阶段 04': 'Stage 04',
    '阶段 05': 'Stage 05',
    '阶段 06': 'Stage 06',
    '阶段 07': 'Stage 07',
    '🔗 告警处置链': '🔗 Alert Handling Flow',
    '🔗 变更影响链': '🔗 Change Impact Flow',
    '🔗 资产合同链': '🔗 Asset Contract Flow'
  });

  Object.assign(EN_TERMS, {
    '这是 AI 起草的动作，需你审阅并确认。确认不是审批，草稿、人工修改和执行结果都会记录到 T5 审计。': 'This AI-drafted action requires manual confirmation. The draft, edits, and execution result are recorded in the T5 audit trail.',
    '采纳 AI 建议 100% · Token 消耗 ¥0.04': 'AI recommendation accepted 100% · Token cost ¥0.04',
    '采纳 AI Recommendations 100% · Token 消耗 ¥0.04': 'AI recommendation accepted 100% · Token cost ¥0.04',
    '谁触发/谁审批/结果全链路': 'trigger / approver / full outcome chain',
    'Token 消耗': 'Token Cost'
  });

  Object.assign(EN_TERMS, {
    '项目任务拆解 · 推送 ITSM 生成执行工单（1 任务 : N） · 完成前置门控': 'Project task breakdown · push to ITSM to generate execution tickets (1 task : N) · completion prerequisite gate',
    '任务总数': 'Total Tasks',
    '待开始': 'Not Started',
    '待验证': 'Pending Validation',
    '已完成': 'Completed',
    '阻塞（关联工单未闭环）': 'Blocked (related tickets not closed)',
    '工单未闭环': 'Tickets Not Closed',
    '未推送 ITSM': 'Not Pushed to ITSM',
    '工单闭环率': 'Ticket Closure Rate',
    '已闭环 34 张 · 未闭环 16 张（来源 ITSM 回写）': '34 closed · 16 not closed (from ITSM writeback)',
    '链式集成': 'Chained Integration',
    '链式集成：': 'Chained Integration:',
    'PMS 项目任务': 'PMS Project Tasks',
    '推送 ITSM 生成执行工单（1 任务 : N）': 'push to ITSM to generate execution tickets (1 task : N)',
    'ITSM 判定需现场实施则派生 FSM 现场派工 / 项目设备的资产申请在 ITSM 工单内提出并流转 ITAM': 'if ITSM determines field implementation is required, FSM field dispatch is derived / project equipment asset requests are raised in ITSM tickets and flow to ITAM',
    '工单完成状态回写 PMS 校验里程碑。': 'ticket completion status writes back to PMS for milestone validation.',
    'PMS 对外唯一集成出口为 ITSM；本页涉及的 FSM 派工与 ITAM 资产申请均为回写快照，只读展示、可下钻查看，PMS 侧不产生下游执行动作。': 'The only external integration outlet from PMS is ITSM. FSM dispatch and ITAM asset requests on this page are writeback snapshots, shown read-only with drilldown. PMS does not trigger downstream execution.',
    'PM 执行提示：': 'PM Execution Tip:',
    'PM 执行 Tip:': 'PM Execution Tip:',
    '任务只归属实际执行项目。若当前项目是子项目，请先确认所属总项目、当前子项目对总体里程碑的影响，再更新任务或推送 ITSM；总项目进度由系统汇总，不在本页手工修改。': 'Tasks belong only to actual execution projects. If the current project is a subproject, confirm the parent project and the subproject impact on overall milestones before updating tasks or pushing to ITSM. Parent project progress is summarized by the system and is not manually edited here.',
    '搜索任务': 'Search Tasks',
    'Search 任务': 'Search Tasks',
    '按项目筛选': 'Filter by Project',
    '按 ProjectFilter': 'Filter by Project',
    '按里程碑筛选': 'Filter by Milestone',
    '按 MilestoneFilter': 'Filter by Milestone',
    '按负责人筛选': 'Filter by Owner',
    '按 OwnerFilter': 'Filter by Owner',
    '按状态筛选': 'Filter by Status',
    '按 StatusFilter': 'Filter by Status',
    '项目：全部': 'Project: All',
    'Project: All': 'Project: All',
    '里程碑：全部': 'Milestone: All',
    'Milestone: All': 'Milestone: All',
    '负责人：全部': 'Owner: All',
    'Owner: All': 'Owner: All',
    '状态：全部': 'Status: All',
    'Status: All': 'Status: All',
    '视图切换': 'View Switch',
    '看板': 'Board',
    '新建任务': 'Create Task',
    'Create 任务': 'Create Task',
    '任务': 'Task',
    '所属里程碑': 'Milestone',
    '所属 MILESTONE': 'Milestone',
    'ITSM 工单数': 'ITSM Ticket Count',
    'ITSM TICKET 数': 'ITSM Ticket Count',
    '工单号（ITSM · 只读）': 'Ticket No. (ITSM · Read-Only)',
    'TICKET NO.（ITSM · 只读）': 'Ticket No. (ITSM · Read-Only)',
    '闭环 N/M': 'Closed N/M',
    '计划完成': 'Planned Completion',
    '计划 COMPLETE': 'Planned Completion',
    '未闭环': 'Not Closed',
    '处理中': 'In Progress',
    '待受理': 'Pending Acceptance',
    '回写失败': 'Writeback Failed',
    '已到货': 'Arrived',
    '采购完成': 'Procurement Completed',
    '采购在途': 'Procurement In Progress',
    '已改期': 'Rescheduled',
    '完工回传': 'Completion Returned',
    '尚未推送 ITSM': 'Not Yet Pushed to ITSM',
    '尚未推送 ITSM 生成执行工单': 'Not yet pushed to ITSM to generate execution tickets',
    '尚未推送 ITSM 生成执行工单，不允许完成任务': 'Task cannot be completed before pushing to ITSM to generate execution tickets',
    '尚未推送 ITSM 生成执行工单，无执行凭证': 'No execution credentials because the task has not been pushed to ITSM',
    '无执行凭证': 'No Execution Credentials',
    '无工单': 'No Tickets',
    'NoneTickets': 'No Tickets',
    '标记完成': 'Mark Complete',
    '标记 Complete': 'Mark Complete',
    '不允许完成任务': 'Task Completion Not Allowed',
    '关联工单': 'Related Ticket',
    'Related Ticket': 'Related Ticket',
    '全部闭环': 'All Closed',
    '已全部闭环': 'All Closed',
    '可标记完成': 'Can Mark Complete',
    '可标记 Complete': 'Can Mark Complete',
    '链路状态项': 'Flow Status Items',
    '链路 Statusitems': 'Flow Status Items',
    '当前卡在第': 'Currently blocked at segment',
    '段': 'Segment',
    '本段停留': 'Segment Dwell',
    '自': 'Since',
    '起未流转': 'no transition',
    '任务由 PMS 立项拆解产生，是链路唯一起点。': 'The task is generated from PMS initiation breakdown and is the only starting point of the flow.',
    '任务由 PMS 立 items 拆解产生，Yes 链路唯一起点。': 'The task is generated from PMS initiation breakdown and is the only starting point of the flow.',
    '1 任务 : N 工单，按站点 + 设备类型拆分。': 'One task maps to N tickets, split by site and device type.',
    '本任务无现场派工；设备需求在 ITSM 工单内提出并流转 ITAM 完成采购。此处只读。': 'This task has no field dispatch. Equipment demand is raised in the ITSM ticket and flows to ITAM for procurement. Read-only here.',
    '回写内容': 'Writeback Content',
    '完工附件': 'Completion Attachments',
    '资产到货': 'Asset Arrival',
    'PMS 侧只消费不产生。': 'PMS only consumes this data and does not produce it.',
    '校验未通过': 'Validation Failed',
    '未达成': 'Not Achieved',
    '最近校验': 'Last Validation',
    '计划完成日': 'Planned Completion Date',
    '原': 'Original',
    '已延期': 'Delayed',
    '推送凭证（最近一次）': 'Push Credential (Latest)',
    '推送凭证（最近一 Times）': 'Push Credential (Latest)',
    '推送时间': 'Push Time',
    '推送 Time': 'Push Time',
    '推送人': 'Pushed By',
    '拆分规则': 'Split Rule',
    '拆分 Rules': 'Split Rule',
    '按站点 + 设备类型': 'By Site + Device Type',
    '工单号共': 'Total Ticket Count',
    'Ticket No. Total': 'Total Ticket Count',
    '张': '',
    '拆分依据': 'Split Basis',
    '工单号由 ITSM 生成后回写 PMS，此处只读。': 'Ticket IDs are generated by ITSM and written back to PMS. Read-only here.',
    'Ticket ID 由 ITSM 生成后回写 PMS，此处只读。': 'Ticket IDs are generated by ITSM and written back to PMS. Read-only here.',
    '链路时间线': 'Flow Timeline',
    '链路 Timeline': 'Flow Timeline',
    '推送与回写记录（只读）': 'Push and Writeback Records (Read-Only)',
    '推送任务': 'Push Task',
    '按站点 + 设备类型拆分生成': 'split by site + device type to generate',
    '张执行工单': 'execution tickets',
    '任务完成门控保持关闭': 'task completion gate remains closed',
    '下游派生对象（只读 · 来源 FSM / ITAM 回写）': 'Downstream Derived Objects (Read-Only · Source: FSM / ITAM Writeback)',
    '下游派生对象（只读 · 来源 FSM / ITAM Writeback）': 'Downstream Derived Objects (Read-Only · Source: FSM / ITAM Writeback)',
    '对象类型': 'Object Type',
    'OBJECTTYPE': 'Object Type',
    '上游 ITSM 工单': 'Upstream ITSM Ticket',
    '上游 ITSM TICKET': 'Upstream ITSM Ticket',
    '关联任务': 'Related Task',
    '状态（回写快照）': 'Status (Writeback Snapshot)',
    'STATUS（WRITEBACK 快照）': 'Status (Writeback Snapshot)',
    '只读下钻': 'Read-Only Drilldown',
    '判定需现场实施后派生': 'derived after field implementation is required',
    '工单内提出，流转 ITAM': 'raised in ticket and flowed to ITAM',
    '查看派工': 'View Dispatch',
    'ViewDispatch': 'View Dispatch',
    '查看资产申请': 'View Asset Request',
    'ViewAssets 申请': 'View Asset Request',
    '闭环口径': 'Closure Rule',
    'ITSM 工单状态为「已解决 / 已闭环」计入闭环；存在未闭环工单或尚未推送 ITSM 时，「标记完成」按钮禁用并给出缺项明细。': 'ITSM tickets count as closed when their status is Resolved or Closed. If any ticket is not closed or has not been pushed to ITSM, the Mark Complete button is disabled and missing details are shown.',
    '链路口径': 'Flow Rule',
    '现场派工由 ITSM 判定需现场实施后派生至 FSM；项目设备的资产申请在 ITSM 工单内提出并流转 ITAM 完成采购与调度。以上对象状态经回写链路回到 PMS，PMS 侧只读展示、不产生下游执行动作。此处只读，编辑请到 ITSM / FSM / ITAM 产品。': 'Field dispatch is derived to FSM after ITSM determines field implementation is required. Project equipment asset requests are raised inside ITSM tickets and flow to ITAM for procurement and dispatch. These object statuses return to PMS through writeback. PMS displays them read-only and does not trigger downstream execution. Read-only here; edit in ITSM / FSM / ITAM.',
    'ITSM 执行工单清单': 'ITSM Execution Ticket List',
    'ITSM 执行 Tickets 清单': 'ITSM Execution Ticket List',
    'FSM 现场派工清单': 'FSM Field Dispatch List',
    'FSM Field Dispatch 清单': 'FSM Field Dispatch List',
    'PMS 对外唯一集成出口为 ITSM': 'The only external integration outlet from PMS is ITSM',
    'FSM 现场派工与 ITAM 资产申请由 ITSM 在工单内派生，PMS 侧只读展示，不提供下游干预动作。': 'FSM field dispatch and ITAM asset requests are derived by ITSM inside tickets. PMS displays them read-only and provides no downstream intervention actions.',
    '全局概览': 'Global Overview',
    '模块健康一览': 'Module Health Overview'
  });

  Object.assign(EN_TERMS, {
    '系统': 'System',
    '配置': 'Configuration',
    '我的': 'My',
    '任务': 'Task',
    'M4 应用迁移': 'M4 Application Migration',
    'M3 网络连通验证': 'M3 Network Connectivity Validation',
    '基础信息': 'Basic Information',
    '返回列表': 'Back to List',
    '最后更新：': 'Last Updated:',
    '达成校验：': 'Achievement Validation:',
    '结束时间': 'End Time',
    '回写延迟': 'Writeback Latency',
    '企业微信': 'WeCom',
    '手动创建': 'Manually Created',
    '已创建': 'Created',
    '联系人': 'Contact',
    '子项目': 'Subproject',
    '维护中': 'Under Maintenance',
    '已发货': 'Shipped',
    '测试': 'Test',
    '合同类型': 'Contract Type',
    '入库类型': 'Inbound Type',
    'IP 地址': 'IP Address',
    'SLA 达标率': 'SLA Compliance Rate',
    'L1 自动通过': 'L1 Auto-Approval',
    '证书扫描件': 'Certificate Scan',
    '第 1 段': 'Segment 1',
    '第 2 段': 'Segment 2',
    '第 3 段': 'Segment 3',
    '第 4 段': 'Segment 4',
    '第 5 段': 'Segment 5'
  });

  Object.assign(EN_TERMS, {
    'SLA 达成率': 'SLA Attainment Rate',
    'MSP 治理视角': 'MSP Governance Scope',
    'MSP 治理视角：同屏查看所有租户，审批、SLA、AI 成本按租户汇总': 'MSP Governance Scope: view all tenants on one screen, with approvals, SLA, and AI cost aggregated by tenant',
    '审批、SLA、AI 成本按租户聚合，默认聚焦需要管理介入的风险队列。': 'Approvals, SLA, and AI cost are aggregated by tenant, with a default focus on risk queues requiring management intervention.',
    '风险租户排行': 'At-Risk Tenants Ranking',
    'At-Risk Tenants 排行': 'At-Risk Tenants Ranking',
    '积压审批与 SLA 临近': 'Approval backlog and SLA approaching breach',
    '变更放行等待管理确认': 'Change approval waiting for management confirmation',
    'ChangesApprove 等待 ManagementConfirm': 'Change approval waiting for management confirmation',
    '审批 1': 'Approvals 1',
    '审批 2': 'Approvals 2',
    '前4/共12': 'Top 4 / Total 12',
    '前 4 / 共 12': 'Top 4 / Total 12',
    '审批队列': 'Approval Queue',
    'Approval 队列': 'Approval Queue',
    '全部5': 'All 5',
    '全部 5': 'All 5',
    '紧急2': 'Urgent 2',
    '紧急 2': 'Urgent 2',
    '今日3': 'Today 3',
    '今日 3': 'Today 3',
    'SLA 剩余': 'SLA Remaining',
    'SLA剩余': 'SLA Remaining',
    '窗口': 'Window',
    '低风险': 'Low Risk',
    '白名单命中': 'Whitelist Hit',
    '触发人：': 'Triggered By:',
    '触发人': 'Triggered By',
    '来源：': 'Source:',
    '来源': 'Source',
    'ITOM 告警': 'ITOM Alert',
    'NPM 告警': 'NPM Alert',
    '建议分配：': 'Suggested Assignment:',
    '建议分配': 'Suggested Assignment',
    '建议：': 'Recommendation:',
    '建议': 'Recommendation',
    '预估': 'Estimated',
    '规则': 'Rule',
    '依赖链已计算': 'Dependency Chain Calculated',
    'CMDB 依赖链已计算': 'CMDB Dependency Chain Calculated',
    '查看证据': 'View Evidence',
    'T4 证据链 · AI 起草依据': 'T4 Evidence Chain · AI Drafting Basis',
    '数据来源：': 'Data Source:',
    'CMDB 关联：': 'CMDB Correlation:',
    '历史案例：': 'Historical Case:',
    '模型：': 'Model:',
    '输入：': 'Input:',
    '输出：': 'Output:',
    '关联上下文': 'correlated context',
    '起草工单': 'draft ticket',
    '变更审批': 'Change Approval',
    '核心交换机固件升级': 'Core Switch Firmware Upgrade',
    '影响 CI：': 'Impacted CIs:',
    '批准': 'Approve',
    '确认自动通过': 'Confirm Auto-Approval',
    '自动通过': 'Auto-Approve',
    '已自动审批通过': 'Auto-approval completed',
    '转人工': 'Transfer to Manual Review',
    '转人工审批': 'Transfer to Manual Approval',
    '该请求将转给审批人手工处理（不走自动规则），确认？': 'This request will be routed to an approver for manual handling and will not use the auto rule. Confirm?',
    '已转人工审批队列': 'Moved to manual approval queue',
    '新增白名单规则': 'Add Whitelist Rule',
    '网络组紧急告警自动转单': 'Network Team Emergency Alert Auto-Ticketing',
    '申请人：': 'Applicant:',
    '范围：': 'Scope:',
    '批准白名单规则': 'Approve Whitelist Rule',
    '批准后 P1 网络告警将自动转单给网络运维组（L1 档位），确认？': 'After approval, P1 network alerts will be automatically converted into tickets for the network operations team (L1 tier). Confirm?',
    '白名单规则已生效': 'Whitelist rule is now effective',
    '查看影响': 'View Impact',
    '已展示规则影响范围分析': 'Rule impact scope analysis displayed',
    '拒绝白名单规则': 'Reject Whitelist Rule',
    '拒绝后该规则不会生效。请填写拒绝原因（供 T5 审计留痕）。': 'After rejection, this rule will not take effect. Please provide a rejection reason for T5 audit traceability.',
    '确认拒绝': 'Confirm Rejection',
    '已拒绝 · 原因已记录到 T5 审计': 'Rejected · reason recorded in T5 audit',
    'M1 告警降噪': 'M1 Alert Noise Reduction',
    'M4 变更审批': 'M4 Change Approval',
    '需管理员添加白名单规则': 'requires administrator to add whitelist rule',
    '禁止': 'Forbidden',
    '变更永不自动通过': 'changes never auto-approve',
    '团队效能 · 本周': 'Team Efficiency · This Week',
    '团队效能': 'Team Efficiency',
    '数据来源：CMDB 服务定义 × ITOM': 'Data Source: CMDB service definitions × ITOM',
    'M1 降噪 · 自动合并 63 条告警为 1 组事件': 'M1 Noise Reduction · automatically merged 63 alerts into 1 incident group',
    '审批放行': 'approved release',
    'M5 服务请求 · VPN 续期自动审批（白名单命中）': 'M5 Service Request · VPN renewal auto-approved (whitelist hit)',
    'NEO Agent 应答': 'NEO Agent Response',
    '本月 SLA 达成率': 'SLA attainment rate this month',
    '每日成本统计完成': 'Daily cost statistics completed',
    '昨日总计': 'Yesterday total',
    '未触发预算告警': 'No budget alert triggered',
    '夜班交接': 'Night Shift Handover',
    'AI 生成交接摘要': 'AI-generated handover summary',
    '遗留 3 条未闭告警': '3 unresolved alerts remaining'
  });

  Object.assign(EN_TERMS, {
    'SLA达成率': 'SLA Attainment Rate',
    '全部': 'All',
    '紧急': 'Urgent',
    '要求补充': 'Request Additional Information',
    '预计影响：': 'Estimated Impact:',
    '预计影响': 'Estimated Impact',
    '默认开': 'Enabled by Default',
    '默认': 'Default',
    '需配置': 'Configuration Required',
    '已启用': 'Enabled',
    '不适用': 'Not Applicable',
    '熔断状态': 'Circuit Breaker Status',
    '熔断 Status': 'Circuit Breaker Status',
    '调整阈值': 'Adjust Threshold',
    '调整阈 Value': 'Adjust Threshold',
    '手动触发熔断': 'Manually Trigger Circuit Breaker',
    'Manual Trigger 熔断': 'Manually Trigger Circuit Breaker',
    '阈值': 'Threshold',
    '阈 Value': 'Threshold',
    '待审计': 'Pending Audit',
    '直接使用率': 'Direct Adoption Rate',
    'Override 率': 'Override Rate',
    '一次解决率': 'First-Time Resolution Rate',
    'One-TimeResolve 率': 'First-Time Resolution Rate',
    '服务健康分': 'Service Health Score',
    'ServiceHealth Score': 'Service Health Score',
    'CMDB 服务定义': 'CMDB Service Definition',
    'CMDB ServiceDefinition': 'CMDB Service Definition',
    'CI 健康状态聚合': 'CI health status aggregation',
    '详细账单 →': 'Detailed Bill ->',
    '完整日志 →': 'Full Logs ->',
    '按场景拆分': 'Breakdown by Scenario',
    '按 Scenario 拆分': 'Breakdown by Scenario',
    '预算线': 'Budget Line',
    '上月': 'Last Month',
    '上 Month': 'Last Month',
    '预算': 'Budget',
    '使用': 'Usage',
    '网络运维组': 'Network Operations Team',
    'Network Operations Group': 'Network Operations Team',
    '基础架构组': 'Infrastructure Team',
    '派工现场': 'Dispatch Field Service',
    '中等': 'Medium',
    '风险': 'Risk',
    '账号续期': 'Account Renewal',
    '市场部': 'Marketing Department',
    '类型：': 'Type:',
    '部门：': 'Department:',
    '申请人': 'Applicant',
    '申请人：': 'Applicant:',
    '网络告警': 'Network Alerts',
    '月均': 'Monthly Average',
    '自动转单': 'Auto-Ticketing',
    '治理中心': 'Governance Center',
    'AI 治理中心 →': 'AI Governance Center ->',
    'AI GovernanceMedium 心 →': 'AI Governance Center ->'
  });

  Object.assign(EN_TERMS, {
    'ITSM 运营总览 · 事件 · 问题 · 变更 · 服务效率': 'ITSM Operations Overview · Incidents · Problems · Changes · Service Efficiency',
    '本月新建事件': 'New Incidents This Month',
    '未解决事件': 'Unresolved Incidents',
    'SLA 达标率': 'SLA Compliance Rate',
    'SLA达标率': 'SLA Compliance Rate',
    '平均响应时间': 'Mean Time to Respond',
    '平均解决时间': 'Mean Time to Resolve',
    '首次解决率': 'First-Time Resolution Rate',
    '已解决事件': 'Resolved Incidents',
    '进行中变更': 'Changes in Progress',
    '解决率 84.6%': 'Resolution Rate 84.6%',
    '↑ 12% 环比': '↑ 12% Period over Period',
    '↑ 3.2% 较上月': '↑ 3.2% vs Last Month',
    '↓ 5 分钟 较上月': '↓ 5 min vs Last Month',
    '↓ 0.8h 较上月': '↓ 0.8h vs Last Month',
    '↑ 5.1% 较上月': '↑ 5.1% vs Last Month',
    '紧急 2 · 标准 7': '2 Emergency · 7 Standard',
    '状态统计': 'Status Statistics',
    '事件分类统计': 'Incident Category Statistics',
    '月度新建事件数量统计': 'Monthly New Incident Volume',
    'SLA 达标分布': 'SLA Compliance Distribution',
    '总达标率': 'Overall Compliance Rate',
    '按时完成 229': '229 Completed on Time',
    '轻微超时 12': '12 Slightly Overdue',
    '严重超时 6': '6 Severely Overdue',
    '优先级统计': 'Priority Statistics',
    '各优先级平均解决时间': 'Average Resolution Time by Priority',
    '问题状态统计': 'Problem Status Statistics',
    '总问题': 'Total Problems',
    '变更单状态统计': 'Change Status Statistics',
    '变更单类型统计': 'Change Type Statistics',
    '团队效率排行': 'Team Efficiency Ranking',
    '排名': 'Rank',
    '团队': 'Team',
    '处理工单数': 'Tickets Handled',
    '平均响应': 'Average Response',
    '平均解决': 'Average Resolution',
    '综合评分': 'Overall Score',
    '网络运维组': 'Network Operations Team',
    '系统运维组': 'Systems Operations Team',
    '应用运维组': 'Application Operations Team',
    'DBA组': 'DBA Team',
    '桌面支持组': 'Desktop Support Team',
    '网络': 'Network',
    '应用': 'Application',
    '数据库': 'Database',
    '系统': 'System',
    '硬件': 'Hardware',
    '其他': 'Other',
    '标准': 'Standard',
    '分钟': 'min',
    '运营日报': 'Operations Daily Report',
    '效率诊断': 'Efficiency Diagnostics',
    'SLA复盘': 'SLA Review',
    '团队对比': 'Team Comparison',
    '打开': 'Open',
    '执行': 'Execution',
    '普通': 'Normal',
    '中等 45%': 'Medium 45%',
    'AI 风险：中等 45%': 'AI Risk: Medium 45%',
    'AI 风险:中等 45%': 'AI Risk: Medium 45%',
    '⏱ 窗口': '⏱ Window',
    '预估 30min': 'Estimated 30 min',
    '预估 30 min': 'Estimated 30 min',
    '低风险 · 白名单命中': 'Low Risk · Whitelist Hit',
    'M5 服务请求 低风险 · 白名单命中': 'M5 Service Request Low Risk · Whitelist Hit',
    'AI 建议：自动通过（规则 SR-AUTO-003）': 'AI Recommendation: Auto-Approve (Rule SR-AUTO-003)',
    'AI Recommendation: Auto-Approve（规则 SR-AUTO-003）': 'AI Recommendation: Auto-Approve (Rule SR-AUTO-003)',
    '部门:市场部': 'Department: Marketing Department',
    'Department:市场部': 'Department: Marketing Department',
    '月均 40 次自动转单': 'Monthly average 40 auto-ticket conversions',
    'Estimated Impact:月均 40 次 Auto-Ticketing': 'Estimated Impact: monthly average 40 auto-ticket conversions',
    'T8 · AI 权限矩阵': 'T8 · AI Permission Matrix',
    '= 已启用 · — = 不适用 · 需配置 = 需管理员添加白名单规则 · 禁止 = 变更永不自动通过': '= Enabled · — = Not Applicable · Configuration Required = administrator must add a whitelist rule · Forbidden = changes never auto-approve',
    '= 已启用 · — = 不适用 · 需配置 = requires administrator to add whitelist rule · 禁止 = changes never auto-approve': '= Enabled · — = Not Applicable · Configuration Required = administrator must add a whitelist rule · Forbidden = changes never auto-approve',
    '一次性解决率': 'First-Time Resolution Rate',
    'First-Time Resolution 率': 'First-Time Resolution Rate',
    'First-Time Resolution Rate 率': 'First-Time Resolution Rate',
    '触发': 'Triggered',
    '完成': 'Completed',
    '不采纳': 'Rejected',
    '原因': 'Reason',
    '张明 触发 M3 转单 → AI 起草工单 INC-0812-001': 'Zhang Ming triggered M3 ticket conversion -> AI-drafted ticket INC-0812-001',
    '张明 触发 M3 转单 → AI 起草工单 INC-0812-002': 'Zhang Ming triggered M3 ticket conversion -> AI-drafted ticket INC-0812-002',
    'AI 完成 RCA · Web-Server-01 · 置信度 87%': 'AI completed RCA · Web-Server-01 · confidence 87%',
    'AI 完成 RCA · DB-Master-02 · 连接池泄漏（72%）': 'AI completed RCA · DB-Master-02 · connection pool leak (72%)',
    'AI 完成 RCA · AP-307 · 电源断开（置信度 95%）': 'AI completed RCA · AP-307 · power disconnected (confidence 95%)',
    '王主管 审批放行 · 变更 CHG-20260812-010': 'Manager Wang approved release · change CHG-20260812-010',
    'Override：李伟 不采纳 M2 建议 · 原因"非内存泄漏，是磁盘 I/O"': 'Override: Li Wei rejected the M2 recommendation · reason: "not a memory leak, disk I/O"',
    'Override：夜班陈工 不采纳 M3 派工建议 · 原因"非工时不派工"': 'Override: night-shift engineer Chen rejected the M3 dispatch recommendation · reason: "not billable work, no dispatch"',
    'M1 降噪 · AP 离线自动重启 SOP 执行成功（47s 恢复）': 'M1 Noise Reduction · AP offline auto-restart SOP executed successfully (recovered in 47 s)',
    'M1 降噪 · 日志清理 SOP 执行（磁盘释放 12%）': 'M1 Noise Reduction · log cleanup SOP executed (disk freed 12%)',
    '置信度': 'Confidence',
    '连接池泄漏': 'Connection Pool Leak',
    '电源断开': 'Power Disconnected',
    '审批放行': 'Approved Release',
    '派工建议': 'Dispatch Recommendation',
    '执行成功': 'Executed Successfully',
    '恢复': 'Recovered',
    '磁盘释放': 'Disk Freed'
  });

  Object.assign(EN_TERMS, {
    '报告中心 - EMS NEO': 'Report Center - EMS NEO',
    '平台级报告体系 · 5 类内置报告 · 模板 / 订阅 / 品牌化 / 导出（对齐 08-ai-commercialization §P7）': 'Platform-level reporting system · 5 built-in report types · templates / subscriptions / branding / export (aligned with 08-ai-commercialization §P7)',
    '客户方视图': 'Customer View',
    '客户方视图：仅显示本租户的 SLA 履约报告与客户交付报告（R3/R5）· 新建/删除/订阅配置需管理员权限': 'Customer View: only SLA fulfillment reports and customer delivery reports (R3 / R5) for the current tenant are visible · creating, deleting, and configuring subscriptions requires administrator permissions',
    '报告总数': 'Total Reports',
    '累计 · 5 类报告': 'Cumulative · 5 Report Types',
    '累计': 'Cumulative',
    '本月生成': 'Generated This Month',
    '本月 · 3 租户品牌化交付': 'This Month · 3 Branded Tenant Deliveries',
    '报告目录': 'Report Directory',
    'R1 AI 使用 · R2 AI 合规审计 · R3 SLA 履约 · R4 多租户运营（MSP）· R5 客户交付（品牌化）': 'R1 AI Usage · R2 AI Compliance Audit · R3 SLA Fulfillment · R4 Multi-Tenant Operations (MSP) · R5 Customer Delivery (Branded)',
    '+ 新建报告（AI 起草）': '+ Create Report (AI Drafting)',
    '新建报告（AI 起草）': 'Create Report (AI Drafting)',
    '全部租户（MSP 视角）': 'All Tenants (MSP View)',
    '跨租户汇总': 'Cross-Tenant Summary',
    '全部租户 · 按租户汇总报告数量、交付状态与报告类型': 'All tenants · report count, delivery status, and report type summarized by tenant',
    '生成时间': 'Generated At',
    'R5 · 待验收数据回传（FSM-2026-142）· 到达后自动起草': 'R5 · awaiting acceptance data writeback (FSM-2026-142) · auto-drafted after arrival',
    '待生成 · 等数据': 'Pending Generation · Awaiting Data',
    '立即生成': 'Generate Now',
    '已手动触发 · 数据未齐时进入排队（原型演示）': 'Manually triggered · queued when data is incomplete (prototype demo)',
    '8 月 AI 使用报告': 'August AI Usage Report',
    '7 月 AI 合规审计报告': 'July AI Compliance Audit Report',
    'Q3 周大福 SLA 履约报告': 'Q3 CTF SLA Fulfillment Report',
    '8 月多租户运营报告': 'August Multi-Tenant Operations Report',
    '达美乐门店网络改造验收报告': 'Domino Store Network Renovation Acceptance Report',
    '美心MX 8 月 AI 使用报告': 'Maxim MX August AI Usage Report',
    'credits 消耗 · AI 建议直接使用率 · M1-M6 KPI': 'credits consumption · AI recommendation direct adoption rate · M1-M6 KPIs',
    'T1 审批 · T5 审计 · T6 override · 防护统计': 'T1 approvals · T5 audit · T6 override · protection statistics',
    'SLA 达标率 · 工单时效 · 响应/解决分布': 'SLA compliance rate · ticket timeliness · response / resolution distribution',
    '4 租户工单/资产/项目/AI 用量/转售利润': '4-tenant tickets / assets / projects / AI usage / resale margin',
    'PRJ-2026-003 · AI 起草 + PM 审批交付': 'PRJ-2026-003 · AI drafted + PM-approved delivery',
    'credits 接近配额 · 告警已触发': 'credits near quota · alert triggered',
    'R1 AI 使用': 'R1 AI Usage',
    'R1 · AI 使用报告': 'R1 · AI Usage Report',
    'R2 AI 合规审计': 'R2 AI Compliance Audit',
    'R2 · AI 合规审计报告': 'R2 · AI Compliance Audit Report',
    'R3 SLA 履约': 'R3 SLA Fulfillment',
    'R3 · SLA 履约报告': 'R3 · SLA Fulfillment Report',
    'R4 多租户运营': 'R4 Multi-Tenant Operations',
    'R4 · 多租户运营报告': 'R4 · Multi-Tenant Operations Report',
    'R5 客户交付': 'R5 Customer Delivery',
    'R5 · 客户交付报告': 'R5 · Customer Delivery Report',
    '另存为模板': 'Save as Template',
    '已复制为新模板草稿（原型演示）': 'Copied as a new template draft (prototype demo)',
    '删除草稿': 'Delete Draft',
    '确认删除报告 RPT-2026-0181 草稿？删除后不可恢复。': 'Confirm deleting report draft RPT-2026-0181? This action cannot be undone.',
    '草稿已删除（原型演示）': 'Draft deleted (prototype demo)',
    '报告已导出 PDF（品牌化 · 记录 T5 审计 · 原型演示）': 'Report exported as PDF (branded · recorded in T5 audit · prototype demo)',
    '已导出 CSV（记录 T5 审计 · 原型演示）': 'CSV exported (recorded in T5 audit · prototype demo)',
    '交付记录': 'Delivery Record',
    '交付记录：08-01 邮件发送至合规部（原型演示）': 'Delivery record: email sent to Compliance on 08-01 (prototype demo)',
    '报告模板': 'Report Templates',
    '5 类内置模板（数据来自权威口径：T2 账单 / M1-M6 KPI / SLA 数据）· 新建规则 = 选择模板 + 配置客户品牌/章节/调度': '5 built-in templates (data from authoritative sources: T2 billing / M1-M6 KPIs / SLA data) · create rule = select template + configure customer branding / sections / schedule',
    '+ 基于内置模板新建规则': '+ Create Rule from Built-In Template',
    '基于内置模板新建规则': 'Create Rule from Built-In Template',
    '模板详情：章节 6 · 指标 18 · 版本 v1.2（原型演示）': 'Template details: 6 sections · 18 metrics · version v1.2 (prototype demo)',
    '模板详情：章节 5 · 含防护统计与保留期声明（原型演示）': 'Template details: 5 sections · includes protection statistics and retention statement (prototype demo)',
    '模板详情：章节 4 · 合同周期对齐（原型演示）': 'Template details: 4 sections · aligned with contract cycle (prototype demo)',
    '模板详情：章节 5 · 含 AI 转售利润（原型演示）': 'Template details: 5 sections · includes AI resale margin (prototype demo)',
    '模板详情：品牌化占位 · logo/抬头/页脚/配色（原型演示）': 'Template details: branding placeholders · logo / header / footer / colors (prototype demo)',
    'credits 消耗（池/超量/状态机）· 场景分布 · AI 建议直接使用率 · override 率 · M1-M6 效果 KPI': 'credits consumption (pool / overage / state machine) · scenario distribution · AI recommendation direct adoption rate · override rate · M1-M6 outcome KPIs',
    'T1 审批记录 · T5 审计摘要 · T6 override · 防护统计 · 脱敏命中 · 保留期声明': 'T1 approval records · T5 audit summary · T6 override · protection statistics · masking hits · retention statement',
    '项目/租户 SLA 达标率 · 工单时效 · 响应/解决时间分布 · 违约事件': 'Project / tenant SLA compliance rate · ticket timeliness · response / resolution time distribution · breach events',
    '每租户工单/资产/项目/AI 用量/AI 转售利润 · 跨租户对比（MSP 管理层）': 'Per-tenant tickets / assets / projects / AI usage / AI resale margin · cross-tenant comparison (MSP management)',
    'MSP 给最终客户的品牌化报告 · AI 起草 + PM 审批后交付 · 验收数据': 'Branded reports delivered by MSP to end customers · AI drafted + delivered after PM approval · acceptance data',
    '订阅与定时生成': 'Subscriptions and Scheduled Generation',
    '生成完成自动进入 我的待办 审批队列（对齐 06 §P5 项目事件类型）': 'After generation, reports automatically enter the Work Queue approval queue (aligned with 06 §P5 project event types)',
    'AI 使用月报 · 全部租户': 'AI Usage Monthly Report · All Tenants',
    'R1 模板 · 每月 1 日 09:00 生成 · 交付：租户 IT 主管 + 财务': 'R1 template · generated monthly on day 1 at 09:00 · delivered to tenant IT lead + finance',
    '月报 · 4 租户': 'Monthly Report · 4 Tenants',
    'AI 合规审计月报': 'AI Compliance Audit Monthly Report',
    'R2 模板 · 每月 1 日 09:00 生成 · 交付：各租户合规/法务': 'R2 template · generated monthly on day 1 at 09:00 · delivered to each tenant compliance / legal team',
    '多租户运营周报': 'Multi-Tenant Operations Weekly Report',
    'R4 模板 · 每周一 09:00 生成 · 交付：MSP 管理层 · BM': 'R4 template · generated every Monday at 09:00 · delivered to MSP management · BM',
    'R3 模板 · 合同周期 · 交付：客户门户 + 邮件': 'R3 template · contract cycle · delivered via customer portal + email',
    '订阅已启用 · 下次按时生成': 'Subscription enabled · next run will generate on schedule',
    '订阅已暂停（原型演示）': 'Subscription paused (prototype demo)',
    '订阅已创建 · 下次生成 2026-09-01 09:00 · 生成后进入 我的待办 审批': 'Subscription created · next generation at 2026-09-01 09:00 · enters Work Queue approval after generation',
    '品牌化策略': 'Branding Strategy',
    'MSP 品牌资产': 'MSP Brand Assets',
    'MSP 品牌资产 · R3/R5 交付客户报告未指定客户品牌时默认使用': 'MSP brand assets · used by default when R3 / R5 customer delivery reports do not specify a customer brand',
    '应用于直接客户的 R1/R2/R4 报告': 'Applied to R1 / R2 / R4 reports for direct customers',
    '三层品牌：EMS NEO 平台品牌（R1/R2/R4 固定）→ MSP 品牌资产（本区块配置，交付客户报告默认值）→ 客户品牌（规则级覆盖，MSP 为周大福 / 达美乐等客户各建一条规则配其抬头与 Logo）· 权限与隔离：MSP 只能看自己租户的报告 · 客户方角色只能看自己租户的 R3/R5 · 报告导出进入 T5 审计': 'Three-tier branding: EMS NEO platform brand (fixed for R1 / R2 / R4) -> MSP brand assets (configured here, default for customer delivery reports) -> customer brand (rule-level override; MSP creates one rule per customer such as CTF / Domino with its own header and logo) · permissions and isolation: MSP can only view reports in its own tenant · customer roles can only view their own R3 / R5 reports · report exports enter T5 audit',
    '支持 {模板名} {日期} {租户名} 模板变量 · 生成时自动替换': 'Supports {template name}, {date}, and {tenant name} template variables · automatically replaced during generation',
    '显示在交付客户报告的封面与页眉': 'Displayed on the cover and header of delivered customer reports',
    '本报告由季冠 EMS NEO 系统自动生成 · 导出记录 T5 审计': 'This report is automatically generated by JG EMS NEO · export recorded in T5 audit',
    'R3 SLA 履约报告（交付客户）': 'R3 SLA Fulfillment Report (Customer Delivery)',
    'R5 客户交付报告（交付客户）': 'R5 Customer Delivery Report (Customer Delivery)',
    '全部报告（含 R1/R2/R4 · 会覆盖 EMS NEO 平台品牌）': 'All Reports (including R1 / R2 / R4 · overrides EMS NEO platform brand)',
    'R1/R2/R4 为平台内运营报告，默认 EMS NEO 品牌；勾选"全部报告"则全部白标': 'R1 / R2 / R4 are in-platform operations reports and use EMS NEO branding by default; selecting "All Reports" applies white-label branding to all',
    'MSP 品牌资产已保存 · 交付客户报告（R3/R5）默认使用（记录 T5 审计 · 原型演示）': 'MSP brand assets saved · used by default for customer delivery reports (R3 / R5) (recorded in T5 audit · prototype demo)',
    '显示全部报告': 'Show All Reports',
    '已过滤：AI 起草中': 'Filtered: AI Drafting',
    '已过滤：本月报告': 'Filtered: Reports This Month',
    '已过滤：已交付': 'Filtered: Delivered',
    '当前显示 ': 'Currently showing ',
    ' 份报告 · 统计口径仅限该租户': ' reports · statistics limited to this tenant',
    '全部租户 · ': 'All Tenants · '
  });

  Object.assign(EN_TERMS, {
    '仅显示本租户的 SLA 履约报告与客户交付报告（R3/R5）· 新建/删除/订阅配置需管理员权限': 'Only SLA fulfillment reports and customer delivery reports (R3 / R5) for the current tenant are visible · creating, deleting, and configuring subscriptions requires administrator permissions',
    '仅显示本租户的 SLA 履约报告与客户 Delivery Report（R 3/R 5）· 新建/删除/订阅配置需管理员权限': 'Only SLA fulfillment reports and customer delivery reports (R3 / R5) for the current tenant are visible · creating, deleting, and configuring subscriptions requires administrator permissions',
    '报告': 'Report',
    '交付对象': 'Delivery Object',
    'DELIVERYOBJECT': 'Delivery Object',
    '依赖详情': 'Dependency Details',
    '依赖 Details': 'Dependency Details',
    '提交审批': 'Submit Approval',
    'SubmitApproval': 'Submit Approval',
    '月报': 'Monthly Report',
    'Month 报': 'Monthly Report',
    '周报': 'Weekly Report',
    '季报': 'Quarterly Report',
    '合同周期': 'Contract Period',
    '合同 Period': 'Contract Period',
    '定时': 'Scheduled',
    '手动': 'Manual',
    '8 月 · 定时 + 手动': 'August · Scheduled + Manual',
    '8 Month · 定时 + Manual': 'August · Scheduled + Manual',
    'AI 起草中': 'AI Drafting',
    'AI DraftingMedium': 'AI Drafting',
    '待 PM 审批': 'Pending PM Approval',
    'A 3 Agent · 待 PM Approval': '3 Agents · Pending PM Approval',
    '打开 Work Queue 审批': 'Open Work Queue Approval',
    'Open Work Queue Approval': 'Open Work Queue Approval',
    '内置': 'Built-In',
    '按需': 'On Demand',
    '内置 v1.2 · 月报': 'Built-In v1.2 · Monthly Report',
    '内置 v1.1 · 月报+按需': 'Built-In v1.1 · Monthly Report + On Demand',
    '内置 v1.0 · 合同周期': 'Built-In v1.0 · Contract Period',
    '内置 v1.1 · 月报': 'Built-In v1.1 · Monthly Report',
    '下次': 'Next Run',
    '下次：': 'Next Run:',
    '下 Times:': 'Next Run:',
    '新建订阅': 'Create Subscription',
    '+ 新建订阅': '+ Create Subscription',
    '+ Create 订阅': '+ Create Subscription',
    'SLA 履约季报 · 周大福': 'SLA Fulfillment Quarterly Report · CTF',
    '品牌化（MSP 白标）': 'Branding (MSP White Label)',
    '品牌化（MSP 白标)': 'Branding (MSP White Label)',
    'MSP 品牌资产（Logo / 名称 / 默认页眉页脚）与白标范围 · 客户专属品牌在报表规则编辑页按客户覆盖': 'MSP brand assets (logo / name / default header and footer) and white-label scope · customer-specific branding is overridden by customer in report rule editing',
    'Edit MSP 品牌': 'Edit MSP Brand',
    '编辑 MSP 品牌': 'Edit MSP Brand',
    'CreateReportRule': 'Create Report Rule',
    '报告起草': 'Report Drafting',
    'AI 起草交付/月报': 'AI Drafting for Delivery / Monthly Reports',
    'AI DraftingDelivery/Month 报': 'AI Drafting for Delivery / Monthly Reports',
    '报告摘要': 'Report Summary',
    '多报告要点摘要': 'Multi-Report Key Point Summary',
    '按模板起草本月 AI 使用报告': 'Draft this month AI usage report from template',
    '汇总本月各租户报告要点': 'Summarize this month report highlights across tenants',
    '合规部': 'Compliance Department',
    'Compliance 部': 'Compliance Department',
    '品牌化': 'Branded',
    '品牌与格式': 'Brand and Format',
    '页眉': 'Header',
    '页脚': 'Footer',
    '抬头': 'Letterhead',
    '配色': 'Color Theme',
    '模板名': 'Template Name',
    '日期': 'Date',
    '租户名': 'Tenant Name'
  });

  Object.assign(EN_TERMS, {
    '平台运营看板': 'Platform Operations Dashboard',
    'NOC 监控中心': 'NOC Monitoring Center',
    '客户视图': 'Customer View',
    '租户切换（默认全部租户 · 2026-08-20 产品决策：租户为数据维度非页面维度）': 'Tenant switcher (defaults to all tenants · 2026-08-20 product decision: tenant is a data dimension, not a page dimension)',
    '档位/阀值可在 NEO Agent Hub · 治理 配置': 'Tier / threshold can be configured in NEO Agent Hub · Governance',
    '网络可用性': 'Network Availability',
    '整体可用性': 'Overall Availability',
    '达标': 'On Target',
    'AI 降噪率': 'AI Noise Reduction Rate',
    'AI 跨模块洞察': 'AI Cross-Module Insights',
    '[根因定位]': '[Root Cause]',
    '已自动关联 GBA-SZ-Core-SW01 发出的 63 条告警为 1 组根因事件：OSPF 邻居震荡导致下联 12 台接入交换机批量告警': 'Automatically correlated 63 alerts from GBA-SZ-Core-SW01 into one root-cause incident: OSPF neighbor flapping triggered batch alerts across 12 downstream access switches',
    '[容量预警]': '[Capacity Warning]',
    'DB-Master-02 磁盘空间线性增长，预计 14 天后可用率低于 10%，建议立即扩容或清理归档日志': 'DB-Master-02 disk usage is growing linearly; available capacity is projected to fall below 10% in 14 days. Expand capacity or clean archived logs immediately',
    '[降噪报告]': '[Noise Reduction Report]',
    '今日共收到 2,847 条原始告警，AI 引擎降噪后保留 293 条有效告警 → 降噪率 89.7%，较上周提升 2.1%': '2,847 raw alerts received today; after AI noise reduction, 293 actionable alerts remain -> noise reduction rate 89.7%, up 2.1% from last week',
    '[自动修复]': '[Auto Remediation]',
    'HKT-GBA-Retail-AP-037 离线告警已自动执行重启 SOP，设备 47 秒后恢复在线，无人工介入': 'HKT-GBA-Retail-AP-037 offline alert automatically executed the restart SOP; the device recovered online after 47 seconds with no manual intervention',
    'L1 自动执行': 'L1 Whitelist',
    '· 默认 L2 半自动，客户开启白名单后才自动执行 · 可在': '· default L2 semi-automated; automatic execution only after the customer enables the whitelist · can be disabled in',
    '关闭': 'Closed',
    '处理组': 'Assignment Group',
    '事件分类': 'Incident Category',
    '客户/地点': 'Customer / Location',
    '催单状态': 'Reminder Status',
    '是否超时': 'Overdue',
    '预计空闲': 'Estimated Available',
    '风险提示': 'Risk Tip',
    '当前任务 / 位置': 'Current Task / Location',
    'ITOM 监控': 'ITOM Monitoring',
    'ITOM 监控中心': 'ITOM Monitoring Center',
    '基础设施与告警管理': 'Infrastructure and Alert Management',
    '进入告警中心 →': 'Open Alert Center ->',
    '监控主机': 'Monitored Hosts',
    '紧急告警': 'Critical Alerts',
    '重要告警': 'Major Alerts',
    '今日已恢复': 'Recovered Today',
    '降噪命中率': 'Noise Reduction Hit Rate',
    '配置管理数据库': 'Configuration Management Database',
    '进入 CI 资产 →': 'Open CI Assets ->',
    '关系数': 'Relationship Count',
    '质量评分': 'Quality Score',
    '数据库实例': 'Database Instances',
    '自动发现覆盖率': 'Auto-Discovery Coverage',
    'IT 服务管理': 'IT Service Management',
    '进入事件管理 →': 'Open Incident Management ->',
    '平均解决时长': 'Mean Time to Resolve',
    'P1 事件': 'P1 Incidents',
    'P2 事件': 'P2 Incidents',
    '待审批变更': 'Pending Change Approvals',
    '本周已关闭': 'Closed This Week',
    '网络性能监控': 'Network Performance Monitoring',
    '进入网络质量 →': 'Open Network Quality ->',
    '平均延迟': 'Average Latency',
    '链路异常': 'Link Anomalies',
    '端口可用率': 'Port Availability',
    '最近跨模块活动': 'Recent Cross-Module Activity',
    'MSP 视角：全部租户同屏汇总，统计按租户分组，不要求切换租户': 'MSP view: all tenants summarized in one view; metrics are grouped by tenant without requiring tenant switching',
    'MSP 活动范围': 'MSP Activity Scope',
    '最近 2 小时跨模块活动覆盖全部租户，按影响范围与风险级别聚合。': 'Cross-module activity from the last 2 hours covers all tenants and is aggregated by impact scope and risk level.',
    '活动': 'Activities',
    'SLA 风险': 'SLA Risk',
    '高风险项目': 'High-Risk Projects',
    '风险租户排行': 'At-Risk Tenants Ranking',
    '前 3 / 共 12 · 告警 / 工单 / SLA': 'Top 3 / Total 12 · Alerts / Tickets / SLA',
    '香港站点积压，SLA 临近': 'Hong Kong site backlog; SLA approaching breach',
    '生产告警集中，变更待确认': 'Production alerts concentrated; change pending confirmation',
    '现场派工等待确认': 'Field dispatch waiting for confirmation',
    '告警 26': 'Alerts 26',
    '告警 48': 'Alerts 48',
    '告警 31': 'Alerts 31',
    '工单 16': 'Tickets 16',
    '工单 17': 'Tickets 17',
    '工单 9': 'Tickets 9',
    '模块': 'Module',
    '事件': 'Event',
    '关联': 'Linked Entity',
    'web-prod-01 CPU 使用率超过 95%': 'web-prod-01 CPU usage exceeded 95%',
    '已自动创建': 'Auto-Created',
    '自动发现任务完成，新增': 'Auto-discovery task completed, added',
    '28 个 CI': '28 CIs',
    '查看详情': 'View Details',
    '变更': 'Change',
    '审批通过': 'Approved',
    '影响 47 台设备': 'Impacts 47 Devices',
    '核心交换机': 'Core switch',
    '端口流量异常': 'abnormal port traffic',
    '已关联': 'Linked',
    '磁盘空间不足（剩余 3%）': 'insufficient disk space (3% remaining)',
    '处理中': 'In Progress',
    '派生预防性硬件检查': 'derived preventive hardware inspection',
    '现场体检': 'field health check',
    '待确认': 'Pending Confirmation',
    '全部租户（MSP 视角）': 'All Tenants (MSP View)',
    '租户切换：默认全部租户 · 选择具体客户后显示该客户视图（客户管理员账号由 MSP 开放 · 可自行配置所看数据）': 'Tenant switcher: defaults to all tenants · select a customer to view that customer dashboard (customer administrator access is enabled by the MSP · visible data is configurable)',
    '提交服务请求': 'Submit Service Request',
    '工单总数': 'Total Tickets',
    '全部租户 · 处理中 13': 'All Tenants · 13 In Progress',
    '在管项目': 'Managed Projects',
    '执行中 8 · 出海 2': '8 In Progress · 2 Overseas',
    '长期托管/运维类口径': 'Long-term managed services / operations scope',
    '已交付 56': '56 Delivered',
    '本月工时': 'Hours This Month',
    '可计费 881h': 'Billable 881h',
    '备件服务 SLA': 'Spare Parts Service SLA',
    '新加坡 · 香港备件仓': 'Singapore · Hong Kong spare parts warehouses',
    '我的工单': 'My Tickets',
    '全部工单 →': 'All Tickets ->',
    '工单号': 'Ticket ID',
    'SLA 剩余': 'SLA Remaining',
    'Web 服务器 CPU 过载（新加坡站点）': 'Web Server CPU Overload (Singapore Site)',
    '用户登录异常（SG 电商平台）': 'User Login Anomaly (SG E-Commerce Platform)',
    '数据库磁盘空间告警': 'Database Disk Space Alert',
    'API 网关响应超时（法兰克福）': 'API Gateway Response Timeout (Frankfurt)',
    '邮件服务异常（上海）': 'Mail Service Anomaly (Shanghai)',
    '待确认': 'Pending Confirmation',
    '已解决': 'Resolved',
    '全部报告 →': 'All Reports ->',
    '交付时间': 'Delivered At',
    '第一阶段交付报告': 'Phase 1 Delivery Report',
    '新加坡搬迁运维月报（7 月）': 'Singapore Relocation Operations Monthly Report (July)',
    '季度 SLA 报告（Q2）': 'Quarterly SLA Report (Q2)',
    '法兰克福托管运维月报（7 月）': 'Frankfurt Managed Operations Monthly Report (July)',
    '客户管理员可自行配置所看数据 · 工单/项目/报告数据与各产品域实时一致': 'Customer administrators can configure visible data · ticket / project / report data stays real-time consistent with each product domain',
    '项目进度': 'Project Progress',
    '全部项目 →': 'All Projects ->',
    '风险': 'Risk',
    '整体进度': 'Overall Progress',
    '当前里程碑：': 'Current Milestone: ',
    '备件保障：': 'Spare Parts Assurance: ',
    '新加坡备件仓前置 · 4 小时到场 SLA · 仓储续约': 'Singapore spare parts warehouse staged locally · 4-hour onsite SLA · warehouse renewal',
    '到期（AI 已起草续约变更）': 'expires (AI has drafted the renewal change)',
    '今日 AI 成本': 'AI Cost Today',
    '· 每次调用记录': '· per-call logging',
    '12,847 次调用 · DeepSeek 37% · GPT-4o 35% · Claude 28%': '12,847 calls · DeepSeek 37% · GPT-4o 35% · Claude 28%',
    'AI 建议直接使用率 / Override 率': 'AI Recommendation Direct Adoption Rate / Override Rate',
    '· 近 7 日': '· Last 7 Days',
    'Override 8.2% · 待审批 4.5% · 上周 70.5%': 'Override 8.2% · Pending Approval 4.5% · Last Week 70.5%',
    'Agent 调用分布': 'Agent Call Distribution',
    '熔断状态': 'Circuit Breaker Status',
    '正常': 'Normal',
    '成本 17% · 错误率 0.3%': 'Cost 17% · Error Rate 0.3%',
    '阈值：成本 80% 熔断（降级 L3）· 错误率 10% 熔断 · 预算 80% 告警': 'Thresholds: cost 80% circuit breaker (downgrade to L3) · error rate 10% circuit breaker · budget 80% alert',
    'AI 治理与运营数据总览。': 'AI Governance and Operations Data Overview.',
    '一线运维用': 'Frontline operations uses',
    '提问；IT 主管 / 财务 / 合规看': 'for questions; IT leads / finance / compliance use',
    '；DevOps / 平台管理员管': '; DevOps / platform administrators manage',
    '档位口径：L1 自动执行 / L2 手工确认 / L3 多层审批': 'Tier definitions: L1 automatic execution / L2 manual confirmation / L3 multi-level approval',
    '原型说明': 'Prototype Note',
    '档位口径': 'Tier Definition',
    '档位分级（L1/L2/L3）为产品 AI 执行控制口径：L1 自动执行（命中已审批白名单）· L2 手工确认（AI 起草、人工确认）· L3 多层审批（按配置节点顺序审批）。不做 L0 无人值守。': 'Tiering (L1 / L2 / L3) defines AI execution controls: L1 automatic execution (approved whitelist match) · L2 manual confirmation (AI drafts, human confirms) · L3 multi-level approval (sequential configured approvers). No L0 unattended mode.',
    '数字角标 ① 及本卡片均为原型阶段补充说明，非系统功能 UI。开发实现时需移除。': 'Numeric marker ① and this card are prototype notes, not product UI. Remove during implementation.',
    '导出合规报告': 'Export Compliance Report',
    '配置预算 / 熔断': 'Configure Budget / Circuit Breaker',
    'Agent KPI 达成情况': 'Agent KPI Achievement',
    '14 个内置 Agent（7 场景 + A1-A7 平台通用）· 目标 / 现值 / 状态': '14 built-in agents (7 scenarios + A1-A7 platform-wide) · target / current value / status',
    'KPI 目标值与回填口径': 'KPI Targets and Backfill Method',
    '目标值均为 v1 交付门槛，现值为原型演示数据。上线后由 ≥3 家 POC 客户（SMB / 中大型 / 特殊行业各 1 家）30-90 天实测回填，客户侧对比三项指标：告警首响时间 · 工单闭环耗时 · 单日处理工单数。验收门槛：每场景 3 项 KPI 至少 2 项达目标。': 'Targets are v1 delivery thresholds; current values are prototype demo data. After launch, values are backfilled from 30-90 days of measurements across at least 3 POC customers (SMB / mid-large / special industry). Customer-side comparison uses three metrics: alert first-response time · ticket closure time · daily tickets handled. Acceptance threshold: at least 2 of 3 KPIs meet target per scenario.',
    '数字角标 ② 及本卡片均为原型阶段补充说明，非系统功能 UI。开发实现时需移除。': 'Numeric marker ② and this card are prototype notes, not product UI. Remove during implementation.',
    '→ 治理 · 场景配置': '-> Governance · Scenario Configuration',
    '场景': 'Scenario',
    '档位': 'Tier',
    '本周调用': 'Calls This Week',
    '核心 KPI': 'Core KPI',
    '目标': 'Target',
    '成本': 'Cost',
    '待审批快照': 'Pending Approval Snapshot',
    'L2 手工确认': 'L2 Draft-and-Approve',
    '全部 23 →': 'All 23 ->',
    '转工单': 'Ticket Conversion',
    '触发人：张伟 · 09:47 · P1': 'Triggered by: Zhang Wei · 09:47 · P1',
    '驳回': 'Reject',
    '放行': 'Approve Release',
    '固件升级': 'Firmware Upgrade',
    '发起：王芳 · 风险 45% 中等 · 09:38': 'Initiated by: Wang Fang · Risk 45% Medium · 09:38',
    '批准': 'Approve',
    '服务请求': 'Service Request',
    '类型：权限 · 高风险 · 需人工 · 09:18': 'Type: Permission · High Risk · Manual Review Required · 09:18',
    '快速操作': 'Quick Actions',
    '高频操作 · Portal 一键': 'Frequent actions · one-click from Portal',
    '查看本月账单': 'View Monthly Bill',
    '商业计费 · 租户方案 · 分模型下钻（对内成本分析见 AI 治理 T2）': 'Commercial billing · tenant plans · drill down by model (internal cost analysis is in AI Governance T2)',
    '导出合规审计报告': 'Export Compliance Audit Report',
    '近 30 日 · 审批 + 审计 + 人工推翻 + 账单全打包': 'Last 30 days · approvals + audit + manual overrides + billing packaged together',
    '调整预算 / 熔断阈值': 'Adjust Budget / Circuit Breaker Thresholds',
    '成本 % + 错误率 % · 熔断降级到 L3': 'Cost % + error rate % · circuit breaker downgrades to L3',
    '模型 & Agent 平台': 'Model & Agent Platform',
    '接入配置 · Agent 库 · Skills · EMS CLI': 'Integration settings · Agent library · Skills · EMS CLI',
    '系统内置': 'Built-In',
    '编辑': 'Edit',
    '看板设置': 'Dashboard Settings'
  });

  Object.assign(EN_TERMS, {
    '告警降噪 Agent': 'Alert Noise Reduction Agent',
    '根因分析 Agent': 'Root Cause Analysis Agent',
    '工单起草 Agent': 'Ticket Drafting Agent',
    '文本理解与标签 Agent': 'Text Understanding and Tagging Agent',
    '知识检索与推荐 Agent': 'Knowledge Retrieval and Recommendation Agent',
    '摘要与文档生成 Agent': 'Summary and Document Generation Agent',
    '风险评估 Agent': 'Risk Assessment Agent',
    '对话助手 Agent': 'Conversation Assistant Agent',
    '数据质量巡检 Agent': 'Data Quality Inspection Agent',
    '资产巡检 Agent': 'Asset Inspection Agent',
    '调度推荐 Agent': 'Dispatch Recommendation Agent',
    '容量预测 Agent': 'Capacity Forecast Agent',
    '链路健康 Agent': 'Link Health Agent',
    '告警降噪': 'Alert Noise Reduction',
    '根因分析': 'Root Cause Analysis',
    '工单起草': 'Ticket Drafting',
    '知识检索 A2': 'Knowledge Retrieval A2',
    '风险评估 A4': 'Risk Assessment A4',
    '摘要生成 A3': 'Summary Generation A3',
    '文本理解 A1': 'Text Understanding A1',
    '链路健康': 'Link Health',
    '调度推荐 A7': 'Dispatch Recommendation A7',
    '对话助手 A6': 'Conversation Assistant A6',
    '数据巡检 A5': 'Data Inspection A5',
    '资产巡检': 'Asset Inspection',
    '容量预测': 'Capacity Forecast',
    'ITOM 降噪页 · 告警流入自动 · L1': 'ITOM noise reduction page · automatic on alert inflow · L1',
    '告警详情 RCA 工作台 · 事件组确认后 · L3': 'Alert detail RCA workspace · after incident group confirmation · L3',
    '转单流水线 · L2 手工确认': 'Ticket conversion pipeline · L2 approval',
    '全局 ⌘K + 右下角 · L3': 'Global ⌘K + bottom-right entry · L3',
    'ITSM 工单详情 · 新建/描述保存 · L3': 'ITSM ticket detail · create / description save · L3',
    'ITSM 工单 + FSM 单据 · 保存时 · L3': 'ITSM tickets + FSM records · on save · L3',
    '工单评论/关闭触发 · L2': 'Triggered by ticket comment / closure · L2',
    'ITSM 变更详情 + 每日聚类 · L2': 'ITSM change detail + daily clustering · L2',
    '自助服务 + 外勤语音 · L3': 'Self-service + field voice · L3',
    'ITAM 台账 · 每日定时 + 手动 · L3': 'ITAM ledger · daily schedule + manual run · L3',
    'CMDB 资产页 · 每日定时 + 手动 · L3': 'CMDB assets page · daily schedule + manual run · L3',
    'FSM 派工推荐卡 + ITSM 待指派 · 派单时自动 · L2': 'FSM dispatch recommendation card + ITSM pending assignment · automatic during dispatch · L2',
    'ITOM 容量页 · 定时 + 手动 · L1': 'ITOM capacity page · scheduled + manual · L1',
    'NPM 质量页 · 拨测数据自动分析 · L3': 'NPM quality page · automatic synthetic monitoring analysis · L3',
    '降噪 89.7%': 'Noise Reduction 89.7%',
    '精准率 86.4%': 'Precision 86.4%',
    'Top3 命中 73.4%': 'Top 3 Hit Rate 73.4%',
    '分单 91.2%': 'Routing 91.2%',
    '快捷卡命中 82%': 'Quick Card Hit Rate 82%',
    '标签命中 92.4%': 'Tag Hit Rate 92.4%',
    '推荐直接使用 87.6%': 'Recommendation Direct Adoption 87.6%',
    '摘要直接使用 90.1%': 'Summary Direct Adoption 90.1%',
    '风险覆盖 78%': 'Risk Coverage 78%',
    '自助闭环 61%': 'Self-Service Closure 61%',
    '检出异常 87': 'Detected Exceptions 87',
    '检出异常 156': 'Detected Exceptions 156',
    '派工直接使用 88%': 'Dispatch Direct Adoption 88%',
    '预警命中 12': 'Warning Hits 12',
    '预警 8 次': '8 Warnings',
    '运营监控 →': 'Operations Monitoring ->',
    '精准率 ≥ 85%': 'Precision ≥ 85%',
    '巡检 ≥ 100 次/周': 'Inspection ≥ 100 times/week',
    '巡检 ≥ 120 次/周': 'Inspection ≥ 120 times/week',
    '命中 ≥ 10': 'Hits ≥ 10',
    '预警准确 ≥ 90%': 'Warning Accuracy ≥ 90%',
    '优秀': 'Excellent',
    '△ 差 2%': '△ 2% Gap',
    '未授权': 'Unlicensed',
    'L1 自动执行': 'L1 Whitelist',
    '运行中': 'Running',
    '熔断降级': 'Circuit Breaker Downgrade',
    '已暂停': 'Paused',
    '平台通用': 'Platform-Wide',
    'CMDB 自建': 'CMDB Custom',
    'ITOM 自建': 'ITOM Custom',
    'NPM/FSM 自建': 'NPM / FSM Custom',
    '告警流入自动触发（实时）': 'Automatically triggered by alert inflow (real-time)',
    '事件组确认后自动 + 手动重跑': 'Automatic after incident group confirmation + manual rerun',
    'L2 手工确认触发': 'Triggered by L2 manual confirmation',
    '对话触发（⌘K / 右下角）': 'Conversation trigger (⌘K / bottom-right entry)',
    '每日定时 + 手动运行': 'Daily schedule + manual run',
    '拨测数据自动分析（跟随拨测任务）': 'Automatic synthetic monitoring analysis (follows synthetic test tasks)',
    '工单新建/描述保存自动 + 手动重跑': 'Automatic on ticket creation / description save + manual rerun',
    '工单/单据保存时自动': 'Automatic when tickets / records are saved',
    '新增评论/关闭时自动': 'Automatic on new comment / closure',
    '提交变更单时自动 + 每日定时聚类': 'Automatic on change submission + daily scheduled clustering',
    '每日定时 + 新增/编辑触发': 'Daily schedule + create / edit trigger',
    '用户提交咨询/语音交互': 'User inquiry / voice interaction',
    '派单时自动推荐': 'Automatic recommendation during dispatch',
    '自动': 'Automatic',
    '自动 + 手动': 'Automatic + Manual',
    '手工确认': 'Manual Approval',
    '手动': 'Manual',
    '定时 + 手动': 'Scheduled + Manual',
    '今日 96 组 · 命中率 73.4%': 'Today 96 groups · hit rate 73.4%',
    '今日 892 次 · 直接使用 91.2%': 'Today 892 calls · direct adoption 91.2%',
    '今日 843 次 · 快捷卡命中 82%': 'Today 843 calls · quick card hit rate 82%',
    '今日巡检 128 次 · 检出异常 156': 'Today 128 inspections · 156 exceptions detected',
    '本周 320 次 · 预警 12 条': 'This week 320 calls · 12 warnings',
    '今日检测 2,140 次 · 预警 8': 'Today 2,140 checks · 8 warnings',
    '今日 1,246 次 · 标签命中 92.4%': 'Today 1,246 calls · tag hit rate 92.4%',
    '今日 986 次 · 推荐直接使用 87.6%': 'Today 986 calls · recommendation direct adoption 87.6%',
    '今日 486 篇 · 知识草稿 12': 'Today 486 summaries · 12 knowledge drafts',
    '今日 31 单 · 高风险 3': 'Today 31 records · 3 high risk',
    '今日巡检 96 次 · 检出异常 87': 'Today 96 inspections · 87 exceptions detected',
    '今日 218 次 · 自助闭环 61%': 'Today 218 calls · self-service closure 61%',
    '今日 96 次 · 直接使用率 88%': 'Today 96 calls · direct adoption rate 88%'
  });

  Object.assign(EN_TERMS, {
    'Times': 'calls',
    ' 次 · 快捷卡命中 ': ' calls · Quick Action Hit Rate ',
    '较昨日': 'vs Yesterday',
    '↓ 12% 较昨日': '↓ 12% vs Yesterday',
    '↑ 5 较昨日': '↑ 5 vs Yesterday',
    '最近更新 32 秒前': 'Last Updated 32 sec ago',
    '32 秒前': '32 sec ago',
    'web-prod 集群 CPU 持续攀升 30 分钟，CMDB 显示该集群包含 12 台服务器，ITSM 侧已有 2 张关联工单处理中。': 'The web-prod cluster CPU has been rising for 30 minutes; CMDB shows 12 servers in the cluster, and ITSM already has 2 related tickets in progress.',
    'CMDB 检测到 312 台服务器缺少关系定义，建议执行「自动发现」任务补全拓扑数据，当前数据质量评分 92.4。': 'CMDB detected 312 servers with missing relationship definitions. Run Auto Discovery to complete topology data; current data quality score is 92.4.',
    '集群 CPU 持续攀升 30 分钟，CMDB 显示该集群包含 12 台服务器，ITSM 侧已有 2 张关联工单处理中。': 'cluster CPU has been rising for 30 minutes; CMDB shows 12 servers in the cluster, and ITSM already has 2 related tickets in progress.',
    '检测到 312 台服务器缺少关系定义，建议执行「自动发现」任务补全拓扑数据，当前数据质量评分': 'detected 312 servers with missing relationship definitions. Run Auto Discovery to complete topology data; current data quality score',
    '检测到 312 台服务器缺少关系定义，建议执行「自动发现」任务补全拓扑数据，当前数据质量评分 92.4。': 'detected 312 servers with missing relationship definitions. Run Auto Discovery to complete topology data; current data quality score is 92.4.',
    '变更 CHG-2024-0089 涉及 3 台核心交换机，CMDB 影响分析显示下游 47 台设备可能受影响，建议协调窗口期。': 'Change CHG-2024-0089 involves 3 core switches. CMDB impact analysis shows 47 downstream devices may be affected; coordinate the maintenance window.',
    '带宽 > 80%': 'Bandwidth > 80%',
    '丢包率 > 1%': 'Packet Loss > 1%',
    'CPU 使用率超过 95%': 'CPU usage exceeded 95%',
    'web-prod-01 CPU 使用率超过 95%': 'web-prod-01 CPU usage exceeded 95%',
    '事件 INC-20260813-003 派生预防性硬件检查（App-Server-03 现场体检）': 'Incident INC-20260813-003 derived a preventive hardware inspection (App-Server-03 field health check)',
    '服务报告': 'Service Reports',
    '周大福 · 新加坡数据中心搬迁': 'CTF · Singapore Data Center Relocation',
    '达美乐 · 中国门店网络改造': 'Domino · China Store Network Renovation',
    '广发证券 · 机房扩容': 'GF Securities · Data Center Capacity Expansion',
    '香港美心MX · 迁移筹备': 'Hong Kong Maxim MX · Migration Preparation',
    'M4 应用迁移 · 09-05 已延期': 'M4 Application Migration · 09-05 Delayed',
    'M6 全门店割接 · 08-30': 'M6 All-Store Cutover · 08-30',
    'M5 初验 · 08-25': 'M5 Initial Acceptance · 08-25',
    'M2 迁移方案确认 · 09-20': 'M2 Migration Plan Confirmation · 09-20',
    '新加坡数据中心搬迁': 'Singapore Data Center Relocation',
    '法兰克福托管运维': 'Frankfurt Managed Operations',
    '中国门店网络改造': 'China Store Network Renovation',
    '机房扩容': 'Data Center Capacity Expansion',
    '迁移筹备': 'Migration Preparation',
    '租户 tn_corp · 服务等级 Gold · 新加坡 / 上海 / 法兰克福 · 数据驻留：新加坡 · 欧盟（GDPR）': 'Tenant tn_corp · Service Level Gold · Singapore / Shanghai / Frankfurt · Data Residency: Singapore · EU (GDPR)',
    '处理中 5 · 含 1 条 SLA 临近': '5 In Progress · includes 1 SLA near breach',
    '执行中 2 · GDPR 1': '2 In Progress · 1 GDPR',
    '工单口径 · Gold 等级': 'Ticket scope · Gold tier',
    '交付 1 · 月报 2 · 周报 2': '1 Delivered · 2 Monthly Reports · 2 Weekly Reports',
    '可计费 236h': 'Billable 236h',
    '租户 tn_domino · 服务等级 Silver · 深圳 / 门店网络 · 数据驻留：中国境内': 'Tenant tn_domino · Service Level Silver · Shenzhen / store network · Data Residency: Mainland China',
    '门店网络 80%': 'Store Network 80%',
    '执行中 1': '1 In Progress',
    '工单口径 · Silver 等级': 'Ticket scope · Silver tier',
    '月报 2 · 交付 1': '2 Monthly Reports · 1 Delivered',
    '可计费 152h': 'Billable 152h',
    '租户 tn_gf · 服务等级 Gold · 上海 · 数据驻留：中国境内': 'Tenant tn_gf · Service Level Gold · Shanghai · Data Residency: Mainland China',
    '交易系统优先': 'Trading System Priority',
    '收尾中 1': '1 In Closure',
    '验收 1 · 月报 1': '1 Acceptance · 1 Monthly Report',
    '可计费 166h': 'Billable 166h',
    '租户 tn_hkt_other · 服务等级 Silver · 香港 · 数据驻留：香港': 'Tenant tn_hkt_other · Service Level Silver · Hong Kong · Data Residency: Hong Kong',
    '积压 5 单': '5 Backlogged Tickets',
    '筹备中 1': '1 In Preparation',
    '筹备期': 'Preparation Phase',
    '可计费 24h': 'Billable 24h',
    '文本理解与标签 A1': 'Text Understanding and Tagging A1',
    '知识检索与推荐 A2': 'Knowledge Retrieval and Recommendation A2',
    '摘要与文档生成 A3': 'Summary and Document Generation A3',
    '数据质量巡检 A5': 'Data Quality Inspection A5',
    '陈明 · GitHub 组织权限': 'Chen Ming · GitHub Organization Permission',
    'GitHub 组织权限': 'GitHub Organization Permission',
    '平台': 'Platform'
  });

  Object.assign(EN_TERMS, {
    'UMP 总览': 'UMP Overview',
    '服务运营': 'Service Operations',
    '现场服务': 'Field Service',
    '项目与交付': 'Projects and Delivery',
    '资产管理': 'Asset Management',
    '监控对象': 'Monitored Objects',
    '网络与拨测': 'Network and Synthetic Monitoring',
    '配置管理': 'Configuration Management',
    '自动化运维': 'Operations Automation',
    '容量与可用性': 'Capacity and Availability',
    '服务运营 - UMP': 'Service Operations - UMP',
    '现场服务 - UMP': 'Field Service - UMP',
    '项目与交付 - UMP': 'Projects and Delivery - UMP',
    '资产管理 - UMP': 'Asset Management - UMP',
    '网络与拨测 - MOP': 'Network and Synthetic Monitoring - MOP',
    '使用指引 - MOP': 'Getting Started - MOP',
    '使用指引 - UMP': 'Getting Started - UMP',
    '第一次进入统一管理门户时，先确定组织视角，再选择服务、资产、现场或项目的一条最小闭环。UMP 负责把 MSP/ENT 的运营对象组织到同一入口。': 'When entering the unified management portal for the first time, confirm the organization perspective first, then choose the smallest closed-loop path for services, assets, field service, or projects. UMP organizes MSP / ENT operating objects into one entry point.',
    '第一次进入监控运维时，先确定值守范围，再选择告警、网络、配置或容量的一条最小闭环。MOP 负责让 IT 底座看得见、稳得住。': 'When entering monitoring operations for the first time, confirm the monitoring scope first, then choose the smallest closed-loop path for alerts, network, configuration, or capacity. MOP keeps the IT foundation visible and stable.',
    '统一查看对象、链路、配置、告警、自动化与容量风险。管理看态势，处置进工作台。': 'Unified view of objects, links, configuration, alerts, automation, and capacity risk. Managers review posture; operators handle work in the workspace.',
    '跨租户跟进请求、事件、问题、变更与知识。待办进工作台。': 'Track requests, incidents, problems, changes, and knowledge across tenants. Work items go to the workspace.',
    '跨租户查看现场工单、派工、资源与排班。配置进入现场服务管理。': 'View field work orders, dispatch, resources, and schedules across tenants. Use Field Service Management for configuration.',
    '跨租户查看项目、任务、交付物与验收。支持总项目 / 子项目。': 'View projects, tasks, deliverables, and acceptance across tenants. Supports master projects and subprojects.',
    '跨租户查看资产、合同、库存与申请，复杂生命周期进入资产高级管理。': 'View assets, contracts, inventory, and requests across tenants. Use advanced asset management for complex lifecycle work.',
    '查看服务器、网络、链路、站点与业务服务健康。': 'View health across servers, networks, links, sites, and business services.',
    '查看链路质量、拨测任务、站点可达与业务路径。': 'View link quality, synthetic test tasks, site reachability, and business paths.',
    '跨租户查看 CI、服务关系、影响面与数据质量，复杂模型维护进入配置建模。': 'View CIs, service relationships, impact scope, and data quality across tenants. Use configuration modeling for complex model maintenance.',
    '处理告警、降噪、转单与处置记录。待办进工作台。': 'Handle alerts, noise reduction, ticket conversion, and remediation records. Work items go to the workspace.',
    '跟踪告警转单、自动处置、编排记录与失败重试。': 'Track alert-to-ticket conversion, automated remediation, orchestration records, and failed retries.',
    '视角': 'Perspective',
    '范围': 'Scope',
    '窗口': 'Window',
    'MSP 多租户': 'MSP Multi-Tenant',
    '全部租户': 'All Tenants',
    '24 小时': '24 Hours',
    '离线 42 个': '42 Offline',
    '环比 +0.04%': '+0.04% Period-over-Period',
    '孤立 CI 128 个': '128 Orphan CIs',
    'P1/P2 共 14 条': '14 P1 / P2 Items',
    '失败重试 9 次': '9 Failed Retries',
    '7 日内需处理': 'Action Required Within 7 Days',
    '4 个租户需要关注': '4 Tenants Require Attention',
    '维保到期 318 台': '318 Assets with Maintenance Expiring',
    'SLA 风险 37 单': '37 SLA-Risk Tickets',
    '待派工 26 单': '26 Pending Dispatch',
    '红色风险 3 个': '3 Red Risks',
    '合同 / SLA / 交付': 'Contract / SLA / Delivery',
    'AI 运维态势助手': 'AI Operations Posture Assistant',
    'AI 服务运营助手': 'AI Service Operations Assistant',
    'AI 智能派工建议': 'AI Intelligent Dispatch Recommendations',
    'AI 项目交付助手': 'AI Project Delivery Assistant',
    'AI 资产智能助手': 'AI Asset Intelligence Assistant',
    'AI 链路健康助手': 'AI Link Health Assistant',
    'AI 配置影响助手': 'AI Configuration Impact Assistant',
    'AI 智能告警分析': 'AI Intelligent Alert Analysis',
    'AI 告警加工助手': 'AI Alert Processing Assistant',
    'L3 · 多层审批': 'L3 · Multi-level Approval',
    'L2 · 手工确认': 'L2 · Draft-and-Approve',
    '审计留痕': 'Audit Trace',
    '链路劣化 / 告警聚合 / 容量预测 ·': 'Link degradation / alert aggregation / capacity forecast ·',
    '事件处理建议 / SLA 预警 / 变更影响评估 ·': 'Incident handling recommendations / SLA warnings / change impact assessment ·',
    '根因摘要 / 影响面 / 派单建议 / 优先级 ·': 'Root-cause summary / impact scope / dispatch recommendations / priority ·',
    '劣化预测 / Traceroute 逐跳诊断 ·': 'Degradation prediction / Traceroute hop-by-hop diagnosis ·',
    '运维能力态势': 'Operations Capability Posture',
    '健康 + 风险': 'Health + Risk',
    '租户健康摘要': 'Tenant Health Summary',
    '告警 · 可用性 · 链路': 'Alerts · Availability · Links',
    '高优先级运维线索': 'High-Priority Operations Signals',
    'P1/P2 下钻': 'P1 / P2 Drilldown',
    '能力域态势': 'Capability Domain Posture',
    '摘要 + 下钻': 'Summary + Drilldown',
    '待关注事项': 'Items Requiring Attention',
    '风险下钻': 'Risk Drilldown',
    '租户运营汇总': 'Tenant Operations Summary',
    'MSP 全量 · ENT 当前租户': 'MSP Full Scope · ENT Current Tenant',
    'Top 4 租户健康摘要': 'Top 4 Tenant Health Summary',
    '按健康分和待处理风险排序；更多租户进入 MSP 运维总览查看全量数据。': 'Sorted by health score and pending risk; view all tenants in the MSP Operations Overview.',
    '查看全量租户': 'View All Tenants',
    'Top 3 高优先级线索': 'Top 3 High-Priority Signals',
    '按 P1/P2、业务影响和自动化可执行性排序；更多线索进入告警、容量或工作台处理。': 'Sorted by P1 / P2, business impact, and automation executability; handle more signals in alerts, capacity, or the workspace.',
    '级别': 'Level',
    '对象 / 区域': 'Object / Region',
    '动作': 'Action',
    '健康': 'Health',
    '关注链路': 'Link Attention',
    '告警偏高': 'Elevated Alerts',
    '生成事件并触发链路切换预案': 'Generate incident and trigger link failover plan',
    '合并重复告警并派发 L2 排查': 'Merge duplicate alerts and dispatch L2 investigation',
    '扩容评估并关联变更窗口': 'Assess capacity expansion and link change window',
    '待评估': 'Pending Assessment',
    '链路劣化': 'Link Degradation',
    '业务门户应用拨测下载速度 1 小时内下降 87%，Traceroute 指向第 7 跳 AS 4134 骨干丢包。': 'Business portal synthetic download speed dropped 87% within 1 hour; Traceroute points to packet loss on AS 4134 backbone at hop 7.',
    '查看链路诊断': 'View Link Diagnosis',
    '告警聚合': 'Alert Aggregation',
    '5 条告警已聚合为事件 INC-20260813-003，置信度 96.7%，可进入 ITSM 继续处理。': '5 alerts have been aggregated into incident INC-20260813-003 with 96.7% confidence; continue handling in ITSM.',
    '查看转单结果': 'View Ticket Conversion Result',
    'DB-Master-02 磁盘增长加速，耗尽预测由 21 天修正为 14 天，建议优先处置临界对象。': 'DB-Master-02 disk growth is accelerating; exhaustion forecast changed from 21 days to 14 days. Prioritize critical objects.',
    '查看容量预测': 'View Capacity Forecast',
    'Top 4 待关注事项': 'Top 4 Items Requiring Attention',
    '按风险等级、影响租户数和是否需要人工推进排序；更多事项进入对应能力页或工作台。': 'Sorted by risk level, impacted tenant count, and whether manual follow-up is required; view more items in the corresponding capability page or workspace.',
    'Top 4 租户运营摘要': 'Top 4 Tenant Operations Summary',
    '打开工单': 'Open Tickets',
    '发布服务目录': 'Publish Service Catalog',
    '发起服务请求': 'Submit Service Request',
    '新建事件': 'Create Incident',
    '启用服务目录': 'Enabled Service Catalogs',
    '常用服务优先': 'Prioritize Common Services',
    '目录发起请求': 'Catalog-Initiated Requests',
    '资产类请求占 26%': 'Asset Requests Account for 26%',
    '目录关联事件': 'Catalog-Linked Incidents',
    '门店联网事件最高': 'Store Network Incidents Highest',
    '服务扩展机会': 'Service Expansion Opportunities',
    '可转服务项或模板': 'Convertible to Service Items or Templates',
    '处理建议': 'Handling Recommendation',
    'Web 服务器 CPU 过载已关联 CMDB 拓扑定位根因，建议优先重启 App-Server-03 应用进程。': 'Web server CPU overload has been correlated with CMDB topology for root cause localization; restart the App-Server-03 application process first.',
    '核心交换机延迟告警 SLA 仅剩 0h 28m，建议立即升级处理或派工至现场。': 'Core switch latency alert has only 0h 28m SLA remaining; escalate immediately or dispatch field service.',
    '派工至现场': 'Dispatch Onsite',
    '变更影响评估': 'Change Impact Assessment',
    'CHG-20260813-001 影响 23 个 CI、覆盖 3 个业务系统，建议在 02:00-05:00 维护窗口执行。': 'CHG-20260813-001 impacts 23 CIs across 3 business systems; execute during the 02:00-05:00 maintenance window.',
    '常用服务目录': 'Common Service Catalogs',
    '查看全部 42': 'View All 42',
    'Top 3 常用服务目录': 'Top 3 Common Service Catalogs',
    '按近期请求、事件关联和是否支持用户主动发起排序；更多目录进入全量目录检索。': 'Sorted by recent requests, incident linkage, and whether users can initiate directly; search more catalogs in the full catalog.',
    '门店联网与链路支持': 'Store Network and Link Support',
    '面向门店网络中断、链路降级、拨测失败和网络变更的统一入口。': 'Unified entry for store network outages, link degradation, synthetic test failures, and network changes.',
    '终端与资产支持': 'Endpoint and Asset Support',
    '承接资产领用、终端故障、备件更换、资产回收和库存联动。': 'Covers asset pickup, endpoint faults, spare part replacement, asset recovery, and inventory linkage.',
    '账号权限与访问开通': 'Account Permissions and Access Provisioning',
    '覆盖账号开通、权限变更、VPN 访问、离职回收和审批白名单。': 'Covers account provisioning, permission changes, VPN access, offboarding recovery, and approval whitelists.',
    '发起': 'Initiate',
    '申请资产': 'Request Asset',
    '更多服务可进入全量目录检索。': 'More services can be searched in the full catalog.',
    '服务延伸事项': 'Service Extension Items',
    'Top 4 服务延伸事项': 'Top 4 Service Extension Items',
    '按是否能补齐服务能力和是否有明确配置入口排序；更多事项进入服务报告。': 'Sorted by whether they complete service capability and have a clear configuration entry; view more items in service reports.',
    '门店联网补拨测配置': 'Add Synthetic Tests for Store Networking',
    '待配置': 'Pending Configuration',
    '门店联网服务中已有多次链路波动处理记录，可补充标准拨测任务和告警转事件规则。': 'Store networking already has multiple link fluctuation handling records; add standard synthetic test tasks and alert-to-incident rules.',
    '来源服务：门店联网': 'Source Service: Store Networking',
    '创建拨测': 'Create Synthetic Test',
    '资产支持补现场模板': 'Add Field Template for Asset Support',
    '待建模板': 'Template Pending',
    '终端更换和备件处理需要到场执行，可补充现场工单模板、技能要求和验收字段。': 'Endpoint replacement and spare part handling require onsite execution; add field work order templates, skill requirements, and acceptance fields.',
    '来源服务：终端与资产': 'Source Service: Endpoints and Assets',
    '创建模板': 'Create Template',
    '账号权限补审批规则': 'Add Approval Rules for Account Permissions',
    '待优化': 'Pending Optimization',
    '账号权限服务已有标准申请路径，可补充审批白名单、处理组和 SLA 升级规则。': 'Account permission services already have a standard request path; add approval whitelists, handling groups, and SLA escalation rules.',
    '来源服务：账号权限': 'Source Service: Account Permissions',
    '优化 SLA': 'Optimize SLA',
    '业务系统补知识条目': 'Add Knowledge Articles for Business Systems',
    '待补充': 'Pending Completion',
    '业务系统服务已有重复处理场景，可补充排查步骤、回退说明和服务台话术。': 'Business system services already have repeated handling scenarios; add troubleshooting steps, rollback notes, and service desk scripts.',
    '来源服务：业务系统': 'Source Service: Business Systems',
    '补充知识': 'Add Knowledge',
    '服务目录使用统计': 'Service Catalog Usage Statistics',
    '门店联网': 'Store Networking',
    '资产支持': 'Asset Support',
    '账号权限': 'Account Permissions',
    '请求': 'Requests',
    '生成服务报告': 'Generate Service Report',
    '服务目录': 'Service Catalog',
    '问题': 'Problems',
    '知识': 'Knowledge',
    '全部目录': 'All Catalogs',
    '本月使用': 'Used This Month',
    '可扩展': 'Expandable',
    '目录配置': 'Catalog Configuration',
    'Top 3 目录运营项': 'Top 3 Catalog Operations Items',
    '按 SLA 风险、请求/事件压力和可配置动作排序；更多目录进入 ITSM 服务目录。': 'Sorted by SLA risk, request / incident pressure, and configurable actions; view more catalogs in the ITSM Service Catalog.',
    '服务目录': 'Service Catalog',
    '请求量': 'Request Volume',
    '事件量': 'Incident Volume',
    '推荐动作': 'Recommended Action',
    '配置资产申请': 'Configure Asset Request',
    '优化审批 SLA': 'Optimize Approval SLA',
    '待处理': 'Pending',
    '查看服务请求': 'View Service Requests',
    'Top 2 待推进请求': 'Top 2 Requests to Progress',
    '按待处理节点、等待时长和用户影响排序；更多请求进入 ITSM 请求列表。': 'Sorted by pending node, wait time, and user impact; view more requests in the ITSM request list.',
    '进入全量请求': 'Open Full Request List',
    '提交人': 'Submitter',
    '当前节点': 'Current Node',
    '资产领用': 'Asset Pickup',
    '资产审批': 'Asset Approval',
    '处理审批': 'Process Approval',
    'L1 处理': 'L1 Handling',
    '进入处理': 'Open Handling',
    'Top 2 优先事件': 'Top 2 Priority Incidents',
    '按 SLA 剩余时间、影响服务和是否可派工升级排序；更多事件进入事件管理。': 'Sorted by SLA remaining time, impacted service, and field-dispatch escalation feasibility; view more incidents in Incident Management.',
    'MOP 告警': 'MOP Alert',
    '门店交易': 'Store Transactions',
    '超时风险': 'Timeout Risk',
    'L2 网络组': 'L2 Network Team',
    '派工升级': 'Dispatch Escalation',
    '用户提单': 'User-Submitted Ticket',
    '备份服务': 'Backup Service',
    '剩余 2h': '2h Remaining',
    'Top 2 问题闭环项': 'Top 2 Problem Closure Items',
    '按关联事件数、根因进度和是否需要变更排序；更多问题进入问题管理。': 'Sorted by linked incident count, root-cause progress, and change requirement; view more problems in Problem Management.',
    '进入问题管理': 'Open Problem Management',
    '关联事件': 'Linked Incidents',
    '根因进度': 'Root-Cause Progress',
    '链路抖动复现中': 'Link jitter reproduction in progress',
    '专家组': 'Expert Team',
    '分析中': 'Analyzing',
    '复核链路': 'Review Link',
    'POS 终端批次问题': 'POS endpoint batch issue',
    '桌面组': 'Desktop Team',
    '待变更': 'Change Pending',
    '发起变更': 'Initiate Change',
    'Top 2 关注变更': 'Top 2 Changes Requiring Attention',
    '按影响面、窗口临近度和审批/执行状态排序；更多变更进入变更管理。': 'Sorted by impact scope, window proximity, and approval / execution status; view more changes in Change Management.',
    '类型': 'Type',
    '影响面': 'Impact Scope',
    '扩容': 'Capacity Expansion',
    '2 服务 / 6 CI': '2 Services / 6 CIs',
    '审批中': 'In Approval',
    '网络调整': 'Network Adjustment',
    '18 站点': '18 Sites',
    '待执行': 'Pending Execution',
    '进入执行': 'Open Execution',
    'Top 2 知识复审项': 'Top 2 Knowledge Review Items',
    '按命中次数、服务适用范围和复审状态排序；更多知识进入知识库。': 'Sorted by hit count, service applicability, and review status; view more knowledge in the knowledge base.',
    '进入知识库': 'Open Knowledge Base',
    '适用服务': 'Applicable Service',
    '租户范围': 'Tenant Scope',
    '命中': 'Hits',
    '最近更新': 'Last Updated',
    'POS 终端离线处理': 'POS Endpoint Offline Handling',
    '已发布': 'Published',
    '查看知识': 'View Knowledge',
    'VPN 链路切换预案': 'VPN Link Failover Plan',
    '待复审': 'Review Pending',
    '复审知识': 'Review Knowledge',
    '受理提单': 'Accept Ticket',
    '现场服务管理': 'Field Service Management',
    '现场工单': 'Field Work Orders',
    '工程师在线': 'Engineers Online',
    '跨 9 个区域': 'Across 9 Regions',
    '优先处理 P1/P2': 'Prioritize P1 / P2',
    '资源利用率': 'Resource Utilization',
    '本周平均': 'This Week Average',
    '查看工单列表': 'View Work Order List',
    'Top 3 待调度工单': 'Top 3 Work Orders Pending Scheduling',
    '按 SLA 剩余时间、待派工状态、工程师匹配度排序；更多工单进入 FSM 工单列表处理。': 'Sorted by SLA remaining time, pending dispatch state, and engineer match; handle more work orders in the FSM work order list.',
    '现场工单': 'Field Work Order',
    '站点': 'Site',
    '服务类型': 'Service Type',
    '建议工程师': 'Recommended Engineer',
    'POS 终端维修': 'POS Endpoint Repair',
    'TAC 支持': 'TAC Support',
    '1h 内': 'Within 1h',
    '4h 内': 'Within 4h',
    '立即派工': 'Dispatch Now',
    '网络巡检': 'Network Inspection',
    '已接单': 'Accepted',
    '跟进进度': 'Track Progress',
    '备件更换': 'Spare Part Replacement',
    '到场中': 'En Route',
    '回写资产': 'Write Back Asset',
    '新建项目': 'Create Project',
    '项目高级管理': 'Advanced Project Management',
    '总项目 7 · 子项目 18': '7 Master Projects · 18 Subprojects',
    '3 个涉及验收': '3 Involve Acceptance',
    '客户确认中': 'Customer Confirmation In Progress',
    '交付物完成': 'Deliverables Completed',
    'Top 3 待推进项目': 'Top 3 Projects to Progress',
    '按延期风险、验收影响、变更窗口临近度排序；更多项目进入 PMS 项目总览筛选和分页。': 'Sorted by delay risk, acceptance impact, and change window proximity; view more projects in PMS overview filtering and pagination.',
    '项目': 'Project',
    '层级': 'Level',
    '进度': 'Progress',
    '关键风险': 'Key Risk',
    'APAC 门店网络升级': 'APAC Store Network Upgrade',
    '总项目': 'Master Project',
    '18 站点变更窗口未确认': 'Change window for 18 sites not confirmed',
    '有风险': 'At Risk',
    '确认变更窗口': 'Confirm Change Window',
    'SG POS 批量替换': 'SG POS Batch Replacement',
    '子项目': 'Subproject',
    '资产盘点差异未关闭': 'Asset stocktaking variance not closed',
    '延期': 'Delayed',
    '处理盘点差异': 'Handle Stocktaking Variance',
    'HK 备份平台扩容': 'HK Backup Platform Expansion',
    '独立项目': 'Standalone Project',
    '等待变更执行': 'Waiting for Change Execution',
    '进入项目工作台': 'Open Project Workspace',
    '新建资产': 'Create Asset',
    '新建合同': 'Create Contract',
    '资产高级管理': 'Advanced Asset Management',
    'MSP 视角 · 18 租户': 'MSP View · 18 Tenants',
    '30 天内需跟进': 'Follow-up Required Within 30 Days',
    '低水位备件/耗材': 'Low-Stock Spare Parts / Consumables',
    '待确认差异项': 'Variance Items Pending Confirmation',
    '资产台账': 'Asset Ledger',
    '合同与维保': 'Contracts and Maintenance',
    '库存与盘点': 'Inventory and Stocktaking',
    '资产申请': 'Asset Requests',
    '查看 ITAM 资产清单': 'View ITAM Asset List',
    'Top 3 待核查资产': 'Top 3 Assets to Verify',
    '按状态异常、维保临近和是否关联关键 CI 排序；更多资产进入 ITAM 资产清单筛选和分页。': 'Sorted by abnormal status, maintenance proximity, and key CI linkage; view more assets in ITAM asset list filtering and pagination.',
    '进入全量资产': 'Open Full Asset List',
    '资产编号': 'Asset ID',
    '资产名称': 'Asset Name',
    '维保': 'Maintenance',
    '关联 CI': 'Linked CI',
    '核心交换机': 'Core Switch',
    '在用': 'In Use',
    '查看影响面': 'View Impact Scope',
    '门店 POS 终端': 'Store POS Endpoint',
    '待维修': 'Repair Pending',
    '创建维修单': 'Create Repair Work Order',
    '备份服务器': 'Backup Server',
    '查看台账': 'View Ledger',
    '合同到期风险': 'Contract Expiration Risk',
    '销售合同 18 · 采购合同 24': '18 Sales Contracts · 24 Purchase Contracts',
    '未关联资产合同': 'Asset Contracts Not Linked',
    '需补充资产范围和维保条款': 'Asset scope and maintenance terms required',
    'Top 2 到期合同': 'Top 2 Expiring Contracts',
    '展示到期或缺少关联范围的合同；更多合同进入合同管理页按到期日和资产范围处理。': 'Shows contracts expiring or missing linked scope; handle more contracts in Contract Management by expiration date and asset scope.',
    '进入合同管理': 'Open Contract Management',
    '合同': 'Contract',
    '到期日': 'Expiration Date',
    '关联资产': 'Linked Assets',
    '待续约': 'Renewal Pending',
    '发起续约': 'Initiate Renewal',
    '采购': 'Purchase',
    '生效中': 'Active',
    '查看资产范围': 'View Asset Scope',
    '定义盘点任务': 'Define Stocktaking Task',
    'Top 2 库存与盘点事项': 'Top 2 Inventory and Stocktaking Items',
    '按可影响交付或服务恢复的优先级排序；更多库存和盘点任务进入 ITAM 盘点页。': 'Sorted by priority of delivery or service recovery impact; view more inventory and stocktaking tasks in ITAM stocktaking.',
    '进入盘点列表': 'Open Stocktaking List',
    '对象': 'Object',
    '数量/差异': 'Quantity / Variance',
    'APAC 备件池': 'APAC Spare Parts Pool',
    '库存': 'Inventory',
    '低水位 9 项': '9 Low-Stock Items',
    '发起补货评估': 'Initiate Replenishment Assessment',
    'SG 门店盘点': 'SG Store Stocktaking',
    '盘点': 'Stocktaking',
    '差异 19 项': '19 Variance Items',
    'Top 2 待处理申请': 'Top 2 Pending Requests',
    '按当前节点、等待时长和审批影响排序；更多申请进入工作台或资产申请列表。': 'Sorted by current node, wait time, and approval impact; view more requests in the workspace or asset request list.',
    '进入资产申请': 'Open Asset Requests',
    '申请单': 'Request ID',
    '申请人': 'Applicant',
    '资产管理员审批': 'Asset Administrator Approval',
    '处理申请': 'Process Request',
    '报废': 'Retirement',
    '财务确认': 'Finance Confirmation',
    '进入确认': 'Open Confirmation',
    '发现任务': 'Discovery Jobs',
    '服务器 / 网络 / 站点 / 服务': 'Servers / Networks / Sites / Services',
    '12 个影响生产服务': '12 Impact Production Services',
    '对象健康': 'Object Health',
    '自动发现': 'Auto Discovery',
    '质量问题': 'Data Quality Issues',
    '服务覆盖率 88.9%': 'Service Coverage 88.9%',
    '较上周 +1.4%': '+1.4% vs Last Week',
    '变更/告警联动': 'Change / Alert Linkage',
    '孤立/重复/缺字段': 'Orphan / Duplicate / Missing Fields',
    '查看 CI 台账': 'View CI Ledger',
    '维护服务关系': 'Maintain Service Relationships',
    '配置建模': 'Configuration Modeling',
    '配置项台账': 'CI Ledger',
    '服务关系': 'Service Relationships',
    '数据质量摘要': 'Data Quality Summary',
    'Top 3 关键 CI': 'Top 3 Key CIs',
    '按服务影响和状态异常排序；更多 CI 进入 CMDB 台账筛选。': 'Sorted by service impact and abnormal status; view more CIs in CMDB ledger filtering.',
    '进入全量 CI': 'Open Full CI List',
    '名称': 'Name',
    'HK 核心交换机': 'HK Core Switch',
    '门店联网服务': 'Store Network Service',
    'SG POS 终端': 'SG POS Endpoint',
    '终端设备': 'Endpoint Device',
    '门店交易服务': 'Store Transaction Service',
    '降级': 'Degraded',
    '创建事件': 'Create Incident',
    '备份服务': 'Backup Service',
    '查看资产': 'View Asset',
    'Top 2 服务关系': 'Top 2 Service Relationships',
    '按关系缺口和核心服务影响排序；更多关系进入服务映射。': 'Sorted by relationship gaps and core service impact; view more relationships in Service Mapping.',
    '进入服务映射': 'Open Service Mapping',
    '关键 CI': 'Key CIs',
    '关系状态': 'Relationship Status',
    '最近变更': 'Recent Changes',
    '缺少备用链路': 'Missing Backup Link',
    '维护关系': 'Maintain Relationship',
    '完整': 'Complete',
    '模拟影响面': 'Simulate Impact Scope',
    '影响面分析': 'Impact Analysis',
    'Top 2 影响分析': 'Top 2 Impact Analyses',
    '按变更窗口、告警级别和受影响站点排序；更多记录进入影响面分析。': 'Sorted by change window, alert severity, and impacted sites; view more records in Impact Analysis.',
    '进入影响分析': 'Open Impact Analysis',
    '触发对象': 'Trigger Object',
    '影响站点': 'Impacted Sites',
    '关联流程': 'Linked Process',
    '建议': 'Recommendation',
    '变更审批': 'Change Approval',
    '需要维护窗口': 'Maintenance Window Required',
    '调整变更窗口': 'Adjust Change Window',
    '告警处置': 'Alert Handling',
    '生成事件': 'Generate Incident',
    'Top 3 质量问题': 'Top 3 Data Quality Issues',
    '按影响范围和治理紧急度排序；更多质量项进入 CMDB 报表。': 'Sorted by impact scope and governance urgency; view more quality items in CMDB reports.',
    '进入质量报告': 'Open Quality Report',
    '问题类型': 'Issue Type',
    '数量': 'Quantity',
    '影响': 'Impact',
    '建议入口': 'Recommended Entry',
    '孤立 CI': 'Orphan CI',
    '影响服务关系完整度': 'Impacts service relationship completeness',
    'CMDB 数据质量': 'CMDB Data Quality',
    '待治理': 'Governance Pending',
    '治理孤立 CI': 'Govern Orphan CIs',
    '资产未关联': 'Unlinked Assets',
    '影响资产/配置一致性': 'Impacts asset / configuration consistency',
    '关联资产': 'Link Asset',
    '重复 CI': 'Duplicate CI',
    '影响告警归并': 'Impacts alert aggregation',
    'CMDB 去重管理': 'CMDB Deduplication Management',
    '需处理': 'Action Required',
    '合并重复 CI': 'Merge Duplicate CIs',
    '网络质量': 'Network Quality',
    '网络拓扑': 'Network Topology',
    'APAC 平均评分': 'APAC Average Score',
    '超过阈值': 'Above Threshold',
    '需重点关注': 'Requires Focus',
    '业务门户应用拨测总时间升至 8.4s，HTTP 错误增多，AI 标注为连续劣化。': 'Business portal synthetic total time rose to 8.4s; HTTP errors increased and AI marked it as continuous degradation.',
    '应用拨测': 'Application Synthetic Test',
    '查看劣化预测': 'View Degradation Prediction',
    '逐跳诊断': 'Hop-by-Hop Diagnosis',
    'Traceroute 显示第 7 跳 AS 4134 骨干丢包 12%，责任归属运营商骨干。': 'Traceroute shows 12% packet loss on AS 4134 backbone at hop 7; ownership points to the carrier backbone.',
    '查看逐跳诊断': 'View Hop-by-Hop Diagnosis',
    '跨境出口': 'Cross-Border Egress',
    'GBA-SZ 到 GBA-GZ 连续 3 小时丢包超过 2%，建议检查跨境出口或切换线路。': 'GBA-SZ to GBA-GZ packet loss exceeded 2% for 3 consecutive hours; check cross-border egress or switch links.',
    '备用线路': 'Backup Link',
    '查看链路详情': 'View Link Details',
    '链路质量': 'Link Quality',
    '拨测任务': 'Synthetic Test Tasks',
    '查看相关告警': 'View Related Alerts',
    'Top 3 链路/拨测对象': 'Top 3 Link / Synthetic Test Objects',
    '按异常程度、影响服务和是否可转事件排序；更多网络对象进入 NPM 网络质量页面。': 'Sorted by anomaly level, impacted service, and incident-conversion feasibility; view more network objects in NPM Network Quality.',
    '链路/拨测': 'Link / Synthetic Test',
    '区域': 'Region',
    '延迟': 'Latency',
    '丢包': 'Packet Loss',
    '异常': 'Abnormal',
    '波动': 'Fluctuating',
    '转事件跟进': 'Convert to Incident and Follow Up',
    '监控探针': 'Monitoring Probe',
    '查看拨测任务': 'View Synthetic Test Tasks',
    '自动处置率': 'Auto Remediation Rate',
    '转事件': 'Convert to Incident',
    '自动生成': 'Auto-Generated',
    '需人工确认': 'Manual Confirmation Required',
    '节省工时': 'Hours Saved',
    '估算值': 'Estimated',
    '固定加工流程': 'Fixed Processing Flow',
    'ITOM 开闸后，AI 起草根因摘要、CMDB 影响面、派单建议和优先级，人工确认后建单。': 'After ITOM opens the gate, AI drafts the root-cause summary, CMDB impact scope, dispatch recommendation, and priority; tickets are created after human approval.',
    '查看加工策略': 'View Processing Strategy',
    '审批通过的白名单场景可由 AI 直接执行，告警恢复后自动关闭关联 ITSM 工单并通知处理人。': 'Approved whitelist scenarios can be executed directly by AI; after alert recovery, linked ITSM tickets close automatically and assignees are notified.',
    '查看白名单': 'View Whitelist',
    '失败转人工': 'Failed Automation to Manual',
    '高风险或失败重试进入工作台，保留 Override、审批和执行结果审计。': 'High-risk items or failed retries enter the workspace, retaining Override, approval, and execution-result audit records.',
    '动作类型': 'Action Type',
    '执行结果': 'Execution Result',
    '需人工': 'Manual Required',
    'Top 3 自动化记录': 'Top 3 Automation Records',
    '按失败/待审批/需人工优先，再按触发时间排序；更多记录进入工作台或自动化策略页。': 'Prioritize failed / pending approval / manual-required records, then sort by trigger time; view more records in the workspace or automation policy page.',
    '执行记录': 'Execution Record',
    '触发源': 'Trigger Source',
    '关联单据': 'Linked Record',
    '结果': 'Result',
    '转事件 + 通知 L2': 'Convert to Incident + Notify L2',
    '成功': 'Success',
    '确认事件': 'Confirm Incident',
    '容量风险': 'Capacity Risk',
    '生成变更草稿': 'Generate Change Draft',
    '进入审批': 'Open Approval',
    '链路抖动': 'Link Jitter',
    '执行探测复核': 'Execute Probe Review',
    '派发专家': 'Dispatch Expert',
    '组织视角': 'Organization Perspective',
    '工作角色': 'Work Role',
    '全部': 'All',
    '管理': 'Management',
    '服务': 'Service',
    '资产': 'Assets',
    '现场': 'Field',
    '值守': 'Monitoring Duty',
    '配置': 'Configuration',
    '自动化': 'Automation',
    '确定范围': 'Confirm Scope',
    '识别风险': 'Identify Risk',
    '进入处置': 'Start Handling',
    '沉淀复盘': 'Capture Review',
    'MSP 跨租户运营': 'MSP Cross-Tenant Operations',
    'MSP 跨租户值守': 'MSP Cross-Tenant Monitoring',
    'ENT 企业运营': 'ENT Enterprise Operations',
    'ENT 值守': 'ENT Monitoring',
    '资产与库存治理': 'Asset and Inventory Governance',
    '网络质量排查': 'Network Quality Troubleshooting',
    '服务请求闭环': 'Service Request Closure',
    '配置影响分析': 'Configuration Impact Analysis',
    '现场派工闭环': 'Field Dispatch Closure',
    '告警处置闭环': 'Alert Handling Closure',
    '项目交付跟进': 'Project Delivery Follow-Up',
    '自动化与容量': 'Automation and Capacity',
    '15 分钟练习任务': '15-Minute Practice Task',
    '选择规则': 'Selection Rules',
    '按角色快速进入': 'Quick Entry by Role',
    '进入我的待办': 'Open My Work',
    '进入': 'Open',
    '推荐路线': 'Recommended Route',
    '告警闭环': 'Alert Closure',
    '配置影响': 'Configuration Impact',
    '值守到转单': 'Monitoring to Ticket Conversion',
    'CI 与服务关系': 'CI and Service Relationships',
    '按角色进入 UMP': 'Enter UMP by Role',
    '按角色进入 MOP': 'Enter MOP by Role',
    '进入 UMP 总览查看租户健康排行。': 'Open UMP Overview to review tenant health ranking.',
    '选择一个 SLA 或交付风险最高的租户。': 'Select the tenant with the highest SLA or delivery risk.',
    '下钻到对应场景页确认风险来源。': 'Drill down to the corresponding scenario page to confirm the risk source.',
    '进入报告中心生成租户运营报告。': 'Open Report Center to generate the tenant operations report.',
    '进入 UMP 总览切换 ENT 视角。': 'Open UMP Overview and switch to the ENT perspective.',
    '按项目和客户查看资产、服务、现场或交付风险。': 'Review asset, service, field, or delivery risk by project and customer.',
    '进入对应场景页分派负责人。': 'Open the corresponding scenario page and assign an owner.',
    '从我的待办跟进闭环结果。': 'Follow up closure results from My Work.',
    '先看 UMP 总览。': 'Start with UMP Overview.',
    '进入仪表盘确认趋势。': 'Open Dashboard to confirm trends.',
    '选择风险项下钻。': 'Select a risk item and drill down.',
    '生成报告或分派责任人。': 'Generate a report or assign an owner.',
    '进入服务运营。': 'Open Service Operations.',
    '筛选 SLA 风险或待处理事件。': 'Filter SLA risks or pending incidents.',
    '打开我的待办处理队列。': 'Open My Work to handle the queue.',
    '关闭后补充处理结论。': 'Add handling conclusions after closure.',
    '进入资产管理。': 'Open Asset Management.',
    '查看维保到期、库存风险或盘点差异。': 'Review maintenance expiry, inventory risk, or stocktaking variance.',
    '发起资产申请或盘点任务。': 'Initiate an asset request or stocktaking task.',
    '需要明细维护时进入资产台账。': 'Use Asset Ledger when detail maintenance is required.',
    '进入现场服务。': 'Open Field Service.',
    '查看待派工和工程师负载。': 'Review pending dispatch and engineer workload.',
    '完成派工或接单。': 'Complete dispatch or accept the order.',
    '完工后回写验收结果。': 'Write back acceptance results after completion.',
    '进入项目与交付。': 'Open Projects and Delivery.',
    '查看总项目和子项目风险。': 'Review master-project and subproject risk.',
    '处理里程碑、工时或交付物。': 'Handle milestones, timesheets, or deliverables.',
    '验收后完成项目归档。': 'Archive the project after acceptance.',
    '选择告警、容量或链路风险最高的租户。': 'Select the tenant with the highest alert, capacity, or link risk.',
    '下钻到对应场景页确认异常来源。': 'Drill down to the corresponding scenario page to confirm the anomaly source.',
    '生成租户运维报告或分派责任人。': 'Generate a tenant operations report or assign an owner.',
    '按项目和客户查看告警、链路和容量影响。': 'Review alert, link, and capacity impact by project and customer.',
    '进入告警中心或网络与拨测处理。': 'Handle it in Alert Center or Network and Synthetic Monitoring.',
    '查看自动化和容量风险。': 'Review automation and capacity risk.',
    '生成报告或调整治理策略。': 'Generate a report or adjust governance policy.',
    '进入告警中心。': 'Open Alert Center.',
    '筛选 P1/P2 和 SLA 风险。': 'Filter P1 / P2 and SLA risks.',
    '认领告警并转事件。': 'Claim the alert and convert it to an incident.',
    '从我的待办跟进处置状态。': 'Follow up handling status from My Work.',
    '进入网络与拨测。': 'Open Network and Synthetic Monitoring.',
    '定位失败拨测和异常链路。': 'Locate failed synthetic tests and abnormal links.',
    '下钻拓扑或对象健康。': 'Drill into topology or object health.',
    '必要时转事件或变更。': 'Convert to incident or change when needed.',
    '进入配置管理。': 'Open Configuration Management.',
    '查看孤立 CI、服务关系和影响面。': 'Review orphan CIs, service relationships, and impact scope.',
    '补齐数据质量问题。': 'Complete data quality fixes.',
    '需要复杂建模时进入配置建模。': 'Use configuration modeling when complex modeling is required.',
    '进入自动化运维。': 'Open Operations Automation.',
    '查看失败重试和自动处置收益。': 'Review failed retries and auto-remediation benefits.',
    '高风险项转人工队列。': 'Move high-risk items to the manual queue.',
    '容量风险进入扩容动作。': 'Move capacity risk into capacity expansion actions.'
  });

  Object.assign(EN_TERMS, {
    '租户': 'Tenants',
    '前 ': 'Top ',
    ' / 共 ': ' / Total ',
    '全部 ': 'All ',
    '紧急 ': 'Urgent ',
    '今日 ': 'Today ',
    'AI 起草工单': 'AI-Drafted Ticket',
    'AI Drafting 工单': 'AI-Drafted Ticket',
    '异常处置': 'Exception Handling',
    '变更': 'Change',
    '窗口': 'Window',
    'AI 风险：': 'AI Risk:',
    'AI 风险:': 'AI Risk:',
    '市场部': 'Marketing Department',
    '（规则': '(Rule',
    '）': ')',
    'L1 自动执行': 'L1 Whitelist',
    'AI 治理面板': 'AI Governance Panel',
    'AI Governance 面板': 'AI Governance Panel',
    '今日 AI 调用': 'Today AI Calls',
    'Today AI 调用': 'Today AI Calls',
    '熔断控制': 'Circuit Breaker Control',
    '运行': 'Running',
    '错误率阈值': 'Error Rate Threshold',
    'Error 率 Threshold': 'Error Rate Threshold',
    'AI 权限矩阵': 'AI Permission Matrix',
    '审计日志（最近）': 'Audit Logs (Recent)',
    'T5 · 审计日志（最近）': 'T5 · Audit Logs (Recent)',
    '账单': 'Billing',
    'AI Cost 账单': 'AI Cost Billing'
  });

  Object.assign(EN_TERMS, {
    '场景': 'Scenario',
    'EMS NEO 场景': 'EMS NEO Scenario',
    '台': 'devices',
    '单': 'tickets',
    '份': 'contracts',
    '项': 'items',
    '个': 'items',
    '条': 'items',
    '天': 'days',
    '周': 'weeks',
    '低于其他租户均值': 'lower than the average of other tenants',
    '低于': 'lower than',
    '其他租户': 'other tenants',
    '均值': 'average',
    '香港站点工单积压': 'Hong Kong site ticket backlog',
    '均属': 'all belong to',
    '集中在': 'concentrated in',
    '割接延期': 'cutover delay',
    '子项目依赖未闭环': 'subproject dependencies not closed',
    '最高': 'highest',
    '筹备期': 'preparation phase',
    '属预期': 'as expected',
    '汇总': 'Summary',
    '运营报告': 'Operations Report',
    '生成月报草稿': 'Generate Monthly Report Draft',
    '主动管理': 'Proactive Management',
    '流程闭环': 'Process Closure',
    '履约': 'Fulfillment',
    '协同': 'Collaboration',
    '适合服务经理、运营经理、交付负责人。目标是找出哪个租户最需要关注。': 'For service managers, operations managers, and delivery owners. The goal is to identify which tenant needs the most attention.',
    '适合资产管理员。目标是处理维保到期、库存风险、盘点差异和资产申请。': 'For asset managers. The goal is to handle maintenance expiry, inventory risk, stocktaking variance, and asset requests.',
    '适合服务台、值班经理。目标是把请求、事件、变更和 SLA 风险推进闭环。': 'For service desk and duty managers. The goal is to close service requests, incidents, changes, and SLA risks.',
    '适合调度员、现场工程师、远程 L2。目标是完成派工、到场、完工和验收。': 'For dispatchers, field engineers, and remote L2. The goal is to complete dispatch, arrival, completion, and acceptance.',
    '适合 PMO、PM、BM、变更经理。目标是掌握总项目、子项目和验收风险。': 'For PMO, PM, BM, and change managers. The goal is to understand master-project, subproject, and acceptance risk.',
    '确认视角': 'Confirm Perspective',
    '选择角色': 'Select Role',
    '完成一次处理': 'complete one handling workflow',
    '完成处理': 'handling completed',
    '可追踪的运营闭环': 'traceable operations closure',
    '跨租户查看资产、合同、库存与申请，复杂生命周期进入资产高级管理。': 'Review assets, contracts, inventory, and requests across tenants. Use Advanced Asset Management for complex lifecycle work.',
    '新建资产': 'Create Asset',
    '新建合同': 'Create Contract',
    '资产高级管理': 'Advanced Asset Management',
    '低水位备件/耗材': 'Low-level spare parts / consumables',
    '待确认差异项': 'Variance Items Pending Confirmation',
    '每日自动巡检 · 台账 / 闲置 / 到期 · 审计留痕': 'Daily automated inspection · ledger / idle assets / expiry · audit trace',
    '每日自动巡检 · 台账 / 闲置 / 到期 ·': 'Daily Automated Inspection · Ledger / Idle Assets / Expiry ·',
    '昨日巡检检出 23 条异常：重复台账 5、状态矛盾 8、关键信息缺失 10。': 'Yesterday inspection detected 23 abnormal items: 5 duplicate ledgers, 8 status conflicts, and 10 records with missing key information.',
    '重复台账': 'duplicate ledgers',
    '状态矛盾': 'status conflicts',
    '关键信息缺失': 'missing key information',
    '闲置 412 台中 17 台连续 90 天无操作，建议回收，预计年节省 ¥86,000。': 'Among 412 idle assets, 17 have had no activity for 90 consecutive days. Reclaim is recommended, with estimated annual savings of ¥86,000.',
    '建议回收': 'recommended reclaim',
    '预计年节省': 'estimated annual savings',
    '查看资产总览': 'View Asset Overview',
    '到期预警': 'Expiry Warning',
    '维保 30 天内到期 17 台，合同 30 天内到期 5 份，建议进入合同管理和台账筛选。': '17 assets have maintenance expiring within 30 days and 5 contracts expire within 30 days. Open Contract Management and ledger filters.',
    '维保': 'Maintenance',
    '进入合同管理': 'open Contract Management',
    '台账筛选': 'ledger filters',
    '查看合同预警': 'View Contract Warning',
    '合同与维保': 'Contracts and Maintenance',
    '库存与盘点': 'Inventory and Stocktaking',
    '资产状态': 'Asset Status',
    '资产类型': 'Asset Type',
    '查看 ITAM 资产清单': 'View ITAM Asset List',
    '待核查资产': 'Assets Pending Verification',
    '进入全量资产': 'Open Full Asset List',
    '资产编号': 'Asset ID',
    '资产名称': 'Asset Name',
    '站点': 'Site',
    '关联 CI': 'Linked CI',
    '核心交换机': 'Core Switch',
    '在用': 'In Use',
    '门店 POS 终端': 'Store POS Endpoint',
    '待维修': 'Repair Pending',
    '创建维修单': 'Create Repair Work Order',
    '备份服务器': 'Backup Server',
    '查看台账': 'View Ledger',
    '跨租户跟进请求、事件、问题、变更与知识。待办进工作台。': 'Track requests, incidents, problems, changes, and knowledge across tenants. Pending work goes to Workspace.',
    '发布服务目录': 'Publish Service Catalog',
    '发起服务请求': 'Create Service Request',
    '新建事件': 'Create Incident',
    '启用服务目录': 'Enable Service Catalog',
    '常用服务优先': 'Prioritize Common Services',
    '目录发起请求': 'Catalog-Initiated Requests',
    '资产类请求占': 'asset requests account for',
    '目录关联事件': 'Catalog-Linked Incidents',
    '门店联网事件最高': 'store networking incidents are highest',
    '服务扩展机会': 'Service Expansion Opportunities',
    '可转服务项或模板': 'Can become service items or templates',
    '处理建议': 'Handling Recommendation',
    'Web 服务器 CPU 过载已关联 CMDB 拓扑定位根因，建议优先重启 App-Server-03 应用进程。': 'Web server CPU overload has been correlated with CMDB topology for root cause localization. Recommended restarting the App-Server-03 application process first.',
    '核心交换机延迟告警 SLA 仅剩 0h 28m，建议立即升级处理或派工至现场。': 'Core switch latency alert has only 0h 28m of SLA remaining. Recommended immediate escalation or onsite dispatch.',
    'CHG-20260813-001 影响 23 个 CI、覆盖 3 个业务系统，建议在 02:00-05:00 维护窗口执行。': 'CHG-20260813-001 impacts 23 CIs and covers 3 business systems. Recommended execution in the 02:00-05:00 maintenance window.',
    '派工至现场': 'Dispatch Onsite',
    '常用服务目录': 'Common Service Catalog',
    '进入全量目录': 'Open Full Catalog',
    '面向门店网络中断、链路降级、拨测失败和网络变更的统一入口。': 'Unified entry for store network outages, link degradation, synthetic test failures, and network changes.',
    '终端与资产支持': 'Endpoint and Asset Support',
    '承接资产领用、终端故障、备件更换、资产回收和库存联动。': 'Covers asset pickup, endpoint faults, spare-part replacement, asset reclaim, and inventory linkage.',
    '账号权限与访问开通': 'Account Permissions and Access Provisioning',
    '覆盖账号开通、权限变更、VPN 访问、离职回收和审批白名单。': 'Covers account provisioning, permission changes, VPN access, offboarding reclaim, and approval whitelist.',
    '发起': 'Initiate',
    '库存联动': 'Inventory Linkage',
    '跨租户查看现场工单、派工、资源与排班。配置进入现场服务管理。': 'Review field work orders, dispatch, resources, and schedules across tenants. Configuration opens Field Service Management.',
    '受理提单': 'Accept Request',
    '现场工单': 'Field Work Orders',
    '工程师在线': 'Engineers Online',
    '优先处理 P1/P2': 'Prioritize P1/P2',
    '资源利用率': 'Resource Utilization',
    '今日 12 项已采纳 · 技能 / 位置 / 负载自动推荐 · 审计留痕': '12 recommendations adopted today · skills / location / workload auto-recommendation · audit trace',
    '派工推荐': 'Dispatch Recommendation',
    '打开派工建议': 'Open Dispatch Recommendation',
    '位置距离': 'Location Distance',
    '关联工单': 'Related Work Order',
    '查看路线建议': 'View Route Recommendation',
    '当前活跃工程师': 'current active engineers',
    '待命中': 'on standby',
    '完成率': 'Completion Rate',
    '查看工程师负载': 'View Engineer Workload',
    '技能标签': 'Skill Tags',
    '查看工单列表': 'View Work Order List',
    '待调度工单': 'Work Orders Pending Dispatch',
    '进入全量工单': 'Open Full Work Order List',
    '服务类型': 'Service Type',
    '建议工程师': 'Recommended Engineer',
    '立即派工': 'Dispatch Now',
    '网络巡检': 'Network Inspection',
    '已接单': 'Accepted',
    '跟进进度': 'Track Progress',
    '备件更换': 'Spare-Part Replacement',
    '到场中': 'En Route',
    '回写资产': 'Write Back Asset',
    '跨租户查看项目、任务、交付物与验收。支持总项目 / 子项目。': 'Review projects, tasks, deliverables, and acceptance across tenants. Supports master projects and subprojects.',
    '项目高级管理': 'Advanced Project Management',
    '总项目': 'Master Project',
    '子项目': 'Subproject',
    '客户确认中': 'Pending Customer Confirmation',
    '交付物完成': 'Deliverables Completion',
    '总项目风险汇总': 'Master Project Risk Summary',
    'PMO 先关注总项目风险与验收，按子项目查看延期、阻塞和交付物缺口。': 'PMO should focus on master-project risk and acceptance first, then review delays, blockers, and deliverable gaps by subproject.',
    '新建总项目时在同一流程编排子项目草稿，并生成里程碑、任务清单和计划书。': 'When creating a master project, orchestrate subproject drafts in the same flow and generate milestones, task lists, and a project plan.',
    'PMS 立项': 'PMS Project Setup',
    '新建项目计划': 'Create Project Plan',
    '识别连续超时和未关联项目工时，验收前检查里程碑、关联工单和交付物齐全度。': 'Identify repeated overtime and unlinked project timesheets. Before acceptance, check milestones, related tickets, and deliverable completeness.',
    '总项目/子项目': 'Master / Subproject',
    '风险状态': 'Risk Status',
    '查看项目总览': 'View Project Overview',
    '待推进项目': 'Projects Pending Progress',
    '进入全量项目': 'Open Full Project List',
    '层级': 'Level',
    '进度': 'Progress',
    '关键风险': 'Key Risk',
    '门店网络升级': 'Store Network Upgrade',
    '站点变更窗口未确认': 'site change window not confirmed',
    '有风险': 'At Risk',
    '确认变更窗口': 'Confirm Change Window',
    '批量替换': 'Batch Replacement',
    '资产盘点差异未关闭': 'asset stocktaking variance not closed',
    '处理盘点差异': 'Handle Stocktaking Variance',
    '备份平台扩容': 'Backup Platform Expansion',
    '独立项目': 'Standalone Project',
    '等待变更执行': 'Waiting for Change Execution',
    '执行中': 'In Progress',
    '进入项目工作台': 'Open Project Workspace',
    '统一查看对象、链路、配置、告警、自动化与容量风险。管理看态势，处置进工作台。': 'Unified view of object, link, configuration, alert, automation, and capacity risks. Managers review posture; handling goes to Workspace.',
    '离线': 'Offline',
    '孤立 CI': 'Orphan CIs',
    '共': 'Total',
    '次': 'times',
    '需处理': 'Action Required',
    '链路劣化 / 告警聚合 / 容量预测 · 审计留痕': 'Link degradation / alert aggregation / capacity forecast · audit trace',
    '业务门户应用拨测下载速度 1 小时内下降 87%，Traceroute 指向第 7 跳 AS 4134 骨干丢包。': 'Business portal synthetic download speed dropped 87% within 1 hour; traceroute points to packet loss on AS 4134 backbone hop 7.',
    '5 条告警已聚合为事件 INC-20260813-003，置信度 96.7%，可进入 ITSM 继续处理。': '5 alerts have been aggregated into incident INC-20260813-003 with 96.7% confidence. Open ITSM to continue handling.',
    'DB-Master-02 磁盘增长加速，耗尽预测由 21 天修正为 14 天，建议优先处置临界对象。': 'DB-Master-02 disk growth accelerated; exhaustion forecast changed from 21 days to 14 days. Prioritize critical objects.',
    '对象、健康、发现。': 'Objects, health, and discovery.',
    '链路、拨测、站点。': 'Links, synthetic tests, and sites.',
    'CI、关系、影响、质量。': 'CIs, relationships, impact, and quality.',
    '告警、降噪、处置。': 'Alerts, noise reduction, and handling.',
    '转单、编排、重试。': 'Ticket conversion, orchestration, and retry.',
    '预测、风险、优化。': 'Forecasting, risk, and optimization.',
    '告警 · 可用性 · 链路': 'Alerts · Availability · Links',
    '查看服务器、网络、链路、站点与业务服务健康。': 'Review server, network, link, site, and business service health.',
    '发现任务': 'Discovery Jobs',
    '离线对象': 'Offline Objects',
    '影响生产服务': 'impact production services',
    '需回补配置关系': 'configuration relationships need completion',
    '凭据/连通性失败': 'Credentials / Connectivity Failed',
    'AI 对象发现助手': 'AI Object Discovery Assistant',
    '自动发现 / CI 关联 / 影响面模拟 · 审计留痕': 'Auto Discovery / CI Correlation / Impact Scope Simulation · Audit Trace',
    '发现任务凭据或连通性失败 18 项，建议优先复核影响生产服务的 12 个离线对象。': '18 discovery jobs failed due to credentials or connectivity. Prioritize review of 12 offline objects impacting production services.',
    'CI 关联': 'CI Correlation',
    '73 个监控对象未关联 CI，会影响告警归并、影响面分析和报表口径。': '73 monitored objects are not linked to CIs, affecting alert aggregation, impact analysis, and reporting scope.',
    '快速影响面': 'Quick Impact Scope',
    'coresw-01 可快速模拟影响 3 个服务、240 人，用于告警处置前判断业务影响。': 'coresw-01 can quickly simulate impact on 3 services and 240 users before alert handling.',
    '进入全量对象': 'Open Full Object List',
    '发现状态': 'Discovery Status',
    '处理告警': 'Handle Alert',
    '业务服务': 'Business Service',
    '降级': 'Degraded',
    '运行影响分析': 'Run Impact Analysis',
    '服务器池': 'Server Pool',
    '查看服务器、网络、链路、站点与业务服务健康。': 'Review server, network, link, site, and business service health.',
    '查看链路质量、拨测任务、站点可达与业务路径。': 'Review link quality, synthetic tests, site reachability, and business paths.',
    'APAC 平均评分': 'APAC Average Score',
    '超过阈值': 'Above Threshold',
    '受影响站点': 'Impacted Sites',
    '需重点关注': 'Needs Focus',
    '业务门户应用拨测总时间升至 8.4s，HTTP 错误增多，AI 标注为连续劣化。': 'Business portal synthetic test total time rose to 8.4s and HTTP errors increased; AI marked continuous degradation.',
    '应用拨测': 'Application Synthetic Test',
    'Traceroute 显示第 7 跳 AS 4134 骨干丢包 12%，责任归属运营商骨干。': 'Traceroute shows 12% packet loss on AS 4134 backbone hop 7; ownership is the carrier backbone.',
    '跨境出口': 'Cross-Border Egress',
    'GBA-SZ 到 GBA-GZ 连续 3 小时丢包超过 2%，建议检查跨境出口或切换线路。': 'GBA-SZ to GBA-GZ packet loss exceeded 2% for 3 consecutive hours. Check cross-border egress or switch links.',
    '查看相关告警': 'View Related Alerts',
    '链路/拨测对象': 'Link / Synthetic Objects',
    '进入网络质量': 'Open Network Quality',
    '链路/拨测': 'Link / Synthetic Test',
    '延迟': 'Latency',
    '丢包': 'Packet Loss',
    '影响服务': 'Impacted Service',
    '门店交易': 'Store Transactions',
    '异常': 'Abnormal',
    '门店联网': 'Store Networking',
    '波动': 'Fluctuating',
    '转事件跟进': 'Convert to Incident and Follow Up',
    '监控探针': 'Monitoring Probe',
    '正常': 'Normal',
    '查看拨测任务': 'View Synthetic Tests',
    '跨租户查看 CI、服务关系、影响面与数据质量，复杂模型维护进入配置建模。': 'Review CIs, service relationships, impact scope, and data quality across tenants. Use configuration modeling for complex model maintenance.',
    '维护服务关系': 'Maintain Service Relationships',
    '配置建模': 'Configuration Modeling',
    '服务覆盖率': 'Service Coverage',
    '变更/告警联动': 'Change / Alert Linkage',
    '孤立/重复/缺字段': 'Orphan / Duplicate / Missing Fields',
    '影响评分 / 爆炸半径 / 数据质量 · 审计留痕': 'Impact Score / Blast Radius / Data Quality · Audit Trace',
    'AI 风险评分': 'AI Risk Score',
    '变更影响评分按受影响业务、单点风险和并发变更冲突计算，高风险建议 CAB 审批。': 'Change impact score is calculated from impacted services, single-point risk, and concurrent change conflicts. High risk is recommended for CAB approval.',
    '审批路径': 'Approval Path',
    '影响预测': 'Impact Prediction',
    '若中心 CI 不可用，AI 预测下游业务、应用服务和基础 CI 的传播范围。': 'If the central CI is unavailable, AI predicts propagation across downstream business services, application services, and infrastructure CIs.',
    '拓扑依赖': 'Topology Dependency',
    '查看爆炸半径': 'View Blast Radius',
    '综合健康分偏低时，优先治理完整率最低的 Class、孤立 CI 和重复 CI。': 'When the overall health score is low, prioritize classes with the lowest completeness, orphan CIs, and duplicate CIs.',
    '健康分': 'Health Score',
    '数据质量摘要': 'Data Quality Summary',
    '服务状态': 'Service Status',
    '进入全量 CI': 'Open Full CI List',
    '门店联网服务': 'Store Network Service',
    '终端设备': 'Endpoint Device',
    '门店交易服务': 'Store Transaction Service',
    '备份服务': 'Backup Service',
    '查看资产': 'View Asset',
    '处理告警、降噪、转单与处置记录。待办进工作台。': 'Handle alerts, noise reduction, ticket conversion, and handling records. Pending work goes to Workspace.',
    'ITOM 告警': 'ITOM Alerts',
    '关联聚合': 'Correlation Aggregation',
    '根因定位 / 降噪聚合 / 告警转事件 · 审计留痕': 'Root Cause Localization / Noise Reduction Aggregation / Alert-to-Incident · Audit Trace',
    'GBA-SZ-Core-SW01 的 63 条告警已聚合为 1 组根因事件：OSPF 邻居震荡。': '63 alerts from GBA-SZ-Core-SW01 have been aggregated into 1 root cause incident: OSPF neighbor flapping.',
    '查看根因组': 'View Root Cause Group',
    '降噪建议': 'Noise Reduction Recommendation',
    '基于 OSPF 邻居关系自动聚合告警，预计提升降噪率 3.2%，启用需审批。': 'Automatically aggregate alerts based on OSPF neighbor relationships. Estimated noise reduction improvement is 3.2%; enablement requires approval.',
    '申请启用规则': 'Request Rule Enablement',
    '5 条告警自动聚合为 INC-20260813-003，置信度 96.7%，转入 ITSM 处理。': '5 alerts were automatically aggregated into INC-20260813-003 with 96.7% confidence and moved into ITSM handling.',
    '查看事件链路': 'View Incident Linkage',
    '未确认': 'Unconfirmed',
    '待确认告警': 'Alerts Pending Confirmation',
    '进入全量告警': 'Open Full Alert List',
    '建议动作': 'Recommended Action',
    '级别': 'Severity',
    '转事件并触发预案': 'Convert to Incident and Trigger Runbook',
    '待确认': 'Pending Confirmation',
    '合并重复告警': 'Merge Duplicate Alerts',
    '处理中': 'In Progress',
    '确认聚合': 'Confirm Aggregation',
    '跟踪告警转单、自动处置、编排记录与失败重试。': 'Track alert-to-ticket, auto-remediation, orchestration records, and failed retries.',
    '自动生成': 'Auto-Generated',
    '需人工确认': 'Manual Confirmation Required',
    '估算值': 'Estimated Value',
    '根因摘要 / 影响面 / 派单建议 / 优先级 · 审计留痕': 'Root Cause Summary / Impact Scope / Dispatch Recommendation / Priority · Audit Trace',
    '固定加工流程': 'Fixed Processing Flow',
    'ITOM 开闸后，AI 起草根因摘要、CMDB 影响面、派单建议和优先级，人工确认后建单。': 'After ITOM intake opens, AI drafts root cause summary, CMDB impact scope, dispatch recommendation, and priority. Tickets are created after human approval.',
    '查看加工策略': 'View Processing Policy',
    '审批通过的白名单场景可由 AI 直接执行，告警恢复后自动关闭关联 ITSM 工单并通知处理人。': 'Approved whitelist scenarios can be executed directly by AI. After alert recovery, related ITSM tickets close automatically and assignees are notified.',
    '查看白名单': 'View Whitelist',
    '失败转人工': 'Failed Items to Manual Review',
    '高风险或失败重试进入工作台，保留 Override、审批和执行结果审计。': 'High-risk or failed retries enter Workspace, retaining override, approval, and execution-result audit trails.',
    '执行结果': 'Execution Result',
    '需人工': 'Manual Required',
    '自动化记录': 'Automation Records',
    '执行记录': 'Execution Record',
    '触发源': 'Trigger Source',
    '关联单据': 'Related Ticket',
    '结果': 'Result',
    '转事件 + 通知 L2': 'Convert to Incident + Notify L2',
    '确认事件': 'Confirm Incident',
    '生成变更草稿': 'Generate Change Draft',
    '待审批': 'Pending Approval',
    '链路抖动': 'Link Jitter',
    '执行探测复核': 'Execute Probe Review',
    '派发专家': 'Dispatch Expert',
    '查看容量预测、可用性趋势、风险对象与优化建议。': 'Review capacity forecasts, availability trends, risk objects, and optimization recommendations.',
    '可转变更': 'Can Convert to Change',
    '趋势异常': 'Trend Anomaly',
    '需专家复核': 'Expert Review Required',
    'AI 容量预测助手': 'AI Capacity Forecast Assistant',
    '趋势外推 / 耗尽预测 / 扩容工单起草 · 审计留痕': 'Trend Extrapolation / Exhaustion Forecast / Capacity Change Drafting · Audit Trace',
    '耗尽预测': 'Exhaustion Forecast',
    'DB-Master-02 磁盘增长由 10GB/天加速至 12GB/天，耗尽预测从 21 天修正为 14 天。': 'DB-Master-02 disk growth accelerated from 10GB/day to 12GB/day. Exhaustion forecast changed from 21 days to 14 days.',
    '历史 90 日': '90-Day History',
    '链路饱和': 'Link Saturation',
    'GBA-SZ-Core-SW01 汇聚上联利用率 6 周内将饱和，建议本周评估链路聚合扩容。': 'GBA-SZ-Core-SW01 aggregation uplink utilization will saturate within 6 weeks. Assess link aggregation expansion this week.',
    '查看临界对象': 'View Critical Objects',
    '扩容起草': 'Capacity Expansion Drafting',
    '临界对象可 AI 起草扩容工单，带入建议动作、派单组、优先级和 SLA。': 'For critical objects, AI can draft capacity expansion tickets with recommended action, dispatch group, priority, and SLA.',
    '起草扩容工单': 'Draft Capacity Expansion Ticket',
    '资源类型': 'Resource Type',
    '容量线索': 'Capacity Leads',
    '当前利用率': 'Current Utilization',
    '预计耗尽': 'Estimated Exhaustion',
    '存储': 'Storage',
    '扩容': 'Expand',
    '高风险': 'High Risk',
    '起草扩容变更': 'Draft Capacity Expansion Change',
    '数据库': 'Database',
    '归档历史日志': 'Archive Historical Logs',
    '关注': 'Watch',
    '计算': 'Compute',
    '稳定': 'Stable',
    '保持观察': 'Keep Monitoring',
    'Maintenance Expiring 318 台': '318 Assets with Maintenance Expiring',
    'SLA Risk 37 单': '37 SLA-Risk Tickets',
    'Pending Dispatch 26 单': '26 Pending Dispatch Tickets',
    '30 Days 内需跟进': 'Follow-Up Required within 30 Days',
    '7 日内 Action Required': 'Action Required within 7 Days',
    '近 24 小时': 'Last 24 Hours',
    '近 30 Days': 'Last 30 Days',
    'History 90 日': '90-Day History',
    'This Month 平均': 'This Month Average',
    'This Week 变化': 'This Week Change',
    '4 周 Risk': '4-Week Risk',
    'Service 覆盖率 88.9%': 'Service Coverage 88.9%',
    'AI Risk 评分': 'AI Risk Score',
    'Approval 路径': 'Approval Path',
    'Impact 预测': 'Impact Prediction',
    'Topology依赖': 'Topology Dependency',
    'Health 分': 'Health Score',
    'View 质量 Report': 'View Quality Report',
    '质量摘要': 'Quality Summary',
    'Configuration 数据 Governance': 'Configuration Data Governance',
    '关键 Service 依赖': 'Critical Service Dependencies',
    'Assets 一致性': 'Asset Consistency',
    'Assets 与 CI 对账': 'Asset and CI Reconciliation',
    'Linked Entity 聚合 311 items': '311 Correlated Items',
    'vs last week 下降 3m': 'Down 3m vs last week',
    '63 合 1': '63 Merged into 1',
    'ViewRoot Cause 组': 'View Root Cause Group',
    'L2 申请': 'L2 Request',
    '申请 EnableRule': 'Request Rule Enablement',
    'L1 参考': 'L1 Reference',
    '处置记录': 'Handling Records',
    '未 Confirm': 'Unconfirmed',
    '聚合 Rule': 'Aggregation Rule',
    'Alert 到 Tickets': 'Alert to Tickets',
    'L1 直通': 'L1 Straight-Through',
    '人工 Confirm': 'Manual Confirmation',
    '加工流程': 'Processing Flow',
    'Root Cause/Impact/派单': 'Root Cause / Impact / Dispatch',
    '白名单': 'Whitelist',
    'Workspace 跟进': 'Workspace Follow-Up',
    '误报检查': 'False Positive Check',
    '选择 Role': 'Select Role',
    '跑通闭环': 'Run the Closure Flow',
    '单 Tenants': 'Single Tenant',
    'Assets 主动 Management': 'Proactive Asset Management',
    'Service 流程闭环': 'Service Process Closure',
    'Field 履约': 'Field Fulfillment',
    'ProjectDelivery 协同': 'Project Delivery Collaboration',
    '每日 Automatic 巡检 · Ledger / Idle / 到期 · Audit Trace': 'Daily automated inspection · ledger / idle assets / expiry · audit trace',
    '昨日巡检检出 23 itemsAbnormal:重复Ledger 5、Status 矛盾 8、关键信息缺失 10。': 'Yesterday inspection detected 23 abnormal items: 5 duplicate ledgers, 8 status conflicts, and 10 records with missing key information.',
    'Idle 412 台 Medium 17 台连续 90 DaysNoneActions，Recommendation 回收，预计年节省 ¥86,000。': '412 idle assets; 17 have had no actions for 90 consecutive days. Recommended reclaim; estimated annual savings ¥86,000.',
    '17 台': '17 devices',
    '5 份': '5 contracts',
    'Maintenance 30 Days 内到期 17 台，Contract 30 Days 内到期 5 份，RecommendationOpen Contract Management 和Ledger Filter.': '17 devices have maintenance expiring within 30 days and 5 contracts expire within 30 days. Open Contract Management and ledger filters.',
    '跨 9 ItemsRegion': 'Across 9 Regions',
    'Today 12 items已采纳 · 技能 / 位置 / 负载自动推荐 · Audit Trace': '12 recommendations adopted today · skills / location / workload auto-recommendation · audit trace',
    'Dispatch 推荐': 'Dispatch Recommendation',
    'SLA 优先': 'SLA Priority',
    '路线优化': 'Route Optimization',
    'Location 距离': 'Location Distance',
    'View 路线 Recommendation': 'View Route Recommendation',
    '负载均衡': 'Workload Balancing',
    '负载 4/6': 'Workload 4/6',
    'Completed 率 94%': 'Completion Rate 94%',
    'ViewEngineer 负载': 'View Engineer Workload',
    '技能 / Location / 负载': 'Skills / Location / Workload',
    '距离与顺路 Task': 'Distance and On-Route Tasks',
    'Engineer 负载与效率': 'Engineer Workload and Efficiency',
    '3 Items 涉及 Acceptance': '3 Items Involve Acceptance',
    '总项目治理 / 子项目编排 / 工时与Acceptance校验 · Audit Trace': 'Master-project governance / subproject orchestration / timesheet and acceptance validation · audit trace',
    '总 Project Risk Summary': 'Master Project Risk Summary',
    '生成计划': 'Generate Plan',
    'PMS 立 items': 'PMS Project Setup',
    'Create Project 计划': 'Create Project Plan',
    '工时与Acceptance校验': 'Timesheet and Acceptance Validation',
    'Acceptance门控': 'Acceptance Gate',
    'View Acceptance校验': 'View Acceptance Validation',
    '总 Project Risk': 'Master Project Risk',
    'Subproject 和Acceptance': 'Subproject and Acceptance',
    'Milestone 与 Task': 'Milestone and Task',
    '工时 Abnormal': 'Timesheet Anomaly',
    '重复与unlinked': 'Duplicate and Unlinked',
    'Deliverables 校验': 'Deliverables Validation',
    'NPM 预测': 'NPM Forecast',
    '耗尽 Time 修正': 'Exhaustion Time Adjustment',
    'CMDB 依赖': 'CMDB Dependency',
    'Object、Health、发现.': 'Objects, health, and discovery.',
    '链路、拨测、Site.': 'Links, synthetic tests, and sites.',
    'CI、关系、Impact、质量.': 'CIs, relationships, impact, and quality.',
    'Alert、Noise Reduction、处置.': 'Alerts, noise reduction, and handling.',
    '转单、编排、Retry.': 'Ticket conversion, orchestration, and retry.',
    '预测、Risk、优化.': 'Forecasting, risk, and optimization.',
    '12 ItemsImpact 生产 Service': '12 Items Impact Production Services',
    '需回补 Configuration 关系': 'Configuration Relationships Need Completion',
    'Credentials/连通性 Failed': 'Credentials / Connectivity Failed',
    'AI Object 发现助手': 'AI Object Discovery Assistant',
    'Auto Discovery / CI Linked Entity / Impact Scope 模拟 · Audit Trace': 'Auto Discovery / CI Correlation / Impact Scope Simulation · Audit Trace',
    'CMDB 发现': 'CMDB Discovery',
    '待校验': 'Pending Validation',
    '快速 Impact Scope': 'Quick Impact Scope',
    'Object\tTenants\tType\tSite\tHealth\tLinked CI\t发现 Status\tActions': 'Object\tTenant\tType\tSite\tHealth\tLinked CI\tDiscovery Status\tActions',
    '严重': 'Critical',
    '已发现': 'Discovered',
    'Server 池': 'Server Pool',
    'Credentials / 连通性': 'Credentials / Connectivity',
    'Object 到 Service': 'Object to Service',
    'Impact 评分 / 爆炸半径 / Data Quality · Audit Trace': 'Impact Score / Blast Radius / Data Quality · Audit Trace',
    'Root Cause Localization / Noise Reduction 聚合 / AlertConvert to Incident · Audit Trace': 'Root Cause Localization / Noise Reduction Aggregation / Alert-to-Incident · Audit Trace'
  });

  [
    '台', '单', '份', '项', '个', '条', '天', '周'
  ].forEach(function (unsafeUnitKey) {
    delete EN_TERMS[unsafeUnitKey];
  });

  Object.assign(EN_TERMS, {
    '第一次进入统一纳管时，先确定组织视角，再按角色选择一条最小闭环路线。UMP 负责资产、服务、现场和项目交付的日常运营入口。': 'When first entering unified operations, confirm the organization perspective, then choose the minimum closure route by role. UMP is the daily operations entry for assets, services, field work, and project delivery.',
    'MSP 看多个客户租户，ENT 在当前企业租户内按项目和客户定位风险。': 'MSP reviews multiple customer tenants; ENT locates risk by project and customer within the current enterprise tenant.',
    '管理看总览，执行看工作台，专业角色进入对应场景页。': 'Managers use Overview; operators use Workspace; specialist roles enter the corresponding scenario pages.',
    '从风险项进入资产、服务、现场或项目页面，并完成一次处理。': 'Open an asset, service, field, or project page from a risk item and complete one handling workflow.',
    '完成处理后回到总览、报告或治理页面，形成可追踪的运营闭环。': 'After handling is completed, return to Overview, Reports, or Governance to create a traceable operations closure.',
    '适合 IT 主管、区域运维主管。目标是按项目和客户定位运营风险。': 'For IT directors and regional operations leads. The goal is to locate operational risk by project and customer.',
    '进入 UMP 总览，确认当前是 MSP 还是 ENT 视角。': 'Open UMP Overview and confirm whether the current perspective is MSP or ENT.',
    '选择一个高风险租户，或在 ENT 下选择一个项目和客户。': 'Select one at-risk tenant, or select one project and customer under ENT.',
    '进入资产、服务、现场或项目页面，找到一个需要处理的事项。': 'Open an asset, service, field, or project page and find one item requiring action.',
    '从页面动作进入我的待办、报告中心或对应的专业处理页面。': 'Use page actions to open My Work, Report Center, or the corresponding specialist handling page.',
    '管理者先看总览和仪表盘；执行角色先看我的待办。': 'Managers start with Overview and Dashboard; operator roles start with My Work.',
    '高频动作放在 UMP，深度配置进入对应的专业管理页面。': 'Frequent actions stay in UMP; advanced configuration opens the corresponding specialist management page.',
    '近 24 小时': 'Last 24 Hours',
    '近 30 天': 'Last 30 Days',
    '较上周下降 3m': 'Down 3m vs last week',
    '聚合规则': 'Aggregation Rule',
    '告警到工单': 'Alert to Tickets',
    '先看 P1/P2、降噪关联和转事件状态。': 'Start with P1/P2, noise-reduction correlation, and alert-to-incident status.',
    '一线认领确认，L2/L3 处理根因，经理看升级风险。': 'Frontline staff claim and confirm; L2/L3 handle root cause; managers review escalation risk.',
    '可行动告警进入我的待办或 ITSM 事件闭环。': 'Actionable alerts enter My Work or ITSM incident closure.',
    'DB-Master-02 磁盘增长由 10 GB/天加速至 12 GB/天，耗尽预测从 21 天修正为 14 天。': 'DB-Master-02 disk growth accelerated from 10 GB/day to 12 GB/day. Exhaustion forecast changed from 21 days to 14 days.',
    'GBA-SZ-Core-SW 01 汇聚上联利用率 6 周内将饱和，建议本周评估链路聚合扩容。': 'GBA-SZ-Core-SW 01 aggregation uplink utilization will saturate within 6 weeks. Assess link aggregation expansion this week.',
    '本周变化': 'This Week Change',
    '先看 7 日容量风险和可用性下降对象。': 'Start with 7-day capacity risk and objects with declining availability.',
    '按项目和客户判断扩容影响。': 'Assess capacity expansion impact by project and customer.',
    '需要执行时进入变更、派工或资产申请链路。': 'When execution is required, open change, dispatch, or asset request linkage.'
    ,
    '4 个租户需要关注': '4 Tenants Require Attention',
    '红色风险 3 个': '3 Red Risks',
    '美心MX 租户 SLA 96.5% 低于其他租户均值，近 30 天香港站点工单积压 5 单。': 'Maxim MX tenant SLA is 96.5%, lower than the average of other tenants. Hong Kong site ticket backlog reached 5 tickets over the last 30 days.',
    '高风险项目 2 个均属周大福，集中在割接延期和子项目依赖未闭环。': '2 high-risk projects all belong to Chow Tai Fook, concentrated in cutover delays and unclosed subproject dependencies.',
    '周大福计费率 78% 最高，美心MX 筹备期计费率 25% 属预期。': 'Chow Tai Fook has the highest billing rate at 78%; Maxim MX preparation-phase billing rate is 25%, as expected.',
    '资产盘点差异连续两周上升': 'Asset stocktaking variance has increased for two consecutive weeks',
    '现场派工积压影响 SLA': 'Field dispatch backlog impacts SLA',
    '配置数据质量': 'Configuration data quality',
    '新增未关联服务 CI': 'new unlinked service CIs',
    '派工积压': 'Dispatch Backlog',
    '项目延期': 'Project Delayed',
    'CTE 企业客户': 'CTE Enterprise Customer'
    ,
    '4 个 TenantsRequire Attention': '4 Tenants Require Attention',
    '2 个 all belong to': '2 items all belong to',
    '近 30 天 Hong Kong site ticket backlog 5 单': 'Hong Kong site ticket backlog reached 5 tickets over the last 30 days',
    'High-Risk Projects 2 个 all belong to 周大福，concentrated incutover delay 和 subproject dependencies not closed.': '2 high-risk projects all belong to Chow Tai Fook, concentrated in cutover delays and unclosed subproject dependencies.',
    '周大福billing rate 78% highest，美心 MX preparation phase billing rate 25% as expected.': 'Chow Tai Fook has the highest billing rate at 78%; Maxim MX preparation-phase billing rate is 25%, as expected.',
    '单 Tenants': 'Single Tenant',
    '选择一个 At-Risk Tenants，或在 ENT 下选择一个项目和客户.': 'Select one at-risk tenant, or select one project and customer under ENT.',
    'MSP 的统计按租户汇总；ENT 的统计按项目和客户拆开.': 'MSP metrics aggregate by tenant; ENT metrics split by project and customer.',
    'Frequent Actions 放在 UMP，advanced configuration进入对应的specialized management page.': 'Frequent actions stay in UMP; advanced configuration opens the corresponding specialist management page.',
    '进入 UMP 总览查看租户健康排行。': 'Open UMP Overview to review tenant health ranking.',
    '选择一个 SLA 或交付风险最高的租户。': 'Select the tenant with the highest SLA or delivery risk.',
    '下钻到对应场景页确认风险来源。': 'Drill down to the corresponding scenario page to confirm the risk source.',
    '进入报告中心生成租户运营报告。': 'Open Report Center to generate the tenant operations report.',
    '进入 UMP 总览切换 ENT 视角。': 'Open UMP Overview and switch to ENT perspective.',
    '按项目和客户查看资产、服务、现场或交付风险。': 'Review asset, service, field, or delivery risk by project and customer.',
    '进入对应场景页分派负责人。': 'Open the corresponding scenario page to assign the owner.',
    '从我的待办跟进闭环结果。': 'Track closure results from My Work.',
    '先看 UMP 总览。': 'Start with UMP Overview.',
    '进入仪表盘确认趋势。': 'Open Dashboard to confirm the trend.',
    '选择风险项下钻。': 'Select a risk item and drill down.',
    '生成报告或分派责任人。': 'Generate a report or assign an owner.',
    '进入服务运营。': 'Open Service Operations.',
    '筛选 SLA 风险或待处理事件。': 'Filter SLA risks or pending incidents.',
    '打开我的待办处理队列。': 'Open My Work to handle the queue.',
    '关闭后补充处理结论。': 'Add the handling conclusion after closure.',
    '进入资产管理。': 'Open Asset Management.',
    '查看维保到期、库存风险或盘点差异。': 'Review maintenance expiry, inventory risk, or stocktaking variance.',
    '发起资产申请或盘点任务。': 'Create an asset request or stocktaking task.',
    '需要明细维护时进入资产台账。': 'Open Asset Ledger when detailed maintenance is required.',
    '进入现场服务。': 'Open Field Service.',
    '查看待派工和工程师负载。': 'Review pending dispatches and engineer workload.',
    '完成派工或接单。': 'Complete dispatch or accept the work order.',
    '完工后回写验收结果。': 'Write back acceptance results after completion.',
    '进入项目与交付。': 'Open Projects and Delivery.',
    '查看总项目和子项目风险。': 'Review master-project and subproject risk.',
    '处理里程碑、工时或交付物。': 'Handle milestones, timesheets, or deliverables.',
    '验收后完成项目归档。': 'Archive the project after acceptance.',
    '看 UMP Overview、Dashboard 和 Report.': 'Review UMP Overview, Dashboard, and Reports.',
    '从 Service OperationsOpen 待办和 SLA Risk.': 'Open pending work and SLA risks from Service Operations.',
    'ProcessAssets、Contract、Inventory 和 Stocktaking.': 'Process assets, contracts, inventory, and stocktaking.',
    'View ProjectLevel、Task 和 Acceptance Risk.': 'Review project-level, task, and acceptance risk.',
    '30 天内需跟进': 'Follow-Up Required within 30 Days',
    '每日 Automatic 巡检 · Ledger / Idle / 到期 · Audit Trace': 'Daily Automated Inspection · Ledger / Idle Assets / Expiry · Audit Trace',
    '昨日巡检检出 23 条 Abnormal: duplicate ledgers 5、status conflicts 8、missing key information 10。': 'Yesterday inspection detected 23 abnormal items: 5 duplicate ledgers, 8 status conflicts, and 10 records with missing key information.',
    'Yesterday inspection detected 23 items异常: duplicate ledgers 5, status conflicts 8, missing key information 10.': 'Yesterday inspection detected 23 abnormal items: 5 duplicate ledgers, 8 status conflicts, and 10 records with missing key information.',
    'Idle 412 台 Medium 17 台连续 90 天 NoneActions，recommended reclaim，estimated annual savings ¥86,000。': '412 idle assets; 17 have had no actions for 90 consecutive days. Recommended reclaim; estimated annual savings ¥86,000.',
    'Idle 412 devices中 17 devices 连续 90 days无操作,recommended reclaim,estimated annual savings ¥86,000.': 'Among 412 idle assets, 17 have had no activity for 90 consecutive days. Reclaim is recommended, with estimated annual savings of ¥86,000.',
    'Maintenance 30 天内到期 17 台，Contract 30 天内到期 5 份，Recommendationopen Contract Management 和 ledger filters.': '17 devices have maintenance expiring within 30 days and 5 contracts expire within 30 days. Open Contract Management and ledger filters.',
    '维保 30 days内到期 17 devices,合同 30 days内到期 5 contracts,Recommendation open Contract Management 和 ledger filters.': '17 assets have maintenance expiring within 30 days and 5 contracts expire within 30 days. Open Contract Management and ledger filters.',
    '专项 Stocktaking 计划': 'Dedicated Stocktaking Plan',
    '先确认是跨租户资产风险，还是当前租户内项目 / 客户资产风险。': 'First confirm whether it is cross-tenant asset risk or project/customer asset risk within the current tenant.',
    '先确认是跨租户资产风险，还是 Current Tenant 内项目 / 客户资产风险.': 'First confirm whether it is cross-tenant asset risk or project/customer asset risk within the current tenant.',
    '先确认是跨租户资产风险,还是 Current Tenant 内项目 / 客户资产风险.': 'First confirm whether it is cross-tenant asset risk or project/customer asset risk within the current tenant.',
    '优先处理维保到期、库存低水位、盘点差异和资产申请。': 'Prioritize maintenance expiry, low inventory level, stocktaking variance, and asset requests.',
    '优先处理 Maintenance Expiring、库存低水位、Stocktaking Variance 和 Asset Requests.': 'Prioritize maintenance expiry, low inventory level, stocktaking variance, and asset requests.',
    '优先处理 Maintenance Expiring, 库存低水位, Stocktaking Variance 和 Asset Requests.': 'Prioritize maintenance expiry, low inventory level, stocktaking variance, and asset requests.',
    '复杂资产生命周期进入资产高级管理。': 'Open Advanced Asset Management for complex asset lifecycle work.',
    '复杂 AssetsLifecycleOpenAdvanced Asset Management.': 'Open Advanced Asset Management for complex asset lifecycle work.',
    'Web Server CPU 过载已关联 CMDB Topology定位根因，Recommendation优先重启 App-Server-03 应用进程.': 'Web server CPU overload has been correlated with CMDB topology for root cause localization. Recommended restarting the App-Server-03 application process first.',
    'Core SwitchLatencyAlert SLA 仅剩 0h 28m，Recommend ImmediateEscalationProcess 或 Dispatch Onsite.': 'Core switch latency alert has only 0h 28m of SLA remaining. Recommended immediate escalation or onsite dispatch.',
    'CHG-20260813-001 Impact 23 CIs、覆盖 3 个业务 System，Recommendation 在 02:00-05:00 维护 Window 执行.': 'CHG-20260813-001 impacts 23 CIs and covers 3 business systems. Recommended execution in the 02:00-05:00 maintenance window.',
    '跨 9 个 Region': 'Across 9 Regions',
    'Today 12 items已采纳 · 技能 / 位置 / 负载自动推荐 · Audit Trace': '12 Recommendations Adopted Today · Skills / Location / Workload Auto-Recommendation · Audit Trace',
    'FSM-2026-139 UPS 电池更换推荐 P.Y. Lau：GBA-GZ 现场待命、电力系统认证、当前负载 1/5，预计 2h 完成。': 'FSM-2026-139 UPS battery replacement recommends P.Y. Lau: on standby onsite at GBA-GZ, certified for power systems, current workload 1/5, estimated completion in 2h.',
    'FSM-2026-139 UPS 电池更换推荐 P.Y. Lau: GBA-GZ 现场待命、电力系统认证、当前负载 1/5，预计 2h Completed.': 'FSM-2026-139 UPS battery replacement recommends P.Y. Lau: on standby at GBA-GZ, certified for power systems, current workload 1/5, estimated completion in 2h.',
    'FSM-2026-139 UPS battery replacement recommends P.Y. Lau: GBA-GZ on standby onsite, certified for power systems, current workload 1/5,预计 2 h Completed.': 'FSM-2026-139 UPS battery replacement recommends P.Y. Lau: on standby onsite at GBA-GZ, certified for power systems, current workload 1/5, estimated completion in 2h.',
    'K.H. Wong 当前在 HKT Tower，Meraki AP 更换地点 Ocean Park 距离 12km，建议当前任务完成后顺路处理。': 'K.H. Wong is currently at HKT Tower. The Meraki AP replacement site at Ocean Park is 12 km away; recommended handling it on route after the current task is completed.',
    'K.H. Wong 当前在 HKT Tower，Meraki AP 更换地点 Ocean Park 距离 12km，RecommendationCurrentTaskCompleted 后顺路 Process.': 'K.H. Wong is currently at HKT Tower. The Meraki AP replacement site at Ocean Park is 12 km away; recommended processing it on route after the current task is completed.',
    'K.H. Wong 当前在 HKT Tower,Meraki AP replacement site Ocean Park 距离 12 km,Recommendation当前任务Completed后顺路处理.': 'K.H. Wong is currently at HKT Tower. The Meraki AP replacement site at Ocean Park is 12 km away; recommended handling it on route after the current task is completed.',
    'current active engineers 4/6，T.K. Yip 与 P.Y. Lau 待命中；本周任务Completed率 94%，vs last week提升 8%。': 'Current active engineers 4/6; T.K. Yip and P.Y. Lau are on standby. This week task completion rate is 94%, up 8% vs last week.',
    'current active engineers 4/6,T.K. Yip 与 P.Y. Lau 待命中；本周任务Completed率 94%,vs last week提升 8%.': 'Current active engineers 4/6; T.K. Yip and P.Y. Lau are on standby. This week task completion rate is 94%, up 8% vs last week.',
    '负载 4/6': 'Workload 4/6',
    '技能 / Location / 负载': 'Skills / Location / Workload',
    '距离与顺路 Task': 'Distance and On-Route Tasks',
    'Engineer 负载与效率': 'Engineer Workload and Efficiency',
    '先看 Pending Dispatch、Engineer 负载和 SLA Risk.': 'Start with pending dispatch, engineer workload, and SLA risk.',
    'DispatcherProcessDispatch，FieldEngineer 从 WorkspaceAccept 和 Writeback.': 'Dispatchers process dispatch; field engineers accept and write back from Workspace.',
    'Acceptance、Schedule 和 Engineer 深度 ManagementOpenField Service Management.': 'Open Field Service Management for deeper acceptance, scheduling, and engineer management.',
    '3 个涉及 Acceptance': '3 Items Involve Acceptance',
    '总项目治理 / 子项目编排 / 工时与验收校验 ·': 'Master-Project Governance / Subproject Orchestration / Timesheet and Acceptance Validation ·',
    '总项目治理 / 子项目编排 / 工时与Acceptance校验 ·': 'Master-Project Governance / Subproject Orchestration / Timesheet and Acceptance Validation ·',
    '总项目治理 / 子项目编排 / 工时与Acceptance校验 · Audit Trace': 'Master-Project Governance / Subproject Orchestration / Timesheet and Acceptance Validation · Audit Trace',
    '工时与Acceptance校验': 'Timesheet and Acceptance Validation',
    'Acceptance门控': 'Acceptance Gate',
    'View Acceptance校验': 'View Acceptance Validation',
    '总 Project Risk': 'Master Project Risk',
    'Subproject 和Acceptance': 'Subproject and Acceptance',
    'Milestone 与 Task': 'Milestone and Task',
    '工时 Abnormal': 'Timesheet Anomaly',
    'Deliverables 校验': 'Deliverables Validation',
    '先区分 Master Project、Subproject 和 Standalone Project.': 'First distinguish master projects, subprojects, and standalone projects.',
    'PMO 看组合风险，PM 看里程碑、任务、交付物和Acceptance.': 'PMO reviews portfolio risk; PM reviews milestones, tasks, deliverables, and acceptance.',
    '复杂 Project 计划 OpenAdvanced Project Management.': 'Open Advanced Project Management for complex project planning.',
    '7 日内 Action Required': 'Action Required within 7 Days',
    '业务门户 Application Synthetic Test 下载速度 1 小时内下降 87%，Traceroute 指向 Page 7 跳 AS 4134 骨干 Packet Loss.': 'Business portal synthetic download speed dropped 87% within 1 hour; traceroute points to packet loss on AS 4134 backbone hop 7.',
    '5 条 Alert 已聚合为 Event INC-20260813-003，Confidence 96.7%，可 Open ITSM 继续 Process.': '5 alerts have been aggregated into incident INC-20260813-003 with 96.7% confidence. Open ITSM to continue handling.',
    'DB-Master-02 磁盘增长加速，Exhaustion Forecast 由 21 天修正为 14 天，Recommendation 优先处置临界 Object.': 'DB-Master-02 disk growth accelerated; exhaustion forecast changed from 21 days to 14 days. Prioritize critical objects.',
    '耗尽 Time 修正': 'Exhaustion Time Adjustment',
    '先确认值守范围.MSP 看租户健康，ENT 看项目和客户影响.': 'Confirm the monitoring scope first. MSP reviews tenant health; ENT reviews project and customer impact.',
    '从对象、可用性、告警、配置关系和 Capacity Risk 定位入口.': 'Choose the entry point from objects, availability, alerts, configuration relationships, and capacity risk.',
    '处置 ActionOpenAlert、Network、Configuration 或 AutomationPage 面.': 'For handling actions, open Alert, Network, Configuration, or Automation pages.',
    'MSP 先看租户健康，ENT 先看 Current Enterprise Tenant 内的项目和客户影响.': 'MSP starts with tenant health; ENT starts with project and customer impact within the current enterprise tenant.',
    '从 Object、Links、Configuration、Alert 和 CapacityMedium 选 highestPriority.': 'Select the highest-priority item from object, link, configuration, alert, and capacity categories.',
    'AlertClaim、Convert to Incident、补关系、TriggeredAutomation 或 ExpandAction.': 'Claim alerts, convert to incidents, complete relationships, trigger automation, or start capacity expansion actions.',
    '回到总览、仪表盘或 Report Center，形成 MTTR、可用性和自动化收益报告.': 'Return to Overview, Dashboard, or Report Center to produce MTTR, availability, and automation benefit reports.',
    '适合 MSP NOC 经理、运营管理者.目标是找出哪个租户影响最大.': 'For MSP NOC managers and operations managers. The goal is to identify which tenant has the largest impact.',
    '适合 NOC 值班和一线服务响应.目标是按项目和客户 Handle Alert 影响.': 'For NOC duty and frontline service response. The goal is to handle alert impact by project and customer.',
    '适合网络工程师、TAC、L2/L3.目标是定位Synthetic Tests失败和Links影响.': 'For network engineers, TAC, and L2/L3. The goal is to locate synthetic test failures and link impact.',
    '适合 Configuration Manager、变更经理、专业工程师.目标是判断 CI 和服务影响面.': 'For configuration managers, change managers, and specialist engineers. The goal is to assess CI and service impact scope.',
    '适合一线、L2/L3、值班经理.目标是确认、降噪、转事件和保留记录.': 'For frontline staff, L2/L3, and duty managers. The goal is confirmation, noise reduction, incident conversion, and record retention.',
    '适合运维经理、平台管理员.目标是处理自动化失败和容量扩容风险.': 'For operations managers and platform administrators. The goal is to handle automation failures and capacity expansion risk.',
    '选择告警、容量或链路风险最高的租户。': 'Select the tenant with the highest alert, capacity, or link risk.',
    '下钻到对应场景页确认异常来源。': 'Drill down to the corresponding scenario page to confirm the anomaly source.',
    '生成租户运维报告或分派责任人。': 'Generate a tenant operations report or assign an owner.',
    '按项目和客户查看告警、链路和容量影响。': 'Review alert, link, and capacity impact by project and customer.',
    '进入告警中心或网络与拨测处理。': 'Open Alert Center or Network and Synthetic Monitoring for handling.',
    '查看自动化和容量风险。': 'Review automation and capacity risk.',
    '生成报告或调整治理策略。': 'Generate a report or adjust governance policies.',
    '进入告警中心。': 'Open Alert Center.',
    '筛选 P1/P2 和 SLA 风险。': 'Filter P1/P2 and SLA risks.',
    '认领告警并转事件。': 'Claim the alert and convert it to an incident.',
    '从我的待办跟进处置状态。': 'Track handling status from My Work.',
    '进入网络与拨测。': 'Open Network and Synthetic Monitoring.',
    '定位失败拨测和异常链路。': 'Locate failed synthetic tests and abnormal links.',
    '下钻拓扑或对象健康。': 'Drill down into topology or object health.',
    '必要时转事件或变更。': 'Convert to incident or change when required.',
    '进入配置管理。': 'Open Configuration Management.',
    '查看孤立 CI、服务关系和影响面。': 'Review isolated CIs, service relationships, and impact scope.',
    '补齐数据质量问题。': 'Complete data-quality fixes.',
    '需要复杂建模时进入配置建模。': 'Open Configuration Modeling when complex modeling is required.',
    '进入自动化运维。': 'Open Operations Automation.',
    '查看失败重试和自动处置收益。': 'Review failed retries and auto-remediation benefits.',
    '高风险项转人工队列。': 'Move high-risk items to the manual queue.',
    '容量风险进入扩容动作。': 'Route capacity risk into expansion actions.',
    '进入告警、网络、配置或容量页面，定位一个异常来源.': 'Open Alert, Network, Configuration, or Capacity pages to locate one anomaly source.',
    'CompletedClaim、Convert to Incident、补关系、TriggeredAutomation 或生成 Report.': 'Complete claim, convert to incident, complete relationships, trigger automation, or generate a report.',
    'Monitoring Duty 先看 Alert；专家先看 Network、Object 和 Configuration 上下文.': 'Monitoring duty starts with alerts; specialists start with network, object, and configuration context.',
    'MSP 的异常按租户汇总；ENT 的异常按项目和客户拆开.': 'MSP anomalies aggregate by tenant; ENT anomalies split by project and customer.',
    'frequent monitoring operations放在 MOP，advanced configuration进入对应的specialized management page.': 'Frequent monitoring operations stay in MOP; advanced configuration opens the corresponding specialist management page.',
    '从 Alert CenterOpenClaim、转单和 Escalation.': 'Open claim, ticket conversion, and escalation from Alert Center.',
    '从 Network、Configuration 和 Object 上下文 Investigate.': 'Investigate from network, configuration, and object context.',
    '维护 CI、关系、Impact Scope 和Data Quality.': 'Maintain CIs, relationships, impact scope, and data quality.',
    '看 Overview、AutomationBenefits 和 Capacity Risk.': 'Review Overview, automation benefits, and capacity risk.',
    '12 个 impact production services': '12 Items Impact Production Services',
    '自动发现 / CI 关联 / 影响面模拟 ·': 'Auto Discovery / CI Correlation / Impact Scope Simulation ·',
    'Auto Discovery / CI Correlation / Impact Scope 模拟 · Audit Trace': 'Auto Discovery / CI Correlation / Impact Scope Simulation · Audit Trace',
    'Auto Discovery / CI Correlation / Impact Scope 模拟 ·': 'Auto Discovery / CI Correlation / Impact Scope Simulation ·',
    'Discovery JobsCredentials 或连通性 Failed 18 项，Recommendation 优先复核 impact production services 的 12 个 Offline Objects.': '18 discovery jobs failed due to credentials or connectivity. Prioritize review of 12 offline objects impacting production services.',
    '73 个 Monitored ObjectsUnlinked CIs，会 Impacts alert aggregation、Impact Analysis 和报表口径.': '73 monitored objects are not linked to CIs, affecting alert aggregation, impact analysis, and reporting scope.',
    'coresw-01 可快速模拟 Impact 3 个 Service、240 人，用于 Alert Handling 前判断业务 Impact.': 'coresw-01 can quickly simulate impact on 3 services and 240 users before alert handling.',
    'Credentials / 连通性': 'Credentials / Connectivity',
    'Object 到 Service': 'Object to Service',
    '先看 Offline Objects、Discovery Exceptions 和 Unlinked CIs.': 'Start with offline objects, discovery exceptions, and unlinked CIs.',
    'ENT Perspective 按 Project and Customer 判断 ObjectImpact.': 'Use ENT perspective to assess object impact by project and customer.',
    'Object 关系深查 OpenConfiguration Management 或Topology.': 'For deeper object relationship investigation, open Configuration Management or Topology.',
    '业务门户 Application Synthetic Test 总 Time 升至 8.4s，HTTP Error 增多，AI 标注为连续劣化.': 'Business portal synthetic test total time rose to 8.4s and HTTP errors increased; AI marked continuous degradation.',
    '业务门户 Application Synthetic Test 总 Time 升至 8.4s,HTTP Error 增多,AI marked continuous degradation.': 'Business portal synthetic test total time rose to 8.4s; HTTP errors increased and AI marked it as continuous degradation.',
    'Traceroute 显示 Page 7 跳 AS 4134 骨干 Packet Loss 12%，责任归属运营商骨干.': 'Traceroute shows 12% packet loss on AS 4134 backbone hop 7; ownership is the carrier backbone.',
    'Traceroute 显示 Page 7 AS 4134 骨干 Packet Loss 12%,ownership is the carrier backbone.': 'Traceroute shows 12% packet loss on AS 4134 backbone at hop 7; ownership is the carrier backbone.',
    'GBA-SZ 到 GBA-GZ 连续 3 小时 Packet Loss 超过 2%，Recommendation 检查 Cross-Border Egress 或切换线路.': 'GBA-SZ to GBA-GZ packet loss exceeded 2% for 3 consecutive hours. Check cross-border egress or switch links.',
    'GBA-SZ 到 GBA-GZ 连续 3 小时 Packet Loss 超过 2%,Recommendation 检查 Cross-Border Egress 或切换线路.': 'GBA-SZ to GBA-GZ packet loss exceeded 2% for 3 consecutive hours. Check cross-border egress or switch links.',
    '先看网络质量和拨测失败，再定位链路和站点。': 'Start with network quality and failed synthetic tests, then locate links and sites.',
    '先看 Network Quality 和Synthetic Tests Failed，再 Positioning Links和 Site.': 'Start with network quality and failed synthetic tests, then locate links and sites.',
    '先看 Network Quality 和Synthetic Tests Failed,再 Positioning Links和 Site.': 'Start with network quality and failed synthetic tests, then locate links and sites.',
    '网络工程师从异常链路进入拓扑或诊断。': 'Network engineers open topology or diagnostics from abnormal links.',
    'NetworkEngineer 从 Abnormal Links Open Topology或诊断.': 'Network engineers open topology or diagnostics from abnormal links.',
    '影响到服务时回到告警或 ITSM 事件闭环。': 'When service impact exists, return to Alert or ITSM incident closure.',
    'Impact 到 Service 时回到 Alert 或 ITSM Event 闭环.': 'When service impact exists, return to Alert or ITSM incident closure.',
    '当前企业租户内按项目 / 客户查看网络质量、拨测任务和链路影响。': 'Review network quality, synthetic test tasks, and link impact by project / customer within the current enterprise tenant.',
    'Current Enterprise Tenant 内按项目 / 客户查看 Network Quality, Synthetic Test Tasks 和Links影响.': 'Review network quality, synthetic test tasks, and link impact by project / customer within the current enterprise tenant.',
    'ENT 企业租户网络视角': 'ENT Enterprise Tenant Network View',
    '默认按项目 / 客户定位网络影响。': 'By default, locate network impact by project / customer.',
    'Default 按 Project / Customer 定位 Network Impact.': 'By default, locate network impact by project / customer.',
    '当前企业租户评分': 'Current Enterprise Tenant Score',
    'Current Enterprise Tenant 评分': 'Current Enterprise Tenant Score',
    '4 高延迟': '4 High-Latency Links',
    '当前企业租户内按项目 / 客户查看资产、服务、现场与交付结果。管理看项目和客户，执行进工作台。': 'Review assets, services, field work, and delivery outcomes by project / customer within the current enterprise tenant. Managers review projects and customers; operators use Workspace.',
    '视角|ENT 企业租户': 'Perspective|ENT Enterprise Tenant',
    '当前企业租户|': 'Current Enterprise Tenant|',
    '分组|项目 / 客户': 'Grouping|Project / Customer',
    '周期|近 30 天': 'Period|Last 30 Days',
    '窗口|24 小时': 'Window|24 Hours',
    '范围|项目 / 客户': 'Scope|Project / Customer',
    'ENT 企业租户运营视角': 'ENT Enterprise Tenant Operations View',
    '同一汇总组件从租户维度切换为项目 / 客户维度。': 'The same summary component switches from tenant dimension to project / customer dimension.',
    '9 项目': '9 Projects',
    '5 客户': '5 Customers',
    '3 交付风险': '3 Delivery Risks',
    '3 个项目需关注': '3 Projects Need Attention',
    '维保到期 86 台': '86 Assets with Maintenance Expiring',
    'SLA 风险 9 单': '9 SLA-Risk Tickets',
    '待派工 8 单': '8 Pending Dispatches',
    '红色风险 1 个': '1 Red Risk',
    '需本周闭环': 'Closure Required This Week',
    '当前企业租户 · 按项目 / 客户': 'Current Enterprise Tenant · By Project / Customer',
    '当前企业租户内管理资产台账、合同维保、库存盘点与资产申请，复杂生命周期进入资产高级管理。': 'Manage asset ledger, contract maintenance, inventory stocktaking, and asset requests within the current enterprise tenant. Use Advanced Asset Management for complex lifecycles.',
    'ENT 企业租户资产视角': 'ENT Enterprise Tenant Asset View',
    '同一资产列表从租户维度切换为项目 / 客户维度。': 'The same asset list switches from tenant dimension to project / customer dimension.',
    '86 到期': '86 Expiring',
    '9 低水位': '9 Low-Stock',
    '当前企业租户 · 9 项目': 'Current Enterprise Tenant · 9 Projects',
    '当前企业租户内查看 CI、服务关系、影响面与数据质量，复杂模型维护进入配置建模。': 'Review CIs, service relationships, impact scope, and data quality within the current enterprise tenant. Use Configuration Modeling for complex model maintenance.',
    'ENT 企业租户配置视角': 'ENT Enterprise Tenant Configuration View',
    '默认按项目 / 客户查看配置关系和影响面。': 'By default, review configuration relationships and impact scope by project / customer.',
    '14 待治理': '14 Governance Items',
    '服务覆盖率 92.4%': 'Service Coverage 92.4%',
    '较上周 +1.8%': '+1.8% vs Last Week',
    '当前企业租户内跟进请求、事件、问题、变更与知识。待办进工作台。': 'Track requests, incidents, problems, changes, and knowledge within the current enterprise tenant. Pending work goes to Workspace.',
    'ENT 企业租户服务视角': 'ENT Enterprise Tenant Service View',
    '默认按项目 / 客户查看服务履约和待处理队列。': 'By default, review service fulfillment and pending queues by project / customer.',
    '326 工单': '326 Tickets',
    '9 SLA 风险': '9 SLA Risks',
    '待审批 18 单': '18 Pending Approvals',
    'P1/P2 共 7 单': '7 P1/P2 Tickets',
    '本周窗口 11 个': '11 Windows This Week',
    'TOP 服务 3 个': '3 Top Services',
    '当前企业租户内管理现场工单、派工、工程师资源和排班。待办进工作台。': 'Manage field work orders, dispatch, engineer resources, and schedules within the current enterprise tenant. Pending work goes to Workspace.',
    'ENT 企业租户现场视角': 'ENT Enterprise Tenant Field Service View',
    '默认按项目 / 客户查看现场任务、服务等级和履约风险。': 'By default, review field tasks, service levels, and fulfillment risk by project / customer.',
    '72 现场任务': '72 Field Tasks',
    '8 待派工': '8 Pending Dispatches',
    '今日新增 11 单': '11 New Today',
    '4 小时 SLA 3 单': '3 Tickets with 4h SLA',
    '较上周 +4%': '+4% vs Last Week',
    '本月平均': 'Monthly Average',
    '当前企业租户内查看总项目、子项目、任务、交付物和验收关闭。PM / PMO 按里程碑推进。': 'Review master projects, subprojects, tasks, deliverables, and acceptance closure within the current enterprise tenant. PM / PMO progresses work by milestone.',
    'ENT 企业租户项目视角': 'ENT Enterprise Tenant Project View',
    '默认按项目 / 客户、里程碑、PM 和交付风险组织项目工作。': 'By default, organize project work by project / customer, milestone, PM, and delivery risk.',
    '9 在途项目': '9 Active Projects',
    '1 红色风险': '1 Red Risk',
    '总项目 2 · 子项目 7': '2 Master Projects · 7 Subprojects',
    '1 个红色风险': '1 Red Risk',
    '本周计划关闭': 'Planned Closure This Week',
    '待确认 6 项': '6 Pending Confirmation',
    '当前企业租户内按项目 / 客户查看对象健康、业务可用性、告警、自动化和容量风险。': 'Review object health, business availability, alerts, automation, and capacity risk by project / customer within the current enterprise tenant.',
    'ENT 企业租户运维视角': 'ENT Enterprise Tenant Operations View',
    '同一健康排行组件从租户维度切换为项目 / 客户维度。': 'The same health ranking component switches from tenant dimension to project / customer dimension.',
    '8 容量风险': '8 Capacity Risks',
    '离线 12 个': '12 Offline',
    '环比 +0.02%': '+0.02% Period over Period',
    'P1/P2 共 7 条': '7 P1/P2 Alerts',
    '关联聚合 86 条': '86 Correlated Alerts',
    '失败重试 3 次': '3 Failed Retries',
    '当前企业租户内查看服务器、网络、链路、站点与业务服务健康。': 'Review server, network, link, site, and business service health within the current enterprise tenant.',
    'ENT 企业租户对象视角': 'ENT Enterprise Tenant Object View',
    '默认按项目 / 客户查看监控对象健康和关联 CI。': 'By default, review monitored object health and linked CIs by project / customer.',
    '7,420 对象': '7,420 Objects',
    '21 未关联 CI': '21 Unlinked CIs',
    '5 个影响生产服务': '5 Impact Production Services',
    '当前企业租户内处理告警、降噪、转单与处置记录。待办进工作台。': 'Handle alerts, noise reduction, ticket conversion, and handling records within the current enterprise tenant. Pending work goes to Workspace.',
    'ENT 企业租户告警视角': 'ENT Enterprise Tenant Alert View',
    '默认按项目 / 客户查看告警影响和处置状态。': 'By default, review alert impact and handling status by project / customer.',
    '42 活跃告警': '42 Active Alerts',
    '7 高优先级': '7 High Priority',
    '较上周下降 4m': 'Down 4m vs Last Week',
    '当前企业租户内管理自动处置规则、编排记录、失败重试和转单链路。': 'Manage auto-remediation rules, orchestration records, failed retries, and ticket-conversion flows within the current enterprise tenant.',
    'ENT 企业租户自动化视角': 'ENT Enterprise Tenant Automation View',
    '默认按项目 / 客户查看自动化收益和风险。': 'By default, review automation benefits and risk by project / customer.',
    '76% 自动处置': '76% Auto-Remediation',
    '3 失败重试': '3 Failed Retries',
    '当前企业租户 · 24 小时': 'Current Enterprise Tenant · 24 Hours',
    '当前企业租户内查看容量预测、可用性趋势、风险对象和优化建议。': 'Review capacity forecasts, availability trends, risk objects, and optimization recommendations within the current enterprise tenant.',
    'ENT 企业租户容量视角': 'ENT Enterprise Tenant Capacity View',
    '默认按项目 / 客户制定扩容和优化动作。': 'By default, plan expansion and optimization actions by project / customer.',
    '99.91% 可用性': '99.91% Availability',
    'CPU / 存储 / 连接数': 'CPU / Storage / Connections',
    '可自动生成变更': 'Can Auto-Generate Changes',
    'ENT 项目 / 客户视角': 'ENT Project / Customer View',
    '同一运营组件从租户维度切换为项目 / 客户维度，避免把 MSP 租户排行简单降级为 ENT 列表。': 'The same operations component switches from tenant dimension to project / customer dimension, avoiding a simple downgrade from MSP tenant ranking to an ENT list.',
    '项目维度': 'Project Dimension',
    '客户维度': 'Customer Dimension',
    '全部区域': 'All Regions',
    '盘点建议': 'Stocktaking Recommendation',
    '闲置资产分析': 'Idle Asset Analysis',
    'Impact 评分 / 爆炸半径 / Data Quality · Audit Trace': 'Impact Score / Blast Radius / Data Quality · Audit Trace',
    'View 质量 Report': 'View Quality Report',
    'Configuration 数据 Governance': 'Configuration Data Governance',
    '关键 Service 依赖': 'Critical Service Dependencies',
    'Assets 一致性': 'Asset Consistency',
    'Assets 与 CI 对账': 'Asset and CI Reconciliation',
    '先看 CI、Service Relationships、Impact Analysis 和Data Quality.': 'Start with CIs, service relationships, impact analysis, and data quality.',
    'Change 或 Alert Handling 前先判断 Impact Scope.': 'Assess impact scope before change or alert handling.',
    '深度建模和数据 GovernanceOpenConfiguration Modeling.': 'Open Configuration Modeling for advanced modeling and data governance.',
    'vs last week 下降 3m': 'Down 3m vs last week',
    'Root Cause Localization / Noise Reduction 聚合 / AlertConvert to Incident · Audit Trace': 'Root Cause Localization / Noise Reduction Aggregation / Alert-to-Incident · Audit Trace',
    'GBA-SZ-Core-SW 01 的 63 条 Alert 已聚合为 1 组 Root Cause Incident: OSPF 邻居震荡.': '63 alerts from GBA-SZ-Core-SW 01 have been aggregated into 1 root cause incident: OSPF neighbor flapping.',
    '63 合 1': '63 Merged into 1',
    '基于 OSPF 邻居关系自动聚合告警，预计提升降噪率 3.2%，Enable 需 Approval.': 'Automatically aggregate alerts based on OSPF neighbor relationships. Estimated noise reduction improvement is 3.2%; enablement requires approval.',
    '5 条 AlertAutomatic 聚合为 INC-20260813-003，Confidence 96.7%，转入 ITSM Process.': '5 alerts were automatically aggregated into INC-20260813-003 with 96.7% confidence and moved into ITSM handling.',
    'Actionable AlertsOpen My Work 或 ITSM Event 闭环.': 'Actionable alerts enter My Work or ITSM incident closure.',
    '人工 Confirm': 'Manual Confirmation',
    'Root Cause/Impact/派单': 'Root Cause / Impact / Dispatch',
    'Workspace 跟进': 'Workspace Follow-Up',
    '先看 Auto RemediationSuccess 率和 Failed Retries.': 'Start with auto-remediation success rate and failed retries.',
    'High RiskAutomationAction 需要 OpenGovernance 或 Approval.': 'High-risk automation actions require Governance or Approval.',
    'Failed 项优先 Transfer to Manual Review 队列，不让 Alert 沉没.': 'Prioritize failed items for transfer to the manual review queue so alerts do not get buried.',
    '近 30 days': 'Last 30 Days',
    'DB-Master-02 磁盘增长由 10 GB/天加速至 12 GB/天，Exhaustion Forecast 从 21 天修正为 14 天.': 'DB-Master-02 disk growth accelerated from 10 GB/day to 12 GB/day. Exhaustion forecast changed from 21 days to 14 days.',
    'History 90 日': '90-Day History',
    'GBA-SZ-Core-SW 01 汇聚上联 Utilization 6 周内将饱和，Recommend This Week AssessmentLinks聚合 Expand.': 'GBA-SZ-Core-SW 01 aggregation uplink utilization will saturate within 6 weeks. Assess link aggregation expansion this week.',
    '4 周 Risk': '4-Week Risk'
    ,
    '个租户需要关注': 'Tenants Require Attention',
    '低于其他租户均值，近': 'lower than the average of other tenants over the last',
    '天香港站点工单积压': 'days, Hong Kong site ticket backlog',
    '个均属周大福，集中在割接延期和子项目依赖未闭环。': 'items all belong to Chow Tai Fook, concentrated in cutover delays and unclosed subproject dependencies.',
    '个 all belong to 周大福，concentrated incutover delay 和 subproject dependencies not closed.': 'items all belong to Chow Tai Fook, concentrated in cutover delays and unclosed subproject dependencies.',
    '周大福计费率': 'Chow Tai Fook billing rate',
    '周大福billing rate': 'Chow Tai Fook billing rate',
    '最高，美心MX 筹备期计费率': 'highest; Maxim MX preparation-phase billing rate',
    'highest，美心 MX preparation phase billing rate': 'highest; Maxim MX preparation-phase billing rate',
    '属预期。': 'as expected.',
    '达美乐海外门店 Asset stocktaking variance has increased for two consecutive weeks': 'Domino Overseas Stores asset stocktaking variance has increased for two consecutive weeks',
    '周大福 APAC Field dispatch backlog impacts SLA': 'Chow Tai Fook APAC field dispatch backlog impacts SLA',
    '个业务 System': 'business systems',
    '覆盖 3 个业务 System': 'covers 3 business systems',
    '连续 90 天 NoneActions': 'no actions for 90 consecutive days',
    '条 Abnormal': 'abnormal items',
    '到期 · Audit Trace': 'expiry · audit trace',
    'Recommendationopen': 'Recommended opening',
    '和 ledger filters': 'and ledger filters',
    'Today 12 items已采纳': '12 recommendations adopted today',
    '技能 / 位置 / 负载自动推荐': 'skills / location / workload auto-recommendation',
    '电池更换推荐': 'battery replacement recommends',
    '现场待命': 'on standby onsite',
    '电力系统认证': 'certified for power systems',
    '当前负载': 'current workload',
    '预计': 'estimated',
    '当前在': 'is currently at',
    '更换地点': 'replacement site',
    '距离': 'distance',
    '后顺路 Process': 'then process on route',
    '待命中': 'on standby',
    '本周任务Completed率': 'this week task completion rate',
    '提升': 'up',
    '总项目治理 / 子项目编排 / 工时与Acceptance校验 · Audit Trace': 'Master-project governance / subproject orchestration / timesheet and acceptance validation · audit trace',
    '总 Project Risk': 'Master Project Risk',
    '和Acceptance': 'and Acceptance',
    '工时 Abnormal': 'Timesheet Anomaly',
    '重复与unlinked': 'Duplicate and Unlinked',
    '业务门户 Application Synthetic Test 下载速度': 'Business portal synthetic test download speed',
    '小时内下降': 'dropped within hours',
    '指向 Page': 'points to hop',
    '跳 AS': 'AS',
    '骨干 Packet Loss': 'backbone packet loss',
    '条 Alert 已聚合为 Event': 'alerts have been aggregated into incident',
    '可 Open ITSM 继续 Process': 'Open ITSM to continue handling',
    '磁盘增长加速': 'disk growth accelerated',
    '由 21 天修正为 14 天': 'changed from 21 days to 14 days',
    '优先处置临界 Object': 'prioritize critical objects',
    '补关系': 'complete relationships',
    '生成 Report': 'generate a report',
    '运维 Managers': 'Operations Managers',
    '模拟 · Audit Trace': 'simulation · audit trace',
    '或连通性 Failed': 'or connectivity failed',
    '优先复核': 'prioritize review of',
    '报表口径': 'reporting scope',
    '可快速模拟 Impact': 'can quickly simulate impact on',
    '用于 Alert Handling 前判断业务 Impact': 'to assess business impact before alert handling',
    '业务门户 Application Synthetic Test 总 Time': 'Business portal synthetic test total time',
    'HTTP Error 增多': 'HTTP errors increased',
    'AI 标注为连续劣化': 'AI marked continuous degradation',
    '责任归属运营商骨干': 'ownership is the carrier backbone',
    '连续 3 小时 Packet Loss 超过': 'packet loss exceeded',
    '检查 Cross-Border Egress 或切换线路': 'check cross-border egress or switch links',
    '评分 / 爆炸半径': 'score / blast radius',
    '聚合 / AlertConvert to Incident': 'aggregation / alert-to-incident',
    '邻居震荡': 'neighbor flapping',
    '自动聚合告警': 'automatically aggregate alerts',
    '预计提升降噪率': 'estimated noise reduction improvement',
    'Enable 需 Approval': 'enablement requires approval',
    'AlertAutomatic 聚合为': 'alerts were automatically aggregated into',
    '转入 ITSM Process': 'moved into ITSM handling',
    '手工 Confirm': 'Manual Confirmation',
    '人工 Confirm': 'Manual Confirmation',
    '派单': 'Dispatch',
    '磁盘增长由': 'disk growth accelerated from',
    '加速至': 'to',
    '周内将饱和': 'will saturate within weeks',
    '链路聚合 Expand': 'link aggregation expansion',
    '天\tExpand': 'days\tExpand',
    '天\tArchive Historical Logs': 'days\tArchive Historical Logs'
    ,
    '天内需跟进': 'days Follow-Up Required',
    '到期 · Audit Trace': 'Expiry · Audit Trace',
    '到期 · audit trace': 'Expiry · audit trace',
    '昨日巡检检出': 'Yesterday inspection detected',
    '连续 90 天 NoneActions': 'no actions for 90 consecutive days',
    'Maintenance 30 天内到期': 'Maintenance expiring within 30 days',
    'Contract 30 天内到期': 'contracts expiring within 30 days',
    '跨 9 个 Region': 'Across 9 Regions',
    '后顺路 Process': 'then process on route',
    '距离 与顺路 Task': 'Distance and On-Route Tasks',
    '7 日内 Action Required': 'Action Required within 7 Days',
    '近 24 hours': 'Last 24 Hours',
    '近 30 days': 'Last 30 Days',
    'vs last week 下降 3m': 'Down 3m vs last week',
    'Enable 需 Approval': 'Enablement requires approval',
    '转入 ITSM Process': 'Moved into ITSM handling',
    '从 21 天修正为 14 天': 'changed from 21 days to 14 days',
    'Exhaustion Forecast 从 21 天修正为 14 天': 'exhaustion forecast changed from 21 days to 14 days',
    '汇聚上联 Utilization': 'aggregation uplink utilization',
    'AssessmentLinks聚合 Expand': 'link aggregation expansion',
    '6 天': '6 days',
    '18 天': '18 days'
  });

  Object.assign(EN_TERMS, {
    'IT 服务满意度调查与问卷管理': 'IT Service Satisfaction Survey and Questionnaire Management',
    '问卷模版': 'Questionnaire Templates',
    '问卷实例': 'Questionnaire Instances',
    '模版总数': 'Total Templates',
    '启用模版': 'Enabled Templates',
    '事件满意度模版': 'Incident Satisfaction Templates',
    '平均题目数': 'Average Questions',
    '全部类型': 'All Types',
    '事件满意度': 'Incident Satisfaction',
    '服务请求评价': 'Service Request Evaluation',
    '定期普查': 'Scheduled Survey',
    '创建模版': 'Create Template',
    '模版名称': 'Template Name',
    '题目数': 'Question Count',
    '问卷生成': 'Questionnaire Generation',
    'AI 生成问卷题目': 'Generate Questionnaire Items with AI',
    '结果分析': 'Result Analysis',
    '分析问卷回收数据': 'Analyze Questionnaire Response Data',
    '差评预警': 'Low-Score Alert',
    '识别低分评价并预警': 'Identify Low-Score Feedback and Alert',
    '工程师证书审核与有效期管理': 'Engineer Certificate Review and Validity Management',
    '工程师入驻审核中心 · 按申请类型区分入驻申请与证书补交审核，审核决定一经提交不可修改': 'Engineer onboarding review center · separate onboarding applications from certificate resubmission reviews; submitted review decisions cannot be modified',
    '工程师入驻审核中心 · 核验申请材料并作出审核决定（审核决定一经提交不可修改）': 'Engineer onboarding review center · verify application materials and make a review decision (submitted review decisions cannot be modified)',
    '工程师档案访问申请审批': 'Engineer profile access request approval',
    '工程师档案访问申请审批（审核中心）': 'Engineer profile access request approval (Review Center)',
    '工程师隐私访问授权记录（profile_access_grant）': 'Engineer privacy access grant records (profile_access_grant)',
    '工程师隐私访问授权记录（profile_access_grant）· 由申请审批通过产生、工单终态自动回收': 'Engineer privacy access grant records (profile_access_grant) · generated from approved requests and automatically recovered when the work order reaches a terminal state',
    '证书 ID': 'Certificate ID',
    '证书编号': 'Certificate ID',
    '已到期': 'Expired',
    '已驳回': 'Rejected',
    '证书补交审核': 'Certificate Resubmission Review',
    '申请类型': 'Request Type',
    '审核状态': 'Review Status',
    '申请理由': 'Request Reason',
    '申请时间': 'Request Time',
    '审批人': 'Approver',
    '审批时间': 'Approval Time',
    '授权单号': 'Grant ID',
    '目标工程师': 'Target Engineer',
    '生效时间': 'Effective Time',
    '按授权状态筛选': 'Filter by Authorization Status',
    '档案访问授权列表，可横向滚动': 'Profile Access Authorizations list, horizontally scrollable',
    '搜索证书': 'Search Certificates',
    '搜索授权记录': 'Search Authorization Records',
    '证书ID': 'Certificate ID',
    '审核': 'Review',
    '6.5 题': '6.5 questions',
    '注：证书由审核流程产生，列表不提供「新建」入口；「颁发机构」「颁发日期」为推导字段，待产品确认；证书状态四态（待审核 / 有效 / 已到期 / 已驳回），「即将到期」为有效证书到期前 30 天的预警标签（非状态）。': 'Note: certificates are generated by the review workflow, and the list does not provide a create entry. "Issuing Authority" and "Issue Date" are derived fields pending product confirmation. Certificate status has four states: Pending Review / Valid / Expired / Rejected. "Expiring Soon" is a warning label for valid certificates within 30 days of expiry, not a status.'
  });

  var EN_KEYS = Object.keys(EN_TERMS).sort(function (a, b) { return b.length - a.length; });
  var EN_EXACT_ONLY_TERMS = {
    '台': 'devices',
    '单': 'tickets',
    '份': 'contracts',
    '项': 'items',
    '个': 'items',
    '条': 'items',
    '天': 'days',
    '周': 'weeks',
    '小时': 'hours',
    '题': 'questions',
    '单.': 'tickets.',
    '单。': 'tickets.',
    '台,': 'devices,',
    '台，': 'devices,',
    '份,': 'contracts,',
    '份，': 'contracts,',
    '打开即办 · 系统按你的角色和项目关系聚合下一步工作': 'Open actionable work · the system aggregates next-step work by your role and project relationships',
    '原型演示可切换；正式实现按 EMS NEO 权限和项目关系自动决定': 'Switchable in the prototype; production uses EMS NEO permissions and project relationships to decide automatically',
    'PMO · 组合治理': 'PMO · Portfolio Governance',
    'PM · 项目执行': 'PM · Project Execution',
    '审批立项': 'Approve Initiation',
    '确认范围、客户、排期和预算': 'Confirm scope, customer, schedule, and budget',
    '待审批立项': 'Initiation Pending Approval',
    '新增项目 · 待 PMO 立项审批': 'New Project · pending PMO initiation approval',
    '待分配项目': 'Projects Pending Assignment',
    '立项通过 · 待指派 PM 承接': 'Initiation approved · pending PM assignment',
    '待我处理': 'My Work to Process',
    '点开即办 · 完成后自动移出队列': 'Open actionable items · completed items are removed from the queue automatically',
    '待办队列（今日 6 条）': 'Work Queue (Today · 6 items)',
    '我的组合': 'My Portfolio',
    'PMO 全局上下文': 'PMO Global Context',
    '本月新立项': 'New Initiations This Month',
    '待启动排期': 'Schedule pending kickoff',
    '待我验收归档': 'Pending my acceptance archive',
    '你当前查看的是 PMO 组合治理视角.先处理待审批和待分配项目,再关注Master Project Risk 与Acceptance.': 'You are viewing the PMO portfolio governance perspective. Process pending approvals and project assignments first, then review master-project risk and acceptance.',
    '你当前查看的是 PMO 组合治理视角。先处理待审批和待分配项目，再关注总项目风险与验收。': 'You are viewing the PMO portfolio governance perspective. Process pending approvals and project assignments first, then review master-project risk and acceptance.',
    '待我 Process 点开即办 · Completed 后 Automatic 移出队列': 'My work to process · open actionable items; completed items are removed from the queue automatically',
    '立项 Approved · 待Assign PM 承接': 'Initiation approved · pending PM assignment',
    'Pending PMO Confirmation Acceptance结论': 'Acceptance conclusion pending PMO confirmation',
    'Milestone and Risk Warnings 未来 30 days 5 items': 'Milestone and Risk Warnings (next 30 days · 5 items)',
    'My 组合 PMO 全局上下文': 'My Portfolio PMO Global Context',
    'This Month 新立项': 'New Initiations This Month',
    '混合': 'mixed mode',
    'AI 已关联': 'AI linked',
    '定位根因': 'localized the root cause',
    '源告警': 'Source Alert',
    '推荐': 'Recommended',
    '推荐 ': 'Recommended ',
    '（GBA-GZ现场待命、电力系统认证、当前负载': '(on standby onsite at GBA-GZ, certified for power systems, current workload',
    '）。预计 2h 完成 →': '). Estimated completion in 2h ->',
    '(GBA-GZon standby onsite, certified for power systems, current workload 1/5).预计 2 h Completed →': '(on standby onsite at GBA-GZ, certified for power systems, current workload 1/5). Estimated completion in 2h ->',
    'K.H. Wong 当前在 HKT Tower，FSM-2026-138 Meraki AP更换地点 Ocean Park 距离': 'K.H. Wong is currently at HKT Tower. The FSM-2026-138 Meraki AP replacement site at Ocean Park is',
    '12 km，建议当前任务完成后顺路处理 →': '12 km away; recommended handling it on route after the current task is completed ->',
    'K.H. Wong 当前在 HKT Tower,FSM-2026-138 Meraki APreplacement site Ocean Park 距离 12 km,Recommendation待当前任务Completed后顺路处理 →': 'K.H. Wong is currently at HKT Tower. FSM-2026-138 Meraki AP replacement site at Ocean Park is 12 km away; recommended handling it on route after the current task is completed ->',
    '加固': 'Hardening',
    '同步 Health Score 只读 · 来源 集成网关回写留痕': 'Read-only Synchronized Health Score · source: integration gateway writeback audit',
    '同步异常': 'Synchronization Exception',
    '集成网关超时，工单状态连续 2 次回写失败（08-22 20:14 / 08-23 20:14）；闭环计数暂按上一次成功同步快照展示': 'Integration gateway timeout; ticket status writeback failed 2 consecutive times (08-22 20:14 / 08-23 20:14). Closure count is temporarily shown from the latest successful sync snapshot',
    '重试 2/3 · 20:14 自动重试（只读）': 'Retry 2/3 · 20:14 automatic retry (read-only)',
    '下次自动重试 08-25 20:14 · 重试由集成平台自动执行，PMS 侧不提供手动触发': 'Next automatic retry: 08-25 20:14 · retry is executed by the integration platform; PMS does not provide manual trigger',
    '退回状态回传': 'Returned-status writeback',
    '工单已被 ITSM 退回，其下游派生随之终止，链路中断后不再产生新的状态回写': 'The ticket was returned by ITSM; downstream derivation has been terminated, and no further status writeback will be generated after the link interruption',
    '通道无报错 · 待 ITSM 下一次状态变更回传（只读）': 'No channel error · waiting for the next ITSM status-change writeback (read-only)',
    '无需重试；PMS 侧不提供手动触发': 'No retry required; PMS does not provide manual trigger',
    '改期至 09-03 回传': 'Rescheduled to 09-03 for writeback',
    '改期回传后现场作业状态 2 天未更新，超过 24 小时阈值；M4 应用迁移存在延期风险': 'After rescheduling writeback, field work status has not updated for 2 days and exceeds the 24-hour threshold; M4 Application Migration has delay risk',
    '通道无报错 · 待 FSM 下一次状态回传（只读）': 'No channel error · waiting for the next FSM status writeback (read-only)',
    'PMS 只消费回写，不干预下游进度': 'PMS consumes writeback only and does not intervene in downstream progress',
    '采购在途 14 天回传': 'Procurement in progress for 14 days writeback',
    '采购在途已 14 天，ITAM 未回传更新后的预计到货日，超过 24 小时阈值；预计影响 M4 计划完成日': 'Procurement has been in progress for 14 days; ITAM has not written back the updated estimated arrival date and exceeds the 24-hour threshold. Estimated impact: M4 planned completion date',
    '通道无报错 · 待 ITAM 下一次状态回传（只读）': 'No channel error · waiting for the next ITAM status writeback (read-only)',
    'PMS 只消费回写，不干预采购进度': 'PMS consumes writeback only and does not intervene in procurement progress',
    '共 6 列': '6 columns'
  };
  var i18nApplying = false;
  var i18nObserverTimer = null;

  function polishI18nOutput(out) {
    return String(out)
      .replace(/([0-9,]+)\s*台/g, '$1 devices')
      .replace(/([0-9,]+)\s*单/g, '$1 tickets')
      .replace(/([0-9,]+)\s*份/g, '$1 contracts')
      .replace(/([0-9,]+)\s*项/g, '$1 items')
      .replace(/([0-9,]+)\s*个/g, '$1 items')
      .replace(/([0-9,]+)\s*条/g, '$1 items')
      .replace(/([0-9,]+)\s*天/g, '$1 days')
      .replace(/([0-9,]+)\s*周/g, '$1 weeks')
      .replace(/([0-9.]+)\s*题/g, '$1 questions')
      .replace(/近\s*([0-9]+)\s*Days/g, 'last $1 days')
      .replace(/近\s*([0-9]+)\s*天/g, 'last $1 days')
      .replace(/近\s*([0-9]+)\s*小时/g, 'last $1 hours')
      .replace(/([0-9]+)\s*日内/g, 'within $1 days')
      .replace(/([0-9]+)\s*Days\s*内/g, 'within $1 days')
      .replace(/IT ServiceSatisfaction 调查与问卷 Management/g, 'IT Service Satisfaction Survey and Questionnaire Management')
      .replace(/问卷模版/g, 'Questionnaire Templates')
      .replace(/问卷实例/g, 'Questionnaire Instances')
      .replace(/Enable 模版/g, 'Enabled Templates')
      .replace(/EventSatisfaction 模版/g, 'Incident Satisfaction Templates')
      .replace(/AllType/g, 'All Types')
      .replace(/EventSatisfaction/g, 'Incident Satisfaction')
      .replace(/Service Request 评价/g, 'Service Request Evaluation')
      .replace(/定期普查/g, 'Scheduled Survey')
      .replace(/Create 模版/g, 'Create Template')
      .replace(/模版 NAME/g, 'Template Name')
      .replace(/问卷生成/g, 'Questionnaire Generation')
      .replace(/Analysis 问卷回收数据/g, 'Analyze Questionnaire Response Data')
      .replace(/识别 Low 分评价并预警/g, 'Identify Low-Score Feedback and Alert')
      .replace(/Engineer 证书审核与 Validity PeriodManagement/g, 'Engineer Certificate Review and Validity Management')
      .replace(/Validity PeriodManagement/g, 'Validity Management')
      .replace(/EngineerProfile/g, 'Engineer Profile')
      .replace(/RequestsApproval/g, 'Request Approval')
      .replace(/StatusFilter/g, 'Status Filter')
      .replace(/Search 证书/g, 'Search Certificates')
      .replace(/证书 ID/g, 'Certificate ID')
      .replace(/已 Reject/g, 'Rejected')
      .replace(/申请 TypeFilter/g, 'Filter by Request Type')
      .replace(/申请 TYPE/g, 'Request Type')
      .replace(/审核 STATUS/g, 'Review Status')
      .replace(/link Description 审核/g, 'Linked Description Review')
      .replace(/APPROVAL 人/g, 'Approver')
      .replace(/APPROVALTIME/g, 'Approval Time')
      .replace(/申请 TIME/g, 'Request Time')
      .replace(/TARGETENGINEER/g, 'Target Engineer')
      .replace(/EFFECTIVETIME/g, 'Effective Time')
      .replace(/Profile Access AuthorizationsList,可横向滚动/g, 'Profile Access Authorizations list, horizontally scrollable')
      .replace(/Search 授权记录/g, 'Search Authorization Records')
      .replace(/按授权 StatusFilter/g, 'Filter by Authorization Status')
      .replace(/PROCESS 组/g, 'Assignment Group')
      .replace(/EVENTCATEGORY/g, 'Incident Category')
      .replace(/CUSTOMER\/地点/g, 'Customer / Location')
      .replace(/REMINDSTATUS/g, 'Reminder Status')
      .replace(/YESNO OVERDUE/g, 'Overdue')
      .replace(/ESTIMATED 空闲/g, 'Estimated Available')
      .replace(/RISKTIP/g, 'Risk Tip')
      .replace(/Disable Change Type Statistics/g, 'Closed Change Type Statistics')
      .replace(/automatically created\( L3 \+ L2 混合/g, 'automatically created (L3 + L2 mixed mode')
      .replace(/automatically created\( L3 \+ L2 mixed mode/g, 'automatically created (L3 + L2 mixed mode')
      .replace(/AI 已关联/g, 'AI linked')
      .replace(/推荐\s+P\.Y\. Lau \(GBA-GZon standby onsite, certified for power systems, current workload 1\/5\)\.预计 2 h Completed/g, 'recommended P.Y. Lau (on standby onsite at GBA-GZ, certified for power systems, current workload 1/5). Estimated completion in 2h')
      .replace(/推荐\s+P\.Y\. Lau \(GBA-GZon standby onsite, certified for power systems, current workload 1\/5\)\.预计 2 h Completed/g, 'recommended P.Y. Lau (on standby onsite at GBA-GZ, certified for power systems, current workload 1/5). Estimated completion in 2h')
      .replace(/K\.H\. Wong 当前在 HKT Tower,FSM-2026-138 Meraki APreplacement site Ocean Park 距离 12 km,Recommendation待当前任务Completed后顺路处理/g, 'K.H. Wong is currently at HKT Tower. FSM-2026-138 Meraki AP replacement site at Ocean Park is 12 km away; recommended handling it on route after the current task is completed')
      .replace(/Execution in Progress ([0-9]+) ([0-9]+) users Field/g, 'Execution in Progress $1 · $2 field engineers')
      .replace(/FieldEngineer\s*([0-9]+)\s*人/g, 'Field Engineers $1')
      .replace(/SeniorSecurity/g, 'Senior Security')
      .replace(/Tsuen Wan DC Security加固/g, 'Tsuen Wan DC Security Hardening')
      .replace(/M5 Initial Acceptance · Pending PMO Confirmation Acceptance结论/g, 'M5 Initial Acceptance · acceptance conclusion pending PMO confirmation')
      .replace(/Pending Approve Initiation/g, 'Initiation Pending Approval')
      .replace(/Milestone and Risk Warnings 未来 ([0-9]+) days ([0-9]+) items/g, 'Milestone and Risk Warnings (next $1 days · $2 items)')
      .replace(/This Month 新立项/g, 'New Initiations This Month')
      .replace(/均在 In Progress/g, 'all in progress')
      .replace(/（/g, '(')
      .replace(/）/g, ')')
      .replace(/。/g, '.');
  }

  function i18nText(text) {
    if (!text) return text;
    var leading = (text.match(/^\s*/) || [''])[0];
    var trailing = (text.match(/\s*$/) || [''])[0];
    var body = text.trim();
    if (Object.prototype.hasOwnProperty.call(EN_EXACT_ONLY_TERMS, body)) {
      return leading + EN_EXACT_ONLY_TERMS[body] + trailing;
    }
    if (Object.prototype.hasOwnProperty.call(EN_TERMS, body)) {
      return leading + polishI18nOutput(EN_TERMS[body]) + trailing;
    }
    var normalizedBody = body.replace(/\s+/g, ' ');
    if (normalizedBody !== body && Object.prototype.hasOwnProperty.call(EN_TERMS, normalizedBody)) {
      return leading + polishI18nOutput(EN_TERMS[normalizedBody]) + trailing;
    }
    var out = text;
    EN_KEYS.filter(function (key) {
      return key.length >= 4 || body.length <= 24 || /[A-Za-z0-9/·→:：。]/.test(key);
    }).forEach(function (key) {
      if (out.indexOf(key) === -1) return;
      out = out.split(key).join(EN_TERMS[key]);
    });
    return out
      .replace(/([\u4e00-\u9fff])([A-Za-z])/g, '$1 $2')
      .replace(/([A-Za-z])([\u4e00-\u9fff])/g, '$1 $2')
      .replace(/([0-9%])([A-Za-z])/g, '$1 $2')
      .replace(/([A-Za-z])([0-9])/g, '$1 $2')
      .replace(/:([0-9A-Za-z])/g, ': $1')
      .replace(/GovernanceTierDefinition/g, 'Governance Tier Definition')
      .replace(/GovernanceScope/g, 'Governance Scope')
      .replace(/ServiceReport/g, 'Service Reports')
      .replace(/ServicesManagement/g, 'Service Management')
      .replace(/Field ServiceService/g, 'Field Service')
      .replace(/NPM Network 质量/g, 'NPM Network Quality')
      .replace(/ 次 · Quick Action Hit Rate/g, ' calls · Quick Action Hit Rate')
      .replace(/Data CenterCapacity/g, 'Data Center Capacity')
      .replace(/Packet Loss 率/g, 'Packet Loss')
      .replace(/Usage 率/g, 'usage')
      .replace(/ITOM web-prod\s+集群 CPU 持续攀升 30 分钟，CMDB 显示该集群包含 12 台服务器，ITSM 侧已有 2 张 Related Ticket 处理中。/g, 'ITOM web-prod cluster CPU has been rising for 30 minutes; CMDB shows 12 servers in the cluster, and ITSM already has 2 related tickets in progress.')
      .replace(/CMDB 检测到 312 台服务器缺少关系定义，Recommendation执行「Auto Discovery」任务补全拓扑数据，当前数据 Quality Score\s+92.4 。/g, 'CMDB detected 312 servers with missing relationship definitions. Run Auto Discovery to complete topology data; current data quality score is 92.4.')
      .replace(/web-prod\s+集群 CPU 持续攀升 30[\s\S]*?处理中。/g, 'web-prod cluster CPU has been rising for 30 minutes; CMDB shows 12 servers in the cluster, and ITSM already has 2 related tickets in progress.')
      .replace(/CMDB\s*检测到 312[\s\S]*?92.4 。/g, 'CMDB detected 312 servers with missing relationship definitions. Run Auto Discovery to complete topology data; current data quality score is 92.4.')
      .replace(/([0-9,]+) Times\b/g, '$1 calls')
      .replace(/([0-9]+) 秒前/g, '$1 sec ago')
      .replace(/DraftingApprove/g, 'Drafting Approval')
      .replace(/Field DispatchRecommendationPending/g, 'Field Dispatch Recommendation Pending')
      .replace(/ServiceHealth/g, 'Service Health')
      .replace(/One-TimeResolve/g, 'First-Time Resolution')
      .replace(/First-Time Resolution 率/g, 'First-Time Resolution Rate')
      .replace(/First-Time Resolution Rate 率/g, 'First-Time Resolution Rate')
      .replace(/CostThreshold/g, 'Cost Threshold')
      .replace(/CostBilling/g, 'Cost Billing')
      .replace(/ReportTemplates/g, 'Report Templates')
      .replace(/ReportDirectory/g, 'Report Directory')
      .replace(/SubmitApproval/g, 'Submit Approval')
      .replace(/CreateReportRule/g, 'Create Report Rule')
      .replace(/AI Drafting中/g, 'AI Drafting')
      .replace(/AI DraftingMedium/g, 'AI Drafting')
      .replace(/AI DraftingDelivery\/Month 报/g, 'AI Drafting for Delivery / Monthly Reports')
      .replace(/Cross-TenantSummary/g, 'Cross-Tenant Summary')
      .replace(/CustomerDelivery/g, 'Customer Delivery')
      .replace(/SLAFulfillment/g, 'SLA Fulfillment')
      .replace(/ComplianceAudit/g, 'Compliance Audit')
      .replace(/Multi-TenantOperations/g, 'Multi-Tenant Operations')
      .replace(/Month 报/g, 'Monthly Report')
      .replace(/合同 Period/g, 'Contract Period')
      .replace(/下 Times:/g, 'Next Run:')
      .replace(/内置 v ([0-9.]+) · Monthly Report/g, 'Built-In v$1 · Monthly Report')
      .replace(/内置 v ([0-9.]+) · Contract Period/g, 'Built-In v$1 · Contract Period')
      .replace(/Built-In v ([0-9.]+)/g, 'Built-In v$1')
      .replace(/Monthly Report\+On Demand/g, 'Monthly Report + On Demand')
      .replace(/内置/g, 'Built-In')
      .replace(/按需/g, 'On Demand')
      .replace(/定时/g, 'Scheduled')
      .replace(/8 Month/g, 'August')
      .replace(/待 PM Approval/g, 'Pending PM Approval')
      .replace(/A 3 Agent/g, '3 Agents')
      .replace(/Delivery Report/g, 'Delivery Report')
      .replace(/NormalRunning/g, 'Normal Running')
      .replace(/Department:Marketing Department/g, 'Department: Marketing Department')
      .replace(/Recommendation: Auto-Approve\(Rule/g, 'Recommendation: Auto-Approve (Rule')
      .replace(/AI 风险:中等/g, 'AI Risk: Medium')
      .replace(/预估 ([0-9]+)/g, 'Estimated $1')
      .replace(/规则 ([A-Z0-9-]+)/g, 'Rule $1')
      .replace(/（规则 ([A-Z0-9-]+)）/g, '(Rule $1)')
      .replace(/（Rule ([A-Z0-9-]+)）/g, '(Rule $1)')
      .replace(/全部 ([0-9]+)/g, 'All $1')
      .replace(/紧急 ([0-9]+)/g, 'Urgent $1')
      .replace(/今日 ([0-9]+)/g, 'Today $1')
      .replace(/前 ([0-9]+) \/ 共 ([0-9]+)/g, 'Top $1 / Total $2')
      .replace(/= 已启用 · — = 不适用 · 需配置/g, '= Enabled · — = Not Applicable · Configuration Required')
      .replace(/禁止 =/g, 'Forbidden =')
      .replace(/低风险/g, 'Low Risk')
      .replace(/中等/g, 'Medium')
      .replace(/评估/g, 'Assessment')
      .replace(/稳定/g, 'Stable')
      .replace(/不采纳/g, 'Rejected')
      .replace(/原因/g, 'Reason')
      .replace(/触发/g, 'Triggered')
      .replace(/完成/g, 'Completed')
      .replace(/建议/g, 'Recommendation')
      .replace(/M4 变更/g, 'M4 Change')
      .replace(/23 个/g, '23 CIs')
      .replace(/3 F 网络不通 AP-307 离线/g, '3F network outage · AP-307 offline')
      .replace(/3F 网络不通 AP-307 离线/g, '3F network outage · AP-307 offline')
      .replace(/Reason"非内存泄漏，是磁盘 I\/O"/g, 'Reason: "not a memory leak, disk I/O"')
      .replace(/Reason"非工时不派工"/g, 'Reason: "not billable work, no dispatch"')
      .replace(/王总查询"([^"]+)"/g, 'Executive Wang queried "$1"')
      .replace(/AI-generated handover summary（3 unresolved alerts remaining）/g, 'AI-generated handover summary (3 unresolved alerts remaining)')
      .replace(/市场部/g, 'Marketing Department')
      .replace(/Department:Marketing Department/g, 'Department: Marketing Department')
      .replace(/网络组组长/g, 'Network Team Lead')
      .replace(/M4\s+变更/g, 'M4 Change')
      .replace(/3\s?F\s+网络不通\s+AP-307\s+离线/g, '3F network outage · AP-307 offline')
      .replace(/AI Drafting 工单/g, 'AI-Drafted Ticket')
      .replace(/AI Governance 面板/g, 'AI Governance Panel')
      .replace(/当前 ([0-9]+) 条/g, 'Current $1 items')
      .replace(/([0-9]+) 分钟前/g, '$1 min ago')
      .replace(/([0-9]+) 小时前/g, '$1 h ago')
      .replace(/已选 ([0-9]+) 条/g, 'Selected $1 items')
      .replace(/SLA Countdown（resolution target ([^)]+)）/g, 'SLA Countdown (resolution target $1)')
      .replace(/P ([0-9])/g, 'P$1')
      .replace(/Q ([0-9])/g, 'Q$1')
      .replace(/R ([0-9])/g, 'R$1')
      .replace(/M ([0-9])/g, 'M$1')
      .replace(/([TL]) ([0-9])\b/g, '$1$2')
      .replace(/EMS NEO 平台品牌/g, 'EMS NEO Platform Brand')
      .replace(/Page ([0-9]+) Segment/g, 'Segment $1')
      .replace(/Page ([0-9]+) 段/g, 'Segment $1')
      .replace(/T ([0-9]) b/g, 'T$1b')
      .replace(/T([0-9]) b/g, 'T$1b')
      .replace(/A ([0-9])\b/g, 'A$1')
      .replace(/文本理解与 Tags A1/g, 'Text Understanding and Tagging A1')
      .replace(/Knowledge 检索与推荐 A2/g, 'Knowledge Retrieval and Recommendation A2')
      .replace(/摘要与文档生成 A3/g, 'Summary and Document Generation A3')
      .replace(/数据质量巡检 A5/g, 'Data Quality Inspection A5')
      .replace(/Medium 国 Store Network 改造/g, 'China Store Network Renovation')
      .replace(/全门店割接/g, 'All-Store Cutover')
      .replace(/迁移方案 Confirm/g, 'Migration Plan Confirmation')
      .replace(/已延期/g, 'Delayed')
      .replace(/([0-9,]+)\s*台/g, '$1 devices')
      .replace(/([0-9,]+)\s*单/g, '$1 tickets')
      .replace(/([0-9,]+)\s*份/g, '$1 contracts')
      .replace(/([0-9,]+)\s*项/g, '$1 items')
      .replace(/([0-9,]+)\s*个/g, '$1 items')
      .replace(/([0-9,]+)\s*人/g, '$1 users')
      .replace(/([0-9,]+)\s*条/g, '$1 items')
      .replace(/([0-9.]+)\s*题/g, '$1 questions')
      .replace(/([0-9,]+)\s*天/g, '$1 days')
      .replace(/([0-9,]+)\s*周/g, '$1 weeks')
      .replace(/([0-9,]+)\s*小时/g, '$1 hours')
      .replace(/([0-9,]+)\s*分钟/g, '$1 min')
      .replace(/GB\/天/g, 'GB/day')
      .replace(/，/g, ',')
      .replace(/、/g, ', ')
      .replace(/近\s*([0-9]+)\s*days/g, 'Last $1 Days')
      .replace(/近\s*([0-9]+)\s*小时/g, 'Last $1 Hours')
      .replace(/([0-9]+)\s*日内 Action Required/g, 'Action Required within $1 Days')
      .replace(/Today ([0-9]+) items已采纳/g, '$1 recommendations adopted today')
      .replace(/每日 Automatic 巡检/g, 'Daily Automated Inspection')
      .replace(/到期 · Audit Trace/g, 'expiry · audit trace')
      .replace(/专项 Stocktaking 计划/g, 'Dedicated Stocktaking Plan')
      .replace(/跨 ([0-9]+) items Region/g, 'Across $1 Regions')
      .replace(/跨 ([0-9]+) itemsRegion/g, 'Across $1 Regions')
      .replace(/负载 ([0-9]+\/[0-9]+)/g, 'Workload $1')
      .replace(/技能 \/ Location \/ 负载/g, 'Skills / Location / Workload')
      .replace(/距离 与顺路 Task/g, 'Distance and On-Route Tasks')
      .replace(/Engineer 负载与效率/g, 'Engineer Workload and Efficiency')
      .replace(/FSM-2026-139 UPS battery replacement recommends P\.Y\. Lau: GBA-GZ on standby onsite, certified for power systems, current workload 1\/5,预计 2 h Completed\./g, 'FSM-2026-139 UPS battery replacement recommends P.Y. Lau: on standby onsite at GBA-GZ, certified for power systems, current workload 1/5, estimated completion in 2h.')
      .replace(/K\.H\. Wong 当前在 HKT Tower,Meraki AP replacement site Ocean Park 距离 12 km,Recommendation当前任务Completed后顺路处理\./g, 'K.H. Wong is currently at HKT Tower. The Meraki AP replacement site at Ocean Park is 12 km away; recommended handling it on route after the current task is completed.')
      .replace(/current active engineers 4\/6,T\.K\. Yip 与 P\.Y\. Lau 待命中；本周任务Completed率 94%,vs last week提升 8%\./g, 'Current active engineers 4/6; T.K. Yip and P.Y. Lau are on standby. This week task completion rate is 94%, up 8% vs last week.')
      .replace(/先看 Pending Dispatch, Engineer 负载和 SLA Risk/g, 'Start with pending dispatch, engineer workload, and SLA risk')
      .replace(/Acceptance, Schedule 和 Engineer 深度 ManagementOpenField Service Management/g, 'Open Field Service Management for deeper acceptance, scheduling, and engineer management')
      .replace(/总项目治理 \/ 子项目编排 \/ 工时与Acceptance校验 · Audit Trace/g, 'Master-project governance / subproject orchestration / timesheet and acceptance validation · audit trace')
      .replace(/工时与Acceptance校验/g, 'Timesheet and Acceptance Validation')
      .replace(/Acceptance门控/g, 'Acceptance Gate')
      .replace(/View Acceptance校验/g, 'View Acceptance Validation')
      .replace(/Subproject 和Acceptance/g, 'Subproject and Acceptance')
      .replace(/Milestone 与 Task/g, 'Milestone and Task')
      .replace(/Deliverables 校验/g, 'Deliverables Validation')
      .replace(/Root Cause Localization \/ Noise Reduction 聚合 \/ AlertConvert to Incident/g, 'Root Cause Localization / Noise Reduction Aggregation / Alert-to-Incident')
      .replace(/Root Cause\/Impact\/派单/g, 'Root Cause / Impact / Dispatch')
      .replace(/Workspace 跟进/g, 'Workspace Follow-Up')
      .replace(/人工 Confirm/g, 'Manual Confirmation')
      .replace(/History 90 日/g, '90-Day History')
      .replace(/4 周 Risk/g, '4-Week Risk')
      .replace(/This Week 变化/g, 'This Week Change')
      .replace(/耗尽 Time 修正/g, 'Exhaustion Time Adjustment')
      .replace(/近\s*([0-9]+)\s*Days/g, 'last $1 days')
      .replace(/近\s*([0-9]+)\s*小时/g, 'last $1 hours')
      .replace(/([0-9]+)\s*日内/g, 'within $1 days')
      .replace(/([0-9]+)\s*Days\s*内/g, 'within $1 days')
      .replace(/总 Event/g, 'Total Incidents')
      .replace(/\bCreate ([0-9]+) \(/g, 'New $1 (')
      .replace(/([0-9]+)\s*标准/g, '$1 Standard')
      .replace(/([0-9]+)\s*Disable Change Type Statistics/g, '$1 Closed Change Type Statistics')
      .replace(/Execution ([0-9]+) Disable Change Type Statistics/g, 'Execution $1 Closed Change Type Statistics')
      .replace(/生成 ITSM 运营日报/g, 'Generate ITSM Operations Daily Report')
      .replace(/生成 ITSMOperations Daily Report/g, 'Generate ITSM Operations Daily Report')
      .replace(/AnalysisService 效率瓶颈/g, 'Analyze Service Efficiency Bottlenecks')
      .replace(/SLAReview/g, 'SLA Review')
      .replace(/ReviewSLA Compliance 情况/g, 'Review SLA Compliance')
      .replace(/生成团队对比 Analysis/g, 'Generate Team Comparison Analysis')
      .replace(/生成 Team ComparisonAnalysis/g, 'Generate Team Comparison Analysis')
      .replace(/较昨日/g, 'vs yesterday')
      .replace(/较上周/g, 'vs last week')
      .replace(/较上周下降/g, 'down vs last week')
      .replace(/环比/g, 'period over period')
      .replace(/低\s*于/g, 'lower than')
      .replace(/均\s*Value/g, 'average')
      .replace(/均属/g, 'all belong to')
      .replace(/集\s*Medium\s*在/g, 'concentrated in')
      .replace(/属预期/g, 'as expected')
      .replace(/计费率/g, 'billing rate')
      .replace(/最\s*High/g, 'highest')
      .replace(/闲置/g, 'Idle')
      .replace(/差异/g, 'Variance')
      .replace(/超时/g, 'Overdue')
      .replace(/验收/g, 'Acceptance')
      .replace(/连续两周上升/g, 'has increased for two consecutive weeks')
      .replace(/未\s*Linked Entity/g, 'unlinked')
      .replace(/数据质量/g, 'Data Quality')
      .replace(/高频值守/g, 'frequent monitoring operations')
      .replace(/深度配置/g, 'advanced configuration')
      .replace(/专业管理页面/g, 'specialized management page')
      .replace(/第一次进入统一纳管时，先确定 Organization Perspective，再按角色选择一条最小闭环路线\.UMP 负责资产、服务、现场和项目交付的日常运营入口\./g, 'When first entering unified operations, confirm the organization perspective, then choose the minimum closure route by role. UMP is the daily operations entry for assets, services, field work, and project delivery.')
      .replace(/MSP 看多个客户租户，ENT 在 Current Enterprise Tenant 内按项目和客户定位风险\./g, 'MSP reviews multiple customer tenants; ENT locates risk by project and customer within the current enterprise tenant.')
      .replace(/管理看总览，执行看工作台，专业角色进入对应场景页\./g, 'Managers use Overview; operators use Workspace; specialist roles enter the corresponding scenario pages.')
      .replace(/从风险项进入资产、服务、现场或项目页面，并Completed一次处理\./g, 'Open an asset, service, field, or project page from a risk item and complete one handling workflow.')
      .replace(/Completed处理后回到总览、报告或治理页面，形成可追踪的运营闭环\./g, 'After handling is completed, return to Overview, Reports, or Governance to create a traceable operations closure.')
      .replace(/适合服务经理、运营经理、交付负责人\.目标是找出哪个租户最 Require Attention\./g, 'For service managers, operations managers, and delivery owners. The goal is to identify which tenant needs the most attention.')
      .replace(/适合 IT 主管、区域运维主管\.目标是按项目和客户定位 Operational Risks\./g, 'For IT directors and regional operations leads. The goal is to locate operational risk by project and customer.')
      .replace(/适合 Asset Management 员\.目标是处理 Maintenance Expiring、Inventory Risk、Stocktaking Variance 和 Asset Requests\./g, 'For asset managers. The goal is to handle maintenance expiry, inventory risk, stocktaking variance, and asset requests.')
      .replace(/适合服务台、值班经理\.目标是把请求、事件、变更和 SLA Risk 推进闭环\./g, 'For service desk and duty managers. The goal is to close service requests, incidents, changes, and SLA risks.')
      .replace(/适合调度员、现场工程师、远程 L2\.目标是Completed派工、到场、完工和验收\./g, 'For dispatchers, field engineers, and remote L2. The goal is to complete dispatch, arrival, completion, and acceptance.')
      .replace(/适合 PMO、PM、BM、变更经理\.目标是掌握总项目、子项目和 Acceptance Risk\./g, 'For PMO, PM, BM, and change managers. The goal is to understand master-project, subproject, and acceptance risk.')
      .replace(/MSP 先看租户健康，ENT 先看 Current Enterprise Tenant 内的项目和客户影响\./g, 'MSP starts with tenant health; ENT starts with project and customer impact within the current enterprise tenant.')
      .replace(/从 Object、链路、Configuration、Alert 和 CapacityMedium 选最 HighPriority\./g, 'Select the highest-priority item from object, link, configuration, alert, and capacity categories.')
      .replace(/AlertClaim、Convert to Incident、补关系、TriggeredAutomation 或 Capacity ExpansionAction\./g, 'Claim alerts, convert to incidents, complete relationships, trigger automation, or start capacity expansion actions.')
      .replace(/回到总览、仪表盘或 Report Center，形成 MTTR、可用性和自动化收益报告\./g, 'Return to Overview, Dashboard, or Report Center to produce MTTR, availability, and automation benefit reports.')
      .replace(/适合 MSP NOC 经理、运营管理者\.目标是找出哪个租户影响最大\./g, 'For MSP NOC managers and operations managers. The goal is to identify which tenant has the largest impact.')
      .replace(/适合 NOC 值班和一线服务响应\.目标是按项目和客户处理告警影响\./g, 'For NOC duty and frontline service response. The goal is to handle alert impact by project and customer.')
      .replace(/适合网络工程师、TAC、L2\/L3\.目标是定位拨测失败和链路影响\./g, 'For network engineers, TAC, and L2/L3. The goal is to locate synthetic test failures and link impact.')
      .replace(/适合 Configuration Management 员、变更经理、专业工程师\.目标是判断 CI 和服务影响面\./g, 'For configuration managers, change managers, and specialist engineers. The goal is to assess CI and service impact scope.')
      .replace(/适合一线、L2\/L3、值班经理\.目标是确认、降噪、转事件和保留记录\./g, 'For frontline staff, L2/L3, and duty managers. The goal is confirmation, noise reduction, incident conversion, and record retention.')
      .replace(/适合运维经理、平台管理员\.目标是处理自动化失败和容量扩容风险\./g, 'For operations managers and platform administrators. The goal is to handle automation failures and capacity expansion risk.')
      .replace(/进入 UMP Overview，确认当前是 MSP 还是 ENT 视角\./g, 'Open UMP Overview and confirm whether the current perspective is MSP or ENT.')
      .replace(/选择一个 At-Risk Tenants，或在 ENT 下选择一个项目和客户\./g, 'Select one at-risk tenant, or select one project and customer under ENT.')
      .replace(/从页面动作 Open My Work、Report Center 或对应的专业处理页面\./g, 'Use page actions to open My Work, Report Center, or the corresponding specialist handling page.')
      .replace(/Management 者先看 Overview 和 Dashboard；执行 Role 先看 My Work\./g, 'Managers start with Overview and Dashboard; operator roles start with My Work.')
      .replace(/MSP 的统计按租户汇总；ENT 的统计按项目和客户拆开\./g, 'MSP metrics aggregate by tenant; ENT metrics split by project and customer.')
      .replace(/Frequent Actions 放在 UMP，深度配置进入对应的专业管理页面\./g, 'Frequent actions stay in UMP; advanced configuration opens the corresponding specialist management page.')
      .replace(/Management 者/g, 'Managers')
      .replace(/Service 台 \/ Value 班/g, 'Service Desk / Duty')
      .replace(/Asset Management 员/g, 'Asset Manager')
      .replace(/Configuration Management 员/g, 'Configuration Manager')
      .replace(/运维 Management 者/g, 'Operations Manager')
      .replace(/看 UMP Overview、Dashboard 和 Report\./g, 'Review UMP Overview, Dashboard, and Reports.')
      .replace(/从 Service OperationsOpen 待办和 SLA Risk\./g, 'Open pending work and SLA risks from Service Operations.')
      .replace(/ProcessAssets、Contract、Inventory 和 Stocktaking\./g, 'Process assets, contracts, inventory, and stocktaking.')
      .replace(/View ProjectLevel、Task 和 Acceptance Risk\./g, 'Review project-level, task, and acceptance risk.')
      .replace(/运营 Management/g, 'Operations Management')
      .replace(/Project 和 Customer/g, 'Project and Customer')
      .replace(/进入告警、网络、配置或容量页面，定位一个异常来源\./g, 'Open Alert, Network, Configuration, or Capacity pages to locate one anomaly source.')
      .replace(/CompletedClaim、Convert to Incident、补关系、TriggeredAutomation 或生成 Report\./g, 'Complete claim, convert to incident, complete relationships, trigger automation, or generate a report.')
      .replace(/Monitoring Duty 先看 Alert；专家先看 Network、Object 和 Configuration 上下文\./g, 'Monitoring duty starts with alerts; specialists start with network, object, and configuration context.')
      .replace(/MSP 的异常按租户汇总；ENT 的异常按项目和客户拆开\./g, 'MSP anomalies aggregate by tenant; ENT anomalies split by project and customer.')
      .replace(/高频值守放在 MOP，深度配置进入对应的专业管理页面\./g, 'Frequent monitoring operations stay in MOP; advanced configuration opens the corresponding specialist management page.')
      .replace(/NOC \/ Service 台/g, 'NOC / Service Desk')
      .replace(/从 Alert CenterOpenClaim、转单和 Escalation\./g, 'Open claim, ticket conversion, and escalation from Alert Center.')
      .replace(/L2 \/ L3 专家/g, 'L2 / L3 Specialists')
      .replace(/从 Network、Configuration 和 Object 上下文 Investigate\./g, 'Investigate from network, configuration, and object context.')
      .replace(/维护 CI、关系、Impact Scope 和数据质量\./g, 'Maintain CIs, relationships, impact scope, and data quality.')
      .replace(/看 Overview、AutomationBenefits 和 Capacity Risk\./g, 'Review Overview, automation benefits, and capacity risk.')
      .replace(/台账/g, 'Ledger')
      .replace(/拨测/g, 'Synthetic Tests')
      .replace(/链路/g, 'Links')
      .replace(/拓扑/g, 'Topology')
      .replace(/脏数据巡检/g, 'Dirty Data Inspection')
      .replace(/昨日巡检检出 ([0-9]+) itemsAbnormal:重复台账 ([0-9]+)、Status 矛盾 ([0-9]+)、关键信息缺失 ([0-9]+)./g, 'Yesterday inspection detected $1 abnormal items: $2 duplicate ledgers, $3 status conflicts, and $4 records with missing key information.')
      .replace(/批量修复/g, 'Batch Fix')
      .replace(/View 巡检/g, 'View Inspection')
      .replace(/闲置 AssetsAnalysis/g, 'Idle Asset Analysis')
      .replace(/Idle AssetsAnalysis/g, 'Idle Asset Analysis')
      .replace(/AllRegion/g, 'All Regions')
      .replace(/StocktakingRecommendation/g, 'Stocktaking Recommendation')
      .replace(/Recommendation open/g, 'Recommended opening')
      .replace(/devices中/g, 'devices, including ')
      .replace(/days无操作/g, 'days with no activity')
      .replace(/闲置 ([0-9]+) devices Medium ([0-9]+) devices连续 90 DaysNoneActions，Recommendation 回收，预计年节省 ¥([0-9,]+)./g, '$1 idle assets, including $2 assets with no actions for 90 consecutive days. Recommended reclaim; estimated annual savings ¥$3.')
      .replace(/Maintenance 30 Days 内到期 ([0-9]+) devices，Contract 30 Days 内到期 ([0-9]+) contracts，RecommendationOpen Contract Management 和台账 Filter\./g, '$1 devices have maintenance expiring within 30 days and $2 contracts expire within 30 days. Recommended opening Contract Management and ledger filters.')
      .replace(/ViewContract 预警/g, 'View Contract Warning')
      .replace(/重复 \/ 缺失 \/ 矛盾/g, 'Duplicate / Missing / Conflicting')
      .replace(/沉睡 Assets 回收/g, 'Dormant Asset Reclaim')
      .replace(/Maintenance 和 Contract/g, 'Maintenance and Contract')
      .replace(/专 itemsStocktaking 计划/g, 'Dedicated Stocktaking Plan')
      .replace(/先确认是跨租户资产风险，还是 Current Tenant 内项目 \/ 客户资产风险\./g, 'First confirm whether it is cross-tenant asset risk or project/customer asset risk within the current tenant.')
      .replace(/优先处理 Maintenance Expiring、库存低水位、Stocktaking Variance 和 Asset Requests\./g, 'Prioritize maintenance expiry, low inventory level, stocktaking variance, and asset requests.')
      .replace(/复杂 AssetsLifecycleOpenAdvanced Asset Management\./g, 'Open Advanced Asset Management for complex asset lifecycle work.')
      .replace(/AssetsProactive Management/g, 'Proactive Asset Management')
      .replace(/ServiceProcess Closure/g, 'Service Process Closure')
      .replace(/FieldFulfillment/g, 'Field Fulfillment')
      .replace(/ProjectDeliveryCollaboration/g, 'Project Delivery Collaboration')
      .replace(/ProjectOverview/g, 'Project Overview')
      .replace(/单 Tenants/g, 'Single Tenant')
      .replace(/选择一个 At-Risk Tenants,或在 ENT 下选择一个项目和客户\./g, 'Select one at-risk tenant, or select one project and customer under ENT.')
      .replace(/MSP 的统计按租户汇总；ENT 的统计按项目和客户拆开\./g, 'MSP metrics aggregate by tenant; ENT metrics split by project and customer.')
      .replace(/Frequent Actions 放在 UMP,advanced configuration进入对应的specialized management page\./g, 'Frequent actions stay in UMP; advanced configuration opens the corresponding specialist management page.')
      .replace(/看 UMP Overview, Dashboard 和 Report\./g, 'Review UMP Overview, Dashboard, and Reports.')
      .replace(/从 Service OperationsOpen 待办和 SLA Risk\./g, 'Open pending work and SLA risks from Service Operations.')
      .replace(/ProcessAssets, Contract, Inventory 和 Stocktaking\./g, 'Process assets, contracts, inventory, and stocktaking.')
      .replace(/View ProjectLevel, Task 和 Acceptance Risk\./g, 'Review project-level, task, and acceptance risk.')
      .replace(/（/g, '(')
      .replace(/）/g, ')')
      .replace(/current data quality score\s+([0-9.]+)\s*。/g, 'current data quality score is $1.')
      .replace(/。/g, '.')
      .replace(/current active engineers 4\/6,T\.K\. Yip 与 P\.Y\. Lau 待命中[；;]本周任务Completed率 94%,vs last week提升 8%\./g, 'Current active engineers 4/6; T.K. Yip and P.Y. Lau are on standby. This week task completion rate is 94%, up 8% vs last week.')
      .replace(/负载\s+4\s*\/\s*6/g, 'Workload 4/6')
      .replace(/distance 与顺路 Task/g, 'Distance and On-Route Tasks')
      .replace(/DispatcherProcessDispatch,FieldEngineer 从 WorkspaceAccept 和 Writeback\./g, 'Dispatchers process dispatch; field engineers accept and write back from Workspace.')
      .replace(/Acceptance, Schedule 和 Engineer 深度 ManagementOpenField Service Management\./g, 'Open Field Service Management for deeper acceptance, scheduling, and engineer management.')
      .replace(/工时与Acceptance校验/g, 'Timesheet and Acceptance Validation')
      .replace(/Acceptance门控/g, 'Acceptance Gate')
      .replace(/View Acceptance校验/g, 'View Acceptance Validation')
      .replace(/总 Project Risk/g, 'Master Project Risk')
      .replace(/Subproject 和Acceptance/g, 'Subproject and Acceptance')
      .replace(/工时 Abnormal/g, 'Timesheet Anomaly')
      .replace(/重复与unlinked/g, 'Repeated and Unlinked')
      .replace(/先区分 Master Project, Subproject 和 Standalone Project\./g, 'First distinguish master projects, subprojects, and standalone projects.')
      .replace(/PMO 看组合风险,PM 看里程碑, 任务, 交付物和Acceptance\./g, 'PMO reviews portfolio risk; PM reviews milestones, tasks, deliverables, and acceptance.')
      .replace(/复杂 Project 计划 OpenAdvanced Project Management\./g, 'Open Advanced Project Management for complex project planning.')
      .replace(/ViewDiscovery Jobs/g, 'View Discovery Jobs')
      .replace(/OpenImpact Scope/g, 'Open Impact Scope')
      .replace(/HealthStatus/g, 'Health Status')
      .replace(/PendingObject/g, 'Pending Objects')
      .replace(/Incident Tickets 全 LifecycleManagement/g, 'Incident Ticket Full Lifecycle Management')
      .replace(/总 Tickets/g, 'Total Tickets')
      .replace(/跨 ProductsCollaboration/g, 'Cross-Product Collaboration')
      .replace(/AutomaticCreate/g, 'automatically created')
      .replace(/L3 \+ L2 混合/g, 'L3 + L2 mixed mode')
      .replace(/([0-9]+) items Linked Entity/g, '$1 linked items')
      .replace(/([0-9]+) items已 AutomaticDispatch 至/g, '$1 items automatically dispatched to')
      .replace(/AI Intelligent Ticketing 助手/g, 'AI Intelligent Ticketing Assistant')
      .replace(/已为 ([0-9]+) items Tickets 提供 AI 辅助/g, 'AI assistance has been provided for $1 tickets')
      .replace(/定位根因: App-Server-03 内存泄漏导致请求回压至 Web-Server-01\.Recommendation优先重启 App-Server-03 应用进程/g, 'Root cause localized: memory leak on App-Server-03 caused request backpressure to Web-Server-01. Recommended restarting the App-Server-03 application process first')
      .replace(/Recommend Immediate 升级处理/g, 'Recommended immediate escalation')
      .replace(/源 Alert/g, 'Source Alert')
      .replace(/显示 Latency 仍在上升/g, 'shows latency is still increasing')
      .replace(/\[History 参考\]/g, '[History Reference]')
      .replace(/过去 ([0-9]+) days发生过 ([0-9]+) 次同类工单,历史 Solution:清理归档日志 \+ 扩容数据卷\.平均处理时间 ([0-9]+) min/g, '$2 similar tickets occurred in the last $1 days. Historical solution: clean archived logs + expand the data volume. Average handling time $3 min')
      .replace(/View AI AnalysisDetails/g, 'View AI Analysis Details')
      .replace(/Priority: All/g, 'Priority: All')
      .replace(/Status: All/g, 'Status: All')
      .replace(/Source: All/g, 'Source: All')
      .replace(/指派: All/g, 'Assignment: All')
      .replace(/ITOMAutomatic/g, 'ITOM Automated')
      .replace(/NOCValue 班/g, 'NOC Duty')
      .replace(/System 运维/g, 'Systems Operations')
      .replace(/Network 运维/g, 'Network Operations')
      .replace(/AI Recommendations: ([A-Z0-9-]+) 可自动关联 ([A-Z0-9-]+) Solution,预计缩短处理时间 ([0-9]+)%/g, 'AI Recommendation: $1 can be automatically linked to solution $2, with estimated handling time reduced by $3%')
      .replace(/ApplicationRecommendation/g, 'Apply Recommendation')
      .replace(/简述/g, 'Summary')
      .replace(/网点信息/g, 'Site Information')
      .replace(/PROCESS 组/g, 'Assignment Group')
      .replace(/EVENTCATEGORY/g, 'Incident Category')
      .replace(/AIAnalysis/g, 'AI Analysis')
      .replace(/Core Switch 端口 AbnormalPacket Loss/g, 'Core Switch Port Packet Loss Anomaly')
      .replace(/Network 故障/g, 'Network Fault')
      .replace(/ERPSystem 登录Overdue/g, 'ERP System Login Timeout')
      .replace(/ApplicationSystem/g, 'Application System')
      .replace(/Database 连接池耗尽/g, 'Database Connection Pool Exhaustion')
      .replace(/邮件 Server 退信/g, 'Email Server Bounce')
      .replace(/邮件 System/g, 'Email System')
      .replace(/VPN 连接频繁断开/g, 'Frequent VPN Disconnections')
      .replace(/打印 Service 故障/g, 'Print Service Fault')
      .replace(/终端 supports/g, 'Endpoint Support')
      .replace(/HardwareDevices/g, 'Hardware Devices')
      .replace(/DNS 解析 Abnormal/g, 'DNS Resolution Anomaly')
      .replace(/Engineer 调度与 Task Management/g, 'Engineer Dispatch and Task Management')
      .replace(/自动派生,AI 根据工程师技能\/位置\/负载自动推荐最优派工方案,设备信息来自/g, 'automatically derived; AI recommends the optimal dispatch plan based on engineer skills, location, and workload. Device information comes from')
      .replace(/OpenDispatch 抽屉/g, 'Open Dispatch Drawer')
      .replace(/推荐\s+P\.Y\. Lau \(GBA-GZon standby onsite, certified for power systems, current workload 1\/5\)\.预计 2 h Completed/g, 'recommended P.Y. Lau (on standby onsite at GBA-GZ, certified for power systems, current workload 1/5). Estimated completion in 2h')
      .replace(/K\.H\. Wong 当前在 HKT Tower,FSM-2026-138 Meraki APreplacement site Ocean Park 距离 12 km,Recommendation待当前任务Completed后顺路处理/g, 'K.H. Wong is currently at HKT Tower. FSM-2026-138 Meraki AP replacement site Ocean Park is 12 km away; recommended handling it on route after the current task is completed')
      .replace(/current active engineers 4\/6,T\.K\. Yip 和 P\.Y\. Lau 待命中\.本周任务Completed率 94%,比上周提升 8%/g, 'Current active engineers 4/6; T.K. Yip and P.Y. Lau are on standby. This week task completion rate is 94%, up 8% vs last week')
      .replace(/TodayTickets/g, 'Tickets Today')
      .replace(/vs Yesterday/g, 'vs Yesterday')
      .replace(/([0-9]+) items None 匹配可用 Engineer/g, '$1 items with no available engineer matched')
      .replace(/在途 Execution/g, 'Execution in Progress')
      .replace(/TodayCompleted/g, 'Completed Today')
      .replace(/Timeout Risk/g, 'Overdue Risk')
      .replace(/已Overdue/g, 'Overdue')
      .replace(/即将Overdue/g, 'Due Soon')
      .replace(/Ticket Type 分布/g, 'Ticket Type Distribution')
      .replace(/Hardware 更换/g, 'Hardware Replacement')
      .replace(/故障维修/g, 'Break-Fix Repair')
      .replace(/安装部署/g, 'Installation and Deployment')
      .replace(/巡检保养/g, 'Inspection and Maintenance')
      .replace(/SLA 时效/g, 'SLA Timeliness')
      .replace(/按 到场 \/ 修复 双时限监控,临近Overdue自动升级提醒/g, 'Monitored by arrival and repair deadlines; automatically escalate when approaching overdue')
      .replace(/平均 Arrival 时长/g, 'Average Arrival Time')
      .replace(/FieldEngineerStatus/g, 'Field Engineer Status')
      .replace(/FieldEngineer\s+([0-9]+)\s+users/g, 'Field Engineers $1')
      .replace(/暂 None 匹配可用 Engineer/g, 'currently have no available engineer matched')
      .replace(/技能 \/ 认证/g, 'Skills / Certifications')
      .replace(/CURRENTTASK \/ LOCATION/g, 'Current Task / Location')
      .replace(/ESTIMATED 空闲/g, 'Estimated Available')
      .replace(/RISKTIP/g, 'Risk Tip')
      .replace(/High 级/g, 'Senior')
      .replace(/Medium 级/g, 'Intermediate')
      .replace(/初级/g, 'Junior')
      .replace(/Network 检修/g, 'Network Maintenance')
      .replace(/维护/g, 'Maintenance')
      .replace(/立即/g, 'Immediate')
      .replace(/可立即调度/g, 'Available for Immediate Dispatch')
      .replace(/可接 UPS 电池更换/g, 'Available for UPS Battery Replacement')
      .replace(/不可调度/g, 'Unavailable for Dispatch')
      .replace(/ActiveTickets/g, 'Active Tickets')
      .replace(/CUSTOMER\/地点/g, 'Customer / Location')
      .replace(/LINKED ENTITYPROJECT/g, 'Linked Project')
      .replace(/REMINDSTATUS/g, 'Reminder Status')
      .replace(/YESNO OVERDUE/g, 'Overdue')
      .replace(/Nexus NX-OSEscalation/g, 'Nexus NX-OS Escalation')
      .replace(/Hardware 检修/g, 'Hardware Maintenance')
      .replace(/Cross-Border 光纤检修/g, 'Cross-Border Fiber Maintenance')
      .replace(/数据 Medium 心/g, 'Data Center')
      .replace(/光纤改造/g, 'Fiber Modernization')
      .replace(/UPS 电池更换/g, 'UPS Battery Replacement')
      .replace(/Meraki AP 批量更换/g, 'Meraki AP Batch Replacement')
      .replace(/Aruba CX 堆叠检查/g, 'Aruba CX Stack Inspection')
      .replace(/None 线覆盖/g, 'Wireless Coverage')
      .replace(/Network 改造/g, 'Network Modernization')
      .replace(/ITAM AssetsManagement/g, 'ITAM Asset Management')
      .replace(/ConsumablesInventory 情况/g, 'Consumables Inventory Status')
      .replace(/Asset Category 分布图/g, 'Asset Category Distribution')
      .replace(/Page 三方 Maintenance Expiring 预警/g, 'Third-Party Maintenance Expiry Warning')
      .replace(/DevicesOriginal 厂保修 Expiry Warning/g, 'Original Manufacturer Warranty Expiry Warning')
      .replace(/Stocktaking VarianceProcess 情况/g, 'Stocktaking Variance Processing Status')
      .replace(/Asset RequestsStatus 分布/g, 'Asset Request Status Distribution')
      .replace(/发货情况/g, 'Delivery Status')
      .replace(/StocktakingTaskStatus Statistics/g, 'Stocktaking Task Status Statistics')
      .replace(/此查询没有数据/g, 'No data for this query')
      .replace(/Fixed AssetsUsageStatus/g, 'Fixed Asset Usage Status')
      .replace(/PMO 项目治理视角 · 按项目层级查看全局状态, 分布与风险\(待办请前往工作台\)/g, 'PMO project governance view · review global status, distribution, and risk by project hierarchy (use Workspace for pending work)')
      .replace(/本页为项目总览\(PMO 视角\)\.日常待办\(审批立项 \/ 分配项目 \/ 风险预警 \/ Acceptance确认\)请到/g, 'This page is Project Overview (PMO view). For daily work items (project approval / project assignment / risk warning / acceptance confirmation), go to')
      .replace(/筹备中/g, 'Preparing')
      .replace(/已Acceptance/g, 'Accepted')
      .replace(/已关闭/g, 'Closed')
      .replace(/In ProgressProject/g, 'Projects in Progress')
      .replace(/Pending AcceptanceProject/g, 'Projects Pending Acceptance')
      .replace(/ClosedProject/g, 'Closed Projects')
      .replace(/Managed ProjectsBudget/g, 'Managed Project Budget')
      .replace(/跨 Status 口径/g, 'Cross-status scope')
      .replace(/Acceptance后 Archive · Field 已锁定/g, 'Archived after acceptance · fields locked')
      .replace(/High RiskMilestone/g, 'High-Risk Milestones')
      .replace(/未来 ([0-9]+) days Milestone/g, 'Milestones in the Next $1 Days')
      .replace(/Tickets 口径 · Source ITSM/g, 'Ticket-based scope · source: ITSM')
      .replace(/合计/g, 'total')
      .replace(/([0-9]+) items In ProgressProjectLinked Entity\s+([0-9,]+) devices/g, '$1 projects in progress linked to $2 devices')
      .replace(/([0-9]+) items Deliverables 待 Archive/g, '$1 deliverables pending archive')
      .replace(/总 Project Progress 与阻塞项/g, 'Master Project Progress and Blockers')
      .replace(/按 Subproject 计划权重 Summary/g, 'summarized by subproject plan weight')
      .replace(/ProjectLevel 视图/g, 'Project Hierarchy View')
      .replace(/加权 Progress/g, 'Weighted Progress')
      .replace(/最差 Status/g, 'Worst Status')
      .replace(/关键阻塞/g, 'Key Blocker')
      .replace(/总 Owner/g, 'Master Owner')
      .replace(/下钻/g, 'Drilldown')
      .replace(/需 Watch/g, 'Needs Watch')
      .replace(/延期/g, 'Delayed')
      .replace(/子项目Acceptance/g, 'Subproject Acceptance')
      .replace(/批 times 等待 Field DispatchWriteback/g, 'batch work orders waiting for field dispatch writeback')
      .replace(/Final Acceptance 待定/g, 'final acceptance pending')
      .replace(/汇总规则:父项目不复制子 Project Tasks, 工单, 工时或交付物；报表按来源记录去重,点击总项目可下钻到具体子项目和责任人\./g, 'Summary rule: parent projects do not copy child project tasks, tickets, timesheets, or deliverables; reports deduplicate by source records. Click a master project to drill down to specific subprojects and owners.')
      .replace(/ProjectLevel 统计/g, 'Project Hierarchy Statistics')
      .replace(/项目实体去重/g, 'deduplicate project entities')
      .replace(/总项目按父项目统计,子项目不重复计入总项目数量/g, 'master projects are counted by parent project, and subprojects are not counted again in master-project totals')
      .replace(/统计维度/g, 'Statistical Dimension')
      .replace(/AllProject/g, 'All Projects')
      .replace(/Project 实体/g, 'Project Entities')
      .replace(/覆盖 ([0-9]+) items Subproject/g, 'covering $1 subprojects')
      .replace(/归属 Master Project/g, 'belong to master projects')
      .replace(/存在 High Risk/g, 'with high risk')
      .replace(/不参与 Master ProjectSummary/g, 'not included in master-project summaries')
      .replace(/RiskProject/g, 'Risk Projects')
      .replace(/Project 数/g, 'Project Count')
      .replace(/平均 Progress/g, 'Average Progress')
      .replace(/统计说明/g, 'Statistical Notes')
      .replace(/按 Project 实体去重/g, 'Deduplicated by project entity')
      .replace(/按 Master ProjectSummarySubproject,不重复 ComputeSubproject 明细/g, 'Summarized by master project; subproject details are not counted twice')
      .replace(/保留所属 Master Project 上下文,可下钻 Execution 责任人/g, 'Keeps master-project context and supports drilldown to execution owners')
      .replace(/按 Since 身 ProjectLifecycle 统计/g, 'counted directly by its own project lifecycle')
      .replace(/统计口径:总项目是治理与汇总维度；子项目是执行维度；Standalone Project 直接纳入全局统计\.总 Project Progress, 风险和Acceptance状态由子项目来源数据汇总生成,不在总项目层面重复录入\./g, 'Statistical scope: master projects are the governance and summary dimension; subprojects are the execution dimension; standalone projects are included directly in global statistics. Master-project progress, risk, and acceptance status are generated from subproject source data and are not re-entered at the master-project level.')
      .replace(/ProjectStatus 分布/g, 'Project Status Distribution')
      .replace(/ProjectType 分布/g, 'Project Type Distribution')
      .replace(/ProjectCustomer 分布/g, 'Project Customer Distribution')
      .replace(/长期 Managed 运维/g, 'Long-Term Managed Operations')
      .replace(/建站 Delivery/g, 'Site Delivery')
      .replace(/Milestone 到期\(未来 ([0-9]+) items Month\)/g, 'Milestones Due (Next $1 Months)')
      .replace(/Milestone 排期/g, 'Milestone Schedule')
      .replace(/颜色表示 Time 紧迫性: 近 Month 紧迫 居 Medium 远 Month 宽松/g, 'Color indicates time urgency: near months are urgent, mid-term months are medium, and later months are relaxed')
      .replace(/重点 Project/g, 'Key Projects')
      .replace(/CurrentMilestone/g, 'Current Milestone')
      .replace(/计划 Date/g, 'Planned Date')
      .replace(/运维体系上线/g, 'Operations System Go-Live')
      .replace(/转运维/g, 'Handover to Operations')
      .replace(/Milestone 与 Risk 预警/g, 'Milestone and Risk Warnings')
      .replace(/High RiskMilestoneRecommendationManagementWatch/g, 'High-risk milestone recommendation: management watch')
      .replace(/同步 Health Score 只读 · 来源 集成网关回写留痕/g, 'Read-only Synchronized Health Score · source: integration gateway writeback audit')
      .replace(/数据截至/g, 'Data as of')
      .replace(/Writeback 流水\(审计\)/g, 'Writeback Journal (Audit)')
      .replace(/同步 Abnormal/g, 'Synchronization Exception')
      .replace(/回写通道报错, 自动重试仍未成功 · 来源/g, 'writeback channel error; automatic retry has not succeeded · source')
      .replace(/超 24 Hours 阈值仍未回写/g, 'not written back after exceeding the 24-hour threshold')
      .replace(/最近 SuccessWriteback/g, 'Latest Successful Writeback')
      .replace(/只读视图筛选:按 Enter 或空格可按该类型筛选下方异常清单,再次按下取消筛选；此操作只切换本页显示,不会Triggered任何重试或下游动作\./g, 'Read-only view filter: press Enter or Space to filter the exception list below by this type; press again to clear. This only changes page display and does not trigger retries or downstream actions.')
      .replace(/Abnormal 清单\(只读 · ObjectID 可下钻源 System\)/g, 'Exception List (Read-only · Object ID can drill down to the source system)')
      .replace(/窄屏时可横向滚动,聚焦后可用方向键滚动/g, 'horizontal scrolling is available on narrow screens; use arrow keys after focus')
      .replace(/同步与回写异常清单,共 ([0-9]+) 行,列为对象编号, 来源系统, 最后成功同步时间, 失败Reason, 重试状态, 关联项目；全部为只读展示,PMS 侧不提供重试或干预下游的操作\./g, 'Synchronization and writeback exception list, $1 rows, with columns for object ID, source system, last successful sync time, failure reason, retry status, and linked project. All rows are read-only; PMS does not provide retry or downstream intervention actions.')
      .replace(/最后 Success 同步 Time/g, 'Last Successful Sync Time')
      .replace(/FailedReason/g, 'Failure Reason')
      .replace(/RetryStatus/g, 'Retry Status')
      .replace(/Linked EntityProject/g, 'Linked Project')
      .replace(/已滞后/g, 'delayed by')
      .replace(/Credentials \/ 连通性/g, 'Credentials / Connectivity')
      .replace(/unlinkedObject/g, 'Unlinked Objects')
      .replace(/Object 到 Service/g, 'Object to Service')
      .replace(/先看 Offline Objects, Discovery Exceptions 和 Unlinked CIs\./g, 'Start with offline objects, discovery exceptions, and unlinked CIs.')
      .replace(/ENT Perspective 按 Project and Customer 判断 ObjectImpact\./g, 'Use ENT perspective to assess object impact by project and customer.')
      .replace(/Object 关系深查 OpenConfiguration Management 或Topology\./g, 'For deeper object relationship investigation, open Configuration Management or Topology.')
      .replace(/选择一个 At-Risk Tenants,或在 ENT 下选择一个项目和客户\./g, 'Select one at-risk tenant, or select one project and customer under ENT.')
      .replace(/MSP 的统计按租户汇总；ENT 的统计按项目和客户拆开\./g, 'MSP metrics aggregate by tenant; ENT metrics split by project and customer.')
      .replace(/Frequent Actions 放在 UMP,advanced configuration进入对应的specialized management page\./g, 'Frequent actions stay in UMP; advanced configuration opens the corresponding specialist management page.')
      .replace(/看 UMP Overview, Dashboard 和 Report\./g, 'Review UMP Overview, Dashboard, and Reports.')
      .replace(/从 Service OperationsOpen 待办和 SLA Risk\./g, 'Open pending work and SLA risks from Service Operations.')
      .replace(/ProcessAssets, Contract, Inventory 和 Stocktaking\./g, 'Process assets, contracts, inventory, and stocktaking.')
      .replace(/View ProjectLevel, Task 和 Acceptance Risk\./g, 'Review project-level, task, and acceptance risk.')
      .replace(/MSP 先看租户健康,ENT 先看 Current Enterprise Tenant 内的项目和客户影响\./g, 'MSP starts with tenant health; ENT starts with project and customer impact within the current enterprise tenant.')
      .replace(/从 Object, Links, Configuration, Alert 和 CapacityMedium 选 highestPriority\./g, 'Select the highest-priority item from objects, links, configuration, alerts, and capacity categories.')
      .replace(/AlertClaim, Convert to Incident, complete relationships, TriggeredAutomation 或 ExpandAction\./g, 'Claim alerts, convert to incidents, complete relationships, trigger automation, or start capacity expansion actions.')
      .replace(/回到总览, 仪表盘或 Report Center,形成 MTTR, 可用性和自动化收益报告\./g, 'Return to Overview, Dashboard, or Report Center to produce MTTR, availability, and automation benefit reports.')
      .replace(/适合 MSP NOC 经理, 运营管理者\.目标是找出哪个租户影响最大\./g, 'For MSP NOC managers and operations managers. The goal is to identify which tenant has the largest impact.')
      .replace(/适合 NOC 值班和一线服务响应\.目标是按项目和客户 Handle Alert 影响\./g, 'For NOC duty and frontline service response. The goal is to handle alert impact by project and customer.')
      .replace(/适合网络工程师, TAC, L2\/L3\.目标是定位Synthetic Tests失败和Links影响\./g, 'For network engineers, TAC, and L2/L3. The goal is to locate synthetic test failures and link impact.')
      .replace(/适合 Configuration Manager, 变更经理, 专业工程师\.目标是判断 CI 和服务影响面\./g, 'For configuration managers, change managers, and specialist engineers. The goal is to assess CI and service impact scope.')
      .replace(/适合一线, L2\/L3, 值班经理\.目标是确认, 降噪, 转事件和保留记录\./g, 'For frontline staff, L2/L3, and duty managers. The goal is confirmation, noise reduction, incident conversion, and record retention.')
      .replace(/适合运维经理, 平台管理员\.目标是处理自动化失败和容量扩容风险\./g, 'For operations managers and platform administrators. The goal is to handle automation failures and capacity expansion risk.')
      .replace(/进入告警, 网络, 配置或容量页面,定位一个异常来源\./g, 'Open Alert, Network, Configuration, or Capacity pages to locate one anomaly source.')
      .replace(/CompletedClaim, Convert to Incident, complete relationships, TriggeredAutomation 或生成 Report\./g, 'Complete claim, convert to incident, complete relationships, trigger automation, or generate a report.')
      .replace(/Monitoring Duty 先看 Alert；专家先看 Network, Object 和 Configuration 上下文\./g, 'Monitoring duty starts with alerts; specialists start with network, object, and configuration context.')
      .replace(/MSP 的异常按租户汇总；ENT 的异常按项目和客户拆开\./g, 'MSP anomalies aggregate by tenant; ENT anomalies split by project and customer.')
      .replace(/frequent monitoring operations放在 MOP,advanced configuration进入对应的specialized management page\./g, 'Frequent monitoring operations stay in MOP; advanced configuration opens the corresponding specialist management page.')
      .replace(/从 Alert CenterOpenClaim, 转单和 Escalation\./g, 'Open claim, ticket conversion, and escalation from Alert Center.')
      .replace(/从 Network, Configuration 和 Object 上下文 Investigate\./g, 'Investigate from network, configuration, and object context.')
      .replace(/维护 CI, 关系, Impact Scope 和Data Quality\./g, 'Maintain CIs, relationships, impact scope, and data quality.')
      .replace(/运维 Managers/g, 'Operations Managers')
      .replace(/看 Overview, AutomationBenefits 和 Capacity Risk\./g, 'Review Overview, automation benefits, and capacity risk.')
      .replace(/Change Status Statistics 5 Open 4 Approval 7 Execution 6 Disable Change Type Statistics/g, 'Change Status Statistics 5 Open 4 Approval 7 Execution 6 Closed Change Type Statistics')
      .replace(/67 items Event 由/g, '67 incidents were')
      .replace(/automatically created\( L3 \+ L2 混合/g, 'automatically created (L3 + L2 mixed mode')
      .replace(/INC-2024-001 Web 服务器 CPU 过载/g, 'INC-2024-001 Web Server CPU Overload')
      .replace(/INC-2024-004 Core Switch 延迟告警 SLA 仅剩/g, 'INC-2024-004 Core Switch latency alert SLA has only')
      .replace(/Recommended immediate escalation或/g, 'Recommended immediate escalation or')
      .replace(/INC-2024-002 数据库磁盘告警/g, 'INC-2024-002 Database Disk Alert')
      .replace(/邮件/g, 'Email')
      .replace(/PROCESS 组/g, 'Assignment Group')
      .replace(/EVENTCATEGORY/g, 'Incident Category')
      .replace(/指派/g, 'Assign')
      .replace(/ApplicationServer 内存 Alert/g, 'Application Server Memory Alert')
      .replace(/Dispatch 优化/g, 'Dispatch Optimization')
      .replace(/AI 推荐最优 Engineer/g, 'AI Recommends the Best-Fit Engineer')
      .replace(/路线规划/g, 'Route Planning')
      .replace(/优化 Field Service 路线/g, 'Optimize Field Service Routes')
      .replace(/效率 Analysis/g, 'Efficiency Analysis')
      .replace(/AnalysisDispatch 效率 Metrics/g, 'Analyze Dispatch Efficiency Metrics')
      .replace(/Tickets 跟踪/g, 'Ticket Tracking')
      .replace(/ViewField Work OrdersProgress/g, 'View Field Work Order Progress')
      .replace(/12 items Task 由/g, '12 tasks were')
      .replace(/推荐\s+P\.Y\. Lau \(GBA-GZon standby onsite, certified for power systems, current workload 1\/5\)\.预计 2 h Completed/g, 'recommended P.Y. Lau (on standby onsite at GBA-GZ, certified for power systems, current workload 1/5). Estimated completion in 2h')
      .replace(/K\.H\. Wong 当前在 HKT Tower,FSM-2026-138 Meraki APreplacement site Ocean Park 距离 12 km,Recommendation待当前任务Completed后顺路处理/g, 'K.H. Wong is currently at HKT Tower. FSM-2026-138 Meraki AP replacement site at Ocean Park is 12 km away; recommended handling it on route after the current task is completed')
      .replace(/Execution in Progress ([0-9]+) ([0-9]+) users Field/g, 'Execution in Progress $1 · $2 field engineers')
      .replace(/平均修复 MTTR/g, 'Average Repair MTTR')
      .replace(/FieldEngineer\s+([0-9]+)\s+人/g, 'Field Engineers $1')
      .replace(/在途 ([0-9]+)/g, 'En Route $1')
      .replace(/待命 ([0-9]+)/g, 'Standby $1')
      .replace(/负载/g, 'Workload')
      .replace(/ESTIMATED 空闲/g, 'Estimated Available')
      .replace(/RISKTIP/g, 'Risk Tip')
      .replace(/在途/g, 'En Route')
      .replace(/待命/g, 'Standby')
      .replace(/接近 SLA 时限/g, 'approaching SLA deadline')
      .replace(/安全/g, 'Security')
      .replace(/电气/g, 'Electrical')
      .replace(/PA-5260Maintenance/g, 'PA-5260 Maintenance')
      .replace(/可Immediate调度/g, 'Available for Immediate Dispatch')
      .replace(/休假 Medium/g, 'On Leave')
      .replace(/Active Tickets 表格,可横向滚动/g, 'Active Tickets table, horizontally scrollable')
      .replace(/CUSTOMER\/地点/g, 'Customer / Location')
      .replace(/REMINDSTATUS/g, 'Reminder Status')
      .replace(/YESNO OVERDUE/g, 'Overdue')
      .replace(/HKT Tower NetworkEscalation/g, 'HKT Tower Network Escalation')
      .replace(/Tsuen Wan DC 安全加固/g, 'Tsuen Wan DC Security Hardening')
      .replace(/Third-Party Maintenance Expiry Warning\(30 days内\)/g, 'Third-Party Maintenance Expiry Warning (within 30 days)')
      .replace(/Original Manufacturer Warranty Expiry Warning\(30 days内\)/g, 'Original Manufacturer Warranty Expiry Warning (within 30 days)')
      .replace(/24口交换器/g, '24-Port Switch')
      .replace(/进行中/g, 'In Progress')
      .replace(/均在 In Progress/g, 'all in progress')
      .replace(/Projects in ProgressLinked Entity/g, 'projects in progress linked to')
      .replace(/Deliverables 待 Archive/g, 'deliverables pending archive')
      .replace(/高风险/g, 'High Risk')
      .replace(/门店batch work orders/g, 'store batch work orders')
      .replace(/汇总规则:父项目不复制子 Project Tasks, 工单, 工时或交付物；报表按来源记录去重,点击总项目可Drilldown到具体子项目和责任人\./g, 'Summary rule: parent projects do not copy child project tasks, tickets, timesheets, or deliverables; reports deduplicate by source records. Click a master project to drill down to specific subprojects and owners.')
      .replace(/按 Project Entities去重/g, 'Deduplicated by project entities')
      .replace(/itemswith high risk/g, 'items with high risk')
      .replace(/保留所属 Master Project 上下文,可Drilldown Execution 责任人/g, 'Keeps master-project context and supports drilldown to execution owners')
      .replace(/MSP 域/g, 'MSP Domain')
      .replace(/颜色表示 Time 紧迫性: 近 Month 紧迫 居 Medium 远 Month 宽松/g, 'Color indicates time urgency: near months are urgent, mid-term months are medium, and later months are relaxed')
      .replace(/Milestone and Risk Warnings\(未来 ([0-9]+) days ([0-9]+) items\)/g, 'Milestone and Risk Warnings (next $1 days · $2 items)')
      .replace(/High-Risk MilestonesRecommendationManagementWatch/g, 'High-risk milestone recommendation: management watch')
      .replace(/同步 Health Score 只读 · 来源 集成网关回写留痕/g, 'Read-only Synchronized Health Score · source: integration gateway writeback audit')
      .replace(/Latest Successful Writeback ([0-9:-]+ [0-9:]+ [A-Z0-9-]+) · 来源 ITSM · 审计日志已留痕/g, 'Latest Successful Writeback $1 · source: ITSM · audit log retained')
      .replace(/Abnormal 清单\(只读 · ObjectID 可Drilldown源 System\)/g, 'Exception List (read-only · object ID can drill down to source system)')
      .replace(/显示 All ([0-9]+) items · 同步异常 ([0-9]+) · Writeback Latency ([0-9]+)/g, 'Showing all $1 items · synchronization exceptions $2 · writeback latency $3')
      .replace(/SourceSystem/g, 'Source System')
      .replace(/ExecutionTickets/g, 'Execution Tickets')
      .replace(/集成网关Overdue/g, 'integration gateway timeout')
      .replace(/Ticket Status 连续 ([0-9]+) 次 Writeback Failed/g, 'ticket status writeback failed $1 consecutive times')
      .replace(/EventAnalysis/g, 'Incident Analysis')
      .replace(/AnalysisEvent 分布情况/g, 'Analyze Incident Distribution')
      .replace(/检查 SLA On Target 情况/g, 'Check SLA Compliance Status')
      .replace(/TicketsTemplate/g, 'Ticket Template')
      .replace(/生成 Incident TicketsContent/g, 'Generate Incident Ticket Content')
      .replace(/Weekly ReportSummary/g, 'Weekly Report Summary')
      .replace(/生成 Incident ManagementWeekly Report/g, 'Generate Incident Management Weekly Report')
      .replace(/打开即办 · 系统按你的 Role 和 Project 关系聚合下一步 Work/g, 'Open actionable work · the system aggregates next-step work by your role and project relationships')
      .replace(/WorkspaceRolePerspective help: 原型演示可切换；正式实现按 EMS NEO 权限和 Project 关系自动决定/g, 'Workspace role perspective help: switchable in the prototype; production uses EMS NEO permissions and project relationships to decide automatically')
      .replace(/PMO · 组合 Governance/g, 'PMO · Portfolio Governance')
      .replace(/PM · ProjectExecution/g, 'PM · Project Execution')
      .replace(/今天从这里开始/g, 'Start Here Today')
      .replace(/你当前查看的是 PMO 组合治理视角\.先 ProcessPending Approval 和 Pending Assignment Project,再关注Master Project Risk 与Acceptance\./g, 'You are viewing the PMO portfolio governance perspective. Process pending approvals and project assignments first, then review master-project risk and acceptance.')
      .replace(/Approval 立项/g, 'Approve Initiation')
      .replace(/ConfirmScope, Customer, 排期和 Budget/g, 'Confirm scope, customer, schedule, and budget')
      .replace(/分配 PM/g, 'Assign PM')
      .replace(/明确 Project 承接人和责任边界/g, 'Clarify project owner and responsibility boundaries')
      .replace(/WatchMaster Project/g, 'Monitor Master Projects')
      .replace(/按 SubprojectViewProgress 与 High Risk/g, 'Review progress and high risk by subproject')
      .replace(/检查 Subproject 门槛后 CompletedGovernance/g, 'Complete governance after checking subproject gates')
      .replace(/Pending Approval 立项/g, 'Initiation Pending Approval')
      .replace(/CreateProject · 待 PMO 立项 Approval/g, 'Create Project · pending PMO initiation approval')
      .replace(/待分配 Project/g, 'Projects Pending Assignment')
      .replace(/立项 Approved · 待指派 PM 承接/g, 'Initiation approved · pending PM assignment')
      .replace(/PendingRisk \/ Milestone/g, 'Pending Risk / Milestone')
      .replace(/待 PMO Confirm/g, 'Pending PMO Confirmation')
      .replace(/待我 Process 点开即办 · Completed 后 Automatic 移出队列/g, 'My work to process · open actionable items; completed items are removed from the queue automatically')
      .replace(/待办队列\(Today ([0-9]+) items\)/g, 'Work Queue (Today · $1 items)')
      .replace(/时限/g, 'Deadline')
      .replace(/明日/g, 'Tomorrow')
      .replace(/Risk 预警/g, 'Risk Warning')
      .replace(/High Risk · 计划/g, 'High Risk · Plan')
      .replace(/已逾期/g, 'Overdue')
      .replace(/待 PMO Confirm Acceptance结论/g, 'Acceptance conclusion pending PMO confirmation')
      .replace(/([0-9]+) days内/g, 'within $1 days')
      .replace(/Milestone and Risk Warnings 未来 ([0-9]+) days ([0-9]+) items/g, 'Milestone and Risk Warnings (next $1 days · $2 items)')
      .replace(/分配 Project/g, 'Assign Project')
      .replace(/Create Project 并 InitiateApproval/g, 'Create project and initiate approval')
      .replace(/My 组合 PMO 全局上下文/g, 'My Portfolio PMO Global Context')
      .replace(/筹备 ([0-9]+) · Execution ([0-9]+) · 收尾 ([0-9]+)/g, 'Preparation $1 · Execution $2 · Closing $3')
      .replace(/待启动排期/g, 'Schedule pending kickoff')
      .replace(/automatically created\(\s*L3\s*\+\s*L2\s*混合/g, 'automatically created (L3 + L2 mixed mode')
      .replace(/AI\s*已关联/g, 'AI linked')
      .replace(/推荐\s+P\.Y\. Lau[\s\S]*?预计\s*2\s*h\s*Completed/g, 'recommended P.Y. Lau (on standby onsite at GBA-GZ, certified for power systems, current workload 1/5). Estimated completion in 2h')
      .replace(/K\.H\. Wong[\s\S]*?FSM-2026-138 Meraki AP[\s\S]*?Recommendation待当前任务Completed后顺路处理/g, 'K.H. Wong is currently at HKT Tower. FSM-2026-138 Meraki AP replacement site at Ocean Park is 12 km away; recommended handling it on route after the current task is completed')
      .replace(/Execution in Progress ([0-9]+) ([0-9]+) users Field/g, 'Execution in Progress $1 · $2 field engineers')
      .replace(/FieldEngineer\s*([0-9]*)\s*人/g, 'Field Engineers $1')
      .replace(/SeniorSecurity/g, 'Senior Security')
      .replace(/Security加固/g, 'Security Hardening')
      .replace(/Pending PMO Confirmation Acceptance结论/g, 'acceptance conclusion pending PMO confirmation')
      .replace(/Milestone and Risk Warnings 未来 ([0-9]+) days ([0-9]+) items/g, 'Milestone and Risk Warnings (next $1 days · $2 items)')
      .replace(/\b全局概览\b/g, 'Global Overview')
      .replace(/Top ([0-9]) Root Cause/g, 'Top $1 Root Cause')
      .replace(/([0-9]{2}): ([0-9]{2})/g, '$1:$2')
      .replace(/\bShowing ([0-9]+) \/ ([0-9]+) Tenant\b/g, 'Showing $1 / $2 Tenants');
  }

  function applyPageI18n(root) {
    root = root || document.body;
    if (!root) return;
    i18nApplying = true;
    var lang = currentLang || 'zh-CN';
    var toEnglish = lang === 'en';
    document.documentElement.lang = lang === 'en' ? 'en' : lang;
    if (!document.__emsI18nOriginalTitle) document.__emsI18nOriginalTitle = document.title;
    document.title = toEnglish ? i18nText(document.__emsI18nOriginalTitle) : document.__emsI18nOriginalTitle;
    document.querySelectorAll('.lang-option').forEach(function (opt) {
      var code = opt.getAttribute('data-lang-code');
      opt.classList.toggle('active', code === lang);
    });
    var attrs = ['title', 'placeholder', 'aria-label', 'data-tip'];
    if (root.nodeType === 1) {
      Array.prototype.forEach.call(root.querySelectorAll('[' + attrs.join('],[') + ']'), function (el) {
        attrs.forEach(function (attr) {
          if (!el.hasAttribute(attr)) return;
          var key = 'i18nOriginal' + attr.replace(/(^|-)([a-z])/g, function (_, p, c) { return c.toUpperCase(); });
          if (!el.dataset[key]) el.dataset[key] = el.getAttribute(attr);
          var nextAttr = toEnglish ? i18nText(el.dataset[key]) : el.dataset[key];
          if (el.getAttribute(attr) !== nextAttr) el.setAttribute(attr, nextAttr);
        });
      });
    }
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var parent = node.parentNode;
        if (!parent || !parent.closest) return NodeFilter.FILTER_REJECT;
        if (parent.closest('script,style,svg,code,pre,textarea')) return NodeFilter.FILTER_REJECT;
        if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
        if (!toEnglish && typeof node.__emsI18nOriginal === 'string') return NodeFilter.FILTER_ACCEPT;
        if (!/[\u4e00-\u9fff]/.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      if (
        toEnglish &&
        typeof node.__emsI18nOriginal === 'string' &&
        /[\u4e00-\u9fff]/.test(node.nodeValue) &&
        node.nodeValue.trim() !== i18nText(node.__emsI18nOriginal).trim()
      ) {
        node.__emsI18nOriginal = node.nodeValue;
      }
      if (!node.__emsI18nOriginal) node.__emsI18nOriginal = node.nodeValue;
      var nextText = toEnglish ? i18nText(node.__emsI18nOriginal) : node.__emsI18nOriginal;
      if (node.nodeValue !== nextText) node.nodeValue = nextText;
    });
    i18nApplying = false;
  }

  function i18nRefresh(root) {
    if (currentLang !== 'en') return;
    setTimeout(function () { applyPageI18n(root || document.body); }, 0);
  }
  window.EMS_I18N_REFRESH = i18nRefresh;

  function normalizeItamListSelection() {
    if (!document.body.classList.contains('itam-crud-list') || !document.querySelector('.pagination,.pager,.table-pagination')) return;
    var tables = Array.prototype.slice.call(document.querySelectorAll('table'));
    if (tables.length !== 1) return;
    var table = tables[0];
    var headRow = table.querySelector('thead tr');
    var bodyRows = Array.prototype.slice.call(table.querySelectorAll('tbody tr'));
    if (!headRow || !bodyRows.length) return;

    var firstBodyCell = bodyRows[0].firstElementChild;
    var rowsAlreadySelectable = !!(firstBodyCell && firstBodyCell.querySelector('input[type="checkbox"]'));
    var firstHeadCell = headRow.firstElementChild;
    var selectAll = firstHeadCell && firstHeadCell.querySelector('input[type="checkbox"]');

    if (rowsAlreadySelectable && !selectAll) {
      firstHeadCell.innerHTML = '<input class="row-checkbox" type="checkbox" aria-label="选择全部记录">';
      selectAll = firstHeadCell.firstElementChild;
    } else if (!rowsAlreadySelectable) {
      var selectHead = document.createElement('th');
      selectHead.className = 'lowcode-select-cell';
      selectHead.innerHTML = '<input class="row-checkbox" type="checkbox" aria-label="选择全部记录">';
      headRow.insertBefore(selectHead, firstHeadCell);
      selectAll = selectHead.firstElementChild;
      bodyRows.forEach(function (row, index) {
        var cell = document.createElement('td');
        cell.className = 'lowcode-select-cell';
        cell.innerHTML = '<input class="row-checkbox" type="checkbox" aria-label="选择第 ' + (index + 1) + ' 条记录">';
        row.insertBefore(cell, row.firstElementChild);
      });
    }

    if (!selectAll) return;
    var rowChecks = Array.prototype.slice.call(table.querySelectorAll('tbody input[type="checkbox"]'));
    selectAll.addEventListener('change', function () {
      rowChecks.forEach(function (checkbox) { checkbox.checked = selectAll.checked; });
    });
    rowChecks.forEach(function (checkbox) {
      checkbox.addEventListener('change', function () {
        selectAll.checked = rowChecks.length > 0 && rowChecks.every(function (item) { return item.checked; });
        selectAll.indeterminate = rowChecks.some(function (item) { return item.checked; }) && !selectAll.checked;
      });
    });

    var toolbar = document.querySelector('.action-bar');
    if (toolbar) {
      Array.prototype.forEach.call(toolbar.querySelectorAll('a,button'), function (control) {
        if (/^\+\s*添加$/.test((control.textContent || '').trim())) control.textContent = '添加';
      });
      var keyword = toolbar.querySelector('input[type="search"],input.search-input,input[placeholder*="搜索"]');
      if (keyword && !keyword.getAttribute('aria-label')) keyword.setAttribute('aria-label', '关键词搜索');
    }

    Array.prototype.forEach.call(table.querySelectorAll('thead .sort-icon,thead .filter-icon'), function (icon) {
      var header = icon.closest('th');
      var label = header ? (header.textContent || '').replace(/[⇅▽↑↓]/g, '').trim() : '当前字段';
      icon.setAttribute('role', 'button');
      icon.setAttribute('tabindex', '0');
      icon.setAttribute('aria-label', (icon.classList.contains('sort-icon') ? '排序' : '筛选') + label);
    });

    if (!table.querySelector('tbody a') && /\/itam\/itam-alert-history\.html$/.test(location.pathname)) {
      bodyRows.forEach(function (row) {
        var coreCell = row.children[1];
        if (!coreCell || !coreCell.textContent.trim()) return;
        var coreLink = document.createElement('a');
        coreLink.className = 'link-text';
        coreLink.href = 'itam-alert-detail.html';
        coreLink.textContent = coreCell.textContent.trim();
        coreCell.textContent = '';
        coreCell.appendChild(coreLink);
      });
      var operationHead = headRow.lastElementChild;
      if (operationHead && /操作/.test(operationHead.textContent || '')) {
        operationHead.remove();
        bodyRows.forEach(function (row) {
          var operationCell = row.lastElementChild;
          if (operationCell && operationCell.classList.contains('row-actions')) operationCell.remove();
        });
      }
    }

    Array.prototype.forEach.call(table.querySelectorAll('td.row-actions'), function (actions) {
      var menu = actions.querySelector('.dropdown-menu');
      var more = actions.querySelector('.more-btn');
      if (!menu || actions.querySelector('.lowcode-row-action')) return;
      var edit = menu.querySelector('[data-action="edit"]');
      var remove = menu.querySelector('[data-action="delete"]');
      if (edit) {
        var editLink = document.createElement('a');
        editLink.className = 'lowcode-row-action';
        editLink.textContent = '编辑';
        editLink.href = edit.getAttribute('data-href') || '#';
        actions.insertBefore(editLink, more || menu);
        edit.remove();
      }
      if (remove) {
        var deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'lowcode-row-action is-danger';
        deleteButton.textContent = '删除';
        deleteButton.addEventListener('click', function (event) {
          event.stopPropagation();
          if (typeof window.showToast === 'function') window.showToast('删除操作仅作原型演示', 'info');
        });
        actions.insertBefore(deleteButton, more || menu);
        remove.remove();
      }
      if (!menu.querySelector('.dropdown-item')) {
        if (more) more.remove();
        menu.remove();
      }
    });
  }

  function installLowcodeViewportList() {
    normalizeItamListSelection();
    var path = location.pathname.replace(/\\/g, '/');
    var isTypedList = document.body.classList.contains('fsm-crud-list') || document.body.classList.contains('itam-crud-list') || document.body.classList.contains('master-data-crud-list');
    var pmsLists = /\/pms\/(pms-(audit|deliverables|projects|sites|staff|tasks|teams|timesheets))\.html$/;
    if (!isTypedList && !pmsLists.test(path)) return;

    var tables = Array.prototype.filter.call(document.querySelectorAll('table'), function (table) {
      var rect = table.getBoundingClientRect();
      return rect.width > 240 && rect.height > 40 && !table.closest('dialog,[hidden]');
    });
    if (!tables.length) return;

    var target = tables[0];
    if (tables.length > 1) {
      var sideBySide = tables.filter(function (table) {
        var a = table.getBoundingClientRect();
        return tables.some(function (other) {
          if (other === table) return false;
          var b = other.getBoundingClientRect();
          var overlap = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          return overlap > 80 && Math.abs(a.left - b.left) > 120;
        });
      });
      if (sideBySide.length) {
        target = sideBySide.sort(function (a, b) { return b.getBoundingClientRect().left - a.getBoundingClientRect().left; })[0];
      } else {
        target = tables.sort(function (a, b) {
          var ar = a.getBoundingClientRect(), br = b.getBoundingClientRect();
          return (br.width * br.height) - (ar.width * ar.height);
        })[0];
      }
    }

    var scroll = target.closest('.table-card-scroll,.table-scroll,.table-wrap,.table-container,.data-table-wrap,.rp-table-wrap,.md-table-wrap,.table-shell') || target.parentElement;
    var host = scroll.closest('.card,.table-card,.panel,.content') || scroll.parentElement;
    var pager = host && host.querySelector('.pagination,.pager,.table-pagination');
    if (pager && scroll.contains(pager)) {
      var originalScroll = scroll;
      var tableViewport = document.createElement('div');
      originalScroll.insertBefore(tableViewport, target);
      tableViewport.appendChild(target);
      scroll = tableViewport;
      host = originalScroll;
    }
    document.body.classList.add('lowcode-viewport-list');
    target.classList.add('lowcode-viewport-table');
    var lastHeader = target.querySelector('thead th:last-child');
    if (lastHeader && /操作|action/i.test(lastHeader.textContent || '')) target.classList.add('lowcode-has-action-column');
    scroll.classList.add('lowcode-viewport-scroll');
    if (pager) pager.classList.add('lowcode-viewport-pager');
    if (pager && host) host.classList.add('lowcode-viewport-host');
    if (pager && host) {
      var section = scroll.parentElement;
      while (section && section !== host && !section.contains(pager)) section = section.parentElement;
      if (section && section !== host) section.classList.add('lowcode-viewport-section');
    }

    function sizeScroll() {
      var rect = scroll.getBoundingClientRect();
      var pagerHeight = pager ? pager.getBoundingClientRect().height : 48;
      var bottomGap = pager ? 0 : 12;
      var available = Math.max(180, window.innerHeight - rect.top - pagerHeight - bottomGap);
      if (pager && host) {
        var hostRect = host.getBoundingClientRect();
        host.style.height = Math.max(240, window.innerHeight - hostRect.top) + 'px';
        host.style.display = 'flex';
        host.style.flexDirection = 'column';
        host.style.overflow = 'hidden';
        available = Math.max(48, window.innerHeight - rect.top - pagerHeight);
      }
      scroll.style.height = available + 'px';
      scroll.style.maxHeight = available + 'px';
    }
    sizeScroll();
    window.addEventListener('resize', sizeScroll);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(installLowcodeViewportList, 0); });
  else setTimeout(installLowcodeViewportList, 0);

  function installI18nObserver() {
    if (!window.MutationObserver || !document.body) return;
    var observer = new MutationObserver(function () {
      if (i18nApplying || currentLang !== 'en') return;
      clearTimeout(i18nObserverTimer);
      i18nObserverTimer = setTimeout(function () { applyPageI18n(document.body); }, 60);
    });
    observer.observe(document.body, { childList: true, characterData: true, subtree: true });
  }

  // ─── SIDEBAR (legacy — kept for demo pages that opt out) ────────
  var MENU_ITEMS = [
    { type: 'item', href: 'portal/service-portal.html', label: '服务门户', icon: '<svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>' },
    { type: 'item', href: 'portal/work-queue.html', label: '我的待办', todoBadge: true, icon: '<svg viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>' },
    { type: 'item', href: 'portal/governance.html', label: 'Governance', icon: '<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' },
    { type: 'item', href: 'portal/dashboard.html', label: 'Dashboard', icon: '<svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>' },
    { type: 'item', href: 'portal/reports.html', label: 'Report Center', icon: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h8M8 17h5"/></svg>' },
    { type: 'group', label: 'ITOM 监控' },
    { type: 'item', href: 'itom/alert-list.html', label: '告警中心', icon: '<svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>' },
    { type: 'item', href: 'itom/alert-noise-reduction.html', label: '降噪中心', icon: '<svg viewBox="0 0 24 24"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707"/><circle cx="12" cy="12" r="4"/></svg>' },
    { type: 'item', href: 'itom/capacity-forecast.html', label: '容量预测', icon: '<svg viewBox="0 0 24 24"><polyline points="3 17 9 11 13 15 21 7"/><path d="M21 7v5M21 7h-5"/></svg>' },
    { type: 'item', href: 'itom/alert-to-incident.html', label: '告警转工单', icon: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-6"/><path d="M9 15l3 3 3-3"/></svg>' },
    { type: 'item', href: 'itom/itom-topology.html', label: '网络拓扑', icon: '<svg viewBox="0 0 24 24"><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/><path d="M6 9v6M18 9v6M9 6h6M9 18h6"/></svg>' },
    { type: 'group', label: 'NPM' },
    { type: 'item', href: 'itom/npm-overview.html', label: '网络质量', icon: '<svg viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>' },
    { type: 'group', label: 'CMDB' },
    { type: 'item', href: 'cmdb/cmdb-v2-ci-list.html', label: 'CI 资产', icon: '<svg viewBox="0 0 24 24"><path d="M4 7V4a2 2 0 012-2h8.5L20 7.5V20a2 2 0 01-2 2H6a2 2 0 01-2-2v-3"/><path d="M14 2v6h6"/><path d="M2 12h10"/><path d="M9 9l3 3-3 3"/></svg>' },
    { type: 'item', href: 'cmdb/cmdb-v2-relationship-view.html', label: '服务拓扑', icon: '<svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>' },
    { type: 'item', href: 'cmdb/cmdb-v2-discovery-jobs.html', label: '自动发现', icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 000 20 14.5 14.5 0 000-20"/><path d="M2 12h20"/></svg>' },
    { type: 'group', label: 'ITSM' },
    { type: 'item', href: 'itsm/itsm-incidents.html', label: '事件管理', icon: '<svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>' },
    { type: 'item', href: 'itsm/change-impact.html', label: '变更管理', icon: '<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>' },
    { type: 'item', href: 'itsm/service-request.html', label: '服务请求', icon: '<svg viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>' },
    { type: 'group', label: 'ITAM' },
    { type: 'item', href: 'itam/itam-overview.html', label: '资产概览', icon: '<svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05"/><path d="M12 22.08V12"/></svg>' },
    { type: 'item', href: 'itam/itam-asset-requests.html', label: '资产请求', icon: '<svg viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>' },
    { type: 'item', href: 'itam/itam-delivery.html', label: '发货单', icon: '<svg viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>' },
    { type: 'item', href: 'itam/itam-asset-list.html', label: '资产清单', icon: '<svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05"/><path d="M12 22.08V12"/></svg>' },
    { type: 'item', href: 'itam/itam-consumables.html', label: '耗材管理', icon: '<svg viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>' },
    { type: 'group', label: '入库管理' },
    { type: 'item', href: 'itam/itam-inbound.html', label: '未入库', icon: '<svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05"/><path d="M12 22.08V12"/></svg>' },
    { type: 'item', href: 'itam/itam-inbound-done.html', label: '已入库', icon: '<svg viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>' },
    { type: 'group', label: '盘点任务' },
    { type: 'item', href: 'itam/itam-stocktaking.html', label: '盘点任务定义', icon: '<svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>' },
    { type: 'item', href: 'itam/itam-stocktaking-tasks.html', label: '所有任务', icon: '<svg viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>' },
    { type: 'item', href: 'itam/itam-difference-report.html', label: '差异报告', icon: '<svg viewBox="0 0 24 24"><path d="M9 17v-6M15 17v-2M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>' },
    { type: 'group', label: '合同管理' },
    { type: 'item', href: 'master-data/master-data-list.html?product=itam&module=contracts', label: '合同管理', icon: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/></svg>' },
    { type: 'item', href: 'itam/itam-contracts-purchase.html', label: '采购合同', icon: '<svg viewBox="0 0 24 24"><path d="M3 3h18v18H3z"/><path d="M9 17l3-3 3 3M12 14V7M7 11h10"/></svg>' },
    { type: 'group', label: '预警中心' },
    { type: 'item', href: 'itam/itam-alert-history.html', label: '预警历史', icon: '<svg viewBox="0 0 24 24"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>' },
    { type: 'item', href: 'itam/itam-alerts.html', label: '预警规则', icon: '<svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>' },
    { type: 'item', href: 'itam/itam-settings-network.html', label: '基础设置', icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 008 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 8a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>' },
    { type: 'group', label: 'FSM' },
    { type: 'item', href: 'fsm/fsm-dispatch.html', label: '现场派工', icon: '<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>' },
    { type: 'group', label: 'PMS' },
    { type: 'item', href: 'pms/pms-workspace.html', label: '我的工作台', icon: '<svg viewBox="0 0 24 24"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></svg>' },
    { type: 'item', href: 'pms/pms-overview.html', label: '组合报表', icon: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M8 7v10M12 7v7M16 7v13"/></svg>' },
    { type: 'item', href: 'pms/pms-projects.html', label: '项目列表', icon: '<svg viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>' },
    { type: 'item', href: 'pms/pms-tasks.html', label: '任务管理', icon: '<svg viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>' },
    { type: 'item', href: 'pms/pms-deliverables.html', label: '交付物管理', icon: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-6M9 15l3 3 3-3"/></svg>' },
    { type: 'item', href: 'pms/pms-reports.html', label: '项目报告', icon: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/></svg>' },
    { type: 'item', href: 'pms/pms-acceptance.html', label: '验收与关闭', icon: '<svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>' },
    { type: 'group', label: 'PMS · 共享主数据' },
    { type: 'item', href: 'pms/pms-staff.html', label: '人员目录', icon: '<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' },
    { type: 'item', href: 'pms/pms-teams.html', label: '团队目录', icon: '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>' },
    { type: 'item', href: 'pms/pms-sites.html', label: '服务网点', icon: '<svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>' },
    { type: 'group', label: 'PMS · 治理与配置' },
    { type: 'item', href: 'pms/pms-audit.html', label: '审计日志', icon: '<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' },
    { type: 'item', href: 'pms/pms-settings.html', label: '配置中心', icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.6V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9c.26.46.4.98.41 1.51h.09a2 2 0 010 4h-.09c-.01.53-.15 1.05-.41 1.51z"/></svg>' },
    { type: 'group', label: '系统设置' },
    { type: 'item', href: 'ai/ai-governance.html', label: 'AI 治理', roles: ['u3', 'u4', 'pm', 'bm'], icon: '<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' },
    { type: 'item', href: 'ai/ai-platform.html', label: 'AI 平台', roles: ['u3', 'u4'], icon: '<svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/></svg>' },
    { type: 'item', href: 'ai/ai-billing.html', label: 'AI 计费中心', roles: ['u3', 'u4', 'pm', 'bm'], icon: '<svg viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>' },
    { type: 'item', href: 'org/tenant-management.html', label: '租户管理', icon: '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>' },
    { type: 'item', href: 'org/role-management.html', label: '角色权限', icon: '<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' },
    { type: 'item', href: 'settings/general-settings.html', label: '通用设置', icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.6V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9c.26.46.4.98.41 1.51h.09a2 2 0 010 4h-.09c-.01.53-.15 1.05-.41 1.51z"/></svg>' },
    { type: 'item', href: 'settings/third-party.html', label: '三方对接', icon: '<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>' }
  ];

  // ─── FSM 菜单图标（复用 · 16px stroke）───────────────────────────────
  var FSM_ICONS = {
    list: '<svg viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
    create: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M12 12v6M9 15h6"/></svg>',
    dispatch: '<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>',
    accept: '<svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>',
    pin: '<svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    chat: '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',
    settle: '<svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>',
    parts: '<svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05"/><path d="M12 22.08V12"/></svg>',
    users: '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>',
    user: '<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    shieldCheck: '<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>',
    calendar: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    video: '<svg viewBox="0 0 24 24"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>',
    eye: '<svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    ban: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>',
    chart: '<svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    db: '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
    contract: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-6M9 15l3 3 3-3"/></svg>',
    key: '<svg viewBox="0 0 24 24"><circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6"/><path d="M15.5 7.5l3 3L22 7l-3-3"/></svg>',
    tag: '<svg viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
    clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    layers: '<svg viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
    lock: '<svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>',
    phone: '<svg viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
    link: '<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>',
    ai: '<svg viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    globe: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>',
    desk: '<svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
    award: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.5 13l1.5 8-5-3-5 3 1.5-8"/></svg>',
    card: '<svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
    fileLock: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><rect x="9" y="13" width="6" height="5" rx="1"/><path d="M10 13v-1a2 2 0 014 0v1"/></svg>',
    userCheck: '<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M17 11l2 2 4-4"/></svg>'
  };

  // ─── DOMAIN SWITCHER DATA ──────────────────────────────────────────
  var DS_DOMAINS = [
    {
      id: 'service-portal', label: '服务门户', color: '#0D9488', position: 'top',
      icon: '<svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>',
      items: [
        { href: 'portal/service-portal.html', label: '服务首页', icon: '<svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>' },
        { href: 'portal/service-requests.html', label: '服务请求', icon: '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h5"/></svg>' },
        { href: 'portal/service-request-form.html', label: '客户报障', icon: '<svg viewBox="0 0 24 24"><path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>' },
        { href: 'portal/service-portal.html#mine', label: '我的服务', icon: '<svg viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>' }
      ]
    },
    {
      id: 'workspace', label: '工作台', color: '#2563EB', position: 'top',
      icon: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
      items: [
        { href: 'portal/work-queue.html', label: '我的待办', todoBadge: true, icon: '<svg viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>' },
        { href: 'portal/service-intake.html', label: '服务受理', icon: '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h5"/><path d="M15 17l2 2 4-4"/></svg>' },
        { href: 'portal/governance.html', label: '治理中心', icon: '<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' },
        { href: 'portal/dashboard.html', label: '仪表盘', icon: '<svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>' },
        { href: 'portal/reports.html', label: '报告中心', icon: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h8M8 17h5"/></svg>' }
      ]
    },
    {
      id: 'scenarios', label: '业务场景', color: '#DB2777', position: 'top',
      icon: '<svg viewBox="0 0 24 24"><path d="M5 3v4M3 5h4"/><path d="M19 17v4M17 19h4"/><rect x="4" y="10" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><path d="M10 13h2a5 5 0 005-5M7 16v2a2 2 0 002 2h8"/></svg>',
      items: []
    },
    {
      id: 'itom', label: 'ITOM', color: '#2563EB', position: 'top',
      icon: '<svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>',
      items: [
        { href: 'itom/alert-list.html', label: '告警中心', icon: '<svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>' },
        { href: 'itom/alert-noise-reduction.html', label: '降噪中心', icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 3v1m0 16v1m9-9h-1M4 12H3"/></svg>' },
        { href: 'itom/capacity-forecast.html', label: '容量预测', icon: '<svg viewBox="0 0 24 24"><polyline points="3 17 9 11 13 15 21 7"/><path d="M21 7v5M21 7h-5"/></svg>' },
        { href: 'itom/alert-to-incident.html', label: '告警转工单', icon: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>' },
        { href: 'itom/npm-overview.html', label: '网络质量', icon: '<svg viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>' }
      ]
    },
    {
      id: 'cmdb', label: 'CMDB', color: '#7C3AED', position: 'top',
      icon: '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/></svg>',
      items: [
        { group: '总览' },
        { href: 'cmdb/cmdb-v2-overview.html', label: '仪表盘', icon: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/></svg>' },
        { group: '配置项与关系' },
        { href: 'cmdb/cmdb-v2-ci-list.html', label: 'CI 列表', icon: '<svg viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>' },
        { href: 'cmdb/cmdb-v2-query-builder.html', label: 'Query Builder', icon: '<svg viewBox="0 0 24 24"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>' },
        { href: 'cmdb/cmdb-v2-relationship-view.html', label: '关系图谱', icon: '<svg viewBox="0 0 24 24"><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="12" cy="18" r="3"/><path d="M8 8l3 8M16 8l-3 8"/></svg>' },
        { href: 'cmdb/cmdb-v2-service-mapping.html', label: '服务定义', icon: '<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>' },
        { href: 'cmdb/cmdb-v2-impact.html', label: '影响面分析', icon: '<svg viewBox="0 0 24 24"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>' },
        { group: '数据接入' },
        { href: 'cmdb/cmdb-v2-datasources.html', label: '数据源', icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>' },
        { href: 'cmdb/cmdb-v2-integration-connectors.html', label: '集成连接器', icon: '<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>' },
        { href: 'cmdb/cmdb-v2-discovery-jobs.html', label: '发现任务', icon: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' },
        { href: 'cmdb/cmdb-v2-discovery-pattern.html', label: '发现模式', icon: '<svg viewBox="0 0 24 24"><path d="M6 3v12"/><circle cx="6" cy="3" r="2"/><circle cx="6" cy="21" r="2"/><circle cx="18" cy="9" r="2"/><path d="M6 15v2M6 5v2M18 7a2 2 0 00-2-2H9M18 11a2 2 0 01-2 2H9"/></svg>' },
        { href: 'cmdb/cmdb-v2-discovery-history.html', label: '发现历史', icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' },
        { href: 'cmdb/cmdb-v2-credentials.html', label: '凭据库', icon: '<svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>' },
        { group: '模型与识别' },
        { href: 'cmdb/cmdb-v2-schema-class.html', label: 'Class 体系', icon: '<svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>' },
        { href: 'cmdb/cmdb-v2-schema-relationships.html', label: '关系词汇', icon: '<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/></svg>' },
        { href: 'cmdb/cmdb-v2-schema-identify.html', label: '识别规则', icon: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/></svg>' },
        { href: 'cmdb/cmdb-v2-ire-simulation.html', label: 'IRE 仿真', icon: '<svg viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>' },
        { href: 'cmdb/cmdb-v2-product-model.html', label: '产品模型', icon: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>' },
        { href: 'cmdb/cmdb-v2-blueprint.html', label: '蓝图管理', icon: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/></svg>' },
        { group: '数据治理' },
        { href: 'cmdb/cmdb-v2-quality.html', label: '数据质量', icon: '<svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>' },
        { href: 'cmdb/cmdb-v2-conflict-queue.html', label: '冲突处理', icon: '<svg viewBox="0 0 24 24"><path d="M6 3h12l4 6-10 13L2 9z"/></svg>' },
        { href: 'cmdb/cmdb-v2-dedup.html', label: '去重管理', icon: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>' },
        { href: 'cmdb/cmdb-v2-lifecycle.html', label: '生命周期', icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' },
        { href: 'cmdb/cmdb-v2-attestation.html', label: '认证管理', icon: '<svg viewBox="0 0 24 24"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></svg>' },
        { href: 'cmdb/cmdb-v2-audit-compliance.html', label: '审计合规', icon: '<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>' },
        { group: '外部集成' },
        { href: 'cmdb/cmdb-v2-webhooks.html', label: '出站订阅', icon: '<svg viewBox="0 0 24 24"><path d="M9 2v6M15 2v6M5 8h14v4a7 7 0 01-14 0z"/></svg>' },
        { href: 'cmdb/cmdb-v2-webhook-dlq.html', label: '投递失败', icon: '<svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>' },
        { group: '报表与设置' },
        { href: 'cmdb/cmdb-v2-report-rules.html', label: '报表中心', icon: '<svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>' },
        { href: 'cmdb/cmdb-v2-settings-center.html', label: '设置中心', icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/></svg>' }
      ]
    },
    {
      id: 'itsm', label: 'ITSM', color: '#059669', position: 'top', solutionOnly: true,
      icon: '<svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>',
      items: [
        { group: '工作台' },
        { href: 'itsm/itsm-dashboard.html', label: '首页', icon: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>' },
        { group: '工单管理' },
        { href: 'itsm/itsm-incidents.html', label: '事件管理', icon: '<svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>' },
        { href: 'itsm/itsm-incident-tasks.html', label: '事件任务', icon: '<svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/><path d="M3 9h6"/></svg>' },
        { href: 'itsm/itsm-problems.html', label: '问题管理', icon: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><path d="M11 8v3M11 14h.01"/></svg>' },
        { href: 'itsm/itsm-changes.html', label: '变更管理', icon: '<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>' },
        { href: 'itsm/itsm-problem-tasks.html', label: '问题任务', icon: '<svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>' },
        { href: 'itsm/itsm-change-tasks.html', label: '变更任务', icon: '<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/><path d="M9 11l3 3L22 4"/></svg>' },
        { group: '服务管理' },
        { href: 'itsm/itsm-service-catalog.html', label: '服务目录管理', icon: '<svg viewBox="0 0 24 24"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>' },
        { href: 'itsm/service-request.html', label: '服务请求', icon: '<svg viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>' },
        { href: 'itsm/itsm-knowledge.html', label: '知识库管理', icon: '<svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>' },
        { href: 'itsm/itsm-survey.html', label: '问卷调查', icon: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8M16 17H8M10 9H8"/></svg>' },
        { group: '服务效率' },
        { href: 'itsm/itsm-sla-list.html', label: 'SLA配置', icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>' },
        { href: 'itsm/itsm-priority-matrix-list.html', label: '优先级配置', icon: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>' },
        { href: 'itsm/itsm-priority-list.html', label: '优先级', icon: '<svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h7"/></svg>' },
        { href: 'itsm/itsm-urgency-list.html', label: '紧急性', icon: '<svg viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>' },
        { href: 'itsm/itsm-impact-list.html', label: '影响度', icon: '<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' },
        { href: 'itsm/itsm-category-list.html', label: '分类', icon: '<svg viewBox="0 0 24 24"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>' },
        { href: 'itsm/itsm-problem-sub-list.html', label: '问题细分', icon: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' },
        { href: 'itsm/itsm-fault-category-list.html', label: '故障类别', icon: '<svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' },
        { group: '共享主数据' },
        { href: 'master-data/master-data-list.html?product=itsm&module=customers', label: '客户管理', icon: '<svg viewBox="0 0 24 24"><path d="M3 21v-8a4 4 0 014-4h10a4 4 0 014 4v8"/><circle cx="12" cy="5" r="3"/></svg>' },
        { href: 'master-data/master-data-list.html?product=itsm&module=contacts', label: '客户联系人管理', icon: '<svg viewBox="0 0 24 24"><path d="M16 11a4 4 0 10-8 0"/><path d="M4 21a8 8 0 0116 0"/><path d="M18 8h4M20 6v4"/></svg>' },
        { href: 'master-data/master-data-list.html?product=itsm&module=contracts', label: '合同管理', icon: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/></svg>' },
        { href: 'master-data/master-data-list.html?product=itsm&module=tokens', label: 'Token 管理', icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M8 12h8"/></svg>' },
        { href: 'master-data/master-data-list.html?product=itsm&module=sites', label: '服务网点', icon: '<svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>' },
        { href: 'master-data/master-data-list.html?product=itsm&module=teams', label: '团队管理', icon: '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/></svg>' },
        { href: 'master-data/master-data-list.html?product=itsm&module=users', label: '用户管理', icon: '<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' },
        { href: 'fsm/fsm-time-management.html', label: '时间管理', icon: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' },
        { href: 'master-data/approval-config-list.html?product=itsm', label: '审批配置', icon: '<svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>' },
        { group: '团队与报告' },
        { href: 'itsm/itsm-service-report.html', label: '服务报告', icon: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8M16 17H8M10 9H8"/></svg>' },
        { href: 'itsm/itsm-report-templates.html', label: '报告模板', icon: '<svg viewBox="0 0 24 24"><path d="M4 3h16v18H4z"/><path d="M8 7h8M8 11h8M8 15h5"/></svg>' },
        { group: '系统设置' },
        { href: 'itsm/itsm-settings.html?section=status', label: '状态管理', icon: '<svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' },
        { href: 'itsm/itsm-settings.html?section=dispatch', label: '分单规则', icon: '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/></svg>' },
        { href: 'itsm/itsm-settings.html?section=portal', label: '服务门户配置', icon: '<svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>' }
      ]
    },
    {
      id: 'itam', label: 'ITAM', color: '#6366F1', position: 'top', solutionOnly: true,
      icon: '<svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05"/><path d="M12 22.08V12"/></svg>',
      items: [
        { href: 'itam/itam-overview.html', label: '资产分析看板', icon: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/></svg>' },
        { group: '资产请求' },
        { href: 'itam/itam-asset-requests.html', label: '我的请求 / 全部请求', icon: '<svg viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>' },
        { href: 'itam/itam-delivery.html', label: '发货单', icon: '<svg viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>' },
        { group: '固定资产管理' },
        { href: 'itam/itam-asset-list.html', label: '资产清单', icon: '<svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05"/><path d="M12 22.08V12"/></svg>' },
        { href: 'itam/itam-asset-list-self.html', label: '自采清单', icon: '<svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05"/><path d="M12 22.08V12"/></svg>' },
        { href: 'itam/itam-asset-list-agent.html', label: '代管清单', icon: '<svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05"/><path d="M12 22.08V12"/></svg>' },
        { href: 'itam/itam-asset-delivery-detail.html', label: '固定资产发货明细', icon: '<svg viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>' },
        { href: 'itam/itam-asset-apply-detail.html', label: '固定资产申请明细', icon: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8M16 17H8M10 9H8"/></svg>' },
        { href: 'itam/itam-asset-inbound-detail.html', label: '资产入库明细', icon: '<svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05"/><path d="M12 22.08V12"/></svg>' },
        { group: '耗材与库存' },
        { href: 'itam/itam-consumables.html', label: '耗材表', icon: '<svg viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>' },
        { href: 'itam/itam-consumables-stock.html', label: '耗材库存', icon: '<svg viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>' },
        { href: 'itam/itam-consumables-inbound.html', label: '耗材入库明细', icon: '<svg viewBox="0 0 24 24"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16"/></svg>' },
        { href: 'itam/itam-consumables-delivery.html', label: '耗材发货明细', icon: '<svg viewBox="0 0 24 24"><rect x="1" y="5" width="14" height="12" rx="1"/><path d="M15 9h4l3 3v5h-7M5.5 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm12 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/></svg>' },
        { href: 'itam/itam-consumables-requests.html', label: '耗材申请明细', icon: '<svg viewBox="0 0 24 24"><path d="M9 5h6m-6 4h6m-6 4h4M5 3h14v18l-3-2-2 2-2-2-2 2-3-2V3z"/></svg>' },
        { href: 'itam/itam-inbound.html', label: '未入库', icon: '<svg viewBox="0 0 24 24"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/></svg>' },
        { href: 'itam/itam-inbound-done.html', label: '已入库', icon: '<svg viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>' },
        { group: '盘点任务' },
        { href: 'itam/itam-stocktaking.html', label: '盘点任务定义', icon: '<svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>' },
        { href: 'itam/itam-stocktaking-tasks.html', label: '所有任务', icon: '<svg viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>' },
        { href: 'itam/itam-difference-report.html', label: '差异报告', icon: '<svg viewBox="0 0 24 24"><path d="M9 17v-6M15 17v-2M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>' },
        { group: '合同与预警' },
        { href: 'itam/itam-contracts-purchase.html', label: '采购合同', icon: '<svg viewBox="0 0 24 24"><path d="M3 3h18v18H3z"/><path d="M9 17l3-3 3 3M12 14V7M7 11h10"/></svg>' },
        { href: 'itam/itam-alert-history.html', label: '预警历史', icon: '<svg viewBox="0 0 24 24"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>' },
        { href: 'itam/itam-alerts.html', label: '预警规则', icon: '<svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>' },
        { group: '共享主数据' },
        { href: 'master-data/master-data-list.html?product=itam&module=customers', label: '客户管理', icon: '<svg viewBox="0 0 24 24"><path d="M3 21v-8a4 4 0 014-4h10a4 4 0 014 4v8"/><circle cx="12" cy="5" r="3"/></svg>' },
        { href: 'master-data/master-data-list.html?product=itam&module=contacts', label: '客户联系人管理', icon: '<svg viewBox="0 0 24 24"><path d="M16 11a4 4 0 10-8 0"/><path d="M4 21a8 8 0 0116 0"/><path d="M18 8h4M20 6v4"/></svg>' },
        { href: 'master-data/master-data-list.html?product=itam&module=contracts', label: '合同管理', icon: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/></svg>' },
        { href: 'master-data/master-data-list.html?product=itam&module=sites', label: '服务网点', icon: '<svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>' },
        { href: 'master-data/master-data-list.html?product=itam&module=teams', label: '团队管理', icon: '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/></svg>' },
        { href: 'master-data/master-data-list.html?product=itam&module=users', label: '用户管理', icon: '<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' },
        { href: 'fsm/fsm-time-management.html', label: '时间管理', icon: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' },
        { href: 'master-data/approval-config-list.html?product=itam', label: '审批配置', icon: '<svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>' },
        { group: '基础设置' },
        { href: 'itam/itam-settings-supplier.html', label: '供应商管理', icon: '<svg viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h4M8 10v4M15 11h.01M18 13h.01"/></svg>' },
        { href: 'itam/itam-settings-shelf.html', label: '货架管理', icon: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>' },
        { href: 'itam/itam-settings-warehouse.html', label: '仓库管理', icon: '<svg viewBox="0 0 24 24"><path d="M3 21V9l9-6 9 6v12"/><path d="M9 21v-6h6v6"/></svg>' },
        { href: 'itam/itam-settings-model.html', label: '型号管理', icon: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9z"/></svg>' },
        { href: 'itam/itam-settings-brand.html', label: '品牌管理', icon: '<svg viewBox="0 0 24 24"><path d="M12 2l2.4 4.8 5.6.8-4 4 1 5.6-5-2.6-5 2.6 1-5.6-4-4 5.6-.8z"/></svg>' },
        { href: 'itam/itam-settings-category.html', label: '资产类别', icon: '<svg viewBox="0 0 24 24"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>' },
        { href: 'itam/itam-settings-status.html', label: '状态管理', icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-6"/></svg>' }
      ]
    },
    {
      id: 'fsm', label: 'FSM', color: '#D97706', position: 'top', solutionOnly: true,
      icon: '<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>',
      items: [
        { group: '工作台' },
        { href: 'fsm/fsm-dispatch.html', label: '工作台', icon: FSM_ICONS.desk },
        { href: 'field-engineer-workbench/index.html', label: '现场工程师工作台', icon: FSM_ICONS.phone },
        { group: '工单管理' },
        { href: 'fsm/fsm-workorder-create.html', label: '受理提单', icon: FSM_ICONS.create },
        { href: 'fsm/fsm-workorder-batch-create.html', label: '批量建单', icon: FSM_ICONS.layers },
        { href: 'fsm/fsm-workorders.html', label: '工单列表', icon: FSM_ICONS.list },
        { group: '审核中心' },
        { href: 'fsm/fsm-certificates.html', label: '证书管理', icon: FSM_ICONS.award },
        { href: 'fsm/fsm-engineer-review.html', label: '入驻审核', icon: FSM_ICONS.shieldCheck },
        { href: 'fsm/fsm-privacy-request.html', label: '档案访问申请', icon: FSM_ICONS.fileLock },
        { href: 'fsm/fsm-privacy-auth.html', label: '档案访问授权', icon: FSM_ICONS.userCheck },
        { group: '资源与人员' },
        { href: 'fsm/fsm-tac-engineers.html', label: 'TAC工程师', icon: FSM_ICONS.user },
        { href: 'fsm/fsm-engineers.html', label: '现场工程师', icon: FSM_ICONS.users },
        { href: 'fsm/fsm-engineer-levels.html', label: '工程师级别', icon: FSM_ICONS.award },
        { href: 'fsm/fsm-dispatchers.html', label: '调度员与客服', icon: FSM_ICONS.users },
        { href: 'fsm/fsm-schedule.html', label: '排班日历', icon: FSM_ICONS.calendar },
        { href: 'fsm/fsm-tac-schedule.html', label: 'TAC工程师排班', icon: FSM_ICONS.calendar },
        { href: 'fsm/fsm-cs-schedule.html', label: '客服排班', icon: FSM_ICONS.calendar },
        { href: 'fsm/fsm-shift-definition.html', label: '班次定义', icon: FSM_ICONS.clock },
        { group: 'SLA管理' },
        { href: 'fsm/fsm-sla.html', label: 'SLA配置', icon: FSM_ICONS.clock },
        { group: '共享主数据' },
        { href: 'master-data/master-data-list.html?product=fsm&module=customers', label: '客户管理', icon: '<svg viewBox="0 0 24 24"><path d="M3 21v-8a4 4 0 014-4h10a4 4 0 014 4v8"/><circle cx="12" cy="5" r="3"/></svg>' },
        { href: 'master-data/master-data-list.html?product=fsm&module=contacts', label: '客户联系人管理', icon: '<svg viewBox="0 0 24 24"><path d="M16 11a4 4 0 10-8 0"/><path d="M4 21a8 8 0 0116 0"/><path d="M18 8h4M20 6v4"/></svg>' },
        { href: 'master-data/master-data-list.html?product=fsm&module=contracts', label: '合同管理', icon: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/></svg>' },
        { href: 'master-data/master-data-list.html?product=fsm&module=tokens', label: 'Token 管理', icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M8 12h8"/></svg>' },
        { href: 'master-data/master-data-list.html?product=fsm&module=sites', label: '服务网点', icon: '<svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>' },
        { href: 'master-data/master-data-list.html?product=fsm&module=teams', label: '团队管理', icon: '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/></svg>' },
        { href: 'master-data/master-data-list.html?product=fsm&module=users', label: '用户管理', icon: '<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' },
        { href: 'fsm/fsm-time-management.html', label: '时间管理', icon: FSM_ICONS.calendar },
        { href: 'master-data/approval-config-list.html?product=fsm', label: '审批配置', icon: '<svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>' },
        { group: '系统设置' },
        { href: 'fsm/fsm-templates.html', label: '工单模板', icon: FSM_ICONS.layers },
        { href: 'fsm/fsm-job-templates.html', label: '作业模板', icon: FSM_ICONS.list },
        { href: 'fsm/fsm-bank-accounts.html', label: '银行账户', icon: FSM_ICONS.card },
        { href: 'fsm/fsm-certificate-types.html', label: '证书类型', icon: FSM_ICONS.tag }
      ]
    },
    {
      id: 'pms', label: 'PMS', color: '#0D9488', position: 'top', solutionOnly: true,
      icon: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M8 7v10M12 7v7M16 7v13"/></svg>',
      items: [
        { group: '工作台' },
        { href: 'pms/pms-workspace.html', label: '我的工作台', icon: '<svg viewBox="0 0 24 24"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></svg>' },
        { group: '项目交付' },
        { href: 'pms/pms-overview.html', label: '组合报表', icon: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M8 7v10M12 7v7M16 7v13"/></svg>' },
        { href: 'pms/pms-projects.html', label: '项目列表', icon: '<svg viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>' },
        { href: 'pms/pms-tasks.html', label: '任务管理', icon: '<svg viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>' },
        { href: 'pms/pms-deliverables.html', label: '交付物管理', icon: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-6M9 15l3 3 3-3"/></svg>' },
        { href: 'pms/pms-reports.html', label: '项目报告', icon: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/></svg>' },
        { href: 'pms/pms-acceptance.html', label: '验收与关闭', icon: '<svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>' },
        { group: '共享主数据' },
        { href: 'master-data/master-data-list.html?product=pms&module=customers', label: '客户管理', icon: '<svg viewBox="0 0 24 24"><path d="M3 21v-8a4 4 0 014-4h10a4 4 0 014 4v8"/><circle cx="12" cy="5" r="3"/></svg>' },
        { href: 'master-data/master-data-list.html?product=pms&module=contacts', label: '客户联系人管理', icon: '<svg viewBox="0 0 24 24"><path d="M16 11a4 4 0 10-8 0"/><path d="M4 21a8 8 0 0116 0"/><path d="M18 8h4M20 6v4"/></svg>' },
        { href: 'master-data/master-data-list.html?product=pms&module=contracts', label: '合同管理', icon: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/></svg>' },
        { href: 'master-data/master-data-list.html?product=pms&module=sites', label: '服务网点', icon: '<svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>' },
        { href: 'master-data/master-data-list.html?product=pms&module=teams', label: '团队管理', icon: '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/></svg>' },
        { href: 'master-data/master-data-list.html?product=pms&module=users', label: '用户管理', icon: '<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' },
        { href: 'fsm/fsm-time-management.html', label: '时间管理', icon: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' },
        { href: 'master-data/approval-config-list.html?product=pms', label: '审批配置', icon: '<svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>' },
        { group: '治理与配置' },
        { href: 'pms/pms-audit.html', label: '审计日志', icon: '<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' },
        { href: 'pms/pms-settings.html', label: '配置中心', icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.6V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9c.26.46.4.98.41 1.51h.09a2 2 0 010 4h-.09c-.01.53-.15 1.05-.41 1.51z"/></svg>' }
      ]
    },
    {
      id: 'ai', label: 'AI', color: '#EC4899', position: 'bottom',
      icon: '<svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 017 7v1h1a2 2 0 012 2v1a2 2 0 01-2 2h-1a7 7 0 01-14 0H4a2 2 0 01-2-2v-1a2 2 0 012-2h1V9a7 7 0 017-7z"/><circle cx="9" cy="10" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r="1" fill="currentColor" stroke="none"/><path d="M9 14h6"/></svg>',
      items: [
        { href: 'ai/ai-governance.html', label: 'AI 治理', roles: ['u3', 'u4', 'pm', 'bm'], icon: '<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' },
        { href: 'ai/ai-platform.html', label: 'AI 平台', roles: ['u3', 'u4'], icon: '<svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/></svg>' },
        { href: 'ai/ai-billing.html', label: 'AI 计费中心', roles: ['u3', 'u4', 'pm', 'bm'], icon: '<svg viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>' }
      ]
    },
    {
      id: 'org', label: '组织', color: '#6366F1', position: 'bottom',
      icon: '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>',
      items: [
        { href: 'org/tenant-management.html', label: '租户管理', icon: '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>' },
        { href: 'org/product-management.html', label: '产品管理', icon: '<svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>' },
        { href: 'org/license-management.html', label: '授权管理', icon: '<svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>' },
        { href: 'org/role-management.html', label: '角色管理', icon: '<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' },
        { href: 'org/org-structure.html', label: '组织架构', icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="3"/><path d="M12 8v4"/><path d="M6 16h12"/><path d="M6 16v4M18 16v4M12 12v4M12 16v4"/></svg>' }
      ]
    },
    {
      id: 'settings', label: '设置', color: '#6B7280', position: 'bottom',
      icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.6V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9c.26.46.4.98.41 1.51h.09a2 2 0 010 4h-.09c-.01.53-.15 1.05-.41 1.51z"/></svg>',
      items: [
        { href: 'settings/general-settings.html', label: '通用设置', icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 0"/></svg>' },
        { href: 'settings/personal-info.html', label: '个人信息', icon: '<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' },
        { href: 'settings/third-party.html', label: '三方对接', icon: '<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>' },
        { href: 'settings/sync-management.html', label: '同步管理', icon: '<svg viewBox="0 0 24 24"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10"/><path d="M20.49 15a9 9 0 01-14.85 3.36L1 14"/></svg>' },
        { href: 'settings/ai-settings.html', label: 'AI 访问设置', icon: '<svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 017 7v1h1a2 2 0 012 2v1a2 2 0 01-2 2h-1a7 7 0 01-14 0H4a2 2 0 01-2-2v-1a2 2 0 012-2h1V9a7 7 0 017-7z"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/></svg>' },
        { group: 'AI 平台' },
        { href: 'ai/ai-governance.html', label: 'AI 治理', roles: ['u3', 'u4', 'pm', 'bm'], icon: '<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' },
        { href: 'ai/ai-platform.html', label: 'AI 平台', roles: ['u3', 'u4'], icon: '<svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/></svg>' },
        { href: 'ai/ai-billing.html', label: 'AI 计费中心', roles: ['u3', 'u4', 'pm', 'bm'], icon: '<svg viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>' }
      ]
    }
  ];

  // AI 入口菜单保持与 ems-driven-by-ai 一致。
  // 标准产品的完整菜单由 solution/ 外壳承载，避免 AI 入口误显示标品能力。
  var AI_DOMAIN_ITEMS = {
    itsm: [
      { href: 'itsm/ai-itsm-incidents.html', label: '事件管理' },
      { href: 'itsm/ai-change-impact.html', label: '变更管理' },
      { href: 'itsm/ai-service-request.html', label: '服务请求' }
    ],
    itam: [
      { href: 'itam/ai-itam-overview.html', label: '资产概览' },
      { href: 'itam/ai-itam-asset-ledger.html', label: '资产台账' },
      { href: 'itam/ai-itam-contracts.html', label: '合同管理' },
      { href: 'itam/ai-itam-inventory.html', label: '库存盘点' }
    ],
    fsm: [
      { href: 'fsm/ai-fsm-dispatch.html', label: '现场派工' }
    ],
    pms: [
      { href: 'pms/pms-overview.html', label: '组合报表' },
      { href: 'pms/pms-projects.html', label: '项目列表' },
      { href: 'pms/pms-timesheets.html', label: '工时管理' },
      { href: 'pms/pms-reports.html', label: '项目报告' }
    ]
  };

  var EMS_SCENE_MENU_KEY = 'ems-business-scenarios-v1';
  var EMS_BUILTIN_DEFAULT_SCENE = {
    id:'scene-default', name:'默认场景', description:'常用统一纳管入口', status:'published', tenantId:'all', builtin:true, defaultHref:'ump/overview.html', items:[
      { id:'default-ump-overview', label:'UMP 总览', href:'ump/overview.html', builtin:true },
      { id:'default-ump-assets', label:'资产管理', href:'ump/assets.html', builtin:true },
      { id:'default-ump-service', label:'服务运营', href:'ump/service-ops.html', builtin:true },
      { id:'default-ump-field', label:'现场服务', href:'ump/field-service.html', builtin:true },
      { id:'default-ump-projects', label:'项目与交付', href:'ump/projects.html', builtin:true }
    ]
  };
  var EMS_DEFAULT_SCENES = [
    EMS_BUILTIN_DEFAULT_SCENE,
    { id:'scene-alert', name:'告警处置', description:'从告警分析到事件处置与治理放行', status:'published', defaultHref:'itom/alert-list.html', items:[
      { id:'scene-alert-analyze', label:'告警分析', href:'itom/alert-list.html' },
      { id:'scene-alert-ticket', label:'告警转工单', href:'itom/alert-to-incident.html' },
      { id:'scene-alert-incident', label:'事件处理', href:'itsm/itsm-incidents.html' },
      { id:'scene-alert-change', label:'变更与问题', href:'itsm/itsm-changes.html' },
      { id:'scene-alert-govern', label:'AI 治理放行', href:'ai/ai-governance.html?sub=t1' }
    ]}
  ];

  function _loadBusinessScenarios() {
    try {
      var saved = JSON.parse(localStorage.getItem(EMS_SCENE_MENU_KEY) || 'null');
      var scenes = Array.isArray(saved) ? saved : JSON.parse(JSON.stringify(EMS_DEFAULT_SCENES));
      if (!scenes.some(function (scene) { return scene.id === 'scene-default'; })) {
        scenes.unshift(JSON.parse(JSON.stringify(EMS_BUILTIN_DEFAULT_SCENE)));
        localStorage.setItem(EMS_SCENE_MENU_KEY, JSON.stringify(scenes));
      }
      var defaultIndex = scenes.findIndex(function (scene) { return scene.id === 'scene-default'; });
      if (defaultIndex > 0) scenes.unshift(scenes.splice(defaultIndex, 1)[0]);
      scenes.forEach(function (scene) {
        if (scene.id === 'scene-default') {
          scene.builtin = true;
          EMS_BUILTIN_DEFAULT_SCENE.items.forEach(function (required) {
            if (!(scene.items || []).some(function (item) { return item.href === required.href; })) {
              scene.items = scene.items || [];
              scene.items.push(JSON.parse(JSON.stringify(required)));
            }
          });
          (scene.items || []).forEach(function (item) { if (/^default-ump-/.test(item.id)) item.builtin = true; });
        }
      });
      localStorage.setItem(EMS_SCENE_MENU_KEY, JSON.stringify(scenes));
      return scenes;
    } catch (e) { return EMS_DEFAULT_SCENES; }
  }

  function _saveBusinessScenarios(scenes) {
    try { localStorage.setItem(EMS_SCENE_MENU_KEY, JSON.stringify(scenes)); } catch (e) {}
  }

  function _businessScenarioMenuItems() {
    var items = [
      { href:'settings/business-scenarios.html', label:'场景管理' }
    ];
    _loadBusinessScenarios().filter(function (scene) { return scene.status === 'published'; }).forEach(function (scene) {
      items.push({ group: scene.name });
      (scene.items || []).filter(function (item) { return item.enabled !== false; }).forEach(function (item) {
        items.push({ href:item.href, label:item.label, sceneId:scene.id });
      });
    });
    return items;
  }

  function _menuItemsForDomain(domain) {
    if (domain.id === 'scenarios') return _businessScenarioMenuItems();
    return !solutionContext && AI_DOMAIN_ITEMS[domain.id] ? AI_DOMAIN_ITEMS[domain.id] : domain.items;
  }

  function _dsDomainVisible(domain) {
    return !domain.solutionOnly || solutionContext;
  }

  // ─── TENANTS DATA ──────────────────────────────────────────────────
  var DS_TENANTS = [
    { name: '全部租户（MSP视角）' },
    { name: '周大福（CTF）' },
    { name: '达美乐（Domino）', active: true },
    { name: '广发证券' },
    { name: '香港美心MX' }
  ];
  var DS_ACTIVE_TENANT_KEY = 'ems-active-tenant';

  function _dsActiveTenantName() {
    try {
      var saved = localStorage.getItem(DS_ACTIVE_TENANT_KEY) || '';
      var legacy = { DEV:'达美乐（Domino）', tdengine:'周大福（CTF）', Test123456:'广发证券', mx:'香港美心MX' };
      saved = legacy[saved] || saved;
      return DS_TENANTS.some(function (tenant) { return tenant.name === saved; }) ? saved : '达美乐（Domino）';
    } catch (e) { return '达美乐（Domino）'; }
  }

  function applyAgentLicenseVisibility() {
    var tenant = _dsActiveTenantName();
    var unlicensed = tenant === '香港美心MX';
    document.querySelectorAll('[data-agent-license="fsm-dispatch"]').forEach(function (el) {
      el.style.display = unlicensed ? 'none' : '';
    });
    document.querySelectorAll('.ai-quick-card').forEach(function (el) {
      var text = el.textContent || '';
      var isDispatchAction = /派工推荐|工程师匹配|路线规划|路线优化|负载均衡/.test(text);
      if (isDispatchAction) el.style.display = unlicensed ? 'none' : '';
    });
  }
  function syncTenantSwitcherDisplay(event) {
    var tenant = event && event.detail && event.detail.tenant ? event.detail.tenant : _dsActiveTenantName();
    var btn = document.getElementById('railTenantBtn');
    if (btn) btn.innerHTML = tenant.charAt(0).toUpperCase() + '<span class="domain-tooltip">租户: ' + tenant + '</span>';
    document.querySelectorAll('#railTenantList .rail-t-item').forEach(function (item) {
      var name = item.querySelector('.rail-t-name');
      item.classList.toggle('active', !!name && name.textContent === tenant);
    });
  }
  window.EMS_APPLY_AGENT_LICENSE_VISIBILITY = applyAgentLicenseVisibility;
  window.addEventListener('ems:tenant-change', applyAgentLicenseVisibility);
  window.addEventListener('ems:tenant-change', syncTenantSwitcherDisplay);

  // ─── DOMAIN SWITCHER: Auto-detect domain from activeMenu ──────────
  var _dsCurrentDomain = 'workspace';
  var _dsPanelCollapsed = false;
  var _dsScrollPrefix = 'ems-standard-domain-panel-scroll:';
  var _dsActiveDomainKey = 'ems-standard-domain-active';

  function _dsPanelScrollKey(domainId) {
    return _dsScrollPrefix + (solutionContext ? 'solution:' : 'ai:') + domainId;
  }

  function _dsSavePanelScroll(domainId) {
    var body = document.getElementById('dsPanelBody');
    var id = domainId || _dsCurrentDomain;
    try {
      sessionStorage.setItem(_dsActiveDomainKey, id);
      if (body) sessionStorage.setItem(_dsPanelScrollKey(id), String(body.scrollTop || 0));
    } catch (e) {}
  }

  function _dsRestorePanelScroll(domainId) {
    var body = document.getElementById('dsPanelBody');
    if (!body) return;
    var top = 0;
    try {
      var raw = sessionStorage.getItem(_dsPanelScrollKey(domainId));
      if (raw !== null) top = parseInt(raw, 10) || 0;
    } catch (e) {}
    setTimeout(function () { body.scrollTop = top; }, 0);
  }

  window.dsRememberMenuState = function (domainId) {
    _dsSavePanelScroll(domainId);
    try { sessionStorage.setItem('ems-last-domain', domainId); } catch (e) {}
  };

  function _dsFindDomainByHref(href) {
    var preferred = '';
    try { preferred = sessionStorage.getItem('ems-last-domain') || ''; } catch (e) {}
    if (preferred === 'scenarios' && String(href || '').split('?')[0] === 'portal/access-denied.html') return 'scenarios';
    if (preferred) {
      for (var p = 0; p < DS_DOMAINS.length; p++) {
        if (DS_DOMAINS[p].id !== preferred || !_dsDomainVisible(DS_DOMAINS[p])) continue;
        var preferredItems = _menuItemsForDomain(DS_DOMAINS[p]);
        for (var pi = 0; pi < preferredItems.length; pi++) {
          if (preferredItems[pi].href && preferredItems[pi].href.split('?')[0] === String(href || '').split('?')[0]) return preferred;
        }
      }
    }
    // 标品域（solutionOnly）可见时优先精确匹配，避免场景菜单复用标品 href 时抢占标品域高亮
    var i, j, d;
    for (var pass = 0; pass < 2; pass++) {
      for (i = 0; i < DS_DOMAINS.length; i++) {
        d = DS_DOMAINS[i];
        if (!_dsDomainVisible(d)) continue;
        if ((pass === 0) !== !!d.solutionOnly) continue;
        var domainItems = _menuItemsForDomain(d);
        for (j = 0; j < domainItems.length; j++) {
          if (domainItems[j].href && domainItems[j].href.split('?')[0] === String(href || '').split('?')[0]) return d.id;
        }
      }
    }
    // 下钻页兜底：按路径前缀归属域（如 cmdb/cmdb-v2-ci-detail.html → cmdb 面板）
    var m = String(href || '').match(/^([a-z]+)\//);
    if (m) {
      for (var k = 0; k < DS_DOMAINS.length; k++) {
        if (DS_DOMAINS[k].id === m[1] && _dsDomainVisible(DS_DOMAINS[k])) return m[1];
      }
    }
    return 'workspace';
  }

  // ─── DOMAIN SWITCHER: Render ──────────────────────────────────────
  function renderDomainSwitcher() {
    _dsCurrentDomain = _dsFindDomainByHref(activeMenu);
    document.body.classList.add('ds-active');

    // Create domain rail
    var rail = document.createElement('nav');
    rail.className = 'domain-rail';
    rail.id = 'domainRail';
    document.body.appendChild(rail);

    // Create domain panel
    var panel = document.createElement('div');
    panel.className = 'domain-panel';
    panel.id = 'domainPanel';
    panel.innerHTML = '<div class="domain-panel-header"><div class="domain-panel-title" id="dsPanelTitle"></div><button class="domain-panel-collapse" onclick="dsPanelToggle()" title="收起"><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></button></div><div class="domain-panel-body" id="dsPanelBody"></div>';
    document.body.appendChild(panel);

    // Create tenant switcher
    var tenant = document.createElement('div');
    tenant.className = 'rail-tenant';
    tenant.id = 'railTenant';
    var activeTenantName = _dsActiveTenantName();
    var activeTenant = DS_TENANTS.filter(function (t) { return t.name === activeTenantName; })[0] || DS_TENANTS.filter(function (t) { return t.active; })[0] || DS_TENANTS[0];
    var tListHtml = '';
    DS_TENANTS.forEach(function (t) {
      var cls = t.name === activeTenant.name ? ' active' : '';
      tListHtml += '<div class="rail-t-item' + cls + '" onclick="dsRailSwitchTenant(\'' + t.name.replace(/'/g, "\\'") + '\',this,event)"><div class="rail-t-avatar">' + t.name.charAt(0).toUpperCase() + '</div><div class="rail-t-name">' + t.name + '</div><span class="rail-t-check"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></div>';
    });
    tenant.innerHTML = '<button class="rail-tenant-btn" id="railTenantBtn" onclick="dsRailToggleTenant(event)" title="切换租户">' + activeTenant.name.charAt(0).toUpperCase() + '<span class="domain-tooltip">租户: ' + activeTenant.name + '</span></button><div class="rail-tenant-dropdown" id="railTenantDropdown"><input type="text" class="rt-search" placeholder="搜索租户…" oninput="dsRailFilterTenants(this.value)" onclick="event.stopPropagation()"><div class="rail-tenant-list" id="railTenantList">' + tListHtml + '</div></div>';
    document.body.appendChild(tenant);

    // Initial render
    _dsRenderRail();
    _dsRenderPanel();

    // Auto-collapse panel for single-item domains. Business scenarios are
    // generated at runtime and must stay expanded while users move between pages.
    var curDomain = null;
    for (var k = 0; k < DS_DOMAINS.length; k++) {
      if (DS_DOMAINS[k].id === _dsCurrentDomain) { curDomain = DS_DOMAINS[k]; break; }
    }
    var curDomainItems = curDomain ? _menuItemsForDomain(curDomain).filter(function (item) { return item.href; }) : [];
    if (curDomain && curDomain.id !== 'scenarios' && curDomainItems.length <= 1) {
      _dsPanelCollapsed = true;
      document.getElementById('domainPanel').classList.add('collapsed');
      document.body.classList.add('ds-panel-collapsed');
    }

    // Domain rail JS tooltip (CSS tooltip clipped by overflow-x:hidden)
    var tip = document.createElement('div');
    tip.className = 'sidebar-tooltip';
    document.body.appendChild(tip);
    rail.addEventListener('mouseover', function (e) {
      var icon = e.target.closest('.domain-icon');
      if (!icon || icon.classList.contains('active')) { tip.classList.remove('visible'); return; }
      var ttSpan = icon.querySelector('.domain-tooltip');
      if (!ttSpan) { tip.classList.remove('visible'); return; }
      var rect = icon.getBoundingClientRect();
      tip.textContent = ttSpan.textContent;
      tip.style.left = rect.right + 6 + 'px';
      tip.style.top = rect.top + rect.height / 2 + 'px';
      tip.style.transform = 'translateY(-50%)';
      tip.classList.add('visible');
    });
    rail.addEventListener('mouseout', function (e) {
      var related = e.relatedTarget;
      if (!related || !related.closest || !related.closest('.domain-icon')) {
        tip.classList.remove('visible');
      }
    });
  }

  function _dsRenderRail() {
    var el = document.getElementById('domainRail');
    if (!el) return;
    var topHtml = '', bottomHtml = '';
    DS_DOMAINS.forEach(function (d) {
      if (!_dsDomainVisible(d)) return;
      var activeClass = d.id === _dsCurrentDomain ? ' active' : '';
      var colorStyle = d.id === _dsCurrentDomain ? 'color:' + d.color : '';
      var btn = '<button class="domain-icon' + activeClass + '" onclick="dsSelectDomain(\'' + d.id + '\')" style="' + colorStyle + '"><span style="width:20px;height:20px;display:flex;align-items:center;justify-content:center">' + d.icon + '</span><span class="domain-tooltip">' + d.label + '</span></button>';
      if (d.position === 'bottom') bottomHtml += btn;
      else topHtml += btn;
    });
    el.innerHTML = '<button class="rail-launcher-btn" onclick="toggleAppLauncher(event)" title="应用启动器"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg></button><div class="rail-sep"></div><div class="domain-rail-top">' + topHtml + '</div>' + (bottomHtml ? '<div class="domain-rail-bottom">' + bottomHtml + '</div>' : '');
    i18nRefresh(el);
  }

  /* 角色菜单过滤（06 §P4 三层过滤 · L2 角色菜单集 · 2026-08-19 原型实现：菜单项可带 roles 字段，空=全部角色可见；菜单/按钮权限配置归属 EMS 角色管理 org/role-management.html，2026-08-20 评审确认不另设页面） */
  var _menuRole = function () { return localStorage.getItem('ems-role-demo') || 'u1'; };
  var _roleVisible = function (item) { return !item.roles || item.roles.indexOf(_menuRole()) >= 0; };

  function _dsRenderPanel() {
    var domain = null;
    for (var i = 0; i < DS_DOMAINS.length; i++) {
      if (DS_DOMAINS[i].id === _dsCurrentDomain) { domain = DS_DOMAINS[i]; break; }
    }
    if (!domain) return;
    var titleEl = document.getElementById('dsPanelTitle');
    if (titleEl) { titleEl.textContent = domain.label; titleEl.style.color = domain.color; }
    var body = document.getElementById('dsPanelBody');
    if (!body) return;
    var html = '';
    _menuItemsForDomain(domain).forEach(function (item) {
      if (!_roleVisible(item)) return;
      if (item.group) {
        html += '<div class="dp-group-label">' + item.group + '</div>';
        return;
      }
      var isPlanned = item.status === 'planned' || item.status === 'dev';
      var href = (item.href && !isPlanned) ? (basePath + item.href) : 'javascript:void(0)';
      var isActive = item.href === activeMenu;
      var cls = isActive ? ' active' : '';
      if (isPlanned) cls += ' planned';
      var iconHtml = item.icon ? '<span style="display:flex;align-items:center;justify-content:center">' + item.icon + '</span>' : '';
      var todoCounts = { u1: 8, u2: 7, u3: 5, u4: 3, uf: 10, um: 6, pm: 5, bm: 6 };
      var todoRole = localStorage.getItem('ems-role-demo') || 'u1';
      var savedTodoCount = localStorage.getItem('ems-work-queue-count:' + todoRole);
      var todoCount = savedTodoCount === null ? (todoCounts[todoRole] || 0) : Number(savedTodoCount);
      var badge = isPlanned ? '<span class="dp-item-badge">' + (item.status === 'dev' ? '待开发' : '规划中') + '</span>' : (item.todoBadge ? '<span class="dp-badge" title="待处理 ' + todoCount + ' 条">' + todoCount + '</span>' : '');
      var contextAttr = '';
      if (item.href && /^(itsm|fsm|itam|pms)\//.test(item.href)) {
        var context = solutionContext ? 'solution' : 'ai';
        contextAttr = ' onclick="dsRememberMenuState(\'' + domain.id + '\');try{sessionStorage.setItem(\'ems-menu-context\',\'' + context + '\')}catch(e){}"';
      } else if (item.href) {
        contextAttr = ' onclick="dsRememberMenuState(\'' + domain.id + '\')"';
      }
      html += '<a class="dp-item' + cls + '"' + contextAttr + ' href="' + href + '">' + iconHtml + '<span>' + item.label + '</span>' + badge + '</a>';
    });
    body.innerHTML = html;
    i18nRefresh(body);
    if (!body.__dsScrollBound) {
      body.__dsScrollBound = true;
      body.addEventListener('scroll', function () { _dsSavePanelScroll(); });
    }
    _dsRestorePanelScroll(domain.id);
  }

  // ─── DOMAIN SWITCHER: Global Functions ─────────────────────────────
  window.dsSelectDomain = function (domainId) {
    _dsSavePanelScroll(_dsCurrentDomain);
    // If domain has only 1 item, navigate directly instead of showing panel
    for (var i = 0; i < DS_DOMAINS.length; i++) {
      if (!_dsDomainVisible(DS_DOMAINS[i])) continue;
      var items = _menuItemsForDomain(DS_DOMAINS[i]);
      if (DS_DOMAINS[i].id === domainId && items.length === 1 && items[0].href) {
        window.location.href = basePath + items[0].href;
        return;
      }
    }
    _dsCurrentDomain = domainId;
    if (_dsPanelCollapsed) {
      _dsPanelCollapsed = false;
      document.getElementById('domainPanel').classList.remove('collapsed');
      document.body.classList.remove('ds-panel-collapsed');
    }
    _dsRenderRail();
    _dsRenderPanel();
  };

  window.dsPanelToggle = function () {
    _dsPanelCollapsed = !_dsPanelCollapsed;
    document.getElementById('domainPanel').classList.toggle('collapsed', _dsPanelCollapsed);
    document.body.classList.toggle('ds-panel-collapsed', _dsPanelCollapsed);
  };

  window.dsRailToggleTenant = function (e) {
    e.stopPropagation();
    var dd = document.getElementById('railTenantDropdown');
    if (!dd) return;
    dd.classList.toggle('open');
    if (dd.classList.contains('open')) {
      var btn = document.getElementById('railTenantBtn');
      var r = btn.getBoundingClientRect();
      dd.style.left = (r.right + 8) + 'px';
      dd.style.bottom = (window.innerHeight - r.bottom) + 'px';
      dd.style.top = 'auto';
    }
  };

  window.dsRailFilterTenants = function (q) {
    q = q.trim().toLowerCase();
    document.querySelectorAll('#railTenantList .rail-t-item').forEach(function (el) {
      var name = el.querySelector('.rail-t-name').textContent.toLowerCase();
      el.style.display = name.indexOf(q) !== -1 ? '' : 'none';
    });
  };

  window.dsRailSwitchTenant = function (name, el, e) {
    e.stopPropagation();
    document.querySelectorAll('#railTenantList .rail-t-item').forEach(function (i) { i.classList.remove('active'); });
    el.classList.add('active');
    var btn = document.getElementById('railTenantBtn');
    var letter = name.charAt(0).toUpperCase();
    btn.innerHTML = letter + '<span class="domain-tooltip">租户: ' + name + '</span>';
    document.getElementById('railTenantDropdown').classList.remove('open');
    try { localStorage.setItem(DS_ACTIVE_TENANT_KEY, name); } catch (err) {}
    try { window.dispatchEvent(new CustomEvent('ems:tenant-change', { detail: { tenant: name } })); } catch (err) {}
    if (typeof showToast === 'function') showToast('已切换到租户: ' + name);
  };

  document.addEventListener('click', function (e) {
    if (!e.target.closest('#railTenant')) {
      var dd = document.getElementById('railTenantDropdown');
      if (dd) dd.classList.remove('open');
    }
  });

  // ─── LEGACY SIDEBAR (for demo pages) ──────────────────────────────
  function renderSidebar() {
    var el = document.getElementById('sidebar');
    if (!el) return;
    var html = '<button class="sidebar-toggle" onclick="toggleSidebar()" title="展开/收起菜单"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M13 17l5-5-5-5M6 17l5-5-5-5"/></svg></button>';
    MENU_ITEMS.forEach(function (item) {
      if (!_roleVisible(item)) return;
      if (item.type === 'group') {
        html += '<div class="sidebar-group">' + item.label + '</div>';
      } else {
        var active = (item.href === activeMenu) ? ' active' : '';
        var todoCounts = { u1: 8, u2: 7, u3: 5, u4: 3, uf: 10, um: 6, pm: 5, bm: 6 };
        var todoRole = localStorage.getItem('ems-role-demo') || 'u1';
        var savedTodoCount = localStorage.getItem('ems-work-queue-count:' + todoRole);
        var todoCount = savedTodoCount === null ? (todoCounts[todoRole] || 0) : Number(savedTodoCount);
        var todoBadge = item.todoBadge ? '<span class="sidebar-todo-badge">' + todoCount + '</span>' : '';
        html += '<a class="sidebar-item' + active + '" href="' + basePath + item.href + '" title="' + item.label + '"><span class="s-icon">' + item.icon + '</span><span class="s-label">' + item.label + '</span>' + todoBadge + '</a>';
      }
    });
    // Tenant switcher
    var legacyTenant = _dsActiveTenantName();
    html += '<div class="org-switcher" onclick="toggleTenantDropdown(event)"><div class="org-avatar">' + legacyTenant.charAt(0) + '</div><div class="org-info"><div class="org-name">' + legacyTenant + '</div></div><div class="org-switch-icon"><svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5"/><path d="M4 20L21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/></svg></div><div class="tenant-dropdown" id="tenantDropdown"><input type="text" class="tenant-search" placeholder="查询租户名称" oninput="filterTenants(this.value)" onclick="event.stopPropagation()"><div class="tenant-list" id="tenantList">' + DS_TENANTS.map(function(t){return '<div class="tenant-item'+(t.name===legacyTenant?' active':'')+'" onclick="switchTenant(\''+t.name+'\',this,event)"><div class="t-avatar">'+t.name.charAt(0)+'</div><div class="t-name">'+t.name+'</div></div>';}).join('') + '</div></div></div>';
    el.innerHTML = html;
    i18nRefresh(el);
  }

  // ─── HEADER ────────────────────────────────────────────────────────
  function renderHeader() {
    var el = document.getElementById('emsHeader');
    if (!el) return;
    var bcHtml = '<span class="current">EMS NEO</span>';
    window.EMS_BASE = basePath;
    var _role = localStorage.getItem('ems-role-demo') || 'u1';
    var _roleLabels = { u1: 'U1 一线运维', u2: 'U2 专业技术', u3: 'U3 IT 中层', u4: 'U4 领导层', uf: 'SMB U-Frontline', um: 'SMB U-Manager 管理复合', pm: 'PM 项目经理', bm: 'BM 业务经理' };
    var _roleSwHtml = '<div class="role-sw" id="roleSw"><button class="role-sw-btn" id="roleSwBtn" onclick="toggleRoleMenu(event)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:14px;height:14px;flex-shrink:0"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><span id="roleSwLabel">' + (_roleLabels[_role] || 'U1 一线运维') + '</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:11px;height:11px;flex-shrink:0"><polyline points="6 9 12 15 18 9"/></svg></button><div class="role-sw-menu" id="roleSwMenu" style="display:none"><div class="role-sw-menu-title">角色切换（原型演示 · 生产由 RBAC 角色决定 · 05 §P6 · 2026-08-19 新增 PM/BM）</div><div class="role-sw-opt' + (_role === 'u1' ? ' active' : '') + '" onclick="switchRole(\'u1\')"><span>U1 一线运维工程师</span><em>我的待办 · 全类型队列</em></div><div class="role-sw-opt' + (_role === 'u2' ? ' active' : '') + '" onclick="switchRole(\'u2\')"><span>U2 专业技术工程师</span><em>排查队列 · RCA 分析台</em></div><div class="role-sw-opt' + (_role === 'u3' ? ' active' : '') + '" onclick="switchRole(\'u3\')"><span>U3 IT 中层</span><em>Governance Console · 审批与治理</em></div><div class="role-sw-opt' + (_role === 'u4' ? ' active' : '') + '" onclick="switchRole(\'u4\')"><span>U4 领导层</span><em>Dashboard · 导出报表（不进治理面板）</em></div><div class="role-sw-opt' + (_role === 'uf' ? ' active' : '') + '" onclick="switchRole(\'uf\')"><span>SMB U-Frontline 一线复合</span><em>合并视图 · 不切角色</em></div><div class="role-sw-opt' + (_role === 'um' ? ' active' : '') + '" onclick="switchRole(\'um\')"><span>SMB U-Manager 管理复合</span><em>中层+领导合并 · 审批/账单</em></div><div class="role-sw-opt' + (_role === 'pm' ? ' active' : '') + '" onclick="switchRole(\'pm\')"><span>PM 项目经理</span><em>项目事件 · 工时/报告审批（06 §P2 · 工作台）</em></div><div class="role-sw-opt' + (_role === 'bm' ? ' active' : '') + '" onclick="switchRole(\'bm\')"><span>BM 业务经理</span><em>商务/合同审批 · SLA（06 §P2 · 工作台）</em></div></div></div>';
    var routeProduct = (new URLSearchParams(window.location.search).get('product') || '').toLowerCase();
    var isProductRoute = /^(itsm|fsm|itam|pms)\//.test(activeMenu || '');
    var isProductHeader = isProductRoute || ['itsm', 'fsm', 'itam', 'pms'].indexOf(routeProduct) >= 0 || ['itsm', 'fsm', 'itam', 'pms'].indexOf(_dsCurrentDomain) >= 0;
    var commonLeft = '<div class="header-left"><div class="logo-area"><div class="logo-mark"><img src="' + basePath + 'assets/itom-logo.png" alt="EMS NEO"></div></div><nav class="header-breadcrumb">' + bcHtml + '</nav></div>';
    if (isProductHeader) {
      el.classList.add('product-header');
      el.innerHTML = commonLeft + '<div class="header-right"><a class="platform-action" href="' + basePath + 'approval/approval-center.html" aria-label="审批中心，4条待审批"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg><span>审批中心</span></a><a class="platform-action" href="' + basePath + 'portal/work-queue.html" aria-label="待办中心，1条新待办"><svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h10M4 18h8"/></svg><span class="platform-badge">1</span><span>待办中心</span></a><button class="platform-action" type="button" aria-label="打开协作消息"><svg viewBox="0 0 24 24"><path d="M21 15a4 4 0 01-4 4H8l-5 3 2-5a7 7 0 01-2-5 7 7 0 017-7h7a4 4 0 014 4z"/></svg><span>协作消息</span></button><button class="platform-action primary" type="button" aria-label="打开页面构建器"><span>页面构建器</span><svg viewBox="0 0 24 24"><path d="M14 6l4 4M12 8l4 4M4 20l5-1 10-10-4-4L5 15z"/></svg></button><button class="header-icon-btn" type="button" aria-label="编辑当前页面" title="编辑当前页面"><svg viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L8 18l-4 1 1-4z"/></svg></button><button class="platform-menu-btn" type="button">菜单</button><button class="header-icon-btn" type="button" aria-label="帮助" title="帮助"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.5 2.5 0 114.2 1.8c-1 .7-2 1.2-2 2.7M12 17h.01"/></svg></button><div class="user-wrapper"><button class="user-area" aria-label="用户 Admin"><div class="user-avatar">A</div></button></div></div>';
    } else {
      el.classList.remove('product-header');
      el.innerHTML = commonLeft + '<div class="header-center"><div class="cmd-trigger" onclick="openCmd()"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><span>Ask NEO Agent · 搜索设备、告警、工单…</span><span class="shortcut">⌘K</span></div></div><div class="header-right"><button class="header-icon-btn" id="headerFavBtn" onclick="toggleFavCurrentPage()" title="收藏当前页面"><svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></button><div class="lang-switcher" id="langSwitcher"><button class="header-icon-btn" title="语言切换" onclick="toggleLangMenu()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg></button><div class="lang-menu" id="langMenu"><div class="lang-option' + (currentLang === 'zh-CN' ? ' active' : '') + '" data-lang-code="zh-CN" onclick="switchLang(\'zh-CN\',this)">简体中文</div><div class="lang-option' + (currentLang === 'zh-TW' ? ' active' : '') + '" data-lang-code="zh-TW" onclick="switchLang(\'zh-TW\',this)">繁體中文</div><div class="lang-option' + (currentLang === 'en' ? ' active' : '') + '" data-lang-code="en" onclick="switchLang(\'en\',this)">English</div></div></div><button class="header-icon-btn" title="暗色/亮色模式" onclick="toggleTheme()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg></button><button class="header-icon-btn" title="全屏" onclick="toggleFullscreen()"><svg viewBox="0 0 24 24"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg></button>' + _roleSwHtml + '<div class="header-sep"></div><div class="user-wrapper"><button class="user-area"><div class="user-avatar">A</div><span>Admin</span></button></div></div>';
    }
    var copilotTrigger = el.querySelector('.cmd-trigger span:not(.shortcut)');
    if (copilotTrigger) copilotTrigger.textContent = 'Ask NEO Copilot · 搜索设备、告警、工单…';
    i18nRefresh(el);
  }

  // ─── ROLE SWITCHER（原型演示：角色→默认首屏 · 生产契约：由 RBAC 角色决定，配置见 org/role-management 默认首屏） ──
  window.toggleRoleMenu = function (e) {
    e.stopPropagation();
    var m = document.getElementById('roleSwMenu');
    if (m) m.style.display = m.style.display === 'none' ? 'block' : 'none';
  };
  window.switchRole = function (role) {
    localStorage.setItem('ems-role-demo', role);
    var map = { u1: 'portal/work-queue.html', u2: 'portal/work-queue.html?view=u2', u3: 'portal/governance.html', u4: 'portal/governance.html?view=u4', uf: 'portal/work-queue.html?view=ufrontline', um: 'portal/governance.html?view=um', pm: 'portal/work-queue.html?view=pm', bm: 'portal/work-queue.html?view=bm' };
    window.location.href = (window.EMS_BASE || '../') + (map[role] || map.u1);
  };
  document.addEventListener('click', function (e) {
    var sw = document.getElementById('roleSw');
    if (!sw || sw.contains(e.target)) return;
    var m = document.getElementById('roleSwMenu');
    if (m) m.style.display = 'none';
  });

  // ─── APP LAUNCHER + 页面收藏（03 §P4 菜单体系 L3 · 对标 SN Favorites） ───
  // 生产环境约定：收藏由后端 API 存储，键 = tenant_id × user_id，同账号跨设备一致、租户内隔离；
  // 产品集合按租户 License（SKU）过滤后展示。原型以 localStorage 模拟，仅作交互演示。
  var LAUNCHER_PRODUCTS = [
    { label: 'ITOM', href: 'itom/alert-list.html', color: '#2563EB', bg: 'rgba(37,99,235,.10)', icon: '<svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>' },
    { label: 'ITSM', href: 'itsm/itsm-dashboard.html', color: '#059669', bg: 'rgba(5,150,105,.10)', icon: '<svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>' },
    { label: 'CMDB', href: 'cmdb/cmdb-v2-overview.html', color: '#7C3AED', bg: 'rgba(124,58,237,.10)', icon: '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/></svg>' },
    { label: 'FSM', href: 'fsm/fsm-dispatch.html', color: '#D97706', bg: 'rgba(217,119,6,.10)', icon: '<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87"/></svg>' },
    { label: 'NPM', href: 'itom/npm-overview.html', color: '#0891B2', bg: 'rgba(8,145,178,.10)', icon: '<svg viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>' },
    { label: 'ITAM', href: 'itam/itam-overview.html', color: '#6366F1', bg: 'rgba(99,102,241,.10)', icon: '<svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05"/><path d="M12 22.08V12"/></svg>' },
    { label: 'PMS', href: 'pms/pms-workspace.html', color: '#0D9488', bg: 'rgba(13,148,136,.10)', icon: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M8 7v10M12 7v7M16 7v13"/></svg>' },
    { label: 'NEO Agent Hub', href: 'ai/ai-governance.html', color: '#EC4899', bg: 'rgba(236,72,153,.10)', icon: '<svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 017 7v1h1a2 2 0 012 2v1a2 2 0 01-2 2h-1a7 7 0 01-14 0H4a2 2 0 01-2-2v-1a2 2 0 012-2h1V9a7 7 0 017-7z"/><circle cx="9" cy="10" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r="1" fill="currentColor" stroke="none"/><path d="M9 14h6"/></svg>' }
  ];
  var FAV_KEY = 'ems-favorites-v1';
  var FAV_SEED_KEY = 'ems-favorites-seeded';
  function seedFavsOnce() {
    // 首次使用保持空收藏，后续仅由用户收藏操作产生数据。
    try {
      if (localStorage.getItem(FAV_SEED_KEY)) return;
      if (favStoreGet() !== null && favStoreGet() !== '[]') { localStorage.setItem(FAV_SEED_KEY, '1'); return; }
      saveFavs([]);
      localStorage.setItem(FAV_SEED_KEY, '1');
    } catch (e) {}
  }
  var _favMem = null; // localStorage 不可用时的内存兜底（如部分浏览器 file:// 限制）
  function favStoreGet() { try { return localStorage.getItem(FAV_KEY); } catch (e) { return null; } }
  function favStoreSet(v) { try { localStorage.setItem(FAV_KEY, v); } catch (e) {} }
  function getFavs() {
    try {
      var raw = favStoreGet();
      if (raw === null) return _favMem ? _favMem.slice() : [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
  }
  function saveFavs(list) { _favMem = list.slice(); favStoreSet(JSON.stringify(list)); }
  function currentPageId() { return CFG.activeMenu || (location.pathname.split('/').pop() || ''); }
  function launcherIsSolutionProduct(href) {
    return /^(itsm|fsm|itam|pms)\//.test(href || '');
  }
  function launcherHref(href, solutionProduct) {
    var url = basePath + href;
    if (!solutionProduct) return url;
    return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'solution=1';
  }
  function launcherProductClick(href) {
    if (!launcherIsSolutionProduct(href)) return;
    try { sessionStorage.setItem('ems-menu-context', 'solution'); } catch (e) {}
  }
  function favItemHtml(f) {
    var scene = f.sceneId ? _loadBusinessScenarios().find(function (s) { return s.id === f.sceneId; }) : null;
    return '<a class="al-fav-item" href="' + launcherHref(f.href, false) + '" title="' + (scene ? '收藏夹：' + scene.name : '未分类收藏') + '"><svg viewBox="0 0 24 24" class="al-fav-star"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg><span class="al-fav-name">' + f.name + '</span><button class="al-fav-del" onclick="event.preventDefault();event.stopPropagation();removeFav(\'' + f.href.replace(/'/g, "\\'") + '\',\'' + String(f.sceneId || '').replace(/'/g, "\\'") + '\')" title="从当前场景移除"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></a>';
  }
  function renderAppLauncher() {
    var holder = document.createElement('div');
    holder.className = 'app-launcher';
    holder.id = 'appLauncher';
    holder.style.display = 'none';
    var prodHtml = LAUNCHER_PRODUCTS.map(function (p) {
      var isSolutionProduct = launcherIsSolutionProduct(p.href);
      var clickAttr = isSolutionProduct ? ' onclick="launcherProductClick(\'' + p.href.replace(/'/g, "\\'") + '\')"' : '';
      return '<a class="al-product" href="' + launcherHref(p.href, isSolutionProduct) + '"' + clickAttr + ' title="' + p.label + '"><span class="al-product-icon" style="background:' + p.bg + ';color:' + p.color + '">' + p.icon + '</span><span class="al-product-name">' + p.label + '</span></a>';
    }).join('');
    holder.innerHTML = '<div class="al-panel"><div class="al-section al-section-fav"><div class="al-section-head">我的收藏</div><div class="al-fav-list"></div></div><div class="al-section"><div class="al-section-head">产品</div><div class="al-product-grid">' + prodHtml + '</div></div></div>';
    document.body.appendChild(holder);
    i18nRefresh(holder);
  }
  function renderFavList() {
    var list = document.querySelector('#appLauncher .al-fav-list');
    if (!list) return;
    var favs = getFavs();
    if (!favs.length) {
      list.innerHTML = '<div class="al-fav-empty">点击页面右上角星标收藏常用页面</div>';
    } else {
      var scenes = _loadBusinessScenarios(), groups = [];
      scenes.forEach(function (scene) {
        var entries = favs.filter(function (fav) { return fav.sceneId === scene.id; });
        if (entries.length) groups.push({name:scene.name,entries:entries});
      });
      var loose = favs.filter(function (fav) { return !fav.sceneId || !scenes.some(function (scene) { return scene.id === fav.sceneId; }); });
      if (loose.length) groups.push({name:'未分类',entries:loose});
      list.innerHTML = groups.map(function (group) {
        return '<div class="al-fav-folder"><div class="al-fav-folder-name"><svg viewBox="0 0 24 24"><path d="M3 7h6l2 2h10v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg><span>' + _favEsc(group.name) + '</span></div>' + group.entries.map(favItemHtml).join('') + '</div>';
      }).join('');
    }
    i18nRefresh(list);
  }
  function toggleAppLauncher(ev) {
    if (ev) ev.stopPropagation();
    var al = document.getElementById('appLauncher');
    if (!al) return;
    var open = al.style.display !== 'block';
    al.style.display = open ? 'block' : 'none';
    if (open) renderFavList();
  }
  var _favPickerSceneId = 'scene-default';
  function _favEsc(value) { return String(value || '').replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function _ensureFavPicker() {
    var mask = document.getElementById('favFolderPicker');
    if (mask) return mask;
    mask = document.createElement('div');
    mask.id = 'favFolderPicker';
    mask.className = 'ems-modal-mask';
    mask.innerHTML = '<div class="ems-modal"><div class="ems-modal-head"><span class="modal-icon"><svg viewBox="0 0 24 24"><path d="M3 7h6l2 2h10v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M3 7V5a2 2 0 012-2h4l2 2h8a2 2 0 012 2"/></svg></span><div class="modal-title">收藏到场景</div><button class="modal-close" onclick="closeFavFolderPicker()">×</button></div><div class="ems-modal-body"><label class="fav-folder-label">选择收藏夹</label><div class="fav-folder-list" id="favFolderList"></div><div class="fav-new-folder"><input class="modal-input" id="favNewFolderName" placeholder="新建收藏夹名称"><button onclick="createFavoriteFolder()">新建</button></div></div><div class="ems-modal-foot"><button class="btn" onclick="closeFavFolderPicker()">取消</button><button class="btn primary" onclick="confirmFavoriteFolder()">收藏</button></div></div>';
    mask.addEventListener('click', function (e) { if (e.target === mask) closeFavFolderPicker(); });
    document.body.appendChild(mask);
    return mask;
  }
  function _renderFavFolders() {
    var list = document.getElementById('favFolderList');
    if (!list) return;
    var scenes = _loadBusinessScenarios().filter(function (scene) { return scene.status !== 'disabled'; });
    if (!scenes.some(function (scene) { return scene.id === _favPickerSceneId; })) _favPickerSceneId = scenes[0] ? scenes[0].id : 'scene-default';
    list.innerHTML = scenes.map(function (scene) {
      return '<button class="fav-folder-option' + (scene.id === _favPickerSceneId ? ' selected' : '') + '" onclick="selectFavoriteFolder(\'' + scene.id.replace(/'/g, "\\'") + '\')"><svg viewBox="0 0 24 24"><path d="M3 7h6l2 2h10v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg><span>' + _favEsc(scene.name) + '</span><small>' + (scene.items || []).length + ' 个页面</small></button>';
    }).join('');
  }
  function openFavFolderPicker() {
    _favPickerSceneId = 'scene-default';
    var mask = _ensureFavPicker();
    _renderFavFolders();
    mask.classList.add('open');
  }
  function closeFavFolderPicker() { var mask = document.getElementById('favFolderPicker'); if (mask) mask.classList.remove('open'); }
  function selectFavoriteFolder(id) { _favPickerSceneId = id; _renderFavFolders(); }
  function createFavoriteFolder() {
    var input = document.getElementById('favNewFolderName');
    var name = input ? input.value.trim() : '';
    if (!name) { if (input) input.focus(); return; }
    var scenes = _loadBusinessScenarios();
    if (scenes.some(function (scene) { return scene.name === name; })) { showToast && showToast('收藏夹名称已存在'); return; }
    var id = 'scene-' + Date.now();
    scenes.push({id:id,name:name,description:'',status:'published',tenantId:'all',defaultHref:'',items:[]});
    _saveBusinessScenarios(scenes);
    _favPickerSceneId = id;
    input.value = '';
    _renderFavFolders();
    if (_dsCurrentDomain === 'scenarios') _dsRenderPanel();
  }
  function confirmFavoriteFolder() {
    var href = currentPageId();
    var name = CFG.breadcrumb || document.title.replace(/ - EMS.*/, '');
    var scenes = _loadBusinessScenarios();
    var scene = scenes.find(function (s) { return s.id === _favPickerSceneId; });
    if (!scene) return;
    var favs = getFavs();
    if (!favs.some(function (f) { return f.href === href && f.sceneId === scene.id; })) favs.push({href:href,name:name,sceneId:scene.id});
    if (!(scene.items || []).some(function (item) { return item.href === href; })) {
      scene.items = scene.items || [];
      scene.items.push({id:'fav-' + Date.now(),label:name,href:href,source:'favorite'});
      if (!scene.defaultHref) scene.defaultHref = href;
    }
    scene.status = 'published';
    saveFavs(favs);
    _saveBusinessScenarios(scenes);
    closeFavFolderPicker();
    updateFavStar();
    renderFavList();
    if (_dsCurrentDomain === 'scenarios') _dsRenderPanel();
    showToast && showToast('已收藏到：' + scene.name);
  }
  function toggleFavCurrentPage() {
    openFavFolderPicker();
  }
  function removeFav(href, sceneId) {
    var favs = getFavs(), removed = favs.find(function (f) { return f.href === href && (!sceneId || f.sceneId === sceneId); });
    saveFavs(favs.filter(function (f) { return !(f.href === href && (!sceneId || f.sceneId === sceneId)); }));
    if (removed && removed.sceneId) {
      var scenes = _loadBusinessScenarios(), scene = scenes.find(function (s) { return s.id === removed.sceneId; });
      if (scene) {
        scene.items = (scene.items || []).filter(function (item) { return item.href !== href || item.builtin; });
        if (scene.defaultHref === href) scene.defaultHref = scene.items[0] ? scene.items[0].href : '';
        _saveBusinessScenarios(scenes);
        if (_dsCurrentDomain === 'scenarios') _dsRenderPanel();
      }
    }
    renderFavList(); updateFavStar();
  }
  function updateFavStar() {
    var btn = document.getElementById('headerFavBtn');
    if (!btn) return;
    var on = getFavs().some(function (f) { return f.href === currentPageId(); });
    btn.classList.toggle('fav-on', on);
    btn.title = on ? '继续收藏到其他场景' : '收藏当前页面';
  }
  document.addEventListener('click', function (e) {
    var al = document.getElementById('appLauncher');
    // isConnected 防护：面板内点击触发重渲染后元素脱离 DOM，此时不应误关面板
    if (al && al.style.display === 'block' && e.target.isConnected && !al.contains(e.target) && !(e.target.closest && e.target.closest('.rail-launcher-btn'))) al.style.display = 'none';
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { var al = document.getElementById('appLauncher'); if (al) al.style.display = 'none'; }
  });
  window.toggleAppLauncher = toggleAppLauncher;
  window.toggleFavCurrentPage = toggleFavCurrentPage;
  window.removeFav = removeFav;
  window.closeFavFolderPicker = closeFavFolderPicker;
  window.selectFavoriteFolder = selectFavoriteFolder;
  window.createFavoriteFolder = createFavoriteFolder;
  window.confirmFavoriteFolder = confirmFavoriteFolder;
  window.launcherProductClick = launcherProductClick;

  // ─── AI DRAWER + FAB ───────────────────────────────────────────────
  function renderAiDrawer() {
    var container = document.getElementById('emsAiDrawer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'emsAiDrawer';
      document.body.appendChild(container);
    }
    var quickHtml = '';
    aiQuickActions.forEach(function (a) {
      quickHtml += '<div class="ai-quick-card" onclick="document.querySelector(\'.ai-input-textarea\').value=\'' + a.prompt.replace(/'/g, "\\'") + '\';document.querySelector(\'.ai-input-textarea\').focus()"><div class="ai-quick-card-title">' + a.title + '</div><div class="ai-quick-card-desc">' + a.desc + '</div></div>';
    });

    container.innerHTML = '<div class="ai-drawer-wrapper" id="aiDrawer"><div class="ai-drawer"><div class="ai-drawer-resize" id="aiDrawerResize"></div><div class="ai-drawer-header"><div class="ai-drawer-header-icon"><svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 017 7v1h1a2 2 0 012 2v1a2 2 0 01-2 2h-1a7 7 0 01-14 0H4a2 2 0 01-2-2v-1a2 2 0 012-2h1V9a7 7 0 017-7z"/><circle cx="9" cy="10" r="1" fill="#fff" stroke="none"/><circle cx="15" cy="10" r="1" fill="#fff" stroke="none"/><path d="M9 14h6"/></svg></div><span class="ai-drawer-header-title">NEO Agent</span><div class="ai-drawer-close" onclick="toggleAiDrawer()" title="关闭"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div></div><div class="ai-drawer-body"><div class="ai-drawer-welcome"><div class="ai-drawer-welcome-icon"><svg viewBox="0 0 24 24"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg></div><h3>EMS NEO Agent</h3><p>自然语言查询、根因分析、工单创建与智能派工</p><div class="ai-drawer-tier-hint"><span class="tier-badge tier-l3 sm">只读分析</span> 回答不产生写操作 · 发起动作时按档位进入确认或审批 · 会话与 Token 消耗留痕于 T5b · <a href="' + basePath + 'ai/ai-governance.html" onclick="event.stopPropagation()">审计 →</a></div><div class="ai-quick-actions">' + quickHtml + '</div></div></div><div class="ai-drawer-footer"><div class="ai-input-wrapper"><textarea class="ai-input-textarea" placeholder="给 NEO Agent 发消息…  输入 / 查看命令" rows="1" oninput="autoGrowTextarea(this)"></textarea><div class="ai-input-toolbar"><button class="ai-toolbar-btn" title="上传附件" onclick="event.stopPropagation()"><svg viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg><span>附件</span></button><button class="ai-toolbar-btn" title="CLI 命令" onclick="this.classList.toggle(\'active\');event.stopPropagation()"><svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg><span>CLI</span><span class="badge-dot"></span><div class="ai-toolbar-dropdown"><div class="ai-toolbar-dropdown-item"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg> ITOM 告警查询</div><div class="ai-toolbar-dropdown-item"><svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/><path d="M9 9h6v6H9z"/></svg> CMDB 关系查询</div><div class="ai-toolbar-dropdown-item"><svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg> NPM 路径诊断</div><div class="ai-toolbar-dropdown-item"><svg viewBox="0 0 24 24"><path d="M3 7h18M5 7l2 13h10l2-13M9 11v5M15 11v5"/></svg> FSM 工单与工程师查询</div></div></button><button class="ai-toolbar-btn" title="加载 Skills" onclick="this.classList.toggle(\'active\');event.stopPropagation()"><svg viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg><span>Skills</span><div class="ai-toolbar-dropdown"><div class="ai-toolbar-dropdown-item"><svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg> 告警根因分析</div><div class="ai-toolbar-dropdown-item"><svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg> CMDB 影响分析</div><div class="ai-toolbar-dropdown-item"><svg viewBox="0 0 24 24"><path d="M4 17l4-4 3 3 6-7 3 3"/></svg> 智能派工推荐</div><div class="ai-toolbar-dropdown-item"><svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> 容量规划</div><div class="ai-toolbar-dropdown-item"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> 周报生成</div></div></button><div class="ai-toolbar-spacer"></div><div class="ai-model-picker" id="aiModelPicker"><button class="ai-model-trigger" onclick="toggleModelPicker(event)" title="选择模型"><span class="model-dot" style="background:#10a37f"></span><span id="aiModelLabel">ChatGPT 5.5</span><svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></button><div class="ai-model-menu" id="aiModelMenu"><div class="ai-model-option active" onclick="selectModel(this,\'ChatGPT 5.5\',\'#10a37f\')"><div class="model-icon" style="background:#10a37f">G</div><div class="model-info"><div class="model-name">ChatGPT 5.5</div><div class="model-desc">OpenAI · 均衡性能与速度</div></div><svg class="model-check" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div><div class="ai-model-option" onclick="selectModel(this,\'Opus 4.7\',\'#d97706\')"><div class="model-icon" style="background:#d97706">A</div><div class="model-info"><div class="model-name">Opus 4.7</div><div class="model-desc">Anthropic · 最强推理与分析</div></div><svg class="model-check" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div><div class="ai-model-option" onclick="selectModel(this,\'DeepSeek V4 Pro\',\'#2563eb\')"><div class="model-icon" style="background:#2563eb">D</div><div class="model-info"><div class="model-name">DeepSeek V4 Pro</div><div class="model-desc">DeepSeek · 性价比之王</div></div><svg class="model-check" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div><div class="ai-model-option" onclick="selectModel(this,\'Gemini 2.5 Ultra\',\'#ea4335\')"><div class="model-icon" style="background:#ea4335">G</div><div class="model-info"><div class="model-name">Gemini 2.5 Ultra</div><div class="model-desc">Google · 多模态专家</div></div><svg class="model-check" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div><div class="ai-model-option" onclick="selectModel(this,\'Qwen3 235B\',\'#6d28d9\')"><div class="model-icon" style="background:#6d28d9">Q</div><div class="model-info"><div class="model-name">Qwen3 235B</div><div class="model-desc">通义千问 · 中文优化</div></div><svg class="model-check" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div></div></div><span class="ai-toolbar-hint">⌘ + Enter 发送</span><button class="ai-send-btn" title="发送"><svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button></div></div></div></div></div><div class="ai-fab" onclick="toggleAiDrawer()" title="NEO Agent (⌘K)"><svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 017 7v1h1a2 2 0 012 2v1a2 2 0 01-2 2h-1a7 7 0 01-14 0H4a2 2 0 01-2-2v-1a2 2 0 012-2h1V9a7 7 0 017-7z"/><circle cx="9" cy="10" r="1" fill="#fff" stroke="none"/><circle cx="15" cy="10" r="1" fill="#fff" stroke="none"/><path d="M9 14h6"/></svg><div class="ai-fab-badge"></div></div>';

    // The user-facing assistant is NEO Copilot; Agent naming is reserved for Agent Hub.
    container.querySelector('.ai-drawer-header-title').textContent = 'NEO Copilot';
    container.querySelector('.ai-drawer-welcome h3').textContent = 'EMS NEO Copilot';
    container.querySelector('.ai-input-textarea').placeholder = '给 NEO Copilot 发消息…  输入 / 查看命令';
    container.querySelector('.ai-fab').title = 'NEO Copilot (⌘K)';

    // Init resize handle
    var handle = document.getElementById('aiDrawerResize');
    var wrapper = document.getElementById('aiDrawer');
    if (handle && wrapper) {
      var dragging = false;
      handle.addEventListener('mousedown', function (e) { e.preventDefault(); dragging = true; handle.classList.add('dragging'); document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'; });
      document.addEventListener('mousemove', function (e) { if (!dragging) return; var w = window.innerWidth - e.clientX; if (w < 320) w = 320; if (w > 680) w = 680; wrapper.style.width = w + 'px'; });
      document.addEventListener('mouseup', function () { if (dragging) { dragging = false; handle.classList.remove('dragging'); document.body.style.cursor = ''; document.body.style.userSelect = ''; } });
    }
  }

  // ─── COMMAND PALETTE ───────────────────────────────────────────────
  function renderCommandPalette() {
    var container = document.getElementById('emsCmdPalette');
    if (!container) {
      container = document.createElement('div');
      container.id = 'emsCmdPalette';
      document.body.appendChild(container);
    }
    container.innerHTML = '<div class="cmd-overlay" id="cmdOverlay" onclick="if(event.target===this)closeCmd()"><div class="cmd-box"><div class="cmd-input-area"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><span class="cmd-scope-hint" id="cmdScopeHint" style="display:none"></span><input type="text" id="cmdInput" placeholder="搜索设备、告警、工单，或直接问 NEO Agent…" autocomplete="off" oninput="filterCmdResults(this.value)"></div><div class="cmd-chips" id="cmdChips"><span class="cmd-chip" onclick="document.getElementById(\'cmdInput\').value=\'/alert \';filterCmdResults(\'/alert \');document.getElementById(\'cmdInput\').focus()"><svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/></svg>告警</span><span class="cmd-chip" onclick="document.getElementById(\'cmdInput\').value=\'/ci \';filterCmdResults(\'/ci \');document.getElementById(\'cmdInput\').focus()"><svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/></svg>设备</span><span class="cmd-chip" onclick="document.getElementById(\'cmdInput\').value=\'/ticket \';filterCmdResults(\'/ticket \');document.getElementById(\'cmdInput\').focus()"><svg viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>工单</span><span class="cmd-chip" onclick="document.getElementById(\'cmdInput\').value=\'/nav \';filterCmdResults(\'/nav \');document.getElementById(\'cmdInput\').focus()"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>导航</span></div><div class="cmd-results" id="cmdResults"></div><div class="cmd-footer"><span><kbd>↑</kbd><kbd>↓</kbd> 导航</span><span><kbd>Enter</kbd> 打开</span><span><kbd>Tab</kbd> 问 AI</span><span><kbd>Esc</kbd> 关闭</span></div></div></div><div class="toast" id="toast"></div>';
    container.querySelector('#cmdInput').placeholder = '搜索设备、告警、工单，或直接问 NEO Copilot…';
  }

  // ─── COMMON SCRIPTS ────────────────────────────────────────────────
  // Sidebar
  window.toggleSidebar = function () {
    var sb = document.getElementById('sidebar');
    sb.classList.toggle('expanded');
    document.body.classList.toggle('sidebar-open');
    localStorage.setItem('ems-sidebar', sb.classList.contains('expanded') ? 'expanded' : 'collapsed');
  };
  (function initSidebar() {
    var sb = document.getElementById('sidebar');
    if (!sb || document.body.classList.contains('ds-active')) return;
    if (localStorage.getItem('ems-sidebar') === 'expanded') {
      sb.classList.add('expanded');
      document.body.classList.add('sidebar-open');
    }
    // Sidebar tooltip for collapsed state
    var tip = document.createElement('div');
    tip.className = 'sidebar-tooltip';
    document.body.appendChild(tip);
    sb.addEventListener('mouseover', function (e) {
      var item = e.target.closest('.sidebar-item[title]');
      if (!item || sb.classList.contains('expanded')) { tip.classList.remove('visible'); return; }
      var rect = item.getBoundingClientRect();
      tip.textContent = item.getAttribute('title');
      tip.style.left = rect.right + 6 + 'px';
      tip.style.top = rect.top + rect.height / 2 + 'px';
      tip.style.transform = 'translateY(-50%)';
      tip.classList.add('visible');
    });
    sb.addEventListener('mouseout', function (e) {
      var related = e.relatedTarget;
      if (!related || !related.closest || !related.closest('.sidebar-item[title]')) {
        tip.classList.remove('visible');
      }
    });
  })();

  // Theme
  (function initTheme() {
    var saved = localStorage.getItem('ems-theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);
  })();
  window.toggleTheme = function () {
    var html = document.documentElement;
    var next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('ems-theme', next);
  };

  // Fullscreen
  window.toggleFullscreen = function () {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); }
    else { document.exitFullscreen(); }
  };

  // Language
  window.toggleLangMenu = function () {
    document.getElementById('langMenu').classList.toggle('open');
  };
  window.switchLang = function (code, el) {
    currentLang = code;
    try { localStorage.setItem(I18N_KEY, code); } catch (e) {}
    try { document.documentElement.lang = code; } catch (e) {}
    document.querySelectorAll('.lang-option').forEach(function (o) {
      o.classList.toggle('active', o.getAttribute('data-lang-code') === code);
    });
    if (el && !el.classList.contains('active')) el.classList.add('active');
    var m = document.getElementById('langMenu');
    if (m) m.classList.remove('open');
    applyPageI18n(document.body);
  };
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.lang-switcher')) {
      var m = document.getElementById('langMenu');
      if (m) m.classList.remove('open');
    }
  });

  // Toast
  window.showToast = function (msg) {
    var t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(function () { t.classList.remove('show'); }, 2000);
  };

  // AI Drawer
  window.toggleAiDrawer = function () {
    var d = document.getElementById('aiDrawer');
    if (d) d.classList.toggle('open');
    document.querySelectorAll('.ai-toolbar-btn.active').forEach(function (b) { b.classList.remove('active'); });
  };
  window.autoGrowTextarea = function (el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.ai-toolbar-btn')) {
      document.querySelectorAll('.ai-toolbar-btn.active').forEach(function (b) { b.classList.remove('active'); });
    }
    if (!e.target.closest('.ai-model-picker')) {
      var mp = document.getElementById('aiModelPicker');
      if (mp) mp.classList.remove('open');
    }
  });

  // Model picker
  window.toggleModelPicker = function (e) {
    e.stopPropagation();
    var mp = document.getElementById('aiModelPicker');
    if (mp) mp.classList.toggle('open');
  };
  window.selectModel = function (el, name, color) {
    document.querySelectorAll('.ai-model-option').forEach(function (o) { o.classList.remove('active'); });
    el.classList.add('active');
    document.getElementById('aiModelLabel').textContent = name;
    var dot = document.querySelector('.ai-model-trigger .model-dot');
    if (dot) dot.style.background = color;
    document.getElementById('aiModelPicker').classList.remove('open');
    showToast('模型已切换: ' + name);
  };

  // Tenant switcher
  window.toggleTenantDropdown = function (e) {
    var dd = document.getElementById('tenantDropdown');
    if (!dd) return;
    dd.classList.toggle('open');
    if (dd.classList.contains('open')) {
      var sw = document.querySelector('.org-switcher');
      var r = sw.getBoundingClientRect();
      dd.style.left = r.left + 'px';
      dd.style.bottom = (window.innerHeight - r.top + 4) + 'px';
    }
  };
  window.filterTenants = function (q) {
    q = q.trim().toLowerCase();
    document.querySelectorAll('.tenant-item').forEach(function (el) {
      var name = el.querySelector('.t-name').textContent.toLowerCase();
      el.style.display = name.indexOf(q) !== -1 ? '' : 'none';
    });
  };
  window.switchTenant = function (name, el, e) {
    e.stopPropagation();
    document.querySelectorAll('.tenant-item').forEach(function (i) { i.classList.remove('active'); });
    el.classList.add('active');
    document.querySelector('.org-avatar').textContent = name.charAt(0).toUpperCase();
    document.querySelector('.org-name').textContent = name;
    document.getElementById('tenantDropdown').classList.remove('open');
    try { localStorage.setItem(DS_ACTIVE_TENANT_KEY, name); } catch (err) {}
    try { window.dispatchEvent(new CustomEvent('ems:tenant-change', { detail: { tenant: name } })); } catch (err) {}
    showToast('已切换到租户: ' + name);
  };
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.org-switcher')) {
      var dd = document.getElementById('tenantDropdown');
      if (dd) dd.classList.remove('open');
    }
  });

  // Command Palette
  var CMD_DATA = [
    // — 快速导航 —
    { cat: '快速导航', title: '运维概览', desc: '平台运维总览与运营看板', icon: 'home', href: 'portal/dashboard.html', product: 'sys', py: 'yunwei gailan' },
    { cat: '快速导航', title: '告警列表', desc: 'ITOM → 告警管理', icon: 'bell', href: 'itom/alert-list.html', product: 'itom', py: 'gaojing liebiao' },
    { cat: '快速导航', title: '告警降噪', desc: 'ITOM → 智能降噪中心', icon: 'filter', href: 'itom/alert-noise-reduction.html', product: 'itom', py: 'gaojing jiangzao' },
    { cat: '快速导航', title: '告警→事件', desc: 'ITOM → 告警聚合为事件', icon: 'zap', href: 'itom/alert-to-incident.html', product: 'itom', py: 'gaojing shijian' },
    { cat: '快速导航', title: 'CMDB 资产', desc: 'CMDB → 配置项列表', icon: 'server', href: 'cmdb/cmdb-v2-ci-list.html', product: 'cmdb', py: 'zichan peizhi ci' },
    { cat: '快速导航', title: '服务拓扑', desc: 'CMDB → 服务依赖拓扑', icon: 'share', href: 'cmdb/cmdb-v2-relationship-view.html', product: 'cmdb', py: 'fuwu tuopu yilai' },
    { cat: '快速导航', title: '网络拓扑', desc: 'ITOM → 基础设施拓扑', icon: 'share', href: 'itom/itom-topology.html', product: 'itom', py: 'wangluo tuopu jichu sheshi' },
    { cat: '快速导航', title: '自动发现', desc: 'CMDB → 设备自动发现', icon: 'search', href: 'cmdb/cmdb-v2-discovery-jobs.html', product: 'cmdb', py: 'zidong faxian shebei' },
    { cat: '快速导航', title: '变更影响', desc: 'ITSM → 变更影响分析', icon: 'git', href: 'itsm/change-impact.html', product: 'itsm', py: 'biangeng yingxiang fenxi' },
    { cat: '快速导航', title: '事件管理', desc: 'ITSM → 事件工单', icon: 'clipboard', href: 'itsm/itsm-incidents.html', product: 'itsm', py: 'shijian guanli gongdan' },
    { cat: '快速导航', title: '服务请求', desc: 'ITSM → 服务请求管理', icon: 'inbox', href: 'itsm/service-request.html', product: 'itsm', py: 'fuwu qingqiu' },
    { cat: '快速导航', title: '现场工单工作台', desc: 'FSM → 派工管理', icon: 'truck', href: 'fsm/fsm-dispatch.html', product: 'fsm', py: 'xianchang paigong' },
    { cat: '快速导航', title: 'NPM 网络质量', desc: 'NPM → 云拨测与质量监控', icon: 'activity', href: 'itom/npm-overview.html', product: 'npm', py: 'wangluo zhiliang yunboce' },
    { cat: '快速导航', title: '资产台账', desc: 'ITAM → 全球资产台账', icon: 'server', href: 'itam/itam-asset-ledger.html', product: 'itam', py: 'zichan zhangtai quanqiu guanli' },
    { cat: '快速导航', title: '库存盘点', desc: 'ITAM → 备件仓与盘点', icon: 'inbox', href: 'itam/itam-inventory.html', product: 'itam', py: 'kucun pandian beijiancang' },
    { cat: '快速导航', title: '项目列表', desc: 'PMS → 客户项目管理', icon: 'clipboard', href: 'pms/pms-projects.html', product: 'pms', py: 'xiangmu liebiao kehu guanli' },
    { cat: '快速导航', title: '任务管理', desc: 'PMS → 项目任务与推送 ITSM', icon: 'clipboard', href: 'pms/pms-tasks.html', product: 'pms', py: 'renwu guanli xiangmu renwu' },
    { cat: '快速导航', title: '交付物管理', desc: 'PMS → 交付物提交与验收归档', icon: 'inbox', href: 'pms/pms-deliverables.html', product: 'pms', py: 'jiaofuwu guanli tijiao guidang' },
    // — 设备 —
    { cat: '设备', title: 'HKT-DC-Core-SW01', desc: '核心交换机 · 数据中心 · 在线', icon: 'server', href: 'cmdb/cmdb-v2-ci-list.html', product: 'cmdb', py: 'hexin jiaohuanji shujuzhongxin' },
    { cat: '设备', title: 'HKT-DC-FW01', desc: '防火墙 · 数据中心 · 在线', icon: 'server', href: 'cmdb/cmdb-v2-ci-list.html', product: 'cmdb', py: 'fanghuoqiang shujuzhongxin' },
    { cat: '设备', title: 'HKT-DC-LB01', desc: '负载均衡器 · 数据中心 · 在线', icon: 'server', href: 'cmdb/cmdb-v2-ci-list.html', product: 'cmdb', py: 'fuzai junhengqi' },
    { cat: '设备', title: 'HKT-GBA-SZ-RTR01', desc: '路由器 · 深圳节点 · 在线', icon: 'server', href: 'cmdb/cmdb-v2-ci-list.html', product: 'cmdb', py: 'luyouqi shenzhen jiedian' },
    { cat: '设备', title: 'Cron-Worker-02', desc: 'Linux 服务器 · 应用集群 · 告警中', icon: 'server', href: 'cmdb/cmdb-v2-ci-list.html', product: 'cmdb', py: 'fuwuqi yingyong jiqun' },
    { cat: '设备', title: 'UPS-TKO-01', desc: 'UPS 电源 · 将军澳机房 · 在线', icon: 'server', href: 'cmdb/cmdb-v2-ci-list.html', product: 'cmdb', py: 'ups dianyuan jiangjunao jifang' },
    { cat: '设备', title: 'Meraki-MR46', desc: '无线 AP · 门店 · 在线', icon: 'server', href: 'cmdb/cmdb-v2-ci-list.html', product: 'cmdb', py: 'wuxian ap mendian' },
    { cat: '设备', title: 'DB-MySQL-Master', desc: 'MySQL 主库 · 生产环境 · 在线', icon: 'server', href: 'cmdb/cmdb-v2-ci-list.html', product: 'cmdb', py: 'mysql zhuku shengchan' },
    // — 告警 —
    { cat: '告警', title: 'CPU 使用率 > 95%', desc: 'Cron-Worker-02 · 紧急 · 10 分钟前', icon: 'bell', href: 'itom/alert-list.html', product: 'itom', py: 'cpu shiyonglv jinji' },
    { cat: '告警', title: '端口 Gi0/1 Down', desc: 'HKT-DC-Core-SW01 · 严重 · 25 分钟前', icon: 'bell', href: 'itom/alert-list.html', product: 'itom', py: 'duankou down yanzhong' },
    { cat: '告警', title: '磁盘空间不足 < 10%', desc: 'DB-MySQL-Master · 高 · 1 小时前', icon: 'bell', href: 'itom/alert-list.html', product: 'itom', py: 'cipan kongjian buzu' },
    { cat: '告警', title: 'HTTPS 证书即将到期', desc: 'Web-Proxy-01 · 中 · 3 天后到期', icon: 'bell', href: 'itom/alert-list.html', product: 'itom', py: 'https zhengshu daoqi' },
    { cat: '告警', title: 'BGP 邻居状态变更', desc: 'HKT-GBA-SZ-RTR01 · 高 · 45 分钟前', icon: 'bell', href: 'itom/alert-list.html', product: 'itom', py: 'bgp linju zhuangtai biangeng' },
    // — 工单 —
    { cat: '工单', title: 'INC-20260511-0042', desc: '核心交换机端口故障 · 处理中 · 张伟', icon: 'clipboard', href: 'itsm/itsm-incidents.html', product: 'itsm', py: 'hexin jiaohuanji duankou guzhang chuli' },
    { cat: '工单', title: 'INC-20260510-0038', desc: 'MySQL 主库 CPU 飙升 · 已解决 · 李明', icon: 'clipboard', href: 'itsm/itsm-incidents.html', product: 'itsm', py: 'mysql cpu biaosheng yijiejue' },
    { cat: '工单', title: 'CHG-20260512-0005', desc: '防火墙策略变更 · 待审批 · 王芳', icon: 'git', href: 'itsm/change-impact.html', product: 'itsm', py: 'fanghuoqiang celue biangeng daishenpi' },
    { cat: '工单', title: 'SR-20260509-0021', desc: 'VPN 账号开通申请 · 已完成 · 陈磊', icon: 'inbox', href: 'itsm/service-request.html', product: 'itsm', py: 'vpn zhanghao kaitong shenqing' },
    { cat: '工单', title: 'FSM-20260511-0012', desc: 'UPS 电池更换 · 已派工 · 赵工', icon: 'truck', href: 'fsm/fsm-dispatch.html', product: 'fsm', py: 'ups dianchi genghuan paigong' },
    // — 操作 —
    { cat: '操作', title: '切换暗色主题', desc: '深色 / 浅色模式切换', icon: 'theme', product: 'sys', keys: ['⌘', 'D'], action: function () { toggleTheme(); closeCmd(); }, py: 'qiehuan anse zhuti shense qianse moshi' },
    { cat: '操作', title: '打开 NEO Copilot', desc: '唤起 NEO Copilot 对话面板', icon: 'aibot', product: 'ai', keys: ['⌘', 'J'], action: function () { closeCmd(); toggleAiDrawer(); }, py: 'dakai ai zhushou copilot duihua' },
    { cat: '操作', title: '全屏模式', desc: '切换全屏显示', icon: 'fullscreen', product: 'sys', action: function () { toggleFullscreen(); closeCmd(); }, py: 'quanping moshi' },
    { cat: '操作', title: '切换到简体中文', desc: '界面语言 → 简体中文', icon: 'globe', product: 'sys', action: function () { switchLang('zh-CN', document.querySelector('.lang-option')); closeCmd(); showToast('已切换到简体中文'); }, py: 'qiehuan jianti zhongwen yuyan' },
    { cat: '操作', title: '切换到繁體中文', desc: '界面語言 → 繁體中文', icon: 'globe', product: 'sys', action: function () { switchLang('zh-TW', document.querySelectorAll('.lang-option')[1]); closeCmd(); showToast('已切換到繁體中文'); }, py: 'qiehuan fanti zhongwen yuyan' },
    { cat: '操作', title: '切换到 English', desc: 'Language → English', icon: 'globe', product: 'sys', action: function () { switchLang('en', document.querySelectorAll('.lang-option')[2]); closeCmd(); showToast('Switched to English'); }, py: 'qiehuan yingwen english language' },
    { cat: '操作', title: '展开 / 收起侧边栏', desc: '切换左侧导航面板显示', icon: 'sidebar', product: 'sys', keys: ['⌘', 'B'], action: function () { if (typeof dsPanelToggle === 'function') dsPanelToggle(); else toggleSidebar(); closeCmd(); }, py: 'zhankai shouqi cebian lan daohang caidan' },
    { cat: '操作', title: '切换租户', desc: '切换当前工作租户', icon: 'tenant', product: 'sys', action: function () { closeCmd(); toggleTenantDropdown(new Event('click')); }, py: 'qiehuan zuhu gongzuo' }
  ];
  var CMD_ICONS = {
    home: '<svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    grid: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    bell: '<svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>',
    filter: '<svg viewBox="0 0 24 24"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>',
    zap: '<svg viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    server: '<svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>',
    share: '<svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    git: '<svg viewBox="0 0 24 24"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 012 2v7"/><path d="M6 9v12"/></svg>',
    clipboard: '<svg viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>',
    truck: '<svg viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
    inbox: '<svg viewBox="0 0 24 24"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></svg>',
    activity: '<svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
    cpu: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>',
    theme: '<svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>',
    fullscreen: '<svg viewBox="0 0 24 24"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>',
    aibot: '<svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 017 7v1h1a2 2 0 012 2v1a2 2 0 01-2 2h-1a7 7 0 01-14 0H4a2 2 0 01-2-2v-1a2 2 0 012-2h1V9a7 7 0 017-7z"/><circle cx="9" cy="10" r="1"/><circle cx="15" cy="10" r="1"/><path d="M9 14h6"/></svg>',
    globe: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>',
    sidebar: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>',
    tenant: '<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>'
  };

  var PRODUCT_LABELS = {
    itom: 'ITOM', cmdb: 'CMDB', itsm: 'ITSM', fsm: 'FSM', ai: 'AI', npm: 'NPM', itam: 'ITAM', pms: 'PMS', sys: ''
  };
  var SCOPE_MAP = {
    '/alert': { label: '告警', filter: function (i) { return i.cat === '告警'; } },
    '/ci': { label: '设备', filter: function (i) { return i.cat === '设备'; } },
    '/ticket': { label: '工单', filter: function (i) { return i.cat === '工单'; } },
    '/nav': { label: '导航', filter: function (i) { return i.cat === '快速导航'; } }
  };

  // — Recent visits (localStorage) —
  var RECENT_KEY = 'ems-cmd-recent';
  function getRecent() {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch (e) { return []; }
  }
  function addRecent(title) {
    var list = getRecent().filter(function (t) { return t !== title; });
    list.unshift(title);
    if (list.length > 5) list = list.slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  }
  function getRecentItems() {
    var titles = getRecent();
    var items = [];
    titles.forEach(function (t) {
      for (var i = 0; i < CMD_DATA.length; i++) {
        if (CMD_DATA[i].title === t) { items.push(Object.assign({}, CMD_DATA[i], { cat: '最近访问' })); break; }
      }
    });
    return items;
  }

  // — Simple pinyin fuzzy match —
  function fuzzyMatch(item, q) {
    var haystack = (item.title + ' ' + item.desc + ' ' + (item.py || '')).toLowerCase();
    return haystack.indexOf(q) !== -1;
  }

  // — Highlight matched text —
  function highlight(text, q) {
    if (!q) return text;
    var idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return text.substring(0, idx) + '<mark>' + text.substring(idx, idx + q.length) + '</mark>' + text.substring(idx + q.length);
  }

  var cmdFocusIdx = 0, cmdFiltered = [], cmdCurrentQuery = '';
  window.renderCmdResults = function (items, q) {
    cmdFiltered = items; cmdFocusIdx = 0;
    var c = document.getElementById('cmdResults');
    if (!c) return;
    if (!items.length && !q) { c.innerHTML = '<div class="cmd-empty"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><br>输入关键词搜索设备、告警、工单<br><span style="font-size:11px;opacity:.6">或使用 /alert /ci /ticket 筛选范围</span></div>'; return; }
    var html = '', lastCat = '';
    items.forEach(function (item, idx) {
      if (item.cat !== lastCat) { lastCat = item.cat; html += '<div class="cmd-section-title">' + item.cat + '</div>'; }
      var f = idx === 0 ? ' focused' : '';
      var keys = item.keys ? '<div class="cmd-result-shortcut">' + item.keys.map(function (k) { return '<kbd>' + k + '</kbd>'; }).join('') + '</div>' : '';
      var tag = (item.product && PRODUCT_LABELS[item.product]) ? '<span class="cmd-product-tag" data-product="' + item.product + '">' + PRODUCT_LABELS[item.product] + '</span>' : '';
      var titleHtml = q ? highlight(item.title, q) : item.title;
      var descHtml = q ? highlight(item.desc, q) : item.desc;
      var iconProduct = item.product || 'sys';
      html += '<div class="cmd-result-item' + f + '" data-idx="' + idx + '" onclick="execCmdItem(' + idx + ')" onmouseenter="focusCmdItem(' + idx + ')">';
      html += '<div class="cmd-result-icon" data-product="' + iconProduct + '">' + (CMD_ICONS[item.icon] || '') + '</div>';
      html += '<div class="cmd-result-text"><div class="title">' + titleHtml + '</div><div class="desc">' + descHtml + '</div></div>';
      html += tag + keys + '</div>';
    });
    // AI fallback — always show when there is a query
    if (q) {
      html += '<div class="cmd-ai-fallback" onclick="cmdAskAi()" data-idx="' + items.length + '" onmouseenter="focusCmdItem(' + items.length + ')">';
      html += '<div class="cmd-ai-icon"><svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 017 7v1h1a2 2 0 012 2v1a2 2 0 01-2 2h-1a7 7 0 01-14 0H4a2 2 0 01-2-2v-1a2 2 0 012-2h1V9a7 7 0 017-7z"/><circle cx="9" cy="10" r="1" fill="#fff" stroke="none"/><circle cx="15" cy="10" r="1" fill="#fff" stroke="none"/><path d="M9 14h6"/></svg></div>';
      html += '<div class="cmd-ai-text">问 NEO Copilot: <strong>' + q.replace(/</g, '&lt;') + '</strong></div>';
      html += '<div class="cmd-ai-hint"><kbd>Tab</kbd></div>';
      html += '</div>';
      cmdFiltered.push({ _aiQuery: q });
    }
    c.innerHTML = html;
  };
  window.cmdAskAi = function () {
    var q = cmdCurrentQuery;
    closeCmd();
    toggleAiDrawer();
    setTimeout(function () {
      var ta = document.querySelector('.ai-input-textarea');
      if (ta) { ta.value = q; ta.focus(); }
    }, 100);
  };
  window.filterCmdResults = function (q) {
    q = q.trim().toLowerCase();
    cmdCurrentQuery = q;
    // Scope prefix
    var scope = null;
    Object.keys(SCOPE_MAP).forEach(function (prefix) {
      if (q.indexOf(prefix) === 0) { scope = SCOPE_MAP[prefix]; q = q.substring(prefix.length).trim(); }
    });
    // Update scope hint
    var scopeEl = document.getElementById('cmdScopeHint');
    if (scopeEl) {
      scopeEl.innerHTML = scope ? '<svg viewBox="0 0 24 24"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>' + scope.label : '';
      scopeEl.style.display = scope ? 'inline-flex' : 'none';
    }
    // Show/hide chips
    var chipsEl = document.getElementById('cmdChips');
    if (chipsEl) { chipsEl.style.display = (!q && !scope) ? 'flex' : 'none'; }
    if (!q && !scope) {
      // Default: recent + all nav
      var recent = getRecentItems();
      var nav = CMD_DATA.filter(function (i) { return i.cat === '快速导航' && _roleVisible(i); }).slice(0, 8);
      renderCmdResults(recent.concat(nav), '');
      return;
    }
    var pool = scope ? CMD_DATA.filter(scope.filter) : CMD_DATA;
    pool = pool.filter(_roleVisible);
    var results = pool.filter(function (i) { return fuzzyMatch(i, q); }).slice(0, 15);
    renderCmdResults(results, cmdCurrentQuery);
  };
  window.focusCmdItem = function (idx) {
    document.querySelectorAll('.cmd-result-item, .cmd-ai-fallback').forEach(function (el) { el.classList.remove('focused'); });
    var el = document.querySelector('.cmd-result-item[data-idx="' + idx + '"], .cmd-ai-fallback[data-idx="' + idx + '"]');
    if (el) { el.classList.add('focused'); cmdFocusIdx = idx; }
  };
  window.execCmdItem = function (idx) {
    var item = cmdFiltered[idx];
    if (!item) { closeCmd(); return; }
    if (item._aiQuery) { cmdAskAi(); return; }
    addRecent(item.title);
    if (item.action) { item.action(); }
    else if (item.href) { window.location.href = basePath + item.href; }
    else { closeCmd(); showToast('导航到: ' + item.title); }
  };
  window.openCmd = function () {
    document.getElementById('cmdOverlay').classList.add('open');
    cmdCurrentQuery = '';
    var chipsEl = document.getElementById('cmdChips');
    if (chipsEl) chipsEl.style.display = 'flex';
    var recent = getRecentItems();
    var nav = CMD_DATA.filter(function (i) { return i.cat === '快速导航'; }).slice(0, 8);
    renderCmdResults(recent.concat(nav), '');
    setTimeout(function () { document.getElementById('cmdInput').value = ''; document.getElementById('cmdInput').focus(); }, 50);
  };
  window.closeCmd = function () {
    document.getElementById('cmdOverlay').classList.remove('open');
    document.getElementById('cmdInput').value = '';
  };

  // Global keyboard shortcuts
  document.addEventListener('keydown', function (e) {
    var ov = document.getElementById('cmdOverlay');
    var cmdOpen = ov && ov.classList.contains('open');
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); if (cmdOpen) closeCmd(); else openCmd(); return; }
    if (e.key === 'Escape') {
      if (cmdOpen) { closeCmd(); return; }
      var d = document.getElementById('aiDrawer');
      if (d && d.classList.contains('open')) { toggleAiDrawer(); return; }
    }
    if (cmdOpen) {
      if (e.key === 'ArrowDown') { e.preventDefault(); focusCmdItem(Math.min(cmdFocusIdx + 1, cmdFiltered.length - 1)); var el = document.querySelector('.cmd-result-item.focused, .cmd-ai-fallback.focused'); if (el) el.scrollIntoView({ block: 'nearest' }); }
      if (e.key === 'ArrowUp') { e.preventDefault(); focusCmdItem(Math.max(cmdFocusIdx - 1, 0)); var el2 = document.querySelector('.cmd-result-item.focused, .cmd-ai-fallback.focused'); if (el2) el2.scrollIntoView({ block: 'nearest' }); }
      if (e.key === 'Enter') { e.preventDefault(); execCmdItem(cmdFocusIdx); }
      if (e.key === 'Tab' && cmdCurrentQuery) { e.preventDefault(); cmdAskAi(); }
      if (e.key === 'Backspace' && !document.getElementById('cmdInput').value) { e.preventDefault(); closeCmd(); }
    }
  });

  // ─── AI CHAT INTERACTION ─────────────────────────────────────────────
  // Context tracking — remembers last referenced device
  var aiDeviceContext = { name: 'Core-SW-01', ip: '10.1.1.1', alert: 'CPU 使用率 > 95%', alertId: 'ALR-20260515-0032' };
  var aiFsmContext = { id: 'FSM-2026-139', tenant: '达美乐（Domino）', customer: '达美乐', site: '香港将军澳网点', type: '故障维修', description: 'UPS 电池组告警，需现场检查并更换异常电池。', contact: 'Alan Cheung', phone: '+852 9123 4567', tacEngineer: 'T.K. Ho', needTac: '是', priority: 'P2-高', sla: '4 小时', budget: 'HKD 5,000' };

  window.sendNeoPrompt = function sendNeoPrompt(text) {
    var ta = document.querySelector('.ai-input-textarea');
    if (!ta) return;
    ta.value = text;
    sendAiMessage();
  };

  function neoWriteGuard() {
    var tenant = _dsActiveTenantName();
    if (tenant === '全部租户（MSP视角）') return '<div class="ai-ticket-form"><div class="ai-table-title">请先选择具体租户</div><p style="font-size:12px;color:var(--c-text-2);line-height:1.7">创建工单和派工都会写入业务数据，不能在全部租户范围执行。请使用租户切换器选择一个租户后重试。</p></div>';
    return '';
  }

  function generateTicketTypeChoice() {
    return '<div class="ai-ticket-form"><div class="ai-table-title">要创建哪一种工单？</div><p style="font-size:12px;color:var(--c-text-2);margin-bottom:10px">请选择业务类型，我会使用对应产品的字段和流程继续。</p><div class="ai-form-actions" style="justify-content:flex-start"><button class="ai-action-btn primary" onclick="sendNeoPrompt(\'创建事件工单\')">事件工单</button><button class="ai-action-btn" onclick="sendNeoPrompt(\'创建现场工单\')">现场工单</button></div><div class="ai-form-hint">事件工单用于故障受理与跟踪；现场工单用于上门服务和工程师派工。</div></div>';
  }

  window.submitTicket = function submitTicket(btn) {
    var form = btn.closest('.ai-ticket-form');
    if (!form) return;
    var d = aiDeviceContext;
    var ticketId = 'INC-20260515-' + String(Math.floor(100 + Math.random() * 900));
    form.innerHTML = '<div class="ai-ticket-success"><div class="ai-ticket-success-icon"><svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;vertical-align:-2px"><polyline points="20 6 9 17 4 12"/></svg></div><div class="ai-ticket-success-title">事件工单已创建</div><div class="ai-ticket-success-id">' + ticketId + '</div><div class="ai-ticket-success-meta"><div class="ai-form-row"><span class="ai-form-label">设备</span><span class="ai-form-value">' + d.name + ' (' + d.ip + ')</span></div><div class="ai-form-row"><span class="ai-form-label">受理组</span><span class="ai-form-value">网络运维组</span></div><div class="ai-form-row"><span class="ai-form-label">状态</span><span class="ai-form-value"><span class="ai-badge warning">待受理</span></span></div><div class="ai-form-row"><span class="ai-form-label">通知</span><span class="ai-form-value"><svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;vertical-align:-2px"><polyline points="20 6 9 17 4 12"/></svg> 已通知网络运维组</span></div></div><div class="ai-ticket-success-actions"><a class="ai-link-btn" onclick="showToast(\'正在跳转到工单详情…\')">查看工单详情 →</a></div></div>';
    form.style.transition = 'opacity .3s';
    form.style.opacity = '0';
    requestAnimationFrame(function () { form.style.opacity = '1'; });
    showToast('<svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;vertical-align:-2px"><polyline points="20 6 9 17 4 12"/></svg> 工单 ' + ticketId + ' 已创建');
  }

  window.cancelTicket = function cancelTicket(btn) {
    var form = btn.closest('.ai-ticket-form');
    if (!form) return;
    form.innerHTML = '<div style="text-align:center;padding:16px;color:var(--c-text-3)"><p>已取消工单创建</p><button class="ai-followup-chip" onclick="var ta=document.querySelector(\'.ai-input-textarea\');ta.value=\'帮我开个工单\';sendAiMessage()">重新创建工单</button></div>';
  }

  function generateTicketResponse() {
    var d = aiDeviceContext;
    return '<div class="ai-ticket-form"><div class="ai-table-title">创建 ITSM 事件工单 · 请确认</div><p style="font-size:12px;color:var(--c-text-2);margin-bottom:10px">我根据当前对话上下文预填了事件信息，请核对后确认或修改。</p><div class="ai-form-row"><span class="ai-form-label">标题</span><span class="ai-form-value ai-editable" contenteditable="true">' + d.name + ' ' + d.alert + ' 处置</span></div><div class="ai-form-row"><span class="ai-form-label">优先级</span><span class="ai-form-value"><select class="ai-inline-select"><option value="P1" selected>P1-紧急</option><option value="P2">P2-高</option><option value="P3">P3-中</option><option value="P4">P4-低</option></select></span></div><div class="ai-form-row"><span class="ai-form-label">关联设备</span><span class="ai-form-value ai-editable" contenteditable="true">' + d.name + ' (' + d.ip + ')</span></div><div class="ai-form-row"><span class="ai-form-label">关联告警</span><span class="ai-form-value">' + d.alertId + '</span></div><div class="ai-form-row"><span class="ai-form-label">受理组</span><span class="ai-form-value"><select class="ai-inline-select"><option>网络运维组</option><option>系统运维组</option><option>安全运营组</option><option>应用支持组</option></select></span></div><div class="ai-form-row"><span class="ai-form-label">描述</span><span class="ai-form-value ai-editable" contenteditable="true">' + d.name + '（' + d.ip + '）' + d.alert + '，需排查处理。</span></div><div class="ai-form-hint">确认后创建事件并进入受理组待受理，不直接指派个人。</div><div class="ai-form-actions"><button class="ai-action-btn primary" onclick="submitTicket(this)">确认创建</button><button class="ai-action-btn" onclick="cancelTicket(this)">取消</button></div></div>';
  }

  function generateFsmWorkOrderResponse() {
    var guard = neoWriteGuard();
    if (guard) return guard;
    var tenant = _dsActiveTenantName();
    return '<div class="ai-ticket-form"><div class="ai-table-title">创建 FSM 现场工单 · 请确认</div><p style="font-size:12px;color:var(--c-text-2);margin-bottom:10px">请选择客户和服务网点，补全现场联系信息。创建后可继续生成智能派工推荐。</p><div class="ai-form-row"><span class="ai-form-label">租户</span><span class="ai-form-value">'+tenant+'</span></div><div class="ai-form-row"><label class="ai-form-label" for="neoFsmCustomer">客户 *</label><span class="ai-form-value"><select class="ai-inline-select" id="neoFsmCustomer" onchange="updateNeoFsmSites(this.value)"><option value="">请选择客户</option><option value="达美乐">达美乐</option><option value="周大福">周大福</option><option value="香港美心">香港美心</option></select></span></div><div class="ai-form-row"><label class="ai-form-label" for="neoFsmSite">服务网点 *</label><span class="ai-form-value"><select class="ai-inline-select" id="neoFsmSite" onchange="fillNeoFsmSiteContact(this.value)" disabled><option value="">请先选择客户</option></select></span></div><div class="ai-form-row"><label class="ai-form-label" for="neoFsmType">工单类型 *</label><span class="ai-form-value"><select class="ai-inline-select" id="neoFsmType"><option value="">请选择工单类型</option><option>硬件更换</option><option>故障维修</option><option>安装部署</option><option>升级变更</option><option>巡检保养</option><option>其他</option></select></span></div><div class="ai-form-row"><label class="ai-form-label" for="neoFsmDescription">工单描述 *</label><span class="ai-form-value"><textarea class="ai-inline-input" id="neoFsmDescription" rows="3" style="width:100%;resize:vertical">'+aiDeviceContext.name+' '+aiDeviceContext.alert+'，需现场排查处理。</textarea></span></div><div class="ai-form-row"><label class="ai-form-label" for="neoFsmContact">现场联系人 *</label><span class="ai-form-value"><input class="ai-inline-input" id="neoFsmContact" type="text" placeholder="请输入现场联系人"></span></div><div class="ai-form-row"><label class="ai-form-label" for="neoFsmPhone">联系电话 *</label><span class="ai-form-value"><input class="ai-inline-input" id="neoFsmPhone" type="tel" placeholder="请输入联系电话"></span></div><div class="ai-form-row"><label class="ai-form-label" for="neoFsmTac">TAC 工程师 *</label><span class="ai-form-value"><select class="ai-inline-select" id="neoFsmTac"><option value="">请选择 TAC 工程师</option><option>T.K. Ho</option><option>W.C. Ng</option><option>Ada Lam</option></select></span></div><div class="ai-form-row"><label class="ai-form-label" for="neoFsmNeedTac">需 TAC 技术面试 *</label><span class="ai-form-value"><select class="ai-inline-select" id="neoFsmNeedTac"><option value="">请选择</option><option>是</option><option>否</option></select></span></div><div class="ai-form-row"><span class="ai-form-label">优先级 / SLA</span><span class="ai-form-value"><select class="ai-inline-select" id="neoFsmPriority"><option>P1-紧急 / 2 小时</option><option selected>P2-高 / 4 小时</option><option>P3-中 / 8 小时</option></select></span></div><div class="ai-form-row"><label class="ai-form-label" for="neoFsmBudget">费用预算</label><span class="ai-form-value"><input class="ai-inline-input" id="neoFsmBudget" value="HKD 5,000"></span></div><div class="ai-form-row"><span class="ai-form-label">来源</span><span class="ai-form-value">'+aiDeviceContext.alertId+' · '+aiDeviceContext.name+'</span></div><div class="ai-form-hint">创建工单与派工是两个独立步骤，本次确认只创建现场工单。</div><div class="ai-form-actions"><button class="ai-action-btn primary" onclick="submitFsmWorkOrder(this)">确认创建</button><button class="ai-action-btn" onclick="cancelTicket(this)">取消</button></div></div>';
  }

  var NEO_FSM_SITES = {
    '达美乐': [{name:'香港将军澳网点',contact:'Alan Cheung',phone:'+852 9123 4567'},{name:'香港铜锣湾门店',contact:'May Wong',phone:'+852 9234 1188'}],
    '周大福': [{name:'香港九龙网点',contact:'Jason Lee',phone:'+852 9018 3322'},{name:'深圳南山网点',contact:'陈志明',phone:'+86 138 2345 6789'}],
    '香港美心': [{name:'香港沙田网点',contact:'Kelly Chan',phone:'+852 9345 2210'}]
  };

  window.updateNeoFsmSites = function updateNeoFsmSites(customer) {
    var select = document.getElementById('neoFsmSite');
    if (!select) return;
    var sites = NEO_FSM_SITES[customer] || [];
    select.innerHTML = '<option value="">请选择服务网点</option>' + sites.map(function (site) { return '<option value="'+site.name+'">'+site.name+'</option>'; }).join('');
    select.disabled = !sites.length;
    var contact = document.getElementById('neoFsmContact');
    var phone = document.getElementById('neoFsmPhone');
    if (contact) contact.value = '';
    if (phone) phone.value = '';
  };

  window.fillNeoFsmSiteContact = function fillNeoFsmSiteContact(siteName) {
    var customer = document.getElementById('neoFsmCustomer');
    var sites = NEO_FSM_SITES[customer ? customer.value : ''] || [];
    var site = sites.filter(function (item) { return item.name === siteName; })[0];
    if (!site) return;
    document.getElementById('neoFsmContact').value = site.contact;
    document.getElementById('neoFsmPhone').value = site.phone;
  };

  window.submitFsmWorkOrder = function submitFsmWorkOrder(btn) {
    var form = btn.closest('.ai-ticket-form');
    if (!form) return;
    var fields = ['neoFsmCustomer','neoFsmSite','neoFsmType','neoFsmDescription','neoFsmContact','neoFsmPhone','neoFsmTac','neoFsmNeedTac'];
    for (var i=0;i<fields.length;i++) {
      var field = document.getElementById(fields[i]);
      if (!field || !String(field.value || '').trim()) { showToast('请补全所有必填信息'); if (field) field.focus(); return; }
    }
    aiFsmContext.id = 'FSM-2026-' + String(Math.floor(200 + Math.random() * 700));
    aiFsmContext.tenant = _dsActiveTenantName();
    aiFsmContext.customer = document.getElementById('neoFsmCustomer').value;
    aiFsmContext.site = document.getElementById('neoFsmSite').value;
    aiFsmContext.type = document.getElementById('neoFsmType').value;
    aiFsmContext.description = document.getElementById('neoFsmDescription').value.trim();
    aiFsmContext.contact = document.getElementById('neoFsmContact').value.trim();
    aiFsmContext.phone = document.getElementById('neoFsmPhone').value.trim();
    aiFsmContext.tacEngineer = document.getElementById('neoFsmTac').value;
    aiFsmContext.needTac = document.getElementById('neoFsmNeedTac').value;
    var pri = document.getElementById('neoFsmPriority').value.split(' / ');
    aiFsmContext.priority = pri[0]; aiFsmContext.sla = pri[1] || '';
    aiFsmContext.budget = document.getElementById('neoFsmBudget').value.trim();
    try { localStorage.setItem('ems-fsm-neo-workorder-' + aiFsmContext.tenant + '-' + aiFsmContext.id, JSON.stringify(aiFsmContext)); } catch (e) {}
    form.innerHTML = '<div class="ai-ticket-success"><div class="ai-ticket-success-icon"><svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:3"><polyline points="20 6 9 17 4 12"/></svg></div><div class="ai-ticket-success-title">现场工单已创建</div><div class="ai-ticket-success-id">'+aiFsmContext.id+'</div><div class="ai-ticket-success-meta"><div class="ai-form-row"><span class="ai-form-label">客户 / 网点</span><span class="ai-form-value">'+aiFsmContext.customer+' / '+aiFsmContext.site+'</span></div><div class="ai-form-row"><span class="ai-form-label">状态</span><span class="ai-form-value"><span class="ai-badge warning">待派单</span></span></div><div class="ai-form-row"><span class="ai-form-label">候选工程师</span><span class="ai-form-value">尚未指定</span></div></div><div class="ai-ticket-success-actions"><button class="ai-action-btn primary" onclick="sendNeoPrompt(\'为 '+aiFsmContext.id+' 生成智能派工推荐\')">生成智能派工推荐</button><a class="ai-link-btn" href="'+basePath+'fsm/fsm-dispatch-detail.html?id='+aiFsmContext.id+'&from=neo-agent">查看工单详情 →</a></div></div>';
    showToast('现场工单 '+aiFsmContext.id+' 已创建');
  };

  function generateDispatchRecommendation() {
    var guard = neoWriteGuard();
    if (guard) return guard;
    if (_dsActiveTenantName() === '香港美心MX') return '<div class="ai-ticket-form"><div class="ai-table-title">智能派工不可用</div><p style="font-size:12px;color:var(--c-text-2);line-height:1.7">当前租户未开通 FSM 调度推荐 Agent。你仍可以进入 FSM 工单详情使用手工派单。</p></div>';
    return '<div class="ai-ticket-form"><div class="ai-table-title">AI 派工推荐 · '+aiFsmContext.id+'</div><p style="font-size:12px;color:var(--c-text-2);margin-bottom:10px">FSM 调度推荐 Agent 已校验技能、服务范围、接单状态、负载、收费和到场时效。</p><div class="ai-rich-table"><table><thead><tr><th>候选工程师</th><th>匹配度</th><th>接单状态</th><th>当前负载</th><th>预计费用</th></tr></thead><tbody><tr><td><strong>P.Y. Lau</strong></td><td><span class="ai-badge success">96%</span></td><td>可接单</td><td>1 / 5</td><td>HKD 3,600</td></tr><tr><td><strong>S.Y. Lee</strong></td><td><span class="ai-badge success">91%</span></td><td>可接单</td><td>2 / 5</td><td>HKD 3,200</td></tr><tr><td><strong>T.K. Yip</strong></td><td><span class="ai-badge warning">86%</span></td><td>可接单</td><td>1 / 4</td><td>HKD 4,100</td></tr></tbody></table></div><div class="ai-form-hint">同时通知所选候选工程师，最先认领者成为处理工程师。调用编号 A7-20260923-0186。</div><div class="ai-form-actions"><button class="ai-action-btn primary" onclick="confirmNeoDispatch(this,\'全部推荐工程师\')">派给全部推荐工程师</button><button class="ai-action-btn" onclick="confirmNeoDispatch(this,\'P.Y. Lau\')">仅派给 P.Y. Lau</button><a class="ai-link-btn" href="'+basePath+'fsm/fsm-dispatch-detail.html?id='+aiFsmContext.id+'">查看工单</a></div></div>';
  }

  window.confirmNeoDispatch = function confirmNeoDispatch(btn, candidates) {
    var form = btn.closest('.ai-ticket-form');
    if (!form) return;
    var candidateValue = candidates === '全部推荐工程师' ? 'P.Y. Lau / S.Y. Lee / T.K. Yip' : candidates;
    try { localStorage.setItem('ems-fsm-dispatch-state-' + _dsActiveTenantName() + '-' + aiFsmContext.id, JSON.stringify({status:'待认领',candidate:candidateValue,source:'ai-neo',updatedAt:new Date().toISOString()})); } catch (e) {}
    form.innerHTML = '<div class="ai-ticket-success"><div class="ai-ticket-success-icon"><svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:3"><polyline points="20 6 9 17 4 12"/></svg></div><div class="ai-ticket-success-title">派单已确认</div><div class="ai-ticket-success-id">'+aiFsmContext.id+'</div><div class="ai-ticket-success-meta"><div class="ai-form-row"><span class="ai-form-label">候选工程师</span><span class="ai-form-value">'+candidateValue.replace(/ \/ /g,'、')+'</span></div><div class="ai-form-row"><span class="ai-form-label">工单状态</span><span class="ai-form-value"><span class="ai-badge warning">待认领</span></span></div><div class="ai-form-row"><span class="ai-form-label">通知</span><span class="ai-form-value">已同时通知所选候选工程师</span></div></div><div class="ai-form-hint">最先认领者成为处理工程师；本次确认已记录到 FSM 工单和 AI 审计。</div><div class="ai-ticket-success-actions"><a class="ai-link-btn" href="'+basePath+'fsm/fsm-dispatch-detail.html?id='+aiFsmContext.id+'&from=neo-agent">查看工单详情 →</a></div></div>';
    showToast('工单 '+aiFsmContext.id+' 已进入待认领');
  };

  var AI_SCENARIOS = [
    {
      keywords: ['查看待派工', '待派工的现场工单', '哪些现场工单没有派工', '待派单工单'],
      tool: 'CLI:FSM 工单查询',
      response: '<div class="ai-rich-table"><div class="ai-table-title">待派工现场工单 (3)</div><table><thead><tr><th>工单</th><th>客户 / 项目</th><th>服务网点</th><th>优先级</th></tr></thead><tbody><tr><td><strong>FSM-2026-139</strong><br>UPS 电池更换</td><td>达美乐 / 门店设备维保</td><td>TKO 数据中心</td><td><span class="ai-badge warning">P2</span></td></tr><tr><td><strong>FSM-2026-142</strong><br>门店 POS 网络中断</td><td>达美乐 / 门店网络支持</td><td>铜锣湾门店</td><td><span class="ai-badge critical">P1</span></td></tr><tr><td><strong>FSM-2026-145</strong><br>AP 更换</td><td>达美乐 / 门店设备维保</td><td>荃湾门店</td><td><span class="ai-badge warning">P2</span></td></tr></tbody></table></div>',
      followups: ['为 FSM-2026-139 生成智能派工推荐', '创建现场工单']
    },
    {
      keywords: ['智能派工推荐', '生成智能派工', '推荐工程师', '智能派工'],
      tool: 'Agent:FSM 调度推荐 Agent',
      dynamic: true,
      getResponse: generateDispatchRecommendation
    },
    {
      keywords: ['创建现场工单', '新建现场工单', 'FSM 工单'],
      tool: 'CLI:FSM 工单创建',
      dynamic: true,
      getResponse: generateFsmWorkOrderResponse
    },
    {
      keywords: ['创建事件工单', '新建事件工单', 'ITSM 事件'],
      tool: 'CLI:ITSM 事件创建',
      dynamic: true,
      getResponse: generateTicketResponse,
      followups: ['添加附件', '关联告警', '关联变更单']
    },
    {
      keywords: ['告警', '在告警', '哪些设备告警', '告警设备'],
      tool: 'Skill:告警根因分析',
      response: '<div class="ai-rich-table"><div class="ai-table-title"><svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;vertical-align:-2px"><path d="M12 3L2 21h20L12 3z"/><line x1="12" y1="10" x2="12" y2="15"/><circle cx="12" cy="18" r="0.4"/></svg> 当前告警设备 (4)</div><table><thead><tr><th>设备</th><th>IP</th><th>级别</th><th>告警内容</th><th>持续</th></tr></thead><tbody><tr><td><strong>Core-SW-01</strong></td><td>10.1.1.1</td><td><span class="ai-badge critical">严重</span></td><td>CPU 使用率 &gt; 95%</td><td>32 分钟</td></tr><tr><td><strong>Edge-FW-03</strong></td><td>10.1.2.3</td><td><span class="ai-badge critical">严重</span></td><td>HA 心跳丢失</td><td>18 分钟</td></tr><tr><td><strong>Dist-SW-07</strong></td><td>10.1.3.7</td><td><span class="ai-badge warning">警告</span></td><td>端口 Gi0/1 Down</td><td>2 小时</td></tr><tr><td><strong>AP-Floor3-12</strong></td><td>10.1.10.12</td><td><span class="ai-badge warning">警告</span></td><td>信道利用率 &gt; 80%</td><td>45 分钟</td></tr></tbody></table></div>',
      followups: ['Core-SW-01 根因分析', '帮我开个工单', '静默 AP-Floor3-12 告警'],
      onMatch: function () { aiDeviceContext = { name: 'Core-SW-01', ip: '10.1.1.1', alert: 'CPU 使用率超 95%', alertId: 'ALR-20260515-0032' }; }
    },
    {
      keywords: ['开工单', '创建工单', '提工单', '开个工单', 'ticket'],
      tool: 'NEO Copilot:工单类型识别',
      dynamic: true,
      getResponse: generateTicketTypeChoice
    },
    {
      keywords: ['ping', '连通性', '通不通', '能不能通'],
      tool: 'CLI:NPM 路径诊断',
      dynamic: true,
      getResponse: function () {
        var ip = aiDeviceContext.ip;
        return '<div class="ai-terminal"><div class="ai-table-title">Ping 测试结果 — ' + ip + '</div><pre class="ai-terminal-output">$ ping ' + ip + ' -c 4\nPING ' + ip + ': 56 data bytes\n64 bytes from ' + ip + ': seq=0 ttl=64 time=1.23ms\n64 bytes from ' + ip + ': seq=1 ttl=64 time=0.98ms\n64 bytes from ' + ip + ': seq=2 ttl=64 time=<span class="ai-highlight-red">89.21ms</span>\n64 bytes from ' + ip + ': seq=3 ttl=64 time=1.05ms\n\n--- ' + ip + ' ping statistics ---\n4 packets transmitted, 4 received, <span class="ai-highlight-green">0% packet loss</span>\nround-trip min/avg/max = 0.98/<span class="ai-highlight-yellow">23.12</span>/89.21 ms</pre><p style="margin-top:8px;font-size:12px;color:var(--c-text-3)"><svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;vertical-align:-2px"><path d="M12 3L2 21h20L12 3z"/><line x1="12" y1="10" x2="12" y2="15"/><circle cx="12" cy="18" r="0.4"/></svg> 第 3 包延迟异常（89ms），可能存在间歇性拥塞。建议执行 traceroute 定位瓶颈节点。</p></div>';
      },
      followups: ['执行 traceroute', '查看该设备接口流量', '最近 1 小时延迟趋势']
    },
    {
      keywords: ['CPU', '内存', '负载', '性能', '使用率'],
      tool: 'CLI:ITOM 告警查询',
      response: '<div class="ai-rich-table"><div class="ai-table-title">Top-5 高负载设备</div><table><thead><tr><th>设备</th><th>CPU</th><th>内存</th><th>趋势</th><th>状态</th></tr></thead><tbody><tr><td><strong>Core-SW-01</strong></td><td>96%</td><td>82%</td><td>↑↑</td><td><span class="ai-badge critical">危险</span></td></tr><tr><td><strong>DB-Server-02</strong></td><td>88%</td><td>91%</td><td>↑</td><td><span class="ai-badge critical">危险</span></td></tr><tr><td><strong>App-LB-01</strong></td><td>79%</td><td>65%</td><td>→</td><td><span class="ai-badge warning">警告</span></td></tr><tr><td><strong>Edge-FW-03</strong></td><td>74%</td><td>58%</td><td>↑</td><td><span class="ai-badge warning">警告</span></td></tr><tr><td><strong>Mail-Server</strong></td><td>71%</td><td>77%</td><td>→</td><td><span class="ai-badge warning">警告</span></td></tr></tbody></table><p style="margin-top:8px;font-size:12px;color:var(--c-text-3)">对比昨日同时段，Core-SW-01 CPU 上升 12%，DB-Server-02 内存上升 8%。</p></div>',
      followups: ['Core-SW-01 进程排行', '设置 CPU>90% 自动告警', '导出性能报告']
    },
    {
      keywords: ['巡检', '报告', '简报', '摘要', '今日'],
      tool: 'Skill:周报生成',
      response: '<div class="ai-report"><div class="ai-table-title">今日巡检摘要 — 2026/05/15</div><div class="ai-report-grid"><div class="ai-report-card"><div class="ai-report-num">847</div><div class="ai-report-label">设备总数</div></div><div class="ai-report-card"><div class="ai-report-num ai-green">99.2%</div><div class="ai-report-label">在线率</div></div><div class="ai-report-card"><div class="ai-report-num ai-red">4</div><div class="ai-report-label">活跃告警</div></div><div class="ai-report-card"><div class="ai-report-num ai-yellow">12</div><div class="ai-report-label">待处理工单</div></div></div><div class="ai-report-section"><strong><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#EF4444;vertical-align:0"></span> 关键问题：</strong><ul><li>Core-SW-01 CPU 持续高位，疑似路由环路</li><li>Edge-FW-03 HA 同步中断，备机已切换</li></ul></div><div class="ai-report-section"><strong><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#F59E0B;vertical-align:0"></span> 注意事项：</strong><ul><li>3F 无线 AP 信道拥挤，建议调整信道规划</li><li>DB-Server-02 内存接近阈值，建议扩容评估</li></ul></div><div class="ai-report-section"><strong><svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;vertical-align:-2px"><polyline points="20 6 9 17 4 12"/></svg> 正常运行：</strong> 核心交换集群、互联网出口链路、DNS/DHCP 服务均正常。</div></div>',
      followups: ['导出 PDF 报告', '发送给值班经理', '对比昨日巡检']
    },
    {
      keywords: ['变更', '谁改了', '配置', '变更记录'],
      tool: 'CLI:ITOM 告警查询',
      response: '<div class="ai-rich-table"><div class="ai-table-title">最近配置变更 (24h)</div><table><thead><tr><th>时间</th><th>设备</th><th>操作人</th><th>变更类型</th><th>状态</th></tr></thead><tbody><tr><td>14:32</td><td>Core-SW-01</td><td>张工</td><td>ACL 策略更新</td><td><span class="ai-badge success">已审批</span></td></tr><tr><td>11:15</td><td>Edge-FW-03</td><td>李工</td><td>HA 配置同步</td><td><span class="ai-badge warning">进行中</span></td></tr><tr><td>09:40</td><td>Dist-SW-07</td><td>系统</td><td>固件自动升级</td><td><span class="ai-badge success">已完成</span></td></tr><tr><td>昨日 22:10</td><td>App-LB-01</td><td>王工</td><td>VIP 池扩容</td><td><span class="ai-badge success">已完成</span></td></tr></tbody></table><p style="margin-top:8px;font-size:12px;color:var(--c-text-3)">Edge-FW-03 的 HA 配置变更可能与当前心跳丢失告警相关，建议核实。</p></div>',
      followups: ['查看 Edge-FW-03 变更详情', '回滚 ACL 变更', '对比变更前后配置']
    },
    {
      keywords: ['10.10.10.1', '设备状态', '查询设备', '查一下设备'],
      tool: 'CLI:ITOM 告警查询 + NPM 路径诊断',
      response: '<div class="ai-device-status"><div class="ai-table-title">设备状态 — 10.10.10.1</div><div class="ai-device-header"><div class="ai-device-name"><strong>BJ-Core-SW-02</strong><span class="ai-badge success" style="margin-left:8px">在线</span></div><div class="ai-device-meta">型号: Cisco Catalyst 9300 &nbsp;|&nbsp; SN: FCW2345L0PQ &nbsp;|&nbsp; 位置: 北京 IDC-A 机房 3层 B12柜</div></div><div class="ai-device-grid"><div class="ai-device-metric"><div class="ai-device-metric-val ai-green">32%</div><div class="ai-device-metric-label">CPU</div></div><div class="ai-device-metric"><div class="ai-device-metric-val ai-green">45%</div><div class="ai-device-metric-label">内存</div></div><div class="ai-device-metric"><div class="ai-device-metric-val">128 天</div><div class="ai-device-metric-label">运行时长</div></div><div class="ai-device-metric"><div class="ai-device-metric-val ai-green">0</div><div class="ai-device-metric-label">活跃告警</div></div></div><div class="ai-rich-table" style="margin-top:10px"><table><thead><tr><th>接口</th><th>状态</th><th>速率</th><th>入流量</th><th>出流量</th><th>错包</th></tr></thead><tbody><tr><td>GigE 0/1</td><td><span class="ai-badge success">Up</span></td><td>1Gbps</td><td>342 Mbps</td><td>287 Mbps</td><td>0</td></tr><tr><td>GigE 0/2</td><td><span class="ai-badge success">Up</span></td><td>1Gbps</td><td>156 Mbps</td><td>98 Mbps</td><td>0</td></tr><tr><td>TenGigE 1/1</td><td><span class="ai-badge success">Up</span></td><td>10Gbps</td><td>4.2 Gbps</td><td>3.8 Gbps</td><td>0</td></tr><tr><td>GigE 0/3</td><td><span class="ai-badge warning">Down</span></td><td>—</td><td>—</td><td>—</td><td>—</td></tr></tbody></table></div><p style="margin-top:8px;font-size:12px;color:var(--c-text-3)"><svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;vertical-align:-2px"><path d="M12 3L2 21h20L12 3z"/><line x1="12" y1="10" x2="12" y2="15"/><circle cx="12" cy="18" r="0.4"/></svg> GigE 0/3 处于 Down 状态（管理性关闭），其余接口运行正常。最后一次配置变更: 3 天前。</p></div>',
      followups: ['查看 GigE 0/3 为什么 Down', 'ping 10.10.10.1', '查看该设备变更记录'],
      onMatch: function () { aiDeviceContext = { name: 'BJ-Core-SW-02', ip: '10.10.10.1', alert: 'GigE 0/3 Down', alertId: 'ALR-20260515-0048' }; }
    },
    {
      keywords: ['traceroute', '路由跟踪', '跟踪路由'],
      tool: 'CLI:NPM 路径诊断',
      dynamic: true,
      getResponse: function () {
        var ip = aiDeviceContext.ip;
        return '<div class="ai-terminal"><div class="ai-table-title">Traceroute 结果 — ' + ip + '</div><pre class="ai-terminal-output">$ traceroute ' + ip + '\ntraceroute to ' + ip + ', 30 hops max, 60 byte packets\n 1  gateway (192.168.1.1)      <span class="ai-highlight-green">0.52 ms</span>  0.48 ms  0.45 ms\n 2  10.0.0.1                   <span class="ai-highlight-green">1.23 ms</span>  1.18 ms  1.15 ms\n 3  10.0.1.1                   <span class="ai-highlight-green">2.45 ms</span>  2.38 ms  2.41 ms\n 4  10.0.2.1                   <span class="ai-highlight-red">45.67 ms</span>  <span class="ai-highlight-red">52.31 ms</span>  <span class="ai-highlight-red">48.92 ms</span>\n 5  10.1.0.1                   <span class="ai-highlight-yellow">12.34 ms</span>  11.98 ms  12.05 ms\n 6  ' + ip + '                   <span class="ai-highlight-green">3.21 ms</span>  3.15 ms  3.18 ms</pre><p style="margin-top:8px;font-size:12px;color:var(--c-text-3)"><svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;vertical-align:-2px"><path d="M12 3L2 21h20L12 3z"/><line x1="12" y1="10" x2="12" y2="15"/><circle cx="12" cy="18" r="0.4"/></svg> <strong>第 4 跳 (10.0.2.1)</strong> 延迟异常（45-52ms），该节点为 Dist-SW-05 上联口，可能存在链路拥塞或 QoS 队列溢出。</p></div>';
      },
      followups: ['查看 Dist-SW-05 接口利用率', '该链路历史延迟趋势', '帮我开个工单']
    },
    {
      keywords: ['接口流量', '端口流量', '流量趋势', '查看流量'],
      tool: 'CLI:NPM 路径诊断',
      dynamic: true,
      getResponse: function () {
        var d = aiDeviceContext;
        return '<div class="ai-rich-table"><div class="ai-table-title">设备接口流量 — ' + d.name + ' (实时)</div><table><thead><tr><th>接口</th><th>入方向</th><th>出方向</th><th>利用率</th><th>状态</th></tr></thead><tbody><tr><td><strong>TenGigE 1/1</strong></td><td>6.2 Gbps</td><td>5.8 Gbps</td><td><span class="ai-badge critical">89%</span></td><td>Up</td></tr><tr><td><strong>TenGigE 1/2</strong></td><td>3.1 Gbps</td><td>2.7 Gbps</td><td><span class="ai-badge warning">58%</span></td><td>Up</td></tr><tr><td><strong>GigE 0/1</strong></td><td>620 Mbps</td><td>480 Mbps</td><td><span class="ai-badge warning">62%</span></td><td>Up</td></tr><tr><td><strong>GigE 0/2</strong></td><td>210 Mbps</td><td>185 Mbps</td><td><span class="ai-badge success">21%</span></td><td>Up</td></tr><tr><td><strong>GigE 0/3</strong></td><td>—</td><td>—</td><td>—</td><td><span class="ai-badge warning">Down</span></td></tr></tbody></table><p style="margin-top:8px;font-size:12px;color:var(--c-text-3)"><svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;vertical-align:-2px"><path d="M12 3L2 21h20L12 3z"/><line x1="12" y1="10" x2="12" y2="15"/><circle cx="12" cy="18" r="0.4"/></svg> TenGigE 1/1 利用率达 89%，接近饱和。建议检查是否有异常大流量或考虑负载均衡。</p></div>';
      },
      followups: ['TenGigE 1/1 Top-N 会话', '最近 24 小时流量曲线', '配置 QoS 限速']
    },
    {
      keywords: ['延迟趋势', '延迟', '时延', '历史延迟', 'latency'],
      tool: 'CLI:NPM 路径诊断',
      dynamic: true,
      getResponse: function () {
        var ip = aiDeviceContext.ip;
        return '<div class="ai-chart-placeholder"><div class="ai-table-title">延迟趋势 — ' + ip + ' (最近 1 小时)</div><div class="ai-sparkline-container"><div class="ai-sparkline-chart"><div class="ai-sparkline-bar" style="height:15%"></div><div class="ai-sparkline-bar" style="height:12%"></div><div class="ai-sparkline-bar" style="height:18%"></div><div class="ai-sparkline-bar" style="height:14%"></div><div class="ai-sparkline-bar" style="height:22%"></div><div class="ai-sparkline-bar" style="height:16%"></div><div class="ai-sparkline-bar" style="height:45%"></div><div class="ai-sparkline-bar highlight" style="height:85%"></div><div class="ai-sparkline-bar highlight" style="height:72%"></div><div class="ai-sparkline-bar" style="height:35%"></div><div class="ai-sparkline-bar" style="height:18%"></div><div class="ai-sparkline-bar" style="height:15%"></div></div><div class="ai-sparkline-labels"><span>14:00</span><span>14:15</span><span>14:30</span><span>14:45</span></div></div><div class="ai-stats-row"><div class="ai-stat"><span class="ai-stat-label">最小</span><span class="ai-stat-val ai-green">0.9 ms</span></div><div class="ai-stat"><span class="ai-stat-label">平均</span><span class="ai-stat-val">8.4 ms</span></div><div class="ai-stat"><span class="ai-stat-label">最大</span><span class="ai-stat-val ai-red">89.2 ms</span></div><div class="ai-stat"><span class="ai-stat-label">P95</span><span class="ai-stat-val ai-yellow">52.1 ms</span></div></div><p style="margin-top:8px;font-size:12px;color:var(--c-text-3)">14:32-14:38 出现延迟尖峰（最高 89ms），与 ' + aiDeviceContext.name + ' CPU 飙升时间吻合，疑似路由收敛抖动。</p></div>';
      },
      followups: ['对比正常时段延迟', '查看同时段丢包率', '关联告警时间线']
    },
    {
      keywords: ['根因', '根因分析', '为什么', '原因'],
      tool: 'Skill:告警根因分析',
      response: '<div class="ai-rca"><div class="ai-table-title">根因分析 — Core-SW-01 CPU 异常</div><div class="ai-rca-timeline"><div class="ai-rca-step"><div class="ai-rca-dot critical"></div><div class="ai-rca-content"><strong>14:28</strong> — CPU 使用率突增至 95%<br><span class="ai-rca-detail">进程 BGP Scanner 占用 CPU 62%，OSPF Hello 占用 18%</span></div></div><div class="ai-rca-step"><div class="ai-rca-dot warning"></div><div class="ai-rca-content"><strong>14:26</strong> — BGP 邻居 10.0.2.1 收到大量路由更新<br><span class="ai-rca-detail">接收前缀数从 12,000 → 48,000（增加 3 倍）</span></div></div><div class="ai-rca-step"><div class="ai-rca-dot warning"></div><div class="ai-rca-content"><strong>14:25</strong> — 上游 ISP-PE-01 执行了路由策略变更<br><span class="ai-rca-detail">关联变更单 CHG-20260515-003（张工操作）</span></div></div><div class="ai-rca-step"><div class="ai-rca-dot success"></div><div class="ai-rca-content"><strong>结论</strong> — 上游路由策略放开导致前缀泄漏，BGP 收敛引发 CPU 飙升<br><span class="ai-rca-detail">建议：联系 ISP 确认策略变更，或在本端加 prefix-limit 保护</span></div></div></div></div>',
      followups: ['帮我开工单处理', '联系 ISP 确认', '添加 prefix-limit 配置']
    }
  ];

  function matchScenario(msg) {
    var lower = msg.toLowerCase();
    for (var i = 0; i < AI_SCENARIOS.length; i++) {
      for (var j = 0; j < AI_SCENARIOS[i].keywords.length; j++) {
        if (lower.indexOf(AI_SCENARIOS[i].keywords[j]) !== -1) return AI_SCENARIOS[i];
      }
    }
    return null;
  }

  function createMsgEl(role, html) {
    var div = document.createElement('div');
    div.className = 'ai-msg ' + role;
    var avatar = role === 'user' ? '<div class="ai-msg-avatar user">U</div>' : '<div class="ai-msg-avatar bot">AI</div>';
    var name = role === 'user' ? 'You' : 'NEO Copilot';
    div.innerHTML = avatar + '<div class="ai-msg-content"><div class="ai-msg-name">' + name + '</div><div class="ai-msg-text">' + html + '</div></div>';
    div.style.opacity = '0';
    div.style.transform = 'translateY(8px)';
    requestAnimationFrame(function () { div.style.transition = 'opacity .3s,transform .3s'; div.style.opacity = '1'; div.style.transform = 'translateY(0)'; });
    return div;
  }

  function createTypingIndicator() {
    var div = document.createElement('div');
    div.className = 'ai-msg bot ai-typing-row';
    div.innerHTML = '<div class="ai-msg-avatar bot">AI</div><div class="ai-msg-content"><div class="ai-msg-name">NEO Copilot</div><div class="ai-msg-text"><span class="ai-typing-dots"><span></span><span></span><span></span></span></div></div>';
    return div;
  }

  function createFollowups(items) {
    var div = document.createElement('div');
    div.className = 'ai-followup-chips';
    items.forEach(function (text) {
      var btn = document.createElement('button');
      btn.className = 'ai-followup-chip';
      btn.textContent = text;
      btn.onclick = function () { var ta = document.querySelector('.ai-input-textarea'); ta.value = text; sendAiMessage(); };
      div.appendChild(btn);
    });
    div.style.opacity = '0';
    div.style.transform = 'translateY(6px)';
    requestAnimationFrame(function () { div.style.transition = 'opacity .3s .1s,transform .3s .1s'; div.style.opacity = '1'; div.style.transform = 'translateY(0)'; });
    return div;
  }

  function getGenericResponse(msg) {
    var replies = [
      '我正在分析你的请求…<br><br>根据当前上下文，系统运行整体平稳。如需深入排查，可以告诉我具体关注的设备或指标。',
      '已收到，让我检索相关数据…<br><br>暂未发现异常记录。你可以尝试询问更具体的内容，例如"哪些设备在告警"或"查看变更记录"。',
      '好的，我来帮你查一下…<br><br>当前各核心系统均正常运行。如需执行操作（如 ping、创建工单），请直接告诉我。'
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  }

  window.sendAiMessage = function () {
    var ta = document.querySelector('.ai-input-textarea');
    if (!ta) return;
    var msg = ta.value.trim();
    if (!msg) return;
    ta.value = '';
    ta.style.height = 'auto';

    var body = document.querySelector('.ai-drawer-body');
    // Hide welcome on first send
    var welcome = body.querySelector('.ai-drawer-welcome');
    if (welcome) welcome.style.display = 'none';

    // Append user message
    body.appendChild(createMsgEl('user', msg.replace(/</g, '&lt;').replace(/\n/g, '<br>')));
    body.scrollTop = body.scrollHeight;

    // Show typing indicator
    var typing = createTypingIndicator();
    body.appendChild(typing);
    body.scrollTop = body.scrollHeight;

    // Match scenario
    var scenario = matchScenario(msg);
    var delay = 600 + Math.random() * 800;

    setTimeout(function () {
      body.removeChild(typing);
      var toolTag = scenario ? scenario.tool : 'EMS NEO Copilot';
      // Call context updater if present
      if (scenario && scenario.onMatch) scenario.onMatch();
      // Get response (dynamic or static)
      var content = scenario ? (scenario.dynamic ? scenario.getResponse() : scenario.response) : getGenericResponse(msg);
      var responseHtml = '<div class="ai-tool-tag">' + toolTag + '</div>' + content;
      body.appendChild(createMsgEl('bot', responseHtml));
      if (scenario && scenario.followups) {
        body.appendChild(createFollowups(scenario.followups));
      }
      body.scrollTop = body.scrollHeight;
    }, delay);
  };

  // Wire up textarea
  document.addEventListener('keydown', function (e) {
    var ta = document.querySelector('.ai-input-textarea');
    if (!ta || document.activeElement !== ta) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendAiMessage();
    }
  });

  // Wire up send button
  document.addEventListener('click', function (e) {
    if (e.target.closest('.ai-send-btn')) {
      e.preventDefault();
      sendAiMessage();
    }
  });

  // Wire up quick action cards to also send
  document.addEventListener('click', function (e) {
    var card = e.target.closest('.ai-quick-card');
    if (!card) return;
    setTimeout(function () { sendAiMessage(); }, 50);
  });

  // ─── INIT ──────────────────────────────────────────────────────────
  var useLegacy = CFG.useLegacySidebar === true;
  if (useLegacy) {
    renderSidebar();
  } else {
    renderDomainSwitcher();
  }
  renderHeader();
  renderAppLauncher();
  renderAiDrawer();
  renderCommandPalette();
  updateFavStar();
  seedFavsOnce();
  applyAgentLicenseVisibility();

  // Reveal page now that layout is stable
  document.body.classList.add('ems-ready');

  // Enable sidebar transition after initial render to prevent expand flash
  if (useLegacy) {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        var sb = document.getElementById('sidebar');
        if (sb) sb.classList.add('ready');
      });
    });
  }
})();

/* ==========================================================================
 * EMS v6 · L2 手工确认抽屉（v1 主线 M3/M4/M5 通用组件）
 *   window.openL2Drawer({
 *     kind: 'M3' | 'M4' | 'M5',          // 场景类别
 *     title: 'string',                    // 抽屉标题
 *     tier: 'L2' | 'L3',                  // 默认档位
 *     subject: 'string',                  // 主体（工单标题 · 变更名 · 请求名）
 *     meta: [{label, value}...],          // 元信息（触发人 · 时间 · 关联告警）
 *     draft: {                            // AI 起草内容（表单式）
 *       fields: [{key, label, value, type:'text|textarea|select', options?}]
 *     },
 *     evidence: [{label, href}...],       // 证据链链接
 *     tips: 'string',                     // 底部提示（合规说明）
 *     onApprove, onOverride, onEdit       // 回调
 *   })
 * ========================================================================== */
(function () {
  'use strict';

  // ── inject CSS ────────────────────────────────────────────────────
  var css = [
    '.l2-drawer-mask{position:fixed;inset:0;background:rgba(15,23,42,.32);z-index:9998;opacity:0;pointer-events:none;transition:opacity .2s ease}',
    '.l2-drawer-mask.open{opacity:1;pointer-events:auto}',
    '.l2-drawer{position:fixed;top:0;right:0;height:100vh;width:520px;max-width:100vw;background:var(--c-white,#fff);z-index:9999;box-shadow:-6px 0 24px rgba(15,23,42,.16);transform:translateX(100%);transition:transform .25s cubic-bezier(.25,.8,.25,1);display:flex;flex-direction:column;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif}',
    '.l2-drawer.open{transform:translateX(0)}',
    // 关闭态兜底：.l2-drawer 的 display:flex 会盖过 UA 样式表的 [hidden]{display:none}
    //（作者样式表在同等特异性下胜出），必须显式恢复 hidden 语义。否则抽屉关闭后只是被
    // transform:translateX(100%) 推出视口，仍参与布局、其内部控件全部留在 Tab 序里。
    '.l2-drawer[hidden],.l2-drawer-mask[hidden]{display:none}',
    '.l2-drawer-head{padding:14px 18px;border-bottom:1px solid var(--c-border,#e5e7eb);display:flex;align-items:center;gap:10px}',
    '.l2-drawer-head .kind{padding:3px 8px;border-radius:4px;font-size:11px;font-weight:600}',
    '.l2-drawer-head .kind.m3{background:rgba(220,38,38,.1);color:#dc2626}',
    '.l2-drawer-head .kind.m4{background:rgba(124,58,237,.1);color:#7c3aed}',
    '.l2-drawer-head .kind.m5{background:rgba(217,119,6,.1);color:#d97706}',
    '.l2-drawer-head .title{flex:1;font-size:14px;font-weight:600;color:var(--c-text-1,#0f172a)}',
    '.l2-drawer-head .tier{padding:3px 8px;border-radius:4px;font-size:11px;font-weight:500}',
    '.l2-drawer-head .tier.l2{background:rgba(217,119,6,.12);color:#b45309}',
    '.l2-drawer-head .tier.l3{background:rgba(220,38,38,.1);color:#b91c1c}',
    '.l2-drawer-head .close-x{padding:6px;color:var(--c-text-3,#94a3b8);cursor:pointer;border-radius:4px}',
    '.l2-drawer-head .close-x:hover{background:var(--c-fill-1,#f1f5f9);color:var(--c-text-1,#0f172a)}',
    '.l2-drawer-notice{padding:10px 18px;background:linear-gradient(90deg,rgba(217,119,6,.06),rgba(37,99,235,.04));border-bottom:1px solid var(--c-border-light,#e2e8f0);font-size:12px;color:var(--c-text-2,#475569);display:flex;align-items:center;gap:8px}',
    '.l2-drawer-notice svg{width:16px;height:16px;color:#d97706;flex-shrink:0}',
    '.l2-drawer-body{flex:1;overflow-y:auto;padding:18px}',
    '.l2-drawer-section{margin-bottom:20px}',
    '.l2-drawer-section .sec-title{font-size:11px;font-weight:600;color:var(--c-text-3,#94a3b8);text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px}',
    '.l2-meta-list{display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px}',
    '.l2-meta-list > div{display:flex;flex-direction:column;gap:2px;padding:8px 10px;background:var(--c-fill-1,#f8fafc);border-radius:6px}',
    '.l2-meta-list > div span:first-child{font-size:10px;color:var(--c-text-3,#94a3b8);text-transform:uppercase}',
    '.l2-meta-list > div span:last-child{color:var(--c-text-1,#0f172a);font-weight:500}',
    '.l2-draft-field{margin-bottom:12px}',
    '.l2-draft-field label{display:block;font-size:11px;color:var(--c-text-2,#475569);margin-bottom:4px;display:flex;align-items:center;gap:6px}',
    '.l2-draft-field label .ai-mark{background:rgba(236,72,153,.12);color:#db2777;padding:1px 6px;border-radius:3px;font-size:10px}',
    '.l2-draft-field input,.l2-draft-field textarea,.l2-draft-field select{width:100%;padding:8px 10px;border:1px solid var(--c-border,#e5e7eb);border-radius:6px;font-size:13px;background:var(--c-white,#fff);color:var(--c-text-1,#0f172a);font-family:inherit;transition:border-color .15s ease}',
    '.l2-draft-field textarea{min-height:80px;resize:vertical;line-height:1.5}',
    '.l2-draft-field input:focus,.l2-draft-field textarea:focus,.l2-draft-field select:focus{outline:none;border-color:var(--c-primary,#2563eb);box-shadow:0 0 0 3px rgba(37,99,235,.08)}',
    '.l2-draft-field.readonly input,.l2-draft-field.readonly textarea{background:var(--c-fill-1,#f8fafc);color:var(--c-text-2,#475569);pointer-events:none}',
    '.l2-evidence-list{display:flex;flex-direction:column;gap:6px}',
    '.l2-evidence-list a{display:flex;align-items:center;gap:6px;padding:8px 10px;background:var(--c-fill-1,#f8fafc);border-radius:6px;font-size:12px;color:var(--c-text-1,#0f172a);text-decoration:none;border:1px solid transparent;transition:all .15s ease}',
    '.l2-evidence-list a:hover{background:var(--c-white,#fff);border-color:var(--c-primary,#2563eb);color:var(--c-primary,#2563eb)}',
    '.l2-evidence-list a::before{content:"";display:inline-block;width:4px;height:4px;border-radius:50%;background:var(--c-primary);margin-right:6px}',
    '.l2-drawer-foot{border-top:1px solid var(--c-border,#e5e7eb);padding:14px 18px;background:var(--c-fill-1,#f8fafc);display:flex;gap:8px;align-items:center}',
    '.l2-drawer-foot .foot-tips{flex:1;font-size:11px;color:var(--c-text-3,#94a3b8)}',
    '.l2-drawer-foot .btn{padding:8px 16px;border-radius:6px;font-size:13px;font-weight:500;cursor:pointer;border:1px solid var(--c-border,#e5e7eb);background:var(--c-white,#fff);color:var(--c-text-1,#0f172a);transition:all .15s ease}',
    '.l2-drawer-foot .btn:hover{background:var(--c-fill-1,#f8fafc)}',
    '.l2-drawer-foot .btn.override{color:#b91c1c;border-color:rgba(220,38,38,.3)}',
    '.l2-drawer-foot .btn.override:hover{background:rgba(220,38,38,.06)}',
    '.l2-drawer-foot .btn.primary{background:var(--c-primary,#2563eb);color:#fff;border-color:var(--c-primary,#2563eb)}',
    '.l2-drawer-foot .btn.primary:hover{filter:brightness(.95)}',
    '.l2-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--c-text-1,#0f172a);color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;z-index:10001;box-shadow:0 10px 24px rgba(15,23,42,.24);opacity:0;transition:all .25s ease}',
    '.l2-toast.show{opacity:1;transform:translateX(-50%) translateY(-4px)}',
    '.l2-toast.success{background:#16a34a}',
    '.l2-toast.warn{background:#d97706}'
  ].join('');
  var style = document.createElement('style');
  style.id = 'ems-l2-drawer-styles';
  style.textContent = css;
  document.head.appendChild(style);

  // ── build DOM ─────────────────────────────────────────────────────
  var mask = document.createElement('div');
  mask.className = 'l2-drawer-mask';
  var drawer = document.createElement('div');
  drawer.className = 'l2-drawer';
  drawer.innerHTML = [
    '<div class="l2-drawer-head">',
    '  <span class="kind" id="l2Kind"></span>',
    '  <span class="title" id="l2Title">AI 草稿确认</span>',
    '  <span class="tier" id="l2Tier"></span>',
    '  <span class="close-x" onclick="closeL2Drawer()">',
    '    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    '  </span>',
    '</div>',
    '<div class="l2-drawer-notice">',
    '  <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round"><path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>',
    '  <span id="l2NoticeText">这是 AI 起草的动作，需你审阅并确认。确认不是审批，草稿、人工修改和执行结果都会记录到 T5 审计。</span>',
    '</div>',
    '<div class="l2-drawer-body" id="l2Body"></div>',
    '<div class="l2-drawer-foot">',
    '  <span class="foot-tips" id="l2FootTips">采纳 AI 建议 100% · Token 消耗 ¥0.04</span>',
    '  <button class="btn override" onclick="l2Override()">Override（附原因）</button>',
    '  <button class="btn primary" onclick="l2Approve()"><svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;vertical-align:-2px"><polyline points="20 6 9 17 4 12"/></svg> 确认执行</button>',
    '</div>'
  ].join('');
  document.body.appendChild(mask);
  document.body.appendChild(drawer);
  // 初始即隐藏：全站 11 个页面都加载本文件，抽屉从未打开时也不得占据 Tab 停靠点。
  mask.hidden = true;
  drawer.hidden = true;
  mask.addEventListener('click', function () { window.closeL2Drawer(); });

  var currentCfg = null;
  var toastEl = null;
  var hideTimer = null;   // 滑出动画播完后补 hidden 的定时器；重新打开时取消，避免误隐藏新抽屉
  var lastFocus = null;   // 打开前的焦点元素；关闭时归位，避免 hidden 之后焦点掉进 <body>

  function renderBody(cfg) {
    var html = '';
    if (cfg.meta && cfg.meta.length) {
      html += '<div class="l2-drawer-section"><div class="sec-title">上下文</div><div class="l2-meta-list">';
      cfg.meta.forEach(function (m) {
        html += '<div><span>' + escapeHtml(m.label) + '</span><span>' + escapeHtml(m.value) + '</span></div>';
      });
      html += '</div></div>';
    }
    if (cfg.draft && cfg.draft.fields && cfg.draft.fields.length) {
      html += '<div class="l2-drawer-section"><div class="sec-title">AI 起草内容（可编辑）</div>';
      cfg.draft.fields.forEach(function (f) {
        var mark = f.aiMark === false ? '' : '<span class="ai-mark">AI 起草</span>';
        html += '<div class="l2-draft-field"><label>' + escapeHtml(f.label) + mark + '</label>';
        if (f.type === 'textarea') {
          html += '<textarea data-key="' + escapeHtml(f.key) + '">' + escapeHtml(f.value || '') + '</textarea>';
        } else if (f.type === 'select') {
          html += '<select data-key="' + escapeHtml(f.key) + '">';
          (f.options || []).forEach(function (o) {
            var sel = o === f.value ? ' selected' : '';
            html += '<option' + sel + '>' + escapeHtml(o) + '</option>';
          });
          html += '</select>';
        } else if (f.type === 'multiselect') {
          var selectedValues = Array.isArray(f.value) ? f.value : [];
          html += '<div style="display:flex;flex-direction:column;border:1px solid var(--c-border,#E5E7EB);border-radius:6px;overflow:hidden">';
          (f.options || []).forEach(function (o, index) {
            var optionValue = typeof o === 'object' ? o.value : o;
            var optionTitle = typeof o === 'object' ? (o.title || o.value) : o;
            var optionMatch = typeof o === 'object' ? (o.match || '') : '';
            var optionMeta = typeof o === 'object' ? (o.meta || '') : '';
            var checked = selectedValues.indexOf(optionValue) >= 0 ? ' checked' : '';
            html += '<label style="display:grid;grid-template-columns:20px 1fr;align-items:start;gap:8px;padding:10px;border-bottom:' + (index === f.options.length - 1 ? '0' : '1px solid var(--c-border-light,#F0F1F3)') + ';font-size:12px;cursor:pointer"><input style="margin-top:3px" type="checkbox" data-key="' + escapeHtml(f.key) + '" data-multi="true" value="' + escapeHtml(optionValue) + '"' + checked + '><span><span style="display:flex;align-items:center;justify-content:space-between;gap:8px"><strong style="color:var(--c-text-1,#111827)">' + escapeHtml(optionTitle) + '</strong>' + (optionMatch ? '<strong style="color:var(--c-primary,#2563EB)">' + escapeHtml(optionMatch) + '</strong>' : '') + '</span>' + (optionMeta ? '<span style="display:block;margin-top:4px;color:var(--c-text-3,#6B7280);line-height:1.6">' + escapeHtml(optionMeta) + '</span>' : '') + '</span></label>';
          });
          html += '</div><div style="margin-top:5px;font-size:11px;color:var(--c-text-3,#6B7280)">可选择多位候选工程师，确认后将同时写入 FSM 工单候选名单。</div>';
        } else {
          html += '<input type="text" data-key="' + escapeHtml(f.key) + '" value="' + escapeHtml(f.value || '') + '" />';
        }
        html += '</div>';
      });
      html += '</div>';
    }
    if (cfg.evidence && cfg.evidence.length) {
      html += '<div class="l2-drawer-section"><div class="sec-title">T4 证据链</div><div class="l2-evidence-list">';
      cfg.evidence.forEach(function (e) {
        html += '<a href="' + escapeHtml(e.href || 'javascript:void(0)') + '">' + escapeHtml(e.label) + '</a>';
      });
      html += '</div></div>';
    }
    document.getElementById('l2Body').innerHTML = html;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function collectDraft() {
    var out = {};
    document.querySelectorAll('#l2Body [data-key]').forEach(function (el) {
      var key = el.getAttribute('data-key');
      if (el.getAttribute('data-multi') === 'true') {
        if (!out[key]) out[key] = [];
        if (el.checked) out[key].push(el.value);
      } else {
        out[key] = el.value;
      }
    });
    return out;
  }

  window.openL2Drawer = function (cfg) {
    currentCfg = cfg || {};
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    lastFocus = document.activeElement;
    var kindEl = document.getElementById('l2Kind');
    kindEl.textContent = cfg.kind || '';
    kindEl.className = 'kind ' + (cfg.kind ? cfg.kind.toLowerCase() : '');
    document.getElementById('l2Title').textContent = cfg.title || 'AI 草稿确认';
    var tierEl = document.getElementById('l2Tier');
    tierEl.textContent = (cfg.tier || 'L2') + (cfg.tier === 'L1' ? ' 自动执行' : (cfg.tier === 'L3' ? ' 多层审批' : ' 手工确认'));
    tierEl.className = 'tier ' + (cfg.tier || 'l2').toLowerCase();
    document.getElementById('l2FootTips').textContent = cfg.tips || '所有动作留痕到 T5 审计 · Token 消耗计入 T2 账单';
    renderBody(cfg);
    mask.hidden = false;
    drawer.hidden = false;
    void drawer.offsetWidth; // 强制回流：display:none→flex 后先让初始 transform 生效，滑入动画才不会被跳过
    setTimeout(function () {
      mask.classList.add('open');
      drawer.classList.add('open');
    }, 10);
  };

  window.closeL2Drawer = function () {
    mask.classList.remove('open');
    drawer.classList.remove('open');
    // 焦点若还在抽屉内，先归还给打开前的元素——否则补 hidden 时焦点会掉进 <body>
    if (drawer.contains(document.activeElement)) {
      if (lastFocus && lastFocus.focus && document.contains(lastFocus)) lastFocus.focus();
      else if (document.activeElement.blur) document.activeElement.blur();
    }
    lastFocus = null;
    // 等 250ms 滑出动画播完再补 hidden：动画完整播放，Tab 序里也不留残留停靠点
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(function () {
      hideTimer = null;
      if (!drawer.classList.contains('open')) { mask.hidden = true; drawer.hidden = true; }
    }, 300);
  };

  window.l2Approve = function () {
    var multiFields = document.querySelectorAll('#l2Body [data-multi="true"]');
    if (multiFields.length && !document.querySelector('#l2Body [data-multi="true"]:checked')) {
      showToast('请至少选择一位推荐工程师', 'warn');
      return;
    }
    var draft = collectDraft();
    var msg = (currentCfg && currentCfg.onApprove) ? currentCfg.onApprove(draft) : null;
    showToast(msg || '<svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;vertical-align:-2px"><polyline points="20 6 9 17 4 12"/></svg> 已确认执行 · 结果已记录到 T5 审计', 'success');
    closeL2Drawer();
  };

  window.l2Override = function () {
    var cfg = currentCfg || {};
    var draft = collectDraft();
    window.showInputModal({
      title: 'Override 原因（将记录到 T6）',
      message: '你不采纳 AI 起草的动作，请填写原因。所有 override 记录会进入 <strong>NEO Agent Hub → 治理 → Override</strong> 供效果诊断与规则调优使用。',
      placeholder: '例：AI 派单团队不正确 · 应派应用组...',
      multiline: true,
      hintList: [
        { label: '变更窗口与业务高峰冲突' },
        { label: '分单团队不正确' },
        { label: '优先级低估' },
        { label: '申请人合规风险' },
        { label: 'CMDB 关联错误' }
      ],
      okText: '提交 Override',
      onSubmit: function (reason) {
        var msg = cfg.onOverride ? cfg.onOverride(draft, reason) : null;
        showToast(msg || 'Override 已留痕 · 原因："' + reason + '"', 'warn');
        window.closeL2Drawer();
      }
    });
  };

  function showToast(text, kind) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'l2-toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = text;
    toastEl.className = 'l2-toast ' + (kind || '');
    setTimeout(function () { toastEl.classList.add('show'); }, 10);
    setTimeout(function () { toastEl.classList.remove('show'); }, 3200);
  }
})();

/* ==========================================================================
 * EMS Modal · 全站禁用 alert/confirm/prompt · 统一走 showConfirmModal / showInputModal / showActionModal
 *
 *   window.showConfirmModal({
 *     title, message, iconKind: 'info|warn|danger',
 *     okText, cancelText, onOk, onCancel, danger
 *   })
 *
 *   window.showInputModal({
 *     title, message, placeholder, multiline, defaultValue,
 *     okText, cancelText, hintList: [{ label }...], onSubmit, onCancel
 *   })
 *
 *   window.showActionModal({
 *     title, iconKind, sections: [{heading, html}...],
 *     actions: [{label, kind:'primary|danger|', onClick}]
 *   })
 * ========================================================================== */
(function () {
  'use strict';

  function makeShell() {
    var mask = document.createElement('div');
    mask.className = 'ems-modal-mask';
    var modal = document.createElement('div');
    modal.className = 'ems-modal';
    mask.appendChild(modal);
    document.body.appendChild(mask);
    return { mask: mask, modal: modal };
  }

  function open(mask) { setTimeout(function () { mask.classList.add('open'); }, 10); }
  function close(mask) {
    mask.classList.remove('open');
    setTimeout(function () { if (mask.parentNode) mask.parentNode.removeChild(mask); }, 200);
  }
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var ICONS = {
    info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
    warn: '<svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
    danger: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>'
  };

  window.showConfirmModal = function (cfg) {
    cfg = cfg || {};
    var kind = cfg.iconKind || (cfg.danger ? 'danger' : 'info');
    var shell = makeShell();
    shell.modal.innerHTML = [
      '<div class="ems-modal-head">',
      '  <div class="modal-icon ' + kind + '">' + (ICONS[kind] || ICONS.info) + '</div>',
      '  <div class="modal-title">' + escapeHtml(cfg.title || '确认') + '</div>',
      '  <div class="modal-close">',
      '    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
      '  </div>',
      '</div>',
      '<div class="ems-modal-body">' + (cfg.message || '') + '</div>',
      '<div class="ems-modal-foot">',
      '  <button class="btn" data-role="cancel">' + escapeHtml(cfg.cancelText || '取消') + '</button>',
      '  <button class="btn ' + (cfg.danger ? 'danger' : 'primary') + '" data-role="ok">' + escapeHtml(cfg.okText || '确认') + '</button>',
      '</div>'
    ].join('');
    var doClose = function () { close(shell.mask); };
    shell.modal.querySelector('.modal-close').addEventListener('click', function () { doClose(); if (cfg.onCancel) cfg.onCancel(); });
    shell.modal.querySelector('[data-role=cancel]').addEventListener('click', function () { doClose(); if (cfg.onCancel) cfg.onCancel(); });
    shell.modal.querySelector('[data-role=ok]').addEventListener('click', function () { doClose(); if (cfg.onOk) cfg.onOk(); });
    shell.mask.addEventListener('click', function (e) { if (e.target === shell.mask) { doClose(); if (cfg.onCancel) cfg.onCancel(); } });
    open(shell.mask);
  };

  window.showInputModal = function (cfg) {
    cfg = cfg || {};
    var shell = makeShell();
    var inputHtml = cfg.multiline
      ? '<textarea class="modal-textarea" placeholder="' + escapeHtml(cfg.placeholder || '') + '">' + escapeHtml(cfg.defaultValue || '') + '</textarea>'
      : '<input class="modal-input" placeholder="' + escapeHtml(cfg.placeholder || '') + '" value="' + escapeHtml(cfg.defaultValue || '') + '" />';
    var hints = '';
    if (cfg.hintList && cfg.hintList.length) {
      hints = '<div class="modal-hint-list"><strong>常见原因：</strong> ' + cfg.hintList.map(function (h) { return escapeHtml(h.label); }).join(' · ') + '</div>';
    }
    shell.modal.innerHTML = [
      '<div class="ems-modal-head">',
      '  <div class="modal-icon warn">' + ICONS.warn + '</div>',
      '  <div class="modal-title">' + escapeHtml(cfg.title || '请填写') + '</div>',
      '  <div class="modal-close">',
      '    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
      '  </div>',
      '</div>',
      '<div class="ems-modal-body">',
      '  <div>' + (cfg.message || '') + '</div>',
      '  ' + inputHtml,
      '  ' + hints,
      '</div>',
      '<div class="ems-modal-foot">',
      '  <button class="btn" data-role="cancel">' + escapeHtml(cfg.cancelText || '取消') + '</button>',
      '  <button class="btn primary" data-role="ok">' + escapeHtml(cfg.okText || '提交') + '</button>',
      '</div>'
    ].join('');
    var doClose = function () { close(shell.mask); };
    var getVal = function () {
      var el = shell.modal.querySelector('.modal-input, .modal-textarea');
      return el ? el.value.trim() : '';
    };
    shell.modal.querySelector('.modal-close').addEventListener('click', function () { doClose(); if (cfg.onCancel) cfg.onCancel(); });
    shell.modal.querySelector('[data-role=cancel]').addEventListener('click', function () { doClose(); if (cfg.onCancel) cfg.onCancel(); });
    shell.modal.querySelector('[data-role=ok]').addEventListener('click', function () {
      var v = getVal();
      if (!v) { showToast('请填写内容', 'warn'); return; }
      doClose();
      if (cfg.onSubmit) cfg.onSubmit(v);
    });
    shell.mask.addEventListener('click', function (e) { if (e.target === shell.mask) { doClose(); if (cfg.onCancel) cfg.onCancel(); } });
    open(shell.mask);
    setTimeout(function () {
      var el = shell.modal.querySelector('.modal-input, .modal-textarea');
      if (el) el.focus();
    }, 220);
  };

  window.showActionModal = function (cfg) {
    cfg = cfg || {};
    var shell = makeShell();
    var kind = cfg.iconKind || 'info';
    var body = '';
    (cfg.sections || []).forEach(function (s) {
      body += '<div style="margin-bottom:var(--sp-12)">';
      if (s.heading) body += '<div style="font-size:11px;font-weight:600;color:var(--c-text-3);text-transform:uppercase;letter-spacing:.4px;margin-bottom:var(--sp-8)">' + escapeHtml(s.heading) + '</div>';
      body += '<div>' + (s.html || '') + '</div></div>';
    });
    var footBtns = (cfg.actions || [{ label: '关闭', kind: '' }]).map(function (a, i) {
      return '<button class="btn ' + (a.kind || '') + '" data-idx="' + i + '">' + escapeHtml(a.label) + '</button>';
    }).join('');
    shell.modal.innerHTML = [
      '<div class="ems-modal-head">',
      '  <div class="modal-icon ' + kind + '">' + (ICONS[kind] || ICONS.info) + '</div>',
      '  <div class="modal-title">' + escapeHtml(cfg.title || '') + '</div>',
      '  <div class="modal-close">',
      '    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
      '  </div>',
      '</div>',
      '<div class="ems-modal-body">' + body + '</div>',
      '<div class="ems-modal-foot">' + footBtns + '</div>'
    ].join('');
    var doClose = function () { close(shell.mask); };
    shell.modal.querySelector('.modal-close').addEventListener('click', doClose);
    shell.mask.addEventListener('click', function (e) { if (e.target === shell.mask) doClose(); });
    shell.modal.querySelectorAll('[data-idx]').forEach(function (b) {
      b.addEventListener('click', function () {
        var i = parseInt(b.getAttribute('data-idx'), 10);
        doClose();
        var act = (cfg.actions || [])[i];
        if (act && act.onClick) act.onClick();
      });
    });
    open(shell.mask);
  };
})();

/* ==========================================================================
 * L2 手工确认抽屉 · 场景工厂
 * 提供 M3 派工 / M3 手动建单 / M1 降噪规则申请 三个开箱即用工厂函数
 * 用法：openL2DispatchDrawer(context) 等，context 覆盖默认字段
 * ========================================================================== */
(function () {
  'use strict';

  // ── M3 · FSM 派工 · AI 起草派工方案 ──────────────────────────────
  window.openL2DispatchDrawer = function (ctx) {
    ctx = ctx || {};
    var createWorkOrder = ctx.createWorkOrder === true;
    var fields = createWorkOrder ? [
      { key: 'recommendation', label: 'AI 建单建议', type: 'text', value: ctx.recommendation || '建议创建 FSM 现场工单 · 需要现场检查硬件状态' },
      { key: 'workOrderTitle', label: 'FSM 工单标题', type: 'text', value: ctx.workOrderTitle || 'Web-Server-01 硬件故障现场检查' },
      { key: 'engineer', label: '推荐工程师（可多选）', type: 'multiselect', value: ctx.engineers || ['赵刚', '李伟', '陈浩'], options: ctx.engineerOptions || [
        { value: '赵刚', title: '赵刚 · 高级工程师', match: '匹配度 94%', meta: '技能：服务器硬件 / 散热 / 电源 · 当前：待命，可立即出发 · 距离：2.3 km，ETA 18min · 预计费用：CNY 620' },
        { value: '李伟', title: '李伟 · 中级工程师', match: '匹配度 87%', meta: '技能：服务器硬件 / 电源 · 当前：30min 后可用 · 距离：1.8 km，ETA 35min · 预计费用：CNY 560' },
        { value: '陈浩', title: '陈浩 · 高级工程师', match: '匹配度 81%', meta: '技能：服务器硬件 / 弱电 · 当前：待命，可立即出发 · 距离：6.5 km，ETA 42min · 预计费用：CNY 700' }
      ] },
      { key: 'skill', label: '技能要求', type: 'text', value: ctx.skill || '服务器硬件 · 散热与电源检查' },
      { key: 'eta', label: '预计到达时间', type: 'select', value: ctx.eta || '1 小时', options: ['30 分钟', '1 小时', '2 小时', '4 小时', '次日'] },
      { key: 'priority', label: '优先级', type: 'select', value: ctx.priority || 'P1 紧急', options: ['P1 紧急', 'P2 重要', 'P3 一般', 'P4 计划'] },
      { key: 'note', label: '任务说明 · AI 起草', type: 'textarea', value: ctx.note || '事件持续影响业务，远程处置后仍需现场检查设备散热、电源与硬件健康状态。' }
    ] : [
      { key: 'engineer', label: '推荐工程师', type: 'select', value: ctx.engineer || 'P.Y. Lau · GBA-GZ 待命', options: ['P.Y. Lau · GBA-GZ 待命', 'K.H. Wong · HKT Tower', 'T.K. Yip · 待命', 'M.L. Chan · GBA-SZ', '(手工指派)'] },
      { key: 'skill', label: '技能要求', type: 'text', value: ctx.skill || '硬件维护 · 电力系统认证' },
      { key: 'eta', label: '预计到达时间', type: 'select', value: ctx.eta || '2 小时', options: ['30 分钟', '1 小时', '2 小时', '4 小时', '次日'] },
      { key: 'priority', label: '优先级', type: 'select', value: ctx.priority || 'P1 紧急', options: ['P1 紧急', 'P2 重要', 'P3 一般', 'P4 计划'] },
      { key: 'note', label: '任务说明 · AI 起草', type: 'textarea', value: ctx.note || 'Web-Server-01 CPU 持续 95% · 建议现场检查硬件散热 · 备件已通知库房准备 · 客户联系人：张伟（DC 值班）15912345678' }
    ];
    return window.openL2Drawer({
      kind: 'M3',
      tier: 'L2',
      title: createWorkOrder ? '创建 FSM 工单并派工 · AI 已起草方案' : '派工 · AI 已起草方案',
      meta: [
        { label: createWorkOrder ? '来源事件' : '来源工单', value: ctx.ticketId || 'INC-2024-1128' },
        { label: '客户地点', value: ctx.location || 'HKT-DC-A · 香港数据中心 A 栋' },
        { label: '关联设备', value: ctx.device || 'Web-Server-01' },
        { label: '任务类型', value: ctx.taskType || '硬件故障 · 现场排查' }
      ],
      draft: {
        fields: fields
      },
      evidence: [
        { label: createWorkOrder ? 'AI 建单依据 · 远程处置不足且需要现场操作' : 'AI 派工依据 · 技能/位置/负载三维度', href: '../ai/ai-governance.html' },
        { label: 'CMDB 设备位置 · Web-Server-01 · HKT-DC-A', href: '../cmdb/cmdb-v2-ci-detail.html' },
        { label: '工程师历史工单 · P.Y. Lau · 完成率 96%', href: '../fsm/fsm-dispatch.html' },
        { label: 'AI 调用记录 · DeepSeek V4 · 3.2k in / 0.8k out · ¥0.008', href: '../ai/ai-governance.html' }
      ],
      tips: createWorkOrder ? '确认后创建 FSM 工单、关联来源事件并派工 · 全程记录 T5 审计' : '采纳 AI 派工建议 · Token ¥0.008 · 派工留痕 T5 审计',
      onApprove: function (draft) {
        var engineerValues = Array.isArray(draft.engineer) ? draft.engineer : [draft.engineer || ''];
        var engineer = engineerValues.filter(Boolean).map(function (name) { return name.split(' · ')[0]; }).join('、') || '待指派';
        if (createWorkOrder) {
          var workOrderId = ctx.workOrderId || 'FSM-2026-145';
          if (typeof ctx.onCreated === 'function') ctx.onCreated({ id: workOrderId, title: draft.workOrderTitle, engineer: engineer, eta: draft.eta });
          return '<svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;vertical-align:-2px"><polyline points="20 6 9 17 4 12"/></svg> FSM 工单 ' + workOrderId + ' 已创建并派给 ' + engineer + ' · 已关联来源事件';
        }
        return '<svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;vertical-align:-2px"><polyline points="20 6 9 17 4 12"/></svg> 已派单 ' + engineer + ' · 通知已发送 · 客户短信已推送';
      },
      onOverride: function (draft, reason) {
        return '派工已 Override · 原因："' + reason + '" · 待人工重派';
      }
    });
  };

  // ── M3 · 手动新建工单 · AI 辅助起草 ──────────────────────────────
  window.openL2NewIncidentDrawer = function (ctx) {
    ctx = ctx || {};
    return window.openL2Drawer({
      kind: 'M3',
      tier: 'L2',
      title: '新建工单 · AI 辅助起草',
      meta: [
        { label: '创建人', value: ctx.creator || '值班经理 张伟' },
        { label: '来源', value: ctx.source || '手工创建（非告警触发）' },
        { label: '时间', value: ctx.time || new Date().toLocaleTimeString('zh-CN') }
      ],
      draft: {
        fields: [
          { key: 'title', label: '工单标题', type: 'text', value: ctx.title || '' },
          { key: 'category', label: '分类', type: 'select', value: ctx.category || '基础设施 → 服务器', options: ['基础设施 → 服务器', '基础设施 → 网络', '应用 → API', '数据库', '安全', '服务请求'] },
          { key: 'priority', label: '优先级', type: 'select', value: ctx.priority || 'P2 重要', options: ['P1 紧急', 'P2 重要', 'P3 一般', 'P4 计划'] },
          { key: 'team', label: '派单团队', type: 'select', value: ctx.team || '基础架构组', options: ['基础架构组', '网络运维组', '安全运营组', '数据库组', '应用支持组', 'GBA 运维组'] },
          { key: 'sla', label: 'SLA', type: 'select', value: ctx.sla || 'P2 · 8 小时', options: ['P1 · 4 小时', 'P2 · 8 小时', 'P3 · 24 小时', 'P4 · 3 工作日'] },
          { key: 'desc', label: '描述 · AI 辅助起草（可编辑）', type: 'textarea', value: ctx.desc || '' }
        ]
      },
      evidence: [
        { label: 'CMDB 影响面查询', href: '../cmdb/cmdb-v2-service-mapping.html' },
        { label: '相似历史工单', href: '../itsm/itsm-incidents.html' },
        { label: 'AI 调用记录', href: '../ai/ai-governance.html' }
      ],
      tips: '手工建单也可让 AI 辅助起草 · 采纳率越高 T2 Token 消耗越低',
      onApprove: function (draft) {
        var id = 'INC-2024-' + (1128 + Math.floor(Math.random() * 100));
        return '<svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;vertical-align:-2px"><polyline points="20 6 9 17 4 12"/></svg> 工单 ' + id + ' 已创建 · 派单 ' + draft.team + ' · SLA ' + draft.sla;
      }
    });
  };

  // ── M1 · 降噪规则申请 · AI 建议新规则 · 走 T1 审批 ─────────────────
  window.openL2NoiseRuleDrawer = function (ctx) {
    ctx = ctx || {};
    var isEdit = ctx.mode === 'edit';
    return window.openL2Drawer({
      kind: 'M3',
      tier: 'L1',
      title: isEdit ? '修改降噪规则 · L1 硬编码窄场景 · 修改同样需值班经理审批' : '新增降噪规则 · L1 硬编码窄场景 · 需值班经理审批',
      meta: isEdit ? [
        { label: '规则类型', value: ctx.ruleType || 'AI 关联聚合' },
        { label: '修改内容', value: ctx.changed || '匹配条件 / 作用范围' },
        { label: '预计影响', value: ctx.effect || '变更后每日抑制量将变化，需复核' }
      ] : [
        { label: '规则类型', value: ctx.ruleType || 'AI 关联聚合' },
        { label: 'AI 建议依据', value: ctx.reason || 'OSPF 邻居关系 · 拓扑因果' },
        { label: '预计影响', value: ctx.effect || '提升降噪率 3.2% · 每日多抑制 ~1,024 条噪声' }
      ],
      draft: {
        fields: [
          { key: 'name', label: '规则名称', type: 'text', value: ctx.name || 'OSPF 邻居震荡跨设备关联' },
          { key: 'ruleKind', label: '规则类型', type: 'select', value: ctx.kind || 'AI 关联', options: ['去重', '抑制', '静默', 'AI 关联'] },
          { key: 'match', label: '匹配条件（AI 起草）', type: 'textarea', value: ctx.match || 'source.type == "OSPF" AND\ntopology.parent == same AND\ntimeWindow <= 5min\n→ aggregate as root_event' },
          { key: 'scope', label: '作用范围', type: 'select', value: ctx.scope || '全租户', options: ['全租户', '仅生产环境', '仅指定站点', '仅指定设备类型'] },
          { key: 'note', label: 'AI 说明 · 为什么建议这条规则', type: 'textarea', value: ctx.note || '过去 30 天检测到 12 起 OSPF 邻居震荡事件，均伴随下联接入交换机批量告警。当前规则库未覆盖此拓扑因果。建议新增此关联聚合规则，可显著降低噪声。' }
        ]
      },
      evidence: [
        { label: 'AI 分析历史事件 · 12 起 OSPF 震荡', href: '../itom/alert-noise-reduction.html' },
        { label: 'CMDB OSPF 邻居拓扑', href: '../cmdb/cmdb-v2-relationship-view.html' },
        { label: 'AI 调用记录 · Skills:告警根因分析', href: '../ai/ai-platform.html' }
      ],
      tips: 'L1 规则一旦启用 = AI 直接聚合 · 值班经理审批后立即生效 · 可随时禁用',
      onApprove: function (draft) {
        return '<svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;vertical-align:-2px"><polyline points="20 6 9 17 4 12"/></svg> 规则 "' + draft.name + '" 已启用 · L1 白名单立即生效';
      },
      onOverride: function (draft, reason) {
        return '规则申请已驳回 · 原因："' + reason + '"';
      }
    });
  };
})();

/* ==========================================================================
 * M4 变更审批 · M5 服务请求 抽屉工厂（P4 主线接入）
 * ========================================================================== */
(function () {
  'use strict';

  // ── M4 · 变更审批 · AI 风险评估 + 人工决策 · 永不自动通过 ─────────
  window.openL2ChangeApprovalDrawer = function (ctx) {
    ctx = ctx || {};
    return window.openL2Drawer({
      kind: 'M4',
      tier: 'L2',
      title: '变更审批 · AI 风险评估 · 人工决策',
      meta: [
        { label: '变更单号', value: ctx.changeId || 'CHG-2024-015' },
        { label: '发起人', value: ctx.creator || '王芳（网络组）' },
        { label: '变更窗口', value: ctx.window || '2024-01-20 02:00-04:00' },
        { label: 'AI 风险等级', value: ctx.risk || '中等 45%' }
      ],
      draft: {
        fields: [
          { key: 'decision', label: '你的决策', type: 'select', value: ctx.decision || '批准', options: ['批准', '批准（附条件）', '驳回', '要求补充'] },
          { key: 'category', label: '变更分类', type: 'select', value: ctx.category || '标准变更', options: ['标准变更', '常规变更', '紧急变更'] },
          { key: 'aiRiskSummary', label: 'AI 风险评估摘要（可编辑）', type: 'textarea', value: ctx.aiRisk || 'Switch-Core-01 是数据中心核心，影响 23 个下游设备。\n\n历史类似变更失败率 8%（近 90d 3/38），主要失败原因：\n1. 未预留足够回滚窗口\n2. 变更前未做 OSPF 邻居对齐\n\n建议：\n· 变更执行前 30 min 进行 OSPF 邻居预检\n· 保留 10 min 回滚窗口\n· 通知业务方前 24h 提醒' },
          { key: 'conditions', label: '批准附加条件（可选）', type: 'textarea', value: ctx.conditions || '1. 变更前 30 min 完成 OSPF 邻居预检并附截图\n2. 变更后立即启动 30 min 观察期\n3. 观察期内出现下联设备告警立即回滚' },
          { key: 'comment', label: '审批意见', type: 'textarea', value: ctx.comment || '' }
        ]
      },
      evidence: [
        { label: 'CMDB 影响面分析 · 23 个下联设备', href: '../cmdb/cmdb-v2-impact.html' },
        { label: '相似变更历史 · 近 90 天 38 次 · 失败率 8%', href: '../itsm/change-impact.html' },
        { label: 'AI 风险评估调用记录 · Opus 4.7 · 8.2k in / 2.1k out · ¥0.033', href: '../ai/ai-governance.html' },
        { label: '变更窗口冲突检测 · 无冲突', href: '../itsm/change-impact.html' }
      ],
      tips: 'M4 变更永不自动通过 · 审批决策 100% 由人做 · 完整 T5 审计 + T6 override',
      onApprove: function (draft) {
        var msg = draft.decision === '驳回' ? '已驳回' : '<svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;vertical-align:-2px"><polyline points="20 6 9 17 4 12"/></svg> 已' + (draft.decision || '批准');
        return msg + ' · CHG 已进入变更执行排期 · 通知已发送';
      },
      onOverride: function (draft, reason) {
        return '变更 Override 已留痕 · 原因："' + reason + '"';
      }
    });
  };

  // ── M5 · 服务请求 · AI 起草说明 + 人工审批 or L1 白名单直通 ────────
  window.openL2ServiceRequestDrawer = function (ctx) {
    ctx = ctx || {};
    var isWhiteList = ctx.tier === 'L1';
    var decisionOpts = isWhiteList ? ['自动通过', '批准', '批准（附条件）', '驳回', '要求补充材料'] : ['批准', '批准（附条件）', '驳回', '要求补充材料'];
    var defaultDecision = (ctx.decision && decisionOpts.indexOf(ctx.decision) !== -1) ? ctx.decision : (isWhiteList ? '自动通过' : '批准');
    return window.openL2Drawer({
      kind: 'M5',
      tier: ctx.tier || 'L2',
      title: (isWhiteList ? 'L1 白名单直通 · ' : '') + '服务请求审批 · ' + (ctx.type || 'VPN 申请'),
      meta: [
        { label: '请求单号', value: ctx.requestId || 'SR-2024-0826' },
        { label: '申请人', value: ctx.applicant || '陈明' },
        { label: '类型', value: ctx.type || '权限申请' },
        { label: '风险等级', value: ctx.risk || (isWhiteList ? '低（白名单）' : '中（需人工）') }
      ],
      draft: {
        fields: [
          { key: 'decision', label: '决策', type: 'select', value: defaultDecision, options: decisionOpts },
          {
            key: 'aiSummary', label: 'AI 起草说明（合规检查结果）', type: 'textarea', value: ctx.aiSummary || (isWhiteList
              ? '申请人本部门 VPN 续期 · 合规规则通过：\n· 员工状态活跃\n· 上次访问 3 天内\n· 未触发任何安全事件\n\n建议：直通\n预计执行：AD 账号已创建 · VPN 配置已推送 · 通知已发送'
              : '陈明（研发部）申请 GitHub 组织 admin 权限 · 需人工审批：\n· 跨部门权限（申请人非组织管理员）\n· 上次同类请求 3 天前被驳回（未说明业务用途）\n· 涉及敏感代码仓库 12 个\n\n建议：需要申请人补充业务用途说明后审批')
          },
          { key: 'validDays', label: '权限有效期（天）', type: 'select', value: ctx.validDays || '90', options: ['30', '60', '90', '180', '365', '永久'] },
          { key: 'comment', label: '审批意见', type: 'textarea', value: ctx.comment || '' }
        ]
      },
      evidence: [
        { label: '申请人历史请求 · 12 条 · 通过 10 拒绝 2', href: '../itsm/service-request.html' },
        { label: '合规规则库 · VPN 类型规则 v3.2', href: '../ai/ai-platform.html' },
        { label: '相似请求 · SR-2024-0798（3 天前拒绝）', href: '../itsm/service-request.html' },
        { label: 'AI 调用记录 · DeepSeek V4 · 2.1k in / 0.6k out · ¥0.005', href: '../ai/ai-governance.html' }
      ],
      tips: (isWhiteList ? 'L1 白名单直通 · 客户可随时关闭 · ' : 'L2 高风险 · 100% 人工决策 · ') + 'T5 完整审计 · T2 Token 计入账单',
      onApprove: function (draft) {
        return '<svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;vertical-align:-2px"><polyline points="20 6 9 17 4 12"/></svg> 服务请求 ' + (ctx.requestId || 'SR-2024-0826') + ' 已' + (draft.decision || '批准') + ' · 履约动作已触发 · 通知已发送';
      },
      onOverride: function (draft, reason) {
        return '服务请求 Override 已留痕 · 原因："' + reason + '"';
      }
    });
  };
})();

/* ==========================================================================
 * 数据导入 / 导出 / 新增 · 通用弹窗（按生产环境交互还原）
 *
 *   window.openDataImportModal({ target: '品牌管理' })
 *   window.openDataExportModal({ target: '品牌管理', fields: ['品牌编号 (brandCode)', ...], count: 100 })
 *   window.openDataAddModal({ target: '品牌管理', fields: [{ label: '品牌名称', required: true }, ...] })
 * ========================================================================== */
(function () {
  'use strict';

  var styleInjected = false;
  function injectStyle() {
    if (styleInjected) return;
    styleInjected = true;
    var css = [
      '.dm-mask{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:9000;display:flex;align-items:flex-start;justify-content:center;padding:48px 16px;opacity:0;transition:opacity .18s;overflow:auto;}',
      '.dm-mask.open{opacity:1;}',
      '.dm-modal{background:#fff;border-radius:10px;box-shadow:0 20px 50px rgba(0,0,0,.22);width:640px;max-width:96vw;display:flex;flex-direction:column;transform:translateY(-8px);transition:transform .18s;}',
      '.dm-mask.open .dm-modal{transform:translateY(0);}',
      '.dm-modal.dm-wide{width:860px;}',
      '.dm-head{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid #F3F4F6;}',
      '.dm-title{font-size:15px;font-weight:600;color:#111827;}',
      '.dm-close{border:none;background:none;cursor:pointer;color:#9CA3AF;font-size:18px;line-height:1;padding:2px;}',
      '.dm-close:hover{color:#374151;}',
      '.dm-body{padding:18px 20px;overflow:auto;max-height:70vh;}',
      '.dm-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px 20px;border-top:1px solid #F3F4F6;}',
      '.dm-foot .dm-foot-right{margin-left:auto;display:flex;gap:8px;}',
      '.dm-btn{display:inline-flex;align-items:center;gap:4px;padding:7px 16px;border-radius:6px;font-size:13px;cursor:pointer;border:1px solid transparent;font-family:inherit;}',
      '.dm-btn-primary{background:var(--c-primary,#2563EB);color:#fff;border-color:var(--c-primary,#2563EB);}',
      '.dm-btn-primary:hover{filter:brightness(.94);}',
      '.dm-btn-plain{background:#fff;color:#374151;border-color:#D1D5DB;}',
      '.dm-btn-plain:hover{background:#F9FAFB;}',
      '.dm-label{font-size:13px;color:#374151;margin-bottom:8px;}',
      '.dm-upload{border:1.5px dashed #C7CDD6;border-radius:8px;padding:26px 16px;text-align:center;color:#6B7280;font-size:13px;background:#FAFBFC;cursor:pointer;transition:border-color .15s,background .15s;}',
      '.dm-upload:hover{border-color:var(--c-primary,#2563EB);background:#F5F8FF;}',
      '.dm-upload svg{width:22px;height:22px;stroke:#9CA3AF;fill:none;stroke-width:1.8;display:block;margin:0 auto 8px;}',
      '.dm-upload .dm-file-name{margin-top:8px;color:var(--c-primary,#2563EB);font-weight:500;word-break:break-all;}',
      '.dm-select{width:100%;padding:7px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:13px;background:#fff;color:#374151;font-family:inherit;}',
      '.dm-hint{font-size:12px;color:#9CA3AF;margin-top:6px;}',
      '.dm-search{width:100%;padding:8px 12px;border:1px solid #E5E7EB;border-radius:8px;font-size:13px;background:#F9FAFB;color:#374151;font-family:inherit;margin-bottom:12px;}',
      '.dm-search:focus{outline:none;border-color:var(--c-primary,#2563EB);background:#fff;}',
      '.dm-cols{display:grid;grid-template-columns:1fr 1fr;gap:14px;}',
      '.dm-col-head{display:flex;align-items:center;justify-content:space-between;font-size:12.5px;color:#374151;font-weight:600;margin-bottom:8px;}',
      '.dm-col-head a{color:var(--c-primary,#2563EB);font-size:12px;cursor:pointer;text-decoration:none;font-weight:400;}',
      '.dm-col{border:1px solid #F3F4F6;border-radius:8px;padding:6px;min-height:220px;background:#FCFDFE;}',
      '.dm-field{display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid #F3F4F6;border-radius:6px;background:#fff;margin-bottom:6px;font-size:12.5px;color:#111827;cursor:grab;}',
      '.dm-field .dm-grip{color:#C4CAD3;flex-shrink:0;letter-spacing:-1px;font-size:12px;}',
      '.dm-field .dm-sys{color:#9CA3AF;font-size:11px;}',
      '.dm-field .dm-eye{margin-left:auto;color:#9CA3AF;flex-shrink:0;}',
      '.dm-field .dm-right{margin-left:auto;display:flex;align-items:center;gap:8px;}',
      '.dm-field .dm-gear{color:#9CA3AF;cursor:pointer;font-size:12px;}',
      '.dm-switch{position:relative;display:inline-block;width:28px;height:16px;flex-shrink:0;}',
      '.dm-switch input{opacity:0;width:0;height:0;}',
      '.dm-switch .dm-slider{position:absolute;inset:0;background:#E5E7EB;border-radius:999px;transition:.15s;cursor:pointer;}',
      '.dm-switch .dm-slider:before{content:"";position:absolute;width:12px;height:12px;left:2px;top:2px;background:#fff;border-radius:50%;transition:.15s;}',
      '.dm-switch input:checked + .dm-slider{background:var(--c-primary,#2563EB);}',
      '.dm-switch input:checked + .dm-slider:before{transform:translateX(12px);}',
      '.dm-note{font-size:11px;color:#9CA3AF;margin-top:10px;}',
      '.dm-check{display:flex;align-items:center;gap:7px;font-size:13px;color:#374151;margin-top:10px;cursor:pointer;}',
      '.dm-check input{width:15px;height:15px;accent-color:var(--c-primary,#2563EB);cursor:pointer;}',
      '.dm-section-t{font-size:13px;color:#6B7280;margin:14px 0 6px;}',
      '.dm-filter-ta{width:100%;min-height:56px;padding:8px 12px;border:1px solid #E5E7EB;border-radius:8px;font-size:12.5px;color:#374151;font-family:inherit;resize:vertical;}',
      '.dm-tz-row{display:flex;align-items:center;gap:8px;margin-top:8px;}',
      '.dm-tz-row .dm-select{flex:1;}',
      '.dm-count{font-size:13px;color:#374151;}',
      '.dm-fld{margin-bottom:14px;}',
      '.dm-fld .dm-flabel{display:block;font-size:13px;color:#374151;margin-bottom:6px;}',
      '.dm-fld .dm-flabel .dm-req{color:var(--c-danger,#DC2626);margin-right:2px;}',
      '.dm-input{width:100%;padding:7px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:13px;color:#374151;font-family:inherit;}',
      '.dm-input:focus,.dm-select:focus,.dm-filter-ta:focus{outline:none;border-color:var(--c-primary,#2563EB);box-shadow:0 0 0 3px rgba(37,99,235,.08);}',
      /* 新增弹窗扩展控件：双列布局 / 颜色 / 级联 / 文本域 / 图片 */
      '.dm-add-grid{display:grid;grid-template-columns:1fr 1fr;gap:2px 16px;}',
      '.dm-add-grid .dm-fld.span2{grid-column:1/-1;}',
      '.dm-color-row{display:flex;align-items:center;gap:8px;}',
      '.dm-color-row input[type=color]{width:42px;height:32px;padding:2px;border:1px solid #D1D5DB;border-radius:6px;background:#fff;cursor:pointer;flex-shrink:0;}',
      '.dm-color-swatch{width:32px;height:32px;border-radius:6px;border:1px solid #E5E7EB;flex-shrink:0;}',
      '.dm-color-hex{width:130px;flex-shrink:0;}',
      '.dm-ta{width:100%;min-height:60px;padding:7px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:13px;color:#374151;font-family:inherit;resize:vertical;}',
      '.dm-ta:focus{outline:none;border-color:var(--c-primary,#2563EB);box-shadow:0 0 0 3px rgba(37,99,235,.08);}',
      '.dm-upl{border:1.5px dashed #C7CDD6;border-radius:8px;padding:14px 12px;text-align:center;color:#6B7280;font-size:12.5px;background:#FAFBFC;cursor:pointer;transition:border-color .15s,background .15s;}',
      '.dm-upl:hover{border-color:var(--c-primary,#2563EB);background:#F5F8FF;}',
      '.dm-upl .dm-file-name{margin-top:6px;color:var(--c-primary,#2563EB);font-weight:500;word-break:break-all;}',
      '.dm-casc{position:relative;}',
      '.dm-casc-input{width:100%;padding:7px 28px 7px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:13px;color:#374151;background:#fff;cursor:pointer;user-select:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-sizing:border-box;min-height:32px;}',
      '.dm-casc-input .ph{color:#9CA3AF;}',
      '.dm-casc-arrow{position:absolute;right:10px;top:15px;color:#9CA3AF;font-size:10px;pointer-events:none;}',
      '.dm-casc-panel{position:absolute;left:0;right:0;top:calc(100% + 4px);z-index:60;background:#fff;border:1px solid #E5E7EB;border-radius:8px;box-shadow:0 12px 28px rgba(0,0,0,.14);display:flex;overflow:hidden;}',
      '.dm-casc-col{width:25%;border-right:1px solid #F3F4F6;max-height:210px;overflow:auto;padding:4px 0;}',
      '.dm-casc-col:last-child{border-right:none;}',
      '.dm-casc-opt{padding:7px 12px;font-size:12.5px;color:#374151;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex;justify-content:space-between;align-items:center;gap:4px;}',
      '.dm-casc-opt:hover{background:#F5F8FF;}',
      '.dm-casc-opt.sel{background:#EFF6FF;color:var(--c-primary,#2563EB);font-weight:600;}',
      '.dm-casc-opt .ar{color:#C4CAD3;font-size:10px;}'
    ].join('');
    var s = document.createElement('style');
    s.textContent = css;
    document.head.appendChild(s);
  }

  function shellOf(wide) {
    injectStyle();
    var mask = document.createElement('div');
    mask.className = 'dm-mask';
    var modal = document.createElement('div');
    modal.className = 'dm-modal' + (wide ? ' dm-wide' : '');
    mask.appendChild(modal);
    document.body.appendChild(mask);
    setTimeout(function () { mask.classList.add('open'); }, 10);
    return { mask: mask, modal: modal };
  }
  function shut(mask) {
    mask.classList.remove('open');
    setTimeout(function () { if (mask.parentNode) mask.parentNode.removeChild(mask); }, 200);
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function headHtml(title) {
    return '<div class="dm-head"><div class="dm-title">' + esc(title) + '</div>' +
      '<button class="dm-close" data-role="x">\u00d7</button></div>';
  }
  function bindClose(mask, modal, onClose) {
    var f = function () { shut(mask); if (onClose) onClose(); };
    modal.querySelector('[data-role=x]').addEventListener('click', f);
    mask.addEventListener('click', function (e) { if (e.target === mask) f(); });
  }
  var GRIP = '<span class="dm-grip">\u2261</span>';
  var GEAR = '<span class="dm-gear" title="字段设置">\u2699</span>';
  var EYE = '<svg class="dm-eye" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" stroke-width="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>';
  var SYS_FIELDS = ['Record ID (recordID)', 'Owned by (ownedBy)', 'Created by (createdBy)', 'Created at (createdAt)', 'Updated by (updatedBy)', 'Updated at (updatedAt)'];

  /* ── 导入弹窗 ─────────────────────────────────────────── */
  window.openDataImportModal = function (cfg) {
    cfg = cfg || {};
    var sh = shellOf(false);
    sh.modal.innerHTML =
      headHtml('导入到' + esc(cfg.target || '')) +
      '<div class="dm-body">' +
      '  <div class="dm-label">上传要导入的文件（.csv 或 JSON 或 .xlsx 格式）</div>' +
      '  <div class="dm-upload" data-role="upload">' +
      '    <svg viewBox="0 0 24 24"><path d="M20 16.6A4.5 4.5 0 0017.5 8h-1.2A7 7 0 104 14.9"/><path d="M12 12v9"/><path d="M8 16l4-4 4 4"/></svg>' +
      '    <div>单击或拖放文件到此处进行上传（.csv 或 JSON 或 .xlsx）</div>' +
      '    <div class="dm-file-name" data-role="fname" style="display:none"></div>' +
      '  </div>' +
      '  <input type="file" accept=".csv,.json,.xlsx" style="display:none" data-role="file" />' +
      '  <div class="dm-label" style="margin-top:16px">如果任何记录导入失败</div>' +
      '  <select class="dm-select" data-role="fail">' +
      '    <option>取消导入</option><option>跳过该条并继续</option><option>仅记录错误并继续</option>' +
      '  </select>' +
      '  <div class="dm-hint">导入完成后可在列表页刷新查看结果；字段将按名称自动匹配。</div>' +
      '</div>' +
      '<div class="dm-foot"><span class="dm-hint" data-role="step">\u7b2c 1 \u6b65 \u00b7 \u4e0a\u4f20\u6587\u4ef6</span>' +
      '<div class="dm-foot-right"><button class="dm-btn dm-btn-primary" data-role="next">\u4e0b\u4e00\u9875</button></div></div>';
    var fileInput = sh.modal.querySelector('[data-role=file]');
    var fname = sh.modal.querySelector('[data-role=fname]');
    sh.modal.querySelector('[data-role=upload]').addEventListener('click', function () { fileInput.click(); });
    sh.modal.querySelector('[data-role=upload]').addEventListener('dragover', function (e) { e.preventDefault(); });
    sh.modal.querySelector('[data-role=upload]').addEventListener('drop', function (e) {
      e.preventDefault();
      if (e.dataTransfer.files.length) showFile(e.dataTransfer.files[0].name);
    });
    fileInput.addEventListener('change', function () {
      if (fileInput.files.length) showFile(fileInput.files[0].name);
    });
    function showFile(n) {
      fname.style.display = 'block';
      fname.textContent = n;
      sh.modal.querySelector('[data-role=next]').textContent = '开始导入';
      sh.modal.querySelector('[data-role=step]').textContent = '第 2 步 · 确认导入';
    }
    sh.modal.querySelector('[data-role=next]').addEventListener('click', function () {
      if (!fname.style.display || fname.style.display === 'none') {
        showToast('请先上传要导入的文件', 'warn');
        return;
      }
      shut(sh.mask);
      showToast('已开始导入「' + (cfg.target || '') + '」· 完成后可刷新列表查看', 'ok');
    });
    bindClose(sh.mask, sh.modal);
  };

  /* ── 导出弹窗 ─────────────────────────────────────────── */
  window.openDataExportModal = function (cfg) {
    cfg = cfg || {};
    var fields = (cfg.fields && cfg.fields.length) ? cfg.fields.slice() : ['名称 (name)'];
    var count = cfg.count || 0;
    var avail = SYS_FIELDS.slice();
    var chosen = fields.slice();
    var sh = shellOf(true);

    function fieldRow(name, sys) {
      if (sys) {
        return '<div class="dm-field">' + GRIP + '<span><b>' + esc(name.split(' (')[0]) + '</b> <span class="dm-sys">(' + esc(name.split(' (')[1] || '') + '\uff09</span></span><span class="dm-right"><svg viewBox="0 0 24 24" width="13" height="13" stroke="#C4CAD3" fill="none" stroke-width="2" style="transform:rotate(45deg)"><path d="M12 3v18M3 12h18"/></svg></span></div>';
      }
      return '<div class="dm-field">' + GRIP +
        '<span><b>' + esc(name.split(' (')[0]) + '</b> (' + esc(name.split(' (')[1] || '') + '</span>' +
        '<span class="dm-right">' +
        '<label class="dm-switch"><input type="checkbox" checked><span class="dm-slider"></span></label>' +
        '<label class="dm-switch"><input type="checkbox"><span class="dm-slider"></span></label>' +
        '<label class="dm-switch"><input type="checkbox" checked><span class="dm-slider"></span></label>' +
        GEAR + EYE + '</span></div>';
    }
    function render() {
      var kw = (sh.modal.querySelector('[data-role=kw]') || { value: '' }).value.trim();
      var availHtml = avail.filter(function (f) { return !kw || f.toLowerCase().indexOf(kw.toLowerCase()) > -1; }).map(function (f) { return fieldRow(f, true); }).join('') || '<div class="dm-hint" style="padding:8px">无匹配字段</div>';
      var chosenHtml = chosen.map(function (f) { return fieldRow(f, false); }).join('') || '<div class="dm-hint" style="padding:8px">尚未选择字段</div>';
      sh.modal.querySelector('[data-role=avail]').innerHTML = availHtml;
      sh.modal.querySelector('[data-role=chosen]').innerHTML = chosenHtml;
      sh.modal.querySelectorAll('[data-role=avail] .dm-field').forEach(function (el) {
        el.addEventListener('click', function () {
          var label = el.textContent.replace(/[\u2261\u2699]/g, '').trim();
          for (var i = 0; i < avail.length; i++) {
            if (label.indexOf(avail[i].split(' (')[0]) === 0) { chosen.push(avail.splice(i, 1)[0]); break; }
          }
          render();
        });
      });
      sh.modal.querySelector('[data-role=count]').textContent = '共 ' + count + ' 条记录可供导出';
    }
    sh.modal.innerHTML =
      headHtml('导出') +
      '<div class="dm-body">' +
      '  <div class="dm-label">*选择要导出的字段</div>' +
      '  <input class="dm-search" placeholder="在此处理以在模块字段中进行搜索" data-role="kw" />' +
      '  <div class="dm-cols">' +
      '    <div><div class="dm-col-head"><span>可用字段</span><a data-role="all">\u5168\u9009</a></div><div class="dm-col" data-role="avail"></div></div>' +
      '    <div><div class="dm-col-head"><span>选定字段</span><a data-role="none">\u5168\u90e8\u53d6\u6d88\u9009\u62e9</a></div><div class="dm-col" data-role="chosen"></div></div>' +
      '  </div>' +
      '  <div class="dm-note">*CSV 导出限制：仅导出多选字段中的第一个值</div>' +
      '  <label class="dm-check"><input type="checkbox" checked data-role="allrec">导出所有记录</label>' +
      '  <label class="dm-check"><input type="checkbox" data-role="daterange">日期范围</label>' +
      '  <div class="dm-section-t">记录过滤器</div>' +
      '  <textarea class="dm-filter-ta" placeholder="字段 1 = 1 且 字段 2 = 232"></textarea>' +
      '  <label class="dm-check"><input type="checkbox" checked data-role="tz">导出时区</label>' +
      '  <div class="dm-tz-row" data-role="tzrow"><select class="dm-select"><option>(GMT+08:00) Hong Kong</option><option>(GMT+08:00) \u4e2d\u56fd\u6807\u51c6\u65f6\u95f4</option><option>(GMT+00:00) UTC</option></select></div>' +
      '  <label class="dm-check"><input type="checkbox">展示内容</label>' +
      '  <label class="dm-check"><input type="checkbox" checked>展示标题</label>' +
      '</div>' +
      '<div class="dm-foot"><span class="dm-count" data-role="count"></span>' +
      '<div class="dm-foot-right">' +
      '<button class="dm-btn dm-btn-plain" data-fmt="JSON">JSON 导出</button>' +
      '<button class="dm-btn dm-btn-plain" data-fmt="CSV">CSV 导出</button>' +
      '<button class="dm-btn dm-btn-primary" data-fmt="XLSX">XLSX 导出</button>' +
      '</div></div>';
    sh.modal.querySelector('[data-role=kw]').addEventListener('input', render);
    sh.modal.querySelector('[data-role=all]').addEventListener('click', function () {
      chosen = chosen.concat(avail); avail = []; render();
    });
    sh.modal.querySelector('[data-role=none]').addEventListener('click', function () {
      avail = avail.concat(chosen); chosen = []; render();
    });
    sh.modal.querySelector('[data-role=daterange]').addEventListener('change', function (e) {
      showToast(e.target.checked ? '已启用日期范围过滤（原型演示）' : '已关闭日期范围过滤');
    });
    sh.modal.querySelectorAll('[data-fmt]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (!chosen.length) { showToast('请先选择要导出的字段', 'warn'); return; }
        shut(sh.mask);
        showToast('已通过 ' + b.getAttribute('data-fmt') + ' 导出「' + (cfg.target || '') + '」' + chosen.length + ' 个字段 \u00b7 ' + count + ' 条记录', 'ok');
      });
    });
    bindClose(sh.mask, sh.modal);
    render();
  };

  /* ── 新增记录弹窗 ─────────────────────────────────────── */
  /* 区域级联数据：国家 → 省 → 市 → 地区（4 层） */
  var ADD_REGIONS = {
    '中国': {
      '广东省': { '深圳市': ['南山区', '福田区', '宝安区', '龙岗区'], '广州市': ['天河区', '越秀区', '海珠区', '黄埔区'] },
      '江苏省': { '南京市': ['玄武区', '鼓楼区', '建邺区'], '苏州市': ['姑苏区', '虎丘区', '吴中区'] },
      '浙江省': { '杭州市': ['西湖区', '滨江区', '余杭区'], '宁波市': ['海曙区', '江北区', '鄞州区'] },
      '北京市': { '北京市': ['东城区', '西城区', '朝阳区', '海淀区'] },
      '上海市': { '上海市': ['黄浦区', '徐汇区', '浦东新区', '静安区'] },
      '中国香港': { '中国香港': ['香港岛', '九龙', '新界'] }
    },
    '新加坡': { '新加坡': { '新加坡': ['中心区', '裕廊东', '樟宜'] } }
  };

  function addFieldControl(f, i) {
    var id = ' data-fld="' + i + '"';
    if (f.type === 'select') {
      return '<select class="dm-select"' + id + '>' + (f.options || []).map(function (o) { return '<option>' + esc(o) + '</option>'; }).join('') + '</select>';
    }
    if (f.type === 'textarea') {
      return '<textarea class="dm-ta"' + id + ' placeholder="' + esc(f.placeholder || '请输入' + f.label) + '"></textarea>';
    }
    if (f.type === 'color') {
      var def = f['default'] || '#10B981';
      return '<div class="dm-color-row"' + id + ' data-val="' + def + '">' +
        '<input type="color" value="' + def + '" data-role="pick" title="选择颜色">' +
        '<span class="dm-color-swatch" data-role="swatch" style="background:' + def + '"></span>' +
        '<input class="dm-input dm-color-hex" data-role="hex" value="' + def + '" />' +
        '<span class="dm-hint" style="margin-top:0">状态标签将按此颜色展示</span></div>';
    }
    if (f.type === 'cascader') {
      return '<div class="dm-casc"' + id + ' data-val="">' +
        '<div class="dm-casc-input" data-role="cinput"><span class="ph">' + esc(f.placeholder || '请选择 国家 / 省 / 市 / 地区') + '</span></div>' +
        '<span class="dm-casc-arrow">▼</span>' +
        '<div class="dm-casc-panel" data-role="cpanel" style="display:none"></div></div>';
    }
    if (f.type === 'image') {
      return '<div' + id + ' data-val="">' +
        '<div class="dm-upl" data-role="imgupl">单击或拖放图片到此处上传（jpg / png / svg）' +
        '<div class="dm-file-name" data-role="imgname" style="display:none"></div></div>' +
        '<input type="file" accept="image/*" style="display:none" data-role="imgfile" /></div>';
    }
    return '<input class="dm-input"' + id + ' placeholder="' + esc(f.placeholder || '请输入' + f.label) + '" />';
  }

  function setupCascader(wrap) {
    var input = wrap.querySelector('[data-role=cinput]');
    var panel = wrap.querySelector('[data-role=cpanel]');
    var sel = [null, null, null, null];
    function renderPanel() {
      var PLACEHOLDER = '<div class="dm-casc-empty" style="padding:20px 10px;color:#9CA3AF;font-size:12px;text-align:center;">请先选择上一级</div>';
      var html = '';
      var node = ADD_REGIONS;
      for (var c = 0; c < 4; c++) {
        var keys = node == null ? [] : (Array.isArray(node) ? node : Object.keys(node));
        html += '<div class="dm-casc-col">';
        if (!keys.length) {
          html += PLACEHOLDER;
        } else {
          for (var k = 0; k < keys.length; k++) {
            var name = keys[k];
            html += '<div class="dm-casc-opt' + (sel[c] === name ? ' sel' : '') + '" data-c="' + c + '" data-k="' + esc(name) + '">' +
              esc(name) + (c < 3 ? '<span class="ar">›</span>' : '') + '</div>';
          }
        }
        html += '</div>';
        if (node == null || sel[c] == null || typeof node[sel[c]] !== 'object') node = null;
        else node = node[sel[c]];
      }
      panel.innerHTML = html;
      Array.prototype.forEach.call(panel.querySelectorAll('.dm-casc-opt'), function (opt) {
        opt.addEventListener('click', function () {
          var c = +opt.getAttribute('data-c');
          var key = opt.getAttribute('data-k');
          sel = sel.slice(0, c);
          sel[c] = key;
          for (var r = c + 1; r < 4; r++) sel[r] = null;
          if (c === 3) {
            var path = sel.filter(Boolean);
            wrap.setAttribute('data-val', path.join(' / '));
            input.innerHTML = esc(path.join(' / '));
            panel.style.display = 'none';
          } else {
            renderPanel();
          }
        });
      });
    }
    input.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = panel.style.display !== 'none';
      panel.style.display = open ? 'none' : 'flex';
      if (!open) renderPanel();
    });
  }

  window.openDataAddModal = function (cfg) {
    cfg = cfg || {};
    var fields = cfg.fields || [{ label: '名称', required: true }];
    var sh = shellOf(false);
    var inner = fields.map(function (f, i) {
      var cls = 'dm-fld' + (cfg.cols === 2 ? (f.span2 ? ' span2' : '') : '');
      return '<div class="' + cls + '"><label class="dm-flabel">' + (f.required ? '<span class="dm-req">*</span>' : '') + esc(f.label) +
        (f.type === 'cascader' ? '（国家 / 省 / 市 / 地区，支持 4 层）' : '') + '</label>' + addFieldControl(f, i) + '</div>';
    }).join('');
    sh.modal.innerHTML =
      headHtml('新增' + esc(cfg.target || '记录')) +
      '<div class="dm-body"' + (cfg.cols === 2 ? ' style="display:grid;grid-template-columns:1fr 1fr;gap:2px 16px;"' : '') + '>' + inner + '</div>' +
      '<div class="dm-foot"><span class="dm-hint">带 * 为必填项</span>' +
      '<div class="dm-foot-right">' +
      '<button class="dm-btn dm-btn-plain" data-role="cancel">取消</button>' +
      '<button class="dm-btn dm-btn-primary" data-role="save">保存</button>' +
      '</div></div>';
    /* 颜色选择器联动 */
    Array.prototype.forEach.call(sh.modal.querySelectorAll('.dm-color-row'), function (row) {
      var pick = row.querySelector('[data-role=pick]');
      var hex = row.querySelector('[data-role=hex]');
      var swatch = row.querySelector('[data-role=swatch]');
      function apply(v) {
        if (!/^#[0-9a-fA-F]{6}$/.test(v)) return;
        pick.value = v; hex.value = v;
        swatch.style.background = v;
        row.setAttribute('data-val', v);
      }
      pick.addEventListener('input', function () { apply(pick.value); });
      hex.addEventListener('input', function () { apply(hex.value.trim()); });
    });
    /* 图片上传 */
    Array.prototype.forEach.call(sh.modal.querySelectorAll('[data-role=imgupl]'), function (zone) {
      var wrap = zone.parentNode;
      var file = wrap.querySelector('[data-role=imgfile]');
      var nameEl = wrap.querySelector('[data-role=imgname]');
      zone.addEventListener('click', function () { file.click(); });
      zone.addEventListener('dragover', function (e) { e.preventDefault(); });
      zone.addEventListener('drop', function (e) {
        e.preventDefault();
        if (e.dataTransfer.files.length) show(e.dataTransfer.files[0].name);
      });
      file.addEventListener('change', function () { if (file.files.length) show(file.files[0].name); });
      function show(n) {
        nameEl.style.display = 'block';
        nameEl.textContent = n;
        wrap.setAttribute('data-val', n);
      }
    });
    /* 区域级联 */
    Array.prototype.forEach.call(sh.modal.querySelectorAll('.dm-casc'), setupCascader);
    /* 点击弹窗其他区域时收起级联面板（点击目标已被重渲染脱离 DOM 时跳过，避免误关） */
    sh.modal.addEventListener('click', function (e) {
      if (!e.target.isConnected) return;
      Array.prototype.forEach.call(sh.modal.querySelectorAll('.dm-casc-panel'), function (p) {
        if (!p.parentNode.contains(e.target)) p.style.display = 'none';
      });
    });
    sh.modal.querySelector('[data-role=cancel]').addEventListener('click', function () { shut(sh.mask); });
    sh.modal.querySelector('[data-role=save]').addEventListener('click', function () {
      for (var i = 0; i < fields.length; i++) {
        if (fields[i].required) {
          var el = sh.modal.querySelector('[data-fld="' + i + '"]');
          var v = el.hasAttribute('data-val') ? (el.getAttribute('data-val') || '') : el.value;
          if (!String(v).trim()) { showToast('请填写「' + fields[i].label + '」', 'warn'); el.focus(); return; }
        }
      }
      shut(sh.mask);
      showToast('「' + (cfg.target || '') + '」记录已保存', 'ok');
    });
    bindClose(sh.mask, sh.modal);
    setTimeout(function () {
      var first = sh.modal.querySelector('.dm-input, .dm-select');
      if (first) first.focus();
    }, 220);
  };
})();

/* ==========================================================================
 * EMS 列筛选 + 列排序（Corteza record list 风格）
 *
 * 筛选条件与表格表头行合并：每个字段列的表头同时承载
 *   - .sort-icon（排序：点击在 升序 ↑ / 降序 ↓ / 取消 间切换）
 *   - .filter-icon 或 .th-filter（筛选：点击弹出该列的筛选面板）
 *
 * 通过 document 级事件委托全局生效，无需修改各列表页 HTML。
 * ========================================================================== */
(function () {
  'use strict';
  if (window.__emsColFilterInit) return;
  window.__emsColFilterInit = true;

  var css = [
    '.col-filter-panel{position:fixed;z-index:9800;width:248px;background:#fff;border:1px solid #E5E7EB;border-radius:8px;box-shadow:0 10px 28px rgba(15,23,42,.16);font-size:13px;color:#374151;}',
    '.col-filter-panel .cfp-head{padding:10px 12px;border-bottom:1px solid #F3F4F6;font-weight:600;color:#111827;}',
    '.col-filter-panel .cfp-body{padding:12px;}',
    '.col-filter-panel .cfp-row{margin-bottom:8px;}',
    '.col-filter-panel .cfp-row:last-child{margin-bottom:0;}',
    '.col-filter-panel select,.col-filter-panel input{width:100%;box-sizing:border-box;padding:7px 10px;border:1px solid #D1D5DB;border-radius:6px;font-size:13px;color:#374151;background:#fff;outline:none;}',
    '.col-filter-panel input:focus,.col-filter-panel select:focus{border-color:var(--c-primary,#2563EB);}',
    '.col-filter-panel input:disabled{background:#F9FAFB;color:#9CA3AF;}',
    '.col-filter-panel .cfp-actions{display:flex;justify-content:flex-end;gap:8px;padding:10px 12px;border-top:1px solid #F3F4F6;}',
    '.col-filter-panel .cfp-btn{padding:6px 12px;border-radius:6px;font-size:13px;cursor:pointer;border:1px solid #D1D5DB;background:#fff;color:#374151;}',
    '.col-filter-panel .cfp-btn:hover{background:#F9FAFB;}',
    '.col-filter-panel .cfp-btn.primary{background:var(--c-primary,#2563EB);border-color:var(--c-primary,#2563EB);color:#fff;}',
    '.col-filter-panel .cfp-btn.primary:hover{filter:brightness(1.05);}',
    '.data-table th .sort-icon.active{color:var(--c-primary,#2563EB);}',
    '.data-table th .filter-icon.active,.data-table th .th-filter.active{color:var(--c-primary,#2563EB);}'
  ].join('\n');
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var panel = null;

  function closePanel() {
    if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
    panel = null;
  }

  function colIndex(th) {
    return Array.prototype.indexOf.call(th.parentNode.children, th);
  }

  function cellText(tr, idx) {
    var cells = tr.children;
    if (cells.length <= idx) return '';
    return (cells[idx].textContent || '').trim();
  }

  function sortValue(text) {
    var t = text.replace(/\s/g, '');
    if (t !== '' && /^-?[\d.,]+$/.test(t)) { var n = parseFloat(t.replace(/,/g, '')); if (!isNaN(n)) return n; }
    return text;
  }

  function handleSort(th) {
    var table = th.closest('table');
    if (!table) return;
    var tbody = table.querySelector('tbody');
    if (!tbody) return;
    var idx = colIndex(th);
    var dir = th.getAttribute('data-sort');
    var next = dir === 'asc' ? 'desc' : 'asc';

    Array.prototype.forEach.call(table.querySelectorAll('th'), function (t) {
      if (t !== th) {
        t.removeAttribute('data-sort');
        var si = t.querySelector('.sort-icon');
        if (si) { si.classList.remove('active'); si.textContent = '⇅'; }
      }
    });

    var rows = Array.prototype.slice.call(tbody.querySelectorAll('tr'));
    rows.sort(function (a, b) {
      var av = sortValue(cellText(a, idx));
      var bv = sortValue(cellText(b, idx));
      if (av < bv) return -1;
      if (av > bv) return 1;
      return 0;
    });
    if (next === 'desc') rows.reverse();
    rows.forEach(function (r) { tbody.appendChild(r); });

    th.setAttribute('data-sort', next);
    var si = th.querySelector('.sort-icon');
    if (si) { si.classList.add('active'); si.textContent = next === 'asc' ? '↑' : '↓'; }
  }

  function testMatch(op, val, text) {
    val = (val || '').toLowerCase();
    text = (text || '').toLowerCase();
    switch (op) {
      case 'equals': return text === val;
      case 'notEquals': return text !== val;
      case 'startsWith': return text.indexOf(val) === 0;
      case 'endsWith': return val !== '' && text.lastIndexOf(val) === text.length - val.length;
      case 'empty': return text === '';
      case 'notEmpty': return text !== '';
      default: return text.indexOf(val) !== -1;
    }
  }

  function markColumn(th, active) {
    var fi = th.querySelector('.filter-icon, .th-filter');
    if (fi) { if (active) fi.classList.add('active'); else fi.classList.remove('active'); }
  }

  function applyFilter(th, op, val) {
    var table = th.closest('table');
    if (!table) return;
    var tbody = table.querySelector('tbody');
    if (!tbody) return;
    var idx = colIndex(th);
    var matched = 0;
    Array.prototype.forEach.call(tbody.querySelectorAll('tr'), function (tr) {
      var m = testMatch(op, val, cellText(tr, idx));
      tr.style.display = m ? '' : 'none';
      if (m) matched++;
    });
    th.setAttribute('data-filter', op + ':' + val);
    markColumn(th, true);
    if (typeof window.showToast === 'function') {
      window.showToast('已筛选「' + th.textContent.replace(/[⇅▽↑↓🔽]/g, '').trim() + '」：匹配 ' + matched + ' 条');
    }
  }

  function clearFilter(th) {
    var table = th.closest('table');
    if (table) {
      var tbody = table.querySelector('tbody');
      if (tbody) Array.prototype.forEach.call(tbody.querySelectorAll('tr'), function (tr) { tr.style.display = ''; });
    }
    th.removeAttribute('data-filter');
    markColumn(th, false);
  }

  function openPanel(th, fi) {
    closePanel();
    var rect = fi.getBoundingClientRect();
    var colName = th.textContent.replace(/[⇅▽↑↓🔽]/g, '').trim();
    panel = document.createElement('div');
    panel.className = 'col-filter-panel';
    panel.innerHTML =
      '<div class="cfp-head">筛选 · ' + colName + '</div>' +
      '<div class="cfp-body">' +
      '  <div class="cfp-row"><select class="cfp-op">' +
      '    <option value="contains">包含</option>' +
      '    <option value="equals">等于</option>' +
      '    <option value="notEquals">不等于</option>' +
      '    <option value="startsWith">开头是</option>' +
      '    <option value="endsWith">结尾是</option>' +
      '    <option value="empty">为空</option>' +
      '    <option value="notEmpty">非空</option>' +
      '  </select></div>' +
      '  <div class="cfp-row"><input class="cfp-val" placeholder="输入筛选值" /></div>' +
      '</div>' +
      '<div class="cfp-actions">' +
      '  <button class="cfp-btn" data-act="clear">清除筛选</button>' +
      '  <button class="cfp-btn primary" data-act="apply">应用</button>' +
      '</div>';
    document.body.appendChild(panel);

    var pw = panel.offsetWidth, ph = panel.offsetHeight;
    var x = rect.left, y = rect.bottom + 4;
    if (x + pw > window.innerWidth - 8) x = window.innerWidth - pw - 8;
    if (y + ph > window.innerHeight - 8) y = rect.top - ph - 4;
    if (x < 8) x = 8;
    if (y < 8) y = 8;
    panel.style.left = x + 'px';
    panel.style.top = y + 'px';

    var valInput = panel.querySelector('.cfp-val');
    var opSel = panel.querySelector('.cfp-op');

    panel.addEventListener('click', function (e) {
      var act = e.target.getAttribute && e.target.getAttribute('data-act');
      if (act === 'apply') { applyFilter(th, opSel.value, valInput.value); closePanel(); }
      else if (act === 'clear') { clearFilter(th); closePanel(); }
    });
    valInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { applyFilter(th, opSel.value, valInput.value); closePanel(); }
    });
    opSel.addEventListener('change', function () {
      valInput.disabled = opSel.value === 'empty' || opSel.value === 'notEmpty';
    });

    // 恢复该列已有筛选值
    var prev = th.getAttribute('data-filter');
    if (prev) {
      var p = prev.split(':');
      var prevOp = p[0], prevVal = p.slice(1).join(':');
      if (opSel.querySelector('option[value="' + prevOp + '"]')) opSel.value = prevOp;
      valInput.value = prevVal || '';
      valInput.disabled = prevOp === 'empty' || prevOp === 'notEmpty';
    }
    valInput.focus();
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) { if (panel && panel.parentNode) closePanel(); return; }
    var fi = t.closest('.filter-icon, .th-filter');
    var si = t.closest('.sort-icon');
    if (fi) {
      var th = fi.closest('th');
      if (th) { e.stopPropagation(); openPanel(th, fi); return; }
    }
    if (si) {
      var th2 = si.closest('th');
      if (th2) { e.stopPropagation(); handleSort(th2); return; }
    }
    if (panel && !panel.contains(t)) closePanel();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closePanel();
  });
})();

/* ==========================================================================
 * EMS 列表行操作菜单（... 下拉）
 * 所有 data-table 表格行的操作列统一由事件委托控制，页面只需保留 DOM 结构。
 * ========================================================================== */
(function () {
  'use strict';
  if (window.__emsRowMenuInit) return;
  window.__emsRowMenuInit = true;

  var css = [
    '.row-actions{position:relative;text-align:right;}',
    '.row-actions .more-btn{visibility:hidden;width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;border:1px solid transparent;border-radius:6px;background:transparent;color:#6B7280;cursor:pointer;font-size:16px;line-height:1;padding:0;}',
    '.data-table tr:hover .more-btn{visibility:visible;background:#fff;border-color:#E5E7EB;}',
    '.row-actions .more-btn:hover{background:#F3F4F6;}',
    '.dropdown-menu{position:absolute;right:0;top:32px;background:#fff;border:1px solid #E5E7EB;border-radius:8px;box-shadow:0 8px 24px rgba(15,23,42,.14);z-index:9000;min-width:100px;display:none;padding:4px 0;}',
    '.dropdown-menu.open{display:block;}',
    '.dropdown-item{padding:7px 12px;font-size:13px;color:#374151;cursor:pointer;white-space:nowrap;}',
    '.dropdown-item:hover{background:#F9FAFB;}',
    '.dropdown-item.delete{color:#DC2626;}'
  ].join('\n');
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  function closeAll() {
    Array.prototype.forEach.call(document.querySelectorAll('.dropdown-menu.open'), function (m) { m.classList.remove('open'); });
  }

  window.toggleRowMenu = function (btn) {
    var menu = btn.nextElementSibling;
    if (!menu || !menu.classList.contains('dropdown-menu')) return;
    var isOpen = menu.classList.contains('open');
    closeAll();
    if (!isOpen) menu.classList.add('open');
  };

  document.addEventListener('click', function (e) {
    var item = e.target.closest ? e.target.closest('.dropdown-item') : null;
    if (item) {
      e.stopPropagation();
      var action = item.getAttribute('data-action') || item.textContent.trim();
      var row = item.closest('tr');
      if (action === 'delete') {
        if (window.showConfirmModal) {
          showConfirmModal({
            title: '删除确认',
            message: '确认删除该记录？删除后不可恢复。',
            danger: true,
            okText: '删除',
            onOk: function () {
              if (row) row.parentNode.removeChild(row);
              if (window.showToast) showToast('记录已删除');
            }
          });
        } else {
          if (row) row.parentNode.removeChild(row);
        }
      } else if (action === 'edit') {
        var href = item.getAttribute('data-href');
        if (href) location.href = href;
        else if (window.showToast) showToast('编辑操作');
      } else {
        if (window.showToast) showToast('操作：' + action);
      }
      closeAll();
      return;
    }
    if (e.target.closest && e.target.closest('.row-actions')) return;
    closeAll();
  });
})();
