/* GNSI PORTAL — modules/hostel.js
   Pages: boarder, kitchen, hostel, house, housemaster, discipline, sickbay, nightduty
   DEPENDS ON: core/utils.js, core/state.js */

function renderBoarder(){
  var isAdmin=currentUser&&currentUser.role==='admin';
  var _bt=boarderTab||'schedule';
  var tabBar='<div class="gnsi-brd-tabbar" style="display:flex;gap:0;border-bottom:2px solid var(--border);margin-bottom:20px">'
    +'<button onclick="boarderTab=\'schedule\';render()" style="flex:1;padding:9px 22px;border:none;border-bottom:'+(_bt==='schedule'?'3px solid var(--accent)':'3px solid transparent')+';background:none;cursor:pointer;font-size:13px;font-weight:'+(_bt==='schedule'?700:500)+';color:'+(_bt==='schedule'?'var(--accent)':'var(--muted)')+';font-family:\'DM Sans\',sans-serif;margin-bottom:-2px;transition:color .15s;text-align:center">&#128203; Daily Schedule</button>'
    +'<button onclick="boarderTab=\'arrangement\';render()" style="flex:1;padding:9px 22px;border:none;border-bottom:'+(_bt==='arrangement'?'3px solid var(--accent)':'3px solid transparent')+';background:none;cursor:pointer;font-size:13px;font-weight:'+(_bt==='arrangement'?700:500)+';color:'+(_bt==='arrangement'?'var(--accent)':'var(--muted)')+';font-family:\'DM Sans\',sans-serif;margin-bottom:-2px;transition:color .15s;text-align:center">&#128101; Staff Arrangement</button>'
    +'</div>';
  if(_bt==='arrangement'){return tabBar+renderStaffArrangement(isAdmin);}
  var _bst=boarderScheduleType||'weekday';
  var subTabBar='<div style="display:flex;gap:0;border-bottom:2px solid var(--border);margin-bottom:18px">'
    +'<button onclick="boarderScheduleType=\'weekday\';boarderEditRow=null;boarderAddForm=false;render()" style="flex:1;padding:8px 18px;border:none;border-bottom:'+(_bst==='weekday'?'3px solid var(--accent)':'3px solid transparent')+';background:none;cursor:pointer;font-size:12.5px;font-weight:'+(_bst==='weekday'?700:500)+';color:'+(_bst==='weekday'?'var(--accent)':'var(--muted)')+';font-family:\'DM Sans\',sans-serif;margin-bottom:-2px;transition:color .15s">📅 Mon–Sat Schedule</button>'
    +'<button onclick="boarderScheduleType=\'sunday\';boarderEditRow=null;boarderAddForm=false;render()" style="flex:1;padding:8px 18px;border:none;border-bottom:'+(_bst==='sunday'?'3px solid var(--accent)':'3px solid transparent')+';background:none;cursor:pointer;font-size:12.5px;font-weight:'+(_bst==='sunday'?700:500)+';color:'+(_bst==='sunday'?'var(--accent)':'var(--muted)')+';font-family:\'DM Sans\',sans-serif;margin-bottom:-2px;transition:color .15s">🌿 Sunday / Holiday</button>'
    +'</div>';
  var schedule=(_bst==='sunday')?loadBoarderScheduleSunday():loadBoarderSchedule();
  var _schedTitle=(_bst==='sunday')?'Sunday &amp; Holiday Schedule':'Monday to Saturday Schedule';
  var _schedValid=(_bst==='sunday')?'Sundays &amp; declared holidays &nbsp;&middot;&nbsp; 2026&ndash;27':'Monday to Saturday &nbsp;&middot;&nbsp; 2026&ndash;27';
  var activityIcon=function(a){
    if(a.includes('PT'))return'&#127939;';
    if(a.includes('Doubt'))return'&#128218;';
    if(a.includes('Lunch')||a.includes('Dinner'))return'&#127374;';
    if(a.includes('Academic'))return'&#127979;';
    if(a.includes('Tea'))return'&#9749;';
    if(a.includes('Recreation'))return'&#9917;';
    if(a.includes('Wake')||a.includes('Bell'))return'&#128276;';
    if(a.includes('Assemble')||a.includes('Roll'))return'&#127937;';
    if(a.includes('Lights'))return'&#128161;';
    if(a.includes('Assignment'))return'&#128221;';
    return'&#8226;';
  };
  var highlight=function(a){
    return a.includes('Doubt')||a.includes('Academic')||a.includes('Lunch')||a.includes('Dinner')||a.includes('Tea')||a.includes('Recreation');
  };
  // -- Checklist helpers (date-keyed, auto-resets next day) --
  function todayStr(){var d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1<10?'0':'')+(d.getMonth()+1)+'-'+(d.getDate()<10?'0':'')+d.getDate();}
  function loadSchedCheck(){var k='gnsi_sched_check_'+todayStr();try{return JSON.parse(localStorage.getItem(k)||'{}');}catch(e){return{};}}
  function saveSchedCheck(obj){localStorage.setItem('gnsi_sched_check_'+todayStr(),JSON.stringify(obj));}
  var schedCheck=loadSchedCheck();
  var doneCount=Object.keys(schedCheck).filter(function(k){return schedCheck[k];}).length;
  var totalCount=schedule.length;
  var pct=totalCount?Math.round(doneCount/totalCount*100):0;
  var progressBar='<div style="background:var(--surface2);border:1.5px solid var(--border-soft);border-radius:10px;padding:14px 18px;margin-bottom:14px">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">'
    +'<span style="font-size:12.5px;font-weight:700;color:var(--text)">📋 Today\'s Schedule Progress</span>'
    +'<span style="font-size:12px;font-family:\'JetBrains Mono\',monospace;color:'+(pct===100?'#16a34a':pct>50?'#c9870a':'var(--muted)')+'">'+doneCount+' / '+totalCount+' done &nbsp;·&nbsp; '+pct+'%</span>'
    +'</div>'
    +'<div style="height:8px;background:var(--border);border-radius:20px;overflow:hidden">'
    +'<div style="height:100%;width:'+pct+'%;background:'+(pct===100?'#16a34a':pct>50?'#c9870a':'var(--accent)')+';border-radius:20px;transition:width .4s ease"></div>'
    +'</div>'
    +(pct===100?'<div style="font-size:12px;color:#16a34a;font-weight:700;margin-top:6px">🎉 All activities completed for today!</div>':'')
    +'</div>';
  var rows=schedule.map(function(s){
    // Admin inline edit row
    if(isAdmin && boarderEditRow===s.no){
      return '<tr style="background:var(--accent-light)">'
        +'<td style="text-align:center;font-family:\'JetBrains Mono\',monospace;font-size:11px;color:var(--muted)">'+s.no+'</td>'
        +'<td><input id="be-from-'+s.no+'" value="'+esc(s.from)+'" style="width:90px;border:1px solid var(--border);border-radius:6px;padding:5px 8px;font-family:\'JetBrains Mono\',monospace;font-size:12px;background:var(--surface);color:var(--text)"/></td>'
        +'<td><input id="be-to-'+s.no+'" value="'+esc(s.to)+'" style="width:90px;border:1px solid var(--border);border-radius:6px;padding:5px 8px;font-family:\'JetBrains Mono\',monospace;font-size:12px;background:var(--surface);color:var(--text)"/></td>'
        +'<td><input id="be-act-'+s.no+'" value="'+esc(s.activity)+'" style="width:100%;border:1px solid var(--border);border-radius:6px;padding:5px 8px;font-family:\'DM Sans\',sans-serif;background:var(--surface);color:var(--text)"/></td>'
        +'<td style="white-space:nowrap;display:flex;gap:6px;padding:10px 16px">'
          +'<button class="btn btn-primary" style="font-size:11px;padding:4px 10px" onclick="boarderSaveRow('+s.no+')">✓ Save</button>'
          +'<button class="btn btn-outline" style="font-size:11px;padding:4px 10px" onclick="boarderEditRow=null;render()">Cancel</button>'
        +'</td>'
        +'<td></td>'
        +'</tr>';
    }
    var isDone=!!schedCheck[s.no];
    var bg=isDone?'background:linear-gradient(90deg,#f0fdf4,transparent);':(highlight(s.activity)?'background:linear-gradient(90deg,var(--accent-light),transparent);':'');
    return '<tr style="'+bg+'">'
      +'<td style="font-family:\'JetBrains Mono\',monospace;font-size:11px;color:var(--muted);text-align:center">'+s.no+'</td>'
      +'<td style="font-family:\'JetBrains Mono\',monospace;font-size:12px;font-weight:600;color:var(--accent)">'+esc(s.from)+'</td>'
      +'<td style="font-family:\'JetBrains Mono\',monospace;font-size:12px;color:var(--muted)">'+(s.to||'&mdash;')+'</td>'
      +'<td><span style="font-size:15px;margin-right:8px">'+activityIcon(s.activity)+'</span><span style="font-weight:'+(highlight(s.activity)?'700':'500')+';font-size:13px;'+(isDone?'text-decoration:line-through;color:var(--muted2)':'')+'">'+ esc(s.activity)+'</span></td>'
      +'<td style="white-space:nowrap">'
      +(isAdmin
        ?'<button onclick="boarderEditRow='+s.no+';render()" style="background:var(--accent-light);color:var(--accent);border:1px solid var(--accent);border-radius:6px;padding:4px 9px;cursor:pointer;font-size:11px;font-weight:700;font-family:\'DM Sans\',sans-serif;margin-right:4px">✏ Edit</button>'
         +'<button onclick="boarderDeleteRow('+s.no+')" style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;border-radius:6px;padding:4px 9px;cursor:pointer;font-size:11px;font-weight:700;font-family:\'DM Sans\',sans-serif">✕</button>'
        :'<span style="font-size:11px;color:var(--muted2);font-style:italic">--</span>')
      +'</td>'
      +'<td style="text-align:center">'
      +'<button onclick="schedToggle('+s.no+')" title="'+(isDone?'Mark as pending':'Mark as done')+'" style="width:32px;height:32px;border-radius:50%;border:'+(isDone?'2px solid #16a34a':'2px dashed var(--border)')+';background:'+(isDone?'#16a34a':'transparent')+';color:'+(isDone?'#fff':'var(--muted2)')+';cursor:pointer;font-size:15px;font-weight:700;transition:all .15s;display:inline-flex;align-items:center;justify-content:center">'+(isDone?'✓':'')+'</button>'
      +'</td>'
      +'</tr>';
  }).join('');
  // Add form for admin
  var addFormHTML='';
  if(isAdmin && boarderAddForm){
    addFormHTML='<div class="form-panel" style="margin-bottom:18px"><div class="form-title" style="color:var(--accent)">➕ Add Schedule Row</div>'
      +'<div class="form-grid g3">'
        +'<div class="form-group"><label>From *</label><input id="ba-from" placeholder="e.g. 6:00 AM"/></div>'
        +'<div class="form-group"><label>To</label><input id="ba-to" placeholder="e.g. 7:00 AM (optional)"/></div>'
        +'<div class="form-group"><label>Activity *</label><input id="ba-act" placeholder="e.g. Morning PT"/></div>'
      +'</div>'
      +'<div class="form-actions"><button class="btn btn-primary" onclick="boarderAddRow()">Save Row</button><button class="btn btn-outline" onclick="boarderAddForm=false;render()">Cancel</button></div>'
    +'</div>';
  }
  var adminBanner=isAdmin
    ?'<div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:10px;padding:10px 16px;margin-bottom:16px;font-size:12.5px;color:#1433a8;display:flex;align-items:center;gap:8px">🔐 <b>Admin Mode:</b> You can edit, add or delete schedule rows below.</div>'
    :'<div style="background:#f0f3fa;border:1px solid var(--border-soft);border-radius:10px;padding:10px 16px;margin-bottom:16px;font-size:12.5px;color:var(--muted);display:flex;align-items:center;gap:8px">👁 <b>View Only:</b> Contact the Administrator to modify this schedule.</div>';
  // Mobile: timeline view
  var brdMobileList=schedule.map(function(s,idx){
    var isDone=!!schedCheck[s.no];
    var isHighlight=highlight(s.activity);
    var isLast=idx===schedule.length-1;
    // Inline edit on mobile for admin
    if(isAdmin && boarderEditRow===s.no){
      return '<div style="padding:12px 16px;background:var(--accent-light);border-bottom:1px solid var(--border-soft)">'
        +'<div style="display:flex;gap:8px;margin-bottom:8px">'
          +'<input id="be-from-'+s.no+'" value="'+esc(s.from)+'" placeholder="From" style="flex:1;border:1.5px solid var(--accent);border-radius:8px;padding:8px 10px;font-family:\'JetBrains Mono\',monospace;font-size:13px;background:var(--surface);color:var(--text)"/>'
          +'<input id="be-to-'+s.no+'" value="'+esc(s.to)+'" placeholder="To (opt)" style="flex:1;border:1.5px solid var(--border);border-radius:8px;padding:8px 10px;font-family:\'JetBrains Mono\',monospace;font-size:13px;background:var(--surface);color:var(--text)"/>'
        +'</div>'
        +'<input id="be-act-'+s.no+'" value="'+esc(s.activity)+'" placeholder="Activity" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:8px 10px;font-family:\'DM Sans\',sans-serif;font-size:13px;background:var(--surface);color:var(--text);margin-bottom:8px"/>'
        +'<div style="display:flex;gap:8px">'
          +'<button onclick="boarderSaveRow('+s.no+')" style="flex:1;padding:9px;border-radius:9px;background:var(--accent);color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer">✓ Save</button>'
          +'<button onclick="boarderEditRow=null;render()" style="padding:9px 14px;border-radius:9px;background:var(--surface2);color:var(--muted);border:1.5px solid var(--border);font-size:13px;cursor:pointer">Cancel</button>'
        +'</div>'
      +'</div>';
    }
    return '<div class="brd-mob-item'+(isDone?' done':isHighlight?' highlight':'')+'">'
      +'<div class="brd-mob-time-col">'
        +'<div class="brd-mob-time-from">'+esc(s.from)+'</div>'
        +(s.to?'<div class="brd-mob-time-to">'+esc(s.to)+'</div>':'')
      +'</div>'
      +'<div class="brd-mob-dot-col">'
        +'<div class="brd-mob-dot'+(isDone?' done':isHighlight?' active':'')+'"></div>'
        +(!isLast?'<div class="brd-mob-line"></div>':'')
      +'</div>'
      +'<div class="brd-mob-act" style="padding-top:2px">'
        +'<div style="font-size:16px;margin-bottom:3px">'+activityIcon(s.activity)+'</div>'
        +'<div class="brd-mob-act-name'+(isDone?' done':'')+'">'+(isHighlight&&!isDone?'<b>':'')+esc(s.activity)+(isHighlight&&!isDone?'</b>':'')+'</div>'
        +(isAdmin?'<div style="display:flex;gap:6px;margin-top:6px">'
          +'<button onclick="boarderEditRow='+s.no+';render()" style="font-size:11px;padding:4px 10px;border-radius:6px;background:var(--accent-light);color:var(--accent);border:1px solid var(--accent);cursor:pointer;font-weight:700">✏</button>'
          +'<button onclick="boarderDeleteRow('+s.no+')" style="font-size:11px;padding:4px 8px;border-radius:6px;background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;cursor:pointer;font-weight:700">🗑</button>'
        +'</div>':'')
      +'</div>'
      +'<button class="brd-mob-check-btn'+(isDone?' done':'')+'" onclick="schedToggle('+s.no+')">'+(isDone?'✓':'')+'</button>'
    +'</div>';
  }).join('');
  return tabBar+subTabBar+'<div style="margin-bottom:20px"><div style="font-family:\'JetBrains Mono\',monospace;font-size:11px;color:var(--muted);letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px">BOARDING SECTION</div><div style="font-size:22px;font-family:\'Cormorant Garamond\',serif;font-weight:700;color:var(--text)">'+_schedTitle+'</div><div style="font-size:12px;color:var(--muted);margin-top:4px">'+_schedValid+'</div></div>'
    +'<div class="stat-grid gnsi-brd-stat-grid" style="grid-template-columns:repeat(4,1fr)">'
    +'<div class="stat-card" style="--c:#d4a853"><div class="stat-label">Wake Up</div><div class="stat-val">6 AM</div><div class="stat-sub">Morning PT at 6:30</div></div>'
    +'<div class="stat-card" style="--c:#1a6b55"><div class="stat-label">Academic Hours</div><div class="stat-val">~5 hrs</div><div class="stat-sub">Two shifts daily</div></div>'
    +'<div class="stat-card" style="--c:#3b78c9"><div class="stat-label">Doubt Sessions</div><div class="stat-val">3.5 hrs</div><div class="stat-sub">Morning + Evening</div></div>'
    +'<div class="stat-card" style="--c:#8b5cf6"><div class="stat-label">Lights Off</div><div class="stat-val">9:30 PM</div><div class="stat-sub">After assignment</div></div>'
    +'</div>'
    +adminBanner
    +(isAdmin?'<div class="gnsi-brd-admin-bar" style="display:flex;gap:10px;margin-bottom:16px"><button class="btn btn-primary" onclick="boarderAddForm=!boarderAddForm;boarderEditRow=null;render()">+ Add Row</button><button class="btn btn-outline" onclick="boarderResetDefault()" style="color:#dc2626;border-color:#fca5a5">↺ Reset to Default</button></div>':'')
    +addFormHTML
    // Desktop table
    +'<div class="gnsi-brd-desktop"><div class="dash-grid"><div class="card"><div class="card-head"><span class="card-title">Daily Schedule</span><span style="font-size:11px;color:var(--muted);font-family:\'JetBrains Mono\',monospace">'+schedule.length+' activities daily</span></div><div style="padding:14px 20px 0">'+progressBar+'</div><div style="overflow-x:auto"><table><thead><tr><th style="width:40px;text-align:center">Sl.</th><th>From</th><th>To</th><th>Activity</th><th>Actions</th><th style="text-align:center;width:60px">Done</th></tr></thead><tbody>'+rows+'</tbody></table></div></div></div></div>'
    // Mobile timeline
    +'<div class="gnsi-brd-mobile">'
      +'<div style="padding:14px 16px 0">'+progressBar+'</div>'
      +'<div class="card" style="overflow:hidden;border-radius:var(--radius);box-shadow:var(--shadow-sm)">'+brdMobileList+'</div>'
    +'</div>';
}
function boarderSaveRow(no){
  var isSun=boarderScheduleType==='sunday';
  var schedule=isSun?loadBoarderScheduleSunday():loadBoarderSchedule();
  schedule=schedule.map(function(s){
    if(s.no!==no)return s;
    return Object.assign({},s,{
      from:((document.getElementById('be-from-'+no)||{}).value||s.from).trim(),
      to:((document.getElementById('be-to-'+no)||{}).value||'').trim(),
      activity:((document.getElementById('be-act-'+no)||{}).value||s.activity).trim()
    });
  });
  if(isSun)saveBoarderScheduleSunday(schedule);else saveBoarderSchedule(schedule);
  boarderEditRow=null;render();showToast('Schedule row updated','#1433a8');
}
function boarderDeleteRow(no){
  if(!confirm('Remove this schedule row?'))return;
  var isSun=boarderScheduleType==='sunday';
  var schedule=(isSun?loadBoarderScheduleSunday():loadBoarderSchedule()).filter(function(s){return s.no!==no;});
  if(isSun)saveBoarderScheduleSunday(schedule);else saveBoarderSchedule(schedule);
  render();showToast('Row removed','#dc2626');
}
function boarderAddRow(){
  var from=((document.getElementById('ba-from')||{}).value||'').trim();
  var act=((document.getElementById('ba-act')||{}).value||'').trim();
  if(!from||!act){alert('From time and Activity are required.');return;}
  var isSun=boarderScheduleType==='sunday';
  var schedule=isSun?loadBoarderScheduleSunday():loadBoarderSchedule();
  var maxNo=schedule.reduce(function(m,s){return Math.max(m,s.no);},0);
  schedule.push({no:maxNo+1,from:from,to:((document.getElementById('ba-to')||{}).value||'').trim(),activity:act});
  if(isSun)saveBoarderScheduleSunday(schedule);else saveBoarderSchedule(schedule);
  boarderAddForm=false;render();showToast('Row added','#16a34a');
}
function boarderResetDefault(){
  if(!confirm('Reset boarder schedule to default? All custom changes will be lost.'))return;
  if(boarderScheduleType==='sunday'){
    localStorage.removeItem('ims_boarder_sunday');
    if(typeof gnsiKVPush==='function') gnsiKVPush('ims_boarder_sunday',[]);
  } else {
    localStorage.removeItem('ims_boarder');
    if(typeof gnsiKVPush==='function') gnsiKVPush('ims_boarder',[]);
  }
  gnsiMarkLocalSave(20000); // 20s guard -- prevents KV poll from immediately restoring old schedule
  render();showToast('Schedule reset to default','#d4a853');
}
function schedToggle(no){
  var k='gnsi_sched_check_'+(function(){var d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1<10?'0':'')+(d.getMonth()+1)+'-'+(d.getDate()<10?'0':'')+d.getDate();})();
  var obj;try{obj=JSON.parse(localStorage.getItem(k)||'{}');}catch(e){obj={};}
  obj[no]=!obj[no];
  localStorage.setItem(k,JSON.stringify(obj));
  render();
}
// ══════════════════════════════════════════════════════════════
//  STAFF ARRANGEMENT -- Boarder Duty Roster (Meals/Bath/Play)
// ══════════════════════════════════════════════════════════════
var STAFF_ARRANGE_DEFAULT={
  lunch_dinner:[
    {id:'ld1',role:'Tank (Control & Distribution)',staff:['','']},
    {id:'ld2',role:'Making Line in Campus',staff:['','']},
    {id:'ld3',role:'Meal Carrier',staff:['','']},
    {id:'ld4',role:'Check Proper Meal Intake',staff:['','']},
    {id:'ld5',role:'Call Out Wards from House',staff:['','']}
  ],
  bathing:[
    {id:'ba1',role:'Supervision of Proper Bathing',staff:['','']},
    {id:'ba2',role:'Bathroom Cleaning Check (Plastics etc.)',staff:['','']}
  ],
  playtime:[
    {id:'pt1',role:'Field Supervision -- All Round',staff:[]},
    {id:'pt2',role:'Making Line to Field (Road Safety)',staff:['','']}
  ]
};
function loadStaffArrange(){
  var s=localStorage.getItem('gnsi_staff_arrange');
  if(s){try{return JSON.parse(s);}catch(e){}}
  return JSON.parse(JSON.stringify(STAFF_ARRANGE_DEFAULT));
}
function saveStaffArrange(d){localStorage.setItem('gnsi_staff_arrange',JSON.stringify(d));if(typeof gnsiKVPush==='function')gnsiKVPush('gnsi_staff_arrange',d);}
function dutyAttendKey(){var d=new Date();return'gnsi_duty_attend_'+d.getFullYear()+'-'+(d.getMonth()+1<10?'0':'')+(d.getMonth()+1)+'-'+(d.getDate()<10?'0':'')+d.getDate();}
function loadDutyAttend(){try{return JSON.parse(localStorage.getItem(dutyAttendKey())||'{}');}catch(e){return{};}}
function saveDutyAttend(obj){
  var _gnsiAllowed=['admin','manager','teacher'];
  if(!currentUser||_gnsiAllowed.indexOf(currentUser.role)<0){
    if(typeof showToast==='function')showToast('🔒 Access denied: Save duty attendance','#dc2626');
    return;
  }

  var _dak = dutyAttendKey();
  localStorage.setItem(_dak, JSON.stringify(obj));
  localStorage.setItem('gnsi_kv_ts_'+_dak, new Date().toISOString());
  if(typeof gnsiKVPush==='function') gnsiKVPush(_dak, obj);
}
function dutyAttendToggle(slotKey){
  var obj=loadDutyAttend();
  var cur=obj[slotKey]||'';
  obj[slotKey]=cur==='P'?'A':cur==='A'?'':' P';
  obj[slotKey]=obj[slotKey].trim()||'P'; // P → A → (clear) → P
  if(cur==='')obj[slotKey]='P'; else if(cur==='P')obj[slotKey]='A'; else delete obj[slotKey];
  saveDutyAttend(obj);
  render();
}
function renderKitchen(){
  var tabs=[
    {id:'stock',  label:'Stock Items',   icon:'📦'},
    {id:'menu',   label:'Kitchen Menu',  icon:'🍽️'},
    {id:'daily',  label:'Daily Stock',   icon:'🧴'},
    {id:'log',    label:'Stock Log',     icon:'📋'}
  ];
  var tabBar=tabs.map(function(t){
    var active=t.id===kitchenTab;
    return '<button onclick="setKitchenTab(\''+t.id+'\')" style="padding:8px 16px;border-radius:8px;border:'+(active?'none':'1.5px solid var(--border)')+';cursor:pointer;font-size:12.5px;font-weight:'+(active?'700':'600')+';background:'+(active?'var(--accent)':'var(--surface)')+';color:'+(active?'#fff':'var(--muted)')+';white-space:nowrap;transition:all .15s">'+t.icon+' '+t.label+'</button>';
  }).join('');
  var body='';
  try{
    if(kitchenTab==='stock') body=renderKitStock();
    if(kitchenTab==='menu')  body=renderKitMenu();
    if(kitchenTab==='daily') body=renderKitDaily();
    if(kitchenTab==='log')   body=renderKitLog();
  }catch(e){ body='<div class="card" style="padding:24px;color:red">Error: '+e.message+'</div>'; }
  return '<div class="page-header">'
    +'<div class="page-header-eyebrow">Canteen</div>'
    +'<div class="page-header-title">Kitchen &amp; Stock Management</div>'
    +'<div class="page-header-sub">Stock Items · Kitchen Menu · Daily Use Stock · Stock Log</div>'
    +'</div>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;padding:4px 0">'+tabBar+'</div>'
    +body;
}
var kitStockFormOpen = false;
var kitStockEdit = null;
function renderKitStock(){
  var items = kitLoad('stock_items');
  var isAdmin = kitIsAdmin();
  
  var total = items.length;
  var low   = items.filter(function(i){ return parseFloat(i.qty||0) <= parseFloat(i.minQty||0) && parseFloat(i.minQty||0)>0; }).length;
  var cats  = {};
  items.forEach(function(i){ cats[i.category||'Other']=(cats[i.category||'Other']||0)+1; });
  var kpiHtml='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;margin-bottom:20px">'
    +'<div class="card" style="padding:16px 18px;background:linear-gradient(135deg,#eff6ff,#dbeafe);border-color:#93c5fd">'
      +'<div style="font-size:11px;font-weight:700;color:#3b82f6;text-transform:uppercase">Total Items</div>'
      +'<div style="font-size:28px;font-weight:800;color:#1d4ed8;margin:4px 0">'+total+'</div>'
    +'</div>'
    +'<div class="card" style="padding:16px 18px;background:linear-gradient(135deg,'+(low>0?'#fef2f2,#fee2e2':'#f0fdf4,#dcfce7')+');border-color:'+(low>0?'#fca5a5':'#86efac')+'">'
      +'<div style="font-size:11px;font-weight:700;color:'+(low>0?'#ef4444':'#16a34a')+';text-transform:uppercase">Low Stock</div>'
      +'<div style="font-size:28px;font-weight:800;color:'+(low>0?'#dc2626':'#15803d')+';margin:4px 0">'+low+'</div>'
    +'</div>'
    +'<div class="card" style="padding:16px 18px;background:linear-gradient(135deg,#f5f3ff,#ede9fe);border-color:#c4b5fd">'
      +'<div style="font-size:11px;font-weight:700;color:#7c3aed;text-transform:uppercase">Categories</div>'
      +'<div style="font-size:28px;font-weight:800;color:#6d28d9;margin:4px 0">'+Object.keys(cats).length+'</div>'
    +'</div>'
    +'</div>';
  
  var formHtml='';
  if(kitStockFormOpen){
    var e=kitStockEdit||{};
    formHtml='<div class="card" style="margin-bottom:18px;border-color:var(--accent)">'
      +'<div class="card-head"><span class="card-title">'+(kitStockEdit?'✏️ Edit Item':'➕ Add Kitchen Stock Item')+'</span>'
      +'<button onclick="kitStockFormOpen=false;kitStockEdit=null;navigate(\'kitchen\')" style="padding:5px 12px;border-radius:7px;border:1.5px solid var(--border);background:var(--surface);cursor:pointer;font-size:12px;color:var(--muted)">✕ Cancel</button></div>'
      +'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;padding:4px 0">'
        +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Item Name *</label><input id="ks-name" value="'+(esc(e.name||''))+'" placeholder="e.g. Rice, Flour, Salt" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface);box-sizing:border-box"/></div>'
        +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Category</label>'
          +'<select id="ks-cat" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)">'
          +'<option value="Grains & Cereals"'+(e.category==='Grains & Cereals'?' selected':'')+'>Grains &amp; Cereals</option>'
          +'<option value="Vegetables"'+(e.category==='Vegetables'?' selected':'')+'>Vegetables</option>'
          +'<option value="Fruits"'+(e.category==='Fruits'?' selected':'')+'>Fruits</option>'
          +'<option value="Pulses & Lentils"'+(e.category==='Pulses & Lentils'?' selected':'')+'>Pulses &amp; Lentils</option>'
          +'<option value="Spices & Condiments"'+(e.category==='Spices & Condiments'?' selected':'')+'>Spices &amp; Condiments</option>'
          +'<option value="Oils & Fats"'+(e.category==='Oils & Fats'?' selected':'')+'>Oils &amp; Fats</option>'
          +'<option value="Dairy"'+(e.category==='Dairy'?' selected':'')+'>Dairy</option>'
          +'<option value="Meat & Fish"'+(e.category==='Meat & Fish'?' selected':'')+'>Meat &amp; Fish</option>'
          +'<option value="Beverages"'+(e.category==='Beverages'?' selected':'')+'>Beverages</option>'
          +'<option value="Bakery"'+(e.category==='Bakery'?' selected':'')+'>Bakery</option>'
          +'<option value="Other"'+(e.category==='Other'||!e.category?' selected':'')+'>Other</option>'
        +'</select></div>'
        +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Quantity *</label><input id="ks-qty" type="number" min="0" step="0.01" value="'+(e.qty||'')+'" placeholder="0" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface);box-sizing:border-box"/></div>'
        +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Unit</label>'
          +'<select id="ks-unit" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)">'
          +['kg','g','litre','ml','pcs','packets','bags','boxes','dozen','tin','bottle'].map(function(u){return '<option value="'+u+'"'+(e.unit===u?' selected':'')+'>'+u+'</option>';}).join('')
        +'</select></div>'
        +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Min Stock Alert</label><input id="ks-min" type="number" min="0" step="0.01" value="'+(e.minQty||'')+'" placeholder="e.g. 5" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface);box-sizing:border-box"/></div>'
        +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Rate (₹/unit)</label><input id="ks-rate" type="number" min="0" step="0.01" value="'+(e.rate||'')+'" placeholder="0.00" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface);box-sizing:border-box"/></div>'
        +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Supplier</label><input id="ks-supplier" value="'+(esc(e.supplier||''))+'" placeholder="Supplier name" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface);box-sizing:border-box"/></div>'
        +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Expiry Date</label><input type="date" id="ks-exp" value="'+(e.expiry||'')+'" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface);box-sizing:border-box"/></div>'
        +'<div style="grid-column:1/-1"><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Notes</label><textarea id="ks-notes" rows="2" placeholder="Any remarks..." style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface);resize:vertical;box-sizing:border-box">'+(esc(e.notes||''))+'</textarea></div>'
      +'</div>'
      +'<div style="margin-top:14px;display:flex;gap:10px">'
        +'<button class="btn btn-primary" onclick="kitSaveStock('+( kitStockEdit?kitStockEdit.id:'null')+')">💾 Save Item</button>'
      +'</div></div>';
  }
  
  var catList = ['All'].concat(Object.keys(cats).sort());
  var filterHtml='<div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:16px">'
    +'<input id="kit-stock-search" placeholder="🔍 Search items..." oninput="_debouncedKitStock()" style="padding:8px 12px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);min-width:200px"/>'
    +'<select id="kit-stock-cat" onchange="kitRenderStockTable()" style="padding:8px 12px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface)">'
    +catList.map(function(c){return '<option value="'+c+'">'+c+'</option>';}).join('')
    +'</select>'
    +(isAdmin?'<button class="btn btn-primary" style="margin-left:auto" onclick="kitStockFormOpen=true;kitStockEdit=null;navigate(\'kitchen\')">➕ Add Item</button>':'')
    +'</div>';
  
  var tableHtml='<div class="card"><div class="card-head"><span class="card-title">📦 Kitchen Stock Register</span>'
    +'<span style="font-size:11px;color:var(--muted);font-family:monospace">'+total+' items</span></div>'
    +'<div id="kit-stock-table-wrap" style="overflow-x:auto">'
    +kitBuildStockTable(items, isAdmin)
    +'</div></div>';
  return kpiHtml+formHtml+filterHtml+tableHtml;
}
function kitBuildStockTable(items, isAdmin){
  if(!items.length) return '<table><tbody><tr><td colspan="9" style="text-align:center;color:var(--muted);padding:32px">No stock items yet. Click ➕ Add Item to get started.</td></tr></tbody></table>';
  var rows=items.slice().reverse().map(function(r){
    var qty=parseFloat(r.qty||0); var minQ=parseFloat(r.minQty||0);
    var isLow=minQ>0&&qty<=minQ; var isExpSoon=false;
    if(r.expiry){ var diff=(new Date(r.expiry)-new Date())/(864e5); isExpSoon=diff<=7&&diff>=0; }
    var statusBadge = isLow ? kitBadge('Low Stock','red') : kitBadge('OK','green');
    if(r.expiry && (new Date(r.expiry)<new Date())) statusBadge=kitBadge('Expired','gray');
    else if(isExpSoon) statusBadge=kitBadge('Exp. Soon','amber');
    return '<tr style="background:'+(isLow?'#fef2f222':'')+';">'
      +'<td><b>'+esc(r.name)+'</b>'+(r.notes?'<br><span style="font-size:10px;color:var(--muted)">'+esc(r.notes)+'</span>':'')+'</td>'
      +'<td>'+kitBadge(r.category||'Other','blue')+'</td>'
      +'<td style="font-weight:700;color:'+(isLow?'#dc2626':'var(--text)')+'">'+qty+' '+esc(r.unit||'')+'</td>'
      +'<td style="color:var(--muted)">'+(r.minQty?r.minQty+' '+esc(r.unit||''):'-')+'</td>'
      +'<td>'+(r.rate?'₹'+parseFloat(r.rate).toFixed(2):'-')+'</td>'
      +'<td>'+esc(r.supplier||'-')+'</td>'
      +'<td>'+kitFmt(r.expiry)+'</td>'
      +'<td>'+statusBadge+'</td>'
      +(isAdmin?'<td style="white-space:nowrap">'
        +'<button onclick="kitStockEdit=kitLoad(\'stock_items\').find(function(x){return x.id=='+parseInt(r.id,10)+'});kitStockFormOpen=true;navigate(\'kitchen\')" style="padding:3px 10px;border-radius:6px;border:1px solid var(--border);background:var(--surface);font-size:11px;cursor:pointer;margin-right:4px">✏️</button>'
        +'<button onclick="kitUpdateQty('+parseInt(r.id,10)+')" style="padding:3px 10px;border-radius:6px;border:1px solid #2563eb44;background:#eff6ff;color:#2563eb;font-size:11px;cursor:pointer;margin-right:4px">+/−</button>'
        +'<button onclick="kitDelStock('+parseInt(r.id,10)+')" style="padding:3px 10px;border-radius:6px;border:1px solid #fca5a5;background:#fef2f2;color:#dc2626;font-size:11px;cursor:pointer">🗑</button>'
        +'</td>':'<td>'+kitFmt(r.addedOn)+'</td>')
      +'</tr>';
  }).join('');
  return '<table><thead><tr><th>Item</th><th>Category</th><th>Qty</th><th>Min Qty</th><th>Rate</th><th>Supplier</th><th>Expiry</th><th>Status</th><th>Action</th></tr></thead><tbody>'+rows+'</tbody></table>';
}
function kitRenderStockTable(){
  var search=(document.getElementById('kit-stock-search')||{}).value||'';
  var cat=(document.getElementById('kit-stock-cat')||{}).value||'All';
  var items=kitLoad('stock_items').filter(function(i){
    var matchS=!search||esc(i.name).toLowerCase().includes(search.toLowerCase());
    var matchC=cat==='All'||(i.category||'Other')===cat;
    return matchS&&matchC;
  });
  var wrap=document.getElementById('kit-stock-table-wrap');
  if(wrap) wrap.innerHTML=kitBuildStockTable(items, kitIsAdmin());
}
function kitSaveStock(editId){
  var name=(document.getElementById('ks-name')||{}).value||'';
  var qty=(document.getElementById('ks-qty')||{}).value||'';
  if(!name.trim()||qty===''){showToast('Item name and quantity are required','#ef4444');return;}
  var items=kitLoad('stock_items');
  var rec={
    id:editId||kitNextId(items),
    name:name.trim(),
    category:(document.getElementById('ks-cat')||{}).value||'Other',
    qty:parseFloat(qty),
    unit:(document.getElementById('ks-unit')||{}).value||'kg',
    minQty:parseFloat((document.getElementById('ks-min')||{}).value)||0,
    rate:parseFloat((document.getElementById('ks-rate')||{}).value)||0,
    supplier:((document.getElementById('ks-supplier')||{}).value||'').trim(),
    expiry:(document.getElementById('ks-exp')||{}).value||'',
    notes:((document.getElementById('ks-notes')||{}).value||'').trim(),
    addedOn:kitDate()
  };
  if(editId){
    var idx=items.findIndex(function(x){return x.id==editId;});
    if(idx>-1){ rec.addedOn=items[idx].addedOn; items[idx]=rec; }
  } else { items.push(rec); }
  kitSave('stock_items',items);
  kitAppendLog('stock',rec.name,(editId?'Updated':'Added'),rec.qty+' '+rec.unit);
  kitStockFormOpen=false; kitStockEdit=null;
  showToast((editId?'Item updated':'Item added')+': '+rec.name,'#16a34a');
  navigate('kitchen');
}
function kitUpdateQty(id){
  var items=kitLoad('stock_items');
  var item=items.find(function(x){return x.id==id;});
  if(!item)return;
  var delta=parseFloat(prompt('Adjust quantity for "'+item.name+'" (current: '+item.qty+' '+item.unit+')\nEnter +amount to add, -amount to deduct (e.g. +10 or -5):',''));
  if(isNaN(delta))return;
  var newQty=Math.max(0,parseFloat(item.qty||0)+delta);
  item.qty=Math.round(newQty*100)/100;
  var idx=items.findIndex(function(x){return x.id==id;});
  if(idx>-1) items[idx]=item;
  kitSave('stock_items',items);
  kitAppendLog('stock',item.name,(delta>0?'Stock In':'Stock Out'),Math.abs(delta)+' '+item.unit+' → Balance: '+item.qty+' '+item.unit);
  showToast('Quantity updated for '+item.name,'#16a34a');
  navigate('kitchen');
}
function kitDelStock(id){
  if(!confirm('Delete this stock item?'))return;
  var items=kitLoad('stock_items').filter(function(x){return x.id!==id;});
  kitSave('stock_items',items);
  showToast('Item deleted','#ef4444');
  navigate('kitchen');
}
var kitMenuFormOpen = false;
var kitMenuEdit = null;
var kitMenuViewDate = '';
function renderKitMenu(){
  var menus=kitLoad('menu');
  var isAdmin=kitIsAdmin();
  if(!kitMenuViewDate) kitMenuViewDate=kitDate();
  
  var d=new Date(kitMenuViewDate+'T00:00:00');
  var dayOfWeek=d.getDay();
  var weekStart=new Date(d); weekStart.setDate(d.getDate()-dayOfWeek);
  var weekDays=[];
  for(var i=0;i<7;i++){
    var wd=new Date(weekStart);wd.setDate(weekStart.getDate()+i);
    weekDays.push(wd.toISOString().slice(0,10));
  }
  var dNames=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var calHtml='<div class="card" style="margin-bottom:18px"><div class="card-head"><span class="card-title">📅 Weekly Menu View</span>'
    +'<div style="display:flex;gap:8px;align-items:center">'
    +'<button onclick="var d=new Date(kitMenuViewDate+\'T00:00:00\');d.setDate(d.getDate()-7);kitMenuViewDate=d.toISOString().slice(0,10);navigate(\'kitchen\')" style="padding:5px 12px;border-radius:7px;border:1.5px solid var(--border);background:var(--surface);cursor:pointer;font-size:12px">◀ Prev</button>'
    +'<button onclick="kitMenuViewDate=kitDate();navigate(\'kitchen\')" style="padding:5px 12px;border-radius:7px;border:1.5px solid var(--accent);background:var(--accent);color:#fff;cursor:pointer;font-size:12px">Today</button>'
    +'<button onclick="var d=new Date(kitMenuViewDate+\'T00:00:00\');d.setDate(d.getDate()+7);kitMenuViewDate=d.toISOString().slice(0,10);navigate(\'kitchen\')" style="padding:5px 12px;border-radius:7px;border:1.5px solid var(--border);background:var(--surface);cursor:pointer;font-size:12px">Next ▶</button>'
    +'</div></div>'
    +'<div style="overflow-x:auto"><table style="border-collapse:collapse;min-width:700px;width:100%"><thead><tr>'
    +weekDays.map(function(wd,idx){
      var isToday=wd===kitDate();
      return '<th style="padding:10px 8px;text-align:center;background:'+(isToday?'var(--accent)':'var(--surface2)')+';color:'+(isToday?'#fff':'var(--muted)')+';font-size:12px;border-bottom:2px solid var(--border)">'+dNames[idx]+'<br><span style="font-size:10px;font-weight:600">'+kitFmt(wd)+'</span></th>';
    }).join('')
    +'</tr></thead><tbody><tr>'
    +weekDays.map(function(wd){
      var dayMenus=menus.filter(function(m){return m.date===wd;});
      var isToday=wd===kitDate();
      var cellContent=dayMenus.length
        ?dayMenus.map(function(m){
            var mealColors={Breakfast:'#16a34a',Lunch:'#2563eb',Snacks:'#d97706',Dinner:'#7c3aed'};
            var col=mealColors[m.meal]||'#6b7280';
            return '<div style="margin-bottom:6px;padding:6px 8px;border-radius:7px;background:'+col+'12;border-left:3px solid '+col+'">'
              +'<div style="font-size:10px;font-weight:700;color:'+col+'">'+esc(m.meal)+'</div>'
              +'<div style="font-size:11px;color:var(--text);margin-top:2px">'+esc(m.items)+'</div>'
              +(isAdmin?'<button onclick="kitMenuEdit=kitLoad(\'menu\').find(function(x){return x.id=='+parseInt(m.id,10)+'});kitMenuFormOpen=true;navigate(\'kitchen\')" style="font-size:9px;padding:1px 6px;border-radius:4px;border:1px solid '+col+'33;background:'+col+'08;color:'+col+';cursor:pointer;margin-top:3px">✏️</button>':'')
            +'</div>';
          }).join('')
        :'<div style="color:var(--muted);font-size:11px;text-align:center;padding:10px 0">No menu</div>';
      return '<td style="padding:8px;vertical-align:top;border:1px solid var(--border);background:'+(isToday?'#eff6ff':'var(--surface)')+'">'+cellContent+'</td>';
    }).join('')
    +'</tr></tbody></table></div></div>';
  
  var formHtml='';
  if(kitMenuFormOpen && isAdmin){
    var e=kitMenuEdit||{};
    formHtml='<div class="card" style="margin-bottom:18px;border-color:var(--accent)">'
      +'<div class="card-head"><span class="card-title">'+(kitMenuEdit?'✏️ Edit Menu Entry':'➕ Add Menu Entry')+'</span>'
      +'<button onclick="kitMenuFormOpen=false;kitMenuEdit=null;navigate(\'kitchen\')" style="padding:5px 12px;border-radius:7px;border:1.5px solid var(--border);background:var(--surface);cursor:pointer;font-size:12px;color:var(--muted)">✕ Cancel</button></div>'
      +'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;padding:4px 0">'
        +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Date *</label><input type="date" id="km-date" value="'+(e.date||kitDate())+'" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface);box-sizing:border-box"/></div>'
        +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Meal *</label>'
          +'<select id="km-meal" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)">'
          +['Breakfast','Lunch','Snacks','Dinner'].map(function(m){return '<option value="'+m+'"'+(e.meal===m?' selected':'')+'>'+m+'</option>';}).join('')
          +'</select></div>'
        +'<div style="grid-column:1/-1"><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Menu Items *</label><input id="km-items" value="'+(esc(e.items||''))+'" placeholder="e.g. Rice, Dal, Sabzi, Roti, Salad" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface);box-sizing:border-box"/></div>'
        +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Calories (approx)</label><input id="km-cal" type="number" min="0" value="'+(e.calories||'')+'" placeholder="kcal" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface);box-sizing:border-box"/></div>'
        +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Cost (₹)</label><input id="km-cost" type="number" min="0" step="0.01" value="'+(e.cost||'')+'" placeholder="0.00" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface);box-sizing:border-box"/></div>'
        +'<div style="grid-column:1/-1"><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Notes / Special Instructions</label><textarea id="km-notes" rows="2" placeholder="Allergy notes, special diet, etc." style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface);resize:vertical;box-sizing:border-box">'+(esc(e.notes||''))+'</textarea></div>'
      +'</div>'
      +'<div style="margin-top:14px;display:flex;gap:10px">'
        +'<button class="btn btn-primary" onclick="kitSaveMenu('+(kitMenuEdit?kitMenuEdit.id:'null')+')">💾 Save Menu</button>'
      +'</div></div>';
  }
  
  var listRows=menus.length ? menus.slice().reverse().slice(0,30).map(function(m){
    var mealColors={Breakfast:'#16a34a',Lunch:'#2563eb',Snacks:'#d97706',Dinner:'#7c3aed'};
    var col=mealColors[m.meal]||'#6b7280';
    return '<tr>'
      +'<td>'+kitFmt(m.date)+'</td>'
      +'<td>'+kitBadge(m.meal,col==='#16a34a'?'green':col==='#2563eb'?'blue':col==='#d97706'?'amber':'purple')+'</td>'
      +'<td>'+esc(m.items)+'</td>'
      +'<td>'+(m.calories?m.calories+' kcal':'-')+'</td>'
      +'<td>'+(m.cost?'₹'+parseFloat(m.cost).toFixed(2):'-')+'</td>'
      +'<td>'+esc(m.notes||'-')+'</td>'
      +(isAdmin?'<td style="white-space:nowrap">'
        +'<button onclick="kitMenuEdit=kitLoad(\'menu\').find(function(x){return x.id=='+parseInt(m.id,10)+'});kitMenuFormOpen=true;navigate(\'kitchen\')" style="padding:3px 10px;border-radius:6px;border:1px solid var(--border);background:var(--surface);font-size:11px;cursor:pointer;margin-right:4px">✏️</button>'
        +'<button onclick="kitDelMenu('+parseInt(m.id,10)+')" style="padding:3px 10px;border-radius:6px;border:1px solid #fca5a5;background:#fef2f2;color:#dc2626;font-size:11px;cursor:pointer">🗑</button>'
        +'</td>':'<td>'+kitFmt(m.date)+'</td>')
      +'</tr>';
  }).join('') : '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:32px">No menu entries yet.</td></tr>';
  var addBtn=isAdmin?'<button class="btn btn-primary" onclick="kitMenuFormOpen=true;kitMenuEdit=null;navigate(\'kitchen\')">➕ Add Menu</button>':'';
  return calHtml+formHtml
    +'<div class="card"><div class="card-head"><span class="card-title">🍽️ Menu Register (Recent 30)</span>'+addBtn+'</div>'
    +'<div style="overflow-x:auto"><table><thead><tr><th>Date</th><th>Meal</th><th>Menu Items</th><th>Calories</th><th>Cost</th><th>Notes</th><th>Action</th></tr></thead>'
    +'<tbody>'+listRows+'</tbody></table></div></div>';
}
function kitSaveMenu(editId){
  var date=(document.getElementById('km-date')||{}).value||'';
  var meal=(document.getElementById('km-meal')||{}).value||'';
  var items=(document.getElementById('km-items')||{}).value||'';
  if(!date||!meal||!items.trim()){showToast('Date, Meal and Items are required','#ef4444');return;}
  var menus=kitLoad('menu');
  var rec={
    id:editId||kitNextId(menus),
    date:date,meal:meal,
    items:items.trim(),
    calories:parseInt((document.getElementById('km-cal')||{}).value)||0,
    cost:parseFloat((document.getElementById('km-cost')||{}).value)||0,
    notes:((document.getElementById('km-notes')||{}).value||'').trim(),
    addedOn:kitDate()
  };
  if(editId){ var idx=menus.findIndex(function(x){return x.id==editId;}); if(idx>-1)menus[idx]=rec; }
  else menus.push(rec);
  kitSave('menu',menus);
  kitMenuFormOpen=false; kitMenuEdit=null;
  showToast((editId?'Menu updated':'Menu added')+': '+meal+' on '+kitFmt(date),'#16a34a');
  navigate('kitchen');
}
function kitDelMenu(id){
  if(!confirm('Delete this menu entry?'))return;
  kitSave('menu',kitLoad('menu').filter(function(x){return x.id!==id;}));
  showToast('Menu entry deleted','#ef4444'); navigate('kitchen');
}
var kitDailyFormOpen = false;
var kitDailyEdit = null;
function renderKitDaily(){
  var items=kitLoad('daily_stock');
  var isAdmin=kitIsAdmin();
  var total=items.length;
  var low=items.filter(function(i){return parseFloat(i.qty||0)<=parseFloat(i.minQty||0)&&parseFloat(i.minQty||0)>0;}).length;
  var kpiHtml='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;margin-bottom:20px">'
    +'<div class="card" style="padding:16px 18px;background:linear-gradient(135deg,#f5f3ff,#ede9fe);border-color:#c4b5fd"><div style="font-size:11px;font-weight:700;color:#7c3aed;text-transform:uppercase">Total Items</div><div style="font-size:28px;font-weight:800;color:#6d28d9;margin:4px 0">'+total+'</div></div>'
    +'<div class="card" style="padding:16px 18px;background:linear-gradient(135deg,'+(low>0?'#fef2f2,#fee2e2':'#f0fdf4,#dcfce7')+');border-color:'+(low>0?'#fca5a5':'#86efac')+'"><div style="font-size:11px;font-weight:700;color:'+(low>0?'#ef4444':'#16a34a')+';text-transform:uppercase">Low Stock Alerts</div><div style="font-size:28px;font-weight:800;color:'+(low>0?'#dc2626':'#15803d')+';margin:4px 0">'+low+'</div></div>'
    +'</div>';
  var formHtml='';
  if(kitDailyFormOpen && isAdmin){
    var e=kitDailyEdit||{};
    formHtml='<div class="card" style="margin-bottom:18px;border-color:var(--accent)">'
      +'<div class="card-head"><span class="card-title">'+(kitDailyEdit?'✏️ Edit Daily Stock':'➕ Add Daily Use Item')+'</span>'
      +'<button onclick="kitDailyFormOpen=false;kitDailyEdit=null;navigate(\'kitchen\')" style="padding:5px 12px;border-radius:7px;border:1.5px solid var(--border);background:var(--surface);cursor:pointer;font-size:12px;color:var(--muted)">✕ Cancel</button></div>'
      +'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;padding:4px 0">'
        +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Item Name *</label><input id="kd-name" value="'+(esc(e.name||''))+'" placeholder="e.g. Soap, Broom, Detergent" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface);box-sizing:border-box"/></div>'
        +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Category</label>'
          +'<select id="kd-cat" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)">'
          +['Cleaning Supplies','Toiletries','Stationary','Utensils & Equipment','Fuel & Gas','Safety','Other'].map(function(c){return '<option value="'+c+'"'+(e.category===c?' selected':'')+'>'+c+'</option>';}).join('')
          +'</select></div>'
        +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Quantity *</label><input id="kd-qty" type="number" min="0" step="0.01" value="'+(e.qty||'')+'" placeholder="0" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface);box-sizing:border-box"/></div>'
        +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Unit</label>'
          +'<select id="kd-unit" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)">'
          +['pcs','packets','litres','kg','boxes','bottles','rolls','pairs','sets','dozen'].map(function(u){return '<option value="'+u+'"'+(e.unit===u?' selected':'')+'>'+u+'</option>';}).join('')
          +'</select></div>'
        +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Min Alert Qty</label><input id="kd-min" type="number" min="0" step="0.01" value="'+(e.minQty||'')+'" placeholder="e.g. 2" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface);box-sizing:border-box"/></div>'
        +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Rate (₹/unit)</label><input id="kd-rate" type="number" min="0" step="0.01" value="'+(e.rate||'')+'" placeholder="0.00" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface);box-sizing:border-box"/></div>'
        +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Supplier</label><input id="kd-sup" value="'+(esc(e.supplier||''))+'" placeholder="Supplier name" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface);box-sizing:border-box"/></div>'
        +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Last Restocked</label><input type="date" id="kd-date" value="'+(e.lastDate||kitDate())+'" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface);box-sizing:border-box"/></div>'
        +'<div style="grid-column:1/-1"><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Notes</label><textarea id="kd-notes" rows="2" placeholder="Storage location, brand, etc." style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface);resize:vertical;box-sizing:border-box">'+(esc(e.notes||''))+'</textarea></div>'
      +'</div>'
      +'<div style="margin-top:14px;display:flex;gap:10px">'
        +'<button class="btn btn-primary" onclick="kitSaveDaily('+(kitDailyEdit?kitDailyEdit.id:'null')+')">💾 Save Item</button>'
      +'</div></div>';
  }
  var addBtn=isAdmin?'<button class="btn btn-primary" style="margin-left:auto" onclick="kitDailyFormOpen=true;kitDailyEdit=null;navigate(\'kitchen\')">➕ Add Item</button>':'';
  var rows=items.length ? items.slice().reverse().map(function(r){
    var qty=parseFloat(r.qty||0); var minQ=parseFloat(r.minQty||0);
    var isLow=minQ>0&&qty<=minQ;
    return '<tr style="background:'+(isLow?'#fef2f222':'')+';">'
      +'<td><b>'+esc(r.name)+'</b>'+(r.notes?'<br><span style="font-size:10px;color:var(--muted)">'+esc(r.notes)+'</span>':'')+'</td>'
      +'<td>'+kitBadge(r.category||'Other','teal')+'</td>'
      +'<td style="font-weight:700;color:'+(isLow?'#dc2626':'var(--text)')+'">'+qty+' '+esc(r.unit||'')+'</td>'
      +'<td style="color:var(--muted)">'+(r.minQty?r.minQty+' '+esc(r.unit||''):'-')+'</td>'
      +'<td>'+(r.rate?'₹'+parseFloat(r.rate).toFixed(2):'-')+'</td>'
      +'<td>'+esc(r.supplier||'-')+'</td>'
      +'<td>'+kitFmt(r.lastDate)+'</td>'
      +'<td>'+(isLow?kitBadge('Low','red'):kitBadge('OK','green'))+'</td>'
      +(isAdmin?'<td style="white-space:nowrap">'
        +'<button onclick="kitDailyEdit=kitLoad(\'daily_stock\').find(function(x){return x.id=='+parseInt(r.id,10)+'});kitDailyFormOpen=true;navigate(\'kitchen\')" style="padding:3px 10px;border-radius:6px;border:1px solid var(--border);background:var(--surface);font-size:11px;cursor:pointer;margin-right:4px">✏️</button>'
        +'<button onclick="kitDailyAdjust('+parseInt(r.id,10)+')" style="padding:3px 10px;border-radius:6px;border:1px solid #2563eb44;background:#eff6ff;color:#2563eb;font-size:11px;cursor:pointer;margin-right:4px">+/−</button>'
        +'<button onclick="kitDelDaily('+parseInt(r.id,10)+')" style="padding:3px 10px;border-radius:6px;border:1px solid #fca5a5;background:#fef2f2;color:#dc2626;font-size:11px;cursor:pointer">🗑</button>'
        +'</td>':'<td>'+kitFmt(r.lastDate)+'</td>')
      +'</tr>';
  }).join('') : '<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:32px">No daily stock items yet.</td></tr>';
  return kpiHtml+formHtml
    +'<div class="card"><div class="card-head"><span class="card-title">🧴 Daily Use Stock Register</span>'+addBtn+'</div>'
    +'<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px">'
      +'<input id="kit-daily-search" placeholder="🔍 Search..." oninput="_debouncedKitDaily()" style="padding:8px 12px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);min-width:200px"/>'
    +'</div>'
    +'<div id="kit-daily-table-wrap" style="overflow-x:auto"><table><thead><tr><th>Item</th><th>Category</th><th>Qty</th><th>Min Qty</th><th>Rate</th><th>Supplier</th><th>Last Restocked</th><th>Status</th><th>Action</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>';
}
function kitRenderDailyTable(){
  var search=(document.getElementById('kit-daily-search')||{}).value||'';
  var items=kitLoad('daily_stock').filter(function(i){return !search||esc(i.name).toLowerCase().includes(search.toLowerCase());});
  var wrap=document.getElementById('kit-daily-table-wrap');
  if(wrap){ var rows=items.length?items.slice().reverse().map(function(r){var qty=parseFloat(r.qty||0);var minQ=parseFloat(r.minQty||0);var isLow=minQ>0&&qty<=minQ;return '<tr>'+'<td><b>'+esc(r.name)+'</b></td><td>'+kitBadge(r.category||'Other','teal')+'</td><td style="font-weight:700;color:'+(isLow?'#dc2626':'var(--text)')+'">'+qty+' '+esc(r.unit||'')+'</td><td>'+(r.minQty?r.minQty+' '+esc(r.unit||''):'-')+'</td><td>'+(r.rate?'₹'+parseFloat(r.rate).toFixed(2):'-')+'</td><td>'+esc(r.supplier||'-')+'</td><td>'+kitFmt(r.lastDate)+'</td><td>'+(isLow?kitBadge('Low','red'):kitBadge('OK','green'))+'</td><td><button onclick="kitDailyEdit=kitLoad(\'daily_stock\').find(function(x){return x.id=='+parseInt(r.id,10)+'});kitDailyFormOpen=true;navigate(\'kitchen\')" style="padding:3px 10px;border-radius:6px;border:1px solid var(--border);background:var(--surface);font-size:11px;cursor:pointer;margin-right:4px">✏️</button><button onclick="kitDailyAdjust('+parseInt(r.id,10)+')" style="padding:3px 10px;border-radius:6px;border:1px solid #2563eb44;background:#eff6ff;color:#2563eb;font-size:11px;cursor:pointer;margin-right:4px">+/−</button><button onclick="kitDelDaily('+parseInt(r.id,10)+')" style="padding:3px 10px;border-radius:6px;border:1px solid #fca5a5;background:#fef2f2;color:#dc2626;font-size:11px;cursor:pointer">🗑</button></td></tr>';}).join(''):'<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:32px">No results found.</td></tr>';
  wrap.innerHTML='<table><thead><tr><th>Item</th><th>Category</th><th>Qty</th><th>Min Qty</th><th>Rate</th><th>Supplier</th><th>Last Restocked</th><th>Status</th><th>Action</th></tr></thead><tbody>'+rows+'</tbody></table>'; }
}
function kitSaveDaily(editId){
  var name=(document.getElementById('kd-name')||{}).value||'';
  var qty=(document.getElementById('kd-qty')||{}).value||'';
  if(!name.trim()||qty===''){showToast('Item name and quantity are required','#ef4444');return;}
  var items=kitLoad('daily_stock');
  var rec={
    id:editId||kitNextId(items),
    name:name.trim(),
    category:(document.getElementById('kd-cat')||{}).value||'Other',
    qty:parseFloat(qty),
    unit:(document.getElementById('kd-unit')||{}).value||'pcs',
    minQty:parseFloat((document.getElementById('kd-min')||{}).value)||0,
    rate:parseFloat((document.getElementById('kd-rate')||{}).value)||0,
    supplier:((document.getElementById('kd-sup')||{}).value||'').trim(),
    lastDate:(document.getElementById('kd-date')||{}).value||kitDate(),
    notes:((document.getElementById('kd-notes')||{}).value||'').trim()
  };
  if(editId){var idx=items.findIndex(function(x){return x.id==editId;});if(idx>-1){rec.addedOn=items[idx].addedOn;items[idx]=rec;}}
  else{rec.addedOn=kitDate();items.push(rec);}
  kitSave('daily_stock',items);
  kitAppendLog('daily',rec.name,(editId?'Updated':'Added'),rec.qty+' '+rec.unit);
  kitDailyFormOpen=false; kitDailyEdit=null;
  showToast((editId?'Item updated':'Item added')+': '+rec.name,'#16a34a');
  navigate('kitchen');
}
function kitDailyAdjust(id){
  var items=kitLoad('daily_stock');
  var item=items.find(function(x){return x.id==id;});
  if(!item)return;
  var delta=parseFloat(prompt('Adjust quantity for "'+item.name+'" (current: '+item.qty+' '+item.unit+')\nEnter +amount to add, -amount to deduct:',''));
  if(isNaN(delta))return;
  item.qty=Math.max(0,Math.round((parseFloat(item.qty||0)+delta)*100)/100);
  item.lastDate=kitDate();
  var idx=items.findIndex(function(x){return x.id==id;});
  if(idx>-1) items[idx]=item;
  kitSave('daily_stock',items);
  kitAppendLog('daily',item.name,(delta>0?'Restocked':'Used'),Math.abs(delta)+' '+item.unit+' → Balance: '+item.qty+' '+item.unit);
  showToast('Quantity updated for '+item.name,'#16a34a');
  navigate('kitchen');
}
function kitDelDaily(id){
  if(!confirm('Delete this item?'))return;
  kitSave('daily_stock',kitLoad('daily_stock').filter(function(x){return x.id!==id;}));
  showToast('Item deleted','#ef4444'); navigate('kitchen');
}
function kitAppendLog(type,item,action,detail){
  var logs=kitLoad('stock_log');
  logs.push({id:kitNextId(logs),type:type,item:item,action:action,detail:detail||'',on:kitDate(),by:currentUser?currentUser.name:'System'});
  if(logs.length>500) logs=logs.slice(-500);
  kitSave('stock_log',logs);
}
function renderKitLog(){
  var logs=kitLoad('stock_log').slice().reverse();
  var isAdmin=kitIsAdmin();
  var actionColors={'Added':'green','Updated':'blue','Stock In':'teal','Stock Out':'amber','Restocked':'teal','Used':'purple','Deleted':'red'};
  var filterHtml='<div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:16px">'
    +'<input id="kit-log-search" placeholder="🔍 Search log..." oninput="_debouncedKitLog()" style="padding:8px 12px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);min-width:200px"/>'
    +'<select id="kit-log-type" onchange="kitRenderLogTable()" style="padding:8px 12px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface)">'
    +'<option value="all">All Types</option><option value="stock">Kitchen Stock</option><option value="daily">Daily Stock</option><option value="menu">Menu</option>'
    +'</select>'
    +(isAdmin?'<button onclick="if(confirm(\'Clear all stock logs?\')){{kitSave(\'stock_log\',[]);navigate(\'kitchen\');}}" style="margin-left:auto;padding:7px 14px;border-radius:8px;border:1.5px solid #fca5a5;background:#fef2f2;color:#dc2626;font-size:12px;font-weight:700;cursor:pointer">🗑 Clear Log</button>':'')
    +'</div>';
  var rows=logs.length ? logs.slice(0,100).map(function(r){
    var col=actionColors[r.action]||'gray';
    return '<tr>'
      +'<td style="font-family:monospace;font-size:12px">'+kitFmt(r.on)+'</td>'
      +'<td>'+kitBadge(r.type==='stock'?'Kitchen':'Daily','blue')+'</td>'
      +'<td><b>'+esc(r.item)+'</b></td>'
      +'<td>'+kitBadge(r.action,col)+'</td>'
      +'<td style="font-size:12px;color:var(--muted)">'+esc(r.detail)+'</td>'
      +'<td style="font-size:12px;color:var(--muted)">'+esc(r.by)+'</td>'
      +'</tr>';
  }).join('') : '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:32px">No log entries yet.</td></tr>';
  return filterHtml
    +'<div class="card"><div class="card-head"><span class="card-title">📋 Stock Activity Log</span>'
    +'<span style="font-size:11px;color:var(--muted);font-family:monospace">'+logs.length+' entries (showing 100)</span></div>'
    +'<div id="kit-log-table-wrap" style="overflow-x:auto"><table><thead><tr><th>Date</th><th>Type</th><th>Item</th><th>Action</th><th>Detail</th><th>By</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>';
}
function kitRenderLogTable(){
  var search=(document.getElementById('kit-log-search')||{}).value||'';
  var type=(document.getElementById('kit-log-type')||{}).value||'all';
  var logs=kitLoad('stock_log').slice().reverse().filter(function(r){
    var matchS=!search||esc(r.item).toLowerCase().includes(search.toLowerCase())||esc(r.action).toLowerCase().includes(search.toLowerCase());
    var matchT=type==='all'||r.type===type;
    return matchS&&matchT;
  }).slice(0,100);
  var actionColors={'Added':'green','Updated':'blue','Stock In':'teal','Stock Out':'amber','Restocked':'teal','Used':'purple','Deleted':'red'};
  var rows=logs.length?logs.map(function(r){var col=actionColors[r.action]||'gray';return '<tr><td style="font-family:monospace;font-size:12px">'+kitFmt(r.on)+'</td><td>'+kitBadge(r.type==='stock'?'Kitchen':'Daily','blue')+'</td><td><b>'+esc(r.item)+'</b></td><td>'+kitBadge(r.action,col)+'</td><td style="font-size:12px;color:var(--muted)">'+esc(r.detail)+'</td><td style="font-size:12px;color:var(--muted)">'+esc(r.by)+'</td></tr>';}).join(''):'<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:32px">No results.</td></tr>';
  var wrap=document.getElementById('kit-log-table-wrap');
  if(wrap) wrap.innerHTML='<table><thead><tr><th>Date</th><th>Type</th><th>Item</th><th>Action</th><th>Detail</th><th>By</th></tr></thead><tbody>'+rows+'</tbody></table>';
}
function renderHostel(){
  var tabs=[
    {id:'leave',label:'Leave',icon:'🏠'},
    {id:'sick',label:'Sick Bay',icon:'🏥'},
    {id:'outpass',label:'Outpass',icon:'🚪'},
    {id:'outing',label:'Outing',icon:'🚌'},
    {id:'present',label:'Present / Roll Call',icon:'📋'},
    {id:'activities',label:'House Activities',icon:'🏆'},
    {id:'complaints',label:'Complaints',icon:'📣'}
  ];
  var tabBar=tabs.map(function(t){
    var active=t.id===hostelTab;
    return '<button onclick="setHostelTab(\''+t.id+'\')" style="padding:8px 14px;border-radius:8px;border:'+(active?'none':'1.5px solid var(--border)')+';cursor:pointer;font-size:12.5px;font-weight:'+(active?'700':'600')+';background:'+(active?'var(--accent)':'var(--surface)')+';color:'+(active?'#fff':'var(--muted)')+';white-space:nowrap;transition:all .15s">'+t.icon+' '+t.label+'</button>';
  }).join('');
  var body='';
  if(hostelTab==='leave')    body=renderHmLeave();
  if(hostelTab==='sick')     body=renderHmSick();
  if(hostelTab==='outpass')  body=renderHmOutpass();
  if(hostelTab==='outing')   body=renderHmOuting();
  if(hostelTab==='present')  body=renderHmPresent();
  if(hostelTab==='activities')body=renderHmActivities();
  if(hostelTab==='complaints')body=renderHmComplaints();
  return '<div class="page-header"><div class="page-header-eyebrow">Residential</div><div class="page-header-title">Hostel Management</div><div class="page-header-sub">Leave · Sick Bay · Outpass · Outing · Roll Call · Activities · Complaints</div></div>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;padding:4px 0">'+tabBar+'</div>'
    +body;
}
function renderHmLeave(){
  var data=hmLoad('leave');
  var isAdmin=currentUser&&(currentUser.role==='admin'||currentUser.role==='manager'||currentUser.role==='hostel');
  var formHtml='<div class="card" style="margin-bottom:18px"><div class="card-head"><span class="card-title">➕ New Leave Application</span></div>'
    +'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;padding:4px 0">'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Student</label><select id="hm-lv-stu" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)">'+hmStudentOptions('')+'</select></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">From Date</label><input type="date" id="hm-lv-from" value="'+hmDate()+'" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">To Date</label><input type="date" id="hm-lv-to" value="'+hmDate()+'" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Reason</label><input id="hm-lv-reason" placeholder="Reason for leave" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Guardian Contact</label><input id="hm-lv-contact" placeholder="Phone number" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'</div><div style="margin-top:14px;display:flex;gap:10px"><button class="btn btn-primary" onclick="hmAddLeave()">Save Application</button></div></div>';
  var allRows=data.slice().reverse().map(function(r){
    var stu=students.find(function(s){return s.id==r.stuId;})||{name:r.stuName||'--',cls:'--'};
    var days=r.from&&r.to?Math.round((new Date(r.to)-new Date(r.from))/(864e5))+1:'-';
    var _stu=students.find(function(s){return s.id==r.stuId;})||{name:r.stuName||'',cls:''};
    return {n:(_stu.name||'').toLowerCase(),c:(_stu.cls||'').toLowerCase(),h:'<tr>'
      +'<td>'+hmFmt(r.from)+' – '+hmFmt(r.to)+'</td>'
      +'<td><b>'+esc(stu.name)+'</b><br><span style="font-size:11px;color:var(--muted)">'+esc(stu.cls)+'</span></td>'
      +'<td>'+days+' day(s)</td>'
      +'<td>'+esc(r.reason||'--')+'</td>'
      +'<td>'+esc(r.contact||'--')+'</td>'
      +'<td>'+hmStatusBadge(r.status||'Pending')+'</td>'
      +(isAdmin?'<td style="white-space:nowrap">'
        +(r.status==='Pending'?'<button onclick="hmLeaveStatus('+parseInt(r.id,10)+',\'Approved\')" class="btn-sm-green" style="margin-right:4px">✓ Approve</button><button onclick="hmLeaveStatus('+parseInt(r.id,10)+',\'Rejected\')" class="btn-danger-sm">✗ Reject</button>':'')
        +(r.status==='Approved'?'<button onclick="hmLeaveStatus('+parseInt(r.id,10)+',\'Returned\')" class="btn-sm" style="margin-right:4px">🏠 Returned</button>':'')
        +'<button onclick="hmDelLeave('+parseInt(r.id,10)+')" class="btn-danger-sm" style="margin-left:4px">🗑</button>'
        +'</td>':'<td>'+hmFmt(r.appliedOn)+'</td>')
      +'</tr>'};
  });
  var q=hmSearchQ.toLowerCase();
  var filtered=q?allRows.filter(function(x){return x.n.indexOf(q)>=0||x.c.indexOf(q)>=0;}):allRows;
  var rows=filtered.length?filtered.map(function(x){return x.h;}).join(''):'<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:32px">No leave records yet.</td></tr>';
  return formHtml
    +'<div class="card"><div class="card-head" style="display:flex;align-items:center;flex-wrap:wrap;gap:8px"><span class="card-title">📋 Leave Register</span><span style="font-size:11px;color:var(--muted);font-family:monospace">'+data.length+' records'+(q?' &middot; '+filtered.length+' shown':'')+'</span>'+hmSearchBar('leave')+'</div>'
    +'<div style="overflow-x:auto"><table><thead><tr><th>Date Range</th><th>Student</th><th>Days</th><th>Reason</th><th>Guardian Contact</th><th>Status</th><th>Action</th></tr></thead>'
    +'<tbody>'+rows+'</tbody></table></div></div>';
}
function hmAddLeave(){
  var stuId=+document.getElementById('hm-lv-stu').value;
  var from=document.getElementById('hm-lv-from').value;
  var to=document.getElementById('hm-lv-to').value;
  var reason=document.getElementById('hm-lv-reason').value.trim();
  var contact=document.getElementById('hm-lv-contact').value.trim();
  if(!stuId){alert('Select a student.');return;}
  if(!from||!to){alert('Enter date range.');return;}
  var data=hmLoad('leave');
  var stu=students.find(function(s){return s.id==stuId;})||{};
  data.push({id:hmNextId(data),stuId:stuId,stuName:stu.name||'',from:from,to:to,reason:reason,contact:contact,status:'Pending',appliedOn:hmDate()});
  hmSave('leave',data);
  render();
}
function hmLeaveStatus(id,status){
  if(!currentUser||(['admin','manager','housemaster','hostel'].indexOf(currentUser.role)<0)){
    if(typeof showToast==='function')showToast('🔒 Access denied','#dc2626');
    return;
  }
  var data=hmLoad('leave');
  data=data.map(function(r){return r.id==id?Object.assign({},r,{status:status}):r;});
  hmSave('leave',data);render();
}
function hmDelLeave(id){
  if(!confirm('Delete this leave record?'))return;
  var data=hmLoad('leave').filter(function(r){return r.id!=id;});
  hmSave('leave',data);render();
}
function renderHmSick(){
  var data=hmLoad('sick');
  var isAdmin=currentUser&&(currentUser.role==='admin'||currentUser.role==='manager'||currentUser.role==='hostel');
  var formHtml='<div class="card" style="margin-bottom:18px"><div class="card-head"><span class="card-title">➕ New Sick Bay Entry</span></div>'
    +'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;padding:4px 0">'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Student</label><select id="hm-sk-stu" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)">'+hmStudentOptions('')+'</select></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Date Admitted</label><input type="date" id="hm-sk-date" value="'+hmDate()+'" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Symptoms / Ailment</label><input id="hm-sk-symptom" placeholder="e.g. Fever, Cold" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Medicine / Treatment</label><input id="hm-sk-medicine" placeholder="e.g. Paracetamol 500mg" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Referred to Hospital?</label><select id="hm-sk-referred" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"><option value="No">No</option><option value="Yes">Yes</option></select></div>'
    +'</div><div style="margin-top:14px"><button class="btn btn-primary" onclick="hmAddSick()">Save Entry</button></div></div>';
  var allRows=data.slice().reverse().map(function(r){
    var stu=students.find(function(s){return s.id==r.stuId;})||{name:r.stuName||'--',cls:'--'};
    var _stu=students.find(function(s){return s.id==r.stuId;})||{name:r.stuName||'',cls:''};
    return {n:(_stu.name||'').toLowerCase(),c:(_stu.cls||'').toLowerCase(),h:'<tr>'
      +'<td>'+hmFmt(r.date)+'</td>'
      +'<td><b>'+esc(stu.name)+'</b><br><span style="font-size:11px;color:var(--muted)">'+esc(stu.cls)+'</span></td>'
      +'<td>'+esc(r.symptom||'--')+'</td>'
      +'<td>'+esc(r.medicine||'--')+'</td>'
      +'<td>'+hmStatusBadge(r.referred==='Yes'?'Referred':'In Sick Bay')+'</td>'
      +'<td>'+hmStatusBadge(r.status||'Active')+'</td>'
      +(isAdmin?'<td style="white-space:nowrap">'
        +(r.status==='Active'?'<button onclick="hmSickDischarge('+parseInt(r.id,10)+')" class="btn-sm-green" style="margin-right:4px">✓ Discharge</button>':'')
        +'<button onclick="hmDelSick('+parseInt(r.id,10)+')" class="btn-danger-sm">🗑</button>'
        +'</td>':'<td></td>')
      +'</tr>'};
  });
  var q=hmSearchQ.toLowerCase();
  var filtered=q?allRows.filter(function(x){return x.n.indexOf(q)>=0||x.c.indexOf(q)>=0;}):allRows;
  var rows=filtered.length?filtered.map(function(x){return x.h;}).join(''):'<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:32px">No sick bay records.</td></tr>';
  return formHtml
    +'<div class="card"><div class="card-head" style="display:flex;align-items:center;flex-wrap:wrap;gap:8px"><span class="card-title">🏥 Sick Bay Register</span>'
    +'<span style="font-size:11px;color:var(--muted);font-family:monospace">Active: '+data.filter(function(r){return r.status==='Active';}).length+' | Total: '+data.length+'</span>'+hmSearchBar('sick')+'</div>'
    +'<div style="overflow-x:auto"><table><thead><tr><th>Date</th><th>Student</th><th>Symptoms</th><th>Medicine</th><th>Referred</th><th>Status</th><th>Action</th></tr></thead>'
    +'<tbody>'+rows+'</tbody></table></div></div>';
}
function hmAddSick(){
  var stuId=+document.getElementById('hm-sk-stu').value;
  var date=document.getElementById('hm-sk-date').value;
  var symptom=document.getElementById('hm-sk-symptom').value.trim();
  var medicine=document.getElementById('hm-sk-medicine').value.trim();
  var referred=document.getElementById('hm-sk-referred').value;
  if(!stuId){alert('Select a student.');return;}
  var data=hmLoad('sick');
  var stu=students.find(function(s){return s.id==stuId;})||{};
  data.push({id:hmNextId(data),stuId:stuId,stuName:stu.name||'',date:date,symptom:symptom,medicine:medicine,referred:referred,status:'Active'});
  hmSave('sick',data);render();
}
function hmSickDischarge(id){
  var data=hmLoad('sick');
  data=data.map(function(r){return r.id==id?Object.assign({},r,{status:'Discharged',dischargedOn:hmDate()}):r;});
  hmSave('sick',data);render();
}
function hmDelSick(id){
  if(!confirm('Delete this sick bay record?'))return;
  var data=hmLoad('sick').filter(function(r){return r.id!=id;});
  hmSave('sick',data);render();
}
function renderHmOutpass(){
  var data=hmLoad('outpass');
  var isAdmin=currentUser&&(currentUser.role==='admin'||currentUser.role==='manager'||currentUser.role==='hostel');
  var formHtml='<div class="card" style="margin-bottom:18px"><div class="card-head"><span class="card-title">➕ Issue Outpass</span></div>'
    +'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;padding:4px 0">'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Student</label><select id="hm-op-stu" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)">'+hmStudentOptions('')+'</select></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Date</label><input type="date" id="hm-op-date" value="'+hmDate()+'" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Out Time</label><input type="time" id="hm-op-out" value="10:00" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Return Time (Expected)</label><input type="time" id="hm-op-ret" value="17:00" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Purpose</label><input id="hm-op-purpose" placeholder="e.g. Medical, Personal" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Authorised By</label><input id="hm-op-auth" placeholder="House Master / Admin name" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'</div><div style="margin-top:14px"><button class="btn btn-primary" onclick="hmAddOutpass()">Issue Outpass</button></div></div>';
  var allRows=data.slice().reverse().map(function(r){
    var stu=students.find(function(s){return s.id==r.stuId;})||{name:r.stuName||'--',cls:'--'};
    var _stu=students.find(function(s){return s.id==r.stuId;})||{name:r.stuName||'',cls:''};
    return {n:(_stu.name||'').toLowerCase(),c:(_stu.cls||'').toLowerCase(),h:'<tr>'
      +'<td>'+hmFmt(r.date)+'</td>'
      +'<td><b>'+esc(stu.name)+'</b><br><span style="font-size:11px;color:var(--muted)">'+esc(stu.cls)+'</span></td>'
      +'<td>'+esc(r.outTime||'--')+' → '+(r.returnTime||'--')+'</td>'
      +'<td>'+esc(r.purpose||'--')+'</td>'
      +'<td>'+esc(r.authorisedBy||'--')+'</td>'
      +'<td>'+hmStatusBadge(r.status||'Out')+'</td>'
      +(isAdmin?'<td style="white-space:nowrap">'
        +(r.status==='Out'?'<button onclick="hmOutpassReturn('+parseInt(r.id,10)+')" class="btn-sm-green" style="margin-right:4px">✓ Returned</button>':'')
        +'<button onclick="hmDelOutpass('+parseInt(r.id,10)+')" class="btn-danger-sm">🗑</button>'
        +'</td>':'<td></td>')
      +'</tr>'};
  });
  var q=hmSearchQ.toLowerCase();
  var filtered=q?allRows.filter(function(x){return x.n.indexOf(q)>=0||x.c.indexOf(q)>=0;}):allRows;
  var rows=filtered.length?filtered.map(function(x){return x.h;}).join(''):'<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:32px">No outpass records.</td></tr>';
  var currentOut=data.filter(function(r){return r.status==='Out';}).length;
  return formHtml
    +'<div class="card"><div class="card-head" style="display:flex;align-items:center;flex-wrap:wrap;gap:8px"><span class="card-title">🚪 Outpass Register</span>'
    +'<span style="font-size:11px;color:var(--muted);font-family:monospace">Currently Out: '+currentOut+' | Total: '+data.length+'</span>'+hmSearchBar('outpass')+'</div>'
    +'<div style="overflow-x:auto"><table><thead><tr><th>Date</th><th>Student</th><th>Out → Return</th><th>Purpose</th><th>Auth. By</th><th>Status</th><th>Action</th></tr></thead>'
    +'<tbody>'+rows+'</tbody></table></div></div>';
}
function hmAddOutpass(){
  var stuId=+document.getElementById('hm-op-stu').value;
  var date=document.getElementById('hm-op-date').value;
  var outTime=document.getElementById('hm-op-out').value;
  var returnTime=document.getElementById('hm-op-ret').value;
  var purpose=document.getElementById('hm-op-purpose').value.trim();
  var authorisedBy=document.getElementById('hm-op-auth').value.trim();
  if(!stuId){alert('Select a student.');return;}
  var data=hmLoad('outpass');
  var stu=students.find(function(s){return s.id==stuId;})||{};
  data.push({id:hmNextId(data),stuId:stuId,stuName:stu.name||'',date:date,outTime:outTime,returnTime:returnTime,purpose:purpose,authorisedBy:authorisedBy,status:'Out'});
  hmSave('outpass',data);render();
}
function hmOutpassReturn(id){
  var data=hmLoad('outpass');
  data=data.map(function(r){return r.id==id?Object.assign({},r,{status:'Returned',actualReturn:new Date().toTimeString().slice(0,5)}):r;});
  hmSave('outpass',data);render();
}
function hmDelOutpass(id){
  if(!confirm('Delete outpass record?'))return;
  var data=hmLoad('outpass').filter(function(r){return r.id!=id;});
  hmSave('outpass',data);render();
}
function renderHmOuting(){
  var data=hmLoad('outing');
  var isAdmin=currentUser&&(currentUser.role==='admin'||currentUser.role==='manager'||currentUser.role==='hostel');
  var formHtml='<div class="card" style="margin-bottom:18px"><div class="card-head"><span class="card-title">➕ Schedule Outing</span></div>'
    +'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;padding:4px 0">'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Outing Title</label><input id="hm-ot-title" placeholder="e.g. Sunday Market Outing" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Date</label><input type="date" id="hm-ot-date" value="'+hmDate()+'" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Departure</label><input type="time" id="hm-ot-dep" value="08:00" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Expected Return</label><input type="time" id="hm-ot-ret" value="18:00" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">House</label><select id="hm-ot-house" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"><option value="All">All Houses</option>'+hmHouseOptions('')+'</select></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Destination</label><input id="hm-ot-dest" placeholder="Location / venue" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Escort / In-Charge</label><input id="hm-ot-escort" placeholder="Staff name" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">No. of Students</label><input type="number" id="hm-ot-count" placeholder="Count" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'</div><div style="margin-top:14px"><button class="btn btn-primary" onclick="hmAddOuting()">Add Outing</button></div></div>';
  var allRows=data.slice().reverse().map(function(r){
    return {n:(r.title||'').toLowerCase()+' '+(r.destination||'').toLowerCase()+' '+(r.house||'').toLowerCase()+' '+(r.escort||'').toLowerCase(),c:'',h:'<tr>'
      +'<td>'+hmFmt(r.date)+'</td>'
      +'<td><b>'+esc(r.title||'--')+'</b></td>'
      +'<td>'+esc(r.house||'All')+'</td>'
      +'<td>'+esc(r.destination||'--')+'</td>'
      +'<td>'+esc(r.departure||'--')+' → '+esc(r.expectedReturn||'--')+'</td>'
      +'<td>'+esc(r.escort||'--')+'</td>'
      +'<td>'+(r.studentCount||'--')+'</td>'
      +'<td>'+hmStatusBadge(r.status||'Scheduled')+'</td>'
      +(isAdmin?'<td style="white-space:nowrap">'
        +(r.status==='Scheduled'||r.status==='Out'?'<button onclick="hmOutingReturn('+parseInt(r.id,10)+')" class="btn-sm-green" style="margin-right:4px">✓ Returned</button>':'')
        +'<button onclick="hmDelOuting('+parseInt(r.id,10)+')" class="btn-danger-sm">🗑</button>'
        +'</td>':'<td></td>')
      +'</tr>'};
  });
  var q=hmSearchQ.toLowerCase();
  var filtered=q?allRows.filter(function(x){return x.n.indexOf(q)>=0;}):allRows;
  var rows=filtered.length?filtered.map(function(x){return x.h;}).join(''):(q?'<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:32px">No results for &ldquo;'+esc(hmSearchQ)+'&rdquo;</td></tr>':'<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:32px">No outings scheduled.</td></tr>');
  return formHtml
    +'<div class="card"><div class="card-head" style="display:flex;align-items:center;flex-wrap:wrap;gap:8px"><span class="card-title">🚌 Outing Register</span><span style="font-size:11px;color:var(--muted);font-family:monospace">'+data.length+' records'+(q?' &middot; '+filtered.length+' shown':'')+'</span>'+hmSearchBar('outing')+'</div>'
    +'<div style="overflow-x:auto"><table><thead><tr><th>Date</th><th>Title</th><th>House</th><th>Destination</th><th>Departure → Return</th><th>In-Charge</th><th>Students</th><th>Status</th><th>Action</th></tr></thead>'
    +'<tbody>'+rows+'</tbody></table></div></div>';
}
function hmAddOuting(){
  var title=document.getElementById('hm-ot-title').value.trim();
  var date=document.getElementById('hm-ot-date').value;
  var departure=document.getElementById('hm-ot-dep').value;
  var expectedReturn=document.getElementById('hm-ot-ret').value;
  var house=document.getElementById('hm-ot-house').value;
  var destination=document.getElementById('hm-ot-dest').value.trim();
  var escort=document.getElementById('hm-ot-escort').value.trim();
  var studentCount=document.getElementById('hm-ot-count').value;
  if(!title){alert('Enter outing title.');return;}
  var data=hmLoad('outing');
  data.push({id:hmNextId(data),title:title,date:date,departure:departure,expectedReturn:expectedReturn,house:house,destination:destination,escort:escort,studentCount:studentCount,status:'Scheduled'});
  hmSave('outing',data);render();
}
function hmOutingReturn(id){
  var data=hmLoad('outing');
  data=data.map(function(r){return r.id==id?Object.assign({},r,{status:'Returned',actualReturn:hmDate()}):r;});
  hmSave('outing',data);render();
}
function hmDelOuting(id){
  if(!confirm('Delete this outing record?'))return;
  var data=hmLoad('outing').filter(function(r){return r.id!=id;});
  hmSave('outing',data);render();
}
function renderHmPresent(){
  var data=hmLoad('present');
  var today=hmDate();
  var isAdmin=currentUser&&(currentUser.role==='admin'||currentUser.role==='manager'||currentUser.role==='hostel');
  var sessions=['Morning (06:00)','Afternoon (14:00)','Night (22:00)'];
  // Check if today's roll call taken
  var todaySessions=data.filter(function(r){return r.date===today;});
  var sessionsDone=todaySessions.map(function(r){return r.session;});
  var sessionBtns=sessions.map(function(sess){
    var done=sessionsDone.indexOf(sess)>=0;
    return '<button onclick="hmTakeRollCall(\''+sess+'\')" '+(done?'disabled style="opacity:.5;cursor:default"':'')+' class="btn '+(done?'btn-outline':'btn-primary')+'" style="margin-right:8px">'+(done?'✓ ':'')+'Roll Call: '+sess+'</button>';
  }).join('');
  // History
  var q=hmSearchQ.toLowerCase();
  var filtData=q?data.filter(function(r){return (r.date||'').indexOf(q)>=0||(r.session||'').toLowerCase().indexOf(q)>=0||(r.house||'').toLowerCase().indexOf(q)>=0;}):data;
  var rows=filtData.length?filtData.slice().reverse().map(function(r){
    return '<tr>'
      +'<td>'+hmFmt(r.date)+'</td>'
      +'<td>'+esc(r.session||'--')+'</td>'
      +'<td>'+(r.house||'All')+'</td>'
      +'<td style="color:#16a34a;font-weight:700">'+r.present+'</td>'
      +'<td style="color:#dc2626;font-weight:700">'+r.absent+'</td>'
      +'<td style="color:#f59e0b;font-weight:700">'+(r.sick||0)+'</td>'
      +'<td style="color:#3b78c9;font-weight:700">'+(r.leave||0)+'</td>'
      +'<td style="color:#8b5cf6;font-weight:700">'+(r.outpass||0)+'</td>'
      +'<td>'+esc(r.takenBy||'--')+'</td>'
      +(isAdmin?'<td><button onclick="hmDelPresent('+parseInt(r.id,10)+')" class="btn-danger-sm">🗑</button></td>':'')
      +'</tr>';
  }).join(''):(q?'<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:32px">No results for &ldquo;'+esc(hmSearchQ)+'&rdquo;</td></tr>':'<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:32px">No roll call records.</td></tr>');
  return '<div class="card" style="margin-bottom:18px"><div class="card-head"><span class="card-title">📋 Take Roll Call -- '+hmFmt(today)+'</span></div>'
    +'<p style="font-size:13px;color:var(--muted);margin-bottom:12px">Auto-counts students on Leave/Sick/Outpass from today\'s records. Remaining are marked Present.</p>'
    +sessionBtns+'</div>'
    +'<div class="card"><div class="card-head" style="display:flex;align-items:center;flex-wrap:wrap;gap:8px"><span class="card-title">📅 Roll Call History</span><span style="font-size:11px;color:var(--muted);font-family:monospace">'+data.length+' sessions</span>'+'<div style="display:flex;align-items:center;gap:8px;margin-left:auto"><div style="position:relative;display:flex;align-items:center"><span style="position:absolute;left:9px;font-size:14px;pointer-events:none;color:var(--muted)">🔍</span><input type="text" placeholder="Filter by date / session…" oninput="hmSetSearch(this.value)" value="'+esc(hmSearchQ)+'" style="padding:6px 10px 6px 30px;border-radius:8px;border:1.5px solid var(--border);font-size:12.5px;width:200px;background:var(--surface);color:var(--text)"/>'+(hmSearchQ?'<button onclick="hmSetSearch(\'\')" style="position:absolute;right:7px;background:none;border:none;cursor:pointer;font-size:13px;color:var(--muted);padding:0;line-height:1">✕</button>':'')+' </div></div>'+'</div>'
    +'<div style="overflow-x:auto"><table><thead><tr><th>Date</th><th>Session</th><th>House</th><th style="color:#16a34a">Present</th><th style="color:#dc2626">Absent</th><th style="color:#f59e0b">Sick</th><th style="color:#3b78c9">Leave</th><th style="color:#8b5cf6">Outpass</th><th>Taken By</th>'+(isAdmin?'<th>Action</th>':'')+'</tr></thead>'
    +'<tbody>'+rows+'</tbody></table></div></div>';
}
function hmTakeRollCall(session){
  var today=hmDate();
  var sickToday=hmLoad('sick').filter(function(r){return r.status==='Active';}).length;
  var leaveToday=hmLoad('leave').filter(function(r){return r.from<=today&&r.to>=today&&r.status==='Approved';}).length;
  var outpassToday=hmLoad('outpass').filter(function(r){return r.date===today&&r.status==='Out';}).length;
  var hostelStudents=students.filter(function(s){return s.hostel==='Yes';}).length;
  var absent=sickToday+leaveToday+outpassToday;
  var present=Math.max(0,hostelStudents-absent);
  var data=hmLoad('present');
  data.push({id:hmNextId(data),date:today,session:session,house:'All',present:present,absent:absent,sick:sickToday,leave:leaveToday,outpass:outpassToday,takenBy:currentUser?currentUser.name:'--'});
  hmSave('present',data);
  alert('✓ Roll Call recorded!\nHostel Students: '+hostelStudents+'\nPresent: '+present+'\nAbsent: '+absent+' (Sick: '+sickToday+', Leave: '+leaveToday+', Outpass: '+outpassToday+')');
  render();
}
function hmDelPresent(id){
  if(!confirm('Delete roll call record?'))return;
  var data=hmLoad('present').filter(function(r){return r.id!=id;});
  hmSave('present',data);render();
}
function renderHmActivities(){
  var data=hmLoad('activities');
  var isAdmin=currentUser&&(currentUser.role==='admin'||currentUser.role==='manager'||currentUser.role==='hostel');
  var cats=['Sports','Cultural','Academic','Cleanliness','Discipline','Social Service','Other'];
  var formHtml='<div class="card" style="margin-bottom:18px"><div class="card-head"><span class="card-title">➕ Log House Activity</span></div>'
    +'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;padding:4px 0">'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Activity Title</label><input id="hm-ac-title" placeholder="e.g. Inter-House Football" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Category</label><select id="hm-ac-cat" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)">'+cats.map(function(c){return '<option>'+c+'</option>';}).join('')+'</select></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Date</label><input type="date" id="hm-ac-date" value="'+hmDate()+'" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">House</label><select id="hm-ac-house" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"><option value="All">All Houses</option>'+hmHouseOptions('')+'</select></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Winner / Position</label><input id="hm-ac-winner" placeholder="1st: Kombirei, 2nd: Loktak…" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Points Awarded</label><input type="number" id="hm-ac-pts" placeholder="e.g. 10" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'<div style="grid-column:1/-1"><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Description / Notes</label><input id="hm-ac-desc" placeholder="Details about the activity" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'</div><div style="margin-top:14px"><button class="btn btn-primary" onclick="hmAddActivity()">Log Activity</button></div></div>';
  // House points tally
  var houses=['KOMBIREI','LOKTAK','SINGAREI','KANGLA','KOUBRU','SHIROI','SANGAI','SANAREI','NONGIN'];
  var houseColors={'KOMBIREI':'#e63946','LOKTAK':'#3b78c9','SINGAREI':'#f59e0b','KANGLA':'#16a34a','KOUBRU':'#8b5cf6','SHIROI':'#0891b2','SANGAI':'#ec4899','SANAREI':'#94a3b8','NONGIN':'#2563eb'};
  var pointsTally={};
  houses.forEach(function(h){pointsTally[h]=0;});
  data.forEach(function(r){
    if(r.house&&r.house!=='All'&&pointsTally[r.house]!==undefined&&r.points){
      pointsTally[r.house]+=(+r.points||0);
    }
  });
  var sorted=houses.slice().sort(function(a,b){return pointsTally[b]-pointsTally[a];});
  var tallyCards=sorted.map(function(h,i){
    return '<div style="background:var(--surface);border:1.5px solid var(--border);border-radius:12px;padding:14px 18px;display:flex;align-items:center;gap:12px;flex:1;min-width:140px">'
      +'<div style="width:32px;height:32px;border-radius:50%;background:'+(houseColors[h]||'#64748b')+';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:13px">'+(i+1)+'</div>'
      +'<div><div style="font-weight:700;font-size:13px">'+h+'</div><div style="font-size:18px;font-weight:800;color:'+(houseColors[h]||'#64748b')+'">'+pointsTally[h]+' pts</div></div>'
      +'</div>';
  }).join('');
  var allRows=data.slice().reverse().map(function(r){
    return {n:(r.title||'').toLowerCase()+' '+(r.house||'').toLowerCase()+' '+(r.winner||'').toLowerCase()+' '+(r.category||'').toLowerCase(),c:'',h:'<tr>'
      +'<td>'+hmFmt(r.date)+'</td>'
      +'<td><b>'+esc(r.title||'--')+'</b></td>'
      +'<td><span style="padding:2px 8px;border-radius:10px;font-size:10.5px;background:var(--surface2);color:var(--muted)">'+esc(r.category||'--')+'</span></td>'
      +'<td>'+esc(r.house||'All')+'</td>'
      +'<td>'+esc(r.winner||'--')+'</td>'
      +'<td style="font-weight:700;color:#3b78c9">'+(r.points||'--')+'</td>'
      +'<td>'+esc(r.description||'--')+'</td>'
      +(isAdmin?'<td><button onclick="hmDelActivity('+parseInt(r.id,10)+')" class="btn-danger-sm">🗑</button></td>':'')
      +'</tr>'};
  });
  var q=hmSearchQ.toLowerCase();
  var filtered=q?allRows.filter(function(x){return x.n.indexOf(q)>=0;}):allRows;
  var rows=filtered.length?filtered.map(function(x){return x.h;}).join(''):(q?'<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:32px">No results for &ldquo;'+esc(hmSearchQ)+'&rdquo;</td></tr>':'<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:32px">No activities logged.</td></tr>');
  return formHtml
    +'<div class="card" style="margin-bottom:18px"><div class="card-head"><span class="card-title">🏆 House Points Leaderboard</span></div>'
    +'<div style="display:flex;flex-wrap:wrap;gap:12px">'+tallyCards+'</div></div>'
    +'<div class="card"><div class="card-head" style="display:flex;align-items:center;flex-wrap:wrap;gap:8px"><span class="card-title">📅 Activity Log</span><span style="font-size:11px;color:var(--muted);font-family:monospace">'+data.length+' activities'+(q?' &middot; '+filtered.length+' shown':'')+'</span>'+hmSearchBar('activities')+'</div>'
    +'<div style="overflow-x:auto"><table><thead><tr><th>Date</th><th>Activity</th><th>Category</th><th>House</th><th>Winner/Position</th><th>Points</th><th>Notes</th>'+(isAdmin?'<th>Action</th>':'')+'</tr></thead>'
    +'<tbody>'+rows+'</tbody></table></div></div>';
}
function hmAddActivity(){
  var title=document.getElementById('hm-ac-title').value.trim();
  var category=document.getElementById('hm-ac-cat').value;
  var date=document.getElementById('hm-ac-date').value;
  var house=document.getElementById('hm-ac-house').value;
  var winner=document.getElementById('hm-ac-winner').value.trim();
  var points=document.getElementById('hm-ac-pts').value;
  var description=document.getElementById('hm-ac-desc').value.trim();
  if(!title){alert('Enter activity title.');return;}
  var data=hmLoad('activities');
  data.push({id:hmNextId(data),title:title,category:category,date:date,house:house,winner:winner,points:points?+points:0,description:description,loggedBy:currentUser?currentUser.name:'--'});
  hmSave('activities',data);render();
}
function hmDelActivity(id){
  if(!confirm('Delete this activity record?'))return;
  var data=hmLoad('activities').filter(function(r){return r.id!=id;});
  hmSave('activities',data);render();
}
function renderHmComplaints(){
  var data=hmLoad('complaints');
  var isAdmin=currentUser&&(currentUser.role==='admin'||currentUser.role==='manager'||currentUser.role==='hostel');
  var types=['Food Quality','Maintenance','Bullying','Theft','Cleanliness','Staff Behaviour','Medical Negligence','Other'];
  var formHtml='<div class="card" style="margin-bottom:18px"><div class="card-head"><span class="card-title">➕ Log New Complaint</span></div>'
    +'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;padding:4px 0">'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Complainant (Student)</label><select id="hm-cp-stu" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"><option value="">-- Anonymous / General --</option>'+hmStudentOptions('')+'</select></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Complaint Type</label><select id="hm-cp-type" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)">'+types.map(function(t){return '<option>'+t+'</option>';}).join('')+'</select></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Date</label><input type="date" id="hm-cp-date" value="'+hmDate()+'" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Priority</label><select id="hm-cp-pri" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"><option>Low</option><option selected>Medium</option><option>High</option><option>Urgent</option></select></div>'
    +'<div style="grid-column:1/-1"><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Complaint Details</label><input id="hm-cp-detail" placeholder="Describe the complaint in detail" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'</div><div style="margin-top:14px"><button class="btn btn-primary" onclick="hmAddComplaint()">Submit Complaint</button></div></div>';
  var priColors={Low:'#16a34a',Medium:'#f59e0b',High:'#dc2626',Urgent:'#7c3aed'};
  var allRows=data.slice().reverse().map(function(r){
    var stu=r.stuId?students.find(function(s){return s.id==r.stuId;}):null;
    var stuName=stu?stu.name:'Anonymous';
    var _stu=students.find(function(s){return s.id==r.stuId;})||{name:r.stuName||'',cls:''};
    return {n:(_stu.name||'').toLowerCase(),c:(_stu.cls||'').toLowerCase(),h:'<tr>'
      +'<td>'+hmFmt(r.date)+'</td>'
      +'<td><b>'+esc(stuName)+'</b></td>'
      +'<td>'+esc(r.type||'--')+'</td>'
      +'<td style="max-width:220px;white-space:normal;word-break:break-word">'+esc(r.detail||'--')+'</td>'
      +'<td><span style="padding:2px 8px;border-radius:10px;font-size:10.5px;font-weight:700;background:'+(priColors[r.priority]||'#64748b')+'22;color:'+(priColors[r.priority]||'#64748b')+'">'+esc(r.priority||'--')+'</span></td>'
      +'<td>'+hmStatusBadge(r.status||'Open')+'</td>'
      +'<td style="max-width:160px;white-space:normal;word-break:break-word;font-size:11.5px;color:var(--muted)">'+esc(r.resolution||'Pending')+'</td>'
      +(isAdmin?'<td style="white-space:nowrap">'
        +(r.status==='Open'?'<button onclick="hmResolveComplaint('+parseInt(r.id,10)+')" class="btn-sm-green" style="margin-right:4px">✓ Resolve</button>':'')
        +'<button onclick="hmDelComplaint('+parseInt(r.id,10)+')" class="btn-danger-sm">🗑</button>'
        +'</td>':'<td></td>')
      +'</tr>'};
  });
  var q=hmSearchQ.toLowerCase();
  var filtered=q?allRows.filter(function(x){return x.n.indexOf(q)>=0||x.c.indexOf(q)>=0;}):allRows;
  var rows=filtered.length?filtered.map(function(x){return x.h;}).join(''):(q?'<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:32px">No results for &ldquo;'+esc(hmSearchQ)+'&rdquo;</td></tr>':'<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:32px">No complaints recorded.</td></tr>');
  var openCount=data.filter(function(r){return r.status==='Open';}).length;
  return formHtml
    +'<div class="card"><div class="card-head" style="display:flex;align-items:center;flex-wrap:wrap;gap:8px"><span class="card-title">📣 Complaints Register</span>'
    +'<span style="font-size:11px;color:var(--muted);font-family:monospace">Open: <b style="color:#dc2626">'+openCount+'</b> | Total: '+data.length+'</span>'+hmSearchBar('complaints')+'</div>'
    +'<div style="overflow-x:auto"><table><thead><tr><th>Date</th><th>Student</th><th>Type</th><th>Details</th><th>Priority</th><th>Status</th><th>Resolution</th><th>Action</th></tr></thead>'
    +'<tbody>'+rows+'</tbody></table></div></div>';
}
function hmAddComplaint(){
  var stuId=+document.getElementById('hm-cp-stu').value||null;
  var type=document.getElementById('hm-cp-type').value;
  var date=document.getElementById('hm-cp-date').value;
  var priority=document.getElementById('hm-cp-pri').value;
  var detail=document.getElementById('hm-cp-detail').value.trim();
  if(!detail){alert('Enter complaint details.');return;}
  var data=hmLoad('complaints');
  data.push({id:hmNextId(data),stuId:stuId,type:type,date:date,priority:priority,detail:detail,status:'Open',loggedBy:currentUser?currentUser.name:'--'});
  hmSave('complaints',data);render();
}
function hmResolveComplaint(id){
  var resolution=prompt('Enter resolution / action taken:','');
  if(resolution===null)return;
  var data=hmLoad('complaints');
  data=data.map(function(r){return r.id==id?Object.assign({},r,{status:'Resolved',resolution:resolution||'Resolved',resolvedOn:hmDate(),resolvedBy:currentUser?currentUser.name:'--'}):r;});
  hmSave('complaints',data);render();
}
function hmDelComplaint(id){
  if(!confirm('Delete this complaint record?'))return;
  var data=hmLoad('complaints').filter(function(r){return r.id!=id;});
  hmSave('complaints',data);render();
}
var HM_HOUSES = [];
/* Houses are configured per school by the admin after login. No hardcoded house names. */
function hmsMastGet(key){ try{var s=localStorage.getItem('gnsi_hms_'+key); if(s)return JSON.parse(s);}catch(e){} return {}; }
function hmsMastSet(key,v){
  localStorage.setItem('gnsi_hms_'+key, JSON.stringify(v));if(typeof gnsiKVPush==='function')gnsiKVPush('gnsi_hms_'+key,v);
  if(key==='student_house') _houseMapCache=v;  // PERF: keep cache in sync for any HMS write
}
function hmsArr(key){ try{var s=localStorage.getItem('gnsi_hmsa_'+key); if(s)return JSON.parse(s);}catch(e){} return []; }
function hmsArrSet(key,v){ localStorage.setItem('gnsi_hmsa_'+key, JSON.stringify(v));if(typeof gnsiKVPush==='function')gnsiKVPush('gnsi_hmsa_'+key,v); }
function hmsNextId(arr){ return arr.length ? Math.max.apply(null,arr.map(function(x){return x.id||0}))+1 : 1; }
function hmsFmt(d){ try{return new Date(d+' ').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}catch(e){return d||'--';} }
function hmsDate(){ return new Date().toISOString().split('T')[0]; }
function hmsGetAssignedHouse(staffId){
  var map = hmsMastGet('assignments'); // {staffId: houseName}
  return map[String(staffId)] || null;
}
function hmsSetAssignedHouse(staffId, house){
  var map = hmsMastGet('assignments');
  map[String(staffId)] = house;
  hmsMastSet('assignments', map);
}
function hmsGetStudentsForHouse(house){
  var map = hmsMastGet('student_house'); // {studentId: houseName}
  return students.filter(function(s){ return s.hostel==='Yes' && map[String(s.id)]===house; });
}
function hmsGetHouseForStudent(stuId){
  var map = hmsMastGet('student_house');
  return map[String(stuId)] || '--';
}
function hmsAssignStudentHouse(stuId, house){
  var map = hmsMastGet('student_house');
  map[String(stuId)] = house;
  hmsMastSet('student_house', map);
}
var hmsMasterTab = 'overview';
function setHmsMasterTab(t){ hmsMasterTab=t; hmsRCState=null; render(); }
function hmsSeverityBadge(s){
  var col = s==='High'||s==='Critical'||s==='Urgent' ? '#dc2626' : s==='Medium'||s==='Moderate' ? '#f59e0b' : '#16a34a';
  return '<span style="padding:2px 9px;border-radius:10px;font-size:10.5px;font-weight:700;background:'+col+'22;color:'+col+';border:1px solid '+col+'55">'+esc(s)+'</span>';
}
function hmsStatusBadge(s){
  var col = s==='Resolved'||s==='Completed'||s==='Healthy'||s==='Present' ? '#16a34a'
          : s==='Open'||s==='Pending'||s==='Absent' ? '#dc2626'
          : s==='Monitoring'||s==='Improving' ? '#f59e0b' : '#3b78c9';
  return '<span style="padding:2px 9px;border-radius:10px;font-size:10.5px;font-weight:700;background:'+col+'22;color:'+col+';border:1px solid '+col+'55">'+esc(s)+'</span>';
}
/* ══ GNSI Custom House Management ══════════════════════════════════
   Custom houses added by admin are stored in localStorage under
   'gnsi_custom_houses' as an array of {id, color, icon} objects.
   On load they are merged into every house list / color / icon map
   so the whole portal picks them up immediately.
   ═══════════════════════════════════════════════════════════════ */
