/* ═══════════════════════════════════════════════════════════════════════════
   GNSI PORTAL — core/state.js
   All global state variables — the shared data that every module reads.

   RULE: Only this file declares these variables.
         Modules READ from these. They do not re-declare them.

   DEPENDS ON: nothing (load this second, after utils.js)
   ═══════════════════════════════════════════════════════════════════════════ */

'use strict';

/* ── CORE DATA ARRAYS ───────────────────────────────────────────────────── */
/* These are filled by loadFromSupabase() after login.
   Every module that reads staff or students reads from these arrays. */
var staff      = [];
var students   = [];
var notices    = [];
var attendance = {};
var classes    = [];

/* ── NAVIGATION STATE ───────────────────────────────────────────────────── */
var activePage = 'dashboard';

/* ── UI STATE FLAGS ─────────────────────────────────────────────────────── */
var showAddStaff    = false;
var showAddStudent  = false;
var showAddNotice   = false;

/* ── SEARCH / FILTER STATE ──────────────────────────────────────────────── */
var staffSearch   = '';
var staffDept     = 'All';
var studentSearch = '';

/* ── MISC ───────────────────────────────────────────────────────────────── */
var attDate     = new Date().toISOString().split('T')[0];
var nextId      = 400;
var _noticeEditId = null;
var _fbPushDebounce = null;

/* ── CURRENT USER ───────────────────────────────────────────────────────── */
/* Set by doLogin() in auth.js after successful authentication.
   Shape: { id, name, role, staffRole, pages: [] } */
var currentUser = null;

/* ── ROLE DEFINITIONS ───────────────────────────────────────────────────── */
/* Which pages each role can access.
   Admin can see everything.
   Staff can only see the pages listed under 'staff'. */
var ROLE_PAGES = {
  admin:       ['dashboard','admincentre','leaderboard','staff','students','admissions','unifiedhub',
                 'sessions','classes','attendance','notices','accounts','fees','timetable','exam',
                 'exammanager','periodsalary','staffsalary','doubttt','dutyhours','boarder','hostel',
                 'kitchen','housemaster','house','reception','reports','sync','settings','leave',
                 'substitute','appraisal','grievance','diary','certificate','calendar','ptm','library',
                 'assets','nightduty','discipline','sickbay','scholarship','parent','parentfeedback',
                 'backup','payments','aiassistant','lessonbridge'],

  manager:     ['dashboard','leaderboard','staff','students','admissions','unifiedhub','sessions',
                 'classes','attendance','notices','accounts','fees','timetable','exam','exammanager',
                 'periodsalary','staffsalary','doubttt','dutyhours','boarder','hostel','kitchen',
                 'housemaster','house','reception','reports','leave','substitute','grievance','diary',
                 'certificate','calendar','ptm','library','assets','nightduty','discipline','sickbay',
                 'scholarship','payments','aiassistant','lessonbridge'],

  accounts:    ['dashboard','notices','accounts','fees','students','admissions','reception','reports',
                 'scholarship','calendar'],

  teacher:     ['dashboard','notices','attendance','timetable','exam','periodsalary','doubttt',
                 'dutyhours','students','classes','leave','substitute','diary','calendar','ptm',
                 'library','discipline','grievance','aiassistant','lessonbridge','gnsi_social'],

  hostel:      ['dashboard','notices','doubttt','dutyhours','boarder','hostel','kitchen','housemaster',
                 'house','attendance','exam','nightduty','discipline','sickbay','calendar','leave',
                 'aiassistant','lessonbridge','gnsi_social'],

  housemaster: ['dashboard','notices','housemaster','house','hostel','boarder','doubttt','dutyhours',
                 'attendance','exam','aiassistant','lessonbridge','gnsi_social'],

  it:          ['dashboard','notices','reports','sync'],

  reception:   ['dashboard','notices','reception','students','admissions','fees','reports','calendar'],

  staff:       ['dashboard','notices','dutyhours','aiassistant','lessonbridge','gnsi_social','diary','calendar','library']
};

