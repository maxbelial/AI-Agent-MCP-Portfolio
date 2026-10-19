(function () {
  function enhanceTable(table) {
    var headRow = table.querySelector('thead tr');
    if (!headRow) return;

    var firstHead = headRow.querySelector('th');
    if (firstHead && !firstHead.querySelector('input[type="checkbox"]')) {
      var selectHead = document.createElement('th');
      selectHead.style.width = '36px';
      selectHead.innerHTML = '<input class="row-checkbox" type="checkbox" aria-label="选择全部记录">';
      headRow.insertBefore(selectHead, firstHead);
      table.querySelectorAll('tbody tr').forEach(function (row) {
        var cell = document.createElement('td');
        cell.innerHTML = '<input class="row-checkbox" type="checkbox" aria-label="选择记录">';
        row.insertBefore(cell, row.firstElementChild);
      });
    }

    var heads = Array.prototype.slice.call(headRow.children);
    var hasOperationHead = heads.some(function (head) { return head.textContent.trim() === '操作'; });
    heads.forEach(function (head, index) {
      var hasFieldTools = head.querySelector('.itsm-head-tools, [title="排序"], [aria-label="排序"], [title="筛选"], [aria-label="筛选"]');
      if (index === 0 || (hasOperationHead && index === heads.length - 1) || hasFieldTools) return;
      head.classList.add('itsm-field-head');
      var tools = document.createElement('span');
      tools.className = 'itsm-head-tools';
      tools.innerHTML = '<button type="button" title="排序" aria-label="排序">&#8597;</button><button type="button" title="筛选" aria-label="筛选">&#9662;</button>';
      head.appendChild(tools);
    });

    table.querySelectorAll('tbody tr').forEach(function (row) {
      var cells = Array.prototype.slice.call(row.children);
      var existingCoreLink = null;
      cells.slice(1, 4).some(function (cell) {
        existingCoreLink = cell.querySelector('a[href], a[onclick], button[data-href]');
        return Boolean(existingCoreLink);
      });
      if (existingCoreLink) existingCoreLink.classList.add('record-link');

      var page = document.body.getAttribute('data-detail-page');
      if (!page || existingCoreLink) return;
      var target = cells.slice(1, 4).find(function (cell) {
        return cell && cell.textContent.trim() && !cell.querySelector('a, button, input');
      });
      if (!target) return;
      var text = target.textContent.trim();
      target.textContent = '';
      var link = document.createElement('a');
      link.className = 'record-link';
      link.href = page;
      link.textContent = text;
      target.appendChild(link);
    });
  }

  function ensureTableMoreAction(table) {
    var operationHead = Array.prototype.find.call(table.querySelectorAll('thead th'), function (head) {
      return head.textContent.trim() === '操作';
    });
    if (!operationHead) return;
    var operationIndex = Array.prototype.indexOf.call(operationHead.parentElement.children, operationHead);
    table.querySelectorAll('tbody tr').forEach(function (row) {
      var cell = row.children[operationIndex];
      if (!cell) return;
      normalizeOperationCell(cell);
    });
  }

  function normalizePagination(pagination) {
    var controls = pagination.querySelector('.pagination-btns, .pagination-controls, .pagination-right, .pages');
    if (!controls) return;
    var info = pagination.querySelector('.pagination-info') || pagination.firstElementChild;
    if (info) {
      var total = info.textContent.match(/共\s*([\d,]+)\s*条/);
      if (total) info.textContent = '共 ' + total[1] + ' 条记录';
    }
    var buttons = controls.querySelectorAll('button');
    if (buttons.length) {
      buttons[0].textContent = '‹';
      buttons[0].title = '上一页';
      buttons[0].setAttribute('aria-label', '上一页');
      if (buttons.length > 1) {
        var last = buttons[buttons.length - 1];
        last.textContent = '›';
        last.title = '下一页';
        last.setAttribute('aria-label', '下一页');
      }
    }
    controls.querySelectorAll('.page-info, [class*="page-hint"]').forEach(function (hint) { hint.remove(); });
    Array.prototype.slice.call(controls.querySelectorAll('span')).forEach(function (span) {
      if (/^\s*(?:第\s*)?\d+\s*\/\s*\d+\s*(?:页)?\s*$/.test(span.textContent)) {
        var active = document.createElement('button');
        active.type = 'button';
        active.className = 'page-btn active';
        active.textContent = (span.textContent.match(/\d+/) || ['1'])[0];
        active.setAttribute('aria-current', 'page');
        span.replaceWith(active);
      }
    });
    var existingSize = Array.prototype.find.call(controls.querySelectorAll('span'), function (span) {
      return /每页\s*20\s*条/.test(span.textContent);
    });
    if (existingSize) existingSize.classList.add('itsm-page-size');
    if (!existingSize && !pagination.querySelector('.itsm-page-size')) {
      var size = document.createElement('span');
      size.className = 'itsm-page-size';
      size.textContent = '每页 20 条';
      controls.appendChild(size);
    }
  }

  function ensurePaginationForTable(table) {
    var container = table.closest('.table-card, .tab-panel, .panel, .card, .report-list, .table-shell') || table.parentElement;
    if (!container || container.querySelector('.pagination')) return;
    var count = table.querySelectorAll('tbody tr').length;
    var pagination = document.createElement('div');
    pagination.className = 'pagination';
    pagination.innerHTML = '<span class="pagination-info">共 ' + count + ' 条记录</span>' +
      '<div class="pagination-btns"><button class="page-btn" type="button" disabled title="上一页" aria-label="上一页">‹</button>' +
      '<button class="page-btn active" type="button">1</button>' +
      '<button class="page-btn" type="button" disabled title="下一页" aria-label="下一页">›</button></div>';
    container.appendChild(pagination);
  }

  function normalizePrimaryAdd(button) {
    if (!/新增|新建|创建/.test(button.textContent.trim())) return;
    Array.prototype.slice.call(button.childNodes).forEach(function (node) {
      if (node.nodeType === Node.TEXT_NODE || (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'SVG')) {
        node.remove();
      }
    });
    button.insertAdjacentText('beforeend', ' 添加');
  }

  function ensureMoreAction(container) {
    if (container.querySelector('.more-btn')) return;
    var more = document.createElement('button');
    more.type = 'button';
    more.className = 'more-btn';
    more.textContent = '⋮';
    more.title = '更多';
    more.setAttribute('aria-label', '更多');
    container.appendChild(more);
  }

  function normalizeToolbar(toolbar) {
    toolbar.classList.add('itsm-list-toolbar');
    toolbar.querySelectorAll('.spacer, .toolbar-spacer').forEach(function (spacer) { spacer.remove(); });
    Array.prototype.slice.call(toolbar.children).forEach(function (child) {
      if (!child.matches('div, span')) return;
      var actions = Array.prototype.slice.call(child.children).filter(function (item) {
        return item.matches('a, button');
      });
      if (!actions.length) return;
      var style = child.getAttribute('style') || '';
      if (!child.matches('.filter-actions, .toolbar-actions, .actions') && !/margin-left\s*:\s*auto|display\s*:\s*flex/.test(style)) return;
      actions.forEach(function (action) { toolbar.insertBefore(action, child); });
      if (!child.textContent.trim() && !child.children.length) child.remove();
    });
    var search = toolbar.querySelector('.search-wrap, input.search-input, input[type="search"], input[placeholder*="搜索"]');
    if (!search) {
      search = document.createElement('input');
      search.type = 'search';
      toolbar.appendChild(search);
    }
    if (search) {
      search.classList.add('itsm-keyword-search');
      var input = search.matches('input') ? search : search.querySelector('input');
      if (input) input.placeholder = '关键词搜索';
    }
    toolbar.querySelectorAll('a, button').forEach(function (button) {
      var label = button.textContent.trim();
      button.classList.add('itsm-toolbar-button');
      if (/新增|新建|创建|添加/.test(label)) button.classList.add('itsm-add-button');
      if (/导入/.test(label)) button.classList.add('itsm-import-button');
      if (/导出/.test(label)) button.classList.add('itsm-export-button');
      if (button.classList.contains('btn-primary')) button.classList.add('itsm-primary-button');
    });
    var directActions = Array.prototype.slice.call(toolbar.children).filter(function (item) {
      return item.matches('a, button');
    });
    directActions.sort(function (left, right) {
      function rank(item) {
        if (item.classList.contains('itsm-add-button') || item.classList.contains('itsm-primary-button')) return 1;
        if (item.classList.contains('itsm-import-button')) return 2;
        if (item.classList.contains('itsm-export-button')) return 3;
        return 4;
      }
      return rank(left) - rank(right);
    });
    var actionFragment = document.createDocumentFragment();
    directActions.forEach(function (action) { actionFragment.appendChild(action); });
    toolbar.insertBefore(actionFragment, toolbar.firstChild);
  }

  function normalizeOperationCell(cell) {
    cell.querySelectorAll('a, button').forEach(function (action) {
      var label = action.textContent.trim();
      if (action.classList.contains('more-btn') || label === '⋮' || /更多/.test(label)) {
        action.classList.add('more-btn');
        action.classList.remove('lowcode-row-action');
        action.textContent = '⋮';
        action.title = '更多';
        action.setAttribute('aria-label', '更多');
        return;
      }
      action.classList.add('lowcode-row-action');
      if (/删除|终止|作废/.test(label) || action.classList.contains('danger')) {
        action.classList.add('is-danger');
      }
    });
  }

  function normalizeBottomBar(bar) {
    var candidates = Array.prototype.slice.call(bar.querySelectorAll('a, button'));
    var back = candidates.find(function (item) {
      return /后退|返回|取消/.test(item.textContent.trim());
    });
    if (!back) return;
    back.classList.add('bar-back');
    back.querySelectorAll('svg').forEach(function (icon) { icon.remove(); });
    Array.prototype.slice.call(back.childNodes).forEach(function (node) {
      if (node.nodeType === Node.TEXT_NODE) node.remove();
    });
    back.insertAdjacentText('afterbegin', '< 后退');
    var parent = back.parentElement;
    if (parent && parent !== bar && parent.children.length === 1) parent.classList.add('bar-back-wrap');
  }

  function ensureSingleTableToolbar(tables) {
    if (tables.length !== 1 || document.querySelector('.itsm-list-toolbar')) return;
    var table = tables[0];
    var tableHost = table.closest('.table-card, .table-container, .table-shell, .report-list') || table.parentElement;
    if (!tableHost || !tableHost.parentElement) return;
    var toolbar = document.createElement('div');
    toolbar.className = 'filter-bar';
    toolbar.innerHTML = '<div class="search-wrap"><input type="search" placeholder="关键词搜索" aria-label="关键词搜索"></div>';
    tableHost.parentElement.insertBefore(toolbar, tableHost);
    normalizeToolbar(toolbar);
  }

  function removeRedundantDetailActions(table) {
    var operationHead = Array.prototype.find.call(table.querySelectorAll('thead th'), function (head) {
      return head.textContent.trim() === '操作';
    });
    table.classList.toggle('itsm-has-operation-column', Boolean(operationHead));
    if (!operationHead) return;
    var operationIndex = Array.prototype.indexOf.call(operationHead.parentElement.children, operationHead);
    var rows = Array.prototype.slice.call(table.querySelectorAll('tbody tr'));
    var hasRealAction = false;
    rows.forEach(function (row) {
      var coreDetail = row.querySelector('a.record-link, a[href*="detail"]');
      var cell = row.children[operationIndex];
      if (!cell) return;
      if (coreDetail) {
        cell.querySelectorAll('a, button').forEach(function (action) {
          if (/^(查看|详情)$/.test(action.textContent.trim())) action.remove();
        });
        if (/^(查看|详情)$/.test(cell.textContent.trim())) cell.textContent = '';
      }
      if (cell.querySelector('a, button') || cell.textContent.trim()) hasRealAction = true;
    });
    table.classList.toggle('itsm-no-operation-column', rows.length > 0 && !hasRealAction);
  }

  function normalizeSingleTableViewport(tables) {
    if (tables.length !== 1) return;
    var table = tables[0];
    var pager = document.querySelector('.pagination');
    if (!pager) return;
    document.body.classList.add('itsm-viewport-table');
    var scroll = table.closest('.table-card-scroll, .table-scroll, .table-wrap, .table-container, .table-shell');
    if (!scroll) {
      var parent = table.parentElement;
      if (parent && parent.tagName === 'DIV' && parent.children.length === 1) {
        scroll = parent;
        scroll.classList.add('table-card-scroll');
      } else {
        scroll = document.createElement('div');
        scroll.className = 'table-card-scroll';
        table.parentNode.insertBefore(scroll, table);
        scroll.appendChild(table);
      }
    } else {
      scroll.classList.remove('table-scroll');
      scroll.classList.add('table-card-scroll');
    }
    scroll.setAttribute('tabindex', '0');
    scroll.setAttribute('role', 'region');
    scroll.setAttribute('aria-label', '列表表格，可横向滚动');

    var host = scroll.parentElement;
    if (host && pager.parentElement !== host) host.appendChild(pager);
    if (host) {
      host.classList.add('itsm-list-surface');
      var toolbar = document.querySelector('.itsm-list-toolbar');
      if (toolbar && !host.contains(toolbar)) host.insertBefore(toolbar, scroll);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (document.body.classList.contains('itsm-crud-list')) {
      document.querySelectorAll('.filter-bar, .card-toolbar, .list-toolbar, .toolbar, .action-bar, .template-toolbar, .panel-toolbar, .tab-toolbar, .kb-toolbar, .table-card > .card-header').forEach(normalizeToolbar);
      document.querySelectorAll('.card > .card-header').forEach(function (header) {
        if (header.parentElement.querySelector(':scope > table.data-table')) normalizeToolbar(header);
      });
      var titleAdd = document.querySelector('.page-title-bar > .btn-primary');
      var firstToolbar = document.querySelector('.itsm-list-toolbar');
      if (titleAdd && firstToolbar) {
        firstToolbar.appendChild(titleAdd);
        titleAdd.classList.add('itsm-add-button', 'itsm-toolbar-button');
        Array.prototype.slice.call(titleAdd.childNodes).forEach(function (node) {
          if (node.nodeType === Node.TEXT_NODE || (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'SVG')) node.remove();
        });
        titleAdd.insertAdjacentText('beforeend', ' 添加');
        normalizeToolbar(firstToolbar);
      }
      var tables = document.querySelectorAll('table.data-table');
      if (tables.length === 1) document.body.classList.add('itsm-single-table');
      ensureSingleTableToolbar(tables);
      tables.forEach(function (table) {
        enhanceTable(table);
        removeRedundantDetailActions(table);
        ensureTableMoreAction(table);
        ensurePaginationForTable(table);
      });
      var visibleTables = Array.prototype.filter.call(tables, function (table) { return table.offsetParent !== null; });
      normalizeSingleTableViewport(visibleTables.length === 1 ? visibleTables : tables);
      document.querySelectorAll('.pagination').forEach(normalizePagination);
      document.querySelectorAll('a.btn-primary, button.btn-primary').forEach(normalizePrimaryAdd);
    }
    document.querySelectorAll('.form-bottom-bar, .detail-bottom-bar').forEach(normalizeBottomBar);
  });
})();
