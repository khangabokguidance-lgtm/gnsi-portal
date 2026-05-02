/* GNSI PORTAL — modules/reports.js
   Pages: reports, reportcard, certificate
   DEPENDS ON: core/utils.js, core/state.js */

function renderReports(){
  var tabStyle=function(t){
    return t===rptTab
      ?'padding:9px 18px;border-radius:8px;border:none;cursor:pointer;font-family:\'Nunito\',sans-serif;font-weight:700;font-size:13px;background:var(--accent);color:#fff'
      :'padding:9px 18px;border-radius:8px;border:1.5px solid var(--border);cursor:pointer;font-family:\'Nunito\',sans-serif;font-weight:600;font-size:13px;background:var(--surface);color:var(--muted)';
  };
  var tabs='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:22px">'
    +'<button style="'+tabStyle('attendance')+'" onclick="rptTab=\'attendance\';render()">📋 Attendance</button>'
    +'<button style="'+tabStyle('staff')+'" onclick="rptTab=\'staff\';render()">👥 Staff</button>'
    +'<button style="'+tabStyle('students')+'" onclick="rptTab=\'students\';render()">🎓 Students</button>'
    +'<button style="'+tabStyle('salary')+'" onclick="rptTab=\'salary\';render()">💰 Salary</button>'
    +'<button style="'+tabStyle('timetable')+'" onclick="rptTab=\'timetable\';render()">📅 Timetable</button>'
    +'<button style="'+tabStyle('fees')+'" onclick="rptTab=\'fees\';render()">💳 Fee Records</button>'
    +'<button style="'+tabStyle('hostelrpt')+'" onclick="rptTab=\'hostelrpt\';render()">🏠 Hostel</button>'
    +'<button style="'+tabStyle('staffrating')+'" onclick="rptTab=\'staffrating\';render()">⭐ Staff Rating</button>'
    +'</div>';
  var body='';
  if(rptTab==='attendance')body=rptAttendanceSection();
  else if(rptTab==='staff')body=rptStaffSection();
  else if(rptTab==='students')body=rptStudentsSection();
  else if(rptTab==='salary')body=rptSalarySection();
  else if(rptTab==='fees')body=rptFeesSection();
  else if(rptTab==='hostelrpt')body=rptHostelSection();
  else if(rptTab==='staffrating')body=rptStaffRatingSection();
  else body=rptTimetableSection();
  return '<div class="page-header">'
    +'<div class="page-header-eyebrow">GNSI -- REPORTS CENTRE</div>'
    +'<div class="page-header-title">Reports &amp; Export</div>'
    +'<div class="page-header-sub">Generate professional PDF · Excel · Word · CSV reports for every module</div>'
    +'</div>'
    +'<div style="background:linear-gradient(135deg,#e8eeff,#f0f4ff);border:1px solid var(--accent);border-radius:12px;padding:14px 20px;margin-bottom:20px;display:flex;align-items:center;gap:14px">'
    +'<div style="font-size:28px">📊</div>'
    +'<div><div style="font-size:13.5px;font-weight:700;color:var(--accent)">Professional Report Generation</div>'
    +'<div style="font-size:12px;color:var(--muted);margin-top:2px">Each section supports <b>PDF</b> (printable), <b>Excel (.xlsx)</b>, <b>Word (.doc)</b>, and <b>CSV</b> export formats. Role-based access applies.</div></div>'
    +'</div>'
    +tabs+body;
}
function rptAttendanceSection(){
  var pa=loadPAtt();
  var attData=(typeof attendance !== 'undefined' ? attendance : {});
  // Summarise staff attendance per person for the month
  var staffAtt=staff.map(function(s){
    var P=0,L=0,ED=0,A=0,total=0;
    Object.keys(attData).forEach(function(k){
      if(!k.startsWith(rptAttMonth))return;
      if(k.includes('-S-'+s.id)){
        total++;
        var v=attData[k];
        if(v==='P')P++;else if(v==='L')L++;else if(v==='ED')ED++;else if(v==='A')A++;
      }
    });
    return{name:s.name,role:s.role,dept:s.dept,P,L,ED,A,total,pct:total?Math.round((P+L+ED)/total*100):0};
  });
  var stuAtt=students.map(function(s){
    var P=0,A=0,L=0,ED=0,total=0;
    Object.keys(attData).forEach(function(k){
      if(!k.startsWith(rptAttMonth))return;
      if(k.includes('-T-'+s.id)){
        total++;
        var v=attData[k];
        if(v==='P')P++;else if(v==='L')L++;else if(v==='ED')ED++;else if(v==='A')A++;
      }
    });
    return{name:s.name,cls:s.cls,roll:s.roll,P,L,ED,A,total,pct:total?Math.round((P+L+ED)/total*100):0};
  });
  var preview='<div class="card" style="margin-bottom:14px">'
    // Desktop table
    +'<div class="gnsi-rpt-desktop"><div style="overflow-x:auto"><table>'
    +'<thead><tr><th>Staff Name</th><th>Dept</th><th>Present</th><th>Late</th><th>Early Dep</th><th>Absent</th><th>Days Marked</th><th>Attendance %</th></tr></thead><tbody>'
    +staffAtt.slice(0,8).map(function(r){
      var c=r.pct>=90?'#16a34a':r.pct>=75?'#e09500':'#dc2626';
      return '<tr><td><b>'+esc(r.name)+'</b></td><td>'+esc(r.dept)+'</td>'
        +'<td style="color:#16a34a;font-weight:700">'+r.P+'</td><td style="color:#e09500;font-weight:700">'+r.L+'</td>'
        +'<td style="color:#ea580c;font-weight:700">'+r.ED+'</td><td style="color:#dc2626;font-weight:700">'+r.A+'</td>'
        +'<td style="font-family:\'JetBrains Mono\',monospace">'+r.total+'</td>'
        +'<td><span style="font-weight:800;color:'+c+'">'+r.pct+'%</span></td></tr>';
    }).join('')
    +'</tbody></table></div></div>'
    // Mobile compact rows
    +'<div class="gnsi-rpt-mobile" style="padding:8px 0">'
    +staffAtt.slice(0,8).map(function(r){
      var c=r.pct>=90?'#16a34a':r.pct>=75?'#e09500':'#dc2626';
      return '<div class="rpt-mob-row" style="padding:10px 16px">'
        +'<div><div class="rpt-mob-name">'+esc(r.name)+'</div><div class="rpt-mob-meta">'+esc(r.dept)+' &nbsp;·&nbsp; '+r.total+' days &nbsp;·&nbsp; P:'+r.P+' L:'+r.L+' A:'+r.A+'</div></div>'
        +'<span class="rpt-mob-badge" style="background:'+c+'18;color:'+c+';border:1px solid '+c+'44">'+r.pct+'%</span>'
      +'</div>';
    }).join('')
    +'</div>'
    +'</div>';
  return rptExportBar('Attendance Report -- '+rptAttMonth,
    ['<div style="font-size:13px;color:var(--muted);font-weight:600">Month:</div>'
    +'<input type="month" value="'+rptAttMonth+'" onchange="rptAttMonth=this.value;render()" style="background:var(--surface);border:1.5px solid var(--border);border-radius:9px;padding:8px 14px;font-size:13px;font-family:\'Nunito\',sans-serif;color:var(--on-surface);outline:none"/>'],
    {pdf:'rptAttPDF()',excel:'rptAttExcel()',doc:'rptAttDOC()',csv:'rptAttCSV()'}
  )
    +'<div style="font-size:13px;font-weight:700;color:var(--on-surface);margin-bottom:10px">Staff Attendance -- '+rptAttMonth+' (preview: first 8)</div>'
    +preview
    +'<div style="font-size:12px;color:var(--muted);margin-top:8px">Full report includes all '+staff.length+' staff &amp; '+students.length+' students. Click export buttons above.</div>';
}
function rptExportBar(title, extraHtmlArr, actions) {
  var extraHTML = (extraHtmlArr||[]).join('');
  return '<div class="rpt-export-bar-new">'
    +'<div class="rpt-export-title">'+esc(title)+'</div>'
    +(extraHTML?'<div style="margin-bottom:10px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">'+extraHTML+'</div>':'')
    +'<div class="rpt-export-btns">'
    +(actions.pdf?'<button onclick="'+actions.pdf+'" class="rpt-export-btn rpt-btn-pdf">🔴 PDF</button>':'')
    +(actions.excel?'<button onclick="'+actions.excel+'" class="rpt-export-btn rpt-btn-xlsx">📗 Excel</button>':'')
    +(actions.doc?'<button onclick="'+actions.doc+'" class="rpt-export-btn rpt-btn-doc">📝 Word</button>':'')
    +(actions.csv?'<button onclick="'+actions.csv+'" class="rpt-export-btn rpt-btn-csv">📄 CSV</button>':'')
    +'</div></div>';
}
function rptAttPDF(){
  var attData=(typeof attendance !== 'undefined' ? attendance : {});
  var staffRows=staff.map(function(s){
    var P=0,L=0,ED=0,A=0,total=0;
    Object.keys(attData).forEach(function(k){if(!k.startsWith(rptAttMonth)||!k.includes('-S-'+s.id))return;total++;var v=attData[k];if(v==='P')P++;else if(v==='L')L++;else if(v==='ED')ED++;else if(v==='A')A++;});
    var pct=total?Math.round((P+L+ED)/total*100):0;
    var c=pct>=90?'#16a34a':pct>=75?'#e09500':'#dc2626';
    return '<tr><td>'+esc(s.name)+'</td><td>'+esc(s.role)+'</td><td>'+esc(s.dept)+'</td>'
      +'<td style="color:#16a34a;font-weight:700;text-align:center">'+P+'</td><td style="color:#e09500;font-weight:700;text-align:center">'+L+'</td>'
      +'<td style="color:#ea580c;font-weight:700;text-align:center">'+ED+'</td><td style="color:#dc2626;font-weight:700;text-align:center">'+A+'</td>'
      +'<td style="text-align:center">'+total+'</td><td style="font-weight:800;color:'+c+';text-align:center">'+pct+'%</td></tr>';
  }).join('');
  var stuRows=students.map(function(s){
    var P=0,L=0,ED=0,A=0,total=0;
    Object.keys(attData).forEach(function(k){if(!k.startsWith(rptAttMonth)||!k.includes('-T-'+s.id))return;total++;var v=attData[k];if(v==='P')P++;else if(v==='L')L++;else if(v==='ED')ED++;else if(v==='A')A++;});
    var pct=total?Math.round((P+L+ED)/total*100):0;
    var c=pct>=90?'#16a34a':pct>=75?'#e09500':'#dc2626';
    return '<tr><td>'+esc(s.name)+'</td><td>'+esc(s.cls)+'</td><td>'+esc(s.roll)+'</td>'
      +'<td style="color:#16a34a;font-weight:700;text-align:center">'+P+'</td><td style="color:#e09500;font-weight:700;text-align:center">'+L+'</td>'
      +'<td style="color:#ea580c;font-weight:700;text-align:center">'+ED+'</td><td style="color:#dc2626;font-weight:700;text-align:center">'+A+'</td>'
      +'<td style="text-align:center">'+total+'</td><td style="font-weight:800;color:'+c+';text-align:center">'+pct+'%</td></tr>';
  }).join('');
  var bodyHTML='<div class="section-title">Staff Attendance -- '+rptAttMonth+'</div>'
    +'<table><thead><tr><th>Name</th><th>Role</th><th>Dept</th><th>Present</th><th>Late</th><th>Early Dep</th><th>Absent</th><th>Days</th><th>%</th></tr></thead><tbody>'+staffRows+'</tbody></table>'
    +'<div class="section-title">Student Attendance -- '+rptAttMonth+'</div>'
    +'<table><thead><tr><th>Name</th><th>Class</th><th>Roll</th><th>Present</th><th>Late</th><th>Early Dep</th><th>Absent</th><th>Days</th><th>%</th></tr></thead><tbody>'+stuRows+'</tbody></table>';
  rptOpenPrintWindowFull('Attendance Report -- '+rptAttMonth,(window.TENANT?window.TENANT.name+' | '+window.TENANT.address:'Guidance Navodaya & Sainik Institute | Khangabok Sorok Wangma, Thoubal, Manipur'),bodyHTML);
}
function rptAttDOC(){
  var attData=(typeof attendance !== 'undefined' ? attendance : {});
  var staffRows=''; staff.forEach(function(s){
    var P=0,L=0,ED=0,A=0,total=0;
    Object.keys(attData).forEach(function(k){if(!k.startsWith(rptAttMonth)||!k.includes('-S-'+s.id))return;total++;var v=attData[k];if(v==='P')P++;else if(v==='L')L++;else if(v==='ED')ED++;else if(v==='A')A++;});
    var pct=total?Math.round((P+L+ED)/total*100):0;
    staffRows+='<tr><td>'+esc(s.name)+'</td><td>'+esc(s.role)+'</td><td>'+esc(s.dept)+'</td><td>'+P+'</td><td>'+L+'</td><td>'+ED+'</td><td>'+A+'</td><td>'+total+'</td><td>'+pct+'%</td></tr>';
  });
  var stuRows=''; students.forEach(function(s){
    var P=0,L=0,ED=0,A=0,total=0;
    Object.keys(attData).forEach(function(k){if(!k.startsWith(rptAttMonth)||!k.includes('-T-'+s.id))return;total++;var v=attData[k];if(v==='P')P++;else if(v==='L')L++;else if(v==='ED')ED++;else if(v==='A')A++;});
    var pct=total?Math.round((P+L+ED)/total*100):0;
    stuRows+='<tr><td>'+esc(s.name)+'</td><td>'+esc(s.cls)+'</td><td>'+esc(s.roll)+'</td><td>'+P+'</td><td>'+L+'</td><td>'+ED+'</td><td>'+A+'</td><td>'+total+'</td><td>'+pct+'%</td></tr>';
  });
  var body='<div class="section-title">Staff Attendance -- '+rptAttMonth+'</div>'
    +'<table><thead><tr><th>Name</th><th>Role</th><th>Dept</th><th>P</th><th>L</th><th>ED</th><th>A</th><th>Days</th><th>%</th></tr></thead><tbody>'+staffRows+'</tbody></table>'
    +'<div class="section-title">Student Attendance -- '+rptAttMonth+'</div>'
    +'<table><thead><tr><th>Name</th><th>Class</th><th>Roll</th><th>P</th><th>L</th><th>ED</th><th>A</th><th>Days</th><th>%</th></tr></thead><tbody>'+stuRows+'</tbody></table>';
  downloadDOC('GNSI_Attendance_'+rptAttMonth+'.doc','Attendance Report -- '+rptAttMonth,(window.TENANT?window.TENANT.name:'Guidance Navodaya & Sainik Institute'),body);
}
function rptAttExcel(){
  var attData=(typeof attendance !== 'undefined' ? attendance : {});
  var staffRows=[['Name','Role','Department','Present','Late','Early Dep','Absent','Days Marked','Attendance %']];
  staff.forEach(function(s){
    var P=0,L=0,ED=0,A=0,total=0;
    Object.keys(attData).forEach(function(k){if(!k.startsWith(rptAttMonth)||!k.includes('-S-'+s.id))return;total++;var v=attData[k];if(v==='P')P++;else if(v==='L')L++;else if(v==='ED')ED++;else if(v==='A')A++;});
    staffRows.push([s.name,s.role,s.dept,P,L,ED,A,total,total?Math.round((P+L+ED)/total*100)+'%':'--']);
  });
  var stuRows=[['Name','Class','Roll No','Present','Late','Early Dep','Absent','Days Marked','Attendance %']];
  students.forEach(function(s){
    var P=0,L=0,ED=0,A=0,total=0;
    Object.keys(attData).forEach(function(k){if(!k.startsWith(rptAttMonth)||!k.includes('-T-'+s.id))return;total++;var v=attData[k];if(v==='P')P++;else if(v==='L')L++;else if(v==='ED')ED++;else if(v==='A')A++;});
    stuRows.push([s.name,s.cls,s.roll,P,L,ED,A,total,total?Math.round((P+L+ED)/total*100)+'%':'--']);
  });
  downloadXLSX('GNSI_Attendance_'+rptAttMonth+'.xlsx',[{name:'Staff Attendance',rows:staffRows},{name:'Student Attendance',rows:stuRows}]);
}
function rptAttCSV(){
  var attData=(typeof attendance !== 'undefined' ? attendance : {});
  var rows=[['Type','Name','Role/Class','Present','Late','Early Dep','Absent','Days','%']];
  staff.forEach(function(s){
    var P=0,L=0,ED=0,A=0,total=0;
    Object.keys(attData).forEach(function(k){if(!k.startsWith(rptAttMonth)||!k.includes('-S-'+s.id))return;total++;var v=attData[k];if(v==='P')P++;else if(v==='L')L++;else if(v==='ED')ED++;else if(v==='A')A++;});
    rows.push(['Staff',s.name,s.role,P,L,ED,A,total,total?Math.round((P+L+ED)/total*100)+'%':'--']);
  });
  students.forEach(function(s){
    var P=0,L=0,ED=0,A=0,total=0;
    Object.keys(attData).forEach(function(k){if(!k.startsWith(rptAttMonth)||!k.includes('-T-'+s.id))return;total++;var v=attData[k];if(v==='P')P++;else if(v==='L')L++;else if(v==='ED')ED++;else if(v==='A')A++;});
    rows.push(['Student',s.name,s.cls,P,L,ED,A,total,total?Math.round((P+L+ED)/total*100)+'%':'--']);
  });
  downloadCSV('GNSI_Attendance_'+rptAttMonth+'.csv',rows);
}
function rptStaffSection(){
  var deptCounts={};
  staff.forEach(function(s){deptCounts[s.dept]=(deptCounts[s.dept]||0)+1});
  var preview='<div class="card" style="margin-bottom:14px"><div style="overflow-x:auto"><table>'
    +'<thead><tr><th>Name</th><th>Role</th><th>Department</th><th>Status</th><th>Phone</th></tr></thead><tbody>'
    +staff.slice(0,8).map(function(s){
      var c=s.status==='Active'?'#16a34a':s.status==='On Leave'?'#e09500':'#dc2626';
      return '<tr><td><b>'+esc(s.name)+'</b></td><td>'+esc(s.role)+'</td><td>'+esc(s.dept)+'</td>'
        +'<td><span style="padding:2px 8px;border-radius:12px;font-size:10.5px;font-weight:700;background:'+c+'22;color:'+c+'">'+esc(s.status)+'</span></td>'
        +'<td style="font-family:\'JetBrains Mono\',monospace;font-size:12px">'+(maskPhone(s.phone)||'--')+'</td></tr>';
    }).join('')
    +'</tbody></table></div></div>';
  return rptExportBar('Staff Directory -- '+staff.length+' Members',[],{pdf:'rptStaffPDF()',excel:'rptStaffExcel()',doc:'rptStaffDOC()',csv:'rptStaffCSV()'})
    +'<div style="font-size:13px;font-weight:700;color:var(--on-surface);margin-bottom:10px">Staff Directory -- '+staff.length+' members (preview: first 8)</div>'
    +preview;
}
function rptStaffPDF(){
  var rows=staff.map(function(s){
    var c=s.status==='Active'?'#16a34a':s.status==='On Leave'?'#e09500':'#dc2626';
    return '<tr><td>'+esc(s.name)+'</td><td>'+esc(s.role)+'</td><td>'+esc(s.dept)+'</td>'
      +'<td><span class="badge" style="background:'+c+'22;color:'+c+'">'+esc(s.status)+'</span></td>'
      +'<td>'+(maskPhone(s.phone)||'--')+'</td><td>'+(s.email||'--')+'</td></tr>';
  }).join('');
  var bodyHTML='<div class="section-title">Staff Directory -- '+staff.length+' Members</div>'
    +'<table><thead><tr><th>Name</th><th>Role</th><th>Department</th><th>Status</th><th>Phone</th><th>Email</th></tr></thead><tbody>'+rows+'</tbody></table>';
  rptOpenPrintWindowFull('Staff Directory',(window.TENANT?window.TENANT.name+' | '+window.TENANT.address:'Guidance Navodaya & Sainik Institute | Khangabok Sorok Wangma, Thoubal, Manipur'),bodyHTML);
}
function rptStaffDOC(){
  var rows=''; staff.forEach(function(s){rows+='<tr><td>'+esc(s.name)+'</td><td>'+esc(s.role)+'</td><td>'+esc(s.dept)+'</td><td>'+esc(s.status)+'</td><td>'+(maskPhone(s.phone)||'--')+'</td><td>'+(s.email||'--')+'</td></tr>';});
  var body='<div class="section-title">Staff Directory -- '+staff.length+' Members</div>'
    +'<table><thead><tr><th>Name</th><th>Role</th><th>Department</th><th>Status</th><th>Phone</th><th>Email</th></tr></thead><tbody>'+rows+'</tbody></table>';
  downloadDOC('GNSI_Staff_Directory.doc','Staff Directory',(window.TENANT?window.TENANT.name:'Guidance Navodaya & Sainik Institute'),body);
}
function rptStaffExcel(){
  var rows=[['ID','Name','Role','Department','Status','Phone','Email']];
  staff.forEach(function(s){rows.push([s.id,s.name,s.role,s.dept,s.status,s.phone||'',s.email||''])});
  downloadXLSX('GNSI_Staff_'+new Date().toISOString().split('T')[0]+'.xlsx',[{name:'Staff Directory',rows:rows}]);
}
function rptStaffCSV(){
  var rows=[['ID','Name','Role','Department','Status','Phone','Email']];
  staff.forEach(function(s){rows.push([s.id,s.name,s.role,s.dept,s.status,s.phone||'',s.email||''])});
  downloadCSV('GNSI_Staff_'+new Date().toISOString().split('T')[0]+'.csv',rows);
}
function rptStudentsSection(){
  var paid=students.filter(function(s){return s.fees==='Paid';}).length;
  var hostel=students.filter(function(s){return s.hostel==='Yes';}).length;
  var preview='<div class="card" style="margin-bottom:14px"><div style="overflow-x:auto"><table>'
    +'<thead><tr><th>Name</th><th>Class</th><th>Roll No</th><th>Hostel</th><th>Fees</th><th>Phone</th></tr></thead><tbody>'
    +students.slice(0,8).map(function(s){
      var fc=s.fees==='Paid'?'#16a34a':'#dc2626';
      var hc=s.hostel==='Yes'?'#1435a0':'#6474a0';
      return '<tr><td><b>'+esc(s.name)+'</b></td><td>'+esc(s.cls)+'</td><td style="font-family:\'JetBrains Mono\',monospace">'+esc(s.roll)+'</td>'
        +'<td><span style="padding:2px 8px;border-radius:12px;font-size:10.5px;font-weight:700;background:'+hc+'22;color:'+hc+'">'+esc(s.hostel)+'</span></td>'
        +'<td><span style="padding:2px 8px;border-radius:12px;font-size:10.5px;font-weight:700;background:'+fc+'22;color:'+fc+'">'+esc(s.fees)+'</span></td>'
        +'<td style="font-family:\'JetBrains Mono\',monospace;font-size:12px">'+(maskPhone(s.phone)||'--')+'</td></tr>';
    }).join('')
    +'</tbody></table></div></div>';
  return rptExportBar('Student Register -- '+students.length+' Students',[],{pdf:'rptStudentsPDF()',excel:'rptStudentsExcel()',doc:'rptStudentsDOC()',csv:'rptStudentsCSV()'})
    +'<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:14px">'
    +'<div style="background:var(--surface);border:1px solid var(--border-soft);border-radius:10px;padding:12px 18px;min-width:130px"><div style="font-size:10px;color:var(--muted);font-family:\'JetBrains Mono\',monospace;text-transform:uppercase;letter-spacing:.08em">Total Students</div><div style="font-family:\'Playfair Display\',serif;font-size:28px;font-weight:700;color:var(--accent)">'+students.length+'</div></div>'
    +'<div style="background:var(--surface);border:1px solid var(--border-soft);border-radius:10px;padding:12px 18px;min-width:130px"><div style="font-size:10px;color:var(--muted);font-family:\'JetBrains Mono\',monospace;text-transform:uppercase;letter-spacing:.08em">Fees Paid</div><div style="font-family:\'Playfair Display\',serif;font-size:28px;font-weight:700;color:#16a34a">'+paid+'</div></div>'
    +'<div style="background:var(--surface);border:1px solid var(--border-soft);border-radius:10px;padding:12px 18px;min-width:130px"><div style="font-size:10px;color:var(--muted);font-family:\'JetBrains Mono\',monospace;text-transform:uppercase;letter-spacing:.08em">Hostel</div><div style="font-family:\'Playfair Display\',serif;font-size:28px;font-weight:700;color:#3b78c9">'+hostel+'</div></div>'
    +'</div>'
    +'<div style="font-size:13px;font-weight:700;color:var(--on-surface);margin-bottom:10px">Student Register -- '+students.length+' students (preview: first 8)</div>'
    +preview;
}
function rptStudentsPDF(){
  var rows=students.map(function(s){
    return '<tr><td>'+esc(s.name)+'</td><td>'+esc(s.cls)+'</td><td>'+esc(s.roll)+'</td><td>'+esc(s.hostel)+'</td><td>'+esc(s.fees)+'</td><td>'+(maskPhone(s.phone)||'--')+'</td></tr>';
  }).join('');
  var bodyHTML='<div class="section-title">Student Register -- '+students.length+' Students</div>'
    +'<table><thead><tr><th>Name</th><th>Class</th><th>Roll No</th><th>Hostel</th><th>Fees</th><th>Phone</th></tr></thead><tbody>'+rows+'</tbody></table>';
  rptOpenPrintWindowFull('Student Register',(window.TENANT?window.TENANT.name+' | '+window.TENANT.address:'Guidance Navodaya & Sainik Institute | Khangabok Sorok Wangma, Thoubal, Manipur'),bodyHTML);
}
function rptStudentsDOC(){
  var rows=''; students.forEach(function(s){rows+='<tr><td>'+esc(s.name)+'</td><td>'+esc(s.cls)+'</td><td>'+esc(s.roll)+'</td><td>'+esc(s.hostel)+'</td><td>'+esc(s.fees)+'</td><td>'+(maskPhone(s.phone)||'--')+'</td></tr>';});
  var body='<div class="section-title">Student Register -- '+students.length+' Students</div>'
    +'<table><thead><tr><th>Name</th><th>Class</th><th>Roll No</th><th>Hostel</th><th>Fees</th><th>Phone</th></tr></thead><tbody>'+rows+'</tbody></table>';
  downloadDOC('GNSI_Student_Register.doc','Student Register',(window.TENANT?window.TENANT.name:'Guidance Navodaya & Sainik Institute'),body);
}
function rptStudentsExcel(){
  var rows=[['Roll No','Name','Class','Hostel','Fees Status','Phone']];
  students.forEach(function(s){rows.push([s.roll,s.name,s.cls,s.hostel,s.fees,s.phone||''])});
  downloadXLSX('GNSI_Students_'+new Date().toISOString().split('T')[0]+'.xlsx',[{name:'Student Register',rows:rows}]);
}
function rptStudentsCSV(){
  var rows=[['Roll No','Name','Class','Hostel','Fees Status','Phone']];
  students.forEach(function(s){rows.push([s.roll,s.name,s.cls,s.hostel,s.fees,s.phone||''])});
  downloadCSV('GNSI_Students_'+new Date().toISOString().split('T')[0]+'.csv',rows);
}
function rptSalarySection(){
  var sc=loadSalConf();var advances=loadAdvances();var periods=getAllActivePeriods();var pa=loadPAtt();
  var teachers=getAllTeachers();
  var rptMonth=psReportMonth;
  var sRows=teachers.map(function(t){
    var conf=sc[t]||{monthly:0,subRate:100,workDays:26,periodsPerDay:5};
    var ppr=conf.monthly&&conf.workDays&&conf.periodsPerDay?conf.monthly/(conf.workDays*conf.periodsPerDay):0;
    var pres=0,abs=0,subAs=0,asSub=0,assigned=0;
    Object.keys(pa).forEach(function(k){if(!k.startsWith(rptMonth))return;var pts=k.split('|');if(pts.length<3)return;var p=periods.find(function(x){return x.id===pts[1]});if(!p)return;var cell=p[pts[2]];if(!cell||!cell.teacher)return;var val=pa[k]||{status:''};if(cell.teacher===t){assigned++;if(val.status==='P')pres++;else if(val.status==='A')abs++;else if(val.status==='S')subAs++;}if(val.status==='S'&&val.sub===t)asSub++;});
    var adv=advances.filter(function(a){return a.staffName===t&&!a.settled&&a.date.startsWith(rptMonth)}).reduce(function(s,a){return s+a.amount},0);
    var gross=conf.monthly||0;
    var ded=(abs+subAs)*ppr;
    var subEarn=asSub*(conf.subRate||100);
    var net=gross-ded+subEarn-adv;
    var c=net<gross*0.8?'#dc2626':net>=gross?'#16a34a':'#e09500';
    return{t,gross,ded,subEarn,adv,net,pres,abs,asSub,assigned,c};
  });
  var preview='<div class="card" style="margin-bottom:14px"><div style="overflow-x:auto"><table>'
    +'<thead><tr><th>Teacher</th><th>Gross</th><th>Deduction</th><th>Sub Earned</th><th>Advance</th><th>Net Salary</th></tr></thead><tbody>'
    +sRows.slice(0,8).map(function(r){return'<tr><td><b>'+esc(r.t)+'</b></td><td style="font-family:\'JetBrains Mono\',monospace">&#8377;'+r.gross.toLocaleString()+'</td><td style="color:#dc2626;font-family:\'JetBrains Mono\',monospace">-&#8377;'+r.ded.toFixed(0)+'</td><td style="color:#16a34a;font-family:\'JetBrains Mono\',monospace">+&#8377;'+r.subEarn.toFixed(0)+'</td><td style="color:#8b5cf6;font-family:\'JetBrains Mono\',monospace">'+(r.adv?'-&#8377;'+r.adv.toLocaleString():'--')+'</td><td style="font-weight:800;color:'+r.c+';font-family:\'JetBrains Mono\',monospace">&#8377;'+r.net.toFixed(0)+'</td></tr>'}).join('')
    +'</tbody></table></div></div>';
  return rptExportBar('Salary Statement -- '+psReportMonth,[],{pdf:'rptSalaryPDF()',excel:'rptSalaryExcel()',doc:'rptSalaryDOC()',csv:'rptSalaryCSV()'})
    +'<div style="font-size:13px;font-weight:700;color:var(--on-surface);margin-bottom:10px">Salary Statement -- '+psReportMonth+' (preview: first 8)</div>'
    +preview
    +'<div style="font-size:12px;color:var(--muted)">Change month in the Period &amp; Salary &#8594; Salary Report tab.</div>';
}
function rptSalaryPDF(){
  var sc=loadSalConf();var advances=loadAdvances();var periods=getAllActivePeriods();var pa=loadPAtt();
  var teachers=getAllTeachers();var rptMonth=psReportMonth;
  var totalNet=0;
  var rows=teachers.map(function(t){
    var conf=sc[t]||{monthly:0,subRate:100,workDays:26,periodsPerDay:5};
    var ppr=conf.monthly&&conf.workDays&&conf.periodsPerDay?conf.monthly/(conf.workDays*conf.periodsPerDay):0;
    var pres=0,abs=0,subAs=0,asSub=0;
    Object.keys(pa).forEach(function(k){if(!k.startsWith(rptMonth))return;var pts=k.split('|');if(pts.length<3)return;var p=periods.find(function(x){return x.id===pts[1]});if(!p)return;var cell=p[pts[2]];if(!cell||!cell.teacher)return;var val=pa[k]||{status:''};if(cell.teacher===t){if(val.status==='P')pres++;else if(val.status==='A')abs++;else if(val.status==='S')subAs++;}if(val.status==='S'&&val.sub===t)asSub++;});
    var adv=advances.filter(function(a){return a.staffName===t&&!a.settled&&a.date.startsWith(rptMonth)}).reduce(function(s,a){return s+a.amount},0);
    var gross=conf.monthly||0;var ded=(abs+subAs)*ppr;var subEarn=asSub*(conf.subRate||100);var net=gross-ded+subEarn-adv;
    totalNet+=net;
    var c=net<gross*0.8?'#dc2626':net>=gross?'#16a34a':'#e09500';
    return'<tr><td>'+esc(t)+'</td><td style="text-align:center">'+pres+'</td><td style="text-align:center;color:#dc2626">'+abs+'</td><td style="text-align:center;color:#16a34a">'+asSub+'</td><td style="text-align:right">₹'+gross.toLocaleString()+'</td><td style="text-align:right;color:#dc2626">-₹'+ded.toFixed(0)+'</td><td style="text-align:right;color:#16a34a">'+(subEarn?'+₹'+subEarn.toFixed(0):'--')+'</td><td style="text-align:right;color:#8b5cf6">'+(adv?'-₹'+adv.toLocaleString():'--')+'</td><td style="text-align:right;font-weight:800;color:'+c+'">₹'+net.toFixed(0)+'</td></tr>';
  }).join('');
  var bodyHTML='<div class="section-title">Salary Statement -- '+rptMonth+'</div>'
    +'<table><thead><tr><th>Teacher</th><th>Present</th><th>Absent</th><th>As Sub</th><th style="text-align:right">Gross</th><th style="text-align:right">Deduction</th><th style="text-align:right">Sub Earned</th><th style="text-align:right">Advance</th><th style="text-align:right">Net Salary</th></tr></thead>'
    +'<tbody>'+rows+'</tbody>'
    +'<tfoot style="background:#f0f4ff"><tr><td colspan="8" style="padding:10px 12px;font-weight:800;font-size:13px">Total Net Payable</td><td style="padding:10px 12px;text-align:right;font-weight:800;color:#16a34a;font-size:14px">₹'+totalNet.toFixed(0)+'</td></tr></tfoot></table>';
  rptOpenPrintWindowFull('Salary Statement -- '+rptMonth,(window.TENANT?window.TENANT.name+' | '+window.TENANT.address:'Guidance Navodaya & Sainik Institute | Khangabok Sorok Wangma, Thoubal, Manipur'),bodyHTML);
}
function rptSalaryDOC(){
  var sc=loadSalConf();var advances=loadAdvances();var periods=getAllActivePeriods();var pa=loadPAtt();
  var teachers=getAllTeachers();var rptMonth=psReportMonth;
  var rows=''; var totalNet=0;
  teachers.forEach(function(t){
    var conf=sc[t]||{monthly:0,subRate:100,workDays:26,periodsPerDay:5};
    var ppr=conf.monthly&&conf.workDays&&conf.periodsPerDay?conf.monthly/(conf.workDays*conf.periodsPerDay):0;
    var pres=0,abs=0,subAs=0,asSub=0;
    Object.keys(pa).forEach(function(k){if(!k.startsWith(rptMonth))return;var pts=k.split('|');if(pts.length<3)return;var p=periods.find(function(x){return x.id===pts[1]});if(!p)return;var cell=p[pts[2]];if(!cell||!cell.teacher)return;var val=pa[k]||{status:''};if(cell.teacher===t){if(val.status==='P')pres++;else if(val.status==='A')abs++;else if(val.status==='S')subAs++;}if(val.status==='S'&&val.sub===t)asSub++;});
    var adv=advances.filter(function(a){return a.staffName===t&&!a.settled&&a.date.startsWith(rptMonth)}).reduce(function(s,a){return s+a.amount},0);
    var gross=conf.monthly||0;var ded=(abs+subAs)*ppr;var subEarn=asSub*(conf.subRate||100);var net=gross-ded+subEarn-adv;
    totalNet+=net;
    rows+='<tr><td>'+esc(t)+'</td><td>'+pres+'</td><td>'+abs+'</td><td>'+asSub+'</td><td>₹'+gross.toLocaleString()+'</td><td>-₹'+ded.toFixed(0)+'</td><td>'+(subEarn?'+₹'+subEarn.toFixed(0):'--')+'</td><td>'+(adv?'-₹'+adv.toLocaleString():'--')+'</td><td>₹'+net.toFixed(0)+'</td></tr>';
  });
  var body='<div class="section-title">Salary Statement -- '+rptMonth+'</div>'
    +'<table><thead><tr><th>Teacher</th><th>Present</th><th>Absent</th><th>As Sub</th><th>Gross</th><th>Deduction</th><th>Sub Earned</th><th>Advance</th><th>Net Salary</th></tr></thead>'
    +'<tbody>'+rows+'</tbody>'
    +'<tfoot><tr><td colspan="8"><b>Total Net Payable</b></td><td><b>₹'+totalNet.toFixed(0)+'</b></td></tr></tfoot></table>';
  downloadDOC('GNSI_Salary_'+rptMonth+'.doc','Salary Statement -- '+rptMonth,(window.TENANT?window.TENANT.name:'Guidance Navodaya & Sainik Institute'),body);
}
function rptSalaryExcel(){
  var sc=loadSalConf();var advances=loadAdvances();var periods=getAllActivePeriods();var pa=loadPAtt();
  var teachers=getAllTeachers();var rptMonth=psReportMonth;
  var rows=[['Teacher','Present Periods','Absent Periods','As Substitute','Gross Salary (Rs)','Deductions (Rs)','Sub Earned (Rs)','Advance (Rs)','Net Salary (Rs)']];
  teachers.forEach(function(t){
    var conf=sc[t]||{monthly:0,subRate:100,workDays:26,periodsPerDay:5};
    var ppr=conf.monthly&&conf.workDays&&conf.periodsPerDay?conf.monthly/(conf.workDays*conf.periodsPerDay):0;
    var pres=0,abs=0,subAs=0,asSub=0;
    Object.keys(pa).forEach(function(k){if(!k.startsWith(rptMonth))return;var pts=k.split('|');if(pts.length<3)return;var p=periods.find(function(x){return x.id===pts[1]});if(!p)return;var cell=p[pts[2]];if(!cell||!cell.teacher)return;var val=pa[k]||{status:''};if(cell.teacher===t){if(val.status==='P')pres++;else if(val.status==='A')abs++;else if(val.status==='S')subAs++;}if(val.status==='S'&&val.sub===t)asSub++;});
    var adv=advances.filter(function(a){return a.staffName===t&&!a.settled&&a.date.startsWith(rptMonth)}).reduce(function(s,a){return s+a.amount},0);
    var gross=conf.monthly||0;var ded=(abs+subAs)*ppr;var subEarn=asSub*(conf.subRate||100);var net=gross-ded+subEarn-adv;
    rows.push([t,pres,abs,asSub,gross,parseFloat(ded.toFixed(2)),parseFloat(subEarn.toFixed(2)),adv,parseFloat(net.toFixed(2))]);
  });
  downloadXLSX('GNSI_Salary_'+rptMonth+'.xlsx',[{name:'Salary Statement',rows:rows}]);
}
function rptSalaryCSV(){
  var sc=loadSalConf();var advances=loadAdvances();var periods=getAllActivePeriods();var pa=loadPAtt();
  var teachers=getAllTeachers();var rptMonth=psReportMonth;
  var rows=[['Teacher','Present Periods','Absent Periods','As Substitute','Gross','Deductions','Sub Earned','Advance','Net Salary']];
  teachers.forEach(function(t){
    var conf=sc[t]||{monthly:0,subRate:100,workDays:26,periodsPerDay:5};
    var ppr=conf.monthly&&conf.workDays&&conf.periodsPerDay?conf.monthly/(conf.workDays*conf.periodsPerDay):0;
    var pres=0,abs=0,subAs=0,asSub=0;
    Object.keys(pa).forEach(function(k){if(!k.startsWith(rptMonth))return;var pts=k.split('|');if(pts.length<3)return;var p=periods.find(function(x){return x.id===pts[1]});if(!p)return;var cell=p[pts[2]];if(!cell||!cell.teacher)return;var val=pa[k]||{status:''};if(cell.teacher===t){if(val.status==='P')pres++;else if(val.status==='A')abs++;else if(val.status==='S')subAs++;}if(val.status==='S'&&val.sub===t)asSub++;});
    var adv=advances.filter(function(a){return a.staffName===t&&!a.settled&&a.date.startsWith(rptMonth)}).reduce(function(s,a){return s+a.amount},0);
    var gross=conf.monthly||0;var ded=(abs+subAs)*ppr;var subEarn=asSub*(conf.subRate||100);var net=gross-ded+subEarn-adv;
    rows.push([t,pres,abs,asSub,gross,ded.toFixed(2),subEarn.toFixed(2),adv,net.toFixed(2)]);
  });
  downloadCSV('GNSI_Salary_'+rptMonth+'.csv',rows);
}
function rptTimetableSection(){
  var cols=getTTCols();var periods=loadTTPeriods().filter(function(p){return !p.isBreak});
  return rptExportBar('Class Timetable',[],{pdf:'rptTimetablePDF()',excel:'rptTimetableExcel()',doc:'rptTimetableDOC()',csv:'rptTimetableCSV()'})
    +'<div class="card"><div style="overflow-x:auto"><table>'
    +'<thead><tr><th>Time</th>'+cols.map(function(c){return'<th style="background:'+c.color+';color:#fff">'+esc(c.label)+'</th>'}).join('')+'</tr></thead>'
    +'<tbody>'+periods.map(function(p){return'<tr><td style="font-family:\'JetBrains Mono\',monospace;font-size:11px;font-weight:700;white-space:nowrap">'+esc(p.time)+'</td>'+cols.map(function(c){var cell=p[c.key]||{sub:'',teacher:''};return'<td style="text-align:center"><div style="font-weight:700;color:'+c.color+'">'+esc(cell.sub||'--')+'</div><div style="font-size:11px;color:#6474a0">'+esc(cell.teacher||'')+'</div></td>'}).join('')+'</tr>'}).join('')
    +'</tbody></table></div></div>';
}
function rptTimetablePDF(){
  var cols=getTTCols();var periods=loadTTPeriods();
  var allRows=periods.map(function(p){
    if(p.isBreak)return'<tr style="background:#f0f4fb"><td>'+esc(p.time)+'</td><td colspan="'+cols.length+'" style="text-align:center;color:#6474a0;letter-spacing:.1em">☕ '+esc(p.breakLabel)+'</td></tr>';
    return'<tr><td style="font-weight:700;white-space:nowrap">'+esc(p.time)+'</td>'
      +cols.map(function(c){var cell=p[c.key]||{sub:'',teacher:''};return'<td style="text-align:center"><b>'+esc(cell.sub||'--')+'</b><br><small style="color:#6474a0">'+esc(cell.teacher||'')+'</small></td>'}).join('')+'</tr>';
  }).join('');
  var bodyHTML='<div class="section-title">Class Timetable -- Monday to Saturday</div>'
    +'<table><thead><tr><th>Time</th>'+cols.map(function(c){return'<th style="background:'+c.color+';color:#fff">'+esc(c.label)+'</th>'}).join('')+'</tr></thead><tbody>'+allRows+'</tbody></table>';
  rptOpenPrintWindowFull('Class Timetable',(window.TENANT?window.TENANT.name+' | '+window.TENANT.address:'Guidance Navodaya & Sainik Institute | Khangabok Sorok Wangma, Thoubal, Manipur'),bodyHTML);
}
function rptTimetableDOC(){
  var cols=getTTCols();var periods=loadTTPeriods();
  var rows='';
  periods.forEach(function(p){
    if(p.isBreak){rows+='<tr style="background:#f0f4fb"><td>'+esc(p.time)+'</td><td colspan="'+cols.length+'">☕ BREAK -- '+esc(p.breakLabel)+'</td></tr>';return;}
    rows+='<tr><td>'+esc(p.time)+'</td>'+cols.map(function(c){var cell=p[c.key]||{sub:'',teacher:''};return'<td>'+esc(cell.sub||'--')+'<br><small>'+esc(cell.teacher||'')+'</small></td>'}).join('')+'</tr>';
  });
  var body='<div class="section-title">Class Timetable -- Monday to Saturday</div>'
    +'<table><thead><tr><th>Time</th>'+cols.map(function(c){return'<th>'+esc(c.label)+'</th>'}).join('')+'</tr></thead><tbody>'+rows+'</tbody></table>';
  downloadDOC('GNSI_Timetable.doc','Class Timetable',(window.TENANT?window.TENANT.name:'Guidance Navodaya & Sainik Institute'),body);
}
function rptTimetableExcel(){
  var cols=getTTCols();var periods=loadTTPeriods();
  var hdr=['Time (Mon-Sat)'].concat(cols.map(function(c){return c.label+' - Subject'})).concat(cols.map(function(c){return c.label+' - Teacher'}));
  var rows=[hdr];
  periods.forEach(function(p){
    if(p.isBreak){rows.push([p.time,'BREAK -- '+p.breakLabel].concat(cols.map(function(){return''})).concat(cols.map(function(){return''})));return}
    var r=[p.time];
    cols.forEach(function(c){var cell=p[c.key]||{sub:'',teacher:''};r.push(cell.sub||'')});
    cols.forEach(function(c){var cell=p[c.key]||{sub:'',teacher:''};r.push(cell.teacher||'')});
    rows.push(r);
  });
  downloadXLSX('GNSI_Timetable_'+new Date().toISOString().split('T')[0]+'.xlsx',[{name:'Class Timetable',rows:rows}]);
}
function rptTimetableCSV(){
  var cols=getTTCols();var periods=loadTTPeriods();
  var rows=[['Time'].concat(cols.reduce(function(a,c){return a.concat([c.label+' Subject',c.label+' Teacher'])},[])) ];
  periods.forEach(function(p){
    if(p.isBreak){rows.push([p.time,'BREAK'].concat(cols.reduce(function(a){return a.concat(['',''])},[])));return}
    var r=[p.time];
    cols.forEach(function(c){var cell=p[c.key]||{sub:'',teacher:''};r.push(cell.sub||'',cell.teacher||'')});
    rows.push(r);
  });
  downloadCSV('GNSI_Timetable_'+new Date().toISOString().split('T')[0]+'.csv',rows);
}
function rptFeesSection(){
  var admRecs=loadAdmissionRecords();
  var monthRecs=loadMonthlyRecords();
  var incRecs=loadIncomeLedger();
  var expRecs=loadExpLedger();
  var totalAdm=admRecs.reduce(function(s,r){return s+(r.amountPaid||0);},0);
  var totalMonth=monthRecs.reduce(function(s,r){return s+(r.amountPaid||0);},0);
  var totalInc=incRecs.reduce(function(s,r){return s+(r.amount||0);},0);
  var totalExp=expRecs.reduce(function(s,r){return s+(r.amount||0);},0);
  var surplus=totalInc-totalExp;
  var preview='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px;margin-bottom:20px">'
    +'<div class="stat-card" style="--c:#16a34a"><div class="stat-label">Admission Fees</div><div class="stat-val" style="font-size:28px">₹'+Math.round(totalAdm/1000)+'K</div><div class="stat-sub">'+admRecs.length+' records</div></div>'
    +'<div class="stat-card" style="--c:#3b78c9"><div class="stat-label">Monthly Fees</div><div class="stat-val" style="font-size:28px">₹'+Math.round(totalMonth/1000)+'K</div><div class="stat-sub">'+monthRecs.length+' records</div></div>'
    +'<div class="stat-card" style="--c:#8b5cf6"><div class="stat-label">Total Income</div><div class="stat-val" style="font-size:28px">₹'+Math.round(totalInc/1000)+'K</div><div class="stat-sub">'+incRecs.length+' entries</div></div>'
    +'<div class="stat-card" style="--c:#dc2626"><div class="stat-label">Expenditure</div><div class="stat-val" style="font-size:28px">₹'+Math.round(totalExp/1000)+'K</div><div class="stat-sub">'+expRecs.length+' entries</div></div>'
    +'<div class="stat-card" style="--c:'+(surplus>=0?'#16a34a':'#dc2626')+'"><div class="stat-label">Net Surplus</div><div class="stat-val" style="font-size:28px">'+(surplus>=0?'':'−')+'₹'+Math.round(Math.abs(surplus)/1000)+'K</div><div class="stat-sub">'+(surplus>=0?'Surplus':'Deficit')+'</div></div>'
    +'</div>';
  return rptExportBar('Fee Records & Finance',[],{pdf:'rptFeesPDF()',excel:'rptFeesExcel()',doc:'rptFeesDOC()',csv:'rptFeesCSV()'})
    +preview;
}
function rptFeesPDF(){
  var admRecs=loadAdmissionRecords();var monthRecs=loadMonthlyRecords();
  var incRecs=loadIncomeLedger();var expRecs=loadExpLedger();
  var totalAdm=admRecs.reduce(function(s,r){return s+(r.amountPaid||0);},0);
  var totalMonth=monthRecs.reduce(function(s,r){return s+(r.amountPaid||0);},0);
  var totalInc=incRecs.reduce(function(s,r){return s+(r.amount||0);},0);
  var totalExp=expRecs.reduce(function(s,r){return s+(r.amount||0);},0);
  var surplus=totalInc-totalExp;
  var admRows=admRecs.map(function(r){return'<tr><td>'+esc(r.date||'')+'</td><td>'+esc(r.student||'')+'</td><td>'+esc(r.course||'')+'</td><td style="text-align:right;font-weight:700;color:#16a34a">₹'+(r.amountPaid||0).toLocaleString()+'</td><td>'+esc(r.receipt||'--')+'</td></tr>';}).join('');
  var mthRows=monthRecs.map(function(r){return'<tr><td>'+esc(r.date||'')+'</td><td>'+esc(r.student||'')+'</td><td>'+esc(r.forMonth||'')+'</td><td style="text-align:right;font-weight:700;color:#16a34a">₹'+(r.amountPaid||0).toLocaleString()+'</td><td>'+esc(r.receipt||'--')+'</td></tr>';}).join('');
  var incRows=incRecs.map(function(r){return'<tr><td>'+esc(r.date||'')+'</td><td>'+esc(r.category||'')+'</td><td>'+esc(r.description||'')+'</td><td style="text-align:right;color:#16a34a;font-weight:700">₹'+(r.amount||0).toLocaleString()+'</td></tr>';}).join('');
  var expRows=expRecs.map(function(r){return'<tr><td>'+esc(r.date||'')+'</td><td>'+esc(r.category||'')+'</td><td>'+esc(r.description||'')+'</td><td style="text-align:right;color:#dc2626;font-weight:700">₹'+(r.amount||0).toLocaleString()+'</td></tr>';}).join('');
  var bodyHTML='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px">'
    +'<div style="border-radius:8px;border:1px solid #d0d9ef;padding:14px;text-align:center;background:#f0fdf4"><div style="font-size:22px;font-weight:800;color:#16a34a">₹'+totalAdm.toLocaleString()+'</div><div style="font-size:10px;text-transform:uppercase;color:#16a34a;font-weight:700">Admission Fees</div></div>'
    +'<div style="border-radius:8px;border:1px solid #d0d9ef;padding:14px;text-align:center;background:#eff6ff"><div style="font-size:22px;font-weight:800;color:#1e40af">₹'+totalMonth.toLocaleString()+'</div><div style="font-size:10px;text-transform:uppercase;color:#1e40af;font-weight:700">Monthly Fees</div></div>'
    +'<div style="border-radius:8px;border:1px solid #d0d9ef;padding:14px;text-align:center;background:'+(surplus>=0?'#f0fdf4':'#fef2f2')+'"><div style="font-size:22px;font-weight:800;color:'+(surplus>=0?'#16a34a':'#dc2626')+'">'+(surplus>=0?'+':'−')+'₹'+Math.abs(surplus).toLocaleString()+'</div><div style="font-size:10px;text-transform:uppercase;color:'+(surplus>=0?'#16a34a':'#dc2626')+';font-weight:700">'+(surplus>=0?'Surplus':'Deficit')+'</div></div>'
    +'</div>'
    +'<div class="section-title">Admission Fee Records</div>'
    +'<table><thead><tr><th>Date</th><th>Student</th><th>Course</th><th style="text-align:right">Amount</th><th>Receipt</th></tr></thead><tbody>'+(admRows||'<tr><td colspan="5" style="text-align:center;color:#6474a0">No records.</td></tr>')+'</tbody></table>'
    +'<div class="section-title">Monthly Fee Records</div>'
    +'<table><thead><tr><th>Date</th><th>Student</th><th>Month</th><th style="text-align:right">Amount</th><th>Receipt</th></tr></thead><tbody>'+(mthRows||'<tr><td colspan="5" style="text-align:center;color:#6474a0">No records.</td></tr>')+'</tbody></table>'
    +'<div class="section-title">Income Ledger</div>'
    +'<table><thead><tr><th>Date</th><th>Category</th><th>Description</th><th style="text-align:right">Amount</th></tr></thead><tbody>'+(incRows||'<tr><td colspan="4" style="text-align:center;color:#6474a0">No records.</td></tr>')+'</tbody><tfoot style="background:#f0fdf4"><tr><td colspan="3" style="padding:10px 12px;font-weight:800">Total Income</td><td style="padding:10px 12px;text-align:right;font-weight:800;color:#16a34a">₹'+totalInc.toLocaleString()+'</td></tr></tfoot></table>'
    +'<div class="section-title">Expenditure Ledger</div>'
    +'<table><thead><tr><th>Date</th><th>Category</th><th>Description</th><th style="text-align:right">Amount</th></tr></thead><tbody>'+(expRows||'<tr><td colspan="4" style="text-align:center;color:#6474a0">No records.</td></tr>')+'</tbody><tfoot style="background:#fef2f2"><tr><td colspan="3" style="padding:10px 12px;font-weight:800">Total Expenditure</td><td style="padding:10px 12px;text-align:right;font-weight:800;color:#dc2626">₹'+totalExp.toLocaleString()+'</td></tr></tfoot></table>'
    +'<div style="border-top:2px solid #1433a8;padding-top:14px;display:flex;justify-content:space-between;align-items:center;margin-top:10px">'
    +'<div style="font-size:16px;font-weight:700">Net '+(surplus>=0?'Surplus':'Deficit')+'</div>'
    +'<div style="font-size:20px;font-weight:800;color:'+(surplus>=0?'#16a34a':'#dc2626')+'">'+(surplus>=0?'+':'−')+'₹'+Math.abs(surplus).toLocaleString()+'</div></div>';
  rptOpenPrintWindowFull('Fee Records & Finance Report',(window.TENANT?window.TENANT.name+' | '+window.TENANT.address:'Guidance Navodaya & Sainik Institute | Khangabok Sorok Wangma, Thoubal, Manipur'),bodyHTML);
}
function rptFeesDOC(){
  var admRecs=loadAdmissionRecords();var monthRecs=loadMonthlyRecords();
  var incRecs=loadIncomeLedger();var expRecs=loadExpLedger();
  var totalInc=incRecs.reduce(function(s,r){return s+(r.amount||0);},0);
  var totalExp=expRecs.reduce(function(s,r){return s+(r.amount||0);},0);
  var surplus=totalInc-totalExp;
  var admRows=''; admRecs.forEach(function(r){admRows+='<tr><td>'+esc(r.date||'')+'</td><td>'+esc(r.student||'')+'</td><td>'+esc(r.course||'')+'</td><td>₹'+(r.amountPaid||0).toLocaleString()+'</td></tr>';});
  var mthRows=''; monthRecs.forEach(function(r){mthRows+='<tr><td>'+esc(r.date||'')+'</td><td>'+esc(r.student||'')+'</td><td>'+esc(r.forMonth||'')+'</td><td>₹'+(r.amountPaid||0).toLocaleString()+'</td></tr>';});
  var incRows=''; incRecs.forEach(function(r){incRows+='<tr><td>'+esc(r.date||'')+'</td><td>'+esc(r.category||'')+'</td><td>'+esc(r.description||'')+'</td><td>₹'+(r.amount||0).toLocaleString()+'</td></tr>';});
  var expRows=''; expRecs.forEach(function(r){expRows+='<tr><td>'+esc(r.date||'')+'</td><td>'+esc(r.category||'')+'</td><td>'+esc(r.description||'')+'</td><td>₹'+(r.amount||0).toLocaleString()+'</td></tr>';});
  var body='<div class="section-title">Admission Fees</div><table><thead><tr><th>Date</th><th>Student</th><th>Course</th><th>Amount</th></tr></thead><tbody>'+admRows+'</tbody></table>'
    +'<div class="section-title">Monthly Fees</div><table><thead><tr><th>Date</th><th>Student</th><th>Month</th><th>Amount</th></tr></thead><tbody>'+mthRows+'</tbody></table>'
    +'<div class="section-title">Income Ledger (Total: ₹'+totalInc.toLocaleString()+')</div><table><thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th></tr></thead><tbody>'+incRows+'</tbody></table>'
    +'<div class="section-title">Expenditure (Total: ₹'+totalExp.toLocaleString()+')</div><table><thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th></tr></thead><tbody>'+expRows+'</tbody></table>'
    +'<p style="font-size:14pt;font-weight:bold;color:'+(surplus>=0?'#16a34a':'#dc2626')+'">Net '+(surplus>=0?'Surplus':'Deficit')+': '+(surplus>=0?'+':'−')+'₹'+Math.abs(surplus).toLocaleString()+'</p>';
  downloadDOC('GNSI_Finance_Report.doc','Fee Records & Finance Report',(window.TENANT?window.TENANT.name:'Guidance Navodaya & Sainik Institute'),body);
}
function rptFeesExcel(){
  var admRecs=loadAdmissionRecords();var monthRecs=loadMonthlyRecords();
  var incRecs=loadIncomeLedger();var expRecs=loadExpLedger();
  var admRows=[['Date','Student','Course','Amount Paid','Receipt']];
  admRecs.forEach(function(r){admRows.push([r.date||'',r.student||'',r.course||'',r.amountPaid||0,r.receipt||'']);});
  var mthRows=[['Date','Student','Course','Month','Tuition Fee','Hostel Fee','Amount Paid','Receipt']];
  monthRecs.forEach(function(r){mthRows.push([r.date||'',r.student||'',r.course||'',r.forMonth||'',r.tuitionFee||0,r.hostelFee||0,r.amountPaid||0,r.receipt||'']);});
  var incRows=[['Date','Category','Description','Amount']];
  incRecs.forEach(function(r){incRows.push([r.date||'',r.category||'',r.description||'',r.amount||0]);});
  var expRows=[['Date','Category','Description','Amount','Reference','Approved By']];
  expRecs.forEach(function(r){expRows.push([r.date||'',r.category||'',r.description||'',r.amount||0,r.reference||'',r.approvedBy||'']);});
  downloadXLSX('GNSI_Finance_'+new Date().toISOString().split('T')[0]+'.xlsx',[
    {name:'Admission Fees',rows:admRows},
    {name:'Monthly Fees',rows:mthRows},
    {name:'Income',rows:incRows},
    {name:'Expenditure',rows:expRows}
  ]);
}
function rptFeesCSV(){
  var admRecs=loadAdmissionRecords();
  var rows=[['Date','Student','Course','Amount Paid','Receipt']];
  admRecs.forEach(function(r){rows.push([r.date||'',r.student||'',r.course||'',r.amountPaid||0,r.receipt||'']);});
  downloadCSV('GNSI_AdmissionFees.csv',rows);
}
function rptHostelSection(){
  var leave=hmLoad('leave');var sick=hmLoad('sick');var outpass=hmLoad('outpass');var outing=hmLoad('outing');
  var complaints=hmLoad('complaints');
  var stats=[
    {l:'Leave Records',v:leave.length,c:'#3b78c9'},
    {l:'Sick Bay',v:sick.length,c:'#dc2626'},
    {l:'Outpass',v:outpass.length,c:'#8b5cf6'},
    {l:'Outing',v:outing.length,c:'#e09500'},
    {l:'Complaints',v:complaints.length,c:'#16a34a'}
  ];
  var statCards='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-bottom:20px">'
    +stats.map(function(s){return'<div class="stat-card" style="--c:'+s.c+'"><div class="stat-label">'+s.l+'</div><div class="stat-val" style="font-size:32px">'+s.v+'</div></div>'}).join('')
    +'</div>';
  return rptExportBar('Hostel Management Report',[],{pdf:'rptHostelPDF()',excel:'rptHostelExcel()',doc:'rptHostelDOC()',csv:'rptHostelCSV()'})
    +statCards;
}
function rptHostelPDF(){
  var leave=hmLoad('leave');var sick=hmLoad('sick');var outpass=hmLoad('outpass');var outing=hmLoad('outing');
  var leaveRows=leave.map(function(r){return'<tr><td>'+esc(r.studentName||'')+'</td><td>'+esc(r.from||'')+'</td><td>'+esc(r.to||'')+'</td><td>'+esc(r.reason||'')+'</td><td>'+esc(r.status||'')+'</td></tr>';}).join('');
  var sickRows=sick.map(function(r){return'<tr><td>'+esc(r.studentName||'')+'</td><td>'+esc(r.date||'')+'</td><td>'+esc(r.complaint||'')+'</td><td>'+esc(r.status||'')+'</td></tr>';}).join('');
  var bodyHTML='<div class="section-title">Leave Records ('+leave.length+')</div>'
    +'<table><thead><tr><th>Student</th><th>From</th><th>To</th><th>Reason</th><th>Status</th></tr></thead><tbody>'+(leaveRows||'<tr><td colspan="5" style="text-align:center;color:#6474a0">No leave records.</td></tr>')+'</tbody></table>'
    +'<div class="section-title">Sick Bay Records ('+sick.length+')</div>'
    +'<table><thead><tr><th>Student</th><th>Date</th><th>Complaint</th><th>Status</th></tr></thead><tbody>'+(sickRows||'<tr><td colspan="4" style="text-align:center;color:#6474a0">No sick bay records.</td></tr>')+'</tbody></table>';
  rptOpenPrintWindowFull('Hostel Management Report',(window.TENANT?window.TENANT.name+' | '+window.TENANT.address:'Guidance Navodaya & Sainik Institute | Khangabok Sorok Wangma, Thoubal, Manipur'),bodyHTML);
}
function rptHostelDOC(){
  var leave=hmLoad('leave');var sick=hmLoad('sick');
  var leaveRows=''; leave.forEach(function(r){leaveRows+='<tr><td>'+esc(r.studentName||'')+'</td><td>'+esc(r.from||'')+'</td><td>'+esc(r.to||'')+'</td><td>'+esc(r.reason||'')+'</td><td>'+esc(r.status||'')+'</td></tr>';});
  var sickRows=''; sick.forEach(function(r){sickRows+='<tr><td>'+esc(r.studentName||'')+'</td><td>'+esc(r.date||'')+'</td><td>'+esc(r.complaint||'')+'</td><td>'+esc(r.status||'')+'</td></tr>';});
  var body='<div class="section-title">Leave Records</div><table><thead><tr><th>Student</th><th>From</th><th>To</th><th>Reason</th><th>Status</th></tr></thead><tbody>'+leaveRows+'</tbody></table>'
    +'<div class="section-title">Sick Bay</div><table><thead><tr><th>Student</th><th>Date</th><th>Complaint</th><th>Status</th></tr></thead><tbody>'+sickRows+'</tbody></table>';
  downloadDOC('GNSI_Hostel_Report.doc','Hostel Management Report',(window.TENANT?window.TENANT.name:'Guidance Navodaya & Sainik Institute'),body);
}
function rptHostelExcel(){
  var leave=hmLoad('leave');var sick=hmLoad('sick');var outpass=hmLoad('outpass');var outing=hmLoad('outing');
  var leaveRows=[['Student Name','Class','From','To','Reason','Status']];
  leave.forEach(function(r){leaveRows.push([r.studentName||'',r.cls||'',r.from||'',r.to||'',r.reason||'',r.status||'']);});
  var sickRows=[['Student Name','Date','Complaint','Treatment','Status']];
  sick.forEach(function(r){sickRows.push([r.studentName||'',r.date||'',r.complaint||'',r.treatment||'',r.status||'']);});
  var outRows=[['Student Name','Date','Destination','Expected Return','Status']];
  outpass.forEach(function(r){outRows.push([r.studentName||'',r.date||'',r.destination||'',r.returnTime||'',r.status||'']);});
  downloadXLSX('GNSI_Hostel_'+new Date().toISOString().split('T')[0]+'.xlsx',[
    {name:'Leave Records',rows:leaveRows},
    {name:'Sick Bay',rows:sickRows},
    {name:'Outpass',rows:outRows}
  ]);
}
function rptHostelCSV(){
  var leave=hmLoad('leave');
  var rows=[['Student Name','Class','From','To','Reason','Status']];
  leave.forEach(function(r){rows.push([r.studentName||'',r.cls||'',r.from||'',r.to||'',r.reason||'',r.status||'']);});
  downloadCSV('GNSI_Hostel_Leave.csv',rows);
}
// ══════════════════════════════════════════════════════════════
//  STAFF RATING SECTION  (Reports → ⭐ Staff Rating tab)
// ══════════════════════════════════════════════════════════════
function gnsiGetRating(id){
  var base={disc:3,punc:3,wq:3,att:5,cond:3,remarks:'',action:'None',absent:false};
  for(var i=0;i<10;i++) base['tq'+i]=3;
  return Object.assign({},base,gnsiRatingState[id]||{});
}
function gnsiSaveRating(id,patch){
  gnsiRatingState[id]=Object.assign(gnsiGetRating(id),patch);
  try{localStorage.setItem('gnsi_staff_rating',JSON.stringify(gnsiRatingState));if(typeof gnsiKVPush==='function')gnsiKVPush('gnsi_staff_rating',gnsiRatingState);}catch(e){}
}
function gnsiRatingAvg(id){
  var r=gnsiGetRating(id);
  return +((r.disc+r.punc+r.wq+r.att+r.cond)/5).toFixed(2);
}
function gnsiTQAvg(id){
  var r=gnsiGetRating(id);
  var s=0;for(var i=0;i<10;i++)s+=r['tq'+i];
  return +(s/10).toFixed(2);
}
function gnsiGrade(a){return a>=4.8?'A+':a>=4.3?'A':a>=3.7?'B+':a>=3.0?'B':'C';}
function gnsiGradeColor(g){return g==='A+'?'#0F6E56':g==='A'?'#1433a8':g==='B+'?'#5b21b6':g==='B'?'#92400e':'#991b1b';}
function gnsiGradeBg(g){return g==='A+'?'#e1f5ee':g==='A'?'#e0e8f9':g==='B+'?'#ede9fe':g==='B'?'#fef3dc':'#fee2e2';}
function gnsiScoreColor(v){return v>=4.5?'#157a47':v>=3.5?'#1433a8':v>=2.5?'#92400e':'#991b1b';}
function gnsiBarColor(v){return v>=4.5?'#157a47':v>=3.5?'#1433a8':v>=2.5?'#c9870a':'#c0291d';}
function gnsiUpdRating(id,key,val){
  var patch={};patch[key]=parseFloat(val);
  gnsiSaveRating(id,patch);
  gnsiRefreshRatingCard(id);
  gnsiRefreshRatingSideSummary();
}
function gnsiUpdRatingAbsent(id,checked){
  gnsiSaveRating(id,{absent:checked,att:checked?1:5});
  gnsiRefreshRatingCard(id);
  gnsiRefreshRatingSideSummary();
}
function gnsiToggleRatingEdit(id){
  gnsiRatingEditId=(gnsiRatingEditId===id?null:id);
  var allPanels=document.querySelectorAll('.gnsi-rating-edit-panel');
  allPanels.forEach(function(p){p.style.maxHeight='0';p.style.opacity='0';p.style.pointerEvents='none';});
  var allBtns=document.querySelectorAll('.gnsi-rating-edit-btn');
  allBtns.forEach(function(b){b.style.background='var(--surface2)';b.style.color='var(--muted)';b.style.borderColor='var(--border)';});
  if(gnsiRatingEditId!==null){
    var ep=document.getElementById('gnsi-rep-'+id);
    if(ep){ep.style.maxHeight='700px';ep.style.opacity='1';ep.style.pointerEvents='all';}
    var btn=document.getElementById('gnsi-rebt-'+id);
    if(btn){btn.style.background='var(--accent-light)';btn.style.color='var(--accent)';btn.style.borderColor='var(--accent)';}
  }
}
function gnsiRefreshRatingCard(id){
  var el=document.getElementById('gnsi-rc-'+id);
  if(!el)return;
  var r=gnsiGetRating(id);
  var a=gnsiRatingAvg(id);
  var g=gnsiGrade(a);
  var gl=el.querySelector('.gnsi-gl');if(gl){gl.textContent=g;gl.style.color=gnsiGradeColor(g);}
  var ga=el.querySelector('.gnsi-ga');if(ga){ga.textContent=a.toFixed(2)+'/5';ga.style.color=gnsiGradeColor(g);}
  var gb=el.querySelector('.gnsi-gb');if(gb)gb.style.background=gnsiGradeBg(g);
  ['disc','punc','wq','att','cond'].forEach(function(k){
    var v=r[k];
    var sc=el.querySelector('.gnsi-cs-'+k);if(sc){sc.textContent=v.toFixed(1);sc.style.color=gnsiScoreColor(v);}
    var bf=el.querySelector('.gnsi-bf-'+k);if(bf){bf.style.width=(v/5*100)+'%';bf.style.background=gnsiBarColor(v);}
    var sl=el.querySelector('.gnsi-sl-'+k);if(sl)sl.value=v;
    var sv=el.querySelector('.gnsi-sv-'+k);if(sv){sv.textContent=v.toFixed(1);sv.style.color=gnsiScoreColor(v);}
  });
  var sf=staff.find(function(x){return x.id===id;});
  if(sf&&(sf.dept||'').toLowerCase().includes('teach')){
    for(var i=0;i<10;i++){
      var v2=r['tq'+i]||0;
      var ts=el.querySelector('.gnsi-ts-tq'+i);if(ts){ts.textContent=v2.toFixed(1);ts.style.color=gnsiScoreColor(v2);}
      var tf=el.querySelector('.gnsi-tf-tq'+i);if(tf){tf.style.width=(v2/5*100)+'%';tf.style.background=gnsiBarColor(v2);}
      var tsl=el.querySelector('.gnsi-tsl-tq'+i);if(tsl)tsl.value=v2;
      var tsv=el.querySelector('.gnsi-tsv-tq'+i);if(tsv){tsv.textContent=v2.toFixed(1);tsv.style.color=gnsiScoreColor(v2);}
    }
    var ta=gnsiTQAvg(id);var tg=gnsiGrade(ta);
    var tav=el.querySelector('.gnsi-tqa');if(tav){tav.textContent='Teaching Avg: '+ta.toFixed(2)+'/5 -- '+tg;tav.style.color=gnsiGradeColor(tg);}
  }
  var st=el.querySelector('.gnsi-status');
  if(st){
    var ac=r.action&&r.action!=='None';
    var acColors={Commendation:'#157a47',Advisory:'#92400e',Directive:'#1433a8',Disciplinary:'#991b1b'};
    var acBgs={Commendation:'#e1f5ee',Advisory:'#fef3dc',Directive:'#e0e8f9',Disciplinary:'#fee2e2'};
    st.innerHTML=(r.absent?'<span style="color:#c0291d;font-weight:700">Absent</span>':'<span style="color:#157a47">Present</span>')
      +(ac?' &nbsp;<span style="display:inline-block;padding:1px 9px;border-radius:10px;font-size:11px;font-weight:700;background:'+(acBgs[r.action]||'#eee')+';color:'+(acColors[r.action]||'#333')+'">'+r.action+'</span>':'');
  }
}
function gnsiRefreshRatingSideSummary(){
  var el=document.getElementById('gnsi-rating-summary-side');
  if(!el)return;
  el.innerHTML=gnsiRatingSummaryHTML();
}
function gnsiRatingSummaryHTML(){
  var grades={'A+':0,'A':0,'B+':0,'B':0,'C':0};
  var present=0,absent=0,total=staff.length,totalAvg=0;
  staff.forEach(function(s){
    var a=gnsiRatingAvg(s.id);grades[gnsiGrade(a)]++;
    if(gnsiGetRating(s.id).absent)absent++;else present++;
    totalAvg+=a;
  });
  var oa=(totalAvg/total).toFixed(2);
  var gOrder=['A+','A','B+','B','C'];
  return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">'
    +'<div style="background:var(--surface2);border-radius:8px;padding:10px;text-align:center"><div style="font-size:22px;font-weight:800;color:var(--text)">'+total+'</div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;font-weight:600">Staff</div></div>'
    +'<div style="background:var(--surface2);border-radius:8px;padding:10px;text-align:center"><div style="font-size:22px;font-weight:800;color:var(--text)">'+oa+'</div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;font-weight:600">Avg Score</div></div>'
    +'<div style="background:#e1f5ee;border-radius:8px;padding:10px;text-align:center"><div style="font-size:22px;font-weight:800;color:#157a47">'+present+'</div><div style="font-size:10px;color:#157a47;text-transform:uppercase;letter-spacing:.06em;font-weight:600">Present</div></div>'
    +'<div style="background:#fee2e2;border-radius:8px;padding:10px;text-align:center"><div style="font-size:22px;font-weight:800;color:#c0291d">'+absent+'</div><div style="font-size:10px;color:#c0291d;text-transform:uppercase;letter-spacing:.06em;font-weight:600">Absent</div></div>'
    +'</div>'
    +'<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px">Grade Distribution</div>'
    +gOrder.map(function(g){
      var n=grades[g];
      return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">'
        +'<span style="font-size:12px;font-weight:800;color:'+gnsiGradeColor(g)+';min-width:22px">'+g+'</span>'
        +'<div style="flex:1;height:6px;border-radius:3px;background:var(--surface3);overflow:hidden"><div style="height:100%;border-radius:3px;background:'+gnsiGradeColor(g)+';width:'+(total?Math.round(n/total*100):0)+'%;transition:width .3s"></div></div>'
        +'<span style="font-size:12px;font-weight:700;color:'+gnsiGradeColor(g)+';min-width:18px;text-align:right">'+n+'</span>'
        +'</div>';
    }).join('');
}
function gnsiRatingCardHTML(sf){
  var r=gnsiGetRating(sf.id);
  var a=gnsiRatingAvg(sf.id);
  var g=gnsiGrade(a);
  var isTeach=(sf.dept||'').toLowerCase().includes('teach');
  var cats=[{k:'disc',l:'Discipline'},{k:'punc',l:'Punctuality'},{k:'wq',l:'Work Quality'},{k:'att',l:'Attendance'},{k:'cond',l:'Conduct'}];
  var ini=(sf.name||'').split(' ').slice(0,2).map(function(w){return w[0];}).join('');
  var deptColors={Administration:'#0C447C',Examination:'#27500A',Accounts:'#085041',IT:'#3C3489',Teaching:'#633806',Hostel:'#72243E',Security:'#444441',Maintenance:'#444441'};
  var deptBgs={Administration:'#e0e8f9',Examination:'#EAF3DE',Accounts:'#E1F5EE',IT:'#EEEDFE',Teaching:'#fef3dc',Hostel:'#FBEAF0',Security:'#F1EFE8',Maintenance:'#F1EFE8'};
  var avBg=deptColors[sf.dept]||'#444';
  var dc=deptColors[sf.dept]||'#333';
  var db=deptBgs[sf.dept]||'#eee';
  var acColors={Commendation:'#157a47',Advisory:'#92400e',Directive:'#1433a8',Disciplinary:'#991b1b'};
  var acBgs={Commendation:'#e1f5ee',Advisory:'#fef3dc',Directive:'#e0e8f9',Disciplinary:'#fee2e2'};
  var acVal=r.action&&r.action!=='None';
  var catBarsHTML=cats.map(function(c){
    var v=r[c.k];
    return '<div style="display:flex;flex-direction:column;align-items:center;gap:3px">'
      +'<div style="font-size:10px;color:var(--muted);text-align:center;line-height:1.3">'+c.l+'</div>'
      +'<div class="gnsi-cs-'+c.k+'" style="font-size:16px;font-weight:800;color:'+gnsiScoreColor(v)+'">'+v.toFixed(1)+'</div>'
      +'<div style="height:3px;width:100%;border-radius:2px;background:var(--surface3);overflow:hidden"><div class="gnsi-bf-'+c.k+'" style="height:100%;border-radius:2px;background:'+gnsiBarColor(v)+';width:'+(v/5*100)+'%;transition:width .3s"></div></div>'
      +'</div>';
  }).join('');
  var tqHTML='';
  if(isTeach){
    var ta=gnsiTQAvg(sf.id);var tg=gnsiGrade(ta);
    var tqItems=TQ_QUALITIES.map(function(ql,i){
      var v=r['tq'+i]||0;
      return '<div style="display:flex;flex-direction:column;align-items:center;gap:2px">'
        +'<div style="font-size:9px;color:var(--muted);text-align:center;line-height:1.3;min-height:22px;display:flex;align-items:center;justify-content:center">'+ql+'</div>'
        +'<div class="gnsi-ts-tq'+i+'" style="font-size:14px;font-weight:800;color:'+gnsiScoreColor(v)+'">'+v.toFixed(1)+'</div>'
        +'<div style="height:3px;width:100%;border-radius:2px;background:var(--surface3);overflow:hidden"><div class="gnsi-tf-tq'+i+'" style="height:100%;border-radius:2px;background:'+gnsiBarColor(v)+';width:'+(v/5*100)+'%;transition:width .3s"></div></div>'
        +'</div>';
    });
    tqHTML='<div style="border:1px solid var(--border-soft);border-radius:10px;overflow:hidden;margin-bottom:10px">'
      +'<div style="background:var(--surface2);padding:8px 14px;display:flex;align-items:center;justify-content:space-between">'
      +'<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em">Teaching Quality Assessment</div>'
      +'<span style="background:#fef3dc;color:#633806;font-size:10px;font-weight:700;padding:2px 9px;border-radius:10px">10 qualities</span>'
      +'</div>'
      +'<div style="padding:10px 12px;display:grid;grid-template-columns:repeat(5,1fr);gap:6px">'+tqItems.slice(0,5).join('')+'</div>'
      +'<div style="padding:0 12px 10px;display:grid;grid-template-columns:repeat(5,1fr);gap:6px">'+tqItems.slice(5).join('')+'</div>'
      +'<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 14px;background:var(--surface2);border-top:1px solid var(--border-soft)">'
      +'<span style="font-size:11px;color:var(--muted)">Teaching Quality Avg</span>'
      +'<span class="gnsi-tqa" style="font-size:12px;font-weight:800;color:'+gnsiGradeColor(tg)+'">Teaching Avg: '+ta.toFixed(2)+'/5 -- '+tg+'</span>'
      +'</div></div>';
  }
  var editPanel='<div id="gnsi-rep-'+sf.id+'" class="gnsi-rating-edit-panel" style="max-height:0;opacity:0;pointer-events:none;overflow:hidden;transition:max-height .35s cubic-bezier(.4,0,.2,1),opacity .25s">'
    +'<div style="padding:14px 16px;border-top:1px solid var(--border-soft);background:var(--surface2)">'
    +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap">'
    +'<label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--muted);cursor:pointer;font-weight:500">'
    +'<input type="checkbox" '+(r.absent?'checked':'')+' onchange="gnsiUpdRatingAbsent('+sf.id+',this.checked)"> Mark Absent</label>'
    +'<select onchange="gnsiSaveRating('+sf.id+',{action:this.value});gnsiRefreshRatingCard('+sf.id+')" style="margin-left:auto;font-size:12px;padding:5px 10px;border-radius:8px;border:1.5px solid var(--border);background:var(--surface);color:var(--text);font-family:\'DM Sans\',sans-serif">'
    +'<option value="None" '+(r.action==='None'?'selected':'')+'>No Action</option>'
    +'<option value="Commendation" '+(r.action==='Commendation'?'selected':'')+'>Commendation</option>'
    +'<option value="Advisory" '+(r.action==='Advisory'?'selected':'')+'>Advisory</option>'
    +'<option value="Directive" '+(r.action==='Directive'?'selected':'')+'>Directive</option>'
    +'<option value="Disciplinary" '+(r.action==='Disciplinary'?'selected':'')+'>Disciplinary</option>'
    +'</select></div>'
    +'<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:10px">'
    +cats.map(function(c){
      var v=r[c.k];
      return '<div style="display:flex;flex-direction:column;gap:3px;align-items:center">'
        +'<div style="font-size:10px;color:var(--muted);text-align:center;font-weight:600">'+c.l+'</div>'
        +'<div class="gnsi-sv-'+c.k+'" style="font-size:15px;font-weight:800;color:'+gnsiScoreColor(v)+'">'+v.toFixed(1)+'</div>'
        +'<input type="range" min="1" max="5" step="0.5" value="'+v+'" class="gnsi-sl-'+c.k+'" oninput="gnsiUpdRating('+sf.id+',\''+c.k+'\',this.value)" style="width:100%;accent-color:var(--accent)">'
        +'</div>';
    }).join('')
    +'</div>'
    +(isTeach
      ?'<div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin:10px 0 8px;padding-top:10px;border-top:1px dashed var(--border)">Teaching Qualities -- slide to rate</div>'
       +'<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:8px">'
       +TQ_QUALITIES.slice(0,5).map(function(ql,i){var v=r['tq'+i]||0;return '<div style="display:flex;flex-direction:column;gap:2px;align-items:center"><div style="font-size:9px;color:var(--muted);text-align:center;font-weight:600">'+ql+'</div><div class="gnsi-tsv-tq'+i+'" style="font-size:13px;font-weight:800;color:'+gnsiScoreColor(v)+'">'+v.toFixed(1)+'</div><input type="range" min="1" max="5" step="0.5" value="'+v+'" class="gnsi-tsl-tq'+i+'" oninput="gnsiUpdRating('+sf.id+',\'tq'+i+'\',this.value)" style="width:100%;accent-color:var(--accent)"></div>';}).join('')
       +'</div><div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:8px">'
       +TQ_QUALITIES.slice(5).map(function(ql,i){var i2=i+5;var v=r['tq'+i2]||0;return '<div style="display:flex;flex-direction:column;gap:2px;align-items:center"><div style="font-size:9px;color:var(--muted);text-align:center;font-weight:600">'+ql+'</div><div class="gnsi-tsv-tq'+i2+'" style="font-size:13px;font-weight:800;color:'+gnsiScoreColor(v)+'">'+v.toFixed(1)+'</div><input type="range" min="1" max="5" step="0.5" value="'+v+'" class="gnsi-tsl-tq'+i2+'" oninput="gnsiUpdRating('+sf.id+',\'tq'+i2+'\',this.value)" style="width:100%;accent-color:var(--accent)"></div>';}).join('')
       +'</div>'
      :'')
    +'<textarea placeholder="Founder\'s remarks for this staff member..." oninput="gnsiSaveRating('+sf.id+',{remarks:this.value})" style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;background:var(--surface);color:var(--text);resize:vertical;min-height:40px;margin-top:4px;font-family:\'DM Sans\',sans-serif">'+esc(r.remarks||'')+'</textarea>'
    +'</div></div>';
  return '<div class="card" id="gnsi-rc-'+sf.id+'" style="margin-bottom:10px;padding:0;overflow:hidden;transition:box-shadow .2s" onmouseenter="this.style.boxShadow=\'var(--shadow-md)\'" onmouseleave="this.style.boxShadow=\'var(--shadow-sm)\'">'
    +'<div style="display:flex;align-items:flex-start;gap:12px;padding:14px 16px 0">'
    +'<div style="width:44px;height:44px;border-radius:50%;background:'+avBg+';display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#fff;flex-shrink:0">'+ini+'</div>'
    +'<div style="flex:1;min-width:0">'
    +'<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">'
    +'<span style="font-size:14px;font-weight:700;color:var(--text)">'+esc(sf.name)+'</span>'
    +'<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;background:'+db+';color:'+dc+'">'+esc(sf.dept||'')+'</span>'
    +'</div>'
    +'<div style="font-size:12px;color:var(--muted);margin-top:2px">#'+sf.id+' &nbsp;·&nbsp; '+esc(sf.role||sf.desig||'')+'</div>'
    +'<div class="gnsi-status" style="font-size:12px;margin-top:3px">'
      +(r.absent?'<span style="color:#c0291d;font-weight:700">Absent</span>':'<span style="color:#157a47">Present</span>')
      +(acVal?' &nbsp;<span style="display:inline-block;padding:1px 9px;border-radius:10px;font-size:11px;font-weight:700;background:'+(acBgs[r.action]||'#eee')+';color:'+(acColors[r.action]||'#333')+'">'+r.action+'</span>':'')
    +'</div>'
    +'</div>'
    +'<div class="gnsi-gb" style="display:flex;flex-direction:column;align-items:center;padding:6px 12px;border-radius:10px;min-width:52px;background:'+gnsiGradeBg(g)+'">'
    +'<span class="gnsi-gl" style="font-size:24px;font-weight:900;line-height:1;color:'+gnsiGradeColor(g)+'">'+g+'</span>'
    +'<span class="gnsi-ga" style="font-size:11px;font-weight:700;color:'+gnsiGradeColor(g)+'">'+a.toFixed(2)+'/5</span>'
    +'</div></div>'
    +'<div style="margin:10px 16px 0;background:var(--surface2);border-radius:9px;padding:10px 12px">'
    +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">'
    +'<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em">Core Performance</div>'
    +'<div style="font-size:11px;color:var(--muted)">'+(a>=4.5?'Outstanding':a>=4?'Good':a>=3?'Average':'Needs Work')+'</div>'
    +'</div>'
    +'<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px">'+catBarsHTML+'</div>'
    +'</div>'
    +tqHTML
    +'<div style="display:flex;border-top:1px solid var(--border-soft);margin-top:12px">'
    +'<button id="gnsi-rebt-'+sf.id+'" class="gnsi-rating-edit-btn" onclick="gnsiToggleRatingEdit('+sf.id+')" style="flex:1;padding:9px 4px;border:none;background:var(--surface2);color:var(--muted);font-size:13px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif;transition:all .15s">Edit Ratings</button>'
    +'<div style="width:1px;background:var(--border-soft)"></div>'
    +'<button onclick="gnsiRatingPrintSingle('+sf.id+')" style="flex:1;padding:9px 4px;border:none;background:var(--surface2);color:var(--accent);font-size:13px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif;transition:background .15s" onmouseenter="this.style.background=\'var(--accent-light)\'" onmouseleave="this.style.background=\'var(--surface2)\'">🗎 Print Card</button>'
    +'</div>'
    +editPanel
    +'</div>';
}
function rptStaffRatingSection(){
  var q=gnsiRatingSearch.toLowerCase();
  var list=staff.filter(function(s){
    var dm=gnsiRatingFilter==='All'||s.dept===gnsiRatingFilter;
    var sm=!q||esc(s.name).toLowerCase().includes(q)||esc(s.dept||'').toLowerCase().includes(q);
    return dm&&sm;
  });
  if(gnsiRatingSort==='grade') list=list.slice().sort(function(a,b){return gnsiRatingAvg(b.id)-gnsiRatingAvg(a.id);});
  else if(gnsiRatingSort==='name') list=list.slice().sort(function(a,b){return (a.name||'').localeCompare(b.name||'');});
  else if(gnsiRatingSort==='dept') list=list.slice().sort(function(a,b){return (a.dept||'').localeCompare(b.dept||'');});
  var depts=['All'].concat([...new Set(staff.map(function(s){return s.dept||''}))].filter(Boolean));
  var filterBtns=depts.map(function(d){
    var active=gnsiRatingFilter===d;
    return '<button onclick="gnsiRatingFilter=\''+d+'\';render()" style="padding:5px 13px;border-radius:20px;border:'+(active?'none':'1.5px solid var(--border)')+';background:'+(active?'var(--accent)':'var(--surface)')+';color:'+(active?'#fff':'var(--muted)')+';font-size:12px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif;transition:all .15s">'+d+'</button>';
  }).join('');
  var sortBtns=['id','grade','name','dept'].map(function(m){
    var active=gnsiRatingSort===m;
    var labels={id:'Default',grade:'↓ Grade',name:'↓ Name',dept:'↓ Dept'};
    return '<button onclick="gnsiRatingSort=\''+m+'\';render()" style="padding:5px 12px;border-radius:8px;border:1.5px solid var(--border);background:'+(active?'var(--accent-light)':'var(--surface)')+';color:'+(active?'var(--accent)':'var(--muted)')+';font-size:12px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">'+labels[m]+'</button>';
  }).join('');
  return rptExportBar('Staff Performance Rating -- Checking Drive',
    ['<input type="text" placeholder="Search staff..." value="'+esc(gnsiRatingSearch)+'" oninput="gnsiRatingSearch=this.value;debouncedRender()" style="padding:8px 14px;border-radius:9px;border:1.5px solid var(--border);font-size:13px;font-family:\'DM Sans\',sans-serif;background:var(--surface);color:var(--text);outline:none;width:200px">'],
    {pdf:'gnsiRatingPrintAll()',doc:'gnsiRatingDOC()'}
  )
  +'<div style="display:flex;gap:28px;align-items:flex-start">'
  
  +'<div style="flex:1;min-width:0">'
  +'<div style="background:var(--surface);border:1px solid var(--border-soft);border-radius:var(--radius);padding:14px;margin-bottom:12px">'
  +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">'
  +'<div style="font-size:12px;font-weight:700;color:var(--muted)">Filter by Department:</div>'
  +'<div style="display:flex;gap:6px;flex-wrap:wrap">'+filterBtns+'</div>'
  +'</div>'
  +'<div style="display:flex;align-items:center;gap:8px">'
  +'<div style="font-size:12px;font-weight:700;color:var(--muted)">Sort:</div>'
  +'<div style="display:flex;gap:6px">'+sortBtns+'</div>'
  +'</div>'
  +'</div>'
  +list.map(gnsiRatingCardHTML).join('')
  +'</div>'
  
  +'<div style="width:220px;flex-shrink:0">'
  +'<div class="card" style="margin-bottom:10px">'
  +'<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px">Drive Summary</div>'
  +'<div id="gnsi-rating-summary-side">'+gnsiRatingSummaryHTML()+'</div>'
  +'</div>'
  +'<div class="card">'
  +'<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px">Top Performers</div>'
  +staff.slice().sort(function(a,b){return gnsiRatingAvg(b.id)-gnsiRatingAvg(a.id);}).slice(0,5).map(function(s){
    var a=gnsiRatingAvg(s.id);var g=gnsiGrade(a);
    return '<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border-soft)">'
      +'<div style="font-size:12px;font-weight:500;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+(s.name||'').split(' ').slice(0,2).join(' ')+'</div>'
      +'<span style="font-size:12px;font-weight:800;color:'+gnsiGradeColor(g)+'">'+g+'</span>'
      +'</div>';
  }).join('')
  +'</div>'
  +'</div>'
  +'</div>';
}
function gnsiRatingPrintSingle(id){
  var sf=staff.find(function(s){return s.id===id;});if(!sf)return;
  var r=gnsiGetRating(id);
  var a=gnsiRatingAvg(id);var g=gnsiGrade(a);
  var isTeach=(sf.dept||'').toLowerCase().includes('teach');
  var cats=[['disc','Discipline'],['punc','Punctuality'],['wq','Work Quality'],['att','Attendance'],['cond','Conduct']];
  var catRows=cats.map(function(c){
    var v=r[c[0]];
    var col=gnsiGradeColor(gnsiGrade(v));
    return '<td style="text-align:center;font-weight:700;color:'+col+'">'+v.toFixed(1)+'</td>';
  }).join('');
  var tqHTML='';
  if(isTeach){
    var ta=gnsiTQAvg(id);var tg=gnsiGrade(ta);
    var tqRows=TQ_QUALITIES.map(function(ql,i){
      var v=r['tq'+i]||0;var col=gnsiGradeColor(gnsiGrade(v));
      return '<tr><td>'+ql+'</td><td style="text-align:center;font-weight:700;color:'+col+'">'+v.toFixed(1)+'/5</td></tr>';
    }).join('');
    tqHTML='<div class="section-title">Teaching Quality Assessment (10 Core Qualities)</div>'
      +'<table><thead><tr><th>Quality</th><th>Score</th></tr></thead><tbody>'+tqRows+'</tbody></table>'
      +'<p><strong>Teaching Quality Average: '+ta.toFixed(2)+'/5 -- Grade: '+tg+'</strong></p>';
  }
  var body='<h2 style="margin:0 0 4px">'+esc(sf.name)+'</h2>'
    +'<p style="color:#555;margin:0 0 16px">#'+sf.id+' · '+esc(sf.role||'')+(sf.dept?' · '+esc(sf.dept):'')+' · '+gnsiRatingDriveMonth+'</p>'
    +'<div class="section-title">Core Performance</div>'
    +'<table><thead><tr><th>Discipline</th><th>Punctuality</th><th>Work Quality</th><th>Attendance</th><th>Conduct</th><th>Overall Grade</th></tr></thead>'
    +'<tbody><tr>'+catRows+'<td style="text-align:center;font-size:20px;font-weight:900;color:'+gnsiGradeColor(g)+'">'+g+' ('+a.toFixed(2)+')</td></tr></tbody></table>'
    +tqHTML
    +(r.remarks?'<div class="section-title">Remarks</div><p>'+esc(r.remarks)+'</p>':'')
    +(r.action&&r.action!=='None'?'<div class="section-title">Action by Founder</div><p style="font-weight:700">'+r.action+'</p>':'')
    +'<div class="section-title">Acknowledgement</div>'
    +'<table><thead><tr><th>Founder Signature &amp; Date</th><th>Staff Signature &amp; Date</th></tr></thead>'
    +'<tbody><tr><td style="height:50px">Moirangthem Himan Singh<br><small>Founder &amp; Director, GNSI</small></td><td style="height:50px">'+esc(sf.name)+'</td></tr></tbody></table>';
  rptOpenPrintWindowFull('Staff Performance Card -- '+esc(sf.name),(window.TENANT?window.TENANT.name:' Guidance Navodaya & Sainik Institute')+' | Checking Drive '+gnsiRatingDriveMonth, body);
}
function gnsiRatingPrintAll(){
  var rows=staff.map(function(s){
    var a=gnsiRatingAvg(s.id);var g=gnsiGrade(a);var r=gnsiGetRating(s.id);
    var col=gnsiGradeColor(g);
    return '<tr>'
      +'<td>'+esc(s.name)+'</td><td>'+esc(s.role||'')+'</td><td>'+esc(s.dept||'')+'</td>'
      +'<td style="text-align:center">'+r.disc.toFixed(1)+'</td>'
      +'<td style="text-align:center">'+r.punc.toFixed(1)+'</td>'
      +'<td style="text-align:center">'+r.wq.toFixed(1)+'</td>'
      +'<td style="text-align:center">'+r.att.toFixed(1)+'</td>'
      +'<td style="text-align:center">'+r.cond.toFixed(1)+'</td>'
      +'<td style="text-align:center;font-weight:800;color:'+col+'">'+a.toFixed(2)+'</td>'
      +'<td style="text-align:center;font-weight:900;font-size:15px;color:'+col+'">'+g+'</td>'
      +'<td>'+(r.absent?'Absent':'Present')+'</td>'
      +'<td>'+(r.action!=='None'?r.action:'--')+'</td>'
      +'</tr>';
  }).join('');
  var body='<div class="section-title">Staff Performance Ratings -- Checking Drive '+gnsiRatingDriveMonth+'</div>'
    +'<table><thead><tr><th>Name</th><th>Role</th><th>Dept</th><th>Disc</th><th>Punc</th><th>Work Q</th><th>Att</th><th>Conduct</th><th>Avg</th><th>Grade</th><th>Attendance</th><th>Action</th></tr></thead>'
    +'<tbody>'+rows+'</tbody></table>';
  rptOpenPrintWindowFull('Staff Performance Rating Report -- '+gnsiRatingDriveMonth,(window.TENANT?window.TENANT.name+' | '+window.TENANT.city+', '+window.TENANT.state:'Guidance Navodaya & Sainik Institute | Khangabok, Thoubal, Manipur'),body);
}
function gnsiRatingDOC(){
  var rows='';
  staff.forEach(function(s){
    var a=gnsiRatingAvg(s.id);var g=gnsiGrade(a);var r=gnsiGetRating(s.id);
    rows+='<tr><td>'+esc(s.name)+'</td><td>'+esc(s.dept||'')+'</td>'
      +'<td>'+r.disc.toFixed(1)+'</td><td>'+r.punc.toFixed(1)+'</td><td>'+r.wq.toFixed(1)+'</td>'
      +'<td>'+r.att.toFixed(1)+'</td><td>'+r.cond.toFixed(1)+'</td>'
      +'<td>'+a.toFixed(2)+'</td><td>'+g+'</td>'
      +'<td>'+(r.absent?'Absent':'Present')+'</td><td>'+(r.action!=='None'?r.action:'-')+'</td></tr>';
  });
  var body='<table><thead><tr><th>Name</th><th>Dept</th><th>Disc</th><th>Punc</th><th>Work Q</th><th>Att</th><th>Conduct</th><th>Avg</th><th>Grade</th><th>Status</th><th>Action</th></tr></thead><tbody>'+rows+'</tbody></table>';
  downloadDOC('GNSI_Staff_Ratings_'+gnsiRatingDriveMonth+'.doc','Staff Performance Rating -- '+gnsiRatingDriveMonth,(window.TENANT?window.TENANT.name:'Guidance Navodaya & Sainik Institute'),body);
}
// ══════════════════════════════════════════════════════════════
//  AUTH & ROLE-BASED ACCESS CONTROL
// ══════════════════════════════════════════════════════════════
var ROLE_PAGES = {
  admin:       ['dashboard','admincentre','leaderboard','staff','students','admissions','unifiedhub','sessions','classes','attendance','notices','accounts','fees','timetable','exam','exammanager','periodsalary','staffsalary','doubttt','dutyhours','boarder','hostel','kitchen','housemaster','house','reception','reports','sync','settings','leave','substitute','appraisal','grievance','diary','certificate','calendar','ptm','library','assets','nightduty','discipline','sickbay','scholarship','parent','parentfeedback','backup','payments','aiassistant','lessonbridge'],
  manager:     ['dashboard','leaderboard','staff','students','admissions','unifiedhub','sessions','classes','attendance','notices','accounts','fees','timetable','exam','exammanager','periodsalary','staffsalary','doubttt','dutyhours','boarder','hostel','kitchen','housemaster','house','reception','reports','leave','substitute','grievance','diary','certificate','calendar','ptm','library','assets','nightduty','discipline','sickbay','scholarship','payments','aiassistant','lessonbridge'],
  accounts:    ['dashboard','notices','accounts','fees','students','admissions','reception','reports','scholarship','calendar',], /* no admincentre */
  teacher:     ['dashboard','notices','attendance','timetable','exam','periodsalary','doubttt','dutyhours','students','classes','leave','substitute','diary','calendar','ptm','library','discipline','grievance','aiassistant','lessonbridge','gnsi_social'],
  hostel:      ['dashboard','notices','doubttt','dutyhours','boarder','hostel','kitchen','housemaster','house','attendance','exam','nightduty','discipline','sickbay','calendar','leave','aiassistant','lessonbridge','gnsi_social'],
  housemaster: ['dashboard','notices','housemaster','house','hostel','boarder','doubttt','dutyhours','attendance','exam','aiassistant','lessonbridge','gnsi_social'],
  it:          ['dashboard','notices','reports','sync',],
  reception:   ['dashboard','notices','reception','students','admissions','fees','reports','calendar'],  /* v63: unified -- was split across two places */
  staff:       ['dashboard','notices','dutyhours','aiassistant','lessonbridge','gnsi_social','diary','calendar','library']
};
var ROLE_LABELS = {
  admin:'Administrator',manager:'Manager',accounts:'Accounts',
  teacher:'Teacher',hostel:'Hostel Staff',housemaster:'House Master',
  it:'IT Staff',reception:'Receptionist',staff:'Support Staff'
};
function detectRole(member){
  // -- Hardcoded role map — cleared for multi-tenant use; role detection uses staff.role field below --
  var _ROLE_MAP = {
    1:'admin'  // ID 1 is always the founding admin; role for all others is detected from their role field
  };
  if(_ROLE_MAP[member.id]) return _ROLE_MAP[member.id];
  // -- Fallback detection for staff not in map --
  var role=(member.role||'').toLowerCase();
  var dept=(member.dept||'').toLowerCase();
  if(dept==='administration'||role.includes('administrator')||role.includes('manager')||role.includes('superintendent')||role.includes('principal'))return'manager';
  if(dept==='examination'||role.includes('exam'))return'manager';
  if(dept==='accounts'||role.includes('accountant'))return'accounts';
  if(dept==='it'||role.includes('computer')||role.includes('it staff')||role.startsWith('it '))return'it';
  if(role.includes('receptionist')||role.includes('counter'))return'reception';
  if(role.includes('house master')||role.includes('house mistress')||role.includes('boarding in charge')||role.includes('assistant house'))return'housemaster';
  if(dept==='hostel')return'hostel';
  if(dept==='teaching'||role.includes('teacher')||role.includes('teaching')||role.includes('concern')||role.includes('hod'))return'teacher';
  return'staff';
}
var currentUser = null;

