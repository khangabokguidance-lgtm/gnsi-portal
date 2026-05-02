/* GNSI PORTAL — modules/attendance.js
   Pages: attendance
   DEPENDS ON: core/utils.js, core/state.js */

function renderAttendance(){
  var type=attTab==='staff'?'S':'T';
  var list=attTab==='staff'?staff:students;
  var sPresent=staff.filter(function(s){var v=attendance[attDate+'-S-'+s.id];return v==='P'||v==='L'||v==='ED'}).length;
  var sLate=staff.filter(function(s){return attendance[attDate+'-S-'+s.id]==='L'}).length;
  var sED=staff.filter(function(s){return attendance[attDate+'-S-'+s.id]==='ED'}).length;
  var sAbsent=staff.filter(function(s){return attendance[attDate+'-S-'+s.id]==='A'}).length;
  var tPresent=students.filter(function(s){var v=attendance[attDate+'-T-'+s.id];return v==='P'||v==='L'||v==='ED'}).length;
  var tLate=students.filter(function(s){return attendance[attDate+'-T-'+s.id]==='L'}).length;
  var tED=students.filter(function(s){return attendance[attDate+'-T-'+s.id]==='ED'}).length;
  var tAbsent=students.filter(function(s){return attendance[attDate+'-T-'+s.id]==='A'}).length;
  // Summary pills
  var summaryHTML='<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px">'
    +'<div style="background:#dcfce7;border:1px solid #86efac;border-radius:10px;padding:10px 18px;text-align:center;min-width:90px"><div style="font-size:22px;font-weight:800;color:#16a34a;font-family:\'Cormorant Garamond\',serif">'+(attTab==='staff'?sPresent:tPresent)+'</div><div style="font-size:10px;color:#16a34a;font-weight:700;text-transform:uppercase;letter-spacing:.06em;font-family:\'JetBrains Mono\',monospace">Present</div></div>'
    +'<div style="background:#fef9c3;border:1px solid #fde047;border-radius:10px;padding:10px 18px;text-align:center;min-width:90px"><div style="font-size:22px;font-weight:800;color:#ca8a04;font-family:\'Cormorant Garamond\',serif">'+(attTab==='staff'?sLate:tLate)+'</div><div style="font-size:10px;color:#ca8a04;font-weight:700;text-transform:uppercase;letter-spacing:.06em;font-family:\'JetBrains Mono\',monospace">Late</div></div>'
    +'<div style="background:#fff7ed;border:1px solid #fdba74;border-radius:10px;padding:10px 18px;text-align:center;min-width:90px"><div style="font-size:22px;font-weight:800;color:#ea580c;font-family:\'Cormorant Garamond\',serif">'+(attTab==='staff'?sED:tED)+'</div><div style="font-size:10px;color:#ea580c;font-weight:700;text-transform:uppercase;letter-spacing:.06em;font-family:\'JetBrains Mono\',monospace">Early Dep.</div></div>'
    +'<div style="background:#fee2e2;border:1px solid #fca5a5;border-radius:10px;padding:10px 18px;text-align:center;min-width:90px"><div style="font-size:22px;font-weight:800;color:#dc2626;font-family:\'Cormorant Garamond\',serif">'+(attTab==='staff'?sAbsent:tAbsent)+'</div><div style="font-size:10px;color:#dc2626;font-weight:700;text-transform:uppercase;letter-spacing:.06em;font-family:\'JetBrains Mono\',monospace">Absent</div></div>'
    +'<div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:10px 18px;text-align:center;min-width:90px"><div style="font-size:22px;font-weight:800;color:var(--text);font-family:\'Cormorant Garamond\',serif">'+list.length+'</div><div style="font-size:10px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.06em;font-family:\'JetBrains Mono\',monospace">Total</div></div>'
    +'</div>';
  // Apply batch filter to student attendance list
  if(attTab==='student' && window._attBatchFilter && window._attBatchFilter!=='All'){
    list=list.filter(function(s){return (s.cls||'')=== window._attBatchFilter;});
  }
  // Rows
  var rows=list.map(function(s){
    var key=attDate+'-'+type+'-'+s.id;
    var st=attendance[key]||'';
    var c=attColor(st);
    var arrKey=attDate+'-'+type+'x-'+s.id;
    var depKey=attDate+'-'+type+'d-'+s.id;
    var arr=attendance[arrKey]||'';
    var dep=attendance[depKey]||'';
    var showArr=st==='P'||st==='L'||st==='ED';
    var showDep=st==='ED';
    return '<div class="att-row" id="attrow-'+type+'-'+parseInt(s.id,10)+'">'
      +avatarHTML(s.name,30)
      +'<div style="flex:1;min-width:0">'
        +'<div style="font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(s.name)+'</div>'
        +'<div style="font-size:11px;color:var(--muted)">'+(s.role||s.cls||'')+(s.roll?' &middot; #'+esc(s.roll):'')+'</div>'
      +'</div>'
      // Time inputs
      +'<div style="display:flex;gap:6px;align-items:center">'
        +(showArr?'<div style="text-align:center"><div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px">Arrival</div><input type="time" value="'+arr+'" onchange="attSetTime(\''+type+'x\','+parseInt(s.id,10)+',this.value)" style="border:1px solid var(--border);border-radius:6px;padding:3px 6px;font-size:11px;font-family:\'JetBrains Mono\',monospace;background:var(--surface);color:var(--text);outline:none;width:82px"/></div>':'')
        +(showDep?'<div style="text-align:center"><div style="font-size:9px;color:#ea580c;text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px">Departed</div><input type="time" value="'+dep+'" onchange="attSetTime(\''+type+'d\','+parseInt(s.id,10)+',this.value)" style="border:1px solid #fdba74;border-radius:6px;padding:3px 6px;font-size:11px;font-family:\'JetBrains Mono\',monospace;background:#fff7ed;color:#ea580c;outline:none;width:82px"/></div>':'')
      +'</div>'
      // Status button
      +'<button onclick="attCycle(\''+type+'\','+parseInt(s.id,10)+')" title="Click to cycle: Present → Late → Early Dep → Absent" '
        +'style="min-width:76px;padding:5px 10px;border-radius:7px;border:1.5px solid '+c.bdr+';background:'+c.bg+';color:'+c.col+';font-weight:800;font-size:11.5px;font-family:\'JetBrains Mono\',monospace;cursor:pointer;transition:all .15s">'
        +attLabel(st)
      +'</button>'
    +'</div>';
  }).join('');
  var tabStyle=function(t){
    return t===attTab
      ?'padding:9px 22px;border-radius:8px;border:none;cursor:pointer;font-family:\'Nunito\',sans-serif;font-weight:700;font-size:13px;background:var(--accent);color:#fff'
      :'padding:9px 22px;border-radius:8px;border:1.5px solid var(--border);cursor:pointer;font-family:\'Nunito\',sans-serif;font-weight:600;font-size:13px;background:var(--surface);color:var(--muted)';
  };
  var legendHTML='<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-left:auto">'
    +'<span style="font-size:11px;color:var(--muted);font-family:\'JetBrains Mono\',monospace">Click status to cycle:</span>'
    +'<span style="padding:2px 8px;border-radius:5px;font-size:10.5px;font-weight:700;font-family:\'JetBrains Mono\',monospace;background:#dcfce7;color:#16a34a;border:1px solid #86efac">P</span>'
    +'<span style="font-size:10px;color:var(--muted)">→</span>'
    +'<span style="padding:2px 8px;border-radius:5px;font-size:10.5px;font-weight:700;font-family:\'JetBrains Mono\',monospace;background:#fef9c3;color:#ca8a04;border:1px solid #fde047">Late</span>'
    +'<span style="font-size:10px;color:var(--muted)">→</span>'
    +'<span style="padding:2px 8px;border-radius:5px;font-size:10.5px;font-weight:700;font-family:\'JetBrains Mono\',monospace;background:#fff7ed;color:#ea580c;border:1px solid #fdba74">Early Dep</span>'
    +'<span style="font-size:10px;color:var(--muted)">→</span>'
    +'<span style="padding:2px 8px;border-radius:5px;font-size:10.5px;font-weight:700;font-family:\'JetBrains Mono\',monospace;background:#fee2e2;color:#dc2626;border:1px solid #fca5a5">A</span>'
    +'</div>';
  return '<div style="display:flex;gap:12px;margin-bottom:18px;align-items:center;flex-wrap:wrap">'
    +'<div style="font-size:13px;color:var(--muted);font-weight:600">Date:</div>'
    +'<input type="date" value="'+attDate+'" onchange="gnsiAttDateChange(this.value,this)" style="background:var(--surface);border:1.5px solid var(--border);border-radius:9px;padding:8px 14px;font-size:13px;font-family:\'Nunito\',sans-serif;color:var(--text);outline:none"/>'
    +legendHTML
    +'</div>'
    +'<div style="display:flex;gap:8px;margin-bottom:18px;align-items:center">'
      +'<button style="'+tabStyle('staff')+'" onclick="attTab=\'staff\';render()">&#128101; Staff ('+staff.length+')</button>'
      +'<button style="'+tabStyle('student')+'" onclick="attTab=\'student\';render()">&#127891; Students ('+students.length+')</button>'
      +'<div style="margin-left:auto;display:flex;gap:8px">'
        +'<button class="btn btn-outline" style="font-size:11px;padding:5px 12px" onclick="markAll2(\'P\')">All Present</button>'
        +'<button class="btn btn-outline" style="font-size:11px;padding:5px 12px" onclick="markAll2(\'A\')">All Absent</button>'
        +'<button class="btn btn-outline" style="font-size:11px;padding:5px 12px;color:#dc2626;border-color:#fca5a5" onclick="clearAll2()">Clear All</button>'
      +'</div>'
    +'</div>'
    +summaryHTML
    +'<div class="card"><div class="card-head" style="background:'+(attTab==='staff'?'var(--accent-light)':'#eff6ff')+'">'
      +'<span class="card-title" style="color:'+(attTab==='staff'?'var(--accent)':'#3b78c9')+'">'+(attTab==='staff'?'Staff':'Student')+' Attendance &mdash; '+attDate+'</span>'
      +'<button onclick="attTab===\'staff\'?gnsiExportStaffAttendance():gnsiExportAttendance()" class="btn btn-outline" style="padding:4px 11px;font-size:11px;font-weight:700;cursor:pointer">⬇ Export CSV</button>'
      +'<button onclick="attTab===\'staff\'?gnsiExportStaffAttendance():gnsiExportAttendance()" style="padding:4px 11px;border-radius:7px;border:1.5px solid var(--border);background:var(--surface2);color:var(--accent);font-size:11px;font-weight:700;cursor:pointer">&#11015; Export CSV</button>'
      +'<span style="font-family:\'JetBrains Mono\',monospace;font-size:11px;color:var(--muted)">'+list.length+' entries</span>'
    +'</div>'
    +'<div style="padding:10px 16px;border-bottom:1px solid var(--border);background:var(--surface2)">'      +(attTab==='student'?(function(){        var batches=['All'].concat(typeof getClassNames==='function'?getClassNames():[]);        return '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">'          +'<span style="font-size:11px;font-weight:700;color:var(--muted);font-family:\'JetBrains Mono\',monospace;letter-spacing:.05em;text-transform:uppercase;margin-right:4px">Batch:</span>'          +batches.map(function(b){            var isActive=(window._attBatchFilter||'All')===b;            return '<button onclick="window._attBatchFilter=\''+b+'\';render()" style="padding:4px 13px;border-radius:20px;border:1.5px solid '+(isActive?'var(--accent)':'var(--border)')+';cursor:pointer;font-size:11.5px;font-weight:700;font-family:\'Nunito\',sans-serif;background:'+(isActive?'var(--accent)':'var(--surface)')+';color:'+(isActive?'#fff':'var(--muted)')+';transition:all .15s">'+esc(b)+'</button>';          }).join('')        +'</div>';      })():'')    +'</div>'    +'<div style="max-height:560px;overflow-y:auto">'+rows+'</div>'    +'</div>'    + renderTeacherLeaderboard();
}
function renderTeacherLeaderboard(){
  
  var teachers=staff.filter(function(s){
    return (s.dept==='Teaching')||(s.role&&s.role.toLowerCase().includes('teacher'))||(s.role&&s.role.toLowerCase().includes('sir'))||(s.role&&s.role.toLowerCase().includes('madam'));
  });
  if(!teachers.length){
    
    teachers=staff;
  }
  
  var allDates={};
  Object.keys(attendance).forEach(function(k){
    var m=k.match(/^(\d{4}-\d{2}-\d{2})-S-/);
    if(m) allDates[m[1]]=true;
  });
  var dates=Object.keys(allDates).sort();
  var totalDays=dates.length||1;
  
  var stats=teachers.map(function(t){
    var present=0,late=0,absent=0,earlyDep=0;
    dates.forEach(function(d){
      var v=attendance[d+'-S-'+t.id]||'';
      if(v==='P')present++;
      else if(v==='L'){present++;late++;}
      else if(v==='ED'){present++;earlyDep++;}
      else if(v==='A')absent++;
    });
    
    var periodsConducted=0;
    var pa=loadPAtt&&loadPAtt();
    if(pa){
      Object.keys(pa).forEach(function(k){
        if(pa[k]&&pa[k].status==='P'){
          
          var parts=k.split('|');
          if(parts.length>=3){
            var periods=loadTTPeriods&&loadTTPeriods();
            if(periods){
              var per=periods.find(function(p){return p.id===parts[1];});
              if(per){var cell=per[parts[2]]||{};if((cell.teacher||'').toLowerCase().includes(t.name.split(' ')[0].toLowerCase()))periodsConducted++;}
            }
          }
        }
      });
    }
    var attRate=totalDays>0?Math.round((present/totalDays)*100):0;
    var score=attRate+(periodsConducted*2)-(late*3)-(earlyDep*2)-(absent*5);
    return {t:t,present:present,late:late,absent:absent,earlyDep:earlyDep,attRate:attRate,periodsConducted:periodsConducted,score:score,totalDays:totalDays};
  });
  
  stats.sort(function(a,b){return b.score-a.score;});
  
  var medals=['🥇','🥈','🥉'];
  var rankColors=['#c9870a','#64748b','#a05a2c'];
  
  var rows=stats.map(function(s,i){
    var medal=i<3?medals[i]:'#'+(i+1);
    var rankCol=i<3?rankColors[i]:'var(--muted)';
    var attCol=s.attRate>=90?'#16a34a':s.attRate>=75?'#d97706':'#dc2626';
    var attBg=s.attRate>=90?'#dcfce7':s.attRate>=75?'#fef9c3':'#fee2e2';
    var concern=s.attRate<75||s.absent>totalDays*0.2||s.late>5;
    return '<tr style="'+(concern?'background:#fff8f0;':'')+(i===0?'background:linear-gradient(90deg,#fffaed,var(--surface));':'')+'transition:background .12s">'
      +'<td style="text-align:center;font-size:'+(i<3?'22px':'14px')+';font-weight:800;color:'+rankCol+';width:54px;font-family:\'JetBrains Mono\',monospace">'+medal+'</td>'
      +'<td><div style="display:flex;align-items:center;gap:10px">'+avatarHTML(s.t.name,30)
        +'<div><div style="font-weight:700;font-size:13px">'+esc(s.t.name)+'</div>'
        +'<div style="font-size:10.5px;color:var(--muted)">'+esc(s.t.role||s.t.dept||'')+'</div></div></div></td>'
      +'<td style="text-align:center">'
        +'<div style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;background:'+attBg+';color:'+attCol+';font-family:\'JetBrains Mono\',monospace">'+s.attRate+'%</div>'
        +'<div style="margin-top:4px;width:80px;height:5px;border-radius:3px;background:var(--surface3);overflow:hidden;display:inline-block;margin-left:6px;vertical-align:middle"><div style="height:100%;width:'+s.attRate+'%;background:'+attCol+';border-radius:3px;transition:width .5s ease"></div></div>'
      +'</td>'
      +'<td style="text-align:center;font-family:\'JetBrains Mono\',monospace;font-size:13px;font-weight:700;color:#16a34a">'+s.present+'</td>'
      +'<td style="text-align:center;font-family:\'JetBrains Mono\',monospace;font-size:13px;font-weight:700;color:#dc2626">'+s.absent+'</td>'
      +'<td style="text-align:center;font-family:\'JetBrains Mono\',monospace;font-size:13px;font-weight:700;color:#ca8a04">'+s.late+'</td>'
      +'<td style="text-align:center;font-family:\'JetBrains Mono\',monospace;font-size:13px;font-weight:700;color:#7c3aed">'+s.periodsConducted+'</td>'
      +'<td style="text-align:center">'
        +(concern
          ?'<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:10.5px;font-weight:700;background:#fef3dc;color:#c9870a;border:1px solid #fde68a">⚠ Concern</span>'
          :'<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:10.5px;font-weight:700;background:#dcfce7;color:#16a34a;border:1px solid #86efac">✓ Good</span>')
      +'</td>'
      +'<td style="text-align:center;font-family:\'JetBrains Mono\',monospace;font-size:13px;font-weight:800;color:'+(s.score>=80?'#16a34a':s.score>=50?'#d97706':'#dc2626')+'">'+Math.max(0,s.score)+'</td>'
    +'</tr>';
  }).join('');
  
  var concernTeachers=stats.filter(function(s){return s.attRate<75||s.absent>totalDays*0.2||s.late>5;});
  var concernBanner='';
  if(concernTeachers.length){
    concernBanner='<div style="background:linear-gradient(135deg,#fff8f0,#fef3dc);border:1.5px solid #fde68a;border-radius:var(--radius);padding:14px 20px;margin-bottom:18px;display:flex;align-items:center;gap:14px">'
      +'<div style="font-size:28px;flex-shrink:0">⚠️</div>'
      +'<div><div style="font-weight:700;font-size:13px;color:#92400e;margin-bottom:4px">'+concernTeachers.length+' Teacher'+(concernTeachers.length>1?'s':'')+' Flagged as "Concern"</div>'
      +'<div style="font-size:12px;color:#a16207;line-height:1.6">'
      +concernTeachers.map(function(s){return'<span style="display:inline-flex;align-items:center;gap:5px;margin-right:12px">'+esc(s.t.name.split(' ')[0])+': <b>'+s.attRate+'%</b> att. · <b>'+s.absent+'</b> absent</span>';}).join('')
      +'</div></div>'
      +'</div>';
  }
  var summary='';
  if(dates.length){
    summary='<div style="font-size:11px;color:var(--muted);font-family:\'JetBrains Mono\',monospace;margin-bottom:4px">Based on <b style="color:var(--accent)">'+dates.length+' recorded day(s)</b> of attendance</div>';
  } else {
    summary='<div style="font-size:11px;color:var(--muted);font-family:\'JetBrains Mono\',monospace;margin-bottom:4px">No attendance recorded yet -- mark attendance above to see live rankings.</div>';
  }
  return '<div style="margin-top:28px">'
    +'<div style="font-family:\'JetBrains Mono\',monospace;font-size:10px;color:var(--muted);letter-spacing:.16em;text-transform:uppercase;margin-bottom:8px">📊 Performance Ranking</div>'
    +'<div class="card">'
    +'<div class="card-head" style="background:linear-gradient(135deg,#0b1e6e,#1433a8)">'
    +'<div style="display:flex;align-items:center;gap:12px;flex:1">'
    +'<span style="font-size:28px">🏆</span>'
    +'<div><div style="font-family:\'Playfair Display\',serif;font-size:18px;font-weight:700;color:#fff">Concern Teacher Leaderboard</div>'
    +'<div style="font-size:11px;color:rgba(255,255,255,.7);margin-top:2px">Ranked by attendance rate · punctuality · periods conducted</div>'
    +'</div></div>'
    +'<span style="font-family:\'JetBrains Mono\',monospace;font-size:11px;color:rgba(255,255,255,.6)">'+teachers.length+' teacher(s)</span>'
    +'</div>'
    +'<div style="padding:14px 20px 6px">'
    +summary
    +concernBanner
    +'</div>'
    +'<div style="overflow-x:auto"><table><thead><tr>'
    +'<th style="text-align:center;width:54px">#</th>'
    +'<th>Teacher</th>'
    +'<th style="text-align:center">Att. Rate</th>'
    +'<th style="text-align:center">Present</th>'
    +'<th style="text-align:center">Absent</th>'
    +'<th style="text-align:center">Late</th>'
    +'<th style="text-align:center">Periods</th>'
    +'<th style="text-align:center">Status</th>'
    +'<th style="text-align:center">Score</th>'
    +'</tr></thead>'
    +'<tbody>'+(rows||'<tr><td colspan="9" style="text-align:center;padding:32px;color:var(--muted)">No teaching staff found. Add teachers in the Staff module and mark attendance above.</td></tr>')+'</tbody>'
    +'</table></div>'
    +'<div style="padding:12px 20px;background:var(--surface2);border-top:1px solid var(--border-soft);font-size:11px;color:var(--muted);display:flex;gap:20px;flex-wrap:wrap;font-family:\'JetBrains Mono\',monospace">'
    +'<span>Score = AttRate + (Periods×2) − (Late×3) − (EarlyDep×2) − (Absent×5)</span>'
    +'<span style="color:#dc2626">⚠ Concern: Att. &lt;75% or &gt;20% absences or &gt;5 lates</span>'
    +'</div>'
    +'</div>'
    +'</div>';
}
function attCycle(type,id){
  var key=attDate+'-'+type+'-'+id;
  var cur=attendance[key]||'';
  var next=attStatusCycle(cur);
  if(next)attendance[key]=next;
  else{
    delete attendance[key];
    delete attendance[attDate+'-'+type+'x-'+id];
    delete attendance[attDate+'-'+type+'d-'+id];
  }

  /* ── INSTANT PUSH: write directly to the correct Supabase table ── */
  if(type==='S'){
    /* Staff attendance → attendance_staff table */
    if(next){
      _gnsiInstantPush('attendance_staff', {
        staff_id:  id,
        att_date:  attDate,
        status:    next,
        marked_by: (typeof currentUser!=='undefined'&&currentUser)?currentUser.name:''
      }, { onConflict: 'staff_id,att_date' });
    } else {
      /* Cleared — delete the row */
      if(_supa) _supa.from('attendance_staff').delete()
        .eq('staff_id', id).eq('att_date', attDate).then(function(){}).catch(function(){});
    }
  } else if(type==='T'){
    /* Student attendance → student_attendance table */
    if(next){
      _gnsiInstantPush('student_attendance', {
        student_id: id,
        att_date:   attDate,
        status:     next,
        marked_by:  (typeof currentUser!=='undefined'&&currentUser)?currentUser.name:''
      }, { onConflict: 'student_id,att_date' });
    } else {
      if(_supa) _supa.from('student_attendance').delete()
        .eq('student_id', id).eq('att_date', attDate).then(function(){}).catch(function(){});
    }
  }

  /* Also push to KV for attendance page display (flat object) */
  if(typeof gnsiKVPush==='function') gnsiKVPush('ims_att', attendance);

  /* Audit log */
  var _today=new Date().toISOString().split('T')[0];
  var _isPast=attDate<_today;
  var _m=type==='S'?staff.find(function(s){return s.id===id;}):students.find(function(s){return s.id===id;});
  if(typeof acLog==='function'){
    var _attDetail=(_m?_m.name:'ID:'+id)+' '+attDate+' → '+(next||'Cleared')+' ('+(type==='S'?'Staff':'Student')+')';
    acLog('Attendance'+(_isPast?' [BACKDATED]':''), _attDetail);
    gnsiActivity('Attendance Marked', _attDetail, 'attendance');
  }

  var row=document.getElementById('attrow-'+type+'-'+id);
  if(row){
    var sc=document.getElementById('content');
    var scrollTop=sc?sc.scrollTop:0;
    render();
    if(sc)sc.scrollTop=scrollTop;
  }else{render();}
}
function attSetTime(typeKey,id,val){
  var k=attDate+'-'+typeKey+'-'+id;
  if(val)attendance[k]=val;else delete attendance[k];
  /* Push time update to Supabase attendance table */
  var _table = typeKey.startsWith('S')||typeKey==='Sx'||typeKey==='Sd' ? 'attendance_staff' : 'student_attendance';
  var _idCol  = _table==='attendance_staff' ? 'staff_id' : 'student_id';
  if(_supa){
    var _row = {att_date:attDate};
    _row[_idCol] = id;
    if(typeKey.endsWith('x')) _row.arr_time = val||null;
    else if(typeKey.endsWith('d')) _row.dep_time = val||null;
    _supa.from(_table).upsert(_row,{onConflict:_idCol+',att_date'}).then(function(){setSyncStatus('synced');}).catch(function(){setSyncStatus('error');});
  }
}
function markAll2(v){
  var type=attTab==='staff'?'S':'T';
  var list=attTab==='staff'?staff:students;
  list.forEach(function(s){attendance[attDate+'-'+type+'-'+s.id]=v;});
  /* Bulk upsert to Supabase */
  var _table = type==='S' ? 'attendance_staff' : 'student_attendance';
  var _idCol  = type==='S' ? 'staff_id' : 'student_id';
  if(_supa){
    var _rows = list.map(function(s){
      var r={att_date:attDate,status:v}; r[_idCol]=s.id; return r;
    });
    var _chunk=50;
    for(var _i=0;_i<_rows.length;_i+=_chunk){
      _supa.from(_table).upsert(_rows.slice(_i,_i+_chunk),{onConflict:_idCol+',att_date'}).catch(function(){});
    }
    setSyncStatus('syncing');
  }
  render();
}
function clearAll2(){
  var type=attTab==='staff'?'S':'T';
  var list=attTab==='staff'?staff:students;
  list.forEach(function(s){
    delete attendance[attDate+'-'+type+'-'+s.id];
    delete attendance[attDate+'-'+type+'x-'+s.id];
    delete attendance[attDate+'-'+type+'d-'+s.id];
  });
  /* Bulk delete from Supabase */
  var _table = type==='S' ? 'attendance_staff' : 'student_attendance';
  var _idCol  = type==='S' ? 'staff_id' : 'student_id';
  var _ids = list.map(function(s){return s.id;});
  if(_supa && _ids.length){
    _supa.from(_table).delete().in(_idCol,_ids).eq('att_date',attDate)
      .then(function(){setSyncStatus('synced');}).catch(function(){setSyncStatus('error');});
  }
  render();
}
// Keep old markAtt & markAll for dashboard compatibility
function markAtt(type,id){attCycle(type,id)}
function markAll(type,v){
  var list=type==='S'?staff:students;
  list.forEach(function(s){attendance[attDate+'-'+type+'-'+s.id]=v;});
  var _table = type==='S' ? 'attendance_staff' : 'student_attendance';
  var _idCol  = type==='S' ? 'staff_id' : 'student_id';
  if(_supa){
    var _rows=list.map(function(s){var r={att_date:attDate,status:v};r[_idCol]=s.id;return r;});
    for(var _i=0;_i<_rows.length;_i+=50){
      _supa.from(_table).upsert(_rows.slice(_i,_i+50),{onConflict:_idCol+',att_date'}).catch(function(){});
    }
  }
  render();
}
// -- NOTICES ---------------------------------------------------
