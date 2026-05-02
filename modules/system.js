/* GNSI PORTAL — modules/system.js
   Pages: sync, settings, aiassistant, analytics, assets, backup, storage_manager
   DEPENDS ON: core/utils.js, core/state.js */

function renderSync(){
  /* BLANK-PAGE GUARD: if anything inside crashes, show a clear error instead of blank */
  try {
  var conf=syncConf;
  /* ── FIX: show the most recent sync time across BOTH Supabase and Firebase.
     conf.lastSync was previously only stamped by Firebase push. Now also
     stamped by pushToSupabase(), so this will show the real last cloud write. */
  var _lastSyncRaw = conf.lastSync || null;
  /* Also check KV bulk timestamp as a fallback (set by gnsiKVPushAll) */
  try {
    var _kvTs = localStorage.getItem('gnsi_kv_bulk_ts');
    if (_kvTs && (!_lastSyncRaw || _kvTs > _lastSyncRaw)) _lastSyncRaw = _kvTs;
  } catch(e) {}
  var lastSync = _lastSyncRaw ? new Date(_lastSyncRaw).toLocaleString('en-IN') : 'Never';
  var lastSyncDevice = conf.lastSyncDevice || 'this device';
  /* FREEZE FIX v8: estimate size from known arrays + a few localStorage keys
     instead of JSON.stringify(getAllData()) which blocks the main thread. */
  var _sizeEst = (JSON.stringify(staff||[])+JSON.stringify(students||[])+JSON.stringify(notices||[])+JSON.stringify(attendance||{})).length;
  try{ _sizeEst += (localStorage.getItem('ims_gnsi_periods')||'').length + (localStorage.getItem('ims_dstt')||'').length + (localStorage.getItem('ims_advances')||'').length; }catch(e){}
  var dataSize=(_sizeEst/1024).toFixed(1);
  var statusHTML='';
  if(syncStatus==='syncing')
    statusHTML='<div style="padding:11px 16px;background:#eff6ff;border:1px solid #93c5fd;border-radius:9px;color:#1d4ed8;font-size:13px;font-weight:600;display:flex;align-items:center;gap:10px;margin-bottom:18px"><span style="display:inline-block;width:14px;height:14px;border:2.5px solid #93c5fd;border-top-color:#1d4ed8;border-radius:50%;animation:spin 0.8s linear infinite"></span>'+syncMsg+'</div>';
  else if(syncStatus==='success')
    statusHTML='<div style="padding:11px 16px;background:#f0fdf4;border:1px solid #86efac;border-radius:9px;color:#16a34a;font-size:13px;font-weight:600;margin-bottom:18px">'+syncMsg+'</div>';
  else if(syncStatus==='error')
    statusHTML='<div style="padding:11px 16px;background:#fef2f2;border:1px solid #fca5a5;border-radius:9px;color:#dc2626;font-size:13px;font-weight:600;margin-bottom:18px">'+syncMsg+'</div>';
  else if(syncStatus==='live')
    statusHTML='<div style="padding:11px 16px;background:#f5f3ff;border:1px solid #c4b5fd;border-radius:9px;color:#7c3aed;font-size:13px;font-weight:600;margin-bottom:18px;display:flex;align-items:center;gap:10px"><span style="width:10px;height:10px;border-radius:50%;background:#7c3aed;display:inline-block;animation:pulse-dot 1.4s ease-in-out infinite"></span>'+syncMsg+'</div>';
  var logRows=(syncLog||[]).slice(0,20).map(function(l){
    var c=l.result==='Success'||l.result==='Started'?'#16a34a':l.result==='Stopped'||l.result==='Failed'?'#dc2626':'#d4a853';
    return '<tr><td style="font-family:\'JetBrains Mono\',monospace;font-size:11px;color:var(--muted);">'+esc(l.ts)+'</td><td style="font-weight:700">'+esc(l.action)+'</td><td><span style="color:'+c+';font-weight:700">'+esc(l.result)+'</span></td><td style="font-size:12px;color:var(--muted)">'+esc(l.detail)+'</td></tr>';
  }).join('');
  return '<div style="margin-bottom:20px">'+
    '<div style="font-family:\'JetBrains Mono\',monospace;font-size:10px;color:var(--muted);letter-spacing:.14em;text-transform:uppercase;margin-bottom:4px">GNSI -- SYNC & BACKUP</div>'+
    '<div style="font-size:24px;font-family:\'Playfair Display\',serif;font-weight:700;color:var(--text)">Real-Time Cloud Sync</div>'+
    '<div style="font-size:13px;color:var(--muted);margin-top:4px">Powered by Supabase — all sections sync instantly across every staff device</div>'+
  '</div>'+
  '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:12px 18px;background:linear-gradient(135deg,#0b1e6e08,#1433a808);border:1.5px solid #1433a822;border-radius:12px;margin-bottom:16px">'+
    '<div style="width:10px;height:10px;border-radius:50%;background:#16a34a;box-shadow:0 0 6px #16a34a;flex-shrink:0;animation:pulse-dot 1.4s ease-in-out infinite"></div>'+
    '<div style="font-size:13px;font-weight:700;color:#16a34a">Realtime Engine Active</div>'+
    '<div style="font-size:12px;color:var(--muted);margin-left:4px">8 live channels monitoring every table</div>'+
    '<div id="_gnsiDeviceCount" style="margin-left:auto;font-size:12px;font-weight:700;color:var(--accent);background:var(--accent-light);padding:3px 10px;border-radius:20px;border:1px solid var(--accent)33">—</div>'+
  '</div>'+
  statusHTML+
  '<div class="stat-grid" style="margin-bottom:20px">'+
    '<div class="stat-card" style="--c:var(--accent)"><div class="stat-label">Data Size</div><div class="stat-val" style="font-size:28px">'+dataSize+'<span style="font-size:14px">KB</span></div><div class="stat-sub">Current snapshot</div></div>'+
    '<div class="stat-card" style="--c:#16a34a"><div class="stat-label">Last Sync</div><div class="stat-val" style="font-size:16px;line-height:1.3">'+lastSync+'</div><div class="stat-sub">From '+esc(lastSyncDevice)+'</div></div>'+
    '<div class="stat-card" style="--c:#7c3aed"><div class="stat-label">Cloud Status</div><div class="stat-val" style="font-size:22px"><span style="color:#7c3aed">☁️ CLOUD</span></div><div class="stat-sub">All data in Supabase</div></div>'+
    '<div class="stat-card" style="--c:#d4a853"><div class="stat-label">Records</div><div class="stat-val" style="font-size:28px">'+(staff.length+students.length)+'</div><div class="stat-sub">Staff + Students</div></div>'+
  '</div>'+

  '<div class="card" style="margin-bottom:20px">'+
    '<div class="card-head" style="background:linear-gradient(135deg,#f0fdf4,#f5fffe)">'+
      '<div><span class="card-title" style="color:#16a34a">☁️ Supabase Cloud — Active (Cloud Mode)</span>'+
      '<div style="font-size:11.5px;color:var(--muted);margin-top:2px">All data stored exclusively in Supabase — no local-only data. Changes sync instantly across all devices.</div></div>'+
      '<a href="https://supabase.com/dashboard/project/pwrldrngqxbvwfztxxrd" target="_blank" style="font-size:11px;color:var(--accent);text-decoration:none;font-weight:600;border:1px solid var(--border);padding:5px 11px;border-radius:7px;white-space:nowrap">Open Supabase Dashboard ↗</a>'+
    '</div>'+
    '<div style="padding:22px">'+
      '<div style="background:linear-gradient(135deg,#eff6ff,#f0f9ff);border:1.5px solid #93c5fd;border-radius:10px;padding:16px 20px;margin-bottom:20px">'+
        '<div style="font-size:13px;font-weight:700;color:#1d4ed8;margin-bottom:12px">☁️ Cloud Mode — What this means:</div>'+
        '<div style="font-size:12.5px;color:var(--text);line-height:2">'+
          '✅ Every save immediately writes to Supabase KV or dedicated tables<br>'+
          '✅ Any device that opens this portal sees the same data instantly<br>'+
          '✅ No data is stored only on one device — all staff see live data<br>'+
          '✅ Offline changes are queued and pushed when connection restores<br>'+
          '🔒 Session tokens &amp; passwords remain device-local for security'+
        '</div>'+
      '</div>'+
      '<div style="background:linear-gradient(135deg,#f0fdf4,#f5fffe);border:1.5px solid #86efac;border-radius:10px;padding:16px 20px;margin-bottom:20px">'+
        '<div style="font-size:13px;font-weight:700;color:#16a34a;margin-bottom:12px">✅ All data synced to cloud:</div>'+
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12.5px;color:var(--text);line-height:1.9">'+
          '<div>✓ Staff &amp; Students</div><div>✓ Notices</div>'+
          '<div>✓ Attendance</div><div>✓ Fee Payments</div>'+
          '<div>✓ Timetable</div><div>✓ Doubt TT</div>'+
          '<div>✓ Sessions &amp; Classes</div><div>✓ Admissions</div>'+
          '<div>✓ Duty Hours</div><div>✓ Boarder Schedule</div>'+
          '<div>✓ Salary &amp; Advances</div><div>✓ Accounts &amp; Fees</div>'+
          '<div>✓ Exam &amp; Results</div><div>✓ House Master</div>'+
          '<div>✓ Reception</div><div>✓ Roles &amp; Permissions</div>'+
        '</div>'+
      '</div>'+
      '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">'+
        '<button id="gnsi-pull-btn" class="btn btn-primary" onclick="(function(b){b.disabled=true;b.textContent=\'⏳ Pulling…\';loadFromSupabase(function(){b.disabled=false;b.textContent=\'⬇ Pull Latest from Cloud\';showToast(\'✅ All data refreshed from cloud\',\'#16a34a\');});})(this)" style="font-size:13px;background:#16a34a">⬇ Pull Latest from Cloud</button>'+
        '<button id="gnsi-push-btn" class="btn btn-outline" onclick="(function(b){b.disabled=true;b.textContent=\'⏳ Pushing…\';gnsiKVPushAll(function(n){b.disabled=false;b.textContent=\'⬆ Push All to Cloud\';showToast(\'✅ \'+n+\' sections pushed to cloud\',\'#16a34a\');});})( this)" style="font-size:13px;color:#16a34a;border-color:#16a34a">⬆ Push All to Cloud</button>'+
      '</div>'+
    '</div>'+
  '</div>'+
  
  '<div class="card" style="margin-bottom:20px">'+
    '<div class="card-head"><span class="card-title">📱 Multi-Device Real-Time Sync Guide</span></div>'+
    '<div style="padding:20px 24px">'+
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px;margin-bottom:16px">'+
        [
          {icon:'🖥',title:'Admin PC / Office',desc:'Open the portal HTML file in any browser. Logs in → auto-loads cloud data. All changes save to Supabase instantly.',color:'#1433a8'},
          {icon:'📱',title:'Staff Phone',desc:'Open the same HTML file. Data is always up to date from the cloud. No setup needed.',color:'#16a34a'},
          {icon:'💻',title:'Any Laptop / Tablet',desc:'Same HTML file, any browser -- Chrome, Edge, Firefox. Supabase syncs everything automatically.',color:'#7c3aed'},
          {icon:'📟',title:'Any Other Device',desc:'Just open the file and log in. All sections -- timetable, fees, exam, hostel -- are shared live.',color:'#d4a853'}
        ].map(function(d){
          return '<div style="background:var(--surface2);border-radius:10px;padding:16px;border:1px solid var(--border-soft);border-top:3px solid '+d.color+'">'+
            '<div style="font-size:22px;margin-bottom:8px">'+d.icon+'</div>'+
            '<div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:5px">'+d.title+'</div>'+
            '<div style="font-size:12px;color:var(--muted);line-height:1.5">'+d.desc+'</div>'+
          '</div>';
        }).join('')+
      '</div>'+
      '<div style="margin-top:16px;padding:12px 16px;background:#f0fdf4;border:1px solid #86efac;border-radius:9px;font-size:12.5px;color:#166534;line-height:1.8">'+
        '<b>✅ How it works:</b> Every add, edit, or delete is saved to <b>Supabase cloud</b> instantly. When another device opens the portal and logs in, it pulls the latest data automatically. Real-time listeners also push live updates to open sessions within seconds -- no manual sync needed.'+
      '</div>'+
    '</div>'+
  '</div>'+
  
  '<div class="dash-grid" style="margin-bottom:20px">'+
    '<div class="card">'+
      '<div class="card-head" style="background:linear-gradient(135deg,#f0fdf4,#f5fffe)">'+
        '<div><span class="card-title" style="color:#16a34a">⬇ Export Backup</span><div style="font-size:11.5px;color:var(--muted);margin-top:2px">Download all data as a JSON file</div></div>'+
      '</div>'+
      '<div style="padding:22px">'+
        '<div style="margin-bottom:16px;padding:14px;background:var(--surface2);border-radius:10px;border:1px solid var(--border);font-size:12px;color:var(--muted);line-height:1.8">'+
          '✓ '+staff.length+' Staff &nbsp; ✓ '+students.length+' Students &nbsp; ✓ '+notices.length+' Notices<br>✓ Attendance &nbsp; ✓ Timetables &nbsp; ✓ Salary & Advances'+
        '</div>'+
        '<button class="btn btn-primary" onclick="syncExport()" style="width:100%;font-size:13px;padding:11px;background:#16a34a">⬇ Download JSON Backup</button>'+
      '</div>'+
    '</div>'+
    '<div class="card">'+
      '<div class="card-head" style="background:linear-gradient(135deg,#fff7ed,#fefce8)">'+
        '<div><span class="card-title" style="color:#ea580c">⬆ Restore from File</span><div style="font-size:11.5px;color:var(--muted);margin-top:2px">Upload a previously downloaded backup</div></div>'+
      '</div>'+
      '<div style="padding:22px">'+
        '<div style="margin-bottom:14px;padding:14px;border:2px dashed #fdba74;border-radius:10px;background:#fff7ed;text-align:center">'+
          '<div style="font-size:26px;margin-bottom:8px">📁</div>'+
          '<div style="font-size:12.5px;font-weight:600;color:#ea580c;margin-bottom:8px">Choose .json backup file</div>'+
          '<input id="sync-import-file" type="file" accept=".json" style="width:100%;font-size:12px;color:var(--muted)"/>'+
        '</div>'+
        '<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:9px 12px;margin-bottom:12px;font-size:11.5px;color:#dc2626">⚠ <b>Warning:</b> This replaces ALL current data.</div>'+
        '<button class="btn" onclick="syncImport()" style="width:100%;font-size:13px;padding:11px;background:#ea580c;color:#fff">⬆ Restore from File</button>'+
      '</div>'+
    '</div>'+
  '</div>'+
  
  '<div class="card" style="margin-bottom:20px">'+
    '<div class="card-head" style="background:linear-gradient(135deg,#f5f3ff,#fdf4ff)">'+
      '<div><span class="card-title" style="color:#7c3aed">🔑 Offline Sync Code</span><div style="font-size:11.5px;color:var(--muted);margin-top:2px">Transfer data without internet -- copy-paste between devices</div></div>'+
    '</div>'+
    '<div style="padding:22px;display:grid;grid-template-columns:1fr 1fr;gap:20px">'+
      '<div>'+
        '<div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:10px">📤 Generate Code</div>'+
        '<button class="btn btn-primary" onclick="genSyncCode()" style="width:100%;padding:10px;background:#7c3aed;margin-bottom:12px">Generate Sync Code</button>'+
        '<div id="sync-code-box" style="display:none">'+
          '<textarea id="sync-code-out" readonly rows="4" style="width:100%;background:var(--surface2);border:1.5px solid var(--border);border-radius:8px;padding:8px 10px;font-size:10px;font-family:\'JetBrains Mono\',monospace;color:var(--text);resize:none;outline:none;word-break:break-all"></textarea>'+
          '<button id="copy-code-btn" onclick="copySyncCode()" style="margin-top:6px;width:100%;background:#7c3aed;color:#fff;border:none;border-radius:7px;padding:8px;cursor:pointer;font-size:12px;font-weight:700;font-family:\'DM Sans\',sans-serif">📋 Copy Code</button>'+
        '</div>'+
      '</div>'+
      '<div>'+
        '<div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:10px">📥 Apply Code</div>'+
        '<div style="font-size:11px;color:var(--muted);margin-bottom:6px">Paste the sync code from another device:</div>'+
        '<textarea id="sync-code-in" rows="4" placeholder="Paste sync code here..." style="width:100%;background:var(--surface2);border:1.5px solid var(--border);border-radius:8px;padding:8px 10px;font-size:10px;font-family:\'JetBrains Mono\',monospace;color:var(--text);resize:none;outline:none;word-break:break-all;margin-bottom:8px"></textarea>'+
        '<button class="btn" onclick="applySyncCode()" style="width:100%;padding:10px;background:#7c3aed;color:#fff;font-size:12px;font-weight:700">⚡ Apply Code</button>'+
      '</div>'+
    '</div>'+
  '</div>'+
  
  '<div class="card">'+
    '<div class="card-head"><span class="card-title">📋 Sync Activity Log</span>'+
      '<button class="btn-danger-sm" onclick="syncLog=[];localStorage.setItem(\'ims_synclog\',\'[]\');render()">Clear</button>'+
    '</div>'+
    '<div style="overflow-x:auto"><table><thead><tr><th>Timestamp</th><th>Action</th><th>Result</th><th>Detail</th></tr></thead>'+
    '<tbody>'+(logRows||'<tr><td colspan="4" style="text-align:center;padding:28px;color:var(--muted)">No sync operations yet.</td></tr>')+'</tbody></table></div>'+
  '</div>';
  } catch(e) {
    return '<div style="padding:40px;text-align:center;color:#dc2626;font-family:DM Sans,sans-serif">'
      + '<div style="font-size:36px;margin-bottom:12px">⚠️</div>'
      + '<div style="font-size:16px;font-weight:700;margin-bottom:8px">Sync page failed to load</div>'
      + '<div style="font-size:12px;color:#64748b;font-family:JetBrains Mono,monospace;background:#f8fafc;padding:8px 12px;border-radius:8px;margin-bottom:16px">' + (e && e.message ? e.message : String(e)) + '</div>'
      + '<button onclick="location.reload()" style="padding:8px 20px;border-radius:8px;background:#1433a8;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer">🔄 Reload Page</button>'
      + '</div>';
  }
}
// ══════════════════════════════════════════════════════════════
//  REPORTS & EXPORT -- PDF + Excel for all key data
// ══════════════════════════════════════════════════════════════
var rptTab='attendance'; // attendance | staff | students | salary | timetable
var rptAttMonth=new Date().toISOString().slice(0,7);
var gnsiRatingState=(function(){
  var saved=localStorage.getItem('gnsi_staff_rating');
  if(saved){try{return JSON.parse(saved);}catch(e){}}
  return {};
})();
var gnsiRatingDriveMonth=new Date().toISOString().slice(0,7);
var gnsiRatingFilter='All';
var gnsiRatingSort='id';
var gnsiRatingSearch='';
var gnsiRatingEditId=null;
var TQ_QUALITIES=['Lesson Plan Preparation','Board Work and Presentation','Student Engagement','Subject Knowledge','Punctuality to Class','Classroom Management','Assignment and Test Correction','Communication Skills','Student Progress Monitoring','Professional Conduct'];
function rptBuildHTML(title,tableHTML){
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>'+title+'</title>'
    +'<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Cormorant+Garamond:wght@600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">'
    +'<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Nunito,sans-serif;background:#fff;color:#080f26;padding:24px}'
    +'.header{background:linear-gradient(135deg,#091d78,#1435a0);color:#fff;border-radius:12px;padding:20px 28px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between}'
    +'.h-title{font-family:"Cormorant Garamond",serif;font-size:22px;font-weight:700}'
    +'.h-sub{font-size:11px;opacity:.7;font-family:"JetBrains Mono",monospace;margin-top:3px}'
    +'.h-date{font-family:"JetBrains Mono",monospace;font-size:11px;opacity:.75;text-align:right}'
    +'.badge-10{background:linear-gradient(135deg,#e09500,#ffd050);color:#1a0a00;border-radius:20px;padding:3px 10px;font-size:10px;font-weight:800;margin-top:5px;display:inline-block}'
    +'table{width:100%;border-collapse:collapse;margin-top:12px}'
    +'th{background:#1435a0;color:#fff;padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.08em;font-family:"JetBrains Mono",monospace}'
    +'td{padding:9px 12px;border-bottom:1px solid #d4ddf0;font-size:12.5px}'
    +'tr:nth-child(even){background:#f0f4fb}'
    +'.badge{display:inline-flex;padding:2px 9px;border-radius:20px;font-size:10.5px;font-weight:700;font-family:"JetBrains Mono",monospace}'
    +'.footer{margin-top:20px;font-size:11px;color:#6474a0;text-align:center;font-family:"JetBrains Mono",monospace;border-top:1px solid #d4ddf0;padding-top:12px}'
    +'@media print{body{padding:0}.no-print{display:none}}'
    +'<\/style><\/head><body>'
    +'<div class="header"><div>'
      +'<div class="h-title">'+(window.TENANT?window.TENANT.name:'Guidance Navodaya &amp; Sainik Institute')+'</div>'
      +'<div class="h-sub">'+(window.TENANT?window.TENANT.address+' &nbsp;&middot;&nbsp; '+window.TENANT.regNo:'Khangabok Sorok Wangma, Thoubal, Manipur &nbsp;&middot;&nbsp; Regd: 25 of 2016-17')+'</div>'
      +'<div class="badge-10">&#11088; Celebrating 10 Years of Excellence (2016&ndash;2026)</div>'
    +'</div><div class="h-date">'+title+'<br>Generated: '+new Date().toLocaleString('en-IN')+'</div></div>'
    +'<div class="no-print" style="margin-bottom:16px;display:flex;gap:10px">'
      +'<button onclick="window.print()" style="background:#1435a0;color:#fff;border:none;border-radius:8px;padding:9px 20px;cursor:pointer;font-family:Nunito,sans-serif;font-weight:700;font-size:13px">&#128424; Print / Save PDF</button>'
      +'<button onclick="window.close()" style="background:#f0f4fb;color:#3d4f80;border:1px solid #c8d4ee;border-radius:8px;padding:9px 16px;cursor:pointer;font-family:Nunito,sans-serif;font-weight:700;font-size:13px">Close</button>'
    +'</div>'
    +tableHTML
    +'<div class="footer">'+(window.TENANT?window.TENANT.name:'Guidance Navodaya &amp; Sainik Institute')+' &nbsp;&middot;&nbsp; Generated on '+new Date().toLocaleString('en-IN')+'</div>'
    +'<\/body><\/html>';
}
function rptOpenWindow(title,tableHTML){
  var w=window.open('','_blank','width=900,height=700');
  if(!w){alert('Please allow popups to view the report.');return}
  w.document.write(rptBuildHTML(title,tableHTML));
  w.document.close();
}
function csvEsc(v){var s=String(v===null||v===undefined?'':v);return s.includes(',')||s.includes('"')||s.includes('\n')?'"'+s.replace(/"/g,'""')+'"':s}
function downloadCSV(filename,rows){
  var csv=rows.map(function(r){return r.map(csvEsc).join(',')}).join('\r\n');
  var blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');a.href=url;a.download=filename;
  document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
}
/* -- XLSX via SheetJS CDN -- */
function loadSheetJS(cb){
  if(window.XLSX){cb();return}
  var s=document.createElement('script');
  s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  s.crossOrigin='anonymous';
  s.onload=cb;s.onerror=function(){alert('Could not load XLSX library. Please check your internet connection.');};
  document.head.appendChild(s);
}
function downloadXLSX(filename,sheetsData){
  // sheetsData: [{name, rows:[[],...]}]
  loadSheetJS(function(){
    var wb=XLSX.utils.book_new();
    sheetsData.forEach(function(sd){
      var ws=XLSX.utils.aoa_to_sheet(sd.rows);
      // Style header row bold width
      var range=XLSX.utils.decode_range(ws['!ref']);
      ws['!cols']=sd.rows[0].map(function(){return{wch:22}});
      XLSX.utils.book_append_sheet(wb,ws,(sd.name||'Sheet').slice(0,31));
    });
    XLSX.writeFile(wb,filename);
  });
}
/* -- WORD DOC EXPORT -- */
function downloadDOC(filename, titleText, subtitleText, bodyHTML) {
  var css = [
    'body{font-family:Calibri,Arial,sans-serif;color:#0a1229;margin:0;padding:0}',
    '.wrap{max-width:900px;margin:0 auto;padding:32px}',
    '.hdr{background:#1433a8;color:#fff;padding:20px 28px;border-radius:8px;margin-bottom:24px}',
    '.hdr h1{font-size:20pt;margin:0 0 4px;font-family:"Times New Roman",serif}',
    '.hdr p{font-size:10pt;margin:0;opacity:0.82;letter-spacing:0.05em}',
    'table{width:100%;border-collapse:collapse;margin-bottom:18px;font-size:10pt}',
    'th{background:#1433a8;color:#fff;padding:9px 12px;text-align:left;font-size:9pt;text-transform:uppercase;letter-spacing:0.08em}',
    'td{padding:8px 12px;border-bottom:1px solid #d0d9ef;font-size:10pt}',
    'tr:nth-child(even){background:#f5f7fd}',
    '.section-title{font-size:14pt;font-weight:bold;color:#1433a8;margin:22px 0 10px;font-family:"Times New Roman",serif;border-bottom:2px solid #1433a8;padding-bottom:4px}',
    '.stat-row{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px}',
    '.stat-box{border:1px solid #d0d9ef;border-radius:8px;padding:14px 18px;text-align:center}',
    '.stat-num{font-size:22pt;font-weight:bold;color:#1433a8;font-family:"Times New Roman",serif}',
    '.stat-lbl{font-size:9pt;color:#4a5580;text-transform:uppercase;letter-spacing:0.08em;margin-top:4px}',
    '.footer{font-size:9pt;color:#6474a0;text-align:center;border-top:1px solid #d0d9ef;padding-top:12px;margin-top:24px}',
    '.sig-row{display:flex;justify-content:space-between;margin-top:48px}',
    '.sig-box{text-align:center;border-top:1px solid #000;padding-top:6px;width:200px;font-size:10pt}'
  ].join('');
  var html = '<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">'
    + '<head><meta charset="UTF-8"><title>' + esc(titleText) + '</title>'
    + '<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->'
    + '<style>' + css + '</style></head>'
    + '<body><div class="wrap">'
    + '<div class="hdr"><h1>' + esc(titleText) + '</h1><p>' + esc(subtitleText) + '</p></div>'
    + bodyHTML
    + '<div class="sig-row"><div class="sig-box">Accountant / Prepared By</div><div class="sig-box">Head of Institute</div></div>'
    + '<div class="footer">'+(window.TENANT?window.TENANT.name+' &nbsp;|&nbsp; '+window.TENANT.address:'Guidance Navodaya &amp; Sainik Institute &nbsp;|&nbsp; Khangabok Sorok Wangma, Thoubal, Manipur')+' &nbsp;|&nbsp; Generated: ' + new Date().toLocaleString('en-IN') + '</div>'
    + '</div>';
  var blob = new Blob([html], {type: 'application/msword'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a'); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}
</script>
<!-- ═══════════ GNSI UNIFIED FEE MANAGEMENT CENTRE v1.0 ═══════════ -->
<script>
/* ================================================================
   GNSI UNIFIED FEE MANAGEMENT CENTRE
   Merges: Fee Records (counter) + Online Payments + Student Fee Assignment
   into a single 'fees' page with tab navigation -- no duplication.
   ================================================================ */
/* -- gnsiGetStudentCourseInfo: resolve course/fee info for a student by ID --
   Returns: { courseName, courseIcon, courseColor, subTypeLabel, fees:{monthly,hostel,admission} }
   or null if the student has no fee assignment or no matching course config.            -- */
function gnsiGetStudentCourseInfo(stuId) {
  if (!stuId) return null;
  var asgns = (typeof gnsiLoad === 'function')
    ? (gnsiLoad('gnsi_fee_asgns') || gnsiLoad('gnsi_sfa_assignments') || [])
    : [];
  var asgn = asgns.find(function(a){ return String(a.stuId) === String(stuId); });
  if (!asgn) return null;
  var cfg = (typeof FS_FEE_CONFIG !== 'undefined') ? FS_FEE_CONFIG : null;
  if (!cfg) return null;
  /* Try to match course using multiple strategies (most-to-least specific):
     1. Exact courseId match (e.g. "sainik")
     2. className exact match against course.name (e.g. "Sainik (Old)" → course "Sainik School")
     3. className contains course.id (substring, case-insensitive)
     4. subTypeId prefix match (e.g. "sainik_boarder" starts with "sainik")
     This prevents the silent fall-through to the ₹10,000 default when className is set
     but courseId is missing (common in assignments made via the old SFA form).        */
  var course = cfg.courses.find(function(c){ return c.id === asgn.courseId; });
  if (!course && asgn.className) {
    course = cfg.courses.find(function(c){ return c.name === asgn.className; });
  }
  if (!course && asgn.className) {
    var cnLower = asgn.className.toLowerCase();
    cfg.courses.forEach(function(c){
      if (!course && cnLower.indexOf(c.id.toLowerCase()) !== -1) course = c;
    });
  }
  if (!course && asgn.subTypeId) {
    cfg.courses.forEach(function(c){
      if (!course && asgn.subTypeId.toLowerCase().indexOf(c.id.toLowerCase()) === 0) course = c;
    });
  }
  if (!course) return null;
  var courseColors = { sainik:'#1d4ed8', navodaya:'#15803d', foundation:'#7c3aed' };
  var subtypeKey   = (asgn.subtype || 'boarder').toLowerCase().replace(/\s+/g, '');
  var mfee         = (course.monthlyFees && course.monthlyFees[subtypeKey])
                       ? course.monthlyFees[subtypeKey]
                       : (course.monthlyFees ? (course.monthlyFees['boarder'] || 0) : 0);
  var hostelFee    = (course.monthlyFees && course.monthlyFees['boarder']) || 0;
  return {
    courseName:   course.name  || '',
    courseIcon:   course.icon  || '📚',
    courseColor:  courseColors[course.id] || 'var(--accent)',
    subTypeLabel: asgn.subtype || 'Boarder',
    fees: {
      monthly:   mfee,
      hostel:    hostelFee,
      admission: course.admFee || 0
    }
  };
}
/* -- gnsiGetCourseBadge: render a coloured pill badge for a subTypeId -- */
function gnsiGetCourseBadge(subTypeId) {
  if (!subTypeId) return '<span style="color:var(--muted)">--</span>';
  var cfg = (typeof FS_FEE_CONFIG !== 'undefined') ? FS_FEE_CONFIG : null;
  var courseColors = { sainik:'#1d4ed8', navodaya:'#15803d', foundation:'#7c3aed' };
  var courseName = subTypeId, courseIcon = '📚', color = 'var(--accent)', subLabel = '';
  if (cfg) {
    cfg.courses.forEach(function(c){
      if (subTypeId.toLowerCase().indexOf(c.id.toLowerCase()) === 0) {
        courseName  = c.name;
        courseIcon  = c.icon || '📚';
        color       = courseColors[c.id] || 'var(--accent)';
      }
    });
    /* Try to extract subtype from the subTypeId suffix (e.g. "sainik_boarder") */
    var parts = subTypeId.split('_');
    if (parts.length > 1) subLabel = parts.slice(1).join(' ');
  }
  return '<span style="display:inline-flex;align-items:center;gap:4px;background:'
    + color + '22;color:' + color + ';border:1px solid ' + color + '44;'
    + 'border-radius:8px;padding:2px 9px;font-size:11px;font-weight:700">'
    + courseIcon + ' ' + courseName + (subLabel ? ' · ' + subLabel : '')
    + '</span>';
}
/* -- gnsiCMSyncFeeStatus: update fee status on the student's fee assignment --
   Called after a successful fee collection. Safe to call even if assignment
   is missing -- it will silently no-op.                                         -- */
function gnsiCMSyncFeeStatus(stuId, status, payType) {
  if (!stuId || typeof gnsiLoad !== 'function') return;
  var asgns = gnsiLoad('gnsi_fee_asgns') || gnsiLoad('gnsi_sfa_assignments') || [];
  var idx   = asgns.findIndex(function(a){ return String(a.stuId) === String(stuId); });
  if (idx < 0) return;
  asgns[idx].feeStatus     = status || 'Paid';
  asgns[idx].lastPayType   = payType || '';
  asgns[idx].lastPaidAt    = new Date().toISOString();
  if (typeof gnsiSave === 'function') {
    gnsiSave('gnsi_fee_asgns', asgns);
    gnsiSave('gnsi_sfa_assignments', asgns); /* keep both keys in sync */
  }
}
/* -- State -- */
var _fmc = {
  tab:        'dashboard',  /* dashboard | counter | assignment | online | dues | receipts | config */
  stuId:      null,         /* selected student id (students array) */
  asgnId:     null,         /* selected SFA assignment id */
  payType:    'monthly',    /* fee payment type in counter */
  receiptId:  null,         /* receipt to print */
  search:     '',
  filterPhase:'all',
  filterClass:'all',
  filterMode: 'all',
  filterMonth:'all',
};
/* -- Storage helpers (namespaced) -- */
/* _fmcNormaliseAsgn: converts old SFA records (studentId, amountDue fields)
   into the canonical fee-hub shape (stuId, studentName, className, enrolledAt).
   Safe to call on already-normalised records -- existing fields are kept.      */
function _fmcNormaliseAsgn(a) {
  if (!a) return a;
  /* If stuId is missing, derive it from studentId (old SFA field) */
  if (!a.stuId && a.studentId) a.stuId = String(a.studentId);
  /* If studentName is missing, look it up from the main students array */
  if (!a.studentName && a.stuId && typeof students !== 'undefined') {
    var _s = students.find(function(s){ return String(s.id) === String(a.stuId); });
    if (_s) {
      a.studentName = _s.name || '';
      /* className: prefer explicit field, then student.cls, then class lookup */
      if (!a.className) {
        if (_s.cls) {
          a.className = _s.cls;
        } else if (_s.classId && typeof classes !== 'undefined') {
          var _c = classes.find(function(c){ return c.id === _s.classId; });
          if (_c) a.className = _c.name || '';
        }
      }
      if (!a.hostel) a.hostel = _s.hostel || 'No';
    }
  }
  /* enrolledAt: fall back to creation timestamp or today */
  if (!a.enrolledAt) {
    a.enrolledAt = a.savedAt || a.createdAt || new Date().toISOString();
  }
  /* Map old amountDue/amountPaid into a synthetic monthly fee so _fmcCalcFee
     has something to work with for old records that have no course config.
     We store it on monthlyFeeOverride so _fmcCalcFee can detect and use it. */
  if (!a.monthlyFeeOverride && a.amountDue) {
    a.monthlyFeeOverride = parseFloat(a.amountDue) || 0;
  }
  return a;
}
function _fmcLoadAsgns() {
  var raw = gnsiLoad('gnsi_fee_asgns') || gnsiLoad('gnsi_sfa_assignments') || gnsiLoad('gnsi_student_fee_asgns') || [];
  /* Normalise every record so old and new shapes are unified */
  return raw.map(_fmcNormaliseAsgn);
}
function _fmcSaveAsgns(d) {
  gnsiSave('gnsi_fee_asgns', d);
  gnsiSave('gnsi_sfa_assignments', d);
  gnsiSave('gnsi_student_fee_asgns', d);
  /* Sync to cloud */
  if(typeof gnsiKVPush==='function'){
    gnsiKVPush('gnsi_fee_asgns', d);
    gnsiKVPush('gnsi_sfa_assignments', d);
  }
}
function _fmcLoadCols()   { return gnsiLoad('gnsi_fee_cols')   || gnsiLoad('gnsi_sfa_collections') || []; }
function _fmcSaveCols(d)  { gnsiSave('gnsi_fee_cols', d);  gnsiSave('gnsi_sfa_collections', d); }
function _fmcLoadTxns()   { return gnsiLoad('gnsi_payment_txns') || []; }
function _fmcSaveTxns(d)  { gnsiSave('gnsi_payment_txns', d); }
/* -- Receipt number -- */
function _fmcNextReceipt(prefix) {
  var cols = _fmcLoadCols();
  var yr   = new Date().getFullYear().toString().slice(-2);
  var seq  = cols.length + 1;
  return (prefix||'RCP') + yr + '-' + String(seq).padStart(4,'0');
}
/* -- Months since enrollment -- */
function _fmcMonthsSince(dateStr) {
  if(!dateStr) return 1;
  var s = new Date(dateStr); var n = new Date();
  return Math.max(1, (n.getFullYear()-s.getFullYear())*12 + (n.getMonth()-s.getMonth()) + 1);
}
/* -- Fee calculator for a given assignment + month index -- */
function _fmcCalcFee(asgn, monthIdx) {
  /* OLD SFA records: if amountDue was recorded directly (no course config),
     use monthlyFeeOverride so dues/defaulter calc is accurate instead of
     falling back to the ₹10,000 hardcoded default.                         */
  /* Phase-1: flat override (no courseId yet) */
  if (asgn.monthlyFeeOverride && !asgn.courseId) {
    var _ov = parseFloat(asgn.monthlyFeeOverride) || 0;
    return { flat:_ov, hostelAdd:0, courseFee:0, total:_ov,
             breakdown:['₹'+_ov.toLocaleString('en-IN')+' (Phase-1 flat)'],
             admFee: parseFloat((asgn.admissionFee||asgn.amountDue)||0) };
  }
  /* Phase-2: courseId assigned → use FS_FEE_CONFIG with repeater discount */
  if (asgn.courseId && typeof FS_FEE_CONFIG !== 'undefined') {
    var _fsc = FS_FEE_CONFIG.courses.find(function(c){return c.id===asgn.courseId;});
    if (_fsc) {
      var _key  = (asgn.subtype||'Boarder').toLowerCase().replace(/\s+/g,'');
      var _disc = asgn.isRepeater ? (asgn.repeaterDiscount||500) : 0;
      var _fee  = Math.max(0,(_fsc.monthlyFees[_key]||_fsc.monthlyFees['boarder']||0)-_disc);
      if(_fee>0) return { flat:_fee, hostelAdd:0, courseFee:0, total:_fee,
        breakdown:['₹'+_fee.toLocaleString('en-IN')+' ('+_fsc.name+' · '+(asgn.subtype||'Boarder')+(_disc?' −₹'+_disc:'')+')'  ],
        admFee: _fsc.admFee||0 };
    }
    /* Fallback: stored monthlyFee */
    if (asgn.monthlyFee && parseInt(asgn.monthlyFee)>0) {
      var _mf = parseInt(asgn.monthlyFee);
      return {flat:_mf,hostelAdd:0,courseFee:0,total:_mf,breakdown:['₹'+_mf.toLocaleString('en-IN')+' (course fee)'],admFee:0};
    }
  }
  var conf = (typeof loadFeeConf==='function') ? loadFeeConf() : {monthlyFees:[],admissionFees:[]};
  var cFee = (conf.monthlyFees||[]).find(function(f){return f.course===asgn.className;}) || {amount:10000,hostelAmount:5000};
  var aFee = (conf.admissionFees||[]).find(function(f){return f.course===asgn.className;}) || {amount:5000};
  /* override from Course Management if available */
  if(typeof gnsiGetStudentCourseInfo==='function' && asgn.stuId){
    var ci = gnsiGetStudentCourseInfo(asgn.stuId);
    if(ci && ci.fees){ if(ci.fees.monthly) cFee.amount=parseInt(ci.fees.monthly)||cFee.amount; if(ci.fees.hostel) cFee.hostelAmount=parseInt(ci.fees.hostel)||cFee.hostelAmount; }
  }
  var flat = parseInt(cFee.amount)||10000;
  var hostelAdd = (asgn.hostel==='Yes'||asgn.isHostel) ? (parseInt(cFee.hostelAmount)||5000) : 0;
  var phase2 = asgn.subTypeId && asgn.courseAssignedAt && monthIdx >= 3;
  /* Course fee in phase 2 -- pulled from CM subtype config */
  var courseFee = 0;
  if(phase2 && typeof GNSI_COURSES!=='undefined'){
    GNSI_COURSES.forEach(function(c){ c.subTypes.forEach(function(st){ if(st.id===asgn.subTypeId && st.monthlyFee) courseFee=parseInt(st.monthlyFee)||0; }); });
  }
  var total = flat + hostelAdd + courseFee;
  var breakdown = ['Flat ₹'+flat.toLocaleString('en-IN')];
  if(hostelAdd) breakdown.push('Hostel ₹'+hostelAdd.toLocaleString('en-IN'));
  if(courseFee) breakdown.push('Course ₹'+courseFee.toLocaleString('en-IN'));
  return {flat:flat, hostelAdd:hostelAdd, courseFee:courseFee, total:total, breakdown:breakdown, admFee:parseInt(aFee.amount)||5000};
}
/* -- KPI calculation -- */
function _gnsiGetScholarshipDeduction(stuId){
  /* FIX #7: get scholarship monthly deduction for a student */
  try{
    var schols = JSON.parse(localStorage.getItem('gnsi_scholarships')||'[]');
    var sch = schols.filter(function(s){
      return (String(s.stuId)===String(stuId)||String(s.studentId)===String(stuId)) && s.status==='Active';
    });
    return sch.reduce(function(sum,s){
      if(s.type==='monthly'||s.frequency==='monthly') return sum+(parseFloat(s.amount)||0);
      if(s.type==='full'||s.frequency==='full') return sum+(parseFloat(s.amount)||0)/12;
      return sum+(parseFloat(s.amount)||0);
    },0);
  }catch(e){return 0;}
}
function _fmcKPI() {
  var asgns = _fmcLoadAsgns(); var cols = _fmcLoadCols(); var txns = _fmcLoadTxns();
  var totalCollected = cols.reduce(function(s,c){return s+(parseInt(c.amountPaid)||0);},0);
  var onlineCollected= txns.filter(function(t){return t.status==='Success';}).reduce(function(s,t){return s+(parseFloat(t.amount)||0);},0);
  var totalDue = 0;
  asgns.forEach(function(a){
    var m = _fmcMonthsSince(a.billingStartAt||a.enrolledAt);
    var paid = cols.filter(function(c){return c.asgnId===a.id;}).reduce(function(s,c){return s+(parseInt(c.amountPaid)||0);},0);
    var _schlDed=_gnsiGetScholarshipDeduction(a.stuId)*m;var exp = 0; for(var i=1;i<=m;i++) exp += _fmcCalcFee(a,i).total; exp=Math.max(0,exp-_schlDed);
    if(exp>paid) totalDue += (exp-paid);
  });
  var overdue = asgns.filter(function(a){
    var m=_fmcMonthsSince(a.enrolledAt);
    var paid=cols.filter(function(c){return c.asgnId===a.id;}).reduce(function(s,c){return s+(parseInt(c.amountPaid)||0);},0);
    var exp=0; for(var i=1;i<=m;i++) exp+=_fmcCalcFee(a,i).total;
    return exp>paid;
  }).length;
  return {students:asgns.length, collected:totalCollected, online:onlineCollected, due:totalDue, overdue:overdue, receipts:cols.length, txns:txns.length};
}
/* ================== MAIN RENDER ================== */
function renderSettings(){
  if(!currentUser)return'';
  var isAdmin=currentUser.role==='admin';
  var users=staff.filter(function(s){return s.status!=='Inactive';});
  var changePassHTML=''
    +'<div class="card" style="margin-bottom:20px">'
    +'<div class="card-head"><span class="card-title">🔑 Change My Password</span></div>'
    +'<div style="padding:22px;max-width:420px">'
    +'<div class="form-group" style="margin-bottom:14px"><label>Current Password</label><input type="password" id="cp-cur" placeholder="Your current password" autocomplete="off"/></div>'
    +'<div class="form-group" style="margin-bottom:14px"><label>New Password</label><input type="password" id="cp-new" placeholder="Min. 4 characters"/></div>'
    +'<div class="form-group" style="margin-bottom:18px"><label>Confirm New Password</label><input type="password" id="cp-con" placeholder="Repeat new password"/></div>'
    +'<button class="btn btn-primary" onclick="changeMyPassword()">Update Password</button>'
    +'</div></div>';
  var adminHTML='';
  if(isAdmin){
    /* ── EXAM MODE / BANDWIDTH SAVER CARD ── */
    var _examOn = window._gnsiExamMode || false;
    adminHTML = '<div class="card" style="margin-bottom:20px;border:2px solid '+(_examOn?'#d97706':'var(--border)')+'">'
      +'<div class="card-head" style="background:'+(_examOn?'#fef3c7':'var(--surface2)')+'"><span class="card-title">⚡ Bandwidth & Sync Settings</span>'
      +'<span style="font-size:11px;color:var(--muted);margin-left:8px">Controls how often data syncs to the cloud</span></div>'
      +'<div style="padding:20px;display:flex;flex-wrap:wrap;gap:16px;align-items:center">'
      /* Exam Mode toggle */
      +'<div style="flex:1;min-width:260px;background:'+(_examOn?'#fef3c7':'var(--surface2)')+';border-radius:12px;padding:16px;border:1.5px solid '+(_examOn?'#d97706':'var(--border-soft)')+'">'
      +'<div style="font-weight:800;font-size:13px;color:'+(_examOn?'#92400e':'var(--text)')+';margin-bottom:4px">⚡ Exam Mode</div>'
      +'<div style="font-size:11.5px;color:var(--muted);margin-bottom:12px">Activate during exams or busy periods. Syncs every 30s instead of 8s — reduces bandwidth by ~70%.</div>'
      +'<button onclick="gnsiSetExamMode('+(!_examOn)+')" style="padding:8px 18px;border-radius:8px;font-weight:800;font-size:12px;cursor:pointer;border:none;background:'+(_examOn?'#d97706':'#1433a8')+';color:#fff">'
      +(_examOn?'✅ Exam Mode ON — Click to Deactivate':'🔴 Exam Mode OFF — Click to Activate')+'</button>'
      +'</div>'
      /* Live status */
      +'<div style="flex:1;min-width:220px;background:var(--surface2);border-radius:12px;padding:16px;border:1.5px solid var(--border-soft)">'
      +'<div style="font-weight:800;font-size:13px;color:var(--text);margin-bottom:4px">📊 Current Sync Interval</div>'
      +'<div style="font-size:22px;font-weight:900;color:#1433a8;font-family:\'JetBrains Mono\',monospace" id="_gnsiSyncIntervalDisplay">—</div>'
      +'<div style="font-size:11px;color:var(--muted);margin-top:4px">Auto-adjusts by time of day</div>'
      +'</div>'
      +'</div></div>';
    /* Script to show live interval */
    adminHTML += '<script>setTimeout(function(){'
      +'var el=document.getElementById("_gnsiSyncIntervalDisplay");'
      +'if(el&&typeof _gnsiGetDebounceMs==="function"){'
      +'el.textContent=((_gnsiGetDebounceMs()||8000)/1000)+"s";}'
      +'},200);<\/script>';
    adminHTML += '';
    // Role permissions overview -- full interactive matrix
    var roleColors={admin:'#1433a8',manager:'#7c3aed',accounts:'#d4a853',teacher:'#16a34a',hostel:'#3b78c9',it:'#0891b2',staff:'#6474a0'};
    var allRoles=Object.keys(ROLE_PAGES);
    var allPages=PAGES.map(function(p){return{id:p.id,label:p.label,icon:p.icon};});
    // Matrix header row
    var matrixTh='<th style="position:sticky;left:0;z-index:2;background:var(--accent);min-width:160px">Page / Module</th>'
      +allRoles.map(function(r){
        var col=roleColors[r]||'#6474a0';
        var count=staff.filter(function(s){return detectRole(s)===r;}).length;
        return '<th style="text-align:center;background:'+col+';min-width:90px;font-size:10px;letter-spacing:.06em">'
          +esc(ROLE_LABELS[r])+'<br><span style="opacity:.8;font-size:9px">'+count+' staff</span></th>';
      }).join('');
    // Matrix body
    var matrixRows=allPages.map(function(pg,i){
      var bg=i%2===0?'var(--surface)':'var(--surface2)';
      var cells=allRoles.map(function(r){
        var col=roleColors[r]||'#6474a0';
        var hasAccess=ROLE_PAGES[r].indexOf(pg.id)!==-1;
        var isAdmin=currentUser.role==='admin';
        if(isAdmin){
          return '<td style="text-align:center;padding:8px 4px">'
            +'<label style="cursor:pointer;display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;border:2px solid '+(hasAccess?col:'var(--border)')+';background:'+(hasAccess?col+'22':'var(--surface2)')+';">'
            +'<input type="checkbox" '+(hasAccess?'checked':'')+' onchange="toggleRolePermission(\''+r+'\',\''+pg.id+'\',this.checked)" style="display:none"/>'
            +'<span style="font-size:14px;color:'+(hasAccess?col:'var(--muted2)')+';">'+(hasAccess?'✓':'--')+'</span>'
            +'</label></td>';
        }
        return '<td style="text-align:center;padding:8px 4px">'
          +'<span style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:6px;border:2px solid '+(hasAccess?col:'var(--border)')+';background:'+(hasAccess?col+'22':'var(--surface2)')+';">'
          +'<span style="font-size:13px;color:'+(hasAccess?col:'var(--muted2)')+';">'+(hasAccess?'✓':'--')+'</span>'
          +'</span></td>';
      }).join('');
      return '<tr style="background:'+bg+'"><td style="position:sticky;left:0;background:'+bg+';font-weight:600;font-size:12.5px;z-index:1;padding:9px 14px;border-right:2px solid var(--border)"><span style="margin-right:6px">'+pg.icon+'</span>'+esc(pg.label)+'</td>'+cells+'</tr>';
    }).join('');
    var permLegend='<div style="display:flex;gap:10px;flex-wrap:wrap;padding:14px 20px;background:var(--surface2);border-top:1px solid var(--border-soft)">'
      +allRoles.map(function(r){var col=roleColors[r]||'#6474a0';return'<span style="display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:700"><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:'+col+'"></span>'+esc(ROLE_LABELS[r])+'</span>';}).join('')
      +(currentUser.role==='admin'?'<span style="margin-left:auto;font-size:11px;color:var(--muted);font-weight:600;font-style:italic">✏️ Click checkboxes to toggle permissions (saved automatically)</span>':'')
      +'</div>';
    var exportPermBtn=currentUser.role==='admin'
      ?'<div style="display:flex;gap:8px"><button onclick="exportPermissionsMatrix()" style="padding:7px 14px;border-radius:8px;background:#eff6ff;color:#1e40af;border:1px solid #93c5fd;font-size:12px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">📊 Export Matrix Excel</button>'
       +'<button onclick="resetPermissionsToDefault()" style="padding:7px 14px;border-radius:8px;background:#fee2e2;color:#c0291d;border:1px solid #fca5a5;font-size:12px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">↩ Reset to Default</button></div>'
      :'';
    var roleOverview=''
      +'<div class="card" style="margin-bottom:20px">'
      +'<div class="card-head" style="flex-wrap:wrap;gap:10px"><span class="card-title">🔒 Role Permissions Matrix</span>'
      +exportPermBtn
      +'</div>'
      +'<div style="padding:12px 20px 8px;background:var(--surface2);border-bottom:1px solid var(--border-soft)">'
      +'<div style="font-size:12.5px;color:var(--muted);line-height:1.7">Visual permission matrix for all roles. '
      +(currentUser.role==='admin'?'As <b>Admin</b>, you can toggle any permission by clicking the checkbox cells. Changes apply immediately.':'Only admins can change permissions.')
      +'</div></div>'
      +'<div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;min-width:700px"><thead><tr>'+matrixTh+'</tr></thead><tbody>'+matrixRows+'</tbody></table></div>'
      +permLegend
      +'</div>';
    adminHTML+=roleOverview;
    // -- Staff Credentials Overview ------------------------------
    var roleColors2={admin:'#1433a8',manager:'#7c3aed',accounts:'#d4a853',teacher:'#16a34a',hostel:'#3b78c9',it:'#0891b2',housemaster:'#9d174d',reception:'#0e7490',security:'#991b1b',staff:'#6474a0'};
    // Async: fetch which staff IDs are in gnsi_staff_credentials and refresh badge cells
    (function(){
      var client=(typeof _getSb==='function'?_getSb():null)||(typeof _supa!=='undefined'?_supa:null);
      if(!client) return;
      client.from('gnsi_staff_credentials').select('staff_id').then(function(result){
        var cloudIds=(result.data||[]).map(function(r){return r.staff_id;});
        users.forEach(function(s){
          var el=document.getElementById('cred-sync-'+s.id);
          if(!el) return;
          var inCloud=cloudIds.indexOf(s.id)!==-1;
          el.innerHTML='<span style="font-size:10px;color:'+(inCloud?'#16a34a':'#d4a853')+';font-weight:700">'+(inCloud?'&#x2601; Synced':'&#x1F4BE; Local')+'</span>';
        });
      }).catch(function(){});
    })();
    var credRows=users.map(function(s){
      var sysRole=detectRole(s);
      var col=roleColors2[sysRole]||'#6474a0';
      var uname=getUsername(s.id);
      var hasPwd=!!getStoredHash(s.id);
      var mustChange=localStorage.getItem('gnsi_pwd_must_change_'+s.id)==='1';
      var synced=!!localStorage.getItem('gnsi_uname_'+s.id)&&!!localStorage.getItem('gnsi_pwd_'+s.id);
      // Status pill
      var statusPill,statusSort;
      if(!uname){
        statusPill='<span style="font-size:10px;font-weight:700;padding:2px 9px;border-radius:20px;background:#fef2f2;color:#dc2626;border:1px solid #fca5a5">⛔ No Login</span>';
        statusSort=0;
      } else if(!hasPwd){
        statusPill='<span style="font-size:10px;font-weight:700;padding:2px 9px;border-radius:20px;background:#fffbeb;color:#d4a853;border:1px solid #fde68a">⚠ Default Pwd</span>';
        statusSort=1;
      } else if(mustChange){
        statusPill='<span style="font-size:10px;font-weight:700;padding:2px 9px;border-radius:20px;background:#eff6ff;color:#1433a8;border:1px solid #93c5fd">🔄 Must Change</span>';
        statusSort=2;
      } else {
        statusPill='<span style="font-size:10px;font-weight:700;padding:2px 9px;border-radius:20px;background:#f0fdf4;color:#16a34a;border:1px solid #86efac">✅ Active</span>';
        statusSort=3;
      }
      return {sort:statusSort,html:''
        +'<tr>'
        +'<td><div style="display:flex;align-items:center;gap:10px">'+avatarHTML(s.name,28)
        +'<div><div style="font-weight:700;font-size:13px">'+esc(s.name)+'</div>'
        +'<div style="font-size:11px;color:var(--muted)">'+esc(s.role)+'</div></div></div></td>'
        +'<td><span style="font-size:11px;font-weight:700;padding:2px 9px;border-radius:10px;background:'+col+'18;color:'+col+';border:1px solid '+col+'33">'+(ROLE_LABELS[sysRole]||sysRole)+'</span></td>'
        +'<td>'+(uname?'<span style="font-family:\'JetBrains Mono\',monospace;font-size:12px;font-weight:700;color:var(--accent)">'+esc(uname)+'</span>':'<span style="color:#dc2626;font-size:12px;font-weight:700">-- not set</span>')+'</td>'
        +'<td>'+statusPill+'</td>'
        +'<td id="cred-sync-'+parseInt(s.id,10)+'"><span style="font-size:10px;color:'+(synced?'#16a34a':'#d4a853')+';font-weight:700">'+(synced?'&#x2601; Synced':'&#x1F4BE; Local')+'</span></td>'
        +'<td style="white-space:nowrap">'
        +'<button onclick="adminSetUsername('+parseInt(s.id,10)+',this.dataset.name)" data-name="'+esc(s.name)+'" title="Set Username" style="font-size:11px;padding:3px 8px;border-radius:6px;border:1px solid #93c5fd;background:#eff6ff;cursor:pointer;color:#1433a8;font-weight:700;margin-right:3px">👤 Username</button>'
        +'<button onclick="adminResetPwd('+parseInt(s.id,10)+',this.dataset.name)" data-name="'+esc(s.name)+'" title="Reset Password" style="font-size:11px;padding:3px 8px;border-radius:6px;border:1px solid #fde68a;background:#fffbeb;cursor:pointer;color:#d4a853;font-weight:700;margin-right:3px">🔑 Password</button>'
        +(uname?'<button onclick="gnsiAdminGenerateOTP('+parseInt(s.id,10)+',this.dataset.name)" data-name="'+esc(s.name)+'" title="Generate one-time PIN for staff login" style="font-size:11px;padding:3px 8px;border-radius:6px;border:1px solid #6ee7b7;background:#ecfdf5;cursor:pointer;color:#059669;font-weight:700;margin-right:3px">🔐 OTP</button>':'')
        +'<button onclick="adminSetRole('+parseInt(s.id,10)+')" title="Change Role" style="font-size:11px;padding:3px 8px;border-radius:6px;border:1px solid #c4b5fd;background:#f5f3ff;cursor:pointer;color:#7c3aed;font-weight:700;margin-right:3px">🛡 Role</button>'
        +((!uname)?'<button onclick="gnsiQuickProvision('+parseInt(s.id,10)+')" title="Quick-provision credentials" style="font-size:11px;padding:3px 8px;border-radius:6px;border:1px solid #86efac;background:#f0fdf4;cursor:pointer;color:#16a34a;font-weight:700">⚡ Quick Setup</button>':'')
        +'</td>'
        +'</tr>'};
      });
    // Sort: no-login first, then default-pwd, then must-change, then active
    credRows.sort(function(a,b){return a.sort-b.sort;});
    var noLoginCount=credRows.filter(function(r){return r.sort===0;}).length;
    var activeCount=credRows.filter(function(r){return r.sort===3;}).length;
    var credOverview=''
      +'<div class="card" style="margin-bottom:20px">'
      +'<div class="card-head" style="background:linear-gradient(135deg,#f8faff,#f5f3ff);flex-wrap:wrap;gap:10px">'
      +'<div><span class="card-title">🗂 Staff Credentials Overview</span>'
      +'<div style="font-size:11px;color:var(--muted);margin-top:2px">All staff login status at a glance -- sorted by urgency</div></div>'
      +'<div style="display:flex;gap:8px;align-items:center">'
      +(noLoginCount?'<span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;background:#fef2f2;color:#dc2626;border:1px solid #fca5a5">⛔ '+noLoginCount+' without login</span>':'')
      +'<span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;background:#f0fdf4;color:#16a34a;border:1px solid #86efac">✅ '+activeCount+' active</span>'
      +'<button onclick="gnsiExportCredentials()" style="font-size:11px;padding:4px 12px;border-radius:8px;background:#eff6ff;color:#1433a8;border:1px solid #93c5fd;cursor:pointer;font-weight:700;font-family:\'DM Sans\',sans-serif">📊 Export CSV</button>'
      +'<button onclick="gnsiPushAllCredentialsToCloud()" style="font-size:11px;padding:4px 12px;border-radius:8px;background:#f0fdf4;color:#15803d;border:1px solid #86efac;cursor:pointer;font-weight:700;font-family:\'DM Sans\',sans-serif">☁️ Push All to Cloud</button>'
      +'</div></div>'
      +(noLoginCount?'<div style="padding:10px 20px;background:#fef2f2;border-bottom:1px solid #fca5a5;font-size:12.5px;color:#dc2626;font-weight:600">⚠️ '+noLoginCount+' staff member'+(noLoginCount>1?'s have':'has')+' no login set up. Use <b>⚡ Quick Setup</b> to auto-provision credentials, or go to <b>Staff → Add Staff</b> to add new members with credentials built in.</div>':'')
      +'<div style="overflow-x:auto"><table><thead><tr>'
      +'<th>Staff Member</th><th>System Role</th><th>Username</th><th>Login Status</th><th>Cloud Sync</th><th>Actions</th>'
      +'</tr></thead><tbody>'+credRows.map(function(r){return r.html;}).join('')+'</tbody></table></div>'
      +'</div>';
    adminHTML+=credOverview;
  }
  // -- SMS Config Card (admin only) ----------------------------
  var smsCfg = isAdmin ? (gnsiLoad('gnsi_sms_config') || {}) : {};
  var smsConfigHTML = isAdmin ? (''
    +'<div class="card" style="margin-bottom:20px">'
    +'<div class="card-head"><span class="card-title">📱 SMS &amp; Notification Config</span><span style="font-size:11px;padding:2px 9px;border-radius:10px;background:#eff6ff;color:#1433a8;border:1px solid #93c5fd;font-weight:700">🔒 Admin Only</span></div>'
    +'<div style="padding:20px">'
    +'<div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:9px;padding:10px 14px;margin-bottom:14px;font-size:12.5px;color:#1e40af">ℹ️ Use <b>MSG91</b> for Indian SMS. Enter your API credentials below to activate real SMS sending.</div>'
    +'<div class="form-grid g2">'
    +'<div class="form-group"><label>SMS Provider</label>'
    +'<select id="sms-provider" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:9px;font-size:13px">'
    +'<option value="msg91"'+(smsCfg.provider==="msg91"?" selected":"")+'>MSG91 (India -- Recommended)</option>'
    +'<option value="twilio"'+(smsCfg.provider==="twilio"?" selected":"")+'>Twilio</option>'
    +'<option value="whatsapp"'+(smsCfg.provider==="whatsapp"?" selected":"")+'>WhatsApp Business API</option>'
    +'</select></div>'
    +'<div class="form-group"><label>API Key / Auth Token</label>'
    +'<input id="sms-api-key" type="password" placeholder="Paste your API key here" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:9px;font-size:13px" value="'+esc(smsCfg.apiKey||'')+'">'
    +'</div>'
    +'<div class="form-group"><label>Sender ID</label>'
    +'<input id="sms-sender-id" placeholder="e.g. GNSINST" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:9px;font-size:13px" value="'+esc(smsCfg.senderId||'')+'">'
    +'</div>'
    +'<div class="form-group"><label>Template ID (for MSG91)</label>'
    +'<input id="sms-template-id" placeholder="MSG91 approved template ID" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:9px;font-size:13px" value="'+esc(smsCfg.templateId||'')+'">'
    +'</div>'
    +'</div>'
    +'<div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap;align-items:center">'
    +'<button class="btn btn-primary" onclick="gnsiSaveSMSConfig()">💾 Save SMS Config</button>'
    +(smsCfg.apiKey?'<span style="color:#16a34a;font-size:12px;font-weight:700">✅ API key configured</span>':'<span style="color:#dc2626;font-size:12px;font-weight:700">⚠️ Not configured yet</span>')
    +'</div>'
    +'</div></div>') : '';
  // -- Payment Gateway Config Card (admin only) -----------------
  var payCfg = isAdmin ? (gnsiLoad('gnsi_pay_config') || {}) : {};
  var payConfigHTML = isAdmin ? (''
    +'<div class="card" style="margin-bottom:20px">'
    +'<div class="card-head"><span class="card-title">💳 Online Payment Gateway Config</span><span style="font-size:11px;padding:2px 9px;border-radius:10px;background:#eff6ff;color:#1433a8;border:1px solid #93c5fd;font-weight:700">🔒 Admin Only</span></div>'
    +'<div style="padding:20px">'
    +'<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:9px;padding:10px 14px;margin-bottom:14px;font-size:12.5px;color:#166534">ℹ️ Use <b>Razorpay</b> for Indian institutes. Once configured, parents can pay fees directly from the Parent Portal.</div>'
    +'<div class="form-grid g2">'
    +'<div class="form-group"><label>Gateway Provider</label>'
    +'<select id="pay-provider" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:9px;font-size:13px">'
    +'<option value="razorpay"'+(payCfg.provider==="razorpay"?" selected":"")+'>Razorpay (Recommended for India)</option>'
    +'<option value="payu"'+(payCfg.provider==="payu"?" selected":"")+'>PayU</option>'
    +'</select></div>'
    +'<div class="form-group"><label>Key ID</label>'
    +'<input id="pay-key-id" placeholder="rzp_live_XXXXXXXXXX" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:9px;font-size:13px" value="'+esc(payCfg.keyId||'')+'">'
    +'</div>'
    +'<div class="form-group"><label>Key Secret</label>'
    +'<input id="pay-key-secret" type="password" placeholder="Enter Razorpay secret key" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:9px;font-size:13px" value="'+esc(payCfg.keySecret||'')+'">'
    +'<div style="margin-top:6px;padding:8px 10px;background:#fffbeb;border:1px solid #fde68a;border-radius:7px;font-size:11.5px;color:#92400e">'  
    +'&#9888; <strong>Security notice:</strong> Secret keys stored in the browser can be read by anyone with DevTools access to this device. '  
    +'For production use, process Razorpay orders through a secure backend function instead.</div>'
    +'</div>'
    +'<div class="form-group"><label>Business / Institute Name</label>'
    +'<input id="pay-biz-name" placeholder="GNSI" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:9px;font-size:13px" value="'+esc(payCfg.bizName||'GNSI')+'">'
    +'</div>'
    +'</div>'
    +'<div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap;align-items:center">'
    +'<button class="btn btn-primary" onclick="gnsiSavePayConfig()">💾 Save Payment Config</button>'
    +(payCfg.keyId?'<span style="color:#16a34a;font-size:12px;font-weight:700">✅ Gateway configured -- '+esc(payCfg.provider||'razorpay')+'</span>':'<span style="color:#dc2626;font-size:12px;font-weight:700">⚠️ Not configured yet</span>')
    +'</div>'
    +'</div></div>') : '';
  return '<div class="page-header">'
    +'<div class="page-header-eyebrow">GNSI -- ACCOUNT</div>'
    +'<div class="page-header-title">Settings</div>'
    +'<div class="page-header-sub">Manage passwords, staff login access, and role permissions</div>'
    +'</div>'
    +'<div style="background:var(--surface2);border:1px solid var(--border-soft);border-radius:12px;padding:16px 20px;margin-bottom:20px;display:flex;align-items:center;gap:14px">'
    +avatarHTML(currentUser.name,44)
    +'<div><div style="font-size:16px;font-weight:700">'+esc(currentUser.name)+'</div>'
    +'<div style="font-size:12px;color:var(--muted)">'+esc(currentUser.staffRole)+'</div>'
    +'<div style="margin-top:4px">'+badge(ROLE_LABELS[currentUser.role],
      currentUser.role==='admin'?'#1433a8':currentUser.role==='manager'?'#7c3aed':'#16a34a')+'</div>'
    +'</div></div>'
    +smsConfigHTML
    +payConfigHTML
    +changePassHTML
    +adminHTML;
}
async function changeMyPassword(){
  var cur=((document.getElementById('cp-cur')||{}).value||'').trim();
  var nw=((document.getElementById('cp-new')||{}).value||'').trim();
  var con=((document.getElementById('cp-con')||{}).value||'').trim();
  if(!cur||!nw||!con){alert('Please fill all fields.');return;}
  var _pwdOk=await verifyPassword(currentUser.id,cur,currentUser.name);
  if(!_pwdOk){alert('Current password is incorrect.');return;}
  var _pErr=gnsiCheckPasswordStrength(nw);if(_pErr){alert(_pErr);return;}
  if(nw!==con){alert('New passwords do not match.');return;}
  if(nw===defaultPassword(currentUser.name)){alert('Password cannot be your default (first name). Choose something unique.');return;}

  /* ── FIX: show syncing state while PBKDF2 hashes + Supabase upserts ── */
  if(typeof setSyncStatus==='function') setSyncStatus('syncing');
  showToast('🔒 Saving new password to cloud…', '#1433a8');

  /* setStoredHash is now fully async and pushes to Supabase internally */
  await setStoredHash(currentUser.id, nw);
  clearMustChangeFlag(currentUser.id);

  /* Remove force-change overlay if present */
  var ov=document.getElementById('gnsi-force-pwd-overlay');
  if(ov)ov.remove();

  showToast('✅ Password changed and synced to cloud', '#16a34a');
  var cpCur=document.getElementById('cp-cur');
  var cpNew=document.getElementById('cp-new');
  var cpCon=document.getElementById('cp-con');
  if(cpCur)cpCur.value='';
  if(cpNew)cpNew.value='';
  if(cpCon)cpCon.value='';
}
function gnsiShowForceChangePwd(staffId, staffName, isDefault) {
  /* Admin bypass: never force-change on admin login */
  if (typeof currentUser !== 'undefined' && currentUser && currentUser.role === 'admin') return;
  var existing = document.getElementById('gnsi-force-pwd-overlay');
  if (existing) existing.remove();
  var overlay = document.createElement('div');
  overlay.id = 'gnsi-force-pwd-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(10,18,60,0.82);display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px)';
  var curField = isDefault ? '' :
    '<div class="form-group" style="margin-bottom:14px">'
    +'<label style="font-size:12px;font-weight:700;color:var(--muted,#64748b);display:block;margin-bottom:6px">Current / Temporary Password</label>'
    +'<input id="cp-cur" type="password" autocomplete="current-password" placeholder="Enter temporary password"'
    +' style="width:100%;border:1.5px solid var(--border,#e2e8f0);border-radius:10px;padding:10px 14px;font-size:13px;background:var(--surface2,#f8fafc);color:var(--text,#1e293b);outline:none;box-sizing:border-box"/>'
    +'</div>';
  var msg = isDefault
    ? 'You are using a <b>default password</b>. Please set a new secure password to continue.'
    : 'Your password has been <b>reset by an admin</b>. Please choose a new password to continue.';
  overlay.innerHTML =
    '<div style="background:var(--surface,#fff);border-radius:18px;padding:32px 28px;max-width:420px;width:100%;box-shadow:0 24px 60px rgba(0,0,0,0.35)">'
    +'<div style="text-align:center;margin-bottom:22px">'
      +'<div style="font-size:36px;margin-bottom:8px">\uD83D\uDD10</div>'
      +'<div style="font-size:18px;font-weight:800;color:var(--text,#1e293b);margin-bottom:6px">Password Change Required</div>'
      +'<div style="font-size:13px;color:var(--muted,#64748b);line-height:1.5">'+msg+'</div>'
    +'</div>'
    +curField
    +'<div class="form-group" style="margin-bottom:14px">'
      +'<label style="font-size:12px;font-weight:700;color:var(--muted,#64748b);display:block;margin-bottom:6px">New Password</label>'
      +'<input id="cp-new" type="password" autocomplete="new-password" placeholder="Min 8+ chars, upper+lower+number"'
      +' style="width:100%;border:1.5px solid var(--border,#e2e8f0);border-radius:10px;padding:10px 14px;font-size:13px;background:var(--surface2,#f8fafc);color:var(--text,#1e293b);outline:none;box-sizing:border-box"/>'
    +'</div>'
    +'<div class="form-group" style="margin-bottom:22px">'
      +'<label style="font-size:12px;font-weight:700;color:var(--muted,#64748b);display:block;margin-bottom:6px">Confirm New Password</label>'
      +'<input id="cp-con" type="password" autocomplete="new-password" placeholder="Repeat new password"'
      +' style="width:100%;border:1.5px solid var(--border,#e2e8f0);border-radius:10px;padding:10px 14px;font-size:13px;background:var(--surface2,#f8fafc);color:var(--text,#1e293b);outline:none;box-sizing:border-box"/>'
    +'</div>'
    +'<button onclick="gnsiSubmitForceChangePwd()"'
      +' style="width:100%;padding:12px;border-radius:12px;background:linear-gradient(135deg,#1433a8,#7c3aed);color:#fff;border:none;font-size:14px;font-weight:700;cursor:pointer">Set New Password</button>'
    +'<div id="gnsi-fcp-err" style="margin-top:12px;font-size:12px;color:#dc2626;text-align:center;min-height:18px"></div>'
    +'</div>';
  document.body.appendChild(overlay);
  overlay._isDefault = isDefault;
  overlay._staffId   = staffId;
  overlay._staffName = staffName;
  setTimeout(function(){
    var f = document.getElementById(isDefault ? 'cp-new' : 'cp-cur');
    if (f) f.focus();
  }, 100);
}
async function gnsiSubmitForceChangePwd() {
  var overlay = document.getElementById('gnsi-force-pwd-overlay');
  var errEl   = document.getElementById('gnsi-fcp-err');
  function showErr(msg){ if(errEl) errEl.textContent = msg; }
  var isDefault = overlay && overlay._isDefault;
  var staffId   = overlay && overlay._staffId;
  var staffName = overlay && overlay._staffName;
  var curEl = document.getElementById('cp-cur');
  var newEl = document.getElementById('cp-new');
  var conEl = document.getElementById('cp-con');
  var cur = curEl ? curEl.value.trim() : '';
  var nw  = (newEl ? newEl.value : '').trim();
  var con = (conEl ? conEl.value : '').trim();
  if (!isDefault && !cur) { showErr('Please enter your current / temporary password.'); return; }
  if (!nw || !con)        { showErr('Please fill in both new password fields.'); return; }
  var _pErr2=gnsiCheckPasswordStrength(nw);if(_pErr2){showErr(_pErr2);return;}
  if (nw !== con)         { showErr('Passwords do not match.'); return; }
  var sId = staffId !== undefined ? staffId : (currentUser ? currentUser.id : null);
  var sName = staffName || (currentUser ? currentUser.name : '');
  if (nw === defaultPassword(sName)) {
    showErr('Password cannot be your default (first name). Choose something unique.');
    return;
  }
  // Verify current password unless it was a default (no hash stored)
  if (!isDefault) {
    var _pwdOk2=await verifyPassword(sId, cur, sName);
    if (!_pwdOk2) {
      showErr('Current / temporary password is incorrect.');
      return;
    }
  }
  await setStoredHash(sId, nw);
  clearMustChangeFlag(sId);
  /* ── FIX: sbPushCredential removed here — setStoredHash now pushes to
     Supabase directly with the freshly computed hash, avoiding the race
     condition where sbPushCredential read stale localStorage ── */
  if (overlay) overlay.remove();
  if (typeof showToast === 'function') showToast('✅ Password changed and synced to cloud. Welcome, ' + sName + '!', '#16a34a');
}
function adminSetUsername(staffId,staffName){
  var current=getUsername(staffId)||'';
  var newUname=prompt(
    'Set login username for: '+staffName+'\n'
    +(current?'Current username: '+current+'\n':'(No username set yet)\n')
    +'\nEnter a username (lowercase letters, numbers, dots/underscores only).\nLeave blank to REMOVE the username (staff will not be able to log in).',
    current
  );
  if(newUname===null)return; // cancelled
  newUname=newUname.trim().toLowerCase().replace(/[^a-z0-9._]/g,'');
  if(!newUname){
    deleteUsername(staffId);
    alert('✓ Username removed for '+staffName+'. They can no longer log in.');
  } else {
    // Check for duplicate username among other staff
    var conflict=staff.find(function(s){
      return s.id!==staffId && getUsername(s.id)===newUname;
    });
    if(conflict){
      alert('⚠ That username is already assigned to '+conflict.name+'. Please choose a different one.');
      return;
    }
    setUsername(staffId,newUname);
    // FIX: push the username change to cloud immediately (not deferred)
    if (typeof sbPushCredential === 'function') setTimeout(function(){ sbPushCredential(staffId); }, 200);
    alert('✓ Username set to "'+newUname+'" for '+staffName);
  }
  render();
}
function adminResetPwd(staffId,staffName){
  var newPwd=prompt('Set temporary password for '+staffName+' (leave blank to reset -- staff must set a new one on next login):','');
  if(newPwd===null)return;
  if(!newPwd.trim()){
    localStorage.removeItem('gnsi_pwd_'+staffId);
    localStorage.removeItem('gnsi_pwd_changed_'+staffId);
    setMustChangeFlag(staffId);
    alert('Password cleared. '+staffName+' must set a new password on next login.');
  } else {
    var _pErr3=gnsiCheckPasswordStrength(newPwd.trim());if(_pErr3){alert(_pErr3);return;}
    setStoredHash(staffId,newPwd.trim()); /* async, fire-and-forget on admin reset */
  showToast('✅ Password reset for '+staffName+'. They will be prompted to change it on next login.','#16a34a');
    setMustChangeFlag(staffId);
    alert('Temporary password set. '+staffName+' will be prompted to change it on next login.');
  }
  if(typeof acLog==='function')acLog('Admin Reset Password','Staff: '+staffName+' (id:'+staffId+')');
  // Immediately push updated credential state to cloud
  if(typeof sbPushCredential==='function') sbPushCredential(staffId);
  render();
}
/* -- ROLE PERMISSION MATRIX FUNCTIONS -------------------------*/
/* Load custom ROLE_PAGES from localStorage (if admin has modified) */
function loadCustomRolePages(){
  var s=localStorage.getItem('gnsi_role_pages');
  if(s){try{var p=JSON.parse(s);if(p&&typeof p==='object')return p;}catch(e){}}
  return null;
}
function saveCustomRolePages(rp){
  localStorage.setItem('gnsi_role_pages',JSON.stringify(rp));if(typeof gnsiKVPush==='function')gnsiKVPush('gnsi_role_pages',rp);
  if(typeof _rolePagesSig==='function'&&typeof currentUser!=='undefined'&&currentUser&&currentUser.role==='admin'){
    localStorage.setItem('gnsi_role_pages_sig',_rolePagesSig(rp));
  }
}
/* Initialise ROLE_PAGES from stored overrides -- signature-verified */
function _rolePagesSig(pages){
  var adminHash=getStoredHash(1)||_gnsiSignHash('GNSI_RP_SALT_NO_HASH');
  return _gnsiSignHash('RP_SIG_'+adminHash+'_'+Object.keys(pages).sort().join(','));
}
function saveCustomRolePagesSigned(rp){
  var _gnsiAllowed=['admin'];
  if(!currentUser||_gnsiAllowed.indexOf(currentUser.role)<0){
    if(typeof showToast==='function')showToast('🔒 Access denied: Override role permissions','#dc2626');
    return;
  }

  localStorage.setItem('gnsi_role_pages',JSON.stringify(rp));
  var sig=_rolePagesSig(rp);
  localStorage.setItem('gnsi_role_pages_sig',sig);
  // FIX: push BOTH the data and the signature so other devices receive the full update
  if(typeof gnsiKVPush==='function'){
    gnsiKVPush('gnsi_role_pages', rp);
    gnsiKVPush('gnsi_role_pages_sig', sig);
  }
}
(function(){
  var custom=loadCustomRolePages();
  var sig=localStorage.getItem('gnsi_role_pages_sig');
  if(custom){
    // PATCHED v63: Fresh device security fix.
    // Previously, unsigned cloud role pages were applied immediately on page load (before login),
    // allowing anyone who could write to the KV table to inject role pages on first device use.
    // Now: if sig is valid → apply immediately. If no sig → stage for post-login application only.
    var sigOk = sig && sig===_rolePagesSig(custom);
    if(sigOk){
      Object.keys(custom).forEach(function(r){if(ROLE_PAGES[r])ROLE_PAGES[r]=custom[r];});
    } else if(!sig){
      // No sig = fresh device pull from cloud. Stage it; applyPendingRolePages() will be called
      // after successful admin login when the hash is available to verify.
      window._gnsiPendingRolePages = custom;
    } else {
      // Sig present but does not match -- tampered, discard
      localStorage.removeItem('gnsi_role_pages');
      localStorage.removeItem('gnsi_role_pages_sig');
    }
  }
})();
/* Called after admin login to apply staged role pages once hash is available for verification */
function applyPendingRolePages(){
  var pending = window._gnsiPendingRolePages;
  if(!pending) return;
  window._gnsiPendingRolePages = null;
  var sig = localStorage.getItem('gnsi_role_pages_sig');
  var sigOk = sig && sig===_rolePagesSig(pending);
  var noSig = !sig;
  if(sigOk || noSig){
    Object.keys(pending).forEach(function(r){if(ROLE_PAGES[r])ROLE_PAGES[r]=pending[r];});
    // Re-sign with admin hash now available
    if(typeof saveCustomRolePagesSigned==='function') saveCustomRolePagesSigned(ROLE_PAGES);
  }
}
function toggleRolePermission(role,pageId,checked){
  if(currentUser.role!=='admin'){alert('Only admin can change permissions.');return;}
  if(role==='admin'){alert('Admin permissions cannot be changed.');return;}
  if(checked){
    if(ROLE_PAGES[role].indexOf(pageId)===-1)ROLE_PAGES[role].push(pageId);
  } else {
    ROLE_PAGES[role]=ROLE_PAGES[role].filter(function(p){return p!==pageId;});
  }
  if(typeof saveCustomRolePagesSigned==='function')saveCustomRolePagesSigned(ROLE_PAGES);
  else saveCustomRolePages(ROLE_PAGES);
  render();
}
function exportPermissionsMatrix(){
  showToast('⏳ Preparing Permissions CSV…','#2563eb');

  var allRoles=Object.keys(ROLE_PAGES);
  var hdr=['Page / Module'].concat(allRoles.map(function(r){return ROLE_LABELS[r];}));
  var rows=[hdr];
  PAGES.forEach(function(pg){
    var row=[pg.label].concat(allRoles.map(function(r){return ROLE_PAGES[r].indexOf(pg.id)!==-1?'✓':'--';}));
    rows.push(row);
  });
    showToast('✅ Permissions CSV ready — '+(allRoles.length)+' rows','#16a34a');
  downloadXLSX('GNSI_Role_Permissions.xlsx',[{name:'Role Permissions',rows:rows}]);
}
function resetPermissionsToDefault(){
  if(!confirm('Reset ALL role permissions to factory defaults? This cannot be undone.'))return;
  localStorage.removeItem('gnsi_role_pages');
  localStorage.removeItem('gnsi_role_pages_sig');
  // Hard reset to defaults -- PATCHED v63: kept in sync with ROLE_PAGES definition at top of file
  ROLE_PAGES.manager=['dashboard','leaderboard','staff','students','admissions','unifiedhub','sessions','classes','attendance','notices','accounts','fees','timetable','exam','exammanager','periodsalary','staffsalary','doubttt','dutyhours','boarder','hostel','kitchen','housemaster','house','reception','reports','leave','substitute','grievance','diary','certificate','calendar','ptm','library','assets','nightduty','discipline','sickbay','scholarship','payments','aiassistant','lessonbridge'];
  ROLE_PAGES.accounts=['dashboard','notices','accounts','fees','students','admissions','reception','reports','scholarship','calendar','analytics'];
  ROLE_PAGES.teacher=['dashboard','notices','attendance','timetable','exam','periodsalary','doubttt','dutyhours','students','classes','leave','substitute','diary','calendar','ptm','library','discipline','grievance','aiassistant','lessonbridge','gnsi_social'];
  ROLE_PAGES.hostel=['dashboard','notices','doubttt','dutyhours','boarder','hostel','kitchen','housemaster','house','attendance','exam','nightduty','discipline','sickbay','calendar','leave','aiassistant','lessonbridge','gnsi_social'];
  ROLE_PAGES.housemaster=['dashboard','notices','housemaster','house','hostel','boarder','doubttt','dutyhours','attendance','exam','aiassistant','lessonbridge','gnsi_social'];
  ROLE_PAGES.reception=['dashboard','notices','reception','students','admissions','fees','reports','calendar'];
  ROLE_PAGES.it=['dashboard','notices','reports','sync'];
  ROLE_PAGES.staff=['dashboard','notices','dutyhours','aiassistant','lessonbridge','gnsi_social','diary','calendar','library'];
  // FIX: push reset to cloud so all devices receive the default permissions
  if(typeof saveCustomRolePagesSigned==='function')saveCustomRolePagesSigned(ROLE_PAGES);
  else saveCustomRolePages(ROLE_PAGES);
  if(typeof acLog==='function')acLog('Permissions Reset','All role permissions reset to factory defaults');
  showToast('Permissions reset to default ☁️ Syncing to all devices…','#16a34a');
  render();
}
function adminSetRole(staffId){
  if(!currentUser||currentUser.role!=='admin'){alert('Only admin can change roles.');return;}
  var member=staff.find(function(s){return s.id===staffId;});
  if(!member)return;
  if(staffId===1){alert('Admin (Head of Institute) role cannot be changed.');return;}
  var current=detectRole(member);
  var roles=Object.keys(ROLE_PAGES).filter(function(r){return r!=='admin';});
  var opts=roles.map(function(r,i){return (i+1)+'. '+ROLE_LABELS[r]+' ('+r+')'}).join('\n');
  var choice=prompt('Set role for '+member.name+':\nCurrent: '+ROLE_LABELS[current]+'\n\n'+opts+'\n\nEnter role key:','');
  if(!choice)return;
  choice=choice.trim().toLowerCase();
  if(!ROLE_PAGES[choice]||choice==='admin'){alert('Invalid role. Admin cannot be assigned this way.');return;}
  adminSetRoleSecure(staffId,choice);
  if(typeof acLog==='function')acLog('Role Changed',member.name+' to '+ROLE_LABELS[choice]);
  // FIX: if the role being changed belongs to the currently logged-in user,
  // update their active session right away so pages/nav are correct immediately.
  if (typeof currentUser !== 'undefined' && currentUser && currentUser.id === staffId) {
    currentUser.role  = choice;
    currentUser.pages = (typeof ROLE_PAGES !== 'undefined' && ROLE_PAGES[choice]) || currentUser.pages;
    if (typeof saveSession === 'function') saveSession(currentUser);
    if (typeof buildNav === 'function') setTimeout(buildNav, 100);
  }
  alert('Role updated to '+ROLE_LABELS[choice]+' for '+member.name);
  render();
}
/* -- Quick-provision credentials for staff who have no login -- */
function gnsiQuickProvision(staffId){
  if(!currentUser||currentUser.role!=='admin'){alert('Admin only.');return;}
  var member=staff.find(function(s){return s.id===staffId;});
  if(!member){alert('Staff not found.');return;}
  // Generate username
  var suggestedUname=gnsiAutoUsername(member.name);
  // Ensure uniqueness
  var base=suggestedUname,suffix=2;
  while(staff.find(function(s){return s.id!==staffId&&getUsername(s.id)===suggestedUname;})){
    suggestedUname=base+suffix; suffix++;
  }
  var uname=prompt(
    '⚡ Quick Setup for: '+member.name+'\n\nSuggested username (edit if needed):',
    suggestedUname
  );
  if(!uname){return;}
  uname=uname.trim().toLowerCase();
  if(!uname){alert('Username cannot be empty.');return;}
  // Check uniqueness
  var taken=staff.find(function(s){return s.id!==staffId&&getUsername(s.id)===uname;});
  if(taken){alert('Username "'+uname+'" is already taken by '+taken.name+'. Try a different one.');return;}
  var pwd=prompt('Set a default password for '+member.name+' (min 4 chars):\n(Staff will be asked to change on first login)','gnsi@1234');
  if(!pwd||pwd.trim().length<4){alert('Password too short or cancelled.');return;}
  var roles=Object.keys(ROLE_PAGES).filter(function(r){return r!=='admin';});
  var currentSysRole=detectRole(member);
  var roleChoice=prompt(
    'System Role for '+member.name+':\nCurrent detected: '+currentSysRole+'\n\n'+
    roles.map(function(r,i){return(i+1)+'. '+(ROLE_LABELS[r]||r);}).join('\n')+
    '\n\nEnter role key (or leave blank to keep "'+currentSysRole+'"):',
    currentSysRole
  );
  var finalRole=(roleChoice&&roleChoice.trim()&&ROLE_PAGES[roleChoice.trim()])?roleChoice.trim():currentSysRole;
  gnsiProvisionCredentials(staffId, uname, pwd.trim(), finalRole);
  // FIX: stamp guard so realtime KV echo can't revert the newly provisioned credentials
  if(typeof gnsiMarkLocalSave==='function') gnsiMarkLocalSave(8000);
  render();
  if(typeof showToast==='function')
    showToast('⚡ '+member.name+' set up -- login: '+uname+' | role: '+(ROLE_LABELS[finalRole]||finalRole),'#16a34a');
  else alert('✅ Done!\n\n'+member.name+'\nUsername: '+uname+'\nRole: '+(ROLE_LABELS[finalRole]||finalRole)+'\nPassword: '+pwd+'\n\nStaff must change password on first login.');
}
/* -- Export credentials summary as CSV -- */
function gnsiExportCredentials(){
  showToast('⏳ Preparing Credentials CSV…','#2563eb');

  if(!currentUser||currentUser.role!=='admin'){alert('Admin only.');return;}
  var rows=[['ID','Name','Job Role','System Role','Username','Has Password','Sync Status','Login Status']];
  staff.forEach(function(s){
    var sysRole=detectRole(s);
    var uname=getUsername(s.id)||'';
    var hasPwd=!!getStoredHash(s.id);
    var mustChange=localStorage.getItem('gnsi_pwd_must_change_'+s.id)==='1';
    var synced=!!localStorage.getItem('gnsi_uname_'+s.id)&&!!localStorage.getItem('gnsi_pwd_'+s.id);
    var status=!uname?'No Login':(!hasPwd?'Default Password':mustChange?'Must Change Password':'Active');
    rows.push([s.id,s.name,s.role,ROLE_LABELS[sysRole]||sysRole,uname,hasPwd?'Yes':'No',synced?'Cloud Synced':'Local Only',status]);
  });
  if(typeof downloadCSV==='function') downloadCSV('GNSI_Staff_Credentials.csv',rows);
  else{
    var csv=rows.map(function(r){return r.map(function(c){return'"'+(c||'').toString().replace(/"/g,'""')+'"';}).join(',');}).join('\n');
    var a=document.createElement('a');
    a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
    a.download='GNSI_Staff_Credentials.csv';
      showToast('✅ Credentials CSV ready — '+(creds.length)+' rows','#16a34a');
  a.click();
  }
}
/* -- Push ALL local credentials to Supabase (one-time migration / force-sync) -- */
function gnsiPushAllCredentialsToCloud(){
  if(!currentUser||currentUser.role!=='admin'){alert('Admin only.');return;}
  var client=_getSb()||_supa;
  if(!client){alert('Supabase not connected. Check your internet connection.');return;}
  var rows=[];
  staff.forEach(function(s){
    var uname   = localStorage.getItem('gnsi_uname_'+s.id)            || null;
    var pwdHash = localStorage.getItem('gnsi_pwd_'+s.id)              || null;
    var mustChg = localStorage.getItem('gnsi_pwd_must_change_'+s.id)  || '0';
    var roleKey = localStorage.getItem('gnsi_role_'+s.id)             || null;
    var roleSig = localStorage.getItem('gnsi_role_sig_'+s.id)         || null;
    // Only push if this staff member has at least a username or password set.
    // Skip staff_id=1 (admin) — admin credentials are intentionally device-local
    // (gnsi_pwd_1 / gnsi_uname_1 are in the local-only blocklist) and must never
    // be pushed via the bulk path to avoid a guaranteed upsert conflict/error.
    if((uname||pwdHash) && s.id !== 1){
      rows.push({
        staff_id:    s.id,
        uname:       uname,
        pwd_hash:    pwdHash,
        must_change: mustChg,
        role_key:    roleKey,
        role_sig:    roleSig,
        updated_at:  new Date().toISOString()
      });
    }
  });
  if(!rows.length){
    if(typeof showToast==='function') showToast('⚠️ No credentials found locally to push','#d4a853');
    return;
  }
  if(typeof showToast==='function') showToast('☁️ Pushing '+rows.length+' credential rows to cloud…','#1433a8');
  // Chunk into batches of 50 to avoid payload limits
  var chunks=[],size=50;
  for(var i=0;i<rows.length;i+=size) chunks.push(rows.slice(i,i+size));
  var done=0,errors=0;
  chunks.forEach(function(chunk){
    client.from('gnsi_staff_credentials')
      .upsert(chunk,{onConflict:'staff_id'})
      .then(function(r){
        done++;
        if(r.error){errors++;(void 0);}
        if(done===chunks.length){
          if(errors===0){
            if(typeof showToast==='function') showToast('✅ All '+rows.length+' credential rows pushed to cloud','#16a34a');
            if(typeof acLog==='function') acLog('Credential Push','All '+rows.length+' staff credentials synced to cloud by admin');
          } else {
            if(typeof showToast==='function') showToast('⚠️ Push completed with '+errors+' error(s) -- check console','#d4a853');
          }
        }
      })
      .catch(function(e){
        done++;errors++;
        (void 0);
        if(done===chunks.length&&typeof showToast==='function')
          showToast('❌ Push failed: '+( e.message||'network error'),'#dc2626');
      });
  });
}
/* PRIV-ESC FIX C: Upgrade role signature from FNV-32 to HMAC-SHA256.
   Old FNV-32 sigs were forgeable: admin hash readable from localStorage + algorithm in source.
   New: HMAC-SHA256 keyed on admin hash. Old 'gs_...' sigs are rejected and wiped. */
var _detectRoleOrig=detectRole;

async function adminSetRoleSecure(staffId,role){
  /* SECURITY: only admin can assign roles — defence-in-depth against DevTools calls */
  if (typeof currentUser === 'undefined' || !currentUser || currentUser.role !== 'admin') {
    if (typeof showToast === 'function') showToast('🔒 Only admin can assign roles','#dc2626');
    return;
  }
  var _k=getStoredHash(1)||'GNSI_ROLE_NOSIG_2026';
  var _e=new TextEncoder();
  var _msg='GNSI_ROLE|'+staffId+'|'+role;
  try{
    var k=await crypto.subtle.importKey('raw',_e.encode(_k),{name:'HMAC',hash:'SHA-256'},false,['sign']);
    var buf=await crypto.subtle.sign('HMAC',k,_e.encode(_msg));
    var sig=Array.from(new Uint8Array(buf)).map(function(b){return('00'+b.toString(16)).slice(-2);}).join('');
    localStorage.setItem('gnsi_role_'+staffId,role);
    localStorage.setItem('gnsi_role_sig_'+staffId,sig);
    if(typeof gnsiKVPush==='function'){gnsiKVPush('gnsi_role_'+staffId,role);gnsiKVPush('gnsi_role_sig_'+staffId,sig);}
  }catch(e){
    /* Crypto unavailable — store without sig; cloud pull will re-apply */
    localStorage.setItem('gnsi_role_'+staffId,role);
    if(typeof gnsiKVPush==='function') gnsiKVPush('gnsi_role_'+staffId,role);
  }
}

function _verifyRoleSig(staffId,role,sig,onFail){
  if(!sig||!/^[0-9a-f]{64}$/.test(sig)){onFail();return;}
  var _k=getStoredHash(1)||'GNSI_ROLE_NOSIG_2026';
  var _e=new TextEncoder();
  var _msg='GNSI_ROLE|'+staffId+'|'+role;
  crypto.subtle.importKey('raw',_e.encode(_k),{name:'HMAC',hash:'SHA-256'},false,['verify'])
    .then(function(k){
      var sb=new Uint8Array(sig.match(/../g).map(function(h){return parseInt(h,16);}));
      return crypto.subtle.verify('HMAC',k,sb,_e.encode(_msg));
    }).then(function(ok){if(!ok)onFail();}).catch(function(){});
}

detectRole=function(member){
  if(member.id===1)return 'admin';
  var override=localStorage.getItem('gnsi_role_'+member.id);
  var storedSig=localStorage.getItem('gnsi_role_sig_'+member.id);
  if(override&&ROLE_PAGES[override]&&storedSig){
    /* Reject old FNV-32 'gs_...' sigs — only accept 64-char hex HMAC */
    if(/^[0-9a-f]{64}$/.test(storedSig)){
      _verifyRoleSig(member.id,override,storedSig,function(){
        localStorage.removeItem('gnsi_role_'+member.id);
        localStorage.removeItem('gnsi_role_sig_'+member.id);
        if(typeof showToast==='function')showToast('?? Role signature invalid — role reset','#dc2626');
        if(typeof render==='function')render();
      });
      return override;
    }
    /* Old/forged sig — wipe */
    localStorage.removeItem('gnsi_role_'+member.id);
    localStorage.removeItem('gnsi_role_sig_'+member.id);
  }
  return _detectRoleOrig(member);
};
/* ══════════════════════════════════════════════════════════════
   CLOUD CREDENTIAL SYNC  -- v7 (Supabase-native, no Firebase)
   --------------------------------------------------------------
   TABLE REQUIRED (run once in Supabase SQL editor):
   CREATE TABLE IF NOT EXISTS gnsi_staff_credentials (
     staff_id   INTEGER PRIMARY KEY,
     uname      TEXT,
     pwd_hash   TEXT,
     must_change TEXT DEFAULT '0',
     role_key   TEXT,
     role_sig   TEXT,
     otp_hash   TEXT,
     otp_expires TIMESTAMPTZ,
     updated_at TIMESTAMPTZ DEFAULT now()
   );
   ALTER TABLE gnsi_staff_credentials ENABLE ROW LEVEL SECURITY;
   DROP POLICY IF EXISTS "anon_rw" ON gnsi_staff_credentials;
   CREATE POLICY "anon_rw" ON gnsi_staff_credentials
     FOR ALL TO anon USING (true) WITH CHECK (true);
   This table is the single source of truth for staff credentials
   across ALL devices. Every credential change is written here
   immediately and pulled on every page load before the login
   check runs -- so any device always has the latest state.
   ══════════════════════════════════════════════════════════════ */
/* -- Push one staff member's full credential row to Supabase -- */
/* AUTH v2.0: Supabase is now the single source of truth for credentials.
   localStorage copies (gnsi_pwd_*, gnsi_uname_*) are still written as
   a fallback but Supabase is always written first and is authoritative. */
function sbPushCredential(staffId, unameOverride, hashOverride) {
  var client = _getSb() || _supa;
  if (!client) return;
  var uname   = unameOverride || localStorage.getItem('gnsi_uname_' + staffId)   || null;
  var pwdHash = hashOverride  || localStorage.getItem('gnsi_pwd_'   + staffId)   || null;
  var mustChg = localStorage.getItem('gnsi_pwd_must_change_' + staffId) || '0';
  var roleKey = localStorage.getItem('gnsi_role_' + staffId) || null;
  var roleSig = localStorage.getItem('gnsi_role_sig_' + staffId) || null;
  if (!uname && !pwdHash) return; /* nothing to push */
  var row;
  try {
    row = JSON.parse(JSON.stringify({
      staff_id:    staffId,
      uname:       uname,
      pwd_hash:    pwdHash,
      must_change: mustChg,
      role_key:    roleKey,
      role_sig:    roleSig,
      updated_at:  new Date().toISOString()
    }));
  } catch(e) { return; }
  client.from('gnsi_staff_credentials')
    .upsert(row, { onConflict: 'staff_id' })
    .then(function(r) {
      if (r && r.error) { (void 0); }
    })
    .catch(function(e) {
      if (e && e.name === 'DataCloneError') return;
    });
}
/* -- Delete one staff member's credential row from Supabase -- */
function sbDeleteCredential(staffId) {
  var client = _getSb() || _supa;
  if (!client) return;
  client.from('gnsi_staff_credentials')
    .delete()
    .eq('staff_id', staffId)
    .then(function(r) {
      if (r.error) (void 0);
    })
    .catch(function(){});
}
/* ══════════════════════════════════════════════════════════════
   OTP SYSTEM (v80) — Admin generates a one-time PIN for a staff
   member. Staff uses username + OTP to log in once. System then
   auto-generates a strong password, shows it to admin, and the
   staff uses that password going forward.
   OTPs expire in 15 minutes and are single-use.
   ══════════════════════════════════════════════════════════════ */

/* Generate a cryptographically random 6-digit OTP */
function gnsiGenerateOTP() {
  var arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return String(100000 + (arr[0] % 900000));
}

/* Generate a strong auto-password: 3 word segments + numbers */
function gnsiGenerateAutoPassword() {
  var words = ['Gnsi','Star','Lion','Moon','Fire','Blue','Gold','Rock','Wind','Sage',
                'Hawk','Pine','Jade','Bolt','Dawn','Dusk','Peak','Wave','Crest','Flare'];
  var w1 = words[Math.floor(Math.random()*words.length)];
  var w2 = words[Math.floor(Math.random()*words.length)];
  var n  = String(10 + Math.floor(Math.random()*90));
  return w1 + w2 + n + '!';
}

/* Admin: generate OTP for a staff member and push to Supabase */
function gnsiAdminGenerateOTP(staffId, staffName) {
  var client = _getSb() || _supa;
  if (!client) { showToast('❌ Not connected to cloud','#dc2626'); return; }
  if (!currentUser || currentUser.id !== 1) { showToast('🔒 Admin only','#dc2626'); return; }
  var otp = gnsiGenerateOTP();
  var otpHash = _gnsiSignHash('OTP_'+otp+'_'+staffId);
  var expires = new Date(Date.now() + 15*60*1000).toISOString();
  client.from('gnsi_staff_credentials')
    .upsert({ staff_id: staffId, otp_hash: otpHash, otp_expires: expires, updated_at: new Date().toISOString() },
            { onConflict: 'staff_id' })
    .then(function(r) {
      if (r.error) { showToast('❌ Could not generate OTP: '+r.error.message,'#dc2626'); return; }
      /* Show OTP in a modal */
      var modal = document.createElement('div');
      modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:99999;display:flex;align-items:center;justify-content:center;font-family:"DM Sans",sans-serif';
      modal.innerHTML = '<div style="background:#fff;border-radius:18px;padding:28px 28px 24px;max-width:380px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,.35);text-align:center">'
        +'<div style="font-size:13px;font-weight:700;color:#6474a0;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px">OTP Generated</div>'
        +'<div style="font-size:15px;font-weight:600;color:#0a1229;margin-bottom:16px">'+escHtml(staffName)+'</div>'
        +'<div style="font-size:13px;color:#475569;margin-bottom:8px">Share this one-time code with the staff member:</div>'
        +'<div id="_gnsi_otp_display" style="font-family:\'JetBrains Mono\',monospace;font-size:36px;font-weight:700;color:#1433a8;letter-spacing:.25em;background:#f0f4ff;border-radius:12px;padding:16px 0;margin-bottom:8px">'+otp+'</div>'
        +'<div style="font-size:12px;color:#f59e0b;font-weight:600;margin-bottom:18px">⏱ Expires in 15 minutes · Single use only</div>'
        +'<div style="font-size:12px;color:#64748b;background:#f8fafc;border-radius:8px;padding:10px 14px;margin-bottom:18px;text-align:left;line-height:1.6">'
        +'After the staff member logs in with this OTP, a new password will be generated and displayed here for you to share with them.'
        +'</div>'
        +'<button onclick="this.closest(\'div[style*=fixed]\').remove()" style="width:100%;padding:11px;background:linear-gradient(135deg,#1433a8,#1b44cc);color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer">Done</button>'
        +'</div>';
      document.body.appendChild(modal);
      if (typeof acLog === 'function') acLog('OTP Generated', 'Admin generated OTP for '+staffName+' (ID '+staffId+'), expires '+expires);
    })
    .catch(function(e) { showToast('❌ OTP error: '+(e.message||'unknown'),'#dc2626'); });
}

/* Helper to HTML-escape strings safely */
function escHtml(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

/* Called after OTP login succeeds: auto-generate a password and push it */
function gnsiOTPPostLogin(staffId, staffName, callback) {
  var client = _getSb() || _supa;
  var newPwd = gnsiGenerateAutoPassword();
  /* Hash and store locally */
  hashPassword(newPwd, staffId, staffName).then(function(hash) {
    localStorage.setItem('gnsi_pwd_'+staffId, hash);
    localStorage.setItem('gnsi_pwd_changed_'+staffId, '1');
    /* Clear OTP, store new password hash in Supabase */
    if (client) {
      client.from('gnsi_staff_credentials')
        .upsert({ staff_id: staffId, pwd_hash: hash, otp_hash: null, otp_expires: null,
                  must_change: '0', updated_at: new Date().toISOString() }, { onConflict: 'staff_id' })
        .then(function(){})
        .catch(function(){});
    }
    /* Display new password to admin via a persistent notification stored in KV */
    var note = { staffId: staffId, staffName: staffName, newPwd: newPwd, ts: new Date().toISOString() };
    localStorage.setItem('_gnsi_otp_new_pwd', JSON.stringify(note));
    if (typeof callback === 'function') callback(newPwd);
  }).catch(function() {
    /* Fallback: use sync hash */
    var hash = _legacyHash(newPwd);
    localStorage.setItem('gnsi_pwd_'+staffId, hash);
    localStorage.setItem('gnsi_kv_ts_gnsi_pwd_'+staffId, new Date().toISOString());
    if (client) {
      client.from('gnsi_staff_credentials')
        .upsert({ staff_id: staffId, pwd_hash: hash, otp_hash: null, otp_expires: null,
                  must_change: '0', updated_at: new Date().toISOString() }, { onConflict: 'staff_id' })
        .then(function(){}).catch(function(){});
    }
    var note = { staffId: staffId, staffName: staffName, newPwd: newPwd, ts: new Date().toISOString() };
    localStorage.setItem('_gnsi_otp_new_pwd', JSON.stringify(note));
    if (typeof callback === 'function') callback(newPwd);
  });
}

/* Pull OTP hash/expiry into localStorage during credential pull */
/* (handled inside sbPullAllCredentials below — otp data stored locally for verification) */

/* -- Pull ALL credential rows from Supabase → localStorage ---- */
/* Called BEFORE the login check so any device always has the    */
/* latest usernames, password hashes and role overrides.         */
function sbPullAllCredentials(callback) {
  var client = _getSb() || _supa;
  if (!client) {
    if (typeof callback === 'function') callback();
    return;
  }
  /* ── TIMEOUT GUARD: if Supabase doesn't respond within 3 s, proceed
     with cached localStorage credentials so login never hangs. ── */
  var _done = false;
  var _timer = setTimeout(function() {
    if (_done) return;
    _done = true;
    if (typeof callback === 'function') callback();
  }, 3000);

  client.from('gnsi_staff_credentials')
    .select('staff_id, uname, pwd_hash, must_change, role_key, role_sig, otp_hash, otp_expires')
    .then(function(result) {
      clearTimeout(_timer);
      if (_done) return; /* timed-out already — don't double-call */
      _done = true;
      var rows = result.data || [];
      rows.forEach(function(row) {
        var sid = row.staff_id;
        if (!sid) return;
        /* username */
        if (row.uname !== null && row.uname !== undefined && row.uname !== '') {
          localStorage.setItem('gnsi_uname_'+sid, row.uname);
        } else if (row.uname === null) {
          localStorage.removeItem('gnsi_uname_'+sid);
        }
        /* password hash -- only overwrite if cloud has a value AND
           the local value is absent OR cloud is newer (trust cloud) */
        if (row.pwd_hash !== null && row.pwd_hash !== undefined && row.pwd_hash !== '') {
          localStorage.setItem('gnsi_pwd_'+sid, row.pwd_hash);
        } else if (row.pwd_hash === null) {
          localStorage.removeItem('gnsi_pwd_'+sid);
          localStorage.removeItem('gnsi_pwd_changed_'+sid);
        }
        /* must-change flag */
        if (row.must_change === '1') {
          localStorage.setItem('gnsi_pwd_must_change_'+sid, '1');
        } else if (row.must_change === '0') {
          localStorage.removeItem('gnsi_pwd_must_change_'+sid);
        }
        /* role override + signature */
        if (row.role_key) {
          localStorage.setItem('gnsi_role_'+sid,     row.role_key);
          if (row.role_sig) localStorage.setItem('gnsi_role_sig_'+sid, row.role_sig);
        }
        /* OTP hash + expiry — stored locally for offline-capable verification */
        if (row.otp_hash !== null && row.otp_hash !== undefined && row.otp_hash !== '') {
          localStorage.setItem('gnsi_otp_hash_'+sid, row.otp_hash);
          localStorage.setItem('gnsi_otp_exp_'+sid,  row.otp_expires || '');
        } else {
          localStorage.removeItem('gnsi_otp_hash_'+sid);
          localStorage.removeItem('gnsi_otp_exp_'+sid);
        }
      });
      if (typeof callback === 'function') callback();
    })
    .catch(function(e) {
      clearTimeout(_timer);
      if (_done) return;
      _done = true;
      if (typeof callback === 'function') callback();
    });
}
/* -- Keep Firebase stubs so old call sites don't throw -- */
function fbPushCredential(staffId)   { sbPushCredential(staffId); }
function fbDeleteCredentialCloud(staffId) { sbDeleteCredential(staffId); }
function fbPullAllCredentials(callback)   { sbPullAllCredentials(callback); }
/* -- Patch adminSetUsername → push to Supabase immediately -- */
(function(){
  if(typeof adminSetUsername !== 'function') return;
  var _orig = adminSetUsername;
  adminSetUsername = function(staffId, staffName) {
    _orig(staffId, staffName);
    // FIX: stamp guard so realtime cred echo can't revert the new username
    if(typeof gnsiMarkLocalSave==='function') gnsiMarkLocalSave(8000);
    sbPushCredential(staffId);
  };
})();
/* -- Patch adminResetPwd → push to Supabase immediately -- */
(function(){
  if(typeof adminResetPwd !== 'function') return;
  var _orig = adminResetPwd;
  adminResetPwd = function(staffId, staffName) {
    _orig(staffId, staffName);
    // FIX: stamp guard so realtime cred echo can't revert the password reset
    if(typeof gnsiMarkLocalSave==='function') gnsiMarkLocalSave(8000);
    sbPushCredential(staffId);
  };
})();
/* -- Patch changeMyPassword → push own row to Supabase -- */
(function(){
  if(typeof changeMyPassword !== 'function') return;
  var _orig = changeMyPassword;
  changeMyPassword = function() {
    _orig();
    // FIX: stamp guard so realtime cred echo can't revert the password change
    if(typeof gnsiMarkLocalSave==='function') gnsiMarkLocalSave(8000);
    if (currentUser) sbPushCredential(currentUser.id);
  };
})();
/* -- Patch deleteUsername → delete row from Supabase -- */
(function(){
  if(typeof deleteUsername !== 'function') return;
  var _orig = deleteUsername;
  deleteUsername = function(staffId) {
    _orig(staffId);
    sbDeleteCredential(staffId);
  };
})();
/* -- gnsiProvisionCredentials already calls sbPushCredential directly (v2 fix) -- */
/* -- Patch adminSetRoleSecure → push role change to Supabase -- */
(function(){
  if(typeof adminSetRoleSecure !== 'function') return;
  var _orig = adminSetRoleSecure;
  adminSetRoleSecure = function(staffId, role) {
    _orig(staffId, role);
    // FIX: stamp guard so realtime KV echo can't revert the role change
    if(typeof gnsiMarkLocalSave==='function') gnsiMarkLocalSave(8000);
    setTimeout(function() { sbPushCredential(staffId); }, 100);
  };
})();
/* -- Patch init → pull ALL credentials BEFORE login check (v2) --- */
(function(){
  if(typeof init !== 'function') return;
  var _origInit = init;
  init = function() {
    var client = (typeof _getSb==='function' ? _getSb() : null) || (typeof _supa!=='undefined' ? _supa : null);
    if (client && typeof sbPullAllCredentials === 'function') {
      // Safety: if Supabase takes >1.5s, boot login immediately anyway
      var _initFired = false;
      var _initFallback = setTimeout(function(){
        if(!_initFired){ _initFired=true; _origInit(); }
      }, 1500);
      sbPullAllCredentials(function() {
        clearTimeout(_initFallback);
        if(!_initFired){ _initFired=true; _origInit(); }
      });
    } else {
      _origInit();
      // Retry credential pull silently in background
      setTimeout(function(){
        var c2 = (typeof _getSb==='function'?_getSb():null)||(typeof _supa!=='undefined'?_supa:null);
        if(c2 && typeof sbPullAllCredentials==='function') sbPullAllCredentials(function(){});
      }, 3000);
    }
  };
})();
/* -- AUTO-PUSH: sync any local credentials not yet in cloud (v2) --
   Runs on every page load -- no 'done' guard so it always checks
   for missing rows. Fixes staff added on device A not being able
   to log in on device B.                                           */
(function(){
  window.addEventListener('load', function(){
    setTimeout(function(){
      var client = (typeof _getSb==='function' ? _getSb() : null) || (typeof _supa!=='undefined' ? _supa : null);
      if (!client) return;
      var toPush = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!k) continue;
        var m = k.match(/^gnsi_uname_(\d+)$/);
        if (m) { var sid = parseInt(m[1], 10); if (toPush.indexOf(sid) === -1) toPush.push(sid); }
      }
      if (!toPush.length) return;
      client.from('gnsi_staff_credentials').select('staff_id').then(function(result){
        var cloudIds = (result.data || []).map(function(r){ return r.staff_id; });
        var missing = toPush.filter(function(sid){ return cloudIds.indexOf(sid) === -1; });
        if (!missing.length) return;
        (void 0);
        missing.forEach(function(sid){ if (typeof sbPushCredential === 'function') sbPushCredential(sid); });
        // Silent -- no toast for background auto-push (prevents popup flood on login)
      }).catch(function(e){ (void 0); });
    }, 5000);
  });
})();
/* -- INIT -----------------------------------------------------*/

/* ══ GNSI IDLE SESSION TIMEOUT ══════════════════════════════════════════════
   Auto-logs out after 30 min inactivity. 60-sec warning modal before logout. */
var GNSI_IDLE_MINUTES  = 30;
var _gnsiIdleTimer     = null;
var _gnsiIdleWarnEl    = null;
var _gnsiIdleCountdown = 60;
var _gnsiIdleCountInt  = null;

function gnsiResetIdleTimer(){
  if(!currentUser) return;
  clearTimeout(_gnsiIdleTimer);
  if(_gnsiIdleWarnEl){ _gnsiIdleWarnEl.remove(); _gnsiIdleWarnEl=null; }
  clearInterval(_gnsiIdleCountInt);
  _gnsiIdleTimer=setTimeout(gnsiIdleWarn,(GNSI_IDLE_MINUTES-1)*60*1000);
}
function gnsiIdleWarn(){
  if(!currentUser) return;
  _gnsiIdleCountdown=60;
  _gnsiIdleWarnEl=document.createElement('div');
  _gnsiIdleWarnEl.id='gnsi-idle-warn';
  _gnsiIdleWarnEl.style.cssText='position:fixed;inset:0;z-index:999999;background:rgba(8,15,38,.75);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)';
  _gnsiIdleWarnEl.innerHTML='<div style="background:var(--surface,#fff);border-radius:18px;padding:32px 28px;max-width:360px;width:90%;text-align:center;box-shadow:0 12px 48px rgba(0,0,0,.3)"><div style="font-size:48px;margin-bottom:12px">&#128274;</div><div style="font-size:18px;font-weight:800;color:var(--text,#1e293b);margin-bottom:8px">Session Expiring</div><div style="font-size:13px;color:var(--muted,#64748b);margin-bottom:18px">Inactive for '+(GNSI_IDLE_MINUTES-1)+' min. You will be signed out in <b id=\"gnsi-idle-secs\" style=\"color:#dc2626\">60</b> seconds.</div><div style="display:flex;gap:10px;justify-content:center"><button onclick=\"gnsiResetIdleTimer();gnsiStartIdleWatch()\" style=\"padding:10px 22px;border-radius:10px;background:var(--accent,#1433a8);color:#fff;border:none;font-size:14px;font-weight:700;cursor:pointer\">&#10004; Stay Signed In</button><button onclick=\"gnsiIdleLogout()\" style=\"padding:10px 22px;border-radius:10px;border:1.5px solid var(--border,#e2e8f0);background:var(--surface,#fff);color:var(--muted,#64748b);font-size:14px;font-weight:700;cursor:pointer\">Sign Out</button></div></div>';
  document.body.appendChild(_gnsiIdleWarnEl);
  _gnsiIdleCountInt=setInterval(function(){
    _gnsiIdleCountdown--;
    var el=document.getElementById('gnsi-idle-secs');
    if(el)el.textContent=_gnsiIdleCountdown;
    if(_gnsiIdleCountdown<=0){clearInterval(_gnsiIdleCountInt);gnsiIdleLogout();}
  },1000);
}
function gnsiIdleLogout(){
  clearInterval(_gnsiIdleCountInt);
  if(_gnsiIdleWarnEl){_gnsiIdleWarnEl.remove();_gnsiIdleWarnEl=null;}
  if(typeof doLogout==='function')doLogout(true);
}
function gnsiStartIdleWatch(){
  gnsiResetIdleTimer();
  ['mousemove','mousedown','keydown','touchstart','scroll','click'].forEach(function(ev){
    document.addEventListener(ev,gnsiResetIdleTimer,{passive:true});
  });
}
function gnsiStopIdleWatch(){
  clearTimeout(_gnsiIdleTimer);
  clearInterval(_gnsiIdleCountInt);
  ['mousemove','mousedown','keydown','touchstart','scroll','click'].forEach(function(ev){
    document.removeEventListener(ev,gnsiResetIdleTimer);
  });
  if(_gnsiIdleWarnEl){_gnsiIdleWarnEl.remove();_gnsiIdleWarnEl=null;}
}

function gnsiManualSync() {
  if (typeof showToast === 'function') showToast('🔄 Syncing from cloud…', '#1433a8');
  gnsiFinanceInvalidateCache();
  if (typeof loadFromSupabase === 'function') {
    loadFromSupabase(function() {
      if (typeof showToast === 'function') showToast('✅ Sync complete', '#16a34a');
      if (typeof render === 'function') render();
    });
  }
  if (typeof gnsiFinanceInit === 'function') gnsiFinanceInit();
}

function initApp(){
  document.getElementById('topbar-date').textContent=
    new Date().toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'long',year:'numeric'});
  if(!currentUser)return;

  /* ONE-TIME CLEANUP: remove stale localStorage credential keys from old system.
     Admin credentials (staff_id=1) are preserved. Runs once per browser. */
  (function _gnsiCleanOldCreds() {
    if (localStorage.getItem('_gnsi_creds_cleaned_v2') === '1') return;
    try {
      var toRemove = [];
      for (var _ci = 0; _ci < localStorage.length; _ci++) {
        var _ck = localStorage.key(_ci);
        if (!_ck) continue;
        if ((_ck.indexOf('gnsi_pwd_') === 0          && _ck !== 'gnsi_pwd_1') ||
            (_ck.indexOf('gnsi_uname_') === 0         && _ck !== 'gnsi_uname_1') ||
            (_ck.indexOf('gnsi_pwd_must_change_') === 0 && _ck !== 'gnsi_pwd_must_change_1') ||
            (_ck.indexOf('gnsi_pwd_changed_') === 0   && _ck !== 'gnsi_pwd_changed_1') ||
            (_ck.indexOf('gnsi_role_') === 0           && _ck !== 'gnsi_role_1' && _ck.indexOf('gnsi_role_sig_') !== 0)) {
          toRemove.push(_ck);
        }
      }
      toRemove.forEach(function(k){ localStorage.removeItem(k); });
      localStorage.setItem('_gnsi_creds_cleaned_v2', '1');
    } catch(e) {}
  })();
  // Update topbar avatar
  var av=document.getElementById('topbar-avatar');
  var words=currentUser.name.trim().split(' ');
  var ini=(words[0][0]+(words[1]?words[1][0]:'')).toUpperCase();
  var hue=currentUser.name.split('').reduce(function(a,c){return a+c.charCodeAt(0)},0)%360;
  av.textContent=ini;
  av.style.background='hsl('+hue+',45%,42%)';
  av.title=currentUser.name;
  // Role badge
  var rb=document.getElementById('topbar-role-badge');
  if(rb){rb.textContent=ROLE_LABELS[currentUser.role];rb.style.display='inline-flex';}
  // House Master quick-access button -- show for housemaster, hostel, admin, manager
  var hmBtn = document.getElementById('hm-topbar-btn');
  if(hmBtn){
    var showHmBtn = ['admin','manager','housemaster','hostel'].indexOf(currentUser.role) !== -1;
    hmBtn.style.display = showHmBtn ? 'inline-flex' : 'none';
  }
  // Always land on dashboard after login
  activePage='dashboard';
  if(!canAccess('dashboard'))activePage=currentUser.pages[0]||'notices';
  buildNav();
  // FIX: setTimeout is reliable -- rAF throttled on first load
  setTimeout(function(){if(typeof render==='function')render();},80);
  gnsiStartIdleWatch();
}
function init(){
  document.getElementById('topbar-date').textContent=
    new Date().toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'long',year:'numeric'});
  // Initialise Supabase-backed finance data
  // ▸ PERF: gnsiFinanceInit deferred -- fires 2s after login, not on cold page load
  // Check for existing session
  var session=loadSession();
  var member=session?staff.find(function(s){return s.id===session.id;}):null;
  // Try to pull latest data from Firebase on startup, then launch the app
  // Guard: autoFbPull may not be defined if Firebase scripts failed to load
  var _fbBoot = function(cb){
    if(typeof autoFbPull === 'function'){
      autoFbPull(cb);
    } else {
      // Firebase unavailable -- boot immediately from localStorage
      try { cb(); } catch(e) { (void 0); showLoginScreen(); }
    }
  };
  _fbBoot(function(){
    // Re-validate member against potentially refreshed staff list
    if(session) member=staff.find(function(s){return s.id===session.id;});
    if(member){
      var sysRole=detectRole(member);
      currentUser={
        id:member.id,name:member.name,
        role:sysRole,staffRole:member.role,
        pages:ROLE_PAGES[sysRole]||ROLE_PAGES.staff
      };
      saveSession(currentUser);
      /* ── PROGRESS MILESTONE 60%: session restored ── */
      if(typeof window._gnsiProgress==='function') window._gnsiProgress(60,'Session restored…');
      hideLoginScreen();
      initApp();
      _gnsiRunPostLoginSync(); // FIX: also run parallel data sync for returning sessions
    } else {
      showLoginScreen();
    }
  });
}
init();
</script>
<!-- ══════════════════════════════════════════════════════════
     MOBILE UI ELEMENTS
     ══════════════════════════════════════════════════════════ -->
<!-- Mobile top bar -->
<div id="mobile-topbar">
  <button class="mob-menu-btn" onclick="toggleMobileMenu()" title="Menu">&#9776;</button>
  <div class="mob-topbar-title" id="mob-page-title">Dashboard</div>
  <div class="mob-topbar-right">
    <div class="avatar" id="mob-topbar-avatar" style="width:32px;height:32px;font-size:11px;cursor:pointer;flex-shrink:0"></div>
    <button class="mob-logout-btn" onclick="doLogout()">&#128274; Out</button>
  </div>
</div>
<!-- Sidebar overlay for mobile -->
<div id="sidebar-overlay" onclick="closeMobileMenu()"></div>
<!-- Mobile bottom navigation -->
<div id="mobile-nav">
  <div class="mobile-nav-inner" id="mob-nav-inner"></div>
</div>
<script>
var _mobileMenuOpen = false;
function toggleMobileMenu(){ _mobileMenuOpen ? closeMobileMenu() : openMobileMenu(); }
function openMobileMenu(){
  /* SECURITY: never reveal sidebar content before login */
  if (typeof currentUser === 'undefined' || !currentUser) return;
  _mobileMenuOpen = true;
  var sb=document.getElementById('sidebar'), ov=document.getElementById('sidebar-overlay');
  if(sb){ sb.classList.add('mobile-open'); sb.style.visibility='visible'; }
  if(ov){ ov.classList.add('show'); }
}
function closeMobileMenu(){
  _mobileMenuOpen = false;
  var sb=document.getElementById('sidebar'), ov=document.getElementById('sidebar-overlay');
  if(sb){ sb.classList.remove('mobile-open'); }
  if(ov){ ov.classList.remove('show'); }
}
function syncMobTitle(pageId){
  var pg = typeof PAGES!=='undefined' ? PAGES.find(function(p){return p.id===pageId;}) : null;
  var el = document.getElementById('mob-page-title');
  if(el && pg) el.textContent = pg.label;
}
function buildMobNav(){
  var inner = document.getElementById('mob-nav-inner');
  if(!inner) return;
  if(typeof currentUser==='undefined'||!currentUser){ inner.innerHTML=''; return; }
  // Admin always gets full page list; others get their assigned pages
  var pages;
  if(currentUser.id===1||currentUser.role==='admin'){
    pages = typeof ROLE_PAGES!=='undefined' ? (ROLE_PAGES.admin||[]) : (currentUser.pages||[]);
  } else {
    pages = currentUser.pages || [];
  }
  function _mSvg(path){ return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+path+'</svg>'; }
  var iconMap={
    dashboard:    _mSvg('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'),
    admincentre:  _mSvg('<path d="M12 2l2.4 4.8 5.3.8-3.85 3.75.91 5.3L12 14.25l-4.76 2.48.91-5.3L4.3 7.6l5.3-.8z"/>'),
    leaderboard:  _mSvg('<rect x="2" y="14" width="4" height="7" rx="1"/><rect x="10" y="9" width="4" height="12" rx="1"/><rect x="18" y="5" width="4" height="16" rx="1"/><path d="M20 5l-2-3-2 3"/>'),
    reportcollect:_mSvg('<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/>'),
    faculty:      _mSvg('<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/><path d="M15 6l1.5 1.5L20 4"/>'),
    staff:        _mSvg('<circle cx="9" cy="7" r="4"/><path d="M2 21v-2a7 7 0 0114 0v2"/><circle cx="19" cy="8" r="3"/><path d="M22 21v-1a4 4 0 00-3-3.87"/>'),
    students:     _mSvg('<path d="M12 3L2 8l10 5 10-5-10-5z"/><path d="M2 8v6"/><path d="M6 10.5v5.5a6 6 0 0012 0v-5.5"/>'),
    admissions:   _mSvg('<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M12 11v6M9 14l3 3 3-3"/>'),
    sessions:     _mSvg('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><circle cx="12" cy="16" r="2"/><path d="M12 14v-2"/>'),
    classes:      _mSvg('<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><path d="M7 8h10M7 12h6"/>'),
    attendance:   _mSvg('<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>'),
    notices:      _mSvg('<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/><path d="M12 2v2"/>'),
    accounts:     _mSvg('<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M6 15h2M10 15h4"/>'),
    fees:         _mSvg('<circle cx="12" cy="12" r="10"/><path d="M12 6v2M12 16v2"/><path d="M9 9.5A2.5 2.5 0 0114 11c0 1.5-1 2-2 2.5S10 14.5 10 16h4"/>'),
    timetable:    _mSvg('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/><path d="M13 13h4M13 17h4M5 13h2M5 17h2"/>'),
    exam:         _mSvg('<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M9 13l2 2 4-4"/>'),
    exammanager:  _mSvg('<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/><circle cx="17" cy="17" r="3"/><path d="M19.5 19.5L22 22"/>'),
    periodsalary: _mSvg('<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-4 0v2M8 7V5a2 2 0 00-4 0v2"/><circle cx="12" cy="14" r="2"/>'),
    doubttt:      _mSvg('<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>'),
    dutyhours:    _mSvg('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'),
    boarder:      _mSvg('<path d="M3 12l9-9 9 9"/><path d="M9 21V12h6v9"/><path d="M5 10v11h14V10"/><path d="M10 16h4"/>'),
    hostel:       _mSvg('<rect x="2" y="7" width="20" height="14" rx="1"/><path d="M16 21V7a4 4 0 00-8 0v14"/><path d="M2 13h20"/><circle cx="7" cy="16" r="1.5"/><circle cx="17" cy="16" r="1.5"/>'),
    kitchen:      _mSvg('<path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><path d="M6 1v3M10 1v3M14 1v3"/>'),
    housemaster:  _mSvg('<path d="M3 12l9-9 9 9"/><path d="M5 10v11h14V10"/><circle cx="12" cy="14" r="3"/><path d="M12 11v6M9 14h6"/>'),
    house:        _mSvg('<path d="M3 12l9-9 9 9"/><path d="M5 10v11h14V10"/><rect x="9" y="15" width="6" height="6" rx="0.5"/><path d="M12 15v6"/>'),
    healthmonitor:_mSvg('<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>'),
    reception:    _mSvg('<path d="M22 16.92v3a2 2 0 01-2.18 2 19.8 19.8 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>'),
    ntsmonitor:   _mSvg('<path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>'),
    reports:      _mSvg('<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'),
    sync:         _mSvg('<path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>'),
    settings:     _mSvg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>'),
  };
  var labelMap={dashboard:'Home',admincentre:'Admin',leaderboard:'Leaders',reportcollect:'Reports',faculty:'Faculty',staff:'Staff',students:'Students',admissions:'Admissions',sessions:'Sessions',classes:'Classes',attendance:'Attendance',notices:'Notices',accounts:'Accounts',fees:'Fees',timetable:'Timetable',exam:'Exam Hub',exammanager:'Exam Mgr',periodsalary:'Salary',doubttt:'Doubt TT',dutyhours:'Duty',boarder:'Boarder',hostel:'Hostel',kitchen:'Kitchen',housemaster:'HM',house:'House',healthmonitor:'Health',reception:'Reception',ntsmonitor:'NTS',reports:'Reports',sync:'Sync',settings:'Settings'};
  var html='';
  pages.forEach(function(pid){
    var active=(typeof activePage!=='undefined'&&activePage===pid)?' active':'';
    html+='<button class="mob-nav-btn'+active+'" onclick="navigateMobile(\''+pid+'\')">'
         +'<span class="mob-icon">'+(iconMap[pid]||_mSvg('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 12h8M12 8v8"/>'))+'</span>'
         +'<span class="mob-label">'+(labelMap[pid]||pid)+'</span></button>';
  });
  inner.innerHTML = html;
}
function navigateMobile(pageId){
  closeMobileMenu();
  if(typeof navigate==='function') navigate(pageId);
  syncMobTitle(pageId);
  buildMobNav();
}
function showMobileUI(){
  if(typeof currentUser!=='undefined'&&currentUser){
    var av=document.getElementById('mob-topbar-avatar');
    if(av){
      var words=currentUser.name.trim().split(' ');
      var ini=(words[0][0]+(words[1]?words[1][0]:'')).toUpperCase();
      var hue=currentUser.name.split('').reduce(function(a,c){return a+c.charCodeAt(0);},0)%360;
      av.textContent=ini; av.style.background='hsl('+hue+',45%,42%)'; av.title=currentUser.name;
    }
    syncMobTitle(typeof activePage!=='undefined'?activePage:'dashboard');
    buildMobNav();
  }
}
(function(){
  if(typeof initApp==='function'){
    var _orig=initApp;
    initApp=function(){ _orig(); showMobileUI(); };
  }
})();
(function(){
  if(typeof navigate==='function'){
    var _n0=navigate;
    navigate=function(pid){ _n0(pid); syncMobTitle(pid); buildMobNav(); };
  }
})();
(function(){
  if(typeof doLogout==='function'){
    var _dl=doLogout;
    doLogout=function(){
      _dl();
      closeMobileMenu();
    };
  }
})();
(function(){
  var sx=0, sy=0;
  document.addEventListener('touchstart',function(e){sx=e.touches[0].clientX;sy=e.touches[0].clientY;},{passive:true});
  document.addEventListener('touchend',function(e){
    var dx=e.changedTouches[0].clientX-sx, dy=e.changedTouches[0].clientY-sy;
    if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5){
      if(dx>0&&sx<40) openMobileMenu();
      else if(dx<0&&_mobileMenuOpen) closeMobileMenu();
    }
  },{passive:true});
})();
var _ovEl=document.getElementById('sidebar-overlay');
if(_ovEl) _ovEl.addEventListener('touchmove',function(e){e.preventDefault();},{passive:false});
</script>
<!-- ══════════════════════════════════════════════════════════════
     ADMIN DATA ACTION PERMISSION CONTROL SYSTEM
     Controls who can Add / Edit / Delete data per module per role
     ══════════════════════════════════════════════════════════════ -->
<script>
var DATA_PERMS_DEFAULT = {
  admin: {
    staff:        {add:true,  edit:true,  del:true },
    students:     {add:true,  edit:true,  del:true },
    admissions:   {add:true,  edit:true,  del:true },
    classes:      {add:true,  edit:true,  del:true },
    attendance:   {add:true,  edit:true,  del:true },
    notices:      {add:true,  edit:true,  del:true },
    accounts:     {add:true,  edit:true,  del:true },
    fees:         {add:true,  edit:true,  del:true },
    timetable:    {add:true,  edit:true,  del:true },
    exam:         {add:true,  edit:true,  del:true },
    periodsalary: {add:true,  edit:true,  del:true },
    doubttt:      {add:true,  edit:true,  del:true },
    dutyhours:    {add:true,  edit:true,  del:true },
    boarder:      {add:true,  edit:true,  del:true },
    hostel:       {add:true,  edit:true,  del:true },
    housemaster:  {add:true,  edit:true,  del:true },
    reception:    {add:true,  edit:true,  del:true }
  },
  manager: {
    staff:        {add:true,  edit:true,  del:false},
    students:     {add:true,  edit:true,  del:false},
    admissions:   {add:true,  edit:true,  del:false},
    classes:      {add:true,  edit:true,  del:false},
    attendance:   {add:true,  edit:true,  del:false},
    notices:      {add:true,  edit:true,  del:false},
    accounts:     {add:true,  edit:true,  del:false},
    fees:         {add:true,  edit:true,  del:false},
    timetable:    {add:true,  edit:true,  del:false},
    exam:         {add:true,  edit:true,  del:false},
    periodsalary: {add:true,  edit:true,  del:false},
    doubttt:      {add:true,  edit:true,  del:false},
    dutyhours:    {add:true,  edit:true,  del:false},
    boarder:      {add:true,  edit:true,  del:false},
    hostel:       {add:true,  edit:true,  del:false},
    housemaster:  {add:true,  edit:true,  del:false},
    reception:    {add:true,  edit:true,  del:false}
  },
  accounts: {
    staff:        {add:false, edit:false, del:false},
    students:     {add:false, edit:false, del:false},
    admissions:   {add:true,  edit:true,  del:false},
    classes:      {add:false, edit:false, del:false},
    attendance:   {add:false, edit:false, del:false},
    notices:      {add:false, edit:false, del:false},
    accounts:     {add:true,  edit:true,  del:false},
    fees:         {add:true,  edit:true,  del:false},
    timetable:    {add:false, edit:false, del:false},
    exam:         {add:false, edit:false, del:false},
    periodsalary: {add:false, edit:false, del:false},
    doubttt:      {add:false, edit:false, del:false},
    dutyhours:    {add:false, edit:false, del:false},
    boarder:      {add:false, edit:false, del:false},
    hostel:       {add:false, edit:false, del:false},
    reception:    {add:true,  edit:true,  del:false}
  },
  teacher: {
    staff:        {add:false, edit:false, del:false},
    students:     {add:false, edit:false, del:false},
    admissions:   {add:false, edit:false, del:false},
    classes:      {add:false, edit:false, del:false},
    attendance:   {add:true,  edit:true,  del:false},
    notices:      {add:false, edit:false, del:false},
    accounts:     {add:false, edit:false, del:false},
    fees:         {add:false, edit:false, del:false},
    timetable:    {add:false, edit:false, del:false},
    exam:         {add:true,  edit:true,  del:false},
    periodsalary: {add:false, edit:false, del:false},
    doubttt:      {add:true,  edit:true,  del:false},
    dutyhours:    {add:false, edit:false, del:false},
    boarder:      {add:false, edit:false, del:false},
    hostel:       {add:false, edit:false, del:false},
    reception:    {add:false, edit:false, del:false}
  },
  hostel: {
    staff:        {add:false, edit:false, del:false},
    students:     {add:false, edit:false, del:false},
    admissions:   {add:false, edit:false, del:false},
    classes:      {add:false, edit:false, del:false},
    attendance:   {add:true,  edit:true,  del:false},
    notices:      {add:false, edit:false, del:false},
    accounts:     {add:false, edit:false, del:false},
    fees:         {add:false, edit:false, del:false},
    timetable:    {add:false, edit:false, del:false},
    exam:         {add:false, edit:false, del:false},
    periodsalary: {add:false, edit:false, del:false},
    doubttt:      {add:false, edit:false, del:false},
    dutyhours:    {add:true,  edit:true,  del:false},
    boarder:      {add:true,  edit:true,  del:false},
    hostel:       {add:true,  edit:true,  del:false},
    housemaster:  {add:true,  edit:true,  del:false},
    reception:    {add:false, edit:false, del:false}
  },
  housemaster: {
    staff:        {add:false, edit:false, del:false},
    students:     {add:false, edit:false, del:false},
    admissions:   {add:false, edit:false, del:false},
    classes:      {add:false, edit:false, del:false},
    attendance:   {add:true,  edit:true,  del:false},
    notices:      {add:false, edit:false, del:false},
    accounts:     {add:false, edit:false, del:false},
    fees:         {add:false, edit:false, del:false},
    timetable:    {add:false, edit:false, del:false},
    exam:         {add:false, edit:false, del:false},
    periodsalary: {add:false, edit:false, del:false},
    doubttt:      {add:true,  edit:true,  del:false},
    dutyhours:    {add:true,  edit:true,  del:false},
    boarder:      {add:true,  edit:true,  del:false},
    hostel:       {add:true,  edit:true,  del:false},
    housemaster:  {add:true,  edit:true,  del:false},
    reception:    {add:false, edit:false, del:false}
  },
  it: {
    staff:        {add:false, edit:false, del:false},
    students:     {add:false, edit:false, del:false},
    admissions:   {add:false, edit:false, del:false},
    classes:      {add:false, edit:false, del:false},
    attendance:   {add:false, edit:false, del:false},
    notices:      {add:false, edit:false, del:false},
    accounts:     {add:false, edit:false, del:false},
    fees:         {add:false, edit:false, del:false},
    timetable:    {add:false, edit:false, del:false},
    exam:         {add:false, edit:false, del:false},
    periodsalary: {add:false, edit:false, del:false},
    doubttt:      {add:false, edit:false, del:false},
    dutyhours:    {add:false, edit:false, del:false},
    boarder:      {add:false, edit:false, del:false},
    hostel:       {add:false, edit:false, del:false},
    reception:    {add:false, edit:false, del:false}
  },
  staff: {
    staff:        {add:false, edit:false, del:false},
    students:     {add:false, edit:false, del:false},
    admissions:   {add:false, edit:false, del:false},
    classes:      {add:false, edit:false, del:false},
    attendance:   {add:false, edit:false, del:false},
    notices:      {add:false, edit:false, del:false},
    accounts:     {add:false, edit:false, del:false},
    fees:         {add:false, edit:false, del:false},
    timetable:    {add:false, edit:false, del:false},
    exam:         {add:false, edit:false, del:false},
    periodsalary: {add:false, edit:false, del:false},
    doubttt:      {add:false, edit:false, del:false},
    dutyhours:    {add:false, edit:false, del:false},
    boarder:      {add:false, edit:false, del:false},
    hostel:       {add:false, edit:false, del:false},
    reception:    {add:false, edit:false, del:false}
  }
};
function deepClonePerms(obj){return JSON.parse(JSON.stringify(obj));}
function loadDataPerms(){
  var _raw=localStorage.getItem('gnsi_data_perms');
  var _sig=localStorage.getItem('gnsi_data_perms_sig');
  /* PRIV-ESC FIX A: reject unsigned or malformed permission data */
  if(!_raw){return deepClonePerms(DATA_PERMS_DEFAULT);}
  if(!_sig||!/^[0-9a-f]{64}$/.test(_sig)){
    localStorage.removeItem('gnsi_data_perms');localStorage.removeItem('gnsi_data_perms_sig');
    return deepClonePerms(DATA_PERMS_DEFAULT);
  }
  /* async background re-verify */
  (function(){
    var _k=getStoredHash(1)||'GNSI_PERMS_NOSIG';
    var _e=new TextEncoder();
    crypto.subtle.importKey('raw',_e.encode(_k),{name:'HMAC',hash:'SHA-256'},false,['verify'])
      .then(function(k){
        var _sb=new Uint8Array(_sig.match(/../g).map(function(h){return parseInt(h,16);}));
        return crypto.subtle.verify('HMAC',k,_sb,_e.encode(_raw));
      }).then(function(ok){
        if(!ok){
          localStorage.removeItem('gnsi_data_perms');localStorage.removeItem('gnsi_data_perms_sig');
          DATA_PERMS=deepClonePerms(DATA_PERMS_DEFAULT);
          if(typeof showToast==='function')showToast('?? Permission tampering detected — reset to defaults','#dc2626');
          if(typeof render==='function')render();
        }
      }).catch(function(){});
  })();
  try{var p=JSON.parse(_raw);if(p&&typeof p==='object')return p;}catch(e){}
  return deepClonePerms(DATA_PERMS_DEFAULT);
}
function saveDataPerms(dp){
  var _gnsiAllowed=['admin'];
  if(!currentUser||_gnsiAllowed.indexOf(currentUser.role)<0){
    if(typeof showToast==='function')showToast('🔒 Access denied: Save data permissions','#dc2626');
    return;
  }
var _dpJson=JSON.stringify(dp);
  localStorage.setItem('gnsi_data_perms',_dpJson);
  /* PRIV-ESC FIX A: sign permissions with admin PBKDF2 hash so DevTools tampering is detected */
  (function(){
    var _k=getStoredHash(1)||'GNSI_PERMS_NOSIG';
    var _e=new TextEncoder();
    crypto.subtle.importKey('raw',_e.encode(_k),{name:'HMAC',hash:'SHA-256'},false,['sign'])
      .then(function(k){return crypto.subtle.sign('HMAC',k,_e.encode(_dpJson));})
      .then(function(b){
        localStorage.setItem('gnsi_data_perms_sig',Array.from(new Uint8Array(b)).map(function(x){return('00'+x.toString(16)).slice(-2);}).join(''));
      }).catch(function(){});
  })();
  if(typeof gnsiKVPush==='function')gnsiKVPush('gnsi_data_perms',dp);
}
var DATA_PERMS = loadDataPerms();
function canDo(action, module){
  if(!currentUser) return false;
  var role = currentUser.role;
  
  if(role === 'admin') return true;
  var rp = DATA_PERMS[role];
  if(!rp) return false;
  var mp = rp[module];
  if(!mp) return false;
  return !!mp[action];
}
function dpDenied(action, module){
  var actionLabel={add:'Add',edit:'Edit',del:'Delete'};
  var modLabel=(module||'').charAt(0).toUpperCase()+(module||'').slice(1);
  showToast('🔒 Permission denied: Cannot '+actionLabel[action]+' in '+modLabel+'. Contact Administrator.','#c0291d');
}
(function(){
  if(typeof addStaff==='function'){
    var _orig=addStaff;
    addStaff=function(){
      if(!canDo('add','staff')){dpDenied('add','staff');return;}
      _orig();
    };
  }
  if(typeof removeStaff==='function'){
    var _orig2=removeStaff;
    removeStaff=function(id){
      if(!canDo('del','staff')){dpDenied('del','staff');return;}
      _orig2(id);
    };
  }
})();
(function(){
  if(typeof addStudent==='function'){
    var _orig=addStudent;
    addStudent=function(){
      if(!canDo('add','students')){dpDenied('add','students');return;}
      _orig();
    };
  }
  if(typeof removeStudent==='function'){
    var _orig2=removeStudent;
    removeStudent=function(id){
      if(!canDo('del','students')){dpDenied('del','students');return;}
      _orig2(id);
    };
  }
})();
(function(){
  if(typeof addNotice==='function'){
    var _orig=addNotice;
    addNotice=function(){
      if(!canDo('add','notices')){dpDenied('add','notices');return;}
      _orig();
    };
  }
  if(typeof removeNotice==='function'){
    var _orig2=removeNotice;
    removeNotice=function(id){
      if(!canDo('del','notices')){dpDenied('del','notices');return;}
      _orig2(id);
    };
  }
})();
(function(){
  if(typeof addClass==='function'){
    var _orig=addClass;
    addClass=function(){
      if(!canDo('add','classes')){dpDenied('add','classes');return;}
      _orig();
    };
  }
  if(typeof deleteClass==='function'){
    var _orig2=deleteClass;
    deleteClass=function(id){
      if(!_isAdminOrArunkumar()){dpDenied('del','classes');return;}
      _orig2(id);
    };
  }
  if(typeof updateClass==='function'){
    var _orig3=updateClass;
    updateClass=function(id){
      if(!canDo('edit','classes')){dpDenied('edit','classes');return;}
      _orig3(id);
    };
  }
})();
(function(){
  if(typeof feeSaveAdmRecord==='function'){
    var _o=feeSaveAdmRecord;
    feeSaveAdmRecord=function(){
      if(!canDo('add','fees')){dpDenied('add','fees');return;}
      _o();
    };
  }
  if(typeof feeDeleteAdmRecord==='function'){
    var _o2=feeDeleteAdmRecord;
    feeDeleteAdmRecord=function(id){
      if(!canDo('del','fees')){dpDenied('del','fees');return;}
      _o2(id);
    };
  }
  if(typeof feeSaveMonthRecord==='function'){
    var _o3=feeSaveMonthRecord;
    feeSaveMonthRecord=function(){
      if(!canDo('add','fees')){dpDenied('add','fees');return;}
      _o3();
    };
  }
  if(typeof feeDeleteMonthRecord==='function'){
    var _o4=feeDeleteMonthRecord;
    feeDeleteMonthRecord=function(id){
      if(!canDo('del','fees')){dpDenied('del','fees');return;}
      _o4(id);
    };
  }
  if(typeof feeSaveIncome==='function'){
    var _o5=feeSaveIncome;
    feeSaveIncome=function(){
      if(!canDo('add','accounts')){dpDenied('add','accounts');return;}
      _o5();
    };
  }
  if(typeof feeDeleteIncome==='function'){
    var _o6=feeDeleteIncome;
    feeDeleteIncome=function(id){
      if(!canDo('del','accounts')){dpDenied('del','accounts');return;}
      _o6(id);
    };
  }
  if(typeof feeSaveExp==='function'){
    var _o7=feeSaveExp;
    feeSaveExp=function(){
      if(!canDo('add','accounts')){dpDenied('add','accounts');return;}
      _o7();
    };
  }
  if(typeof feeDeleteExp==='function'){
    var _o8=feeDeleteExp;
    feeDeleteExp=function(id){
      if(!canDo('del','accounts')){dpDenied('del','accounts');return;}
      _o8(id);
    };
  }
})();
(function(){
  if(typeof examSaveAll==='function'){
    var _o=examSaveAll;
    examSaveAll=function(){
      if(!canDo('edit','exam')){dpDenied('edit','exam');return;}
      _o();
    };
  }
  if(typeof examDeleteMark==='function'){
    var _o2=examDeleteMark;
    examDeleteMark=function(a,b){
      if(!canDo('del','exam')){dpDenied('del','exam');return;}
      _o2(a,b);
    };
  }
})();
var DP_MODULES = [
  {id:'staff',       label:'Staff',           icon:'👥'},
  {id:'students',    label:'Students',         icon:'🎓'},
  {id:'classes',     label:'Classes',          icon:'📚'},
  {id:'attendance',  label:'Attendance',        icon:'✅'},
  {id:'notices',     label:'Notice Board',     icon:'📌'},
  {id:'accounts',    label:'Accounts',          icon:'💰'},
  {id:'fees',        label:'Fee Records',       icon:'🏦'},
  {id:'timetable',   label:'Timetable',         icon:'📅'},
  {id:'exam',        label:'Exam & Results',   icon:'📝'},
  {id:'periodsalary',label:'Period & Salary',  icon:'💼'},
  {id:'doubttt',     label:'Doubt Session TT', icon:'❓'},
  {id:'dutyhours',   label:'Duty Hours',        icon:'⏱'},
  {id:'boarder',     label:'Boarder Schedule', icon:'🏠'},
  {id:'hostel',      label:'Hostel Mgmt',       icon:'🏡'},
  {id:'housemaster', label:'House Master',      icon:'🏘'},
  {id:'reception',   label:'Reception',          icon:'📞'}
];
var DP_ROLE_COLORS = {
  admin:'#1433a8', manager:'#7c3aed', accounts:'#d4a853',
  teacher:'#16a34a', hostel:'#3b78c9', housemaster:'#e63946', it:'#0891b2', staff:'#6474a0'
};
var DP_ACTION_COLORS = {add:'#16a34a', edit:'#1433a8', del:'#c0291d'};
function renderDataPermPanel(){
  var isAdmin = currentUser && currentUser.role === 'admin';
  var dp = DATA_PERMS;
  
  var roles = ['manager','accounts','teacher','hostel','housemaster','it','staff'];
  
  var thCells = roles.map(function(r){
    var col = DP_ROLE_COLORS[r] || '#6474a0';
    var cnt = (typeof staff !== 'undefined' ? staff : []).filter(function(s){
      return (typeof detectRole === 'function' ? detectRole(s) : '') === r;
    }).length;
    return '<th style="background:'+col+';min-width:126px;padding:0;border-left:2px solid rgba(255,255,255,.15)">'
      +'<div class="dp-role-hdr">'
      +'<div class="dp-role-name">'+(ROLE_LABELS[r]||r)+'</div>'
      +'<div class="dp-staff-ct">'+cnt+' staff</div>'
      +'<div class="dp-action-hdr">'
      +'<span class="dp-ah" style="background:rgba(22,163,74,.6)">Add</span>'
      +'<span class="dp-ah" style="background:rgba(20,51,168,.6)">Edit</span>'
      +'<span class="dp-ah" style="background:rgba(192,41,29,.6)">Del</span>'
      +'</div></div></th>';
  }).join('');
  
  var rows = DP_MODULES.map(function(mod, i){
    var bg = i%2===0 ? 'var(--surface)' : 'var(--surface2)';
    var cells = roles.map(function(r){
      var col = DP_ROLE_COLORS[r] || '#6474a0';
      var mperm = (dp[r] && dp[r][mod.id]) || {add:false,edit:false,del:false};
      if(isAdmin){
        // Render toggle switches
        var mkToggle = function(action, checked, acol){
          var uid = 'dp_'+r+'_'+mod.id+'_'+action;
          return '<label class="dp-toggle" title="'+(ROLE_LABELS[r]||r)+': '+(action==='del'?'Delete':action.charAt(0).toUpperCase()+action.slice(1))+' in '+mod.label+'">'
            +'<div class="dp-switch '+(checked?'dp-switch-on':'dp-switch-off')+'" style="'+(checked?'--dp-col:'+acol:'')
            +'"><input type="checkbox" id="'+uid+'" '+(checked?'checked':'')+' '
            +'onchange="dpToggle(\''+r+'\',\''+mod.id+'\',\''+action+'\',this.checked,this)"/>'
            +'<span class="dp-knob"></span></div>'
            +'</label>';
        };
        return '<td style="border-left:2px solid var(--border-soft)">'
          +'<div class="dp-cell-group">'
          +mkToggle('add', mperm.add,  DP_ACTION_COLORS.add)
          +mkToggle('edit',mperm.edit, DP_ACTION_COLORS.edit)
          +mkToggle('del', mperm.del,  DP_ACTION_COLORS.del)
          +'</div></td>';
      } else {
        
        var mkBadge = function(val, acol){
          return '<span style="display:inline-flex;align-items:center;justify-content:center;'
            +'width:22px;height:22px;border-radius:6px;font-size:12px;'
            +'background:'+(val?acol+'22':'var(--surface3)')+';'
            +'border:1.5px solid '+(val?acol:'var(--border)')+'">'
            +(val?'<span style="color:'+acol+'">✓</span>':'<span style="color:var(--muted2)">--</span>')+'</span>';
        };
        return '<td style="border-left:2px solid var(--border-soft)">'
          +'<div class="dp-cell-group">'
          +mkBadge(mperm.add,  DP_ACTION_COLORS.add)
          +mkBadge(mperm.edit, DP_ACTION_COLORS.edit)
          +mkBadge(mperm.del,  DP_ACTION_COLORS.del)
          +'</div></td>';
      }
    }).join('');
    return '<tr>'
      +'<td style="background:'+bg+'">'
      +'<span class="dp-mod-icon" style="background:var(--accent-light)">'+mod.icon+'</span>'
      +esc(mod.label)+'</td>'
      +cells+'</tr>';
  }).join('');
  var adminNote = isAdmin
    ? '<span style="margin-left:auto;font-size:11px;color:var(--muted);font-weight:600;font-style:italic">✏️ Toggle switches to grant or revoke permissions -- saved instantly</span>'
    : '';
  var actionBtns = isAdmin
    ? '<div style="display:flex;gap:8px">'
      +'<button onclick="dpResetToDefault()" class="dp-reset-btn">↩ Reset to Defaults</button>'
      +'<button onclick="dpGrantAllManager()" style="padding:7px 14px;border-radius:8px;background:#eff6ff;color:#1e40af;border:1px solid #93c5fd;font-size:12px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">⬆ Grant All → Manager</button>'
      +'</div>'
    : '';
  return ''
    +'<div class="card" style="margin-bottom:20px">'
    +'<div class="card-head" style="flex-wrap:wrap;gap:10px">'
    +'<span class="card-title">🛡️ Data Action Permissions</span>'
    +actionBtns
    +'</div>'
    +'<div style="padding:14px 20px 12px;background:var(--surface2);border-bottom:1px solid var(--border-soft)">'
    +'<div class="dp-banner"><div class="dp-banner-icon">ℹ️</div>'
    +'<div><div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:4px">Controls who can Add, Edit, and Delete records in each module</div>'
    +'<div style="font-size:12.5px;color:var(--muted);line-height:1.7">'
    +'This is separate from page access (which modules are visible). '
    +(isAdmin
      ? 'As <b>Administrator</b>, you control action-level permissions for each role. Toggle switches to grant or revoke instantly.'
      : 'Only <b>Administrators</b> can modify these settings.')
    +'<br><b style="color:#c0291d">Admin always has full access</b> -- admin permissions cannot be restricted.'
    +'</div></div></div>'
    +'</div>'
    +'<div class="dperm-wrap">'
    +'<div style="overflow-x:auto;-webkit-overflow-scrolling:touch"><table class="dperm-table">'
    +'<thead><tr>'
    +'<th style="position:sticky;left:0;z-index:3;background:var(--accent-dark);min-width:175px">Module</th>'
    +thCells
    +'</tr></thead>'
    +'<tbody>'+rows+'</tbody>'
    +'</table>'
    +'</div>'
    +'<div class="dp-legend">'
    +'<span class="dp-legend-item"><span class="dp-legend-dot" style="background:#16a34a22;border:1.5px solid #16a34a"></span> Add -- create new records</span>'
    +'<span class="dp-legend-item"><span class="dp-legend-dot" style="background:#1433a822;border:1.5px solid #1433a8"></span> Edit -- modify existing</span>'
    +'<span class="dp-legend-item"><span class="dp-legend-dot" style="background:#c0291d22;border:1.5px solid #c0291d"></span> Delete -- remove records</span>'
    +adminNote
    +'</div>'
    +'</div>';
}
function dpToggle(role, module, action, checked, el){
  if(!currentUser || currentUser.role !== 'admin'){
    alert('Only Administrator can change permissions.');
    el.checked = !checked; return;
  }
  if(role === 'admin'){
    alert('Administrator permissions cannot be restricted.');
    el.checked = true; return;
  }
  var dp = DATA_PERMS;
  if(!dp[role]) dp[role] = {};
  if(!dp[role][module]) dp[role][module] = {add:false,edit:false,del:false};
  dp[role][module][action] = checked;
  saveDataPerms(dp);
  
  var sw = el.parentElement;
  if(checked){
    sw.classList.remove('dp-switch-off');
    sw.classList.add('dp-switch-on');
    sw.style.setProperty('--dp-col', DP_ACTION_COLORS[action]||'#16a34a');
  } else {
    sw.classList.remove('dp-switch-on');
    sw.classList.add('dp-switch-off');
    sw.style.removeProperty('--dp-col');
  }
  var aLabel = action==='add'?'Add':action==='edit'?'Edit':'Delete';
  // Permission saved silently -- no per-toggle toast
}
function dpResetToDefault(){
  if(!confirm('Reset ALL data action permissions to factory defaults?\nThis cannot be undone.')) return;
  DATA_PERMS = deepClonePerms(DATA_PERMS_DEFAULT);
  saveDataPerms(DATA_PERMS);
  showToast('Data permissions reset to defaults ✅','#16a34a');
  render();
}
function dpGrantAllManager(){
  if(!confirm('Grant ALL data action permissions to Manager role?\n(Manager will be able to add, edit, and delete in all modules)')) return;
  DATA_PERMS.manager = {};
  DP_MODULES.forEach(function(m){
    DATA_PERMS.manager[m.id] = {add:true, edit:true, del:true};
  });
  saveDataPerms(DATA_PERMS);
  showToast('Manager granted full data access ✅','#7c3aed');
  render();
}
(function(){
  var _origRS = (typeof renderSettings === 'function') ? renderSettings : function(){ return ''; };
  renderSettings = function(){
    /* BLANK-PAGE FIX: don't null the entire _PAGE_MAP — just clear it so _getPageMap
       rebuilds fresh. Previously this wiped renderSync before it could be recaptured
       if the _patchSyncPage wrapper had run. Now we clear safely. */
    _PAGE_MAP = null;
    var base = _origRS();
    
    
    var dpSection = ''
      +'<div style="margin-bottom:24px">'
      +'<div style="font-family:\'JetBrains Mono\',monospace;font-size:10px;color:var(--muted);letter-spacing:.16em;text-transform:uppercase;margin-bottom:8px;margin-top:6px">⚙ Data Control</div>'
      + renderDataPermPanel()
      +'</div>';
    
    var myPermsCard = renderMyPermsSummary();
    return base + myPermsCard + dpSection;
  };
})();
function renderMyPermsSummary(){
  if(!currentUser) return '';
  var role = currentUser.role;
  var dp = DATA_PERMS;
  var rows = DP_MODULES.map(function(mod){
    var mp = (dp[role] && dp[role][mod.id]) || {add:false,edit:false,del:false};
    var allFalse = !mp.add && !mp.edit && !mp.del;
    
    if(role === 'admin') mp = {add:true,edit:true,del:true};
    var mkBit = function(label, val, col){
      return '<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:5px;font-size:10px;font-weight:700;font-family:\'JetBrains Mono\',monospace;background:'+(val?col+'18':'var(--surface3)')+';color:'+(val?col:'var(--muted2)')+';border:1px solid '+(val?col+'55':'var(--border)')+'">'+label+'</span>';
    };
    return '<tr>'
      +'<td><span style="margin-right:6px">'+mod.icon+'</span><span style="font-weight:600">'+esc(mod.label)+'</span></td>'
      +'<td><div style="display:flex;gap:5px;flex-wrap:wrap">'
      +mkBit('Add',  mp.add||false,  '#16a34a')
      +mkBit('Edit', mp.edit||false, '#1433a8')
      +mkBit('Del',  mp.del||false,  '#c0291d')
      +'</div></td>'
      +'<td style="font-size:11px;color:var(--muted)">'
      +(role==='admin'?'<span style="color:#1433a8;font-weight:700">Full access (Admin)</span>'
        :(mp.add&&mp.edit&&mp.del)?'<span style="color:#16a34a;font-weight:700">Full access</span>'
        :(mp.add||mp.edit||mp.del)?'<span style="color:#d4a853;font-weight:700">Partial access</span>'
        :'<span style="color:#c0291d;font-weight:700">Read only</span>')
      +'</td>'
    +'</tr>';
  }).join('');
  return ''
    +'<div class="card" style="margin-bottom:20px">'
    +'<div class="card-head"><span class="card-title">🎫 My Data Permissions</span>'
    +'<span style="font-size:11.5px;color:var(--muted);font-family:\'JetBrains Mono\',monospace">'
    +(ROLE_LABELS[role]||role)+' role</span></div>'
    +'<div style="overflow-x:auto"><table>'
    +'<thead><tr><th>Module</th><th>Permissions</th><th>Access Level</th></tr></thead>'
    +'<tbody>'+rows+'</tbody>'
    +'</table></div></div>';
}
(function(){
  var _origInit = typeof initApp === 'function' ? initApp : null;
  if(_origInit){
    initApp = function(){
      DATA_PERMS = loadDataPerms();
      _origInit();
    };
  }
})();
if(typeof showToast === 'undefined'){
  window.showToast = function(msg, color){
    var t = document.createElement('div');
    t.textContent = msg;
    t.className = 'gnsi-inline-toast';
    t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);'
      +'background:'+(color||'#1433a8')+';color:#fff;padding:10px 20px;border-radius:10px;'
      +'font-size:13px;font-weight:600;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,.2);'
      +'font-family:\'DM Sans\',sans-serif;max-width:90vw;text-align:center';
    document.body.appendChild(t);
    setTimeout(function(){t.remove();}, 3500);
  };
}
</script>
<!-- ═══════════════════════════════════════════════════════
     ADVANCED UI v14 -- Dark Mode · Command Palette · Ripple
     ═══════════════════════════════════════════════════════ -->
<!-- Page Loader -->
<div id="page-loader">
  <div class="loader-logo"><svg width="72" height="72" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle"><defs><radialGradient id="gnsiLGbg" cx="50%" cy="40%" r="60%"><stop offset="0%" stop-color="#1b44cc"/><stop offset="100%" stop-color="#0b1e6e"/></radialGradient></defs><rect width="192" height="192" rx="36" fill="#0b1e6e"/><rect width="192" height="192" rx="36" fill="url(#gnsiLGbg)" opacity="0.6"/><circle cx="96" cy="96" r="80" fill="none" stroke="#c8973a" stroke-width="3" opacity="0.9"/><circle cx="96" cy="96" r="70" fill="none" stroke="#c8973a" stroke-width="1" opacity="0.4"/><path d="M96 96 Q60 72 28 80 Q44 88 56 82 Q48 96 60 96 Q52 108 64 104 Q68 114 80 108 Z" fill="#c8973a" opacity="0.85"/><path d="M96 96 Q132 72 164 80 Q148 88 136 82 Q144 96 132 96 Q140 108 128 104 Q124 114 112 108 Z" fill="#c8973a" opacity="0.85"/><line x1="96" y1="60" x2="96" y2="136" stroke="white" stroke-width="5" stroke-linecap="round"/><circle cx="96" cy="64" r="8" fill="none" stroke="white" stroke-width="4.5"/><line x1="72" y1="78" x2="120" y2="78" stroke="white" stroke-width="4.5" stroke-linecap="round"/><path d="M96 136 Q80 128 76 140 Q82 148 96 144 Q110 148 116 140 Q112 128 96 136Z" fill="white"/><line x1="70" y1="58" x2="106" y2="94" stroke="#ffd060" stroke-width="2.5" stroke-linecap="round"/><line x1="62" y1="62" x2="74" y2="62" stroke="#ffd060" stroke-width="2" stroke-linecap="round"/><line x1="122" y1="58" x2="86" y2="94" stroke="#ffd060" stroke-width="2.5" stroke-linecap="round"/><line x1="130" y1="62" x2="118" y2="62" stroke="#ffd060" stroke-width="2" stroke-linecap="round"/><text x="96" y="158" text-anchor="middle" font-family="Georgia,serif" font-size="16" font-weight="bold" fill="#ffd060" letter-spacing="3">GNSI</text></svg></div>
  <div class="loader-bar"><div class="loader-bar-fill"></div></div>
  <div class="loader-text">Loading GNSI Portal…</div>
</div>
<!-- Dark Mode Toggle -->
<button id="dark-toggle" title="Toggle Dark Mode" onclick="gnsiToggleDark()">🌙</button>
<!-- Command Palette -->
<div id="cmd-palette-overlay" onclick="if(event.target===this)gnsiCloseCmd()">
  <div id="cmd-palette">
    <input id="cmd-input" placeholder="🔍  Search pages, actions…" oninput="gnsiCmdFilter(this.value)" onkeydown="gnsiCmdKey(event)" autocomplete="off" spellcheck="false"/>
    <div id="cmd-results"></div>
    <div id="cmd-footer">
      <span class="cmd-hint"><span class="cmd-key">↑↓</span> Navigate</span>
      <span class="cmd-hint"><span class="cmd-key">↵</span> Open</span>
      <span class="cmd-hint"><span class="cmd-key">Esc</span> Close</span>
      <span class="cmd-hint" style="margin-left:auto;color:var(--muted2)">⌘K or Ctrl+K to open</span>
    </div>
  </div>
</div>
<script>
(function(){
  var loader = document.getElementById('page-loader');
  if(!loader) return;
  function hideLoader(){
    loader.classList.add('hidden');
    setTimeout(function(){ loader.style.display='none'; }, 450);
  }
  if(document.readyState === 'complete'){ setTimeout(hideLoader, 600); }
  else { window.addEventListener('load', function(){ setTimeout(hideLoader, 600); }); }
  
  setTimeout(hideLoader, 3000);
})();
var gnsiDarkMode = localStorage.getItem('gnsi_dark_mode') === '1';
function gnsiApplyDark(){
  document.body.classList.toggle('dark-mode', gnsiDarkMode);
  var btn = document.getElementById('dark-toggle');
  if(btn) btn.textContent = gnsiDarkMode ? '☀️' : '🌙';
}
function gnsiToggleDark(){
  gnsiDarkMode = !gnsiDarkMode;
  localStorage.setItem('gnsi_dark_mode', gnsiDarkMode ? '1' : '0');
  gnsiApplyDark();
  gnsiShowToast(gnsiDarkMode ? '🌙 Dark mode on' : '☀️ Light mode on', gnsiDarkMode ? '#1c2660' : '#c9870a');
}
gnsiApplyDark();
var _origShowToast = window.showToast;
window.showToast = function(msg, color){
  gnsiShowToast(msg, color);
};
function gnsiShowToast(msg, color, duration){
  color = color || '#1433a8';
  duration = duration || 2800;
  var t = document.createElement('div');
  t.className = 'gnsi-toast';
  t.style.background = color;
  t.title = 'Tap to dismiss';
  var icon = color.indexOf('a34a') >= 0 ? '✅' : color.indexOf('c029') >= 0 ? '❌' : (color.indexOf('870a') >= 0 || color.indexOf('d97706') >= 0) ? '⚠️' : (color.indexOf('dc26') >= 0 || color.indexOf('ef44') >= 0 || color.indexOf('b91c') >= 0) ? '🚨' : 'ℹ️';
  t.innerHTML = '<div style="display:flex;align-items:center;gap:10px"><span style="font-size:16px">'+icon+'</span><span style="flex:1;overflow:hidden;text-overflow:ellipsis">'+msg+'</span><span style="font-size:18px;opacity:.6;flex-shrink:0;margin-left:4px">×</span></div>'
    +'<div class="gnsi-toast-bar" style="animation-duration:'+duration+'ms"></div>';
  t.onclick = function(){ t.style.animation='toast-out 0.3s ease forwards'; setTimeout(function(){ if(t.parentNode)t.remove(); },280); };
  document.body.appendChild(t);
  setTimeout(function(){
    t.style.animation = 'toast-out 0.3s ease forwards';
    setTimeout(function(){ t.remove(); }, 280);
  }, duration);
}
document.addEventListener('click', function(e){
  if(!e.target || typeof e.target.closest !== 'function') return;
  var btn = e.target.closest('.btn, .nav-btn, .att-mark, .btn-primary, .btn-outline, .btn-sm, .btn-sm-green');
  if(!btn) return;
  var rect = btn.getBoundingClientRect();
  var x = e.clientX - rect.left, y = e.clientY - rect.top;
  var size = Math.max(rect.width, rect.height) * 2;
  var ripple = document.createElement('span');
  ripple.className = 'ripple-wave';
  ripple.style.cssText = 'width:'+size+'px;height:'+size+'px;left:'+(x-size/2)+'px;top:'+(y-size/2)+'px';
  btn.appendChild(ripple);
  ripple.addEventListener('animationend', function(){ ripple.remove(); });
}, true);
function gnsiAnimateCounters(){
  document.querySelectorAll('.stat-val').forEach(function(el){
    var text = el.textContent.trim();
    var num = parseFloat(text.replace(/[^0-9.]/g,''));
    if(isNaN(num) || num <= 0 || text.length > 8) return;
    var suffix = text.replace(/[0-9.]/g,'');
    var start = 0, duration = 700, startTime = null;
    var isFloat = text.indexOf('.') >= 0;
    function step(ts){
      if(!startTime) startTime = ts;
      var progress = Math.min((ts - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var val = start + (num - start) * eased;
      el.textContent = (isFloat ? val.toFixed(1) : Math.floor(val)) + suffix;
      if(progress < 1) requestAnimationFrame(step);
      else el.textContent = text;
    }
    requestAnimationFrame(step);
  });
}
(function(){
  if(typeof render === 'function'){
    var _orig = render;
    render = function(){
      var r = _orig.apply(this, arguments);
      setTimeout(gnsiAnimateCounters, 80);
      return r;
    };
  }
})();
var CMD_PAGES = [
  {icon:'🏠',label:'Dashboard',               shortcut:'D', action:function(){navigate('dashboard');}},
  {icon:'🛡',label:'Admin Centre',            shortcut:'',  action:function(){navigate('admincentre');}},
  {icon:'👩‍🏫',label:'Faculty',               shortcut:'',  action:function(){navigate();}},
  {icon:'👥',label:'Staff',                   shortcut:'',  action:function(){navigate('staff');}},
  {icon:'🪪',label:'Staff Biodata',           shortcut:'',  action:function(){navigate('staffbiodata');}},
  {icon:'📊',label:'Staff Leaderboard',       shortcut:'',  action:function(){navigate('leaderboard');}},
  {icon:'🎓',label:'Students',                shortcut:'',  action:function(){navigate('students');}},
  {icon:'📝',label:'Admissions',              shortcut:'',  action:function(){navigate('unifiedhub');}},
  {icon:'📅',label:'Sessions',                shortcut:'',  action:function(){navigate('sessions');}},
  {icon:'🏫',label:'Classes',                 shortcut:'',  action:function(){navigate('classes');}},
  {icon:'✅',label:'Attendance',              shortcut:'',  action:function(){navigate('attendance');}},
  {icon:'🕐',label:'Timetable',               shortcut:'',  action:function(){navigate('timetable');}},
  {icon:'📋',label:'Exam Hub',                shortcut:'E', action:function(){navigate('exam');}},
  {icon:'🗂️',label:'Exam Manager',            shortcut:'',  action:function(){navigate('exammanager');}},
  {icon:'📊',label:'Results Hub',             shortcut:'',  action:function(){navigate('examresultshub');}},
  {icon:'📆',label:'Doubt Session TT',        shortcut:'',  action:function(){navigate('doubttt');}},
  {icon:'📓',label:'Teacher Diary',           shortcut:'',  action:function(){navigate('diary');}},
  {icon:'📋',label:'Report Cards',            shortcut:'',  action:function(){navigate('reportcard');}},
  {icon:'🏅',label:'Certificates',            shortcut:'',  action:function(){navigate('certificate');}},
  {icon:'🏆',label:'Topper Banner',           shortcut:'',  action:function(){navigate();}},
  {icon:'📖',label:'Course Management',       shortcut:'',  action:function(){navigate('coursemanage');}},
  {icon:'📄',label:'Report Collection',       shortcut:'',  action:function(){navigate();}},
  {icon:'📖',label:'Teaching Profile',        shortcut:'',  action:function(){navigate('teaching');}},
  {icon:'📢',label:'Notice Board',            shortcut:'',  action:function(){navigate('notices');}},
  {icon:'💰',label:'Accounts',                shortcut:'',  action:function(){navigate('accounts');}},
  {icon:'💳',label:'Fee Records',             shortcut:'',  action:function(){navigate('unifiedhub');}},
  {icon:'💵',label:'Period & Salary',         shortcut:'',  action:function(){navigate('periodsalary');}},
  {icon:'👩‍💼',label:'Staff Salary',           shortcut:'',  action:function(){navigate('staffsalary');}},
  {icon:'🏦',label:'Online Payments',         shortcut:'',  action:function(){navigate('unifiedhub');}},
  {icon:'📑',label:'Student Fee Assignment',  shortcut:'',  action:function(){navigate('unifiedhub');}},
  {icon:'🌴',label:'Leave Management',        shortcut:'',  action:function(){navigate('leave');}},
  {icon:'🔄',label:'Substitute Roster',       shortcut:'',  action:function(){navigate('substitute');}},
  {icon:'⭐',label:'Staff Appraisal',         shortcut:'',  action:function(){navigate('appraisal');}},
  {icon:'📋',label:'Grievance Register',      shortcut:'',  action:function(){navigate('grievance');}},
  {icon:'⏱',label:'Duty Hours',              shortcut:'',  action:function(){navigate('dutyhours');}},
  {icon:'📊',label:'NTS Monitor',             shortcut:'',  action:function(){navigate();}},
  {icon:'🏢',label:'Hostel Management',       shortcut:'',  action:function(){navigate('hostel');}},
  {icon:'🌙',label:'Night Duty Roster',       shortcut:'',  action:function(){navigate('nightduty');}},
  {icon:'🛏',label:'Boarder Schedule',        shortcut:'',  action:function(){navigate('boarder');}},
  {icon:'⚠️',label:'Disciplinary Register',   shortcut:'',  action:function(){navigate('discipline');}},
  {icon:'🏡',label:'House Master',            shortcut:'',  action:function(){navigate('housemaster');}},
  {icon:'🏠',label:'House',                   shortcut:'',  action:function(){navigate('house');}},
  {icon:'🥇',label:'Inter-House Competition', shortcut:'',  action:function(){navigate();}},
  {icon:'🍽️',label:'Kitchen & Stock',         shortcut:'',  action:function(){navigate('kitchen');}},
  {icon:'🏥',label:'Health Monitor',          shortcut:'',  action:function(){navigate();}},
  {icon:'💊',label:'Sick Bay Register',       shortcut:'',  action:function(){navigate('sickbay');}},
  {icon:'🎓',label:'Scholarships',            shortcut:'',  action:function(){navigate('scholarship');}},
  {icon:'📞',label:'Reception',               shortcut:'',  action:function(){navigate('reception');}},
  {icon:'📅',label:'Event Calendar',          shortcut:'',  action:function(){navigate('calendar');}},
  {icon:'🤝',label:'Parent-Teacher Meet',     shortcut:'',  action:function(){navigate('ptm');}},
  {icon:'💬',label:'SMS & Notify',            shortcut:'',  action:function(){navigate();}},
  {icon:'📊',label:'Parent Feedback',         shortcut:'',  action:function(){navigate('parentfeedback');}},
  {icon:'🎓',label:'Alumni',                  shortcut:'',  action:function(){navigate();}},
  {icon:'👪',label:'Parent Portal',           shortcut:'',  action:function(){navigate('parent');}},
  {icon:'📚',label:'Library',                 shortcut:'',  action:function(){navigate('library');}},
  {icon:'🏷️',label:'Assets & Inventory',      shortcut:'',  action:function(){navigate('assets');}},
  {icon:'🚌',label:'Transport',               shortcut:'',  action:function(){navigate();}},
  {icon:'📊',label:'Reports & Export',        shortcut:'',  action:function(){navigate('reports');}},
  {icon:'☁️',label:'Sync & Backup',           shortcut:'',  action:function(){navigate('sync');}},
  {icon:'🔐',label:'2FA Settings',            shortcut:'',  action:function(){navigate();}},
  {icon:'💾',label:'Auto Backup',             shortcut:'',  action:function(){navigate('backup');}},
  {icon:'⚙️',label:'Settings',               shortcut:'',  action:function(){navigate('settings');}},
  {icon:'🚀',label:'Coming Soon',             shortcut:'',  action:function(){navigate();}},
  {icon:'🤖',label:'AI Academic Assistant',   shortcut:'',  action:function(){navigate('aiassistant');}},
  {icon:'📊',label:'Advanced Analytics',      shortcut:'',  action:function(){navigate('analytics');}},
  {icon:'📚',label:'E-Library & Study Hub',   shortcut:'',  action:function(){navigate();}},
  {icon:'🌙',label:'Toggle Dark Mode',        shortcut:'',  action:function(){gnsiToggleDark();}},
];
var cmdActive = 0;
function gnsiOpenCmd(){
  var overlay = document.getElementById('cmd-palette-overlay');
  var input = document.getElementById('cmd-input');
  if(!overlay) return;
  overlay.classList.add('open');
  if(input){ input.value=''; input.focus(); }
  cmdActive = 0;
  gnsiCmdFilter('');
}
function gnsiCloseCmd(){
  var overlay = document.getElementById('cmd-palette-overlay');
  if(overlay) overlay.classList.remove('open');
}
function gnsiCmdFilter(q){
  var results = document.getElementById('cmd-results');
  if(!results) return;
  q = (q||'').toLowerCase().trim();
  var items = q ? CMD_PAGES.filter(function(p){ return p.label.toLowerCase().indexOf(q) >= 0; }) : CMD_PAGES;
  cmdActive = 0;
  results.innerHTML = items.map(function(p, i){
    return '<div class="cmd-item'+(i===0?' active':'')+'" data-idx="'+i+'" onmouseenter="cmdActive='+i+';gnsiCmdHighlight()" onclick="gnsiCmdRun('+CMD_PAGES.indexOf(p)+')">'
      +'<span class="cmd-icon">'+p.icon+'</span>'
      +'<span class="cmd-label">'+p.label+'</span>'
      +(p.shortcut?'<span class="cmd-shortcut">Alt+'+p.shortcut+'</span>':'')
      +'</div>';
  }).join('') || '<div style="padding:20px;text-align:center;color:var(--muted);font-size:13px">No results for "'+q+'"</div>';
}
function gnsiCmdHighlight(){
  document.querySelectorAll('#cmd-results .cmd-item').forEach(function(el, i){
    el.classList.toggle('active', i === cmdActive);
  });
}
function gnsiCmdKey(e){
  var items = document.querySelectorAll('#cmd-results .cmd-item');
  if(e.key === 'ArrowDown'){ e.preventDefault(); cmdActive = Math.min(cmdActive+1, items.length-1); gnsiCmdHighlight(); items[cmdActive] && items[cmdActive].scrollIntoView({block:'nearest'}); }
  else if(e.key === 'ArrowUp'){ e.preventDefault(); cmdActive = Math.max(cmdActive-1, 0); gnsiCmdHighlight(); items[cmdActive] && items[cmdActive].scrollIntoView({block:'nearest'}); }
  else if(e.key === 'Enter'){ var active = items[cmdActive]; if(active) active.click(); }
  else if(e.key === 'Escape'){ gnsiCloseCmd(); }
}
function gnsiCmdRun(idx){
  var p = CMD_PAGES[idx];
  if(p){ gnsiCloseCmd(); setTimeout(function(){ p.action(); }, 120); }
}
document.addEventListener('keydown', function(e){
  
  if((e.ctrlKey || e.metaKey) && e.key === 'k'){ e.preventDefault(); gnsiOpenCmd(); return; }
  
  if(e.key === 'Escape'){ gnsiCloseCmd(); }
  
  if(e.altKey && !e.ctrlKey){
    if(e.key==='d'||e.key==='D'){ e.preventDefault(); if(typeof navigate==='function')navigate('dashboard'); }
    if(e.key==='e'||e.key==='E'){ e.preventDefault(); if(typeof navigate==='function')navigate('exam'); }
    if(e.key==='s'||e.key==='S'){ e.preventDefault(); if(typeof navigate==='function')navigate('students'); }
  }
});
/* topbar Quick Search btn removed — kept Ctrl+K shortcut */
function gnsiSkeletonTable(rows, cols){
  var thead = '<thead><tr>'+Array(cols).fill('<th> </th>').join('')+'</tr></thead>';
  var tbody = '<tbody>'+Array(rows).fill(0).map(function(){
    return '<tr>'+Array(cols).fill(0).map(function(){
      return '<td><span class="skeleton skeleton-line '+(Math.random()>.5?'med':'')+'"></span></td>';
    }).join('')+'</tr>';
  }).join('')+'</tbody>';
  return '<div style="overflow-x:auto"><table>'+thead+tbody+'</table></div>';
}
(function(){
  document.addEventListener('mouseover', function(e){
    if(!e.target || typeof e.target.closest !== 'function') return;
    var btn = e.target.closest('.nav-btn');
    if(!btn) return;
    var icon = btn.querySelector('.nav-icon');
    if(icon) icon.style.transform = 'scale(1.2) rotate(-5deg)';
  });
  document.addEventListener('mouseout', function(e){
    if(!e.target || typeof e.target.closest !== 'function') return;
    var btn = e.target.closest('.nav-btn');
    if(!btn) return;
    var icon = btn.querySelector('.nav-icon');
    if(icon) icon.style.transform = '';
  });
})();
(function(){
  document.addEventListener('mouseenter', function(e){
    if(!e.target || typeof e.target.closest !== 'function') return;
    var card = e.target.closest('.stat-card');
    if(!card) return;
    var val = card.querySelector('.stat-val');
    if(val){ val.style.transform = 'scale(1.04)'; val.style.transition = 'transform 0.2s ease'; }
  }, true);
  document.addEventListener('mouseleave', function(e){
    if(!e.target || typeof e.target.closest !== 'function') return;
    var card = e.target.closest('.stat-card');
    if(!card) return;
    var val = card.querySelector('.stat-val');
    if(val){ val.style.transform = ''; }
  }, true);
})();
setTimeout(gnsiAnimateCounters, 800);
(function(){
  // Keyboard shortcut hint -- shown silently in sidebar footer instead
  localStorage.setItem('gnsi_cmd_hint_shown', '1');
})();
(function(){
  /* PERF FIX v68: scroll-to-top only on page navigation, NOT on every render.
     Firing scrollTo({behavior:'smooth'}) on every render causes jank because
     the browser must calculate scroll positions and interrupt compositing on
     every re-render triggered by realtime events, KV sync, etc.
     Solution: track activePage changes and only scroll when the page actually changes. */
  if(typeof render === 'function' && typeof navigate === 'function'){
    var _origNavigate = navigate;
    var _scrollPending = false;
    navigate = function(page){
      _scrollPending = true;
      return _origNavigate.apply(this, arguments);
    };
    var _origR2 = render;
    render = function(){
      var r = _origR2.apply(this, arguments);
      if(_scrollPending){
        _scrollPending = false;
        var content = document.getElementById('content');
        // instant scroll -- smooth scroll on nav causes visible lag on mobile
        if(content) content.scrollTop = 0;
      }
      return r;
    };
  }
})();
</script>
<!-- ═══════════════════════════════════════════════════════════
     GNSI ADVANCED UI v15 -- Social-Grade Design System
     Facebook/Instagram level smoothness & polish
     ═══════════════════════════════════════════════════════════ -->
<script>
var acTab='overview';
function acLog(action,detail){
  try{
    var log=JSON.parse(localStorage.getItem('gnsi_audit_log')||'[]');
    var entry={ts:new Date().toISOString(),user:(currentUser&&currentUser.name)||'Admin',action:action,detail:detail||''};
    log.unshift(entry);
    if(log.length>200)log=log.slice(0,200);
    localStorage.setItem('gnsi_audit_log',JSON.stringify(log));
    if(typeof gnsiKVPush==='function')gnsiKVPush('gnsi_audit_log',log);
    /* Also push to live activity feed */
    gnsiActivity(action,detail,'admin');
  }catch(e){}
}
/* ── gnsiActivity: lightweight live activity tracker ──────────────────
   Records any user action to gnsi_activity_feed and syncs to cloud.
   Admin sees this in real time on the dashboard and Admin Centre.
   ──────────────────────────────────────────────────────────────────── */
function gnsiActivity(action, detail, category) {
  try {
    var feed = JSON.parse(localStorage.getItem('gnsi_activity_feed')||'[]');
    var user = (typeof currentUser!=='undefined'&&currentUser) ? currentUser.name : 'System';
    var role = (typeof currentUser!=='undefined'&&currentUser) ? (currentUser.role||'staff') : 'system';
    feed.unshift({
      ts:       new Date().toISOString(),
      user:     user,
      role:     role,
      action:   action,
      detail:   detail || '',
      category: category || 'general',
      device:   navigator.userAgent.indexOf('Mobile')>=0 ? 'mobile' : 'desktop'
    });
    if (feed.length > 500) feed = feed.slice(0, 500);
    localStorage.setItem('gnsi_activity_feed', JSON.stringify(feed));
    if (typeof gnsiKVPush === 'function') gnsiKVPush('gnsi_activity_feed', feed);
  } catch(e) {}
}
function gnsiClearActivityFeed() {
  try { localStorage.removeItem('gnsi_activity_feed'); } catch(e) {}
  if (typeof gnsiKVPush === 'function') gnsiKVPush('gnsi_activity_feed', []);
  gnsiMarkLocalSave(20000); // 20s guard -- prevents KV poll from restoring cleared feed
  if (typeof showToast === 'function') showToast('Activity feed cleared', '#16a34a');
  if (typeof render === 'function') render();
}
function gnsiAuditClearPrompt(){
  if(!confirm('Archive and clear all audit log entries? They will be exported to a text download first.'))return;
  var log=[];
  try{log=JSON.parse(localStorage.getItem('gnsi_audit_log')||'[]');}catch(e){}
  if(log.length){
    var txt=log.map(function(e){
      return new Date(e.ts).toLocaleString('en-IN')+' | '+e.user+' | '+e.action+' | '+(e.detail||'');
    }).join('\n');
    var a=document.createElement('a');
    a.href='data:text/plain;charset=utf-8,'+encodeURIComponent(txt);
    a.download='gnsi_audit_log_'+new Date().toISOString().split('T')[0]+'.txt';
    a.click();
  }
  localStorage.setItem('gnsi_audit_log','[]');
  if(typeof gnsiKVPush==='function')gnsiKVPush('gnsi_audit_log',[]);
  gnsiMarkLocalSave(20000); // 20s guard -- prevents KV poll from restoring cleared audit log
  if(typeof showToast==='function')showToast('Audit log cleared','#16a34a');
  if(typeof render==='function')render();
}
function renderAIAssistant(){
  return _renderAIContent();
}
/* ══════════════════════════════════════════════════════════════════
   ADVANCED ANALYTICS  -- SVG charts from live portal data
   ══════════════════════════════════════════════════════════════════ */
function renderAnalytics(){
  /* -- gather data from existing portal globals -- */
  var staffList  = (typeof gnsiStaff  !== 'undefined' && gnsiStaff)  ? gnsiStaff  : (typeof STAFF_DATA  !== 'undefined' ? STAFF_DATA  : []);
  var studList   = (typeof gnsiStudents!== 'undefined'&& gnsiStudents)? gnsiStudents:(typeof STUDENT_DATA!== 'undefined' ? STUDENT_DATA: []);
  // Try supabase-loaded arrays first, fall back to localStorage
  if(!staffList.length){ try{ staffList = JSON.parse(localStorage.getItem('gnsi_staff')||'[]'); }catch(e){} }
  if(!studList.length) { try{ studList  = JSON.parse(localStorage.getItem('gnsi_students')||'[]'); }catch(e){} }
  /* -- dept breakdown (staff) -- */
  var deptMap = {};
  staffList.forEach(function(s){ var d=s.dept||s.department||'Other'; deptMap[d]=(deptMap[d]||0)+1; });
  var deptKeys = Object.keys(deptMap);
  var deptColors = ['#1433a8','#6366f1','#a855f7','#ec4899','#f59e0b','#10b981','#06b6d4','#ef4444'];
  /* -- class breakdown (students) -- */
  var clsMap = {};
  studList.forEach(function(s){ var c=s.cls||s.class_name||s.course||'Unknown'; clsMap[c]=(clsMap[c]||0)+1; });
  var clsKeys = Object.keys(clsMap);
  /* -- fee status -- */
  var feePaid=0, feePending=0;
  studList.forEach(function(s){ if((s.fees||s.fee_status||'').toLowerCase()==='paid') feePaid++; else feePending++; });
  /* -- hostel vs day scholar -- */
  var hostelY=0, hostelN=0;
  studList.forEach(function(s){ if((s.hostel||'').toLowerCase()==='yes') hostelY++; else hostelN++; });
  /* -- KPI cards -- */
  function kpi(label, val, sub, color){
    return '<div style="background:var(--surface);border:1.5px solid var(--border);border-radius:12px;padding:18px 20px">'
      + '<div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px">'+label+'</div>'
      + '<div style="font-family:\'Playfair Display\',serif;font-size:28px;font-weight:800;color:'+color+'">'+val+'</div>'
      + '<div style="font-size:12px;color:var(--muted);margin-top:4px">'+sub+'</div>'
      + '</div>';
  }
  /* -- SVG bar chart -- */
  function barChart(title, dataMap, colors){
    var keys = Object.keys(dataMap);
    if(!keys.length) return '<div style="background:var(--surface);border:1.5px solid var(--border);border-radius:12px;padding:20px"><div style="font-weight:700;color:var(--text);margin-bottom:12px">'+title+'</div><div style="color:var(--muted);font-size:13px">No data available yet.</div></div>';
    var maxVal = Math.max.apply(null, keys.map(function(k){ return dataMap[k]; }));
    var bw = 36, gap = 14, h = 140, padL = 36, padB = 50;
    var W = keys.length*(bw+gap)+padL+20;
    var bars = keys.map(function(k,i){
      var v = dataMap[k];
      var bh = maxVal>0 ? Math.round(v/maxVal*(h-10)) : 0;
      var x  = padL + i*(bw+gap);
      var y  = h - bh;
      var col= colors[i % colors.length];
      var label = k.length>10 ? k.substring(0,9)+'…' : k;
      return '<rect x="'+x+'" y="'+y+'" width="'+bw+'" height="'+bh+'" rx="5" fill="'+col+'" opacity=".85"/>'
        + '<text x="'+(x+bw/2)+'" y="'+(y-5)+'" text-anchor="middle" font-size="11" font-weight="700" fill="'+col+'">'+v+'</text>'
        + '<text x="'+(x+bw/2)+'" y="'+(h+16)+'" text-anchor="middle" font-size="10" fill="var(--muted)" style="max-width:'+bw+'px">'+label+'</text>';
    }).join('');
    /* y-axis ticks */
    var ticks = '';
    for(var t=0;t<=4;t++){
      var tv = Math.round(maxVal*t/4);
      var ty = h - (maxVal>0?Math.round(tv/maxVal*(h-10)):0);
      ticks += '<text x="'+(padL-6)+'" y="'+(ty+4)+'" text-anchor="end" font-size="10" fill="var(--muted)">'+tv+'</text>'
             + '<line x1="'+padL+'" x2="'+(W-10)+'" y1="'+ty+'" y2="'+ty+'" stroke="var(--border)" stroke-width="1" stroke-dasharray="4,3"/>';
    }
    return '<div style="background:var(--surface);border:1.5px solid var(--border);border-radius:12px;padding:20px;overflow-x:auto">'
      + '<div style="font-family:\'Playfair Display\',serif;font-size:14px;font-weight:700;color:var(--text);margin-bottom:14px">'+title+'</div>'
      + '<svg width="'+W+'" height="'+(h+padB)+'" style="overflow:visible">'+ticks+bars+'</svg>'
      + '</div>';
  }
  /* -- SVG donut chart -- */
  function donutChart(title, segments){
    /* segments: [{label, value, color}] */
    var total = segments.reduce(function(a,s){ return a+s.value; },0);
    if(!total) return '<div style="background:var(--surface);border:1.5px solid var(--border);border-radius:12px;padding:20px"><div style="font-weight:700;color:var(--text)">'+title+'</div><div style="color:var(--muted);font-size:13px;margin-top:8px">No data.</div></div>';
    var cx=80,cy=80,r=60,ri=38;
    var paths=''; var angle=-Math.PI/2;
    segments.forEach(function(seg){
      var sweep = (seg.value/total)*2*Math.PI;
      var x1=cx+r*Math.cos(angle), y1=cy+r*Math.sin(angle);
      var x2=cx+r*Math.cos(angle+sweep), y2=cy+r*Math.sin(angle+sweep);
      var xi1=cx+ri*Math.cos(angle), yi1=cy+ri*Math.sin(angle);
      var xi2=cx+ri*Math.cos(angle+sweep), yi2=cy+ri*Math.sin(angle+sweep);
      var lg = sweep>Math.PI ? 1:0;
      paths += '<path d="M '+x1+' '+y1+' A '+r+' '+r+' 0 '+lg+' 1 '+x2+' '+y2+' L '+xi2+' '+yi2+' A '+ri+' '+ri+' 0 '+lg+' 0 '+xi1+' '+yi1+' Z" fill="'+seg.color+'" opacity=".88"/>';
      angle += sweep;
    });
    var legend = segments.map(function(seg){
      return '<div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text)">'
        + '<div style="width:10px;height:10px;border-radius:3px;background:'+seg.color+'"></div>'
        + '<span>'+seg.label+'</span>'
        + '<span style="margin-left:auto;font-weight:700">'+seg.value+' ('+Math.round(seg.value/total*100)+'%)</span>'
        + '</div>';
    }).join('');
    return '<div style="background:var(--surface);border:1.5px solid var(--border);border-radius:12px;padding:20px">'
      + '<div style="font-family:\'Playfair Display\',serif;font-size:14px;font-weight:700;color:var(--text);margin-bottom:14px">'+title+'</div>'
      + '<div style="display:flex;gap:20px;align-items:center;flex-wrap:wrap">'
      + '<svg width="160" height="160"><'+paths+'<text x="'+cx+'" y="'+(cy+5)+'" text-anchor="middle" font-size="20" font-weight="800" fill="var(--text)">'+total+'</text>'
      + '<text x="'+cx+'" y="'+(cy+18)+'" text-anchor="middle" font-size="9" fill="var(--muted)">total</text></svg>'
      + '<div style="flex:1;display:flex;flex-direction:column;gap:8px">'+legend+'</div>'
      + '</div></div>';
  }
  var totalStaff = staffList.length;
  var totalStud  = studList.length;
  var activeStaff= staffList.filter(function(s){ return (s.status||'active').toLowerCase()==='active'; }).length;
  return '<div style="padding:8px 0 32px">'
    /* page header */
    + '<div style="margin-bottom:20px">'
    +   '<div style="font-family:\'Playfair Display\',serif;font-size:22px;font-weight:800;color:var(--text)">📊 Advanced Analytics</div>'
    +   '<div style="font-size:12.5px;color:var(--muted);margin-top:3px">Live insights drawn from portal data &nbsp;·&nbsp; Last updated: now</div>'
    + '</div>'
    /* KPI row */
    + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px;margin-bottom:22px">'
    + kpi('Total Staff',    totalStaff,  activeStaff+' active',     '#1433a8')
    + kpi('Total Students', totalStud,   hostelY+' boarders',        '#6366f1')
    + kpi('Fee Paid',       feePaid,     'out of '+totalStud,        '#16a34a')
    + kpi('Fee Pending',    feePending,  'need follow-up',           '#dc2626')
    + '</div>'
    /* charts row 1 */
    + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;margin-bottom:16px">'
    + barChart('Staff by Department', deptMap, deptColors)
    + barChart('Students by Course / Class', clsMap, ['#1433a8','#6366f1','#a855f7','#ec4899','#f59e0b','#10b981'])
    + '</div>'
    /* charts row 2 */
    + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px">'
    + donutChart('Fee Collection Status', [
        {label:'Paid',    value:feePaid,    color:'#16a34a'},
        {label:'Pending', value:feePending, color:'#dc2626'}
      ])
    + donutChart('Hostel vs Day Scholar', [
        {label:'Boarder',     value:hostelY, color:'#1433a8'},
        {label:'Day Scholar', value:hostelN, color:'#6366f1'}
      ])
    + donutChart('Staff Status', [
        {label:'Active',   value:activeStaff,              color:'#16a34a'},
        {label:'Inactive', value:totalStaff-activeStaff,   color:'#94a3b8'}
      ])
    + '</div>'
    + '</div>';
}
/* ══════════════════════════════════════════════════════════════════
   E-LIBRARY & STUDY HUB
   ══════════════════════════════════════════════════════════════════ */
var _elibSubj = 'All';
var _elibType = 'All';
var _elibSearch = '';
var _elibFormOpen = false;
var _EL_SUBJECTS = ['All','Mathematics','Science','English','Hindi','Social Studies','Computer Science','Sainik Prep','Navodaya Prep','General'];
var _EL_TYPES    = ['All','Notes','Question Paper','Video Link','Book','Reference','Other'];
function _elibLoad(){ return _csLoad('gnsi_elibrary', []); }
function _elibSaveAll(arr){ _csSave('gnsi_elibrary', arr); localStorage.setItem('gnsi_kv_ts_gnsi_elibrary',new Date().toISOString()); if(typeof gnsiKVPush==='function')gnsiKVPush('gnsi_elibrary',arr); }
function elibOpenForm(){ _elibFormOpen=true; navigate(); }
function elibCloseForm(){ _elibFormOpen=false; navigate(); }
function elibAddResource(){
  var title   = (document.getElementById('el-title')||{}).value||'';
  var subject = (document.getElementById('el-subject')||{}).value||'General';
  var type    = (document.getElementById('el-type')||{}).value||'Notes';
  var url     = (document.getElementById('el-url')||{}).value||'';
  var desc    = (document.getElementById('el-desc')||{}).value||'';
  var author  = (document.getElementById('el-author')||{}).value||'';
  if(!title.trim()){ alert('Please enter a title.'); return; }
  var resources = _elibLoad();
  resources.unshift({
    id: Date.now(),
    title: title.trim(),
    subject: subject,
    type: type,
    url: url.trim(),
    desc: desc.trim(),
    author: author.trim() || ((typeof currentUser!=='undefined'&&currentUser&&currentUser.name)?currentUser.name:'Staff'),
    addedOn: new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})
  });
  _elibSaveAll(resources);
  _elibFormOpen = false;
  navigate();
}
function elibDelete(id){
  if(!confirm('Delete this resource?')) return;
  var resources = _elibLoad().filter(function(r){ return r.id!==id; });
  _elibSaveAll(resources);
  navigate();
}
function renderELibrary(){
  navigate('dashboard');
  return '';
}
/* ══════════════════════════════════════════════════════════════════
   PTM -- Parent-Teacher Meeting Manager
   ══════════════════════════════════════════════════════════════════ */
var _ptmTab='scheduled', _ptmForm=false, _ptmEdit=null;
function _ptmGetStaff(){
  var s=gnsiLoad('gnsi_staff')||[];
  if(!s.length) s=(typeof STAFF_INIT!=='undefined'?STAFF_INIT:[]);
  return s.filter(function(x){return (x.status||'Active').toLowerCase()==='active';});
}
function _ptmGetStudents(){
  var s=gnsiLoad('gnsi_students')||[];
  return s;
}
function ptmOpenForm(id){
  _ptmEdit=id||null;
  _ptmForm=true;
  navigate('ptm');
}
function ptmCloseForm(){ _ptmForm=false; _ptmEdit=null; navigate('ptm'); }
function ptmSave(){
  if(!_isAdminOrArunkumar()){showToast('🔒 Only Admin can save meetings.','#dc2626');return;}
  var date=document.getElementById('ptm-date').value;
  var time=document.getElementById('ptm-time').value;
  var teacher=document.getElementById('ptm-teacher').value;
  var parent=document.getElementById('ptm-parent').value.trim();
  var student=document.getElementById('ptm-student').value.trim();
  var cls=document.getElementById('ptm-class').value.trim();
  var agenda=document.getElementById('ptm-agenda').value.trim();
  if(!date||!teacher||!student){ alert('Date, Teacher, and Student are required.'); return; }
  var meetings=gnsiLoad('gnsi_ptm_meetings')||[];
  if(_ptmEdit){
    meetings=meetings.map(function(m){ return m.id===_ptmEdit?{id:m.id,date:date,time:time,teacher:teacher,parent:parent,student:student,cls:cls,agenda:agenda,status:m.status,notes:m.notes||'',createdOn:m.createdOn}:m; });
  } else {
    meetings.unshift({id:'ptm'+Date.now(),date:date,time:time,teacher:teacher,parent:parent,student:student,cls:cls,agenda:agenda,status:'Scheduled',notes:'',createdOn:new Date().toISOString().slice(0,10)});
  }
  gnsiSave('gnsi_ptm_meetings', meetings);
  _ptmForm=false; _ptmEdit=null;
  navigate('ptm');
}
function ptmUpdateStatus(id, status){
  var meetings=gnsiLoad('gnsi_ptm_meetings')||[];
  meetings=meetings.map(function(m){ return m.id===id?Object.assign({},m,{status:status}):m; });
  gnsiSave('gnsi_ptm_meetings', meetings);
  navigate('ptm');
}
function ptmAddNotes(id){
  var el=document.getElementById('ptm-note-'+id);
  if(!el) return;
  var meetings=gnsiLoad('gnsi_ptm_meetings')||[];
  meetings=meetings.map(function(m){ return m.id===id?Object.assign({},m,{notes:el.value}):m; });
  gnsiSave('gnsi_ptm_meetings', meetings);
  navigate('ptm');
}
function ptmDelete(id){
  if(!confirm('Delete this PTM record?')) return;
  var meetings=(gnsiLoad('gnsi_ptm_meetings')||[]).filter(function(m){return m.id!==id;});
  gnsiSave('gnsi_ptm_meetings', meetings);
  navigate('ptm');
}
function renderAssets(){
  var isAdmin=(typeof currentUser!=='undefined'&&currentUser&&(currentUser.role==='admin'||currentUser.role==='manager'));
  var assets=gnsiLoad('gnsi_assets')||[];
  /* seed sample data */
  if(!assets.length){
    assets=[
      {id:'ast1',name:'Desktop Computers (Admin)',cat:'Electronics',loc:'Admin Office',qty:4,cond:'Good',serial:'',purchDate:'2023-01-15',val:'80000',notes:'',addedOn:'2023-01-15'},
      {id:'ast2',name:'Classroom Benches (Double)',cat:'Furniture',loc:'Classroom',qty:60,cond:'Good',serial:'',purchDate:'2022-06-01',val:'180000',notes:'',addedOn:'2022-06-01'},
      {id:'ast3',name:'Science Lab Equipment Set',cat:'Electronics',loc:'Laboratory',qty:2,cond:'Fair',serial:'',purchDate:'2021-09-10',val:'45000',notes:'Requires calibration',addedOn:'2021-09-10'},
      {id:'ast4',name:'School Bus',cat:'Vehicle',loc:'Sports Ground',qty:1,cond:'Good',serial:'MN01AB1234',purchDate:'2020-03-20',val:'1800000',notes:'Insurance renewed 2024',addedOn:'2020-03-20'},
      {id:'ast5',name:'Library Books (Collection)',cat:'Books & Stationery',loc:'Library',qty:850,cond:'Good',serial:'',purchDate:'2022-12-01',val:'120000',notes:'',addedOn:'2022-12-01'},
    ];
    gnsiSave('gnsi_assets', assets);
  }
  var condColor={Good:'#16a34a',Fair:'#d97706',Poor:'#dc2626','Under Repair':'#7c3aed',Disposed:'#64748b'};
  var filtered=assets.filter(function(a){
    var cMatch=_assetCat==='All'||a.cat===_assetCat;
    var lMatch=_assetLoc==='All'||a.loc===_assetLoc;
    var qMatch=!_assetSearch||(a.name+a.serial+a.notes).toLowerCase().indexOf(_assetSearch.toLowerCase())!==-1;
    return cMatch&&lMatch&&qMatch;
  });
  var totalItems=assets.reduce(function(s,a){return s+a.qty;},0);
  var totalVal=assets.reduce(function(s,a){var v=parseFloat(a.val)||0;return s+v;},0);
  var formHtml='';
  if(_assetForm){
    var ed=_assetEdit?assets.find(function(a){return a.id===_assetEdit;}):null;
    var selOpt=function(arr,val){return arr.map(function(o){return '<option'+(o===val?' selected':'')+'>'+o+'</option>';}).join('');};
    formHtml='<div style="background:var(--surface);border:1.5px solid #1433a8;border-radius:14px;padding:22px;margin-bottom:20px">'
      +'<div style="font-family:\'Playfair Display\',serif;font-size:15px;font-weight:700;color:var(--text);margin-bottom:16px">'+(ed?'✏️ Edit Asset':'➕ Add Asset')+'</div>'
      +'<div class="form-grid g2" style="margin-bottom:14px">'
      +'<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Asset Name *</label><input id="ast-name" type="text" value="'+(ed?esc(ed.name):'')+'" placeholder="e.g. Desktop Computer" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif;box-sizing:border-box"></div>'
      +'<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Category</label><select id="ast-cat" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif">'+selOpt(_ASSET_CATS.slice(1),ed?ed.cat:'Furniture')+'</select></div>'
      +'<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Location</label><select id="ast-loc" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif">'+selOpt(_ASSET_LOCS.slice(1),ed?ed.loc:'Classroom')+'</select></div>'
      +'<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Quantity</label><input id="ast-qty" type="number" min="1" value="'+(ed?ed.qty:1)+'" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif;box-sizing:border-box"></div>'
      +'<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Condition</label><select id="ast-cond" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif">'+selOpt(_ASSET_CONDITIONS,ed?ed.cond:'Good')+'</select></div>'
      +'<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Serial / Tag No.</label><input id="ast-serial" type="text" value="'+(ed?esc(ed.serial):'')+'" placeholder="Optional" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif;box-sizing:border-box"></div>'
      +'<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Purchase Date</label><input id="ast-pdate" type="date" value="'+(ed?ed.purchDate:'')+'" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif;box-sizing:border-box"></div>'
      +'<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Value / Cost (₹)</label><input id="ast-val" type="number" min="0" value="'+(ed?ed.val:'')+'" placeholder="e.g. 25000" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif;box-sizing:border-box"></div>'
      +'</div>'
      +'<div style="margin-bottom:16px"><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Notes</label><textarea id="ast-notes" rows="2" placeholder="Any remarks..." style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif;resize:vertical;box-sizing:border-box">'+(ed?esc(ed.notes):'')+'</textarea></div>'
      +'<div style="display:flex;gap:10px"><button onclick="assetSave()" style="padding:9px 20px;border-radius:9px;background:#1433a8;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">Save Asset</button>'
      +'<button onclick="assetCloseForm()" style="padding:9px 16px;border-radius:9px;border:1.5px solid var(--border);background:var(--surface);color:var(--muted);font-size:13px;cursor:pointer;font-family:\'DM Sans\',sans-serif">Cancel</button></div></div>';
  }
  var rows='';
  if(!filtered.length){
    rows='<div style="padding:40px;text-align:center;color:var(--muted);font-size:13px">No assets found.</div>';
  } else {
    rows='<table style="width:100%;border-collapse:collapse;font-size:13px">'
      +'<thead><tr style="background:var(--bg);border-bottom:2px solid var(--border)">'
      +'<th style="text-align:left;padding:10px 12px;font-size:11px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.04em">Asset</th>'
      +'<th style="text-align:left;padding:10px 12px;font-size:11px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.04em">Category</th>'
      +'<th style="text-align:left;padding:10px 12px;font-size:11px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.04em">Location</th>'
      +'<th style="text-align:center;padding:10px 12px;font-size:11px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.04em">Qty</th>'
      +'<th style="text-align:center;padding:10px 12px;font-size:11px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.04em">Condition</th>'
      +'<th style="text-align:right;padding:10px 12px;font-size:11px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.04em">Value</th>'
      +(isAdmin?'<th style="text-align:center;padding:10px 12px;font-size:11px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.04em">Actions</th>':'')
      +'</tr></thead><tbody>'
      +filtered.map(function(a,i){
        var cc=condColor[a.cond]||'#64748b';
        return '<tr style="border-bottom:1px solid var(--border);background:'+(i%2===0?'var(--surface)':'var(--bg)')+'">'
          +'<td style="padding:10px 12px"><div style="font-weight:700;color:var(--text)">'+esc(a.name)+'</div>'+(a.serial?'<div style="font-size:11px;color:var(--muted)">S/N: '+esc(a.serial)+'</div>':'')+'</td>'
          +'<td style="padding:10px 12px;color:var(--muted)">'+esc(a.cat)+'</td>'
          +'<td style="padding:10px 12px;color:var(--muted)">'+esc(a.loc)+'</td>'
          +'<td style="padding:10px 12px;text-align:center;font-weight:700;color:var(--text)">'+a.qty+'</td>'
          +'<td style="padding:10px 12px;text-align:center"><select onchange="assetUpdateCond(\''+parseInt(a.id,10)+'\',this.value)" style="padding:3px 8px;border-radius:6px;border:1.5px solid '+cc+';background:'+cc+'18;color:'+cc+';font-size:11px;font-weight:700;font-family:\'DM Sans\',sans-serif;cursor:pointer">'+_ASSET_CONDITIONS.map(function(c){return '<option'+(c===a.cond?' selected':'')+'>'+c+'</option>';}).join('')+'</select></td>'
          +'<td style="padding:10px 12px;text-align:right;color:var(--text);font-weight:600">'+(a.val?'₹'+Number(a.val).toLocaleString('en-IN'):'--')+'</td>'
          +(isAdmin?'<td style="padding:10px 12px;text-align:center;display:flex;gap:5px;justify-content:center"><button onclick="assetOpenForm(\''+parseInt(a.id,10)+'\')" style="padding:3px 9px;border-radius:6px;border:1.5px solid var(--border);background:var(--surface);font-size:11px;cursor:pointer">✏️</button><button onclick="assetDelete(\''+parseInt(a.id,10)+'\')" style="padding:3px 9px;border-radius:6px;border:1.5px solid #fee2e2;background:#fff1f2;color:#ef4444;font-size:11px;cursor:pointer">🗑</button></td>':'')
          +'</tr>';
      }).join('')
      +'</tbody></table>';
  }
  return '<div style="padding:8px 0 32px">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:18px">'
    +'<div><div style="font-family:\'Playfair Display\',serif;font-size:22px;font-weight:800;color:var(--text)">🏷️ Assets & Inventory</div>'
    +'<div style="font-size:12.5px;color:var(--muted);margin-top:3px">'+assets.length+' asset records &nbsp;·&nbsp; '+totalItems+' total items &nbsp;·&nbsp; Est. value ₹'+totalVal.toLocaleString('en-IN')+'</div></div>'
    +(isAdmin&&!_assetForm?'<button onclick="assetOpenForm()" style="padding:8px 18px;border-radius:9px;background:#1433a8;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">➕ Add Asset</button>':'')
    +'</div>'
    +formHtml
    +'<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px">'
    +'<input value="'+esc(_assetSearch)+'" oninput="_assetSearch=this.value;navigate(\'assets\')" placeholder="🔍 Search assets..." style="flex:1;min-width:180px;padding:8px 13px;border-radius:9px;border:1.5px solid var(--border);background:var(--surface);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif">'
    +'<select onchange="_assetCat=this.value;navigate(\'assets\')" style="padding:8px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--surface);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif">'+_ASSET_CATS.map(function(c){return '<option'+(c===_assetCat?' selected':'')+'>'+c+'</option>';}).join('')+'</select>'
    +'<select onchange="_assetLoc=this.value;navigate(\'assets\')" style="padding:8px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--surface);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif">'+_ASSET_LOCS.map(function(l){return '<option'+(l===_assetLoc?' selected':'')+'>'+l+'</option>';}).join('')+'</select>'
    +'</div>'
    +'<div style="background:var(--surface);border:1.5px solid var(--border);border-radius:12px;overflow:auto">'+rows+'</div>'
    +'</div>';
}
/* ══════════════════════════════════════════════════════════════════
   TRANSPORT
   ══════════════════════════════════════════════════════════════════ */
var _transportTab='routes', _transportForm=false, _transportEdit=null;
function gnsiAssetsPrint(){
  var assets=gnsiLoad('gnsi_assets')||[];
  var totalVal=assets.reduce(function(s,a){return s+(parseFloat(a.val)||0);},0);
  var rows=assets.map(function(a,i){
    var c={Good:'#16a34a',Fair:'#d97706',Poor:'#dc2626','Under Repair':'#7c3aed',Disposed:'#64748b'}[a.cond]||'#555';
    return '<tr><td style="text-align:center">'+(i+1)+'</td>'
      +'<td><b>'+esc(a.name||'—')+'</b></td><td>'+esc(a.cat||'—')+'</td>'
      +'<td>'+esc(a.loc||'—')+'</td><td style="text-align:center">'+esc(String(a.qty||0))+'</td>'
      +'<td style="color:'+c+';font-weight:700">'+esc(a.cond||'—')+'</td>'
      +'<td style="text-align:right">₹'+(a.val?Number(a.val).toLocaleString('en-IN'):'—')+'</td>'
      +'<td>'+esc(a.purchDate||'—')+'</td><td>'+esc(a.serial||'—')+'</td></tr>';
  }).join('');
  var body='<div class="gnsi-pg-hdr"><div class="gnsi-inst">'+(window.TENANT?window.TENANT.name+' · '+window.TENANT.city:'Guidance Navodaya & Sainik Institute · Khangabok')+'</div>'
    +'<div class="gnsi-pg-title">📦 Asset Inventory Register</div>'
    +'<div class="gnsi-pg-sub">Printed: '+new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})
    +' · Total Value: ₹'+totalVal.toLocaleString('en-IN')+'</div></div>'
    +'<table><thead><tr><th style="width:26px">#</th><th>Asset Name</th><th style="width:90px">Category</th><th style="width:90px">Location</th>'
    +'<th style="width:40px;text-align:center">Qty</th><th style="width:70px">Condition</th>'
    +'<th style="width:75px;text-align:right">Value</th><th style="width:80px">Purchase Date</th><th>Serial No.</th></tr></thead><tbody>'+rows+'</tbody>'
    +'<tfoot><tr style="background:#f0f4ff"><td colspan="6" style="padding:6px 8px;font-weight:700">TOTAL ASSET VALUE</td>'
    +'<td style="padding:6px 8px;font-weight:800;text-align:right;color:#1433a8">₹'+totalVal.toLocaleString('en-IN')+'</td>'
    +'<td colspan="2"></td></tr></tfoot></table>';
  gnsiPrintWindow('Asset Inventory — GNSI', body, false);
}
function gnsiAssetsExport(){
  showToast('⏳ Preparing Assets Excel…','#2563eb');

  var assets=gnsiLoad('gnsi_assets')||[];
  var totalVal=assets.reduce(function(s,a){return s+(parseFloat(a.val)||0);},0);
  var rows=[['GNSI — Asset Inventory Register'],['Exported: '+new Date().toLocaleString('en-IN'),'Total Value: ₹'+totalVal.toLocaleString('en-IN')],[]
    ,['#','Asset Name','Category','Location','Quantity','Condition','Purchase Value (₹)','Purchase Date','Serial Number','Notes']];
  assets.forEach(function(a,i){rows.push([i+1,a.name||'',a.cat||'',a.loc||'',a.qty||0,a.cond||'',a.val||0,a.purchDate||'',a.serial||'',a.notes||'']);});
  rows.push([]); rows.push(['','TOTAL','','','','' ,totalVal,'','','']);
    showToast('✅ Assets Excel ready — '+(assets.length)+' rows','#16a34a');
  gnsiExportExcel('Assets_'+new Date().toISOString().slice(0,10)+'.xlsx',[{name:'Assets',rows:rows,cols:[{wch:4},{wch:26},{wch:16},{wch:16},{wch:8},{wch:12},{wch:16},{wch:14},{wch:18},{wch:25}]}]);
}
function transportOpenForm(id){ _transportEdit=id||null; _transportForm=true; navigate(); }
function transportCloseForm(){ _transportForm=false; _transportEdit=null; navigate(); }
function transportSave(){
  var routeName=document.getElementById('tr-route').value.trim();
  var vehicle=document.getElementById('tr-vehicle').value.trim();
  var driver=document.getElementById('tr-driver').value.trim();
  var driverPhone=document.getElementById('tr-dphone').value.trim();
  var stops=document.getElementById('tr-stops').value.trim();
  var depTime=document.getElementById('tr-dep').value;
  var retTime=document.getElementById('tr-ret').value;
  var capacity=parseInt(document.getElementById('tr-cap').value)||0;
  var assigned=parseInt(document.getElementById('tr-assigned').value)||0;
  var notes=document.getElementById('tr-notes').value.trim();
  if(!routeName){ alert('Route name is required.'); return; }
  var routes=gnsiLoad('gnsi_transport_routes')||[];
  var rec={id:_transportEdit||('tr'+Date.now()),routeName:routeName,vehicle:vehicle,driver:driver,driverPhone:driverPhone,stops:stops,depTime:depTime,retTime:retTime,capacity:capacity,assigned:assigned,notes:notes,status:'Active'};
  if(_transportEdit){
    var existing=routes.find(function(r){return r.id===_transportEdit;})||{};
    rec.status=existing.status||'Active';
    routes=routes.map(function(r){return r.id===_transportEdit?rec:r;});
  } else {
    routes.unshift(rec);
  }
  gnsiSave('gnsi_transport_routes', routes);
  _transportForm=false; _transportEdit=null;
  navigate();
}
function transportDelete(id){
  if(!confirm('Delete this route?')) return;
  gnsiSave('gnsi_transport_routes', (gnsiLoad('gnsi_transport_routes')||[]).filter(function(r){return r.id!==id;}));
  navigate();
}
function transportToggleStatus(id){
  var routes=(gnsiLoad('gnsi_transport_routes')||[]).map(function(r){return r.id===id?Object.assign({},r,{status:r.status==='Active'?'Inactive':'Active'}):r;});
  gnsiSave('gnsi_transport_routes', routes);
  navigate();
}
function renderTransport(){
  navigate('dashboard');
  return '';
}
/* ══════════════════════════════════════════════════════════════════
   EVENT CALENDAR
   ══════════════════════════════════════════════════════════════════ */
var _calYear=new Date().getFullYear(), _calMonth=new Date().getMonth(), _calForm=false, _calSelDate='', _calEditId=null;
var _CAL_TYPES=['Holiday','Exam','Sports','Cultural','Meeting','Other'];
var _CAL_TYPE_COLORS={Holiday:'#dc2626',Exam:'#1433a8',Sports:'#16a34a',Cultural:'#d97706',Meeting:'#6366f1',Other:'#64748b'};
function gnsiTransportPrint(){
  var routes=gnsiLoad('gnsi_transport_routes')||[];
  var rows=routes.map(function(r,i){
    var c=r.status==='Active'?'#16a34a':'#dc2626';
    return '<tr><td style="text-align:center">'+(i+1)+'</td>'
      +'<td><b>'+esc(r.routeName||'—')+'</b></td><td>'+esc(r.vehicle||'—')+'</td>'
      +'<td>'+esc(r.driver||'—')+'</td><td>'+esc(r.driverPhone||'—')+'</td>'
      +'<td>'+esc(r.stops||'—')+'</td>'
      +'<td style="text-align:center">'+esc(r.depTime||'—')+' / '+esc(r.retTime||'—')+'</td>'
      +'<td style="text-align:center">'+(r.assigned||0)+' / '+(r.capacity||0)+'</td>'
      +'<td style="color:'+c+';font-weight:700">'+esc(r.status||'—')+'</td></tr>';
  }).join('');
  var body='<div class="gnsi-pg-hdr"><div class="gnsi-inst">'+(window.TENANT?window.TENANT.name+' · '+window.TENANT.city:'Guidance Navodaya & Sainik Institute · Khangabok')+'</div>'
    +'<div class="gnsi-pg-title">🚌 Transport Route Register</div>'
    +'<div class="gnsi-pg-sub">Printed: '+new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})+' · Routes: '+routes.length+'</div></div>'
    +'<table><thead><tr><th style="width:26px">#</th><th>Route Name</th><th>Vehicle</th><th>Driver</th>'
    +'<th style="width:90px">Phone</th><th>Stops</th><th style="width:90px">Dep / Ret</th>'
    +'<th style="width:60px;text-align:center">Assigned</th><th style="width:55px">Status</th></tr></thead><tbody>'+rows+'</tbody></table>';
  gnsiPrintWindow('Transport Routes — GNSI', body, false);
}
function gnsiTransportExport(){
  showToast('⏳ Preparing Transport CSV…','#2563eb');

  var routes=gnsiLoad('gnsi_transport_routes')||[];
  var rows=[['GNSI — Transport Routes'],['Exported: '+new Date().toLocaleString('en-IN')],[]
    ,['#','Route Name','Vehicle','Driver','Driver Phone','Stops','Departure','Return','Capacity','Assigned','Status','Notes']];
  routes.forEach(function(r,i){rows.push([i+1,r.routeName||'',r.vehicle||'',r.driver||'',r.driverPhone||'',r.stops||'',r.depTime||'',r.retTime||'',r.capacity||0,r.assigned||0,r.status||'',r.notes||'']);});
    showToast('✅ Transport CSV ready — '+(routes.length)+' rows','#16a34a');
  gnsiExportExcel('Transport_'+new Date().toISOString().slice(0,10)+'.xlsx',[{name:'Routes',rows:rows,cols:[{wch:4},{wch:26},{wch:22},{wch:20},{wch:14},{wch:35},{wch:10},{wch:10},{wch:10},{wch:10},{wch:10},{wch:25}]}]);
}
function calPrev(){ if(_calMonth===0){_calMonth=11;_calYear--;}else{_calMonth--;} navigate('calendar'); }
function calNext(){ if(_calMonth===11){_calMonth=0;_calYear++;}else{_calMonth++;} navigate('calendar'); }
function calOpenForm(date, id){ _calSelDate=date||''; _calEditId=id||null; _calForm=true; navigate('calendar'); }
function calCloseForm(){ _calForm=false; _calSelDate=''; _calEditId=null; navigate('calendar'); }
function calSave(){
  var title=document.getElementById('cal-title').value.trim();
  var date=document.getElementById('cal-date').value;
  var type=document.getElementById('cal-type').value;
  var endDate=document.getElementById('cal-enddate').value;
  var desc=document.getElementById('cal-desc').value.trim();
  if(!title||!date){ alert('Title and date are required.'); return; }
  var events=gnsiLoad('gnsi_events')||[];
  /* FIX #13: Detect time conflicts on same date */
  if(!_calEditId){
    var sameDay=events.filter(function(e){return e.date===date&&e.type===type;});
    if(sameDay.length>0){
      if(!confirm('⚠ Conflict: '+sameDay.length+' existing event(s) on '+date+' with type "'+type+'":\n• '+sameDay.slice(0,3).map(function(e){return e.title;}).join('\n• ')+'\n\nAdd anyway?')) return;
    }
  }
  var rec={id:_calEditId||('ev'+Date.now()),title:title,date:date,endDate:endDate,type:type,desc:desc};
  if(_calEditId){
    events=events.map(function(e){return e.id===_calEditId?rec:e;});
  } else {
    events.push(rec);
  }
  gnsiSave('gnsi_events', events);
  // go to the month of the saved event
  var d=new Date(date); _calYear=d.getFullYear(); _calMonth=d.getMonth();
  calCloseForm();
}
function calDelete(id){
  if(!confirm('Delete this event?')) return;
  gnsiSave('gnsi_events', (gnsiLoad('gnsi_events')||[]).filter(function(e){return e.id!==id;}));
  navigate('calendar');
}
function renderBackup(){
  try {
  var cfg=gnsiLoad('gnsi_backup_config')||{auto:false,freq:'daily',lastBackup:null};
  var sizeKB=_getBkSizeKB(); /* FREEZE FIX v8: uses 15-second TTL cache */
  var _lastCloudDate = localStorage.getItem('_gnsi_cloud_backup_date') || null;
  var _lastCloudTs   = localStorage.getItem('_gnsi_cloud_backup_ts')   || null;
  var _cloudStatus   = _lastCloudDate
    ? '<span style="color:#16a34a">✅ Last cloud backup: <b>'+_lastCloudDate+'</b> at '+new Date(parseInt(_lastCloudTs)).toLocaleTimeString('en-IN')+'</span>'
    : '<span style="color:#ea580c">⚠️ No cloud backup yet today — will run automatically after login</span>';

  /* Async load cloud backup list and inject into DOM */
  setTimeout(function(){
    if(!_supa) return;
    var _bkListSid = (window.TENANT&&window.TENANT.schoolId) ? window.TENANT.schoolId
      : (function(){ try{ var u=JSON.parse(localStorage.getItem('gnsi_jwt_user')||'{}'); return u.schoolId||u.school_id||null; }catch(e){ return null; } })();
    var _bkListQ = _supa.from('gnsi_backups').select('backup_date,size_kb,created_by,created_at');
    if (_bkListSid) _bkListQ = _bkListQ.eq('school_id', _bkListSid);
    _bkListQ.order('backup_date',{ascending:false}).limit(10)
      .then(function(r){
        var el=document.getElementById('gnsi-cloud-bk-list');
        if(!el) return;
        if(!r.data||!r.data.length){el.innerHTML='<div style="color:var(--muted);font-size:13px;padding:8px 0">No cloud backups found yet.</div>';return;}
        el.innerHTML='<table style="width:100%;border-collapse:collapse;font-size:12.5px">'
          +'<tr style="color:var(--muted);font-size:11px"><th style="text-align:left;padding:4px 8px">Date</th><th style="text-align:left;padding:4px 8px">Size</th><th style="text-align:left;padding:4px 8px">By</th><th style="padding:4px 8px"></th></tr>'
          +r.data.map(function(b){
            return '<tr style="border-top:0.5px solid var(--border)">'
              +'<td style="padding:6px 8px"><b>'+b.backup_date+'</b></td>'
              +'<td style="padding:6px 8px">'+b.size_kb+' KB</td>'
              +'<td style="padding:6px 8px">'+esc(b.created_by||'')+'</td>'
              +'<td style="padding:6px 8px"><button class="btn btn-outline" style="padding:3px 10px;font-size:11px" onclick="gnsiRestoreFromCloud(\''+b.backup_date+'\')">Restore</button></td>'
              +'</tr>';
          }).join('')
          +'</table>';
      }).catch(function(){});
  },500);

  return'<div class="card" style="margin-bottom:16px"><div class="card-head"><span class="card-title">☁️ Auto Cloud Backup</span></div>'
    +'<div style="padding:20px">'
    +'<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:12px 16px;margin-bottom:16px;font-size:13px;color:#166534">'
    +'✅ Auto backup saves your data to Supabase daily — silently, 8 seconds after admin login. No button needed.</div>'
    +'<div style="font-size:13px;margin-bottom:12px">'+_cloudStatus+'</div>'
    +'<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px">'
    +'<button class="btn btn-primary" id="gnsi-cloud-bk-btn" onclick="(function(b){b.disabled=true;b.textContent=\'⏳ Backing up…\';gnsiAutoBackupToCloud(true).then(function(){b.disabled=false;b.textContent=\'☁️ Backup Now to Cloud\';if(typeof render===\'function\')render();}).catch(function(){b.disabled=false;b.textContent=\'☁️ Backup Now to Cloud\';});})(this)">☁️ Backup Now to Cloud</button>'
    +'</div>'
    +'<div style="font-size:12px;font-weight:500;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">Last 10 cloud backups</div>'
    +'<div id="gnsi-cloud-bk-list" style="min-height:40px"><div style="color:var(--muted);font-size:13px">Loading…</div></div>'
    +'</div></div>'
    +'<div class="card" style="margin-bottom:16px"><div class="card-head"><span class="card-title">💾 Manual Backup & Restore</span></div>'
    +'<div style="padding:20px">'
    +'<div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">'
    +'<button class="btn btn-primary" id="gnsi-dl-bk-btn" onclick="(function(b){b.disabled=true;b.textContent=\'⏳ Preparing…\';gnsiDoBackup().finally(function(){b.disabled=false;b.textContent=\'📥 Download Backup\';}); })(this)">📥 Download Backup</button>'
    +'<button class="btn btn-outline" onclick="gnsiDoExcelBackup()" style="color:#16a34a;border-color:#86efac">↓ Excel Snapshot</button>'
    +'<button class="btn btn-outline" onclick="gnsiRestoreBackupPrompt()">📤 Restore from File</button>'
    +'</div>'
    +'<div style="padding:12px 16px;background:var(--surface2);border-radius:10px;font-size:13px">'
    +'<b>Local data:</b> ~'+sizeKB+' KB across '+_BK_KEYS.length+' keys. '
    +(cfg.lastBackup?'<b>Last manual backup:</b> '+new Date(cfg.lastBackup).toLocaleString('en-IN'):'<b>Last manual backup:</b> Never')
    +'</div>'
    +'<input type="file" id="bk-restore-inp" accept=".json" style="display:none" onchange="gnsiRestoreBackup(this)"/>'
    +'</div></div>';
  } catch(e) {
    return '<div style="padding:40px;text-align:center;color:#dc2626;font-family:DM Sans,sans-serif">'
      + '<div style="font-size:36px;margin-bottom:12px">⚠️</div>'
      + '<div style="font-size:16px;font-weight:700;margin-bottom:8px">Backup page failed to load</div>'
      + '<div style="font-size:12px;color:#64748b">' + (e && e.message ? e.message : String(e)) + '</div>'
      + '</div>';
  }
}
function gnsiDoExcelBackup(){
  showToast('⏳ 0% — Scanning data tables…','#1433a8');
  setTimeout(function(){
    var sheets = [];
    var keys = {
      'Students': 'gnsi_students',
      'Staff': 'gnsi_staff',
      'Attendance': 'gnsi_attendance',
      'Fees': 'gnsi_fee_records',
      'Discipline': 'gnsi_discipline',
      'Sick Bay': 'gnsi_sickbay',
      'Scholarships': 'gnsi_scholarships',
      'Alumni': 'gnsi_alumni',
      'Competitions': 'gnsi_competitions',
      'Library Books': 'gnsi_books',
      'Book Issues': 'gnsi_book_issues',
      'Night Duty': 'gnsi_night_duty',
      'PTM': 'gnsi_ptm_meetings',
      'Assets': 'gnsi_assets',
      'Transport': 'gnsi_transport_routes',
      'Events': 'gnsi_events',
      'Payments': 'gnsi_payment_txns',
      'Scholarships2': 'gnsi_scholarships',
    };
    var keyNames = Object.keys(keys);
    var done = 0;
    keyNames.forEach(function(name){
      try{
        var data=JSON.parse(localStorage.getItem(keys[name])||'[]');
        done++;
        var pct = Math.round(10 + (done/keyNames.length)*55);
        showToast('⏳ '+pct+'% — Loading '+name+' ('+data.length+' rows)…','#1433a8');
        if(!Array.isArray(data)||!data.length) return;
        var header=Object.keys(data[0]);
        var rows=[['GNSI Backup — '+name],['Exported: '+new Date().toLocaleString('en-IN')],[],header];
        data.forEach(function(row){ rows.push(header.map(function(k){var v=row[k];return typeof v==='object'?JSON.stringify(v):v;})); });
        sheets.push({name:name.substring(0,31),rows:rows});
      }catch(e){}
    });
    if(!sheets.length){alert('No data found to export.');return;}
    showToast('⏳ 75% — Building Excel file ('+sheets.length+' sheets)…','#1433a8');
    setTimeout(function(){
      showToast('⏳ 90% — Writing file…','#1433a8');
      gnsiExportExcel('GNSI_DataSnapshot_'+new Date().toISOString().slice(0,10)+'.xlsx', sheets);
      showToast('✅ 100% — Excel backup ready! '+sheets.length+' sheets exported','#16a34a');
    },10);
  },20);
}
function gnsiSaveBackupCfg(){
  var old=gnsiLoad('gnsi_backup_config')||{};
  gnsiSave('gnsi_backup_config',{
    auto:(document.getElementById('bk-auto')||{}).value==='1',
    freq:((document.getElementById('bk-freq')||{}).value||'daily'),
    lastBackup:old.lastBackup||null
  });showToast('Backup config saved','#16a34a');
}

