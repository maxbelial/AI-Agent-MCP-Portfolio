/* ═══════════════════════════════════════════════════════════════
   EMS NEO 产品页面 Agent 埋点组件（agent-embed 状态条 · 2026-09-01）
   用法：产品页面放 <div class="agent-embed" data-agent="sa1"></div>
         + 引用本文件与 ../ai/ai-agent-kpi-data.js（EMS_EMBED 数据）
   职责：渲染 Agent 状态条（名称/归属/档位/状态/触发/指标/操作）
   权威对齐：design/13-ai-agent-mcp-catalog.md + ai-platform.html AGENT_DATA.embed
   ═══════════════════════════════════════════════════════════════ */
(function () {
  if (window.__agentEmbedLoaded) return;
  window.__agentEmbedLoaded = true;

  // ── 组件样式（自包含 · .agent-embed 前缀防冲突）──
  var css = [
    '.agent-embed{--ae-own-sub-bg:#eef2ff;--ae-own-sub-fg:#4f46e5;--ae-own-plat-bg:#f1f5f9;--ae-own-plat-fg:#64748b;display:flex;align-items:center;gap:var(--sp-12,12px);flex-wrap:wrap;background:var(--c-white,#fff);border:1px solid var(--c-border,#e2e8f0);border-radius:10px;padding:10px 14px;margin-bottom:12px;font-size:12px;color:var(--c-text-1,#0f172a)}',
    '.agent-embed-name{display:flex;align-items:center;gap:6px;font-weight:600;font-size:13px}',
    '.agent-embed-own{font-size:10px;padding:1px 7px;border-radius:99px;background:var(--ae-own-sub-bg);color:var(--ae-own-sub-fg)}',
    '.agent-embed-own.product{background:var(--ae-own-plat-bg);color:var(--ae-own-plat-fg)}',
    '.agent-embed-status{display:inline-flex;align-items:center;gap:4px;font-size:11px;color:var(--c-text-2,#475569)}',
    '.agent-embed-status .dot{width:7px;height:7px;border-radius:50%;background:#22c55e;display:inline-block}',
    '.agent-embed-status .dot.degraded{background:#f59e0b}',
    '.agent-embed-status .dot.paused{background:#94a3b8}',
    '.agent-embed-sep{width:1px;height:12px;background:var(--c-border,#e2e8f0)}',
    '.agent-embed-trigger{color:var(--c-text-3,#94a3b8);font-size:11px}',
    '.agent-embed-metrics{font-size:12px;color:var(--c-text-2,#475569)}',
    '.agent-embed-metrics strong{color:var(--c-text-1,#0f172a);font-weight:600}',
    '.agent-embed-actions{margin-left:auto;display:flex;align-items:center;gap:2px}',
    '.agent-embed-actions a{color:var(--c-primary,#2563eb);font-size:12px;text-decoration:none;cursor:pointer;padding:2px 6px;border-radius:4px}',
    '.agent-embed-actions a:hover{background:var(--c-fill-1,#f1f5f9);text-decoration:underline}',
    '.agent-embed-actions .sep{color:var(--c-border,#e2e8f0);font-size:12px}',
    '.agent-embed-group{--ae-own-sub-bg:#eef2ff;--ae-own-sub-fg:#4f46e5;--ae-own-plat-bg:#f1f5f9;--ae-own-plat-fg:#64748b;border:1px solid var(--c-border,#e2e8f0);border-radius:10px;background:var(--c-white,#fff);padding:12px 14px;margin-bottom:12px}',
    '[data-theme="dark"] .agent-embed,[data-theme="dark"] .agent-embed-group{--ae-own-sub-bg:rgba(129,140,248,.16);--ae-own-sub-fg:#a5b4fc;--ae-own-plat-bg:#334155;--ae-own-plat-fg:#94a3b8}',
    '.agent-embed-group-title{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:600;color:var(--c-text-2,#475569);margin-bottom:4px}',
    '.agent-embed-group-hint{font-size:11px;font-weight:400;color:var(--c-text-3,#94a3b8)}',
    '.agent-embed-row{display:flex;align-items:center;gap:var(--sp-12,12px);flex-wrap:wrap;font-size:12px;padding:6px 0;border-top:1px dashed var(--c-border-light,#eef2f7)}',
    '.agent-embed-group .agent-embed-row:first-of-type{border-top:none}'
  ].join('\n');
  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ── 状态点映射 ──
  var STATUS = {
    running: { cls: '', text: '运行中' },
    degraded: { cls: 'degraded', text: '熔断降级' },
    paused: { cls: 'paused', text: '已暂停' },
    idle: { cls: 'paused', text: '待触发' }
  };

  // ── 渲染单个埋点内容（不包行容器 · 由调用方决定排版）──
  function renderOne(d) {
    var st = STATUS[d.status] || STATUS.running;
    var ownCls = d.own.indexOf('自建') >= 0 ? '' : ' product';
    var actions = '';
    (d.actions || []).forEach(function (a) {
      if (a === 'detail') actions += '<a onclick="window.open(\'../ai/ai-platform.html?agent=' + d.aid + '\',\'_self\')">详情</a>';
      else if (a === 'run') actions += '<a onclick="showToast(\'' + d.name + ' 已触发运行 · 完成后通知\',\'success\')">手动触发</a>';
      else if (a === 'audit') actions += '<a onclick="window.open(\'../ai/ai-governance.html?sub=t5&view=exec\',\'_self\')">调用明细</a>';
    });
    return '<div class="agent-embed-name">' + d.name
      + '<span class="agent-embed-own' + ownCls + '">' + d.own + '</span>'
      + '<span class="tier-badge tier-l' + d.tier.slice(1) + ' sm">' + d.tier + '</span>'
      + '</div>'
      + '<span class="agent-embed-status"><span class="dot ' + st.cls + '"></span>' + st.text + '</span>'
      + '<span class="agent-embed-sep"></span>'
      + '<span class="agent-embed-trigger">' + d.trigger + '</span>'
      + '<span class="agent-embed-sep"></span>'
      + '<span class="agent-embed-metrics">' + d.metrics.replace(/(\d[\d,]*)/g, '<strong>$1</strong>') + '</span>'
      + '<span class="agent-embed-actions">' + actions + '</span>';
  }

  // ── 渲染容器（单 Agent = 一条；多 Agent = 分组卡片）──
  function render(container) {
    var aids = (container.getAttribute('data-agent') || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    var list = (window.EMS_EMBED || []).filter(function (x) { return aids.indexOf(x.aid) >= 0; });
    if (!list.length) { container.innerHTML = '<div class="agent-embed-empty">Agent 数据缺失（EMS_EMBED）</div>'; return; }
    if (list.length === 1) {
      container.classList.add('agent-embed');
      container.innerHTML = renderOne(list[0]);
      return;
    }
    // 分组：同页多 Agent
    container.classList.add('agent-embed-group');
    var rows = list.map(function (d) { return '<div class="agent-embed-row">' + renderOne(d) + '</div>'; }).join('');
    container.innerHTML = '<div class="agent-embed-group-title">AI 赋能 · 本页 ' + list.length + ' 个 Agent'
      + '<span class="agent-embed-group-hint">全部运行中 · 详见 Agent 库</span></div>'
      + rows;
  }

  // ── 自动渲染页面内所有埋点 ──
  function renderAll() {
    document.querySelectorAll('.agent-embed[data-agent]').forEach(render);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderAll);
  } else {
    renderAll();
  }
  window.renderAgentEmbed = render;
  window.renderAgentEmbeds = renderAll;
})();
