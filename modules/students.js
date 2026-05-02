/* GNSI PORTAL — modules/students.js
   Pages: students, classes, sessions, scholarship
   DEPENDS ON: core/utils.js, core/state.js */

function renderClasses(){
  var classes=loadClasses();
  var classNames=getClassNames();
  // Stats
  var totalStudents=students.length;
  var activeClasses=classes.filter(function(c){return c.active}).length;
  var totalStrength=classes.filter(function(c){return c.active}).reduce(function(a,c){return a+(parseInt(c.strength)||0)},0);
  // Add form
  var formHTML='';
  if(classAddForm){
    formHTML='<div class="form-panel"><div class="form-title" style="color:var(--accent)">&#127979; Add New Class / Batch</div>'
      +'<div class="form-grid g3">'
        +'<div class="form-group"><label>Batch Name *</label><input id="nc-name" placeholder="e.g. Achiever, Leader, Lakshya..." value="'+esc(newClassData.name||'')+'"/></div>'
        +'<div class="form-group"><label>Course</label><select id="nc-course"><option value="">-- Select Course --</option><option'+(newClassData.course==="Combined"?' selected':'')+'>Combined</option><option'+(newClassData.course==="Sainik"?' selected':'')+'>Sainik</option><option'+(newClassData.course==="Navodaya"?' selected':'')+'>Navodaya</option><option'+(newClassData.course==="Foundation"?' selected':'')+'>Foundation</option></select></div>'
        +'<div class="form-group"><label>Short Code</label><input id="nc-code" placeholder="e.g. ACH, LDR..." value="'+esc(newClassData.code||'')+'"/></div>'
        +'<div class="form-group"><label>Section</label><input id="nc-sec" placeholder="e.g. A, B, Morning..." value="'+esc(newClassData.section||'A')+'"/></div>'
        +'<div class="form-group"><label>Strength (Seats)</label><input id="nc-str" type="number" min="1" placeholder="30" value="'+esc(newClassData.strength||30)+'"/></div>'
        +'<div class="form-group"><label>Status</label><select id="nc-active"><option value="true">Active</option><option value="false">Inactive</option></select></div>'
        +'<div class="form-group"><label>Class Teacher (Optional)</label><input id="nc-teacher" list="nc-teacher-list" placeholder="Assign teacher..."/>'
          +'<datalist id="nc-teacher-list">'+staff.filter(function(s){return s.dept==='Teaching'}).map(function(s){return'<option>'+s.name+'</option>'}).join('')+'</datalist>'
        +'</div>'
      +'</div>'
      +'<div class="form-actions"><button class="btn btn-primary" onclick="addClass()">&#43; Add Class</button><button class="btn btn-outline" onclick="classAddForm=false;render()">Cancel</button></div>'
    +'</div>';
  }
  // Class cards — grouped by course
  var COURSE_ORDER=['Combined','Sainik','Navodaya','Foundation',''];
  var courseGroups={};
  classes.forEach(function(c){
    var crs=c.course||'';
    if(!courseGroups[crs]) courseGroups[crs]=[];
    courseGroups[crs].push(c);
  });
  var COURSE_META={
    'Combined':  {color:'#8b5cf6',icon:'🔗',label:'Combined Course'},
    'Sainik':    {color:'#1a6b55',icon:'⚔️',label:'Sainik Course'},
    'Navodaya':  {color:'#3b78c9',icon:'🏛️',label:'Navodaya Course'},
    'Foundation':{color:'#d4a853',icon:'🌱',label:'Foundation Course'},
    '':          {color:'#6b7280',icon:'📚',label:'Other / Uncategorised'}
  };
  var classCards=COURSE_ORDER.filter(function(crs){return courseGroups[crs]&&courseGroups[crs].length;}).map(function(crs){
    var meta=COURSE_META[crs]||COURSE_META[''];
    var groupHeader='<div style="margin:18px 0 10px;display:flex;align-items:center;gap:10px">'      +'<span style="font-size:18px">'+meta.icon+'</span>'      +'<span style="font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;font-family:\'JetBrains Mono\',monospace;color:'+meta.color+'">'+meta.label+'</span>'      +'<div style="flex:1;height:1px;background:'+meta.color+'33;margin-left:6px"></div>'      +'<span style="font-size:11px;color:var(--muted);font-family:\'JetBrains Mono\',monospace">'+courseGroups[crs].length+' batch'+(courseGroups[crs].length!==1?'es':'')+'</span>'    +'</div>';
    var cards=courseGroups[crs].map(function(c){
    var enrolled=students.filter(function(s){return s.cls===c.name}).length;
    var pct=c.strength?Math.min(100,Math.round(enrolled/c.strength*100)):0;
    var fillColor=pct>85?'#dc2626':pct>60?'#e09500':'#1435a0';
    var isEditing=classEditId===c.id;
    if(isEditing){
      return '<div class="card" style="border-left:4px solid var(--accent);margin-bottom:14px">'
        +'<div style="padding:18px 22px">'
          +'<div style="font-family:\'Cormorant Garamond\',serif;font-size:16px;font-weight:700;color:var(--accent);margin-bottom:14px">Editing: '+esc(c.name)+'</div>'
          +'<div class="form-grid g3" style="margin-bottom:14px">'
            +'<div class="form-group"><label>Batch Name *</label><input id="ec-name-'+c.id+'" value="'+esc(c.name)+'"/></div>'
            +'<div class="form-group"><label>Course</label><select id="ec-course-'+c.id+'"><option value="">-- None --</option><option'+(c.course==="Combined"?' selected':'')+'>Combined</option><option'+(c.course==="Sainik"?' selected':'')+'>Sainik</option><option'+(c.course==="Navodaya"?' selected':'')+'>Navodaya</option><option'+(c.course==="Foundation"?' selected':'')+'>Foundation</option></select></div>'
            +'<div class="form-group"><label>Short Code</label><input id="ec-code-'+c.id+'" value="'+esc(c.code||'')+'"/></div>'
            +'<div class="form-group"><label>Section</label><input id="ec-sec-'+c.id+'" value="'+esc(c.section||'')+'"/></div>'
            +'<div class="form-group"><label>Strength</label><input id="ec-str-'+c.id+'" type="number" value="'+esc(c.strength||30)+'"/></div>'
            +'<div class="form-group"><label>Class Teacher</label><input id="ec-tea-'+c.id+'" list="ec-tea-list-'+c.id+'" value="'+esc(c.teacher||'')+'"/><datalist id="ec-tea-list-'+c.id+'">'+staff.filter(function(s){return s.dept==='Teaching'}).map(function(s){return'<option>'+s.name+'</option>'}).join('')+'</datalist></div>'
            +'<div class="form-group"><label>Status</label><select id="ec-act-'+c.id+'"><option value="true" '+(c.active?'selected':'')+'>Active</option><option value="false" '+(!c.active?'selected':'')+'>Inactive</option></select></div>'
          +'</div>'
          +'<div style="display:flex;gap:10px">'
            +'<button class="btn btn-primary" onclick="updateClass(\''+c.id+'\')">&#10003; Save</button>'
            +'<button class="btn btn-outline" onclick="classEditId=null;render()">Cancel</button>'
          +'</div>'
        +'</div>'
      +'</div>';
    }
    var _bc=c.color||(c.active?'#1433a8':'#9ca3af');
    var _cl=c.course||'';
    var _cbadge=_cl?'<span style="display:inline-block;padding:2px 9px;border-radius:20px;font-size:10px;font-weight:800;font-family:\'JetBrains Mono\',monospace;letter-spacing:.05em;background:'+_bc+'22;color:'+_bc+';border:1px solid '+_bc+'55;margin-left:8px;vertical-align:middle">'+esc(_cl.toUpperCase())+'</span>':'';
    return '<div class="card" style="border-left:4px solid '+_bc+';margin-bottom:14px;opacity:'+(c.active?1:0.65)+'">' 
      +'<div style="padding:16px 22px">'
        +'<div style="display:flex;align-items:flex-start;gap:16px;flex-wrap:wrap">'
          +'<!-- Left: info -->'
          +'<div style="flex:1;min-width:180px">'
            +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">'
              +'<div style="width:38px;height:38px;border-radius:10px;background:'+_bc+';display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:800;color:#fff;font-family:\'JetBrains Mono\',monospace;flex-shrink:0">'+esc((c.code||c.name).slice(0,3).toUpperCase())+'</div>'
              +'<div>'
                +'<div style="font-size:15px;font-weight:800;color:var(--on-surface)">'+esc(c.name)+_cbadge+'</div>'
                +'<div style="font-size:11px;color:var(--muted);font-family:\'JetBrains Mono\',monospace">'+esc(c.code||'')+(c.section?' &middot; Sec: '+esc(c.section):'')+'</div>'
              +'</div>'
            +'</div>'
            +(c.teacher?'<div style="font-size:12px;color:var(--muted);margin-top:4px">&#128104;&#8205;&#127979; Class Teacher: <b style="color:var(--on-surface)">'+esc(c.teacher)+'</b></div>':'')
          +'</div>'
          +'<!-- Middle: stats -->'
          +'<div style="display:flex;gap:20px;align-items:center;flex-wrap:wrap">'
            +'<div style="text-align:center;min-width:60px;cursor:pointer" onclick="classToggleEnrolled(\''+c.id+'\')" title="Click to view enrolled students">'
              +'<div style="font-family:\'Cormorant Garamond\',serif;font-size:28px;font-weight:700;color:var(--accent);line-height:1;text-decoration:underline;text-underline-offset:2px">'+enrolled+'</div>'
              +'<div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;font-family:\'JetBrains Mono\',monospace;font-weight:700">Enrolled &#128065;</div>'
            +'</div>'
            +'<div style="text-align:center;min-width:60px">'
              +'<div style="font-family:\'Cormorant Garamond\',serif;font-size:28px;font-weight:700;color:var(--muted);line-height:1">'+esc(c.strength||'--')+'</div>'
              +'<div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;font-family:\'JetBrains Mono\',monospace;font-weight:700">Capacity</div>'
            +'</div>'
            +'<!-- Fill bar -->'
            +'<div style="min-width:140px">'
              +'<div style="display:flex;justify-content:space-between;font-size:10.5px;font-weight:700;font-family:\'JetBrains Mono\',monospace;margin-bottom:4px"><span style="color:'+fillColor+'">'+pct+'% filled</span><span style="color:var(--muted)">'+(Math.max(0,(c.strength||0)-enrolled))+' seats left</span></div>'
              +'<div style="height:7px;background:var(--border);border-radius:4px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:'+fillColor+';border-radius:4px;transition:width .5s"></div></div>'
            +'</div>'
            +badge(c.active?'Active':'Inactive',c.active?'#16a34a':'#6474a0')
          +'</div>'
          +'<!-- Right: actions -->'
          +'<div style="display:flex;gap:8px;align-items:center;flex-shrink:0">'
            +'<button onclick="classToggleEnrolled(\''+c.id+'\')" style="background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;padding:6px 14px;cursor:pointer;font-size:12px;font-weight:700;font-family:\'Nunito\',sans-serif;color:#1e40af">&#128065; Students</button>'
            +(_isAdminOrArunkumar()?'<button onclick="classEditId=\''+c.id+'\';render()" style="background:var(--accent-light);border:1px solid var(--border);border-radius:8px;padding:6px 14px;cursor:pointer;font-size:12px;font-weight:700;font-family:\'Nunito\',sans-serif;color:var(--accent)">&#9998; Edit</button>':'')
            +'<button onclick="toggleClassActive(\''+c.id+'\')" style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:6px 14px;cursor:pointer;font-size:12px;font-weight:700;font-family:\'Nunito\',sans-serif;color:var(--muted)">'+(c.active?'&#9940; Deactivate':'&#10004; Activate')+'</button>'
            +(enrolled===0&&_isAdminOrArunkumar()?'<button onclick="deleteClass(\''+c.id+'\')" class="btn-danger-sm">&#128465; Delete</button>':enrolled===0?'':'<span style="font-size:11px;color:var(--muted);font-style:italic">Remove students first to delete</span>')
          +'</div>'
        +'</div>'
        // -- Enrolled Students Expandable Table --
        +(classEnrolledOpen[c.id] && enrolled>0 ? (function(){
          var stuList = students.filter(function(s){return s.cls===c.name;});
          var classNames2 = getClassNames();
          var rows = stuList.map(function(s){
            var ex = stuLoadExtra(s.id);
            var hue = s.name.split('').reduce(function(a,x){return a+x.charCodeAt(0);},0)%360;
            return '<tr>'
              +'<td><div style="display:flex;align-items:center;gap:8px">'
              +'<div style="width:26px;height:26px;border-radius:50%;background:hsl('+hue+',45%,42%);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;flex-shrink:0">'+s.name[0]+'</div>'
              +'<div><div style="font-weight:700;cursor:pointer;color:var(--accent)" onclick="stuViewId='+parseInt(s.id,10)+';activePage=\'students\';render()">'+esc(s.name)+'</div>'
              +(ex.father?'<div style="font-size:10.5px;color:var(--muted2)">'+esc(ex.father)+'</div>':'')
              +'</div></div></td>'
              +'<td><input value="'+esc(s.roll||'')+'" onchange="classQuickEditRoll('+parseInt(s.id,10)+',this.value)" style="width:80px;padding:4px 8px;border-radius:6px;border:1.5px solid var(--border);font-size:12px;font-family:\'JetBrains Mono\',monospace;background:var(--surface);color:var(--text)"/></td>'
              +'<td style="font-family:\'JetBrains Mono\',monospace;font-size:11.5px;color:var(--muted)">'+(maskPhone(s.phone)||'--')+'</td>'
              +'<td>'+badge(s.hostel,s.hostel==='Yes'?'#3b78c9':'#7a7468')+'</td>'
              +'<td><span onclick="toggleFees('+parseInt(s.id,10)+')" style="cursor:pointer" title="Click to toggle">'+badge(s.fees,s.fees==='Paid'?'#16a34a':'#dc2626')+'</span></td>'
              +'<td><select onchange="classMoveStudent('+parseInt(s.id,10)+',this.value)" style="font-size:11.5px;padding:4px 8px;border-radius:6px;border:1.5px solid var(--border);background:var(--surface);color:var(--text)">'
              +classNames2.map(function(cn){return'<option'+(s.cls===cn?' selected':'')+'>'+esc(cn)+'</option>';}).join('')
              +'</select></td>'
              +'<td><button onclick="stuEditId='+parseInt(s.id,10)+';showAddStudent=true;activePage=\'students\';render()" style="font-size:11px;padding:3px 8px;border-radius:5px;border:1px solid var(--accent);background:var(--accent-light);cursor:pointer;color:var(--accent);font-weight:700;font-family:\'DM Sans\',sans-serif;margin-right:3px">✏️</button>'
              +(canDo('del','students')?'<button onclick="removeStudent('+parseInt(s.id,10)+')" class="btn-danger-sm">🗑</button>':'')+'</td>'
              +'</tr>';
          }).join('');
          return '<div style="border-top:2px solid var(--accent-light);background:var(--surface2)">'
            +'<div style="padding:10px 18px;display:flex;align-items:center;gap:10px;background:linear-gradient(135deg,var(--accent-light),#eff6ff)">'
            +'<span style="font-size:12px;font-weight:700;color:var(--accent)">👨‍🎓 '+enrolled+' Enrolled Students -- '+esc(c.name)+'</span>'
            +'<span style="font-size:11px;color:var(--muted);margin-left:auto">Roll No is editable inline &nbsp;·&nbsp; Move to class with dropdown</span>'
            +'<button onclick="classEnrolledOpen[\''+c.id+'\']=false;render()" style="font-size:11px;padding:3px 10px;border-radius:6px;border:1px solid var(--border);background:var(--surface);cursor:pointer;color:var(--muted);font-family:\'DM Sans\',sans-serif">✕ Close</button>'
            +'</div>'
            +'<div style="overflow-x:auto"><table style="font-size:12.5px"><thead><tr>'
            +'<th>Student</th><th>GCC No.</th><th>Phone</th><th>House/Hostel</th><th>Fees</th><th>Move to Class</th><th>Actions</th>'
            +'</tr></thead><tbody>'+rows+'</tbody></table></div></div>';
        })() : (classEnrolledOpen[c.id] && enrolled===0 ? '<div style="padding:16px 20px;background:var(--surface2);border-top:1px solid var(--border-soft);text-align:center;color:var(--muted);font-size:13px">No students enrolled in this class.</div>' : ''))
      +'</div>'
    +'</div>';
    }).join('');
    return groupHeader+cards;
  }).join('');
  return '<div style="margin-bottom:20px;display:flex;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;gap:12px">'
    +'<div><div style="font-family:\'JetBrains Mono\',monospace;font-size:11px;color:var(--muted);letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px">GNSI -- CLASS MANAGEMENT</div>'
    +'<div style="font-size:22px;font-family:\'Cormorant Garamond\',serif;font-weight:700;color:var(--on-surface)">Classes &amp; Batches</div>'
    +'<div style="font-size:12px;color:var(--muted);margin-top:3px">Add, edit, activate or remove class batches &mdash; used across students, timetable and attendance</div></div>'
    +(_isAdminOrArunkumar()?(function(){var _ex={};loadClasses().forEach(function(c){_ex[c.name.trim().toLowerCase()]=true;});var _seen={},_mc=0;students.forEach(function(s){var _k=(s.cls||'').trim().toLowerCase();if(!_k||_ex[_k]||_seen[_k])return;_seen[_k]=true;_mc++;});return '<div style="display:flex;gap:10px;align-items:center">'+(_mc>0?'<button class="btn" onclick="autoAddMissingClasses()" style="background:#fef3c7;border:1.5px solid #f59e0b;color:#92400e;font-weight:700;font-size:12px;padding:8px 16px;border-radius:8px;cursor:pointer">⚡ Auto-Add '+_mc+' Missing Class'+(_mc>1?'es':'')+'</button>':'')+'<button class="btn btn-primary" onclick="classAddForm=true;render()">&#43; Add New Class</button></div>';})():'')
    +'</div>'
    +'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:14px;margin-bottom:22px">'
      +'<div class="stat-card" style="--c:#1435a0"><div class="stat-label">Total Classes</div><div class="stat-val">'+classes.length+'</div><div class="stat-sub">'+activeClasses+' active</div></div>'
      +'<div class="stat-card" style="--c:#16a34a"><div class="stat-label">Total Students</div><div class="stat-val">'+totalStudents+'</div><div class="stat-sub">Across all classes</div></div>'
      +'<div class="stat-card" style="--c:#e09500"><div class="stat-label">Total Capacity</div><div class="stat-val">'+totalStrength+'</div><div class="stat-sub">Seats (active classes)</div></div>'
      +'<div class="stat-card" style="--c:#8b5cf6"><div class="stat-label">Vacancy</div><div class="stat-val">'+(totalStrength-totalStudents)+'</div><div class="stat-sub">Open seats</div></div>'
    +'</div>'
    +formHTML
    +(classes.length?classCards:'<div style="text-align:center;padding:60px;color:var(--muted)">No classes found. Add your first class above.</div>');
}
function addClass(){
  if(!_isAdminOrArunkumar()){showToast('🔒 Only Admin can add classes.','#dc2626');return;}
  var name=((document.getElementById('nc-name')||{}).value||'').trim();
  if(!name){showToast('⚠️ Class name is required.','#ea580c');return}
  var list=loadClasses();
  list.push({
    id:'c'+Date.now(),
    name:name,
    code:((document.getElementById('nc-code')||{}).value||'').trim(),
    section:((document.getElementById('nc-sec')||{}).value||'A').trim(),
    strength:parseInt(((document.getElementById('nc-str')||{}).value||'30').trim())||30,
    teacher:((document.getElementById('nc-teacher')||{}).value||'').trim(),
    active:(document.getElementById('nc-active')||{value:'true'}).value!=='false',
    course:((document.getElementById('nc-course')||{}).value||'').trim(),
    color:''
  });
  saveClasses(list);classAddForm=false;render();
}
var classEnrolledOpen = {};
function classToggleEnrolled(id){
  classEnrolledOpen[id] = !classEnrolledOpen[id];
  render();
}
function classMoveStudent(stuId, newCls){
  students = students.map(function(s){ return s.id===stuId ? Object.assign({},s,{cls:newCls}) : s; });
  var _s = students.find(function(s){ return s.id===stuId; });
  if(_s) _gnsiInstantPush('students',{id:_s.id,name:_s.name,roll_no:_s.roll||null,phone:_s.phone||null,is_boarder:_s.hostel==='Yes',status:'Active',class_id:CLASS_ID_MAP[newCls]||null,session:_s.session||null});
  showToast('Student moved to '+newCls,'#1433a8'); render();
}
function classQuickEditRoll(stuId, newRoll){
  students = students.map(function(s){ return s.id===stuId ? Object.assign({},s,{roll:newRoll}) : s; });
  var _s = students.find(function(s){ return s.id===stuId; });
  if(_s) _gnsiInstantPush('students',{id:_s.id,name:_s.name,roll_no:newRoll||null,phone:_s.phone||null,is_boarder:_s.hostel==='Yes',status:'Active',class_id:CLASS_ID_MAP[_s.cls]||null,session:_s.session||null});
}
function updateClass(id){
  var list=loadClasses();
  var oldName='';
  list=list.map(function(c){
    if(c.id!==id)return c;
    oldName=c.name;
    return{
      id:c.id,
      name:((document.getElementById('ec-name-'+id)||{}).value||c.name).trim(),
      code:((document.getElementById('ec-code-'+id)||{}).value||'').trim(),
      section:((document.getElementById('ec-sec-'+id)||{}).value||'').trim(),
      strength:parseInt(((document.getElementById('ec-str-'+id)||{}).value||'30'))||30,
      teacher:((document.getElementById('ec-tea-'+id)||{}).value||'').trim(),
      active:(document.getElementById('ec-act-'+id)||{value:'true'}).value!=='false',
      course:((document.getElementById('ec-course-'+id)||{}).value||c.course||'').trim(),
      color:c.color||''
    };
  });
  var newName=(list.find(function(c){return c.id===id})||{}).name||oldName;
  // Update students who had the old class name — push each changed row instantly
  if(oldName&&oldName!==newName){
    students=students.map(function(s){return s.cls===oldName?Object.assign({},s,{cls:newName}):s;});
    var newClassId = CLASS_ID_MAP[newName]||null;
    students.filter(function(s){return s.cls===newName;}).forEach(function(s){
      _gnsiInstantPush('students',{id:s.id,name:s.name,roll_no:s.roll||null,phone:s.phone||null,
        is_boarder:s.hostel==='Yes',status:'Active',class_id:newClassId,session:s.session||null});
    });
  }
  saveClasses(list);classEditId=null;render();
}
function toggleClassActive(id){
  var list=loadClasses();
  list=list.map(function(c){return c.id===id?Object.assign({},c,{active:!c.active}):c});
  saveClasses(list);render();
}
function deleteClass(id){
  var _gnsiAllowed=['admin','manager'];
  if(!currentUser||_gnsiAllowed.indexOf(currentUser.role)<0){
    if(typeof showToast==='function')showToast('🔒 Access denied: Delete class','#dc2626');
    return;
  }

  var list=loadClasses();
  var c=list.find(function(x){return x.id===id});
  var enrolled=c?students.filter(function(s){return s.cls===c.name}).length:0;
  if(enrolled>0){showToast('⚠️ Cannot delete: '+enrolled+' student(s) still enrolled. Move them first.','#ea580c');return}
  if(!confirm('Delete class "'+(c?c.name:'')+'\"? This cannot be undone.'))return;
  saveClasses(list.filter(function(x){return x.id!==id}));render();
}
// ══════════════════════════════════════════════════════════════
// ADVANCED STUDENT MODULE
// Full profile · Advanced search · Inline edit · Session support
// ══════════════════════════════════════════════════════════════
var stuEditId       = null;   // which student is in edit-modal mode
var stuViewId       = null;   // which student profile is open
var stuFilterCls    = 'All';
var stuFilterHostel = 'All';
var stuFilterFees   = 'All';
var stuPage         = 0;      // PERF: current pagination page
var STU_PAGE_SIZE   = 50;     // PERF: rows per page
var _stuSearchTimer = null;   // PERF: debounce timer for search
/* -- PERF: in-memory cache for stuExtra & house map -- */
var _stuExtraCache = {};      // keyed by student id
var _stuExtraCacheDirty = true;
var _houseMapCache = null;
var _houseMapCacheDirty = true;
function stuExtraCacheInvalidate(){ _stuExtraCache = {}; _stuExtraCacheDirty = true; }
function houseMapCacheInvalidate(){ _houseMapCache = null; _houseMapCacheDirty = true; }
function stuLoadExtra(id){
  var key = String(id);
  if(_stuExtraCache.hasOwnProperty(key)) return _stuExtraCache[key];
  try{ var s=localStorage.getItem('gnsi_stuex_'+id); if(s){ _stuExtraCache[key]=JSON.parse(s); return _stuExtraCache[key]; } }catch(e){}
  _stuExtraCache[key] = {};
  return {};
}
function stuSaveExtra(id, obj){
  _stuExtraCache[String(id)] = obj;   // update cache immediately
  localStorage.setItem('gnsi_stuex_'+id, JSON.stringify(obj));
  if(typeof gnsiKVPush==='function') gnsiKVPush('gnsi_stuex_'+id, obj);
  /* FIX 1 — Student Personal Data Cloud Backup
     Saves all extra fields to gnsi_student_extra Supabase table.
     Run this SQL once in Supabase before this works:
     CREATE TABLE gnsi_student_extra (
       student_id int PRIMARY KEY, adm_no text, dob date, gender text,
       blood text, father text, mother text, guardian text,
       parent_phone text, whatsapp text, address text, state text,
       religion text, category text, house text, intake_class text,
       prev_school text, remarks text, course_id text, subtype text,
       photo_url text, updated_at timestamptz DEFAULT now()
     ); */
  if(window._supa){
    var _stuExRow = {
      student_id:   parseInt(id),
      adm_no:       obj.admNo        || null,
      dob:          obj.dob          || null,
      gender:       obj.gender       || null,
      blood:        obj.blood        || null,
      father:       obj.father       || null,
      mother:       obj.mother       || null,
      guardian:     obj.guardian     || null,
      parent_phone: obj.parentPhone  || null,
      whatsapp:     obj.whatsapp     || null,
      address:      obj.address      || null,
      state:        obj.state        || null,
      religion:     obj.religion     || null,
      category:     obj.category     || null,
      house:        obj.house        || null,
      intake_class: obj.intakeClass  || null,
      prev_school:  obj.prevSchool   || null,
      remarks:      obj.remarks      || null,
      course_id:    obj.courseId     || null,
      subtype:      obj.subtype      || null,
      updated_at:   new Date().toISOString()
    };
    var _stuExSid = (window.TENANT&&window.TENANT.schoolId) ? window.TENANT.schoolId
      : (function(){ try{ var u=JSON.parse(localStorage.getItem('gnsi_jwt_user')||'{}'); return u.schoolId||u.school_id||null; }catch(e){ return null; } })();
    if (_stuExSid) _stuExRow.school_id = _stuExSid;
    window._supa.from('gnsi_student_extra').upsert(_stuExRow, { onConflict: 'student_id' }).then(function(r){
      if(r.error) console.warn('[GNSI] stuSaveExtra cloud failed:', r.error.message);
    });
  }
}
function gnsiGetHouseMap(){
  if(_houseMapCache) return _houseMapCache;
  try{ _houseMapCache=JSON.parse(localStorage.getItem('gnsi_hms_student_house')||'{}'); }catch(e){ _houseMapCache={}; }
  return _houseMapCache;
}
function gnsiSaveHouseMap(map){
  _houseMapCache = map;
  localStorage.setItem('gnsi_hms_student_house', JSON.stringify(map));
  if(typeof gnsiKVPush==='function') gnsiKVPush('gnsi_hms_student_house', map);
}
function renderStudents(){
  var classNames = ['All'].concat(getClassNames());
  var filtered   = getFilteredStudents();
  
  var toolbar = '<div class="toolbar" style="flex-wrap:wrap;gap:8px">'
    +'<div class="search-wrap" style="min-width:220px"><span class="search-icon">🔍</span>'
    +'<input id="stu-search-inp" placeholder="Search by name, roll, phone, parent…" value="'+esc(studentSearch)+'" oninput="studentSearch=this.value;renderStudentTable()"/></div>'
    +'<select class="filter-sel" onchange="stuFilterCls=this.value;stuPage=0;renderStudentTable()">'
    +classNames.map(function(c){return'<option'+(c===stuFilterCls?' selected':'')+'>'+esc(c)+'</option>';}).join('')+'</select>'
    +'<select class="filter-sel" onchange="stuFilterHostel=this.value;stuPage=0;renderStudentTable()">'
    +'<option value="All"'+(stuFilterHostel==='All'?' selected':'')+'>All (Hostel+Day)</option>'
    +'<option value="Yes"'+(stuFilterHostel==='Yes'?' selected':'')+'>Hostel Only</option>'
    +'<option value="No"'+(stuFilterHostel==='No'?' selected':'')+'>Day Scholars</option>'
    +'<option value="KOMBIREI"'+(stuFilterHostel==='KOMBIREI'?' selected':'')+'>🔴 KOMBIREI House</option>'
    +'<option value="LOKTAK"'+(stuFilterHostel==='LOKTAK'?' selected':'')+'>🔵 LOKTAK House</option>'
    +'<option value="SINGAREI"'+(stuFilterHostel==='SINGAREI'?' selected':'')+'>🟡 SINGAREI House</option>'
    +'<option value="KANGLA"'+(stuFilterHostel==='KANGLA'?' selected':'')+'>🟢 KANGLA House</option>'
    +'<option value="KOUBRU"'+(stuFilterHostel==='KOUBRU'?' selected':'')+'>🟣 KOUBRU House</option>'
    +'<option value="SHIROI"'+(stuFilterHostel==='SHIROI'?' selected':'')+'>🩵 SHIROI House</option>'
    +'<option value="SANGAI"'+(stuFilterHostel==='SANGAI'?' selected':'')+'>🩷 SANGAI House</option>'
    +'<option value="SANAREI"'+(stuFilterHostel==='SANAREI'?' selected':'')+'>⚪ SANAREI House</option>'
    +'<option value="NONGIN"'+(stuFilterHostel==='NONGIN'?' selected':'')+'>🔷 NONGIN House</option>'
    +'</select>'
    +'<select class="filter-sel" onchange="stuFilterFees=this.value;stuPage=0;renderStudentTable()">'
    +'<option value="All"'+(stuFilterFees==='All'?' selected':'')+'>All Fees</option>'
    +'<option value="Paid"'+(stuFilterFees==='Paid'?' selected':'')+'>Fees: Paid</option>'
    +'<option value="Pending"'+(stuFilterFees==='Pending'?' selected':'')+'>Fees: Pending</option>'
    +'</select>'
    +'<button class="btn btn-primary" onclick="stuOpenAdd()">+ Enroll Student</button>'
    +'<button class="btn btn-outline" onclick="csvOpenImport()" style="color:var(--accent);border-color:var(--accent)">📥 CSV Import</button>'
    +'<button class="btn btn-outline" onclick="csvExportStudents()" style="color:#16a34a;border-color:#86efac">⬇ Export</button>'
    +(canDo('del','students')?'<button class="btn btn-outline" onclick="deleteAllStudents()" style="color:#dc2626;border-color:#fca5a5">🗑 Delete All</button>':'')
    +'</div>';
  
  var paid    = students.filter(function(s){return s.fees==='Paid';}).length;
  var hostel  = students.filter(function(s){return s.hostel==='Yes';}).length;
  var pending = students.filter(function(s){return s.fees==='Pending';}).length;
  var stats = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-bottom:20px">'
    +'<div class="stat-card" style="--c:#3b78c9"><div class="stat-label">Total Students</div><div class="stat-val">'+students.length+'</div></div>'
    +'<div class="stat-card" style="--c:#16a34a"><div class="stat-label">Fees Paid</div><div class="stat-val">'+paid+'</div><div class="stat-sub">'+pending+' pending</div></div>'
    +'<div class="stat-card" style="--c:#8b5cf6"><div class="stat-label">Hostel</div><div class="stat-val">'+hostel+'</div><div class="stat-sub">'+(students.length-hostel)+' day scholars</div></div>'
    +'<div class="stat-card" style="--c:#f59e0b"><div class="stat-label">Showing</div><div class="stat-val">'+filtered.length+'</div><div class="stat-sub">of '+students.length+'</div></div>'
    +'</div>';
  
  var formHTML = (showAddStudent||stuEditId) ? buildStuForm(stuEditId) : '';
  
  var csvHTML = '';
  if(showCsvImport && !csvImportState){ csvHTML = buildCsvUploadPanel(); }
  if(showCsvImport && csvImportState) { csvHTML = buildCsvMappingPanel(); }
  
  var profileModal = stuViewId ? buildStuProfile(stuViewId) : '';
  // PERF: Only render first page slice on initial load
  var totalPages = Math.max(1, Math.ceil(filtered.length / STU_PAGE_SIZE));
  if(stuPage >= totalPages) stuPage = 0;
  var pageSlice = filtered.slice(stuPage * STU_PAGE_SIZE, (stuPage + 1) * STU_PAGE_SIZE);
  /* Cross-device sync strip for Students page */
  var _stuRtOk = (typeof _gnsiRTStatus!=='undefined') && _gnsiRTStatus.connected >= _gnsiRTStatus.total && _gnsiRTStatus.total > 0;
  var _stuSyncStrip = '<div id="_gnsiStuSyncBadge" style="'
    + 'display:flex;align-items:center;gap:8px;padding:7px 14px;margin-bottom:14px;'
    + 'background:'+(_stuRtOk?'#f0fdf4':'#fffbeb')+';border:1px solid '+(_stuRtOk?'#86efac':'#fcd34d')+';border-radius:9px;'
    + 'font-size:11.5px;font-weight:600;color:'+(_stuRtOk?'#16a34a':'#d97706')+';cursor:pointer;opacity:0.85" onclick="navigate(\'sync\')">'
    + '<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:'+(_stuRtOk?'#16a34a':'#f59e0b')+';'
    + (_stuRtOk?'box-shadow:0 0 5px #16a34a;animation:pulse-dot 1.4s ease-in-out infinite':'')+'"></span>'
    + '<span id="_gnsiStuSyncMsg">'+(_stuRtOk?'\uD83D\uDFE2 Live sync active — changes on other devices appear here automatically':'\uD83D\uDFE1 Connecting to sync…')+'</span>'
    + '<span style="margin-left:auto;font-size:10px;opacity:.65;font-family:\'JetBrains Mono\',monospace">'+students.length+' students</span>'
    + '</div>';
  return profileModal
    + '<div style="margin-bottom:20px"><div style="font-family:\'JetBrains Mono\',monospace;font-size:11px;color:var(--muted);letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px">GNSI -- STUDENT REGISTER</div>'
    + '<div style="font-size:22px;font-family:\'Cormorant Garamond\',serif;font-weight:700;color:var(--accent)">Students</div></div>'
    + _stuSyncStrip + stats + toolbar + formHTML + csvHTML
    + '<div class="card"><div class="card-head"><span class="card-title">📋 Student Register</span>'
    + '<span id="stu-count" style="font-family:\'JetBrains Mono\',monospace;font-size:11px;color:var(--muted)">'+filtered.length+' of '+students.length+'</span></div>'
    // PERF: Pagination bar
    + '<div id="stu-pager" style="display:'+(totalPages>1?'flex':'none')+';align-items:center;gap:6px;flex-wrap:wrap;padding:10px 16px;border-bottom:1px solid var(--border-soft)">'
    + _stuPagerHTML(filtered.length, totalPages)
    + '</div>'
    + '<div class="gnsi-stu-desktop"><div style="overflow-x:auto"><table style="min-width:900px;table-layout:fixed;width:100%"><thead><tr>'
    + '<th style="width:16%">Student</th><th style="width:6%">GCC No.</th><th style="width:8%">Class</th><th style="width:11%">Course</th><th style="width:11%">Parent / Phone</th><th style="width:14%">House Assigned</th><th style="width:7%">Fees</th><th style="width:7%">Session</th><th style="width:20%;min-width:190px">Actions</th>'
    + '</tr></thead><tbody id="stu-tbody">'+renderStudentRows(pageSlice)+'</tbody></table></div></div>'
    // -- MOBILE card view --
    + '<div class="gnsi-stu-mobile" id="stu-mob-list">'
    + _renderMobileCards(pageSlice)
    + '</div>'
    + '</div>';
}
/* PERF: Extracted mobile card renderer -- shared between initial render and _doRenderStudentTable */
function _renderMobileCards(list){
  var houseColors={KOMBIREI:'#e63946',LOKTAK:'#3b78c9',SINGAREI:'#f59e0b',KANGLA:'#16a34a',KOUBRU:'#8b5cf6',SHIROI:'#0891b2',SANGAI:'#ec4899',SANAREI:'#94a3b8',NONGIN:'#2563eb'};
  var houseIcons={KOMBIREI:'🔴',LOKTAK:'🔵',SINGAREI:'🟡',KANGLA:'🟢',KOUBRU:'🟣',SHIROI:'🩵',SANGAI:'🩷',SANAREI:'⚪',NONGIN:'🔷'};
  var houseMap = gnsiGetHouseMap();   // PERF: use cache
  if(!list.length){return students.length===0?'<div style="padding:40px;text-align:center"><div style="font-size:36px;margin-bottom:10px">&#9729;&#65039;</div><div style="font-size:14px;font-weight:700;color:#d97706;margin-bottom:6px">Student data not loaded</div><div style="font-size:12.5px;color:var(--muted);margin-bottom:14px">Students are loaded from Supabase. Check your connection or go to Sync.</div><button onclick="navigate(\'sync\')" class="btn btn-outline" style="color:#1433a8;border-color:#93c5fd">Sync &#8594;</button></div>':'<div style="padding:32px;text-align:center;color:var(--muted)">No students match your filters.</div>';}
  return list.map(function(s){
    var ex=stuLoadExtra(s.id);   // PERF: hits cache after first load
    var parent=ex.father||ex.mother||ex.guardian||'';
    var phone=s.phone||ex.parentPhone||'';
    var assignedHouse=houseMap[String(s.id)]||'';
    var hCol=assignedHouse?(houseColors[assignedHouse]||'#7c3aed'):'#94a3b8';
    var hIcon=assignedHouse?(houseIcons[assignedHouse]||'🏠'):'--';
    return '<div class="stu-mob-card">'
      +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">'+(ex.photo?'<img src="'+_gnsiSafePhoto(ex.photo)+'" style="width:34px;height:34px;border-radius:50%;object-fit:cover;border:2px solid var(--border);flex-shrink:0">':avatarHTML(s.name,34))
        +'<div style="flex:1;min-width:0">'
          +'<div class="stu-mob-card-name" onclick="stuViewId='+parseInt(s.id,10)+';render()" style="cursor:pointer;color:var(--accent);text-decoration:underline;text-underline-offset:2px">'+esc(s.name)+'</div>'
          +'<div class="stu-mob-card-roll">'+(s.roll?'GCC #'+s.roll:ex.admNo?ex.admNo:'--')+'</div>'
        +'</div>'
      +'</div>'
      +'<div class="stu-mob-chip-row">'
        +'<span class="stu-mob-chip" style="color:var(--accent);border-color:var(--border)">🎓 '+esc(s.cls||'No Class')+'</span>'
        +'<span class="stu-mob-chip '+(s.fees==='Paid'?'paid':'pend')+'">'+(s.fees==='Paid'?'✅':'⚠️')+' '+esc(s.fees||'--')+'</span>'
        +(s.hostel==='Yes'?'<span class="stu-mob-chip hostel">🏠 Hostel</span>':'<span class="stu-mob-chip">☀ Day</span>')
        +(assignedHouse?'<span class="stu-mob-chip" style="background:'+hCol+'18;color:'+hCol+';border-color:'+hCol+'44">'+hIcon+' '+assignedHouse+'</span>':'')
        +(function(){
          var _fa=(typeof gnsiGetFeeAsgns==='function'?gnsiGetFeeAsgns():[]);
          var _a=_fa.find(function(x){return String(x.stuId)===String(s.id);});
          var _sid=_a&&(_a.subTypeId||'');
          if(!_sid) return '';
          var _courses=(typeof GNSI_COURSES!=='undefined')?GNSI_COURSES:[];
          var _cName='',_cIcon='📚',_cColor='#1433a8',_stLabel='';
          var _courseColors={sainik:'#1d4ed8',navodaya:'#15803d',foundation:'#7c3aed',combined:'#b45309',combined_navsai:'#b45309'};
          _courses.forEach(function(c){
            if(_sid.toLowerCase().indexOf(c.id.toLowerCase())===0){
              _cName=c.name;_cIcon=c.icon||'📚';_cColor=_courseColors[c.id]||'#1433a8';
              c.subTypes&&c.subTypes.forEach(function(st){if(st.id===_sid){_stLabel=st.icon+' '+st.label;}});
            }
          });
          if(!_cName) return '';
          return '<span class="stu-mob-chip" style="background:'+_cColor+'15;color:'+_cColor+';border-color:'+_cColor+'44;max-width:unset">'+_cIcon+' '+esc(_cName)+(_stLabel?' · '+_stLabel:'')+' </span>';
        })()
      +'</div>'
      +(parent||phone?'<div style="font-size:12px;color:var(--muted);margin-bottom:8px">'+(parent?'👪 '+esc(parent):'')+(phone?' · 📞 '+esc(phone):'')+'</div>':'')
      +'<div class="stu-mob-action-row">'
        +'<button onclick="stuViewId='+parseInt(s.id,10)+';render()" style="background:var(--surface2);color:var(--accent);border:1px solid var(--border)">👁 View</button>'
        +'<button onclick="stuEditId='+parseInt(s.id,10)+';showAddStudent=true;render()" style="background:var(--accent-light);color:var(--accent);border:1.5px solid var(--accent)">✏ Edit</button>'
        +(canDo('del','students')?'<button onclick="removeStudent('+parseInt(s.id,10)+')" style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;flex:0;padding:8px 12px">🗑</button>':'')
      +'</div>'
    +'</div>';
  }).join('');
}
function stuOpenAdd(){ _nstPhotoTemp=null; stuEditId=null; showAddStudent=true; showCsvImport=false; render(); }
function buildStuForm(editId){
  var s = editId ? students.find(function(x){return x.id===editId;}) : null;
  var ex = editId ? stuLoadExtra(editId) : {};
  var classNames = getClassNames();
  var sessions = loadSessions();
  var curSession = (sessions.find(function(ss){return ss.active;})||{}).label || '';
  var title = editId ? '\u270f\ufe0f Edit Student \u2014 '+esc(s?s.name:'') : '\u2795 Enroll New Student';
  var col = editId ? '#f59e0b' : 'var(--accent)';
  /* Red asterisk for required fields shown in BOTH add AND edit mode */
  var R = ' <span style="color:#dc2626;font-weight:900">*</span>';
  /* Phone visible to admin / manager / accounts */
  var canPhone = _canSeePhone();
  var phoneLocked = '<input disabled placeholder="\ud83d\udd12 Admin / Accounts only" value=""'
    +' style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:9px 12px;'
    +'font-size:13px;background:var(--surface2);color:var(--muted);cursor:not-allowed;box-sizing:border-box"/>';

  return '<div class="form-panel" style="border-color:'+col+';border-width:2px;margin-bottom:20px">'

    /* title */
    +'<div class="form-title" style="color:'+col+'">'+title+'</div>'

    /* ── SECTION 1: Basic Information ── */
    +'<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;'
      +'letter-spacing:.1em;font-family:\'JetBrains Mono\',monospace;margin:8px 0 10px;'
      +'padding-bottom:6px;border-bottom:1.5px solid var(--border-soft)">'
      +'\ud83d\udccc Basic Information</div>'
    +'<div class="form-grid g3" style="margin-bottom:16px">'
    +'<div class="form-group"><label>Full Name'+R+'</label>'
      +'<input id="nst-name" placeholder="Student full name" value="'+esc(s?s.name:'')+'" autocomplete="off"/></div>'
    +'<div class="form-group"><label>GCC No. / Roll Number'+R+'</label>'
      +'<input id="nst-roll" placeholder="e.g. 1008" value="'+esc(s?s.roll||'':'')+'" /></div>'
    +(function(){
      var _adm = editId ? (ex.admNo||'') : (typeof gnsiGenAdmNo==='function' ? gnsiGenAdmNo() : (ex.admNo||''));
      return '<div class="form-group"><label>Admission No.'+R+'</label>'
        +'<div style="display:flex;gap:6px">'
        +'<input id="nst-admno" placeholder="e.g. GNSI/2026/001" value="'+esc(_adm)+'" style="flex:1;min-width:0"/>'
        +'<button type="button" data-genstudentadm="1" title="Generate next unique Adm No" style="padding:8px 10px;border-radius:8px;border:1.5px solid #1433a8;background:#e0e8f9;color:#1433a8;font-size:11px;font-weight:700;cursor:pointer">&#9889; Auto</button>'
        +'</div></div>';
    })()
    +'<div class="form-group"><label>Date of Birth'+R+'</label>'
      +'<input type="date" id="nst-dob" value="'+esc(ex.dob||'')+'"/></div>'
    +'<div class="form-group"><label>Gender'+R+'</label>'
      +'<select id="nst-gender">'
        +'<option value=""'+(!(ex.gender)?'selected':'')+'>-- Select --</option>'
        +'<option'+(ex.gender==='Male'?' selected':'')+'>Male</option>'
        +'<option'+(ex.gender==='Female'?' selected':'')+'>Female</option>'
        +'<option'+(ex.gender==='Other'?' selected':'')+'>Other</option>'
      +'</select></div>'
    +'<div class="form-group"><label>Blood Group</label>'
      +'<input id="nst-blood" placeholder="e.g. B+" value="'+esc(ex.blood||'')+'"/></div>'
    +'</div>'

    /* ── SECTION 2: Academic Details ── */
    +'<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;'
      +'letter-spacing:.1em;font-family:\'JetBrains Mono\',monospace;margin-bottom:10px;'
      +'padding-bottom:6px;border-bottom:1.5px solid var(--border-soft)">'
      +'\ud83c\udf93 Academic Details</div>'
    +'<div class="form-grid g3" style="margin-bottom:16px">'
    +'<div class="form-group"><label>Class'+R+'</label>'
      +'<select id="nst-cls">'
      +classNames.map(function(c){return'<option'+(s&&s.cls===c?' selected':'')+'>'+esc(c)+'</option>';}).join('')
      +'</select></div>'
    +'<div class="form-group"><label>Academic Session'+R+'</label>'
      +'<select id="nst-session"><option value="">-- Select --</option>'
      +sessions.map(function(ss){var cur=s?s.session||curSession:curSession;return'<option'+(cur===ss.label?' selected':'')+'>'+esc(ss.label)+'</option>';}).join('')
      +'</select></div>'
    +'<div class="form-group"><label>Previous School</label>'
      +'<input id="nst-prevsch" placeholder="School name" value="'+esc(ex.prevSchool||'')+'"/></div>'
    +'<div class="form-group"><label>Fees Status</label>'
      +'<select id="nst-fees">'
        +'<option'+((!s||s.fees==="Pending")?" selected":"")+'>Pending</option>'
        +'<option'+(s&&s.fees==="Paid"?" selected":"")+'>Paid</option>'
      +'</select></div>'
    +'<div class="form-group"><label>Hostel</label>'
      +'<select id="nst-hostel">'
        +'<option'+((!s||s.hostel==="No")?" selected":"")+'>No</option>'
        +'<option'+(s&&s.hostel==="Yes"?" selected":"")+'>Yes</option>'
      +'</select></div>'
    +'<div class="form-group"><label>House (Hostel)</label>'
      +'<select id="nst-house"><option value="">-- None --</option>'
      +['KOMBIREI','LOKTAK','SINGAREI','KANGLA','KOUBRU','SHIROI','SANGAI','SANAREI','NONGIN'].map(function(h){return'<option'+(ex.house===h?' selected':'')+'>'+h+'</option>';}).join('')
      +'</select></div>'
    +'<div class="form-group"><label>Intake Class'
      +' <span style="font-size:10px;color:var(--muted);font-weight:400">(at admission)</span></label>'
      +'<select id="nst-intake"><option value="">-- Same as current --</option>'
      +(typeof getClassNames==='function'?getClassNames():['Achiever','Leader','Champion','Lakshya','Umeed','Elite','Prime']).map(function(c){return'<option'+(ex.intakeClass===c?' selected':'')+'>'+esc(c)+'</option>';}).join('')
      +'</select></div>'
    +'<div class="form-group"><label>Course Assigned Date'
      +' <span style="font-size:10px;color:var(--muted);font-weight:400">(when moved)</span></label>'
      +'<input type="date" id="nst-course-date" value="'+esc(ex.courseAssignedDate||'')+'"/></div>'
    +(function(){
      var _cfg=(typeof FS_FEE_CONFIG!=='undefined')?FS_FEE_CONFIG:{courses:[]};
      var _crs=_cfg.courses||[];
      var _curCId='',_curSub='';
      if(editId&&typeof gnsiLoad==='function'){
        var _fa=gnsiLoad('gnsi_fee_asgns')||gnsiLoad('gnsi_sfa_assignments')||[];
        var _asgn=_fa.find(function(x){return String(x.stuId)===String(editId);});
        if(_asgn){_curCId=_asgn.courseId||'';_curSub=_asgn.subtype||'';}
      }
      var cOpts='<option value="">-- Select Course --</option>'
        +_crs.map(function(c){return '<option value="'+esc(c.id)+'"'+(_curCId===c.id?' selected':'')+'>'+esc((c.icon||'')+' '+c.name)+'</option>';}).join('');
      var stOpts='<option value="">-- Select Subtype --</option>'
        +['Boarder','Day Boarder','Day Scholar'].map(function(st){
            var icon=st==='Boarder'?'🏠':st==='Day Boarder'?'🌗':'🚌';
            return '<option value="'+st+'"'+(_curSub===st?' selected':'')+'>'+icon+' '+st+'</option>';
          }).join('');
      return '<div class="form-group"><label>Course<span style="color:#c0291d">*</span></label>'
        +'<select id="nst-courseid" onchange="nstCourseChange(this.value)" style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;background:var(--surface);color:var(--text)">'
          +cOpts+'</select></div>'
        +'<div class="form-group"><label>Subtype<span style="color:#c0291d">*</span></label>'
        +'<select id="nst-subtypeid" style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;background:var(--surface);color:var(--text)">'
          +stOpts+'</select></div>';
    })()
    +'</div>'

    /* ── SECTION 3: Parent / Guardian ── */
    +'<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;'
      +'letter-spacing:.1em;font-family:\'JetBrains Mono\',monospace;margin-bottom:10px;'
      +'padding-bottom:6px;border-bottom:1.5px solid var(--border-soft)">'
      +'\ud83d\udc6a Parent / Guardian</div>'
    +'<div class="form-grid g3" style="margin-bottom:16px">'
    +'<div class="form-group"><label>Father\'s Name'+R+'</label>'
      +'<input id="nst-father" placeholder="Father\'s full name" value="'+esc(ex.father||'')+'"/></div>'
    +'<div class="form-group"><label>Mother\'s Name</label>'
      +'<input id="nst-mother" placeholder="Mother\'s full name" value="'+esc(ex.mother||'')+'"/></div>'
    +'<div class="form-group"><label>Guardian Name</label>'
      +'<input id="nst-guardian" placeholder="If different from parents" value="'+esc(ex.guardian||'')+'"/></div>'
    +'<div class="form-group"><label>Student Phone'
      +' <span style="font-size:10px;color:var(--muted);font-weight:400">(Admin/Accounts)</span></label>'
      +(canPhone
        ?'<input id="nst-phone" placeholder="Student contact" value="'+esc(s?s.phone||'':'')+'" />'
        :phoneLocked)
    +'</div>'
    +'<div class="form-group"><label>Parent Phone'+R
      +' <span style="font-size:10px;color:var(--muted);font-weight:400">(Admin/Accounts)</span></label>'
      +(canPhone
        ?'<input id="nst-pphone" placeholder="Parent contact (required)" value="'+esc(ex.parentPhone||'')+'" />'
        :phoneLocked)
    +'</div>'
    +'<div class="form-group"><label>WhatsApp No.'
      +' <span style="font-size:10px;color:var(--muted);font-weight:400">(Admin/Accounts)</span></label>'
      +(canPhone
        ?'<input id="nst-wa" placeholder="WhatsApp number" value="'+esc(ex.whatsapp||'')+'" />'
        :phoneLocked)
    +'</div>'
    +'</div>'

    /* ── SECTION 4: Address & Other ── */
    +'<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;'
      +'letter-spacing:.1em;font-family:\'JetBrains Mono\',monospace;margin-bottom:10px;'
      +'padding-bottom:6px;border-bottom:1.5px solid var(--border-soft)">'
      +'\ud83d\udccd Address & Other</div>'
    +'<div class="form-grid g3" style="margin-bottom:16px">'
    +'<div class="form-group" style="grid-column:span 2"><label>Address'+R+'</label>'
      +'<input id="nst-addr" placeholder="Village / Town, District" value="'+esc(ex.address||'')+'"/></div>'
    +'<div class="form-group"><label>State</label>'
      +'<input id="nst-state" placeholder="e.g. Manipur" value="'+esc(ex.state||'Manipur')+'"/></div>'
    +'<div class="form-group"><label>Religion</label>'
      +'<input id="nst-religion" placeholder="e.g. Hindu" value="'+esc(ex.religion||'')+'"/></div>'
    +'<div class="form-group"><label>Category</label>'
      +'<select id="nst-cat"><option value="">-- Select --</option>'
      +['General','OBC','SC','ST','EWS','Other'].map(function(c){return'<option'+(ex.category===c?' selected':'')+'>'+c+'</option>';}).join('')
      +'</select></div>'
    +'<div class="form-group"><label>Remarks</label>'
      +'<input id="nst-remarks" placeholder="Any notes" value="'+esc(ex.remarks||'')+'"/></div>'
    +'</div>'

    /* ── Legend ── */
    +'<div style="font-size:11.5px;color:var(--muted);background:var(--surface2);'
      +'border-radius:8px;padding:8px 12px;margin-bottom:14px;border:1px solid var(--border-soft)">'
      +'<span style="color:#dc2626;font-weight:900">*</span>'
      +' Required fields \u2014 form cannot be saved without these.'
      +(canPhone?'':' \ud83d\udd12 Phone fields are visible to Admin &amp; Accounts only.')
    +'</div>'

    /* ── SECTION 5: Photo ── */
    +'<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;'
      +'letter-spacing:.1em;font-family:\'JetBrains Mono\',monospace;margin-bottom:10px;'
      +'padding-bottom:6px;border-bottom:1.5px solid var(--border-soft)">'
      +'\ud83d\udcf7 Student Photo</div>'
    +'<div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">'
    +'<div id="nst-photo-prev" style="width:72px;height:72px;border-radius:10px;border:2px solid var(--border);background:var(--surface2);overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;color:var(--muted)">'
    +(ex.photo?'<img src="'+esc(ex.photo)+'" style="width:100%;height:100%;object-fit:cover">':'👤')
    +'</div>'
    +'<div>'
    +'<input type="file" id="nst-photo-input" accept="image/*" style="display:none" onchange="nstHandlePhoto(this)"/>'
    +'<button type="button" onclick="document.getElementById(\'nst-photo-input\').click()" style="padding:7px 14px;border-radius:8px;border:1.5px solid var(--border);background:var(--surface2);cursor:pointer;font-size:12px;font-weight:700;color:var(--accent);font-family:DM Sans,sans-serif">📁 Choose Photo</button>'
    +(ex.photo?' <button type="button" onclick="nstClearPhoto()" style="padding:7px 14px;border-radius:8px;border:1.5px solid #fca5a5;background:#fef2f2;cursor:pointer;font-size:12px;font-weight:700;color:#dc2626;font-family:DM Sans,sans-serif">✕ Remove</button>':'')
    +'<div id="nst-photo-msg" style="font-size:11px;color:var(--muted);margin-top:6px">Max 300KB · JPEG/PNG. Photo appears in the student table.</div>'
    +'</div></div>'

    /* ── Actions ── */
    +'<div class="form-actions">'
    +'<button class="btn btn-primary" onclick="saveStu('+(editId||'null')+')">'+( editId ? '\u2713 Update Student' : '\u2705 Save &amp; Enroll')+'</button>'
    +'<button class="btn btn-outline" onclick="stuCancelForm()">Cancel</button>'
    +(editId && canDo('del','students') ? '<button class="btn btn-outline" style="color:#dc2626;border-color:#fca5a5" onclick="removeStudent('+editId+')">\ud83d\uddd1 Delete</button>' : '')
    +'</div></div>';
}

