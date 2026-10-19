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
    heads.forEach(function (head, index) {
      if (index === 0 || index === heads.length - 1 || head.querySelector('.fsm-head-tools, .th-tools, button')) return;
      head.classList.add('fsm-field-head');
      var tools = document.createElement('span');
      tools.className = 'fsm-head-tools';
      tools.innerHTML = '<button type="button" title="排序" aria-label="排序">&#8597;</button><button type="button" title="筛选" aria-label="筛选">&#9662;</button>';
      head.appendChild(tools);
    });

    var page = document.body.getAttribute('data-detail-page');
    if (!page) return;
    table.querySelectorAll('tbody tr').forEach(function (row) {
      var cells = Array.prototype.slice.call(row.children);
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
    if (document.body.hasAttribute('data-no-row-actions')) {
      var hasWorkflowAction = false;
      table.querySelectorAll('tbody tr').forEach(function (row) {
        var cell = row.lastElementChild;
        if (!cell) return;
        cell.querySelectorAll('a, button').forEach(function (action) {
          if (action.textContent.trim() === '详情') action.remove();
        });
        if (cell.querySelector('a, button')) {
          hasWorkflowAction = true;
          normalizeOperationCell(cell);
        }
      });
      table.classList.toggle('fsm-no-operation-column', !hasWorkflowAction);
      return;
    }
    if (table.hasAttribute('data-no-more-actions')) {
      table.querySelectorAll('.more-btn').forEach(function (button) { button.remove(); });
      table.querySelectorAll('tbody tr').forEach(function (row) {
        var cell = row.lastElementChild;
        if (cell && /操作/.test(table.querySelector('thead th:last-child')?.textContent || '')) {
          normalizeOperationCell(cell);
        }
      });
      return;
    }
    table.classList.remove('fsm-no-operation-column');
    table.querySelectorAll('tbody tr').forEach(function (row) {
      var cell = row.lastElementChild;
      if (!cell) return;
      var coreLink = row.querySelector('a.drill-link[href*="detail"], a.record-link[href], button.drill-link');
      if (!coreLink) return;
      cell.querySelectorAll('a, button').forEach(function (action) {
        if (action.textContent.trim() === '详情') action.remove();
      });
      if (!Array.prototype.some.call(cell.querySelectorAll('a, button'), function (action) { return action.textContent.trim() === '编辑'; })) {
        var edit = document.createElement('a');
        edit.className = 'lowcode-row-action';
        edit.textContent = '编辑';
        edit.href = coreLink.href ? coreLink.href.replace(/-detail\.html/, '-create.html') : '#';
        cell.appendChild(edit);
      }
      if (!Array.prototype.some.call(cell.querySelectorAll('a, button'), function (action) { return action.textContent.trim() === '删除'; })) {
        var remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'lowcode-row-action is-danger fsm-generic-delete';
        remove.textContent = '删除';
        cell.appendChild(remove);
      }
      /* “更多”只在页面声明存在真实低频操作时注入，不作为列表默认占位。 */
      if (table.hasAttribute('data-more-actions') && !cell.querySelector('.fsm-more')) {
        var more = document.createElement('span');
        more.className = 'fsm-more';
        more.innerHTML = '<button type="button" class="more-btn" title="更多" aria-label="更多" aria-expanded="false">⋮</button>' +
          '<span class="fsm-more-menu" role="menu"><button type="button" role="menuitem" data-more-action="permission">权限</button>' +
          '<button type="button" role="menuitem" data-more-action="copy">复制</button></span>';
        cell.appendChild(more);
      }
      normalizeOperationCell(cell);
    });
  }

  function normalizePagination(pagination) {
    var controls = pagination.querySelector('.pagination-btns, .pagination-controls, .pagination-right');
    if (!controls) return;
    controls.querySelectorAll('span, output, div').forEach(function (item) {
      if (/^第\s*\d+\s*\/\s*\d+\s*页$/.test(item.textContent.trim())) {
        item.hidden = true;
        item.setAttribute('aria-hidden', 'true');
      }
    });
    controls.querySelectorAll('button').forEach(function (button) {
      var label = button.textContent.trim();
      if (/上一页/.test(label)) {
        button.textContent = '‹';
        button.title = '上一页';
        button.setAttribute('aria-label', '上一页');
      } else if (/下一页/.test(label)) {
        button.textContent = '›';
        button.title = '下一页';
        button.setAttribute('aria-label', '下一页');
      }
      button.classList.add('page-btn');
      if (button.classList.contains('is-active')) button.classList.add('active');
    });
    if (pagination.querySelector('.fsm-page-size')) return;
    var size = document.createElement('span');
    size.className = 'fsm-page-size';
    size.textContent = '每页 20 条';
    controls.appendChild(size);
  }

  function ensurePaginationForTable(table) {
    var container = table.closest('.table-card, .tab-panel, .panel, .card') || table.parentElement;
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
    toolbar.classList.add('fsm-list-toolbar');
    var search = toolbar.querySelector('.search-wrap, input.search-input, input[type="search"], input[placeholder*="搜索"]');
    if (!search) {
      search = document.createElement('input');
      search.type = 'search';
      toolbar.appendChild(search);
    }
    if (search) {
      search.classList.add('fsm-keyword-search');
      var input = search.matches('input') ? search : search.querySelector('input');
      if (input) input.placeholder = '关键词搜索';
    }
    toolbar.querySelectorAll('a, button').forEach(function (button) {
      var label = button.textContent.trim();
      button.classList.add('fsm-toolbar-button');
      if (/新增|新建|创建|添加/.test(label)) button.classList.add('fsm-add-button');
      if (/导入/.test(label)) button.classList.add('fsm-import-button');
      if (/导出/.test(label)) button.classList.add('fsm-export-button');
    });
  }

  function ensureListToolbar() {
    var toolbar = document.querySelector('.fsm-list-toolbar');
    if (toolbar) return toolbar;
    var table = document.querySelector('table.data-table');
    if (!table) return null;

    toolbar = document.createElement('div');
    toolbar.className = 'fsm-list-toolbar';
    var tableContainer = table.closest('.table-card, .table-container, .card, .panel') || table;
    tableContainer.parentElement.insertBefore(toolbar, tableContainer);

    document.querySelectorAll('.page-title-bar a, .page-title-bar button, .page-header a, .page-header button').forEach(function (button) {
      if (/新增|新建|创建|添加|导入|导出/.test(button.textContent.trim())) toolbar.appendChild(button);
    });
    normalizeToolbar(toolbar);
    return toolbar;
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

  function removeRedundantDetailActions(table) {
    var operationHead = Array.prototype.find.call(table.querySelectorAll('thead th'), function (head) {
      return head.textContent.trim() === '操作';
    });
    if (!operationHead) return;
    var operationIndex = Array.prototype.indexOf.call(operationHead.parentElement.children, operationHead);
    var rows = Array.prototype.slice.call(table.querySelectorAll('tbody tr'));
    var hasRealAction = false;
    rows.forEach(function (row) {
      var coreDetail = row.querySelector('a.drill-link[href*="detail"], a[href*="detail"].drill-link');
      var cell = row.children[operationIndex];
      if (!coreDetail || !cell) {
        if (cell && cell.querySelector('a, button')) hasRealAction = true;
        return;
      }
      cell.querySelectorAll('a, button').forEach(function (action) {
        if (action.textContent.trim() === '详情') action.remove();
      });
      if (cell.querySelector('a, button')) hasRealAction = true;
    });
    table.classList.toggle('fsm-no-operation-column', rows.length > 0 && !hasRealAction);
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

  function hideTopBackActions() {
    if (!document.body.matches('.fsm-crud-form, .fsm-crud-detail')) return;
    document.querySelectorAll('a, button').forEach(function (action) {
      if (action.closest('.form-bottom-bar, .detail-bottom-bar')) return;
      if (/返回|后退/.test(action.textContent.trim())) action.classList.add('fsm-top-back-action');
    });
  }

  function normalizeSingleTableViewport(tables) {
    if (tables.length !== 1 || !document.querySelector('.pagination')) return;
    document.body.classList.add('fsm-viewport-table');
    var table = tables[0];
    var scroll = table.closest('.table-card-scroll, .table-scroll, .table-wrap, .table-container');
    if (scroll) {
      scroll.classList.remove('table-scroll');
      scroll.classList.add('table-card-scroll');
      if (!scroll.hasAttribute('tabindex')) scroll.setAttribute('tabindex', '0');
      if (!scroll.hasAttribute('role')) scroll.setAttribute('role', 'region');
      if (!scroll.hasAttribute('aria-label')) scroll.setAttribute('aria-label', '列表表格，可横向滚动');
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (document.body.classList.contains('fsm-crud-list')) {
      document.querySelectorAll('.filter-bar, .card-toolbar, .list-toolbar, .toolbar, .fsm-toolbar, .wo-toolbar, .action-bar, .panel-toolbar, .tab-toolbar, .kb-toolbar, .table-card > .card-header').forEach(normalizeToolbar);
      document.querySelectorAll('.card > .card-header').forEach(function (header) {
        if (header.parentElement.querySelector(':scope > table.data-table')) normalizeToolbar(header);
      });
      ensureListToolbar();
      var titleAdd = document.querySelector('.page-title-bar > .btn-primary');
      var firstToolbar = document.querySelector('.fsm-list-toolbar');
      if (titleAdd && firstToolbar) {
        firstToolbar.appendChild(titleAdd);
        titleAdd.classList.add('fsm-add-button', 'fsm-toolbar-button');
        Array.prototype.slice.call(titleAdd.childNodes).forEach(function (node) {
          if (node.nodeType === Node.TEXT_NODE || (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'SVG')) node.remove();
        });
        titleAdd.insertAdjacentText('beforeend', ' 添加');
        normalizeToolbar(firstToolbar);
      }
      var tables = document.querySelectorAll('table.data-table');
      if (tables.length === 1) document.body.classList.add('fsm-single-table');
      normalizeSingleTableViewport(tables);
      tables.forEach(function (table) {
        enhanceTable(table);
        removeRedundantDetailActions(table);
        ensureTableMoreAction(table);
        ensurePaginationForTable(table);
      });
      document.querySelectorAll('.pagination').forEach(normalizePagination);
      document.querySelectorAll('a.btn-primary, button.btn-primary').forEach(normalizePrimaryAdd);

      var pending = 0;
      new MutationObserver(function () {
        window.clearTimeout(pending);
        pending = window.setTimeout(function () {
          document.querySelectorAll('table.data-table').forEach(function (table) {
            enhanceTable(table);
            removeRedundantDetailActions(table);
            ensureTableMoreAction(table);
            ensurePaginationForTable(table);
          });
          document.querySelectorAll('.pagination').forEach(normalizePagination);
        }, 0);
      }).observe(document.body, { childList: true, subtree: true });
    }
    document.querySelectorAll('.form-bottom-bar, .detail-bottom-bar').forEach(normalizeBottomBar);
    hideTopBackActions();
  });

  document.addEventListener('click', function (event) {
    var moreButton = event.target.closest('.more-btn');
    document.querySelectorAll('.fsm-more.is-open').forEach(function (more) {
      if (!moreButton || more !== moreButton.closest('.fsm-more')) {
        more.classList.remove('is-open');
        var button = more.querySelector('.more-btn');
        if (button) button.setAttribute('aria-expanded', 'false');
      }
    });
    if (moreButton) {
      var wrapper = moreButton.closest('.fsm-more');
      var open = !wrapper.classList.contains('is-open');
      wrapper.classList.toggle('is-open', open);
      moreButton.setAttribute('aria-expanded', String(open));
      return;
    }
    var menuAction = event.target.closest('[data-more-action]');
    if (menuAction) {
      var label = menuAction.textContent.trim();
      if (window.showToast) window.showToast(label + '操作已选择');
      menuAction.closest('.fsm-more').classList.remove('is-open');
    }
  });
})();
