/* GNSI PORTAL — modules/connect.js
   Pages: parentfeedback, ptm, calendar, library, parent
   DEPENDS ON: core/utils.js, core/state.js */

function renderParentFeedbackAdmin(){
  var recs=_pfaLoad();
  var isAdm=currentUser&&(currentUser.role==='admin'||currentUser.role==='manager');
  var CATS=['Academic','Hostel','Food','Discipline','Infrastructure','Other'];
  var filtered=recs.filter(function(r){
    var q=_pfaSearch.toLowerCase();
    var catOk=_pfaFilter==='all'||r.category===_pfaFilter;
    return catOk&&(!q||(r.studentName||'').toLowerCase().includes(q)||(r.message||'').toLowerCase().includes(q));
  }).sort(function(a,b){return(b.date||'').localeCompare(a.date||'');});
  var avg=recs.length?Math.round(recs.reduce(function(s,r){return s+(parseInt(r.rating)||0);},0)/recs.length*10)/10:0;
  var catCounts={};CATS.forEach(function(c){catCounts[c]=recs.filter(function(r){return r.category===c;}).length;});
  var rows=filtered.map(function(r){
    var stars='\u2b50'.repeat(Math.min(5,Math.max(0,parseInt(r.rating)||0)));
    return'<tr>'
      +'<td>'+esc(r.date||'\u2014')+'</td>'
      +'<td><b>'+esc(r.studentName||'Anonymous')+'</b><div style="font-size:11px;color:var(--muted)">'+esc(r.parentName||'\u2014')+'</div></td>'
      +'<td><span style="background:var(--accent-light);color:var(--accent);border-radius:5px;padding:2px 8px;font-size:11px">'+esc(r.category||'General')+'</span></td>'
      +'<td>'+stars+'</td>'
      +'<td style="max-width:220px">'+esc(r.message||'\u2014')+'</td>'
      +(isAdm?'<td><button onclick="gnsiDelPFA(\''+parseInt(r.id,10)+'\')" style="background:#fef2f2;color:#dc2626;border:none;border-radius:6px;padding:3px 9px;cursor:pointer;font-size:11px;font-weight:700">\ud83d\uddd1\ufe0f</button></td>':'')
      +'</tr>';
  }).join('');
  var catBtns='<button onclick="_pfaFilter=\'all\';render()" style="border-radius:20px;padding:4px 12px;font-size:11px;font-weight:700;cursor:pointer;border:1.5px solid var(--accent);background:'+(_pfaFilter==='all'?'var(--accent)':'transparent')+';color:'+(_pfaFilter==='all'?'#fff':'var(--accent)')+';margin:2px">All ('+recs.length+')</button>'
    +CATS.map(function(c){return'<button onclick="_pfaFilter=\''+c+'\';render()" style="border-radius:20px;padding:4px 12px;font-size:11px;font-weight:700;cursor:pointer;border:1.5px solid var(--border);background:'+(_pfaFilter===c?'var(--accent)':'transparent')+';color:'+(_pfaFilter===c?'#fff':'var(--muted)')+';margin:2px">'+c+' ('+catCounts[c]+')</button>';}).join('');
  return '<div class="card" style="margin-bottom:12px">'
    +'<div style="display:flex;gap:12px;padding:16px 20px;flex-wrap:wrap">'
    +'<div style="flex:1;background:var(--accent-light);border-radius:10px;padding:12px 16px;min-width:120px"><div style="font-size:11px;color:var(--muted)">Total Feedback</div><div style="font-size:22px;font-weight:800;color:var(--accent)">'+recs.length+'</div></div>'
    +'<div style="flex:1;background:#fefce8;border-radius:10px;padding:12px 16px;min-width:120px"><div style="font-size:11px;color:var(--muted)">Avg Rating</div><div style="font-size:22px;font-weight:800;color:#c9870a">'+(avg||'\u2014')+'\u2b50</div></div>'
    +'<div style="flex:1;background:#f0fdf4;border-radius:10px;padding:12px 16px;min-width:120px"><div style="font-size:11px;color:var(--muted)">5-Star</div><div style="font-size:22px;font-weight:800;color:#16a34a">'+recs.filter(function(r){return parseInt(r.rating)===5;}).length+'</div></div>'
    +'</div>'
    +'<div class="card-head" style="border-top:1px solid var(--border)"><span class="card-title">\ud83d\udcac Parent Feedback</span></div>'
    +'<div style="padding:10px 16px;display:flex;gap:10px;flex-wrap:wrap;align-items:center">'
    +'<div style="flex:1">'+catBtns+'</div>'
    +'<div class="search-wrap" style="min-width:200px"><span class="search-icon">\ud83d\udd0d</span><input placeholder="Search..." value="'+esc(_pfaSearch)+'" oninput="_pfaSearch=this.value;_debouncedRenderPfa()" style="width:100%"/></div>'
    +'</div>'
    +'<div style="overflow-x:auto"><table><thead><tr><th>Date</th><th>Student / Parent</th><th>Category</th><th>Rating</th><th>Message</th>'+(isAdm?'<th>Del</th>':'')+'</tr></thead>'
    +'<tbody>'+(rows||'<tr><td colspan="6" style="padding:40px;text-align:center;color:var(--muted)">No feedback submitted yet.</td></tr>')+'</tbody></table></div></div>';
}
function gnsiDelPFA(id){
  if(!confirm('Delete this feedback?'))return;
  gnsiSave('gnsi_parent_feedback',_pfaLoad().filter(function(x){return x.id!==id;}));render();showToast('Feedback deleted','#64748b');
}
/* ══════════════════════════════════════════════════════════════
   █  SMS & NOTIFICATIONS
   ══════════════════════════════════════════════════════════════ */
var _smsTab='compose';
function _smsLogLoad(){return gnsiLoad('gnsi_sms_log')||[];}
function _smsLogSave(d){gnsiSave('gnsi_sms_log',d);}
function renderPTM(){
  var isAdmin=_isAdminOrArunkumar();
  var meetings=gnsiLoad('gnsi_ptm_meetings')||[];
  var staffList=_ptmGetStaff();
  var statusColor={Scheduled:'#1433a8',Completed:'#16a34a',Cancelled:'#dc2626','No Show':'#d97706'};
  var tabs=['scheduled','completed','all'];
  var filtered=meetings.filter(function(m){
    if(_ptmTab==='scheduled') return m.status==='Scheduled';
    if(_ptmTab==='completed') return m.status==='Completed'||m.status==='No Show';
    return true;
  });
  /* -- form -- */
  var formHtml='';
  if(_ptmForm){
    var editing=_ptmEdit?meetings.find(function(m){return m.id===_ptmEdit;}):null;
    formHtml='<div style="background:var(--surface);border:1.5px solid #1433a8;border-radius:14px;padding:22px;margin-bottom:20px">'
      +'<div style="font-family:\'Playfair Display\',serif;font-size:15px;font-weight:700;color:var(--text);margin-bottom:16px">'+(editing?'✏️ Edit Meeting':'➕ Schedule PTM Meeting')+'</div>'
      +'<div class="form-grid g2" style="margin-bottom:14px">'
      +'<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Date *</label>'
      +'<input id="ptm-date" type="date" value="'+(editing?editing.date:'')+'" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif;box-sizing:border-box"></div>'
      +'<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Time</label>'
      +'<input id="ptm-time" type="time" value="'+(editing?editing.time:'09:00')+'" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif;box-sizing:border-box"></div>'
      +'<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Teacher *</label>'
      +'<select id="ptm-teacher" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif">'
      +staffList.map(function(s){return '<option'+(editing&&editing.teacher===s.name?' selected':'')+'>'+esc(s.name)+'</option>';}).join('')
      +'</select></div>'
      +'<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Student Name *</label>'
      +'<input id="ptm-student" type="text" value="'+(editing?esc(editing.student):'')+'" placeholder="Student full name" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif;box-sizing:border-box"></div>'
      +'<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Parent / Guardian</label>'
      +'<input id="ptm-parent" type="text" value="'+(editing?esc(editing.parent):'')+'" placeholder="Parent name" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif;box-sizing:border-box"></div>'
      +'<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Class</label>'
      +'<input id="ptm-class" type="text" value="'+(editing?esc(editing.cls):'')+'" placeholder="e.g. Navodaya New" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif;box-sizing:border-box"></div>'
      +'</div>'
      +'<div style="margin-bottom:16px"><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Agenda / Purpose</label>'
      +'<textarea id="ptm-agenda" rows="2" placeholder="e.g. Discuss exam performance, attendance concerns..." style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif;resize:vertical;box-sizing:border-box">'+(editing?esc(editing.agenda):'')+'</textarea></div>'
      +'<div style="display:flex;gap:10px">'
      +'<button onclick="ptmSave()" style="padding:9px 20px;border-radius:9px;background:#1433a8;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">Save Meeting</button>'
      +'<button onclick="ptmCloseForm()" style="padding:9px 16px;border-radius:9px;border:1.5px solid var(--border);background:var(--surface);color:var(--muted);font-size:13px;cursor:pointer;font-family:\'DM Sans\',sans-serif">Cancel</button>'
      +'</div></div>';
  }
  /* -- stats -- */
  var total=meetings.length, sched=meetings.filter(function(m){return m.status==='Scheduled';}).length, done=meetings.filter(function(m){return m.status==='Completed';}).length;
  /* -- meeting cards -- */
  var cards='';
  if(!filtered.length){
    cards='<div style="padding:40px;text-align:center;color:var(--muted);font-size:13px">No meetings found.</div>';
  } else {
    cards=filtered.map(function(m){
      var sc=statusColor[m.status]||'#64748b';
      return '<div style="background:var(--surface);border:1.5px solid var(--border);border-left:4px solid '+sc+';border-radius:12px;padding:16px 18px;display:flex;flex-direction:column;gap:10px">'
        +'<div style="display:flex;align-items:flex-start;gap:12px;flex-wrap:wrap">'
        +'<div style="flex:1;min-width:0">'
        +'<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">'
        +'<div style="font-size:14px;font-weight:700;color:var(--text)">👤 '+esc(m.student)+(m.cls?' · <span style="font-weight:500;color:var(--muted)">'+esc(m.cls)+'</span>':'')+'</div>'
        +'<div style="font-size:10px;font-weight:700;color:'+sc+';background:'+sc+'18;border-radius:5px;padding:2px 8px">'+esc(m.status)+'</div>'
        +'</div>'
        +'<div style="font-size:12.5px;color:var(--muted)">👩‍🏫 '+esc(m.teacher)+' &nbsp;·&nbsp; 📅 '+esc(m.date)+(m.time?' '+esc(m.time):'')+(m.parent?' &nbsp;·&nbsp; Parent: '+esc(m.parent):'')+'</div>'
        +(m.agenda?'<div style="font-size:12px;color:var(--text);margin-top:4px;background:var(--bg);border-radius:7px;padding:6px 10px">'+esc(m.agenda)+'</div>':'')
        +'</div>'
        +'<div style="display:flex;flex-direction:column;gap:5px;align-items:flex-end">'
        +(m.status==='Scheduled'?'<button onclick="ptmUpdateStatus(\''+parseInt(m.id,10)+'\',\'Completed\')" style="padding:4px 10px;border-radius:7px;background:#dcfce7;color:#16a34a;border:1px solid #86efac;font-size:11px;font-weight:700;cursor:pointer">✓ Mark Done</button>':'')
        +(m.status==='Scheduled'?'<button onclick="ptmUpdateStatus(\''+parseInt(m.id,10)+'\',\'No Show\')" style="padding:4px 10px;border-radius:7px;background:#fef3c7;color:#d97706;border:1px solid #fde68a;font-size:11px;font-weight:700;cursor:pointer">⚠ No Show</button>':'')
        +(isAdmin?'<button onclick="ptmOpenForm(\''+parseInt(m.id,10)+'\')" style="padding:4px 10px;border-radius:7px;background:var(--bg);color:var(--muted);border:1.5px solid var(--border);font-size:11px;cursor:pointer">✏️</button>':'')
        +(isAdmin?'<button onclick="ptmDelete(\''+parseInt(m.id,10)+'\')" style="padding:4px 10px;border-radius:7px;background:#fee2e2;color:#ef4444;border:1px solid #fca5a5;font-size:11px;cursor:pointer">🗑</button>':'')
        +'</div></div>'
        +'<div style="display:flex;gap:8px;align-items:center">'
        +'<input id="ptm-note-'+parseInt(m.id,10)+'" type="text" placeholder="Add meeting notes..." value="'+esc(m.notes||'')+'" style="flex:1;padding:6px 10px;border-radius:7px;border:1px solid var(--border);background:var(--bg);font-size:12px;color:var(--text);font-family:\'DM Sans\',sans-serif">'
        +'<button onclick="ptmAddNotes(\''+parseInt(m.id,10)+'\')" style="padding:6px 12px;border-radius:7px;background:#1433a8;color:#fff;border:none;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap">Save Note</button>'
        +'</div>'
        +'</div>';
    }).join('');
  }
  return '<div style="padding:8px 0 32px">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:18px">'
    +'<div><div style="font-family:\'Playfair Display\',serif;font-size:22px;font-weight:800;color:var(--text)">🤝 Parent-Teacher Meet</div>'
    +'<div style="font-size:12.5px;color:var(--muted);margin-top:3px">'+sched+' scheduled &nbsp;·&nbsp; '+done+' completed &nbsp;·&nbsp; '+total+' total</div></div>'
    +(!_ptmForm&&_isAdminOrArunkumar()?'<button onclick="ptmOpenForm()" style="padding:8px 18px;border-radius:9px;background:#1433a8;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">➕ Schedule Meeting</button>':'')
    +'</div>'
    +formHtml
    +'<div style="display:flex;gap:8px;margin-bottom:16px">'
    +tabs.map(function(t){var a=t===_ptmTab;return '<button onclick="_ptmTab=\''+t+'\';navigate(\'ptm\')" style="padding:6px 16px;border-radius:20px;border:1.5px solid '+(a?'#1433a8':'var(--border)')+';background:'+(a?'#1433a8':'var(--surface)')+';color:'+(a?'#fff':'var(--muted)')+';font-size:12px;font-weight:700;cursor:pointer;text-transform:capitalize">'+t+'</button>';}).join('')
    +'</div>'
    +'<div style="display:flex;flex-direction:column;gap:10px">'+cards+'</div>'
    +'</div>';
}
/* ══════════════════════════════════════════════════════════════════
   ASSETS & INVENTORY
   ══════════════════════════════════════════════════════════════════ */
