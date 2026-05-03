/* ═══════════════════════════════════════════════════════════════════════
   GNSI PORTAL — patches/role-key-fix.js
   
   PROBLEM: The background sync re-runs detectRole() from job title
   and overrides the role_key set in Supabase gnsi_staff_credentials.
   Also _canEditFees() shows fee button to non-accounts staff.

   FIX 1: After login, read role_key from gnsi_staff_credentials and lock it.
   FIX 2: Patch _canEditFees() to use the locked role.
   FIX 3: Patch detectRole() to respect the locked role.

   Load at bottom of body after all other scripts.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var _lockedRole  = null;
  var _lockedPages = null;

  /* Set locked role IMMEDIATELY from session storage — no async needed */
  (function _immediateRoleLock() {
    try {
      var sess = sessionStorage.getItem('gnsi_session');
      if (sess) {
        var parsed = JSON.parse(sess);
        if (parsed && parsed.role) {
          _lockedRole = parsed.role;
          window._gnsiLockedRole = parsed.role;
          /* Set data-role on body immediately so CSS can hide fee buttons */
          document.body && (document.body.dataset.role = parsed.role);
          console.log('[GNSI Role Fix] Immediate lock from session:', parsed.role);
        }
      }
    } catch(e) {}
  })();

  /* After login, fetch role_key from Supabase and lock it */
  async function _fetchAndLockRole() {
    if (!currentUser || currentUser.role === 'admin') return;
    var _supa = window._supa;
    if (!_supa) return;

    try {
      var result = await _supa
        .from('gnsi_staff_credentials')
        .select('role_key')
        .eq('staff_id', currentUser.id)
        .maybeSingle();

      if (result.error || !result.data || !result.data.role_key) return;

      var cloudRole = result.data.role_key;
      _lockedRole  = cloudRole;
      window._gnsiLockedRole = cloudRole;  /* used by _canEditFees() immediately */
      document.body && (document.body.dataset.role = cloudRole);
      _lockedPages = (typeof ROLE_PAGES !== 'undefined' && ROLE_PAGES[cloudRole]) || [];

      if (cloudRole !== currentUser.role) {
        console.log('[GNSI Role Fix] Correcting role: ' + currentUser.role + ' -> ' + cloudRole);
        currentUser.role  = cloudRole;
        currentUser.pages = _lockedPages;
        if (typeof saveSession === 'function') saveSession(currentUser);
        if (typeof render    === 'function') render();
        if (typeof buildNav  === 'function') buildNav();
      }

      console.log('[GNSI Role Fix] Role locked to: ' + _lockedRole);

    } catch (e) {
      console.error('[GNSI Role Fix] Failed:', e);
    }
  }

  /* Patch detectRole to respect locked role */
  function _patchDetectRole() {
    if (typeof detectRole !== 'function') { setTimeout(_patchDetectRole, 500); return; }
    if (detectRole._roleLockPatched) return;
    var _orig = detectRole;
    detectRole = function (member) {
      if (_lockedRole && currentUser && member && member.id === currentUser.id) return _lockedRole;
      return _orig(member);
    };
    detectRole._roleLockPatched = true;
    console.log('[GNSI Role Fix] detectRole patched');
  }

  /* Patch _canEditFees to use locked role — stops fee button for teachers */
  function _patchCanEditFees() {
    if (typeof window._canEditFees !== 'function') { setTimeout(_patchCanEditFees, 300); return; }
    if (window._canEditFees._rolePatched) return;
    window._canEditFees = function () {
      if (!currentUser) return false;
      var role = _lockedRole || currentUser.role;
      return role === 'admin' || role === 'manager' || role === 'accounts';
    };
    window._canEditFees._rolePatched = true;
    console.log('[GNSI Role Fix] _canEditFees patched');
  }

  /* Hook into hideLoginScreen */
  function _hookLogin() {
    if (typeof hideLoginScreen !== 'function') { setTimeout(_hookLogin, 500); return; }
    if (hideLoginScreen._roleKeyPatched) return;
    var _orig = hideLoginScreen;
    hideLoginScreen = function () {
      _orig.apply(this, arguments);
      setTimeout(_fetchAndLockRole, 1000);
      setTimeout(_fetchAndLockRole, 3000);
    };
    hideLoginScreen._roleKeyPatched = true;
  }

  function _init() {
    _patchDetectRole();
    _patchCanEditFees();
    _hookLogin();
    /* Set locked role immediately from session on page load */
    setTimeout(function () {
      if (typeof currentUser !== 'undefined' && currentUser && currentUser.role !== 'admin') {
        /* Set immediately from session role so _canEditFees works before Supabase fetch */
        if (!window._gnsiLockedRole) {
          window._gnsiLockedRole = currentUser.role;
          _lockedRole = currentUser.role;
        }
        _fetchAndLockRole();
      }
    }, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _init);
  } else {
    setTimeout(_init, 300);
  }

})();

/* ── BLOCK gnsiOpenStudentFees for non-accounts roles ── */
(function _blockFeeModal() {
  if (typeof window.gnsiOpenStudentFees !== 'function') {
    setTimeout(_blockFeeModal, 500);
    return;
  }
  if (window.gnsiOpenStudentFees._feeBlocked) return;

  var _origOpenFees = window.gnsiOpenStudentFees;
  window.gnsiOpenStudentFees = function (stuId) {
    var role = (typeof _lockedRole !== 'undefined' && _lockedRole) ||
               (typeof currentUser !== 'undefined' && currentUser && currentUser.role) || '';
    var allowed = role === 'admin' || role === 'manager' || role === 'accounts';
    if (!allowed) {
      if (typeof showToast === 'function') showToast('⛔ Fee management is restricted to Accounts staff only.', '#dc2626');
      return;
    }
    _origOpenFees(stuId);
  };
  window.gnsiOpenStudentFees._feeBlocked = true;
  console.log('[GNSI Role Fix] gnsiOpenStudentFees blocked for non-accounts ✓');
})();

/* ── BLOCK student edit/enroll for non-admin/manager roles ── */
(function _blockStudentEdit() {
  /* Check permission */
  function _canEditStudents() {
    var role = (typeof _lockedRole !== 'undefined' && _lockedRole) ||
               (typeof currentUser !== 'undefined' && currentUser && currentUser.role) || '';
    return role === 'admin' || role === 'manager';
  }

  /* Block showAddStudent from being set to true by non-admins */
  function _watchShowAddStudent() {
    var _origRender = typeof render === 'function' ? render : null;
    if (!_origRender) { setTimeout(_watchShowAddStudent, 500); return; }
    if (_origRender._editBlocked) return;

    var _patchedRender = function () {
      /* If someone tried to open the edit/add student form without permission — block it */
      if (typeof showAddStudent !== 'undefined' && showAddStudent && !_canEditStudents()) {
        showAddStudent = false;
        stuEditId = null;
        if (typeof showToast === 'function') showToast('⛔ Only Admin and Manager can edit student data.', '#dc2626');
        return;
      }
      _origRender.apply(this, arguments);
    };
    _patchedRender._editBlocked = true;
    /* Replace global render */
    window.render = _patchedRender;
    console.log('[GNSI Role Fix] Student edit blocked for non-admin/manager ✓');
  }

  setTimeout(_watchShowAddStudent, 1000);
})();
