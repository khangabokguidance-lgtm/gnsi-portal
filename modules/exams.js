/* GNSI PORTAL — modules/exams.js
   Pages: exam (ExamHub), examresultshub, exammanager
   DEPENDS ON: core/utils.js, core/state.js */

function renderExamHub() {
  // -- RBAC --
  examComputePermissions();
  var canEdit    = _examCanEdit;
  var canManage  = _examCanManage;
  var canExport  = _examCanExport;
  var canPrint   = _examCanPrint;
  var isAdmin    = _examUserRole === 'admin';
  var isAdminMgr = _examUserRole === 'admin' || _examUserRole === 'manager';
  // -- Unified tab definitions --
  var tabGroups = [
    { groupLabel: 'Entry', color: '#1433a8', tabs: [
      { id: 'entry',      icon: '✏️',  label: 'Mark Entry',   tip: 'Enter & save marks (main roster)',    show: canEdit },
      { id: 'erentry',    icon: '📝',  label: 'ER Mark Entry',tip: 'Enter marks in Results module',       show: canEdit }
    ]},
    { groupLabel: 'Results', color: '#0891b2', tabs: [
      { id: 'marks',      icon: '📊',  label: 'Marks Grid',   tip: 'View all entered marks',              show: true },
      { id: 'erresults',  icon: '📈',  label: 'ER Results',   tip: 'Ranked results & grades (ER module)', show: true },
      { id: 'analytics',  icon: '📉',  label: 'Analytics',    tip: 'Class & subject analysis',            show: _examCanAnalytics },
      { id: 'eranalytics',icon: '🔭',  label: 'ER Analytics', tip: 'ER module deep analytics',            show: _examCanAnalytics },
      { id: 'rankings',   icon: '🏆',  label: 'Rankings',     tip: 'Top performers & leaderboard',        show: true },
      { id: 'progress',   icon: '🎓',  label: 'Progress',     tip: 'Per-student progress over exams',     show: true }
    ]},
    { groupLabel: 'Documents', color: '#16a34a', tabs: [
      { id: 'admitcard',  icon: '🪪',  label: 'Admit Cards',  tip: 'Generate & print admit cards',        show: _isAdminOrArunkumar() },
      { id: 'reportcard', icon: '📋',  label: 'Report Cards', tip: 'Print report cards (main)',           show: _isAdminOrArunkumar() },
      { id: 'erreportcard',icon:'🖨️', label: 'ER Reports',   tip: 'ER module report cards',             show: _isAdminOrArunkumar() }
    ]},
    { groupLabel: 'Students', color: '#7c3aed', tabs: [
      { id: 'erstudents', icon: '👥',  label: 'ER Students',  tip: 'Manage ER module student list',       show: _isAdminOrArunkumar() }
    ]},
    { groupLabel: 'Schedule', color: '#d97706', tabs: [
      { id: 'schedule',   icon: '📅',  label: 'Schedule',     tip: 'Exam timetable & dates',              show: true }
    ]},
    { groupLabel: 'Batch', color: '#0891b2', tabs: [
      { id: 'batchassign', icon: '🎯', label: 'Batch Assign', tip: 'Assign students to course batches after KBT', show: _isAdminOrArunkumar() }
    ]},
    { groupLabel: 'Setup', color: '#c9870a', tabs: [
      { id: 'classsubjects',icon:'📚', label: 'Subjects',     tip: 'Assign subjects per class',           show: _isAdminOrArunkumar() },
      { id: 'manage',     icon: '⚙️',  label: 'Manage',       tip: 'Exam types, grades, subjects',        show: _isAdminOrArunkumar() },
      { id: 'ersettings', icon: '🔧',  label: 'ER Settings',  tip: 'ER module settings',                  show: _isAdminOrArunkumar() }
    ]}
  ];
  // Validate current tab is visible, else fallback
  var allVisibleTabs = [];
  tabGroups.forEach(function(g){ g.tabs.forEach(function(t){ if(t.show) allVisibleTabs.push(t.id); }); });
  if (allVisibleTabs.indexOf(_examUnifiedTab) < 0) _examUnifiedTab = allVisibleTabs[0] || 'marks';
  // -- Find active tab object for context hint --
  var activeTabObj = null;
  var activeGroupColor = '#1433a8';
  tabGroups.forEach(function(g){
    g.tabs.forEach(function(t){
      if(t.id === _examUnifiedTab){ activeTabObj = t; activeGroupColor = g.color; }
    });
  });
  // -- Live bridge stats --
  var erExamCount = (typeof _ERH_COURSES !== 'undefined') ? _ERH_COURSES.length : ((typeof erGetExams === 'function') ? erGetExams().length : 0);
  var erStuCount  = (typeof _ERH_DATA !== 'undefined') ? Object.keys(_ERH_DATA).reduce(function(s,c){return s+(_ERH_DATA[c].students||[]).length;},0) : ((typeof erGetStudents === 'function') ? erGetStudents().length : 0);
  var bridgeActive = erExamCount > 0 || erStuCount > 0;
  // -- Exam quick stats --
  var totalStudents = (typeof students !== 'undefined') ? students.length : 0;
  var totalExamTypes = (typeof EXAM_TYPES !== 'undefined') ? EXAM_TYPES.length : 0;
  var totalSubjects  = (typeof EXAM_SUBJECTS !== 'undefined') ? EXAM_SUBJECTS.length : 0;
  // Count total marks entered across all keys
  var totalMarksEntered = 0;
  var totalMarkSlots = 0;
  if (typeof examMarksData !== 'undefined' && typeof EXAM_TYPES !== 'undefined' && typeof EXAM_SUBJECTS !== 'undefined') {
    Object.keys(examMarksData).forEach(function(k){
      var d = examMarksData[k];
      if(d) totalMarksEntered += Object.keys(d).length;
    });
    if(totalStudents && totalExamTypes && totalSubjects) totalMarkSlots = totalStudents * totalExamTypes * totalSubjects;
  }
  var completionPct = totalMarkSlots > 0 ? Math.min(100, Math.round(totalMarksEntered / totalMarkSlots * 100)) : 0;
  // Role label for masthead
  var roleLabels = {
    admin:'🛡 Administrator', manager:'⚙️ Manager', teacher:'📖 Teacher',
    accounts:'💳 Accounts', hostel:'🏠 Hostel', housemaster:'🏠 House Master',
    it:'💻 IT', staff:'👤 Staff'
  };
  var roleLabel = roleLabels[_examUserRole] || '👤 User';
  // ═══════════════════════════════════════════
  // MASTHEAD
  // ═══════════════════════════════════════════
  var mastheadHTML =
    '<div class="gnsi-exam-hub-masthead">'
    // Background grid pattern
    + '<div style="position:absolute;inset:0;background:url(\'data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\'%3E%3Ccircle cx=\'20\' cy=\'20\' r=\'1\' fill=\'%23ffffff\' fill-opacity=\'0.06\'/%3E%3C/g%3E%3C/svg%3E\') repeat;pointer-events:none;border-radius:18px;z-index:0"></div>'
    + '<div class="gnsi-exam-masthead-top">'
      + '<div class="gnsi-exam-masthead-icon">🎓</div>'
      + '<div>'
        + '<div class="gnsi-exam-masthead-title">Exam HUB</div>'
        + '<div class="gnsi-exam-masthead-sub">'+(window.TENANT?window.TENANT.name:'Guidance Navodaya &amp; Sainik Institute')+' · Examination Management</div>'
      + '</div>'
      + '<div class="gnsi-exam-masthead-right">'
        + '<div class="gnsi-exam-status-pill ' + (bridgeActive ? 'green' : 'amber') + '">'
          + '<span class="pill-dot"></span>'
          + (bridgeActive
              ? '🔗 Bridge Active &nbsp;·&nbsp; ' + erExamCount + ' exams · ' + erStuCount + ' students'
              : '⚠️ No ER sync yet')
        + '</div>'
        + '<div style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);border-radius:9px;padding:5px 12px;font-size:11px;font-weight:700;color:rgba(255,255,255,.8);font-family:\'DM Sans\',sans-serif">'
          + roleLabel
        + '</div>'
      + '</div>'
    + '</div>'
    // Stat strip
    + '<div class="gnsi-exam-stat-strip">'
      + '<div class="gnsi-exam-stat-item">'
        + '<div class="gnsi-exam-stat-label">Students</div>'
        + '<div class="gnsi-exam-stat-val">' + totalStudents + '</div>'
        + '<div class="gnsi-exam-stat-sub">enrolled</div>'
        + '<div class="gnsi-exam-stat-bar"><div class="gnsi-exam-stat-bar-fill" style="width:100%;background:linear-gradient(90deg,#2451ff,#5b7fff)"></div></div>'
      + '</div>'
      + '<div class="gnsi-exam-stat-item">'
        + '<div class="gnsi-exam-stat-label">Exam Types</div>'
        + '<div class="gnsi-exam-stat-val">' + totalExamTypes + '</div>'
        + '<div class="gnsi-exam-stat-sub">configured</div>'
        + '<div class="gnsi-exam-stat-bar"><div class="gnsi-exam-stat-bar-fill" style="width:' + Math.min(100, totalExamTypes * 20) + '%;background:linear-gradient(90deg,#7c3aed,#a78bfa)"></div></div>'
      + '</div>'
      + '<div class="gnsi-exam-stat-item">'
        + '<div class="gnsi-exam-stat-label">Subjects</div>'
        + '<div class="gnsi-exam-stat-val">' + totalSubjects + '</div>'
        + '<div class="gnsi-exam-stat-sub">active</div>'
        + '<div class="gnsi-exam-stat-bar"><div class="gnsi-exam-stat-bar-fill" style="width:' + Math.min(100, totalSubjects * 10) + '%;background:linear-gradient(90deg,#d97706,#fbbf24)"></div></div>'
      + '</div>'
      + '<div class="gnsi-exam-stat-item">'
        + '<div class="gnsi-exam-stat-label">Completion</div>'
        + '<div class="gnsi-exam-stat-val">' + completionPct + '%</div>'
        + '<div class="gnsi-exam-stat-sub">' + totalMarksEntered + ' marks entered</div>'
        + '<div class="gnsi-exam-stat-bar"><div class="gnsi-exam-stat-bar-fill" style="width:' + completionPct + '%;background:linear-gradient(90deg,#06d6a0,#34d399)"></div></div>'
      + '</div>'
    + '</div>'
  + '</div>'; // end masthead
  // ═══════════════════════════════════════════
  // PRO TAB NAV
  // ═══════════════════════════════════════════
  var tabNavHTML = '<div class="gnsi-exam-pro-tabnav">';
  tabGroups.forEach(function(grp) {
    var visibleTabs = grp.tabs.filter(function(t){ return t.show; });
    if (!visibleTabs.length) return;
    tabNavHTML += '<div class="gnsi-exam-pro-tabgroup">';
    tabNavHTML += '<span class="gnsi-exam-pro-grouplabel">' + grp.groupLabel + '</span>';
    tabNavHTML += '<div class="gnsi-exam-dash-grid">';
    visibleTabs.forEach(function(t) {
      var active = (_examUnifiedTab === t.id);
      var onclick = '_examUnifiedTab=\'' + t.id + '\';'
        + 'examEntryMode=false;examAdvancedGridMode=false;examQuickCreateMode=false;'
        + 'examPendingDeleteSubject=\'\';examPendingDeleteType=\'\';'
        + 'examRenameSubject=\'\';examRenameType=\'\';dedEntrySearch=\'\';'
        + 'if(typeof render===\'function\')render();';
      tabNavHTML += '<button class="gnsi-exam-pro-tab' + (active ? ' active' : '') + '" '
        + 'title="' + t.tip + '" onclick="' + onclick + '" '
        + 'style="'
        + (active
            ? 'background:' + grp.color + ';box-shadow:0 4px 16px ' + grp.color + '55;'
            : '--accent-col:' + grp.color + ';')
        + '">'
        + '<span class="tab-accent-bar" style="background:' + grp.color + '"></span>'
        + '<span class="tab-icon">' + t.icon + '</span>'
        + '<span class="tab-label">' + t.label + '</span>'
        + '<span class="tab-tip">' + t.tip + '</span>'
        + '</button>';
    });
    tabNavHTML += '</div></div>';
  });
  tabNavHTML += '</div>';
  // Active tab context hint
  var contextHint = activeTabObj
    ? '<div class="gnsi-exam-context-hint">'
        + '<span style="font-size:15px">💡</span>'
        + '<span><b>' + activeTabObj.icon + ' ' + activeTabObj.label + '</b> -- ' + activeTabObj.tip + '</span>'
      + '</div>'
    : '';
  // Bridge banner
  var bridgeBanner = bridgeActive
    ? '<div class="gnsi-exam-bridge-banner active">🔗 Bridge active -- ' + erExamCount + ' exams · ' + erStuCount + ' students synced to Parent Portal</div>'
    : '<div class="gnsi-exam-bridge-banner inactive">⚠️ No ER data yet -- enter marks to auto-sync to Parent Portal</div>';
  // ═══════════════════════════════════════════
  // ROUTE TO CONTENT
  // ═══════════════════════════════════════════
  var body = '';
  var t = _examUnifiedTab;
  if (t === 'entry' || t === 'marks' || t === 'analytics' || t === 'rankings' ||
      t === 'progress' || t === 'schedule' || t === 'admitcard' || t === 'batchassign' ||
      t === 'reportcard' || t === 'classsubjects' || t === 'manage') {
    examActiveTab = t === 'entry' ? 'entry' : t;
    _examCalledFromHub = true; body = renderExam(); _examCalledFromHub = false;
  } else if (t === 'erentry') {
    _erView = 'markentry'; body = renderExamResults();
  } else if (t === 'erresults') {
    _erView = 'results';   body = renderExamResults();
  } else if (t === 'eranalytics') {
    _erView = 'analytics'; body = renderExamResults();
  } else if (t === 'erreportcard') {
    _erView = 'reportcard';body = renderExamResults();
  } else if (t === 'erstudents') {
    _erView = 'students';  body = renderExamResults();
  } else if (t === 'ersettings') {
    _erView = 'settings';  body = renderExamResults();
  } else {
    _examCalledFromHub = true; body = renderExam(); _examCalledFromHub = false;
  }
  var modeToggleHTML = (function(){
    var _io = gnsiExamClassMode === 'old';
    var _os = 'padding:7px 18px;border-radius:9px;border:2px solid ' + (_io ? '#1433a8;background:#1433a8;color:#fff;font-weight:800' : 'var(--border);background:var(--surface);color:var(--muted);font-weight:600') + ';font-size:12.5px;cursor:pointer;transition:all .15s';
    var _ns = 'padding:7px 18px;border-radius:9px;border:2px solid ' + (!_io ? '#7c3aed;background:#7c3aed;color:#fff;font-weight:800' : 'var(--border);background:var(--surface);color:var(--muted);font-weight:600') + ';font-size:12.5px;cursor:pointer;transition:all .15s';
    return '<div style="display:flex;align-items:center;gap:10px;padding:10px 16px;background:linear-gradient(135deg,#f8faff,#eef2ff);border:1.5px solid #c7d2fe;border-radius:12px;margin-bottom:14px;flex-wrap:wrap">'
      + '<span style="font-size:12px;font-weight:800;color:#1433a8;text-transform:uppercase;letter-spacing:.08em">&#128203; Class System</span>'
      + '<div style="display:flex;gap:6px;margin-left:auto">'
      + '<button onclick="gnsiExamSetMode(&quot;old&quot;)" style="' + _os + '">' + (_io ? '&#9989; ' : '') + 'Old System (Classes)</button>'
      + '<button onclick="gnsiExamSetMode(&quot;new&quot;)" style="' + _ns + '">' + (!_io ? '&#9989; ' : '') + 'New System (Batches)</button>'
      + '</div>'
      + '<span style="font-size:11px;color:var(--muted);font-style:italic">'
      + (_io ? 'Original classes: Combined, Navodaya, Foundation, Sainik…' : '7 Batches: Achiever · Leader · Champion · Lakshya · Umeed · Elite · Prime')
      + '</span></div>';
  })();
  return mastheadHTML + tabNavHTML + contextHint + bridgeBanner + modeToggleHTML + body;
}
/* -- end renderExamHub ----------------------------------------------------- */
// -- ER module view state ----------------------------------------------------
var _erView = 'markentry'; // set by renderExamHub before calling renderExamResults
/* Restore ER settings from localStorage/cloud on load */
(function(){
  try{ var _gs=JSON.parse(localStorage.getItem('gnsi_er_grade_settings')||'null'); if(_gs)window._erGradeSettings=_gs; }catch(e){}
  try{ var _el=localStorage.getItem('gnsi_er_exam_label'); if(_el)window._erExamLabel=_el; }catch(e){}
})();
/* ══════════════════════════════════════════════════════════════════
   renderExamResults  --  ER (Exam Results) module stub
   Renders a placeholder panel for each _erView until the full
   ER module is implemented.
   ══════════════════════════════════════════════════════════════════ */
