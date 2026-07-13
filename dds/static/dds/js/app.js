const API_BASE = '/api';

const state = {
  currentPage: 'records',
  records: [],
  statuses: [],
  types: [],
  categories: [],
  subcategories: [],
  filters: {
    date_from: '',
    date_to: '',
    status: '',
    transaction_type: '',
    category: '',
    subcategory: '',
    search: ''
  },
  pagination: {
    count: 0,
    next: null,
    previous: null,
    page: 1
  },
  references: {
    activeTab: 'statuses',
    items: []
  },
  dashboard: {
    stats: null,
    loading: false
  }
};

async function apiGet(endpoint, params = {}) {
  const url = new URL(API_BASE + endpoint, window.location.origin);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== '' && v !== null && v !== undefined) url.searchParams.set(k, v);
  });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

async function apiPost(endpoint, data) {
  const res = await fetch(API_BASE + endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

async function apiPatch(endpoint, data) {
  const res = await fetch(API_BASE + endpoint, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

async function apiDelete(endpoint) {
  const res = await fetch(API_BASE + endpoint, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || `HTTP ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function openModal(title, bodyHTML, onConfirm = null, confirmText = 'Сохранить') {
  const overlay = document.getElementById('modalOverlay');
  const content = document.getElementById('modalContent');

  content.innerHTML = `
    <div class="modal-header">
      <span class="modal-title">${escapeHtml(title)}</span>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <div class="modal-body">${bodyHTML}</div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Отмена</button>
      ${onConfirm ? `<button class="btn btn-primary" id="modalConfirm">${confirmText}</button>` : ''}
    </div>
  `;

  overlay.classList.add('open');

  if (onConfirm) {
    document.getElementById('modalConfirm').addEventListener('click', async () => {
      try {
        await onConfirm();
        closeModal();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

function closeModalOnBackdrop(e) {
  if (e.target === document.getElementById('modalBackdrop')) closeModal();
}

document.getElementById('modalBackdrop').addEventListener('click', closeModalOnBackdrop);

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

function formatMoney(amount) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2
  }).format(amount);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function initNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const page = item.dataset.page;
      if (!page) return;

      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      state.currentPage = page;
      renderPage(page);
    });
  });
}

function renderPage(page) {
  const content = document.getElementById('content');
  content.innerHTML = '';

  switch (page) {
    case 'dashboard': renderDashboard(); break;
    case 'records': renderRecords(); break;
    case 'references': renderReferences(); break;
    default: renderRecords();
  }
}

async function renderDashboard() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-title">Дашборд</div>
        <div class="page-subtitle">Обзор движения денежных средств</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="openRecordModal()">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Новая запись
        </button>
      </div>
    </div>
    <div class="dashboard-content" id="dashboardContent">
      <div class="loading-overlay"><div class="spinner"></div></div>
    </div>
  `;

  try {
    const stats = await apiGet('/dashboard/stats/');
    state.dashboard.stats = stats;
    renderDashboardContent(stats);
  } catch (err) {
    showToast('Ошибка загрузки дашборда: ' + err.message, 'error');
  }
}

function renderDashboardContent(stats) {
  const container = document.getElementById('dashboardContent');
  const balanceColor = stats.balance >= 0 ? 'var(--success)' : 'var(--danger)';
  const balanceSign = stats.balance >= 0 ? '+' : '';

  container.innerHTML = `
    <div class="cards-grid fade-in">
      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-label">Баланс</span>
          <div class="stat-card-icon" style="background:rgba(99,102,241,0.12);color:var(--accent);">₽</div>
        </div>
        <div class="stat-card-value" style="color:${balanceColor}">${balanceSign}${formatMoney(stats.balance).replace('₽','').trim()}</div>
        <div class="stat-card-sub">Общий баланс</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-label">Поступления</span>
          <div class="stat-card-icon" style="background:var(--success-bg);color:var(--success);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 21 6 15"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
          </div>
        </div>
        <div class="stat-card-value" style="color:var(--success)">+${formatMoney(stats.income_total).replace('₽','').trim()}</div>
        <div class="stat-card-sub">Всего поступлений</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-label">Списания</span>
          <div class="stat-card-icon" style="background:var(--danger-bg);color:var(--danger);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 3 18 9"/><line x1="12" y1="21" x2="12" y2="3"/></svg>
          </div>
        </div>
        <div class="stat-card-value" style="color:var(--danger)">-${formatMoney(stats.expense_total).replace('₽','').trim()}</div>
        <div class="stat-card-sub">Всего списаний</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-label">Записей</span>
          <div class="stat-card-icon" style="background:rgba(255,255,255,0.05);color:var(--text-secondary);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
        </div>
        <div class="stat-card-value">${stats.total_records}</div>
        <div class="stat-card-sub">Всего операций</div>
      </div>
    </div>

    <div class="dashboard-section fade-in">
      <div class="dashboard-section-title">За текущий месяц</div>
      <div class="cards-grid" style="grid-template-columns: repeat(2, 1fr);">
        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-card-label">Поступления</span>
            <div class="stat-card-icon" style="background:var(--success-bg);color:var(--success);">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 21 6 15"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
            </div>
          </div>
          <div class="stat-card-value" style="color:var(--success)">+${formatMoney(stats.month_income).replace('₽','').trim()}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-card-label">Списания</span>
            <div class="stat-card-icon" style="background:var(--danger-bg);color:var(--danger);">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 3 18 9"/><line x1="12" y1="21" x2="12" y2="3"/></svg>
            </div>
          </div>
          <div class="stat-card-value" style="color:var(--danger)">-${formatMoney(stats.month_expense).replace('₽','').trim()}</div>
        </div>
      </div>
    </div>

    ${stats.status_stats && stats.status_stats.length ? `
    <div class="dashboard-section fade-in">
      <div class="dashboard-section-title">По статусам</div>
      <div class="status-stats-grid">
        ${stats.status_stats.map(s => `
          <div class="status-stat-item">
            <div class="status-stat-dot" style="background:${s.status__color || '#888'}"></div>
            <div class="status-stat-info">
              <div class="status-stat-name">${escapeHtml(s.status__name)}</div>
              <div class="status-stat-count">${s.count} операций</div>
            </div>
            <div class="status-stat-total">${formatMoney(s.total || 0).replace('₽','').trim()}</div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    ${stats.recent_records && stats.recent_records.length ? `
    <div class="dashboard-section fade-in">
      <div class="dashboard-section-title">Последние операции</div>
      <div class="recent-list">
        ${stats.recent_records.map(r => `
          <div class="recent-item" onclick="openRecordModal(${r.id})">
            <div class="recent-icon ${r.transaction_type_code}">
              ${r.transaction_type_code === 'income'
                ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 21 6 15"/><line x1="12" y1="3" x2="12" y2="21"/></svg>'
                : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 3 18 9"/><line x1="12" y1="21" x2="12" y2="3"/></svg>'}
            </div>
            <div class="recent-info">
              <div class="recent-title">${escapeHtml(r.category_name)}${r.subcategory_name ? ' → ' + escapeHtml(r.subcategory_name) : ''}</div>
              <div class="recent-meta">${formatDate(r.date)} · ${escapeHtml(r.status_name)}${r.comment ? ' · ' + escapeHtml(r.comment.substring(0, 40)) : ''}</div>
            </div>
            <div class="recent-amount ${r.transaction_type_code}">
              ${r.transaction_type_code === 'income' ? '+' : '-'}${formatMoney(r.amount).replace('₽','').trim()}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}
  `;
}

async function renderRecords() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-title">Записи ДДС</div>
        <div class="page-subtitle">Управление движением денежных средств</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="openRecordModal()">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Новая запись
        </button>
      </div>
    </div>

    <div class="filters-bar" id="filtersBar">
      <div class="filter-group">
        <span class="filter-label">С</span>
        <input type="date" class="filter-input" id="filterDateFrom" value="${state.filters.date_from}">
      </div>
      <div class="filter-group">
        <span class="filter-label">По</span>
        <input type="date" class="filter-input" id="filterDateTo" value="${state.filters.date_to}">
      </div>
      <div class="filter-group">
        <span class="filter-label">Статус</span>
        <select class="filter-select" id="filterStatus">
          <option value="">Все</option>
          ${state.statuses.map(s => `<option value="${s.id}" ${state.filters.status == s.id ? 'selected' : ''}>${escapeHtml(s.name)}</option>`).join('')}
        </select>
      </div>
      <div class="filter-group">
        <span class="filter-label">Тип</span>
        <select class="filter-select" id="filterType">
          <option value="">Все</option>
          ${state.types.map(t => `<option value="${t.id}" ${state.filters.transaction_type == t.id ? 'selected' : ''}>${escapeHtml(t.name)}</option>`).join('')}
        </select>
      </div>
      <div class="filter-group">
        <span class="filter-label">Категория</span>
        <select class="filter-select" id="filterCategory">
          <option value="">Все</option>
          ${state.categories.map(c => `<option value="${c.id}" ${state.filters.category == c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
        </select>
      </div>
      <div class="filter-group">
        <span class="filter-label">Подкат.</span>
        <select class="filter-select" id="filterSubcategory">
          <option value="">Все</option>
          ${state.subcategories.map(s => `<option value="${s.id}" ${state.filters.subcategory == s.id ? 'selected' : ''}>${escapeHtml(s.name)}</option>`).join('')}
        </select>
      </div>
      <div class="filter-group" style="margin-left:auto;">
        <button class="btn btn-secondary btn-sm" onclick="resetFilters()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          Сбросить
        </button>
      </div>
    </div>

    <div class="table-wrap" id="recordsTableWrap">
      <div class="loading-overlay"><div class="spinner"></div></div>
    </div>

    <div class="pagination" id="recordsPagination"></div>
  `;

  bindFilterEvents();
  await loadReferenceData();
  await loadRecords();
}

function bindFilterEvents() {
  const filters = ['filterDateFrom', 'filterDateTo', 'filterStatus', 'filterType', 'filterCategory', 'filterSubcategory'];
  filters.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', debounce(() => {
      state.filters.date_from = document.getElementById('filterDateFrom').value;
      state.filters.date_to = document.getElementById('filterDateTo').value;
      state.filters.status = document.getElementById('filterStatus').value;
      state.filters.transaction_type = document.getElementById('filterType').value;
      state.filters.category = document.getElementById('filterCategory').value;
      state.filters.subcategory = document.getElementById('filterSubcategory').value;
      state.pagination.page = 1;
      loadRecords();
    }, 300));
  });

  const typeSelect = document.getElementById('filterType');
  if (typeSelect) {
    typeSelect.addEventListener('change', () => {
      const typeId = typeSelect.value;
      const catSelect = document.getElementById('filterCategory');
      const subSelect = document.getElementById('filterSubcategory');

      if (!typeId) {
        catSelect.innerHTML = '<option value="">Все</option>' + state.categories.map(c =>
          `<option value="${c.id}">${escapeHtml(c.name)}</option>`
        ).join('');
      } else {
        const filtered = state.categories.filter(c => c.transaction_type == typeId);
        catSelect.innerHTML = '<option value="">Все</option>' + filtered.map(c =>
          `<option value="${c.id}">${escapeHtml(c.name)}</option>`
        ).join('');
      }
      subSelect.innerHTML = '<option value="">Все</option>';
      state.filters.category = '';
      state.filters.subcategory = '';
    });
  }

  const catSelect = document.getElementById('filterCategory');
  if (catSelect) {
    catSelect.addEventListener('change', () => {
      const catId = catSelect.value;
      const subSelect = document.getElementById('filterSubcategory');

      if (!catId) {
        subSelect.innerHTML = '<option value="">Все</option>' + state.subcategories.map(s =>
          `<option value="${s.id}">${escapeHtml(s.name)}</option>`
        ).join('');
      } else {
        const filtered = state.subcategories.filter(s => s.category == catId);
        subSelect.innerHTML = '<option value="">Все</option>' + filtered.map(s =>
          `<option value="${s.id}">${escapeHtml(s.name)}</option>`
        ).join('');
      }
      state.filters.subcategory = '';
    });
  }
}

function resetFilters() {
  state.filters = { date_from: '', date_to: '', status: '', transaction_type: '', category: '', subcategory: '', search: '' };
  state.pagination.page = 1;
  renderRecords();
}

async function loadReferenceData() {
  try {
    const [statuses, types, categories, subcategories] = await Promise.all([
      apiGet('/statuses/'),
      apiGet('/types/'),
      apiGet('/categories/'),
      apiGet('/subcategories/')
    ]);
    state.statuses = statuses;
    state.types = types;
    state.categories = categories;
    state.subcategories = subcategories;
  } catch (err) {
    console.error('Error loading references:', err);
  }
}

async function loadRecords() {
  const wrap = document.getElementById('recordsTableWrap');
  wrap.innerHTML = '<div class="loading-overlay"><div class="spinner"></div></div>';

  try {
    const params = {
      ...state.filters,
      page: state.pagination.page,
      ordering: '-date'
    };
    const data = await apiGet('/records/', params);

    state.records = data.results || data;
    state.pagination.count = data.count || data.length;
    state.pagination.next = data.next;
    state.pagination.previous = data.previous;

    renderRecordsTable();
    renderPagination();
  } catch (err) {
    wrap.innerHTML = `<div class="table-empty"><div class="table-empty-title">Ошибка загрузки</div><div class="table-empty-text">${escapeHtml(err.message)}</div></div>`;
  }
}

function renderRecordsTable() {
  const wrap = document.getElementById('recordsTableWrap');

  if (!state.records.length) {
    wrap.innerHTML = `
      <div class="table-empty">
        <div class="table-empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        </div>
        <div class="table-empty-title">Нет записей</div>
        <div class="table-empty-text">Создайте первую запись о движении денежных средств</div>
      </div>
    `;
    return;
  }

  wrap.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Дата</th>
          <th>Статус</th>
          <th>Тип</th>
          <th>Категория</th>
          <th>Подкатегория</th>
          <th style="text-align:right">Сумма</th>
          <th>Комментарий</th>
          <th style="text-align:right">Действия</th>
        </tr>
      </thead>
      <tbody>
        ${state.records.map(r => `
          <tr>
            <td class="col-date">${formatDate(r.date)}</td>
            <td>
              <span class="col-status">
                <span class="col-status-dot" style="background:${r.status_color || '#888'}"></span>
                ${escapeHtml(r.status_name)}
              </span>
            </td>
            <td>${escapeHtml(r.transaction_type_name)}</td>
            <td>${escapeHtml(r.category_name)}</td>
            <td>${escapeHtml(r.subcategory_name || '—')}</td>
            <td class="col-amount ${r.transaction_type_code}">
              ${r.transaction_type_code === 'income' ? '+' : '-'}${formatMoney(r.amount).replace('₽','').trim()}
            </td>
            <td class="col-comment" title="${escapeHtml(r.comment || '')}">${escapeHtml(r.comment || '—')}</td>
            <td class="col-actions">
              <button class="btn btn-ghost btn-sm" onclick="openRecordModal(${r.id})" title="Редактировать">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="btn btn-danger btn-sm" onclick="deleteRecord(${r.id})" title="Удалить">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderPagination() {
  const container = document.getElementById('recordsPagination');
  if (!container) return;

  const totalPages = Math.ceil(state.pagination.count / 50);
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let pages = [];
  const current = state.pagination.page;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= current - 1 && i <= current + 1)) {
      pages.push(i);
    } else if (i === current - 2 || i === current + 2) {
      pages.push('...');
    }
  }

  pages = pages.filter((p, i, arr) => p !== '...' || arr[i - 1] !== '...');

  container.innerHTML = `
    <button class="pagination-btn" ${current === 1 ? 'disabled' : ''} onclick="goToPage(${current - 1})">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
    </button>
    ${pages.map(p => {
      if (p === '...') return '<span class="pagination-btn" disabled>...</span>';
      return `<button class="pagination-btn ${p === current ? 'active' : ''}" onclick="goToPage(${p})">${p}</button>`;
    }).join('')}
    <button class="pagination-btn" ${current === totalPages ? 'disabled' : ''} onclick="goToPage(${current + 1})">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
    </button>
  `;
}

function goToPage(page) {
  state.pagination.page = page;
  loadRecords();
}

async function openRecordModal(recordId = null) {
  await loadReferenceData();

  let record = null;
  const isEdit = !!recordId;
  if (recordId) {
    try {
      record = await apiGet(`/records/${recordId}/`);
    } catch (_) {
      record = state.records.find(r => r.id === recordId) || null;
    }
  }

  const today = new Date().toISOString().split('T')[0];
  const date = record ? record.date : today;
  const statusId = record ? record.status : (state.statuses[0]?.id || '');
  const typeId = record ? record.transaction_type : (state.types[0]?.id || '');
  const categoryId = record ? record.category : '';
  const subcategoryId = record ? record.subcategory : '';
  const amount = record ? record.amount : '';
  const comment = record ? record.comment : '';

  const filteredCategories = typeId
    ? state.categories.filter(c => c.transaction_type == typeId)
    : state.categories;

  const filteredSubcategories = categoryId
    ? state.subcategories.filter(s => s.category == categoryId)
    : [];

  const bodyHTML = `
    <form id="recordForm" onsubmit="return false;">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label form-label-required">Дата</label>
          <input type="date" class="form-input" id="recDate" value="${date}" required>
        </div>
        <div class="form-group">
          <label class="form-label form-label-required">Сумма (₽)</label>
          <input type="number" class="form-input" id="recAmount" value="${amount}" step="0.01" min="0.01" placeholder="1000.00" required>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label form-label-required">Статус</label>
          <select class="form-select" id="recStatus" required>
            ${state.statuses.map(s => `<option value="${s.id}" ${s.id == statusId ? 'selected' : ''}>${escapeHtml(s.name)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label form-label-required">Тип</label>
          <select class="form-select" id="recType" required>
            <option value="">Выберите тип</option>
            ${state.types.map(t => `<option value="${t.id}" ${t.id == typeId ? 'selected' : ''}>${escapeHtml(t.name)}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label form-label-required">Категория</label>
          <select class="form-select" id="recCategory" required>
            <option value="">Сначала выберите тип</option>
            ${filteredCategories.map(c => `<option value="${c.id}" ${c.id == categoryId ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
          </select>
          <div class="form-error" id="catError" style="display:none"></div>
        </div>
        <div class="form-group">
          <label class="form-label">Подкатегория</label>
          <select class="form-select" id="recSubcategory">
            <option value="">${categoryId ? 'Выберите подкатегорию' : 'Сначала выберите категорию'}</option>
            ${filteredSubcategories.map(s => `<option value="${s.id}" ${s.id == subcategoryId ? 'selected' : ''}>${escapeHtml(s.name)}</option>`).join('')}
          </select>
          <div class="form-error" id="subError" style="display:none"></div>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Комментарий</label>
        <textarea class="form-textarea" id="recComment" rows="3" placeholder="Опциональный комментарий...">${escapeHtml(comment)}</textarea>
      </div>
    </form>
  `;

  openModal(
    isEdit ? 'Редактировать запись' : 'Новая запись ДДС',
    bodyHTML,
    async () => {
      const data = {
        date: document.getElementById('recDate').value,
        amount: parseFloat(document.getElementById('recAmount').value),
        status: parseInt(document.getElementById('recStatus').value),
        transaction_type: parseInt(document.getElementById('recType').value),
        category: parseInt(document.getElementById('recCategory').value) || null,
        subcategory: document.getElementById('recSubcategory').value ? parseInt(document.getElementById('recSubcategory').value) : null,
        comment: document.getElementById('recComment').value
      };

      const errors = [];
      if (!data.date) errors.push('Укажите дату');
      if (!data.amount || data.amount <= 0) errors.push('Сумма должна быть больше 0');
      if (!data.status) errors.push('Выберите статус');
      if (!data.transaction_type) errors.push('Выберите тип');
      if (!data.category) errors.push('Выберите категорию');

      if (errors.length) {
        throw new Error(errors.join('\n'));
      }

      if (isEdit) {
        await apiPatch(`/records/${recordId}/`, data);
        showToast('Запись обновлена');
      } else {
        await apiPost('/records/', data);
        showToast('Запись создана');
      }

      if (state.currentPage === 'records') {
        loadRecords();
      } else {
        renderDashboard();
      }
    },
    isEdit ? 'Сохранить' : 'Создать'
  );

  setupCascadeDropdowns();
}

function setupCascadeDropdowns() {
  const typeSelect = document.getElementById('recType');
  const catSelect = document.getElementById('recCategory');
  const subSelect = document.getElementById('recSubcategory');

  typeSelect.addEventListener('change', () => {
    const typeId = typeSelect.value;
    catSelect.innerHTML = '<option value="">Выберите категорию</option>';
    subSelect.innerHTML = '<option value="">Сначала выберите категорию</option>';

    if (typeId) {
      const filtered = state.categories.filter(c => c.transaction_type == typeId);
      catSelect.innerHTML += filtered.map(c =>
        `<option value="${c.id}">${escapeHtml(c.name)}</option>`
      ).join('');
    }
  });

  catSelect.addEventListener('change', () => {
    const catId = catSelect.value;
    subSelect.innerHTML = '<option value="">Выберите подкатегорию</option>';

    if (catId) {
      const filtered = state.subcategories.filter(s => s.category == catId);
      subSelect.innerHTML += filtered.map(s =>
        `<option value="${s.id}">${escapeHtml(s.name)}</option>`
      ).join('');
    }
  });
}

async function deleteRecord(id) {
  if (!confirm('Удалить эту запись?')) return;
  try {
    await apiDelete(`/records/${id}/`);
    showToast('Запись удалена');
    loadRecords();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function renderReferences() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-title">Справочники</div>
        <div class="page-subtitle">Управление статусами, типами, категориями и подкатегориями</div>
      </div>
    </div>

    <div class="ref-tabs">
      <button class="ref-tab ${state.references.activeTab === 'statuses' ? 'active' : ''}" onclick="switchRefTab('statuses')">Статусы</button>
      <button class="ref-tab ${state.references.activeTab === 'types' ? 'active' : ''}" onclick="switchRefTab('types')">Типы</button>
      <button class="ref-tab ${state.references.activeTab === 'categories' ? 'active' : ''}" onclick="switchRefTab('categories')">Категории</button>
      <button class="ref-tab ${state.references.activeTab === 'subcategories' ? 'active' : ''}" onclick="switchRefTab('subcategories')">Подкатегории</button>
    </div>

    <div class="ref-content" id="refContent">
      <div class="loading-overlay"><div class="spinner"></div></div>
    </div>
  `;

  await loadReferenceData();
  renderRefContent();
}

function switchRefTab(tab) {
  state.references.activeTab = tab;
  renderRefContent();
}

function renderRefContent() {
  const container = document.getElementById('refContent');
  const tab = state.references.activeTab;

  let items = [];
  let endpoint = '';
  let title = '';
  let fields = [];

  switch (tab) {
    case 'statuses':
      items = state.statuses;
      endpoint = '/statuses/';
      title = 'Статусы';
      fields = [
        { name: 'name', label: 'Название', type: 'text', required: true },
        { name: 'color', label: 'Цвет', type: 'color', required: false },
        { name: 'sort_order', label: 'Порядок', type: 'number', required: false }
      ];
      break;
    case 'types':
      items = state.types;
      endpoint = '/types/';
      title = 'Типы операций';
      fields = [
        { name: 'name', label: 'Название', type: 'text', required: true },
        { name: 'code', label: 'Код', type: 'text', required: true },
        { name: 'icon', label: 'Иконка', type: 'text', required: false },
        { name: 'sort_order', label: 'Порядок', type: 'number', required: false }
      ];
      break;
    case 'categories':
      items = state.categories;
      endpoint = '/categories/';
      title = 'Категории';
      fields = [
        { name: 'name', label: 'Название', type: 'text', required: true },
        { name: 'transaction_type', label: 'Тип операции', type: 'select', required: true, options: state.types.map(t => ({ value: t.id, label: t.name })) },
        { name: 'color', label: 'Цвет', type: 'color', required: false },
        { name: 'sort_order', label: 'Порядок', type: 'number', required: false }
      ];
      break;
    case 'subcategories':
      items = state.subcategories;
      endpoint = '/subcategories/';
      title = 'Подкатегории';
      fields = [
        { name: 'name', label: 'Название', type: 'text', required: true },
        { name: 'category', label: 'Категория', type: 'select', required: true, options: state.categories.map(c => ({ value: c.id, label: c.name })) },
        { name: 'color', label: 'Цвет', type: 'color', required: false },
        { name: 'sort_order', label: 'Порядок', type: 'number', required: false }
      ];
      break;
  }

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <div class="dashboard-section-title" style="margin:0">${title}</div>
      <button class="btn btn-primary btn-sm" onclick="openRefModal('${tab}', '${endpoint}')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Добавить
      </button>
    </div>
    <div class="ref-grid">
      ${items.length ? items.map(item => `
        <div class="ref-card">
          <div class="ref-card-color" style="background:${item.color || '#888'}"></div>
          <div class="ref-card-info">
            <div class="ref-card-name">${escapeHtml(item.name)}</div>
            <div class="ref-card-meta">
              ${tab === 'categories' ? 'Тип: ' + escapeHtml(state.types.find(t => t.id == item.transaction_type)?.name || '—') : ''}
              ${tab === 'subcategories' ? 'Категория: ' + escapeHtml(state.categories.find(c => c.id == item.category)?.name || '—') : ''}
              ${tab === 'types' ? 'Код: ' + escapeHtml(item.code) : ''}
            </div>
          </div>
          <div class="ref-card-actions">
            <button class="ref-card-btn" onclick="openRefModal('${tab}', '${endpoint}', ${item.id})" title="Редактировать">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="ref-card-btn delete" onclick="deleteRefItem('${endpoint}', ${item.id})" title="Удалить">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
      `).join('') : `
        <div class="table-empty" style="grid-column:1/-1;padding:40px 0;">
          <div class="table-empty-title">Нет элементов</div>
          <div class="table-empty-text">Добавьте первый элемент справочника</div>
        </div>
      `}
    </div>
  `;
}

function openRefModal(tab, endpoint, itemId = null) {
  const item = itemId ? state[tab].find(i => i.id === itemId) : null;
  const isEdit = !!item;

  let fields = [];
  switch (tab) {
    case 'statuses':
      fields = [
        { name: 'name', label: 'Название', type: 'text', value: item?.name || '' },
        { name: 'color', label: 'Цвет', type: 'color', value: item?.color || '#6366f1' },
        { name: 'sort_order', label: 'Порядок', type: 'number', value: item?.sort_order || 0 }
      ];
      break;
    case 'types':
      fields = [
        { name: 'name', label: 'Название', type: 'text', value: item?.name || '' },
        { name: 'code', label: 'Код', type: 'text', value: item?.code || '' },
        { name: 'icon', label: 'Иконка', type: 'text', value: item?.icon || '' },
        { name: 'sort_order', label: 'Порядок', type: 'number', value: item?.sort_order || 0 }
      ];
      break;
    case 'categories':
      fields = [
        { name: 'name', label: 'Название', type: 'text', value: item?.name || '' },
        { name: 'transaction_type', label: 'Тип операции', type: 'select', value: item?.transaction_type || '', options: state.types.map(t => ({ value: t.id, label: t.name })) },
        { name: 'color', label: 'Цвет', type: 'color', value: item?.color || '#888888' },
        { name: 'sort_order', label: 'Порядок', type: 'number', value: item?.sort_order || 0 }
      ];
      break;
    case 'subcategories':
      fields = [
        { name: 'name', label: 'Название', type: 'text', value: item?.name || '' },
        { name: 'category', label: 'Категория', type: 'select', value: item?.category || '', options: state.categories.map(c => ({ value: c.id, label: c.name })) },
        { name: 'color', label: 'Цвет', type: 'color', value: item?.color || '#aaaaaa' },
        { name: 'sort_order', label: 'Порядок', type: 'number', value: item?.sort_order || 0 }
      ];
      break;
  }

  const bodyHTML = `
    <form id="refForm" onsubmit="return false;">
      ${fields.map(f => `
        <div class="form-group">
          <label class="form-label ${f.required ? 'form-label-required' : ''}">${f.label}</label>
          ${f.type === 'select' ? `
            <select class="form-select" id="ref_${f.name}" ${f.required ? 'required' : ''}>
              <option value="">Выберите...</option>
              ${f.options.map(o => `<option value="${o.value}" ${o.value == f.value ? 'selected' : ''}>${escapeHtml(o.label)}</option>`).join('')}
            </select>
          ` : f.type === 'color' ? `
            <div style="display:flex;gap:8px;align-items:center;">
              <input type="color" class="form-input" id="ref_${f.name}" value="${f.value}" style="width:50px;height:40px;padding:4px;cursor:pointer;">
              <input type="text" class="form-input" id="ref_${f.name}_text" value="${f.value}" style="flex:1;" oninput="document.getElementById('ref_${f.name}').value=this.value">
            </div>
          ` : `
            <input type="${f.type}" class="form-input" id="ref_${f.name}" value="${f.value}" ${f.required ? 'required' : ''}>
          `}
        </div>
      `).join('')}
    </form>
  `;

  openModal(
    isEdit ? 'Редактировать' : 'Добавить',
    bodyHTML,
    async () => {
      const data = {};
      fields.forEach(f => {
        const el = document.getElementById(`ref_${f.name}`);
        if (f.type === 'number') {
          data[f.name] = el.value ? parseInt(el.value) : 0;
        } else if (f.type === 'select') {
          data[f.name] = el.value ? parseInt(el.value) : null;
        } else {
          data[f.name] = el.value;
        }
      });

      if (isEdit) {
        await apiPatch(`${endpoint}${itemId}/`, data);
        showToast('Обновлено');
      } else {
        await apiPost(endpoint, data);
        showToast('Создано');
      }

      await loadReferenceData();
      renderRefContent();
    },
    isEdit ? 'Сохранить' : 'Создать'
  );
}

async function deleteRefItem(endpoint, id) {
  if (!confirm('Удалить этот элемент? Связанные записи могут быть затронуты.')) return;
  try {
    await apiDelete(`${endpoint}${id}/`);
    showToast('Удалено');
    await loadReferenceData();
    renderRefContent();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  renderPage('records');
});
