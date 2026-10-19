/* ═══════════════════════════════════════════════════════════════
   Agent KPI 达成数据 + 调用分布（唯一数据源 · 2026-08-28 数据同源化）
   使用方：portal/dashboard.html NEO Agent Hub Tab
     renderAgentKpiTable() → 14 Agent KPI 达成表
     renderAgentCallDist() → Agent 调用分布卡
   权威对齐：design/13-ai-agent-mcp-catalog.md（14 Agent 目录）
   EMS_EMBED（产品页面埋点数据）使用方：ems-agent-embed.js（产品页面 Agent 状态条）
   变更流程：先更新权威 Agent 目录文档，再同步本文件，dashboard 自动渲染
   ═══════════════════════════════════════════════════════════════ */
/* Agent 调用分布（占比 · 与治理 T2 总调用量 387,124 同口径） */
var AGENT_CALL_DIST = [
  { name: '告警降噪', pct: 24, color: '#3b82f6' },
  { name: '根因分析', pct: 18, color: '#8b5cf6' },
  { name: '工单起草', pct: 13, color: '#dc2626' },
  { name: 'NEO Agent', pct: 10, color: '#db2777' },
  { name: '知识检索 A2', pct: 8, color: '#7c3aed' },
  { name: '风险评估 A4', pct: 6, color: '#e11d48' },
  { name: '摘要生成 A3', pct: 5, color: '#ea580c' },
  { name: '文本理解 A1', pct: 5, color: '#0891b2' },
  { name: '链路健康', pct: 4, color: '#0ea5e9' },
  { name: '调度推荐 A7', pct: 3, color: '#475569' },
  { name: '对话助手 A6', pct: 2, color: '#ca8a04' },
  { name: '数据巡检 A5', pct: 1, color: '#16a34a' },
  { name: '资产巡检', pct: 0.5, color: '#64748b' },
  { name: '容量预测', pct: 0.5, color: '#a855f7' }
];