/* ── GNSI RBAC HELPERS ── */
function _isAdminOrArunkumar() {
  if (!currentUser) return false;
  if (currentUser.role === 'admin') return true;
  if (currentUser.role === 'manager') return true;
  return false;
}
function _isAdminOrAccounts() {
  if (!currentUser) return false;
  return currentUser.role === 'admin' || currentUser.role === 'accounts';
}

// {id, name, role(system), staffRole, pages:[]}
var _examUserRole    = 'none';
var _examCanEdit     = false;
var _examCanManage   = false;
var _examCanExport   = false;
var _examCanDelete   = false;
var _examCanPrint    = false;
var _examCanAnalytics= false;
var _examCanView     = false;
function examComputePermissions(){
  var r = currentUser ? currentUser.role : 'none';
  _examUserRole     = r;
  var isAdm         = r==='admin';
  var isAdmMgr      = r==='admin'||r==='manager';
  _examCanEdit      = r==='admin'||r==='manager'||r==='teacher';
  _examCanManage    = isAdmMgr;
  _examCanExport    = isAdmMgr;
  _examCanDelete    = isAdm;
  _examCanPrint     = _examCanEdit;
  _examCanAnalytics = isAdmMgr||r==='teacher';
  _examCanView      = true; // all authenticated users can view
}
/* -- SESSION INTEGRITY TOKEN ---------------------------------
   Binds the session to the stored password hash of the user.
   Anyone who manually sets sessionStorage without knowing the
   correct hash will produce a mismatched token and be rejected. */
