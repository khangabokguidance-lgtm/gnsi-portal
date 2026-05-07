/* ═══════════════════════════════════════════════════════════════════════════
   GNSI PORTAL — core/auth.js
   Everything related to login, logout, passwords, sessions, and lockouts.

   DEPENDS ON: core/utils.js (must be loaded before this file)

   Two login paths:
     PATH 1 — Admin:  checked against PORTAL_USERS (works offline)
     PATH 2 — Staff:  checked against Supabase gnsi_staff_credentials
   ═══════════════════════════════════════════════════════════════════════════ */

'use strict';

/* ── ADMIN CREDENTIALS (file-based, always offline-capable) ─────────────── */
/* The hash here is SHA-256 of the original password.
   After first login, this is upgraded to PBKDF2 stored in localStorage
   under the key gnsi_pu_hash_<username>.
   To change the admin password: use the Change Password screen inside
   the portal — do NOT manually edit this hash. */
var PORTAL_USERS = {
  'guidance': {
    hash:      '78c9184ae64acc96732b1db7d00b4a7a01e8e4e3ee2d3674b8e47cd824002e9c',
    role:      'admin',
    staffId:   1,
    name:      'Moirangthem Himan Singh',
    staffRole: 'Head of the Institute'
  }
};

/* ── PASSWORD HASHING (PBKDF2-SHA256, 100k iterations) ─────────────────── */
/* This is the correct way to store passwords. Never use plain SHA-256 for
   new passwords — it is too fast and can be brute-forced.
   Format of output: gpv3_<hex-salt>_<hex-hash> */
async function hashPassword(plainText) {
  if (!window.crypto || !window.crypto.subtle) {
    console.error('[GNSI Auth] Web Crypto not available — using fallback');
    return 'gp_fallback_' + _gnsiSignHash(plainText);
  }
  var saltBytes = new Uint8Array(16);
  window.crypto.getRandomValues(saltBytes);
  var saltHex = Array.from(saltBytes).map(function (b) { return ('00' + b.toString(16)).slice(-2); }).join('');
  var enc = new TextEncoder();
  var keyMaterial = await window.crypto.subtle.importKey('raw', enc.encode(plainText), { name: 'PBKDF2' }, false, ['deriveBits']);
  var derived = await window.crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode('GNSI·2026·' + saltHex), iterations: 100000, hash: 'SHA-256' },
    keyMaterial, 256
  );
  var hashHex = Array.from(new Uint8Array(derived)).map(function (b) { return ('00' + b.toString(16)).slice(-2); }).join('');
  return 'gpv3_' + saltHex + '_' + hashHex;
}

/* Verify a gpv3_ hash against a plain text password */
async function verifyHashPassword(plainText, stored) {
  if (!window.crypto || !window.crypto.subtle) return false;
  var parts = stored.split('_');
  if (parts.length !== 3 || parts[0] !== 'gpv3') return false;
  var saltHex = parts[1];
  var enc = new TextEncoder();
  var keyMaterial = await window.crypto.subtle.importKey('raw', enc.encode(plainText), { name: 'PBKDF2' }, false, ['deriveBits']);
  var derived = await window.crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode('GNSI·2026·' + saltHex), iterations: 100000, hash: 'SHA-256' },
    keyMaterial, 256
  );
  var hashHex = Array.from(new Uint8Array(derived)).map(function (b) { return ('00' + b.toString(16)).slice(-2); }).join('');
  return hashHex === parts[2];
}

/* ── STORED HASH — read/write password hash for a staff member ─────────── */
function getStoredHash(staffId) {
  return localStorage.getItem('gnsi_pwd_' + staffId) || null;
}

/* Sets a new password hash for a staff member and pushes to Supabase.
   mustChange (optional):
     true  → admin reset / first-login temp password → push must_change='1' to Supabase
     false / omitted → user set their own password   → push must_change='0' */