var _GNSI_BUILTIN_HOUSES = []; /* Populated dynamically from Supabase per school */
function gnsiLoadCustomHouses(){
  try{ return JSON.parse(localStorage.getItem('gnsi_custom_houses')||'[]'); }catch(e){ return []; }
}
/* Pull custom houses from Supabase KV into localStorage so gnsiLoadCustomHouses() is up-to-date */
async function gnsiSyncCustomHousesFromCloud(){
  try{
    var sb = (typeof _getSb === 'function') ? _getSb() : null;
    if(!sb) return;
    var res = await sb.from('gnsi_keyvalue').select('value').eq('key','gnsi_custom_houses').single();
    if(res && res.data && res.data.value){
      var arr = Array.isArray(res.data.value) ? res.data.value : JSON.parse(res.data.value);
      localStorage.setItem('gnsi_custom_houses', JSON.stringify(arr));if(typeof gnsiKVPush==='function')gnsiKVPush('gnsi_custom_houses',arr);
      // Patch live arrays
      arr.forEach(function(h){ gnsiPatchHouseArrays(h.id, h.color, h.icon||'🏠'); });
    }
  }catch(e){ (void 0); }
}
function gnsiSaveCustomHouses(arr){
  try{ localStorage.setItem('gnsi_custom_houses', JSON.stringify(arr)); }catch(e){}
  // Sync to Supabase gnsi_keyvalue so all devices get updated
  if(typeof gnsiKVPush === 'function'){
    gnsiKVPush('gnsi_custom_houses', arr);
  }
}
function gnsiGetAllHouseIds(){
  var custom = gnsiLoadCustomHouses().map(function(h){ return h.id; });
  return _GNSI_BUILTIN_HOUSES.concat(custom.filter(function(id){ return _GNSI_BUILTIN_HOUSES.indexOf(id)<0; }));
}
function gnsiGetHouseColors(){
  var c={KOMBIREI:'#e63946',LOKTAK:'#3b78c9',SINGAREI:'#f59e0b',KANGLA:'#16a34a',KOUBRU:'#8b5cf6',SHIROI:'#0891b2',SANGAI:'#ec4899',SANAREI:'#94a3b8',NONGIN:'#2563eb'};
  gnsiLoadCustomHouses().forEach(function(h){ c[h.id]=h.color; });
  return c;
}
function gnsiGetHouseIcons(){
  var ic={KOMBIREI:'🔴',LOKTAK:'🔵',SINGAREI:'🟡',KANGLA:'🟢',KOUBRU:'🟣',SHIROI:'🩵',SANGAI:'🩷',SANAREI:'⚪',NONGIN:'🔷'};
  gnsiLoadCustomHouses().forEach(function(h){ ic[h.id]=h.icon||'🏠'; });
  return ic;
}
/* Patch all live house arrays / objects after a new house is added */
function gnsiPatchHouseArrays(newId, newColor, newIcon){
  if(typeof HM_HOUSES !== 'undefined' && Array.isArray(HM_HOUSES)){
    if(!HM_HOUSES.find(function(h){ return h.id===newId; }))
      HM_HOUSES.push({id:newId, color:newColor, icon:newIcon});
  }
  if(typeof _HMS_HOUSES !== 'undefined' && Array.isArray(_HMS_HOUSES)){
    if(_HMS_HOUSES.indexOf(newId)<0) _HMS_HOUSES.push(newId);
  }
}
/* Called by the Add House form */
function gnsiSaveNewHouse(){
  var nameEl  = document.getElementById('gh-name');
  var colorEl = document.getElementById('gh-color');
  var iconEl  = document.getElementById('gh-icon');
  if(!nameEl||!colorEl) return;
  var name  = (nameEl.value||'').trim().toUpperCase().replace(/[^A-Z0-9 ]/g,'').replace(/\s+/g,' ');
  var color = colorEl.value||'#64748b';
  var icon  = (iconEl.value||'').trim()||'🏠';
  if(!name){ showToast('Please enter a house name','#ef4444'); return; }
  var allIds = gnsiGetAllHouseIds();
  if(allIds.indexOf(name)>=0){ showToast('House "'+name+'" already exists','#f59e0b'); return; }
  var custom = gnsiLoadCustomHouses();
  custom.push({id:name, color:color, icon:icon});
  gnsiSaveCustomHouses(custom);
  gnsiPatchHouseArrays(name, color, icon);
  showToast('✅ House "'+name+'" added successfully!','#16a34a');
  window._houseAddForm = false;
  render();
}
/* Called by delete button on custom houses */
function gnsiDeleteCustomHouse(id){
  if(!confirm('Delete house "'+id+'"? Students assigned to this house will become unassigned.')) return;
  var custom = gnsiLoadCustomHouses().filter(function(h){ return h.id!==id; });
  gnsiSaveCustomHouses(custom);
  if(typeof HM_HOUSES!=='undefined') HM_HOUSES = HM_HOUSES.filter(function(h){ return h.id!==id; });
  if(typeof _HMS_HOUSES!=='undefined') _HMS_HOUSES = _HMS_HOUSES.filter(function(id2){ return id2!==id; });
  showToast('House deleted','#ef4444');
  window._houseAddForm = false;
  render();
}
var _houseAddForm = false;
function renderHouse(){
  /* Merge built-in + admin-added custom houses */
  var HM_HOUSES_LIST = gnsiGetAllHouseIds();
  var houseColors    = gnsiGetHouseColors();
  var houseIcons     = gnsiGetHouseIcons();
  var isAdmin = currentUser && currentUser.role==='admin';
  var customHouses = gnsiLoadCustomHouses();
  var studentHouseMap = hmsMastGet('student_house');
  var assignmentMap   = hmsMastGet('assignments');
  // Count boarders per house
  var boarderCount = {};
  HM_HOUSES_LIST.forEach(function(h){ boarderCount[h]=0; });
  students.forEach(function(s){
    if(s.hostel==='Yes'){
      var h = studentHouseMap[String(s.id)];
      if(h && boarderCount[h]!==undefined) boarderCount[h]++;
    }
  });
  // Count house masters/mistresses per house
  var hmCount = {};
  HM_HOUSES_LIST.forEach(function(h){ hmCount[h]=[]; });
  staff.forEach(function(m){
    var h = assignmentMap[String(m.id)];
    if(h && hmCount[h]!==undefined) hmCount[h].push(m.name);
  });
  // House points from activities
  var housePoints = {};
  HM_HOUSES_LIST.forEach(function(h){ housePoints[h]=0; });
  try{
    var acts = hmsMastGet('activities')||[];
    acts.forEach(function(a){
      if(a.house && housePoints[a.house]!==undefined && a.points)
        housePoints[a.house]+=(parseInt(a.points)||0);
    });
  }catch(e){}
  var sortedByPoints = HM_HOUSES_LIST.slice().sort(function(a,b){
    return (housePoints[b]||0)-(housePoints[a]||0);
  });
  // -- Header --
  var html = '<div class="page-header">'
    +'<div class="page-header-eyebrow">GNSI -- HOSTEL DIVISION</div>'
    +'<div class="page-header-title">🏠 House Overview</div>'
    +'<div class="page-header-sub">All houses · Boarders · House Masters &amp; Mistresses · Points tally</div>'
    +'</div>';
  // -- Points leaderboard strip --
  html += '<div class="card" style="margin-bottom:20px;padding:16px 20px">'
    +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">'
      +'<span style="font-size:17px">🏆</span>'
      +'<span style="font-size:14px;font-weight:800;color:var(--text)">House Points Leaderboard</span>'
      +'<button onclick="navigate(\'housemaster\');hmsMasterTab=\'activities\';hmsActTab=\'points\'" style="margin-left:auto;padding:4px 12px;border-radius:7px;border:1px solid #c4b5fd;background:#f5f3ff;color:#7c3aed;font-size:11px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">Full Tally →</button>'
    +'</div>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap">';
  sortedByPoints.forEach(function(h,i){
    var col = houseColors[h]||'#64748b';
    var pts = housePoints[h]||0;
    html += '<div style="display:flex;align-items:center;gap:7px;padding:7px 14px;border-radius:10px;background:'+col+'12;border:1.5px solid '+col+'44;min-width:110px">'
      +'<span style="font-size:16px">'+(i===0?'🥇':i===1?'🥈':i===2?'🥉':houseIcons[h])+'</span>'
      +'<div><div style="font-size:11px;font-weight:800;color:'+col+'">'+h+'</div>'
      +'<div style="font-size:13px;font-weight:700;color:var(--text)">'+pts+' pts</div></div>'
    +'</div>';
  });
  html += '</div></div>';
  // -- House cards grid --
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;margin-bottom:24px">';
  HM_HOUSES_LIST.forEach(function(h){
    var col   = houseColors[h]||'#7c3aed';
    var icon  = houseIcons[h]||'🏠';
    var bc    = boarderCount[h]||0;
    var hms   = hmCount[h]||[];
    var pts   = housePoints[h]||0;
    var rank  = sortedByPoints.indexOf(h)+1;
    // Get boarders in this house
    var boarders = students.filter(function(s){
      return s.hostel==='Yes' && studentHouseMap[String(s.id)]===h;
    });
    html += '<div class="card" style="border-top:3px solid '+col+';padding:0">'
      // Card header
      +'<div style="padding:14px 16px 10px;display:flex;align-items:center;gap:10px">'
        +'<div style="width:42px;height:42px;border-radius:12px;background:'+col+'18;border:2px solid '+col+'44;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">'+icon+'</div>'
        +'<div style="flex:1;min-width:0">'
          +'<div style="font-size:15px;font-weight:800;color:var(--text)">'+h+' HOUSE</div>'
          +'<div style="font-size:11px;color:var(--muted);margin-top:1px">Rank #'+rank+' &nbsp;·&nbsp; '+pts+' pts</div>'
        +'</div>'
        +'<button onclick="navigate(\'housemaster\');hmsMasterTab=\'overview\';" title="Manage in House Master" style="padding:5px 10px;border-radius:7px;border:1px solid '+col+'55;background:'+col+'12;color:'+col+';font-size:11px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">Manage</button>'
      +'</div>'
      // Stats row
      +'<div style="display:flex;border-top:1px solid var(--border-soft);border-bottom:1px solid var(--border-soft)">'
        +'<div style="flex:1;padding:10px 12px;text-align:center;border-right:1px solid var(--border-soft)">'
          +'<div style="font-size:20px;font-weight:800;color:'+col+';font-family:\'Playfair Display\',serif">'+bc+'</div>'
          +'<div style="font-size:10px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.05em">Boarders</div>'
        +'</div>'
        +'<div style="flex:1;padding:10px 12px;text-align:center;border-right:1px solid var(--border-soft)">'
          +'<div style="font-size:20px;font-weight:800;color:'+col+';font-family:\'Playfair Display\',serif">'+hms.length+'</div>'
          +'<div style="font-size:10px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.05em">HM / HMiss</div>'
        +'</div>'
        +'<div style="flex:1;padding:10px 12px;text-align:center">'
          +'<div style="font-size:20px;font-weight:800;color:'+col+';font-family:\'Playfair Display\',serif">'+pts+'</div>'
          +'<div style="font-size:10px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.05em">Points</div>'
        +'</div>'
      +'</div>'
      // House Masters
      +'<div style="padding:10px 14px">'
        +'<div style="font-size:10.5px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:6px">🧑‍🏫 House Master / Mistress</div>'
        +(hms.length
          ? hms.map(function(n){return '<div style="font-size:12.5px;font-weight:600;color:var(--text);padding:2px 0">'+esc(n)+'</div>';}).join('')
          : '<div style="font-size:12px;color:var(--muted2);font-style:italic">None assigned</div>')
      +'</div>'
      // Boarders preview
      +'<div style="padding:0 14px 12px">'
        +'<div style="font-size:10.5px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:6px">👥 Boarders</div>'
        +(boarders.length===0
          ? '<div style="font-size:12px;color:var(--muted2);font-style:italic">No boarders assigned</div>'
          : '<div style="display:flex;flex-wrap:wrap;gap:4px">'
            + boarders.slice(0,8).map(function(s){
                return '<span style="padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;background:'+col+'12;color:'+col+';border:1px solid '+col+'33">'+esc(s.name.split(' ').slice(0,2).join(' '))+'</span>';
              }).join('')
            + (boarders.length>8 ? '<span style="padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;background:var(--surface2);color:var(--muted);border:1px solid var(--border)">+' +(boarders.length-8)+' more</span>' : '')
            +'</div>')
      +'</div>'
    +'</div>';
  });
  html += '</div>';
  // -- Quick actions --
  html += '<div class="card" style="padding:16px 20px;margin-bottom:20px">'
    +'<div style="font-size:13px;font-weight:800;color:var(--text);margin-bottom:12px">⚡ Quick Actions</div>'
    +'<div style="display:flex;flex-wrap:wrap;gap:10px">'
      +'<button onclick="navigate(\'housemaster\');hmsMasterTab=\'overview\'" style="padding:9px 18px;border-radius:10px;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">🏠 House Overview</button>'
      +'<button onclick="navigate(\'housemaster\');hmsMasterTab=\'rollcall\'" style="padding:9px 18px;border-radius:10px;background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">📋 Take Roll Call</button>'
      +'<button onclick="navigate(\'housemaster\');hmsMasterTab=\'behaviour\'" style="padding:9px 18px;border-radius:10px;background:linear-gradient(135deg,#dc2626,#b91c1c);color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">📝 Behaviour Log</button>'
      +'<button onclick="navigate(\'housemaster\');hmsMasterTab=\'health\'" style="padding:9px 18px;border-radius:10px;background:linear-gradient(135deg,#d97706,#b45309);color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">🏥 Health Monitor</button>'
      +'<button onclick="navigate(\'housemaster\');hmsMasterTab=\'activities\'" style="padding:9px 18px;border-radius:10px;background:linear-gradient(135deg,#0891b2,#0e7490);color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">🏆 Activities</button>'
    +'</div>'
  +'</div>';
  // -- Admin: Add / Manage Custom Houses --
  if(isAdmin){
    html += '<div class="card" style="padding:0;margin-bottom:20px;border:2px solid #e0e7ff">';
    // Header bar
    html += '<div style="padding:14px 18px;background:linear-gradient(135deg,#1e3a8a,#1d4ed8);border-radius:10px 10px 0 0;display:flex;align-items:center;gap:12px">';
    html +=   '<span style="font-size:18px">🏛️</span>';
    html +=   '<span style="font-size:14px;font-weight:800;color:#fff;flex:1">Admin -- House Management</span>';
    html +=   '<button onclick="window._houseAddForm=!window._houseAddForm;render()" style="padding:6px 16px;border-radius:8px;background:'+(window._houseAddForm?'rgba(255,255,255,0.25)':'rgba(255,255,255,0.15)')+';color:#fff;border:1.5px solid rgba(255,255,255,0.4);font-size:12px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">'+(window._houseAddForm?'✕ Cancel':'➕ Add New House')+'</button>';
    html += '</div>';
    // Add House Form
    if(window._houseAddForm){
      html += '<div style="padding:20px 18px;border-bottom:1px solid #e0e7ff;background:#f8faff">';
      html +=   '<div style="font-size:13px;font-weight:800;color:#1e3a8a;margin-bottom:14px">🏠 New House Details</div>';
      html +=   '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:16px">';
      // House Name
      html +=     '<div><label style="font-size:11px;font-weight:700;color:#64748b;display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:.06em">House Name *</label>';
      html +=     '<input id="gh-name" placeholder="e.g. IMPHAL" maxlength="24" autocomplete="off" style="width:100%;box-sizing:border-box;padding:9px 12px;border:1.5px solid #c7d2fe;border-radius:8px;font-size:13px;font-weight:700;font-family:\'DM Sans\',sans-serif;text-transform:uppercase;background:#fff;outline:none" oninput="this.value=this.value.toUpperCase()"/></div>';
      // Color picker
      html +=     '<div><label style="font-size:11px;font-weight:700;color:#64748b;display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:.06em">House Color *</label>';
      html +=     '<div style="display:flex;align-items:center;gap:8px">';
      html +=       '<input type="color" id="gh-color" value="#6366f1" style="width:44px;height:38px;border:1.5px solid #c7d2fe;border-radius:8px;cursor:pointer;padding:2px;background:#fff"/>';
      html +=       '<span style="font-size:11px;color:#64748b">Pick colour</span>';
      html +=     '</div></div>';
      // Emoji icon
      html +=     '<div><label style="font-size:11px;font-weight:700;color:#64748b;display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:.06em">Emoji Icon</label>';
      html +=     '<input id="gh-icon" placeholder="🏠" maxlength="4" style="width:100%;box-sizing:border-box;padding:9px 12px;border:1.5px solid #c7d2fe;border-radius:8px;font-size:18px;background:#fff;outline:none" value="🏠"/>';
      html +=     '<div style="font-size:10px;color:#94a3b8;margin-top:3px">Paste any emoji</div></div>';
      html +=   '</div>';
      // Save button
      html +=   '<div style="display:flex;gap:10px;align-items:center">';
      html +=     '<button onclick="gnsiSaveNewHouse()" style="padding:10px 28px;border-radius:10px;background:linear-gradient(135deg,#1d4ed8,#1e40af);color:#fff;border:none;font-size:13px;font-weight:800;cursor:pointer;font-family:\'DM Sans\',sans-serif;box-shadow:0 2px 8px rgba(29,78,216,0.25)">💾 Save House</button>';
      html +=     '<span style="font-size:11.5px;color:#64748b">House name will be uppercased automatically.</span>';
      html +=   '</div>';
      html += '</div>';
    }
    // Custom houses list (deletable)
    if(customHouses.length > 0){
      html += '<div style="padding:14px 18px">';
      html +=   '<div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px">🗂 Custom Houses (Admin-Added)</div>';
      html +=   '<div style="display:flex;flex-direction:column;gap:8px">';
      customHouses.forEach(function(h){
        html += '<div style="display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:10px;background:'+h.color+'0d;border:1.5px solid '+h.color+'33">';
        html +=   '<span style="font-size:20px">'+h.icon+'</span>';
        html +=   '<div style="flex:1">';
        html +=     '<div style="font-size:13px;font-weight:800;color:var(--text)">'+esc(h.id)+' HOUSE</div>';
        html +=     '<div style="font-size:11px;color:var(--muted)">Color: '+h.color+'</div>';
        html +=   '</div>';
        html +=   '<button onclick="gnsiDeleteCustomHouse(\''+h.id+'\')" style="padding:5px 12px;border-radius:7px;background:#fef2f2;color:#dc2626;border:1.5px solid #fca5a5;font-size:11px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">🗑 Delete</button>';
        html += '</div>';
      });
      html +=   '</div>';
      html += '</div>';
    } else if(!window._houseAddForm){
      html += '<div style="padding:16px 18px;text-align:center;color:var(--muted);font-size:12.5px;font-style:italic">No custom houses added yet. Click "➕ Add New House" to create one.</div>';
    }
    html += '</div>';
  }
  return html;
}
function renderHouseMaster(){
  var isAdmin = currentUser && (currentUser.role==='admin'||currentUser.role==='manager');
  var isHM    = currentUser && (currentUser.role==='housemaster'||currentUser.role==='hostel');
  // Determine current house context
  var myHouse = null;
  if(isHM && !isAdmin){
    myHouse = hmsGetAssignedHouse(currentUser.id);
  }
  var tabs = [
    {id:'overview',    label:'Overview',        icon:'🏠'},
    {id:'students',    label:'My Students',     icon:'👨‍🎓'},
    {id:'behaviour',   label:'Behaviour',       icon:'📋'},
    {id:'health',      label:'Health',          icon:'🩺'},
    {id:'academic',    label:'Academic',        icon:'📚'},
    {id:'rollcall',    label:'Roll Call',       icon:'📋'},
    {id:'activities',  label:'House Activities',icon:'🏆'},
    {id:'maintenance', label:'Maintenance',      icon:'🔧'}
  ];
  if(isAdmin) tabs.push({id:'assignments', label:'House Assignments', icon:'⚙️'});
  var tabBar = tabs.map(function(t){
    var active = t.id===hmsMasterTab;
    return '<button onclick="setHmsMasterTab(\''+t.id+'\')" style="padding:8px 16px;border-radius:9px;border:'+(active?'none':'1.5px solid var(--border)')+';cursor:pointer;font-size:12.5px;font-weight:'+(active?'700':'600')+';background:'+(active?'var(--accent)':'var(--surface)')+';color:'+(active?'#fff':'var(--muted)')+';white-space:nowrap;transition:all .15s;display:flex;align-items:center;gap:5px">'+t.icon+' '+t.label+'</button>';
  }).join('');
  var houseInfo = HM_HOUSES.find(function(h){return h.id===myHouse;}) || null;
  var houseColor = houseInfo ? houseInfo.color : 'var(--accent)';
  var body = '';
  try {
    if(hmsMasterTab==='overview')    body = hmsRenderOverview(myHouse, isAdmin);
    if(hmsMasterTab==='students')    body = hmsRenderStudents(myHouse, isAdmin);
    if(hmsMasterTab==='behaviour')   body = hmsRenderBehaviour(myHouse, isAdmin);
    if(hmsMasterTab==='health')      body = hmsRenderHealth(myHouse, isAdmin);
    if(hmsMasterTab==='academic')    body = hmsRenderAcademic(myHouse, isAdmin);
    if(hmsMasterTab==='rollcall')    body = hmsRenderRollCall(myHouse, isAdmin);
    if(hmsMasterTab==='activities')  body = hmsRenderActivities(myHouse, isAdmin);
    if(hmsMasterTab==='maintenance') body = hmsRenderMaintenance(myHouse, isAdmin);
    if(hmsMasterTab==='assignments') body = hmsRenderAssignments();
  } catch(e) {
    (void 0);
    body = '<div style="padding:40px;text-align:center;background:#fef2f2;border-radius:12px;border:1.5px solid #fca5a5;margin:20px 0">'
      +'<div style="font-size:36px;margin-bottom:10px">⚠️</div>'
      +'<div style="font-size:16px;font-weight:700;color:#dc2626;margin-bottom:6px">Error loading this tab</div>'
      +'<div style="font-size:12.5px;color:#64748b;font-family:\'JetBrains Mono\',monospace;margin-bottom:14px">'+e.message+'</div>'
      +'<button onclick="hmsMasterTab=\'overview\';render()" style="padding:8px 18px;border-radius:8px;background:#1433a8;color:#fff;border:none;font-size:12px;font-weight:700;cursor:pointer">Back to Overview</button>'
      +'</div>';
  }
  return '<div style="margin-bottom:20px;display:flex;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;gap:12px">'
    +'<div>'
    +'<div style="font-family:\'JetBrains Mono\',monospace;font-size:10px;color:var(--muted);letter-spacing:.14em;text-transform:uppercase;margin-bottom:4px">GNSI -- BOARDING SECTION</div>'
    +'<div style="font-size:24px;font-family:\'Playfair Display\',serif;font-weight:700;color:var(--text)">House Master -- Student Monitoring</div>'
    +'<div style="font-size:12.5px;color:var(--muted);margin-top:4px">'
    +(myHouse && !isAdmin
      ? '<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:20px;background:'+houseColor+'20;color:'+houseColor+';font-weight:700;border:1.5px solid '+houseColor+'55"><span>🏠</span> '+myHouse+' HOUSE</span>'
      : isAdmin ? 'Admin view -- all houses &nbsp;·&nbsp; Assign houses from the Assignments tab'
                : '<span style="color:#dc2626;font-weight:600">⚠ No house assigned -- contact Admin</span>')
    +'</div>'
    +'</div>'
    +(myHouse||isAdmin ? '<div style="display:flex;gap:8px"><button class="btn btn-outline" onclick="setHmsMasterTab(\'rollcall\')" style="font-size:12px;padding:7px 14px">📋 House Roll Call</button></div>' : '')
    +'</div>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:22px;padding:4px 0">'+tabBar+'</div>'
    + body;
}
function hmsRenderOverview(myHouse, isAdmin){
  var houses = isAdmin ? HM_HOUSES.map(function(h){return h.id;}) : (myHouse ? [myHouse] : []);
  if(!houses.length){
    return '<div style="text-align:center;padding:60px 24px;color:var(--muted)">'
      +'<div style="font-size:48px;margin-bottom:16px">🏠</div>'
      +'<div style="font-size:18px;font-weight:700;margin-bottom:8px">No House Assigned</div>'
      +'<div style="font-size:13px;line-height:1.7">Please ask the Administrator to assign you to a house using the <b>House Assignments</b> tab.</div>'
      +'</div>';
  }
  var studentHouseMap = hmsMastGet('student_house');
  var behaviourData   = hmsArr('behaviour');
  var healthData      = hmsArr('health');
  var academicData    = hmsArr('academic');
  var houseCards = HM_HOUSES.filter(function(h){ return houses.indexOf(h.id)>=0; }).map(function(h){
    var stuList   = students.filter(function(s){ return s.hostel==='Yes' && studentHouseMap[String(s.id)]===h.id; });
    var bCount    = behaviourData.filter(function(r){ return r.house===h.id && r.status==='Open'; }).length;
    var hCount    = healthData.filter(function(r){ return r.house===h.id && r.status==='Monitoring'; }).length;
    var aCount    = academicData.filter(function(r){ return r.house===h.id && r.flag==='Yes'; }).length;
    var mCount    = hmsArr('maintenance').filter(function(r){ return r.house===h.id && r.status!=='Completed' && r.status!=='Cancelled'; }).length;
    // House Masters assigned
    var hmStaff   = staff.filter(function(s){
      var assigned = hmsGetAssignedHouse(s.id);
      return assigned===h.id && (s.role.toLowerCase().includes('house master')||s.role.toLowerCase().includes('house mistress')||s.role.toLowerCase().includes('boarding'));
    });
    return '<div style="background:var(--surface);border-radius:14px;border:2px solid '+h.color+'44;overflow:hidden;box-shadow:var(--shadow-sm);transition:transform .2s,box-shadow .2s" onmouseenter="this.style.transform=\'translateY(-3px)\';this.style.boxShadow=\'var(--shadow-md)\'" onmouseleave="this.style.transform=\'\';this.style.boxShadow=\'var(--shadow-sm)\'">'
      +'<div style="background:'+h.color+';padding:14px 18px;display:flex;align-items:center;justify-content:space-between">'
      +'<div><div style="font-family:\'Playfair Display\',serif;font-size:17px;font-weight:700;color:#fff">'+(h.icon||'🏠')+' '+h.id+' HOUSE</div>'
      +'<div style="font-size:11px;color:rgba(255,255,255,.8);margin-top:2px">'+stuList.length+' resident'+(stuList.length!==1?'s':'')+'</div></div>'
      +'<div style="font-family:\'Playfair Display\',serif;font-size:36px;font-weight:800;color:rgba(255,255,255,.25)">'+stuList.length+'</div>'
      +'</div>'
      +'<div style="padding:14px 18px;display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;border-bottom:1px solid var(--border-soft)">'
      +'<div style="text-align:center;padding:8px;border-radius:8px;background:#dc262611"><div style="font-size:18px;font-weight:800;color:#dc2626">'+bCount+'</div><div style="font-size:10px;color:var(--muted);font-weight:600">Open Issues</div></div>'
      +'<div style="text-align:center;padding:8px;border-radius:8px;background:#f59e0b11"><div style="font-size:18px;font-weight:800;color:#f59e0b">'+hCount+'</div><div style="font-size:10px;color:var(--muted);font-weight:600">On Monitoring</div></div>'
      +'<div style="text-align:center;padding:8px;border-radius:8px;background:#3b78c911"><div style="font-size:18px;font-weight:800;color:#3b78c9">'+aCount+'</div><div style="font-size:10px;color:var(--muted);font-weight:600">Academic Flags</div></div>'
      +'<div style="text-align:center;padding:8px;border-radius:8px;background:'+(mCount>0?'#7c3aed':'#16a34a')+'11;cursor:pointer" onclick="setHmsMasterTab(\'maintenance\');hmsMaintFilter=\''+h.id+'\';hmsMaintStatusFilter=\'All\'">'
      +'<div style="font-size:18px;font-weight:800;color:'+(mCount>0?'#7c3aed':'#16a34a')+'">'+mCount+'</div>'
      +'<div style="font-size:10px;color:var(--muted);font-weight:600">Maintenance</div></div>'
      +'</div>'
      +(hmStaff.length?'<div style="padding:10px 18px;border-bottom:1px solid var(--border-soft);display:flex;flex-wrap:wrap;gap:8px">'
        +hmStaff.map(function(s){ return '<div style="display:flex;align-items:center;gap:6px;font-size:11.5px;color:var(--muted)">'+avatarHTML(s.name,22)+'<span style="font-weight:600">'+esc(s.name.split(' ')[0])+'</span></div>'; }).join('')
        +'</div>':'')
      +'<div style="padding:12px 18px">'
      +'<button onclick="setHmsMasterTab(\'students\');hmsMasterTab=\'students\';render()" style="font-size:11.5px;font-weight:700;color:'+h.color+';background:'+h.color+'18;border:1.5px solid '+h.color+'44;border-radius:7px;padding:5px 12px;cursor:pointer;font-family:\'DM Sans\',sans-serif">View Students →</button>'
      +'</div>'
      +'</div>';
  }).join('');
  // Summary stats
  var totalHostel  = students.filter(function(s){return s.hostel==='Yes';}).length;
  var totalAssigned= Object.keys(hmsMastGet('student_house')).length;
  var totalBehOpen = hmsArr('behaviour').filter(function(r){return r.status==='Open';}).length;
  var totalMon     = hmsArr('health').filter(function(r){return r.status==='Monitoring';}).length;
  var totalMaint   = hmsArr('maintenance').filter(function(r){return r.status!=='Completed'&&r.status!=='Cancelled';}).length;
  return '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px;margin-bottom:24px">'
    +'<div class="stat-card" style="--c:#3b78c9"><div class="stat-label">Hostel Students</div><div class="stat-val">'+totalHostel+'</div><div class="stat-sub">'+totalAssigned+' assigned to houses</div></div>'
    +'<div class="stat-card" style="--c:#dc2626"><div class="stat-label">Open Behaviour</div><div class="stat-val">'+totalBehOpen+'</div><div class="stat-sub">Needs attention</div></div>'
    +'<div class="stat-card" style="--c:#f59e0b"><div class="stat-label">Health Watch</div><div class="stat-val">'+totalMon+'</div><div class="stat-sub">Under monitoring</div></div>'
    +'<div class="stat-card" style="--c:#7c3aed;cursor:pointer" onclick="setHmsMasterTab(\'maintenance\')"><div class="stat-label">🔧 Maintenance</div><div class="stat-val">'+totalMaint+'</div><div class="stat-sub">Open issues</div></div>'
    +'<div class="stat-card" style="--c:#16a34a"><div class="stat-label">Houses</div><div class="stat-val">'+HM_HOUSES.length+'</div><div class="stat-sub">Total house divisions</div></div>'
    +'</div>'
    +'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px">'+houseCards+'</div>';
}
var hmsStudentSearch = '';
var hmsStudentHouseFilter = 'All';
function hmsRenderStudents(myHouse, isAdmin){
  var studentHouseMap = hmsMastGet('student_house');
  var hostelStudents  = students.filter(function(s){ return s.hostel==='Yes'; });
  var allStudents     = students; // House Masters can also pick from day scholars if needed
  if(!myHouse && !isAdmin){
    return '<div style="text-align:center;padding:60px 24px;color:var(--muted)"><div style="font-size:48px;margin-bottom:16px">🏠</div><div style="font-size:16px;font-weight:700">No house assigned yet</div><div style="font-size:13px;margin-top:8px">Ask the Administrator to assign you to a house.</div></div>';
  }
  var hInfo  = HM_HOUSES.find(function(h){return h.id===myHouse;});
  var hColor = hInfo ? hInfo.color : '#1433a8';
  // For House Master (non-admin): show TWO panels
  // 1) "My House Students" -- students already in their house
  // 2) "Add Students" -- ALL hostel students NOT in their house, with Add button
  if(!isAdmin && myHouse){
    var myStudents     = hostelStudents.filter(function(s){ return studentHouseMap[String(s.id)]===myHouse; });
    var notMyStudents  = hostelStudents.filter(function(s){ return (studentHouseMap[String(s.id)]||'')!==myHouse; });
    // Apply search
    var q = (hmsStudentSearch||'').toLowerCase().trim();
    if(q){
      myStudents    = myStudents.filter(function(s){ return s.name.toLowerCase().includes(q)||(s.roll||'').includes(q); });
      notMyStudents = notMyStudents.filter(function(s){ return s.name.toLowerCase().includes(q)||(s.roll||'').includes(q); });
    }
    var behaviourData = hmsArr('behaviour');
    var healthData    = hmsArr('health');
    var academicData  = hmsArr('academic');
    function statusFlags(s){
      var bOpen = behaviourData.filter(function(r){return r.stuId==s.id&&r.status==='Open';}).length;
      var hMon  = healthData.filter(function(r){return r.stuId==s.id&&r.status==='Monitoring';}).length;
      var aFlag = academicData.filter(function(r){return r.stuId==s.id&&r.flag==='Yes';}).length;
      return '<div style="display:flex;gap:5px;flex-wrap:wrap">'
        +(bOpen?'<span style="padding:2px 8px;border-radius:8px;font-size:10.5px;font-weight:700;background:#dc262618;color:#dc2626">'+bOpen+' issue'+(bOpen>1?'s':'')+'</span>':'<span style="color:#16a34a;font-size:11.5px">✓ Good</span>')
        +(hMon?'<span style="padding:2px 8px;border-radius:8px;font-size:10.5px;font-weight:700;background:#f59e0b18;color:#f59e0b">🩺</span>':'')
        +(aFlag?'<span style="padding:2px 8px;border-radius:8px;font-size:10.5px;font-weight:700;background:#3b78c918;color:#3b78c9">📚</span>':'')
      +'</div>';
    }
    // Rows for MY house
    var myRows = myStudents.length
      ? myStudents.map(function(s){
          return '<tr style="background:#f8fffe">'
            +'<td><div style="display:flex;align-items:center;gap:10px">'+avatarHTML(s.name,30)
              +'<div><div style="font-weight:700;font-size:13px">'+esc(s.name)+'</div>'
              +'<div style="font-size:11px;color:var(--muted);font-family:\'JetBrains Mono\',monospace">GCC: '+(s.roll||'--')+' · '+esc(s.cls||'')+'</div>'
            +'</div></div></td>'
            +'<td>'+statusFlags(s)+'</td>'
            +'<td style="font-family:\'JetBrains Mono\',monospace;font-size:12px;color:var(--muted)">'+(maskPhone(s.phone)||'--')+'</td>'
            +'<td>'
              +'<button onclick="hmsAssignStudentHouse('+parseInt(s.id,10)+',\'\');showToast&&showToast(\''+esc(s.name.split(' ')[0])+' removed from '+myHouse+'\',\'#dc2626\');render()" '
              +'style="padding:5px 12px;border-radius:8px;background:#fee2e2;color:#dc2626;border:1.5px solid #fca5a5;cursor:pointer;font-size:12px;font-weight:700;font-family:\'DM Sans\',sans-serif;transition:all .15s">'
              +'✕ Remove</button>'
            +'</td>'
          +'</tr>';
        }).join('')
      : '<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--muted)">No students in '+myHouse+' house yet. Add students from the panel below.</td></tr>';
    // Rows for students NOT in my house
    var addRows = notMyStudents.length
      ? notMyStudents.map(function(s){
          var curHouse = studentHouseMap[String(s.id)]||'';
          var curHInfo = HM_HOUSES.find(function(h){return h.id===curHouse;});
          var curCol   = curHInfo?curHInfo.color:'#94a3b8';
          return '<tr>'
            +'<td><div style="display:flex;align-items:center;gap:10px">'+avatarHTML(s.name,30)
              +'<div><div style="font-weight:700;font-size:13px">'+esc(s.name)+'</div>'
              +'<div style="font-size:11px;color:var(--muted);font-family:\'JetBrains Mono\',monospace">GCC: '+(s.roll||'--')+' · '+esc(s.cls||'')+'</div>'
            +'</div></div></td>'
            +'<td>'+statusFlags(s)+'</td>'
            +'<td><span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:'+(curHouse?curCol+'18':'#fff7ed')+';color:'+(curHouse?curCol:'#ea580c')+';border:1.5px solid '+(curHouse?curCol+'44':'#fdba74')+'">'+(curHouse?(curHInfo?curHInfo.icon:'🏠')+' '+curHouse:'⚠ Unassigned')+'</span></td>'
            +'<td style="font-family:\'JetBrains Mono\',monospace;font-size:12px;color:var(--muted)">'+(maskPhone(s.phone)||'--')+'</td>'
            +'<td>'
              +'<button onclick="hmsAssignStudentHouse('+parseInt(s.id,10)+',\''+myHouse+'\');showToast&&showToast(\''+esc(s.name.split(' ')[0])+' added to '+myHouse+'!\',\''+hColor+'\');render()" '
              +'style="padding:5px 14px;border-radius:8px;background:'+hColor+';color:#fff;border:none;cursor:pointer;font-size:12px;font-weight:700;font-family:\'DM Sans\',sans-serif;transition:all .15s;white-space:nowrap">'
              +'➕ Add to '+myHouse+'</button>'
            +'</td>'
          +'</tr>';
        }).join('')
      : '<tr><td colspan="5" style="text-align:center;padding:24px;color:#16a34a;font-weight:600">✅ All hostel students are assigned to '+myHouse+'!</td></tr>';
    return '<div style="margin-bottom:20px">'
      // My house summary strip
      +'<div style="background:linear-gradient(135deg,'+hColor+','+hColor+'cc);border-radius:14px;padding:16px 20px;color:#fff;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:20px">'
        +'<div>'
          +'<div style="font-family:\'Playfair Display\',serif;font-size:18px;font-weight:700">'+(hInfo?hInfo.icon:'🏠')+' '+myHouse+' HOUSE</div>'
          +'<div style="font-size:12px;color:rgba(255,255,255,.8);margin-top:3px">You are the House Master of this house</div>'
        +'</div>'
        +'<div style="display:flex;gap:14px">'
          +'<div style="text-align:center;background:rgba(255,255,255,.15);border-radius:10px;padding:10px 18px"><div style="font-size:24px;font-weight:800">'+myStudents.length+'</div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;opacity:.8">In My House</div></div>'
          +'<div style="text-align:center;background:rgba(255,255,255,.15);border-radius:10px;padding:10px 18px"><div style="font-size:24px;font-weight:800">'+hostelStudents.length+'</div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;opacity:.8">Total Hostel</div></div>'
        +'</div>'
      +'</div>'
      // Search
      +'<div class="search-wrap" style="margin-bottom:18px;max-width:360px"><span class="search-icon">🔍</span>'
        +'<input placeholder="Search student by name or GCC no…" value="'+esc(hmsStudentSearch)+'" oninput="hmsStudentSearch=this.value;debouncedRender()" '
        +'style="width:100%;background:var(--surface);border:1.5px solid var(--border);border-radius:9px;padding:9px 13px 9px 38px;font-size:13px;font-family:\'DM Sans\',sans-serif;outline:none;color:var(--text)"/>'
      +'</div>'
      // Panel 1 -- My house students
      +'<div class="card" style="margin-bottom:16px">'
        +'<div class="card-head" style="background:'+hColor+'">'
          +'<span class="card-title" style="color:#fff">'+(hInfo?hInfo.icon:'🏠')+' '+myHouse+' House -- My Students</span>'
          +'<span style="font-size:11px;color:rgba(255,255,255,.8);font-family:\'JetBrains Mono\',monospace">'+myStudents.length+' students</span>'
        +'</div>'
        +'<div style="overflow-x:auto"><table><thead><tr><th>Student / GCC No.</th><th>Status</th><th>Phone</th><th>Action</th></tr></thead>'
        +'<tbody>'+myRows+'</tbody></table></div>'
      +'</div>'
      // Panel 2 -- Add students from other/unassigned
      +'<div class="card">'
        +'<div class="card-head" style="background:linear-gradient(135deg,#1a6b55,#16a34a)">'
          +'<span class="card-title" style="color:#fff">➕ Add Students to '+myHouse+' House</span>'
          +'<span style="font-size:11px;color:rgba(255,255,255,.8);font-family:\'JetBrains Mono\',monospace">'+notMyStudents.length+' available</span>'
        +'</div>'
        +'<div style="background:#f0fdf4;border-bottom:1px solid #86efac;padding:10px 18px;font-size:12.5px;color:#16a34a;display:flex;align-items:center;gap:8px">'
          +'💡 These are hostel students currently in other houses or unassigned. Click <b>➕ Add to '+myHouse+'</b> to move them into your house.'
        +'</div>'
        +'<div style="overflow-x:auto"><table><thead><tr><th>Student / GCC No.</th><th>Status</th><th>Current House</th><th>Phone</th><th>Action</th></tr></thead>'
        +'<tbody>'+addRows+'</tbody></table></div>'
      +'</div>'
    +'</div>';
  }
  // -- ADMIN view: same as before with all filters and dropdowns --
  var viewHouse = hmsStudentHouseFilter||'All';
  var filtered = hostelStudents.filter(function(s){
    var sHouse = studentHouseMap[String(s.id)]||'';
    var houseMatch = viewHouse==='All' ? true : (viewHouse==='Unassigned' ? !sHouse : sHouse===viewHouse);
    var nameMatch = !hmsStudentSearch || s.name.toLowerCase().includes((hmsStudentSearch||'').toLowerCase()) || (s.roll||'').includes(hmsStudentSearch||'');
    return houseMatch && nameMatch;
  });
  var behaviourData2 = hmsArr('behaviour');
  var healthData2    = hmsArr('health');
  var academicData2  = hmsArr('academic');
  var allCount = hostelStudents.length;
  var unassignedCount = hostelStudents.filter(function(s){return !studentHouseMap[String(s.id)];}).length;
  // House filter pills
  var pills = '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px">';
  pills += '<button onclick="hmsStudentHouseFilter=\'All\';render()" style="padding:6px 14px;border-radius:20px;border:1.5px solid '+(viewHouse==='All'?'var(--accent)':'var(--border)')+';background:'+(viewHouse==='All'?'var(--accent)':'var(--surface)')+';color:'+(viewHouse==='All'?'#fff':'var(--muted)')+';cursor:pointer;font-size:12px;font-weight:'+(viewHouse==='All'?700:500)+';font-family:\'DM Sans\',sans-serif">All ('+allCount+')</button>';
  HM_HOUSES.forEach(function(h){
    var cnt = hostelStudents.filter(function(s){return studentHouseMap[String(s.id)]===h.id;}).length;
    var active = viewHouse===h.id;
    pills += '<button onclick="hmsStudentHouseFilter=\''+h.id+'\';render()" style="padding:6px 14px;border-radius:20px;border:1.5px solid '+(active?h.color:'var(--border)')+';background:'+(active?h.color+'22':'var(--surface)')+';color:'+(active?h.color:'var(--muted)')+';cursor:pointer;font-size:12px;font-weight:'+(active?700:500)+';font-family:\'DM Sans\',sans-serif">'+h.icon+' '+h.id+' ('+cnt+')</button>';
  });
  if(unassignedCount){
    var active2 = viewHouse==='Unassigned';
    pills += '<button onclick="hmsStudentHouseFilter=\'Unassigned\';render()" style="padding:6px 14px;border-radius:20px;border:1.5px solid '+(active2?'#f59e0b':'var(--border)')+';background:'+(active2?'#fef9c3':'var(--surface)')+';color:'+(active2?'#ca8a04':'var(--muted)')+';cursor:pointer;font-size:12px;font-weight:'+(active2?700:500)+';font-family:\'DM Sans\',sans-serif">⚠ Unassigned ('+unassignedCount+')</button>';
  }
  pills += '</div>';
  // Bulk bar
  var bulkBar = '';
  if(viewHouse && viewHouse!=='All' && viewHouse!=='Unassigned'){
    var hInfoBulk = HM_HOUSES.find(function(h){return h.id===viewHouse;});
    bulkBar = '<div style="background:'+(hInfoBulk?hInfoBulk.color:'#1433a8')+'18;border:1.5px solid '+(hInfoBulk?hInfoBulk.color+'44':'var(--border)')+';border-radius:12px;padding:14px 18px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">'
      +'<div style="font-size:13px;font-weight:700;color:var(--text)">Bulk -- <span style="color:'+(hInfoBulk?hInfoBulk.color:'var(--accent)')+'">'+viewHouse+'</span></div>'
      +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
        +'<button onclick="hmsAssignAllToHouse(\''+viewHouse+'\')" style="padding:7px 14px;border-radius:9px;background:'+(hInfoBulk?hInfoBulk.color:'var(--accent)')+';color:#fff;border:none;cursor:pointer;font-size:12px;font-weight:700;font-family:\'DM Sans\',sans-serif">✅ Assign All Hostel → '+viewHouse+'</button>'
        +'<button onclick="if(confirm(\'Remove all from '+viewHouse+'?\'))hmsRemoveAllFromHouse(\''+viewHouse+'\')" style="padding:7px 12px;border-radius:9px;background:#fee2e2;color:#dc2626;border:1.5px solid #fca5a5;cursor:pointer;font-size:12px;font-weight:700;font-family:\'DM Sans\',sans-serif">✕ Clear</button>'
      +'</div>'
    +'</div>';
  }
  var adminRows = filtered.length ? filtered.map(function(s){
    var sHouse = studentHouseMap[String(s.id)]||'';
    var hInfo2 = HM_HOUSES.find(function(h){return h.id===sHouse;});
    var hCol   = hInfo2?hInfo2.color:'#94a3b8';
    var bOpen  = behaviourData2.filter(function(r){return r.stuId==s.id&&r.status==='Open';}).length;
    var hMon   = healthData2.filter(function(r){return r.stuId==s.id&&r.status==='Monitoring';}).length;
    var aFlag  = academicData2.filter(function(r){return r.stuId==s.id&&r.flag==='Yes';}).length;
    var houseSelectOpts = '<option value="">-- Unassigned --</option>'
      +HM_HOUSES.map(function(h){return '<option value="'+h.id+'"'+(sHouse===h.id?' selected':'')+'>'+h.icon+' '+h.id+'</option>';}).join('');
    var houseCell = sHouse
      ?'<div style="display:flex;flex-direction:column;gap:5px"><span style="display:inline-flex;align-items:center;gap:5px;padding:4px 11px;border-radius:20px;font-size:11.5px;font-weight:700;background:'+hCol+'18;color:'+hCol+';border:1.5px solid '+hCol+'44">'+(hInfo2?hInfo2.icon:'🏠')+' '+sHouse+'</span>'
        +'<select onchange="hmsAssignStudentHouse('+parseInt(s.id,10)+',this.value);showToast&&showToast(\'House updated\',\'#16a34a\');render()" style="font-size:11px;border:1.5px solid '+hCol+'33;border-radius:8px;padding:3px 8px;background:'+hCol+'08;color:'+hCol+';cursor:pointer;font-family:\'DM Sans\',sans-serif;max-width:150px">'+houseSelectOpts+'</select>'
      +'</div>'
      :'<div style="display:flex;flex-direction:column;gap:5px"><span style="display:inline-flex;align-items:center;gap:5px;padding:4px 11px;border-radius:20px;font-size:11px;font-weight:700;background:#fff7ed;color:#ea580c;border:1.5px solid #fdba74">⚠ Unassigned</span>'
        +'<select onchange="hmsAssignStudentHouse('+parseInt(s.id,10)+',this.value);showToast&&showToast(\'House assigned!\',\'#16a34a\');render()" style="font-size:11px;border:1.5px solid #fdba74;border-radius:8px;padding:3px 8px;background:#fff7ed;color:#ea580c;cursor:pointer;font-family:\'DM Sans\',sans-serif;max-width:150px">'+houseSelectOpts+'</select>'
      +'</div>';
    return '<tr>'
      +'<td><div style="display:flex;align-items:center;gap:10px">'+avatarHTML(s.name,30)
        +'<div><div style="font-weight:700;font-size:13px">'+esc(s.name)+'</div>'
        +'<div style="font-size:11px;color:var(--muted);font-family:\'JetBrains Mono\',monospace">GCC: '+(s.roll||'--')+' · '+esc(s.cls||'')+'</div>'
      +'</div></div></td>'
      +'<td>'+houseCell+'</td>'
      +'<td><div style="display:flex;gap:5px;flex-wrap:wrap">'+(bOpen?'<span style="padding:2px 8px;border-radius:8px;font-size:10.5px;font-weight:700;background:#dc262618;color:#dc2626">'+bOpen+' issue'+(bOpen>1?'s':'')+'</span>':'<span style="color:#16a34a;font-size:12px">✓</span>')+(hMon?'<span style="padding:2px 7px;border-radius:8px;font-size:10px;font-weight:700;background:#f59e0b18;color:#f59e0b">🩺</span>':'')+(aFlag?'<span style="padding:2px 7px;border-radius:8px;font-size:10px;font-weight:700;background:#3b78c918;color:#3b78c9">📚</span>':'')+'</div></td>'
      +'<td style="font-family:\'JetBrains Mono\',monospace;font-size:12px;color:var(--muted)">'+(maskPhone(s.phone)||'--')+'</td>'
    +'</tr>';
  }).join('')
  :'<tr><td colspan="4" style="text-align:center;padding:40px;color:var(--muted)">No students found.</td></tr>';
  return '<div style="margin-bottom:8px"><div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px;font-family:\'JetBrains Mono\',monospace">Filter by House</div>'+pills+'</div>'
    +'<div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;align-items:center">'
      +'<div class="search-wrap" style="flex:1;min-width:200px"><span class="search-icon">🔍</span>'
        +'<input placeholder="Search by name or GCC no…" value="'+esc(hmsStudentSearch)+'" oninput="hmsStudentSearch=this.value;debouncedRender()" '
        +'style="width:100%;background:var(--surface);border:1.5px solid var(--border);border-radius:9px;padding:9px 13px 9px 38px;font-size:13px;font-family:\'DM Sans\',sans-serif;outline:none;color:var(--text)"/>'
      +'</div>'
    +'</div>'
    +bulkBar
    +'<div class="card"><div class="card-head" style="background:linear-gradient(135deg,#0b1e6e,#1433a8)">'
      +'<span class="card-title" style="color:#fff">👨‍🎓 '+(viewHouse==='All'?'All Hostel Students':viewHouse==='Unassigned'?'Unassigned Students':viewHouse+' House Students')+'</span>'
      +'<span style="font-family:\'JetBrains Mono\',monospace;font-size:11px;color:rgba(255,255,255,.7)">'+filtered.length+' students</span>'
    +'</div>'
    +'<div style="overflow-x:auto"><table><thead><tr><th>Student / GCC No.</th><th>House Assignment</th><th>Status</th><th>Phone</th></tr></thead>'
    +'<tbody id="hms-stu-tbody">'+adminRows+'</tbody></table></div></div>';
}
function hmsRenderStudentsTable(){
  if(typeof render==='function') render();
}
window.hmsAssignAllToHouse = function(houseId){
  var count = 0;
  var map = hmsMastGet('student_house');
  students.filter(function(s){return s.hostel==='Yes';}).forEach(function(s){
    if((map[String(s.id)]||'')!==houseId){ map[String(s.id)]=houseId; count++; }
  });
  hmsMastSet('student_house',map);
  if(typeof render==='function')render();
  if(typeof showToast==='function')showToast(count+' students assigned to '+houseId,'#16a34a');
};
window.hmsRemoveAllFromHouse = function(houseId){
  var map = hmsMastGet('student_house');
  var count=0;
  Object.keys(map).forEach(function(sid){ if(map[sid]===houseId){delete map[sid];count++;} });
  hmsMastSet('student_house',map);
  if(typeof render==='function')render();
  if(typeof showToast==='function')showToast(count+' students removed from '+houseId,'#dc2626');
};
var hmsBehTab = 'list'; // list | add
/* ═══════════════════════════════════════════════════════════════
   HOUSE MAINTENANCE MODULE
   - Per-house defect/damage reports, replacement requests, general requirements
   - Priority, status tracking, task completion, history log
   - Admin sees all houses; HM sees only their house
═══════════════════════════════════════════════════════════════ */
var hmsMaintTab   = 'list';  // 'list' | 'add' | 'tasks'
var hmsMaintFilter= 'All';   // house filter (admin)
var hmsMaintStatusFilter = 'All'; // Open | Completed | All
var hmsMaintTypeFilter   = 'All'; // category filter
var hmsMaintEditId = null;   // ID being edited, null = new

