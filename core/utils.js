/* ═══════════════════════════════════════════════════════════════════════════
   GNSI PORTAL — core/utils.js
   Shared helper functions used across all modules.
   No dependencies. Load this FIRST before any other script.
   ═══════════════════════════════════════════════════════════════════════════ */

'use strict';

/* ── HTML ESCAPING ──────────────────────────────────────────────────────── */
/* Always use esc() before inserting any user data into HTML strings.
   Prevents XSS attacks — e.g. a student name containing <script> tags. */
function esc(s) {
  if (s === undefined || s === null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ── TOAST NOTIFICATIONS ────────────────────────────────────────────────── */
/* Show a small popup message at the bottom-right of the screen.
   color: any CSS color string, e.g. '#16a34a' (green) or '#dc2626' (red) */
function showToast(msg, color) {
  color = color || '#1433a8';
  var t = document.getElementById('gnsi-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'gnsi-toast';
    t.style.cssText = [
      'position:fixed;bottom:24px;right:24px',
      'padding:11px 20px;border-radius:10px',
      'font-size:13px;font-family:DM Sans,sans-serif;font-weight:600',
      'box-shadow:0 4px 20px rgba(0,0,0,0.25)',
      'z-index:9999;opacity:0;transition:opacity 0.3s',
      'color:#fff;max-width:340px'
    ].join(';');
    document.body.appendChild(t);
  }
  t.style.background = color;
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._tid);
  t._tid = setTimeout(function () { t.style.opacity = '0'; }, 3500);
}

/* ── DATE FORMATTING ────────────────────────────────────────────────────── */
/* Formats an ISO date string to a readable format: "Mon, 2 Jan 2026" */
function fmtDate(d) {
  try {
    return new Date(d + ' ').toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
    });
  } catch (e) { return d; }
}

/* ── NUMBER TO WORDS (Indian system) ────────────────────────────────────── */
/* Used for fee receipts: numWords(9200) → "Nine Thousand Two Hundred" */
function numWords(n) {
  var a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
    'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen',
    'Seventeen','Eighteen','Nineteen'];
  var b = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  if (!n || n === 0) return 'Zero';
  if (n < 20)       return a[n];
  if (n < 100)      return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
  if (n < 1000)     return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + numWords(n % 100) : '');
  if (n < 100000)   return numWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + numWords(n % 1000) : '');
  return numWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + numWords(n % 100000) : '');
}

/* ── PHONE / AADHAR MASKING ─────────────────────────────────────────────── */
/* Masks sensitive data for non-admin roles */
function _canSeePhone() {
  if (!currentUser) return false;
  return currentUser.role === 'admin' || currentUser.role === 'manager' || currentUser.role === 'accounts';
}
function _canSeeAadhar() {
  if (!currentUser) return false;
  return currentUser.role === 'admin' || currentUser.role === 'manager';
}
function _canSeeAddress() {
  if (!currentUser) return false;
  return currentUser.role === 'admin' || currentUser.role === 'manager';
}
function _canSeeCategory() {
  if (!currentUser) return false;
  return currentUser.role === 'admin' || currentUser.role === 'manager';
}
function _canSeeReligion() {
  if (!currentUser) return false;
  return currentUser.role === 'admin' || currentUser.role === 'manager';
}
function _canEditFees() {
  if (!currentUser) return false;
  /* Use the locked role from Supabase if available (set by role-key-fix.js) */
  var role = window._gnsiLockedRole || currentUser.role;
  return role === 'admin' || role === 'manager' || role === 'accounts';
}

function maskPhone(ph) {
  if (!ph) return '';
  var s = String(ph).trim();
  if (!s) return '';
  if (_canSeePhone()) return s;
  if (s.length <= 4) return s;
  return s.substring(0, 4) + 'X'.repeat(s.length - 4);
}

function maskAadhar(num) {
  if (!num) return '';
  var s = String(num).trim().replace(/\s/g, '');
  if (!s) return '';
  if (_canSeeAadhar()) return s;
  if (s.length <= 4) return 'X'.repeat(s.length);
  return 'XXXX XXXX ' + s.slice(-4);
}

/* ── PHOTO URL SANITISER ────────────────────────────────────────────────── */
/* Blocks javascript: URLs and unsafe data: types.
   Only allows data:image/... (base64 uploads) and https:// links. */
function _gnsiSafePhoto(url) {
  if (!url || typeof url !== 'string') return '';
  var u = url.trim();
  if (u.indexOf('data:image/') === 0) return u;
  if (u.indexOf('https://') === 0)    return u;
  return '';
}