function _sessionToken(userId,role){
  /* PRIV-ESC FIX B: role included in token — editing role in sessionStorage breaks integrity check */
  var h=getStoredHash(userId)||('nopass_'+userId);
  var r=role||'';
  return _gnsiSignHash('GNSI_SESSION|'+userId+'|'+h+'|'+r);
}
function loadSession(){
  try{
    var s=sessionStorage.getItem('gnsi_session');
    if(!s)return null;
    var parsed=JSON.parse(s);
    if(!parsed||!parsed.id)return null;
    /* Verify integrity token -- reject tampered sessions */
    /* SECURITY PATCH v9b: reject expired sessions */
    if(parsed._exp && Date.now() > parsed._exp){
      sessionStorage.removeItem('gnsi_session');
      return null;
    }
    var expected=_sessionToken(parsed.id, parsed.role);
    if(parsed._tok !== expected){
      sessionStorage.removeItem('gnsi_session');
      (void 0);
      return null;
    }
    return parsed;
  }catch(e){}
  return null;
}
function saveSession(u){
  /* PRIV-ESC FIX B: pass role into token */
  var tok = _sessionToken(u.id, u.role);
  /* SECURITY PATCH v9: add 12-hour hard expiry to session */
  var _exp = Date.now() + (12 * 60 * 60 * 1000);
  sessionStorage.setItem('gnsi_session', JSON.stringify(Object.assign({}, u, {_tok: tok, _exp: _exp})));
}
function clearSession(){
  sessionStorage.removeItem('gnsi_session');
}