async function setStoredHash(staffId, plainText, mustChange) {
  var _mustChangeVal = mustChange ? '1' : '0';
  var h = await hashPassword(plainText);
  localStorage.setItem('gnsi_pwd_' + staffId, h);
  localStorage.setItem('gnsi_pwd_changed_' + staffId, '1');

  /* For admin (PORTAL_USERS), also stamp gnsi_pu_hash_<uname> */
  try {
    var _pu = window.PORTAL_USERS || {};
    Object.keys(_pu).forEach(function (uname) {
      if (String(_pu[uname].staffId) === String(staffId)) {
        localStorage.setItem('gnsi_pu_hash_' + uname, h);
        if (!mustChange) localStorage.removeItem('gnsi_pu_must_change_' + uname);
      }
    });
  } catch (e) {}

  try { if (!mustChange) localStorage.setItem('gnsi_pwd_ever_set_' + staffId, '1'); } catch (e) {}

  /* Push to Supabase gnsi_staff_credentials with correct must_change value */
  var client = (typeof _supa !== 'undefined' && _supa) || (typeof _getSb === 'function' && _getSb());
  if (client) {
    var uname = localStorage.getItem('gnsi_uname_' + staffId) || null;
    if (!uname && window.PORTAL_USERS) {
      Object.keys(window.PORTAL_USERS).forEach(function (u) {
        if (String(window.PORTAL_USERS[u].staffId) === String(staffId)) uname = u;
      });
    }
    client.from('gnsi_staff_credentials')
      .upsert({
        staff_id:    staffId,
        uname:       uname,
        pwd_hash:    h,
        must_change: _mustChangeVal,  /* '1' = force change on next login, '0' = normal */
        role_key:    localStorage.getItem('gnsi_role_' + staffId) || null,
        updated_at:  new Date().toISOString()
      }, { onConflict: 'staff_id' })
      .then(function (r) {
        if (r && r.error) { console.error('[GNSI Auth] setStoredHash Supabase error:', r.error); }
        else if (typeof setSyncStatus === 'function') setSyncStatus('synced');
      })
      .catch(function (e) { console.error('[GNSI Auth] setStoredHash failed:', e); });
  }
  return h;
}

/* Verify password for a staff member (handles all hash formats).
   FIX: If localStorage hash doesn't match, falls back to Supabase cloud hash.
   This prevents "incorrect password" errors when localStorage was overwritten
   after an admin reset (race condition between setStoredHash and sbPullAllCredentials). */
async function verifyPassword(staffId, plainText, staffName) {
  var stored = getStoredHash(staffId);

  /* ── Step 1: Try localStorage hash first ── */
  var localOk = false;
  if (!stored) {
    /* No hash at all — check default password (first ever login) */
    localOk = (plainText === defaultPassword(staffName));
  } else if (stored.indexOf('gpv3_') === 0) {
    localOk = await verifyHashPassword(plainText, stored);
  } else if (stored.indexOf('gp_') === 0) {
    /* Old FNV hash — verify and upgrade if correct */
    var ROUNDS = 2000, SALT = 'GNSI·INST·2026·SECURE';
    function _fnv32(s) { var h = 0x811c9dc5; for (var i = 0; i < s.length; i++) { h ^= (s.charCodeAt(i) & 0xff); h = (h >>> 0); h = ((h * 16777619) >>> 0); } return ('00000000' + h.toString(16)).slice(-8); }
    var v = _fnv32(SALT + plainText + SALT + plainText.length.toString(16));
    for (var r = 0; r < ROUNDS; r++) { v = _fnv32(v + plainText + SALT + (r & 0xff).toString(16)); }
    if (('gp_' + v) === stored) { setStoredHash(staffId, plainText); localOk = true; }
  } else if (_legacyHash(plainText) === stored) {
    /* Very old djb2 hash — upgrade if matches */
    setStoredHash(staffId, plainText);
    localOk = true;
  }

  if (localOk) return true;

  /* ── Step 2: Fallback — fetch hash directly from Supabase ──────────────
     Handles the case where localStorage was overwritten with a stale hash
     after an admin reset the password (sbPullAllCredentials race condition). */
  try {
    var _client = (typeof _supa !== 'undefined' && _supa) || (typeof _getSb === 'function' && _getSb());
    if (_client) {
      var _res = await _client.from('gnsi_staff_credentials')
        .select('pwd_hash')
        .eq('staff_id', staffId)
        .maybeSingle();
      if (_res.data && _res.data.pwd_hash && _res.data.pwd_hash !== stored) {
        var cloudOk = await verifyHashPassword(plainText, _res.data.pwd_hash);
        if (cloudOk) {
          /* Restore correct hash to localStorage so future checks work */
          localStorage.setItem('gnsi_pwd_' + staffId, _res.data.pwd_hash);
          console.log('[GNSI Auth] verifyPassword: restored correct hash from Supabase for staff', staffId);
        }
        return cloudOk;
      }
    }
  } catch (e) {
    console.warn('[GNSI Auth] verifyPassword Supabase fallback failed:', e);
  }

  return false;
}