function renderExamResultsHub() {
  _erhSearchQuery = '';
  return '<div class="erh-page">'
    +'<div class="erh-header">'
      +'<div class="erh-header-inner">'
        +'<div class="erh-header-logo">📋</div>'
        +'<div>'
          +'<div class="erh-header-badge">2nd Test &middot; 2026</div>'
          +'<div class="erh-header-title">Exam Results Hub</div>'
          +'<div class="erh-header-sub">'+(window.TENANT?window.TENANT.name:' Navodaya &amp; Sainik Institute')+' &middot; '+(window.TENANT?window.TENANT.address:'Khangabok, Thoubal, Manipur')+'</div>'
        +'</div>'
      +'</div>'
      +'<div class="erh-summary-strip">'+_erhBuildSummaryCards()+'</div>'
      +'<div class="erh-tab-nav-wrap"><div class="erh-tab-nav" id="erh-tab-nav">'+_erhBuildTabBtns()+'</div></div>'
    +'</div>'
    +'<div class="erh-main"><div id="erh-course-area">'+_erhBuildCourseArea()+'</div></div>'
    +'</div>';
}
/* -- ERH ADVANCED EDITOR --------------------------------------------------- */
var _erhEditMode = false;
var _erhUnsaved = false;
var _ERH_ORIGINAL = null; // JSON snapshot for reset
function _erhInitOriginal() {
  if (!_ERH_ORIGINAL) _ERH_ORIGINAL = JSON.stringify(_ERH_DATA);
}
// -- localStorage persistence ----------------------------------------------
var _ERH_LS_KEY = 'gnsi_erh_edits_v1';
function _erhSaveLS() {
  try { localStorage.setItem(_ERH_LS_KEY, JSON.stringify(_ERH_DATA)); } catch(e){}
}
function _erhLoadLS() {
  try {
    var raw = localStorage.getItem(_ERH_LS_KEY);
    if (!raw) return false;
    var saved = JSON.parse(raw);
    // Merge saved data back into _ERH_DATA
    Object.keys(saved).forEach(function(c) {
      if (_ERH_DATA[c]) _ERH_DATA[c].students = saved[c].students;
    });
    return true;
  } catch(e) { return false; }
}
// -- Recalculate totals & ranks for a course -------------------------------
function _erhRecalc(course) {
  var d = _ERH_DATA[course];
  // Recalc totals
  d.students.forEach(function(s) {
    var tot = 0;
    d.subjects.forEach(function(sub) { tot += (s.subjects[sub] || 0); });
    s.total = tot;
  });
  // Recalc ranks (dense rank, only students with total > 0)
  var sorted = d.students.filter(function(s){return s.total>0;})
    .slice().sort(function(a,b){return b.total-a.total;});
  var rank=1;
  sorted.forEach(function(s,i){
    if(i>0 && s.total<sorted[i-1].total) rank=i+1;
    s.rank = rank;
  });
  d.students.filter(function(s){return s.total===0;}).forEach(function(s){
    s.rank = sorted.length+1;
  });
}
// -- Score change handler (called from input oninput) -----------------------
function _erhScoreChange(ci, si, subi, val) {
  _erhInitOriginal();
  var course = _ERH_COURSES[ci];
  var d = _ERH_DATA[course];
  var sub = d.subjects[subi];
  var v = parseFloat(val);
  if (isNaN(v) || v < 0) v = 0;
  if (v > 20) v = 20;
  d.students[si].subjects[sub] = v;
  _erhRecalc(course);
  _erhUnsaved = true;
  // Update total cell in-place without full re-render
  var totalEl = document.getElementById('erh-total-'+si);
  if (totalEl) { totalEl.textContent = d.students[si].total; totalEl.className='erh-total-edited'; }
  // Update save badge
  var badge = document.getElementById('erh-save-badge');
  if (badge) badge.innerHTML = '<span class="erh-unsaved-dot"></span>Unsaved';
}
// -- Save ------------------------------------------------------------------
function _erhSave() {
  _erhRecalc(_erhActiveCourse);
  _erhSaveLS();
  _erhUnsaved = false;
  var badge = document.getElementById('erh-save-badge');
  if (badge) { badge.innerHTML = '✓ Saved'; badge.className='erh-edit-badge erh-badge-saved'; }
  // Rebuild table & podium to reflect new ranks
  var ca = document.getElementById('erh-course-area');
  if (ca) ca.innerHTML = _erhBuildCourseArea();
  var tnav = document.getElementById('erh-tab-nav');
  if (tnav) tnav.innerHTML = _erhBuildTabBtns();
}
// -- Reset course to original ----------------------------------------------
function _erhReset() {
  if (!_ERH_ORIGINAL) return;
  if (!confirm('Reset all edits for this course to the original data?')) return;
  var orig = JSON.parse(_ERH_ORIGINAL);
  _ERH_DATA[_erhActiveCourse].students = orig[_erhActiveCourse].students;
  _erhUnsaved = false;
  _erhSaveLS();
  var ca = document.getElementById('erh-course-area');
  if (ca) ca.innerHTML = _erhBuildCourseArea();
}
// -- Delete student --------------------------------------------------------
function _erhDeleteStudent(ci, si) {
  _erhInitOriginal();
  var course = _ERH_COURSES[ci];
  var s = _ERH_DATA[course].students[si];
  if (!confirm('Remove ' + s.name + ' from ' + course + '?')) return;
  _ERH_DATA[course].students.splice(si, 1);
  _erhRecalc(course);
  _erhUnsaved = true;
  _erhSaveLS();
  var ca = document.getElementById('erh-course-area');
  if (ca) ca.innerHTML = _erhBuildCourseArea();
}
// -- Add student -----------------------------------------------------------
function _erhAddStudent() {
  _erhInitOriginal();
  var ci = _ERH_COURSES.indexOf(_erhActiveCourse);
  var course = _erhActiveCourse;
  var d = _ERH_DATA[course];
  var nameEl = document.getElementById('erh-new-name');
  var gccEl  = document.getElementById('erh-new-gcc');
  var name = nameEl ? nameEl.value.trim().toUpperCase() : '';
  var gcc  = gccEl  ? gccEl.value.trim() : '';
  if (!name) { if(nameEl){nameEl.style.borderColor='#dc2626';nameEl.focus();} return; }
  var subs = {};
  d.subjects.forEach(function(sub, i) {
    var el = document.getElementById('erh-new-sub-'+i);
    subs[sub] = el ? (parseFloat(el.value)||0) : 0;
  });
  var total = d.subjects.reduce(function(acc,sub){return acc+(subs[sub]||0);},0);
  d.students.push({name:name, gcc:gcc||'--', total:total, rank:0, subjects:subs});
  _erhRecalc(course);
  _erhUnsaved = true;
  _erhSaveLS();
  var ca = document.getElementById('erh-course-area');
  if (ca) ca.innerHTML = _erhBuildCourseArea();
}
// -- Toggle edit mode ------------------------------------------------------
function _erhToggleEdit() {
  _erhInitOriginal();
  _erhLoadLS();
  _erhEditMode = !_erhEditMode;
  var ca = document.getElementById('erh-course-area');
  if (ca) ca.innerHTML = _erhBuildCourseArea();
}
// -- Build toolbar ---------------------------------------------------------
function _erhBuildToolbar() {
  var ci = _ERH_COURSES.indexOf(_erhActiveCourse);
  if (!_erhEditMode) {
    return '<div class="erh-toolbar">'
      +'<button class="erh-btn erh-btn-edit" onclick="_erhToggleEdit()">✏️ Edit Marks</button>'
      +'<button class="erh-btn erh-btn-ghost" onclick="window.print()">🖨 Print</button>'
      +'</div>';
  }
  return '<div class="erh-toolbar">'
    +'<span class="erh-edit-badge erh-badge-editing">✏️ Edit Mode</span>'
    +'<button class="erh-btn erh-btn-primary" onclick="_erhSave()">💾 Save Changes</button>'
    +'<span class="erh-edit-badge erh-badge-editing" id="erh-save-badge" style="margin-left:2px">'
      +'<span class="erh-unsaved-dot"></span>Unsaved'
    +'</span>'
    +'<button class="erh-btn erh-btn-ghost" onclick="_erhReset()" style="margin-left:auto">↩ Reset</button>'
    +'<button class="erh-btn erh-btn-ghost" onclick="_erhToggleEdit()">✕ Exit Edit</button>'
    +'</div>';
}
// -- Override _erhBuildTable to support edit mode --------------------------
var _erhBuildTable_orig = _erhBuildTable;
_erhBuildTable = function(course) {
  if (!_erhEditMode) return _erhBuildTable_orig(course);
  var d = _ERH_DATA[course];
  var ci = _ERH_COURSES.indexOf(course);
  var maxT = _erhCourseMax(course);
  var rows = d.students;
  if (_erhSearchQuery) {
    var q = _erhSearchQuery.toLowerCase();
    rows = rows.filter(function(s){ return s.name.toLowerCase().indexOf(q)>=0 || String(s.gcc).indexOf(q)>=0; });
  }
  var thead = '<thead><tr>'
    +'<th style="width:34px;text-align:center">#</th>'
    +'<th style="min-width:140px">Student</th>'
    +'<th style="min-width:60px">GCC</th>'
    +d.subjects.map(function(s){return '<th class="num" style="min-width:70px">'+s+'</th>';}).join('')
    +'<th class="num" style="min-width:58px">Total</th>'
    +'<th style="width:30px"></th>'
    +'</tr></thead>';
  var tbody = '<tbody>'+rows.map(function(s, rowIdx){
    // Find real index in d.students (in case search filtered)
    var si = d.students.indexOf(s);
    var isTop = s.rank<=3&&s.total>0;
    var subCells = d.subjects.map(function(sub, subi){
      var v = s.subjects[sub]||0;
      return '<td><input class="erh-score-input" type="number" min="0" max="20" value="'+v+'"'
        +' data-ci="'+ci+'" data-si="'+si+'" data-subi="'+subi+'"'
        +' oninput="_erhScoreChange(parseInt(this.dataset.ci),parseInt(this.dataset.si),parseInt(this.dataset.subi),this.value)"></td>';
    }).join('');
    return '<tr class="'+(isTop?'top3':'')+'">'
      +'<td class="erh-rank-cell">'+(s.rank<=3&&s.total>0?_erhMedal(s.rank):s.rank)+'</td>'
      +'<td><div class="erh-student-name" style="font-size:12px">'+s.name+'</div></td>'
      +'<td><span class="erh-gcc-no">'+s.gcc+'</span></td>'
      +subCells
      +'<td class="erh-total-cell" id="erh-total-'+si+'">'+(s.total||0)+'</td>'
      +'<td><button class="erh-del-btn" data-ci="'+ci+'" data-si="'+si+'" onclick="_erhDeleteStudent(parseInt(this.dataset.ci),parseInt(this.dataset.si))" title="Remove student">✕</button></td>'
      +'</tr>';
  }).join('');
  // Add-student row
  var addRow = '<tr class="erh-add-row"><td colspan="'+(3+d.subjects.length+2)+'">'
    +'<div class="erh-add-form">'
    +'<span style="font-size:11px;font-weight:700;color:#059669">➕ Add Student:</span>'
    +'<input id="erh-new-name" class="erh-add-input" placeholder="Full Name" style="min-width:150px">'
    +'<input id="erh-new-gcc" class="erh-add-input" placeholder="GCC No." style="width:70px">'
    +d.subjects.map(function(sub,i){
      return '<input id="erh-new-sub-'+i+'" class="erh-add-input" type="number" min="0" max="20" placeholder="'+sub.substring(0,4)+'" style="width:54px" title="'+sub+'">';
    }).join('')
    +'<button class="erh-btn erh-btn-success" onclick="_erhAddStudent()">Add</button>'
    +'</div>'
    +'</td></tr>';
  tbody += addRow + '</tbody>';
  return '<div class="erh-table-card"><div class="erh-table-scroll"><table class="erh-table">'
    +thead+tbody+'</table></div></div>';
};
// -- Override _erhBuildCourseArea to inject toolbar ------------------------
var _erhBuildCourseArea_orig = _erhBuildCourseArea;
_erhBuildCourseArea = function() {
  var c = _erhActiveCourse;
  var d = _ERH_DATA[c];
  var valid = d.students.filter(function(s){return s.total>0;}).length;
  var modeStyle = _erhEditMode ? 'border:2px solid #f0b429;border-radius:12px;padding:16px;background:#fffbeb;' : '';
  return '<div style="'+modeStyle+'">'
    +_erhBuildToolbar()
    +'<div class="erh-course-header">'
    +'<div><div class="erh-course-title">'+c+'</div>'
    +'<div class="erh-course-meta">'+d.students.length+' students &middot; '+valid+' appeared &middot; '+d.subjects.length+' subjects &middot; 2nd Test 2026</div></div>'
    +'<div class="erh-search-wrap"><span class="erh-search-icon">🔍</span>'
    +'<input class="erh-search-input" type="text" placeholder="Search name or GCC…" value="'+_erhSearchQuery+'" oninput="_erhOnSearch(this.value)"></div>'
    +'</div>'
    +(_erhEditMode ? '' : '<div class="erh-section-label">Top Performers</div><div class="erh-podium">'+_erhBuildPodium(c)+'</div>')
    +(_erhEditMode ? '' : _erhBuildAnalysis(c))
    +'<div class="erh-section-label">'+(_erhEditMode?'Edit Scores':'Full Results')+'</div>'
    +'<div id="erh-table-area">'+_erhBuildTable(c)+'</div>'
    +'</div>';
};
// Load any previously saved edits on first render
(function(){ try { _erhLoadLS(); } catch(e){} })();
/* -- end ERH Advanced Editor ----------------------------------------------- */
/* -- end renderExamResultsHub ---------------------------------------------- */
function renderExamManager(){
try{
  var isAdmin = currentUser&&(currentUser.role==='admin'||currentUser.role==='manager');
  var classNames=gnsiExamGetClasses();
  var allClasses=['All'].concat(classNames);
  var examTypes=emGetExamTypes();
  var rooms=emGetRooms();
  var roomNames=rooms.map(function(r){ return r.name; });
  var allRooms=['All'].concat(roomNames);
  var today=emToday();
  
  var tabs=[
    {id:'seat',    label:'🪑 Seat Chart'},
    {id:'invig',   label:'👁️ Invigilator'},
    {id:'attend',  label:'📋 Attendance'},
    {id:'qs',      label:'📬 Question Submission'},
    {id:'rooms',   label:'🏫 Rooms'},
    {id:'checklist',label:'✅ Checklist'}
  ];
  var emModeBar = (function(){
    var _io = gnsiExamClassMode === 'old';
    var _os = 'padding:5px 14px;border-radius:8px;border:2px solid ' + (_io ? '#1433a8;background:#1433a8;color:#fff;font-weight:800' : 'var(--border);background:var(--surface);color:var(--muted);font-weight:600') + ';font-size:12px;cursor:pointer';
    var _ns = 'padding:5px 14px;border-radius:8px;border:2px solid ' + (!_io ? '#7c3aed;background:#7c3aed;color:#fff;font-weight:800' : 'var(--border);background:var(--surface);color:var(--muted);font-weight:600') + ';font-size:12px;cursor:pointer';
    return '<div style="display:flex;align-items:center;gap:8px;padding:8px 14px;background:linear-gradient(135deg,#f8faff,#eef2ff);border:1.5px solid #c7d2fe;border-radius:10px;margin-bottom:12px;flex-wrap:wrap">'
      + '<span style="font-size:11.5px;font-weight:800;color:#1433a8">&#128203; Class System:</span>'
      + '<button onclick="gnsiExamSetMode(&quot;old&quot;)" style="' + _os + '">' + (_io ? '&#9989; ' : '') + 'Old (Classes)</button>'
      + '<button onclick="gnsiExamSetMode(&quot;new&quot;)" style="' + _ns + '">' + (!_io ? '&#9989; ' : '') + 'New (Batches)</button>'
      + '<span style="font-size:11px;color:var(--muted);margin-left:4px">'
      + (_io ? 'Combined · Navodaya · Foundation · Sainik…' : 'Achiever · Leader · Champion · Lakshya · Umeed · Elite · Prime')
      + '</span></div>';
  })();
  var tabBar='<div style="display:flex;gap:3px;background:var(--surface);border:1px solid var(--border-soft);border-radius:var(--radius);padding:5px;box-shadow:var(--shadow-xs);overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;margin-bottom:22px">'
    +tabs.map(function(tab){
      var active=emActiveTab===tab.id;
      return '<button onclick="emActiveTab=\''+tab.id+'\';emShowForm=false;emEditId=null;emFormMode=\'\';navigate(\'exammanager\')" style="flex:0 0 auto;min-width:90px;padding:9px 8px;border-radius:7px;border:none;cursor:pointer;font-size:11.5px;font-weight:'+(active?'700':'500')+';font-family:\'DM Sans\',sans-serif;background:'+(active?'var(--accent)':'transparent')+';color:'+(active?'#fff':'var(--muted)')+';transition:all .15s;white-space:nowrap">'+tab.label+'</button>';
    }).join('')+'</div>';
  var pageContent='';
  
  if(emActiveTab==='seat'){
    // -- Multi-Class Seat Arrangement ----------------------------------
    var allCharts = emMscLoad();
    var legacyCharts = emGetSeatCharts();
    var builderHTML = '';
    if(emMSC.showBuilder && isAdmin){
      var methodOpts = [
        {v:'rollno',  l:'📋 Roll Number (ascending)'},
        {v:'gcc',     l:'🔢 GCC No. (ascending)'},
        {v:'alpha',   l:'🔤 Alphabetical (A→Z)'},
        {v:'classwise',l:'🏫 Class-wise (then Roll No.)'},
        {v:'mixed',   l:'🔀 Mixed / Interleaved (multi-class)'}
      ];
      var roomRows = emMSC.rooms.map(function(r,idx){
        return '<div style="display:flex;align-items:center;gap:8px;background:var(--surface2);border:1px solid var(--border-soft);border-radius:10px;padding:10px 14px;margin-bottom:8px">'
          +'<div style="flex:1;min-width:0">'
            +'<div style="font-weight:700;font-size:13px;color:var(--accent)">🏛 '+esc(r.room)+'</div>'
            +'<div style="font-size:11px;color:var(--muted);margin-top:3px">📚 Classes: <b>'+esc(r.classes.join(', '))+'</b> · Cap: <b>'+r.cap+'</b> · Students: <b>'+r.studentCount+'</b></div>'
            +(r.invigs&&r.invigs.length?'<div style="font-size:11px;color:var(--muted);margin-top:2px">👤 Invigilator(s): <b>'+esc(r.invigs.join(', '))+'</b></div>':'')
          +'</div>'
          +'<button onclick="emMscRemoveRoom('+idx+')" style="width:28px;height:28px;border-radius:7px;border:1.5px solid #fca5a5;background:#fef2f2;color:#c0291d;cursor:pointer;font-size:14px;flex-shrink:0">✕</button>'
        +'</div>';
      }).join('');
      builderHTML = '<div class="card" style="margin-bottom:20px;border:2px solid var(--accent)">'
        +'<div class="card-head" style="background:linear-gradient(135deg,#e0e8f9,#f0f4ff)">'
          +'<span class="card-title">🪑 Build Multi-Class Seat Arrangement</span>'
          +'<button onclick="emMSC.showBuilder=false;navigate(\'exammanager\')" style="padding:4px 14px;border-radius:8px;border:1px solid var(--border);background:var(--surface);color:var(--muted);font-size:12px;cursor:pointer;font-family:\'DM Sans\',sans-serif">✕ Close</button>'
        +'</div>'
        +'<div style="padding:20px">'
          +'<div style="font-size:11px;font-weight:800;color:var(--accent);text-transform:uppercase;letter-spacing:.1em;margin-bottom:10px">① Exam Details</div>'
          +'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;margin-bottom:20px">'
            +'<div class="form-group" style="margin:0"><label>Exam Name *</label><input id="msc-exam-name" class="filter-sel" placeholder="e.g. Annual Exam 2025" style="width:100%"/></div>'
            +'<div class="form-group" style="margin:0"><label>Date</label><input id="msc-exam-date" type="date" class="filter-sel" value="'+emToday()+'" style="width:100%"/></div>'
            +'<div class="form-group" style="margin:0"><label>Sorting Method</label><select id="msc-method" class="filter-sel" style="width:100%">'
              +methodOpts.map(function(o){ return '<option value="'+o.v+'">'+o.l+'</option>'; }).join('')
            +'</select></div>'
          +'</div>'
          +'<div style="font-size:11px;font-weight:800;color:var(--accent);text-transform:uppercase;letter-spacing:.1em;margin-bottom:10px">② Configure Rooms</div>'
          +(roomRows||'<div style="background:#f5f7fd;border:1.5px dashed var(--border);border-radius:10px;padding:18px;text-align:center;color:var(--muted);font-size:13px;margin-bottom:12px">No rooms added yet -- configure a room below</div>')
          +'<div style="background:var(--surface2);border:1.5px solid var(--border-soft);border-radius:12px;padding:16px 18px;margin-bottom:14px">'
            +'<div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:12px">➕ Add Room</div>'
            +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">'
              +(roomNames.length===0
                ?'<div style="grid-column:1/-1;background:#fef3dc;border:1.5px solid #fde68a;border-radius:10px;padding:12px 16px;display:flex;align-items:center;gap:12px">'
                  +'<span style="font-size:20px">⚠️</span>'
                  +'<div style="flex:1"><div style="font-weight:700;font-size:13px;color:#92400e">No exam rooms configured</div>'
                  +'<div style="font-size:12px;color:#92400e;margin-top:2px">Go to the <b>🏫 Rooms</b> tab first and add your exam halls/classrooms. They will appear here automatically.</div></div>'
                  +'<button onclick="emActiveTab=\'rooms\';navigate(\'exammanager\')" style="padding:7px 16px;border-radius:8px;border:1.5px solid #f59e0b;background:#fffbeb;color:#92400e;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap">🏫 Configure Rooms →</button>'
                +'</div>'
                :'<div class="form-group" style="margin:0"><label>Room *</label><select id="msc-rb-room" class="filter-sel" style="width:100%">'
                  +roomNames.map(function(r){ return'<option>'+esc(r)+'</option>'; }).join('')
                +'</select></div>')
              +'<div class="form-group" style="margin:0"><label>Capacity</label><input id="msc-rb-cap" type="number" class="filter-sel" value="40" min="1" max="500" style="width:100%"/></div>'
            +'</div>'
            +'<div class="form-group" style="margin:0 0 12px"><label>Classes to seat in this room *</label>'
              +'<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:6px;padding:10px;background:var(--surface);border:1px solid var(--border-soft);border-radius:8px">'
                +classNames.map(function(cls){
                  var cnt=students.filter(function(s){ return s.cls===cls; }).length;
                  return '<label style="display:flex;align-items:center;gap:5px;cursor:pointer;padding:4px 10px;border-radius:7px;border:1px solid var(--border-soft);background:var(--surface2);font-size:12px;font-weight:500">'
                    +'<input type="checkbox" class="msc-cls-cb" value="'+esc(cls)+'" style="accent-color:var(--accent)"/>'+esc(cls)+' <span style="font-size:10px;color:var(--muted)">('+cnt+')</span>'
                  +'</label>';
                }).join('')
              +'</div>'
            +'</div>'
            +'<div class="form-group" style="margin:0 0 12px"><label>Invigilator(s) for this room</label>'
              +'<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:6px;padding:10px;background:var(--surface);border:1px solid var(--border-soft);border-radius:8px;max-height:130px;overflow-y:auto">'
                +staff.map(function(s){
                  return '<label style="display:flex;align-items:center;gap:5px;cursor:pointer;padding:3px 10px;border-radius:7px;border:1px solid var(--border-soft);background:var(--surface2);font-size:12px;font-weight:500">'
                    +'<input type="checkbox" class="msc-inv-cb" value="'+esc(s.name)+'" style="accent-color:var(--accent)"/>'+esc(s.name)
                  +'</label>';
                }).join('')
              +'</div>'
            +'</div>'
            +'<button onclick="emMscAddRoom()" style="padding:9px 22px;border-radius:9px;background:var(--accent);color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">+ Add Room</button>'
          +'</div>'
          +'<div style="font-size:11px;font-weight:800;color:var(--accent);text-transform:uppercase;letter-spacing:.1em;margin-bottom:10px">③ Generate</div>'
          +'<div style="display:flex;gap:10px;flex-wrap:wrap">'
            +'<button onclick="emMscGenerate()" class="btn btn-primary" style="font-size:13px;padding:11px 28px">⚡ Generate Seat Arrangement</button>'
            +'<button onclick="emMSC.showBuilder=false;emMSC.rooms=[];navigate(\'exammanager\')" class="btn btn-outline" style="font-size:13px">Cancel</button>'
          +'</div>'
        +'</div></div>';
    }
    var totalCharts  = allCharts.length + legacyCharts.length;
    var totalSeated  = allCharts.reduce(function(a,ch){ return a+ch.totalSeated; },0)
                     + legacyCharts.reduce(function(a,ch){ return a+ch.students.length; },0);
    var statsSummary = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-bottom:20px">'
      +'<div class="stat-card" style="--c:#1433a8"><div class="stat-label">Total Charts</div><div class="stat-val">'+totalCharts+'</div><div class="stat-sub">Generated</div></div>'
      +'<div class="stat-card" style="--c:#16a34a"><div class="stat-label">Students Seated</div><div class="stat-val">'+totalSeated+'</div><div class="stat-sub">Across all charts</div></div>'
      +'<div class="stat-card" style="--c:#7133d4"><div class="stat-label">Rooms Used</div><div class="stat-val">'+allCharts.reduce(function(a,ch){ return a+ch.rooms.length; },0)+'</div><div class="stat-sub">Multi-class</div></div>'
      +'<div class="stat-card" style="--c:#c9870a"><div class="stat-label">Exam Rooms</div><div class="stat-val">'+roomNames.length+'</div><div class="stat-sub">Configured</div></div>'
    +'</div>';
    var methodLabel = {rollno:'Roll No.',gcc:'GCC No.',alpha:'Alphabetical',classwise:'Class-wise',mixed:'Mixed'};
    var newChartCards = allCharts.slice().reverse().map(function(ch){
      var byRoom = {};
      ch.students.forEach(function(s){ if(!byRoom[s.room]) byRoom[s.room]=[]; byRoom[s.room].push(s); });
      var roomSummary = ch.rooms.map(function(r){
        var cnt=byRoom[r.room]?byRoom[r.room].length:0;
        return '<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--surface2);border-radius:8px;border:1px solid var(--border-soft)">'
          +'<div style="flex:1;min-width:0">'
            +'<div style="font-weight:700;font-size:12px;color:var(--text)">🏛 '+esc(r.room)+'</div>'
            +'<div style="font-size:11px;color:var(--muted)">'+esc((r.classes||[]).join(', '))+' · '+cnt+' seated</div>'
            +(r.invigs&&r.invigs.length?'<div style="font-size:10.5px;color:#7133d4;margin-top:1px">👤 '+esc(r.invigs.join(', '))+'</div>':'<div style="font-size:10px;color:var(--muted2)">No invigilator</div>')
          +'</div>'
          +'<span style="background:var(--accent-light);color:var(--accent);border-radius:20px;padding:2px 10px;font-size:11px;font-weight:700">'+cnt+'</span>'
        +'</div>';
      }).join('');
      var previewStudents = ch.students.slice(0,10);
      var preview = '<div style="overflow-x:auto;margin-top:12px"><table style="border-collapse:collapse;font-size:11px;min-width:460px">'
        +'<thead><tr style="background:var(--surface2)">'
          +'<th style="padding:5px 8px;border:1px solid var(--border);text-align:center;font-size:10px;color:var(--muted)">Seat</th>'
          +'<th style="padding:5px 8px;border:1px solid var(--border);text-align:left;font-size:10px;color:var(--muted)">Name</th>'
          +'<th style="padding:5px 8px;border:1px solid var(--border);text-align:left;font-size:10px;color:var(--muted)">Roll / GCC</th>'
          +'<th style="padding:5px 8px;border:1px solid var(--border);text-align:left;font-size:10px;color:var(--muted)">Class</th>'
          +'<th style="padding:5px 8px;border:1px solid var(--border);text-align:left;font-size:10px;color:var(--muted)">Room</th>'
        +'</tr></thead><tbody>'
        +previewStudents.map(function(s,i){
          return '<tr style="background:'+(i%2?'var(--surface2)':'var(--surface)')+'">'
            +'<td style="padding:5px 8px;border:1px solid var(--border-soft);text-align:center;font-weight:800;color:var(--accent)">'+s.seat+'</td>'
            +'<td style="padding:5px 8px;border:1px solid var(--border-soft);font-weight:600">'+esc(s.name)+'</td>'
            +'<td style="padding:5px 8px;border:1px solid var(--border-soft);font-family:\'JetBrains Mono\',monospace;font-size:10px">'+esc(s.roll)+(s.gcc&&s.gcc!=='--'?' / '+esc(s.gcc):'')+'</td>'
            +'<td style="padding:5px 8px;border:1px solid var(--border-soft);font-size:11px">'+esc(s.cls)+'</td>'
            +'<td style="padding:5px 8px;border:1px solid var(--border-soft);font-size:11px;color:var(--muted)">'+esc(s.room)+'</td>'
          +'</tr>';
        }).join('')
        +(ch.students.length>10?'<tr><td colspan="5" style="padding:7px;text-align:center;color:var(--muted);font-style:italic;border:1px solid var(--border-soft)">…+'+(ch.students.length-10)+' more students</td></tr>':'')
      +'</tbody></table></div>';
      return '<div style="background:var(--surface);border:1.5px solid var(--border-soft);border-radius:var(--radius);margin-bottom:16px;box-shadow:var(--shadow-sm);overflow:hidden">'
        +'<div style="background:linear-gradient(135deg,var(--accent),#1b44cc);padding:14px 18px;color:#fff;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap">'
          +'<div><div style="font-family:\'Playfair Display\',serif;font-size:16px;font-weight:700">'+esc(ch.exam)+'</div>'
          +'<div style="font-size:11px;opacity:.8;margin-top:4px">📅 '+emDateLabel(ch.date)+' · 🔢 '+esc(methodLabel[ch.method]||ch.method)+' · 👥 '+ch.totalSeated+' students · 🏛 '+ch.rooms.length+' room(s)</div></div>'
          +'<div style="display:flex;gap:6px;flex-wrap:wrap;flex-shrink:0">'
            +'<button onclick="emMscPrint(\''+ch.id+'\')" style="padding:6px 14px;border-radius:8px;border:1.5px solid rgba(255,255,255,.4);background:rgba(255,255,255,.15);color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">🖨 Full Print</button>'
            +'<button onclick="emMscPrintInvigSummary(\''+ch.id+'\')" style="padding:6px 14px;border-radius:8px;border:1.5px solid rgba(255,255,255,.4);background:rgba(255,255,255,.12);color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">👁 Invig Sheet</button>'
            +'<button onclick="emMscPrintAttendance(\''+ch.id+'\')" style="padding:6px 14px;border-radius:8px;border:1.5px solid rgba(255,255,255,.4);background:rgba(100,255,180,.12);color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">📋 Attendance</button>'
            +'<button onclick="emMscExportExcel(\''+ch.id+'\')" style="padding:6px 14px;border-radius:8px;border:1.5px solid rgba(255,255,255,.4);background:rgba(100,220,100,.15);color:#a3f7b5;font-size:12px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">⬇ Excel</button>'
            +(isAdmin?'<button onclick="emMscDeleteChart(\''+ch.id+'\')" style="padding:6px 12px;border-radius:8px;border:1.5px solid rgba(255,100,100,.5);background:rgba(255,100,100,.15);color:#fca5a5;font-size:12px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">🗑</button>':'')
          +'</div>'
        +'</div>'
        +'<div style="padding:14px 16px"><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px;margin-bottom:10px">'+roomSummary+'</div>'+preview+'</div>'
      +'</div>';
    }).join('');
    var legacyCards = legacyCharts.length
      ? '<div style="margin-top:16px;font-size:12px;font-weight:700;color:var(--muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:.06em">Legacy Single-Class Charts</div>'
        +legacyCharts.slice().reverse().map(function(c){
          return '<div style="background:var(--surface);border:1px solid var(--border-soft);border-radius:var(--radius);padding:14px 18px;margin-bottom:10px;box-shadow:var(--shadow-xs);display:flex;align-items:center;gap:12px;flex-wrap:wrap">'
            +'<div style="width:38px;height:38px;border-radius:9px;background:var(--accent-light);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">🪑</div>'
            +'<div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:700">'+esc(c.exam)+'</div>'
            +'<div style="font-size:11px;color:var(--muted)">'+esc(c.cls)+' · '+esc(c.room)+' · '+emDateLabel(c.date)+' · '+c.students.length+' students</div></div>'
            +'<div style="display:flex;gap:8px">'
              +'<button onclick="emPrintSeatChart(\''+c.id+'\')" class="btn btn-outline" style="font-size:12px;padding:6px 12px">🖨</button>'
              +(isAdmin?'<button onclick="emDeleteSeatChart(\''+c.id+'\')" style="padding:6px 12px;border-radius:8px;border:1px solid #fca5a5;background:#fef2f2;color:#c0291d;font-size:12px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">🗑</button>':'')
            +'</div>'
          +'</div>';
        }).join('')
      : '';
    var emptyState = (!allCharts.length && !legacyCharts.length)
      ? '<div style="padding:60px;text-align:center;color:var(--muted)"><div style="font-size:48px;margin-bottom:14px">🪑</div><div style="font-size:16px;font-weight:700;margin-bottom:8px">No Seat Arrangements Yet</div><div style="font-size:13px;margin-bottom:20px">Create a multi-class arrangement to seat students across multiple rooms with invigilators</div>'
        +(isAdmin?'<button onclick="emMSC.showBuilder=true;navigate(\'exammanager\')" class="btn btn-primary" style="font-size:13px">⚡ Create First Arrangement</button>':'')+'</div>'
      : '';
    pageContent = statsSummary
      +(isAdmin?'<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap"><button onclick="emMSC.showBuilder=!emMSC.showBuilder;emMSC.rooms=[];navigate(\'exammanager\')" class="btn btn-primary" style="font-size:13px">⚡ New Multi-Class Arrangement</button></div>':'')
      +builderHTML
      +(totalCharts?'<div class="card"><div class="card-head"><span class="card-title">🪑 Seat Arrangements</span><span style="font-size:12px;color:var(--muted)">'+totalCharts+' chart(s) · '+totalSeated+' students</span></div><div style="padding:16px 18px">'+newChartCards+legacyCards+'</div></div>':emptyState);
  }
  else if(emActiveTab==='invig'){
    var invData=emGetInvigilators();
    var formHTML='';
    if(emShowForm&&isAdmin){
      var editRec=emEditId?invData.find(function(d){ return d.id===emEditId; }):null;
      formHTML='<div class="card" style="margin-bottom:20px">'
        +'<div class="card-head"><span class="card-title">'+(emEditId?'✏️ Edit':'➕ Add')+' Invigilator Assignment</span></div>'
        +'<div style="padding:20px;display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px">'
        +'<div class="form-group" style="margin:0"><label>Exam Name *</label><input id="em-inv-exam" class="filter-sel" placeholder="e.g. Final Exam 2024" value="'+(editRec?esc(editRec.exam):'')+'"/></div>'
        +'<div class="form-group" style="margin:0"><label>Date</label><input id="em-inv-date" type="date" class="filter-sel" value="'+(editRec?editRec.date:today)+'"/></div>'
        +'<div class="form-group" style="margin:0"><label>Room *</label><select id="em-inv-room" class="filter-sel">'+(roomNames.length?roomNames.map(function(r){ return'<option'+(editRec&&editRec.room===r?' selected':'')+'>'+esc(r)+'</option>'; }).join(''):'<option value="">-- Configure rooms in 🏫 Rooms tab first --</option>')+'</select></div>'
        +'<div class="form-group" style="margin:0"><label>Session</label><select id="em-inv-session" class="filter-sel"><option'+(editRec&&editRec.session==='Morning'?' selected':'')+'>Morning</option><option'+(editRec&&editRec.session==='Afternoon'?' selected':'')+'>Afternoon</option><option'+(editRec&&editRec.session==='Evening'?' selected':'')+'>Evening</option><option'+(editRec&&editRec.session==='Full Day'?' selected':'')+'>Full Day</option></select></div>'
        +'<div class="form-group" style="margin:0"><label>Time (e.g. 10:00–12:00)</label><input id="em-inv-time" class="filter-sel" placeholder="10:00 AM – 12:00 PM" value="'+(editRec?esc(editRec.time||''):'')+'"/></div>'
        +'<div class="form-group" style="margin:0"><label>Invigilator *</label><input id="em-inv-staff" class="filter-sel" list="em-inv-staff-list" placeholder="Select or type name" value="'+(editRec?esc(editRec.invig):'')+'"/><datalist id="em-inv-staff-list">'+staff.map(function(s){ return'<option value="'+esc(s.name)+'">'; }).join('')+'</datalist></div>'
        +'<div class="form-group" style="margin:0"><label>Reserve Invigilator</label><input id="em-inv-reserve" class="filter-sel" list="em-inv-res-list" placeholder="Backup invigilator" value="'+(editRec?esc(editRec.reserve||''):'')+'"/><datalist id="em-inv-res-list">'+staff.map(function(s){ return'<option value="'+esc(s.name)+'">'; }).join('')+'</datalist></div>'
        +'<div class="form-group" style="margin:0;grid-column:1/-1"><label>Remarks</label><input id="em-inv-remarks" class="filter-sel" placeholder="Any special notes" value="'+(editRec?esc(editRec.remarks||''):'')+'"/></div>'
        +'<div style="grid-column:1/-1;display:flex;gap:10px"><button onclick="emSaveInvigilatorForm()" class="btn btn-primary" style="font-size:13px;padding:10px 24px">💾 Save</button><button onclick="emShowForm=false;emEditId=null;navigate(\'exammanager\')" class="btn btn-outline" style="font-size:13px">Cancel</button></div>'
        +'</div></div>';
    }
    
    var grouped={};
    invData.forEach(function(d){
      var k=d.date+'||'+d.exam;
      if(!grouped[k])grouped[k]={exam:d.exam,date:d.date,entries:[]};
      grouped[k].entries.push(d);
    });
    var groupKeys=Object.keys(grouped).sort().reverse();
    var invCards=groupKeys.length?groupKeys.map(function(k){
      var g=grouped[k];
      return '<div style="background:var(--surface);border:1px solid var(--border-soft);border-radius:var(--radius);margin-bottom:12px;overflow:hidden;box-shadow:var(--shadow-xs)">'
        +'<div style="background:var(--accent);color:#fff;padding:10px 18px;display:flex;align-items:center;justify-content:space-between">'
        +'<div><div style="font-size:14px;font-weight:700">'+esc(g.exam)+'</div><div style="font-size:11px;opacity:.85">'+emDateLabel(g.date)+' &nbsp;·&nbsp; '+g.entries.length+' room(s)</div></div>'
        +'</div>'
        +'<div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;font-size:12px"><thead><tr>'
        +'<th style="padding:8px 12px;border-bottom:1px solid var(--border);background:var(--surface2);text-align:left;font-size:11px">Room</th>'
        +'<th style="padding:8px 12px;border-bottom:1px solid var(--border);background:var(--surface2);text-align:left;font-size:11px">Session</th>'
        +'<th style="padding:8px 12px;border-bottom:1px solid var(--border);background:var(--surface2);text-align:left;font-size:11px">Invigilator</th>'
        +'<th style="padding:8px 12px;border-bottom:1px solid var(--border);background:var(--surface2);text-align:left;font-size:11px">Reserve</th>'
        +'<th style="padding:8px 12px;border-bottom:1px solid var(--border);background:var(--surface2);text-align:left;font-size:11px">Remarks</th>'
        +(isAdmin?'<th style="padding:8px 12px;border-bottom:1px solid var(--border);background:var(--surface2);text-align:center;font-size:11px">Action</th>':'')
        +'</tr></thead><tbody>'
        +g.entries.map(function(d,i){
          return '<tr style="background:'+(i%2?'var(--surface2)':'var(--surface)'+'')+'">'
            +'<td style="padding:8px 12px;border-bottom:1px solid var(--border-soft);font-weight:700">'+esc(d.room)+'</td>'
            +'<td style="padding:8px 12px;border-bottom:1px solid var(--border-soft)">'+esc(d.session)+(d.time?' <span style="color:var(--muted);font-size:11px">('+esc(d.time)+')</span>':'')+'</td>'
            +'<td style="padding:8px 12px;border-bottom:1px solid var(--border-soft);font-weight:600;color:var(--accent)">'+esc(d.invig)+'</td>'
            +'<td style="padding:8px 12px;border-bottom:1px solid var(--border-soft);color:var(--muted)">'+esc(d.reserve||'--')+'</td>'
            +'<td style="padding:8px 12px;border-bottom:1px solid var(--border-soft);font-size:11px;color:var(--muted2)">'+esc(d.remarks||'--')+'</td>'
            +(isAdmin?'<td style="padding:8px 12px;border-bottom:1px solid var(--border-soft);text-align:center;white-space:nowrap">'
              +'<button onclick="emEditId=\''+d.id+'\';emShowForm=true;navigate(\'exammanager\')" style="padding:3px 10px;border-radius:6px;border:1px solid var(--accent);background:var(--accent-light);color:var(--accent);font-size:11px;cursor:pointer;font-weight:700;font-family:\'DM Sans\',sans-serif">Edit</button>'
              +' <button onclick="emDeleteInvig(\''+d.id+'\')" style="padding:3px 10px;border-radius:6px;border:1px solid #fca5a5;background:#fef2f2;color:#c0291d;font-size:11px;cursor:pointer;font-weight:700;font-family:\'DM Sans\',sans-serif">✕</button>'
              +'</td>':'')
            +'</tr>';
        }).join('')+'</tbody></table></div></div>';
    }).join('') : '<div style="padding:40px;text-align:center;color:var(--muted)"><div style="font-size:40px;margin-bottom:12px">👁️</div><div style="font-size:15px;font-weight:700">No invigilator assignments yet</div></div>';
    pageContent=(isAdmin?'<div style="display:flex;gap:8px;margin-bottom:16px"><button onclick="emShowForm=!emShowForm;emEditId=null;navigate(\'exammanager\')" class="btn btn-primary" style="font-size:13px">➕ Add Assignment</button><button onclick="emPrintInvigChart()" class="btn btn-outline" style="font-size:13px">🖨 Print Chart</button></div>':'')
      +formHTML
      +'<div class="card"><div class="card-head"><span class="card-title">👁️ Invigilator Duty Chart</span><span style="font-size:12px;color:var(--muted)">'+invData.length+' assignment(s)</span></div>'
      +'<div style="padding:18px 20px">'+invCards+'</div></div>';
  }
  
  else if(emActiveTab==='attend'){
    var attClass=emClassFilter==='All'?(classNames[0]||'All'):emClassFilter;
    var attExam=emExamFilter||(examTypes[0]||'');
    var attDate=emToday();
    if(!attExam&&!examTypes.length){ attExam='Unit Test'; }
    var att=emGetAttendance();
    var key=emGetAttendanceKey(attExam,attDate,attClass);
    var rec=att[key]||{};
    var cls_students=students.filter(function(s){ return s.cls===attClass; });
    cls_students.sort(function(a,b){ return a.name.localeCompare(b.name); });
    var presentCount=Object.values(rec).filter(function(v){ return v===true; }).length;
    var absentCount=Object.values(rec).filter(function(v){ return v===false; }).length;
    var filterBar='<div style="display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;margin-bottom:18px;background:var(--surface);border:1px solid var(--border-soft);border-radius:var(--radius);padding:14px 18px;box-shadow:var(--shadow-xs)">'
      +'<div class="form-group" style="margin:0;min-width:150px"><label style="font-size:10px">Exam</label><input class="filter-sel" id="em-att-exam" value="'+esc(attExam)+'" placeholder="Exam name" onchange="emExamFilter=this.value;navigate(\'exammanager\')"/></div>'
      +'<div class="form-group" style="margin:0;min-width:120px"><label style="font-size:10px">Class</label><select class="filter-sel" onchange="emClassFilter=this.value;navigate(\'exammanager\')">'+classNames.map(function(c){ return'<option'+(c===attClass?' selected':'')+'>'+esc(c)+'</option>'; }).join('')+'</select></div>'
      +'<div class="form-group" style="margin:0"><label style="font-size:10px">Date</label><input type="date" class="filter-sel" value="'+attDate+'" max="'+today+'"/></div>'
      +'<div style="margin-left:auto;display:flex;gap:8px">'
      +'<button onclick="emMarkAllAttendance(\''+esc(attExam)+'\',\''+attDate+'\',\''+attClass+'\',true)" style="padding:7px 14px;border-radius:8px;border:1px solid #86efac;background:#f0fdf4;color:#16a34a;font-size:12px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">✅ All Present</button>'
      +'<button onclick="emMarkAllAttendance(\''+esc(attExam)+'\',\''+attDate+'\',\''+attClass+'\',false)" style="padding:7px 14px;border-radius:8px;border:1px solid #fca5a5;background:#fef2f2;color:#c0291d;font-size:12px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">❌ All Absent</button>'
      +'<button onclick="emPrintAttendance(\''+esc(attExam)+'\',\''+attDate+'\',\''+attClass+'\')" class="btn btn-outline" style="font-size:12px;padding:7px 14px">🖨 Print</button>'
      +'</div></div>';
    var statsRow='<div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">'
      +'<div style="flex:1;min-width:100px;background:#f0fdf4;border:1px solid #86efac;border-radius:var(--radius-sm);padding:12px 16px;text-align:center"><div style="font-size:22px;font-weight:800;color:#16a34a">'+presentCount+'</div><div style="font-size:11px;color:#16a34a;font-weight:600">Present</div></div>'
      +'<div style="flex:1;min-width:100px;background:#fef2f2;border:1px solid #fca5a5;border-radius:var(--radius-sm);padding:12px 16px;text-align:center"><div style="font-size:22px;font-weight:800;color:#c0291d">'+absentCount+'</div><div style="font-size:11px;color:#c0291d;font-weight:600">Absent</div></div>'
      +'<div style="flex:1;min-width:100px;background:var(--surface);border:1px solid var(--border-soft);border-radius:var(--radius-sm);padding:12px 16px;text-align:center"><div style="font-size:22px;font-weight:800;color:var(--muted)">'+cls_students.length+'</div><div style="font-size:11px;color:var(--muted);font-weight:600">Total</div></div>'
      +'</div>';
    var attRows=cls_students.map(function(s,i){
      var p=rec[s.id];
      var bg=p===true?'#f0fdf4':p===false?'#fef2f2':'var(--surface)';
      return '<div style="display:flex;align-items:center;gap:12px;padding:10px 16px;border-bottom:1px solid var(--border-soft);background:'+bg+'">'
        +'<div style="width:28px;text-align:center;color:var(--muted2);font-size:12px;font-weight:700">'+(i+1)+'</div>'
        +avatarHTML(s.name,34)
        +'<div style="flex:1;min-width:0"><div style="font-weight:600;font-size:13px">'+esc(s.name)+'</div><div style="font-size:11px;color:var(--muted)">Roll: '+(s.roll||'--')+' &nbsp;·&nbsp; '+esc(s.cls)+'</div></div>'
        +'<div style="display:flex;gap:6px;flex-shrink:0">'
        +'<button onclick="emMarkAttendance('+parseInt(s.id,10)+',\''+esc(attExam)+'\',\''+attDate+'\',\''+attClass+'\',true)" style="padding:6px 14px;border-radius:8px;border:1.5px solid '+(p===true?'#16a34a':'var(--border)')+';background:'+(p===true?'#16a34a':'var(--surface)')+';color:'+(p===true?'#fff':'var(--muted)')+';font-size:12px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">✅ P</button>'
        +'<button onclick="emMarkAttendance('+parseInt(s.id,10)+',\''+esc(attExam)+'\',\''+attDate+'\',\''+attClass+'\',false)" style="padding:6px 14px;border-radius:8px;border:1.5px solid '+(p===false?'#c0291d':'var(--border)')+';background:'+(p===false?'#c0291d':'var(--surface)')+';color:'+(p===false?'#fff':'var(--muted)')+';font-size:12px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">❌ A</button>'
        +'</div></div>';
    }).join('');
    pageContent=filterBar+statsRow
      +'<div class="card"><div class="card-head"><span class="card-title">📋 Attendance -- '+esc(attClass)+'</span><span style="font-size:12px;color:var(--muted)">'+esc(attExam)+' &nbsp;·&nbsp; '+emDateLabel(attDate)+'</span></div>'
      +'<div>'+(attRows||'<div style="padding:30px;text-align:center;color:var(--muted)">No students found for this class.</div>')+'</div></div>';
  }
  
  else if(emActiveTab==='qs'){
    var qsData=emGetQS();
    var formHTML='';
    if(emShowForm&&isAdmin){
      var qsEdit=emEditId?qsData.find(function(d){ return d.id===emEditId; }):null;
      formHTML='<div class="card" style="margin-bottom:20px">'
        +'<div class="card-head"><span class="card-title">'+(emEditId?'✏️ Edit':'➕ Add')+' Question Submission Record</span></div>'
        +'<div style="padding:20px;display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px">'
        +'<div class="form-group" style="margin:0"><label>Exam Name *</label><input id="em-qs-exam" class="filter-sel" placeholder="e.g. Final Exam 2024" value="'+(qsEdit?esc(qsEdit.exam):'')+'"/></div>'
        +'<div class="form-group" style="margin:0"><label>Subject *</label><input id="em-qs-subject" class="filter-sel" placeholder="e.g. Mathematics" value="'+(qsEdit?esc(qsEdit.subject):'')+'"/></div>'
        +'<div class="form-group" style="margin:0"><label>Responsible Teacher *</label><input id="em-qs-teacher" class="filter-sel" list="em-qs-teacher-list" placeholder="Teacher name" value="'+(qsEdit?esc(qsEdit.teacher):'')+'"/><datalist id="em-qs-teacher-list">'+staff.map(function(s){ return'<option value="'+esc(s.name)+'">'; }).join('')+'</datalist></div>'
        +'<div class="form-group" style="margin:0"><label>Submission Deadline</label><input id="em-qs-deadline" type="date" class="filter-sel" value="'+(qsEdit?qsEdit.deadline:today)+'"/></div>'
        +'<div class="form-group" style="margin:0;grid-column:1/-1"><label>Status</label><div style="display:flex;align-items:center;gap:20px;margin-top:6px">'
        +'<label style="display:flex;align-items:center;gap:6px;font-weight:500;font-size:13px"><input type="checkbox" id="em-qs-submitted"'+(qsEdit&&qsEdit.submitted?' checked':'')+' style="width:16px;height:16px;accent-color:var(--accent)"/> Submitted</label>'
        +'<label style="display:flex;align-items:center;gap:6px;font-weight:500;font-size:13px"><input type="checkbox" id="em-qs-hardcopy"'+(qsEdit&&qsEdit.hardCopy?' checked':'')+' style="width:16px;height:16px;accent-color:var(--accent)"/> Hard Copy</label>'
        +'<label style="display:flex;align-items:center;gap:6px;font-weight:500;font-size:13px"><input type="checkbox" id="em-qs-softcopy"'+(qsEdit&&qsEdit.softCopy?' checked':'')+' style="width:16px;height:16px;accent-color:var(--accent)"/> Soft Copy</label>'
        +'</div></div>'
        +'<div class="form-group" style="margin:0"><label>Submitted On</label><input id="em-qs-submitdate" type="date" class="filter-sel" value="'+(qsEdit&&qsEdit.submittedOn?qsEdit.submittedOn:'')+'"/></div>'
        +'<div class="form-group" style="margin:0;grid-column:1/-1"><label>Remarks</label><input id="em-qs-remarks" class="filter-sel" placeholder="Any notes" value="'+(qsEdit?esc(qsEdit.remarks||''):'')+'"/></div>'
        +'<div style="grid-column:1/-1;display:flex;gap:10px"><button onclick="emSaveQSForm()" class="btn btn-primary" style="font-size:13px;padding:10px 24px">💾 Save</button><button onclick="emShowForm=false;emEditId=null;navigate(\'exammanager\')" class="btn btn-outline" style="font-size:13px">Cancel</button></div>'
        +'</div></div>';
    }
    var qsPending=qsData.filter(function(d){ return !d.submitted; });
    var qsOverdue=qsPending.filter(function(d){ return d.deadline<today; });
    var statsQS='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;margin-bottom:20px">'
      +'<div class="stat-card" style="--c:#1433a8"><div class="stat-label">Total</div><div class="stat-val">'+qsData.length+'</div><div class="stat-sub">Records</div></div>'
      +'<div class="stat-card" style="--c:#16a34a"><div class="stat-label">Submitted</div><div class="stat-val">'+(qsData.length-qsPending.length)+'</div><div class="stat-sub">On time</div></div>'
      +'<div class="stat-card" style="--c:#c9870a"><div class="stat-label">Pending</div><div class="stat-val">'+qsPending.length+'</div><div class="stat-sub">Awaited</div></div>'
      +'<div class="stat-card" style="--c:#c0291d"><div class="stat-label">Overdue</div><div class="stat-val">'+qsOverdue.length+'</div><div class="stat-sub">Past deadline</div></div>'
      +'</div>';
    var qsRows=qsData.length?qsData.slice().sort(function(a,b){
      var ao=!a.submitted&&a.deadline<today;var bo=!b.submitted&&b.deadline<today;
      if(ao&&!bo)return -1; if(!ao&&bo)return 1;
      return a.deadline.localeCompare(b.deadline);
    }).map(function(d){
      var overdue=!d.submitted&&d.deadline<today;
      var bg=d.submitted?'#f0fdf4':overdue?'#fef2f2':'var(--surface)';
      var status=d.submitted?'✅ Submitted':overdue?'❌ Overdue':'⏳ Pending';
      var statusCol=d.submitted?'#16a34a':overdue?'#c0291d':'#c9870a';
      return '<div style="display:flex;align-items:center;flex-wrap:wrap;gap:10px;padding:12px 18px;border-bottom:1px solid var(--border-soft);background:'+bg+'">'
        +'<div style="flex:1;min-width:180px">'
        +'<div style="font-size:13.5px;font-weight:700">'+esc(d.subject)+'</div>'
        +'<div style="font-size:11.5px;color:var(--muted)">'+esc(d.exam)+' &nbsp;·&nbsp; '+esc(d.teacher)+'</div>'
        +'<div style="font-size:11px;color:var(--muted2);margin-top:2px">Deadline: '+emDateLabel(d.deadline)+(d.submittedOn?' &nbsp;·&nbsp; Submitted: '+emDateLabel(d.submittedOn):'')+'</div>'
        +'<div style="margin-top:6px;display:flex;gap:6px">'
        +(d.hardCopy?'<span style="font-size:10px;background:#e0e8f9;color:var(--accent);border-radius:10px;padding:2px 8px;font-weight:700">📄 Hard Copy</span>':'')
        +(d.softCopy?'<span style="font-size:10px;background:#f0fdf4;color:#16a34a;border-radius:10px;padding:2px 8px;font-weight:700">💾 Soft Copy</span>':'')
        +(d.remarks?'<span style="font-size:10px;background:var(--surface2);color:var(--muted);border-radius:10px;padding:2px 8px">📝 '+esc(d.remarks)+'</span>':'')
        +'</div></div>'
        +'<div style="display:flex;align-items:center;gap:10px;flex-shrink:0">'
        +'<span style="padding:4px 12px;border-radius:12px;background:'+statusCol+'1a;color:'+statusCol+';font-size:12px;font-weight:700">'+status+'</span>'
        +(isAdmin?'<button onclick="emToggleQSSubmitted(\''+d.id+'\')" style="padding:5px 12px;border-radius:8px;border:1px solid var(--border);background:var(--surface2);color:var(--muted);font-size:11px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">'+(d.submitted?'↩ Undo':'✅ Mark Done')+'</button>':'')
        +(isAdmin?'<button onclick="emEditId=\''+d.id+'\';emShowForm=true;navigate(\'exammanager\')" style="padding:5px 12px;border-radius:8px;border:1px solid var(--accent);background:var(--accent-light);color:var(--accent);font-size:11px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">Edit</button>':'')
        +(isAdmin?'<button onclick="emDeleteQS(\''+d.id+'\')" style="padding:5px 12px;border-radius:8px;border:1px solid #fca5a5;background:#fef2f2;color:#c0291d;font-size:11px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">✕</button>':'')
        +'</div></div>';
    }).join('') : '<div style="padding:40px;text-align:center;color:var(--muted)"><div style="font-size:40px;margin-bottom:12px">📬</div><div style="font-size:15px;font-weight:700">No question submission records yet</div></div>';
    pageContent=statsQS
      +(isAdmin?'<div style="display:flex;gap:8px;margin-bottom:16px"><button onclick="emShowForm=!emShowForm;emEditId=null;navigate(\'exammanager\')" class="btn btn-primary" style="font-size:13px">➕ Add Record</button><button onclick="emPrintQSTracker()" class="btn btn-outline" style="font-size:13px">🖨 Print Tracker</button></div>':'')
      +formHTML
      +'<div class="card"><div class="card-head"><span class="card-title">📬 Question Paper Submission Tracker</span><span style="font-size:12px;color:var(--muted)">'+qsData.length+' record(s)</span></div>'
      +'<div>'+qsRows+'</div></div>';
  }
  
  else if(emActiveTab==='rooms'){
    var roomData=emGetRooms();
    var formHTML='';
    if(emShowForm&&isAdmin){
      var rEdit=emEditId?roomData.find(function(d){ return d.id===emEditId; }):null;
      formHTML='<div class="card" style="margin-bottom:20px;border:2px solid var(--accent)">'
        +'<div class="card-head" style="background:linear-gradient(135deg,#e0e8f9,#f0f4ff)"><span class="card-title">'+(emEditId?'✏️ Edit':'➕ Add')+' Exam Room</span></div>'
        +'<div style="padding:20px;display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px">'
        +'<div class="form-group" style="margin:0"><label>Room Name *</label><input id="em-room-name" class="filter-sel" placeholder="e.g. Hall A, Room 101" value="'+(rEdit?esc(rEdit.name):'')+'"/></div>'
        +'<div class="form-group" style="margin:0"><label>Capacity</label><input id="em-room-cap" type="number" class="filter-sel" min="1" max="300" value="'+(rEdit?rEdit.cap:'30')+'"/></div>'
        +'<div class="form-group" style="margin:0"><label>Floor / Block</label><input id="em-room-floor" class="filter-sel" placeholder="e.g. Ground Floor, Block B" value="'+(rEdit?esc(rEdit.floor||''):'')+'"/></div>'
        +'<div class="form-group" style="margin:0"><label>Room Type</label><select id="em-room-type" class="filter-sel">'
          +['Classroom','Hall','Lab','Auditorium','Other'].map(function(t){ return '<option'+(rEdit&&rEdit.type===t?' selected':(!rEdit&&t==='Classroom')?' selected':'')+'>'+t+'</option>'; }).join('')
        +'</select></div>'
        +'<div class="form-group" style="margin:0;grid-column:1/-1"><label>Remarks</label><input id="em-room-remarks" class="filter-sel" placeholder="Any special notes" value="'+(rEdit?esc(rEdit.remarks||''):'')+'"/></div>'
        +'<div style="grid-column:1/-1;display:flex;gap:10px"><button onclick="emSaveRoomForm()" class="btn btn-primary" style="font-size:13px;padding:10px 24px">💾 Save Room</button><button onclick="emShowForm=false;emEditId=null;navigate(\'exammanager\')" class="btn btn-outline" style="font-size:13px">Cancel</button></div>'
        +'</div></div>';
    }
    // Quick inline add -- always visible for admins, no toggle needed
    var quickAdd = isAdmin && !emShowForm
      ? '<div style="background:var(--surface2);border:1.5px solid var(--border-soft);border-radius:var(--radius);padding:16px 20px;margin-bottom:16px">'
          +'<div style="font-size:11px;font-weight:800;color:var(--accent);text-transform:uppercase;letter-spacing:.1em;margin-bottom:12px">➕ Quick Add Room</div>'
          +'<div style="display:flex;flex-wrap:wrap;align-items:flex-end;gap:12px">'
            +'<div style="flex:2;min-width:130px"><label style="font-size:11px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">Room Name *</label><input id="em-qr-name" class="filter-sel" placeholder="e.g. Hall A" style="width:100%"/></div>'
            +'<div style="flex:1;min-width:80px"><label style="font-size:11px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">Capacity</label><input id="em-qr-cap" type="number" class="filter-sel" value="30" min="1" max="500" style="width:100%"/></div>'
            +'<div style="flex:1;min-width:110px"><label style="font-size:11px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">Type</label><select id="em-qr-type" class="filter-sel" style="width:100%"><option>Classroom</option><option>Hall</option><option>Lab</option><option>Auditorium</option><option>Other</option></select></div>'
            +'<div style="flex:1;min-width:100px"><label style="font-size:11px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">Floor / Block</label><input id="em-qr-floor" class="filter-sel" placeholder="e.g. Ground" style="width:100%"/></div>'
            +'<button onclick="emQuickAddRoom()" class="btn btn-primary" style="font-size:13px;padding:10px 22px;white-space:nowrap;flex-shrink:0">+ Add</button>'
          +'</div>'
        +'</div>'
      : '';
    var totalCap=roomData.reduce(function(a,r){ return a+r.cap; },0);
    var roomStats='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;margin-bottom:16px">'
      +'<div class="stat-card" style="--c:#1433a8"><div class="stat-label">Total Rooms</div><div class="stat-val">'+roomData.length+'</div><div class="stat-sub">Configured</div></div>'
      +'<div class="stat-card" style="--c:#16a34a"><div class="stat-label">Total Capacity</div><div class="stat-val">'+totalCap+'</div><div class="stat-sub">Seats available</div></div>'
      +'<div class="stat-card" style="--c:#7133d4"><div class="stat-label">Halls</div><div class="stat-val">'+roomData.filter(function(r){return r.type==='Hall';}).length+'</div><div class="stat-sub">Exam halls</div></div>'
      +'<div class="stat-card" style="--c:#c9870a"><div class="stat-label">Classrooms</div><div class="stat-val">'+roomData.filter(function(r){return r.type==='Classroom';}).length+'</div><div class="stat-sub">As exam venues</div></div>'
    +'</div>';
    var roomCards = roomData.length
      ? '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px;padding:20px">'
          +roomData.map(function(r){
            var typeIcon=r.type==='Hall'?'🏛️':r.type==='Lab'?'🔬':r.type==='Auditorium'?'🎭':r.type==='Other'?'🏢':'🏫';
            var typeColor=r.type==='Hall'?'#7133d4':r.type==='Lab'?'#0891b2':r.type==='Auditorium'?'#c9870a':'#1433a8';
            var typeBg=r.type==='Hall'?'#f3eefe':r.type==='Lab'?'#e0f4fb':r.type==='Auditorium'?'#fef3dc':'#e0e8f9';
            return '<div style="background:var(--surface);border:1.5px solid var(--border-soft);border-radius:var(--radius);padding:18px;box-shadow:var(--shadow-xs)">'
              +'<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px">'
                +'<div style="width:44px;height:44px;border-radius:12px;background:'+typeBg+';display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">'+typeIcon+'</div>'
                +'<div style="flex:1;min-width:0">'
                  +'<div style="font-size:15px;font-weight:800;color:var(--text)">'+esc(r.name)+'</div>'
                  +'<div style="font-size:11px;margin-top:3px">'
                    +'<span style="padding:2px 8px;border-radius:10px;background:'+typeBg+';color:'+typeColor+';font-weight:700;font-size:10px">'+esc(r.type)+'</span>'
                    +(r.floor?' <span style="color:var(--muted);font-size:10px">'+esc(r.floor)+'</span>':'')
                  +'</div>'
                +'</div>'
              +'</div>'
              +'<div style="display:flex;align-items:baseline;gap:6px;margin-bottom:6px">'
                +'<span style="font-size:28px;font-weight:800;color:var(--accent)">'+r.cap+'</span>'
                +'<span style="font-size:12px;color:var(--muted);font-weight:600">seats</span>'
              +'</div>'
              +'<div style="background:var(--surface3);border-radius:4px;height:5px;margin-bottom:12px;overflow:hidden">'
                +'<div style="height:100%;border-radius:4px;background:'+typeColor+';width:'+Math.min(100,Math.round(r.cap/50*100))+'%"></div>'
              +'</div>'
              +(r.remarks?'<div style="font-size:11px;color:var(--muted2);margin-bottom:12px;font-style:italic;border-left:3px solid var(--border);padding-left:8px">'+esc(r.remarks)+'</div>':'')
              +(isAdmin
                ?'<div style="display:flex;gap:6px">'
                  +'<button onclick="emEditId=\''+parseInt(r.id,10)+'\';emShowForm=true;navigate(\'exammanager\')" style="flex:1;padding:7px 10px;border-radius:8px;border:1.5px solid var(--accent);background:var(--accent-light);color:var(--accent);font-size:12px;font-weight:700;cursor:pointer">✏️ Edit</button>'
                  +'<button onclick="emDeleteRoom(\''+parseInt(r.id,10)+'\')" style="padding:7px 12px;border-radius:8px;border:1.5px solid #fca5a5;background:#fef2f2;color:#c0291d;font-size:12px;font-weight:700;cursor:pointer">🗑</button>'
                +'</div>'
                :'')
            +'</div>';
          }).join('')
        +'</div>'
      : '<div style="padding:48px;text-align:center;color:var(--muted)">'
          +'<div style="font-size:48px;margin-bottom:14px">🏫</div>'
          +'<div style="font-size:16px;font-weight:700;margin-bottom:8px">No rooms configured yet</div>'
          +'<div style="font-size:13px;max-width:300px;margin:0 auto;line-height:1.7">Use the quick-add form above to add exam rooms. Rooms appear in the Seat Chart builder and Invigilator assignment.</div>'
        +'</div>';
    pageContent = roomStats + quickAdd + formHTML
      +'<div class="card">'
        +'<div class="card-head">'
          +'<span class="card-title">🏫 Exam Rooms</span>'
          +'<div style="display:flex;align-items:center;gap:10px">'
            +'<span style="font-size:12px;color:var(--muted)">'+roomData.length+' room(s) · '+totalCap+' seats</span>'
            +(isAdmin?'<button onclick="emShowForm=!emShowForm;emEditId=null;navigate(\'exammanager\')" class="btn btn-outline" style="font-size:12px;padding:5px 14px">'+(emShowForm?'✕ Close':'📋 Full Form')+'</button>':'')
          +'</div>'
        +'</div>'
        +roomCards
      +'</div>';
  }
  
  else if(emActiveTab==='checklist'){
    var clData=emGetChecklist();
    var formHTML='';
    if(emShowForm&&isAdmin){
      formHTML='<div class="card" style="margin-bottom:20px">'
        +'<div class="card-head"><span class="card-title">➕ Add Checklist Item</span></div>'
        +'<div style="padding:20px;display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px">'
        +'<div class="form-group" style="margin:0;grid-column:span 2"><label>Item Name *</label><input id="em-cl-item" class="filter-sel" placeholder="e.g. Answer sheets, Pens, Hall tickets…"/></div>'
        +'<div class="form-group" style="margin:0"><label>Quantity</label><input id="em-cl-qty" type="number" class="filter-sel" min="1" value="1"/></div>'
        +'<div class="form-group" style="margin:0"><label>Category</label><select id="em-cl-cat" class="filter-sel"><option>Stationery</option><option>Question Papers</option><option>Hall Tickets</option><option>Equipment</option><option>Documents</option><option>Other</option></select></div>'
        +'<div style="grid-column:1/-1;display:flex;gap:10px"><button onclick="emSaveChecklistItem()" class="btn btn-primary" style="font-size:13px;padding:10px 24px">➕ Add Item</button><button onclick="emShowForm=false;navigate(\'exammanager\')" class="btn btn-outline" style="font-size:13px">Cancel</button></div>'
        +'</div></div>';
    }
    
    var cats={};
    clData.forEach(function(d){
      if(!cats[d.cat])cats[d.cat]=[];
      cats[d.cat].push(d);
    });
    var doneCount=clData.filter(function(d){ return d.done; }).length;
    var clStats='<div style="display:flex;gap:12px;margin-bottom:18px;flex-wrap:wrap">'
      +'<div style="flex:1;min-width:100px;background:var(--surface);border:1px solid var(--border-soft);border-radius:var(--radius-sm);padding:12px 16px;text-align:center"><div style="font-size:22px;font-weight:800;color:var(--accent)">'+clData.length+'</div><div style="font-size:11px;color:var(--muted);font-weight:600">Total Items</div></div>'
      +'<div style="flex:1;min-width:100px;background:#f0fdf4;border:1px solid #86efac;border-radius:var(--radius-sm);padding:12px 16px;text-align:center"><div style="font-size:22px;font-weight:800;color:#16a34a">'+doneCount+'</div><div style="font-size:11px;color:#16a34a;font-weight:600">Ready</div></div>'
      +'<div style="flex:1;min-width:100px;background:#fefce8;border:1px solid #fde68a;border-radius:var(--radius-sm);padding:12px 16px;text-align:center"><div style="font-size:22px;font-weight:800;color:#c9870a">'+(clData.length-doneCount)+'</div><div style="font-size:11px;color:#c9870a;font-weight:600">Pending</div></div>'
      +'</div>';
    
    var defaultItems=[
      {cat:'Question Papers',items:['Question papers (set-wise)','Answer booklets','Extra loose sheets']},
      {cat:'Hall Tickets',items:['Student hall tickets','Attendance register']},
      {cat:'Stationery',items:['Blue/Black pens','Pencils & erasers','Rulers, geometry sets','Pencil boxes (for invigilator)']},
      {cat:'Documents',items:['Invigilator duty chart','Seating plan','Exam timetable','Absentee report form']},
      {cat:'Equipment',items:['Wall clock','Sealing wax/tape','Stapler & pins']}
    ];
    var defaultNote=clData.length?'':'<div style="padding:16px 20px;background:var(--accent-light);border-radius:var(--radius-sm);margin-bottom:16px;font-size:13px;color:var(--accent)">'
      +'<strong>💡 Suggested items to add:</strong> '
      +defaultItems.map(function(g){ return g.items.join(', '); }).join(', ')
      +'</div>';
    var clBody=Object.keys(cats).length?Object.keys(cats).map(function(cat){
      var items=cats[cat];
      return '<div style="margin-bottom:16px">'
        +'<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);padding:8px 20px;background:var(--surface2);border-bottom:1px solid var(--border-soft)">'+esc(cat)+'</div>'
        +items.map(function(d){
          return '<div style="display:flex;align-items:center;gap:12px;padding:11px 20px;border-bottom:1px solid var(--border-soft);background:'+(d.done?'#f0fdf4':'var(--surface)')+'">'
            +'<button onclick="emToggleChecklist(\''+d.id+'\')" style="width:22px;height:22px;border-radius:5px;border:1.5px solid '+(d.done?'#16a34a':'var(--border)')+';background:'+(d.done?'#16a34a':'var(--surface)')+';color:#fff;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:\'DM Sans\',sans-serif">'+(d.done?'✓':'')+'</button>'
            +'<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:'+(d.done?'400':'600')+';text-decoration:'+(d.done?'line-through':'none')+';color:'+(d.done?'var(--muted)':'var(--text)')+'">'+esc(d.name)+'</div>'
            +(d.qty>1?'<div style="font-size:11px;color:var(--muted2)">Qty: '+d.qty+'</div>':'')+'</div>'
            +(isAdmin?'<button onclick="emDeleteChecklistItem(\''+d.id+'\')" style="padding:3px 8px;border-radius:6px;border:1px solid #fca5a5;background:#fef2f2;color:#c0291d;font-size:11px;cursor:pointer;font-family:\'DM Sans\',sans-serif">✕</button>':'')
            +'</div>';
        }).join('')+'</div>';
    }).join('')
    :'<div style="padding:40px;text-align:center;color:var(--muted)"><div style="font-size:40px;margin-bottom:12px">✅</div><div style="font-size:15px;font-weight:700">Checklist is empty</div><div style="font-size:13px;margin-top:6px">Add items to track exam materials and resources</div></div>';
    pageContent=clStats
      +(isAdmin?'<div style="margin-bottom:16px"><button onclick="emShowForm=!emShowForm;navigate(\'exammanager\')" class="btn btn-primary" style="font-size:13px">➕ Add Item</button></div>':'')
      +formHTML+defaultNote
      +'<div class="card"><div class="card-head"><span class="card-title">✅ Exam Material Checklist</span><span style="font-size:12px;color:var(--muted)">'+doneCount+'/'+clData.length+' ready</span></div>'
      +clBody+'</div>';
  }
  return emModeBar + '<div class="page-header">'
    +'<div class="page-header-eyebrow">GNSI -- ACADEMIC</div>'
    +'<div class="page-header-title">🏛️ Exam Manager</div>'
    +'<div class="page-header-sub">Seat Chart &nbsp;·&nbsp; Invigilator Duty &nbsp;·&nbsp; Attendance &nbsp;·&nbsp; Question Submission &nbsp;·&nbsp; Room Allocation &nbsp;·&nbsp; Material Checklist</div>'
    +'</div>'
    +tabBar+pageContent;
} catch(e){ (void 0); return '<div class="page-header"><div class="page-header-title">Exam Manager</div></div><div class="card"><div style="padding:30px;color:#c0291d">⚠️ Error loading Exam Manager: '+e.message+'</div></div>'; }
}
// ══════════════════════════════════════════════════════════════════════════════
// NTS MONITOR -- Non-Teaching Staff Duty & Task Tracking  (v30)
// ══════════════════════════════════════════════════════════════════════════════
var _ntsTab         = 'dashboard';
var _ntsCategory    = 'All';
var _ntsTaskFilter  = 'All';
var _ntsShowForm    = false;
var _ntsEditTaskId  = null;
var _ntsShowDutyForm= false;
// -- Persistence helpers ------------------------------------------------------
function ntsLoad(key){ try{ var s=localStorage.getItem('gnsi_nts_'+key); return s?JSON.parse(s):null; }catch(e){ return null; } }
function ntsSave(key,val){ try{ localStorage.setItem('gnsi_nts_'+key,JSON.stringify(val));if(typeof gnsiKVPush==='function')gnsiKVPush('gnsi_nts_'+key,val); }catch(e){} }
function ntsGetTasks(){
  return ntsLoad('tasks') || [];
}
function ntsSaveTasks(arr){ ntsSave('tasks',arr); }
function ntsGetDutyLog(){
  return ntsLoad('dutylog') || [];
}
function ntsSaveDutyLog(arr){ ntsSave('dutylog',arr); }
function ntsGetNotes(){
  return ntsLoad('notes') || [];
}
function ntsSaveNotes(arr){ ntsSave('notes',arr); }
// -- Staff catalogue ----------------------------------------------------------
var NTS_CATEGORIES = [
  { id:'it',         label:'IT Staff',        icon:'💻', color:'#1433a8', bg:'#e0e8f9' },
  { id:'counter',    label:'Counter Staff',   icon:'🧾', color:'#7133d4', bg:'#f3eefe' },
  { id:'receptionist',label:'Receptionist',  icon:'📞', color:'#0891b2', bg:'#e0f4fb' },
  { id:'cook',       label:'Cook',            icon:'🍳', color:'#c9870a', bg:'#fef3dc' },
  { id:'sweeper',    label:'Sweeper',         icon:'🧹', color:'#157a47', bg:'#dcf5e9' },
  { id:'chowkidar',  label:'Chowkidar',       icon:'🔐', color:'#c0291d', bg:'#fdecea' }
];
// Map existing staff to NTS categories
function ntsGetStaffByCat(catId){
  var roleMap = {
    it:['Computer Staff','IT'],
    counter:['Counter'],
    receptionist:['Receptionist'],
    cook:['Cook'],
    sweeper:['Sweeper','Cleaner'],
    chowkidar:['Chowkidar','Security','Chowkider']
  };
  var keys = roleMap[catId] || [];
  return (typeof staff !== 'undefined' ? staff : []).filter(function(s){
    return keys.some(function(k){
      return (s.role||'').toLowerCase().includes(k.toLowerCase()) ||
             (s.dept||'').toLowerCase().includes(k.toLowerCase());
    });
  });
}
function ntsAllNTSStaff(){
  var seen={};
  var result=[];
  NTS_CATEGORIES.forEach(function(cat){
    ntsGetStaffByCat(cat.id).forEach(function(s){
      if(!seen[s.id]){ seen[s.id]=true; result.push(s); }
    });
  });
  return result;
}
function ntsCatForStaff(staffId){
  for(var i=0;i<NTS_CATEGORIES.length;i++){
    var c=NTS_CATEGORIES[i];
    var members=ntsGetStaffByCat(c.id);
    if(members.some(function(s){ return s.id===staffId; })) return c;
  }
  return NTS_CATEGORIES[0];
}
function ntsToday(){ var d=new Date(); return d.toISOString().slice(0,10); }
function ntsNow(){ return new Date().toISOString(); }
function ntsDateLabel(iso){
  if(!iso) return '--';
  var d=new Date(iso); var today=new Date();
  var diff=Math.round((d-today)/(1000*60*60*24));
  if(diff===0) return 'Today';
  if(diff===-1) return 'Yesterday';
  if(diff===1) return 'Tomorrow';
  return d.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
}
function ntsTaskId(){ return 'tsk_'+Date.now()+'_'+Math.random().toString(36).slice(2,6); }
function ntsDutyId(){ return 'dut_'+Date.now()+'_'+Math.random().toString(36).slice(2,6); }
// -- Task CRUD -----------------------------------------------------------------
function ntsSaveTaskForm(){
  var title=(document.getElementById('nts-t-title')||{}).value||'';
  if(!title.trim()){ alert('Task title is required.'); return; }
  var tasks=ntsGetTasks();
  var now=ntsNow();
  if(_ntsEditTaskId){
    tasks=tasks.map(function(t){
      if(t.id!==_ntsEditTaskId) return t;
      return Object.assign({},t,{
        title:title.trim(),
        category:(document.getElementById('nts-t-cat')||{}).value||'it',
        assignedTo:(document.getElementById('nts-t-assign')||{}).value||'',
        priority:(document.getElementById('nts-t-pri')||{}).value||'Medium',
        due:(document.getElementById('nts-t-due')||{}).value||'',
        repeat:(document.getElementById('nts-t-repeat')||{}).value||'None',
        notes:(document.getElementById('nts-t-notes')||{}).value||'',
        updatedAt:now
      });
    });
  } else {
    tasks.push({
      id:ntsTaskId(),
      title:title.trim(),
      category:(document.getElementById('nts-t-cat')||{}).value||'it',
      assignedTo:(document.getElementById('nts-t-assign')||{}).value||'',
      priority:(document.getElementById('nts-t-pri')||{}).value||'Medium',
      due:(document.getElementById('nts-t-due')||{}).value||'',
      repeat:(document.getElementById('nts-t-repeat')||{}).value||'None',
      notes:(document.getElementById('nts-t-notes')||{}).value||'',
      status:'Pending',
      progress:0,
      createdAt:now,
      updatedAt:now,
      completedAt:null,
      history:[]
    });
  }
  ntsSaveTasks(tasks);
  _ntsShowForm=false; _ntsEditTaskId=null;
  navigate();
}
function ntsToggleTaskStatus(id){
  var tasks=ntsGetTasks();
  var now=ntsNow();
  tasks=tasks.map(function(t){
    if(t.id!==id)return t;
    var next=t.status==='Done'?'Pending':'Done';
    var hist=(t.history||[]).concat([{time:now,action:next==='Done'?'Marked Done':'Reopened',by:(currentUser?currentUser.name:'Admin')}]);
    return Object.assign({},t,{status:next,completedAt:next==='Done'?now:null,progress:next==='Done'?100:t.progress,history:hist,updatedAt:now});
  });
  ntsSaveTasks(tasks);
  navigate();
}
function ntsSetProgress(id,val){
  var tasks=ntsGetTasks();
  var now=ntsNow();
  tasks=tasks.map(function(t){
    if(t.id!==id)return t;
    var pct=Math.max(0,Math.min(100,parseInt(val)||0));
    var status=pct===100?'Done':pct>0?'In Progress':'Pending';
    var hist=(t.history||[]).concat([{time:now,action:'Progress: '+pct+'%',by:(currentUser?currentUser.name:'Admin')}]);
    return Object.assign({},t,{progress:pct,status:status,completedAt:status==='Done'?now:null,history:hist,updatedAt:now});
  });
  ntsSaveTasks(tasks);
  navigate();
}
function ntsDeleteTask(id){
  if(!confirm('Delete this task?'))return;
  ntsSaveTasks(ntsGetTasks().filter(function(t){return t.id!==id;}));
  navigate();
}
// -- Duty Log CRUD -------------------------------------------------------------
function ntsSaveDutyForm(){
  var staffId=parseInt((document.getElementById('nts-d-staff')||{}).value||'0');
  var status=(document.getElementById('nts-d-status')||{}).value||'Present';
  var date=(document.getElementById('nts-d-date')||{}).value||ntsToday();
  var remarks=(document.getElementById('nts-d-remarks')||{}).value||'';
  if(!staffId){ alert('Select a staff member.'); return; }
  var log=ntsGetDutyLog();
  // Remove duplicate for same staff+date
  log=log.filter(function(l){ return !(l.staffId===staffId && l.date===date); });
  log.push({ id:ntsDutyId(), staffId:staffId, date:date, status:status, remarks:remarks, markedAt:ntsNow(), markedBy:(currentUser?currentUser.name:'Admin') });
  ntsSaveDutyLog(log);
  _ntsShowDutyForm=false;
  navigate();
}
function ntsQuickDuty(staffId, status){
  var log=ntsGetDutyLog();
  var today=ntsToday();
  log=log.filter(function(l){ return !(l.staffId===staffId && l.date===today); });
  log.push({ id:ntsDutyId(), staffId:staffId, date:today, status:status, remarks:'', markedAt:ntsNow(), markedBy:(currentUser?currentUser.name:'Admin') });
  ntsSaveDutyLog(log);
  navigate();
}
function ntsPriColor(p){
  return p==='Critical'?'#c0291d':p==='High'?'#c9870a':p==='Medium'?'#1433a8':'#157a47';
}
function ntsPriBg(p){
  return p==='Critical'?'#fdecea':p==='High'?'#fef3dc':p==='Medium'?'#e0e8f9':'#dcf5e9';
}
function ntsStatusColor(s){
  return s==='Done'?'#157a47':s==='In Progress'?'#c9870a':'#c0291d';
}
function ntsStatusBg(s){
  return s==='Done'?'#dcf5e9':s==='In Progress'?'#fef3dc':'#fdecea';
}
// -- MAIN RENDER --------------------------------------------------------------
function renderNTSMonitor(){