/* ══ GNSI PASSWORD STRENGTH VALIDATOR ══════════════════════════════════════ */
function gnsiCheckPasswordStrength(pwd){
  if(!pwd||pwd.length<8)        return 'Password must be at least 8 characters.';
  if(!/[A-Z]/.test(pwd))        return 'Password must contain at least one uppercase letter (A-Z).';
  if(!/[a-z]/.test(pwd))        return 'Password must contain at least one lowercase letter (a-z).';
  if(!/[0-9]/.test(pwd))        return 'Password must contain at least one number (0-9).';
  return null;
}


/* ══ GNSI GLOBAL LOGIN RATE LIMITER ════════════════════════════════════════
   Limits login attempts across ALL usernames from the same device.
   Uses a device fingerprint (screen + timezone + lang) as the key.
   Max 15 attempts per device per hour before a 1-hour global lockout.       */
function _gnsiDeviceKey(){
  var fp=[screen.width,screen.height,screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language].join('|');
  /* simple non-crypto hash for fingerprint */
  var h=0;for(var i=0;i<fp.length;i++){h=((h<<5)-h)+fp.charCodeAt(i);h|=0;}
  return 'gnsi_glb_lk_'+Math.abs(h).toString(36);
}
function gnsiGlobalRateCheck(){
  var key=_gnsiDeviceKey();
  var now=Date.now();
  try{
    var d=JSON.parse(localStorage.getItem(key)||'{"count":0,"windowStart":0,"lockedUntil":0}');
    if(d.lockedUntil&&now<d.lockedUntil){
      var mins=Math.ceil((d.lockedUntil-now)/60000);
      return 'Too many login attempts from this device. Try again in '+mins+' minute'+(mins===1?'':' s')+'.';
    }
    if(d.lockedUntil&&now>=d.lockedUntil){d={count:0,windowStart:now,lockedUntil:0};}
    return null; /* OK */
  }catch(e){return null;}
}
function gnsiGlobalRateRecord(success){
  var key=_gnsiDeviceKey();
  var now=Date.now();
  try{
    var d=JSON.parse(localStorage.getItem(key)||'{"count":0,"windowStart":0,"lockedUntil":0}');
    if(success){d={count:0,windowStart:0,lockedUntil:0};}
    else{
      if(now-d.windowStart>3600000){d={count:1,windowStart:now,lockedUntil:0};}
      else{d.count=(d.count||0)+1;if(d.count>=15)d.lockedUntil=now+3600000;}
    }
    localStorage.setItem(key,JSON.stringify(d));
  }catch(e){}
}

