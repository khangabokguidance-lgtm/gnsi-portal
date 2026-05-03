/* ═══════════════════════════════════════════════════════════════════════
   GNSI PORTAL — patches/role-key-fix.js
   
   PROBLEM: The background sync re-runs detectRole() from job title
   and overrides the role_key set in Supabase gnsi_staff_credentials.
   This means a teacher with role_key='teacher' gets upgraded to
   'manager' if their job title contains 'administrator' etc.

   FIX: After login, read role_key from gnsi_staff_credentials and
   lock it. Prevent detectRole() from overriding it.

   Load at bottom of body after all other scripts.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* Store the authoritative role_key from Supabase after login */
  var _lockedRole = null;
  var _lockedPages = null;

  /* After login, fetch the role_key from Supabase and lock it */
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

      /* Only apply if different from current */
      if (cloudRole && cloudRole !== currentUser.role) {
        console.log('[GNSI Role Fix] Correcting role: ' + currentUser.role + ' → ' + cloudRole);
        currentUser.role = cloudRole;
        currentUser.pages = (typeof ROLE_PAGES !== 'undefined' && ROLE_PAGES[cloudRole]) || [];
        _lockedRole = cloudRole;
        _lockedPages = currentUser.pages;
        if (typeof saveSession === 'function') saveSession(currentUser);
        if (typeof render === 'function') render();
        if (typeof buildNav === 'function') buildNav();
      } else {
        _lockedRole = cloudRole;
        _lockedPages = (typeof ROLE_PAGES !== 'undefined' && ROLE_PAGES[cloudRole]) || [];
      }

      console.log('[GNSI Role Fix] Role locked to: ' + _lockedRole);
    } catch (e) {
      console.error('[GNSI Role Fix] Failed to fetch role_key:', e);
    }
  }

  /* Patch detectRole to respect the locked role */
  function _patchDetectRole() {
    if (typeof detectRole !== 'function') {
      setTimeout(_patchDetectRole, 500);
      return;
    }
    if (detectRole._roleLockPatched) return;

    var _origDetectRole = detectRole;
    detectRole = function (member) {
      /* If this is the current logged-in user and we have a locked role — use it */
      if (_lockedRole && currentUser && member && member.id === currentUser.id) {
        return _lockedRole;
      }
      return _origDetectRole(member);
    };
    detectRole._roleLockPatched = true;
    console.log('[GNSI Role Fix] detectRole patched ✓');
  }

  /* Hook into hideLoginScreen to fetch role after login */
  function _hookLogin() {
    if (typeof hideLoginScreen !== 'function') {
      setTimeout(_hookLogin, 500);
      return;
    }
    if (hideLoginScreen._roleKeyPatched) return;

    var _orig = hideLoginScreen;
    hideLoginScreen = function () {
      _orig.apply(this, arguments);
      /* Wait for currentUser to be set then fetch role */
      setTimeout(_fetchAndLockRole, 2000);
    };
    hideLoginScreen._roleKeyPatched = true;
  }

  /* Also run on page load if already logged in */
  function _init() {
    _patchDetectRole();
    _hookLogin();

    /* If already logged in (session restore) */
    setTimeout(function () {
      if (typeof currentUser !== 'undefined' && currentUser && currentUser.role !== 'admin') {
        _fetchAndLockRole();
      }
    }, 3000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _init);
  } else {
    setTimeout(_init, 300);
  }

})();
