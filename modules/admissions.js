/* GNSI PORTAL — modules/admissions.js
   Pages: admissions, CSV import
   DEPENDS ON: core/utils.js, core/state.js */

function renderAdmissions(){
  var apps = loadAdmApps();
  var statColors = {Applied:'#3b78c9','Under Review':'#f59e0b',Admitted:'#8b5cf6',Enrolled:'#16a34a',Rejected:'#dc2626',Waitlisted:'#94a3b8'};
  /* ── Fee payment modal overlay ── */
  var admFeeModal = '';
  try {
    admFeeModal = (typeof _admRenderFeeModal==='function') ? (_admRenderFeeModal() || '') : '';
  } catch(e) {
    if(typeof showToast==='function') showToast('⚠️ Fee modal error: '+e.message,'#dc2626');
    console.error('[GNSI Admissions] _admRenderFeeModal error:', e);
  }
  /* ── Profile modal ── */
  var profileModal = admViewId ? buildAdmProfile(admViewId) : '';
  /* ── Quick-entry form (slide-in panel) ── */
  var formHTML = '';
  try {
    formHTML = (admFormOpen||admEditId) ? (buildAdmForm(admEditId) || '') : '';
  } catch(e) {
    if(typeof showToast==='function') showToast('⚠️ Edit form error: '+e.message,'#dc2626');
    console.error('[GNSI Admissions] buildAdmForm error:', e);
  }
  /* ── Status KPI strip ── */
  var byStatus={};
  ADM_STATUSES.forEach(function(s){byStatus[s]=0;});
  apps.forEach(function(a){byStatus[a.status]=(byStatus[a.status]||0)+1;});
  var kpi = '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px">'
    + '<div style="flex:1;min-width:100px;background:linear-gradient(135deg,#1433a8,#2563eb);color:#fff;border-radius:10px;padding:12px 16px;text-align:center">'
    + '<div style="font-size:22px;font-weight:900">'+apps.length+'</div>'
    + '<div style="font-size:10px;opacity:.8;font-weight:700;text-transform:uppercase">Total</div></div>'
    + ADM_STATUSES.map(function(s){
        var c=statColors[s];
        return '<div style="flex:1;min-width:80px;background:'+c+'18;border:1.5px solid '+c+'44;border-radius:10px;padding:10px 12px;text-align:center;cursor:pointer" onclick="admFilterStatus=admFilterStatus===\''+s+'\'?\'All\':\''+s+'\';render()" title="Filter: '+s+'">'
          +'<div style="font-size:20px;font-weight:900;color:'+c+'">'+(byStatus[s]||0)+'</div>'
          +'<div style="font-size:10px;color:'+c+';font-weight:700;white-space:nowrap">'+s+'</div></div>';
      }).join('')
    + '</div>';
  /* ── Toolbar ── */
  var toolbar = '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:14px">'
    + '<div class="search-wrap" style="flex:1;min-width:180px"><span class="search-icon">🔍</span>'
    + '<input placeholder="Search name, phone, class…" value="'+esc(admSearch)+'" oninput="admSearch=this.value;debouncedRender()"/></div>'
    + '<select class="filter-sel" onchange="admFilterStatus=this.value;render()" style="min-width:130px">'
    + '<option value="All"'+(admFilterStatus==='All'?' selected':'')+'>All Status</option>'
    + ADM_STATUSES.map(function(s){return'<option'+(s===admFilterStatus?' selected':'')+'>'+s+'</option>';}).join('')
    + '</select>'
    + '</div>';
  /* ── Filter ── */
  var filtered = apps.filter(function(a){
    var sm = admFilterStatus==='All'||a.status===admFilterStatus;
    var q  = admSearch.toLowerCase();
    var tm = !q||(a.name||'').toLowerCase().includes(q)||(a.phone||'').includes(q)||(a.admNo||'').toLowerCase().includes(q)||(a.cls||'').toLowerCase().includes(q)||(a.father||'').toLowerCase().includes(q);
    return sm&&tm;
  }).slice().reverse();
  /* ── Kanban-style cards (fast to scan on mobile) ── */
  var cards = filtered.length
    ? filtered.map(function(a){
        var col = statColors[a.status]||'#64748b';
        var feePaid = admCheckFeePaid(a.id);
        var docs = (a.docs||[]).length;
        /* Action button — the ONE thing accounts needs to do next */
        var nextBtn = '';
        if(a.status==='Applied'||a.status==='Under Review'){
          nextBtn = '<button onclick="admQuickAdmit('+parseInt(a.id,10)+')" style="padding:5px 12px;border-radius:7px;background:#8b5cf6;color:#fff;border:none;font-size:11.5px;font-weight:700;cursor:pointer">→ Admit</button>';
        } else if(a.status==='Admitted' && !feePaid){
          nextBtn = _isAdminOrAccounts()
            ? '<button data-gnsi-collect-fee="'+parseInt(a.id,10)+'" style="padding:5px 12px;border-radius:7px;background:#f59e0b;color:#fff;border:none;font-size:11.5px;font-weight:700;cursor:pointer">💰 Collect Fee</button>'
            : '<span style="font-size:11px;color:var(--muted);font-style:italic">Fee: Admin/Accounts only</span>';
        } else if(a.status==='Admitted' && feePaid){
          /* Fee paid — show both reprint and enroll buttons */
          nextBtn = '<div style="display:flex;flex-direction:column;gap:4px">'
            + '<button data-gnsi-collect-fee="'+parseInt(a.id,10)+'" style="padding:4px 10px;border-radius:7px;background:#f59e0b;color:#fff;border:none;font-size:11px;font-weight:700;cursor:pointer">💰 View / Reprint</button>'
            + '<button onclick="admEnroll('+parseInt(a.id,10)+')" style="padding:4px 10px;border-radius:7px;background:#16a34a;color:#fff;border:none;font-size:11px;font-weight:700;cursor:pointer">✅ Enroll</button>'
            + '</div>';
        } else if(a.status==='Enrolled'){
          nextBtn = '<div style="display:flex;flex-direction:column;gap:4px">'            +'<span style="font-size:11px;color:#16a34a;font-weight:700">✅ Enrolled</span>'            +'<button onclick="gnsiOpenInFeeHub('+parseInt(a.id,10)+')" style="padding:4px 10px;border-radius:7px;background:#1433a8;color:#fff;border:none;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap">💳 Fee Account →</button>'            +'</div>';
        }
        return '<div style="background:var(--surface);border:1.5px solid '+col+'33;border-left:4px solid '+col+';border-radius:10px;padding:12px 14px;margin-bottom:8px;display:flex;align-items:center;gap:12px">'
          /* Avatar */
          + '<div style="width:38px;height:38px;border-radius:50%;background:'+col+';color:#fff;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:800;flex-shrink:0">'
          + (a.name||'?').trim().charAt(0).toUpperCase()+'</div>'
          /* Info */
          + '<div style="flex:1;min-width:0">'
          + '<div style="font-weight:800;font-size:14px;cursor:pointer;color:var(--text)" onclick="admViewId='+parseInt(a.id,10)+';render()">'+esc(a.name)+'</div>'
          + '<div style="font-size:11.5px;color:var(--muted);display:flex;gap:8px;flex-wrap:wrap;margin-top:2px">'
          + (a.admNo?'<span style="font-family:JetBrains Mono,monospace">'+esc(a.admNo)+'</span>':'')
          + (a.cls?'<span>'+esc(a.cls)+'</span>':'')
          + (a.phone?'<span>'+esc(maskPhone(a.phone))+'</span>':'')
          + '</div></div>'
          /* Status + fee badge */
          + '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0">'
          + '<span style="padding:2px 9px;border-radius:8px;font-size:11px;font-weight:700;background:'+col+'22;color:'+col+'">'+esc(a.status)+'</span>'
          + (a.status==='Admitted'||a.status==='Enrolled'
              ? (feePaid
                  ? '<span style="display:inline-flex;align-items:center;gap:3px;padding:3px 9px;border-radius:8px;'
                    + 'font-size:11px;font-weight:800;background:#dcfce7;color:#15803d;border:1.5px solid #86efac">✅ Fee Paid</span>'
                  : '<span style="display:inline-flex;align-items:center;gap:3px;padding:3px 9px;border-radius:8px;'
                    + 'font-size:11px;font-weight:800;background:#fef3c7;color:#92400e;border:1.5px solid #fcd34d">🔒 Fee Due</span>')
              : '')
          + (docs > 0 ? '<span style="font-size:10px;color:var(--muted)">📂 '+docs+'/'+ADM_DOCS.length+'</span>' : '')
          + '</div>'
          /* Next action */
          + '<div style="flex-shrink:0;display:flex;flex-direction:column;gap:4px;align-items:flex-end">'
          + nextBtn
          + '<button data-gnsi-adm-edit="'+parseInt(a.id,10)+'" style="padding:3px 9px;border-radius:6px;border:1px solid var(--border);background:var(--surface2);cursor:pointer;font-size:11px;color:var(--muted)">✏️</button>'
          + (a.linkedStudentId?'<button onclick="gnsiOpenStudentProfile('+a.linkedStudentId+')" style="padding:3px 9px;border-radius:6px;border:1px solid #93c5fd;background:#eff6ff;cursor:pointer;font-size:11px;color:#1433a8;font-weight:700" title="Student Profile">👤</button>':'')
          + (a.linkedStudentId?'<button onclick="gnsiOpenStudentFees('+a.linkedStudentId+')" style="padding:3px 9px;border-radius:6px;border:1px solid #86efac;background:#dcfce7;cursor:pointer;font-size:11px;color:#16a34a;font-weight:700" title="Fee Records">💳</button>':'')
          + (gnsiCanDeleteAdmission()?'<button data-adm-del="'+parseInt(a.id,10)+'" style="padding:3px 9px;border-radius:6px;border:1px solid #fca5a5;background:#fee2e2;cursor:pointer;font-size:11px;color:#dc2626;font-weight:700" title="Delete admission record">🗑</button>':'')
          + '</div>'
          + '</div>';
      }).join('')
    : '<div style="text-align:center;padding:40px;color:var(--muted)">No applications found.</div>';
  /* ── Page header ── */
  var header = '<div class="page-header">'
    + '<div class="page-header-eyebrow">GNSI · ADMISSIONS</div>'
    + '<div class="page-header-title">📋 Admissions</div>'
    + '<div class="page-header-sub">Manage applications enrolled from the Students section</div>'
    + '</div>';
  /* ── Workflow hint strip ── */
  var hint = '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px;background:var(--surface2);border-radius:10px;padding:10px 14px;align-items:center">'
    + '<span style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-right:4px">Process:</span>'
    + ['👥 Students (Enroll)','→ Admit','💰 Collect Fee','✅ Confirm'].map(function(s,i){
        return '<span style="font-size:12px;font-weight:700;color:'+(i===3?'#16a34a':i===2?'#f59e0b':i===1?'#8b5cf6':'#1433a8')+'">'+s+'</span>'
          +(i<3?'<span style="color:var(--muted);margin:0 2px">›</span>':'');
      }).join('')
    + '</div>';
  /* No embedded fee tab -- fee work happens in Fee Management (sidebar) */
  return admFeeModal + profileModal + header + hint + kpi + toolbar + formHTML
    + '<div style="margin-top:4px">'+cards+'</div>';
}
/* ── admQuickAdmit: one-click move from Applied/Under Review → Admitted ── */
/* Open fee management and jump directly to this enrolled student's payment form */
function gnsiOpenInFeeHub(admAppId) {
  navigate('fees');
  setTimeout(function(){
    if(typeof _fmcLoadAsgns==='function'){
      var _asgns = _fmcLoadAsgns();
      var apps   = (typeof loadAdmApps==='function') ? loadAdmApps() : [];
      var app    = apps.find(function(x){ return String(x.id)===String(admAppId); });
      var _match = _asgns.find(function(x){
        return x.admAppId===String(admAppId) ||
               (app && (x.studentName||'').toLowerCase()===(app.name||'').toLowerCase());
      });
      if(_match){
        _fmc.asgnId  = _match.id;
        _fmc.tab     = 'collect';
        _fmc.payType = 'monthly';
        _fmc.search  = '';
        render();
        if(typeof showToast==='function') showToast('📂 Opened fee account for '+(app?app.name:_match.studentName),'#1433a8');
      } else {
        _fmc.tab    = 'collect';
        _fmc.search = app ? app.name : '';
        render();
      }
    }
  }, 400);
}
function admQuickAdmit(id){
  var apps = loadAdmApps();
  var a = apps.find(function(x){return String(x.id)===String(id);});
  if(!a) return;
  if(!confirm('Mark "'+a.name+'" as Admitted?')) return;
  apps = apps.map(function(x){return String(x.id)===String(id)?Object.assign({},x,{status:'Admitted'}):x;});
  localStorage.setItem('gnsi_adm_apps', JSON.stringify(apps));
  localStorage.setItem('gnsi_kv_ts_gnsi_adm_apps', new Date().toISOString());
  if(typeof gnsiKVPush==='function') gnsiKVPush('gnsi_adm_apps', apps);
  if(typeof saveAdmApps==='function') saveAdmApps(apps);
  showToast(a.name+' marked as Admitted ✅','#8b5cf6');
  render();
}
function buildAdmForm(editId){
  var a = editId ? (loadAdmApps().find(function(x){return String(x.id)===String(editId);}))||{} : {};
  var classNames = getClassNames();
  var sessions = loadSessions();
  var isEdit = !!editId;
  var col = isEdit ? '#f59e0b' : '#8b5cf6';
  /* Split into: Essential fields (always shown) + Extra fields (collapsible) */
  var clsOpts = '<option value="">-- Class --</option>'
    + classNames.map(function(c){return'<option'+(a.cls===c?' selected':'')+'>'+esc(c)+'</option>';}).join('');
  var sessOpts = '<option value="">-- Session --</option>'
    + sessions.map(function(ss){return'<option'+(a.session===ss.label?' selected':'')+'>'+esc(ss.label)+'</option>';}).join('');
  var statusOpts = ADM_STATUSES.map(function(s){
    return'<option'+(a.status===s?' selected':(!a.status&&s==='Applied'?' selected':''))+'>'+s+'</option>';
  }).join('');
  var inputStyle = 'width:100%;border:1.5px solid var(--border);border-radius:8px;padding:9px 12px;font-size:13px;background:var(--surface);color:var(--text);box-sizing:border-box;font-family:DM Sans,sans-serif';
  var labelStyle = 'font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;display:block;margin-bottom:4px';
  /* ── ESSENTIAL SECTION (always visible, fits one screen) ── */
  var essential = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">'
    /* Row 1 */
    + '<div style="grid-column:1/-1"><label style="'+labelStyle+'">Applicant Name *</label>'
    + '<input id="adm-name" placeholder="Full name" value="'+esc(a.name||'')+'" style="'+inputStyle+'"/></div>'
    /* Row 2 */
    + '<div><label style="'+labelStyle+'">Class *</label>'
    + '<select id="adm-cls" style="'+inputStyle+'">'+clsOpts+'</select></div>'
    + '<div><label style="'+labelStyle+'">Hostel</label>'
    + '<select id="adm-hostel" style="'+inputStyle+'"><option'+(a.hostel==='No'||!a.hostel?' selected':'')+'>No</option><option'+(a.hostel==='Yes'?' selected':'')+'>Yes</option></select></div>'
    /* Row 3 */
    + '<div><label style="'+labelStyle+'">Father&apos;s Name</label>'
    + '<input id="adm-father" value="'+esc(a.father||'')+'" style="'+inputStyle+'" placeholder="Father name"/></div>'
    + '<div><label style="'+labelStyle+'">Contact Phone *</label>'
    + '<input id="adm-phone" value="'+esc(a.phone||'')+'" style="'+inputStyle+'" placeholder="Primary contact"/></div>'
    /* Row 4 */
    + '<div><label style="'+labelStyle+'">Status</label>'
    + '<select id="adm-status" style="'+inputStyle+'">'+statusOpts+'</select></div>'
    + '<div><label style="'+labelStyle+'">Adm No.</label>'
    + '<input id="adm-admno" value="'+esc(a.admNo||(typeof gnsiGenAdmNo==="function"?gnsiGenAdmNo():admGenNo()))+'" style="'+inputStyle+'"/></div>'
    + '</div>';
  /* ── EXTRA DETAILS (collapsible) ── */
  var showExtra = !!(a.dob||a.gender||a.mother||a.whatsapp||a.address||a.prevSchool||a.session||a.category||a.blood);
  var extra = '<details'+(showExtra?' open':'')+' style="margin-bottom:12px">'
    + '<summary style="font-size:11.5px;font-weight:700;color:var(--accent);cursor:pointer;padding:6px 0;list-style:none">▸ More Details (DOB, Mother, Address…)</summary>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">'
    + '<div><label style="'+labelStyle+'">Date of Birth</label>'
    + '<input type="date" id="adm-dob" value="'+esc(a.dob||'')+'" style="'+inputStyle+'"/></div>'
    + '<div><label style="'+labelStyle+'">Gender</label>'
    + '<select id="adm-gender" style="'+inputStyle+'"><option value=""'+(!(a.gender)?'selected':'')+'>--</option>'
    + '<option'+(a.gender==='Male'?' selected':'')+'>Male</option>'
    + '<option'+(a.gender==='Female'?' selected':'')+'>Female</option>'
    + '<option'+(a.gender==='Other'?' selected':'')+'>Other</option></select></div>'
    + '<div><label style="'+labelStyle+'">Mother&apos;s Name</label>'
    + '<input id="adm-mother" value="'+esc(a.mother||'')+'" style="'+inputStyle+'"/></div>'
    + '<div><label style="'+labelStyle+'">WhatsApp</label>'
    + '<input id="adm-wa" value="'+esc(a.whatsapp||'')+'" style="'+inputStyle+'"/></div>'
    + '<div style="grid-column:1/-1"><label style="'+labelStyle+'">Address</label>'
    + '<input id="adm-addr" value="'+esc(a.address||'')+'" style="'+inputStyle+'"/></div>'
    + '<div><label style="'+labelStyle+'">Session</label>'
    + '<select id="adm-sess" style="'+inputStyle+'">'+sessOpts+'</select></div>'
    + '<div><label style="'+labelStyle+'">Previous School</label>'
    + '<input id="adm-prev" value="'+esc(a.prevSchool||'')+'" style="'+inputStyle+'"/></div>'
    + '<div><label style="'+labelStyle+'">Category</label>'
    + '<select id="adm-cat" style="'+inputStyle+'"><option value="">--</option>'
    + ['General','OBC','SC','ST','EWS','Other'].map(function(c){return'<option'+(a.category===c?' selected':'')+'>'+c+'</option>';}).join('')
    + '</select></div>'
    + '<div><label style="'+labelStyle+'">Blood Group</label>'
    + '<input id="adm-blood" value="'+esc(a.blood||'')+'" style="'+inputStyle+'" placeholder="e.g. O+"/></div>'
    + '</div></details>';
  /* ── DOCUMENTS (compact checkboxes) ── */
  var docsHtml = '<details style="margin-bottom:12px">'
    + '<summary style="font-size:11.5px;font-weight:700;color:var(--accent);cursor:pointer;padding:6px 0;list-style:none">▸ Documents Received ('+(a.docs||[]).length+'/'+ADM_DOCS.length+')</summary>'
    + '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">'
    + ADM_DOCS.map(function(d){
        var checked = (a.docs||[]).indexOf(d)!==-1;
        return '<label style="display:flex;align-items:center;gap:5px;padding:5px 10px;border-radius:7px;border:1.5px solid '+(checked?'#16a34a':'var(--border)')+';background:'+(checked?'#f0fdf4':'var(--surface2)')+';cursor:pointer;font-size:11.5px;font-weight:600">'
          +'<input type="checkbox" name="adm-doc" value="'+d+'" '+(checked?'checked':'')+' style="accent-color:#16a34a"/> '+d+'</label>';
      }).join('')
    + '</div></details>';
  /* ── ACTION BUTTONS ── */
  var actions = '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">'
    + '<button class="btn btn-primary" onclick="saveAdmApp('+(editId||'null')+')">'+( isEdit?'✓ Update':'✓ Save Applicant')+'</button>'
    + '<button class="btn btn-outline" onclick="_admPhotoTemp=null;admFormOpen=false;admEditId=null;render()">Cancel</button>'
    + (isEdit&&(a.status==='Applied'||a.status==='Under Review')
        ? '<button onclick="admQuickAdmit('+editId+')" style="padding:8px 16px;border-radius:8px;background:#8b5cf6;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer">→ Admit Now</button>'
        : '')
    + (isEdit&&a.status==='Admitted'
        ? (admCheckFeePaid(editId)
            /* Fee paid: show both reprint and enroll */
            ? '<button data-gnsi-collect-fee="'+editId+'" style="padding:8px 16px;border-radius:8px;background:#f59e0b;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer">💰 View Package</button>'
              + ' <button onclick="admEnroll('+editId+')" style="padding:8px 16px;border-radius:8px;background:#15803d;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer">✅ Enroll</button>'
            : (_isAdminOrAccounts() ? '<button data-gnsi-collect-fee="'+editId+'" style="padding:8px 16px;border-radius:8px;background:#f59e0b;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer">💰 Collect Fee</button>' : ''))
        : '')
    + '</div>';
  return '<div style="background:var(--surface);border:2px solid '+col+';border-radius:12px;padding:18px 20px;margin-bottom:16px">'
    + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">'
    + '<div style="font-size:15px;font-weight:800;color:'+col+'">✏️ Edit Application</div>'
    + '<button onclick="_admPhotoTemp=null;admFormOpen=false;admEditId=null;render()" style="background:none;border:none;font-size:18px;cursor:pointer;color:var(--muted)">✕</button>'
    + '</div>'
    + essential + extra + docsHtml
    + '<div style="margin-bottom:12px">'
    + '<label style="'+labelStyle+'">📷 Student Photo <span style="font-size:10px;font-weight:500;color:var(--muted);text-transform:none;letter-spacing:0">(Max 300KB · JPEG/PNG)</span></label>'
    + '<div style="display:flex;align-items:center;gap:14px;margin-top:6px">'
    + '<div id="adm-photo-prev" style="width:72px;height:72px;border-radius:10px;border:2px solid var(--border);background:var(--surface2);overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;color:var(--muted)">'
    + (a.photo ? '<img src="'+esc(a.photo)+'" style="width:100%;height:100%;object-fit:cover">' : '👤')
    + '</div>'
    + '<div>'
    + '<input type="file" id="adm-photo-input" accept="image/*" style="display:none" onchange="admHandlePhoto(this)"/>'
    + '<button type="button" onclick="document.getElementById(\'adm-photo-input\').click()" style="padding:7px 14px;border-radius:8px;border:1.5px solid var(--border);background:var(--surface2);cursor:pointer;font-size:12px;font-weight:700;color:var(--accent);font-family:DM Sans,sans-serif">📁 Choose Photo</button>'
    + (a.photo ? ' <button type="button" onclick="admClearPhoto()" style="padding:7px 14px;border-radius:8px;border:1.5px solid #fca5a5;background:#fef2f2;cursor:pointer;font-size:12px;font-weight:700;color:#dc2626;font-family:DM Sans,sans-serif">✕ Remove</button>' : '')
    + '<div id="adm-photo-msg" style="font-size:11px;color:var(--muted);margin-top:6px">Photo will appear in the student table and profile.</div>'
    + '</div></div></div>'
    + '<div class="form-group" style="margin-bottom:12px"><label style="'+labelStyle+'">Remarks</label>'
    + '<textarea id="adm-remarks" rows="2" style="'+inputStyle+';resize:vertical">'+esc(a.remarks||'')+'</textarea></div>'
    + actions
    + '</div>';
}
function gnsiGenAdmNo() {
  var yr = new Date().getFullYear();
  var maxSeq = 0;
  var apps = typeof loadAdmApps === 'function' ? loadAdmApps() : [];
  apps.forEach(function(a) {
    var m = (a.admNo||'').match(/GNSI\/\d+\/(\d+)/);
    if (m) maxSeq = Math.max(maxSeq, parseInt(m[1],10));
  });
  var stus = typeof students !== 'undefined' ? students : [];
  stus.forEach(function(s) {
    var ex = typeof stuLoadExtra === 'function' ? stuLoadExtra(s.id) : {};
    var m  = (ex.admNo||'').match(/GNSI\/\d+\/(\d+)/);
    if (m) maxSeq = Math.max(maxSeq, parseInt(m[1],10));
  });
  return 'GNSI/' + yr + '/' + String(maxSeq + 1).padStart(3,'0');
}
/* ── delegated click handler for ⚡ Auto-No button ── */
(function(){
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('[data-genstudentadm]');
    if (!btn) return;
    var el = document.getElementById('nst-admno');
    if (el && typeof gnsiGenAdmNo === 'function') {
      el.value = gnsiGenAdmNo();
      el.style.borderColor = '#16a34a';
      setTimeout(function(){ el.style.borderColor = ''; }, 1200);
    }
  });
})();
function nstCourseChange(courseId) {
  var sel = document.getElementById('nst-subtypeid');
  if (!sel) return;
  sel.innerHTML = '<option value="">-- Select Subtype --</option>'
    + ['Boarder','Day Boarder','Day Scholar'].map(function(st){
        var icon = st==='Boarder'?'🏠':st==='Day Boarder'?'🌗':'🚌';
        return '<option value="'+st+'">'+icon+' '+st+'</option>';
      }).join('');
}
function admGenNo(){
  var apps=loadAdmApps();
  var yr=new Date().getFullYear();
  return 'GNSI/'+yr+'/'+(String(apps.length+1).padStart(3,'0'));
}
/* ── Admission form photo handlers ── */
var _admPhotoTemp = null; // null=unchanged, 'CLEAR'=removed, 'data:...'=new photo
function admHandlePhoto(input){
  var file=input.files&&input.files[0];
  if(!file)return;
  var msg=document.getElementById('adm-photo-msg');
  if(file.size>300*1024){
    if(msg){msg.textContent='❌ Too large! Max 300KB. Please compress the image.';msg.style.color='#dc2626';}
    input.value='';return;
  }
  if(!file.type.startsWith('image/')){
    if(msg){msg.textContent='❌ Images only (JPEG/PNG).';msg.style.color='#dc2626';}
    input.value='';return;
  }
  var reader=new FileReader();
  reader.onload=function(e){
    _admPhotoTemp=e.target.result;
    var prev=document.getElementById('adm-photo-prev');
    if(prev) prev.innerHTML='<img src="'+_admPhotoTemp+'" style="width:100%;height:100%;object-fit:cover"/>';
    if(msg){msg.textContent='✅ Photo ready — click Save to apply.';msg.style.color='#16a34a';}
  };
  reader.readAsDataURL(file);
}
function admClearPhoto(){
  _admPhotoTemp='CLEAR';
  var prev=document.getElementById('adm-photo-prev');
  if(prev){prev.innerHTML='👤';prev.style.fontSize='22px';}
  var msg=document.getElementById('adm-photo-msg');
  if(msg){msg.textContent='Photo removed — click Save to confirm.';msg.style.color='#d4a853';}
}
function saveAdmApp(editId){
  if(!currentUser||(['admin','manager','accounts'].indexOf(currentUser.role)<0)){
    if(typeof showToast==='function')showToast('🔒 Access denied: admission record','#dc2626');
    return;
  }

  var name=((document.getElementById('adm-name')||{}).value||'').trim();
  if(!name){showToast('⚠️ Applicant name is required.','#ea580c');return;}
  var docs=[];
  document.querySelectorAll('input[name="adm-doc"]:checked').forEach(function(el){docs.push(el.value);});
  var obj={
    name:name,
    admNo:((document.getElementById('adm-admno')||{}).value||'').trim(),
    date:(document.getElementById('adm-date')||{}).value||admDate(),
    dob:(document.getElementById('adm-dob')||{}).value||'',
    gender:(document.getElementById('adm-gender')||{value:''}).value,
    blood:((document.getElementById('adm-blood')||{}).value||'').trim(),
    cls:(document.getElementById('adm-cls')||{value:''}).value,
    session:(document.getElementById('adm-sess')||{value:''}).value,
    prevSchool:((document.getElementById('adm-prev')||{}).value||'').trim(),
    status:(document.getElementById('adm-status')||{value:'Applied'}).value,
    category:(document.getElementById('adm-cat')||{value:''}).value,
    hostel:(document.getElementById('adm-hostel')||{value:'No'}).value,
    father:((document.getElementById('adm-father')||{}).value||'').trim(),
    mother:((document.getElementById('adm-mother')||{}).value||'').trim(),
    phone:((document.getElementById('adm-phone')||{}).value||'').trim(),
    whatsapp:((document.getElementById('adm-wa')||{}).value||'').trim(),
    address:((document.getElementById('adm-addr')||{}).value||'').trim(),
    docs:docs,
    remarks:((document.getElementById('adm-remarks')||{}).value||'').trim()
  };
  // Resolve photo: new upload > CLEAR (remove) > keep existing
  var _existingApp = editId ? (loadAdmApps().find(function(x){return String(x.id)===String(editId);})||{}) : {};
  if(_admPhotoTemp && _admPhotoTemp!=='CLEAR') obj.photo = _admPhotoTemp;
  else if(_admPhotoTemp==='CLEAR') obj.photo = '';
  else obj.photo = _existingApp.photo || '';
  _admPhotoTemp = null; // reset for next open
  var list=loadAdmApps();
  if(editId){
    list=list.map(function(a){return String(a.id)===String(editId)?Object.assign({},a,obj):a;});
    showToast('Application updated ✅','#f59e0b');
  } else {
    obj.id=admNextId(list);
    list.push(obj);
    showToast('Application saved ✅','#8b5cf6');
  }
  // Persist immediately and push to cloud
  localStorage.setItem('gnsi_adm_apps', JSON.stringify(list));
  localStorage.setItem('gnsi_kv_ts_gnsi_adm_apps', new Date().toISOString());
  if (typeof gnsiKVPush === 'function') gnsiKVPush('gnsi_adm_apps', list);
  saveAdmApps(list);
  /* SYNC BACK: when admission record is linked to a student, update gnsi_stuex_ */
  try {
    var _appId = editId ? String(editId) : String(obj.id);
    var _saved = list.find(function(x){ return String(x.id)===_appId; });
    if (_saved && (_saved.linkedStudentId || _saved._stuId)) {
      var _sid = _saved.linkedStudentId || _saved._stuId;
      if (typeof stuLoadExtra==='function' && typeof stuSaveExtra==='function') {
        var _exBack = stuLoadExtra(_sid) || {};
        if (_saved.admNo)      _exBack.admNo      = _saved.admNo;
        if (_saved.dob)        _exBack.dob        = _saved.dob;
        if (_saved.gender)     _exBack.gender     = _saved.gender;
        if (_saved.blood)      _exBack.blood      = _saved.blood;
        if (_saved.father)     _exBack.father     = _saved.father;
        if (_saved.mother)     _exBack.mother     = _saved.mother;
        if (_saved.guardian)   _exBack.guardian   = _saved.guardian;
        if (_saved.address)    _exBack.address    = _saved.address;
        if (_saved.state)      _exBack.state      = _saved.state;
        if (_saved.category)   _exBack.category   = _saved.category;
        if (_saved.religion)   _exBack.religion   = _saved.religion;
        if (_saved.prevSchool) _exBack.prevSchool = _saved.prevSchool;
        if (_saved.whatsapp)   _exBack.whatsapp   = _saved.whatsapp;
        if (_saved.phone)      _exBack.parentPhone= _saved.phone;
        if (_saved.remarks)    _exBack.remarks    = _saved.remarks;
        if (_saved.photo !== undefined) _exBack.photo = _saved.photo; // FIX: sync photo to student
        stuSaveExtra(_sid, _exBack);
      }
      /* Also mirror cls/hostel/session into student core */
      if (typeof students !== 'undefined' && Array.isArray(students)) {
        students = students.map(function(st){
          if (String(st.id)!==String(_sid)) return st;
          return Object.assign({}, st,
            _saved.cls     ? {cls:    _saved.cls}     : {},
            _saved.hostel  ? {hostel: _saved.hostel}  : {},
            _saved.session ? {session:_saved.session} : {}
          );
        });
        try { /* [SUPABASE-ONLY] localStorage write removed: ims_students */ } catch(e){}
        if (typeof gnsiKVPush==='function') try { /* [SUPABASE-ONLY] KV push removed: ims_students */ } catch(e){}
      }
    }
  } catch(_eSB) { /* non-fatal */ }
  _admPhotoTemp=null;admFormOpen=false;admEditId=null;render();
}
/* Admission delete: admin/manager role */
function gnsiCanDeleteAdmission() {
  if (!currentUser) return false;
  var r = currentUser.role || '';
  return r === 'admin' || r === 'manager';
}
function admDelete(id){
  if(!gnsiCanDeleteAdmission()){showToast('🔒 Only Founder or Administrator can delete admission records.','#dc2626');return;}
  var app = loadAdmApps().find(function(a){return String(a.id)===String(id);});
  var label = app ? ('"'+(app.name||'this applicant')+'"') : 'this application';
  if(!confirm('Delete admission record for '+label+'? This cannot be undone.'))return;
  var list = loadAdmApps().filter(function(a){return String(a.id)!==String(id);});
  localStorage.setItem('gnsi_adm_apps', JSON.stringify(list));
  localStorage.setItem('gnsi_kv_ts_gnsi_adm_apps', new Date().toISOString());
  if (typeof gnsiKVPush === 'function') gnsiKVPush('gnsi_adm_apps', list);
  saveAdmApps(list);
  admViewId=null;
  showToast('🗑 Admission record deleted.','#dc2626');
  render();
}
/* ── Delegated click handler for data-adm-del buttons ── */
(function(){
  document.addEventListener('click', function(e){
    var btn = e.target.closest('[data-adm-del]');
    if (!btn) return;
    var rawId = btn.getAttribute('data-adm-del');
    if (rawId === null || rawId === '') return;
    var id = /^\d+$/.test(rawId) ? parseInt(rawId, 10) : rawId;
    if (!id && id !== 0) return;
    admDelete(id);
  });
})();
/* ── Delegated handlers for Collect Fee + Edit buttons (survive HTML patches) ── */
(function(){
  document.addEventListener('click', function(e){
    /* Collect Fee button */
    var cfBtn = e.target.closest('[data-gnsi-collect-fee]');
    if (cfBtn) {
      e.stopPropagation();
      var id = cfBtn.getAttribute('data-gnsi-collect-fee');
      if (id !== null && id !== '') {
        window._admPayFeeAppId = String(id);
        if (typeof render === 'function') render();
      }
      return;
    }
    /* Edit (✏️) button */
    var edBtn = e.target.closest('[data-gnsi-adm-edit]');
    if (edBtn) {
      e.stopPropagation();
      var eid = edBtn.getAttribute('data-gnsi-adm-edit');
      if (eid !== null && eid !== '') {
        admEditId = eid;
        admFormOpen = true;
        if (typeof render === 'function') render();
      }
      return;
    }
  }, true); /* capture:true — fires before any other handler */
})();