function defaultPassword(name){
  return (name||'').trim().split(' ')[0].toLowerCase();
}
/* Legacy hash -- kept only for migrating old stored passwords */
function _legacyHash(str){
  var hash=0;
  for(var i=0;i<str.length;i++){hash=((hash<<5)-hash)+str.charCodeAt(i);hash|=0;}
  return 'h'+Math.abs(hash).toString(36);
}
/* ── _gnsiSignHash: fast deterministic hash for NON-PASSWORD uses ────────────
   Used for: session integrity tokens, role-page signatures, PIN hash.
   NOT suitable for password storage — use hashPassword() for passwords.       */
function _gnsiSignHash(str){
  /* FNV-32a with 50 rounds + fixed salt — fast, deterministic, non-cryptographic */
  var SALT='GNSI·SIG·SALT·2026';
  function _fnv32(s){
    var h=0x811c9dc5;
    for(var i=0;i<s.length;i++){h^=(s.charCodeAt(i)&0xff);h=(h>>>0);h=((h*16777619)>>>0);}
    return ('00000000'+h.toString(16)).slice(-8);
  }
  var v=_fnv32(SALT+str+SALT);
  for(var r=0;r<50;r++){v=_fnv32(v+str+(r&0xff).toString(16));}
  return 'gs_'+v;
}
/* ── hashPassword: PBKDF2-SHA256 via Web Crypto API (async) ─────────────────
   Format: gpv3_<hex-salt-32chars>_<hex-hash-64chars>
   100,000 PBKDF2 iterations — resistant to brute-force attacks.
   Falls back to _gnsiSignHash if Web Crypto unavailable (very old browsers). */
async function hashPassword(plainText){
  if(!window.crypto||!window.crypto.subtle){
    /* Graceful degradation for environments without Web Crypto */
    (void 0);
    return 'gp_fallback_'+_gnsiSignHash(plainText);
  }
  var saltBytes=new Uint8Array(16);
  window.crypto.getRandomValues(saltBytes);
  var saltHex=Array.from(saltBytes).map(function(b){return ('00'+b.toString(16)).slice(-2);}).join('');
  var enc=new TextEncoder();
  var keyMaterial=await window.crypto.subtle.importKey('raw',enc.encode(plainText),{name:'PBKDF2'},false,['deriveBits']);
  var derived=await window.crypto.subtle.deriveBits(
    {name:'PBKDF2',salt:enc.encode('GNSI·2026·'+saltHex),iterations:100000,hash:'SHA-256'},
    keyMaterial,256
  );
  var hashHex=Array.from(new Uint8Array(derived)).map(function(b){return ('00'+b.toString(16)).slice(-2);}).join('');
  return 'gpv3_'+saltHex+'_'+hashHex;
}
/* ── verifyHashPassword: verify a gpv3_ hash (async) ── */
async function verifyHashPassword(plainText, stored){
  if(!window.crypto||!window.crypto.subtle) return false;
  var parts=stored.split('_');
  if(parts.length!==3||parts[0]!=='gpv3') return false;
  var saltHex=parts[1];
  var enc=new TextEncoder();
  var keyMaterial=await window.crypto.subtle.importKey('raw',enc.encode(plainText),{name:'PBKDF2'},false,['deriveBits']);
  var derived=await window.crypto.subtle.deriveBits(
    {name:'PBKDF2',salt:enc.encode('GNSI·2026·'+saltHex),iterations:100000,hash:'SHA-256'},
    keyMaterial,256
  );
  var hashHex=Array.from(new Uint8Array(derived)).map(function(b){return ('00'+b.toString(16)).slice(-2);}).join('');
  return hashHex===parts[2];
}
function getStoredHash(staffId){
  return localStorage.getItem('gnsi_pwd_'+staffId)||null;
}
async function setStoredHash(staffId, plainText){
  var h = await hashPassword(plainText);
  localStorage.setItem('gnsi_pwd_'+staffId, h);
  localStorage.setItem('gnsi_pwd_changed_'+staffId, '1');
  /* ── FIX: for PORTAL_USERS (admin), stamp gnsi_pu_hash_<uname> so the
     startup IIFE never re-sets must_change after password is changed ── */
  try {
    var _pu = window.PORTAL_USERS || {};
    Object.keys(_pu).forEach(function(uname) {
      if (String(_pu[uname].staffId) === String(staffId)) {
        localStorage.setItem('gnsi_pu_hash_' + uname, h);
        localStorage.removeItem('gnsi_pu_must_change_' + uname);
      }
    });
  } catch(e) {}
  /* Permanent marker — survives logout, prevents IIFE from ever re-flagging */
  try { localStorage.setItem('gnsi_pwd_ever_set_' + staffId, '1'); } catch(e) {}
  /* ── Push new hash to Supabase with must_change='0' always ── */
  var client = (typeof _getSb === 'function' && _getSb()) || _supa;
  if (client) {
    /* For PORTAL_USERS admin (staff_id=1), gnsi_uname_1 is never set in localStorage
       (it is local-only and blocked from cloud). Resolve the username directly from
       PORTAL_USERS so the gnsi_staff_credentials row gets the correct uname and can
       be matched on any device during login. */
    var uname = localStorage.getItem('gnsi_uname_' + staffId) || null;
    if (!uname && window.PORTAL_USERS) {
      Object.keys(window.PORTAL_USERS).forEach(function(u) {
        if (String(window.PORTAL_USERS[u].staffId) === String(staffId)) uname = u;
      });
    }
    var roleKey = localStorage.getItem('gnsi_role_' + staffId) || null;
    var roleSig = localStorage.getItem('gnsi_role_sig_' + staffId) || null;
    client.from('gnsi_staff_credentials')
      .upsert({
        staff_id:    staffId,
        uname:       uname,
        pwd_hash:    h,
        must_change: '0',   /* always clear must_change when password is set */
        role_key:    roleKey,
        role_sig:    roleSig,
        updated_at:  new Date().toISOString()
      }, { onConflict: 'staff_id' })
      .then(function(r) {
        if (r && r.error) { (void 0); }
        else if (typeof setSyncStatus === 'function') setSyncStatus('synced');
      })
      .catch(function(e) { (void 0); });
  }
  return h;
}
function hasMustChangeFlag(staffId){
  return localStorage.getItem('gnsi_pwd_must_change_'+staffId)==='1';
}
function setMustChangeFlag(staffId){
  localStorage.setItem('gnsi_pwd_must_change_'+staffId,'1');
}
function clearMustChangeFlag(staffId){
  var _key = 'gnsi_pwd_must_change_' + staffId;
  localStorage.removeItem(_key);
  /* Remove KV timestamp so a stale cloud value cannot be written back on next pull */
  localStorage.removeItem('gnsi_kv_ts_' + _key);
  /* Also clear for admin (PORTAL_USERS) usernames */
  try {
    var _pu = window.PORTAL_USERS || {};
    Object.keys(_pu).forEach(function(uname) {
      if (_pu[uname].staffId === staffId || _pu[uname].staffId === parseInt(staffId)) {
        localStorage.removeItem('gnsi_pu_must_change_' + uname);
      }
    });
  } catch(e) {}
  /* ── FIX: write must_change=0 directly to Supabase gnsi_staff_credentials ──
     This is the single source of truth for ALL devices. Without this,
     the flag only clears on the current device's localStorage. ── */
  if (typeof _supa !== 'undefined' && _supa) {
    _supa.from('gnsi_staff_credentials')
      .upsert({ staff_id: parseInt(staffId), must_change: '0', updated_at: new Date().toISOString() }, { onConflict: 'staff_id' })
      .then(function(r) {
        if (r && r.error) { (void 0); }
      })
      .catch(function(e) { (void 0); });
  }
  /* Also push '0' via KV as fallback for devices that pull KV */
  if (typeof gnsiKVPush === 'function') gnsiKVPush(_key, '0');
}
async function verifyPassword(staffId,plainText,staffName){
  var stored=getStoredHash(staffId);
  /* No stored hash — check default password (first login) */
  if(!stored){ return plainText===defaultPassword(staffName); }
  /* New PBKDF2 hash — async verify */
  if(stored.indexOf('gpv3_')===0){ return verifyHashPassword(plainText,stored); }
  /* Old FNV hash (gp_) — verify sync, then silently upgrade to PBKDF2 */
  if(stored.indexOf('gp_')===0){
    var oldFnv32=_gnsiSignHash(plainText).replace('gs_','gp_');
    /* Recompute old gp_ hash for comparison (legacy FNV-32 2000 rounds) */
    var ROUNDS=2000; var SALT='GNSI·INST·2026·SECURE';
    function _fnv32(s){var h=0x811c9dc5;for(var i=0;i<s.length;i++){h^=(s.charCodeAt(i)&0xff);h=(h>>>0);h=((h*16777619)>>>0);}return ('00000000'+h.toString(16)).slice(-8);}
    var v=_fnv32(SALT+plainText+SALT+plainText.length.toString(16));
    for(var r=0;r<ROUNDS;r++){v=_fnv32(v+plainText+SALT+(r&0xff).toString(16));}
    var gpHash='gp_'+v;
    if(gpHash===stored){
      /* Correct password — upgrade to PBKDF2 silently */
      setStoredHash(staffId,plainText); /* async fire-and-forget upgrade */
      return true;
    }
    return false;
  }
  /* Very old djb2 hash (h...) — upgrade if matches */
  if(_legacyHash(plainText)===stored){ setStoredHash(staffId,plainText); return true; }
  return false;
}
function getUsername(staffId){
  return localStorage.getItem('gnsi_uname_'+staffId)||null;
}
function setUsername(staffId,username){
  localStorage.setItem('gnsi_uname_'+staffId,username.trim().toLowerCase());
}
function deleteUsername(staffId){
  var _gnsiAllowed=['admin'];
  if(!currentUser||_gnsiAllowed.indexOf(currentUser.role)<0){
    if(typeof showToast==='function')showToast('🔒 Access denied: Delete login credential','#dc2626');
    return;
  }

  var _key = 'gnsi_uname_'+staffId;
  localStorage.removeItem(_key);
  // Push empty value to cloud so other devices also clear this username
  if(typeof gnsiKVPush==='function') gnsiKVPush(_key, '');
}
function findStaffByUsername(username){
  // Returns staff member whose assigned username matches
  var uname=(username||'').trim().toLowerCase();
  if(!uname)return null;
  return staff.find(function(s){
    var stored=getUsername(s.id);
    return stored===uname;
  })||null;
}
var _loginFailCount = 0;
var _LOCKOUT_MAX_FAILS = 5;
var _LOCKOUT_DURATION_MS = 15 * 60 * 1000;
/* SECURITY PATCH v4: Shadow server-side lockout via Supabase gnsi_keyvalue.
   Writes a lockout record to the DB on every failed login so that clearing
   localStorage cannot bypass the lockout on a different device or after
   DevTools manipulation. Checked at login time if Supabase is reachable. */
