/* GNSI PORTAL — modules/teaching.js
   Pages: teaching, diary, lessonbridge (window.renderLessonBridge)
   DEPENDS ON: core/utils.js, core/state.js */

function renderTeachingPage(){
  var currentTeacherRole=currentUser?currentUser.role:'';
  var isTeacher=currentTeacherRole==='teacher'||currentTeacherRole==='admin'||currentTeacherRole==='manager';
  var tsTab=window._tsTab||'today';
  function tsTabBtn(key,icon,label){
    var a=tsTab===key;
    return '<button onclick="window._tsTab=\''+key+'\';render()" style="padding:9px 20px;border-radius:9px;border:'+(a?'none':'1.5px solid var(--border)')+';cursor:pointer;font-family:\'Nunito\',sans-serif;font-weight:'+(a?'700':'600')+';font-size:12.5px;background:'+(a?'var(--accent)':'var(--surface)')+';color:'+(a?'#fff':'var(--muted)')+'">'+icon+' '+label+'</button>';
  }
  var tabs='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px">'
    +tsTabBtn('today','📅','Today\'s Lesson')+tsTabBtn('plans','📋','Lesson Plans')+tsTabBtn('assignments','📝','Assignments')+tsTabBtn('performance','📊','Performance')
  +'</div>';
  var today=new Date().toISOString().split('T')[0];
  var body='';
  if(tsTab==='today'){
    var todayLessons=tsLoad('today_lessons');
    var addForm='<div class="form-panel" style="margin-bottom:18px"><div class="form-title" style="color:#1433a8">📅 Log Today\'s Lesson</div>'
      +'<div class="form-grid g3">'
        +'<div class="form-group"><label>Subject *</label><input id="ts-today-sub" placeholder="e.g. Mathematics"/></div>'
        +'<div class="form-group"><label>Topic *</label><input id="ts-today-topic" placeholder="e.g. Fractions"/></div>'
        +'<div class="form-group"><label>Batch</label>'
        +'<select id="ts-today-cls" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--surface);font-size:13px;color:var(--text)"><option value="">-- Select Batch --</option>'+(['Achiever Batch (Combined)','Leader Batch (Sainik)','Champion Batch (Sainik)','Lakshya Batch (Navodaya)','Umeed Batch (Navodaya)','Elite Batch (Foundation)','Prime Batch (Foundation)'].map(function(b){return '<option'+(('')===b?' selected':'')+'>'+b+'</option>';}).join(''))+'</select>'+'</div>'
        +'<div class="form-group"><label>Periods Covered</label><input id="ts-today-periods" placeholder="e.g. P1, P3"/></div>'
        +'<div class="form-group" style="grid-column:1/-1"><label>Notes</label><input id="ts-today-note" placeholder="Additional notes"/></div>'
      +'</div>'
      +'<div class="form-actions"><button class="btn btn-primary" onclick="tSaveToday()">Save Lesson</button></div></div>';
    var rows=todayLessons.map(function(l){
      return '<tr><td style="font-size:11px;font-family:\'JetBrains Mono\',monospace">'+esc(l.date)+'</td>'
        +'<td><b>'+esc(l.subject)+'</b><div style="font-size:11px;color:var(--muted)">'+esc(l.topic)+'</div></td>'
        +'<td>'+esc(l.cls||'--')+'</td>'
        +'<td>'+esc(l.periods||'--')+'</td>'
        +'<td style="font-size:11.5px;color:var(--muted)">'+esc(l.note||'--')+'</td>'
        +'<td>'+esc(l.teacher||'--')+'</td>'
        +'<td><button onclick="tDeleteToday(\''+l.id+'\')" style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;border-radius:5px;padding:3px 8px;cursor:pointer;font-size:10.5px;font-weight:700">✕</button></td>'
      +'</tr>';
    }).join('');
    body=addForm+'<div class="card"><div class="card-head"><span class="card-title">Lesson Log</span></div>'
      +'<div style="overflow-x:auto"><table><thead><tr><th>Date</th><th>Subject / Topic</th><th>Class</th><th>Periods</th><th>Notes</th><th>Teacher</th><th>Del</th></tr></thead>'
      +'<tbody>'+(rows||'<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--muted)">No lessons logged yet.</td></tr>')+'</tbody></table></div></div>';
  }
  if(tsTab==='plans'){
    var plans=tsLoad('plans');
    var statusColors={Pending:'#f59e0b','In Progress':'#3b78c9',Completed:'#16a34a'};
    var addForm2='<div class="form-panel" style="margin-bottom:18px"><div class="form-title" style="color:#7c3aed">📋 Create Lesson Plan</div>'
      +'<div class="form-grid g3">'
        +'<div class="form-group"><label>Plan Title *</label><input id="ts-plan-title" placeholder="e.g. Term 1 Maths Plan"/></div>'
        +'<div class="form-group"><label>Batch</label>'
        +'<select id="ts-plan-cls" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--surface);font-size:13px;color:var(--text)"><option value="">-- Select Batch --</option>'+(['Achiever Batch (Combined)','Leader Batch (Sainik)','Champion Batch (Sainik)','Lakshya Batch (Navodaya)','Umeed Batch (Navodaya)','Elite Batch (Foundation)','Prime Batch (Foundation)'].map(function(b){return '<option'+(('')===b?' selected':'')+'>'+b+'</option>';}).join(''))+'</select>'+'</div>'
        +'<div class="form-group"><label>Subject</label><input id="ts-plan-sub" placeholder="Subject name"/></div>'
        +'<div class="form-group"><label>Month</label><input id="ts-plan-month" type="month"/></div>'
        +'<div class="form-group" style="grid-column:1/-1"><label>Plan Content</label><textarea id="ts-plan-content" placeholder="Topics, chapters, objectives..." style="width:100%;min-height:80px;border:1.5px solid var(--border);border-radius:8px;padding:8px 12px;font-family:\'DM Sans\',sans-serif;font-size:13px;background:var(--surface);color:var(--text);outline:none;resize:vertical"></textarea></div>'
      +'</div>'
      +'<div class="form-actions"><button class="btn btn-primary" onclick="tSavePlan()">Save Plan</button></div></div>';
    var rows2=plans.map(function(p){
      var sc=statusColors[p.status]||'var(--muted)';
      return '<tr>'
        +'<td><b style="font-size:13px">'+esc(p.title)+'</b><div style="font-size:11px;color:var(--muted)">'+esc(p.teacher||'')+'</div></td>'
        +'<td>'+esc(p.cls||'--')+'</td><td>'+esc(p.subject||'--')+'</td><td>'+esc(p.month||'--')+'</td>'
        +'<td><button onclick="tUpdatePlanStatus(\''+p.id+'\')" style="padding:3px 10px;border-radius:12px;border:1.5px solid '+sc+'44;background:'+sc+'22;color:'+sc+';cursor:pointer;font-size:11px;font-weight:700;font-family:\'DM Sans\',sans-serif">'+esc(p.status||'Pending')+'</button></td>'
        +'<td><button onclick="tDeletePlan(\''+p.id+'\')" style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;border-radius:5px;padding:3px 8px;cursor:pointer;font-size:10.5px;font-weight:700">✕</button></td>'
      +'</tr>';
    }).join('');
    body=addForm2+'<div class="card"><div class="card-head"><span class="card-title">Lesson Plans</span></div>'
      +'<div style="overflow-x:auto"><table><thead><tr><th>Title</th><th>Class</th><th>Subject</th><th>Month</th><th>Status</th><th>Del</th></tr></thead>'
      +'<tbody>'+(rows2||'<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--muted)">No lesson plans created yet.</td></tr>')+'</tbody></table></div></div>';
  }
  if(tsTab==='assignments'){
    var assignments=tsLoad('assignments');
    var addForm3='<div class="form-panel" style="margin-bottom:18px"><div class="form-title" style="color:#7c3aed">📝 Add Assignment</div>'
      +'<div class="form-grid g3">'
        +'<div class="form-group"><label>Title *</label><input id="ts-asgn-title" placeholder="Assignment title"/></div>'
        +'<div class="form-group"><label>Batch</label>'
        +'<select id="ts-asgn-cls" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--surface);font-size:13px;color:var(--text)"><option value="">-- Select Batch --</option>'+(['Achiever Batch (Combined)','Leader Batch (Sainik)','Champion Batch (Sainik)','Lakshya Batch (Navodaya)','Umeed Batch (Navodaya)','Elite Batch (Foundation)','Prime Batch (Foundation)'].map(function(b){return '<option'+(('')===b?' selected':'')+'>'+b+'</option>';}).join(''))+'</select>'+'</div>'
        +'<div class="form-group"><label>Subject</label><input id="ts-asgn-sub" placeholder="Subject"/></div>'
        +'<div class="form-group"><label>Due Date</label><input id="ts-asgn-due" type="date"/></div>'
        +'<div class="form-group" style="grid-column:1/-1"><label>Description</label><input id="ts-asgn-desc" placeholder="Assignment details"/></div>'
      +'</div>'
      +'<div class="form-actions"><button class="btn btn-primary" onclick="tSaveAssignment()">Save Assignment</button></div></div>';
    var rows3=assignments.map(function(a){
      var overdue=a.dueDate&&a.dueDate<today;
      return '<tr style="'+(overdue?'background:#fff8f0':'')+'">'
        +'<td><b>'+esc(a.title)+'</b><div style="font-size:11px;color:var(--muted)">'+esc(a.description||'')+'</div></td>'
        +'<td>'+esc(a.cls||'--')+'</td><td>'+esc(a.subject||'--')+'</td>'
        +'<td style="font-family:\'JetBrains Mono\',monospace;font-size:11.5px;color:'+(overdue?'#dc2626':'var(--text)')+'">'+esc(a.dueDate||'--')+(overdue?' ⚠':'')+'</td>'
        +'<td>'+esc(a.teacher||'--')+'</td>'
        +'<td><button onclick="tDeleteAssignment(\''+parseInt(a.id,10)+'\')" style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;border-radius:5px;padding:3px 8px;cursor:pointer;font-size:10.5px;font-weight:700">✕</button></td>'
      +'</tr>';
    }).join('');
    body=addForm3+'<div class="card"><div class="card-head"><span class="card-title">Assignments</span></div>'
      +'<div style="overflow-x:auto"><table><thead><tr><th>Title</th><th>Class</th><th>Subject</th><th>Due Date</th><th>Teacher</th><th>Del</th></tr></thead>'
      +'<tbody>'+(rows3||'<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--muted)">No assignments added yet.</td></tr>')+'</tbody></table></div></div>';
  }
  if(tsTab==='performance'){
    var performance=tsLoad('performance');
    var addForm4='<div class="form-panel" style="margin-bottom:18px"><div class="form-title" style="color:#c9870a">📊 Record Academic Performance</div>'
      +'<div class="form-grid g3">'
        +'<div class="form-group"><label>Student Name *</label><input id="ts-perf-stu" placeholder="Student name or roll no"/></div>'
        +'<div class="form-group"><label>Subject</label><input id="ts-perf-sub" placeholder="Subject"/></div>'
        +'<div class="form-group"><label>Score / Marks</label><input id="ts-perf-score" type="number" placeholder="e.g. 78"/></div>'
        +'<div class="form-group"><label>Grade</label><select id="ts-perf-grade"><option value="">Select</option><option>A+</option><option>A</option><option>B+</option><option>B</option><option>C</option><option>D</option><option>F</option></select></div>'
        +'<div class="form-group" style="grid-column:1/-1"><label>Note / Remarks</label><input id="ts-perf-note" placeholder="Remarks or areas for improvement"/></div>'
      +'</div>'
      +'<div class="form-actions"><button class="btn btn-primary" onclick="tSavePerformance()">Save Record</button></div></div>';
    var rows4=performance.map(function(p){
      var gradeColor={'A+':'#16a34a','A':'#16a34a','B+':'#3b78c9','B':'#3b78c9','C':'#d97706','D':'#ea580c','F':'#dc2626'}[p.grade]||'var(--muted)';
      return '<tr>'
        +'<td><b>'+esc(p.student)+'</b></td>'
        +'<td>'+esc(p.subject||'--')+'</td>'
        +'<td style="font-family:\'JetBrains Mono\',monospace;font-weight:700">'+esc(p.score||'--')+'</td>'
        +'<td><span style="padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700;background:'+gradeColor+'22;color:'+gradeColor+'">'+esc(p.grade||'--')+'</span></td>'
        +'<td style="font-size:11.5px;color:var(--muted)">'+esc(p.note||'--')+'</td>'
        +'<td style="font-size:11px;font-family:\'JetBrains Mono\',monospace">'+esc(p.date||'')+'</td>'
        +'<td>'+esc(p.teacher||'--')+'</td>'
        +'<td><button onclick="tDeletePerf(\''+p.id+'\')" style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;border-radius:5px;padding:3px 8px;cursor:pointer;font-size:10.5px;font-weight:700">✕</button></td>'
      +'</tr>';
    }).join('');
    body=addForm4+'<div class="card"><div class="card-head"><span class="card-title">Academic Performance Records</span></div>'
      +'<div style="overflow-x:auto"><table><thead><tr><th>Student</th><th>Subject</th><th>Score</th><th>Grade</th><th>Remark</th><th>Date</th><th>Teacher</th><th>Del</th></tr></thead>'
      +'<tbody>'+(rows4||'<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--muted)">No performance records yet.</td></tr>')+'</tbody></table></div></div>';
  }
  /* Cross-device sync strip for Teaching page */
  var _tsRtOk = (typeof _gnsiRTStatus!=='undefined') && _gnsiRTStatus.connected >= _gnsiRTStatus.total && _gnsiRTStatus.total > 0;
  var _tsSyncStrip = '<div id="_gnsiTsSyncBadge" style="'
    + 'display:flex;align-items:center;gap:8px;padding:7px 14px;margin-bottom:14px;'
    + 'background:'+(_tsRtOk?'#f5f3ff':'#fffbeb')+';border:1px solid '+(_tsRtOk?'#c4b5fd':'#fcd34d')+';border-radius:9px;'
    + 'font-size:11.5px;font-weight:600;color:'+(_tsRtOk?'#7c3aed':'#d97706')+';cursor:pointer;opacity:0.85" onclick="navigate(\'sync\')">'
    + '<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:'+(_tsRtOk?'#7c3aed':'#f59e0b')+';'
    + (_tsRtOk?'box-shadow:0 0 5px #7c3aed;animation:pulse-dot 1.4s ease-in-out infinite':'')+'"></span>'
    + '<span id="_gnsiTsSyncMsg">'+(_tsRtOk?'\uD83D\uDFE3 Live sync active — lesson plans &amp; assignments sync across all devices':'\uD83D\uDFE1 Connecting to sync…')+'</span>'
    + '<span style="margin-left:auto;font-size:10px;opacity:.65;font-family:\'JetBrains Mono\',monospace">gnsi_ts_*</span>'
    + '</div>';
  return '<div class="page-header"><div class="page-header-eyebrow">GNSI -- TEACHING STAFF</div>'
    +'<div class="page-header-title">Teaching Staff Portal</div>'
    +'<div class="page-header-sub">Lesson Plans · Today\'s Lesson · Assignments · Academic Performance</div></div>'
    +_tsSyncStrip+tabs+body;
}
// Register teaching page in router
(function registerTeachingPage(){
  if(typeof navigate==='undefined'){ setTimeout(registerTeachingPage,150); return; }
  if(typeof render==='undefined'){ setTimeout(registerTeachingPage,150); return; }
  var _oNav=navigate;
  navigate=function(page){
    _oNav(page);
    if(page==='teaching'){
      setTimeout(function(){
        var content=document.getElementById('content');
        if(content) content.innerHTML='<div style="padding:24px 28px">'+renderTeachingPage()+'</div>';
      },50);
    }
  };
  var _oRender=render;
  render=function(){
    if(typeof currentPage!=='undefined'&&currentPage==='teaching'){
      var content=document.getElementById('content');
      if(content){ content.innerHTML='<div style="padding:24px 28px">'+renderTeachingPage()+'</div>'; return; }
    }
    _oRender();
  };
})();
(function patchReportsFinal(){
  if(typeof renderReports==='undefined'){ setTimeout(patchReportsFinal,300); return; }
  var _oRep=renderReports;
  renderReports=function(){
    var base=_oRep();
    // Quick nav to all sections
    var allSections=[
      {key:'dashboard',icon:'📊',label:'Dashboard'},{key:'attendance',icon:'📋',label:'Attendance'},
      {key:'fees',icon:'💰',label:'Fee Collection'},{key:'accounts',icon:'📒',label:'Accounts'},
      {key:'timetable',icon:'📅',label:'Timetable'},{key:'exam',icon:'📝',label:'Exam'},
      {key:'staff',icon:'👤',label:'Staff'},{key:'students',icon:'🎓',label:'Students'},
      {key:'boarder',icon:'🏠',label:'Boarder Schedule'},{key:'housemaster',icon:'🏡',label:'House Master'},
      {key:'dutyhours',icon:'⏰',label:'Duty Hours'},{key:'reception',icon:'🔔',label:'Reception'},
      {key:'notices',icon:'📢',label:'Notices'},{key:'hostel',icon:'🛏',label:'Hostel'},
      ,{key:'teaching',icon:'📖',label:'Teaching Staff'},
    ];
    var navBtns=allSections.map(function(s){
      return '<button onclick="navigate(\''+s.key+'\')" style="display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:9px;border:1.5px solid var(--border-soft);background:var(--surface);cursor:pointer;font-size:12px;font-weight:600;font-family:\'DM Sans\',sans-serif;color:var(--text);transition:all .15s;white-space:nowrap" onmouseenter="this.style.background=\'var(--accent-light)\'" onmouseleave="this.style.background=\'var(--surface)\'">'
        +s.icon+' '+s.label+'</button>';
    }).join('');
    var quickNav='<div style="margin-bottom:24px">'
      +'<div style="font-family:\'JetBrains Mono\',monospace;font-size:10px;color:var(--muted);letter-spacing:.15em;text-transform:uppercase;margin-bottom:10px">🔗 Quick Navigation -- All Sections</div>'
      +'<div style="display:flex;flex-wrap:wrap;gap:8px">'+navBtns+'</div>'
    +'</div>';
    // Teaching performance section
    var teachingSection='<div style="margin-top:24px">'
      +'<div style="font-family:\'JetBrains Mono\',monospace;font-size:10px;color:var(--muted);letter-spacing:.15em;text-transform:uppercase;margin-bottom:10px">📖 Teaching Staff -- Admin Overview</div>'
      +'<div class="card"><div class="card-head" style="background:linear-gradient(135deg,#0b1e6e,#1433a8)">'
        +'<span class="card-title" style="color:#fff">Teaching Performance Summary</span>'
        +'<button onclick="navigate(\'teaching\')" style="background:rgba(255,255,255,.2);color:#fff;border:1px solid rgba(255,255,255,.3);border-radius:7px;padding:5px 12px;cursor:pointer;font-size:11.5px;font-weight:700;font-family:\'DM Sans\',sans-serif">Open Teaching Portal →</button>'
      +'</div><div style="padding:16px 20px">'
        +'<div style="display:flex;gap:12px;flex-wrap:wrap">'
          +'<div style="background:#e0e8f9;border-radius:10px;padding:10px 18px;text-align:center;min-width:90px"><div style="font-size:22px;font-weight:800;color:#1433a8">'+tsLoad('today_lessons').length+'</div><div style="font-size:10px;color:#1433a8;font-weight:700;text-transform:uppercase">Lessons Logged</div></div>'
          +'<div style="background:#f3e8ff;border-radius:10px;padding:10px 18px;text-align:center;min-width:90px"><div style="font-size:22px;font-weight:800;color:#7c3aed">'+tsLoad('plans').length+'</div><div style="font-size:10px;color:#7c3aed;font-weight:700;text-transform:uppercase">Lesson Plans</div></div>'
          +'<div style="background:#fffbeb;border-radius:10px;padding:10px 18px;text-align:center;min-width:90px"><div style="font-size:22px;font-weight:800;color:#d97706">'+tsLoad('assignments').length+'</div><div style="font-size:10px;color:#d97706;font-weight:700;text-transform:uppercase">Assignments</div></div>'
          +'<div style="background:#f0fdf4;border-radius:10px;padding:10px 18px;text-align:center;min-width:90px"><div style="font-size:22px;font-weight:800;color:#16a34a">'+tsLoad('performance').length+'</div><div style="font-size:10px;color:#16a34a;font-weight:700;text-transform:uppercase">Perf. Records</div></div>'
        +'</div>'
      +'</div></div>'
    +'</div>';
    return '<div class="page-header"><div class="page-header-eyebrow">GNSI -- REPORTS</div>'
      +'<div class="page-header-title">Reports &amp; Analytics</div>'
      +'<div class="page-header-sub">All modules · Data export · Performance overview</div></div>'
      +quickNav+base+teachingSection;
  };
})();
/* gnsi-csv-import-btn injection removed — duplicate of built-in CSV Import button */
window.gnsiVerifySupabase=function(){
  var overlay=document.getElementById('gnsi-supa-check');
  if(overlay){overlay.style.display='flex';return;}
  var el=document.createElement('div');
  el.id='gnsi-supa-check';
  el.style.cssText='position:fixed;inset:0;z-index:9000;background:rgba(10,18,41,.65);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;';
  el.innerHTML='<div style="background:var(--surface);border-radius:18px;padding:28px;max-width:680px;width:96vw;max-height:90vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,.3)">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">'
      +'<div><div style="font-family:\'Playfair Display\',serif;font-size:19px;font-weight:700">🗄 Supabase Connectivity</div>'
      +'<div style="font-size:12px;color:var(--muted);margin-top:3px">Live status of all GNSI portal sections</div></div>'
      +'<button onclick="document.getElementById(\'gnsi-supa-check\').style.display=\'none\'" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--muted)">&times;</button>'
    +'</div>'
    +'<div id="gnsi-supa-check-body"><div style="text-align:center;padding:40px;color:var(--muted)">⏳ Running checks…</div></div>'
    +'<div style="margin-top:16px;font-size:11px;color:var(--muted);line-height:1.6">'
      +'🟢 <b>Supabase</b> = Cloud &nbsp;·&nbsp; 🟡 <b>Hybrid</b> = Cloud + localStorage &nbsp;·&nbsp; 🔵 <b>Local</b> = localStorage only'
    +'</div>'
  +'</div>';
  document.body.appendChild(el);
  var sections=[
    {label:'Staff',         table:'staff',        mode:'supabase', note:'Loaded from Supabase on login'},
    {label:'Students',      table:'students',      mode:'supabase', note:'Loaded from Supabase on login'},
    {label:'Notices',       table:'notices',       mode:'supabase', note:'Fetched from Supabase'},
    {label:'Attendance',    table:'attendance',    mode:'hybrid',   note:'Supabase + gnsi_keyvalue KV'},
    {label:'Fee Payments',  table:'fee_payments',  mode:'supabase', note:'Saved to Supabase'},
    {label:'Income Ledger', table:'income_ledger', mode:'hybrid',   note:'localStorage + KV sync'},
    {label:'Expense Ledger',table:'expense_ledger',mode:'hybrid',   note:'localStorage + KV sync'},
    {label:'Timetable',     table:'gnsi_keyvalue', mode:'hybrid',   note:'Stored in gnsi_keyvalue'},
    {label:'Boarder Sched', table:'gnsi_keyvalue', mode:'local',    note:'localStorage (ims_boarder)'},
    {label:'Duty Hours',    table:'gnsi_keyvalue', mode:'hybrid',   note:'Stored in gnsi_keyvalue'},
    {label:'House Master',  table:'gnsi_keyvalue', mode:'hybrid',   note:'Student house map in KV'},
    {label:'Exam Results',  table:'gnsi_keyvalue', mode:'hybrid',   note:'Stored in gnsi_keyvalue'},
    {label:'KV Store',      table:'gnsi_keyvalue', mode:'supabase', note:'Central cloud key-value store'},
    {label:'Reports Coll.', table:'gnsi_keyvalue', mode:'hybrid',   note:'Report data in KV store'},
    {label:'Duty Hours',    table:'gnsi_keyvalue', mode:'hybrid',   note:'gnsi_duty_log / gnsi_duty_daily_att in KV'},
    {label:'Kitchen',       table:'gnsi_keyvalue', mode:'hybrid',   note:'gnsi_kit_* stock data in KV'},
    {label:'Faculty Plans', table:'gnsi_keyvalue', mode:'hybrid',   note:'gnsi_lesson_plans + gnsi_fac_goals_* in KV'},
    {label:'Staff Intel',   table:'gnsi_keyvalue', mode:'hybrid',   note:'gnsi_sm_remarks + gnsi_staff_rating in KV'},
    {label:'Leaderboard',   table:'gnsi_keyvalue', mode:'hybrid',   note:'gnsi_lb_stars in KV'},
    {label:'Exam Manager',  table:'gnsi_keyvalue', mode:'hybrid',   note:'gnsi_em_* (rooms, seats, invig, attendance, QS) in KV'},
  ];
  var distinctTables=[...new Set(sections.map(function(s){return s.table;}))];
  var counts={}, done2=0;
  distinctTables.forEach(function(tbl){
    _supa.from(tbl).select('id',{count:'exact',head:true}).then(function(r){
      counts[tbl]=r.error?{err:r.error.message}:{count:r.count||0};
      done2++;
      if(done2===distinctTables.length) gnsiRenderSupaResults(sections,counts);
    }).catch(function(e){
      counts[tbl]={err:e.message||'Unknown error'};
      done2++;
      if(done2===distinctTables.length) gnsiRenderSupaResults(sections,counts);
    });
  });
};
function gnsiRenderSupaResults(sections,counts){
  var body=document.getElementById('gnsi-supa-check-body');
  if(!body)return;
  var modeColor={supabase:'#16a34a',hybrid:'#d97706',local:'#3b78c9'};
  var modeIcon={supabase:'🟢',hybrid:'🟡',local:'🔵'};
  var modeLabel={supabase:'Supabase ☁',hybrid:'Hybrid ☁+💾',local:'Local 💾'};
  var connectedCount=0,warnCount=0;
  var rows=sections.map(function(s){
    var tc=counts[s.table];
    var hasErr=tc&&tc.err;
    var count=tc&&!hasErr?tc.count:null;
    if(!hasErr)connectedCount++; else warnCount++;
    var mCol=modeColor[s.mode]||'var(--muted)';
    return '<tr>'
      +'<td style="font-weight:600;font-size:13px">'+esc(s.label)+'</td>'
      +'<td><span style="padding:2px 9px;border-radius:12px;font-size:10.5px;font-weight:700;background:'+mCol+'22;color:'+mCol+';border:1px solid '+mCol+'44">'+modeIcon[s.mode]+' '+modeLabel[s.mode]+'</span></td>'
      +'<td style="font-size:12px;color:var(--muted);font-family:\'JetBrains Mono\',monospace">'+esc(s.table)+'</td>'
      +'<td style="font-family:\'JetBrains Mono\',monospace;font-size:12px">'+(hasErr?'<span style="color:#dc2626">'+esc(tc.err.substring(0,40))+'</span>':(count!==null?count+' rows':'--'))+'</td>'
      +'<td style="font-size:13px">'+(hasErr?'❌ Error':'✅ OK')+'</td>'
      +'<td style="font-size:11px;color:var(--muted)">'+esc(s.note)+'</td>'
    +'</tr>';
  }).join('');
  body.innerHTML='<div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">'
    +'<div style="background:#dcfce7;border:1px solid #86efac;border-radius:10px;padding:10px 18px;text-align:center"><div style="font-size:22px;font-weight:800;color:#16a34a">'+connectedCount+'</div><div style="font-size:10px;color:#16a34a;font-weight:700;text-transform:uppercase">Connected</div></div>'
    +(warnCount?'<div style="background:#fee2e2;border:1px solid #fca5a5;border-radius:10px;padding:10px 18px;text-align:center"><div style="font-size:22px;font-weight:800;color:#dc2626">'+warnCount+'</div><div style="font-size:10px;color:#dc2626;font-weight:700;text-transform:uppercase">Errors</div></div>':'')
    +'<div style="background:#e0e8f9;border:1px solid #bfcfed;border-radius:10px;padding:10px 18px;text-align:center"><div style="font-size:22px;font-weight:800;color:#1433a8">'+sections.length+'</div><div style="font-size:10px;color:#1433a8;font-weight:700;text-transform:uppercase">Sections</div></div>'
  +'</div>'
  +'<div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;min-width:580px"><thead><tr>'
    +'<th style="text-align:left;padding:9px 12px;background:var(--surface2);font-size:11.5px">Section</th>'
    +'<th style="text-align:left;padding:9px 12px;background:var(--surface2);font-size:11.5px">Mode</th>'
    +'<th style="text-align:left;padding:9px 12px;background:var(--surface2);font-size:11.5px">Table</th>'
    +'<th style="text-align:left;padding:9px 12px;background:var(--surface2);font-size:11.5px">Rows</th>'
    +'<th style="text-align:left;padding:9px 12px;background:var(--surface2);font-size:11.5px">Status</th>'
    +'<th style="text-align:left;padding:9px 12px;background:var(--surface2);font-size:11.5px">Notes</th>'
  +'</tr></thead><tbody>'+rows+'</tbody></table></div>'
  +(warnCount?'<div style="background:#fff8f0;border:1.5px solid #fde68a;border-radius:10px;padding:12px 16px;margin-top:14px;font-size:12px;color:#92400e">⚠️ '+warnCount+' table(s) returned errors -- they may not exist in Supabase yet.</div>':'');
}
function gnsiSaveSMSConfig(){
  if(!currentUser||currentUser.role!=='admin'){if(typeof showToast==='function')showToast('⛔ Only Administrators can change SMS config.','#dc2626');return;}
  var provider=(document.getElementById('sms-provider')||{}).value||'msg91';
  var apiKey=((document.getElementById('sms-api-key')||{}).value||'').trim();
  var senderId=((document.getElementById('sms-sender-id')||{}).value||'').trim();
  var templateId=((document.getElementById('sms-template-id')||{}).value||'').trim();
  var cfg={provider:provider,apiKey:apiKey,senderId:senderId,templateId:templateId};
  gnsiSave('gnsi_sms_config',cfg);
  if(typeof showToast==='function')showToast('SMS config saved','#16a34a');
}
function gnsiSavePayConfig(){
  if(!currentUser||currentUser.role!=='admin'){if(typeof showToast==='function')showToast('⛔ Only Administrators can change Payment config.','#dc2626');return;}
  var provider=(document.getElementById('pay-provider')||{}).value||'razorpay';
  var keyId=((document.getElementById('pay-key-id')||{}).value||'').trim();
  var keySecret=((document.getElementById('pay-key-secret')||{}).value||'').trim();
  var bizName=((document.getElementById('pay-biz-name')||{}).value||'GNSI').trim();
  var cfg={provider:provider,keyId:keyId,keySecret:keySecret,bizName:bizName};
  gnsiSave('gnsi_pay_config',cfg);
  if(typeof showToast==='function')showToast('Payment config saved','#16a34a');
  if(typeof render==='function')render();
}
// gnsiVerifySupabase -- full implementation at window.gnsiVerifySupabase (line 35154)
(function patchSync(){
  if(typeof renderSync==='undefined'){ setTimeout(patchSync,300); return; }
  var _oSync=renderSync;
  renderSync=function(){
    return _oSync()+'<div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:12px;padding:16px 20px;margin-top:16px">'
      +'<div style="font-weight:700;font-size:14px;color:#16a34a;margin-bottom:8px">🔍 Supabase Table Health Check</div>'
      +'<div style="font-size:12.5px;color:var(--muted);margin-bottom:12px">Verify all portal sections are properly connected to Supabase.</div>'
      +'<button class="btn btn-primary" onclick="gnsiVerifySupabase()" style="background:#16a34a">Run Health Check</button>'
      +'<button class="btn btn-primary" onclick="gnsiPushAllCredentialsToCloud()" style="background:#1433a8;margin-left:8px">☁️ Force Sync All Credentials</button>'
      +'<div style="font-size:11px;color:var(--muted);margin-top:6px">Run this after adding staff to ensure all credentials are in Supabase so staff can log in on any device.</div>'
      +'<div id="gnsi-supa-check" style="margin-top:14px"></div>'
    +'</div>';
  };
})();
// Teaching page now properly registered in PAGES array
(function injectStyles(){
  var style=document.createElement('style');
  style.textContent=`
    /* Attendance */
    .att-class-filter{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}
    .att-class-btn{padding:6px 14px;border-radius:20px;border:1.5px solid var(--border);background:var(--surface);color:var(--muted);cursor:pointer;font-size:12px;font-weight:500;font-family:'DM Sans',sans-serif;transition:all .15s}
    .att-class-btn.active,.att-class-btn:hover{background:var(--accent);border-color:var(--accent);color:#fff;font-weight:700}
    /* Timetable */
    .gnsi-page-timetable .card>div{overflow-x:auto!important;-webkit-overflow-scrolling:touch}
    .gnsi-page-timetable table{min-width:max-content;table-layout:auto;border-collapse:collapse;font-size:12px}
    .gnsi-page-timetable table th,.gnsi-page-timetable table td{max-width:130px;min-width:90px;padding:7px 8px!important;word-break:break-word;white-space:normal!important;vertical-align:top;font-size:11.5px!important}
    .gnsi-page-timetable table th:first-child,.gnsi-page-timetable table td:first-child{position:sticky;left:0;z-index:3;background:var(--surface);min-width:100px;max-width:110px}
    .gnsi-page-timetable table th:first-child{background:var(--accent);z-index:4;color:#fff}
    /* Staff arrangement */
    .sa-slot{display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid var(--border-soft)}
    .sa-slot-num{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0}
    .sa-slot-name{flex:1;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .sa-att-btn{padding:4px 10px;border-radius:8px;border:1.5px solid;cursor:pointer;font-size:11px;font-weight:700;font-family:'DM Sans',sans-serif;transition:all .15s;white-space:nowrap}
    .sa-edit-btn{background:var(--surface2);border:1px solid var(--border);color:var(--muted);border-radius:6px;padding:4px 8px;cursor:pointer;font-size:11px}
    /* Supabase check table */
    #gnsi-supa-check table tr:hover td{background:var(--surface2)}
    #gnsi-supa-check table td,#gnsi-supa-check table th{padding:9px 12px;border-bottom:1px solid var(--border-soft);font-size:12.5px}
    /* Fee search */
    .fee-search-bar{display:flex;align-items:center;gap:10px;background:var(--surface);border:1.5px solid var(--border);border-radius:10px;padding:8px 14px;margin-bottom:14px}
    .fee-search-bar input{flex:1;border:none;outline:none;font-size:13px;font-family:'Nunito',sans-serif;background:transparent;color:var(--text)}
    /* Freeze overlay already styled inline */
    /* Report nav buttons */
    #content button[onclick*="navigate"]:hover{background:var(--accent-light)!important;border-color:var(--accent)!important;color:var(--accent)!important}
  `;
  document.head.appendChild(style);
})();
// GNSI Portal v5.0 -- Unified Patch active
var _smTab = 'directory'; // active tab: directory | monitor | profile | analytics | remarks
var _smProfileId = null;  // staff ID for profile view
var _smRemarkStaff = null;
function smAttScan(staffId){
  // Scan all attendance keys for a staff member, return stats
  var allDates = {};
  Object.keys(attendance).forEach(function(k){
    var m = k.match(/^(\d{4}-\d{2}-\d{2})-S-/);
    if(m) allDates[m[1]] = true;
  });
  var dates = Object.keys(allDates).sort();
  var present=0,late=0,absent=0,earlyDep=0,leave=0;
  dates.forEach(function(d){
    var v = attendance[d+'-S-'+staffId]||'';
    if(v==='P') present++;
    else if(v==='L'){ present++; late++; }
    else if(v==='ED'){ present++; earlyDep++; }
    else if(v==='A') absent++;
    else if(v==='LV') leave++;
  });
  var total = dates.length||1;
  var rate = Math.round((present/total)*100);
  return {dates:dates,present:present,late:late,absent:absent,earlyDep:earlyDep,leave:leave,total:dates.length,rate:rate};
}
function smRiskLevel(rate, absents, lates){
  if(rate < 60 || absents > 10) return {label:'🔴 Critical', color:'#dc2626', bg:'#fee2e2'};
  if(rate < 75 || absents > 5 || lates > 8) return {label:'🟠 At Risk', color:'#ea580c', bg:'#fff7ed'};
  if(rate < 85 || lates > 4) return {label:'🟡 Watch', color:'#d97706', bg:'#fef9c3'};
  return {label:'🟢 Good', color:'#16a34a', bg:'#dcfce7'};
}
function smGetRemarks(staffId){
  try{ return JSON.parse(localStorage.getItem('gnsi_sm_remarks')||'{}')[staffId]||[]; }catch(e){ return []; }
}
function smSaveRemarks(staffId, arr){
  var all; try{ all=JSON.parse(localStorage.getItem('gnsi_sm_remarks')||'{}'); }catch(e){ all={}; }
  all[staffId]=arr;
  localStorage.setItem('gnsi_sm_remarks', JSON.stringify(all));if(typeof gnsiKVPush==='function')gnsiKVPush('gnsi_sm_remarks',all);
}
function smGetArrival(staffId, date){
  return attendance[(date||attDate)+'-Sx-'+staffId]||'';
}
(function patchStaffMonitor(){
  if(typeof renderStaff==='undefined'){ setTimeout(patchStaffMonitor,200); return; }
  var _orig = renderStaff;
  renderStaff = function(){
    var isAdmin = currentUser && (currentUser.role==='admin'||currentUser.role==='manager');
    // Tab bar
    var tabs = [
      {key:'directory', icon:'👥', label:'Directory'},
      {key:'monitor',   icon:'📊', label:'Live Monitor'},
      {key:'analytics', icon:'📈', label:'Analytics'},
      {key:'profile',   icon:'🔍', label:'Profile'},
      {key:'teaching',  icon:'📖', label:'Teaching Profile'},
      {key:'remarks',   icon:'📝', label:'Remarks'},
    ];
    var tabBar = '<div style="display:flex;gap:0;border-bottom:2px solid var(--border);margin-bottom:20px;overflow-x:auto">'
      + tabs.map(function(t){
          var a = _smTab===t.key;
          return '<button onclick="window._smTab=\''+t.key+'\';render()" style="padding:10px 20px;border:none;border-bottom:'+(a?'3px solid var(--accent)':'3px solid transparent')+';background:none;cursor:pointer;font-size:13px;font-weight:'+(a?700:500)+';color:'+(a?'var(--accent)':'var(--muted)')+';font-family:\'DM Sans\',sans-serif;margin-bottom:-2px;white-space:nowrap;transition:color .15s">'+t.icon+' '+t.label+'</button>';
        }).join('')
    +'</div>';
    if(_smTab==='directory') return tabBar + _orig();
    if(_smTab==='monitor')   return tabBar + smRenderMonitor();
    if(_smTab==='analytics') return tabBar + smRenderAnalytics();
    if(_smTab==='profile')   return tabBar + smRenderProfile();
    if(_smTab==='teaching')  return tabBar + smRenderTeachingProfile();
    if(_smTab==='remarks')   return tabBar + smRenderRemarks();
    return tabBar + _orig();
  };
})();
function smRenderMonitor(){
  var today = new Date().toISOString().split('T')[0];
  var activeStaff = staff.filter(function(s){ return s.status!=='Inactive'; });
  // Today's summary
  var todayPresent=0,todayLate=0,todayAbsent=0,todayLeave=0,todayUnmarked=0;
  activeStaff.forEach(function(s){
    var v=attendance[today+'-S-'+s.id]||'';
    if(v==='P')todayPresent++;
    else if(v==='L'){todayPresent++;todayLate++;}
    else if(v==='ED')todayPresent++;
    else if(v==='A')todayAbsent++;
    else if(v==='LV')todayLeave++;
    else todayUnmarked++;
  });
  var statCards = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px;margin-bottom:24px">'
    +'<div style="background:linear-gradient(135deg,#dcfce7,#bbf7d0);border:1.5px solid #86efac;border-radius:14px;padding:16px;text-align:center"><div style="font-size:28px;font-weight:800;color:#16a34a;font-family:\'Cormorant Garamond\',serif">'+todayPresent+'</div><div style="font-size:10.5px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:.08em">Present</div></div>'
    +'<div style="background:linear-gradient(135deg,#fef9c3,#fde68a);border:1.5px solid #fde047;border-radius:14px;padding:16px;text-align:center"><div style="font-size:28px;font-weight:800;color:#ca8a04;font-family:\'Cormorant Garamond\',serif">'+todayLate+'</div><div style="font-size:10.5px;font-weight:700;color:#ca8a04;text-transform:uppercase;letter-spacing:.08em">Late</div></div>'
    +'<div style="background:linear-gradient(135deg,#fee2e2,#fecaca);border:1.5px solid #fca5a5;border-radius:14px;padding:16px;text-align:center"><div style="font-size:28px;font-weight:800;color:#dc2626;font-family:\'Cormorant Garamond\',serif">'+todayAbsent+'</div><div style="font-size:10.5px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:.08em">Absent</div></div>'
    +'<div style="background:linear-gradient(135deg,#f3e8ff,#e9d5ff);border:1.5px solid #d8b4fe;border-radius:14px;padding:16px;text-align:center"><div style="font-size:28px;font-weight:800;color:#7c3aed;font-family:\'Cormorant Garamond\',serif">'+todayLeave+'</div><div style="font-size:10.5px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:.08em">On Leave</div></div>'
    +'<div style="background:linear-gradient(135deg,#f0f3fa,#e4eaf5);border:1.5px solid var(--border);border-radius:14px;padding:16px;text-align:center"><div style="font-size:28px;font-weight:800;color:var(--muted);font-family:\'Cormorant Garamond\',serif">'+todayUnmarked+'</div><div style="font-size:10.5px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em">Unmarked</div></div>'
  +'</div>';
  // Attendance rate bar
  var pct = activeStaff.length ? Math.round(todayPresent/activeStaff.length*100) : 0;
  var rateBar = '<div style="background:var(--surface2);border:1.5px solid var(--border-soft);border-radius:12px;padding:14px 18px;margin-bottom:22px">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">'
      +'<span style="font-size:13px;font-weight:700;color:var(--text)">Today\'s Attendance Rate</span>'
      +'<span style="font-size:14px;font-weight:800;color:'+(pct>=90?'#16a34a':pct>=75?'#d97706':'#dc2626')+'">'+pct+'%</span>'
    +'</div>'
    +'<div style="height:10px;background:var(--border);border-radius:20px;overflow:hidden">'
      +'<div style="height:100%;width:'+pct+'%;background:'+(pct>=90?'linear-gradient(90deg,#16a34a,#22c55e)':pct>=75?'linear-gradient(90deg,#d97706,#f59e0b)':'linear-gradient(90deg,#dc2626,#ef4444)')+';border-radius:20px;transition:width .5s ease"></div>'
    +'</div>'
    +'<div style="font-size:11px;color:var(--muted);margin-top:6px;font-family:\'JetBrains Mono\',monospace">'+todayPresent+' of '+activeStaff.length+' active staff accounted for</div>'
  +'</div>';
  // Staff monitor table -- sortable by risk
  var staffWithStats = activeStaff.map(function(s){
    var st = smAttScan(s.id);
    var risk = smRiskLevel(st.rate, st.absent, st.late);
    var todayStatus = attendance[today+'-S-'+s.id]||'';
    var arrival = smGetArrival(s.id, today);
    return {s:s, st:st, risk:risk, todayStatus:todayStatus, arrival:arrival};
  });
  // Sort: absent today first, then by risk, then by name
  staffWithStats.sort(function(a,b){
    var riskOrder = {'🔴 Critical':0,'🟠 At Risk':1,'🟡 Watch':2,'🟢 Good':3};
    var ra = riskOrder[a.risk.label]||3, rb = riskOrder[b.risk.label]||3;
    if(a.todayStatus==='A'&&b.todayStatus!=='A') return -1;
    if(b.todayStatus==='A'&&a.todayStatus!=='A') return 1;
    return ra-rb;
  });
  function statusPill(v){
    if(v==='P')  return '<span style="padding:2px 9px;border-radius:12px;font-size:10.5px;font-weight:700;background:#dcfce7;color:#16a34a;font-family:\'JetBrains Mono\',monospace">✓ Present</span>';
    if(v==='L')  return '<span style="padding:2px 9px;border-radius:12px;font-size:10.5px;font-weight:700;background:#fef9c3;color:#ca8a04;font-family:\'JetBrains Mono\',monospace">⏰ Late</span>';
    if(v==='ED') return '<span style="padding:2px 9px;border-radius:12px;font-size:10.5px;font-weight:700;background:#fff7ed;color:#ea580c;font-family:\'JetBrains Mono\',monospace">↩ Early Dep.</span>';
    if(v==='A')  return '<span style="padding:2px 9px;border-radius:12px;font-size:10.5px;font-weight:700;background:#fee2e2;color:#dc2626;font-family:\'JetBrains Mono\',monospace">✕ Absent</span>';
    if(v==='LV') return '<span style="padding:2px 9px;border-radius:12px;font-size:10.5px;font-weight:700;background:#f3e8ff;color:#7c3aed;font-family:\'JetBrains Mono\',monospace">📋 Leave</span>';
    return '<span style="padding:2px 9px;border-radius:12px;font-size:10.5px;font-weight:700;background:var(--surface3);color:var(--muted);font-family:\'JetBrains Mono\',monospace">-- Unmarked</span>';
  }
  var rows = staffWithStats.map(function(x){
    var s=x.s, st=x.st, risk=x.risk;
    var attBar = '<div style="display:flex;align-items:center;gap:6px">'
      +'<div style="flex:1;max-width:80px;height:6px;background:var(--border);border-radius:10px;overflow:hidden"><div style="height:100%;width:'+st.rate+'%;background:'+(st.rate>=85?'#16a34a':st.rate>=70?'#d97706':'#dc2626')+';border-radius:10px"></div></div>'
      +'<span style="font-size:11.5px;font-weight:700;color:'+(st.rate>=85?'#16a34a':st.rate>=70?'#d97706':'#dc2626')+';font-family:\'JetBrains Mono\',monospace">'+st.rate+'%</span>'
    +'</div>';
    return '<tr>'
      +'<td><div style="display:flex;align-items:center;gap:10px">'+(typeof avatarHTML==='function'?avatarHTML(s.name,32):'')+
        '<div><div style="font-weight:700;font-size:13px">'+esc(s.name)+'</div>'
        +'<div style="font-size:11px;color:var(--muted)">'+esc(s.role||'')+'</div></div></div></td>'
      +'<td>'+badge(s.dept, dc(s.dept))+'</td>'
      +'<td>'+statusPill(x.todayStatus)+'</td>'
      +'<td style="font-family:\'JetBrains Mono\',monospace;font-size:12px;color:'+(x.arrival?'var(--text)':'var(--muted2)')+'">'+( x.arrival||'--')+'</td>'
      +'<td>'+attBar+'</td>'
      +'<td style="text-align:center"><span style="font-family:\'JetBrains Mono\',monospace;font-size:12px;font-weight:700;color:#dc2626">'+st.absent+'</span></td>'
      +'<td style="text-align:center"><span style="font-family:\'JetBrains Mono\',monospace;font-size:12px;font-weight:700;color:#ca8a04">'+st.late+'</span></td>'
      +'<td><span style="padding:2px 10px;border-radius:12px;font-size:10.5px;font-weight:700;background:'+risk.bg+';color:'+risk.color+'">'+risk.label+'</span></td>'
      +'<td>'
        +'<button onclick="window._smTab=\'profile\';window._smProfileId='+parseInt(s.id,10)+';render()" style="padding:4px 10px;border-radius:7px;background:var(--accent-light);color:var(--accent);border:1px solid var(--accent);cursor:pointer;font-size:11px;font-weight:700;font-family:\'DM Sans\',sans-serif;margin-right:4px">🔍 View</button>'
        +'<button onclick="window._smTab=\'remarks\';window._smRemarkStaff='+parseInt(s.id,10)+';render()" style="padding:4px 10px;border-radius:7px;background:#fef9c3;color:#ca8a04;border:1px solid #fde047;cursor:pointer;font-size:11px;font-weight:700;font-family:\'DM Sans\',sans-serif">📝 Note</button>'
      +'</td>'
    +'</tr>';
  }).join('');
  // Critical alerts banner
  var critical = staffWithStats.filter(function(x){ return x.st.rate<75||x.todayStatus==='A'; });
  var alertBanner = '';
  if(critical.length){
    alertBanner = '<div style="background:linear-gradient(135deg,#fff8f0,#fef3dc);border:1.5px solid #fde68a;border-radius:12px;padding:14px 18px;margin-bottom:18px;display:flex;align-items:flex-start;gap:12px">'
      +'<div style="font-size:24px;flex-shrink:0">⚠️</div>'
      +'<div><div style="font-weight:700;font-size:13px;color:#92400e;margin-bottom:6px">'+critical.length+' Staff Member'+(critical.length>1?'s':'')+' Need Attention</div>'
      +'<div style="display:flex;flex-wrap:wrap;gap:8px">'
        +critical.slice(0,8).map(function(x){
          var reason = x.todayStatus==='A'?'Absent today':('Att. '+x.st.rate+'%');
          return '<div style="display:inline-flex;align-items:center;gap:5px;background:rgba(220,38,38,.08);border:1px solid #fca5a5;border-radius:20px;padding:3px 10px;font-size:11.5px;cursor:pointer" onclick="window._smTab=\'profile\';window._smProfileId='+x.s.id+';render()">'
            +(typeof avatarHTML==='function'?avatarHTML(x.s.name,18):'')
            +'<span style="font-weight:600;color:#dc2626">'+esc(x.s.name.split(' ')[0])+'</span>'
            +'<span style="color:#9ca3af;font-size:10px">'+reason+'</span>'
          +'</div>';
        }).join('')
      +'</div></div>'
    +'</div>';
  }
  return '<div class="page-header"><div class="page-header-eyebrow">GNSI -- STAFF MONITORING</div>'
    +'<div class="page-header-title">Live Staff Monitor</div>'
    +'<div class="page-header-sub">Today\'s attendance · Risk levels · Arrival times · Quick actions</div></div>'
    + alertBanner + statCards + rateBar
    +'<div class="card"><div class="card-head" style="background:linear-gradient(135deg,#0b1e6e,#1433a8)">'
      +'<span class="card-title" style="color:#fff">Staff Attendance Monitor -- '+today+'</span>'
      +'<span style="font-family:\'JetBrains Mono\',monospace;font-size:11px;color:rgba(255,255,255,.7)">'+activeStaff.length+' active staff</span>'
    +'</div>'
    +'<div style="overflow-x:auto"><table><thead><tr>'
      +'<th>Staff Member</th><th>Dept</th><th>Today</th><th>Arrival</th><th>Att. Rate</th><th style="text-align:center">Absent</th><th style="text-align:center">Late</th><th>Risk Level</th><th>Actions</th>'
    +'</tr></thead><tbody>'+rows+'</tbody></table></div></div>';
}
function smRenderAnalytics(){
  var activeStaff = staff.filter(function(s){ return s.status!=='Inactive'; });
  // Dept-wise attendance rates
  var deptStats = {};
  activeStaff.forEach(function(s){
    var dept = s.dept||'Other';
    if(!deptStats[dept]) deptStats[dept]={count:0,totalRate:0,critical:0};
    var st=smAttScan(s.id);
    deptStats[dept].count++;
    deptStats[dept].totalRate+=st.rate;
    if(st.rate<75) deptStats[dept].critical++;
  });
  var deptBars = Object.keys(deptStats).sort().map(function(dept){
    var d=deptStats[dept];
    var avgRate = d.count ? Math.round(d.totalRate/d.count) : 0;
    var col = DEPT_COLORS[dept]||'#7a7468';
    return '<div style="margin-bottom:14px">'
      +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px">'
        +'<div style="display:flex;align-items:center;gap:8px">'
          +'<div style="width:10px;height:10px;border-radius:50%;background:'+col+'"></div>'
          +'<span style="font-size:13px;font-weight:600;color:var(--text)">'+esc(dept)+'</span>'
          +'<span style="font-size:11px;color:var(--muted)">'+d.count+' staff</span>'
        +'</div>'
        +'<div style="display:flex;align-items:center;gap:10px">'
          +(d.critical?'<span style="font-size:11px;color:#dc2626;font-weight:700">⚠ '+d.critical+' critical</span>':'')
          +'<span style="font-size:13px;font-weight:800;color:'+(avgRate>=85?'#16a34a':avgRate>=70?'#d97706':'#dc2626')+';font-family:\'JetBrains Mono\',monospace">'+avgRate+'%</span>'
        +'</div>'
      +'</div>'
      +'<div style="height:10px;background:var(--border);border-radius:20px;overflow:hidden">'
        +'<div style="height:100%;width:'+avgRate+'%;background:'+col+';border-radius:20px;transition:width .5s ease;opacity:.85"></div>'
      +'</div>'
    +'</div>';
  }).join('');
  // Top 5 performers + bottom 5 concern
  var allStats = activeStaff.map(function(s){
    var st=smAttScan(s.id);
    return {s:s,st:st};
  }).sort(function(a,b){ return b.st.rate-a.st.rate; });
  var top5 = allStats.slice(0,5);
  var bottom5 = allStats.slice(-5).reverse();
  function perfRow(x, rank, isTop){
    var col = isTop?'#16a34a':'#dc2626';
    var bg  = isTop?'#f0fdf4':'#fff8f8';
    return '<div style="display:flex;align-items:center;gap:12px;padding:10px 16px;border-bottom:1px solid var(--border-soft);background:'+(rank===0?bg:'')+'transition:background .15s">'
      +'<div style="width:28px;height:28px;border-radius:50%;background:'+(isTop?col+'22':'#fee2e2')+';display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:'+col+';">'+(rank<3?(isTop?['🥇','🥈','🥉'][rank]:['⚠','‼','!'][rank]):'#'+(rank+1))+'</div>'
      +(typeof avatarHTML==='function'?avatarHTML(x.s.name,32):'')
      +'<div style="flex:1;min-width:0"><div style="font-weight:700;font-size:13px">'+esc(x.s.name)+'</div><div style="font-size:11px;color:var(--muted)">'+esc(x.s.dept||x.s.role||'')+'</div></div>'
      +'<div style="text-align:right">'
        +'<div style="font-size:18px;font-weight:800;color:'+col+';font-family:\'Cormorant Garamond\',serif">'+x.st.rate+'%</div>'
        +'<div style="font-size:10px;color:var(--muted);font-family:\'JetBrains Mono\',monospace">'+x.st.present+' / '+x.st.total+' days</div>'
      +'</div>'
      +'<button onclick="window._smTab=\'profile\';window._smProfileId='+x.s.id+';render()" style="padding:4px 9px;border-radius:7px;background:var(--surface2);color:var(--muted);border:1px solid var(--border);cursor:pointer;font-size:11px;font-weight:600;font-family:\'DM Sans\',sans-serif;flex-shrink:0">View</button>'
    +'</div>';
  }
  // Monthly trend (last 6 months overall rate)
  var now = new Date();
  var months = [];
  for(var i=5;i>=0;i--){
    var d = new Date(now.getFullYear(), now.getMonth()-i, 1);
    var yy = d.getFullYear(), mm = String(d.getMonth()+1).padStart(2,'0');
    var prefix = yy+'-'+mm;
    // Count attendance for this month
    var daysInMonth = Object.keys(attendance).filter(function(k){ return k.startsWith(prefix)&&k.includes('-S-'); })
      .map(function(k){ return k.split('-S-')[0]; });
    var uniqDays = [...new Set(daysInMonth)];
    var totalSlots = uniqDays.length * activeStaff.length;
    var presentSlots = 0;
    uniqDays.forEach(function(day){
      activeStaff.forEach(function(s){
        var v=attendance[day+'-S-'+s.id]||'';
        if(v==='P'||v==='L'||v==='ED') presentSlots++;
      });
    });
    var rate = totalSlots ? Math.round(presentSlots/totalSlots*100) : 0;
    months.push({label:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()], rate:rate, days:uniqDays.length});
  }
  var maxRate = Math.max.apply(null, months.map(function(m){return m.rate;}))||100;
  var trendBars = '<div style="display:flex;align-items:flex-end;gap:8px;height:100px;padding:0 4px">'
    + months.map(function(m){
        var h = m.rate ? Math.max(8,Math.round(m.rate/maxRate*88)) : 4;
        var col = m.rate>=85?'#16a34a':m.rate>=70?'#d97706':'#dc2626';
        return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">'
          +'<div style="font-size:10px;font-weight:700;color:'+col+';font-family:\'JetBrains Mono\',monospace">'+(m.days?m.rate+'%':'--')+'</div>'
          +'<div style="width:100%;height:'+h+'px;background:'+col+';border-radius:6px 6px 0 0;opacity:.85;transition:height .5s ease"></div>'
          +'<div style="font-size:10px;color:var(--muted);font-family:\'JetBrains Mono\',monospace">'+m.label+'</div>'
        +'</div>';
      }).join('')
  +'</div>';
  return '<div class="page-header"><div class="page-header-eyebrow">GNSI -- STAFF ANALYTICS</div>'
    +'<div class="page-header-title">Attendance Analytics</div>'
    +'<div class="page-header-sub">Department rates · Top performers · Concern staff · Monthly trend</div></div>'
    +'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;margin-bottom:20px">'
      // Dept chart
      +'<div class="card"><div class="card-head"><span class="card-title">📊 Department-wise Attendance Rate</span></div>'
        +'<div style="padding:16px 20px">'+deptBars+'</div>'
      +'</div>'
      // Monthly trend
      +'<div class="card"><div class="card-head"><span class="card-title">📅 Monthly Attendance Trend (6 months)</span></div>'
        +'<div style="padding:20px 20px 12px">'
          + trendBars
          +'<div style="margin-top:8px;font-size:11px;color:var(--muted);font-family:\'JetBrains Mono\',monospace;text-align:center">Based on recorded attendance data</div>'
        +'</div>'
      +'</div>'
    +'</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">'
      // Top performers
      +'<div class="card"><div class="card-head" style="background:linear-gradient(135deg,#f0fdf4,#dcfce7)">'
        +'<span class="card-title" style="color:#16a34a">🏆 Top 5 Performers</span>'
      +'</div>'
        + top5.map(function(x,i){ return perfRow(x,i,true); }).join('')
      +'</div>'
      // Concern staff
      +'<div class="card"><div class="card-head" style="background:linear-gradient(135deg,#fff8f0,#fee2e2)">'
        +'<span class="card-title" style="color:#dc2626">⚠️ Concern Staff (Bottom 5)</span>'
      +'</div>'
        + bottom5.map(function(x,i){ return perfRow(x,i,false); }).join('')
      +'</div>'
    +'</div>';
}
function smRenderProfile(){
  // Staff selector if no profile selected
  var selector = '<div style="margin-bottom:20px">'
    +'<div style="font-size:13px;font-weight:600;color:var(--muted);margin-bottom:8px">Select Staff Member:</div>'
    +'<div style="display:flex;flex-wrap:wrap;gap:8px">'
    + staff.filter(function(s){return s.status!=='Inactive';}).map(function(s){
        var active = _smProfileId===s.id;
        return '<button onclick="window._smProfileId='+parseInt(s.id,10)+';render()" style="display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:20px;border:1.5px solid '+(active?'var(--accent)':'var(--border)')+';background:'+(active?'var(--accent-light)':'var(--surface)')+';cursor:pointer;font-size:12.5px;font-weight:'+(active?700:500)+';color:'+(active?'var(--accent)':'var(--muted)')+';transition:all .15s">'
          +(typeof avatarHTML==='function'?avatarHTML(s.name,20):'')
          +esc(s.name.split(' ')[0])+'</button>';
      }).join('')
    +'</div></div>';
  if(!_smProfileId){
    return '<div class="page-header"><div class="page-header-eyebrow">GNSI -- STAFF PROFILE</div>'
      +'<div class="page-header-title">Individual Profile</div>'
      +'<div class="page-header-sub">Full attendance history · Performance score · Remarks</div></div>'
      + selector
      +'<div style="text-align:center;padding:60px;color:var(--muted)">Select a staff member above to view their full profile.</div>';
  }
  var s = staff.find(function(x){ return x.id===_smProfileId; });
  if(!s) return selector+'<div style="text-align:center;padding:40px;color:var(--muted)">Staff not found.</div>';
  var st = smAttScan(s.id);
  var risk = smRiskLevel(st.rate, st.absent, st.late);
  var remarks = smGetRemarks(s.id);
  // Attendance heatmap -- last 60 days
  var heatmapDays = 60;
  var heatDays = [];
  for(var i=heatmapDays-1;i>=0;i--){
    var d=new Date(); d.setDate(d.getDate()-i);
    var ds=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    var v=attendance[ds+'-S-'+s.id]||'';
    heatDays.push({date:ds,v:v});
  }
  var cellColor = function(v){
    if(v==='P')  return '#16a34a';
    if(v==='L')  return '#ca8a04';
    if(v==='ED') return '#ea580c';
    if(v==='A')  return '#dc2626';
    if(v==='LV') return '#7c3aed';
    return 'var(--border)';
  };
  var heatmap = '<div style="margin-bottom:20px">'
    +'<div style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px;font-family:\'JetBrains Mono\',monospace">📅 Attendance Heatmap -- Last 60 Days</div>'
    +'<div style="display:flex;flex-wrap:wrap;gap:3px">'
    + heatDays.map(function(d){
        var col=cellColor(d.v);
        var label=d.v||'No record';
        return '<div title="'+d.date+' -- '+label+'" style="width:16px;height:16px;border-radius:3px;background:'+col+';cursor:default;transition:transform .1s" onmouseenter="this.style.transform=\'scale(1.4)\'" onmouseleave="this.style.transform=\'scale(1)\'"></div>';
      }).join('')
    +'</div>'
    +'<div style="display:flex;gap:14px;margin-top:8px;flex-wrap:wrap">'
      +'<div style="display:flex;align-items:center;gap:4px"><div style="width:12px;height:12px;border-radius:2px;background:#16a34a"></div><span style="font-size:10.5px;color:var(--muted)">Present</span></div>'
      +'<div style="display:flex;align-items:center;gap:4px"><div style="width:12px;height:12px;border-radius:2px;background:#ca8a04"></div><span style="font-size:10.5px;color:var(--muted)">Late</span></div>'
      +'<div style="display:flex;align-items:center;gap:4px"><div style="width:12px;height:12px;border-radius:2px;background:#dc2626"></div><span style="font-size:10.5px;color:var(--muted)">Absent</span></div>'
      +'<div style="display:flex;align-items:center;gap:4px"><div style="width:12px;height:12px;border-radius:2px;background:#7c3aed"></div><span style="font-size:10.5px;color:var(--muted)">Leave</span></div>'
      +'<div style="display:flex;align-items:center;gap:4px"><div style="width:12px;height:12px;border-radius:2px;background:var(--border)"></div><span style="font-size:10.5px;color:var(--muted)">No record</span></div>'
    +'</div>'
  +'</div>';
  // Score calculation
  var score = Math.max(0, Math.min(100, st.rate - (st.late*2) - (st.earlyDep*3) - (st.absent*4)));
  // KPI cards
  var kpis = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:10px;margin-bottom:20px">'
    +'<div style="background:var(--surface2);border:1.5px solid var(--border-soft);border-radius:12px;padding:12px;text-align:center"><div style="font-size:22px;font-weight:800;color:'+(st.rate>=85?'#16a34a':st.rate>=70?'#d97706':'#dc2626')+';font-family:\'Cormorant Garamond\',serif">'+st.rate+'%</div><div style="font-size:10px;color:var(--muted);font-weight:700;text-transform:uppercase;margin-top:2px">Att. Rate</div></div>'
    +'<div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:12px;padding:12px;text-align:center"><div style="font-size:22px;font-weight:800;color:#16a34a;font-family:\'Cormorant Garamond\',serif">'+st.present+'</div><div style="font-size:10px;color:#16a34a;font-weight:700;text-transform:uppercase;margin-top:2px">Present</div></div>'
    +'<div style="background:#fee2e2;border:1.5px solid #fca5a5;border-radius:12px;padding:12px;text-align:center"><div style="font-size:22px;font-weight:800;color:#dc2626;font-family:\'Cormorant Garamond\',serif">'+st.absent+'</div><div style="font-size:10px;color:#dc2626;font-weight:700;text-transform:uppercase;margin-top:2px">Absent</div></div>'
    +'<div style="background:#fef9c3;border:1.5px solid #fde047;border-radius:12px;padding:12px;text-align:center"><div style="font-size:22px;font-weight:800;color:#ca8a04;font-family:\'Cormorant Garamond\',serif">'+st.late+'</div><div style="font-size:10px;color:#ca8a04;font-weight:700;text-transform:uppercase;margin-top:2px">Late</div></div>'
    +'<div style="background:#f3e8ff;border:1.5px solid #d8b4fe;border-radius:12px;padding:12px;text-align:center"><div style="font-size:22px;font-weight:800;color:#7c3aed;font-family:\'Cormorant Garamond\',serif">'+st.leave+'</div><div style="font-size:10px;color:#7c3aed;font-weight:700;text-transform:uppercase;margin-top:2px">Leave</div></div>'
    +'<div style="background:linear-gradient(135deg,'+(score>=75?'#f0fdf4':'#fff8f0')+','+(score>=75?'#dcfce7':'#fee2e2')+');border:1.5px solid '+(score>=75?'#86efac':'#fca5a5')+';border-radius:12px;padding:12px;text-align:center"><div style="font-size:22px;font-weight:800;color:'+(score>=75?'#16a34a':score>=50?'#d97706':'#dc2626')+';font-family:\'Cormorant Garamond\',serif">'+score+'</div><div style="font-size:10px;color:var(--muted);font-weight:700;text-transform:uppercase;margin-top:2px">Score</div></div>'
  +'</div>';
  // Latest 10 attendance records
  var recentDates = st.dates.slice(-10).reverse();
  var recentRows = recentDates.map(function(d){
    var v=attendance[d+'-S-'+s.id]||'';
    var arr=attendance[d+'-Sx-'+s.id]||'';
    var dep=attendance[d+'-Sd-'+s.id]||'';
    var col=cellColor(v)||'var(--muted)';
    var lbl=v==='P'?'Present':v==='L'?'Late':v==='ED'?'Early Dep':v==='A'?'Absent':v==='LV'?'On Leave':'--';
    return '<tr>'
      +'<td style="font-family:\'JetBrains Mono\',monospace;font-size:12px">'+d+'</td>'
      +'<td><span style="padding:2px 9px;border-radius:12px;font-size:11px;font-weight:700;background:'+col+'22;color:'+col+'">'+lbl+'</span></td>'
      +'<td style="font-family:\'JetBrains Mono\',monospace;font-size:12px;color:var(--muted)">'+( arr||'--')+'</td>'
      +'<td style="font-family:\'JetBrains Mono\',monospace;font-size:12px;color:var(--muted)">'+( dep||'--')+'</td>'
    +'</tr>';
  }).join('');
  // Remarks
  var recentRemarks = remarks.slice(0,5).map(function(r){
    return '<div style="background:var(--surface2);border-left:3px solid '+(r.type==='warning'?'#dc2626':r.type==='commend'?'#16a34a':'#d97706')+';border-radius:0 8px 8px 0;padding:10px 14px;margin-bottom:8px">'
      +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px">'
        +'<span style="font-size:11px;font-weight:700;color:'+(r.type==='warning'?'#dc2626':r.type==='commend'?'#16a34a':'#d97706')+';">'+(r.type==='warning'?'⚠ Warning':r.type==='commend'?'🌟 Commendation':'📌 Note')+'</span>'
        +'<span style="font-size:10.5px;color:var(--muted);font-family:\'JetBrains Mono\',monospace">'+esc(r.date||'')+'</span>'
      +'</div>'
      +'<div style="font-size:12.5px;color:var(--text)">'+esc(r.text)+'</div>'
      +'<div style="font-size:11px;color:var(--muted);margin-top:3px">-- '+esc(r.by||'Admin')+'</div>'
    +'</div>';
  }).join('');
  return '<div class="page-header"><div class="page-header-eyebrow">GNSI -- STAFF PROFILE</div>'
    +'<div class="page-header-title">'+esc(s.name)+'</div>'
    +'<div class="page-header-sub">'+esc(s.role||'')+(s.dept?' · '+esc(s.dept):'')+'</div></div>'
    + selector
    +'<div style="display:grid;grid-template-columns:300px 1fr;gap:16px;margin-bottom:20px">'
      // Left: Staff card
      +'<div class="card" style="height:fit-content">'
        +'<div style="background:linear-gradient(160deg,#0b1e6e,#1433a8);border-radius:var(--radius) var(--radius) 0 0;padding:24px;text-align:center">'
          +(typeof avatarHTML==='function'?'<div style="display:flex;justify-content:center;margin-bottom:10px">'+avatarHTML(s.name,64)+'</div>':'')
          +'<div style="font-family:\'Playfair Display\',serif;font-size:18px;font-weight:700;color:#fff">'+esc(s.name)+'</div>'
          +'<div style="font-size:12px;color:rgba(255,255,255,.7);margin-top:4px">'+esc(s.role||'')+'</div>'
          +'<div style="margin-top:10px"><span style="padding:3px 12px;border-radius:12px;font-size:11px;font-weight:700;background:'+risk.bg+';color:'+risk.color+'">'+risk.label+'</span></div>'
        +'</div>'
        +'<div style="padding:16px">'
          +'<div style="display:flex;flex-direction:column;gap:8px;font-size:12.5px">'
            +'<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-soft)"><span style="color:var(--muted)">Department</span><span style="font-weight:600">'+esc(s.dept||'--')+'</span></div>'
            +'<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-soft)"><span style="color:var(--muted)">Status</span><span style="font-weight:600;color:'+(s.status==='Active'?'#16a34a':'#dc2626')+'">'+esc(s.status||'--')+'</span></div>'
            +'<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-soft)"><span style="color:var(--muted)">Phone</span><span style="font-family:\'JetBrains Mono\',monospace;font-size:12px">'+esc(s.phone||'--')+'</span></div>'
            +'<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-soft)"><span style="color:var(--muted)">Days Tracked</span><span style="font-weight:700">'+st.total+'</span></div>'
            +'<div style="display:flex;justify-content:space-between;padding:6px 0"><span style="color:var(--muted)">Remarks</span><span style="font-weight:700">'+remarks.length+'</span></div>'
          +'</div>'
          +'<button onclick="window._smTab=\'remarks\';window._smRemarkStaff='+parseInt(s.id,10)+';render()" style="width:100%;margin-top:14px;padding:9px;border-radius:9px;background:var(--accent);color:#fff;border:none;cursor:pointer;font-size:13px;font-weight:700;font-family:\'DM Sans\',sans-serif">📝 Add Remark</button>'
        +'</div>'
      +'</div>'
      // Right: KPIs + heatmap + recent records
      +'<div>'
        + kpis + heatmap
        +'<div class="card"><div class="card-head"><span class="card-title">Recent Attendance (Last 10 Days)</span></div>'
          +'<div style="overflow-x:auto"><table><thead><tr><th>Date</th><th>Status</th><th>Arrival</th><th>Departure</th></tr></thead>'
          +'<tbody>'+(recentRows||'<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--muted)">No attendance recorded yet.</td></tr>')+'</tbody></table></div>'
        +'</div>'
        +(recentRemarks?'<div style="margin-top:14px"><div style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px;font-family:\'JetBrains Mono\',monospace">Recent Remarks</div>'+recentRemarks+'</div>':'')
      +'</div>'
    +'</div>';
}
function smRenderRemarks(){
  // Staff selector
  var selector = '<div style="margin-bottom:20px">'
    +'<div style="font-size:13px;font-weight:600;color:var(--muted);margin-bottom:8px">Select Staff Member:</div>'
    +'<div style="display:flex;flex-wrap:wrap;gap:8px">'
    + staff.filter(function(s){return s.status!=='Inactive';}).map(function(s){
        var active = _smRemarkStaff===s.id;
        var rCount = smGetRemarks(s.id).length;
        return '<button onclick="window._smRemarkStaff='+parseInt(s.id,10)+';render()" style="display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:20px;border:1.5px solid '+(active?'var(--accent)':'var(--border)')+';background:'+(active?'var(--accent-light)':'var(--surface)')+';cursor:pointer;font-size:12.5px;font-weight:'+(active?700:500)+';color:'+(active?'var(--accent)':'var(--muted)')+';transition:all .15s">'
          +(typeof avatarHTML==='function'?avatarHTML(s.name,20):'')
          +esc(s.name.split(' ')[0])
          +(rCount?'<span style="background:'+(active?'var(--accent)':'#e0e8f9')+';color:'+(active?'#fff':'var(--accent)')+';border-radius:10px;padding:1px 7px;font-size:10px;font-weight:800">'+rCount+'</span>':'')
        +'</button>';
      }).join('')
    +'</div></div>';
  if(!_smRemarkStaff){
    return '<div class="page-header"><div class="page-header-eyebrow">GNSI -- REMARKS</div>'
      +'<div class="page-header-title">Staff Remarks &amp; Warnings</div>'
      +'<div class="page-header-sub">Add warnings · commendations · notes per staff member</div></div>'
      + selector
      +'<div style="text-align:center;padding:60px;color:var(--muted)">Select a staff member above to view or add remarks.</div>';
  }
  var s = staff.find(function(x){ return x.id===_smRemarkStaff; });
  if(!s) return selector;
  var remarks = smGetRemarks(s.id);
  var addForm = '<div class="form-panel" style="margin-bottom:20px;border-color:var(--accent)">'
    +'<div class="form-title" style="color:var(--accent)">➕ Add Remark / Warning for '+esc(s.name)+'</div>'
    +'<div class="form-grid g3" style="margin-bottom:14px">'
      +'<div class="form-group"><label>Type</label><select id="sm-rem-type" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:9px 12px;font-family:\'DM Sans\',sans-serif;font-size:13px;background:var(--surface);color:var(--text)">'
        +'<option value="note">📌 General Note</option>'
        +'<option value="warning">⚠️ Warning</option>'
        +'<option value="commend">🌟 Commendation</option>'
      +'</select></div>'
      +'<div class="form-group" style="grid-column:1/-1"><label>Remark *</label><textarea id="sm-rem-text" rows="3" placeholder="Enter remark details..." style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:9px 12px;font-family:\'DM Sans\',sans-serif;font-size:13px;background:var(--surface);color:var(--text);resize:vertical;outline:none"></textarea></div>'
    +'</div>'
    +'<div class="form-actions"><button class="btn btn-primary" onclick="smAddRemark('+parseInt(s.id,10)+')">Save Remark</button></div>'
  +'</div>';
  var remarkCards = remarks.length
    ? remarks.map(function(r,i){
        var typeColor = r.type==='warning'?'#dc2626':r.type==='commend'?'#16a34a':'#d97706';
        var typeBg    = r.type==='warning'?'#fee2e2':r.type==='commend'?'#f0fdf4':'#fef9c3';
        var typeLabel = r.type==='warning'?'⚠️ Warning':r.type==='commend'?'🌟 Commendation':'📌 Note';
        return '<div style="background:var(--surface);border:1.5px solid var(--border-soft);border-radius:12px;padding:16px 18px;margin-bottom:10px;border-left:4px solid '+typeColor+'">'
          +'<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">'
            +'<div style="flex:1">'
              +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">'
                +'<span style="padding:2px 10px;border-radius:12px;font-size:11px;font-weight:700;background:'+typeBg+';color:'+typeColor+'">'+typeLabel+'</span>'
                +'<span style="font-size:11px;color:var(--muted);font-family:\'JetBrains Mono\',monospace">'+esc(r.date||'')+'</span>'
              +'</div>'
              +'<div style="font-size:13.5px;color:var(--text);line-height:1.6">'+esc(r.text)+'</div>'
              +'<div style="font-size:11.5px;color:var(--muted);margin-top:6px">Recorded by: <b>'+esc(r.by||'Admin')+'</b></div>'
            +'</div>'
            +'<button onclick="smDeleteRemark('+parseInt(s.id,10)+','+i+')" style="background:none;border:none;color:var(--muted2);cursor:pointer;font-size:16px;flex-shrink:0" title="Delete">✕</button>'
          +'</div>'
        +'</div>';
      }).join('')
    : '<div style="text-align:center;padding:40px;color:var(--muted)">No remarks recorded for this staff member yet.</div>';
  return '<div class="page-header"><div class="page-header-eyebrow">GNSI -- REMARKS</div>'
    +'<div class="page-header-title">Remarks: '+esc(s.name)+'</div>'
    +'<div class="page-header-sub">'+esc(s.role||'')+(s.dept?' · '+esc(s.dept):'')+'</div></div>'
    + selector + addForm
    +'<div><div style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;margin-bottom:12px;font-family:\'JetBrains Mono\',monospace">'+remarks.length+' Remark'+(remarks.length!==1?'s':'')+' on record</div>'
    + remarkCards
    +'</div>';
}
window.smAddRemark = function(staffId){
  var text = ((document.getElementById('sm-rem-text')||{}).value||'').trim();
  var type = ((document.getElementById('sm-rem-type')||{}).value||'note');
  if(!text){ alert('Please enter remark text.'); return; }
  var arr = smGetRemarks(staffId);
  arr.unshift({
    type: type,
    text: text,
    date: new Date().toISOString().split('T')[0],
    by:   currentUser ? currentUser.name : 'Admin'
  });
  smSaveRemarks(staffId, arr);
  if(typeof render==='function') render();
  if(typeof showToast==='function') showToast('Remark saved','#16a34a');
};
window.smDeleteRemark = function(staffId, idx){
  if(!confirm('Delete this remark?')) return;
  var arr = smGetRemarks(staffId);
  arr.splice(idx, 1);
  smSaveRemarks(staffId, arr);
  if(typeof render==='function') render();
};
var _smTpStaffId  = null;  // selected teacher ID
var _smTpDate     = new Date().toISOString().split('T')[0]; // selected date
var _smTpEditDate = null;  // date being edited
function tpLoad(staffId){
  try{ return JSON.parse(localStorage.getItem('gnsi_tp_'+staffId)||'{}'); }catch(e){ return {}; }
}
function tpSave(staffId, data){
  localStorage.setItem('gnsi_tp_'+staffId, JSON.stringify(data));if(typeof gnsiKVPush==='function')gnsiKVPush('gnsi_tp_'+staffId,data);
}
function tpGetDay(staffId, date){
  var all = tpLoad(staffId);
  return all[date] || null;
}
function tpSetDay(staffId, date, dayObj){
  var all = tpLoad(staffId);
  all[date] = dayObj;
  tpSave(staffId, all);
}
function getTeachingStaff(){
  return (staff||[]).filter(function(s){
    return s.status !== 'Inactive' && (
      (s.dept||'').toLowerCase() === 'teaching' ||
      (s.role||'').toLowerCase().includes('teacher') ||
      (s.role||'').toLowerCase().includes('sir') ||
      (s.role||'').toLowerCase().includes('madam') ||
      (s.role||'').toLowerCase().includes('master') ||
      (s.role||'').toLowerCase().includes('mistress')
    );
  });
}
var TP_SUBJECTS = ['Mathematics','English','Science','Social Studies','Hindi','GK / Current Affairs',
  'Reasoning','Mental Ability','Computer','Drawing','Physical Education','Sanskrit','Other'];
