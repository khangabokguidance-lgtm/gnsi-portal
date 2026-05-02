/* GNSI PORTAL — modules/timetable.js
   Pages: timetable, doubttt
   DEPENDS ON: core/utils.js, core/state.js */

function renderTimetable(){
  getTTCols(); // refresh TT_COLS from localStorage
  var periods=loadTTPeriods();
  var headerRow='<tr>'
    +'<th style="width:145px;background:var(--accent);position:sticky;left:0;z-index:2;color:#fff">Time (Mon–Sat)</th>'
    +TT_COLS.map(function(c){
      return '<th style="text-align:center;min-width:130px;background:'+c.color+';color:#fff;font-size:12px;position:relative;padding:10px 30px 10px 10px">'
        +esc(c.label)
        +'<button onclick="ttColEdit(\''+c.key+'\')" title="Rename/recolour" style="position:absolute;top:4px;right:22px;background:rgba(255,255,255,.25);border:none;border-radius:4px;width:17px;height:17px;cursor:pointer;font-size:9px;color:#fff;line-height:17px;text-align:center">&#9998;</button>'
        +(_isAdminOrArunkumar()?'<button onclick="ttColRemove(\''+c.key+'\')" title="Remove column" style="position:absolute;top:4px;right:4px;background:rgba(255,255,255,.25);border:none;border-radius:4px;width:17px;height:17px;cursor:pointer;font-size:9px;color:#fff;line-height:17px;text-align:center">&#10005;</button>':'')
      +'</th>';
    }).join('')
    +'<th style="width:80px;background:var(--accent);color:#fff;text-align:center">Rows</th>'
  +'</tr>';
  var bodyRows=periods.map(function(p,pi){
    if(p.isBreak){
      return '<tr style="background:var(--surface2)" id="ttrow-'+p.id+'">'
        +'<td style="font-family:\'JetBrains Mono\',monospace;font-size:11px;color:var(--muted);font-weight:700;white-space:nowrap;padding:10px 14px;position:sticky;left:0;background:var(--surface2)">'+esc(p.time)+'</td>'
        +'<td colspan="'+TT_COLS.length+'" style="text-align:center;color:var(--muted);font-size:12px;letter-spacing:.08em;font-family:\'JetBrains Mono\',monospace;font-weight:600">&#9749; '+esc(p.breakLabel)+'</td>'
        +'<td style="text-align:center;padding:5px">'
          +'<button onclick="ttEditBreak(\''+p.id+'\')" style="display:block;width:100%;background:none;border:1px solid var(--border);border-radius:5px;padding:2px;cursor:pointer;font-size:10px;color:var(--muted);margin-bottom:2px">&#9998;</button>'
          +(pi>0?'<button onclick="ttMoveRow(\''+p.id+'\',-1)" style="display:block;width:100%;background:none;border:1px solid var(--border);border-radius:5px;padding:2px;cursor:pointer;font-size:10px;color:var(--muted);margin-bottom:2px">&#9650;</button>':'')
          +(pi<periods.length-1?'<button onclick="ttMoveRow(\''+p.id+'\',1)" style="display:block;width:100%;background:none;border:1px solid var(--border);border-radius:5px;padding:2px;cursor:pointer;font-size:10px;color:var(--muted);margin-bottom:2px">&#9660;</button>':'')
          +(_isAdminOrArunkumar()?'<button onclick="ttDeleteRow(\''+p.id+'\')" style="display:block;width:100%;background:none;border:1px solid #fca5a5;border-radius:5px;padding:2px;cursor:pointer;font-size:10px;color:#dc2626">&#10005;</button>':'')
        +'</td>'
      +'</tr>';
    }
    return '<tr id="ttrow-'+p.id+'">'
      +'<td style="font-family:\'JetBrains Mono\',monospace;font-size:11px;color:var(--muted);font-weight:700;white-space:nowrap;padding:12px 14px;border-right:2px solid var(--border);position:sticky;left:0;background:var(--surface);z-index:1">'
        +esc(p.time)
        +'<div><button onclick="ttEditTime(\''+p.id+'\')" style="background:none;border:none;cursor:pointer;font-size:10px;color:var(--accent);padding:0;margin-top:3px">&#9998; edit</button></div>'
      +'</td>'
      +TT_COLS.map(function(c){
        var cell=p[c.key]||{sub:'',teacher:''};
        var has=cell.sub||cell.teacher;
        return '<td onclick="ttOpenEdit(\''+p.id+'\',\''+c.key+'\')" style="text-align:center;font-size:12px;padding:10px 8px;cursor:pointer;vertical-align:middle;transition:background .15s;border-right:1px solid var(--border)" onmouseenter="this.style.background=\''+c.color+'18\'" onmouseleave="this.style.background=\'\'" title="Click to edit">'
          +(has?'<div style="font-size:12.5px;font-weight:700;color:'+c.color+'">'+esc(cell.sub)+'</div><div style="font-size:10.5px;color:var(--muted);margin-top:2px">'+esc(cell.teacher)+'</div>':'<span style="font-size:18px;opacity:.2;color:'+c.color+'">+</span>')
        +'</td>';
      }).join('')
      +'<td style="text-align:center;vertical-align:middle;padding:5px">'
        +(pi>0?'<button onclick="ttMoveRow(\''+p.id+'\',-1)" style="display:block;width:100%;background:none;border:1px solid var(--border);border-radius:5px;padding:2px 0;cursor:pointer;font-size:10px;color:var(--muted);margin-bottom:2px">&#9650;</button>':'')
        +(pi<periods.length-1?'<button onclick="ttMoveRow(\''+p.id+'\',1)" style="display:block;width:100%;background:none;border:1px solid var(--border);border-radius:5px;padding:2px 0;cursor:pointer;font-size:10px;color:var(--muted);margin-bottom:2px">&#9660;</button>':'')
        +(_isAdminOrArunkumar()?'<button onclick="ttDeleteRow(\''+p.id+'\')" style="display:block;width:100%;background:none;border:1px solid #fca5a5;border-radius:5px;padding:2px 0;cursor:pointer;font-size:10px;color:#dc2626">Del</button>':'')
      +'</td>'
    +'</tr>';
  }).join('');
  // -- Cell edit modal --
  var modalHTML='';
  if(ttEditCell){
    var periods2=loadTTPeriods();
    var ep=periods2.find(function(p){return p.id===ttEditCell.periodId});
    var ec=ep?ep[ttEditCell.colKey]||{sub:'',teacher:''}:{sub:'',teacher:''};
    var colInfo=getTTCols().find(function(c){return c.key===ttEditCell.colKey})||{label:'',color:'#333'};
    modalHTML='<div style="position:fixed;inset:0;background:rgba(8,15,38,.45);z-index:200;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px)" onclick="ttCloseEdit(event)">'
      +'<div style="background:var(--surface);border-radius:16px;padding:28px;width:420px;max-width:95vw;box-shadow:var(--shadow2);animation:pageIn .2s ease" onclick="event.stopPropagation()">'
        +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">'
          +'<div style="width:12px;height:12px;border-radius:50%;background:'+colInfo.color+'"></div>'
          +'<div style="font-family:\'Cormorant Garamond\',serif;font-size:18px;font-weight:700;color:var(--on-surface)">Edit &mdash; '+esc(colInfo.label)+'</div>'
          +'<button onclick="ttCancelEdit()" style="margin-left:auto;background:none;border:none;font-size:20px;cursor:pointer;color:var(--muted)">&times;</button>'
        +'</div>'
        +'<div class="form-group" style="margin-bottom:14px"><label>Subject</label>'
          +'<input id="tt-sub-input" list="tt-sub-list" value="'+esc(ec.sub)+'" placeholder="e.g. Maths" style="width:100%;background:var(--surface2);border:1.5px solid var(--border);border-radius:8px;padding:9px 12px;font-size:14px;font-family:\'Nunito\',sans-serif;outline:none"/>'
          +'<datalist id="tt-sub-list">'+TT_SUBJECTS.map(function(s){return'<option>'+s+'</option>'}).join('')+'</datalist>'
        +'</div>'
        +'<div class="form-group" style="margin-bottom:20px"><label>Teacher</label>'
          +'<input id="tt-tea-input" list="tt-tea-list" value="'+esc(ec.teacher)+'" placeholder="e.g. Sir Arunkumar" style="width:100%;background:var(--surface2);border:1.5px solid var(--border);border-radius:8px;padding:9px 12px;font-size:14px;font-family:\'Nunito\',sans-serif;outline:none"/>'
          +'<datalist id="tt-tea-list">'+TT_TEACHERS.map(function(t){return'<option>'+t+'</option>'}).join('')+'</datalist>'
        +'</div>'
        +'<div style="display:flex;gap:10px">'
          +'<button class="btn btn-primary" onclick="ttSaveEdit()" style="flex:1">&#10003; Save</button>'
          +'<button class="btn btn-outline" onclick="ttClearCell()" style="color:#dc2626;border-color:#fca5a5">Clear</button>'
          +'<button class="btn btn-outline" onclick="ttCancelEdit()">Cancel</button>'
        +'</div>'
      +'</div>'
    +'</div>';
  }
  // -- Add/Edit column modal --
  var colModalHTML='';
  if(ttColModal){
    var isEdit=(ttColModal!=='add');
    var editCol=isEdit?getTTCols().find(function(c){return c.key===ttColModal})||{}:{};
    var availClasses=loadClasses().filter(function(c){return c.active});
    var usedKeys=getTTCols().map(function(c){return c.key});
    var unusedClasses=availClasses.filter(function(c){return usedKeys.indexOf(c.id)<0&&usedKeys.indexOf(c.name.toLowerCase().replace(/[^a-z0-9]/g,''))<0});
    var palette=TT_PALETTE.map(function(col){
      return '<div onclick="document.getElementById(\'ttcol-color\').value=\''+col+'\'" style="width:24px;height:24px;border-radius:50%;background:'+col+';cursor:pointer;flex-shrink:0;transition:transform .15s" onmouseenter="this.style.transform=\'scale(1.2)\'" onmouseleave="this.style.transform=\'scale(1)\'"></div>';
    }).join('');
    colModalHTML='<div style="position:fixed;inset:0;background:rgba(8,15,38,.45);z-index:200;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px)" onclick="if(event.target===this){ttColModal=null;render()}">'
      +'<div style="background:var(--surface);border-radius:16px;padding:28px;width:500px;max-width:95vw;box-shadow:var(--shadow2);animation:pageIn .2s ease" onclick="event.stopPropagation()">'
        +'<div style="display:flex;align-items:center;margin-bottom:20px">'
          +'<div style="font-family:\'Cormorant Garamond\',serif;font-size:19px;font-weight:700;color:var(--on-surface)">'+(isEdit?'&#9998; Edit Column':'&#43; Add Class to Timetable')+'</div>'
          +'<button onclick="ttColModal=null;render()" style="margin-left:auto;background:none;border:none;font-size:20px;cursor:pointer;color:var(--muted)">&times;</button>'
        +'</div>'
        // Quick-pick from Classes page
        +(unusedClasses.length&&!isEdit?'<div style="margin-bottom:16px"><div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;font-family:\'JetBrains Mono\',monospace;margin-bottom:8px">Quick Add from Classes Page</div>'
          +'<div style="display:flex;flex-wrap:wrap;gap:6px">'
            +unusedClasses.map(function(c){
              var col=TT_PALETTE[getTTCols().length%TT_PALETTE.length];
              return '<button onclick="ttColQuickAdd(\''+esc(c.name)+'\',\''+esc(c.id)+'\')" style="padding:5px 12px;border-radius:7px;border:1.5px solid var(--border);background:var(--surface2);cursor:pointer;font-size:12.5px;font-weight:700;color:var(--accent);font-family:\'Nunito\',sans-serif;transition:all .15s" onmouseenter="this.style.background=\'var(--accent-light)\'" onmouseleave="this.style.background=\'var(--surface2)\'">&#43; '+esc(c.name)+'</button>';
            }).join('')
          +'</div><div style="margin:14px 0;border-top:1px solid var(--border)"></div></div>':'')
        +'<div class="form-group" style="margin-bottom:14px"><label>Column / Class Name *</label>'
          +'<input id="ttcol-label" list="ttcol-label-list" placeholder="e.g. Sainik New, Class X-B..." value="'+esc(isEdit?editCol.label:'')+'" style="width:100%;background:var(--surface2);border:1.5px solid var(--border);border-radius:8px;padding:9px 12px;font-size:14px;font-family:\'Nunito\',sans-serif;outline:none"/>'
          +'<datalist id="ttcol-label-list">'+availClasses.map(function(c){return'<option value="'+esc(c.name)+'">'}).join('')+'</datalist>'
        +'</div>'
        +'<div class="form-group" style="margin-bottom:20px"><label>Column Colour</label>'
          +'<div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:10px">'+palette+'</div>'
          +'<div style="display:flex;align-items:center;gap:10px">'
            +'<input id="ttcol-color" type="color" value="'+esc(isEdit?editCol.color:TT_PALETTE[getTTCols().length%TT_PALETTE.length])+'" style="width:44px;height:36px;border:1.5px solid var(--border);border-radius:8px;cursor:pointer;padding:2px"/>'
            +'<span style="font-size:12px;color:var(--muted)">Click a colour above or pick custom</span>'
          +'</div>'
        +'</div>'
        +'<div style="display:flex;gap:10px">'
          +'<button class="btn btn-primary" onclick="'+(isEdit?'ttColSaveEdit(\''+esc(ttColModal)+'\')':'ttColAddNew()')+'" style="flex:1">'+(isEdit?'&#10003; Save':'&#43; Add Column')+'</button>'
          +'<button class="btn btn-outline" onclick="ttColModal=null;render()">Cancel</button>'
        +'</div>'
      +'</div>'
    +'</div>';
  }
  var legendHTML='<div style="display:flex;flex-wrap:wrap;gap:7px;margin-bottom:18px;align-items:center">'
    +'<span style="font-size:11px;color:var(--muted);font-family:\'JetBrains Mono\',monospace;margin-right:4px">Classes:</span>'
    +TT_COLS.map(function(c){return'<div style="display:flex;align-items:center;gap:5px;font-size:12px;font-weight:700;padding:4px 11px;border-radius:20px;background:'+c.color+';color:#fff"><div style="width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,0.5)"></div>'+esc(c.label)+'</div>'}).join('')
    +(_isAdminOrArunkumar()?'<button onclick="ttColModal=\'add\';render()" style="padding:4px 11px;border-radius:20px;border:1.5px dashed var(--border);background:transparent;cursor:pointer;font-size:12px;font-weight:700;color:var(--accent);font-family:\'Nunito\',sans-serif">&#43; Add Class</button>':'')
    +'</div>';
  // -- Tab switcher header --
  var tabBar='<div style="display:flex;gap:3px;margin-bottom:20px;border-bottom:2px solid var(--border);padding-bottom:0">'
    +[{id:'schedule',icon:'📅',label:'Schedule'},{id:'mapping',icon:'👥',label:'Student Mapping'},{id:'student',icon:'🎓',label:'Student View'}].map(function(t){
      var active=ttTab===t.id;
      return '<button onclick="ttTab=\''+t.id+'\';render()" style="padding:9px 18px;border:none;border-bottom:3px solid '+(active?'var(--accent)':'transparent')+';background:transparent;font-size:13px;font-weight:'+(active?'700':'500')+';color:'+(active?'var(--accent)':'var(--muted)')+';cursor:pointer;font-family:\'Nunito\',sans-serif;margin-bottom:-2px;transition:all .15s">'+t.icon+' '+t.label+'</button>';
    }).join('')
  +'</div>';
  // -- Mapping / Student view bypass --
  if(ttTab==='mapping'){
    return '<div style="margin-bottom:16px;display:flex;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;gap:12px">'
      +'<div><div style="font-family:\'JetBrains Mono\',monospace;font-size:11px;color:var(--muted);letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px">'+(window.TENANT?window.TENANT.name:'School')+'</div>'
      +'<div style="font-size:22px;font-family:\'Cormorant Garamond\',serif;font-weight:700;color:var(--on-surface)">Class Timetable</div></div>'
    +'</div>'+tabBar+renderTTMappingTab();
  }
  if(ttTab==='student'){
    return '<div style="margin-bottom:16px;display:flex;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;gap:12px">'
      +'<div><div style="font-family:\'JetBrains Mono\',monospace;font-size:11px;color:var(--muted);letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px">'+(window.TENANT?window.TENANT.name:'School')+'</div>'
      +'<div style="font-size:22px;font-family:\'Cormorant Garamond\',serif;font-weight:700;color:var(--on-surface)">Class Timetable</div></div>'
    +'</div>'+tabBar+renderTTStudentView();
  }
  return '<div style="margin-bottom:16px;display:flex;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;gap:12px">'
    +'<div><div style="font-family:\'JetBrains Mono\',monospace;font-size:11px;color:var(--muted);letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px">'+(window.TENANT?window.TENANT.name:'School')+'</div>'
    +'<div style="font-size:22px;font-family:\'Cormorant Garamond\',serif;font-weight:700;color:var(--on-surface)">Class Timetable &mdash; Monday to Saturday</div>'
    +'<div style="font-size:12px;color:var(--muted);margin-top:3px">Click cell to edit &nbsp;&middot;&nbsp; &#9998;/&#10005; on column header to rename/remove &nbsp;&middot;&nbsp; Arrows to reorder rows</div></div>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
      +(_isAdminOrArunkumar()?'<button class="btn btn-primary" onclick="ttColModal=\'add\';render()" style="font-size:12px;padding:7px 16px">&#43; Add Class Column</button>':'')
      +(_isAdminOrArunkumar()?'<button class="btn btn-outline" onclick="ttAddPeriod()" style="font-size:12px;padding:7px 14px">&#43; Add Period</button>':'')
      +(_isAdminOrArunkumar()?'<button class="btn btn-outline" onclick="ttAddBreak()" style="font-size:12px;padding:7px 14px">&#43; Add Break</button>':'')
      +(_isAdminOrArunkumar()?'<button class="btn btn-outline" onclick="ttResetDefault()" style="font-size:12px;padding:7px 14px;color:#dc2626;border-color:#fca5a5">&#8635; Reset All</button>':'')
    +'</div>'
  +'</div>'
  +tabBar
  +legendHTML
  +'<div class="gnsi-tt-desktop"><div class="card"><div style="overflow-x:auto"><table style="min-width:900px"><thead>'+headerRow+'</thead><tbody>'+bodyRows+'</tbody></table></div></div></div>'
  // -- MOBILE VIEW: stacked period cards --
  +(function(){
    var mCards=periods.map(function(p){
      if(p.isBreak){
        return '<div class="tt-mob-break">'+activityIconTT(p.breakLabel)+'&#9749; '+esc(p.breakLabel)+'</div>';
      }
      var cells=TT_COLS.map(function(c){
        var cell=p[c.key]||{sub:'',teacher:''};
        var has=cell.sub||cell.teacher;
        return '<div class="tt-mob-cell" onclick="ttOpenEdit(\''+p.id+'\',\''+c.key+'\')">'
          +'<div class="tt-mob-cell-label" style="color:'+c.color+'">'+esc(c.label)+'</div>'
          +(has
            ?'<div class="tt-mob-cell-sub" style="color:'+c.color+'">'+esc(cell.sub)+'</div>'
             +'<div class="tt-mob-cell-teacher">'+esc(cell.teacher)+'</div>'
            :'<div style="font-size:20px;opacity:.18;color:'+c.color+'">+</div>')
        +'</div>';
      }).join('');
      var cols=Math.min(TT_COLS.length,2);
      return '<div class="tt-mob-period-card">'
        +'<div class="tt-mob-period-header">'
          +'<span class="tt-mob-period-time">'+esc(p.time)+'</span>'
          +(_isAdminOrArunkumar()?'<button onclick="ttEditTime(\''+p.id+'\')" style="margin-left:auto;background:none;border:none;cursor:pointer;font-size:13px;color:var(--accent)">✏</button>':'')
        +'</div>'
        +'<div class="tt-mob-cell-grid" style="grid-template-columns:repeat('+cols+',1fr)">'+cells+'</div>'
      +'</div>';
    }).join('');
    return '<div class="gnsi-tt-mobile">'
      +'<div class="mob-view-chip">📱 Mobile View -- Tap any cell to edit</div>'
      +(_isAdminOrArunkumar()
        ?'<div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">'
          +'<button class="btn btn-primary" style="flex:1;font-size:13px" onclick="ttColModal=\'add\';render()">+ Add Class</button>'
          +'<button class="btn btn-outline" style="flex:1;font-size:13px" onclick="ttAddPeriod()">+ Period</button>'
          +'<button class="btn btn-outline" style="flex:1;font-size:13px" onclick="ttAddBreak()">+ Break</button>'
        +'</div>':'')
      +mCards
    +'</div>';
  })()
  +modalHTML+colModalHTML;
}
// ══════════════════════════════════════════════════════════════
// TIMETABLE -- STUDENT BATCH MAPPING & PERSONAL VIEW
// ══════════════════════════════════════════════════════════════
function renderTTMappingTab(){
  getTTCols();
  var map=loadTTStudentMap();
  var stuList=students.slice().sort(function(a,b){return(a.name||'').localeCompare(b.name||'');});
  var q=(ttStuSearch||'').toLowerCase().trim();
  if(q) stuList=stuList.filter(function(s){
    return (s.name||'').toLowerCase().includes(q)||(s.roll||'').includes(q)||(s.cls||'').toLowerCase().includes(q);
  });
  if(ttMapBatchFilter!=='all') stuList=stuList.filter(function(s){
    return (map[s.id]||'')===(ttMapBatchFilter==='unassigned'?'':ttMapBatchFilter)||
           (ttMapBatchFilter==='unassigned'&&!map[s.id]);
  });
  // Batch summary chips
  var summary=TT_COLS.map(function(c){
    var cnt=Object.values(map).filter(function(v){return v===c.key;}).length;
    return '<div onclick="ttMapBatchFilter=ttMapBatchFilter===\''+c.key+'\'?\'all\':\''+c.key+'\';render()" style="cursor:pointer;display:flex;align-items:center;gap:5px;font-size:12px;font-weight:700;padding:5px 12px;border-radius:20px;background:'+(ttMapBatchFilter===c.key?c.color:'var(--surface2)')+';color:'+(ttMapBatchFilter===c.key?'#fff':'var(--on-surface)')+';border:2px solid '+c.color+';transition:all .15s">'
      +'<div style="width:7px;height:7px;border-radius:50%;background:'+c.color+'"></div>'
      +esc(c.label)+' <span style="opacity:.7">('+cnt+')</span></div>';
  }).join('');
  var unassigned=stuList.filter?stuList.filter(function(s){return !map[s.id];}).length:0;
  var allUnassignedChip='<div onclick="ttMapBatchFilter=ttMapBatchFilter===\'unassigned\'?\'all\':\'unassigned\';render()" style="cursor:pointer;display:flex;align-items:center;gap:5px;font-size:12px;font-weight:700;padding:5px 12px;border-radius:20px;background:'+(ttMapBatchFilter==='unassigned'?'#64748b':'var(--surface2)')+';color:'+(ttMapBatchFilter==='unassigned'?'#fff':'var(--muted)')+';border:2px dashed #94a3b8;transition:all .15s">⚠ Unassigned ('+Object.keys(map).length+'→'+students.length+' total)</div>';
  // Batch column option list
  var batchOpts='<option value="">-- Unassigned --</option>'
    +TT_COLS.map(function(c){return'<option value="'+esc(c.key)+'">'+esc(c.label)+'</option>';}).join('');
  // Student rows
  var rows=stuList.map(function(s){
    var assigned=map[s.id]||'';
    var col=assigned?TT_COLS.find(function(c){return c.key===assigned;}):null;
    var badgeHTML=col
      ?'<span style="padding:2px 9px;border-radius:10px;font-size:11px;font-weight:700;background:'+col.color+';color:#fff">'+esc(col.label)+'</span>'
      :'<span style="padding:2px 9px;border-radius:10px;font-size:11px;font-weight:600;background:#f1f5f9;color:#94a3b8;border:1px dashed #cbd5e1">Unassigned</span>';
    return '<tr>'
      +'<td style="padding:9px 14px"><div style="display:flex;align-items:center;gap:9px">'
        +'<div style="width:32px;height:32px;border-radius:50%;background:'+(col?col.color:'#94a3b8')+';display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0">'+(s.name||'?')[0].toUpperCase()+'</div>'
        +'<div><div style="font-weight:700;font-size:13px">'+esc(s.name||'')+'</div>'
          +'<div style="font-size:11px;color:var(--muted);font-family:\'JetBrains Mono\',monospace">Roll '+esc(s.roll||'--')+' · '+esc(s.cls||'--')+'</div>'
        +'</div></div></td>'
      +'<td style="padding:9px 14px">'+badgeHTML+'</td>'
      +'<td style="padding:9px 14px">'
        +'<select onchange="ttAssignBatch('+parseInt(s.id,10)+',this.value)" style="padding:5px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:12.5px;font-family:\'Nunito\',sans-serif;background:var(--surface);color:var(--on-surface);cursor:pointer;min-width:180px">'
          +TT_COLS.map(function(c){return'<option value="'+esc(c.key)+'"'+(assigned===c.key?' selected':'')+'>'+esc(c.label)+'</option>';}).join('')
          +'<option value=""'+(assigned?'':' selected')+'>-- Unassigned --</option>'
        +'</select>'
      +'</td>'
      +'<td style="padding:9px 14px">'
        +'<button onclick="ttStuViewId='+parseInt(s.id,10)+';ttTab=\'student\';render()" style="padding:4px 11px;border-radius:7px;border:1.5px solid var(--accent);background:var(--accent-light);color:var(--accent);font-size:12px;font-weight:700;cursor:pointer;font-family:\'Nunito\',sans-serif">📅 View</button>'
      +'</td>'
    +'</tr>';
  }).join('');
  var assignedCount=Object.keys(map).length;
  var totalStu=students.length;
  return '<div class="card" style="margin-bottom:16px;padding:20px 24px">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:18px">'
      +'<div>'
        +'<div style="font-size:17px;font-weight:700;font-family:\'Cormorant Garamond\',serif;color:var(--on-surface)">👥 Student Batch Assignment</div>'
        +'<div style="font-size:12px;color:var(--muted);margin-top:3px">'+assignedCount+' of '+totalStu+' students assigned to a batch</div>'
      +'</div>'
      +'<div style="display:flex;gap:8px">'
        +'<button onclick="ttBulkAssignByClass()" class="btn btn-outline" style="font-size:12px;padding:6px 14px">⚡ Auto-Assign by Class</button>'
        +'<button onclick="ttExportMapping()" class="btn btn-outline" style="font-size:12px;padding:6px 14px">📋 Export List</button>'
      +'</div>'
    +'</div>'
    // progress bar
    +'<div style="background:var(--surface2);border-radius:8px;height:8px;margin-bottom:16px;overflow:hidden"><div style="height:100%;border-radius:8px;background:var(--accent);width:'+Math.round(assignedCount/Math.max(totalStu,1)*100)+'%;transition:width .4s"></div></div>'
    // batch filter chips
    +'<div style="display:flex;flex-wrap:wrap;gap:7px;margin-bottom:16px">'+allUnassignedChip+summary+'</div>'
    // search
    +'<div style="position:relative;margin-bottom:16px">'
      +'<input id="tt-stu-search" placeholder="🔍  Search by name, roll, or class…" value="'+esc(ttStuSearch)+'" oninput="ttStuSearch=this.value;_debouncedRenderTtStu()" style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:14px;font-family:\'Nunito\',sans-serif;background:var(--surface2);color:var(--on-surface);outline:none;box-sizing:border-box"/>'
    +'</div>'
    // table
    +(stuList.length===0
      ?'<div style="text-align:center;padding:40px;color:var(--muted)">No students match the filter.</div>'
      :'<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse">'
        +'<thead><tr style="background:var(--surface2)">'
          +'<th style="padding:8px 14px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em">Student</th>'
          +'<th style="padding:8px 14px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em">Current Batch</th>'
          +'<th style="padding:8px 14px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em">Assign To</th>'
          +'<th style="padding:8px 14px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em">Timetable</th>'
        +'</tr></thead>'
        +'<tbody>'+rows+'</tbody>'
      +'</table></div>')
  +'</div>';
}
function renderTTStudentView(){
  var map=loadTTStudentMap();
  var stu=students.find(function(s){return s.id===ttStuViewId;});
  if(!stu) return '<div class="card" style="padding:30px;text-align:center;color:var(--muted)">Select a student from the Mapping tab to view their personal timetable.</div>';
  var batchKey=map[stu.id]||'';
  var col=batchKey?TT_COLS.find(function(c){return c.key===batchKey;}):null;
  var periods=loadTTPeriods();
  var stuInitial=(stu.name||'?')[0].toUpperCase();
  var headerColor=col?col.color:'#94a3b8';
  var rows=periods.map(function(p){
    if(p.isBreak) return '<tr><td colspan="2" style="padding:7px 16px;background:var(--surface2);text-align:center;font-size:12px;font-weight:700;color:var(--muted);letter-spacing:.06em">☕ '+esc(p.breakLabel||p.time)+'</td></tr>';
    if(!batchKey) return '<tr><td style="padding:10px 16px;color:var(--muted);font-size:12px">'+esc(p.time)+'</td><td style="padding:10px 16px;color:#94a3b8;font-style:italic;font-size:12px">No batch assigned</td></tr>';
    var cell=p[batchKey]||{sub:'',teacher:''};
    var hasSub=cell.sub;
    return '<tr style="border-bottom:1px solid var(--border)">'
      +'<td style="padding:10px 16px;font-size:12px;font-family:\'JetBrains Mono\',monospace;color:var(--muted);white-space:nowrap;width:160px">'+esc(p.time)+'</td>'
      +'<td style="padding:10px 16px">'
        +(hasSub
          ?'<div style="display:flex;align-items:center;gap:10px">'
            +'<div style="width:4px;height:36px;border-radius:3px;background:'+headerColor+';flex-shrink:0"></div>'
            +'<div><div style="font-weight:700;font-size:13.5px;color:var(--on-surface)">'+esc(cell.sub)+'</div>'
              +(cell.teacher?'<div style="font-size:11.5px;color:var(--muted)">'+esc(cell.teacher)+'</div>':'')
            +'</div></div>'
          :'<span style="color:#cbd5e1;font-size:12px">-- Free period --</span>')
      +'</td>'
    +'</tr>';
  }).join('');
  // Subject summary for this student
  var subMap={};
  periods.forEach(function(p){
    if(p.isBreak||!batchKey)return;
    var cell=p[batchKey]||{};
    if(cell.sub&&cell.sub!=='Doubt Session'){subMap[cell.sub]=(subMap[cell.sub]||0)+1;}
  });
  var subChips=Object.keys(subMap).sort().map(function(s){
    return '<div style="padding:3px 10px;border-radius:12px;font-size:11px;font-weight:700;background:'+headerColor+'22;color:'+headerColor+';border:1px solid '+headerColor+'44">'+esc(s)+' ×'+subMap[s]+'</div>';
  }).join('');
  return '<div class="card" style="margin-bottom:16px;padding:0;overflow:hidden">'
    // hero header
    +'<div style="padding:20px 24px;background:'+headerColor+';display:flex;align-items:center;gap:14px">'
      +'<div style="width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,.25);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;color:#fff;flex-shrink:0">'+stuInitial+'</div>'
      +'<div style="flex:1">'
        +'<div style="font-size:18px;font-weight:700;color:#fff;font-family:\'Cormorant Garamond\',serif">'+esc(stu.name)+'</div>'
        +'<div style="font-size:12px;color:rgba(255,255,255,.8)">Roll '+esc(stu.roll||'--')+' · '+esc(stu.cls||'--')+(col?' · <b>'+esc(col.label)+'</b>':' · <i>No batch assigned</i>')+'</div>'
      +'</div>'
      +'<button onclick="ttStuViewId=null;ttTab=\'mapping\';render()" style="background:rgba(255,255,255,.2);border:none;border-radius:8px;padding:6px 12px;color:#fff;cursor:pointer;font-size:12px;font-weight:700;font-family:\'Nunito\',sans-serif">← Back</button>'
    +'</div>'
    // subject summary
    +(subChips?'<div style="padding:12px 24px;border-bottom:1px solid var(--border);display:flex;gap:6px;flex-wrap:wrap">'+subChips+'</div>':'')
    // schedule table
    +'<table style="width:100%;border-collapse:collapse"><tbody>'+rows+'</tbody></table>'
  +'</div>';
}
// -- BULK AUTO-ASSIGN: map students to batch by their cls field --
function ttBulkAssignByClass(){
  getTTCols();
  var map=loadTTStudentMap();
  var assigned=0;
  students.forEach(function(s){
    if(map[s.id]) return; // skip already assigned
    var cls=(s.cls||'').toLowerCase();
    // fuzzy match student class name against batch keys/labels
    // Priority: 1) exact key match, 2) exact label match, 3) bidirectional contains (min 3 chars)
    var match=TT_COLS.find(function(c){
      var lbl=c.label.toLowerCase().trim();
      var key=c.key.toLowerCase().trim();
      var clsTrim=cls.trim();
      if(!clsTrim||clsTrim.length<2) return false;
      if(clsTrim===key) return true;  // exact batch key match (e.g. "achiever" === "achiever")
      if(clsTrim===lbl) return true;  // exact label match
      // bidirectional substring with length guard to avoid false matches
      if(clsTrim.length>=3 && key.length>=3 && (clsTrim.includes(key)||key.includes(clsTrim))) return true;
      if(clsTrim.length>=3 && lbl.length>=3 && lbl.includes(clsTrim)) return true;
      return false;
    });
    if(match){map[s.id]=match.key;assigned++;}
  });
  saveTTStudentMap(map);
  showToast&&showToast('⚡ Auto-assigned '+assigned+' students to batches','#16a34a');
  render();
}
// -- EXPORT MAPPING AS CSV TEXT (printed in toast/log) ----------
function ttExportMapping(){
  showToast('⏳ Preparing Timetable Mapping CSV…','#2563eb');

  getTTCols();
  var map=loadTTStudentMap();
  var lines=['Roll,Name,Class,Batch'];
  students.slice().sort(function(a,b){return(a.name||'').localeCompare(b.name||'');}).forEach(function(s){
    var col=map[s.id]?TT_COLS.find(function(c){return c.key===map[s.id];}):null;
    lines.push([s.roll,s.name,s.cls,col?col.label:'Unassigned'].map(function(v){return'"'+(v||'').replace(/"/g,'""')+'"';}).join(','));
  });
  var csv=lines.join('\n');
  try{
    var blob=new Blob([csv],{type:'text/csv'});
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');a.href=url;a.download='gnsi_batch_mapping.csv';  showToast('✅ Timetable Mapping CSV ready — '+(lines.length)+' rows','#16a34a');
  a.click();
    setTimeout(function(){URL.revokeObjectURL(url);},2000);
    showToast&&showToast('📋 Mapping exported as CSV','#16a34a');
  }catch(e){showToast&&showToast('Export failed: '+e.message,'#dc2626');}
}
function activityIconTT(a){return '';}
// -- TIMETABLE EDIT ACTIONS ------------------------------------
function ttOpenEdit(periodId,colKey){
  ttEditCell={periodId:periodId,colKey:colKey};
  render();
  // Focus subject input after render
  setTimeout(function(){var el=document.getElementById('tt-sub-input');if(el)el.focus()},50);
}
function ttCancelEdit(){ttEditCell=null;render()}
function ttCloseEdit(e){if(e.target===e.currentTarget){ttEditCell=null;render()}}
function ttSaveEdit(){
  if(!ttEditCell)return;
  var sub=(document.getElementById('tt-sub-input')||{}).value||'';
  var tea=(document.getElementById('tt-tea-input')||{}).value||'';
  var periods=loadTTPeriods();
  periods=periods.map(function(p){
    if(p.id===ttEditCell.periodId){
      var np=Object.assign({},p);
      np[ttEditCell.colKey]={sub:sub.trim(),teacher:tea.trim()};
      return np;
    }
    return p;
  });
  saveTTPeriods(periods);
  ttEditCell=null;render();
}
function ttClearCell(){
  if(!ttEditCell)return;
  var periods=loadTTPeriods();
  periods=periods.map(function(p){
    if(p.id===ttEditCell.periodId){
      var np=Object.assign({},p);
      np[ttEditCell.colKey]={sub:'',teacher:''};
      return np;
    }
    return p;
  });
  saveTTPeriods(periods);
  ttEditCell=null;render();
}
function ttMoveRow(id,dir){
  var periods=loadTTPeriods();
  var idx=periods.findIndex(function(p){return p.id===id});
  if(idx<0)return;
  var ni=idx+dir;
  if(ni<0||ni>=periods.length)return;
  var tmp=periods[idx];periods[idx]=periods[ni];periods[ni]=tmp;
  saveTTPeriods(periods);render();
}
function ttDeleteRow(id){
  if(!confirm('Delete this row?'))return;
  var periods=loadTTPeriods();
  periods=periods.filter(function(p){return p.id!==id});
  saveTTPeriods(periods);render();
}
function ttAddPeriod(){
  var time=prompt('Enter time for new period (e.g. 3:35 PM – 4:25 PM):','');
  if(!time||!time.trim())return;
  var periods=loadTTPeriods();
  var newP={id:'p'+Date.now(),time:time.trim()};
  TT_COLS.forEach(function(c){newP[c.key]={sub:'',teacher:''}});
  periods.push(newP);
  saveTTPeriods(periods);render();
}
function ttAddBreak(){
  var time=prompt('Enter time for break (e.g. 3:30 PM – 3:45 PM):','');
  if(!time||!time.trim())return;
  var label=prompt('Break label:','Break');
  var periods=loadTTPeriods();
  periods.push({id:'p'+Date.now(),time:time.trim(),isBreak:true,breakLabel:label||'Break'});
  saveTTPeriods(periods);render();
}
function ttEditTime(id){
  var periods=loadTTPeriods();
  var p=periods.find(function(x){return x.id===id});
  if(!p)return;
  var val=prompt('Edit time slot:',p.time);
  if(val===null||!val.trim())return;
  periods=periods.map(function(x){return x.id===id?Object.assign({},x,{time:val.trim()}):x});
  saveTTPeriods(periods);render();
}
function ttEditBreak(id){
  var periods=loadTTPeriods();
  var p=periods.find(function(x){return x.id===id});
  if(!p)return;
  var t=prompt('Edit break time:',p.time);if(t===null)return;
  var l=prompt('Edit break label:',p.breakLabel);if(l===null)return;
  periods=periods.map(function(x){return x.id===id?Object.assign({},x,{time:t.trim(),breakLabel:l.trim()}):x});
  saveTTPeriods(periods);render();
}
function ttResetDefault(){
  if(!confirm('Reset timetable to official document defaults? All changes will be lost.'))return;
  localStorage.removeItem('ims_gnsi_periods');
  localStorage.removeItem('ims_tt_cols');
  ttEditCell=null;ttColModal=null;
  // Push fresh defaults to cloud so all devices get them
  var defPeriods=JSON.parse(JSON.stringify(TT_DEFAULT_PERIODS));
  var defCols=[
    {key:'achiever',label:'Achiever Batch (Combined)',color:'#8b5cf6'},
    {key:'leader',  label:'Leader Batch (Sainik)',    color:'#1a6b55'},
    {key:'champion',label:'Champion Batch (Sainik)',  color:'#0891b2'},
    {key:'lakshya', label:'Lakshya Batch (Navodaya)', color:'#3b78c9'},
    {key:'umeed',   label:'Umeed Batch (Navodaya)',   color:'#0e7490'},
    {key:'elite',   label:'Elite Batch (Foundation A)',color:'#d4a853'},
    {key:'prime',   label:'Prime Batch (Foundation B)',color:'#dc2626'}
  ];
  saveTTPeriods(defPeriods);
  saveTTCols(defCols);
  gnsiMarkLocalSave(20000); // 20s guard -- prevents KV poll from overwriting fresh defaults
  showToast&&showToast('✅ Timetable reset and synced to cloud','#16a34a');
  render();
}
// -- COLUMN MANAGEMENT ----------------------------------------
function ttColAddNew(){
  var label=((document.getElementById('ttcol-label')||{}).value||'').trim();
  if(!label){alert('Class name is required.');return}
  var color=((document.getElementById('ttcol-color')||{}).value||'').trim()||TT_PALETTE[0];
  var key='col_'+Date.now();
  var cols=loadTTCols();
  cols.push({key:key,label:label,color:color});
  saveTTCols(cols);
  ttColModal=null;render();
}
function ttColQuickAdd(label,classId){
  var cols=loadTTCols();
  var key='col_'+classId.replace(/[^a-z0-9]/gi,'_');
  if(cols.find(function(c){return c.key===key})){showToast('⚠️ This class is already in the timetable.','#ea580c');return}
  var color=TT_PALETTE[cols.length%TT_PALETTE.length];
  cols.push({key:key,label:label,color:color});
  saveTTCols(cols);
  ttColModal=null;render();
}
function ttColEdit(key){
  ttColModal=key;ttEditCell=null;render();
  setTimeout(function(){var el=document.getElementById('ttcol-label');if(el)el.focus()},50);
}
function ttColSaveEdit(key){
  var label=((document.getElementById('ttcol-label')||{}).value||'').trim();
  if(!label){alert('Name is required.');return}
  var color=((document.getElementById('ttcol-color')||{}).value||'').trim();
  var cols=loadTTCols();
  cols=cols.map(function(c){return c.key===key?{key:c.key,label:label,color:color||c.color}:c});
  saveTTCols(cols);
  ttColModal=null;render();
}
function ttColRemove(key){
  var col=loadTTCols().find(function(c){return c.key===key});
  if(!col)return;
  // Check if col has any data in periods
  var periods=loadTTPeriods();
  var hasData=periods.some(function(p){var cell=p[col.key];return cell&&(cell.sub||cell.teacher)});
  var msg='Remove column "'+col.label+'" from the timetable?'+(hasData?'\n\nWarning: This column has data that will be lost!':'');
  if(!confirm(msg))return;
  var cols=loadTTCols().filter(function(c){return c.key!==key});
  if(cols.length===0){showToast('⚠️ Cannot remove the last column.','#ea580c');return}
  saveTTCols(cols);
  render();
}
// ══════════════════════════════════════════════════════════════
//  DOUBT SESSION TIMETABLE -- FULLY CUSTOMISABLE
// ══════════════════════════════════════════════════════════════
var DS_SUBJECTS_LIST=['Mathematics I','Mathematics II','Maths I Practice','Maths II Practice','Science','Science & GK','Reasoning','Grammar','Grammar Practice',
  'Vocabulary','Mental','Meitei Mayek','Hindi','GK','Passage','English','Doubt Clearing','Revision','Test Practice','Any Subject'];

/* ── Doubt TT: rows = time slots, columns = batches ── */
var DS_DEFAULT_SESSIONS=[
  {id:'t_0700',label:'7:00 AM – 7:45 AM',  time:'7:00 AM – 7:45 AM',  icon:'🌅',color:'#d4a853',isBreak:false},
  {id:'t_0745',label:'7:45 AM – 8:30 AM',  time:'7:45 AM – 8:30 AM',  icon:'🌅',color:'#d4a853',isBreak:false},
  {id:'t_1730',label:'5:30 PM – 6:20 PM',  time:'5:30 PM – 6:20 PM',  icon:'🌇',color:'#3b78c9',isBreak:false},
  {id:'t_1830',label:'6:30 PM – 7:15 PM',  time:'6:30 PM – 7:15 PM',  icon:'🌇',color:'#3b78c9',isBreak:false},
  {id:'t_1915',label:'7:15 PM – 8:00 PM',  time:'7:15 PM – 8:00 PM',  icon:'🌇',color:'#3b78c9',isBreak:false},
  {id:'t_break',label:'8:00 PM – 9:00 PM',  time:'8:00 PM – 9:00 PM', icon:'🍽️',color:'#6b7280',isBreak:true,breakLabel:'DINNER'},
  {id:'t_2100',label:'9:00 PM – 9:35 PM',  time:'9:00 PM – 9:35 PM',  icon:'🌙',color:'#8b5cf6',isBreak:false},
  {id:'t_2135',label:'9:35 PM – 10:10 PM', time:'9:35 PM – 10:10 PM', icon:'🌙',color:'#8b5cf6',isBreak:false}
];

/* Columns = batches with A/B sub-batches */
var DS_DEFAULT_DAYS=[
  'Achiever A','Achiever B',
  'Leader A','Leader B',
  'Champion A','Champion B',
  'Lakshya A','Lakshya B',
  'Umeed A','Umeed B',
  'Elite','Prime'
];

/* Full batch labels for display */
var DS_BATCH_LABELS={
  'Achiever A':'Achiever Batch (Combined) A', 'Achiever B':'Achiever Batch (Combined) B',
  'Leader A':'Leader Batch (Sainik) A',        'Leader B':'Leader Batch (Sainik) B',
  'Champion A':'Champion Batch (Sainik) A',    'Champion B':'Champion Batch (Sainik) B',
  'Lakshya A':'Lakshya Batch (Navodaya) A',    'Lakshya B':'Lakshya Batch (Navodaya) B',
  'Umeed A':'Umeed Batch (Navodaya) A',        'Umeed B':'Umeed Batch (Navodaya) B',
  'Elite':'Elite Batch (Foundation)',           'Prime':'Prime Batch (Foundation)'
};

/* Batch header color groups */
var DS_BATCH_COLORS={
  'Achiever A':'#8b5cf6','Achiever B':'#8b5cf6',
  'Leader A':'#1a6b55',  'Leader B':'#1a6b55',
  'Champion A':'#0891b2','Champion B':'#0891b2',
  'Lakshya A':'#3b78c9', 'Lakshya B':'#3b78c9',
  'Umeed A':'#0e7490',   'Umeed B':'#0e7490',
  'Elite':'#d4a853',     'Prime':'#dc2626'
};
/* -- persistence -- */
function loadDSSessions(){
  var s=localStorage.getItem('ims_ds_sessions');
  if(s){try{return JSON.parse(s)}catch(e){}}
  return JSON.parse(JSON.stringify(DS_DEFAULT_SESSIONS));
}
function saveDSSessions(list){localStorage.setItem('ims_ds_sessions',JSON.stringify(list));if(typeof gnsiKVPush==='function')gnsiKVPush('ims_ds_sessions',list);}
function loadDSDays(){
  var s=localStorage.getItem('ims_ds_days');
  if(s){try{return JSON.parse(s)}catch(e){}}
  return DS_DEFAULT_DAYS.slice();
}
function saveDSDays(list){localStorage.setItem('ims_ds_days',JSON.stringify(list));if(typeof gnsiKVPush==='function')gnsiKVPush('ims_ds_days',list);}
function loadDSTT(){
  var s=localStorage.getItem('ims_dstt');
  if(s){try{return JSON.parse(s)}catch(e){}}
  /* Pre-filled timetable from screenshot */
  var def={
    /* 7:00 – 7:45 AM */
    't_0700|Achiever A': {sub:'Maths II with Practice Session', staff:'Sir Himan'},
    't_0700|Achiever B': {sub:'Maths I Practice',               staff:'Miss Fredava'},
    't_0700|Leader A':   {sub:'Reasoning',                      staff:'Sir James'},
    't_0700|Leader B':   {sub:'Grammar',                        staff:'Sir Adison'},
    't_0700|Champion A': {sub:'Reasoning',                      staff:'Sir Umesh'},
    't_0700|Champion B': {sub:'Grammar',                        staff:'Miss Geetanjali'},
    't_0700|Lakshya A':  {sub:'Passage',                        staff:'Miss Devia'},
    't_0700|Lakshya B':  {sub:'Maths II',                       staff:'Sir Romesh'},
    't_0700|Umeed A':    {sub:'Passage',                        staff:'Miss Bidyarani'},
    't_0700|Umeed B':    {sub:'Science',                        staff:'Sir Shrinivash'},
    't_0700|Elite':      {sub:'Reasoning',                      staff:'Sir Bidyachandra'},
    't_0700|Prime':      {sub:'',                               staff:''},
    /* 7:45 – 8:30 AM */
    't_0745|Achiever A': {sub:'Reasoning',                      staff:'Sir James'},
    't_0745|Achiever B': {sub:'Maths I Practice',               staff:'Miss Fedrava'},
    't_0745|Leader A':   {sub:'',                               staff:''},
    't_0745|Leader B':   {sub:'Reasoning',                      staff:'Sir Umesh'},
    't_0745|Champion A': {sub:'Grammar',                        staff:'Sir Adison'},
    't_0745|Champion B': {sub:'Passage',                        staff:'Miss Devia'},
    't_0745|Lakshya A':  {sub:'Grammar',                        staff:'Miss Geetanjali'},
    't_0745|Lakshya B':  {sub:'Passage',                        staff:'Miss Bidyarani'},
    't_0745|Umeed A':    {sub:'',                               staff:''},
    't_0745|Umeed B':    {sub:'Maths I',                        staff:'Sir Romesh'},
    't_0745|Elite':      {sub:'Reasoning',                      staff:'Sir Bidyachandra'},
    't_0745|Prime':      {sub:'Science',                        staff:'Sir Shrinivash'},
    /* 5:30 – 6:20 PM */
    't_1730|Achiever A': {sub:'Reasoning',                      staff:'Sir Umesh'},
    't_1730|Achiever B': {sub:'Maths I Practice',               staff:'Miss Fedrava'},
    't_1730|Leader A':   {sub:'Maths II with Practice Session', staff:'Sir Himan'},
    't_1730|Leader B':   {sub:'Science',                        staff:'Sir Arunkumar'},
    't_1730|Champion A': {sub:'Maths Class',                    staff:'Sir Bronson'},
    't_1730|Champion B': {sub:'Mental',                         staff:'Sir Shrinivash'},
    't_1730|Lakshya A':  {sub:'Meitei Mayek',                   staff:'Miss Bidyarani'},
    't_1730|Lakshya B':  {sub:'Maths Practice',                 staff:'Sir Romesh'},
    't_1730|Umeed A':    {sub:'Mental',                         staff:'Sir Shrinivash'},
    't_1730|Umeed B':    {sub:'Maths Class',                    staff:'Sir Bronson'},
    't_1730|Elite':      {sub:'',                               staff:''},
    't_1730|Prime':      {sub:'',                               staff:''},
    /* 6:30 – 7:15 PM */
    't_1830|Achiever A': {sub:'Grammar',                        staff:'Sir Adison'},
    't_1830|Achiever B': {sub:'Reasoning',                      staff:'Sir Umesh'},
    't_1830|Leader A':   {sub:'Maths II',                       staff:'Sir James'},
    't_1830|Leader B':   {sub:'Maths I Practice',               staff:'Sir Bidyachandra'},
    't_1830|Champion A': {sub:'Maths II Practice/Doubt Session',staff:'Miss Geetanjali'},
    't_1830|Champion B': {sub:'Maths II Practice/Doubt Session',staff:'Miss Devia'},
    't_1830|Lakshya A':  {sub:'Hindi',                          staff:'Sir Hindi'},
    't_1830|Lakshya B':  {sub:'Vocabulary',                     staff:'Sir Arjun'},
    't_1830|Umeed A':    {sub:'Vocabulary',                     staff:'Sir Arjun'},
    't_1830|Umeed B':    {sub:'Hindi',                          staff:'Sir Hindi'},
    't_1830|Elite':      {sub:'',                               staff:''},
    't_1830|Prime':      {sub:'',                               staff:''},
    /* 7:15 – 8:00 PM */
    't_1915|Achiever A': {sub:'Maths I Practice',               staff:'Miss Fedrava'},
    't_1915|Achiever B': {sub:'Grammar',                        staff:'Sir Adison'},
    't_1915|Leader A':   {sub:'Grammar',                        staff:'Sir Bidyachandra'},
    't_1915|Leader B':   {sub:'Maths I',                        staff:'Sir Shrinivash'},
    't_1915|Champion A': {sub:'Maths II',                       staff:'Sir James'},
    't_1915|Champion B': {sub:'',                               staff:''},
    't_1915|Lakshya A':  {sub:'Maths Practice',                 staff:'Sir Romesh'},
    't_1915|Lakshya B':  {sub:'Meitei Mayek',                   staff:'Miss Bidyarani'},
    't_1915|Umeed A':    {sub:'',                               staff:''},
    't_1915|Umeed B':    {sub:'',                               staff:''},
    't_1915|Elite':      {sub:'',                               staff:''},
    't_1915|Prime':      {sub:'',                               staff:''},
    /* DINNER break — no entries */
    /* 9:00 – 9:35 PM */
    't_2100|Achiever A': {sub:'Vocabulary',                     staff:'Sir Adison'},
    't_2100|Achiever B': {sub:'Science & GK',                   staff:'Miss Devia'},
    't_2100|Leader A':   {sub:'Science & GK',                   staff:'Sir Shrinivash'},
    't_2100|Leader B':   {sub:'Vocabulary',                     staff:'Sir James'},
    't_2100|Champion A': {sub:'Science & GK',                   staff:'Miss Bidyarani'},
    't_2100|Champion B': {sub:'Vocabulary',                     staff:'Sir Romesh'},
    't_2100|Lakshya A':  {sub:'Maths I Practice/Doubt Session', staff:'Sir Umesh'},
    't_2100|Lakshya B':  {sub:'Maths I Practice/Doubt Session', staff:'Sir Bidyachandra'},
    't_2100|Umeed A':    {sub:'Grammar Practice',               staff:'Miss Fredava'},
    't_2100|Umeed B':    {sub:'Grammar Practice',               staff:'Miss Geetanjali'},
    't_2100|Elite':      {sub:'',                               staff:''},
    't_2100|Prime':      {sub:'',                               staff:''},
    /* 9:35 – 10:10 PM */
    't_2135|Achiever A': {sub:'Science & GK',                   staff:'Miss Devia'},
    't_2135|Achiever B': {sub:'Vocabulary',                     staff:'Sir Adison'},
    't_2135|Leader A':   {sub:'Vocabulary',                     staff:'Sir James'},
    't_2135|Leader B':   {sub:'Science & GK',                   staff:'Sir Shrinivash'},
    't_2135|Champion A': {sub:'Vocabulary',                     staff:'Sir Romesh'},
    't_2135|Champion B': {sub:'Science & GK',                   staff:'Miss Bidyarani'},
    't_2135|Lakshya A':  {sub:'',                               staff:''},
    't_2135|Lakshya B':  {sub:'',                               staff:''},
    't_2135|Umeed A':    {sub:'',                               staff:''},
    't_2135|Umeed B':    {sub:'',                               staff:''},
    't_2135|Elite':      {sub:'',                               staff:''},
    't_2135|Prime':      {sub:'',                               staff:''}
  };
  return def;
}
function saveDSTT(tt){localStorage.setItem('ims_dstt',JSON.stringify(tt));if(typeof gnsiKVPush==='function')gnsiKVPush('ims_dstt',tt);}
/* -- UI state -- */
var dsTTEditCell=null;   // {sessId, day}
var dsModal=null;        // null | 'addSession' | 'editSession:id' | 'fillRow:sessId' | 'addDay' | 'editDay:old'
var DS_PALETTE=['#d4a853','#3b78c9','#8b5cf6','#1a6b55','#dc2626','#0891b2','#ea580c','#db2777','#16a34a','#059669'];
/* -- MAIN RENDER -- */
function renderDoubtTT(){
  var sessions = loadDSSessions();
  var days     = loadDSDays();
  var tt       = loadDSTT();
  var isDsAdmin = _isAdminOrArunkumar();

  /* ── group batches: pair A/B columns under one header ── */
  var batchGroups=[
    {label:'Achiever Batch\n(Combined)',  color:'#8b5cf6', cols:['Achiever A','Achiever B']},
    {label:'Leader Batch\n(Sainik)',      color:'#1a6b55', cols:['Leader A','Leader B']},
    {label:'Champion Batch\n(Sainik)',    color:'#0891b2', cols:['Champion A','Champion B']},
    {label:'Lakshya Batch\n(Navodaya)',   color:'#3b78c9', cols:['Lakshya A','Lakshya B']},
    {label:'Umeed Batch\n(Navodaya)',     color:'#0e7490', cols:['Umeed A','Umeed B']},
    {label:'Elite Batch\n(Foundation)',   color:'#d4a853', cols:['Elite']},
    {label:'Prime Batch\n(Foundation)',   color:'#dc2626', cols:['Prime']}
  ];

  /* ── build header rows ── */
  /* Row 1: batch group spans */
  var headerRow1 = '<tr>'
    + '<th rowspan="2" class="thdr" style="position:sticky;left:0;z-index:4;background:var(--accent);font-size:10px;font-weight:700;text-align:left;padding:7px 8px">Time</th>'
    + batchGroups.map(function(g){
        return '<th colspan="'+g.cols.length+'" style="text-align:center;background:'+g.color+';color:#fff;font-size:9px;font-weight:700;padding:4px 2px;line-height:1.3;border-left:2px solid rgba(255,255,255,.25)">'
          +g.label.replace('\n','<br>')+'</th>';
      }).join('')
    + '</tr>';
  /* Row 2: A / B sub-labels */
  var headerRow2 = '<tr>'
    + batchGroups.map(function(g){
        return g.cols.map(function(c, ci){
          var sub = g.cols.length > 1 ? (ci===0 ? 'A' : 'B') : '';
          return '<th style="text-align:center;background:'+g.color+'cc;color:#fff;font-size:9px;font-weight:700;padding:3px 2px;border-left:'+(ci===0?'2px solid rgba(255,255,255,.25)':'1px solid rgba(255,255,255,.15)')+'">'
            +sub+'</th>';
        }).join('');
      }).join('')
    + '</tr>';

  /* ── flatten columns list ── */
  var allCols = [];
  batchGroups.forEach(function(g){ g.cols.forEach(function(c){ allCols.push({key:c, color:g.color}); }); });

  /* ── body rows ── */
  var bodyRows = sessions.map(function(sess){
    if(sess.isBreak){
      return '<tr style="background:#f8fafc"><td colspan="'+(allCols.length+1)+'" style="text-align:center;padding:8px;font-size:11px;font-weight:700;color:#6b7280;letter-spacing:.1em;position:sticky;left:0">⸺ '+sess.breakLabel+' ⸺</td></tr>';
    }
    var timeColor = sess.color;
    var cells = allCols.map(function(col){
      var k    = sess.id + '|' + col.key;
      var cell = tt[k] || {sub:'', staff:''};
      var has  = cell.sub || cell.staff;
      return '<td onclick="'+(isDsAdmin?'dsOpenEdit(\''+esc(sess.id)+'\',\''+esc(col.key)+'\')':'return')+'" '
        +'style="text-align:center;padding:4px 3px;cursor:'+(isDsAdmin?'pointer':'default')+';vertical-align:top;transition:background .15s;border-right:1px solid var(--border-soft);border-left:1px solid rgba(0,0,0,.04)" '
        +'onmouseenter="'+(isDsAdmin?'this.style.background=\''+col.color+'18\'':'')+'" onmouseleave="this.style.background=\'\'" title="'+(isDsAdmin?'Click to edit':'')+'">'
        + (has
           ? '<div style="font-size:9.5px;font-weight:700;color:'+col.color+';line-height:1.3">'+esc(cell.sub)+'</div>'
             +'<div style="font-size:9px;color:var(--muted);margin-top:1px;line-height:1.3">'+esc(cell.staff)+'</div>'
           : (isDsAdmin ? '<span style="font-size:18px;opacity:.15;color:'+col.color+'">+</span>' : ''))
        + '</td>';
    }).join('');

    return '<tr style="border-top:1px solid var(--border-soft)">'
      +'<td class="tcol" style="border-right-color:'+timeColor+'!important;vertical-align:middle">'
        +'<div style="font-family:\'JetBrains Mono\',monospace;font-size:9.5px;font-weight:700;color:'+timeColor+';white-space:nowrap">'+esc(sess.time)+'</div>'
        +(isDsAdmin
          ? '<div style="display:flex;gap:2px;margin-top:3px">'
            +'<button onclick="dsOpenFillRow(\''+esc(sess.id)+'\')" title="Fill row" style="font-size:8px;padding:1px 4px;border-radius:3px;border:1px solid var(--border);background:var(--surface2);cursor:pointer;color:var(--accent);font-weight:700">≡</button>'
            +'<button onclick="dsClearRow(\''+esc(sess.id)+'\')" title="Clear row" style="font-size:8px;padding:1px 4px;border-radius:3px;border:1px solid #fca5a5;background:transparent;cursor:pointer;color:#dc2626;font-weight:700">✕</button>'
            +'</div>'
          : '')
      +'</td>'
      +cells
    +'</tr>';
  }).join('');

  /* ── cell edit modal ── */
  var modalHTML = '';
  if(dsTTEditCell && !dsModal){
    var sessMeta = sessions.find(function(s){return s.id===dsTTEditCell.sessId;})||{label:'',color:'#888',time:''};
    var batchColor = (DS_BATCH_COLORS && DS_BATCH_COLORS[dsTTEditCell.day]) || '#1433a8';
    var batchLabel = (DS_BATCH_LABELS && DS_BATCH_LABELS[dsTTEditCell.day]) || dsTTEditCell.day;
    var cellKey = dsTTEditCell.sessId+'|'+dsTTEditCell.day;
    var cur = tt[cellKey]||{sub:'',staff:''};
    modalHTML = dsModalWrap(
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">'
        +'<div style="width:12px;height:12px;border-radius:50%;background:'+batchColor+';flex-shrink:0"></div>'
        +'<div>'
          +'<div style="font-size:15px;font-weight:700;color:var(--text)">'+esc(batchLabel)+'</div>'
          +'<div style="font-size:11px;color:var(--muted);font-family:\'JetBrains Mono\',monospace">'+esc(sessMeta.time)+'</div>'
        +'</div>'
        +'<button onclick="dsTTEditCell=null;render()" style="margin-left:auto;background:none;border:none;font-size:22px;cursor:pointer;color:var(--muted);line-height:1">&times;</button>'
      +'</div>'
      +'<div class="form-group" style="margin-bottom:14px"><label>Subject / Activity</label>'
        +'<input id="ds-sub-inp" list="ds-sub-list" value="'+esc(cur.sub)+'" placeholder="e.g. Mathematics" autocomplete="off"/>'
        +'<datalist id="ds-sub-list">'+DS_SUBJECTS_LIST.map(function(s){return'<option>'+s+'</option>'}).join('')+'</datalist>'
      +'</div>'
      +'<div class="form-group" style="margin-bottom:20px"><label>Staff / Incharge</label>'
        +'<input id="ds-sta-inp" list="ds-sta-list" value="'+esc(cur.staff)+'" placeholder="e.g. Sir Bikey" autocomplete="off"/>'
        +'<datalist id="ds-sta-list">'+staff.map(function(s){return'<option>'+esc(s.name)+'</option>'}).join('')+'</datalist>'
      +'</div>'
      +'<div style="display:flex;gap:10px">'
        +'<button class="btn btn-primary" onclick="dsSaveEdit()" style="flex:1">✓ Save</button>'
        +'<button class="btn btn-outline" onclick="dsClearCell()" style="color:#dc2626;border-color:#fca5a5">Clear</button>'
        +'<button class="btn btn-outline" onclick="dsTTEditCell=null;render()">Cancel</button>'
      +'</div>',
      'dsTTEditCell=null;render()'
    );
  }
  /* Fill row modal */
  if(dsModal && dsModal.indexOf('fillRow:')===0){
    var fillSessId = dsModal.replace('fillRow:','');
    var fillSess   = sessions.find(function(s){return s.id===fillSessId;})||{label:'',color:'#888',time:''};
    modalHTML = dsModalWrap(
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">'
        +'<div style="font-size:15px;font-weight:700;color:var(--text)">Fill All Batches — '+esc(fillSess.time)+'</div>'
        +'<button onclick="dsModal=null;render()" style="margin-left:auto;background:none;border:none;font-size:22px;cursor:pointer;color:var(--muted);line-height:1">&times;</button>'
      +'</div>'
      +'<div style="font-size:12.5px;color:var(--muted);margin-bottom:18px;background:var(--surface2);border-radius:8px;padding:10px 14px;border-left:3px solid '+fillSess.color+'\">Overwrites all '+allCols.length+' batch columns for this time slot.</div>'
      +'<div class="form-group" style="margin-bottom:14px"><label>Subject / Activity (all batches)</label>'
        +'<input id="ds-fill-sub" list="ds-fill-sub-list" placeholder="e.g. Doubt Clearing" autocomplete="off"/>'
        +'<datalist id="ds-fill-sub-list">'+DS_SUBJECTS_LIST.map(function(s){return'<option>'+s+'</option>'}).join('')+'</datalist>'
      +'</div>'
      +'<div class="form-group" style="margin-bottom:20px"><label>Staff / Incharge (all batches)</label>'
        +'<input id="ds-fill-sta" list="ds-fill-sta-list" placeholder="e.g. Sir Bikey" autocomplete="off"/>'
        +'<datalist id="ds-fill-sta-list">'+staff.map(function(s){return'<option>'+esc(s.name)+'</option>'}).join('')+'</datalist>'
      +'</div>'
      +'<div style="display:flex;gap:10px">'
        +'<button class="btn btn-primary" onclick="dsFillRowSave(\''+esc(fillSessId)+'\')" style="flex:1">✓ Fill All Batches</button>'
        +'<button class="btn btn-outline" onclick="dsModal=null;render()">Cancel</button>'
      +'</div>',
      'dsModal=null;render()'
    );
  }

  /* ── incharge card ── */
  var inchargeHTML = '<div class="card" style="margin-top:20px">'
    +'<div class="card-head"><span class="card-title">Doubt Session Incharge</span></div>'
    +'<div style="padding:16px 22px;display:flex;gap:16px;flex-wrap:wrap">'
    +[]  /* Doubt session incharge staff configured per school — loaded from Supabase */
      .map(function(x){
        return '<div style="display:flex;align-items:center;gap:12px;padding:10px 16px;background:var(--surface2);border-radius:10px;border:1px solid var(--border);flex:1;min-width:240px">'
          +avatarHTML(x.n,36)
          +'<div><div style="font-weight:700;font-size:13.5px">'+esc(x.n)+'</div><div style="font-size:11.5px;color:var(--muted)">'+esc(x.r)+'</div></div>'
        +'</div>';
      }).join('')
    +'</div></div>';

  var totalCols = allCols.length;
  return '<div style="margin-bottom:18px;display:flex;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;gap:12px">'
      +'<div>'
        +'<div style="font-family:\'JetBrains Mono\',monospace;font-size:10px;color:var(--muted);letter-spacing:.14em;text-transform:uppercase;margin-bottom:4px">GNSI — BOARDING SECTION</div>'
        +'<div style="font-size:24px;font-family:\'Playfair Display\',serif;font-weight:700;color:var(--text)">Doubt Session Timetable</div>'
        +'<div style="font-size:12.5px;color:var(--muted);margin-top:4px">'+(sessions.filter(function(s){return !s.isBreak;}).length)+' time slots &nbsp;·&nbsp; '+totalCols+' batches &nbsp;·&nbsp; '+(isDsAdmin?'Click any cell to edit':'View only')+'</div>'
      +'</div>'
      +(isDsAdmin
        ?'<div style="display:flex;gap:8px;flex-wrap:wrap">'
          +'<button class="btn btn-outline" onclick="dsResetDefault()" style="font-size:12px;padding:7px 14px;color:#dc2626;border-color:#fca5a5">↺ Reset to Default</button>'
        +'</div>'
        :'<div style="background:var(--surface2);border:1px solid var(--border-soft);border-radius:10px;padding:8px 14px;font-size:12px;color:var(--muted)">👁 View Only</div>')
    +'</div>'
    +'<div class="card" style="overflow:hidden">'
    +'<style>.gnsi-dstt{width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}'
    +'.gnsi-dstt table{width:100%;min-width:'+(90+totalCols*68)+'px;border-collapse:collapse;table-layout:fixed}'
    +'.gnsi-dstt th,.gnsi-dstt td{padding:4px 3px;font-size:9.5px;word-break:break-word;white-space:normal;vertical-align:top;line-height:1.3}'
    +'.gnsi-dstt .tcol{width:88px;min-width:88px;max-width:88px;padding:5px 6px;position:sticky;left:0;z-index:1;background:var(--surface);border-right:3px solid #e2e8f0}'
    +'.gnsi-dstt .thdr{width:88px;min-width:88px;max-width:88px}'
    +'</style>'
    +'<div class="gnsi-dstt"><table>'
      +'<thead>'+headerRow1+headerRow2+'</thead>'
      +'<tbody>'+bodyRows+'</tbody>'
    +'</table></div></div>'
    +inchargeHTML
    +modalHTML;
}

function dsModalWrap(content, closeCall){
  return '<div style="position:fixed;inset:0;background:rgba(10,18,41,.48);z-index:200;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)" onclick="if(event.target===this){'+closeCall+'}">'
    +'<div style="background:var(--surface);border-radius:16px;padding:28px;width:460px;max-width:95vw;box-shadow:var(--shadow2);animation:pageIn .2s ease" onclick="event.stopPropagation()">'
    +content
    +'</div></div>';
}
/* -- CELL EDIT -- */
function dsOpenEdit(sessId,day){
  dsTTEditCell={sessId:sessId,day:day};dsModal=null;render();
  setTimeout(function(){var el=document.getElementById('ds-sub-inp');if(el)el.focus()},50);
}
function dsSaveEdit(){
  if(!dsTTEditCell)return;
  var sub=((document.getElementById('ds-sub-inp')||{}).value||'').trim();
  var sta=((document.getElementById('ds-sta-inp')||{}).value||'').trim();
  var tt=loadDSTT();
  tt[dsTTEditCell.sessId+'|'+dsTTEditCell.day]={sub:sub,staff:sta};
  saveDSTT(tt);dsTTEditCell=null;render();
}
function dsClearCell(){
  if(!dsTTEditCell)return;
  var tt=loadDSTT();
  delete tt[dsTTEditCell.sessId+'|'+dsTTEditCell.day];
  saveDSTT(tt);dsTTEditCell=null;render();
}
/* -- FILL ROW (modal version) -- */
function dsOpenFillRow(sessId){dsModal='fillRow:'+sessId;dsTTEditCell=null;render();setTimeout(function(){var el=document.getElementById('ds-fill-sub');if(el)el.focus()},50);}
function dsFillRowSave(sessId){
  var sub=((document.getElementById('ds-fill-sub')||{}).value||'').trim();
  var sta=((document.getElementById('ds-fill-sta')||{}).value||'').trim();
  var days=loadDSDays();var tt=loadDSTT();
  days.forEach(function(d){tt[sessId+'|'+d]={sub:sub,staff:sta}});
  saveDSTT(tt);dsModal=null;render();
}
function dsClearRow(sessId){
  if(!confirm('Clear all day entries for this session?'))return;
  var days=loadDSDays();var tt=loadDSTT();
  days.forEach(function(d){delete tt[sessId+'|'+d]});
  saveDSTT(tt);render();
}
/* -- SESSION CRUD -- */
function dsEditSession(id){dsModal='editSession:'+id;dsTTEditCell=null;render();setTimeout(function(){var el=document.getElementById('ds-sess-label');if(el)el.focus()},50);}
function dsSaveSession(editId){
  var label=((document.getElementById('ds-sess-label')||{}).value||'').trim();
  var time=((document.getElementById('ds-sess-time')||{}).value||'').trim();
  var icon=((document.getElementById('ds-sess-icon')||{}).value||'📚').trim();
  var color=((document.getElementById('ds-sess-color')||{}).value||'#3b78c9').trim();
  if(!label||!time){showToast('⚠️ Session name and time are required.','#ea580c');return;}
  var sessions=loadDSSessions();
  if(editId){
    sessions=sessions.map(function(s){return s.id===editId?{id:s.id,label:label,time:time,icon:icon,color:color}:s;});
  } else {
    var newId='ds_'+Date.now();
    sessions.push({id:newId,label:label,time:time,icon:icon,color:color});
  }
  saveDSSessions(sessions);dsModal=null;render();
}
function dsDeleteSession(id){
  if(!_isAdminOrArunkumar()){showToast('🔒 Only Admin can delete sessions.','#dc2626');return;}
  var sessions=loadDSSessions();
  if(sessions.length<=1){alert('Cannot delete the last session.');return;}
  if(!confirm('Delete this session and all its data?'))return;
  sessions=sessions.filter(function(s){return s.id!==id;});
  saveDSSessions(sessions);
  var days=loadDSDays();var tt=loadDSTT();
  days.forEach(function(d){delete tt[id+'|'+d]});
  saveDSTT(tt);dsModal=null;render();
}
function dsMoveSession(id,dir){
  var sessions=loadDSSessions();
  var i=sessions.findIndex(function(s){return s.id===id;});
  if(i<0)return;var ni=i+dir;
  if(ni<0||ni>=sessions.length)return;
  var tmp=sessions[i];sessions[i]=sessions[ni];sessions[ni]=tmp;
  saveDSSessions(sessions);render();
}
/* -- DAY CRUD -- */
function dsSaveDay(oldVal){
  var newVal=((document.getElementById('ds-day-inp')||{}).value||'').trim();
  if(!newVal){alert('Day label is required.');return;}
  var days=loadDSDays();
  if(oldVal){
    // rename - update TT keys too
    var tt=loadDSTT();
    var sessions=loadDSSessions();
    sessions.forEach(function(s){
      var ok=s.id+'|'+oldVal;var nk=s.id+'|'+newVal;
      if(tt[ok]!==undefined){tt[nk]=tt[ok];delete tt[ok];}
    });
    saveDSTT(tt);
    days=days.map(function(d){return d===oldVal?newVal:d;});
  } else {
    if(days.indexOf(newVal)>=0){alert('This day already exists.');return;}
    days.push(newVal);
  }
  saveDSDays(days);dsModal=null;render();
}
function dsEditDay(d){dsModal='editDay:'+d;dsTTEditCell=null;render();setTimeout(function(){var el=document.getElementById('ds-day-inp');if(el)el.focus()},50);}
function dsRemoveDay(d){
  var days=loadDSDays();
  if(days.length<=1){alert('Cannot remove the last day column.');return;}
  if(!confirm('Remove day "'+d+'" and all its entries?'))return;
  var sessions=loadDSSessions();var tt=loadDSTT();
  sessions.forEach(function(s){delete tt[s.id+'|'+d]});
  saveDSTT(tt);
  saveDSDays(days.filter(function(x){return x!==d;}));
  dsModal=null;render();
}
/* -- RESET -- */
function dsResetDefault(){
  if(!confirm('Reset all doubt session data (sessions, days, timetable) to defaults?'))return;
  localStorage.removeItem('ims_dstt');
  localStorage.removeItem('ims_ds_sessions');
  localStorage.removeItem('ims_ds_days');
  // Push [] to cloud so other devices also get the reset (prevents KV restore loop)
  if(typeof gnsiKVPush==='function'){gnsiKVPush('ims_dstt',[]);gnsiKVPush('ims_ds_sessions',[]);gnsiKVPush('ims_ds_days',[]);}
  gnsiMarkLocalSave(20000); // 20s guard -- prevents KV poll from immediately restoring old data
  dsTTEditCell=null;dsModal=null;render();
}
/* -- DUTY HOURS -- storage helpers -- */
function loadDutyData(){
  var s=localStorage.getItem('ims_dutydata');
  if(s){try{return JSON.parse(s)}catch(e){}}
  return [];
  /* Duty roster is configured per school after login. No hardcoded entries. */
}
function saveDutyData(d){localStorage.setItem('ims_dutydata',JSON.stringify(d));if(typeof gnsiKVPush==='function')gnsiKVPush('ims_dutydata',d);}
var dutyEditId=null;
var dutyAddForm=false;
var dutyNewData={post:'',from:'',to:'',shift:'Full Shift',staff:'',color:'#1a6b55'};
