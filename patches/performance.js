/* GNSI PORTAL — patches/performance.js
   GNSI PERFORMANCE FIX PATCH v1.1
   Font deduplication, render debounce, login fast path.
   This patch was at lines 252-411 of the original portal HTML. */

<script>
/* ── GNSI PERFORMANCE FIX v1.1 ── */
/* ═══════════════════════════════════════════════════════════════════════════
   GNSI PORTAL — PERFORMANCE FIX PATCH v1.1
   Fixed: console.info breakage, bind() timing error, doLogin timing
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ════════════════════════════════════════════════════════════════════════
     1. FONT DEDUPLICATION (runtime safety net — HTML-level already done)
     If any duplicate font links slipped through, remove them now.
  ════════════════════════════════════════════════════════════════════════ */
  (function deduplicateFonts() {
    try {
      var seen = {};
      document.querySelectorAll('link[rel="stylesheet"]').forEach(function (el) {
        if (!el.href || el.href.indexOf('fonts.googleapis.com') === -1) return;
        var key = el.href.split('&display')[0];
        if (seen[key]) {
          el.parentNode && el.parentNode.removeChild(el);
        } else {
          seen[key] = true;
        }
      });
    } catch(e) {}
  })();

  /* ════════════════════════════════════════════════════════════════════════
     2. RENDER DEBOUNCE — installed after DOMContentLoaded so render()
        is guaranteed to exist before we wrap it.
  ════════════════════════════════════════════════════════════════════════ */
  var _renderOriginal = null;
  var _renderTimer    = null;

  function _installRenderDebounce() {
    if (window._gnsiRenderDebounced) return;
    if (typeof render !== 'function') {
      setTimeout(_installRenderDebounce, 300);
      return;
    }
    _renderOriginal = render;
    window._gnsiRenderDebounced = true;

    window.render = function gnsiRenderDebounced() {
      /* FLICKER FIX v84: proper time-based debounce — collapses all calls
         within 150 ms into a single render, eliminating rapid-fire flashes
         caused by simultaneous Supabase realtime + Firebase poll + user actions. */
      if (_renderTimer) clearTimeout(_renderTimer);
      _renderTimer = setTimeout(function () {
        _renderTimer = null;
        requestAnimationFrame(function () {
          try { _renderOriginal(); } catch (e) { /* swallow render errors */ }
        });
      }, 150);
    };
  }

  /* Install after DOM is ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _installRenderDebounce);
  } else {
    setTimeout(_installRenderDebounce, 100);
  }

  /* ════════════════════════════════════════════════════════════════════════
     3. LOGIN FAST PATH — defer finance init until after login
        Runs AFTER DOMContentLoaded so doLogin is defined
  ════════════════════════════════════════════════════════════════════════ */
  function _installLoginPatch() {
    /* Enter key on login form */
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      var ls = document.getElementById('login-screen');
      if (!ls) return;
      var style = window.getComputedStyle(ls);
      if (style.display === 'none' || style.visibility === 'hidden') return;
      if (typeof doLogin === 'function') { e.preventDefault(); doLogin(); }
    });

    /* Focus username field */
    var unEl = document.getElementById('login-username');
    if (unEl) setTimeout(function(){ unEl.focus(); }, 120);

    /* Defer gnsiFinanceInit until after login */
    var _origFinanceInit = window.gnsiFinanceInit;
    if (!_origFinanceInit || window._gnsiFinancePatchDone) return;
    window._gnsiFinancePatchDone = true;

    var _financeRan = false;
    window.gnsiFinanceInit = function gnsiFinanceInitDeferred() {
      var ls = document.getElementById('login-screen');
      var loginVisible = ls && window.getComputedStyle(ls).display !== 'none';
      if (loginVisible && !_financeRan) {
        /* Queue — don't run yet */
        window._pendingFinanceInit = _origFinanceInit;
        return;
      }
      _financeRan = true;
      return _origFinanceInit.apply(this, arguments);
    };

    /* AUTH v2.0: doLogin finance-defer wrapper removed.
       gnsiFinanceInit is now fired via _gnsiRunPostLoginSync Wave 3
       which is called directly inside the new async doLogin. */
    window._gnsiDoLoginPatched = true; /* guard so no other patch re-wraps */
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _installLoginPatch);
  } else {
    setTimeout(_installLoginPatch, 50);
  }

  /* ════════════════════════════════════════════════════════════════════════
     4. CSS PERFORMANCE HINTS — safe, no console use
  ════════════════════════════════════════════════════════════════════════ */
  (function addPerfCSS() {
    if (document.getElementById('gnsi-perf-css')) return;
    var st = document.createElement('style');
    st.id = 'gnsi-perf-css';
    st.textContent = [
      '#content  { contain: layout style; }',
      '#sidebar  { will-change: transform; }',
      '#topbar   { will-change: transform; }',
      'body { -webkit-font-smoothing: antialiased; text-rendering: optimizeSpeed; }',
      '#login-screen { contain: layout; }',
      '.login-card   { contain: layout style; }',
      '@media (prefers-reduced-motion: reduce) {',
      '  *,*::before,*::after { animation-duration:0.01ms!important; transition-duration:0.01ms!important; }',
      '}'
    ].join('\n');
    document.head.appendChild(st);
  })();

  /* ════════════════════════════════════════════════════════════════════════
     5. LOADING BAR — driven by real milestones via window._gnsiProgress()
        Fake setTimeout steps have been removed. The bar advances only when
        actual events complete: Supabase init (35%), credentials (55%),
        login screen (50%), Wave-1 data (90%), overlay dismiss (100%).
  ════════════════════════════════════════════════════════════════════════ */

  /* ════════════════════════════════════════════════════════════════════════
     6. LARGE TABLE OPTIMISATION (deferred, safe)
  ════════════════════════════════════════════════════════════════════════ */
  setTimeout(function () {
    try {
      var tbody = document.getElementById('stu-tbody');
      if (tbody && tbody.querySelectorAll('tr').length > 50) {
        tbody.style.willChange = 'transform';
        if (tbody.parentElement) tbody.parentElement.style.contain = 'layout';
      }
    } catch(e) {}
  }, 3000);

})();

</script>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2" fetchpriority="high" crossorigin="anonymous" onerror="var s=document.createElement('script');s.src='https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.js';s.crossOrigin='anonymous';document.head.appendChild(s);(void 0);"></script>
<!-- prefetch xlsx lib -- loaded lazily on Export, pre-warm so it's instant when needed -->