var _assetCat='All', _assetSearch='', _assetLoc='All', _assetForm=false, _assetEdit=null;
var _ASSET_CATS=['All','Furniture','Electronics','Sports Equipment','Books & Stationery','Kitchen Equipment','Hostel Items','Vehicle','Maintenance Tools','Other'];
var _ASSET_LOCS=['All','Admin Office','Classroom','Library','Laboratory','Sports Ground','Hostel','Kitchen','Reception','Store Room'];
var _ASSET_CONDITIONS=['Good','Fair','Poor','Under Repair','Disposed'];
function gnsiPTMPrint(){
  var meetings=(gnsiLoad('gnsi_ptm_meetings')||[]).sort(function(a,b){return(b.date||'').localeCompare(a.date||'');});
  var rows=meetings.map(function(m,i){
    var c=m.status==='Completed'?'#16a34a':m.status==='Cancelled'?'#dc2626':m.status==='No Show'?'#c9870a':'#1433a8';
    return '<tr><td style="text-align:center">'+(i+1)+'</td><td>'+esc(m.date||'—')+'</td><td>'+esc(m.time||'—')+'</td>'
      +'<td><b>'+esc(m.student||'—')+'</b></td><td>'+esc(m.teacher||'—')+'</td>'
      +'<td style="color:'+c+';font-weight:700">'+esc(m.status||'—')+'</td>'
      +'<td>'+esc(m.notes||'—')+'</td></tr>';
  }).join('');
  var body='<div class="gnsi-pg-hdr"><div class="gnsi-inst">'+(window.TENANT?window.TENANT.name+' · '+window.TENANT.city:'Guidance Navodaya & Sainik Institute · Khangabok')+'</div>'
    +'<div class="gnsi-pg-title">👨‍👩‍👧 Parent-Teacher Meeting Register</div>'
    +'<div class="gnsi-pg-sub">Printed: '+new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})+' · Total: '+meetings.length+' meetings</div></div>'
    +'<table><thead><tr><th style="width:26px">#</th><th style="width:80px">Date</th><th style="width:60px">Time</th>'
    +'<th>Student</th><th>Teacher</th><th style="width:80px">Status</th><th>Notes / Outcome</th></tr></thead><tbody>'+rows+'</tbody></table>';
  gnsiPrintWindow('PTM Register — GNSI', body, false);
}
function gnsiPTMExport(){
  showToast('⏳ Preparing PTM CSV…','#2563eb');

  var meetings=(gnsiLoad('gnsi_ptm_meetings')||[]).sort(function(a,b){return(b.date||'').localeCompare(a.date||'');});
  var rows=[['GNSI — Parent-Teacher Meeting Register'],['Exported: '+new Date().toLocaleString('en-IN')],[]
    ,['#','Date','Time','Student','Teacher','Status','Notes / Outcome']];
  meetings.forEach(function(m,i){rows.push([i+1,m.date||'',m.time||'',m.student||'',m.teacher||'',m.status||'',m.notes||'']);});
    showToast('✅ PTM CSV ready — '+(meetings.length)+' rows','#16a34a');
  gnsiExportExcel('PTM_Register_'+new Date().toISOString().slice(0,10)+'.xlsx',[{name:'PTM',rows:rows,cols:[{wch:4},{wch:12},{wch:8},{wch:22},{wch:22},{wch:12},{wch:35}]}]);
}
function assetOpenForm(id){ _assetEdit=id||null; _assetForm=true; navigate('assets'); }
function assetCloseForm(){ _assetForm=false; _assetEdit=null; navigate('assets'); }
function assetSave(){
  var name=document.getElementById('ast-name').value.trim();
  var cat=document.getElementById('ast-cat').value;
  var loc=document.getElementById('ast-loc').value;
  var qty=parseInt(document.getElementById('ast-qty').value)||1;
  var cond=document.getElementById('ast-cond').value;
  var serial=document.getElementById('ast-serial').value.trim();
  var purchDate=document.getElementById('ast-pdate').value;
  var val=document.getElementById('ast-val').value.trim();
  var notes=document.getElementById('ast-notes').value.trim();
  if(!name){ alert('Asset name is required.'); return; }
  var assets=gnsiLoad('gnsi_assets')||[];
  if(_assetEdit){
    assets=assets.map(function(a){return a.id===_assetEdit?{id:a.id,name:name,cat:cat,loc:loc,qty:qty,cond:cond,serial:serial,purchDate:purchDate,val:val,notes:notes,addedOn:a.addedOn}:a;});
  } else {
    assets.unshift({id:'ast'+Date.now(),name:name,cat:cat,loc:loc,qty:qty,cond:cond,serial:serial,purchDate:purchDate,val:val,notes:notes,addedOn:new Date().toISOString().slice(0,10)});
  }
  gnsiSave('gnsi_assets', assets);
  _assetForm=false; _assetEdit=null;
  navigate('assets');
}
function assetDelete(id){
  if(!confirm('Delete this asset record?')) return;
  gnsiSave('gnsi_assets', (gnsiLoad('gnsi_assets')||[]).filter(function(a){return a.id!==id;}));
  navigate('assets');
}
function assetUpdateCond(id, cond){
  var assets=(gnsiLoad('gnsi_assets')||[]).map(function(a){return a.id===id?Object.assign({},a,{cond:cond}):a;});
  gnsiSave('gnsi_assets', assets);
  navigate('assets');
}
function renderCalendar(){
  var isAdmin=(typeof currentUser!=='undefined'&&currentUser&&(currentUser.role==='admin'||currentUser.role==='manager'));
  var events=gnsiLoad('gnsi_events')||[];
  /* seed */
  if(!events.length){
    var y=new Date().getFullYear();
    events=[
      {id:'ev1',title:'Republic Day',date:y+'-01-26',endDate:'',type:'Holiday',desc:'National Holiday'},
      {id:'ev2',title:'Annual Sports Meet',date:y+'-02-10',endDate:y+'-02-12',type:'Sports',desc:'3-day inter-house sports competition'},
      {id:'ev3',title:'1st Unit Test',date:y+'-03-05',endDate:y+'-03-08',type:'Exam',desc:'All classes'},
      {id:'ev4',title:'Annual Cultural Fest',date:y+'-04-20',endDate:y+'-04-21',type:'Cultural',desc:'Sangai cultural programme'},
      {id:'ev5',title:'Parent-Teacher Meeting',date:y+'-05-15',endDate:'',type:'Meeting',desc:'Result discussion'},
      {id:'ev6',title:'Summer Break Begins',date:y+'-05-25',endDate:y+'-06-15',type:'Holiday',desc:''},
      {id:'ev7',title:'2nd Unit Test',date:y+'-08-05',endDate:y+'-08-08',type:'Exam',desc:'All classes'},
      {id:'ev8',title:'Independence Day',date:y+'-08-15',endDate:'',type:'Holiday',desc:'National Holiday'},
      {id:'ev9',title:'Half-Yearly Exam',date:y+'-09-20',endDate:y+'-09-28',type:'Exam',desc:''},
      {id:'ev10',title:'Annual Prize Distribution',date:y+'-11-15',endDate:'',type:'Cultural',desc:''},
      {id:'ev11',title:'Final Exam',date:y+'-12-05',endDate:y+'-12-15',type:'Exam',desc:'Annual examination'},
      {id:'ev12',title:'Winter Break',date:y+'-12-25',endDate:y+'-12-31',type:'Holiday',desc:''},
    ];
    gnsiSave('gnsi_events', events);
  }
  var MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
  var DAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var firstDay=new Date(_calYear, _calMonth, 1).getDay();
  var daysInMonth=new Date(_calYear, _calMonth+1, 0).getDate();
  var today=new Date(); var todayStr=today.getFullYear()+'-'+String(today.getMonth()+1).padStart(2,'0')+'-'+String(today.getDate()).padStart(2,'0');
  /* map events to dates */
  function eventsOnDate(dateStr){
    return events.filter(function(e){
      if(e.date===dateStr) return true;
      if(e.endDate&&e.endDate>=e.date){
        return dateStr>=e.date&&dateStr<=e.endDate;
      }
      return false;
    });
  }
  /* calendar grid */
  var dayCells='';
  DAYS.forEach(function(d){
    dayCells+='<div style="text-align:center;font-size:11px;font-weight:700;color:var(--muted);padding:6px 0;text-transform:uppercase">'+d+'</div>';
  });
  for(var blank=0;blank<firstDay;blank++){
    dayCells+='<div style="min-height:70px;border-radius:8px;background:var(--bg);opacity:.3"></div>';
  }
  for(var d2=1;d2<=daysInMonth;d2++){
    var ds=_calYear+'-'+String(_calMonth+1).padStart(2,'0')+'-'+String(d2).padStart(2,'0');
    var dayEvs=eventsOnDate(ds);
    var isToday=ds===todayStr;
    var isSun=(new Date(_calYear,_calMonth,d2).getDay()===0);
    dayCells+='<div onclick="calOpenForm(\''+ds+'\')" style="min-height:70px;border-radius:8px;border:1.5px solid '+(isToday?'#1433a8':'var(--border)')+';background:'+(isToday?'#e8edff':'var(--surface)')+';padding:6px;cursor:pointer;transition:border-color .15s;overflow:hidden" onmouseenter="this.style.borderColor=\'#1433a8\'" onmouseleave="this.style.borderColor=\''+(isToday?'#1433a8':'var(--border)')+'\';">'
      +'<div style="font-size:13px;font-weight:'+(isToday?'800':'600')+';color:'+(isSun?'#dc2626':isToday?'#1433a8':'var(--text)')+';margin-bottom:3px">'+d2+'</div>'
      +dayEvs.slice(0,2).map(function(e){
        var c=_CAL_TYPE_COLORS[e.type]||'#64748b';
        return '<div style="font-size:10px;font-weight:700;color:#fff;background:'+c+';border-radius:3px;padding:1px 5px;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(e.title)+'</div>';
      }).join('')
      +(dayEvs.length>2?'<div style="font-size:10px;color:var(--muted)">+' +(dayEvs.length-2)+' more</div>':'')
      +'</div>';
  }
  /* form */
  var formHtml='';
  if(_calForm){
    var ed=_calEditId?events.find(function(e){return e.id===_calEditId;}):null;
    var prefDate=ed?ed.date:_calSelDate;
    formHtml='<div style="background:var(--surface);border:1.5px solid #1433a8;border-radius:14px;padding:22px;margin-bottom:20px">'
      +'<div style="font-family:\'Playfair Display\',serif;font-size:15px;font-weight:700;color:var(--text);margin-bottom:16px">'+(ed?'✏️ Edit Event':'➕ Add Event'+(prefDate?' for '+prefDate:''))+'</div>'
      +'<div class="form-grid g2" style="margin-bottom:14px">'
      +'<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Title *</label><input id="cal-title" type="text" value="'+(ed?esc(ed.title):'')+'" placeholder="Event title" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif;box-sizing:border-box"></div>'
      +'<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Type</label><select id="cal-type" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif">'+_CAL_TYPES.map(function(t){return '<option'+(ed&&ed.type===t?' selected':'')+'>'+t+'</option>';}).join('')+'</select></div>'
      +'<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Start Date *</label><input id="cal-date" type="date" value="'+esc(prefDate)+'" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif;box-sizing:border-box"></div>'
      +'<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">End Date (optional)</label><input id="cal-enddate" type="date" value="'+(ed?esc(ed.endDate):'')+'" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif;box-sizing:border-box"></div>'
      +'</div>'
      +'<div style="margin-bottom:16px"><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Description</label><textarea id="cal-desc" rows="2" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif;resize:vertical;box-sizing:border-box">'+(ed?esc(ed.desc):'')+'</textarea></div>'
      +'<div style="display:flex;gap:10px">'
      +'<button onclick="calSave()" style="padding:9px 20px;border-radius:9px;background:#1433a8;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">Save Event</button>'
      +'<button onclick="calCloseForm()" style="padding:9px 16px;border-radius:9px;border:1.5px solid var(--border);background:var(--surface);color:var(--muted);font-size:13px;cursor:pointer;font-family:\'DM Sans\',sans-serif">Cancel</button>'
      +(ed&&isAdmin?'<button onclick="calDelete(\''+ed.id+'\')" style="padding:9px 16px;border-radius:9px;border:1.5px solid #fee2e2;background:#fff1f2;color:#ef4444;font-size:13px;cursor:pointer;margin-left:auto;font-family:\'DM Sans\',sans-serif">🗑 Delete</button>':'')
      +'</div></div>';
  }
  /* upcoming events list */
  var upcoming=events.filter(function(e){return e.date>=todayStr;}).sort(function(a,b){return a.date>b.date?1:-1;}).slice(0,8);
  return '<div style="padding:8px 0 32px">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:18px">'
    +'<div><div style="font-family:\'Playfair Display\',serif;font-size:22px;font-weight:800;color:var(--text)">📅 Event Calendar</div>'
    +'<div style="font-size:12.5px;color:var(--muted);margin-top:3px">'+events.length+' events &nbsp;·&nbsp; '+upcoming.length+' upcoming</div></div>'
    +(isAdmin&&!_calForm?'<button onclick="calOpenForm()" style="padding:8px 18px;border-radius:9px;background:#1433a8;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">➕ Add Event</button>':'')
    +'</div>'
    +formHtml
    +'<div style="display:grid;grid-template-columns:1fr 280px;gap:20px;align-items:start">'
    /* calendar */
    +'<div><div style="background:var(--surface);border:1.5px solid var(--border);border-radius:14px;overflow:hidden">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1.5px solid var(--border)">'
    +'<button onclick="calPrev()" style="padding:6px 14px;border-radius:8px;border:1.5px solid var(--border);background:var(--surface);cursor:pointer;font-size:14px">‹</button>'
    +'<div style="font-family:\'Playfair Display\',serif;font-size:17px;font-weight:700;color:var(--text)">'+MONTHS[_calMonth]+' '+_calYear+'</div>'
    +'<button onclick="calNext()" style="padding:6px 14px;border-radius:8px;border:1.5px solid var(--border);background:var(--surface);cursor:pointer;font-size:14px">›</button>'
    +'</div>'
    +'<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;padding:12px">'+dayCells+'</div>'
    +'</div></div>'
    /* legend + upcoming */
    +'<div style="display:flex;flex-direction:column;gap:14px">'
    +'<div style="background:var(--surface);border:1.5px solid var(--border);border-radius:12px;padding:14px">'
    +'<div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:10px;text-transform:uppercase;letter-spacing:.04em">Event Types</div>'
    +_CAL_TYPES.map(function(t){var c=_CAL_TYPE_COLORS[t];return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><div style="width:10px;height:10px;border-radius:3px;background:'+c+'"></div><span style="font-size:12px;color:var(--text)">'+t+'</span></div>';}).join('')
    +'</div>'
    +'<div style="background:var(--surface);border:1.5px solid var(--border);border-radius:12px;padding:14px">'
    +'<div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:10px;text-transform:uppercase;letter-spacing:.04em">Upcoming Events</div>'
    +(upcoming.length?upcoming.map(function(e){var c=_CAL_TYPE_COLORS[e.type]||'#64748b';return '<div style="display:flex;gap:8px;align-items:flex-start;padding:7px 0;border-bottom:1px solid var(--border);cursor:pointer" onclick="calOpenForm(\''+e.date+'\',\''+e.id+'\')"><div style="width:4px;min-height:32px;background:'+c+';border-radius:2px;flex-shrink:0"></div><div><div style="font-size:12px;font-weight:700;color:var(--text)">'+esc(e.title)+'</div><div style="font-size:11px;color:var(--muted)">'+esc(e.date)+(e.endDate?' → '+esc(e.endDate):'')+'</div></div></div>';}).join('') : '<div style="font-size:12px;color:var(--muted)">No upcoming events.</div>')
    +'</div></div>'
    +'</div>'
    +'</div>';
}
/* ══════════════════════════════════════════════════════════════════
   NIGHT DUTY ROSTER
   ══════════════════════════════════════════════════════════════════ */
var _ndMonth=new Date().getMonth(), _ndYear=new Date().getFullYear(), _ndForm=false, _ndEdit=null;
function gnsiCalPrint(){
  var events=(gnsiLoad('gnsi_events')||[]).sort(function(a,b){return(a.date||'').localeCompare(b.date||'');});
  var TYPE_COLORS={Holiday:'#dc2626',Exam:'#1433a8',Sports:'#16a34a',Cultural:'#d97706',Meeting:'#6366f1',Other:'#64748b'};
  var rows=events.map(function(e,i){
    var c=TYPE_COLORS[e.type]||'#555';
    return '<tr><td style="text-align:center">'+(i+1)+'</td>'
      +'<td><b>'+esc(e.title||'—')+'</b></td>'
      +'<td>'+esc(e.date||'—')+(e.endDate&&e.endDate!==e.date?' – '+esc(e.endDate):'')+'</td>'
      +'<td style="color:'+c+';font-weight:700">'+esc(e.type||'—')+'</td>'
      +'<td>'+esc(e.desc||'—')+'</td></tr>';
  }).join('');
  var body='<div class="gnsi-pg-hdr"><div class="gnsi-inst">'+(window.TENANT?window.TENANT.name+' · '+window.TENANT.city:'Guidance Navodaya & Sainik Institute · Khangabok')+'</div>'
    +'<div class="gnsi-pg-title">📅 Academic Calendar</div>'
    +'<div class="gnsi-pg-sub">Printed: '+new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})+' · Total: '+events.length+' events</div></div>'
    +'<table><thead><tr><th style="width:26px">#</th><th>Event Title</th><th style="width:120px">Date(s)</th>'
    +'<th style="width:70px">Type</th><th>Description</th></tr></thead><tbody>'+rows+'</tbody></table>';
  gnsiPrintWindow('Academic Calendar — GNSI', body, false);
}
function gnsiCalExportIcal(){
  var events=gnsiLoad('gnsi_events')||[];
  var lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//GNSI Portal//EN','CALSCALE:GREGORIAN','X-WR-CALNAME:GNSI Academic Calendar'];
  events.forEach(function(e){
    var uid=e.id+'@gnsi.portal';
    var dtstart=( e.date||'' ).replace(/-/g,'');
    var dtend=( e.endDate&&e.endDate!==e.date?e.endDate:e.date||'' ).replace(/-/g,'');
    // Add 1 day to end for iCal DTEND exclusive
    if(dtend){
      var d=new Date(dtend.slice(0,4)+'-'+dtend.slice(4,6)+'-'+dtend.slice(6,8));
      d.setDate(d.getDate()+1);
      dtend=d.toISOString().slice(0,10).replace(/-/g,'');
    }
    lines.push('BEGIN:VEVENT','UID:'+uid,'SUMMARY:'+e.title.replace(/,/g,'\,'),'DTSTART;VALUE=DATE:'+dtstart,'DTEND;VALUE=DATE:'+(dtend||dtstart),'DESCRIPTION:'+esc(e.desc||''),'CATEGORIES:'+esc(e.type||'Other'),'END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  var blob=new Blob([lines.join('\r\n')],{type:'text/calendar;charset=utf-8'});
  var a=document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download='GNSI_Academic_Calendar.ics'; a.click();
}
function gnsiCalExport(){
  showToast('⏳ Preparing Calendar CSV…','#2563eb');

  var events=(gnsiLoad('gnsi_events')||[]).sort(function(a,b){return(a.date||'').localeCompare(b.date||'');});
  var rows=[['GNSI — Academic Calendar'],['Exported: '+new Date().toLocaleString('en-IN')],[]
    ,['#','Event Title','Start Date','End Date','Type','Description']];
  events.forEach(function(e,i){rows.push([i+1,e.title||'',e.date||'',e.endDate||e.date||'',e.type||'',e.desc||'']);});
    showToast('✅ Calendar CSV ready — '+(events.length)+' rows','#16a34a');
  gnsiExportExcel('Calendar_'+new Date().toISOString().slice(0,10)+'.xlsx',[{name:'Calendar',rows:rows,cols:[{wch:4},{wch:30},{wch:12},{wch:12},{wch:12},{wch:35}]}]);
}
function ndPrev(){ if(_ndMonth===0){_ndMonth=11;_ndYear--;}else{_ndMonth--;} navigate('nightduty'); }
function ndNext(){ if(_ndMonth===11){_ndMonth=0;_ndYear++;}else{_ndMonth++;} navigate('nightduty'); }
function ndOpenForm(id){ _ndEdit=id||null; _ndForm=true; navigate('nightduty'); }
function ndCloseForm(){ _ndForm=false; _ndEdit=null; navigate('nightduty'); }
function ndSave(){
  var date=document.getElementById('nd-date').value;
  var staff1=document.getElementById('nd-staff1').value;
  var staff2=document.getElementById('nd-staff2').value;
  var shift=document.getElementById('nd-shift').value;
  var notes=document.getElementById('nd-notes').value.trim();
  if(!date||!staff1){ alert('Date and at least one staff member required.'); return; }
  var roster=gnsiLoad('gnsi_night_duty')||[];
  var rec={id:_ndEdit||('nd'+Date.now()),date:date,staff1:staff1,staff2:staff2,shift:shift,notes:notes,status:'Scheduled'};
  if(_ndEdit){
    var ex=roster.find(function(r){return r.id===_ndEdit;})||{};
    rec.status=ex.status||'Scheduled';
    roster=roster.map(function(r){return r.id===_ndEdit?rec:r;});
  } else {
    roster.push(rec);
  }
  gnsiSave('gnsi_night_duty', roster);
  var d=new Date(date); _ndYear=d.getFullYear(); _ndMonth=d.getMonth();
  ndCloseForm();
}
function ndMarkDone(id){
  var roster=(gnsiLoad('gnsi_night_duty')||[]).map(function(r){return r.id===id?Object.assign({},r,{status:'Completed'}):r;});
  gnsiSave('gnsi_night_duty', roster);
  navigate('nightduty');
}
function ndDelete(id){
  if(!confirm('Delete this duty record?')) return;
  gnsiSave('gnsi_night_duty', (gnsiLoad('gnsi_night_duty')||[]).filter(function(r){return r.id!==id;}));
  navigate('nightduty');
}
function renderLibrary(){
  var isAdmin=(typeof currentUser!=='undefined'&&currentUser&&(currentUser.role==='admin'||currentUser.role==='manager'||currentUser.role==='teacher'));
  var books=gnsiLoad('gnsi_books')||[];
  var issues=gnsiLoad('gnsi_book_issues')||[];
  var today=new Date().toISOString().slice(0,10);
  /* seed sample books */
  if(!books.length){
    books=[
      {id:'lib1',title:'Mathematics NCERT Class 9',author:'NCERT',subject:'Mathematics',genre:'Textbook',qty:8,available:6,issued:2,accNo:'L001',publisher:'NCERT',year:'2022',location:'Shelf A1',addedOn:'2023-01-10'},
      {id:'lib2',title:'Science NCERT Class 8',author:'NCERT',subject:'Science',genre:'Textbook',qty:10,available:8,issued:2,accNo:'L002',publisher:'NCERT',year:'2022',location:'Shelf A2',addedOn:'2023-01-10'},
      {id:'lib3',title:'Wings of Fire',author:'A.P.J. Abdul Kalam',subject:'General Knowledge',genre:'Non-Fiction',qty:3,available:2,issued:1,accNo:'L003',publisher:'Universities Press',year:'1999',location:'Shelf B1',addedOn:'2023-02-15'},
      {id:'lib4',title:'English Grammar in Use',author:'Raymond Murphy',subject:'English',genre:'Reference',qty:5,available:5,issued:0,accNo:'L004',publisher:'Cambridge',year:'2019',location:'Shelf A3',addedOn:'2023-02-15'},
      {id:'lib5',title:'Navodaya Entrance Guide 2025',author:'Arihant Experts',subject:'General Knowledge',genre:'Reference',qty:6,available:4,issued:2,accNo:'L005',publisher:'Arihant',year:'2024',location:'Shelf C1',addedOn:'2024-01-05'},
      {id:'lib6',title:'Sainik School Entrance Exam',author:'Upkar Prakashan',subject:'General Knowledge',genre:'Reference',qty:6,available:3,issued:3,accNo:'L006',publisher:'Upkar',year:'2024',location:'Shelf C2',addedOn:'2024-01-05'},
      {id:'lib7',title:'Social Science NCERT Class 10',author:'NCERT',subject:'Social Studies',genre:'Textbook',qty:8,available:7,issued:1,accNo:'L007',publisher:'NCERT',year:'2023',location:'Shelf A4',addedOn:'2023-06-01'},
      {id:'lib8',title:'Computer Science Class 11',author:'NCERT',subject:'Computer Science',genre:'Textbook',qty:4,available:4,issued:0,accNo:'L008',publisher:'NCERT',year:'2023',location:'Shelf D1',addedOn:'2023-06-01'},
    ];
    gnsiSave('gnsi_books', books);
  }
  var totalBooks=books.reduce(function(s,b){return s+b.qty;},0);
  var totalAvail=books.reduce(function(s,b){return s+b.available;},0);
  var totalIssued=issues.filter(function(i){return i.status==='Issued';}).length;
  var overdueCount=issues.filter(function(i){return i.status==='Issued'&&i.dueDate<today;}).length;
  /* -- tabs -- */
  var tabs=['catalog','issued','overdue'];
  /* -- add book form -- */
  var formHtml='';
  if(_libForm){
    var ed=_libEdit?books.find(function(b){return b.id===_libEdit;}):null;
    var subOpts=_LIB_SUBJECTS.slice(1).map(function(s){return '<option'+(ed&&ed.subject===s?' selected':'')+'>'+s+'</option>';}).join('');
    var genOpts=_LIB_GENRES.map(function(g){return '<option'+(ed&&ed.genre===g?' selected':'')+'>'+g+'</option>';}).join('');
    formHtml='<div style="background:var(--surface);border:1.5px solid #1433a8;border-radius:14px;padding:22px;margin-bottom:20px">'
      +'<div style="font-family:\'Playfair Display\',serif;font-size:15px;font-weight:700;color:var(--text);margin-bottom:16px">'+(ed?'✏️ Edit Book':'📚 Add Book to Catalog')+'</div>'
      +'<div class="form-grid g2" style="margin-bottom:14px">'
      +'<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Title *</label><input id="lib-title" type="text" value="'+(ed?esc(ed.title):'')+'" placeholder="Book title" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif;box-sizing:border-box"></div>'
      +'<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Author</label><input id="lib-author" type="text" value="'+(ed?esc(ed.author):'')+'" placeholder="Author name" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif;box-sizing:border-box"></div>'
      +'<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Subject</label><select id="lib-subject" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif">'+subOpts+'</select></div>'
      +'<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Genre / Type</label><select id="lib-genre" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif">'+genOpts+'</select></div>'
      +'<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Total Copies</label><input id="lib-qty" type="number" min="1" value="'+(ed?ed.qty:1)+'" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif;box-sizing:border-box"></div>'
      +'<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Accession No.</label><input id="lib-acc" type="text" value="'+(ed?esc(ed.accNo):'')+'" placeholder="e.g. L009" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif;box-sizing:border-box"></div>'
      +'<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Publisher</label><input id="lib-publisher" type="text" value="'+(ed?esc(ed.publisher):'')+'" placeholder="Publisher name" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif;box-sizing:border-box"></div>'
      +'<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Year</label><input id="lib-year" type="text" value="'+(ed?esc(ed.year):'')+'" placeholder="e.g. 2024" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif;box-sizing:border-box"></div>'
      +'<div style="grid-column:1/-1"><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Shelf Location</label><input id="lib-location" type="text" value="'+(ed?esc(ed.location):'')+'" placeholder="e.g. Shelf A1" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif;box-sizing:border-box"></div>'
      +'</div>'
      +'<div style="display:flex;gap:10px"><button onclick="libSaveBook()" style="padding:9px 20px;border-radius:9px;background:#1433a8;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">Save Book</button>'
      +'<button onclick="libCloseForm()" style="padding:9px 16px;border-radius:9px;border:1.5px solid var(--border);background:var(--surface);color:var(--muted);font-size:13px;cursor:pointer;font-family:\'DM Sans\',sans-serif">Cancel</button></div></div>';
  }
  /* -- issue form -- */
  var issueFormHtml='';
  if(_libIssueForm){
    var iBook=books.find(function(b){return b.id===_libIssueBookId;})||{};
    var defaultDue=new Date(Date.now()+14*864e5).toISOString().slice(0,10);
    issueFormHtml='<div style="background:var(--surface);border:1.5px solid #16a34a;border-radius:14px;padding:22px;margin-bottom:20px">'
      +'<div style="font-family:\'Playfair Display\',serif;font-size:15px;font-weight:700;color:var(--text);margin-bottom:4px">📖 Issue Book</div>'
      +'<div style="font-size:13px;color:var(--muted);margin-bottom:16px">Issuing: <b style="color:var(--text)">'+esc(iBook.title||'')+'</b> &nbsp;·&nbsp; '+iBook.available+' copies available</div>'
      +'<div class="form-grid g2" style="margin-bottom:16px">'
      +'<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Borrower Name *</label><input id="lib-borrower" type="text" placeholder="Student or staff name" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif;box-sizing:border-box"></div>'
      +'<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Borrower Type</label><select id="lib-btype" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif"><option>Student</option><option>Staff</option><option>Guest</option></select></div>'
      +'<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Issue Date *</label><input id="lib-idate" type="date" value="'+today+'" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif;box-sizing:border-box"></div>'
      +'<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Due Date *</label><input id="lib-ddate" type="date" value="'+defaultDue+'" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif;box-sizing:border-box"></div>'
      +'</div>'
      +'<div style="display:flex;gap:10px"><button onclick="libIssueBook()" style="padding:9px 20px;border-radius:9px;background:#16a34a;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">Issue Book</button>'
      +'<button onclick="libCloseIssue()" style="padding:9px 16px;border-radius:9px;border:1.5px solid var(--border);background:var(--surface);color:var(--muted);font-size:13px;cursor:pointer;font-family:\'DM Sans\',sans-serif">Cancel</button></div></div>';
  }
  /* -- tab content -- */
  var tabContent='';
  if(_libTab==='catalog'){
    var filteredBooks=books.filter(function(b){
      var sMatch=_libSubjFilter==='All'||b.subject===_libSubjFilter;
      var qMatch=!_libSearch||(b.title+b.author+b.accNo).toLowerCase().indexOf(_libSearch.toLowerCase())!==-1;
      return sMatch&&qMatch;
    });
    tabContent='<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px">'
      +'<input value="'+esc(_libSearch)+'" oninput="_libSearch=this.value;navigate(\'library\')" placeholder="🔍 Search title, author..." style="flex:1;min-width:200px;padding:8px 13px;border-radius:9px;border:1.5px solid var(--border);background:var(--surface);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif">'
      +'<select onchange="_libSubjFilter=this.value;navigate(\'library\')" style="padding:8px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--surface);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif">'+_LIB_SUBJECTS.map(function(s){return '<option'+(s===_libSubjFilter?' selected':'')+'>'+s+'</option>';}).join('')+'</select>'
      +'</div>'
      +'<div style="background:var(--surface);border:1.5px solid var(--border);border-radius:12px;overflow:auto">'
      +'<table style="width:100%;border-collapse:collapse;font-size:13px">'
      +'<thead><tr style="background:var(--bg);border-bottom:2px solid var(--border)">'
      +['Title & Author','Subject','Accession','Copies','Available','Shelf','Actions'].map(function(h){return '<th style="text-align:left;padding:10px 12px;font-size:11px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap">'+h+'</th>';}).join('')
      +'</tr></thead><tbody>'
      +(filteredBooks.length?filteredBooks.map(function(b,i){
        var availColor=b.available===0?'#dc2626':b.available<=2?'#d97706':'#16a34a';
        return '<tr style="border-bottom:1px solid var(--border);background:'+(i%2===0?'var(--surface)':'var(--bg)')+'">'
          +'<td style="padding:10px 12px"><div style="font-weight:700;color:var(--text)">'+esc(b.title)+'</div><div style="font-size:11px;color:var(--muted)">'+esc(b.author||'--')+(b.year?' · '+esc(b.year):'')+'</div></td>'
          +'<td style="padding:10px 12px;color:var(--muted);white-space:nowrap">'+esc(b.subject)+'</td>'
          +'<td style="padding:10px 12px;color:var(--muted);font-family:monospace;font-size:12px">'+esc(b.accNo||'--')+'</td>'
          +'<td style="padding:10px 12px;text-align:center;font-weight:700;color:var(--text)">'+b.qty+'</td>'
          +'<td style="padding:10px 12px;text-align:center"><span style="font-weight:700;color:'+availColor+'">'+b.available+'</span></td>'
          +'<td style="padding:10px 12px;color:var(--muted);font-size:12px">'+esc(b.location||'--')+'</td>'
          +'<td style="padding:10px 12px"><div style="display:flex;gap:5px">'
          +(b.available>0?'<button onclick="libOpenIssue(\''+b.id+'\')" style="padding:4px 10px;border-radius:7px;background:#dcfce7;color:#16a34a;border:1px solid #86efac;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap">Issue</button>':'<span style="font-size:11px;color:#dc2626;font-weight:700">All Issued</span>')
          +(isAdmin?'<button onclick="libOpenForm(\''+b.id+'\')" style="padding:4px 9px;border-radius:7px;border:1.5px solid var(--border);background:var(--surface);font-size:11px;cursor:pointer">✏️</button>':'')
          +(isAdmin?'<button onclick="libDeleteBook(\''+b.id+'\')" style="padding:4px 9px;border-radius:7px;border:1.5px solid #fee2e2;background:#fff1f2;color:#ef4444;font-size:11px;cursor:pointer">🗑</button>':'')
          +'</div></td></tr>';
      }).join(''):'<tr><td colspan="7" style="padding:40px;text-align:center;color:var(--muted)">No books found.</td></tr>')
      +'</tbody></table></div>';
  }
  else if(_libTab==='issued'){
    var activeIssues=issues.filter(function(i){return i.status==='Issued';});
    tabContent='<div style="display:flex;flex-direction:column;gap:10px">'
      +(activeIssues.length?activeIssues.map(function(issue){
        var overdue=issue.dueDate<today;
        var daysLeft=Math.ceil((new Date(issue.dueDate)-new Date(today))/864e5);
        return '<div style="background:var(--surface);border:1.5px solid '+(overdue?'#fca5a5':'var(--border)')+';border-left:4px solid '+(overdue?'#dc2626':'#1433a8')+';border-radius:12px;padding:14px 16px;display:flex;align-items:center;gap:14px;flex-wrap:wrap">'
          +'<div style="flex:1;min-width:0">'
          +'<div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:3px">'+esc(issue.bookTitle)+'</div>'
          +'<div style="font-size:12px;color:var(--muted)">👤 <b>'+esc(issue.borrower)+'</b> ('+esc(issue.borrowerType)+') &nbsp;·&nbsp; Issued: '+esc(issue.issueDate)+' &nbsp;·&nbsp; Due: '+esc(issue.dueDate)+'</div>'
          +(overdue?'<div style="font-size:12px;font-weight:700;color:#dc2626;margin-top:4px">⚠️ OVERDUE by '+Math.abs(daysLeft)+' day'+(Math.abs(daysLeft)!==1?'s':'')+'</div>':'<div style="font-size:12px;color:#16a34a;margin-top:4px">'+daysLeft+' day'+(daysLeft!==1?'s':'')+' remaining</div>')
          +'</div>'
          +'<button onclick="libReturnBook(\''+issue.id+'\')" style="padding:7px 16px;border-radius:9px;background:#1433a8;color:#fff;border:none;font-size:12px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif;white-space:nowrap">↩ Return</button>'
          +'</div>';
      }).join(''):'<div style="padding:40px;text-align:center;color:var(--muted);font-size:13px">No books currently issued.</div>')
      +'</div>';
  }
  else if(_libTab==='overdue'){
    var overdueIssues=issues.filter(function(i){return i.status==='Issued'&&i.dueDate<today;});
    tabContent='<div style="display:flex;flex-direction:column;gap:10px">'
      +(overdueIssues.length?overdueIssues.map(function(issue){
        var daysLate=Math.ceil((new Date(today)-new Date(issue.dueDate))/864e5);
        return '<div style="background:#fff1f2;border:1.5px solid #fca5a5;border-left:4px solid #dc2626;border-radius:12px;padding:14px 16px;display:flex;align-items:center;gap:14px;flex-wrap:wrap">'
          +'<div style="flex:1;min-width:0">'
          +'<div style="font-size:14px;font-weight:700;color:#dc2626;margin-bottom:3px">⚠️ '+esc(issue.bookTitle)+'</div>'
          +'<div style="font-size:12px;color:#7f1d1d">👤 <b>'+esc(issue.borrower)+'</b> &nbsp;·&nbsp; Due: '+esc(issue.dueDate)+' &nbsp;·&nbsp; <b>'+daysLate+' day'+(daysLate!==1?'s':'')+' overdue</b></div>'
          +'</div>'
          +'<button onclick="libReturnBook(\''+issue.id+'\')" style="padding:7px 16px;border-radius:9px;background:#dc2626;color:#fff;border:none;font-size:12px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif;white-space:nowrap">↩ Return</button>'
          +'</div>';
      }).join(''):'<div style="padding:40px;text-align:center;color:#16a34a;font-size:13px">✅ No overdue books.</div>')
      +'</div>';
  }
  return '<div style="padding:8px 0 32px">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:18px">'
    +'<div><div style="font-family:\'Playfair Display\',serif;font-size:22px;font-weight:800;color:var(--text)">📚 Library</div>'
    +'<div style="font-size:12.5px;color:var(--muted);margin-top:3px">'+books.length+' titles &nbsp;·&nbsp; '+totalBooks+' copies &nbsp;·&nbsp; '+totalAvail+' available &nbsp;·&nbsp; '+totalIssued+' issued'+(overdueCount>0?' &nbsp;·&nbsp; <span style="color:#dc2626;font-weight:700">'+overdueCount+' overdue</span>':'')+'</div></div>'
    +(isAdmin&&!_libForm&&!_libIssueForm?'<button onclick="libOpenForm()" style="padding:8px 18px;border-radius:9px;background:#1433a8;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">➕ Add Book</button>':'')
    +'</div>'
    +formHtml
    +issueFormHtml
    +'<div style="display:flex;gap:8px;margin-bottom:16px">'
    +tabs.map(function(t){
      var a=t===_libTab;
      var label={catalog:'📚 Catalog',issued:'📖 Issued ('+totalIssued+')',overdue:'⚠️ Overdue ('+overdueCount+')'}[t]||t;
      return '<button onclick="_libTab=\''+t+'\';navigate(\'library\')" style="padding:6px 16px;border-radius:20px;border:1.5px solid '+(a?'#1433a8':'var(--border)')+';background:'+(a?'#1433a8':'var(--surface)')+';color:'+(a?'#fff':'var(--muted)')+';font-size:12px;font-weight:700;cursor:pointer">'+label+'</button>';
    }).join('')
    +'</div>'
    +tabContent
    +'</div>';
}
function gnsiLibPrint(){
  var books=gnsiLoad('gnsi_books')||[];
  var issues=gnsiLoad('gnsi_book_issues')||[];
  var today=new Date().toISOString().slice(0,10);
  var overdue=issues.filter(function(i){return i.status==='Issued'&&i.dueDate<today;});
  var rows=books.map(function(b,i){
    return '<tr><td style="text-align:center">'+(i+1)+'</td>'
      +'<td><b>'+esc(b.title||'—')+'</b></td><td>'+esc(b.author||'—')+'</td>'
      +'<td>'+esc(b.subject||'—')+'</td><td>'+esc(b.accNo||'—')+'</td>'
      +'<td style="text-align:center">'+esc(String(b.qty||0))+'</td>'
      +'<td style="text-align:center;color:#16a34a;font-weight:700">'+esc(String(b.available||0))+'</td>'
      +'<td style="text-align:center">'+esc(String((b.qty||0)-(b.available||0)))+'</td>'
      +'<td>'+esc(b.location||'—')+'</td></tr>';
  }).join('');
  var body='<div class="gnsi-pg-hdr"><div class="gnsi-inst">'+(window.TENANT?window.TENANT.name+' · '+window.TENANT.city:'Guidance Navodaya & Sainik Institute · Khangabok')+'</div>'
    +'<div class="gnsi-pg-title">📚 Library Catalogue</div>'
    +'<div class="gnsi-pg-sub">Printed: '+new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})
    +' · Books: '+books.length+' titles · Overdue: '+overdue.length+'</div></div>'
    +'<table><thead><tr><th style="width:26px">#</th><th>Title</th><th>Author</th><th style="width:80px">Subject</th>'
    +'<th style="width:55px">Acc No</th><th style="width:40px;text-align:center">Qty</th>'
    +'<th style="width:50px;text-align:center">Avail</th><th style="width:50px;text-align:center">Issued</th>'
    +'<th style="width:70px">Location</th></tr></thead><tbody>'+rows+'</tbody></table>';
  gnsiPrintWindow('Library Catalogue — GNSI', body, false);
}
function gnsiLibOverduePrint(){
  var issues=gnsiLoad('gnsi_book_issues')||[];
  var books=gnsiLoad('gnsi_books')||[];
  var today=new Date().toISOString().slice(0,10);
  var overdue=issues.filter(function(i){return i.status==='Issued'&&i.dueDate<today;}).sort(function(a,b){return(a.dueDate||'').localeCompare(b.dueDate||'');});
  if(!overdue.length){alert('No overdue books currently.');return;}
  var rows=overdue.map(function(iss,i){
    var b=books.find(function(bk){return bk.id===iss.bookId;})||{};
    var days=Math.floor((new Date(today)-new Date(iss.dueDate))/(1000*60*60*24));
    return '<tr><td style="text-align:center">'+(i+1)+'</td>'
      +'<td><b>'+esc(b.title||'—')+'</b></td><td>'+esc(iss.issuedTo||'—')+'</td>'
      +'<td>'+esc(iss.issueDate||'—')+'</td><td style="color:#dc2626;font-weight:700">'+esc(iss.dueDate||'—')+'</td>'
      +'<td style="color:#dc2626;font-weight:800">'+days+' days</td><td style="min-height:18px"></td></tr>';
  }).join('');
  var body='<div class="gnsi-pg-hdr"><div class="gnsi-inst">'+(window.TENANT?window.TENANT.name+' · '+window.TENANT.city:'Guidance Navodaya & Sainik Institute · Khangabok')+'</div>'
    +'<div class="gnsi-pg-title">⚠️ Overdue Books List</div>'
    +'<div class="gnsi-pg-sub">Printed: '+new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})+' · Overdue: '+overdue.length+' books</div></div>'
    +'<table><thead><tr><th style="width:26px">#</th><th>Book Title</th><th>Issued To</th>'
    +'<th style="width:85px">Issue Date</th><th style="width:85px">Due Date</th><th style="width:65px">Overdue By</th><th style="width:90px">Signature</th></tr></thead><tbody>'+rows+'</tbody></table>';
  gnsiPrintWindow('Overdue Books — GNSI', body, false);
}
function gnsiLibExport(){
  showToast('⏳ Preparing Library Excel…','#2563eb');

  var books=gnsiLoad('gnsi_books')||[];
  var issues=gnsiLoad('gnsi_book_issues')||[];
  var today=new Date().toISOString().slice(0,10);
  var bkRows=[['GNSI — Library Catalogue'],['Exported: '+new Date().toLocaleString('en-IN')],[]
    ,['#','Title','Author','Subject','Genre','Acc No','Publisher','Year','Qty','Available','Issued','Location']];
  books.forEach(function(b,i){bkRows.push([i+1,b.title||'',b.author||'',b.subject||'',b.genre||'',b.accNo||'',b.publisher||'',b.year||'',b.qty||0,b.available||0,(b.qty||0)-(b.available||0),b.location||'']);});
  var issRows=[['GNSI — Issued Books'],['Exported: '+new Date().toLocaleString('en-IN')],[]
    ,['#','Book Title','Issued To','Issue Date','Due Date','Status','Return Date','Overdue?']];
  issues.forEach(function(iss,i){
    var b=books.find(function(bk){return bk.id===iss.bookId;})||{title:'Unknown'};
    var overdue=(iss.status==='Issued'&&iss.dueDate<today)?'YES':'No';
    issRows.push([i+1,b.title,iss.issuedTo||'',iss.issueDate||'',iss.dueDate||'',iss.status||'',iss.returnDate||'',overdue]);
  });
    showToast('✅ Library Excel ready — '+(books.length)+' rows','#16a34a');
  gnsiExportExcel('Library_'+new Date().toISOString().slice(0,10)+'.xlsx',[
    {name:'Catalogue',rows:bkRows,cols:[{wch:4},{wch:32},{wch:22},{wch:16},{wch:12},{wch:8},{wch:18},{wch:6},{wch:6},{wch:8},{wch:8},{wch:16}]},
    {name:'Issued Books',rows:issRows,cols:[{wch:4},{wch:32},{wch:22},{wch:12},{wch:12},{wch:12},{wch:12},{wch:10}]}
  ]);
}
function renderParent() {
  var tabs = [
    { id: 'result',   icon: '📋', label: 'Check Result'  },
    { id: 'fee',      icon: '💳', label: 'Fee Status'    },
    { id: 'notices',  icon: '📢', label: 'Notices'       },
    { id: 'feedback', icon: '💬', label: 'Feedback'      }
  ];
  var tabBar = '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:18px">'
    + tabs.map(function(t) {
        var act = _ppTab === t.id;
        return '<button onclick="_ppTab=\'' + t.id + '\';render()" style="flex:1;min-width:90px;padding:9px 6px;border-radius:8px;border:none;cursor:pointer;font-size:12px;font-weight:' + (act?'700':'500') + ';font-family:DM Sans,sans-serif;background:' + (act?'var(--accent)':'var(--bg2,#f1f5f9)') + ';color:' + (act?'#fff':'var(--muted)') + ';transition:all .15s">' + t.icon + ' ' + t.label + '</button>';
      }).join('') + '</div>';
  var body = '';
  if (_ppTab === 'result') {
    if (_ppStudent) {
      var exams = [];
      try { exams = JSON.parse(localStorage.getItem('gnsi_exam_results') || '[]'); } catch(e) {}
      var stuExams = exams.filter(function(e) { return String(e.studentId) === String(_ppStudent.id); });
      var rows = stuExams.length
        ? stuExams.map(function(e) {
            return '<tr><td>' + esc(e.examName||'--') + '</td><td>' + esc(e.subject||'--') + '</td>'
              + '<td style="text-align:center;font-weight:700">' + esc(String(e.marks||'--')) + '</td>'
              + '<td style="text-align:center">' + esc(String(e.maxMarks||'--')) + '</td>'
              + '<td style="text-align:center">' + esc(e.grade||'--') + '</td></tr>';
          }).join('')
        : '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:20px">No results found.</td></tr>';
      body = '<div class="card"><div class="card-head"><span class="card-title">📋 Results -- ' + esc(_ppStudent.name) + '</span>'
        + '<button onclick="_ppStudent=null;render()" style="font-size:12px;color:var(--muted);background:none;border:none;cursor:pointer">← Logout</button>'
        + '</div><div style="overflow-x:auto"><table><thead><tr><th>Exam</th><th>Subject</th><th>Marks</th><th>Max</th><th>Grade</th></tr></thead>'
        + '<tbody>' + rows + '</tbody></table></div></div>';
    } else {
      body = '<div class="card"><div class="card-head"><span class="card-title">📋 Check Result</span></div>'
        + '<div style="padding:20px;max-width:360px">'
        + '<div class="form-group" style="margin-bottom:12px"><label>GCC / Admission No.</label>'
        + '<input id="pp-gcc" type="text" class="form-input" placeholder="e.g. GNSI-2024-001" value="' + esc(_ppGCC) + '"></div>'
        + '<div class="form-group" style="margin-bottom:16px"><label>Roll Number</label>'
        + '<input id="pp-roll" type="text" class="form-input" placeholder="Roll number" value="' + esc(_ppRoll) + '"></div>'
        + '<button class="btn btn-primary" onclick="gnsiParentLogin()">🔍 View Result</button>'
        + '</div></div>';
    }
  } else if (_ppTab === 'fee') {
    if (_ppStudent) {
      var fees = [];
      try { fees = JSON.parse(localStorage.getItem('gnsi_fees') || '[]'); } catch(e) {}
      var stuFees = fees.filter(function(f) { return String(f.studentId) === String(_ppStudent.id); });
      var paid = stuFees.filter(function(f){return f.status==='Paid';}).reduce(function(s,f){return s+(parseFloat(f.amount)||0);},0);
      var pending = stuFees.filter(function(f){return f.status!=='Paid';}).reduce(function(s,f){return s+(parseFloat(f.amount)||0);},0);
      var feeRows = stuFees.length
        ? stuFees.map(function(f){
            var col=f.status==='Paid'?'#16a34a':'#dc2626';
            return '<tr><td>'+esc(f.type||f.feeType||'--')+'</td><td style="text-align:right">₹'+esc(String(f.amount||0))+'</td>'
              +'<td><span style="color:'+col+';font-weight:700;font-size:12px">'+esc(f.status||'Pending')+'</span></td></tr>';
          }).join('')
        : '<tr><td colspan="3" style="text-align:center;color:var(--muted);padding:20px">No fee records found.</td></tr>';
      body = '<div class="card"><div class="card-head"><span class="card-title">💳 Fee Status -- '+esc(_ppStudent.name)+'</span>'
        +'<button onclick="_ppStudent=null;render()" style="font-size:12px;color:var(--muted);background:none;border:none;cursor:pointer">← Logout</button>'
        +'</div><div style="display:flex;gap:12px;padding:16px 16px 0">'
        +'<div style="flex:1;background:#f0fdf4;border-radius:10px;padding:12px;text-align:center"><div style="font-size:11px;color:#16a34a;font-weight:600">PAID</div><div style="font-size:20px;font-weight:800;color:#16a34a">₹'+paid.toLocaleString()+'</div></div>'
        +'<div style="flex:1;background:#fff5f5;border-radius:10px;padding:12px;text-align:center"><div style="font-size:11px;color:#dc2626;font-weight:600">PENDING</div><div style="font-size:20px;font-weight:800;color:#dc2626">₹'+pending.toLocaleString()+'</div></div>'
        +'</div><div style="overflow-x:auto;padding-top:8px"><table><thead><tr><th>Fee Type</th><th style="text-align:right">Amount</th><th>Status</th></tr></thead>'
        +'<tbody>'+feeRows+'</tbody></table></div></div>';
    } else {
      body = '<div class="card"><div class="card-head"><span class="card-title">💳 Fee Status</span></div>'
        +'<div style="padding:20px;max-width:360px">'
        +'<div class="form-group" style="margin-bottom:12px"><label>GCC / Admission No.</label>'
        +'<input id="pp-gcc" type="text" class="form-input" placeholder="e.g. GNSI-2024-001" value="'+esc(_ppGCC)+'"></div>'
        +'<div class="form-group" style="margin-bottom:16px"><label>Roll Number</label>'
        +'<input id="pp-roll" type="text" class="form-input" placeholder="Roll number" value="'+esc(_ppRoll)+'"></div>'
        +'<button class="btn btn-primary" onclick="gnsiParentLogin()">🔍 View Fee Status</button>'
        +'</div></div>';
    }
  } else if (_ppTab === 'notices') {
    var notices = [];
    try { notices = JSON.parse(localStorage.getItem('gnsi_notices') || '[]'); } catch(e) {}
    var pubNotices = notices.filter(function(n){return !n.private;}).slice().reverse().slice(0,20);
    var noticeRows = pubNotices.length
      ? pubNotices.map(function(n){
          return '<div style="padding:14px 16px;border-bottom:1px solid var(--border)">'
            +'<div style="font-weight:700;font-size:14px;margin-bottom:4px">'+esc(n.title||'Notice')+'</div>'
            +'<div style="font-size:12px;color:var(--muted);margin-bottom:6px">'+esc((n.date||'').split('T')[0])+'</div>'
            +'<div style="font-size:13px;line-height:1.6">'+esc(n.body||n.content||'')+'</div></div>';
        }).join('')
      : '<div style="text-align:center;color:var(--muted);padding:32px">No notices published.</div>';
    body = '<div class="card"><div class="card-head"><span class="card-title">📢 Notice Board</span></div>'+noticeRows+'</div>';
  } else if (_ppTab === 'feedback') {
    var feedbacks = [];
    try { feedbacks = JSON.parse(localStorage.getItem('gnsi_parent_feedback') || '[]'); } catch(e) {}
    body = '<div class="card" style="margin-bottom:16px"><div class="card-head"><span class="card-title">💬 Share Feedback</span></div>'
      +'<div style="padding:20px"><div class="form-grid g23">'
      +'<div class="form-group"><label>Your Name</label><input id="pp-fb-name" type="text" class="form-input" placeholder="Parent / Guardian name"></div>'
      +'<div class="form-group"><label>Student Name</label><input id="pp-fb-stu" type="text" class="form-input" placeholder="Ward\'s name"></div>'
      +'<div class="form-group"><label>Rating</label>'
      +'<select id="pp-fb-rating" style="width:100%;padding:8px;border:1.5px solid var(--border);border-radius:8px;font-size:13px">'
      +'<option value="">-- Select --</option>'
      +['⭐⭐⭐⭐⭐ Excellent','⭐⭐⭐⭐ Good','⭐⭐⭐ Average','⭐⭐ Below Average','⭐ Poor'].map(function(r){return'<option>'+r+'</option>';}).join('')
      +'</select></div>'
      +'<div class="form-group g3"><label>Feedback / Suggestions</label>'
      +'<textarea id="pp-fb-msg" rows="4" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:9px;font-size:13px;font-family:DM Sans,sans-serif;resize:vertical" placeholder="Share your experience..."></textarea></div>'
      +'</div><button class="btn btn-primary" onclick="gnsiSubmitParentFeedback()">📤 Submit Feedback</button></div></div>'
      +(feedbacks.length?'<div class="card"><div class="card-head"><span class="card-title" style="font-size:13px">Recent Feedback ('+feedbacks.length+')</span></div>'
        +feedbacks.slice().reverse().slice(0,5).map(function(f){
          return '<div style="padding:12px 16px;border-bottom:1px solid var(--border)">'
            +'<div style="font-weight:700;font-size:13px">'+esc(f.name||'Anonymous')+' -- '+esc(f.student||'')+'</div>'
            +'<div style="font-size:11px;color:var(--muted)">'+esc((f.date||'').split('T')[0])+' · '+esc(f.rating||'')+'</div>'
            +'<div style="font-size:13px;margin-top:4px">'+esc(f.message||'')+'</div></div>';
        }).join('')+'</div>':'');
  }
  return '<div class="card-head" style="margin-bottom:4px"><span class="card-title">👨‍👩‍👧 Parent &amp; Student Portal</span></div>'
    + tabBar + body;
}
function gnsiParentLogin() {
  var gcc  = ((document.getElementById('pp-gcc')  ||{}).value||'').trim();
  var roll = ((document.getElementById('pp-roll') ||{}).value||'').trim();
  _ppGCC=gcc; _ppRoll=roll;
  if(!gcc&&!roll){showToast('Enter GCC or Roll number','#dc2626');return;}
  var all=[];
  try{all=JSON.parse(localStorage.getItem('gnsi_students')||'[]');}catch(e){}
  var found=all.find(function(s){
    return (gcc&&(s.gcc===gcc||s.admissionNo===gcc||s.admNo===gcc))||(roll&&String(s.roll)===roll);
  });
  if(!found){showToast('Student not found. Check GCC / Roll No.','#dc2626');return;}
  _ppStudent=found; render();
}
function gnsiSubmitParentFeedback() {
  var name   =((document.getElementById('pp-fb-name')  ||{}).value||'').trim();
  var student=((document.getElementById('pp-fb-stu')   ||{}).value||'').trim();
  var rating =((document.getElementById('pp-fb-rating')||{}).value||'').trim();
  var message=((document.getElementById('pp-fb-msg')   ||{}).value||'').trim();
  if(!name||!message){showToast('Please fill Name and Feedback','#dc2626');return;}
  var all=[];
  try{all=JSON.parse(localStorage.getItem('gnsi_parent_feedback')||'[]');}catch(e){}
  all.push({id:'PF'+Date.now(),name:name,student:student,rating:rating,message:message,date:new Date().toISOString()});
  localStorage.setItem('gnsi_parent_feedback',JSON.stringify(all));
  if(typeof gnsiKVPush==='function')gnsiKVPush('gnsi_parent_feedback',all);
  showToast('Feedback submitted. Thank you!','#16a34a');
  render();
}
/* -- GNSI MOBILE SAFE-AREA COMPREHENSIVE FIX -------------------------------
   Injected at runtime so it applies AFTER all other styles.
   Fixes every fixed-position bottom element to clear the 64px mobile nav.
   ------------------------------------------------------------------------ */