var HMS_MAINT_CATEGORIES = [
  'Electrical','Plumbing','Carpentry / Furniture','Civil / Structural',
  'Glass / Window','Door / Lock','Roof / Ceiling','Flooring',
  'Paint / Whitewash','Pest Control','Sanitation / Hygiene',
  'Equipment Replacement','Bedding / Linen','Sports Equipment',
  'Electronic / Appliance','Security / CCTV','Water Supply','Other'
];
var HMS_MAINT_PRIORITIES = ['Low','Medium','High','Urgent'];
var HMS_MAINT_TYPES      = ['Defect / Damage','Replacement Required','Requirement / Procurement','Routine Maintenance','Safety Hazard'];

function hmsMaintData(){ return hmsArr('maintenance'); }
function hmsMaintSave(arr){ hmsArrSet('maintenance', arr); }

function hmsRenderMaintenance(myHouse, isAdmin){
  var data = hmsMaintData();
  var mine = isAdmin ? data : data.filter(function(r){ return r.house===myHouse; });

  // ── KPI strip ──────────────────────────────────────────────
  var open     = mine.filter(function(r){ return r.status!=='Completed'&&r.status!=='Cancelled'; }).length;
  var urgent   = mine.filter(function(r){ return r.priority==='Urgent'&&r.status!=='Completed'&&r.status!=='Cancelled'; }).length;
  var done     = mine.filter(function(r){ return r.status==='Completed'; }).length;
  var pending  = mine.filter(function(r){ return r.status==='Pending Approval'; }).length;

  var kpi = '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:22px">'
    +'<div style="background:linear-gradient(135deg,#fff7ed,#ffedd5);border:1.5px solid #fed7aa;border-radius:12px;padding:14px 16px;text-align:center">'
    +  '<div style="font-size:26px;font-weight:800;color:#ea580c">'+open+'</div>'
    +  '<div style="font-size:10.5px;font-weight:700;color:#9a3412;text-transform:uppercase;letter-spacing:.06em;margin-top:3px">Open Issues</div>'
    +'</div>'
    +'<div style="background:linear-gradient(135deg,#fef2f2,#fee2e2);border:1.5px solid #fca5a5;border-radius:12px;padding:14px 16px;text-align:center">'
    +  '<div style="font-size:26px;font-weight:800;color:#dc2626">'+urgent+'</div>'
    +  '<div style="font-size:10.5px;font-weight:700;color:#991b1b;text-transform:uppercase;letter-spacing:.06em;margin-top:3px">Urgent</div>'
    +'</div>'
    +'<div style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border:1.5px solid #fde68a;border-radius:12px;padding:14px 16px;text-align:center">'
    +  '<div style="font-size:26px;font-weight:800;color:#d97706">'+pending+'</div>'
    +  '<div style="font-size:10.5px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:.06em;margin-top:3px">Awaiting Approval</div>'
    +'</div>'
    +'<div style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1.5px solid #86efac;border-radius:12px;padding:14px 16px;text-align:center">'
    +  '<div style="font-size:26px;font-weight:800;color:#16a34a">'+done+'</div>'
    +  '<div style="font-size:10.5px;font-weight:700;color:#15803d;text-transform:uppercase;letter-spacing:.06em;margin-top:3px">Completed</div>'
    +'</div>'
    +'</div>';

  // ── Add / Edit Form ────────────────────────────────────────
  var editRec = hmsMaintEditId!==null ? mine.find(function(r){return r.id===hmsMaintEditId;}) : null;
  var addForm = (hmsMaintTab==='add') ? _hmsMaintForm(myHouse, isAdmin, editRec) : '';

  // ── Tasks completed sub-view ───────────────────────────────
  if(hmsMaintTab==='tasks'){
    var completedData = mine.filter(function(r){ return r.status==='Completed'; });
    var taskRows = completedData.length
      ? completedData.slice().reverse().map(function(r){
          var hInfo = HM_HOUSES.find(function(h){return h.id===r.house;})||{color:'#64748b',icon:'🏠'};
          return '<tr>'
            +'<td style="font-family:\'JetBrains Mono\',monospace;font-size:11.5px">'+hmsFmt(r.completedOn||r.date)+'</td>'
            +(isAdmin?'<td><span style="padding:2px 8px;border-radius:10px;font-size:10.5px;font-weight:700;background:'+hInfo.color+'22;color:'+hInfo.color+'">'+esc(r.house||'--')+'</span></td>':'')
            +'<td style="font-size:12px;font-weight:700;color:var(--text)">'+esc(r.title||'--')+'</td>'
            +'<td><span style="font-size:11px;font-weight:700;color:#7c3aed;background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:2px 8px">'+esc(r.type||'--')+'</span></td>'
            +'<td style="font-size:11.5px;color:var(--muted)">'+esc(r.category||'--')+'</td>'
            +'<td style="font-size:12px;color:#16a34a;font-weight:600">'+esc(r.completionNote||r.resolution||'--')+'</td>'
            +'<td style="font-size:11.5px;color:var(--muted)">'+esc(r.completedBy||'--')+'</td>'
            +'<td>'+(isAdmin?'<button onclick="hmsMaintDelete('+parseInt(r.id,10)+')" class="btn-danger-sm" title="Delete">🗑</button>':'')+'</td>'
          +'</tr>';
        }).join('')
      : '<tr><td colspan="'+(isAdmin?8:7)+'" style="text-align:center;padding:36px;color:var(--muted)">No completed tasks yet.</td></tr>';

    return kpi
      +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">'
      +'<button class="btn btn-outline" onclick="hmsMaintTab=\'list\';render()" style="font-size:12px">← Back to Issues</button>'
      +'<div style="font-size:14px;font-weight:700;color:#16a34a;margin-left:6px">✅ Completed Tasks History</div>'
      +'</div>'
      +'<div class="card"><div class="card-head" style="background:linear-gradient(135deg,#16a34a,#15803d)">'
      +'<span class="card-title" style="color:#fff">✅ Completed Maintenance Tasks</span>'
      +'<span style="font-size:11px;color:rgba(255,255,255,.8);font-family:\'JetBrains Mono\',monospace">'+completedData.length+' tasks</span>'
      +'</div>'
      +'<div style="overflow-x:auto"><table><thead><tr>'
      +'<th>Completed On</th>'+(isAdmin?'<th>House</th>':'')+'<th>Title</th><th>Type</th><th>Category</th><th>Completion Note</th><th>Completed By</th><th>Action</th>'
      +'</tr></thead><tbody>'+taskRows+'</tbody></table></div></div>';
  }

  // ── Filters ────────────────────────────────────────────────
  var houseFilterSel = isAdmin
    ? '<select class="filter-sel" onchange="hmsMaintFilter=this.value;render()" style="min-width:140px">'
      +'<option value="All"'+(hmsMaintFilter==='All'?' selected':'')+'>All Houses</option>'
      +HM_HOUSES.map(function(h){return '<option'+(hmsMaintFilter===h.id?' selected':'')+'>'+h.id+'</option>';}).join('')
      +'</select>'
    : '';

  var statusFilterSel = '<select class="filter-sel" onchange="hmsMaintStatusFilter=this.value;render()" style="min-width:130px">'
    +'<option value="All"'+(hmsMaintStatusFilter==='All'?' selected':'')+'>All Status</option>'
    +'<option value="Open"'+(hmsMaintStatusFilter==='Open'?' selected':'')+'>🔴 Open</option>'
    +'<option value="In Progress"'+(hmsMaintStatusFilter==='In Progress'?' selected':'')+'>🟡 In Progress</option>'
    +'<option value="Pending Approval"'+(hmsMaintStatusFilter==='Pending Approval'?' selected':'')+'>🟠 Pending Approval</option>'
    +'<option value="Completed"'+(hmsMaintStatusFilter==='Completed'?' selected':'')+'>🟢 Completed</option>'
    +'<option value="Cancelled"'+(hmsMaintStatusFilter==='Cancelled'?' selected':'')+'>⚫ Cancelled</option>'
    +'</select>';

  var typeFilterSel = '<select class="filter-sel" onchange="hmsMaintTypeFilter=this.value;render()" style="min-width:160px">'
    +'<option value="All"'+(hmsMaintTypeFilter==='All'?' selected':'')+'>All Types</option>'
    +HMS_MAINT_TYPES.map(function(t){return '<option'+(hmsMaintTypeFilter===t?' selected':'')+'>'+t+'</option>';}).join('')
    +'</select>';

  // ── Apply filters ──────────────────────────────────────────
  var filtered = mine.slice().reverse().filter(function(r){
    var hMatch = !isAdmin || hmsMaintFilter==='All' || r.house===hmsMaintFilter;
    var sMatch = hmsMaintStatusFilter==='All' || r.status===hmsMaintStatusFilter;
    var tMatch = hmsMaintTypeFilter==='All' || r.type===hmsMaintTypeFilter;
    return hMatch && sMatch && tMatch;
  });

  // ── Table rows ─────────────────────────────────────────────
  var rows = filtered.length ? filtered.map(function(r){
    var hInfo   = HM_HOUSES.find(function(h){return h.id===r.house;})||{color:'#64748b',icon:'🏠'};
    var prColor = r.priority==='Urgent'?'#dc2626':r.priority==='High'?'#f59e0b':r.priority==='Medium'?'#2563eb':'#64748b';
    var stColor = r.status==='Completed'?'#16a34a':r.status==='In Progress'?'#d97706':r.status==='Pending Approval'?'#7c3aed':r.status==='Cancelled'?'#94a3b8':'#dc2626';
    return '<tr style="'+(r.priority==='Urgent'&&r.status!=='Completed'?'background:#fef2f2':'')+(r.status==='Completed'?'opacity:.7':'')+';">'
      +'<td style="font-family:\'JetBrains Mono\',monospace;font-size:11.5px">'+hmsFmt(r.date)+'</td>'
      +(isAdmin?'<td><span style="padding:2px 8px;border-radius:10px;font-size:10.5px;font-weight:700;background:'+hInfo.color+'22;color:'+hInfo.color+'">'+hInfo.icon+' '+esc(r.house||'--')+'</span></td>':'')
      +'<td>'
        +'<div style="font-weight:700;font-size:13px;color:var(--text)">'+esc(r.title||'--')+'</div>'
        +(r.location?'<div style="font-size:10.5px;color:var(--muted)">📍 '+esc(r.location)+'</div>':'')
      +'</td>'
      +'<td><span style="font-size:11px;font-weight:700;color:#7c3aed;background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:2px 8px">'+esc(r.type||'--')+'</span></td>'
      +'<td style="font-size:11.5px;color:var(--muted)">'+esc(r.category||'--')+'</td>'
      +'<td><span style="font-size:11px;font-weight:700;background:'+prColor+'18;color:'+prColor+';border:1px solid '+prColor+'55;border-radius:8px;padding:2px 8px">'+esc(r.priority||'--')+'</span></td>'
      +'<td><span style="font-size:11px;font-weight:700;background:'+stColor+'18;color:'+stColor+';border:1px solid '+stColor+'55;border-radius:8px;padding:2px 8px">'+esc(r.status||'Open')+'</span></td>'
      +'<td style="max-width:180px;white-space:normal;word-break:break-word;font-size:11.5px;color:var(--muted)">'+esc((r.description||'').substring(0,80))+(r.description&&r.description.length>80?'…':'')+'</td>'
      +'<td style="font-size:11.5px;color:var(--muted)">'+esc(r.reportedBy||'--')+'</td>'
      +'<td style="white-space:nowrap;display:flex;gap:4px;flex-wrap:wrap;align-items:center;min-width:130px">'
        +(r.status!=='Completed'&&r.status!=='Cancelled'
          ?'<button onclick="hmsMaintMarkDone('+parseInt(r.id,10)+')" style="padding:4px 10px;border-radius:7px;border:none;background:#16a34a;color:#fff;font-size:11px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif;white-space:nowrap">✅ Done</button>'
          :'')
        +(r.status==='Open'
          ?'<button onclick="hmsMaintProgress('+parseInt(r.id,10)+')" style="padding:4px 9px;border-radius:7px;border:1.5px solid #d97706;background:#fffbeb;color:#d97706;font-size:11px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif;white-space:nowrap">▶ In Progress</button>'
          :'')
        +'<button onclick="hmsMaintEditOpen('+parseInt(r.id,10)+')" style="padding:4px 9px;border-radius:7px;border:1.5px solid var(--border);background:var(--surface);color:var(--muted);font-size:11px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">✏</button>'
        +(isAdmin?'<button onclick="hmsMaintDelete('+parseInt(r.id,10)+')" class="btn-danger-sm">🗑</button>':'')
      +'</td>'
    +'</tr>';
  }).join('')
  : '<tr><td colspan="'+(isAdmin?10:9)+'" style="text-align:center;padding:40px;color:var(--muted)">🔧 No maintenance issues found. All in good shape!</td></tr>';

  return kpi
    + addForm
    +'<div style="display:flex;gap:10px;margin-bottom:16px;align-items:center;flex-wrap:wrap">'
    +houseFilterSel+statusFilterSel+typeFilterSel
    +'<button class="btn btn-primary" onclick="hmsMaintEditId=null;hmsMaintTab=\'add\';render()" style="margin-left:auto">+ Log Issue</button>'
    +'<button onclick="hmsMaintTab=\'tasks\';render()" style="padding:7px 14px;border-radius:9px;border:1.5px solid #16a34a;background:#f0fdf4;color:#16a34a;font-size:12px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">✅ Completed Tasks</button>'
    +'</div>'
    +'<div class="card">'
    +'<div class="card-head" style="background:linear-gradient(135deg,#7c3aed,#6d28d9)">'
    +'<span class="card-title" style="color:#fff">🔧 House Maintenance Issues</span>'
    +'<span style="font-size:11px;color:rgba(255,255,255,.8);font-family:\'JetBrains Mono\',monospace">Open: <b style="color:#fde68a">'+open+'</b> | Total: '+mine.length+'</span>'
    +'</div>'
    +'<div style="overflow-x:auto"><table><thead><tr>'
    +'<th>Date</th>'+(isAdmin?'<th>House</th>':'')+'<th>Title / Location</th><th>Type</th><th>Category</th><th>Priority</th><th>Status</th><th>Description</th><th>Reported By</th><th>Actions</th>'
    +'</tr></thead><tbody>'+rows+'</tbody></table></div>'
    +'</div>';
}