var ROLE_LABELS = {
  admin:       'Administrator',
  manager:     'Manager',
  accounts:    'Accounts',
  teacher:     'Teacher',
  hostel:      'Hostel Staff',
  housemaster: 'House Master',
  it:          'IT Staff',
  reception:   'Receptionist',
  staff:       'Support Staff'
};

/* ── ROLE DETECTION ─────────────────────────────────────────────────────── */
/* Figures out which system role a staff member has based on their job title.
   Called after login when the staff record is loaded from Supabase. */
function detectRole(member) {
  var _ROLE_MAP = { 1: 'admin' }; /* ID 1 is always the founding admin */
  if (_ROLE_MAP[member.id]) return _ROLE_MAP[member.id];
  var role = (member.role || '').toLowerCase();
  var dept = (member.dept || '').toLowerCase();
  if (dept === 'administration' || role.includes('administrator') || role.includes('manager') || role.includes('superintendent') || role.includes('principal')) return 'manager';
  if (dept === 'examination'    || role.includes('exam'))         return 'manager';
  if (dept === 'accounts'       || role.includes('accountant'))   return 'accounts';
  if (dept === 'it'             || role.includes('computer') || role.includes('it staff') || role.startsWith('it ')) return 'it';
  if (role.includes('receptionist') || role.includes('counter'))  return 'reception';
  if (role.includes('house master') || role.includes('house mistress') || role.includes('boarding in charge') || role.includes('assistant house')) return 'housemaster';
  if (dept === 'hostel')                                           return 'hostel';
  if (dept === 'teaching' || role.includes('teacher') || role.includes('teaching') || role.includes('concern') || role.includes('hod')) return 'teacher';
  return 'staff';
}

/* ── RBAC CONVENIENCE HELPERS ───────────────────────────────────────────── */
function _isAdminOrManager() {
  if (!currentUser) return false;
  return currentUser.role === 'admin' || currentUser.role === 'manager';
}
function _isAdminOrAccounts() {
  if (!currentUser) return false;
  return currentUser.role === 'admin' || currentUser.role === 'accounts';
}
/* Keep old name for backward compatibility */
var _isAdminOrArunkumar = _isAdminOrManager;

/* ── ACCESS CHECK ───────────────────────────────────────────────────────── */
function canAccess(page) {
  if (!currentUser) return false;
  if (currentUser.role === 'admin') return true;
  return (currentUser.pages || []).indexOf(page) >= 0;
}

/* ── CLASS DEFAULTS ─────────────────────────────────────────────────────── */
var CLASS_DEFAULTS = [
  { id: 'b1', name: 'Achiever', code: 'ACH', section: 'A', strength: 55, active: true, course: 'Combined',   color: '#8b5cf6' },
  { id: 'b2', name: 'Leader',   code: 'LDR', section: 'A', strength: 51, active: true, course: 'Sainik',     color: '#1a6b55' },
  { id: 'b3', name: 'Champion', code: 'CHP', section: 'A', strength: 55, active: true, course: 'Sainik',     color: '#0891b2' },
  { id: 'b4', name: 'Lakshya',  code: 'LKS', section: 'A', strength: 71, active: true, course: 'Navodaya',   color: '#3b78c9' },
  { id: 'b5', name: 'Umeed',    code: 'UMD', section: 'A', strength: 74, active: true, course: 'Navodaya',   color: '#0e7490' },
  { id: 'b6', name: 'Elite',    code: 'ELT', section: 'A', strength: 41, active: true, course: 'Foundation', color: '#d4a853' },
  { id: 'b7', name: 'Prime',    code: 'PRM', section: 'A', strength: 42, active: true, course: 'Foundation', color: '#dc2626' }
];

function loadClasses() {
  try {
    var s = localStorage.getItem('gnsi_classes');
    if (s) { var a = JSON.parse(s); if (Array.isArray(a) && a.length) return a; }
  } catch (e) {}
  return CLASS_DEFAULTS.map(function (c) { return Object.assign({}, c); });
}
function getClassNames() {
  return loadClasses().filter(function (c) { return c.active; }).map(function (c) { return c.name; });
}

console.log('[GNSI] core/state.js loaded ✓');
