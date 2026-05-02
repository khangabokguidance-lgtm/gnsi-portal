/* GNSI PORTAL — modules/admin.js
   Pages: admincentre, leaderboard
   DEPENDS ON: core/utils.js, core/state.js */

function renderAdminCentre(){
  if(!currentUser||currentUser.role!=='admin'){
    return '<div style="padding:60px;text-align:center"><div style="font-size:48px">\uD83D\uDD12</div><div style="font-size:18px;font-weight:700;color:#dc2626;margin-top:12px">Admin Only</div></div>';
  }
  var today=new Date().toISOString().split('T')[0];
  var attKeys=Object.keys(attendance);
  var attToday=attKeys.filter(function(k){return k.indexOf(today+'-S')===0;});
  var attP=attToday.filter(function(k){return attendance[k]==='P';}).length;
  var attA=attToday.filter(function(k){return attendance[k]==='A';}).length;
  var attL=attToday.filter(function(k){return attendance[k]==='L';}).length;
  var attED=attToday.filter(function(k){return attendance[k]==='ED';}).length;
  var admApps=(function(){try{return JSON.parse(localStorage.getItem('gnsi_adm_apps')||'[]');}catch(e){return[];}})();
  var visitors=rcLoad('visitors');
  var todayVisitors=visitors.filter(function(v){return(v.date||'').indexOf(today)===0;});
  var visitorsIn=todayVisitors.filter(function(v){return v.status==='In';}).length;
  var dutyData=(function(){try{return JSON.parse(localStorage.getItem('ims_dutydata')||'{}');}catch(e){return{};}})();
  var dutyCount=(dutyData.entries||[]).length;
  var behaviour=hmsArr('behaviour');var openBeh=behaviour.filter(function(r){return r.status==='Open';}).length;
  var health=hmsArr('health');var monitoring=health.filter(function(r){return r.status==='Monitoring';}).length;
  var feePending=students.filter(function(s){return s.fees==='Pending';}).length;
  var feePaid=students.filter(function(s){return s.fees==='Paid';}).length;
  var totalIncome=(function(){try{return(JSON.parse(localStorage.getItem('ims_income')||'[]')||[]).reduce(function(t,r){return t+(parseFloat(r.amount)||0);},0);}catch(e){return 0;}})();
  var totalExpend=(function(){try{return(JSON.parse(localStorage.getItem('ims_expend')||'[]')||[]).reduce(function(t,r){return t+(parseFloat(r.amount)||0);},0);}catch(e){return 0;}})();
  var allReports=gnsiGetReports();
  var pendingReports=allReports.filter(function(r){return r.status==='Pending Review';});
  var allPlans=loadLessonPlans();
  var sessions=(function(){try{return JSON.parse(localStorage.getItem('gnsi_sessions')||'[]');}catch(e){return[];}})();
  var activeSess=sessions.filter(function(s){return s.active;});
  var ttPeriods=(function(){try{return JSON.parse(localStorage.getItem('ims_gnsi_periods')||'[]');}catch(e){return[];}})();
  var examTypes=(function(){try{return JSON.parse(localStorage.getItem('gnsi_exam_types')||'[]');}catch(e){return[];}})();
  var auditLog=(function(){try{return JSON.parse(localStorage.getItem('gnsi_audit_log')||'[]');}catch(e){return[];}})();
  var noUsername=staff.filter(function(s){return!localStorage.getItem('gnsi_uname_'+s.id);});
  var noPwd=staff.filter(function(s){return!localStorage.getItem('gnsi_pwd_'+s.id);});
  var boarders=students.filter(function(s){return s.hostel==='Yes';});
  var houseMap=gnsiGetHouseMap();   // PERF: use cache
  var noHouse=boarders.filter(function(s){return!houseMap[String(s.id)];}).length;
  var faculty=getFacultyStaff();
  var sevColor={high:'#dc2626',med:'#f59e0b',low:'#3b78c9'};
  var sevBg={high:'#fef2f2',med:'#fffbeb',low:'#eff6ff'};
  var sevBdr={high:'#fca5a5',med:'#fde68a',low:'#93c5fd'};
  
  var issues=[];
  if(noUsername.length)issues.push({sev:'high',icon:'\uD83D\uDD11',title:'Staff Without Login Username',detail:noUsername.slice(0,5).map(function(s){return s.name;}).join(', ')+(noUsername.length>5?' +more':''),fix:'Settings 2192 Staff Credentials Overview 2192 26a1 Quick Setup  |  Staff 2192 Add Staff (new members)'});
  if(noPwd.length)issues.push({sev:'med',icon:'\uD83D\uDD10',title:'Staff Using Default Passwords',detail:noPwd.length+' still on default password',fix:'Settings 2192 Staff Credentials Overview 2192 Password button'});
  if(students.filter(function(s){return!s.cls;}).length)issues.push({sev:'high',icon:'\uD83C\uDF93',title:'Students Not Assigned to Class',detail:students.filter(function(s){return!s.cls;}).length+' student(s) without class',fix:'Students \u2192 Edit \u2192 assign class'});
  if(students.filter(function(s){return!s.fees;}).length)issues.push({sev:'med',icon:'\uD83D\uDCB3',title:'Students With No Fee Status',detail:students.filter(function(s){return!s.fees;}).length+' student(s) fee status blank',fix:'Fees section \u2192 mark payment status'});
  if(!activeSess.length)issues.push({sev:'high',icon:'\uD83D\uDCC5',title:'No Active Academic Session',detail:'No session is currently marked active',fix:'Sessions \u2192 Set Active'});
  if(!ttPeriods.length)issues.push({sev:'med',icon:'\uD83D\uDCCB',title:'Timetable Not Configured',detail:'No periods in timetable',fix:'Timetable \u2192 Add Periods'});
  if(!dutyCount)issues.push({sev:'low',icon:'\u23F1',title:'Duty Schedule Not Set Up',detail:'No duty entries found',fix:'Duty Hours \u2192 Add entries'});
  if(noHouse>0)issues.push({sev:'med',icon:'\uD83C\uDFE0',title:'Boarders Without House',detail:noHouse+' boarder(s) not in any house',fix:'House Master \u2192 assign houses'});
  if(!examTypes.length)issues.push({sev:'low',icon:'\uD83D\uDCDD',title:'No Exam Types Configured',detail:'Exam types not set up',fix:'Exam & Results \u2192 Exam Types'});
  if(pendingReports.length>=5)issues.push({sev:'med',icon:'\uD83D\uDCC4',title:'Reports Awaiting Review',detail:pendingReports.length+' reports pending admin review',fix:'Report Collection \u2192 Review'});
  if(openBeh>=3)issues.push({sev:'high',icon:'\u26A0\uFE0F',title:'Multiple Open Behaviour Cases',detail:openBeh+' unresolved incidents',fix:'House Master \u2192 Behaviour tab'});
  if(monitoring>=3)issues.push({sev:'high',icon:'\uD83C\uDFE5',title:'Multiple Students Under Medical Watch',detail:monitoring+' boarders under health monitoring',fix:'House Master \u2192 Health tab'});
  // 🔒 RLS security check -- always surface this until admin confirms fix applied
  var _rlsFixed = localStorage.getItem('gnsi_rls_fix_applied') === 'yes';
  if(!_rlsFixed) issues.push({sev:'high',icon:'\uD83D\uDD13',title:'Supabase RLS Policy Needs Updating',detail:'gnsi_keyvalue anon policy exposes credentials to unauthenticated users',fix:'Admin Centre \u2192 Security tab \u2192 Apply RLS Fix'});
  
  var acTabs=[{id:'overview',icon:'\uD83C\uDFE0',label:'Overview'},{id:'feemonitor',icon:'\uD83D\uDD75\uFE0F',label:'Fee Monitor'+(gnsiMonitorAlertCount()>0?' ('+gnsiMonitorAlertCount()+')':'')},{id:'monitor',icon:'\uD83D\uDCE1',label:'Live Monitor'},{id:'analytics',icon:'\uD83D\uDCCA',label:'Analytics'},{id:'students',icon:'\uD83C\uDF93',label:'Student Intel'},{id:'staffintel',icon:'\uD83D\uDC65',label:'Staff Intel'},{id:'audit',icon:'\uD83D\uDD10',label:'Audit Log'},{id:'security',icon:'\uD83D\uDD12',label:'Security'},{id:'schoolsettings',icon:'\uD83C\uDFEB',label:'School Settings'}];
  var tabNav='<div class="ac-tab-bar">'+acTabs.map(function(t){var act=acTab===t.id;return'<button onclick="acTab=\''+t.id+'\';render()" class="ac-tab-btn'+(act?' ac-tab-active':'')+'" style="background:'+(act?'var(--accent)':'transparent')+';color:'+(act?'#fff':'var(--muted)')+'">'+t.icon+' '+t.label+'</button>';}).join('')+'</div>';
  
  var kpiStrip='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px;margin-bottom:22px">'
    +[{lbl:'Staff',val:staff.length,sub:'Active: '+staff.filter(function(s){return s.status==='Active';}).length,col:'#1433a8',icon:'\uD83D\uDC65'},{lbl:'Students',val:students.length,sub:'Boarders: '+boarders.length,col:'#7c3aed',icon:'\uD83C\uDF93'},{lbl:'Present Today',val:attP,sub:'Absent: '+attA+' Late: '+attL,col:'#16a34a',icon:'\u2705'},{lbl:'Pending Fees',val:feePending,sub:'Paid: '+feePaid,col:feePending>0?'#dc2626':'#16a34a',icon:'\uD83D\uDCB0'},{lbl:'Open Issues',val:issues.length,sub:issues.filter(function(x){return x.sev==='high';}).length+' critical',col:issues.filter(function(x){return x.sev==='high';}).length?'#dc2626':'#16a34a',icon:'\uD83D\uDD0D'},{lbl:'Fee Alerts',val:gnsiMonitorAlertCount(),sub:gnsiMonitorAlertCount()>0?'Suspicious activity':'All clear',col:gnsiMonitorAlertCount()>0?'#dc2626':'#16a34a',icon:'\uD83D\uDD75\uFE0F'},{lbl:'Rpts Pending',val:pendingReports.length,sub:'Total: '+allReports.length,col:pendingReports.length>3?'#f59e0b':'#16a34a',icon:'\uD83D\uDCC4'},{lbl:'Net Balance',val:'\u20B9'+Math.round((totalIncome-totalExpend)/1000)+'K',sub:'Inc\u2212Exp',col:(totalIncome-totalExpend)>=0?'#16a34a':'#dc2626',icon:'\uD83D\uDCB9'},{lbl:'Visitors In',val:visitorsIn,sub:'Today: '+todayVisitors.length,col:'#0891b2',icon:'\uD83D\uDC64'}]
    .map(function(k){return'<div style="background:var(--surface);border:1.5px solid var(--border-soft);border-radius:var(--radius);padding:14px 16px;box-shadow:var(--shadow-xs);position:relative;overflow:hidden"><div style="position:absolute;top:-10px;right:-10px;font-size:36px;opacity:0.07">'+k.icon+'</div><div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;font-family:\'JetBrains Mono\',monospace;margin-bottom:4px">'+k.lbl+'</div><div style="font-size:26px;font-weight:800;color:'+k.col+';font-family:\'Playfair Display\',serif;line-height:1">'+k.val+'</div><div style="font-size:10.5px;color:var(--muted);margin-top:4px">'+k.sub+'</div></div>';}).join('')+'</div>';
  var content='';
  
  if(acTab==='feemonitor'){
    var _feeMonMini=(typeof renderFeeMonitorPanel==='function')?renderFeeMonitorPanel(false):'';
    content='<div class="page-header"><div class="page-header-eyebrow">ADMIN CENTRE</div><div class="page-header-title">🕵️ Fee Monitoring System</div><div class="page-header-sub">Smart detection of suspicious fee activity · Admin income delete log · Real-time collection audit</div></div>'+_feeMonMini;
  } else if(acTab==='overview'){
    var actFeed=[];
    if(attToday.length)actFeed.push({icon:'\u2705',color:'#16a34a',title:'Attendance Marked Today',detail:attP+' Present \u00B7 '+attA+' Absent \u00B7 '+attL+' Late \u00B7 '+attED+' Early Dep',time:'Today',section:'Attendance'});
    notices.slice(0,3).forEach(function(n){actFeed.push({icon:'\uD83D\uDCE2',color:'#1433a8',title:'Notice: '+n.title,detail:'Priority: '+n.priority,time:n.date,section:'Notices'});});
    admApps.slice(0,3).forEach(function(a){actFeed.push({icon:'\uD83D\uDCDD',color:'#7c3aed',title:'Application: '+a.name,detail:'Status: '+a.status+' | '+(a.course||'\u2014'),time:a.date||'\u2014',section:'Admissions'});});
    if(todayVisitors.length)actFeed.push({icon:'\uD83D\uDC64',color:'#0891b2',title:'Visitors Today',detail:todayVisitors.length+' visitor(s) \u00B7 '+visitorsIn+' inside',time:'Today',section:'Reception'});
    if(dutyCount)actFeed.push({icon:'\u23F1',color:'#d4a853',title:'Duty Schedule Active',detail:dutyCount+' duty entries',time:'Ongoing',section:'Duty Hours'});
    if(openBeh)actFeed.push({icon:'\u26A0\uFE0F',color:'#dc2626',title:'Open Behaviour Cases',detail:openBeh+' unresolved incident(s)',time:'Pending',section:'House Master'});
    if(monitoring)actFeed.push({icon:'\uD83C\uDFE5',color:'#f59e0b',title:'Health Monitoring Active',detail:monitoring+' boarder(s) under watch',time:'Active',section:'House Master'});
    if(feePending)actFeed.push({icon:'\uD83D\uDCB0',color:'#dc2626',title:'Pending Fee Payments',detail:feePending+' student(s) outstanding',time:'Overdue',section:'Fees'});
    if(pendingReports.length)actFeed.push({icon:'\uD83D\uDCC4',color:'#7c3aed',title:'Reports Awaiting Review',detail:pendingReports.length+' report(s) pending',time:'Pending',section:'Reports'});
    var feedHTML=actFeed.length?actFeed.map(function(a){return'<div style="display:flex;align-items:flex-start;gap:14px;padding:14px 20px;border-bottom:1px solid var(--border-soft);transition:background .15s" onmouseenter="this.style.background=\'var(--surface2)\'" onmouseleave="this.style.background=\'\'">'+'<div style="width:40px;height:40px;border-radius:12px;background:'+a.color+'18;border:1.5px solid '+a.color+'33;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">'+a.icon+'</div>'+'<div style="flex:1;min-width:0"><div style="font-weight:700;font-size:13px;color:var(--text)">'+esc(a.title)+'</div><div style="font-size:12px;color:var(--muted);margin-top:2px">'+esc(a.detail)+'</div><div style="display:flex;gap:8px;margin-top:5px"><span style="font-size:10px;font-weight:700;padding:2px 9px;border-radius:10px;background:'+a.color+'18;color:'+a.color+'">'+esc(a.section)+'</span><span style="font-size:10px;color:var(--muted2);font-family:\'JetBrains Mono\',monospace">'+esc(a.time)+'</span></div></div></div>';}).join(''):'<div style="padding:40px;text-align:center;color:var(--muted)">No activity today yet.</div>';
    var issuesHTML=issues.length?issues.map(function(iss){return'<div style="background:'+sevBg[iss.sev]+';border:1.5px solid '+sevBdr[iss.sev]+';border-radius:12px;padding:14px 18px;margin-bottom:10px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><span style="font-size:18px">'+iss.icon+'</span><span style="font-weight:700;font-size:13px;color:var(--text)">'+esc(iss.title)+'</span><span style="margin-left:auto;font-size:9px;font-weight:800;padding:2px 8px;border-radius:20px;background:'+sevColor[iss.sev]+';color:#fff">'+iss.sev.toUpperCase()+'</span></div><div style="font-size:12px;color:var(--muted);margin-bottom:6px">'+esc(iss.detail)+'</div><div style="font-size:11px;font-weight:600;color:'+sevColor[iss.sev]+'">\uD83D\uDCA1 '+esc(iss.fix)+'</div></div>';}).join(''):'<div style="padding:28px;text-align:center;background:#f0fdf4;border-radius:14px;border:1.5px solid #86efac"><div style="font-size:32px;margin-bottom:8px">\u2705</div><div style="font-size:14px;font-weight:700;color:#16a34a">All Systems Healthy!</div></div>';
    content='<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px"><div class="card"><div class="card-head" style="background:linear-gradient(135deg,#eff6ff,#f0fdf4)"><div><span class="card-title">\uD83D\uDCE1 Live Activity Feed</span><div style="font-size:11px;color:var(--muted);margin-top:2px">All section activity at a glance</div></div><span style="font-size:11px;color:var(--muted);font-family:\'JetBrains Mono\',monospace">'+actFeed.length+' events</span></div><div style="max-height:500px;overflow-y:auto">'+feedHTML+'</div></div>'+'<div class="card"><div class="card-head" style="background:linear-gradient(135deg,#fef2f2,#fffbeb)"><div><span class="card-title">\uD83D\uDD0D System Health</span><div style="font-size:11px;color:var(--muted);margin-top:2px">Auto-detected configuration gaps</div></div><span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;background:'+(issues.filter(function(x){return x.sev==='high';}).length?'#fef2f2':'#f0fdf4')+';color:'+(issues.filter(function(x){return x.sev==='high';}).length?'#dc2626':'#16a34a')+';border:1px solid '+(issues.filter(function(x){return x.sev==='high';}).length?'#fca5a5':'#86efac')+'">'+issues.length+' issues</span></div><div style="padding:14px;max-height:500px;overflow-y:auto">'+issuesHTML+'</div></div></div>'+(typeof renderFeeMonitorPanel==='function'?renderFeeMonitorPanel(true):'');
  }
  
  else if(acTab==='monitor'){
    var pendingActions=[];
    if(pendingReports.length)pendingActions.push({priority:'high',icon:'\uD83D\uDCC4',action:'Review '+pendingReports.length+' Pending Reports',sub:pendingReports.slice(0,2).map(function(r){return r.staffName+' \u2014 '+r.type;}).join(' \u00B7 '),page:'reports'});
    if(openBeh)pendingActions.push({priority:'high',icon:'\u26A0\uFE0F',action:openBeh+' Open Behaviour Incident'+(openBeh>1?'s':''),sub:'Students involved need admin follow-up',page:'housemaster'});
    if(monitoring)pendingActions.push({priority:'high',icon:'\uD83C\uDFE5',action:monitoring+' Student'+(monitoring>1?'s':'')+' Under Medical Watch',sub:'Check health status and update records',page:'housemaster'});
    if(feePending>10)pendingActions.push({priority:'med',icon:'\uD83D\uDCB0',action:feePending+' Students With Pending Fees',sub:'Follow up with parents for collection',page:'fees'});
    if(admApps.filter(function(a){return a.status==='Pending';}).length)pendingActions.push({priority:'med',icon:'\uD83D\uDCDD',action:admApps.filter(function(a){return a.status==='Pending';}).length+' Pending Admission Application(s)',sub:'Review and process applications',page:'admissions'});
    if(noHouse>0)pendingActions.push({priority:'med',icon:'\uD83C\uDFE0',action:noHouse+' Boarder(s) Without House Assignment',sub:'Assign houses in House Master section',page:'housemaster'});
    if(noUsername.length)pendingActions.push({priority:'med',icon:'\uD83D\uDD11',action:noUsername.length+' Staff Without Login Credentials',sub:noUsername.slice(0,3).map(function(s){return s.name;}).join(', '),page:'settings'});
    if(!activeSess.length)pendingActions.push({priority:'high',icon:'\uD83D\uDCC5',action:'No Active Academic Session Set',sub:'Set the current session as active',page:'sessions'});
    var absentStaff=staff.filter(function(s){return attendance[today+'-S-'+s.id]==='A';});
    var lateStaff=staff.filter(function(s){return attendance[today+'-S-'+s.id]==='L';});
    var trend7=[];
    for(var di7=6;di7>=0;di7--){var dd7=new Date();dd7.setDate(dd7.getDate()-di7);var ds7=dd7.toISOString().split('T')[0];if(dd7.getDay()===0){trend7.push({date:ds7,pct:null,isSun:true});continue;}var k7=attKeys.filter(function(k){return k.indexOf(ds7+'-S')===0;});var p7=k7.filter(function(k){var v=attendance[k];return v==='P'||v==='L'||v==='ED';}).length;trend7.push({date:ds7,pct:k7.length>0?Math.round(p7/staff.length*100):null});}
    var trendBars=trend7.map(function(d){var lbl=new Date(d.date+'T00:00:00').toLocaleDateString('en-IN',{weekday:'short'});var isT=d.date===today;if(d.isSun)return'<div style="display:flex;flex-direction:column;align-items:center;gap:4px;opacity:0.4"><div style="height:80px;width:32px;background:var(--surface3);border-radius:6px"></div><div style="font-size:10px;color:var(--muted)">Sun</div></div>';var col=d.pct===null?'var(--surface3)':d.pct>=80?'#16a34a':d.pct>=60?'#f59e0b':'#dc2626';var h=d.pct===null?4:Math.max(6,Math.round(d.pct*0.8));return'<div style="display:flex;flex-direction:column;align-items:center;gap:4px"><div style="font-size:11px;font-weight:700;color:'+(d.pct===null?'var(--muted)':col)+'">'+(d.pct===null?'\u2014':d.pct+'%')+'</div><div style="width:32px;height:80px;background:var(--surface3);border-radius:6px;display:flex;align-items:flex-end;overflow:hidden"><div style="width:100%;height:'+h+'px;background:'+col+';border-radius:6px"></div></div><div style="font-size:10px;color:'+(isT?'var(--accent)':'var(--muted)')+';font-weight:'+(isT?'800':'500')+'">'+lbl+(isT?' \u2605':'')+'</div></div>';}).join('');
    var paHTML=pendingActions.length?pendingActions.map(function(pa){var pc={high:'#dc2626',med:'#f59e0b',low:'#3b82f6'}[pa.priority];var pb={high:'#fef2f2',med:'#fffbeb',low:'#eff6ff'}[pa.priority];return'<div style="display:flex;align-items:center;gap:14px;padding:14px 18px;border-bottom:1px solid var(--border-soft);background:'+pb+'"><div style="font-size:22px;flex-shrink:0">'+pa.icon+'</div><div style="flex:1;min-width:0"><div style="font-weight:700;font-size:13px;color:var(--text)">'+esc(pa.action)+'</div><div style="font-size:11.5px;color:var(--muted);margin-top:2px">'+esc(pa.sub)+'</div></div><span style="font-size:9px;font-weight:800;padding:2px 8px;border-radius:12px;background:'+pc+';color:#fff;flex-shrink:0">'+pa.priority.toUpperCase()+'</span><button onclick="navigate(\''+pa.page+'\')" style="padding:5px 12px;border-radius:8px;border:1.5px solid '+pc+';background:'+pb+';color:'+pc+';font-size:11px;font-weight:700;cursor:pointer;flex-shrink:0">Go \u2192</button></div>';}).join(''):'<div style="padding:36px;text-align:center;color:#16a34a;font-weight:700">\uD83C\uDF89 No pending actions! All clear.</div>';
    content='<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px"><div class="card"><div class="card-head" style="background:linear-gradient(135deg,#fef2f2,#fffbeb)"><span class="card-title">\u26A1 Pending Actions</span><span style="font-size:11px;color:var(--muted)">'+pendingActions.length+' item(s)</span></div><div style="max-height:340px;overflow-y:auto">'+paHTML+'</div></div><div class="card"><div class="card-head"><span class="card-title">\uD83D\uDCC8 7-Day Attendance Trend</span></div><div style="padding:20px;display:flex;gap:8px;justify-content:center;align-items:flex-end">'+trendBars+'</div></div></div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px"><div class="card"><div class="card-head" style="background:#fef2f2"><span class="card-title">\uD83D\uDD34 Absent Today ('+absentStaff.length+')</span><button onclick="navigate(\'attendance\')" style="padding:4px 10px;border-radius:7px;border:1px solid #fca5a5;background:#fee2e2;color:#dc2626;font-size:11px;font-weight:700;cursor:pointer">Mark Attendance</button></div>'+(absentStaff.length?'<div style="display:flex;flex-wrap:wrap;gap:8px;padding:14px 18px">'+absentStaff.map(function(s){return'<span style="background:#fee2e2;color:#dc2626;border-radius:20px;padding:4px 12px;font-size:12px;font-weight:700">'+esc(s.name)+'</span>';}).join('')+'</div>':'<div style="padding:20px;text-align:center;color:var(--muted)">No absences today \u2705</div>')+'</div>'
      +'<div class="card"><div class="card-head" style="background:#fef9c3"><span class="card-title">\uD83D\uDD50 Late Today ('+lateStaff.length+')</span></div>'+(lateStaff.length?'<div style="display:flex;flex-wrap:wrap;gap:8px;padding:14px 18px">'+lateStaff.map(function(s){return'<span style="background:#fef9c3;color:#ca8a04;border-radius:20px;padding:4px 12px;font-size:12px;font-weight:700">'+esc(s.name)+'</span>';}).join('')+'</div>':'<div style="padding:14px 18px;color:var(--muted);font-size:13px">None late today \u2705</div>')+'</div></div>';
  }
  
  else if(acTab==='analytics'){
    var feeTotal=students.length;
    var feePaidPct=feeTotal>0?Math.round(feePaid/feeTotal*100):0;
    var feePendPct=feeTotal>0?Math.round(feePending/feeTotal*100):0;
    var clsMap={};students.forEach(function(s){var c=s.cls||'Unassigned';if(!clsMap[c])clsMap[c]={paid:0,pending:0};if(s.fees==='Paid')clsMap[c].paid++;else clsMap[c].pending++;});
    var clsList=Object.keys(clsMap).sort();
    var facCompliance=faculty.map(function(f){var worked=0,entered=0;for(var di2=0;di2<30;di2++){var dd2=new Date();dd2.setDate(dd2.getDate()-di2);if(dd2.getDay()===0)continue;var ds2=dd2.toISOString().split('T')[0];worked++;if(allPlans[f.id]&&allPlans[f.id][ds2]&&allPlans[f.id][ds2].length)entered++;}return{name:f.name.split(' ').slice(0,2).join(' '),pct:worked>0?Math.round(entered/worked*100):0};}).sort(function(a,b){return b.pct-a.pct;});
    var balColor=(totalIncome-totalExpend)>=0?'#16a34a':'#dc2626';
    var circ=2*Math.PI*38;var paidArc=Math.round(feePaidPct/100*circ*10)/10;var pendArc=Math.round(feePendPct/100*circ*10)/10;
    var feeDonut='<div style="display:flex;align-items:center;gap:20px;padding:18px 20px"><svg width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="38" fill="none" stroke="#e5e7eb" stroke-width="18"/><circle cx="50" cy="50" r="38" fill="none" stroke="#16a34a" stroke-width="18" stroke-dasharray="'+paidArc+' '+Math.round(circ*10)/10+'" stroke-dashoffset="'+(Math.round(circ*10)/10/4)+'" stroke-linecap="round"/><circle cx="50" cy="50" r="38" fill="none" stroke="#dc2626" stroke-width="18" stroke-dasharray="'+pendArc+' '+Math.round(circ*10)/10+'" stroke-dashoffset="'+(Math.round(circ*10)/10/4-paidArc)+'" stroke-linecap="round"/><text x="50" y="46" text-anchor="middle" font-size="14" font-weight="800" fill="var(--text)">'+feePaidPct+'%</text><text x="50" y="59" text-anchor="middle" font-size="8" fill="#8896bb">Paid</text></svg><div><div style="display:flex;align-items:center;gap:6px;margin-bottom:8px"><span style="width:10px;height:10px;border-radius:50%;background:#16a34a;display:inline-block"></span><span style="font-size:12px;font-weight:700;color:#16a34a">Paid: '+feePaid+' ('+feePaidPct+'%)</span></div><div style="display:flex;align-items:center;gap:6px"><span style="width:10px;height:10px;border-radius:50%;background:#dc2626;display:inline-block"></span><span style="font-size:12px;font-weight:700;color:#dc2626">Pending: '+feePending+' ('+feePendPct+'%)</span></div></div></div>';
    var clsRows=clsList.map(function(c){var tot=(clsMap[c].paid||0)+(clsMap[c].pending||0);var pct=tot>0?Math.round(clsMap[c].paid/tot*100):0;var col=pct>=80?'#16a34a':pct>=50?'#d97706':'#dc2626';return'<tr><td style="font-weight:700">'+esc(c)+'</td><td style="text-align:center;color:#16a34a;font-weight:700">'+clsMap[c].paid+'</td><td style="text-align:center;color:#dc2626;font-weight:700">'+clsMap[c].pending+'</td><td><div style="height:7px;background:var(--surface3);border-radius:4px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:'+col+';border-radius:4px"></div></div><div style="font-size:10px;color:'+col+';font-weight:700;margin-top:2px">'+pct+'%</div></td></tr>';}).join('');
    var planRows=facCompliance.map(function(f){var col=f.pct>=80?'#16a34a':f.pct>=50?'#d97706':'#dc2626';return'<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px"><span style="font-size:12px;font-weight:600;color:var(--text);min-width:120px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(f.name)+'</span><div style="flex:1;height:10px;background:var(--surface3);border-radius:5px;overflow:hidden"><div style="height:100%;width:'+f.pct+'%;background:'+col+';border-radius:5px"></div></div><span style="font-size:12px;font-weight:800;color:'+col+';min-width:36px;text-align:right">'+f.pct+'%</span></div>';}).join('');
    content='<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">'
      +'<div class="card"><div class="card-head"><span class="card-title">\uD83D\uDCB0 Fee Collection Status</span></div>'+feeDonut+'<div style="overflow-x:auto"><table><thead><tr><th>Class</th><th style="text-align:center">Paid</th><th style="text-align:center">Pending</th><th>Rate</th></tr></thead><tbody>'+clsRows+'</tbody></table></div></div>'
      +'<div class="card"><div class="card-head"><span class="card-title">\uD83D\uDCB9 Financial Summary</span></div><div style="padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:14px;text-align:center"><div style="background:#f0fdf4;border-radius:12px;padding:16px"><div style="font-size:11px;font-weight:700;color:#16a34a;text-transform:uppercase;margin-bottom:4px">Total Income</div><div style="font-size:24px;font-weight:800;color:#16a34a">\u20B9'+Math.round(totalIncome/1000)+'K</div></div><div style="background:#fef2f2;border-radius:12px;padding:16px"><div style="font-size:11px;font-weight:700;color:#dc2626;text-transform:uppercase;margin-bottom:4px">Total Expense</div><div style="font-size:24px;font-weight:800;color:#dc2626">\u20B9'+Math.round(totalExpend/1000)+'K</div></div><div style="background:var(--surface2);border-radius:12px;padding:16px;grid-column:1/-1"><div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;margin-bottom:4px">Net Balance</div><div style="font-size:28px;font-weight:800;color:'+balColor+'">\u20B9'+Math.round((totalIncome-totalExpend)/1000)+'K</div><div style="font-size:11px;color:var(--muted);margin-top:4px">'+((totalIncome-totalExpend)>=0?'Surplus \u2705':'Deficit \u26A0\uFE0F')+'</div></div></div></div>'
      +'</div>'
      +'<div class="card"><div class="card-head"><span class="card-title">\uD83D\uDCDD Faculty Lesson Plan Compliance (30 Days)</span><span style="font-size:11px;color:var(--muted)">% of working days with plan submitted</span></div><div style="padding:18px 20px">'+planRows+'</div></div>';
  }
  
  else if(acTab==='students'){
    var atRisk=students.filter(function(s){var risk=0;if(s.fees==='Pending')risk++;if(!s.cls)risk++;if(s.hostel==='Yes'&&!houseMap[String(s.id)])risk++;return risk>=2;});
    var cwMap={};students.forEach(function(s){var c=s.cls||'Unassigned';if(!cwMap[c])cwMap[c]=0;cwMap[c]++;});
    var cwList=Object.keys(cwMap).sort();
    var boarderFee=boarders.filter(function(s){return s.fees==='Pending';}).length;
    var boarderHouse=boarders.filter(function(s){return houseMap[String(s.id)];}).length;
    var admPending=admApps.filter(function(a){return a.status==='Pending';}).length;
    var admApproved=admApps.filter(function(a){return a.status==='Approved';}).length;
    var admRejected=admApps.filter(function(a){return a.status==='Rejected';}).length;
    var cwBars=cwList.map(function(c){var cnt=cwMap[c];var maxCnt=Math.max.apply(null,Object.values(cwMap))||1;return'<div style="display:flex;align-items:center;gap:10px;margin-bottom:7px"><span style="font-size:11.5px;font-weight:600;min-width:130px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(c)+'</span><div style="flex:1;height:10px;background:var(--surface3);border-radius:5px;overflow:hidden"><div style="height:100%;width:'+Math.round(cnt/maxCnt*100)+'%;background:linear-gradient(90deg,var(--accent),#7c3aed);border-radius:5px"></div></div><span style="font-size:12px;font-weight:800;color:var(--accent)">'+cnt+'</span></div>';}).join('');
    var atRiskHTML=atRisk.length?'<div style="overflow-x:auto"><table><thead><tr><th>Student</th><th>Class</th><th>Hostel</th><th>Fees</th><th>Issues</th></tr></thead><tbody>'+atRisk.slice(0,20).map(function(s){var risk=[];if(s.fees==='Pending')risk.push('\uD83D\uDCB0 Fee Pending');if(!s.cls)risk.push('\uD83C\uDF93 No Class');if(s.hostel==='Yes'&&!houseMap[String(s.id)])risk.push('\uD83C\uDFE0 No House');return'<tr><td style="font-weight:700">'+esc(s.name)+(s.roll?'<div style="font-size:10px;color:var(--muted)">#'+esc(s.roll)+'</div>':'')+'</td><td>'+(s.cls?esc(s.cls):'<span style="color:#dc2626;font-weight:700">\u2014</span>')+'</td><td>'+esc(s.hostel||'\u2014')+'</td><td><span style="font-size:11px;padding:2px 8px;border-radius:10px;background:'+(s.fees==='Paid'?'#f0fdf4':'#fef2f2')+';color:'+(s.fees==='Paid'?'#16a34a':'#dc2626')+';font-weight:700">'+esc(s.fees||'\u2014')+'</span></td><td><div style="display:flex;flex-wrap:wrap;gap:4px">'+risk.map(function(r){return'<span style="font-size:10px;background:#fef2f2;color:#dc2626;border-radius:8px;padding:2px 7px;font-weight:600">'+r+'</span>';}).join('')+'</div></td></tr>';}).join('')+'</tbody></table></div>'+(atRisk.length>20?'<div style="padding:10px 18px;font-size:12px;color:var(--muted)">Showing 20 of '+atRisk.length+'</div>':''):'<div style="padding:30px;text-align:center;background:#f0fdf4;border-radius:12px;border:1.5px solid #86efac;margin:16px"><div style="font-size:28px">\u2705</div><div style="font-weight:700;color:#16a34a;margin-top:6px">No at-risk students</div></div>';
    content='<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px"><div class="card"><div class="card-head"><span class="card-title">\uD83C\uDFEB Class-wise Student Count</span></div><div style="padding:18px 20px">'+cwBars+'</div></div><div style="display:flex;flex-direction:column;gap:16px"><div class="card"><div class="card-head"><span class="card-title">\uD83C\uDFE0 Boarder Summary</span></div><div style="padding:16px 20px;display:grid;grid-template-columns:1fr 1fr;gap:10px;text-align:center"><div style="background:#eff6ff;border-radius:10px;padding:12px"><div style="font-size:22px;font-weight:800;color:var(--accent)">'+boarders.length+'</div><div style="font-size:10px;color:var(--muted)">Total Boarders</div></div><div style="background:#f0fdf4;border-radius:10px;padding:12px"><div style="font-size:22px;font-weight:800;color:#16a34a">'+boarderHouse+'</div><div style="font-size:10px;color:var(--muted)">House Assigned</div></div><div style="background:'+(boarderFee?'#fef2f2':'#f0fdf4')+';border-radius:10px;padding:12px"><div style="font-size:22px;font-weight:800;color:'+(boarderFee?'#dc2626':'#16a34a')+'">'+boarderFee+'</div><div style="font-size:10px;color:var(--muted)">Fee Pending</div></div><div style="background:'+(noHouse?'#fef2f2':'#f0fdf4')+';border-radius:10px;padding:12px"><div style="font-size:22px;font-weight:800;color:'+(noHouse?'#dc2626':'#16a34a')+'">'+noHouse+'</div><div style="font-size:10px;color:var(--muted)">No House</div></div></div></div><div class="card"><div class="card-head"><span class="card-title">\uD83D\uDCDD Admission Funnel</span></div><div style="padding:16px 20px;display:flex;gap:10px;justify-content:space-around;text-align:center"><div><div style="font-size:24px;font-weight:800;color:var(--accent)">'+admApps.length+'</div><div style="font-size:11px;color:var(--muted)">Total</div></div><div><div style="font-size:24px;font-weight:800;color:#f59e0b">'+admPending+'</div><div style="font-size:11px;color:var(--muted)">Pending</div></div><div><div style="font-size:24px;font-weight:800;color:#16a34a">'+admApproved+'</div><div style="font-size:11px;color:var(--muted)">Approved</div></div><div><div style="font-size:24px;font-weight:800;color:#dc2626">'+admRejected+'</div><div style="font-size:11px;color:var(--muted)">Rejected</div></div></div></div></div></div><div class="card"><div class="card-head" style="background:#fef2f2"><span class="card-title">\uD83D\uDEA8 At-Risk Students</span><span style="font-size:11px;color:var(--muted)">2+ flags: pending fees, no class or no house</span><span style="font-size:11px;font-weight:800;color:#dc2626">'+atRisk.length+' students</span></div>'+atRiskHTML+'</div>';
  }
  
  else if(acTab==='staffintel'){
    var deptCount={};staff.forEach(function(s){var d=s.dept||'Other';if(!deptCount[d])deptCount[d]=0;deptCount[d]++;});
    var deptList=Object.keys(deptCount).sort(function(a,b){return deptCount[b]-deptCount[a];});
    var staffAtt=staff.filter(function(s){return s.status==='Active';}).map(function(s){var keys=attKeys.filter(function(k){return k.indexOf('-S-'+s.id)!==-1;});var pres=keys.filter(function(k){var v=attendance[k];return v==='P'||v==='L'||v==='ED';}).length;var pct=keys.length>0?Math.round(pres/keys.length*100):0;return{name:s.name,dept:s.dept||'\u2014',pct:pct,days:keys.length};}).sort(function(a,b){return a.pct-b.pct;});
    var lowAttStaff=staffAtt.filter(function(s){return s.pct<80&&s.days>0;});
    var deptBars=deptList.map(function(d){var cnt=deptCount[d];var maxCnt=deptCount[deptList[0]]||1;return'<div style="display:flex;align-items:center;gap:10px;margin-bottom:7px"><span style="font-size:11.5px;font-weight:600;min-width:100px;color:var(--text)">'+esc(d)+'</span><div style="flex:1;height:10px;background:var(--surface3);border-radius:5px;overflow:hidden"><div style="height:100%;width:'+Math.round(cnt/maxCnt*100)+'%;background:linear-gradient(90deg,#1433a8,#7c3aed);border-radius:5px"></div></div><span style="font-size:12px;font-weight:800;color:var(--accent)">'+cnt+'</span></div>';}).join('');
    var lowAttHTML=lowAttStaff.length?'<div style="overflow-x:auto"><table><thead><tr><th>Staff</th><th>Dept</th><th>Attendance</th><th>Days Recorded</th><th>Status</th></tr></thead><tbody>'+lowAttStaff.slice(0,15).map(function(s){var col=s.pct>=70?'#f59e0b':'#dc2626';return'<tr><td style="font-weight:700">'+esc(s.name)+'</td><td style="font-size:12px;color:var(--muted)">'+esc(s.dept)+'</td><td><div style="display:flex;align-items:center;gap:8px"><div style="flex:1;max-width:80px;height:7px;background:var(--surface3);border-radius:4px;overflow:hidden"><div style="height:100%;width:'+s.pct+'%;background:'+col+';border-radius:4px"></div></div><span style="font-size:12px;font-weight:800;color:'+col+'">'+s.pct+'%</span></div></td><td style="text-align:center;font-size:12px;color:var(--muted)">'+s.days+'</td><td><span style="font-size:10px;padding:2px 8px;border-radius:10px;background:'+(s.pct<70?'#fef2f2':'#fffbeb')+';color:'+col+';font-weight:700">'+(s.pct<70?'At Risk':'Warning')+'</span></td></tr>';}).join('')+'</tbody></table></div>':'<div style="padding:30px;text-align:center;background:#f0fdf4;border-radius:12px;border:1.5px solid #86efac;margin:16px"><div style="font-size:28px">\u2705</div><div style="font-weight:700;color:#16a34a;margin-top:6px">All staff above 80% attendance</div></div>';
    var noCredHTML=noUsername.length?noUsername.map(function(s){return'<div style="display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid var(--border-soft)">'+avatarHTML(s.name,28)+'<div><div style="font-size:13px;font-weight:700">'+esc(s.name)+'</div><div style="font-size:11px;color:var(--muted)">'+esc(s.role||'\u2014')+'</div></div><div style=\"display:flex;align-items:center;gap:6px;margin-left:auto\"><span style=\"font-size:10px;background:#fef2f2;color:#dc2626;border-radius:8px;padding:2px 8px;font-weight:700\">No Login</span><button onclick=\"gnsiQuickProvision(\'+s.id+\')\" style=\"font-size:10px;padding:3px 9px;border-radius:8px;border:1px solid #86efac;background:#f0fdf4;color:#16a34a;font-weight:700;cursor:pointer;white-space:nowrap\">⚡ Setup</button></div></div>';}).join(''):'<div style="padding:20px;text-align:center;color:#16a34a;font-weight:700">\u2705 All staff have login usernames</div>';
    content='<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px"><div class="card"><div class="card-head"><span class="card-title">\uD83D\uDC65 Staff by Department</span></div><div style="padding:18px 20px">'+deptBars+'</div></div><div class="card"><div class="card-head"><span class="card-title">\uD83D\uDD11 Staff Without Login</span><span style="font-size:11px;color:var(--muted)">'+noUsername.length+' missing</span></div><div style="max-height:280px;overflow-y:auto">'+noCredHTML+'</div><div style="padding:12px 16px"><button onclick="navigate(\'settings\')" style="width:100%;padding:8px;border-radius:10px;border:1.5px solid var(--accent);background:var(--accent-light);color:var(--accent);font-size:12px;font-weight:700;cursor:pointer">\u2699\uFE0F Go to Settings</button></div></div></div><div class="card"><div class="card-head" style="background:#fffbeb"><span class="card-title">\u26A0\uFE0F Low Attendance Staff (&lt;80%)</span><span style="font-size:11px;color:var(--muted)">'+lowAttStaff.length+' flagged</span></div>'+lowAttHTML+'</div>';
  }
  
  else if(acTab==='audit'){
    var auditHTML=auditLog.length?'<div style="overflow-x:auto"><table><thead><tr><th>Time</th><th>User</th><th>Action</th><th>Detail</th></tr></thead><tbody>'+auditLog.slice(0,100).map(function(log){var dt=new Date(log.ts);var dtStr=dt.toLocaleDateString('en-IN',{day:'numeric',month:'short'})+' '+dt.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});return'<tr><td style="font-size:11px;color:var(--muted);font-family:\'JetBrains Mono\',monospace;white-space:nowrap">'+dtStr+'</td><td style="font-weight:700;font-size:12px">'+esc(log.user)+'</td><td style="font-size:12px;font-weight:600;color:var(--accent)">'+esc(log.action)+'</td><td style="font-size:11.5px;color:var(--muted)">'+esc(log.detail||'\u2014')+'</td></tr>';}).join('')+'</tbody></table></div>':'<div style="padding:48px;text-align:center;color:var(--muted)"><div style="font-size:40px;margin-bottom:12px">\uD83D\uDCCB</div><div style="font-size:14px;font-weight:700">No audit log entries yet</div><div style="font-size:12px;margin-top:6px">Admin actions will be recorded here automatically</div></div>';
    var secItems=[{lbl:'Staff With No Username',val:noUsername.length,ok:noUsername.length===0,fix:'Settings'},{lbl:'Staff With Default Password',val:noPwd.length,ok:noPwd.length===0,fix:'Settings'},{lbl:'Active Academic Session',val:activeSess.length?activeSess[0].name||'Set':'None',ok:activeSess.length>0,fix:'Sessions'},{lbl:'Audit Log Entries',val:auditLog.length,ok:true,fix:'\u2014'},{lbl:'Admin Account',val:currentUser.name||'Admin',ok:true,fix:'\u2014'}];
    /* Build live activity feed */
    var _feed=(function(){try{return JSON.parse(localStorage.getItem('gnsi_activity_feed')||'[]');}catch(e){return[];}})();
    var _catIcon={'fees':'💰','students':'👤','attendance':'📋','leave':'🏖️','appraisal':'⭐','admin':'🔐','general':'📝'};
    var _roleColor={'admin':'#1433a8','manager':'#7c3aed','teacher':'#16a34a','housemaster':'#d4a853','staff':'#64748b','system':'#94a3b8'};
    var feedHTML=_feed.length
      ?'<div style="max-height:420px;overflow-y:auto">'+_feed.slice(0,100).map(function(e){
          var dt=new Date(e.ts);
          var ago=Math.floor((Date.now()-dt.getTime())/1000);
          var agoStr=ago<60?(ago+'s ago'):ago<3600?(Math.floor(ago/60)+'m ago'):ago<86400?(Math.floor(ago/3600)+'h ago'):(dt.toLocaleDateString('en-IN',{day:'numeric',month:'short'}));
          var cat=e.category||'general';
          var rc=_roleColor[e.role]||'#64748b';
          return '<div style="display:flex;align-items:flex-start;gap:10px;padding:10px 16px;border-bottom:1px solid var(--border-soft)">'
            +'<div style="font-size:18px;flex-shrink:0;margin-top:1px">'+(_catIcon[cat]||'📝')+'</div>'
            +'<div style="flex:1;min-width:0">'
              +'<div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">'
                +'<span style="font-weight:700;font-size:12.5px;color:'+rc+'">'+esc(e.user)+'</span>'
                +'<span style="font-size:10px;background:'+rc+'18;color:'+rc+';padding:1px 7px;border-radius:10px;font-weight:600">'+esc(e.role||'staff')+'</span>'
                +'<span style="font-size:10px;color:var(--muted);margin-left:auto;white-space:nowrap">'+agoStr+'</span>'
              +'</div>'
              +'<div style="font-size:12px;font-weight:600;color:var(--text)">'+esc(e.action)+'</div>'
              +(e.detail?'<div style="font-size:11.5px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:340px">'+esc(e.detail)+'</div>':'')
            +'</div>'
          +'</div>';
        }).join('')+'</div>'
      :'<div style="padding:40px;text-align:center;color:var(--muted)"><div style="font-size:36px;margin-bottom:10px">👀</div><div style="font-size:13px;font-weight:700">No activity yet</div><div style="font-size:12px;margin-top:5px">Actions by any staff member will appear here in real time</div></div>';

    content='<div style="margin-bottom:16px;background:linear-gradient(135deg,#f0f9ff,#e0f2fe);border:1.5px solid #7dd3fc;border-radius:12px;padding:12px 18px;display:flex;align-items:center;gap:10px">'
      +'<div style="width:10px;height:10px;border-radius:50%;background:#16a34a;animation:pulse-dot 1.4s ease-in-out infinite;flex-shrink:0"></div>'
      +'<div style="font-size:13px;font-weight:700;color:#0369a1">Live Activity Feed — '+_feed.length+' events recorded</div>'
      +'<button onclick="gnsiClearActivityFeed()" style="margin-left:auto;font-size:11px;padding:3px 10px;border-radius:7px;border:1px solid #7dd3fc;background:#fff;color:#0369a1;cursor:pointer;font-weight:600">Clear</button>\'onclick="gnsiClearActivityFeed()" style="margin-left:auto;font-size:11px;padding:3px 10px;border-radius:7px;border:1px solid #7dd3fc;background:#fff;color:#0369a1;cursor:pointer;font-weight:600">Clear</button>'
    +'</div>'
    +'<div style="display:grid;grid-template-columns:2fr 1fr;gap:20px">'
    +'<div class="card"><div class="card-head" style="background:linear-gradient(135deg,#f0f9ff,#e0f2fe);border-bottom:1px solid #7dd3fc"><span class="card-title" style="color:#0369a1">👁️ Live Staff Activity</span><span style="font-size:11px;color:var(--muted)">'+_feed.length+' events · auto-updates on data change</span></div>'+feedHTML+'</div>'
    +'<div style="display:flex;flex-direction:column;gap:16px">'
    +'<div class="card"><div class="card-head"><span class="card-title">📋 Admin Audit Log</span><div style="display:flex;gap:8px">'+(auditLog.length?'<button onclick="gnsiAuditClearPrompt()" style="padding:4px 10px;border-radius:7px;border:1px solid #fca5a5;background:#fee2e2;color:#dc2626;font-size:11px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">\uD83D\uDDD1 Archive &amp; Clear</button>':'')+'<span style="font-size:11px;color:var(--muted)">'+auditLog.length+' entries</span></div></div><div style="max-height:520px;overflow-y:auto">'+auditHTML+'</div></div><div class="card"><div class="card-head"><span class="card-title">\uD83D\uDD10 Security Snapshot</span></div><div style="padding:16px;display:flex;flex-direction:column;gap:10px">'+secItems.map(function(si){return'<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:'+(si.ok?'#f0fdf4':'#fef2f2')+';border-radius:10px;border:1px solid '+(si.ok?'#86efac':'#fca5a5')+'"><div><div style="font-size:12px;font-weight:700;color:var(--text)">'+si.lbl+'</div>'+(si.ok?'':'<div style="font-size:10px;color:#dc2626">Fix: '+si.fix+'</div>')+'</div><div style="display:flex;align-items:center;gap:6px"><span style="font-size:13px;font-weight:800;color:'+(si.ok?'#16a34a':'#dc2626')+'">'+si.val+'</span><span>'+(si.ok?'\u2705':'\u274C')+'</span></div></div>';}).join('')+'</div></div></div></div>';
  }
  else if(acTab==='security'){
    var _rlsFixed2 = localStorage.getItem('gnsi_rls_fix_applied') === 'yes';
    var _rlsSQL = 'DROP POLICY IF EXISTS "anon_all" ON gnsi_keyvalue;\nCREATE POLICY "anon_safe_keys" ON gnsi_keyvalue\n  FOR ALL TO anon\n  USING  (key NOT LIKE \'gnsi_pwd_%\'\n          AND key NOT LIKE \'gnsi_uname_%\'\n          AND key NOT LIKE \'gnsi_lkout_%\'\n          AND key NOT LIKE \'gnsi_reset_%\'\n          AND key NOT LIKE \'gnsi_role_sig_%\'\n          AND key != \'gnsi_ai_api_key\')\n  WITH CHECK (key NOT LIKE \'gnsi_pwd_%\'\n          AND key NOT LIKE \'gnsi_uname_%\'\n          AND key NOT LIKE \'gnsi_lkout_%\'\n          AND key NOT LIKE \'gnsi_reset_%\'\n          AND key NOT LIKE \'gnsi_role_sig_%\'\n          AND key != \'gnsi_ai_api_key\');'; /* FIX v79: added gnsi_role_sig_ and gnsi_ai_api_key */
    var _secChecks = [
      {ok:_rlsFixed2, label:'gnsi_keyvalue RLS policy scoped', detail:_rlsFixed2?'Credentials are protected from anon reads':'Open anon_all policy exposes password hashes'},
      {ok:true,       label:'Client-side key guard active',    detail:'gnsiKVPush/Pull blocks sensitive keys (built-in)'},
      {ok:noUsername.length===0, label:'All staff have usernames', detail:noUsername.length?noUsername.length+' staff missing usernames':'All staff have login usernames'},
      {ok:noPwd.length===0,      label:'No default passwords in use', detail:noPwd.length?noPwd.length+' staff on default password':'All staff have custom passwords'},
    ];
    content = '<div class="card" style="max-width:720px">'
      +'<div class="card-head"><span class="card-title">🔒 Security Centre</span>'
      +'<span style="font-size:11px;color:var(--muted)">Supabase RLS &amp; Access Control</span></div>'
      +'<div style="padding:18px 20px;display:flex;flex-direction:column;gap:12px">'
      +_secChecks.map(function(c){
        return '<div style="display:flex;align-items:flex-start;gap:14px;padding:12px 16px;border-radius:10px;border:1.5px solid '+(c.ok?'#86efac':'#fca5a5')+';background:'+(c.ok?'#f0fdf4':'#fef2f2')+'">'
          +'<span style="font-size:20px;margin-top:1px">'+(c.ok?'✅':'🚨')+'</span>'
          +'<div><div style="font-weight:700;font-size:13px;color:var(--text)">'+c.label+'</div>'
          +'<div style="font-size:12px;color:'+(c.ok?'#16a34a':'#dc2626')+';margin-top:2px">'+c.detail+'</div></div>'
          +'</div>';
      }).join('')
      +'</div>'
      +(!_rlsFixed2
        ? '<div style="margin:0 20px 20px;padding:18px;background:#fffbeb;border:1.5px solid #fde68a;border-radius:10px">'
          +'<div style="font-weight:800;font-size:13px;color:#92400e;margin-bottom:10px">⚠️ Action Required -- Apply this SQL in Supabase Dashboard</div>'
          +'<div style="font-size:11px;color:#78350f;margin-bottom:10px">Go to <b>supabase.com → Your Project → SQL Editor</b> and run:</div>'
          +'<pre id="gnsiRlsSql" style="background:#1e1e2e;color:#cdd6f4;border-radius:8px;padding:14px 16px;font-family:\'JetBrains Mono\',monospace;font-size:11.5px;overflow-x:auto;white-space:pre;margin:0 0 12px">'+esc(_rlsSQL)+'</pre>'
          +'<div style="display:flex;gap:10px;flex-wrap:wrap">'
          +'<button onclick="navigator.clipboard.writeText(document.getElementById(\'gnsiRlsSql\').textContent).then(function(){showToast(\'SQL copied to clipboard\',\'#16a34a\');})" style="padding:8px 16px;background:#1433a8;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700;font-family:\'DM Sans\',sans-serif">📋 Copy SQL</button>'
          +'<a href="https://supabase.com/dashboard" target="_blank" style="padding:8px 16px;background:#3ecf8e;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700;font-family:\'DM Sans\',sans-serif;text-decoration:none">🔗 Open Supabase Dashboard</a>'
          +'<button onclick="localStorage.setItem(\'gnsi_rls_fix_applied\',\'yes\');showToast(\'RLS fix marked as applied\',\'#16a34a\');render();" style="padding:8px 16px;background:#16a34a;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700;font-family:\'DM Sans\',sans-serif">✅ Mark as Applied</button>'
          +'</div></div>'
        : '<div style="margin:0 20px 20px;padding:14px 18px;background:#f0fdf4;border:1.5px solid #86efac;border-radius:10px;font-size:13px;color:#15803d;font-weight:700">✅ RLS fix has been applied. gnsi_keyvalue credentials are protected.</div>'
      )
      +'</div>'
      +'<div class="card" style="max-width:720px;margin-top:18px">'
      +'<div class="card-head"><span class="card-title">🔐 Admin Login PIN</span><span style="font-size:11px;color:var(--muted)">Emergency bypass -- works even when locked out</span></div>'
      +'<div style="padding:18px 20px;">'
      +'<div style="padding:14px 16px;border-radius:10px;border:1.5px solid '+(gnsiGetResetPin()?'#86efac':'#fde68a')+';background:'+(gnsiGetResetPin()?'#f0fdf4':'#fffbeb')+';display:flex;align-items:center;gap:14px;margin-bottom:16px">'
      +'<span style="font-size:22px">'+(gnsiGetResetPin()?'✅':'⚠️')+'</span>'
      +'<div><div style="font-weight:700;font-size:13px;color:var(--text)">'+(gnsiGetResetPin()?'Admin PIN is set':'No Admin PIN set yet')+'</div>'
      +'<div style="font-size:12px;color:'+(gnsiGetResetPin()?'#16a34a':'#92400e')+';margin-top:2px">'+(gnsiGetResetPin()?'PIN can be used on the login screen to bypass lockout and sign in instantly.':'Set a PIN now so you can always access the portal even if locked out.')+'</div>'
      +'</div></div>'
      +'<div style="font-size:12.5px;color:var(--muted);margin-bottom:14px;line-height:1.6">The Admin PIN appears on the login screen as <b>"🔑 Admin PIN Login"</b>. Enter your 4-digit PIN to sign in instantly as Admin without needing a password. Keep it private.</div>'
      +'<button onclick="gnsiChangeAdminPinUI()" style="padding:10px 22px;background:linear-gradient(135deg,#1433a8,#1b44cc);color:#fff;border:none;border-radius:9px;font-size:13px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">'+(gnsiGetResetPin()?'🔄 Change Admin PIN':'🔐 Set Admin PIN')+'</button>'
      +'</div></div>';
  } else if(acTab==='schoolsettings'){
    var _ss = (function(){
      try{ return JSON.parse(localStorage.getItem('gnsi_school_settings')||'{}'); }catch(e){return {};}
    })();
    var T = window.TENANT || {};
    function ssVal(key, fallback){ return _ss[key] !== undefined ? _ss[key] : (T[key] || fallback || ''); }
    var inp = 'width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;font-family:\'DM Sans\',sans-serif;background:var(--surface2);color:var(--text);box-sizing:border-box;margin-top:4px';
    content = '<div class="card" style="max-width:760px">'
      +'<div class="card-head"><span class="card-title">\uD83C\uDFEB School Settings</span>'
      +'<span style="font-size:11px;color:var(--muted)">Branding \u00B7 Identity \u00B7 Contact</span></div>'
      +'<div style="padding:18px 20px;display:grid;grid-template-columns:1fr 1fr;gap:16px">'
      +'<div style="grid-column:1/-1;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;border-bottom:1px solid var(--border);padding-bottom:6px">Identity</div>'
      +'<div><label style="font-size:12px;font-weight:600;color:var(--muted)">School Name *</label><input id="ss-name" style="'+inp+'" value="'+esc(ssVal('name','Guidance Navodaya &amp; Sainik Institute'))+'"/></div>'
      +'<div><label style="font-size:12px;font-weight:600;color:var(--muted)">Short Name (sidebar) *</label><input id="ss-short" style="'+inp+'" value="'+esc(ssVal('shortName','GNSI'))+'"/></div>'
      +'<div><label style="font-size:12px;font-weight:600;color:var(--muted)">Principal Name</label><input id="ss-principal" style="'+inp+'" value="'+esc(ssVal('principal',''))+'"/></div>'
      +'<div><label style="font-size:12px;font-weight:600;color:var(--muted)">Established Year</label><input id="ss-estd" style="'+inp+'" value="'+esc(ssVal('established','2016'))+'"/></div>'
      +'<div><label style="font-size:12px;font-weight:600;color:var(--muted)">Reg / Affiliation No.</label><input id="ss-regno" style="'+inp+'" value="'+esc(ssVal('regNo','Regd: 25 of 2016-17'))+'"/></div>'
      +'<div><label style="font-size:12px;font-weight:600;color:var(--muted)">Portal Title</label><input id="ss-title" style="'+inp+'" placeholder="e.g. GNSI Management Portal" value="'+esc(ssVal('portalTitle',''))+'"/></div>'
      +'<div style="grid-column:1/-1;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;border-bottom:1px solid var(--border);padding-bottom:6px;margin-top:4px">Address &amp; Contact</div>'
      +'<div style="grid-column:1/-1"><label style="font-size:12px;font-weight:600;color:var(--muted)">Address</label><input id="ss-addr" style="'+inp+'" value="'+esc(ssVal('address','Khangabok Sorok Wangma'))+'"/></div>'
      +'<div><label style="font-size:12px;font-weight:600;color:var(--muted)">City / Town</label><input id="ss-city" style="'+inp+'" value="'+esc(ssVal('city','Thoubal'))+'"/></div>'
      +'<div><label style="font-size:12px;font-weight:600;color:var(--muted)">State</label><input id="ss-state" style="'+inp+'" value="'+esc(ssVal('state','Manipur'))+'"/></div>'
      +'<div><label style="font-size:12px;font-weight:600;color:var(--muted)">PIN Code</label><input id="ss-pin" style="'+inp+'" value="'+esc(ssVal('pincode','795138'))+'"/></div>'
      +'<div><label style="font-size:12px;font-weight:600;color:var(--muted)">Phone</label><input id="ss-phone" style="'+inp+'" value="'+esc(ssVal('phone',''))+'"/></div>'
      +'<div style="grid-column:1/-1;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;border-bottom:1px solid var(--border);padding-bottom:6px;margin-top:4px">Branding</div>'
      +'<div><label style="font-size:12px;font-weight:600;color:var(--muted)">Primary Color</label>'
      +'<div style="display:flex;align-items:center;gap:10px;margin-top:4px">'
      +'<input type="color" id="ss-color" value="'+(ssVal('color','#1433a8'))+'" style="width:44px;height:36px;border:1.5px solid var(--border);border-radius:8px;cursor:pointer;padding:2px"/>'
      +'<input id="ss-color-hex" style="'+inp+';margin-top:0;flex:1" value="'+esc(ssVal('color','#1433a8'))+'" placeholder="#1433a8"/>'
      +'</div></div>'
      +'<div><label style="font-size:12px;font-weight:600;color:var(--muted)">Logo URL</label><input id="ss-logo" style="'+inp+'" value="'+esc(ssVal('logoUrl',''))+'" placeholder="https://\u2026/logo.png"/></div>'
      +'<div style="grid-column:1/-1;display:flex;gap:10px;margin-top:8px">'
      +'<button onclick="gnsiSaveSchoolSettings()" style="padding:10px 24px;background:linear-gradient(135deg,#1433a8,#1b44cc);color:#fff;border:none;border-radius:9px;font-size:13px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">\uD83D\uDCBE Save &amp; Apply</button>'
      +'<button onclick="gnsiPreviewSchoolSettings()" style="padding:10px 20px;background:var(--surface2);color:var(--text);border:1.5px solid var(--border);border-radius:9px;font-size:13px;font-weight:600;cursor:pointer;font-family:\'DM Sans\',sans-serif">\uD83D\uDC41 Preview</button>'
      +'</div>'
      +'</div>'
      +'<div style="padding:0 20px 18px;font-size:11.5px;color:var(--muted);line-height:1.7">'
      +'<b>Note:</b> Changes apply instantly to the portal UI and all printed reports. To persist across devices, run the SQL migration and set up the School Settings API endpoint on Railway.'
      +'</div>'
      +'</div>';
  }
  return '<div style="margin-bottom:22px"><div style="font-family:\'JetBrains Mono\',monospace;font-size:10px;color:var(--muted);letter-spacing:.16em;text-transform:uppercase;margin-bottom:4px">GNSI \u2014 ADMIN ONLY</div><div style="font-size:26px;font-family:\'Playfair Display\',serif;font-weight:700;color:var(--text)">\uD83D\uDEE1 Admin Centre</div><div style="font-size:13px;color:var(--muted);margin-top:4px">Advanced monitoring \u00B7 Analytics \u00B7 Student & Staff intelligence \u00B7 Audit trail</div></div>'+kpiStrip+tabNav+content;
}
var lbTab = 'overall';
var lbSearch = '';
var lbView = 'table';   // 'table' | 'cards'
var lbSortBy = 'score'; // 'score' | 'name' | 'attendance' | 'streak'
var LB_SCORING_DEFS = {
  overall: {
    title:'🏆 Overall',
    desc:'Balanced across all staff duties: attendance, duty shifts, doubt sessions, reports & punctuality',
    criteria:[
      {icon:'✅',label:'Attendance',max:40,col:'#16a34a',desc:'% present of all recorded working days'},
      {icon:'⚡',label:'Duty Shifts',max:20,col:'#8b5cf6',desc:'4 pts per shift logged in Duty Hours'},
      {icon:'📚',label:'Doubt Sessions',max:15,col:'#059669',desc:'3 pts per session assigned in Doubt TT'},
      {icon:'📄',label:'Reports Filed',max:15,col:'#3b82f6',desc:'5 pts per report submitted'},
      {icon:'⭐',label:'Role Bonus',max:10,col:'#d97706',desc:'Based on seniority & responsibility level'},
    ]
  },
  teachers: {
    title:'📚 Teachers',
    desc:'Ranked purely on teaching output: lesson plan compliance, plan quality, attendance & reports filed',
    criteria:[
      {icon:'📝',label:'Lesson Plan Compliance',max:35,col:'#1433a8',desc:'% of working days with plan submitted (last 30 days)'},
      {icon:'⭐',label:'Plan Quality Score',max:35,col:'#d97706',desc:'Average quality score of all submitted lesson plans'},
      {icon:'✅',label:'Attendance',max:20,col:'#16a34a',desc:'% present of all recorded working days'},
      {icon:'📄',label:'Teaching Reports',max:10,col:'#3b82f6',desc:'1 pt per teaching-related report filed (Lesson Plan / Progress / Activity / Exam)'},
    ]
  },
  housemaster: {
    title:'🏠 House Staff',
    desc:'Ranked on boarding responsibilities: night duties, hostel reports, roll calls & attendance',
    criteria:[
      {icon:'⚡',label:'Duty Shifts',max:40,col:'#8b5cf6',desc:'8 pts per duty shift (night / roll call / outing)'},
      {icon:'✅',label:'Attendance',max:30,col:'#16a34a',desc:'% present of all recorded working days'},
      {icon:'📋',label:'Hostel Reports',max:20,col:'#0ea5e9',desc:'4 pts per Hostel Night / House Points report'},
      {icon:'🎯',label:'Punctuality',max:10,col:'#f59e0b',desc:'On-time arrival rate (late days penalised)'},
    ]
  },
  admin: {
    title:'⚙️ Admin Staff',
    desc:'Ranked on administrative output: documentation, punctuality, attendance & role responsibility',
    criteria:[
      {icon:'📄',label:'Reports & Documentation',max:35,col:'#3b82f6',desc:'5 pts per report submitted (Accounts / Fee / Summary)'},
      {icon:'✅',label:'Attendance',max:30,col:'#16a34a',desc:'% present of all recorded working days'},
      {icon:'🎯',label:'Punctuality',max:20,col:'#f59e0b',desc:'On-time rate -- critical for front-office roles'},
      {icon:'⭐',label:'Role Responsibility',max:15,col:'#d97706',desc:'Based on admin seniority level'},
    ]
  },
  support: {
    title:'🛠 Support Staff',
    desc:'Ranked on reliability: attendance and duty coverage -- the backbone of daily institute operations',
    criteria:[
      {icon:'✅',label:'Attendance',max:50,col:'#16a34a',desc:'% present of all recorded working days'},
      {icon:'⚡',label:'Duty Shifts',max:30,col:'#8b5cf6',desc:'6 pts per duty shift logged'},
      {icon:'🎯',label:'Punctuality',max:20,col:'#f59e0b',desc:'On-time rate -- consistency above all'},
    ]
  }
};
function renderLeaderboard(){
  var isAdmin=currentUser&&(currentUser.role==='admin'||currentUser.role==='manager');
  var attKeys=Object.keys(attendance);
  
  var _dutyData=(function(){try{return JSON.parse(localStorage.getItem('ims_dutydata')||'{}');}catch(e){return{};}}());
  var _dstt=(function(){try{return JSON.parse(localStorage.getItem('ims_dstt')||'{}');}catch(e){return{};}}());
  var _allReports=gnsiGetReports();
  var _allPlans=loadLessonPlans();
  
  function lbMetrics(s){
    var attDates=attKeys.filter(function(k){return k.indexOf('-S-'+s.id)!==-1;});
    var present=attDates.filter(function(k){var v=attendance[k];return v==='P'||v==='L'||v==='ED';}).length;
    var lateCount=attDates.filter(function(k){return attendance[k]==='L';}).length;
    var total=attDates.length;
    var attPct=total>0?Math.round(present/total*100):0;
    var punctPct=present>0?Math.round((present-lateCount)/present*100):100;
    var dutyCount=(_dutyData.entries||[]).filter(function(e){return(e.staffNames||[]).some(function(n){return n.toLowerCase()===s.name.toLowerCase();});}).length;
    var dsCount=Object.values(_dstt).filter(function(v){return v&&v.staff&&v.staff.toLowerCase().indexOf(s.name.split(' ')[0].toLowerCase())!==-1;}).length;
    var reports=_allReports.filter(function(r){return r.staffId===s.id;});
    // Lesson plan metrics (last 30 days)
    var lpWorked=0,lpEntered=0,lpScores=[];
    for(var di=0;di<30;di++){var dd=new Date();dd.setDate(dd.getDate()-di);if(dd.getDay()===0)continue;var ds=dd.toISOString().split('T')[0];lpWorked++;var dp=(_allPlans[s.id]&&_allPlans[s.id][ds])||[];if(dp.length){lpEntered++;dp.forEach(function(p){lpScores.push(facPlanScore(p));});}}
    var lpCompPct=lpWorked>0?Math.round(lpEntered/lpWorked*100):0;
    var lpAvgScore=lpScores.length?Math.round(lpScores.reduce(function(a,b){return a+b;},0)/lpScores.length):0;
    var role=detectRole(s);
    var rolePts=role==='admin'?15:role==='manager'?13:role==='accounts'?11:role==='teacher'?8:role==='housemaster'?10:role==='hostel'?9:5;
    return{attPct:attPct,present:present,total:total,punctPct:punctPct,lateCount:lateCount,
      dutyCount:dutyCount,dsCount:dsCount,reports:reports,
      lpCompPct:lpCompPct,lpAvgScore:lpAvgScore,lpEntered:lpEntered,lpWorked:lpWorked,
      role:role,rolePts:rolePts};
  }
  
  function scoreOverall(s,m){
    var breakdown=[];
    var attPts=Math.round(m.attPct*0.4);         breakdown.push({label:'Attendance',pts:attPts,max:40,pct:m.attPct+'%',col:'#16a34a'});
    var dutyPts=Math.min(m.dutyCount*4,20);       breakdown.push({label:'Duty Shifts',pts:dutyPts,max:20,pct:m.dutyCount+' shifts',col:'#8b5cf6'});
    var dsPts=Math.min(m.dsCount*3,15);           breakdown.push({label:'Doubt Sessions',pts:dsPts,max:15,pct:m.dsCount+' sessions',col:'#059669'});
    var rptPts=Math.min(m.reports.length*5,15);   breakdown.push({label:'Reports Filed',pts:rptPts,max:15,pct:m.reports.length+' reports',col:'#3b82f6'});
    var rolePts=Math.min(m.rolePts,10);           breakdown.push({label:'Role Bonus',pts:rolePts,max:10,pct:ROLE_LABELS[m.role]||m.role,col:'#d97706'});
    return{score:Math.min(attPts+dutyPts+dsPts+rptPts+rolePts,100),breakdown:breakdown};
  }
  function scoreTeachers(s,m){
    var breakdown=[];
    var planPts=Math.round(m.lpCompPct*0.35);      breakdown.push({label:'Lesson Plan Compliance',pts:planPts,max:35,pct:m.lpCompPct+'% ('+m.lpEntered+'/'+m.lpWorked+' days)',col:'#1433a8'});
    var qualPts=Math.round(m.lpAvgScore*0.35);     breakdown.push({label:'Plan Quality Score',pts:qualPts,max:35,pct:'Avg '+m.lpAvgScore+'/100',col:'#d97706'});
    var attPts=Math.round(m.attPct*0.2);           breakdown.push({label:'Attendance',pts:attPts,max:20,pct:m.attPct+'%',col:'#16a34a'});
    var teachRpts=m.reports.filter(function(r){return r.type&&(r.type.indexOf('Lesson')!==-1||r.type.indexOf('Progress')!==-1||r.type.indexOf('Activity')!==-1||r.type.indexOf('Exam')!==-1);});
    var rptPts=Math.min(teachRpts.length,10);      breakdown.push({label:'Teaching Reports',pts:rptPts,max:10,pct:teachRpts.length+' filed',col:'#3b82f6'});
    return{score:Math.min(planPts+qualPts+attPts+rptPts,100),breakdown:breakdown};
  }
  function scoreHousemaster(s,m){
    var breakdown=[];
    var dutyPts=Math.min(m.dutyCount*8,40);       breakdown.push({label:'Duty Shifts',pts:dutyPts,max:40,pct:m.dutyCount+' shifts (night/roll call/outing)',col:'#8b5cf6'});
    var attPts=Math.round(m.attPct*0.3);          breakdown.push({label:'Attendance',pts:attPts,max:30,pct:m.attPct+'%',col:'#16a34a'});
    var hostelRpts=m.reports.filter(function(r){return r.type&&(r.type.indexOf('Hostel')!==-1||r.type.indexOf('House')!==-1||r.type.indexOf('Boarder')!==-1||r.type.indexOf('Night')!==-1);});
    var hostelPts=Math.min(hostelRpts.length*4,20); breakdown.push({label:'Hostel Reports',pts:hostelPts,max:20,pct:hostelRpts.length+' reports filed',col:'#0ea5e9'});
    var punctPts=Math.round(m.punctPct*0.1);      breakdown.push({label:'Punctuality',pts:punctPts,max:10,pct:m.punctPct+'% on-time',col:'#f59e0b'});
    return{score:Math.min(dutyPts+attPts+hostelPts+punctPts,100),breakdown:breakdown};
  }
  function scoreAdmin(s,m){
    var breakdown=[];
    var adminRpts=m.reports.filter(function(r){return r.type&&(r.type.indexOf('Account')!==-1||r.type.indexOf('Fee')!==-1||r.type.indexOf('Summary')!==-1||r.type.indexOf('Monthly')!==-1||r.type.indexOf('Incident')!==-1||r.type.indexOf('Health')!==-1);});
    var rptPts=Math.min(m.reports.length*5,35);   breakdown.push({label:'Reports & Documentation',pts:rptPts,max:35,pct:m.reports.length+' total ('+adminRpts.length+' admin type)',col:'#3b82f6'});
    var attPts=Math.round(m.attPct*0.3);          breakdown.push({label:'Attendance',pts:attPts,max:30,pct:m.attPct+'%',col:'#16a34a'});
    var punctPts=Math.round(m.punctPct*0.2);      breakdown.push({label:'Punctuality',pts:punctPts,max:20,pct:m.punctPct+'% on-time ('+m.lateCount+' late days)',col:'#f59e0b'});
    var rolePts=Math.min(m.rolePts,15);           breakdown.push({label:'Role Responsibility',pts:rolePts,max:15,pct:ROLE_LABELS[m.role]||m.role,col:'#d97706'});
    return{score:Math.min(rptPts+attPts+punctPts+rolePts,100),breakdown:breakdown};
  }
  function scoreSupport(s,m){
    var breakdown=[];
    var attPts=Math.round(m.attPct*0.5);          breakdown.push({label:'Attendance',pts:attPts,max:50,pct:m.attPct+'%',col:'#16a34a'});
    var dutyPts=Math.min(m.dutyCount*6,30);       breakdown.push({label:'Duty Shifts',pts:dutyPts,max:30,pct:m.dutyCount+' shifts',col:'#8b5cf6'});
    var punctPts=Math.round(m.punctPct*0.2);      breakdown.push({label:'Punctuality',pts:punctPts,max:20,pct:m.punctPct+'% on-time',col:'#f59e0b'});
    return{score:Math.min(attPts+dutyPts+punctPts,100),breakdown:breakdown};
  }
  
  function getScorerForTab(tab){
    if(tab==='teachers')   return scoreTeachers;
    if(tab==='housemaster')return scoreHousemaster;
    if(tab==='admin')      return scoreAdmin;
    if(tab==='support')    return scoreSupport;
    return scoreOverall;
  }
  
  function lbStreak(s){
    var streak=0;
    for(var i=0;i<90;i++){
      var dd=new Date();dd.setDate(dd.getDate()-i);
      if(dd.getDay()===0)continue;
      var ds=dd.toISOString().split('T')[0];
      var v=attendance[ds+'-S-'+s.id];
      if(v==='P'||v==='L'||v==='ED'){streak++;}
      else{if(i>0&&streak===0)continue;break;}
    }
    return streak;
  }
  
  function computeBadges(m,sc,streak,tab){
    var b=[];
    if(m.attPct>=100)b.push({ic:'⭐',lbl:'Perfect Att.',ttl:'100% Attendance',col:'#f59e0b',bg:'#fef3dc'});
    else if(m.attPct>=95)b.push({ic:'✨',lbl:'Star Att.',ttl:'95%+ Attendance',col:'#d97706',bg:'#fef9c3'});
    if(streak>=14)b.push({ic:'🔥',lbl:streak+'d Streak',ttl:streak+'-Day Streak!',col:'#dc2626',bg:'#fee2e2'});
    else if(streak>=7)b.push({ic:'🔥',lbl:streak+'d',ttl:streak+'-Day Streak',col:'#f97316',bg:'#fff7ed'});
    if(tab==='teachers'||tab==='overall'){
      if(m.lpCompPct>=95)b.push({ic:'📝',lbl:'Plan Star',ttl:'95%+ Plan Compliance',col:'#1433a8',bg:'#e0e8f9'});
      if(m.lpAvgScore>=85)b.push({ic:'🎓',lbl:'Quality',ttl:'Plan Avg Score 85+',col:'#7c3aed',bg:'#f5f3ff'});
    }
    if(tab==='housemaster'||tab==='overall'){
      if(m.dutyCount>=5)b.push({ic:'⚡',lbl:'Duty Hero',ttl:'5+ Duty Shifts',col:'#8b5cf6',bg:'#f5f3ff'});
    }
    if(tab==='admin'||tab==='overall'){
      if(m.reports.length>=5)b.push({ic:'📄',lbl:'Reporter',ttl:'5+ Reports Filed',col:'#3b82f6',bg:'#eff6ff'});
    }
    if(tab==='support'||tab==='overall'){
      if(m.dutyCount>=5)b.push({ic:'⚡',lbl:'Duty Hero',ttl:'5+ Duty Shifts',col:'#8b5cf6',bg:'#f5f3ff'});
    }
    if(m.punctPct>=98&&m.present>5)b.push({ic:'🎯',lbl:'Punctual',ttl:'98%+ On-Time',col:'#0ea5e9',bg:'#f0f9ff'});
    if(sc>=90)b.push({ic:'🏆',lbl:'Elite',ttl:'Score 90+',col:'#c9870a',bg:'#fef9c3'});
    else if(sc>=80)b.push({ic:'🎖',lbl:'Excellent',ttl:'Score 80+',col:'#16a34a',bg:'#f0fdf4'});
    return b;
  }
  function lbGetStarData(){try{return JSON.parse(localStorage.getItem('gnsi_lb_stars')||'{}');}catch(e){return{};}}
  
  var TAB_FILTERS={
    overall:    function(s){return true;},
    teachers:   function(s){return s.role==='teacher';},
    housemaster:function(s){return s.role==='housemaster'||s.role==='hostel';},
    admin:      function(s){return s.role==='admin'||s.role==='manager'||s.role==='accounts';},
    support:    function(s){return s.role==='it'||s.role==='staff';}
  };
  
  var LEADERBOARD_EXCLUDED_IDS=[1,2];
  var activeScorer=getScorerForTab(lbTab);
  var activeFilter=TAB_FILTERS[lbTab]||TAB_FILTERS.overall;
  // Overall ranked for SOTM always uses overall scoring
  var allRanked=staff.filter(function(s){return s.status==='Active'&&LEADERBOARD_EXCLUDED_IDS.indexOf(s.id)===-1;}).map(function(s){
    var m=lbMetrics(s);
    var sc=scoreOverall(s,m);
    var streak=lbStreak(s);
    var badges=computeBadges(m,sc.score,streak,'overall');
    var stars=lbGetStarData()[s.id]||0;
    return Object.assign({},s,m,{score:sc.score,breakdown:sc.breakdown,streak:streak,badges:badges,stars:stars});
  }).sort(function(a,b){return b.score-a.score;});
  // Category ranked uses the tab-specific scorer on the tab-filtered subset
  var catRanked=staff.filter(function(s){return s.status==='Active'&&LEADERBOARD_EXCLUDED_IDS.indexOf(s.id)===-1&&activeFilter(s);}).map(function(s){
    var m=lbMetrics(s);
    var sc=activeScorer(s,m);
    var streak=lbStreak(s);
    var badges=computeBadges(m,sc.score,streak,lbTab);
    var stars=lbGetStarData()[s.id]||0;
    return Object.assign({},s,m,{score:sc.score,breakdown:sc.breakdown,streak:streak,badges:badges,stars:stars});
  }).sort(function(a,b){
    if(lbSortBy==='name')return a.name.localeCompare(b.name);
    if(lbSortBy==='attendance')return b.attPct-a.attPct;
    if(lbSortBy==='streak')return b.streak-a.streak;
    return b.score-a.score;
  });
  var filtered=catRanked;
  
  if(lbSearch.trim()){
    var q=lbSearch.trim().toLowerCase();
    filtered=filtered.filter(function(s){return s.name.toLowerCase().indexOf(q)!==-1||(s.role||'').toLowerCase().indexOf(q)!==-1||(s.dept||'').toLowerCase().indexOf(q)!==-1;});
  }
  
  if(lbSearch.trim()){
    var q=lbSearch.trim().toLowerCase();
    filtered=filtered.filter(function(s){return s.name.toLowerCase().indexOf(q)!==-1||(s.role||'').toLowerCase().indexOf(q)!==-1||(s.dept||'').toLowerCase().indexOf(q)!==-1;});
  }
  
  var deptMap={};
  allRanked.forEach(function(s){var d=s.dept||'Other';if(!deptMap[d])deptMap[d]={total:0,sum:0};deptMap[d].total++;deptMap[d].sum+=s.score;});
  var deptSummary=Object.keys(deptMap).sort(function(a,b){return(deptMap[b].sum/deptMap[b].total)-(deptMap[a].sum/deptMap[a].total);});
  
  var tabs=[{id:'overall',label:'🏆 Overall'},{id:'teachers',label:'📚 Teachers'},{id:'housemaster',label:'🏠 House Staff'},{id:'admin',label:'⚙️ Admin Staff'},{id:'support',label:'🛠 Support'}];
  var tabBar='<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">'
    +tabs.map(function(t){var act=lbTab===t.id;return'<button onclick="lbTab=\''+t.id+'\';render()" style="padding:8px 18px;border-radius:24px;border:'+(act?'none':'1.5px solid var(--border)')+';background:'+(act?'linear-gradient(135deg,var(--accent),var(--accent-mid))':'var(--surface)')+';color:'+(act?'#fff':'var(--muted)')+';font-size:13px;font-weight:700;cursor:pointer;transition:all .15s;box-shadow:'+(act?'0 4px 14px rgba(20,51,168,.3)':'none')+'">'+t.label+'</button>';}).join('')
  +'</div>';
  
  var scoringDef=LB_SCORING_DEFS[lbTab]||LB_SCORING_DEFS.overall;
  var scoringBanner='<div style="background:var(--surface2);border:1px solid var(--border-soft);border-radius:var(--radius);padding:12px 18px;margin-bottom:16px;display:flex;align-items:flex-start;gap:14px;flex-wrap:wrap">'
    +'<div style="flex:1;min-width:200px">'
      +'<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;font-family:\'JetBrains Mono\',monospace;margin-bottom:3px">Scoring Criteria -- '+scoringDef.title+'</div>'
      +'<div style="font-size:12px;color:var(--muted)">'+scoringDef.desc+'</div>'
    +'</div>'
    +'<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center">'
      +scoringDef.criteria.map(function(c){return'<span title="'+c.desc+'" style="background:'+c.col+'18;border:1px solid '+c.col+'44;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700;color:'+c.col+'">'+c.icon+' '+c.label+' ('+c.max+'pts)</span>';}).join('')
    +'</div>'
  +'</div>';
  
  var controls='<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:20px;background:var(--surface);border:1px solid var(--border-soft);border-radius:var(--radius);padding:12px 16px;box-shadow:var(--shadow-xs)">'
    +'<input type="text" value="'+esc(lbSearch)+'" oninput="lbSearch=this.value;debouncedRender()" placeholder="🔍 Search staff..." style="flex:1;min-width:180px;border:1.5px solid var(--border);border-radius:10px;padding:8px 14px;font-size:13px;font-family:\'DM Sans\',sans-serif;background:var(--surface2);color:var(--text);outline:none"/>'
    +'<select onchange="lbSortBy=this.value;render()" style="padding:8px 12px;border-radius:10px;border:1.5px solid var(--border);background:var(--surface2);color:var(--text);font-size:12px;font-weight:600;font-family:\'DM Sans\',sans-serif;cursor:pointer">'
      +'<option value="score"'+(lbSortBy==='score'?' selected':'')+'>Sort: Score</option>'
      +'<option value="attendance"'+(lbSortBy==='attendance'?' selected':'')+'>Sort: Attendance</option>'
      +'<option value="streak"'+(lbSortBy==='streak'?' selected':'')+'>Sort: Streak</option>'
      +'<option value="name"'+(lbSortBy==='name'?' selected':'')+'>Sort: Name A–Z</option>'
    +'</select>'
    +'<div style="display:flex;border:1.5px solid var(--border);border-radius:10px;overflow:hidden">'
      +'<button onclick="lbView=\'table\';render()" style="padding:8px 14px;border:none;background:'+(lbView==='table'?'var(--accent)':'var(--surface2)')+';color:'+(lbView==='table'?'#fff':'var(--muted)')+';font-size:13px;cursor:pointer" title="Table view">☰</button>'
      +'<button onclick="lbView=\'cards\';render()" style="padding:8px 14px;border:none;background:'+(lbView==='cards'?'var(--accent)':'var(--surface2)')+';color:'+(lbView==='cards'?'#fff':'var(--muted)')+';font-size:13px;cursor:pointer" title="Card view">⊞</button>'
    +'</div>'
    +(isAdmin?'<button onclick="lbExportCSV()" style="padding:8px 16px;border-radius:10px;border:1.5px solid var(--border);background:var(--surface2);color:var(--muted);font-size:12px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">📥 Export</button>':'')
  +'</div>';
  
  var sotm=allRanked[0];
  var sotmHTML='';
  if(sotm){
    var sotmCol=sotm.score>=80?'#16a34a':sotm.score>=60?'#d97706':'#dc2626';
    var circ=2*Math.PI*34;var arc=Math.round(sotm.score/100*circ*10)/10;
    sotmHTML='<div style="margin-bottom:20px;background:linear-gradient(135deg,#0c2275,#1433a8,#1f47c8);border-radius:var(--radius-lg);padding:24px;display:flex;align-items:center;gap:20px;flex-wrap:wrap;box-shadow:var(--shadow-lg);position:relative;overflow:hidden">'
      +'<div style="position:absolute;top:-30px;right:-30px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,0.04)"></div>'
      +'<div style="position:absolute;bottom:-40px;left:40px;width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,0.03)"></div>'
      +'<div style="font-size:40px;flex-shrink:0">👑</div>'
      +'<svg width="80" height="80" viewBox="0 0 80 80" style="flex-shrink:0"><circle cx="40" cy="40" r="34" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" stroke-width="8"/><circle cx="40" cy="40" r="34" fill="none" stroke="#ffd060" stroke-width="8" stroke-dasharray="'+arc+' '+circ+'" stroke-dashoffset="'+Math.round(circ/4)+'" stroke-linecap="round" transform="rotate(-90 40 40)"/><text x="40" y="36" text-anchor="middle" font-size="16" font-weight="800" fill="#fff" font-family="serif">'+sotm.score+'</text><text x="40" y="49" text-anchor="middle" font-size="8" fill="rgba(255,255,255,0.7)">/ 100</text></svg>'
      +'<div style="flex:1;min-width:0">'
        +'<div style="font-size:10px;color:rgba(255,255,255,0.6);letter-spacing:.14em;text-transform:uppercase;font-family:\'JetBrains Mono\',monospace;margin-bottom:4px">⭐ STAFF OF THE MONTH</div>'
        +'<div style="font-size:22px;font-weight:800;color:#fff;font-family:\'Playfair Display\',serif;margin-bottom:2px">'+esc(sotm.name)+'</div>'
        +'<div style="font-size:13px;color:rgba(255,255,255,0.75);margin-bottom:10px">'+esc(sotm.role)+' · '+esc(sotm.dept||'')+'</div>'
        +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
          +'<span style="background:rgba(255,255,255,0.15);border-radius:20px;padding:4px 12px;font-size:11px;font-weight:700;color:#fff">✅ '+sotm.attPct+'% Attendance</span>'
          +'<span style="background:rgba(255,255,255,0.15);border-radius:20px;padding:4px 12px;font-size:11px;font-weight:700;color:#fff">🔥 '+sotm.streak+'d Streak</span>'
          +'<span style="background:rgba(255,255,255,0.15);border-radius:20px;padding:4px 12px;font-size:11px;font-weight:700;color:#fff">📄 '+sotm.rptCount+' Reports</span>'
        +'</div>'
      +'</div>'
      +(sotm.badges.length?'<div style="display:flex;flex-wrap:wrap;gap:6px;flex-shrink:0">'+sotm.badges.map(function(b){return'<div title="'+b.ttl+'" style="background:rgba(255,255,255,0.18);border-radius:20px;padding:4px 10px;font-size:11px;font-weight:700;color:#fff">'+b.ic+' '+b.lbl+'</div>';}).join('')+'</div>':'')
    +'</div>';
  }
  
  var podium=filtered.slice(0,3);
  var podiumHTML='';
  if(podium.length>=1){
    var podiumColors=['#f0aa2a','#94a3b8','#cd7c3a'];
    var podiumHeight=['80px','60px','50px'];
    var podiumOrder=podium.length>=3?[podium[1],podium[0],podium[2]]:podium.length===2?[podium[0],podium[1]]:[podium[0]];
    var orderRanks=podium.length>=3?[2,1,3]:podium.length===2?[1,2]:[1];
    podiumHTML='<div style="display:flex;justify-content:center;align-items:flex-end;gap:16px;margin-bottom:28px;padding:20px">'
      +podiumOrder.map(function(p,i){
        var rank=orderRanks[i];var col=podiumColors[rank-1];var ht=podiumHeight[rank-1];var medal=rank===1?'🥇':rank===2?'🥈':'🥉';
        var circ2=2*Math.PI*24;var arc2=Math.round(p.score/100*circ2*10)/10;
        return'<div style="display:flex;flex-direction:column;align-items:center;gap:6px">'
          +'<div style="font-size:28px">'+medal+'</div>'
          +'<svg width="56" height="56" viewBox="0 0 56 56"><circle cx="28" cy="28" r="24" fill="'+col+'22" stroke="'+col+'44" stroke-width="4"/><circle cx="28" cy="28" r="24" fill="none" stroke="'+col+'" stroke-width="4" stroke-dasharray="'+arc2+' '+circ2+'" stroke-dashoffset="'+Math.round(circ2/4)+'" stroke-linecap="round" transform="rotate(-90 28 28)"/><text x="28" y="32" text-anchor="middle" font-size="13" font-weight="800" fill="'+col+'" font-family="serif">'+p.score+'</text></svg>'
          +'<div style="text-align:center"><div style="font-size:12px;font-weight:700;color:var(--text);max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(p.name.split(' ').slice(0,2).join(' '))+'</div>'
          +(p.streak>=3?'<div style="font-size:10px;color:#ef4444;font-weight:700">🔥 '+p.streak+'d</div>':'')
          +'</div>'
          +'<div style="width:70px;height:'+ht+';background:linear-gradient(180deg,'+col+'33,'+col+'11);border-radius:8px 8px 0 0;border:1.5px solid '+col+'44"></div>'
        +'</div>';
      }).join('')+'</div>';
  }
  
  var tableHTML=filtered.map(function(s,i){
    var bar='<div style="width:100%;height:6px;background:var(--surface3);border-radius:4px;overflow:hidden"><div style="height:100%;width:'+s.score+'%;background:linear-gradient(90deg,'+(s.score>=80?'#16a34a':s.score>=60?'#f59e0b':'#dc2626')+',var(--accent));border-radius:4px;transition:width .6s ease"></div></div>';
    var rankMedal=i===0?'🥇':i===1?'🥈':i===2?'🥉':'<span style="font-family:\'JetBrains Mono\',monospace;font-size:12px">#'+(i+1)+'</span>';
    var scoreBg=s.score>=80?'#f0fdf4':s.score>=60?'#fffbeb':'#fef2f2';
    var scoreCol=s.score>=80?'#16a34a':s.score>=60?'#f59e0b':'#dc2626';
    var badgePills=s.badges.slice(0,3).map(function(b){return'<span title="'+b.ttl+'" style="background:'+b.bg+';color:'+b.col+';border-radius:12px;padding:2px 7px;font-size:10px;font-weight:700;white-space:nowrap">'+b.ic+' '+b.lbl+'</span>';}).join('');
    var starsStr='';for(var si=0;si<Math.min(s.stars,5);si++)starsStr+='⭐';
    return'<tr style="'+(i<3?'background:'+(i===0?'rgba(240,170,42,0.04)':i===1?'rgba(148,163,184,0.05)':'rgba(205,124,58,0.04)')+';':'')+'">'
      +'<td style="text-align:center;font-size:'+(i<3?'20px':'13px')+';font-weight:700;padding:10px 8px">'+rankMedal+'</td>'
      +'<td style="padding:10px 12px"><div style="display:flex;align-items:center;gap:10px">'+avatarHTML(s.name,32)+'<div><div style="font-weight:700;font-size:13px">'+esc(s.name)+(starsStr?'<span style="margin-left:4px;font-size:10px">'+starsStr+'</span>':'')+'</div><div style="font-size:11px;color:var(--muted)">'+esc(s.dept||s.role)+'</div></div></div></td>'
      +'<td style="padding:10px 8px">'+badge(ROLE_LABELS[s.role]||s.role,'#1433a8')+'</td>'
      +'<td style="padding:10px 12px;min-width:120px">'+bar+'<div style="font-size:10px;color:var(--muted);margin-top:3px">'+s.attPct+'% att · '+s.present+'/'+s.total+' days</div></td>'
      +'<td style="padding:10px 8px;white-space:nowrap">'+(s.streak>=3?'<span style="font-size:11px;background:#fff7ed;color:#f97316;border-radius:10px;padding:2px 8px;font-weight:800;margin-right:4px">🔥 '+s.streak+'d</span>':'')+'</td>'
      +'<td style="padding:10px 8px"><div style="display:flex;flex-wrap:wrap;gap:4px">'+badgePills+'</div></td>'
      +'<td style="padding:10px 8px"><div style="font-size:22px;font-weight:800;font-family:\'Playfair Display\',serif;color:'+scoreCol+';background:'+scoreBg+';padding:4px 12px;border-radius:10px;display:inline-block">'+s.score+'</div><div style="font-size:9px;color:var(--muted);text-align:center">/ 100</div></td>'
      +(isAdmin?'<td style="padding:10px 8px"><div style="display:flex;gap:4px">'
        +'<button onclick="lbShowBreakdown('+parseInt(s.id,10)+')" style="font-size:11px;padding:4px 10px;border-radius:8px;border:1px solid var(--border);background:var(--surface2);cursor:pointer;color:var(--accent);font-weight:700">Details</button>'
        +'<button onclick="lbGiveStar('+parseInt(s.id,10)+',\''+esc(s.name)+'\')" title="Give recognition star" style="font-size:13px;padding:4px 8px;border-radius:8px;border:1px solid #fde68a;background:#fef9c3;cursor:pointer">⭐</button>'
      +'</div></td>':'')
    +'</tr>';
  }).join('');
  
  var cardHTML='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;padding:4px">'
    +filtered.map(function(s,i){
      var scoreCol=s.score>=80?'#16a34a':s.score>=60?'#d97706':'#dc2626';
      var circ=2*Math.PI*34;var arc=Math.round(s.score/100*circ*10)/10;
      var rankLabel=i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1);
      var starsStr='';for(var si=0;si<Math.min(s.stars,3);si++)starsStr+='⭐';
      return'<div style="background:var(--surface);border:1.5px solid var(--border-soft);border-radius:var(--radius-lg);padding:20px;box-shadow:var(--shadow-sm);transition:box-shadow .2s;position:relative;overflow:hidden"'
        +' onmouseover="this.style.boxShadow=\'var(--shadow-md)\'" onmouseout="this.style.boxShadow=\'var(--shadow-sm)\'">'
        +'<div style="position:absolute;top:10px;left:12px;font-size:'+(i<3?'18px':'12px')+';font-weight:800">'+rankLabel+'</div>'
        +(starsStr?'<div style="position:absolute;top:10px;right:12px;font-size:11px">'+starsStr+'</div>':'')
        +'<div style="display:flex;flex-direction:column;align-items:center;gap:10px;margin-top:8px">'
          +'<svg width="80" height="80" viewBox="0 0 80 80"><circle cx="40" cy="40" r="34" fill="'+scoreCol+'11" stroke="'+scoreCol+'33" stroke-width="8"/><circle cx="40" cy="40" r="34" fill="none" stroke="'+scoreCol+'" stroke-width="8" stroke-dasharray="'+arc+' '+circ+'" stroke-dashoffset="'+Math.round(circ/4)+'" stroke-linecap="round" transform="rotate(-90 40 40)"/>'
          +'<text x="40" y="35" text-anchor="middle" font-size="18" font-weight="800" fill="'+scoreCol+'" font-family="serif">'+s.score+'</text>'
          +'<text x="40" y="48" text-anchor="middle" font-size="9" fill="#8896bb">/ 100 pts</text></svg>'
          +'<div style="text-align:center">'
            +'<div style="font-size:14px;font-weight:800;color:var(--text)">'+esc(s.name.split(' ').slice(0,3).join(' '))+'</div>'
            +'<div style="font-size:11px;color:var(--muted);margin-top:2px">'+esc(s.role)+'</div>'
          +'</div>'
          +'<div style="width:100%">'
            +'<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-bottom:4px"><span>Attendance</span><span style="font-weight:700;color:var(--text)">'+s.attPct+'%</span></div>'
            +'<div style="height:5px;background:var(--surface3);border-radius:3px;overflow:hidden"><div style="height:100%;width:'+s.attPct+'%;background:'+(s.attPct>=90?'#16a34a':s.attPct>=75?'#d97706':'#dc2626')+';border-radius:3px"></div></div>'
          +'</div>'
          +'<div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap">'
            +(s.streak>=3?'<span style="background:#fff7ed;color:#f97316;border-radius:12px;padding:3px 8px;font-size:10px;font-weight:700">🔥 '+s.streak+'d</span>':'')
            +s.badges.slice(0,3).map(function(b){return'<span title="'+b.ttl+'" style="background:'+b.bg+';color:'+b.col+';border-radius:12px;padding:3px 8px;font-size:10px;font-weight:700">'+b.ic+'</span>';}).join('')
          +'</div>'
          +(isAdmin?'<div style="display:flex;gap:6px;width:100%;margin-top:4px">'
            +'<button onclick="lbShowBreakdown('+parseInt(s.id,10)+')" style="flex:1;font-size:11px;padding:6px;border-radius:8px;border:1.5px solid var(--accent);background:var(--accent-light);color:var(--accent);cursor:pointer;font-weight:700">Details</button>'
            +'<button onclick="lbGiveStar('+parseInt(s.id,10)+',\''+esc(s.name)+'\')" style="padding:6px 10px;border-radius:8px;border:1.5px solid #fde68a;background:#fef9c3;cursor:pointer;font-size:13px" title="Give star">⭐</button>'
          +'</div>':'')
        +'</div>'
      +'</div>';
    }).join('')
  +'</div>';
  
  var deptHTML='<div style="padding:20px"><div style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;margin-bottom:14px;font-family:\'JetBrains Mono\',monospace">Department Performance</div>'
    +'<div style="display:flex;flex-direction:column;gap:10px">'
    +deptSummary.map(function(d){
      var avg=Math.round(deptMap[d].sum/deptMap[d].total);
      var col=avg>=80?'#16a34a':avg>=60?'#f59e0b':'#dc2626';
      return'<div><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px"><span style="font-size:12.5px;font-weight:700;color:var(--text)">'+esc(d)+'</span><div style="display:flex;align-items:center;gap:8px"><span style="font-size:11px;color:var(--muted)">'+deptMap[d].total+' staff</span><span style="font-size:14px;font-weight:800;color:'+col+'">'+avg+'</span></div></div>'
        +'<div style="height:8px;background:var(--surface3);border-radius:4px;overflow:hidden"><div style="height:100%;width:'+avg+'%;background:linear-gradient(90deg,'+col+','+col+'cc);border-radius:4px;transition:width .8s ease"></div></div>'
      +'</div>';
    }).join('')
  +'</div></div>';
  return '<div style="margin-bottom:22px">'
    +'<div style="font-family:\'JetBrains Mono\',monospace;font-size:10px;color:var(--muted);letter-spacing:.16em;text-transform:uppercase;margin-bottom:4px">GNSI -- PERFORMANCE</div>'
    +'<div style="font-size:26px;font-family:\'Playfair Display\',serif;font-weight:700;color:var(--text)">🏆 Staff Leaderboard</div>'
    +'<div style="font-size:13px;color:var(--muted);margin-top:4px">Each category ranked on its own criteria · Badges · Streaks · Recognition</div>'
  +'</div>'
  +sotmHTML
  +tabBar
  +scoringBanner
  +controls
  +(filtered.length===0?'<div class="card" style="padding:48px;text-align:center;color:var(--muted)">No staff match your search.</div>':
  '<div class="card" style="margin-bottom:20px">'
    +'<div class="card-head"><span class="card-title">🏅 '+scoringDef.title+' Rankings</span><span style="font-size:11.5px;color:var(--muted)">'+filtered.length+' staff ranked</span></div>'
    +(filtered.length>=2&&lbView==='table'?podiumHTML:'')
    +(lbView==='table'
      ?'<div style="overflow-x:auto"><table><thead><tr><th>Rank</th><th>Staff Member</th><th>Role</th><th>Attendance</th><th>Streak</th><th>Badges</th><th>Score</th>'+(isAdmin?'<th>Actions</th>':'')+'</tr></thead><tbody>'+tableHTML+'</tbody></table></div>'
      :cardHTML)
  +'</div>')
  +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">'
    +'<div class="card">'+deptHTML+'</div>'
    +'<div class="card"><div class="card-head"><span class="card-title">📐 '+scoringDef.title+' Scoring</span></div>'
      +'<div style="padding:16px;display:flex;flex-direction:column;gap:10px">'
      +scoringDef.criteria.map(function(c){return'<div style="display:flex;align-items:center;gap:10px" title="'+c.desc+'">'
        +'<span style="font-size:16px;width:20px;text-align:center">'+c.icon+'</span>'
        +'<div style="flex:1"><div style="display:flex;justify-content:space-between"><span style="font-size:12px;font-weight:600;color:var(--text)">'+c.label+'</span><span style="font-size:11px;font-weight:800;color:'+c.col+'">'+c.max+' pts</span></div>'
        +'<div style="height:5px;background:var(--surface3);border-radius:3px;margin-top:3px;overflow:hidden"><div style="height:100%;width:'+(c.max/105*100)+'%;background:'+c.col+';border-radius:3px"></div></div>'
        +'<div style="font-size:10px;color:var(--muted2);margin-top:2px">'+c.desc+'</div></div>'
      +'</div>';}).join('')
      +'</div></div>'
  +'</div>'
  // Breakdown modal
  +'<div id="lb-modal-overlay" style="display:none;position:fixed;inset:0;background:rgba(8,15,38,.5);z-index:500;backdrop-filter:blur(4px);align-items:center;justify-content:center" onclick="if(event.target===this){document.getElementById(\'lb-modal-overlay\').style.display=\'none\'}">'
    +'<div id="lb-modal-box" style="background:var(--surface);border-radius:24px;padding:28px;width:460px;max-width:94vw;max-height:90vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,.3);animation:gnsi-pop .25s ease both"></div>'
  +'</div>';
}
function lbExportCSV(){
  showToast('⏳ Preparing Leaderboard CSV…','#2563eb');

  var attKeys=Object.keys(attendance);
  var LEADERBOARD_EXCLUDED_IDS=[1,2];
  var rows=[['Rank','Name','Role','Department','Score','Attendance%','Streak','Badges','Stars']];
  var i=0;
  staff.filter(function(s){return s.status==='Active'&&LEADERBOARD_EXCLUDED_IDS.indexOf(s.id)===-1;}).forEach(function(s){
    i++;
    var attDates=attKeys.filter(function(k){return k.indexOf('-S-'+s.id)!==-1;});
    var present=attDates.filter(function(k){var v=attendance[k];return v==='P'||v==='L'||v==='ED';}).length;
    var total=attDates.length;
    var attPct=total>0?Math.round(present/total*100):0;
    var stars=(function(){try{return JSON.parse(localStorage.getItem('gnsi_lb_stars')||'{}');}catch(e){return{};}})()[s.id]||0;
    rows.push([i,s.name,s.role||'',s.dept||'','--',attPct+'%','--','--',stars]);
  });
  var csv=rows.map(function(r){return r.map(function(c){return'"'+String(c).replace(/"/g,'""')+'"';}).join(',');}).join('\r\n');
  var blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');a.href=url;a.download='GNSI_Leaderboard_'+new Date().toISOString().split('T')[0]+'.csv';
  document.body.appendChild(a);  showToast('✅ Leaderboard CSV ready — '+(rows.length)+' rows','#16a34a');
  a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
}
/* Give a star recognition to a staff member */
function lbGiveStar(staffId,staffName){
  var data;try{data=JSON.parse(localStorage.getItem('gnsi_lb_stars')||'{}');}catch(e){data={};}
  data[staffId]=(data[staffId]||0)+1;
  localStorage.setItem('gnsi_lb_stars',JSON.stringify(data));if(typeof gnsiKVPush==='function')gnsiKVPush('gnsi_lb_stars',data);
  var t=document.createElement('div');
  t.innerHTML='⭐ Star given to <b>'+(typeof esc==='function'?esc(staffName):staffName)+'</b>!';
  t.className='gnsi-inline-toast';
  t.style.cssText='position:fixed;bottom:28px;right:28px;background:linear-gradient(135deg,#1433a8,#1f47c8);color:#fff;padding:12px 22px;border-radius:12px;font-weight:700;font-size:13px;z-index:99999;box-shadow:0 4px 20px rgba(0,0,0,0.25)';
  document.body.appendChild(t);setTimeout(function(){t.remove();},2500);
  render();
}
function lbShowBreakdown(staffId){
  var s=staff.find(function(x){return x.id===staffId;});
  if(!s)return;
  var overlay=document.getElementById('lb-modal-overlay');
  var box=document.getElementById('lb-modal-box');
  if(!overlay||!box)return;
  // Rebuild metrics and score using the currently active tab's scorer
  var attKeys=Object.keys(attendance);
  var _dutyData=(function(){try{return JSON.parse(localStorage.getItem('ims_dutydata')||'{}');}catch(e){return{};}}());
  var _dstt=(function(){try{return JSON.parse(localStorage.getItem('ims_dstt')||'{}');}catch(e){return{};}}());
  var _allReports=gnsiGetReports();
  var _allPlans=loadLessonPlans();
  var attDates=attKeys.filter(function(k){return k.indexOf('-S-'+s.id)!==-1;});
  var present=attDates.filter(function(k){var v=attendance[k];return v==='P'||v==='L'||v==='ED';}).length;
  var lateCount=attDates.filter(function(k){return attendance[k]==='L';}).length;
  var total=attDates.length;
  var attPct=total>0?Math.round(present/total*100):0;
  var punctPct=present>0?Math.round((present-lateCount)/present*100):100;
  var dutyCount=(_dutyData.entries||[]).filter(function(e){return(e.staffNames||[]).some(function(n){return n.toLowerCase()===s.name.toLowerCase();});}).length;
  var dsCount=Object.values(_dstt).filter(function(v){return v&&v.staff&&v.staff.toLowerCase().indexOf(s.name.split(' ')[0].toLowerCase())!==-1;}).length;
  var reports=_allReports.filter(function(r){return r.staffId===s.id;});
  var lpWorked=0,lpEntered=0,lpScores=[];
  for(var di=0;di<30;di++){var dd2=new Date();dd2.setDate(dd2.getDate()-di);if(dd2.getDay()===0)continue;var ds2=dd2.toISOString().split('T')[0];lpWorked++;var dp2=(_allPlans[s.id]&&_allPlans[s.id][ds2])||[];if(dp2.length){lpEntered++;dp2.forEach(function(p){lpScores.push(facPlanScore(p));});}}
  var lpCompPct=lpWorked>0?Math.round(lpEntered/lpWorked*100):0;
  var lpAvgScore=lpScores.length?Math.round(lpScores.reduce(function(a,b){return a+b;},0)/lpScores.length):0;
  var role=detectRole(s);
  var rolePts=role==='admin'?15:role==='manager'?13:role==='accounts'?11:role==='teacher'?8:role==='housemaster'?10:role==='hostel'?9:5;
  var m={attPct:attPct,present:present,total:total,punctPct:punctPct,lateCount:lateCount,
    dutyCount:dutyCount,dsCount:dsCount,reports:reports,
    lpCompPct:lpCompPct,lpAvgScore:lpAvgScore,lpEntered:lpEntered,lpWorked:lpWorked,
    role:role,rolePts:rolePts};
  // Use the currently active tab's scoring
  var scorerFn;
  if(lbTab==='teachers')    scorerFn=function(s,m){var bd=[];var p1=Math.round(m.lpCompPct*.35);bd.push({label:'Lesson Plan Compliance',pts:p1,max:35,pct:m.lpCompPct+'% ('+m.lpEntered+'/'+m.lpWorked+' days)',col:'#1433a8'});var p2=Math.round(m.lpAvgScore*.35);bd.push({label:'Plan Quality Score',pts:p2,max:35,pct:'Avg '+m.lpAvgScore+'/100',col:'#d97706'});var p3=Math.round(m.attPct*.2);bd.push({label:'Attendance',pts:p3,max:20,pct:m.attPct+'%',col:'#16a34a'});var tr=m.reports.filter(function(r){return r.type&&(r.type.indexOf('Lesson')!==-1||r.type.indexOf('Progress')!==-1||r.type.indexOf('Activity')!==-1||r.type.indexOf('Exam')!==-1);});var p4=Math.min(tr.length,10);bd.push({label:'Teaching Reports',pts:p4,max:10,pct:tr.length+' filed',col:'#3b82f6'});return{score:Math.min(p1+p2+p3+p4,100),breakdown:bd};};
  else if(lbTab==='housemaster') scorerFn=function(s,m){var bd=[];var p1=Math.min(m.dutyCount*8,40);bd.push({label:'Duty Shifts',pts:p1,max:40,pct:m.dutyCount+' shifts',col:'#8b5cf6'});var p2=Math.round(m.attPct*.3);bd.push({label:'Attendance',pts:p2,max:30,pct:m.attPct+'%',col:'#16a34a'});var hr=m.reports.filter(function(r){return r.type&&(r.type.indexOf('Hostel')!==-1||r.type.indexOf('House')!==-1||r.type.indexOf('Boarder')!==-1||r.type.indexOf('Night')!==-1);});var p3=Math.min(hr.length*4,20);bd.push({label:'Hostel Reports',pts:p3,max:20,pct:hr.length+' reports',col:'#0ea5e9'});var p4=Math.round(m.punctPct*.1);bd.push({label:'Punctuality',pts:p4,max:10,pct:m.punctPct+'% on-time',col:'#f59e0b'});return{score:Math.min(p1+p2+p3+p4,100),breakdown:bd};};
  else if(lbTab==='admin')   scorerFn=function(s,m){var bd=[];var p1=Math.min(m.reports.length*5,35);bd.push({label:'Reports & Documentation',pts:p1,max:35,pct:m.reports.length+' total',col:'#3b82f6'});var p2=Math.round(m.attPct*.3);bd.push({label:'Attendance',pts:p2,max:30,pct:m.attPct+'%',col:'#16a34a'});var p3=Math.round(m.punctPct*.2);bd.push({label:'Punctuality',pts:p3,max:20,pct:m.punctPct+'% on-time ('+m.lateCount+' late)',col:'#f59e0b'});var p4=Math.min(m.rolePts,15);bd.push({label:'Role Responsibility',pts:p4,max:15,pct:ROLE_LABELS[m.role]||m.role,col:'#d97706'});return{score:Math.min(p1+p2+p3+p4,100),breakdown:bd};};
  else if(lbTab==='support') scorerFn=function(s,m){var bd=[];var p1=Math.round(m.attPct*.5);bd.push({label:'Attendance',pts:p1,max:50,pct:m.attPct+'%',col:'#16a34a'});var p2=Math.min(m.dutyCount*6,30);bd.push({label:'Duty Shifts',pts:p2,max:30,pct:m.dutyCount+' shifts',col:'#8b5cf6'});var p3=Math.round(m.punctPct*.2);bd.push({label:'Punctuality',pts:p3,max:20,pct:m.punctPct+'% on-time',col:'#f59e0b'});return{score:Math.min(p1+p2+p3,100),breakdown:bd};};
  else scorerFn=function(s,m){var bd=[];var p1=Math.round(m.attPct*.4);bd.push({label:'Attendance',pts:p1,max:40,pct:m.attPct+'%',col:'#16a34a'});var p2=Math.min(m.dutyCount*4,20);bd.push({label:'Duty Shifts',pts:p2,max:20,pct:m.dutyCount+' shifts',col:'#8b5cf6'});var p3=Math.min(m.dsCount*3,15);bd.push({label:'Doubt Sessions',pts:p3,max:15,pct:m.dsCount+' sessions',col:'#059669'});var p4=Math.min(m.reports.length*5,15);bd.push({label:'Reports Filed',pts:p4,max:15,pct:m.reports.length+' reports',col:'#3b82f6'});var p5=Math.min(m.rolePts,10);bd.push({label:'Role Bonus',pts:p5,max:10,pct:ROLE_LABELS[m.role]||m.role,col:'#d97706'});return{score:Math.min(p1+p2+p3+p4+p5,100),breakdown:bd};};
  var result=scorerFn(s,m);
  var total_score=result.score;
  var items=result.breakdown;
  var scoreCol=total_score>=80?'#16a34a':total_score>=60?'#f59e0b':'#dc2626';
  var stars=(function(){try{return JSON.parse(localStorage.getItem('gnsi_lb_stars')||'{}');}catch(e){return{};}})()[s.id]||0;
  var scoringDef=LB_SCORING_DEFS[lbTab]||LB_SCORING_DEFS.overall;
  // Streak
  var streak=0;
  for(var i=0;i<90;i++){
    var dd=new Date();dd.setDate(dd.getDate()-i);
    if(dd.getDay()===0)continue;
    var ds=dd.toISOString().split('T')[0];
    var vv=attendance[ds+'-S-'+s.id];
    if(vv==='P'||vv==='L'||vv==='ED'){streak++;}else{if(i>0&&streak===0)continue;break;}
  }
  var circ=2*Math.PI*38;var arc=Math.round(total_score/100*circ*10)/10;
  box.innerHTML='<div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">'
    +avatarHTML(s.name,48)
    +'<div style="flex:1"><div style="font-family:\'Playfair Display\',serif;font-size:18px;font-weight:700;color:var(--text)">'+esc(s.name)+'</div>'
    +'<div style="font-size:12px;color:var(--muted)">'+esc(s.role)+' · '+esc(s.dept||'')+'</div>'
    +(stars>0?'<div style="font-size:11px;margin-top:2px">'+Array(stars).fill('⭐').join('')+' Recognition Stars</div>':'')
    +'</div>'
    +'<svg width="90" height="90" viewBox="0 0 90 90"><circle cx="45" cy="45" r="38" fill="'+scoreCol+'11" stroke="'+scoreCol+'33" stroke-width="10"/><circle cx="45" cy="45" r="38" fill="none" stroke="'+scoreCol+'" stroke-width="10" stroke-dasharray="'+arc+' '+circ+'" stroke-dashoffset="'+Math.round(circ/4)+'" stroke-linecap="round" transform="rotate(-90 45 45)"/><text x="45" y="41" text-anchor="middle" font-size="20" font-weight="800" fill="'+scoreCol+'" font-family="serif">'+total_score+'</text><text x="45" y="56" text-anchor="middle" font-size="10" fill="#8896bb">/ 100</text></svg>'
  +'</div>'
  +'<div style="background:var(--accent-light);border:1px solid var(--accent);border-radius:10px;padding:8px 14px;margin-bottom:14px;font-size:11.5px;color:var(--accent);font-weight:600">📐 Scored as: <b>'+scoringDef.title+'</b> -- '+scoringDef.desc+'</div>'
  +'<div style="background:var(--surface2);border-radius:12px;padding:12px 16px;margin-bottom:16px;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;text-align:center">'
    +'<div><div style="font-size:18px;font-weight:800;color:#f97316">'+streak+'d</div><div style="font-size:10px;color:var(--muted)">Streak</div></div>'
    +'<div><div style="font-size:18px;font-weight:800;color:#16a34a">'+attPct+'%</div><div style="font-size:10px;color:var(--muted)">Attendance</div></div>'
    +'<div><div style="font-size:18px;font-weight:800;color:#0ea5e9">'+punctPct+'%</div><div style="font-size:10px;color:var(--muted)">Punctual</div></div>'
    +'<div><div style="font-size:18px;font-weight:800;color:#8b5cf6">'+dutyCount+'</div><div style="font-size:10px;color:var(--muted)">Duty Shifts</div></div>'
    +'<div><div style="font-size:18px;font-weight:800;color:#3b82f6">'+reports.length+'</div><div style="font-size:10px;color:var(--muted)">Reports</div></div>'
    +(lbTab==='teachers'?'<div><div style="font-size:18px;font-weight:800;color:#1433a8">'+lpCompPct+'%</div><div style="font-size:10px;color:var(--muted)">Plan Rate</div></div>':'<div><div style="font-size:18px;font-weight:800;color:#059669">'+dsCount+'</div><div style="font-size:10px;color:var(--muted)">Doubt Sess.</div></div>')
  +'</div>'
  +items.map(function(item){
    var pct=Math.round(item.pts/item.max*100);
    return'<div style="margin-bottom:12px">'
      +'<div style="display:flex;justify-content:space-between;margin-bottom:4px">'
        +'<span style="font-size:12.5px;font-weight:700;color:var(--text)">'+item.label+'</span>'
        +'<span style="font-size:12px;font-weight:800;color:'+item.col+'">'+item.pts+' / '+item.max+'</span>'
      +'</div>'
      +'<div style="width:100%;height:10px;background:var(--surface3);border-radius:5px;overflow:hidden;margin-bottom:3px">'
        +'<div style="height:100%;width:'+pct+'%;background:'+item.col+';border-radius:5px;transition:width .6s ease"></div>'
      +'</div>'
      +'<div style="font-size:11px;color:var(--muted)">'+esc(item.pct)+'</div>'
    +'</div>';
  }).join('')
  +'<button onclick="document.getElementById(\'lb-modal-overlay\').style.display=\'none\'" style="width:100%;padding:11px;border-radius:14px;background:var(--accent);color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif;margin-top:8px">Close</button>';
  overlay.style.display='flex';
}
/* ═══════════════════════════════════════════════════════════════
   REPORT COLLECTION -- Staff Report Submission & Management
   ═══════════════════════════════════════════════════════════════ */
var rcFormOpen   = false;
var rcFilterRole = 'All';
var rcFilterType = 'All';
/* -- REPORTS -- Supabase Direct (gnsi_reports table) -----------
   All reads and writes go straight to Supabase.
   localStorage is only used as a fast cache/fallback.
   -------------------------------------------------------------- */
var _gnsiReportsCache = null;  // in-memory cache for current session
var _gnsiReportsLoaded = false;
/* Read from cache or localStorage fallback */
function gnsiGetReports(){
  if(!_supa){ try{ return JSON.parse(localStorage.getItem('gnsi_report_collection')||'[]'); }catch(e){ return []; } }
  if(_gnsiReportsCache !== null) return _gnsiReportsCache;
  try{ return JSON.parse(localStorage.getItem('gnsi_report_collection')||'[]'); }catch(e){ return []; }
}
/* Load all reports from Supabase into cache */
function gnsiLoadReportsFromCloud(callback){
  if(!_supa){ if(callback) callback([]); return; }
  _supa.from('gnsi_reports')
    .select('*')
    .order('submitted_at', { ascending: false })
    .then(function(result){
      var rows = (result.data || []).map(function(r){
        return {
          id:              r.id,
          staffId:         r.staff_id,
          staffName:       r.staff_name,
          staffRole:       r.staff_role,
          type:            r.report_type,
          title:           r.title,
          body:            r.body,
          recommendations: r.recommendations || '',
          priority:        r.priority || 'Normal',
          date:            r.report_date,
          status:          r.status || 'Pending Review',
          adminNote:       r.admin_note || '',
          submittedAt:     r.submitted_at,
          reviewedAt:      r.reviewed_at || ''
        };
      });
      _gnsiReportsCache = rows;
      _gnsiReportsLoaded = true;
      // Save to localStorage as offline fallback
      try{ localStorage.setItem('gnsi_report_collection', JSON.stringify(rows));if(typeof gnsiKVPush==='function')gnsiKVPush('gnsi_report_collection',rows); }catch(e){}
      if(callback) callback(rows);
    })
    .catch(function(e){
      (void 0);
      // Fall back to localStorage
      var fallback = (function(){try{return JSON.parse(localStorage.getItem('gnsi_report_collection')||'[]');}catch(e){return[];}})();
      _gnsiReportsCache = fallback;
      if(callback) callback(fallback);
    });
}
/* Insert a new report to Supabase */
function gnsiInsertReport(report, callback){
  if(!_supa){ if(callback) callback(null, new Error('No Supabase')); return; }
  _supa.from('gnsi_reports')
    .insert({
      staff_id:       report.staffId,
      staff_name:     report.staffName,
      staff_role:     report.staffRole,
      report_type:    report.type,
      title:          report.title,
      body:           report.body,
      recommendations:report.recommendations || '',
      priority:       report.priority || 'Normal',
      report_date:    report.date,
      status:         'Pending Review',
      submitted_at:   new Date().toISOString()
    })
    .select()
    .then(function(result){
      if(result.data && result.data[0]){
        // Bust cache so next read re-fetches
        _gnsiReportsCache = null;
        if(callback) callback(result.data[0], null);
      }
    })
    .catch(function(e){ if(callback) callback(null, e); });
}
/* Update report status in Supabase */
function gnsiUpdateReportStatus(id, status, adminNote, callback){
  if(!_supa){ if(callback) callback(null, new Error('No Supabase')); return; }
  var updates = { status: status, reviewed_at: new Date().toISOString() };
  if(adminNote) updates.admin_note = adminNote;
  _supa.from('gnsi_reports')
    .update(updates)
    .eq('id', id)
    .then(function(){
      _gnsiReportsCache = null;
      if(callback) callback(true, null);
    })
    .catch(function(e){ if(callback) callback(null, e); });
}
/* Delete a report from Supabase */
function gnsiDeleteReport(id, callback){
  if(!_supa){ if(callback) callback(null, new Error('No Supabase')); return; }
  _supa.from('gnsi_reports')
    .delete()
    .eq('id', id)
    .then(function(){
      _gnsiReportsCache = null;
      if(callback) callback(true, null);
    })
    .catch(function(e){ if(callback) callback(null, e); });
}
/* Legacy gnsiSaveReports -- kept for leaderboard score reads only */
function gnsiSaveReports(arr){
  _gnsiReportsCache = arr;
  try{ localStorage.setItem('gnsi_report_collection', JSON.stringify(arr));if(typeof gnsiKVPush==='function')gnsiKVPush('gnsi_report_collection',arr); }catch(e){}
}
var REPORT_TYPES = ['Daily Activity Report','Lesson Plan','Student Progress Report','Incident Report','Health & Safety Report','Hostel Night Report','House Points Report','Accounts Summary','Fee Collection Report','Monthly Summary','Doubt Session Log','Exam Preparation Report','Other'];