function _hmsMaintForm(myHouse, isAdmin, editRec){
  var r = editRec || {};
  var houseOptions = isAdmin
    ? HM_HOUSES.map(function(h){return '<option value="'+h.id+'"'+(r.house===h.id?' selected':'')+'>'+h.icon+' '+h.id+'</option>';}).join('')
    : '<option value="'+myHouse+'" selected>'+myHouse+'</option>';
  return '<div class="form-panel" style="margin-bottom:22px;border:2px solid #ddd6fe;border-radius:14px;padding:20px;background:linear-gradient(135deg,#faf5ff,#f5f3ff)">'
    +'<div class="form-title" style="color:#7c3aed;font-size:15px;font-weight:800;font-family:\'DM Sans\',sans-serif;margin-bottom:16px">'
    +(r.id?'✏ Edit Maintenance Record':'🔧 Log New Maintenance Issue / Requirement')+'</div>'
    +'<div class="form-grid g3" style="margin-bottom:14px">'

    +'<div class="form-group" style="grid-column:1/-1"><label>Title / Short Description *</label>'
    +'<input id="hms-maint-title" value="'+esc(r.title||'')+'" placeholder="e.g. Fan not working in Dorm 3, Replace broken window pane…" '
    +'style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)"/></div>'

    +'<div class="form-group"><label>House *</label>'
    +'<select id="hms-maint-house" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)">'
    +houseOptions+'</select></div>'

    +'<div class="form-group"><label>Issue Type *</label>'
    +'<select id="hms-maint-type" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)">'
    +HMS_MAINT_TYPES.map(function(t){return '<option'+(r.type===t?' selected':'')+'>'+t+'</option>';}).join('')
    +'</select></div>'

    +'<div class="form-group"><label>Category</label>'
    +'<select id="hms-maint-cat" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)">'
    +HMS_MAINT_CATEGORIES.map(function(c){return '<option'+(r.category===c?' selected':'')+'>'+c+'</option>';}).join('')
    +'</select></div>'

    +'<div class="form-group"><label>Priority</label>'
    +'<select id="hms-maint-priority" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)">'
    +HMS_MAINT_PRIORITIES.map(function(p){return '<option'+(r.priority===p?' selected':'')+'>'+p+'</option>';}).join('')
    +'</select></div>'

    +'<div class="form-group"><label>Location / Room</label>'
    +'<input id="hms-maint-loc" value="'+esc(r.location||'')+'" placeholder="e.g. Dormitory 2, Bathroom Block A, Dining Hall…" '
    +'style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)"/></div>'

    +'<div class="form-group"><label>Date Reported</label>'
    +'<input type="date" id="hms-maint-date" value="'+(r.date||hmsDate())+'" '
    +'style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)"/></div>'

    +'<div class="form-group"><label>Reported By</label>'
    +'<input id="hms-maint-by" value="'+(r.reportedBy||esc(currentUser?currentUser.name:''))+'" '
    +'style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)"/></div>'

    +'<div class="form-group"><label>Estimated Cost (₹)</label>'
    +'<input type="number" id="hms-maint-cost" value="'+(r.estimatedCost||'')+'" placeholder="Optional" min="0" '
    +'style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)"/></div>'

    +'<div class="form-group" style="grid-column:1/-1"><label>Full Description / Details *</label>'
    +'<textarea id="hms-maint-desc" rows="3" placeholder="Describe the defect, damage, or requirement in detail…" '
    +'style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text);resize:vertical;min-height:80px">'+esc(r.description||'')+'</textarea></div>'

    +'<div class="form-group" style="grid-column:1/-1"><label>Remarks / Additional Notes</label>'
    +'<input id="hms-maint-remark" value="'+esc(r.remark||'')+'" placeholder="Any additional notes or instructions…" '
    +'style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)"/></div>'

    +'</div>'
    +'<div class="form-actions">'
    +'<button class="btn btn-primary" onclick="hmsMaintSaveForm('+(r.id||'null')+')" style="background:linear-gradient(135deg,#7c3aed,#6d28d9)">'+(r.id?'💾 Update Record':'➕ Add Issue')+'</button>'
    +'<button class="btn btn-outline" onclick="hmsMaintTab=\'list\';hmsMaintEditId=null;render()">Cancel</button>'
    +'</div>'
    +'</div>';
}