(function _gnsiMobileFix() {
  var css = [
    /* All dynamic toasts created by examToast / facToast / star toast */
    '@media (max-width:768px){',
      /* Notice bell */
      '#gnsi-notice-bell{bottom:calc(64px + env(safe-area-inset-bottom) + 16px) !important;right:16px !important;}',
      /* Search FAB */
      '#gnsi-fab-search{bottom:calc(64px + env(safe-area-inset-bottom) + 84px) !important;right:16px !important;}',
      /* Dark mode toggle */
      '#dark-toggle{bottom:calc(64px + env(safe-area-inset-bottom) + 160px) !important;right:16px !important;}',
      /* Main showToast / gnsi-mob-toast */
      '#gnsi-toast,.gnsi-mob-toast{bottom:calc(64px + env(safe-area-inset-bottom) + 16px) !important;right:10px !important;left:10px !important;top:auto !important;max-width:unset !important;max-height:160px !important;overflow:hidden !important;}',
      /* gnsi-toast notice bell toasts */
      '.gnsi-toast{bottom:calc(64px + env(safe-area-inset-bottom) + 16px) !important;right:10px !important;left:10px !important;top:auto !important;max-height:160px !important;overflow:hidden !important;}',
      /* PWA install banner */
      '#gnsi-pwa-banner{bottom:calc(64px + env(safe-area-inset-bottom) + 12px) !important;}',
      /* All inline bottom-right toasts (examToast, facToast, star toast) -- target by class we add */
      '.gnsi-inline-toast{bottom:calc(64px + env(safe-area-inset-bottom) + 16px) !important;right:10px !important;left:10px !important;top:auto !important;max-width:calc(100vw - 20px) !important;}',
      /* Inline repeat(5+) grids -- rating panels, attendance, timetable cells */
      'div[style*="grid-template-columns:repeat(5,1fr)"],div[style*="grid-template-columns: repeat(5, 1fr)"]{grid-template-columns:repeat(3,1fr) !important;}',
      '.student-strip{grid-template-columns:repeat(3,1fr) !important;}',
      'div[style*="grid-template-columns:repeat(6,1fr)"],div[style*="grid-template-columns: repeat(6, 1fr)"]{grid-template-columns:repeat(3,1fr) !important;}',
      'div[style*="grid-template-columns:repeat(8,1fr)"],div[style*="grid-template-columns: repeat(8, 1fr)"]{grid-template-columns:repeat(4,1fr) !important;}',
      /* Set-PIN modal and any other JS-created 340px modals */
      '#gnsi-set-pin-modal > div,#gnsi-set-pin-modal div[style*="width:340px"]{width:92vw !important;max-width:360px !important;padding:22px 16px !important;}',
    '}'
  ].join('');
  var el = document.createElement('style');
  el.id = 'gnsi-mobile-fix-v18';
  el.textContent = css;
  document.head.appendChild(el);
  /* Patch examToast / facToast / star toast to add class so CSS above applies */
  function _patchToastFn(scope, name) {
    if (typeof scope[name] !== 'function') return;
    var _orig = scope[name];
    scope[name] = function(msg, col) {
      _orig.call(this, msg, col);
      /* Find the most-recently-appended fixed toast div and tag it */
      setTimeout(function() {
        var all = document.querySelectorAll('body > div[style*="position:fixed"][style*="bottom:28px"], body > div[style*="position:fixed"][style*="bottom:24px"]');
        all.forEach(function(el) { el.classList.add('gnsi-inline-toast'); });
      }, 0);
    };
  }
  /* Patch after DOM ready */
  function _doPatch() {
    _patchToastFn(window, 'examToast');
    _patchToastFn(window, 'facToast');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _doPatch);
  else _doPatch();
})();
// ══════════════════════════════════════════════════════════════
//  GNSI FEE SYSTEM -- Embedded in Admissions Tab
// ══════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════
//  DATA LAYER
// ══════════════════════════════════════════════════════════════
function fs_load(k) { try { return JSON.parse(localStorage.getItem('gnsi_fee_'+k)||'null'); } catch(e) { return null; } }
function fs_save(k,v) { localStorage.setItem('gnsi_fee_'+k, JSON.stringify(v));if(typeof gnsiKVPush==='function')gnsiKVPush('gnsi_fee_'+k,v); }
var FS_STUDENTS = fs_load('students') || [];
var FS_ADMREC   = fs_load('admrec')   || [];
var FS_ITEMS_REC= fs_load('itemsrec') || [];
var FS_MONTHLY  = fs_load('monthly')  || [];
var FS_ADVANCE  = fs_load('advance')  || [];
var FS_RECEIPT_COUNTER = fs_load('rctr') || 1000;
function fs_persist() {
  fs_save('students', FS_STUDENTS);
  fs_save('admrec',   FS_ADMREC);
  fs_save('itemsrec', FS_ITEMS_REC);
  fs_save('monthly',  FS_MONTHLY);
  fs_save('advance',  FS_ADVANCE);
  fs_save('rctr',     FS_RECEIPT_COUNTER);
}
// -- FS_ADVANCE HELPERS --
function fs_getAdvanceBalance(studentId) {
  return FS_ADVANCE.filter(function(a){ return a.studentId === studentId; })
    .reduce(function(t,a){ return t + (a.type==='credit' ? a.amount : -a.amount); }, 0);
}
function fs_getAdvanceRecords(studentId) {
  return FS_ADVANCE.filter(function(a){ return a.studentId === studentId; })
    .sort(function(a,b){ return b.createdAt.localeCompare(a.createdAt); });
}
// -- FEE CONFIG --
var FS_FEE_CONFIG = fs_load('config') || {
  courses: [
    { id:'sainik',    name:'Sainik',    icon:'⚔️',  admFee:6000, monthlyFees:{ boarder:17000, dayscholar:12000, dayboarder:14500 } },
    { id:'navodaya',  name:'Navodaya',  icon:'📚',  admFee:6000, monthlyFees:{ boarder:15000, dayscholar:10000, dayboarder:12500 } },
    { id:'foundation',name:'Foundation',icon:'🏫',  admFee:6000, monthlyFees:{ boarder:12000, dayscholar:8000,  dayboarder:10000 } },
    { id:'combined',  name:'Combined',  icon:'🎯',  admFee:6000, monthlyFees:{ boarder:19000, dayscholar:14000, dayboarder:16500 } }
  ],
  subtypes: ['Boarder','Day Scholar','Day Boarder'],
  itemsList: [
    { id:'i1', name:'Bedsheet Set',  price:650  },
    { id:'i2', name:'Pillow',        price:300  },
    { id:'i3', name:'Blanket',       price:850  },
    { id:'i4', name:'School Bag',    price:750  },
    { id:'i5', name:'Geometry Box',  price:150  },
    { id:'i6', name:'Uniform Set',   price:1200 },
    { id:'i7', name:'Sports Kit',    price:950  },
    { id:'i8', name:'Study Material',price:500  },
    { id:'i9', name:'ID Card',       price:80   }
  ],
  months: ['April','May','June','July','August','September','October','November','December','January','February','March']
};
/* ── Merge main portal fee config rates into FS_FEE_CONFIG on init ──
   If the admin saved rates via the main portal (Accounts → Fee Setup),
   those rates live in ims_feeconf / gnsi_fee_config_ls.
   We read them here and apply to FS_FEE_CONFIG so both systems agree.  */
