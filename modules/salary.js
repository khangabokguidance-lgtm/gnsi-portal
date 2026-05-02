/* GNSI PORTAL — modules/salary.js
   Pages: dutyhours, periodsalary, staffsalary
   DEPENDS ON: core/utils.js, core/state.js */

function renderDutyHours(){
  var isAdmin=_isAdminOrArunkumar();
  var dutyData=loadDutyData();
  var shiftBadge=function(s){
    var c=s==='Morning Shift'?'#d4a853':s==='Evening Shift'?'#3b78c9':s==='Night Shift'?'#8b5cf6':'#1a6b55';
    return badge(s,c);
  };
  var morning=dutyData.filter(function(d){return d.shift==='Morning Shift'}).length;
  var evening=dutyData.filter(function(d){return d.shift==='Evening Shift'}).length;
  var night=dutyData.filter(function(d){return d.shift==='Night Shift'}).length;
  var full=dutyData.filter(function(d){return d.shift==='Full Shift'}).length;
  // Add form -- admin only
  var addFormHTML='';
  if(isAdmin && dutyAddForm){
    addFormHTML='<div class="form-panel" style="margin-bottom:18px"><div class="form-title" style="color:var(--accent)">➕ Add New Duty Entry</div>'
      +'<div class="form-grid g3">'
        +'<div class="form-group"><label>Post / Role *</label><input id="dh-post" placeholder="e.g. Guard, Cook..." value="'+esc(dutyNewData.post||'')+'"/></div>'
        +'<div class="form-group"><label>Staff Name(s) *</label><input id="dh-staff" placeholder="Name1, Name2..." value="'+esc(dutyNewData.staff||'')+'"/></div>'
        +'<div class="form-group"><label>Shift</label><select id="dh-shift"><option>Full Shift</option><option>Morning Shift</option><option>Evening Shift</option><option>Night Shift</option></select></div>'
        +'<div class="form-group"><label>From</label><input id="dh-from" placeholder="e.g. 07:00 AM" value="'+esc(dutyNewData.from||'')+'"/></div>'
        +'<div class="form-group"><label>To</label><input id="dh-to" placeholder="e.g. 11:00 AM" value="'+esc(dutyNewData.to||'')+'"/></div>'
        +'<div class="form-group"><label>Color</label><select id="dh-color"><option value="#1a6b55">Green (Admin)</option><option value="#0891b2">Blue (IT)</option><option value="#dc2626">Red (Security)</option><option value="#d4a853">Gold (Cook)</option><option value="#8b5cf6">Purple (Academic)</option><option value="#78716c">Gray (Support)</option></select></div>'
      +'</div>'
      +'<div class="form-actions"><button class="btn btn-primary" onclick="dutyAddEntry()">Save Entry</button><button class="btn btn-outline" onclick="dutyAddForm=false;render()">Cancel</button></div>'
    +'</div>';
  }
  var rows=dutyData.map(function(d){
    if(isAdmin && dutyEditId===d.id){
      return '<tr style="background:var(--accent-light)">'
        +'<td><input id="de-post-'+d.id+'" value="'+esc(d.post)+'" style="width:100%;border:1px solid var(--border);border-radius:6px;padding:5px 8px;font-family:\'DM Sans\',sans-serif;background:var(--surface);color:var(--text)"/></td>'
        +'<td><input id="de-from-'+d.id+'" value="'+esc(d.from)+'" style="width:90px;border:1px solid var(--border);border-radius:6px;padding:5px 8px;font-family:\'JetBrains Mono\',monospace;font-size:12px;background:var(--surface);color:var(--text)"/></td>'
        +'<td><input id="de-to-'+d.id+'" value="'+esc(d.to)+'" style="width:90px;border:1px solid var(--border);border-radius:6px;padding:5px 8px;font-family:\'JetBrains Mono\',monospace;font-size:12px;background:var(--surface);color:var(--text)"/></td>'
        +'<td><select id="de-shift-'+d.id+'" style="border:1px solid var(--border);border-radius:6px;padding:5px 8px;font-family:\'DM Sans\',sans-serif;background:var(--surface);color:var(--text)">'
          +'<option'+(d.shift==='Full Shift'?' selected':'')+'>Full Shift</option>'
          +'<option'+(d.shift==='Morning Shift'?' selected':'')+'>Morning Shift</option>'
          +'<option'+(d.shift==='Evening Shift'?' selected':'')+'>Evening Shift</option>'
          +'<option'+(d.shift==='Night Shift'?' selected':'')+'>Night Shift</option>'
        +'</select></td>'
        +'<td><input id="de-staff-'+d.id+'" value="'+esc(d.staff)+'" style="width:100%;border:1px solid var(--border);border-radius:6px;padding:5px 8px;font-family:\'DM Sans\',sans-serif;background:var(--surface);color:var(--text)"/></td>'
        +'<td style="display:flex;gap:6px;padding:10px 16px">'
          +'<button class="btn btn-primary" style="font-size:11px;padding:4px 10px" onclick="dutySaveEdit(\''+d.id+'\')">✓ Save</button>'
          +'<button class="btn btn-outline" style="font-size:11px;padding:4px 10px" onclick="dutyEditId=null;render()">Cancel</button>'
        +'</td></tr>';
    }
    var staffList=d.staff.split(',').map(function(n){return n.trim()}).filter(Boolean);
    return '<tr>'
      +'<td><span style="font-weight:700;color:'+d.color+'">'+esc(d.post)+'</span></td>'
      +'<td style="font-family:\'JetBrains Mono\',monospace;font-size:12px;color:var(--muted)">'+esc(d.from)+'</td>'
      +'<td style="font-family:\'JetBrains Mono\',monospace;font-size:12px;color:var(--muted)">'+esc(d.to)+'</td>'
      +'<td>'+shiftBadge(d.shift)+'</td>'
      +'<td>'+staffList.map(function(n){return'<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">'+avatarHTML(n,24)+'<span style="font-size:12.5px;font-weight:600">'+esc(n)+'</span></div>'}).join('')+'</td>'
      +'<td style="white-space:nowrap">'
      +(isAdmin
        ?'<button onclick="dutyEditId=\''+d.id+'\';render()" style="background:var(--accent-light);color:var(--accent);border:1px solid var(--accent);border-radius:6px;padding:4px 9px;cursor:pointer;font-size:11px;font-weight:700;font-family:\'DM Sans\',sans-serif;margin-right:4px">✏ Edit</button>'
         +'<button onclick="dutyDeleteEntry(\''+d.id+'\')" style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;border-radius:6px;padding:4px 9px;cursor:pointer;font-size:11px;font-weight:700;font-family:\'DM Sans\',sans-serif">✕</button>'
        :'<span style="font-size:11px;color:var(--muted2);font-style:italic">View only</span>')
      +'</td></tr>';
  }).join('');
  // Mobile: shift cards
  var dhMobileCards=dutyData.map(function(d){
    var shiftCols={
      'Morning Shift':'#d4a853','Evening Shift':'#3b78c9',
      'Night Shift':'#8b5cf6','Full Shift':'#1a6b55'
    };
    var shCol=shiftCols[d.shift]||'#7a7468';
    var staffList=d.staff.split(',').map(function(n){return n.trim();}).filter(Boolean);
    return '<div class="dh-mob-card" style="border-left-color:'+d.color+'">'
      +'<div class="dh-mob-post" style="color:'+d.color+'">'+esc(d.post)+'</div>'
      +'<div class="dh-mob-time">⏰ '+esc(d.from)+(d.to?' → '+esc(d.to):'')
        +' &nbsp;·&nbsp; <span style="color:'+shCol+';font-weight:700">'+esc(d.shift)+'</span>'
      +'</div>'
      +'<div style="display:flex;flex-wrap:wrap;margin-bottom:'+(isAdmin?'10px':'0')+'">'+staffList.map(function(n){
        return '<div class="dh-mob-staff-pill">'+avatarHTML(n,22)+'<span>'+esc(n)+'</span></div>';
      }).join('')+'</div>'
      +(isAdmin
        ?'<div style="display:flex;gap:8px">'
          +'<button onclick="dutyEditId=\''+d.id+'\';render()" style="flex:1;padding:8px;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer;background:var(--accent-light);color:var(--accent);border:1.5px solid var(--accent);font-family:\'DM Sans\',sans-serif">✏ Edit</button>'
          +'<button onclick="dutyDeleteEntry(\''+d.id+'\')" style="padding:8px 14px;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer;background:#fee2e2;color:#dc2626;border:1.5px solid #fca5a5;font-family:\'DM Sans\',sans-serif">🗑</button>'
        +'</div>':'')
    +'</div>';
  }).join('');
  return '<div style="margin-bottom:20px"><div style="font-family:\'JetBrains Mono\',monospace;font-size:11px;color:var(--muted);letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px">NON-TEACHING STAFF</div><div style="font-size:22px;font-family:\'Cormorant Garamond\',serif;font-weight:700;color:var(--text)">Duty Hours Schedule &mdash; Monday to Saturday</div></div>'
    +'<div class="stat-grid" style="grid-template-columns:repeat(4,1fr)">'
    +'<div class="stat-card" style="--c:#d4a853"><div class="stat-label">Morning Shifts</div><div class="stat-val">'+morning+'</div><div class="stat-sub">Early duty posts</div></div>'
    +'<div class="stat-card" style="--c:#3b78c9"><div class="stat-label">Evening Shifts</div><div class="stat-val">'+evening+'</div><div class="stat-sub">Afternoon & evening</div></div>'
    +'<div class="stat-card" style="--c:#8b5cf6"><div class="stat-label">Night Shift</div><div class="stat-val">'+night+'</div><div class="stat-sub">Night duty posts</div></div>'
    +'<div class="stat-card" style="--c:#1a6b55"><div class="stat-label">Full Shifts</div><div class="stat-val">'+full+'</div><div class="stat-sub">All-day postings</div></div>'
    +'</div>'
    +'<div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">'
      +(isAdmin?'<button class="btn btn-primary" onclick="dutyAddForm=!dutyAddForm;dutyEditId=null;render()">+ Add Duty Entry</button>':'')
      +'<button class="btn btn-outline" onclick="dutyPrintReport()" style="color:#8b5cf6;border-color:#c4b5fd">🖨 Print Duty Report</button>'
      +'<button class="btn btn-outline" onclick="dutyExportCSV()" style="color:#16a34a;border-color:#86efac">⬇ Export CSV</button>'
    +'</div>'
    +addFormHTML
    // Desktop table
    +'<div class="gnsi-dh-desktop"><div class="card"><div class="card-head"><span class="card-title">Non-Teaching Staff Duty Roster</span><span style="font-size:11px;color:var(--muted);font-family:\'JetBrains Mono\',monospace">Valid: Mon – Sat &nbsp;|&nbsp; '+dutyData.length+' entries</span></div>'
    +'<div style="overflow-x:auto"><table><thead><tr><th>Post</th><th>From</th><th>To</th><th>Shift</th><th>Staff Name(s)</th><th>Actions</th></tr></thead><tbody>'+rows+'</tbody></table></div></div></div>'
    // Mobile shift cards
    +'<div class="gnsi-dh-mobile">'
      +(isAdmin?'<div class="mob-perm-banner admin">🔐 Admin Mode -- Tap Edit to modify any entry.</div>':'<div class="mob-perm-banner view">👁 View Only -- Only Admin can edit duty entries.</div>')
      +(dhMobileCards||'<div style="padding:32px;text-align:center;color:var(--muted)">No duty entries yet.</div>')
    +'</div>';
}
function dutyAddEntry(){
  if(!_isAdminOrArunkumar()){showToast('🔒 Only Admin can add duty entries.','#dc2626');return;}
  var post=((document.getElementById('dh-post')||{}).value||'').trim();
  var staff=((document.getElementById('dh-staff')||{}).value||'').trim();
  if(!post||!staff){alert('Post and Staff Name are required.');return;}
  var data=loadDutyData();
  data.push({
    id:'d'+Date.now(),
    post:post,
    from:((document.getElementById('dh-from')||{}).value||'').trim(),
    to:((document.getElementById('dh-to')||{}).value||'').trim(),
    shift:document.getElementById('dh-shift').value,
    staff:staff,
    color:document.getElementById('dh-color').value
  });
  saveDutyData(data);dutyAddForm=false;render();showToast('Duty entry added','#16a34a');
}
function dutySaveEdit(id){
  var data=loadDutyData();
  data=data.map(function(d){
    if(d.id!==id)return d;
    return Object.assign({},d,{
      post:((document.getElementById('de-post-'+id)||{}).value||d.post).trim(),
      from:((document.getElementById('de-from-'+id)||{}).value||d.from).trim(),
      to:((document.getElementById('de-to-'+id)||{}).value||d.to).trim(),
      shift:(document.getElementById('de-shift-'+id)||{value:d.shift}).value,
      staff:((document.getElementById('de-staff-'+id)||{}).value||d.staff).trim()
    });
  });
  saveDutyData(data);dutyEditId=null;render();showToast('Duty entry updated','#1433a8');
}
function dutyDeleteEntry(id){
  if(!_isAdminOrArunkumar()){showToast('🔒 Only Admin can delete duty entries.','#dc2626');return;}
  if(!confirm('Remove this duty entry?'))return;
  saveDutyData(loadDutyData().filter(function(d){return d.id!==id;}));render();
}
function dutyPrintReport(){
  var data=loadDutyData();
  var rows=data.map(function(d){
    return '<tr><td style="font-weight:700;color:'+d.color+'">'+d.post+'</td><td style="font-family:\'JetBrains Mono\',monospace">'+d.from+'</td><td style="font-family:\'JetBrains Mono\',monospace">'+d.to+'</td><td>'+d.shift+'</td><td>'+d.staff+'</td></tr>';
  }).join('');
  var shiftGroups={'Morning Shift':0,'Evening Shift':0,'Night Shift':0,'Full Shift':0};
  data.forEach(function(d){if(shiftGroups[d.shift]!==undefined)shiftGroups[d.shift]++;});
  var w=window.open('','_blank','width=900,height=700');
  if(!w){alert('Allow popups to view report.');return;}
  w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Duty Roster</title>'
    +'<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Nunito:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">'
    +'<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Nunito,sans-serif;padding:32px;background:#f4f1eb;color:#1c1a16}'
    +'.wrap{background:#fff;border-radius:16px;padding:32px;max-width:860px;margin:0 auto;box-shadow:0 4px 24px rgba(0,0,0,.12)}'
    +'.header{background:#1433a8;color:#fff;border-radius:10px;padding:18px 22px;margin-bottom:22px;display:flex;justify-content:space-between;align-items:center}'
    +'.h-title{font-family:"Cormorant Garamond",serif;font-size:20px;font-weight:700}'
    +'.h-sub{font-size:10px;opacity:.8;letter-spacing:.08em;font-family:"JetBrains Mono",monospace;margin-top:3px}'
    +'table{width:100%;border-collapse:collapse;margin-bottom:20px}'
    +'th{background:#1433a8;color:#fff;padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.08em;font-family:"JetBrains Mono",monospace}'
    +'td{padding:10px 12px;border-bottom:1px solid #d4ddf0;font-size:13px;vertical-align:top}'
    +'tr:nth-child(even){background:#f0f4fb}'
    +'.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}'
    +'.sum-box{border-radius:10px;padding:12px 16px;text-align:center;border:1px solid #d4ddf0}'
    +'.sum-num{font-family:"Cormorant Garamond",serif;font-size:28px;font-weight:700}'
    +'.sum-lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;font-family:"JetBrains Mono",monospace;color:#6474a0;margin-top:3px}'
    +'.footer{font-size:11px;color:#6474a0;text-align:center;font-family:"JetBrains Mono",monospace;border-top:1px solid #d4ddf0;padding-top:12px}'
    +'@media print{body{padding:0;background:#fff}.wrap{box-shadow:none}.no-print{display:none}}'
    +'<\/style><\/head><body>'
    +'<div class="wrap"><div class="header"><div><div class="h-title">'+(window.TENANT?window.TENANT.name:'Guidance Navodaya &amp; Sainik Institute')+'</div><div class="h-sub">DUTY HOURS ROSTER -- MONDAY TO SATURDAY</div></div><div style="text-align:right;font-size:11px;opacity:.8;font-family:\'JetBrains Mono\',monospace">Generated: '+new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})+'</div></div>'
    +'<div class="summary">'
    +'<div class="sum-box"><div class="sum-num" style="color:#d4a853">'+shiftGroups['Morning Shift']+'</div><div class="sum-lbl">Morning Shifts</div></div>'
    +'<div class="sum-box"><div class="sum-num" style="color:#3b78c9">'+shiftGroups['Evening Shift']+'</div><div class="sum-lbl">Evening Shifts</div></div>'
    +'<div class="sum-box"><div class="sum-num" style="color:#8b5cf6">'+shiftGroups['Night Shift']+'</div><div class="sum-lbl">Night Shifts</div></div>'
    +'<div class="sum-box"><div class="sum-num" style="color:#1a6b55">'+shiftGroups['Full Shift']+'</div><div class="sum-lbl">Full Shifts</div></div>'
    +'</div>'
    +'<div class="no-print" style="margin-bottom:16px;display:flex;gap:10px"><button onclick="window.print()" style="background:#1433a8;color:#fff;border:none;border-radius:8px;padding:9px 20px;cursor:pointer;font-family:Nunito,sans-serif;font-weight:700;font-size:13px">🖨 Print / Save PDF</button><button onclick="window.close()" style="background:#f0f4fb;color:#3d4f80;border:1px solid #c8d4ee;border-radius:8px;padding:9px 16px;cursor:pointer;font-family:Nunito,sans-serif;font-weight:700;font-size:13px">Close</button></div>'
    +'<table><thead><tr><th>Post / Role</th><th>From</th><th>To</th><th>Shift</th><th>Staff Assigned</th></tr></thead><tbody>'+rows+'</tbody></table>'
    +'<div class="footer">'+(window.TENANT?window.TENANT.name+' &nbsp;|&nbsp; '+window.TENANT.address:'Guidance Navodaya &amp; Sainik Institute &nbsp;|&nbsp; Khangabok Sorok Wangma, Thoubal, Manipur')+'</div>'
    +'</div><\/body><\/html>');
  w.document.close();
}
function dutyExportCSV(){
  showToast('⏳ Preparing Duty CSV…','#2563eb');

  var data=loadDutyData();
  var rows=[['Post','From','To','Shift','Staff Names']].concat(data.map(function(d){return[d.post,d.from,d.to,d.shift,d.staff]}));
    showToast('✅ Duty CSV ready — '+(rows.length)+' rows','#16a34a');
  downloadCSV('GNSI_Duty_Roster.csv',rows);
}
// -- BOARDER SCHEDULE ------------------------------------------
// Mon–Sat Schedule (from Course Induction Timetable 2026-27)
var BOARDER_DEFAULT=[
  {no:1, from:'6:00 AM',to:'',       activity:'🌅 Wake Up Bell'},
  {no:2, from:'6:00 AM',to:'6:30 AM',activity:'🌅 Wake & Refresh'},
  {no:3, from:'6:30 AM',to:'7:00 AM',activity:'🏃 Morning PT'},
  {no:4, from:'7:00 AM',to:'8:30 AM',activity:'📖 Doubt Session'},
  {no:5, from:'8:30 AM',to:'9:30 AM',activity:'🍽 Breakfast'},
  {no:6, from:'9:30 AM',to:'10:00 AM',activity:'📚 Dress Up'},
  {no:7, from:'10:00 AM',to:'',       activity:'🌅 School Bell'},
  {no:8, from:'10:30 AM',to:'1:10 PM',activity:'📚 Academic Hours (1st Shift)'},
  {no:9, from:'1:10 PM', to:'1:40 PM',activity:'🍽 Tea Break'},
  {no:10,from:'1:30 PM', to:'3:30 PM',activity:'📚 Academic Hours (2nd Shift)'},
  {no:11,from:'3:30 PM', to:'4:00 PM',activity:'📚 Dress Change & Rest'},
  {no:12,from:'4:00 PM', to:'5:00 PM',activity:'⚽ Recreation'},
  {no:13,from:'5:00 PM', to:'5:30 PM',activity:'🌅 Assemble & Roll Call'},
  {no:14,from:'5:30 PM', to:'7:30 PM',activity:'📖 Doubt Session'},
  {no:15,from:'7:30 PM', to:'8:00 PM',activity:'📚 Line Up'},
  {no:16,from:'8:30 PM', to:'9:30 PM',activity:'📖 Assignment'},
  {no:17,from:'9:30 PM', to:'',       activity:'🌙 Lights Off'}
];
// Sunday / Holiday Schedule
var BOARDER_DEFAULT_SUNDAY=[
  {no:1, from:'6:30 AM',to:'',        activity:'🌅 Wake Up Bell'},
  {no:2, from:'6:30 AM',to:'8:00 AM', activity:'🏃 Morning PT / Games'},
  {no:3, from:'8:00 AM',to:'9:00 AM', activity:'🍽 Breakfast'},
  {no:4, from:'9:00 AM',to:'11:30 AM',activity:'📚 Self Study / Library'},
  {no:5, from:'11:30 AM',to:'1:00 PM',activity:'🎭 Co-curricular Activities'},
  {no:6, from:'1:00 PM',to:'2:00 PM', activity:'🍽 Lunch'},
  {no:7, from:'2:00 PM',to:'3:30 PM', activity:'🌙 Rest / Nap'},
  {no:8, from:'3:30 PM',to:'5:30 PM', activity:'⚽ Recreation / Outing'},
  {no:9, from:'5:30 PM',to:'6:00 PM', activity:'🌅 Assemble & Roll Call'},
  {no:10,from:'6:00 PM',to:'7:30 PM', activity:'📺 Movie / Entertainment'},
  {no:11,from:'7:30 PM',to:'8:30 PM', activity:'🍽 Dinner'},
  {no:12,from:'8:30 PM',to:'9:30 PM', activity:'📖 Light Study / Reading'},
  {no:13,from:'9:30 PM',to:'',        activity:'🌙 Lights Off'}
];
function loadBoarderSchedule(){
  var s=localStorage.getItem('ims_boarder');
  if(s){try{return JSON.parse(s);}catch(e){}}
  return JSON.parse(JSON.stringify(BOARDER_DEFAULT));
}
function saveBoarderSchedule(d){localStorage.setItem('ims_boarder',JSON.stringify(d));if(typeof gnsiKVPush==='function')gnsiKVPush('ims_boarder',d);}
function loadBoarderScheduleSunday(){
  var s=localStorage.getItem('ims_boarder_sunday');
  if(s){try{return JSON.parse(s);}catch(e){}}
  return JSON.parse(JSON.stringify(BOARDER_DEFAULT_SUNDAY));
}
function saveBoarderScheduleSunday(d){localStorage.setItem('ims_boarder_sunday',JSON.stringify(d));if(typeof gnsiKVPush==='function')gnsiKVPush('ims_boarder_sunday',d);}
var boarderEditRow=null; // row no being edited
var boarderAddForm=false;
var boarderTab='schedule'; // 'schedule' | 'arrangement'
var boarderScheduleType='weekday'; // 'weekday' | 'sunday'
var saEditKey=null; // staff arrangement edit key: 'section__id__slotIndex'
function renderPeriodSalary(){
  var tabStyle=function(t){
    return t===psTab
      ?'padding:9px 20px;border-radius:8px;border:none;cursor:pointer;font-family:\'Nunito\',sans-serif;font-weight:700;font-size:13px;background:var(--accent);color:#fff'
      :'padding:9px 20px;border-radius:8px;border:1.5px solid var(--border);cursor:pointer;font-family:\'Nunito\',sans-serif;font-weight:600;font-size:13px;background:var(--surface);color:var(--muted)';
  };
  var tabs='<div id="ps-tab-bar" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:22px">'
    +'<button style="'+tabStyle('periodatt')+'" onclick="psTab=\'periodatt\';render()">&#128197; Period Attendance</button>'
    +'<button style="'+tabStyle('salconfig')+'" onclick="psTab=\'salconfig\';render()">&#9881; Salary Config</button>'
    +'<button style="'+tabStyle('advances')+'" onclick="psTab=\'advances\';render()">&#128178; Advances</button>'
    +'<button style="'+tabStyle('report')+'" onclick="psTab=\'report\';render()">&#128200; Salary Report</button>'
    +'</div>';
  var body='';
  if(psTab==='periodatt')body=renderPATab();
  else if(psTab==='salconfig')body=renderSalConfig();
  else if(psTab==='advances')body=renderAdvances();
  else body=renderSalReport();
  return '<div style="margin-bottom:16px"><div style="font-family:\'JetBrains Mono\',monospace;font-size:11px;color:var(--muted);letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px">ADVANCED MODULE</div>'
    +'<div style="font-size:22px;font-family:\'Cormorant Garamond\',serif;font-weight:700;color:var(--text)">Period Attendance &amp; Salary Calculator</div></div>'
    +tabs+body;
}
function renderPATab(){
  var activePeriods=getAllActivePeriods();
  var pa=loadPAtt();
  // Daily stats
  var totalCells=activePeriods.length*TT_COLS.length;
  var presentCnt=0,absentCnt=0,subCnt=0,unmarkedCnt=0;
  activePeriods.forEach(function(p){
    TT_COLS.forEach(function(c){
      var cell=p[c.key];if(!cell||!cell.teacher)return;
      var att=pa[pattKey(psDate,p.id,c.key)]||{status:''};
      if(att.status==='P')presentCnt++;
      else if(att.status==='A')absentCnt++;
      else if(att.status==='S')subCnt++;
      else unmarkedCnt++;
    });
  });
  var statsBar='<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:18px">'
    +'<div style="padding:10px 18px;border-radius:10px;background:#dcfce7;border:1px solid #86efac;text-align:center;min-width:80px"><div style="font-size:22px;font-weight:800;color:#16a34a;font-family:\'Cormorant Garamond\',serif">'+presentCnt+'</div><div style="font-size:9px;color:#16a34a;font-weight:700;text-transform:uppercase;letter-spacing:.08em;font-family:\'JetBrains Mono\',monospace">Present</div></div>'
    +'<div style="padding:10px 18px;border-radius:10px;background:#fee2e2;border:1px solid #fca5a5;text-align:center;min-width:80px"><div style="font-size:22px;font-weight:800;color:#dc2626;font-family:\'Cormorant Garamond\',serif">'+absentCnt+'</div><div style="font-size:9px;color:#dc2626;font-weight:700;text-transform:uppercase;letter-spacing:.08em;font-family:\'JetBrains Mono\',monospace">Absent</div></div>'
    +'<div style="padding:10px 18px;border-radius:10px;background:#fef9c3;border:1px solid #fde047;text-align:center;min-width:80px"><div style="font-size:22px;font-weight:800;color:#ca8a04;font-family:\'Cormorant Garamond\',serif">'+subCnt+'</div><div style="font-size:9px;color:#ca8a04;font-weight:700;text-transform:uppercase;letter-spacing:.08em;font-family:\'JetBrains Mono\',monospace">Substitute</div></div>'
    +'<div style="padding:10px 18px;border-radius:10px;background:var(--surface2);border:1px solid var(--border);text-align:center;min-width:80px"><div style="font-size:22px;font-weight:800;color:var(--muted);font-family:\'Cormorant Garamond\',serif">'+unmarkedCnt+'</div><div style="font-size:9px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.08em;font-family:\'JetBrains Mono\',monospace">Unmarked</div></div>'
    +'</div>';
  // Period-wise table
  var headerRow='<tr><th style="width:140px;position:sticky;left:0;z-index:2;background:var(--surface)">Period / Time</th>'
    +TT_COLS.map(function(c){return'<th style="text-align:center;min-width:145px;background:'+c.color+'18;color:'+c.color+';border-bottom:3px solid '+c.color+';font-size:11.5px">'+c.label+'</th>'}).join('')
    +'</tr>';
  var bodyRows=activePeriods.map(function(p){
    var cells=TT_COLS.map(function(c){
      var ttCell=p[c.key]||{sub:'',teacher:''};
      if(!ttCell.teacher)return'<td style="background:var(--surface2);text-align:center;color:var(--border);font-size:18px">--</td>';
      var att=pa[pattKey(psDate,p.id,c.key)]||{status:'',sub:''};
      var st=att.status;
      var bg=st==='P'?'#dcfce7':st==='A'?'#fee2e2':st==='S'?'#fef9c3':'var(--surface)';
      var borderCol=st==='P'?'#86efac':st==='A'?'#fca5a5':st==='S'?'#fde047':'var(--border)';
      var statusBtnColor=st==='P'?'#16a34a':st==='A'?'#dc2626':st==='S'?'#ca8a04':'#7a7468';
      var statusLabel=st==='P'?'&#10003; Present':st==='A'?'&#10005; Absent':st==='S'?'&#8645; Sub':'Mark';
      return '<td style="padding:8px 6px;vertical-align:top;background:'+bg+';border:1.5px solid '+borderCol+';transition:background .15s">'
        +'<div style="font-size:11.5px;font-weight:700;color:'+c.color+';margin-bottom:2px">'+esc(ttCell.sub)+'</div>'
        +'<div style="font-size:10.5px;color:var(--muted);margin-bottom:6px">'+esc(ttCell.teacher)+'</div>'
        +(st==='S'&&att.sub?'<div style="font-size:10px;color:#ca8a04;background:#fef9c3;border:1px solid #fde047;border-radius:5px;padding:2px 6px;margin-bottom:5px">&#8645; '+esc(att.sub)+'</div>':'')
        +'<div style="display:flex;gap:4px;flex-wrap:wrap">'
          +'<button onclick="paCycle(\''+p.id+'\',\''+c.key+'\',\'P\')" style="flex:1;min-width:34px;padding:3px 4px;border-radius:5px;border:1px solid '+(st==='P'?'#16a34a':'#e2ddd5')+';background:'+(st==='P'?'#16a34a':'transparent')+';color:'+(st==='P'?'#fff':'#7a7468')+';font-size:10px;font-weight:700;cursor:pointer;font-family:\'JetBrains Mono\',monospace">P</button>'
          +'<button onclick="paCycle(\''+p.id+'\',\''+c.key+'\',\'A\')" style="flex:1;min-width:34px;padding:3px 4px;border-radius:5px;border:1px solid '+(st==='A'?'#dc2626':'#e2ddd5')+';background:'+(st==='A'?'#dc2626':'transparent')+';color:'+(st==='A'?'#fff':'#7a7468')+';font-size:10px;font-weight:700;cursor:pointer;font-family:\'JetBrains Mono\',monospace">A</button>'
          +'<button onclick="paOpenSub(\''+p.id+'\',\''+c.key+'\',\''+esc(ttCell.teacher)+'\')" style="flex:1;min-width:34px;padding:3px 4px;border-radius:5px;border:1px solid '+(st==='S'?'#ca8a04':'#e2ddd5')+';background:'+(st==='S'?'#ca8a04':'transparent')+';color:'+(st==='S'?'#fff':'#7a7468')+';font-size:10px;font-weight:700;cursor:pointer;font-family:\'JetBrains Mono\',monospace">Sub</button>'
        +'</div>'
      +'</td>';
    }).join('');
    return '<tr><td style="position:sticky;left:0;z-index:1;background:var(--surface);padding:10px 12px;border-right:2px solid var(--border);vertical-align:top"><div style="font-size:11px;font-weight:700;color:var(--text);font-family:\'JetBrains Mono\',monospace">'+esc(p.time||p.label||p.id)+'</div><div style="font-size:10px;color:var(--muted);margin-top:2px">'+esc(p.label||'')+'</div></td>'+cells+'</tr>';
  }).join('');
  // Substitute modal
  var subModalHTML='';
  if(psSubModal){
    var allTeach=staff.filter(function(s){return s.dept==='Teaching'||s.role.toLowerCase().includes('teacher')});
    subModalHTML='<div style="position:fixed;inset:0;background:rgba(28,26,22,.45);z-index:200;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px)" onclick="if(event.target===this){psSubModal=null;render()}">'
      +'<div style="background:var(--surface);border-radius:16px;padding:28px;width:420px;max-width:95vw;box-shadow:var(--shadow2);animation:pageIn .2s ease">'
      +'<div style="font-family:\'Cormorant Garamond\',serif;font-size:18px;font-weight:700;margin-bottom:6px">&#8645; Assign Substitute Teacher</div>'
      +'<div style="font-size:12px;color:var(--muted);margin-bottom:18px">Replacing: <b style="color:var(--accent)">'+esc(psSubModal.assignedTeacher)+'</b></div>'
      +'<div class="form-group" style="margin-bottom:18px"><label>Substitute Teacher</label>'
        +'<input id="sub-tea-inp" list="sub-tea-list" placeholder="Type or select substitute..." style="width:100%;background:var(--surface2);border:1.5px solid var(--border);border-radius:8px;padding:10px 12px;font-size:14px;font-family:\'Nunito\',sans-serif;color:var(--text);outline:none"/>'
        +'<datalist id="sub-tea-list">'+staff.map(function(s){return'<option value="'+esc(s.name)+'">'+esc(s.role)+'</option>'}).join('')+'</datalist>'
      +'</div>'
      +'<div style="margin-bottom:18px"><div style="font-size:11px;color:var(--muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:.06em;font-family:\'JetBrains Mono\',monospace">Quick Select Teaching Staff</div>'
        +'<div style="display:flex;flex-wrap:wrap;gap:6px">'
          +allTeach.slice(0,12).map(function(s){return'<button onclick="document.getElementById(\'sub-tea-inp\').value=\''+s.name+'\'" style="padding:4px 10px;border-radius:6px;border:1px solid var(--border);background:var(--surface2);cursor:pointer;font-size:11.5px;color:var(--text);font-family:\'Nunito\',sans-serif;font-weight:600">'+esc(s.name.split(' ')[0])+'</button>'}).join('')
        +'</div>'
      +'</div>'
      +'<div style="display:flex;gap:10px">'
        +'<button class="btn btn-primary" onclick="paConfirmSub()" style="flex:1">Confirm Substitute</button>'
        +'<button class="btn btn-outline" onclick="psSubModal=null;render()">Cancel</button>'
      +'</div>'
    +'</div></div>';
  }
  var isAdminOrManager=currentUser&&(currentUser.role==='admin'||currentUser.role==='manager');
  var paEditBanner=isAdminOrManager
    ?'<div class="mob-perm-banner admin">🔐 <b>Admin/Manager:</b> Tap P · A · Sub to mark each teacher\'s period.</div>'
    :'<div class="mob-perm-banner view">👁 <b>View Only.</b> Only Admin or Manager can mark period attendance.</div>';
  // Mobile: period-card based view
  var paMobileCards=activePeriods.map(function(p){
    var teacherRows=TT_COLS.map(function(c){
      var ttCell=p[c.key]||{sub:'',teacher:''};
      if(!ttCell.teacher)return'';
      var att=pa[pattKey(psDate,p.id,c.key)]||{status:'',sub:''};
      var st=att.status;
      return '<div class="pa-mob-teacher-row">'
        +'<div style="width:10px;height:10px;border-radius:50%;background:'+c.color+';flex-shrink:0;margin-top:2px"></div>'
        +'<div class="pa-mob-teacher-info">'
          +'<div class="pa-mob-teacher-sub" style="color:'+c.color+'">'+esc(ttCell.sub)+' <span style="font-size:10px;color:var(--muted);font-weight:400">'+esc(c.label)+'</span></div>'
          +'<div class="pa-mob-teacher-name">'+esc(ttCell.teacher)+(st==='S'&&att.sub?' → <b style="color:#ca8a04">'+esc(att.sub)+'</b>':'')+'</div>'
        +'</div>'
        +(isAdminOrManager
          ?'<div class="pa-mob-att-btns">'
            +'<button class="pa-mob-att-btn'+(st==='P'?' active-P':'')+'" onclick="paCycle(\''+p.id+'\',\''+c.key+'\',\'P\')">P</button>'
            +'<button class="pa-mob-att-btn'+(st==='A'?' active-A':'')+'" onclick="paCycle(\''+p.id+'\',\''+c.key+'\',\'A\')">A</button>'
            +'<button class="pa-mob-att-btn'+(st==='S'?' active-S':'')+'" onclick="paOpenSub(\''+p.id+'\',\''+c.key+'\',\''+esc(ttCell.teacher)+'\')">Sub</button>'
          +'</div>'
          :'<span style="font-size:11px;padding:4px 8px;border-radius:8px;background:'+(st==='P'?'#dcfce7':st==='A'?'#fee2e2':st==='S'?'#fef9c3':'var(--surface3)')+';color:'+(st==='P'?'#16a34a':st==='A'?'#dc2626':st==='S'?'#ca8a04':'var(--muted)')+';font-weight:700">'+(st||'--')+'</span>')
      +'</div>';
    }).filter(Boolean).join('');
    if(!teacherRows)return'';
    return '<div class="pa-mob-period-card">'
      +'<div class="pa-mob-period-head">'+esc(p.time||p.label||p.id)+'</div>'
      +teacherRows
    +'</div>';
  }).filter(Boolean).join('');
  return '<div style="display:flex;gap:12px;margin-bottom:18px;align-items:center;flex-wrap:wrap">'
    +'<div style="font-size:13px;color:var(--muted);font-weight:600">Date:</div>'
    +'<input type="date" value="'+psDate+'" onchange="psDate=this.value;render()" style="background:var(--surface);border:1.5px solid var(--border);border-radius:9px;padding:8px 14px;font-size:13px;font-family:\'Nunito\',sans-serif;color:var(--text);outline:none"/>'
    +(isAdminOrManager
      ?'<div style="margin-left:auto;display:flex;gap:8px;">'
        +'<button class="btn btn-outline" style="font-size:11px;padding:6px 12px" onclick="paMarkAllDay(\'P\')">All Present</button>'
        +'<button class="btn btn-outline" style="font-size:11px;padding:6px 12px" onclick="paMarkAllDay(\'A\')">All Absent</button>'
        +'<button class="btn btn-outline" style="font-size:11px;padding:6px 12px;color:#dc2626;border-color:#fca5a5" onclick="paClearDay()">Clear Day</button>'
      +'</div>'
      :'')
    +'</div>'
    +statsBar
    +'<div style="font-size:11px;color:var(--muted);margin-bottom:10px;font-family:\'JetBrains Mono\',monospace">&#128161; Click P / A / Sub on each cell &nbsp;&middot;&nbsp; Sub button opens substitute teacher selector</div>'
    // Desktop table
    +'<div class="gnsi-pa-desktop"><div class="card"><div style="overflow-x:auto"><table style="min-width:950px"><thead>'+headerRow+'</thead><tbody>'+bodyRows+'</tbody></table></div></div></div>'
    // Mobile cards
    +'<div class="gnsi-pa-mobile">'+paEditBanner+paMobileCards+'</div>'
    +subModalHTML;
}
function paCycle(periodId,courseKey,status){
  var cur=getPAtt(psDate,periodId,courseKey);
  // If clicking the same status, toggle off
  var newStatus=cur.status===status?'':status;
  setPAtt(psDate,periodId,courseKey,{status:newStatus,sub:newStatus===''||newStatus!=='S'?'':cur.sub});
  var sc=document.getElementById('content');var st=sc?sc.scrollTop:0;
  render();if(sc)sc.scrollTop=st;
}
function paOpenSub(periodId,courseKey,assignedTeacher){
  var cur=getPAtt(psDate,periodId,courseKey);
  psSubModal={date:psDate,periodId:periodId,courseKey:courseKey,assignedTeacher:assignedTeacher,existingSub:cur.sub||''};
  render();
  setTimeout(function(){var el=document.getElementById('sub-tea-inp');if(el){el.value=psSubModal.existingSub;el.focus()}},50);
}
function paConfirmSub(){
  if(!psSubModal)return;
  var subName=((document.getElementById('sub-tea-inp')||{}).value||'').trim();
  if(!subName){alert('Please enter a substitute teacher name.');return}
  setPAtt(psSubModal.date,psSubModal.periodId,psSubModal.courseKey,{status:'S',sub:subName});
  psSubModal=null;render();
}
function paMarkAllDay(st){
  var periods=getAllActivePeriods();
  var pa=loadPAtt();
  periods.forEach(function(p){
    TT_COLS.forEach(function(c){
      var cell=p[c.key];if(!cell||!cell.teacher)return;
      pa[pattKey(psDate,p.id,c.key)]={status:st,sub:''};
    });
  });
  savePAtt(pa);render();
}
function paClearDay(){
  if(!confirm('Clear all period attendance for '+psDate+'?'))return;
  var periods=getAllActivePeriods();
  var pa=loadPAtt();
  periods.forEach(function(p){
    TT_COLS.forEach(function(c){
      delete pa[pattKey(psDate,p.id,c.key)];
    });
  });
  savePAtt(pa);
  gnsiMarkLocalSave(20000); // 20s guard -- prevents KV poll from restoring cleared period attendance
  render();
}
function renderSalConfig(){
  var teachers=getAllTeachers();
  var sc=loadSalConf();
  var rows=teachers.map(function(t){
    var conf=sc[t]||{monthly:0,subRate:100,workDays:26,periodsPerDay:5};
    var ppr=conf.monthly&&conf.workDays&&conf.periodsPerDay?(conf.monthly/(conf.workDays*conf.periodsPerDay)).toFixed(2):0;
    var isEditing=psSalEditId===t;
    if(isEditing){
      return '<tr style="background:var(--accent-light)">'
        +'<td><div style="display:flex;align-items:center;gap:8px">'+avatarHTML(t,28)+'<b>'+esc(t)+'</b></div></td>'
        +'<td><input id="sal-mon-'+_safeBtoa(t).replace(/=/g,'')+'" type="number" value="'+(conf.monthly||'')+'" placeholder="e.g. 15000" style="width:110px;border:1.5px solid var(--accent);border-radius:7px;padding:6px 8px;font-size:13px;font-family:\'Nunito\',sans-serif;outline:none"/></td>'
        +'<td><input id="sal-sub-'+_safeBtoa(t).replace(/=/g,'')+'" type="number" value="'+(conf.subRate||100)+'" style="width:80px;border:1.5px solid var(--border);border-radius:7px;padding:6px 8px;font-size:13px;font-family:\'Nunito\',sans-serif;outline:none"/></td>'
        +'<td><input id="sal-wd-'+_safeBtoa(t).replace(/=/g,'')+'" type="number" value="'+(conf.workDays||26)+'" style="width:60px;border:1.5px solid var(--border);border-radius:7px;padding:6px 8px;font-size:13px;font-family:\'Nunito\',sans-serif;outline:none"/></td>'
        +'<td><input id="sal-pd-'+_safeBtoa(t).replace(/=/g,'')+'" type="number" value="'+(conf.periodsPerDay||5)+'" style="width:60px;border:1.5px solid var(--border);border-radius:7px;padding:6px 8px;font-size:13px;font-family:\'Nunito\',sans-serif;outline:none"/></td>'
        +'<td style="font-family:\'JetBrains Mono\',monospace;font-size:12px;color:var(--accent)">auto</td>'
        +'<td><button class="btn btn-primary" onclick="salSave(\''+esc(t)+'\')" style="font-size:12px;padding:6px 14px">Save</button> <button class="btn btn-outline" onclick="psSalEditId=null;render()" style="font-size:12px;padding:6px 12px">&#10005;</button></td>'
      +'</tr>';
    }
    return '<tr>'
      +'<td><div style="display:flex;align-items:center;gap:8px">'+avatarHTML(t,28)+'<b>'+esc(t)+'</b></div></td>'
      +'<td><span style="font-family:\'JetBrains Mono\',monospace;font-size:13px;color:var(--accent);font-weight:700">'+(conf.monthly?'&#8377;'+Number(conf.monthly).toLocaleString():'<span style="color:#ccc">Not set</span>')+'</span></td>'
      +'<td><span style="font-family:\'JetBrains Mono\',monospace;font-size:12px;color:var(--muted)">&#8377;'+esc(conf.subRate||100)+'/period</span></td>'
      +'<td><span style="font-family:\'JetBrains Mono\',monospace;font-size:12px;color:var(--muted)">'+esc(conf.workDays||26)+' days</span></td>'
      +'<td><span style="font-family:\'JetBrains Mono\',monospace;font-size:12px;color:var(--muted)">'+esc(conf.periodsPerDay||5)+' periods</span></td>'
      +'<td><span style="font-family:\'JetBrains Mono\',monospace;font-size:12px;font-weight:700;color:var(--accent)">'+(ppr?'&#8377;'+ppr:'--')+'</span></td>'
      +'<td><button class="btn btn-outline" onclick="psSalEditId=\''+esc(t)+'\';render()" style="font-size:12px;padding:6px 12px">&#9998; Edit</button></td>'
    +'</tr>';
  });
  return '<div class="card">'
    +'<div class="card-head"><span class="card-title">Teacher Salary Configuration</span>'
    +'<span style="font-size:11px;color:var(--muted);font-family:\'JetBrains Mono\',monospace">'+teachers.length+' teachers from timetable</span></div>'
    +'<div style="overflow-x:auto"><table><thead><tr>'
      +'<th>Teacher</th><th>Monthly Salary</th><th>Sub Rate / Period</th><th>Work Days/Mo</th><th>Periods/Day</th><th>Per-Period Rate</th><th>Action</th>'
    +'</tr></thead><tbody>'+(rows.join('')||'<tr><td colspan="7" style="padding:32px;text-align:center;color:var(--muted)">No teachers found in timetable. Please assign teachers in the Class Timetable page first.</td></tr>')+'</tbody></table></div>'
    +'</div>'
    +'<div style="margin-top:16px;padding:14px 18px;background:var(--surface2);border-radius:10px;border:1px solid var(--border);font-size:12.5px;color:var(--muted);line-height:1.8">'
    +'<b style="color:var(--text)">&#128161; How salary is calculated:</b><br>'
    +'&#8226; <b>Per-Period Rate</b> = Monthly Salary ÷ (Work Days × Periods/Day)<br>'
    +'&#8226; <b>Present Period</b> → Teacher earns Per-Period Rate<br>'
    +'&#8226; <b>Absent Period</b> → Deducted from teacher\'s salary<br>'
    +'&#8226; <b>Substitute Period</b> (as substitute) → Earns configured Sub Rate per period<br>'
    +'&#8226; <b>Advances</b> → Deducted from net monthly salary'
    +'</div>';
}
function salSave(teacherName){
  var k=_safeBtoa(teacherName).replace(/=/g,'');
  var mon=parseFloat((document.getElementById('sal-mon-'+k)||{}).value||0);
  var sub=parseFloat((document.getElementById('sal-sub-'+k)||{}).value||100);
  var wd=parseInt((document.getElementById('sal-wd-'+k)||{}).value||26);
  var pd=parseInt((document.getElementById('sal-pd-'+k)||{}).value||5);
  var sc=loadSalConf();
  sc[teacherName]={monthly:mon,subRate:sub,workDays:wd,periodsPerDay:pd};
  saveSalConf(sc);psSalEditId=null;render();
}
function renderAdvances(){
  var advances=loadAdvances();
  var formHTML='';
  if(psAdvForm){
    formHTML='<div class="form-panel" style="margin-bottom:20px"><div class="form-title" style="color:#8b5cf6">Record Advance / Loan</div>'
      +'<div class="form-grid g3">'
      +'<div class="form-group"><label>Staff Member *</label><input id="adv-staff" list="adv-staff-list" placeholder="Teacher name"/><datalist id="adv-staff-list">'+staff.map(function(s){return'<option>'+s.name+'</option>'}).join('')+'</datalist></div>'
      +'<div class="form-group"><label>Amount (&#8377;) *</label><input id="adv-amt" type="number" placeholder="e.g. 2000"/></div>'
      +'<div class="form-group"><label>Date</label><input id="adv-date" type="date" value="'+psDate+'"/></div>'
      +'<div class="form-group" style="grid-column:1/-1"><label>Note / Reason</label><input id="adv-note" placeholder="e.g. Medical emergency, personal need..."/></div>'
      +'</div>'
      +'<div class="form-actions"><button class="btn btn-primary" onclick="advSave()">Record Advance</button><button class="btn btn-outline" onclick="psAdvForm=false;render()">Cancel</button></div>'
    +'</div>';
  }
  var totalAdv=advances.filter(function(a){return!a.settled}).reduce(function(s,a){return s+a.amount},0);
  var rows=advances.map(function(a){
    return '<tr>'
      +'<td><div style="display:flex;align-items:center;gap:8px">'+avatarHTML(a.staffName,26)+'<b>'+esc(a.staffName)+'</b></div></td>'
      +'<td style="font-family:\'JetBrains Mono\',monospace;font-size:13px;font-weight:700;color:#8b5cf6">&#8377;'+Number(a.amount).toLocaleString()+'</td>'
      +'<td style="font-family:\'JetBrains Mono\',monospace;font-size:12px;color:var(--muted)">'+a.date+'</td>'
      +'<td style="font-size:12.5px;color:var(--muted)">'+esc(a.note||'--')+'</td>'
      +'<td>'+badge(a.settled?'Settled':'Pending',a.settled?'#16a34a':'#dc2626')+'</td>'
      +'<td style="display:flex;gap:6px;flex-wrap:wrap">'
        +(!a.settled?'<button onclick="advSettle('+parseInt(a.id,10)+')" class="btn-sm" style="background:#dcfce7;color:#16a34a">&#10003; Settle</button>':'')
        +(_isAdminOrArunkumar()?'<button onclick="advDelete('+parseInt(a.id,10)+')" class="btn-danger-sm">Remove</button>':'')
      +'</td>'
    +'</tr>';
  }).join('');
  return '<div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;align-items:center">'
    +'<div style="padding:12px 22px;background:#f5f3ff;border:1px solid #c4b5fd;border-radius:10px;font-family:\'JetBrains Mono\',monospace"><div style="font-size:11px;color:#8b5cf6;text-transform:uppercase;letter-spacing:.08em">Total Outstanding</div><div style="font-size:24px;font-weight:800;color:#8b5cf6;font-family:\'Cormorant Garamond\',serif">&#8377;'+totalAdv.toLocaleString()+'</div></div>'
    +'<button class="btn btn-primary" onclick="psAdvForm=true;render()" style="margin-left:auto">+ Record Advance</button>'
    +'</div>'
    +formHTML
    +'<div class="card"><div class="card-head"><span class="card-title">Advance / Loan Ledger</span><span style="font-family:\'JetBrains Mono\',monospace;font-size:11px;color:var(--muted)">'+advances.length+' records</span></div>'
    +'<div style="overflow-x:auto"><table><thead><tr><th>Staff</th><th>Amount</th><th>Date</th><th>Reason</th><th>Status</th><th>Action</th></tr></thead>'
    +'<tbody>'+(rows||'<tr><td colspan="6" style="padding:32px;text-align:center;color:var(--muted)">No advance records.</td></tr>')+'</tbody></table></div></div>';
}
function advSave(){
  var name=((document.getElementById('adv-staff')||{}).value||'').trim();
  var amt=parseFloat(((document.getElementById('adv-amt')||{}).value||'').trim());
  if(!name||!amt||amt<=0){alert('Staff name and valid amount required.');return}
  var advs=loadAdvances();
  advs.unshift({id:++nextId,staffName:name,amount:amt,date:(document.getElementById('adv-date')||{}).value||psDate,note:((document.getElementById('adv-note')||{}).value||'').trim(),settled:false});
  saveAdvances(advs);psAdvForm=false;render();
}
function advSettle(id){
  var advs=loadAdvances();
  advs=advs.map(function(a){return a.id===id?Object.assign({},a,{settled:true}):a});
  saveAdvances(advs);render();
}
function advDelete(id){
  if(!_isAdminOrArunkumar()){showToast('🔒 Only Admin can delete advances.','#dc2626');return;}
  if(!confirm('Delete this advance record?'))return;
  saveAdvances(loadAdvances().filter(function(a){return a.id!==id}));render();
}
function renderSalReport(){
  var teachers=getAllTeachers();
  var pa=loadPAtt();
  var sc=loadSalConf();
  var advances=loadAdvances();
  var periods=getAllActivePeriods();
  // Calculate per teacher for the selected month
  var reports=teachers.map(function(teacher){
    var conf=sc[teacher]||{monthly:0,subRate:100,workDays:26,periodsPerDay:5};
    var ppr=conf.monthly&&conf.workDays&&conf.periodsPerDay?conf.monthly/(conf.workDays*conf.periodsPerDay):0;
    var assignedCount=0,presentCount=0,absentCount=0,subAsOriginal=0,subAsSubstitute=0;
    // Scan all patt keys for this month
    Object.keys(pa).forEach(function(k){
      if(!k.startsWith(psReportMonth))return;
      var parts=k.split('|');
      if(parts.length<3)return;
      var pDate=parts[0],pId=parts[1],cKey=parts[2];
      var p=periods.find(function(x){return x.id===pId});
      if(!p)return;
      var ttCell=p[cKey];
      if(!ttCell||!ttCell.teacher)return;
      var val=pa[k]||{status:'',sub:''};
      // This teacher is the assigned teacher
      if(ttCell.teacher===teacher){
        if(val.status==='P')presentCount++;
        else if(val.status==='A')absentCount++;
        else if(val.status==='S'){subAsOriginal++;} // absent, covered by sub
        assignedCount++;
      }
      // This teacher acted as substitute
      if(val.status==='S'&&val.sub===teacher){
        subAsSubstitute++;
      }
    });
    var earnedPresent=presentCount*ppr;
    var earnedSub=subAsSubstitute*(conf.subRate||100);
    var deductAbsent=absentCount*ppr;
    var deductSubCovered=subAsOriginal*ppr; // periods where teacher was absent (sub covered)
    var grossSalary=conf.monthly||0;
    var totalDeduction=deductAbsent+deductSubCovered;
    var advanceDeduction=advances.filter(function(a){return a.staffName===teacher&&!a.settled&&a.date.startsWith(psReportMonth)}).reduce(function(s,a){return s+a.amount},0);
    var netSalary=grossSalary-totalDeduction+earnedSub-advanceDeduction;
    return{teacher,assignedCount,presentCount,absentCount,subAsOriginal,subAsSubstitute,
      grossSalary,ppr,earnedPresent,earnedSub,deductAbsent,deductSubCovered,
      totalDeduction,advanceDeduction,netSalary,conf};
  });
  var totalGross=reports.reduce(function(s,r){return s+r.grossSalary},0);
  var totalNet=reports.reduce(function(s,r){return s+r.netSalary},0);
  var totalDed=reports.reduce(function(s,r){return s+r.totalDeduction},0);
  var totalAdv=reports.reduce(function(s,r){return s+r.advanceDeduction},0);
  var rows=reports.map(function(r){
    var netColor=r.netSalary<r.grossSalary*0.8?'#dc2626':r.netSalary>=r.grossSalary?'#16a34a':'#ca8a04';
    return '<tr>'
      +'<td><div style="display:flex;align-items:center;gap:8px">'+avatarHTML(r.teacher,28)+'<div><div style="font-weight:700;font-size:13px">'+esc(r.teacher)+'</div><div style="font-size:10px;color:var(--muted);font-family:\'JetBrains Mono\',monospace">&#8377;'+r.ppr.toFixed(0)+'/period</div></div></div></td>'
      +'<td style="text-align:center"><div style="font-family:\'JetBrains Mono\',monospace;font-size:13px;font-weight:700">'+r.presentCount+'</div><div style="font-size:10px;color:var(--muted)">of '+r.assignedCount+'</div></td>'
      +'<td style="text-align:center"><div style="font-family:\'JetBrains Mono\',monospace;font-size:13px;font-weight:700;color:#dc2626">'+r.absentCount+'</div></td>'
      +'<td style="text-align:center"><div style="font-family:\'JetBrains Mono\',monospace;font-size:13px;font-weight:700;color:#ca8a04">'+r.subAsSubstitute+'</div><div style="font-size:10px;color:var(--muted)">+&#8377;'+r.earnedSub.toFixed(0)+'</div></td>'
      +'<td style="font-family:\'JetBrains Mono\',monospace;font-size:12px;color:var(--accent);text-align:right">&#8377;'+r.grossSalary.toLocaleString()+'</td>'
      +'<td style="font-family:\'JetBrains Mono\',monospace;font-size:12px;color:#dc2626;text-align:right">-&#8377;'+r.totalDeduction.toFixed(0)+'</td>'
      +'<td style="font-family:\'JetBrains Mono\',monospace;font-size:12px;color:#8b5cf6;text-align:right">'+(r.advanceDeduction?'-&#8377;'+r.advanceDeduction.toFixed(0):'--')+'</td>'
      +'<td style="font-family:\'JetBrains Mono\',monospace;font-size:14px;font-weight:800;color:'+netColor+';text-align:right">&#8377;'+r.netSalary.toFixed(0)+'</td>'
      +'<td><button onclick="showSlip(\''+esc(r.teacher)+'\')" style="background:var(--accent);color:#fff;border:none;border-radius:7px;padding:5px 10px;cursor:pointer;font-size:11px;font-family:\'Nunito\',sans-serif;font-weight:700">&#128196; Slip</button></td>'
    +'</tr>';
  }).join('');
  var summaryCards='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-bottom:20px">'
    +'<div class="stat-card" style="--c:#1a6b55"><div class="stat-label">Gross Payroll</div><div class="stat-val" style="font-size:28px">&#8377;'+Math.round(totalGross/1000)+'K</div><div class="stat-sub">'+teachers.length+' teachers</div></div>'
    +'<div class="stat-card" style="--c:#dc2626"><div class="stat-label">Total Deductions</div><div class="stat-val" style="font-size:28px">&#8377;'+Math.round(totalDed/1000)+'K</div><div class="stat-sub">Absent periods</div></div>'
    +'<div class="stat-card" style="--c:#8b5cf6"><div class="stat-label">Advances</div><div class="stat-val" style="font-size:28px">&#8377;'+Math.round(totalAdv/1000)+'K</div><div class="stat-sub">This month</div></div>'
    +'<div class="stat-card" style="--c:#16a34a"><div class="stat-label">Net Payroll</div><div class="stat-val" style="font-size:28px">&#8377;'+Math.round(totalNet/1000)+'K</div><div class="stat-sub">To be disbursed</div></div>'
    +'</div>';
  return '<div style="display:flex;gap:12px;margin-bottom:18px;align-items:center;flex-wrap:wrap">'
    +'<div style="font-size:13px;color:var(--muted);font-weight:600">Month:</div>'
    +'<input type="month" value="'+psReportMonth+'" onchange="psReportMonth=this.value;render()" style="background:var(--surface);border:1.5px solid var(--border);border-radius:9px;padding:8px 14px;font-size:13px;font-family:\'Nunito\',sans-serif;color:var(--text);outline:none"/>'
    +'</div>'
    +summaryCards
    +'<div class="card"><div class="card-head"><span class="card-title">Teacher Salary Statement -- '+psReportMonth+'</span></div>'
    +'<div style="overflow-x:auto"><table><thead><tr>'
      +'<th>Teacher</th><th style="text-align:center">Present<br>Periods</th><th style="text-align:center">Absent</th><th style="text-align:center">As Sub</th>'
      +'<th style="text-align:right">Gross</th><th style="text-align:right">Deduction</th><th style="text-align:right">Advance</th><th style="text-align:right">Net Salary</th><th>Slip</th>'
    +'</tr></thead><tbody>'+(rows||'<tr><td colspan="9" style="padding:32px;text-align:center;color:var(--muted)">No period attendance data for this month. Mark attendance in Period Attendance tab.</td></tr>')+'</tbody>'
    +'<tfoot style="background:var(--surface2);font-weight:700"><tr>'
      +'<td colspan="4" style="padding:12px 16px;font-family:\'JetBrains Mono\',monospace;font-size:12px;color:var(--muted)">TOTALS</td>'
      +'<td style="padding:12px 16px;font-family:\'JetBrains Mono\',monospace;font-size:13px;color:var(--accent);text-align:right">&#8377;'+totalGross.toLocaleString()+'</td>'
      +'<td style="padding:12px 16px;font-family:\'JetBrains Mono\',monospace;font-size:13px;color:#dc2626;text-align:right">-&#8377;'+totalDed.toFixed(0)+'</td>'
      +'<td style="padding:12px 16px;font-family:\'JetBrains Mono\',monospace;font-size:13px;color:#8b5cf6;text-align:right">-&#8377;'+totalAdv.toFixed(0)+'</td>'
      +'<td style="padding:12px 16px;font-family:\'JetBrains Mono\',monospace;font-size:14px;font-weight:800;color:#16a34a;text-align:right">&#8377;'+totalNet.toFixed(0)+'</td>'
      +'<td></td>'
    +'</tr></tfoot></table></div></div>';
}
function showSlip(teacherName){
  var pa=loadPAtt();var sc=loadSalConf();var advances=loadAdvances();var periods=getAllActivePeriods();
  var conf=sc[teacherName]||{monthly:0,subRate:100,workDays:26,periodsPerDay:5};
  var ppr=conf.monthly&&conf.workDays&&conf.periodsPerDay?conf.monthly/(conf.workDays*conf.periodsPerDay):0;
  var assignedCount=0,presentCount=0,absentCount=0,subCovered=0,subAsSubstitute=0;
  Object.keys(pa).forEach(function(k){
    if(!k.startsWith(psReportMonth))return;
    var parts=k.split('|');if(parts.length<3)return;
    var pId=parts[1],cKey=parts[2];
    var p=periods.find(function(x){return x.id===pId});if(!p)return;
    var ttCell=p[cKey];if(!ttCell||!ttCell.teacher)return;
    var val=pa[k]||{status:'',sub:''};
    if(ttCell.teacher===teacherName){assignedCount++;if(val.status==='P')presentCount++;else if(val.status==='A')absentCount++;else if(val.status==='S')subCovered++;}
    if(val.status==='S'&&val.sub===teacherName)subAsSubstitute++;
  });
  var advsThisMonth=advances.filter(function(a){return a.staffName===teacherName&&!a.settled&&a.date.startsWith(psReportMonth)});
  var advTotal=advsThisMonth.reduce(function(s,a){return s+a.amount},0);
  var grossSalary=conf.monthly||0;
  var deduction=(absentCount+subCovered)*ppr;
  var subEarning=subAsSubstitute*(conf.subRate||100);
  var netSalary=grossSalary-deduction+subEarning-advTotal;
  var w=window.open('','_blank','width=700,height=800');
  if(!w){alert('Please allow popups to view salary slip.');return}
  w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Salary Slip</title>'
    +'<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Nunito:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">'
    +'<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Nunito,sans-serif;padding:32px;background:#f4f1eb;color:#1c1a16}'
    +'.slip{background:#fff;border-radius:16px;padding:32px;max-width:600px;margin:0 auto;box-shadow:0 4px 24px rgba(0,0,0,.12)}'
    +'.header{background:#1a6b55;color:#fff;border-radius:10px;padding:18px 22px;margin-bottom:22px;text-align:center}'
    +'.hdr-title{font-family:"Cormorant Garamond",serif;font-size:22px;font-weight:700}'
    +'.hdr-sub{font-size:11px;opacity:.8;letter-spacing:.1em;font-family:"JetBrains Mono",monospace}'
    +'.row{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #e2ddd5;font-size:13.5px}'
    +'.row.total{border-bottom:none;border-top:2px solid #1a6b55;padding-top:14px;margin-top:6px;font-size:16px;font-weight:800;color:#1a6b55}'
    +'.section{margin:16px 0 6px;font-size:11px;font-weight:700;color:#7a7468;text-transform:uppercase;letter-spacing:.12em;font-family:"JetBrains Mono",monospace}'
    +'.deduct{color:#dc2626}.add{color:#16a34a}.muted{color:#7a7468}'
    +'@media print{body{padding:0;background:#fff}.slip{box-shadow:none}}<\/style><\/head><body>'
    +'<div class="slip"><div class="header"><div class="hdr-title">GUIDANCE NAVODAYA &amp; SAINIK INSTITUTE</div><div class="hdr-sub">KHANGABOK SOROK WANGMA, THOUBAL, MANIPUR</div><div style="margin-top:8px;font-size:15px;font-weight:700">SALARY SLIP &mdash; '+psReportMonth+'</div></div>'
    +'<div class="section">Employee Details</div>'
    +'<div class="row"><span>Teacher Name</span><b>'+teacherName+'</b></div>'
    +'<div class="row"><span>Month</span><b>'+psReportMonth+'</b></div>'
    +'<div class="row"><span>Per-Period Rate</span><span style="font-family:\'JetBrains Mono\',monospace">&#8377;'+ppr.toFixed(2)+'</span></div>'
    +'<div class="section">Period Summary</div>'
    +'<div class="row"><span>Total Periods Assigned</span><b>'+assignedCount+'</b></div>'
    +'<div class="row"><span>Periods Present</span><b class="add">'+presentCount+'</b></div>'
    +'<div class="row"><span>Periods Absent</span><b class="deduct">'+absentCount+'</b></div>'
    +'<div class="row"><span>Periods Covered by Substitute</span><b class="deduct">'+subCovered+'</b></div>'
    +'<div class="row"><span>Periods Done as Substitute</span><b class="add">'+subAsSubstitute+'</b></div>'
    +'<div class="section">Earnings</div>'
    +'<div class="row"><span>Gross Monthly Salary</span><span style="font-family:\'JetBrains Mono\',monospace;font-weight:700">&#8377;'+grossSalary.toLocaleString()+'</span></div>'
    +'<div class="row"><span>Substitute Earning ('+subAsSubstitute+' × &#8377;'+(conf.subRate||100)+')</span><span class="add" style="font-family:\'JetBrains Mono\',monospace">+&#8377;'+subEarning.toFixed(2)+'</span></div>'
    +'<div class="section">Deductions</div>'
    +'<div class="row"><span>Absent Deduction ('+absentCount+' periods)</span><span class="deduct" style="font-family:\'JetBrains Mono\',monospace">-&#8377;'+(absentCount*ppr).toFixed(2)+'</span></div>'
    +'<div class="row"><span>Substituted Period Deduction ('+(subCovered)+' periods)</span><span class="deduct" style="font-family:\'JetBrains Mono\',monospace">-&#8377;'+(subCovered*ppr).toFixed(2)+'</span></div>'
    +(advTotal?advsThisMonth.map(function(a){return'<div class="row"><span>Advance ('+a.date+'): '+esc(a.note||'')+'</span><span class="deduct" style="font-family:\'JetBrains Mono\',monospace">-&#8377;'+a.amount.toLocaleString()+'</span></div>'}).join(''):'')
    +'<div class="row total"><span>NET SALARY</span><span style="font-family:\'JetBrains Mono\',monospace">&#8377;'+netSalary.toFixed(2)+'</span></div>'
    +'<div style="margin-top:32px;display:flex;justify-content:space-between;font-size:12px;color:#7a7468;padding-top:16px;border-top:1px solid #e2ddd5">'
      +'<div>Prepared by: Administrator</div><div>Signature: _______________</div>'
    +'</div>'
    +'<div style="margin-top:20px;text-align:center"><button onclick="window.print()" style="background:#1a6b55;color:#fff;border:none;border-radius:8px;padding:10px 24px;cursor:pointer;font-family:Nunito,sans-serif;font-size:14px;font-weight:700">&#128424; Print Salary Slip</button></div>'
    +'</div><\/body><\/html>');
  w.document.close();
}
// ══════════════════════════════════════════════════════════════
function renderStaffSalary() {
  setTimeout(function() {
    var host = document.getElementById('gnsi-sr-host');
    if (!host) return;
    if (host.dataset.srMounted) { window.srRender && window.srRender(); return; }
    host.dataset.srMounted = '1';
    host.innerHTML = [
      '<div class="gnsi-sr-wrap">',
      '<div class="reg-wrap no-print" style="border:.5px solid var(--color-border-tertiary);border-radius:10px;overflow:hidden">',
      '  <div class="hdr">',
      '    <div class="hdr-logo"><span>GNSI</span></div>',
      '    <div>',
      '      <div style="font-size:16px;font-weight:500">'+(window.TENANT?window.TENANT.name:'Guidance Navodaya &amp; Sainik Institute')+'</div>',
      '      <div style="font-size:11px;color:#B5D4F4;margin-top:1px">Salary Register &mdash; <span id="sr-mlbl">April 2026</span> &nbsp;|&nbsp; '+(window.TENANT?window.TENANT.city+', '+window.TENANT.state:'Thoubal, Manipur')+'</div>',
      '    </div>',
      '  </div>',
      '  <div class="sbar">',
      '    <div class="sc"><div class="sl">Total staff</div><div class="sv" id="sr-sc-cnt">32</div></div>',
      '    <div class="sc"><div class="sl">Total gross</div><div class="sv" id="sr-sc-g" style="color:#0C447C">\u2014</div></div>',
      '    <div class="sc"><div class="sl">Total deductions</div><div class="sv" id="sr-sc-d" style="color:#791F1F">\u2014</div></div>',
      '    <div class="sc"><div class="sl">Net payable</div><div class="sv" id="sr-sc-n" style="color:#27500A">\u2014</div></div>',
      '  </div>',
      '  <div class="toolbar">',
      '    <label style="font-size:12px;color:var(--color-text-secondary)">Month</label>',
      '    <input type="month" id="sr-mi" value="2026-04">',
      '    <label style="font-size:12px;color:var(--color-text-secondary)">Role</label>',
      '    <select id="sr-rf"><option value="">All</option></select>',
      '    <input type="search" id="sr-si" placeholder="Search name..." style="width:130px">',
      '    <div style="margin-left:auto;display:flex;gap:6px;flex-wrap:wrap">',
      '      <button class="btn" onclick="srClearDed()">Reset deductions</button>',
      '      <button class="btn" style="background:#16A34A;color:#fff;border-color:#16A34A" onclick="srOpenAddStaff()">+ Add Staff</button>',
      '      <button class="btn btn-gold" onclick="srPrintAllSlips()">Print all slips</button>',
      '      <button class="btn btn-navy" onclick="srPrintReg()">Print register</button>',
      '    </div>',
      '  </div>',
      '  <div class="tbl-wrap">',
      '    <table>',
      '      <thead><tr>',
      '        <th style="width:32px">S.N.</th>',
      '        <th class="lft" style="min-width:150px">Staff Name</th>',
      '        <th class="lft" style="min-width:115px">Designation</th>',
      '        <th>Basic</th><th>Seniority</th><th>Loyalty</th><th>Role Bonus</th>',
      '        <th style="background:#254e91;min-width:72px">Gross</th>',
      '        <th>Advance</th><th>Late/Absent</th>',
      '        <th style="background:#7B3A00;min-width:72px">Admin Ded.</th>',
      '        <th style="background:#6B1111;min-width:72px">Total Ded.</th>',
      '        <th style="background:#1A5C1A;min-width:72px">Net Salary</th>',
      '        <th style="width:48px">Slip</th>',
      '        <th style="width:60px">Actions</th>',
      '      </tr></thead>',
      '      <tbody id="sr-tb"></tbody>',
      '      <tfoot><tr id="sr-fr"></tr></tfoot>',
      '    </table>',
      '  </div>',
      '  <div class="legend">',
      '    <span><span class="ld" style="background:#E6F1FB;border:.5px solid #185FA5"></span>Gross</span>',
      '    <span><span class="ld" style="background:#FFFBEB;border:.5px solid #C8960C"></span>Admin deduction</span>',
      '    <span><span class="ld" style="background:#FCEBEB;border:.5px solid #A32D2D"></span>Total deductions</span>',
      '    <span><span class="ld" style="background:#EAF3DE;border:.5px solid #3B6D11"></span>Net salary</span>',
      '  </div>',
      '</div>',
      '<div id="gnsi-sr-slip-pages"></div>',
      '</div>'
    ].join('');
    /* ── Default staff list — empty, populated from Supabase after login ── */
    var SR_STAFF_DEFAULT=[];
    /* ── Persist helpers ────────────────────────────────────── */
    function srSaveStaff(){
      try{ localStorage.setItem('gnsi_sr_staff', JSON.stringify(SR_STAFF)); }catch(e){}
      if(typeof gnsiKVPush==='function') gnsiKVPush('gnsi_sr_staff', SR_STAFF);
    }
    function srSaveDed(){
      try{ localStorage.setItem('gnsi_sr_ded', JSON.stringify(srDed)); }catch(e){}
      if(typeof gnsiKVPush==='function') gnsiKVPush('gnsi_sr_ded', srDed);
    }
    function srLoadStaff(){
      try{ var v=localStorage.getItem('gnsi_sr_staff'); if(v) return JSON.parse(v); }catch(e){}
      return null;
    }
    function srLoadDed(){
      try{ var v=localStorage.getItem('gnsi_sr_ded'); if(v) return JSON.parse(v); }catch(e){}
      return null;
    }
    /* ── Load persisted data or fall back to defaults ────────── */
    var SR_STAFF = srLoadStaff() || SR_STAFF_DEFAULT;
    var srDed=(function(){
      var saved=srLoadDed()||{};
      var d={};
      SR_STAFF.forEach(function(s){
        d[s[0]]=saved[s[0]]||{adv:0,late:0,admin:0};
      });
      return d;
    })();
    var srFp=function(v){return '\u20b9'+Math.round(v).toLocaleString('en-IN');};
    var srFh=function(v){return '&#8377;'+Math.round(v).toLocaleString('en-IN');};
    var srRoles=[...new Set(SR_STAFF.map(function(s){return s[2];}))].sort();
    var srRsel=document.getElementById('sr-rf');
    srRoles.forEach(function(r){var o=document.createElement('option');o.value=r;o.textContent=r;srRsel.appendChild(o);});
    var srGross=function(s){return s[3]+s[4]+s[5]+s[6];};
    window.srRender=function(){
      var rf=document.getElementById('sr-rf').value;
      var q=document.getElementById('sr-si').value.toLowerCase();
      var tb=document.getElementById('sr-tb');
      tb.innerHTML='';
      var tG=0,tA=0,tL=0,tAd=0,tN=0,cnt=0;
      SR_STAFF.forEach(function(s){
        if(rf&&s[2]!==rf)return;
        if(q&&!s[1].toLowerCase().includes(q)&&!s[2].toLowerCase().includes(q))return;
        var sn=s[0],g=srGross(s),d=srDed[sn],td=d.adv+d.late+d.admin,nv=g-td;
        tG+=g;tA+=d.adv;tL+=d.late;tAd+=d.admin;tN+=nv;cnt++;
        var tr=document.createElement('tr');
        tr.innerHTML='<td>'+sn+'</td>'
          +'<td class="lft nm">'+s[1]+'</td>'
          +'<td class="lft"><span class="rb">'+s[2]+'</span></td>'
          +'<td>'+srFh(s[3])+'</td>'
          +'<td>'+(s[4]?srFh(s[4]):'&mdash;')+'</td>'
          +'<td>'+(s[5]?srFh(s[5]):'&mdash;')+'</td>'
          +'<td>'+(s[6]?srFh(s[6]):'&mdash;')+'</td>'
          +'<td class="earn">'+srFh(g)+'</td>'
          +'<td><input class="inp" type="number" min="0" value="'+d.adv+'" onchange="srSetD('+sn+',\'adv\',this.value)"></td>'
          +'<td><input class="inp" type="number" min="0" value="'+d.late+'" onchange="srSetD('+sn+',\'late\',this.value)"></td>'
          +'<td><input class="inp ia" type="number" min="0" value="'+d.admin+'" onchange="srSetD('+sn+',\'admin\',this.value)"></td>'
          +'<td class="dtot">'+(td?srFh(td):'&mdash;')+'</td>'
          +'<td class="nett">'+srFh(nv)+'</td>'
          +'<td><button class="btn" style="padding:2px 7px;font-size:11px" onclick="srShowModal('+sn+')">Slip</button></td>'
          +'<td><div style="display:flex;gap:3px;justify-content:center">'
          +'<button class="btn" style="padding:2px 6px;font-size:10px;background:#FEF3C7;border-color:#D97706;color:#92400E" onclick="srOpenEditStaff('+sn+')">\u270f</button>'
          +'<button class="btn" style="padding:2px 6px;font-size:10px;background:#FEE2E2;border-color:#DC2626;color:#991B1B" onclick="srRemoveStaff('+sn+')">\u2715</button>'
          +'</div></td>';
        tb.appendChild(tr);
      });
      var fr=document.getElementById('sr-fr');
      fr.innerHTML='<td colspan="3" class="lft">Total \u2014 '+cnt+' staff</td>'
        +'<td></td><td></td><td></td><td></td>'
        +'<td>'+srFh(tG)+'</td><td>'+srFh(tA)+'</td><td>'+srFh(tL)+'</td><td>'+srFh(tAd)+'</td>'
        +'<td>'+srFh(tA+tL+tAd)+'</td><td>'+srFh(tN)+'</td><td></td><td></td>';
      document.getElementById('sr-sc-cnt').textContent=cnt;
      document.getElementById('sr-sc-g').innerHTML=srFh(tG);
      document.getElementById('sr-sc-d').innerHTML=srFh(tA+tL+tAd);
      document.getElementById('sr-sc-n').innerHTML=srFh(tN);
      srBuildPages();
    };
    window.srSetD=function(sn,t,v){srDed[sn][t]=Math.max(0,parseInt(v)||0);srSaveDed();srRender();};
    window.srClearDed=function(){SR_STAFF.forEach(function(s){srDed[s[0]]={adv:0,late:0,admin:0};});srSaveDed();srRender();};
    document.getElementById('sr-rf').onchange=window.srRender;
    document.getElementById('sr-si').oninput=function(){searchDebounce('srRender',window.srRender);};
    document.getElementById('sr-mi').onchange=function(){
      var parts=this.value.split('-');
      document.getElementById('sr-mlbl').textContent=new Date(parts[0],parts[1]-1,1).toLocaleString('default',{month:'long',year:'numeric'});
      window.srRender();
    };
    function srGetMonth(){return document.getElementById('sr-mlbl').textContent;}
    function srSlipHTML(sn,copy){
      var s=SR_STAFF.find(function(x){return x[0]===sn;});
      var d=srDed[sn],g=srGross(s),td=d.adv+d.late+d.admin,nv=g-td;
      var mo=srGetMonth();
      var ini=s[1].split(' ').map(function(w){return w[0];}).join('').substring(0,2).toUpperCase();
      var isOffice=copy==='office';
      var ctag=isOffice?'OFFICE COPY':'STAFF COPY';
      var cclr=isOffice?'#6B1A1A':'#0C447C';
      var cbg=isOffice?'#FCEBEB':'#E6F1FB';
      var erow=function(el,ev,dl,dv,dspecial){
        var ed=ev?srFp(ev):'\u2014';
        var dd=dv!=null?(dv?srFp(dv):'\u2014'):'';
        return '<tr>'
          +'<td style="padding:9px 12px;border-bottom:.5px solid #EEF2FA;font-size:12px;color:#334;text-align:left">'+el+'</td>'
          +'<td style="padding:9px 12px;border-bottom:.5px solid #EEF2FA;font-size:12px;font-weight:600;color:#185FA5;text-align:right;border-right:2px solid #C5D8F5">'+ed+'</td>'
          +'<td style="padding:9px 12px;border-bottom:.5px solid #FCEAEA;font-size:12px;color:#555;text-align:left;background:'+(dspecial?'#FFFBEB':'#fff')+'">'+(dl||'')+'</td>'
          +'<td style="padding:9px 12px;border-bottom:.5px solid #FCEAEA;font-size:12px;font-weight:600;color:'+(dspecial?'#B8860B':'#A32D2D')+';text-align:right;background:'+(dspecial?'#FFFBEB':'#fff')+'">'+dd+'</td>'
          +'</tr>';
      };
      return '<div style="width:100%;height:100%;background:#fff;border:2px solid #1B3A6B;border-radius:6px;overflow:hidden;font-family:Arial,sans-serif;color:#222;display:flex;flex-direction:column">'
        +'<table style="width:100%;border-collapse:collapse;flex-shrink:0"><tr>'
        +'<td style="background:#1B3A6B;padding:10px 14px;width:50px"><div style="width:36px;height:36px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center"><span style="font-size:9px;font-weight:700;color:#1B3A6B">GNSI</span></div></td>'
        +'<td style="background:#1B3A6B;padding:10px 12px"><div style="font-size:15px;font-weight:700;color:#fff;letter-spacing:.3px">'+(window.TENANT?window.TENANT.name:'Guidance Navodaya &amp; Sainik Institute')+'</div><div style="font-size:10px;color:#B5D4F4;margin-top:2px">'+(window.TENANT?window.TENANT.address:'Khangabok Sorok Wangma, Thoubal, Manipur')+'</div></td>'
        +'<td style="background:#1B3A6B;padding:10px 14px;text-align:right;white-space:nowrap"><div style="background:'+cbg+';color:'+cclr+';font-size:10px;font-weight:700;padding:3px 10px;border-radius:10px;display:inline-block;letter-spacing:.5px">'+ctag+'</div><div style="font-size:10px;color:#B5D4F4;margin-top:4px">SALARY SLIP &bull; '+mo+'</div></td>'
        +'</tr></table>'
        +'<div style="background:#EEF4FF;border-bottom:1px solid #C5D8F5;padding:8px 14px;display:flex;align-items:center;gap:12px;flex-shrink:0">'
        +'<div style="width:38px;height:38px;border-radius:50%;background:#1B3A6B;display:flex;align-items:center;justify-content:center;flex-shrink:0"><span style="font-size:13px;font-weight:700;color:#fff">'+ini+'</span></div>'
        +'<div style="flex:1"><div style="font-size:15px;font-weight:700;color:#1B3A6B;line-height:1.2">'+s[1]+'</div><div style="font-size:11px;color:#3A5A9B;margin-top:2px">'+s[2]+'</div></div>'
        +'<div style="text-align:right"><div style="font-size:10px;color:#5A7AB5">Employee No.</div><div style="font-size:14px;font-weight:700;color:#1B3A6B">GNSI-'+String(sn).padStart(3,'0')+'</div></div>'
        +'</div>'
        +'<table style="width:100%;border-collapse:collapse;flex:1"><thead><tr>'
        +'<th colspan="2" style="background:#1B3A6B;color:#fff;font-size:11px;font-weight:700;padding:7px 12px;text-align:center;letter-spacing:.5px;border-right:2px solid #C5D8F5">EARNINGS</th>'
        +'<th colspan="2" style="background:#7B1F1F;color:#fff;font-size:11px;font-weight:700;padding:7px 12px;text-align:center;letter-spacing:.5px">DEDUCTIONS</th>'
        +'</tr></thead><tbody>'
        +erow('Basic Pay',s[3],'Advance',d.adv,false)
        +erow('Seniority Allow.',s[4],'Late / Absent',d.late,false)
        +erow('Loyalty Bonus',s[5],'Admin Deduction',d.admin,true)
        +erow('Role Bonus',s[6],'',null,false)
        +'</tbody></table>'
        +'<table style="width:100%;border-collapse:collapse;border-top:1px solid #C5D8F5;flex-shrink:0"><tr>'
        +'<td style="background:#E6F1FB;padding:10px 12px;text-align:center;width:33%"><div style="font-size:10px;color:#185FA5;font-weight:700;letter-spacing:.3px">GROSS EARNINGS</div><div style="font-size:20px;font-weight:700;color:#0C447C">'+srFp(g)+'</div></td>'
        +'<td style="background:#fff;padding:10px 12px;text-align:center;width:33%;border:1px solid #FCEBEB"><div style="font-size:10px;color:#A32D2D;font-weight:700;letter-spacing:.3px">TOTAL DEDUCTIONS</div><div style="border-bottom:1.5px solid #333;min-height:28px;margin-top:6px"></div><div style="font-size:8px;color:#aaa;margin-top:3px;font-style:italic">Administrator to fill</div></td>'
        +'<td style="background:#fff;padding:10px 12px;text-align:center;width:34%;border:1.5px solid #1B3A6B"><div style="font-size:10px;color:#1B3A6B;font-weight:700;letter-spacing:.3px">NET SALARY PAYABLE</div><div style="border-bottom:1.5px solid #333;min-height:28px;margin-top:6px"></div><div style="font-size:8px;color:#aaa;margin-top:3px;font-style:italic">Administrator to fill</div></td>'
        +'</tr></table>'
        +'<table style="width:100%;border-collapse:collapse;border-top:1px solid #C5D8F5;flex-shrink:0"><tr>'
        +'<td style="padding:8px 12px;background:#fff"><div style="font-size:9px;font-weight:700;color:#B8860B;letter-spacing:.4px;margin-bottom:4px">APPRAISAL / REMARKS BY FOUNDER</div><div style="border-bottom:1.5px solid #333;min-height:28px;width:100%"></div><div style="font-size:8px;color:#aaa;margin-top:3px;font-style:italic">Founder to fill</div></td>'
        +'</tr></table>'
        +'<table style="width:100%;border-collapse:collapse;flex-shrink:0"><tr>'
        +'<td style="padding:12px 10px;text-align:center;font-size:10px;color:#666;border-right:.5px solid #EEF2FA;border-top:1.5px solid #bbb;width:33%">Staff Signature</td>'
        +'<td style="padding:12px 10px;text-align:center;font-size:10px;color:#666;border-right:.5px solid #EEF2FA;border-top:1.5px solid #bbb;width:33%">Accountant</td>'
        +'<td style="padding:12px 10px;text-align:center;font-size:10px;color:#666;border-top:1.5px solid #bbb;width:34%">Principal / Administrator</td>'
        +'</tr></table>'
        +'</div>';
    }
    function srBuildPages(){
      var container=document.getElementById('gnsi-sr-slip-pages');
      container.innerHTML='';
      window._srPgMap={};
      SR_STAFF.forEach(function(s){
        var page=document.createElement('div');
        page.className='slip-a4-page';
        page.id='sr-pg-'+s[0];
        page.innerHTML='<div class="slip-half"><div class="slip-copy">'+srSlipHTML(s[0],'office')+'</div></div>'
          +'<div class="slip-cutline">\u2702 CUT HERE</div>'
          +'<div class="slip-half"><div class="slip-copy">'+srSlipHTML(s[0],'staff')+'</div></div>';
        container.appendChild(page);
        window._srPgMap[s[0]]='sr-pg-'+s[0];
      });
    }
    window.srShowModal=function(sn){
      var old=document.getElementById('sr-slip-overlay');if(old)old.remove();
      var ov=document.createElement('div');
      ov.id='sr-slip-overlay';
      ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px';
      ov.innerHTML='<div style="background:var(--color-background-primary);border-radius:12px;width:min(580px,100%);max-height:90vh;overflow-y:auto">'
        +'<div style="background:#1B3A6B;color:#fff;padding:10px 16px;border-radius:12px 12px 0 0;display:flex;align-items:center;justify-content:space-between">'
        +'<span style="font-size:13px;font-weight:500">Salary Slip Preview</span>'
        +'<div style="display:flex;gap:7px;align-items:center">'
        +'<button class="btn btn-gold" style="font-size:11px;padding:3px 11px" onclick="srPrintOne('+sn+')">Print A4</button>'
        +'<button style="background:none;border:none;color:#fff;font-size:20px;cursor:pointer;line-height:1" onclick="document.getElementById(\'sr-slip-overlay\').remove()">&times;</button>'
        +'</div></div>'
        +'<div style="padding:14px;display:flex;flex-direction:column;gap:10px;background:#F2F4F8">'
        +srSlipHTML(sn,'office')
        +'<div style="border-top:1.5px dashed #999;padding:4px 0;text-align:center;font-size:8px;color:#aaa;letter-spacing:2px">CUT HERE</div>'
        +srSlipHTML(sn,'staff')
        +'</div></div>';
      ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
      document.body.appendChild(ov);
    };
    function srHideAllPages(){document.querySelectorAll('.slip-a4-page').forEach(function(p){p.classList.remove('printing');});}
    function srShowAllPages(){document.querySelectorAll('.slip-a4-page').forEach(function(p){p.classList.add('printing');});}
    window.srPrintOne=function(sn){
      var old=document.getElementById('sr-slip-overlay');if(old)old.remove();
      srHideAllPages();
      var rw=document.querySelector('.gnsi-sr-wrap .reg-wrap');if(rw)rw.classList.remove('printing');
      var pgId=window._srPgMap&&window._srPgMap[sn];
      var pg=pgId?document.getElementById(pgId):null;
      if(pg){pg.classList.add('printing');}
      setTimeout(function(){window.print();setTimeout(srHideAllPages,1200);},80);
    };
    window.srPrintAllSlips=function(){
      var rw=document.querySelector('.gnsi-sr-wrap .reg-wrap');if(rw)rw.classList.remove('printing');
      srShowAllPages();
      setTimeout(function(){window.print();setTimeout(srHideAllPages,1500);},80);
    };
    window.srPrintReg=function(){
      srHideAllPages();
      var rw=document.querySelector('.gnsi-sr-wrap .reg-wrap');
      if(rw){rw.classList.add('printing');window.print();rw.classList.remove('printing');}
    };
    function srRefreshRoleDropdown(){
      var roles=[...new Set(SR_STAFF.map(function(s){return s[2];}))].sort();
      var rsel=document.getElementById('sr-rf');
      var cur=rsel.value;
      rsel.innerHTML='<option value="">All</option>';
      roles.forEach(function(r){var o=document.createElement('option');o.value=r;o.textContent=r;rsel.appendChild(o);});
      rsel.value=roles.includes(cur)?cur:'';
    }
    function srStaffFormHTML(s){
      var v=function(i,label,val,type){
        type=type||'text';
        return '<div style="display:flex;flex-direction:column;gap:3px">'
          +'<label style="font-size:11px;color:var(--color-text-secondary);font-weight:500">'+label+'</label>'
          +'<input id="srf-'+i+'" type="'+type+'" value="'+(val||'')+'" style="padding:6px 9px;border:.5px solid var(--color-border-tertiary);border-radius:6px;font-size:12px;background:var(--color-background-primary);color:var(--color-text-primary)">'
          +'</div>';
      };
      return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
        +v('name','Full Name',s?s[1]:'')
        +v('role','Designation',s?s[2]:'')
        +v('basic','Basic Pay',s?s[3]:0,'number')
        +v('sen','Seniority Allowance',s?s[4]:0,'number')
        +v('loy','Loyalty Bonus',s?s[5]:0,'number')
        +v('rb','Role Bonus',s?s[6]:0,'number')
        +'</div>';
    }
    function srFVal(id){return document.getElementById('srf-'+id).value.trim();}
    function srFNum(id){return Math.max(0,parseInt(document.getElementById('srf-'+id).value)||0);}
    window.srOpenAddStaff=function(){
      var old=document.getElementById('sr-staff-modal');if(old)old.remove();
      var m=document.createElement('div');
      m.id='sr-staff-modal';
      m.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px';
      m.innerHTML='<div style="background:var(--color-background-primary);border-radius:12px;width:min(520px,100%);max-height:90vh;overflow-y:auto">'
        +'<div style="background:#16A34A;color:#fff;padding:10px 16px;border-radius:12px 12px 0 0;display:flex;align-items:center;justify-content:space-between">'
        +'<span style="font-size:13px;font-weight:600">\u2795 Add New Staff</span>'
        +'<button style="background:none;border:none;color:#fff;font-size:20px;cursor:pointer" onclick="document.getElementById(\'sr-staff-modal\').remove()">&times;</button>'
        +'</div>'
        +'<div style="padding:16px;display:flex;flex-direction:column;gap:12px">'
        +srStaffFormHTML(null)
        +'<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:4px">'
        +'<button class="btn" onclick="document.getElementById(\'sr-staff-modal\').remove()">Cancel</button>'
        +'<button class="btn" style="background:#16A34A;color:#fff;border-color:#16A34A" onclick="srSaveAddStaff()">Add Staff</button>'
        +'</div></div></div>';
      m.addEventListener('click',function(e){if(e.target===m)m.remove();});
      document.body.appendChild(m);
    };
    window.srSaveAddStaff=function(){
      var name=srFVal('name'),role=srFVal('role');
      if(!name||!role){alert('Name and Designation are required.');return;}
      var newId=SR_STAFF.length?Math.max.apply(null,SR_STAFF.map(function(s){return s[0];}))+1:1;
      SR_STAFF.push([newId,name,role,srFNum('basic'),srFNum('sen'),srFNum('loy'),srFNum('rb')]);
      srDed[newId]={adv:0,late:0,admin:0};
      srSaveStaff();srSaveDed();
      document.getElementById('sr-staff-modal').remove();
      srRefreshRoleDropdown();
      window.srRender();
    };
    window.srOpenEditStaff=function(sn){
      var s=SR_STAFF.find(function(x){return x[0]===sn;});if(!s)return;
      var old=document.getElementById('sr-staff-modal');if(old)old.remove();
      var m=document.createElement('div');
      m.id='sr-staff-modal';
      m.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px';
      m.innerHTML='<div style="background:var(--color-background-primary);border-radius:12px;width:min(520px,100%);max-height:90vh;overflow-y:auto">'
        +'<div style="background:#B8860B;color:#fff;padding:10px 16px;border-radius:12px 12px 0 0;display:flex;align-items:center;justify-content:space-between">'
        +'<span style="font-size:13px;font-weight:600">\u270f Edit Staff \u2014 '+s[1]+'</span>'
        +'<button style="background:none;border:none;color:#fff;font-size:20px;cursor:pointer" onclick="document.getElementById(\'sr-staff-modal\').remove()">&times;</button>'
        +'</div>'
        +'<div style="padding:16px;display:flex;flex-direction:column;gap:12px">'
        +srStaffFormHTML(s)
        +'<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:4px">'
        +'<button class="btn" onclick="document.getElementById(\'sr-staff-modal\').remove()">Cancel</button>'
        +'<button class="btn btn-gold" onclick="srSaveEditStaff('+sn+')">Save Changes</button>'
        +'</div></div></div>';
      m.addEventListener('click',function(e){if(e.target===m)m.remove();});
      document.body.appendChild(m);
    };
    window.srSaveEditStaff=function(sn){
      var name=srFVal('name'),role=srFVal('role');
      if(!name||!role){alert('Name and Designation are required.');return;}
      var idx=SR_STAFF.findIndex(function(x){return x[0]===sn;});
      SR_STAFF[idx]=[sn,name,role,srFNum('basic'),srFNum('sen'),srFNum('loy'),srFNum('rb')];
      srSaveStaff();
      document.getElementById('sr-staff-modal').remove();
      srRefreshRoleDropdown();
      window.srRender();
    };
    window.srRemoveStaff=function(sn){
      var s=SR_STAFF.find(function(x){return x[0]===sn;});if(!s)return;
      if(!confirm('Remove "'+s[1]+'" from the register? This cannot be undone.'))return;
      var idx=SR_STAFF.findIndex(function(x){return x[0]===sn;});
      SR_STAFF.splice(idx,1);
      delete srDed[sn];
      srSaveStaff();srSaveDed();
      srRefreshRoleDropdown();
      window.srRender();
    };
    window.srRender();
  }, 50);
  return '<div id="gnsi-sr-host"></div>';
}
/* Register in PAGE_MAP + register KV keys */
(function(){
  function wire(){
    if(typeof _PAGE_MAP==='undefined'||!_PAGE_MAP){setTimeout(wire,200);return;}
    _PAGE_MAP['staffsalary']=renderStaffSalary;
  }
  setTimeout(wire,300);
  if(typeof GNSI_KV_KEYS!=='undefined'){
    ['gnsi_sr_staff','gnsi_sr_ded'].forEach(function(k){
      if(GNSI_KV_KEYS.indexOf(k)<0) GNSI_KV_KEYS.push(k);
    });
  }
})();