function hmsMaintSaveForm(editId){
  var title = (document.getElementById('hms-maint-title').value||'').trim();
  var house = document.getElementById('hms-maint-house').value;
  var type  = document.getElementById('hms-maint-type').value;
  var cat   = document.getElementById('hms-maint-cat').value;
  var pri   = document.getElementById('hms-maint-priority').value;
  var loc   = (document.getElementById('hms-maint-loc').value||'').trim();
  var date  = document.getElementById('hms-maint-date').value;
  var by    = (document.getElementById('hms-maint-by').value||'').trim();
  var cost  = document.getElementById('hms-maint-cost').value;
  var desc  = (document.getElementById('hms-maint-desc').value||'').trim();
  var rem   = (document.getElementById('hms-maint-remark').value||'').trim();
  if(!title){ alert('Please enter a title / short description.'); return; }
  if(!desc){  alert('Please enter a full description.'); return; }
  var arr = hmsMaintData();
  if(editId){
    arr = arr.map(function(r){
      if(r.id!==editId) return r;
      return Object.assign({},r,{title:title,house:house,type:type,category:cat,priority:pri,location:loc,date:date,reportedBy:by||'House Master',estimatedCost:cost?+cost:null,description:desc,remark:rem,updatedAt:hmsDate()});
    });
    showToast&&showToast('Maintenance record updated ✅','#7c3aed');
  } else {
    arr.push({id:hmsNextId(arr),title:title,house:house,type:type,category:cat,priority:pri,location:loc,date:date,reportedBy:by||'House Master',estimatedCost:cost?+cost:null,description:desc,remark:rem,status:'Open',createdAt:hmsDate()});
    showToast&&showToast('Maintenance issue logged 🔧','#7c3aed');
  }
  hmsMaintSave(arr);
  hmsMaintTab='list'; hmsMaintEditId=null;
  render();
}

function hmsMaintMarkDone(id){
  var note = prompt('Enter completion note / action taken (required):','');
  if(note===null) return;
  if(!note.trim()){ alert('Please enter a completion note.'); return; }
  var arr = hmsMaintData().map(function(r){
    if(r.id!==id) return r;
    return Object.assign({},r,{status:'Completed',completionNote:note.trim(),completedOn:hmsDate(),completedBy:currentUser?currentUser.name:'House Master'});
  });
  hmsMaintSave(arr);
  showToast&&showToast('Task marked as completed ✅','#16a34a');
  render();
}

function hmsMaintProgress(id){
  var arr = hmsMaintData().map(function(r){
    if(r.id!==id) return r;
    return Object.assign({},r,{status:'In Progress',updatedAt:hmsDate()});
  });
  hmsMaintSave(arr);
  showToast&&showToast('Status updated to In Progress 🟡','#d97706');
  render();
}

function hmsMaintEditOpen(id){
  hmsMaintEditId = id;
  hmsMaintTab    = 'add';
  render();
}

function hmsMaintDelete(id){
  if(!confirm('Delete this maintenance record permanently?')) return;
  hmsMaintSave(hmsMaintData().filter(function(r){return r.id!==id;}));
  showToast&&showToast('Record deleted','#dc2626');
  render();
}

/* ── END MAINTENANCE MODULE ────────────────────────────────── */

