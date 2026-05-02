/* GNSI PORTAL — modules/notices.js
   Pages: notices
   DEPENDS ON: core/utils.js, core/state.js */

function renderNotices(){
  var isEdit = !!_noticeEditId;
  var editN  = isEdit ? (notices.find(function(n){return n.id===_noticeEditId;})||{}) : {};
  var canPost = canDo('add','notices');
  var canEdit = canDo('edit','notices');
  var canDel  = canDo('del','notices');
  /* ── Form (add or edit) ── */
  var formHTML = '';
  if(showAddNotice || isEdit){
    var formColor = isEdit ? '#f59e0b' : '#8b5cf6';
    var formTitle = isEdit ? '✏️ Edit Notice' : '📢 Post New Notice';
    formHTML = '<div class="form-panel" style="border-color:'+formColor+'">'
      +'<div class="form-title" style="color:'+formColor+'">'+formTitle+'</div>'
      +'<div class="form-grid g23">'
      +'<div class="form-group"><label>Notice Title *</label>'
      +'<input id="nn-title" placeholder="e.g. Examination Schedule" value="'+esc(editN.title||'')+'"/></div>'
      +'<div class="form-group"><label>Priority</label>'
      +'<select id="nn-priority">'
      +'<option'+(( editN.priority||'Medium')==='High'?' selected':'')+'>High</option>'
      +'<option'+(((!editN.priority||editN.priority==='Medium'))?' selected':'')+'>Medium</option>'
      +'<option'+(( editN.priority)==='Low'?' selected':'')+'>Low</option>'
      +'</select></div></div>'
      +'<div class="form-group" style="margin-bottom:16px"><label>Notice Content</label>'
      +'<textarea id="nn-body" placeholder="Enter notice details here...">'+esc(editN.body||'')+'</textarea></div>'
      +'<div style="background:#e0f2fe;border:1px solid #7dd3fc;border-radius:8px;padding:8px 12px;margin-bottom:14px;font-size:12px;color:#0369a1">'
      +'☁️ This notice will sync to Supabase and be visible to all logged-in users immediately.'
      +'</div>'
      +'<div class="form-actions">'
      +(isEdit
        ? '<button class="btn btn-primary" style="background:#f59e0b" onclick="saveEditNotice()">✅ Save Changes</button>'
        : '<button class="btn btn-primary" onclick="addNotice()">📢 Post Notice</button>')
      +'<button class="btn btn-outline" onclick="showAddNotice=false;_noticeEditId=null;render()">Cancel</button>'
      +'</div></div>';
  }
  /* ── Notice cards ── */
  var cards = notices.map(function(n){
    var editing = _noticeEditId === n.id;
    return '<div class="notice-card" style="--nc:'+pc(n.priority)+';outline:'+(editing?'2px solid #f59e0b':'none')+'">'
      +'<div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:8px">'
      +badge(n.priority,pc(n.priority))
      +'<div style="font-size:15px;font-weight:700;flex:1;margin:0 8px">'+esc(n.title)+'</div>'
      +'<div style="display:flex;gap:6px;flex-shrink:0">'
      +(canEdit?'<button onclick="_noticeEditId='+parseInt(n.id,10)+';showAddNotice=false;render()" title="Edit" style="background:none;border:none;cursor:pointer;font-size:14px;color:var(--muted)">✏️</button>':'')
      +(canDel?'<button onclick="removeNotice('+parseInt(n.id,10)+')" title="Delete" style="background:none;border:none;cursor:pointer;font-size:16px;color:var(--muted)">&times;</button>':'')
      +'</div></div>'
      +'<div style="font-size:11px;color:var(--muted);font-family:JetBrains Mono,monospace;margin-bottom:10px">📅 '+fmtDate(n.date)+'</div>'
      +'<div style="font-size:13px;color:var(--muted);line-height:1.65">'+esc(n.body)+'</div>'
      +'</div>';
  }).join('');
  /* ── Sync badge ── */
  var syncBadge = _supa
    ? '<span style="font-size:11px;font-weight:700;color:#16a34a;background:#dcfce7;border:1px solid #86efac;border-radius:6px;padding:2px 10px;margin-left:8px">☁️ Cloud Sync ON</span>'
    : '<span style="font-size:11px;font-weight:700;color:#92400e;background:#fef3c7;border:1px solid #fde68a;border-radius:6px;padding:2px 10px;margin-left:8px">⚠️ Offline Mode</span>';
  return '<div class="toolbar">'
    +'<div style="display:flex;align-items:center;gap:0">'+syncBadge+'</div>'
    +'<div style="flex:1"></div>'
    +(canPost?'<button class="btn btn-primary" onclick="showAddNotice=!showAddNotice;_noticeEditId=null;render()">+ Post Notice</button>':'')
    +'</div>'
    +formHTML
    +(notices.length ? cards : '<div style="text-align:center;padding:60px;color:var(--muted)">No notices posted yet.</div>');
}
function toggleAddNotice(){showAddNotice=!showAddNotice;_noticeEditId=null;render();}
function saveEditNotice(){
  var _gnsiAllowed=['admin','manager'];
  if(!currentUser||_gnsiAllowed.indexOf(currentUser.role)<0){
    if(typeof showToast==='function')showToast('🔒 Access denied: Edit notice','#dc2626');
    return;
  }

  var id    = _noticeEditId;
  var title = ((document.getElementById('nn-title')||{}).value||'').trim();
  if(!title){showToast('⚠️ Title is required.','#ea580c');return;}
  var priority = (document.getElementById('nn-priority')||{value:'Medium'}).value;
  var body     = ((document.getElementById('nn-body')||{}).value||'').trim();
  var dateStr  = new Date().toISOString().split('T')[0];
  /* Update local immediately */
  notices = notices.map(function(n){
    return n.id===id ? Object.assign({},n,{title:title,priority:priority,body:body}) : n;
  });
  /* [SUPABASE-ONLY] localStorage write removed: ims_notices */
  /* [SUPABASE-ONLY] gnsiKVPush removed */
  _noticeEditId = null; showAddNotice = false; render();
  if(_supa){
    setSyncStatus('syncing');
    _supa.from('notices').update({
      title:       title,
      body:        body,
      priority:    priority
    }).eq('id', id)
      .then(function(r){
        if(r.error) throw r.error;
        setSyncStatus('synced');
        showToast('✅ Notice updated — all users see the change','#16a34a');
      })
      .catch(function(e){
        setSyncStatus('error');
        (void 0);
        showToast('⚠️ Saved locally — sync failed','#f59e0b');
      });
  } else {
    showToast('Notice updated (offline)','#f59e0b');
  }
}
function addNotice(){
  var _gnsiAllowed=['admin','manager'];
  if(!currentUser||_gnsiAllowed.indexOf(currentUser.role)<0){
    if(typeof showToast==='function')showToast('🔒 Access denied: Post notice','#dc2626');
    return;
  }

  var title=((document.getElementById('nn-title')||{}).value||'').trim();
  if(!title){showToast('⚠️ Title is required.','#ea580c');return}
  var priority = document.getElementById('nn-priority').value;
  var body = (document.getElementById('nn-body').value||'').trim();
  var dateStr = new Date().toISOString().split('T')[0];
  if (_supa) {
    /* Direct Supabase INSERT — visible to all users immediately via realtime */
    setSyncStatus('syncing');
    _supa.from('notices').insert({
      title:       title,
      body:        body,
      priority:    priority,
      notice_date: dateStr,
      is_archived: false
    }).select().then(function(result){
      if (result.error) throw result.error;
      var inserted = result.data && result.data[0];
      if (inserted) {
        /* Add to local array with the real Supabase-assigned id */
        notices.unshift({
          id:       inserted.id,
          title:    inserted.title,
          body:     inserted.body || '',
          priority: inserted.priority,
          date:     (inserted.notice_date||dateStr).split('T')[0]
        });
        if (inserted.id > nextId) nextId = inserted.id;
      }
      /* [SUPABASE-ONLY] localStorage write removed: ims_notices */
      /* [SUPABASE-ONLY] gnsiKVPush removed */
      setSyncStatus('synced');
      showToast('✅ Notice posted — visible to all users now','#16a34a');
      showAddNotice=false; render();
    }).catch(function(e){
      (void 0);
      /* Fallback: save locally and queue */
      notices.unshift({id:++nextId,title:title,priority:priority,body:body,date:dateStr});
      /* [SUPABASE-ONLY] localStorage write removed: ims_notices */
      /* [SUPABASE-ONLY] gnsiKVPush removed */
      setSyncStatus('error');
      showToast('⚠️ Saved locally — will sync when online','#f59e0b');
      showAddNotice=false; render();
    });
  } else {
    /* Offline — local only */
    notices.unshift({id:++nextId,title:title,priority:priority,body:body,date:dateStr});
    /* [SUPABASE-ONLY] localStorage write removed: ims_notices */
    /* [SUPABASE-ONLY] gnsiKVPush removed */
    showToast('Notice posted (offline — will sync when connected)','#f59e0b');
    showAddNotice=false; render();
  }
}
function removeNotice(id){
  var _gnsiAllowed=['admin','manager'];
  if(!currentUser||_gnsiAllowed.indexOf(currentUser.role)<0){
    if(typeof showToast==='function')showToast('🔒 Access denied: Delete notice','#dc2626');
    return;
  }

  if(!confirm('Delete this notice?'))return;
  /* Remove locally immediately */
  notices=notices.filter(function(n){return n.id!==id});
  /* [SUPABASE-ONLY] localStorage write removed: ims_notices */
  /* [SUPABASE-ONLY] gnsiKVPush removed */
  render();
  if (_supa) {
    setSyncStatus('syncing');
    /* Soft-archive first (keeps audit trail), fallback to hard delete */
    _supa.from('notices').update({is_archived:true}).eq('id', id)
      .then(function(r){
        if(r.error) throw r.error;
        setSyncStatus('synced');
        showToast('🗑 Notice removed — all users updated','#64748b');
      })
      .catch(function(e){
        (void 0);
        _supa.from('notices').delete().eq('id', id)
          .then(function(){
            setSyncStatus('synced');
            showToast('🗑 Notice deleted','#64748b');
          })
          .catch(function(e2){
            setSyncStatus('error');
            (void 0);
            /* Queue for retry */
            var q = JSON.parse(localStorage.getItem('gnsi_offline_queue') || '[]');
            q.push({type:'delete', table:'notices', id:id, ts: Date.now()});
            localStorage.setItem('gnsi_offline_queue', JSON.stringify(q));
          });
      });
  }
}
function markFeePaid(id){
  students=students.map(function(s){return s.id===id?Object.assign({},s,{fees:'Paid'}):s;});
  render();
  /* Instant update in fee_payments table */
  if(_supa){
    _supa.from('fee_payments').upsert({
      student_id: id,
      fee_type:   'Tuition',
      status:     'Paid',
      paid_at:    new Date().toISOString(),
      marked_by:  (typeof currentUser!=='undefined'&&currentUser)?currentUser.name:''
    }, { onConflict: 'student_id,fee_type' })
    .then(function(){ setSyncStatus('synced'); })
    .catch(function(){ setSyncStatus('error'); });
  }
}
// -- TIMETABLE (Editable) --------------------------------------
// -- PALETTE for auto-assigning column colours ------------------
var TT_PALETTE=['#1435a0','#8b5cf6','#3b78c9','#0891b2','#d4a853','#dc2626','#16a34a','#ea580c','#db2777','#059669','#7c3aed','#b45309'];
function loadTTCols(){
  var s=localStorage.getItem('ims_tt_cols');
  if(s){try{return JSON.parse(s)}catch(e){}}
  // No default columns — batches are configured per school after login
  return [];
}
function saveTTCols(cols){
  var _gnsiAllowed=['admin','manager'];
  if(!currentUser||_gnsiAllowed.indexOf(currentUser.role)<0){
    if(typeof showToast==='function')showToast('🔒 Access denied: Save timetable columns','#dc2626');
    return;
  }

  TT_COLS=cols;
  localStorage.setItem('ims_tt_cols',JSON.stringify(cols));
  if(typeof gnsiKVPush==='function') gnsiKVPush('ims_tt_cols', cols); /* FIX v79: removed dead else branch */
}
// TT_COLS -- always in sync with localStorage; refreshed on every access via getTTCols()
// Initialize immediately so it's never null
var TT_COLS=null;
function getTTCols(){
  TT_COLS=loadTTCols(); // always keep in sync
  return TT_COLS;
}
// Warm it up right away so all code that reads TT_COLS directly works
getTTCols();
var TT_TEACHERS=[];
var TT_SUBJECTS=['Science','Maths','Mathematics','Mathematics I','Mathematics II','Reasoning','Grammar','Grammar & Vocab','Vocabulary','GK','Mental','Hindi','English','Social Studies','Computer','Physical Ed','Doubt Session'];
// Default timetable data — empty, configured per school after login
var TT_DEFAULT_PERIODS=[];
function loadTTPeriods(){
  var saved=localStorage.getItem('ims_gnsi_periods');
  if(saved){try{return JSON.parse(saved)}catch(e){}}
  return JSON.parse(JSON.stringify(TT_DEFAULT_PERIODS));
}
function saveTTPeriods(periods){
  var _gnsiAllowed=['admin','manager'];
  if(!currentUser||_gnsiAllowed.indexOf(currentUser.role)<0){
    if(typeof showToast==='function')showToast('🔒 Access denied: Save timetable periods','#dc2626');
    return;
  }

  if(typeof gnsiKVPush==='function') gnsiKVPush('ims_gnsi_periods', periods);
  else { localStorage.setItem('ims_gnsi_periods',JSON.stringify(periods));if(typeof gnsiKVPush==='function')gnsiKVPush('ims_gnsi_periods',periods); }
}
// Edit state
var ttEditCell=null; // {periodId, colKey}
var ttColModal=null; // null | 'add' | colKey-string
// -- TIMETABLE TABS ----------------------------------------------
var ttTab='schedule'; // 'schedule' | 'mapping' | 'student'
var ttStuSearch='';
var ttStuViewId=null;
var ttMapBatchFilter='all';
// -- STUDENT ↔ BATCH MAP (cloud-synced via gnsiKVPush) ----------
function loadTTStudentMap(){
  var s=localStorage.getItem('gnsi_tt_student_batch');
  if(s){try{return JSON.parse(s)}catch(e){}}
  return {};
}
function saveTTStudentMap(map){
  var _gnsiAllowed=['admin','manager'];
  if(!currentUser||_gnsiAllowed.indexOf(currentUser.role)<0){
    if(typeof showToast==='function')showToast('🔒 Access denied: Save timetable student map','#dc2626');
    return;
  }

  if(typeof gnsiKVPush==='function') gnsiKVPush('gnsi_tt_student_batch', map);
  else { localStorage.setItem('gnsi_tt_student_batch', JSON.stringify(map));if(typeof gnsiKVPush==='function')gnsiKVPush('gnsi_tt_student_batch',map); }
}
function ttAssignBatch(stuId, batchKey){
  var map=loadTTStudentMap();
  if(batchKey) map[stuId]=batchKey; else delete map[stuId];
  saveTTStudentMap(map);
  render();
}