async function _gnsiServerLockCheck(uname){
  try{
    if(typeof _supa==='undefined'||!_supa) return null;
    var key='lockout_'+uname;
    var {data}=await _supa.from('gnsi_keyvalue').select('value').eq('key',key).single();
    if(!data||!data.value) return null;
    var rec=JSON.parse(data.value);
    if(rec.lockUntil&&rec.lockUntil>Date.now()){
      var mins=Math.ceil((rec.lockUntil-Date.now())/60000);
      return 'Account locked (server). Try again in '+mins+' minute'+(mins===1?'':'s')+'.';
    }
    return null;
  }catch(e){ return null; }
}
async function _gnsiServerLockRecord(uname, success){
  try{
    if(typeof _supa==='undefined'||!_supa) return;
    var key='lockout_'+uname;
    if(success){
      await _supa.from('gnsi_keyvalue').delete().eq('key',key);
      return;
    }
    var {data}=await _supa.from('gnsi_keyvalue').select('value').eq('key',key).single().catch(function(){return {data:null};});
    var rec=data&&data.value?JSON.parse(data.value):{count:0};
    rec.count=(rec.count||0)+1;
    if(rec.count>=_LOCKOUT_MAX_FAILS) rec.lockUntil=Date.now()+_LOCKOUT_DURATION_MS;
    await _supa.from('gnsi_keyvalue').upsert({key:key,value:JSON.stringify(rec)},{onConflict:'key'});
  }catch(e){}
}
function _getLockoutData(uname){
  try{return JSON.parse(localStorage.getItem('gnsi_lkout_'+(uname||'_'))||'{"count":0,"lockUntil":0}');}
  catch(e){return{count:0,lockUntil:0};}
}
function _setLockoutData(uname,data){
  localStorage.setItem('gnsi_lkout_'+(uname||'_'),JSON.stringify(data));
  // ⚑ SECURITY: also persist to Supabase so clearing localStorage doesn't bypass lockout
  if(_supa){
    _supa.from('gnsi_keyvalue')
      .upsert({key:'gnsi_lkout_'+uname,value:JSON.stringify(data),updated_at:new Date().toISOString()},{onConflict:'key'})
      .then(function(){}).catch(function(){});
  }
}
function _clearLockout(uname){
  localStorage.removeItem('gnsi_lkout_'+(uname||'_'));
  if(_supa){
    _supa.from('gnsi_keyvalue').delete().eq('key','gnsi_lkout_'+uname)
      .then(function(){}).catch(function(){});
  }
}
function isLockedOut(uname){
  var d=_getLockoutData(uname);
  if(d.lockUntil&&Date.now()<d.lockUntil){
    var secsLeft=Math.ceil((d.lockUntil-Date.now())/1000);
    return 'Account locked. Try again in '+Math.floor(secsLeft/60)+'m '+secsLeft%60+'s.';
  }
  if(d.lockUntil&&Date.now()>=d.lockUntil){_clearLockout(uname);}
  return false;
}
/* On login page load: pull lockout from cloud in case localStorage was cleared */
function _gnsiSyncLockoutFromCloud(uname, callback){
  if(!_supa){if(callback)callback();return;}
  /* Timeout guard: max 2 s — if cloud is slow, proceed with local lockout data */
  var _lo_done=false;
  var _lo_timer=setTimeout(function(){
    if(_lo_done)return; _lo_done=true; if(callback)callback();
  },2000);
  /* FIX v71: maybeSingle() avoids PGRST116 error when no lockout row exists */
  _supa.from('gnsi_keyvalue').select('value').eq('key','gnsi_lkout_'+uname).maybeSingle()
    .then(function(r){
      clearTimeout(_lo_timer);
      if(_lo_done)return; _lo_done=true;
      if(r&&r.data&&r.data.value){
        try{
          var cloud=JSON.parse(r.data.value);
          var local=_getLockoutData(uname);
          if((cloud.lockUntil||0)>(local.lockUntil||0)||(cloud.count||0)>(local.count||0)){
            localStorage.setItem('gnsi_lkout_'+uname, JSON.stringify(cloud));
          }
        }catch(e){}
      }
      if(callback)callback();
    }).catch(function(){ clearTimeout(_lo_timer); if(_lo_done)return; _lo_done=true; if(callback)callback(); });
}
function recordLoginFail(uname){
  var d=_getLockoutData(uname);
  d.count=(d.count||0)+1;
  if(d.count>=_LOCKOUT_MAX_FAILS){d.lockUntil=Date.now()+_LOCKOUT_DURATION_MS;}
  _setLockoutData(uname,d);
  return d.count;
}
function showLoginError(msg){
  var el=document.getElementById('login-error');
  if(el){el.textContent=msg;el.style.display='block';}
  _loginFailCount++;
  if(_loginFailCount>=_LOCKOUT_MAX_FAILS){
    var wrap=document.getElementById('reset-admin-wrap');
    if(wrap)wrap.style.display='block';
  }
}
function gnsiMapSupabaseUser(supaUser) {
  if (!supaUser || !supaUser.email) return null;
  var email = supaUser.email.toLowerCase();
  // Match by email field on staff record
  return staff.find(function(s) { return s.email && s.email.toLowerCase() === email; }) || null;
}
function gnsiCompleteSupabaseLogin(member) {
  if (!member) { showLoginError('No staff account is linked to this email. Contact your Administrator.'); return; }
  var sysRole = detectRole(member);
  if (member.id === 1) sysRole = 'admin';
  currentUser = {
    id: member.id, name: member.name,
    role: sysRole, staffRole: member.role,
    pages: member.id === 1 ? ROLE_PAGES.admin : (ROLE_PAGES[sysRole] || ROLE_PAGES.staff)
  };
  if(typeof applyPendingRolePages==='function') applyPendingRolePages(); // v63: apply staged cloud role pages now that hash is available
  saveSession(currentUser);
  hideLoginScreen();
  initApp(); // PERF FIX: show dashboard immediately with local data
  _gnsiRunPostLoginSync(); // sync from cloud in background
}
function renderReportCard(){
  var classes=staff.length?[...new Set(students.map(function(s){return s.cls||''}))].filter(Boolean).sort():[];
  var exTypes=typeof loadExamTypes==='function'?loadExamTypes():['Unit Test I','Half-Yearly','Annual'];
  _rcFilterClass=_rcFilterClass||classes[0]||'';
  _rcFilterExam=_rcFilterExam||exTypes[0]||'';
  var classOpts=classes.map(function(c){return'<option value="'+esc(c)+'"'+(_rcFilterClass===c?' selected':'')+'>'+esc(c)+'</option>';}).join('');
  var examOpts=exTypes.map(function(e){return'<option value="'+esc(e)+'"'+(_rcFilterExam===e?' selected':'')+'>'+esc(e)+'</option>';}).join('');
  var filteredStudents=students.filter(function(s){return !_rcFilterClass||s.cls===_rcFilterClass;});
  var rows=filteredStudents.map(function(s,idx){
    return '<tr>'
      +'<td>'+esc(s.name)+'</td><td>'+esc(s.cls||'--')+'</td><td>'+esc(s.roll||'--')+'</td>'
      +'<td style="white-space:nowrap"><button onclick="gnsiPrintReportCard('+parseInt(s.id,10)+',\''+esc(_rcFilterExam)+'\')" style="background:var(--accent-light);color:var(--accent);border:1px solid var(--accent);border-radius:6px;padding:4px 10px;cursor:pointer;font-weight:700;font-size:11px;font-family:\'DM Sans\',sans-serif">Print Card</button></td>'
      +'</tr>';
  }).join('');
  return '<div class="card" style="margin-bottom:16px"><div class="card-head"><span class="card-title">📄 Generate Report Cards</span>'
    +'<button onclick="gnsiPrintAllReportCards(\''+esc(_rcFilterClass)+'\',\''+esc(_rcFilterExam)+'\')" class="btn btn-primary">Print All ('+filteredStudents.length+')</button>'
    +'</div><div style="padding:16px 20px;display:flex;gap:12px;flex-wrap:wrap">'
    +'<select onchange="_rcFilterClass=this.value;render()" style="padding:8px 12px;border:1.5px solid var(--border);border-radius:9px;font-size:13px;background:var(--surface)"><option value="">All Classes</option>'+classOpts+'</select>'
    +'<select onchange="_rcFilterExam=this.value;render()" style="padding:8px 12px;border:1.5px solid var(--border);border-radius:9px;font-size:13px;background:var(--surface)">'+examOpts+'</select>'
    +'</div></div>'
    +'<div class="card"><div style="overflow-x:auto"><table><thead><tr><th>Student</th><th>Class</th><th>Roll</th><th>Action</th></tr></thead><tbody>'
    +(rows||'<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:24px">No students found</td></tr>')
    +'</tbody></table></div></div>';
}
function _gnsiRCBuildA4(stu, examType, subjects, marks, attCount, totalDays, attPct, idx, total, _rcCfg) {
  _rcCfg=_rcCfg||{};
  /* -- Editable defaults -- */
  var _rcInstName  = _rcCfg.instName  || (window.TENANT?window.TENANT.name:'Guidance Navodaya &amp; Sainik Institute');
  var _rcInstAddr  = _rcCfg.instAddr  || (window.TENANT?window.TENANT.address+' &mdash; '+window.TENANT.pincode:'Khangabok Sorok Wangma, Thoubal, Manipur &mdash; 795 138');
  var _rcInstWeb   = _rcCfg.instWeb   || (window.TENANT && (window.TENANT.website || window.TENANT.phone) ? (window.TENANT.website || window.TENANT.phone) : 'School Management Portal');
  var _rcTestName  = _rcCfg.testName  || 'EXAMINATION';
  var _rcTestDate  = _rcCfg.testDate  || '';
  var _rcRemarks   = _rcCfg.remarks   || '';
  var _rcConduct   = _rcCfg.conduct   || '';
  var _rcSig1      = _rcCfg.sig1      || 'Class Teacher';
  var _rcSig2      = _rcCfg.sig2      || 'Class Master';
  var _rcSig3      = _rcCfg.sig3      || 'Controller of Exams';
  var _rcSig4      = _rcCfg.sig4      || 'Parent / Guardian';
  var _rcFooter    = _rcCfg.footerNote|| 'This is a computer-generated document.';
  var totalObt=0, totalMax=0, validCount=0;
  var gradeRows=marks.map(function(m,i){
    var mc=parseFloat(m.mark);
    var isValid=!isNaN(mc);
    var maxM=m.max||100;
    if(isValid){totalObt+=mc;totalMax+=maxM;validCount++;}
    var subPct=isValid?Math.round(mc/maxM*100):null;
    var g='--',gCol='#555';
    if(isValid){
      if(subPct>=90){g='A+';gCol='#0a6e3f';}
      else if(subPct>=75){g='A';gCol='#16a34a';}
      else if(subPct>=60){g='B+';gCol='#1433a8';}
      else if(subPct>=50){g='B';gCol='#0284c7';}
      else if(subPct>=40){g='C';gCol='#d97706';}
      else if(subPct>=33){g='D';gCol='#ea580c';}
      else{g='F';gCol='#dc2626';}
    }
    var barW=subPct!==null?subPct:0;
    var barC=subPct===null?'#ccc':subPct>=60?'#16a34a':subPct>=33?'#d97706':'#dc2626';
    var bg=i%2===1?'#f7f8fe':'#fff';
    return '<tr style="background:'+bg+'">'
      +'<td style="padding:7px 12px;font-size:11.5px;font-weight:600;color:#0a1229;border-bottom:1px solid #e8ecf5">'+(i+1)+'. '+esc(m.sub||'')+'</td>'
      +'<td style="padding:7px 8px;text-align:center;font-size:11px;font-weight:700;color:#555;border-bottom:1px solid #e8ecf5;font-family:monospace">'+maxM+'</td>'
      +'<td style="padding:7px 8px;text-align:center;font-size:13px;font-weight:800;color:#0a1229;border-bottom:1px solid #e8ecf5;font-family:monospace">'+(isValid?m.mark:'--')+'</td>'
      +'<td style="padding:7px 8px;text-align:center;border-bottom:1px solid #e8ecf5">'
      +  '<div style="display:flex;align-items:center;gap:5px;justify-content:center">'
      +    '<div style="width:48px;height:5px;background:#e5e7eb;border-radius:3px;overflow:hidden"><div style="width:'+barW+'%;height:100%;background:'+barC+'"></div></div>'
      +    '<span style="font-size:10.5px;font-weight:700;color:'+barC+';font-family:monospace">'+(subPct!==null?subPct+'%':'--')+'</span>'
      +  '</div>'
      +'</td>'
      +'<td style="padding:7px 8px;text-align:center;font-size:12px;font-weight:800;color:'+gCol+';border-bottom:1px solid #e8ecf5">'+g+'</td>'
      +'</tr>';
  });
  var overallPct=totalMax>0?Math.round(totalObt/totalMax*100):0;
  var overallG='--',overallGCol='#555',resultTxt='PENDING',resultCol='#555';
  if(totalMax>0){
    if(overallPct>=90){overallG='A+';overallGCol='#0a6e3f';}
    else if(overallPct>=75){overallG='A';overallGCol='#16a34a';}
    else if(overallPct>=60){overallG='B+';overallGCol='#1433a8';}
    else if(overallPct>=50){overallG='B';overallGCol='#0284c7';}
    else if(overallPct>=40){overallG='C';overallGCol='#d97706';}
    else if(overallPct>=33){overallG='D';overallGCol='#ea580c';}
    else{overallG='F';overallGCol='#dc2626';}
    resultTxt=overallPct>=33?'PASS':'FAIL';
    resultCol=overallPct>=33?'#16a34a':'#dc2626';
  }
  var pbStyle=idx<total-1?'page-break-after:always;':'';
  var infoFields=[
    ['Student Name',(stu.name||'--').toUpperCase(),true],
    ['Class / Batch',(stu.cls||'--'),false],
    ['Roll Number',(stu.roll||stu.rollNo||'--'),false],
    ["Father's Name",(stu.father||'--'),false],
    ['Date of Birth',(stu.dob||'--'),false],
    ['Admission No.',(stu.admNo||String(stu.id||'--')),false],
  ];
  var summaryItems=[
    ['Result',resultTxt,resultCol],
    ['Grade',overallG,overallGCol],
    ['Percentage',overallPct+'%','#1433a8'],
    ['Attendance',attPct+'%',attPct>=75?'#16a34a':'#dc2626'],
    ['Days Present',attCount+' / '+totalDays,'#555'],
  ];
  var sigItems=[_rcSig1,_rcSig2,_rcSig3,_rcSig4];
  var conductItems=['Excellent','Good','Satisfactory','Needs Improvement'];
  return '<div style="'+pbStyle+'width:210mm;min-height:297mm;margin:0 auto;background:#fff;position:relative;box-sizing:border-box;font-family:\'Segoe UI\',Arial,sans-serif">'
    +'<div style="position:absolute;inset:6mm;border:2.5px solid #1433a8;pointer-events:none;z-index:10"></div>'
    +'<div style="position:absolute;inset:8.5mm;border:1px solid #c0ccee;pointer-events:none;z-index:10"></div>'
    +'<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-35deg);font-size:90px;font-weight:900;color:rgba(20,51,168,0.04);white-space:nowrap;pointer-events:none;font-family:Georgia,serif;letter-spacing:6px;z-index:0">GNSI</div>'
    +'<div style="position:relative;z-index:1;padding:12mm 14mm 10mm">'
    /* HEADER */
    +'<div style="display:flex;align-items:center;gap:14px;border-bottom:3px double #1433a8;padding-bottom:10px">'
    +  '<div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#1433a8,#1b44cc);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 3px 12px rgba(20,51,168,0.35)">'
    +    '<span style="font-family:Georgia,serif;font-size:26px;font-weight:900;color:#fff">G</span>'
    +  '</div>'
    +  '<div style="flex:1;text-align:center">'
    +    '<div style="font-family:Georgia,\'Times New Roman\',serif;font-size:22px;font-weight:700;color:#0b1e6e;letter-spacing:0.5px;line-height:1.2">'+_rcInstName+'</div>'
    +    '<div style="font-size:11px;color:#555;margin-top:3px;letter-spacing:2px;text-transform:uppercase">'+_rcInstAddr+'</div>'
    +    '<div style="font-size:10px;color:#888;margin-top:2px;letter-spacing:1px">'+_rcInstWeb+'</div>'
    +  '</div>'
    +  '<div style="width:70px;height:84px;border:1.5px solid #aab;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#f7f8fc;flex-shrink:0">'
    +    '<div style="font-size:24px;color:#ccc">&#128100;</div>'
    +    '<div style="font-size:7.5px;color:#aaa;text-align:center;margin-top:2px;letter-spacing:0.5px">PHOTO</div>'
    +  '</div>'
    +'</div>'
    /* EXAM BANNER */
    +'<div style="background:linear-gradient(135deg,#0b1e6e,#1433a8,#1b44cc);color:#fff;padding:8px 20px;display:flex;align-items:center;justify-content:space-between;margin:0 -14mm;padding-left:14mm;padding-right:14mm">'
    +  '<span style="font-size:9px;letter-spacing:3px;opacity:0.8;text-transform:uppercase">Academic Progress Report</span>'
    +  '<div style="text-align:center;line-height:1.4">'
    +    '<div style="font-size:13px;font-weight:800;letter-spacing:2px;text-transform:uppercase">&#128203; REPORT CARD</div>'
    +    '<div style="font-size:11px;font-weight:800;opacity:.95;letter-spacing:.5px;text-transform:uppercase;margin-top:1px">'+_rcTestName+'</div>'
    +    '<div style="font-size:9.5px;font-weight:700;opacity:.85;margin-top:1px">DATE OF TEST: '+_rcTestDate+'</div>'
    +  '</div>'
    +  '<span style="font-size:9px;letter-spacing:2px;opacity:0.8;text-transform:uppercase">'+new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})+'</span>'
    +'</div>'
    /* STUDENT INFO */
    +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;border:1.5px solid #dde2f0;margin-top:10px">'
    +infoFields.map(function(f,fi){
      return '<div style="padding:7px 10px;border-right:'+(fi%3===2?'none':'1px solid #dde2f0')+';border-top:'+(fi>2?'1px solid #dde2f0':'none')+';background:'+(fi%2===0?'#f7f8fe':'#fff')+'">'
        +'<div style="font-size:8.5px;color:#888;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin-bottom:3px">'+f[0]+'</div>'
        +'<div style="font-size:'+(f[2]?'12.5':'11.5')+'px;font-weight:'+(f[2]?'800':'700')+';color:#0a1229">'+esc(f[1])+'</div>'
        +'</div>';
    }).join('')
    +'</div>'
    /* MARKS TABLE */
    +'<div style="margin-top:12px">'
    +  '<div style="background:#0b1e6e;color:#fff;padding:7px 12px;font-size:9.5px;font-weight:700;letter-spacing:2px;text-transform:uppercase">&#127891; Academic Performance</div>'
    +  '<table style="width:100%;border-collapse:collapse;font-size:11.5px">'
    +    '<thead><tr style="background:linear-gradient(135deg,#1433a8,#1b44cc);color:#fff">'
    +      '<th style="padding:8px 12px;text-align:left;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700"># &nbsp;Subject</th>'
    +      '<th style="padding:8px 8px;text-align:center;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700">Max</th>'
    +      '<th style="padding:8px 8px;text-align:center;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700">Obtained</th>'
    +      '<th style="padding:8px 8px;text-align:center;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700">Performance</th>'
    +      '<th style="padding:8px 8px;text-align:center;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700">Grade</th>'
    +    '</tr></thead>'
    +    '<tbody>'+gradeRows.join('')+'</tbody>'
    +    '<tfoot><tr style="background:#0b1e6e;color:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact">'
    +      '<td style="padding:9px 12px;font-weight:800;font-size:12px;letter-spacing:1px;color:#fff">GRAND TOTAL</td>'
    +      '<td style="padding:9px 8px;text-align:center;font-weight:800;font-size:12px;font-family:monospace;color:#fff">'+(totalMax||'--')+'</td>'
    +      '<td style="padding:9px 8px;text-align:center;font-weight:800;font-size:14px;font-family:monospace;color:#fff">'+(validCount>0?totalObt:'--')+'</td>'
    +      '<td style="padding:9px 8px;text-align:center;font-weight:800;font-size:12px;font-family:monospace;color:#fff">'+(validCount>0?overallPct+'%':'--')+'</td>'
    +      '<td style="padding:9px 8px;text-align:center;font-weight:900;font-size:16px;background:'+overallGCol+';color:#fff;border-radius:4px;-webkit-print-color-adjust:exact;print-color-adjust:exact">'+overallG+'</td>'
    +    '</tr></tfoot>'
    +  '</table>'
    +'</div>'
    /* SUMMARY CARDS */
    +'<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:0;border:1.5px solid #dde2f0;margin-top:10px">'
    +summaryItems.map(function(c,ci){
      return '<div style="padding:10px 6px;text-align:center;border-right:'+(ci===4?'none':'1px solid #dde2f0')+';background:'+(ci%2===0?'#f7f8fe':'#fff')+'">'
        +'<div style="font-size:8px;color:#888;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin-bottom:5px">'+c[0]+'</div>'
        +'<div style="font-size:16px;font-weight:900;font-family:monospace;color:'+c[2]+';line-height:1">'+esc(c[1])+'</div>'
        +'</div>';
    }).join('')
    +'</div>'
    /* REMARKS & CONDUCT */
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:10px">'
    +  '<div style="border:1px solid #dde2f0;padding:8px 12px">'
    +    '<div style="font-size:8.5px;color:#888;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin-bottom:6px">Teacher\'s Remarks</div>'
    +  (_rcRemarks
      ? '<div style="font-size:11px;color:#0a1229;line-height:1.6;min-height:36px;white-space:pre-wrap">'+esc(_rcRemarks)+'</div>'
      : '<div style="border-bottom:1px solid #bbb;min-height:18px;margin-bottom:5px"></div><div style="border-bottom:1px solid #bbb;min-height:18px"></div>')
    +  '</div>'
    +  '<div style="border:1px solid #dde2f0;padding:8px 12px">'
    +    '<div style="font-size:8.5px;color:#888;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin-bottom:8px">Conduct &amp; Discipline</div>'
    +    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">'
    +    conductItems.map(function(c){
           var isSelected=_rcConduct===c;
           return '<label style="display:flex;align-items:center;gap:4px;font-size:10px;color:'+(isSelected?'#1433a8':'#555')+';font-weight:'+(isSelected?'800':'400')+'">'
             +'<span style="width:11px;height:11px;border:'+(isSelected?'3px solid #1433a8':'1.5px solid #aaa')+';display:inline-block;border-radius:50%;flex-shrink:0;background:'+(isSelected?'#1433a8':'transparent')+'"></span>'+c+'</label>';
         }).join('')
    +    '</div>'
    +  '</div>'
    +'</div>'
    /* SIGNATURES */
    +'<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0;margin-top:16px;border-top:1px solid #dde2f0;padding-top:14px">'
    +sigItems.map(function(sig){
      return '<div style="text-align:center;padding:0 6px">'
        +'<div style="margin-top:28px;border-top:1.5px solid #333;padding-top:5px;font-size:9.5px;font-weight:700;color:#333">'+sig+'</div>'
        +'<div style="font-size:8px;color:#aaa;margin-top:2px;text-transform:uppercase;letter-spacing:0.5px">Signature &amp; Date</div>'
        +'</div>';
    }).join('')
    +'</div>'
    /* FOOTER */
    +'<div style="margin-top:10px;padding-top:8px;border-top:1px dashed #dde2f0;display:flex;justify-content:space-between;align-items:center">'
    +  '<div style="font-size:8px;color:#aaa;letter-spacing:0.5px">Generated: '+new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})+' &nbsp;|&nbsp; GNSI Management Portal</div>'
    +  '<div style="font-size:8px;color:#aaa;font-style:italic">'+_rcFooter+'</div>'
    +  '<div style="font-size:8px;color:#aaa">Roll: '+esc(stu.roll||stu.rollNo||'--')+'</div>'
    +'</div>'
    +'</div>'
    +'</div>';
}
function _gnsiRCWindow(title, bodyHTML, count) {
  var w=window.open('','_blank','width=960,height=1120');
  if(!w){alert('Allow popups to print report cards.');return;}
  w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>'+title+'</title>'
    +'<style>'
    +'*{margin:0;padding:0;box-sizing:border-box}'
    +'html,body{width:100%;background:#c8c8c8;font-family:"Segoe UI",Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}'
    +'body{padding:20px}'
    +'@media print{'
    +  'html,body{background:#fff!important;padding:0!important;margin:0!important}'
    +  '@page{size:210mm 297mm;margin:0;padding:0}'
    +  '.gnsi-noprint{display:none!important}'
    +  'div[style*="page-break-after:always"]{page-break-after:always!important;break-after:page!important}'
    +  'div[style*="width:210mm"]{margin:0!important;box-shadow:none!important}'
    +'}'
    +'.gnsi-noprint{text-align:center;margin-bottom:20px;padding:14px 22px;background:#fff;border-radius:12px;box-shadow:0 2px 14px rgba(0,0,0,.18);display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap}'
    +'.gnsi-noprint button{padding:11px 28px;background:#1433a8;color:#fff;border:none;border-radius:9px;font-size:14px;font-weight:700;cursor:pointer;font-family:"Segoe UI",sans-serif;transition:opacity .15s}'
    +'.gnsi-noprint button:hover{opacity:0.85}'
    +'.gnsi-noprint button.sec{background:#fff;color:#1433a8;border:2px solid #1433a8}'
    +'.gnsi-noprint .hint{font-size:11.5px;color:#666;width:100%;text-align:center;margin-top:4px;line-height:1.7}'
    +'</style></head><body>'
    +'<div class="gnsi-noprint">'
    +  '<button onclick="window.print()">&#128424;&#65039;&nbsp; Print '+(count>1?'All '+count+' Cards':'Report Card')+'</button>'
    +  '<button class="sec" onclick="window.close()">&#10005;&nbsp; Close</button>'
    +  '<div class="hint">&#8505;&#65039; Printer settings: <b>A4 Portrait &nbsp;·&nbsp; No scaling (100%) &nbsp;·&nbsp; Margins: None</b>'+(count>1?' &nbsp;·&nbsp; Each student on a separate page':'')+'</div>'
    +'</div>'
    +bodyHTML
    +'</body></html>');
  w.document.close();
}
function gnsiPrintReportCard(stuId,examType){
  gnsiShowRCEditModal(stuId,examType);
}
function gnsiPrintAllReportCards(cls,examType){
  gnsiShowRCBulkEditModal(cls,examType);
}
/* ══════════════════════════════════════════════════════════════
   4. STAFF PERFORMANCE APPRAISAL
══════════════════════════════════════════════════════════════ */
var _aprId=null;
function gnsiAppraisals(){return gnsiLoad('gnsi_appraisals')||[];}
function gnsiSaveAppraisals(d){gnsiSave('gnsi_appraisals',d);}
function renderCertificate(){
  _gnsiCertInjectCSS();
  /* page header */
  var html = '<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">'
    +'<div style="width:40px;height:40px;background:linear-gradient(135deg,#1a1a2e,#3a1a0e);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">🏅</div>'
    +'<div><div style="font-size:20px;font-weight:800;color:var(--text);font-family:\'Playfair Display\',serif">Premium Certificate Studio</div>'
    +'<div style="font-size:12px;color:var(--muted);margin-top:1px">Live editor · Multi-font · Bulk A4 export · Print-ready PDF</div></div>'
    +'</div>';
  /* toggle button */
  html += '<button class="gnsi-cv5-tbtn" onclick="_gcv5ToggleEd()">'
    +'<span id="gnsiCv5TIcon">\u25b2</span>&nbsp;<span id="gnsiCv5TLbl">Hide Editor</span></button>';
  /* -- Editor panel -- */
  html += '<div id="gnsiCv5EdPanel" class="gnsi-cv5-ep">'
    +'<div class="gnsi-cv5-et">\uD83C\uDF9F GNSI Premium Certificate Editor v5</div>'
    /* tabs */
    +'<div class="gnsi-cv5-tabs">'
    +'<div class="gnsi-cv5-tab active" onclick="_gcv5SwitchTab(\'content\',this)">Content</div>'
    +'<div class="gnsi-cv5-tab" onclick="_gcv5SwitchTab(\'fonts\',this)">Fonts &amp; Sizes</div>'
    +'<div class="gnsi-cv5-tab" onclick="_gcv5SwitchTab(\'colors\',this)">Colours</div>'
    +'<div class="gnsi-cv5-tab" onclick="_gcv5SwitchTab(\'logos\',this)">Logos</div>'
    +'<div class="gnsi-cv5-tab" onclick="_gcv5SwitchTab(\'bulk\',this)">Bulk Export</div>'
    +'</div>'
    /* -- CONTENT TAB -- */
    +'<div class="gnsi-cv5-tab-panel active" id="gnsi_cv5_tab_content">'
    +'<div class="gnsi-cv5-grid">'
    +'<div class="gnsi-cv5-fg" style="grid-column:1/-1"><label>Award Tagline</label><input type="text" id="gnsiCv5FTag" value="Awarded for Outstanding Performance in the Navodaya Pre-Mock Test 2025"></div>'
    +'<div class="gnsi-cv5-fg" style="grid-column:1/-1"><label>Institute Name</label><input type="text" id="gnsiCv5FInst" value="GUIDANCE NAVODAYA &amp; SAINIK INSTITUTE"></div>'
    +'<div class="gnsi-cv5-fg" style="grid-column:1/-1"><label>Address</label><input type="text" id="gnsiCv5FAddr" value="Khangabok Sorok Wangma, near Community Hall, Thoubal, Manipur-795138" id="gnsiCv5FAddrDefault"></div>'
    +'<div class="gnsi-cv5-fg"><label>Student Name</label><input type="text" id="gnsiCv5FName" value="Mangaleima Sanasam"></div>'
    +'<div class="gnsi-cv5-fg"><label>Batch</label><input type="text" id="gnsiCv5FBatch" value="9th Batch"></div>'
    +'<div class="gnsi-cv5-fg"><label>Course / Group</label><input type="text" id="gnsiCv5FGrp" value="Navodaya Group"></div>'
    +'<div class="gnsi-cv5-fg"><label>Exam Name</label><input type="text" id="gnsiCv5FExam" value="1st Pre Mock Test 2025"></div>'
    +'<div class="gnsi-cv5-fg"><label>Month</label><input type="text" id="gnsiCv5FMonth" value="November 2025"></div>'
    +'<div class="gnsi-cv5-fg"><label>Marks</label><input type="text" id="gnsiCv5FMarks" value="90"></div>'
    +'<div class="gnsi-cv5-fg"><label>Out Of</label><input type="text" id="gnsiCv5FOutof" value="100"></div>'
    +'<div class="gnsi-cv5-fg"><label>Position / Rank</label><input type="text" id="gnsiCv5FRank" value="2nd"></div>'
    +'<div class="gnsi-cv5-fg" style="grid-column:1/-1"><label>Exam Full Title</label><input type="text" id="gnsiCv5FExamfull" value="Navodaya Entrance Preparation Test 2025"></div>'
    +'<div class="gnsi-cv5-fg" style="grid-column:1/-1"><label>Institute Motto</label><input type="text" id="gnsiCv5FMotto" value="Education with Integrity, Effort, and Enlightenment."></div>'
    +'<div class="gnsi-cv5-fg"><label>Sig 1 Script Text</label><input type="text" id="gnsiCv5FS1t" value="Jarwelle"></div>'
    +'<div class="gnsi-cv5-fg"><label>Sig 1 Label</label><input type="text" id="gnsiCv5FS1l" value="Signature of Administrator"></div>'
    +'<div class="gnsi-cv5-fg"><label>Sig 2 Script Text</label><input type="text" id="gnsiCv5FS2t" value="Khummualo"></div>'
    +'<div class="gnsi-cv5-fg"><label>Sig 2 Label</label><input type="text" id="gnsiCv5FS2l" value="Signature of Head of the Institution"></div>'
    +'</div></div>'
    /* -- FONTS TAB -- */
    +'<div class="gnsi-cv5-tab-panel" id="gnsi_cv5_tab_fonts">'
    +'<div class="gnsi-cv5-grid">'
    +'<div class="gnsi-cv5-sh">Display &amp; Titles</div>'
    +'<div class="gnsi-cv5-fg"><label>Institute Name \u2014 Font</label><div class="gnsi-cv5-font-row"><select id="gnsiCv5FnInst" onchange="_gcv5Update()"><option value="\'Cinzel\',serif" selected>Cinzel (Royal)</option><option value="\'Playfair Display\',serif">Playfair Display</option><option value="\'EB Garamond\',serif">EB Garamond</option><option value="\'Philosopher\',serif">Philosopher</option><option value="\'Montserrat\',sans-serif">Montserrat</option><option value="\'Raleway\',sans-serif">Raleway</option><option value="\'Josefin Sans\',sans-serif">Josefin Sans</option><option value="\'Libre Baskerville\',serif">Libre Baskerville</option></select><input type="number" id="gnsiCv5FsInst" value="22" min="10" max="60" oninput="_gcv5Update()"></div></div>'
    +'<div class="gnsi-cv5-fg"><label>Award Tagline \u2014 Font</label><div class="gnsi-cv5-font-row"><select id="gnsiCv5FnTag" onchange="_gcv5Update()"><option value="\'Cormorant Garamond\',serif" selected>Cormorant Garamond</option><option value="\'IM Fell English\',serif">IM Fell English</option><option value="\'Crimson Text\',serif">Crimson Text</option><option value="\'Lora\',serif">Lora</option><option value="\'EB Garamond\',serif">EB Garamond</option><option value="\'Playfair Display\',serif">Playfair Display</option><option value="\'Philosopher\',serif">Philosopher</option><option value="\'Libre Baskerville\',serif">Libre Baskerville</option></select><input type="number" id="gnsiCv5FsTag" value="13" min="8" max="36" oninput="_gcv5Update()"></div></div>'
    +'<div class="gnsi-cv5-fg"><label>Address \u2014 Font</label><div class="gnsi-cv5-font-row"><select id="gnsiCv5FnAddr" onchange="_gcv5Update()"><option value="\'Cormorant Garamond\',serif" selected>Cormorant Garamond</option><option value="\'Cinzel\',serif">Cinzel</option><option value="\'Lora\',serif">Lora</option><option value="\'Montserrat\',sans-serif">Montserrat</option><option value="\'Raleway\',sans-serif">Raleway</option><option value="\'EB Garamond\',serif">EB Garamond</option></select><input type="number" id="gnsiCv5FsAddr" value="10" min="7" max="24" oninput="_gcv5Update()"></div></div>'
    +'<div class="gnsi-cv5-fg"><label>Ribbon Text \u2014 Font</label><div class="gnsi-cv5-font-row"><select id="gnsiCv5FnRib" onchange="_gcv5Update()"><option value="\'Cinzel\',serif" selected>Cinzel</option><option value="\'Playfair Display\',serif">Playfair Display</option><option value="\'Montserrat\',sans-serif">Montserrat</option><option value="\'Raleway\',sans-serif">Raleway</option><option value="\'Josefin Sans\',sans-serif">Josefin Sans</option></select><input type="number" id="gnsiCv5FsRib" value="13" min="8" max="28" oninput="_gcv5Update()"></div></div>'
    +'<div class="gnsi-cv5-sh">Body &amp; Paragraphs</div>'
    +'<div class="gnsi-cv5-fg"><label>Body / Para Text \u2014 Font</label><div class="gnsi-cv5-font-row"><select id="gnsiCv5FnBody" onchange="_gcv5Update()"><option value="\'Cormorant Garamond\',serif" selected>Cormorant Garamond</option><option value="\'IM Fell English\',serif">IM Fell English</option><option value="\'Crimson Text\',serif">Crimson Text</option><option value="\'Lora\',serif">Lora</option><option value="\'EB Garamond\',serif">EB Garamond</option><option value="\'Libre Baskerville\',serif">Libre Baskerville</option><option value="\'Philosopher\',serif">Philosopher</option><option value="\'Montserrat\',sans-serif">Montserrat</option></select><input type="number" id="gnsiCv5FsBody" value="11" min="8" max="20" oninput="_gcv5Update()"></div></div>'
    +'<div class="gnsi-cv5-fg"><label>\u201cPresented To\u201d Script \u2014 Font</label><div class="gnsi-cv5-font-row"><select id="gnsiCv5FnPres" onchange="_gcv5Update()"><option value="\'Great Vibes\',cursive" selected>Great Vibes</option><option value="\'Tangerine\',cursive">Tangerine</option><option value="\'Pinyon Script\',cursive">Pinyon Script</option><option value="\'Sacramento\',cursive">Sacramento</option><option value="\'Alex Brush\',cursive">Alex Brush</option></select><input type="number" id="gnsiCv5FsPres" value="19" min="12" max="40" oninput="_gcv5Update()"></div></div>'
    +'<div class="gnsi-cv5-fg"><label>OF APPRECIATION \u2014 Font</label><div class="gnsi-cv5-font-row"><select id="gnsiCv5FnApprec" onchange="_gcv5Update()"><option value="\'Cinzel\',serif" selected>Cinzel</option><option value="\'Montserrat\',sans-serif">Montserrat</option><option value="\'Raleway\',sans-serif">Raleway</option><option value="\'Josefin Sans\',sans-serif">Josefin Sans</option><option value="\'Cormorant Garamond\',serif">Cormorant Garamond</option></select><input type="number" id="gnsiCv5FsApprec" value="10" min="7" max="20" oninput="_gcv5Update()"></div></div>'
    +'<div class="gnsi-cv5-sh">Signatures</div>'
    +'<div class="gnsi-cv5-fg"><label>Signature Script \u2014 Font</label><div class="gnsi-cv5-font-row"><select id="gnsiCv5FnSig" onchange="_gcv5Update()"><option value="\'Tangerine\',cursive" selected>Tangerine</option><option value="\'Great Vibes\',cursive">Great Vibes</option><option value="\'Pinyon Script\',cursive">Pinyon Script</option><option value="\'Sacramento\',cursive">Sacramento</option><option value="\'Alex Brush\',cursive">Alex Brush</option></select><input type="number" id="gnsiCv5FsSig" value="28" min="14" max="60" oninput="_gcv5Update()"></div></div>'
    +'<div class="gnsi-cv5-fg"><label>Signature Label \u2014 Font</label><div class="gnsi-cv5-font-row"><select id="gnsiCv5FnSiglbl" onchange="_gcv5Update()"><option value="\'Cinzel\',serif" selected>Cinzel</option><option value="\'Cormorant Garamond\',serif">Cormorant Garamond</option><option value="\'Montserrat\',sans-serif">Montserrat</option><option value="\'Raleway\',sans-serif">Raleway</option><option value="\'Lora\',serif">Lora</option></select><input type="number" id="gnsiCv5FsSiglbl" value="8" min="6" max="16" oninput="_gcv5Update()"></div></div>'
    +'</div></div>'
    /* -- COLOURS TAB -- */
    +'<div class="gnsi-cv5-tab-panel" id="gnsi_cv5_tab_colors">'
    +'<div class="gnsi-cv5-grid">'
    +'<div class="gnsi-cv5-fg"><label>Institute Name</label><input type="color" id="gnsiCv5ColInst" value="#0d1b2a"></div>'
    +'<div class="gnsi-cv5-fg"><label>Gold Accent</label><input type="color" id="gnsiCv5CGold" value="#c9a227"></div>'
    +'<div class="gnsi-cv5-fg"><label>Ribbon</label><input type="color" id="gnsiCv5ColRib" value="#6b0f1a"></div>'
    +'<div class="gnsi-cv5-fg"><label>Tagline / Script</label><input type="color" id="gnsiCv5CScript" value="#6b0f1a"></div>'
    +'<div class="gnsi-cv5-fg"><label>Bold Highlight</label><input type="color" id="gnsiCv5CBold" value="#0d1b2a"></div>'
    +'<div class="gnsi-cv5-fg"><label>Side Panels</label><input type="color" id="gnsiCv5CSide" value="#0d1b2a"></div>'
    +'</div></div>'
    /* -- LOGOS TAB -- */
    +'<div class="gnsi-cv5-tab-panel" id="gnsi_cv5_tab_logos">'
    +'<div class="gnsi-cv5-grid">'
    +'<div class="gnsi-cv5-fg"><label>Left Logo</label><input type="file" accept="image/*" onchange="_gcv5LoadLogo(\'L\',this)"><img id="gnsiCv5PrevLogoL" class="gnsi-cv5-logo-prev"></div>'
    +'<div class="gnsi-cv5-fg"><label>Center Logo</label><input type="file" accept="image/*" onchange="_gcv5LoadLogo(\'C\',this)"><img id="gnsiCv5PrevLogoC" class="gnsi-cv5-logo-prev"></div>'
    +'<div class="gnsi-cv5-fg"><label>Right Logo</label><input type="file" accept="image/*" onchange="_gcv5LoadLogo(\'R\',this)"><img id="gnsiCv5PrevLogoR" class="gnsi-cv5-logo-prev"></div>'
    +'</div></div>'
    /* -- BULK TAB -- */
    +'<div class="gnsi-cv5-tab-panel" id="gnsi_cv5_tab_bulk">'
    +'<div class="gnsi-cv5-grid">'
    +'<div class="gnsi-cv5-fg" style="grid-column:1/-1"><label>One student per line: Name, Batch, Group, Marks, Rank</label>'
    +'<textarea id="gnsiCv5FBulk" rows="5" placeholder="Tomba Singh, 9th Batch, Navodaya Group, 95, 1st&#10;Priya Devi, 9th Batch, Sainik Group, 88, 3rd&#10;Rajan Meitei, 8th Batch, Foundation Group, 92, 2nd"></textarea></div>'
    +'</div>'
    +'<div id="gnsiCv5BulkStatus" style="display:none;margin-top:10px">'
    +'<table class="gnsi-cv5-bulk-tbl"><thead><tr><th>#</th><th>Name</th><th>Batch</th><th>Group</th><th>Score</th><th>Rank</th><th>Status</th></tr></thead>'
    +'<tbody id="gnsiCv5BulkTbody"></tbody></table></div>'
    +'</div>'
    /* action buttons */
    +'<div class="gnsi-cv5-btnrow">'
    +'<button class="gnsi-cv5-btn gnsi-cv5-btn-dark" onclick="_gcv5Update()">&#128260; Update Preview</button>'
    +'<select id="gnsiCv5Orient" style="padding:8px 12px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;font-family:\'DM Sans\',sans-serif;background:var(--surface);color:var(--text);font-weight:600">'
    +'<option value="landscape">&#127774; A4 Landscape</option>'
    +'<option value="portrait">&#128203; A4 Portrait</option>'
    +'</select>'
    +'<button class="gnsi-cv5-btn gnsi-cv5-btn-gold" onclick="_gcv5PrintOne()">&#128424; Print / Save PDF</button>'
    +'<button class="gnsi-cv5-btn gnsi-cv5-btn-red" onclick="_gcv5DoBulk()">&#128196; Bulk Export All</button>'
    +'</div>'
    +'</div>'; /* end editor panel */
  /* -- Certificate Preview -- */
  html += '<div style="overflow-x:auto;margin-bottom:20px">'
    +'<div class="gnsi-cv5-cert-wrap">'
    +'<div class="gnsi-cv5-cert" id="gnsiCv5Cert">'
    +'<div class="gnsi-cv5-cert-side-l" id="gnsiCv5CsL"></div>'
    +'<div class="gnsi-cv5-cert-side-r" id="gnsiCv5CsR"></div>'
    +'<div class="gnsi-cv5-cert-ob" id="gnsiCv5COB"></div>'
    +'<div class="gnsi-cv5-cert-ib" id="gnsiCv5CIB"></div>'
    +'<div class="gnsi-cv5-cert-ib2"></div>'
    +'<div class="gnsi-cv5-cert-corn tl"><svg viewBox="0 0 50 50" fill="none"><path d="M4 4L20 4L20 7L7 7L7 20L4 20Z" fill="#c9a227"/><circle cx="4" cy="4" r="3" fill="#c9a227"/><path d="M12 12L22 12L22 14L14 14L14 22L12 22Z" fill="#c9a227" opacity=".5"/></svg></div>'
    +'<div class="gnsi-cv5-cert-corn tr"><svg viewBox="0 0 50 50" fill="none"><path d="M4 4L20 4L20 7L7 7L7 20L4 20Z" fill="#c9a227"/><circle cx="4" cy="4" r="3" fill="#c9a227"/><path d="M12 12L22 12L22 14L14 14L14 22L12 22Z" fill="#c9a227" opacity=".5"/></svg></div>'
    +'<div class="gnsi-cv5-cert-corn bl"><svg viewBox="0 0 50 50" fill="none"><path d="M4 4L20 4L20 7L7 7L7 20L4 20Z" fill="#c9a227"/><circle cx="4" cy="4" r="3" fill="#c9a227"/><path d="M12 12L22 12L22 14L14 14L14 22L12 22Z" fill="#c9a227" opacity=".5"/></svg></div>'
    +'<div class="gnsi-cv5-cert-corn br"><svg viewBox="0 0 50 50" fill="none"><path d="M4 4L20 4L20 7L7 7L7 20L4 20Z" fill="#c9a227"/><circle cx="4" cy="4" r="3" fill="#c9a227"/><path d="M12 12L22 12L22 14L14 14L14 22L12 22Z" fill="#c9a227" opacity=".5"/></svg></div>'
    +'<div class="gnsi-cv5-cert-wm">GNSI</div>'
    +'<div class="gnsi-cv5-cert-body-wrap">'
    +'<div class="gnsi-cv5-deco-line"><div class="gnsi-cv5-deco-line-bar"></div><div class="gnsi-cv5-deco-diamond"></div><div class="gnsi-cv5-deco-line-bar"></div><div class="gnsi-cv5-deco-diamond"></div><div class="gnsi-cv5-deco-line-bar"></div></div>'
    +'<div class="gnsi-cv5-cert-logos-row">'
    +'<div class="gnsi-cv5-cert-logo-slot" id="gnsiCv5LogoSlotL"><svg width="62" height="62" viewBox="0 0 100 100"><circle cx="50" cy="50" r="47" fill="#fff8e1" stroke="#c9a227" stroke-width="1.5"/><text x="50" y="22" text-anchor="middle" font-size="8" fill="#0d1b2a" font-weight="700" font-family="Cinzel,serif">KNOWLEDGE</text><text x="50" y="56" text-anchor="middle" font-size="26" font-family="serif">&#127795;</text><text x="50" y="70" text-anchor="middle" font-size="10" fill="#8b0000" font-weight="700" font-family="Cinzel,serif">GNSI</text><text x="50" y="80" text-anchor="middle" font-size="7.5" fill="#555" font-family="serif">Est. 2016</text></svg></div>'
    +'<div style="text-align:center"><div class="gnsi-cv5-cert-logo-slot" id="gnsiCv5LogoSlotC" style="margin:0 auto"><svg width="58" height="62" viewBox="0 0 100 105"><rect width="100" height="105" rx="6" fill="#0d1b2a"/><rect x="2" y="2" width="96" height="101" rx="5" fill="none" stroke="#c9a227" stroke-width="1"/><text x="50" y="22" text-anchor="middle" font-size="8.5" fill="#c9a227" font-weight="700" font-family="Cinzel,serif">GUIDANCE</text><text x="50" y="55" text-anchor="middle" font-size="22" font-family="serif">&#9875;</text><text x="50" y="72" text-anchor="middle" font-size="6.5" fill="#d4af37" font-family="Cinzel,serif">NAVODAYA &amp; SAINIK</text><text x="50" y="85" text-anchor="middle" font-size="6" fill="#a08030" font-family="Cinzel,serif">INSTITUTE</text></svg></div></div>'
    +'<div class="gnsi-cv5-cert-logo-slot" id="gnsiCv5LogoSlotR"><svg width="62" height="62" viewBox="0 0 100 100"><circle cx="50" cy="50" r="47" fill="#fff8e1" stroke="#c9a227" stroke-width="1.5"/><text x="50" y="30" text-anchor="middle" font-size="30" font-weight="900" fill="#8b0000" font-family="Cinzel,serif">9</text><text x="50" y="46" text-anchor="middle" font-size="8" fill="#0d1b2a" font-weight="700" font-family="Cinzel,serif">YEARS OF</text><text x="50" y="58" text-anchor="middle" font-size="8" fill="#0d1b2a" font-family="Cinzel,serif">SERVICE</text><rect x="16" y="64" width="68" height="15" rx="2" fill="#8b0000"/><text x="50" y="74" text-anchor="middle" font-size="7.5" fill="#fff8e7" font-family="Cinzel,serif">EXCELLENCE</text></svg></div>'
    +'</div>'
    +'<div class="gnsi-cv5-cert-tagline" id="gnsiCv5CTag">Awarded for Outstanding Performance in the Navodaya Pre-Mock Test 2025</div>'
    +'<div class="gnsi-cv5-cert-instname" id="gnsiCv5CInst">GUIDANCE NAVODAYA &amp; SAINIK INSTITUTE</div>'
    +'<div class="gnsi-cv5-cert-address" id="gnsiCv5CAddr">Khangabok Sorok Wangma, near Community Hall, Thoubal, Manipur-795138</div>'
    +'<div class="gnsi-cv5-cert-rib-section"><div class="gnsi-cv5-cert-rib-line"></div><div class="gnsi-cv5-cert-ribbon-badge" id="gnsiCv5CRib">CERTIFICATE</div><div class="gnsi-cv5-cert-rib-line rev"></div></div>'
    +'<div class="gnsi-cv5-cert-apprec" id="gnsiCv5CApprec">OF APPRECIATION</div>'
    +'<div class="gnsi-cv5-cert-presented" id="gnsiCv5CPres">This Certificate is proudly presented to</div>'
    +'<div class="gnsi-cv5-cert-divider"><div class="gnsi-cv5-cert-divider-bar"></div><div class="gnsi-cv5-cert-divider-dia"></div><div class="gnsi-cv5-cert-divider-bar"></div><div class="gnsi-cv5-cert-divider-dia"></div><div class="gnsi-cv5-cert-divider-bar"></div></div>'
    +'<p class="gnsi-cv5-cert-para" id="gnsiCv5CB1"></p>'
    +'<p class="gnsi-cv5-cert-center-para" id="gnsiCv5CHL"></p>'
    +'<p class="gnsi-cv5-cert-motto-para" id="gnsiCv5CRec"></p>'
    +'<div class="gnsi-cv5-cert-bot-deco"><div class="gnsi-cv5-cert-bot-bar"></div><div class="gnsi-cv5-cert-bot-star">&#10022; &nbsp; &#10022; &nbsp; &#10022;</div><div class="gnsi-cv5-cert-bot-bar"></div></div>'
    +'<div class="gnsi-cv5-cert-sigs-row">'
    +'<div class="gnsi-cv5-cert-sig"><div class="gnsi-cv5-cert-sig-script" id="gnsiCv5CS1T">Jarwelle</div><div class="gnsi-cv5-cert-sig-rule"></div><div class="gnsi-cv5-cert-sig-lbl" id="gnsiCv5CS1L">Signature of Administrator</div></div>'
    +'<div class="gnsi-cv5-cert-sig"><div class="gnsi-cv5-cert-sig-script" id="gnsiCv5CS2T">Khummualo</div><div class="gnsi-cv5-cert-sig-rule"></div><div class="gnsi-cv5-cert-sig-lbl" id="gnsiCv5CS2L">Signature of Head of the Institution</div></div>'
    +'</div>'
    +'</div>' /* end body-wrap */
    +'</div></div></div>'; /* end cert / cert-wrap / overflow */
  setTimeout(function(){
    /* wire live-update to all inputs */
    ['gnsiCv5FTag','gnsiCv5FInst','gnsiCv5FAddr','gnsiCv5FName','gnsiCv5FBatch','gnsiCv5FGrp',
     'gnsiCv5FExam','gnsiCv5FMonth','gnsiCv5FMarks','gnsiCv5FOutof','gnsiCv5FRank',
     'gnsiCv5FExamfull','gnsiCv5FMotto','gnsiCv5FS1t','gnsiCv5FS1l','gnsiCv5FS2t','gnsiCv5FS2l',
     'gnsiCv5ColInst','gnsiCv5CGold','gnsiCv5ColRib','gnsiCv5CScript','gnsiCv5CBold','gnsiCv5CSide'
    ].forEach(function(id){
      var el=_gcv5g(id); if(el) el.addEventListener('input',function(){_gcv5Update();});
    });
    _gcv5Update();
  }, 50);
  return html;
}
/* ══════════════════════════════════════════════════════════════════
   ALLEN PREMIUM BANNER GENERATOR -- renderTopperBanner()
   Replaces GNSI Topper Banner with Allen-style banner editor
   Static DOM banner · Photo upload · Subject bars · Download PNG
   ══════════════════════════════════════════════════════════════════ */