function renderAgentCallDist() {
  var list = document.getElementById('agentCallDist');
  if (!list || !window.AGENT_CALL_DIST) return;
  var total = AGENT_CALL_DIST.reduce(function (s, d) { return s + d.pct; }, 0);
  list.innerHTML = AGENT_CALL_DIST.map(function (d) {
    var val = (d.pct < 1) ? '&lt;1%' : d.pct + '%';
    return '<div class="kpi-scene-row"><span class="label">' + d.name + '</span><div class="track"><span style="width:' + Math.round(d.pct / total * 100) + '%;background:' + d.color + '"></span></div><span class="val">' + val + '</span></div>';
  }).join('');
  if (typeof window.EMS_I18N_REFRESH === 'function') window.EMS_I18N_REFRESH(list);
}
var AGENT_KPI_DATA = [
  { name: '告警降噪 Agent', lic: 'itom', sub: 'ITOM 降噪页 · 告警流入自动 · L1', tier: 'L1', tierCls: 'tier-l1', calls: '124,000',
    kpi: [ { label: '降噪 89.7%', w: 89, c: '#16a34a', link: { text: '运营监控 →', href: '../itom/alert-noise-reduction.html' } },
           { label: '精准率 86.4%', w: 86, c: '#16a34a' } ],
    target: '≥ 60%<br><small style="color:var(--c-text-3)">精准率 ≥ 85%</small>', cost: '¥3,872', status: '优秀', statusCls: 'ok' },
  { name: '根因分析 Agent', lic: 'itom', sub: '告警详情 RCA 工作台 · 事件组确认后 · L3', tier: 'L3', tierCls: 'tier-l3', calls: '92,800',
    kpi: [ { label: 'Top3 命中 73.4%', w: 73, c: '#22c55e' } ],
    target: '≥ 70%', cost: '¥5,124', status: '达标', statusCls: 'ok' },
  { name: '工单起草 Agent', lic: 'itsm', sub: '转单流水线 · L2 手工确认', tier: 'L2', tierCls: 'tier-l2', tierExtra: 'L1 自动执行', tierExtraCls: 'tier-l1', calls: '69,700',
    kpi: [ { label: '分单 91.2%', w: 91, c: '#16a34a' } ],
    target: '≥ 90%', cost: '¥2,918', status: '达标', statusCls: 'ok' },
  { name: 'NEO Agent', sub: '全局 ⌘K + 右下角 · L3', tier: 'L3', tierCls: 'tier-l3', calls: '46,424',
    kpi: [ { label: '快捷卡命中 82%', w: 82, c: '#16a34a' } ],
    target: '≥ 80%', cost: '¥3,813', status: '达标', statusCls: 'ok' },
  { name: '文本理解与标签 A1', lic: 'itsm', sub: 'ITSM 工单详情 · 新建/描述保存 · L3', tier: 'L3', tierCls: 'tier-l3', calls: '8,720',
    kpi: [ { label: '标签命中 92.4%', w: 92, c: '#16a34a' } ],
    target: '≥ 90%', cost: '¥1,240', status: '达标', statusCls: 'ok' },
  { name: '知识检索与推荐 A2', lic: 'itsm', sub: 'ITSM 工单 + FSM 单据 · 保存时 · L3', tier: 'L3', tierCls: 'tier-l3', calls: '14,300',
    kpi: [ { label: '推荐直接使用 87.6%', w: 87, c: '#16a34a' } ],
    target: '≥ 85%', cost: '¥1,860', status: '达标', statusCls: 'ok' },
  { name: '摘要与文档生成 A3', lic: 'itsm', sub: '工单评论/关闭触发 · L2', tier: 'L2', tierCls: 'tier-l2', calls: '5,960',
    kpi: [ { label: '摘要直接使用 90.1%', w: 90, c: '#16a34a' } ],
    target: '≥ 90%', cost: '¥890', status: '达标', statusCls: 'ok' },
  { name: '风险评估 A4', lic: 'itsm', sub: 'ITSM 变更详情 + 每日聚类 · L2', tier: 'L2', tierCls: 'tier-l2', calls: '4,120',
    kpi: [ { label: '风险覆盖 78%', w: 78, c: '#f59e0b' } ],
    target: '≥ 80%', cost: '¥1,420', status: '△ 差 2%', statusCls: 'warn' },
  { name: '对话助手 A6', lic: 'itsm', sub: '自助服务 + 外勤语音 · L3', tier: 'L3', tierCls: 'tier-l3', calls: '2,340',
    kpi: [ { label: '自助闭环 61%', w: 61, c: '#22c55e' } ],
    target: '≥ 60%', cost: '¥520', status: '达标', statusCls: 'ok' },
  { name: '数据质量巡检 A5', lic: 'itam', sub: 'ITAM 台账 · 每日定时 + 手动 · L3', tier: 'L3', tierCls: 'tier-l3', calls: '960',
    kpi: [ { label: '检出异常 87', w: 78, c: '#22c55e' } ],
    target: '巡检 ≥ 100 次/周', cost: '¥380', status: '达标', statusCls: 'ok' },
  { name: '资产巡检 Agent', sub: 'CMDB 资产页 · 每日定时 + 手动 · L3', tier: 'L3', tierCls: 'tier-l3', calls: '1,280',
    kpi: [ { label: '检出异常 156', w: 78, c: '#22c55e' } ],
    target: '巡检 ≥ 120 次/周', cost: '¥420', status: '达标', statusCls: 'ok' },
  { name: '调度推荐 A7', lic: 'fsm', sub: 'FSM 派工推荐卡 + ITSM 待指派 · 派单时自动 · L2', tier: 'L2', tierCls: 'tier-l2', calls: '670',
    kpi: [ { label: '派工直接使用 88%', w: 88, c: '#16a34a' } ],
    target: '≥ 85%', cost: '¥310', status: '达标', statusCls: 'ok' },
  { name: '容量预测 Agent', lic: 'itom', sub: 'ITOM 容量页 · 定时 + 手动 · L1', tier: 'L1', tierCls: 'tier-l1', calls: '320',
    kpi: [ { label: '预警命中 12', w: 60, c: '#f59e0b' } ],
    target: '命中 ≥ 10', cost: '¥260', status: '达标', statusCls: 'ok' },
  { name: '链路健康 Agent', lic: 'npm', sub: 'NPM 质量页 · 拨测数据自动分析 · L3', tier: 'L3', tierCls: 'tier-l3', calls: '14,900',
    kpi: [ { label: '预警 8 次', w: 90, c: '#16a34a' } ],
    target: '预警准确 ≥ 90%', cost: '¥1,150', status: '达标', statusCls: 'ok' }
];