/* ── Helper: check if admission fee has been paid for an application ── */
function admCheckFeePaid(admAppId) {
  /* Check 1: look for a fee collection record with feeType='admission' linked to this app */
  var cols = (typeof _fmcLoadCols === 'function') ? _fmcLoadCols() : [];
  if (cols.some(function(c){ return c.feeType === 'admission' && c.admAppId === String(admAppId); })) return true;
  /* Check 2: flag on the application record itself (set by admSaveAdmissionFee) */
  var apps = (typeof loadAdmApps === 'function') ? loadAdmApps() : [];
  var app = apps.find(function(x){ return String(x.id) === String(admAppId); });
  return !!(app && app.admFeePaid);
}
/* ── Helper: get fee assignment linked to this application ── */
function admGetFeeAsgn(admAppId) {
  var asgns = (typeof _fmcLoadAsgns === 'function') ? _fmcLoadAsgns() : [];
  return asgns.find(function(a) { return a.admAppId === String(admAppId); }) || null;
}
/* ── Open the admission fee payment modal ── */
/* admPayFeeModal defined below */
function admEnroll(id){
  var apps=loadAdmApps();
  var a=apps.find(function(x){return String(x.id)===String(id);});
  if(!a){showToast('❌ Application not found.','#dc2626');return;}
  /* ── MANDATORY: admission fee must be paid before enrollment ── */
  if(!admCheckFeePaid(id)){
    /* Show a clear blocking message and open the fee modal */
    var _blockBox = document.createElement('div');
    _blockBox.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(8,15,38,.7);'
      + 'display:flex;align-items:center;justify-content:center;padding:20px';
    _blockBox.innerHTML = '<div style="background:#fff;border-radius:16px;padding:28px 32px;'
      + 'max-width:400px;width:100%;text-align:center;box-shadow:0 24px 80px rgba(0,0,0,.35)">'
      + '<div style="font-size:48px;margin-bottom:12px">🔒</div>'
      + '<div style="font-size:18px;font-weight:900;color:#dc2626;margin-bottom:8px">Enrollment Blocked</div>'
      + '<div style="font-size:13px;color:#475569;margin-bottom:20px;line-height:1.6">'
      + 'Admission fee must be <b>fully collected</b> before the student can be enrolled.<br>'
      + 'Please collect the Admission Package first.</div>'
      + '<div style="display:flex;gap:10px;justify-content:center">'
      + '<button id="_gnsi_blk_fee" style="padding:11px 22px;border-radius:9px;background:#f59e0b;'
      + 'color:#fff;border:none;font-size:14px;font-weight:800;cursor:pointer">💰 Collect Fee Now</button>'
      + '<button id="_gnsi_blk_cls" style="padding:11px 22px;border-radius:9px;border:1.5px solid #e2e8f0;'
      + 'background:#f8fafc;color:#64748b;font-size:14px;font-weight:700;cursor:pointer">Cancel</button>'
      + '</div></div>';
    document.body.appendChild(_blockBox);
    document.getElementById('_gnsi_blk_cls').onclick = function(){ document.body.removeChild(_blockBox); };
    document.getElementById('_gnsi_blk_fee').onclick = function(){
      document.body.removeChild(_blockBox);
      window._admPayFeeAppId = String(id);
      render();
    };
    return;
  }
  /* ── _fromStudents: student record already created by saveStu() ── */
  var _alreadyCreated = !!(a._fromStudents && a._stuId);
  if(!_alreadyCreated){
    if(!confirm('Enroll "'+a.name+'" as a student?\nThis will create a student record and mark the application as Enrolled.'))return;
  }
  // Create student record (only when coming from Admissions section directly)
  var newId = _alreadyCreated ? a._stuId : ++nextId;
  if(!_alreadyCreated){
    students.push({id:newId,name:a.name,roll:'',phone:a.phone,cls:a.cls||'',hostel:a.hostel||'No',fees:'Paid',session:a.session||''});
    stuSaveExtra(newId,{admNo:a.admNo,dob:a.dob,gender:a.gender,blood:a.blood,father:a.father,mother:a.mother,parentPhone:a.phone,whatsapp:a.whatsapp,address:a.address,category:a.category,prevSchool:a.prevSchool,photo:a.photo||''});
  } else {
    // Student already exists — just update fees status to Paid
    students = students.map(function(s){
      return String(s.id)===String(newId) ? Object.assign({},s,{fees:'Paid'}) : s;
    });
    // FIX: also carry over photo if admission record has one
    if(a.photo && typeof stuLoadExtra==='function' && typeof stuSaveExtra==='function'){
      var _exUp = stuLoadExtra(newId)||{};
      if(!_exUp.photo) { _exUp.photo=a.photo; stuSaveExtra(newId,_exUp); }
    }
  }
  var _enrolledStu = students.find(function(s){ return s.id===newId; });
  if(_enrolledStu){
    _gnsiInstantPush('students',{id:_enrolledStu.id,name:_enrolledStu.name,roll_no:_enrolledStu.roll||null,
      phone:_enrolledStu.phone||null,is_boarder:_enrolledStu.hostel==='Yes',status:'Active',
      class_id:CLASS_ID_MAP[_enrolledStu.cls]||null,session:_enrolledStu.session||null});
  }
  // Mark enrolled
  apps=apps.map(function(x){return String(x.id)===String(id)?Object.assign({},x,{status:'Enrolled',enrolledId:newId}):x;});
  // Auto-add to fee system if not already there
  if(typeof _fmcLoadAsgns === 'function' && typeof _fmcSaveAsgns === 'function'){
    var asgns = _fmcLoadAsgns();
    var existing = asgns.find(function(x){ return x.admAppId===String(id) || (x.studentName||'').toLowerCase()===(a.name||'').toLowerCase(); });
    if(!existing){
      // Determine monthly fee from fee config based on class
      var _admConf = (typeof loadConf==='function') ? loadConf() : {};
      var _admMfConf = (_admConf.monthlyFees||[]).find(function(f){ return f.course===(a.cls||''); }) || {amount:0,hostelAmount:0};
      var _admMonthlyFee = (a.hostel==='Yes') ? (_admMfConf.hostelAmount||_admMfConf.amount||0) : (_admMfConf.amount||0);
      // Carry over item bundle amount from the admission payment record
      var _admCols = (typeof _fmcLoadCols==='function') ? _fmcLoadCols() : [];
      var _admItemBundle = _admCols.filter(function(c){ return c.admAppId===String(id) && c.feeType==='item'; })
                                   .reduce(function(t,c){ return t+(parseFloat(c.amount)||0); }, 0);
      // Carry over advance paid from admission payment record
      var _admAdvancePaid = _admCols.filter(function(c){ return c.admAppId===String(id) && c.feeType==='advance'; })
                                    .reduce(function(t,c){ return t+(parseFloat(c.amountPaid)||0); }, 0)
                          || (a.advancePaid || 0);
      var newAsgn = {
        id: 'sfa_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),
        stuId: String(newId),
        studentName: a.name,
        rollNo: '',
        admNo: a.admNo || '',
        className: a.cls || '',
        hostel: a.hostel || 'No',
        subtype: (a.hostel==='Yes') ? 'Boarder' : 'Day Scholar',
        monthlyFee: _admMonthlyFee,
        itemBundlePaid: _admItemBundle,
        advancePaid: _admAdvancePaid,
        enrolledAt: new Date().toISOString().split('T')[0],
        admAppId: String(id),
        remark: 'Auto-added from Admissions on enrollment',
        createdBy: (typeof currentUser!=='undefined'&&currentUser)?currentUser.name:'System',
        createdAt: new Date().toISOString()
      };
      // Re-link existing fee collections for this app to the new assignment
      if(typeof _fmcLoadCols==='function' && typeof _fmcSaveCols==='function'){
        var cols = _fmcLoadCols().map(function(c){
          return c.admAppId===String(id) ? Object.assign({},c,{asgnId:newAsgn.id, stuId:String(newId)}) : c;
        });
        _fmcSaveCols(cols);
      }
      asgns.push(newAsgn);
      _fmcSaveAsgns(asgns);
    } else {
      // Update existing assignment with the real student ID + advance balance
      var updAsgns = asgns.map(function(x){
        if (x.admAppId!==String(id)) return x;
        return Object.assign({},x,{
          stuId: String(newId),
          advancePaid: (x.advancePaid||0) || _admAdvancePaid || 0
        });
      });
      _fmcSaveAsgns(updAsgns);
    }
  }
  // Persist student
  /* [SUPABASE-ONLY] localStorage write removed: ims_students */
  if (_supa && typeof pushToSupabase === 'function') pushToSupabase();
  // Persist admission apps
  localStorage.setItem('gnsi_adm_apps', JSON.stringify(apps));
  localStorage.setItem('gnsi_kv_ts_gnsi_adm_apps', new Date().toISOString());
  if (typeof gnsiKVPush === 'function') gnsiKVPush('gnsi_adm_apps', apps);
  saveAdmApps(apps);
  admViewId=null;admEditId=null;admFormOpen=false;
  window._admPayFeeAppId = null;
  showToast('✅ '+a.name+' enrolled'+(_alreadyCreated?' (Admission Package collected)':' — opening Fee Management now'),'#16a34a');
  /* Navigate to fee management and pre-select this student */
  setTimeout(function(){
    if(typeof navigate==='function') navigate('fees');
    setTimeout(function(){
      /* Find the fee assignment for this student and open their payment form */
      if(typeof _fmcLoadAsgns==='function'){
        var _asgns = _fmcLoadAsgns();
        var _match = _asgns.find(function(x){
          return String(x.stuId)===String(newId) || x.admAppId===String(id);
        });
        if(_match){
          _fmc.asgnId = _match.id;
          _fmc.tab = 'collect';
          _fmc.payType = 'monthly';
          render();
        }
      }
    }, 300);
  }, 200);
}
/* ── Admission Fee Payment Modal ─────────────────────────────────────────
   Shown when staff clicks "💰 Pay Fee First" on an Admitted application.
   Creates a temporary fee assignment linked to admAppId, collects the
   admission fee, prints receipt, then unlocks the Enroll button.
   ──────────────────────────────────────────────────────────────────────── */
