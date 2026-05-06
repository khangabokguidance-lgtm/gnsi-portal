/**
 * GNSI Storage Polyfill — patches/storage-polyfill.js
 * =====================================================
 * Drop-in replacement for localStorage that works everywhere:
 *   • Tries real localStorage first (standard browsers)
 *   • Falls back to in-memory store if localStorage is blocked,
 *     unavailable (iOS private mode, sandboxed iframes, Claude.ai
 *     artifacts, certain WebViews), or throws a SecurityError.
 *
 * USAGE: Load this as the VERY FIRST <script> in <head>, before
 * cloud-proxy.js and performance.js:
 *
 *   <script src="patches/storage-polyfill.js"></script>
 *
 * No other code changes required — localStorage.getItem / setItem /
 * removeItem / clear / key / length all behave identically.
 *
 * Persistence options (in priority order):
 *   1. Real localStorage  — survives page refresh, works cross-tab
 *   2. sessionStorage     — survives soft navigation, lost on tab close
 *   3. In-memory Map      — lost on page refresh, but never throws
 *
 * The polyfill also exposes:
 *   window.GNSI_STORAGE_BACKEND  — 'localStorage' | 'sessionStorage' | 'memory'
 *   window.GNSI_STORAGE_EXPORT() — returns plain object of all stored keys
 *   window.GNSI_STORAGE_IMPORT(obj) — bulk-loads a plain object
 */

(function (global) {
  'use strict';

  /* ─── 1. Detect which backend actually works ─────────────────────────── */

  function probe(storage) {
    try {
      var k = '__gnsi_probe__';
      storage.setItem(k, '1');
      storage.removeItem(k);
      return true;
    } catch (e) {
      return false;
    }
  }

  var backend = 'memory';
  var realStorage = null;

  if (typeof window !== 'undefined') {
    try {
      if (probe(window.localStorage)) {
        realStorage = window.localStorage;
        backend = 'localStorage';
      } else if (probe(window.sessionStorage)) {
        realStorage = window.sessionStorage;
        backend = 'sessionStorage';
      }
    } catch (e) { /* security policy blocked access entirely */ }
  }

  /* ─── 2. In-memory fallback ──────────────────────────────────────────── */

  var _mem = Object.create(null); // plain dict, no prototype pollution

  var memStorage = {
    get length() {
      return Object.keys(_mem).length;
    },
    key: function (n) {
      return Object.keys(_mem)[n] || null;
    },
    getItem: function (k) {
      return Object.prototype.hasOwnProperty.call(_mem, k) ? _mem[k] : null;
    },
    setItem: function (k, v) {
      _mem[String(k)] = String(v);
    },
    removeItem: function (k) {
      delete _mem[k];
    },
    clear: function () {
      _mem = Object.create(null);
    }
  };

  /* ─── 3. Unified façade ──────────────────────────────────────────────── */

  var store = realStorage || memStorage;

  /**
   * Safe wrapper — if the chosen backend throws mid-use (e.g. quota
   * exceeded on localStorage), it transparently falls back to memory.
   */
  function safeOp(method, args) {
    try {
      return store[method].apply(store, args);
    } catch (e) {
      if (store !== memStorage) {
        console.warn('[GNSI Storage] ' + backend + ' failed (' + e.message +
          '), falling back to memory for this operation.');
        store = memStorage;
        backend = 'memory';
        global.GNSI_STORAGE_BACKEND = backend;
      }
      try { return memStorage[method].apply(memStorage, args); } catch (e2) {}
      return null;
    }
  }

  /* ─── 4. Build the public Storage-like object ────────────────────────── */

  var gnsiStorage = {
    get length() { try { return store.length; } catch(e) { return Object.keys(_mem).length; } },

    key       : function (n)    { return safeOp('key',        [n]);    },
    getItem   : function (k)    { return safeOp('getItem',    [k]);    },
    setItem   : function (k, v) { return safeOp('setItem',    [k, v]); },
    removeItem: function (k)    { return safeOp('removeItem', [k]);    },
    clear     : function ()     { return safeOp('clear',      []);     }
  };

  /* ─── 5. Patch window.localStorage ──────────────────────────────────── */

  if (backend !== 'localStorage') {
    // Only patch if real localStorage isn't usable
    try {
      Object.defineProperty(global, 'localStorage', {
        get : function () { return gnsiStorage; },
        set : function () { /* ignore reassignment attempts */ },
        configurable: true
      });
      console.info('[GNSI Storage] localStorage patched → using ' + backend + ' backend.');
    } catch (e) {
      // defineProperty blocked (very old browsers) — just assign
      try { global.localStorage = gnsiStorage; } catch (e2) {}
      console.info('[GNSI Storage] localStorage assigned (fallback patch) → ' + backend);
    }
  } else {
    console.info('[GNSI Storage] Real localStorage is available ✓');
  }

  /* ─── 6. Expose diagnostics & helpers ───────────────────────────────── */

  global.GNSI_STORAGE_BACKEND = backend;

  /** Export all current storage contents as a plain JS object */
  global.GNSI_STORAGE_EXPORT = function () {
    var out = {};
    try {
      var len = store.length;
      for (var i = 0; i < len; i++) {
        var k = store.key(i);
        if (k !== null) out[k] = store.getItem(k);
      }
    } catch (e) {
      // memory fallback
      Object.assign(out, _mem);
    }
    return out;
  };

  /** Import a plain object into storage (useful for seeding state) */
  global.GNSI_STORAGE_IMPORT = function (obj) {
    if (!obj || typeof obj !== 'object') return;
    Object.keys(obj).forEach(function (k) {
      safeOp('setItem', [k, obj[k]]);
    });
  };

  /* ─── 7. Warn about specific GNSI keys that must survive reloads ─────── */

  if (backend === 'memory') {
    var _warned = false;
    var _origSet = gnsiStorage.setItem.bind(gnsiStorage);
    gnsiStorage.setItem = function (k, v) {
      if (!_warned && (
        k === 'gnsi_jwt_token' || k === 'gnsi_current_user' ||
        k === 'gnsi_active_school_code' || k === 'gnsi_school_settings'
      )) {
        console.warn(
          '[GNSI Storage] ⚠ Writing session-critical key "' + k + '" to IN-MEMORY ' +
          'storage. Data will be lost on page refresh. ' +
          'This usually means localStorage is blocked by your browser or environment.'
        );
        _warned = true;
      }
      return _origSet(k, v);
    };
  }

})(typeof globalThis !== 'undefined' ? globalThis : window);