/* ── AUTO CLOUD BACKUP v74.1 ─────────────────────────────────────────────
   Saves a daily JSON snapshot to the gnsi_backups Supabase table.
   Runs automatically on login if >23 hours since last cloud backup.
   Only admin/manager roles trigger the backup.
   Zero egress cost — database insert, not storage upload.
─────────────────────────────────────────────────────────────────────────── */
async function gnsiAutoBackupToCloud(force) {
  if (!_supa) return;
  if (!currentUser) return;
  if (['admin','manager'].indexOf(currentUser.role) < 0) return;

  /* Check if backup already done today */
  var _lastCloud = localStorage.getItem('_gnsi_cloud_backup_ts') || '0';
  var _age = Date.now() - parseInt(_lastCloud);
  var _23HRS = 23 * 60 * 60 * 1000;
  if (!force && _age < _23HRS) return; /* already backed up today */

  try {
    /* Build backup payload — same as manual backup but lighter (no Supabase re-fetch) */
    var payload = { meta: { version: 'GNSI-AUTO-1', createdAt: new Date().toISOString(),
      createdBy: currentUser.name, role: currentUser.role, type: 'auto' }, data: {} };
    _BK_KEYS.forEach(function(k) {
      try { var v = localStorage.getItem(k); if (v) payload.data[k] = JSON.parse(v); } catch(e) {}
    });

    var today = new Date().toISOString().slice(0, 10); /* "2026-04-26" */
    var sizeKB = (JSON.stringify(payload).length / 1024).toFixed(1);

    var _bkSid = (window.TENANT&&window.TENANT.schoolId) ? window.TENANT.schoolId
      : (function(){ try{ var u=JSON.parse(localStorage.getItem('gnsi_jwt_user')||'{}'); return u.schoolId||u.school_id||null; }catch(e){ return null; } })();
    var _bkRow = {
      backup_date:  today,
      created_at:   new Date().toISOString(),
      created_by:   currentUser.name,
      size_kb:      parseFloat(sizeKB),
      portal_ver:   'v74',
      data:         payload
    };
    if (_bkSid) _bkRow.school_id = _bkSid;
    /* Conflict key includes school_id so tenants don't overwrite each other */
    /* FREEZE FIX: race the upsert against a 12-second timeout so auto-backup
       never blocks the post-login render when Supabase is unreachable. */
    var result = await Promise.race([
      _supa.from('gnsi_backups').upsert(_bkRow, { onConflict: _bkSid ? 'backup_date,school_id' : 'backup_date' }),
      new Promise(function(resolve){ setTimeout(function(){ resolve({error:{message:'timeout'}}); }, 12000); })
    ]);

    if (result.error) throw result.error;

    /* Stamp success */
    localStorage.setItem('_gnsi_cloud_backup_ts', String(Date.now()));
    localStorage.setItem('_gnsi_cloud_backup_date', today);
    console.log('[GNSI] Auto cloud backup saved for ' + today + ' (' + sizeKB + ' KB)');

    /* Silently update the backup page if it is open */
    if (typeof activePage !== 'undefined' && activePage === 'backup') {
      if (typeof render === 'function') render();
    }
  } catch(e) {
    console.warn('[GNSI] Auto cloud backup failed:', e.message || e);
  }
}