/* Default first-time password = first word of staff name, lowercase */
function defaultPassword(name) {
  return (name || '').trim().split(' ')[0].toLowerCase();
}

/* ── PASSWORD STRENGTH VALIDATION ───────────────────────────────────────── */
function gnsiCheckPasswordStrength(pwd) {
  if (!pwd || pwd.length < 8)   return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(pwd))        return 'Password must contain at least one uppercase letter (A-Z).';
  if (!/[a-z]/.test(pwd))        return 'Password must contain at least one lowercase letter (a-z).';
  if (!/[0-9]/.test(pwd))        return 'Password must contain at least one number (0-9).';
  return null; /* null = strong enough */
}

/* ── MUST-CHANGE FLAG ───────────────────────────────────────────────────── */
function hasMustChangeFlag(staffId) { return localStorage.getItem('gnsi_pwd_must_change_' + staffId) === '1'; }
function setMustChangeFlag(staffId) { localStorage.setItem('gnsi_pwd_must_change_' + staffId, '1'); }
function clearMustChangeFlag(staffId) {
  var _key = 'gnsi_pwd_must_change_' + staffId;
  localStorage.removeItem(_key);
  localStorage.removeItem('gnsi_kv_ts_' + _key);
  try {
    var _pu = window.PORTAL_USERS || {};
    Object.keys(_pu).forEach(function (uname) {
      if (_pu[uname].staffId === staffId || _pu[uname].staffId === parseInt(staffId)) {
        localStorage.removeItem('gnsi_pu_must_change_' + uname);
      }
    });
  } catch (e) {}
  if (typeof _supa !== 'undefined' && _supa) {
    _supa.from('gnsi_staff_credentials')
      .upsert({ staff_id: parseInt(staffId), must_change: '0', updated_at: new Date().toISOString() }, { onConflict: 'staff_id' })
      .catch(function (e) { console.error('[GNSI Auth] clearMustChangeFlag failed:', e); });
  }
  if (typeof gnsiKVPush === 'function') gnsiKVPush(_key, '0');
}

/* ── USERNAME MANAGEMENT ────────────────────────────────────────────────── */
function getUsername(staffId) { return localStorage.getItem('gnsi_uname_' + staffId) || null; }
function setUsername(staffId, username) { localStorage.setItem('gnsi_uname_' + staffId, username.trim().toLowerCase()); }
function findStaffByUsername(username) {
  var uname = (username || '').trim().toLowerCase();
  if (!uname) return null;
  return staff.find(function (s) { return getUsername(s.id) === uname; }) || null;
}

/* ── LOCKOUT SYSTEM ─────────────────────────────────────────────────────── */
var _LOCKOUT_MAX_FAILS   = 5;
var _LOCKOUT_DURATION_MS = 15 * 60 * 1000; /* 15 minutes */
var _loginFailCount      = 0;

function _getLockoutData(uname) {
  try { return JSON.parse(localStorage.getItem('gnsi_lkout_' + (uname || '_')) || '{"count":0,"lockUntil":0}'); }
  catch (e) { return { count: 0, lockUntil: 0 }; }
}
function _setLockoutData(uname, data) {
  localStorage.setItem('gnsi_lkout_' + (uname || '_'), JSON.stringify(data));
  if (typeof _supa !== 'undefined' && _supa) {
    _supa.from('gnsi_keyvalue')
      .upsert({ key: 'gnsi_lkout_' + uname, value: JSON.stringify(data), updated_at: new Date().toISOString() }, { onConflict: 'key' })
      .catch(function () {});
  }
}
function _clearLockout(uname) {
  localStorage.removeItem('gnsi_lkout_' + (uname || '_'));
  if (typeof _supa !== 'undefined' && _supa) {
    _supa.from('gnsi_keyvalue').delete().eq('key', 'gnsi_lkout_' + uname).catch(function () {});
  }
}
function isLockedOut(uname) {
  var d = _getLockoutData(uname);
  if (d.lockUntil && Date.now() < d.lockUntil) {
    var secsLeft = Math.ceil((d.lockUntil - Date.now()) / 1000);
    return 'Account locked. Try again in ' + Math.floor(secsLeft / 60) + 'm ' + secsLeft % 60 + 's.';
  }
  if (d.lockUntil && Date.now() >= d.lockUntil) { _clearLockout(uname); }
  return false;
}
function recordLoginFail(uname) {
  var d = _getLockoutData(uname);
  d.count = (d.count || 0) + 1;
  if (d.count >= _LOCKOUT_MAX_FAILS) { d.lockUntil = Date.now() + _LOCKOUT_DURATION_MS; }
  _setLockoutData(uname, d);
  return d.count;
}