/* ── Student form photo handlers ── */
var _nstPhotoTemp = null; // null=unchanged, 'CLEAR'=removed, 'data:...'=new photo
function nstHandlePhoto(input){
  var file = input.files && input.files[0];
  if(!file) return;
  var msg = document.getElementById('nst-photo-msg');
  if(file.size > 300*1024){
    if(msg){ msg.textContent='❌ Too large! Max 300KB. Please compress the image.'; msg.style.color='#dc2626'; }
    input.value=''; return;
  }
  if(!file.type.startsWith('image/')){
    if(msg){ msg.textContent='❌ Images only (JPEG/PNG).'; msg.style.color='#dc2626'; }
    input.value=''; return;
  }
  var reader = new FileReader();
  reader.onload = function(e){
    _nstPhotoTemp = e.target.result; /* keep base64 as immediate preview */
    var prev = document.getElementById('nst-photo-prev');
    if(prev) prev.innerHTML = '<img src="'+_nstPhotoTemp+'" style="width:100%;height:100%;object-fit:cover"/>';
    /* GAP FIX — Upload to Supabase Storage so photo survives device wipe */
    if(window._supa){
      if(msg){ msg.textContent='⏳ Uploading photo to cloud…'; msg.style.color='#1433a8'; }
      var ext = file.name.split('.').pop() || 'jpg';
      var path = 'student-photos/stu_' + Date.now() + '.' + ext;
      window._supa.storage.from('gnsi-photos').upload(path, file, {
        cacheControl: '3600', upsert: true, contentType: file.type
      }).then(function(r){
        if(r.error){
          /* Storage bucket may not exist yet — fall back to base64 gracefully */
          if(msg){ msg.textContent='✅ Photo ready (local) — cloud upload needs gnsi-photos bucket.'; msg.style.color='#d97706'; }
          console.warn('[GNSI] Photo upload failed:', r.error.message);
          return;
        }
        var urlRes = window._supa.storage.from('gnsi-photos').getPublicUrl(path);
        var publicUrl = urlRes.data && urlRes.data.publicUrl;
        if(publicUrl){
          _nstPhotoTemp = publicUrl; /* replace base64 with cloud URL */
          if(msg){ msg.textContent='✅ Photo uploaded to cloud — click Save to apply.'; msg.style.color='#16a34a'; }
        }
      }).catch(function(e){
        if(msg){ msg.textContent='✅ Photo ready (local only).'; msg.style.color='#16a34a'; }
        console.warn('[GNSI] Photo upload error:', e);
      });
    } else {
      if(msg){ msg.textContent='✅ Photo ready — click Save to apply.'; msg.style.color='#16a34a'; }
    }
  };
  reader.readAsDataURL(file);
}
function nstClearPhoto(){
  _nstPhotoTemp = 'CLEAR';
  var prev = document.getElementById('nst-photo-prev');
  if(prev){ prev.innerHTML='👤'; }
  var msg = document.getElementById('nst-photo-msg');
  if(msg){ msg.textContent='Photo removed — click Save to confirm.'; msg.style.color='#d4a853'; }
}
function stuCancelForm(){ _nstPhotoTemp=null; stuEditId=null; showAddStudent=false; render(); }
function _gnsiValidatePhone(ph){
  if(!ph||ph.trim()==='') return true;
  var s=ph.trim().replace(/[\s\-\(\)\+]/g,'');
  return /^[0-9]{10,13}$/.test(s);
}
function saveStu(editId){
  if(!currentUser||(['admin','manager','accounts'].indexOf(currentUser.role)<0)){
    if(typeof showToast==='function')showToast('🔒 Access denied: edit student','#dc2626');
    return;
  }

  var name = ((document.getElementById('nst-name')||{}).value||'').trim();
  var _ph=((document.getElementById('nst-phone')||{}).value||'').trim();
  var _pph=_canSeePhone()?((document.getElementById('nst-pphone')||{}).value||'').trim():'';
  if(_ph&&!/^\+?[0-9]{10,13}$/.test(_ph.replace(/[\s\-\(\)]/g,''))){showToast('⚠ Student phone "'+_ph+'" is not valid. Enter a 10-digit number.','#ea580c');return;}
  if(_pph&&!/^\+?[0-9]{10,13}$/.test(_pph.replace(/[\s\-\(\)]/g,''))){showToast('⚠ Parent phone "'+_pph+'" is not valid. Enter a 10-digit number.','#ea580c');return;}
  if(!name){showToast('⚠️ Full Name is required.','#ea580c');return;}
  /* Validate required fields in BOTH add and edit mode */
  var _roll=((document.getElementById('nst-roll')||{}).value||'').trim();
  var _admno=((document.getElementById('nst-admno')||{}).value||'').trim();
  var _dob=((document.getElementById('nst-dob')||{}).value||'');
  var _gender=((document.getElementById('nst-gender')||{}).value||'');
  var _cls=(document.getElementById('nst-cls')||{value:''}).value;
  var _session=(document.getElementById('nst-session')||{value:''}).value;
  var _father=((document.getElementById('nst-father')||{}).value||'').trim();
  var _addr=((document.getElementById('nst-addr')||{}).value||'').trim();
  if(!_roll){showToast('⚠️ GCC No. / Roll Number is required.','#ea580c');return;}
  if(!_admno){
    _admno = typeof gnsiGenAdmNo==='function' ? gnsiGenAdmNo() : '';
    var _admEl=document.getElementById('nst-admno'); if(_admEl) _admEl.value=_admno;
  }
  if(!_admno){showToast('⚠️ Admission No. is required.','#ea580c');return;}
  /* Auto-fill if blank */
  if(!_admno){
    _admno = typeof gnsiGenAdmNo==='function' ? gnsiGenAdmNo() : '';
    var _admEl=document.getElementById('nst-admno'); if(_admEl) _admEl.value=_admno;
  }
  var _admDup=false;
  (typeof students!=='undefined'?students:[]).forEach(function(sx){
    if(editId&&sx.id===editId)return;
    var _sx=typeof stuLoadExtra==='function'?stuLoadExtra(sx.id):{};
    if(_sx.admNo&&_sx.admNo===_admno)_admDup=true;
  });
  if(_admDup){showToast('⚠️ Adm. No. "'+_admno+'" already exists. Click ⚡ Auto.','#ea580c');return;}
  var _courseId=((document.getElementById('nst-courseid')||{}).value||'');
  var _subtype =((document.getElementById('nst-subtypeid')||{}).value||'');
  if(!_courseId){showToast('⚠️ Course is required.','#ea580c');return;}
  if(!_subtype){showToast('⚠️ Subtype is required.','#ea580c');return;}
  var _admDup=false;
  (typeof students!=='undefined'?students:[]).forEach(function(sx){
    if(editId&&sx.id===editId) return;
    var _sx=typeof stuLoadExtra==='function'?stuLoadExtra(sx.id):{};
    if(_sx.admNo&&_sx.admNo===_admno) _admDup=true;
  });
  if(_admDup){showToast('⚠️ Adm. No. "'+_admno+'" already exists. Click ⚡ Auto.','#ea580c');return;}
  if(!_dob){showToast('⚠️ Date of Birth is required.','#ea580c');return;}
  if(!_gender){showToast('⚠️ Gender is required.','#ea580c');return;}
  if(!_cls){showToast('⚠️ Class is required.','#ea580c');return;}
  if(!_session){showToast('⚠️ Academic Session is required.','#ea580c');return;}
  if(!_father){showToast("⚠️ Father's Name is required.",'#ea580c');return;}
  if(!_addr){showToast('⚠️ Address is required.','#ea580c');return;}
  if(_canSeePhone()&&!((document.getElementById('nst-pphone')||{}).value||'').trim()){showToast('⚠️ Parent Phone is required.','#ea580c');return;}
  var extra = {
    admNo:       ((document.getElementById('nst-admno')||{}).value||'').trim(),
    dob:         ((document.getElementById('nst-dob')||{}).value||''),
    gender:      ((document.getElementById('nst-gender')||{}).value||''),
    blood:       ((document.getElementById('nst-blood')||{}).value||'').trim(),
    prevSchool:  ((document.getElementById('nst-prevsch')||{}).value||'').trim(),
    father:      ((document.getElementById('nst-father')||{}).value||'').trim(),
    mother:      ((document.getElementById('nst-mother')||{}).value||'').trim(),
    guardian:    ((document.getElementById('nst-guardian')||{}).value||'').trim(),
    parentPhone: _canSeePhone() ? ((document.getElementById('nst-pphone')||{}).value||'').trim() : (editId ? (stuLoadExtra(editId).parentPhone||'') : ''),
    whatsapp:    _canSeePhone() ? ((document.getElementById('nst-wa')||{}).value||'').trim() : (editId ? (stuLoadExtra(editId).whatsapp||'') : ''),
    address:     ((document.getElementById('nst-addr')||{}).value||'').trim(),
    state:       ((document.getElementById('nst-state')||{}).value||'').trim(),
    religion:    ((document.getElementById('nst-religion')||{}).value||'').trim(),
    category:    ((document.getElementById('nst-cat')||{}).value||''),
    house:       ((document.getElementById('nst-house')||{}).value||''),
    intakeClass: ((document.getElementById('nst-intake')||{}).value||''),
    courseAssignedDate: ((document.getElementById('nst-course-date')||{}).value||''),
    remarks:     ((document.getElementById('nst-remarks')||{}).value||'').trim(),
    courseId:    ((document.getElementById('nst-courseid')||{}).value||''),
    subtype:     ((document.getElementById('nst-subtypeid')||{}).value||'')
  };
  // Resolve photo: new upload > CLEAR > keep existing
  var _existingEx = editId ? (stuLoadExtra(editId)||{}) : {};
  if(_nstPhotoTemp && _nstPhotoTemp!=='CLEAR') extra.photo = _nstPhotoTemp;
  else if(_nstPhotoTemp==='CLEAR') extra.photo = '';
  else extra.photo = _existingEx.photo || '';
  _nstPhotoTemp = null; // reset for next open
  var core = {
    name:    name,
    roll:    ((document.getElementById('nst-roll')||{}).value||'').trim(),
    phone:   _canSeePhone() ? ((document.getElementById('nst-phone')||{}).value||'').trim() : (editId ? (students.find(function(x){return x.id===editId;})||{}).phone||'' : ''),
    cls:     (document.getElementById('nst-cls')||{value:''}).value,
    hostel:  (document.getElementById('nst-hostel')||{value:'No'}).value,
    fees:    (document.getElementById('nst-fees')||{value:'Pending'}).value,
    session: (document.getElementById('nst-session')||{value:''}).value
  };
  if(editId){
    students = students.map(function(s){ return s.id===editId ? Object.assign({},s,core) : s; });
    stuSaveExtra(editId, extra);
    /* [SUPABASE-ONLY] localStorage write removed: ims_students */
    /* ── Fee assignment upsert + full cloud sync ── */
    if(extra.courseId && extra.subtype){
      var _cfg2=(typeof FS_FEE_CONFIG!=='undefined')?FS_FEE_CONFIG:{courses:[]};
      var _c2=_cfg2.courses.find(function(c){return c.id===extra.courseId;});
      var _sk2=extra.subtype.toLowerCase().replace(/\s+/g,'');
      var _mf2=_c2?(_c2.monthlyFees&&(_c2.monthlyFees[_sk2]||_c2.monthlyFees['boarder'])||0):0;
      var _fa2=(typeof gnsiLoad==='function')?(gnsiLoad('gnsi_fee_asgns')||gnsiLoad('gnsi_sfa_assignments')||[]):[];
      var _fi2=_fa2.findIndex(function(a){return String(a.stuId)===String(editId);});
      if(_fi2>=0){
        _fa2[_fi2].courseId=extra.courseId;_fa2[_fi2].subtype=extra.subtype;
        _fa2[_fi2].subTypeId=extra.courseId+'_'+_sk2;_fa2[_fi2].monthlyFee=_mf2;
        _fa2[_fi2].admNo=extra.admNo||_fa2[_fi2].admNo;
        _fa2[_fi2].courseAssignedAt=_fa2[_fi2].courseAssignedAt||new Date().toISOString();
        _fa2[_fi2].updatedAt=new Date().toISOString();
      } else {
        _fa2.push({stuId:editId,courseId:extra.courseId,subtype:extra.subtype,
          subTypeId:extra.courseId+'_'+_sk2,monthlyFee:_mf2,admNo:extra.admNo||'',
          enrolledAt:new Date().toISOString(),courseAssignedAt:new Date().toISOString()});
      }
      /* gnsiSave = localStorage + gnsiKVPush (cloud) in one call */
      if(typeof gnsiSave==='function'){gnsiSave('gnsi_fee_asgns',_fa2);gnsiSave('gnsi_sfa_assignments',_fa2);}
      else{localStorage.setItem('gnsi_fee_asgns',JSON.stringify(_fa2));if(typeof gnsiKVPush==='function')gnsiKVPush('gnsi_fee_asgns',_fa2);}
    }
    // Instant single-row upsert — other devices see the change immediately
    var _updStu = students.find(function(s){ return s.id===editId; });
    if (_updStu) {
      _gnsiInstantPush('students', {
        id: _updStu.id, name: _updStu.name, roll_no: _updStu.roll||null,
        phone: _updStu.phone||null, is_boarder: _updStu.hostel==='Yes',
        status: 'Active', class_id: CLASS_ID_MAP[_updStu.cls]||null,
        session: _updStu.session||null
      });
    }
    showToast('Student updated ✅ Synced to cloud ☁️','#f59e0b');
  } else {
    var newId = Date.now(); /* FIX 4: timestamp ID — never resets, never collides */
    students.push(Object.assign({id:newId}, core));
    stuSaveExtra(newId, extra);
    /* [SUPABASE-ONLY] localStorage write removed: ims_students */
    /* ── Fee assignment create + full cloud sync ── */
    if(extra.courseId && extra.subtype){
      var _cfg3=(typeof FS_FEE_CONFIG!=='undefined')?FS_FEE_CONFIG:{courses:[]};
      var _c3=_cfg3.courses.find(function(c){return c.id===extra.courseId;});
      var _sk3=extra.subtype.toLowerCase().replace(/\s+/g,'');
      var _mf3=_c3?(_c3.monthlyFees&&(_c3.monthlyFees[_sk3]||_c3.monthlyFees['boarder'])||0):0;
      var _fa3=(typeof gnsiLoad==='function')?(gnsiLoad('gnsi_fee_asgns')||gnsiLoad('gnsi_sfa_assignments')||[]):[];
      _fa3.push({stuId:newId,courseId:extra.courseId,subtype:extra.subtype,
        subTypeId:extra.courseId+'_'+_sk3,monthlyFee:_mf3,admNo:extra.admNo||'',
        enrolledAt:new Date().toISOString(),courseAssignedAt:new Date().toISOString()});
      if(typeof gnsiSave==='function'){gnsiSave('gnsi_fee_asgns',_fa3);gnsiSave('gnsi_sfa_assignments',_fa3);}
      else{localStorage.setItem('gnsi_fee_asgns',JSON.stringify(_fa3));if(typeof gnsiKVPush==='function'){gnsiKVPush('gnsi_fee_asgns',_fa3);gnsiKVPush('gnsi_sfa_assignments',_fa3);}}
    }
    /* Instant single-row insert — visible to all devices immediately */
    var _newStu = students[students.length-1];
    if (_newStu) {
      _gnsiInstantPush('students', {
        id: _newStu.id, name: _newStu.name, roll_no: _newStu.roll||null,
        phone: _newStu.phone||null, is_boarder: _newStu.hostel==='Yes',
        status: 'Active', class_id: CLASS_ID_MAP[_newStu.cls]||null,
        session: _newStu.session||null
      });
    }
    gnsiActivity('Student Saved', (editId?'Edited':'Added')+': '+((document.getElementById('nst-name')||{}).value||''), 'students');
    /* [SUPABASE-ONLY] save() removed — _gnsiInstantPush handles Supabase write */
    /* ── MANDATORY ADMISSION PACKAGE GATE (v68) ──────────────────────────────
       Student record is saved, but before proceeding we MUST collect:
         • Admission Fee  (₹6,000 flat / course-based)
         • Dress Kit      (5 items — Aqua/Blue T-shirts, Track Suits etc.)
         • Prospectus     (₹200)
       We auto-create a linked Admissions app record (status = Admitted,
       _fromStudents = true) and open the _admPayFeeAppId modal.
       admEnroll() detects _fromStudents and skips re-creating the student.
    ── ──────────────────────────────────────────────────────────────────────── */
    var _syntheticApp = {
      id:             'sa_' + newId + '_' + Date.now(),
      name:           name,
      admNo:          extra.admNo          || '',
      dob:            extra.dob            || '',
      gender:         extra.gender         || '',
      blood:          extra.blood          || '',
      father:         extra.father         || '',
      mother:         extra.mother         || '',
      guardian:       extra.guardian       || '',
      /* phone in adm apps = parentPhone (primary contact) */
      phone:          extra.parentPhone    || core.phone || '',
      whatsapp:       extra.whatsapp       || '',
      address:        extra.address        || '',
      state:          extra.state          || 'Manipur',
      category:       extra.category       || '',
      religion:       extra.religion       || '',
      prevSchool:     extra.prevSchool     || '',
      remarks:        extra.remarks        || '',
      roll:           core.roll            || '',
      cls:            core.cls             || '',
      hostel:         core.hostel          || 'No',
      session:        core.session         || '',
      intakeClass:    extra.intakeClass    || '',
      courseAssignedDate: extra.courseAssignedDate || '',
      status:           'Admitted',
      _fromStudents:    true,
      _stuId:           newId,
      linkedStudentId:  newId,
      stuId:            newId,
      createdAt:        new Date().toISOString()
    };
    var _admApps = (typeof loadAdmApps === 'function') ? loadAdmApps() : [];
    _admApps.push(_syntheticApp);
    if (typeof saveAdmApps === 'function') saveAdmApps(_admApps);
    /* Open the admission fee modal */
    window._admPayFeeAppId = String(_syntheticApp.id);
    stuEditId = null; showAddStudent = false;
    showToast('✅ Student saved — collect Admission Package now (mandatory)','#1433a8');
    render();
    return;
  }
  /* [SUPABASE-ONLY] save() removed — _gnsiInstantPush already pushed to Supabase above */
  stuEditId=null; showAddStudent=false;
  render();
}
function buildStuProfile(id){
  var s = students.find(function(x){return x.id===id;});
  if(!s) return '';
  var ex = stuLoadExtra(id);
  var hue = s.name.split('').reduce(function(a,c){return a+c.charCodeAt(0);},0)%360;
  var fields = function(label,val){
    if(!val) return '';
    return '<div style="margin-bottom:8px"><div style="font-size:9.5px;font-weight:700;color:var(--muted2);text-transform:uppercase;letter-spacing:.1em;font-family:\'JetBrains Mono\',monospace">'+label+'</div>'
      +'<div style="font-size:13px;font-weight:600;color:var(--text);margin-top:1px">'+esc(val)+'</div></div>';
  };
  return '<div style="position:fixed;inset:0;background:rgba(8,15,38,.55);z-index:300;display:flex;align-items:flex-start;justify-content:center;padding-top:40px;overflow-y:auto;backdrop-filter:blur(4px)" onclick="if(event.target===this){stuViewId=null;render()}">'
    +'<div style="background:var(--surface);border-radius:18px;width:780px;max-width:97vw;box-shadow:var(--shadow-lg);overflow:hidden;margin-bottom:40px" onclick="event.stopPropagation()">'
    // Header
    +'<div style="background:linear-gradient(135deg,#0b1e6e,#1433a8);padding:24px 28px;display:flex;align-items:center;gap:18px">'
    +(ex.photo
      ? '<img src="'+_gnsiSafePhoto(ex.photo)+'" style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:3px solid rgba(255,255,255,.4);flex-shrink:0">'
      : '<div class="avatar" style="width:64px;height:64px;font-size:22px;font-weight:800;background:hsl('+hue+',45%,42%);border:3px solid rgba(255,255,255,.4);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0">'
        +(s.name.trim().split(' ').slice(0,2).map(function(w){return w[0];}).join('').toUpperCase())
        +'</div>')
    +'<div style="flex:1"><div style="font-family:\'Playfair Display\',serif;font-size:22px;font-weight:700;color:#fff">'+esc(s.name)+'</div>'
    +'<div style="font-size:12.5px;color:rgba(255,255,255,.75);margin-top:4px;display:flex;gap:12px;flex-wrap:wrap">'
    +(s.roll?'<span>Roll: <b>'+esc(s.roll)+'</b></span>':'')
    +(ex.admNo?'<span>Adm#: <b>'+esc(ex.admNo)+'</b></span>':'')
    +'<span>Class: <b>'+esc(s.cls||'--')+'</b></span>'
    +(s.session?'<span>Session: <b>'+esc(s.session)+'</b></span>':'')
    +'</div>'
    +'<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">'
    +'<span style="padding:3px 11px;border-radius:20px;font-size:11px;font-weight:700;background:'+(s.fees==='Paid'?'#dcfce7':'#fee2e2')+';color:'+(s.fees==='Paid'?'#16a34a':'#dc2626')+'">'+s.fees+'</span>'
    +(function(){
      var shm = gnsiGetHouseMap();   // PERF: use cache
      var houseColors = {KOMBIREI:'#e63946',LOKTAK:'#3b78c9',SINGAREI:'#f59e0b',KANGLA:'#16a34a',KOUBRU:'#8b5cf6',SHIROI:'#0891b2',SANGAI:'#ec4899',SANAREI:'#94a3b8',NONGIN:'#2563eb'};
      var houseIcons  = {KOMBIREI:'🔴',LOKTAK:'🔵',SINGAREI:'🟡',KANGLA:'🟢',KOUBRU:'🟣',SHIROI:'🩵',SANGAI:'🩷',SANAREI:'⚪',NONGIN:'🔷'};
      var assignedHouse = shm[String(s.id)] || ex.house || '';
      if(assignedHouse){
        var hc = houseColors[assignedHouse]||'#7c3aed';
        var hi = houseIcons[assignedHouse]||'🏠';
        return '<span style="padding:3px 11px;border-radius:20px;font-size:11px;font-weight:700;background:'+hc+'33;color:'+hc+';border:1.5px solid '+hc+'66">'+hi+' '+assignedHouse+' HOUSE</span>';
      }
      if(s.hostel==='Yes') return '<span style="padding:3px 11px;border-radius:20px;font-size:11px;font-weight:700;background:#fff7ed;color:#ea580c;border:1.5px solid #fdba74">⚠ Hostel -- No house assigned</span>';
      return '<span style="padding:3px 11px;border-radius:20px;font-size:11px;font-weight:700;background:#f8fafc;color:#64748b">Day Scholar</span>';
    })()
    +(function(){
      var _fa=(typeof gnsiGetFeeAsgns==='function'?gnsiGetFeeAsgns():[]);
      var _a=_fa.find(function(x){return String(x.stuId)===String(s.id);});
      var _sid=_a&&(_a.subTypeId||'');
      if(!_sid) return '';
      var _courses=(typeof GNSI_COURSES!=='undefined')?GNSI_COURSES:[];
      var _cName='',_cIcon='📚',_cColor='#1433a8',_stLabel='',_stIcon='';
      var _courseColors={sainik:'#1d4ed8',navodaya:'#15803d',foundation:'#7c3aed',combined:'#b45309',combined_navsai:'#b45309'};
      _courses.forEach(function(c){
        if(_sid.toLowerCase().indexOf(c.id.toLowerCase())===0){
          _cName=c.name;_cIcon=c.icon||'📚';_cColor=_courseColors[c.id]||'#1433a8';
          c.subTypes&&c.subTypes.forEach(function(st){if(st.id===_sid){_stLabel=st.label;_stIcon=st.icon||'';}});
        }
      });
      if(!_cName) return '';
      return '<span style="padding:3px 11px;border-radius:20px;font-size:11px;font-weight:700;background:'+_cColor+'33;color:'+_cColor+';border:1.5px solid '+_cColor+'66">'+_cIcon+' '+esc(_cName)+(_stLabel?' · '+(_stIcon?_stIcon+' ':'')+_stLabel:'')+' </span>';
    })()
    +'</div></div>'
    +'<div style="display:flex;gap:8px;flex-direction:column;flex-shrink:0">'
    +'<button onclick="stuViewId=null;stuEditId='+id+';showAddStudent=true;render()" style="padding:8px 16px;border-radius:9px;border:1.5px solid rgba(255,255,255,.4);background:rgba(255,255,255,.15);color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">✏️ Edit</button>'
    +'<button onclick="stuViewId=null;render()" style="padding:8px 16px;border-radius:9px;border:1.5px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:rgba(255,255,255,.8);font-size:12px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">✕ Close</button>'
    +'</div></div>'
    // Body grid
    +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;padding:0">'
    // Col 1 - Basic
    +'<div style="padding:20px 22px;border-right:1px solid var(--border-soft)">'
    +'<div style="font-size:11px;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:.1em;font-family:\'JetBrains Mono\',monospace;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid var(--accent-light)">Personal</div>'
    +(function(){
      var shm=gnsiGetHouseMap();   // PERF: use cache
      var houseColors={KOMBIREI:'#e63946',LOKTAK:'#3b78c9',SINGAREI:'#f59e0b',KANGLA:'#16a34a',KOUBRU:'#8b5cf6',SHIROI:'#0891b2',SANGAI:'#ec4899',SANAREI:'#94a3b8',NONGIN:'#2563eb'};
      var houseIcons={KOMBIREI:'🔴',LOKTAK:'🔵',SINGAREI:'🟡',KANGLA:'🟢',KOUBRU:'🟣',SHIROI:'🩵',SANGAI:'🩷',SANAREI:'⚪',NONGIN:'🔷'};
      var assignedHouse = shm[String(s.id)] || ex.house || '';
      var hostelLabel = s.hostel==='Yes' ? 'Yes -- Boarder' : 'No -- Day Scholar';
      var houseHTML;
      if(assignedHouse){
        var hc=houseColors[assignedHouse]||'#7c3aed';
        var hi=houseIcons[assignedHouse]||'🏠';
        houseHTML='<div style="margin-top:4px"><span style="display:inline-flex;align-items:center;gap:6px;padding:5px 14px;border-radius:20px;font-size:13px;font-weight:800;background:'+hc+'22;color:'+hc+';border:2px solid '+hc+'55">'+hi+' '+assignedHouse+' HOUSE</span></div>';
      } else if(s.hostel==='Yes'){
        var _h2=shm[String(stuViewId)]||'';
        var _hc2={KOMBIREI:'#e63946',LOKTAK:'#3b78c9',SINGAREI:'#f59e0b',KANGLA:'#16a34a',KOUBRU:'#8b5cf6',SHIROI:'#0891b2',SANGAI:'#ec4899',SANAREI:'#94a3b8',NONGIN:'#2563eb'};
        var _hi2={KOMBIREI:'🔴',LOKTAK:'🔵',SINGAREI:'🟡',KANGLA:'🟢',KOUBRU:'🟣',SHIROI:'🩵',SANGAI:'🩷',SANAREI:'⚪',NONGIN:'🔷'};
        if(_h2) houseHTML='<span style="display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;background:'+(_hc2[_h2]||'#7c3aed')+'18;color:'+(_hc2[_h2]||'#7c3aed')+';border:1.5px solid '+(_hc2[_h2]||'#7c3aed')+'44">'+(_hi2[_h2]||'🏠')+' '+_h2+' House</span>';
        else houseHTML='<div style="margin-top:4px;font-size:12px;color:#f59e0b;font-weight:600">⚠ Hostel -- No house assigned yet</div>';
      } else {
        houseHTML='<div style="margin-top:4px;font-size:12px;color:var(--muted)">Day Scholar</div>';
      }
      return '<div style="margin-bottom:12px;padding:10px 12px;border-radius:10px;background:var(--surface2);border:1.5px solid var(--border-soft)">'
        +'<div style="font-size:9.5px;font-weight:700;color:var(--muted2);text-transform:uppercase;letter-spacing:.1em;font-family:\'JetBrains Mono\',monospace;margin-bottom:2px">House / Hostel</div>'
        +'<div style="font-size:12px;color:var(--muted);margin-bottom:4px">Hostel: <b style="color:var(--text)">'+hostelLabel+'</b></div>'
        +houseHTML
        +'</div>';
    })()
    +fields('Date of Birth', ex.dob ? new Date(ex.dob+' ').toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}) : '')
    +fields('Gender', ex.gender)
    +fields('Blood Group', ex.blood)
    +(_canSeeReligion()?fields('Religion', ex.religion):'')
    +(_canSeeCategory()?fields('Category', ex.category):'')
    +fields('Previous School', ex.prevSchool)
    +'</div>'
    // Col 2 - Parent
    +'<div style="padding:20px 22px;border-right:1px solid var(--border-soft)">'
    +'<div style="font-size:11px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:.1em;font-family:\'JetBrains Mono\',monospace;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #dcfce7">Parent / Guardian</div>'
    +fields("Father's Name", ex.father)
    +fields("Mother's Name", ex.mother)
    +fields('Guardian', ex.guardian)
    +fields('Student Phone', maskPhone(s.phone))
    +(_canSeePhone()?fields('Parent Phone', ex.parentPhone):fields('Parent Phone','🔒 Hidden'))
    +(_canSeePhone()?fields('WhatsApp', ex.whatsapp):fields('WhatsApp','🔒 Hidden'))
    +'</div>'
    // Col 3 - Address
    +'<div style="padding:20px 22px">'
    +'<div style="font-size:11px;font-weight:700;color:#8b5cf6;text-transform:uppercase;letter-spacing:.1em;font-family:\'JetBrains Mono\',monospace;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #ede9fe">Address & Misc</div>'
    +(_canSeeAddress()?fields('Address', ex.address):fields('Address','🔒 Hidden'))
    +fields('State', ex.state)
    +fields('Remarks', ex.remarks)
    +'</div></div>'
    // Footer
    +'<div style="padding:14px 22px;background:var(--surface2);border-top:1px solid var(--border-soft);display:flex;align-items:center;gap:10px;flex-wrap:wrap">'
    +'<span style="font-size:11.5px;color:var(--muted)">Student ID: <b>#'+parseInt(s.id,10)+'</b></span>'
    +(_canEditFees()?'<button onclick="toggleFees('+parseInt(s.id,10)+');stuViewId='+parseInt(s.id,10)+';render()" style="font-size:11.5px;padding:5px 13px;border-radius:7px;border:1px solid var(--border);background:'+(s.fees==='Paid'?'#fee2e2':'#dcfce7')+';color:'+(s.fees==='Paid'?'#dc2626':'#16a34a')+';cursor:pointer;font-weight:700;font-family:\'DM Sans\',sans-serif">Toggle Fees → '+(s.fees==='Paid'?'Pending':'Paid')+'</button>':'')
    +'<button onclick="gnsiOpenStudentFees('+id+')" style="padding:6px 14px;border-radius:8px;border:1.5px solid #16a34a;background:#dcfce7;color:#16a34a;font-size:11.5px;font-weight:700;cursor:pointer;margin-left:8px">💳 Fee History</button>'
    +'<button onclick="gnsiOpenStudentAdmission('+id+')" style="padding:6px 14px;border-radius:8px;border:1.5px solid #d4a853;background:#fffbeb;color:#92400e;font-size:11.5px;font-weight:700;cursor:pointer;margin-left:8px">📋 Admission</button>'
    +'<span style="margin-left:auto;font-size:11px;color:var(--muted2)">Click outside to close</span>'
    +'</div>'
    +'</div></div>';
}
function renderStudentRows(list){
  if(!list.length){var _nm=students.length===0?'Student data not loaded — check connection and use Sync page.':'No students match your filters.';return '<tr><td colspan="9" style="text-align:center;padding:32px;color:'+(students.length===0?'#d97706':'var(--muted)')+'">'+_nm+'</td></tr>';}
  // PERF: Load house map once via cache (not repeated localStorage parse)
  var studentHouseMap = gnsiGetHouseMap();
  var houseColors = {KOMBIREI:'#e63946',LOKTAK:'#3b78c9',SINGAREI:'#f59e0b',KANGLA:'#16a34a',KOUBRU:'#8b5cf6',SHIROI:'#0891b2',SANGAI:'#ec4899',SANAREI:'#94a3b8',NONGIN:'#2563eb'};
  var houseIcons  = {KOMBIREI:'🔴',LOKTAK:'🔵',SINGAREI:'🟡',KANGLA:'🟢',KOUBRU:'🟣',SHIROI:'🩵',SANGAI:'🩷',SANAREI:'⚪',NONGIN:'🔷'};
  /* PERF: cache stuLoadExtra per render call to avoid repeated localStorage hits */
  var _rowExCache = {};
  function _rowEx(id){ if(!_rowExCache[id]) _rowExCache[id]=(typeof stuLoadExtra==='function'?stuLoadExtra(id):{}); return _rowExCache[id]; }
  return list.map(function(s){
    var ex     = _rowEx(s.id);
    var parent = ex.father || ex.mother || ex.guardian || '';
    var phone  = s.phone || ex.parentPhone || '';
    var assignedHouse = studentHouseMap[String(s.id)] || '';
    var hCol   = assignedHouse ? (houseColors[assignedHouse]||'#7c3aed') : (s.hostel==='Yes'?'#3b78c9':'#94a3b8');
    var hIcon  = assignedHouse ? (houseIcons[assignedHouse]||'🏠') : (s.hostel==='Yes'?'🏠':'--');
    // House cell -- rich display
    // House cell -- show assigned house prominently with inline quick-change dropdown
    var ALL_HOUSES = ['KOMBIREI','LOKTAK','SINGAREI','KANGLA','KOUBRU','SHIROI','SANGAI','SANAREI','NONGIN'];
    var houseSelectOpts = '<option value="">-- Day Scholar --</option>'
      + ALL_HOUSES.map(function(h){
          return '<option value="'+h+'"'+(h===assignedHouse?' selected':'')+'>'+houseIcons[h]+' '+h+'</option>';
        }).join('');
    var houseCell;
    if(assignedHouse){
      houseCell = '<div style="display:flex;flex-direction:column;gap:4px">'
        // Primary house badge
        +'<span style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;font-size:11.5px;font-weight:700;background:'+hCol+'18;color:'+hCol+';border:1.5px solid '+hCol+'44">'
          +hIcon+' '+assignedHouse
        +'</span>'
        // Status row
        +'<div style="display:flex;align-items:center;gap:4px">'
          +'<span style="font-size:9.5px;font-weight:700;color:#16a34a;font-family:\'JetBrains Mono\',monospace;letter-spacing:.04em">🏠 HOSTEL</span>'
        +'</div>'
        // Quick-change dropdown (admin only)
        +(canDo&&canDo('edit','students')
          ?'<select onchange="gnsiHmsChangeHouse('+parseInt(s.id,10)+',this.value);if(typeof showToast===\'function\')showToast(\'House updated\',\'#16a34a\');renderStudentTable&&renderStudentTable()" '
            +'style="font-size:10.5px;border:1px solid '+hCol+'44;border-radius:8px;padding:2px 6px;background:'+hCol+'0a;color:'+hCol+';cursor:pointer;font-family:\'DM Sans\',sans-serif;max-width:130px">'
            +houseSelectOpts
          +'</select>'
          :'')
      +'</div>';
    } else if(s.hostel==='Yes'){
      houseCell = '<div style="display:flex;flex-direction:column;gap:4px">'
        +'<span style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;background:#fff7ed;color:#ea580c;border:1.5px solid #fdba74">⚠ Not Assigned</span>'
        +'<span style="font-size:9.5px;font-weight:700;color:#3b78c9;font-family:\'JetBrains Mono\',monospace;letter-spacing:.04em">🏠 HOSTEL</span>'
        // Quick-assign dropdown
        +(canDo&&canDo('edit','students')
          ?'<select onchange="gnsiHmsChangeHouse('+parseInt(s.id,10)+',this.value);if(typeof showToast===\'function\')showToast(\'House assigned!\',\'#16a34a\');renderStudentTable&&renderStudentTable()" '
            +'style="font-size:10.5px;border:1.5px solid #fdba74;border-radius:8px;padding:2px 6px;background:#fff7ed;color:#ea580c;cursor:pointer;font-family:\'DM Sans\',sans-serif;max-width:130px">'
            +houseSelectOpts
          +'</select>'
          :'<span style="font-size:10px;color:var(--muted)">Contact Admin to assign</span>')
      +'</div>';
    } else {
      houseCell = '<div style="display:flex;flex-direction:column;gap:4px">'
        +'<span style="padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;background:#f1f5f9;color:#64748b;border:1.5px solid #e2e8f0">☀ Day Scholar</span>'
        // Allow admin to assign house even to day scholars (they may board later)
        +(canDo&&canDo('edit','students')
          ?'<select onchange="if(this.value){gnsiHmsChangeHouse('+parseInt(s.id,10)+',this.value);if(typeof showToast===\'function\')showToast(\'House assigned\',\'#16a34a\');}renderStudentTable&&renderStudentTable()" '
            +'style="font-size:10.5px;border:1px solid var(--border);border-radius:8px;padding:2px 6px;background:var(--surface2);color:var(--muted);cursor:pointer;font-family:\'DM Sans\',sans-serif;max-width:130px">'
            +houseSelectOpts
          +'</select>'
          :'')
      +'</div>';
    }
    return '<tr>'
      +'<td style="max-width:0;overflow:hidden"><div style="display:flex;align-items:center;gap:8px">'+(ex.photo?'<img src="'+_gnsiSafePhoto(ex.photo)+'" style="width:28px;height:28px;border-radius:50%;object-fit:cover;border:2px solid var(--border);flex-shrink:0">':avatarHTML(s.name,28))
      +'<div style="min-width:0;overflow:hidden"><div style="font-weight:700;cursor:pointer;color:var(--accent);text-decoration:underline;text-underline-offset:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" onclick="stuViewId='+parseInt(s.id,10)+';render()">'+esc(s.name)+'</div>'
      +(ex.admNo?'<div style="font-size:10.5px;color:var(--muted2);font-family:\'JetBrains Mono\',monospace">'+esc(ex.admNo)+'</div>':'')

      +'</div></div></td>'
      +'<td style="font-family:\'JetBrains Mono\',monospace;font-size:12px;color:var(--muted)">'+(s.roll||'--')+'</td>'
      +'<td><span style="font-weight:600">'+esc(s.cls||'--')+'</span></td>'
      +'<td>'+(function(){ var _fa=(typeof gnsiGetFeeAsgns==='function'?gnsiGetFeeAsgns():[]); var _a=_fa.find(function(x){return String(x.stuId)===String(s.id);}); var _sid=_a&&(_a.subTypeId||''); if(!_sid) return '<span style="color:var(--muted2);font-size:11px">--</span>'; var _courses=(typeof GNSI_COURSES!=='undefined')?GNSI_COURSES:[]; var _cName='',_cIcon='📚',_cColor='#1433a8',_stLabel='',_stIcon=''; var _courseColors={sainik:'#1d4ed8',navodaya:'#15803d',foundation:'#7c3aed',combined:'#b45309',combined_navsai:'#b45309'}; _courses.forEach(function(c){ if(_sid.toLowerCase().indexOf(c.id.toLowerCase())===0){ _cName=c.name;_cIcon=c.icon||'📚';_cColor=_courseColors[c.id]||'#1433a8'; c.subTypes&&c.subTypes.forEach(function(st){if(st.id===_sid){_stLabel=st.label;_stIcon=st.icon||'';}}); } }); if(!_cName) return '<span style="color:var(--muted2);font-size:11px">--</span>'; return '<div style="display:flex;flex-direction:column;gap:3px">'+'<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;padding:3px 8px;border-radius:8px;background:'+_cColor+'18;color:'+_cColor+';border:1px solid '+_cColor+'44">'+_cIcon+' '+esc(_cName)+'</span>'+(_stLabel?'<span style="display:inline-flex;align-items:center;gap:3px;font-size:10px;font-weight:700;padding:2px 7px;border-radius:7px;background:#f1f5f9;color:#475569;border:1px solid #e2e8f0">'+(_stIcon?_stIcon+' ':'')+esc(_stLabel)+'</span>':'')+'</div>'; })()+'</td>'
      +'<td style="max-width:0;overflow:hidden"><div style="font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+(parent?esc(parent):'<span style="color:var(--muted2)">--</span>')+'</div>'
      +(_isAdminOrAccounts()&&phone?'<div style="font-size:11px;color:var(--muted);font-family:\'JetBrains Mono\',monospace">'+esc(phone)+'</div>':'')
      +'</td>'
      +'<td>'+houseCell+'</td>'
      +'<td><span onclick="toggleFees('+parseInt(s.id,10)+')" style="cursor:pointer" title="Click to toggle">'+badge(s.fees,s.fees==='Paid'?'#16a34a':'#dc2626')+'</span></td>'
      +'<td style="font-size:11.5px;color:var(--muted)">'+(s.session||'--')+'</td>'
      +'<td style="white-space:nowrap;vertical-align:middle;padding:8px 10px">'
      +'<div style="display:flex;flex-wrap:wrap;gap:4px;align-items:center">'
      +'<button onclick="stuViewId='+parseInt(s.id,10)+';render()" style="font-size:11px;padding:5px 10px;border-radius:6px;border:1px solid var(--border);background:var(--surface2);cursor:pointer;color:var(--accent);font-weight:700;font-family:\'DM Sans\',sans-serif;white-space:nowrap">👁 View</button>'
      +(_canEditFees()?'<button onclick="gnsiOpenStudentFees('+parseInt(s.id,10)+')" style="font-size:11px;padding:5px 10px;border-radius:6px;border:1px solid #86efac;background:#dcfce7;cursor:pointer;color:#16a34a;font-weight:700;white-space:nowrap">💳 Fee</button>':'')
      +(_isAdminOrArunkumar()?'<button onclick="stuEditId='+parseInt(s.id,10)+';showAddStudent=true;render()" style="font-size:11px;padding:5px 10px;border-radius:6px;border:1px solid var(--accent);background:var(--accent-light);cursor:pointer;color:var(--accent);font-weight:700;white-space:nowrap">✏️ Edit</button>':'')
      +(canDo('del','students')?'<button onclick="removeStudent('+parseInt(s.id,10)+')" style="font-size:11px;padding:5px 8px;border-radius:6px;border:1px solid #fca5a5;background:#fee2e2;cursor:pointer;color:#dc2626;font-weight:700">🗑</button>':'')
      +'</div>'
      +'</td></tr>';
  }).join('');
}
function renderStudentTable(){
  // PERF: debounce rapid keystrokes -- only render after 180ms idle
  if(_stuSearchTimer) clearTimeout(_stuSearchTimer);
  _stuSearchTimer = setTimeout(function(){
    _stuSearchTimer = null;
    stuPage = 0;
    _doRenderStudentTable();
  }, 320);
}
function _doRenderStudentTable(){
  var filtered = getFilteredStudents();
  var tbody    = document.getElementById('stu-tbody');
  var cnt      = document.getElementById('stu-count');
  var pgBar    = document.getElementById('stu-pager');
  // PERF: only render current page slice
  var totalPages = Math.max(1, Math.ceil(filtered.length / STU_PAGE_SIZE));
  if(stuPage >= totalPages) stuPage = totalPages - 1;
  var pageSlice = filtered.slice(stuPage * STU_PAGE_SIZE, (stuPage + 1) * STU_PAGE_SIZE);
  if(tbody) tbody.innerHTML = renderStudentRows(pageSlice);
  if(cnt)   cnt.textContent = filtered.length+' of '+students.length;
  // Render or update pagination bar
  if(pgBar){
    pgBar.style.display = totalPages > 1 ? 'flex' : 'none';
    pgBar.innerHTML = _stuPagerHTML(filtered.length, totalPages);
  }
  // Also refresh mobile list
  var mobList = document.getElementById('stu-mob-list');
  if(mobList) mobList.innerHTML = _renderMobileCards(pageSlice);
}
function _stuPagerHTML(total, totalPages){
  var s = '';
  s += '<button onclick="stuPage=Math.max(0,stuPage-1);_doRenderStudentTable()" '
    + 'style="padding:4px 12px;border-radius:7px;border:1px solid var(--border);background:var(--surface);cursor:pointer;font-weight:700'+(stuPage===0?';opacity:.4;cursor:default':'')+'" '
    + (stuPage===0?'disabled':'')+'>&#8592; Prev</button>';
  for(var i=0;i<totalPages;i++){
    var active = i===stuPage;
    s += '<button onclick="stuPage='+i+';_doRenderStudentTable()" '
      + 'style="padding:4px 10px;border-radius:7px;border:1px solid '+(active?'var(--accent)':'var(--border)')+';background:'+(active?'var(--accent)':'var(--surface)')+';color:'+(active?'#fff':'var(--text)')+';cursor:pointer;font-weight:700;min-width:32px">'+( i+1)+'</button>';
  }
  s += '<button onclick="stuPage=Math.min('+( totalPages-1)+',stuPage+1);_doRenderStudentTable()" '
    + 'style="padding:4px 12px;border-radius:7px;border:1px solid var(--border);background:var(--surface);cursor:pointer;font-weight:700'+(stuPage===totalPages-1?';opacity:.4;cursor:default':'')+'" '
    + (stuPage===totalPages-1?'disabled':'')+'>Next &#8594;</button>';
  s += '<span style="font-size:11px;color:var(--muted);font-family:\'JetBrains Mono\',monospace;margin-left:8px">Page '+(stuPage+1)+' / '+totalPages+' &nbsp;·&nbsp; '+total+' students</span>';
  return s;
}
function getFilteredStudents(){
  var q = (studentSearch||'').toLowerCase();
  var HM_HOUSE_NAMES = ['KOMBIREI','LOKTAK','SINGAREI','KANGLA','KOUBRU','SHIROI','SANGAI','SANAREI','NONGIN'];
  var studentHouseMap = gnsiGetHouseMap();   // PERF: use cache
  var filterByHouse = HM_HOUSE_NAMES.indexOf(stuFilterHostel) !== -1;
  /* PERF: cache extra data per student to avoid repeated localStorage reads */
  var _extraCache = {};
  function _getEx(id){ if(!_extraCache[id]) _extraCache[id] = (typeof stuLoadExtra==='function'?stuLoadExtra(id):{}); return _extraCache[id]; }
  return students.filter(function(s){
    var ex = _getEx(s.id);
    var clsMatch  = stuFilterCls==='All' || s.cls===stuFilterCls;
    var feesMatch = stuFilterFees==='All' || s.fees===stuFilterFees;
    var hostelMatch;
    if(filterByHouse){
      // Filter by specific house assignment
      hostelMatch = (studentHouseMap[String(s.id)] || ex.house || '') === stuFilterHostel;
    } else {
      hostelMatch = stuFilterHostel==='All' || s.hostel===stuFilterHostel;
    }
    var assignedHouse = studentHouseMap[String(s.id)] || ex.house || '';
    var textMatch = !q
      || s.name.toLowerCase().includes(q)
      || (s.roll||'').toLowerCase().includes(q)
      || (s.phone||'').includes(q)
      || (s.cls||'').toLowerCase().includes(q)
      || (ex.father||'').toLowerCase().includes(q)
      || (ex.mother||'').toLowerCase().includes(q)
      || (ex.admNo||'').toLowerCase().includes(q)
      || (ex.parentPhone||'').includes(q)
      || assignedHouse.toLowerCase().includes(q);
    return clsMatch && hostelMatch && feesMatch && textMatch;
  });
}
function toggleAddStudent(){ stuEditId=null; showAddStudent=!showAddStudent; showCsvImport=false; csvImportState=null; render(); }
function addStudent(){
  // Legacy compat -- redirect to saveStu
  saveStu(null);
}
function deleteAllStudents(){
  var _gnsiAllowed=['admin','manager'];
  if(!currentUser||_gnsiAllowed.indexOf(currentUser.role)<0){
    if(typeof showToast==='function')showToast('🔒 Access denied: Delete all students','#dc2626');
    return;
  }

  if(!students.length){showToast('⚠️ No students to delete.','#ea580c');return;}
  var confirmMsg='⚠ DELETE ALL STUDENTS?\n\nThis will permanently remove ALL '+students.length+' students from the register.\nThis action cannot be undone!\n\nType DELETE to confirm:';
  var input=prompt(confirmMsg,'');
  if(input===null)return;
  if(input.trim().toUpperCase()!=='DELETE'){showToast('❌ Confirmation failed. No students were deleted.','#dc2626');return;}
  var deletedIds = students.map(function(s){ return s.id; });
  students=[];
  _stuExtraCache={};   // PERF: clear cache -- all students gone
  /* [SUPABASE-ONLY] Supabase deletes handled below */
  // Delete all from Supabase
  if (_supa && deletedIds.length) {
    _supa.from('students').delete().in('id', deletedIds)
      .then(function(){ if (typeof setSyncStatus === 'function') setSyncStatus('synced'); })
      .catch(function(e){
        (void 0);
        var q = JSON.parse(localStorage.getItem('gnsi_offline_queue') || '[]');
        deletedIds.forEach(function(id){ q.push({type:'delete', table:'students', id:id, ts: Date.now()}); });
        localStorage.setItem('gnsi_offline_queue', JSON.stringify(q));
      });
  } else if (!_supa && deletedIds.length) {
    var q = JSON.parse(localStorage.getItem('gnsi_offline_queue') || '[]');
    deletedIds.forEach(function(id){ q.push({type:'delete', table:'students', id:id, ts: Date.now()}); });
    localStorage.setItem('gnsi_offline_queue', JSON.stringify(q));
    if (typeof showToast === 'function') showToast('📴 Offline -- deletions queued, will sync when online', '#d4a853');
  }
  stuEditId=null;stuViewId=null;showAddStudent=false;
  gnsiMarkLocalSave(20000); // 20s guard -- allows Supabase async deletes to commit before next fetch
  showToast('All students deleted 🗑','#dc2626');
  render();
}
function removeStudent(id){
  var _gnsiAllowed=['admin','manager'];
  if(!currentUser||_gnsiAllowed.indexOf(currentUser.role)<0){
    if(typeof showToast==='function')showToast('🔒 Access denied: Remove student','#dc2626');
    return;
  }

  if(!confirm('Remove this student? This cannot be undone.')) return;
  students = students.filter(function(s){return s.id!==id;});
  delete _stuExtraCache[String(id)];   // PERF: evict from cache

  /* FIX 6 — Orphan cleanup on student delete */
  /* 1. Remove extra data from localStorage and Supabase */
  try { localStorage.removeItem('gnsi_stuex_'+id); } catch(e){}
  if(window._supa){
    var _stuDelSid = (window.TENANT&&window.TENANT.schoolId) ? window.TENANT.schoolId
      : (function(){ try{ var u=JSON.parse(localStorage.getItem('gnsi_jwt_user')||'{}'); return u.schoolId||u.school_id||null; }catch(e){ return null; } })();
    var _stuDelQ = window._supa.from('gnsi_student_extra').delete().eq('student_id', id);
    if (_stuDelSid) _stuDelQ = _stuDelQ.eq('school_id', _stuDelSid);
    _stuDelQ.then(function(){});
    window._supa.from('student_attendance').delete().eq('student_id', id);
  }
  /* 2. Remove attendance keys for this student from flat object */
  Object.keys(attendance).forEach(function(k){
    if(k.indexOf('-T-'+id)>-1 || k.indexOf('-S-'+id)>-1) delete attendance[k];
  });
  try { /* [SUPABASE-ONLY] localStorage write removed: ims_att */ } catch(e){}
  /* 3. Remove fee assignment */
  if(typeof deleteStuFeeAssignment==='function') deleteStuFeeAssignment(id);

  /* Instant delete from Supabase */
  _gnsiInstantPush('students', {id:id}, { isDelete: true });
  if(window._supa){
    window._supa.from('gnsi_student_extra').delete().eq('student_id', id).then(function(){});
    window._supa.from('student_attendance').delete().eq('student_id', id).then(function(){});
  }
  stuEditId=null; stuViewId=null; render();
}
function buildCsvUploadPanel(){
  return '<div class="form-panel" style="border-color:var(--accent);border-style:solid">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">'
    +'<div class="form-title" style="color:var(--accent);margin-bottom:0">📥 Import Students from CSV</div>'
    +'<button class="btn btn-outline" onclick="showCsvImport=false;render()" style="font-size:12px">✕ Close</button>'
    +'</div>'
    +'<div style="background:var(--surface2);border-radius:10px;padding:14px 18px;margin-bottom:16px;border:1px solid var(--border-soft)">'
    +'<div style="font-size:12.5px;font-weight:700;color:var(--text);margin-bottom:6px">📋 CSV Format</div>'
    +'<div style="font-size:12px;color:var(--muted);margin-bottom:10px">Columns in any order -- you will map them after upload.</div>'
    +'<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">'
    +['Name (required)','Roll No','Phone','Class','Hostel (Yes/No)','Fees (Paid/Pending)'].map(function(f){
      var req=f.includes('required');
      return '<span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:'+(req?'var(--accent)':'var(--surface3)')+';color:'+(req?'#fff':'var(--muted)')+';border:1px solid '+(req?'var(--accent)':'var(--border)')+'">'+f+'</span>';
    }).join('')
    +'</div>'
    +'<button class="btn btn-outline" onclick="csvDownloadTemplate()" style="font-size:12px;padding:6px 14px">⬇ Download Sample Template</button>'
    +'</div>'
    +'<div style="border:2px dashed var(--border);border-radius:10px;padding:28px;text-align:center;background:var(--surface2);cursor:pointer" '
    +'onclick="document.getElementById(\'csv-file-input\').click()" '
    +'ondragover="event.preventDefault();this.style.borderColor=\'var(--accent)\'" '
    +'ondragleave="this.style.borderColor=\'var(--border)\'" '
    +'ondrop="event.preventDefault();this.style.borderColor=\'var(--border)\';csvHandleFile(event.dataTransfer.files[0])">'
    +'<div style="font-size:32px;margin-bottom:8px">📂</div>'
    +'<div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:4px">Click or drag & drop CSV</div>'
    +'<div style="font-size:12px;color:var(--muted)">.csv files only</div>'
    +'<input id="csv-file-input" type="file" accept=".csv,text/csv" style="display:none" onchange="csvHandleFile(this.files[0])"/>'
    +'</div></div>';
}
function buildCsvMappingPanel(){
  if(!csvImportState) return '';
  var st = csvImportState;
  var fields=[
    {key:'name',label:'Full Name',required:true},
    {key:'roll',label:'Roll Number',required:false},
    {key:'phone',label:'Phone',required:false},
    {key:'cls',label:'Class',required:false},
    {key:'hostel',label:'Hostel (Yes/No)',required:false},
    {key:'fees',label:'Fees (Paid/Pending)',required:false},
    {key:'billingStartAt',label:'Billing Start Date (override)',required:false,hint:'Leave blank to use enrollment date'}
  ];
  var noneOpt='<option value="">-- Skip --</option>';
  var mappingHTML='<div class="form-grid g3" style="margin-bottom:16px">'
    +fields.map(function(f){
      var mappedHeader=Object.keys(st.mapping).find(function(k){return st.mapping[k]===f.key;});
      var selIdx=mappedHeader!==undefined?st.headers.indexOf(mappedHeader):-1;
      if(selIdx===-1)selIdx=st.headers.findIndex(function(h){var hl=h.toLowerCase().replace(/[^a-z0-9]/g,'');var fk=f.key.replace(/[^a-z0-9]/g,'');return hl===fk||hl.includes(fk);});
      return '<div class="form-group"><label>'+f.label+(f.required?' <span style="color:#dc2626">*</span>':'')+'</label>'
        +'<select onchange="csvUpdateMapping(this,\''+f.key+'\')">'
        +noneOpt
        +st.headers.map(function(h,i){return'<option value="'+i+'"'+(selIdx===i?' selected':'')+'>'+esc(h)+'</option>';}).join('')
        +'</select></div>';
    }).join('')+'</div>';
  var previewRows = st.rows.slice(0,8).map(function(r,i){
    var m=csvMapRow(r,st);
    var warn=!m.name?'<span style="color:#dc2626;font-size:10px">⚠ No name</span>':'';
    return '<tr><td style="text-align:center;font-family:\'JetBrains Mono\',monospace;font-size:11px">'+(i+1)+'</td>'
      +'<td style="font-weight:600">'+(m.name?esc(m.name):warn)+'</td>'
      +'<td style="font-family:\'JetBrains Mono\',monospace;font-size:11px">'+(m.roll||'--')+'</td>'
      +'<td>'+(m.cls||'--')+'</td>'
      +'<td>'+(m.hostel||'--')+'</td>'
      +'<td>'+(m.fees||'--')+'</td>'
      +'<td style="font-family:\'JetBrains Mono\',monospace;font-size:11px">'+(maskPhone(m.phone)||'--')+'</td>'
      +'<td>'+(m.name?'<span style="color:#16a34a;font-size:12px">✓</span>':'<span style="color:#dc2626;font-size:12px">✗</span>')+'</td>'
      +'</tr>';
  }).join('');
  var validCount = st.rows.filter(function(r){return !!(csvMapRow(r,st).name);}).length;
  var dupCount = (function(){
    var names={}; var dups=0;
    st.rows.forEach(function(r){var m=csvMapRow(r,st); if(!m.name)return; if(names[m.name.toLowerCase()])dups++; names[m.name.toLowerCase()]=true;});
    return dups;
  })();
  var modeHTML='<div style="display:flex;gap:10px;margin-bottom:16px">'
    +'<label style="display:flex;align-items:center;gap:7px;padding:9px 14px;border-radius:8px;border:1.5px solid '+(st.mode==='add'?'var(--accent)':'var(--border)')+';background:'+(st.mode==='add'?'var(--accent-light)':'var(--surface2)')+';cursor:pointer">'
    +'<input type="radio" name="csv-mode" value="add" '+(st.mode==='add'?'checked':'')+' onchange="csvImportState.mode=\'add\';render()"/> Add to existing</label>'
    +'<label style="display:flex;align-items:center;gap:7px;padding:9px 14px;border-radius:8px;border:1.5px solid '+(st.mode==='replace'?'#dc2626':'var(--border)')+';background:'+(st.mode==='replace'?'#fef2f2':'var(--surface2)')+';cursor:pointer">'
    +'<input type="radio" name="csv-mode" value="replace" '+(st.mode==='replace'?'checked':'')+' onchange="if(confirm(\'⚠️ DANGER: This will permanently DELETE all '+students.length+' existing students and replace them. Are you sure?\')){csvImportState.mode=\'replace\';render();}else{this.checked=false;csvImportState.mode=\'add\';render();}"/> ⚠️ Replace all students</label>'
    +'</div>';
  var classNames2=getClassNames();
  var defaultsHTML='<div style="background:var(--surface2);border:1px solid var(--border-soft);border-radius:10px;padding:14px 18px;margin-bottom:16px">'
    +'<div style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px">Default values for empty cells</div>'
    +'<div class="form-grid g3">'
    +'<div class="form-group"><label>Default Class</label>'
    +'<select id="csv-def-cls"><option value="">-- None --</option>'+classNames2.map(function(c){return'<option>'+esc(c)+'</option>';}).join('')+'</select></div>'
    +'<div class="form-group"><label>Default Hostel</label>'
    +'<select id="csv-def-hostel"><option value="No">No</option><option value="Yes">Yes</option></select></div>'
    +'<div class="form-group"><label>Default Fees</label>'
    +'<select id="csv-def-fees"><option value="Pending">Pending</option><option value="Paid">Paid</option></select></div>'
    +'</div></div>';
  return '<div class="form-panel" style="border-color:var(--accent);border-style:solid">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">'
    +'<div class="form-title" style="color:var(--accent);margin-bottom:0">📥 Map CSV Columns ('+st.rows.length+' rows found)</div>'
    +'<button class="btn btn-outline" onclick="showCsvImport=false;csvImportState=null;render()" style="font-size:12px">✕ Close</button>'
    +'</div>'
    +'<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px">'
    +'<div style="padding:10px 18px;border-radius:10px;background:#f0fdf4;border:1px solid #86efac;text-align:center"><div style="font-size:22px;font-weight:800;color:#16a34a">'+validCount+'</div><div style="font-size:9px;color:#16a34a;font-weight:700;text-transform:uppercase;letter-spacing:.08em;font-family:\'JetBrains Mono\',monospace">Valid</div></div>'
    +(dupCount?'<div style="padding:10px 18px;border-radius:10px;background:#fef9c3;border:1px solid #fde047;text-align:center"><div style="font-size:22px;font-weight:800;color:#ca8a04">'+dupCount+'</div><div style="font-size:9px;color:#ca8a04;font-weight:700;text-transform:uppercase;letter-spacing:.08em;font-family:\'JetBrains Mono\',monospace">Duplicates</div></div>':'')
    +'<div style="padding:10px 18px;border-radius:10px;background:var(--surface2);border:1px solid var(--border);text-align:center"><div style="font-size:22px;font-weight:800;color:var(--muted)">'+st.headers.length+'</div><div style="font-size:9px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.08em;font-family:\'JetBrains Mono\',monospace">Columns</div></div>'
    +'</div>'
    +'<div style="font-size:12.5px;font-weight:700;color:var(--text);margin-bottom:10px">1. Map your CSV columns to student fields:</div>'
    +mappingHTML
    +defaultsHTML
    +'<div style="font-size:12.5px;font-weight:700;color:var(--text);margin-bottom:10px">2. Import mode:</div>'
    +modeHTML
    +'<div style="font-size:12.5px;font-weight:700;color:var(--text);margin-bottom:10px">3. Preview (first 8 rows):</div>'
    +'<div style="overflow-x:auto;margin-bottom:18px;border-radius:9px;border:1px solid var(--border-soft)"><table style="min-width:600px"><thead><tr><th style="width:40px;text-align:center">#</th><th>Name</th><th>Roll</th><th>Class</th><th>Hostel</th><th>Fees</th><th>Phone</th><th></th></tr></thead><tbody>'+previewRows+'</tbody></table></div>'
    +(dupCount&&st.mode==='add'?'<div style="background:#fef9c3;border:1px solid #fde047;border-radius:9px;padding:10px 14px;margin-bottom:14px;font-size:12.5px;color:#92400e">⚠ <b>'+dupCount+' duplicate name(s)</b> found. They will still be imported.</div>':'')
    +(st.mode==='replace'?'<div style="background:#fef2f2;border:1.5px solid #dc2626;border-radius:9px;padding:12px 16px;margin-bottom:14px;font-size:13px;color:#dc2626;display:flex;align-items:center;gap:10px"><span style="font-size:20px">🚨</span><div><b>DANGER — Replace Mode Active</b><div style="font-size:12px;margin-top:2px">All <b>'+students.length+'</b> existing students will be permanently deleted and replaced with the '+st.rows.length+' imported rows. This cannot be undone.</div></div><button onclick="csvImportState.mode=\'add\';render()" style="margin-left:auto;padding:5px 12px;border-radius:7px;border:1.5px solid #dc2626;background:#fff;color:#dc2626;font-size:11px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif;white-space:nowrap">↩ Switch to Add</button></div>':'')
    +'<div style="display:flex;gap:10px">'
    +'<button class="btn btn-primary" onclick="csvDoImport()" '+(validCount===0?'disabled style="flex:1;padding:12px;font-size:14px;opacity:.45;cursor:not-allowed"':'style="flex:1;padding:12px;font-size:14px"')+'>✓ Import '+validCount+' Student'+(validCount!==1?'s':'')+'</button>'
    +'<button class="btn btn-outline" onclick="csvImportState=null;render()">← Re-upload</button>'
    +'</div></div>';
}
// ══════════════════════════════════════════════════════════════
// SESSIONS MODULE
// ══════════════════════════════════════════════════════════════
function loadSessions(){
  try{var s=localStorage.getItem('gnsi_sessions');if(s)return JSON.parse(s);}catch(e){}
  return [{id:'s1',label:'2024-25',active:false},{id:'s2',label:'2025-26',active:true}];
}
function saveSessions(list){localStorage.setItem('gnsi_sessions',JSON.stringify(list));if(typeof gnsiKVPush==='function')gnsiKVPush('gnsi_sessions',list);}
var sessionFormOpen = false;
var promoteModal    = false;
function renderSessions(){
  var sessions = loadSessions();
  var active   = sessions.find(function(s){return s.active;});
  
  var stats = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px;margin-bottom:24px">'
    +'<div class="stat-card" style="--c:#1433a8"><div class="stat-label">Total Sessions</div><div class="stat-val">'+sessions.length+'</div></div>'
    +'<div class="stat-card" style="--c:#16a34a"><div class="stat-label">Active Session</div><div class="stat-val" style="font-size:24px">'+(active?esc(active.label):'None')+'</div></div>'
    +'<div class="stat-card" style="--c:#f59e0b"><div class="stat-label">Total Students</div><div class="stat-val">'+students.length+'</div><div class="stat-sub">'+(active ? students.filter(function(s){return s.session===active.label;}).length+' in current session' : '')+'</div></div>'
    +'</div>';
  
  var addForm = '';
  if(sessionFormOpen){
    addForm = '<div class="form-panel" style="border-color:#1433a8;margin-bottom:20px">'
      +'<div class="form-title" style="color:var(--accent)">📅 Add New Academic Session</div>'
      +'<div class="form-grid g3" style="margin-bottom:14px">'
      +'<div class="form-group"><label>Session Label *</label><input id="sess-label" placeholder="e.g. 2026-27" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)"/></div>'
      +'<div class="form-group"><label>Start Date</label><input type="date" id="sess-start" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)"/></div>'
      +'<div class="form-group"><label>End Date</label><input type="date" id="sess-end" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)"/></div>'
      +'<div class="form-group"><label>Remarks</label><input id="sess-rem" placeholder="Optional notes" style="width:100%;padding:9px 13px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)"/></div>'
      +'</div>'
      +'<div class="form-actions"><button class="btn btn-primary" onclick="addSession()">✓ Add Session</button><button class="btn btn-outline" onclick="sessionFormOpen=false;render()">Cancel</button></div>'
      +'</div>';
  }
  
  var sesCards = sessions.map(function(ss){
    var stuCount = students.filter(function(s){return s.session===ss.label;}).length;
    return '<div class="card" style="margin-bottom:12px;border-left:4px solid '+(ss.active?'var(--accent)':'var(--border)')+'">'
      +'<div style="padding:16px 22px;display:flex;align-items:center;gap:16px;flex-wrap:wrap">'
      +'<div style="flex:1">'
      +'<div style="display:flex;align-items:center;gap:10px">'
      +'<div style="font-family:\'Playfair Display\',serif;font-size:19px;font-weight:700;color:var(--text)">'+esc(ss.label)+'</div>'
      +(ss.active?'<span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:#dcfce7;color:#16a34a;border:1px solid #86efac">✓ Active</span>':'<span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:var(--surface3);color:var(--muted);border:1px solid var(--border)">Inactive</span>')
      +'</div>'
      +'<div style="font-size:12.5px;color:var(--muted);margin-top:4px">'+stuCount+' student'+(stuCount!==1?'s':'')+' enrolled'+(ss.start?' &nbsp;·&nbsp; '+esc(ss.start)+' to '+esc(ss.end||'--'):'')+'</div>'
      +(ss.remarks?'<div style="font-size:12px;color:var(--muted2);font-style:italic;margin-top:2px">'+esc(ss.remarks)+'</div>':'')
      +'</div>'
      +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
      +(!ss.active?'<button onclick="setActiveSession(\''+ss.id+'\')" style="padding:7px 14px;border-radius:8px;background:var(--accent-light);color:var(--accent);border:1px solid var(--accent);font-size:12px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">✓ Set Active</button>':'')
      +'<button onclick="promoteStudentsToSession(\''+esc(ss.label)+'\')" style="padding:7px 14px;border-radius:8px;background:#f0fdf4;color:#16a34a;border:1px solid #86efac;font-size:12px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">⬆ Assign Students</button>'
      +(_isAdminOrArunkumar()?'<button onclick="deleteSession(\''+ss.id+'\')" class="btn-danger-sm">🗑</button>':'')
      +'</div></div></div>';
  }).join('');
  
  var promoteHTML = promoteModal ? buildPromoteModal() : '';
  return promoteHTML
    +'<div style="margin-bottom:20px"><div style="font-family:\'JetBrains Mono\',monospace;font-size:11px;color:var(--muted);letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px">GNSI -- ACADEMIC</div>'
    +'<div style="font-size:22px;font-family:\'Cormorant Garamond\',serif;font-weight:700;color:var(--accent)">Academic Sessions</div>'
    +'<div style="font-size:12.5px;color:var(--muted);margin-top:4px">Manage academic years, assign students to sessions, and promote batches.</div>'
    +'</div>'
    + stats
    +'<div style="display:flex;gap:10px;margin-bottom:16px">'
    +'<button class="btn btn-primary" onclick="sessionFormOpen=!sessionFormOpen;render()">+ New Session</button>'
    +'<button class="btn btn-outline" onclick="promoteModal=true;render()" style="color:#8b5cf6;border-color:#c4b5fd">⬆ Bulk Promote Students</button>'
    +'</div>'
    + addForm + sesCards;
}
function addSession(){
  var _gnsiAllowed=['admin','manager'];
  if(!currentUser||_gnsiAllowed.indexOf(currentUser.role)<0){
    if(typeof showToast==='function')showToast('🔒 Access denied: Add session','#dc2626');
    return;
  }

  var label = ((document.getElementById('sess-label')||{}).value||'').trim();
  if(!label){showToast('⚠️ Session label is required (e.g. 2026-27).','#ea580c');return;}
  var list = loadSessions();
  if(list.find(function(s){return s.label===label;})){showToast('⚠️ Session "'+label+'" already exists.','#ea580c');return;}
  list.push({
    id:'s'+Date.now(),
    label:label,
    start:((document.getElementById('sess-start')||{}).value||''),
    end:((document.getElementById('sess-end')||{}).value||''),
    remarks:((document.getElementById('sess-rem')||{}).value||'').trim(),
    active:false
  });
  saveSessions(list);sessionFormOpen=false;showToast('Session added ✅','#1433a8');render();
}
function setActiveSession(id){
  var list=loadSessions().map(function(s){return Object.assign({},s,{active:s.id===id});});
  saveSessions(list);showToast('Active session updated ✅','#16a34a');render();
}
function deleteSession(id){
  var _gnsiAllowed=['admin'];
  if(!currentUser||_gnsiAllowed.indexOf(currentUser.role)<0){
    if(typeof showToast==='function')showToast('🔒 Access denied: Delete session','#dc2626');
    return;
  }

  var list=loadSessions();
  var s=list.find(function(x){return x.id===id;});
  if(s&&s.active){showToast('⚠️ Cannot delete the active session.','#ea580c');return;}
  if(!confirm('Delete this session?'))return;
  saveSessions(list.filter(function(x){return x.id!==id;}));render();
}
function promoteStudentsToSession(label){
  var fromCls=prompt('Promote students FROM which class?\n(Leave blank to assign ALL unassigned students to "'+label+'")\nClasses: '+[...new Set(students.map(function(s){return s.cls;}))].join(', '),'');
  if(fromCls===null)return;
  var count=0;
  var _changed=[];
  students=students.map(function(s){
    if(!fromCls.trim()||s.cls===fromCls.trim()){s=Object.assign({},s,{session:label});count++;_changed.push(s);}
    return s;
  });
  /* Bulk push all changed rows to Supabase */
  _changed.forEach(function(s){
    _gnsiInstantPush('students',{id:s.id,name:s.name,roll_no:s.roll||null,phone:s.phone||null,
      is_boarder:s.hostel==='Yes',status:'Active',class_id:CLASS_ID_MAP[s.cls]||null,session:label});
  });
  showToast(count+' student'+(count!==1?'s':'')+' assigned to '+label+' ✅','#8b5cf6');render();
}
function buildPromoteModal(){
  var sessions=loadSessions();
  return '<div style="position:fixed;inset:0;background:rgba(8,15,38,.55);z-index:300;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)" onclick="if(event.target===this){promoteModal=false;render()}">'
    +'<div style="background:var(--surface);border-radius:16px;padding:28px;width:520px;max-width:95vw;box-shadow:var(--shadow-lg)" onclick="event.stopPropagation()">'
    +'<div style="font-family:\'Playfair Display\',serif;font-size:19px;font-weight:700;color:var(--text);margin-bottom:20px">⬆ Bulk Promote / Move Students</div>'
    +'<div class="form-grid g2" style="margin-bottom:16px">'
    +'<div class="form-group"><label>From Class</label><select id="promo-from"><option value="">All Classes</option>'+[...new Set(students.map(function(s){return s.cls;}))].map(function(c){return'<option>'+esc(c)+'</option>';}).join('')+'</select></div>'
    +'<div class="form-group"><label>To Class</label><select id="promo-to"><option value="">Keep Same</option>'+getClassNames().map(function(c){return'<option>'+esc(c)+'</option>';}).join('')+'</select></div>'
    +'<div class="form-group"><label>Assign to Session</label><select id="promo-sess"><option value="">Keep Same</option>'+sessions.map(function(ss){return'<option>'+esc(ss.label)+'</option>';}).join('')+'</select></div>'
    +'<div class="form-group"><label>Fees Reset to</label><select id="promo-fees"><option value="">Keep Same</option><option>Pending</option><option>Paid</option></select></div>'
    +'</div>'
    +'<div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:9px;padding:10px 14px;margin-bottom:18px;font-size:12.5px;color:#1e40af">ℹ️ This will update all matching students at once. Only selected fields will change.</div>'
    +'<div style="display:flex;gap:10px">'
    +'<button class="btn btn-primary" style="flex:1" onclick="doBulkPromote()">⬆ Apply Promotion</button>'
    +'<button class="btn btn-outline" onclick="promoteModal=false;render()">Cancel</button>'
    +'</div></div></div>';
}
function doBulkPromote(){
  var fromCls  = (document.getElementById('promo-from')||{value:''}).value;
  var toCls    = (document.getElementById('promo-to')||{value:''}).value;
  var toSess   = (document.getElementById('promo-sess')||{value:''}).value;
  var toFees   = (document.getElementById('promo-fees')||{value:''}).value;
  var count=0;
  students=students.map(function(s){
    if(fromCls&&s.cls!==fromCls) return s;
    var upd={};
    if(toCls)  upd.cls=toCls;
    if(toSess) upd.session=toSess;
    if(toFees) upd.fees=toFees;
    count++;
    return Object.assign({},s,upd);
  });
  /* Bulk push all promoted students to Supabase */
  students.filter(function(s){
    return (!fromCls||s.cls===(toCls||fromCls))&&(!toSess||s.session===toSess);
  }).forEach(function(s){
    _gnsiInstantPush('students',{id:s.id,name:s.name,roll_no:s.roll||null,phone:s.phone||null,
      is_boarder:s.hostel==='Yes',status:'Active',class_id:CLASS_ID_MAP[s.cls]||null,session:s.session||null});
  });
  promoteModal=false;showToast(count+' student'+(count!==1?'s':'')+' promoted ✅','#8b5cf6');render();
}
// ══════════════════════════════════════════════════════════════
// ADMISSIONS MODULE
// Full application workflow: Applied → Reviewed → Admitted → Enrolled
// ══════════════════════════════════════════════════════════════
function loadAdmApps(){
  try{
    var s = localStorage.getItem('gnsi_adm_apps');
    if(s){
      var arr = JSON.parse(s);
      if(Array.isArray(arr) && arr.length > 0) return arr;
    }
  }catch(e){}
  // Fallback: try to rebuild a minimal list from the index
  try {
    var idx = localStorage.getItem('gnsi_adm_index');
    if(idx){
      var idxArr = JSON.parse(idx);
      if(Array.isArray(idxArr) && idxArr.length > 0){
        // Rebuild full records from gnsi_stuex_ data where possible
        var rebuilt = idxArr.map(function(entry){
          var extra = {};
          try{ extra = JSON.parse(localStorage.getItem('gnsi_stuex_'+(entry._stuId||''))||'{}'); }catch(e2){}
          return Object.assign({}, entry, {
            admNo:      extra.admNo     || '',
            dob:        extra.dob       || '',
            gender:     extra.gender    || '',
            blood:      extra.blood     || '',
            father:     extra.father    || '',
            mother:     extra.mother    || '',
            phone:      extra.parentPhone || '',
            address:    extra.address   || '',
            category:   extra.category  || '',
            prevSchool: extra.prevSchool || '',
            hostel:     'No'
          });
        });
        (void 0);
        localStorage.setItem('gnsi_adm_apps', JSON.stringify(rebuilt));if(typeof gnsiKVPush==='function')gnsiKVPush('gnsi_adm_apps',rebuilt);
        return rebuilt;
      }
    }
  }catch(e3){}
  return[];
}
function saveAdmApps(list){
  localStorage.setItem('gnsi_adm_apps', JSON.stringify(list));
  localStorage.setItem('gnsi_kv_ts_gnsi_adm_apps', new Date().toISOString());
  if (typeof gnsiKVPush === 'function') gnsiKVPush('gnsi_adm_apps', list);
  // RELIABILITY FIX: also push a compact per-student summary key so
  // each record survives independently even if the full list KV row is lost.
  // gnsi_adm_index = lightweight array of {id, name, stuId, status} for fast lookup
  try {
    var _idx = list.map(function(a){
      return { id: a.id, name: a.name, status: a.status,
               _stuId: a._stuId || null, _fromStudents: !!a._fromStudents,
               session: a.session || '', cls: a.cls || '' };
    });
    localStorage.setItem('gnsi_adm_index', JSON.stringify(_idx));
    if (typeof gnsiKVPush === 'function') gnsiKVPush('gnsi_adm_index', _idx);
  } catch(e) {}
}
function admNextId(arr){if(!arr.length)return 1;var nums=arr.map(function(x){return parseInt(x.id,10)||0}).filter(function(n){return !isNaN(n)});return nums.length?Math.max.apply(null,nums)+1:1;}
function admDate(){return new Date().toISOString().split('T')[0];}
function admFmt(d){try{return new Date(d+' ').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});}catch(e){return d||'--';}}
var admFormOpen  = false;
var admEditId    = null;
var admViewId    = null;
var admFilterStatus = 'All';
var admSearch    = '';
var ADM_STATUSES = ['Applied','Under Review','Admitted','Enrolled','Rejected','Waitlisted'];
var ADM_DOCS = ['Birth Certificate','Transfer Certificate','Mark Sheet','Passport Photo','Aadhar Card','Medical Certificate','Character Certificate'];
function renderScholarship(){
  var isAdm=currentUser&&(currentUser.role==='admin'||currentUser.role==='manager');
  var recs=_scholLoad();
  var STATUS=['Applied','Approved','Disbursed','Rejected'];
  if(_scholEdit!==null){
    var r=_scholEdit==='new'?{}:recs.find(function(x){return x.id===_scholEdit;})||{};
    var stuOpts=students.map(function(s){return'<option value="'+esc(s.name)+'">'+esc(s.name)+'</option>';}).join('');
    return '<button onclick="_scholEdit=null;render()" class="btn btn-outline" style="margin-bottom:16px">\u2190 Back</button>'
      +'<div class="card"><div class="card-head"><span class="card-title">\ud83c\udf93 '+(_scholEdit==='new'?'Add Scholarship':'Edit Scholarship')+'</span></div>'
      +'<div style="padding:20px"><div class="form-grid g2">'
      +'<div class="form-group"><label>Student *</label><input id="sch-stu" list="sch-stu-list" value="'+esc(r.student||'')+'" placeholder="Student name"/><datalist id="sch-stu-list">'+stuOpts+'</datalist></div>'
      +'<div class="form-group"><label>Scholarship Name *</label><input id="sch-name" value="'+esc(r.name||'')+'" placeholder="e.g. NVS Merit Scholarship"/></div>'
      +'<div class="form-group"><label>Amount (\u20b9)</label><input id="sch-amt" type="number" value="'+esc(r.amount||'')+'" placeholder="e.g. 5000"/></div>'
      +'<div class="form-group"><label>Academic Year</label><input id="sch-yr" value="'+esc(r.year||'')+'" placeholder="e.g. 2025-26"/></div>'
      +'<div class="form-group"><label>Awarding Body</label><input id="sch-body" value="'+esc(r.body||'')+'" placeholder="e.g. Govt. of Manipur"/></div>'
      +'<div class="form-group"><label>Application Date</label><input id="sch-appdate" type="date" value="'+esc(r.appDate||new Date().toISOString().split('T')[0])+'"/></div>'
      +'<div class="form-group"><label>Status</label><select id="sch-status">'+STATUS.map(function(s){return'<option'+(r.status===s?' selected':'')+'>'+s+'</option>';}).join('')+'</select></div>'
      +'<div class="form-group"><label>Disbursed Date</label><input id="sch-disdate" type="date" value="'+esc(r.disbursedDate||'')+'"/></div>'
      +'<div class="form-group" style="grid-column:1/-1"><label>Remarks</label><input id="sch-rem" value="'+esc(r.remarks||'')+'" placeholder="Notes, conditions..."/></div>'
      +'</div><button class="btn btn-primary" onclick="gnsiSaveSchol()" style="margin-top:14px">\ud83d\udcbe Save</button>'
      +'</div></div>';
  }
  var filtered=recs.filter(function(r){
    var q=_scholSearch.toLowerCase();
    return !q||(r.student||'').toLowerCase().includes(q)||(r.name||'').toLowerCase().includes(q);
  }).sort(function(a,b){return(b.appDate||'').localeCompare(a.appDate||'');});
  var totDisbursed=recs.filter(function(r){return r.status==='Disbursed';}).reduce(function(acc,r){return acc+(parseFloat(r.amount)||0);},0);
  var rows=filtered.map(function(r){
    var stCol=r.status==='Disbursed'?'#16a34a':r.status==='Approved'?'#2563eb':r.status==='Rejected'?'#dc2626':'#c9870a';
    return'<tr>'
      +'<td><b>'+esc(r.student||'\u2014')+'</b></td>'
      +'<td>'+esc(r.name||'\u2014')+'</td>'
      +'<td>'+esc(r.body||'\u2014')+'</td>'
      +'<td style="text-align:right;font-weight:700">\u20b9'+(r.amount?Number(r.amount).toLocaleString('en-IN'):'\u2014')+'</td>'
      +'<td>'+esc(r.year||'\u2014')+'</td>'
      +'<td><span style="color:'+stCol+';font-weight:700;font-size:11px">'+esc(r.status||'Applied')+'</span></td>'
      +(isAdm?'<td><button onclick="_scholEdit=\''+parseInt(r.id,10)+'\';render()" style="background:var(--accent-light);color:var(--accent);border:none;border-radius:6px;padding:3px 9px;cursor:pointer;font-size:11px;font-weight:700;margin-right:4px">\u270f\ufe0f</button><button onclick="gnsiDelSchol(\''+parseInt(r.id,10)+'\')" style="background:#fef2f2;color:#dc2626;border:none;border-radius:6px;padding:3px 9px;cursor:pointer;font-size:11px;font-weight:700">\ud83d\uddd1\ufe0f</button></td>':'')
      +'</tr>';
  }).join('');
  return '<div class="card" style="margin-bottom:12px">'
    +'<div style="display:flex;gap:12px;padding:16px 20px;flex-wrap:wrap">'
    +'<div style="flex:1;background:var(--accent-light);border-radius:10px;padding:12px 16px;min-width:130px"><div style="font-size:11px;color:var(--muted)">Total Disbursed</div><div style="font-size:20px;font-weight:800;color:var(--accent)">\u20b9'+totDisbursed.toLocaleString('en-IN')+'</div></div>'
    +'<div style="flex:1;background:#f0fdf4;border-radius:10px;padding:12px 16px;min-width:130px"><div style="font-size:11px;color:var(--muted)">Disbursed Count</div><div style="font-size:20px;font-weight:800;color:#16a34a">'+recs.filter(function(r){return r.status==='Disbursed';}).length+'</div></div>'
    +'<div style="flex:1;background:#eff6ff;border-radius:10px;padding:12px 16px;min-width:130px"><div style="font-size:11px;color:var(--muted)">Pending/Applied</div><div style="font-size:20px;font-weight:800;color:#2563eb">'+recs.filter(function(r){return r.status==='Applied'||r.status==='Approved';}).length+'</div></div>'
    +'</div>'
    +'<div class="card-head" style="border-top:1px solid var(--border)"><span class="card-title">\ud83c\udf93 Scholarship Records</span>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
    +(isAdm?'<button onclick="_scholEdit=\'new\';render()" class="btn btn-primary">+ Add Record</button>':'')
    +'<button onclick="gnsiScholPrint()" class="btn btn-outline" style="font-size:12px">\ud83d\udda8 Print</button>'
    +'<button onclick="gnsiScholExport()" class="btn btn-outline" style="font-size:12px">\u2b07 Excel</button>'
    +'</div></div>'
    +'<div style="padding:10px 16px"><div class="search-wrap" style="max-width:340px"><span class="search-icon">\ud83d\udd0d</span><input placeholder="Search student, scholarship..." value="'+esc(_scholSearch)+'" oninput="_scholSearch=this.value;_debouncedRenderSchol()" style="width:100%"/></div></div>'
    +'<div style="overflow-x:auto"><table><thead><tr><th>Student</th><th>Scholarship</th><th>Body</th><th>Amount</th><th>Year</th><th>Status</th>'+(isAdm?'<th>Actions</th>':'')+'</tr></thead>'
    +'<tbody>'+(rows||'<tr><td colspan="7" style="padding:40px;text-align:center;color:var(--muted)">No scholarship records.</td></tr>')+'</tbody></table></div></div>';
}
function gnsiScholPrint(){
  var recs=_scholLoad().sort(function(a,b){return(b.appDate||'').localeCompare(a.appDate||'');});
  var total=recs.filter(function(r){return r.status==='Disbursed';}).reduce(function(a,r){return a+(parseFloat(r.amount)||0);},0);
  var rows=recs.map(function(r,i){
    var c=r.status==='Disbursed'?'#16a34a':r.status==='Approved'?'#1433a8':r.status==='Rejected'?'#dc2626':'#555';
    return '<tr><td style="text-align:center">'+(i+1)+'</td><td><b>'+esc(r.student||'—')+'</b></td>'
      +'<td>'+esc(r.name||'—')+'</td><td>'+esc(r.body||'—')+'</td>'
      +'<td style="text-align:right">₹'+(r.amount?Number(r.amount).toLocaleString('en-IN'):'—')+'</td>'
      +'<td>'+esc(r.year||'—')+'</td>'
      +'<td style="color:'+c+';font-weight:700">'+esc(r.status||'—')+'</td>'
      +'<td>'+esc(r.disbursedDate||'—')+'</td><td>'+esc(r.remarks||'—')+'</td></tr>';
  }).join('');
  var body='<div class="gnsi-pg-hdr"><div class="gnsi-inst">'+(window.TENANT?window.TENANT.name+' · '+window.TENANT.city:'Guidance Navodaya & Sainik Institute · Khangabok')+'</div>'
    +'<div class="gnsi-pg-title">🎓 Scholarship Register</div>'
    +'<div class="gnsi-pg-sub">Printed: '+new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})
    +' · Total Disbursed: ₹'+total.toLocaleString('en-IN')+'</div></div>'
    +'<table><thead><tr><th style="width:26px">#</th><th>Student</th><th>Scholarship</th><th>Body</th><th style="width:70px;text-align:right">Amount</th>'
    +'<th style="width:60px">Year</th><th style="width:70px">Status</th><th style="width:80px">Disbursed</th><th>Remarks</th></tr></thead><tbody>'+rows+'</tbody></table>';
  gnsiPrintWindow('Scholarship Register — GNSI', body, false);
}
function gnsiScholExport(){
  showToast('⏳ Preparing Scholarships CSV…','#2563eb');

  var recs=_scholLoad().sort(function(a,b){return(b.appDate||'').localeCompare(a.appDate||'');});
  var rows=[['GNSI — Scholarship Register'],['Exported: '+new Date().toLocaleString('en-IN')],[]
    ,['#','Student','Scholarship Name','Awarding Body','Amount (₹)','Year','Applied Date','Status','Disbursed Date','Remarks']];
  recs.forEach(function(r,i){rows.push([i+1,r.student||'',r.name||'',r.body||'',r.amount||0,r.year||'',r.appDate||'',r.status||'',r.disbursedDate||'',r.remarks||'']);});
    showToast('✅ Scholarships CSV ready — '+(recs.length)+' rows','#16a34a');
  gnsiExportExcel('Scholarships_'+new Date().toISOString().slice(0,10)+'.xlsx',[{name:'Scholarships',rows:rows,cols:[{wch:4},{wch:22},{wch:28},{wch:22},{wch:10},{wch:8},{wch:12},{wch:12},{wch:12},{wch:25}]}]);
}
function gnsiSaveSchol(){
  var recs=_scholLoad();
  var stu=((document.getElementById('sch-stu')||{}).value||'');
  var name=((document.getElementById('sch-name')||{}).value||'');
  if(!stu.trim()||!name.trim()){showToast('Student and scholarship name required','#dc2626');return;}
  var rec={
    id:_scholEdit==='new'?Date.now():_scholEdit,
    student:stu.trim(),name:name.trim(),
    amount:(((document.getElementById('sch-amt')||{}).value||'').trim()),
    year:(((document.getElementById('sch-yr')||{}).value||'').trim()),
    body:(((document.getElementById('sch-body')||{}).value||'').trim()),
    appDate:(((document.getElementById('sch-appdate')||{}).value||'').trim()),
    status:((document.getElementById('sch-status')||{}).value||'Applied'),
    disbursedDate:(((document.getElementById('sch-disdate')||{}).value||'').trim()),
    remarks:(((document.getElementById('sch-rem')||{}).value||'').trim()),
    savedBy:currentUser?currentUser.name:'',savedAt:new Date().toISOString()
  };
  if(_scholEdit==='new'){recs.push(rec);}else{var idx=recs.findIndex(function(x){return x.id===_scholEdit;});if(idx>=0)recs[idx]=rec;else recs.push(rec);}
  _scholSave(recs);_scholEdit=null;render();showToast('Scholarship record saved','#16a34a');
}
function gnsiDelSchol(id){
  if(!confirm('Delete this scholarship record?'))return;
  _scholSave(_scholLoad().filter(function(x){return x.id!==id;}));render();showToast('Record deleted','#64748b');
}
/* ══════════════════════════════════════════════════════════════
   █  ALUMNI REGISTER
   ══════════════════════════════════════════════════════════════ */
var _alumniEdit=null,_alumniSearch='';
function _alumniLoad(){return gnsiLoad('gnsi_alumni')||[];}
function _alumniSave(d){gnsiSave('gnsi_alumni',d);}