(function _fsMergeMainConf() {
  try {
    var _raw = localStorage.getItem('ims_feeconf') || localStorage.getItem('gnsi_fee_config_ls');
    if (!_raw) return;
    var _mainConf = JSON.parse(_raw);
    if (!_mainConf) return;
    /* Apply main portal monthly fee rates to each FS course */
    (_mainConf.monthlyFees || []).forEach(function(mf) {
      var _cname = (mf.course || '').toLowerCase();
      FS_FEE_CONFIG.courses.forEach(function(c) {
        if (_cname.indexOf(c.id) !== -1) {
          /* Only override if main portal has a non-zero value */
          if (mf.amount       > 0) c.monthlyFees.boarder    = mf.amount;
          if (mf.hostelAmount > 0) c.monthlyFees.dayscholar  = mf.hostelAmount;
        }
      });
    });
    /* Apply admission fees */
    (_mainConf.admissionFees || []).forEach(function(af) {
      var _cname = (af.course || '').toLowerCase();
      FS_FEE_CONFIG.courses.forEach(function(c) {
        if (_cname.indexOf(c.id) !== -1 && af.amount > 0) {
          c.admFee = af.amount;
        }
      });
    });
  } catch(e) { /* silent — FS_FEE_CONFIG keeps its defaults */ }
})();
function fs_getMonthlyFee(courseId, subtype) {
  var c = FS_FEE_CONFIG.courses.find(function(x){return x.id===courseId;});
  if (!c) return 0;
  var key = subtype.toLowerCase().replace(' ','');
  return c.monthlyFees[key] || c.monthlyFees['boarder'] || 0;
}
// -- UTILITIES --
function fs_nextReceipt(prefix) {
  FS_RECEIPT_COUNTER++;
  fs_save('rctr', FS_RECEIPT_COUNTER);
  return (prefix||'RCP') + '-' + FS_RECEIPT_COUNTER;
}
function fs_today() { return new Date().toISOString().split('T')[0]; }
function fs_fmtDate(d) { try { return new Date(d+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}); } catch(e) { return d; } }
function fs_fmtAmt(n) { return '₹' + (n||0).toLocaleString('en-IN'); }
function fs_initials(name) { return (name||'?').split(' ').map(function(w){return w[0];}).join('').slice(0,2).toUpperCase(); }
function fs_uid() { return Date.now()+'_'+Math.random().toString(36).slice(2,7); }
function fs_showToast(msg, ok) {
  var t=document.getElementById('fs-toast');
  document.getElementById('fs-toast-msg').textContent=msg;
  document.getElementById('fs-toast-icon').textContent=ok===false?'❌':'✅';
  t.style.display='flex';
  clearTimeout(window._toastTimer);
  window._toastTimer=setTimeout(function(){t.style.display='none';},3000);
}
// -- ACTIVE PAGE --
var fs_activePage = 'dashboard';
var fs_admWizardStep = 1;
var fs_admWizardData = {};
var fs_collectStuId = null;
// ══════════════════════════════════════════════════════════════
//  ROUTER
// ══════════════════════════════════════════════════════════════
function fs_showPage(page) {
  fs_activePage = page;
  document.querySelectorAll('.sidebar-item').forEach(function(el){
    el.classList.toggle('active', el.getAttribute('onclick')&&el.getAttribute('onclick').includes("'"+page+"'"));
  });
  fs_updateSidebarCounts();
  fs_render();
}
function fs_render() {
  var mc = document.getElementById('fs-main-content');
  switch(fs_activePage) {
    case 'dashboard':       mc.innerHTML = fs_renderDashboard(); break;
    case 'new-admission':   mc.innerHTML = fs_renderAdmissionWizard(); fs_bindWizard(); break;
    case 'collect':         mc.innerHTML = fs_renderCollect(); break;
    case 'students':        mc.innerHTML = fs_renderStudentsPage(); break;
    case 'history':         mc.innerHTML = fs_renderHistory(); break;
    case 'dues':            mc.innerHTML = fs_renderDues(); break;
    case 'advance':         mc.innerHTML = fs_renderAdvancePage(); break;
    case 'advance-student': mc.innerHTML = fs_renderAdvanceStudent(); break;
    case 'fee-config':      mc.innerHTML = fs_renderFeeConfig(); break;
    case 'delete-records':  mc.innerHTML = fs_renderDeleteRecords(); break;
    case 'collect-student': mc.innerHTML = fs_renderCollectStudent(); break;
    default: mc.innerHTML = fs_renderDashboard();
  }
}
function fs_updateSidebarCounts() {
  var e = document.getElementById('fs-sb-stu-count');
  var d = document.getElementById('fs-sb-due-count');
  var ab = document.getElementById('fs-sb-adv-bal');
  if (e) e.textContent = FS_STUDENTS.length;
  if (d) {
    var dues = FS_STUDENTS.filter(function(s){ return fs_getDueMonths(s).length > 0; }).length;
    d.textContent = dues;
  }
  if (ab) {
    var totalBal = FS_ADVANCE.filter(function(a){ return a.type==='credit'; }).reduce(function(t,a){return t+a.amount;},0)
                 - FS_ADVANCE.filter(function(a){ return a.type==='debit'; }).reduce(function(t,a){return t+a.amount;},0);
    ab.textContent = totalBal > 0 ? fs_fmtAmt(totalBal) : '0';
  }
}
// ══════════════════════════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════════════════════════
function fs_renderDashboard() {
  var totalAdm = FS_ADMREC.reduce(function(t,r){return t+(r.admFee||0);},0);
  var totalItems = FS_ITEMS_REC.reduce(function(t,r){return t+(r.total||0);},0);
  var totalMonthly = FS_MONTHLY.reduce(function(t,r){return t+(r.amount||0);},0);
  var totalAdvCredit = FS_ADVANCE.filter(function(a){return a.type==='credit';}).reduce(function(t,a){return t+a.amount;},0);
  var totalAdvDebit  = FS_ADVANCE.filter(function(a){return a.type==='debit'; }).reduce(function(t,a){return t+a.amount;},0);
  var advBalance = totalAdvCredit - totalAdvDebit;
  var totalAll = totalAdm + totalItems + totalMonthly + totalAdvCredit;
  var dues = FS_STUDENTS.filter(function(s){ return fs_getDueMonths(s).length > 0; }).length;
  var allPayments = [];
  FS_ADMREC.forEach(function(r){ allPayments.push({date:r.date,type:'Admission Fee',student:r.studentName,amount:r.admFee+r.itemsTotal,receipt:r.receipt,badge:'badge-blue'}); });
  FS_MONTHLY.forEach(function(r){ allPayments.push({date:r.date,type:'Monthly Fee ('+r.month+')',student:r.studentName,amount:r.amount,receipt:r.receipt,badge:'badge-gold'}); });
  FS_ADVANCE.filter(function(a){return a.type==='credit';}).forEach(function(a){ allPayments.push({date:a.date,type:'Advance',student:a.studentName,amount:a.amount,receipt:a.receipt,badge:'badge-purple'}); });
  allPayments.sort(function(a,b){return b.date.localeCompare(a.date);});
  var recent = allPayments.slice(0,7);
  return '<div class="page-header"><div><div class="page-title">📊 Dashboard</div><div class="page-sub">Fee collection overview -- 2026-27</div></div>'
    +'<button class="btn btn-primary" onclick="fs_showPage(\'new-admission\')">➕ New Admission</button></div>'
    +'<div class="stats-row" style="grid-template-columns:repeat(5,1fr)">'
    +'<div class="stat-card blue"><div class="stat-label">Total Collection</div><div class="stat-val">'+fs_fmtAmt(totalAll)+'</div><div class="stat-sub">All fee types combined</div></div>'
    +'<div class="stat-card green"><div class="stat-label">Students</div><div class="stat-val">'+FS_STUDENTS.length+'</div><div class="stat-sub">Enrolled this session</div></div>'
    +'<div class="stat-card gold"><div class="stat-label">Admission Collected</div><div class="stat-val">'+fs_fmtAmt(totalAdm+totalItems)+'</div><div class="stat-sub">Admission + Items</div></div>'
    +'<div class="stat-card" style="border-left:4px solid #7c3aed"><div class="stat-label">Advance Balance</div><div class="stat-val" style="color:#7c3aed">'+fs_fmtAmt(advBalance)+'</div><div class="stat-sub">Held across students</div></div>'
    +'<div class="stat-card red"><div class="stat-label">Due Students</div><div class="stat-val">'+dues+'</div><div class="stat-sub">Monthly fee pending</div></div>'
    +'</div>'
    +'<div class="card"><div class="card-head"><span class="card-title">🕐 Recent Payments</span>'
    +'<button class="btn btn-sm" onclick="fs_showPage(\'history\')">View All →</button></div>'
    +(recent.length ? '<table><thead><tr><th>Date</th><th>Student</th><th>Type</th><th>Amount</th><th>Receipt</th></tr></thead><tbody>'
    +recent.map(function(p){return '<tr><td>'+fs_fmtDate(p.date)+'</td><td>'+esc(p.student)+'</td><td><span class="badge '+(p.badge||'badge-blue')+'">'+esc(p.type)+'</span></td><td style="font-weight:700;color:var(--green)">'+fs_fmtAmt(p.amount)+'</td><td style="font-size:11.5px;color:var(--muted)">'+esc(p.receipt)+'</td></tr>';}).join('')
    +'</tbody></table>'
    : '<div class="empty-state"><div class="empty-icon">💳</div><div class="empty-text">No payments yet</div><div class="empty-sub">Start by adding a new admission</div></div>')
    +'</div>'
    +'<div class="card"><div class="card-head"><span class="card-title">📈 Course-wise Breakdown</span></div><table>'
    +'<thead><tr><th>Course</th><th>Students</th><th>Boarder</th><th>Day Scholar</th><th>Day Boarder</th><th>Monthly Revenue/mo</th></tr></thead><tbody>'
    +FS_FEE_CONFIG.courses.map(function(c){
      var stus = FS_STUDENTS.filter(function(s){return s.courseId===c.id;});
      var b=stus.filter(function(s){return s.subtype==='Boarder';}).length;
      var ds=stus.filter(function(s){return s.subtype==='Day Scholar';}).length;
      var db=stus.filter(function(s){return s.subtype==='Day Boarder';}).length;
      var rev = b*c.monthlyFees.boarder + ds*c.monthlyFees.dayscholar + db*c.monthlyFees.dayboarder;
      return '<tr><td><b>'+c.icon+' '+c.name+'</b></td><td>'+stus.length+'</td><td>'+b+'</td><td>'+ds+'</td><td>'+db+'</td><td style="font-weight:700;color:var(--blue)">'+fs_fmtAmt(rev)+'</td></tr>';
    }).join('')
    +'</tbody></table></div>';
}
// ══════════════════════════════════════════════════════════════
//  ADMISSION WIZARD
// ══════════════════════════════════════════════════════════════
function fs_renderAdmissionWizard() {
  var steps = [
    {num:1, label:'Step 1', name:'Student Details'},
    {num:2, label:'Step 2', name:'Admission Fee'},
    {num:3, label:'Step 3', name:'Issue Items'},
    {num:4, label:'Step 4', name:'Registration Details'},
    {num:5, label:'Step 5', name:'Confirm & Receipt'}
  ];
  var stepsHtml = '<div class="steps-flow">'
    +steps.map(function(s){
      var cls = s.num===fs_admWizardStep ? 'active' : (s.num<fs_admWizardStep ? 'done' : '');
      return '<div class="step-item '+cls+'" onclick="fs_wizardGoTo('+s.num+')">'
        +'<div class="step-num">'+(cls==='done'?'✓':s.num)+'</div>'
        +'<div class="step-info"><div class="step-label">'+s.label+'</div><div class="step-name">'+s.name+'</div></div>'
        +'</div>';
    }).join('')
    +'</div>';
  var body = '';
  if (fs_admWizardStep===1) body = fs_renderWizardStep1();
  else if (fs_admWizardStep===2) body = fs_renderWizardStep2();
  else if (fs_admWizardStep===3) body = fs_renderWizardStep3();
  else if (fs_admWizardStep===4) body = fs_renderWizardStep4();
  else if (fs_admWizardStep===5) body = fs_renderWizardStep5();
  return '<div class="page-header"><div><div class="page-title">➕ New Admission -- Fee Collection</div>'
    +'<div class="page-sub">Complete all steps to enroll a student and collect fees</div></div></div>'
    + stepsHtml + body;
}
function fs_renderWizardStep1() {
  var d = fs_admWizardData;
  var _isRep1 = d.studentType==='repeater';
  return '<div class="card"><div class="card-head"><span class="card-title">👤 Student Details</span></div><div class="card-body">'
    +'<div style="display:flex;gap:10px;margin-bottom:18px">'
    +'<button type="button" onclick="fs_admWizardData.studentType=\'new\';fs_render()" '
    +' style="flex:1;padding:12px;border-radius:10px;font-size:13px;font-weight:800;cursor:pointer;'
    +(!_isRep1?'background:#0f2d52;border:2px dashed #0f2d52;color:#fff':'background:#f1f5f9;border:2px solid #cbd5e1;color:#64748b')+'">'
    +'🆕 New Student</button>'
    +'<button type="button" onclick="fs_admWizardData.studentType=\'repeater\';fs_render()" '
    +' style="flex:1;padding:12px;border-radius:10px;font-size:13px;font-weight:800;cursor:pointer;'
    +(_isRep1?'background:#7c3aed;border:2px dashed #7c3aed;color:#fff':'background:#f1f5f9;border:2px solid #cbd5e1;color:#64748b')+'">'
    +'🔄 Repeater Student</button>'
    +'</div>'
    +(_isRep1?'<div style="background:#faf5ff;border:1.5px solid #c4b5fd;border-radius:8px;padding:10px 14px;font-size:12px;color:#5b21b6;margin-bottom:14px">'
    +'⭐ Repeater: Admission = ₹0 · Items = ₹0 · Fee continues till March · <b>₹500 discount on all courses from April</b></div>':'')
    +'<div class="form-grid">'
    +'<div class="form-group"><label>Full Name <span class="req">*</span></label><input class="form-control" id="w-name" value="'+esc(d.name||'')+'" placeholder="Student full name"/></div>'
    +'<div class="form-group"><label>Father\'s Name</label><input class="form-control" id="w-father" value="'+esc(d.father||'')+'" placeholder="Father\'s name"/></div>'
    +'<div class="form-group"><label>Date of Birth</label><input class="form-control" type="date" id="w-dob" value="'+esc(d.dob||'')+'"/></div>'
    +'<div class="form-group"><label>Gender</label><select class="form-control" id="w-gender"><option value="">--</option><option'+(d.gender==='Male'?' selected':'')+'>Male</option><option'+(d.gender==='Female'?' selected':'')+'>Female</option></select></div>'
    +'<div class="form-group"><label>Mobile No.</label><input class="form-control" id="w-mobile" value="'+esc(d.mobile||'')+'" placeholder="Parent mobile"/></div>'
    +'<div class="form-group"><label>Address</label><input class="form-control" id="w-address" value="'+esc(d.address||'')+'" placeholder="Village / Town"/></div>'
    +'<div class="form-group"><label>Admission Date</label><input class="form-control" type="date" id="w-admdate" value="'+(d.admdate||fs_today())+'"/></div>'
    +'<div class="form-group"><label>Register No.</label><input class="form-control" id="w-regno" value="'+esc(d.regno||'')+'" placeholder="e.g. GCC-00800"/></div>'
    +'</div>'
    +'<div class="btn-row"><button class="btn btn-primary" onclick="fs_wizardStep1Next()">Continue →</button></div>'
    +'</div></div>';
}
function fs_renderWizardStep2() {
  var d = fs_admWizardData;
  var course = FS_FEE_CONFIG.courses.find(function(c){return c.id===d.courseId;});
  var _isRep2 = d.studentType === 'repeater';
  var admFee = _isRep2
    ? (d.admFee !== undefined ? d.admFee : 0)
    : (d.admFee !== undefined ? d.admFee : (course ? course.admFee : FS_FEE_CONFIG.courses[0].admFee));
  return '<div class="card"><div class="card-head"><span class="card-title">💳 Admission Fee</span></div><div class="card-body">'
    +(_isRep2?'<div style="background:#faf5ff;border:1.5px solid #c4b5fd;border-radius:8px;padding:10px 14px;font-size:12px;color:#5b21b6;margin-bottom:14px">'
    +'🔄 <b>Repeater Student</b> — Admission fee defaulted to <b>₹0</b>. Change if applicable.</div>':'')
    +'<div class="stu-profile"><div class="stu-avatar">'+fs_initials(d.name)+'</div><div><div class="stu-name">'+esc(d.name)+'</div><div class="stu-meta">'+esc(d.father||'')+(d.mobile?' · '+d.mobile:'')+'</div></div></div>'
    +'<div class="form-grid">'
    +'<div class="form-group"><label>Admission Fee (₹) <span class="req">*</span></label><input class="form-control" type="number" id="w-admfee" value="'+admFee+'" min="0"/></div>'
    +'<div class="form-group"><label>Payment Mode</label><select class="form-control" id="w-admmode"><option'+(d.admMode==='Cash'||!d.admMode?' selected':'')+'>Cash</option><option'+(d.admMode==='UPI'?' selected':'')+'>UPI</option><option'+(d.admMode==='Bank Transfer'?' selected':'')+'>Bank Transfer</option><option'+(d.admMode==='Cheque'?' selected':'')+'>Cheque</option></select></div>'
    +'<div class="form-group"><label>Txn Reference / Cheque No.</label><input class="form-control" id="w-admref" value="'+esc(d.admRef||'')+'" placeholder="Optional"/></div>'
    +'<div class="form-group"><label>Payment Date</label><input class="form-control" type="date" id="w-admdate2" value="'+(d.admdate2||fs_today())+'"/></div>'
    +'<div class="form-group form-full"><label>Remark</label><input class="form-control" id="w-admremark" value="'+esc(d.admRemark||'')+'" placeholder="Optional note"/></div>'
    +'</div>'
    +'<div class="btn-row"><button class="btn btn-primary" onclick="fs_wizardStep2Next()">Continue →</button><button class="btn" onclick="fs_wizardGoTo(1)">← Back</button></div>'
    +'</div></div>';
}
function fs_renderWizardStep3() {
  var d = fs_admWizardData;
  var _isRep3 = d.studentType === 'repeater';
  var selectedItems = d.selectedItems || {};
  var itemsHtml = '<div class="items-grid">'
    +FS_FEE_CONFIG.itemsList.map(function(item){
      var sel = !!selectedItems[item.id];
      var qty = selectedItems[item.id] ? selectedItems[item.id].qty : 1;
      return '<div class="item-chip'+(sel?' selected':'')+'" onclick="fs_toggleItem(\''+item.id+'\')" id="chip-'+item.id+'">'
        +'<input type="checkbox" '+(sel?'checked':'')+' onclick="event.stopPropagation();fs_toggleItem(\''+item.id+'\')">'
        +'<span class="item-chip-name">'+esc(item.name)+'<br><small style="color:var(--muted);font-weight:400">'+fs_fmtAmt(item.price)+' each</small></span>'
        +(sel?'<div class="item-chip-qty" onclick="event.stopPropagation()">×<input type="number" value="'+qty+'" min="1" max="10" onchange="fs_setItemQty(\''+item.id+'\',this.value)" style="width:42px;padding:2px 5px;border:1px solid #93c5fd;border-radius:5px;font-size:12px;text-align:center"/></div>':'')
        +'</div>';
    }).join('')
    +'</div>';
  // Calculate total
  var itemsTotal = 0;
  Object.keys(selectedItems).forEach(function(id){
    var it = FS_FEE_CONFIG.itemsList.find(function(x){return x.id===id;});
    if (it) itemsTotal += it.price * (selectedItems[id].qty||1);
  });
  var itemsBreakdown = Object.keys(selectedItems).length > 0
    ? '<div class="fee-box" style="margin-top:16px">'
      +Object.keys(selectedItems).map(function(id){
        var it=FS_FEE_CONFIG.itemsList.find(function(x){return x.id===id;});
        if(!it)return'';
        var qty=selectedItems[id].qty||1;
        return '<div class="fee-box-row"><span class="fee-box-label">'+it.name+' ×'+qty+'</span><span class="fee-box-amount">'+fs_fmtAmt(it.price*qty)+'</span></div>';
      }).join('')
      +'<div class="fee-box-row total"><span class="fee-box-label">Items Total</span><span class="fee-box-amount">'+fs_fmtAmt(itemsTotal)+'</span></div>'
      +'</div>'
    : '<div style="color:var(--muted);font-size:13px;margin-top:12px;padding:12px;background:var(--surface);border-radius:8px">No items selected -- student will receive no items. You can skip this step.</div>';
  return '<div class="card"><div class="card-head"><span class="card-title">📦 Issue Items to Student</span>'
    +'<span style="font-size:12px;color:var(--muted)">Select items issued at admission</span></div><div class="card-body">'
    +(_isRep3?'<div style="background:#faf5ff;border:1.5px solid #c4b5fd;border-radius:8px;padding:10px 14px;font-size:12px;color:#5b21b6;margin-bottom:14px">'+'🔄 <b>Repeater</b> — Items defaulted to ₹0. Only add if issuing new items.</div>':'')
    + itemsHtml + itemsBreakdown
    +'<div class="btn-row"><button class="btn btn-primary" onclick="fs_wizardStep3Next()">Continue →</button><button class="btn" onclick="fs_wizardGoTo(2)">← Back</button><button class="btn" onclick="fs_wizardSkipItems()">Skip (No Items)</button></div>'
    +'</div></div>';
}
function fs_renderWizardStep4() {
  var d = fs_admWizardData;
  var isRep = d.studentType === 'repeater';
  var feeLabel = isRep ? 'Previous Monthly Fee (₹) *' : 'Flat Monthly Fee (₹) *';
  var feeHelp  = isRep
    ? 'Carry-forward rate for Feb & March. Course fee (−₹500 discount) from April.'
    : 'Phase-1 flat fee for Jan–March. Course-based fee applies from April.';
  return '<div class="card"><div class="card-head"><span class="card-title">📋 Registration Details</span></div><div class="card-body">'
    +(isRep?'<div style="background:#faf5ff;border:1.5px solid #c4b5fd;border-radius:8px;padding:10px 14px;font-size:12px;color:#5b21b6;margin-bottom:14px">'
    +'🔄 <b>Repeater Student</b> — Previous monthly fee carries forward till March. Course fee with ₹500 discount from April.</div>':'')
    +'<div class="form-grid">'
    +'<div class="form-group"><label>Register No. *</label><input class="form-control" id="w-regno4" value="'+esc(d.regno||'')+'" placeholder="e.g. GCC-00800"/></div>'
    +'<div class="form-group"><label>Class / Batch *</label><input class="form-control" id="w-batch4" value="'+esc(d.batch||'')+'" placeholder="e.g. Class VII Navodaya"/></div>'
    +'<div class="form-group"><label>Hostel Type</label>'
    +'<select class="form-control" id="w-hosteltype">'
    +'<option value="Boarder"'+(d.hostelType==='Boarder'?' selected':'')+'>🏠 Boarder</option>'
    +'<option value="Day Boarder"'+(d.hostelType==='Day Boarder'?' selected':'')+'>🌗 Day Boarder</option>'
    +'<option value="Day Scholar"'+(d.hostelType==='Day Scholar'?' selected':'')+'>🚌 Day Scholar</option>'
    +'</select></div>'
    +'<div class="form-group"><label>'+feeLabel+'</label>'
    +'<input class="form-control" type="number" id="w-flatfee" value="'+(d.flatMonthlyFee||5500)+'" min="0" placeholder="5500"/>'
    +'<small style="color:var(--muted);font-size:11px">'+feeHelp+'</small></div>'
    +'</div>'
    +'<div class="btn-row"><button class="btn btn-primary" onclick="fs_wizardStep4Next()">Continue →</button>'
    +'<button class="btn" onclick="fs_wizardGoTo(3)">← Back</button></div>'
    +'</div></div>';
}

