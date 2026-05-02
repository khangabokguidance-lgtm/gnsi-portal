/* GNSI PORTAL — modules/hr.js
   Pages: appraisal, grievance
   DEPENDS ON: core/utils.js, core/state.js */

function renderAppraisal(){
  var isAdm=currentUser&&(currentUser.role==='admin'||currentUser.role==='manager');
  var appraisals=gnsiAppraisals();
  var year=new Date().getFullYear();
  if(_aprId!==null){
    var member=staff.find(function(s){return s.id===_aprId;})||{name:'Unknown',role:''};
    var existing=appraisals.find(function(a){return a.staffId===_aprId&&a.year===year;})||{};
    var rateInput=function(id,label,val){
      return '<div class="form-group"><label>'+label+'</label>'
        +'<select id="apr-'+id+'" style="width:100%;padding:8px;border:1.5px solid var(--border);border-radius:8px;font-size:13px"><option value="">-- Rate --</option>'
        +['5 -- Outstanding','4 -- Good','3 -- Average','2 -- Below Average','1 -- Poor'].map(function(o){return'<option value="'+o[0]+'"'+(val==o[0]?' selected':'')+'>'+o+'</option>';}).join('')
        +'</select></div>';
    };
    return '<button onclick="_aprId=null;render()" class="btn btn-outline" style="margin-bottom:16px">← Back</button>'
      +'<div class="card"><div class="card-head"><span class="card-title">📊 Appraisal -- '+esc(member.name)+' ('+year+')</span></div>'
      +'<div style="padding:20px"><div class="form-grid g23">'
      +rateInput('teach','Teaching Quality',existing.teach)
      +rateInput('discp','Discipline & Conduct',existing.discp)
      +rateInput('duty','Duty Compliance',existing.duty)
      +rateInput('punct','Punctuality',existing.punct)
      +rateInput('team','Team Work',existing.team)
      +'<div class="form-group g3"><label>Remarks / Observations</label><textarea id="apr-remarks" rows="3" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:9px;font-size:14px;font-family:\'DM Sans\',sans-serif;resize:vertical">'+esc(existing.remarks||'')+'</textarea></div>'
      +'</div><button class="btn btn-primary" onclick="gnsiSaveAppraisal('+_aprId+','+year+')" style="margin-top:12px">Save Appraisal</button>'
      +'</div></div>';
  }
  var rows=staff.filter(function(s){return s.status!=='Inactive';}).map(function(s){
    var apr=appraisals.find(function(a){return a.staffId===s.id&&a.year===year;});
    var avg=apr?((parseInt(apr.teach||0)+parseInt(apr.discp||0)+parseInt(apr.duty||0)+parseInt(apr.punct||0)+parseInt(apr.team||0))/5).toFixed(1):'--';
    return'<tr><td><b>'+esc(s.name)+'</b><div style="font-size:11px;color:var(--muted)">'+esc(s.role||'')+'</div></td>'
      +'<td style="text-align:center">'+(apr?'<span style="color:#16a34a;font-weight:700">'+avg+'/5</span>':'<span style="color:var(--muted);font-size:12px">Not done</span>')+'</td>'
      +'<td>'+(isAdm?'<button onclick="_aprId='+parseInt(s.id,10)+';render()" style="background:var(--accent-light);color:var(--accent);border:1px solid var(--accent);border-radius:6px;padding:4px 10px;cursor:pointer;font-size:11px;font-weight:700;font-family:\'DM Sans\',sans-serif">'+(apr?'Edit':'Start')+'</button>':'--')+'</td>'
      +'</tr>';
  }).join('');
  return '<div class="card"><div class="card-head"><span class="card-title">📊 Staff Performance Appraisal -- '+year+'</span></div>'
    +'<div style="overflow-x:auto"><table><thead><tr><th>Staff Member</th><th>Avg. Rating</th><th>Action</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>';
}
function gnsiSaveAppraisal(staffId,year){
  if(!currentUser||(['admin','manager'].indexOf(currentUser.role)<0)){
    if(typeof showToast==='function')showToast('🔒 Only admin/manager can submit appraisals','#dc2626');
    return;
  }
  if(currentUser.id===staffId||String(currentUser.id)===String(staffId)){
    if(typeof showToast==='function')showToast('🔒 You cannot appraise yourself','#dc2626');
    return;
  }

  var fields=['teach','discp','duty','punct','team'];
  var vals={};
  for(var i=0;i<fields.length;i++){vals[fields[i]]=(document.getElementById('apr-'+fields[i])||{}).value||'';}
  var remarks=((document.getElementById('apr-remarks')||{}).value||'').trim();
  var appraisals=gnsiAppraisals();
  var idx=appraisals.findIndex(function(a){return a.staffId===staffId&&a.year===year;});
  var rec=Object.assign({staffId:staffId,year:year,remarks:remarks,savedBy:currentUser.name,savedAt:new Date().toISOString()},vals);
  if(idx>=0)appraisals[idx]=rec;else appraisals.push(rec);
  gnsiSaveAppraisals(appraisals);_aprId=null;render();showToast('Appraisal saved','#16a34a');
  if(typeof acLog==='function'){var m=staff.find(function(s){return s.id===staffId;})||{};acLog('Appraisal Saved',m.name+' -- '+year);gnsiActivity('Appraisal Saved',m.name+' '+year,'appraisal');}
}
/* ══════════════════════════════════════════════════════════════
   5. CERTIFICATE GENERATOR  -- Premium v5.0 (Font & Bulk Editor)
══════════════════════════════════════════════════════════════ */
/* -- Inject premium cert CSS once -- */
function _gnsiCertInjectCSS(){
  if(document.getElementById('gnsi-cert-v5-css')) return;
  var st = document.createElement('style');
  st.id = 'gnsi-cert-v5-css';
  st.textContent = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Great+Vibes&family=Tangerine:wght@700&family=Playfair+Display:ital,wght@0,700;0,900;1,400&family=IM+Fell+English:ital@0;1&family=Libre+Baskerville:wght@400;700&family=Crimson+Text:wght@400;600&family=Pinyon+Script&family=Sacramento&family=Alex+Brush&family=Montserrat:wght@300;400;700&family=Raleway:wght@300;400;700&family=Lora:ital,wght@0,400;0,700;1,400&family=EB+Garamond:ital,wght@0,400;0,700;1,400&family=Josefin+Sans:wght@300;400;700&family=Philosopher:ital,wght@0,400;0,700;1,400&display=swap');
/* --- Editor panel --- */
.gnsi-cv5-ep{background:var(--surface);border:0.5px solid var(--border);border-radius:12px;padding:14px 18px;margin-bottom:16px}
.gnsi-cv5-et{font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;margin-bottom:10px;padding-bottom:7px;border-bottom:0.5px solid var(--border)}
.gnsi-cv5-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(195px,1fr));gap:7px 13px}
.gnsi-cv5-fg{display:flex;flex-direction:column;gap:3px}
.gnsi-cv5-fg label{font-size:10.5px;color:var(--muted);font-weight:500;letter-spacing:.04em}
.gnsi-cv5-fg input,.gnsi-cv5-fg select,.gnsi-cv5-fg textarea{font-size:12px;padding:5px 8px;border-radius:6px;border:0.5px solid var(--border);background:var(--bg);color:var(--text);width:100%}
.gnsi-cv5-fg textarea{resize:vertical;min-height:50px}
.gnsi-cv5-fg input[type=color]{padding:2px 4px;height:28px;cursor:pointer}
.gnsi-cv5-fg input[type=file]{font-size:11px;padding:3px 6px}
.gnsi-cv5-fg input[type=number]{width:80px}
.gnsi-cv5-sh{font-size:10.5px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;grid-column:1/-1;margin-top:8px;padding-bottom:3px;border-bottom:0.5px solid var(--border)}
.gnsi-cv5-btnrow{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
.gnsi-cv5-btn{padding:7px 16px;border:none;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;letter-spacing:.04em;font-family:'DM Sans',sans-serif}
.gnsi-cv5-btn-dark{background:#1a1a2e;color:#d4af37}.gnsi-cv5-btn-dark:hover{background:#0d0d1a}
.gnsi-cv5-btn-gold{background:#b8860b;color:#fff8e7}.gnsi-cv5-btn-gold:hover{background:#9a6f09}
.gnsi-cv5-btn-red{background:#8b0000;color:#fff}.gnsi-cv5-btn-red:hover{background:#6b0000}
.gnsi-cv5-tbtn{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--muted);background:var(--surface);border:0.5px solid var(--border);border-radius:6px;padding:5px 12px;cursor:pointer;margin-bottom:8px}
.gnsi-cv5-logo-prev{width:52px;height:52px;object-fit:contain;border:0.5px solid var(--border);border-radius:6px;margin-top:3px;display:none}
.gnsi-cv5-bulk-tbl{width:100%;border-collapse:collapse;font-size:11px;margin-top:8px}
.gnsi-cv5-bulk-tbl th{background:var(--bg);padding:5px 7px;text-align:left;font-size:10px;font-weight:600;color:var(--muted);border:0.5px solid var(--border)}
.gnsi-cv5-bulk-tbl td{padding:5px 7px;border:0.5px solid var(--border);color:var(--text)}
.gnsi-cv5-bulk-tbl tr:nth-child(even) td{background:var(--surface)}
.gnsi-cv5-sbadge{display:inline-block;padding:2px 7px;border-radius:10px;font-size:10px;font-weight:600}
.gnsi-cv5-sb-q{background:#fff8e1;color:#856404}.gnsi-cv5-sb-d{background:#e8f5e9;color:#1b5e20}
.gnsi-cv5-font-row{display:flex;gap:6px;align-items:center}
.gnsi-cv5-font-row select{flex:1}
.gnsi-cv5-font-row input[type=number]{width:62px;flex-shrink:0}
/* tabs */
.gnsi-cv5-tabs{display:flex;gap:2px;margin-bottom:10px;flex-wrap:wrap}
.gnsi-cv5-tab{padding:5px 13px;font-size:11px;font-weight:600;border-radius:6px 6px 0 0;cursor:pointer;border:0.5px solid var(--border);background:var(--bg);color:var(--muted);border-bottom:none}
.gnsi-cv5-tab.active{background:var(--surface);color:var(--text)}
.gnsi-cv5-tab-panel{display:none}.gnsi-cv5-tab-panel.active{display:block}
/* ═ CERTIFICATE ═ */
.gnsi-cv5-cert-wrap{width:100%;max-width:860px;margin:0 auto;background:#1a1207;padding:10px;border-radius:4px}
.gnsi-cv5-cert{width:840px;background:#fffef8;position:relative;overflow:hidden;font-family:'Cormorant Garamond',serif}
.gnsi-cv5-cert-ob{position:absolute;inset:0;border:6px solid #8b6914;z-index:30;pointer-events:none}
.gnsi-cv5-cert-ib{position:absolute;inset:6px;border:1px solid #c9a227;z-index:30;pointer-events:none}
.gnsi-cv5-cert-ib2{position:absolute;inset:10px;border:0.5px solid #d4af37;z-index:30;pointer-events:none}
.gnsi-cv5-cert-corn{position:absolute;width:50px;height:50px;z-index:31;pointer-events:none}
.gnsi-cv5-cert-corn svg{width:50px;height:50px}
.gnsi-cv5-cert-corn.tl{top:4px;left:4px}
.gnsi-cv5-cert-corn.tr{top:4px;right:4px;transform:scaleX(-1)}
.gnsi-cv5-cert-corn.bl{bottom:4px;left:4px;transform:scaleY(-1)}
.gnsi-cv5-cert-corn.br{bottom:4px;right:4px;transform:scale(-1,-1)}
.gnsi-cv5-cert-side-l{position:absolute;left:0;top:0;bottom:0;width:44px;background:#0d1b2a;z-index:5}
.gnsi-cv5-cert-side-r{position:absolute;right:0;top:0;bottom:0;width:44px;background:#0d1b2a;z-index:5}
.gnsi-cv5-cert-side-l::after,.gnsi-cv5-cert-side-r::before{content:'';position:absolute;top:0;bottom:0;width:2px;background:#c9a227}
.gnsi-cv5-cert-side-l::after{right:0}.gnsi-cv5-cert-side-r::before{left:0}
.gnsi-cv5-cert-wm{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-family:'Cinzel',serif;font-size:72px;font-weight:900;color:#1a237e;opacity:.025;pointer-events:none;z-index:2;white-space:nowrap;letter-spacing:.15em}
.gnsi-cv5-cert-body-wrap{margin:0 48px;padding:16px 22px 18px;position:relative;z-index:6;background:#fffef8}
.gnsi-cv5-deco-line{display:flex;align-items:center;gap:0;margin:0 0 9px}
.gnsi-cv5-deco-line-bar{flex:1;height:1px;background:linear-gradient(90deg,transparent,#c9a227,transparent)}
.gnsi-cv5-deco-diamond{width:8px;height:8px;background:#c9a227;transform:rotate(45deg);flex-shrink:0;margin:0 6px}
.gnsi-cv5-cert-logos-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:7px}
.gnsi-cv5-cert-logo-slot{width:64px;height:64px;display:flex;align-items:center;justify-content:center}
.gnsi-cv5-cert-logo-slot img{max-width:64px;max-height:64px;object-fit:contain}
.gnsi-cv5-cert-tagline{text-align:center;font-style:italic;font-weight:300;font-size:13.5px;letter-spacing:.06em;line-height:1.4;margin-bottom:4px}
.gnsi-cv5-cert-instname{text-align:center;font-weight:900;font-size:22px;letter-spacing:.06em;line-height:1.15;margin-bottom:3px}
.gnsi-cv5-cert-address{text-align:center;font-weight:400;font-size:10.5px;letter-spacing:.08em;margin-bottom:7px}
.gnsi-cv5-cert-rib-section{display:flex;align-items:center;justify-content:center;margin-bottom:5px;gap:12px}
.gnsi-cv5-cert-rib-line{flex:1;height:1px;background:linear-gradient(90deg,transparent,#c9a227)}
.gnsi-cv5-cert-rib-line.rev{background:linear-gradient(90deg,#c9a227,transparent)}
.gnsi-cv5-cert-ribbon-badge{padding:7px 32px;font-weight:700;font-size:13px;letter-spacing:.25em;color:#fffef8;clip-path:polygon(12px 0%,calc(100% - 12px) 0%,100% 50%,calc(100% - 12px) 100%,12px 100%,0% 50%)}
.gnsi-cv5-cert-apprec{text-align:center;font-weight:600;font-size:10px;letter-spacing:.22em;color:#2c2c2c;margin-bottom:3px}
.gnsi-cv5-cert-presented{text-align:center;font-size:19px;margin-bottom:5px}
.gnsi-cv5-cert-divider{display:flex;align-items:center;margin:3px 0 5px}
.gnsi-cv5-cert-divider-bar{flex:1;height:0.5px;background:#d4af37}
.gnsi-cv5-cert-divider-dia{width:5px;height:5px;background:#c9a227;transform:rotate(45deg);margin:0 4px;flex-shrink:0}
.gnsi-cv5-cert-para{font-size:11px;color:#1a1a1a;line-height:1.7;text-align:justify;margin-bottom:4px}
.gnsi-cv5-cert-para b{font-weight:700}
.gnsi-cv5-cert-center-para{text-align:center;font-size:11px;color:#1a1a1a;line-height:1.65;margin-bottom:4px}
.gnsi-cv5-cert-center-para b{font-weight:700}
.gnsi-cv5-cert-motto-para{text-align:center;font-style:italic;font-size:10.5px;color:#3a3a3a;line-height:1.6;margin-bottom:8px}
.gnsi-cv5-cert-sigs-row{display:flex;justify-content:space-between;align-items:flex-end;margin-top:4px}
.gnsi-cv5-cert-sig{text-align:center;min-width:160px}
.gnsi-cv5-cert-sig-script{font-weight:700;font-size:28px;color:#1a1a1a;line-height:1;margin-bottom:2px}
.gnsi-cv5-cert-sig-rule{width:130px;margin:0 auto 2px;height:0.5px;background:#333}
.gnsi-cv5-cert-sig-lbl{font-weight:400;font-size:8.5px;color:#333;letter-spacing:.06em}
.gnsi-cv5-cert-bot-deco{display:flex;align-items:center;margin-top:6px}
.gnsi-cv5-cert-bot-bar{flex:1;height:0.5px;background:#c9a227}
.gnsi-cv5-cert-bot-star{font-size:10px;color:#c9a227;margin:0 8px;letter-spacing:.1em}
`;
  document.head.appendChild(st);
}
/* -- Premium cert logo store (session) -- */
var _gcv5Logos = {L:null, C:null, R:null};
/* -- Helpers -- */
function _gcv5g(id){ return document.getElementById(id); }
function _gcv5fv(id){ var el=_gcv5g(id); return el ? el.value : ''; }
function _gcv5fn(id){ return parseInt(_gcv5fv(id))||0; }
function _gcv5hex2dark(hex,amt){
  var r=parseInt(hex.slice(1,3),16),gv=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  r=Math.max(0,r-amt); gv=Math.max(0,gv-amt); b=Math.max(0,b-amt);
  return '#'+r.toString(16).padStart(2,'0')+gv.toString(16).padStart(2,'0')+b.toString(16).padStart(2,'0');
}
function _gcv5SwitchTab(name,el){
  document.querySelectorAll('.gnsi-cv5-tab-panel').forEach(function(p){p.classList.remove('active');});
  document.querySelectorAll('.gnsi-cv5-tab').forEach(function(t){t.classList.remove('active');});
  _gcv5g('gnsi_cv5_tab_'+name).classList.add('active');
  el.classList.add('active');
}
function _gcv5ToggleEd(){
  var p=_gcv5g('gnsiCv5EdPanel'),ic=_gcv5g('gnsiCv5TIcon'),lb=_gcv5g('gnsiCv5TLbl');
  if(p.style.display==='none'){p.style.display='block';ic.textContent='▲';lb.textContent='Hide Editor';}
  else{p.style.display='none';ic.textContent='▼';lb.textContent='Show Editor';}
}
function _gcv5LoadLogo(k,inp){
  if(!inp.files[0]) return;
  var r=new FileReader();
  r.onload=function(e){
    _gcv5Logos[k]=e.target.result;
    var pv=_gcv5g('gnsiCv5PrevLogo'+k);
    if(pv){pv.src=e.target.result;pv.style.display='block';}
    var slot=_gcv5g('gnsiCv5LogoSlot'+k);
    if(slot) slot.innerHTML='<img src="'+e.target.result+'" style="max-width:64px;max-height:64px;object-fit:contain">';
  };
  r.readAsDataURL(inp.files[0]);
}
function _gcv5Update(d){
  var ic=_gcv5fv('gnsiCv5ColInst'),gc=_gcv5fv('gnsiCv5CGold'),rc=_gcv5fv('gnsiCv5ColRib'),sc=_gcv5fv('gnsiCv5CScript'),bc=_gcv5fv('gnsiCv5CBold'),sdc=_gcv5fv('gnsiCv5CSide');
  var data=d||{
    name:_gcv5fv('gnsiCv5FName'),batch:_gcv5fv('gnsiCv5FBatch'),grp:_gcv5fv('gnsiCv5FGrp'),
    exam:_gcv5fv('gnsiCv5FExam'),month:_gcv5fv('gnsiCv5FMonth'),
    marks:_gcv5fv('gnsiCv5FMarks'),outof:_gcv5fv('gnsiCv5FOutof'),
    rank:_gcv5fv('gnsiCv5FRank'),examfull:_gcv5fv('gnsiCv5FExamfull'),
    motto:_gcv5fv('gnsiCv5FMotto'),s1t:_gcv5fv('gnsiCv5FS1t'),s1l:_gcv5fv('gnsiCv5FS1l'),
    s2t:_gcv5fv('gnsiCv5FS2t'),s2l:_gcv5fv('gnsiCv5FS2l')
  };
  var eTag=_gcv5g('gnsiCv5CTag'),eInst=_gcv5g('gnsiCv5CInst'),eAddr=_gcv5g('gnsiCv5CAddr'),
      eRib=_gcv5g('gnsiCv5CRib'),eApprec=_gcv5g('gnsiCv5CApprec'),ePres=_gcv5g('gnsiCv5CPres'),
      eB1=_gcv5g('gnsiCv5CB1'),eHL=_gcv5g('gnsiCv5CHL'),eRec=_gcv5g('gnsiCv5CRec'),
      eS1T=_gcv5g('gnsiCv5CS1T'),eS1L=_gcv5g('gnsiCv5CS1L'),eS2T=_gcv5g('gnsiCv5CS2T'),eS2L=_gcv5g('gnsiCv5CS2L');
  if(!eTag) return;
  eTag.textContent=_gcv5fv('gnsiCv5FTag');
  eTag.style.fontFamily=_gcv5fv('gnsiCv5FnTag'); eTag.style.fontSize=_gcv5fn('gnsiCv5FsTag')+'px'; eTag.style.color=sc;
  eInst.textContent=_gcv5fv('gnsiCv5FInst');
  eInst.style.fontFamily=_gcv5fv('gnsiCv5FnInst'); eInst.style.fontSize=_gcv5fn('gnsiCv5FsInst')+'px'; eInst.style.color=ic;
  eAddr.textContent=_gcv5fv('gnsiCv5FAddr');
  eAddr.style.fontFamily=_gcv5fv('gnsiCv5FnAddr'); eAddr.style.fontSize=_gcv5fn('gnsiCv5FsAddr')+'px'; eAddr.style.color=ic;
  eRib.style.fontFamily=_gcv5fv('gnsiCv5FnRib'); eRib.style.fontSize=_gcv5fn('gnsiCv5FsRib')+'px';
  eRib.style.background='linear-gradient(135deg,'+_gcv5hex2dark(rc,40)+','+rc+','+_gcv5hex2dark(rc,20)+')';
  eApprec.style.fontFamily=_gcv5fv('gnsiCv5FnApprec'); eApprec.style.fontSize=_gcv5fn('gnsiCv5FsApprec')+'px';
  ePres.style.fontFamily=_gcv5fv('gnsiCv5FnPres'); ePres.style.fontSize=_gcv5fn('gnsiCv5FsPres')+'px'; ePres.style.color=sc;
  var bF=_gcv5fv('gnsiCv5FnBody'),bS=_gcv5fn('gnsiCv5FsBody')+'px';
  eB1.style.fontFamily=bF; eB1.style.fontSize=bS;
  eHL.style.fontFamily=bF; eHL.style.fontSize=bS;
  eRec.style.fontFamily=bF; eRec.style.fontSize=bS;
  eB1.innerHTML='Mr./Miss\u00a0<b style="color:'+bc+'">'+esc(data.name)+'</b> of <b style="color:'+bc+'">'+data.batch+'</b> <b style="color:'+bc+'">'+data.grp+'</b> has displayed outstanding academic performance and commendable dedication in the <b style="color:'+bc+'">'+data.exam+'</b>, held in the month of <b style="color:'+bc+'">'+data.month+'</b>.';
  eHL.innerHTML='He / She secured <b style="color:'+bc+'">'+data.marks+' marks out of '+data.outof+'</b> and stood <b style="color:'+bc+'">'+data.rank+' position</b> among all participants in the Pre-Mock Test<br>conducted as part of the <b style="color:'+bc+'">'+data.examfull+'</b>.';
  eRec.innerHTML='This certificate is awarded in recognition of his/her persistent effort, determination, and enthusiasm towards achieving academic goals,<br>and for upholding the ethos of '+(window.TENANT?window.TENANT.name:'this institution')+' \u2014 <em>\u201c'+data.motto+'\u201d</em>';
  var sF=_gcv5fv('gnsiCv5FnSig'),sS=_gcv5fn('gnsiCv5FsSig')+'px';
  var sLF=_gcv5fv('gnsiCv5FnSiglbl'),sLS=_gcv5fn('gnsiCv5FsSiglbl')+'px';
  eS1T.textContent=data.s1t; eS1T.style.fontFamily=sF; eS1T.style.fontSize=sS;
  eS2T.textContent=data.s2t; eS2T.style.fontFamily=sF; eS2T.style.fontSize=sS;
  eS1L.textContent=data.s1l; eS1L.style.fontFamily=sLF; eS1L.style.fontSize=sLS;
  eS2L.textContent=data.s2l; eS2L.style.fontFamily=sLF; eS2L.style.fontSize=sLS;
  var csL=_gcv5g('gnsiCv5CsL'),csR=_gcv5g('gnsiCv5CsR');
  if(csL) csL.style.background=sdc; if(csR) csR.style.background=sdc;
  var cOB=_gcv5g('gnsiCv5COB'),cIB=_gcv5g('gnsiCv5CIB');
  if(cOB) cOB.style.borderColor=gc; if(cIB) cIB.style.borderColor=gc;
}
function _gcv5Snapshot(){
  return {name:_gcv5fv('gnsiCv5FName'),batch:_gcv5fv('gnsiCv5FBatch'),grp:_gcv5fv('gnsiCv5FGrp'),
    exam:_gcv5fv('gnsiCv5FExam'),month:_gcv5fv('gnsiCv5FMonth'),marks:_gcv5fv('gnsiCv5FMarks'),
    outof:_gcv5fv('gnsiCv5FOutof'),rank:_gcv5fv('gnsiCv5FRank'),examfull:_gcv5fv('gnsiCv5FExamfull'),
    motto:_gcv5fv('gnsiCv5FMotto'),s1t:_gcv5fv('gnsiCv5FS1t'),s1l:_gcv5fv('gnsiCv5FS1l'),
    s2t:_gcv5fv('gnsiCv5FS2t'),s2l:_gcv5fv('gnsiCv5FS2l')};
}
function _gcv5ParseBulk(){
  return _gcv5fv('gnsiCv5FBulk').trim().split('\n').filter(function(l){return l.trim();}).map(function(line){
    var p=line.split(',').map(function(x){return x.trim();}),s=_gcv5Snapshot();
    return {name:p[0]||'',batch:p[1]||s.batch,grp:p[2]||s.grp,marks:p[3]||s.marks,outof:s.outof,
      rank:p[4]||s.rank,exam:s.exam,month:s.month,examfull:s.examfull,motto:s.motto,
      s1t:s.s1t,s1l:s.s1l,s2t:s.s2t,s2l:s.s2l};
  });
}
function _gcv5DoBulk(){
  var students=_gcv5ParseBulk();
  if(!students.length){alert('Please enter student data in the Bulk Export tab first.');return;}
  var tb=_gcv5g('gnsiCv5BulkTbody');
  _gcv5g('gnsiCv5BulkStatus').style.display='block'; tb.innerHTML='';
  students.forEach(function(s,i){
    var tr=document.createElement('tr');
    tr.innerHTML='<td>'+(i+1)+'</td><td>'+esc(s.name)+'</td><td>'+esc(s.batch)+'</td><td>'+esc(s.grp)+'</td><td>'+esc(s.marks)+'/'+esc(s.outof)+'</td><td>'+esc(s.rank)+'</td><td><span class="gnsi-cv5-sbadge gnsi-cv5-sb-q" id="gnsiCv5Bs'+i+'">Queued</span></td>';
    tb.appendChild(tr);
  });
  var certEl = _gcv5g('gnsiCv5Cert');
  if (!certEl) { alert('Preview not found.'); return; }
  var orient = _gcv5fv('gnsiCv5Orient') || 'landscape';
  var pgW    = orient === 'portrait' ? '210mm' : '297mm';
  var pgH    = orient === 'portrait' ? '297mm' : '210mm';
    /* Safely extract only the cert-specific stylesheet (avoids cssText backtick/injection bugs) */
  var _certStyleEl = document.getElementById('gnsi-cert-v5-css');
  var styleStr = _certStyleEl ? (_certStyleEl.textContent || '').replace(/`/g, "'") : '';
  var gfLinks = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Great+Vibes&family=Tangerine:wght@700&family=Playfair+Display:ital,wght@0,700;0,900;1,400&family=IM+Fell+English:ital@0;1&family=Libre+Baskerville:wght@400;700&family=Crimson+Text:wght@400;600&family=Pinyon+Script&family=Sacramento&family=Alex+Brush&family=Montserrat:wght@300;400;700&family=Raleway:wght@300;400;700&family=Lora:ital,wght@0,400;0,700;1,400&family=EB+Garamond:ital,wght@0,400;0,700;1,400&family=Josefin+Sans:wght@300;400;700&family=Philosopher:ital,wght@0,400;0,700;1,400&display=swap">';
  /* Clone each student by updating preview then capturing outerHTML */
  var pages = '';
  students.forEach(function(s, i) {
    _gcv5Update(s); /* update preview DOM with this student's data */
    var certW  = certEl.offsetWidth  || 840;
    var certH  = certEl.offsetHeight || 530;
    var scaleX = (orient === 'portrait') ? (794 / certW) : (1122 / certW);
    var scaleY = (orient === 'portrait') ? (1122 / certH) : (794 / certH);
    var scale  = Math.min(scaleX, scaleY, 1.4);
    pages += '<div class="gnsi-print-page" style="transform-scale:'+scale+'">' +
             '<div class="gnsi-print-scaler" style="transform:scale('+scale.toFixed(4)+');transform-origin:center center">' +
             certEl.outerHTML +
             '</div></div>';
    var badge = _gcv5g('gnsiCv5Bs'+i);
    if (badge) { badge.textContent = 'Done'; badge.className = 'gnsi-cv5-sbadge gnsi-cv5-sb-d'; }
  });
  /* Restore preview to original student */
  _gcv5Update();
  var pw = window.open('', '_blank');
  if (!pw) { if(typeof showToast==='function')showToast('⚠ Popup blocked. Allow popups to print.','#d97706'); return; }
  pw.document.open();
  pw.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>GNSI Bulk Certificates</title></head><body></body></html>');
  pw.document.close();
  /* Inject Google Fonts */
  var _lnk = pw.document.createElement('link');
  _lnk.rel = 'stylesheet';
  _lnk.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Great+Vibes&family=Tangerine:wght@700&family=Playfair+Display:ital,wght@0,700;0,900;1,400&family=IM+Fell+English:ital@0;1&family=Libre+Baskerville:wght@400;700&family=Crimson+Text:wght@400;600&family=Pinyon+Script&family=Sacramento&family=Alex+Brush&family=Montserrat:wght@300;400;700&family=Raleway:wght@300;400;700&family=Lora:ital,wght@0,400;0,700;1,400&family=EB+Garamond:ital,wght@0,400;0,700;1,400&family=Josefin+Sans:wght@300;400;700&family=Philosopher:ital,wght@0,400;0,700;1,400&display=swap';
  pw.document.head.appendChild(_lnk);
  /* Inject all styles safely via textContent */
  var _st = pw.document.createElement('style');
  _st.textContent = styleStr +
    'html,body{margin:0;padding:0;background:white;-webkit-print-color-adjust:exact;print-color-adjust:exact;color-adjust:exact}' +
    '@page{size:' + pgW + ' ' + pgH + ';margin:0}' +
    '@media print{html,body{width:' + pgW + ';height:' + pgH + '}}' +
    '.gnsi-print-page{width:' + pgW + ';height:' + pgH + ';display:flex;align-items:center;justify-content:center;background:white;overflow:hidden;page-break-after:always;break-after:page}' +
    '.gnsi-cv5-cert-wrap{background:transparent!important;padding:0!important;border-radius:0!important}';
  pw.document.head.appendChild(_st);
  /* Inject all cert pages via innerHTML */
  pw.document.body.innerHTML = pages;
  setTimeout(function() { pw.focus(); pw.print(); }, 1200);
}
function _gcv5PrintOne(){
  /* ── Clone the live preview DOM directly so export = preview exactly ── */
  _gcv5Update(); /* ensure preview is current */
  var certEl = _gcv5g('gnsiCv5Cert');
  if (!certEl) { alert('Preview not found — click Update Preview first.'); return; }
  var orient  = _gcv5fv('gnsiCv5Orient') || 'landscape';
  var pgW     = orient === 'portrait' ? '210mm' : '297mm';
  var pgH     = orient === 'portrait' ? '297mm' : '210mm';
  var certW   = certEl.offsetWidth  || 840;
  var certH   = certEl.offsetHeight || 530;
    /* Safely extract only the cert-specific stylesheet (avoids cssText backtick/injection bugs) */
  var _certStyleEl = document.getElementById('gnsi-cert-v5-css');
  var styleStr = _certStyleEl ? (_certStyleEl.textContent || '').replace(/`/g, "'") : '';
  var gfLinks = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Great+Vibes&family=Tangerine:wght@700&family=Playfair+Display:ital,wght@0,700;0,900;1,400&family=IM+Fell+English:ital@0;1&family=Libre+Baskerville:wght@400;700&family=Crimson+Text:wght@400;600&family=Pinyon+Script&family=Sacramento&family=Alex+Brush&family=Montserrat:wght@300;400;700&family=Raleway:wght@300;400;700&family=Lora:ital,wght@0,400;0,700;1,400&family=EB+Garamond:ital,wght@0,400;0,700;1,400&family=Josefin+Sans:wght@300;400;700&family=Philosopher:ital,wght@0,400;0,700;1,400&display=swap">';
  /* Clone certificate outerHTML */
  var certHTML = certEl.outerHTML;
  var scaleX = (orient === 'portrait') ? (794 / certW) : (1122 / certW);
  var scaleY = (orient === 'portrait') ? (1122 / certH) : (794 / certH);
  var scale  = Math.min(scaleX, scaleY, 1.4); /* never scale beyond 1.4× */
  var pw = window.open('', '_blank');
  if (!pw) { if(typeof showToast==='function')showToast('⚠ Popup blocked. Allow popups for this page to print.','#d97706'); return; }
  /* Use DOM methods instead of document.write to avoid string-escaping bugs */
  pw.document.open();
  pw.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>GNSI Certificate</title></head><body></body></html>');
  pw.document.close();
  /* Inject Google Fonts */
  var _lnk = pw.document.createElement('link');
  _lnk.rel = 'stylesheet';
  _lnk.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Great+Vibes&family=Tangerine:wght@700&family=Playfair+Display:ital,wght@0,700;0,900;1,400&family=IM+Fell+English:ital@0;1&family=Libre+Baskerville:wght@400;700&family=Crimson+Text:wght@400;600&family=Pinyon+Script&family=Sacramento&family=Alex+Brush&family=Montserrat:wght@300;400;700&family=Raleway:wght@300;400;700&family=Lora:ital,wght@0,400;0,700;1,400&family=EB+Garamond:ital,wght@0,400;0,700;1,400&family=Josefin+Sans:wght@300;400;700&family=Philosopher:ital,wght@0,400;0,700;1,400&display=swap';
  pw.document.head.appendChild(_lnk);
  /* Inject cert CSS via textContent — 100% safe, no escaping needed */
  var _st = pw.document.createElement('style');
  _st.textContent = styleStr +
    'html,body{margin:0;padding:0;background:white;-webkit-print-color-adjust:exact;print-color-adjust:exact;color-adjust:exact}' +
    '@page{size:' + pgW + ' ' + pgH + ';margin:0}' +
    '@media print{html,body{width:' + pgW + ';height:' + pgH + '}}' +
    '.gnsi-print-page{width:' + pgW + ';height:' + pgH + ';display:flex;align-items:center;justify-content:center;background:white;overflow:hidden}' +
    '.gnsi-print-scaler{transform:scale(' + scale.toFixed(4) + ');transform-origin:center center}' +
    '.gnsi-cv5-cert-wrap{background:transparent!important;padding:0!important;border-radius:0!important}';
  pw.document.head.appendChild(_st);
  /* Inject body content via innerHTML — certHTML is safe DOM outerHTML */
  var _wrap = pw.document.createElement('div');
  _wrap.className = 'gnsi-print-page';
  var _scaler = pw.document.createElement('div');
  _scaler.className = 'gnsi-print-scaler';
  _scaler.innerHTML = certHTML;
  _wrap.appendChild(_scaler);
  pw.document.body.appendChild(_wrap);
  /* Wait for fonts then print */
  setTimeout(function() { pw.focus(); pw.print(); }, 1000);
}
function _gcv5BuildHTML(list){
  /* Read orientation */
  var _orient = _gcv5fv('gnsiCv5Orient') || 'landscape';
  var _pgW = _orient==='portrait' ? '210mm' : '297mm';
  var _pgH = _orient==='portrait' ? '297mm' : '210mm';
  /* Read all editor values */
  var ic=_gcv5fv('gnsiCv5ColInst'),gc=_gcv5fv('gnsiCv5CGold'),rc=_gcv5fv('gnsiCv5ColRib'),
      sc=_gcv5fv('gnsiCv5CScript'),bc=_gcv5fv('gnsiCv5CBold'),sdc=_gcv5fv('gnsiCv5CSide');
  var tag=_gcv5fv('gnsiCv5FTag'),inst=_gcv5fv('gnsiCv5FInst'),addr=_gcv5fv('gnsiCv5FAddr');
  var fnInst=_gcv5fv('gnsiCv5FnInst'),  fsInst=_gcv5fn('gnsiCv5FsInst');
  var fnTag=_gcv5fv('gnsiCv5FnTag'),    fsTag=_gcv5fn('gnsiCv5FsTag');
  var fnAddr=_gcv5fv('gnsiCv5FnAddr'),  fsAddr=_gcv5fn('gnsiCv5FsAddr');
  var fnRib=_gcv5fv('gnsiCv5FnRib'),    fsRib=_gcv5fn('gnsiCv5FsRib');
  var fnBody=_gcv5fv('gnsiCv5FnBody'),  fsBody=_gcv5fn('gnsiCv5FsBody');
  var fnPres=_gcv5fv('gnsiCv5FnPres'),  fsPres=_gcv5fn('gnsiCv5FsPres');
  var fnApprec=_gcv5fv('gnsiCv5FnApprec'),fsApprec=_gcv5fn('gnsiCv5FsApprec');
  var fnSig=_gcv5fv('gnsiCv5FnSig'),    fsSig=_gcv5fn('gnsiCv5FsSig');
  var fnSigLbl=_gcv5fv('gnsiCv5FnSiglbl'),fsSigLbl=_gcv5fn('gnsiCv5FsSiglbl');
  var dk=_gcv5hex2dark;
  var ribBg='linear-gradient(135deg,'+dk(rc,40)+','+rc+','+dk(rc,20)+')';
  function logoHTML(slot, w, h) {
    if (_gcv5Logos[slot]) return '<img src="'+_gcv5Logos[slot]+'" style="max-width:'+w+'px;max-height:'+h+'px;object-fit:contain">';
    if (slot==='L') return '<svg width="'+w+'" height="'+h+'" viewBox="0 0 100 100"><circle cx="50" cy="50" r="47" fill="#fff8e1" stroke="'+gc+'" stroke-width="1.5"/><text x="50" y="22" text-anchor="middle" font-size="8" fill="'+ic+'" font-weight="700" font-family="Cinzel,serif">KNOWLEDGE</text><text x="50" y="56" text-anchor="middle" font-size="26" font-family="serif">&#127795;</text><text x="50" y="70" text-anchor="middle" font-size="10" fill="'+rc+'" font-weight="700" font-family="Cinzel,serif">GNSI</text><text x="50" y="80" text-anchor="middle" font-size="7.5" fill="#555" font-family="serif">Est. 2016</text></svg>';
    if (slot==='C') return '<svg width="'+w+'" height="'+h+'" viewBox="0 0 100 105"><rect width="100" height="105" rx="6" fill="'+ic+'"/><rect x="2" y="2" width="96" height="101" rx="5" fill="none" stroke="'+gc+'" stroke-width="1"/><text x="50" y="22" text-anchor="middle" font-size="8.5" fill="'+gc+'" font-weight="700" font-family="Cinzel,serif">GUIDANCE</text><text x="50" y="55" text-anchor="middle" font-size="22" font-family="serif">&#9875;</text><text x="50" y="72" text-anchor="middle" font-size="6.5" fill="'+gc+'" font-family="Cinzel,serif">NAVODAYA &amp; SAINIK</text><text x="50" y="85" text-anchor="middle" font-size="6" fill="#a08030" font-family="Cinzel,serif">INSTITUTE</text></svg>';
    return '<svg width="'+w+'" height="'+h+'" viewBox="0 0 100 100"><circle cx="50" cy="50" r="47" fill="#fff8e1" stroke="'+gc+'" stroke-width="1.5"/><text x="50" y="30" text-anchor="middle" font-size="30" font-weight="900" fill="'+rc+'" font-family="Cinzel,serif">9</text><text x="50" y="46" text-anchor="middle" font-size="8" fill="'+ic+'" font-weight="700" font-family="Cinzel,serif">YEARS OF</text><text x="50" y="58" text-anchor="middle" font-size="8" fill="'+ic+'" font-family="Cinzel,serif">SERVICE</text><rect x="16" y="64" width="68" height="15" rx="2" fill="'+rc+'"/><text x="50" y="74" text-anchor="middle" font-size="7.5" fill="#fff8e7" font-family="Cinzel,serif">EXCELLENCE</text></svg>';
  }
  var cornSVG = '<svg viewBox="0 0 50 50" fill="none"><path d="M4 4L20 4L20 7L7 7L7 20L4 20Z" fill="'+gc+'"/><circle cx="4" cy="4" r="3" fill="'+gc+'"/><path d="M12 12L22 12L22 14L14 14L14 22L12 22Z" fill="'+gc+'" opacity=".5"/></svg>';
  var pages = '';
  list.forEach(function(d) {
    var certHTML = ''
      + '<div class="p-cert">'
      + '<div class="p-csl" style="background:'+sdc+'"><div class="p-csl-r" style="background:'+gc+'"></div></div>'
      + '<div class="p-csr" style="background:'+sdc+'"><div class="p-csr-r" style="background:'+gc+'"></div></div>'
      + '<div class="p-ob" style="border-color:'+gc+'"></div>'
      + '<div class="p-ib" style="border-color:'+gc+'"></div>'
      + '<div class="p-ib2" style="border-color:'+gc+'"></div>'
      + '<div class="p-corn p-tl">'+cornSVG+'</div>'
      + '<div class="p-corn p-tr">'+cornSVG+'</div>'
      + '<div class="p-corn p-bl">'+cornSVG+'</div>'
      + '<div class="p-corn p-br">'+cornSVG+'</div>'
      + '<div class="p-wm">GNSI</div>'
      + '<div class="p-cb">'
        + '<div class="p-dl"><div class="p-db" style="background:linear-gradient(90deg,transparent,'+gc+',transparent)"></div><div class="p-dd" style="background:'+gc+'"></div><div class="p-db" style="background:linear-gradient(90deg,'+gc+',transparent,'+gc+')"></div><div class="p-dd" style="background:'+gc+'"></div><div class="p-db" style="background:linear-gradient(90deg,transparent,'+gc+',transparent)"></div></div>'
        + '<div class="p-lr"><div class="p-ls">'+logoHTML('L',64,64)+'</div><div style="text-align:center"><div class="p-ls" style="margin:0 auto">'+logoHTML('C',58,64)+'</div></div><div class="p-ls">'+logoHTML('R',64,64)+'</div></div>'
        + '<div style="text-align:center;font-family:'+fnTag+';font-size:'+fsTag+'pt;font-style:italic;font-weight:300;letter-spacing:.06em;line-height:1.4;margin-bottom:4px;color:'+sc+'">' +_gcv5esc(tag)+'</div>'
        + '<div style="text-align:center;font-family:'+fnInst+';font-size:'+fsInst+'pt;font-weight:900;letter-spacing:.06em;line-height:1.15;margin-bottom:3px;color:'+ic+'">' +_gcv5esc(inst)+'</div>'
        + '<div style="text-align:center;font-family:'+fnAddr+';font-size:'+fsAddr+'pt;letter-spacing:.08em;margin-bottom:7px;color:'+ic+'">' +_gcv5esc(addr)+'</div>'
        + '<div style="display:flex;align-items:center;justify-content:center;margin-bottom:5px;gap:12px">'
          + '<div style="flex:1;height:1px;background:linear-gradient(90deg,transparent,'+gc+')"></div>'
          + '<div style="padding:7px 32px;font-family:'+fnRib+';font-size:'+fsRib+'pt;font-weight:700;letter-spacing:.25em;color:#fffef8;background:'+ribBg+';clip-path:polygon(12px 0%,calc(100% - 12px) 0%,100% 50%,calc(100% - 12px) 100%,12px 100%,0% 50%)">CERTIFICATE</div>'
          + '<div style="flex:1;height:1px;background:linear-gradient(90deg,'+gc+',transparent)"></div>'
        + '</div>'
        + '<div style="text-align:center;font-family:'+fnApprec+';font-size:'+fsApprec+'pt;font-weight:600;letter-spacing:.22em;color:#2c2c2c;margin-bottom:3px">OF APPRECIATION</div>'
        + '<div style="text-align:center;font-family:'+fnPres+';font-size:'+fsPres+'pt;color:'+sc+';margin-bottom:5px">This Certificate is proudly presented to</div>'
        + '<div class="p-divd"><div class="p-ddb" style="background:'+gc+'"></div><div class="p-ddd" style="background:'+gc+'"></div><div class="p-ddb" style="background:'+gc+'"></div><div class="p-ddd" style="background:'+gc+'"></div><div class="p-ddb" style="background:'+gc+'"></div></div>'
        + '<p style="font-family:'+fnBody+';font-size:'+fsBody+'pt;color:#1a1a1a;line-height:1.7;text-align:justify;margin-bottom:4px">Mr./Miss\u00a0<b style="color:'+bc+'">'+_gcv5esc(d.name)+'</b> of <b style="color:'+bc+'">'+_gcv5esc(d.batch)+'</b> <b style="color:'+bc+'">'+_gcv5esc(d.grp)+'</b> has displayed outstanding academic performance and commendable dedication in the <b style="color:'+bc+'">'+_gcv5esc(d.exam)+'</b>, held in the month of <b style="color:'+bc+'">'+_gcv5esc(d.month)+'</b>.</p>'
        + '<p style="font-family:'+fnBody+';font-size:'+fsBody+'pt;color:#1a1a1a;text-align:center;line-height:1.65;margin-bottom:4px">He / She secured <b style="color:'+bc+'">'+_gcv5esc(d.marks)+' marks out of '+_gcv5esc(d.outof)+'</b> and stood <b style="color:'+bc+'">'+_gcv5esc(d.rank)+' position</b> among all participants<br>conducted as part of the <b style="color:'+bc+'">'+_gcv5esc(d.examfull)+'</b>.</p>'
        + '<p style="font-family:'+fnBody+';font-size:'+fsBody+'pt;font-style:italic;color:#3a3a3a;text-align:center;line-height:1.55;margin-bottom:8px">This certificate is awarded in recognition of his/her persistent effort, determination, and enthusiasm towards achieving academic goals,<br>and for upholding the ethos of '+(window.TENANT?window.TENANT.name:'this institution')+' \u2014 <em>\u201c'+_gcv5esc(d.motto)+'\u201d</em></p>'
        + '<div style="display:flex;align-items:center;margin-top:6px"><div style="flex:1;height:0.5px;background:'+gc+'"></div><span style="color:'+gc+';font-size:10px;margin:0 8px;letter-spacing:.1em">&#10022; &nbsp; &#10022; &nbsp; &#10022;</span><div style="flex:1;height:0.5px;background:'+gc+'"></div></div>'
        + '<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:4px">'
          + '<div style="text-align:center;min-width:160px"><div style="font-family:'+fnSig+';font-size:'+fsSig+'pt;color:#1a1a1a;line-height:1;margin-bottom:2px">'+_gcv5esc(d.s1t)+'</div><div style="width:130px;margin:0 auto 2px;height:0.5px;background:#333"></div><div style="font-family:'+fnSigLbl+';font-size:'+fsSigLbl+'pt;color:#333;letter-spacing:.06em">'+_gcv5esc(d.s1l)+'</div></div>'
          + '<div style="text-align:center;min-width:160px"><div style="font-family:'+fnSig+';font-size:'+fsSig+'pt;color:#1a1a1a;line-height:1;margin-bottom:2px">'+_gcv5esc(d.s2t)+'</div><div style="width:130px;margin:0 auto 2px;height:0.5px;background:#333"></div><div style="font-family:'+fnSigLbl+';font-size:'+fsSigLbl+'pt;color:#333;letter-spacing:.06em">'+_gcv5esc(d.s2l)+'</div></div>'
        + '</div>'
      + '</div>'
      + '</div>';
    pages += '<div class="p-page">'+certHTML+'</div>';
  });
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>GNSI Certificate</title>'
    + '<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Great+Vibes&family=Tangerine:wght@700&family=Playfair+Display:ital,wght@0,700;0,900;1,400&family=IM+Fell+English:ital@0;1&family=Libre+Baskerville:wght@400;700&family=Crimson+Text:wght@400;600&family=Pinyon+Script&family=Sacramento&family=Alex+Brush&family=Montserrat:wght@300;400;700&family=Raleway:wght@300;400;700&family=Lora:ital,wght@0,400;0,700;1,400&family=EB+Garamond:ital,wght@0,400;0,700;1,400&family=Josefin+Sans:wght@300;400;700&family=Philosopher:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">'
    + '<style>'
    + '*{box-sizing:border-box;margin:0;padding:0}'
    /* Force backgrounds to print */
    + 'body{margin:0;padding:0;background:white;-webkit-print-color-adjust:exact;print-color-adjust:exact;color-adjust:exact}'
    /* ── PAGE SIZE ───────────────────────────────────────────────────────
       We use A4 LANDSCAPE as default. Each .p-page is exactly the page.
       The .p-cert is sized with mm units to fill the page completely.
       ─────────────────────────────────────────────────────────────────── */
    + '@page{size:'+_pgW+' '+_pgH+';margin:0}'
    + '@media print{'
    +   'html,body{width:'+_pgW+';height:'+_pgH+'}'
    +   '.p-page{page-break-after:always;break-after:page;page-break-inside:avoid}'
    + '}'
    /* Page wrapper: exactly A4 landscape */
    + '.p-page{'
    +   'width:'+_pgW+';height:'+_pgH+';'
    +   'position:relative;overflow:hidden;'
    +   'background:white;'
    + '}'
    /* Cert fills the page completely via absolute positioning */
    + '.p-cert{'
    +   'position:absolute;inset:0;'          /* fills 297mm × 210mm exactly */
    +   'background:#fffef8;'
    +   'overflow:hidden;'
    +   'font-family:\'Cormorant Garamond\',serif;'
    + '}'
    /* Side panels — use mm units matching the page */
    + '.p-csl{position:absolute;left:0;top:0;bottom:0;width:11mm;z-index:5}'
    + '.p-csl-r{position:absolute;top:0;bottom:0;right:0;width:0.5mm}'
    + '.p-csr{position:absolute;right:0;top:0;bottom:0;width:11mm;z-index:5}'
    + '.p-csr-r{position:absolute;top:0;bottom:0;left:0;width:0.5mm}'
    /* Borders */
    + '.p-ob{position:absolute;inset:0;border:5mm solid;z-index:30;pointer-events:none}'
    + '.p-ib{position:absolute;inset:5mm;border:0.4mm solid;z-index:30;pointer-events:none}'
    + '.p-ib2{position:absolute;inset:7mm;border:0.2mm solid;z-index:30;pointer-events:none}'
    /* Corner ornaments — SVG, sized in mm */
    + '.p-corn{position:absolute;width:13mm;height:13mm;z-index:32;pointer-events:none}'
    + '.p-corn svg{width:13mm;height:13mm}'
    + '.p-tl{top:4mm;left:4mm}.p-tr{top:4mm;right:4mm;transform:scaleX(-1)}'
    + '.p-bl{bottom:4mm;left:4mm;transform:scaleY(-1)}.p-br{bottom:4mm;right:4mm;transform:scale(-1,-1)}'
    /* Watermark */
    + '.p-wm{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-family:\'Cinzel\',serif;font-size:38mm;font-weight:900;color:#1a237e;opacity:.025;pointer-events:none;z-index:2;white-space:nowrap;letter-spacing:.15em}'
    /* Body content area — margin from side panels, fill remaining width */
    + '.p-cb{margin:0 13mm;padding:3.5mm 5mm 3mm;position:relative;z-index:6;background:#fffef8;height:100%;overflow:hidden}'
    /* Deco line */
    + '.p-dl{display:flex;align-items:center;gap:0;margin:0 0 2mm}'
    + '.p-db{flex:1;height:0.3mm}'
    + '.p-dd{width:2mm;height:2mm;transform:rotate(45deg);flex-shrink:0;margin:0 1.5mm}'
    /* Logos */
    + '.p-lr{display:flex;align-items:center;justify-content:space-between;margin-bottom:2mm}'
    + '.p-ls{width:17mm;height:17mm;display:flex;align-items:center;justify-content:center}'
    + '.p-ls img{max-width:17mm;max-height:17mm;object-fit:contain}'
    /* Divider */
    + '.p-divd{display:flex;align-items:center;margin:1mm 0 1.5mm}'
    + '.p-ddb{flex:1;height:0.2mm}.p-ddd{width:1.5mm;height:1.5mm;transform:rotate(45deg);margin:0 1mm;flex-shrink:0}'
    /* Screen preview — show scaled-down representation */
    + '@media screen{'
    +   'body{background:#222;padding:20px}'
    +   '.p-page{margin:0 auto 20px;transform-origin:top left}'
    +   '.p-page::before{content:"⚠ Screen preview — actual PDF will fill A4 landscape exactly";display:block;background:#1433a8;color:white;padding:6px 12px;font-family:sans-serif;font-size:11px;margin-bottom:8px;border-radius:4px}'
    + '}'
    + '</style>'
    + '</head><body>'
    + pages
    + '</body></html>';
}
/* HTML-escape helper used by _gcv5BuildHTML */
function _gcv5esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
/* -- renderCertificate -- main portal page -- */
function renderGrievance(){
  var isAdmin=(typeof currentUser!=='undefined'&&currentUser&&(currentUser.role==='admin'||currentUser.role==='manager'));
  var records=gnsiLoad('gnsi_grievances')||[];
  var staffList=(gnsiLoad('gnsi_staff')||[]);
  if(!staffList.length) staffList=(typeof STAFF_INIT!=='undefined'?STAFF_INIT:[]);
  var prioColor={High:'#dc2626',Medium:'#d97706',Low:'#16a34a'};
  var statusColor={Open:'#dc2626','In Progress':'#d97706',Resolved:'#16a34a',Closed:'#64748b'};
  var tabs=['open','in progress','resolved','all'];
  var filtered=records.filter(function(r){
    var tMatch=_grvTab==='all'||(r.status||'Open').toLowerCase()===_grvTab;
    var qMatch=!_grvSearch||(r.title+r.filedBy+r.desc+r.cat).toLowerCase().indexOf(_grvSearch.toLowerCase())!==-1;
    return tMatch&&qMatch;
  });
  var open=records.filter(function(r){return r.status==='Open';}).length;
  var inprog=records.filter(function(r){return r.status==='In Progress';}).length;
  var resolved=records.filter(function(r){return r.status==='Resolved'||r.status==='Closed';}).length;
  var formHtml='';
  if(_grvForm){
    var ed=_grvEdit?records.find(function(r){return r.id===_grvEdit;}):null;
    var staffOpts=staffList.filter(function(s){return (s.status||'Active').toLowerCase()==='active';}).map(function(s){return '<option value="'+esc(s.name)+'"'+(ed&&ed.filedBy===s.name?' selected':'')+'>'+esc(s.name)+'</option>';}).join('');
    formHtml='<div style="background:var(--surface);border:1.5px solid #dc2626;border-radius:14px;padding:22px;margin-bottom:20px">'
      +'<div style="font-family:\'Playfair Display\',serif;font-size:15px;font-weight:700;color:var(--text);margin-bottom:16px">'+(ed?'✏️ Edit Grievance':'📋 Lodge Grievance')+'</div>'
      +'<div class="form-grid g2" style="margin-bottom:14px">'
      +'<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Subject / Title *</label><input id="grv-title" type="text" value="'+(ed?esc(ed.title):'')+'" placeholder="Brief description of grievance" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif;box-sizing:border-box"></div>'
      +'<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Filed By *</label><select id="grv-filed" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif"><option value="">-- Select --</option>'+staffOpts+'</select></div>'
      +'<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Category</label><select id="grv-cat" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif">'+_GRV_CATS.map(function(c){return '<option'+(ed&&ed.cat===c?' selected':'')+'>'+c+'</option>';}).join('')+'</select></div>'
      +'<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Priority</label><select id="grv-prio" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif">'+_GRV_PRIO.map(function(p){return '<option'+(ed&&ed.prio===p?' selected':'')+'>'+p+'</option>';}).join('')+'</select></div>'
      +'<div style="grid-column:1/-1"><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Grievance Against (optional)</label><input id="grv-against" type="text" value="'+(ed?esc(ed.against):'')+'" placeholder="Person, dept, or system involved" style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif;box-sizing:border-box"></div>'
      +'</div>'
      +'<div style="margin-bottom:16px"><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:5px">Detailed Description</label><textarea id="grv-desc" rows="3" placeholder="Describe the issue in detail..." style="width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif;resize:vertical;box-sizing:border-box">'+(ed?esc(ed.desc):'')+'</textarea></div>'
      +'<div style="display:flex;gap:10px"><button onclick="grvSave()" style="padding:9px 20px;border-radius:9px;background:#dc2626;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">Submit Grievance</button>'
      +'<button onclick="grvCloseForm()" style="padding:9px 16px;border-radius:9px;border:1.5px solid var(--border);background:var(--surface);color:var(--muted);font-size:13px;cursor:pointer;font-family:\'DM Sans\',sans-serif">Cancel</button></div></div>';
  }
  var cards='';
  if(!filtered.length){
    cards='<div style="padding:40px;text-align:center;color:var(--muted);font-size:13px">No grievances found.</div>';
  } else {
    cards=filtered.map(function(r){
      var sc=statusColor[r.status]||'#64748b';
      var pc=prioColor[r.prio]||'#64748b';
      return '<div style="background:var(--surface);border:1.5px solid var(--border);border-left:4px solid '+pc+';border-radius:12px;padding:16px 18px">'
        +'<div style="display:flex;align-items:flex-start;gap:10px;flex-wrap:wrap;margin-bottom:8px">'
        +'<div style="flex:1;min-width:0">'
        +'<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">'
        +'<div style="font-size:14px;font-weight:700;color:var(--text)">'+esc(r.title)+'</div>'
        +'<div style="font-size:10px;font-weight:700;color:'+pc+';background:'+pc+'18;border-radius:5px;padding:2px 7px">'+esc(r.prio)+'</div>'
        +'<div style="font-size:10px;font-weight:700;color:'+sc+';background:'+sc+'18;border-radius:5px;padding:2px 7px">'+esc(r.status)+'</div>'
        +'<div style="font-size:10px;color:var(--muted);background:var(--bg);border-radius:5px;padding:2px 7px;border:1px solid var(--border)">'+esc(r.cat)+'</div>'
        +'</div>'
        +'<div style="font-size:12px;color:var(--muted)">Filed by <b>'+esc(r.filedBy)+'</b> on '+esc(r.filedOn)+(r.against?' &nbsp;·&nbsp; Against: <b>'+esc(r.against)+'</b>':'')+'</div>'
        +(r.desc?'<div style="font-size:12.5px;color:var(--text);margin-top:6px;line-height:1.55;background:var(--bg);border-radius:7px;padding:7px 10px">'+esc(r.desc)+'</div>':'')
        +'</div>'
        +'<div style="display:flex;flex-direction:column;gap:5px;align-items:flex-end;flex-shrink:0">'
        +(isAdmin&&r.status==='Open'?'<button onclick="grvUpdateStatus(\''+parseInt(r.id,10)+'\',\'In Progress\')" style="padding:4px 10px;border-radius:7px;background:#fef3c7;color:#d97706;border:1px solid #fde68a;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap">→ In Progress</button>':'')
        +(isAdmin&&(r.status==='Open'||r.status==='In Progress')?'<button onclick="grvUpdateStatus(\''+parseInt(r.id,10)+'\',\'Resolved\')" style="padding:4px 10px;border-radius:7px;background:#dcfce7;color:#16a34a;border:1px solid #86efac;font-size:11px;font-weight:700;cursor:pointer">✓ Resolve</button>':'')
        +(isAdmin?'<button onclick="grvOpenForm(\''+parseInt(r.id,10)+'\')" style="padding:4px 9px;border-radius:7px;border:1.5px solid var(--border);background:var(--surface);font-size:11px;cursor:pointer">✏️</button>':'')
        +(isAdmin?'<button onclick="grvDelete(\''+parseInt(r.id,10)+'\')" style="padding:4px 9px;border-radius:7px;border:1.5px solid #fee2e2;background:#fff1f2;color:#ef4444;font-size:11px;cursor:pointer">🗑</button>':'')
        +'</div></div>'
        +(r.status==='Resolved'||r.status==='Closed'?'<div style="font-size:12px;color:#16a34a;margin-top:4px">✅ Resolved on '+esc(r.resolvedOn)+'</div>':'')
        +'<div style="display:flex;gap:8px;align-items:center;margin-top:8px">'
        +'<input id="grv-res-'+parseInt(r.id,10)+'" type="text" placeholder="Resolution notes / action taken..." value="'+esc(r.resolution||'')+'" style="flex:1;padding:6px 10px;border-radius:7px;border:1px solid var(--border);background:var(--bg);font-size:12px;color:var(--text);font-family:\'DM Sans\',sans-serif">'
        +'<button onclick="grvSaveResolution(\''+parseInt(r.id,10)+'\')" style="padding:6px 12px;border-radius:7px;background:var(--bg);border:1.5px solid var(--border);color:var(--text);font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap">Save</button>'
        +'</div></div>';
    }).join('');
  }
  return '<div style="padding:8px 0 32px">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:18px">'
    +'<div><div style="font-family:\'Playfair Display\',serif;font-size:22px;font-weight:800;color:var(--text)">📋 Grievance Register</div>'
    +'<div style="font-size:12.5px;color:var(--muted);margin-top:3px">'+(open>0?'<span style="color:#dc2626;font-weight:700">'+open+' open</span>':'0 open')+' &nbsp;·&nbsp; '+inprog+' in progress &nbsp;·&nbsp; '+resolved+' resolved</div></div>'
    +(!_grvForm?'<button onclick="grvOpenForm()" style="padding:8px 18px;border-radius:9px;background:#dc2626;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">📋 Lodge Grievance</button>':'')
    +'</div>'+formHtml
    +'<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:16px">'
    +tabs.map(function(t){var a=t===_grvTab;return '<button onclick="_grvTab=\''+t+'\';navigate(\'grievance\')" style="padding:6px 16px;border-radius:20px;border:1.5px solid '+(a?'#1433a8':'var(--border)')+';background:'+(a?'#1433a8':'var(--surface)')+';color:'+(a?'#fff':'var(--muted)')+';font-size:12px;font-weight:700;cursor:pointer;text-transform:capitalize">'+t+'</button>';}).join('')
    +'<input value="'+esc(_grvSearch)+'" oninput="_grvSearch=this.value;navigate(\'grievance\')" placeholder="🔍 Search..." style="flex:1;min-width:160px;padding:7px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--surface);font-size:13px;color:var(--text);font-family:\'DM Sans\',sans-serif;margin-left:8px">'
    +'</div>'
    +'<div style="display:flex;flex-direction:column;gap:10px">'+cards+'</div>'
    +'</div>';
}
/* ══════════════════════════════════════════════════════════════════
   TEACHER DIARY
   ══════════════════════════════════════════════════════════════════ */
var _diaryTab='myentries', _diaryForm=false, _diaryEdit=null, _diaryViewDate='', _diaryFilterTeacher='';
var _DIARY_SUBJECTS=['Mathematics','Science','English','Hindi','Social Studies','Computer Science','Reasoning','GK','Meitei Mayek','Mental Ability','Vocabulary','Grammar','Physical Education','General','Other'];
var _DIARY_PERIODS=['Period 1','Period 2','Period 3','Period 4','Period 5','Period 6','Period 7','Period 8','Free Period'];
function diaryOpenForm(id){
  _diaryEdit=id||null;
  _diaryForm=true;
  navigate('diary');
}
function diaryCloseForm(){ _diaryForm=false; _diaryEdit=null; navigate('diary'); }
function diarySave(){
  var date=document.getElementById('dy-date').value;
  var period=document.getElementById('dy-period').value;
  var subject=document.getElementById('dy-subject').value;
  var cls=document.getElementById('dy-class').value.trim();
  var topic=document.getElementById('dy-topic').value.trim();
  var activities=document.getElementById('dy-activities').value.trim();
  var homework=document.getElementById('dy-homework').value.trim();
  var notes=document.getElementById('dy-notes').value.trim();
  if(!date||!topic){ alert('Date and topic are required.'); return; }
  var teacher=(typeof currentUser!=='undefined'&&currentUser&&currentUser.name)?currentUser.name:'Unknown';
  var entries=gnsiLoad('gnsi_diary')||[];
  var rec={id:_diaryEdit||('dy'+Date.now()),date:date,period:period,subject:subject,cls:cls,topic:topic,activities:activities,homework:homework,notes:notes,teacher:teacher,createdAt:new Date().toISOString()};
  if(_diaryEdit){
    var ex=entries.find(function(e){return e.id===_diaryEdit;})||{};
    rec.teacher=ex.teacher||teacher;
    rec.createdAt=ex.createdAt||rec.createdAt;
    entries=entries.map(function(e){return e.id===_diaryEdit?rec:e;});
  } else {
    entries.unshift(rec);
  }
  gnsiSave('gnsi_diary', entries);
  _diaryForm=false; _diaryEdit=null;
  navigate('diary');
}
function diaryDelete(id){
  if(!confirm('Delete this diary entry?')) return;
  gnsiSave('gnsi_diary', (gnsiLoad('gnsi_diary')||[]).filter(function(e){return e.id!==id;}));
  navigate('diary');
}
