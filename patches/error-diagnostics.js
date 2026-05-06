/**
 * GNSI Error Diagnostics — patches/error-diagnostics.js
 * ======================================================
 * Load FIRST in <head> before all other scripts.
 * Intercepts all errors and gives real messages + stack traces.
 *
 * Console helpers:
 *   GNSI_ERROR_SUMMARY()  → grouped summary of all errors
 *   GNSI_ERROR_LOG        → full array of every error
 *   GNSI_CLEAR_ERRORS()   → reset the log
 */
(function (global) {
  'use strict';

  var _log = [];
  var _orig = {
    error: console.error.bind(console),
    warn:  console.warn.bind(console),
    info:  console.info.bind(console)
  };

  function getStack() {
    try { throw new Error(); }
    catch (e) {
      return (e.stack || '').split('\n').slice(3).slice(0, 5).join('\n');
    }
  }

  function stringify(val) {
    if (!val) return 'null/undefined';
    if (typeof val === 'string') return val;
    if (val instanceof Error) return val.message;
    // Supabase error object
    if (val.message || val.code || val.details || val.hint) {
      var parts = [];
      if (val.code)    parts.push('code=' + val.code);
      if (val.message) parts.push(val.message);
      if (val.details) parts.push('details: ' + val.details);
      if (val.hint)    parts.push('hint: ' + val.hint);
      return parts.join(' | ');
    }
    try { return JSON.stringify(val); } catch(e) { return String(val); }
  }

  function categorise(msg) {
    if (/DB error|students\.|notices\.|fees\.|attendance\.|gnsi_keyvalue|staff\./i.test(msg)) return 'supabase-db';
    if (/caught error/i.test(msg))    return 'js-exception';
    if (/sync error/i.test(msg))      return 'supabase-sync';
    if (/RLS|permission denied/i.test(msg)) return 'supabase-rls';
    if (/network|fetch|failed to fetch/i.test(msg)) return 'network';
    if (/storage|localStorage/i.test(msg)) return 'storage';
    return 'gnsi-misc';
  }

  console.error = function () {
    var args  = Array.prototype.slice.call(arguments);
    var msg   = args.map(stringify).join(' ');
    var entry = {
      ts      : new Date().toISOString(),
      category: categorise(msg),
      message : msg,
      stack   : getStack()
    };
    _log.push(entry);

    _orig.error(
      '%c[GNSI ' + entry.category.toUpperCase() + ']%c ' + entry.ts.slice(11,19) + ' → ' + msg,
      'color:#dc2626;font-weight:bold', 'color:inherit'
    );
    if (entry.stack) _orig.error('  at:', entry.stack);
  };

  global.addEventListener('unhandledrejection', function (ev) {
    var msg = stringify(ev.reason);
    var entry = { ts: new Date().toISOString(), category: 'unhandled-promise', message: msg, stack: ev.reason && ev.reason.stack || getStack() };
    _log.push(entry);
    _orig.error('[GNSI UNHANDLED-PROMISE]', msg, '\n', entry.stack);
  });

  global.addEventListener('error', function (ev) {
    var entry = { ts: new Date().toISOString(), category: 'global-js-error', message: ev.message + ' at ' + ev.filename + ':' + ev.lineno, stack: ev.error && ev.error.stack || '' };
    _log.push(entry);
    _orig.error('[GNSI GLOBAL-ERROR]', entry.message);
  });

  global.GNSI_ERROR_LOG = _log;

  global.GNSI_ERROR_SUMMARY = function () {
    var groups = {};
    _log.forEach(function (e) {
      groups[e.category] = (groups[e.category] || []);
      groups[e.category].push(e);
    });
    _orig.info('=== GNSI Error Summary (' + _log.length + ' total) ===');
    Object.keys(groups).sort().forEach(function (cat) {
      _orig.info('  [' + cat + '] × ' + groups[cat].length);
      groups[cat].slice(0, 3).forEach(function (e) {
        _orig.info('    ' + e.ts.slice(11,19) + ' → ' + e.message.slice(0, 150));
      });
    });
    return groups;
  };

  global.GNSI_CLEAR_ERRORS = function () { _log.length = 0; _orig.info('[GNSI] Error log cleared.'); };

  _orig.info('%c[GNSI Error Diagnostics] Active — run GNSI_ERROR_SUMMARY() anytime to review errors.', 'color:#1433a8;font-weight:bold');
})(window);
