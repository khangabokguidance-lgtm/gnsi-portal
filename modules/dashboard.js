/* GNSI PORTAL — modules/dashboard.js
   Dashboard page: renderDashboard(), miniStaffRow(), dashSearch()
   DEPENDS ON: core/utils.js, core/state.js */

function renderDashboard(){
  /* FIX v80: Check for pending OTP password notification (from a staff OTP login) */
  if (typeof currentUser !== 'undefined' && currentUser && currentUser.id === 1) {
    try {
      var _otpNote = localStorage.getItem('_gnsi_otp_new_pwd');
      if (_otpNote) {
        var _n = JSON.parse(_otpNote);
        /* Only show once — remove immediately */
        localStorage.removeItem('_gnsi_otp_new_pwd');
        if (_n && _n.staffName && _n.newPwd && (Date.now() - new Date(_n.ts).getTime()) < 300000) {
          setTimeout(function() {
            var modal = document.createElement('div');
            modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:99999;display:flex;align-items:center;justify-content:center;font-family:"DM Sans",sans-serif';
            modal.innerHTML = '<div style="background:#fff;border-radius:18px;padding:28px 28px 24px;max-width:400px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,.35);text-align:center">'
              +'<div style="font-size:13px;font-weight:700;color:#059669;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px">📋 Pending Password to Share</div>'
              +'<div style="font-size:14px;color:#475569;margin-bottom:8px">Staff member <b>'+escHtml(_n.staffName)+'</b> logged in via OTP.<br>Their new password is:</div>'
              +'<div style="font-family:\'JetBrains Mono\',monospace;font-size:22px;font-weight:700;color:#1433a8;background:#f0f4ff;border-radius:12px;padding:14px 0;margin-bottom:10px;letter-spacing:.1em">'+escHtml(_n.newPwd)+'</div>'
              +'<div style="font-size:11.5px;color:#64748b;margin-bottom:18px">Please share this with them now. You will not see this again.</div>'
              +'<button onclick="this.closest(\'div[style*=fixed]\').remove()" style="width:100%;padding:11px;background:linear-gradient(135deg,#059669,#047857);color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer">Done — Password Shared</button>'
              +'</div>';
            document.body.appendChild(modal);
          }, 1200);
        }
      }
    } catch(e) {}
  }
  // ▸ PERF: 30s cache -- avoids 28 array loops over 321 students on every render()
  if(window._dashCache&&(Date.now()-window._dashCacheTs)<5000)return window._dashCache;
  var paid    = students.filter(function(s){return s.fees==='Paid';}).length;
  var pending = students.filter(function(s){return s.fees==='Pending';}).length;
  var hostelCount = students.filter(function(s){return s.hostel==='Yes';}).length;
  var dc2={};
  staff.forEach(function(s){dc2[s.dept]=(dc2[s.dept]||0)+1;});
  var today=new Date().toISOString().split('T')[0];
  var dayName=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];
  var dateStr=new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'});
  // -- Live HMS data --
  var openBeh   = (function(){try{return JSON.parse(localStorage.getItem('gnsi_hmsa_behaviour')||'[]').filter(function(r){return r.status==='Open';}).length;}catch(e){return 0;}})();
  var hlMon     = (function(){try{return JSON.parse(localStorage.getItem('gnsi_hmsa_health')||'[]').filter(function(r){return r.status==='Monitoring';}).length;}catch(e){return 0;}})();
  var actCount  = (function(){try{return JSON.parse(localStorage.getItem('gnsi_hmsa_activities')||'[]').filter(function(r){return r.status==='Upcoming'||r.status==='Ongoing';}).length;}catch(e){return 0;}})();
  var compCount = (function(){try{return JSON.parse(localStorage.getItem('gnsi_hmsa_competitions')||'[]').filter(function(r){return r.status==='Ongoing'||r.status==='Upcoming';}).length;}catch(e){return 0;}})();
  var rcToday   = (function(){try{var d=today;return JSON.parse(localStorage.getItem('gnsi_hmsa_rollcall')||'[]').filter(function(r){return r.date===d;}).length;}catch(e){return 0;}})();
  var studentHouseMap = gnsiGetHouseMap();   // PERF: use cache
  var assignedCount = Object.keys(studentHouseMap).length;
  var attData=(typeof attendance !== 'undefined' ? attendance : {});
  var attToday=Object.keys(attData).filter(function(k){return k.indexOf(today+'-S')===0;});
  var attP=attToday.filter(function(k){return attData[k]==='P';}).length;
  var attA=attToday.filter(function(k){return attData[k]==='A';}).length;
  var totalIncome=(function(){try{return(JSON.parse(localStorage.getItem('ims_income')||'[]')||[]).reduce(function(t,r){return t+(parseFloat(r.amount)||0);},0);}catch(e){return 0;}})();
  // House points tally
  var housePoints = {};
  var HM_HOUSES_LIST = ['KOMBIREI','LOKTAK','SINGAREI','KANGLA','KOUBRU','SHIROI','SANGAI','SANAREI','NONGIN'];
  HM_HOUSES_LIST.forEach(function(h){housePoints[h]=0;});
  (function(){try{JSON.parse(localStorage.getItem('gnsi_hmsa_house_points')||'[]').forEach(function(r){if(housePoints[r.house]!==undefined)housePoints[r.house]+=(r.pts||0);});}catch(e){}})();
  (function(){try{JSON.parse(localStorage.getItem('gnsi_hmsa_competitions')||'[]').forEach(function(c){if(c.status!=='Completed'||!c.positions)return;Object.keys(c.positions).forEach(function(hid){var pos=c.positions[hid];var pts=pos==='1st'?(c.pts1||10):pos==='2nd'?(c.pts2||7):pos==='3rd'?(c.pts3||5):pos==='Participated'?1:0;if(pts&&housePoints[hid]!==undefined)housePoints[hid]+=pts;});});}catch(e){}})();
  var sortedHouses=HM_HOUSES_LIST.slice().sort(function(a,b){return (housePoints[b]||0)-(housePoints[a]||0);});
  var maxPtsGlobal=Math.max.apply(null,sortedHouses.map(function(h){return housePoints[h]||0;}))||1;
  var houseColors = {KOMBIREI:'#e63946',LOKTAK:'#3b78c9',SINGAREI:'#f59e0b',KANGLA:'#16a34a',KOUBRU:'#8b5cf6',SHIROI:'#0891b2',SANGAI:'#ec4899',SANAREI:'#94a3b8',NONGIN:'#2563eb'};
  var houseIcons  = {KOMBIREI:'🔴',LOKTAK:'🔵',SINGAREI:'🟡',KANGLA:'🟢',KOUBRU:'🟣',SHIROI:'🩵',SANGAI:'🩷',SANAREI:'⚪',NONGIN:'🔷'};
  var hmAssignments=(function(){try{return JSON.parse(localStorage.getItem('gnsi_hms_assignments')||'{}');}catch(e){return {};}})();
  var hmStaffList = staff.filter(function(s){var r=(s.role||'').toLowerCase();return r.includes('house master')||r.includes('house mistress')||r.includes('boarding in charge');});
  var unassignedCount=students.filter(function(s){return s.hostel==='Yes'&&!studentHouseMap[s.id];}).length;
  var userName = currentUser ? currentUser.name : '';
  
  var hero='<div class="db-hero">'
    +'<div class="db-hero-inner">'
    +'<div class="db-hero-left">'
    +'<div class="db-hero-eyebrow">'+(window.TENANT?window.TENANT.name.toUpperCase()+' · '+window.TENANT.address:'GUIDANCE NAVODAYA &amp; SAINIK INSTITUTE · Khangabok Sorok Wangma, Thoubal, Manipur')+'</div>'
    +'<div class="db-hero-greeting">Good '+( new Date().getHours()<12?'Morning':'afternoon')+'<span class="db-hero-wave">👋</span></div>'
    +'<div class="db-hero-name">'+esc(userName)+'</div>'
    +'<div class="db-hero-date">'+dayName+', '+dateStr+'</div>'
    +'</div>'
    +'<div class="db-hero-right">'
    +'<div class="db-hero-inst-badge">'
    +'<div style="font-size:32px">🏫</div>'
    +'<div class="db-hero-inst-text">GNSI</div>'
    +'<div class="db-hero-inst-sub">Management Portal</div>'
    +'</div>'
    +'</div>'
    +'</div>'
    +'<div class="db-hero-pulse-row">'
    +(_isAdminOrArunkumar()?'<div class="db-pulse-chip '+(attA>2?'db-pulse-alert':'db-pulse-ok')+'"><span class="db-pulse-dot"></span>'+attP+' staff present today</div>':'')
    +(openBeh>0?'<div class="db-pulse-chip db-pulse-warn"><span class="db-pulse-dot"></span>'+openBeh+' behaviour cases open</div>':'')
    +(hlMon>0?'<div class="db-pulse-chip db-pulse-warn"><span class="db-pulse-dot"></span>'+hlMon+' health monitoring</div>':'')
    +(pending>0?'<div class="db-pulse-chip db-pulse-alert"><span class="db-pulse-dot"></span>'+pending+' fees pending</div>':'')
    +'<div class="db-pulse-chip db-pulse-ok"><span class="db-pulse-dot"></span>'+rcToday+' roll calls today</div>'
    +'</div>'
    +'</div>';
  
  var kpiGrid='<div class="db-kpi-grid">'
    +'<div class="db-kpi-card db-kpi-blue" onclick="navigate(\'staff\')">'
    +'<div class="db-kpi-icon">👥</div>'
    +'<div class="db-kpi-val">'+staff.length+'</div>'
    +'<div class="db-kpi-lbl">Total Staff</div>'
    +'<div class="db-kpi-sub">All departments</div>'
    +'</div>'
    +'<div class="db-kpi-card db-kpi-green" onclick="navigate(\'students\')">'
    +'<div class="db-kpi-icon">🎓</div>'
    +'<div class="db-kpi-val">'+students.length+'</div>'
    +'<div class="db-kpi-lbl">Students</div>'
    +'<div class="db-kpi-sub">Currently enrolled</div>'
    +'</div>'
    +(_isAdminOrAccounts()?'<div class="db-kpi-card '+(pending>0?'db-kpi-amber':'db-kpi-teal')+'" onclick="navigate(\'fees\')">'+'<div class="db-kpi-icon">💰</div>'+'<div class="db-kpi-val">'+paid+'</div>'+'<div class="db-kpi-lbl">Fees Collected</div>'+'<div class="db-kpi-sub">'+(pending>0?'⚠ '+pending+' pending':'All clear ✓')+'</div>'+'</div>':'')
    +'<div class="db-kpi-card db-kpi-purple" onclick="navigate(\'notices\')">'
    +'<div class="db-kpi-icon">📌</div>'
    +'<div class="db-kpi-val">'+notices.length+'</div>'
    +'<div class="db-kpi-lbl">Active Notices</div>'
    +'<div class="db-kpi-sub">On notice board</div>'
    +'</div>'
    +'<div class="db-kpi-card db-kpi-indigo" onclick="navigate(\'housemaster\')">'
    +'<div class="db-kpi-icon">🏠</div>'
    +'<div class="db-kpi-val">'+hostelCount+'</div>'
    +'<div class="db-kpi-lbl">Hostel Students</div>'
    +'<div class="db-kpi-sub">'+assignedCount+' house-assigned'+(unassignedCount>0?' · ⚠ '+unassignedCount+' unassigned':'')+'</div>'
    +'</div>'
    +'<div class="db-kpi-card db-kpi-cyan" onclick="navigate(\'attendance\')">'
    +'<div class="db-kpi-icon">✅</div>'
    +'<div class="db-kpi-val">'+attP+'</div>'
    +'<div class="db-kpi-lbl">Present Today</div>'
    +'<div class="db-kpi-sub">'+(attA>0?'⚠ '+attA+' absent':'Full house')+'</div>'
    +'</div>'
    +'</div>';
  
  var quickActions='<div class="db-quick-row">'
    +'<div class="db-section-head"><span class="db-section-title">⚡ Quick Actions</span></div>'
    +'<div class="db-quick-grid">'
    +'<button class="db-qa-btn db-qa-blue" onclick="navigate(\'attendance\')"><span>📋</span><span>Take Attendance</span></button>'
    +'<button class="db-qa-btn db-qa-green" onclick="navigate(\'faculty\')"><span>📝</span><span>Lesson Plans</span></button>'
    +'<button class="db-qa-btn db-qa-purple" onclick="navigate(\'housemaster\');hmsMasterTab=\'rollcall\'"><span>📣</span><span>Roll Call</span></button>'
    +'<button class="db-qa-btn db-qa-amber" onclick="navigate(\'notices\')"><span>📌</span><span>Add Notice</span></button>'
    +(_isAdminOrAccounts()?'<button class="db-qa-btn db-qa-red" onclick="navigate(\'fees\')"><span>💳</span><span>Fee Records</span></button>':'')
    +'<button class="db-qa-btn db-qa-teal" onclick="navigate(\'reports\')"><span>📊</span><span>Reports</span></button>'
    +(currentUser&&currentUser.role==='admin'?'<button class="db-qa-btn db-qa-indigo" onclick="navigate(\'admincentre\')"><span>🛡</span><span>Admin Centre</span></button>':'')
    +'<button class="db-qa-btn db-qa-slate" onclick="navigate(\'timetable\')"><span>📅</span><span>Timetable</span></button>'
    +'<button class="db-qa-btn db-qa-green" onclick="navigate(\'lessonbridge\')"><span>🌉</span><span>Lesson Bridge</span></button>'
    +'<button class="db-qa-btn db-qa-indigo" onclick="navigate(\'gnsi_social\')"><span>🌐</span><span>GNSI Social</span></button>'
    +'</div></div>';
  
  /* ── Induction Timetable Dashboard Widget (Admin only) ── */
  var inductionTTWidget = '';
  if(currentUser && currentUser.role === 'admin'){
    var _ittData = (function(){
      try{ var d=JSON.parse(localStorage.getItem('gnsi_course_induction_tt')||'null'); return (d&&d.timetables)?d:{timetables:[]}; }catch(e){return {timetables:[]};}
    })();
    var _ittTabs = _ittData.timetables;
    var _ittTabBar = _ittTabs.map(function(tt, i){
      var lbl = tt.title.length > 36 ? tt.title.substring(0,34)+'…' : tt.title;
      return '<button onclick="window._dbIttTab='+i+';document.getElementById(\'db-itt-body\').innerHTML=window._dbIttRender('+i+');this.parentNode.querySelectorAll(\'.db-itt-tab\').forEach(function(b){b.classList.remove(\'db-itt-tab-active\')});this.classList.add(\'db-itt-tab-active\')" '
           + 'class="db-itt-tab'+(i===0?' db-itt-tab-active':'')+'" style="padding:6px 14px;border-radius:8px;border:1.5px solid var(--border);font-size:11px;font-weight:700;cursor:pointer;background:'+(i===0?'#1433a8':'var(--surface)')+';color:'+(i===0?'#fff':'var(--muted)')+';transition:all .15s">'
           + (i+1)+'. '+esc(lbl)
           + '</button>';
    }).join('');

    /* Render function stored globally so onclick can call it */
    var _ittRenderScript = '<script>window._dbIttRender=function(idx){'
      + 'var d=(function(){try{var x=JSON.parse(localStorage.getItem(\'gnsi_course_induction_tt\')||\'null\');return(x&&x.timetables)?x:{timetables:[]};}catch(e){return{timetables:[]}}})();'
      + 'var tt=d.timetables[idx];if(!tt)return\'<div style="padding:20px;text-align:center;color:var(--muted)">No timetable data.</div>\';'
      + 'var h=\'<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:11px"><thead><tr>\';'
      + 'h+=\'<th style="background:#1433a8;color:#fff;padding:7px 10px;white-space:nowrap;text-align:left">Time</th>\';'
      + 'tt.batches.forEach(function(b){h+=\'<th style="background:#1433a8;color:#fff;padding:7px 8px;text-align:center;white-space:nowrap">\'+b+\'</th>\';});'
      + 'h+=\'</tr></thead><tbody>\';'
      + 'tt.slots.forEach(function(s,si){var spec=/BREAK|DINNER|OFF|LUNCH/i.test(s.cells.join(\' \'));'
      + 'h+=\'<tr>\';h+=\'<td style="padding:7px 10px;border:1px solid var(--border);font-weight:700;font-size:10px;color:#1433a8;background:#e8ecff;white-space:nowrap">\'+s.time+\'</td>\';'
      + 's.cells.forEach(function(c){h+=\'<td style="padding:7px 8px;border:1px solid var(--border);text-align:center;\'+(spec?\'background:#fef9c3;color:#78350f;font-weight:700\':\'color:var(--text)\')+\'">\'+( c||\'\')+\'</td>\';});'
      + 'h+=\'</tr>\';});'
      + 'h+=\'</tbody></table></div>\';return h;};'
      + 'window._dbIttTab=0;<\/script>';

    var _ittBody = (_ittTabs.length > 0) ? (function(){
      var tt = _ittTabs[0];
      var h = '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:11px"><thead><tr>';
      h += '<th style="background:#1433a8;color:#fff;padding:7px 10px;white-space:nowrap;text-align:left">Time</th>';
      tt.batches.forEach(function(b){ h += '<th style="background:#1433a8;color:#fff;padding:7px 8px;text-align:center;white-space:nowrap">'+esc(b)+'</th>'; });
      h += '</tr></thead><tbody>';
      tt.slots.forEach(function(s){
        var spec = /BREAK|DINNER|OFF|LUNCH/i.test(s.cells.join(' '));
        h += '<tr>';
        h += '<td style="padding:7px 10px;border:1px solid var(--border);font-weight:700;font-size:10px;color:#1433a8;background:#e8ecff;white-space:nowrap">'+esc(s.time)+'</td>';
        s.cells.forEach(function(c){
          h += '<td style="padding:7px 8px;border:1px solid var(--border);text-align:center;'+(spec?'background:#fef9c3;color:#78350f;font-weight:700':'color:var(--text)')+'">'+esc(c||'')+'</td>';
        });
        h += '</tr>';
      });
      h += '</tbody></table></div>';
      return h;
    })() : '<div style="padding:24px;text-align:center;color:var(--muted);font-size:13px">No timetable data yet. <a href="#" onclick="navigate(\'course_induction_tt\')" style="color:#1433a8;font-weight:700">Open Induction TT →</a></div>';

    inductionTTWidget = _ittRenderScript
      + '<div class="card db-card-anim" style="margin-top:20px">'
      + '<div class="card-head" style="background:linear-gradient(135deg,rgba(20,51,168,.05),transparent)">'
      + '<span class="card-title">📋 Course Induction Timetable</span>'
      + '<span style="font-size:10px;background:#1433a8;color:#fff;border-radius:20px;padding:2px 9px;font-weight:700;margin-left:8px">🔒 Admin</span>'
      + '<button onclick="navigate(\'course_induction_tt\')" style="font-size:11px;padding:5px 11px;border-radius:6px;border:1px solid #c7d2fe;background:#e8ecff;color:#1433a8;cursor:pointer;font-weight:700;margin-left:auto">Manage →</button>'
      + '</div>'
      + (_ittTabs.length > 1 ? '<div style="display:flex;gap:6px;flex-wrap:wrap;padding:10px 16px;border-bottom:1px solid var(--border)">'+_ittTabBar+'</div>' : '')
      + '<div id="db-itt-body" style="padding:0">'+_ittBody+'</div>'
      + '</div>';
  }

  var grid2col='<div class="db-main-grid">'
    +'<div class="card db-card-anim">'
    +'<div class="card-head"><span class="card-title">Staff by Department</span><span class="db-sub-badge">'+Object.keys(dc2).length+' depts</span></div>'
    +'<div style="padding:16px 20px">'
    +Object.entries(dc2).sort(function(a,b){return b[1]-a[1];}).map(function(e){
      var dept=e[0],count=e[1];
      var col=DEPT_COLORS[dept]||'#7a7468';
      var pct=Math.round(count/staff.length*100);
      return '<div class="dept-bar-row">'
        +'<div style="width:110px;font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"><span class="dept-dot" style="background:'+col+'"></span>'+dept+'</div>'
        +'<div class="dept-bar-bg"><div class="dept-bar-fill" style="width:'+pct+'%;background:'+col+'"></div></div>'
        +'<div style="font-family:\'JetBrains Mono\',monospace;font-size:11px;color:'+col+';font-weight:800;min-width:20px;text-align:right">'+count+'</div>'
        +'</div>';
    }).join('')
    +'</div></div>'
    +'<div class="card db-card-anim">'
    +'<div class="card-head"><span class="card-title">Recent Notices</span><button class="btn btn-outline" onclick="navigate(\'notices\')" style="font-size:11px;padding:5px 11px">View All</button></div>'
    +'<div style="padding:4px 0">'
    +(notices.length?notices.slice(0,5).map(function(n){
      return '<div class="db-notice-row">'
        +'<div class="db-notice-dot" style="background:'+pc(n.priority)+'"></div>'
        +'<div style="flex:1;min-width:0"><div class="db-notice-title">'+esc(n.title)+'</div>'
        +'<div class="db-notice-meta">'+n.date+' &nbsp;·&nbsp; '+badge(n.priority,pc(n.priority))+'</div></div>'
        +'</div>';
    }).join(''):'<div style="padding:30px;text-align:center;color:var(--muted);font-size:13px">No notices yet.</div>')
    +'</div></div>'
    +'</div>';
  
  var houseSection='<div class="db-house-section">'
    +'<div class="db-house-header">'
    +'<div class="db-house-title-bar">'
    +'<div class="db-house-accent-bar"></div>'
    +'<div class="db-house-title">🏠 House Master Control System</div>'
    +'<span class="db-house-chip">BOARDING SECTION</span>'
    +'</div>'
    +'</div>'
    
    +'<div class="db-hms-kpi-grid">'
    +'<div class="db-hms-kpi" onclick="navigate(\'housemaster\')" style="background:linear-gradient(135deg,#f5f3ff,#ede9fe);border-color:#c4b5fd">'
    +'<div class="db-hms-kpi-icon" style="color:#7c3aed">🏠</div>'
    +'<div class="db-hms-kpi-val" style="color:#7c3aed">'+hostelCount+'</div>'
    +'<div class="db-hms-kpi-lbl" style="color:#6d28d9">Hostel Students</div>'
    +'<div class="db-hms-kpi-sub">'+assignedCount+' assigned'+(unassignedCount>0?' · <b style="color:#dc2626">'+unassignedCount+' unassigned</b>':'')+'</div>'
    +'</div>'
    +'<div class="db-hms-kpi" onclick="navigate(\'housemaster\');hmsMasterTab=\'behaviour\'" style="background:'+(openBeh>0?'linear-gradient(135deg,#fef2f2,#fee2e2)':'linear-gradient(135deg,#f0fdf4,#dcfce7)')+';border-color:'+(openBeh>0?'#fca5a5':'#86efac')+'">'
    +'<div class="db-hms-kpi-icon" style="color:'+(openBeh>0?'#dc2626':'#16a34a')+'">📋</div>'
    +'<div class="db-hms-kpi-val" style="color:'+(openBeh>0?'#dc2626':'#16a34a')+'">'+openBeh+'</div>'
    +'<div class="db-hms-kpi-lbl" style="color:'+(openBeh>0?'#b91c1c':'#15803d')+'">Behaviour Cases</div>'
    +'<div class="db-hms-kpi-sub">'+(openBeh>0?'⚠ Needs attention':'✓ All clear')+'</div>'
    +'</div>'
    +'<div class="db-hms-kpi" onclick="navigate(\'housemaster\');hmsMasterTab=\'health\'" style="background:'+(hlMon>0?'linear-gradient(135deg,#fffbeb,#fef3c7)':'linear-gradient(135deg,#f0fdf4,#dcfce7)')+';border-color:'+(hlMon>0?'#fde68a':'#86efac')+'">'
    +'<div class="db-hms-kpi-icon" style="color:'+(hlMon>0?'#d97706':'#16a34a')+'">🏥</div>'
    +'<div class="db-hms-kpi-val" style="color:'+(hlMon>0?'#d97706':'#16a34a')+'">'+hlMon+'</div>'
    +'<div class="db-hms-kpi-lbl" style="color:'+(hlMon>0?'#92400e':'#15803d')+'">Health Watch</div>'
    +'<div class="db-hms-kpi-sub">'+(hlMon>0?'Under monitoring':'✓ All healthy')+'</div>'
    +'</div>'
    +'<div class="db-hms-kpi" onclick="navigate(\'housemaster\');hmsMasterTab=\'activities\'" style="background:linear-gradient(135deg,#eff6ff,#dbeafe);border-color:#93c5fd">'
    +'<div class="db-hms-kpi-icon" style="color:#2563eb">🏆</div>'
    +'<div class="db-hms-kpi-val" style="color:#2563eb">'+actCount+'</div>'
    +'<div class="db-hms-kpi-lbl" style="color:#1d4ed8">Activities</div>'
    +'<div class="db-hms-kpi-sub">'+compCount+' competition'+(compCount!==1?'s':'')+'</div>'
    +'</div>'
    +'<div class="db-hms-kpi" onclick="navigate(\'housemaster\');hmsMasterTab=\'rollcall\'" style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-color:#86efac">'
    +'<div class="db-hms-kpi-icon" style="color:#16a34a">📣</div>'
    +'<div class="db-hms-kpi-val" style="color:#16a34a">'+rcToday+'</div>'
    +'<div class="db-hms-kpi-lbl" style="color:#15803d">Roll Calls</div>'
    +'<div class="db-hms-kpi-sub">'+(rcToday===0?'None yet today':'Sessions recorded')+'</div>'
    +'</div>'
    +'</div>'
    
    +'<div class="db-house-inner-grid">'
    
    +'<div class="card">'
    +'<div class="card-head" style="background:linear-gradient(135deg,rgba(124,58,237,.06),transparent)">'
    +'<span class="card-title" style="color:#7c3aed">⭐ House Leaderboard</span>'
    +'<button onclick="navigate(\'housemaster\');hmsMasterTab=\'activities\';hmsActTab=\'points\'" style="font-size:11px;padding:4px 10px;border-radius:6px;border:1px solid #c4b5fd;background:#f5f3ff;color:#7c3aed;cursor:pointer;font-weight:700">Full Tally →</button>'
    +'</div>'
    +'<div style="padding:14px 16px">'
    +sortedHouses.map(function(h,i){
      var pts=housePoints[h]||0;
      var pct=Math.round(pts/maxPtsGlobal*100);
      var col=houseColors[h]||'#64748b';
      var medal=i===0?'🥇':i===1?'🥈':i===2?'🥉':'<span style="font-family:\'JetBrains Mono\',monospace;font-size:10px;color:var(--muted)">#'+(i+1)+'</span>';
      return '<div class="db-lb-row" style="background:'+(i===0?col+'12':'transparent')+';border:1.5px solid '+(i===0?col+'44':'transparent')+'">'
        +'<div style="width:22px;text-align:center;font-size:14px">'+medal+'</div>'
        +'<div style="font-size:12px;font-weight:700;color:'+col+';min-width:80px;white-space:nowrap">'+(houseIcons[h]||'')+' '+h+'</div>'
        +'<div style="flex:1;height:8px;background:var(--surface3);border-radius:4px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:'+col+';border-radius:4px;transition:width .6s ease"></div></div>'
        +'<div style="font-family:\'JetBrains Mono\',monospace;font-size:12px;font-weight:800;color:'+col+';min-width:30px;text-align:right">'+pts+'</div>'
        +'</div>';
    }).join('')
    +'</div></div>'
    
    +'<div style="background:linear-gradient(135deg,#f5f3ff,#ede9fe);border-radius:14px;padding:14px 16px;border:1.5px solid #c4b5fd">'
    +'<div class="db-houses-eyebrow">🏠 All 7 Houses -- Hostel Strength</div>'
    +'<div class="db-houses-grid">'
    +HM_HOUSES_LIST.map(function(h){
      var count=Object.keys(studentHouseMap).filter(function(sid){return studentHouseMap[sid]===h;}).length;
      var col=houseColors[h]||'#64748b';
      var isLdr=(h===sortedHouses[0])&&(housePoints[h]||0)>0;
      return '<div class="db-house-tile" onclick="navigate(\'housemaster\')" style="background:'+col+'12;border:1.5px solid '+(isLdr?col+'77':col+'33')+'">'
        +(isLdr?'<div class="db-house-crown">🏆</div>':'')
        +'<div style="font-size:20px">'+(houseIcons[h]||'')+'</div>'
        +'<div class="db-house-tile-name" style="color:'+col+'">'+h+'</div>'
        +'<div class="db-house-tile-count">'+count+'</div>'
        +'<div class="db-house-tile-sub">student'+(count!==1?'s':'')+'</div>'
        +'</div>';
    }).join('')
    +'</div></div>'
    +'</div>'
    
    +'<div class="db-hms-actions">'
    +'<button class="db-hms-act-btn" onclick="navigate(\'housemaster\');hmsMasterTab=\'overview\'">🏠 House Overview</button>'
    +'<button class="db-hms-act-btn" onclick="navigate(\'housemaster\');hmsMasterTab=\'rollcall\'">📣 Roll Call</button>'
    +'<button class="db-hms-act-btn db-hms-act-'+(openBeh>0?'warn':'default')+'" onclick="navigate(\'housemaster\');hmsMasterTab=\'behaviour\'">📋 Behaviour'+(openBeh>0?' ('+openBeh+')':'')+'</button>'
    +'<button class="db-hms-act-btn db-hms-act-'+(hlMon>0?'warn':'default')+'" onclick="navigate(\'housemaster\');hmsMasterTab=\'health\'">🏥 Health'+(hlMon>0?' ('+hlMon+')':'')+'</button>'
    +'<button class="db-hms-act-btn" onclick="navigate(\'housemaster\');hmsMasterTab=\'activities\'">🏆 Activities</button>'
    +'</div>'
    +'</div>';
  
  var staffLookup='<div class="card db-card-anim" style="margin-top:20px">'
    +'<div class="card-head"><span class="card-title">🔍 Quick Staff Lookup</span><span class="db-sub-badge">'+staff.length+' staff</span></div>'
    +'<div style="padding:12px 16px;border-bottom:1px solid var(--border-soft)">'
    +'<div class="search-wrap"><span class="search-icon">🔍</span><input placeholder="Search staff by name…" oninput="dashSearch(this.value)"/></div>'
    +'</div>'
    +'<div id="dash-sl" style="max-height:240px;overflow-y:auto">'+staff.slice(0,6).map(miniStaffRow).join('')+'</div>'
    +'</div>';
   /* ── Cross-device sync indicator (Dashboard) ──────────────
      Shows live connection status pulled from the RT engine.
      Updated in-place by the KV realtime handler above.
   ──────────────────────────────────────────────────────── */
   var _rtOk = (typeof _gnsiRTStatus!=='undefined') && _gnsiRTStatus.connected >= _gnsiRTStatus.total && _gnsiRTStatus.total > 0;
   var _syncBannerBg  = _rtOk ? 'linear-gradient(135deg,#f0fdf4,#f5fffe)' : 'linear-gradient(135deg,#fffbeb,#fefce8)';
   var _syncBannerBdr = _rtOk ? '#86efac' : '#fcd34d';
   var _syncBannerTxt = _rtOk ? '#16a34a' : '#d97706';
   var _syncBannerDot = _rtOk ? '#16a34a' : '#f59e0b';
   var _syncMsg       = _rtOk ? '\uD83D\uDFE2 Live Sync Active' : '\uD83D\uDFE1 Connecting…';
   var _syncDevCount  = (typeof _gnsiOnlineDevices!=='undefined') ? Object.keys(_gnsiOnlineDevices).length : 0;
   var syncStrip = '<div id="_gnsiDBSyncBadge" style="'
     + 'display:flex;align-items:center;gap:8px;padding:8px 16px;margin-bottom:16px;'
     + 'background:'+_syncBannerBg+';border:1px solid '+_syncBannerBdr+';border-radius:10px;'
     + 'font-size:12px;font-weight:600;color:'+_syncBannerTxt+';cursor:pointer;opacity:0.85;transition:opacity .3s"'
     + ' onclick="navigate(\'sync\')" title="Click to open Sync &amp; Backup">'
     + '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:'+_syncBannerDot+';'
     +   (_rtOk?'box-shadow:0 0 5px '+_syncBannerDot+';animation:pulse-dot 1.4s ease-in-out infinite':'')
     + '"></span>'
     + '<span id="_gnsiDBSyncMsg">'+_syncMsg+'</span>'
     + '<span id="_gnsiDBDeviceCount" style="margin-left:auto;background:'+_syncBannerBdr+'44;padding:2px 8px;border-radius:12px;font-size:11px;display:'+(_syncDevCount>1?'inline':'none')+'">'+_syncDevCount+' devices</span>'
     + '<span style="margin-left:auto;font-size:10px;opacity:.6">Students: '+students.length+' &nbsp; Staff: '+staff.length+'</span>'
     + '</div>';
   var _dh=(syncStrip+ hero+kpiGrid+quickActions+inductionTTWidget+grid2col+houseSection+staffLookup);window._dashCache=_dh;window._dashCacheTs=Date.now();return _dh;
}
function miniStaffRow(s){
  return '<div style="display:flex;align-items:center;gap:12px;padding:10px 16px;border-bottom:1px solid var(--border);transition:background .15s" onmouseenter="this.style.background=\'var(--surface2)\'" onmouseleave="this.style.background=\'\'">'+avatarHTML(s.name,30)+'<div style="flex:1"><div style="font-size:13px;font-weight:700">'+esc(s.name)+'</div><div style="font-size:11px;color:var(--muted)">'+esc(s.role)+'</div></div>'+badge(s.dept,dc(s.dept))+'</div>';
}
function dashSearch(q){
  var el=document.getElementById('dash-sl');if(!el)return;
  var res=staff.filter(function(s){return s.name.toLowerCase().includes(q.toLowerCase())}).slice(0,10);
  el.innerHTML=res.length?res.map(miniStaffRow).join(''):q?'<div style="padding:24px;text-align:center;color:var(--muted)">No results</div>':'';
}
window._gnsiRealDash = renderDashboard; /* save ref before any override */
// -- STAFF -----------------------------------------------------
function renderStaff(){