function fs_renderWizardStep5() {
  var d = fs_admWizardData;
  var _isRep5 = d.studentType === 'repeater';
  var mfee = d.flatMonthlyFee || 5500;
  var itemsTotal = 0; var itemsList = [];
  Object.keys(d.selectedItems||{}).forEach(function(id){
    var it = FS_FEE_CONFIG.itemsList.find(function(x){return x.id===id;});
    if(it){ var qty=(d.selectedItems[id]||{}).qty||1; itemsTotal+=it.price*qty; itemsList.push(it.name+(qty>1?' x'+qty:'')+' '+fs_fmtAmt(it.price*qty)); }
  });
  var grandTotal = (d.admFee||0) + itemsTotal;
  return '<div class="card"><div class="card-head"><span class="card-title">✅ Confirm & Generate Receipt</span></div><div class="card-body">'
    +'<div class="stu-profile"><div class="stu-avatar">'+fs_initials(d.name)+'</div>'
    +'<div><div class="stu-name">'+esc(d.name)+'</div>'
    +'<div class="stu-meta">'+esc(d.father||'—')+(d.mobile?' · '+esc(d.mobile):'')+'</div></div></div>'
    +'<div class="stu-badges">'
    +'<span class="badge badge-blue">📋 Phase-1 Student</span>'
    +'<span class="badge" style="background:'+(  _isRep5?'#faf5ff':'#fefce8')+';color:'+(_isRep5?'#5b21b6':'#854d0e')+';border:1px solid '+(_isRep5?'#c4b5fd':'#fde68a')+';">'
    +(_isRep5?'🔄 Repeater':'🆕 New Student')+'</span>'
    +'<span class="badge" style="background:#fefce8;color:#854d0e;border:1px solid #fde68a;">🎓 Course: Assigned in April</span>'
    +'</div>'
    +'<div class="form-grid" style="margin-top:8px">'
    +'<div class="form-group"><label>Register No.</label><input class="form-control" id="w-regno-final" value="'+esc(d.regno||'')+'" placeholder="GCC-XXXXX"/></div>'
    +'<div class="form-group"><label>Class / Batch</label><input class="form-control" id="w-batch-final" value="'+esc(d.batch||'')+'" placeholder="e.g. Class VII"/></div>'
    +'</div>'
    +'<div style="margin-top:16px"><div class="fee-box">'
    +'<div class="fee-box-row"><span class="fee-box-label">Admission Fee</span><span class="fee-box-amount">'+fs_fmtAmt(d.admFee||0)+'</span></div>'
    +(itemsList.length?'<div class="fee-box-row"><span class="fee-box-label">Items Issued ('+itemsList.length+' types)</span><span class="fee-box-amount">'+fs_fmtAmt(itemsTotal)+'</span></div>':'')
    +'<div class="fee-box-row total"><span class="fee-box-label">Grand Total Collected Today</span><span class="fee-box-amount">'+fs_fmtAmt(grandTotal)+'</span></div>'
    +'</div></div>'
    +(itemsList.length?'<div style="margin-top:8px;font-size:12px;color:var(--muted)">Items: '+itemsList.join(', ')+'</div>':'')
    +'<div style="margin-top:12px;background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:12px 16px;font-size:13px;color:var(--green)">'
    +'Monthly fee of <b>'+fs_fmtAmt(mfee)+'/month</b> applies for Feb & March. '
    +(_isRep5?'<b>₹500 discount</b> on course fee from April (Repeater).':'Course fee assigned from April.')+'</div>'
    +'<div class="btn-row">'
    +'<button class="btn btn-success" onclick="fs_wizardFinish()">✅ Confirm & Generate Receipt</button>'
    +'<button class="btn" onclick="fs_wizardGoTo(4)">← Back</button>'
    +'</div></div></div>';
}

