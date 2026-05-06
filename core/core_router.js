/* ═══════════════════════════════════════════════════════════════════════════
   GNSI PORTAL — core/router.js
   Navigation, page rendering, and the mapping of page IDs to render functions.

   DEPENDS ON: core/utils.js, core/state.js (load those first)
   ═══════════════════════════════════════════════════════════════════════════ */

'use strict';

/* ── NAVIGATE ────────────────────────────────────────────────────────────── */
/* Change the active page. Checks permissions first.
   Usage: navigate('fees')  or  navigate('staff') */
function navigate(page) {
  if (!canAccess(page)) {
    showToast('🔒 Access denied: ' + page, '#dc2626');
    return;
  }
  activePage = page;
  _navAddRecent(page);

  /* Clear search boxes on navigation */
  var inp = document.getElementById('nav-search-input');
  if (inp && inp.value) { inp.value = ''; _navSearchQuery = ''; }

  /* Reset UI flags */
  showAddStaff = false; showAddStudent = false; showAddNotice = false;
  staffSearch  = '';    staffDept      = 'All';  studentSearch = '';

  /* Update browser URL so the back button works */
  try { history.pushState({ page: page }, '', '#' + page); } catch (e) {}

  buildNav();

  var pg = (typeof PAGES !== 'undefined' ? PAGES : []).find(function (p) { return p.id === page; });
  var titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = pg ? pg.label : '';

  render();
}

/* ── RECENT PAGES TRACKER ───────────────────────────────────────────────── */
var _navRecentPages = [];
var _navSearchQuery = '';

function _navAddRecent(pageId) {
  _navRecentPages = _navRecentPages.filter(function (p) { return p !== pageId; });
  _navRecentPages.unshift(pageId);
  if (_navRecentPages.length > 5) _navRecentPages = _navRecentPages.slice(0, 5);
}

/* ── PAGE MAP ────────────────────────────────────────────────────────────── */
/* Maps page ID strings to their render functions.
   When you create a new module file, add its render function here. */
var _PAGE_MAP = null;

