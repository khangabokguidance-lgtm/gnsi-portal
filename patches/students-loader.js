/* ═══════════════════════════════════════════════════════════════════
   GNSI PORTAL — patches/students-loader.js
   Fixes student loading — reads from gnsi_keyvalue (ims_students)
   when the students table returns 0 records.
   Load at bottom of body after all other scripts.
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  function _loadStudentsFromKV() {
    var _supa = window._supa;
    if (!_supa) return;

    _supa.from('gnsi_keyvalue')
      .select('value')
      .eq('key', 'ims_students')
      .maybeSingle()
      .then(function (result) {
        if (!result.data || !result.data.value) return;

        var arr = result.data.value;
        if (typeof arr === 'string') {
          try { arr = JSON.parse(arr); } catch(e) { return; }
        }
        if (!Array.isArray(arr) || arr.length === 0) return;

        /* Only apply if students is currently empty */
        if (typeof students !== 'undefined' && students.length > 0) return;

        students = arr;
        console.log('[GNSI Students] Loaded', arr.length, 'students from KV store');

        /* Update nextId */
        if (arr.length && typeof nextId !== 'undefined') {
          var maxId = Math.max.apply(null, arr.map(function(s){ return parseInt(s.id)||0; }));
          if (maxId > nextId) nextId = maxId;
        }

        /* Re-render if on dashboard or students page */
        if (typeof window._dashCache !== 'undefined') window._dashCache = null;
        if (typeof render === 'function') render();
      })
      .catch(function (e) {
        console.error('[GNSI Students] KV load failed:', e);
      });
  }

  /* Hook into loadFromSupabase — run KV fallback after it completes */
  function _patch() {
    if (typeof loadFromSupabase !== 'function') {
      setTimeout(_patch, 500);
      return;
    }
    if (loadFromSupabase._studentPatched) return;

    var _orig = loadFromSupabase;
    loadFromSupabase = function (callback) {
      _orig(function () {
        /* After original load completes, check if students loaded */
        setTimeout(function () {
          if (typeof students === 'undefined' || students.length === 0) {
            console.log('[GNSI Students] Table returned 0 — falling back to KV store');
            _loadStudentsFromKV();
          }
        }, 500);
        if (typeof callback === 'function') callback();
      });
    };
    loadFromSupabase._studentPatched = true;
    console.log('[GNSI] patches/students-loader.js applied ✓');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(_patch, 800); });
  } else {
    setTimeout(_patch, 800);
  }

})();