var TP_PERIODS = ['P1','P2','P3','P4','P5','P6','P7','P8'];
function smRenderTeachingProfile(){
  var teachers = getTeachingStaff();
  // Staff selector chips
  var selector = '<div style="margin-bottom:20px">'
    +'<div style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;margin-bottom:10px;font-family:\'JetBrains Mono\',monospace">Select Teaching Staff Member</div>'
    +'<div style="display:flex;flex-wrap:wrap;gap:8px">'
    + (teachers.length ? teachers.map(function(s){
        var active = _smTpStaffId === s.id;
        var all = tpLoad(s.id);
        var daysLogged = Object.keys(all).length;
        return '<button onclick="window._smTpStaffId='+parseInt(s.id,10)+';render()" '
          +'style="display:flex;align-items:center;gap:7px;padding:7px 14px;border-radius:22px;border:1.5px solid '+(active?'var(--accent)':'var(--border)')+';background:'+(active?'var(--accent)':'var(--surface)')+';cursor:pointer;font-size:12.5px;font-weight:'+(active?700:500)+';color:'+(active?'#fff':'var(--muted)')+';transition:all .15s">'
          +(typeof avatarHTML==='function'?avatarHTML(s.name,22):'')
          +'<span>'+esc(s.name.split(' ')[0])+'</span>'
          +(daysLogged?'<span style="background:'+(active?'rgba(255,255,255,.25)':'var(--accent-light)')+';color:'+(active?'#fff':'var(--accent)')+';border-radius:10px;padding:1px 7px;font-size:10px;font-weight:800">'+daysLogged+'d</span>':'')
        +'</button>';
      }).join('') : '<div style="color:var(--muted);font-size:13px">No teaching staff found. Make sure staff have "Teaching" department or teacher role.</div>')
    +'</div>'
  +'</div>';
  if(!_smTpStaffId){
    return '<div class="page-header"><div class="page-header-eyebrow">GNSI -- TEACHING PROFILE</div>'
      +'<div class="page-header-title">Daily Teaching Profile</div>'
      +'<div class="page-header-sub">Per-teacher · Per-day · Periods · Topics · Homework · Observations</div></div>'
      + selector
      +'<div style="text-align:center;padding:60px;color:var(--muted);font-size:13px">👆 Select a teacher above to view or log their daily teaching profile.</div>';
  }
  var teacher = staff.find(function(x){ return x.id===_smTpStaffId; });
  if(!teacher) return selector;
  var all = tpLoad(teacher.id);
  var today = new Date().toISOString().split('T')[0];
  // Date navigation -- last 14 days
  var dateNav = tpBuildDateNav(teacher.id);
  // Day data for selected date
  var dayData = tpGetDay(teacher.id, _smTpDate) || {};
  var isEditing = _smTpEditDate === _smTpDate;
  var content = isEditing
    ? tpRenderDayForm(teacher, _smTpDate, dayData)
    : tpRenderDayView(teacher, _smTpDate, dayData);
  // Summary strip
  var allDays   = Object.keys(all);
  var totalDays = allDays.length;
  var totalPeriods = allDays.reduce(function(s,d){ return s + ((all[d].periods||[]).filter(function(p){return p.taught;}).length); }, 0);
  var hwCount  = allDays.reduce(function(s,d){ return s + ((all[d].periods||[]).filter(function(p){return p.homework;}).length); }, 0);
  var avgRating = totalDays
    ? Math.round(allDays.reduce(function(s,d){ return s + (parseFloat(all[d].selfRating||0)); },0) / totalDays * 10)/10
    : 0;
  var summaryStrip = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:10px;margin-bottom:20px">'
    +'<div style="background:var(--surface2);border:1.5px solid var(--border-soft);border-radius:12px;padding:12px;text-align:center"><div style="font-size:22px;font-weight:800;color:var(--accent);font-family:\'Cormorant Garamond\',serif">'+totalDays+'</div><div style="font-size:10px;color:var(--muted);font-weight:700;text-transform:uppercase;margin-top:2px">Days Logged</div></div>'
    +'<div style="background:#e0e8f9;border:1.5px solid #bfcfed;border-radius:12px;padding:12px;text-align:center"><div style="font-size:22px;font-weight:800;color:var(--accent);font-family:\'Cormorant Garamond\',serif">'+totalPeriods+'</div><div style="font-size:10px;color:var(--accent);font-weight:700;text-transform:uppercase;margin-top:2px">Periods Taught</div></div>'
    +'<div style="background:#fef9c3;border:1.5px solid #fde047;border-radius:12px;padding:12px;text-align:center"><div style="font-size:22px;font-weight:800;color:#ca8a04;font-family:\'Cormorant Garamond\',serif">'+hwCount+'</div><div style="font-size:10px;color:#ca8a04;font-weight:700;text-transform:uppercase;margin-top:2px">Homework Given</div></div>'
    +'<div style="background:'+(avgRating>=4?'#f0fdf4':avgRating>=3?'#fef9c3':'#fff8f0')+';border:1.5px solid '+(avgRating>=4?'#86efac':avgRating>=3?'#fde047':'#fdba74')+';border-radius:12px;padding:12px;text-align:center"><div style="font-size:22px;font-weight:800;color:'+(avgRating>=4?'#16a34a':avgRating>=3?'#ca8a04':'#ea580c')+';font-family:\'Cormorant Garamond\',serif">'+(avgRating||'--')+'</div><div style="font-size:10px;color:var(--muted);font-weight:700;text-transform:uppercase;margin-top:2px">Avg. Self-Rating</div></div>'
  +'</div>';
  return '<div class="page-header"><div class="page-header-eyebrow">GNSI -- TEACHING PROFILE</div>'
    +'<div class="page-header-title">'+esc(teacher.name)+'</div>'
    +'<div class="page-header-sub">'+esc(teacher.role||'Teacher')+(teacher.dept?' · '+esc(teacher.dept):'')+'</div></div>'
    + selector + summaryStrip + dateNav + content;
}
function tpBuildDateNav(staffId){
  var all = tpLoad(staffId);
  var days = [];
  for(var i=13;i>=0;i--){
    var d = new Date(); d.setDate(d.getDate()-i);
    var ds = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    var dow = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
    var dd  = String(d.getDate()).padStart(2,'0');
    var hasData = !!all[ds];
    var isToday = ds === new Date().toISOString().split('T')[0];
    var isSelected = ds === _smTpDate;
    days.push({ds:ds, dow:dow, dd:dd, hasData:hasData, isToday:isToday, isSelected:isSelected});
  }
  return '<div style="margin-bottom:20px">'
    +'<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px;font-family:\'JetBrains Mono\',monospace">📅 Select Date (Last 14 Days)</div>'
    +'<div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:4px">'
    + days.map(function(d){
        var bg = d.isSelected ? 'var(--accent)' : d.hasData ? '#e0e8f9' : 'var(--surface2)';
        var col = d.isSelected ? '#fff' : d.hasData ? 'var(--accent)' : 'var(--muted)';
        var bdr = d.isSelected ? 'var(--accent)' : d.hasData ? '#bfcfed' : 'var(--border)';
        return '<button onclick="window._smTpDate=\''+d.ds+'\';window._smTpEditDate=null;render()" '
          +'style="flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 10px;border-radius:10px;border:1.5px solid '+bdr+';background:'+bg+';cursor:pointer;min-width:52px;transition:all .15s;position:relative">'
          +(d.isToday?'<div style="position:absolute;top:-4px;right:-4px;width:8px;height:8px;border-radius:50%;background:#ef4444;border:2px solid var(--surface)"></div>':'')
          +'<div style="font-size:10px;font-weight:700;color:'+col+';font-family:\'JetBrains Mono\',monospace">'+d.dow+'</div>'
          +'<div style="font-size:16px;font-weight:800;color:'+col+';font-family:\'Cormorant Garamond\',serif">'+d.dd+'</div>'
          +(d.hasData?'<div style="width:6px;height:6px;border-radius:50%;background:'+(d.isSelected?'rgba(255,255,255,.7)':'var(--accent)')+'"></div>':'<div style="width:6px;height:6px"></div>')
        +'</button>';
      }).join('')
    +'</div>'
    +'<div style="font-size:11px;color:var(--muted);margin-top:6px;font-family:\'JetBrains Mono\',monospace">🔴 Today &nbsp;·&nbsp; 🔵 Dot = data logged &nbsp;·&nbsp; Selected: <b>'+_smTpDate+'</b></div>'
  +'</div>';
}
function tpRenderDayView(teacher, date, dayData){
  var hasPeriods = dayData.periods && dayData.periods.length;
  var isToday = date === new Date().toISOString().split('T')[0];
  var isAdmin = currentUser && (currentUser.role==='admin'||currentUser.role==='manager');
  var canEdit = isAdmin || (currentUser && currentUser.name === teacher.name);
  if(!hasPeriods && !dayData.prepNote && !dayData.adminObs){
    return '<div style="background:var(--surface2);border:2px dashed var(--border);border-radius:14px;padding:40px;text-align:center">'
      +'<div style="font-size:40px;margin-bottom:12px">📋</div>'
      +'<div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:6px">No teaching log for '+date+'</div>'
      +'<div style="font-size:13px;color:var(--muted);margin-bottom:18px">'+(isToday?'Log today\'s teaching activity.':'No entry was logged for this date.')+'</div>'
      +(canEdit?'<button onclick="window._smTpEditDate=\''+date+'\';render()" style="background:var(--accent);color:#fff;border:none;border-radius:10px;padding:11px 28px;cursor:pointer;font-size:13px;font-weight:700;font-family:\'DM Sans\',sans-serif">📝 Log Teaching Day</button>':'')
    +'</div>';
  }
  // Period summary
  var periods = dayData.periods || [];
  var taughtCount = periods.filter(function(p){ return p.taught; }).length;
  var hwCount2 = periods.filter(function(p){ return p.homework; }).length;
  var ratingColor = dayData.selfRating>=4?'#16a34a':dayData.selfRating>=3?'#d97706':'#dc2626';
  var stars = '';
  for(var i=1;i<=5;i++) stars += '<span style="font-size:18px;color:'+(i<=dayData.selfRating?'#f59e0b':'#d1d5db')+'">★</span>';
  var periodCards = periods.length
    ? '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px;margin-bottom:16px">'
      + periods.map(function(p){
          var col = p.taught ? '#1433a8' : '#9ca3af';
          var bg  = p.taught ? '#e0e8f9' : 'var(--surface3)';
          return '<div style="background:var(--surface);border:1.5px solid '+(p.taught?'#bfcfed':'var(--border-soft)')+';border-radius:12px;padding:14px 16px">'
            +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">'
              +'<span style="padding:3px 10px;border-radius:10px;font-size:11px;font-weight:800;background:'+bg+';color:'+col+';font-family:\'JetBrains Mono\',monospace">'+esc(p.period)+'</span>'
              +'<div style="display:flex;gap:6px">'
                +(p.taught?'<span style="font-size:10.5px;padding:2px 7px;border-radius:8px;background:#dcfce7;color:#16a34a;font-weight:700">✓ Taught</span>':'<span style="font-size:10.5px;padding:2px 7px;border-radius:8px;background:#fee2e2;color:#dc2626;font-weight:700">✕ Not Taught</span>')
                +(p.homework?'<span style="font-size:10.5px;padding:2px 7px;border-radius:8px;background:#fef9c3;color:#ca8a04;font-weight:700">📋 HW</span>':'')
              +'</div>'
            +'</div>'
            +(p.subject?'<div style="font-size:12.5px;font-weight:700;color:var(--text);margin-bottom:4px">'+esc(p.subject)+'</div>':'')
            +(p.topic?'<div style="font-size:12px;color:var(--muted)">📌 '+esc(p.topic)+'</div>':'')
            +(p.classname?'<div style="font-size:11.5px;color:var(--muted);margin-top:3px">🏫 '+esc(p.classname)+'</div>':'')
            +(p.studentsCount?'<div style="font-size:11.5px;color:var(--muted);margin-top:3px">👥 '+esc(p.studentsCount)+' students</div>':'')
            +(p.issues?'<div style="font-size:11.5px;color:#dc2626;margin-top:4px;background:#fff5f5;border-radius:6px;padding:4px 8px">⚠ '+esc(p.issues)+'</div>':'')
            +(p.homeworkNote?'<div style="font-size:11.5px;color:#ca8a04;margin-top:4px">📝 HW: '+esc(p.homeworkNote)+'</div>':'')
          +'</div>';
        }).join('')
      +'</div>'
    : '';
  return '<div>'
    // Top action bar
    +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">'
      +'<div style="font-size:14px;font-weight:700;color:var(--text)">Teaching Log -- <span style="color:var(--accent)">'+date+'</span></div>'
      +(canEdit?'<div style="display:flex;gap:8px">'
        +'<button onclick="window._smTpEditDate=\''+date+'\';render()" style="padding:7px 16px;border-radius:9px;background:var(--accent-light);color:var(--accent);border:1.5px solid var(--accent);cursor:pointer;font-size:12px;font-weight:700;font-family:\'DM Sans\',sans-serif">✏ Edit</button>'
        +'<button onclick="tpDeleteDay('+teacher.id+',\''+date+'\')" style="padding:7px 12px;border-radius:9px;background:#fee2e2;color:#dc2626;border:1.5px solid #fca5a5;cursor:pointer;font-size:12px;font-weight:700;font-family:\'DM Sans\',sans-serif">🗑 Delete</button>'
      +'</div>':'')
    +'</div>'
    // KPI mini bar
    +'<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px">'
      +'<div style="background:#e0e8f9;border-radius:10px;padding:8px 14px;display:flex;align-items:center;gap:6px"><span style="font-size:18px;font-weight:800;color:var(--accent)">'+taughtCount+'</span><span style="font-size:11px;color:var(--accent);font-weight:700;text-transform:uppercase">Periods Taught</span></div>'
      +'<div style="background:#fef9c3;border-radius:10px;padding:8px 14px;display:flex;align-items:center;gap:6px"><span style="font-size:18px;font-weight:800;color:#ca8a04">'+hwCount2+'</span><span style="font-size:11px;color:#ca8a04;font-weight:700;text-transform:uppercase">Homework Given</span></div>'
      +(dayData.selfRating?'<div style="background:#f3e8ff;border-radius:10px;padding:8px 14px;display:flex;align-items:center;gap:6px">'+stars+'<span style="font-size:13px;font-weight:800;color:'+ratingColor+'">'+dayData.selfRating+'/5</span></div>':'')
    +'</div>'
    + periodCards
    // Prep note + admin observation
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">'
      +(dayData.prepNote?'<div style="background:#eff6ff;border:1.5px solid #93c5fd;border-radius:12px;padding:14px 16px"><div style="font-size:11px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;font-family:\'JetBrains Mono\',monospace">📚 Preparation Notes</div><div style="font-size:13px;color:var(--text);line-height:1.6">'+esc(dayData.prepNote)+'</div></div>':'')
      +(dayData.challenges?'<div style="background:#fff8f0;border:1.5px solid #fdba74;border-radius:12px;padding:14px 16px"><div style="font-size:11px;font-weight:700;color:#ea580c;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;font-family:\'JetBrains Mono\',monospace">⚠ Challenges / Issues</div><div style="font-size:13px;color:var(--text);line-height:1.6">'+esc(dayData.challenges)+'</div></div>':'')
      +(dayData.adminObs?'<div style="background:linear-gradient(135deg,#fdf4ff,#f3e8ff);border:1.5px solid #d8b4fe;border-radius:12px;padding:14px 16px"><div style="font-size:11px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;font-family:\'JetBrains Mono\',monospace">🔍 Admin Observation</div><div style="font-size:13px;color:var(--text);line-height:1.6">'+esc(dayData.adminObs)+'</div><div style="font-size:11px;color:var(--muted);margin-top:6px">-- '+esc(dayData.adminObsBy||'Admin')+'</div></div>':'')
      +(dayData.improvement?'<div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:12px;padding:14px 16px"><div style="font-size:11px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;font-family:\'JetBrains Mono\',monospace">💡 Plan for Improvement</div><div style="font-size:13px;color:var(--text);line-height:1.6">'+esc(dayData.improvement)+'</div></div>':'')
    +'</div>'
  +'</div>';
}
function tpRenderDayForm(teacher, date, dayData){
  var isAdmin = currentUser && (currentUser.role==='admin'||currentUser.role==='manager');
  var periods = dayData.periods || TP_PERIODS.map(function(p){ return {period:p,taught:false,subject:'',topic:'',classname:'',studentsCount:'',homework:false,homeworkNote:'',issues:''}; });
  // Ensure 8 period slots
  while(periods.length < TP_PERIODS.length){
    periods.push({period:TP_PERIODS[periods.length],taught:false,subject:'',topic:'',classname:'',studentsCount:'',homework:false,homeworkNote:'',issues:''});
  }
  var subjectOpts = TP_SUBJECTS.map(function(s){ return '<option value="'+s+'">'+s+'</option>'; }).join('');
  var periodForms = periods.map(function(p, i){
    return '<div class="tp-period-card" id="tppc-'+i+'" style="background:var(--surface);border:1.5px solid '+(p.taught?'#bfcfed':'var(--border-soft)')+';border-radius:12px;margin-bottom:10px;overflow:hidden">'
      // Period header
      +'<div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:'+(p.taught?'#eff6ff':'var(--surface2)')+';cursor:pointer" onclick="tpTogglePeriod('+i+')">'
        +'<div style="width:36px;height:36px;border-radius:50%;background:'+(p.taught?'var(--accent)':'var(--border)')+';display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:'+(p.taught?'#fff':'var(--muted)')+';font-family:\'JetBrains Mono\',monospace;flex-shrink:0">'+esc(p.period)+'</div>'
        +'<div style="flex:1;min-width:0">'
          +(p.taught&&p.subject?'<div style="font-size:13px;font-weight:700;color:var(--text)">'+esc(p.subject)+(p.topic?' -- '+esc(p.topic):'')+'</div>':'<div style="font-size:13px;color:var(--muted);font-style:italic">Click to expand</div>')
        +'</div>'
        +'<label style="display:flex;align-items:center;gap:6px;cursor:pointer;flex-shrink:0" onclick="event.stopPropagation()">'
          +'<input type="checkbox" id="tp-taught-'+i+'" '+(p.taught?'checked':'')+' onchange="tpToggleTaught('+i+',this.checked)" style="width:16px;height:16px;cursor:pointer"/>'
          +'<span style="font-size:12px;font-weight:700;color:'+(p.taught?'#16a34a':'var(--muted)')+'">Taught</span>'
        +'</label>'
      +'</div>'
      // Period detail fields
      +'<div id="tppc-body-'+i+'" style="padding:12px 14px;display:'+(p.taught?'grid':'none')+';grid-template-columns:1fr 1fr;gap:10px">'
        +'<div class="form-group"><label style="font-size:11.5px">Subject</label>'
          +'<select id="tp-sub-'+i+'" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:7px 10px;font-family:\'DM Sans\',sans-serif;font-size:12.5px;background:var(--surface);color:var(--text)">'
          +'<option value="">-- Select --</option>'+subjectOpts.replace('value="'+(p.subject||'')+'"','value="'+(p.subject||'')+'" selected')
          +'</select></div>'
        +'<div class="form-group"><label style="font-size:11.5px">Topic Covered</label>'
          +'<input id="tp-topic-'+i+'" value="'+esc(p.topic||'')+'" placeholder="e.g. Fractions" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:7px 10px;font-family:\'DM Sans\',sans-serif;font-size:12.5px;background:var(--surface);color:var(--text)"/></div>'
        +'<div class="form-group"><label style="font-size:11.5px">Class / Batch</label>'
          +'<input id="tp-cls-'+i+'" value="'+esc(p.classname||'')+'" placeholder="e.g. Sainik Old" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:7px 10px;font-family:\'DM Sans\',sans-serif;font-size:12.5px;background:var(--surface);color:var(--text)"/></div>'
        +'<div class="form-group"><label style="font-size:11.5px">Students Present</label>'
          +'<input id="tp-stu-'+i+'" value="'+esc(p.studentsCount||'')+'" placeholder="e.g. 28" type="number" min="0" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:7px 10px;font-family:\'DM Sans\',sans-serif;font-size:12.5px;background:var(--surface);color:var(--text)"/></div>'
        +'<div class="form-group" style="grid-column:1/-1"><label style="font-size:11.5px;display:flex;align-items:center;gap:8px">'
          +'<input type="checkbox" id="tp-hw-'+i+'" '+(p.homework?'checked':'')+' onchange="document.getElementById(\'tp-hwt-'+i+'\').style.display=this.checked?\'block\':\'none\'" style="width:14px;height:14px;cursor:pointer"/>'
          +'Homework / Assignment Given'
          +'</label>'
          +'<input id="tp-hwt-'+i+'" value="'+esc(p.homeworkNote||'')+'" placeholder="Describe homework given…" style="display:'+(p.homework?'block':'none')+';width:100%;border:1.5px solid #fde047;border-radius:8px;padding:7px 10px;font-family:\'DM Sans\',sans-serif;font-size:12.5px;background:#fffbeb;color:var(--text);margin-top:6px"/>'
        +'</div>'
        +'<div class="form-group" style="grid-column:1/-1"><label style="font-size:11.5px;color:#dc2626">⚠ Issues / Misbehaviour (if any)</label>'
          +'<input id="tp-iss-'+i+'" value="'+esc(p.issues||'')+'" placeholder="e.g. 3 students absent without reason" style="width:100%;border:1.5px solid #fca5a5;border-radius:8px;padding:7px 10px;font-family:\'DM Sans\',sans-serif;font-size:12.5px;background:#fff5f5;color:var(--text)"/>'
        +'</div>'
      +'</div>'
    +'</div>';
  }).join('');
  return '<div>'
    +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">'
      +'<div style="font-size:14px;font-weight:700;color:var(--text)">📝 Logging: <span style="color:var(--accent)">'+date+'</span></div>'
      +'<button onclick="window._smTpEditDate=null;render()" style="padding:6px 14px;border-radius:8px;background:var(--surface2);color:var(--muted);border:1.5px solid var(--border);cursor:pointer;font-size:12px;font-weight:600;font-family:\'DM Sans\',sans-serif">✕ Cancel</button>'
    +'</div>'
    +'<div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:10px;padding:10px 16px;margin-bottom:16px;font-size:12.5px;color:#1e40af;display:flex;align-items:center;gap:8px">💡 <b>Tip:</b> Check "Taught" to expand a period. Fill subject, topic, class and any issues.</div>'
    // Periods
    +'<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;margin-bottom:10px;font-family:\'JetBrains Mono\',monospace">📚 Period-wise Teaching Log</div>'
    + periodForms
    // General fields
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px">'
      +'<div class="form-group"><label>Self-Rating (1–5 ★)</label>'
        +'<select id="tp-rating" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:9px 12px;font-family:\'DM Sans\',sans-serif;font-size:13px;background:var(--surface);color:var(--text)">'
          +'<option value="">-- Rate your day --</option>'
          +'<option value="5"'+(dayData.selfRating==5?' selected':'')+'>★★★★★ 5 -- Excellent</option>'
          +'<option value="4"'+(dayData.selfRating==4?' selected':'')+'>★★★★☆ 4 -- Good</option>'
          +'<option value="3"'+(dayData.selfRating==3?' selected':'')+'>★★★☆☆ 3 -- Average</option>'
          +'<option value="2"'+(dayData.selfRating==2?' selected':'')+'>★★☆☆☆ 2 -- Below Average</option>'
          +'<option value="1"'+(dayData.selfRating==1?' selected':'')+'>★☆☆☆☆ 1 -- Poor</option>'
        +'</select>'
      +'</div>'
      +'<div class="form-group"><label>Challenges Faced Today</label>'
        +'<input id="tp-challenges" value="'+esc(dayData.challenges||'')+'" placeholder="Any difficulties encountered…" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:9px 12px;font-family:\'DM Sans\',sans-serif;font-size:13px;background:var(--surface);color:var(--text)"/>'
      +'</div>'
      +'<div class="form-group" style="grid-column:1/-1"><label>Preparation Notes / Tomorrow\'s Plan</label>'
        +'<textarea id="tp-prep" rows="2" placeholder="Topics prepared, resources used, plan for next day…" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:9px 12px;font-family:\'DM Sans\',sans-serif;font-size:13px;background:var(--surface);color:var(--text);resize:vertical;outline:none">'+esc(dayData.prepNote||'')+'</textarea>'
      +'</div>'
      +'<div class="form-group" style="grid-column:1/-1"><label>Plan for Improvement</label>'
        +'<input id="tp-improve" value="'+esc(dayData.improvement||'')+'" placeholder="What will you do better tomorrow?" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:9px 12px;font-family:\'DM Sans\',sans-serif;font-size:13px;background:var(--surface);color:var(--text)"/>'
      +'</div>'
      +(isAdmin
        ?'<div class="form-group" style="grid-column:1/-1;border-top:2px dashed var(--border);padding-top:14px;margin-top:4px"><label style="color:#7c3aed">🔍 Admin Observation (Admin only)</label>'
          +'<textarea id="tp-obs" rows="2" placeholder="Admin observation, feedback, or instruction for this teacher on this day…" style="width:100%;border:1.5px solid #d8b4fe;border-radius:8px;padding:9px 12px;font-family:\'DM Sans\',sans-serif;font-size:13px;background:#faf5ff;color:var(--text);resize:vertical;outline:none">'+esc(dayData.adminObs||'')+'</textarea>'
        +'</div>'
        :'')
    +'</div>'
    +'<div style="display:flex;gap:10px;margin-top:18px">'
      +'<button onclick="tpSaveDay('+teacher.id+',\''+date+'\')" style="background:var(--accent);color:#fff;border:none;border-radius:10px;padding:11px 28px;cursor:pointer;font-size:13px;font-weight:700;font-family:\'DM Sans\',sans-serif">💾 Save Teaching Log</button>'
      +'<button onclick="window._smTpEditDate=null;render()" style="background:var(--surface2);color:var(--muted);border:1.5px solid var(--border);border-radius:10px;padding:11px 20px;cursor:pointer;font-size:13px;font-weight:600;font-family:\'DM Sans\',sans-serif">Cancel</button>'
    +'</div>'
  +'</div>';
}
window.tpTogglePeriod = function(idx){
  var body = document.getElementById('tppc-body-'+idx);
  if(body) body.style.display = body.style.display==='none' ? 'grid' : 'none';
};
window.tpToggleTaught = function(idx, checked){
  var body = document.getElementById('tppc-body-'+idx);
  if(body) body.style.display = checked ? 'grid' : 'none';
  var card = document.getElementById('tppc-'+idx);
  if(card){ card.style.borderColor = checked ? '#bfcfed' : 'var(--border-soft)'; }
};
window.tpSaveDay = function(staffId, date){
  var periods = [];
  TP_PERIODS.forEach(function(pLabel, i){
    var taught = !!(document.getElementById('tp-taught-'+i)||{}).checked;
    periods.push({
      period:       pLabel,
      taught:       taught,
      subject:      ((document.getElementById('tp-sub-'+i)||{}).value||'').trim(),
      topic:        ((document.getElementById('tp-topic-'+i)||{}).value||'').trim(),
      classname:    ((document.getElementById('tp-cls-'+i)||{}).value||'').trim(),
      studentsCount:((document.getElementById('tp-stu-'+i)||{}).value||'').trim(),
      homework:     !!(document.getElementById('tp-hw-'+i)||{}).checked,
      homeworkNote: ((document.getElementById('tp-hwt-'+i)||{}).value||'').trim(),
      issues:       ((document.getElementById('tp-iss-'+i)||{}).value||'').trim(),
    });
  });
  var dayObj = {
    periods:    periods,
    selfRating: parseFloat((document.getElementById('tp-rating')||{}).value||0)||0,
    challenges: ((document.getElementById('tp-challenges')||{}).value||'').trim(),
    prepNote:   ((document.getElementById('tp-prep')||{}).value||'').trim(),
    improvement:((document.getElementById('tp-improve')||{}).value||'').trim(),
    adminObs:   ((document.getElementById('tp-obs')||{}).value||'').trim(),
    adminObsBy: currentUser ? currentUser.name : 'Admin',
    savedAt:    new Date().toISOString(),
    savedBy:    currentUser ? currentUser.name : '',
  };
  tpSetDay(staffId, date, dayObj);
  window._smTpEditDate = null;
  if(typeof render==='function') render();
  if(typeof showToast==='function') showToast('Teaching log saved for '+date,'#16a34a');
};
window.tpDeleteDay = function(staffId, date){
  if(!confirm('Delete teaching log for '+date+'?')) return;
  var all = tpLoad(staffId);
  delete all[date];
  tpSave(staffId, all);
  if(typeof render==='function') render();
  if(typeof showToast==='function') showToast('Log deleted','#dc2626');
};
} catch(e){ (void 0); }
</script>
<script>
try {
function loadLessonPlans(){try{var s=localStorage.getItem('gnsi_lesson_plans');return s?JSON.parse(s):{};}catch(e){return{};}}
function saveLessonPlans(data){localStorage.setItem('gnsi_lesson_plans',JSON.stringify(data));if(typeof gnsiKVPush==='function')gnsiKVPush('gnsi_lesson_plans',data);}
var facActiveTab='dashboard';
var facSelectedTeacher='';
var facSelectedDate=new Date().toISOString().split('T')[0];
var facPlanFormOpen=false;
var facEditPlanId=null;
var facReviewFilter='all';
var facProfileId=null;
var facDashWeekOffset=0;
var facAIMessages=[];      // AI Coach chat history
var facAILoading=false;    // AI typing indicator
var facGoalEdit=false;     // Goals edit mode
function getFacultyStaff(){
  return staff.filter(function(s){
    var r=(s.role||'').toLowerCase();var d=(s.dept||'').toLowerCase();
    return d==='teaching'||r.includes('teacher')||r.includes('concern')||r.includes('lecturer')||r.includes()||r.includes('pgt')||r.includes('tgt')||r.includes('prt')||r.includes('hod');
  });
}
function esc2(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function facToast(msg,col){var t=document.createElement('div');t.textContent=msg;t.className='gnsi-inline-toast';t.style.cssText='position:fixed;bottom:28px;right:28px;background:'+(col||'#1433a8')+';color:#fff;padding:12px 22px;border-radius:10px;font-weight:700;font-size:13px;z-index:99999;box-shadow:0 4px 20px rgba(0,0,0,0.25)';document.body.appendChild(t);setTimeout(function(){t.remove();},2800);}
function facToday(){return new Date().toISOString().split('T')[0];}
function facDateLabel(d){try{return new Date(d+'T00:00:00').toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric'});}catch(e){return d;}}
function facGetWeekDates(ref){var d=new Date(ref+'T00:00:00');var day=d.getDay();var mon=new Date(d);mon.setDate(d.getDate()-((day+6)%7));var dates=[];for(var i=0;i<6;i++){var dd=new Date(mon);dd.setDate(mon.getDate()+i);dates.push(dd.toISOString().split('T')[0]);}return dates;}
function facCheckPlan(p){
  var w=[];
  if(!p.topic||p.topic.trim().length<3)w.push({level:'danger',msg:'No topic / title entered'});
  else if(p.topic.trim().length<10)w.push({level:'warning',msg:'Topic too brief -- add more detail'});
  if(!p.objective||p.objective.trim().length<5)w.push({level:'warning',msg:'Learning objective not stated'});
  if(!p.homework||p.homework.trim().length<3)w.push({level:'info',msg:'No homework / assignment mentioned'});
  if(!p.content||p.content.trim().length<5)w.push({level:'warning',msg:'Content covered section is empty'});
  return w;
}
function facPlanScore(p){if(!p)return 0;var sc=100;facCheckPlan(p).forEach(function(w){sc-=w.level==='danger'?40:w.level==='warning'?20:5;});return Math.max(0,sc);}
function facScoreColor(sc){return sc>=80?'#16a34a':sc>=50?'#c9870a':'#c0291d';}
function facScoreLabel(sc){return sc>=80?'✅ Complete':sc>=50?'⚠️ Partial':sc>0?'🔴 Poor':'❌ Missing';}
function facNextId(plans){var ids=[];Object.values(plans).forEach(function(dp){Object.values(dp).forEach(function(arr){arr.forEach(function(p){ids.push(p.id||0);});});});return ids.length?Math.max.apply(null,ids)+1:1;}
function facSavePlan(){
  var tid=(document.getElementById('fp-teacher')||{}).value||'';
  var date=(document.getElementById('fp-date')||{}).value||'';
  var cls=(document.getElementById('fp-class')||{}).value||'';
  var subj=(document.getElementById('fp-subject')||{}).value||'';
  var period=(document.getElementById('fp-period')||{}).value||'';
  var topic=((document.getElementById('fp-topic')||{}).value||'').trim();
  var obj=((document.getElementById('fp-objective')||{}).value||'').trim();
  var content=((document.getElementById('fp-content')||{}).value||'').trim();
  var hw=((document.getElementById('fp-homework')||{}).value||'').trim();
  var rem=((document.getElementById('fp-remarks')||{}).value||'').trim();
  var method=(document.getElementById('fp-method')||{}).value||'';
  if(!tid||!date||!cls||!subj||!topic){facToast('⚠️ Teacher, Date, Class, Subject and Topic are required','#c0291d');return;}
  var plans=loadLessonPlans();
  if(!plans[tid])plans[tid]={};
  if(!plans[tid][date])plans[tid][date]=[];
  var now=new Date().toISOString();
  if(facEditPlanId){
    plans[tid][date]=plans[tid][date].map(function(p){return p.id===facEditPlanId?Object.assign({},p,{cls:cls,subject:subj,period:period,topic:topic,objective:obj,content:content,homework:hw,remarks:rem,methodology:method,updatedAt:now,approvedBy:null,approvedAt:null}):p;});
    facToast('✅ Lesson plan updated','#16a34a');
  } else {
    var np={id:facNextId(plans),teacherId:tid,date:date,cls:cls,subject:subj,period:period,topic:topic,objective:obj,content:content,homework:hw,remarks:rem,methodology:method,createdAt:now,updatedAt:now};
    plans[tid][date].push(np);
    var warns=facCheckPlan(np).filter(function(w){return w.level==='danger';});
    facToast(warns.length?'⚠️ Saved with warnings -- please complete all fields!':'✅ Lesson plan saved',warns.length?'#c9870a':'#16a34a');
  }
  saveLessonPlans(plans);facPlanFormOpen=false;facEditPlanId=null;navigate();
}
function facDeletePlan(tid,date,pid){
  var plans=loadLessonPlans();
  if(plans[tid]&&plans[tid][date]){plans[tid][date]=plans[tid][date].filter(function(p){return p.id!==pid;});saveLessonPlans(plans);facToast('🗑 Plan deleted','#c0291d');navigate();}
}
function facOpenEdit(tid,date,pid){facPlanFormOpen=true;facEditPlanId=pid;facSelectedTeacher=String(tid);facSelectedDate=date;facActiveTab='plans';navigate();}
function facApprovePlan(tid,date,pid){if(!currentUser)return;var plans=loadLessonPlans();if(plans[tid]&&plans[tid][date]){plans[tid][date]=plans[tid][date].map(function(p){if(p.id!==pid)return p;if(p.approvedBy)return Object.assign({},p,{approvedBy:null,approvedAt:null});return Object.assign({},p,{approvedBy:currentUser.name||currentUser.role,approvedAt:new Date().toISOString()});});saveLessonPlans(plans);facToast('✅ Approval status updated','#16a34a');navigate();}}
function facPrintPlans(tid,date){var fac=getFacultyStaff();var plans=loadLessonPlans();var f=fac.find(function(x){return String(x.id)===String(tid);});var dayPlans=(plans[tid]&&plans[tid][date])||[];var html='<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Lesson Plans -- GNSI</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#111;font-size:13px;max-width:900px;margin:0 auto}h1{font-size:20px;margin:0 0 4px;color:#1433a8}h2{font-size:13px;color:#555;margin:0 0 20px;font-weight:400;border-bottom:1px solid #ddd;padding-bottom:8px}.plan{border:2px solid #1433a8;border-radius:8px;margin-bottom:18px;overflow:hidden;page-break-inside:avoid}.ph{background:#1433a8;color:#fff;padding:10px 16px}.ph strong{font-size:14px}.ph span{font-size:11px;opacity:.85}.pb{padding:14px 16px;display:grid;grid-template-columns:1fr 1fr;gap:14px}.lbl{font-size:10px;font-weight:700;text-transform:uppercase;color:#666;margin-bottom:3px;letter-spacing:.05em}.val{font-size:13px;color:#111;line-height:1.4}.appr{color:#16a34a;font-weight:700}.no-plans{padding:30px;text-align:center;color:#888;font-size:15px}.footer{margin-top:24px;font-size:10px;color:#aaa;border-top:1px solid #eee;padding-top:8px}@media print{body{padding:0}.no-print{display:none}}</style></head><body>'+'<h1>📝 Lesson Plan Report -- GNSI</h1><h2>'+(f?esc2(f.name)+' &nbsp;·&nbsp; '+esc2(f.role):'Faculty')+' &nbsp;|&nbsp; '+facDateLabel(date)+'</h2>'+(dayPlans.length?dayPlans.map(function(p,pi){return'<div class="plan"><div class="ph"><strong>'+esc2(p.topic||'No topic')+'</strong>&nbsp; <span>'+esc2(p.cls)+' · '+esc2(p.subject)+' · '+esc2(p.period)+'&nbsp;|&nbsp;Method: '+esc2(p.methodology||'--')+'</span></div><div class="pb"><div><div class="lbl">🎯 Learning Objective</div><div class="val">'+(p.objective||'<em style="color:#c0291d">Not provided</em>')+'</div></div><div><div class="lbl">📖 Content Covered</div><div class="val">'+(p.content||'<em style="color:#c0291d">Empty</em>')+'</div></div><div><div class="lbl">📋 Homework / Assignment</div><div class="val">'+(p.homework||'<em style="color:#c9870a">None assigned</em>')+'</div></div><div><div class="lbl">💬 Remarks / Observations</div><div class="val">'+(p.remarks||'--')+'</div></div>'+(p.approvedBy?'<div style="grid-column:1/-1"><div class="lbl">✅ Admin Approval</div><div class="val appr">Approved by '+esc2(p.approvedBy)+' &nbsp;·&nbsp; '+new Date(p.approvedAt).toLocaleString("en-IN")+'</div></div>':'<div style="grid-column:1/-1"><div class="lbl">⬜ Admin Approval</div><div class="val" style="color:#c9870a">Pending approval</div></div>')+'</div></div>';}).join(''):'<div class="no-plans">⚠️ No lesson plans submitted for this date.</div>')+'<div class="footer no-print"><button onclick="window.print()" style="margin-bottom:8px;padding:6px 18px;background:#1433a8;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px">🖨 Print</button><br>Printed: '+new Date().toLocaleString("en-IN")+' &nbsp;|&nbsp; GNSI Management Software</div></body></html>';var w=window.open('','_blank');if(w){w.document.write(html);w.document.close();setTimeout(function(){w.print();},500);}}
/* -- Faculty Goals Save -- */
window.facSaveGoals=function(){
  var tid=facSelectedTeacher;if(!tid)return;
  var goals={
    attTarget:parseInt((document.getElementById('gt-att')||{}).value||95),
    planTarget:parseInt((document.getElementById('gt-plan')||{}).value||90),
    scoreTarget:parseInt((document.getElementById('gt-score')||{}).value||75),
    dutyTarget:parseInt((document.getElementById('gt-duty')||{}).value||2),
    reportTarget:parseInt((document.getElementById('gt-report')||{}).value||2),
    note:((document.getElementById('gt-note')||{}).value||'').trim()
  };
  localStorage.setItem('gnsi_fac_goals_'+tid,JSON.stringify(goals));if(typeof gnsiKVPush==='function')gnsiKVPush('gnsi_fac_goals_'+tid,goals);
  facGoalEdit=false;
  facToast('✅ Goals saved','#16a34a');
  navigate();
};
/* -- AI Coach helpers -- */
window.facAIPrompt=function(msg){
  var inp=document.getElementById('ai-input');
  if(inp)inp.value=msg;
  facAISend();
};
/* -- AI Coach API key helpers -- */
function facGetApiKey(){try{return localStorage.getItem('gnsi_ai_api_key')||'';}catch(e){return '';}}
window.facSaveApiKey=function(){
  var k=(document.getElementById('ai-key-input')||{}).value||'';
  k=k.trim();
  if(!k){facToast('⚠️ Please paste your API key first','#c0291d');return;}
  try{localStorage.setItem('gnsi_ai_api_key',k);}catch(e){}
  // Sync to cloud so all devices share the same AI key
  if(typeof gnsiKVPush==='function') try{gnsiKVPush('gnsi_ai_api_key',k);}catch(e){}
  facToast('✅ API key saved & synced to cloud','#16a34a');
  render();
};
window.facClearApiKey=function(){
  try{localStorage.removeItem('gnsi_ai_api_key');}catch(e){}
  facToast('🗑 API key cleared','#8b5cf6');
  render();
};
window.facAISend=function(){
  var apiKey=facGetApiKey();
  if(!apiKey){
    facToast('⚠️ Enter your Anthropic API key first','#c0291d');
    return;
  }
  var inp=document.getElementById('ai-input');
  var userMsg=(inp?inp.value:'').trim();
  if(!userMsg||facAILoading)return;
  if(inp)inp.value='';
  // Build context from teacher's data
  var teacher=getFacultyStaff().find(function(f){return String(f.id)===String(facSelectedTeacher);})||(getFacultyStaff()[0]||{});
  var attKeys2=Object.keys(attendance);
  var attDates2=attKeys2.filter(function(k){return k.indexOf('-S-'+teacher.id)!==-1;});
  var pres2=attDates2.filter(function(k){var v=attendance[k];return v==='P'||v==='L'||v==='ED';}).length;
  var tot2=attDates2.length;
  var attPct2=tot2>0?Math.round(pres2/tot2*100):0;
  var plns2=loadLessonPlans();
  var worked2=0,entered2=0,scores2=[];
  for(var di2=0;di2<30;di2++){var dd2=new Date();dd2.setDate(dd2.getDate()-di2);if(dd2.getDay()===0)continue;var ds2=dd2.toISOString().split('T')[0];worked2++;var dp2=(plns2[teacher.id]&&plns2[teacher.id][ds2])||[];if(dp2.length){entered2++;dp2.forEach(function(p){scores2.push(facPlanScore(p));});}}
  var compPct2=worked2>0?Math.round(entered2/worked2*100):0;
  var avgSc2=scores2.length?Math.round(scores2.reduce(function(a,b){return a+b;},0)/scores2.length):0;
  var rpts2=gnsiGetReports().filter(function(r){return r.staffId===teacher.id;}).length;
  var _aiInstName = (window.TENANT && window.TENANT.name) ? window.TENANT.name : 'GNSI (Guidance Navodaya & Sainik Institute)';
  var _aiInstCity = (window.TENANT && window.TENANT.city) ? window.TENANT.city + ', ' + (window.TENANT.state || 'India') : 'Manipur, India';
  var systemPrompt='You are an expert, encouraging educational coach at '+_aiInstName+', a premier coaching institute in '+_aiInstCity+'. You are coaching '+teacher.name+', a '+teacher.role+' in the '+(teacher.dept||'Teaching')+' department.\n\nCurrent performance data:\n- Attendance: '+attPct2+'% ('+pres2+'/'+tot2+' days)\n- Lesson Plan Compliance (30 days): '+compPct2+'%\n- Average Plan Quality Score: '+avgSc2+'/100\n- Reports Submitted: '+rpts2+'\n\nBe specific, actionable, warm, and encouraging. Use practical examples. If generating lesson plans, make them detailed and educationally appropriate. Keep responses concise but helpful. Do not use markdown headers--use plain numbered lists and clean text formatting.';
  facAIMessages.push({role:'user',content:userMsg});
  facAILoading=true;
  render();
  setTimeout(function(){var chat=document.getElementById('ai-chat-msgs');if(chat)chat.scrollTop=chat.scrollHeight;},50);
  var msgs=facAIMessages.filter(function(m){return m.role==='user'||m.role==='assistant';}).map(function(m){return{role:m.role,content:m.content};});
  /* SECURITY PATCH v5: API key is sent directly from browser.
   Anyone with DevTools can see it in the Network tab.
   Use a restricted key scoped to claude-sonnet only, or proxy via backend. */
if(apiKey && !localStorage.getItem('gnsi_ai_key_warned')){
  localStorage.setItem('gnsi_ai_key_warned','1');
  if(typeof showToast==='function') showToast('⚠️ AI key is visible in browser DevTools. Use a restricted API key.','#b45309');
}
fetch('https://api.anthropic.com/v1/messages',{
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'x-api-key':apiKey,
      'anthropic-version':'2023-06-01',
      'anthropic-dangerous-direct-browser-access':'true'
    },
    body:JSON.stringify({
      model:'claude-sonnet-4-20250514',
      max_tokens:1024,
      system:systemPrompt,
      messages:msgs
    })
  }).then(function(res){
    if(!res.ok){return res.json().then(function(e){throw new Error(e.error&&e.error.message?e.error.message:'HTTP '+res.status);});}
    return res.json();
  }).then(function(data){
    var reply=(data.content&&data.content[0]&&data.content[0].text)||'Sorry, I could not generate a response. Please try again.';
    facAIMessages.push({role:'assistant',content:reply});
    facAILoading=false;
    render();
    setTimeout(function(){var chat=document.getElementById('ai-chat-msgs');if(chat)chat.scrollTop=chat.scrollHeight;},50);
  }).catch(function(err){
    facAIMessages.push({role:'assistant',content:'⚠️ Error: '+(err.message||'Request failed')+'\n\nCheck that your API key is correct and has access to Claude.'});
    facAILoading=false;
    render();
  });
};
function renderDiary(){
  var isAdmin=(typeof currentUser!=='undefined'&&currentUser&&(currentUser.role==='admin'||currentUser.role==='manager'));
  var myName=(typeof currentUser!=='undefined'&&currentUser&&currentUser.name)?currentUser.name:'';
  var allEntries=gnsiLoad('gnsi_diary')||[];
  /* Security: non-admin staff see only their own entries */
  var _isAdminView=(currentUser&&(currentUser.role==='admin'||currentUser.role==='manager'));
  if(!_isAdminView&&currentUser){
    allEntries=allEntries.filter(function(e){
      return e.author===currentUser.name||e.staffId===currentUser.id||e.staffId===String(currentUser.id);
    });
  }
  var staffList=(gnsiLoad('gnsi_staff')||[]);
  if(!staffList.length&&typeof STAFF_INIT!=='undefined') staffList=STAFF_INIT;
  var teachers=staffList.filter(function(s){return (s.dept==='Teaching'||s.role==='Teacher'||s.role==='Concern Teacher')&&(s.status||'Active').toLowerCase()==='active';});
  /* default view date to today */
  if(!_diaryViewDate) _diaryViewDate=new Date().toISOString().slice(0,10);
  var tabs=['myentries','bydate','allentries'];
  /* filter entries */
  var filtered=allEntries;
  if(_diaryTab==='myentries'){
    filtered=allEntries.filter(function(e){return e.teacher===myName;});
  } else if(_diaryTab==='bydate'){
    filtered=allEntries.filter(function(e){return e.date===_diaryViewDate;});
    if(_diaryFilterTeacher) filtered=filtered.filter(function(e){return e.teacher===_diaryFilterTeacher;});
  } else {
    if(_diaryFilterTeacher) filtered=filtered.filter(function(e){return e.teacher===_diaryFilterTeacher;});
  }
  filtered=filtered.slice().sort(function(a,b){return a.date<b.date?1:-1;});
  /* -- subject color map -- */
  var subjColors={Mathematics:'#1433a8',Science:'#16a34a',English:'#d97706','Social Studies':'#6366f1',Hindi:'#dc2626','Computer Science':'#0891b2',General:'#64748b',Other:'#64748b'};
  /* -- stats -- */
  var today=new Date().toISOString().slice(0,10);
  var todayCount=allEntries.filter(function(e){return e.date===today;}).length;
  var myCount=allEntries.filter(function(e){return e.teacher===myName;}).length;
  var weekAgo=new Date(Date.now()-7*864e5).toISOString().slice(0,10);
  var weekCount=allEntries.filter(function(e){return e.date>=weekAgo;}).length;
  /* -- form -- */
  var formHtml='';
  if(_diaryForm){
    var ed=_diaryEdit?allEntries.find(function(e){return e.id===_diaryEdit;}):null;
    formHtml='<div style="background:var(--surface);border:1.5px solid #1433a8;border-radius:14px;padding:22px;margin-bottom:20px">'
      +'<div style="font-family:\'Playfair Display\',serif;font-size:15px;font-weight:700;color:var(--text);margin-bottom:16px">'+(ed?'✏️ Edit Entry':'📓 New Diary Entry')+'</div>'
      +'<div class="form-grid g2" style="margin-bottom:14px">'
      +'<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Date *</label>'
      +'<input id="dy-date" type="date" value="'+(ed?ed.date:today)+'" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif;box-sizing:border-box"></div>'
      +'<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Period</label>'
      +'<select id="dy-period" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif">'+_DIARY_PERIODS.map(function(p){return '<option'+(ed&&ed.period===p?' selected':'')+'>'+p+'</option>';}).join('')+'</select></div>'
      +'<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Subject</label>'
      +'<select id="dy-subject" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif">'+_DIARY_SUBJECTS.map(function(s){return '<option'+(ed&&ed.subject===s?' selected':'')+'>'+s+'</option>';}).join('')+'</select></div>'
      +'<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Batch / Section</label>'
      +'<select id="dy-class" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text)"><option value="">-- Select Batch --</option>'+(['Achiever Batch (Combined)','Leader Batch (Sainik)','Champion Batch (Sainik)','Lakshya Batch (Navodaya)','Umeed Batch (Navodaya)','Elite Batch (Foundation)','Prime Batch (Foundation)'].map(function(b){return '<option'+((ed&&ed.cls||'')===b?' selected':'')+'>'+b+'</option>';}).join(''))+'</select>'+'</div>'
      +'</div>'
      +'<div style="margin-bottom:12px"><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Topic Taught *</label>'
      +'<input id="dy-topic" type="text" value="'+(ed?esc(ed.topic):'')+'" placeholder="e.g. Fractions -- Addition and Subtraction" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif;box-sizing:border-box"></div>'
      +'<div style="margin-bottom:12px"><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Activities / Method Used</label>'
      +'<textarea id="dy-activities" rows="2" placeholder="e.g. Explanation, worked examples, group activity, quiz..." style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif;resize:vertical;box-sizing:border-box">'+(ed?esc(ed.activities):'')+'</textarea></div>'
      +'<div class="form-grid g2" style="margin-bottom:16px">'
      +'<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Homework Assigned</label>'
      +'<input id="dy-homework" type="text" value="'+(ed?esc(ed.homework):'')+'" placeholder="e.g. Ex. 3.2 Q1–Q8" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif;box-sizing:border-box"></div>'
      +'<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Remarks / Notes</label>'
      +'<input id="dy-notes" type="text" value="'+(ed?esc(ed.notes):'')+'" placeholder="Any class observations..." style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif;box-sizing:border-box"></div>'
      +'</div>'
      +'<div style="display:flex;gap:10px">'
      +'<button onclick="diarySave()" style="padding:9px 20px;border-radius:9px;background:#1433a8;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">Save Entry</button>'
      +'<button onclick="diaryCloseForm()" style="padding:9px 16px;border-radius:9px;border:1.5px solid var(--border);background:var(--surface);color:var(--muted);font-size:13px;cursor:pointer;font-family:\'DM Sans\',sans-serif">Cancel</button>'
      +'</div></div>';
  }
  /* -- date / teacher filter bar -- */
  var filterBar='';
  if(_diaryTab==='bydate'){
    filterBar='<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:16px">'
      +'<input type="date" value="'+esc(_diaryViewDate)+'" onchange="_diaryViewDate=this.value;navigate(\'diary\')" style="padding:8px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--surface);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif">'
      +(isAdmin?'<select onchange="_diaryFilterTeacher=this.value;navigate(\'diary\')" style="padding:8px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--surface);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif"><option value="">All Teachers</option>'+teachers.map(function(t){return '<option value="'+esc(t.name)+'"'+(t.name===_diaryFilterTeacher?' selected':'')+'>'+esc(t.name)+'</option>';}).join('')+'</select>':'')
      +'</div>';
  } else if(_diaryTab==='allentries'&&isAdmin){
    filterBar='<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:16px">'
      +'<select onchange="_diaryFilterTeacher=this.value;navigate(\'diary\')" style="padding:8px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--surface);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif"><option value="">All Teachers</option>'+teachers.map(function(t){return '<option value="'+esc(t.name)+'"'+(t.name===_diaryFilterTeacher?' selected':'')+'>'+esc(t.name)+'</option>';}).join('')+'</select>'
      +'</div>';
  }
  /* -- entry cards -- */
  var cards='';
  if(!filtered.length){
    cards='<div style="padding:40px;text-align:center;color:var(--muted);font-size:13px">No diary entries found. '
      +(!_diaryForm?'<a href="#" onclick="diaryOpenForm();return false" style="color:#1433a8;font-weight:700">Add the first entry →</a>':'')+'</div>';
  } else {
    /* group by date */
    var byDate={};
    filtered.forEach(function(e){
      if(!byDate[e.date]) byDate[e.date]=[];
      byDate[e.date].push(e);
    });
    Object.keys(byDate).sort(function(a,b){return a<b?1:-1;}).forEach(function(dt){
      var dayEntries=byDate[dt];
      var dObj=new Date(dt);
      var dayLabel=dObj.toLocaleDateString('en-IN',{weekday:'long',day:'2-digit',month:'long',year:'numeric'});
      cards+='<div style="margin-bottom:18px">'
        +'<div style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;padding-left:2px">'+(dt===today?'📅 Today -- ':'')+''+esc(dayLabel)+'</div>'
        +'<div style="display:flex;flex-direction:column;gap:8px">'
        +dayEntries.map(function(e){
          var sc=subjColors[e.subject]||'#64748b';
          var canEdit=isAdmin||e.teacher===myName;
          return '<div style="background:var(--surface);border:1.5px solid var(--border);border-left:4px solid '+sc+';border-radius:12px;padding:14px 16px">'
            +'<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap">'
            +'<div style="flex:1;min-width:0">'
            +'<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:5px">'
            +'<span style="font-size:10px;font-weight:700;color:'+sc+';background:'+sc+'18;border-radius:5px;padding:2px 8px">'+esc(e.subject)+'</span>'
            +'<span style="font-size:10px;color:var(--muted);background:var(--bg);border-radius:5px;padding:2px 8px;border:1px solid var(--border)">'+esc(e.period)+'</span>'
            +(e.cls?'<span style="font-size:10px;color:var(--muted)">📚 '+esc(e.cls)+'</span>':'')
            +(isAdmin&&e.teacher?'<span style="font-size:10px;color:var(--muted)">👩‍🏫 '+esc(e.teacher)+'</span>':'')
            +'</div>'
            +'<div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:4px">'+esc(e.topic)+'</div>'
            +(e.activities?'<div style="font-size:12.5px;color:var(--muted);margin-bottom:3px">🎯 '+esc(e.activities)+'</div>':'')
            +(e.homework?'<div style="font-size:12px;color:#d97706;background:#fef3c7;border-radius:6px;padding:3px 9px;display:inline-block;margin-top:3px">📝 HW: '+esc(e.homework)+'</div>':'')
            +(e.notes?'<div style="font-size:12px;color:var(--muted);margin-top:4px;font-style:italic">💬 '+esc(e.notes)+'</div>':'')
            +'</div>'
            +'<div style="display:flex;gap:5px;flex-shrink:0">'
            +(canEdit?'<button onclick="diaryOpenForm(\''+e.id+'\')" style="padding:4px 9px;border-radius:7px;border:1.5px solid var(--border);background:var(--surface);font-size:11px;cursor:pointer">✏️</button>':'')
            +(canEdit?'<button onclick="diaryDelete(\''+e.id+'\')" style="padding:4px 9px;border-radius:7px;border:1.5px solid #fee2e2;background:#fff1f2;color:#ef4444;font-size:11px;cursor:pointer">🗑</button>':'')
            +'</div></div></div>';
        }).join('')
        +'</div></div>';
    });
  }
  return '<div style="padding:8px 0 32px">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:18px">'
    +'<div><div style="font-family:\'Playfair Display\',serif;font-size:22px;font-weight:800;color:var(--text)">📓 Teacher Diary</div>'
    +'<div style="font-size:12.5px;color:var(--muted);margin-top:3px">'+todayCount+' entries today &nbsp;·&nbsp; '+weekCount+' this week &nbsp;·&nbsp; '+myCount+' mine</div></div>'
    +(!_diaryForm?'<button onclick="diaryOpenForm()" style="padding:8px 18px;border-radius:9px;background:#1433a8;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">➕ New Entry</button>':'')
    +'</div>'
    +formHtml
    +'<div style="display:flex;gap:8px;margin-bottom:16px">'
    +tabs.map(function(t){
      var a=t===_diaryTab;
      var label={myentries:'My Entries',bydate:'By Date',allentries:'All Entries'}[t]||t;
      return '<button onclick="_diaryTab=\''+t+'\';navigate(\'diary\')" style="padding:6px 16px;border-radius:20px;border:1.5px solid '+(a?'#1433a8':'var(--border)')+';background:'+(a?'#1433a8':'var(--surface)')+';color:'+(a?'#fff':'var(--muted)')+';font-size:12px;font-weight:700;cursor:pointer">'+label+'</button>';
    }).join('')
    +'</div>'
    +filterBar
    +cards
    +'</div>';
}
/* ══════════════════════════════════════════════════════════════════
   LIBRARY
   ══════════════════════════════════════════════════════════════════ */
var _libTab='catalog', _libSearch='', _libSubjFilter='All', _libForm=false, _libEdit=null;
var _libIssueForm=false, _libIssueBookId=null;
var _LIB_SUBJECTS=['All','Mathematics','Science','English','Hindi','Social Studies','Computer Science','General Knowledge','Literature','Reference','Other'];
var _LIB_GENRES=['Textbook','Reference','Fiction','Non-Fiction','Magazine','Newspaper','Other'];
function libOpenForm(id){ _libEdit=id||null; _libForm=true; _libIssueForm=false; navigate('library'); }
function libCloseForm(){ _libForm=false; _libEdit=null; navigate('library'); }
function libOpenIssue(bookId){ _libIssueBookId=bookId; _libIssueForm=true; _libForm=false; navigate('library'); }
function libCloseIssue(){ _libIssueForm=false; _libIssueBookId=null; navigate('library'); }
function libSaveBook(){
  var title=document.getElementById('lib-title').value.trim();
  var author=document.getElementById('lib-author').value.trim();
  var subject=document.getElementById('lib-subject').value;
  var genre=document.getElementById('lib-genre').value;
  var qty=parseInt(document.getElementById('lib-qty').value)||1;
  var accNo=document.getElementById('lib-acc').value.trim();
  var publisher=document.getElementById('lib-publisher').value.trim();
  var year=document.getElementById('lib-year').value.trim();
  var location=document.getElementById('lib-location').value.trim();
  if(!title){ alert('Book title is required.'); return; }
  var books=gnsiLoad('gnsi_books')||[];
  if(_libEdit){
    books=books.map(function(b){
      if(b.id!==_libEdit) return b;
      var issued=b.issued||0;
      var avail=Math.max(0,qty-issued);
      return {id:b.id,title:title,author:author,subject:subject,genre:genre,qty:qty,available:avail,issued:issued,accNo:accNo,publisher:publisher,year:year,location:location,addedOn:b.addedOn};
    });
  } else {
    books.unshift({id:'lib'+Date.now(),title:title,author:author,subject:subject,genre:genre,qty:qty,available:qty,issued:0,accNo:accNo,publisher:publisher,year:year,location:location,addedOn:new Date().toISOString().slice(0,10)});
  }
  gnsiSave('gnsi_books', books);
  _libForm=false; _libEdit=null; navigate('library');
}
function libDeleteBook(id){
  if(!confirm('Delete this book from the catalog?')) return;
  gnsiSave('gnsi_books', (gnsiLoad('gnsi_books')||[]).filter(function(b){return b.id!==id;}));
  navigate('library');
}
function libIssueBook(){
  var bookId=_libIssueBookId;
  var borrower=document.getElementById('lib-borrower').value.trim();
  var borrowerType=document.getElementById('lib-btype').value;
  var issueDate=document.getElementById('lib-idate').value;
  var dueDate=document.getElementById('lib-ddate').value;
  if(!borrower||!issueDate||!dueDate){ alert('Borrower, issue date and due date are required.'); return; }
  var books=gnsiLoad('gnsi_books')||[];
  books=books.map(function(b){
    if(b.id!==bookId) return b;
    if(b.available<=0){ alert('No copies available.'); return b; }
    return Object.assign({},b,{available:b.available-1, issued:(b.issued||0)+1});
  });
  gnsiSave('gnsi_books', books);
  var issues=gnsiLoad('gnsi_book_issues')||[];
  var book=books.find(function(b){return b.id===bookId;})||{};
  issues.unshift({id:'iss'+Date.now(),bookId:bookId,bookTitle:book.title||'',borrower:borrower,borrowerType:borrowerType,issueDate:issueDate,dueDate:dueDate,returnDate:'',status:'Issued'});
  gnsiSave('gnsi_book_issues', issues);
  _libIssueForm=false; _libIssueBookId=null;
  _libTab='issued';
  navigate('library');
}
function libReturnBook(issueId){
  var issues=gnsiLoad('gnsi_book_issues')||[];
  var issue=issues.find(function(i){return i.id===issueId;});
  if(!issue) return;
  var returnDate=new Date().toISOString().slice(0,10);
  issues=issues.map(function(i){return i.id===issueId?Object.assign({},i,{returnDate:returnDate,status:'Returned'}):i;});
  gnsiSave('gnsi_book_issues', issues);
  var books=gnsiLoad('gnsi_books')||[];
  books=books.map(function(b){
    if(b.id!==issue.bookId) return b;
    return Object.assign({},b,{available:b.available+1, issued:Math.max(0,(b.issued||1)-1)});
  });
  gnsiSave('gnsi_books', books);
  navigate('library');
}
  window.renderLessonBridge = function() {
    var lb = window._lb;
    var isHM  = _isHM();
    var isTch = _isTeacher();
    var entries = _loadEntries();

    /* ── tab bar ── */
    function tabBtn(key, icon, label, badge) {
      var a = lb.tab === key;
      return '<button onclick="window._lb.tab=\''+key+'\';render()" style="display:flex;align-items:center;gap:6px;padding:9px 18px;border-radius:10px;border:'+(a?'none':'1.5px solid var(--border)')+';cursor:pointer;font-family:\'Nunito\',sans-serif;font-weight:'+(a?'800':'600')+';font-size:12.5px;background:'+(a?'linear-gradient(135deg,#1433a8,#2563eb)':'var(--surface)')+';color:'+(a?'#fff':'var(--muted)')+';transition:all .15s">'
        +icon+' '+label
        +(badge?'<span style="background:'+(a?'rgba(255,255,255,.3)':'#dc2626')+';color:#fff;border-radius:20px;padding:1px 7px;font-size:10px;font-weight:800">'+badge+'</span>':'')
        +'</button>';
    }

    var pendingHM = entries.filter(function(e){ return e.status === 'Pending HM Review'; }).length;
    var doubts    = entries.filter(function(e){ return e.status === 'Doubt Raised'; }).length;

    var tabBar = '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:22px">'
      + (isTch ? tabBtn('log','✏️','Log Lesson','') : '')
      + tabBtn('feed','📋','Lesson Feed', doubts > 0 ? doubts : '')
      + (isHM  ? tabBtn('hmview','🏠','HM Dashboard', pendingHM > 0 ? pendingHM : '') : '')
      + tabBtn('bridge','🌉','Bridge Summary','')
      +'</div>';

    /* ── header ── */
    var header = '<div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:20px">'
      +'<div>'
      +'<div style="font-family:\'Playfair Display\',serif;font-size:22px;font-weight:700;color:var(--text)">🌉 Lesson Bridge</div>'
      +'<div style="font-size:12px;color:var(--muted);margin-top:3px">Teacher ↔ House Master collaboration — topics, doubts, and follow-ups</div>'
      +'</div>'
      +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
      +(doubts>0?'<div style="background:#fee2e2;border:1.5px solid #fca5a5;border-radius:10px;padding:8px 14px;font-size:12px;font-weight:700;color:#dc2626">🚨 '+doubts+' unresolved doubt'+(doubts>1?'s':'')+'</div>':'')
      +(pendingHM>0&&isHM?'<div style="background:#fffbeb;border:1.5px solid #fde047;border-radius:10px;padding:8px 14px;font-size:12px;font-weight:700;color:#854d0e">⏳ '+pendingHM+' pending review</div>':'')
      +'</div>'
      +'</div>';

    var body = '';

    /* ══════════════════════════
       TAB: LOG LESSON (Teacher)
    ══════════════════════════ */
    if (lb.tab === 'log') {
      var editEntry = lb.editId ? entries.find(function(x){ return x.id === lb.editId; }) : null;
      var ex = editEntry || {};
      var _ttCols = (typeof getTTCols==='function') ? getTTCols() : [];
      var courseOpts = ['<option value="">-- Select Batch *</option>']
        .concat(_courseNames().map(function(c){ return '<option'+(ex.course===c?' selected':'')+' value="'+_e(c)+'">'+_e(c)+'</option>'; })).join('');
      /* Period options — driven by selected batch, refreshed live via lbRefreshPeriods() */
      var _initCourse = ex.course || lb._pendingCourse || '';
      var periodOpts = _lbPeriodOpts(_initCourse, ex.periodNo || '');
      var covOpts = ['Full','Partial','Skipped'].map(function(v){ return '<option'+(ex.coverage===v?' selected':'')+'>'+v+'</option>'; }).join('');
      var difOpts = ['Easy','Moderate','Hard'].map(function(v){ return '<option'+(ex.difficulty===v?' selected':'')+'>'+v+'</option>'; }).join('');

      body = '<div class="form-panel" style="max-width:780px">'
        +'<div class="form-title" style="color:#1433a8;font-size:16px">'+(lb.editId?'✏️ Edit Lesson Entry':'✏️ Log Lesson / Topic Taught')+'</div>'
        +'<div class="form-grid g3">'
          +'<div class="form-group"><label>Date *</label><input type="date" id="lb-date" value="'+(ex.date||new Date().toISOString().split('T')[0])+'"/></div>'
          +'<div class="form-group"><label>Batch *</label><select id="lb-course" onchange="lbRefreshPeriods(this.value)">'+courseOpts+'</select></div>'
          +'<div class="form-group"><label>Period *</label><select id="lb-period" onchange="lbAutoFillSubject(this.value)">'+periodOpts+'</select></div>'
          +'<div class="form-group"><label>Subject *</label><input id="lb-subject" placeholder="e.g. Mathematics" value="'+_e(ex.subject||'')+'"/></div>'
          +'<div class="form-group"><label>Topic Taught *</label><input id="lb-topic" placeholder="e.g. Fractions — Division" value="'+_e(ex.topic||'')+'"/></div>'
          +'<div class="form-group"><label>Coverage</label><select id="lb-coverage">'+covOpts+'</select></div>'
          +'<div class="form-group"><label>Difficulty Level</label><select id="lb-difficulty">'+difOpts+'</select></div>'
          +'<div class="form-group" style="grid-column:1/-1"><label>Sub-topics / Chapters Covered</label><input id="lb-subtopics" placeholder="e.g. Ch 3.1, 3.2 — Proper & Improper fractions" value="'+_e(ex.subtopics||'')+'"/></div>'
          +'<div class="form-group" style="grid-column:1/-1"><label>Learning Objectives</label><input id="lb-objectives" placeholder="What students should know after this lesson" value="'+_e(ex.objectives||'')+'"/></div>'
          +'<div class="form-group" style="grid-column:1/-1"><label>Homework / Practice Given</label><input id="lb-homework" placeholder="e.g. Exercise 3.1 Q1–10" value="'+_e(ex.homework||'')+'"/></div>'
          +'<div class="form-group" style="grid-column:1/-1"><label>Remarks / Observations</label><textarea id="lb-remarks" placeholder="Class response, areas needing reinforcement, special notes for HM..." style="width:100%;min-height:72px;border:1.5px solid var(--border);border-radius:8px;padding:8px 12px;font-size:13px;background:var(--surface);color:var(--text);resize:vertical;box-sizing:border-box">'+_e(ex.remarks||'')+'</textarea></div>'
        +'</div>'
        +'<div style="background:#f0f9ff;border:1.5px solid #bae6fd;border-radius:10px;padding:14px 16px;margin:12px 0">'
          +'<div style="font-size:11.5px;font-weight:700;color:#0369a1;margin-bottom:8px">📎 Attach Files <span style="font-weight:400;color:#64748b">(PDF, images, Word, Excel — max 5 MB each)</span></div>'
          +'<input type="file" id="lb-files" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.webp" style="font-size:13px"/>'
          +(ex.files&&ex.files.length?'<div style="margin-top:10px;font-size:11.5px;color:var(--muted)">Currently attached: '
            +ex.files.map(function(f,i){ return '<span style="display:inline-flex;align-items:center;gap:4px;background:#e0f2fe;color:#0369a1;border-radius:6px;padding:2px 8px;margin:2px;font-weight:600">'+_fileIcon(f.type)+' '+_e(f.name)+'<button onclick="lbRemoveFile(\''+ex.id+'\','+i+')" style="background:none;border:none;color:#dc2626;cursor:pointer;font-size:11px;padding:0 2px">✕</button></span>'; }).join('')
            +'</div>':'')
        +'</div>'
        +'<div class="form-actions">'
          +'<button class="btn btn-primary" onclick="lbSaveEntry()">'+(lb.editId?'✅ Update Entry':'✅ Log & Notify HM')+'</button>'
          +'<button class="btn btn-outline" onclick="window._lb.editId=null;window._lb.tab=\'feed\';render()">Cancel</button>'
        +'</div>'
      +'</div>';
    }

    /* ══════════════════════════
       TAB: LESSON FEED
    ══════════════════════════ */
    if (lb.tab === 'feed') {
      /* filters */
      var allCourses  = [...new Set(entries.map(function(e){ return e.course; }))].filter(Boolean);
      var allSubjects = [...new Set(entries.map(function(e){ return e.subject; }))].filter(Boolean);
      var allTeachers = [...new Set(entries.map(function(e){ return e.teacherName; }))].filter(Boolean);
      var allStatuses = ['Pending HM Review','HM Noted','Doubt Raised','Resolved'];

      var filterBar = '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;align-items:center">'
        +'<input id="lb-search" placeholder="🔍 Search topic, subject..." value="'+_e(lb.searchQ)+'" oninput="window._lb.searchQ=this.value;render()" style="border:1.5px solid var(--border);border-radius:8px;padding:7px 12px;font-size:13px;background:var(--surface);color:var(--text);width:200px"/>'
        +'<select onchange="window._lb.filterCourse=this.value;render()" style="border:1.5px solid var(--border);border-radius:8px;padding:7px 10px;font-size:12.5px;background:var(--surface);color:var(--text)">'
          +'<option value="">All Courses</option>'
          +allCourses.map(function(c){ return '<option'+(lb.filterCourse===c?' selected':'')+' value="'+_e(c)+'">'+_e(c)+'</option>'; }).join('')
        +'</select>'
        +'<select onchange="window._lb.filterSubject=this.value;render()" style="border:1.5px solid var(--border);border-radius:8px;padding:7px 10px;font-size:12.5px;background:var(--surface);color:var(--text)">'
          +'<option value="">All Subjects</option>'
          +allSubjects.map(function(s){ return '<option'+(lb.filterSubject===s?' selected':'')+' value="'+_e(s)+'">'+_e(s)+'</option>'; }).join('')
        +'</select>'
        +'<select onchange="window._lb.filterTeacher=this.value;render()" style="border:1.5px solid var(--border);border-radius:8px;padding:7px 10px;font-size:12.5px;background:var(--surface);color:var(--text)">'
          +'<option value="">All Teachers</option>'
          +allTeachers.map(function(t){ return '<option'+(lb.filterTeacher===t?' selected':'')+' value="'+_e(t)+'">'+_e(t)+'</option>'; }).join('')
        +'</select>'
        +'<select onchange="window._lb.filterStatus=this.value;render()" style="border:1.5px solid var(--border);border-radius:8px;padding:7px 10px;font-size:12.5px;background:var(--surface);color:var(--text)">'
          +'<option value="">All Status</option>'
          +allStatuses.map(function(s){ return '<option'+(lb.filterStatus===s?' selected':'')+' value="'+_e(s)+'">'+_e(s)+'</option>'; }).join('')
        +'</select>'
        +(lb.filterCourse||lb.filterSubject||lb.filterTeacher||lb.filterStatus||lb.searchQ
          ?'<button onclick="window._lb.filterCourse=\'\';window._lb.filterSubject=\'\';window._lb.filterTeacher=\'\';window._lb.filterStatus=\'\';window._lb.searchQ=\'\';render()" style="padding:7px 14px;border-radius:8px;border:1.5px solid var(--border);background:var(--surface);font-size:12px;cursor:pointer;color:var(--muted);font-weight:700">✕ Clear</button>':'')
      +'</div>';

      /* filter entries */
      var filtered = entries.slice().reverse().filter(function(e) {
        if (lb.filterCourse  && e.course !== lb.filterCourse)      return false;
        if (lb.filterSubject && e.subject !== lb.filterSubject)    return false;
        if (lb.filterTeacher && e.teacherName !== lb.filterTeacher)return false;
        if (lb.filterStatus  && e.status !== lb.filterStatus)      return false;
        if (lb.searchQ) {
          var q = lb.searchQ.toLowerCase();
          return (e.topic||'').toLowerCase().includes(q)
              || (e.subject||'').toLowerCase().includes(q)
              || (e.subtopics||'').toLowerCase().includes(q)
              || (e.objectives||'').toLowerCase().includes(q);
        }
        return true;
      });

      /* cards */
      var cards = filtered.length ? filtered.map(function(e) {
        var isExpanded = lb.viewId === e.id;
        var hmNotesCount = (e.hmNotes||[]).length;
        var filesCount   = (e.files||[]).length;
        var flagged      = (e.hmNotes||[]).some(function(n){ return n.flagged; });
        var canEdit      = isTch && e.teacherName === _user().name || _user().role === 'admin' || _user().role === 'manager';

        var card = '<div style="background:var(--surface);border:1.5px solid '+(flagged?'#fca5a5':'var(--border)')+';border-radius:14px;margin-bottom:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.05)">'
          // card header
          +'<div style="padding:14px 18px;cursor:pointer;display:flex;align-items:flex-start;gap:14px" onclick="window._lb.viewId=window._lb.viewId===\''+e.id+'\'?null:\''+e.id+'\';render()">'
            +'<div style="flex:1;min-width:0">'
              +'<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">'
                +'<span style="font-family:\'Playfair Display\',serif;font-size:15px;font-weight:700;color:var(--text)">'+_e(e.topic)+'</span>'
                +_statusBadge(e.status)
                +(filesCount?'<span style="font-size:11px;color:#0369a1;background:#e0f2fe;border-radius:6px;padding:1px 7px;font-weight:700">📎 '+filesCount+'</span>':'')
              +'</div>'
              +'<div style="display:flex;gap:12px;flex-wrap:wrap;font-size:11.5px;color:var(--muted)">'
                +'<span>📚 <b style="color:var(--text)">'+_e(e.subject)+'</b></span>'
                +'<span>🎓 '+_e(e.course)+'</span>'
                +'<span>⏰ '+_e(e.periodNo)+'</span>'
                +'<span>👤 '+_e(e.teacherName)+'</span>'
                +'<span>📅 '+_e(e.date)+'</span>'
                +(hmNotesCount?'<span style="color:#7c3aed">💬 '+hmNotesCount+' HM note'+(hmNotesCount>1?'s':'')+'</span>':'')
              +'</div>'
            +'</div>'
            +'<div style="display:flex;align-items:center;gap:8px;flex-shrink:0">'
              +_covBadge(e.coverage)
              +'<span style="font-size:16px;color:var(--muted);transform:rotate('+(isExpanded?'180':'0')+'deg);transition:transform .2s">▾</span>'
            +'</div>'
          +'</div>';

        if (isExpanded) {
          /* expanded body */
          card += '<div style="border-top:1px solid var(--border-soft);padding:16px 18px">'
            // details grid
            +'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;margin-bottom:16px">'
              +['subtopics','objectives','homework'].map(function(k) {
                var labels = {subtopics:'📖 Sub-topics / Chapters', objectives:'🎯 Learning Objectives', homework:'📝 Homework Given'};
                return e[k] ? '<div style="background:var(--surface2);border-radius:10px;padding:10px 14px"><div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px">'+labels[k]+'</div><div style="font-size:13px;color:var(--text)">'+_e(e[k])+'</div></div>' : '';
              }).join('')
              +(e.remarks?'<div style="background:#fef9c3;border-radius:10px;padding:10px 14px;grid-column:1/-1"><div style="font-size:10px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px">📌 Teacher Remarks</div><div style="font-size:13px;color:#451a03">'+_e(e.remarks)+'</div></div>':'')
            +'</div>'
            // difficulty + coverage
            +'<div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:16px">'
              +'<div style="background:var(--surface2);border-radius:8px;padding:8px 14px;font-size:12.5px">⚡ Difficulty: '+_diffBadge(e.difficulty)+'</div>'
              +'<div style="background:var(--surface2);border-radius:8px;padding:8px 14px;font-size:12.5px">📊 Coverage: '+_covBadge(e.coverage)+'</div>'
            +'</div>';

          /* files */
          if (e.files && e.files.length) {
            card += '<div style="margin-bottom:16px"><div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">📎 Attached Files</div>'
              +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
              +e.files.map(function(f,i){
                return '<button onclick="lbOpenFile(\''+e.id+'\','+i+')" style="display:flex;align-items:center;gap:6px;padding:7px 12px;border-radius:8px;border:1.5px solid #bae6fd;background:#f0f9ff;color:#0369a1;cursor:pointer;font-size:12px;font-weight:600">'
                  +_fileIcon(f.type)+' '+_e(f.name)
                  +'<span style="font-size:10px;color:#64748b;">('+Math.round(f.size/1024)+'KB)</span></button>';
              }).join('')
            +'</div></div>';
          }

          /* HM Notes */
          if (e.hmNotes && e.hmNotes.length) {
            card += '<div style="margin-bottom:14px"><div style="font-size:11px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">🏠 House Master Notes</div>'
              +e.hmNotes.map(function(n){
                return '<div style="background:'+(n.flagged?'#fef2f2':'#f5f3ff')+';border:1.5px solid '+(n.flagged?'#fca5a5':'#c4b5fd')+';border-radius:10px;padding:10px 14px;margin-bottom:8px">'
                  +'<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;margin-bottom:6px">'
                    +'<div style="font-size:11.5px;font-weight:700;color:#7c3aed">🏠 '+_e(n.hmName)+'</div>'
                    +'<div style="display:flex;align-items:center;gap:8px">'
                      +(n.flagged?'<span style="background:#fee2e2;color:#dc2626;border-radius:6px;padding:1px 8px;font-size:10.5px;font-weight:700">🚨 Doubt Flagged</span>':'')
                      +'<span style="font-size:10.5px;color:var(--muted)">'+new Date(n.date).toLocaleDateString('en-IN')+'</span>'
                      +(_isHM()?'<button onclick="lbDeleteHMNote(\''+e.id+'\',\''+parseInt(n.id,10)+'\')" style="background:none;border:none;cursor:pointer;color:#dc2626;font-size:11px">✕</button>':'')
                    +'</div>'
                  +'</div>'
                  +'<div style="font-size:13px;color:var(--text)">'+_e(n.note)+'</div>'
                  +(n.students&&n.students.length?'<div style="margin-top:6px;font-size:11.5px;color:#7c3aed">👤 Students needing focus: <b>'+_e(n.students.join(', '))+'</b></div>':'')
                +'</div>';
              }).join('')
            +'</div>';
          }

          /* action buttons */
          card += '<div style="display:flex;gap:8px;flex-wrap:wrap;padding-top:10px;border-top:1px solid var(--border-soft)">';
          if (isHM && e.status !== 'Resolved') {
            card += '<button onclick="window._lb.hmNoteOpen=window._lb.hmNoteOpen===\''+e.id+'\'?null:\''+e.id+'\';render()" style="padding:7px 16px;border-radius:8px;background:#f5f3ff;border:1.5px solid #c4b5fd;color:#7c3aed;font-size:12.5px;font-weight:700;cursor:pointer">💬 Add HM Note</button>';
            if (e.status !== 'Pending HM Review') {
              card += '<button onclick="lbResolve(\''+e.id+'\')" style="padding:7px 16px;border-radius:8px;background:#f0fdf4;border:1.5px solid #86efac;color:#16a34a;font-size:12.5px;font-weight:700;cursor:pointer">✅ Mark Resolved</button>';
            }
          }
          if (canEdit) {
            card += '<button onclick="window._lb.editId=\''+e.id+'\';window._lb.tab=\'log\';render()" style="padding:7px 16px;border-radius:8px;background:#eff6ff;border:1.5px solid #93c5fd;color:#1433a8;font-size:12.5px;font-weight:700;cursor:pointer">✏️ Edit</button>';
            card += '<button onclick="lbDeleteEntry(\''+e.id+'\')" style="padding:7px 12px;border-radius:8px;background:#fee2e2;border:1.5px solid #fca5a5;color:#dc2626;font-size:12.5px;font-weight:700;cursor:pointer">🗑</button>';
          }
          card += '</div>';

          /* HM Note form */
          if (lb.hmNoteOpen === e.id && isHM) {
            /* get student list for autocomplete hints */
            var stuList = (typeof students !== 'undefined' ? students : []).slice(0,200).map(function(s){ return _e(s.name); }).join(', ');
            card += '<div style="background:linear-gradient(135deg,#faf5ff,#f3e8ff);border:1.5px solid #c4b5fd;border-radius:12px;padding:16px 18px;margin-top:14px">'
              +'<div style="font-weight:800;font-size:13.5px;color:#7c3aed;margin-bottom:12px">💬 Add House Master Note</div>'
              +'<div class="form-grid g3">'
                +'<div class="form-group" style="grid-column:1/-1"><label>Note / Observation *</label><textarea id="lb-hm-note" placeholder="Describe what needs attention, doubt areas, specific observations..." style="width:100%;min-height:80px;border:1.5px solid var(--border);border-radius:8px;padding:8px 12px;font-size:13px;background:var(--surface);color:var(--text);resize:vertical;box-sizing:border-box"></textarea></div>'
                +'<div class="form-group" style="grid-column:1/-1"><label>Tag Students Needing Focus <span style="font-weight:400;color:var(--muted)">(comma-separated names)</span></label><input id="lb-hm-students" placeholder="e.g. Ramu Singh, Priya Devi, Dinesh Kumar"/>'
                  +(stuList?'<div style="font-size:10.5px;color:var(--muted);margin-top:3px">Available: '+stuList.substring(0,120)+(stuList.length>120?'…':'')+'</div>':'')
                +'</div>'
              +'</div>'
              +'<div style="display:flex;align-items:center;gap:12px;margin-top:10px">'
                +'<label style="display:flex;align-items:center;gap:7px;cursor:pointer;font-size:13px;font-weight:700;color:#dc2626">'
                  +'<input type="checkbox" id="lb-hm-flag" style="width:16px;height:16px;accent-color:#dc2626"/> 🚨 Flag as Doubt — needs teacher follow-up</label>'
              +'</div>'
              +'<div class="form-actions" style="margin-top:12px">'
                +'<button class="btn btn-primary" style="background:#7c3aed" onclick="lbSaveHMNote(\''+e.id+'\')">💬 Save Note</button>'
                +'<button class="btn btn-outline" onclick="window._lb.hmNoteOpen=null;render()">Cancel</button>'
              +'</div>'
            +'</div>';
          }

          card += '</div>'; // end expanded body
        }
        card += '</div>'; // end card
        return card;
      }).join('') : '<div style="text-align:center;padding:56px 24px;color:var(--muted)">'
        +'<div style="font-size:48px;margin-bottom:16px">🌉</div>'
        +'<div style="font-size:15px;font-weight:700;margin-bottom:8px">No entries yet</div>'
        +'<div style="font-size:13px">Teachers: use the ✏️ Log Lesson tab to start logging topics</div>'
      +'</div>';

      body = filterBar + '<div id="lb-feed">'+cards+'</div>';
    }

    /* ══════════════════════════
       TAB: HM DASHBOARD
    ══════════════════════════ */
    if (lb.tab === 'hmview' && isHM) {
      /* Group by course → subject → period */
      var grouped = {};
      entries.forEach(function(e) {
        var c = e.course || 'Unknown';
        var s = e.subject || 'Unknown';
        if (!grouped[c]) grouped[c] = {};
        if (!grouped[c][s]) grouped[c][s] = [];
        grouped[c][s].push(e);
      });

      var courseFilter = lb.filterCourse;
      var hmHtml = '';

      /* KPI row */
      var total    = entries.length;
      var pending2 = entries.filter(function(e){ return e.status === 'Pending HM Review'; }).length;
      var doubts2  = entries.filter(function(e){ return e.status === 'Doubt Raised'; }).length;
      var resolved2= entries.filter(function(e){ return e.status === 'Resolved'; }).length;

      hmHtml += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-bottom:22px">'
        +[['📋','Total Entries',total,'#1433a8','#eff6ff'],
          ['⏳','Pending Review',pending2,'#d97706','#fffbeb'],
          ['🚨','Doubt Raised',doubts2,'#dc2626','#fee2e2'],
          ['✅','Resolved',resolved2,'#16a34a','#f0fdf4']]
        .map(function(k){
          return '<div style="background:'+k[4]+';border:1.5px solid '+k[3]+'44;border-radius:12px;padding:14px 16px;text-align:center">'
            +'<div style="font-size:22px">'+k[0]+'</div>'
            +'<div style="font-size:22px;font-weight:800;color:'+k[3]+'">'+k[2]+'</div>'
            +'<div style="font-size:11px;color:'+k[3]+';font-weight:600">'+k[1]+'</div>'
          +'</div>';
        }).join('')
      +'</div>';

      /* Course filter pills */
      var courses = Object.keys(grouped);
      hmHtml += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px">'
        +'<button onclick="window._lb.filterCourse=\'\';render()" style="padding:6px 14px;border-radius:20px;border:1.5px solid var(--border);background:'+(courseFilter===''?'var(--accent)':'var(--surface)')+';color:'+(courseFilter===''?'#fff':'var(--muted)')+';font-size:12px;font-weight:700;cursor:pointer">All</button>'
        +courses.map(function(c){
          var a = courseFilter === c;
          return '<button onclick="window._lb.filterCourse=\''+_e(c)+'\';render()" style="padding:6px 14px;border-radius:20px;border:1.5px solid var(--border);background:'+(a?'var(--accent)':'var(--surface)')+';color:'+(a?'#fff':'var(--muted)')+';font-size:12px;font-weight:700;cursor:pointer">'+_e(c)+'</button>';
        }).join('')
      +'</div>';

      /* Grouped view */
      var coursesToShow = courseFilter ? [courseFilter] : courses;
      if (coursesToShow.length === 0) {
        hmHtml += '<div style="text-align:center;padding:48px;color:var(--muted)">No lessons logged yet.</div>';
      } else {
        coursesToShow.forEach(function(course) {
          var subjects = grouped[course] || {};
          hmHtml += '<div style="margin-bottom:24px">'
            +'<div style="font-family:\'Playfair Display\',serif;font-size:17px;font-weight:700;color:var(--text);margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid var(--accent-light)">🎓 '+_e(course)+'</div>';

          Object.keys(subjects).sort().forEach(function(subj) {
            var subjEntries = subjects[subj].slice().sort(function(a,b){ return a.date < b.date ? 1 : -1; });
            var subjDoubts = subjEntries.filter(function(e){ return e.status === 'Doubt Raised'; }).length;

            hmHtml += '<div style="background:var(--surface);border:1.5px solid '+(subjDoubts?'#fca5a5':'var(--border)')+';border-radius:12px;margin-bottom:10px;overflow:hidden">'
              +'<div style="padding:12px 16px;background:'+(subjDoubts?'#fff5f5':'var(--surface2)')+';display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">'
                +'<div style="font-weight:700;font-size:14px;color:var(--text)">📚 '+_e(subj)+'</div>'
                +'<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">'
                  +'<span style="font-size:11.5px;color:var(--muted)">'+subjEntries.length+' topic'+(subjEntries.length!==1?'s':'')+'</span>'
                  +(subjDoubts?'<span style="background:#fee2e2;color:#dc2626;border-radius:6px;padding:1px 8px;font-size:11px;font-weight:700">🚨 '+subjDoubts+' doubt'+(subjDoubts>1?'s':'')+'</span>':'')
                +'</div>'
              +'</div>'
              +'<table style="width:100%;border-collapse:collapse">'
              +'<thead><tr style="background:var(--surface2);border-bottom:1.5px solid var(--border)">'
                +'<th style="padding:8px 14px;text-align:left;font-size:10.5px;font-weight:700;color:var(--muted);text-transform:uppercase">Period</th>'
                +'<th style="padding:8px 14px;text-align:left;font-size:10.5px;font-weight:700;color:var(--muted);text-transform:uppercase">Date</th>'
                +'<th style="padding:8px 14px;text-align:left;font-size:10.5px;font-weight:700;color:var(--muted);text-transform:uppercase">Topic</th>'
                +'<th style="padding:8px 14px;text-align:left;font-size:10.5px;font-weight:700;color:var(--muted);text-transform:uppercase">Difficulty</th>'
                +'<th style="padding:8px 14px;text-align:left;font-size:10.5px;font-weight:700;color:var(--muted);text-transform:uppercase">Status</th>'
                +'<th style="padding:8px 14px;text-align:left;font-size:10.5px;font-weight:700;color:var(--muted);text-transform:uppercase">Files</th>'
                +'<th style="padding:8px 14px;text-align:left;font-size:10.5px;font-weight:700;color:var(--muted);text-transform:uppercase">Action</th>'
              +'</tr></thead><tbody>';

            subjEntries.forEach(function(e) {
              var rowBg = e.status === 'Doubt Raised' ? '#fff5f5' : (e.status === 'Resolved' ? '#f0fdf4' : '');
              hmHtml += '<tr style="border-bottom:1px solid var(--border-soft);background:'+rowBg+'">'
                +'<td style="padding:9px 14px;font-size:12px;font-family:\'JetBrains Mono\',monospace;font-weight:700;color:var(--accent)">'+_e(e.periodNo)+'</td>'
                +'<td style="padding:9px 14px;font-size:12px;color:var(--muted)">'+_e(e.date)+'</td>'
                +'<td style="padding:9px 14px"><div style="font-weight:700;font-size:13px">'+_e(e.topic)+'</div>'
                  +(e.subtopics?'<div style="font-size:11px;color:var(--muted)">'+_e(e.subtopics.substring(0,60))+(e.subtopics.length>60?'…':'')+'</div>':'')
                +'</td>'
                +'<td style="padding:9px 14px">'+_diffBadge(e.difficulty)+'</td>'
                +'<td style="padding:9px 14px">'+_statusBadge(e.status)+'</td>'
                +'<td style="padding:9px 14px;font-size:12px;color:'+(e.files&&e.files.length?'#0369a1':'var(--muted)')+'">'+(e.files&&e.files.length?'📎 '+e.files.length:'—')+'</td>'
                +'<td style="padding:9px 14px">'
                  +'<button onclick="window._lb.tab=\'feed\';window._lb.viewId=\''+e.id+'\';window._lb.filterCourse=\'\';render()" style="padding:5px 12px;border-radius:7px;border:1.5px solid #c4b5fd;background:#f5f3ff;color:#7c3aed;font-size:11.5px;font-weight:700;cursor:pointer">View & Note</button>'
                +'</td>'
              +'</tr>';
            });
            hmHtml += '</tbody></table></div>';
          });
          hmHtml += '</div>'; // end course block
        });
      }
      body = hmHtml;
    }

    /* ══════════════════════════
       TAB: BRIDGE SUMMARY
    ══════════════════════════ */
    if (lb.tab === 'bridge') {
      /* Teacher-wise summary */
      var teacherMap = {};
      entries.forEach(function(e) {
        var t = e.teacherName || 'Unknown';
        if (!teacherMap[t]) teacherMap[t] = { topics:0, files:0, doubts:0, resolved:0, pending:0 };
        teacherMap[t].topics++;
        teacherMap[t].files  += (e.files||[]).length;
        if (e.status === 'Doubt Raised') teacherMap[t].doubts++;
        if (e.status === 'Resolved')     teacherMap[t].resolved++;
        if (e.status === 'Pending HM Review') teacherMap[t].pending++;
      });

      /* Course-Subject matrix */
      var matrixMap = {};
      entries.forEach(function(e) {
        var key = (e.course||'?') + '|' + (e.subject||'?');
        if (!matrixMap[key]) matrixMap[key] = { course:e.course, subject:e.subject, count:0, doubts:0 };
        matrixMap[key].count++;
        if (e.status === 'Doubt Raised') matrixMap[key].doubts++;
      });

      var bridgeHtml = '';

      /* Teacher summary table */
      bridgeHtml += '<div class="card" style="margin-bottom:20px"><div class="card-head"><span class="card-title">👩‍🏫 Teacher-wise Lesson Summary</span></div>'
        +'<div style="overflow-x:auto"><table><thead><tr>'
          +'<th>Teacher</th><th>Topics Logged</th><th>Files Shared</th><th>Doubts Raised</th><th>Resolved</th><th>Pending HM</th>'
        +'</tr></thead><tbody>'
        +Object.keys(teacherMap).sort().map(function(t) {
          var s = teacherMap[t];
          return '<tr>'
            +'<td><b>'+_e(t)+'</b></td>'
            +'<td style="text-align:center;font-weight:700;color:#1433a8">'+s.topics+'</td>'
            +'<td style="text-align:center;color:#0369a1">'+s.files+'</td>'
            +'<td style="text-align:center;color:'+(s.doubts>0?'#dc2626':'var(--muted)')+'">'+s.doubts+'</td>'
            +'<td style="text-align:center;color:#16a34a">'+s.resolved+'</td>'
            +'<td style="text-align:center;color:'+(s.pending>0?'#d97706':'var(--muted)')+'">'+s.pending+'</td>'
          +'</tr>';
        }).join('')
        +(Object.keys(teacherMap).length===0?'<tr><td colspan="6" style="text-align:center;padding:28px;color:var(--muted)">No data yet</td></tr>':'')
        +'</tbody></table></div></div>';

      /* Course-Subject matrix */
      bridgeHtml += '<div class="card" style="margin-bottom:20px"><div class="card-head"><span class="card-title">🎓 Course × Subject Coverage Matrix</span></div>'
        +'<div style="overflow-x:auto"><table><thead><tr>'
          +'<th>Course</th><th>Subject</th><th>Topics</th><th>Doubts</th>'
        +'</tr></thead><tbody>'
        +Object.values(matrixMap).sort(function(a,b){ return a.course < b.course ? -1 : 1; }).map(function(r) {
          return '<tr>'
            +'<td><b>'+_e(r.course)+'</b></td>'
            +'<td>'+_e(r.subject)+'</td>'
            +'<td style="text-align:center;font-weight:700;color:#1433a8">'+r.count+'</td>'
            +'<td style="text-align:center;color:'+(r.doubts>0?'#dc2626':'var(--muted)')+'">'+r.doubts+'</td>'
          +'</tr>';
        }).join('')
        +(Object.keys(matrixMap).length===0?'<tr><td colspan="4" style="text-align:center;padding:28px;color:var(--muted)">No data yet</td></tr>':'')
        +'</tbody></table></div></div>';

      /* Student focus list — from all HM notes */
      var stuFocus = {};
      entries.forEach(function(e) {
        (e.hmNotes||[]).forEach(function(n) {
          (n.students||[]).forEach(function(s) {
            if (!stuFocus[s]) stuFocus[s] = [];
            stuFocus[s].push({ subject: e.subject, topic: e.topic, date: n.date, resolved: e.status === 'Resolved' });
          });
        });
      });
      if (Object.keys(stuFocus).length) {
        bridgeHtml += '<div class="card"><div class="card-head"><span class="card-title">👤 Students Needing Focus (HM Tagged)</span></div>'
          +'<div style="overflow-x:auto"><table><thead><tr><th>Student</th><th>Subject</th><th>Topic</th><th>Flagged On</th><th>Status</th></tr></thead><tbody>'
          +Object.keys(stuFocus).sort().map(function(s) {
            return stuFocus[s].map(function(r, i) {
              return '<tr>'
                +(i===0?'<td rowspan="'+stuFocus[s].length+'" style="font-weight:700;vertical-align:top;padding-top:10px">'+_e(s)+'</td>':'')
                +'<td>'+_e(r.subject)+'</td>'
                +'<td>'+_e(r.topic)+'</td>'
                +'<td style="font-size:11.5px;color:var(--muted)">'+new Date(r.date).toLocaleDateString('en-IN')+'</td>'
                +'<td>'+(r.resolved?'<span style="color:#16a34a;font-weight:700">✅ Resolved</span>':'<span style="color:#dc2626;font-weight:700">🚨 Open</span>')+'</td>'
              +'</tr>';
            }).join('');
          }).join('')
          +'</tbody></table></div></div>';
      }

      body = bridgeHtml;
    }

    return '<div class="page-wrap">'
      + header
      + tabBar
      + body
    +'</div>';
  };

  /* ── also expose to teacher RBAC ── */
  (function patchTeacherRBAC() {
    if (typeof ROLE_PAGES === 'undefined') { setTimeout(patchTeacherRBAC, 400); return; }
    ['teacher','housemaster','hostel','accounts','it','reception','staff'].forEach(function(role) {
      if (ROLE_PAGES[role] && ROLE_PAGES[role].indexOf('lessonbridge') === -1) {
        ROLE_PAGES[role].push('lessonbridge');
      }
    });
  })();

  (void 0);
})();

</script>
<script>
/* ═══════════════════════════════════════════════════════════════════════════
   GNSI SOCIAL — Staff & Teacher Internal Social Platform  v1.0
   ═══════════════════════════════════════════════════════════════════════════
   Pages  : gnsi_social  (Connect section)
   Storage: gnsi_social_posts  (localStorage + Supabase KV)
   Roles  : all staff (post/react/comment), admin can delete any
   ─────────────────────────────────────────────────────────────────────────
   Post schema:
   { id, authorId, authorName, authorRole, authorInitials,
     type: 'post'|'achievement'|'announcement'|'resource'|'poll',
     category: 'Academic'|'Achievement'|'General'|'Notice'|'Resource',
     title, body,
     files: [{name,type,size,data}],
     imageData (base64 featured image),
     poll: {question, options:[{id,text,votes:[userId]}]},
     tags:[],
     reactions: {like:[],love:[],clap:[],fire:[]},
     comments:[{id,authorId,authorName,body,createdAt,reactions:{like:[]}}],
     pinned, createdAt, updatedAt }
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── tiny helpers ── */
  function _e(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  function _toast(m,c){ if(typeof showToast==='function') showToast(m,c||'#1433a8'); }
  function _u(){ return (typeof currentUser!=='undefined'&&currentUser)||{id:0,name:'Unknown',role:'staff'}; }
  function _uid(){ return String(_u().id||_u().name||'anon'); }
  function _initials(n){ return (n||'?').trim().split(' ').slice(0,2).map(function(w){return w[0]||'';}).join('').toUpperCase()||'?'; }
  function _ago(iso){
    var d=new Date(iso), now=new Date(), diff=Math.floor((now-d)/1000);
    if(diff<60) return 'just now';
    if(diff<3600) return Math.floor(diff/60)+'m ago';
    if(diff<86400) return Math.floor(diff/3600)+'h ago';
    if(diff<604800) return Math.floor(diff/86400)+'d ago';
    return d.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
  }
  function _roleColor(role){
    var m={admin:'#1433a8',manager:'#7c3aed',accounts:'#d4a853',teacher:'#16a34a',
           hostel:'#3b78c9',housemaster:'#9d174d',it:'#0891b2',reception:'#0e7490',staff:'#6474a0'};
    return m[role]||'#64748b';
  }
  function _roleLabel(role){
    var m={admin:'Administrator',manager:'Manager',accounts:'Accounts',teacher:'Teacher',
           hostel:'Hostel Staff',housemaster:'House Master',it:'IT Staff',reception:'Receptionist',staff:'Staff'};
    return m[role]||role||'Staff';
  }
  function _fileIcon(t){
    if(!t) return '📎';
    if(t.includes('pdf'))   return '📄';
    if(t.includes('image')) return '🖼';
    if(t.includes('word')||t.includes('docx')) return '📝';
    if(t.includes('sheet')||t.includes('xlsx')||t.includes('csv')) return '📊';
    if(t.includes('ppt'))   return '📊';
    return '📎';
  }

  /* ── key ── */
  var KEY = 'gnsi_social_posts';

  /* ── persistence ── */
  function _load(){ try{ var r=localStorage.getItem(KEY); return r?JSON.parse(r):{posts:[]}; }catch(e){return{posts:[]};} }
  function _save(d){ try{localStorage.setItem(KEY,JSON.stringify(d));}catch(e){} if(typeof gnsiKVPush==='function'){try{gnsiKVPush(KEY,d);}catch(e){}} }
  function _posts(){ return (_load().posts||[]).slice().sort(function(a,b){ if(a.pinned&&!b.pinned)return -1; if(!a.pinned&&b.pinned)return 1; return a.createdAt<b.createdAt?1:-1; }); }
  function _savePosts(arr){ var d=_load(); d.posts=arr; _save(d); }

  /* ── state ── */
  window._gs = window._gs || {
    tab:'feed',          // feed | create | profile | saved
    feedFilter:'all',    // all | Academic | Achievement | General | Notice | Resource | polls
    searchQ:'',
    expandPost:null,     // post id expanded for comments
    editPost:null,       // post id being edited
    composerType:'post', // post|achievement|announcement|resource|poll
    savedIds:[],         // locally bookmarked post ids
    profileUser:null,    // authorName being viewed
    lightbox:null        // {postId, fileIdx}
  };

  /* ── categories ── */
  var CATS = [
    {id:'all',         label:'All',          icon:'🏠', color:'#1433a8'},
    {id:'General',     label:'General',       icon:'💬', color:'#64748b'},
    {id:'Academic',    label:'Academic',      icon:'📚', color:'#16a34a'},
    {id:'Achievement', label:'Achievement',   icon:'🏆', color:'#d97706'},
    {id:'Notice',      label:'Notice',        icon:'📣', color:'#dc2626'},
    {id:'Resource',    label:'Resource',      icon:'📎', color:'#0891b2'},
    {id:'polls',       label:'Polls',         icon:'📊', color:'#7c3aed'}
  ];

  var REACTIONS = [
    {id:'like',  emoji:'👍', label:'Like'},
    {id:'love',  emoji:'❤️', label:'Love'},
    {id:'clap',  emoji:'👏', label:'Clap'},
    {id:'fire',  emoji:'🔥', label:'Fire'}
  ];

  /* ═══════════════════════════════════════════════════════════
     ACTIONS
  ═══════════════════════════════════════════════════════════ */

  /* ── save/edit post ── */
  window.gsSavePost = function(){
    var gs   = window._gs;
    var type = gs.composerType;
    var title= ((document.getElementById('gs-title')||{}).value||'').trim();
    var body = ((document.getElementById('gs-body')||{}).value||'').trim();
    var cat  = (document.getElementById('gs-cat')||{}).value||'General';
    var tags = ((document.getElementById('gs-tags')||{}).value||'').split(',').map(function(t){return t.trim();}).filter(Boolean);

    if(!body && !title){ _toast('Write something first','#dc2626'); return; }

    var poll = null;
    if(type==='poll'){
      var q   = ((document.getElementById('gs-poll-q')||{}).value||'').trim();
      var opts= [];
      for(var i=0;i<6;i++){
        var el=document.getElementById('gs-poll-opt-'+i);
        if(el&&el.value.trim()) opts.push({id:'opt'+i,text:el.value.trim(),votes:[]});
      }
      if(!q||opts.length<2){ _toast('Enter poll question and at least 2 options','#dc2626'); return; }
      poll = {question:q, options:opts};
    }

    var u    = _u();
    var now  = new Date().toISOString();
    var posts= _posts().slice().sort(function(a,b){return a.createdAt<b.createdAt?1:-1;});

    function _proceed(files, imgData){
      var editId = gs.editPost;
      if(editId){
        posts = posts.map(function(p){
          if(p.id!==editId) return p;
          return Object.assign({},p,{title:title,body:body,category:cat,tags:tags,
            files:files.length?files:p.files, imageData:imgData||p.imageData,
            poll:poll||p.poll, updatedAt:now});
        });
        _toast('✅ Post updated','#16a34a');
      } else {
        posts.unshift({
          id:'gsp_'+Date.now()+'_'+Math.random().toString(36).slice(2,4),
          authorId:String(u.id||u.name), authorName:u.name, authorRole:u.role,
          authorInitials:_initials(u.name),
          type:type, category:cat, title:title, body:body,
          files:files, imageData:imgData||null,
          poll:poll, tags:tags,
          reactions:{like:[],love:[],clap:[],fire:[]},
          comments:[], pinned:false, createdAt:now, updatedAt:now
        });
        _toast('✅ Posted to GNSI Social','#16a34a');
      }
      _savePosts(posts);
      gs.editPost=null; gs.tab='feed';
      if(typeof render==='function') render();
    }

    /* read files */
    var fi = document.getElementById('gs-files');
    var imgI = document.getElementById('gs-image');
    var allFiles=[];
    var imgData=null;
    var pending=0;

    /* featured image */
    if(imgI&&imgI.files&&imgI.files[0]){
      pending++;
      var ir=new FileReader();
      ir.onload=function(ev){imgData=ev.target.result;pending--;if(!pending)_proceed(allFiles,imgData);};
      ir.readAsDataURL(imgI.files[0]);
    }

    /* attachments */
    if(fi&&fi.files&&fi.files.length){
      Array.from(fi.files).forEach(function(f){
        if(f.size>8*1024*1024){_toast('File "'+f.name+'" >8MB skipped','#ea580c');return;}
        pending++;
        var r=new FileReader();
        r.onload=function(ev){
          allFiles.push({name:f.name,type:f.type,size:f.size,data:ev.target.result});
          pending--;if(!pending)_proceed(allFiles,imgData);
        };
        r.readAsDataURL(f);
      });
    }
    if(!pending) _proceed([],null);
  };

  /* ── delete post ── */
  window.gsDeletePost = function(id){
    var p=_posts().find(function(x){return x.id===id;});
    if(!p) return;
    var u=_u();
    var canDel=p.authorId===String(u.id||u.name)||p.authorName===u.name||u.role==='admin'||u.role==='manager';
    if(!canDel){_toast('Cannot delete others\' posts','#dc2626');return;}
    if(!confirm('Delete this post?')) return;
    _savePosts(_posts().filter(function(x){return x.id!==id;}));
    if(window._gs.expandPost===id) window._gs.expandPost=null;
    _toast('Post deleted','#dc2626');
    if(typeof render==='function') render();
  };

  /* ── pin/unpin ── */
  window.gsTogglePin = function(id){
    var u=_u();
    if(u.role!=='admin'&&u.role!=='manager'){_toast('Only Admin/Manager can pin','#dc2626');return;}
    var posts=_posts();
    posts=posts.map(function(p){return p.id===id?Object.assign({},p,{pinned:!p.pinned}):p;});
    _savePosts(posts);
    if(typeof render==='function') render();
  };

  /* ── react ── */
  window.gsReact = function(postId,rxn){
    var uid=_uid();
    var posts=_posts();
    posts=posts.map(function(p){
      if(p.id!==postId) return p;
      var r=Object.assign({},p.reactions||{like:[],love:[],clap:[],fire:[]});
      if(!r[rxn]) r[rxn]=[];
      var idx=r[rxn].indexOf(uid);
      if(idx>-1) r[rxn].splice(idx,1); else r[rxn].push(uid);
      return Object.assign({},p,{reactions:r});
    });
    _savePosts(posts);
    if(typeof render==='function') render();
  };

  /* ── comment ── */
  window.gsAddComment = function(postId){
    var txt=((document.getElementById('gs-cmt-'+postId)||{}).value||'').trim();
    if(!txt){_toast('Enter a comment','#dc2626');return;}
    var u=_u(), now=new Date().toISOString();
    var posts=_posts();
    posts=posts.map(function(p){
      if(p.id!==postId) return p;
      var cmts=(p.comments||[]).slice();
      cmts.push({id:'c_'+Date.now(),authorId:String(u.id||u.name),authorName:u.name,
        authorRole:u.role,body:txt,createdAt:now,reactions:{like:[]}});
      return Object.assign({},p,{comments:cmts,updatedAt:now});
    });
    _savePosts(posts);
    if(typeof render==='function') render();
  };

  /* ── react to comment ── */
  window.gsReactComment = function(postId,cmtId){
    var uid=_uid();
    var posts=_posts();
    posts=posts.map(function(p){
      if(p.id!==postId) return p;
      var cmts=(p.comments||[]).map(function(c){
        if(c.id!==cmtId) return c;
        var likes=(c.reactions&&c.reactions.like)||[];
        var idx=likes.indexOf(uid);
        if(idx>-1) likes.splice(idx,1); else likes.push(uid);
        return Object.assign({},c,{reactions:{like:likes}});
      });
      return Object.assign({},p,{comments:cmts});
    });
    _savePosts(posts);
    if(typeof render==='function') render();
  };

  /* ── delete comment ── */
  window.gsDeleteComment = function(postId,cmtId){
    var u=_u();
    var posts=_posts();
    posts=posts.map(function(p){
      if(p.id!==postId) return p;
      var cmts=(p.comments||[]).filter(function(c){
        if(c.id!==cmtId) return true;
        return !(c.authorId===String(u.id||u.name)||c.authorName===u.name||u.role==='admin'||u.role==='manager');
      });
      return Object.assign({},p,{comments:cmts});
    });
    _savePosts(posts);
    if(typeof render==='function') render();
  };

  /* ── poll vote ── */
  window.gsPollVote = function(postId,optId){
    var uid=_uid();
    var posts=_posts();
    posts=posts.map(function(p){
      if(p.id!==postId||!p.poll) return p;
      /* remove existing vote */
      var opts=p.poll.options.map(function(o){
        return Object.assign({},o,{votes:(o.votes||[]).filter(function(v){return v!==uid;})});
      });
      /* add vote to chosen option */
      opts=opts.map(function(o){
        if(o.id!==optId) return o;
        return Object.assign({},o,{votes:(o.votes||[]).concat([uid])});
      });
      return Object.assign({},p,{poll:Object.assign({},p.poll,{options:opts})});
    });
    _savePosts(posts);
    if(typeof render==='function') render();
  };

  /* ── bookmark ── */
  window.gsToggleSave = function(id){
    var gs=window._gs;
    var idx=gs.savedIds.indexOf(id);
    if(idx>-1) gs.savedIds.splice(idx,1); else gs.savedIds.push(id);
    if(typeof render==='function') render();
  };

  /* ── lightbox ── */
  window.gsOpenLightbox = function(postId,idx){
    window._gs.lightbox={postId:postId,fileIdx:idx};
    if(typeof render==='function') render();
  };
  window.gsCloseLightbox = function(){
    window._gs.lightbox=null;
    if(typeof render==='function') render();
  };

  /* ── open file ── */
  window.gsOpenFile = function(postId,idx){
    var p=_posts().find(function(x){return x.id===postId;});
    if(!p||!p.files||!p.files[idx]) return;
    var f=p.files[idx];
    var win=window.open('','_blank');
    if(!win){_toast('Allow popups','#dc2626');return;}
    if(f.type&&f.type.includes('image')){
      win.document.write('<html><body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh"><img src="'+f.data+'" style="max-width:100%;max-height:100vh"/></body></html>');
    } else if(f.type&&f.type.includes('pdf')){
      win.document.write('<html><body style="margin:0"><embed src="'+f.data+'" type="application/pdf" width="100%" height="100%" style="position:fixed;inset:0"/></body></html>');
    } else {
      var a=win.document.createElement('a');a.href=f.data;a.download=f.name;a.click();win.close();
    }
  };

  /* ═══════════════════════════════════════════════════════════
     RENDER HELPERS
  ═══════════════════════════════════════════════════════════ */

  function _avatar(name,role,size){
    size=size||38;
    var col=_roleColor(role);
    var hue=(name||'X').split('').reduce(function(a,c){return a+c.charCodeAt(0);},0)%360;
    return '<div style="width:'+size+'px;height:'+size+'px;border-radius:50%;background:hsl('+hue+',45%,42%);border:2.5px solid '+col+'44;display:flex;align-items:center;justify-content:center;font-size:'+(size*0.37)+'px;font-weight:800;color:#fff;flex-shrink:0">'+_initials(name)+'</div>';
  }

  function _catBadge(cat){
    var c=CATS.find(function(x){return x.id===cat;})||{icon:'💬',color:'#64748b',label:cat};
    return '<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 9px;border-radius:12px;font-size:10.5px;font-weight:700;background:'+c.color+'18;color:'+c.color+';border:1px solid '+c.color+'33">'+c.icon+' '+_e(c.label||cat)+'</span>';
  }

  function _typeBadge(type){
    var m={post:['💬','#64748b'],achievement:['🏆','#d97706'],announcement:['📣','#dc2626'],resource:['📎','#0891b2'],poll:['📊','#7c3aed']};
    var c=m[type]||m.post;
    return '<span style="font-size:10.5px;font-weight:700;color:'+c[1]+'">'+c[0]+' '+type.charAt(0).toUpperCase()+type.slice(1)+'</span>';
  }

  /* ── render one post card ── */
  function _renderPost(p){
    var gs=window._gs;
    var u=_u(), uid=_uid();
    var isOwn=p.authorId===String(u.id||u.name)||p.authorName===u.name;
    var isAdmin=u.role==='admin'||u.role==='manager';
    var expanded=gs.expandPost===p.id;
    var saved=gs.savedIds.indexOf(p.id)>-1;
    var totalRxn=Object.values(p.reactions||{}).reduce(function(s,a){return s+a.length;},0);
    var cmtCount=(p.comments||[]).length;
    var myRxn=null;
    REACTIONS.forEach(function(r){if((p.reactions[r.id]||[]).indexOf(uid)>-1) myRxn=r.id;});

    /* featured image */
    var imgHtml='';
    if(p.imageData){
      imgHtml='<div style="margin:0 -1px;cursor:pointer" onclick="gsOpenLightbox(\''+p.id+'\',\'img\')">'
        +'<img src="'+p.imageData+'" alt="post image" style="width:100%;max-height:360px;object-fit:cover;display:block"/>'
      +'</div>';
    }

    /* reaction bar */
    var rxnBar='<div style="display:flex;gap:4px;flex-wrap:wrap">'
      +REACTIONS.map(function(r){
        var cnt=(p.reactions[r.id]||[]).length;
        var active=myRxn===r.id;
        return '<button onclick="gsReact(\''+p.id+'\',\''+parseInt(r.id,10)+'\')" title="'+r.label+'" style="display:flex;align-items:center;gap:4px;padding:5px 10px;border-radius:20px;border:1.5px solid '+(active?_roleColor(u.role):'var(--border)')+';background:'+(active?_roleColor(u.role)+'18':'var(--surface)')+';cursor:pointer;font-size:12px;font-weight:'+(active?'800':'600')+';color:'+(active?_roleColor(u.role):'var(--muted)')+'">'+r.emoji+(cnt?' <span>'+cnt+'</span>':'')+'</button>';
      }).join('')
    +'</div>';

    /* poll */
    var pollHtml='';
    if(p.poll){
      var totalVotes=p.poll.options.reduce(function(s,o){return s+(o.votes||[]).length;},0);
      var myVote=null;
      p.poll.options.forEach(function(o){if((o.votes||[]).indexOf(uid)>-1) myVote=o.id;});
      pollHtml='<div style="background:linear-gradient(135deg,#faf5ff,#f3e8ff);border:1.5px solid #c4b5fd;border-radius:12px;padding:16px;margin:12px 0">'
        +'<div style="font-weight:800;font-size:13.5px;color:#7c3aed;margin-bottom:12px">📊 '+_e(p.poll.question)+'</div>'
        +p.poll.options.map(function(o){
          var cnt=(o.votes||[]).length;
          var pct=totalVotes>0?Math.round(cnt/totalVotes*100):0;
          var voted=myVote===o.id;
          return '<div style="margin-bottom:8px">'
            +'<button onclick="gsPollVote(\''+p.id+'\',\''+o.id+'\')" style="width:100%;text-align:left;padding:0;border:none;background:none;cursor:pointer">'
              +'<div style="position:relative;background:'+(voted?'#ede9fe':'var(--surface2)')+';border:1.5px solid '+(voted?'#c4b5fd':'var(--border)')+';border-radius:8px;overflow:hidden;padding:9px 14px">'
                +'<div style="position:absolute;inset:0;background:#c4b5fd;opacity:.25;width:'+pct+'%;transition:width .4s"></div>'
                +'<div style="position:relative;display:flex;justify-content:space-between;align-items:center">'
                  +'<span style="font-size:13px;font-weight:'+(voted?'700':'500')+';color:'+(voted?'#7c3aed':'var(--text)')+'">'+_e(o.text)+'</span>'
                  +'<span style="font-size:11.5px;font-weight:700;color:#7c3aed">'+pct+'% ('+cnt+')</span>'
                +'</div>'
              +'</div>'
            +'</button>'
          +'</div>';
        }).join('')
        +'<div style="font-size:11px;color:#94a3b8;margin-top:4px">'+totalVotes+' vote'+(totalVotes!==1?'s':'')+' · click to vote</div>'
      +'</div>';
    }

    /* files */
    var filesHtml='';
    var imgFiles=(p.files||[]).filter(function(f){return f.type&&f.type.startsWith('image/');});
    var otherFiles=(p.files||[]).filter(function(f){return !f.type||!f.type.startsWith('image/');});
    if(imgFiles.length){
      var cols=imgFiles.length===1?'1fr':imgFiles.length===2?'1fr 1fr':'1fr 1fr 1fr';
      filesHtml+='<div style="display:grid;grid-template-columns:'+cols+';gap:4px;margin:10px 0;border-radius:10px;overflow:hidden">'
        +imgFiles.map(function(f,i){
          var realIdx=(p.files||[]).indexOf(f);
          return '<div style="cursor:pointer;background:#f1f5f9;aspect-ratio:1;overflow:hidden" onclick="gsOpenLightbox(\''+p.id+'\','+realIdx+')">'
            +'<img src="'+f.data+'" style="width:100%;height:100%;object-fit:cover" alt="'+_e(f.name)+'"/>'
          +'</div>';
        }).join('')
      +'</div>';
    }
    if(otherFiles.length){
      filesHtml+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin:8px 0">'
        +otherFiles.map(function(f){
          var realIdx=(p.files||[]).indexOf(f);
          return '<button onclick="gsOpenFile(\''+p.id+'\','+realIdx+')" style="display:flex;align-items:center;gap:7px;padding:8px 14px;border-radius:8px;border:1.5px solid #bae6fd;background:#f0f9ff;color:#0369a1;cursor:pointer;font-size:12.5px;font-weight:600">'
            +_fileIcon(f.type)+' <span>'+_e(f.name)+'</span>'
            +'<span style="font-size:10px;color:#94a3b8">('+Math.round(f.size/1024)+'KB)</span></button>';
        }).join('')
      +'</div>';
    }

    /* tags */
    var tagsHtml=(p.tags&&p.tags.length)?'<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">'
      +p.tags.map(function(t){return '<span style="background:#eff6ff;color:#1433a8;border-radius:12px;padding:2px 10px;font-size:11px;font-weight:700">#'+_e(t)+'</span>';}).join('')
    +'</div>':'';

    /* comments section */
    var cmtsHtml='';
    if(expanded){
      var cmts=p.comments||[];
      cmtsHtml='<div style="border-top:1.5px solid var(--border-soft);padding-top:14px;margin-top:4px">'
        +(cmts.length?cmts.map(function(c){
          var cMine=c.authorId===String(u.id||u.name)||c.authorName===u.name;
          var cLikes=(c.reactions&&c.reactions.like)||[];
          var cLiked=cLikes.indexOf(uid)>-1;
          return '<div style="display:flex;gap:10px;margin-bottom:12px">'
            +_avatar(c.authorName,c.authorRole,32)
            +'<div style="flex:1;min-width:0">'
              +'<div style="background:var(--surface2);border-radius:0 10px 10px 10px;padding:9px 13px">'
                +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px">'
                  +'<span style="font-size:12px;font-weight:700;color:'+_roleColor(c.authorRole)+'">'+_e(c.authorName)+'</span>'
                  +'<span style="font-size:10.5px;color:var(--muted)">'+_ago(c.createdAt)+'</span>'
                +'</div>'
                +'<div style="font-size:13px;color:var(--text);word-break:break-word">'+_e(c.body)+'</div>'
              +'</div>'
              +'<div style="display:flex;gap:10px;padding:4px 4px 0;font-size:11.5px">'
                +'<button onclick="gsReactComment(\''+p.id+'\',\''+c.id+'\')" style="background:none;border:none;cursor:pointer;color:'+(cLiked?'#dc2626':'var(--muted)')+';font-weight:'+(cLiked?'700':'500')+';font-size:11.5px;padding:2px 4px">👍 '+(cLikes.length||'')+' Like</button>'
                +(cMine||isAdmin?'<button onclick="gsDeleteComment(\''+p.id+'\',\''+c.id+'\')" style="background:none;border:none;cursor:pointer;color:var(--muted);font-size:11.5px;padding:2px 4px">🗑 Delete</button>':'')
              +'</div>'
            +'</div>'
          +'</div>';
        }).join(''):'<div style="text-align:center;padding:20px;color:var(--muted);font-size:13px">No comments yet — be first!</div>')
        /* comment input */
        +'<div style="display:flex;gap:10px;margin-top:10px;align-items:flex-start">'
          +_avatar(u.name,u.role,34)
          +'<div style="flex:1;display:flex;gap:8px;align-items:flex-end">'
            +'<textarea id="gs-cmt-'+p.id+'" placeholder="Write a comment..." rows="2" style="flex:1;border:1.5px solid var(--border);border-radius:10px;padding:9px 12px;font-size:13px;resize:none;background:var(--surface);color:var(--text);font-family:\'DM Sans\',sans-serif;outline:none;line-height:1.5" onkeydown="if(event.ctrlKey&&event.key===\'Enter\'){gsAddComment(\''+p.id+'\');this.value=\'\'}"></textarea>'
            +'<button onclick="gsAddComment(\''+p.id+'\');document.getElementById(\'gs-cmt-'+p.id+'\').value=\'\'" style="padding:9px 16px;border-radius:10px;background:var(--accent);color:#fff;border:none;cursor:pointer;font-size:13px;font-weight:700;font-family:\'DM Sans\',sans-serif">Send</button>'
          +'</div>'
        +'</div>'
      +'</div>';
    }

    return '<div id="gsp-'+p.id+'" style="background:var(--surface);border:1.5px solid '+(p.pinned?'#fbbf24':'var(--border)')+';border-radius:16px;margin-bottom:14px;overflow:hidden;box-shadow:0 1px 6px rgba(0,0,0,.06);transition:box-shadow .2s" onmouseenter="this.style.boxShadow=\'0 4px 20px rgba(0,0,0,.1)\'" onmouseleave="this.style.boxShadow=\'0 1px 6px rgba(0,0,0,.06)\'">'
      /* pinned banner */
      +(p.pinned?'<div style="background:linear-gradient(90deg,#fbbf24,#f59e0b);padding:5px 16px;font-size:11px;font-weight:700;color:#78350f">📌 Pinned Post</div>':'')
      /* post header */
      +'<div style="padding:16px 18px 0">'
        +'<div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px">'
          +_avatar(p.authorName,p.authorRole,42)
          +'<div style="flex:1;min-width:0">'
            +'<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">'
              +'<span style="font-weight:800;font-size:14px;color:var(--text);cursor:pointer" onclick="window._gs.profileUser=\''+_e(p.authorName)+'\';window._gs.tab=\'profile\';render()">'+_e(p.authorName)+'</span>'
              +'<span style="font-size:11px;color:'+_roleColor(p.authorRole)+';font-weight:700;background:'+_roleColor(p.authorRole)+'15;padding:1px 8px;border-radius:10px">'+_roleLabel(p.authorRole)+'</span>'
              +_catBadge(p.category)
            +'</div>'
            +'<div style="font-size:11.5px;color:var(--muted);margin-top:2px">'+_ago(p.createdAt)+(p.updatedAt!==p.createdAt?' · edited':'')+'</div>'
          +'</div>'
          /* post actions menu */
          +'<div style="display:flex;gap:6px;flex-shrink:0">'
            +'<button onclick="gsToggleSave(\''+p.id+'\')" title="'+(saved?'Unsave':'Save')+'" style="background:none;border:none;cursor:pointer;font-size:18px;line-height:1;padding:2px 4px;opacity:'+(saved?'1':'.5')+'">'+(saved?'🔖':'🔖')+'</button>'
            +(isAdmin?'<button onclick="gsTogglePin(\''+p.id+'\')" title="'+(p.pinned?'Unpin':'Pin')+'" style="background:none;border:none;cursor:pointer;font-size:16px;line-height:1;padding:2px 4px">📌</button>':'')
            +((isOwn||isAdmin)?'<button onclick="window._gs.editPost=\''+p.id+'\';window._gs.composerType=\''+p.type+'\';window._gs.tab=\'create\';render()" title="Edit" style="background:none;border:none;cursor:pointer;font-size:15px;line-height:1;padding:2px 4px">✏️</button>':'')
            +((isOwn||isAdmin)?'<button onclick="gsDeletePost(\''+p.id+'\')" title="Delete" style="background:none;border:none;cursor:pointer;font-size:15px;line-height:1;padding:2px 4px;color:#dc2626">🗑</button>':'')
          +'</div>'
        +'</div>'
        /* title */
        +(p.title?'<div style="font-family:\'Playfair Display\',serif;font-size:17px;font-weight:700;color:var(--text);margin-bottom:8px;line-height:1.3">'+_e(p.title)+'</div>':'')
        /* body */
        +(p.body?'<div style="font-size:14px;color:var(--text);line-height:1.65;white-space:pre-wrap;word-break:break-word;margin-bottom:10px">'+_e(p.body)+'</div>':'')
      +'</div>'
      /* featured image */
      +imgHtml
      /* content */
      +'<div style="padding:0 18px">'
        +pollHtml
        +filesHtml
        +tagsHtml
      +'</div>'
      /* footer: reactions + comment toggle */
      +'<div style="padding:10px 18px;border-top:1px solid var(--border-soft);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-top:8px">'
        +rxnBar
        +'<div style="display:flex;align-items:center;gap:10px">'
          +(totalRxn?'<span style="font-size:12px;color:var(--muted)">'+totalRxn+' reaction'+(totalRxn!==1?'s':'')+'</span>':'')
          +'<button onclick="window._gs.expandPost=window._gs.expandPost===\''+p.id+'\'?null:\''+p.id+'\';render()" style="display:flex;align-items:center;gap:5px;padding:6px 14px;border-radius:20px;border:1.5px solid var(--border);background:var(--surface);cursor:pointer;font-size:12.5px;font-weight:700;color:'+(expanded?'var(--accent)':'var(--muted)')+'">💬 '+cmtCount+' Comment'+(cmtCount!==1?'s':'')+'</button>'
        +'</div>'
      +'</div>'
      /* comments */
      +(expanded?'<div style="padding:0 18px 16px">'+cmtsHtml+'</div>':'')
    +'</div>';
  }

  /* ── composer ── */
  function _renderComposer(){
    var gs=window._gs;
    var u=_u();
    var editPost=gs.editPost?_posts().find(function(x){return x.id===gs.editPost;}):null;
    var ex=editPost||{};
    var type=gs.composerType;

    var typeBtn=function(t,icon,label){
      var a=type===t;
      return '<button onclick="window._gs.composerType=\''+t+'\';render()" style="padding:7px 16px;border-radius:20px;border:1.5px solid '+(a?'var(--accent)':'var(--border)')+';background:'+(a?'var(--accent)':'var(--surface)')+';color:'+(a?'#fff':'var(--muted)')+';font-size:12.5px;font-weight:'+(a?'800':'600')+';cursor:pointer">'+icon+' '+label+'</button>';
    };

    var catOpts=['General','Academic','Achievement','Notice','Resource'].map(function(c){
      return '<option'+(ex.category===c?' selected':'')+(type==='announcement'&&c==='Notice'?' selected':'')+' value="'+c+'">'+c+'</option>';
    }).join('');

    var pollForm='';
    if(type==='poll'){
      var pq=ex.poll?ex.poll.question:'';
      var popts=ex.poll?ex.poll.options:[];
      pollForm='<div style="background:#faf5ff;border:1.5px solid #c4b5fd;border-radius:10px;padding:14px;margin-bottom:12px">'
        +'<div style="font-size:12px;font-weight:700;color:#7c3aed;margin-bottom:10px">📊 Poll Options</div>'
        +'<div class="form-group"><label>Poll Question *</label><input id="gs-poll-q" placeholder="What do you want to ask?" value="'+_e(pq)+'"/></div>'
        +'<div style="font-size:11.5px;font-weight:700;color:var(--muted);margin:10px 0 6px">Options (min 2, max 6):</div>'
        +[0,1,2,3,4,5].map(function(i){
          var v=popts[i]?popts[i].text:'';
          return '<div class="form-group" style="margin-bottom:8px"><input id="gs-poll-opt-'+i+'" placeholder="Option '+(i+1)+(i<2?' *':' (optional)')+'" value="'+_e(v)+'"/></div>';
        }).join('')
      +'</div>';
    }

    return '<div style="background:var(--surface);border:1.5px solid var(--border);border-radius:16px;padding:20px 22px;margin-bottom:20px;box-shadow:0 2px 12px rgba(0,0,0,.07)">'
      +'<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">'
        +_avatar(u.name,u.role,44)
        +'<div><div style="font-weight:800;font-size:14px;color:var(--text)">'+_e(u.name)+'</div>'
          +'<div style="font-size:11.5px;color:'+_roleColor(u.role)+';font-weight:700">'+_roleLabel(u.role)+'</div>'
        +'</div>'
        +(gs.editPost?'<span style="margin-left:auto;font-size:12px;font-weight:700;color:#d97706;background:#fffbeb;border:1px solid #fde047;padding:3px 10px;border-radius:8px">✏️ Editing</span>':'')
      +'</div>'
      /* type selector */
      +'<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">'
        +typeBtn('post','💬','Post')
        +typeBtn('achievement','🏆','Achievement')
        +typeBtn('announcement','📣','Announcement')
        +typeBtn('resource','📎','Resource')
        +typeBtn('poll','📊','Poll')
      +'</div>'
      /* fields */
      +'<div class="form-grid g3" style="margin-bottom:12px">'
        +'<div class="form-group" style="grid-column:1/-1"><label>Title <span style="font-weight:400;color:var(--muted)">(optional)</span></label>'
          +'<input id="gs-title" placeholder="Give your post a headline..." value="'+_e(ex.title||'')+'"/>'
        +'</div>'
        +'<div class="form-group" style="grid-column:1/-1"><label>What\'s on your mind? *</label>'
          +'<textarea id="gs-body" placeholder="Share an update, resource, achievement, or announcement..." rows="4" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:10px 13px;font-size:14px;resize:vertical;background:var(--surface);color:var(--text);font-family:\'DM Sans\',sans-serif;outline:none;box-sizing:border-box">'+_e(ex.body||'')+'</textarea>'
        +'</div>'
        +'<div class="form-group"><label>Category</label><select id="gs-cat"><option value="">General</option>'+catOpts+'</select></div>'
        +'<div class="form-group"><label>Tags <span style="font-weight:400;color:var(--muted)">(comma-separated)</span></label>'
          +'<input id="gs-tags" placeholder="e.g. math, sainik, results" value="'+_e((ex.tags||[]).join(', '))+'"/>'
        +'</div>'
      +'</div>'
      +pollForm
      /* media */
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">'
        +'<div style="background:#f0f9ff;border:1.5px solid #bae6fd;border-radius:10px;padding:12px 14px">'
          +'<div style="font-size:11.5px;font-weight:700;color:#0369a1;margin-bottom:6px">🖼 Featured Image</div>'
          +'<input type="file" id="gs-image" accept="image/*" style="font-size:12px"/>'
          +(ex.imageData?'<div style="margin-top:8px"><img src="'+ex.imageData+'" style="height:60px;border-radius:6px;object-fit:cover"/></div>':'')
        +'</div>'
        +'<div style="background:#f0f9ff;border:1.5px solid #bae6fd;border-radius:10px;padding:12px 14px">'
          +'<div style="font-size:11.5px;font-weight:700;color:#0369a1;margin-bottom:6px">📎 Attach Files <span style="font-weight:400">(PDF, Word, Excel, images — max 8MB each)</span></div>'
          +'<input type="file" id="gs-files" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.webp" style="font-size:12px"/>'
          +(ex.files&&ex.files.length?'<div style="margin-top:6px;font-size:11px;color:var(--muted)">'+ex.files.length+' file'+(ex.files.length>1?'s':'')+' attached</div>':'')
        +'</div>'
      +'</div>'
      /* actions */
      +'<div style="display:flex;gap:10px;align-items:center">'
        +'<button onclick="gsSavePost()" style="flex:1;padding:11px;border-radius:10px;background:linear-gradient(135deg,var(--accent),#2563eb);color:#fff;border:none;cursor:pointer;font-size:14px;font-weight:800;font-family:\'Nunito\',sans-serif">'+(gs.editPost?'✅ Update Post':'🚀 Post to GNSI Social')+'</button>'
        +'<button onclick="window._gs.editPost=null;window._gs.tab=\'feed\';render()" style="padding:11px 20px;border-radius:10px;border:1.5px solid var(--border);background:var(--surface);color:var(--muted);cursor:pointer;font-size:13px;font-weight:700">Cancel</button>'
      +'</div>'
    +'</div>';
  }

  /* ── lightbox ── */
  function _renderLightbox(){
    var lb=window._gs.lightbox;
    if(!lb) return '';
    var p=_posts().find(function(x){return x.id===lb.postId;});
    if(!p) return '';
    var src='';
    if(lb.fileIdx==='img'){
      src=p.imageData;
    } else {
      var f=p.files&&p.files[lb.fileIdx];
      if(!f) return '';
      src=f.data;
    }
    return '<div onclick="gsCloseLightbox()" style="position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px">'
      +'<button onclick="gsCloseLightbox()" style="position:fixed;top:20px;right:24px;background:rgba(255,255,255,.15);border:none;color:#fff;font-size:22px;font-weight:700;border-radius:8px;width:40px;height:40px;cursor:pointer;display:flex;align-items:center;justify-content:center">✕</button>'
      +'<img src="'+src+'" onclick="event.stopPropagation()" style="max-width:94vw;max-height:92vh;border-radius:8px;box-shadow:0 8px 40px rgba(0,0,0,.5);object-fit:contain"/>'
    +'</div>';
  }

  /* ── profile page ── */
  function _renderProfile(){
    var name=window._gs.profileUser;
    if(!name) return '';
    var all=_posts();
    var userPosts=all.filter(function(p){return p.authorName===name;});
    var totalRxns=userPosts.reduce(function(s,p){return s+Object.values(p.reactions||{}).reduce(function(a,b){return a+b.length;},0);},0);
    var firstPost=userPosts.length?userPosts[userPosts.length-1]:null;
    var role=userPosts[0]?userPosts[0].authorRole:'staff';
    var col=_roleColor(role);

    var html='<div style="max-width:680px">'
      /* profile card */
      +'<div style="background:linear-gradient(135deg,'+col+','+col+'cc);border-radius:16px;padding:28px;color:#fff;margin-bottom:20px;position:relative">'
        +'<button onclick="window._gs.profileUser=null;window._gs.tab=\'feed\';render()" style="position:absolute;top:16px;right:16px;background:rgba(255,255,255,.2);border:none;color:#fff;border-radius:8px;padding:5px 12px;cursor:pointer;font-size:12px;font-weight:700">← Back</button>'
        +'<div style="display:flex;align-items:center;gap:18px;margin-bottom:16px">'
          +_avatar(name,role,64)
          +'<div>'
            +'<div style="font-family:\'Playfair Display\',serif;font-size:22px;font-weight:700">'+_e(name)+'</div>'
            +'<div style="font-size:13px;opacity:.85;font-weight:600;margin-top:4px">'+_roleLabel(role)+'</div>'
          +'</div>'
        +'</div>'
        +'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;text-align:center">'
          +[['Posts',userPosts.length],['Reactions Received',totalRxns],['Comments Received',userPosts.reduce(function(s,p){return s+(p.comments||[]).length;},0)]]
          .map(function(k){return '<div style="background:rgba(255,255,255,.15);border-radius:10px;padding:12px"><div style="font-size:22px;font-weight:800">'+k[1]+'</div><div style="font-size:11px;opacity:.8">'+k[0]+'</div></div>';}).join('')
        +'</div>'
        +(firstPost?'<div style="margin-top:12px;font-size:12px;opacity:.75">Member since '+new Date(firstPost.createdAt).toLocaleDateString('en-IN',{month:'long',year:'numeric'})+'</div>':'')
      +'</div>'
      +'<div style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px">Posts by '+_e(name)+'</div>'
      +(userPosts.length?userPosts.map(_renderPost).join(''):'<div style="text-align:center;padding:40px;color:var(--muted)">No posts yet.</div>')
    +'</div>';
    return html;
  }

  /* ═══════════════════════════════════════════════════════════
     MAIN RENDER
  ═══════════════════════════════════════════════════════════ */