/* ── DEVICE-LEVEL RATE LIMITER ──────────────────────────────────────────── */
/* Stops someone from trying 100 different usernames from the same computer */
function _gnsiDeviceKey() {
  var fp = [screen.width, screen.height, screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language].join('|');
  var h = 0;
  for (var i = 0; i < fp.length; i++) { h = ((h << 5) - h) + fp.charCodeAt(i); h |= 0; }
  return 'gnsi_glb_lk_' + Math.abs(h).toString(36);
}
function gnsiGlobalRateCheck() {
  var key = _gnsiDeviceKey(), now = Date.now();
  try {
    var d = JSON.parse(localStorage.getItem(key) || '{"count":0,"windowStart":0,"lockedUntil":0}');
    if (d.lockedUntil && now < d.lockedUntil) {
      var mins = Math.ceil((d.lockedUntil - now) / 60000);
      return 'Too many login attempts from this device. Try again in ' + mins + ' minute' + (mins === 1 ? '' : 's') + '.';
    }
    if (d.lockedUntil && now >= d.lockedUntil) { d = { count: 0, windowStart: now, lockedUntil: 0 }; }
    return null;
  } catch (e) { return null; }
}
function gnsiGlobalRateRecord(success) {
  var key = _gnsiDeviceKey(), now = Date.now();
  try {
    var d = JSON.parse(localStorage.getItem(key) || '{"count":0,"windowStart":0,"lockedUntil":0}');
    if (success) { d = { count: 0, windowStart: 0, lockedUntil: 0 }; }
    else {
      if (now - d.windowStart > 3600000) { d = { count: 1, windowStart: now, lockedUntil: 0 }; }
      else { d.count = (d.count || 0) + 1; if (d.count >= 15) d.lockedUntil = now + 3600000; }
    }
    localStorage.setItem(key, JSON.stringify(d));
  } catch (e) {}
}

/* ── SESSION MANAGEMENT ─────────────────────────────────────────────────── */
/* Sessions are stored in sessionStorage (cleared when browser tab closes).
   They include an integrity token that makes them tamper-proof. */
function _sessionToken(userId, role) {
  var h = getStoredHash(userId) || ('nopass_' + userId);
  return _gnsiSignHash('GNSI_SESSION|' + userId + '|' + h + '|' + (role || ''));
}
function saveSession(u) {
  var tok  = _sessionToken(u.id, u.role);
  var _exp = Date.now() + (12 * 60 * 60 * 1000); /* 12-hour hard expiry */
  sessionStorage.setItem('gnsi_session', JSON.stringify(Object.assign({}, u, { _tok: tok, _exp: _exp })));
}
function loadSession() {
  try {
    var s = sessionStorage.getItem('gnsi_session');
    if (!s) return null;
    var parsed = JSON.parse(s);
    if (!parsed || !parsed.id) return null;
    if (parsed._exp && Date.now() > parsed._exp) { sessionStorage.removeItem('gnsi_session'); return null; }
    if (parsed._tok !== _sessionToken(parsed.id, parsed.role)) { sessionStorage.removeItem('gnsi_session'); return null; }
    return parsed;
  } catch (e) {}
  return null;
}
function clearSession() { sessionStorage.removeItem('gnsi_session'); }

