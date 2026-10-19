(function () {
  var currentPath = location.pathname.replace(/\\/g, '/').split('/prototype/').pop() || '';
  var viewKey = 'ems-scenario-view';
  var tenantKey = 'ems-scenario-tenant';
  var DEFAULT_ENT_TENANT = 'tn_ctf';
  var TENANT_NAMES = {tn_ctf:'周大福（CTF）',tn_domino:'达美乐（Domino）',tn_gf:'广发证券',tn_mx:'香港美心MX'};
  var TENANT_OPTIONS_HTML = '<option value="">全部租户（MSP 视角）</option><option value="tn_ctf">周大福（CTF）</option><option value="tn_domino">达美乐（Domino）</option><option value="tn_gf">广发证券</option><option value="tn_mx">香港美心MX</option>';
  var ENT_DIMENSION = {
    projectLabel: '项目',
    customerLabel: '客户',
    values: [
      ['APAC 门店网络升级', '周大福香港'],
      ['POS 终端替换', '周大福澳门'],
      ['数据中心改造', 'CTF Shared IT'],
      ['备份平台迁移', 'CTF APAC'],
      ['门店扩容交付', 'CTF Retail'],
      ['办公网络优化', 'CTF Corporate']
    ]
  };

  var config = {
    'ump/overview.html': {
      entDesc: '当前企业租户内按项目 / 客户查看资产、服务、现场与交付结果。管理看项目和客户，执行进工作台。',
      entNote: ['ENT 企业租户运营视角', '同一汇总组件从租户维度切换为项目 / 客户维度。', ['9 项目', '5 客户', '3 交付风险']],
      entKpis: [['客户项目', '9', '3 个项目需关注'], ['资产总量', '12,860', '维保到期 86 台'], ['服务工单', '326', 'SLA 风险 9 单'], ['现场任务', '72', '待派工 8 单'], ['在途项目', '9', '红色风险 1 个'], ['运营风险', '6', '需本周闭环']],
      rename: [['租户运营汇总', '项目 / 客户运营汇总'], ['MSP 全量 · ENT 当前租户', '当前企业租户 · 按项目 / 客户']]
    },
    'ump/assets.html': {
      entDesc: '当前企业租户内管理资产台账、合同维保、库存盘点与资产申请，复杂生命周期进入资产高级管理。',
      entNote: ['ENT 企业租户资产视角', '同一资产列表从租户维度切换为项目 / 客户维度。', ['9 项目', '86 到期', '9 低水位']],
      entKpis: [['资产总量', '12,860', '当前企业租户 · 9 项目'], ['维保到期', '86', '30 天内需跟进'], ['库存风险', '9', '低水位备件/耗材'], ['盘点差异', '6', '待确认差异项']],
    },
    'mop/configuration.html': {
      entDesc: '当前企业租户内查看 CI、服务关系、影响面与数据质量，复杂模型维护进入配置建模。',
      entNote: ['ENT 企业租户配置视角', '默认按项目 / 客户查看配置关系和影响面。', ['9 项目', '5 客户', '14 待治理']],
      entKpis: [['配置项', '18,442', '服务覆盖率 92.4%'], ['关系完整度', '93.2%', '较上周 +1.8%'], ['影响分析请求', '38', '变更/告警联动'], ['质量问题', '14', '孤立/重复/缺字段']],
    },
    'ump/service-ops.html': {
      entDesc: '当前企业租户内跟进请求、事件、问题、变更与知识。待办进工作台。',
      entNote: ['ENT 企业租户服务视角', '默认按项目 / 客户查看服务履约和待处理队列。', ['326 工单', '9 SLA 风险', '5 客户']],
      entKpis: [['服务请求', '126', '待审批 18 单'], ['事件', '142', 'P1/P2 共 7 单'], ['变更', '28', '本周窗口 11 个'], ['知识命中', '68%', 'TOP 服务 3 个']],
    },
    'ump/field-service.html': {
      entDesc: '当前企业租户内管理现场工单、派工、工程师资源和排班。待办进工作台。',
      entNote: ['ENT 企业租户现场视角', '默认按项目 / 客户查看现场任务、服务等级和履约风险。', ['72 现场任务', '9 项目', '8 待派工']],
      entKpis: [['现场任务', '72', '今日新增 11 单'], ['待派工', '8', '4 小时 SLA 3 单'], ['工程师利用率', '79%', '较上周 +4%'], ['一次修复率', '86%', '本月平均']],
    },
    'ump/projects.html': {
      entDesc: '当前企业租户内查看总项目、子项目、任务、交付物和验收关闭。PM / PMO 按里程碑推进。',
      entNote: ['ENT 企业租户项目视角', '默认按项目 / 客户、里程碑、PM 和交付风险组织项目工作。', ['9 在途项目', '5 客户', '1 红色风险']],
      entKpis: [['在途项目', '9', '总项目 2 · 子项目 7'], ['延期风险', '2', '1 个红色风险'], ['待验收', '3', '本周计划关闭'], ['交付物', '42', '待确认 6 项']],
    },
    'mop/objects.html': {
      entDesc: '当前企业租户内查看服务器、网络、链路、站点与业务服务健康。',
      entNote: ['ENT 企业租户对象视角', '默认按项目 / 客户查看监控对象健康和关联 CI。', ['7,420 对象', '5 客户', '21 未关联 CI']],
      entKpis: [['监控对象', '7,420', '服务器 / 网络 / 站点 / 服务'], ['离线对象', '12', '5 个影响生产服务'], ['未关联 CI', '21', '需回补配置关系'], ['发现异常', '6', '凭据/连通性失败']],
    },
    'mop/network.html': {
      entDesc: '当前企业租户内按项目 / 客户查看网络质量、拨测任务和链路影响。',
      entNote: ['ENT 企业租户网络视角', '默认按项目 / 客户定位网络影响。', ['9 项目', '5 客户', '4 高延迟']],
      entKpis: [['链路健康', '94', '当前企业租户评分'], ['拨测成功率', '99.1%', '近 24 小时'], ['高延迟链路', '4', '超过阈值'], ['受影响站点', '3', '需重点关注']],
    },
    'mop/alerts.html': {
      entDesc: '当前企业租户内处理告警、降噪、转单与处置记录。待办进工作台。',
      entNote: ['ENT 企业租户告警视角', '默认按项目 / 客户查看告警影响和处置状态。', ['42 活跃告警', '7 高优先级', '5 客户']],
      entKpis: [['活跃告警', '42', 'P1/P2 共 7 条'], ['降噪率', '64%', '关联聚合 86 条'], ['已转事件', '11', '近 24 小时'], ['平均确认', '7m', '较上周下降 4m']],
    },
    'mop/automation.html': {
      entDesc: '当前企业租户内管理自动处置规则、编排记录、失败重试和转单链路。',
      entNote: ['ENT 企业租户自动化视角', '默认按项目 / 客户查看自动化收益和风险。', ['76% 自动处置', '3 失败重试', '5 客户']],
      entKpis: [['自动处置率', '76%', '当前企业租户 · 24 小时'], ['转事件', '11', '自动生成'], ['失败重试', '3', '需人工确认'], ['节省工时', '12h', '估算值']],
    },
    'mop/capacity.html': {
      entDesc: '当前企业租户内查看容量预测、可用性趋势、风险对象和优化建议。',
      entNote: ['ENT 企业租户容量视角', '默认按项目 / 客户制定扩容和优化动作。', ['8 容量风险', '5 客户', '99.91% 可用性']],
      entKpis: [['可用性', '99.91%', '近 30 天'], ['容量风险', '8', '7 日内需处理'], ['高水位对象', '3', 'CPU / 存储 / 连接数'], ['优化建议', '5', '可自动生成变更']],
    },
  };

  function onReady(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  function getCfg() {
    return config[currentPath.replace(/^.*?(ump|mop)\//, '$1/')];
  }

  function makeSwitch(page) {
    var wrap = document.createElement('div');
    wrap.className = 'scenario-perspective-control';
    wrap.innerHTML = '<select class="tenant-switch" title="租户切换（默认全部租户 · 租户为数据维度）">' + TENANT_OPTIONS_HTML + '</select>';
    wrap.querySelector('select').addEventListener('change', function (event) {
      var tenant = event.target.value;
      if (tenant) sessionStorage.setItem(tenantKey, tenant);
      var tenantName = tenant ? TENANT_NAMES[tenant] : '全部租户（MSP视角）';
      try { localStorage.setItem('ems-active-tenant', tenantName); } catch (e) {}
      try { window.dispatchEvent(new CustomEvent('ems:tenant-change', {detail:{tenant:tenantName, source:'page'}})); } catch (e) {}
      setView(tenant ? 'ent' : 'msp');
    });
    var target = page.querySelector('.title-actions') || page.querySelector('.scope') || page.querySelector('.actions');
    if (target && !target.querySelector('.scenario-perspective-control')) target.prepend(wrap);
  }

  function saveOriginals(page) {
    page.querySelectorAll('.desc, .hero p, .summary, .kpis, .scope, .section-title, .section-sub, .panel-head, .filter, table, th, td').forEach(function (el) {
      if (!el.dataset.mspHtml) el.dataset.mspHtml = el.innerHTML;
    });
  }

  function markDimensionColumns(page) {
    page.querySelectorAll('table').forEach(function (table) {
      Array.prototype.forEach.call(table.querySelectorAll('thead th'), function (th, index) {
        if (/^租户$|租户范围/.test(th.textContent.trim())) {
          table.classList.add('scenario-dimension-table');
          th.classList.add('scenario-dimension-col');
          table.querySelectorAll('tbody tr').forEach(function (tr) {
            if (tr.children[index]) tr.children[index].classList.add('scenario-dimension-col');
          });
        }
      });
    });
  }

  function renderScope(page, cfg, view) {
    var scope = page.querySelector('.scope');
    if (!scope) return;
    var switcher = scope.querySelector('.scenario-perspective-control');
    if (!switcher) return;
    scope.innerHTML = '';
    scope.appendChild(switcher);
  }

  function renderKpis(page, cfg, view) {
    var box = page.querySelector('.summary, .kpis');
    if (!box || view === 'msp') {
      if (box && box.dataset.mspHtml) box.innerHTML = box.dataset.mspHtml;
      return;
    }
    box.innerHTML = cfg.entKpis.map(function (item) {
      var cls = box.classList.contains('kpis') ? 'kpi' : 'card';
      return '<div class="' + cls + '"><div class="label">' + item[0] + '</div><div class="value">' + item[1] + '</div><div class="sub">' + item[2] + '</div></div>';
    }).join('');
  }

  function renderNote(page, cfg, view) {
    var existing = page.querySelector('.perspective-note');
    if (view === 'msp') {
      if (existing) existing.remove();
      return;
    }
    if (!existing) {
      existing = document.createElement('section');
      existing.className = 'perspective-note';
      var after = page.querySelector('.summary, .kpis') || page.querySelector('.head, .hero');
      after.insertAdjacentElement('afterend', existing);
    }
    var note = cfg.entNote || ['ENT 项目 / 客户视角', '同一运营组件从租户维度切换为项目 / 客户维度，避免把 MSP 租户排行简单降级为 ENT 列表。', ['项目维度', '客户维度', '当前企业租户']];
    existing.innerHTML = '<div><strong>' + note[0] + '</strong> · ' + note[1] + '</div><div class="note-tags">' + note[2].map(function (tag) { return '<span class="note-tag">' + tag + '</span>'; }).join('') + '</div>';
  }

  function renderDimensionColumns(page, cfg, view) {
    page.querySelectorAll('.scenario-dimension-table').forEach(function (table) {
      if (view === 'msp') {
        if (table.dataset.mspHtml) table.innerHTML = table.dataset.mspHtml;
        markDimensionColumns(page);
        return;
      }

      var dimensionHeader = table.querySelector('thead th.scenario-dimension-col');
      var cells = table.querySelectorAll('tbody td.scenario-dimension-col');
      var dimension = ENT_DIMENSION;
      var headers = Array.prototype.slice.call(table.querySelectorAll('thead th'));
      var dimensionIndex = headers.indexOf(dimensionHeader);
      var hasProjectBeforeDimension = headers.slice(0, dimensionIndex).some(function (th) {
        return th.textContent.trim() === dimension.projectLabel;
      });
      if (dimensionHeader) {
        dimensionHeader.innerHTML = hasProjectBeforeDimension ? dimension.customerLabel : dimension.projectLabel;
        if (!hasProjectBeforeDimension && (!dimensionHeader.nextElementSibling || !dimensionHeader.nextElementSibling.classList.contains('scenario-customer-col'))) {
          var customerTh = document.createElement('th');
          customerTh.className = 'scenario-customer-col';
          customerTh.innerHTML = dimension.customerLabel;
          dimensionHeader.insertAdjacentElement('afterend', customerTh);
        }
      }
      cells.forEach(function (cell, index) {
        var pair = dimension.values[index % dimension.values.length];
        cell.innerHTML = hasProjectBeforeDimension ? pair[1] : pair[0];
        if (!hasProjectBeforeDimension && (!cell.nextElementSibling || !cell.nextElementSibling.classList.contains('scenario-customer-col'))) {
          var customerTd = document.createElement('td');
          customerTd.className = 'scenario-customer-col';
          customerTd.innerHTML = pair[1];
          cell.insertAdjacentElement('afterend', customerTd);
        } else if (!hasProjectBeforeDimension && cell.nextElementSibling) {
          cell.nextElementSibling.innerHTML = pair[1];
        }
      });
    });
  }

  function replaceTexts(page, cfg, view) {
    if (view === 'msp') {
      page.querySelectorAll('[data-msp-html]').forEach(function (el) {
        if (el.matches('.scope, .summary, .kpis, th, td')) return;
        el.innerHTML = el.dataset.mspHtml;
      });
      return;
    }
    var desc = page.querySelector('.desc, .hero p');
    if (desc && cfg.entDesc) desc.textContent = cfg.entDesc;
    page.querySelectorAll('.filter').forEach(function (el) {
      el.innerHTML = el.innerHTML.replace(/全部租户/g, '当前租户').replace(/跨租户/g, '本租户');
    });
    (cfg.rename || []).forEach(function (pair) {
      page.querySelectorAll('.section-title, .section-sub, .panel-head').forEach(function (el) {
        el.innerHTML = el.innerHTML.replace(pair[0], pair[1]);
      });
    });
  }

  function setView(view) {
    var cfg = getCfg();
    var page = document.querySelector('.main .page');
    if (!cfg || !page) return;
    if (view === 'op') view = 'ent';
    sessionStorage.setItem(viewKey, view);
    page.classList.toggle('view-ent', view === 'ent');
    page.classList.toggle('view-msp', view !== 'ent');
    renderScope(page, cfg, view);
    renderKpis(page, cfg, view);
    replaceTexts(page, cfg, view);
    renderDimensionColumns(page, cfg, view);
    renderNote(page, cfg, view);
    page.querySelectorAll('.scenario-perspective-control').forEach(function (control) {
      var select = control.querySelector('.tenant-switch');
      if (select) select.value = view === 'ent' ? (sessionStorage.getItem(tenantKey) || DEFAULT_ENT_TENANT) : '';
    });
    if (typeof window.EMS_I18N_REFRESH === 'function') {
      window.EMS_I18N_REFRESH(page);
    }
  }

  window.EMSScenarioPerspectiveSetView = setView;

  onReady(function () {
    var cfg = getCfg();
    var page = document.querySelector('.main .page');
    if (!cfg || !page) return;
    saveOriginals(page);
    markDimensionColumns(page);
    makeSwitch(page);
    var savedView = sessionStorage.getItem(viewKey) || 'msp';
    setView(savedView === 'op' ? 'ent' : savedView);
  });
})();