function hmsRenderBehaviour(myHouse, isAdmin){
  var data = hmsArr('behaviour');
  var studentHouseMap = hmsMastGet('student_house');
  var types = ['Discipline Violation','Ragging / Bullying','Disrespect to Staff','Fighting','Theft','Damage to Property','Mobile Violation','Unauthorized Absence','Other'];
  var actions = ['Verbal Warning','Written Warning','Parent Called','Sent to Principal','Punishment','Counselling','Suspension','Other'];
  // Filter by house
  var myData = isAdmin ? data : data.filter(function(r){ return r.house===myHouse; });
  var houseFilter = isAdmin ? ('<select id="hms-beh-hf" class="filter-sel" onchange="render()" style="min-width:140px"><option value="All">All Houses</option>'+HM_HOUSES.map(function(h){return '<option>'+h.id+'</option>';}).join('')+'</select>') : '';
  var addForm = hmsBehTab==='add' ? '<div class="form-panel" style="margin-bottom:20px">'
    +'<div class="form-title" style="color:var(--accent)">📋 Log Behaviour Incident</div>'
    +'<div class="form-grid g3" style="margin-bottom:14px">'
    +'<div class="form-group"><label>Student *</label><select id="hms-beh-stu" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)"><option value="">-- Select Student --</option>'+students.filter(function(s){return s.hostel==='Yes';}).filter(function(s){ return isAdmin||studentHouseMap[String(s.id)]===myHouse; }).map(function(s){return '<option value="'+parseInt(s.id,10)+'">'+esc(s.name)+' ('+esc(s.cls)+')</option>';}).join('')+'</select></div>'
    +'<div class="form-group"><label>Incident Type *</label><select id="hms-beh-type" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)">'+types.map(function(t){return '<option>'+t+'</option>';}).join('')+'</select></div>'
    +'<div class="form-group"><label>Date</label><input type="date" id="hms-beh-date" value="'+hmsDate()+'" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)"/></div>'
    +'<div class="form-group"><label>Severity</label><select id="hms-beh-sev" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)"><option>Low</option><option selected>Medium</option><option>High</option><option>Critical</option></select></div>'
    +'<div class="form-group"><label>Action Taken</label><select id="hms-beh-action" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)">'+actions.map(function(a){return '<option>'+a+'</option>';}).join('')+'</select></div>'
    +'<div class="form-group"><label>Reported By</label><input id="hms-beh-by" value="'+(currentUser?esc(currentUser.name):'')+'" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)"/></div>'
    +'<div class="form-group" style="grid-column:1/-1"><label>Description / Details *</label><textarea id="hms-beh-desc" rows="3" placeholder="Describe the incident in detail…" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text);resize:vertical;min-height:70px"></textarea></div>'
    +'</div>'
    +'<div class="form-actions"><button class="btn btn-primary" onclick="hmsSaveBehaviour()">Save Incident</button><button class="btn btn-outline" onclick="hmsBehTab=\'list\';render()">Cancel</button></div>'
    +'</div>' : '';
  var openCount = myData.filter(function(r){return r.status==='Open';}).length;
  var rows = myData.length ? myData.slice().reverse().map(function(r){
    var stu = students.find(function(s){return s.id==r.stuId;})||{name:r.stuName||'--',cls:'--'};
    var hInfo = HM_HOUSES.find(function(h){return h.id===r.house;});
    var hColor = hInfo ? hInfo.color : '#64748b';
    return '<tr>'
      +'<td>'+hmsFmt(r.date)+'</td>'
      +'<td><div style="display:flex;align-items:center;gap:8px">'+avatarHTML(stu.name,26)+'<div><div style="font-weight:700;font-size:13px">'+esc(stu.name)+'</div><div style="font-size:10.5px;color:var(--muted)">'+esc(stu.cls||'--')+'</div></div></div></td>'
      +(isAdmin?'<td><span style="padding:2px 8px;border-radius:10px;font-size:10.5px;font-weight:700;background:'+hColor+'22;color:'+hColor+'">'+esc(r.house||'--')+'</span></td>':'')
      +'<td style="font-size:12.5px;font-weight:600">'+esc(r.type||'--')+'</td>'
      +'<td>'+hmsSeverityBadge(r.severity||'Low')+'</td>'
      +'<td style="max-width:200px;white-space:normal;word-break:break-word;font-size:12px;color:var(--muted)">'+esc(r.description||'--')+'</td>'
      +'<td style="font-size:12px;color:var(--muted)">'+esc(r.actionTaken||'--')+'</td>'
      +'<td>'+hmsStatusBadge(r.status||'Open')+'</td>'
      +'<td style="white-space:nowrap">'
      +(r.status==='Open'?'<button onclick="hmsResolveBehaviour('+parseInt(r.id,10)+')" class="btn-sm-green" style="margin-right:4px">✓ Resolve</button>':'')
      +(isAdmin?'<button onclick="hmsDelBehaviour('+parseInt(r.id,10)+')" class="btn-danger-sm">🗑</button>':'')
      +'</td></tr>';
  }).join('') : '<tr><td colspan="'+(isAdmin?9:8)+'" style="text-align:center;padding:40px;color:var(--muted)">No behaviour records'+(myHouse&&!isAdmin?' for '+myHouse+' House':'')+'. All clear! ✅</td></tr>';
  return '<div style="display:flex;gap:10px;margin-bottom:16px;align-items:center;flex-wrap:wrap">'
    +houseFilter
    +'<button class="btn btn-primary" onclick="hmsBehTab=\'add\';render()" style="margin-left:auto">+ Log Incident</button>'
    +'</div>'
    + addForm
    +'<div class="card"><div class="card-head"><span class="card-title">📋 Behaviour Incident Log</span>'
    +'<span style="font-size:11px;font-family:\'JetBrains Mono\',monospace;color:var(--muted)">Open: <b style="color:#dc2626">'+openCount+'</b> | Total: '+myData.length+'</span></div>'
    +'<div style="overflow-x:auto"><table><thead><tr><th>Date</th><th>Student</th>'+(isAdmin?'<th>House</th>':'')+'<th>Type</th><th>Severity</th><th>Description</th><th>Action Taken</th><th>Status</th><th>Action</th></tr></thead>'
    +'<tbody>'+rows+'</tbody></table></div></div>';
}
function hmsSaveBehaviour(){
  var stuId  = +document.getElementById('hms-beh-stu').value;
  var type   = document.getElementById('hms-beh-type').value;
  var date   = document.getElementById('hms-beh-date').value;
  var sev    = document.getElementById('hms-beh-sev').value;
  var action = document.getElementById('hms-beh-action').value;
  var by     = document.getElementById('hms-beh-by').value.trim();
  var desc   = document.getElementById('hms-beh-desc').value.trim();
  if(!stuId){alert('Please select a student.');return;}
  if(!desc){alert('Please enter a description of the incident.');return;}
  var stu  = students.find(function(s){return s.id===stuId;})||{};
  var house= hmsGetHouseForStudent(stuId);
  var data = hmsArr('behaviour');
  data.push({id:hmsNextId(data),stuId:stuId,stuName:stu.name||'',house:house,type:type,date:date,severity:sev,description:desc,actionTaken:action,reportedBy:by||'House Master',status:'Open'});
  hmsArrSet('behaviour',data);
  hmsBehTab='list';
  showToast('Behaviour incident logged ✅','#dc2626');
  render();
}
function hmsResolveBehaviour(id){
  var note=prompt('Enter resolution / action taken:','');
  if(note===null)return;
  var data=hmsArr('behaviour');
  data=data.map(function(r){return r.id==id?Object.assign({},r,{status:'Resolved',resolution:note||'Resolved',resolvedOn:hmsDate(),resolvedBy:currentUser?currentUser.name:'--'}):r;});
  hmsArrSet('behaviour',data);
  showToast('Incident resolved ✅','#16a34a');
  render();
}
function hmsDelBehaviour(id){
  if(!confirm('Delete this behaviour record?'))return;
  hmsArrSet('behaviour',hmsArr('behaviour').filter(function(r){return r.id!=id;}));
  render();
}
var hmsActTab = 'log'; // log | competitions | points
var hmsActFormOpen    = false;
var hmsCompFormOpen   = false;
var hmsPointFormOpen  = false;
var HMS_ACT_TYPES = [
  'Sports Event','Cultural Programme','Academic Competition','Cleanliness Drive',
  'PT/Drill Competition','March Past','Debate','Quiz','Art & Craft',
  'Essay Writing','Science Exhibition','Skit / Drama','Singing','Dance',
  'Interhouse Tournament','Republic / Independence Day','Annual Day','Other'
];
var HMS_ACT_STATUS = ['Upcoming','Ongoing','Completed','Cancelled'];
var HMS_POINT_REASONS = [
  'Sports Performance','Cultural Event','Academic Achievement','Discipline Award',
  'Cleanliness Award','March Past','Best House Award','Penalty Deduction',
  'Special Recognition','Quiz / Debate','Art & Craft','Other'
];
function hmsRenderActivities(myHouse, isAdmin){
  
  var subTabs = [
    {id:'log',          label:'Activity Log',        icon:'📅'},
    {id:'competitions', label:'Inter-House Events',  icon:'🏆'},
    {id:'points',       label:'Points Tally',        icon:'⭐'}
  ];
  var subBar = subTabs.map(function(t){
    var active = t.id===hmsActTab;
    return '<button onclick="hmsActTab=\''+t.id+'\';hmsActFormOpen=false;hmsCompFormOpen=false;hmsPointFormOpen=false;render()" style="padding:7px 18px;border-radius:8px;border:'+(active?'none':'1.5px solid var(--border)')+';cursor:pointer;font-size:12.5px;font-weight:'+(active?'700':'600')+';background:'+(active?'#8b5cf6':'var(--surface)')+';color:'+(active?'#fff':'var(--muted)')+';white-space:nowrap;transition:all .15s;display:flex;align-items:center;gap:5px">'+t.icon+' '+t.label+'</button>';
  }).join('');
  var body = '';
  if(hmsActTab==='log')          body = _hmsActLog(myHouse, isAdmin);
  if(hmsActTab==='competitions') body = _hmsActComp(myHouse, isAdmin);
  if(hmsActTab==='points')       body = _hmsActPoints(myHouse, isAdmin);
  
  var banner = '<div style="background:linear-gradient(135deg,#f5f3ff 0%,#ede9fe 100%);border:1.5px solid #c4b5fd;border-radius:14px;padding:18px 22px;margin-bottom:22px;display:flex;align-items:center;gap:18px">'
    +'<div style="font-size:38px">🏆</div>'
    +'<div><div style="font-family:\'Playfair Display\',serif;font-size:19px;font-weight:700;color:#7c3aed">House Activities Control System</div>'
    +'<div style="font-size:12.5px;color:#6d28d9;margin-top:3px">Track activities, log inter-house events, and manage house points -- all in one place.</div></div>'
    +'</div>';
  return banner
    + '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px">'+subBar+'</div>'
    + body;
}
function _hmsActLog(myHouse, isAdmin){
  var data = hmsArr('activities');
  var myData = isAdmin ? data : data.filter(function(r){ return !r.house || r.house===myHouse; });
  
  var hf = isAdmin
    ? '<select id="hms-act-hf" class="filter-sel" onchange="render()" style="min-width:140px"><option value="All">All Houses</option>'+HM_HOUSES.map(function(h){return '<option>'+h.id+'</option>';}).join('')+'</select>'
    : '';
  
  if(isAdmin){
    var hfVal = (document.getElementById('hms-act-hf')||{}).value||'All';
    if(hfVal!=='All') myData = myData.filter(function(r){return r.house===hfVal;});
  }
  
  var total    = myData.length;
  var upcoming = myData.filter(function(r){return r.status==='Upcoming';}).length;
  var ongoing  = myData.filter(function(r){return r.status==='Ongoing';}).length;
  var completed= myData.filter(function(r){return r.status==='Completed';}).length;
  var stats = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-bottom:20px">'
    +'<div class="stat-card" style="--c:#8b5cf6"><div class="stat-label">Total Activities</div><div class="stat-val" style="font-size:32px">'+total+'</div></div>'
    +'<div class="stat-card" style="--c:#3b78c9"><div class="stat-label">Upcoming</div><div class="stat-val" style="font-size:32px">'+upcoming+'</div></div>'
    +'<div class="stat-card" style="--c:#f59e0b"><div class="stat-label">Ongoing</div><div class="stat-val" style="font-size:32px">'+ongoing+'</div></div>'
    +'<div class="stat-card" style="--c:#16a34a"><div class="stat-label">Completed</div><div class="stat-val" style="font-size:32px">'+completed+'</div></div>'
    +'</div>';
  
  var addForm = '';
  if(hmsActFormOpen){
    addForm = '<div class="form-panel" style="margin-bottom:20px;border-color:#8b5cf6">'
      +'<div class="form-title" style="color:#7c3aed">📅 Log New Activity</div>'
      +'<div class="form-grid g3" style="margin-bottom:14px">'
      +'<div class="form-group"><label>Activity Name *</label><input id="hms-ac-name" placeholder="e.g. Annual Sports Meet" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)"/></div>'
      +'<div class="form-group"><label>Type</label><select id="hms-ac-type" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)">'+HMS_ACT_TYPES.map(function(t){return '<option>'+t+'</option>';}).join('')+'</select></div>'
      +'<div class="form-group"><label>Date</label><input type="date" id="hms-ac-date" value="'+hmsDate()+'" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)"/></div>'
      +'<div class="form-group"><label>House</label><select id="hms-ac-house" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)"><option value="">All Houses</option>'+HM_HOUSES.map(function(h){return '<option value="'+h.id+'"'+(myHouse===h.id?' selected':'')+'>'+h.id+'</option>';}).join('')+'</select></div>'
      +'<div class="form-group"><label>Venue / Location</label><input id="hms-ac-venue" placeholder="e.g. School Ground, Auditorium" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)"/></div>'
      +'<div class="form-group"><label>Status</label><select id="hms-ac-status" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)">'+HMS_ACT_STATUS.map(function(s){return '<option>'+s+'</option>';}).join('')+'</select></div>'
      +'<div class="form-group"><label>Organiser / In-Charge</label><input id="hms-ac-org" value="'+(currentUser?esc(currentUser.name):'')+'" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)"/></div>'
      +'<div class="form-group"><label>Participants (approx.)</label><input type="number" id="hms-ac-pax" placeholder="0" min="0" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)"/></div>'
      +'<div class="form-group"><label>Result / Outcome</label><input id="hms-ac-result" placeholder="e.g. KANGLA House won 1st place" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)"/></div>'
      +'<div class="form-group" style="grid-column:1/-1"><label>Description / Remarks</label><textarea id="hms-ac-desc" rows="3" placeholder="Describe the activity…" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text);resize:vertical;min-height:70px"></textarea></div>'
      +'</div>'
      +'<div class="form-actions"><button class="btn btn-primary" style="background:#7c3aed;box-shadow:0 2px 10px rgba(124,58,237,.28)" onclick="hmsSaveActivity()">Save Activity</button><button class="btn btn-outline" onclick="hmsActFormOpen=false;render()">Cancel</button></div>'
      +'</div>';
  }
  
  var rows = myData.length ? myData.slice().reverse().map(function(r){
    var hInfo = HM_HOUSES.find(function(h){return h.id===r.house;});
    var hCol  = hInfo ? hInfo.color : '#8b5cf6';
    var stCol = r.status==='Completed'?'#16a34a':r.status==='Ongoing'?'#f59e0b':r.status==='Cancelled'?'#dc2626':'#3b78c9';
    return '<tr>'
      +'<td style="font-family:\'JetBrains Mono\',monospace;font-size:11px;color:var(--muted)">'+hmsFmt(r.date)+'</td>'
      +'<td><div style="font-weight:700;font-size:13px">'+esc(r.name)+'</div><div style="font-size:11px;color:var(--muted)">'+esc(r.type)+'</div></td>'
      +(isAdmin?'<td><span style="padding:2px 9px;border-radius:10px;font-size:10.5px;font-weight:700;background:'+hCol+'22;color:'+hCol+';border:1px solid '+hCol+'55">'+(r.house||'All')+'</span></td>':'')
      +'<td style="font-size:12px;color:var(--muted)">'+esc(r.venue||'--')+'</td>'
      +'<td><span style="padding:2px 9px;border-radius:10px;font-size:10.5px;font-weight:700;background:'+stCol+'22;color:'+stCol+';border:1px solid '+stCol+'55">'+esc(r.status)+'</span></td>'
      +'<td style="font-size:12px;color:var(--muted)">'+esc(r.organiser||'--')+'</td>'
      +'<td style="font-size:12px;font-weight:600;color:#8b5cf6">'+esc(r.result||'--')+'</td>'
      +'<td style="white-space:nowrap">'
      +(r.status!=='Completed'?'<button onclick="hmsCompleteActivity('+parseInt(r.id,10)+')" class="btn-sm-green" style="margin-right:4px">✓ Done</button>':'')
      +(isAdmin?'<button onclick="hmsDelActivity('+parseInt(r.id,10)+')" class="btn-danger-sm">🗑</button>':'')
      +'</td></tr>';
  }).join('') : '<tr><td colspan="'+(isAdmin?8:7)+'" style="text-align:center;padding:40px;color:var(--muted)">No activities logged yet. Click <b>+ Log Activity</b> to start.</td></tr>';
  return stats
    +'<div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;align-items:center">'
    +hf
    +'<button class="btn btn-primary" style="background:#7c3aed;box-shadow:0 2px 10px rgba(124,58,237,.28);margin-left:auto" onclick="hmsActFormOpen=!hmsActFormOpen;render()">+ Log Activity</button>'
    +'</div>'
    + addForm
    +'<div class="card"><div class="card-head"><span class="card-title">📅 Activity Log</span>'
    +'<span style="font-size:11px;font-family:\'JetBrains Mono\',monospace;color:var(--muted)">'+myData.length+' record'+(myData.length!==1?'s':'')+'</span></div>'
    +'<div style="overflow-x:auto"><table><thead><tr><th>Date</th><th>Activity</th>'+(isAdmin?'<th>House</th>':'')+'<th>Venue</th><th>Status</th><th>Organiser</th><th>Result</th><th>Action</th></tr></thead>'
    +'<tbody>'+rows+'</tbody></table></div></div>';
}
function hmsSaveActivity(){
  var name = (document.getElementById('hms-ac-name')||{}).value||'';
  name = name.trim();
  if(!name){alert('Activity name is required.');return;}
  var data = hmsArr('activities');
  data.push({
    id:       hmsNextId(data),
    name:     name,
    type:     (document.getElementById('hms-ac-type')||{value:'Other'}).value,
    date:     (document.getElementById('hms-ac-date')||{}).value || hmsDate(),
    house:    (document.getElementById('hms-ac-house')||{}).value||'',
    venue:    ((document.getElementById('hms-ac-venue')||{}).value||'').trim(),
    status:   (document.getElementById('hms-ac-status')||{value:'Upcoming'}).value,
    organiser:((document.getElementById('hms-ac-org')||{}).value||'').trim(),
    participants: parseInt((document.getElementById('hms-ac-pax')||{}).value||'0')||0,
    result:   ((document.getElementById('hms-ac-result')||{}).value||'').trim(),
    description:((document.getElementById('hms-ac-desc')||{}).value||'').trim(),
    loggedBy: currentUser?currentUser.name:'--'
  });
  hmsArrSet('activities', data);
  hmsActFormOpen = false;
  showToast('Activity logged ✅','#7c3aed');
  render();
}
function hmsCompleteActivity(id){
  var result = prompt('Enter result / outcome for this activity (optional):', '');
  if(result===null) return;
  var data = hmsArr('activities');
  data = data.map(function(r){ return r.id==id ? Object.assign({},r,{status:'Completed',result:result||r.result||'Completed',completedOn:hmsDate()}) : r; });
  hmsArrSet('activities', data);
  showToast('Activity marked complete ✅','#16a34a');
  render();
}
function hmsDelActivity(id){
  if(!confirm('Delete this activity record?')) return;
  hmsArrSet('activities', hmsArr('activities').filter(function(r){return r.id!=id;}));
  render();
}
function _hmsActComp(myHouse, isAdmin){
  var data = hmsArr('competitions');
  
  var live    = data.filter(function(r){return r.status==='Ongoing';}).length;
  var upcoming= data.filter(function(r){return r.status==='Upcoming';}).length;
  var done    = data.filter(function(r){return r.status==='Completed';}).length;
  var stats = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-bottom:20px">'
    +'<div class="stat-card" style="--c:#8b5cf6"><div class="stat-label">Total Events</div><div class="stat-val" style="font-size:32px">'+data.length+'</div></div>'
    +'<div class="stat-card" style="--c:#f59e0b"><div class="stat-label">Live / Ongoing</div><div class="stat-val" style="font-size:32px">'+live+'</div></div>'
    +'<div class="stat-card" style="--c:#3b78c9"><div class="stat-label">Upcoming</div><div class="stat-val" style="font-size:32px">'+upcoming+'</div></div>'
    +'<div class="stat-card" style="--c:#16a34a"><div class="stat-label">Completed</div><div class="stat-val" style="font-size:32px">'+done+'</div></div>'
    +'</div>';
  
  var addForm = '';
  if(hmsCompFormOpen){
    addForm = '<div class="form-panel" style="margin-bottom:20px;border-color:#f59e0b">'
      +'<div class="form-title" style="color:#b45309">🏆 Add Inter-House Competition</div>'
      +'<div class="form-grid g3" style="margin-bottom:14px">'
      +'<div class="form-group"><label>Competition Name *</label><input id="hms-comp-name" placeholder="e.g. Interhouse Football Tournament" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)"/></div>'
      +'<div class="form-group"><label>Category</label><select id="hms-comp-cat" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)"><option>Sports</option><option>Cultural</option><option>Academic</option><option>PT / Drill</option><option>March Past</option><option>Debate</option><option>Quiz</option><option>Art</option><option>Other</option></select></div>'
      +'<div class="form-group"><label>Date</label><input type="date" id="hms-comp-date" value="'+hmsDate()+'" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)"/></div>'
      +'<div class="form-group"><label>Status</label><select id="hms-comp-status" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)">'+HMS_ACT_STATUS.map(function(s){return '<option>'+s+'</option>';}).join('')+'</select></div>'
      +'<div class="form-group"><label>Venue</label><input id="hms-comp-venue" placeholder="e.g. School Ground" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)"/></div>'
      +'<div class="form-group"><label>Points for 1st Place</label><input type="number" id="hms-comp-p1" value="10" min="0" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)"/></div>'
      +'<div class="form-group"><label>Points for 2nd Place</label><input type="number" id="hms-comp-p2" value="7" min="0" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)"/></div>'
      +'<div class="form-group"><label>Points for 3rd Place</label><input type="number" id="hms-comp-p3" value="5" min="0" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)"/></div>'
      +'<div class="form-group"><label>In-Charge</label><input id="hms-comp-ic" value="'+(currentUser?esc(currentUser.name):'')+'" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)"/></div>'
      // Positions for each house
      +'</div>'
      +'<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;font-family:\'JetBrains Mono\',monospace;margin-bottom:10px">🏠 Assign Finishing Positions (optional -- can set after completion)</div>'
      +'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;margin-bottom:14px">'
      +HM_HOUSES.map(function(h){
        return '<div style="border:1.5px solid '+h.color+'44;border-radius:8px;padding:10px 12px;background:'+h.color+'0a">'
          +'<div style="font-size:11.5px;font-weight:700;color:'+h.color+';margin-bottom:6px">'+h.icon+' '+h.id+'</div>'
          +'<select id="hms-comp-pos-'+h.id+'" style="width:100%;padding:6px 8px;border-radius:6px;border:1.5px solid var(--border);font-size:12px;background:var(--surface);color:var(--text)">'
          +'<option value="">--</option><option>1st</option><option>2nd</option><option>3rd</option><option>Participated</option>'
          +'</select></div>';
      }).join('')
      +'</div>'
      +'<div class="form-group" style="margin-bottom:14px"><label>Remarks / Notes</label><textarea id="hms-comp-rem" rows="2" placeholder="Any additional notes…" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text);resize:vertical;min-height:55px"></textarea></div>'
      +'<div class="form-actions"><button class="btn btn-primary" style="background:#b45309;box-shadow:0 2px 10px rgba(180,83,9,.28)" onclick="hmsSaveComp()">Save Competition</button><button class="btn btn-outline" onclick="hmsCompFormOpen=false;render()">Cancel</button></div>'
      +'</div>';
  }
  
  var cards = data.length ? data.slice().reverse().map(function(comp){
    var stCol = comp.status==='Completed'?'#16a34a':comp.status==='Ongoing'?'#f59e0b':comp.status==='Cancelled'?'#dc2626':'#3b78c9';
    var posHtml = '';
    if(comp.positions){
      posHtml = '<div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:6px">';
      Object.keys(comp.positions).forEach(function(hid){
        var pos = comp.positions[hid];
        if(!pos) return;
        var hInfo = HM_HOUSES.find(function(h){return h.id===hid;})||{color:'#64748b',icon:'🏠'};
        var posCol = pos==='1st'?'#f59e0b':pos==='2nd'?'#94a3b8':pos==='3rd'?'#b45309':'#64748b';
        posHtml += '<div style="display:flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:'+hInfo.color+'18;color:'+hInfo.color+';border:1px solid '+hInfo.color+'44">'
          +hInfo.icon+' '+hid
          +'<span style="color:'+posCol+';font-size:11px;font-weight:800;margin-left:4px">'+pos+'</span>'
          +'</div>';
      });
      posHtml += '</div>';
    }
    return '<div style="background:var(--surface);border-radius:12px;border:1.5px solid var(--border-soft);box-shadow:var(--shadow-sm);overflow:hidden;margin-bottom:14px">'
      +'<div style="background:linear-gradient(135deg,#7c3aed22,#b4530918);padding:14px 20px;border-bottom:1px solid var(--border-soft);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">'
      +'<div><div style="font-family:\'Playfair Display\',serif;font-size:16px;font-weight:700;color:var(--text)">'+esc(comp.name)+'</div>'
      +'<div style="font-size:11.5px;color:var(--muted);margin-top:2px">'+esc(comp.category||'--')+' &nbsp;·&nbsp; 📅 '+hmsFmt(comp.date)+(comp.venue?' &nbsp;·&nbsp; 📍 '+esc(comp.venue):'')+'</div></div>'
      +'<div style="display:flex;align-items:center;gap:8px">'
      +'<span style="padding:3px 11px;border-radius:10px;font-size:11px;font-weight:700;background:'+stCol+'22;color:'+stCol+';border:1px solid '+stCol+'55">'+esc(comp.status)+'</span>'
      +(comp.status!=='Completed'?'<button onclick="hmsCompComplete('+comp.id+')" class="btn-sm-green">✓ Done</button>':'')
      +(isAdmin?'<button onclick="hmsDelComp('+comp.id+')" class="btn-danger-sm">🗑</button>':'')
      +'</div></div>'
      +'<div style="padding:14px 20px">'
      +'<div style="display:flex;gap:20px;flex-wrap:wrap;font-size:12px;color:var(--muted)">'
      +'<span>🥇 <b style="color:#f59e0b">'+esc(String(comp.pts1||10))+'pts</b> 1st</span>'
      +'<span>🥈 <b style="color:#94a3b8">'+esc(String(comp.pts2||7))+'pts</b> 2nd</span>'
      +'<span>🥉 <b style="color:#b45309">'+esc(String(comp.pts3||5))+'pts</b> 3rd</span>'
      +(comp.incharge?' &nbsp;·&nbsp; 👤 '+esc(comp.incharge):'')
      +'</div>'
      + posHtml
      +(comp.remarks?'<div style="margin-top:8px;font-size:12px;color:var(--muted);font-style:italic">'+esc(comp.remarks)+'</div>':'')
      +'</div></div>';
  }).join('') : '<div style="text-align:center;padding:50px;color:var(--muted)">No inter-house competitions logged yet.</div>';
  return stats
    +'<div style="display:flex;gap:10px;margin-bottom:16px">'
    +'<button class="btn btn-primary" style="background:#b45309;box-shadow:0 2px 10px rgba(180,83,9,.28);margin-left:auto" onclick="hmsCompFormOpen=!hmsCompFormOpen;render()">+ Add Competition</button>'
    +'</div>'
    + addForm
    +'<div class="card"><div class="card-head"><span class="card-title">🏆 Inter-House Competition Register</span>'
    +'<span style="font-size:11px;font-family:\'JetBrains Mono\',monospace;color:var(--muted)">'+data.length+' event'+(data.length!==1?'s':'')+'</span></div>'
    +'<div style="padding:16px 20px">'+cards+'</div></div>';
}
function hmsSaveComp(){
  var name = ((document.getElementById('hms-comp-name')||{}).value||'').trim();
  if(!name){alert('Competition name is required.');return;}
  var positions = {};
  HM_HOUSES.forEach(function(h){
    var v = ((document.getElementById('hms-comp-pos-'+h.id)||{}).value||'');
    if(v) positions[h.id] = v;
  });
  var data = hmsArr('competitions');
  data.push({
    id:       hmsNextId(data),
    name:     name,
    category: (document.getElementById('hms-comp-cat')||{value:'Other'}).value,
    date:     (document.getElementById('hms-comp-date')||{}).value||hmsDate(),
    status:   (document.getElementById('hms-comp-status')||{value:'Upcoming'}).value,
    venue:    ((document.getElementById('hms-comp-venue')||{}).value||'').trim(),
    pts1:     parseInt((document.getElementById('hms-comp-p1')||{}).value)||10,
    pts2:     parseInt((document.getElementById('hms-comp-p2')||{}).value)||7,
    pts3:     parseInt((document.getElementById('hms-comp-p3')||{}).value)||5,
    incharge: ((document.getElementById('hms-comp-ic')||{}).value||'').trim(),
    remarks:  ((document.getElementById('hms-comp-rem')||{}).value||'').trim(),
    positions: positions
  });
  hmsArrSet('competitions', data);
  hmsCompFormOpen = false;
  showToast('Competition added ✅','#b45309');
  render();
}
function hmsCompComplete(id){
  var data = hmsArr('competitions');
  var comp = data.find(function(c){return c.id==id;});
  if(!comp) return;
  // Prompt positions
  var posStr = prompt(
    'Enter finishing positions (comma-separated)\nFormat: HOUSE:POSITION\nExample: KANGLA:1st,LOKTAK:2nd,SANGAI:3rd\n\nHouses: '+HM_HOUSES.map(function(h){return h.id;}).join(', '),
    Object.keys(comp.positions||{}).map(function(k){return k+':'+(comp.positions[k]||'');}).join(',')
  );
  if(posStr===null) return;
  var positions = comp.positions || {};
  posStr.split(',').forEach(function(part){
    var bits = part.trim().split(':');
    if(bits.length===2 && bits[0].trim() && bits[1].trim()) positions[bits[0].trim().toUpperCase()] = bits[1].trim();
  });
  data = data.map(function(c){ return c.id==id ? Object.assign({},c,{status:'Completed',positions:positions,completedOn:hmsDate()}) : c; });
  hmsArrSet('competitions', data);
  showToast('Competition marked complete ✅','#16a34a');
  render();
}
function hmsDelComp(id){
  if(!confirm('Delete this competition record?')) return;
  hmsArrSet('competitions', hmsArr('competitions').filter(function(r){return r.id!=id;}));
  render();
}
function _hmsActPoints(myHouse, isAdmin){
  var pdata = hmsArr('house_points'); // [{id, house, reason, pts, date, awardedBy, note}]
  
  var totals = {};
  HM_HOUSES.forEach(function(h){ totals[h.id] = 0; });
  pdata.forEach(function(r){ if(totals[r.house]!==undefined) totals[r.house] += (r.pts||0); });
  
  hmsArr('competitions').forEach(function(comp){
    if(comp.status!=='Completed' || !comp.positions) return;
    Object.keys(comp.positions).forEach(function(hid){
      var pos = comp.positions[hid];
      var pts = pos==='1st'?(comp.pts1||10) : pos==='2nd'?(comp.pts2||7) : pos==='3rd'?(comp.pts3||5) : pos==='Participated'?1 : 0;
      if(pts && totals[hid]!==undefined) totals[hid] += pts;
    });
  });
  
  var ranked = HM_HOUSES.map(function(h){ return {h:h, pts:totals[h.id]||0}; })
    .sort(function(a,b){ return b.pts - a.pts; });
  
  var maxPts = Math.max.apply(null, ranked.map(function(r){return r.pts;})) || 1;
  var podiumCards = ranked.map(function(r, idx){
    var pct = maxPts>0 ? Math.round(r.pts/maxPts*100) : 0;
    var medal = idx===0?'🥇':idx===1?'🥈':idx===2?'🥉':'';
    return '<div style="background:var(--surface);border-radius:12px;border:2px solid '+r.h.color+'55;padding:16px 18px;text-align:center;position:relative;overflow:hidden">'
      +'<div style="position:absolute;inset:0;background:'+r.h.color+'08"></div>'
      +'<div style="position:relative">'
      +(medal?'<div style="font-size:26px;margin-bottom:4px">'+medal+'</div>':'<div style="font-size:13px;font-weight:700;color:var(--muted2);margin-bottom:6px">#'+(idx+1)+'</div>')
      +'<div style="font-family:\'Playfair Display\',serif;font-size:17px;font-weight:800;color:'+r.h.color+';margin-bottom:2px">'+r.h.icon+' '+r.h.id+'</div>'
      +'<div style="font-family:\'Cormorant Garamond\',serif;font-size:32px;font-weight:800;color:var(--text)">'+r.pts+'</div>'
      +'<div style="font-size:10.5px;color:var(--muted);font-family:\'JetBrains Mono\',monospace;margin-bottom:8px">POINTS</div>'
      +'<div style="height:6px;background:var(--surface3);border-radius:3px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:'+r.h.color+';border-radius:3px;transition:width .5s"></div></div>'
      +'</div></div>';
  }).join('');
  
  var addForm = '';
  if(hmsPointFormOpen){
    addForm = '<div class="form-panel" style="margin-bottom:20px;border-color:#16a34a">'
      +'<div class="form-title" style="color:#16a34a">⭐ Award / Deduct House Points</div>'
      +'<div class="form-grid g3" style="margin-bottom:14px">'
      +'<div class="form-group"><label>House *</label><select id="hms-pt-house" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)">'
      +(isAdmin ? HM_HOUSES.map(function(h){return '<option value="'+h.id+'">'+h.icon+' '+h.id+'</option>';}).join('') : '<option value="'+(myHouse||'')+'">'+(myHouse||'--')+'</option>')
      +'</select></div>'
      +'<div class="form-group"><label>Points (+ to award, − to deduct) *</label><input type="number" id="hms-pt-pts" placeholder="e.g. 5 or -2" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)"/></div>'
      +'<div class="form-group"><label>Reason</label><select id="hms-pt-reason" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)">'+HMS_POINT_REASONS.map(function(r){return '<option>'+r+'</option>';}).join('')+'</select></div>'
      +'<div class="form-group"><label>Date</label><input type="date" id="hms-pt-date" value="'+hmsDate()+'" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)"/></div>'
      +'<div class="form-group"><label>Awarded By</label><input id="hms-pt-by" value="'+(currentUser?esc(currentUser.name):'')+'" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)"/></div>'
      +'<div class="form-group"><label>Note / Justification</label><input id="hms-pt-note" placeholder="Brief reason or event reference…" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)"/></div>'
      +'</div>'
      +'<div class="form-actions"><button class="btn btn-primary" style="background:#16a34a;box-shadow:0 2px 10px rgba(22,163,74,.28)" onclick="hmsSavePoints()">Save Points</button><button class="btn btn-outline" onclick="hmsPointFormOpen=false;render()">Cancel</button></div>'
      +'</div>';
  }
  
  var ledRows = pdata.length ? pdata.slice().reverse().map(function(r){
    var hInfo = HM_HOUSES.find(function(h){return h.id===r.house;})||{color:'#64748b',icon:'🏠'};
    var isPos = (r.pts||0)>=0;
    return '<tr>'
      +'<td style="font-family:\'JetBrains Mono\',monospace;font-size:11px;color:var(--muted)">'+hmsFmt(r.date)+'</td>'
      +'<td><span style="padding:2px 9px;border-radius:10px;font-size:10.5px;font-weight:700;background:'+hInfo.color+'22;color:'+hInfo.color+';border:1px solid '+hInfo.color+'55">'+hInfo.icon+' '+esc(r.house)+'</span></td>'
      +'<td style="font-family:\'JetBrains Mono\',monospace;font-size:14px;font-weight:800;color:'+(isPos?'#16a34a':'#dc2626')+'">'+(isPos?'+':'')+r.pts+'</td>'
      +'<td style="font-size:12.5px;font-weight:600">'+esc(r.reason)+'</td>'
      +'<td style="font-size:12px;color:var(--muted)">'+esc(r.note||'--')+'</td>'
      +'<td style="font-size:12px;color:var(--muted)">'+esc(r.awardedBy||'--')+'</td>'
      +'<td>'+(isAdmin?'<button onclick="hmsDelPoints('+parseInt(r.id,10)+')" class="btn-danger-sm">🗑</button>':'')+'</td>'
      +'</tr>';
  }).join('') : '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--muted)">No points entries yet.</td></tr>';
  return '<div style="margin-bottom:20px">'
    +'<div style="font-family:\'JetBrains Mono\',monospace;font-size:10.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.12em;margin-bottom:12px;font-weight:600">⭐ Current House Standings</div>'
    +'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px">'+podiumCards+'</div>'
    +'</div>'
    +'<div style="display:flex;gap:10px;margin-bottom:16px">'
    +'<button class="btn btn-primary" style="background:#16a34a;box-shadow:0 2px 10px rgba(22,163,74,.28);margin-left:auto" onclick="hmsPointFormOpen=!hmsPointFormOpen;render()">+ Award / Deduct Points</button>'
    +'</div>'
    + addForm
    +'<div class="card"><div class="card-head"><span class="card-title">⭐ Points Ledger</span>'
    +'<span style="font-size:11px;font-family:\'JetBrains Mono\',monospace;color:var(--muted)">'+pdata.length+' entr'+(pdata.length!==1?'ies':'y')+' (manual) + competition auto-points</span></div>'
    +'<div style="overflow-x:auto"><table><thead><tr><th>Date</th><th>House</th><th>Points</th><th>Reason</th><th>Note</th><th>Awarded By</th><th>Del</th></tr></thead>'
    +'<tbody>'+ledRows+'</tbody></table></div></div>';
}
function hmsSavePoints(){
  var house = ((document.getElementById('hms-pt-house')||{}).value||'').trim();
  var pts   = parseInt((document.getElementById('hms-pt-pts')||{}).value||'0');
  if(!house){alert('Please select a house.');return;}
  if(!pts&&pts!==0){alert('Please enter a valid points value (can be negative).');return;}
  var data = hmsArr('house_points');
  data.push({
    id:         hmsNextId(data),
    house:      house,
    pts:        pts,
    reason:     (document.getElementById('hms-pt-reason')||{value:'Other'}).value,
    date:       (document.getElementById('hms-pt-date')||{}).value||hmsDate(),
    awardedBy:  ((document.getElementById('hms-pt-by')||{}).value||'').trim(),
    note:       ((document.getElementById('hms-pt-note')||{}).value||'').trim()
  });
  hmsArrSet('house_points', data);
  hmsPointFormOpen = false;
  showToast('Points recorded ✅ ('+house+': '+(pts>=0?'+':'')+pts+')', pts>=0?'#16a34a':'#dc2626');
  render();
}
function hmsDelPoints(id){
  if(!confirm('Delete this points entry?')) return;
  hmsArrSet('house_points', hmsArr('house_points').filter(function(r){return r.id!=id;}));
  render();
}
var hmsHealthTab = 'list';
function hmsRenderHealth(myHouse, isAdmin){
  var data = hmsArr('health');
  var studentHouseMap = hmsMastGet('student_house');
  var myData = isAdmin ? data : data.filter(function(r){return r.house===myHouse;});
  var conditions = ['Fever','Cold / Flu','Headache','Stomach Ache','Injury','Chronic Condition','Anxiety / Stress','Eye Problem','Dental','Other'];
  var statuses = ['Healthy','Monitoring','Recovering','Referred','Hospitalised'];
  var addForm = hmsHealthTab==='add' ? '<div class="form-panel" style="margin-bottom:20px">'
    +'<div class="form-title" style="color:var(--accent)">🩺 Log Health Record</div>'
    +'<div class="form-grid g3" style="margin-bottom:14px">'
    +'<div class="form-group"><label>Student *</label><select id="hms-hl-stu" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)"><option value="">-- Select Student --</option>'+students.filter(function(s){return s.hostel==='Yes';}).filter(function(s){ return isAdmin||studentHouseMap[String(s.id)]===myHouse; }).map(function(s){return '<option value="'+parseInt(s.id,10)+'">'+esc(s.name)+' ('+esc(s.cls)+')</option>';}).join('')+'</select></div>'
    +'<div class="form-group"><label>Condition *</label><select id="hms-hl-cond" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)">'+conditions.map(function(c){return '<option>'+c+'</option>';}).join('')+'</select></div>'
    +'<div class="form-group"><label>Date Noted</label><input type="date" id="hms-hl-date" value="'+hmsDate()+'" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)"/></div>'
    +'<div class="form-group"><label>Status</label><select id="hms-hl-status" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)">'+statuses.map(function(s){return '<option>'+s+'</option>';}).join('')+'</select></div>'
    +'<div class="form-group"><label>Medication Given</label><input id="hms-hl-med" placeholder="e.g. Paracetamol 500mg" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)"/></div>'
    +'<div class="form-group"><label>Referred To</label><input id="hms-hl-ref" placeholder="e.g. District Hospital" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)"/></div>'
    +'<div class="form-group" style="grid-column:1/-1"><label>Notes / Observations</label><textarea id="hms-hl-notes" rows="3" placeholder="Symptoms, observations, parent notified…" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text);resize:vertical;min-height:70px"></textarea></div>'
    +'</div>'
    +'<div class="form-actions"><button class="btn btn-primary" onclick="hmsSaveHealth()">Save Health Record</button><button class="btn btn-outline" onclick="hmsHealthTab=\'list\';render()">Cancel</button></div>'
    +'</div>' : '';
  var monitoring = myData.filter(function(r){return r.status==='Monitoring';}).length;
  var referred   = myData.filter(function(r){return r.status==='Referred'||r.status==='Hospitalised';}).length;
  var rows = myData.length ? myData.slice().reverse().map(function(r){
    var stu = students.find(function(s){return s.id==r.stuId;})||{name:r.stuName||'--',cls:'--'};
    var hInfo = HM_HOUSES.find(function(h){return h.id===r.house;});
    var hColor = hInfo ? hInfo.color : '#64748b';
    return '<tr>'
      +'<td>'+hmsFmt(r.date)+'</td>'
      +'<td><div style="display:flex;align-items:center;gap:8px">'+avatarHTML(stu.name,26)+'<div><div style="font-weight:700;font-size:13px">'+esc(stu.name)+'</div><div style="font-size:10.5px;color:var(--muted)">'+esc(stu.cls||'--')+'</div></div></div></td>'
      +(isAdmin?'<td><span style="padding:2px 8px;border-radius:10px;font-size:10.5px;font-weight:700;background:'+hColor+'22;color:'+hColor+'">'+esc(r.house||'--')+'</span></td>':'')
      +'<td style="font-weight:600">'+esc(r.condition||'--')+'</td>'
      +'<td style="font-size:12px;color:var(--muted)">'+esc(r.medication||'--')+'</td>'
      +'<td style="font-size:12px;color:var(--muted)">'+esc(r.referredTo||'--')+'</td>'
      +'<td style="max-width:180px;white-space:normal;font-size:12px;color:var(--muted)">'+esc(r.notes||'--')+'</td>'
      +'<td>'+hmsStatusBadge(r.status||'Monitoring')+'</td>'
      +'<td style="white-space:nowrap">'
      +(r.status!=='Healthy'?'<button onclick="hmsMarkHealthy('+parseInt(r.id,10)+')" class="btn-sm-green" style="margin-right:4px">✓ Healthy</button>':'')
      +(isAdmin?'<button onclick="hmsDelHealth('+parseInt(r.id,10)+')" class="btn-danger-sm">🗑</button>':'')
      +'</td></tr>';
  }).join('') : '<tr><td colspan="'+(isAdmin?9:8)+'" style="text-align:center;padding:40px;color:var(--muted)">No health records. All students healthy! ✅</td></tr>';
  return '<div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;align-items:center">'
    +'<div style="display:flex;gap:10px">'
    +'<div style="padding:8px 16px;border-radius:9px;background:#f59e0b18;border:1px solid #f59e0b55;font-size:13px;font-weight:700;color:#f59e0b">🔶 Monitoring: '+monitoring+'</div>'
    +'<div style="padding:8px 16px;border-radius:9px;background:#dc262618;border:1px solid #dc262655;font-size:13px;font-weight:700;color:#dc2626">🏥 Referred: '+referred+'</div>'
    +'</div>'
    +'<button class="btn btn-primary" onclick="hmsHealthTab=\'add\';render()" style="margin-left:auto">+ Log Health Record</button>'
    +'</div>'
    + addForm
    +'<div class="card"><div class="card-head"><span class="card-title">🩺 Health Monitoring Register</span><span style="font-size:11px;font-family:\'JetBrains Mono\',monospace;color:var(--muted)">'+myData.length+' records</span></div>'
    +'<div style="overflow-x:auto"><table><thead><tr><th>Date</th><th>Student</th>'+(isAdmin?'<th>House</th>':'')+'<th>Condition</th><th>Medication</th><th>Referred To</th><th>Notes</th><th>Status</th><th>Action</th></tr></thead>'
    +'<tbody>'+rows+'</tbody></table></div></div>';
}
function hmsSaveHealth(){
  var stuId = +document.getElementById('hms-hl-stu').value;
  var cond  = document.getElementById('hms-hl-cond').value;
  var date  = document.getElementById('hms-hl-date').value;
  var stat  = document.getElementById('hms-hl-status').value;
  var med   = document.getElementById('hms-hl-med').value.trim();
  var ref   = document.getElementById('hms-hl-ref').value.trim();
  var notes = document.getElementById('hms-hl-notes').value.trim();
  if(!stuId){alert('Please select a student.');return;}
  var stu   = students.find(function(s){return s.id===stuId;})||{};
  var house = hmsGetHouseForStudent(stuId);
  var data  = hmsArr('health');
  data.push({id:hmsNextId(data),stuId:stuId,stuName:stu.name||'',house:house,condition:cond,date:date,status:stat,medication:med,referredTo:ref,notes:notes,loggedBy:currentUser?currentUser.name:'--'});
  hmsArrSet('health',data);
  hmsHealthTab='list';
  showToast('Health record saved 🩺','#f59e0b');
  render();
}
function hmsMarkHealthy(id){
  var data=hmsArr('health');
  data=data.map(function(r){return r.id==id?Object.assign({},r,{status:'Healthy',resolvedOn:hmsDate()}):r;});
  hmsArrSet('health',data);
  showToast('Marked as Healthy ✅','#16a34a');
  render();
}
function hmsDelHealth(id){
  if(!confirm('Delete this health record?'))return;
  hmsArrSet('health',hmsArr('health').filter(function(r){return r.id!=id;}));
  render();
}
var hmsAcadTab = 'list';
function hmsRenderAcademic(myHouse, isAdmin){
  var data = hmsArr('academic');
  var studentHouseMap = hmsMastGet('student_house');
  var myData = isAdmin ? data : data.filter(function(r){return r.house===myHouse;});
  var subjects = ['Mathematics','Science','English','Hindi','Social Studies','Reasoning','GK','Overall'];
  var concerns = ['Failing Tests','Poor Attendance','Not Doing Homework','Distracted in Class','Needs Extra Coaching','Language Difficulty','Other'];
  var addForm = hmsAcadTab==='add' ? '<div class="form-panel" style="margin-bottom:20px">'
    +'<div class="form-title" style="color:var(--accent)">📚 Log Academic Note</div>'
    +'<div class="form-grid g3" style="margin-bottom:14px">'
    +'<div class="form-group"><label>Student *</label><select id="hms-ac-stu" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)"><option value="">-- Select Student --</option>'+students.filter(function(s){return s.hostel==='Yes';}).filter(function(s){ return isAdmin||studentHouseMap[String(s.id)]===myHouse; }).map(function(s){return '<option value="'+parseInt(s.id,10)+'">'+esc(s.name)+' ('+esc(s.cls)+')</option>';}).join('')+'</select></div>'
    +'<div class="form-group"><label>Subject Area</label><select id="hms-ac-sub" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)">'+subjects.map(function(s){return '<option>'+s+'</option>';}).join('')+'</select></div>'
    +'<div class="form-group"><label>Date</label><input type="date" id="hms-ac-date" value="'+hmsDate()+'" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)"/></div>'
    +'<div class="form-group"><label>Concern Type</label><select id="hms-ac-type" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)">'+concerns.map(function(c){return '<option>'+c+'</option>';}).join('')+'</select></div>'
    +'<div class="form-group"><label>Needs Follow-up?</label><select id="hms-ac-flag" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)"><option value="Yes">Yes -- Flag for Attention</option><option value="No">No -- Just noting</option></select></div>'
    +'<div class="form-group"><label>Extra Coaching Needed?</label><select id="hms-ac-coach" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)"><option>No</option><option>Yes</option><option>Already arranged</option></select></div>'
    +'<div class="form-group" style="grid-column:1/-1"><label>Observation / Notes</label><textarea id="hms-ac-notes" rows="3" placeholder="Describe the academic concern or observation…" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text);resize:vertical;min-height:70px"></textarea></div>'
    +'</div>'
    +'<div class="form-actions"><button class="btn btn-primary" onclick="hmsSaveAcademic()">Save Note</button><button class="btn btn-outline" onclick="hmsAcadTab=\'list\';render()">Cancel</button></div>'
    +'</div>' : '';
  var flagged = myData.filter(function(r){return r.flag==='Yes';}).length;
  var coaching = myData.filter(function(r){return r.coaching==='Yes';}).length;
  var rows = myData.length ? myData.slice().reverse().map(function(r){
    var stu = students.find(function(s){return s.id==r.stuId;})||{name:r.stuName||'--',cls:'--'};
    var hInfo = HM_HOUSES.find(function(h){return h.id===r.house;});
    var hColor = hInfo ? hInfo.color : '#64748b';
    return '<tr>'
      +'<td>'+hmsFmt(r.date)+'</td>'
      +'<td><div style="display:flex;align-items:center;gap:8px">'+avatarHTML(stu.name,26)+'<div><div style="font-weight:700;font-size:13px">'+esc(stu.name)+'</div><div style="font-size:10.5px;color:var(--muted)">'+esc(stu.cls||'--')+'</div></div></div></td>'
      +(isAdmin?'<td><span style="padding:2px 8px;border-radius:10px;font-size:10.5px;font-weight:700;background:'+hColor+'22;color:'+hColor+'">'+esc(r.house||'--')+'</span></td>':'')
      +'<td style="font-weight:600">'+esc(r.subject||'--')+'</td>'
      +'<td>'+esc(r.concernType||'--')+'</td>'
      +'<td style="max-width:200px;white-space:normal;font-size:12px;color:var(--muted)">'+esc(r.notes||'--')+'</td>'
      +'<td>'+(r.coaching==='Yes'||r.coaching==='Already arranged'?'<span style="padding:2px 8px;border-radius:8px;font-size:10.5px;font-weight:700;background:#3b78c918;color:#3b78c9">'+esc(r.coaching)+'</span>':'<span style="color:var(--muted2);font-size:12px">--</span>')+'</td>'
      +'<td>'+(r.flag==='Yes'?'<span style="padding:2px 8px;border-radius:8px;font-size:10.5px;font-weight:700;background:#dc262618;color:#dc2626">⚑ Flagged</span>':'<span style="color:#16a34a;font-size:12px">✓</span>')+'</td>'
      +'<td>'+(isAdmin?'<button onclick="hmsDelAcademic('+parseInt(r.id,10)+')" class="btn-danger-sm">🗑</button>':'')+'</td>'
      +'</tr>';
  }).join('') : '<tr><td colspan="'+(isAdmin?9:8)+'" style="text-align:center;padding:40px;color:var(--muted)">No academic records yet. ✅</td></tr>';
  return '<div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;align-items:center">'
    +'<div style="display:flex;gap:10px">'
    +'<div style="padding:8px 16px;border-radius:9px;background:#dc262618;border:1px solid #dc262655;font-size:13px;font-weight:700;color:#dc2626">⚑ Flagged: '+flagged+'</div>'
    +'<div style="padding:8px 16px;border-radius:9px;background:#3b78c918;border:1px solid #3b78c955;font-size:13px;font-weight:700;color:#3b78c9">📖 Coaching: '+coaching+'</div>'
    +'</div>'
    +'<button class="btn btn-primary" onclick="hmsAcadTab=\'add\';render()" style="margin-left:auto">+ Log Academic Note</button>'
    +'</div>'
    + addForm
    +'<div class="card"><div class="card-head"><span class="card-title">📚 Academic Follow-up Register</span><span style="font-size:11px;font-family:\'JetBrains Mono\',monospace;color:var(--muted)">'+myData.length+' records</span></div>'
    +'<div style="overflow-x:auto"><table><thead><tr><th>Date</th><th>Student</th>'+(isAdmin?'<th>House</th>':'')+'<th>Subject</th><th>Concern</th><th>Notes</th><th>Coaching</th><th>Flag</th><th>Del</th></tr></thead>'
    +'<tbody>'+rows+'</tbody></table></div></div>';
}
function hmsSaveAcademic(){
  var stuId  = +document.getElementById('hms-ac-stu').value;
  var sub    = document.getElementById('hms-ac-sub').value;
  var date   = document.getElementById('hms-ac-date').value;
  var type   = document.getElementById('hms-ac-type').value;
  var flag   = document.getElementById('hms-ac-flag').value;
  var coach  = document.getElementById('hms-ac-coach').value;
  var notes  = document.getElementById('hms-ac-notes').value.trim();
  if(!stuId){alert('Please select a student.');return;}
  var stu    = students.find(function(s){return s.id===stuId;})||{};
  var house  = hmsGetHouseForStudent(stuId);
  var data   = hmsArr('academic');
  data.push({id:hmsNextId(data),stuId:stuId,stuName:stu.name||'',house:house,subject:sub,date:date,concernType:type,flag:flag,coaching:coach,notes:notes,loggedBy:currentUser?currentUser.name:'--'});
  hmsArrSet('academic',data);
  hmsAcadTab='list';
  showToast('Academic note saved 📚','#3b78c9');
  render();
}
function hmsDelAcademic(id){
  if(!confirm('Delete this academic record?'))return;
  hmsArrSet('academic',hmsArr('academic').filter(function(r){return r.id!=id;}));
  render();
}
var hmsRCState = null;
function hmsRenderRollCall(myHouse, isAdmin){
  var today = hmsDate();
  var studentHouseMap = hmsMastGet('student_house');
  var rollData = hmsArr('rollcall');
  var housesToShow = isAdmin ? HM_HOUSES.map(function(h){return h.id;}) : (myHouse ? [myHouse] : []);
  if(!housesToShow.length){
    return '<div style="text-align:center;padding:60px;color:var(--muted)"><div style="font-size:48px">📋</div><div style="font-size:16px;font-weight:700;margin-top:16px">No house assigned</div></div>';
  }
  
  if(hmsRCState){
    var rc = hmsRCState;
    var hInfo = HM_HOUSES.find(function(h){return h.id===rc.house;})||{color:'#64748b',icon:'🏠'};
    var stuList = students.filter(function(s){return s.hostel==='Yes' && studentHouseMap[String(s.id)]===rc.house;}).sort(function(a,b){return (a.cls||'').localeCompare(b.cls||'')||a.name.localeCompare(b.name);});
    var marks = rc.marks;
    var pCount=0,aCount=0,lCount=0,oCount=0,uCount=0;
    stuList.forEach(function(s){var m=marks[s.id]||'';if(m==='P')pCount++;else if(m==='A')aCount++;else if(m==='L')lCount++;else if(m==='O')oCount++;else uCount++;});
    var stuRows = stuList.map(function(s,idx){
      var m=marks[s.id]||'';
      var rowBg=m==='P'?'#f0fdf4':m==='A'?'#fef2f2':m==='L'?'#fffbeb':m==='O'?'#eff6ff':'var(--surface)';
      return '<tr style="background:'+rowBg+';transition:background .15s">'
        +'<td style="text-align:center;font-family:\'JetBrains Mono\',monospace;font-size:11px;color:var(--muted)">'+(idx+1)+'</td>'
        +'<td><div style="display:flex;align-items:center;gap:8px">'+avatarHTML(s.name,28)+'<div><div style="font-size:13px;font-weight:700">'+esc(s.name)+'</div><div style="font-size:10.5px;color:var(--muted)">'+esc(s.cls||'--')+' &nbsp;·&nbsp; Roll #'+esc(s.roll||'--')+'</div></div></div></td>'
        +'<td style="text-align:center">'
        +['P','A','L','O'].map(function(btn){
          var colors={P:{bg:'#16a34a',lt:'#dcfce7',bd:'#86efac',lbl:'Present'},A:{bg:'#dc2626',lt:'#fee2e2',bd:'#fca5a5',lbl:'Absent'},L:{bg:'#d97706',lt:'#fef3c7',bd:'#fde68a',lbl:'Leave'},O:{bg:'#2563eb',lt:'#dbeafe',bd:'#93c5fd',lbl:'Outpass'}};
          var c=colors[btn];var active=m===btn;
          return '<button onclick="hmsRCMark(\''+parseInt(s.id,10)+'\',\''+btn+'\')" title="'+c.lbl+'" style="padding:4px 10px;border-radius:6px;border:1.5px solid '+(active?c.bg:c.bd)+';background:'+(active?c.bg:c.lt)+';color:'+(active?'#fff':c.bg)+';font-size:11px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif;margin:0 2px;transition:all .12s">'+btn+'</button>';
        }).join('')
        +'</td>'
        +'</tr>';
    }).join('');
    var allMarked = uCount===0;
    return '<div style="background:'+hInfo.color+';border-radius:12px 12px 0 0;padding:14px 20px;color:#fff;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">'
      +'<div><div style="font-size:17px;font-weight:700">'+(hInfo.icon||'🏠')+' '+rc.house+' House -- '+esc(rc.session)+'</div>'
      +'<div style="font-size:11.5px;opacity:.85">'+hmsFmt(today)+' &nbsp;·&nbsp; '+stuList.length+' students</div></div>'
      +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
      +'<span style="padding:3px 11px;border-radius:20px;background:rgba(255,255,255,.2);font-size:12px;font-weight:700">✓ P: '+pCount+'</span>'
      +'<span style="padding:3px 11px;border-radius:20px;background:rgba(255,255,255,.2);font-size:12px;font-weight:700">✗ A: '+aCount+'</span>'
      +'<span style="padding:3px 11px;border-radius:20px;background:rgba(255,255,255,.2);font-size:12px;font-weight:700">L: '+lCount+'</span>'
      +'<span style="padding:3px 11px;border-radius:20px;background:rgba(255,255,255,.2);font-size:12px;font-weight:700">O: '+oCount+'</span>'
      +(uCount?'<span style="padding:3px 11px;border-radius:20px;background:rgba(255,0,0,.35);font-size:12px;font-weight:700">? Unmarked: '+uCount+'</span>':'')
      +'</div>'
      +'</div>'
      +'<div style="background:var(--surface);border:1.5px solid var(--border);border-top:none;border-radius:0 0 12px 12px;margin-bottom:16px">'
      +'<div style="padding:10px 16px;background:var(--surface2);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px;flex-wrap:wrap">'
      +'<button onclick="hmsRCMarkAll(\'P\')" style="padding:5px 12px;border-radius:7px;border:1.5px solid #86efac;background:#dcfce7;color:#16a34a;font-size:11px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">✓ Mark All Present</button>'
      +'<button onclick="hmsRCMarkAll(\'A\')" style="padding:5px 12px;border-radius:7px;border:1.5px solid #fca5a5;background:#fee2e2;color:#dc2626;font-size:11px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">✗ Mark All Absent</button>'
      +'<span style="font-size:11px;color:var(--muted);margin-left:auto">P=Present &nbsp; A=Absent &nbsp; L=Leave &nbsp; O=Outpass</span>'
      +'</div>'
      +'<div style="overflow-x:auto"><table><thead><tr><th style="width:36px;text-align:center">#</th><th>Student</th><th style="text-align:center;min-width:180px">Mark Attendance</th></tr></thead><tbody>'+stuRows+'</tbody></table></div>'
      +'<div style="padding:14px 16px;display:flex;gap:10px;justify-content:flex-end;border-top:1px solid var(--border)">'
      +(allMarked
        ?'<button onclick="hmsSubmitRollCall()" style="background:var(--accent);color:#fff;border:none;border-radius:8px;padding:9px 22px;cursor:pointer;font-size:13px;font-weight:700;font-family:\'DM Sans\',sans-serif">✅ Submit Roll Call</button>'
        :'<span style="font-size:12px;color:#d97706;font-weight:600;align-self:center">⚠ '+uCount+' student(s) unmarked</span>'
         +'<button onclick="hmsSubmitRollCall()" style="background:#d97706;color:#fff;border:none;border-radius:8px;padding:9px 22px;cursor:pointer;font-size:13px;font-weight:700;font-family:\'DM Sans\',sans-serif">Submit Anyway</button>')
      +'<button onclick="hmsRCState=null;render()" style="background:var(--surface2);color:var(--muted);border:1.5px solid var(--border);border-radius:8px;padding:9px 16px;cursor:pointer;font-size:13px;font-weight:600;font-family:\'DM Sans\',sans-serif">Cancel</button>'
      +'</div>'
      +'</div>';
  }
  
  var SESSIONS = ['Morning (06:00)', 'Afternoon (14:00)', 'Night (22:00)'];
  var todayCards = housesToShow.map(function(house){
    var hInfo   = HM_HOUSES.find(function(h){return h.id===house;})||{color:'#64748b',icon:'🏠'};
    var stuList = students.filter(function(s){return s.hostel==='Yes' && studentHouseMap[String(s.id)]===house;});
    var todayRoll = rollData.filter(function(r){return r.house===house&&r.date===today;});
    var lastRoll  = todayRoll.length ? todayRoll[todayRoll.length-1] : null;
    return '<div style="background:var(--surface);border-radius:12px;border:2px solid '+hInfo.color+'44;overflow:hidden;flex:1;min-width:220px">'
      +'<div style="background:'+hInfo.color+';padding:12px 16px;color:#fff;display:flex;align-items:center;justify-content:space-between">'
      +'<div><div style="font-weight:700;font-size:15px">'+(hInfo.icon||'🏠')+' '+house+'</div>'
      +'<div style="font-size:11px;opacity:.85">'+stuList.length+' students</div></div>'
      +'<div style="font-size:22px;font-weight:700;opacity:.75">'+todayRoll.length+'/3</div>'
      +'</div>'
      +'<div style="padding:12px 16px">'
      +(lastRoll
        ?'<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">'
          +'<span style="padding:2px 9px;border-radius:8px;background:#dcfce7;color:#16a34a;font-weight:700;font-size:12px">P: '+lastRoll.present+'</span>'
          +'<span style="padding:2px 9px;border-radius:8px;background:#fee2e2;color:#dc2626;font-weight:700;font-size:12px">A: '+lastRoll.absent+'</span>'
          +'<span style="padding:2px 9px;border-radius:8px;background:#fef3c7;color:#d97706;font-weight:700;font-size:12px">L: '+(lastRoll.onLeave||0)+'</span>'
          +'<span style="padding:2px 9px;border-radius:8px;background:#dbeafe;color:#2563eb;font-weight:700;font-size:12px">O: '+(lastRoll.outpass||0)+'</span>'
          +'<span style="font-size:10.5px;color:var(--muted);align-self:center">'+esc(lastRoll.session)+'</span>'
          +'</div>'
        :'<div style="font-size:12px;color:var(--muted2);margin-bottom:10px;font-style:italic">No roll call today yet</div>')
      +'<div style="display:flex;flex-direction:column;gap:5px">'
      +SESSIONS.map(function(sess){
        var rec = todayRoll.find(function(r){return r.session===sess;});
        return '<button onclick="'+(rec?'hmsViewRollCall('+rec.id+')':'hmsOpenRollCall(\''+house+'\',\''+sess+'\')')+'" style="display:flex;align-items:center;justify-content:space-between;padding:6px 10px;border-radius:7px;border:1.5px solid '+(rec?hInfo.color+'44':'var(--border)')+';background:'+(rec?hInfo.color+'11':'var(--surface2)')+';cursor:pointer;font-family:\'DM Sans\',sans-serif;font-size:12px;font-weight:700;transition:all .15s;width:100%" onmouseenter="this.style.opacity=\'.8\'" onmouseleave="this.style.opacity=\'1\'">'
          +'<span style="color:'+(rec?hInfo.color:'var(--muted)')+'">'+sess.split(' ')[0]+'</span>'
          +(rec?'<span style="font-size:10.5px;color:'+hInfo.color+';background:'+hInfo.color+'1a;padding:1px 7px;border-radius:10px">✓ Done -- P:'+rec.present+' A:'+rec.absent+'</span>':'<span style="font-size:10.5px;color:var(--muted2)">Tap to take →</span>')
          +'</button>';
      }).join('')
      +'</div>'
      +'</div>'
      +'</div>';
  }).join('');
  
  var histData = isAdmin ? rollData : rollData.filter(function(r){return r.house===myHouse;});
  var histRows = histData.length ? histData.slice().reverse().slice(0,50).map(function(r){
    var hInfo = HM_HOUSES.find(function(h){return h.id===r.house;})||{color:'#64748b'};
    return '<tr>'
      +'<td>'+hmsFmt(r.date)+'</td>'
      +'<td><span style="padding:2px 8px;border-radius:8px;font-size:10.5px;font-weight:700;background:'+hInfo.color+'22;color:'+hInfo.color+'">'+esc(r.house)+'</span></td>'
      +'<td>'+esc(r.session||'--')+'</td>'
      +'<td style="text-align:center;color:#16a34a;font-weight:700">'+r.present+'</td>'
      +'<td style="text-align:center;color:#dc2626;font-weight:700">'+r.absent+'</td>'
      +'<td style="text-align:center;color:#d97706;font-weight:700">'+(r.onLeave||0)+'</td>'
      +'<td style="text-align:center;color:#2563eb;font-weight:700">'+(r.outpass||0)+'</td>'
      +'<td>'+esc(r.takenBy||'--')+'</td>'
      +'<td style="text-align:center">'
        +'<button onclick="hmsViewRollCall('+parseInt(r.id,10)+')" style="background:var(--accent-light);color:var(--accent);border:1px solid var(--accent);border-radius:5px;padding:2px 7px;cursor:pointer;font-size:10.5px;font-weight:700;font-family:\'DM Sans\',sans-serif;margin-right:3px">👁</button>'
        +(isAdmin?'<button onclick="hmsDelRollCall('+parseInt(r.id,10)+')" style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;border-radius:5px;padding:2px 7px;cursor:pointer;font-size:10.5px;font-weight:700;font-family:\'DM Sans\',sans-serif">🗑</button>':'')
      +'</td>'
      +'</tr>';
  }).join('') : '<tr><td colspan="9" style="text-align:center;padding:32px;color:var(--muted)">No roll calls recorded yet.</td></tr>';
  return '<div style="margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">'
    +'<div><div style="font-size:21px;font-family:\'Cormorant Garamond\',serif;font-weight:700">📋 House Roll Call</div>'
    +'<div style="font-size:12px;color:var(--muted);margin-top:2px">'+hmsFmt(today)+' &nbsp;·&nbsp; tap a session to begin</div></div>'
    +'</div>'
    +'<div style="display:flex;flex-wrap:wrap;gap:14px;margin-bottom:20px">'+todayCards+'</div>'
    +'<div class="card"><div class="card-head"><span class="card-title">📅 Roll Call History</span><span style="font-size:11px;font-family:\'JetBrains Mono\',monospace;color:var(--muted)">Last 50 records</span></div>'
    +'<div style="overflow-x:auto"><table><thead><tr><th>Date</th><th>House</th><th>Session</th><th style="text-align:center;color:#16a34a">P</th><th style="text-align:center;color:#dc2626">A</th><th style="text-align:center;color:#d97706">L</th><th style="text-align:center;color:#2563eb">O</th><th>By</th><th>Actions</th></tr></thead>'
    +'<tbody>'+histRows+'</tbody></table></div></div>';
}
function hmsOpenRollCall(house, session){
  var studentHouseMap = hmsMastGet('student_house');
  var stuList = students.filter(function(s){return s.hostel==='Yes' && studentHouseMap[String(s.id)]===house;});
  var marks = {};
  stuList.forEach(function(s){ marks[s.id]=''; });
  hmsRCState = {house:house, session:session, marks:marks};
  render();
  setTimeout(function(){var el=document.querySelector('[data-rc-form]');if(el)el.scrollIntoView({behavior:'smooth',block:'start'});},100);
}
function hmsRCMark(stuId, val){
  if(!hmsRCState) return;
  var cur = hmsRCState.marks[stuId]||'';
  hmsRCState.marks[stuId] = (cur===val) ? '' : val; // toggle off if same
  render();
}
function hmsRCMarkAll(val){
  if(!hmsRCState) return;
  Object.keys(hmsRCState.marks).forEach(function(id){ hmsRCState.marks[id]=val; });
  render();
}
function hmsSubmitRollCall(){
  if(!hmsRCState) return;
  var rc = hmsRCState;
  var today = hmsDate();
  var marks = rc.marks;
  var pCount=0,aCount=0,lCount=0,oCount=0;
  Object.keys(marks).forEach(function(id){var m=marks[id];if(m==='P')pCount++;else if(m==='A')aCount++;else if(m==='L')lCount++;else if(m==='O')oCount++;});
  var data = hmsArr('rollcall');
  data.push({
    id:hmsNextId(data), house:rc.house, date:today, session:rc.session,
    total:Object.keys(marks).length, present:pCount, absent:aCount, onLeave:lCount, outpass:oCount,
    takenBy:currentUser?currentUser.name:'--', marks:marks
  });
  hmsArrSet('rollcall',data);
  hmsRCState=null;
  render();
  showToast('✅ Roll Call submitted -- '+rc.house+' '+rc.session.split(' ')[0]+': P:'+pCount+' A:'+aCount+' L:'+lCount+' O:'+oCount,'#16a34a');
}
function hmsViewRollCall(id){
  var rec = hmsArr('rollcall').find(function(r){return r.id==id;});
  if(!rec){alert('Record not found.');return;}
  if(!rec.marks||!Object.keys(rec.marks).length){
    alert('Roll Call -- '+rec.house+' | '+rec.session+' | '+hmsFmt(rec.date)+'\nPresent: '+rec.present+' | Absent: '+rec.absent+' | Leave: '+(rec.onLeave||0)+' | Outpass: '+(rec.outpass||0)+'\nTaken by: '+(rec.takenBy||'--'));
    return;
  }
  var lines=['Roll Call -- '+rec.house+' | '+rec.session+' | '+hmsFmt(rec.date),'Taken by: '+(rec.takenBy||'--'),''];
  var status={'P':'Present','A':'Absent','L':'Leave','O':'Outpass',''  :'Unmarked'};
  Object.keys(rec.marks).forEach(function(stuId){
    var stu=students.find(function(s){return String(s.id)===String(stuId);});
    lines.push(((stu?stu.name:'Student #'+stuId)+' -- ')+(status[rec.marks[stuId]]||'Unmarked'));
  });
  alert(lines.join('\n'));
}
function hmsDelRollCall(id){
  if(!confirm('Delete this roll call record?'))return;
  hmsArrSet('rollcall',hmsArr('rollcall').filter(function(r){return r.id!=id;}));
  render();
}
function hmsRenderAssignments(){
  var isAdmin = currentUser && (currentUser.role==='admin'||currentUser.role==='manager');
  if(!isAdmin) return '<div style="text-align:center;padding:60px;color:var(--muted)"><div style="font-size:48px">🔒</div><div style="margin-top:16px;font-weight:700">Admin only</div></div>';
  var hmStaff = staff.filter(function(s){
    var r=(s.role||'').toLowerCase();
    return r.includes('house master')||r.includes('house mistress')||r.includes('boarding');
  });
  var staffRows = hmStaff.map(function(s){
    var assigned = hmsGetAssignedHouse(s.id)||'';
    var hInfo = HM_HOUSES.find(function(h){return h.id===assigned;});
    var hColor = hInfo?hInfo.color:'#64748b';
    return '<tr>'
      +'<td><div style="display:flex;align-items:center;gap:10px">'+avatarHTML(s.name,30)
        +'<div><div style="font-weight:700">'+esc(s.name)+'</div><div style="font-size:11px;color:var(--muted)">'+esc(s.role)+'</div></div>'
      +'</div></td>'
      +'<td>'+(assigned?'<span style="padding:3px 11px;border-radius:20px;font-size:11.5px;font-weight:700;background:'+hColor+'22;color:'+hColor+';border:1.5px solid '+hColor+'55">'+(hInfo?hInfo.icon:'🏠')+' '+assigned+'</span>':'<span style="color:var(--muted2);font-size:12px">Unassigned</span>')+'</td>'
      +'<td><select onchange="hmsSetAssignedHouse('+parseInt(s.id,10)+',this.value);render()" style="font-size:12px;padding:5px 8px;border-radius:7px;border:1.5px solid var(--border);background:var(--surface);color:var(--text)">'
        +'<option value="">-- None --</option>'
        +HM_HOUSES.map(function(h){return '<option value="'+h.id+'"'+(assigned===h.id?' selected':'')+'>'+h.icon+' '+h.id+'</option>';}).join('')
      +'</select></td>'
    +'</tr>';
  }).join('');
  // Student assignment -- now with house-block style interface
  var hostelStudents = students.filter(function(s){return s.hostel==='Yes';});
  var studentHouseMap = hmsMastGet('student_house');
  var unassigned = hostelStudents.filter(function(s){return !studentHouseMap[String(s.id)];}).length;
  // House strength summary with bulk assign buttons
  var houseBlocks = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;margin-bottom:20px">'
    + HM_HOUSES.map(function(h){
        var stuInHouse = hostelStudents.filter(function(s){return studentHouseMap[String(s.id)]===h.id;});
        var cnt = stuInHouse.length;
        return '<div style="background:var(--surface);border:2px solid '+h.color+'44;border-radius:14px;overflow:hidden">'
          +'<div style="background:'+h.color+';padding:12px 16px;display:flex;align-items:center;justify-content:space-between">'
            +'<div style="font-family:\'Playfair Display\',serif;font-size:15px;font-weight:700;color:#fff">'+h.icon+' '+h.id+'</div>'
            +'<div style="font-size:26px;font-weight:800;color:rgba(255,255,255,.3)">'+cnt+'</div>'
          +'</div>'
          +'<div style="padding:12px 14px">'
            +'<div style="font-size:11px;color:var(--muted);margin-bottom:10px">'+cnt+' student'+(cnt!==1?'s':'')+' assigned</div>'
            +'<div style="display:flex;flex-direction:column;gap:6px">'
              +'<button onclick="hmsStudentHouseFilter=\''+h.id+'\';setHmsMasterTab(\'students\');render()" '
                +'style="padding:6px 10px;border-radius:8px;background:'+h.color+'18;color:'+h.color+';border:1.5px solid '+h.color+'44;cursor:pointer;font-size:12px;font-weight:700;font-family:\'DM Sans\',sans-serif">👁 View Students</button>'
              +'<button onclick="hmsAssignAllToHouse(\''+h.id+'\')" '
                +'style="padding:6px 10px;border-radius:8px;background:'+h.color+';color:#fff;border:none;cursor:pointer;font-size:12px;font-weight:700;font-family:\'DM Sans\',sans-serif">✅ Assign All Hostel → '+h.id+'</button>'
              +(cnt?'<button onclick="if(confirm(\'Remove all students from '+h.id+' house?\'))hmsRemoveAllFromHouse(\''+h.id+'\')" '
                +'style="padding:6px 10px;border-radius:8px;background:#fee2e2;color:#dc2626;border:1.5px solid #fca5a5;cursor:pointer;font-size:11.5px;font-weight:700;font-family:\'DM Sans\',sans-serif">✕ Clear House</button>':'')
            +'</div>'
          +'</div>'
        +'</div>';
      }).join('')
    +'</div>';
  // Individual student rows
  var stuRows = hostelStudents.map(function(s){
    var sHouse = studentHouseMap[String(s.id)]||'';
    var hInfo  = HM_HOUSES.find(function(h){return h.id===sHouse;});
    var hColor = hInfo?hInfo.color:'#94a3b8';
    var houseSelectOpts = '<option value="">-- Unassigned --</option>'
      +HM_HOUSES.map(function(h){return '<option value="'+h.id+'"'+(sHouse===h.id?' selected':'')+'>'+h.icon+' '+h.id+'</option>';}).join('');
    return '<tr>'
      +'<td><div style="display:flex;align-items:center;gap:8px">'+avatarHTML(s.name,28)
        +'<div><div style="font-weight:600;font-size:13px">'+esc(s.name)+'</div>'
        +'<div style="font-size:10.5px;color:var(--muted);font-family:\'JetBrains Mono\',monospace">GCC: '+(s.roll||'--')+' · '+esc(s.cls||'')+'</div></div>'
      +'</div></td>'
      +'<td>'+(sHouse
        ?'<span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:'+hColor+'22;color:'+hColor+';border:1.5px solid '+hColor+'44">'+(hInfo?hInfo.icon:'🏠')+' '+sHouse+'</span>'
        :'<span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:#fff7ed;color:#ea580c;border:1.5px solid #fdba74">⚠ Unassigned</span>')
      +'</td>'
      +'<td><select onchange="hmsAssignStudentHouse('+parseInt(s.id,10)+',this.value);showToast&&showToast(\'House updated\',\'#16a34a\');render()" style="font-size:12px;padding:5px 8px;border-radius:7px;border:1.5px solid var(--border);background:var(--surface);color:var(--text)">'
        +houseSelectOpts
      +'</select></td>'
    +'</tr>';
  }).join('');
  return '<div class="card" style="margin-bottom:20px">'
    +'<div class="card-head"><span class="card-title">🧑‍🏫 House Master / Mistress Assignments</span></div>'
    +'<div style="padding:14px 20px">'
      +'<div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:9px;padding:10px 14px;margin-bottom:14px;font-size:12.5px;color:#1e40af">ℹ️ House Masters log in and see only their assigned house\'s students.</div>'
      +(hmStaff.length
        ?'<div style="overflow-x:auto"><table><thead><tr><th>Staff</th><th>Assigned House</th><th>Change</th></tr></thead><tbody>'+staffRows+'</tbody></table></div>'
        :'<div style="padding:24px;text-align:center;color:var(--muted)">No House Masters / Mistresses found.</div>')
    +'</div></div>'
    +'<div class="card">'
      +'<div class="card-head" style="background:linear-gradient(135deg,#0b1e6e,#1433a8)">'
        +'<span class="card-title" style="color:#fff">🏠 House-wise Student Assignment</span>'
        +'<span style="font-family:\'JetBrains Mono\',monospace;font-size:11px;color:rgba(255,255,255,.7)">'+hostelStudents.length+' hostel · '+unassigned+' unassigned</span>'
      +'</div>'
      +'<div style="padding:16px 20px">'
        +'<div style="font-size:11px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.1em;margin-bottom:12px;font-family:\'JetBrains Mono\',monospace">Quick Bulk Assign -- Click a house button to assign ALL hostel students at once</div>'
        + houseBlocks
      +'</div>'
    +'</div>'
    +'<div class="card" style="margin-top:16px">'
      +'<div class="card-head"><span class="card-title">👨‍🎓 Individual Student Assignments</span><span style="font-size:11px;font-family:\'JetBrains Mono\',monospace;color:var(--muted)">'+hostelStudents.length+' hostel · '+unassigned+' unassigned</span></div>'
      +'<div style="overflow-x:auto"><table><thead><tr><th>Student / GCC No.</th><th>Current House</th><th>Assign / Change House</th></tr></thead>'
      +'<tbody>'+stuRows+'</tbody></table></div>'
    +'</div>';
}
function rcLoad(key){ try{var s=localStorage.getItem('gnsi_rc_'+key);if(s)return JSON.parse(s);}catch(e){}return []; }
function rcSave(key,arr){ localStorage.setItem('gnsi_rc_'+key,JSON.stringify(arr));if(typeof gnsiKVPush==='function')gnsiKVPush('gnsi_rc_'+key,arr); }
function rcNextId(arr){ return arr.length?Math.max.apply(null,arr.map(function(x){return x.id||0}))+1:1; }
function rcFmtTime(){ return new Date().toTimeString().slice(0,5); }
// ══════════════════════════════════════════════════════════════
//  HEALTH MONITOR -- Student & Staff Medical Tracker
//  Records: Sick Bay, Medication, Doctor Visits, Vitals, Alerts
// ══════════════════════════════════════════════════════════════
var hmTab = 'sickbay';
function setHMTab(t){ hmTab=t; render(); }
var hmShowForm = false;
var hmEditId   = null;
var hmMedShowForm = false;
var hmMedEditId   = null;
var hmVisitShowForm = false;
function renderDiscipline(){
  var isAdm=currentUser&&(currentUser.role==='admin'||currentUser.role==='manager');
  var recs=_discLoad();
  var TYPES=['Warning','Suspension','Fine','Counselling','Other'];
  var SEVS=['Minor','Moderate','Serious'];
  if(_discEdit!==null){
    var r=_discEdit==='new'?{}:recs.find(function(x){return x.id===_discEdit;})||{};
    var stuOpts=students.map(function(s){return'<option value="'+esc(s.name)+'">'+esc(s.name)+'</option>';}).join('');
    return '<button onclick="_discEdit=null;render()" class="btn btn-outline" style="margin-bottom:16px">\u2190 Back</button>'
      +'<div class="card"><div class="card-head"><span class="card-title">\u2696\ufe0f '+(_discEdit==='new'?'New Disciplinary Record':'Edit Record')+'</span></div>'
      +'<div style="padding:20px"><div class="form-grid g2">'
      +'<div class="form-group"><label>Student *</label><input id="disc-stu" list="disc-stu-list" value="'+esc(r.student||'')+'" placeholder="Type student name"/><datalist id="disc-stu-list">'+stuOpts+'</datalist></div>'
      +'<div class="form-group"><label>Date *</label><input id="disc-date" type="date" value="'+esc(r.date||new Date().toISOString().split('T')[0])+'"/></div>'
      +'<div class="form-group"><label>Incident Type</label><select id="disc-type">'+TYPES.map(function(t){return'<option'+(r.type===t?' selected':'')+'>'+t+'</option>';}).join('')+'</select></div>'
      +'<div class="form-group"><label>Severity</label><select id="disc-sev">'+SEVS.map(function(s){return'<option'+(r.severity===s?' selected':'')+'>'+s+'</option>';}).join('')+'</select></div>'
      +'<div class="form-group" style="grid-column:1/-1"><label>Description *</label><textarea id="disc-desc" rows="3" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:9px;font-size:14px;font-family:DM Sans,sans-serif;resize:vertical">'+esc(r.description||'')+'</textarea></div>'
      +'<div class="form-group"><label>Action Taken</label><input id="disc-action" value="'+esc(r.action||'')+'" placeholder="e.g. Parents called, Warned verbally"/></div>'
      +'<div class="form-group"><label>Reported By</label><input id="disc-by" value="'+esc(r.reportedBy||(currentUser?currentUser.name:'')||'')+'" placeholder="Staff name"/></div>'
      +'<div class="form-group" style="grid-column:1/-1"><label>Remarks</label><input id="disc-rem" value="'+esc(r.remarks||'')+'" placeholder="Optional"/></div>'
      +'</div>'
      +'<button class="btn btn-primary" onclick="gnsiSaveDisc()" style="margin-top:14px">\ud83d\udcbe Save Record</button>'
      +'</div></div>';
  }
  var filtered=recs.filter(function(r){
    var q=_discSearch.toLowerCase();
    return !q||(r.student||'').toLowerCase().includes(q)||(r.type||'').toLowerCase().includes(q)||(r.description||'').toLowerCase().includes(q);
  });
  var rows=filtered.slice().sort(function(a,b){return(b.date||'').localeCompare(a.date||'');}).map(function(r){
    var sev=r.severity||'Minor';
    var sevCol=sev==='Serious'?'#dc2626':sev==='Moderate'?'#c9870a':'#64748b';
    return'<tr>'
      +'<td><b>'+esc(r.student||'\u2014')+'</b></td>'
      +'<td>'+esc(r.date||'\u2014')+'</td>'
      +'<td><span style="background:var(--accent-light);color:var(--accent);border-radius:5px;padding:2px 8px;font-size:11px;font-weight:700">'+esc(r.type||'\u2014')+'</span></td>'
      +'<td><span style="color:'+sevCol+';font-weight:700;font-size:12px">'+esc(sev)+'</span></td>'
      +'<td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(r.description||'\u2014')+'</td>'
      +'<td>'+esc(r.action||'\u2014')+'</td>'
      +'<td>'+esc(r.reportedBy||'\u2014')+'</td>'
      +(isAdm?'<td><button onclick="_discEdit=\''+parseInt(r.id,10)+'\';render()" style="background:var(--accent-light);color:var(--accent);border:none;border-radius:6px;padding:3px 9px;cursor:pointer;font-size:11px;font-weight:700;margin-right:4px">\u270f\ufe0f</button><button onclick="gnsiDelDisc(\''+parseInt(r.id,10)+'\')" style="background:#fef2f2;color:#dc2626;border:none;border-radius:6px;padding:3px 9px;cursor:pointer;font-size:11px;font-weight:700">\ud83d\uddd1\ufe0f</button></td>':'')
      +'</tr>';
  }).join('');
  /* ── stats ── */
  var byType={}, bySev={};
  recs.forEach(function(r){
    byType[r.type||'Other']=(byType[r.type||'Other']||0)+1;
    bySev[r.severity||'Minor']=(bySev[r.severity||'Minor']||0)+1;
  });
  var statsHTML='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px;margin-bottom:16px">'
    +'<div class="stat-card" style="--c:#1433a8"><div class="stat-label">Total Records</div><div class="stat-val">'+recs.length+'</div></div>'
    +'<div class="stat-card" style="--c:#dc2626"><div class="stat-label">Serious</div><div class="stat-val">'+(bySev['Serious']||0)+'</div></div>'
    +'<div class="stat-card" style="--c:#d97706"><div class="stat-label">Moderate</div><div class="stat-val">'+(bySev['Moderate']||0)+'</div></div>'
    +'<div class="stat-card" style="--c:#16a34a"><div class="stat-label">Minor</div><div class="stat-val">'+(bySev['Minor']||0)+'</div></div>'
    +'</div>';
  var chartHTML='<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px">'
    +'<div class="card" style="padding:14px"><div style="font-size:12px;font-weight:700;margin-bottom:10px;color:var(--text)">📊 By Incident Type</div>'
    +gnsiBarChart(byType,['#1433a8','#7133d4','#0891b2','#d97706','#dc2626'],110)
    +'</div>'
    +'<div class="card" style="padding:14px"><div style="font-size:12px;font-weight:700;margin-bottom:10px;color:var(--text)">⚖️ By Severity</div>'
    +gnsiDonut([{label:'Minor',value:bySev['Minor']||0,color:'#64748b'},{label:'Moderate',value:bySev['Moderate']||0,color:'#d97706'},{label:'Serious',value:bySev['Serious']||0,color:'#dc2626'}],100)
    +'</div></div>';
  return statsHTML+chartHTML
    +'<div class="card" style="margin-bottom:16px">'
    +'<div class="card-head"><span class="card-title">⚖️ Disciplinary Register</span>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
    +(isAdm?'<button onclick="_discEdit=\'new\';render()" class="btn btn-primary">+ New Record</button>':'')
    +'<button onclick="gnsiDiscPrint()" class="btn btn-outline" style="font-size:12px">🖨 Print</button>'
    +'<button onclick="gnsiDiscExport()" class="btn btn-outline" style="font-size:12px">⬇ Excel</button>'
    +'</div></div>'
    +'<div style="padding:12px 16px"><div class="search-wrap" style="max-width:340px"><span class="search-icon">🔍</span>'
    +'<input placeholder="Search student, type..." value="'+esc(_discSearch)+'" oninput="_discSearch=this.value;_debouncedRenderDisc()" style="width:100%"/></div></div>'
    +'<div style="overflow-x:auto"><table><thead><tr><th>Student</th><th>Date</th><th>Type</th><th>Severity</th><th>Description</th><th>Action</th><th>Reported By</th>'+(isAdm?'<th>Actions</th>':'')+'</tr></thead>'
    +'<tbody>'+(rows||'<tr><td colspan="8" style="padding:40px;text-align:center;color:var(--muted)">No disciplinary records found.</td></tr>')+'</tbody></table></div></div>';
}
function gnsiDiscPrint(){
  var recs=_discLoad().sort(function(a,b){return(b.date||'').localeCompare(a.date||'');});
  var rows=recs.map(function(r,i){
    var sev=r.severity||'Minor';
    var sevCol=sev==='Serious'?'#dc2626':sev==='Moderate'?'#c9870a':'#64748b';
    return '<tr><td style="text-align:center">'+(i+1)+'</td><td><b>'+esc(r.student||'—')+'</b></td><td>'+esc(r.date||'—')+'</td>'
      +'<td>'+esc(r.type||'—')+'</td><td style="color:'+sevCol+';font-weight:700">'+esc(sev)+'</td>'
      +'<td>'+esc(r.description||'—')+'</td><td>'+esc(r.action||'—')+'</td><td>'+esc(r.reportedBy||'—')+'</td></tr>';
  }).join('');
  var body='<div class="gnsi-pg-hdr"><div class="gnsi-inst">'+(window.TENANT?window.TENANT.name+' · '+window.TENANT.city:'Guidance Navodaya & Sainik Institute · Khangabok')+'</div>'
    +'<div class="gnsi-pg-title">⚖️ Disciplinary Register</div>'
    +'<div class="gnsi-pg-sub">Printed: '+new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})+' · Total: '+recs.length+' records</div></div>'
    +'<table><thead><tr><th style="width:26px">#</th><th style="min-width:100px">Student</th><th style="width:70px">Date</th><th style="width:72px">Type</th><th style="width:58px">Severity</th><th>Description</th><th>Action Taken</th><th style="width:80px">Reported By</th></tr></thead><tbody>'+rows+'</tbody></table>';
  gnsiPrintWindow('Disciplinary Register — GNSI', body, false);
}
function gnsiDiscExport(){
  showToast('⏳ Preparing Discipline CSV…','#2563eb');

  var recs=_discLoad().sort(function(a,b){return(b.date||'').localeCompare(a.date||'');});
  var rows=[['GNSI — Disciplinary Register'],['Exported: '+new Date().toLocaleString('en-IN'),'','','','','',''],[]
    ,['#','Student','Date','Type','Severity','Description','Action Taken','Reported By','Remarks']];
  recs.forEach(function(r,i){ rows.push([i+1,r.student||'',r.date||'',r.type||'',r.severity||'',r.description||'',r.action||'',r.reportedBy||'',r.remarks||'']); });
    showToast('✅ Discipline CSV ready — '+(recs.length)+' rows','#16a34a');
  gnsiExportExcel('Discipline_Register_'+new Date().toISOString().slice(0,10)+'.xlsx',[{name:'Discipline',rows:rows,cols:[{wch:4},{wch:22},{wch:10},{wch:12},{wch:10},{wch:35},{wch:25},{wch:18},{wch:20}]}]);
}
function gnsiSaveDisc(){
  var recs=_discLoad();
  var stu=((document.getElementById('disc-stu')||{}).value||'');
  var desc=((document.getElementById('disc-desc')||{}).value||'');
  if(!stu.trim()||!desc.trim()){showToast('Student and description required','#dc2626');return;}
  var rec={
    id:_discEdit==='new'?Date.now():_discEdit,
    student:stu.trim(),
    date:((document.getElementById('disc-date')||{}).value||new Date().toISOString().split('T')[0]),
    type:((document.getElementById('disc-type')||{}).value||'Warning'),
    severity:((document.getElementById('disc-sev')||{}).value||'Minor'),
    description:desc.trim(),
    action:(((document.getElementById('disc-action')||{}).value||'').trim()),
    reportedBy:(((document.getElementById('disc-by')||{}).value||'').trim()),
    remarks:(((document.getElementById('disc-rem')||{}).value||'').trim()),
    savedBy:currentUser?currentUser.name:'', savedAt:new Date().toISOString()
  };
  if(_discEdit==='new'){recs.push(rec);}else{var idx=recs.findIndex(function(x){return x.id===_discEdit;});if(idx>=0)recs[idx]=rec;else recs.push(rec);}
  _discSave(recs);_discEdit=null;render();showToast('Disciplinary record saved','#16a34a');
}
function gnsiDelDisc(id){
  if(!confirm('Delete this disciplinary record?'))return;
  _discSave(_discLoad().filter(function(x){return x.id!==id;}));render();showToast('Record deleted','#64748b');
}
/* ══════════════════════════════════════════════════════════════
   █  SICK BAY REGISTER
   ══════════════════════════════════════════════════════════════ */