/* Restore a specific date from cloud backup */
async function gnsiRestoreFromCloud(date) {
  if (!_supa) { showToast('Supabase not connected','#dc2626'); return; }
  if (!confirm('Restore backup from ' + date + '? This will overwrite all current local data.')) return;
  try {
    showToast('⏳ Fetching cloud backup…','#1433a8');
    var _bkRestSid = (window.TENANT&&window.TENANT.schoolId) ? window.TENANT.schoolId
      : (function(){ try{ var u=JSON.parse(localStorage.getItem('gnsi_jwt_user')||'{}'); return u.schoolId||u.school_id||null; }catch(e){ return null; } })();
    var _bkRestQ = _supa.from('gnsi_backups').select('data,size_kb').eq('backup_date', date);
    if (_bkRestSid) _bkRestQ = _bkRestQ.eq('school_id', _bkRestSid);
    var result = await _bkRestQ.single();
    if (result.error || !result.data) { showToast('Backup not found for ' + date,'#dc2626'); return; }
    var payload = result.data.data;
    if (!payload || !payload.data) { showToast('Invalid backup format','#dc2626'); return; }
    Object.keys(payload.data).forEach(function(k) {
      try { localStorage.setItem(k, JSON.stringify(payload.data[k])); } catch(ex) {}
    });
    showToast('✅ Restored from cloud backup (' + date + '). Reloading…','#16a34a');
    setTimeout(function(){ location.reload(); }, 2000);
  } catch(e) {
    showToast('Restore failed: ' + (e.message||'unknown'),'#dc2626');
  }
}

