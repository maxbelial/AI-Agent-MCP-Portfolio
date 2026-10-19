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
  // ─── PMS 自包含外壳：跨域深链 ──────────────────────────────────────
  // 本地页面（pms/）与本地资产（assets/）走 basePath；其它产品域
  // （portal/itom/cmdb/itsm/itam/fsm/npm/ai/org/settings）深链回完整 EMS 原型。
  var DEEP_BASE = CFG.deepBase || '../../../../../ems-product/requirements/ems-driven-by-ai/prototype/';
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
  // 页面正文中的 `../域/` 相对链接 → 深链回完整原型（../pms/ 与 ../assets/ 保持本地）
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
  // 标记 EMS 统一 shell 已接管，cmdb-v2-shell.js 检测到后跳过自身的 header/sidebar 注入
  window.EMS_UNIFIED_SHELL = true;
  var breadcrumb = CFG.breadcrumb || '';
  var aiQuickActions = CFG.aiQuickActions || [
    { title: '全局概览', desc: '各模块健康状态一览', prompt: '概述当前各产品模块的运行状态' },
    { title: '待办事项', desc: '汇总高优先级待处理项', prompt: '有哪些需要立即处理的事项？' },
    { title: '趋势对比', desc: '周环比关键指标变化', prompt: '对比上周，运维指标有什么变化？' },
    { title: '每日简报', desc: '生成今日运维摘要', prompt: '今天的运维简报' }
  ];

  // ─── SIDEBAR (legacy — kept for demo pages that opt out) ────────
  var MENU_ITEMS = [
    { type: 'item', href: 'portal/work-queue.html', label: '我的待办', icon: '<svg viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>' },
    { type: 'item', href: 'portal/governance.html', label: 'Governance', icon: '<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' },
    { type: 'item', href: 'portal/dashboard.html', label: 'Dashboard', icon: '<svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>' },
    { type: 'group', label: 'ITOM 监控' },
    { type: 'item', href: 'itom/alert-list.html', label: '告警中心', icon: '<svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>' },
    { type: 'item', href: 'itom/alert-noise-reduction.html', label: '降噪中心', icon: '<svg viewBox="0 0 24 24"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707"/><circle cx="12" cy="12" r="4"/></svg>' },
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
    { type: 'item', href: 'itam/itam-asset-ledger.html', label: '资产台账', icon: '<svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05"/><path d="M12 22.08V12"/></svg>' },
    { type: 'item', href: 'itam/itam-contracts.html', label: '合同管理', icon: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-6M9 15l3 3 3-3"/></svg>' },
    { type: 'item', href: 'itam/itam-inventory.html', label: '库存盘点', icon: '<svg viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>' },
    { type: 'group', label: 'FSM' },
    { type: 'item', href: 'fsm/fsm-dispatch.html', label: '现场派工', icon: '<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>' },
    { type: 'group', label: 'PMS' },
    { type: 'item', href: 'pms/pms-overview.html', label: '项目总览', icon: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M8 7v10M12 7v7M16 7v13"/></svg>' },
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
      id: 'workspace', label: '工作台', color: '#2563EB', position: 'top',
      icon: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
      items: [
        { href: 'portal/work-queue.html', label: '我的待办', icon: '<svg viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>' },
        { href: 'portal/governance.html', label: '治理中心', icon: '<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' },
        { href: 'portal/dashboard.html', label: '仪表盘', icon: '<svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>' },
      ]
    },
    {
      id: 'itom', label: 'ITOM', color: '#2563EB', position: 'top',
      icon: '<svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>',
      items: [
        { href: 'itom/alert-list.html', label: '告警中心', icon: '<svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>' },
        { href: 'itom/alert-noise-reduction.html', label: '降噪中心', icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 3v1m0 16v1m9-9h-1M4 12H3"/></svg>' },
        { href: 'itom/alert-to-incident.html', label: '告警转工单', icon: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>' },
        { href: 'itom/itom-topology.html', label: '网络拓扑', icon: '<svg viewBox="0 0 24 24"><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/><path d="M6 9v6M18 9v6M9 6h6M9 18h6"/></svg>' }
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
      id: 'itsm', label: 'ITSM', color: '#059669', position: 'top',
      icon: '<svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>',
      items: [
        { group: '工作台' },
        { href: 'itsm/itsm-dashboard.html', label: '首页', icon: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>' },
        { group: '工单管理' },
        { href: 'itsm/itsm-incidents.html', label: '事件管理', icon: '<svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>' },
        { href: 'itsm/itsm-problems.html', label: '问题管理', icon: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><path d="M11 8v3M11 14h.01"/></svg>' },
        { href: 'itsm/itsm-changes.html', label: '变更管理', icon: '<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>' },
        { href: 'itsm/itsm-problem-tasks.html', label: '问题任务', icon: '<svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>' },
        { href: 'itsm/itsm-change-tasks.html', label: '变更任务', icon: '<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/><path d="M9 11l3 3L22 4"/></svg>' },
        { group: '服务管理' },
        { href: 'itsm/itsm-service-portal.html', label: '服务门户', icon: '<svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>' },
        { href: 'itsm/itsm-service-catalog.html', label: '服务目录管理', icon: '<svg viewBox="0 0 24 24"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>' },
        { href: 'itsm/service-request.html', label: '服务请求', icon: '<svg viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>' },
        { href: 'itsm/itsm-knowledge.html', label: '知识库管理', icon: '<svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>' },
        { href: 'itsm/itsm-survey.html', label: '问卷调查', icon: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8M16 17H8M10 9H8"/></svg>' },
        { group: '效率配置' },
        { href: 'itsm/itsm-service-efficiency.html', label: '服务效率配置', icon: '<svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>' },
        { group: '团队与报告' },
        { href: 'itsm/itsm-team.html', label: '团队管理', icon: '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>' },
        { href: 'itsm/itsm-service-report.html', label: '服务报告', icon: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8M16 17H8M10 9H8"/></svg>' },
        { group: '系统设置' },
        { href: 'itsm/itsm-settings.html', label: '系统设置', icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>' }
      ]
    },
    {
      id: 'itam', label: 'ITAM', color: '#6366F1', position: 'top',
      icon: '<svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05"/><path d="M12 22.08V12"/></svg>',
      items: [
        { href: 'itam/itam-overview.html', label: '资产概览', icon: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/></svg>' },
        { href: 'itam/itam-asset-ledger.html', label: '资产台账', icon: '<svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05"/><path d="M12 22.08V12"/></svg>' },
        { href: 'itam/itam-contracts.html', label: '合同管理', icon: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-6M9 15l3 3 3-3"/></svg>' },
        { href: 'itam/itam-inventory.html', label: '库存盘点', icon: '<svg viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>' }
      ]
    },
    {
      id: 'fsm', label: 'FSM', color: '#D97706', position: 'top',
      icon: '<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>',
      items: [
        { group: '工作台' },
        { href: 'fsm/fsm-dispatch.html', label: '工作台', icon: FSM_ICONS.desk },
        { group: '工单管理' },
        { href: 'fsm/fsm-workorder-create.html', label: '受理提单', icon: FSM_ICONS.create },
        { href: 'fsm/fsm-workorders.html', label: '工单列表', icon: FSM_ICONS.list },
        { group: '审核中心' },
        { href: 'fsm/fsm-certificates.html', label: '证书管理', icon: FSM_ICONS.award },
        { href: 'fsm/fsm-engineer-review.html', label: '入驻审核', icon: FSM_ICONS.shieldCheck },
        { href: 'fsm/fsm-privacy-request.html', label: '档案访问申请', icon: FSM_ICONS.fileLock },
        { href: 'fsm/fsm-privacy-auth.html', label: '档案访问授权', icon: FSM_ICONS.userCheck },
        { group: '资源与人员' },
        { href: 'fsm/fsm-tac-engineers.html', label: 'TAC工程师', icon: FSM_ICONS.user },
        { href: 'fsm/fsm-engineers.html', label: '现场工程师', icon: FSM_ICONS.users },
        { href: 'fsm/fsm-dispatchers.html', label: '调度员与客服', icon: FSM_ICONS.users },
        { href: 'fsm/fsm-schedule.html', label: '排班日历', icon: FSM_ICONS.calendar },
        { href: 'fsm/fsm-tac-schedule.html', label: 'TAC工程师排班', icon: FSM_ICONS.calendar },
        { href: 'fsm/fsm-cs-schedule.html', label: '客服排班', icon: FSM_ICONS.calendar },
        { href: 'fsm/fsm-shift-definition.html', label: '班次定义', icon: FSM_ICONS.clock },
        { group: 'SLA管理' },
        { href: 'fsm/fsm-sla.html', label: 'SLA配置', icon: FSM_ICONS.clock },
        { href: 'fsm/fsm-time-management.html', label: '时间管理', icon: FSM_ICONS.calendar },
        { group: '系统设置' },
        { href: 'fsm/fsm-templates.html', label: '工单模板', icon: FSM_ICONS.layers },
        { href: 'fsm/fsm-bank-accounts.html', label: '银行账户', icon: FSM_ICONS.card },
        { href: 'fsm/fsm-certificate-types.html', label: '证书类型', icon: FSM_ICONS.tag }
      ]
    },
    // {
    //   id: 'npm', label: 'NPM', color: '#0891B2', position: 'top',
    //   icon: '<svg viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
    //   items: [
    //     { href: 'itom/npm-overview.html', label: '网络质量', icon: '<svg viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>' }
    //   ]
    // },
    {
      id: 'pms', label: 'PMS', color: '#0D9488', position: 'top',
      icon: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M8 7v10M12 7v7M16 7v13"/></svg>',
      items: [
        { group: '项目交付' },
        { href: 'pms/pms-overview.html', label: '项目总览', icon: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M8 7v10M12 7v7M16 7v13"/></svg>' },
        { href: 'pms/pms-projects.html', label: '项目列表', icon: '<svg viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>' },
        { href: 'pms/pms-tasks.html', label: '任务管理', icon: '<svg viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>' },
        { href: 'pms/pms-deliverables.html', label: '交付物管理', icon: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-6M9 15l3 3 3-3"/></svg>' },
        { href: 'pms/pms-reports.html', label: '项目报告', icon: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/></svg>' },
        { href: 'pms/pms-acceptance.html', label: '验收与关闭', icon: '<svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>' },
        { group: '共享主数据' },
        { href: 'pms/pms-staff.html', label: '人员目录', icon: '<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' },
        { href: 'pms/pms-teams.html', label: '团队目录', icon: '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>' },
        { href: 'pms/pms-sites.html', label: '服务网点', icon: '<svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>' },
        { group: '治理与配置' },
        { href: 'pms/pms-audit.html', label: '审计日志', icon: '<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' },
        { href: 'pms/pms-settings.html', label: '配置中心', icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.6V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9c.26.46.4.98.41 1.51h.09a2 2 0 010 4h-.09c-.01.53-.15 1.05-.41 1.51z"/></svg>' }
      ]
    },
    {
      id: 'solution', label: 'Solution', color: '#0891B2', position: 'top',
      icon: '<svg viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
      items: [
        { href: 'index.html', label: '解决方案', icon: '<svg viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>' }
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
        { href: 'settings/ai-settings.html', label: 'AI 访问设置', icon: '<svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 017 7v1h1a2 2 0 012 2v1a2 2 0 01-2 2h-1a7 7 0 01-14 0H4a2 2 0 01-2-2v-1a2 2 0 012-2h1V9a7 7 0 017-7z"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/></svg>' }
      ]
    }
  ];

  // ─── TENANTS DATA ──────────────────────────────────────────────────
  var DS_TENANTS = [
    { name: 'tdengine' },
    { name: 'Test123456' },
    { name: 'mx' },
    { name: 'DEV', active: true }
  ];

  // ─── DOMAIN SWITCHER: Auto-detect domain from activeMenu ──────────
  var _dsCurrentDomain = 'workspace';
  var _dsPanelCollapsed = false;

  function _dsFindDomainByHref(href) {
    for (var i = 0; i < DS_DOMAINS.length; i++) {
      var d = DS_DOMAINS[i];
      for (var j = 0; j < d.items.length; j++) {
        if (d.items[j].href === href) return d.id;
      }
    }
    // 下钻页兜底：按路径前缀归属域（如 cmdb/cmdb-v2-ci-detail.html → cmdb 面板）
    var m = String(href || '').match(/^([a-z]+)\//);
    if (m) {
      for (var k = 0; k < DS_DOMAINS.length; k++) {
        if (DS_DOMAINS[k].id === m[1]) return m[1];
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
    var activeTenant = DS_TENANTS.filter(function (t) { return t.active; })[0] || DS_TENANTS[0];
    var tListHtml = '';
    DS_TENANTS.forEach(function (t) {
      var cls = t.active ? ' active' : '';
      tListHtml += '<div class="rail-t-item' + cls + '" onclick="dsRailSwitchTenant(\'' + t.name.replace(/'/g, "\\'") + '\',this,event)"><div class="rail-t-avatar">' + t.name.charAt(0).toUpperCase() + '</div><div class="rail-t-name">' + t.name + '</div><span class="rail-t-check"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span></div>';
    });
    tenant.innerHTML = '<button class="rail-tenant-btn" id="railTenantBtn" onclick="dsRailToggleTenant(event)" title="切换租户">' + activeTenant.name.charAt(0).toUpperCase() + '<span class="domain-tooltip">租户: ' + activeTenant.name + '</span></button><div class="rail-tenant-dropdown" id="railTenantDropdown"><input type="text" class="rt-search" placeholder="搜索租户…" oninput="dsRailFilterTenants(this.value)" onclick="event.stopPropagation()"><div class="rail-tenant-list" id="railTenantList">' + tListHtml + '</div></div>';
    document.body.appendChild(tenant);

    // Initial render
    _dsRenderRail();
    _dsRenderPanel();

    // Auto-collapse panel for single-item domains
    var curDomain = null;
    for (var k = 0; k < DS_DOMAINS.length; k++) {
      if (DS_DOMAINS[k].id === _dsCurrentDomain) { curDomain = DS_DOMAINS[k]; break; }
    }
    if (curDomain && curDomain.items.length <= 1) {
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
      var activeClass = d.id === _dsCurrentDomain ? ' active' : '';
      var colorStyle = d.id === _dsCurrentDomain ? 'color:' + d.color : '';
      var btn = '<button class="domain-icon' + activeClass + '" onclick="dsSelectDomain(\'' + d.id + '\')" style="' + colorStyle + '"><span style="width:20px;height:20px;display:flex;align-items:center;justify-content:center">' + d.icon + '</span><span class="domain-tooltip">' + d.label + '</span></button>';
      if (d.position === 'bottom') bottomHtml += btn;
      else topHtml += btn;
    });
    el.innerHTML = '<button class="rail-launcher-btn" onclick="toggleAppLauncher(event)" title="应用启动器"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg></button><div class="rail-sep"></div><div class="domain-rail-top">' + topHtml + '</div>' + (bottomHtml ? '<div class="domain-rail-bottom">' + bottomHtml + '</div>' : '');
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
    domain.items.forEach(function (item) {
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
      var badge = isPlanned ? '<span class="dp-item-badge">' + (item.status === 'dev' ? '待开发' : '规划中') + '</span>' : '';
      html += '<a class="dp-item' + cls + '" href="' + href + '">' + iconHtml + '<span>' + item.label + '</span>' + badge + '</a>';
    });
    body.innerHTML = html;
  }

  // ─── DOMAIN SWITCHER: Global Functions ─────────────────────────────
  window.dsSelectDomain = function (domainId) {
    // If domain has only 1 item, navigate directly instead of showing panel
    for (var i = 0; i < DS_DOMAINS.length; i++) {
      if (DS_DOMAINS[i].id === domainId && DS_DOMAINS[i].items.length === 1 && DS_DOMAINS[i].items[0].href) {
        window.location.href = basePath + DS_DOMAINS[i].items[0].href;
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
        html += '<a class="sidebar-item' + active + '" href="' + basePath + item.href + '" title="' + item.label + '"><span class="s-icon">' + item.icon + '</span><span class="s-label">' + item.label + '</span></a>';
      }
    });
    // Tenant switcher
    html += '<div class="org-switcher" onclick="toggleTenantDropdown(event)"><div class="org-avatar">D</div><div class="org-info"><div class="org-name">DEV</div></div><div class="org-switch-icon"><svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5"/><path d="M4 20L21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/></svg></div><div class="tenant-dropdown" id="tenantDropdown"><input type="text" class="tenant-search" placeholder="查询租户名称" oninput="filterTenants(this.value)" onclick="event.stopPropagation()"><div class="tenant-list" id="tenantList"><div class="tenant-item" onclick="switchTenant(\'tdengine\',this,event)"><div class="t-avatar">t</div><div class="t-name">tdengine</div></div><div class="tenant-item" onclick="switchTenant(\'Test123456\',this,event)"><div class="t-avatar">T</div><div class="t-name">Test123456</div></div><div class="tenant-item" onclick="switchTenant(\'mx\',this,event)"><div class="t-avatar">m</div><div class="t-name">mx</div></div><div class="tenant-item active" onclick="switchTenant(\'DEV\',this,event)"><div class="t-avatar">D</div><div class="t-name">DEV</div></div></div></div></div>';
    el.innerHTML = html;
  }

  // ─── HEADER ────────────────────────────────────────────────────────
  function renderHeader() {
    var el = document.getElementById('emsHeader');
    if (!el) return;
    var bcHtml = '';
    if (breadcrumb) {
      bcHtml = '<a class="bc-item" href="' + basePath + 'portal/dashboard.html" style="color:var(--c-text-3);text-decoration:none">EMS NEO</a><span class="sep">/</span><span class="current">' + breadcrumb + '</span>';
    } else {
      bcHtml = '<span class="current">EMS NEO• AI驱动的企业IT运维平台</span>';
    }
    window.EMS_BASE = basePath;
    var _role = localStorage.getItem('ems-role-demo') || 'u1';
    var _roleLabels = { u1: 'U1 一线运维', u2: 'U2 专业技术', u3: 'U3 IT 中层', uf: 'SMB U-Frontline', pm: 'PM 项目经理', bm: 'BM 业务经理' };
    var _roleSwHtml = '<div class="role-sw" id="roleSw"><button class="role-sw-btn" id="roleSwBtn" onclick="toggleRoleMenu(event)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:14px;height:14px;flex-shrink:0"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><span id="roleSwLabel">' + (_roleLabels[_role] || 'U1 一线运维') + '</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:11px;height:11px;flex-shrink:0"><polyline points="6 9 12 15 18 9"/></svg></button><div class="role-sw-menu" id="roleSwMenu" style="display:none"><div class="role-sw-menu-title">角色切换（原型演示 · 生产由 RBAC 角色决定 · 05 §P6 · 2026-08-19 新增 PM/BM）</div><div class="role-sw-opt' + (_role === 'u1' ? ' active' : '') + '" onclick="switchRole(\'u1\')"><span>U1 一线运维工程师</span><em>我的待办 · 全类型队列</em></div><div class="role-sw-opt' + (_role === 'u2' ? ' active' : '') + '" onclick="switchRole(\'u2\')"><span>U2 专业技术工程师</span><em>排查队列 · RCA 分析台</em></div><div class="role-sw-opt' + (_role === 'u3' ? ' active' : '') + '" onclick="switchRole(\'u3\')"><span>U3 IT 中层</span><em>Governance Console · 审批与治理</em></div><div class="role-sw-opt' + (_role === 'uf' ? ' active' : '') + '" onclick="switchRole(\'uf\')"><span>SMB U-Frontline 一线复合</span><em>合并视图 · 不切角色</em></div><div class="role-sw-opt' + (_role === 'pm' ? ' active' : '') + '" onclick="switchRole(\'pm\')"><span>PM 项目经理</span><em>项目事件 · 工时/报告审批（06 §P2 · 链段 A）</em></div><div class="role-sw-opt' + (_role === 'bm' ? ' active' : '') + '" onclick="switchRole(\'bm\')"><span>BM 业务经理</span><em>商务/合同审批 · SLA（06 §P2 · 链段 A）</em></div></div></div>';
    el.innerHTML = '<div class="header-left"><div class="logo-area"><div class="logo-mark"><img src="' + basePath + 'assets/itom-logo.png" alt="EMS NEO"></div></div><nav class="header-breadcrumb">' + bcHtml + '</nav></div><div class="header-center"><div class="cmd-trigger" onclick="openCmd()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;flex-shrink:0"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><span>Ask NEO Agent · 搜索设备、告警、工单…</span><span class="shortcut">⌘K</span></div></div><div class="header-right"><button class="header-icon-btn" id="headerFavBtn" onclick="toggleFavCurrentPage()" title="收藏当前页面"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></button><div class="lang-switcher" id="langSwitcher"><button class="header-icon-btn" title="语言切换" onclick="toggleLangMenu()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg></button><div class="lang-menu" id="langMenu"><div class="lang-option active" onclick="switchLang(\'zh-CN\',this)">简体中文</div><div class="lang-option" onclick="switchLang(\'zh-TW\',this)">繁體中文</div><div class="lang-option" onclick="switchLang(\'en\',this)">English</div></div></div><button class="header-icon-btn" title="暗色/亮色模式" onclick="toggleTheme()"><svg id="themeIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg></button><button class="header-icon-btn" title="全屏" onclick="toggleFullscreen()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg></button>' + _roleSwHtml + '<div class="header-sep"></div><div class="user-wrapper"><button class="user-area"><div class="user-avatar">A</div><span>Admin</span></button></div></div>';
  }

  // ─── ROLE SWITCHER（原型演示：角色→默认首屏 · 生产契约：由 RBAC 角色决定，配置见 org/role-management 默认首屏） ──
  window.toggleRoleMenu = function (e) {
    e.stopPropagation();
    var m = document.getElementById('roleSwMenu');
    if (m) m.style.display = m.style.display === 'none' ? 'block' : 'none';
  };
  window.switchRole = function (role) {
    localStorage.setItem('ems-role-demo', role);
    var map = { u1: 'portal/work-queue.html', u2: 'portal/work-queue.html?view=u2', u3: 'portal/governance.html', uf: 'portal/work-queue.html?view=ufrontline', pm: 'portal/work-queue.html?view=pm', bm: 'portal/work-queue.html?view=bm' };
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
    { label: 'ITSM', href: 'itsm/itsm-incidents.html', color: '#059669', bg: 'rgba(5,150,105,.10)', icon: '<svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>' },
    { label: 'CMDB', href: 'cmdb/cmdb-v2-overview.html', color: '#7C3AED', bg: 'rgba(124,58,237,.10)', icon: '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/></svg>' },
    { label: 'FSM', href: 'fsm/fsm-dispatch.html', color: '#D97706', bg: 'rgba(217,119,6,.10)', icon: '<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87"/></svg>' },
    { label: 'NPM', href: 'itom/npm-overview.html', color: '#0891B2', bg: 'rgba(8,145,178,.10)', icon: '<svg viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>' },
    { label: 'ITAM', href: 'itam/itam-overview.html', color: '#6366F1', bg: 'rgba(99,102,241,.10)', icon: '<svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05"/><path d="M12 22.08V12"/></svg>' },
    { label: 'PMS', href: 'pms/pms-overview.html', color: '#0D9488', bg: 'rgba(13,148,136,.10)', icon: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M8 7v10M12 7v7M16 7v13"/></svg>' },
    { label: 'NEO Agent Hub', href: 'ai/ai-center.html', color: '#EC4899', bg: 'rgba(236,72,153,.10)', icon: '<svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 017 7v1h1a2 2 0 012 2v1a2 2 0 01-2 2h-1a7 7 0 01-14 0H4a2 2 0 01-2-2v-1a2 2 0 012-2h1V9a7 7 0 017-7z"/><circle cx="9" cy="10" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r="1" fill="currentColor" stroke="none"/><path d="M9 14h6"/></svg>' }
  ];
  var FAV_KEY = 'ems-favorites-v1';
  var FAV_SEED_KEY = 'ems-favorites-seeded';
  function seedFavsOnce() {
    // 每个浏览器首次打开时灌入演示收藏(仅在无任何收藏数据时执行一次,之后用户增删不受影响)
    try {
      if (localStorage.getItem(FAV_SEED_KEY)) return;
      if (favStoreGet() !== null && favStoreGet() !== '[]') { localStorage.setItem(FAV_SEED_KEY, '1'); return; }
      saveFavs([
        { href: 'portal/work-queue.html', name: '我的待办' },
        { href: 'portal/governance.html', name: 'Governance' },
        { href: 'itom/alert-list.html', name: '告警中心' },
        { href: 'itom/alert-noise-reduction.html', name: '降噪中心' },
        { href: 'itsm/itsm-incidents.html', name: '事件管理' },
        { href: 'itsm/change-impact.html', name: '变更管理' },
        { href: 'itsm/service-request.html', name: '服务请求' },
        { href: 'fsm/fsm-dispatch.html', name: '现场工单工作台' },
        { href: 'cmdb/cmdb-v2-ci-list.html', name: 'CI 资产' },
        { href: 'itam/itam-overview.html', name: '资产概览' },
        { href: 'pms/pms-overview.html', name: '项目总览' },
        { href: 'ai/ai-center.html', name: 'NEO Agent Hub' }
      ]);
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
  function favItemHtml(f) {
    return '<a class="al-fav-item" href="' + basePath + f.href + '"><svg viewBox="0 0 24 24" class="al-fav-star"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg><span class="al-fav-name">' + f.name + '</span><button class="al-fav-del" onclick="event.preventDefault();event.stopPropagation();removeFav(\'' + f.href.replace(/'/g, "\\'") + '\')" title="取消收藏"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></a>';
  }
  function renderAppLauncher() {
    var holder = document.createElement('div');
    holder.className = 'app-launcher';
    holder.id = 'appLauncher';
    holder.style.display = 'none';
    var prodHtml = LAUNCHER_PRODUCTS.map(function (p) {
      // 产品 icon 新标签页打开对应产品默认首页
      return '<a class="al-product" href="' + basePath + p.href + '" target="_blank" rel="noopener" title="' + p.label + '"><span class="al-product-icon" style="background:' + p.bg + ';color:' + p.color + '">' + p.icon + '</span><span class="al-product-name">' + p.label + '</span></a>';
    }).join('');
    holder.innerHTML = '<div class="al-panel"><div class="al-section al-section-fav"><div class="al-section-head">我的收藏</div><div class="al-fav-list"></div></div><div class="al-section"><div class="al-section-head">产品</div><div class="al-product-grid">' + prodHtml + '</div></div></div>';
    document.body.appendChild(holder);
  }
  function renderFavList() {
    var list = document.querySelector('#appLauncher .al-fav-list');
    if (!list) return;
    list.innerHTML = getFavs().map(favItemHtml).join('') || '<div class="al-fav-empty">点击页面右上角星标收藏常用页面</div>';
  }
  function toggleAppLauncher(ev) {
    if (ev) ev.stopPropagation();
    var al = document.getElementById('appLauncher');
    if (!al) return;
    var open = al.style.display !== 'block';
    al.style.display = open ? 'block' : 'none';
    if (open) renderFavList();
  }
  function toggleFavCurrentPage() {
    var href = currentPageId();
    var name = CFG.breadcrumb || document.title.replace(/ - EMS.*/, '');
    var favs = getFavs();
    var i = favs.findIndex(function (f) { return f.href === href; });
    if (i >= 0) { favs.splice(i, 1); showToast && showToast('已取消收藏：' + name); }
    else { favs.unshift({ href: href, name: name }); showToast && showToast('已收藏：' + name); }
    saveFavs(favs);
    updateFavStar();
    renderFavList();
  }
  function removeFav(href) { saveFavs(getFavs().filter(function (f) { return f.href !== href; })); renderFavList(); updateFavStar(); }
  function updateFavStar() {
    var btn = document.getElementById('headerFavBtn');
    if (!btn) return;
    var on = getFavs().some(function (f) { return f.href === currentPageId(); });
    btn.classList.toggle('fav-on', on);
    btn.title = on ? '取消收藏' : '收藏当前页面';
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

    container.innerHTML = '<div class="ai-drawer-wrapper" id="aiDrawer"><div class="ai-drawer"><div class="ai-drawer-resize" id="aiDrawerResize"></div><div class="ai-drawer-header"><div class="ai-drawer-header-icon"><svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 017 7v1h1a2 2 0 012 2v1a2 2 0 01-2 2h-1a7 7 0 01-14 0H4a2 2 0 01-2-2v-1a2 2 0 012-2h1V9a7 7 0 017-7z"/><circle cx="9" cy="10" r="1" fill="#fff" stroke="none"/><circle cx="15" cy="10" r="1" fill="#fff" stroke="none"/><path d="M9 14h6"/></svg></div><span class="ai-drawer-header-title">NEO Agent</span><div class="ai-drawer-close" onclick="toggleAiDrawer()" title="关闭"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div></div><div class="ai-drawer-body"><div class="ai-drawer-welcome"><div class="ai-drawer-welcome-icon"><svg viewBox="0 0 24 24"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg></div><h3>EMS NEO Agent</h3><p>NEO Agent，支持自然语言查询、根因分析、<br>变更评估等 AI 能力</p><div class="ai-drawer-tier-hint"><span class="tier-badge tier-l3 sm">L3</span> 多层审批档位 · 只回答不动手 · 会话与 Token 消耗留痕于 T5b · <a href="' + basePath + 'ai/ai-center.html?tab=governance" onclick="event.stopPropagation()">审计 →</a></div><div class="ai-quick-actions">' + quickHtml + '</div></div></div><div class="ai-drawer-footer"><div class="ai-input-wrapper"><textarea class="ai-input-textarea" placeholder="给 NEO Agent 发消息…  输入 / 查看命令" rows="1" oninput="autoGrowTextarea(this)"></textarea><div class="ai-input-toolbar"><button class="ai-toolbar-btn" title="上传附件" onclick="event.stopPropagation()"><svg viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg><span>附件</span></button><button class="ai-toolbar-btn" title="MCP 工具连接器" onclick="this.classList.toggle(\'active\');event.stopPropagation()"><svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg><span>MCP</span><span class="badge-dot"></span><div class="ai-toolbar-dropdown"><div class="ai-toolbar-dropdown-item"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg> CMDB Connector</div><div class="ai-toolbar-dropdown-item"><svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/><path d="M9 9h6v6H9z"/></svg> ServiceNow ITSM</div><div class="ai-toolbar-dropdown-item"><svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg> 网络设备 API</div></div></button><button class="ai-toolbar-btn" title="加载 Skills" onclick="this.classList.toggle(\'active\');event.stopPropagation()"><svg viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg><span>Skills</span><div class="ai-toolbar-dropdown"><div class="ai-toolbar-dropdown-item"><svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg> 告警根因分析</div><div class="ai-toolbar-dropdown-item"><svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg> CMDB 影响分析</div><div class="ai-toolbar-dropdown-item"><svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> 容量规划</div><div class="ai-toolbar-dropdown-item"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> 周报生成</div></div></button><div class="ai-toolbar-spacer"></div><div class="ai-model-picker" id="aiModelPicker"><button class="ai-model-trigger" onclick="toggleModelPicker(event)" title="选择模型"><span class="model-dot" style="background:#10a37f"></span><span id="aiModelLabel">ChatGPT 5.5</span><svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></button><div class="ai-model-menu" id="aiModelMenu"><div class="ai-model-option active" onclick="selectModel(this,\'ChatGPT 5.5\',\'#10a37f\')"><div class="model-icon" style="background:#10a37f">G</div><div class="model-info"><div class="model-name">ChatGPT 5.5</div><div class="model-desc">OpenAI · 均衡性能与速度</div></div><svg class="model-check" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div><div class="ai-model-option" onclick="selectModel(this,\'Opus 4.7\',\'#d97706\')"><div class="model-icon" style="background:#d97706">A</div><div class="model-info"><div class="model-name">Opus 4.7</div><div class="model-desc">Anthropic · 最强推理与分析</div></div><svg class="model-check" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div><div class="ai-model-option" onclick="selectModel(this,\'DeepSeek V4 Pro\',\'#2563eb\')"><div class="model-icon" style="background:#2563eb">D</div><div class="model-info"><div class="model-name">DeepSeek V4 Pro</div><div class="model-desc">DeepSeek · 性价比之王</div></div><svg class="model-check" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div><div class="ai-model-option" onclick="selectModel(this,\'Gemini 2.5 Ultra\',\'#ea4335\')"><div class="model-icon" style="background:#ea4335">G</div><div class="model-info"><div class="model-name">Gemini 2.5 Ultra</div><div class="model-desc">Google · 多模态专家</div></div><svg class="model-check" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div><div class="ai-model-option" onclick="selectModel(this,\'Qwen3 235B\',\'#6d28d9\')"><div class="model-icon" style="background:#6d28d9">Q</div><div class="model-info"><div class="model-name">Qwen3 235B</div><div class="model-desc">通义千问 · 中文优化</div></div><svg class="model-check" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div></div></div><span class="ai-toolbar-hint">⌘ + Enter 发送</span><button class="ai-send-btn" title="发送"><svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button></div></div></div></div></div><div class="ai-fab" onclick="toggleAiDrawer()" title="NEO Agent (⌘K)"><svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 017 7v1h1a2 2 0 012 2v1a2 2 0 01-2 2h-1a7 7 0 01-14 0H4a2 2 0 01-2-2v-1a2 2 0 012-2h1V9a7 7 0 017-7z"/><circle cx="9" cy="10" r="1" fill="#fff" stroke="none"/><circle cx="15" cy="10" r="1" fill="#fff" stroke="none"/><path d="M9 14h6"/></svg><div class="ai-fab-badge"></div></div>';

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
    document.querySelectorAll('.lang-option').forEach(function (o) { o.classList.remove('active'); });
    el.classList.add('active');
    document.getElementById('langMenu').classList.remove('open');
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
    { cat: '操作', title: '打开 NEO Agent', desc: '唤起 NEO Agent 对话面板', icon: 'aibot', product: 'ai', keys: ['⌘', 'J'], action: function () { closeCmd(); toggleAiDrawer(); }, py: 'dakai ai zhushou copilot duihua' },
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
      html += '<div class="cmd-ai-text">问 NEO Agent: <strong>' + q.replace(/</g, '&lt;') + '</strong></div>';
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

  window.submitTicket = function submitTicket(btn) {
    var form = btn.closest('.ai-ticket-form');
    if (!form) return;
    var d = aiDeviceContext;
    var ticketId = 'INC-20260515-' + String(Math.floor(100 + Math.random() * 900));
    form.innerHTML = '<div class="ai-ticket-success"><div class="ai-ticket-success-icon"><svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;vertical-align:-2px"><polyline points="20 6 9 17 4 12"/></svg></div><div class="ai-ticket-success-title">工单已创建</div><div class="ai-ticket-success-id">' + ticketId + '</div><div class="ai-ticket-success-meta"><div class="ai-form-row"><span class="ai-form-label">设备</span><span class="ai-form-value">' + d.name + ' (' + d.ip + ')</span></div><div class="ai-form-row"><span class="ai-form-label">指派</span><span class="ai-form-value">网络运维组 — 张工</span></div><div class="ai-form-row"><span class="ai-form-label">状态</span><span class="ai-form-value"><span class="ai-badge success">已派发</span></span></div><div class="ai-form-row"><span class="ai-form-label">通知</span><span class="ai-form-value"><svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;vertical-align:-2px"><polyline points="20 6 9 17 4 12"/></svg> 已发送企业微信通知给指派人</span></div></div><div class="ai-ticket-success-actions"><a class="ai-link-btn" onclick="showToast(\'正在跳转到工单详情…\')">查看工单详情 →</a></div></div>';
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
    return '<div class="ai-ticket-form"><div class="ai-table-title">创建工单 — 请确认以下信息</div><p style="font-size:12px;color:var(--c-text-2);margin-bottom:10px">我根据当前对话上下文预填了工单信息，请核对后确认或修改：</p><div class="ai-form-row"><span class="ai-form-label">标题</span><span class="ai-form-value ai-editable" contenteditable="true">' + d.name + ' ' + d.alert + ' 处置</span></div><div class="ai-form-row"><span class="ai-form-label">优先级</span><span class="ai-form-value"><select class="ai-inline-select"><option value="P1" selected>P1-紧急</option><option value="P2">P2-高</option><option value="P3">P3-中</option><option value="P4">P4-低</option></select></span></div><div class="ai-form-row"><span class="ai-form-label">关联设备</span><span class="ai-form-value ai-editable" contenteditable="true">' + d.name + ' (' + d.ip + ')</span></div><div class="ai-form-row"><span class="ai-form-label">关联告警</span><span class="ai-form-value">' + d.alertId + '</span></div><div class="ai-form-row"><span class="ai-form-label">指派给</span><span class="ai-form-value"><select class="ai-inline-select"><option>网络运维组 — 张工</option><option>网络运维组 — 李工</option><option>系统运维组 — 王工</option><option>安全运维组 — 赵工</option></select></span></div><div class="ai-form-row"><span class="ai-form-label">描述</span><span class="ai-form-value ai-editable" contenteditable="true">' + d.name + '（' + d.ip + '）' + d.alert + '，需排查处理。</span></div><div class="ai-form-hint">点击蓝色字段可直接编辑，确认无误后提交</div><div class="ai-form-actions"><button class="ai-action-btn primary" onclick="submitTicket(this)">确认提交</button><button class="ai-action-btn" onclick="cancelTicket(this)">取消</button></div></div>';
  }

  var AI_SCENARIOS = [
    {
      keywords: ['告警', '在告警', '哪些设备告警', '告警设备'],
      tool: 'Skill:告警根因分析',
      response: '<div class="ai-rich-table"><div class="ai-table-title"><svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;vertical-align:-2px"><path d="M12 3L2 21h20L12 3z"/><line x1="12" y1="10" x2="12" y2="15"/><circle cx="12" cy="18" r="0.4"/></svg> 当前告警设备 (4)</div><table><thead><tr><th>设备</th><th>IP</th><th>级别</th><th>告警内容</th><th>持续</th></tr></thead><tbody><tr><td><strong>Core-SW-01</strong></td><td>10.1.1.1</td><td><span class="ai-badge critical">严重</span></td><td>CPU 使用率 &gt; 95%</td><td>32 分钟</td></tr><tr><td><strong>Edge-FW-03</strong></td><td>10.1.2.3</td><td><span class="ai-badge critical">严重</span></td><td>HA 心跳丢失</td><td>18 分钟</td></tr><tr><td><strong>Dist-SW-07</strong></td><td>10.1.3.7</td><td><span class="ai-badge warning">警告</span></td><td>端口 Gi0/1 Down</td><td>2 小时</td></tr><tr><td><strong>AP-Floor3-12</strong></td><td>10.1.10.12</td><td><span class="ai-badge warning">警告</span></td><td>信道利用率 &gt; 80%</td><td>45 分钟</td></tr></tbody></table></div>',
      followups: ['Core-SW-01 根因分析', '帮我开个工单', '静默 AP-Floor3-12 告警'],
      onMatch: function () { aiDeviceContext = { name: 'Core-SW-01', ip: '10.1.1.1', alert: 'CPU 使用率超 95%', alertId: 'ALR-20260515-0032' }; }
    },
    {
      keywords: ['开工单', '创建工单', '提工单', '工单', 'ticket'],
      tool: 'MCP:ServiceNow ITSM',
      dynamic: true,
      getResponse: generateTicketResponse,
      followups: ['添加附件', '抄送值班经理', '关联变更单']
    },
    {
      keywords: ['ping', '连通性', '通不通', '能不能通'],
      tool: 'MCP:网络设备 API',
      dynamic: true,
      getResponse: function () {
        var ip = aiDeviceContext.ip;
        return '<div class="ai-terminal"><div class="ai-table-title">Ping 测试结果 — ' + ip + '</div><pre class="ai-terminal-output">$ ping ' + ip + ' -c 4\nPING ' + ip + ': 56 data bytes\n64 bytes from ' + ip + ': seq=0 ttl=64 time=1.23ms\n64 bytes from ' + ip + ': seq=1 ttl=64 time=0.98ms\n64 bytes from ' + ip + ': seq=2 ttl=64 time=<span class="ai-highlight-red">89.21ms</span>\n64 bytes from ' + ip + ': seq=3 ttl=64 time=1.05ms\n\n--- ' + ip + ' ping statistics ---\n4 packets transmitted, 4 received, <span class="ai-highlight-green">0% packet loss</span>\nround-trip min/avg/max = 0.98/<span class="ai-highlight-yellow">23.12</span>/89.21 ms</pre><p style="margin-top:8px;font-size:12px;color:var(--c-text-3)"><svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;vertical-align:-2px"><path d="M12 3L2 21h20L12 3z"/><line x1="12" y1="10" x2="12" y2="15"/><circle cx="12" cy="18" r="0.4"/></svg> 第 3 包延迟异常（89ms），可能存在间歇性拥塞。建议执行 traceroute 定位瓶颈节点。</p></div>';
      },
      followups: ['执行 traceroute', '查看该设备接口流量', '最近 1 小时延迟趋势']
    },
    {
      keywords: ['CPU', '内存', '负载', '性能', '使用率'],
      tool: 'MCP:CMDB Connector',
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
      tool: 'MCP:CMDB Connector',
      response: '<div class="ai-rich-table"><div class="ai-table-title">最近配置变更 (24h)</div><table><thead><tr><th>时间</th><th>设备</th><th>操作人</th><th>变更类型</th><th>状态</th></tr></thead><tbody><tr><td>14:32</td><td>Core-SW-01</td><td>张工</td><td>ACL 策略更新</td><td><span class="ai-badge success">已审批</span></td></tr><tr><td>11:15</td><td>Edge-FW-03</td><td>李工</td><td>HA 配置同步</td><td><span class="ai-badge warning">进行中</span></td></tr><tr><td>09:40</td><td>Dist-SW-07</td><td>系统</td><td>固件自动升级</td><td><span class="ai-badge success">已完成</span></td></tr><tr><td>昨日 22:10</td><td>App-LB-01</td><td>王工</td><td>VIP 池扩容</td><td><span class="ai-badge success">已完成</span></td></tr></tbody></table><p style="margin-top:8px;font-size:12px;color:var(--c-text-3)">Edge-FW-03 的 HA 配置变更可能与当前心跳丢失告警相关，建议核实。</p></div>',
      followups: ['查看 Edge-FW-03 变更详情', '回滚 ACL 变更', '对比变更前后配置']
    },
    {
      keywords: ['10.10.10.1', '设备状态', '查询设备', '查一下设备'],
      tool: 'MCP:CMDB Connector + 网络设备 API',
      response: '<div class="ai-device-status"><div class="ai-table-title">设备状态 — 10.10.10.1</div><div class="ai-device-header"><div class="ai-device-name"><strong>BJ-Core-SW-02</strong><span class="ai-badge success" style="margin-left:8px">在线</span></div><div class="ai-device-meta">型号: Cisco Catalyst 9300 &nbsp;|&nbsp; SN: FCW2345L0PQ &nbsp;|&nbsp; 位置: 北京 IDC-A 机房 3层 B12柜</div></div><div class="ai-device-grid"><div class="ai-device-metric"><div class="ai-device-metric-val ai-green">32%</div><div class="ai-device-metric-label">CPU</div></div><div class="ai-device-metric"><div class="ai-device-metric-val ai-green">45%</div><div class="ai-device-metric-label">内存</div></div><div class="ai-device-metric"><div class="ai-device-metric-val">128 天</div><div class="ai-device-metric-label">运行时长</div></div><div class="ai-device-metric"><div class="ai-device-metric-val ai-green">0</div><div class="ai-device-metric-label">活跃告警</div></div></div><div class="ai-rich-table" style="margin-top:10px"><table><thead><tr><th>接口</th><th>状态</th><th>速率</th><th>入流量</th><th>出流量</th><th>错包</th></tr></thead><tbody><tr><td>GigE 0/1</td><td><span class="ai-badge success">Up</span></td><td>1Gbps</td><td>342 Mbps</td><td>287 Mbps</td><td>0</td></tr><tr><td>GigE 0/2</td><td><span class="ai-badge success">Up</span></td><td>1Gbps</td><td>156 Mbps</td><td>98 Mbps</td><td>0</td></tr><tr><td>TenGigE 1/1</td><td><span class="ai-badge success">Up</span></td><td>10Gbps</td><td>4.2 Gbps</td><td>3.8 Gbps</td><td>0</td></tr><tr><td>GigE 0/3</td><td><span class="ai-badge warning">Down</span></td><td>—</td><td>—</td><td>—</td><td>—</td></tr></tbody></table></div><p style="margin-top:8px;font-size:12px;color:var(--c-text-3)"><svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;vertical-align:-2px"><path d="M12 3L2 21h20L12 3z"/><line x1="12" y1="10" x2="12" y2="15"/><circle cx="12" cy="18" r="0.4"/></svg> GigE 0/3 处于 Down 状态（管理性关闭），其余接口运行正常。最后一次配置变更: 3 天前。</p></div>',
      followups: ['查看 GigE 0/3 为什么 Down', 'ping 10.10.10.1', '查看该设备变更记录'],
      onMatch: function () { aiDeviceContext = { name: 'BJ-Core-SW-02', ip: '10.10.10.1', alert: 'GigE 0/3 Down', alertId: 'ALR-20260515-0048' }; }
    },
    {
      keywords: ['traceroute', '路由跟踪', '跟踪路由'],
      tool: 'MCP:网络设备 API',
      dynamic: true,
      getResponse: function () {
        var ip = aiDeviceContext.ip;
        return '<div class="ai-terminal"><div class="ai-table-title">Traceroute 结果 — ' + ip + '</div><pre class="ai-terminal-output">$ traceroute ' + ip + '\ntraceroute to ' + ip + ', 30 hops max, 60 byte packets\n 1  gateway (192.168.1.1)      <span class="ai-highlight-green">0.52 ms</span>  0.48 ms  0.45 ms\n 2  10.0.0.1                   <span class="ai-highlight-green">1.23 ms</span>  1.18 ms  1.15 ms\n 3  10.0.1.1                   <span class="ai-highlight-green">2.45 ms</span>  2.38 ms  2.41 ms\n 4  10.0.2.1                   <span class="ai-highlight-red">45.67 ms</span>  <span class="ai-highlight-red">52.31 ms</span>  <span class="ai-highlight-red">48.92 ms</span>\n 5  10.1.0.1                   <span class="ai-highlight-yellow">12.34 ms</span>  11.98 ms  12.05 ms\n 6  ' + ip + '                   <span class="ai-highlight-green">3.21 ms</span>  3.15 ms  3.18 ms</pre><p style="margin-top:8px;font-size:12px;color:var(--c-text-3)"><svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;vertical-align:-2px"><path d="M12 3L2 21h20L12 3z"/><line x1="12" y1="10" x2="12" y2="15"/><circle cx="12" cy="18" r="0.4"/></svg> <strong>第 4 跳 (10.0.2.1)</strong> 延迟异常（45-52ms），该节点为 Dist-SW-05 上联口，可能存在链路拥塞或 QoS 队列溢出。</p></div>';
      },
      followups: ['查看 Dist-SW-05 接口利用率', '该链路历史延迟趋势', '帮我开个工单']
    },
    {
      keywords: ['接口流量', '端口流量', '流量趋势', '查看流量'],
      tool: 'MCP:网络设备 API',
      dynamic: true,
      getResponse: function () {
        var d = aiDeviceContext;
        return '<div class="ai-rich-table"><div class="ai-table-title">设备接口流量 — ' + d.name + ' (实时)</div><table><thead><tr><th>接口</th><th>入方向</th><th>出方向</th><th>利用率</th><th>状态</th></tr></thead><tbody><tr><td><strong>TenGigE 1/1</strong></td><td>6.2 Gbps</td><td>5.8 Gbps</td><td><span class="ai-badge critical">89%</span></td><td>Up</td></tr><tr><td><strong>TenGigE 1/2</strong></td><td>3.1 Gbps</td><td>2.7 Gbps</td><td><span class="ai-badge warning">58%</span></td><td>Up</td></tr><tr><td><strong>GigE 0/1</strong></td><td>620 Mbps</td><td>480 Mbps</td><td><span class="ai-badge warning">62%</span></td><td>Up</td></tr><tr><td><strong>GigE 0/2</strong></td><td>210 Mbps</td><td>185 Mbps</td><td><span class="ai-badge success">21%</span></td><td>Up</td></tr><tr><td><strong>GigE 0/3</strong></td><td>—</td><td>—</td><td>—</td><td><span class="ai-badge warning">Down</span></td></tr></tbody></table><p style="margin-top:8px;font-size:12px;color:var(--c-text-3)"><svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;vertical-align:-2px"><path d="M12 3L2 21h20L12 3z"/><line x1="12" y1="10" x2="12" y2="15"/><circle cx="12" cy="18" r="0.4"/></svg> TenGigE 1/1 利用率达 89%，接近饱和。建议检查是否有异常大流量或考虑负载均衡。</p></div>';
      },
      followups: ['TenGigE 1/1 Top-N 会话', '最近 24 小时流量曲线', '配置 QoS 限速']
    },
    {
      keywords: ['延迟趋势', '延迟', '时延', '历史延迟', 'latency'],
      tool: 'MCP:网络设备 API',
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
    var name = role === 'user' ? 'You' : 'NEO Agent';
    div.innerHTML = avatar + '<div class="ai-msg-content"><div class="ai-msg-name">' + name + '</div><div class="ai-msg-text">' + html + '</div></div>';
    div.style.opacity = '0';
    div.style.transform = 'translateY(8px)';
    requestAnimationFrame(function () { div.style.transition = 'opacity .3s,transform .3s'; div.style.opacity = '1'; div.style.transform = 'translateY(0)'; });
    return div;
  }

  function createTypingIndicator() {
    var div = document.createElement('div');
    div.className = 'ai-msg bot ai-typing-row';
    div.innerHTML = '<div class="ai-msg-avatar bot">AI</div><div class="ai-msg-content"><div class="ai-msg-name">NEO Agent</div><div class="ai-msg-text"><span class="ai-typing-dots"><span></span><span></span><span></span></span></div></div>';
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
      var toolTag = scenario ? scenario.tool : 'EMS NEO Agent';
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

  // Global tier legend chip (P5 · 全站底部档位口径)
  if (!document.getElementById('emsTierLegendChip')) {
    var tc = document.createElement('a');
    tc.id = 'emsTierLegendChip';
    tc.href = basePath + 'ai/ai-center.html?tab=governance';
    tc.className = 'ems-tier-legend-chip';
    tc.title = '查看 NEO Agent Hub · 治理档位定义';
    //tc.innerHTML = '<span class="tier-badge tier-l1 sm">L1</span><span class="tier-badge tier-l2 sm">L2</span><span class="tier-badge tier-l3 sm">L3</span><span class="ems-tier-legend-chip-label">档位口径 · 查看 NEO Agent Hub →</span>';
    document.body.appendChild(tc);
  }

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
      out[el.getAttribute('data-key')] = el.value;
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
    return window.openL2Drawer({
      kind: 'M3',
      tier: 'L2',
      title: '派工 · AI 已起草方案',
      meta: [
        { label: '来源工单', value: ctx.ticketId || 'INC-2024-1128' },
        { label: '客户地点', value: ctx.location || 'HKT-DC-A · 香港数据中心 A 栋' },
        { label: '关联设备', value: ctx.device || 'Web-Server-01' },
        { label: '任务类型', value: ctx.taskType || '硬件故障 · 现场排查' }
      ],
      draft: {
        fields: [
          { key: 'engineer', label: '推荐工程师', type: 'select', value: ctx.engineer || 'P.Y. Lau · GBA-GZ 待命', options: ['P.Y. Lau · GBA-GZ 待命', 'K.H. Wong · HKT Tower', 'T.K. Yip · 待命', 'M.L. Chan · GBA-SZ', '(手工指派)'] },
          { key: 'skill', label: '技能要求', type: 'text', value: ctx.skill || '硬件维护 · 电力系统认证' },
          { key: 'eta', label: '预计到达时间', type: 'select', value: ctx.eta || '2 小时', options: ['30 分钟', '1 小时', '2 小时', '4 小时', '次日'] },
          { key: 'priority', label: '优先级', type: 'select', value: ctx.priority || 'P1 紧急', options: ['P1 紧急', 'P2 重要', 'P3 一般', 'P4 计划'] },
          { key: 'note', label: '任务说明 · AI 起草', type: 'textarea', value: ctx.note || 'Web-Server-01 CPU 持续 95% · 建议现场检查硬件散热 · 备件已通知库房准备 · 客户联系人：张伟（DC 值班）15912345678' }
        ]
      },
      evidence: [
        { label: 'AI 派工依据 · 技能/位置/负载三维度', href: '../ai/ai-center.html?tab=governance' },
        { label: 'CMDB 设备位置 · Web-Server-01 · HKT-DC-A', href: '../cmdb/cmdb-v2-ci-detail.html' },
        { label: '工程师历史工单 · P.Y. Lau · 完成率 96%', href: '../fsm/fsm-dispatch.html' },
        { label: 'AI 调用记录 · DeepSeek V4 · 3.2k in / 0.8k out · ¥0.008', href: '../ai/ai-center.html?tab=governance' }
      ],
      tips: '采纳 AI 派工建议 · Token ¥0.008 · 派工留痕 T5 审计',
      onApprove: function (draft) {
        return '<svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;vertical-align:-2px"><polyline points="20 6 9 17 4 12"/></svg> 已派单 ' + (draft.engineer || '').split(' · ')[0] + ' · 通知已发送 · 客户短信已推送';
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
        { label: 'AI 调用记录', href: '../ai/ai-center.html?tab=governance' }
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
      tier: 'L3',
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
        { label: 'AI 调用记录 · Skills:告警根因分析', href: '../ai/ai-center.html?tab=platform' }
      ],
      tips: 'L3 规则一旦启用 = AI 直接聚合 · 值班经理审批后立即生效 · 可随时禁用',
      onApprove: function (draft) {
        return '<svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;vertical-align:-2px"><polyline points="20 6 9 17 4 12"/></svg> 规则 "' + draft.name + '" 已启用 · L1 自动执行生效';
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
        { label: 'AI 风险评估调用记录 · Opus 4.7 · 8.2k in / 2.1k out · ¥0.033', href: '../ai/ai-center.html?tab=governance' },
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

  // ── M5 · 服务请求 · AI 起草说明 + 人工审批 or L1 自动执行 ────────
  window.openL2ServiceRequestDrawer = function (ctx) {
    ctx = ctx || {};
    var isWhiteList = ctx.tier === 'L3';
    var decisionOpts = isWhiteList ? ['自动通过', '批准', '批准（附条件）', '驳回', '要求补充材料'] : ['批准', '批准（附条件）', '驳回', '要求补充材料'];
    var defaultDecision = (ctx.decision && decisionOpts.indexOf(ctx.decision) !== -1) ? ctx.decision : (isWhiteList ? '自动通过' : '批准');
    return window.openL2Drawer({
      kind: 'M5',
      tier: ctx.tier || 'L2',
      title: (isWhiteList ? 'L1 自动执行 · ' : '') + '服务请求审批 · ' + (ctx.type || 'VPN 申请'),
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
        { label: '合规规则库 · VPN 类型规则 v3.2', href: '../ai/ai-center.html?tab=platform' },
        { label: '相似请求 · SR-2024-0798（3 天前拒绝）', href: '../itsm/service-request.html' },
        { label: 'AI 调用记录 · DeepSeek V4 · 2.1k in / 0.6k out · ¥0.005', href: '../ai/ai-center.html?tab=governance' }
      ],
      tips: (isWhiteList ? 'L1 自动执行 · 客户可随时关闭 · ' : 'L2 高风险 · 100% 人工决策 · ') + 'T5 完整审计 · T2 Token 计入账单',
      onApprove: function (draft) {
        return '<svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;vertical-align:-2px"><polyline points="20 6 9 17 4 12"/></svg> 服务请求 ' + (ctx.requestId || 'SR-2024-0826') + ' 已' + (draft.decision || '批准') + ' · 履约动作已触发 · 通知已发送';
      },
      onOverride: function (draft, reason) {
        return '服务请求 Override 已留痕 · 原因："' + reason + '"';
      }
    });
  };
})();