function admPayFeeModal(admAppId) {
  window._admPayFeeAppId = String(admAppId);
  render();
}
function admPayFeeClose() {
  /* If this modal was opened from the Students enrollment path,
     warn that fee collection is mandatory -- resume via the student's Admission button. */
  var _appId = window._admPayFeeAppId;
  if (_appId) {
    var _apps2 = (typeof loadAdmApps === 'function') ? loadAdmApps() : [];
    var _app2  = _apps2.find(function(x){ return String(x.id) === String(_appId); });
    if (_app2 && _app2._fromStudents && !admCheckFeePaid(_appId)) {
      showToast('\u26a0\ufe0f Admission Package not collected. Resume via the student\u2019s \ud83d\udccb Admission button.','#ea580c');
    }
  }
  window._admPayFeeAppId = null;
  render();
}
function _admRenderFeeModal() {
  var appId = window._admPayFeeAppId;
  if (!appId) return '';
  var apps = loadAdmApps();
  var a = apps.find(function(x){ return String(x.id) === appId; });
  if (!a) return '';
  var asgns = (typeof _fmcLoadAsgns === 'function') ? _fmcLoadAsgns() : [];
  var tempAsgn = asgns.find(function(x){ return x.admAppId === appId; });
  if (!tempAsgn) {
    tempAsgn = {
      id: 'sfa_adm_'+appId+'_'+Date.now(),
      stuId: null,
      studentName: a.name,
      rollNo: '',
      admNo: a.admNo || '',
      className: a.cls || '',
      hostel: a.hostel || 'No',
      enrolledAt: new Date().toISOString().split('T')[0],
      admAppId: appId,
      remark: 'Pre-enrollment fee collection',
      createdBy: (typeof currentUser !== 'undefined' && currentUser) ? currentUser.name : 'System',
      createdAt: new Date().toISOString()
    };
    asgns.push(tempAsgn);
    if (typeof _fmcSaveAsgns === 'function') _fmcSaveAsgns(asgns);
  }
  var alreadyPaid = admCheckFeePaid(appId);
  var cols = (typeof _fmcLoadCols === 'function') ? _fmcLoadCols() : [];
  var paidCols = cols.filter(function(c){ return c.admAppId === appId && c.feeType === 'admission'; });
  var paidAmt = paidCols.reduce(function(s,c){ return s + (parseInt(c.amountPaid)||0); }, 0);
  var conf = (typeof loadFeeConf === 'function') ? loadFeeConf() : {};
  var admFees = conf.admissionFees || [];
  var matchFee = admFees.find(function(f){ return f.course === a.cls; }) || admFees[0];
  var admFeeAmt = (matchFee && matchFee.amount) ? matchFee.amount : 6000;
  /* Dress kit items from config (falls back to defaults) */
  var _dressItems = (function(){
    try { var d=JSON.parse(localStorage.getItem('gnsi_patch_dress')||'null'); if(d&&d.length) return d; } catch(e){}
    return [
      { id:'dk1', name:'Aqua T-Shirt',      price:450, qty:1 },
      { id:'dk2', name:'Blue T-Shirt',       price:450, qty:1 },
      { id:'dk3', name:'Track Suit',         price:900, qty:1 },
      { id:'dk4', name:'Track Pant',         price:600, qty:1 },
      { id:'dk5', name:'Track Suit (set 2)', price:600, qty:1 },
    ];
  })();
  var prospectusAmt = 200;
  var dressTotal = _dressItems.reduce(function(s,i){ return s+(i.price*i.qty); }, 0);
  var grandTotal  = admFeeAmt + dressTotal + prospectusAmt;
  var todayStr = new Date().toISOString().split('T')[0];
  var Q = '&#39;'; // safe single-quote entity
  var sid = tempAsgn.id;
  var aid = appId;
  /* Build course + subtype options for Phase II assignment */
  var gnsiCourseOpts = '';
  var gnsiSubtypeMap = {};
  if (typeof GNSI_COURSES !== 'undefined' && Array.isArray(GNSI_COURSES)) {
    GNSI_COURSES.forEach(function(c) {
      gnsiCourseOpts += '<option value="' + esc(c.id) + '">' + esc(c.name) + '</option>';
      gnsiSubtypeMap[c.id] = (c.subTypes || []).map(function(st) {
        return '<option value="' + esc(st.id) + '">' + esc(st.label || st.id)
          + (st.monthlyFee ? ' \u2014 \u20b9' + st.monthlyFee.toLocaleString('en-IN') + '/mo' : '')
          + '</option>';
      }).join('');
    });
  }
  var subtypeInitOpts = gnsiSubtypeMap[Object.keys(gnsiSubtypeMap)[0]] || '<option value="">-- select course first --</option>';
  /* Has Phase II already been assigned on the temp assignment? */
  var phase2Assigned = !!(tempAsgn.subTypeId && tempAsgn.courseAssignedAt);
  var bodyHtml;
  if (alreadyPaid) {
    var rcpt = paidCols[0] ? esc(paidCols[0].receiptNo||'--') : '--';
    var phase2Badge = phase2Assigned
      ? '<div style="background:#eff6ff;border:1.5px solid #93c5fd;border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:12.5px;color:#1d4ed8">'
        + '\ud83c\udf93 Phase II course assigned: <b>' + esc(tempAsgn.subTypeId) + '</b></div>'
      : '';
    var phase2Form = phase2Assigned ? '' :
      '<div style="background:#fefce8;border:1.5px solid #fde047;border-radius:10px;padding:14px 16px;margin-bottom:14px">'
      + '<div style="font-weight:700;font-size:13px;color:#854d0e;margin-bottom:10px">\ud83d\udccc Assign Course &amp; Subtype for Phase II</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
      + '<div><label style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;display:block;margin-bottom:4px">Course *</label>'
      + '<select id="adm-p2-course" onchange="(function(){var m=' + JSON.stringify(gnsiSubtypeMap).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026') + ';var el=document.getElementById(\'adm-p2-sub\');if(el){el.innerHTML=m[this.value]||\'<option value=&quot;&quot;>-- none --</option>\';}}).call(this)" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:8px 10px;font-size:13px;background:var(--surface);color:var(--text);box-sizing:border-box">'
      + '<option value="">-- select course --</option>' + gnsiCourseOpts + '</select></div>'
      + '<div><label style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;display:block;margin-bottom:4px">Subtype *</label>'
      + '<select id="adm-p2-sub" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:8px 10px;font-size:13px;background:var(--surface);color:var(--text);box-sizing:border-box">'
      + '<option value="">-- select course first --</option></select></div>'
      + '</div>'
      + '<button onclick="admAssignPhase2Course(\'' + Q + sid + Q + '\',\'' + Q + aid + Q + '\')" style="margin-top:12px;width:100%;padding:10px;border-radius:8px;background:#854d0e;color:#fff;border:none;font-size:13px;font-weight:800;cursor:pointer">\ud83d\udccc Save Course &amp; Subtype Assignment</button>'
      + '</div>';
    /* Check if advance was also collected */
    var _advCols = cols.filter(function(c){ return c.admAppId === appId && c.feeType === 'advance'; });
    var _advTotal = _advCols.reduce(function(s,c){ return s + (parseInt(c.amountPaid)||0); }, 0);
    var _advBadge = _advTotal > 0
      ? '<div style="background:#fffbeb;border:1.5px solid #fde047;border-radius:8px;padding:8px 14px;margin-bottom:12px;font-size:12.5px;color:#854d0e">'
        + '\u23eb Advance also collected: <b>\u20b9' + _advTotal.toLocaleString('en-IN') + '</b>'
        + (_advCols[0] && _advCols[0].advanceFor ? ' \u00b7 ' + esc(_advCols[0].advanceFor) : '')
        + '</div>'
      : '';
    /* ---- Collect dress kit + prospectus item records for this app ---- */
    var _itemCols  = cols.filter(function(c){ return c.admAppId===appId && c.feeType==='item'; });
    var _itemTotal = _itemCols.reduce(function(s,c){ return s+(parseInt(c.amountPaid)||0); }, 0);
    var _fullPkg   = paidAmt + _itemTotal + (_advTotal||0);
    var _itemRowsHtml = _itemCols.length
      ? _itemCols.map(function(c){
          return '<tr style="border-bottom:.5px solid #bbf7d0">'
            + '<td style="padding:3px 14px;font-size:11.5px;color:#166534">• ' + esc(c.description||c.forMonth) + '</td>'
            + '<td style="padding:3px 14px;text-align:right;font-size:11.5px;color:#166534;font-weight:600">₹' + parseInt(c.amountPaid).toLocaleString('en-IN') + '</td></tr>';
        }).join('')
      : '<tr><td colspan="2" style="padding:4px 14px;font-size:11px;color:#94a3b8;font-style:italic">— No dress kit / prospectus recorded</td></tr>';
    bodyHtml =
        '<div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:10px;overflow:hidden;margin-bottom:12px">'
      + '<div style="padding:11px 16px;display:flex;align-items:center;gap:10px;border-bottom:1px solid #bbf7d0">'
      + '<div style="font-size:26px">✅</div>'
      + '<div>'
      + '<div style="font-weight:800;color:#15803d;font-size:14px">Admission Package Collected</div>'
      + '<div style="font-size:11px;color:#166534;margin-top:1px">Receipt No: <b>' + rcpt + '</b></div>'
      + '</div></div>'
      + '<table style="width:100%;border-collapse:collapse">'
      + '<tr style="border-bottom:.5px solid #bbf7d0;background:#f0fdf4">'
      + '<td style="padding:6px 14px;font-size:12.5px;font-weight:700;color:#15803d">Admission Fee</td>'
      + '<td style="padding:6px 14px;text-align:right;font-size:12.5px;font-weight:700;color:#15803d">₹' + paidAmt.toLocaleString('en-IN') + '</td>'
      + '</tr>'
      + _itemRowsHtml
      + (_advTotal > 0
          ? '<tr style="border-top:.5px solid #bbf7d0"><td style="padding:5px 14px;font-size:11.5px;color:#854d0e">⏫ Advance — ' + esc((_advCols[0]&&_advCols[0].advanceFor)||'') + '</td>'
            + '<td style="padding:5px 14px;text-align:right;font-size:11.5px;color:#854d0e;font-weight:600">₹' + _advTotal.toLocaleString('en-IN') + '</td></tr>'
          : '')
      + '<tr style="background:#dcfce7;border-top:2px solid #16a34a">'
      + '<td style="padding:8px 14px;font-size:13px;font-weight:900;color:#15803d">TOTAL COLLECTED</td>'
      + '<td style="padding:8px 14px;text-align:right;font-size:14px;font-weight:900;color:#15803d">₹' + _fullPkg.toLocaleString('en-IN') + '</td>'
      + '</tr>'
      + '</table>'
      + '</div>'
      + phase2Badge
      + phase2Form
      + '<div style="display:flex;gap:8px;margin-bottom:10px">'
      + '<button onclick="gnsiReprintAdmReceipt(\'' + appId + '\',\'' + sid + '\')" '
      + 'style="flex:1;padding:10px;border-radius:9px;border:1.5px solid #1433a8;background:#eff6ff;'
      + 'color:#1433a8;font-size:13px;font-weight:700;cursor:pointer">🖨 Reprint Receipt</button>'
      + '</div>'
      + '<button onclick="admPayFeeClose();admEnroll(' + aid + ')" '
      + 'style="width:100%;padding:12px;border-radius:10px;background:#15803d;color:#fff;'
      + 'border:none;font-size:15px;font-weight:800;cursor:pointer">✅ Proceed to Enroll</button>';
  } else {
    /* ── Build dress kit rows for itemised breakdown ── */
    var dressRowsHtml = _dressItems.map(function(item){
      return '<tr style="border-bottom:.5px solid var(--border)">'
        + '<td style="padding:4px 10px"><label style="display:flex;align-items:center;gap:7px;cursor:pointer;font-size:12.5px">'
        + '<input type="checkbox" id="dk-chk-'+item.id+'" checked onchange="gnsiAdmRecalcTotal()" style="width:14px;height:14px;accent-color:#1433a8;cursor:pointer"/>'
        + esc(item.name)+'</label></td>'
        + '<td style="padding:4px 10px;text-align:right;font-size:12.5px;font-weight:600">\u20b9'+item.price.toLocaleString('en-IN')+'</td>'
        + '</tr>';
    }).join('');
    bodyHtml = '<div style="background:var(--surface2);border:1.5px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:14px">'
      + '<div style="padding:7px 12px;font-size:11px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:6px">💰 Fee Breakdown <span style="font-weight:400;font-size:10px;color:var(--muted)">(uncheck items not issued — total auto-updates)</span></div>'
      + '<table style="width:100%;border-collapse:collapse">'
      + '<tr style="border-bottom:1px solid var(--border);background:#f8faff">'
      + '<td style="padding:7px 10px;font-size:13px;font-weight:700">Admission Fee</td>'
      + '<td style="padding:7px 10px;text-align:right;font-size:13px;font-weight:700">\u20b9' + admFeeAmt.toLocaleString('en-IN') + '</td>'
      + '</tr>'
      + '<tr style="border-bottom:1px solid var(--border)"><td colspan="2" style="padding:5px 10px 2px;font-size:11px;font-weight:800;color:#1433a8;text-transform:uppercase;letter-spacing:.05em">\ud83d\udc55 Dress Kit</td></tr>'
      + dressRowsHtml
      + '<tr style="border-top:1px solid var(--border);border-bottom:1px solid var(--border)">'
      + '<td style="padding:4px 10px"><label style="display:flex;align-items:center;gap:7px;cursor:pointer;font-size:12.5px">'
      + '<input type="checkbox" id="dk-chk-prosp" checked onchange="gnsiAdmRecalcTotal()" style="width:14px;height:14px;accent-color:#1433a8;cursor:pointer"/>Prospectus</label></td>'
      + '<td style="padding:4px 10px;text-align:right;font-size:12.5px;font-weight:600">\u20b9' + prospectusAmt + '</td>'
      + '</tr>'
      + '<tr style="background:#eff6ff">'
      + '<td style="padding:9px 10px;font-size:14px;font-weight:800;color:#1433a8">Grand Total</td>'
      + '<td style="padding:9px 10px;text-align:right;font-size:15px;font-weight:900;color:#1433a8" id="adm-fee-grand">\u20b9' + grandTotal.toLocaleString('en-IN') + '</td>'
      + '</tr></table>'
      + '<input type="hidden" id="adm-fee-amount" value="' + grandTotal + '"/>'
      + '<input type="hidden" id="adm-fee-admamt" value="' + admFeeAmt + '"/>'
      + '<input type="hidden" id="adm-fee-prosp" value="' + prospectusAmt + '"/>'
      + '<input type="hidden" id="adm-fee-dress-json" value=\'' + JSON.stringify(_dressItems).replace(/'/g,"&#39;") + '\'/>  '
      + '</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">'
      + '<div><label style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;display:block;margin-bottom:4px">Payment Mode</label>'
      + '<select id="adm-fee-mode" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:9px 12px;font-size:13px;background:var(--surface);color:var(--text);box-sizing:border-box"><option>Cash</option><option>UPI</option><option>Bank Transfer</option><option>Cheque</option><option>DD</option></select></div>'
      + '<div><label style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;display:block;margin-bottom:4px">Payment Date</label>'
      + '<input type="date" id="adm-fee-date" value="' + todayStr + '" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:9px 12px;font-size:13px;background:var(--surface);color:var(--text);box-sizing:border-box"/></div>'
      + '<div style="grid-column:1/-1"><label style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;display:block;margin-bottom:4px">Txn / Ref No.</label>'
      + '<input id="adm-fee-txn" placeholder="UPI/Cheque ref" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:9px 12px;font-size:13px;background:var(--surface);color:var(--text);box-sizing:border-box"/></div>'
      + '</div>'
      + '<div style="background:#fffbeb;border:1.5px solid #fde047;border-radius:10px;padding:10px 14px;margin-bottom:12px">'
      + '<div style="font-size:10.5px;font-weight:800;color:#854d0e;text-transform:uppercase;letter-spacing:.07em;margin-bottom:6px">\u23eb Advance Fee <span style="font-weight:400;font-size:10px;color:#92400e">(optional — collected with package)</span></div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
      + '<div><label style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;display:block;margin-bottom:4px">Advance Amount (\u20b9)</label>'
      + '<input type="number" id="adm-adv-amount" min="0" placeholder="0 if none" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:9px 12px;font-size:14px;font-weight:700;background:var(--surface);color:var(--text);box-sizing:border-box"/></div>'
      + '<div><label style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;display:block;margin-bottom:4px">Advance For</label>'
      + '<input id="adm-adv-for" placeholder="e.g. First month / Phase I" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:9px 12px;font-size:13px;background:var(--surface);color:var(--text);box-sizing:border-box"/></div>'
      + '</div></div>'
      + '<div style="display:flex;gap:10px">'
      + '<button onclick="admSaveAdmissionFee(' + Q + sid + Q + ',' + Q + aid + Q + ')" style="flex:1;padding:12px;border-radius:10px;background:#1433a8;color:#fff;border:none;font-size:14px;font-weight:800;cursor:pointer">\u2705 Save &amp; Print Receipt</button>'
      + '<button onclick="admPayFeeClose()" style="padding:12px 18px;border-radius:10px;border:1.5px solid var(--border);background:var(--surface);color:var(--muted);font-size:13px;font-weight:700;cursor:pointer">Cancel</button>'
      + '</div>';
  }
  return '<div style="position:fixed;inset:0;background:rgba(8,15,38,.6);z-index:9999;display:flex;align-items:flex-start;justify-content:center;padding:16px;backdrop-filter:blur(4px);overflow-y:auto" onclick="if(event.target===this)admPayFeeClose()">'
    + '<div style="background:var(--surface);border-radius:16px;width:580px;max-width:100%;box-shadow:0 24px 80px rgba(0,0,0,.35);overflow:visible;margin:auto;flex-shrink:0" onclick="event.stopPropagation()">'
    + '<div style="background:linear-gradient(135deg,#1433a8,#2563eb);padding:14px 20px;display:flex;align-items:center;justify-content:space-between">'
    + '<div>'
    + '<div style="font-size:11px;color:rgba(255,255,255,.7);font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin-bottom:3px">MANDATORY \u00b7 COMPLETE BEFORE ENROLLMENT</div>'
    + '<div style="font-size:18px;font-weight:800;color:#fff">\ud83d\udcb0 Collect Admission Package</div>'
    + '<div style="font-size:11.5px;color:rgba(255,255,255,.75);margin-top:2px;font-weight:600">Admission Fee + Dress Kit (5 items) + Prospectus</div>'
    + '<div style="font-size:12px;color:rgba(255,255,255,.8);margin-top:3px">' + esc(a.name) + (a.admNo ? ' \u00b7 ' + esc(a.admNo) : '') + ' \u00b7 ' + esc(a.cls||'--') + '</div>'
    + '</div>'
    + '<button onclick="admPayFeeClose()" style="background:rgba(255,255,255,.15);border:none;border-radius:8px;padding:6px 12px;color:#fff;font-size:13px;font-weight:700;cursor:pointer">\u2715</button>'
    + '</div>'
    + '<div style="padding:16px 20px;max-height:calc(100vh - 160px);overflow-y:auto">' + bodyHtml + '</div>'
    + '</div></div>';
}
/* ── Recalculate grand total when items are checked/unchecked ── */
window.gnsiAdmRecalcTotal = function() {
  try {
    var dressJson = (document.getElementById('adm-fee-dress-json')||{}).value || '[]';
    var dressItems = JSON.parse(dressJson);
    var admAmt = parseInt((document.getElementById('adm-fee-admamt')||{}).value||0);
    var prospAmt = parseInt((document.getElementById('adm-fee-prosp')||{}).value||0);
    var dressTotal = dressItems.reduce(function(s,item){
      var chk = document.getElementById('dk-chk-'+item.id);
      return s + (chk && chk.checked ? (item.price * item.qty) : 0);
    }, 0);
    var prospChk = document.getElementById('dk-chk-prosp');
    var prospIncluded = prospChk ? prospChk.checked : true;
    var grand = admAmt + dressTotal + (prospIncluded ? prospAmt : 0);
    var grandEl = document.getElementById('adm-fee-grand');
    if (grandEl) grandEl.textContent = '₹' + grand.toLocaleString('en-IN');
    var hiddenAmt = document.getElementById('adm-fee-amount');
    if (hiddenAmt) hiddenAmt.value = grand;
  } catch(e) { console.error('gnsiAdmRecalcTotal:', e); }
};

function admSaveAdmissionFee(asgnId, admAppId) {
  /* ── Read form values ── */
  var mode   = (document.getElementById('adm-fee-mode')||{}).value || 'Cash';
  var date   = (document.getElementById('adm-fee-date')||{}).value || new Date().toISOString().split('T')[0];
  var txn    = ((document.getElementById('adm-fee-txn')||{}).value||'').trim();
  var advAmt = parseInt((document.getElementById('adm-adv-amount')||{}).value||0) || 0;
  var advFor = ((document.getElementById('adm-adv-for')||{}).value||'').trim() || 'Advance';

  /* ── Read itemised amounts ── */
  var _admOnlyAmt = parseInt((document.getElementById('adm-fee-admamt')||{}).value||0) || 6000;
  var _prospAmt   = parseInt((document.getElementById('adm-fee-prosp')||{}).value||0) || 200;
  var _prospChk   = document.getElementById('dk-chk-prosp');
  var _prospIssued = _prospChk ? _prospChk.checked : true;

  /* ── Read dress kit items ── */
  var _dressJson = ((document.getElementById('adm-fee-dress-json')||{}).value||'[]');
  var _dressItems = [];
  try { _dressItems = JSON.parse(_dressJson); } catch(e) {}
  var _issuedItems = _dressItems.filter(function(item){
    var chk = document.getElementById('dk-chk-'+item.id);
    return chk ? chk.checked : true;
  });
  var _dressTotal  = _issuedItems.reduce(function(s,i){ return s+(i.price*(i.qty||1)); }, 0);
  var _grandTotal  = _admOnlyAmt + _dressTotal + (_prospIssued ? _prospAmt : 0);

  if (_grandTotal <= 0) { alert('Total amount is zero. Please check items.'); return; }

  /* ── Save core admission fee ── */
  if (typeof _fmcSaveCol !== 'function') { alert('Fee system not ready. Try again.'); return; }
  var col = _fmcSaveCol(asgnId, {
    forMonth:    'Admission Fee',
    amountPaid:  _admOnlyAmt,
    payDate:     date, payMode: mode, txnRef: txn,
    feeType:     'admission', description: 'Admission Fee',
    admAppId:    String(admAppId)
  }, 'ADM');
  if (!col) { alert('Could not save admission fee. Try again.'); return; }

  /* ── Save each issued dress kit item ── */
  _issuedItems.forEach(function(item) {
    _fmcSaveCol(asgnId, {
      forMonth:    item.name,
      amountPaid:  item.price * (item.qty||1),
      payDate:     date, payMode: mode, txnRef: txn,
      feeType:     'item', description: 'Dress Kit \u2014 ' + item.name,
      admAppId:    String(admAppId)
    }, 'ITM');
  });

  /* ── Save prospectus if issued ── */
  if (_prospIssued && _prospAmt > 0) {
    _fmcSaveCol(asgnId, {
      forMonth:    'Prospectus',
      amountPaid:  _prospAmt,
      payDate:     date, payMode: mode, txnRef: txn,
      feeType:     'item', description: 'Prospectus',
      admAppId:    String(admAppId)
    }, 'PRO');
  }

  /* ── Save advance if provided ── */
  var advCol = null;
  if (advAmt > 0) {
    advCol = _fmcSaveCol(asgnId, {
      forMonth:    'Advance \u2014 ' + advFor,
      amountPaid:  advAmt,
      payDate:     date, payMode: mode, txnRef: txn,
      feeType:     'advance', description: 'Advance \u2014 ' + advFor,
      admAppId:    String(admAppId), advanceFor: advFor
    }, 'ADV');
  }

  /* ── Mark application as fee-paid ── */
  var apps = loadAdmApps();
  apps = apps.map(function(x){
    return String(x.id) === String(admAppId)
      ? Object.assign({}, x, {
          admFeePaid:    true,
          admFeeAmount:  _grandTotal,
          admFeeDate:    date,
          admFeeReceipt: col.receiptNo,
          admIssuedItems: _issuedItems.map(function(i){ return i.name; }),
          admProspectus:  _prospIssued,
          advancePaid:   advAmt > 0 ? advAmt : (x.advancePaid||0),
          advanceFor:    advAmt > 0 ? advFor  : (x.advanceFor||'')
        })
      : x;
  });
  localStorage.setItem('gnsi_adm_apps', JSON.stringify(apps));
  localStorage.setItem('gnsi_kv_ts_gnsi_adm_apps', new Date().toISOString());
  if (typeof gnsiKVPush === 'function') gnsiKVPush('gnsi_adm_apps', apps);
  if (typeof saveAdmApps === 'function') saveAdmApps(apps);

  /* ── Update assignment advance ── */
  if (advAmt > 0 && typeof _fmcLoadAsgns === 'function' && typeof _fmcSaveAsgns === 'function') {
    _fmcSaveAsgns(_fmcLoadAsgns().map(function(x){
      return x.id === asgnId ? Object.assign({}, x, { advancePaid: (x.advancePaid||0)+advAmt }) : x;
    }));
  }

  /* ── Print full admission package receipt ── */
  var asgns = _fmcLoadAsgns();
  var asgn  = asgns.find(function(x){ return x.id === asgnId; });
  gnsiPrintAdmissionPackageReceipt({
    receiptNo:    col.receiptNo,
    studentName:  col.studentName,
    admNo:        col.admNo || (asgn && asgn.admNo) || '--',
    className:    col.className || (asgn && asgn.className) || '--',
    date:         date, payMode: mode, txnRef: txn,
    collectedBy:  col.collectedBy,
    admFeeAmt:    _admOnlyAmt,
    issuedItems:  _issuedItems,
    prospectus:   _prospIssued,
    prospectusAmt:_prospAmt,
    grandTotal:   _grandTotal,
    advAmt:       advAmt,
    advFor:       advFor
  });

  showToast('\u2705 Admission Package \u2014 Receipt ' + col.receiptNo + ' \u00b7 Grand Total \u20b9' + _grandTotal.toLocaleString('en-IN'), '#15803d');
  render();
  /* Prominent fee-paid success banner */
  setTimeout(function(){
    var _b = document.createElement('div');
    _b.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:99999;'
      + 'background:#15803d;color:#fff;border-radius:14px;padding:14px 28px;'
      + 'font-family:DM Sans,sans-serif;font-size:15px;font-weight:800;'
      + 'box-shadow:0 8px 32px rgba(21,128,61,.45);display:flex;align-items:center;gap:12px;'
      + 'white-space:nowrap;animation:gnsiSlideDown .3s ease';
    _b.innerHTML = '<span style="font-size:26px">✅</span>'
      + '<div style="line-height:1.4">'
      + '<div>Fee Paid Successfully!</div>'
      + '<div style="font-size:12px;font-weight:500;opacity:.85">'
      + 'Total ₹' + _grandTotal.toLocaleString('en-IN') + ' · Receipt ' + col.receiptNo
      + ' — Click “Proceed to Enroll”</div>'
      + '</div>'
      + '<button onclick="this.parentNode.remove()" style="background:rgba(255,255,255,.2);'
      + 'border:none;border-radius:6px;color:#fff;padding:4px 10px;font-size:14px;cursor:pointer">×</button>';
    document.body.appendChild(_b);
    setTimeout(function(){ if(_b.parentNode) _b.remove(); }, 7000);
  }, 400);
}

/* ── Admission Package Receipt Printer ──────────────────────────────────── */
/* -- Reprint admission receipt from saved fee records ------------------- */
window.gnsiReprintAdmReceipt = function(appId, asgnId) {
  var cols    = typeof _fmcLoadCols  === 'function' ? _fmcLoadCols()  : [];
  var asgns   = typeof _fmcLoadAsgns === 'function' ? _fmcLoadAsgns() : [];
  var asgn    = asgns.find(function(x){ return x.id===asgnId || x.admAppId===String(appId); });
  var admCol  = cols.find(function(c){ return c.admAppId===String(appId) && c.feeType==='admission'; });
  var itemCols= cols.filter(function(c){ return c.admAppId===String(appId) && c.feeType==='item'; });
  var advCols = cols.filter(function(c){ return c.admAppId===String(appId) && c.feeType==='advance'; });
  if (!admCol) {
    if (typeof showToast==='function') showToast('⚠️ No admission record found to reprint','#c0291d');
    return;
  }
  var issuedItems = itemCols.map(function(c){
    return { name: (c.description||c.forMonth||'').replace('Dress Kit — ',''), price: parseInt(c.amountPaid)||0, qty: 1 };
  });
  var prospectusCol = itemCols.find(function(c){ return (c.description||'').toLowerCase().includes('prospectus'); });
  var admAmt    = parseInt(admCol.amountPaid)||0;
  var itemTotal = itemCols.reduce(function(s,c){ return s+(parseInt(c.amountPaid)||0); }, 0);
  var advAmt    = advCols.reduce(function(s,c){ return s+(parseInt(c.amountPaid)||0); }, 0);
  gnsiPrintAdmissionPackageReceipt({
    receiptNo:     admCol.receiptNo,
    studentName:   admCol.studentName,
    admNo:         admCol.admNo || (asgn&&asgn.admNo) || '--',
    className:     admCol.className || (asgn&&asgn.className) || '--',
    date:          admCol.payDate,
    payMode:       admCol.payMode,
    txnRef:        admCol.txnRef || '',
    collectedBy:   admCol.collectedBy,
    admFeeAmt:     admAmt,
    issuedItems:   issuedItems,
    prospectus:    !!prospectusCol,
    prospectusAmt: prospectusCol ? parseInt(prospectusCol.amountPaid)||0 : 0,
    grandTotal:    admAmt + itemTotal,
    advAmt:        advAmt,
    advFor:        advCols[0] ? (advCols[0].advanceFor||advCols[0].forMonth||'') : ''
  });
};

function gnsiPrintAdmissionPackageReceipt(d) {
  var esc = function(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); };
  var fmt = function(n){ return Number(n||0).toLocaleString('en-IN'); };
  var now = new Date().toLocaleDateString('en-IN',{year:'numeric',month:'long',day:'numeric'});

  /* Item rows */
  var itemRows = '<tr><td style="padding:7px 10px;font-weight:700">Admission Fee</td>'
    + '<td style="padding:7px 10px;text-align:right;font-weight:700">\u20b9' + fmt(d.admFeeAmt) + '</td></tr>';

  if (d.issuedItems && d.issuedItems.length) {
    itemRows += '<tr><td colspan="2" style="padding:5px 10px 2px;font-size:10px;font-weight:800;color:#1433a8;letter-spacing:.05em;text-transform:uppercase">'
      + '\ud83d\udc55 Dress Kit Items Issued</td></tr>';
    d.issuedItems.forEach(function(item){
      itemRows += '<tr><td style="padding:4px 10px 4px 20px;font-size:11px">'
        + '\u2022 ' + esc(item.name) + '</td>'
        + '<td style="padding:4px 10px;text-align:right;font-size:11px">\u20b9' + fmt(item.price*(item.qty||1)) + '</td></tr>';
    });
  } else {
    itemRows += '<tr><td colspan="2" style="padding:4px 10px;font-size:11px;color:#94a3b8;font-style:italic">&nbsp;&nbsp;\u2014 No dress kit items issued</td></tr>';
  }

  if (d.prospectus) {
    itemRows += '<tr><td style="padding:4px 10px;font-size:11px">Prospectus</td>'
      + '<td style="padding:4px 10px;text-align:right;font-size:11px">\u20b9' + fmt(d.prospectusAmt) + '</td></tr>';
  } else {
    itemRows += '<tr><td colspan="2" style="padding:4px 10px;font-size:11px;color:#94a3b8;font-style:italic">&nbsp;&nbsp;\u2014 Prospectus not issued</td></tr>';
  }

  if (d.advAmt > 0) {
    itemRows += '<tr><td style="padding:4px 10px;font-size:11px;color:#854d0e">'
      + '\u23eb Advance (' + esc(d.advFor) + ')</td>'
      + '<td style="padding:4px 10px;text-align:right;font-size:11px;color:#854d0e">\u20b9' + fmt(d.advAmt) + '</td></tr>';
  }

  /* One receipt copy HTML */
  var copy = function(label){
    return '<div class="half">'
      + '<div class="copy-label">' + label + '</div>'
      + '<div class="receipt">'
      + '<div class="rhead">'
      + '<div class="school-name">'+(window.TENANT?window.TENANT.name:'Guidance Navodaya &amp; Sainik Institute')+'</div>'
      + '<div class="school-sub">'+(window.TENANT?window.TENANT.address+' &middot; Est. '+window.TENANT.established:'Khangabok, Thoubal, Manipur &middot; Est. 2016')+'</div>'
      + '<div class="doc-type">Admission Package Receipt</div>'
      + '<div class="meta-row">'
      + '<span>Receipt No: <b class="rcpt-no">' + esc(d.receiptNo) + '</b></span>'
      + '<span>Date: <b>' + now + '</b></span>'
      + '</div></div>'
      + '<table class="rtable">'
      + '<tr><td class="lbl">Student Name</td><td class="val-b">' + esc(d.studentName) + '</td></tr>'
      + '<tr><td class="lbl">Adm. No.</td><td>' + esc(d.admNo) + '</td></tr>'
      + '<tr><td class="lbl">Class</td><td>' + esc(d.className) + '</td></tr>'
      + '<tr><td class="lbl">Pay Date</td><td>' + esc(d.date) + '</td></tr>'
      + '<tr><td class="lbl">Pay Mode</td><td>' + esc(d.payMode) + (d.txnRef ? ' &middot; Ref: ' + esc(d.txnRef) : '') + '</td></tr>'
      + '</table>'
      + '<table class="rtable" style="margin-top:6px;border-top:1.5px solid #c7d7f5">'
      + '<tr><td colspan="2" style="padding:5px 10px 2px;font-size:10px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:.05em">Fee Breakdown</td></tr>'
      + itemRows
      + '<tr style="border-top:2px solid #1433a8;background:#eff6ff">'
      + '<td style="padding:8px 10px;font-size:13px;font-weight:900;color:#1433a8">GRAND TOTAL</td>'
      + '<td style="padding:8px 10px;text-align:right;font-size:14px;font-weight:900;color:#1433a8">\u20b9' + fmt(d.grandTotal) + '</td></tr>'
      + (d.advAmt > 0 ? '<tr><td colspan="2" style="padding:4px 10px;font-size:10px;color:#854d0e;font-style:italic">(includes advance of \u20b9' + fmt(d.advAmt) + ' for ' + esc(d.advFor) + ')</td></tr>' : '')
      + '</table>'
      + '<div class="rfooter">'
      + '<span>Collected by: <b>' + esc(d.collectedBy||'Admin') + '</b></span>'
      + '<span class="auth">GNSI \u2014 Authorised Receipt</span>'
      + '</div>'
      + '</div></div>';
  };

  var html = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">'
    + '<title>Admission Receipt \u2014 ' + esc(d.receiptNo) + '</title>'
    + '<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">'
    + '<style>'
    + '*{margin:0;padding:0;box-sizing:border-box}'
    + 'body{background:#f0f4fb;font-family:"DM Sans",sans-serif;font-size:12px;color:#1a2040}'
    + '@page{size:A4 portrait;margin:0}'
    + '@media print{body{background:#fff}.no-print{display:none!important}'
    + '.page{width:210mm;min-height:297mm;padding:0;box-shadow:none;background:#fff}'
    + '.half{height:148.5mm;padding:8mm 12mm;page-break-inside:avoid}'
    + '.divider{border:none;border-top:1.5px dashed #8a9fd4;margin:0 12mm}}'
    + '.page{width:210mm;min-height:297mm;margin:20px auto;background:#fff;box-shadow:0 4px 32px rgba(0,0,0,.18)}'
    + '.half{height:148.5mm;padding:8mm 12mm;display:flex;flex-direction:column;gap:6px;overflow:hidden}'
    + '.divider{border:none;border-top:1.5px dashed #8a9fd4;margin:0 12mm}'
    + '.copy-label{font-size:9px;font-weight:700;letter-spacing:.08em;color:#6474a0;text-align:right;margin-bottom:2px}'
    + '.receipt{display:flex;flex-direction:column;gap:5px;height:100%}'
    + '.rhead{border-bottom:1.5px solid #c7d7f5;padding-bottom:5px}'
    + '.school-name{font-family:"Playfair Display",serif;font-size:15px;font-weight:800;color:#1433a8;text-align:center}'
    + '.school-sub{font-size:9px;color:#6474a0;text-align:center;margin-top:2px}'
    + '.doc-type{font-size:11px;font-weight:700;color:#1433a8;text-align:center;margin-top:3px;text-transform:uppercase;letter-spacing:.06em}'
    + '.meta-row{display:flex;justify-content:space-between;font-size:10px;color:#6474a0;margin-top:4px}'
    + '.rcpt-no{font-family:monospace;color:#1433a8;font-size:11px}'
    + '.rtable{width:100%;border-collapse:collapse;font-size:11px}'
    + '.rtable tr{border-bottom:.5px solid #e8edf8}'
    + '.lbl{color:#64748b;padding:5px 10px;width:38%}'
    + '.val-b{font-weight:700;padding:5px 10px}'
    + '.rfooter{display:flex;justify-content:space-between;align-items:flex-end;margin-top:auto;padding-top:6px;border-top:1px solid #e8edf8;font-size:10px;color:#64748b}'
    + '.auth{font-weight:700;color:#1433a8}'
    + '.no-print{text-align:center;padding:16px;font-family:"DM Sans",sans-serif}'
    + '.no-print button{padding:10px 28px;background:#1433a8;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;margin:0 6px}'
    + '</style></head><body>'
    + '<div class="no-print">'
    + '<button onclick="window.print()">🖨️ Print Receipt</button>'
    + '<button onclick="window.close()" style="background:#64748b">✕ Close</button>'
    + '</div>'
    + '<div class="page">'
    + copy('Office Copy')
    + '<hr class="divider">'
    + copy('Student Copy')
    + '</div></body></html>';

  var pw = window.open('', '_blank', 'width=860,height=700,scrollbars=yes');
  if (!pw) { showToast('Popup blocked \u2014 allow popups to print receipt', '#c0291d'); return; }
  pw.document.open(); pw.document.write(html); pw.document.close();
  pw.onload = function(){ pw.focus(); pw.print(); };
}
function admAssignPhase2Course(asgnId, admAppId) {
  var courseEl  = document.getElementById('adm-p2-course');
  var subtypeEl = document.getElementById('adm-p2-sub');
  var course  = courseEl  ? courseEl.value.trim()  : '';
  var subtype = subtypeEl ? subtypeEl.value.trim() : '';
  if (!course || !subtype) { alert('Please select both Course and Subtype.'); return; }
  /* Update the temp fee-assignment record with Phase II data */
  var asgns = (typeof _fmcLoadAsgns === 'function') ? _fmcLoadAsgns() : [];
  asgns = asgns.map(function(x) {
    if (x.id !== asgnId) return x;
    return Object.assign({}, x, {
      subTypeId:        subtype,
      courseAssignedAt: new Date().toISOString(),
      courseAssignedBy: (typeof currentUser !== 'undefined' && currentUser) ? currentUser.name : 'System'
    });
  });
  if (typeof _fmcSaveAsgns === 'function') _fmcSaveAsgns(asgns);
  /* Also persist back on the admission application */
  var apps = loadAdmApps();
  apps = apps.map(function(x) {
    return String(x.id) === String(admAppId)
      ? Object.assign({}, x, { phase2Course: course, phase2SubType: subtype, phase2AssignedAt: new Date().toISOString() })
      : x;
  });
  localStorage.setItem('gnsi_adm_apps', JSON.stringify(apps));
  localStorage.setItem('gnsi_kv_ts_gnsi_adm_apps', new Date().toISOString());
  if (typeof gnsiKVPush === 'function') gnsiKVPush('gnsi_adm_apps', apps);
  if (typeof saveAdmApps === 'function') saveAdmApps(apps);
  showToast('✅ Phase II course assigned: ' + subtype, '#854d0e');
  render();
}
function buildAdmProfile(id){
  var a=(loadAdmApps().find(function(x){return x.id===id;}))||{};
  var statColors={Applied:'#3b78c9','Under Review':'#f59e0b',Admitted:'#8b5cf6',Enrolled:'#16a34a',Rejected:'#dc2626',Waitlisted:'#94a3b8'};
  var col=statColors[a.status]||'#64748b';
  var hue=(a.name||'X').split('').reduce(function(acc,c){return acc+c.charCodeAt(0);},0)%360;
  var fld=function(lbl,val){
    if(!val)return'';
    return'<div style="margin-bottom:8px"><div style="font-size:9.5px;font-weight:700;color:var(--muted2);text-transform:uppercase;letter-spacing:.1em;font-family:\'JetBrains Mono\',monospace">'+lbl+'</div>'
      +'<div style="font-size:13px;font-weight:600;color:var(--text);margin-top:1px">'+esc(val)+'</div></div>';
  };
  return '<div style="position:fixed;inset:0;background:rgba(8,15,38,.55);z-index:300;display:flex;align-items:flex-start;justify-content:center;padding-top:40px;overflow-y:auto;backdrop-filter:blur(4px)" onclick="if(event.target===this){admViewId=null;render()}">'
    +'<div style="background:var(--surface);border-radius:18px;width:760px;max-width:97vw;box-shadow:var(--shadow-lg);overflow:hidden;margin-bottom:40px" onclick="event.stopPropagation()">'
    +'<div style="background:linear-gradient(135deg,'+col+','+col+'cc);padding:24px 28px;display:flex;align-items:center;gap:18px">'
    +'<div style="width:60px;height:60px;border-radius:50%;background:rgba(255,255,255,.2);border:2.5px solid rgba(255,255,255,.5);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;color:#fff;flex-shrink:0">'
    +(a.name||'?').trim().split(' ').slice(0,2).map(function(w){return w[0];}).join('').toUpperCase()+'</div>'
    +'<div style="flex:1">'
    +'<div style="font-family:\'Playfair Display\',serif;font-size:21px;font-weight:700;color:#fff">'+esc(a.name)+'</div>'
    +'<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px">'
    +(a.admNo?'<span style="font-size:12px;color:rgba(255,255,255,.85);background:rgba(0,0,0,.18);padding:2px 10px;border-radius:20px">'+esc(a.admNo)+'</span>':'')
    +(a.cls?'<span style="font-size:12px;color:rgba(255,255,255,.85);background:rgba(0,0,0,.18);padding:2px 10px;border-radius:20px">'+esc(a.cls)+'</span>':'')
    +'<span style="font-size:12px;font-weight:700;padding:2px 10px;border-radius:20px;background:rgba(255,255,255,.25);color:#fff">'+esc(a.status)+'</span>'
    +'</div></div>'
    +'<div style="display:flex;gap:8px;flex-direction:column">'
    +'<button onclick="admViewId=null;admEditId='+id+';admFormOpen=true;render()" style="padding:7px 14px;border-radius:8px;border:1.5px solid rgba(255,255,255,.4);background:rgba(255,255,255,.15);color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">✏️ Edit</button>'
    +(a.status==='Admitted'?'<div style="display:flex;gap:6px">'  +'<button data-gnsi-collect-fee="'+id+'" style="padding:7px 12px;border-radius:8px;border:none;background:#f59e0b;color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">💰 '+(admCheckFeePaid(id)?'View Package':'Collect Fee')+'</button>'  +(admCheckFeePaid(id)?'<button onclick="admViewId=null;admEnroll('+id+')" style="padding:7px 12px;border-radius:8px;border:none;background:#16a34a;color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">✅ Enroll</button>':'')  +'</div>':'')
    +'<button onclick="admViewId=null;render()" style="padding:7px 14px;border-radius:8px;border:1.5px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:rgba(255,255,255,.8);font-size:12px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">✕ Close</button>'
    +'</div></div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;padding:0">'
    +'<div style="padding:18px 20px;border-right:1px solid var(--border-soft)">'
    +'<div style="font-size:11px;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:.1em;font-family:\'JetBrains Mono\',monospace;margin-bottom:12px;padding-bottom:6px;border-bottom:2px solid var(--accent-light)">Personal</div>'
    +fld('Date of Birth',a.dob?admFmt(a.dob):'')
    +fld('Gender',a.gender)+fld('Blood Group',a.blood)+fld('Category',a.category)+fld('Previous School',a.prevSchool)
    +'</div>'
    +'<div style="padding:18px 20px;border-right:1px solid var(--border-soft)">'
    +'<div style="font-size:11px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:.1em;font-family:\'JetBrains Mono\',monospace;margin-bottom:12px;padding-bottom:6px;border-bottom:2px solid #dcfce7">Parent</div>'
    +fld("Father",a.father)+fld("Mother",a.mother)+fld('Phone',a.phone)+fld('WhatsApp',a.whatsapp)+fld('Address',a.address)
    +'</div>'
    +'<div style="padding:18px 20px">'
    +'<div style="font-size:11px;font-weight:700;color:#8b5cf6;text-transform:uppercase;letter-spacing:.1em;font-family:\'JetBrains Mono\',monospace;margin-bottom:12px;padding-bottom:6px;border-bottom:2px solid #ede9fe">Documents</div>'
    +(ADM_DOCS.map(function(d){var ok=(a.docs||[]).indexOf(d)!==-1;return'<div style="display:flex;align-items:center;gap:8px;margin-bottom:7px;font-size:12.5px;color:'+(ok?'#16a34a':'var(--muted)')+'"><span>'+(ok?'✅':'☐')+'</span>'+esc(d)+'</div>';}).join(''))
    +'</div></div>'
    +(a.remarks?'<div style="padding:12px 20px;background:var(--surface2);border-top:1px solid var(--border-soft);font-size:12.5px;color:var(--muted)"><b>Remarks:</b> '+esc(a.remarks)+'</div>':'')
    +'<div style="padding:12px 20px;background:var(--surface2);border-top:1px solid var(--border-soft);display:flex;align-items:center;gap:12px;flex-wrap:wrap">'
    +'<span style="font-size:11.5px;color:var(--muted)">Change Status:</span>'
    +ADM_STATUSES.map(function(st){return'<button onclick="admChangeStatus('+id+',\''+st+'\')" style="font-size:11px;padding:4px 11px;border-radius:6px;border:1px solid '+(a.status===st?col:'var(--border)')+';background:'+(a.status===st?col+'22':'var(--surface2)')+';color:'+(a.status===st?col:'var(--muted)')+';cursor:pointer;font-weight:700;font-family:\'DM Sans\',sans-serif">'+st+'</button>';}).join('')
    +'<span style="margin-left:auto;font-size:11px;color:var(--muted2)">Application ID: #'+id+'</span>'
    +(gnsiCanDeleteAdmission()?'<button data-adm-del="'+id+'" style="padding:5px 14px;border-radius:7px;border:1.5px solid #fca5a5;background:#fee2e2;color:#dc2626;cursor:pointer;font-size:11.5px;font-weight:700;font-family:sans-serif;margin-left:8px">🗑 Delete Record</button>':'')
    +'</div>'
    +'</div></div>';
}
function admChangeStatus(id,status){
  var list=loadAdmApps();
  list=list.map(function(a){return a.id===id?Object.assign({},a,{status:status}):a;});
  saveAdmApps(list);
  showToast('Status → '+status,'#8b5cf6');
  admViewId=id;
  render();
}
// -- CSV IMPORT STATE ------------------------------------------
var csvImportState=null;
// {rows:[], headers:[], mapping:{name,roll,phone,cls,hostel,fees}, preview:[], duplicates:[], mode:'add'|'replace'}
var showCsvImport=false;
// -- CSV IMPORT FUNCTIONS --------------------------------------
function csvOpenImport(){
  showCsvImport=true;showAddStudent=false;csvImportState=null;render();
  setTimeout(function(){var el=document.querySelector('#csv-file-input');if(el)el.value='';},100);
}
function csvParse(text){
  // Normalize line endings
  var lines=text.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n').filter(function(l){return l.trim();});
  if(!lines.length)return null;
  function parseLine(line){
    var result=[],cur='',inQ=false;
    for(var i=0;i<line.length;i++){
      var c=line[i];
      if(c==='"'){if(inQ&&line[i+1]==='"'){cur+='"';i++;}else inQ=!inQ;}
      else if(c===','&&!inQ){result.push(cur.trim());cur='';}
      else cur+=c;
    }
    result.push(cur.trim());
    return result;
  }
  var headers=parseLine(lines[0]).map(function(h){return h.replace(/^"|"$/g,'');});
  var rows=lines.slice(1).map(function(l){return parseLine(l);}).filter(function(r){return r.some(function(c){return c.trim();});});
  return{headers:headers,rows:rows};
}
function csvAutoMap(headers){
  var fieldAliases={
    name:        ['name of students','student name','names of students','full name','fullname','student','pupil','sname','sl name','s.name','stud name','candidate','names'],
    roll:        ['roll','roll no','roll number','rollno','roll_no','reg no','reg','registration','sr no','serial','s.no','sl no','sno'],
    phone:       ['phone','mobile','contact','mobile no','phone no','telephone','cell','phno','mob','ph no','contact no','contact number','mobile number'],
    batch:       ['batch','batch name'],
    /* NOTE: 'course' removed from cls aliases — handled separately below.
       cls is populated from BATCH column via csvMapRow get('batch')||get('cls') */
    cls:         ['class','grade','cls','stream','class name'],
    course:      ['course','course name'],
    /* HOUSE column: DAYSCHOOLAR=No, anything else (hostel house name)=Yes
       handled in csvMapRow via hostelFromHouse() */
    hostel:      ['hostel','boarding','boarder','residential','hosteller','day scholar','accomodation','house'],
    fees:        ['fees','fee','payment','paid','fee status','fees status','fee paid','dues','payment status'],
    /* FIX: added extra fields so admin sees full data after CSV import */
    aadhar:      ['aadhar','aadhaar','aadhar no','aadhaar no','uid','uid no','aadhar number','aadhaar number'],
    address:     ['address','addr','residence','location','permanent address','home address'],
    religion:    ['religion','faith','community'],
    category:    ['category','caste','reservation','cat'],
    parentPhone: ['parent phone','father phone','mother phone','guardian phone','parent mobile','father mobile','parent contact','emergency contact','father name','mother name','guardian name'],
    whatsapp:    ['whatsapp','whatsapp no','wa','wa no','whatsapp number'],
    dob:         ['dob','date of birth','birth date','birthday','born'],
    gender:      ['gender','sex','male female'],
    admNo:       ['adm no','adm no.','gcc no','gcc no.','gcc number','admission no','admission number','enrollment no','enrol no']
  };
  var result={};
  headers.forEach(function(h){
    var hl=h.toLowerCase().trim().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
    Object.keys(fieldAliases).forEach(function(field){
      if(!result[h]){
        if(fieldAliases[field].some(function(alias){
          return hl===alias || hl.startsWith(alias) || hl.endsWith(alias) || hl.includes(alias);
        })) result[h]=field;
      }
    });
  });
  return result;
}
function csvHandleFile(file){
  if(!file){return;}
  if(!file.name.match(/\.csv$/i)){showToast('⚠️ Please choose a .csv file.','#ea580c');return;}
  var reader=new FileReader();
  reader.onload=function(e){
    var parsed=csvParse(e.target.result);
    if(!parsed||!parsed.headers.length){showToast('❌ Could not read the CSV file.','#dc2626');return;}
    if(!parsed.rows.length){showToast('⚠️ The CSV file has no data rows.','#ea580c');return;}
    var mapping=csvAutoMap(parsed.headers);
    csvImportState={
      headers:parsed.headers,
      rows:parsed.rows,
      mapping:mapping,
      mode:'add' /* always default to safe Add mode */
    };
    render();
  };
  reader.readAsText(file);
}
function csvUpdateMapping(sel,fieldKey){
  if(!csvImportState)return;
  var idx=parseInt(sel.value);
  // Remove any existing mapping to this fieldKey
  Object.keys(csvImportState.mapping).forEach(function(h){
    if(csvImportState.mapping[h]===fieldKey)delete csvImportState.mapping[h];
  });
  // Map selected header index to fieldKey
  if(!isNaN(idx)&&idx>=0&&csvImportState.headers[idx]){
    csvImportState.mapping[csvImportState.headers[idx]]=fieldKey;
  }
  // Re-render preview (lightweight - just update table)
  render();
}
function csvMapRow(row,st){
  var get=function(fieldKey){
    var h=Object.keys(st.mapping).find(function(k){return st.mapping[k]===fieldKey;});
    if(h===undefined)return'';
    var idx=st.headers.indexOf(h);
    if(idx<0||idx>=row.length)return'';
    return(row[idx]||'').trim();
  };
  var defCls=(document.getElementById('csv-def-cls')||{value:''}).value||'';
  var defHostel=(document.getElementById('csv-def-hostel')||{value:'No'}).value||'No';
  var defFees=(document.getElementById('csv-def-fees')||{value:'Pending'}).value||'Pending';
  // Normalise hostel
  // Auto-detect hostel from HOUSE column:
  // DAYSCHOOLAR (or DAY SCHOLAR) = No; any named house = Yes
  var hostelRaw=get('hostel').toLowerCase().trim();
  var hostelVal;
  if(hostelRaw==='yes'||hostelRaw==='y'||hostelRaw==='1'||hostelRaw==='true'){
    hostelVal='Yes';
  } else if(hostelRaw==='no'||hostelRaw==='n'||hostelRaw==='0'||hostelRaw==='false'||hostelRaw===''){
    hostelVal='No';
  } else if(hostelRaw==='dayschoolar'||hostelRaw==='day scholar'||hostelRaw==='dayscholar'||hostelRaw==='day-scholar'){
    // HOUSE column value — day scholar means NOT in hostel
    hostelVal='No';
  } else if(hostelRaw.length>0){
    // Any other non-empty house name (e.g. SINGGAREI, LOKTAK, KOUBRU) = boarder
    hostelVal='Yes';
  } else {
    hostelVal=defHostel;
  }
  // Normalise fees
  var feesRaw=get('fees').toLowerCase();
  var feesVal=feesRaw==='paid'||feesRaw==='yes'||feesRaw==='1'?'Paid':(feesRaw==='pending'||feesRaw==='no'||feesRaw==='0'||feesRaw==='unpaid'?'Pending':(feesRaw?'Pending':defFees));
  // Determine class: prefer explicit BATCH column, then CLASS column, then default
  var clsVal=get('batch')||get('cls')||defCls;
  // Capitalise first letter for display consistency (ACHIEVER → Achiever)
  if(clsVal){
    clsVal=clsVal.charAt(0).toUpperCase()+clsVal.slice(1).toLowerCase();
  }
  // Determine course from COURSE column if available
  var courseVal=get('course')||get('cls')||'';
  if(courseVal){
    courseVal=courseVal.charAt(0).toUpperCase()+courseVal.slice(1).toLowerCase();
  }
  return{
    name:get('name'),
    roll:get('roll')||get('admNo'),
    phone:get('phone'),
    cls:clsVal,
    course:courseVal,
    hostel:hostelVal,
    fees:feesVal,
    gender:get('gender'),
    dob:get('dob'),
    address:get('address'),
    admNo:get('admNo')||get('roll')
  };
}
function csvDoImport(){
  if(!csvImportState)return;
  var st=csvImportState;
  var defCls=(document.getElementById('csv-def-cls')||{value:''}).value||'';
  var defHostel=(document.getElementById('csv-def-hostel')||{value:'No'}).value||'No';
  var defFees=(document.getElementById('csv-def-fees')||{value:'Pending'}).value||'Pending';
  var mapped=st.rows.map(function(r){return csvMapRow(r,st);}).filter(function(r){return r.name;});
  if(!mapped.length){showToast('⚠️ No valid rows found. Make sure the Name column is mapped.','#ea580c');return;}
  var confirmMsg=st.mode==='replace'
    ?'Replace ALL '+students.length+' existing students with '+mapped.length+' imported students?'
    :'Add '+mapped.length+' students to the existing '+students.length+'?';
  if(!confirm(confirmMsg))return;

  /* ── Disable the import button immediately to prevent double-clicks ── */
  var _importBtn = document.querySelector('.btn.btn-primary[onclick="csvDoImport()"]');
  if(_importBtn){ _importBtn.disabled = true; _importBtn.textContent = '⏳ Importing…'; }

  /* ── Re-enable button on any exit path ── */
  function _resetImportBtn(label){
    var b = document.querySelector('.btn.btn-primary[onclick="csvDoImport()"]') || _importBtn;
    if(b){ b.disabled = false; b.textContent = label || '⬆ Import'; }
  }

  /* ── Safety timeout: if import takes >30s, unblock UI ── */
  var _importSafetyTimer = setTimeout(function(){
    _resetImportBtn('⬆ Import');
    showToast('⚠️ Import timed out. Check network and try again.', '#ea580c');
  }, 30000);

  function _doActualImport(){
    clearTimeout(_importSafetyTimer);

    /* ── Progress bar helper ── */
    var _total = mapped.length;
    var _isReplace = st.mode === 'replace';
    /* Stage weights (must sum to 100):
       replace:  delete=15, build=10, localStorage=15, supaChunks=45, fees=10, done=5
       add:      build=10, localStorage=20, supaChunks=55, fees=10, done=5            */
    var _pct = _isReplace ? 15 : 0; /* replace already did delete phase */
    function _setProgress(pct, label){
      _pct = Math.min(100, Math.max(_pct, pct));
      if(_importBtn){
        _importBtn.textContent = '⏳ ' + _pct + '% — ' + label;
      }
    }
    _setProgress(_pct, _isReplace ? 'Deleted old records…' : 'Starting…');

    /* ── Stage 1: ID sequencing ── */
    if(_isReplace){
      nextId = 10000 + Math.floor(Date.now() / 1000) % 100000;
    }

    /* ── Stage 2: Build in-memory student objects (10%) ── */
    var newStudents = [];
    var _buildEnd = _isReplace ? 25 : 10;
    mapped.forEach(function(r, i){
      var id = ++nextId;
      var stu = {
        id:     id,
        name:   r.name   || '',
        roll:   r.roll   || '',
        phone:  r.phone  || '',
        cls:    r.cls    || defCls,
        hostel: r.hostel || defHostel,
        fees:   r.fees   || defFees,
        session: r.session || ''
      };
      students.push(stu);
      newStudents.push(stu);
    });
    _setProgress(_buildEnd, 'Built ' + newStudents.length + ' records…');

    /* ── Stage 3: stuSaveExtra + localStorage (15-20%) ── */
    var _lsEnd = _isReplace ? 40 : 30;
    var _extraCount = 0;
    newStudents.forEach(function(stu, i){
      var r = mapped[i];
      if(typeof stuSaveExtra === 'function'){
        stuSaveExtra(stu.id, {
          aadhar:       r.aadhar       || '',
          address:      r.address      || '',
          religion:     r.religion     || '',
          category:     r.category     || '',
          parentPhone:  r.parentPhone  || r.parent_phone || '',
          whatsapp:     r.whatsapp     || '',
          dob:          r.dob          || '',
          gender:       r.gender       || '',
          nationality:  r.nationality  || 'Indian',
          admNo:        r.admNo        || r.adm_no || ''
        });
        _extraCount++;
      }
    });
    _setProgress(_lsEnd, 'Saved locally' + (_extraCount ? ' + extra fields' : '') + '…');

    var createdClasses = csvSyncClassesFromStudents(mapped);

    /* ── Stage 4: Supabase chunk upserts (45-55% spread across chunks) ── */
    var _supaStart = _lsEnd;
    var _supaEnd   = _isReplace ? 85 : 85;
    var _supaRange = _supaEnd - _supaStart;

    function _afterSupaSync(){
      /* ── Stage 5: Auto fee enrollment (10%) ── */
      _setProgress(_supaEnd, 'Enrolling fees…');
      try {
        var BATCH_COURSE_MAP = {
          'achiever':'combined',   'leader':'sainik',   'champion':'sainik',
          'lakshya':'navodaya',    'umeed':'navodaya',
          'elite':'foundation',    'prime':'foundation'
        };
        var feeAsgns = (typeof gnsiLoad==='function')
          ? (gnsiLoad('gnsi_fee_asgns') || gnsiLoad('gnsi_sfa_assignments') || [])
          : [];
        try { if(!feeAsgns.length) feeAsgns=JSON.parse(localStorage.getItem('gnsi_fee_asgns')||'[]'); } catch(e){}
        var existingIds = {};
        feeAsgns.forEach(function(a){ existingIds[String(a.stuId)]=true; });
        var added = 0;
        newStudents.forEach(function(stu){
          if(existingIds[String(stu.id)]) return;
          var bKey = (stu.cls||'').toLowerCase().trim();
          var courseId = BATCH_COURSE_MAP[bKey];
          if(!courseId) return;
          var hostelKey = (stu.hostel==='Yes') ? 'boarder' : 'dayscholar';
          feeAsgns.push({
            id: 'csv_fa_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),
            stuId: stu.id,
            studentName: stu.name,
            rollNo: stu.roll||'',
            admNo: '',
            className: stu.cls||'',
            hostel: stu.hostel||'No',
            enrolledAt: new Date().toISOString().split('T')[0],
            subTypeId: courseId+'_'+hostelKey,
            courseAssignedAt: new Date().toISOString(),
            courseAssignedBy: (typeof currentUser!=='undefined'&&currentUser)?currentUser.name:'CSV Import',
            createdBy: 'CSV Import',
            createdAt: new Date().toISOString()
          });
          added++;
        });
        if(added > 0){
          if(typeof gnsiSave==='function'){gnsiSave('gnsi_fee_asgns',feeAsgns);gnsiSave('gnsi_sfa_assignments',feeAsgns);}
          else{localStorage.setItem('gnsi_fee_asgns',JSON.stringify(feeAsgns));if(typeof gnsiKVPush==='function')gnsiKVPush('gnsi_fee_asgns',feeAsgns);}
        }
      } catch(e){ console.warn('[GNSI CSV] Fee auto-enroll failed:', e); }

      /* ── Stage 6: Done (100%) ── */
      _setProgress(100, 'Done!');
      showCsvImport=false; csvImportState=null;
      _resetImportBtn('⬆ Import');
      var msg='✅ Imported '+mapped.length+' student'+(mapped.length!==1?'s':'')+' successfully!';
      if(createdClasses.length){
        msg+=' | 📚 '+createdClasses.length+' class'+(createdClasses.length!==1?'es':'')+' created.';
      }
      showToast(msg+' ☁️ Syncing…', '#16a34a');
      render();
    }

    if(_supa && newStudents.length){
      var _supaRows = newStudents.map(function(s){
        return {
          id:         s.id,
          name:       s.name,
          roll_no:    s.roll   || null,
          phone:      s.phone  || null,
          is_boarder: s.hostel === 'Yes',
          status:     'Active',
          class_id:   (typeof CLASS_ID_MAP !== 'undefined' ? CLASS_ID_MAP[s.cls] : null) || null,
          session:    s.session || null
        };
      });
      var _chunk = 50;
      var _batches = [];
      for(var _ci = 0; _ci < _supaRows.length; _ci += _chunk){
        _batches.push(_supaRows.slice(_ci, _ci + _chunk));
      }
      var _batchDone = 0;
      function _nextBatch(){
        if(_batchDone >= _batches.length){
          setSyncStatus('synced');
          _afterSupaSync();
          return;
        }
        var _bPct = _supaStart + Math.round((_batchDone / _batches.length) * _supaRange);
        var _uploaded = Math.min(_batchDone * _chunk, newStudents.length);
        _setProgress(_bPct, 'Syncing ' + _uploaded + '/' + newStudents.length + '…');
        _supa.from('students')
          .upsert(_batches[_batchDone], {onConflict:'id'})
          .then(function(){ _batchDone++; _nextBatch(); })
          .catch(function(e){
            console.warn('[CSV] Supabase batch '+ _batchDone +' failed:', e);
            _batchDone++; _nextBatch(); /* skip failed batch, keep going */
          });
      }
      _nextBatch();
    } else {
      _afterSupaSync();
    }
  }

  if(st.mode==='replace'){
    /* ── FIX 1: AWAIT the Supabase delete before inserting new rows ──
       Old code fired delete as fire-and-forget → race condition where new
       rows could arrive on other devices and then be wiped by the late delete.
       Now we wait for delete to confirm before pushing any new data. ── */
    var _oldIds = students.map(function(s){ return s.id; });

    // Clear in-memory immediately (local is always source of truth)
    students = [];
    _stuExtraCache = {};

    // Clear localStorage stuex keys
    _oldIds.forEach(function(id){
      try { localStorage.removeItem('gnsi_stuex_'+id); } catch(e){}
    });

    // Clear fee assignments for old students
    try {
      var _oldIdSet = {};
      _oldIds.forEach(function(id){ _oldIdSet[String(id)] = true; });
      var _oldFees = [];
      try { _oldFees = JSON.parse(localStorage.getItem('gnsi_fee_asgns')||'[]'); } catch(e){}
      var _newFees = _oldFees.filter(function(a){ return !_oldIdSet[String(a.stuId)]; });
      localStorage.setItem('gnsi_fee_asgns', JSON.stringify(_newFees));
      if(typeof gnsiKVPush==='function') gnsiKVPush('gnsi_fee_asgns', _newFees);
    } catch(e){ console.warn('[GNSI Replace] Fee cleanup failed:', e); }

    gnsiMarkLocalSave && gnsiMarkLocalSave(8000);

    function _doReplaceDelete(idsToDelete) {
      if(_importBtn) _importBtn.textContent = '⏳ 5% — Deleting ' + idsToDelete.length + ' records…';
      if (_supa && idsToDelete.length) {
        _supa.from('students').delete().in('id', idsToDelete)
          .then(function(){
            if(_importBtn) _importBtn.textContent = '⏳ 10% — Clearing extra data…';
            _supa.from('gnsi_student_extra').delete().in('student_id', idsToDelete)
              .catch(function(e){ console.warn('[GNSI Replace] gnsi_student_extra delete failed:', e); });
            _doActualImport();
          })
          .catch(function(e){
            console.warn('[GNSI Replace] Supabase delete failed, queuing and proceeding:', e);
            if(_importBtn) _importBtn.textContent = '⏳ 10% — Offline — queued delete…';
            var _q = JSON.parse(localStorage.getItem('gnsi_offline_queue')||'[]');
            idsToDelete.forEach(function(id){ _q.push({type:'delete',table:'students',id:id,ts:Date.now()}); });
            localStorage.setItem('gnsi_offline_queue', JSON.stringify(_q));
            _doActualImport();
          });
      } else {
        if(idsToDelete.length){
          var _q2 = JSON.parse(localStorage.getItem('gnsi_offline_queue')||'[]');
          idsToDelete.forEach(function(id){ _q2.push({type:'delete',table:'students',id:id,ts:Date.now()}); });
          localStorage.setItem('gnsi_offline_queue', JSON.stringify(_q2));
        }
        _doActualImport();
      }
    }

    /* SUPABASE-ONLY FIX: always fetch real IDs from Supabase.
       In Supabase-only mode students[] may be empty if user imports
       before Wave-1 finishes. Query the DB for the actual current list. */
    if (_supa) {
      /* Timeout guard: if Supabase hangs, proceed with local IDs after 8s */
      if(_importBtn) _importBtn.textContent = '⏳ 2% — Fetching cloud IDs…';
      var _fetchTimer = setTimeout(function(){
        showToast('⚠️ Cloud fetch slow — importing with local data', '#ea580c');
        _doReplaceDelete(_oldIds);
      }, 8000);
      _supa.from('students').select('id')
        .then(function(res) {
          clearTimeout(_fetchTimer);
          if(_importBtn) _importBtn.textContent = '⏳ 4% — Preparing delete…';
          var dbIds = (res.data || []).map(function(r){ return r.id; });
          var allIds = dbIds.concat(_oldIds.filter(function(id){ return dbIds.indexOf(id) < 0; }));
          _doReplaceDelete(allIds);
        })
        .catch(function() { clearTimeout(_fetchTimer); _doReplaceDelete(_oldIds); });
    } else {
      _doReplaceDelete(_oldIds);
    }
  } else {
    // Add mode — no delete needed, go straight to import
    _doActualImport();
  }
}
function csvSyncClassesFromStudents(importedRows){
  var classes=loadClasses();
  var existingNames={};
  classes.forEach(function(c){existingNames[c.name.trim().toLowerCase()]=true;});
  // Also treat existing TT batch keys/labels as known so we don't create phantom classes
  var knownBatchKeys={};
  if(typeof getTTCols==='function'){
    getTTCols().forEach(function(c){
      knownBatchKeys[c.key.toLowerCase()]=true;
      knownBatchKeys[c.label.toLowerCase()]=true;
    });
  }

  var seen={};
  var toCreate=[];
  importedRows.forEach(function(r){
    if(!r.cls)return;
    var key=r.cls.trim().toLowerCase();
    if(!key)return;
    // Skip if already exists as a class OR matches a known batch key/label
    if(!existingNames[key]&&!seen[key]&&!knownBatchKeys[key]){
      seen[key]=true;
      toCreate.push(r.cls.trim());
    }
  });
  if(!toCreate.length)return[];
  toCreate.forEach(function(clsName){
    classes.push({
      id:'c'+Date.now()+Math.floor(Math.random()*10000),
      name:clsName,
      code:clsName.replace(/[^A-Za-z0-9]/g,'').substring(0,6).toUpperCase(),
      section:'A',
      strength:40,
      teacher:'',
      active:true
    });
  });
  saveClasses(classes);
  return toCreate;
}
function csvDownloadTemplate(){
  var rows=[
    ['Name','Roll No','Phone','Class','Hostel','Fees'],
    ['Student Name','1001','','Class Name','Yes','Paid'],
    ['Student Name 2','1002','','Class Name','No','Pending'],
    ['Student Name 3','1003','','Class Name','Yes','Pending']
  ];
  var csv=rows.map(function(r){return r.map(function(c){return'"'+String(c).replace(/"/g,'""')+'"';}).join(',');}).join('\r\n');
  var blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');a.href=url;a.download='Students_Import_Template.csv';
  document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
}
/* Export current students as CSV */
function csvExportStudents(){
  showToast('⏳ Preparing Student CSV…','#2563eb');

  if(!_canEditFees()){showToast('⛔ Export restricted to Admin, Manager and Accounts only.','#dc2626');return;}
  var rows=[['Roll No','Name','Class','Hostel','Fees','Phone']];
  students.forEach(function(s){rows.push([s.roll||'',s.name,s.cls||'',s.hostel,s.fees,maskPhone(s.phone||'')]);});
  var csv=rows.map(function(r){return r.map(function(c){return'"'+String(c||'').replace(/"/g,'""')+'"';}).join(',');}).join('\r\n');
  var blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');a.href=url;a.download='GNSI_Students_'+new Date().toISOString().split('T')[0]+'.csv';
  document.body.appendChild(a);  showToast('✅ Student CSV ready — '+(students.length)+' rows','#16a34a');
  a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
}
// -- ATTENDANCE ------------------------------------------------
// Status cycle: '' → P → L (Late) → ED (Early Dep) → A → ''
// Extra keys: attDate-Sx-id = arrival time, attDate-Sd-id = departure time
var attTab='staff'; // 'staff' | 'student'
var attModal=null;  // {type,id,name,role}
function attStatusCycle(cur){
  if(cur===''||cur===undefined)return'P';
  if(cur==='P')return'L';
  if(cur==='L')return'ED';
  if(cur==='ED')return'A';
  return'';
}
function attColor(st){
  if(st==='P')return{bg:'#dcfce7',col:'#16a34a',bdr:'#86efac'};
  if(st==='L')return{bg:'#fef9c3',col:'#ca8a04',bdr:'#fde047'};
  if(st==='ED')return{bg:'#fff7ed',col:'#ea580c',bdr:'#fdba74'};
  if(st==='A')return{bg:'#fee2e2',col:'#dc2626',bdr:'#fca5a5'};
  return{bg:'#f4f1eb',col:'#7a7468',bdr:'#e2ddd5'};
}
function attLabel(st){
  if(st==='P')return'P';
  if(st==='L')return'Late';
  if(st==='ED')return'Early Dep';
  if(st==='A')return'A';
  return'--';
}