/* -- Allen Banner State -- */
var _allenSubjects = [
  {name:'Physics',score:'180',total:'180'},
  {name:'Chemistry',score:'180',total:'180'},
  {name:'Biology',score:'360',total:'360'}
];
var _allenPhotoSrc = '';
/* -- Allen Banner CSS injected once -- */
var _allenCSSInjected = false;
function _allenInjectCSS(){
  if(_allenCSSInjected) return;
  _allenCSSInjected = true;
  var style = document.createElement('style');
  style.id = 'allen-banner-style';
  style.textContent = [
    "@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@400;600;700;800&family=Dancing+Script:wght@600;700&display=swap');",
    ".ab-app{display:flex;flex-direction:column;gap:0;font-family:'Barlow',sans-serif;}",
    ".ab-editor{background:var(--color-background-secondary,#f5f5f5);border-bottom:0.5px solid var(--color-border-tertiary,#ddd);padding:12px 14px;}",
    ".ab-editor-tabs{display:flex;gap:3px;margin-bottom:10px;border-bottom:0.5px solid var(--color-border-tertiary,#ddd);padding-bottom:8px;flex-wrap:wrap;}",
    ".ab-tab{font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:4px 10px;cursor:pointer;color:var(--color-text-secondary,#666);border:0.5px solid transparent;border-radius:3px;background:none;}",
    ".ab-tab.active{color:#fff;background:#0033a0;border-color:#0033a0;}",
    ".ab-tab-panel{display:none;}",
    ".ab-tab-panel.active{display:grid;grid-template-columns:1fr 1fr;gap:7px 12px;}",
    ".ab-tab-panel.col1{display:none;}",
    ".ab-tab-panel.col1.active{display:flex;flex-direction:column;gap:7px;}",
    ".ab-field{display:flex;flex-direction:column;gap:2px;}",
    ".ab-field.full{grid-column:1/-1;}",
    ".ab-field label{font-size:9.5px;font-weight:700;color:var(--color-text-secondary,#666);letter-spacing:0.1em;text-transform:uppercase;}",
    ".ab-field input[type=text],.ab-field input[type=number],.ab-field select{font-size:12px;padding:5px 8px;background:var(--color-background-primary,#fff);border:0.5px solid var(--color-border-secondary,#ccc);border-radius:3px;color:var(--color-text-primary,#111);font-family:'Barlow',sans-serif;width:100%;}",
    ".ab-field input[type=color]{width:32px;height:26px;padding:1px;border:0.5px solid var(--color-border-secondary,#ccc);border-radius:3px;cursor:pointer;background:none;}",
    ".ab-color-row{display:flex;align-items:center;gap:6px;}",
    ".ab-color-row input[type=text]{flex:1;}",
    ".ab-subj-header{display:grid;grid-template-columns:1fr 72px 72px 26px;gap:5px;margin-bottom:3px;}",
    ".ab-subj-header span{font-size:9px;font-weight:700;color:var(--color-text-tertiary,#999);letter-spacing:0.1em;text-transform:uppercase;}",
    ".ab-subj-row-edit{display:grid;grid-template-columns:1fr 72px 72px 26px;gap:5px;align-items:center;margin-bottom:4px;}",
    ".ab-del-btn{width:22px;height:22px;border:0.5px solid var(--color-border-secondary,#ccc);border-radius:3px;background:none;color:var(--color-text-secondary,#666);cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;}",
    ".ab-del-btn:hover{background:#fee;color:#c00;}",
    ".ab-add-btn{font-size:10px;font-weight:700;color:#0033a0;background:none;border:0.5px dashed #0033a0;padding:4px 10px;border-radius:3px;cursor:pointer;width:fit-content;}",
    ".ab-upload-area{border:1.5px dashed var(--color-border-secondary,#ccc);border-radius:5px;padding:14px;display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;background:var(--color-background-primary,#fff);}",
    ".ab-upload-area:hover{border-color:#0033a0;}",
    ".ab-upload-icon{width:30px;height:30px;border-radius:50%;background:var(--color-background-tertiary,#eee);display:flex;align-items:center;justify-content:center;}",
    ".ab-upload-text{font-size:11px;color:var(--color-text-secondary,#666);}",
    ".ab-upload-sub{font-size:9px;color:var(--color-text-tertiary,#999);}",
    "#ab-photo-preview{width:60px;height:76px;object-fit:cover;border:1.5px solid var(--color-border-secondary,#ccc);border-radius:2px;display:none;}",
    ".ab-preview-wrap{display:flex;flex-direction:column;align-items:center;padding:18px 12px 14px;gap:10px;background:#f0f2f5;}",
    ".ab-preview-label{font-size:9px;font-weight:700;color:#666;letter-spacing:0.12em;text-transform:uppercase;}",
    ".ab-dl-btn{font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;padding:7px 18px;cursor:pointer;border:none;border-radius:3px;background:#0033a0;color:#fff;}",
    ".ab-dl-btn:hover{background:#002280;}",
    /* banner */
    ".ab-banner{width:560px;height:390px;position:relative;overflow:hidden;font-family:'Barlow Condensed',sans-serif;flex-shrink:0;}",
    ".ab-bg-main{position:absolute;inset:0;}",
    ".ab-top-bar{position:absolute;top:0;left:0;right:0;height:6px;}",
    ".ab-bottom-bar{position:absolute;bottom:0;left:0;right:0;height:6px;}",
    ".ab-left-accent{position:absolute;top:6px;left:0;width:5px;bottom:6px;}",
    ".ab-logo-zone{position:absolute;top:14px;right:14px;display:flex;flex-direction:column;align-items:flex-end;gap:0;}",
    ".ab-logo-text{font-size:26px;font-weight:900;letter-spacing:0.06em;line-height:1;}",
    ".ab-logo-sub{font-size:7.5px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;opacity:0.7;}",
    ".ab-logo-rule{height:2px;margin-top:3px;width:100%;}",
    ".ab-cert-badge{display:flex;align-items:center;gap:4px;margin-top:4px;}",
    ".ab-cert-text{font-size:6.5px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;opacity:0.55;font-family:'Barlow',sans-serif;}",
    ".ab-meet{position:absolute;top:18px;left:16px;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;opacity:0.7;font-family:'Barlow',sans-serif;}",
    ".ab-name{position:absolute;top:32px;left:14px;font-size:42px;font-weight:900;line-height:1;letter-spacing:0.02em;text-transform:uppercase;}",
    ".ab-topper-label{position:absolute;top:118px;left:14px;font-size:13px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;opacity:0.8;}",
    ".ab-exam-pill{position:absolute;top:136px;left:14px;padding:4px 12px;font-size:10px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;}",
    ".ab-score-zone{position:absolute;top:168px;left:14px;display:flex;flex-direction:column;gap:2px;}",
    ".ab-score-label{font-size:8px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;opacity:0.6;font-family:'Barlow',sans-serif;}",
    ".ab-score-num{font-size:52px;font-weight:900;line-height:1;letter-spacing:-1px;}",
    ".ab-score-slash{font-size:24px;font-weight:700;opacity:0.5;vertical-align:super;}",
    ".ab-rank-pills-zone{position:absolute;top:244px;left:14px;display:flex;flex-direction:column;gap:5px;}",
    ".ab-rpill{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;font-size:9px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;font-family:'Barlow',sans-serif;}",
    ".ab-rpill-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0;}",
    ".ab-course-tag{position:absolute;bottom:44px;left:14px;padding:6px 16px;font-size:10px;font-weight:900;letter-spacing:0.14em;text-transform:uppercase;transform:skewX(-8deg);}",
    ".ab-course-inner{transform:skewX(8deg);display:block;}",
    ".ab-congrats{position:absolute;bottom:14px;left:16px;font-family:'Dancing Script',cursive;font-size:17px;font-weight:700;}",
    ".ab-rank-zone{position:absolute;top:10px;right:14px;margin-top:72px;display:flex;flex-direction:column;align-items:center;gap:0;}",
    ".ab-rank-tag{font-size:10px;font-weight:900;letter-spacing:0.4em;text-transform:uppercase;padding:3px 10px;font-family:'Barlow',sans-serif;}",
    ".ab-rank-big{font-size:110px;font-weight:900;line-height:0.85;letter-spacing:-4px;text-align:center;}",
    ".ab-rank-sub{font-size:7px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;opacity:0.55;text-align:center;font-family:'Barlow',sans-serif;margin-top:4px;}",
    ".ab-photo-zone{position:absolute;bottom:0;right:130px;width:104px;display:flex;flex-direction:column;align-items:center;}",
    ".ab-photo-frame{width:94px;height:120px;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;overflow:hidden;border-width:2px;border-style:solid;}",
    ".ab-photo-inner-border{position:absolute;inset:4px;border-width:1px;border-style:solid;opacity:0.4;pointer-events:none;z-index:3;}",
    ".ab-photo-lbl{font-size:7px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;padding:3px 0;opacity:0.5;font-family:'Barlow',sans-serif;}",
    ".ab-ph-head{width:30px;height:30px;border-radius:50%;opacity:0.3;}",
    ".ab-ph-body{width:54px;height:24px;border-radius:24px 24px 0 0;opacity:0.25;margin-top:5px;}",
    ".ab-subj-zone{position:absolute;right:14px;bottom:44px;display:flex;flex-direction:column;gap:4px;align-items:flex-end;width:110px;}",
    ".ab-subj-row{display:flex;align-items:center;gap:5px;width:100%;}",
    ".ab-subj-name{font-size:8px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;flex:1;opacity:0.65;font-family:'Barlow',sans-serif;}",
    ".ab-subj-bar-wrap{position:relative;flex:1;height:2px;}",
    ".ab-subj-bar-bg{height:2px;position:absolute;left:0;top:0;width:100%;}",
    ".ab-subj-bar-fill{height:2px;position:absolute;left:0;top:0;}",
    ".ab-subj-score{font-size:9px;font-weight:900;min-width:42px;text-align:right;font-family:'Barlow',sans-serif;}",
    ".ab-watermark{position:absolute;font-size:180px;font-weight:900;opacity:0.04;right:-20px;bottom:-30px;line-height:1;letter-spacing:-8px;user-select:none;pointer-events:none;}",
    ".ab-stripe-pattern{position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;}"
  ].join('\n');
  document.head.appendChild(style);
}
/* -- Render Allen Banner -- */
function _allenRender(){
  var g=function(id){return document.getElementById(id);};
  var v=function(id){return g(id)?g(id).value:'';};
  var bg=v('ab-bgColor'), ac=v('ab-acColor'), tx=v('ab-txColor'),
      dk=v('ab-dkColor'), lg=v('ab-lgColor'), diag=v('ab-diagColor');
  function rgba(h,a){
    var r=parseInt(h.slice(1,3),16),gr=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);
    return 'rgba('+r+','+gr+','+b+','+a+')';
  }
  var bel=g('ab-bg'); if(bel) bel.style.background='linear-gradient(135deg,'+dk+' 0%,'+bg+' 40%,'+bg+' 100%)';
  var tb=g('ab-topbar'); if(tb){ tb.style.background='linear-gradient(90deg,'+ac+','+lg+','+ac+')'; }
  var bb=g('ab-botbar'); if(bb){ bb.style.background='linear-gradient(90deg,'+ac+','+lg+','+ac+')'; }
  var la=g('ab-laccent'); if(la) la.style.background=ac;
  var wm=g('ab-wm'); if(wm){ wm.style.color=tx; wm.textContent=v('ab-rankNum'); }
  // diagonal stripes SVG
  var sv=g('ab-stripes');
  if(sv) sv.innerHTML='<defs><clipPath id="abcp"><rect width="560" height="390"/></clipPath></defs>'
    +'<g clip-path="url(#abcp)" opacity="0.06">'
    +'<line x1="320" y1="-20" x2="600" y2="450" stroke="'+tx+'" stroke-width="60"/>'
    +'<line x1="370" y1="-20" x2="650" y2="450" stroke="'+tx+'" stroke-width="20"/>'
    +'</g>'
    +'<polygon points="340,0 560,0 560,390 420,390" fill="'+diag+'" opacity="0.55"/>'
    +'<polygon points="360,0 380,0 560,320 560,290" fill="'+ac+'" opacity="0.18"/>'
    +'<line x1="338" y1="0" x2="418" y2="390" stroke="'+ac+'" stroke-width="2.5" opacity="0.7"/>';
  var logo=g('ab-logo'); if(logo){ logo.style.color=lg; logo.textContent=v('ab-instName'); }
  var logoSub=g('ab-logoSub'); if(logoSub){ logoSub.style.color=tx; logoSub.textContent=v('ab-instTag'); }
  var logoRule=g('ab-logoRule'); if(logoRule) logoRule.style.background='linear-gradient(90deg,'+ac+',transparent)';
  var cert=g('ab-cert'); if(cert){ cert.style.color=tx; cert.textContent=v('ab-certBy'); }
  var meet=g('ab-meet'); if(meet){ meet.style.color=ac; meet.textContent=v('ab-meetTag'); }
  var name=g('ab-name'); if(name){ name.style.color=tx; name.textContent=v('ab-studentName'); }
  var tl=g('ab-topperLabel'); if(tl){ tl.style.color=rgba(tx,0.75); tl.textContent=v('ab-studentTitle'); }
  var ep=g('ab-examPill'); if(ep){ ep.style.background=ac; ep.style.color=bg; ep.textContent=v('ab-examLabel'); }
  var sn=g('ab-scoreNum'); if(sn){ sn.style.color=ac; sn.textContent=v('ab-scoreObtained'); }
  var sd=g('ab-scoreDenom'); if(sd){ sd.style.color=tx; sd.textContent=' /'+v('ab-scoreTotal'); }
  var p1=g('ab-pill1'); if(p1){ p1.style.background=rgba(tx,0.12); p1.style.border='1px solid '+rgba(ac,0.6); }
  var p1d=g('ab-p1dot'); if(p1d) p1d.style.background=ac;
  var p1t=g('ab-p1text'); if(p1t){ p1t.style.color=tx; p1t.textContent=v('ab-rankLabel')+' '+v('ab-rankNum'); }
  var p2=g('ab-pill2'); if(p2){ p2.style.background=rgba(tx,0.07); p2.style.border='1px solid '+rgba(tx,0.2); }
  var p2d=g('ab-p2dot'); if(p2d) p2d.style.background=rgba(tx,0.4);
  var p2t=g('ab-p2text'); if(p2t){ p2t.style.color=rgba(tx,0.75); p2t.textContent=v('ab-counselInfo'); }
  var ct=g('ab-course'); if(ct){ ct.style.background=ac; ct.style.color=dk; }
  var ci=g('ab-courseInner'); if(ci) ci.textContent=v('ab-courseBadge');
  var cg=g('ab-congrats'); if(cg){ cg.style.color=rgba(tx,0.5); cg.textContent='\u2014 '+v('ab-congratsText'); }
  var rt=g('ab-rankTag'); if(rt){ rt.style.color=ac; rt.style.borderBottom='2px solid '+ac; rt.textContent=v('ab-rankLabel'); }
  var rb=g('ab-rankBig'); if(rb){ rb.style.color=tx; rb.textContent=v('ab-rankNum'); }
  var rs=g('ab-rankSub'); if(rs){ rs.style.color=tx; rs.textContent=v('ab-rankSub'); }
  var pf=g('ab-photoFrame'); if(pf){ pf.style.borderColor=ac; pf.style.background=rgba(dk,0.8); }
  var pb=g('ab-photoBorder'); if(pb) pb.style.borderColor=ac;
  var phh=g('ab-phHead'); if(phh){ phh.style.background=rgba(ac,0.3); phh.style.border='1px solid '+rgba(ac,0.5); }
  var phb=g('ab-phBody'); if(phb){ phb.style.background=rgba(ac,0.2); phb.style.border='1px solid '+rgba(ac,0.35); }
  var photo=g('ab-photo'); var phPh=g('ab-phPlaceholder');
  if(_allenPhotoSrc){
    if(photo){ photo.src=_allenPhotoSrc; photo.style.display='block'; }
    if(phPh) phPh.style.display='none';
  } else {
    if(photo) photo.style.display='none';
    if(phPh) phPh.style.display='flex';
  }
  var pl=g('ab-photoLbl'); if(pl){ pl.style.color=rgba(tx,0.45); pl.textContent=v('ab-photoLabel'); }
  // subjects
  var wrap=g('ab-subjects');
  if(wrap){
    wrap.innerHTML='';
    _allenSubjects.forEach(function(s){
      var row=document.createElement('div'); row.className='ab-subj-row';
      var pct=Math.min(100,Math.round(((+s.score)/(+s.total||1))*100));
      row.innerHTML='<span class="ab-subj-name" style="color:'+rgba(tx,0.6)+'">'+s.name+'</span>'
        +'<div class="ab-subj-bar-wrap">'
          +'<div class="ab-subj-bar-bg" style="background:'+tx+';opacity:0.2"></div>'
          +'<div class="ab-subj-bar-fill" style="width:'+pct+'%;background:'+ac+'"></div>'
        +'</div>'
        +'<span class="ab-subj-score" style="color:'+ac+'">'+s.score+'/'+s.total+'</span>';
      wrap.appendChild(row);
    });
  }
  // sync hex inputs
  ['bg','ac','tx','dk','lg','diag'].forEach(function(k){
    var hexEl=g('ab-'+k+'Hex'); if(hexEl) hexEl.value=v('ab-'+k+'Color');
  });
}
/* -- Render subject editor rows -- */
function _allenRenderSubjEditor(){
  var wrap=document.getElementById('ab-subj-rows'); if(!wrap) return;
  wrap.innerHTML='';
  _allenSubjects.forEach(function(s,i){
    var row=document.createElement('div'); row.className='ab-subj-row-edit';
    row.innerHTML='<input type="text" value="'+s.name+'" oninput="_allenSubjects['+i+'].name=this.value;_allenRender()">'
      +'<input type="number" value="'+s.score+'" oninput="_allenSubjects['+i+'].score=this.value;_allenRender()">'
      +'<input type="number" value="'+s.total+'" oninput="_allenSubjects['+i+'].total=this.value;_allenRender()">'
      +'<button class="ab-del-btn" onclick="_allenSubjects.splice('+i+',1);_allenRenderSubjEditor();_allenRender()">\u00d7</button>';
    wrap.appendChild(row);
  });
}
function _allenAddSubject(){ _allenSubjects.push({name:'Subject',score:'100',total:'100'}); _allenRenderSubjEditor(); _allenRender(); }
/* -- Handle photo upload -- */
function _allenHandlePhoto(e){
  var file=e.target.files[0]; if(!file) return;
  var reader=new FileReader();
  reader.onload=function(ev){ _allenPhotoSrc=ev.target.result; var pp=document.getElementById('ab-photo-preview'); if(pp){ pp.src=_allenPhotoSrc; pp.style.display='block'; } _allenRender(); };
  reader.readAsDataURL(file);
}
/* -- Sync color hex input -- */
function _allenSyncColor(key){
  var hex=document.getElementById('ab-'+key+'Hex'); if(!hex) return;
  if(/^#[0-9a-fA-F]{6}$/.test(hex.value)){ var cp=document.getElementById('ab-'+key+'Color'); if(cp) cp.value=hex.value; _allenRender(); }
}
/* -- Switch tab -- */
function _allenSwitchTab(id){
  var keys=['institute','student','scores','subjects','photo','theme'];
  document.querySelectorAll('.ab-tab').forEach(function(t,i){ t.classList.toggle('active', keys[i]===id); });
  document.querySelectorAll('.ab-tab-panel').forEach(function(p){ p.classList.remove('active'); });
  var panel=document.getElementById('ab-tab-'+id); if(panel) panel.classList.add('active');
}
/* -- Download banner as PNG -- */
function _allenDownload(){
  var banner=document.getElementById('ab-banner');
  if(!banner){ alert('Banner not found.'); return; }
  if(typeof html2canvas === 'undefined'){
    var s=document.createElement('script');
    s.src='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    s.crossOrigin='anonymous';
    s.onload=function(){ _allenDownloadNow(banner); };
    document.head.appendChild(s);
  } else {
    _allenDownloadNow(banner);
  }
}
function _allenDownloadNow(banner){
  html2canvas(banner,{scale:3,useCORS:true,backgroundColor:null,logging:false}).then(function(canvas){
    var a=document.createElement('a'); a.download='allen-topper-banner.png'; a.href=canvas.toDataURL('image/png'); a.click();
  });
}
/* ══════════════════════════════════════════════════════════════════
   renderTopperBanner -- main page render (called by portal router)
   ══════════════════════════════════════════════════════════════════ */
function renderTopperBanner(){
  navigate('dashboard');
  return '';
}
/* ══════════════════════════════════════════════════════════════
   █  DISCIPLINE REGISTER
   ══════════════════════════════════════════════════════════════ */
var _discTab='log', _discEdit=null, _discSearch='';
function _discLoad(){return gnsiLoad('gnsi_discipline')||[];}
function _discSave(d){gnsiSave('gnsi_discipline',d);}
