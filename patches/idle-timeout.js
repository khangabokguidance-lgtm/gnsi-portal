/* GNSI PORTAL — patches/idle-timeout.js
   GNSI IDLE-TIMEOUT v1 — auto-logout after 30 min inactivity.
   Load at the very bottom of body.
   This patch was at lines 71281-71346 of the original portal HTML. */

<script>
/* ═══════════════════════════════════════════════════════════════
   GNSI IDLE-TIMEOUT v1 — auto-logout after 30 min inactivity
   Patched into portal_v84 at deploy time
   ═══════════════════════════════════════════════════════════════ */
(function () {
  var TIMEOUT_MS = 30 * 60 * 1000;
  var WARNING_MS =  2 * 60 * 1000;
  var _timer, _warnTimer, _warnBox;

  function _resetTimers() {
    clearTimeout(_timer);
    clearTimeout(_warnTimer);
    if (_warnBox) { _warnBox.style.display = 'none'; }
    _warnTimer = setTimeout(_showWarning, TIMEOUT_MS - WARNING_MS);
    _timer     = setTimeout(_doLogout,    TIMEOUT_MS);
  }

  function _showWarning() {
    if (!_warnBox) {
      _warnBox = document.createElement('div');
      _warnBox.id = 'gnsi-idle-warn';
      _warnBox.style.cssText = [
        'position:fixed;bottom:24px;right:24px;z-index:99999',
        'background:#1433a8;color:#fff;border-radius:12px',
        'padding:16px 20px;font-family:DM Sans,sans-serif',
        'font-size:14px;box-shadow:0 4px 24px rgba(0,0,0,0.35)',
        'max-width:300px;line-height:1.5'
      ].join(';');
      _warnBox.innerHTML = [
        '<strong style="display:block;margin-bottom:6px">&#9888; Session expiring soon</strong>',
        'You will be logged out in 2 minutes due to inactivity.',
        '<br><button id="gnsi-idle-stay" style="margin-top:10px;padding:6px 16px;',
        'background:#fff;color:#1433a8;border:none;border-radius:8px;',
        'font-weight:700;cursor:pointer;font-size:13px">Stay logged in</button>'
      ].join('');
      document.body.appendChild(_warnBox);
      document.getElementById('gnsi-idle-stay').addEventListener('click', _resetTimers);
    }
    _warnBox.style.display = 'block';
  }

  function _doLogout() {
    try {
      localStorage.removeItem('gnsi_jwt_user');
      localStorage.removeItem('gnsi_current_user');
      localStorage.removeItem('ims_loggedin');
    } catch(e) {}
    if (typeof doLogout === 'function') {
      try { doLogout(); } catch(e) {}
    } else {
      window.location.reload();
    }
  }

  ['mousemove','mousedown','keydown','touchstart','scroll','click'].forEach(function(ev) {
    document.addEventListener(ev, _resetTimers, { passive: true });
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _resetTimers);
  } else {
    _resetTimers();
  }
})();
</script>