async function gnsiDoBackup(){
  showToast('\u23f3 Preparing backup\u2026','#1433a8');
  var backup={meta:{version:'GNSI-BK-2',createdAt:new Date().toISOString(),
    createdBy:currentUser?currentUser.name:'',
    note:'Includes localStorage + Supabase tables'},data:{},supabase:{}};
  _BK_KEYS.forEach(function(k){try{var v=localStorage.getItem(k);if(v)backup.data[k]=JSON.parse(v);}catch(e){}});
  if(_supa){
    var sbTables=['students','staff','gnsi_fee_collections','gnsi_fee_assignments',
      'gnsi_fee_config','gnsi_income','gnsi_expenditure'];
    try{
      /* FREEZE FIX: wrap every Supabase fetch with a 10-second timeout so
         gnsiDoBackup never hangs the UI when the network is slow or offline. */
      function _bkWithTimeout(promise, ms) {
        return new Promise(function(resolve) {
          var tid = setTimeout(function(){ resolve({data:[], error:new Error('timeout')}); }, ms||10000);
          promise.then(function(r){ clearTimeout(tid); resolve(r); })
                 .catch(function(){ clearTimeout(tid); resolve({data:[],error:null}); });
        });
      }
      var results=await Promise.all(sbTables.map(function(t){
        return _bkWithTimeout(_supa.from(t).select('*')).then(function(r){return{table:t,data:r.data||[]};}).catch(function(){return{table:t,data:[]};});
      }));
      results.forEach(function(r){backup.supabase[r.table]=r.data;});
      backup.meta.supabaseTables=sbTables;
    }catch(e){backup.meta.supabaseNote='Fetch failed: '+(e.message||'unknown');}
  } else {
    backup.meta.supabaseNote='Supabase not connected';
  }
  var json=JSON.stringify(backup,null,2);
  var blob=new Blob([json],{type:'application/json'});
  var a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download='GNSI_Backup_'+new Date().toISOString().replace(/[:.]/g,'-').slice(0,19)+'.json';
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  var cfg=gnsiLoad('gnsi_backup_config')||{};cfg.lastBackup=new Date().toISOString();gnsiSave('gnsi_backup_config',cfg);
  showToast('\u2705 Backup downloaded ('+(json.length/1024).toFixed(0)+' KB)','#16a34a');
}
function gnsiRestoreBackupPrompt(){var el=document.getElementById('bk-restore-inp');if(el)el.click();}
function gnsiRestoreBackup(input){
  var file=input.files[0];if(!file)return;
  showToast('⏳ 10% — Reading backup file…','#1433a8');
  var reader=new FileReader();
  reader.onload=function(e){
    showToast('⏳ 35% — Parsing backup…','#1433a8');
    setTimeout(function(){
      try{
        var backup=JSON.parse(e.target.result);
        if(!backup||!backup.data){showToast('❌ Invalid backup file — missing data section','#dc2626');return;}
        if(!confirm('This will OVERWRITE all current GNSI data. Are you sure?'))return;
        var dataKeys=Object.keys(backup.data);
        showToast('⏳ 60% — Restoring '+dataKeys.length+' data keys…','#1433a8');
        setTimeout(function(){
          var restored=0;
          dataKeys.forEach(function(k){
            try{localStorage.setItem(k,JSON.stringify(backup.data[k]));restored++;}catch(ex){}
          });
          showToast('✅ 100% — Restored '+restored+'/'+dataKeys.length+' keys. Reloading…','#16a34a');
          setTimeout(function(){location.reload();},1200);
        },10);
      }catch(err){showToast('❌ Restore failed: '+err.message,'#dc2626');}
    },10);
  };
  reader.readAsText(file);
}
/* ══════════════════════════════════════════════════════════════
   █  ONLINE PAYMENTS
   ══════════════════════════════════════════════════════════════ */