function renderAgentKpiTable() {
  var body = document.getElementById('agentKpiBody');
  if (!body || !window.AGENT_KPI_DATA) return;
  body.innerHTML = AGENT_KPI_DATA.map(function (r) {
    /* 每行 KPI bar：多指标时第二个起加 margin-top；含链接的指标内嵌跳转 */
    var bars = r.kpi.map(function (k, i) {
      var link = k.link ? '<a href="' + k.link.href + '" class="ai-audit-link" style="font-weight:400;margin-left:4px">' + k.link.text + '</a>' : '';
      return '<div class="kpi-mini-bar"' + (i > 0 ? ' style="margin-top:6px"' : '') + '><span class="val">' + k.label + ' ' + link + '</span><div class="track"><span style="width:' + k.w + '%;background:' + k.c + '"></span></div></div>';
    }).join('');
    var licTag = '';
    if (r.lic && window.EMS_LICENSE && !window.EMS_LICENSE.has(r.lic)) {
      licTag = ' <span class="kpi-status warn" style="font-size:10px;padding:1px 6px">未授权</span>';
    }
    var tierHtml = '<span class="tier-badge ' + r.tierCls + '">' + r.tier + '</span>';
    if (r.tierExtra) tierHtml += ' <span class="tier-badge ' + (r.tierExtraCls || r.tierCls) + ' sm" style="margin-left:4px">' + r.tierExtra + '</span>';
    return '<tr>'
      + '<td><div class="scene-cell"><strong>' + r.name + '</strong>' + licTag + '</div><small>' + r.sub + '</small></td>'
      + '<td>' + tierHtml + '</td>'
      + '<td>' + r.calls + '</td>'
      + '<td>' + bars + '</td>'
      + '<td>' + r.target + '</td>'
      + '<td>' + r.cost + '</td>'
      + '<td><span class="kpi-status ' + r.statusCls + '">' + r.status + '</span></td></tr>';
  }).join('');
  if (typeof window.EMS_I18N_REFRESH === 'function') window.EMS_I18N_REFRESH(body);
}


/* ═══════════════════════════════════════════════════════════════
   产品页面 Agent 埋点数据（EMS_EMBED · 2026-09-01）
   使用方：ems-agent-embed.js → 各产品页面 .agent-embed 状态条
   权威对齐：design/13-ai-agent-mcp-catalog.md（14 Agent 目录）+ ai-platform.html AGENT_DATA.embed
   status: running（运行中）/ degraded（熔断降级）/ paused（已暂停）
   ═══════════════════════════════════════════════════════════════ */
