/* ═══════════════════════════════════════════════════════════════════
   GNSI PORTAL — patches/students-loader.js
   Fixes student loading — reads from gnsi_keyvalue (ims_students)
   when students array is empty after login (admin or staff).
   Load at bottom of body after all other scripts.
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  function _loadStudentsFromKV(force) {
    var _supa = window._supa;
    if (!_supa) return;
    if (!force && typeof students !== 'undefined' && students.length > 0) return;

    _supa.from('gnsi_keyvalue')
      .select('value')
      .eq('key', 'ims_students')
      .maybeSingle()
      .then(function (result) {
        if (!result.data || !result.data.value) return;
        var arr = result.data.value;
        if (typeof arr === 'string') { try { arr = JSON.parse(arr); } catch(e) { return; } }
        if (!Array.isArray(arr) || arr.length === 0) return;
        if (!force && typeof students !== 'undefined' && students.length > 0) return;

        students = arr;
        console.log('[GNSI Students] Loaded', arr.length, 'students from KV store');

        if (arr.length && typeof nextId !== 'undefined') {
          var maxId = Math.max.apply(null, arr.map(function(s){ return parseInt(s.id)||0; }));
          if (maxId > nextId) nextId = maxId;
        }

        if (typeof window._dashCache !== 'undefined') window._dashCache = null;
        if (typeof render === 'function') render();
      })
      .catch(function (e) { console.error('[GNSI Students] KV load failed:', e); });
  }

  /* Check every 3 seconds for 30 seconds after login — catches staff logins too */
  function _startPolling() {
    var attempts = 0;
    var timer = setInterval(function () {
      attempts++;
      if (attempts > 10) { clearInterval(timer); return; }
      if (typeof students !== 'undefined' && students.length > 0) { clearInterval(timer); return; }
      if (typeof currentUser !== 'undefined' && currentUser) {
        console.log('[GNSI Students] Polling attempt', attempts, '— students:', (typeof students !== 'undefined' ? students.length : 'undefined'));
        _loadStudentsFromKV(false);
      }
    }, 3000);
  }

  /* Hook into hideLoginScreen — works for both admin and staff */
  function _hookLogin() {
    if (typeof hideLoginScreen !== 'function') { setTimeout(_hookLogin, 500); return; }
    if (hideLoginScreen._studentsLoaderPatched) return;
    var _orig = hideLoginScreen;
    hideLoginScreen = function () {
      _orig.apply(this, arguments);
      setTimeout(function () { _loadStudentsFromKV(false); }, 2000);
      setTimeout(function () { _loadStudentsFromKV(false); }, 5000);
      _startPolling();
    };
    hideLoginScreen._studentsLoaderPatched = true;
    console.log('[GNSI] patches/students-loader.js applied ✓');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(_hookLogin, 500); });
  } else {
    setTimeout(_hookLogin, 500);
  }

  /* Also run immediately if already logged in (page refresh) */
  setTimeout(function () {
    if (typeof currentUser !== 'undefined' && currentUser) {
      _loadStudentsFromKV(false);
      _startPolling();
    }
  }, 3000);

})();
