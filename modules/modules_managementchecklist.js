/* ═══════════════════════════════════════════════════════════════
   GNSI WORKLIST MODULE — Kanban Task Board with Supabase Sync
   File: modules/worklist.js
   ═══════════════════════════════════════════════════════════════ */

(function () {

  /* ── Supabase table name ── */
  var TABLE = 'gnsi_worklist';
  var COMMENTS_TABLE = 'gnsi_worklist_comments';

  /* ── Priority config ── */
  var PRIORITIES = {
    high:   { label: 'High',   color: '#dc2626', bg: '#fef2f2' },
    medium: { label: 'Medium', color: '#d97706', bg: '#fffbeb' },
    low:    { label: 'Low',    color: '#16a34a', bg: '#f0fdf4' }
  };

  /* ── Column config ── */
  var COLUMNS = [
    { id: 'todo',        label: '📋 To Do',      color: '#6366f1' },
    { id: 'inprogress',  label: '⚙️ In Progress', color: '#f59e0b' },
    { id: 'done',        label: '✅ Done',         color: '#10b981' }
  ];

  /* ── State ── */
  var _tasks    = [];
  var _comments = {};
  var _staffList = [];
  var _editingId = null;
  var _viewingId = null;

  /* ════════════════════════════════════════════════════════════
     MAIN RENDER
  ════════════════════════════════════════════════════════════ */
  window.gnsiWorklistRender = function () {
    var el = document.getElementById('worklist-root');
    if (!el) return;
    _loadStaff();
    _loadTasks().then(function () { _renderBoard(); });
  };

  /* ════════════════════════════════════════════════════════════
     LOAD DATA
  ════════════════════════════════════════════════════════════ */
  function _loadTasks() {
    var sb = _getSb();
    if (!sb) {
      _tasks = JSON.parse(localStorage.getItem('gnsi_worklist_tasks') || '[]');
      return Promise.resolve();
    }
    return sb.from(TABLE).select('*').order('created_at', { ascending: false })
      .then(function (r) {
        if (r.data) _tasks = r.data;
        else _tasks = JSON.parse(localStorage.getItem('gnsi_worklist_tasks') || '[]');
      }).catch(function () {
        _tasks = JSON.parse(localStorage.getItem('gnsi_worklist_tasks') || '[]');
      });
  }

  function _loadComments(taskId) {
    var sb = _getSb();
    if (!sb) return Promise.resolve([]);
    return sb.from(COMMENTS_TABLE).select('*')
      .eq('task_id', taskId).order('created_at', { ascending: true })
      .then(function (r) { return r.data || []; })
      .catch(function () { return []; });
  }

  function _loadStaff() {
    var sb = _getSb();
    if (!sb) return;
    sb.from('staff').select('id, name').then(function (r) {
      if (r.data) _staffList = r.data;
    }).catch(function () {});
  }

  /* ════════════════════════════════════════════════════════════
     SAVE / UPDATE
  ════════════════════════════════════════════════════════════ */
  function _saveTask(task) {
    /* local fallback */
    var local = JSON.parse(localStorage.getItem('gnsi_worklist_tasks') || '[]');
    var idx = local.findIndex(function (t) { return t.id === task.id; });
    if (idx >= 0) local[idx] = task; else local.unshift(task);
    localStorage.setItem('gnsi_worklist_tasks', JSON.stringify(local));

    var sb = _getSb();
    if (!sb) return Promise.resolve();
    return sb.from(TABLE).upsert(task).then(function () {}).catch(function () {});
  }

  function _deleteTask(id) {
    _tasks = _tasks.filter(function (t) { return t.id !== id; });
    var local = JSON.parse(localStorage.getItem('gnsi_worklist_tasks') || '[]');
    localStorage.setItem('gnsi_worklist_tasks', JSON.stringify(
      local.filter(function (t) { return t.id !== id; })
    ));
    var sb = _getSb();
    if (sb) sb.from(TABLE).delete().eq('id', id).catch(function () {});
  }

  function _saveComment(taskId, text) {
    var user = (typeof currentUser !== 'undefined' && currentUser) ? currentUser : {};
    var comment = {
      id: 'cmt_' + Date.now(),
      task_id: taskId,
      text: text,
      author: user.name || user.email || 'Staff',
      created_at: new Date().toISOString()
    };
    var sb = _getSb();
    if (sb) sb.from(COMMENTS_TABLE).insert(comment).catch(function () {});
    if (!_comments[taskId]) _comments[taskId] = [];
    _comments[taskId].push(comment);
    return comment;
  }

  /* ════════════════════════════════════════════════════════════
     BOARD RENDER
  ════════════════════════════════════════════════════════════ */
  function _renderBoard() {
    var el = document.getElementById('worklist-root');
    if (!el) return;

    var user = (typeof currentUser !== 'undefined' && currentUser) ? currentUser : {};
    var canManage = ['admin','manager','principal'].includes(user.role);

    var totalTasks = _tasks.length;
    var doneTasks  = _tasks.filter(function(t){ return t.status==='done'; }).length;
    var highPri    = _tasks.filter(function(t){ return t.priority==='high' && t.status!=='done'; }).length;

    el.innerHTML =
      '<div style="padding:20px;max-width:1400px;margin:0 auto;font-family:\'DM Sans\',sans-serif">' +

      /* ── Header ── */
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px">' +
        '<div>' +
          '<h2 style="margin:0;font-family:\'Playfair Display\',serif;font-size:22px;color:#1433a8">📋 Team Worklist</h2>' +
          '<p style="margin:4px 0 0;font-size:13px;color:#666">Track tasks, problems & progress across your team</p>' +
        '</div>' +
        '<button onclick="gnsiWorklistOpenAdd()" style="background:#1433a8;color:#fff;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px">＋ Add Task</button>' +
      '</div>' +

      /* ── Stats ── */
      '<div style="display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap">' +
        _statCard('Total Tasks', totalTasks, '#6366f1') +
        _statCard('Completed', doneTasks, '#10b981') +
        _statCard('High Priority', highPri, '#dc2626') +
        _statCard('In Progress', _tasks.filter(function(t){return t.status==='inprogress';}).length, '#f59e0b') +
      '</div>' +

      /* ── Kanban Board ── */
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;align-items:start">' +
        COLUMNS.map(function (col) {
          var colTasks = _tasks.filter(function (t) { return t.status === col.id; });
          return (
            '<div style="background:#f8faff;border-radius:14px;padding:16px;min-height:200px;border-top:4px solid ' + col.color + '">' +
              '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">' +
                '<span style="font-weight:700;font-size:14px;color:#222">' + col.label + '</span>' +
                '<span style="background:' + col.color + ';color:#fff;border-radius:20px;padding:2px 10px;font-size:12px;font-weight:700">' + colTasks.length + '</span>' +
              '</div>' +
              colTasks.map(function (t) { return _taskCard(t); }).join('') +
            '</div>'
          );
        }).join('') +
      '</div>' +

      '</div>' +

      /* ── Modals ── */
      '<div id="wl-modal-overlay" onclick="gnsiWorklistCloseModal()" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9100"></div>' +
      '<div id="wl-modal" style="display:none;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border-radius:18px;padding:28px;width:90%;max-width:520px;z-index:9101;box-shadow:0 20px 60px rgba(0,0,0,.2);max-height:90vh;overflow-y:auto"></div>';
  }

  function _statCard(label, value, color) {
    return '<div style="background:#fff;border-radius:12px;padding:14px 18px;flex:1;min-width:100px;box-shadow:0 2px 8px rgba(0,0,0,.06);border-left:4px solid ' + color + '">' +
      '<div style="font-size:22px;font-weight:800;color:' + color + '">' + value + '</div>' +
      '<div style="font-size:12px;color:#666;margin-top:2px">' + label + '</div>' +
    '</div>';
  }

  function _taskCard(task) {
    var pri = PRIORITIES[task.priority] || PRIORITIES.medium;
    var assignee = task.assigned_to_name || task.assigned_to || '';
    var date = task.due_date ? '<span style="font-size:11px;color:#888">📅 ' + task.due_date + '</span>' : '';
    return (
      '<div style="background:#fff;border-radius:12px;padding:14px;margin-bottom:10px;box-shadow:0 2px 8px rgba(0,0,0,.07);cursor:pointer;transition:box-shadow .2s" ' +
        'onmouseover="this.style.boxShadow=\'0 4px 16px rgba(0,0,0,.13)\'" ' +
        'onmouseout="this.style.boxShadow=\'0 2px 8px rgba(0,0,0,.07)\'" ' +
        'onclick="gnsiWorklistViewTask(\'' + task.id + '\')">' +

        /* Priority badge + title */
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px">' +
          '<div style="font-size:14px;font-weight:600;color:#1a1a2e;line-height:1.4;flex:1">' + esc(task.title) + '</div>' +
          '<span style="background:' + pri.bg + ';color:' + pri.color + ';border-radius:6px;padding:2px 8px;font-size:11px;font-weight:700;white-space:nowrap">' + pri.label + '</span>' +
        '</div>' +

        /* Description preview */
        (task.description ? '<div style="font-size:12px;color:#666;margin-bottom:8px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">' + esc(task.description) + '</div>' : '') +

        /* Footer */
        '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:4px">' +
          (assignee ? '<span style="font-size:11px;background:#ede9fe;color:#6d28d9;border-radius:6px;padding:2px 8px">👤 ' + esc(assignee) + '</span>' : '<span></span>') +
          date +
        '</div>' +

        /* Move buttons */
        '<div style="display:flex;gap:6px;margin-top:10px" onclick="event.stopPropagation()">' +
          (task.status !== 'todo'       ? '<button onclick="gnsiWorklistMove(\'' + task.id + '\',\'' + _prevStatus(task.status) + '\')" style="flex:1;background:#f3f4f6;border:none;border-radius:7px;padding:5px;font-size:11px;cursor:pointer;color:#555">◀ Back</button>' : '') +
          (task.status !== 'done'       ? '<button onclick="gnsiWorklistMove(\'' + task.id + '\',\'' + _nextStatus(task.status) + '\')" style="flex:1;background:#1433a8;color:#fff;border:none;border-radius:7px;padding:5px;font-size:11px;cursor:pointer">Forward ▶</button>' : '') +
          '<button onclick="gnsiWorklistDelete(\'' + task.id + '\')" style="background:#fee2e2;border:none;border-radius:7px;padding:5px 8px;font-size:11px;cursor:pointer;color:#dc2626">🗑</button>' +
        '</div>' +

      '</div>'
    );
  }

  function _prevStatus(s) { return s === 'done' ? 'inprogress' : 'todo'; }
  function _nextStatus(s) { return s === 'todo' ? 'inprogress' : 'done'; }

  /* ════════════════════════════════════════════════════════════
     ADD TASK MODAL
  ════════════════════════════════════════════════════════════ */
  window.gnsiWorklistOpenAdd = function () {
    _editingId = null;
    var staffOptions = _staffList.map(function (s) {
      return '<option value="' + esc(s.name) + '">' + esc(s.name) + '</option>';
    }).join('');

    _showModal(
      '<h3 style="margin:0 0 20px;font-family:\'Playfair Display\',serif;color:#1433a8">＋ New Task</h3>' +

      '<label style="' + _lbl() + '">Task Title *</label>' +
      '<input id="wl-title" placeholder="e.g. Fix fee collection issue" style="' + _inp() + '">' +

      '<label style="' + _lbl() + '">Description</label>' +
      '<textarea id="wl-desc" rows="3" placeholder="Describe the task or problem..." style="' + _inp() + 'resize:vertical"></textarea>' +

      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
        '<div>' +
          '<label style="' + _lbl() + '">Priority</label>' +
          '<select id="wl-priority" style="' + _inp() + '">' +
            '<option value="high">🔴 High</option>' +
            '<option value="medium" selected>🟡 Medium</option>' +
            '<option value="low">🟢 Low</option>' +
          '</select>' +
        '</div>' +
        '<div>' +
          '<label style="' + _lbl() + '">Due Date</label>' +
          '<input id="wl-due" type="date" style="' + _inp() + '">' +
        '</div>' +
      '</div>' +

      '<label style="' + _lbl() + '">Assign To</label>' +
      '<input id="wl-assign" list="wl-staff-list" placeholder="Search staff name..." style="' + _inp() + '">' +
      '<datalist id="wl-staff-list">' + staffOptions + '</datalist>' +

      '<div style="display:flex;gap:10px;margin-top:20px">' +
        '<button onclick="gnsiWorklistCloseModal()" style="flex:1;background:#f3f4f6;border:none;border-radius:10px;padding:12px;font-size:14px;cursor:pointer;color:#555">Cancel</button>' +
        '<button onclick="gnsiWorklistSaveNew()" style="flex:2;background:#1433a8;color:#fff;border:none;border-radius:10px;padding:12px;font-size:14px;font-weight:700;cursor:pointer">Save Task</button>' +
      '</div>'
    );
  };

  window.gnsiWorklistSaveNew = function () {
    var title = document.getElementById('wl-title').value.trim();
    if (!title) { if (typeof showToast === 'function') showToast('Task title is required', '#dc2626'); return; }

    var user = (typeof currentUser !== 'undefined' && currentUser) ? currentUser : {};
    var task = {
      id:               'wlt_' + Date.now(),
      title:            title,
      description:      document.getElementById('wl-desc').value.trim(),
      priority:         document.getElementById('wl-priority').value,
      due_date:         document.getElementById('wl-due').value || null,
      assigned_to_name: document.getElementById('wl-assign').value.trim() || null,
      status:           'todo',
      created_by:       user.name || user.email || 'Staff',
      created_at:       new Date().toISOString()
    };

    _tasks.unshift(task);
    _saveTask(task).then(function () {
      gnsiWorklistCloseModal();
      _renderBoard();
      if (typeof showToast === 'function') showToast('Task added ✅', '#16a34a');
    });
  };

  /* ════════════════════════════════════════════════════════════
     VIEW TASK + COMMENTS
  ════════════════════════════════════════════════════════════ */
  window.gnsiWorklistViewTask = function (id) {
    var task = _tasks.find(function (t) { return t.id === id; });
    if (!task) return;
    _viewingId = id;
    var pri = PRIORITIES[task.priority] || PRIORITIES.medium;

    _loadComments(id).then(function (comments) {
      _comments[id] = comments;
      var commentHTML = comments.map(function (c) {
        return '<div style="background:#f8faff;border-radius:8px;padding:10px 12px;margin-bottom:8px">' +
          '<div style="font-size:12px;font-weight:700;color:#1433a8">' + esc(c.author) + ' <span style="color:#999;font-weight:400">' + _fmtTime(c.created_at) + '</span></div>' +
          '<div style="font-size:13px;color:#333;margin-top:4px">' + esc(c.text) + '</div>' +
        '</div>';
      }).join('') || '<p style="color:#aaa;font-size:13px;text-align:center">No comments yet</p>';

      var colLabel = COLUMNS.find(function(c){return c.id===task.status;});

      _showModal(
        '<h3 style="margin:0 0 4px;font-family:\'Playfair Display\',serif;color:#1433a8;font-size:18px">' + esc(task.title) + '</h3>' +
        '<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">' +
          '<span style="background:' + pri.bg + ';color:' + pri.color + ';border-radius:6px;padding:2px 10px;font-size:12px;font-weight:700">' + pri.label + ' Priority</span>' +
          '<span style="background:#ede9fe;color:#6d28d9;border-radius:6px;padding:2px 10px;font-size:12px;font-weight:700">' + (colLabel ? colLabel.label : task.status) + '</span>' +
        '</div>' +

        (task.description ? '<p style="font-size:14px;color:#444;line-height:1.6;margin:0 0 16px;background:#f8faff;border-radius:10px;padding:12px">' + esc(task.description) + '</p>' : '') +

        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;font-size:13px">' +
          _infoRow('👤 Assigned to', task.assigned_to_name || '—') +
          _infoRow('📅 Due date', task.due_date || '—') +
          _infoRow('🖊 Created by', task.created_by || '—') +
          _infoRow('🕐 Created', _fmtTime(task.created_at)) +
        '</div>' +

        '<div style="border-top:1px solid #eee;padding-top:16px;margin-bottom:12px">' +
          '<div style="font-weight:700;font-size:14px;color:#333;margin-bottom:10px">💬 Comments</div>' +
          '<div id="wl-comments-list">' + commentHTML + '</div>' +
          '<div style="display:flex;gap:8px;margin-top:10px">' +
            '<input id="wl-comment-input" placeholder="Add a comment..." style="' + _inp() + 'margin:0;flex:1">' +
            '<button onclick="gnsiWorklistAddComment()" style="background:#1433a8;color:#fff;border:none;border-radius:10px;padding:10px 16px;font-size:13px;cursor:pointer;white-space:nowrap">Post</button>' +
          '</div>' +
        '</div>' +

        '<div style="display:flex;gap:8px;margin-top:8px">' +
          (task.status !== 'todo'  ? '<button onclick="gnsiWorklistMove(\'' + task.id + '\',\'' + _prevStatus(task.status) + '\');gnsiWorklistCloseModal()" style="flex:1;background:#f3f4f6;border:none;border-radius:10px;padding:10px;font-size:13px;cursor:pointer">◀ Back</button>' : '') +
          (task.status !== 'done'  ? '<button onclick="gnsiWorklistMove(\'' + task.id + '\',\'' + _nextStatus(task.status) + '\');gnsiWorklistCloseModal()" style="flex:2;background:#1433a8;color:#fff;border:none;border-radius:10px;padding:10px;font-size:13px;font-weight:700;cursor:pointer">Move Forward ▶</button>' : '') +
          '<button onclick="gnsiWorklistCloseModal()" style="flex:1;background:#f3f4f6;border:none;border-radius:10px;padding:10px;font-size:13px;cursor:pointer">Close</button>' +
        '</div>'
      );
    });
  };

  window.gnsiWorklistAddComment = function () {
    var input = document.getElementById('wl-comment-input');
    if (!input || !input.value.trim()) return;
    var comment = _saveComment(_viewingId, input.value.trim());
    input.value = '';
    var list = document.getElementById('wl-comments-list');
    if (list) {
      var div = document.createElement('div');
      div.style.cssText = 'background:#f8faff;border-radius:8px;padding:10px 12px;margin-bottom:8px';
      div.innerHTML = '<div style="font-size:12px;font-weight:700;color:#1433a8">' + esc(comment.author) + ' <span style="color:#999;font-weight:400">just now</span></div>' +
        '<div style="font-size:13px;color:#333;margin-top:4px">' + esc(comment.text) + '</div>';
      list.appendChild(div);
      list.scrollTop = list.scrollHeight;
    }
  };

  /* ════════════════════════════════════════════════════════════
     MOVE / DELETE
  ════════════════════════════════════════════════════════════ */
  window.gnsiWorklistMove = function (id, newStatus) {
    var task = _tasks.find(function (t) { return t.id === id; });
    if (!task) return;
    task.status = newStatus;
    _saveTask(task).then(function () { _renderBoard(); });
    if (typeof showToast === 'function') showToast('Task moved ✅', '#1433a8');
  };

  window.gnsiWorklistDelete = function (id) {
    if (!confirm('Delete this task?')) return;
    _deleteTask(id);
    _renderBoard();
    if (typeof showToast === 'function') showToast('Task deleted', '#dc2626');
  };

  /* ════════════════════════════════════════════════════════════
     MODAL HELPERS
  ════════════════════════════════════════════════════════════ */
  function _showModal(html) {
    var overlay = document.getElementById('wl-modal-overlay');
    var modal   = document.getElementById('wl-modal');
    if (!overlay || !modal) return;
    modal.innerHTML = html;
    overlay.style.display = 'block';
    modal.style.display   = 'block';
  }

  window.gnsiWorklistCloseModal = function () {
    var overlay = document.getElementById('wl-modal-overlay');
    var modal   = document.getElementById('wl-modal');
    if (overlay) overlay.style.display = 'none';
    if (modal)   modal.style.display   = 'none';
  };

  /* ════════════════════════════════════════════════════════════
     STYLE HELPERS
  ════════════════════════════════════════════════════════════ */
  function _lbl() { return 'display:block;font-size:12px;font-weight:600;color:#555;margin-bottom:4px;margin-top:12px'; }
  function _inp() { return 'width:100%;box-sizing:border-box;border:1.5px solid #e5e7eb;border-radius:10px;padding:10px 12px;font-size:14px;font-family:\'DM Sans\',sans-serif;outline:none;transition:border .2s'; }
  function _infoRow(label, value) {
    return '<div style="background:#f8faff;border-radius:8px;padding:8px 12px"><div style="font-size:11px;color:#888">' + label + '</div><div style="font-size:13px;font-weight:600;color:#333">' + esc(String(value)) + '</div></div>';
  }
  function _fmtTime(iso) {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }); }
    catch(e) { return iso; }
  }

})();