function _getPageMap() {
  if (_PAGE_MAP) return _PAGE_MAP;
  _PAGE_MAP = {
    managementchecklist: function () { return (typeof renderManagementchecklist === 'function') ? renderManagementchecklist() : '<div>Management Checklist loading...</div>'; },
    /* ── Core ── */
    dashboard:        function () { return (typeof renderDashboard    === 'function') ? renderDashboard()    : '<div>Dashboard loading…</div>'; },
    admincentre:      function () { return (typeof renderAdminCentre  === 'function') ? renderAdminCentre()  : '<div>Admin Centre loading…</div>'; },

    /* ── People ── */
    staff:            function () { return (typeof renderStaff        === 'function') ? renderStaff()        : '<div>Staff loading…</div>'; },
    staffbiodata:     function () { return (typeof renderStaffBiodata === 'function') ? renderStaffBiodata() : '<div>Biodata loading…</div>'; },
    staffsalary:      function () { return (typeof renderStaffSalary  === 'function') ? renderStaffSalary()  : '<div>Salary loading…</div>'; },
    students:         function () { return (typeof renderStudents     === 'function') ? renderStudents()     : '<div>Students loading…</div>'; },
    admissions:       function () { return (typeof renderAdmissions   === 'function') ? renderAdmissions()   : '<div>Admissions loading…</div>'; },
    sessions:         function () { return (typeof renderSessions     === 'function') ? renderSessions()     : '<div>Sessions loading…</div>'; },
    classes:          function () { return (typeof renderClasses      === 'function') ? renderClasses()      : '<div>Classes loading…</div>'; },

    /* ── Academics ── */
    attendance:       function () { return (typeof renderAttendance   === 'function') ? renderAttendance()   : '<div>Attendance loading…</div>'; },
    timetable:        function () { return (typeof renderTimetable    === 'function') ? renderTimetable()    : '<div>Timetable loading…</div>'; },
    exam:             function () { return (typeof renderExamHub      === 'function') ? renderExamHub()      : '<div>Exams loading…</div>'; },
    exammanager:      function () { return (typeof renderExamManager  === 'function') ? renderExamManager()  : '<div>Exam Manager loading…</div>'; },
    examresultshub:   function () { return (typeof renderExamResultsHub === 'function') ? renderExamResultsHub() : '<div>Results Hub loading…</div>'; },
    teaching:         function () { return (typeof renderTeachingPage === 'function') ? renderTeachingPage() : '<div>Teaching loading…</div>'; },
    lessonbridge:     function () { return (typeof renderLessonBridge === 'function') ? renderLessonBridge() : '<div>Lesson Bridge loading…</div>'; },
    doubttt:          function () { return (typeof renderDoubtTT      === 'function') ? renderDoubtTT()      : '<div>Doubt TT loading…</div>'; },
    diary:            function () { return (typeof renderDiary        === 'function') ? renderDiary()        : '<div>Diary loading…</div>'; },

    /* ── Finance ── */
    accounts:         function () { return (typeof renderAccounts     === 'function') ? renderAccounts()     : '<div>Accounts loading…</div>'; },
    fees:             function () { return (typeof renderUnifiedFeeHub === 'function') ? renderUnifiedFeeHub() : (typeof renderFees === 'function' ? renderFees() : '<div>Fees loading…</div>'); },
    payments:         function () { return (typeof renderPayments     === 'function') ? renderPayments()     : '<div>Payments loading…</div>'; },
    studentfee:       function () { return (typeof renderStudentFeeAssignment === 'function') ? renderStudentFeeAssignment() : '<div>Student Fee loading…</div>'; },

    /* ── Hostel ── */
    boarder:          function () { return (typeof renderBoarder      === 'function') ? renderBoarder()      : '<div>Boarder loading…</div>'; },
    hostel:           function () { return (typeof renderHostel       === 'function') ? renderHostel()       : '<div>Hostel loading…</div>'; },
    kitchen:          function () { return (typeof renderKitchen      === 'function') ? renderKitchen()      : '<div>Kitchen loading…</div>'; },
    housemaster:      function () { return (typeof renderHouseMaster  === 'function') ? renderHouseMaster()  : '<div>House Master loading…</div>'; },
    house:            function () { return (typeof renderHouse        === 'function') ? renderHouse()        : '<div>House loading…</div>'; },
    nightduty:        function () { return (typeof renderNightDuty    === 'function') ? renderNightDuty()    : '<div>Night Duty loading…</div>'; },
    sickbay:          function () { return (typeof renderSickBay      === 'function') ? renderSickBay()      : '<div>Sick Bay loading…</div>'; },
    discipline:       function () { return (typeof renderDiscipline   === 'function') ? renderDiscipline()   : '<div>Discipline loading…</div>'; },

    /* ── HR & Leave ── */
    leave:            function () { return (typeof renderLeave        === 'function') ? renderLeave()        : '<div>Leave loading…</div>'; },
    substitute:       function () { return (typeof renderSubstitute   === 'function') ? renderSubstitute()   : '<div>Substitute loading…</div>'; },
    appraisal:        function () { return (typeof renderAppraisal    === 'function') ? renderAppraisal()    : '<div>Appraisal loading…</div>'; },
    grievance:        function () { return (typeof renderGrievance    === 'function') ? renderGrievance()    : '<div>Grievance loading…</div>'; },
    dutyhours:        function () { return (typeof renderDutyHours    === 'function') ? renderDutyHours()    : '<div>Duty Hours loading…</div>'; },
    periodsalary:     function () { return (typeof renderPeriodSalary === 'function') ? renderPeriodSalary() : '<div>Period Salary loading…</div>'; },

    /* ── Communication ── */
    notices:          function () { return (typeof renderNotices      === 'function') ? renderNotices()      : '<div>Notices loading…</div>'; },
    reception:        function () { return (typeof renderReception    === 'function') ? renderReception()    : '<div>Reception loading…</div>'; },
    parent:           function () { return (typeof renderParent       === 'function') ? renderParent()       : '<div>Parent loading…</div>'; },
    parentfeedback:   function () { return (typeof renderParentFeedbackAdmin === 'function') ? renderParentFeedbackAdmin() : '<div>Feedback loading…</div>'; },
    gnsi_social:      function () { return (typeof renderGnsiSocial   === 'function') ? renderGnsiSocial()  : '<div>Social loading…</div>'; },

    /* ── Reports & Documents ── */
    reports:          function () { return (typeof renderReports      === 'function') ? renderReports()      : '<div>Reports loading…</div>'; },
    reportcard:       function () { return (typeof renderReportCard   === 'function') ? renderReportCard()   : '<div>Report Card loading…</div>'; },
    certificate:      function () { return (typeof renderCertificate  === 'function') ? renderCertificate()  : '<div>Certificate loading…</div>'; },
    leaderboard:      function () { return (typeof renderLeaderboard  === 'function') ? renderLeaderboard()  : '<div>Leaderboard loading…</div>'; },
    analytics:        function () { return (typeof renderAnalytics    === 'function') ? renderAnalytics()    : '<div>Analytics loading…</div>'; },

    /* ── System ── */
    settings:         function () { return (typeof renderSettings     === 'function') ? renderSettings()     : '<div>Settings loading…</div>'; },
    sync:             function () { return (typeof renderSync         === 'function') ? renderSync()         : '<div>Sync loading…</div>'; },
    backup:           function () { return (typeof renderBackup       === 'function') ? renderBackup()       : '<div>Backup loading…</div>'; },
    aiassistant:      function () { return (typeof renderAIAssistant  === 'function') ? renderAIAssistant()  : '<div>AI Assistant loading…</div>'; },
    library:          function () { return (typeof renderLibrary      === 'function') ? renderLibrary()      : '<div>Library loading…</div>'; },
    assets:           function () { return (typeof renderAssets       === 'function') ? renderAssets()       : '<div>Assets loading…</div>'; },
    calendar:         function () { return (typeof renderCalendar     === 'function') ? renderCalendar()     : '<div>Calendar loading…</div>'; },
    ptm:              function () { return (typeof renderPTM          === 'function') ? renderPTM()          : '<div>PTM loading…</div>'; },
    scholarship:      function () { return (typeof renderScholarship  === 'function') ? renderScholarship()  : '<div>Scholarship loading…</div>'; },
    unifiedhub:       function () { return (typeof renderUnifiedHub   === 'function') ? renderUnifiedHub()   : '<div>Unified Hub loading…</div>'; },
    coursemanage:     function () { return (typeof renderCourseManagement === 'function') ? renderCourseManagement() : '<div>Course Management loading…</div>'; }
  };
  return _PAGE_MAP;
}