/* ══════════════════════════════════════════════════════════════
   HOSTEL MANAGEMENT -- Leave · Sick · Outpass · Outing · Present · Activities · Complaints
   ══════════════════════════════════════════════════════════════*/
/* -- DATA HELPERS -------------------------------------------- */
function hmLoad(key){ try{var s=localStorage.getItem('gnsi_hm_'+key);if(s)return JSON.parse(s);}catch(e){}return []; }
function hmSave(key,arr){ localStorage.setItem('gnsi_hm_'+key,JSON.stringify(arr));if(typeof gnsiKVPush==='function')gnsiKVPush('gnsi_hm_'+key,arr); }
function hmNextId(arr){ return arr.length?Math.max.apply(null,arr.map(function(x){return x.id||0}))+1:1; }
function hmDate(){ return new Date().toISOString().slice(0,10); }
function hmFmt(d){ if(!d)return '-'; var p=d.split('-'); return p[2]+'/'+p[1]+'/'+p[0]; }
function hmStudentOptions(sel){
  var opts='<option value="">-- Select Student --</option>';
  students.forEach(function(s){ opts+='<option value="'+parseInt(s.id,10)+'"'+(sel==s.id?' selected':'')+'>'+esc(s.name)+' ('+esc(s.cls)+')</option>'; });
  return opts;
}
function hmHouseOptions(sel){
  var houses=['KOMBIREI','LOKTAK','SINGAREI','KANGLA','KOUBRU','SHIROI','SANGAI','SANAREI','NONGIN','DAY BOARDING'];
  return houses.map(function(h){return '<option value="'+h+'"'+(sel===h?' selected':'')+'>'+h+'</option>';}).join('');
}
function hmStatusBadge(s){
  var colors={Pending:'#f59e0b',Approved:'#16a34a',Rejected:'#dc2626',Returned:'#3b78c9',Active:'#16a34a',Resolved:'#16a34a',Open:'#f59e0b',Closed:'#6b7280',Present:'#16a34a',Absent:'#dc2626',Sick:'#f59e0b',Leave:'#3b78c9',Outpass:'#8b5cf6',Outing:'#0891b2'};
  return '<span style="padding:2px 9px;border-radius:12px;font-size:10.5px;font-weight:700;background:'+(colors[s]||'#94a3b8')+'22;color:'+(colors[s]||'#64748b')+';border:1px solid '+(colors[s]||'#94a3b8')+'44">'+s+'</span>';
}
var hostelTab='leave';
function setHostelTab(t){ hostelTab=t; hmSearchQ=''; render(); }
/* Student search query per hostel sub-section */
var hmSearchQ='';
function hmSetSearch(v){ hmSearchQ=v; render(); }
function hmSearchBar(tab){
  return '<div style="display:flex;align-items:center;gap:8px;margin-left:auto">'
    +'<div style="position:relative;display:flex;align-items:center">'
    +'<span style="position:absolute;left:9px;font-size:14px;pointer-events:none;color:var(--muted)">🔍</span>'
    +'<input id="hm-search-'+tab+'" type="text" placeholder="Search student…" value="'+esc(hmSearchQ)+'" '
    +'oninput="hmSetSearch(this.value)" '
    +'style="padding:6px 10px 6px 30px;border-radius:8px;border:1.5px solid var(--border);font-size:12.5px;width:200px;background:var(--surface);color:var(--text)"/>'
    +(hmSearchQ?'<button onclick="hmSetSearch(\'\')" title="Clear" style="position:absolute;right:7px;background:none;border:none;cursor:pointer;font-size:13px;color:var(--muted);padding:0;line-height:1">✕</button>':'')
    +'</div></div>';
}
function hmFilterRows(rows, data, stuField){
  if(!hmSearchQ) return rows;
  var q=hmSearchQ.toLowerCase();
  return rows.filter(function(_,i){
    var r=data[data.length-1-i]; // reversed
    var stu=students.find(function(s){return s.id==r[stuField];});
    var name=(stu?stu.name:(r.stuName||'')).toLowerCase();
    var cls=(stu?stu.cls:'').toLowerCase();
    return name.indexOf(q)>=0||cls.indexOf(q)>=0;
  });
}
/* -- MAIN RENDER --------------------------------------------- */
/* ═══════════════════════════════════════════════════════════════
   KITCHEN & STOCK MANAGEMENT MODULE  -- GNSI v20
   Tabs: Stock Items | Kitchen Menu | Daily Stock | Stock Log
═══════════════════════════════════════════════════════════════ */
var kitchenTab = 'stock';
/* -- KITCHEN SEED DATA --------------------------------------- */
var KIT_STOCK_SEED = [
  /* GRAINS & CEREALS */
  {id:1,  name:'Rice (Basmati)',         category:'Grains & Cereals',     qty:50,  unit:'kg',      minQty:10, rate:65,   supplier:'Local Market', expiry:'', notes:'Premium basmati',         addedOn:'2025-01-01'},
  {id:2,  name:'Rice (Regular)',         category:'Grains & Cereals',     qty:100, unit:'kg',      minQty:20, rate:40,   supplier:'Local Market', expiry:'', notes:'Daily cooking rice',       addedOn:'2025-01-01'},
  {id:3,  name:'Wheat Flour (Atta)',     category:'Grains & Cereals',     qty:40,  unit:'kg',      minQty:10, rate:35,   supplier:'Local Market', expiry:'', notes:'',                        addedOn:'2025-01-01'},
  {id:4,  name:'Maida (Refined Flour)',  category:'Grains & Cereals',     qty:20,  unit:'kg',      minQty:5,  rate:38,   supplier:'Local Market', expiry:'', notes:'',                        addedOn:'2025-01-01'},
  {id:5,  name:'Semolina (Suji/Rava)',   category:'Grains & Cereals',     qty:10,  unit:'kg',      minQty:3,  rate:42,   supplier:'Local Market', expiry:'', notes:'',                        addedOn:'2025-01-01'},
  {id:6,  name:'Poha (Flattened Rice)',  category:'Grains & Cereals',     qty:8,   unit:'kg',      minQty:2,  rate:50,   supplier:'Local Market', expiry:'', notes:'',                        addedOn:'2025-01-01'},
  {id:7,  name:'Oats',                   category:'Grains & Cereals',     qty:5,   unit:'kg',      minQty:2,  rate:120,  supplier:'Grocery Store',expiry:'', notes:'Breakfast',                addedOn:'2025-01-01'},
  {id:8,  name:'Bread',                  category:'Bakery',               qty:10,  unit:'packets', minQty:3,  rate:40,   supplier:'Bakery',       expiry:'', notes:'Fresh daily',              addedOn:'2025-01-01'},
  /* PULSES & LENTILS */
  {id:9,  name:'Toor Dal (Arhar)',        category:'Pulses & Lentils',    qty:20,  unit:'kg',      minQty:5,  rate:130,  supplier:'Local Market', expiry:'', notes:'',                        addedOn:'2025-01-01'},
  {id:10, name:'Moong Dal',               category:'Pulses & Lentils',    qty:15,  unit:'kg',      minQty:4,  rate:120,  supplier:'Local Market', expiry:'', notes:'',                        addedOn:'2025-01-01'},
  {id:11, name:'Chana Dal',               category:'Pulses & Lentils',    qty:10,  unit:'kg',      minQty:3,  rate:95,   supplier:'Local Market', expiry:'', notes:'',                        addedOn:'2025-01-01'},
  {id:12, name:'Masoor Dal (Red Lentil)', category:'Pulses & Lentils',    qty:10,  unit:'kg',      minQty:3,  rate:105,  supplier:'Local Market', expiry:'', notes:'',                        addedOn:'2025-01-01'},
  {id:13, name:'Urad Dal',                category:'Pulses & Lentils',    qty:8,   unit:'kg',      minQty:2,  rate:140,  supplier:'Local Market', expiry:'', notes:'',                        addedOn:'2025-01-01'},
  {id:14, name:'Rajma (Kidney Beans)',    category:'Pulses & Lentils',    qty:8,   unit:'kg',      minQty:2,  rate:145,  supplier:'Local Market', expiry:'', notes:'',                        addedOn:'2025-01-01'},
  {id:15, name:'Chole (Chickpeas)',       category:'Pulses & Lentils',    qty:8,   unit:'kg',      minQty:2,  rate:100,  supplier:'Local Market', expiry:'', notes:'',                        addedOn:'2025-01-01'},
  {id:16, name:'Black-Eyed Peas (Lobia)',category:'Pulses & Lentils',    qty:5,   unit:'kg',      minQty:2,  rate:90,   supplier:'Local Market', expiry:'', notes:'',                        addedOn:'2025-01-01'},
  /* OILS & FATS */
  {id:17, name:'Sunflower Oil',           category:'Oils & Fats',         qty:20,  unit:'litre',   minQty:5,  rate:130,  supplier:'Grocery Store',expiry:'', notes:'Refined',                 addedOn:'2025-01-01'},
  {id:18, name:'Mustard Oil',             category:'Oils & Fats',         qty:10,  unit:'litre',   minQty:3,  rate:155,  supplier:'Grocery Store',expiry:'', notes:'Pure mustard',            addedOn:'2025-01-01'},
  {id:19, name:'Ghee (Clarified Butter)', category:'Oils & Fats',         qty:5,   unit:'kg',      minQty:1,  rate:520,  supplier:'Dairy Supplier',expiry:'',notes:'',                        addedOn:'2025-01-01'},
  {id:20, name:'Coconut Oil',             category:'Oils & Fats',         qty:3,   unit:'litre',   minQty:1,  rate:200,  supplier:'Grocery Store',expiry:'', notes:'',                        addedOn:'2025-01-01'},
  /* SPICES & CONDIMENTS */
  {id:21, name:'Salt (Iodised)',          category:'Spices & Condiments', qty:10,  unit:'kg',      minQty:2,  rate:18,   supplier:'Local Market', expiry:'', notes:'',                        addedOn:'2025-01-01'},
  {id:22, name:'Red Chilli Powder',       category:'Spices & Condiments', qty:3,   unit:'kg',      minQty:0.5,rate:280,  supplier:'Spice Shop',   expiry:'', notes:'',                        addedOn:'2025-01-01'},
  {id:23, name:'Turmeric Powder (Haldi)', category:'Spices & Condiments', qty:2,   unit:'kg',      minQty:0.5,rate:220,  supplier:'Spice Shop',   expiry:'', notes:'',                        addedOn:'2025-01-01'},
  {id:24, name:'Coriander Powder (Dhaniya)',category:'Spices & Condiments',qty:2,  unit:'kg',      minQty:0.5,rate:200,  supplier:'Spice Shop',   expiry:'', notes:'',                        addedOn:'2025-01-01'},
  {id:25, name:'Cumin Seeds (Jeera)',     category:'Spices & Condiments', qty:1.5, unit:'kg',      minQty:0.3,rate:350,  supplier:'Spice Shop',   expiry:'', notes:'',                        addedOn:'2025-01-01'},
  {id:26, name:'Mustard Seeds (Rai)',     category:'Spices & Condiments', qty:1,   unit:'kg',      minQty:0.2,rate:200,  supplier:'Spice Shop',   expiry:'', notes:'',                        addedOn:'2025-01-01'},
  {id:27, name:'Garam Masala',            category:'Spices & Condiments', qty:1,   unit:'kg',      minQty:0.2,rate:500,  supplier:'Spice Shop',   expiry:'', notes:'',                        addedOn:'2025-01-01'},
  {id:28, name:'Black Pepper (Kali Mirch)',category:'Spices & Condiments',qty:0.5, unit:'kg',      minQty:0.1,rate:650,  supplier:'Spice Shop',   expiry:'', notes:'',                        addedOn:'2025-01-01'},
  {id:29, name:'Cloves (Laung)',          category:'Spices & Condiments', qty:0.3, unit:'kg',      minQty:0.1,rate:800,  supplier:'Spice Shop',   expiry:'', notes:'',                        addedOn:'2025-01-01'},
  {id:30, name:'Cardamom (Elaichi)',      category:'Spices & Condiments', qty:0.2, unit:'kg',      minQty:0.05,rate:2500,supplier:'Spice Shop',   expiry:'', notes:'',                        addedOn:'2025-01-01'},
  {id:31, name:'Cinnamon (Dalchini)',     category:'Spices & Condiments', qty:0.3, unit:'kg',      minQty:0.1,rate:500,  supplier:'Spice Shop',   expiry:'', notes:'',                        addedOn:'2025-01-01'},
  {id:32, name:'Bay Leaves (Tej Patta)',  category:'Spices & Condiments', qty:0.2, unit:'kg',      minQty:0.05,rate:180, supplier:'Spice Shop',   expiry:'', notes:'',                        addedOn:'2025-01-01'},
  {id:33, name:'Dry Red Chilli',          category:'Spices & Condiments', qty:1,   unit:'kg',      minQty:0.2,rate:250,  supplier:'Spice Shop',   expiry:'', notes:'',                        addedOn:'2025-01-01'},
  {id:34, name:'Asafoetida (Hing)',       category:'Spices & Condiments', qty:0.1, unit:'kg',      minQty:0.05,rate:2000,supplier:'Spice Shop',   expiry:'', notes:'',                        addedOn:'2025-01-01'},
  {id:35, name:'Tamarind (Imli)',         category:'Spices & Condiments', qty:1,   unit:'kg',      minQty:0.2,rate:180,  supplier:'Spice Shop',   expiry:'', notes:'',                        addedOn:'2025-01-01'},
  {id:36, name:'Sugar',                   category:'Spices & Condiments', qty:20,  unit:'kg',      minQty:5,  rate:42,   supplier:'Local Market', expiry:'', notes:'',                        addedOn:'2025-01-01'},
  {id:37, name:'Jaggery (Gud)',           category:'Spices & Condiments', qty:5,   unit:'kg',      minQty:1,  rate:60,   supplier:'Local Market', expiry:'', notes:'',                        addedOn:'2025-01-01'},
  {id:38, name:'Vinegar',                 category:'Spices & Condiments', qty:2,   unit:'litre',   minQty:0.5,rate:80,   supplier:'Grocery Store',expiry:'', notes:'',                        addedOn:'2025-01-01'},
  {id:39, name:'Soy Sauce',               category:'Spices & Condiments', qty:1,   unit:'litre',   minQty:0.3,rate:120,  supplier:'Grocery Store',expiry:'', notes:'',                        addedOn:'2025-01-01'},
  {id:40, name:'Tomato Ketchup',          category:'Spices & Condiments', qty:3,   unit:'kg',      minQty:1,  rate:180,  supplier:'Grocery Store',expiry:'', notes:'',                        addedOn:'2025-01-01'},
  /* DAIRY */
  {id:41, name:'Milk',                    category:'Dairy',               qty:50,  unit:'litre',   minQty:10, rate:55,   supplier:'Dairy Supplier',expiry:'',notes:'Fresh daily delivery',    addedOn:'2025-01-01'},
  {id:42, name:'Curd (Dahi)',             category:'Dairy',               qty:10,  unit:'kg',      minQty:3,  rate:60,   supplier:'Dairy Supplier',expiry:'',notes:'',                        addedOn:'2025-01-01'},
  {id:43, name:'Butter',                  category:'Dairy',               qty:3,   unit:'kg',      minQty:0.5,rate:480,  supplier:'Dairy Supplier',expiry:'',notes:'',                        addedOn:'2025-01-01'},
  {id:44, name:'Paneer (Cottage Cheese)', category:'Dairy',               qty:5,   unit:'kg',      minQty:1,  rate:350,  supplier:'Dairy Supplier',expiry:'',notes:'',                        addedOn:'2025-01-01'},
  {id:45, name:'Cheese (Processed)',      category:'Dairy',               qty:2,   unit:'kg',      minQty:0.5,rate:420,  supplier:'Grocery Store',expiry:'', notes:'',                        addedOn:'2025-01-01'},
  {id:46, name:'Cream (Fresh)',           category:'Dairy',               qty:2,   unit:'litre',   minQty:0.5,rate:180,  supplier:'Dairy Supplier',expiry:'',notes:'',                        addedOn:'2025-01-01'},
  /* BEVERAGES */
  {id:47, name:'Tea (Chai Patti)',        category:'Beverages',           qty:5,   unit:'kg',      minQty:1,  rate:350,  supplier:'Grocery Store',expiry:'', notes:'',                        addedOn:'2025-01-01'},
  {id:48, name:'Coffee Powder',           category:'Beverages',           qty:1,   unit:'kg',      minQty:0.2,rate:600,  supplier:'Grocery Store',expiry:'', notes:'',                        addedOn:'2025-01-01'},
  {id:49, name:'Drinking Water (Cans)',   category:'Beverages',           qty:20,  unit:'pcs',     minQty:5,  rate:20,   supplier:'Water Supplier',expiry:'',notes:'20L cans',                 addedOn:'2025-01-01'},
  {id:50, name:'Juice (Mixed Fruit)',     category:'Beverages',           qty:12,  unit:'bottles', minQty:4,  rate:80,   supplier:'Grocery Store',expiry:'', notes:'1L bottles',              addedOn:'2025-01-01'}
];
var KIT_VEGE_SEED = [
  /* VEGETABLES */
  {id:101,name:'Onion',                   category:'Vegetables',          qty:30,  unit:'kg',      minQty:5,  rate:30,   supplier:'Vegetable Market',expiry:'',notes:'',                      addedOn:'2025-01-01'},
  {id:102,name:'Tomato',                  category:'Vegetables',          qty:20,  unit:'kg',      minQty:4,  rate:25,   supplier:'Vegetable Market',expiry:'',notes:'',                      addedOn:'2025-01-01'},
  {id:103,name:'Potato',                  category:'Vegetables',          qty:40,  unit:'kg',      minQty:8,  rate:22,   supplier:'Vegetable Market',expiry:'',notes:'',                      addedOn:'2025-01-01'},
  {id:104,name:'Garlic',                  category:'Vegetables',          qty:5,   unit:'kg',      minQty:1,  rate:120,  supplier:'Vegetable Market',expiry:'',notes:'',                      addedOn:'2025-01-01'},
  {id:105,name:'Ginger',                  category:'Vegetables',          qty:3,   unit:'kg',      minQty:0.5,rate:100,  supplier:'Vegetable Market',expiry:'',notes:'',                      addedOn:'2025-01-01'},
  {id:106,name:'Green Chilli',            category:'Vegetables',          qty:2,   unit:'kg',      minQty:0.3,rate:80,   supplier:'Vegetable Market',expiry:'',notes:'',                      addedOn:'2025-01-01'},
  {id:107,name:'Cabbage',                 category:'Vegetables',          qty:10,  unit:'kg',      minQty:2,  rate:20,   supplier:'Vegetable Market',expiry:'',notes:'',                      addedOn:'2025-01-01'},
  {id:108,name:'Cauliflower (Gobhi)',      category:'Vegetables',          qty:8,   unit:'kg',      minQty:2,  rate:35,   supplier:'Vegetable Market',expiry:'',notes:'',                      addedOn:'2025-01-01'},
  {id:109,name:'Spinach (Palak)',          category:'Vegetables',          qty:5,   unit:'kg',      minQty:1,  rate:30,   supplier:'Vegetable Market',expiry:'',notes:'',                      addedOn:'2025-01-01'},
  {id:110,name:'Brinjal (Baingan)',        category:'Vegetables',          qty:5,   unit:'kg',      minQty:1,  rate:30,   supplier:'Vegetable Market',expiry:'',notes:'',                      addedOn:'2025-01-01'},
  {id:111,name:'Carrot',                  category:'Vegetables',          qty:8,   unit:'kg',      minQty:2,  rate:35,   supplier:'Vegetable Market',expiry:'',notes:'',                      addedOn:'2025-01-01'},
  {id:112,name:'Peas (Matar)',             category:'Vegetables',          qty:5,   unit:'kg',      minQty:1,  rate:60,   supplier:'Vegetable Market',expiry:'',notes:'',                      addedOn:'2025-01-01'},
  {id:113,name:'Lady Finger (Bhindi)',     category:'Vegetables',          qty:5,   unit:'kg',      minQty:1,  rate:45,   supplier:'Vegetable Market',expiry:'',notes:'',                      addedOn:'2025-01-01'},
  {id:114,name:'Bitter Gourd (Karela)',    category:'Vegetables',          qty:3,   unit:'kg',      minQty:0.5,rate:50,   supplier:'Vegetable Market',expiry:'',notes:'',                      addedOn:'2025-01-01'},
  {id:115,name:'Bottle Gourd (Lauki)',     category:'Vegetables',          qty:5,   unit:'kg',      minQty:1,  rate:25,   supplier:'Vegetable Market',expiry:'',notes:'',                      addedOn:'2025-01-01'},
  {id:116,name:'Ridge Gourd (Turai)',      category:'Vegetables',          qty:3,   unit:'kg',      minQty:0.5,rate:30,   supplier:'Vegetable Market',expiry:'',notes:'',                      addedOn:'2025-01-01'},
  {id:117,name:'Pumpkin (Kaddu)',          category:'Vegetables',          qty:5,   unit:'kg',      minQty:1,  rate:20,   supplier:'Vegetable Market',expiry:'',notes:'',                      addedOn:'2025-01-01'},
  {id:118,name:'Capsicum (Bell Pepper)',   category:'Vegetables',          qty:3,   unit:'kg',      minQty:0.5,rate:70,   supplier:'Vegetable Market',expiry:'',notes:'',                      addedOn:'2025-01-01'},
  {id:119,name:'Drumstick (Sahjan)',       category:'Vegetables',          qty:2,   unit:'kg',      minQty:0.5,rate:55,   supplier:'Vegetable Market',expiry:'',notes:'',                      addedOn:'2025-01-01'},
  {id:120,name:'French Beans',            category:'Vegetables',          qty:3,   unit:'kg',      minQty:0.5,rate:65,   supplier:'Vegetable Market',expiry:'',notes:'',                      addedOn:'2025-01-01'},
  {id:121,name:'Beetroot',                category:'Vegetables',          qty:3,   unit:'kg',      minQty:0.5,rate:40,   supplier:'Vegetable Market',expiry:'',notes:'',                      addedOn:'2025-01-01'},
  {id:122,name:'Radish (Mooli)',           category:'Vegetables',          qty:3,   unit:'kg',      minQty:0.5,rate:25,   supplier:'Vegetable Market',expiry:'',notes:'',                      addedOn:'2025-01-01'},
  {id:123,name:'Sweet Potato',            category:'Vegetables',          qty:3,   unit:'kg',      minQty:0.5,rate:35,   supplier:'Vegetable Market',expiry:'',notes:'',                      addedOn:'2025-01-01'},
  {id:124,name:'Colocasia (Arbi)',         category:'Vegetables',          qty:3,   unit:'kg',      minQty:0.5,rate:40,   supplier:'Vegetable Market',expiry:'',notes:'',                      addedOn:'2025-01-01'},
  {id:125,name:'Coriander Leaves (Dhaniya)',category:'Vegetables',        qty:1,   unit:'kg',      minQty:0.2,rate:60,   supplier:'Vegetable Market',expiry:'',notes:'Fresh',                  addedOn:'2025-01-01'},
  {id:126,name:'Curry Leaves',            category:'Vegetables',          qty:0.5, unit:'kg',      minQty:0.1,rate:80,   supplier:'Vegetable Market',expiry:'',notes:'',                      addedOn:'2025-01-01'},
  {id:127,name:'Fenugreek Leaves (Methi)',category:'Vegetables',          qty:1,   unit:'kg',      minQty:0.2,rate:40,   supplier:'Vegetable Market',expiry:'',notes:'',                      addedOn:'2025-01-01'},
  {id:128,name:'Lemon',                   category:'Fruits',              qty:3,   unit:'kg',      minQty:0.5,rate:80,   supplier:'Vegetable Market',expiry:'',notes:'',                      addedOn:'2025-01-01'},
  {id:129,name:'Banana',                  category:'Fruits',              qty:5,   unit:'dozen',   minQty:1,  rate:50,   supplier:'Fruit Market', expiry:'', notes:'',                        addedOn:'2025-01-01'},
  {id:130,name:'Apple',                   category:'Fruits',              qty:5,   unit:'kg',      minQty:1,  rate:150,  supplier:'Fruit Market', expiry:'', notes:'',                        addedOn:'2025-01-01'},
  {id:131,name:'Orange',                  category:'Fruits',              qty:4,   unit:'kg',      minQty:1,  rate:80,   supplier:'Fruit Market', expiry:'', notes:'',                        addedOn:'2025-01-01'},
  {id:132,name:'Papaya',                  category:'Fruits',              qty:3,   unit:'kg',      minQty:0.5,rate:40,   supplier:'Fruit Market', expiry:'', notes:'',                        addedOn:'2025-01-01'},
  {id:133,name:'Guava',                   category:'Fruits',              qty:3,   unit:'kg',      minQty:0.5,rate:50,   supplier:'Fruit Market', expiry:'', notes:'',                        addedOn:'2025-01-01'}
];
var KIT_DAILY_SEED = [
  /* CLEANING SUPPLIES */
  {id:201,name:'Broom (Jhadoo)',           category:'Cleaning Supplies',   qty:10,  unit:'pcs',     minQty:3,  rate:50,   supplier:'General Store', lastDate:'2025-01-01', notes:'',           addedOn:'2025-01-01'},
  {id:202,name:'Mop (Pocha)',              category:'Cleaning Supplies',   qty:5,   unit:'pcs',     minQty:2,  rate:80,   supplier:'General Store', lastDate:'2025-01-01', notes:'',           addedOn:'2025-01-01'},
  {id:203,name:'Dustpan & Brush Set',      category:'Cleaning Supplies',   qty:5,   unit:'sets',    minQty:2,  rate:60,   supplier:'General Store', lastDate:'2025-01-01', notes:'',           addedOn:'2025-01-01'},
  {id:204,name:'Floor Cleaner (Phenyl)',   category:'Cleaning Supplies',   qty:10,  unit:'litre',   minQty:3,  rate:80,   supplier:'General Store', lastDate:'2025-01-01', notes:'',           addedOn:'2025-01-01'},
  {id:205,name:'Toilet Cleaner',           category:'Cleaning Supplies',   qty:8,   unit:'bottles', minQty:3,  rate:75,   supplier:'General Store', lastDate:'2025-01-01', notes:'',           addedOn:'2025-01-01'},
  {id:206,name:'Dishwash Soap (Bar)',      category:'Cleaning Supplies',   qty:20,  unit:'pcs',     minQty:5,  rate:20,   supplier:'General Store', lastDate:'2025-01-01', notes:'',           addedOn:'2025-01-01'},
  {id:207,name:'Dishwash Liquid',         category:'Cleaning Supplies',   qty:5,   unit:'bottles', minQty:2,  rate:120,  supplier:'General Store', lastDate:'2025-01-01', notes:'',           addedOn:'2025-01-01'},
  {id:208,name:'Detergent Powder (Washing)',category:'Cleaning Supplies',  qty:10,  unit:'kg',      minQty:3,  rate:85,   supplier:'General Store', lastDate:'2025-01-01', notes:'',           addedOn:'2025-01-01'},
  {id:209,name:'Detergent Liquid',        category:'Cleaning Supplies',   qty:5,   unit:'litre',   minQty:2,  rate:180,  supplier:'General Store', lastDate:'2025-01-01', notes:'',           addedOn:'2025-01-01'},
  {id:210,name:'Colin (Glass Cleaner)',    category:'Cleaning Supplies',   qty:4,   unit:'bottles', minQty:2,  rate:90,   supplier:'General Store', lastDate:'2025-01-01', notes:'',           addedOn:'2025-01-01'},
  {id:211,name:'Scrubber / Scotch Brite', category:'Cleaning Supplies',   qty:12,  unit:'pcs',     minQty:4,  rate:15,   supplier:'General Store', lastDate:'2025-01-01', notes:'',           addedOn:'2025-01-01'},
  {id:212,name:'Gloves (Rubber)',         category:'Cleaning Supplies',   qty:6,   unit:'pairs',   minQty:2,  rate:45,   supplier:'General Store', lastDate:'2025-01-01', notes:'',           addedOn:'2025-01-01'},
  {id:213,name:'Dustbin (Small)',         category:'Cleaning Supplies',   qty:10,  unit:'pcs',     minQty:3,  rate:120,  supplier:'General Store', lastDate:'2025-01-01', notes:'',           addedOn:'2025-01-01'},
  {id:214,name:'Garbage Bags (Large)',    category:'Cleaning Supplies',   qty:5,   unit:'packets', minQty:2,  rate:80,   supplier:'General Store', lastDate:'2025-01-01', notes:'50pcs/packet',addedOn:'2025-01-01'},
  {id:215,name:'Dettol / Antiseptic Liquid',category:'Cleaning Supplies', qty:3,   unit:'bottles', minQty:1,  rate:130,  supplier:'General Store', lastDate:'2025-01-01', notes:'500ml bottles',addedOn:'2025-01-01'},
  {id:216,name:'Mosquito Repellent Coil', category:'Cleaning Supplies',   qty:5,   unit:'boxes',   minQty:2,  rate:35,   supplier:'General Store', lastDate:'2025-01-01', notes:'',           addedOn:'2025-01-01'},
  {id:217,name:'Air Freshener Spray',     category:'Cleaning Supplies',   qty:4,   unit:'bottles', minQty:1,  rate:150,  supplier:'General Store', lastDate:'2025-01-01', notes:'',           addedOn:'2025-01-01'},
  /* TOILETRIES */
  {id:218,name:'Bathing Soap (Lifebuoy)',  category:'Toiletries',          qty:50,  unit:'pcs',     minQty:10, rate:28,   supplier:'General Store', lastDate:'2025-01-01', notes:'',           addedOn:'2025-01-01'},
  {id:219,name:'Shampoo',                 category:'Toiletries',          qty:10,  unit:'bottles', minQty:3,  rate:90,   supplier:'General Store', lastDate:'2025-01-01', notes:'200ml bottles',addedOn:'2025-01-01'},
  {id:220,name:'Conditioner',             category:'Toiletries',          qty:5,   unit:'bottles', minQty:2,  rate:120,  supplier:'General Store', lastDate:'2025-01-01', notes:'',           addedOn:'2025-01-01'},
  {id:221,name:'Toothpaste',              category:'Toiletries',          qty:20,  unit:'pcs',     minQty:5,  rate:65,   supplier:'General Store', lastDate:'2025-01-01', notes:'',           addedOn:'2025-01-01'},
  {id:222,name:'Toothbrush',              category:'Toiletries',          qty:30,  unit:'pcs',     minQty:8,  rate:25,   supplier:'General Store', lastDate:'2025-01-01', notes:'',           addedOn:'2025-01-01'},
  {id:223,name:'Face Wash',               category:'Toiletries',          qty:10,  unit:'pcs',     minQty:3,  rate:110,  supplier:'General Store', lastDate:'2025-01-01', notes:'',           addedOn:'2025-01-01'},
  {id:224,name:'Talcum Powder',           category:'Toiletries',          qty:10,  unit:'pcs',     minQty:3,  rate:75,   supplier:'General Store', lastDate:'2025-01-01', notes:'',           addedOn:'2025-01-01'},
  {id:225,name:'Hair Oil (Coconut/Parachute)',category:'Toiletries',      qty:8,   unit:'bottles', minQty:2,  rate:120,  supplier:'General Store', lastDate:'2025-01-01', notes:'',           addedOn:'2025-01-01'},
  {id:226,name:'Comb',                    category:'Toiletries',          qty:20,  unit:'pcs',     minQty:5,  rate:15,   supplier:'General Store', lastDate:'2025-01-01', notes:'',           addedOn:'2025-01-01'},
  {id:227,name:'Sanitary Napkins',        category:'Toiletries',          qty:20,  unit:'packets', minQty:5,  rate:50,   supplier:'General Store', lastDate:'2025-01-01', notes:'For girls\' hostel',addedOn:'2025-01-01'},
  {id:228,name:'Toilet Paper / Tissue Rolls',category:'Toiletries',      qty:30,  unit:'rolls',   minQty:8,  rate:25,   supplier:'General Store', lastDate:'2025-01-01', notes:'',           addedOn:'2025-01-01'},
  {id:229,name:'Hand Wash Liquid',        category:'Toiletries',          qty:10,  unit:'bottles', minQty:3,  rate:95,   supplier:'General Store', lastDate:'2025-01-01', notes:'',           addedOn:'2025-01-01'},
  {id:230,name:'Hand Sanitizer',          category:'Toiletries',          qty:8,   unit:'bottles', minQty:2,  rate:80,   supplier:'General Store', lastDate:'2025-01-01', notes:'250ml',       addedOn:'2025-01-01'},
  {id:231,name:'Moisturizer / Body Lotion',category:'Toiletries',        qty:5,   unit:'pcs',     minQty:2,  rate:150,  supplier:'General Store', lastDate:'2025-01-01', notes:'',           addedOn:'2025-01-01'},
  {id:232,name:'Razor (Disposable)',      category:'Toiletries',          qty:10,  unit:'pcs',     minQty:3,  rate:15,   supplier:'General Store', lastDate:'2025-01-01', notes:'For boys',    addedOn:'2025-01-01'},
  {id:233,name:'Shaving Cream / Foam',   category:'Toiletries',          qty:5,   unit:'pcs',     minQty:1,  rate:90,   supplier:'General Store', lastDate:'2025-01-01', notes:'',           addedOn:'2025-01-01'},
  {id:234,name:'Nail Cutter',             category:'Toiletries',          qty:10,  unit:'pcs',     minQty:3,  rate:30,   supplier:'General Store', lastDate:'2025-01-01', notes:'',           addedOn:'2025-01-01'},
  
  {id:235,name:'LPG Gas Cylinder',        category:'Fuel & Gas',          qty:4,   unit:'pcs',     minQty:1,  rate:900,  supplier:'Gas Agency',    lastDate:'2025-01-01', notes:'14.2 kg',     addedOn:'2025-01-01'},
  {id:236,name:'Kerosene',                category:'Fuel & Gas',          qty:10,  unit:'litre',   minQty:3,  rate:35,   supplier:'Fuel Depot',    lastDate:'2025-01-01', notes:'Backup fuel', addedOn:'2025-01-01'},
  
  {id:237,name:'Steel Plates',            category:'Utensils & Equipment',qty:50,  unit:'pcs',     minQty:10, rate:85,   supplier:'Utensil Store', lastDate:'2025-01-01', notes:'',           addedOn:'2025-01-01'},
  {id:238,name:'Steel Glasses',           category:'Utensils & Equipment',qty:50,  unit:'pcs',     minQty:10, rate:50,   supplier:'Utensil Store', lastDate:'2025-01-01', notes:'',           addedOn:'2025-01-01'},
  {id:239,name:'Steel Spoons',            category:'Utensils & Equipment',qty:30,  unit:'pcs',     minQty:8,  rate:20,   supplier:'Utensil Store', lastDate:'2025-01-01', notes:'',           addedOn:'2025-01-01'},
  {id:240,name:'Kitchen Towel / Cloth',   category:'Utensils & Equipment',qty:10,  unit:'pcs',     minQty:3,  rate:35,   supplier:'General Store', lastDate:'2025-01-01', notes:'',           addedOn:'2025-01-01'},
  {id:241,name:'Matchbox',                category:'Utensils & Equipment',qty:10,  unit:'boxes',   minQty:3,  rate:5,    supplier:'General Store', lastDate:'2025-01-01', notes:'',           addedOn:'2025-01-01'},
  {id:242,name:'Aluminium Foil',          category:'Utensils & Equipment',qty:3,   unit:'rolls',   minQty:1,  rate:90,   supplier:'General Store', lastDate:'2025-01-01', notes:'',           addedOn:'2025-01-01'}
];
(function(){
  try{
    if(!localStorage.getItem('gnsi_kit_stock_items')){
      localStorage.setItem('gnsi_kit_stock_items', JSON.stringify(KIT_STOCK_SEED.concat(KIT_VEGE_SEED)));
if(typeof gnsiKVPush==='function')gnsiKVPush('gnsi_kit_stock_items',KIT_STOCK_SEED);
    }
    if(!localStorage.getItem('gnsi_kit_daily_stock')){
      localStorage.setItem('gnsi_kit_daily_stock', JSON.stringify(KIT_DAILY_SEED));if(typeof gnsiKVPush==='function')gnsiKVPush('gnsi_kit_daily_stock',KIT_DAILY_SEED);
    }
  }catch(e){}
})();
function kitLoad(key){ try{ var s=localStorage.getItem('gnsi_kit_'+key); if(s)return JSON.parse(s); }catch(e){} return []; }
function kitSave(key,arr){ localStorage.setItem('gnsi_kit_'+key,JSON.stringify(arr));if(typeof gnsiKVPush==='function')gnsiKVPush('gnsi_kit_'+key,arr); }
function kitDate(){ return new Date().toISOString().slice(0,10); }
function kitFmt(d){ if(!d)return '-'; var p=d.split('-'); return p[2]+'/'+p[1]+'/'+p[0]; }
function kitNextId(arr){ return arr.length ? Math.max.apply(null,arr.map(function(x){return x.id||0;}))+1 : 1; }
function kitIsAdmin(){ return currentUser&&(currentUser.role==='admin'||currentUser.role==='manager'||currentUser.role==='hostel'); }
function kitBadge(label, color){
  var map={green:'#16a34a',red:'#dc2626',amber:'#d97706',blue:'#2563eb',gray:'#6b7280',purple:'#7c3aed',teal:'#0891b2'};
  var c=map[color]||color||'#6b7280';
  return '<span style="display:inline-block;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;background:'+c+'18;color:'+c+';border:1px solid '+c+'44">'+label+'</span>';
}
function setKitchenTab(t){ kitchenTab=t; navigate('kitchen'); }