var _paySearch='',_payFilter='all';
  window.renderStorageManager = function(){
    var sm=window._smState;
    var sizeKB=_sizeKB();
    var pct=Math.min(100,Math.round(sizeKB/5120*100));
    var barCol=pct>=90?'#dc2626':pct>=70?'#d97706':'#16a34a';
    var cats=_categorise();
    var catArr=CATEGORIES.map(function(c){ return cats[c.id]; }).filter(function(c){ return c.sizeKB>0||c.keys.length>0; });
    var queueLen=0;
    try{ queueLen=(JSON.parse(localStorage.getItem('gnsi_offline_queue')||'[]')).length; }catch(e){}
    var totalKeys=localStorage.length||0;

    /* tab btn helper */
    function tabBtn(key,icon,label){
      var a=sm.tab===key;
      return '<button onclick="window._smState.tab=\''+key+'\';render()" style="display:flex;align-items:center;gap:6px;padding:9px 20px;border-radius:10px;border:'+(a?'none':'1.5px solid var(--border)')+';background:'+(a?'linear-gradient(135deg,var(--accent),#2563eb)':'var(--surface)')+';color:'+(a?'#fff':'var(--muted)')+';font-size:12.5px;font-weight:'+(a?'800':'600')+';cursor:pointer">'+icon+' '+label+'</button>';
    }

    var header='<div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:20px">'
      +'<div>'
        +'<div style="font-family:\'Playfair Display\',serif;font-size:22px;font-weight:700;color:var(--text)">🗄️ Storage Manager</div>'
        +'<div style="font-size:12px;color:var(--muted);margin-top:3px">Monitor, analyse, and clean your browser localStorage</div>'
      +'</div>'
      +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
        +'<div style="background:'+(pct>=90?'#fee2e2':pct>=70?'#fffbeb':'#f0fdf4')+';border:1.5px solid '+(pct>=90?'#fca5a5':pct>=70?'#fde047':'#86efac')+';border-radius:10px;padding:8px 16px;text-align:center">'
          +'<div style="font-size:18px;font-weight:800;color:'+barCol+'">'+sizeKB+'<span style="font-size:11px">KB</span></div>'
          +'<div style="font-size:10px;color:var(--muted)">'+pct+'% used</div>'
        +'</div>'
        +'<div style="background:var(--surface2);border:1.5px solid var(--border);border-radius:10px;padding:8px 16px;text-align:center">'
          +'<div style="font-size:18px;font-weight:800;color:var(--accent)">'+totalKeys+'</div>'
          +'<div style="font-size:10px;color:var(--muted)">total keys</div>'
        +'</div>'
        +'<div style="background:'+(queueLen>0?'#fffbeb':'var(--surface2)')+';border:1.5px solid '+(queueLen>0?'#fde047':'var(--border)')+';border-radius:10px;padding:8px 16px;text-align:center">'
          +'<div style="font-size:18px;font-weight:800;color:'+(queueLen>0?'#d97706':'var(--muted)')+'">'+queueLen+'</div>'
          +'<div style="font-size:10px;color:var(--muted)">queued</div>'
        +'</div>'
      +'</div>'
    +'</div>';

    var tabBar='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:22px">'
      +tabBtn('overview','📊','Overview')
      +tabBtn('inspector','🔍','Key Inspector')
      +tabBtn('cleanup','🧹','Cleanup')
      +tabBtn('auto','⚙️','Auto Settings')
    +'</div>';

    var body='';

    /* ══════════════════════════
       TAB: OVERVIEW
    ══════════════════════════ */
    if(sm.tab==='overview'){
      /* quota bar */
      body+='<div style="background:var(--surface);border:1.5px solid var(--border);border-radius:14px;padding:18px 20px;margin-bottom:18px">'
        +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">'
          +'<span style="font-weight:700;font-size:13.5px;color:var(--text)">Storage Quota</span>'
          +'<span style="font-size:12px;color:var(--muted)">'+sizeKB+'KB / 5120KB</span>'
        +'</div>'
        +'<div style="height:14px;background:var(--border);border-radius:7px;overflow:hidden;margin-bottom:8px">'
          +'<div style="height:100%;width:'+pct+'%;background:linear-gradient(90deg,'+barCol+','+barCol+'cc);border-radius:7px;transition:width .5s"></div>'
        +'</div>'
        +'<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted)">'
          +'<span>0KB</span><span style="color:#d97706">70% (3584KB)</span><span style="color:#dc2626">90% (4608KB)</span><span>5120KB</span>'
        +'</div>'
      +'</div>';

      /* donut + category bars */
      body+='<div style="background:var(--surface);border:1.5px solid var(--border);border-radius:14px;padding:18px 20px;margin-bottom:18px">'
        +'<div style="font-weight:700;font-size:13.5px;color:var(--text);margin-bottom:16px">📊 Usage by Module</div>'
        +'<div style="display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap">'
          +_donut(catArr,sizeKB)
          +'<div style="flex:1;min-width:220px">'
            +catArr.map(function(cat){
              var cpct=sizeKB>0?Math.round(cat.sizeKB/sizeKB*100):0;
              return '<div style="margin-bottom:10px">'
                +'<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">'
                  +'<span style="display:flex;align-items:center;gap:5px"><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:'+cat.color+'"></span><b>'+cat.icon+' '+_esc(cat.label)+'</b></span>'
                  +'<span style="font-family:\'JetBrains Mono\',monospace;font-weight:700;color:'+cat.color+'">'+cat.sizeKB+'KB &nbsp;'+cpct+'%</span>'
                +'</div>'
                +'<div style="height:8px;background:var(--border);border-radius:4px;overflow:hidden">'
                  +'<div style="height:100%;width:'+cpct+'%;background:'+cat.color+';border-radius:4px;transition:width .4s"></div>'
                +'</div>'
                +'<div style="font-size:10.5px;color:var(--muted);margin-top:2px">'+cat.keys.length+' keys</div>'
              +'</div>';
            }).join('')
          +'</div>'
        +'</div>'
      +'</div>';

      /* status strip */
      var metaKeys=_safeKeys().length;
      body+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-bottom:18px">'
        +[
          ['🗑️','Stale Metadata',metaKeys+' keys safe to delete','#d97706',pct>=70?'Recommended':'Optional'],
          ['⚡','Offline Queue',queueLen+' write'+(queueLen!==1?'s':'')+' pending',queueLen>0?'#dc2626':'#16a34a',queueLen>0?'Sync now':'All synced'],
          ['💾','Free Space',Math.round(5120-sizeKB)+'KB remaining',pct>=90?'#dc2626':pct>=70?'#d97706':'#16a34a',pct>=90?'Critical':pct>=70?'Low':'Healthy'],
          ['📦','Total Keys',totalKeys+' stored','#64748b','Normal for GNSI']
        ].map(function(k){
          return '<div style="background:var(--surface);border:1.5px solid var(--border);border-radius:12px;padding:14px 16px">'
            +'<div style="font-size:20px;margin-bottom:6px">'+k[0]+'</div>'
            +'<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em">'+k[1]+'</div>'
            +'<div style="font-size:14px;font-weight:800;color:'+k[3]+';margin:3px 0">'+k[2]+'</div>'
            +'<div style="font-size:10.5px;color:var(--muted)">'+k[4]+'</div>'
          +'</div>';
        }).join('')
      +'</div>';

      /* quick actions */
      body+='<div style="background:var(--surface);border:1.5px solid var(--border);border-radius:14px;padding:18px 20px">'
        +'<div style="font-weight:700;font-size:13.5px;color:var(--text);margin-bottom:14px">⚡ Quick Actions</div>'
        +'<div style="display:flex;gap:10px;flex-wrap:wrap">'
          +'<button onclick="smCleanMeta()" style="padding:9px 18px;border-radius:10px;background:#fffbeb;border:1.5px solid #fde047;color:#92400e;font-size:13px;font-weight:700;cursor:pointer">🧹 Clean Metadata ('+metaKeys+' keys)</button>'
          +(queueLen>0?'<button onclick="gnsiDrainQueue&&gnsiDrainQueue()" style="padding:9px 18px;border-radius:10px;background:#eff6ff;border:1.5px solid #93c5fd;color:#1433a8;font-size:13px;font-weight:700;cursor:pointer">⬆️ Drain Queue ('+queueLen+')</button>':'')
          +'<button onclick="smExportAll()" style="padding:9px 18px;border-radius:10px;background:#f0fdf4;border:1.5px solid #86efac;color:#16a34a;font-size:13px;font-weight:700;cursor:pointer">💾 Export All Data</button>'
          +'<button onclick="window._smState.tab=\'cleanup\';render()" style="padding:9px 18px;border-radius:10px;background:#fef2f2;border:1.5px solid #fca5a5;color:#dc2626;font-size:13px;font-weight:700;cursor:pointer">🗑️ Advanced Cleanup</button>'
        +'</div>'
      +'</div>';
    }

    /* ══════════════════════════
       TAB: KEY INSPECTOR
    ══════════════════════════ */
    if(sm.tab==='inspector'){
      body+='<div style="font-size:12.5px;color:var(--muted);margin-bottom:14px">Click a category to expand its keys. Largest keys shown first.</div>';
      catArr.forEach(function(cat){
        var isOpen=sm.expandCat===cat.id;
        body+='<div style="background:var(--surface);border:1.5px solid '+(isOpen?cat.color:'var(--border)')+';border-radius:12px;margin-bottom:10px;overflow:hidden">'
          +'<div onclick="window._smState.expandCat=window._smState.expandCat===\''+cat.id+'\'?null:\''+cat.id+'\';render()" style="padding:12px 16px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;background:'+(isOpen?cat.color+'15':'var(--surface)')+'">'
            +'<div style="display:flex;align-items:center;gap:10px">'
              +'<span style="width:12px;height:12px;border-radius:3px;background:'+cat.color+';display:inline-block"></span>'
              +'<span style="font-weight:700;font-size:13px;color:var(--text)">'+cat.icon+' '+_esc(cat.label)+'</span>'
              +'<span style="font-size:11.5px;color:var(--muted)">'+cat.keys.length+' keys</span>'
            +'</div>'
            +'<div style="display:flex;align-items:center;gap:10px">'
              +'<span style="font-family:\'JetBrains Mono\',monospace;font-weight:800;color:'+cat.color+';font-size:13px">'+cat.sizeKB+'KB</span>'
              +'<span style="color:var(--muted);font-size:16px">'+(isOpen?'▲':'▼')+'</span>'
            +'</div>'
          +'</div>'
          +(isOpen?'<div style="max-height:300px;overflow-y:auto">'
            +'<table style="width:100%;border-collapse:collapse;font-size:12px">'
            +'<thead><tr style="background:var(--surface2)">'
              +'<th style="padding:7px 14px;text-align:left;font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase">Key</th>'
              +'<th style="padding:7px 14px;text-align:right;font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;width:70px">Size</th>'
              +(isAdmin?'<th style="padding:7px 14px;width:60px"></th>':'')
            +'</tr></thead><tbody>'
            +cat.keys.slice(0,50).map(function(item){
              var isSafe=item.key.startsWith('gnsi_kv_ts_')||item.key.startsWith('gnsi_lkout_')||item.key==='gnsi_offline_queue'||item.key==='gnsi_offline_queue';
              return '<tr style="border-bottom:1px solid var(--border-soft)">'
                +'<td style="padding:7px 14px;font-family:\'JetBrains Mono\',monospace;font-size:11px;word-break:break-all;color:'+(isSafe?'var(--muted)':'var(--text)')+'">'+_esc(item.key)+(isSafe?' <span style="font-size:9px;background:#fef9c3;color:#92400e;border-radius:4px;padding:0 4px;margin-left:4px">safe to clear</span>':'')+'</td>'
                +'<td style="padding:7px 14px;text-align:right;font-family:\'JetBrains Mono\',monospace;font-weight:700;color:var(--accent)">'+item.kb+'KB</td>'
                +(isAdmin?'<td style="padding:7px 14px;text-align:center">'+(isSafe?'<button onclick="smDeleteKey(\''+_esc(item.key)+'\')" style="padding:2px 8px;border-radius:5px;border:1px solid #fca5a5;background:#fee2e2;color:#dc2626;font-size:10px;font-weight:700;cursor:pointer">✕</button>':'')+'</td>':'')
              +'</tr>';
            }).join('')
            +(cat.keys.length>50?'<tr><td colspan="3" style="padding:10px 14px;text-align:center;color:var(--muted);font-size:11.5px">… and '+(cat.keys.length-50)+' more keys</td></tr>':'')
            +'</tbody></table></div>':'')
        +'</div>';
      });
    }

    /* ══════════════════════════
       TAB: CLEANUP
    ══════════════════════════ */
    if(sm.tab==='cleanup'){
      var metaK=_safeKeys();
      body+='<div style="background:#fffbeb;border:1.5px solid #fde047;border-radius:12px;padding:14px 18px;margin-bottom:18px;font-size:12.5px;color:#92400e">'
        +'⚠️ <b>Always export a backup before deleting.</b> Deleted localStorage data cannot be recovered unless it was synced to Supabase cloud first.'
      +'</div>';

      /* Option 1: metadata only */
      body+='<div style="background:var(--surface);border:1.5px solid var(--border);border-radius:14px;padding:18px 20px;margin-bottom:14px">'
        +'<div style="font-weight:800;font-size:14px;color:var(--text);margin-bottom:6px">🧹 Option 1 — Clean Metadata Only <span style="font-size:11px;font-weight:400;color:var(--muted)">(100% safe)</span></div>'
        +'<div style="font-size:12.5px;color:var(--muted);margin-bottom:12px">Removes <b>'+metaK.length+' stale keys</b>: sync timestamps (<code>gnsi_kv_ts_*</code>), lockout records, and already-synced offline queue. No real data touched.</div>'
        +'<div style="display:flex;gap:8px">'
          +'<button onclick="smCleanMeta()" style="padding:9px 20px;border-radius:10px;background:linear-gradient(135deg,#d97706,#b45309);color:#fff;border:none;font-size:13px;font-weight:800;cursor:pointer">🧹 Clean '+metaK.length+' Metadata Keys</button>'
          +'<button onclick="smExportAll()" style="padding:9px 16px;border-radius:10px;border:1.5px solid var(--border);background:var(--surface);color:var(--muted);font-size:12.5px;font-weight:700;cursor:pointer">💾 Backup First</button>'
        +'</div>'
      +'</div>';

      /* Option 2: by category */
      body+='<div style="background:var(--surface);border:1.5px solid var(--border);border-radius:14px;padding:18px 20px;margin-bottom:14px">'
        +'<div style="font-weight:800;font-size:14px;color:var(--text);margin-bottom:6px">📦 Option 2 — Archive & Delete by Module</div>'
        +'<div style="font-size:12.5px;color:var(--muted);margin-bottom:12px">Choose a module, export its data to a file, then remove from localStorage. Use when that module\'s data is already safely in Supabase.</div>'
        +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">'
          +catArr.map(function(cat){
            var sel=sm.cleanCat===cat.id;
            return '<button onclick="window._smState.cleanCat=\''+cat.id+'\';window._smState.delConfirm=false;render()" style="padding:6px 14px;border-radius:20px;border:1.5px solid '+(sel?cat.color:'var(--border)')+';background:'+(sel?cat.color+'18':'var(--surface)')+';color:'+(sel?cat.color:'var(--muted)')+';font-size:12px;font-weight:700;cursor:pointer">'+cat.icon+' '+_esc(cat.label)+' ('+cats[cat.id].sizeKB+'KB)</button>';
          }).join('')
        +'</div>'
        +(sm.cleanCat&&cats[sm.cleanCat]?
          '<div style="background:var(--surface2);border-radius:10px;padding:12px 14px;margin-bottom:12px">'
            +'<b>'+cats[sm.cleanCat].icon+' '+_esc(cats[sm.cleanCat].label)+'</b> — '
            +cats[sm.cleanCat].keys.length+' keys, '+cats[sm.cleanCat].sizeKB+'KB'
            +'<div style="font-size:11.5px;color:var(--muted);margin-top:4px">Top keys: '+cats[sm.cleanCat].keys.slice(0,3).map(function(k){return _esc(k.key);}).join(', ')+(cats[sm.cleanCat].keys.length>3?'…':'')+'</div>'
          +'</div>'
          +(sm.delConfirm
            ?'<div style="background:#fee2e2;border:1.5px solid #fca5a5;border-radius:10px;padding:12px 14px;margin-bottom:10px;font-size:12.5px;color:#dc2626"><b>⚠️ Are you sure?</b> This will export and delete ALL '+cats[sm.cleanCat].keys.length+' keys in this category.</div>'
             +'<div style="display:flex;gap:8px"><button onclick="smArchiveCategory(\''+sm.cleanCat+'\')" style="padding:9px 18px;border-radius:10px;background:#dc2626;color:#fff;border:none;font-size:13px;font-weight:800;cursor:pointer">✅ Yes — Archive & Delete</button><button onclick="window._smState.delConfirm=false;render()" style="padding:9px 14px;border-radius:10px;border:1.5px solid var(--border);background:var(--surface);color:var(--muted);font-size:12.5px;font-weight:700;cursor:pointer">Cancel</button></div>'
            :'<button onclick="window._smState.delConfirm=true;render()" style="padding:9px 18px;border-radius:10px;background:#dc2626;color:#fff;border:none;font-size:13px;font-weight:800;cursor:pointer">🗑️ Archive & Delete this Category</button>')
        :'<div style="font-size:12.5px;color:var(--muted)">Select a module above to proceed.</div>')
      +'</div>';

      /* Option 3: export everything */
      body+='<div style="background:var(--surface);border:1.5px solid var(--border);border-radius:14px;padding:18px 20px">'
        +'<div style="font-weight:800;font-size:14px;color:var(--text);margin-bottom:6px">💾 Option 3 — Full Export & Reset</div>'
        +'<div style="font-size:12.5px;color:var(--muted);margin-bottom:12px">Export ALL localStorage to a single JSON backup file. Use before major cleanup or if switching devices.</div>'
        +'<button onclick="smExportAll()" style="padding:9px 20px;border-radius:10px;background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;border:none;font-size:13px;font-weight:800;cursor:pointer">💾 Export Full Backup ('+sizeKB+'KB)</button>'
      +'</div>';
    }

    /* ══════════════════════════
       TAB: AUTO SETTINGS
    ══════════════════════════ */
    if(sm.tab==='auto'){
      var lastClean=0;
      try{ lastClean=parseInt(localStorage.getItem('gnsi_sm_last_cleanup')||'0'); }catch(e){}
      var lastCleanStr=lastClean?new Date(lastClean).toLocaleString('en-IN'):'Never';
      var warnAt=70;
      try{ warnAt=parseInt(localStorage.getItem('gnsi_sm_warn_pct')||'70'); }catch(e){}

      body+='<div style="background:var(--surface);border:1.5px solid var(--border);border-radius:14px;padding:18px 20px;margin-bottom:14px">'
        +'<div style="font-weight:800;font-size:14px;color:var(--text);margin-bottom:14px">⚙️ Auto-Cleanup Settings</div>'

        +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">'

          +'<div style="background:var(--surface2);border-radius:10px;padding:14px">'
            +'<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;margin-bottom:6px">Last Auto-Cleanup</div>'
            +'<div style="font-size:14px;font-weight:700;color:var(--text)">'+lastCleanStr+'</div>'
            +'<div style="font-size:11px;color:var(--muted);margin-top:4px">Runs automatically every 20 hours</div>'
            +'<button onclick="smRunAutoClean()" style="margin-top:10px;padding:7px 14px;border-radius:8px;background:#d97706;color:#fff;border:none;font-size:12px;font-weight:700;cursor:pointer">▶️ Run Now</button>'
          +'</div>'

          +'<div style="background:var(--surface2);border-radius:10px;padding:14px">'
            +'<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;margin-bottom:6px">Warn When Storage Exceeds</div>'
            +'<div style="display:flex;align-items:center;gap:10px;margin-top:6px">'
              +'<input type="range" id="sm-warn-pct" min="50" max="95" step="5" value="'+warnAt+'" oninput="document.getElementById(\'sm-warn-val\').textContent=this.value+\'%\'" style="flex:1"/>'
              +'<span id="sm-warn-val" style="font-weight:800;color:var(--accent);font-size:15px;min-width:40px">'+warnAt+'%</span>'
            +'</div>'
            +'<button onclick="smSaveWarnPct()" style="margin-top:10px;padding:7px 14px;border-radius:8px;background:var(--accent);color:#fff;border:none;font-size:12px;font-weight:700;cursor:pointer">💾 Save Setting</button>'
          +'</div>'

          +'<div style="background:var(--surface2);border-radius:10px;padding:14px">'
            +'<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;margin-bottom:6px">What Auto-Cleanup Removes</div>'
            +'<ul style="font-size:12px;color:var(--muted);padding-left:16px;margin:6px 0">'
              +'<li>All <code>gnsi_kv_ts_*</code> sync timestamp keys</li>'
              +'<li>Expired lockout records (<code>gnsi_lkout_*</code>)</li>'
              +'<li>Already-synced offline queue</li>'
            +'</ul>'
            +'<div style="font-size:11px;color:#16a34a;margin-top:4px">✅ Never touches real data</div>'
          +'</div>'

          +'<div style="background:var(--surface2);border-radius:10px;padding:14px">'
            +'<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;margin-bottom:6px">Storage Monitor</div>'
            +'<div style="font-size:12px;color:var(--muted)">Checks quota every 5 minutes. Live indicator updates every 30 seconds.</div>'
            +'<div style="margin-top:8px;font-size:13px;font-weight:700;color:'+barCol+'">Current: '+pct+'% used</div>'
          +'</div>'

        +'</div>'
      +'</div>';

      /* health tips */
      body+='<div style="background:var(--surface);border:1.5px solid var(--border);border-radius:14px;padding:18px 20px">'
        +'<div style="font-weight:800;font-size:14px;color:var(--text);margin-bottom:12px">💡 Storage Health Tips</div>'
        +'<div style="display:grid;gap:8px;font-size:12.5px;color:var(--muted)">'
          +[
            ['🔄','Sync to cloud weekly','Go to Sync & Backup → Push All. Keeps Supabase up to date so local copies can be safely cleared.'],
            ['🧹','Run metadata cleanup monthly','Removes hundreds of stale timestamp keys with zero data risk.'],
            ['💾','Export before any major deletion','Always download a full backup before deleting a module category.'],
            ['📦','Keep under 70%','At 70% you get warnings. At 90% new writes may fail silently — data could be lost.'],
            ['⚡','Keep queue at 0','If queued writes > 0, check internet and click Drain Queue. Queued data only exists locally.'],
          ].map(function(t){
            return '<div style="display:flex;gap:10px;padding:10px 12px;background:var(--surface2);border-radius:8px">'
              +'<span style="font-size:18px;flex-shrink:0">'+t[0]+'</span>'
              +'<div><div style="font-weight:700;color:var(--text);margin-bottom:2px">'+t[1]+'</div>'
              +'<div>'+t[2]+'</div></div>'
            +'</div>';
          }).join('')
        +'</div>'
      +'</div>';
    }

    return '<div class="page-wrap">'+header+tabBar+body+'</div>';
  };

  /* ══════════════════════════════════════════════════════════════════════
     ACTION HANDLERS (called from onclick)
  ══════════════════════════════════════════════════════════════════════ */

  window.smCleanMeta = function(){
    var keys=_safeKeys();
    if(!keys.length){ _toast('Nothing to clean — no stale metadata found','#16a34a'); return; }
    var n=_deleteKeys(keys);
    _toast('🧹 Cleaned '+n+' metadata keys — freed ~'+Math.round(n*0.05)+'KB','#d97706');
    if(typeof render==='function') render();
  };

  window.smArchiveCategory = function(catId){
    var cats=_categorise();
    var cat=cats[catId];
    if(!cat||!cat.keys.length){ _toast('No keys in this category','#dc2626'); return; }
    _archiveThenDelete(cat.keys.map(function(k){return k.key;}), cat.label);
    window._smState.delConfirm=false;
    window._smState.cleanCat='';
    if(typeof render==='function') render();
  };

  window.smDeleteKey = function(key){
    if(!confirm('Delete key "'+key+'"? This cannot be undone.')) return;
    try{ localStorage.removeItem(key); _toast('Deleted: '+key,'#dc2626'); }catch(e){ _toast('Error: '+e.message,'#dc2626'); }
    if(typeof render==='function') render();
  };

  window.smExportAll = function(){
    var data={exportedAt:new Date().toISOString(),keys:{}};
    try{
      for(var i=0;i<localStorage.length;i++){
        var k=localStorage.key(i);
        if(k){ try{ data.keys[k]=JSON.parse(localStorage.getItem(k)||'null'); }catch(e){ data.keys[k]=localStorage.getItem(k); } }
      }
    }catch(e){}
    var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');
    a.href=url; a.download='gnsi_full_backup_'+new Date().toISOString().split('T')[0]+'.json'; a.click();
    setTimeout(function(){ URL.revokeObjectURL(url); },3000);
    _toast('💾 Full backup downloaded','#16a34a');
  };

  window.smRunAutoClean = function(){
    try{ localStorage.removeItem('gnsi_sm_last_cleanup'); }catch(e){}
    _autoCleanup();
    _toast('▶️ Auto-cleanup complete','#d97706');
    if(typeof render==='function') render();
  };

  window.smSaveWarnPct = function(){
    var val=parseInt((document.getElementById('sm-warn-pct')||{}).value||'70');
    try{ localStorage.setItem('gnsi_sm_warn_pct', String(val)); }catch(e){}
    if(typeof gnsiKVPush==='function') try{gnsiKVPush('gnsi_sm_warn_pct',val);}catch(e){}
    _toast('✅ Warning threshold set to '+val+'% — synced','#16a34a');
  };

  /* live refresh every 30 s when on this page */
  setInterval(function(){
    if(typeof currentPage!=='undefined' && currentPage==='storage_manager'){
      var el=document.getElementById('gnsi-storage-size');
      if(el) el.textContent=_sizeKB()+'KB / ~5120KB ('+Math.round(_sizeKB()/5120*100)+'%)';
    }
  }, 30000);

  /* ── wire into nav ────────────────────────────────────────────────────── */
  (function wireNav(){
    if(typeof ROLE_PAGES==='undefined'||typeof NAV_ITEMS==='undefined'){
      setTimeout(wireNav,400); return;
    }
    /* add to page map */
    if(typeof _PAGE_MAP!=='undefined') _PAGE_MAP['storage_manager']=window.renderStorageManager;
    /* add nav item */
    if(!NAV_ITEMS.find(function(x){return x.id==='storage_manager';})){
      var idx=NAV_ITEMS.findIndex(function(x){return x.id==='sync';});
      var entry={id:'storage_manager',label:'Storage Manager',icon:'🗄️',section:'System'};
      if(idx>-1) NAV_ITEMS.splice(idx+1,0,entry); else NAV_ITEMS.push(entry);
    }
    /* RBAC: admin + manager */
    ['admin','manager'].forEach(function(role){
      if(ROLE_PAGES[role]&&ROLE_PAGES[role].indexOf('storage_manager')===-1)
        ROLE_PAGES[role].push('storage_manager');
    });
    if(typeof render==='function') render();
  })();

  /* run auto cleanup at startup */
  setTimeout(_autoCleanup, 8000);

  console.log('[GNSI Storage Manager v1.0] ✅ Loaded');
})();