var _sbayEdit=null,_sbaySearch='',_sbayTab='active';
function _sbayLoad(){return gnsiLoad('gnsi_sickbay')||[];}
function _sbaySave(d){gnsiSave('gnsi_sickbay',d);}
function renderSickBay(){
  var isAdm=currentUser&&(currentUser.role==='admin'||currentUser.role==='manager'||currentUser.role==='housemaster');
  var recs=_sbayLoad();
  if(_sbayEdit!==null){
    var r=_sbayEdit==='new'?{}:recs.find(function(x){return x.id===_sbayEdit;})||{};
    var stuOpts=students.map(function(s){return'<option value="'+esc(s.name)+'">'+esc(s.name)+'</option>';}).join('');
    return '<button onclick="_sbayEdit=null;render()" class="btn btn-outline" style="margin-bottom:16px">\u2190 Back</button>'
      +'<div class="card"><div class="card-head"><span class="card-title">\ud83c\udfe5 '+(_sbayEdit==='new'?'Admit to Sick Bay':'Edit Record')+'</span></div>'
      +'<div style="padding:20px"><div class="form-grid g2">'
      +'<div class="form-group"><label>Student *</label><input id="sb-stu" list="sb-stu-list" value="'+esc(r.student||'')+'" placeholder="Student name"/><datalist id="sb-stu-list">'+stuOpts+'</datalist></div>'
      +'<div class="form-group"><label>Admitted On *</label><input id="sb-in" type="datetime-local" value="'+esc(r.admittedOn||(new Date().toISOString().slice(0,16)))+'"/></div>'
      +'<div class="form-group" style="grid-column:1/-1"><label>Complaint / Symptoms *</label><textarea id="sb-complaint" rows="3" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:9px;font-size:14px;font-family:DM Sans,sans-serif;resize:vertical">'+esc(r.complaint||'')+'</textarea></div>'
      +'<div class="form-group"><label>Temperature (\u00b0F)</label><input id="sb-temp" type="number" step="0.1" value="'+esc(r.temp||'')+'" placeholder="e.g. 99.2"/></div>'
      +'<div class="form-group"><label>Medicine Given</label><input id="sb-med" value="'+esc(r.medicine||'')+'" placeholder="e.g. Paracetamol 500mg"/></div>'
      +'<div class="form-group"><label>Attended By</label><input id="sb-att" value="'+esc(r.attendedBy||(currentUser?currentUser.name:'')||'')+'" placeholder="Doctor / Staff name"/></div>'
      +'<div class="form-group"><label>Status</label><select id="sb-status">'
      +'<option value="Admitted"'+(r.status==='Admitted'||!r.status?' selected':'')+'>Admitted</option>'
      +'<option value="Discharged"'+(r.status==='Discharged'?' selected':'')+'>Discharged</option>'
      +'<option value="Referred"'+(r.status==='Referred'?' selected':'')+'>Referred to Hospital</option>'
      +'</select></div>'
      +'<div class="form-group"><label>Discharged On</label><input id="sb-out" type="datetime-local" value="'+esc(r.dischargedOn||'')+'"/></div>'
      +'<div class="form-group" style="grid-column:1/-1"><label>Remarks</label><input id="sb-rem" value="'+esc(r.remarks||'')+'" placeholder="Doctor\'s notes, follow-up..."/></div>'
      +'</div><button class="btn btn-primary" onclick="gnsiSaveSickBay()" style="margin-top:14px">\ud83d\udcbe Save Record</button>'
      +'</div></div>';
  }
  var active=recs.filter(function(r){return r.status==='Admitted';});
  var shown=(_sbayTab==='active'?active:recs).filter(function(r){
    var q=_sbaySearch.toLowerCase();
    return !q||(r.student||'').toLowerCase().includes(q)||(r.complaint||'').toLowerCase().includes(q);
  }).sort(function(a,b){return(b.admittedOn||'').localeCompare(a.admittedOn||'');});
  var rows=shown.map(function(r){
    var stCol=r.status==='Admitted'?'#dc2626':r.status==='Referred'?'#c9870a':'#16a34a';
    return'<tr>'
      +'<td><b>'+esc(r.student||'\u2014')+'</b></td>'
      +'<td style="font-size:12px">'+esc((r.admittedOn||'\u2014').replace('T',' ').slice(0,16))+'</td>'
      +'<td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(r.complaint||'\u2014')+'</td>'
      +'<td>'+(r.temp?r.temp+'\u00b0F':'\u2014')+'</td>'
      +'<td>'+esc(r.medicine||'\u2014')+'</td>'
      +'<td><span style="color:'+stCol+';font-weight:700;font-size:11px">'+esc(r.status||'\u2014')+'</span></td>'
      +'<td>'+esc(r.attendedBy||'\u2014')+'</td>'
      +(isAdm?'<td><button onclick="_sbayEdit=\''+parseInt(r.id,10)+'\';render()" style="background:var(--accent-light);color:var(--accent);border:none;border-radius:6px;padding:3px 9px;cursor:pointer;font-size:11px;font-weight:700;margin-right:4px">\u270f\ufe0f</button>'
        +(r.status==='Admitted'?'<button onclick="gnsiDischargeSickBay(\''+parseInt(r.id,10)+'\')" style="background:#f0fdf4;color:#16a34a;border:none;border-radius:6px;padding:3px 9px;cursor:pointer;font-size:11px;font-weight:700">\u2705 Discharge</button>':'')
        +'</td>':'')
      +'</tr>';
  }).join('');
  /* ── stats ── */
  var admitted=recs.filter(function(r){return r.status==='Admitted';}).length;
  var discharged=recs.filter(function(r){return r.status==='Discharged';}).length;
  var referred=recs.filter(function(r){return r.status==='Referred';}).length;
  var compMap={};
  recs.forEach(function(r){ var c=(r.complaint||'Other').split(/[,./]/)[0].trim().substring(0,20); compMap[c]=(compMap[c]||0)+1; });
  var statsHTML='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px;margin-bottom:14px">'
    +'<div class="stat-card" style="--c:#1433a8"><div class="stat-label">Total Records</div><div class="stat-val">'+recs.length+'</div></div>'
    +'<div class="stat-card" style="--c:#dc2626"><div class="stat-label">Currently Admitted</div><div class="stat-val">'+admitted+'</div></div>'
    +'<div class="stat-card" style="--c:#16a34a"><div class="stat-label">Discharged</div><div class="stat-val">'+discharged+'</div></div>'
    +'<div class="stat-card" style="--c:#d97706"><div class="stat-label">Referred</div><div class="stat-val">'+referred+'</div></div>'
    +'</div>';
  var chartHTML='<div class="card" style="padding:14px;margin-bottom:14px"><div style="font-size:12px;font-weight:700;margin-bottom:10px">🏥 Common Complaints (Top 8)</div>'
    +gnsiBarChart((function(){ var top=Object.keys(compMap).sort(function(a,b){return compMap[b]-compMap[a];}).slice(0,8); var r={}; top.forEach(function(k){r[k]=compMap[k];}); return r; })(),['#1433a8','#7133d4','#0891b2','#d97706','#dc2626','#16a34a','#c026d3','#64748b'],110)
    +'</div>';
  return statsHTML+chartHTML
    +'<div class="card">'
    +'<div class="card-head"><span class="card-title">🏥 Sick Bay Register</span>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
    +(isAdm?'<button onclick="_sbayEdit=\'new\';render()" class="btn btn-primary">+ Admit Student</button>':'')
    +'<button onclick="gnsiSickBayPrint()" class="btn btn-outline" style="font-size:12px">🖨 Print</button>'
    +'<button onclick="gnsiSickBayExport()" class="btn btn-outline" style="font-size:12px">⬇ Excel</button>'
    +'</div></div>'
    +'<div style="padding:12px 16px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">'
    +'<div style="display:flex;gap:6px">'
    +'<button onclick="_sbayTab=\'active\';render()" style="border-radius:20px;padding:4px 14px;font-size:12px;font-weight:700;cursor:pointer;border:1.5px solid var(--accent);background:'+(_sbayTab==='active'?'var(--accent)':'transparent')+';color:'+(_sbayTab==='active'?'#fff':'var(--accent)')+'">Currently Admitted ('+active.length+')</button>'
    +'<button onclick="_sbayTab=\'all\';render()" style="border-radius:20px;padding:4px 14px;font-size:12px;font-weight:700;cursor:pointer;border:1.5px solid var(--accent);background:'+(_sbayTab==='all'?'var(--accent)':'transparent')+';color:'+(_sbayTab==='all'?'#fff':'var(--accent)')+'">All Records ('+recs.length+')</button></div>'
    +'<div class="search-wrap" style="flex:1;min-width:200px"><span class="search-icon">🔍</span><input placeholder="Search..." value="'+esc(_sbaySearch)+'" oninput="_sbaySearch=this.value;_sbayTab=\'all\';_debouncedRenderSbay()" style="width:100%"/></div>'
    +'</div>'
    +'<div style="overflow-x:auto"><table><thead><tr><th>Student</th><th>Admitted On</th><th>Complaint</th><th>Temp</th><th>Medicine</th><th>Status</th><th>Attended By</th>'+(isAdm?'<th>Actions</th>':'')+'</tr></thead>'
    +'<tbody>'+(rows||'<tr><td colspan="8" style="padding:40px;text-align:center;color:var(--muted)">No sick bay records.</td></tr>')+'</tbody></table></div></div>';
}
function gnsiSickBayPrint(){
  var recs=_sbayLoad().sort(function(a,b){return(b.admittedOn||'').localeCompare(a.admittedOn||'');});
  var active=recs.filter(function(r){return r.status==='Admitted';});
  var rows=recs.map(function(r,i){
    var stCol=r.status==='Admitted'?'#dc2626':r.status==='Referred'?'#c9870a':'#16a34a';
    return '<tr><td style="text-align:center">'+(i+1)+'</td><td><b>'+esc(r.student||'—')+'</b></td>'
      +'<td>'+esc((r.admittedOn||'—').replace('T',' ').slice(0,16))+'</td>'
      +'<td>'+esc(r.complaint||'—')+'</td>'
      +'<td>'+(r.temp?r.temp+'°F':'—')+'</td>'
      +'<td>'+esc(r.medicine||'—')+'</td>'
      +'<td style="color:'+stCol+';font-weight:700">'+esc(r.status||'—')+'</td>'
      +'<td>'+esc(r.attendedBy||'—')+'</td>'
      +'<td>'+esc((r.dischargedOn||'').replace('T',' ').slice(0,16)||'—')+'</td>'
      +'<td>'+esc(r.remarks||'—')+'</td></tr>';
  }).join('');
  var body='<div class="gnsi-pg-hdr"><div class="gnsi-inst">'+(window.TENANT?window.TENANT.name+' · '+window.TENANT.city:'Guidance Navodaya & Sainik Institute · Khangabok')+'</div>'
    +'<div class="gnsi-pg-title">🏥 Sick Bay Register</div>'
    +'<div class="gnsi-pg-sub">Printed: '+new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})
    +' · Total: '+recs.length+' · Currently Admitted: '+active.length+'</div></div>'
    +'<table><thead><tr><th style="width:26px">#</th><th>Student</th><th style="width:90px">Admitted</th><th>Complaint</th><th style="width:50px">Temp</th>'
    +'<th>Medicine</th><th style="width:65px">Status</th><th>Attended By</th><th style="width:90px">Discharged</th><th>Remarks</th></tr></thead><tbody>'+rows+'</tbody></table>';
  gnsiPrintWindow('Sick Bay Register — GNSI', body, false);
}
function gnsiSickBayExport(){
  showToast('⏳ Preparing Sick Bay CSV…','#2563eb');

  var recs=_sbayLoad().sort(function(a,b){return(b.admittedOn||'').localeCompare(a.admittedOn||'');});
  var rows=[['GNSI — Sick Bay Register'],['Exported: '+new Date().toLocaleString('en-IN'),'','','','','','','',''],[]
    ,['#','Student','Admitted On','Complaint','Temp (°F)','Medicine Given','Status','Attended By','Discharged On','Remarks']];
  recs.forEach(function(r,i){ rows.push([i+1,r.student||'',r.admittedOn||'',r.complaint||'',r.temp||'',r.medicine||'',r.status||'',r.attendedBy||'',r.dischargedOn||'',r.remarks||'']); });
    showToast('✅ Sick Bay CSV ready — '+(recs.length)+' rows','#16a34a');
  gnsiExportExcel('SickBay_Register_'+new Date().toISOString().slice(0,10)+'.xlsx',[{name:'Sick Bay',rows:rows,cols:[{wch:4},{wch:22},{wch:18},{wch:30},{wch:8},{wch:22},{wch:12},{wch:18},{wch:18},{wch:25}]}]);
}
function gnsiSaveSickBay(){
  var recs=_sbayLoad();
  var stu=((document.getElementById('sb-stu')||{}).value||'');
  var complaint=((document.getElementById('sb-complaint')||{}).value||'');
  if(!stu.trim()||!complaint.trim()){showToast('Student and complaint required','#dc2626');return;}
  var rec={
    id:_sbayEdit==='new'?Date.now():_sbayEdit,
    student:stu.trim(),
    admittedOn:((document.getElementById('sb-in')||{}).value||new Date().toISOString().slice(0,16)),
    complaint:complaint.trim(),
    temp:(((document.getElementById('sb-temp')||{}).value||'').trim()),
    medicine:(((document.getElementById('sb-med')||{}).value||'').trim()),
    attendedBy:(((document.getElementById('sb-att')||{}).value||'').trim()),
    status:((document.getElementById('sb-status')||{}).value||'Admitted'),
    dischargedOn:(((document.getElementById('sb-out')||{}).value||'').trim()),
    remarks:(((document.getElementById('sb-rem')||{}).value||'').trim()),
    savedBy:currentUser?currentUser.name:'',savedAt:new Date().toISOString()
  };
  if(_sbayEdit==='new'){recs.push(rec);}else{var idx=recs.findIndex(function(x){return x.id===_sbayEdit;});if(idx>=0)recs[idx]=rec;else recs.push(rec);}
  _sbaySave(recs);_sbayEdit=null;render();showToast('Sick bay record saved','#16a34a');
}
function gnsiDischargeSickBay(id){
  var recs=_sbayLoad();
  var idx=recs.findIndex(function(x){return x.id===id;});
  if(idx<0)return;
  recs[idx].status='Discharged';recs[idx].dischargedOn=new Date().toISOString().slice(0,16);
  _sbaySave(recs);render();showToast('Student discharged','#16a34a');
}
/* ══════════════════════════════════════════════════════════════
   █  SCHOLARSHIPS
   ══════════════════════════════════════════════════════════════ */