/* ── RENDER DEBOUNCE ─────────────────────────────────────────────────────── */
/* Prevents the page from flickering when many things update at once.
   Collapses multiple render() calls within 150ms into one. */
var _renderTimer   = null;
var _renderPending = false;

function debouncedRender() {
  if (_renderPending) return;
  _renderPending = true;
  requestAnimationFrame(function () { _renderPending = false; render(); });
}

/* ── RENDER ──────────────────────────────────────────────────────────────── */
/* The main render function. Calls the correct render function for activePage
   and swaps the page content in one smooth animation frame. */
function render() {
  var c = document.getElementById('content');
  if (!c) return;

  var _prevPage    = window._gnsiLastRenderedPage;
  var _isNavChange = (_prevPage !== activePage);
  window._gnsiLastRenderedPage = activePage;

  /* Build HTML off-screen to avoid layout flicker */
  var wrap = document.createElement('div');
  wrap.className = 'page';

  var map = _getPageMap();
  try {
    if (activePage !== 'dashboard' && !canAccess(activePage)) {
      wrap.innerHTML = renderAccessDenied ? renderAccessDenied(activePage) : '<div style="padding:40px;text-align:center"><h2>Access Denied</h2></div>';
    } else {
      var renderFn = map[activePage] || map['dashboard'];
      wrap.innerHTML = renderFn();
    }
  } catch (e) {
    console.error('[GNSI Router] Render error on page "' + activePage + '":', e);
    wrap.innerHTML = '<div style="padding:40px;text-align:center">'
      + '<div style="font-size:48px;margin-bottom:16px">⚠️</div>'
      + '<div style="font-family:Playfair Display,serif;font-size:20px;font-weight:700;color:#dc2626;margin-bottom:8px">Page Render Error</div>'
      + '<div style="font-size:13px;color:#64748b;margin-bottom:16px;font-family:JetBrains Mono,monospace">' + esc(e.message) + '</div>'
      + '<button onclick="activePage=\'dashboard\';render()" style="padding:9px 20px;border-radius:9px;background:#1433a8;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer">← Back to Dashboard</button>'
      + '</div>';
  }

  /* Swap DOM in one animation frame */
  requestAnimationFrame(function () {
    if (!_isNavChange) {
      wrap.style.animation = 'none';
      wrap.style.opacity   = '1';
      wrap.style.transform = 'none';
    }
    c.textContent = '';
    c.appendChild(wrap);
    if (_isNavChange) c.scrollTop = 0;

    /* Restore sync status after render wipes the indicator */
    if (window._gnsiLastSyncState && typeof setSyncStatus === 'function') {
      setSyncStatus(window._gnsiLastSyncState);
    }

    /* Mount fee app if on fees page */
    if (activePage === 'fees' && typeof mountFeeApp === 'function') {
      setTimeout(function () { mountFeeApp(); }, 30);
    }
  });
}

/* ── BROWSER BACK/FORWARD BUTTON SUPPORT ─────────────────────────────────── */
window.addEventListener('popstate', function (e) {
  if (e.state && e.state.page) {
    activePage = e.state.page;
    render();
  } else {
    /* Read hash from URL: example.html#staff → page = 'staff' */
    var hash = window.location.hash.replace('#', '');
    if (hash && typeof canAccess === 'function' && canAccess(hash)) {
      activePage = hash;
      render();
    }
  }
});

console.log('[GNSI] core/router.js loaded ✓');