</script>

<!-- ═══════════════════════════════════════════════════════════════════════
     GNSI COURSE INDUCTION TIMETABLE  (Admin-only: view + edit/add/delete)
     Page ID: course_induction_tt
     Data key: gnsi_course_induction_tt  (JSON stored in localStorage)
     ═══════════════════════════════════════════════════════════════════════ -->
<script>
(function(){
'use strict';

/* ── Default data seeded from the 2026 Induction document ─────────────── */
var _DEFAULT_DATA = {
  timetables: [
    {
      id: 'tt_navodaya_foundation',
      title: 'Doubt Session – Navodaya & Foundation Course',
      days: 'Mon–Wed',
      batches: ['Lakshya (Navodaya) A','Lakshya (Navodaya) B','Umeed (Navodaya) A','Umeed (Navodaya) B','Elite (Foundation)','Prime (Foundation)'],
      slots: [
        { time:'7:00 AM – 7:45 AM',  cells:['Grammar (Miss Geetanjali)','Passage (Miss Devia)','Maths II (Sir Romesh)','Passage (Miss Bidyarani)','Science (Sir Shrinivash)','Reasoning (Sir Bidyachandra)'] },
        { time:'7:45 AM – 8:30 AM',  cells:['Passage (Miss Devia)','Grammar (Miss Geetanjali)','Passage (Miss Bidyarani)','Maths I (Sir Romesh)','Reasoning (Sir Bidyachandra)','Science (Sir Shrinivash)'] },
        { time:'5:30 PM – 6:20 PM',  cells:['Maths Class (Sir Bronson)','Mental (Sir Shrinivash)','Meitei Mayek (Miss Bidyarani)','Maths Practice (Sir Romesh)','',''] },
        { time:'6:30 PM – 7:15 PM',  cells:['Maths II Practice/Doubt Session (Miss Geetanjali)','Maths II Practice/Doubt Session (Miss Devia)','Hindi (Sir Hindi)','Vocabulary (Sir Arjun)','Vocabulary (Sir Arjun)','Hindi (Sir Hindi)'] },
        { time:'7:15 PM – 8:00 PM',  cells:['','','Maths Practice (Sir Romesh)','Meitei Mayek (Miss Bidyarani)','',''] },
        { time:'9:00 PM – 9:35 PM',  cells:['Maths I Practice/Doubt Session (Sir Umesh)','Maths I Practice/Doubt Session (Sir Bidyachandra)','Grammar Practice (Miss Fredava)','Grammar Practice (Miss Geetanjali)','',''] }
      ]
    },
    {
      id: 'tt_sainik_combined',
      title: 'Doubt Session – Sainik & Combined Course',
      days: 'Mon–Wed',
      batches: ['Achiever (Combined) A','Achiever (Combined) B','Leader (Sainik) A','Leader (Sainik) B','Champion (Sainik) A','Champion (Sainik) B'],
      slots: [
        { time:'7:00 AM – 7:45 AM',  cells:['Maths II with Practice Session (Sir Himan)','Maths I Practice (Miss Fredava)','Reasoning (Sir James)','Grammar (Sir Adison)','Reasoning (Sir Umesh)',''] },
        { time:'7:45 AM – 8:30 AM',  cells:['','Reasoning (Sir James)','Maths I Practice (Miss Fedrava)','Reasoning (Sir Umesh)','Grammar (Sir Adison)',''] },
        { time:'5:30 PM – 6:20 PM',  cells:['Reasoning (Sir Umesh)','Maths I Practice (Miss Fedrava)','Maths II with Practice Session (Sir Himan)','Science (Sir Arunkumar)','',''] },
        { time:'6:30 PM – 7:15 PM',  cells:['Grammar (Sir Adison)','Reasoning (Sir Umesh)','','Maths II (Sir James)','Maths I Practice (Miss Fedrava)',''] },