/* ── AVATAR HTML ─────────────────────────────────────────────────────────── */
/* Generates a coloured circle with initials when no photo is available */
function avatarHTML(name, size) {
  size = size || 32;
  var words = name.trim().split(' ');
  var init  = (words[0][0] + (words[1] ? words[1][0] : '')).toUpperCase();
  var hue   = name.split('').reduce(function (a, c) { return a + c.charCodeAt(0); }, 0) % 360;
  return '<div class="avatar" style="width:' + size + 'px;height:' + size + 'px;font-size:'
    + Math.round(size * 0.35) + 'px;background:hsl(' + hue + ',45%,42%)">' + init + '</div>';
}

/* ── BADGE ───────────────────────────────────────────────────────────────── */
function badge(text, color) {
  return '<span class="badge" style="background:' + color + '22;color:' + color
    + ';border:1px solid ' + color + '55">' + text + '</span>';
}

/* ── SEARCH DEBOUNCE ────────────────────────────────────────────────────── */
/* Prevents the page from re-rendering on every single keystroke.
   Usage: searchDebounce('staffSearch', function(){ render(); }, 200) */
var _searchDebounceTimers = {};
function searchDebounce(key, fn, delay) {
  if (_searchDebounceTimers[key]) clearTimeout(_searchDebounceTimers[key]);
  _searchDebounceTimers[key] = setTimeout(function () {
    delete _searchDebounceTimers[key];
    fn();
  }, delay || 200);
}

/* ── SYNC STATUS INDICATOR ──────────────────────────────────────────────── */
/* Updates the small sync dot on the login screen and header.
   States: 'offline' | 'syncing' | 'synced' | 'error' | 'loading' | 'live' */
function setSyncStatus(state) {
  var dot   = document.getElementById('fb-sync-dot');
  var label = document.getElementById('fb-sync-label');
  var icon  = document.getElementById('fb-sync-icon');
  if (!dot || !label) return;
  var map = {
    offline:     { c: '#94a3b8', t: 'Not connected to cloud' },
    syncing:     { c: '#f59e0b', t: 'Saving to cloud…' },
    synced:      { c: '#34d36a', t: 'Cloud Synced ✓' },
    error:       { c: '#ef4444', t: 'Sync Error — changes queued' },
    loading:     { c: '#60a5fa', t: 'Loading from cloud…' },
    live:        { c: '#a78bfa', t: '☁️ Cloud Mode — Live ●' },
    offline_net: { c: '#f97316', t: 'Offline — writes queued ⚡' }
  };
  var s = map[state] || map.offline;
  dot.style.background  = s.c;
  dot.style.boxShadow   = '0 0 7px ' + s.c;
  label.textContent     = s.t;
  label.style.color     = s.c;
  if (icon) {
    icon.style.stroke = s.c;
    icon.style.filter = 'drop-shadow(0 0 3px ' + s.c + ')';
  }
  window._gnsiLastSyncState = state;
}

/* ── SAFE BASE64 ENCODER ────────────────────────────────────────────────── */
/* Unicode-safe base64 — the built-in btoa() breaks on non-ASCII characters */
function _safeBtoa(s) {
  try {
    var b = new TextEncoder().encode(String(s || '')), r = '';
    for (var i = 0; i < b.length; i++) r += String.fromCharCode(b[i]);
    return btoa(r);
  } catch (e) {
    return btoa(unescape(encodeURIComponent(String(s || ''))));
  }
}

/* ── NON-CRYPTO HASH (for fingerprints, not passwords) ─────────────────── */
/* FNV-32a with 50 rounds — fast, deterministic.
   NOT for passwords. Use hashPassword() in auth.js for passwords. */
function _gnsiSignHash(str) {
  var SALT = 'GNSI·SIG·SALT·2026';
  function _fnv32(s) {
    var h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) { h ^= (s.charCodeAt(i) & 0xff); h = (h >>> 0); h = ((h * 16777619) >>> 0); }
    return ('00000000' + h.toString(16)).slice(-8);
  }
  var v = _fnv32(SALT + str + SALT);
  for (var r = 0; r < 50; r++) { v = _fnv32(v + str + (r & 0xff).toString(16)); }
  return 'gs_' + v;
}

/* ── LEGACY HASH (migration only — do not use for new passwords) ─────── */
function _legacyHash(str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) { hash = ((hash << 5) - hash) + str.charCodeAt(i); hash |= 0; }
  return 'h' + Math.abs(hash).toString(36);
}

/* ── DEPT COLOR ─────────────────────────────────────────────────────────── */
var DEPT_COLORS = {
  'Teaching':       '#1433a8',
  'Administration': '#7c3aed',
  'Accounts':       '#16a34a',
  'Hostel':         '#d97706',
  'IT':             '#0891b2',
  'Support':        '#64748b'
};
function dc(d) { return DEPT_COLORS[d] || '#7a7468'; }
function pc(p) { return p === 'High' ? '#dc2626' : p === 'Medium' ? '#d4a853' : '#16a34a'; }

console.log('[GNSI] core/utils.js loaded ✓');
