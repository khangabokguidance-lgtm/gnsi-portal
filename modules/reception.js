/* GNSI PORTAL — modules/reception.js
   Pages: reception (visitors, phone log, enquiries, appointments, parcels, items, dashboard)
   DEPENDS ON: core/utils.js, core/state.js */

function renderReception(){
  var tabs=[
    {id:'visitors',label:'Visitor Log',icon:'👥'},
    {id:'phonelog',label:'Phone Log',icon:'📞'},
    {id:'enquiries',label:'Enquiries',icon:'❓'},
    {id:'appointments',label:'Appointments',icon:'📅'},
    {id:'parcels',label:'Parcel & Courier',icon:'📦'},
    {id:'items',label:'Items from Parents',icon:'🎒'},
    {id:'rcdashboard',label:'Daily Summary',icon:'📊'}
  ];
  var tabBar=tabs.map(function(t){
    var active=t.id===receptionTab;
    return '<button onclick="setReceptionTab(\''+t.id+'\')" style="padding:8px 14px;border-radius:8px;border:'+(active?'none':'1.5px solid var(--border)')+';cursor:pointer;font-size:12.5px;font-weight:'+(active?'700':'600')+';background:'+(active?'var(--accent)':'var(--surface)')+';color:'+(active?'#fff':'var(--muted)')+';white-space:nowrap;transition:all .15s">'+t.icon+' '+t.label+'</button>';
  }).join('');
  var body='';
  if(receptionTab==='visitors')    body=renderRcVisitors();
  if(receptionTab==='phonelog')    body=renderRcPhoneLog();
  if(receptionTab==='enquiries')   body=renderRcEnquiries();
  if(receptionTab==='appointments')body=renderRcAppointments();
  if(receptionTab==='parcels')     body=renderRcParcels();
  if(receptionTab==='items')       body=renderRcItems();
  if(receptionTab==='rcdashboard') body=renderRcDashboard();
  return '<div class="page-header"><div class="page-header-eyebrow">Front Desk</div><div class="page-header-title">Reception Management</div><div class="page-header-sub">Visitors · Phone · Enquiries · Appointments · Parcels · Items · Daily Summary</div></div>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;padding:4px 0">'+tabBar+'</div>'
    +body;
}
function renderRcVisitors(){
  var data=rcLoad('visitors');
  var isAdmin=currentUser&&(currentUser.role==='admin'||currentUser.role==='manager');
  var purposes=['Parent Visit','Guardian Visit','Official Business','Delivery','Inspection','Interview','Other'];
  var formHtml='<div class="card" style="margin-bottom:18px"><div class="card-head"><span class="card-title">➕ Register New Visitor</span></div>'
    +'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;padding:4px 0">'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Visitor Name</label><input id="rc-vs-name" placeholder="Full name" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Contact / Phone</label><input id="rc-vs-phone" placeholder="Phone number" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Purpose</label><select id="rc-vs-purpose" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)">'+purposes.map(function(p){return '<option>'+p+'</option>';}).join('')+'</select></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Whom to Meet</label><input id="rc-vs-meet" placeholder="Staff / Student name" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">ID Proof Type</label><select id="rc-vs-id" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"><option>Aadhaar</option><option>Voter ID</option><option>Driving Licence</option><option>Passport</option><option>Other</option></select></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">ID Number</label><input id="rc-vs-idno" placeholder="Last 4 digits or ref" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'</div><div style="margin-top:14px;display:flex;gap:10px"><button class="btn btn-primary" onclick="rcAddVisitor()">Check In</button></div></div>';
  var rows=data.length?data.slice().reverse().map(function(r){
    return '<tr>'
      +'<td>'+hmFmt(r.date)+' '+esc(r.inTime||'')+'</td>'
      +'<td><b>'+esc(r.name||'--')+'</b><br><span style="font-size:11px;color:var(--muted)">'+esc(maskPhone(r.phone)||'')+'</span></td>'
      +'<td>'+esc(r.purpose||'--')+'</td>'
      +'<td>'+esc(r.meetingPerson||'--')+'</td>'
      +'<td>'+esc(r.idType||'--')+' ****'+esc(r.idNumber||'')+'</td>'
      +'<td>'+esc(r.outTime||'--')+'</td>'
      +'<td>'+hmStatusBadge(r.status||'In')+'</td>'
      +'<td style="white-space:nowrap">'
      +(r.status==='In'?'<button onclick="rcVisitorOut('+parseInt(r.id,10)+')" class="btn-sm-green" style="margin-right:4px">✓ Check Out</button>':'')
      +(isAdmin?'<button onclick="rcDelVisitor('+parseInt(r.id,10)+')" class="btn-danger-sm">🗑</button>':'')
      +'</td>'
      +'</tr>';
  }).join(''):'<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:32px">No visitor records today.</td></tr>';
  var inside=data.filter(function(r){return r.status==='In';}).length;
  return formHtml
    +'<div class="card"><div class="card-head"><span class="card-title">👥 Visitor Register</span>'
    +'<span style="font-size:11px;color:var(--muted);font-family:monospace">Inside: <b style="color:#3b78c9">'+inside+'</b> | Total: '+data.length+'</span></div>'
    +'<div style="overflow-x:auto"><table><thead><tr><th>Date & In Time</th><th>Visitor</th><th>Purpose</th><th>Meeting</th><th>ID Proof</th><th>Out Time</th><th>Status</th><th>Action</th></tr></thead>'
    +'<tbody>'+rows+'</tbody></table></div></div>';
}
function rcAddVisitor(){
  var name=document.getElementById('rc-vs-name').value.trim();
  var phone=document.getElementById('rc-vs-phone').value.trim();
  var purpose=document.getElementById('rc-vs-purpose').value;
  var meetingPerson=document.getElementById('rc-vs-meet').value.trim();
  var idType=document.getElementById('rc-vs-id').value;
  var idNumber=document.getElementById('rc-vs-idno').value.trim();
  if(!name){alert('Enter visitor name.');return;}
  var data=rcLoad('visitors');
  data.push({id:rcNextId(data),name:name,phone:phone,purpose:purpose,meetingPerson:meetingPerson,idType:idType,idNumber:idNumber,date:hmDate(),inTime:rcFmtTime(),status:'In',loggedBy:currentUser?currentUser.name:'--'});
  rcSave('visitors',data);render();
}
function rcVisitorOut(id){
  var data=rcLoad('visitors');
  data=data.map(function(r){return r.id==id?Object.assign({},r,{status:'Out',outTime:rcFmtTime()}):r;});
  rcSave('visitors',data);render();
}
function rcDelVisitor(id){
  if(!confirm('Delete visitor record?'))return;
  var data=rcLoad('visitors').filter(function(r){return r.id!=id;});
  rcSave('visitors',data);render();
}
function renderRcPhoneLog(){
  var data=rcLoad('phonelog');
  var isAdmin=currentUser&&(currentUser.role==='admin'||currentUser.role==='manager');
  var formHtml='<div class="card" style="margin-bottom:18px"><div class="card-head"><span class="card-title">➕ Log Phone Call</span></div>'
    +'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;padding:4px 0">'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Caller Name</label><input id="rc-ph-caller" placeholder="Name of caller" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Caller Number</label><input id="rc-ph-number" placeholder="Phone / Mobile" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Call Type</label><select id="rc-ph-type" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"><option>Incoming</option><option>Outgoing</option><option>Missed</option></select></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Regarding</label><input id="rc-ph-regarding" placeholder="Admission, Fee, Student, etc." style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Message / Action</label><input id="rc-ph-msg" placeholder="Brief message or action taken" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Follow-up Required?</label><select id="rc-ph-followup" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"><option>No</option><option>Yes</option></select></div>'
    +'</div><div style="margin-top:14px"><button class="btn btn-primary" onclick="rcAddPhoneLog()">Save Log</button></div></div>';
  var callIcons={Incoming:'📲',Outgoing:'📤',Missed:'📵'};
  var rows=data.length?data.slice().reverse().map(function(r){
    return '<tr>'
      +'<td>'+hmFmt(r.date)+' '+esc(r.time||'')+'</td>'
      +'<td>'+esc(callIcons[r.callType]||'📞')+' '+hmStatusBadge(r.callType||'Incoming')+'</td>'
      +'<td><b>'+esc(r.callerName||'--')+'</b><br><span style="font-size:11px;color:var(--muted)">'+esc(r.callerNumber||'')+'</span></td>'
      +'<td>'+esc(r.regarding||'--')+'</td>'
      +'<td style="max-width:200px;white-space:normal;word-break:break-word">'+esc(r.message||'--')+'</td>'
      +'<td>'+hmStatusBadge(r.followUp==='Yes'?'Pending':'Closed')+'</td>'
      +'<td>'+esc(r.loggedBy||'--')+'</td>'
      +(isAdmin?'<td><button onclick="rcDelPhoneLog('+parseInt(r.id,10)+')" class="btn-danger-sm">🗑</button></td>':'')
      +'</tr>';
  }).join(''):'<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:32px">No phone log entries.</td></tr>';
  return formHtml
    +'<div class="card"><div class="card-head"><span class="card-title">📞 Phone Log</span><span style="font-size:11px;color:var(--muted);font-family:monospace">'+data.length+' entries</span></div>'
    +'<div style="overflow-x:auto"><table><thead><tr><th>Date & Time</th><th>Type</th><th>Caller</th><th>Regarding</th><th>Message / Action</th><th>Follow-up</th><th>Logged By</th>'+(isAdmin?'<th>Action</th>':'')+'</tr></thead>'
    +'<tbody>'+rows+'</tbody></table></div></div>';
}
function rcAddPhoneLog(){
  var callerName=document.getElementById('rc-ph-caller').value.trim();
  var callerNumber=document.getElementById('rc-ph-number').value.trim();
  var callType=document.getElementById('rc-ph-type').value;
  var regarding=document.getElementById('rc-ph-regarding').value.trim();
  var message=document.getElementById('rc-ph-msg').value.trim();
  var followUp=document.getElementById('rc-ph-followup').value;
  var data=rcLoad('phonelog');
  data.push({id:rcNextId(data),callerName:callerName,callerNumber:callerNumber,callType:callType,regarding:regarding,message:message,followUp:followUp,date:hmDate(),time:rcFmtTime(),loggedBy:currentUser?currentUser.name:'--'});
  rcSave('phonelog',data);render();
}
function rcDelPhoneLog(id){
  if(!confirm('Delete this phone log?'))return;
  var data=rcLoad('phonelog').filter(function(r){return r.id!=id;});
  rcSave('phonelog',data);render();
}
function renderRcEnquiries(){
  var data=rcLoad('enquiries');
  var isAdmin=currentUser&&(currentUser.role==='admin'||currentUser.role==='manager');
  var courses=['Navodaya (New)','Navodaya (Old)','Combined (New)','Combined (Old)','Foundation V','Foundation IV','General'];
  var formHtml='<div class="card" style="margin-bottom:18px"><div class="card-head"><span class="card-title">➕ New Enquiry</span></div>'
    +'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;padding:4px 0">'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Parent / Guardian Name</label><input id="rc-eq-parent" placeholder="Name" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Student Name</label><input id="rc-eq-student" placeholder="Prospective student" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Contact Number</label><input id="rc-eq-phone" placeholder="Phone" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Course of Interest</label><select id="rc-eq-course" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)">'+courses.map(function(c){return '<option>'+c+'</option>';}).join('')+'</select></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Source</label><select id="rc-eq-source" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"><option>Walk-In</option><option>Phone</option><option>Referral</option><option>Social Media</option><option>Advertisement</option><option>Other</option></select></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Address</label><input id="rc-eq-addr" placeholder="Village / Town" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'<div style="grid-column:1/-1"><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Remarks / Info Given</label><input id="rc-eq-remarks" placeholder="What information was provided?" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'</div><div style="margin-top:14px"><button class="btn btn-primary" onclick="rcAddEnquiry()">Save Enquiry</button></div></div>';
  var rows=data.length?data.slice().reverse().map(function(r){
    return '<tr>'
      +'<td>'+hmFmt(r.date)+'</td>'
      +'<td><b>'+esc(r.parentName||'--')+'</b><br><span style="font-size:11px;color:var(--muted)">'+esc(maskPhone(r.phone)||'')+'</span></td>'
      +'<td>'+esc(r.studentName||'--')+'</td>'
      +'<td>'+esc(r.course||'--')+'</td>'
      +'<td>'+esc(r.source||'--')+'</td>'
      +'<td>'+esc(r.address||'--')+'</td>'
      +'<td style="max-width:200px;white-space:normal;word-break:break-word;font-size:11.5px">'+esc(r.remarks||'--')+'</td>'
      +'<td>'+hmStatusBadge(r.status||'New')+'</td>'
      +(isAdmin?'<td style="white-space:nowrap">'
        +(r.status==='New'?'<button onclick="rcFollowUpEnquiry('+parseInt(r.id,10)+')" class="btn-sm" style="margin-right:4px">Follow Up</button>':'')
        +(r.status!=='Enrolled'?'<button onclick="rcEnrollEnquiry('+parseInt(r.id,10)+')" class="btn-sm-green" style="margin-right:4px">Enrolled</button>':'')
        +'<button onclick="rcDelEnquiry('+parseInt(r.id,10)+')" class="btn-danger-sm">🗑</button>'
        +'</td>':'<td></td>')
      +'</tr>';
  }).join(''):'<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:32px">No enquiries recorded.</td></tr>';
  var newCount=data.filter(function(r){return r.status==='New';}).length;
  var enrollCount=data.filter(function(r){return r.status==='Enrolled';}).length;
  return formHtml
    +'<div class="card"><div class="card-head"><span class="card-title">❓ Enquiry Register</span>'
    +'<span style="font-size:11px;color:var(--muted);font-family:monospace">New: <b style="color:#3b78c9">'+newCount+'</b> | Enrolled: <b style="color:#16a34a">'+enrollCount+'</b> | Total: '+data.length+'</span></div>'
    +'<div style="overflow-x:auto"><table><thead><tr><th>Date</th><th>Parent</th><th>Student</th><th>Course</th><th>Source</th><th>Address</th><th>Remarks</th><th>Status</th><th>Action</th></tr></thead>'
    +'<tbody>'+rows+'</tbody></table></div></div>';
}
function rcAddEnquiry(){
  var parentName=document.getElementById('rc-eq-parent').value.trim();
  var studentName=document.getElementById('rc-eq-student').value.trim();
  var phone=document.getElementById('rc-eq-phone').value.trim();
  var course=document.getElementById('rc-eq-course').value;
  var source=document.getElementById('rc-eq-source').value;
  var address=document.getElementById('rc-eq-addr').value.trim();
  var remarks=document.getElementById('rc-eq-remarks').value.trim();
  if(!parentName&&!phone){alert('Enter at least parent name or phone.');return;}
  var data=rcLoad('enquiries');
  data.push({id:rcNextId(data),parentName:parentName,studentName:studentName,phone:phone,course:course,source:source,address:address,remarks:remarks,date:hmDate(),status:'New',loggedBy:currentUser?currentUser.name:'--'});
  rcSave('enquiries',data);render();
}
function rcFollowUpEnquiry(id){
  var data=rcLoad('enquiries');
  data=data.map(function(r){return r.id==id?Object.assign({},r,{status:'Follow-up',followUpDate:hmDate()}):r;});
  rcSave('enquiries',data);render();
}
function rcEnrollEnquiry(id){
  var data=rcLoad('enquiries');
  data=data.map(function(r){return r.id==id?Object.assign({},r,{status:'Enrolled',enrolledDate:hmDate()}):r;});
  rcSave('enquiries',data);render();
}
function rcDelEnquiry(id){
  if(!confirm('Delete enquiry record?'))return;
  var data=rcLoad('enquiries').filter(function(r){return r.id!=id;});
  rcSave('enquiries',data);render();
}
function renderRcAppointments(){
  var data=rcLoad('appointments');
  var isAdmin=currentUser&&(currentUser.role==='admin'||currentUser.role==='manager');
  var formHtml='<div class="card" style="margin-bottom:18px"><div class="card-head"><span class="card-title">➕ Book Appointment</span></div>'
    +'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;padding:4px 0">'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Visitor Name</label><input id="rc-ap-name" placeholder="Full name" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Contact</label><input id="rc-ap-phone" placeholder="Phone" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Meeting With</label><input id="rc-ap-meet" placeholder="Staff / Department" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Appointment Date</label><input type="date" id="rc-ap-date" value="'+hmDate()+'" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Time Slot</label><input type="time" id="rc-ap-time" value="10:00" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Purpose</label><input id="rc-ap-purpose" placeholder="Reason for appointment" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'</div><div style="margin-top:14px"><button class="btn btn-primary" onclick="rcAddAppointment()">Book Appointment</button></div></div>';
  var rows=data.length?data.slice().reverse().map(function(r){
    var isPast=r.date<hmDate();
    return '<tr style="'+(isPast&&r.status==='Scheduled'?'opacity:.6;':'')+'"> '
      +'<td>'+hmFmt(r.date)+' <b>'+esc(r.time||'')+'</b></td>'
      +'<td><b>'+esc(r.visitorName||'--')+'</b><br><span style="font-size:11px;color:var(--muted)">'+esc(maskPhone(r.phone)||'')+'</span></td>'
      +'<td>'+esc(r.meetWith||'--')+'</td>'
      +'<td>'+esc(r.purpose||'--')+'</td>'
      +'<td>'+hmStatusBadge(r.status||'Scheduled')+'</td>'
      +'<td>'+esc(r.notes||'--')+'</td>'
      +(isAdmin?'<td style="white-space:nowrap">'
        +(r.status==='Scheduled'?'<button onclick="rcApptDone('+parseInt(r.id,10)+')" class="btn-sm-green" style="margin-right:4px">✓ Done</button><button onclick="rcApptCancel('+parseInt(r.id,10)+')" class="btn-danger-sm" style="margin-right:4px">✗ Cancel</button>':'')
        +'<button onclick="rcDelAppointment('+parseInt(r.id,10)+')" class="btn-danger-sm" style="margin-left:2px">🗑</button>'
        +'</td>':'<td></td>')
      +'</tr>';
  }).join(''):'<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:32px">No appointments booked.</td></tr>';
  var upcoming=data.filter(function(r){return r.status==='Scheduled'&&r.date>=hmDate();}).length;
  return formHtml
    +'<div class="card"><div class="card-head"><span class="card-title">📅 Appointment Book</span>'
    +'<span style="font-size:11px;color:var(--muted);font-family:monospace">Upcoming: <b style="color:#3b78c9">'+upcoming+'</b> | Total: '+data.length+'</span></div>'
    +'<div style="overflow-x:auto"><table><thead><tr><th>Date & Time</th><th>Visitor</th><th>Meeting With</th><th>Purpose</th><th>Status</th><th>Notes</th><th>Action</th></tr></thead>'
    +'<tbody>'+rows+'</tbody></table></div></div>';
}
function rcAddAppointment(){
  var name=document.getElementById('rc-ap-name').value.trim();
  var phone=document.getElementById('rc-ap-phone').value.trim();
  var meetWith=document.getElementById('rc-ap-meet').value.trim();
  var date=document.getElementById('rc-ap-date').value;
  var time=document.getElementById('rc-ap-time').value;
  var purpose=document.getElementById('rc-ap-purpose').value.trim();
  if(!name){alert('Enter visitor name.');return;}
  var data=rcLoad('appointments');
  data.push({id:rcNextId(data),visitorName:name,phone:phone,meetWith:meetWith,date:date,time:time,purpose:purpose,status:'Scheduled',bookedBy:currentUser?currentUser.name:'--'});
  rcSave('appointments',data);render();
}
function rcApptDone(id){
  var notes=prompt('Any notes about the meeting (optional):','')||'';
  var data=rcLoad('appointments');
  data=data.map(function(r){return r.id==id?Object.assign({},r,{status:'Completed',notes:notes,completedOn:hmDate()}):r;});
  rcSave('appointments',data);render();
}
function rcApptCancel(id){
  if(!confirm('Cancel this appointment?'))return;
  var data=rcLoad('appointments');
  data=data.map(function(r){return r.id==id?Object.assign({},r,{status:'Cancelled',cancelledOn:hmDate()}):r;});
  rcSave('appointments',data);render();
}
function rcDelAppointment(id){
  if(!confirm('Delete appointment?'))return;
  var data=rcLoad('appointments').filter(function(r){return r.id!=id;});
  rcSave('appointments',data);render();
}
function renderRcParcels(){
  var data=rcLoad('parcels');
  var isAdmin=currentUser&&(currentUser.role==='admin'||currentUser.role==='manager');
  var formHtml='<div class="card" style="margin-bottom:18px"><div class="card-head"><span class="card-title">➕ Register Parcel / Courier</span></div>'
    +'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;padding:4px 0">'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Tracking No. / Ref</label><input id="rc-pk-track" placeholder="Tracking number" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Sender</label><input id="rc-pk-sender" placeholder="Sender name / company" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Addressee (Recipient)</label><input id="rc-pk-recipient" placeholder="Student / Staff name" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Courier Company</label><input id="rc-pk-company" placeholder="e.g. DTDC, Speed Post" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Type</label><select id="rc-pk-type" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"><option>Parcel</option><option>Courier</option><option>Letter</option><option>Document</option><option>Food Package</option></select></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted)">Received Date</label><input type="date" id="rc-pk-date" value="'+hmDate()+'" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;margin-top:4px;background:var(--surface)"/></div>'
    +'</div><div style="margin-top:14px"><button class="btn btn-primary" onclick="rcAddParcel()">Register Parcel</button></div></div>';
  var rows=data.length?data.slice().reverse().map(function(r){
    return '<tr>'
      +'<td style="font-family:monospace;font-size:11.5px">'+esc(r.tracking||'N/A')+'</td>'
      +'<td>'+hmFmt(r.date)+'</td>'
      +'<td>'+esc(r.type||'--')+'</td>'
      +'<td>'+esc(r.sender||'--')+'</td>'
      +'<td><b>'+esc(r.recipient||'--')+'</b></td>'
      +'<td>'+esc(r.company||'--')+'</td>'
      +'<td>'+hmStatusBadge(r.status||'Pending Pickup')+'</td>'
      +'<td style="font-size:11px;color:var(--muted)">'+esc(r.handedOn||'--')+'</td>'
      +'<td style="white-space:nowrap">'
      +(r.status==='Pending Pickup'?'<button onclick="rcParcelHanded('+parseInt(r.id,10)+')" class="btn-sm-green" style="margin-right:4px">✓ Handed</button>':'')
      +(isAdmin?'<button onclick="rcDelParcel('+parseInt(r.id,10)+')" class="btn-danger-sm">🗑</button>':'')
      +'</td>'
      +'</tr>';
  }).join(''):'<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:32px">No parcels recorded.</td></tr>';
  var pending=data.filter(function(r){return r.status==='Pending Pickup';}).length;
  return formHtml
    +'<div class="card"><div class="card-head"><span class="card-title">📦 Parcel Register</span>'
    +'<span style="font-size:11px;color:var(--muted);font-family:monospace">Pending: <b style="color:#f59e0b">'+pending+'</b> | Total: '+data.length+'</span></div>'
    +'<div style="overflow-x:auto"><table><thead><tr><th>Tracking No.</th><th>Date</th><th>Type</th><th>From</th><th>To (Recipient)</th><th>Courier</th><th>Status</th><th>Handed On</th><th>Action</th></tr></thead>'
    +'<tbody>'+rows+'</tbody></table></div></div>';
}
function rcAddParcel(){
  var tracking=document.getElementById('rc-pk-track').value.trim();
  var sender=document.getElementById('rc-pk-sender').value.trim();
  var recipient=document.getElementById('rc-pk-recipient').value.trim();
  var company=document.getElementById('rc-pk-company').value.trim();
  var type=document.getElementById('rc-pk-type').value;
  var date=document.getElementById('rc-pk-date').value;
  if(!recipient){alert('Enter recipient name.');return;}
  var data=rcLoad('parcels');
  data.push({id:rcNextId(data),tracking:tracking,sender:sender,recipient:recipient,company:company,type:type,date:date,status:'Pending Pickup',receivedBy:currentUser?currentUser.name:'--'});
  rcSave('parcels',data);render();
}
function rcParcelHanded(id){
  var sig=prompt('Received by (sign / name):','')||'';
  var data=rcLoad('parcels');
  data=data.map(function(r){return r.id==id?Object.assign({},r,{status:'Collected',handedOn:hmDate()+' '+rcFmtTime(),handedTo:sig}):r;});
  rcSave('parcels',data);render();
}
function rcDelParcel(id){
  if(!confirm('Delete parcel record?'))return;
  var data=rcLoad('parcels').filter(function(r){return r.id!=id;});
  rcSave('parcels',data);render();
}
var rcItemEditId=null;
var rcItemNewRow={stuId:'',parentName:'',phone:'',items:[],remarks:'',photo:''};
var rcItemRowInput=''; // live text of current item being typed
var rcItemRowQty=1;    // quantity for current item
var rcItemStuSearch=''; // search filter for student picker
var rcItemLogSearch=''; // separate log search
var rcItemLogDateFrom=''; // date filter from
var rcItemLogDateTo='';   // date filter to
var rcItemBulkSelected=[]; // IDs selected for bulk delivery
var rcItemBulkMode=false;
var rcItemPhotoData=''; // base64 photo attached to current record
function renderRcItems(){
  var isAdmin=currentUser&&(currentUser.role==='admin'||currentUser.role==='manager'||currentUser.role==='reception');
  var data=rcLoad('items');
  var today=hmDate();
  var todayCount=data.filter(function(r){return r.date===today;}).length;
  var totalItems=data.reduce(function(s,r){return s+(r.items?r.items.length:0);},0);
  var pendingCount=data.filter(function(r){return r.status==='Pending Delivery';}).length;
  var deliveredToday=data.filter(function(r){return r.status==='Delivered'&&r.deliveredOn&&r.deliveredOn.startsWith(today);}).length;
  // -- EDIT MODE: pre-fill from existing record (only once) --
  var editRec=rcItemEditId?data.find(function(r){return r.id==rcItemEditId;}):null;
  if(editRec&&!rcItemNewRow._editLoaded){
    rcItemNewRow={stuId:String(editRec.stuId),parentName:editRec.parentName||'',phone:editRec.phone||'',items:(editRec.items||[]).map(function(i){return typeof i==='object'?i:{name:i,qty:1};}),remarks:editRec.remarks||'',_editLoaded:true};
    rcItemPhotoData=editRec.photo||'';
  }
  // -- SELECTED STUDENT --
  var _selStu=rcItemNewRow.stuId?students.find(function(s){return String(s.id)===String(rcItemNewRow.stuId);}):null;
  // -- ITEM CHIPS --
  var normalizedItems=(rcItemNewRow.items||[]).map(function(i){return typeof i==='object'?i:{name:i,qty:1};});
  var itemBadges=normalizedItems.map(function(item,i){
    var label=item.qty>1?item.name+' ×'+item.qty:item.name;
    return '<span style="display:inline-flex;align-items:center;gap:5px;background:#eff6ff;border:1.5px solid #3b82f6;border-radius:8px;padding:5px 10px;font-size:12.5px;font-weight:600;color:#1e40af">'
      +'<span>'+esc(label)+'</span>'
      +'<button onclick="rcItemRemoveChip('+i+')" style="background:none;border:none;cursor:pointer;color:#dc2626;font-size:15px;font-weight:700;line-height:1;padding:0;margin-left:2px" title="Remove">×</button>'
      +'</span>';
  }).join('');
  // -- QUICK ITEMS --
  var quickItems=['Clothes','Shoes','Books','Food','Medicines','Money','Toiletries','Bedsheet','Electronics','Documents','Sports Kit','Snacks'];
  var quickBtns=quickItems.map(function(qi){
    var on=normalizedItems.some(function(x){return x.name===qi;});
    return '<button onclick="rcItemQuickAdd(\''+qi+'\')" style="padding:6px 13px;border-radius:7px;border:1.5px solid '+(on?'#3b82f6':'var(--border)')+';background:'+(on?'#1433a8':'var(--surface)')+';color:'+(on?'#fff':'var(--text)')+';font-size:12.5px;font-weight:600;cursor:pointer;font-family:\'DM Sans\',sans-serif;transition:all .1s">'+(on?'✓ ':'')+qi+'</button>';
  }).join('');
  // -- PHOTO --
  var photoHTML=rcItemPhotoData
    ?'<div style="position:relative;display:inline-flex;align-items:flex-start"><img src="'+rcItemPhotoData+'" style="height:72px;width:72px;border-radius:8px;border:2px solid var(--border);object-fit:cover"/><button onclick="rcItemPhotoData=\'\';render()" style="position:absolute;top:-7px;right:-7px;background:#dc2626;color:#fff;border:none;border-radius:50%;width:20px;height:20px;cursor:pointer;font-size:13px;font-weight:700;line-height:1;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.3)">×</button></div>'
    :'<label style="display:inline-flex;align-items:center;gap:7px;padding:8px 14px;border-radius:8px;border:1.5px dashed var(--border);cursor:pointer;font-size:12.5px;color:var(--muted);background:var(--surface2)" onmouseenter="this.style.borderColor=\'#1433a8\'" onmouseleave="this.style.borderColor=\'var(--border)\'">📷 Attach Photo<input type="file" accept="image/*" capture="environment" onchange="rcItemAttachPhoto(this)" style="display:none"/></label>';
  var isEdit=!!rcItemEditId;
  // -- STUDENT SELECTED BADGE --
  var stuBadge=_selStu
    ?'<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:#eff6ff;border:1.5px solid #3b82f6;border-radius:8px;margin-top:6px">'
      +avatarHTML(_selStu.name,30)
      +'<div style="flex:1"><div style="font-weight:700;font-size:13.5px;color:#1e40af">'+esc(_selStu.name)+'</div><div style="font-size:11px;color:#3b82f6">'+esc(_selStu.cls||'--')+(_selStu.hostel==='Yes'?' · 🏠 Hostel':'')+'</div></div>'
      +'<button onclick="rcItemNewRow.stuId=\'\';render()" style="background:none;border:none;cursor:pointer;color:#dc2626;font-size:18px;line-height:1;padding:2px 4px" title="Clear student">×</button>'
      +'</div>'
    :'';
  // -- ALL STUDENTS for datalist (fast, no re-render on search) --
  var allStuOpts=students.slice().sort(function(a,b){return a.name.localeCompare(b.name);}).map(function(s){
    return '<option data-id="'+parseInt(s.id,10)+'" value="'+esc(s.name)+' ('+esc(s.cls||'')+')">';
  }).join('');
  var addForm=''
    +'<div class="card" style="margin-bottom:18px;border-top:4px solid '+(isEdit?'#d97706':'#1433a8')+'">'
    +'<div class="card-head"><span class="card-title" style="font-size:14.5px">'+(isEdit?'✏️ Edit Record':'🎒 Record Items Received')+'</span>'
    +(isEdit?'<button onclick="rcItemEditId=null;rcItemNewRow={};rcItemPhotoData=\'\';render()" style="padding:5px 12px;border-radius:7px;border:1.5px solid var(--border);background:var(--surface2);color:var(--muted);cursor:pointer;font-size:12px;font-weight:600">✕ Cancel</button>':'')
    +'</div>'
    // -- STEP 1: STUDENT --
    +'<div style="border:1.5px solid var(--border);border-radius:10px;padding:14px 16px;margin-bottom:12px;background:var(--surface)">'
    +'<div style="font-size:11px;font-weight:800;color:var(--accent);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">① Select Student</div>'
    +'<div style="display:flex;gap:8px;align-items:flex-start;flex-wrap:wrap">'
    +'<div style="flex:1;min-width:200px">'
    +'<input id="ri-stu-typeahead" list="ri-stu-list" placeholder="🔍 Search by name or class..." autocomplete="off" style="width:100%;padding:9px 12px;border-radius:8px;border:1.5px solid var(--border);font-size:13.5px;background:var(--surface);box-sizing:border-box;outline:none" oninput="rcItemPickStudent(this.value)" onfocus="this.select()"/>'
    +'<datalist id="ri-stu-list">'+allStuOpts+'</datalist>'
    +'</div>'
    +'</div>'
    +stuBadge
    +'</div>'
    // -- STEP 2: PARENT DETAILS --
    +'<div style="border:1.5px solid var(--border);border-radius:10px;padding:14px 16px;margin-bottom:12px;background:var(--surface)">'
    +'<div style="font-size:11px;font-weight:800;color:var(--accent);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px">② Parent / Guardian Details</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px">Name *</label>'
    +'<input id="ri-parent" placeholder="Parent or guardian name" value="'+esc(rcItemNewRow.parentName||'')+'" style="width:100%;padding:9px 11px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);box-sizing:border-box"/></div>'
    +'<div><label style="font-size:11.5px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px">Phone</label>'
    +'<input id="ri-phone" placeholder="Contact number" value="'+esc(rcItemNewRow.phone||'')+'" style="width:100%;padding:9px 11px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);box-sizing:border-box"/></div>'
    +'</div>'
    +'<div style="margin-top:10px"><label style="font-size:11.5px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px">Remarks (optional)</label>'
    +'<input id="ri-remarks" placeholder="Any notes..." value="'+esc(rcItemNewRow.remarks||'')+'" style="width:100%;padding:9px 11px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);box-sizing:border-box"/></div>'
    +'</div>'
    // -- STEP 3: ITEMS --
    +'<div style="border:1.5px solid var(--border);border-radius:10px;padding:14px 16px;margin-bottom:12px;background:var(--surface)">'
    +'<div style="font-size:11px;font-weight:800;color:var(--accent);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px">③ Items Received</div>'
    // Quick tap buttons
    +'<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">'+quickBtns+'</div>'
    // Custom item input
    +'<div style="display:flex;gap:8px;align-items:center;margin-bottom:10px">'
    +'<input id="ri-item-input" placeholder="Or type a custom item..." value="'+esc(rcItemRowInput)+'" onkeydown="if(event.key===\'Enter\'){event.preventDefault();rcItemAddChip();}" oninput="rcItemRowInput=this.value" style="flex:1;padding:9px 11px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface)"/>'
    +'<input type="number" id="ri-item-qty" min="1" max="99" value="'+(rcItemRowQty||1)+'" oninput="rcItemRowQty=parseInt(this.value)||1" placeholder="Qty" style="width:60px;padding:9px 8px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);text-align:center" title="Quantity"/>'
    +'<button onclick="rcItemAddChip()" style="padding:9px 16px;background:#1433a8;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:700;font-family:\'DM Sans\',sans-serif;white-space:nowrap">+ Add</button>'
    +'</div>'
    // Item chips
    +(normalizedItems.length
      ?'<div style="display:flex;flex-wrap:wrap;gap:7px;padding:10px;background:var(--surface2);border-radius:8px;min-height:44px">'+itemBadges+'</div>'
      :'<div style="padding:10px;background:var(--surface2);border-radius:8px;font-size:12px;color:var(--muted2);font-style:italic;text-align:center">Tap quick buttons above or type to add items</div>'
    )
    +'</div>'
    // -- STEP 4: PHOTO + SAVE --
    +'<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">'
    +photoHTML
    +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-left:auto">'
    +'<button onclick="rcItemNewRow={};rcItemPhotoData=\'\';rcItemEditId=null;rcItemRowInput=\'\';render()" style="padding:9px 16px;border-radius:8px;border:1.5px solid var(--border);background:var(--surface2);color:var(--muted);cursor:pointer;font-size:13px;font-weight:600;font-family:\'DM Sans\',sans-serif">🗑 Clear</button>'
    +'<button onclick="rcItemSave()" style="padding:9px 24px;background:'+(isEdit?'#d97706':'#1433a8')+';color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13.5px;font-weight:700;font-family:\'DM Sans\',sans-serif;box-shadow:0 2px 8px rgba(20,51,168,.25)">'+(isEdit?'💾 Update':'💾 Save Record')+'</button>'
    +'</div>'
    +'</div>'
    +'</div>';
  // -- LOG TOOLBAR --
  var logToolbar='<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:10px 14px;background:var(--surface2);border-bottom:1px solid var(--border-soft)">'
    +'<input id="rc-items-search" placeholder="🔍 Search student or parent..." value="'+esc(rcItemLogSearch)+'" oninput="rcItemLogSearch=this.value;debouncedRender()" style="padding:7px 10px;border-radius:7px;border:1.5px solid var(--border);font-size:12.5px;background:var(--surface);flex:1;min-width:160px"/>'
    +'<input type="date" value="'+esc(rcItemLogDateFrom)+'" oninput="rcItemLogDateFrom=this.value;debouncedRender()" title="From date" style="padding:6px 8px;border-radius:7px;border:1.5px solid var(--border);font-size:12px;background:var(--surface)"/>'
    +'<input type="date" value="'+esc(rcItemLogDateTo)+'" oninput="rcItemLogDateTo=this.value;debouncedRender()" title="To date" style="padding:6px 8px;border-radius:7px;border:1.5px solid var(--border);font-size:12px;background:var(--surface)"/>'
    +(rcItemLogDateFrom||rcItemLogDateTo?'<button onclick="rcItemLogDateFrom=\'\';rcItemLogDateTo=\'\';render()" style="padding:6px 10px;border-radius:7px;border:1.5px solid var(--border);background:var(--surface);color:var(--muted);cursor:pointer;font-size:12px">✕ Clear</button>':'')
    +'<div style="display:flex;gap:6px;margin-left:auto">'
    +(rcItemBulkMode
      ?'<button onclick="rcItemBulkDeliver()" style="padding:6px 12px;border-radius:7px;background:#16a34a;color:#fff;border:none;cursor:pointer;font-size:12px;font-weight:700">✓ Deliver ('+rcItemBulkSelected.length+')</button>'
       +'<button onclick="rcItemBulkMode=false;rcItemBulkSelected=[];render()" style="padding:6px 10px;border-radius:7px;background:var(--surface);color:var(--muted);border:1.5px solid var(--border);cursor:pointer;font-size:12px">✕</button>'
      :'<button onclick="rcItemBulkMode=true;rcItemBulkSelected=[];render()" style="padding:6px 11px;border-radius:7px;background:var(--surface);color:var(--muted);border:1.5px solid var(--border);cursor:pointer;font-size:12px;font-weight:600">☑ Bulk</button>'
    )
    +'<button onclick="rcItemExportCSV()" style="padding:6px 11px;border-radius:7px;background:var(--surface);color:var(--muted);border:1.5px solid var(--border);cursor:pointer;font-size:12px;font-weight:600">⬇ CSV</button>'
    +'</div>'
    +'</div>';
  // -- FILTER DATA --
  var filteredData=data.slice().reverse().filter(function(r){
    var q=(rcItemLogSearch||'').toLowerCase().trim();
    var matchQ=!q||(r.stuName||'').toLowerCase().includes(q)||(r.parentName||'').toLowerCase().includes(q)||(r.phone||'').includes(q);
    var matchFrom=!rcItemLogDateFrom||r.date>=rcItemLogDateFrom;
    var matchTo=!rcItemLogDateTo||r.date<=rcItemLogDateTo;
    return matchQ&&matchFrom&&matchTo;
  });
  // -- TABLE ROWS --
  var rows=filteredData.length?filteredData.map(function(r){
    var stu=students.find(function(s){return String(s.id)===String(r.stuId);});
    var stuName=stu?stu.name:(r.stuName||'Unknown');
    var delivered=r.status==='Delivered';
    var isBulkSel=rcItemBulkSelected.indexOf(r.id)>-1;
    var normalItems=(r.items||[]).map(function(i){return typeof i==='object'?i:{name:i,qty:1};});
    return '<tr style="'+(delivered?'opacity:.6':'')+(isBulkSel?';background:#eff6ff':'')+'">'
      +(rcItemBulkMode&&!delivered?'<td><input type="checkbox" '+(isBulkSel?'checked':'')+' onchange="rcItemToggleBulk('+parseInt(r.id,10)+',this.checked)" style="width:15px;height:15px;cursor:pointer"/></td>':'')
      +'<td style="font-family:\'JetBrains Mono\',monospace;font-size:11px;color:var(--muted)">'+r.date+'<br/><span style="font-size:10px">'+esc(r.time||'')+'</span></td>'
      +'<td><div style="display:flex;align-items:center;gap:7px">'+avatarHTML(stuName,26)+'<div><div style="font-weight:700;font-size:13px">'+esc(stuName)+'</div><div style="font-size:10.5px;color:var(--muted)">'+esc(stu?stu.cls||'--':'--')+'</div></div></div></td>'
      +'<td><div style="font-weight:600;font-size:12.5px">'+esc(r.parentName||'--')+'</div><div style="font-size:10.5px;color:var(--muted)">'+esc(r.phone||'')+'</div></td>'
      +'<td style="max-width:200px"><div style="display:flex;flex-wrap:wrap;gap:4px">'
      +(normalItems.length?normalItems.map(function(it){
          var lbl=it.qty>1?it.name+' ×'+it.qty:it.name;
          return '<span style="background:#eff6ff;border:1px solid #93c5fd;border-radius:6px;padding:2px 7px;font-size:11px;color:#1e40af;font-weight:600">'+esc(lbl)+'</span>';
        }).join(''):'<span style="color:var(--muted2)">--</span>')
      +'</div>'
      +(r.photo?'<img src="'+_gnsiSafePhoto(r.photo)+'" style="max-height:40px;max-width:60px;border-radius:5px;border:1px solid var(--border);object-fit:cover;cursor:pointer;margin-top:4px;display:block" onclick="rcItemViewPhoto('+parseInt(r.id,10)+')" title="View photo"/>':'')
      +(r.remarks?'<div style="font-size:10.5px;color:var(--muted);margin-top:2px">'+esc(r.remarks)+'</div>':'')
      +'</td>'
      +'<td style="text-align:center"><span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:'+(delivered?'#dcfce7':'#fef3c7')+';color:'+(delivered?'#16a34a':'#d97706')+'">'+esc(r.status||'Pending')+'</span>'
      +(delivered&&r.deliveredOn?'<div style="font-size:10px;color:var(--muted);margin-top:2px">'+esc(r.deliveredOn)+'</div><div style="font-size:10px;color:var(--muted)">by '+esc(r.deliveredBy||'--')+'</div>':'')
      +'</td>'
      +'<td style="font-size:11.5px;color:var(--muted)">'+esc(r.receivedBy||'--')+'</td>'
      +'<td style="white-space:nowrap;padding:4px 6px"><div style="display:flex;gap:4px;flex-wrap:wrap">'
      +(!delivered?'<button onclick="rcItemDeliver('+parseInt(r.id,10)+')" style="padding:3px 8px;border-radius:6px;border:1.5px solid #86efac;background:#f0fdf4;color:#16a34a;cursor:pointer;font-size:11px;font-weight:700;font-family:\'DM Sans\',sans-serif">✓ Deliver</button>':'')
      +'<button onclick="rcItemPrintReceipt('+parseInt(r.id,10)+')" style="padding:3px 8px;border-radius:6px;border:1.5px solid var(--border);background:var(--surface2);color:var(--muted);cursor:pointer;font-size:11px;font-weight:700;font-family:\'DM Sans\',sans-serif">🖨</button>'
      +(!delivered&&isAdmin?'<button onclick="rcItemStartEdit('+parseInt(r.id,10)+')" style="padding:3px 8px;border-radius:6px;border:1.5px solid #fde68a;background:#fffbeb;color:#d97706;cursor:pointer;font-size:11px;font-weight:700;font-family:\'DM Sans\',sans-serif">✎</button>':'')
      +(isAdmin?'<button onclick="rcItemDel('+parseInt(r.id,10)+')" style="padding:3px 8px;border-radius:6px;border:1.5px solid #fca5a5;background:#fee2e2;color:#dc2626;cursor:pointer;font-size:11px;font-weight:700;font-family:\'DM Sans\',sans-serif">🗑</button>':'')
      +'</div></td>'
      +'</tr>';
  }).join(''):'<tr><td colspan="'+(rcItemBulkMode?'8':'7')+'" style="text-align:center;padding:32px;color:var(--muted)">No records found.</td></tr>';
  return '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;margin-bottom:18px">'
    +'<div class="stat-card" style="--c:#1433a8"><div class="stat-label">Today Received</div><div class="stat-val">'+todayCount+'</div><div class="stat-sub">'+hmDate()+'</div></div>'
    +'<div class="stat-card" style="--c:#16a34a"><div class="stat-label">Total Records</div><div class="stat-val">'+data.length+'</div><div class="stat-sub">All time</div></div>'
    +'<div class="stat-card" style="--c:#d97706"><div class="stat-label">Pending Delivery</div><div class="stat-val">'+pendingCount+'</div><div class="stat-sub">Not yet delivered</div></div>'
    +'<div class="stat-card" style="--c:#7c3aed"><div class="stat-label">Total Items</div><div class="stat-val">'+totalItems+'</div><div class="stat-sub">Items logged</div></div>'
    +'<div class="stat-card" style="--c:#0891b2"><div class="stat-label">Delivered Today</div><div class="stat-val">'+deliveredToday+'</div><div class="stat-sub">Handed to students</div></div>'
    +'</div>'
    +addForm
    +'<div class="card"><div class="card-head"><span class="card-title">📋 Items Log</span>'
    +'<span style="font-size:11.5px;color:var(--muted)">'+filteredData.length+' record'+(filteredData.length===1?'':'s')+'</span>'
    +'</div>'
    +logToolbar
    +'<div style="overflow-x:auto"><table><thead><tr>'
    +(rcItemBulkMode?'<th style="width:32px"></th>':'')
    +'<th>Date/Time</th><th>Student</th><th>Parent</th><th>Items</th><th>Status</th><th>Rec. By</th><th>Actions</th></tr></thead>'
    +'<tbody>'+rows+'</tbody></table></div></div>';
}
function rcItemAddChip(){
  var inp=document.getElementById('ri-item-input');
  var val=(inp?inp.value:'').trim()||rcItemRowInput.trim();
  if(!val){showToast('Please type an item name first','#d97706');return;}
  var qty=parseInt((document.getElementById('ri-item-qty')||{}).value||rcItemRowQty)||1;
  if(!rcItemNewRow.items)rcItemNewRow.items=[];
  rcItemNewRow.items.push({name:val,qty:qty});
  rcItemRowInput='';
  rcItemRowQty=1;
  render();
  setTimeout(function(){var el=document.getElementById('ri-item-input');if(el){el.value='';el.focus();}},50);
}
function rcItemQuickAdd(name){
  if(!rcItemNewRow.items)rcItemNewRow.items=[];
  var existing=rcItemNewRow.items.find(function(i){return(typeof i==='object'?i.name:i)===name;});
  if(existing){
    // Remove it (toggle off)
    rcItemNewRow.items=rcItemNewRow.items.filter(function(i){return(typeof i==='object'?i.name:i)!==name;});
  } else {
    rcItemNewRow.items.push({name:name,qty:1});
  }
  render();
}
function rcItemRemoveChip(idx){
  if(rcItemNewRow.items)rcItemNewRow.items.splice(idx,1);
  render();
}
function rcItemAttachPhoto(input){
  var file=input&&input.files&&input.files[0];
  if(!file)return;
  var reader=new FileReader();
  reader.onload=function(e){
    rcItemPhotoData=e.target.result;
    render();
  };
  reader.readAsDataURL(file);
}
function rcItemViewPhoto(id){
  var data=rcLoad('items');
  var rec=data.find(function(r){return r.id==id;});
  if(!rec||!rec.photo)return;
  var overlay=document.createElement('div');
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:99999;display:flex;align-items:center;justify-content:center;cursor:pointer';
  overlay.onclick=function(){document.body.removeChild(overlay);};
  var img=document.createElement('img');
  img.src=rec.photo;
  img.style.cssText='max-width:90vw;max-height:90vh;border-radius:12px;box-shadow:0 12px 48px rgba(0,0,0,.6)';
  overlay.appendChild(img);
  document.body.appendChild(overlay);
}
function rcItemStartEdit(id){
  rcItemEditId=id;
  rcItemNewRow={_editLoaded:false};
  rcItemPhotoData='';
  rcItemRowInput='';
  rcItemStuSearch='';
  render();
  setTimeout(function(){var card=document.querySelector('.card[style*="border-top"]');if(card)card.scrollIntoView({behavior:'smooth',block:'start'});},80);
}
function rcItemToggleBulk(id,checked){
  if(checked){
    if(rcItemBulkSelected.indexOf(id)<0)rcItemBulkSelected.push(id);
  } else {
    rcItemBulkSelected=rcItemBulkSelected.filter(function(x){return x!=id;});
  }
}
function rcItemBulkDeliver(){
  if(!rcItemBulkSelected.length){showToast('No records selected','#d97706');return;}
  var note=prompt('Delivery note / received by (optional):','')||'';
  var data=rcLoad('items');
  var count=0;
  data=data.map(function(r){
    if(rcItemBulkSelected.indexOf(r.id)>-1&&r.status!=='Delivered'){
      count++;
      return Object.assign({},r,{status:'Delivered',deliveredOn:hmDate()+' '+rcFmtTime(),deliveredBy:currentUser?currentUser.name:'--',deliveryNote:note});
    }
    return r;
  });
  rcSave('items',data);
  rcItemBulkSelected=[];
  rcItemBulkMode=false;
  render();
  showToast('✅ '+count+' record(s) marked as delivered','#16a34a');
}
function rcItemExportCSV(){
  var data=rcLoad('items');
  if(!data.length){showToast('No records to export','#d97706');return;}
  var cols=['ID','Date','Time','Student','Class','Parent','Phone','Items','Qty','Status','Received By','Delivered On','Delivered By','Remarks'];
  var rows=data.map(function(r){
    var normalItems=(r.items||[]).map(function(i){return typeof i==='object'?i:{name:i,qty:1};});
    var itemNames=normalItems.map(function(i){return i.name+(i.qty>1?' x'+i.qty:'');}).join('; ');
    var totalQty=normalItems.reduce(function(s,i){return s+(i.qty||1);},0);
    return [r.id,r.date,r.time||'',r.stuName||'',r.stuClass||'',r.parentName||'',r.phone||'',itemNames,totalQty,r.status||'',r.receivedBy||'',r.deliveredOn||'',r.deliveredBy||'',r.remarks||''].map(function(v){return '"'+String(v).replace(/"/g,'""')+'"';}).join(',');
  });
  var csv=[cols.join(',')].concat(rows).join('\n');
  var blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url; a.download='items_log_'+hmDate().replace(/-/g,'')+'.csv'; a.click();
  setTimeout(function(){URL.revokeObjectURL(url);},2000);
  showToast('📥 CSV exported','#1433a8');
}
function rcItemPrintReceipt(id){
  var data=rcLoad('items');
  var r=data.find(function(x){return x.id==id;});
  if(!r)return;
  var normalItems=(r.items||[]).map(function(i){return typeof i==='object'?i:{name:i,qty:1};});
  var itemRows=normalItems.map(function(it,idx){
    return '<tr><td style="padding:5px 8px;border:1px solid #ccc">'+(idx+1)+'</td>'
      +'<td style="padding:5px 8px;border:1px solid #ccc;font-weight:600">'+esc(it.name)+'</td>'
      +'<td style="padding:5px 8px;border:1px solid #ccc;text-align:center">'+it.qty+'</td></tr>';
  }).join('');
  var win=window.open('','_blank','width=600,height=700');
  win.document.write('<!DOCTYPE html><html><head><title>Item Receipt</title>'
    +'<style>body{font-family:\'DM Sans\',sans-serif;padding:28px;color:#0a1229;font-size:13px}h2{margin:0 0 4px;font-size:18px}.header{border-bottom:2px solid #1433a8;padding-bottom:10px;margin-bottom:16px}.inst{font-size:11px;color:#4a5580;letter-spacing:.05em;text-transform:uppercase;font-weight:700}.meta{display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;margin-bottom:14px;background:#f5f7fd;padding:10px 14px;border-radius:8px}.ml{font-size:11px;color:#8896bb;font-weight:700;margin-bottom:2px}.mv{font-weight:700;font-size:13px}table{width:100%;border-collapse:collapse;margin:10px 0}th{background:#1433a8;color:#fff;padding:6px 8px;text-align:left;font-size:12px}td{font-size:12.5px}.footer{margin-top:18px;padding-top:12px;border-top:1px dashed #ccc;display:flex;justify-content:space-between;font-size:11px;color:#8896bb}.sig{margin-top:30px;border-top:1px solid #333;width:160px;font-size:11px;padding-top:4px;text-align:center}@media print{body{padding:10px}}</style></head><body>'
    +'<div class="header"><div class="inst">'+(window.TENANT?window.TENANT.name:'Guidance Navodaya &amp; Sainik Institute')+'</div><h2>🎒 Items Receipt</h2></div>'
    +'<div class="meta">'
    +'<div><div class="ml">Student</div><div class="mv">'+esc(r.stuName||'--')+'</div></div>'
    +'<div><div class="ml">Class</div><div class="mv">'+esc(r.stuClass||'--')+'</div></div>'
    +'<div><div class="ml">Parent / Guardian</div><div class="mv">'+esc(r.parentName||'--')+'</div></div>'
    +'<div><div class="ml">Phone</div><div class="mv">'+esc(maskPhone(r.phone)||'--')+'</div></div>'
    +'<div><div class="ml">Date</div><div class="mv">'+esc(r.date||'--')+'</div></div>'
    +'<div><div class="ml">Time</div><div class="mv">'+esc(r.time||'--')+'</div></div>'
    +'<div><div class="ml">Received By</div><div class="mv">'+esc(r.receivedBy||'--')+'</div></div>'
    +'<div><div class="ml">Status</div><div class="mv">'+esc(r.status||'--')+'</div></div>'
    +'</div>'
    +(r.remarks?'<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:7px 12px;margin-bottom:10px;font-size:12px"><b>Remarks:</b> '+esc(r.remarks)+'</div>':'')
    +'<table><thead><tr><th>#</th><th>Item Description</th><th>Qty</th></tr></thead><tbody>'+itemRows+'</tbody></table>'
    +(r.photo?'<div style="margin-top:12px"><div style="font-size:11px;font-weight:700;color:#4a5580;margin-bottom:6px">PHOTO ATTACHED</div><img src="'+_gnsiSafePhoto(r.photo)+'" style="max-width:200px;max-height:150px;border-radius:8px;border:1.5px solid #d0d9ef"/></div>':'')
    +'<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:24px">'
    +'<div><div class="sig">Staff Signature</div></div>'
    +'<div><div class="sig">Parent Signature</div></div>'
    +'</div>'
    +'<div class="footer"><span>Ref #'+parseInt(r.id,10)+'</span><span>GNSI Management System</span></div>'
    +'</body></html>');
  win.document.close();
  setTimeout(function(){win.print();},400);
}
function rcItemPickStudent(val){
  if(!val||!val.trim()){return;}
  // Try to match by "Name (Class)" format from the datalist
  var opts=document.querySelectorAll('#ri-stu-list option');
  for(var i=0;i<opts.length;i++){
    if(opts[i].value===val){
      var sid=opts[i].getAttribute('data-id');
      if(sid){
        rcItemNewRow.stuId=String(sid);
        // Clear the input and trigger a render to show the badge
        var inp=document.getElementById('ri-stu-typeahead');
        if(inp)inp.value='';
        render();
        return;
      }
    }
  }
}
function rcItemSave(){
  var stuId=(document.getElementById('ri-student')||{}).value||rcItemNewRow.stuId||'';
  var parentName=((document.getElementById('ri-parent')||{}).value||'').trim();
  var phone=((document.getElementById('ri-phone')||{}).value||'').trim();
  var remarks=((document.getElementById('ri-remarks')||{}).value||'').trim();
  var items=rcItemNewRow.items||[];
  if(!stuId){showToast('Please select a student','#dc2626');return;}
  if(!parentName){showToast('Parent name is required','#dc2626');return;}
  if(!items.length){showToast('Please add at least one item','#dc2626');return;}
  var stu=students.find(function(s){return String(s.id)===String(stuId);});
  var data=rcLoad('items');
  if(rcItemEditId){
    // UPDATE existing
    data=data.map(function(r){
      if(r.id==rcItemEditId){
        return Object.assign({},r,{stuId:stuId,stuName:stu?stu.name:r.stuName,stuClass:stu?stu.cls||'':r.stuClass,parentName:parentName,phone:phone,items:items,remarks:remarks,photo:rcItemPhotoData||r.photo||'',editedOn:hmDate()+' '+rcFmtTime(),editedBy:currentUser?currentUser.name:'--'});
      }
      return r;
    });
    rcSave('items',data);
    rcItemEditId=null;
    showToast('✅ Record updated','#d97706');
  } else {
    // NEW record
    data.push({
      id:rcNextId(data),
      stuId:stuId,
      stuName:stu?stu.name:'',
      stuClass:stu?stu.cls||'':'',
      parentName:parentName,
      phone:phone,
      items:items,
      remarks:remarks,
      photo:rcItemPhotoData||'',
      date:hmDate(),
      time:rcFmtTime(),
      status:'Pending Delivery',
      receivedBy:currentUser?currentUser.name:'--',
      deliveredOn:''
    });
    rcSave('items',data);
    showToast('✅ Items recorded for '+(stu?stu.name:'student'),'#16a34a');
  }
  rcItemNewRow={stuId:'',parentName:'',phone:'',items:[],remarks:''};
  rcItemRowInput='';
  rcItemPhotoData='';
  rcItemStuSearch='';
  render();
}
function rcItemDeliver(id){
  var rec=rcLoad('items').find(function(r){return r.id==id;});
  if(!rec)return;
  var itemList=((rec.items||[]).map(function(i){return typeof i==='object'?(i.qty>1?i.name+' ×'+i.qty:i.name):i;})).join(', ');
  var note=prompt('Delivery note / received by student (optional):\nItems: '+itemList,'');
  if(note===null)return; // cancelled
  var data=rcLoad('items').map(function(r){return r.id==id?Object.assign({},r,{status:'Delivered',deliveredOn:hmDate()+' '+rcFmtTime(),deliveredBy:currentUser?currentUser.name:'--',deliveryNote:note||''}):r;});
  rcSave('items',data);render();
  showToast('✅ Items marked as delivered to '+esc(rec.stuName||'student'),'#16a34a');
}
function rcItemDel(id){
  if(!confirm('Delete this item record?'))return;
  rcSave('items',rcLoad('items').filter(function(r){return r.id!=id;}));render();
}
function renderRcDashboard(){
  var today=hmDate();
  var visitors=rcLoad('visitors');
  var phonelog=rcLoad('phonelog');
  var enquiries=rcLoad('enquiries');
  var appointments=rcLoad('appointments');
  var parcels=rcLoad('parcels');
  var todayV=visitors.filter(function(r){return r.date===today;});
  var todayP=phonelog.filter(function(r){return r.date===today;});
  var todayE=enquiries.filter(function(r){return r.date===today;});
  var todayApt=appointments.filter(function(r){return r.date===today;});
  var pendingParcels=parcels.filter(function(r){return r.status==='Pending Pickup';});
  function statCard(icon,label,val,sub,color){
    return '<div class="stat-card" style="--c:'+color+';flex:1;min-width:150px"><div class="stat-label">'+icon+' '+label+'</div><div class="stat-val">'+val+'</div><div class="stat-sub">'+sub+'</div></div>';
  }
  var followUpCalls=phonelog.filter(function(r){return r.followUp==='Yes'&&r.date>=today;}).length;
  var newEnquiries=enquiries.filter(function(r){return r.status==='New';}).length;
  var upcomingAppts=appointments.filter(function(r){return r.status==='Scheduled'&&r.date>=today;}).length;
  var visitorsInside=visitors.filter(function(r){return r.status==='In';});
  var stats=''
    +statCard('👥','Visitors Today',todayV.length,'Total signed in today','#3b78c9')
    +statCard('📞','Calls Today',todayP.length,'Incoming + Outgoing','#16a34a')
    +statCard('❓','Enquiries Today',todayE.length,'New admissions leads','#8b5cf6')
    +statCard('📅','Appointments Today',todayApt.length,'Scheduled meetings','#f59e0b')
    +statCard('📦','Pending Parcels',pendingParcels.length,'Awaiting collection','#dc2626');
  var insideRows=visitorsInside.length?visitorsInside.map(function(r){
    return '<tr><td><b>'+esc(r.name||'--')+'</b></td><td>'+esc(r.purpose||'--')+'</td><td>'+esc(r.meetingPerson||'--')+'</td><td>'+esc(r.inTime||'--')+'</td><td><button onclick="rcVisitorOut('+parseInt(r.id,10)+')" class="btn-sm-green">✓ Check Out</button></td></tr>';
  }).join(''):'<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:24px">No visitors currently inside.</td></tr>';
  var aptRows=todayApt.length?todayApt.map(function(r){
    return '<tr><td><b>'+esc(r.time||'--')+'</b></td><td>'+esc(r.visitorName||'--')+'</td><td>'+esc(r.meetWith||'--')+'</td><td>'+esc(r.purpose||'--')+'</td><td>'+hmStatusBadge(r.status||'Scheduled')+'</td></tr>';
  }).join(''):'<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:24px">No appointments today.</td></tr>';
  return '<div style="display:flex;flex-wrap:wrap;gap:14px;margin-bottom:20px">'+stats+'</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;flex-wrap:wrap">'
    +'<div class="card"><div class="card-head"><span class="card-title">👥 Visitors Currently Inside</span></div>'
    +'<div style="overflow-x:auto;-webkit-overflow-scrolling:touch"><table><thead><tr><th>Name</th><th>Purpose</th><th>Meeting</th><th>In Time</th><th>Action</th></tr></thead><tbody>'+insideRows+'</tbody></table></div></div>'
    +'<div class="card"><div class="card-head"><span class="card-title">📅 Today\'s Appointments</span></div>'
    +'<div style="overflow-x:auto;-webkit-overflow-scrolling:touch"><table><thead><tr><th>Time</th><th>Visitor</th><th>With</th><th>Purpose</th><th>Status</th></tr></thead><tbody>'+aptRows+'</tbody></table></div></div>'
    +'<div class="card"><div class="card-head"><span class="card-title">📦 Pending Parcels</span></div>'
    +'<div style="overflow-x:auto;-webkit-overflow-scrolling:touch"><table><thead><tr><th>Date</th><th>Type</th><th>From</th><th>To</th><th>Action</th></tr></thead><tbody>'
    +(pendingParcels.length?pendingParcels.map(function(r){
      return '<tr><td>'+hmFmt(r.date)+'</td><td>'+esc(r.type||'--')+'</td><td>'+esc(r.sender||'--')+'</td><td><b>'+esc(r.recipient||'--')+'</b></td><td><button onclick="rcParcelHanded('+parseInt(r.id,10)+')" class="btn-sm-green">✓ Handed</button></td></tr>';
    }).join(''):'<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:24px">No pending parcels.</td></tr>')
    +'</tbody></table></div>'
    +'<div class="card"><div class="card-head"><span class="card-title">📞 Follow-up Calls Pending</span></div>'
    +'<div style="overflow-x:auto;-webkit-overflow-scrolling:touch"><table><thead><tr><th>Date</th><th>Caller</th><th>Regarding</th><th>Message</th></tr></thead><tbody>'
    +(phonelog.filter(function(r){return r.followUp==='Yes';}).slice(-5).map(function(r){
      return '<tr><td>'+hmFmt(r.date)+'</td><td><b>'+esc(r.callerName||'--')+'</b></td><td>'+esc(r.regarding||'--')+'</td><td>'+esc(r.message||'--')+'</td></tr>';
    }).join('')||'<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:24px">No follow-ups pending.</td></tr>')
    +'</tbody></table></div>'
    +'</div>';
}
