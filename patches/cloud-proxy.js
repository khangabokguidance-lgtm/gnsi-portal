/* GNSI PORTAL — patches/cloud-proxy.js
   GNSI CLOUD MODE v1.0 — localStorage → Supabase KV Proxy
   Intercepts localStorage globally. Load FIRST before any other script.
   This patch was at lines 47-250 of the original portal HTML. */

(function _gnsiCloudProxy() {
  'use strict';

  /* ── Keys that must STAY device-local (never sent to Supabase) ── */
  var LOCAL_ONLY = {
    'gnsi_jwt_token':1,'gnsi_jwt_user':1,'gnsi_current_user':1,
    'ims_loggedin':1,'gnsi_session':1,'gnsi_dark_mode':1,
    'gnsi_pwa_dismissed':1,'gnsi_cmd_hint_shown':1,'gnsi_exam_preferred':1,
    'gnsi_exam_class_mode':1,'gnsi_active_school_code':1,'gnsi_rls_fix_applied':1,
    '_gnsi_rls_dismissed':1,'_gnsi_att_last_fetch':1,'_gnsi_otp_new_pwd':1,
    'gnsi_kv_bulk_ts':1,'_gnsi_cloud_backup_ts':1,'_gnsi_cloud_backup_date':1,
    '_gnsi_fin_ts':1,'_gnsi_kv_last_pull':1,'gnsi_offline_queue':1,
    'gnsi_offline_queue':1,'gnsi_push_enabled':1,'gnsi_fcm_server_key':1,
    'gnsi_ai_key_warned':1,'gnsi_staff_ver':1,'gnsi_adm_index':1,
    'gnsi_reset_pin':1,'gnsi_sm_last_cleanup':1,'gnsi_notif_read_ids':1,
    'gnsi_patch_dress':1,'_gnsi_creds_cleaned_v2':1,'__gnsi_sb_chk__':1,
    'gnsi_rls_fix_applied':1,'ims_syncconf':1,'ims_synclog':1,
  };

  /* Prefix patterns that are always device-local */
  var LOCAL_PREFIXES = [
    'gnsi_kv_ts_','gnsi_pwd_','gnsi_pwd_changed_','gnsi_pwd_must_change_',
    'gnsi_pwd_ever_set_',
    'gnsi_uname_','gnsi_role_','gnsi_role_sig_','gnsi_lkout_','gnsi_otp_',
    'gnsi_otp_exp_','gnsi_otp_hash_','gnsi_pu_hash_','gnsi_pu_must_change_',
    'gnsi_sched_check_','gnsi_em_','gnsi_nts_','gnsi_rc_','gnsi_tp_',
    'gnsi_ts_','gnsi_fac_goals_','gnsi_hm_','gnsi_hms_','gnsi_hmsa_',
    'gnsi_kit_','gnsi_fee_','gnsi_lb_','gnsi_er_','archive_',
    'gnsi_data_perms',
  ];

  function _isLocalOnly(key) {
    if (!key) return true;
    if (LOCAL_ONLY[key]) return true;
    for (var i = 0; i < LOCAL_PREFIXES.length; i++) {
      if (key.indexOf(LOCAL_PREFIXES[i]) === 0) return true;
    }
    return false;
  }

  /* ── Write queue: batches cloud writes to avoid hammering Supabase ── */
  var _writeQueue = {};
  var _writeTimer = null;
  var _WRITE_DEBOUNCE = 800; /* ms — coalesces rapid writes */

  function _flushWrites() {
    _writeTimer = null;
    var keys = Object.keys(_writeQueue);
    if (!keys.length) return;
    var batch = _writeQueue;
    _writeQueue = {};

    /* Use gnsiKVPush if available, otherwise queue for later */
    if (typeof window.gnsiKVPush === 'function') {
      keys.forEach(function(k) {
        try { window.gnsiKVPush(k, batch[k]); } catch(e) {}
      });
    } else {
      /* gnsiKVPush not yet loaded — retry after init */
      var _retryTs = Date.now();
      var _retry = setInterval(function() {
        if (typeof window.gnsiKVPush === 'function') {
          clearInterval(_retry);
          keys.forEach(function(k) {
            try { window.gnsiKVPush(k, batch[k]); } catch(e) {}
          });
        } else if (Date.now() - _retryTs > 15000) {
          clearInterval(_retry); /* give up after 15s */
        }
      }, 500);
    }
  }

  function _scheduleWrite(key, value) {
    try {
      _writeQueue[key] = (value !== null && value !== undefined)
        ? JSON.parse(value)   /* store parsed — KV handles serialisation */
        : value;
    } catch(e) {
      _writeQueue[key] = value; /* not JSON — store as string */
    }
    clearTimeout(_writeTimer);
    _writeTimer = setTimeout(_flushWrites, _WRITE_DEBOUNCE);
  }

  /* ── Override localStorage prototype methods ── */
  var _realSet = Storage.prototype.setItem;
  var _realGet = Storage.prototype.getItem;
  var _realRem = Storage.prototype.removeItem;

  Storage.prototype.setItem = function(key, value) {
    _realSet.call(this, key, value);           /* always write locally first */
    if (this === window.localStorage && !_isLocalOnly(key)) {
      _scheduleWrite(key, value);              /* then schedule cloud write */
    }
  };

  Storage.prototype.removeItem = function(key) {
    _realRem.call(this, key);
    if (this === window.localStorage && !_isLocalOnly(key)) {
      /* Push null to mark deletion in KV */
      _writeQueue[key] = null;
      clearTimeout(_writeTimer);
      _writeTimer = setTimeout(_flushWrites, _WRITE_DEBOUNCE);
    }
  };

  /* getItem: return from localStorage cache (already seeded by gnsiKVPullAll on login) */
  /* No override needed — reads are served from local cache which is kept fresh by:
     1. gnsiKVPullAll() on login (seeds all KV keys into localStorage)
     2. Supabase realtime channel on gnsi_keyvalue table (updates localStorage on change)  */

  /* ── Cloud seeder: on login, pull ALL cloud KV values into localStorage ── */
  window._gnsiCloudSeed = function() {
    if (typeof window.gnsiKVPullAll !== 'function') return;
    if (window._gnsiCloudSeeded) return;
    window._gnsiCloudSeeded = true;
    window.gnsiKVPullAll(function(data) {
      if (!data) return;
      /* data is array of {key, value} from gnsi_keyvalue table */
      (Array.isArray(data) ? data : []).forEach(function(row) {
        if (!row || !row.key) return;
        if (_isLocalOnly(row.key)) return;
        try {
          var v = (row.value !== null && row.value !== undefined)
            ? (typeof row.value === 'string' ? row.value : JSON.stringify(row.value))
            : null;
          if (v !== null) _realSet.call(window.localStorage, row.key, v);
          else _realRem.call(window.localStorage, row.key);
        } catch(e) {}
      });
      if (typeof window.render === 'function') window.render();
      if (typeof window.setSyncStatus === 'function') window.setSyncStatus('live');
    });
  };

  /* ── Realtime KV listener: apply cloud changes from other devices ── */
  window._gnsiCloudWatchKV = function(supaClient) {
    if (!supaClient || window._gnsiKVWatching) return;
    window._gnsiKVWatching = true;
    try {
      supaClient
        .channel('gnsi_kv_cloud')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'gnsi_keyvalue'
        }, function(payload) {
          var row = payload.new || payload.old;
          if (!row || !row.key || _isLocalOnly(row.key)) return;
          if (payload.eventType === 'DELETE') {
            _realRem.call(window.localStorage, row.key);
          } else {
            try {
              var v = (row.value !== null && row.value !== undefined)
                ? (typeof row.value === 'string' ? row.value : JSON.stringify(row.value))
                : null;
              if (v !== null) _realSet.call(window.localStorage, row.key, v);
            } catch(e) {}
          }
          /* Re-render if the changed key affects visible data */
          var RENDER_KEYS = ['ims_staff','ims_students','ims_notices','ims_att',
            'gnsi_fee_asgns','gnsi_classes','gnsi_exam','gnsi_exam_results',
            'gnsi_audit_log','gnsi_activity_feed','gnsi_school_settings'];
          if (RENDER_KEYS.indexOf(row.key) >= 0) {
            if (typeof window.render === 'function') {
              clearTimeout(window._gnsiKVRenderDebounce);
              window._gnsiKVRenderDebounce = setTimeout(window.render, 300);
            }
          }
        })
        .subscribe();
    } catch(e) {}
  };

  /* ── Status indicator update ── */
  window._gnsiCloudMode = true;
  try { (console.info || console.log || function(){})(
    '[GNSI Cloud] localStorage proxy active — data keys route to Supabase KV'
  ); } catch(e) {}

  /* ── Reapply overrides after the localStorage shim (which may replace the object) ── */
  document.addEventListener('DOMContentLoaded', function() {
    /* If shim replaced localStorage with a plain object (not Storage),
       re-wrap its setItem/removeItem with our cloud routing logic */
    var ls = window.localStorage;
    if (ls && typeof ls.setItem === 'function' && !(ls instanceof Storage)) {
      var _shimSet = ls.setItem.bind(ls);
      var _shimRem = ls.removeItem.bind(ls);
      ls.setItem = function(key, value) {
        _shimSet(key, value);
        if (!_isLocalOnly(key)) _scheduleWrite(key, value);
      };
      ls.removeItem = function(key) {
        _shimRem(key);
        if (!_isLocalOnly(key)) {
          _writeQueue[key] = null;
          clearTimeout(_writeTimer);
          _writeTimer = setTimeout(_flushWrites, _WRITE_DEBOUNCE);
        }
      };
    }
  });
})();
</script>
