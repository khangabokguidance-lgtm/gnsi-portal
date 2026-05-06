/* ══════════════════════════════════════════════════════════════════════════
   GNSI — modules/accounts.js
   Accounts & Finance Ledger Module
   Version : 1.1.0  |  2026-05-06
   Provides: loadIncomeLedger, loadExpenseLedger, loadAccountsDashboard,
             gnsiAccountsRender, addIncomeEntry, addExpenseEntry,
             deleteAccountEntry, exportLedgerCSV

   Changelog v1.1.0:
     FIX 1 — Month end-date now computed correctly (no more hard-coded '-31')
     FIX 2 — Split cache timestamps: _cache.incTs / _cache.expTs per ledger
     FIX 3 — loadAccountsDashboard catch now toasts offline warning
     FIX 4 — deleteAccountEntry uses custom modal instead of confirm()
     FIX 5 — _setContent extended with 'section-body' / 'content-area' IDs
     FIX 6 — Dashboard income table shows row count note when capped at 30
   ══════════════════════════════════════════════════════════════════════════ */

(function (w) {
  'use strict';

  /* ── helpers ─────────────────────────────────────────────────────────── */
  var _sb    = function () { return (typeof _getSb === 'function' ? _getSb() : null) || window._supa || null; };
  var _esc   = function (s) { return typeof esc === 'function' ? esc(s) : String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };
  var _toast = function (msg, color) { if (typeof showToast === 'function') showToast(msg, color || '#1433a8'); };
  var _fmt   = function (d) { if (!d) return '—'; var dt = new Date(d); return isNaN(dt) ? d : dt.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}); };
  var _cur   = function (n) { return '₹ ' + (parseFloat(n) || 0).toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2}); };
  var _month = function (d) { if (!d) return ''; var dt = new Date(d); return isNaN(dt) ? '' : dt.toISOString().slice(0,7); };

  /* FIX 1 — correct last-day-of-month calculation (handles Feb, 30-day months) */
  var _monthEnd = function (yyyymm) {
    var parts = yyyymm.split('-');
    var last  = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10), 0); // day 0 = last day of prev month
    return last.toISOString().slice(0, 10);
  };

  /* ── in-memory cache ─────────────────────────────────────────────────── */
  /* FIX 2 — separate timestamps per ledger so a fresh income fetch doesn't
              immediately expire a stale expense cache and vice-versa        */
  var _cache = { income: null, expense: null, incTs: 0, expTs: 0 };
  var CACHE_TTL = 60000; // 1 min

  /* ══════════════════════════════════════════════════════════════════════
     INCOME LEDGER
  ══════════════════════════════════════════════════════════════════════ */

  /**
   * loadIncomeLedger()
   * Fetches income records from Supabase table `accounts_income`
   * Falls back to localStorage cache if offline.
   * Called by the router when the Accounts → Income tab is active.
   */
  w.loadIncomeLedger = async function (opts) {
    opts = opts || {};
    var sb  = _sb();
    var now = Date.now();

    /* serve cache if fresh */
    if (!opts.force && _cache.income && (now - _cache.incTs) < CACHE_TTL) {
      _renderIncomeLedger(_cache.income, opts.filter);
      return;
    }

    /* show skeleton */
    _setContent('<div class="gnsi-loader">Loading income ledger…</div>');

    try {
      var rows = [];

      if (sb) {
        var query = sb.from('accounts_income')
          .select('*')
          .order('date', { ascending: false });

        /* FIX 1 — use computed month-end instead of hard-coded '-31' */
        if (opts.month) {
          query = query.gte('date', opts.month + '-01').lte('date', _monthEnd(opts.month));
        }

        var { data, error } = await query.limit(500);
        if (error) throw error;
        rows = data || [];
      } else {
        /* offline fallback */
        rows = _localGet('gnsi_accounts_income') || [];
        if (opts.month) {
          rows = rows.filter(function (r) { return _month(r.date) === opts.month; });
        }
      }

      /* cache — FIX 2: update incTs only */
      _cache.income = rows;
      _cache.incTs  = now;
      _localSet('gnsi_accounts_income', rows);

      _renderIncomeLedger(rows, opts.filter);
    } catch (e) {
      console.error('[GNSI Accounts] loadIncomeLedger error:', e);
      var cached = _localGet('gnsi_accounts_income') || [];
      if (cached.length) {
        _toast('Offline — showing cached income data', '#f59e0b');
        _renderIncomeLedger(cached, opts.filter);
      } else {
        _setContent(_emptyState('income', e.message || 'Could not load income ledger.'));
      }
    }
  };

  /* ══════════════════════════════════════════════════════════════════════
     EXPENSE LEDGER
  ══════════════════════════════════════════════════════════════════════ */

  w.loadExpenseLedger = async function (opts) {
    opts = opts || {};
    var sb  = _sb();
    var now = Date.now();

    /* FIX 2 — use expTs for expense cache check */
    if (!opts.force && _cache.expense && (now - _cache.expTs) < CACHE_TTL) {
      _renderExpenseLedger(_cache.expense, opts.filter);
      return;
    }

    _setContent('<div class="gnsi-loader">Loading expense ledger…</div>');

    try {
      var rows = [];

      if (sb) {
        var query = sb.from('accounts_expense')
          .select('*')
          .order('date', { ascending: false });

        /* FIX 1 — use computed month-end */
        if (opts.month) {
          query = query.gte('date', opts.month + '-01').lte('date', _monthEnd(opts.month));
        }

        var { data, error } = await query.limit(500);
        if (error) throw error;
        rows = data || [];
      } else {
        rows = _localGet('gnsi_accounts_expense') || [];
        if (opts.month) {
          rows = rows.filter(function (r) { return _month(r.date) === opts.month; });
        }
      }

      /* FIX 2 — update expTs only */
      _cache.expense = rows;
      _cache.expTs   = now;
      _localSet('gnsi_accounts_expense', rows);

      _renderExpenseLedger(rows, opts.filter);
    } catch (e) {
      console.error('[GNSI Accounts] loadExpenseLedger error:', e);
      var cached = _localGet('gnsi_accounts_expense') || [];
      if (cached.length) {
        _toast('Offline — showing cached expense data', '#f59e0b');
        _renderExpenseLedger(cached, opts.filter);
      } else {
        _setContent(_emptyState('expense', e.message || 'Could not load expense ledger.'));
      }
    }
  };

  /* ══════════════════════════════════════════════════════════════════════
     ACCOUNTS DASHBOARD (main render entry-point called by router)
  ══════════════════════════════════════════════════════════════════════ */

  w.gnsiAccountsRender = async function () {
    _setContent(_dashboardShell());
    await loadAccountsDashboard();
  };

  w.loadAccountsDashboard = async function () {
    var sb      = _sb();
    var income  = [];
    var expense = [];
    var isOffline = false;

    try {
      if (sb) {
        var [incRes, expRes] = await Promise.all([
          sb.from('accounts_income').select('amount,date,category').order('date',{ascending:false}).limit(500),
          sb.from('accounts_expense').select('amount,date,category').order('date',{ascending:false}).limit(500)
        ]);
        /* surface Supabase-level errors */
        if (incRes.error) throw incRes.error;
        if (expRes.error) throw expRes.error;
        income  = incRes.data  || [];
        expense = expRes.data  || [];
      } else {
        isOffline = true;
        income  = _localGet('gnsi_accounts_income')  || [];
        expense = _localGet('gnsi_accounts_expense') || [];
      }
    } catch (e) {
      /* FIX 3 — warn user instead of silently showing stale data */
      console.warn('[GNSI Accounts] loadAccountsDashboard error, using cache:', e);
      isOffline = true;
      income  = _localGet('gnsi_accounts_income')  || [];
      expense = _localGet('gnsi_accounts_expense') || [];
    }

    /* FIX 3 — show offline banner if we fell back to cache */
    if (isOffline) {
      _toast('⚠️ Offline — dashboard shows cached data', '#f59e0b');
    }

    /* FIX 2 — update both timestamps together on dashboard load */
    var now = Date.now();
    _cache.income  = income;
    _cache.expense = expense;
    _cache.incTs   = now;
    _cache.expTs   = now;

    var totalIncome  = income.reduce(function(s,r){ return s + (parseFloat(r.amount)||0); }, 0);
    var totalExpense = expense.reduce(function(s,r){ return s + (parseFloat(r.amount)||0); }, 0);
    var balance      = totalIncome - totalExpense;

    /* current month */
    var thisMonth = new Date().toISOString().slice(0,7);
    var mIncome  = income.filter(function(r){ return _month(r.date)===thisMonth; })
                         .reduce(function(s,r){ return s+(parseFloat(r.amount)||0); },0);
    var mExpense = expense.filter(function(r){ return _month(r.date)===thisMonth; })
                          .reduce(function(s,r){ return s+(parseFloat(r.amount)||0); },0);

    var el = document.getElementById('gnsi-accounts-dash');
    if (!el) return;

    /* FIX 6 — pass total count so table can show "showing 30 of N" note */
    el.innerHTML = _summaryCards(totalIncome, totalExpense, balance, mIncome, mExpense)
      + _tabBar()
      + '<div id="gnsi-ledger-body">' + _incomeTable(income.slice(0,30), income.length) + '</div>';

    /* activate first tab */
    _activateTab('income');
  };

  /* ══════════════════════════════════════════════════════════════════════
     ADD INCOME
  ══════════════════════════════════════════════════════════════════════ */

  w.addIncomeEntry = async function () {
    var date     = _val('acc-inc-date');
    var category = _val('acc-inc-category');
    var amount   = parseFloat(_val('acc-inc-amount'));
    var desc     = _val('acc-inc-desc');
    var paidBy   = _val('acc-inc-paidby');

    if (!date || !category || !amount || isNaN(amount)) {
      _toast('Please fill Date, Category and Amount.', '#dc2626'); return;
    }

    var entry = {
      date      : date,
      category  : category,
      amount    : amount,
      description: desc,
      paid_by   : paidBy,
      created_at: new Date().toISOString(),
      created_by: (typeof currentUser !== 'undefined' && currentUser ? currentUser.name : 'staff')
    };

    var sb = _sb();
    try {
      if (sb) {
        var { error } = await sb.from('accounts_income').insert([entry]);
        if (error) throw error;
      } else {
        var local = _localGet('gnsi_accounts_income') || [];
        entry.id = 'local_' + Date.now();
        local.unshift(entry);
        _localSet('gnsi_accounts_income', local);
      }

      _toast('Income entry added ✅', '#16a34a');
      _cache.income = null; /* bust cache */
      _cache.incTs  = 0;
      _closeModal('acc-income-modal');
      await loadAccountsDashboard();
    } catch(e) {
      console.error('[GNSI Accounts] addIncomeEntry error:', e);
      _toast('Error: ' + (e.message || 'Could not save entry.'), '#dc2626');
    }
  };

  /* ══════════════════════════════════════════════════════════════════════
     ADD EXPENSE
  ══════════════════════════════════════════════════════════════════════ */

  w.addExpenseEntry = async function () {
    var date     = _val('acc-exp-date');
    var category = _val('acc-exp-category');
    var amount   = parseFloat(_val('acc-exp-amount'));
    var desc     = _val('acc-exp-desc');
    var paidTo   = _val('acc-exp-paidto');

    if (!date || !category || !amount || isNaN(amount)) {
      _toast('Please fill Date, Category and Amount.', '#dc2626'); return;
    }

    var entry = {
      date      : date,
      category  : category,
      amount    : amount,
      description: desc,
      paid_to   : paidTo,
      created_at: new Date().toISOString(),
      created_by: (typeof currentUser !== 'undefined' && currentUser ? currentUser.name : 'staff')
    };

    var sb = _sb();
    try {
      if (sb) {
        var { error } = await sb.from('accounts_expense').insert([entry]);
        if (error) throw error;
      } else {
        var local = _localGet('gnsi_accounts_expense') || [];
        entry.id = 'local_' + Date.now();
        local.unshift(entry);
        _localSet('gnsi_accounts_expense', local);
      }

      _toast('Expense entry added ✅', '#16a34a');
      _cache.expense = null;
      _cache.expTs   = 0;
      _closeModal('acc-expense-modal');
      await loadAccountsDashboard();
    } catch(e) {
      console.error('[GNSI Accounts] addExpenseEntry error:', e);
      _toast('Error: ' + (e.message || 'Could not save entry.'), '#dc2626');
    }
  };

  /* ══════════════════════════════════════════════════════════════════════
     DELETE ENTRY
  ══════════════════════════════════════════════════════════════════════ */

  /* FIX 4 — replaced confirm() with a custom modal (confirm() is blocked
              in cross-origin iframes and some Android WebViews)             */
  w.deleteAccountEntry = function (table, id) {
    _showModal('acc-delete-confirm', `
      <div class="gnsi-modal-header" style="background:#fff1f1;">
        <h3 style="color:#dc2626;">🗑 Delete Entry</h3>
        <button class="gnsi-modal-close" onclick="closeModal('acc-delete-confirm')">✕</button>
      </div>
      <div class="gnsi-modal-body" style="padding:24px 20px;">
        <p style="margin:0 0 20px;font-size:15px;color:#333;">
          Are you sure you want to delete this entry?<br>
          <strong style="color:#dc2626;">This cannot be undone.</strong>
        </p>
        <div class="form-actions" style="display:flex;gap:10px;">
          <button class="btn btn-danger"
            onclick="_gnsiConfirmDelete('${_esc(table)}','${_esc(id)}')">Yes, Delete</button>
          <button class="btn btn-ghost"
            onclick="closeModal('acc-delete-confirm')">Cancel</button>
        </div>
      </div>
    `);
  };

  /* internal — called only from the confirm modal above */
  w._gnsiConfirmDelete = async function (table, id) {
    _closeModal('acc-delete-confirm');
    var sb = _sb();
    try {
      if (sb && !String(id).startsWith('local_')) {
        var { error } = await sb.from(table).delete().eq('id', id);
        if (error) throw error;
      } else {
        var key  = table === 'accounts_income' ? 'gnsi_accounts_income' : 'gnsi_accounts_expense';
        var rows = (_localGet(key) || []).filter(function(r){ return String(r.id) !== String(id); });
        _localSet(key, rows);
      }
      _toast('Entry deleted.', '#f59e0b');
      _cache.income  = null;
      _cache.expense = null;
      _cache.incTs   = 0;
      _cache.expTs   = 0;
      await loadAccountsDashboard();
    } catch(e) {
      _toast('Error deleting: ' + (e.message || ''), '#dc2626');
    }
  };

  /* ══════════════════════════════════════════════════════════════════════
     EXPORT CSV
  ══════════════════════════════════════════════════════════════════════ */

  w.exportLedgerCSV = function (type) {
    var rows  = type === 'expense' ? (_cache.expense || []) : (_cache.income || []);
    var heads = type === 'expense'
      ? ['Date','Category','Amount','Description','Paid To','Created By']
      : ['Date','Category','Amount','Description','Paid By','Created By'];
    var lines = [heads.join(',')];
    rows.forEach(function(r){
      var cols = type === 'expense'
        ? [r.date, r.category, r.amount, r.description, r.paid_to,  r.created_by]
        : [r.date, r.category, r.amount, r.description, r.paid_by,  r.created_by];
      lines.push(cols.map(function(c){ return '"' + String(c||'').replace(/"/g,'""') + '"'; }).join(','));
    });
    var blob = new Blob([lines.join('\n')], {type:'text/csv'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'gnsi_' + type + '_ledger_' + new Date().toISOString().slice(0,10) + '.csv';
    a.click();
    _toast('CSV exported ✅', '#16a34a');
  };

  /* ══════════════════════════════════════════════════════════════════════
     TAB SWITCHING
  ══════════════════════════════════════════════════════════════════════ */

  w.gnsiAccountsTab = function (tab) {
    _activateTab(tab);
    var body = document.getElementById('gnsi-ledger-body');
    if (!body) return;
    var inc = _cache.income  || [];
    var exp = _cache.expense || [];
    if (tab === 'income') {
      /* FIX 6 — pass total for row-count note */
      body.innerHTML = _incomeTable(inc, inc.length);
    } else if (tab === 'expense') {
      body.innerHTML = _expenseTable(exp, exp.length);
    } else if (tab === 'summary') {
      body.innerHTML = _summaryReport(inc, exp);
    }
  };

  /* ══════════════════════════════════════════════════════════════════════
     MODALS
  ══════════════════════════════════════════════════════════════════════ */

  w.openIncomeModal = function () {
    var today = new Date().toISOString().slice(0,10);
    _showModal('acc-income-modal', `
      <div class="gnsi-modal-header">
        <h3>➕ Add Income Entry</h3>
        <button class="gnsi-modal-close" onclick="closeModal('acc-income-modal')">✕</button>
      </div>
      <div class="gnsi-modal-body">
        <div class="form-row">
          <label>Date *</label>
          <input type="date" id="acc-inc-date" value="${today}" class="form-input">
        </div>
        <div class="form-row">
          <label>Category *</label>
          <select id="acc-inc-category" class="form-input">
            <option value="">— Select —</option>
            <option>Fee Collection</option>
            <option>Hostel Fees</option>
            <option>Exam Fees</option>
            <option>Transport Fees</option>
            <option>Donation</option>
            <option>Government Grant</option>
            <option>Miscellaneous</option>
          </select>
        </div>
        <div class="form-row">
          <label>Amount (₹) *</label>
          <input type="number" id="acc-inc-amount" placeholder="0.00" min="0" step="0.01" class="form-input">
        </div>
        <div class="form-row">
          <label>Paid By</label>
          <input type="text" id="acc-inc-paidby" placeholder="Student name / source" class="form-input">
        </div>
        <div class="form-row">
          <label>Description</label>
          <textarea id="acc-inc-desc" placeholder="Optional notes…" class="form-input" rows="2"></textarea>
        </div>
        <div class="form-actions">
          <button class="btn btn-primary" onclick="addIncomeEntry()">Save Entry</button>
          <button class="btn btn-ghost"   onclick="closeModal('acc-income-modal')">Cancel</button>
        </div>
      </div>
    `);
  };

  w.openExpenseModal = function () {
    var today = new Date().toISOString().slice(0,10);
    _showModal('acc-expense-modal', `
      <div class="gnsi-modal-header">
        <h3>➖ Add Expense Entry</h3>
        <button class="gnsi-modal-close" onclick="closeModal('acc-expense-modal')">✕</button>
      </div>
      <div class="gnsi-modal-body">
        <div class="form-row">
          <label>Date *</label>
          <input type="date" id="acc-exp-date" value="${today}" class="form-input">
        </div>
        <div class="form-row">
          <label>Category *</label>
          <select id="acc-exp-category" class="form-input">
            <option value="">— Select —</option>
            <option>Salary</option>
            <option>Utilities</option>
            <option>Maintenance</option>
            <option>Stationery</option>
            <option>Food & Hostel</option>
            <option>Transport</option>
            <option>Equipment</option>
            <option>Miscellaneous</option>
          </select>
        </div>
        <div class="form-row">
          <label>Amount (₹) *</label>
          <input type="number" id="acc-exp-amount" placeholder="0.00" min="0" step="0.01" class="form-input">
        </div>
        <div class="form-row">
          <label>Paid To</label>
          <input type="text" id="acc-exp-paidto" placeholder="Vendor / staff name" class="form-input">
        </div>
        <div class="form-row">
          <label>Description</label>
          <textarea id="acc-exp-desc" placeholder="Optional notes…" class="form-input" rows="2"></textarea>
        </div>
        <div class="form-actions">
          <button class="btn btn-danger" onclick="addExpenseEntry()">Save Expense</button>
          <button class="btn btn-ghost"  onclick="closeModal('acc-expense-modal')">Cancel</button>
        </div>
      </div>
    `);
  };

  w.closeModal = function (id) { _closeModal(id); };

  /* ══════════════════════════════════════════════════════════════════════
     PRIVATE — RENDER HELPERS
  ══════════════════════════════════════════════════════════════════════ */

  function _renderIncomeLedger(rows, filter) {
    var html = `
      <div class="section-header">
        <h2 class="section-title">Income Ledger</h2>
        <button class="btn btn-primary" onclick="openIncomeModal()">+ Add Income</button>
      </div>
      <div class="toolbar" style="margin-bottom:12px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
        <input type="month" id="acc-filter-month" onchange="loadIncomeLedger({month:this.value,force:true})"
               style="padding:6px 10px;border:1px solid #ddd;border-radius:8px;">
        <button class="btn btn-ghost btn-sm" onclick="exportLedgerCSV('income')">⬇ Export CSV</button>
      </div>
      ${_incomeTable(rows, rows.length)}
    `;
    _setContent(html);
  }

  function _renderExpenseLedger(rows, filter) {
    var html = `
      <div class="section-header">
        <h2 class="section-title">Expense Ledger</h2>
        <button class="btn btn-danger" onclick="openExpenseModal()">+ Add Expense</button>
      </div>
      <div class="toolbar" style="margin-bottom:12px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
        <input type="month" id="acc-filter-month" onchange="loadExpenseLedger({month:this.value,force:true})"
               style="padding:6px 10px;border:1px solid #ddd;border-radius:8px;">
        <button class="btn btn-ghost btn-sm" onclick="exportLedgerCSV('expense')">⬇ Export CSV</button>
      </div>
      ${_expenseTable(rows, rows.length)}
    `;
    _setContent(html);
  }

  function _dashboardShell() {
    return `
      <div class="section-header">
        <h2 class="section-title">Accounts</h2>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-primary" onclick="openIncomeModal()">+ Income</button>
          <button class="btn btn-danger"  onclick="openExpenseModal()">− Expense</button>
        </div>
      </div>
      <div id="gnsi-accounts-dash"><div class="gnsi-loader">Loading…</div></div>
    `;
  }

  function _summaryCards(totInc, totExp, bal, mInc, mExp) {
    var balColor = bal >= 0 ? '#16a34a' : '#dc2626';
    return `
      <div class="kpi-row" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:20px;">
        ${_kpi('Total Income',        _cur(totInc), '#16a34a', '💰')}
        ${_kpi('Total Expense',       _cur(totExp), '#dc2626', '💸')}
        ${_kpi('Net Balance',         _cur(bal),    balColor,  '⚖️')}
        ${_kpi('This Month Income',   _cur(mInc),   '#1433a8', '📅')}
        ${_kpi('This Month Expense',  _cur(mExp),   '#f59e0b', '📅')}
      </div>
    `;
  }

  function _kpi(label, value, color, icon) {
    return `
      <div class="kpi-card" style="background:#fff;border-radius:14px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,.07);border-left:4px solid ${color}">
        <div style="font-size:22px;margin-bottom:4px;">${icon}</div>
        <div style="font-size:18px;font-weight:700;color:${color}">${_esc(value)}</div>
        <div style="font-size:11px;color:#888;margin-top:2px;">${_esc(label)}</div>
      </div>
    `;
  }

  function _tabBar() {
    return `
      <div class="tab-bar" style="display:flex;gap:4px;margin-bottom:16px;border-bottom:2px solid #eee;padding-bottom:0;">
        <button id="tab-income"  class="tab-btn tab-active" onclick="gnsiAccountsTab('income')">💰 Income</button>
        <button id="tab-expense" class="tab-btn"            onclick="gnsiAccountsTab('expense')">💸 Expense</button>
        <button id="tab-summary" class="tab-btn"            onclick="gnsiAccountsTab('summary')">📊 Summary</button>
        <div style="margin-left:auto;display:flex;gap:6px;align-items:center;">
          <button class="btn btn-ghost btn-sm" onclick="exportLedgerCSV('income')">⬇ Income CSV</button>
          <button class="btn btn-ghost btn-sm" onclick="exportLedgerCSV('expense')">⬇ Expense CSV</button>
        </div>
      </div>
    `;
  }

  function _activateTab(tab) {
    ['income','expense','summary'].forEach(function(t){
      var el = document.getElementById('tab-' + t);
      if (el) el.className = 'tab-btn' + (t === tab ? ' tab-active' : '');
    });
  }

  /* FIX 6 — accepts totalCount so dashboard can display a "showing N of M" note */
  function _incomeTable(rows, totalCount) {
    if (!rows || !rows.length) return _emptyState('income', 'No income entries yet. Click "+ Income" to add one.');
    var cap   = 30;
    var shown = rows.slice(0, cap);
    var note  = (totalCount > cap)
      ? `<p style="text-align:center;font-size:12px;color:#888;margin:8px 0 0;">
           Showing ${cap} of ${totalCount} entries — use the Income tab or export CSV to see all.
         </p>`
      : '';
    var tbody = shown.map(function(r){
      return `
        <tr>
          <td data-label="Date">${_esc(_fmt(r.date))}</td>
          <td data-label="Category"><span class="badge badge-success">${_esc(r.category||'—')}</span></td>
          <td data-label="Amount" style="font-weight:700;color:#16a34a">${_esc(_cur(r.amount))}</td>
          <td data-label="Paid By">${_esc(r.paid_by||'—')}</td>
          <td data-label="Description">${_esc(r.description||'—')}</td>
          <td data-label="By">${_esc(r.created_by||'—')}</td>
          <td data-label="Action">
            <button class="del-btn" onclick="deleteAccountEntry('accounts_income','${_esc(r.id)}')">🗑</button>
          </td>
        </tr>
      `;
    }).join('');
    return `
      <div class="table-wrap responsive-table">
        <table class="data-table">
          <thead><tr>
            <th>Date</th><th>Category</th><th>Amount</th>
            <th>Paid By</th><th>Description</th><th>By</th><th></th>
          </tr></thead>
          <tbody>${tbody}</tbody>
        </table>
      </div>
      ${note}
    `;
  }

  /* FIX 6 — same for expense table */
  function _expenseTable(rows, totalCount) {
    if (!rows || !rows.length) return _emptyState('expense', 'No expense entries yet. Click "− Expense" to add one.');
    var cap   = 30;
    var shown = rows.slice(0, cap);
    var note  = (totalCount > cap)
      ? `<p style="text-align:center;font-size:12px;color:#888;margin:8px 0 0;">
           Showing ${cap} of ${totalCount} entries — use the Expense tab or export CSV to see all.
         </p>`
      : '';
    var tbody = shown.map(function(r){
      return `
        <tr>
          <td data-label="Date">${_esc(_fmt(r.date))}</td>
          <td data-label="Category"><span class="badge badge-danger">${_esc(r.category||'—')}</span></td>
          <td data-label="Amount" style="font-weight:700;color:#dc2626">${_esc(_cur(r.amount))}</td>
          <td data-label="Paid To">${_esc(r.paid_to||'—')}</td>
          <td data-label="Description">${_esc(r.description||'—')}</td>
          <td data-label="By">${_esc(r.created_by||'—')}</td>
          <td data-label="Action">
            <button class="del-btn" onclick="deleteAccountEntry('accounts_expense','${_esc(r.id)}')">🗑</button>
          </td>
        </tr>
      `;
    }).join('');
    return `
      <div class="table-wrap responsive-table">
        <table class="data-table">
          <thead><tr>
            <th>Date</th><th>Category</th><th>Amount</th>
            <th>Paid To</th><th>Description</th><th>By</th><th></th>
          </tr></thead>
          <tbody>${tbody}</tbody>
        </table>
      </div>
      ${note}
    `;
  }

  function _summaryReport(income, expense) {
    /* group by category */
    var incCat = {}, expCat = {};
    income.forEach(function(r){
      incCat[r.category] = (incCat[r.category]||0) + (parseFloat(r.amount)||0);
    });
    expense.forEach(function(r){
      expCat[r.category] = (expCat[r.category]||0) + (parseFloat(r.amount)||0);
    });

    var incRows = Object.keys(incCat).map(function(k){
      return `<tr><td>${_esc(k)}</td><td style="color:#16a34a;font-weight:600">${_esc(_cur(incCat[k]))}</td></tr>`;
    }).join('');
    var expRows = Object.keys(expCat).map(function(k){
      return `<tr><td>${_esc(k)}</td><td style="color:#dc2626;font-weight:600">${_esc(_cur(expCat[k]))}</td></tr>`;
    }).join('');

    var totInc = income.reduce(function(s,r){ return s+(parseFloat(r.amount)||0); },0);
    var totExp = expense.reduce(function(s,r){ return s+(parseFloat(r.amount)||0); },0);
    var bal    = totInc - totExp;

    return `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:8px;">
        <div>
          <h4 style="color:#16a34a;margin-bottom:8px;">💰 Income by Category</h4>
          <table class="data-table">
            <thead><tr><th>Category</th><th>Total</th></tr></thead>
            <tbody>${incRows || '<tr><td colspan="2">No data</td></tr>'}</tbody>
            <tfoot><tr><td><b>Total</b></td><td><b>${_esc(_cur(totInc))}</b></td></tr></tfoot>
          </table>
        </div>
        <div>
          <h4 style="color:#dc2626;margin-bottom:8px;">💸 Expense by Category</h4>
          <table class="data-table">
            <thead><tr><th>Category</th><th>Total</th></tr></thead>
            <tbody>${expRows || '<tr><td colspan="2">No data</td></tr>'}</tbody>
            <tfoot><tr><td><b>Total</b></td><td><b>${_esc(_cur(totExp))}</b></td></tr></tfoot>
          </table>
        </div>
      </div>
      <div style="margin-top:16px;padding:14px 20px;border-radius:12px;background:${bal>=0?'#f0fdf4':'#fff1f1'};border:1.5px solid ${bal>=0?'#16a34a':'#dc2626'};">
        <span style="font-size:16px;font-weight:700;color:${bal>=0?'#16a34a':'#dc2626'}">
          Net Balance: ${_esc(_cur(bal))}
        </span>
        <span style="font-size:13px;color:#888;margin-left:10px;">(Income − Expense)</span>
      </div>
    `;
  }

  function _emptyState(type, msg) {
    return `
      <div style="text-align:center;padding:60px 20px;color:#aaa;">
        <div style="font-size:48px;margin-bottom:12px;">${type==='income'?'💰':'💸'}</div>
        <p style="font-size:15px;">${_esc(msg)}</p>
      </div>
    `;
  }

  /* ── DOM utilities ───────────────────────────────────────────────────── */

  /* FIX 5 — extended ID list to cover common GNSI portal container names */
  function _setContent(html) {
    var el = document.getElementById('page-content')
          || document.getElementById('main-content')
          || document.getElementById('app-content')
          || document.getElementById('section-body')
          || document.getElementById('content-area')
          || document.getElementById('content-panel')
          || document.querySelector('.page-content')
          || document.querySelector('.content-area')
          || document.querySelector('main');
    if (el) el.innerHTML = html;
    else console.warn('[GNSI Accounts] _setContent: no container element found');
  }

  function _val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function _showModal(id, html) {
    var existing = document.getElementById(id);
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = id;
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:16px;';
    overlay.innerHTML = `<div class="gnsi-modal" style="background:#fff;border-radius:16px;width:100%;max-width:480px;box-shadow:0 8px 40px rgba(0,0,0,.22);overflow:hidden;">${html}</div>`;
    overlay.addEventListener('click', function(e){ if(e.target===overlay) _closeModal(id); });
    document.body.appendChild(overlay);
  }

  function _closeModal(id) {
    var el = document.getElementById(id);
    if (el) el.remove();
  }

  /* ── localStorage helpers ────────────────────────────────────────────── */
  function _localGet(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch(e){ return null; }
  }
  function _localSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch(e){}
  }

  /* ══════════════════════════════════════════════════════════════════════
     ROUTER HOOK — registers 'accounts' page with GNSI router
  ══════════════════════════════════════════════════════════════════════ */
  if (typeof window._gnsiPages === 'undefined') window._gnsiPages = {};
  window._gnsiPages['accounts'] = {
    title  : 'Accounts',
    icon   : '🏦',
    render : function () { return w.gnsiAccountsRender(); }
  };

  /* ── also expose as gnsiFinanceInit alias used by some routers ───────── */
  if (typeof w.gnsiFinanceInit === 'undefined' || w.gnsiFinanceInit === (function(){})) {
    w.gnsiFinanceInit = w.gnsiAccountsRender;
  }

  console.log('[GNSI] accounts.js v1.1.0 loaded ✅');

}(window));
