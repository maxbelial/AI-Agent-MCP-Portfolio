(function () {
  var page = window.EMS_PAGE || {};
  var menu = page.activeMenu || '';
  var params = new URLSearchParams(window.location.search || '');
  if (params.get('capture') === '1') return;
  if (!/^(ump|mop)\//.test(menu) || /getting-started\.html$/.test(menu)) return;

  var tours = {
    'ump/overview.html': ['先用 MSP / ENT 切换确认数据范围。MSP 看租户，ENT 看项目和客户。', '从 KPI 找出最紧急的资产、服务、现场或项目风险。', '点击租户或项目进入对应场景页处理，不在总览里做深操作。'],
    'ump/assets.html': ['先确认是跨租户资产风险，还是当前租户内项目 / 客户资产风险。', '优先处理维保到期、库存低水位、盘点差异和资产申请。', '复杂资产生命周期进入资产高级管理。'],
    'ump/service-ops.html': ['先看请求、事件、问题、变更和 SLA 风险的队列摘要。', '一线从待办进入处理，管理者从风险排行进入下钻。', '流程模板、SLA 和服务目录配置进入服务管理设置。'],
    'ump/field-service.html': ['先看待派工、工程师负载和 SLA 风险。', '调度员处理派工，现场工程师从工作台接单和回写。', '验收、排班和工程师深度管理进入现场服务管理。'],
    'ump/projects.html': ['先区分总项目、子项目和独立项目。', 'PMO 看组合风险，PM 看里程碑、任务、交付物和验收。', '复杂项目计划进入项目高级管理。'],
    'mop/objects.html': ['先看离线对象、发现异常和未关联 CI。', 'ENT 视角按项目和客户判断对象影响。', '对象关系深查进入配置管理或拓扑。'],
    'mop/network.html': ['先看网络质量和拨测失败，再定位链路和站点。', '网络工程师从异常链路进入拓扑或诊断。', '影响到服务时回到告警或 ITSM 事件闭环。'],
    'mop/configuration.html': ['先看 CI、服务关系、影响分析和数据质量。', '变更或告警处置前先判断影响面。', '深度建模和数据治理进入配置建模。'],
    'mop/alerts.html': ['先看 P1/P2、降噪关联和转事件状态。', '一线认领确认，L2/L3 处理根因，经理看升级风险。', '有效告警进入我的待办或 ITSM 事件闭环。'],
    'mop/automation.html': ['先看自动处置成功率和失败重试。', '高风险自动化动作需要进入治理或审批。', '失败项优先转人工队列，不让告警沉没。'],
    'mop/capacity.html': ['先看 7 日容量风险和可用性下降对象。', '按项目和客户判断扩容影响。', '需要执行时进入变更、派工或资产申请链路。']
  };

  var steps = tours[menu];
  if (!steps) return;

  function renderTour(openByDefault) {
    var oldPanel = document.querySelector('.scenario-tour-panel');
    if (oldPanel) oldPanel.remove();
    if (!openByDefault) return;

    var panel = document.createElement('div');
    panel.className = 'scenario-tour-panel';
    panel.innerHTML = [
      '<div class="scenario-tour-head"><strong>页面导览</strong><button class="scenario-tour-close" type="button">关闭</button></div>',
      '<div class="scenario-tour-body">',
      steps.map(function (step, index) {
        return '<div class="scenario-tour-step"><b>' + (index + 1) + '</b><span>' + step + '</span></div>';
      }).join(''),
      '</div>'
    ].join('');
    document.body.appendChild(panel);
    if (typeof window.EMS_I18N_REFRESH === 'function') {
      window.EMS_I18N_REFRESH(panel);
    }
    panel.querySelector('.scenario-tour-close').addEventListener('click', function () {
      localStorage.setItem('ems-tour-seen-' + menu, '1');
      panel.remove();
    });
  }

  function init() {
    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'scenario-tour-trigger';
    trigger.textContent = '页面导览';
    document.body.appendChild(trigger);
    if (typeof window.EMS_I18N_REFRESH === 'function') {
      window.EMS_I18N_REFRESH(trigger);
    }
    trigger.addEventListener('click', function () { renderTour(!document.querySelector('.scenario-tour-panel')); });

    var seenKey = 'ems-tour-seen-' + menu;
    if (!localStorage.getItem(seenKey)) {
      renderTour(true);
      localStorage.setItem(seenKey, '1');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