function fs_wizardGoTo(step) {
  if (step < fs_admWizardStep || step <= fs_admWizardStep) fs_admWizardStep = step;
  fs_render();
}
function fs_bindWizard() {} // placeholder for future event binding
function fs_wizardStep1Next() {
  var name = (document.getElementById('w-name')||{}).value||'';
  if (!name.trim()) { fs_showToast('Student name is required', false); return; }
  fs_admWizardData.name    = name.trim();
  fs_admWizardData.father  = (document.getElementById('w-father')||{}).value||'';
  fs_admWizardData.dob     = (document.getElementById('w-dob')||{}).value||'';
  fs_admWizardData.gender  = (document.getElementById('w-gender')||{}).value||'';
  fs_admWizardData.mobile  = (document.getElementById('w-mobile')||{}).value||'';
  fs_admWizardData.address = (document.getElementById('w-address')||{}).value||'';
  fs_admWizardData.studentType = fs_admWizardData.studentType || 'new';
  fs_admWizardData.admdate = (document.getElementById('w-admdate')||{}).value||fs_today();
  fs_admWizardData.regno   = (document.getElementById('w-regno')||{}).value||'';
  fs_admWizardStep = 2;
  fs_render();
}
function fs_wizardStep2Next() {
  var fee = parseInt((document.getElementById('w-admfee')||{}).value||0);
  if (fee < 0) { fs_showToast('Enter a valid admission fee', false); return; }
  if (!fee && fs_admWizardData.studentType !== 'repeater') { fs_showToast('Enter admission fee (or 0 for repeater)', false); return; }
  fs_admWizardData.admFee    = fee;
  fs_admWizardData.admMode   = (document.getElementById('w-admmode')||{}).value||'Cash';
  fs_admWizardData.admRef    = (document.getElementById('w-admref')||{}).value||'';
  fs_admWizardData.admdate2  = (document.getElementById('w-admdate2')||{}).value||fs_today();
  fs_admWizardData.admRemark = (document.getElementById('w-admremark')||{}).value||'';
  fs_admWizardStep = 3;
  if (!fs_admWizardData.selectedItems) fs_admWizardData.selectedItems = {};
  fs_render();
}
function fs_wizardStep3Next() {
  fs_admWizardStep = 4;
  fs_render();
}
function fs_wizardSkipItems() {
  fs_admWizardData.selectedItems = {};
  fs_admWizardStep = 4;
  fs_render();
}
function fs_wizardStep4Next() {
  var regno = (document.getElementById('w-regno4')||{}).value||'';
  var batch = (document.getElementById('w-batch4')||{}).value||'';
  var flatfee = parseInt((document.getElementById('w-flatfee')||{}).value||0);
  if(!regno.trim()){fs_showToast('Enter Register No.',false);return;}
  if(!batch.trim()){fs_showToast('Enter Class/Batch',false);return;}
  if(!flatfee||flatfee<=0){fs_showToast('Enter a valid monthly fee',false);return;}
  fs_admWizardData.regno      = regno.trim();
  fs_admWizardData.batch      = batch.trim();
  fs_admWizardData.hostelType = (document.getElementById('w-hosteltype')||{}).value||'Boarder';
  fs_admWizardData.flatMonthlyFee = flatfee;
  /* Phase-1: Course/subtype deferred to April — clear any stale selection */
  fs_admWizardData.courseId   = null;
  fs_admWizardData.subtype    = null;
  fs_admWizardStep = 5;
  fs_render();
}
function fs_toggleItem(id) {
  if (!fs_admWizardData.selectedItems) fs_admWizardData.selectedItems = {};
  if (fs_admWizardData.selectedItems[id]) {
    delete fs_admWizardData.selectedItems[id];
  } else {
    fs_admWizardData.selectedItems[id] = { qty: 1 };
  }
  fs_render();
}
function fs_setItemQty(id, val) {
  if (!fs_admWizardData.selectedItems) fs_admWizardData.selectedItems = {};
  fs_admWizardData.selectedItems[id] = { qty: Math.max(1, parseInt(val)||1) };
}
function fs_selectCourse(id) {
  fs_admWizardData.courseId = id;
  fs_admWizardData.subtype = null;
  fs_render();
}
function fs_selectSubtype(st) {
  fs_admWizardData.subtype = st;
  fs_render();
}
function fs_wizardFinish() {
  var d = fs_admWizardData;
  var regno = (document.getElementById('w-regno-final')||{}).value || d.regno || 'GCC-'+Date.now().toString().slice(-5);
  var batch = (document.getElementById('w-batch-final')||document.getElementById('w-batch')||{}).value || '';
  d.regno = regno;
  d.batch = batch;
  // Calculate items total
  var itemsTotal = 0;
  var itemsList = [];
  Object.keys(d.selectedItems||{}).forEach(function(id){
    var it = FS_FEE_CONFIG.itemsList.find(function(x){return x.id===id;});
    if(it){ var qty=(d.selectedItems[id].qty||1); itemsTotal+=it.price*qty; itemsList.push({name:it.name,qty:qty,price:it.price,total:it.price*qty}); }
  });
  var stuId = fs_uid();
  var admReceiptNo = fs_nextReceipt('ADM');
  // Create student record
  var student = {
    id: stuId, name: d.name, father: d.father, dob: d.dob,
    gender: d.gender, mobile: d.mobile, address: d.address,
    admDate: d.admdate, regno: regno, batch: batch,
    courseId: null, subtype: null,
    hostelType: d.hostelType || 'Boarder',
    isRepeater: (d.studentType === 'repeater'),
    flatMonthlyFee: d.flatMonthlyFee || 5500,
    status: 'Active', paidMonths: [],
    createdAt: new Date().toISOString()
  };
  FS_STUDENTS.push(student);
  // Admission fee record
  var admRec = {
    id: fs_uid(), studentId: stuId, studentName: d.name,
    admFee: d.admFee, itemsTotal: itemsTotal,
    total: d.admFee + itemsTotal,
    payMode: d.admMode, txnRef: d.admRef,
    date: d.admdate2||fs_today(), receipt: admReceiptNo,
    remark: d.admRemark, items: itemsList,
    createdAt: new Date().toISOString()
  };
  FS_ADMREC.push(admRec);
  fs_persist();
  fs_updateSidebarCounts();
  /* ── INTEGRATION BRIDGE ──────────────────────────────────────────
     Push wizard data into the shared fee hub keys so the student
     appears in: Fee Hub Assignments, Dues, Monthly Collection,
     Accounts Income Ledger, and Main Students list.
     ──────────────────────────────────────────────────────────────── */
  (function() {
    try {
      var grandTotal = admRec.total;
      /* Phase-1: courseId=null — courseObj used only for name/label fallback */
      var courseObj  = FS_FEE_CONFIG.courses.find(function(c){ return c.id === student.courseId; }) || {name:'Phase-1',monthlyFees:{}};
      var subtypeKey = (student.hostelType||student.subtype||'boarder').toLowerCase().replace(/\s+/g,'');
      /* Phase-1: use flatMonthlyFee; Phase-2: use course config */
      var monthlyAmt = student.flatMonthlyFee
                       || (courseObj.monthlyFees && courseObj.monthlyFees[subtypeKey])
                       || (courseObj.monthlyFees && courseObj.monthlyFees['boarder']) || 5500;
      /* 1. Add to main students array (ims_students) so student appears everywhere */
      if (typeof students !== 'undefined') {
        var newMainId = (typeof nextId !== 'undefined') ? ++nextId : Date.now();
        /* Store the fs stuId on the record so we can cross-reference later */
        var mainStu = {
          id: newMainId, name: student.name, roll: student.regno || '',
          phone: student.mobile || '', cls: student.batch || '',
          hostel: (student.hostelType||student.subtype||'').toLowerCase().indexOf('boarder') !== -1 ? 'Yes' : 'No',
          fees: 'Pending', session: '', _fsId: student.id
        };
        students.push(mainStu);
        if (typeof stuSaveExtra === 'function') {
          stuSaveExtra(newMainId, {
            admNo: student.regno || '', dob: student.dob || '',
            gender: student.gender || '', father: student.father || '',
            address: student.address || ''
          });
        }
        try { /* [SUPABASE-ONLY] localStorage write removed: ims_students */ } catch(e){}
        if(typeof _gnsiInstantPush==='function'){var _si=students.find(function(x){return x.id===newId;});if(_si)_gnsiInstantPush('students',{id:_si.id,name:_si.name,roll_no:_si.roll||null,phone:_si.phone||null,is_boarder:_si.hostel==='Yes',status:'Active',class_id:CLASS_ID_MAP[_si.cls]||null,session:_si.session||null});} /* [SUPABASE-ONLY] */
        /* 2. Create fee assignment in gnsi_fee_asgns so student appears in Fee Hub */
        if (typeof gnsiLoad === 'function' && typeof gnsiSave === 'function') {
          var asgns = gnsiLoad('gnsi_fee_asgns') || gnsiLoad('gnsi_sfa_assignments') || [];
          var asgnId = 'wizard_' + student.id;
          var newAsgn = {
            id:              asgnId,
            stuId:           String(newMainId),
            studentName:     student.name,
            className:       student.batch || courseObj.name || '',
            courseId:        null,
            subTypeId:       '',
            subtype:         student.hostelType || 'Boarder',
            hostel:          mainStu.hostel,
            monthlyFee:      student.flatMonthlyFee || 5500,
            monthlyFeeOverride: student.flatMonthlyFee || 5500,
            isRepeater:      student.isRepeater || false,
            repeaterDiscount: student.isRepeater ? 500 : 0,
            feeStatus:       'Admission Paid',
            admissionPaid:   true,
            admissionReceiptNo: admReceiptNo,
            enrolledAt:      student.admDate || new Date().toISOString(),
            /* courseAssignedAt set when course is assigned in April */
            note:            'Enrolled via Admission Wizard'
          };
          asgns.push(newAsgn);
          gnsiSave('gnsi_fee_asgns',         asgns);
          gnsiSave('gnsi_sfa_assignments',    asgns);
          gnsiSave('gnsi_student_fee_asgns',  asgns);
          /* 3. Create a fee collection record for the admission payment */
          var cols = gnsiLoad('gnsi_fee_cols') || gnsiLoad('gnsi_sfa_collections') || [];
          var colRec = {
            id:          'wiz_col_' + Date.now(),
            asgnId:      asgnId,
            stuId:       String(newMainId),
            studentName: student.name,
            className:   mainStu.cls,
            forMonth:    'Admission',
            amountPaid:  grandTotal,
            payDate:     admRec.date,
            payMode:     admRec.payMode || 'Cash',
            txnRef:      admRec.txnRef || '',
            remark:      'Admission fee via wizard. ' + (admRec.remark || ''),
            feeType:     'admission',
            receiptNo:   admReceiptNo,
            createdAt:   new Date().toISOString()
          };
          cols.push(colRec);
          gnsiSave('gnsi_fee_cols',          cols);
          gnsiSave('gnsi_sfa_collections',   cols);
        }
      }
      /* 4. Post to Accounts income ledger (ims_income) */
      try {
        var income = JSON.parse(localStorage.getItem('ims_income') || '[]');
        income.push({
          id:       'wiz_inc_' + Date.now(),
          date:     admRec.date,
          category: 'Admission Fee',
          desc:     'Admission: ' + student.name + (student.batch ? ' ('+student.batch+')' : '') + (student.isRepeater?' [Repeater]':''),
          amount:   grandTotal,
          mode:     admRec.payMode || 'Cash',
          ref:      admReceiptNo,
          source:   'admission_wizard'
        });
        localStorage.setItem('ims_income', JSON.stringify(income));
        localStorage.setItem('gnsi_kv_ts_ims_income', new Date().toISOString());
        if (typeof gnsiKVPush === 'function') gnsiKVPush('ims_income', income);
      } catch(e) { (void 0); }
      /* 5. Supabase cloud sync */
      if (typeof gnsiKVPush === 'function') {
        try {
          gnsiKVPush('gnsi_fee_asgns',  JSON.parse(localStorage.getItem('gnsi_fee_asgns')||'[]'));
          gnsiKVPush('gnsi_fee_cols',   JSON.parse(localStorage.getItem('gnsi_fee_cols')||'[]'));
          gnsiKVPush('ims_students',    (typeof students !== 'undefined' ? students : []));
        } catch(e) {}
      }
      if (typeof pushToSupabase === 'function') {
        try { pushToSupabase(); } catch(e) {}
      }
      
    } catch(integErr) {
      (void 0);
    }
  })();
  /* ── END INTEGRATION BRIDGE ─────────────────────────────────── */
  // Show receipt
  fs_showAdmissionReceipt(student, admRec);
  // Reset wizard
  fs_admWizardStep = 1;
  fs_admWizardData = {};
  fs_showToast('Student enrolled -- Receipt: '+admReceiptNo);
}
// ══════════════════════════════════════════════════════════════
//  RECEIPT
// ══════════════════════════════════════════════════════════════
function fs_showAdmissionReceipt(stu, rec) {
  var course = FS_FEE_CONFIG.courses.find(function(c){return c.id===stu.courseId;});
  var html = '<div class="receipt-preview" id="fs-print-area">'
    +'<div class="receipt-header">'
    +'<div style="font-size:20px">🎓</div>'
    +'<div class="receipt-title">'+(window.TENANT?window.TENANT.name:'Guidance Navodaya & Sainik Institute')+'</div>'
    +'<div class="receipt-sub">'+(window.TENANT?window.TENANT.city+', '+window.TENANT.state:'Khangabok, Manipur')+' &nbsp;|&nbsp; Admission Fee Receipt</div>'
    +'</div>'
    +'<div style="display:flex;justify-content:space-between;margin-bottom:12px">'
    +'<span style="font-size:11.5px;color:var(--muted)">Receipt No.</span>'
    +'<span style="font-weight:700;font-size:13px;color:var(--navy)">'+rec.receipt+'</span>'
    +'</div>'
    +'<div class="receipt-row"><span>Student Name</span><b>'+esc(stu.name)+'</b></div>'
    +'<div class="receipt-row"><span>Father\'s Name</span><span>'+esc(stu.father||'--')+'</span></div>'
    +'<div class="receipt-row"><span>Register No.</span><span>'+esc(stu.regno)+'</span></div>'
    +'<div class="receipt-row"><span>Course</span><span>'+(course?course.name:'--')+' -- '+(stu.subtype||'--')+'</span></div>'
    +'<div class="receipt-row"><span>Date</span><span>'+fs_fmtDate(rec.date)+'</span></div>'
    +'<div class="receipt-row"><span>Payment Mode</span><span>'+esc(rec.payMode)+'</span></div>'
    +(rec.txnRef?'<div class="receipt-row"><span>Txn Ref</span><span>'+esc(rec.txnRef)+'</span></div>':'')
    +'<div style="height:8px"></div>'
    +'<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Fee Breakdown</div>'
    +'<div class="receipt-row"><span>Admission Fee</span><span>'+fs_fmtAmt(rec.admFee)+'</span></div>'
    +(rec.items&&rec.items.length?rec.items.map(function(it){return '<div class="receipt-row" style="font-size:12px"><span style="color:var(--muted)">  └ '+esc(it.name)+' ×'+it.qty+'</span><span>'+fs_fmtAmt(it.total)+'</span></div>';}).join(''):'')
    +(rec.itemsTotal?'<div class="receipt-row"><span>Items Total</span><span>'+fs_fmtAmt(rec.itemsTotal)+'</span></div>':'')
    +'<div class="receipt-total"><span>Grand Total</span><span>'+fs_fmtAmt(rec.total)+'</span></div>'
    +'<div style="margin-top:20px;border-top:1px solid #e2e8f0;padding-top:12px;text-align:center;font-size:11px;color:var(--muted)">Authorised Signatory -- '+(window.TENANT?window.TENANT.shortName+', '+window.TENANT.city:'GNSI, Khangabok')+'</div>'
    +'</div>';
  document.getElementById('fs-receipt-content').innerHTML = html;
  document.getElementById('fs-receipt-modal').classList.add('open');
}
function fs_showMonthlyReceipt(rec, stu) {
  var course = FS_FEE_CONFIG.courses.find(function(c){return c.id===stu.courseId;});
  var html = '<div class="receipt-preview" id="fs-print-area">'
    +'<div class="receipt-header">'
    +'<div style="font-size:20px">🎓</div>'
    +'<div class="receipt-title">'+(window.TENANT?window.TENANT.name:'Guidance Navodaya & Sainik Institute')+'</div>'
    +'<div class="receipt-sub">'+(window.TENANT?window.TENANT.city+', '+window.TENANT.state:'Khangabok, Manipur')+' &nbsp;|&nbsp; Monthly Fee Receipt</div>'
    +'</div>'
    +'<div style="display:flex;justify-content:space-between;margin-bottom:12px">'
    +'<span style="font-size:11.5px;color:var(--muted)">Receipt No.</span>'
    +'<span style="font-weight:700;font-size:13px;color:var(--navy)">'+rec.receipt+'</span>'
    +'</div>'
    +'<div class="receipt-row"><span>Student</span><b>'+esc(stu.name)+'</b></div>'
    +'<div class="receipt-row"><span>Course</span><span>'+(course?course.name:'--')+' -- '+(stu.subtype||'--')+'</span></div>'
    +'<div class="receipt-row"><span>For Month(s)</span><b>'+esc(rec.month)+'</b></div>'
    +'<div class="receipt-row"><span>Date</span><span>'+fs_fmtDate(rec.date)+'</span></div>'
    +'<div class="receipt-row"><span>Payment Mode</span><span>'+esc(rec.payMode)+'</span></div>'
    +(rec.remark?'<div class="receipt-row"><span>Remark</span><span>'+esc(rec.remark)+'</span></div>':'')
    +(rec.advanceUsed?'<div class="receipt-row"><span>Cash Received</span><span>'+fs_fmtAmt(rec.cashAmount||0)+'</span></div>':'')
    +(rec.advanceUsed?'<div class="receipt-row" style="color:#6d28d9"><span>⏫ Advance Applied</span><span>'+fs_fmtAmt(rec.advanceUsed)+'</span></div>':'')
    +'<div class="receipt-total"><span>Total Fee Settled</span><span>'+fs_fmtAmt(rec.amount)+'</span></div>'
    +'<div style="margin-top:20px;border-top:1px solid #e2e8f0;padding-top:12px;text-align:center;font-size:11px;color:var(--muted)">Authorised Signatory -- '+(window.TENANT?window.TENANT.shortName+', '+window.TENANT.city:'GNSI, Khangabok')+'</div>'
    +'</div>';
  document.getElementById('fs-receipt-content').innerHTML = html;
  document.getElementById('fs-receipt-modal').classList.add('open');
}
function fs_closeReceipt() { document.getElementById('fs-receipt-modal').classList.remove('open'); }
function fs_printReceipt() { window.print(); }
// ══════════════════════════════════════════════════════════════
//  FS_MONTHLY FEE COLLECTION
// ══════════════════════════════════════════════════════════════
function fs_renderCollect() {
  var search = window.fs_collectSearch || '';
  var filtered = FS_STUDENTS.filter(function(s){
    if (!search) return true;
    return s.name.toLowerCase().includes(search.toLowerCase()) || (s.regno||'').toLowerCase().includes(search.toLowerCase());
  });
  return '<div class="page-header"><div><div class="page-title">💰 Monthly Fee Collection</div><div class="page-sub">Select a student to collect monthly fee</div></div></div>'
    +'<div class="search-bar">'
    +'<input class="search-input" id="collect-search" placeholder="🔍 Search by name or register no..." value="'+esc(search)+'" oninput="window.fs_collectSearch=this.value;_debouncedFsRender()" />'
    +'</div>'
    +(filtered.length===0 ? '<div class="empty-state"><div class="empty-icon">👥</div><div class="empty-text">'+(FS_STUDENTS.length===0?'No students enrolled yet':'No students match your search')+'</div>'+(FS_STUDENTS.length===0?'<button class="btn btn-primary" style="margin-top:12px" onclick="fs_showPage(\'new-admission\')">➕ Add First Student</button>':'')+'</div>'
    : '<div class="card"><table><thead><tr><th>Student</th><th>Course</th><th>Sub-type</th><th>Monthly Fee</th><th>This Month</th><th>Action</th></tr></thead><tbody>'
    +filtered.map(function(s){
      var course = FS_FEE_CONFIG.courses.find(function(c){return c.id===s.courseId;});
      var mfee = fs_getMonthlyFee(s.courseId, s.subtype||'boarder');
      var curMonth = FS_FEE_CONFIG.months[new Date().getMonth()];
      var paid = (s.paidMonths||[]).includes(curMonth+' '+new Date().getFullYear());
      return '<tr>'
        +'<td><div style="font-weight:600">'+esc(s.name)+'</div><div style="font-size:11.5px;color:var(--muted)">'+esc(s.regno||'')+'</div></td>'
        +'<td>'+(course?'<span class="badge badge-blue">'+course.icon+' '+course.name+'</span>':'--')+'</td>'
        +'<td>'+(s.subtype?'<span class="badge badge-purple">'+s.subtype+'</span>':'--')+'</td>'
        +'<td style="font-weight:700;color:var(--blue)">'+fs_fmtAmt(mfee)+'/mo</td>'
        +'<td>'+(paid?'<span class="badge badge-green">✓ Paid</span>':'<span class="badge badge-red">Pending</span>')+'</td>'
        +'<td><button class="btn btn-primary btn-sm" onclick="fs_openCollectStudent(\''+parseInt(s.id,10)+'\')">💳 Collect</button></td>'
        +'</tr>';
    }).join('')
    +'</tbody></table></div>');
}
function fs_openCollectStudent(stuId) {
  fs_collectStuId = stuId;
  fs_activePage = 'collect-student';
  fs_render();
}
function fs_getDueMonths(stu) {
  var paid = stu.paidMonths || [];
  var year = new Date().getFullYear();
  var curMonthIdx = new Date().getMonth();
  var due = [];
  for (var i = 0; i <= curMonthIdx; i++) {
    var key = FS_FEE_CONFIG.months[i] + ' ' + year;
    if (!paid.includes(key)) due.push(key);
  }
  return due;
}
function fs_renderCollectStudent() {
  var stu = FS_STUDENTS.find(function(s){return s.id===fs_collectStuId;});
  if (!stu) return '<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-text">Student not found</div></div>';
  var course = FS_FEE_CONFIG.courses.find(function(c){return c.id===stu.courseId;});
  var mfee = fs_getMonthlyFee(stu.courseId, stu.subtype||'boarder');
  var paid = stu.paidMonths || [];
  var year = new Date().getFullYear();
  var advBal = fs_getAdvanceBalance(stu.id);
  var monthsHtml = '<div class="month-grid">'
    +FS_FEE_CONFIG.months.map(function(m,i){
      var key = m + ' ' + year;
      var isPaid = paid.includes(key);
      var isSelected = (window.fs_collectSelectedMonths||[]).includes(key);
      var cls = isPaid ? 'paid' : (isSelected ? 'selected' : '');
      return '<div class="month-chip '+cls+'" onclick="'+(isPaid?'':'fs_toggleCollectMonth(\''+key+'\')')+'">'+m.slice(0,3)+'<br><small>'+(isPaid?'✓ Paid':(isSelected?'●':'Unpaid'))+'</small></div>';
    }).join('')
    +'</div>';
  var selMonths = window.fs_collectSelectedMonths || [];
  var totalDue = selMonths.length * mfee;
  var useAdv = window.fs_collectUseAdvance && advBal > 0;
  var advUsed = useAdv ? Math.min(advBal, totalDue) : 0;
  var netPayable = Math.max(0, totalDue - advUsed);
  var advBanner = advBal > 0
    ? '<div style="background:#f5f3ff;border:1.5px solid #c4b5fd;border-radius:10px;padding:12px 16px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">'
      +'<div><span style="font-size:13px;font-weight:700;color:#6d28d9">⏫ Advance Balance: '+fs_fmtAmt(advBal)+'</span>'
      +'<div style="font-size:11.5px;color:#7c3aed;margin-top:2px">Available to apply against monthly fees</div></div>'
      +'<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;font-weight:600;color:#6d28d9">'
      +'<input type="checkbox" id="use-advance-chk" '+(useAdv?'checked':'')+' onchange="window.fs_collectUseAdvance=this.checked;fs_render()" style="accent-color:#7c3aed;width:16px;height:16px"> Apply Advance</label>'
      +'</div>'
    : '';
  return '<div class="page-header"><div><div class="page-title">💳 Collect Monthly Fee</div></div>'
    +'<button class="btn" onclick="fs_showPage(\'collect\')">← Back to List</button></div>'
    +'<div class="stu-profile"><div class="stu-avatar">'+fs_initials(stu.name)+'</div>'
    +'<div><div class="stu-name">'+esc(stu.name)+'</div><div class="stu-meta">'+esc(stu.father||'')+(stu.mobile?' · '+stu.mobile:'')+' · '+esc(stu.regno||'')+'</div></div>'
    +'<div class="stu-badges">'
    +(course?'<span class="badge badge-blue">'+course.icon+' '+course.name+'</span>':'')
    +(stu.subtype?'<span class="badge badge-purple">'+stu.subtype+'</span>':'')
    +'<span class="badge badge-gold">'+fs_fmtAmt(mfee)+'/mo</span>'
    +(advBal>0?'<span class="badge" style="background:#f5f3ff;color:#6d28d9;border-color:#c4b5fd">⏫ Adv: '+fs_fmtAmt(advBal)+'</span>':'')
    +'</div></div>'
    + advBanner
    +'<div class="card"><div class="card-head"><span class="card-title">📅 Select Month(s) to Pay</span><span style="font-size:12px;color:var(--muted)">Click months to select · Green = already paid</span></div>'
    +'<div class="card-body">'
    +(_isRep3?'<div style="background:#faf5ff;border:1.5px solid #c4b5fd;border-radius:8px;padding:10px 14px;font-size:12px;color:#5b21b6;margin-bottom:14px">'
    +'🔄 <b>Repeater</b> — Items defaulted to ₹0. Add only if issuing new items.</div>':'')
    + monthsHtml
    +(selMonths.length > 0 ?
      '<div class="fee-box" style="margin-top:16px">'
      +selMonths.map(function(m){return '<div class="fee-box-row"><span class="fee-box-label">'+m+'</span><span class="fee-box-amount">'+fs_fmtAmt(mfee)+'</span></div>';}).join('')
      +(advUsed>0?'<div class="fee-box-row" style="background:#f5f3ff"><span class="fee-box-label" style="color:#6d28d9">⏫ Advance Applied</span><span class="fee-box-amount" style="color:#6d28d9">− '+fs_fmtAmt(advUsed)+'</span></div>':'')
      +'<div class="fee-box-row total"><span class="fee-box-label">'+(advUsed>0?'Net Payable':'Total')+' ('+selMonths.length+' month'+(selMonths.length>1?'s':'')+')</span><span class="fee-box-amount">'+fs_fmtAmt(netPayable)+'</span></div>'
      +'</div>'
      :'<div style="color:var(--muted);font-size:13px;margin-top:12px;padding:12px;background:var(--surface);border-radius:8px">Select month(s) above to collect fee.</div>')
    +'</div></div>'
    +(selMonths.length > 0 ?
    '<div class="card"><div class="card-head"><span class="card-title">💰 Payment Details</span>'
    +(advUsed>0?'<span style="font-size:12px;color:#6d28d9;font-weight:600">⏫ '+fs_fmtAmt(advUsed)+' from advance will be used</span>':'')
    +'</div><div class="card-body">'
    +'<div class="form-grid">'
    +'<div class="form-group"><label>Amount to Collect (₹)</label><input class="form-control" type="number" id="mc-amount" value="'+netPayable+'" min="0"/></div>'
    +'<div class="form-group"><label>Payment Mode</label><select class="form-control" id="mc-mode"><option>Cash</option><option>UPI</option><option>Bank Transfer</option><option>Cheque</option>'+(advUsed===totalDue?'<option selected>Advance</option>':'')+'</select></div>'
    +'<div class="form-group"><label>Payment Date</label><input class="form-control" type="date" id="mc-date" value="'+fs_today()+'"/></div>'
    +'<div class="form-group"><label>Txn Ref</label><input class="form-control" id="mc-ref" placeholder="Optional"/></div>'
    +'<div class="form-group form-full"><label>Remark</label><input class="form-control" id="mc-remark" placeholder="Optional note"/></div>'
    +'</div>'
    +'<div class="btn-row"><button class="btn btn-success" onclick="fs_saveMonthlyPayment()">✅ Save & Print Receipt</button><button class="btn" onclick="fs_saveMonthlyPayment(true)">✓ Save Only</button></div>'
    +'</div></div>'
    : '');
}
function fs_toggleCollectMonth(key) {
  if (!window.fs_collectSelectedMonths) window.fs_collectSelectedMonths = [];
  var idx = window.fs_collectSelectedMonths.indexOf(key);
  if (idx >= 0) window.fs_collectSelectedMonths.splice(idx,1);
  else window.fs_collectSelectedMonths.push(key);
  fs_render();
}
function fs_saveMonthlyPayment(saveOnly) {
  var stu = FS_STUDENTS.find(function(s){return s.id===fs_collectStuId;});
  if (!stu) return;
  var months = window.fs_collectSelectedMonths || [];
  if (!months.length) { fs_showToast('Select at least one month', false); return; }
  var mfee = fs_getMonthlyFee(stu.courseId, stu.subtype||'boarder');
  var totalDue = months.length * mfee;
  var advBal = fs_getAdvanceBalance(stu.id);
  var useAdv = window.fs_collectUseAdvance && advBal > 0;
  var advUsed = useAdv ? Math.min(advBal, totalDue) : 0;
  var amount = parseInt((document.getElementById('mc-amount')||{}).value||0);
  var netExpected = Math.max(0, totalDue - advUsed);
  if (amount < 0) { fs_showToast('Enter a valid amount', false); return; }
  if (netExpected > 0 && amount === 0 && advUsed < totalDue) { fs_showToast('Enter the amount to collect', false); return; }
  var mode = (document.getElementById('mc-mode')||{}).value||'Cash';
  var date = (document.getElementById('mc-date')||{}).value||fs_today();
  var ref  = (document.getElementById('mc-ref')||{}).value||'';
  var rem  = (document.getElementById('mc-remark')||{}).value||'';
  var receipt = fs_nextReceipt('MFR');
  // Deduct from advance if applicable
  if (advUsed > 0) {
    FS_ADVANCE.push({ id:fs_uid(), studentId:stu.id, studentName:stu.name,
      type:'debit', amount:advUsed, reason:'Applied to Monthly Fee ('+months.join(', ')+')',
      receipt: receipt, date:date, createdAt:new Date().toISOString() });
  }
  var totalCollected = amount + advUsed;
  var rec = { id:fs_uid(), studentId:stu.id, studentName:stu.name,
    months: months, month: months.join(', '),
    amount: totalCollected, cashAmount: amount, advanceUsed: advUsed,
    payMode: mode, txnRef: ref,
    date: date, receipt: receipt, remark: rem,
    createdAt: new Date().toISOString() };
  FS_MONTHLY.push(rec);
  months.forEach(function(m){ if(!(stu.paidMonths||[]).includes(m)){ (stu.paidMonths=stu.paidMonths||[]).push(m); } });
  fs_persist();
  window.fs_collectSelectedMonths = [];
  window.fs_collectUseAdvance = false;
  if (!saveOnly) fs_showMonthlyReceipt(rec, stu);
  else fs_showToast('Payment saved -- '+receipt);
  fs_render();
}
// ══════════════════════════════════════════════════════════════
//  FS_STUDENTS PAGE
// ══════════════════════════════════════════════════════════════
var fs_delStuId = null;
function fs_renderStudentsPage() {
  var search = window._stuSearch || '';
  var filtered = FS_STUDENTS.filter(function(s){
    return !search || s.name.toLowerCase().includes(search.toLowerCase()) || (s.regno||'').toLowerCase().includes(search.toLowerCase());
  });
  // Confirmation modal
  var confirmHtml = '';
  if (fs_delStuId) {
    var ds = FS_STUDENTS.find(function(s){ return s.id === fs_delStuId; });
    if (ds) {
      var dsAdm     = FS_ADMREC.filter(function(r){ return r.studentId === fs_delStuId; });
      var dsMon     = FS_MONTHLY.filter(function(r){ return r.studentId === fs_delStuId; });
      var dsAdv     = FS_ADVANCE.filter(function(a){ return a.studentId === fs_delStuId; });
      var dsAdvBal  = fs_getAdvanceBalance(fs_delStuId);
      var dsCourse  = FS_FEE_CONFIG.courses.find(function(c){ return c.id === ds.courseId; });
      confirmHtml = '<div style="position:fixed;inset:0;background:rgba(15,31,61,0.6);z-index:300;display:flex;align-items:center;justify-content:center;padding:16px">'
        +'<div style="background:#fff;border-radius:16px;padding:28px 32px;max-width:480px;width:100%;box-shadow:0 12px 48px rgba(0,0,0,0.25);overflow-y:auto;max-height:90vh">'
        +'<div style="font-size:32px;text-align:center;margin-bottom:6px">⚠️</div>'
        +'<div style="font-family:Syne,sans-serif;font-size:17px;font-weight:800;color:#0f1f3d;text-align:center;margin-bottom:4px">Delete Student Record?</div>'
        +'<div style="font-size:13px;color:#64748b;text-align:center;margin-bottom:20px">This will permanently remove the student and ALL linked fee records.</div>'
        // Student profile card
        +'<div style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:10px;padding:14px 16px;margin-bottom:16px">'
        +'<div style="font-weight:700;font-size:15px;color:#0f1f3d">'+esc(ds.name)+'</div>'
        +'<div style="font-size:12.5px;color:#64748b;margin-top:2px">'+esc(ds.father||'')+(ds.mobile?' · '+ds.mobile:'')+(ds.regno?' · '+ds.regno:'')+'</div>'
        +'<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">'
        +(dsCourse?'<span class="badge badge-blue">'+dsCourse.icon+' '+dsCourse.name+'</span>':'')
        +(ds.subtype?'<span class="badge badge-purple">'+ds.subtype+'</span>':'')
        +(ds.admDate?'<span class="badge badge-gray">Joined: '+fs_fmtDate(ds.admDate)+'</span>':'')
        +'</div></div>'
        // Impact summary
        +'<div style="background:#fef2f2;border:1.5px solid #fca5a5;border-radius:10px;padding:14px 16px;margin-bottom:20px">'
        +'<div style="font-size:12px;font-weight:700;color:#b91c1c;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px">⚠️ Records that will be deleted</div>'
        +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'
        +'<div style="background:#fff;border-radius:8px;padding:10px 12px;border:1px solid #fca5a5">'
        +'<div style="font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase">Admission Records</div>'
        +'<div style="font-size:18px;font-weight:800;color:#dc2626;margin-top:2px">'+dsAdm.length+'</div>'
        +'<div style="font-size:11.5px;color:#64748b">'+fs_fmtAmt(dsAdm.reduce(function(t,r){return t+r.total;},0))+' collected</div>'
        +'</div>'
        +'<div style="background:#fff;border-radius:8px;padding:10px 12px;border:1px solid #fca5a5">'
        +'<div style="font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase">Monthly Payments</div>'
        +'<div style="font-size:18px;font-weight:800;color:#dc2626;margin-top:2px">'+dsMon.length+'</div>'
        +'<div style="font-size:11.5px;color:#64748b">'+fs_fmtAmt(dsMon.reduce(function(t,r){return t+r.amount;},0))+' collected</div>'
        +'</div>'
        +'<div style="background:#fff;border-radius:8px;padding:10px 12px;border:1px solid #fca5a5">'
        +'<div style="font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase">Advance Records</div>'
        +'<div style="font-size:18px;font-weight:800;color:#dc2626;margin-top:2px">'+dsAdv.length+'</div>'
        +'<div style="font-size:11.5px;color:'+(dsAdvBal>0?'#b91c1c':'#64748b')+'">Balance: '+fs_fmtAmt(dsAdvBal)+'</div>'
        +'</div>'
        +'<div style="background:#fff;border-radius:8px;padding:10px 12px;border:1px solid #fca5a5">'
        +'<div style="font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase">Paid Months</div>'
        +'<div style="font-size:18px;font-weight:800;color:#dc2626;margin-top:2px">'+(ds.paidMonths||[]).length+'</div>'
        +'<div style="font-size:11.5px;color:#64748b">months cleared</div>'
        +'</div>'
        +'</div></div>'
        +'<div style="display:flex;gap:10px;justify-content:center">'
        +'<button class="btn btn-danger" onclick="fs_confirmDeleteStudent()">🗑️ Yes, Delete Student</button>'
        +'<button class="btn" onclick="fs_delStuId=null;fs_render()">Cancel</button>'
        +'</div>'
        +'</div></div>';
    }
  }
  return confirmHtml
    +'<div class="page-header"><div><div class="page-title">👥 Students</div><div class="page-sub">'+FS_STUDENTS.length+' enrolled students</div></div>'
    +'<button class="btn btn-primary" onclick="fs_showPage(\'new-admission\')">➕ New Admission</button></div>'
    +'<div class="search-bar"><input class="search-input" placeholder="🔍 Search students..." value="'+esc(search)+'" oninput="window._stuSearch=this.value;_debouncedFsRender()"/></div>'
    +(filtered.length===0 ? '<div class="empty-state"><div class="empty-icon">👥</div><div class="empty-text">No students found</div></div>'
    : '<div class="card"><table><thead><tr><th>Name</th><th>Register No.</th><th>Course</th><th>Sub-type</th><th>Mobile</th><th>Due Months</th><th>Actions</th></tr></thead><tbody>'
    +filtered.map(function(s){
      var course=FS_FEE_CONFIG.courses.find(function(c){return c.id===s.courseId;});
      var due=fs_getDueMonths(s).length;
      return '<tr><td><div style="font-weight:600">'+esc(s.name)+'</div><div style="font-size:11.5px;color:var(--muted)">'+esc(s.father||'')+'</div></td>'
        +'<td style="font-size:12px;color:var(--muted)">'+esc(s.regno||'--')+'</td>'
        +'<td>'+(course?'<span class="badge badge-blue">'+course.icon+' '+course.name+'</span>':'--')+'</td>'
        +'<td>'+(s.subtype?'<span class="badge badge-purple">'+s.subtype+'</span>':'--')+'</td>'
        +'<td style="font-size:12.5px">'+esc(s.mobile||'--')+'</td>'
        +'<td>'+(due>0?'<span class="badge badge-red">'+due+' due</span>':'<span class="badge badge-green">All paid</span>')+'</td>'
        +'<td style="display:flex;gap:6px;flex-wrap:wrap">'
        +'<button class="btn btn-primary btn-sm" onclick="fs_openCollectStudent(\''+parseInt(s.id,10)+'\')">💳 Collect</button>'
        +'<button class="btn btn-danger btn-sm" onclick="fs_askDeleteStudent(\''+parseInt(s.id,10)+'\')">🗑️ Delete</button>'
        +'</td>'
        +'</tr>';
    }).join('')+'</tbody></table></div>');
}
function fs_askDeleteStudent(stuId) {
  fs_delStuId = stuId;
  fs_render();
}
function fs_confirmDeleteStudent() {
  if (!fs_delStuId) return;
  // Remove all linked records
  FS_ADMREC   = FS_ADMREC.filter(function(r){ return r.studentId !== fs_delStuId; });
  FS_MONTHLY  = FS_MONTHLY.filter(function(r){ return r.studentId !== fs_delStuId; });
  FS_ADVANCE  = FS_ADVANCE.filter(function(a){ return a.studentId !== fs_delStuId; });
  FS_STUDENTS = FS_STUDENTS.filter(function(s){ return s.id !== fs_delStuId; });
  fs_delStuId = null;
  fs_persist();
  gnsiMarkLocalSave(20000); // 20s guard -- prevents KV poll from restoring deleted fee student
  fs_updateSidebarCounts();
  fs_showToast('Student and all linked records deleted');
  fs_render();
}
// ══════════════════════════════════════════════════════════════
//  HISTORY
// ══════════════════════════════════════════════════════════════
function fs_renderHistory() {
  var all = [];
  FS_ADMREC.forEach(function(r){ all.push({date:r.date,student:r.studentName,type:'Admission + Items',amount:r.total,receipt:r.receipt,mode:r.payMode,badge:'badge-blue'}); });
  FS_MONTHLY.forEach(function(r){ all.push({date:r.date,student:r.studentName,type:'Monthly ('+r.month+')',amount:r.amount,receipt:r.receipt,mode:r.payMode,badge:'badge-gold'}); });
  FS_ADVANCE.filter(function(a){return a.type==='credit';}).forEach(function(a){ all.push({date:a.date,student:a.studentName,type:'Advance',amount:a.amount,receipt:a.receipt,mode:a.payMode||'--',badge:'badge-purple'}); });
  all.sort(function(a,b){return b.date.localeCompare(a.date);});
  return '<div class="page-header"><div><div class="page-title">🧾 Payment History</div><div class="page-sub">'+all.length+' total transactions</div></div></div>'
    +(all.length===0?'<div class="empty-state"><div class="empty-icon">🧾</div><div class="empty-text">No payments recorded yet</div></div>'
    :'<div class="card"><table><thead><tr><th>Date</th><th>Student</th><th>Type</th><th>Mode</th><th>Amount</th><th>Receipt</th></tr></thead><tbody>'
    +all.map(function(p){
      return '<tr><td>'+fs_fmtDate(p.date)+'</td><td style="font-weight:600">'+esc(p.student)+'</td>'
        +'<td><span class="badge '+(p.badge||'badge-blue')+'">'+esc(p.type)+'</span></td>'
        +'<td style="font-size:12.5px">'+esc(p.mode)+'</td>'
        +'<td style="font-weight:700;color:var(--green)">'+fs_fmtAmt(p.amount)+'</td>'
        +'<td style="font-size:11.5px;color:var(--muted)">'+esc(p.receipt)+'</td>'
        +'</tr>';
    }).join('')+'</tbody></table></div>');
}
// ══════════════════════════════════════════════════════════════
//  DUE LIST
// ══════════════════════════════════════════════════════════════
function fs_renderDues() {
  var dueStudents = FS_STUDENTS.filter(function(s){ return fs_getDueMonths(s).length>0; });
  return '<div class="page-header"><div><div class="page-title">⏳ Due List</div><div class="page-sub">Students with pending monthly fees</div></div></div>'
    +(dueStudents.length===0?'<div class="empty-state"><div class="empty-icon">🎉</div><div class="empty-text">All fees are up to date!</div><div class="empty-sub">No pending dues</div></div>'
    :'<div class="card"><table><thead><tr><th>Student</th><th>Course</th><th>Sub-type</th><th>Due Months</th><th>Total Due</th><th>Action</th></tr></thead><tbody>'
    +dueStudents.map(function(s){
      var due=fs_getDueMonths(s);
      var mfee=fs_getMonthlyFee(s.courseId,s.subtype||'boarder');
      var course=FS_FEE_CONFIG.courses.find(function(c){return c.id===s.courseId;});
      return '<tr><td><div style="font-weight:600">'+esc(s.name)+'</div><div style="font-size:11.5px;color:var(--muted)">'+esc(s.regno||'')+'</div></td>'
        +'<td>'+(course?'<span class="badge badge-blue">'+course.icon+' '+course.name+'</span>':'--')+'</td>'
        +'<td>'+(s.subtype?'<span class="badge badge-purple">'+s.subtype+'</span>':'--')+'</td>'
        +'<td style="font-size:12px">'+due.map(function(m){return '<span class="badge badge-red" style="margin:2px">'+m+'</span>';}).join('')+'</td>'
        +'<td style="font-weight:700;color:var(--red)">'+fs_fmtAmt(due.length*mfee)+'</td>'
        +'<td><button class="btn btn-primary btn-sm" onclick="fs_openCollectStudent(\''+parseInt(s.id,10)+'\')">Collect</button></td>'
        +'</tr>';
    }).join('')+'</tbody></table></div>');
}
// ══════════════════════════════════════════════════════════════
//  FEE CONFIG
// ══════════════════════════════════════════════════════════════
function fs_renderFeeConfig() {
  /* -- Monthly Bundle: Feb 2026 → Jan 2027 -- */
  var BUNDLE_MONTHS = [
    {label:'February 2026', key:'February 2026'},
    {label:'March 2026',    key:'March 2026'},
    {label:'April 2026',    key:'April 2026'},
    {label:'May 2026',      key:'May 2026'},
    {label:'June 2026',     key:'June 2026'},
    {label:'July 2026',     key:'July 2026'},
    {label:'August 2026',   key:'August 2026'},
    {label:'September 2026',key:'September 2026'},
    {label:'October 2026',  key:'October 2026'},
    {label:'November 2026', key:'November 2026'},
    {label:'December 2026', key:'December 2026'},
    {label:'January 2027',  key:'January 2027'}
  ];
  var SUBTYPES = [{id:'boarder',label:'🏠 Boarder'},{id:'dayscholar',label:'🚌 Day Scholar'},{id:'dayboarder',label:'🔄 Day Boarder'}];
  var subtypeKey = window._bundleSubtype || 'boarder';
  var courseId   = window._bundleCourse  || FS_FEE_CONFIG.courses[0].id;
  var selCourse  = FS_FEE_CONFIG.courses.find(function(c){return c.id===courseId;}) || FS_FEE_CONFIG.courses[0];
  var baseFee    = selCourse.monthlyFees[subtypeKey] || 0;
  var setupFee   = parseInt(fs_load('setup_fee')||0) || 0;
  /* Existing fee groups to show created bundles */
  var conf = (typeof loadFeeConf==='function') ? loadFeeConf() : {};
  var existingBundles = (conf.feeGroups||[]).filter(function(g){ return g._bundle; });
  /* Month checkboxes */
  var monthChecks = '<div style="display:flex;flex-wrap:wrap;gap:8px;margin:12px 0">';
  BUNDLE_MONTHS.forEach(function(m){
    var chkId = 'bm-'+m.key.replace(/\s/g,'_');
    var defChecked = true; /* all checked by default */
    monthChecks += '<label style="display:flex;align-items:center;gap:5px;padding:5px 10px;border:1.5px solid var(--border);border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;background:var(--surface)">'
      +'<input type="checkbox" id="'+chkId+'" checked style="accent-color:#1433a8"> '+m.label
    +'</label>';
  });
  monthChecks += '</div>';
  /* Bundle preview total */
  var courseOpts = FS_FEE_CONFIG.courses.map(function(c){
    return '<option value="'+c.id+'"'+(c.id===courseId?' selected':'')+'>'+c.icon+' '+c.name+'</option>';
  }).join('');
  var subtypeOpts = SUBTYPES.map(function(st){
    return '<option value="'+st.id+'"'+(st.id===subtypeKey?' selected':'')+'>'+st.label+'</option>';
  }).join('');
  /* Existing bundle pills */
  var bundlePills = existingBundles.length
    ? existingBundles.map(function(g){
        return '<div style="display:flex;align-items:center;justify-content:space-between;padding:9px 14px;background:var(--surface2);border-radius:9px;margin-bottom:6px">'
          +'<div><span style="font-weight:700;font-size:13px">'+esc(g.name)+'</span>'
          +'<span style="font-size:11px;color:var(--muted);margin-left:10px">'+esc(g.description||'')+'</span></div>'
          +'<div style="display:flex;align-items:center;gap:10px">'
          +'<span style="font-family:\'JetBrains Mono\',monospace;font-weight:800;color:#1433a8">₹'+Number(g.amount).toLocaleString('en-IN')+'</span>'
          +'<button onclick="fs_deleteBundle(\''+g.id+'\')" style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;border-radius:6px;padding:3px 9px;cursor:pointer;font-size:11px;font-weight:700">✕ Remove</button>'
          +'</div></div>';
      }).join('')
    : '<div style="color:var(--muted);font-size:13px;padding:8px">No bundles created yet. Use the form above to generate them.</div>';
  return '<div class="page-header"><div><div class="page-title">⚙️ Fee Configuration</div>'
    +'<div class="page-sub">Course fees · Monthly bundles · Setup fee · Items list</div></div></div>'
    /* ── Monthly Fee Bundle Generator ── */
    +'<div class="card" style="margin-bottom:18px"><div class="card-head">'
      +'<div><span class="card-title">📦 Monthly Fee Bundle Generator</span>'
        +'<div style="font-size:12px;color:var(--muted);margin-top:2px">Create pre-packaged monthly bundles (Feb 2026 – Jan 2027) per course &amp; sub-type. Bundles appear as one-click Fee Groups at the counter.</div>'
      +'</div></div><div class="card-body">'
      +'<div class="form-grid" style="gap:14px;margin-bottom:14px">'
        +'<div class="form-group"><label>Course</label><select class="form-control" id="bundle-course" onchange="window._bundleCourse=this.value;fs_render()">'+courseOpts+'</select></div>'
        +'<div class="form-group"><label>Sub-type</label><select class="form-control" id="bundle-subtype" onchange="window._bundleSubtype=this.value;fs_render()">'+subtypeOpts+'</select></div>'
        +'<div class="form-group"><label>Monthly Fee (₹) <span style="color:var(--muted);font-size:11px">auto-filled from config</span></label>'
          +'<input class="form-control" type="number" id="bundle-fee" value="'+baseFee+'" min="0" style="font-family:\'JetBrains Mono\',monospace;font-weight:700"/></div>'
        +'<div class="form-group"><label>Bundle Name</label>'
          +'<input class="form-control" id="bundle-name" value="'+selCourse.name+' '+SUBTYPES.find(function(s){return s.id===subtypeKey;}).label.replace(/[^ ]+ /,'')+' (Feb 2026 – Jan 2027)" placeholder="Bundle label"/></div>'
      +'</div>'
      +'<div style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Select Months to Include</div>'
      +monthChecks
      +'<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:10px">'
        +'<button class="btn btn-primary" onclick="fs_generateBundle()">⚡ Generate &amp; Add Bundle</button>'
        +'<button class="btn" onclick="fs_selectAllBundleMonths(true)" style="font-size:12px">☑ All</button>'
        +'<button class="btn" onclick="fs_selectAllBundleMonths(false)" style="font-size:12px">☐ None</button>'
        +'<span style="font-size:12px;color:var(--muted)" id="bundle-preview-total"></span>'
      +'</div>'
    +'</div></div>'
    /* ── Created Bundles list ── */
    +(existingBundles.length ? '<div class="card" style="margin-bottom:18px"><div class="card-head"><span class="card-title">🏷️ Created Monthly Bundles</span>'
      +'<span style="font-size:12px;color:var(--muted)">'+existingBundles.length+' bundle(s)</span></div>'
      +'<div class="card-body">'+bundlePills+'</div></div>' : '')
    /* ── Setup Fee ── */
    +'<div class="card" style="margin-bottom:18px"><div class="card-head">'
      +'<div><span class="card-title">🔧 Setup / Registration Fee</span>'
        +'<div style="font-size:12px;color:var(--muted);margin-top:2px">One-time setup fee charged separately from admission and monthly fees. Appears as a dedicated option at the counter.</div>'
      +'</div></div><div class="card-body">'
      +'<div class="form-grid" style="gap:14px">'
        +'<div class="form-group"><label>Setup Fee Amount (₹)</label>'
          +'<input class="form-control" type="number" id="cfg-setup-fee" value="'+setupFee+'" min="0" placeholder="0 = not charged" style="font-family:\'JetBrains Mono\',monospace;font-weight:700;font-size:16px"/></div>'
        +'<div class="form-group"><label>Setup Fee Label</label>'
          +'<input class="form-control" id="cfg-setup-label" value="'+(fs_load('setup_fee_label')||'Setup / Registration Fee')+'" placeholder="e.g. Registration Fee"/></div>'
        +'<div class="form-group"><label>Applicable To</label>'
          +'<input class="form-control" id="cfg-setup-note" value="'+(fs_load('setup_fee_note')||'New admissions only')+'" placeholder="e.g. New admissions only"/></div>'
      +'</div>'
      +'<div class="btn-row" style="margin-top:14px"><button class="btn btn-primary" onclick="fs_saveSetupFee()">💾 Save Setup Fee</button></div>'
      +'<div id="setup-fee-preview" style="margin-top:12px;padding:12px;background:#f0f5ff;border-radius:9px;font-size:13px;color:#1433a8;font-weight:600;display:'+(setupFee>0?'block':'none')+'">✓ Setup fee of ₹'+setupFee.toLocaleString('en-IN')+' is active — visible in counter under <b>Fee Group</b> panel</div>'
    +'</div></div>'
    /* ── Course Monthly Fees ── */
    +'<div class="card" style="margin-bottom:18px"><div class="card-head"><span class="card-title">📋 Course Monthly Fees</span>'
      +'<span style="font-size:12px;color:var(--muted)">Base rates used by bundle generator &amp; counter</span>'
    +'</div><div class="card-body">'
    +'<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse"><thead><tr style="background:var(--surface2);font-size:11.5px;color:var(--muted);text-transform:uppercase">'
      +'<th style="padding:9px 12px;text-align:left">Course</th>'
      +'<th style="padding:9px 12px;text-align:left">Adm. Fee (₹)</th>'
      +'<th style="padding:9px 12px;text-align:left">🏠 Boarder/mo</th>'
      +'<th style="padding:9px 12px;text-align:left">🚌 Day Scholar/mo</th>'
      +'<th style="padding:9px 12px;text-align:left">🔄 Day Boarder/mo</th>'
    +'</tr></thead><tbody>'
    +FS_FEE_CONFIG.courses.map(function(c,i){
      return '<tr style="border-bottom:1px solid var(--border-soft)">'
        +'<td style="padding:10px 12px"><b>'+c.icon+' '+c.name+'</b></td>'
        +'<td style="padding:10px 12px"><input class="form-control" style="width:100px;font-family:\'JetBrains Mono\',monospace" type="number" id="cfg-adm-'+i+'" value="'+c.admFee+'"/></td>'
        +'<td style="padding:10px 12px"><input class="form-control" style="width:100px;font-family:\'JetBrains Mono\',monospace" type="number" id="cfg-b-'+i+'" value="'+c.monthlyFees.boarder+'"/></td>'
        +'<td style="padding:10px 12px"><input class="form-control" style="width:100px;font-family:\'JetBrains Mono\',monospace" type="number" id="cfg-ds-'+i+'" value="'+c.monthlyFees.dayscholar+'"/></td>'
        +'<td style="padding:10px 12px"><input class="form-control" style="width:100px;font-family:\'JetBrains Mono\',monospace" type="number" id="cfg-db-'+i+'" value="'+c.monthlyFees.dayboarder+'"/></td>'
        +'</tr>';
    }).join('')
    +'</tbody></table></div>'
    +'<div class="btn-row"><button class="btn btn-primary" onclick="fs_saveFeeConfig()">💾 Save Fee Config</button></div>'
    +'</div></div>'
    /* ── Items List ── */
    +'<div class="card"><div class="card-head"><span class="card-title">📦 Items List</span>'
      +'<button class="btn btn-sm btn-primary" onclick="fs_addItemRow()">+ Add Item</button>'
    +'</div><div class="card-body">'
    +'<table><thead><tr><th>Item Name</th><th>Price (₹)</th><th></th></tr></thead><tbody id="items-tbody">'
    +FS_FEE_CONFIG.itemsList.map(function(it,i){
      return '<tr id="item-row-'+i+'"><td><input class="form-control" id="it-name-'+i+'" value="'+esc(it.name)+'" style="width:200px"/></td>'
        +'<td><input class="form-control" type="number" id="it-price-'+i+'" value="'+it.price+'" style="width:100px"/></td>'
        +'<td><button class="btn btn-sm btn-danger" onclick="fs_removeItem('+i+')">✕</button></td></tr>';
    }).join('')
    +'</tbody></table>'
    +'<div class="btn-row"><button class="btn btn-primary" onclick="fs_saveItems()">💾 Save Items</button></div>'
    +'</div></div>';
}
/* ── Bundle helper functions ── */
function fs_selectAllBundleMonths(sel) {
  var keys = ['February_2026','March_2026','April_2026','May_2026','June_2026','July_2026','August_2026','September_2026','October_2026','November_2026','December_2026','January_2027'];
  keys.forEach(function(k){ var el=document.getElementById('bm-'+k); if(el) el.checked=sel; });
}
function fs_generateBundle() {
  var courseId = (document.getElementById('bundle-course')||{}).value || FS_FEE_CONFIG.courses[0].id;
  var subtype  = (document.getElementById('bundle-subtype')||{}).value || 'boarder';
  var fee      = parseInt((document.getElementById('bundle-fee')||{}).value||0);
  var name     = ((document.getElementById('bundle-name')||{}).value||'').trim();
  if (!fee)  { fs_showToast('Enter a monthly fee amount', false); return; }
  if (!name) { fs_showToast('Enter a bundle name', false); return; }
  var MONTH_KEYS = ['February_2026','March_2026','April_2026','May_2026','June_2026','July_2026','August_2026','September_2026','October_2026','November_2026','December_2026','January_2027'];
  var MONTH_LABELS = ['February 2026','March 2026','April 2026','May 2026','June 2026','July 2026','August 2026','September 2026','October 2026','November 2026','December 2026','January 2027'];
  var selMonths = [];
  MONTH_KEYS.forEach(function(k,i){ var el=document.getElementById('bm-'+k); if(el&&el.checked) selMonths.push(MONTH_LABELS[i]); });
  if (!selMonths.length) { fs_showToast('Select at least one month', false); return; }
  var total = selMonths.length * fee;
  var course = FS_FEE_CONFIG.courses.find(function(c){return c.id===courseId;});
  var desc = (course?course.name:courseId)+' · '+(subtype==='boarder'?'Boarder':subtype==='dayscholar'?'Day Scholar':'Day Boarder')+' · '+selMonths.length+' months @ ₹'+fee.toLocaleString('en-IN')+'/mo';
  /* Push into loadFeeConf feeGroups */
  var conf = (typeof loadFeeConf==='function') ? loadFeeConf() : {};
  if (!conf.feeGroups) conf.feeGroups = [];
  var id = 'bundle_'+courseId+'_'+subtype+'_'+Date.now();
  conf.feeGroups.push({
    id: id, name: name, amount: total, description: desc,
    _bundle: true, _courseId: courseId, _subtype: subtype,
    _months: selMonths, _monthlyRate: fee, _period: 'Feb 2026 - Jan 2027'
  });
  if (typeof saveFeeConf === 'function') saveFeeConf(conf);
  fs_showToast('Bundle "'+name+'" created — ₹'+total.toLocaleString('en-IN')+' for '+selMonths.length+' months');
  if (typeof fs_render === 'function') fs_render();
}
function fs_deleteBundle(id) {
  if (!confirm('Remove this bundle fee group?')) return;
  var conf = (typeof loadFeeConf==='function') ? loadFeeConf() : {};
  conf.feeGroups = (conf.feeGroups||[]).filter(function(g){ return g.id !== id; });
  if (typeof saveFeeConf === 'function') saveFeeConf(conf);
  fs_showToast('Bundle removed');
  if (typeof fs_render === 'function') fs_render();
}
function fs_saveSetupFee() {
  var amt   = parseInt((document.getElementById('cfg-setup-fee')||{}).value||0);
  var label = ((document.getElementById('cfg-setup-label')||{}).value||'Setup / Registration Fee').trim();
  var note  = ((document.getElementById('cfg-setup-note')||{}).value||'').trim();
  fs_save('setup_fee', amt);
  fs_save('setup_fee_label', label);
  fs_save('setup_fee_note', note);
  /* Upsert setup fee as a special fee group so it appears in counter */
  var conf = (typeof loadFeeConf==='function') ? loadFeeConf() : {};
  conf.feeGroups = (conf.feeGroups||[]).filter(function(g){ return g.id !== '__setup_fee__'; });
  if (amt > 0) {
    conf.feeGroups.unshift({ id:'__setup_fee__', name: label, amount: amt, description: note||'One-time setup/registration fee', _setup: true });
  }
  if (typeof saveFeeConf === 'function') saveFeeConf(conf);
  fs_showToast(amt > 0 ? 'Setup fee ₹'+amt.toLocaleString('en-IN')+' saved' : 'Setup fee cleared');
  if (typeof fs_render === 'function') fs_render();
}
function fs_saveFeeConfig() {
  /* -- Read every input safely -- null-guard in case DOM is stale -- */
  var allFound = true;
  FS_FEE_CONFIG.courses.forEach(function(c, i) {
    var elAdm = document.getElementById('cfg-adm-' + i);
    var elB   = document.getElementById('cfg-b-'   + i);
    var elDs  = document.getElementById('cfg-ds-'  + i);
    var elDb  = document.getElementById('cfg-db-'  + i);
    if (!elAdm || !elB || !elDs || !elDb) { allFound = false; return; }
    var adm = parseInt(elAdm.value, 10);
    var b   = parseInt(elB.value,   10);
    var ds  = parseInt(elDs.value,  10);
    var db  = parseInt(elDb.value,  10);
    if (!isNaN(adm) && adm >= 0) c.admFee                    = adm;
    if (!isNaN(b)   && b   >= 0) c.monthlyFees.boarder       = b;
    if (!isNaN(ds)  && ds  >= 0) c.monthlyFees.dayscholar    = ds;
    if (!isNaN(db)  && db  >= 0) c.monthlyFees.dayboarder    = db;
  });
  if (!allFound) {
    fs_showToast('⚠️ Could not read all fields -- please try again', false);
    return;
  }
  /* -- Persist to FS private localStorage key (fee system embed reads this) -- */
  fs_save('config', FS_FEE_CONFIG);
  /* -- SYNC to main portal fee config so both systems stay in sync -- */
  try {
    if (typeof loadFeeConf === 'function' && typeof saveFeeConf === 'function') {
      var _mainConf = loadFeeConf();
      /* Map FS_FEE_CONFIG course rates into the main portal's monthlyFees array */
      FS_FEE_CONFIG.courses.forEach(function(c) {
        /* Update matching monthly fee entry by course name */
        var _entries = _mainConf.monthlyFees || [];
        _entries.forEach(function(mf) {
          var _cn = (mf.course || '').toLowerCase();
          if (_cn.indexOf(c.id.toLowerCase()) !== -1) {
            if (c.monthlyFees && c.monthlyFees.boarder)    mf.amount       = c.monthlyFees.boarder;
            if (c.monthlyFees && c.monthlyFees.boarder)    mf.hostelAmount = c.monthlyFees.boarder;
          }
        });
        /* Update admission fee entries */
        var _admEntries = _mainConf.admissionFees || [];
        _admEntries.forEach(function(af) {
          if ((af.course || '').toLowerCase().indexOf(c.id.toLowerCase()) !== -1) {
            if (c.admFee) af.amount = c.admFee;
          }
        });
      });
      /* Push updated config through saveFeeConf (Supabase + localStorage + KV sync) */
      saveFeeConf(_mainConf);
      /* Bust cache so loadFeeConf picks up new values immediately */
      if (typeof _cache !== 'undefined') _cache.feeConf = _mainConf;
    }
  } catch(e) { (void 0); }
  /* -- Re-render so the saved values are reflected in the UI -- */
  if (typeof fs_navTo === 'function') {
    fs_navTo('fee-config');   /* refresh in-place (PFS embed) */
  } else if (typeof fs_render === 'function') {
    fs_render();              /* fallback: old render path */
  }
  /* -- Toast confirmation -- */
  fs_showToast('✅ Fee config saved & synced to cloud!');
}
function fs_saveItems() {
  var newList = [];
  var rows = document.querySelectorAll('[id^="it-name-"]');
  rows.forEach(function(el, i){
    var name = el.value.trim();
    var price = parseInt((document.getElementById('it-price-'+i)||{}).value||0);
    if (name) newList.push({ id: FS_FEE_CONFIG.itemsList[i] ? FS_FEE_CONFIG.itemsList[i].id : fs_uid(), name: name, price: price });
  });
  FS_FEE_CONFIG.itemsList = newList;
  fs_save('config', FS_FEE_CONFIG);
  fs_showToast('✅ Items list saved!');
  if (typeof fs_navTo === 'function') { fs_navTo('fee-config'); } else if (typeof fs_render === 'function') { fs_render(); }
}
function fs_removeItem(i) {
  FS_FEE_CONFIG.itemsList.splice(i,1);
  fs_save('config', FS_FEE_CONFIG);
  if (typeof fs_navTo === 'function') { fs_navTo('fee-config'); } else if (typeof fs_render === 'function') { fs_render(); }
}
function fs_addItemRow() {
  FS_FEE_CONFIG.itemsList.push({ id: fs_uid(), name: 'New Item', price: 0 });
  fs_save('config', FS_FEE_CONFIG);
  fs_render();
}
// ══════════════════════════════════════════════════════════════
//  FS_ADVANCE FEE MODULE
// ══════════════════════════════════════════════════════════════
var fs_advSearch = '';
var fs_advStuId = null;
function fs_renderAdvancePage() {
  var search = fs_advSearch;
  // Build summary per student
  var stuWithAdv = FS_STUDENTS.filter(function(s){
    var bal = fs_getAdvanceBalance(s.id);
    return bal > 0 || FS_ADVANCE.some(function(a){ return a.studentId===s.id; });
  });
  var allBal = FS_ADVANCE.filter(function(a){return a.type==='credit';}).reduce(function(t,a){return t+a.amount;},0)
             - FS_ADVANCE.filter(function(a){return a.type==='debit'; }).reduce(function(t,a){return t+a.amount;},0);
  var filtered = FS_STUDENTS.filter(function(s){
    if (!search) return true;
    return s.name.toLowerCase().includes(search.toLowerCase()) || (s.regno||'').toLowerCase().includes(search.toLowerCase());
  });
  return '<div class="page-header"><div><div class="page-title">⏫ Advance Fees</div>'
    +'<div class="page-sub">Collect advance payments from students; apply automatically against monthly fees</div></div>'
    +'<button class="btn btn-primary" onclick="fs_openAdvanceCollect(null)">⏫ Collect Advance</button></div>'
    +'<div class="stats-row" style="grid-template-columns:repeat(3,1fr);margin-bottom:24px">'
    +'<div class="stat-card" style="border-left:4px solid #7c3aed"><div class="stat-label">Total Advance Held</div>'
    +'<div class="stat-val" style="color:#7c3aed">'+fs_fmtAmt(allBal)+'</div><div class="stat-sub">Remaining advance balance</div></div>'
    +'<div class="stat-card blue"><div class="stat-label">Total Collected</div>'
    +'<div class="stat-val">'+fs_fmtAmt(FS_ADVANCE.filter(function(a){return a.type==='credit';}).reduce(function(t,a){return t+a.amount;},0))+'</div>'
    +'<div class="stat-sub">Advance received from students</div></div>'
    +'<div class="stat-card green"><div class="stat-label">Students with Advance</div>'
    +'<div class="stat-val">'+stuWithAdv.length+'</div><div class="stat-sub">Have advance balance or history</div></div>'
    +'</div>'
    +'<div class="search-bar"><input class="search-input" placeholder="🔍 Search students..." value="'+esc(search)+'" oninput="fs_advSearch=this.value;_debouncedFsRender()"/></div>'
    +'<div class="card"><table><thead><tr><th>Student</th><th>Course</th><th>Sub-type</th><th>Advance Balance</th><th>Total Collected</th><th>Actions</th></tr></thead><tbody>'
    +filtered.map(function(s){
      var course = FS_FEE_CONFIG.courses.find(function(c){return c.id===s.courseId;});
      var bal = fs_getAdvanceBalance(s.id);
      var total = FS_ADVANCE.filter(function(a){return a.studentId===s.id&&a.type==='credit';}).reduce(function(t,a){return t+a.amount;},0);
      return '<tr>'
        +'<td><div style="font-weight:600">'+esc(s.name)+'</div><div style="font-size:11.5px;color:var(--muted)">'+esc(s.regno||'')+'</div></td>'
        +'<td>'+(course?'<span class="badge badge-blue">'+course.icon+' '+course.name+'</span>':'--')+'</td>'
        +'<td>'+(s.subtype?'<span class="badge badge-purple">'+s.subtype+'</span>':'--')+'</td>'
        +'<td><span style="font-weight:700;color:'+(bal>0?'#7c3aed':'var(--muted)')+'">'+fs_fmtAmt(bal)+'</span></td>'
        +'<td style="color:var(--muted);font-size:12.5px">'+fs_fmtAmt(total)+'</td>'
        +'<td style="display:flex;gap:6px;flex-wrap:wrap">'
        +'<button class="btn btn-sm" style="background:#7c3aed;color:#fff;border-color:#7c3aed" onclick="fs_openAdvanceCollect(\''+parseInt(s.id,10)+'\')">⏫ Add</button>'
        +(FS_ADVANCE.some(function(a){return a.studentId===s.id;})?'<button class="btn btn-sm" onclick="fs_openAdvanceLedger(\''+parseInt(s.id,10)+'\')">📋 Ledger</button>':'')
        +'</td>'
        +'</tr>';
    }).join('')
    +'</tbody></table></div>';
}
// -- COLLECT FS_ADVANCE --
var fs_advColStuId = null;
function fs_openAdvanceCollect(stuId) {
  fs_advColStuId = stuId;
  fs_activePage = 'advance-student';
  document.querySelectorAll('.sidebar-item').forEach(function(el){
    el.classList.toggle('active', el.getAttribute('onclick')&&el.getAttribute('onclick').includes("'advance'"));
  });
  fs_render();
}
function fs_openAdvanceLedger(stuId) {
  fs_advColStuId = stuId;
  window.fs_advShowLedger = true;
  fs_activePage = 'advance-student';
  document.querySelectorAll('.sidebar-item').forEach(function(el){
    el.classList.toggle('active', el.getAttribute('onclick')&&el.getAttribute('onclick').includes("'advance'"));
  });
  fs_render();
}
function fs_renderAdvanceStudent() {
  var showLedger = window.fs_advShowLedger;
  // Student selector
  var stuSel = '<div class="form-group" style="margin-bottom:16px"><label style="font-size:13px;font-weight:600;color:var(--text2)">Select Student</label>'
    +'<select class="form-control" id="adv-stu-sel" onchange="fs_advColStuId=this.value;window.fs_advShowLedger=false;fs_render()">'
    +'<option value="">-- Choose student --</option>'
    +FS_STUDENTS.map(function(s){ return '<option value="'+parseInt(s.id,10)+'"'+(fs_advColStuId===s.id?' selected':'')+'>'+esc(s.name)+' ('+esc(s.regno||'--')+')</option>'; }).join('')
    +'</select></div>';
  var stu = fs_advColStuId ? FS_STUDENTS.find(function(s){return s.id===fs_advColStuId;}) : null;
  var course = stu ? FS_FEE_CONFIG.courses.find(function(c){return c.id===stu.courseId;}) : null;
  var bal = stu ? fs_getAdvanceBalance(stu.id) : 0;
  var recs = stu ? fs_getAdvanceRecords(stu.id) : [];
  var profileHtml = stu
    ? '<div class="stu-profile" style="margin-bottom:20px"><div class="stu-avatar">'+fs_initials(stu.name)+'</div>'
      +'<div><div class="stu-name">'+esc(stu.name)+'</div><div class="stu-meta">'+esc(stu.father||'')+(stu.mobile?' · '+stu.mobile:'')+' · '+esc(stu.regno||'')+'</div></div>'
      +'<div class="stu-badges">'
      +(course?'<span class="badge badge-blue">'+course.icon+' '+course.name+'</span>':'')
      +(stu.subtype?'<span class="badge badge-purple">'+stu.subtype+'</span>':'')
      +'<span class="badge" style="background:#f5f3ff;color:#6d28d9;border-color:#c4b5fd;font-size:13px;padding:4px 14px">⏫ Balance: '+fs_fmtAmt(bal)+'</span>'
      +'</div></div>'
    : '';
  var collectForm = !showLedger
    ? '<div class="card"><div class="card-head"><span class="card-title">⏫ Collect Advance Payment</span></div><div class="card-body">'
      +'<div class="form-grid">'
      +'<div class="form-group"><label>Amount (₹) <span class="req">*</span></label><input class="form-control" type="number" id="adv-amount" placeholder="Enter advance amount" min="1"/></div>'
      +'<div class="form-group"><label>Payment Mode</label><select class="form-control" id="adv-mode"><option>Cash</option><option>UPI</option><option>Bank Transfer</option><option>Cheque</option></select></div>'
      +'<div class="form-group"><label>Date</label><input class="form-control" type="date" id="adv-date" value="'+fs_today()+'"/></div>'
      +'<div class="form-group"><label>Txn Ref</label><input class="form-control" id="adv-ref" placeholder="Optional"/></div>'
      +'<div class="form-group form-full"><label>Remark</label><input class="form-control" id="adv-remark" placeholder="e.g. Advance for session 2026-27"/></div>'
      +'</div>'
      +'<div class="btn-row"><button class="btn" style="background:#7c3aed;color:#fff;border-color:#7c3aed" onclick="fs_saveAdvancePayment()">✅ Save & Print Receipt</button>'
      +'<button class="btn" onclick="fs_saveAdvancePayment(true)">✓ Save Only</button></div>'
      +'</div></div>'
    : '';
  var ledgerHtml = (stu && (showLedger || recs.length > 0))
    ? '<div class="card"><div class="card-head"><span class="card-title">📋 Advance Ledger -- '+esc(stu.name)+'</span>'
      +'<span style="font-size:13px;font-weight:700;color:#7c3aed">Balance: '+fs_fmtAmt(bal)+'</span></div>'
      +(recs.length===0
        ? '<div class="empty-state" style="padding:24px"><div class="empty-icon">📋</div><div class="empty-text">No advance transactions yet</div></div>'
        : '<table><thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Reason / Remark</th><th>Receipt</th><th>Running Bal</th></tr></thead><tbody>'
          +(function(){
            var runBal = 0;
            // Sort ascending for running balance
            var sorted = recs.slice().sort(function(a,b){return a.createdAt.localeCompare(b.createdAt);});
            var rows = sorted.map(function(a){
              runBal += (a.type==='credit' ? a.amount : -a.amount);
              return '<tr>'
                +'<td>'+fs_fmtDate(a.date)+'</td>'
                +'<td>'+(a.type==='credit'
                  ? '<span class="badge badge-green">⬆ Credit</span>'
                  : '<span class="badge badge-gold">⬇ Applied</span>')+'</td>'
                +'<td style="font-weight:700;color:'+(a.type==='credit'?'var(--green)':'#7c3aed')+'">'+fs_fmtAmt(a.amount)+'</td>'
                +'<td style="font-size:12px;color:var(--muted)">'+esc(a.reason||a.remark||'--')+'</td>'
                +'<td style="font-size:11.5px;color:var(--muted)">'+esc(a.receipt||'--')+'</td>'
                +'<td style="font-weight:700;color:'+(runBal>0?'#7c3aed':'var(--red)')+'">'+fs_fmtAmt(runBal)+'</td>'
                +'</tr>';
            });
            // Return in newest-first order
            return rows.reverse().join('');
          })()
          +'</tbody></table>')
      +'</div>'
    : '';
  return '<div class="page-header"><div><div class="page-title">⏫ Advance Fee Collection</div></div>'
    +'<button class="btn" onclick="fs_showPage(\'advance\')">← Back</button></div>'
    + stuSel + profileHtml + collectForm + ledgerHtml;
}
function fs_saveAdvancePayment(saveOnly) {
  if (!fs_advColStuId) { fs_showToast('Please select a student', false); return; }
  var stu = FS_STUDENTS.find(function(s){return s.id===fs_advColStuId;});
  if (!stu) return;
  var amount = parseInt((document.getElementById('adv-amount')||{}).value||0);
  if (!amount || amount <= 0) { fs_showToast('Enter a valid amount', false); return; }
  var mode   = (document.getElementById('adv-mode')||{}).value||'Cash';
  var date   = (document.getElementById('adv-date')||{}).value||fs_today();
  var ref    = (document.getElementById('adv-ref')||{}).value||'';
  var remark = (document.getElementById('adv-remark')||{}).value||'';
  var receipt = fs_nextReceipt('ADV');
  FS_ADVANCE.push({ id:fs_uid(), studentId:stu.id, studentName:stu.name,
    type:'credit', amount:amount, payMode:mode, txnRef:ref,
    remark:remark, reason:'Advance received', receipt:receipt,
    date:date, createdAt:new Date().toISOString() });
  fs_persist();
  fs_updateSidebarCounts();
  fs_showToast('Advance saved -- '+receipt);
  if (!saveOnly) fs_showAdvanceReceipt(stu, {amount:amount,mode:mode,ref:ref,remark:remark,receipt:receipt,date:date});
  window.fs_advShowLedger = false;
  fs_render();
}
function fs_showAdvanceReceipt(stu, rec) {
  var course = FS_FEE_CONFIG.courses.find(function(c){return c.id===stu.courseId;});
  var newBal = fs_getAdvanceBalance(stu.id);
  var html = '<div class="receipt-preview" id="fs-print-area">'
    +'<div class="receipt-header">'
    +'<div style="font-size:20px">🎓</div>'
    +'<div class="receipt-title">'+(window.TENANT?window.TENANT.name:'Guidance Navodaya & Sainik Institute')+'</div>'
    +'<div class="receipt-sub">'+(window.TENANT?window.TENANT.city+', '+window.TENANT.state:'Khangabok, Manipur')+' &nbsp;|&nbsp; Advance Fee Receipt</div>'
    +'</div>'
    +'<div style="display:flex;justify-content:space-between;margin-bottom:12px">'
    +'<span style="font-size:11.5px;color:var(--muted)">Receipt No.</span>'
    +'<span style="font-weight:700;font-size:13px;color:var(--navy)">'+esc(rec.receipt)+'</span>'
    +'</div>'
    +'<div class="receipt-row"><span>Student Name</span><b>'+esc(stu.name)+'</b></div>'
    +'<div class="receipt-row"><span>Father\'s Name</span><span>'+esc(stu.father||'--')+'</span></div>'
    +'<div class="receipt-row"><span>Register No.</span><span>'+esc(stu.regno||'--')+'</span></div>'
    +'<div class="receipt-row"><span>Course</span><span>'+(course?course.name:'--')+' -- '+(stu.subtype||'--')+'</span></div>'
    +'<div class="receipt-row"><span>Date</span><span>'+fs_fmtDate(rec.date)+'</span></div>'
    +'<div class="receipt-row"><span>Payment Mode</span><span>'+esc(rec.mode)+'</span></div>'
    +(rec.ref?'<div class="receipt-row"><span>Txn Ref</span><span>'+esc(rec.ref)+'</span></div>':'')
    +(rec.remark?'<div class="receipt-row"><span>Remark</span><span>'+esc(rec.remark)+'</span></div>':'')
    +'<div class="receipt-total"><span>Advance Received</span><span style="color:#7c3aed">'+fs_fmtAmt(rec.amount)+'</span></div>'
    +'<div style="margin-top:10px;background:#f5f3ff;border-radius:8px;padding:10px 14px;font-size:12.5px;color:#6d28d9;font-weight:600;display:flex;justify-content:space-between">'
    +'<span>Total Advance Balance</span><span>'+fs_fmtAmt(newBal)+'</span>'
    +'</div>'
    +'<div style="margin-top:16px;border-top:1px solid #e2e8f0;padding-top:12px;text-align:center;font-size:11px;color:var(--muted)">Authorised Signatory -- '+(window.TENANT?window.TENANT.shortName+', '+window.TENANT.city:'GNSI, Khangabok')+'</div>'
    +'</div>';
  document.getElementById('fs-receipt-content').innerHTML = html;
  document.getElementById('fs-receipt-modal').classList.add('open');
}
// ══════════════════════════════════════════════════════════════
//  DELETE FEE RECORDS (ADMIN)
// ══════════════════════════════════════════════════════════════
var fs_delTab = 'admission';
var fs_delSearch = '';
var fs_delConfirmId = null;
var fs_delConfirmType = null;
function fs_renderDeleteRecords() {
  var admFiltered = FS_ADMREC.filter(function(r){
    if (!fs_delSearch) return true;
    return (r.studentName||'').toLowerCase().includes(fs_delSearch.toLowerCase())
      || (r.receipt||'').toLowerCase().includes(fs_delSearch.toLowerCase());
  });
  var monFiltered = FS_MONTHLY.filter(function(r){
    if (!fs_delSearch) return true;
    return (r.studentName||'').toLowerCase().includes(fs_delSearch.toLowerCase())
      || (r.receipt||'').toLowerCase().includes(fs_delSearch.toLowerCase());
  });
  var advFiltered = FS_ADVANCE.filter(function(a){
    if (!fs_delSearch) return true;
    return (a.studentName||'').toLowerCase().includes(fs_delSearch.toLowerCase())
      || (a.receipt||'').toLowerCase().includes(fs_delSearch.toLowerCase());
  });
  // Find the record for confirmation dialog across all types
  var confirmRec = null;
  if (fs_delConfirmId) {
    if (fs_delConfirmType === 'adm') confirmRec = FS_ADMREC.find(function(r){return r.id===fs_delConfirmId;});
    else if (fs_delConfirmType === 'mon') confirmRec = FS_MONTHLY.find(function(r){return r.id===fs_delConfirmId;});
    else if (fs_delConfirmType === 'adv') confirmRec = FS_ADVANCE.find(function(a){return a.id===fs_delConfirmId;});
  }
  var confirmHtml = '';
  if (fs_delConfirmId && confirmRec) {
    var confirmAmt = fs_delConfirmType==='adm' ? confirmRec.total : confirmRec.amount;
    confirmHtml = '<div style="position:fixed;inset:0;background:rgba(15,31,61,0.55);z-index:200;display:flex;align-items:center;justify-content:center">'
      +'<div style="background:#fff;border-radius:14px;padding:28px 32px;max-width:420px;width:90%;box-shadow:0 8px 40px rgba(0,0,0,0.22)">'
      +'<div style="font-size:28px;text-align:center;margin-bottom:8px">⚠️</div>'
      +'<div style="font-family:Syne,sans-serif;font-size:16px;font-weight:800;color:#0f1f3d;text-align:center;margin-bottom:6px">Confirm Delete</div>'
      +'<div style="font-size:13px;color:#64748b;text-align:center;margin-bottom:20px">This action cannot be undone. The payment record will be permanently removed.</div>'
      +'<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:13px">'
      +'<b>'+esc(confirmRec.studentName)+'</b>'
      +' &nbsp;·&nbsp; '+esc(confirmRec.receipt||'--')
      +' &nbsp;·&nbsp; '+fs_fmtAmt(confirmAmt)
      +(fs_delConfirmType==='mon' ? '<br><span style="font-size:12px;color:#b91c1c">Months: '+esc(confirmRec.month)+'</span>' : '')
      +(fs_delConfirmType==='adv' ? '<br><span style="font-size:12px;color:#7c3aed">Type: '+esc(confirmRec.type)+' · '+esc(confirmRec.remark||confirmRec.reason||'')+'</span>' : '')
      +'</div>'
      +'<div style="display:flex;gap:10px;justify-content:center">'
      +'<button class="btn btn-danger" onclick="fs_confirmDelete()">🗑️ Yes, Delete</button>'
      +'<button class="btn" onclick="fs_delConfirmId=null;fs_delConfirmType=null;fs_render()">Cancel</button>'
      +'</div>'
      +'</div></div>';
  }
  var tabs = [
    {key:'admission', label:'💳 Admission Fees', count: FS_ADMREC.length},
    {key:'monthly',   label:'📅 Monthly Fees',   count: FS_MONTHLY.length},
    {key:'advance',   label:'⏫ Advance Fees',   count: FS_ADVANCE.length}
  ];
  var tabsHtml = '<div style="display:flex;gap:0;margin-bottom:20px;background:#fff;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;box-shadow:var(--shadow2)">'
    +tabs.map(function(t, i){
      var active = fs_delTab===t.key;
      var border = i < tabs.length-1 ? 'border-right:1px solid var(--border);' : '';
      return '<div style="flex:1;padding:12px 20px;cursor:pointer;font-weight:600;font-size:13px;text-align:center;'+border
        +(active?'background:#e8edf8;color:var(--blue)':'color:var(--muted2)')+'" onclick="fs_delTab=\''+t.key+'\';fs_render()">'+t.label+' ('+t.count+')</div>';
    }).join('')
    +'</div>';
  var tableHtml = '';
  if (fs_delTab==='admission') {
    tableHtml = admFiltered.length===0
      ? '<div class="empty-state"><div class="empty-icon">🧾</div><div class="empty-text">No admission records found</div></div>'
      : '<div class="card"><table><thead><tr><th>Date</th><th>Student</th><th>Adm Fee</th><th>Items</th><th>Total</th><th>Mode</th><th>Receipt</th><th style="text-align:center">Delete</th></tr></thead><tbody>'
        +admFiltered.map(function(r){
          return '<tr>'
            +'<td>'+fs_fmtDate(r.date)+'</td>'
            +'<td><div style="font-weight:600">'+esc(r.studentName)+'</div></td>'
            +'<td>'+fs_fmtAmt(r.admFee)+'</td>'
            +'<td>'+fs_fmtAmt(r.itemsTotal||0)+'</td>'
            +'<td style="font-weight:700;color:var(--green)">'+fs_fmtAmt(r.total)+'</td>'
            +'<td style="font-size:12px">'+esc(r.payMode||'--')+'</td>'
            +'<td style="font-size:11.5px;color:var(--muted)">'+esc(r.receipt)+'</td>'
            +'<td style="text-align:center"><button class="btn btn-danger btn-sm" onclick="fs_askDeleteFee(\''+parseInt(r.id,10)+'\',\'adm\')">🗑️ Delete</button></td>'
            +'</tr>';
        }).join('')+'</tbody></table></div>';
  } else if (fs_delTab==='monthly') {
    tableHtml = monFiltered.length===0
      ? '<div class="empty-state"><div class="empty-icon">📅</div><div class="empty-text">No monthly records found</div></div>'
      : '<div class="card"><table><thead><tr><th>Date</th><th>Student</th><th>Months</th><th>Amount</th><th>Mode</th><th>Receipt</th><th style="text-align:center">Delete</th></tr></thead><tbody>'
        +monFiltered.map(function(r){
          return '<tr>'
            +'<td>'+fs_fmtDate(r.date)+'</td>'
            +'<td style="font-weight:600">'+esc(r.studentName)+'</td>'
            +'<td style="font-size:12px">'+esc(r.month)+'</td>'
            +'<td style="font-weight:700;color:var(--green)">'+fs_fmtAmt(r.amount)+'</td>'
            +'<td style="font-size:12px">'+esc(r.payMode||'--')+'</td>'
            +'<td style="font-size:11.5px;color:var(--muted)">'+esc(r.receipt)+'</td>'
            +'<td style="text-align:center"><button class="btn btn-danger btn-sm" onclick="fs_askDeleteFee(\''+parseInt(r.id,10)+'\',\'mon\')">🗑️ Delete</button></td>'
            +'</tr>';
        }).join('')+'</tbody></table></div>';
  } else {
    tableHtml = advFiltered.length===0
      ? '<div class="empty-state"><div class="empty-icon">⏫</div><div class="empty-text">No advance records found</div></div>'
      : '<div class="card"><table><thead><tr><th>Date</th><th>Student</th><th>Type</th><th>Amount</th><th>Reason / Remark</th><th>Receipt</th><th style="text-align:center">Delete</th></tr></thead><tbody>'
        +advFiltered.map(function(a){
          return '<tr>'
            +'<td>'+fs_fmtDate(a.date)+'</td>'
            +'<td style="font-weight:600">'+esc(a.studentName||a.name||'(Unknown)')+'</td>'
            +'<td>'+(a.type==='credit'?'<span class="badge badge-green">⬆ Credit</span>':'<span class="badge badge-gold">⬇ Applied</span>')+'</td>'
            +'<td style="font-weight:700;color:'+(a.type==='credit'?'var(--green)':'#7c3aed')+'">'+fs_fmtAmt(a.amount)+'</td>'
            +'<td style="font-size:12px;color:var(--muted)">'+esc(a.remark||a.reason||'--')+'</td>'
            +'<td style="font-size:11.5px;color:var(--muted)">'+esc(a.receipt||'--')+'</td>'
            +'<td style="text-align:center"><button class="btn btn-danger btn-sm" onclick="fs_askDeleteFee(\''+parseInt(a.id,10)+'\',\'adv\')">🗑️ Delete</button></td>'
            +'</tr>';
        }).join('')+'</tbody></table></div>';
  }
  return confirmHtml
    +'<div class="page-header"><div><div class="page-title">🗑️ Delete Fee Records</div>'
    +'<div class="page-sub">Admin use only -- permanently remove erroneous fee entries</div></div></div>'
    + tabsHtml
    +'<div class="search-bar"><input class="search-input" placeholder="🔍 Search by student name or receipt no..." value="'+esc(fs_delSearch)+'" oninput="fs_delSearch=this.value;_debouncedFsRender()"/></div>'
    + tableHtml;
}
function fs_askDeleteFee(id, type) {
  fs_delConfirmId = id;
  fs_delConfirmType = type;
  fs_render();
}
function fs_confirmDelete() {
  if (!fs_delConfirmId) return;
  if (fs_delConfirmType === 'adm') {
    FS_ADMREC = FS_ADMREC.filter(function(r){ return r.id !== fs_delConfirmId; });
  } else if (fs_delConfirmType === 'mon') {
    var rec = FS_MONTHLY.find(function(r){ return r.id === fs_delConfirmId; });
    if (rec) {
      // Restore paidMonths on student
      var stu = FS_STUDENTS.find(function(s){ return s.id === rec.studentId; });
      if (stu && stu.paidMonths) {
        var months = Array.isArray(rec.months) ? rec.months : (rec.month ? rec.month.split(', ') : []);
        months.forEach(function(m){
          var idx = stu.paidMonths.indexOf(m.trim());
          if (idx >= 0) stu.paidMonths.splice(idx, 1);
        });
      }
      // If this record used advance, restore the advance debit entry too
      if (rec.advanceUsed) {
        // Find the matching debit advance entry by receipt
        FS_ADVANCE = FS_ADVANCE.filter(function(a){ return !(a.type==='debit' && a.receipt===rec.receipt && a.studentId===rec.studentId); });
      }
      FS_MONTHLY = FS_MONTHLY.filter(function(r){ return r.id !== fs_delConfirmId; });
    }
  } else if (fs_delConfirmType === 'adv') {
    FS_ADVANCE = FS_ADVANCE.filter(function(a){ return a.id !== fs_delConfirmId; });
  }
  fs_delConfirmId = null;
  fs_delConfirmType = null;
  fs_persist();
  gnsiMarkLocalSave(20000); // 20s guard -- prevents KV poll from restoring deleted fee record
  fs_updateSidebarCounts();
  fs_showToast('Record deleted successfully');
  fs_render();
}
// ══════════════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════════════
// -- Admissions tab state --------------------------------------
var admTabActive = 'applications';  // 'applications' | 'feesystem'
// -- fs_sidebarItem: builds one sidebar nav item -------------
function fs_sidebarItem(page, icon, label, badgeId) {
  var active = (fs_activePage === page) ||
               (page === 'advance' && fs_activePage === 'advance-student');
  var col    = active ? '#1433a8' : '#334155';
  var bg     = active ? '#e8edf8' : 'transparent';
  var border = active ? '#1433a8' : 'transparent';
  var badge  = badgeId
    ? '<span id="' + badgeId + '" style="margin-left:auto;background:' +
      (badgeId === 'fs-sb-due-count' ? '#dc2626' : badgeId === 'fs-sb-adv-bal' ? '#d97706' : '#1433a8') +
      ';color:#fff;font-size:9.5px;font-weight:700;padding:1px 6px;border-radius:9px;min-width:18px;text-align:center">0</span>'
    : '';
  var base = 'display:flex;align-items:center;gap:10px;padding:8px 14px;cursor:pointer;font-size:13px;font-weight:500;';
  return '<div onclick="fs_navTo(\'' + page + '\')" style="' + base +
    'color:' + col + ';border-left:3px solid ' + border + ';background:' + bg + '">' +
    '<span>' + icon + '</span> ' + label + badge + '</div>';
}
function fs_sidebarSection(label) {
  return '<div style="padding:6px 14px 2px;font-size:9.5px;font-weight:700;letter-spacing:.08em;' +
         'text-transform:uppercase;color:#94a3b8;margin-top:6px">' + label + '</div>';
}
// -- renderFeeSystemEmbed: builds the fee system UI ------------