/* ── LOGIN UI HELPERS ───────────────────────────────────────────────────── */
function showLoginError(msg) {
  var el = document.getElementById('login-error');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
  _loginFailCount++;
  if (_loginFailCount >= _LOCKOUT_MAX_FAILS) {
    var wrap = document.getElementById('reset-admin-wrap');
    if (wrap) wrap.style.display = 'block';
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   THE MAIN LOGIN FUNCTION
   Called when user clicks "Sign In" or presses Enter.
   ══════════════════════════════════════════════════════════════════════════ */
async function doLogin() {
  var unameEl = document.getElementById('login-username');
  var passEl  = document.getElementById('login-pass');
  if (!unameEl || !passEl) return;

  var uname = (unameEl.value || '').trim().toLowerCase();
  var pass  = passEl.value;

  if (!uname) { showLoginError('Please enter your username.'); return; }
  if (!pass)  { showLoginError('Please enter your password.'); return; }

  /* Rate limit checks */
  var _glbLock = gnsiGlobalRateCheck();
  if (_glbLock) { showLoginError(_glbLock); return; }
  var _lockMsg = isLockedOut(uname);
  if (_lockMsg) { showLoginError(_lockMsg); return; }

  /* Show loading state */
  var _btn = document.querySelector('.ls-btn') || document.querySelector('.login-btn');
  var _lvm = document.getElementById('login-verifying-msg');
  if (_btn) { _btn.textContent = 'Signing in…'; _btn.disabled = true; }
  if (_lvm) _lvm.style.display = 'block';

  function _restoreBtn() {
    if (_btn) { _btn.textContent = 'Sign In →'; _btn.disabled = false; }
    if (_lvm) _lvm.style.display = 'none';
  }

  try {
    /* ── PATH 1: Admin via PORTAL_USERS ────────────────────────────────── */
    var _pu      = window.PORTAL_USERS || {};
    var _puEntry = _pu[uname];

    if (_puEntry) {
      var _overrideHash = localStorage.getItem('gnsi_pu_hash_' + uname);
      var _adminOk      = false;

      if (_overrideHash) {
        /* PBKDF2 override exists — use it */
        if (_overrideHash.indexOf('gpv3_') === 0) {
          _adminOk = await verifyHashPassword(pass, _overrideHash);
        } else {
          /* Old SHA-256 override */
          var _sha256Input = await (function () {
            var data = new TextEncoder().encode(pass);
            return crypto.subtle.digest('SHA-256', data).then(function (buf) {
              return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
            });
          })();
          _adminOk = (_sha256Input === _overrideHash);
        }
      } else {
        /* No override — compare against the original SHA-256 in PORTAL_USERS */
        var _sha256Pass = await (function () {
          var data = new TextEncoder().encode(pass);
          return crypto.subtle.digest('SHA-256', data).then(function (buf) {
            return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
          });
        })();
        _adminOk = (_sha256Pass === _puEntry.hash);
        /* On success, upgrade to PBKDF2 for future logins */
        if (_adminOk) {
          try {
            var _pbkdf2Hash = await hashPassword(pass);
            localStorage.setItem('gnsi_pu_hash_' + uname, _pbkdf2Hash);
          } catch (e) {}
        }
      }

      /* Cloud fallback: password may have been changed on another device */
      if (!_adminOk && typeof _supa !== 'undefined' && _supa) {
        try {
          var _cloudRow = await _supa.from('gnsi_staff_credentials')
            .select('pwd_hash').eq('staff_id', _puEntry.staffId).maybeSingle();
          if (_cloudRow.data && _cloudRow.data.pwd_hash) {
            _adminOk = await verifyHashPassword(pass, _cloudRow.data.pwd_hash);
            if (_adminOk) {
              try { localStorage.setItem('gnsi_pu_hash_' + uname, _cloudRow.data.pwd_hash); } catch (e) {}
            }
          }
        } catch (e) {}
      }

      if (_adminOk) {
        _clearLockout(uname);
        gnsiGlobalRateRecord(true);
        var _member = (staff && staff.find(function (s) { return s.id === _puEntry.staffId; }))
          || { id: _puEntry.staffId, name: _puEntry.name || 'Administrator', role: _puEntry.staffRole || 'Head of the Institute', dept: '', status: 'Active' };
        currentUser = {
          id: _member.id, name: _member.name,
          role: _puEntry.role || 'admin', staffRole: _member.role,
          pages: (_puEntry.role === 'admin') ? ROLE_PAGES.admin : (ROLE_PAGES[_puEntry.role] || ROLE_PAGES.admin)
        };
        if (typeof applyPendingRolePages === 'function') applyPendingRolePages();
        saveSession(currentUser);
        _restoreBtn();
        hideLoginScreen();
        initApp();
        _gnsiRunPostLoginSync();
        /* Check must_change flag from Supabase (single source of truth) */
        (async function _checkMustChange() {
          var _localFlag = localStorage.getItem('gnsi_pu_must_change_' + uname) === '1';
          if (_localFlag) {
            setTimeout(function () { if (typeof gnsiShowForceChangePwd === 'function') gnsiShowForceChangePwd(_member.id, _member.name, false); }, 600);
            return;
          }
          if (typeof _supa !== 'undefined' && _supa) {
            try {
              var _cr = await _supa.from('gnsi_staff_credentials')
                .select('must_change, pwd_hash').eq('staff_id', _member.id).maybeSingle();
              if (_cr.data && _cr.data.must_change === '1') {
                setTimeout(function () { if (typeof gnsiShowForceChangePwd === 'function') gnsiShowForceChangePwd(_member.id, _member.name, false); }, 600);
              } else {
                try { localStorage.setItem('gnsi_pwd_ever_set_' + _member.id, '1'); localStorage.removeItem('gnsi_pu_must_change_' + uname); } catch (e) {}
              }
              if (_cr.data && _cr.data.pwd_hash) {
                try { localStorage.setItem('gnsi_pu_hash_' + uname, _cr.data.pwd_hash); } catch (e) {}
              }
            } catch (e) {}
          }
        })();
        return;
      }

      /* Wrong password for admin */
      var _fA = recordLoginFail(uname);
      var _rA = _LOCKOUT_MAX_FAILS - _fA;
      showLoginError(_rA > 0
        ? 'Incorrect password. ' + _rA + ' attempt' + (_rA === 1 ? '' : 's') + ' left before lockout.'
        : 'Too many failed attempts. Account locked for 15 minutes.');
      gnsiGlobalRateRecord(false);
      _restoreBtn();
      return;
    }

    /* ── PATH 2: Staff via Supabase gnsi_staff_credentials ─────────────── */
    if (typeof _supa === 'undefined' || !_supa) {
      showLoginError('No cloud connection. Cannot verify staff login. Please check your internet.');
      _restoreBtn();
      return;
    }

    var result = await _supa
      .from('gnsi_staff_credentials')
      .select('staff_id, uname, pwd_hash, must_change, role_key')
      .eq('uname', uname)
      .maybeSingle();

    if (result.error) { showLoginError('Login failed. Please try again.'); _restoreBtn(); return; }

    if (!result.data) {
      var _fS = recordLoginFail(uname);
      var _rS = _LOCKOUT_MAX_FAILS - _fS;
      showLoginError(_rS > 0
        ? 'Username not recognised. ' + _rS + ' attempt' + (_rS === 1 ? '' : 's') + ' left.'
        : 'Too many failed attempts. Account locked for 15 minutes.');
      gnsiGlobalRateRecord(false);
      _restoreBtn();
      return;
    }

    var row = result.data;
    if (!row.pwd_hash || !(await verifyHashPassword(pass, row.pwd_hash))) {
      var _fP = recordLoginFail(uname);
      var _rP = _LOCKOUT_MAX_FAILS - _fP;
      showLoginError(_rP > 0
        ? 'Incorrect password. ' + _rP + ' attempt' + (_rP === 1 ? '' : 's') + ' left before lockout.'
        : 'Too many failed attempts. Account locked for 15 minutes.');
      gnsiGlobalRateRecord(false);
      _restoreBtn();
      return;
    }

    /* ✅ Staff login successful */
    _clearLockout(uname);
    gnsiGlobalRateRecord(true);
    var staffMember = null;
    var sr = await _supa.from('staff').select('*').eq('id', row.staff_id).single();
    staffMember = (sr && sr.data) || { id: row.staff_id, name: uname, role: 'Staff', dept: '', status: 'Active' };
    var sysRole = row.role_key || (typeof detectRole === 'function' ? detectRole(staffMember) : 'staff');
    currentUser = {
      id: staffMember.id, name: staffMember.name,
      role: sysRole, staffRole: staffMember.role,
      pages: ROLE_PAGES[sysRole] || ROLE_PAGES.staff
    };
    if (typeof applyPendingRolePages === 'function') applyPendingRolePages();
    saveSession(currentUser);
    _restoreBtn();
    hideLoginScreen();
    initApp();
    _gnsiRunPostLoginSync();
    if (row.must_change === '1') {
      setTimeout(function () { if (typeof gnsiShowForceChangePwd === 'function') gnsiShowForceChangePwd(staffMember.id, staffMember.name, false); }, 600);
    } else {
      try { localStorage.setItem('gnsi_pwd_ever_set_' + staffMember.id, '1'); } catch (e) {}
    }

  } catch (e) {
    console.error('[GNSI Auth] doLogin unexpected error:', e);
    showLoginError('Sign in failed unexpectedly. Please try again.');
    _restoreBtn();
  }
}

console.log('[GNSI] core/auth.js loaded ✓');
