/* GNSI PORTAL — modules/leave.js
   Pages: leave, substitute
   DEPENDS ON: core/utils.js, core/state.js */

function renderLeave(){
  if(!currentUser)return'';
  var isAdm=currentUser.role==='admin'||currentUser.role==='manager';
  var leaves=gnsiLeaves();
  var myLeaves=leaves.filter(function(l){return l.staffId===currentUser.id;});
  var pendingLeaves=leaves.filter(function(l){return l.status==='Pending';});
  var formHTML='';
  if(_leaveShowForm){
    formHTML='<div class="form-panel"><div class="form-title">Apply for Leave</div>'
      +'<div class="form-grid g23">'
      +'<div class="form-group"><label>Leave Type *</label><select id="lv-type"><option>Casual Leave</option><option>Medical Leave</option><option>Emergency Leave</option><option>Earned Leave</option><option>Other</option></select></div>'
      +'<div class="form-group"><label>From Date *</label><input type="date" id="lv-from" value="'+gnsiToday()+'"/></div>'
      +'<div class="form-group"><label>To Date *</label><input type="date" id="lv-to" value="'+gnsiToday()+'"/></div>'
      +'<div class="form-group g3"><label>Reason *</label><textarea id="lv-reason" rows="2" placeholder="Brief reason for leave..." style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:9px;font-size:14px;font-family:\'DM Sans\',sans-serif;resize:vertical"></textarea></div>'
      +'</div>'
      +'<div style="display:flex;gap:10px;margin-top:12px">'
      +'<button class="btn btn-primary" onclick="gnsiSubmitLeave()">Submit Application</button>'
      +'<button class="btn btn-outline" onclick="_leaveShowForm=false;render()">Cancel</button>'
      +'</div></div>';
  }
  var myRows=myLeaves.length?myLeaves.map(function(l){
    var sCol=l.status==='Approved'?'#16a34a':l.status==='Rejected'?'#c0291d':'#d4a853';
    var days=Math.max(1,Math.round((new Date(l.to)-new Date(l.from))/(86400000))+1);
    return '<tr><td>'+esc(l.type)+'</td><td>'+l.from+'</td><td>'+l.to+'</td><td>'+days+' day'+(days>1?'s':'')+'</td>'
      +'<td><span style="color:'+sCol+';font-weight:700;font-size:12px">'+l.status+'</span></td>'
      +'<td style="font-size:12px;color:var(--muted)">'+esc(l.remark||'--')+'</td></tr>';
  }).join(''):'<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:24px">No leave applications yet</td></tr>';
  var adminHTML='';
  if(isAdm&&pendingLeaves.length){
    var pendRows=pendingLeaves.map(function(l){
      var member=staff.find(function(s){return s.id===l.staffId;})||{name:'Unknown'};
      var days=Math.max(1,Math.round((new Date(l.to)-new Date(l.from))/(86400000))+1);
      return '<tr><td><b>'+esc(member.name)+'</b><br><span style="font-size:11px;color:var(--muted)">'+esc(member.role||'')+'</span></td>'
        +'<td>'+esc(l.type)+'</td><td>'+l.from+' to '+l.to+'</td><td>'+days+'d</td>'
        +'<td style="font-size:12px">'+esc(l.reason)+'</td>'
        +'<td style="white-space:nowrap">'
        +'<button onclick="gnsiLeaveDecision('+l.id+',\'Approved\')" style="background:#dcfce7;color:#16a34a;border:1px solid #86efac;border-radius:6px;padding:3px 10px;cursor:pointer;font-weight:700;font-size:11px;margin-right:4px;font-family:\'DM Sans\',sans-serif">Approve</button>'
        +'<button onclick="gnsiLeaveDecision('+l.id+',\'Rejected\')" style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;border-radius:6px;padding:3px 10px;cursor:pointer;font-weight:700;font-size:11px;font-family:\'DM Sans\',sans-serif">Reject</button>'
        +'</td></tr>';
    }).join('');
    adminHTML='<div class="card" style="margin-bottom:20px"><div class="card-head" style="background:#fffbeb"><span class="card-title" style="color:#d4a853">⏳ Pending Approvals ('+pendingLeaves.length+')</span></div>'
      +'<div style="overflow-x:auto"><table><thead><tr><th>Staff</th><th>Type</th><th>Dates</th><th>Days</th><th>Reason</th><th>Action</th></tr></thead><tbody>'+pendRows+'</tbody></table></div></div>';
  }
  var balHTML='<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px">'
    +[{t:'Casual',max:12},{t:'Medical',max:10},{t:'Earned',max:15}].map(function(lt){
      var used=myLeaves.filter(function(l){return l.type===lt.t+' Leave'&&l.status==='Approved';})
        .reduce(function(s,l){return s+Math.max(1,Math.round((new Date(l.to)-new Date(l.from))/(86400000))+1);},0);
      var rem=lt.max-used;
      return '<div style="background:var(--surface2);border-radius:10px;padding:12px 18px;min-width:120px;border:1px solid var(--border)">'
        +'<div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;font-family:\'JetBrains Mono\',monospace">'+lt.t+'</div>'
        +'<div style="font-size:24px;font-weight:800;color:'+(rem>3?'#16a34a':'#c0291d')+';font-family:\'Cormorant Garamond\',serif">'+rem+'</div>'
        +'<div style="font-size:11px;color:var(--muted)">of '+lt.max+' remaining</div></div>';
    }).join('')+'</div>';
  return formHTML+adminHTML+balHTML
    +'<div class="card"><div class="card-head"><span class="card-title">📋 My Leave Applications</span>'
    +'<button class="btn btn-primary" onclick="_leaveShowForm=!_leaveShowForm;render()">+ Apply for Leave</button>'
    +'</div><div style="overflow-x:auto"><table><thead><tr><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Status</th><th>Remark</th></tr></thead><tbody>'+myRows+'</tbody></table></div></div>';
}
function gnsiSubmitLeave(){
  var type=(document.getElementById('lv-type')||{}).value||'';
  var from=(document.getElementById('lv-from')||{}).value||'';
  var to=(document.getElementById('lv-to')||{}).value||'';
  var reason=((document.getElementById('lv-reason')||{}).value||'').trim();
  if(!from||!to||!reason){alert('Please fill all fields.');return;}
  if(from>to){alert('From date must be before To date.');return;}
  var leaves=gnsiLeaves();
  leaves.push({id:gnsiNextId(leaves),staffId:currentUser.id,staffName:currentUser.name,type:type,from:from,to:to,reason:reason,status:'Pending',appliedAt:new Date().toISOString(),remark:''});
  gnsiSaveLeaves(leaves);
  gnsiActivity('Leave Applied', currentUser.name+' — '+type+' '+from+' to '+to, 'leave');
  if(typeof acLog==='function')acLog('Leave Applied',currentUser.name+' -- '+type+' '+from+' to '+to);
  _leaveShowForm=false;render();showToast('Leave application submitted','#d4a853');
}
function gnsiLeaveDecision(id,status){
  if(!currentUser||(['admin','manager'].indexOf(currentUser.role)<0)){
    if(typeof showToast==='function')showToast('🔒 Only admin/manager can approve leave','#dc2626');
    return;
  }
  var remark=status==='Rejected'?prompt('Reason for rejection:',''):'';
  var leaves=gnsiLeaves();
  var idx=leaves.findIndex(function(l){return l.id===id;});
  if(idx<0)return;
  leaves[idx].status=status;
  leaves[idx].remark=remark||'';
  leaves[idx].decidedAt=new Date().toISOString();
  leaves[idx].decidedBy=currentUser.name;
  gnsiSaveLeaves(leaves);
  if(typeof acLog==='function')acLog('Leave '+status,leaves[idx].staffName+' -- '+leaves[idx].type);
  showToast('Leave '+status.toLowerCase(),'#16a34a');render();
}
/* ══════════════════════════════════════════════════════════════
   2. SUBSTITUTE TEACHER ROSTER
══════════════════════════════════════════════════════════════ */
function gnsiSubs(){return gnsiLoad('gnsi_subs')||[];}
function gnsiSaveSubs(d){gnsiSave('gnsi_subs',d);}
var _subShowForm=false;
function renderSubstitute(){
  var subs=gnsiSubs();
  var todaySubs=subs.filter(function(s){return s.date===gnsiToday();});
  var teachers=staff.filter(function(s){return s.dept==='Teaching'||( s.role&&s.role.toLowerCase().includes('teacher'));});
  var isAdm=currentUser&&(currentUser.role==='admin'||currentUser.role==='manager');
  var formHTML='';
  if(_subShowForm&&isAdm){
    formHTML='<div class="form-panel"><div class="form-title">Assign Substitute</div>'
      +'<div class="form-grid g23">'
      +'<div class="form-group"><label>Date *</label><input type="date" id="sub-date" value="'+gnsiToday()+'"/></div>'
      +'<div class="form-group"><label>Absent Teacher *</label><select id="sub-absent">'+teachers.map(function(t){return'<option value="'+t.id+'">'+esc(t.name)+'</option>';}).join('')+'</select></div>'
      +'<div class="form-group"><label>Substitute Teacher *</label><select id="sub-sub">'+teachers.map(function(t){return'<option value="'+t.id+'">'+esc(t.name)+'</option>';}).join('')+'</select></div>'
      +'<div class="form-group"><label>Period / Subject</label><input id="sub-period" placeholder="e.g. Period 3 -- Mathematics"/></div>'
      +'<div class="form-group g3"><label>Note</label><input id="sub-note" placeholder="Optional note"/></div>'
      +'</div>'
      +'<div style="display:flex;gap:10px;margin-top:12px"><button class="btn btn-primary" onclick="gnsiAddSub()">Assign</button><button class="btn btn-outline" onclick="_subShowForm=false;render()">Cancel</button></div></div>';
  }
  var rows=todaySubs.length?todaySubs.map(function(s){
    return '<tr><td>'+esc(s.absentName)+'</td><td>'+esc(s.subName)+'</td><td>'+esc(s.period||'--')+'</td><td style="font-size:12px;color:var(--muted)">'+esc(s.note||'--')+'</td>'
      +(isAdm?'<td><button onclick="gnsiDelSub('+parseInt(s.id,10)+')" style="color:#dc2626;background:none;border:none;cursor:pointer;font-size:12px">Remove</button></td>':'')
      +'</tr>';
  }).join(''):'<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:24px">No substitutes assigned for today</td></tr>';
  return formHTML+'<div class="card"><div class="card-head"><span class="card-title">📋 Substitute Assignments -- '+gnsiToday()+'</span>'
    +(isAdm?'<button class="btn btn-primary" onclick="_subShowForm=!_subShowForm;render()">+ Assign Substitute</button>':'')
    +'</div><div style="overflow-x:auto"><table><thead><tr><th>Absent Teacher</th><th>Substitute</th><th>Period / Subject</th><th>Note</th>'+(isAdm?'<th></th>':'')+'</tr></thead><tbody>'+rows+'</tbody></table></div></div>';
}
function gnsiAddSub(){
  var date=(document.getElementById('sub-date')||{}).value||gnsiToday();
  var abId=parseInt((document.getElementById('sub-absent')||{}).value||0);
  var subId=parseInt((document.getElementById('sub-sub')||{}).value||0);
  var period=((document.getElementById('sub-period')||{}).value||'').trim();
  var note=((document.getElementById('sub-note')||{}).value||'').trim();
  var abMem=staff.find(function(s){return s.id===abId;})||{name:'?'};
  var subMem=staff.find(function(s){return s.id===subId;})||{name:'?'};
  var subs=gnsiSubs();
  subs.push({id:gnsiNextId(subs),date:date,absentId:abId,absentName:abMem.name,subId:subId,subName:subMem.name,period:period,note:note,by:currentUser.name});
  gnsiSaveSubs(subs);_subShowForm=false;render();showToast('Substitute assigned','#16a34a');
}
function gnsiDelSub(id){
  var subs=gnsiSubs().filter(function(s){return s.id!==id;});gnsiSaveSubs(subs);render();
}
/* ══════════════════════════════════════════════════════════════
   3. AUTO-GENERATED REPORT CARDS
══════════════════════════════════════════════════════════════ */
var _rcFilterClass='',_rcFilterExam='';
function _gnsiReportCardFeeCheck(stuId){
  /* FIX #12: Check if student has fee dues before printing report card */
  try{
    var cols=(typeof _fmcLoadCols==='function')?_fmcLoadCols():[];
    var asgns=(typeof _fmcLoadAsgns==='function')?_fmcLoadAsgns():[];
    var asgn=asgns.find(function(a){return String(a.stuId)===String(stuId);});
    if(!asgn) return null;
    var stuCols=cols.filter(function(c){return c.asgnId===asgn.id;});
    var totalPaid=stuCols.reduce(function(s,c){return s+(parseInt(c.amountPaid)||0);},0);
    var m=typeof _fmcMonthsSince==='function'?_fmcMonthsSince(asgn.billingStartAt||asgn.enrolledAt):0;
    var exp=0; for(var i=1;i<=m;i++) exp+=(typeof _fmcCalcFee==='function'?_fmcCalcFee(asgn,i).total:0);
    var balance=Math.max(0,exp-totalPaid);
    return {balance:balance,hasDues:balance>500}; /* >500 threshold to ignore rounding */
  }catch(e){return null;}
}