var _scholEdit=null,_scholSearch='';
function _scholLoad(){return gnsiLoad('gnsi_scholarships')||[];}
function _scholSave(d){gnsiSave('gnsi_scholarships',d);}
function renderNightDuty(){
  var isAdmin=(typeof currentUser!=='undefined'&&currentUser&&(currentUser.role==='admin'||currentUser.role==='manager'));
  var staffList=(gnsiLoad('gnsi_staff')||[]);
  if(!staffList.length) staffList=(typeof STAFF_INIT!=='undefined'?STAFF_INIT:[]);
  var hostelStaff=staffList.filter(function(s){return (s.status||'Active').toLowerCase()==='active'&&(s.dept==='Hostel'||s.dept==='Administration'||s.dept==='Security');});
  if(!hostelStaff.length) hostelStaff=staffList.filter(function(s){return (s.status||'Active').toLowerCase()==='active';});
  var MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
  var roster=gnsiLoad('gnsi_night_duty')||[];
  /* filter to current month */
  var prefix=_ndYear+'-'+String(_ndMonth+1).padStart(2,'0');
  var monthRoster=roster.filter(function(r){return r.date&&r.date.startsWith(prefix);}).sort(function(a,b){return a.date>b.date?1:-1;});
  var daysInMonth=new Date(_ndYear,_ndMonth+1,0).getDate();
  var coveredDates=monthRoster.map(function(r){return r.date;});
  var uncoveredCount=0;
  for(var dd=1;dd<=daysInMonth;dd++){
    var ds2=prefix+'-'+String(dd).padStart(2,'0');
    if(coveredDates.indexOf(ds2)===-1) uncoveredCount++;
  }
  var formHtml='';
  if(_ndForm){
    var ed=_ndEdit?roster.find(function(r){return r.id===_ndEdit;}):null;
    var staffOpts=staffList.filter(function(s){return (s.status||'Active').toLowerCase()==='active';}).map(function(s){return '<option value="'+esc(s.name)+'"'+(ed&&ed.staff1===s.name?' selected':'')+'>'+esc(s.name)+'</option>';}).join('');
    var staffOpts2=staffList.filter(function(s){return (s.status||'Active').toLowerCase()==='active';}).map(function(s){return '<option value="'+esc(s.name)+'"'+(ed&&ed.staff2===s.name?' selected':'')+'>'+esc(s.name)+'</option>';}).join('');
    formHtml='<div style="background:var(--surface);border:1.5px solid #1433a8;border-radius:14px;padding:22px;margin-bottom:20px">'
      +'<div style="font-family:\'Playfair Display\',serif;font-size:15px;font-weight:700;color:var(--text);margin-bottom:16px">'+(ed?'✏️ Edit Duty':'➕ Assign Night Duty')+'</div>'
      +'<div class="form-grid g2" style="margin-bottom:14px">'
      +'<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Date *</label><input id="nd-date" type="date" value="'+(ed?ed.date:'')+'" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif;box-sizing:border-box"></div>'
      +'<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Shift</label><select id="nd-shift" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif"><option'+(ed&&ed.shift==='10PM–6AM'?' selected':'')+'>10PM–6AM</option><option'+(ed&&ed.shift==='6PM–12AM'?' selected':'')+'>6PM–12AM</option><option'+(ed&&ed.shift==='12AM–6AM'?' selected':'')+'>12AM–6AM</option></select></div>'
      +'<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Staff 1 *</label><select id="nd-staff1" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif"><option value="">-- Select --</option>'+staffOpts+'</select></div>'
      +'<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Staff 2 (optional)</label><select id="nd-staff2" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif"><option value="">-- None --</option>'+staffOpts2+'</select></div>'
      +'</div>'
      +'<div style="margin-bottom:16px"><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Notes</label><input id="nd-notes" type="text" value="'+(ed?esc(ed.notes):'')+'" placeholder="Any special instructions..." style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif;box-sizing:border-box"></div>'
      +'<div style="display:flex;gap:10px"><button onclick="ndSave()" style="padding:9px 20px;border-radius:9px;background:#1433a8;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">Save</button>'
      +'<button onclick="ndCloseForm()" style="padding:9px 16px;border-radius:9px;border:1.5px solid var(--border);background:var(--surface);color:var(--muted);font-size:13px;cursor:pointer;font-family:\'DM Sans\',sans-serif">Cancel</button></div></div>';
  }
  var rows='';
  if(!monthRoster.length){
    rows='<div style="padding:40px;text-align:center;color:var(--muted);font-size:13px">No duty assigned for this month.</div>';
  } else {
    rows=monthRoster.map(function(r){
      var done=r.status==='Completed';
      return '<div style="display:flex;align-items:center;gap:14px;padding:12px 16px;border-bottom:1px solid var(--border);background:'+(done?'#f0fdf4':'var(--surface)')+'">'
        +'<div style="width:48px;text-align:center;flex-shrink:0"><div style="font-size:18px;font-weight:800;color:'+(done?'#16a34a':'#1433a8')+'">'+r.date.slice(8)+'</div><div style="font-size:10px;color:var(--muted)">'+['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(r.date).getDay()]+'</div></div>'
        +'<div style="flex:1">'
        +'<div style="font-size:13.5px;font-weight:700;color:var(--text)">🌙 '+esc(r.staff1)+(r.staff2?' &amp; '+esc(r.staff2):'')+'</div>'
        +'<div style="font-size:12px;color:var(--muted)">'+esc(r.shift)+(r.notes?' · '+esc(r.notes):'')+'</div>'
        +'</div>'
        +'<div style="display:flex;gap:6px;align-items:center;flex-shrink:0">'
        +(!done&&isAdmin?'<button onclick="ndMarkDone(\''+parseInt(r.id,10)+'\')" style="padding:4px 10px;border-radius:7px;background:#dcfce7;color:#16a34a;border:1px solid #86efac;font-size:11px;font-weight:700;cursor:pointer">✓ Done</button>':'')
        +(done?'<span style="font-size:11px;font-weight:700;color:#16a34a;background:#dcfce7;border-radius:6px;padding:3px 9px">✓ Done</span>':'')
        +(isAdmin?'<button onclick="ndOpenForm(\''+parseInt(r.id,10)+'\')" style="padding:4px 9px;border-radius:7px;border:1.5px solid var(--border);background:var(--surface);font-size:11px;cursor:pointer">✏️</button>':'')
        +(isAdmin?'<button onclick="ndDelete(\''+parseInt(r.id,10)+'\')" style="padding:4px 9px;border-radius:7px;border:1.5px solid #fee2e2;background:#fff1f2;color:#ef4444;font-size:11px;cursor:pointer">🗑</button>':'')
        +'</div></div>';
    }).join('');
  }
  return '<div style="padding:8px 0 32px">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:18px">'
    +'<div><div style="font-family:\'Playfair Display\',serif;font-size:22px;font-weight:800;color:var(--text)">🌙 Night Duty Roster</div>'
    +'<div style="font-size:12.5px;color:var(--muted);margin-top:3px">'+monthRoster.length+' assigned &nbsp;·&nbsp; '+(uncoveredCount>0?'<span style="color:#dc2626;font-weight:700">'+uncoveredCount+' nights uncovered</span>':'all covered')+'</div></div>'
    +(isAdmin&&!_ndForm?'<button onclick="ndOpenForm()" style="padding:8px 18px;border-radius:9px;background:#1433a8;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">➕ Assign Duty</button>':'')
    +'</div>'+formHtml
    +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">'
    +'<button onclick="ndPrev()" style="padding:6px 14px;border-radius:8px;border:1.5px solid var(--border);background:var(--surface);cursor:pointer;font-size:14px">‹</button>'
    +'<div style="font-family:\'Playfair Display\',serif;font-size:16px;font-weight:700;color:var(--text)">'+MONTHS[_ndMonth]+' '+_ndYear+'</div>'
    +'<button onclick="ndNext()" style="padding:6px 14px;border-radius:8px;border:1.5px solid var(--border);background:var(--surface);cursor:pointer;font-size:14px">›</button>'
    +'</div>'
    +'<div style="background:var(--surface);border:1.5px solid var(--border);border-radius:12px;overflow:hidden">'+rows+'</div>'
    +'</div>';
}
/* ══════════════════════════════════════════════════════════════════
   GRIEVANCE REGISTER
   ══════════════════════════════════════════════════════════════════ */
var _grvTab='open', _grvForm=false, _grvEdit=null, _grvSearch='';
var _GRV_CATS=['Academic','Hostel','Salary','Facilities','Interpersonal','Administrative','Other'];
var _GRV_PRIO=['High','Medium','Low'];
var _GRV_STATUS=['Open','In Progress','Resolved','Closed'];
function gnsiNightDutyPrint(){
  var roster=gnsiLoad('gnsi_night_duty')||[];
  var sorted=roster.slice().sort(function(a,b){return(a.date||'').localeCompare(b.date||'');});
  var rows=sorted.map(function(r,i){
    return '<tr><td style="text-align:center">'+(i+1)+'</td><td><b>'+esc(r.date||'—')+'</b></td>'
      +'<td>'+esc(r.shift||'—')+'</td><td>'+esc(r.staff1||'—')+'</td><td>'+esc(r.staff2||'—')+'</td>'
      +'<td>'+esc(r.post||'—')+'</td><td>'+esc(r.notes||'—')+'</td><td style="min-height:18px"></td></tr>';
  }).join('');
  var body='<div class="gnsi-pg-hdr"><div class="gnsi-inst">'+(window.TENANT?window.TENANT.name+' · '+window.TENANT.city:'Guidance Navodaya & Sainik Institute · Khangabok')+'</div>'
    +'<div class="gnsi-pg-title">🌙 Night Duty Roster</div>'
    +'<div class="gnsi-pg-sub">Printed: '+new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})+' · Total assignments: '+sorted.length+'</div></div>'
    +'<table><thead><tr><th style="width:26px">#</th><th style="width:80px">Date</th><th style="width:80px">Shift</th><th>Staff 1</th><th>Staff 2</th>'
    +'<th style="width:80px">Post</th><th>Notes</th><th style="width:80px">Signature</th></tr></thead><tbody>'+rows+'</tbody></table>';
  gnsiPrintWindow('Night Duty Roster — GNSI', body, false);
}
function gnsiNightDutyExport(){
  showToast('⏳ Preparing Night Duty CSV…','#2563eb');

  var roster=(gnsiLoad('gnsi_night_duty')||[]).sort(function(a,b){return(a.date||'').localeCompare(b.date||'');});
  var rows=[['GNSI — Night Duty Roster'],['Exported: '+new Date().toLocaleString('en-IN')],[]
    ,['#','Date','Shift','Staff 1','Staff 2','Post / Location','Notes']];
  roster.forEach(function(r,i){rows.push([i+1,r.date||'',r.shift||'',r.staff1||'',r.staff2||'',r.post||'',r.notes||'']);});
    showToast('✅ Night Duty CSV ready — '+(roster.length)+' rows','#16a34a');
  gnsiExportExcel('NightDuty_'+new Date().toISOString().slice(0,10)+'.xlsx',[{name:'Night Duty',rows:rows,cols:[{wch:4},{wch:12},{wch:12},{wch:22},{wch:22},{wch:18},{wch:25}]}]);
}
function grvOpenForm(id){ _grvEdit=id||null; _grvForm=true; navigate('grievance'); }
function grvCloseForm(){ _grvForm=false; _grvEdit=null; navigate('grievance'); }
function grvSave(){
  var title=document.getElementById('grv-title').value.trim();
  var filed=document.getElementById('grv-filed').value.trim();
  var cat=document.getElementById('grv-cat').value;
  var prio=document.getElementById('grv-prio').value;
  var desc=document.getElementById('grv-desc').value.trim();
  var against=document.getElementById('grv-against').value.trim();
  if(!title||!filed){ alert('Title and filer name are required.'); return; }
  var records=gnsiLoad('gnsi_grievances')||[];
  var now=new Date().toISOString().slice(0,10);
  if(_grvEdit){
    records=records.map(function(r){return r.id===_grvEdit?Object.assign({},r,{title:title,filedBy:filed,cat:cat,prio:prio,desc:desc,against:against}):r;});
  } else {
    records.unshift({id:'grv'+Date.now(),title:title,filedBy:filed,cat:cat,prio:prio,desc:desc,against:against,status:'Open',filedOn:now,resolution:'',resolvedOn:''});
  }
  gnsiSave('gnsi_grievances', records);
  _grvForm=false; _grvEdit=null; navigate('grievance');
}
function grvUpdateStatus(id, status){
  var records=(gnsiLoad('gnsi_grievances')||[]).map(function(r){
    if(r.id!==id) return r;
    var update={status:status};
    if(status==='Resolved'||status==='Closed') update.resolvedOn=new Date().toISOString().slice(0,10);
    return Object.assign({},r,update);
  });
  gnsiSave('gnsi_grievances', records);
  navigate('grievance');
}
function grvSaveResolution(id){
  var el=document.getElementById('grv-res-'+id);
  if(!el) return;
  var records=(gnsiLoad('gnsi_grievances')||[]).map(function(r){return r.id===id?Object.assign({},r,{resolution:el.value}):r;});
  gnsiSave('gnsi_grievances', records);
  navigate('grievance');
}
function grvDelete(id){
  if(!confirm('Delete this grievance record?')) return;
  gnsiSave('gnsi_grievances', (gnsiLoad('gnsi_grievances')||[]).filter(function(r){return r.id!==id;}));
  navigate('grievance');
}
