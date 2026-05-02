/* ═══════════════════════════════════════════════════════════════════════
   GNSI PORTAL — patches/version-checker.js
   Auto-notifies all staff when admin releases a portal update.

   HOW IT WORKS:
   1. Admin goes to Settings → pushes a new version number to Supabase
   2. Every open portal checks the version every 5 minutes
   3. If version changed → a banner appears at top of screen
   4. Staff click "Update Now" → page reloads with latest files

   SETUP (one time):
   Run this SQL in Supabase SQL Editor:

   INSERT INTO gnsi_keyvalue (key, value, updated_at)
   VALUES ('gnsi_portal_version', '"v11-2-6"', NOW())
   ON CONFLICT (key) DO UPDATE SET value = '"v11-2-6"', updated_at = NOW();

   Then add to index.html bottom of body:
   <script src="patches/version-checker.js"></script>
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var CURRENT_VERSION = 'v11-2-6';   /* ← update this when you release a new version */
  var CHECK_INTERVAL  = 5 * 60 * 1000; /* 5 minutes */
  var _checkTimer     = null;
  var _bannerShown    = false;
  var _lastKnownVer   = CURRENT_VERSION;

  /* ── Create the banner element ──────────────────────────────────────── */
  function _createBanner() {
    if (document.getElementById('gnsi-update-banner')) return;
    var b = document.createElement('div');
    b.id = 'gnsi-update-banner';
    b.style.cssText = [
      'display:none',
      'position:fixed',
      'top:0',
      'left:0',
      'right:0',
      'z-index:99999',
      'background:linear-gradient(135deg,#1433a8,#2655d8)',
      'color:#fff',
      'padding:10px 20px',
      'font-family:DM Sans,sans-serif',
      'font-size:13px',
      'font-weight:600',
      'display:none',
      'align-items:center',
      'gap:12px',
      'box-shadow:0 2px 16px rgba(0,0,0,0.3)',
      'animation:gnsiSlideDown .4s ease'
    ].join(';');

    b.innerHTML = [
      '<style>',
      '@keyframes gnsiSlideDown{from{transform:translateY(-100%)}to{transform:translateY(0)}}',
      '</style>',
      '<span id="gnsi-update-icon" style="font-size:18px">🔔</span>',
      '<span id="gnsi-update-msg" style="flex:1">Portal update available</span>',
      '<button id="gnsi-update-btn" onclick="window.gnsiApplyUpdate()" style="',
        'background:#fff;color:#1433a8;border:none;border-radius:8px;',
        'padding:7px 18px;font-size:13px;font-weight:700;cursor:pointer;',
        'font-family:DM Sans,sans-serif;transition:opacity .15s',
      '">Update Now</button>',
      '<button onclick="document.getElementById(\'gnsi-update-banner\').style.display=\'none\'" style="',
        'background:rgba(255,255,255,0.15);color:#fff;border:none;border-radius:8px;',
        'padding:7px 12px;font-size:12px;cursor:pointer;font-family:DM Sans,sans-serif',
      '">Later</button>'
    ].join('');

    document.body.appendChild(b);
  }

  /* ── Show the banner ────────────────────────────────────────────────── */
  function _showBanner(newVer, note) {
    _createBanner();
    var b   = document.getElementById('gnsi-update-banner');
    var msg = document.getElementById('gnsi-update-msg');
    if (!b) return;
    var noteStr = note ? ' — ' + note : '';
    if (msg) msg.textContent = 'Portal update ' + newVer + noteStr + '. Click to get the latest version.';
    b.style.display = 'flex';

    /* Push page content down so banner does not cover topbar */
    var main = document.getElementById('main');
    if (main) main.style.paddingTop = '44px';

    _bannerShown = true;
    console.log('[GNSI Version] Banner shown — new version:', newVer);
  }

  /* ── Apply update — hard reload bypassing cache ─────────────────────── */
  window.gnsiApplyUpdate = function () {
    var b = document.getElementById('gnsi-update-banner');
    var msg = document.getElementById('gnsi-update-msg');
    if (msg) msg.textContent = 'Updating… please wait';
    if (b) b.style.background = 'linear-gradient(135deg,#16a34a,#15803d)';

    setTimeout(function () {
      /* Force reload bypassing browser cache */
      window.location.href = window.location.pathname + '?v=' + Date.now();
    }, 600);
  };

  /* ── Check Supabase for latest version ──────────────────────────────── */
  async function _checkVersion() {
    if (_bannerShown) return; /* already showing — no need to check again */

    var _supa = window._supa;
    if (!_supa) return; /* not connected yet */

    try {
      var result = await _supa
        .from('gnsi_keyvalue')
        .select('value, updated_at')
        .eq('key', 'gnsi_portal_version')
        .maybeSingle();

      if (result.error || !result.data) return;

      var cloudVer = result.data.value;
      /* Value may be stored as JSON string "v11-2-7" or plain v11-2-7 */
      if (typeof cloudVer === 'string') {
        cloudVer = cloudVer.replace(/^"|"$/g, '').trim();
      }

      if (!cloudVer || cloudVer === CURRENT_VERSION) return;

      /* New version detected */
      console.log('[GNSI Version] Update detected:', CURRENT_VERSION, '→', cloudVer);

      /* Get release note if stored */
      var noteResult = await _supa
        .from('gnsi_keyvalue')
        .select('value')
        .eq('key', 'gnsi_portal_release_note')
        .maybeSingle();

      var note = '';
      if (noteResult.data && noteResult.data.value) {
        note = String(noteResult.data.value).replace(/^"|"$/g, '').trim();
      }

      _showBanner(cloudVer, note);

    } catch (e) {
      console.error('[GNSI Version] Check failed:', e);
    }
  }

  /* ── Start checking after login ─────────────────────────────────────── */
  function _startChecking() {
    if (_checkTimer) return;
    _checkVersion(); /* immediate first check */
    _checkTimer = setInterval(_checkVersion, CHECK_INTERVAL);
    console.log('[GNSI] patches/version-checker.js — checking every 5 min ✓');
  }

  /* ── Hook into portal login flow ────────────────────────────────────── */
  /* Wait for hideLoginScreen to be defined, then patch it */
  function _hookLogin() {
    if (typeof hideLoginScreen !== 'function') {
      setTimeout(_hookLogin, 500);
      return;
    }
    if (hideLoginScreen._versionPatched) return;

    var _orig = hideLoginScreen;
    hideLoginScreen = function () {
      _orig.apply(this, arguments);
      setTimeout(_startChecking, 3000); /* start 3s after login */
    };
    hideLoginScreen._versionPatched = true;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _hookLogin);
  } else {
    setTimeout(_hookLogin, 500);
  }

})();