var EMS_EMBED = [
  { aid: 'sa1', name: '告警降噪 Agent', own: '平台通用', tier: 'L3', status: 'running',
    trigger: '告警流入自动触发（实时）', mode: '自动',
    metrics: '降噪率 89.7% · 精准率 86.4%',
    page: 'itom/alert-noise-reduction.html', spot: '降噪引擎区',
    actions: ['detail', 'audit'] },
  { aid: 'sa2', name: '根因分析 Agent', own: '平台通用', tier: 'L1', status: 'running',
    trigger: '事件组确认后自动 + 手动重跑', mode: '自动 + 手动',
    metrics: '今日 96 组 · 命中率 73.4%',
    page: 'itom/alert-detail.html', spot: 'RCA 工作台面板',
    actions: ['detail', 'run', 'audit'] },
  { aid: 'sa3', name: '工单起草 Agent', own: '平台通用', tier: 'L2', status: 'idle',
    trigger: 'L2 手工确认触发', mode: '手工确认',
    metrics: '今日 892 次 · 直接使用 91.2%',
    page: 'itom/alert-to-incident.html', spot: '转单流水线',
    actions: ['detail', 'audit'] },
  { aid: 'sa6', name: 'NEO Agent', own: '平台通用', tier: 'L1', status: 'running',
    trigger: '对话触发（⌘K / 右下角）', mode: '手动',
    metrics: '今日 843 次 · 快捷卡命中 82%',
    page: 'portal/dashboard.html', spot: '全局 · 任意页面',
    actions: ['detail', 'audit'] },
  { aid: 'sa7', name: '资产数据巡检 Agent', own: 'CMDB 自建', tier: 'L1', status: 'running',
    trigger: '每日定时 + 手动运行', mode: '定时 + 手动',
    metrics: '今日巡检 128 次 · 检出异常 156',
    page: 'cmdb/cmdb-v2-ai-management.html', spot: '巡检任务区',
    actions: ['detail', 'run', 'audit'] },
  { aid: 'sa9', name: '容量预测 Agent', own: 'ITOM 自建', tier: 'L3', status: 'running',
    trigger: '定时 + 手动运行', mode: '定时 + 手动',
    metrics: '本周 320 次 · 预警 12 条',
    page: 'itom/capacity-forecast.html', spot: '容量预测列表区',
    actions: ['detail', 'run', 'audit'] },
  { aid: 'sa10', name: '链路健康 Agent', own: 'NPM/FSM 自建', tier: 'L1', status: 'running',
    trigger: '拨测数据自动分析（跟随拨测任务）', mode: '自动',
    metrics: '今日检测 2,140 次 · 预警 8',
    page: 'itom/npm-overview.html', spot: '链路健康卡',
    actions: ['detail', 'audit'] },
  { aid: 'A1', name: '文本理解与标签 Agent', own: '平台通用', tier: 'L1', status: 'running',
    trigger: '工单新建/描述保存自动 + 手动重跑', mode: '自动 + 手动',
    metrics: '今日 1,246 次 · 标签命中 92.4%',
    page: 'itsm/itsm-incident-detail.html', spot: 'AI 建议区',
    actions: ['detail', 'run', 'audit'] },
  { aid: 'A2', name: '知识检索与推荐 Agent', own: '平台通用', tier: 'L1', status: 'running',
    trigger: '工单/单据保存时自动', mode: '自动',
    metrics: '今日 986 次 · 推荐直接使用 87.6%',
    page: 'itsm/itsm-incident-detail.html', spot: '知识推荐卡',
    actions: ['detail', 'audit'] },
  { aid: 'A3', name: '摘要与文档生成 Agent', own: '平台通用', tier: 'L2', status: 'running',
    trigger: '新增评论/关闭时自动', mode: '自动',
    metrics: '今日 486 篇 · 知识草稿 12',
    page: 'itsm/itsm-incident-detail.html', spot: '摘要卡',
    actions: ['detail', 'audit'] },
  { aid: 'A4', name: '风险评估 Agent', own: '平台通用', tier: 'L2', status: 'running',
    trigger: '提交变更单时自动 + 每日定时聚类', mode: '自动',
    metrics: '今日 31 单 · 高风险 3',
    page: 'itsm/change-detail.html', spot: '风险评估卡',
    actions: ['detail', 'audit'] },
  { aid: 'A5', name: '数据质量巡检 Agent', own: '平台通用', tier: 'L1', status: 'running',
    trigger: '每日定时 + 新增/编辑触发', mode: '定时 + 手动',
    metrics: '今日巡检 96 次 · 检出异常 87',
    page: 'itam/itam-asset-ledger.html', spot: '巡检任务区',
    actions: ['detail', 'run', 'audit'] },
  { aid: 'A6', name: '对话助手 Agent', own: '平台通用', tier: 'L1', status: 'running',
    trigger: '用户提交咨询/语音交互', mode: '手动',
    metrics: '今日 218 次 · 自助闭环 61%',
    page: 'itsm/service-request.html', spot: '自助对话入口',
    actions: ['detail', 'audit'] },
  { aid: 'A7', name: '调度推荐 Agent', own: '平台通用', tier: 'L2', status: 'running',
    trigger: '派单时自动推荐', mode: '自动',
    metrics: '今日 96 次 · 直接使用率 88%',
    page: 'fsm/fsm-dispatch-detail.html', spot: '派工推荐卡',
    actions: ['detail', 'audit'] }
];
