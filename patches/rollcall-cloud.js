/* ═══════════════════════════════════════════════════════════════════
   GNSI PORTAL — patches/rollcall-cloud.js
   Fixes hmsSubmitRollCall to also save to Supabase.

   HOW TO USE:
   1. Add this line to index.html at the very bottom of <body>,
      after all other patch scripts:
      <script src="patches/rollcall-cloud.js"></script>

   2. Run this SQL once in your Supabase SQL Editor:

      CREATE TABLE IF NOT EXISTS gnsi_rollcall (
        id          BIGSERIAL PRIMARY KEY,
        house       TEXT NOT NULL,
        roll_date   DATE NOT NULL,
        session     TEXT NOT NULL,
        total       INT  DEFAULT 0,
        present     INT  DEFAULT 0,
        absent      INT  DEFAULT 0,
        on_leave    INT  DEFAULT 0,
        outpass     INT  DEFAULT 0,
        taken_by    TEXT,
        marks       JSONB,
        school_id   TEXT,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );
      ALTER TABLE gnsi_rollcall ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "anon full access" ON gnsi_rollcall FOR ALL TO anon USING (true) WITH CHECK (true);

   That is it. Roll calls will now sync to all devices in real time.
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* Wait until hmsSubmitRollCall is defined, then patch it */
  function _patch() {
    if (typeof hmsSubmitRollCall !== 'function') {
      setTimeout(_patch, 300);
      return;
    }
    if (hmsSubmitRollCall._cloudPatched) return;

    var _orig = hmsSubmitRollCall;

    hmsSubmitRollCall = function () {
      /* Run the original function first — it saves to localStorage */
      _orig();

      /* Now also save to Supabase */
      var _supa = window._supa;
      if (!_supa) return; /* offline — localStorage already has it */

      /* Read the record that was just saved */
      try {
        var data    = hmsArr('rollcall');
        var latest  = data[data.length - 1];
        if (!latest) return;

        var schoolId = (window.TENANT && window.TENANT.id) ? window.TENANT.id : null;

        var row = {
          house:      latest.house,
          roll_date:  latest.date,
          session:    latest.session,
          total:      latest.total    || 0,
          present:    latest.present  || 0,
          absent:     latest.absent   || 0,
          on_leave:   latest.onLeave  || 0,
          outpass:    latest.outpass  || 0,
          taken_by:   latest.takenBy  || '',
          marks:      latest.marks    || {},
          school_id:  schoolId,
          created_at: new Date().toISOString()
        };

        if (typeof setSyncStatus === 'function') setSyncStatus('syncing');

        _supa.from('gnsi_rollcall')
          .insert(row)
          .then(function (result) {
            if (result && result.error) {
              console.error('[GNSI RollCall] Supabase save error:', result.error);
              if (typeof setSyncStatus === 'function') setSyncStatus('error');
              return;
            }
            if (typeof setSyncStatus === 'function') setSyncStatus('synced');
            console.log('[GNSI RollCall] Saved to cloud ✓ House:', latest.house, 'Session:', latest.session);
          })
          .catch(function (e) {
            console.error('[GNSI RollCall] Supabase save failed:', e);
            if (typeof setSyncStatus === 'function') setSyncStatus('error');
            /* Queue for retry */
            try {
              var q = JSON.parse(localStorage.getItem('gnsi_offline_queue') || '[]');
              q.push({ type: 'insert', table: 'gnsi_rollcall', data: row, ts: Date.now() });
              localStorage.setItem('gnsi_offline_queue', JSON.stringify(q));
            } catch (qe) { console.error('[GNSI RollCall] Queue error:', qe); }
          });

      } catch (e) {
        console.error('[GNSI RollCall] patch error:', e);
      }
    };

    hmsSubmitRollCall._cloudPatched = true;
    console.log('[GNSI] patches/rollcall-cloud.js applied ✓');
  }

  /* Start patching after DOM is ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _patch);
  } else {
    setTimeout(_patch, 500);
  }

})();
