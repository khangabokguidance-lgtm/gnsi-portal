/* GNSI PORTAL — modules/staff.js
   Staff pages: renderStaff, renderStaffRows, renderStaffTable, renderStaffBiodata
   Staff biodata: sbdSave, sbdHandlePhoto, sbdClearPhoto
   DEPENDS ON: core/utils.js, core/state.js */

function renderStaff(){
  var depts=['All','Concern Teacher','Hostel Staff','IT & Counter Staff','Non-Teaching Staff'];
  var filtered=getFilteredStaff();
  var formHTML='';
  var _nsRoleColors={admin:'#1433a8',manager:'#7c3aed',accounts:'#d4a853',teacher:'#16a34a',hostel:'#3b78c9',it:'#0891b2',housemaster:'#9d174d',reception:'#0e7490',staff:'#6474a0'};
  if(showAddStaff)formHTML=''
    +'<div class="form-panel" style="border:2px solid #e0e8f9;border-radius:14px;background:linear-gradient(135deg,#f8faff,#fff);padding:0;overflow:hidden">'
    // -- Header
    +'<div style="background:linear-gradient(135deg,#1433a8,#1b44cc);padding:18px 24px;display:flex;align-items:center;gap:12px">'
    +'<div style="width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;font-size:20px">👤</div>'
    +'<div><div style="font-size:16px;font-weight:800;color:#fff;font-family:\'Playfair Display\',serif">Add New Staff Member</div>'
    +'<div style="font-size:11px;color:rgba(255,255,255,0.72);margin-top:2px">Login credentials are created automatically and synced</div></div></div>'
    // -- Section 1: Basic Info
    +'<div style="padding:20px 24px 0">'
    +'<div style="font-size:10px;font-weight:800;color:#1433a8;text-transform:uppercase;letter-spacing:.12em;font-family:\'JetBrains Mono\',monospace;margin-bottom:12px;padding-bottom:6px;border-bottom:2px solid #e8edfa">📋 Basic Information</div>'
    +'<div class="form-grid g3">'
    +'<div class="form-group"><label>Full Name *</label><input id="ns-name" placeholder="Full name" oninput="gnsiNsAutoFill()"/></div>'
    +'<div class="form-group"><label>Role / Designation *</label><input id="ns-role" placeholder="e.g. Concern Teacher"/></div>'
    +'<div class="form-group"><label>Department</label><select id="ns-dept">'+Object.keys(DEPT_COLORS).map(function(d){return'<option>'+d+'</option>'}).join('')+'</select></div>'
    +'<div class="form-group"><label>Phone</label><input id="ns-phone" placeholder="10-digit number"/></div>'
    +'<div class="form-group"><label>Email</label><input id="ns-email" type="email" placeholder="email@domain.com"/></div>'
    +'<div class="form-group"><label>Status</label><select id="ns-status"><option>Active</option><option>On Leave</option><option>Inactive</option></select></div>'
    +'</div></div>'
    // -- Section 2: System Role + Credentials
    +'<div style="padding:16px 24px 0;margin-top:4px">'
    +'<div style="font-size:10px;font-weight:800;color:#7c3aed;text-transform:uppercase;letter-spacing:.12em;font-family:\'JetBrains Mono\',monospace;margin-bottom:12px;padding-bottom:6px;border-bottom:2px solid #ede9fe">🔐 System Role & Login Credentials</div>'
    +'<div class="form-grid g3">'
    // System Role
    +'<div class="form-group"><label style="display:flex;align-items:center;gap:6px">System Role *'
    +'<span style="font-size:10px;font-weight:600;color:#7c3aed;background:#f5f3ff;border:1px solid #ddd6fe;padding:1px 7px;border-radius:20px">Controls page access</span></label>'
    +'<select id="ns-sysrole" onchange="gnsiNsUpdateRolePreview()" style="border-color:#c4b5fd">'
    +Object.keys(ROLE_LABELS).filter(function(r){return r!=='admin';}).map(function(r){
        return'<option value="'+r+'"'+(r==='teacher'?' selected':'')+'>'+ROLE_LABELS[r]+'</option>';
      }).join('')
    +'</select></div>'
    // Username
    +'<div class="form-group"><label style="display:flex;align-items:center;gap:6px">Login Username *'
    +'<span style="font-size:10px;font-weight:600;color:#0891b2;background:#ecfeff;border:1px solid #a5f3fc;padding:1px 7px;border-radius:20px">Auto-generated</span></label>'
    +'<input id="ns-uname" placeholder="auto.filled" style="border-color:#a5f3fc;font-family:\'JetBrains Mono\',monospace" oninput="gnsiNsUpdateRolePreview()"/></div>'
    // Password
    +'<div class="form-group"><label style="display:flex;align-items:center;gap:6px">Default Password'
    +'<span style="font-size:10px;font-weight:600;color:#d4a853;background:#fffbeb;border:1px solid #fde68a;padding:1px 7px;border-radius:20px">Staff must change</span></label>'
    +'<input id="ns-pwd" type="password" placeholder="Min 8 chars, upper, lower, number" style="border-color:#fde68a;font-family:\'JetBrains Mono\',monospace"/></div>'
    +'</div>'
    // -- Role Preview Badge strip
    +'<div id="ns-role-preview" style="margin-top:10px;margin-bottom:4px;padding:12px 14px;background:#f8faff;border:1.5px solid #e0e8f9;border-radius:10px;min-height:44px">'
    +'<div style="font-size:10px;font-weight:700;color:var(--muted);margin-bottom:7px;text-transform:uppercase;letter-spacing:.08em">Pages this role can access:</div>'
    +'<div id="ns-role-pages" style="display:flex;flex-wrap:wrap;gap:5px"></div>'
    +'</div>'
    +'</div>'
    // -- Credential Preview Card
    +'<div style="padding:12px 24px;margin:8px 0">'
    +'<div id="ns-cred-preview" style="background:linear-gradient(135deg,#f0fdf4,#ecfeff);border:1.5px solid #86efac;border-radius:10px;padding:12px 16px;display:none">'
    +'<div style="font-size:11px;font-weight:800;color:#16a34a;margin-bottom:8px;display:flex;align-items:center;gap:6px">✅ Credential Preview -- will be created on Save</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">'
    +'<div><div style="font-size:10px;color:#6b7280;font-weight:700;text-transform:uppercase">Username</div><div id="ns-prev-uname" style="font-family:\'JetBrains Mono\',monospace;font-size:13px;font-weight:700;color:#0a1229;margin-top:3px">--</div></div>'
    +'<div><div style="font-size:10px;color:#6b7280;font-weight:700;text-transform:uppercase">System Role</div><div id="ns-prev-role" style="font-size:13px;font-weight:700;color:#7c3aed;margin-top:3px">--</div></div>'
    +'<div><div style="font-size:10px;color:#6b7280;font-weight:700;text-transform:uppercase">Password</div><div style="font-size:13px;font-weight:700;color:#d4a853;margin-top:3px;font-family:\'JetBrains Mono\',monospace">••••••••</div></div>'
    +'</div>'
    +'<div style="font-size:10.5px;color:#6b7280;margin-top:8px;font-style:italic">⚠ Staff will be prompted to change their password on first login</div>'
    +'</div></div>'
    // -- Actions
    +'<div class="form-actions" style="background:#f8faff;border-top:1.5px solid #e0e8f9;padding:16px 24px;margin:0;border-radius:0 0 14px 14px">'
    +'<button class="btn btn-primary" onclick="addStaff()" style="background:linear-gradient(135deg,#1433a8,#1b44cc);padding:10px 24px">💾 Save Staff & Create Login</button>'
    +'<button class="btn btn-outline" onclick="toggleAddStaff()">Cancel</button>'
    +'<span style="font-size:11px;color:var(--muted);margin-left:auto">Credentials sync automatically after save</span>'
    +'</div></div>';
  // Trigger preview update after render
  if(showAddStaff) setTimeout(function(){gnsiNsAutoFill();gnsiNsUpdateRolePreview();},60);
  return '<div class="toolbar"><div class="search-wrap"><span class="search-icon">&#128269;</span><input id="staff-search" placeholder="Search staff..." value="'+esc(staffSearch)+'" oninput="staffSearch=this.value;_debouncedRenderStaffTable()"/></div>'
    +'<select class="filter-sel" onchange="staffDept=this.value;renderStaffTable()">'+depts.map(function(d){return '<option'+(d===staffDept?' selected':'')+'>'+d+'</option>'}).join('')+'</select>'
    +'<button class="btn btn-primary" onclick="toggleAddStaff()">+ Add Staff</button></div>'
    +formHTML
    +'<div class="card"><div class="card-head"><span class="card-title">Staff Directory</span><span id="staff-count" style="font-family:\'JetBrains Mono\',monospace;font-size:11px;color:var(--muted)">'+filtered.length+' of '+staff.length+'</span></div><div style="overflow-x:auto"><table><thead><tr><th>Name</th><th>Role</th><th>Department</th><th>Phone</th><th>Status</th><th>Action</th></tr></thead><tbody id="staff-tbody">'+renderStaffRows(filtered)+'</tbody></table></div></div>';
}
function getFilteredStaff(){
  return staff.filter(function(s){return(staffDept==='All'||s.dept===staffDept)&&s.name.toLowerCase().includes(staffSearch.toLowerCase())});
}
function renderStaffRows(list){
  if(!list.length)return'<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--muted)">No staff found.</td></tr>';
  return list.map(function(s){
    return '<tr><td><div style="display:flex;align-items:center;gap:10px">'+avatarHTML(s.name,30)+'<div><div style="font-weight:700">'+esc(s.name)+'</div><div style="font-size:11px;color:var(--muted);font-family:\'JetBrains Mono\',monospace">ID #'+parseInt(s.id,10)+'</div></div></div></td>'
    +'<td style="color:var(--muted)">'+esc(s.role)+'</td>'
    +'<td>'+badge(s.dept,dc(s.dept))+'</td>'
    +'<td style="font-family:\'JetBrains Mono\',monospace;font-size:12px;color:var(--muted)">'+(maskPhone(s.phone)||'&mdash;')+'</td>'
    +'<td>'+badge(s.status,s.status==='Active'?'#16a34a':s.status==='On Leave'?'#d4a853':'#dc2626')+'</td>'
    +'<td style="display:flex;gap:6px;align-items:center">'
      +'<button class="btn-sm" style="background:var(--accent-light);color:var(--accent);border:none;padding:5px 12px;border-radius:7px;font-size:12px;font-weight:600;cursor:pointer" onclick="openEditStaff('+parseInt(s.id,10)+')">✏️ Edit</button>'
      +(canDo('del','staff')?'<button class="btn-danger-sm" onclick="removeStaff('+parseInt(s.id,10)+')">🗑 Remove</button>':'')
    +'</td></tr>';
  }).join('');
}
var _staffEditId = null;
function openEditStaff(id){
  var s = staff.find(function(x){return x.id===id;});
  if(!s) return;
  _staffEditId = id;
  // Remove any old modal
  var old = document.getElementById('staff-edit-modal');
  if(old) old.remove();
  var deptOpts = Object.keys(DEPT_COLORS).map(function(d){
    return '<option'+(d===s.dept?' selected':'')+'>'+d+'</option>';
  }).join('');
  var statusOpts = ['Active','Inactive','On Leave'].map(function(st){
    return '<option'+(st===s.status?' selected':'')+'>'+st+'</option>';
  }).join('');
  var modal = document.createElement('div');
  modal.id = 'staff-edit-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(10,18,41,0.55);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px)';
  modal.innerHTML =
    '<div style="background:var(--surface);border-radius:16px;box-shadow:var(--shadow-lg);width:100%;max-width:520px;padding:28px 28px 22px;position:relative">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">'
      +'<div style="font-family:\'Playfair Display\',serif;font-size:18px;font-weight:700;color:var(--accent)">✏️ Edit Staff Member</div>'
      +'<button onclick="closeEditStaff()" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--muted)">✕</button>'
    +'</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">'
      +'<div class="form-group" style="grid-column:1/-1"><label>Full Name *</label><input id="es-name" value="'+esc(s.name||'')+'" placeholder="Full name" style="width:100%;padding:10px 13px;border:1.5px solid var(--border);border-radius:9px;font-size:14px;font-family:\'DM Sans\',sans-serif;background:var(--surface2)"/></div>'
      +'<div class="form-group"><label>Role / Designation *</label><input id="es-role" value="'+esc(s.role||'')+'" placeholder="e.g. Concern Teacher" style="width:100%;padding:10px 13px;border:1.5px solid var(--border);border-radius:9px;font-size:14px;font-family:\'DM Sans\',sans-serif;background:var(--surface2)"/></div>'
      +'<div class="form-group"><label>Department</label><select id="es-dept" style="width:100%;padding:10px 13px;border:1.5px solid var(--border);border-radius:9px;font-size:14px;font-family:\'DM Sans\',sans-serif;background:var(--surface2)">'+deptOpts+'</select></div>'
      +'<div class="form-group"><label>Phone</label><input id="es-phone" value="'+esc(s.phone||'')+'" placeholder="Phone number" style="width:100%;padding:10px 13px;border:1.5px solid var(--border);border-radius:9px;font-size:14px;font-family:\'DM Sans\',sans-serif;background:var(--surface2)"/></div>'
      +'<div class="form-group"><label>Email</label><input id="es-email" value="'+esc(s.email||'')+'" placeholder="Email address" style="width:100%;padding:10px 13px;border:1.5px solid var(--border);border-radius:9px;font-size:14px;font-family:\'DM Sans\',sans-serif;background:var(--surface2)"/></div>'
      +'<div class="form-group"><label>Status</label><select id="es-status" style="width:100%;padding:10px 13px;border:1.5px solid var(--border);border-radius:9px;font-size:14px;font-family:\'DM Sans\',sans-serif;background:var(--surface2)">'+statusOpts+'</select></div>'
    +'</div>'
    +'<div id="es-error" style="display:none;margin-top:10px;background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:9px 13px;font-size:13px;color:#dc2626;font-weight:600"></div>'
    +'<div style="display:flex;gap:10px;margin-top:20px;justify-content:flex-end">'
      +'<button onclick="closeEditStaff()" style="padding:10px 22px;border-radius:9px;border:1.5px solid var(--border);background:transparent;font-size:14px;font-weight:600;cursor:pointer;color:var(--muted)">Cancel</button>'
      +'<button onclick="saveEditStaff()" style="padding:10px 28px;border-radius:9px;border:none;background:linear-gradient(135deg,#1433a8,#1b44cc);color:#fff;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 4px 14px rgba(20,51,168,0.35)">💾 Save Changes</button>'
    +'</div>'
  +'</div>';
  document.body.appendChild(modal);
  // Close on backdrop click
  modal.addEventListener('click', function(e){ if(e.target===modal) closeEditStaff(); });
  setTimeout(function(){ var el=document.getElementById('es-name'); if(el) el.focus(); }, 80);
}
function closeEditStaff(){
  var modal = document.getElementById('staff-edit-modal');
  if(modal) modal.remove();
  _staffEditId = null;
}
function saveEditStaff(){
  var errEl = document.getElementById('es-error');
  var name  = (document.getElementById('es-name')||{}).value||'';
  var role  = (document.getElementById('es-role')||{}).value||'';
  name=name.trim();role=role.trim();
  if(!name||!role){if(errEl){errEl.textContent='Name and Role are required.';errEl.style.display='block';}return;}
  /* PRIV-ESC FIX D: non-admins cannot use job titles that trigger detectRole() elevation */
  var _ESC_KW=['administrator','manager','superintendent','principal','administration'];
  if(currentUser&&currentUser.role!=='admin'){
    var _rl=role.toLowerCase();
    for(var _ei=0;_ei<_ESC_KW.length;_ei++){
      if(_rl.indexOf(_ESC_KW[_ei])!==-1){
        if(errEl){errEl.textContent='?? Title "'+role+'" is restricted — only admin can assign elevated role titles.';errEl.style.display='block';}
        return;
      }
    }
  }
  // Warn if another staff member already has this exact name (prevents silent duplicate confusion)
  var _sameNameEdit=staff.find(function(s){return s.id!==_staffEditId&&s.name.trim().toLowerCase()===name.toLowerCase();});
  if(_sameNameEdit){
    var _ok=confirm('⚠️ Another staff member named "'+_sameNameEdit.name+'" (ID '+_sameNameEdit.id+') already exists.\n\nIf these are different people, add a suffix (e.g. "II") to distinguish them.\n\nProceed anyway?');
    if(!_ok)return;
  }
  staff = staff.map(function(s){
    if(s.id !== _staffEditId) return s;
    return Object.assign({}, s, {
      name:   name,
      role:   role,
      dept:   document.getElementById('es-dept').value,
      phone:  document.getElementById('es-phone').value.trim(),
      email:  document.getElementById('es-email').value.trim(),
      status: document.getElementById('es-status').value
    });
  });
  /* [SUPABASE-ONLY] localStorage write removed: ims_staff */
  var _editedRow = staff.find(function(s){ return s.id===_staffEditId; });
  if (_editedRow) {
    _gnsiInstantPush('staff', {
      id: _editedRow.id, name: _editedRow.name, role: _editedRow.role,
      dept: _editedRow.dept||null, status: _editedRow.status||'Active',
      phone: _editedRow.phone||null, email: _editedRow.email||null
    }, {
      onSuccess: function(){
        if (typeof sbPushCredential === 'function') sbPushCredential(_editedRow.id);
      }
    });
  }
  // If editing self, update active session name immediately
  if (typeof currentUser !== 'undefined' && currentUser && currentUser.id === _staffEditId) {
    var _editedSelf = staff.find(function(s){ return s.id === _staffEditId; });
    if (_editedSelf) {
      currentUser.name = _editedSelf.name;
      if (typeof saveSession === 'function') saveSession(currentUser);
    }
  }
  closeEditStaff();
  render();
  gnsiShowToast('✅ Staff record updated & synced to cloud ☁️', '#16a34a');
}
function renderStaffTable(){
  var filtered=getFilteredStaff();
  var tbody=document.getElementById('staff-tbody');
  var cnt=document.getElementById('staff-count');
  if(tbody)tbody.innerHTML=renderStaffRows(filtered);
  if(cnt)cnt.textContent=filtered.length+' of '+staff.length;
}
function toggleAddStaff(){showAddStaff=!showAddStaff;render()}
/* -- Auto-fill username from name -- */
function gnsiAutoUsername(name){
  var parts=(name||'').trim().toLowerCase().replace(/[^a-z\s]/g,'').split(/\s+/).filter(Boolean);
  if(!parts.length)return '';
  if(parts.length===1)return parts[0];
  // e.g. "John Singh" → "john.singh", long names truncated
  return parts[0].slice(0,10)+'.'+parts[parts.length-1].slice(0,10);
}
/* -- Live auto-fill as name is typed -- */
function gnsiNsAutoFill(){
  var nameEl=document.getElementById('ns-name');
  var unameEl=document.getElementById('ns-uname');
  if(!nameEl||!unameEl)return;
  var suggested=gnsiAutoUsername(nameEl.value);
  unameEl.value=suggested;
  gnsiNsUpdateRolePreview();
}
/* -- Update role badge strip + credential preview -- */
function gnsiNsUpdateRolePreview(){
  var roleEl=document.getElementById('ns-sysrole');
  var unameEl=document.getElementById('ns-uname');
  var pagesEl=document.getElementById('ns-role-pages');
  var prevEl=document.getElementById('ns-cred-preview');
  var prevUname=document.getElementById('ns-prev-uname');
  var prevRole=document.getElementById('ns-prev-role');
  if(!roleEl)return;
  var sysRole=roleEl.value;
  var roleColors={admin:'#1433a8',manager:'#7c3aed',accounts:'#d4a853',teacher:'#16a34a',hostel:'#3b78c9',it:'#0891b2',housemaster:'#9d174d',reception:'#0e7490',staff:'#6474a0'};
  var col=roleColors[sysRole]||'#6474a0';
  var pages=(typeof ROLE_PAGES!=='undefined'&&ROLE_PAGES[sysRole])||[];
  var PLABELS={dashboard:'Dashboard',admincentre:'Admin',staff:'Staff',students:'Students',attendance:'Attendance',notices:'Notices',fees:'Fees',timetable:'Timetable',exam:'Exam',accounts:'Accounts',reports:'Reports',hostel:'Hostel',boarder:'Boarder',dutyhours:'Duty',leave:'Leave',diary:'Diary',reception:'Reception',sync:'Sync',settings:'Settings',classes:'Classes',admissions:'Admissions'};
  if(pagesEl){
    pagesEl.innerHTML=pages.slice(0,18).map(function(p){
      return'<span style="font-size:10px;font-weight:600;padding:2px 8px;border-radius:10px;background:'+col+'18;color:'+col+';border:1px solid '+col+'33">'+(PLABELS[p]||p)+'</span>';
    }).join('')+(pages.length>18?'<span style="font-size:10px;color:var(--muted)">+'+( pages.length-18)+' more</span>':'');
  }
  var uname=(unameEl&&unameEl.value)||'';
  if(prevEl){
    if(uname){
      prevEl.style.display='block';
      if(prevUname)prevUname.textContent=uname;
      if(prevRole)prevRole.textContent=(typeof ROLE_LABELS!=='undefined'?ROLE_LABELS[sysRole]:sysRole)||sysRole;
    } else {
      prevEl.style.display='none';
    }
  }
}
/* -- Provision credentials for a newly added staff -- */
async function gnsiProvisionCredentials(staffId, username, password, sysRole){
  /* SECURITY: only admin/manager can provision credentials */
  if (typeof currentUser === 'undefined' || !currentUser || ['admin','manager'].indexOf(currentUser.role) < 0) {
    if (typeof showToast === 'function') showToast('🔒 Only admin can provision credentials','#dc2626');
    return;
  }
  // 1. Set username
  setUsername(staffId, username);
  // 2. Hash password AND push to Supabase atomically (setStoredHash handles both)
  await setStoredHash(staffId, password);
  // 3. Force-change on first login
  setMustChangeFlag(staffId);
  // 4. Store role override (signed)
  if(typeof adminSetRoleSecure==='function') adminSetRoleSecure(staffId, sysRole);
  // 5. Push username + role fields (hash already pushed inside setStoredHash above)
  if(typeof sbPushCredential==='function') sbPushCredential(staffId);
  // 6. Log the action
  if(typeof acLog==='function') acLog('Staff Provisioned','Staff #'+staffId+' username='+username+' role='+sysRole);
}
function addStaff(){
  var _gnsiAllowed=['admin','manager'];
  if(!currentUser||_gnsiAllowed.indexOf(currentUser.role)<0){
    if(typeof showToast==='function')showToast('🔒 Access denied: Add new staff','#dc2626');
    return;
  }

  var name=(document.getElementById('ns-name')||{}).value||'';
  var role=(document.getElementById('ns-role')||{}).value||'';
  var sysRole=(document.getElementById('ns-sysrole')||{}).value||'staff';
  /* Extra: only admin can create another admin/manager account */
  if((sysRole==='admin'||sysRole==='manager')&&currentUser&&currentUser.role!=='admin'){
    if(typeof showToast==='function')showToast('🔒 Only admin can create admin/manager accounts','#dc2626');
    return;
  }
  var uname=((document.getElementById('ns-uname')||{}).value||'').trim().toLowerCase();
  var pwd=((document.getElementById('ns-pwd')||{}).value||'').trim();
  name=name.trim();role=role.trim();
  if(!name||!role){showToast('⚠️ Name and Role are required.','#ea580c');return;}
  if(!uname){showToast('⚠️ Please enter a login username.','#ea580c');return;}
  /* PRIV-ESC FIX D: same block for new staff */
  var _ADD_KW=['administrator','manager','superintendent','principal','administration'];
  if(currentUser&&currentUser.role!=='admin'){
    var _rl2=role.toLowerCase();
    for(var _fi=0;_fi<_ADD_KW.length;_fi++){
      if(_rl2.indexOf(_ADD_KW[_fi])!==-1){showToast('?? Title "'+role+'" is restricted — only admin can create staff with elevated role titles.','#dc2626');return;}
    }
  }
  // Check username uniqueness
  var existing=staff.find(function(s){return getUsername(s.id)===uname;});
  if(existing){showToast('⚠️ Username "'+uname+'" is already taken by '+existing.name+'. Please choose another.','#ea580c');return;}
  // Warn if a staff member with exactly the same full name already exists (prevents silent duplicate-name confusion)
  var sameName=staff.find(function(s){return s.name.trim().toLowerCase()===name.toLowerCase();});
  if(sameName){
    var ok=confirm('⚠️ A staff member named "'+sameName.name+'" (ID '+sameName.id+') already exists.\n\nIf this is a different person with the same name, consider adding a suffix (e.g. "II", initials) to distinguish them.\n\nProceed anyway?');
    if(!ok)return;
  }
  var _pwdErr=gnsiCheckPasswordStrength(pwd);if(_pwdErr){showToast('⚠️ '+_pwdErr,'#ea580c');return;}
  var newId=++nextId;
  staff.push({
    id:newId,name:name,role:role,
    dept:(document.getElementById('ns-dept')||{}).value||'',
    phone:(document.getElementById('ns-phone')||{}).value||'',
    email:(document.getElementById('ns-email')||{}).value||'',
    status:(document.getElementById('ns-status')||{}).value||'Active'
  });
  var _nr = staff[staff.length-1];
  /* ── INSTANT PUSH: single row directly to Supabase staff table ── */
  _gnsiInstantPush('staff', {
    id: _nr.id, name: _nr.name, role: _nr.role,
    dept: _nr.dept||null, status: _nr.status||'Active',
    phone: _nr.phone||null, email: _nr.email||null
  }, {
    onSuccess: function() {
      /* Push credentials after staff row confirmed */
      gnsiProvisionCredentials(newId, uname, pwd, sysRole);
    },
    onError: function() {
      /* Offline — provision credentials anyway, they'll sync via gnsiDrainQueue */
      gnsiProvisionCredentials(newId, uname, pwd, sysRole);
    }
  });
  showAddStaff=false;
  render();
  showToast('✅ '+name+' added — login: '+uname+' | role: '+(ROLE_LABELS[sysRole]||sysRole),'#16a34a');
}
function removeStaff(id){
  var _gnsiAllowed=['admin','manager'];
  if(!currentUser||_gnsiAllowed.indexOf(currentUser.role)<0){
    if(typeof showToast==='function')showToast('🔒 Access denied: Remove staff','#dc2626');
    return;
  }
  if(!confirm('Remove this staff member?'))return;
  staff=staff.filter(function(s){return s.id!==id;});
  render();
  /* Instant delete from Supabase */
  _gnsiInstantPush('staff', {id:id}, {
    isDelete: true,
    onSuccess: function(){ showToast('🗑 Staff removed — all devices updated','#64748b'); }
  });
  /* Also delete credentials */
  if(typeof sbDeleteCredential==='function') sbDeleteCredential(id);
}
// -- STAFF BIODATA ---------------------------------------------
// -- Staff Biodata -- Supabase + localStorage cache -------------
// Table: gnsi_staff_biodata  (staff_id PK, photo TEXT, ...fields)
var _sbdKey='gnsi_staff_biodata';
var _sbdCache=null; // in-memory map: { [staff_id]: {...} }
function loadStaffBiodata(){
  if(_sbdCache)return _sbdCache;
  try{_sbdCache=JSON.parse(localStorage.getItem(_sbdKey)||'{}')}catch(e){_sbdCache={};}
  return _sbdCache;
}
function saveStaffBiodata(d){
  if(!currentUser){
    if(typeof showToast==='function')showToast('🔒 Not logged in','#dc2626');
    return;
  }

  _sbdCache=d;
  localStorage.setItem(_sbdKey,JSON.stringify(d));
  localStorage.setItem('gnsi_kv_ts_'+_sbdKey, new Date().toISOString());
  if(typeof gnsiKVPush==='function') gnsiKVPush(_sbdKey, d);
}
// Write a single staff biodata record to Supabase
function _sbdSyncOne(staffId, ex){
  var client=_getSb(); if(!client)return;
  var _sbdSid = _sbGetTenantId ? _sbGetTenantId() : null;
  var _sbdRow = {
    staff_id:       staffId,
    photo:          ex.photo||'',
    dob:            ex.dob||null,
    gender:         ex.gender||'',
    blood:          ex.blood||'',
    religion:       ex.religion||'',
    nationality:    ex.nationality||'Indian',
    aadhar:         ex.aadhar||'',
    address:        ex.address||'',
    employee_id:    ex.employeeId||'',
    qualification:  ex.qualification||'',
    specialisation: ex.specialisation||'',
    experience:     ex.experience?parseInt(ex.experience):null,
    join_date:      ex.joinDate||null,
    phone:          ex.phone||'',
    email:          ex.email||'',
    emergency_contact: ex.emergencyContact||'',
    subjects:       ex.subjects||'',
    notes:          ex.notes||'',
    updated_at:     new Date().toISOString()
  };
  if (_sbdSid) _sbdRow.school_id = _sbdSid;
  client.from('gnsi_staff_biodata').upsert(_sbdRow,{onConflict:'staff_id'}).then(function(r){
    if(r.error)(void 0);
  });
}
// Load all biodata rows from Supabase and populate cache
async function _sbdLoadFromSupabase(){
  var client=_getSb(); if(!client)return;
  try{
    var _sbdRSid = _sbGetTenantId ? _sbGetTenantId() : null;
    var _sbdQ = client.from('gnsi_staff_biodata').select('*');
    if (_sbdRSid) _sbdQ = _sbdQ.eq('school_id', _sbdRSid);
    var r=await _sbdQ;
    if(r.error){(void 0);return;}
    var map={};
    (r.data||[]).forEach(function(row){
      map[row.staff_id]={
        photo:          row.photo||'',
        dob:            row.dob||'',
        gender:         row.gender||'',
        blood:          row.blood||'',
        religion:       row.religion||'',
        nationality:    row.nationality||'Indian',
        aadhar:         row.aadhar||'',
        address:        row.address||'',
        employeeId:     row.employee_id||'',
        qualification:  row.qualification||'',
        specialisation: row.specialisation||'',
        experience:     row.experience!=null?String(row.experience):'',
        joinDate:       row.join_date||'',
        phone:          row.phone||'',
        email:          row.email||'',
        emergencyContact: row.emergency_contact||'',
        subjects:       row.subjects||'',
        notes:          row.notes||''
      };
    });
    _sbdCache=map;
    localStorage.setItem(_sbdKey,JSON.stringify(map));
    
  }catch(e){(void 0);}
}
// -- DEPT COLOR MAP (shared) ------------------------------------
var _SBD_DEPT_COLORS={Administration:'#1433a8',Teaching:'#1a6e3c',Hostel:'#0e6fa8',IT:'#5b21b6',Accounts:'#b45309',Security:'#991b1b',Maintenance:'#44403c',Examination:'#9d174d'};
function _sbdDeptColor(dept){return _SBD_DEPT_COLORS[dept]||'#1433a8';}
var _sbdView='grid'; // 'grid' | 'list' | 'view' | 'edit'
var _sbdSelected=null;
var _sbdSearch='';
var _sbdDept='All';
// -- STYLES (injected once) -------------------------------------
var _sbdStylesInjected=false;
function _sbdInjectStyles(){
  if(_sbdStylesInjected)return;
  _sbdStylesInjected=true;
  var s=document.createElement('style');
  s.textContent=`
  /* -- Directory grid -- */
  .sbd-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:22px}
  @media(max-width:640px){.sbd-grid{grid-template-columns:repeat(auto-fill,minmax(160px,1fr))}}
  .sbd-card{cursor:pointer;background:#fff;border-radius:20px;padding:0;border:1.5px solid #e2e8f4;
    box-shadow:0 2px 12px rgba(10,18,60,0.07);transition:transform .2s,box-shadow .2s;overflow:hidden;
    display:flex;flex-direction:column;position:relative}
  .sbd-card:hover{transform:translateY(-5px);box-shadow:0 12px 36px rgba(10,18,60,0.14)}
  .sbd-card-stripe{height:5px;width:100%}
  .sbd-card-body{padding:22px 18px 18px;display:flex;flex-direction:column;align-items:center;gap:11px;flex:1}
  .sbd-card-photo{width:82px;height:82px;border-radius:50%;object-fit:cover;border:3px solid #fff;
    box-shadow:0 4px 16px rgba(0,0,0,0.15);flex-shrink:0}
  .sbd-card-initials{width:82px;height:82px;border-radius:50%;display:flex;align-items:center;justify-content:center;
    font-family:'Playfair Display',serif;font-size:28px;font-weight:800;color:#fff;
    box-shadow:0 4px 16px rgba(0,0,0,0.18)}
  .sbd-card-name{font-family:'Playfair Display',serif;font-size:14.5px;font-weight:700;color:#0a1229;
    text-align:center;line-height:1.35}
  .sbd-card-role{font-size:11.5px;color:#5a6480;font-weight:500;text-align:center;margin-top:-4px}
  .sbd-card-badge{padding:3px 11px;border-radius:20px;font-size:10px;font-weight:700;
    font-family:'JetBrains Mono',monospace;letter-spacing:0.04em;margin-top:2px}
  .sbd-card-meta{font-size:11px;color:#7e8fb0;font-family:'JetBrains Mono',monospace}
  .sbd-status-pill{font-size:10px;padding:2px 10px;border-radius:20px;font-weight:700}
  /* -- Profile view -- */
  .sbd-profile-wrap{background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(10,18,60,0.1)}
  .sbd-profile-hero{padding:40px 40px 36px;display:flex;align-items:flex-end;gap:32px;flex-wrap:wrap;position:relative;overflow:hidden}
  .sbd-profile-hero::before{content:'';position:absolute;inset:0;background:inherit;opacity:.08;
    background-image:url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.07'%3E%3Cpath d='M0 0h40v40H0zm40 40h40v40H40z'/%3E%3C/g%3E%3C/svg%3E");}
  .sbd-hero-photo{width:130px;height:130px;border-radius:50%;object-fit:cover;
    border:5px solid rgba(255,255,255,0.6);box-shadow:0 8px 32px rgba(0,0,0,0.22);
    flex-shrink:0;position:relative;z-index:1}
  .sbd-hero-initials{width:130px;height:130px;border-radius:50%;display:flex;align-items:center;justify-content:center;
    font-family:'Playfair Display',serif;font-size:46px;font-weight:800;color:#fff;
    border:5px solid rgba(255,255,255,0.4);box-shadow:0 8px 32px rgba(0,0,0,0.2);
    background:rgba(255,255,255,0.18);position:relative;z-index:1}
  .sbd-hero-info{color:#fff;flex:1;min-width:220px;position:relative;z-index:1}
  .sbd-hero-name{font-family:'Playfair Display',serif;font-size:28px;font-weight:800;
    text-shadow:0 2px 10px rgba(0,0,0,0.2);line-height:1.2}
  .sbd-hero-role{font-size:15px;opacity:.9;margin-top:5px;font-weight:500}
  .sbd-hero-tags{margin-top:12px;display:flex;gap:8px;flex-wrap:wrap}
  .sbd-hero-tag{padding:4px 14px;border-radius:20px;background:rgba(255,255,255,0.22);
    font-size:11.5px;font-weight:700;color:#fff;backdrop-filter:blur(4px)}
  .sbd-profile-body{display:grid;grid-template-columns:1fr 1fr;gap:0}
  @media(max-width:720px){.sbd-profile-body{grid-template-columns:1fr}}
  .sbd-section{padding:30px 36px}
  .sbd-section-title{font-family:'Playfair Display',serif;font-size:15px;font-weight:700;
    color:#1433a8;margin-bottom:18px;padding-bottom:10px;
    border-bottom:2px solid #e8edf8;display:flex;align-items:center;gap:8px}
  .sbd-field{display:flex;gap:0;padding:9px 0;border-bottom:1px solid #f0f4fb}
  .sbd-field:last-child{border-bottom:none}
  .sbd-field-label{min-width:150px;font-size:11px;font-weight:700;color:#8896bb;
    text-transform:uppercase;letter-spacing:.06em;padding-top:3px;flex-shrink:0}
  .sbd-field-val{font-size:13.5px;color:#0a1229;font-weight:500;flex:1;line-height:1.5}
  .sbd-profile-notes{padding:20px 36px;background:#f8faff;border-top:1px solid #e8edf8}
  .sbd-profile-actions{display:flex;gap:10px;position:absolute;top:28px;right:28px;z-index:2}
  /* -- A4 Print -- */
  @media print{
    #sidebar,#topbar,#mob-nav,.sbd-print-hide{display:none!important}
    #main{overflow:visible!important}
    #content{padding:0!important;overflow:visible!important}
    body{height:auto!important;overflow:visible!important;font-size:12px}
    .sbd-a4-page{box-shadow:none!important;border-radius:0!important;page-break-after:always}
    .sbd-a4-page:last-child{page-break-after:auto}
  }
  .sbd-a4-page{
    width:210mm;min-height:297mm;background:#fff;margin:0 auto 32px;
    box-shadow:0 4px 40px rgba(10,18,60,0.14);position:relative;overflow:hidden;
    font-family:'DM Sans',sans-serif;
  }
  .sbd-a4-hero{display:flex;align-items:center;gap:28px;padding:36px 44px 30px;position:relative;overflow:hidden}
  .sbd-a4-hero-photo{width:110px;height:110px;border-radius:12px;object-fit:cover;
    border:4px solid rgba(255,255,255,0.5);box-shadow:0 4px 20px rgba(0,0,0,0.2);flex-shrink:0;position:relative;z-index:1}
  .sbd-a4-hero-initials{width:110px;height:110px;border-radius:12px;display:flex;align-items:center;justify-content:center;
    font-family:'Playfair Display',serif;font-size:40px;font-weight:800;color:#fff;
    background:rgba(255,255,255,0.18);border:4px solid rgba(255,255,255,0.35);
    box-shadow:0 4px 20px rgba(0,0,0,0.18);flex-shrink:0;position:relative;z-index:1}
  .sbd-a4-hero-text{color:#fff;flex:1;position:relative;z-index:1}
  .sbd-a4-name{font-family:'Playfair Display',serif;font-size:24px;font-weight:800;line-height:1.2}
  .sbd-a4-role{font-size:13px;margin-top:5px;opacity:.9;font-weight:500}
  .sbd-a4-inst{font-size:11px;margin-top:3px;opacity:.75;font-family:'JetBrains Mono',monospace;letter-spacing:.04em}
  .sbd-a4-tags{margin-top:10px;display:flex;gap:7px;flex-wrap:wrap}
  .sbd-a4-tag{padding:3px 12px;border-radius:20px;background:rgba(255,255,255,0.22);
    font-size:10px;font-weight:700;color:#fff}
  .sbd-a4-logo{margin-left:auto;position:relative;z-index:1;text-align:right}
  .sbd-a4-logo-circle{width:70px;height:70px;border-radius:50%;background:rgba(255,255,255,0.18);
    border:3px solid rgba(255,255,255,0.4);display:flex;align-items:center;justify-content:center;
    font-size:30px;margin-left:auto}
  .sbd-a4-logo-text{font-family:'Playfair Display',serif;font-size:11px;color:rgba(255,255,255,.85);
    font-weight:700;margin-top:5px;letter-spacing:.06em}
  .sbd-a4-body{display:grid;grid-template-columns:1fr 1fr;gap:0;margin:0 44px}
  .sbd-a4-section{padding:22px 0}
  .sbd-a4-section-title{font-family:'Playfair Display',serif;font-size:12px;font-weight:700;
    color:#1433a8;text-transform:uppercase;letter-spacing:.1em;margin-bottom:12px;
    padding-bottom:6px;border-bottom:2px solid #dde6f7;display:flex;align-items:center;gap:6px}
  .sbd-a4-field{display:flex;gap:0;padding:5px 0;border-bottom:1px solid #f2f5fb}
  .sbd-a4-field:last-child{border-bottom:none}
  .sbd-a4-label{min-width:130px;font-size:9.5px;font-weight:700;color:#8896bb;
    text-transform:uppercase;letter-spacing:.05em;padding-top:2px;flex-shrink:0}
  .sbd-a4-val{font-size:11.5px;color:#0a1229;font-weight:500;flex:1}
  .sbd-a4-divider{height:1px;background:#dde6f7;margin:0 44px}
  .sbd-a4-footer{position:absolute;bottom:0;left:0;right:0;height:36px;
    display:flex;align-items:center;justify-content:space-between;
    padding:0 44px;font-size:9px;font-family:'JetBrains Mono',monospace}
  .sbd-a4-sig-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;margin:28px 44px 60px}
  .sbd-a4-sig{text-align:center}
  .sbd-a4-sig-line{height:1px;background:#bbb;margin-bottom:6px}
  .sbd-a4-sig-label{font-size:9.5px;font-family:'JetBrains Mono',monospace;color:#888;
    text-transform:uppercase;letter-spacing:.06em}
  /* -- Edit form -- */
  .sbd-edit-wrap{background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(10,18,60,0.09)}
  .sbd-edit-header{padding:28px 36px;display:flex;align-items:center;gap:16px;border-bottom:2px solid #e8edf8}
  .sbd-edit-avatar{width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;
    font-family:'Playfair Display',serif;font-size:22px;font-weight:800;color:#fff;flex-shrink:0}
  .sbd-edit-section-head{font-weight:800;font-size:13px;color:#1433a8;padding:20px 36px 4px;
    border-top:1px solid #edf1fa;letter-spacing:.04em;text-transform:uppercase;
    display:flex;align-items:center;gap:8px}
  .sbd-edit-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:0 0;padding:0 36px 4px}
  @media(max-width:760px){.sbd-edit-grid{grid-template-columns:1fr 1fr}}
  .sbd-edit-field{padding:10px 0;border-bottom:1px solid #f0f4fc;margin:0 8px}
  .sbd-edit-label{font-size:10.5px;font-weight:700;color:#8896bb;text-transform:uppercase;
    letter-spacing:.06em;margin-bottom:5px}
  .sbd-edit-input{width:100%;padding:8px 10px;border:1.5px solid #d6deef;border-radius:9px;
    font-size:13px;font-family:'DM Sans',sans-serif;color:#0a1229;outline:none;
    transition:border-color .15s,box-shadow .15s;background:#fafbff}
  .sbd-edit-input:focus{border-color:#1433a8;box-shadow:0 0 0 3px rgba(20,51,168,.1)}
  .sbd-edit-textarea{width:100%;padding:9px 10px;border:1.5px solid #d6deef;border-radius:9px;
    font-size:13px;font-family:'DM Sans',sans-serif;color:#0a1229;outline:none;
    resize:vertical;min-height:68px;background:#fafbff;transition:border-color .15s}
  .sbd-edit-textarea:focus{border-color:#1433a8;box-shadow:0 0 0 3px rgba(20,51,168,.1)}
  .sbd-edit-select{width:100%;padding:8px 10px;border:1.5px solid #d6deef;border-radius:9px;
    font-size:13px;font-family:'DM Sans',sans-serif;color:#0a1229;outline:none;background:#fafbff;
    transition:border-color .15s}
  .sbd-edit-select:focus{border-color:#1433a8;box-shadow:0 0 0 3px rgba(20,51,168,.1)}
  .sbd-edit-actions{padding:24px 36px;display:flex;gap:12px;border-top:2px solid #edf1fa;background:#f8faff}
  .sbd-btn-primary{padding:11px 30px;border-radius:10px;border:none;
    background:linear-gradient(135deg,#0f2a8e,#1b44cc);color:#fff;
    font-size:14px;font-weight:700;cursor:pointer;
    box-shadow:0 4px 16px rgba(20,51,168,.32);transition:transform .15s,box-shadow .15s;
    font-family:'DM Sans',sans-serif}
  .sbd-btn-primary:hover{transform:translateY(-1px);box-shadow:0 6px 22px rgba(20,51,168,.4)}
  .sbd-btn-ghost{padding:11px 22px;border-radius:10px;border:1.5px solid #d0d9ef;background:transparent;
    font-size:14px;font-weight:600;cursor:pointer;color:#5a6480;
    font-family:'DM Sans',sans-serif;transition:border-color .15s}
  .sbd-btn-ghost:hover{border-color:#1433a8;color:#1433a8}
  .sbd-btn-export{padding:9px 18px;border-radius:10px;border:1.5px solid #1433a8;background:#fff;
    color:#1433a8;font-size:13px;font-weight:700;cursor:pointer;display:inline-flex;
    align-items:center;gap:7px;font-family:'DM Sans',sans-serif;transition:all .15s}
  .sbd-btn-export:hover{background:#1433a8;color:#fff}
  /* photo upload zone */
  .sbd-photo-zone{background:#f3f6ff;border-radius:14px;padding:22px 24px;border:2px dashed #c2cff0;
    margin:0 36px 4px;display:flex;align-items:center;gap:22px;flex-wrap:wrap}
  .sbd-photo-preview{width:88px;height:88px;border-radius:12px;overflow:hidden;background:#1433a8;
    display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:800;
    color:#fff;font-family:'Playfair Display',serif;flex-shrink:0;box-shadow:0 4px 12px rgba(0,0,0,0.15)}
  /* Back button */
  .sbd-back-btn{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:10px;
    border:1.5px solid #d0d9ef;background:#fff;cursor:pointer;font-size:13px;font-weight:600;
    color:#5a6480;margin-bottom:22px;transition:all .15s;font-family:'DM Sans',sans-serif}
  .sbd-back-btn:hover{border-color:#1433a8;color:#1433a8}
  `;
  document.head.appendChild(s);
}
function renderStaffBiodata(){
  _sbdInjectStyles();
  var bd=loadStaffBiodata();
  var depts=['All','Administration','Teaching','Hostel','IT','Accounts','Security','Maintenance','Examination'];
  if(_sbdView==='edit'&&_sbdSelected!==null){return _sbdEditForm(bd);}
  if(_sbdView==='view'&&_sbdSelected!==null){return _sbdProfileView(bd);}
  if(_sbdView==='print'&&_sbdSelected!==null){return _sbdPrintView(bd);}
  var filtered=staff.filter(function(s){
    var q=_sbdSearch.toLowerCase();
    var mQ=!q||(s.name||'').toLowerCase().includes(q)||(s.role||'').toLowerCase().includes(q)||(s.dept||'').toLowerCase().includes(q);
    var mD=_sbdDept==='All'||(s.dept||'')=== _sbdDept;
    return mQ&&mD;
  });
  // -- Stats bar --
  var totalActive=staff.filter(function(s){return s.status==='Active';}).length;
  var withPhoto=Object.values(loadStaffBiodata()).filter(function(e){return e&&e.photo;}).length;
  var deptCount=Object.keys(_SBD_DEPT_COLORS).filter(function(d){return staff.some(function(s){return s.dept===d;});}).length;
  var statsBar='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:26px">'
    +['<span style="font-size:26px;font-weight:800;font-family:\'JetBrains Mono\',monospace;color:#1433a8">'+staff.length+'</span><div style="font-size:11px;font-weight:700;color:#8896bb;text-transform:uppercase;letter-spacing:.06em;margin-top:2px">Total Staff</div>',
       '<span style="font-size:26px;font-weight:800;font-family:\'JetBrains Mono\',monospace;color:#1a6e3c">'+totalActive+'</span><div style="font-size:11px;font-weight:700;color:#8896bb;text-transform:uppercase;letter-spacing:.06em;margin-top:2px">Active</div>',
       '<span style="font-size:26px;font-weight:800;font-family:\'JetBrains Mono\',monospace;color:#b45309">'+withPhoto+'</span><div style="font-size:11px;font-weight:700;color:#8896bb;text-transform:uppercase;letter-spacing:.06em;margin-top:2px">With Photo</div>']
      .map(function(c){return'<div style="background:#fff;border-radius:14px;padding:18px 22px;border:1.5px solid #e2e8f4;box-shadow:0 2px 8px rgba(10,18,60,.06)">'+c+'</div>';})
      .join('')
    +'</div>';
  // -- Cards --
  var cards=filtered.map(function(s){
    var ex=bd[s.id]||{};
    var dc=_sbdDeptColor(s.dept);
    var initials=(s.name||'').split(' ').map(function(w){return w[0]||'';}).join('').slice(0,2).toUpperCase();
    var photoEl=ex.photo
      ?'<img class="sbd-card-photo" src="'+_gnsiSafePhoto(ex.photo)+'" style="border:3px solid '+dc+'">'
      :'<div class="sbd-card-initials" style="background:linear-gradient(135deg,'+dc+','+dc+'cc)">'+initials+'</div>';
    return '<div class="sbd-card" onclick="_sbdSelected='+parseInt(s.id,10)+';_sbdView=\'view\';render()">'
      +'<div class="sbd-card-stripe" style="background:'+dc+'"></div>'
      +'<div class="sbd-card-body">'
      +photoEl
      +'<div class="sbd-card-name">'+esc(s.name)+'</div>'
      +'<div class="sbd-card-role">'+esc(s.role)+'</div>'
      +'<span class="sbd-card-badge" style="background:'+dc+'1a;color:'+dc+'">'+esc(s.dept)+'</span>'
      +(ex.qualification?'<div class="sbd-card-meta">🎓 '+esc(ex.qualification)+'</div>':'')
      +(ex.phone||s.phone?'<div class="sbd-card-meta">📞 '+esc(ex.phone||s.phone)+'</div>':'')
      +'<div class="sbd-status-pill" style="background:'+(s.status==='Active'?'#dcfce7':'#fef3c7')+';color:'+(s.status==='Active'?'#15803d':'#92400e')+'">'+esc(s.status||'Active')+'</div>'
      +'</div></div>';
  }).join('');
  if(_sbdView==='list'){
    var rows=filtered.map(function(s){
      var ex=bd[s.id]||{};
      var dc=_sbdDeptColor(s.dept);
      var initials=(s.name||'').split(' ').map(function(w){return w[0]||'';}).join('').slice(0,2).toUpperCase();
      var ph=ex.photo
        ?'<img src="'+_gnsiSafePhoto(ex.photo)+'" style="width:42px;height:42px;border-radius:50%;object-fit:cover;border:2px solid '+dc+'">'
        :'<div style="width:42px;height:42px;border-radius:50%;background:'+dc+';display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;font-size:13px;flex-shrink:0">'+initials+'</div>';
      return '<tr onclick="_sbdSelected='+parseInt(s.id,10)+';_sbdView=\'view\';render()" style="cursor:pointer;transition:background .15s" onmouseover="this.style.background=\'#f0f5ff\'" onmouseout="this.style.background=\'\'">'
        +'<td style="padding:13px 18px"><div style="display:flex;align-items:center;gap:12px">'+ph+'<div><div style="font-weight:700;font-size:13.5px;color:#0a1229">'+esc(s.name)+'</div><div style="font-size:11px;color:#8896bb;font-family:\'JetBrains Mono\',monospace">'+esc(ex.employeeId||'No ID')+'</div></div></div></td>'
        +'<td style="padding:13px 18px;font-size:13px;color:#2d3748">'+esc(s.role)+'</td>'
        +'<td style="padding:13px 18px"><span style="padding:3px 11px;border-radius:20px;font-size:11px;font-weight:700;background:'+dc+'1a;color:'+dc+'">'+esc(s.dept)+'</span></td>'
        +'<td style="padding:13px 18px;font-size:12px;color:#5a6480">'+esc(ex.qualification||'--')+'</td>'
        +'<td style="padding:13px 18px;font-size:12px;font-family:\'JetBrains Mono\',monospace;color:#5a6480">'+esc(maskPhone(ex.phone||s.phone)||'--')+'</td>'
        +'<td style="padding:13px 18px;font-size:12px;font-family:\'JetBrains Mono\',monospace;color:#5a6480">'+esc(ex.joinDate||'--')+'</td>'
        +'<td style="padding:13px 18px"><span class="sbd-status-pill" style="background:'+(s.status==='Active'?'#dcfce7':'#fef3c7')+';color:'+(s.status==='Active'?'#15803d':'#92400e')+'">'+esc(s.status||'Active')+'</span></td>'
        +'<td style="padding:13px 18px;display:flex;gap:6px">'
        +'<button onclick="event.stopPropagation();_sbdSelected='+parseInt(s.id,10)+';_sbdView=\'edit\';render()" style="padding:5px 12px;border-radius:7px;border:1.5px solid #d0d9ef;background:#fff;color:#1433a8;font-size:11.5px;font-weight:700;cursor:pointer">✏️ Edit</button>'
        +'<button onclick="event.stopPropagation();_sbdSelected='+parseInt(s.id,10)+';_sbdView=\'print\';render()" style="padding:5px 12px;border-radius:7px;border:1.5px solid #1433a8;background:#fff;color:#1433a8;font-size:11.5px;font-weight:700;cursor:pointer">🖨</button>'
        +'</td>'
        +'</tr>';
    }).join('');
    cards='<div style="overflow-x:auto;border-radius:16px;border:1.5px solid #e2e8f4;box-shadow:0 2px 12px rgba(10,18,60,.06);background:#fff">'
      +'<table style="width:100%;border-collapse:collapse"><thead><tr style="background:#f8faff;border-bottom:2px solid #e2e8f4">'
      +'<th style="padding:12px 18px;text-align:left;font-size:10.5px;font-weight:700;color:#8896bb;text-transform:uppercase;letter-spacing:.08em">Staff Member</th>'
      +'<th style="padding:12px 18px;text-align:left;font-size:10.5px;font-weight:700;color:#8896bb;text-transform:uppercase;letter-spacing:.08em">Role</th>'
      +'<th style="padding:12px 18px;text-align:left;font-size:10.5px;font-weight:700;color:#8896bb;text-transform:uppercase;letter-spacing:.08em">Department</th>'
      +'<th style="padding:12px 18px;text-align:left;font-size:10.5px;font-weight:700;color:#8896bb;text-transform:uppercase;letter-spacing:.08em">Qualification</th>'
      +'<th style="padding:12px 18px;text-align:left;font-size:10.5px;font-weight:700;color:#8896bb;text-transform:uppercase;letter-spacing:.08em">Phone</th>'
      +'<th style="padding:12px 18px;text-align:left;font-size:10.5px;font-weight:700;color:#8896bb;text-transform:uppercase;letter-spacing:.08em">Join Date</th>'
      +'<th style="padding:12px 18px;text-align:left;font-size:10.5px;font-weight:700;color:#8896bb;text-transform:uppercase;letter-spacing:.08em">Status</th>'
      +'<th style="padding:12px 18px;text-align:left;font-size:10.5px;font-weight:700;color:#8896bb;text-transform:uppercase;letter-spacing:.08em">Action</th>'
      +'</tr></thead><tbody>'+rows+'</tbody></table></div>';
  }
  return statsBar
    +'<div class="sbd-print-hide" style="display:flex;align-items:center;gap:12px;margin-bottom:22px;flex-wrap:wrap">'
    +'<div class="search-wrap" style="flex:1;min-width:200px"><span class="search-icon">&#128269;</span><input placeholder="Search staff..." value="'+esc(_sbdSearch)+'" oninput="_sbdSearch=this.value;_debouncedRenderSbd()" style="width:100%"/></div>'
    +'<select class="filter-sel" onchange="_sbdDept=this.value;render()">'+depts.map(function(d){return'<option'+(d===_sbdDept?' selected':'')+'>'+d+'</option>';}).join('')+'</select>'
    +'<div style="display:flex;gap:7px">'
    +'<button onclick="_sbdView=\'grid\';render()" style="padding:8px 15px;border-radius:9px;border:1.5px solid '+(_sbdView==='grid'?'#1433a8':'#d0d9ef')+';background:'+(_sbdView==='grid'?'#1433a8':'#fff')+';color:'+(_sbdView==='grid'?'#fff':'#5a6480')+';cursor:pointer;font-size:13px;font-weight:600">⊞ Grid</button>'
    +'<button onclick="_sbdView=\'list\';render()" style="padding:8px 15px;border-radius:9px;border:1.5px solid '+(_sbdView==='list'?'#1433a8':'#d0d9ef')+';background:'+(_sbdView==='list'?'#1433a8':'#fff')+';color:'+(_sbdView==='list'?'#fff':'#5a6480')+';cursor:pointer;font-size:13px;font-weight:600">☰ List</button>'
    +'</div>'
    +'</div>'
    +(_sbdView==='list'?cards:'<div class="sbd-grid">'+cards+'</div>')
    +'<div style="margin-top:18px;font-size:11.5px;color:#8896bb;font-family:\'JetBrains Mono\',monospace;text-align:center">'+filtered.length+' of '+staff.length+' staff members · Click any card to view full biodata</div>';
}
// -- PROFILE VIEW ----------------------------------------------
function _sbdProfileView(bd){
  var s=staff.find(function(x){return x.id===_sbdSelected;});
  if(!s)return'<div>Not found</div>';
  var ex=bd[s.id]||{};
  var dc=_sbdDeptColor(s.dept);
  var initials=(s.name||'').split(' ').map(function(w){return w[0]||'';}).join('').slice(0,2).toUpperCase();
  function field(label,val){
    if(!val)return'';
    return '<div class="sbd-field"><div class="sbd-field-label">'+label+'</div><div class="sbd-field-val">'+esc(val)+'</div></div>';
  }
  return '<button class="sbd-back-btn sbd-print-hide" onclick="_sbdView=\'grid\';_sbdSelected=null;render()">← Back to Directory</button>'
    +'<div class="sbd-profile-wrap">'
    +'<div class="sbd-profile-hero" style="background:linear-gradient(135deg,'+dc+','+dc+'d0)">'
    +(ex.photo?'<img class="sbd-hero-photo" src="'+_gnsiSafePhoto(ex.photo)+'">'
              :'<div class="sbd-hero-initials">'+initials+'</div>')
    +'<div class="sbd-hero-info">'
    +'<div class="sbd-hero-name">'+esc(s.name)+'</div>'
    +'<div class="sbd-hero-role">'+esc(s.role)+'</div>'
    +'<div class="sbd-hero-tags">'
    +'<span class="sbd-hero-tag">'+esc(s.dept)+'</span>'
    +'<span class="sbd-hero-tag" style="background:'+(s.status==='Active'?'rgba(52,211,153,.35)':'rgba(251,191,36,.35)')+'">'+esc(s.status||'Active')+'</span>'
    +(ex.employeeId?'<span class="sbd-hero-tag">ID: '+esc(ex.employeeId)+'</span>':'')
    +(ex.experience?'<span class="sbd-hero-tag">'+esc(ex.experience)+' yrs exp</span>':'')
    +'</div></div>'
    +'<div class="sbd-profile-actions sbd-print-hide">'
    +'<button class="sbd-btn-export" onclick="_sbdSelected='+parseInt(s.id,10)+';_sbdView=\'print\';render()">🖨 Export A4</button>'
    +'<button class="sbd-btn-export" onclick="_sbdSelected='+parseInt(s.id,10)+';_sbdView=\'edit\';render()" style="background:rgba(255,255,255,.15);border-color:rgba(255,255,255,.5);color:#fff">✏️ Edit</button>'
    +'</div>'
    +'</div>'
    +'<div class="sbd-profile-body">'
    +'<div class="sbd-section" style="border-right:1px solid #e8edf8">'
    +'<div class="sbd-section-title">👤 Personal Information</div>'
    +field('Date of Birth',ex.dob)
    +field('Gender',ex.gender)
    +field('Blood Group',ex.blood)
    +field('Nationality',ex.nationality||'Indian')
    +(_canSeeReligion()?field('Religion',ex.religion):'')
    +(_canSeeAadhar()?field('Aadhar No.',ex.aadhar):field('Aadhar No.',maskAadhar(ex.aadhar)))
    +(_canSeeAddress()?field('Address',ex.address):field('Address','🔒 Hidden'))
    +'</div>'
    +'<div class="sbd-section">'
    +'<div class="sbd-section-title">💼 Professional Details</div>'
    +field('Employee ID',ex.employeeId)
    +field('Qualification',ex.qualification)
    +field('Specialisation',ex.specialisation)
    +field('Experience',ex.experience?ex.experience+' years':'')
    +field('Join Date',ex.joinDate)
    +field('Subjects / Duties',ex.subjects)
    +field('Phone',maskPhone(ex.phone||s.phone))
    +field('Email',ex.email||s.email)
    +field('Emergency Contact',ex.emergencyContact)
    +'</div>'
    +'</div>'
    +(ex.notes?'<div class="sbd-profile-notes"><div style="font-size:11px;font-weight:700;color:#8896bb;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">📋 Remarks / Notes</div><div style="font-size:13px;color:#5a6480;line-height:1.65">'+esc(ex.notes)+'</div></div>':'')
    +'</div>';
}
// -- A4 PRINT VIEW ---------------------------------------------
function _sbdPrintView(bd){
  var s=staff.find(function(x){return x.id===_sbdSelected;});
  if(!s)return'<div>Not found</div>';
  var ex=bd[s.id]||{};
  var dc=_sbdDeptColor(s.dept);
  var initials=(s.name||'').split(' ').map(function(w){return w[0]||'';}).join('').slice(0,2).toUpperCase();
  var today=new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'});
  function a4field(label,val){
    if(!val)return'';
    return '<div class="sbd-a4-field"><div class="sbd-a4-label">'+label+'</div><div class="sbd-a4-val">'+esc(val)+'</div></div>';
  }
  return '<div class="sbd-print-hide" style="display:flex;gap:10px;margin-bottom:20px;align-items:center">'
    +'<button class="sbd-back-btn" onclick="_sbdView=\'view\';render()" style="margin-bottom:0">← Back to Profile</button>'
    +'<button class="sbd-btn-primary" onclick="window.print()" style="font-size:13px;padding:9px 22px">🖨 Print / Save PDF</button>'
    +'<span style="font-size:12px;color:#8896bb;font-family:\'JetBrains Mono\',monospace">Use browser Print → Save as PDF → A4 paper</span>'
    +'</div>'
    +'<div class="sbd-a4-page">'
    // Hero banner
    +'<div class="sbd-a4-hero" style="background:linear-gradient(135deg,'+dc+','+dc+'cc)">'
    +(ex.photo?'<img class="sbd-a4-hero-photo" src="'+_gnsiSafePhoto(ex.photo)+'">'
              :'<div class="sbd-a4-hero-initials">'+initials+'</div>')
    +'<div class="sbd-a4-hero-text">'
    +'<div style="font-size:10px;font-family:\'JetBrains Mono\',monospace;opacity:.8;letter-spacing:.1em;text-transform:uppercase;color:#fff">Staff Biodata</div>'
    +'<div class="sbd-a4-name">'+esc(s.name)+'</div>'
    +'<div class="sbd-a4-role">'+esc(s.role)+'</div>'
    +'<div class="sbd-a4-inst">'+(window.TENANT?window.TENANT.name+', '+window.TENANT.city:'Guidance Navodaya &amp; Sainik Institute, Imphal')+'</div>'
    +'<div class="sbd-a4-tags">'
    +'<span class="sbd-a4-tag">'+esc(s.dept)+'</span>'
    +'<span class="sbd-a4-tag" style="background:'+(s.status==='Active'?'rgba(52,211,153,.35)':'rgba(251,191,36,.35)')+'">'+esc(s.status||'Active')+'</span>'
    +(ex.employeeId?'<span class="sbd-a4-tag">ID: '+esc(ex.employeeId)+'</span>':'')
    +'</div></div>'
    +'<div class="sbd-a4-logo">'
    +'<div class="sbd-a4-logo-circle">🏫</div>'
    +'<div class="sbd-a4-logo-text">GNSI</div>'
    +'</div>'
    +'</div>'
    // Body
    +'<div class="sbd-a4-body">'
    +'<div class="sbd-a4-section" style="border-right:1px solid #e8edf8;padding-right:28px">'
    +'<div class="sbd-a4-section-title">👤 Personal Information</div>'
    +a4field('Date of Birth',ex.dob)
    +a4field('Gender',ex.gender)
    +a4field('Blood Group',ex.blood)
    +a4field('Nationality',ex.nationality||'Indian')
    +(_canSeeReligion()?a4field('Religion',ex.religion):'')
    +(_canSeeAadhar()?a4field('Aadhar No.',ex.aadhar):a4field('Aadhar No.',maskAadhar(ex.aadhar)))
    +(_canSeeAddress()?a4field('Address',ex.address):a4field('Address','🔒 Hidden'))
    +'</div>'
    +'<div class="sbd-a4-section" style="padding-left:28px">'
    +'<div class="sbd-a4-section-title">💼 Professional Details</div>'
    +a4field('Employee ID',ex.employeeId)
    +a4field('Qualification',ex.qualification)
    +a4field('Specialisation',ex.specialisation)
    +a4field('Experience',ex.experience?ex.experience+' years':'')
    +a4field('Join Date',ex.joinDate)
    +a4field('Subjects / Duties',ex.subjects)
    +a4field('Phone',maskPhone(ex.phone||s.phone))
    +a4field('Email',ex.email||s.email)
    +a4field('Emergency Contact',ex.emergencyContact)
    +'</div>'
    +'</div>'
    +(ex.notes?'<div class="sbd-a4-divider"></div><div style="margin:16px 44px"><div style="font-size:9.5px;font-weight:700;color:#8896bb;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Remarks / Notes</div><div style="font-size:11px;color:#5a6480;line-height:1.6">'+esc(ex.notes)+'</div></div>':'')
    // Signature row
    +'<div class="sbd-a4-divider" style="margin-top:20px"></div>'
    +'<div class="sbd-a4-sig-row">'
    +'<div class="sbd-a4-sig"><div style="height:40px"></div><div class="sbd-a4-sig-line"></div><div class="sbd-a4-sig-label">Staff Signature</div></div>'
    +'<div class="sbd-a4-sig"><div style="height:40px"></div><div class="sbd-a4-sig-line"></div><div class="sbd-a4-sig-label">Head of Department</div></div>'
    +'<div class="sbd-a4-sig"><div style="height:40px"></div><div class="sbd-a4-sig-line"></div><div class="sbd-a4-sig-label">Head of Institute</div></div>'
    +'</div>'
    // Footer
    +'<div class="sbd-a4-footer" style="background:'+dc+';color:rgba(255,255,255,.85)">'
    +'<span>'+(window.TENANT?window.TENANT.name+' · '+window.TENANT.city+', '+window.TENANT.state:'Guidance Navodaya &amp; Sainik Institute · Imphal, Manipur')+'</span>'
    +'<span>Generated: '+today+'</span>'
    +'<span>CONFIDENTIAL</span>'
    +'</div>'
    +'</div>';
}
// -- EDIT FORM -------------------------------------------------
function _sbdEditForm(bd){
  var s=staff.find(function(x){return x.id===_sbdSelected;});
  if(!s)return'<div>Not found</div>';
  var ex=bd[s.id]||{};
  var dc=_sbdDeptColor(s.dept);
  var initials=(s.name||'').split(' ').map(function(w){return w[0]||'';}).join('').slice(0,2).toUpperCase();
  function fld(label,id,type,val,placeholder,extra){
    type=type||'text';extra=extra||'';placeholder=placeholder||'';
    return '<div class="sbd-edit-field"><div class="sbd-edit-label">'+label+'</div>'
      +'<input class="sbd-edit-input" type="'+type+'" id="'+id+'" value="'+esc(val||'')+'" placeholder="'+esc(placeholder)+'" '+extra+'>'
      +'</div>';
  }
  function sel(label,id,options,cur){
    return '<div class="sbd-edit-field"><div class="sbd-edit-label">'+label+'</div>'
      +'<select class="sbd-edit-select" id="'+id+'"><option value="">Select…</option>'
      +options.map(function(o){return'<option'+(cur===o?' selected':'')+'>'+o+'</option>';}).join('')
      +'</select></div>';
  }
  return '<button class="sbd-back-btn sbd-print-hide" onclick="_sbdView=\'view\';render()">← Back to Profile</button>'
    +'<div class="sbd-edit-wrap">'
    // Header
    +'<div class="sbd-edit-header">'
    +'<div class="sbd-edit-avatar" style="background:linear-gradient(135deg,'+dc+','+dc+'cc)">'+initials+'</div>'
    +'<div><div style="font-family:\'Playfair Display\',serif;font-size:20px;font-weight:700;color:#1433a8">Edit Biodata</div>'
    +'<div style="font-size:13px;color:#8896bb;margin-top:2px">'+esc(s.name)+' · '+esc(s.role)+' · '+esc(s.dept)+'</div></div>'
    +'</div>'
    // Photo
    +'<div class="sbd-edit-section-head">📷 Profile Photo <span style="font-size:10px;font-weight:500;color:#8896bb;text-transform:none;letter-spacing:0">(Max 300 KB · JPEG/PNG · square recommended)</span></div>'
    +'<div class="sbd-photo-zone">'
    +'<div id="sbd-photo-prev" class="sbd-photo-preview">'
    +(ex.photo?'<img src="'+_gnsiSafePhoto(ex.photo)+'" style="width:100%;height:100%;object-fit:cover;border-radius:12px">':initials)
    +'</div>'
    +'<div>'
    +'<input type="file" id="sbd-photo-input" accept="image/*" onchange="sbdHandlePhoto(this)" style="display:none">'
    +'<button onclick="document.getElementById(\'sbd-photo-input\').click()" class="sbd-btn-ghost" style="font-size:13px;padding:9px 18px">📁 Choose Photo</button>'
    +(ex.photo?'<button onclick="sbdClearPhoto()" class="sbd-btn-ghost" style="margin-left:10px;color:#dc2626;border-color:#fca5a5;font-size:13px;padding:9px 14px">✕ Remove</button>':'')
    +'<div id="sbd-photo-msg" style="font-size:11px;color:#8896bb;margin-top:10px">File must be under 300KB.</div>'
    +'</div></div>'
    // Personal
    +'<div class="sbd-edit-section-head">👤 Personal Information</div>'
    +'<div class="sbd-edit-grid">'
    +fld('Date of Birth','sbd-dob','date',ex.dob)
    +sel('Gender','sbd-gender',['Male','Female','Other'],ex.gender)
    +sel('Blood Group','sbd-blood',['A+','A-','B+','B-','AB+','AB-','O+','O-'],ex.blood)
    +fld('Religion','sbd-religion','text',ex.religion)
    +fld('Nationality','sbd-nationality','text',ex.nationality||'Indian')
    +(_canSeeAadhar()?fld('Aadhar Number','sbd-aadhar','text',ex.aadhar,'XXXX XXXX XXXX','maxlength="14"'):'<div class="sbd-edit-field" style="padding:0 36px 4px"><div class="sbd-edit-label">Aadhar Number</div><input class="sbd-edit-input" disabled value="🔒 Admin/Manager only" style="background:var(--surface2);color:var(--muted);cursor:not-allowed"/></div>')
    +'</div>'
    +'<div style="padding:0 36px 4px"><div class="sbd-edit-field"><div class="sbd-edit-label">Residential Address</div><textarea class="sbd-edit-textarea" id="sbd-address" rows="2">'+esc(ex.address||'')+'</textarea></div></div>'
    // Professional
    +'<div class="sbd-edit-section-head">💼 Professional Details</div>'
    +'<div class="sbd-edit-grid">'
    +fld('Employee ID','sbd-empid','text',ex.employeeId,'GNSI-001')
    +fld('Qualification','sbd-qual','text',ex.qualification,'e.g. M.Sc Physics')
    +fld('Specialisation','sbd-spec','text',ex.specialisation,'e.g. Mathematics')
    +fld('Experience (years)','sbd-exp','number',ex.experience,'','min="0"')
    +fld('Join Date','sbd-join','date',ex.joinDate)
    +fld('Phone','sbd-phone','tel',ex.phone||s.phone)
    +fld('Email','sbd-email','email',ex.email||s.email)
    +fld('Emergency Contact','sbd-emg','text',ex.emergencyContact,'Name & Phone')
    +'</div>'
    +'<div style="padding:0 36px 4px"><div class="sbd-edit-field"><div class="sbd-edit-label">Subjects / Duties</div><input class="sbd-edit-input" id="sbd-subj" value="'+esc(ex.subjects||'')+'" placeholder="e.g. Mathematics, Physics"></div></div>'
    +'<div style="padding:0 36px 16px"><div class="sbd-edit-field"><div class="sbd-edit-label">Remarks / Notes</div><textarea class="sbd-edit-textarea" id="sbd-notes" rows="3">'+esc(ex.notes||'')+'</textarea></div></div>'
    // Actions
    +'<div class="sbd-edit-actions">'
    +'<button class="sbd-btn-primary" onclick="sbdSave()">💾 Save Biodata</button>'
    +'<button class="sbd-btn-ghost" onclick="_sbdView=\'view\';render()">Cancel</button>'
    +'</div></div>';
}
// stored photo temp during edit session
var _sbdPhotoTemp=null;
function sbdHandlePhoto(input){
  var file=input.files&&input.files[0];
  if(!file)return;
  if(file.size>300*1024){
    document.getElementById('sbd-photo-msg').textContent='❌ Too large! Max 300KB. Please compress the image.';
    document.getElementById('sbd-photo-msg').style.color='#dc2626';
    input.value='';return;
  }
  if(!file.type.startsWith('image/')){
    document.getElementById('sbd-photo-msg').textContent='❌ Images only (JPEG/PNG).';
    document.getElementById('sbd-photo-msg').style.color='#dc2626';
    input.value='';return;
  }
  var reader=new FileReader();
  reader.onload=function(e){
    _sbdPhotoTemp=e.target.result;
    var prev=document.getElementById('sbd-photo-prev');
    if(prev)prev.innerHTML='<img src="'+_sbdPhotoTemp+'" style="width:100%;height:100%;object-fit:cover;border-radius:12px">';
    document.getElementById('sbd-photo-msg').textContent='✅ Photo ready -- click Save to apply.';
    document.getElementById('sbd-photo-msg').style.color='#16a34a';
  };
  reader.readAsDataURL(file);
}
function sbdClearPhoto(){
  _sbdPhotoTemp='CLEAR';
  var s=staff.find(function(x){return x.id===_sbdSelected;});
  var initials=s?(s.name||'').split(' ').map(function(w){return w[0]||'';}).join('').slice(0,2).toUpperCase():'?';
  var prev=document.getElementById('sbd-photo-prev');
  if(prev){prev.innerHTML=initials;prev.style.fontSize='28px';}
}
function sbdSave(){
  var bd=loadStaffBiodata();
  var prev=bd[_sbdSelected]||{};
  var photo=prev.photo||'';
  if(_sbdPhotoTemp&&_sbdPhotoTemp!=='CLEAR')photo=_sbdPhotoTemp;
  else if(_sbdPhotoTemp==='CLEAR')photo='';
  _sbdPhotoTemp=null;
  bd[_sbdSelected]={
    photo:photo,
    dob:document.getElementById('sbd-dob').value,
    gender:document.getElementById('sbd-gender').value,
    blood:document.getElementById('sbd-blood').value,
    religion:document.getElementById('sbd-religion').value,
    nationality:document.getElementById('sbd-nationality').value,
    aadhar:document.getElementById('sbd-aadhar').value,
    address:document.getElementById('sbd-address').value,
    employeeId:document.getElementById('sbd-empid').value,
    qualification:document.getElementById('sbd-qual').value,
    specialisation:document.getElementById('sbd-spec').value,
    experience:document.getElementById('sbd-exp').value,
    joinDate:document.getElementById('sbd-join').value,
    phone:document.getElementById('sbd-phone').value,
    email:document.getElementById('sbd-email').value,
    emergencyContact:document.getElementById('sbd-emg').value,
    subjects:document.getElementById('sbd-subj').value,
    notes:document.getElementById('sbd-notes').value
  };
  saveStaffBiodata(bd);
  _sbdSyncOne(_sbdSelected,bd[_sbdSelected]);
  _sbdView='view';
  render();
}
// -- CLASSES ---------------------------------------------------
/* AUTO-ADD MISSING CLASSES — scans students, creates any missing class entries */
var _BATCH_COURSE_INFER={'achiever':'Combined','leader':'Sainik','champion':'Sainik','lakshya':'Navodaya','umeed':'Navodaya','elite':'Foundation','prime':'Foundation'};
var _BATCH_COLOR_INFER={'achiever':'#8b5cf6','leader':'#1a6b55','champion':'#0891b2','lakshya':'#3b78c9','umeed':'#0e7490','elite':'#d4a853','prime':'#dc2626'};
var _BATCH_CODE_INFER={'achiever':'ACH','leader':'LDR','champion':'CHP','lakshya':'LKS','umeed':'UMD','elite':'ELT','prime':'PRM'};
function autoAddMissingClasses(){
  if(!_isAdminOrArunkumar()){showToast('🔒 Only Admin can add classes.','#dc2626');return;}
  var classes=loadClasses();
  var existingNames={};
  classes.forEach(function(c){existingNames[c.name.trim().toLowerCase()]=true;});
  var seen={};var toAdd=[];
  students.forEach(function(s){
    var cls=(s.cls||'').trim();
    if(!cls)return;
    var key=cls.toLowerCase();
    if(existingNames[key]||seen[key])return;
    seen[key]=true;
    var course=_BATCH_COURSE_INFER[key]||'';
    if(!course){var m=students.find(function(x){return(x.cls||'').trim().toLowerCase()===key&&x.course;});if(m)course=m.course;}
    var color=_BATCH_COLOR_INFER[key]||'#1433a8';
    var code=_BATCH_CODE_INFER[key]||cls.replace(/[^A-Za-z0-9]/g,'').substring(0,4).toUpperCase();
    var strength=students.filter(function(x){return(x.cls||'').trim().toLowerCase()===key;}).length;
    toAdd.push({cls:cls,course:course,color:color,code:code,strength:strength});
  });
  if(!toAdd.length){showToast('✅ All student classes already exist — nothing to add.','#16a34a');return;}
  var msg=toAdd.length+' missing class'+(toAdd.length>1?'es':'')+' found:\n\n';
  toAdd.forEach(function(x){msg+='  • '+x.cls+(x.course?' — '+x.course:'')+' ('+x.strength+' students)\n';});
  msg+='\nAdd them all now?';
  if(!confirm(msg))return;
  toAdd.forEach(function(x){
    classes.push({id:'c'+Date.now()+Math.floor(Math.random()*10000),name:x.cls,code:x.code,section:'A',strength:Math.max(x.strength,30),teacher:'',active:true,course:x.course,color:x.color});
  });
  saveClasses(classes);
  showToast('✅ '+toAdd.length+' class'+(toAdd.length>1?'es':'')+' added: '+toAdd.map(function(x){return x.cls;}).join(', '),'#16a34a');
  render();
}
