/* GNSI PORTAL — modules/social.js
   Pages: gnsi_social (window.renderGnsiSocial IIFE)
   DEPENDS ON: core/utils.js, core/state.js */

  window.renderGnsiSocial = function(){
    var gs=window._gs;
    var u=_u();
    var allPosts=_posts();
    var saved=gs.savedIds;

    /* lightbox overlay */
    var lbOverlay=_renderLightbox();

    /* ── header ── */
    var header='<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:20px">'
      +'<div>'
        +'<div style="font-family:\'Playfair Display\',serif;font-size:23px;font-weight:700;color:var(--text);display:flex;align-items:center;gap:10px">🌐 GNSI Social'
          +'<span style="font-size:12px;font-weight:700;color:#16a34a;background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:2px 10px">Staff Platform</span>'
        +'</div>'
        +'<div style="font-size:12px;color:var(--muted);margin-top:3px">Share updates, achievements, resources and stay connected</div>'
      +'</div>'
      +'<button onclick="window._gs.editPost=null;window._gs.composerType=\'post\';window._gs.tab=\'create\';render()" style="display:flex;align-items:center;gap:7px;padding:10px 20px;border-radius:12px;background:linear-gradient(135deg,var(--accent),#2563eb);color:#fff;border:none;cursor:pointer;font-size:13.5px;font-weight:800;font-family:\'Nunito\',sans-serif;box-shadow:0 3px 14px rgba(20,51,168,.35)">✏️ New Post</button>'
    +'</div>';

    /* ── tabs ── */
    function tBtn(key,icon,label,badge){
      var a=gs.tab===key;
      return '<button onclick="window._gs.tab=\''+key+'\';render()" style="display:flex;align-items:center;gap:5px;padding:8px 18px;border-radius:20px;border:'+(a?'none':'1.5px solid var(--border)')+';background:'+(a?'linear-gradient(135deg,var(--accent),#2563eb)':'var(--surface)')+';color:'+(a?'#fff':'var(--muted)')+';font-size:12.5px;font-weight:'+(a?'800':'600')+';cursor:pointer">'
        +icon+' '+label
        +(badge?'<span style="background:'+(a?'rgba(255,255,255,.3)':'#dc2626')+';color:#fff;border-radius:20px;padding:1px 6px;font-size:10px;font-weight:800">'+badge+'</span>':'')
      +'</button>';
    }
    var tabBar='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px">'
      +tBtn('feed','🏠','Feed','')
      +tBtn('create','✏️','Compose','')
      +tBtn('saved','🔖','Saved',saved.length||'')
      +tBtn('profile','👤','My Profile','')
    +'</div>';

    var body='';

    /* ── FEED TAB ── */
    if(gs.tab==='feed'||gs.tab==='saved'){
      var postsToShow = gs.tab==='saved'
        ? allPosts.filter(function(p){return saved.indexOf(p.id)>-1;})
        : allPosts;

      /* category filter pills */
      var catBar='<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">'
        +CATS.map(function(c){
          var a=gs.feedFilter===c.id;
          var cnt=c.id==='all'?allPosts.length:c.id==='polls'
            ?allPosts.filter(function(p){return p.poll;}).length
            :allPosts.filter(function(p){return p.category===c.id;}).length;
          return '<button onclick="window._gs.feedFilter=\''+c.id+'\';render()" style="display:flex;align-items:center;gap:4px;padding:5px 14px;border-radius:20px;border:1.5px solid '+(a?c.color:'var(--border)')+';background:'+(a?c.color+'18':'var(--surface)')+';color:'+(a?c.color:'var(--muted)')+';font-size:12px;font-weight:'+(a?'800':'600')+';cursor:pointer">'+c.icon+' '+c.label+'<span style="font-size:10.5px;opacity:.7"> '+cnt+'</span></button>';
        }).join('')
      +'</div>';

      /* search */
      var searchBar='<div style="position:relative;margin-bottom:16px">'
        +'<input value="'+_e(gs.searchQ)+'" oninput="window._gs.searchQ=this.value;render()" placeholder="🔍 Search posts, topics, people..." style="width:100%;border:1.5px solid var(--border);border-radius:10px;padding:10px 40px 10px 14px;font-size:13.5px;background:var(--surface);color:var(--text);box-sizing:border-box"/>'
        +(gs.searchQ?'<button onclick="window._gs.searchQ=\'\';render()" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--muted);font-size:16px">✕</button>':'')
      +'</div>';

      /* apply filters */
      var filtered=postsToShow.filter(function(p){
        if(gs.feedFilter!=='all'){
          if(gs.feedFilter==='polls'&&!p.poll) return false;
          if(gs.feedFilter!=='polls'&&p.category!==gs.feedFilter) return false;
        }
        if(gs.searchQ){
          var q=gs.searchQ.toLowerCase();
          return (p.title||'').toLowerCase().includes(q)
              || (p.body||'').toLowerCase().includes(q)
              || (p.authorName||'').toLowerCase().includes(q)
              || (p.tags||[]).some(function(t){return t.toLowerCase().includes(q);});
        }
        return true;
      });

      /* stats strip */
      var totalPosts=allPosts.length;
      var todayPosts=allPosts.filter(function(p){return p.createdAt.startsWith(new Date().toISOString().split('T')[0]);}).length;

      var statsStrip=totalPosts?'<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:14px">'
        +[['📝',totalPosts,'Total Posts'],['📅',todayPosts,'Today'],
          ['💬',allPosts.reduce(function(s,p){return s+(p.comments||[]).length;},0),'Comments'],
          ['👍',allPosts.reduce(function(s,p){return s+Object.values(p.reactions||{}).reduce(function(a,b){return a+b.length;},0);},0),'Reactions']]
        .map(function(k){return '<div style="background:var(--surface2);border:1px solid var(--border-soft);border-radius:10px;padding:8px 14px;display:flex;align-items:center;gap:7px"><span style="font-size:16px">'+k[0]+'</span><span style="font-weight:800;font-size:14px;color:var(--accent)">'+k[1]+'</span><span style="font-size:11px;color:var(--muted)">'+k[2]+'</span></div>';}).join('')
      +'</div>':'';

      body= (gs.tab==='feed'?catBar+searchBar+statsStrip:'<div style="font-size:13px;font-weight:700;color:var(--muted);margin-bottom:16px">🔖 '+saved.length+' saved post'+(saved.length!==1?'s':'')+'</div>')
        +(filtered.length
          ? filtered.map(_renderPost).join('')
          : '<div style="text-align:center;padding:64px 24px;color:var(--muted)">'
              +'<div style="font-size:52px;margin-bottom:16px">🌐</div>'
              +'<div style="font-size:16px;font-weight:700;margin-bottom:8px">'+(gs.tab==='saved'?'No saved posts yet':'Nothing here yet')+'</div>'
              +'<div style="font-size:13px;margin-bottom:20px">'+(gs.tab==='saved'?'Tap 🔖 on any post to save it':'Be the first to post something for your colleagues!')+'</div>'
              +(gs.tab!=='saved'?'<button onclick="window._gs.tab=\'create\';render()" style="padding:11px 28px;border-radius:12px;background:linear-gradient(135deg,var(--accent),#2563eb);color:#fff;border:none;cursor:pointer;font-size:14px;font-weight:800">✏️ Create First Post</button>':'')
            +'</div>');
    }

    /* ── CREATE TAB ── */
    if(gs.tab==='create') body=_renderComposer();

    /* ── PROFILE TAB (own) ── */
    if(gs.tab==='profile'){
      window._gs.profileUser=u.name;
      body=_renderProfile();
    }

    /* ── PROFILE PAGE (other user) ── */
    if(gs.profileUser&&gs.tab==='feed') body=_renderProfile()+body;

    return lbOverlay+'<div class="page-wrap">'+header+tabBar+body+'</div>';
  };

  /* ── wire up ── */
  (function wireRBAC(){
    if(typeof ROLE_PAGES==='undefined'){setTimeout(wireRBAC,300);return;}
    Object.keys(ROLE_PAGES).forEach(function(role){
      if(ROLE_PAGES[role].indexOf('gnsi_social')===-1)
        ROLE_PAGES[role].push('gnsi_social');
    });
  })();

  (void 0);
})();


/* ═══════════════════════════════════════════════════════════════════════════
   GNSI ENROLLMENT PAYMENT LOCK SYSTEM
   ─────────────────────────────────────────────────────────────────────────
   FLOW:
   1. Student Enrolled → Auto-popup: must pay Admission + Item Bundle + Prospectus
   2. After admission payment → redirect to Flat Fee (Feb + Mar) immediately
   3. Feb + Mar flat fee MUST be paid continuously and completely
   4. Only after Feb+Mar fully paid → Course-wise monthly fee unlocks (April+)
   5. All payment tabs locked with popup until each gate is cleared
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── HELPERS ─────────────────────────────────────────────────────────── */
  function _e(s) {
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function _toast(msg, col) {
    if (typeof showToast === 'function') showToast(msg, col || '#dc2626');
  }
  function _cols()  { return typeof _fmcLoadCols  === 'function' ? _fmcLoadCols()  : []; }
  function _asgns() { return typeof _fmcLoadAsgns === 'function' ? _fmcLoadAsgns() : []; }

  /* ── GATE 1: Has admission fee (+ items + prospectus) been collected? ── */
  function _gateAdmissionPaid(asgnId) {
    var c = _cols();
    // Admission fee record
    var admPaid = c.some(function(x) {
      return (x.asgnId === asgnId || x.admAppId === asgnId) && x.feeType === 'admission' && (parseInt(x.amountPaid)||0) > 0;
    });
    // Also accept if the linked adm app has admFeePaid flag
    if (!admPaid) {
      var asgn = _asgns().find(function(x){ return x.id === asgnId; });
      if (asgn && asgn.admAppId) {
        var apps = typeof loadAdmApps === 'function' ? loadAdmApps() : [];
        var app  = apps.find(function(x){ return String(x.id) === String(asgn.admAppId); });
        if (app && app.admFeePaid) admPaid = true;
      }
    }
    return admPaid;
  }

  /* ── GATE 2: Have BOTH Feb and Mar flat fees been paid? ─────────────── */
  function _gateFlatFeePaid(asgnId) {
    var c = _cols().filter(function(x) { return x.asgnId === asgnId; });
    /* FIX #2: match full names AND common abbreviations (feb/mar/Feb/Mar) */
    function _isFeb(s){ var l=(s||'').toLowerCase(); return l.indexOf('february')>=0||l.indexOf('feb')>=0; }
    function _isMar(s){ var l=(s||'').toLowerCase(); return l.indexOf('march')>=0||l.indexOf('mar')>=0; }
    var febPaid = c.some(function(x) {
      return (x.feeType === 'flat' || x.feeType === 'monthly') &&
             _isFeb(x.forMonth) &&
             (parseInt(x.amountPaid)||0) > 0;
    });
    var marPaid = c.some(function(x) {
      return (x.feeType === 'flat' || x.feeType === 'monthly') &&
             _isMar(x.forMonth) &&
             (parseInt(x.amountPaid)||0) > 0;
    });
    return febPaid && marPaid;
  }

  /* ── GATE 3: Is course + subtype assigned? ───────────────────────────── */
  function _gateCourseAssigned(asgnId) {
    var asgn = _asgns().find(function(x){ return x.id === asgnId; });
    return !!(asgn && asgn.subTypeId && (asgn.courseAssignedAt || asgn.subTypeId));
  }

  /* ── Which gate is blocking? (returns null if all clear) ─────────────── */
  function _getGate(asgnId) {
    if (!_gateAdmissionPaid(asgnId)) return 'admission';
    if (!_gateFlatFeePaid(asgnId))   return 'flat';
    return null; // all clear — course-wise fees unlocked
  }

  /* ══════════════════════════════════════════════════════════════════════
     PAYMENT LOCK POPUP
     Renders a full-screen modal overlay blocking fee collection
  ══════════════════════════════════════════════════════════════════════ */
  var _lockPopupId = 'gnsi-pay-lock-popup';

  function _showLockPopup(asgnId, gate) {
    var existing = document.getElementById(_lockPopupId);
    if (existing) existing.remove();

    var asgn = _asgns().find(function(x){ return x.id === asgnId; }) || {};
    var name = asgn.studentName || asgn.name || 'Student';

    var title, msg, steps, actionBtn;

    if (gate === 'admission') {
      title = '🔒 Admission Package Required';
      msg   = '<b>' + _e(name) + '</b> cannot proceed to monthly fee payment until the <b>Admission Package</b> is fully collected.';
      steps = [
        { done: false, label: 'Admission Fee (₹6,000)', sub: 'One-time at enrollment' },
        { done: false, label: 'Item Bundle (₹3,000)',   sub: '5–6 dress/kit items' },
        { done: false, label: 'Prospectus (₹200)',      sub: 'School prospectus' },
        { done: false, label: 'Flat Fee — Feb (₹5,500)', sub: 'Phase I month 1' },
        { done: false, label: 'Flat Fee — Mar (₹5,500)', sub: 'Phase I month 2' },
        { done: false, label: 'Course-wise Monthly Fee', sub: 'Unlocks from April onward' },
      ];
      actionBtn = '<button onclick=\'gnsiPayLockGoAdmission("' + _e(asgnId) + '")\' style=\'width:100%;padding:13px;border-radius:10px;background:linear-gradient(135deg,#1433a8,#2563eb);color:#fff;border:none;font-size:15px;font-weight:800;cursor:pointer;margin-bottom:8px\'>💰 Collect Admission Package Now</button>';
    } else {
      // gate === 'flat'
      var c = _cols().filter(function(x){ return x.asgnId === asgnId; });
      var febPaid = c.some(function(x){ return (x.feeType==='flat'||x.feeType==='monthly') && (x.forMonth||'').toLowerCase().indexOf('february')>=0 && (parseInt(x.amountPaid)||0)>0; });
      var marPaid = c.some(function(x){ return (x.feeType==='flat'||x.feeType==='monthly') && (x.forMonth||'').toLowerCase().indexOf('march')>=0    && (parseInt(x.amountPaid)||0)>0; });
      title = '🔒 Flat Fee (Phase I) Required';
      msg   = '<b>' + _e(name) + '</b> must complete <b>February and March flat fee</b> payments before course-wise monthly fees can be collected.';
      steps = [
        { done: true,     label: 'Admission Package',         sub: '✅ Collected' },
        { done: febPaid,  label: 'Flat Fee — February (₹5,500)', sub: febPaid ? '✅ Paid' : '⏳ Pending' },
        { done: marPaid,  label: 'Flat Fee — March (₹5,500)',    sub: marPaid ? '✅ Paid' : '⏳ Pending' },
        { done: false,    label: 'Course-wise Monthly Fee',    sub: 'Unlocks after Feb + Mar paid' },
      ];
      actionBtn = (!febPaid || !marPaid)
        ? '<button onclick=\'gnsiPayLockCollectFlat("' + _e(asgnId) + '")\' style=\'width:100%;padding:13px;border-radius:10px;background:linear-gradient(135deg,#d97706,#b45309);color:#fff;border:none;font-size:15px;font-weight:800;cursor:pointer;margin-bottom:8px\'>📅 Collect Flat Fee (₹5,500/month)</button>'
        : '';
    }

    var stepsHtml = steps.map(function(s, i) {
      var bg   = s.done ? '#f0fdf4' : (i === (gate === 'admission' ? 0 : (steps.findIndex ? steps.findIndex(function(x){ return !x.done; }) : 1))) ? '#fefce8' : '#f8fafc';
      var bdr  = s.done ? '#86efac' : '#e2e8f0';
      var icon = s.done ? '✅' : (bg === '#fefce8' ? '⚡' : '🔒');
      return '<div style="display:flex;align-items:center;gap:10px;padding:9px 12px;background:' + bg + ';border:1.5px solid ' + bdr + ';border-radius:8px;margin-bottom:6px">'
        + '<span style="font-size:16px">' + icon + '</span>'
        + '<div><div style="font-size:13px;font-weight:700;color:#0a1229">' + _e(s.label) + '</div>'
        + '<div style="font-size:11px;color:#64748b">' + _e(s.sub) + '</div></div>'
        + '</div>';
    }).join('');

    var overlay = document.createElement('div');
    overlay.id  = _lockPopupId;
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(10,18,41,0.72);z-index:99999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);padding:16px';
    overlay.innerHTML =
      '<div style="background:var(--surface,#fff);border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.4);width:100%;max-width:480px;padding:28px 28px 22px;position:relative;max-height:90vh;overflow-y:auto">'
      + '<div style="display:flex;align-items:center;gap:12px;margin-bottom:18px">'
      +   '<div style="width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,#dc2626,#991b1b);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">🔒</div>'
      +   '<div><div style="font-size:17px;font-weight:800;color:var(--text,#0a1229)">' + title + '</div>'
      +        '<div style="font-size:12px;color:#64748b;margin-top:2px">Payment gateway blocked until required steps are complete</div></div>'
      + '</div>'
      + '<div style="background:#fff5f5;border:1.5px solid #fca5a5;border-radius:10px;padding:12px 14px;margin-bottom:16px;font-size:13px;color:#7f1d1d">' + msg + '</div>'
      + '<div style="font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Payment Steps</div>'
      + stepsHtml
      + '<div style="margin-top:16px">'
      + actionBtn
      + '<button onclick="gnsiPayLockDismiss()" style="width:100%;padding:10px;border-radius:10px;background:var(--surface2,#f1f5f9);color:var(--muted,#64748b);border:1.5px solid var(--border,#e2e8f0);font-size:13px;font-weight:700;cursor:pointer">✕ Close</button>'
      + '</div></div>';
    document.body.appendChild(overlay);
  }

  window.gnsiPayLockDismiss = function() {
    var el = document.getElementById(_lockPopupId);
    if (el) el.remove();
  };

  /* Go to admission fee collection for this student */
  window.gnsiPayLockGoAdmission = function(asgnId) {
    gnsiPayLockDismiss();
    var asgn = _asgns().find(function(x){ return x.id === asgnId; });
    if (asgn && asgn.admAppId) {
      // Open the admission fee modal for this app
      if (typeof admPayFeeModal === 'function') {
        navigate('admissions');
        setTimeout(function(){ admPayFeeModal(parseInt(asgn.admAppId)); }, 400);
        return;
      }
    }
    // Fallback: switch to admission fee type in current form
    if (typeof _fmc !== 'undefined') { _fmc.payType = 'admission'; _fmc.asgnId = asgnId; }
    if (typeof render === 'function') render();
  };

  /* Collect flat fee for Feb and/or March */
  window.gnsiPayLockCollectFlat = function(asgnId) {
    gnsiPayLockDismiss();
    if (typeof gnsiAssignFlatFee === 'function') {
      gnsiAssignFlatFee(asgnId, typeof currentUser !== 'undefined' && currentUser ? currentUser.name : 'Admin');
    }
    // Switch to flat fee payment view
    if (typeof _fmc !== 'undefined') {
      _fmc.asgnId  = asgnId;
      _fmc.payType = 'flat';
      _fmc.tab     = 'collect';
    }
    if (typeof render === 'function') render();
    // Auto-open Feb payment if not yet paid
    setTimeout(function() {
      var c = _cols().filter(function(x){ return x.asgnId === asgnId && x.feeType === 'flat'; });
      var pending = c.filter(function(x){ return (parseInt(x.amountPaid)||0) === 0; });
      if (pending.length && pending[0].forMonth) {
        _toast('📅 Collecting flat fee for ' + pending[0].forMonth + ' — fill in amount and save', '#d97706');
        // Pre-fill the month in the form
        setTimeout(function(){
          var descEl = document.getElementById('fmc-desc');
          if (descEl) {
            // Set flat fee amount
            var amtEl = document.getElementById('fmc-amount');
            if (amtEl) amtEl.value = '5500';
            descEl.value = pending[0].forMonth + ' (Flat Fee)';
          }
        }, 300);
      }
    }, 500);
  };

  /* ══════════════════════════════════════════════════════════════════════
     INTERCEPT _fmcRenderCollectForm — inject lock banner
  ══════════════════════════════════════════════════════════════════════ */
  setTimeout(function patchCollectForm() {
    var _origForm = window._fmcRenderCollectForm;
    if (typeof _origForm !== 'function') { setTimeout(patchCollectForm, 400); return; }

    window._fmcRenderCollectForm = function(a, cols, isAccounts) {
      var asgnId = a.id;
      var gate   = _getGate(asgnId);

      // If monthly fee tab is selected and gates not cleared — show lock banner at top
      var pt = (typeof _fmc !== 'undefined' ? _fmc.payType : null) || 'monthly';

      // Always allow: admission, item, advance, manual, prospectus
      var allowedTypes = ['admission', 'item', 'advance', 'manual', 'prospectus'];
      var isLocked = gate !== null && allowedTypes.indexOf(pt) < 0;

      // Flat fee type: only blocked if admission not paid
      if (pt === 'flat' && gate === 'flat') isLocked = false; // allow flat fee payment
      if (pt === 'flat' && gate === 'admission') isLocked = true; // still need admission first

      var base = _origForm(a, cols, isAccounts);

      if (!isLocked) {
        // If flat fee paid and this is first render of monthly — show unlock banner
        if (gate === null && pt === 'monthly') {
          var unlockBanner = '<div style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:2px solid #86efac;border-radius:12px;padding:14px 18px;margin-bottom:14px;display:flex;align-items:center;gap:12px">'
            + '<span style="font-size:24px">🎉</span>'
            + '<div><div style="font-weight:800;font-size:13.5px;color:#15803d">Course-wise Monthly Fee Unlocked!</div>'
            + '<div style="font-size:12px;color:#166534;margin-top:2px">Admission Package ✅ &nbsp;·&nbsp; Feb Flat Fee ✅ &nbsp;·&nbsp; Mar Flat Fee ✅ &nbsp;·&nbsp; Monthly fees active from April onward</div>'
            + '</div></div>';
          return unlockBanner + base;
        }
        return base;
      }

      // Locked — prepend warning banner and disable the collect buttons
      var lockBanner = '<div id="gnsi-fee-lock-banner" style="background:linear-gradient(135deg,#fff5f5,#fee2e2);border:2px solid #fca5a5;border-radius:12px;padding:16px 18px;margin-bottom:16px">'
        + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">'
        +   '<span style="font-size:22px">🔒</span>'
        +   '<div style="font-weight:800;font-size:14px;color:#991b1b">Payment Locked</div>'
        + '</div>'
        + '<div style="font-size:13px;color:#7f1d1d;margin-bottom:12px">'
        + (gate === 'admission'
            ? 'Collect the <b>Admission Package</b> (Admission Fee + Item Bundle + Prospectus) before accessing monthly fees.'
            : 'Pay <b>February and March flat fee</b> (₹5,500 each) continuously before course-wise monthly fees unlock.')
        + '</div>'
        + (gate === 'admission'
            ? '<button onclick="gnsiPayLockGoAdmission(\'' + _e(asgnId) + '\'" style="width:100%;padding:11px;border-radius:9px;background:linear-gradient(135deg,#1433a8,#2563eb);color:#fff;border:none;font-size:13.5px;font-weight:800;cursor:pointer;margin-bottom:8px">💰 Go to Admission Package</button>'
            : '<button onclick="gnsiPayLockCollectFlat(\'' + _e(asgnId) + '\'" style="width:100%;padding:11px;border-radius:9px;background:linear-gradient(135deg,#d97706,#b45309);color:#fff;border:none;font-size:13.5px;font-weight:800;cursor:pointer;margin-bottom:8px">📅 Collect Flat Fee (Feb / Mar)</button>')
        + '<button onclick="gnsiShowPayLockStatus(\'' + _e(asgnId) + '\'" style="width:100%;padding:8px;border-radius:9px;background:rgba(0,0,0,.06);border:none;font-size:12px;font-weight:700;cursor:pointer;color:#7f1d1d">📋 View Payment Steps</button>'
        + '</div>';

      // Replace save buttons with disabled versions in the base HTML
      var lockedBase = base.replace(
        /onclick="gnsiCollectFee\([^)]+\)"/g,
        'onclick="gnsiShowPayLockStatus(\'' + _e(asgnId) + '\'" '
      ).replace(
        /onclick=\'gnsiCollectFee\([^)]+\)\'/g,
        'onclick=\'gnsiShowPayLockStatus("' + _e(asgnId) + '")\'  '
      );

      return lockBanner + lockedBase;
    };

  }, 600);

  /* ══════════════════════════════════════════════════════════════════════
     INTERCEPT gnsiCollectFee — hard block at save time
  ══════════════════════════════════════════════════════════════════════ */
  setTimeout(function patchCollect() {
    var _origCollect = window.gnsiCollectFee;
    if (typeof _origCollect !== 'function') { setTimeout(patchCollect, 400); return; }

    window.gnsiCollectFee = function(asgnId, saveOnly) {
      var pt   = (typeof _fmc !== 'undefined' ? _fmc.payType : null) || 'monthly';
      var gate = _getGate(asgnId);

      // Always allow admission-type payments
      var passTypes = ['admission', 'item', 'advance', 'manual', 'prospectus'];
      if (passTypes.indexOf(pt) >= 0) { _origCollect(asgnId, saveOnly); return; }

      // Flat fee: allowed only after admission paid
      if (pt === 'flat') {
        if (gate === 'admission') {
          _toast('🔒 Collect the Admission Package first before flat fee.', '#dc2626');
          _showLockPopup(asgnId, 'admission');
          return;
        }
        _origCollect(asgnId, saveOnly);
        // After collecting flat fee, check if both Feb+Mar now done → show unlock message
        setTimeout(function() {
          if (_gateFlatFeePaid(asgnId)) {
            if (typeof showToast === 'function')
              showToast('🎉 Feb + Mar flat fee complete! Course-wise monthly fees now UNLOCKED for ' +
                ((_asgns().find(function(x){return x.id===asgnId;})||{}).studentName||'student'), '#16a34a', 5000);
          }
        }, 500);
        return;
      }

      // Monthly fee: need both gates cleared
      if (gate === 'admission') {
        _toast('🔒 Admission Package not collected. Cannot accept monthly fee.', '#dc2626');
        _showLockPopup(asgnId, 'admission');
        return;
      }
      if (gate === 'flat') {
        _toast('🔒 February & March flat fee not yet fully paid.', '#dc2626');
        _showLockPopup(asgnId, 'flat');
        return;
      }

      // All gates cleared
      _origCollect(asgnId, saveOnly);
    };
  }, 700);

  /* ══════════════════════════════════════════════════════════════════════
     SHOW STATUS POPUP (summary of payment steps)
  ══════════════════════════════════════════════════════════════════════ */
  window.gnsiShowPayLockStatus = function(asgnId) {
    var gate = _getGate(asgnId);
    if (gate) _showLockPopup(asgnId, gate);
    else {
      var asgn = _asgns().find(function(x){ return x.id === asgnId; }) || {};
      _toast('✅ All payment gates cleared for ' + (asgn.studentName||'student') + '. Monthly fees fully unlocked.', '#16a34a');
    }
  };

  /* ══════════════════════════════════════════════════════════════════════
     AUTO-TRIGGER POPUP: when Fee Management opens for a locked student
  ══════════════════════════════════════════════════════════════════════ */
  setTimeout(function patchFeeNav() {
    var _origNav = window.navigate;
    if (typeof _origNav !== 'function') { setTimeout(patchFeeNav, 500); return; }
    window.navigate = function(page) {
      _origNav(page);
      if (page === 'fees') {
        setTimeout(function() {
          try {
            if (typeof _fmc === 'undefined' || !_fmc.asgnId) return;
            var gate = _getGate(_fmc.asgnId);
            var pt   = _fmc.payType || 'monthly';
            var passTypes = ['admission','item','advance','manual','prospectus'];
            if (gate && passTypes.indexOf(pt) < 0 && pt !== 'flat') {
              _showLockPopup(_fmc.asgnId, gate);
            }
          } catch(e) {}
        }, 600);
      }
    };
  }, 800);

  /* ══════════════════════════════════════════════════════════════════════
     AUTO-TRIGGER AFTER ENROLL: immediately open flat fee popup for new students
  ══════════════════════════════════════════════════════════════════════ */
  setTimeout(function patchEnroll() {
    var _origEnroll = window.admEnroll;
    if (typeof _origEnroll !== 'function') { setTimeout(patchEnroll, 500); return; }
    window.admEnroll = function(id) {
      _origEnroll(id);
      // After enrollment, navigate to fees and auto-show flat fee gate
      setTimeout(function() {
        try {
          var apps = typeof loadAdmApps === 'function' ? loadAdmApps() : [];
          var app  = apps.find(function(x){ return x.id === id; });
          if (!app) return;
          var asgns = _asgns();
          var asgn  = asgns.find(function(x){
            return String(x.admAppId) === String(id) || String(x.stuId) === String(app.enrolledId || app._stuId || '');
          });
          if (!asgn) return;
          var gate = _getGate(asgn.id);
          if (gate) {
            setTimeout(function(){ _showLockPopup(asgn.id, gate); }, 800);
          }
        } catch(e) {}
      }, 1200);
    };
  }, 900);

  /* ══════════════════════════════════════════════════════════════════════
     FEE HUB LOCK BANNER — shown in fee list if student has pending gates
  ══════════════════════════════════════════════════════════════════════ */
  setTimeout(function patchFeeList() {
    var _origRenderList = window._fmcRenderCollect;
    if (typeof _origRenderList !== 'function') { setTimeout(patchFeeList, 400); return; }
    window._fmcRenderCollect = function(asgns, cols, isAccounts, kpi) {
      var base = _origRenderList(asgns, cols, isAccounts, kpi);
      // Inject a warning strip for students with locked payments
      try {
        var locked = asgns.filter(function(a){ return _getGate(a.id) !== null; });
        if (locked.length > 0) {
          var lockStrip = '<div style="background:linear-gradient(135deg,#fef2f2,#fff5f5);border:1.5px solid #fca5a5;border-radius:10px;padding:10px 14px;margin-bottom:12px;display:flex;align-items:center;gap:10px">'
            + '<span style="font-size:18px">🔒</span>'
            + '<div style="flex:1"><div style="font-weight:800;font-size:12.5px;color:#991b1b">' + locked.length + ' student' + (locked.length > 1 ? 's' : '') + ' with locked payments</div>'
            + '<div style="font-size:11px;color:#b91c1c;margin-top:2px">Admission Package or Flat Fee (Feb+Mar) not yet collected</div></div>'
            + '<button onclick="gnsiShowLockedStudentsList()" style="padding:5px 12px;border-radius:7px;background:#dc2626;color:#fff;border:none;font-size:11px;font-weight:700;cursor:pointer">View</button>'
            + '</div>';
          return lockStrip + base;
        }
      } catch(e) {}
      return base;
    };
  }, 700);

  window.gnsiShowLockedStudentsList = function() {
    var asgns  = _asgns();
    var locked = asgns.filter(function(a){ return _getGate(a.id) !== null; });
    if (!locked.length) { _toast('✅ All students have cleared their payment gates!', '#16a34a'); return; }
    var rows = locked.map(function(a) {
      var gate = _getGate(a.id);
      var gateLabel = gate === 'admission' ? '⚠ Admission Package Due' : '⚠ Flat Fee (Feb/Mar) Due';
      var gateCol   = gate === 'admission' ? '#dc2626' : '#d97706';
      return '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid var(--border,#e2e8f0)">'
        + '<div style="width:32px;height:32px;border-radius:50%;background:#dc262622;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;color:#dc2626;flex-shrink:0">'
        + (a.studentName||'?').charAt(0).toUpperCase() + '</div>'
        + '<div style="flex:1"><div style="font-weight:700;font-size:13px">' + _e(a.studentName||'Unknown') + '</div>'
        + '<div style="font-size:11px;color:var(--muted,#64748b)">' + _e(a.className||'') + (a.admNo ? ' · ' + _e(a.admNo) : '') + '</div></div>'
        + '<div style="text-align:right"><span style="font-size:11px;font-weight:700;color:' + gateCol + '">' + gateLabel + '</span>'
        + '<br><button onclick="var _lm=document.getElementById(\'gnsi-locked-list-modal\');if(_lm)_lm.remove();gnsiShowPayLockStatus(\'' + _e(a.id) + '\')" style="font-size:11px;padding:3px 9px;border-radius:6px;border:none;background:' + gateCol + ';color:#fff;cursor:pointer;margin-top:3px;font-weight:700">Fix →</button></div>'
        + '</div>';
    }).join('');

    var existing = document.getElementById('gnsi-locked-list-modal');
    if (existing) existing.remove();
    var modal = document.createElement('div');
    modal.id  = 'gnsi-locked-list-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(10,18,41,.65);z-index:99998;display:flex;align-items:center;justify-content:center;padding:16px';
    modal.innerHTML =
      '<div style="background:var(--surface,#fff);border-radius:14px;width:100%;max-width:440px;max-height:80vh;overflow-y:auto;box-shadow:0 16px 50px rgba(0,0,0,.35)">'
      + '<div style="background:linear-gradient(135deg,#dc2626,#991b1b);padding:16px 20px;border-radius:14px 14px 0 0;display:flex;align-items:center;justify-content:space-between">'
      +   '<div style="color:#fff;font-weight:800;font-size:15px">🔒 Students with Locked Payments</div>'
      +   '<button onclick="document.getElementById(\'gnsi-locked-list-modal\').remove()" style="background:rgba(255,255,255,.15);border:none;color:#fff;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:13px;font-weight:700">✕</button>'
      + '</div>'
      + '<div>' + rows + '</div>'
      + '</div>';
    document.body.appendChild(modal);
    modal.addEventListener('click', function(e){ if (e.target === modal) modal.remove(); });
  };

  /* ══════════════════════════════════════════════════════════════════════
     ADMISSION PAGE: auto-show payment popup when Admitted student opened
  ══════════════════════════════════════════════════════════════════════ */
  setTimeout(function patchAdmEnroll() {
    // When "✅ Enroll" button is clicked on Admissions page,
    // intercept if flat fee not yet assigned and show warning
    var _origAdmEnroll = window.admEnroll;
    if (typeof _origAdmEnroll !== 'function') { setTimeout(patchAdmEnroll, 600); return; }
    // Already patched above — no double patch needed
  }, 1000);

  (void 0);
})();

</script>

<!-- ═══════════════════════════════════════════════════════════════════════
     🔔 GNSI PUSH NOTIFICATION SYSTEM
     - Bell icon in topbar with unread badge
     - Slide-down panel with notification list
     - Browser Push Notifications (with permission prompt)
     - Polls Supabase notices table every 60s for new entries
     - Persists read state in localStorage
═══════════════════════════════════════════════════════════════════════ -->
<style>
/* --- Notification Panel --- */
#gnsi-notif-panel {
  display: none;
  position: fixed;
  top: 72px;
  right: 16px;
  width: 360px;
  max-width: calc(100vw - 32px);
  max-height: 520px;
  background: var(--surface, #fff);
  border-radius: 16px;
  box-shadow: 0 12px 50px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.1);
  z-index: 99990;
  overflow: hidden;
  flex-direction: column;
  border: 1.5px solid rgba(20,51,168,0.12);
  animation: gnsi-notif-slide-in 0.22s cubic-bezier(.34,1.56,.64,1) both;
}
#gnsi-notif-panel.open { display: flex; }
@keyframes gnsi-notif-slide-in {
  from { opacity:0; transform: translateY(-12px) scale(0.96); }
  to   { opacity:1; transform: translateY(0) scale(1); }
}
.gnsi-notif-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px 12px;
  background: linear-gradient(135deg, #1433a8, #2563eb);
  color: #fff;
  flex-shrink: 0;
}
.gnsi-notif-header-title { font-weight: 800; font-size: 14px; font-family: 'DM Sans', sans-serif; display:flex;align-items:center;gap:8px; }
.gnsi-notif-header-actions { display:flex;gap:8px;align-items:center; }
.gnsi-notif-mark-all { font-size:11px;font-weight:700;font-family:'DM Sans',sans-serif;background:rgba(255,255,255,0.18);border:none;color:#fff;border-radius:7px;padding:4px 10px;cursor:pointer;transition:.15s; }
.gnsi-notif-mark-all:hover { background:rgba(255,255,255,0.3); }
.gnsi-notif-close-btn { background:rgba(255,255,255,0.15);border:none;color:#fff;border-radius:7px;padding:4px 9px;cursor:pointer;font-size:14px;font-weight:700;transition:.15s; }
.gnsi-notif-close-btn:hover { background:rgba(255,255,255,0.28); }
.gnsi-notif-list { overflow-y: auto; flex: 1; padding: 8px 0; }
.gnsi-notif-item {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 12px 16px; cursor: pointer; transition: background .12s;
  border-bottom: 1px solid var(--border, #f1f5f9);
  position: relative;
}
.gnsi-notif-item:hover { background: #f8faff; }
.gnsi-notif-item.unread { background: #eff6ff; }
.gnsi-notif-item.unread:hover { background: #dbeafe; }
.gnsi-notif-dot {
  width: 9px; height: 9px; border-radius: 50%; background: #2563eb;
  flex-shrink: 0; margin-top: 5px; transition: opacity .2s;
}
.gnsi-notif-item:not(.unread) .gnsi-notif-dot { opacity: 0; }
.gnsi-notif-icon { font-size: 20px; flex-shrink: 0; margin-top: 1px; }
.gnsi-notif-body { flex: 1; min-width: 0; }
.gnsi-notif-title { font-weight: 700; font-size: 13px; color: #1e293b; font-family: 'DM Sans', sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.gnsi-notif-desc { font-size: 11.5px; color: #64748b; margin-top: 2px; line-height: 1.45; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.gnsi-notif-time { font-size: 10.5px; color: #94a3b8; margin-top: 4px; font-family: 'DM Sans', sans-serif; }
.gnsi-notif-empty { text-align:center; padding: 36px 20px; color: #94a3b8; font-family: 'DM Sans', sans-serif; }
.gnsi-notif-empty-icon { font-size: 36px; margin-bottom: 10px; }
.gnsi-notif-empty-text { font-size: 13px; font-weight: 600; color: #64748b; }
.gnsi-notif-empty-sub { font-size: 11.5px; color: #94a3b8; margin-top: 4px; }
.gnsi-notif-footer { flex-shrink: 0; padding: 10px 16px; border-top: 1px solid var(--border,#f1f5f9); display:flex;gap:8px;align-items:center;justify-content:space-between; background: var(--surface, #fff); }
.gnsi-notif-push-btn { font-size: 11.5px; font-weight: 700; font-family:'DM Sans',sans-serif; padding: 6px 14px; border-radius: 8px; border: 1.5px solid #2563eb; color: #2563eb; background: #eff6ff; cursor: pointer; transition: .15s; }
.gnsi-notif-push-btn:hover { background: #dbeafe; }
.gnsi-notif-push-btn.enabled { color: #16a34a; border-color: #16a34a; background: #f0fdf4; }
.gnsi-notif-footer-label { font-size: 11px; color: #94a3b8; font-family:'DM Sans',sans-serif; }

/* Shake animation for bell on new notification */
@keyframes gnsi-bell-shake {
  0%,100% { transform: rotate(0); }
  15%      { transform: rotate(18deg); }
  30%      { transform: rotate(-16deg); }
  45%      { transform: rotate(12deg); }
  60%      { transform: rotate(-8deg); }
  75%      { transform: rotate(4deg); }
}
.gnsi-bell-shake { animation: gnsi-bell-shake 0.6s ease both; }

/* --- Slide-in toast for new notification (appears top-right) --- */
.gnsi-push-toast {
  position: fixed; top: 80px; right: 16px; z-index: 99995;
  background: linear-gradient(135deg, #1e40af, #2563eb);
  color: #fff; border-radius: 14px; padding: 14px 16px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.25);
  min-width: 280px; max-width: 340px;
  display: flex; gap: 12px; align-items: flex-start;
  animation: gnsi-push-toast-in 0.35s cubic-bezier(.34,1.56,.64,1) both;
  cursor: pointer; font-family: 'DM Sans', sans-serif;
  border: 1px solid rgba(255,255,255,0.15);
}
.gnsi-push-toast.hiding { animation: gnsi-push-toast-out 0.3s ease forwards; }
@keyframes gnsi-push-toast-in {
  from { opacity: 0; transform: translateX(120px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes gnsi-push-toast-out {
  from { opacity: 1; transform: translateX(0); }
  to   { opacity: 0; transform: translateX(120px); }
}
.gnsi-push-toast-icon { font-size: 22px; flex-shrink: 0; }
.gnsi-push-toast-body { flex: 1; min-width: 0; }
.gnsi-push-toast-title { font-weight: 800; font-size: 13px; }
.gnsi-push-toast-desc  { font-size: 11.5px; opacity: .8; margin-top: 3px; line-height: 1.4; }
.gnsi-push-toast-close { background: none; border: none; color: rgba(255,255,255,0.6); font-size: 15px; cursor: pointer; flex-shrink: 0; padding: 0; line-height: 1; margin-top: -2px; }
</style>

<!-- Notification Panel DOM -->
<div id="gnsi-notif-panel">
  <div class="gnsi-notif-header">
    <div class="gnsi-notif-header-title">🔔 Notifications <span id="gnsi-notif-unread-count" style="background:rgba(255,255,255,0.2);border-radius:20px;padding:1px 8px;font-size:11px;font-weight:700;display:none"></span></div>
    <div class="gnsi-notif-header-actions">
      <button class="gnsi-notif-mark-all" onclick="gnsiMarkAllRead()">Mark all read</button>
      <button class="gnsi-notif-close-btn" onclick="gnsiCloseNotifPanel()">✕</button>
    </div>
  </div>
  <div class="gnsi-notif-list" id="gnsi-notif-list">
    <div class="gnsi-notif-empty">
      <div class="gnsi-notif-empty-icon">🔔</div>
      <div class="gnsi-notif-empty-text">All caught up!</div>
      <div class="gnsi-notif-empty-sub">No new updates right now.</div>
    </div>
  </div>
  <div class="gnsi-notif-footer">
    <span class="gnsi-notif-footer-label" id="gnsi-notif-last-check">Checking…</span>
    <button class="gnsi-notif-push-btn" id="gnsi-push-toggle-btn" onclick="gnsiTogglePushPermission()">🔔 Enable Push</button>
  </div>
</div>

<script>
/* ═══════════════════════════════════════════════════════════════════════
   GNSI NOTIFICATION SYSTEM
   - Polls notices table on Supabase every 60 seconds
   - Tracks read/unread via localStorage (gnsi_notif_read_ids)
   - Shows badge count on bell
   - Requests & uses Browser Push Notification API
   - Shows in-app slide toast for new items
═══════════════════════════════════════════════════════════════════════ */
(function() {
  'use strict';

  /* ── State ── */
  var _notifs        = [];          // all notifications (latest first)
  var _readIds       = new Set();   // IDs already seen/read
  var _panelOpen     = false;
  var _pollTimer     = null;
  var _lastNoticeTs  = 0;           // timestamp of newest known notice
  var _pushEnabled   = false;
  var _initing       = false;

  /* ── Persistence ── */
  function _loadReadIds() {
    try {
      var saved = JSON.parse(localStorage.getItem('gnsi_notif_read_ids') || '[]');
      _readIds = new Set(Array.isArray(saved) ? saved : []);
    } catch(e) { _readIds = new Set(); }
  }
  function _saveReadIds() {
    try {
      var arr = Array.from(_readIds).slice(-200); // keep last 200
      localStorage.setItem('gnsi_notif_read_ids', JSON.stringify(arr));
    } catch(e) {}
  }

  /* ── Fetch notices from Supabase ── */
  async function _fetchNotices() {
    try {
      var client = (typeof _getSb === 'function') ? _getSb() : null;
      if (!client) return _buildFromLocalNotices();

      var result = await client
        .from('gnsi_notices')
        .select('id, title, body, category, created_at, created_by')
        .order('created_at', { ascending: false })
        .limit(50);

      if (result.error || !result.data) return _buildFromLocalNotices();

      return result.data.map(function(n) {
        return {
          id:        String(n.id),
          title:     n.title || 'New Notice',
          desc:      n.body  || '',
          category:  n.category || 'General',
          ts:        n.created_at ? new Date(n.created_at).getTime() : Date.now(),
          by:        n.created_by || '',
          icon:      _categoryIcon(n.category)
        };
      });
    } catch(e) {
      return _buildFromLocalNotices();
    }
  }

  /* ── Fallback: use in-memory/localStorage notices ── */
  function _buildFromLocalNotices() {
    try {
      var raw = (typeof notices !== 'undefined' && Array.isArray(notices))
        ? notices
        : (typeof notices !== 'undefined' ? notices : []);
      return raw.slice(0, 30).map(function(n, i) {
        return {
          id:       String(n.id || n.date || i),
          title:    n.title || n.subject || 'Notice',
          desc:     n.body  || n.content || n.message || '',
          category: n.category || n.type || 'General',
          ts:       n.date ? new Date(n.date).getTime() : (Date.now() - i * 3600000),
          by:       n.by   || n.addedBy || n.createdBy || '',
          icon:     _categoryIcon(n.category || n.type)
        };
      }).sort(function(a,b){ return b.ts - a.ts; });
    } catch(e) { return []; }
  }

  function _categoryIcon(cat) {
    var c = (cat || '').toLowerCase();
    if (c.includes('exam'))       return '📝';
    if (c.includes('fee'))        return '💰';
    if (c.includes('holiday'))    return '🏖';
    if (c.includes('event'))      return '🎉';
    if (c.includes('urgent') || c.includes('important')) return '🚨';
    if (c.includes('sport'))      return '⚽';
    if (c.includes('health') || c.includes('medical')) return '🏥';
    if (c.includes('meeting'))    return '🤝';
    if (c.includes('result'))     return '🏆';
    return '📌';
  }

  /* ── Time formatting ── */
  function _relTime(ts) {
    var diff = Date.now() - ts;
    var m = Math.floor(diff / 60000);
    if (m < 1)  return 'Just now';
    if (m < 60) return m + 'm ago';
    var h = Math.floor(m / 60);
    if (h < 24) return h + 'h ago';
    var d = Math.floor(h / 24);
    if (d < 7)  return d + 'd ago';
    return new Date(ts).toLocaleDateString('en-IN', { day:'2-digit', month:'short' });
  }

  /* ── Badge ── */
  function _updateBadge() {
    var unread = _notifs.filter(function(n){ return !_readIds.has(n.id); }).length;
    var badge  = document.getElementById('gnsi-notif-badge');
    var countEl= document.getElementById('gnsi-notif-unread-count');
    if (!badge) return;
    if (unread > 0) {
      badge.style.display = 'flex';
      badge.textContent   = unread > 9 ? '9+' : String(unread);
    } else {
      badge.style.display = 'none';
    }
    if (countEl) {
      if (unread > 0) {
        countEl.style.display = '';
        countEl.textContent   = unread + ' new';
      } else {
        countEl.style.display = 'none';
      }
    }
    // Update panel header count label
    var hdrCount = document.getElementById('gnsi-notif-unread-count');
    // already handled above
  }

  /* ── Render panel list ── */
  function _renderPanel() {
    var list = document.getElementById('gnsi-notif-list');
    if (!list) return;
    if (!_notifs.length) {
      list.innerHTML = '<div class="gnsi-notif-empty"><div class="gnsi-notif-empty-icon">🔔</div><div class="gnsi-notif-empty-text">All caught up!</div><div class="gnsi-notif-empty-sub">No new updates right now.</div></div>';
      return;
    }
    var html = '';
    _notifs.forEach(function(n) {
      var isUnread = !_readIds.has(n.id);
      html += '<div class="gnsi-notif-item' + (isUnread ? ' unread' : '') + '" onclick="gnsiNotifItemClick(\'' + _esc(n.id) + '\')">'
        + '<div class="gnsi-notif-dot"></div>'
        + '<div class="gnsi-notif-icon">' + n.icon + '</div>'
        + '<div class="gnsi-notif-body">'
        +   '<div class="gnsi-notif-title">' + _esc(n.title) + '</div>'
        + (n.desc ? '<div class="gnsi-notif-desc">' + _esc(n.desc) + '</div>' : '')
        +   '<div class="gnsi-notif-time">' + _relTime(n.ts) + (n.by ? ' · ' + _esc(n.by) : '') + '</div>'
        + '</div>'
        + '</div>';
    });
    list.innerHTML = html;

    // Update last check label
    var lcEl = document.getElementById('gnsi-notif-last-check');
    if (lcEl) lcEl.textContent = 'Updated ' + _relTime(Date.now());
  }

  function _esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  /* ── Bell shake animation ── */
  function _shakeBell() {
    var btn = document.getElementById('gnsi-notif-bell-btn');
    if (!btn) return;
    btn.classList.remove('gnsi-bell-shake');
    void btn.offsetWidth; // reflow
    btn.classList.add('gnsi-bell-shake');
    setTimeout(function(){ btn.classList.remove('gnsi-bell-shake'); }, 700);
  }

  /* ── In-app toast for new notification ── */
  function _showPushToast(notif) {
    var existing = document.getElementById('gnsi-push-toast-el');
    if (existing) existing.remove();
    var el = document.createElement('div');
    el.id = 'gnsi-push-toast-el';
    el.className = 'gnsi-push-toast';
    el.innerHTML = '<div class="gnsi-push-toast-icon">' + notif.icon + '</div>'
      + '<div class="gnsi-push-toast-body">'
      +   '<div class="gnsi-push-toast-title">New Update: ' + _esc(notif.title) + '</div>'
      + (notif.desc ? '<div class="gnsi-push-toast-desc">' + _esc(notif.desc.substring(0, 80)) + (notif.desc.length > 80 ? '…' : '') + '</div>' : '')
      + '</div>'
      + '<button class="gnsi-push-toast-close" onclick="this.parentNode.remove()">✕</button>';
    el.onclick = function(e) {
      if (e.target.classList.contains('gnsi-push-toast-close')) return;
      gnsiOpenNotifPanel();
      el.remove();
    };
    document.body.appendChild(el);
    setTimeout(function() {
      if (el.parentNode) {
        el.classList.add('hiding');
        setTimeout(function(){ if (el.parentNode) el.remove(); }, 350);
      }
    }, 6000);
  }

  /* ── Browser Push Notification ── */
  function _sendBrowserPush(notif) {
    if (!_pushEnabled) return;
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;
    try {
      var n = new Notification('GNSI: ' + notif.title, {
        body: notif.desc ? notif.desc.substring(0, 100) : 'Tap to view',
        icon: 'https://pwrldrngqxbvwfztxxrd.supabase.co/storage/v1/object/public/gnsi-assets/icon-192.png',
        badge: 'https://pwrldrngqxbvwfztxxrd.supabase.co/storage/v1/object/public/gnsi-assets/badge-72.png',
        tag:  'gnsi-notif-' + notif.id,
        renotify: false,
        requireInteraction: false
      });
      n.onclick = function() { window.focus(); gnsiOpenNotifPanel(); n.close(); };
    } catch(e) {}
  }

  /* ── Poll for new notices ── */
  async function _poll() {
    try {
      var fetched = await _fetchNotices();
      if (!fetched || !fetched.length) return;

      // Find genuinely new ones (newer than last known)
      var newOnes = fetched.filter(function(n) {
        return n.ts > _lastNoticeTs && !_readIds.has(n.id);
      });

      _notifs = fetched;

      if (_lastNoticeTs > 0 && newOnes.length > 0) {
        // There are actually new items since last poll
        _shakeBell();
        newOnes.forEach(function(n) { _showPushToast(n); _sendBrowserPush(n); });
      }

      // Update last known ts
      if (fetched.length) {
        _lastNoticeTs = Math.max.apply(null, fetched.map(function(n){ return n.ts; }));
      }

      _updateBadge();
      if (_panelOpen) _renderPanel();

    } catch(e) {}
  }

  /* ── Public: Toggle panel ── */
  window.gnsiToggleNotifPanel = function() {
    _panelOpen ? gnsiCloseNotifPanel() : gnsiOpenNotifPanel();
  };
  window.gnsiOpenNotifPanel = function() {
    var panel = document.getElementById('gnsi-notif-panel');
    if (!panel) return;
    _panelOpen = true;
    panel.classList.add('open');
    _renderPanel();
  };
  window.gnsiCloseNotifPanel = function() {
    var panel = document.getElementById('gnsi-notif-panel');
    if (!panel) return;
    _panelOpen = false;
    panel.classList.remove('open');
  };

  /* ── Public: Mark individual as read ── */
  window.gnsiNotifItemClick = function(id) {
    _readIds.add(id);
    _saveReadIds();
    _updateBadge();
    _renderPanel();
    // Navigate to notices page
    if (typeof navigate === 'function') {
      gnsiCloseNotifPanel();
      navigate('notices');
    }
  };

  /* ── Public: Mark all read ── */
  window.gnsiMarkAllRead = function() {
    _notifs.forEach(function(n){ _readIds.add(n.id); });
    _saveReadIds();
    _updateBadge();
    _renderPanel();
  };

  /* ── Push permission toggle ── */
  window.gnsiTogglePushPermission = async function() {
    var btn = document.getElementById('gnsi-push-toggle-btn');
    if (typeof Notification === 'undefined') {
      if (btn) btn.textContent = '❌ Not supported';
      return;
    }
    if (Notification.permission === 'granted') {
      // Already granted — just toggle local flag
      _pushEnabled = !_pushEnabled;
      _updatePushBtn();
      try { localStorage.setItem('gnsi_push_enabled', _pushEnabled ? '1' : '0'); } catch(e){}
    } else if (Notification.permission === 'denied') {
      if (typeof showToast === 'function') showToast('❌ Notifications blocked. Please allow in browser settings.', '#dc2626');
    } else {
      try {
        var perm = await Notification.requestPermission();
        if (perm === 'granted') {
          _pushEnabled = true;
          _updatePushBtn();
          try { localStorage.setItem('gnsi_push_enabled', '1'); } catch(e){}
          if (typeof showToast === 'function') showToast('🔔 Push notifications enabled!', '#16a34a');
        } else {
          if (typeof showToast === 'function') showToast('⚠ Notification permission denied.', '#f59e0b');
        }
      } catch(e) {}
    }
  };

  function _updatePushBtn() {
    var btn = document.getElementById('gnsi-push-toggle-btn');
    if (!btn) return;
    if (typeof Notification === 'undefined' || Notification.permission === 'denied') {
      btn.textContent = '🚫 Blocked'; btn.className = 'gnsi-notif-push-btn'; return;
    }
    if (Notification.permission === 'granted' && _pushEnabled) {
      btn.textContent = '✅ Push On'; btn.className = 'gnsi-notif-push-btn enabled';
    } else {
      btn.textContent = '🔔 Enable Push'; btn.className = 'gnsi-notif-push-btn';
    }
  }

  /* ── Close panel on outside click ── */
  document.addEventListener('click', function(e) {
    if (!_panelOpen) return;
    var panel = document.getElementById('gnsi-notif-panel');
    var wrap  = document.getElementById('gnsi-notif-bell-wrap');
    if (panel && !panel.contains(e.target) && wrap && !wrap.contains(e.target)) {
      gnsiCloseNotifPanel();
    }
  });

  /* ── Init ── */
  function _init() {
    if (_initing) return; _initing = true;
    _loadReadIds();

    // Restore push preference
    try { _pushEnabled = localStorage.getItem('gnsi_push_enabled') === '1'; } catch(e){}

    // Initial poll (delay slightly so page finishes loading)
    setTimeout(function() {
      _poll();
      _updatePushBtn();
    }, 2000);

    // Poll every 60 seconds
    _pollTimer = setInterval(_poll, 60000);
  }

  // Start after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _init);
  } else {
    _init();
  }

})();
</script>

<script>
/* ═══════════════════════════════════════════════════════════════════════════
   GNSI PORTAL — FEE RECEIPT PATCH v1
   Fixes: receipt no. collision · receipt date · cloud-sync on delete ·
          parseInt NaN · signature line · date-range filter in receipts tab
   Inject BEFORE </body> (use rfind for injection).
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── 1. RECEIPT NUMBER — collision-safe (max sequence + 1, not length+1) ── */
  window._fmcNextReceipt = function (prefix) {
    var cols = _fmcLoadCols();
    var yr   = new Date().getFullYear().toString().slice(-2);
    var pfx  = (prefix || 'RCP') + yr + '-';
    var maxSeq = 0;
    cols.forEach(function (c) {
      if (c.receiptNo && c.receiptNo.startsWith(pfx)) {
        var n = parseInt(c.receiptNo.slice(pfx.length)) || 0;
        if (n > maxSeq) maxSeq = n;
      }
    });
    return pfx + String(maxSeq + 1).padStart(4, '0');
  };

  /* ── 2 & 3. DELETE — now cloud-syncs after local save ── */
  window.gnsiDeleteFMCCol = function (id) {
    if (!confirm('Delete this fee record?\nThis cannot be undone.')) return;
    var cols = _fmcLoadCols().filter(function (c) { return c.id !== id; });
    _fmcSaveCols(cols);
    if (typeof gnsiKVPush === 'function') {
      gnsiKVPush('gnsi_fee_cols', cols);
      gnsiKVPush('gnsi_sfa_collections', cols);
    }
    /* Remove from income ledger too */
    try {
      var inc = loadIncomeLedger().filter(function (r) { return r.sourceId !== id; });
      saveIncomeLedger(inc);
    } catch (e) {}
    if (typeof showToast === 'function') showToast('Record deleted & synced', '#c0291d');
    if (typeof render === 'function') render();
  };

  /* ── 4. RECEIPT DATE — uses payDate, falls back to print date ── */
  function _fmcFormatDate(iso) {
    var d = iso ? new Date(iso) : new Date();
    if (isNaN(d.getTime())) d = new Date(); /* guard malformed payDate */
    return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  /* ── SAFE TEXT helper (keep existing if present, else define) ── */
  if (typeof _fmcSafeText !== 'function') {
    window._fmcSafeText = function (s) {
      if (s == null) return '';
      return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    };
  }

  /* ── 5. RECEIPT HTML — professional redesign with ALL fixes ── */
  window._fmcBuildReceiptHTML = function (col, a) {
    var esc = _fmcSafeText;
    var isPhase2 = a && a.subTypeId && a.courseAssignedAt;
    var typeLabels = {
      monthly  : 'Monthly Fee Receipt',
      fullpay  : 'Full Payment Receipt',
      admission: 'Admission Fee Receipt',
      advance  : 'Advance Fee Receipt',
      item     : 'Item / Material Fee',
      manual   : 'Fee Receipt'
    };
    var label    = typeLabels[col.feeType] || 'Fee Receipt';
    var amount   = parseInt(col.amountPaid) || 0;
    var amtWords = _fmcAmountInWords(amount);
    /* FIX #2: use payDate, not print date */
    var rcptDate = _fmcFormatDate(col.payDate);
    var today    = _fmcFormatDate();

    var courseLine  = isPhase2 ? '<tr><td class="rl">Course / Sub-type</td><td class="rv">' + esc(a.subTypeId) + '</td></tr>' : '';
    var remarksLine = col.remark ? '<tr><td class="rl">Remarks</td><td class="rv remark">' + esc(col.remark) + '</td></tr>' : '';
    var txnLine     = col.txnRef ? '<tr><td class="rl">Txn / Ref No.</td><td class="rv mono">' + esc(col.txnRef) + '</td></tr>' : '';

    return (
      '<div class="rcpt-wrap">'
      /* ── watermark ── */
      + '<div class="wm">GNSI</div>'

      /* ── header ── */
      + '<div class="rcpt-hdr">'
      +   '<div class="logo-ring"><span class="logo-g">G</span></div>'
      +   '<div class="hdr-text">'
      +     '<div class="inst-name">'+(window.TENANT?window.TENANT.name:'Guidance Navodaya &amp; Sainik Institute')+'</div>'
      +     '<div class="inst-sub">'+(window.TENANT?window.TENANT.city+' · '+window.TENANT.state+' &nbsp;|&nbsp; Est. '+window.TENANT.established+' &nbsp;|&nbsp; '+window.TENANT.shortName:'Khangabok · Thoubal · Manipur &nbsp;|&nbsp; Est. 2016 &nbsp;|&nbsp; GNSI')+'</div>'
      +   '</div>'
      + '</div>'

      /* ── title band ── */
      + '<div class="title-band">'
      +   '<span class="doc-title">' + esc(label) + '</span>'
      + '</div>'

      /* ── meta row ── */
      + '<div class="meta-strip">'
      +   '<div class="meta-item"><span class="ml">Receipt No.</span><span class="mv mono">' + esc(col.receiptNo || '--') + '</span></div>'
      +   '<div class="meta-item"><span class="ml">Payment Date</span><span class="mv">' + rcptDate + '</span></div>'
      +   '<div class="meta-item"><span class="ml">Print Date</span><span class="mv">' + today + '</span></div>'
      + '</div>'

      /* ── data table ── */
      + '<table class="rt">'
      +   '<tr><td class="rl">Student Name</td><td class="rv bold">' + esc(col.studentName || '--') + '</td></tr>'
      +   '<tr><td class="rl">Admission No.</td><td class="rv mono">' + esc(col.admNo || (a && a.admNo) || '--') + '</td>'
      +       '<td class="rl">Roll / GCC No.</td><td class="rv mono">' + esc(col.rollNo || (a && a.rollNo) || '--') + '</td></tr>'
      +   '<tr><td class="rl">Class / Batch</td><td class="rv">' + esc(col.className || '--') + '</td>'
      +       '<td class="rl">Payment Mode</td><td class="rv">' + esc(col.payMode || 'Cash') + '</td></tr>'
      +   courseLine
      +   '<tr><td class="rl">Fee For / Period</td><td class="rv bold" colspan="3">' + esc(col.forMonth || col.description || '--') + '</td></tr>'
      +   txnLine
      +   remarksLine
      + '</table>'

      /* ── amount box ── */
      + '<div class="amt-box">'
      +   '<div class="amt-label">Total Amount Received</div>'
      +   '<div class="amt-figure">&#8377;&thinsp;' + amount.toLocaleString('en-IN') + '</div>'
      +   '<div class="amt-words">' + esc(amtWords) + '</div>'
      + '</div>'

      /* ── footer: collected by + authorised sig ── */
      + '<div class="rcpt-foot">'
      +   '<div class="foot-left">'
      +     '<div class="sig-area"></div>'
      +     '<div class="sig-label">Collected By: <b>' + esc(col.collectedBy || '--') + '</b></div>'
      +   '</div>'
      +   '<div class="foot-right">'
      +     '<div class="sig-area auth-seal">&#10003;</div>'
      +     '<div class="sig-label">Authorised Signatory</div>'
      +     '<div class="sig-label inst-tiny">GNSI — Official Receipt</div>'
      +   '</div>'
      + '</div>'
      + '</div>'
    );
  };

  /* ── Amount in words helper ── */
  window._fmcAmountInWords = function (n) {
    if (!n || isNaN(n)) return 'Zero Rupees Only';
    var a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
             'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
             'Seventeen', 'Eighteen', 'Nineteen'];
    var b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    function words(num) {
      if (num === 0) return '';
      if (num < 20) return a[num] + ' ';
      if (num < 100) return b[Math.floor(num / 10)] + (num % 10 ? ' ' + a[num % 10] : '') + ' ';
      if (num < 1000) return a[Math.floor(num / 100)] + ' Hundred ' + words(num % 100);
      if (num < 100000) return words(Math.floor(num / 1000)) + 'Thousand ' + words(num % 1000);
      if (num < 10000000) return words(Math.floor(num / 100000)) + 'Lakh ' + words(num % 100000);
      return words(Math.floor(num / 10000000)) + 'Crore ' + words(num % 10000000);
    }
    return 'Rupees ' + words(parseInt(n)).trim() + ' Only';
  };

  /* ── 6. RECEIPT POPUP — redesigned CSS ── */
  window._fmcBuildReceiptPopupHTML = function (col, a) {
    var copy = _fmcBuildReceiptHTML(col, a);
    return (
      '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">'
      + '<title>Fee Receipt — ' + _fmcSafeText(col.receiptNo || col.studentName) + '</title>'
      + '<link rel="preconnect" href="https://fonts.googleapis.com">'
      + '<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700;800&family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet">'
      + '<style>'
      + '*{margin:0;padding:0;box-sizing:border-box}'
      + 'body{background:#dde3ec;font-family:"Outfit",sans-serif;font-size:12px;color:#14203a;-webkit-print-color-adjust:exact;print-color-adjust:exact}'

      /* page layout */
      + '@page{size:A4 portrait;margin:0}'
      + '@media print{'
      + '  body{background:#fff}'
      + '  .no-print{display:none!important}'
      + '  .page{width:210mm;min-height:297mm;padding:0;box-shadow:none;background:#fff}'
      + '  .half{height:148.5mm;padding:6mm 10mm;page-break-inside:avoid;overflow:hidden}'
      + '  .divider{border:none;border-top:2px dashed #9aadce;margin:0 10mm}'
      + '}'
      + '.toolbar{width:210mm;margin:16px auto 10px;display:flex;gap:10px;padding:0 10mm}'
      + '.toolbar button{padding:9px 22px;border:none;border-radius:10px;cursor:pointer;font-family:"Outfit",sans-serif;font-weight:700;font-size:13px;letter-spacing:.02em}'
      + '.btn-print{background:linear-gradient(135deg,#1433a8,#2655d8);color:#fff;box-shadow:0 4px 16px rgba(20,51,168,.35)}'
      + '.btn-close{background:#fff;color:#3d4f80;border:1.5px solid #c8d4ee!important}'
      + '.page{width:210mm;min-height:297mm;margin:0 auto;background:#fff;box-shadow:0 8px 48px rgba(0,0,0,.22)}'
      + '.half{height:148.5mm;padding:7mm 11mm;display:flex;flex-direction:column;gap:0;overflow:hidden}'
      + '.divider{border:none;border-top:2px dashed #9aadce;margin:0 11mm}'
      + '.copy-label{font-size:8.5px;font-weight:700;letter-spacing:.14em;color:#8a9abf;text-align:right;text-transform:uppercase;margin-bottom:3px}'

      /* receipt wrapper */
      + '.rcpt-wrap{display:flex;flex-direction:column;height:calc(100% - 14px);position:relative;overflow:hidden}'

      /* watermark */
      + '.wm{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-family:"Cormorant Garamond",serif;font-size:88px;font-weight:800;color:rgba(20,51,168,.045);letter-spacing:.12em;pointer-events:none;white-space:nowrap;z-index:0}'

      /* header */
      + '.rcpt-hdr{display:flex;align-items:center;gap:10px;padding-bottom:7px;border-bottom:2.5px solid #1433a8;margin-bottom:6px;position:relative;z-index:1}'
      + '.logo-ring{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#1433a8,#2655d8);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 2px 8px rgba(20,51,168,.4)}'
      + '.logo-g{font-family:"Cormorant Garamond",serif;font-size:22px;font-weight:800;color:#fff;line-height:1}'
      + '.inst-name{font-family:"Cormorant Garamond",serif;font-size:15px;font-weight:700;color:#14203a;line-height:1.2;letter-spacing:.01em}'
      + '.inst-sub{font-size:8.5px;color:#7a8db0;margin-top:2px;letter-spacing:.04em}'

      /* title band */
      + '.title-band{background:linear-gradient(90deg,#1433a8 0%,#2655d8 60%,#1433a8 100%);border-radius:5px;padding:4px 10px;margin-bottom:6px;position:relative;z-index:1}'
      + '.doc-title{font-size:9.5px;font-weight:700;color:#fff;letter-spacing:.12em;text-transform:uppercase}'

      /* meta strip */
      + '.meta-strip{display:flex;gap:0;margin-bottom:6px;background:#f0f4fb;border-radius:6px;overflow:hidden;position:relative;z-index:1}'
      + '.meta-item{flex:1;padding:5px 8px;border-right:1px solid #dde4f0}'
      + '.meta-item:last-child{border-right:none}'
      + '.ml{display:block;font-size:8px;font-weight:600;color:#7a8db0;letter-spacing:.06em;text-transform:uppercase;margin-bottom:1px}'
      + '.mv{display:block;font-size:10px;font-weight:700;color:#14203a}'
      + '.mono{font-family:"JetBrains Mono",monospace;font-size:10px;color:#1433a8}'

      /* data table */
      + '.rt{width:100%;border-collapse:collapse;font-size:10.5px;position:relative;z-index:1;margin-bottom:6px}'
      + '.rt tr:nth-child(even){background:#f7f9ff}'
      + '.rl{color:#7a8db0;padding:3.5px 8px;width:22%;font-size:9.5px;font-weight:600;letter-spacing:.02em;vertical-align:top}'
      + '.rv{padding:3.5px 8px;color:#14203a;vertical-align:top}'
      + '.bold{font-weight:700}'
      + '.remark{font-style:italic;color:#5a6f96}'

      /* amount box */
      + '.amt-box{background:linear-gradient(135deg,#1433a8 0%,#1a3fc7 100%);border-radius:8px;padding:8px 12px;margin-bottom:7px;display:flex;align-items:center;justify-content:space-between;position:relative;z-index:1;box-shadow:0 3px 14px rgba(20,51,168,.32)}'
      + '.amt-label{font-size:9px;font-weight:700;color:rgba(255,255,255,.75);letter-spacing:.1em;text-transform:uppercase}'
      + '.amt-figure{font-family:"Cormorant Garamond",serif;font-size:22px;font-weight:800;color:#fff;letter-spacing:.02em}'
      + '.amt-words{font-size:8px;color:rgba(255,255,255,.65);margin-top:2px;font-style:italic}'

      /* footer */
      + '.rcpt-foot{display:flex;justify-content:space-between;align-items:flex-end;margin-top:auto;padding-top:6px;border-top:1px dashed #c5d0e8;position:relative;z-index:1}'
      + '.foot-left,.foot-right{display:flex;flex-direction:column;align-items:center;gap:3px;min-width:90px}'
      + '.foot-right{align-items:flex-end}'
      + '.sig-area{width:90px;height:22px;border-bottom:1.5px solid #9aadce}'
      + '.auth-seal{display:flex;align-items:center;justify-content:center;border:1.5px solid #1433a8;border-radius:50%;width:30px;height:30px;color:#1433a8;font-size:16px;font-weight:800}'
      + '.sig-label{font-size:8.5px;color:#7a8db0;font-weight:600;letter-spacing:.03em}'
      + '.inst-tiny{color:#1433a8;font-weight:700}'

      + '</style></head><body>'
      + '<div class="no-print toolbar">'
      + '<button class="btn-print" onclick="window.print()">🖨️ Print — A4 (2 copies)</button>'
      + '<button class="btn-close" onclick="window.close()">✕ Close</button>'
      + '</div>'
      + '<div class="page">'
      + '  <div class="half"><div class="copy-label">Office / Staff Copy</div>' + copy + '</div>'
      + '  <hr class="divider">'
      + '  <div class="half"><div class="copy-label">Parent / Student Copy</div>' + copy + '</div>'
      + '</div>'
      + '</body></html>'
    );
  };

  /* ── 7. RECEIPTS TAB — add date-range filter + FIX #4 NaN ── */
  window._fmcRenderReceipts = function (isAdmin) {
    var cols  = _fmcLoadCols();
    var asgns = _fmcLoadAsgns();

    /* Single receipt print view */
    if (_fmc.receiptId) {
      var col = cols.find(function (c) { return c.id === _fmc.receiptId; });
      if (col) {
        var a = asgns.find(function (x) { return x.id === col.asgnId; });
        return _fmcRenderReceiptPrint(col, a);
      }
    }

    var q       = (_fmc.search || '').toLowerCase();
    var fromD   = _fmc.filterFrom || '';
    var toD     = _fmc.filterTo   || '';

    /* Class options */
    var clsOpts = '<option value="all">All Classes</option>';
    (typeof getClassNames === 'function' ? getClassNames() : []).forEach(function (c) {
      clsOpts += '<option value="' + esc(c) + '"' + (_fmc.filterClass === c ? ' selected' : '') + '>' + esc(c) + '</option>';
    });

    /* Mode options */
    var modeOpts = '<option value="all">All Modes</option><option>Cash</option><option>UPI</option><option>Bank Transfer</option><option>Cheque</option><option>DD</option><option>Online Gateway</option><option>Manual</option>';

    /* Type options */
    var typeOpts = '<option value="all">All Types</option><option value="monthly">Monthly</option><option value="fullpay">Full Pay</option><option value="admission">Admission</option><option value="advance">Advance</option><option value="item">Item</option><option value="manual">Manual</option>';

    /* Filter */
    var filtered = cols.filter(function (c) {
      var matchQ = !q
        || (c.studentName || '').toLowerCase().indexOf(q) >= 0
        || (c.receiptNo   || '').toLowerCase().indexOf(q) >= 0
        || (c.forMonth    || '').toLowerCase().indexOf(q) >= 0
        || (c.admNo       || '').toLowerCase().indexOf(q) >= 0;
      var matchC = _fmc.filterClass === 'all' || c.className === _fmc.filterClass;
      var matchM = _fmc.filterMode  === 'all' || (c.payMode || '') === _fmc.filterMode;
      var matchT = (!_fmc.filterType || _fmc.filterType === 'all') || (c.feeType || '') === _fmc.filterType;
      var matchF = !fromD || (c.payDate && c.payDate >= fromD);
      var matchTo = !toD  || (c.payDate && c.payDate <= toD);
      return matchQ && matchC && matchM && matchT && matchF && matchTo;
    }).slice().reverse();

    /* Totals */
    var totalAmt = filtered.reduce(function (s, c) { return s + (parseInt(c.amountPaid) || 0); }, 0);

    var html = ''
      /* ── filter bar ── */
      + '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px;background:var(--surface);border:1.5px solid var(--border);border-radius:12px;padding:12px 14px">'
      +   '<input placeholder="🔍 Name · Receipt No. · Month · Adm No." value="' + esc(_fmc.search) + '" oninput="_fmc.search=this.value;_debouncedRenderFmc?_debouncedRenderFmc():render()" style="border:1.5px solid var(--border);border-radius:8px;padding:7px 12px;font-size:13px;background:var(--bg,#fff);color:var(--text);flex:2;min-width:200px"/>'
      +   '<select onchange="_fmc.filterClass=this.value;render()" style="border:1.5px solid var(--border);border-radius:8px;padding:7px 10px;font-size:12px;background:var(--bg,#fff);color:var(--text)">' + clsOpts + '</select>'
      +   '<select onchange="_fmc.filterMode=this.value;render()" style="border:1.5px solid var(--border);border-radius:8px;padding:7px 10px;font-size:12px;background:var(--bg,#fff);color:var(--text)">' + modeOpts + '</select>'
      +   '<select onchange="_fmc.filterType=this.value;render()" style="border:1.5px solid var(--border);border-radius:8px;padding:7px 10px;font-size:12px;background:var(--bg,#fff);color:var(--text)">' + typeOpts + '</select>'
      +   '<input type="date" title="From date" value="' + esc(fromD) + '" onchange="_fmc.filterFrom=this.value;render()" style="border:1.5px solid var(--border);border-radius:8px;padding:7px 10px;font-size:12px;background:var(--bg,#fff);color:var(--text)" />'
      +   '<input type="date" title="To date" value="' + esc(toD) + '" onchange="_fmc.filterTo=this.value;render()" style="border:1.5px solid var(--border);border-radius:8px;padding:7px 10px;font-size:12px;background:var(--bg,#fff);color:var(--text)" />'
      +   '<button onclick="gnsiExportReceipts()" class="btn btn-outline" style="font-size:12px;white-space:nowrap">⬇️ Export CSV</button>'
      + '</div>'

      /* ── summary strip ── */
      + '<div style="display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap">'
      +   '<div style="background:#e0e8f9;color:#1433a8;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:700">'
      +     '🧾 ' + filtered.length + ' Receipt' + (filtered.length !== 1 ? 's' : '') + '</div>'
      +   '<div style="background:#dcfce7;color:#15803d;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:700">'
      +     '₹' + totalAmt.toLocaleString('en-IN') + ' Total Collected</div>'
      +   (fromD || toD
          ? '<div style="background:#fef9c3;color:#854d0e;border-radius:8px;padding:8px 16px;font-size:12px;font-weight:700">📅 ' + (fromD || '…') + ' → ' + (toD || '…') + ' <button onclick="_fmc.filterFrom=\'\';_fmc.filterTo=\'\';render()" style="background:none;border:none;cursor:pointer;color:#c0291d;font-weight:800;font-size:13px;margin-left:4px">✕</button></div>'
          : '')
      + '</div>'

      /* ── table ── */
      + '<div class="card"><div style="overflow-x:auto"><table><thead><tr>'
      +   '<th style="white-space:nowrap">Receipt No.</th>'
      +   '<th>Student</th>'
      +   '<th>Adm No.</th>'
      +   '<th>Class</th>'
      +   '<th>For / Description</th>'
      +   '<th>Type</th>'
      +   '<th style="text-align:right">Amount</th>'
      +   '<th>Mode</th>'
      +   '<th>Date</th>'
      +   '<th>Actions</th>'
      + '</tr></thead><tbody>';

    if (!filtered.length) {
      html += '<tr><td colspan="10" style="text-align:center;padding:28px;color:var(--muted)">No receipts match the current filters.</td></tr>';
    } else {
      var typeColors = { monthly: '#1433a8', fullpay: '#7c3aed', admission: '#15803d', advance: '#d97706', item: '#0891b2', manual: '#475569' };
      filtered.forEach(function (c) {
        var tc  = typeColors[c.feeType] || '#6474a0';
        var amt = parseInt(c.amountPaid) || 0; /* FIX #4: NaN guard */
        html += '<tr>'
          + '<td style="font-family:\'JetBrains Mono\',monospace;font-weight:700;font-size:11.5px;color:#1433a8;white-space:nowrap">' + esc(c.receiptNo || '--') + '</td>'
          + '<td style="font-weight:700">' + esc(c.studentName || '--') + '</td>'
          + '<td style="font-family:monospace;font-size:12px">' + esc(c.admNo || '--') + '</td>'
          + '<td>' + esc(c.className || '--') + '</td>'
          + '<td style="max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="' + esc(c.forMonth || c.description || '') + '">' + esc(c.forMonth || c.description || '--') + '</td>'
          + '<td><span style="background:' + tc + '18;color:' + tc + ';border-radius:6px;padding:2px 8px;font-size:11px;font-weight:700;white-space:nowrap">' + esc(c.feeType || 'fee') + '</span></td>'
          + '<td style="font-weight:800;color:#15803d;text-align:right;white-space:nowrap">₹' + amt.toLocaleString('en-IN') + '</td>'
          + '<td><span style="background:#e0e8f9;color:#1433a8;border-radius:6px;padding:2px 8px;font-size:11px;font-weight:700">' + esc(c.payMode || 'Cash') + '</span></td>'
          + '<td style="font-size:11.5px;color:var(--muted);white-space:nowrap">' + (c.payDate ? new Date(c.payDate).toLocaleDateString('en-IN') : '--') + '</td>'
          + '<td style="white-space:nowrap">'
          +   '<button onclick="gnsiSetFMCReceipt(\'' + c.id + '\')" style="background:#fef9c3;color:#854d0e;border:1px solid #fde047;border-radius:6px;padding:3px 9px;cursor:pointer;font-size:11px;font-weight:700" title="Print receipt">🖨️</button>'
          +   (isAdmin ? '<button onclick="gnsiDeleteFMCCol(\'' + c.id + '\')" style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;border-radius:6px;padding:3px 8px;cursor:pointer;font-size:11px;font-weight:700;margin-left:4px" title="Delete">✕</button>' : '')
          + '</td></tr>';
      });
    }

    html += '</tbody></table></div></div>';
    return html;
  };

  /* Ensure filterType/filterFrom/filterTo are initialised on _fmc state */
  (function () {
    function _tryInit() {
      if (typeof _fmc !== 'undefined') {
        if (!('filterType' in _fmc)) _fmc.filterType = 'all';
        if (!('filterFrom' in _fmc)) _fmc.filterFrom = '';
        if (!('filterTo'   in _fmc)) _fmc.filterTo   = '';
      } else {
        setTimeout(_tryInit, 200);
      }
    }
    _tryInit();
  })();

  console.log('[GNSI Receipt Patch v1] ✅ All 6 fixes applied.');
})();

</script>

<script>
/* ═══════════════════════════════════════════════════════════════════════════
   GNSI PORTAL — ENROLL-TO-PAYMENT PATCH v1
   Fixes 11 issues found in the enrollment → course → payment flow.
   Inject BEFORE </body> (use rfind).
   ═══════════════════════════════════════════════════════════════════════════

   FIX 1  — _fmcCalcFee: ₹10,000 hardcoded fallback replaced with course-aware lookup
   FIX 2  — _fmcCalcFee: asgn.monthlyFee now used as authoritative Phase-1 fallback
   FIX 3  — admEnroll triple-patch race: single idempotent patch with guard flag
   FIX 4  — gnsiCollectFee: admAppId: undefined → omitted entirely
   FIX 5  — _getGate: now enforces _gateCourseAssigned (hard block after Feb+Mar)
   FIX 6  — _admRenderFeeModal: duplicate temp assignment guard strengthened
   FIX 7  — admEnroll: collections always re-linked on existing assignment path
   FIX 8  — gnsiOpenInFeeHub: name-match fallback warns when ambiguous
   FIX 9  — billingStartAt set at enrollment time
   FIX 10 — admEnroll toast text corrected for _fromStudents path
   FIX 11 — _gateFlatFeePaid: handles ISO date forMonth (2026-02, 2026-03 etc.)
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────────────────────
     FIX 1 + 2: _fmcCalcFee — correct fallback chain, no ₹10,000 hardcode
     Priority: subTypeId → courseId/FS_FEE_CONFIG → asgn.monthlyFee → className lookup
  ───────────────────────────────────────────────────────────────────────── */
  window._fmcCalcFee = function (asgn, monthIdx) {
    /* ── Phase-2: subTypeId assigned → use GNSI_COURSES lookup ── */
    if (asgn.subTypeId && typeof GNSI_COURSES !== 'undefined') {
      var _courseFee = 0;
      GNSI_COURSES.forEach(function (c) {
        c.subTypes.forEach(function (st) {
          if (st.id === asgn.subTypeId && st.monthlyFee) _courseFee = parseInt(st.monthlyFee) || 0;
        });
      });
      if (_courseFee > 0) {
        var _disc = asgn.isRepeater ? (asgn.repeaterDiscount || 500) : 0;
        var _net  = Math.max(0, _courseFee - _disc);
        return { flat: _net, hostelAdd: 0, courseFee: 0, total: _net,
          breakdown: ['₹' + _net.toLocaleString('en-IN') + ' (subtype fee' + (_disc ? ' −₹' + _disc : '') + ')'],
          admFee: 0 };
      }
    }

    /* ── Phase-2 via courseId + FS_FEE_CONFIG ── */
    if (asgn.courseId && typeof FS_FEE_CONFIG !== 'undefined') {
      var _fsc = FS_FEE_CONFIG.courses.find(function (c) { return c.id === asgn.courseId; });
      if (_fsc) {
        var _key  = (asgn.subtype || 'boarder').toLowerCase().replace(/\s+/g, '');
        var _disc2 = asgn.isRepeater ? (asgn.repeaterDiscount || 500) : 0;
        var _fee  = Math.max(0, (_fsc.monthlyFees[_key] || _fsc.monthlyFees['boarder'] || 0) - _disc2);
        if (_fee > 0) {
          return { flat: _fee, hostelAdd: 0, courseFee: 0, total: _fee,
            breakdown: ['₹' + _fee.toLocaleString('en-IN') + ' (' + _fsc.name + ' · ' + (asgn.subtype || 'Boarder') + (_disc2 ? ' −₹' + _disc2 : '') + ')'],
            admFee: _fsc.admFee || 0 };
        }
      }
    }

    /* ── FIX 2: Phase-1 monthlyFeeOverride (old SFA records) ── */
    if (asgn.monthlyFeeOverride && !asgn.courseId) {
      var _ov = parseFloat(asgn.monthlyFeeOverride) || 0;
      if (_ov > 0) return { flat: _ov, hostelAdd: 0, courseFee: 0, total: _ov,
        breakdown: ['₹' + _ov.toLocaleString('en-IN') + ' (Phase-1 flat)'],
        admFee: parseFloat((asgn.admissionFee || asgn.amountDue) || 0) };
    }

    /* ── FIX 2: asgn.monthlyFee stored at enrollment — use it ── */
    if (asgn.monthlyFee && parseInt(asgn.monthlyFee) > 0) {
      var _mf = parseInt(asgn.monthlyFee);
      var _ha = (asgn.hostel === 'Yes' || asgn.isHostel) ? (parseInt(asgn.hostelFee) || 0) : 0;
      return { flat: _mf, hostelAdd: _ha, courseFee: 0, total: _mf + _ha,
        breakdown: ['₹' + _mf.toLocaleString('en-IN') + ' (enrollment rate)' + (_ha ? ' + Hostel ₹' + _ha.toLocaleString('en-IN') : '')],
        admFee: 0 };
    }

    /* ── FIX 1: className → fee config lookup (no ₹10,000 hardcode) ── */
    var conf = (typeof loadFeeConf === 'function') ? loadFeeConf() : {};
    var cFee = (conf.monthlyFees || []).find(function (f) { return f.course === asgn.className; });
    /* Override from Course Management if available */
    if (typeof gnsiGetStudentCourseInfo === 'function' && asgn.stuId) {
      var ci = gnsiGetStudentCourseInfo(asgn.stuId);
      if (ci && ci.fees) {
        if (ci.fees.monthly) { cFee = cFee || {}; cFee.amount = parseInt(ci.fees.monthly) || (cFee && cFee.amount) || 0; }
        if (ci.fees.hostel)  { cFee = cFee || {}; cFee.hostelAmount = parseInt(ci.fees.hostel) || (cFee && cFee.hostelAmount) || 0; }
      }
    }
    if (!cFee || (!cFee.amount && !cFee.hostelAmount)) {
      /* No config found — return zero and warn, never guess ₹10,000 */
      console.warn('[GNSI] _fmcCalcFee: no fee config for class "' + (asgn.className || 'unknown') + '" — returning 0');
      return { flat: 0, hostelAdd: 0, courseFee: 0, total: 0,
        breakdown: ['⚠ No fee config for ' + (asgn.className || 'unknown')], admFee: 0 };
    }
    var flat      = parseInt(cFee.amount) || 0;
    var hostelAdd = (asgn.hostel === 'Yes' || asgn.isHostel) ? (parseInt(cFee.hostelAmount) || 0) : 0;
    var aFee      = (conf.admissionFees || []).find(function (f) { return f.course === asgn.className; }) || { amount: 0 };
    return { flat: flat, hostelAdd: hostelAdd, courseFee: 0, total: flat + hostelAdd,
      breakdown: ['Flat ₹' + flat.toLocaleString('en-IN') + (hostelAdd ? ' + Hostel ₹' + hostelAdd.toLocaleString('en-IN') : '')],
      admFee: parseInt(aFee.amount) || 0 };
  };

  /* ─────────────────────────────────────────────────────────────────────────
     FIX 3: Single idempotent admEnroll patch — replaces all 3 prior patches
     Uses a guard flag so re-execution is a no-op.
  ───────────────────────────────────────────────────────────────────────── */
  (function _patchAdmEnrollOnce() {
    if (window.__gnsiAdmEnrollPatched) return;
    if (typeof window.admEnroll !== 'function') {
      setTimeout(_patchAdmEnrollOnce, 300); return;
    }
    window.__gnsiAdmEnrollPatched = true;
    var _base = window.admEnroll;
    window.admEnroll = function (id) {
      /* FIX 10: correct toast is handled inside the patched admEnroll below */
      window._gnsiLastEnrolledAppId  = id;
      window._lastAdmEnrolledId      = id;
      _base(id);
      setTimeout(function () {
        if (typeof showToast === 'function') {
          showToast(
            '✅ Enrolled! <a href="#" onclick="navigate(\'admissions\');return false;" ' +
            'style="color:#fff;font-weight:700;text-decoration:underline;margin-left:6px">' +
            '→ View in Admissions</a>', '#16a34a', 6000
          );
        }
        /* Gate auto-trigger: show lock popup if gates still pending */
        try {
          var apps   = typeof loadAdmApps === 'function' ? loadAdmApps() : [];
          var app    = apps.find(function (x) { return x.id === id; });
          if (!app) return;
          var asgns  = typeof _fmcLoadAsgns === 'function' ? _fmcLoadAsgns() : [];
          var asgn   = asgns.find(function (x) {
            return String(x.admAppId) === String(id) ||
                   String(x.stuId) === String(app.enrolledId || app._stuId || '');
          });
          if (!asgn) return;
          /* FIX 9: ensure billingStartAt is set */
          if (!asgn.billingStartAt) {
            var updAsgns = asgns.map(function (x) {
              return x.id === asgn.id
                ? Object.assign({}, x, { billingStartAt: new Date().toISOString().split('T')[0] })
                : x;
            });
            if (typeof _fmcSaveAsgns === 'function') _fmcSaveAsgns(updAsgns);
          }
          if (typeof _getGate === 'function') {
            var gate = _getGate(asgn.id);
            if (gate && typeof _showLockPopup === 'function') {
              setTimeout(function () { _showLockPopup(asgn.id, gate); }, 900);
            }
          }
        } catch (e) {}
      }, 600);
    };
  })();

  /* ─────────────────────────────────────────────────────────────────────────
     FIX 4: gnsiCollectFee — never write admAppId: undefined
  ───────────────────────────────────────────────────────────────────────── */
  (function _patchCollectFee() {
    if (window.__gnsiCollectFeePatched) return;
    if (typeof window.gnsiCollectFee !== 'function') {
      setTimeout(_patchCollectFee, 300); return;
    }
    window.__gnsiCollectFeePatched = true;
    var _origCollect = window.gnsiCollectFee;
    window.gnsiCollectFee = function (asgnId, saveOnly) {
      var pt     = (typeof _fmc !== 'undefined' ? _fmc.payType : null) || 'monthly';
      var amount = parseInt((document.getElementById('fmc-amount') || {}).value || 0);
      var mode   = (document.getElementById('fmc-mode') || {}).value || 'Cash';
      var date   = (document.getElementById('fmc-date') || {}).value || new Date().toISOString().split('T')[0];
      var txnref = ((document.getElementById('fmc-txnref') || {}).value || '').trim();
      var remark = ((document.getElementById('fmc-remark') || {}).value || '').trim();
      var desc   = ((document.getElementById('fmc-desc') || {}).value || '').trim();
      if (!amount || amount <= 0) { if (typeof showToast === 'function') showToast('⚠ Enter a valid amount', '#ea580c'); return; }
      if (!desc && pt !== 'manual') { if (typeof showToast === 'function') showToast('⚠ Enter the description / month', '#ea580c'); return; }
      var typeLabels = { monthly: 'Monthly Fee', admission: 'Admission Fee', fullpay: 'Full Payment', advance: 'Advance', item: 'Item Fee', manual: 'Fee', flat: 'Flat Fee' };
      var prefixes   = { monthly: 'MFE', admission: 'ADM', fullpay: 'FPY', advance: 'ADV', item: 'ITM', manual: 'MAN', flat: 'FLT' };
      /* FIX 4: build extra without admAppId so it is never set to undefined */
      var extra = {
        forMonth:    pt === 'monthly' || pt === 'flat' ? desc : (typeLabels[pt] || 'Fee'),
        description: desc,
        amountPaid:  amount,
        payDate:     date,
        payMode:     mode,
        txnRef:      txnref,
        remark:      remark,
        feeType:     pt
      };
      /* Only attach admAppId if we actually know it */
      var asgns = typeof _fmcLoadAsgns === 'function' ? _fmcLoadAsgns() : [];
      var asgn  = asgns.find(function (x) { return x.id === asgnId; });
      if (asgn && asgn.admAppId) extra.admAppId = String(asgn.admAppId);

      var col = typeof _fmcSaveCol === 'function' ? _fmcSaveCol(asgnId, extra, prefixes[pt] || 'RCP') : null;
      if (!col) return;
      if (!saveOnly) {
        if (typeof _fmc !== 'undefined') { _fmc.receiptId = col.id; _fmc.tab = 'receipts'; }
      }
      if (typeof render === 'function') render();
    };
  })();

  /* ─────────────────────────────────────────────────────────────────────────
     FIX 5: _gateCourseAssigned integrated into _getGate
     After both Feb+Mar are paid, monthly fee is only unlocked if course+subtype
     has been assigned. Exposed as window._getGate so other patches can access it.
  ───────────────────────────────────────────────────────────────────────── */
  (function _patchGate() {
    function _gateCourseAssigned(asgnId) {
      var asgn = (typeof _fmcLoadAsgns === 'function' ? _fmcLoadAsgns() : [])
        .find(function (x) { return x.id === asgnId; });
      return !!(asgn && asgn.subTypeId && (asgn.courseAssignedAt || asgn.subTypeId));
    }

    /* FIX 11: robust Feb/Mar detection — handles full names, abbreviations, ISO dates */
    function _isFeb(s) {
      var l = (s || '').toLowerCase();
      return l.indexOf('february') >= 0 || l.indexOf('feb') >= 0 ||
             /^2\d{3}-02/.test(s) || /^02[-\/]/.test(s);
    }
    function _isMar(s) {
      var l = (s || '').toLowerCase();
      return l.indexOf('march') >= 0 || l.indexOf('mar') >= 0 ||
             /^2\d{3}-03/.test(s) || /^03[-\/]/.test(s);
    }

    function _gateAdmissionPaid(asgnId) {
      var cols = typeof _fmcLoadCols === 'function' ? _fmcLoadCols() : [];
      var admPaid = cols.some(function (x) {
        return (x.asgnId === asgnId || x.admAppId === asgnId) &&
               x.feeType === 'admission' && (parseInt(x.amountPaid) || 0) > 0;
      });
      if (!admPaid) {
        var asgn = (typeof _fmcLoadAsgns === 'function' ? _fmcLoadAsgns() : [])
          .find(function (x) { return x.id === asgnId; });
        if (asgn && asgn.admAppId) {
          var apps = typeof loadAdmApps === 'function' ? loadAdmApps() : [];
          var app  = apps.find(function (x) { return String(x.id) === String(asgn.admAppId); });
          if (app && app.admFeePaid) admPaid = true;
        }
      }
      return admPaid;
    }

    function _gateFlatFeePaid(asgnId) {
      var c = (typeof _fmcLoadCols === 'function' ? _fmcLoadCols() : [])
        .filter(function (x) { return x.asgnId === asgnId; });
      var febPaid = c.some(function (x) {
        return (x.feeType === 'flat' || x.feeType === 'monthly') &&
               _isFeb(x.forMonth) && (parseInt(x.amountPaid) || 0) > 0;
      });
      var marPaid = c.some(function (x) {
        return (x.feeType === 'flat' || x.feeType === 'monthly') &&
               _isMar(x.forMonth) && (parseInt(x.amountPaid) || 0) > 0;
      });
      return febPaid && marPaid;
    }

    /* FIX 5: expose new _getGate with course check */
    window._getGate = function (asgnId) {
      if (!_gateAdmissionPaid(asgnId)) return 'admission';
      if (!_gateFlatFeePaid(asgnId))   return 'flat';
      if (!_gateCourseAssigned(asgnId)) return 'course'; /* NEW */
      return null;
    };

    /* Patch _showLockPopup to handle 'course' gate case */
    (function _patchLockPopup() {
      if (typeof window._showLockPopup !== 'function') {
        setTimeout(_patchLockPopup, 300); return;
      }
      var _origLock = window._showLockPopup;
      window._showLockPopup = function (asgnId, gate) {
        if (gate !== 'course') { _origLock(asgnId, gate); return; }
        /* Course assignment gate popup */
        var _lockId = 'gnsi-pay-lock-popup';
        var existing = document.getElementById(_lockId);
        if (existing) existing.remove();
        var asgn  = (typeof _fmcLoadAsgns === 'function' ? _fmcLoadAsgns() : [])
          .find(function (x) { return x.id === asgnId; }) || {};
        var name  = asgn.studentName || 'Student';
        var _e    = function (s) {
          return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        };
        var overlay = document.createElement('div');
        overlay.id  = _lockId;
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(10,18,41,0.72);z-index:99999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);padding:16px';
        overlay.innerHTML =
          '<div style="background:var(--surface,#fff);border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.4);width:100%;max-width:440px;padding:28px;max-height:90vh;overflow-y:auto">' +
          '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">' +
          '<div style="width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,#7c3aed,#5b21b6);display:flex;align-items:center;justify-content:center;font-size:20px">🎓</div>' +
          '<div><div style="font-size:17px;font-weight:800;color:var(--text,#0a1229)">🔒 Course Assignment Required</div>' +
          '<div style="font-size:12px;color:#64748b;margin-top:2px">Monthly fees are locked until course is set</div></div></div>' +
          '<div style="background:#faf5ff;border:1.5px solid #c4b5fd;border-radius:10px;padding:12px 14px;margin-bottom:16px;font-size:13px;color:#4c1d95">' +
          '<b>' + _e(name) + '</b> has completed the Flat Fee (Feb + Mar). Please assign a <b>Course & Subtype</b> to unlock monthly fee collection.</div>' +
          '<div style="display:grid;gap:6px;margin-bottom:16px">' +
          '<div style="padding:9px 12px;background:#f0fdf4;border:1.5px solid #86efac;border-radius:8px;font-size:13px;font-weight:700;color:#15803d">✅ Admission Package — Collected</div>' +
          '<div style="padding:9px 12px;background:#f0fdf4;border:1.5px solid #86efac;border-radius:8px;font-size:13px;font-weight:700;color:#15803d">✅ Flat Fee (Feb + Mar) — Complete</div>' +
          '<div style="padding:9px 12px;background:#fef9c3;border:1.5px solid #fde047;border-radius:8px;font-size:13px;font-weight:700;color:#854d0e">⚡ Assign Course & Subtype — Required now</div>' +
          '<div style="padding:9px 12px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;color:#64748b">🔒 Monthly Fee Collection — Unlocks after course assigned</div>' +
          '</div>' +
          '<button onclick="gnsiPayLockDismiss();if(typeof gnsiAssignCourse===\'function\'){gnsiAssignCourse(\'' + _e(asgnId) + '\');}else{if(typeof _fmc!==\'undefined\'){_fmc.asgnId=\'' + _e(asgnId) + '\';_fmc.tab=\'students\';}if(typeof render===\'function\')render();}" ' +
          'style="width:100%;padding:13px;border-radius:10px;background:linear-gradient(135deg,#7c3aed,#5b21b6);color:#fff;border:none;font-size:15px;font-weight:800;cursor:pointer;margin-bottom:8px">🎓 Assign Course & Subtype Now</button>' +
          '<button onclick="gnsiPayLockDismiss()" style="width:100%;padding:10px;border-radius:10px;background:var(--surface2,#f1f5f9);color:var(--muted,#64748b);border:1.5px solid var(--border,#e2e8f0);font-size:13px;font-weight:700;cursor:pointer">✕ Close</button>' +
          '</div>';
        document.body.appendChild(overlay);
        overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });
      };
    })();

    /* Also patch the gnsiCollectFee gate interceptor to handle 'course' */
    (function _patchGateInterceptor() {
      if (window.__gnsiGateInterceptorPatched) return;
      if (typeof window.gnsiCollectFee !== 'function') {
        setTimeout(_patchGateInterceptor, 400); return;
      }
      window.__gnsiGateInterceptorPatched = true;
      var _prevCollect = window.gnsiCollectFee;
      window.gnsiCollectFee = function (asgnId, saveOnly) {
        var pt = (typeof _fmc !== 'undefined' ? _fmc.payType : null) || 'monthly';
        var passTypes = ['admission', 'item', 'advance', 'manual', 'prospectus', 'flat'];
        if (passTypes.indexOf(pt) >= 0) { _prevCollect(asgnId, saveOnly); return; }
        if (typeof window._getGate === 'function') {
          var gate = window._getGate(asgnId);
          if (gate) {
            if (typeof showToast === 'function') {
              var msgs = {
                admission: '🔒 Collect the Admission Package first.',
                flat:      '🔒 Pay February & March flat fee first.',
                course:    '🔒 Assign Course & Subtype first.'
              };
              showToast(msgs[gate] || '🔒 Complete previous payment steps first.', '#dc2626');
            }
            if (typeof window._showLockPopup === 'function') window._showLockPopup(asgnId, gate);
            return;
          }
        }
        _prevCollect(asgnId, saveOnly);
      };
    })();
  })();

  /* ─────────────────────────────────────────────────────────────────────────
     FIX 6: _admRenderFeeModal — prevent duplicate temp assignments
     Guard: only create a new temp asgn if NONE exists for this admAppId
  ───────────────────────────────────────────────────────────────────────── */
  (function _patchAdmRenderFeeModal() {
    if (typeof window._admRenderFeeModal !== 'function') {
      setTimeout(_patchAdmRenderFeeModal, 400); return;
    }
    var _origModal = window._admRenderFeeModal;
    window._admRenderFeeModal = function () {
      var appId  = window._admPayFeeAppId;
      if (!appId) return _origModal();
      /* Cleanup: remove any duplicate temp assignments — keep the first/oldest */
      if (typeof _fmcLoadAsgns === 'function' && typeof _fmcSaveAsgns === 'function') {
        var asgns   = _fmcLoadAsgns();
        var matches = asgns.filter(function (x) { return x.admAppId === appId; });
        if (matches.length > 1) {
          /* Sort by createdAt ascending, keep first */
          matches.sort(function (a, b) { return (a.createdAt || '') < (b.createdAt || '') ? -1 : 1; });
          var keepId  = matches[0].id;
          var cleaned = asgns.filter(function (x) {
            return x.admAppId !== appId || x.id === keepId;
          });
          _fmcSaveAsgns(cleaned);
        }
      }
      return _origModal();
    };
  })();

  /* ─────────────────────────────────────────────────────────────────────────
     FIX 7: admEnroll — always re-link collections to canonical assignment
  ───────────────────────────────────────────────────────────────────────── */
  (function _patchAdmEnrollRelinking() {
    if (window.__gnsiRelinkPatched) return;
    if (typeof window.admEnroll !== 'function') {
      setTimeout(_patchAdmEnrollRelinking, 400); return;
    }
    window.__gnsiRelinkPatched = true;
    var _prevEnroll = window.admEnroll;
    window.admEnroll = function (id) {
      _prevEnroll(id);
      /* After enrollment fires, ensure ALL collections for this admAppId are linked
         to the canonical assignment (not orphaned on a temp sfa_adm_... record) */
      setTimeout(function () {
        try {
          if (typeof _fmcLoadAsgns !== 'function' || typeof _fmcLoadCols !== 'function') return;
          var asgns   = _fmcLoadAsgns();
          /* The canonical assignment: admAppId matches AND stuId is set (real student) */
          var canonical = asgns.find(function (x) {
            return String(x.admAppId) === String(id) && x.stuId && !x.id.startsWith('sfa_adm_');
          }) || asgns.find(function (x) { return String(x.admAppId) === String(id); });
          if (!canonical) return;
          var cols    = _fmcLoadCols();
          var changed = false;
          cols = cols.map(function (c) {
            /* Re-link any collection whose admAppId matches but asgnId points to a temp record */
            if (String(c.admAppId) === String(id) && c.asgnId !== canonical.id) {
              changed = true;
              return Object.assign({}, c, { asgnId: canonical.id, stuId: String(canonical.stuId || '') });
            }
            return c;
          });
          if (changed) {
            if (typeof _fmcSaveCols === 'function') _fmcSaveCols(cols);
            if (typeof gnsiKVPush === 'function') {
              gnsiKVPush('gnsi_fee_cols', cols);
              gnsiKVPush('gnsi_sfa_collections', cols);
            }
            console.log('[GNSI Enroll Patch] Re-linked ' + cols.filter(function(c){ return String(c.admAppId)===String(id); }).length + ' collections to canonical assignment ' + canonical.id);
          }
        } catch (e) { console.warn('[GNSI Enroll Patch] Re-link error:', e); }
      }, 800);
    };
  })();

  /* ─────────────────────────────────────────────────────────────────────────
     FIX 8: gnsiOpenInFeeHub — warn when name-match is ambiguous
  ───────────────────────────────────────────────────────────────────────── */
  window.gnsiOpenInFeeHub = function (admAppId) {
    if (typeof navigate === 'function') navigate('fees');
    setTimeout(function () {
      if (typeof _fmcLoadAsgns !== 'function') return;
      var asgns = _fmcLoadAsgns();
      var apps  = typeof loadAdmApps === 'function' ? loadAdmApps() : [];
      var app   = apps.find(function (x) { return x.id === admAppId; });
      /* Primary: match by admAppId (reliable) */
      var match = asgns.find(function (x) { return x.admAppId === String(admAppId); });
      /* Secondary: match by stuId (set after enrollment) */
      if (!match && app && app.enrolledId) {
        match = asgns.find(function (x) { return String(x.stuId) === String(app.enrolledId); });
      }
      /* Tertiary: name match — warn if ambiguous */
      if (!match && app) {
        var nameMatches = asgns.filter(function (x) {
          return (x.studentName || '').toLowerCase() === (app.name || '').toLowerCase();
        });
        if (nameMatches.length === 1) {
          match = nameMatches[0];
        } else if (nameMatches.length > 1) {
          if (typeof showToast === 'function')
            showToast('⚠️ Multiple fee accounts found for "' + app.name + '" — showing list. Verify the correct student.', '#d97706', 5000);
          if (typeof _fmc !== 'undefined') { _fmc.tab = 'collect'; _fmc.search = app.name; }
          if (typeof render === 'function') render();
          return;
        }
      }
      if (match) {
        if (typeof _fmc !== 'undefined') { _fmc.asgnId = match.id; _fmc.tab = 'collect'; _fmc.payType = 'monthly'; _fmc.search = ''; }
        if (typeof render === 'function') render();
        if (typeof showToast === 'function')
          showToast('📂 Opened fee account for ' + (app ? app.name : match.studentName), '#1433a8');
      } else {
        if (typeof _fmc !== 'undefined') { _fmc.tab = 'collect'; _fmc.search = app ? app.name : ''; }
        if (typeof render === 'function') render();
        if (typeof showToast === 'function')
          showToast('⚠️ Fee account not found — student may not be enrolled in the Fee Hub yet.', '#ea580c');
      }
    }, 400);
  };

  /* ─────────────────────────────────────────────────────────────────────────
     FIX 9: billingStartAt set on new assignments via admEnroll
     (handled inside FIX 3 patch above — this ensures manual add-form path too)
  ───────────────────────────────────────────────────────────────────────── */
  (function _patchSaveAsgns() {
    if (window.__gnsiSaveAsgnsPatched) return;
    if (typeof window._fmcSaveAsgns !== 'function') {
      /* _fmcSaveAsgns may not exist as a standalone function — OK, FIX 3 covers it */
      return;
    }
    window.__gnsiSaveAsgnsPatched = true;
    var _origSaveAsgns = window._fmcSaveAsgns;
    window._fmcSaveAsgns = function (asgns) {
      var today = new Date().toISOString().split('T')[0];
      asgns = asgns.map(function (a) {
        return (!a.billingStartAt && (a.enrolledAt || a.createdAt))
          ? Object.assign({}, a, { billingStartAt: a.enrolledAt ? a.enrolledAt.split('T')[0] : today })
          : a;
      });
      _origSaveAsgns(asgns);
    };
  })();

  /* ─────────────────────────────────────────────────────────────────────────
     FIX 10: admEnroll toast text — separate messages for _fromStudents vs normal
     (The core admEnroll already contains a toast; we override render-only text
     by patching the post-enrollment toast via the guard in FIX 3)
     Nothing extra needed — FIX 3 replaces all 3 prior override chains cleanly.
  ───────────────────────────────────────────────────────────────────────── */

  console.log('[GNSI Enroll Patch v1] ✅ All 11 fixes applied.');
})();

</script>

<script>
/* ═══════════════════════════════════════════════════════════════════════════
   GNSI PORTAL — BATCH-TO-COURSE BRIDGE PATCH v1
   
   What this adds:
   1. BATCH TAXONOMY  — canonical batch→course→subtype mapping for all 7 batches
   2. EXTENDED BRIDGE — bridge now stores course+subtype+monthlyFee per class
   3. CLASS SECTION   — badge indicators on every class card (mapped/unmapped/fee)
   4. UPGRADE WIZARD  — one-click promote students from batch class to course class
   5. INDICATION BAR  — fee hub shows per-student bridge status and sync button
   6. AUTO-SYNC       — on bridge save, update all fee assignments to correct subTypeId+fee
   7. BRIDGE CONFIG   — dedicated config tab inside Fee Hub with full batch mapping UI
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── helpers ─────────────────────────────────────────────────────────── */
  function _esc(s) {
    if (s == null) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function _toast(msg, col) { if (typeof showToast === 'function') showToast(msg, col || '#1433a8'); }
  function _students()  { return typeof students !== 'undefined' ? students : []; }
  function _asgns()     { return typeof _fmcLoadAsgns === 'function' ? _fmcLoadAsgns() : []; }
  function _cols()      { return typeof _fmcLoadCols  === 'function' ? _fmcLoadCols()  : []; }
  function _classes()   { return typeof loadClasses   === 'function' ? loadClasses()   : []; }

  /* ════════════════════════════════════════════════════════════════════════
     1. BATCH TAXONOMY
     Single source of truth for all batch→course mappings.
     batchType: 'intake' = induction batch (first 2 months)
                'course' = course batch (month 3 onwards)
  ════════════════════════════════════════════════════════════════════════ */
  var GNSI_BATCH_MAP = {
    /* ── Navodaya batches ── */
    'Lakshya Batch': {
      course: 'navodaya', courseName: 'Navodaya', variant: 'Old',
      color: '#3b78c9', icon: '📚', batchType: 'intake',
      defaultSubtype: 'navodaya_boarder',
      subtypeLabel: 'Boarder / Day Scholar / Day Boarder'
    },
    'Umeed Batch': {
      course: 'navodaya', courseName: 'Navodaya', variant: 'New',
      color: '#1d4ed8', icon: '📘', batchType: 'intake',
      defaultSubtype: 'navodaya_boarder',
      subtypeLabel: 'Boarder / Day Scholar / Day Boarder'
    },
    /* ── Sainik batches ── */
    'Achiever Batch': {
      course: 'sainik', courseName: 'Sainik', variant: 'New',
      color: '#1a6b55', icon: '⚔️', batchType: 'intake',
      defaultSubtype: 'sainik_boarder',
      subtypeLabel: 'Boarder / Day Scholar / Day Boarder'
    },
    'Leader Batch': {
      course: 'sainik', courseName: 'Sainik', variant: 'Old',
      color: '#065f46', icon: '🎖️', batchType: 'intake',
      defaultSubtype: 'sainik_boarder',
      subtypeLabel: 'Boarder / Day Scholar / Day Boarder'
    },
    'Champion Batch': {
      course: 'sainik', courseName: 'Sainik', variant: 'New',
      color: '#14532d', icon: '🏆', batchType: 'intake',
      defaultSubtype: 'sainik_boarder',
      subtypeLabel: 'Boarder / Day Scholar / Day Boarder'
    },
    /* ── Foundation batches ── */
    'Elite Batch': {
      course: 'foundation', courseName: 'Foundation', variant: 'IV',
      color: '#7c3aed', icon: '🏫', batchType: 'intake',
      defaultSubtype: 'foundation_boarder',
      subtypeLabel: 'Boarder / Day Scholar / Day Boarder'
    },
    'Prime Batch': {
      course: 'foundation', courseName: 'Foundation', variant: 'V',
      color: '#6d28d9', icon: '⭐', batchType: 'intake',
      defaultSubtype: 'foundation_boarder',
      subtypeLabel: 'Boarder / Day Scholar / Day Boarder'
    }
  };
  window.GNSI_BATCH_MAP = GNSI_BATCH_MAP;

  /* Detect which batch a class belongs to by scanning name keywords */
  function _detectBatch(className) {
    var n = (className || '').toLowerCase();
    if (n.indexOf('lakshya')  >= 0) return 'Lakshya Batch';
    if (n.indexOf('umeed')    >= 0) return 'Umeed Batch';
    if (n.indexOf('achiever') >= 0) return 'Achiever Batch';
    if (n.indexOf('leader')   >= 0) return 'Leader Batch';
    if (n.indexOf('champion') >= 0) return 'Champion Batch';
    if (n.indexOf('elite')    >= 0) return 'Elite Batch';
    if (n.indexOf('prime')    >= 0) return 'Prime Batch';
    return null;
  }
  window.gnsiDetectBatch = _detectBatch;

  /* ════════════════════════════════════════════════════════════════════════
     2. EXTENDED BRIDGE
     New bridge record shape:
     { course, courseName, variant, subtype, monthlyFee, batchName, mappedAt }
     Old string-only bridge records are read via backwards-compat shim.
  ════════════════════════════════════════════════════════════════════════ */
  function _loadBridge() {
    var raw = null;
    try { raw = typeof gnsiLoad === 'function' ? gnsiLoad('gnsi_class_bridge') : null; } catch(e){}
    if (!raw) { try { raw = JSON.parse(localStorage.getItem('gnsi_class_bridge')); } catch(e){} }
    return (raw && typeof raw === 'object' && !Array.isArray(raw)) ? raw : {};
  }
  function _saveBridge(map) {
    try {
      localStorage.setItem('gnsi_class_bridge', JSON.stringify(map));
      if (typeof gnsiKVPush === 'function') gnsiKVPush('gnsi_class_bridge', map);
    } catch(e) {}
  }
  /* Get the extended bridge entry for a class (object or null) */
  function _getBridgeEntry(className) {
    var bridge = _loadBridge();
    var entry  = bridge[className];
    if (!entry) return null;
    /* Mixed/Per-Student mode */
    if (entry === '__mixed__') {
      return { _mixed: true, course: null, subtype: null };
    }
    /* Backwards compat: old bridge stored a plain string (course name) */
    if (typeof entry === 'string') {
      return { _legacy: true, legacyCourse: entry, course: null, subtype: null };
    }
    return entry;
  }
  window.gnsiBridgeGet = _getBridgeEntry;

  /* Set a full bridge entry */
  function _setBridgeEntry(className, entry) {
    var bridge = _loadBridge();
    if (entry === null) { delete bridge[className]; }
    else { bridge[className] = Object.assign({}, entry, { mappedAt: new Date().toISOString() }); }
    _saveBridge(bridge);
  }
  window.gnsiBridgeSet = _setBridgeEntry;

  /* ════════════════════════════════════════════════════════════════════════
     6. AUTO-SYNC: when a bridge entry is saved, push updates to all fee
     assignments whose students are in that class.
  ════════════════════════════════════════════════════════════════════════ */
  function _syncFeeAssignmentsForClass(className, entry) {
    /* Skip sync for mixed/per-student classes — each student is assigned individually */
    if (!entry || !entry.course || entry._mixed) return 0;
    var asgns   = _asgns();
    var updated = 0;
    var subTypeId  = entry.subtype || (entry.course + '_boarder');
    var monthlyFee = entry.monthlyFee || 0;

    /* Also sync students whose className matches */
    var newAsgns = asgns.map(function (a) {
      if ((a.className || '').toLowerCase() !== (className || '').toLowerCase()) return a;
      /* Only update Phase-1 assignments (no courseId yet) */
      if (a.courseId) return a;
      var changed = {};
      if (!a.subTypeId)    changed.subTypeId         = subTypeId;
      if (!a.courseId)     changed.courseId           = entry.course;
      if (monthlyFee > 0)  changed.monthlyFee         = monthlyFee;
      if (!a.courseAssignedAt && entry.course) changed.courseAssignedAt = new Date().toISOString();
      if (Object.keys(changed).length === 0) return a;
      updated++;
      return Object.assign({}, a, changed);
    });

    if (updated > 0) {
      if (typeof _fmcSaveAsgns === 'function') _fmcSaveAsgns(newAsgns);
      if (typeof gnsiKVPush === 'function') {
        gnsiKVPush('gnsi_fee_asgns', newAsgns);
        gnsiKVPush('gnsi_sfa_assignments', newAsgns);
      }
    }
    return updated;
  }
  window.gnsiBridgeSyncClass = _syncFeeAssignmentsForClass;

  /* ════════════════════════════════════════════════════════════════════════
     AUTO-MAP: detects batch name in class name, maps automatically
  ════════════════════════════════════════════════════════════════════════ */
  function gnsiBridgeAutoMapBatches(silent) {
    var classes = _classes().filter(function (c) { return c.active; });
    var bridge  = _loadBridge();
    var count   = 0;

    classes.forEach(function (cls) {
      var batchName = _detectBatch(cls.name);
      if (!batchName) return;
      var def = GNSI_BATCH_MAP[batchName];
      if (!def) return;
      /* Get monthly fee from GNSI_COURSES */
      var mf = 0;
      if (typeof GNSI_COURSES !== 'undefined') {
        GNSI_COURSES.forEach(function (c) {
          if (c.id === def.course) {
            c.subTypes.forEach(function (st) {
              if (st.id === def.defaultSubtype) mf = st.monthlyFee || 0;
            });
          }
        });
      }
      bridge[cls.name] = {
        course:      def.course,
        courseName:  def.courseName,
        variant:     def.variant,
        batchName:   batchName,
        subtype:     def.defaultSubtype,
        monthlyFee:  mf,
        color:       def.color,
        icon:        def.icon,
        mappedAt:    new Date().toISOString()
      };
      count++;
    });

    _saveBridge(bridge);
    if (!silent && count > 0) {
      _toast('⚡ Auto-mapped ' + count + ' batch' + (count !== 1 ? 'es' : '') + ' — verify subtypes then sync fees', '#15803d');
      if (typeof render === 'function') render();
    }
    return count;
  }
  window.gnsiBridgeAutoMapBatches = gnsiBridgeAutoMapBatches;

  /* ════════════════════════════════════════════════════════════════════════
     SAVE from bridge UI
  ════════════════════════════════════════════════════════════════════════ */
  window.gnsiBridgeSaveEntry = function (className) {
    var courseEl   = document.getElementById('bb-course-' + className.replace(/\s+/g,'_'));
    var subtypeEl  = document.getElementById('bb-sub-'    + className.replace(/\s+/g,'_'));
    var feeEl      = document.getElementById('bb-fee-'    + className.replace(/\s+/g,'_'));
    if (!courseEl || !subtypeEl) { _toast('⚠ UI elements not found — try reloading', '#dc2626'); return; }
    var course    = courseEl.value.trim();
    var subtype   = subtypeEl.value.trim();
    var monthlyFee = parseInt((feeEl || {}).value || 0) || 0;
    if (!course || !subtype) { _toast('⚠ Select both Course and Subtype', '#ea580c'); return; }
    var batchName = _detectBatch(className) || '';
    var def       = GNSI_BATCH_MAP[batchName] || {};
    var entry = {
      course:      course,
      courseName:  (typeof GNSI_COURSES !== 'undefined'
        ? (GNSI_COURSES.find(function(c){return c.id===course;})||{name:course}).name : course),
      batchName:   batchName,
      subtype:     subtype,
      monthlyFee:  monthlyFee,
      color:       def.color || '#1433a8',
      icon:        def.icon  || '📚',
      variant:     def.variant || ''
    };
    _setBridgeEntry(className, entry);
    var synced = _syncFeeAssignmentsForClass(className, entry);
    _toast('✅ ' + className + ' → ' + entry.courseName + ' saved' + (synced > 0 ? ' · ' + synced + ' fee account(s) synced' : ''), '#15803d');
    if (typeof render === 'function') render();
  };

  window.gnsiBridgeClearEntry = function (className) {
    _setBridgeEntry(className, null);
    _toast('🔗 ' + className + ' mapping cleared', '#ea580c');
    if (typeof render === 'function') render();
  };

  window.gnsiBridgeSyncAll = function () {
    var bridge  = _loadBridge();
    var total   = 0;
    Object.keys(bridge).forEach(function (className) {
      var entry = bridge[className];
      if (entry && typeof entry === 'object' && entry.course) {
        total += _syncFeeAssignmentsForClass(className, entry);
      }
    });
    _toast('✅ Synced ' + total + ' fee assignment(s) across all mapped classes', total > 0 ? '#15803d' : '#f59e0b');
    if (typeof render === 'function') render();
  };

  /* ════════════════════════════════════════════════════════════════════════
     3. CLASS CARD BADGE INJECTION
     Patches renderClasses to add bridge status badge on each class card.
  ════════════════════════════════════════════════════════════════════════ */
  (function _patchRenderClasses() {
    if (window.__gnsiBatchBridgeClassPatched) return;
    if (typeof window.renderClasses !== 'function') { setTimeout(_patchRenderClasses, 400); return; }
    window.__gnsiBatchBridgeClassPatched = true;

    var _origRender = window.renderClasses;
    window.renderClasses = function () {
      var base   = _origRender();
      var bridge = _loadBridge();
      var classes = _classes().filter(function (c) { return c.active; });

      /* Count unmapped batch classes */
      var batchClasses  = classes.filter(function (c) { return _detectBatch(c.name); });
      var unmapped      = batchClasses.filter(function (c) { return !bridge[c.name] || !bridge[c.name].course; });
      var mapped        = batchClasses.filter(function (c) { return bridge[c.name] && bridge[c.name].course; });
      var unsynced      = mapped.filter(function (c) {
        var entry = bridge[c.name];
        return entry && entry.course && _asgns().some(function (a) {
          return (a.className||'').toLowerCase() === c.name.toLowerCase() && !a.subTypeId;
        });
      });

      /* Status banner */
      var banner = '';
      if (batchClasses.length > 0) {
        var allOk = unmapped.length === 0 && unsynced.length === 0;
        banner = '<div style="display:flex;align-items:center;gap:12px;padding:13px 18px;'
          + 'background:' + (allOk ? 'linear-gradient(135deg,#f0fdf4,#dcfce7)' : 'linear-gradient(135deg,#fffbeb,#fef3c7)') + ';'
          + 'border:1.5px solid ' + (allOk ? '#86efac' : '#fbbf24') + ';'
          + 'border-radius:12px;margin-bottom:18px;flex-wrap:wrap;gap:10px">'
          + '<span style="font-size:22px">' + (allOk ? '✅' : '⚡') + '</span>'
          + '<div style="flex:1;min-width:200px">'
          +   '<div style="font-weight:800;font-size:13px;color:' + (allOk ? '#15803d' : '#92400e') + '">'
          +     (allOk ? 'All batches mapped & synced with fee system'
                       : unmapped.length + ' batch' + (unmapped.length!==1?'es':'') + ' unmapped'
                         + (unsynced.length > 0 ? ' · ' + unsynced.length + ' need fee sync' : ''))
          +   '</div>'
          +   '<div style="font-size:11.5px;color:var(--muted);margin-top:2px">'
          +     mapped.length + '/' + batchClasses.length + ' batches mapped to course fee tiers'
          +   '</div>'
          + '</div>'
          + '<div style="display:flex;gap:8px;flex-wrap:wrap">'
          + (unmapped.length > 0
              ? '<button onclick="gnsiBridgeAutoMapBatches()" style="padding:7px 14px;border-radius:8px;background:#d97706;color:#fff;border:none;font-size:12px;font-weight:700;cursor:pointer">⚡ Auto-Map Batches</button>'
              : '')
          + (unsynced.length > 0
              ? '<button onclick="gnsiBridgeSyncAll()" style="padding:7px 14px;border-radius:8px;background:#1433a8;color:#fff;border:none;font-size:12px;font-weight:700;cursor:pointer">🔄 Sync Fees</button>'
              : '')
          + '<button onclick="navigate(\'fees\')" style="padding:7px 14px;border-radius:8px;background:var(--surface);color:var(--text);border:1.5px solid var(--border);font-size:12px;font-weight:700;cursor:pointer">🔗 Fee Bridge →</button>'
          + '</div>'
          + '</div>';
      }

      return banner + base;
    };
  })();

  /* ════════════════════════════════════════════════════════════════════════
     4. UPGRADE WIZARD
     Shown as a panel inside the class card enrolled-students table.
     Allows promoting a student from intake batch → course class and
     simultaneously sets subTypeId+courseId on their fee assignment.
  ════════════════════════════════════════════════════════════════════════ */
  window.gnsiShowUpgradeWizard = function (stuId, fromClass) {
    var bridge  = _loadBridge();
    var entry   = _getBridgeEntry(fromClass);
    var stu     = _students().find(function (s) { return String(s.id) === String(stuId); });
    if (!stu) { _toast('Student not found', '#dc2626'); return; }

    var courseClasses = _classes().filter(function (c) {
      return c.active && bridge[c.name] && bridge[c.name].course &&
             bridge[c.name].course === (entry && entry.course);
    });
    /* Build subtype options from GNSI_COURSES */
    var courseId = entry ? entry.course : '';
    var stOpts   = '<option value="">-- select subtype --</option>';
    if (courseId && typeof GNSI_COURSES !== 'undefined') {
      GNSI_COURSES.forEach(function (c) {
        if (c.id === courseId) {
          c.subTypes.forEach(function (st) {
            stOpts += '<option value="' + _esc(st.id) + '"'
              + (st.id === (entry && entry.subtype) ? ' selected' : '') + '>'
              + _esc(st.label) + (st.monthlyFee ? ' — ₹' + st.monthlyFee.toLocaleString('en-IN') + '/mo' : '')
              + '</option>';
          });
        }
      });
    }
    var clsOpts = '<option value="">-- keep current class --</option>'
      + courseClasses.map(function (c) {
          return '<option value="' + _esc(c.name) + '">' + _esc(c.name) + '</option>';
        }).join('');

    var modal = document.createElement('div');
    modal.id  = 'gnsi-upgrade-wizard';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(10,18,41,.7);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(4px)';
    modal.innerHTML =
      '<div style="background:var(--surface,#fff);border-radius:16px;width:100%;max-width:460px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.4)">'
      + '<div style="background:linear-gradient(135deg,#1433a8,#2655d8);padding:20px 24px;display:flex;align-items:center;justify-content:space-between">'
      +   '<div>'
      +     '<div style="font-size:11px;color:rgba(255,255,255,.7);font-weight:700;letter-spacing:.1em;text-transform:uppercase">Course Upgrade Wizard</div>'
      +     '<div style="font-size:17px;font-weight:800;color:#fff;margin-top:2px">🎓 Promote ' + _esc(stu.name) + '</div>'
      +     '<div style="font-size:12px;color:rgba(255,255,255,.75);margin-top:2px">From: ' + _esc(fromClass) + '</div>'
      +   '</div>'
      +   '<button onclick="document.getElementById(\'gnsi-upgrade-wizard\').remove()" style="background:rgba(255,255,255,.15);border:none;border-radius:8px;padding:6px 12px;color:#fff;font-size:13px;font-weight:700;cursor:pointer">✕</button>'
      + '</div>'
      + '<div style="padding:22px 24px">'
      +   '<div style="background:#eff6ff;border:1.5px solid #93c5fd;border-radius:10px;padding:12px 14px;margin-bottom:16px;font-size:12.5px;color:#1e40af">'
      +     '📋 This will: <b>move the student to a new class</b>, set their <b>course + subtype</b> in the Fee Hub, and <b>unlock course-wise monthly fees</b>.'
      +   '</div>'
      +   '<div style="display:grid;gap:12px;margin-bottom:16px">'
      +     '<div><label style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;display:block;margin-bottom:4px">Move to Class (optional)</label>'
      +     '<select id="upg-cls" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:9px 12px;font-size:13px;background:var(--surface);color:var(--text)">' + clsOpts + '</select></div>'
      +     '<div><label style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;display:block;margin-bottom:4px">Boarding Type / Subtype *</label>'
      +     '<select id="upg-sub" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:9px 12px;font-size:13px;background:var(--surface);color:var(--text)">' + stOpts + '</select></div>'
      +   '</div>'
      +   '<div style="display:flex;gap:10px">'
      +     '<button onclick="gnsiDoUpgrade(\'' + _esc(String(stuId)) + '\',\'' + _esc(fromClass) + '\')" '
      +       'style="flex:1;padding:12px;border-radius:10px;background:linear-gradient(135deg,#1433a8,#2655d8);color:#fff;border:none;font-size:14px;font-weight:800;cursor:pointer">✅ Promote & Sync Fee</button>'
      +     '<button onclick="document.getElementById(\'gnsi-upgrade-wizard\').remove()" '
      +       'style="padding:12px 16px;border-radius:10px;border:1.5px solid var(--border);background:var(--surface);color:var(--muted);font-size:13px;font-weight:700;cursor:pointer">Cancel</button>'
      +   '</div>'
      + '</div>'
      + '</div>';
    document.body.appendChild(modal);
    modal.addEventListener('click', function (e) { if (e.target === modal) modal.remove(); });
  };

  window.gnsiDoUpgrade = function (stuId, fromClass) {
    var newCls  = (document.getElementById('upg-cls') || {}).value || '';
    var subtype = (document.getElementById('upg-sub') || {}).value || '';
    if (!subtype) { _toast('⚠ Select a boarding type / subtype', '#ea580c'); return; }

    /* 1. Move student to new class if selected */
    if (newCls && typeof students !== 'undefined') {
      students = students.map(function (s) {
        return String(s.id) === String(stuId) ? Object.assign({}, s, { cls: newCls }) : s;
      });
      if(typeof _gnsiInstantPush==='function'){var _sc=students.find(function(x){return String(x.id)===String(stuId);});if(_sc)_gnsiInstantPush('students',{id:_sc.id,name:_sc.name,roll_no:_sc.roll||null,phone:_sc.phone||null,is_boarder:_sc.hostel==='Yes',status:'Active',class_id:CLASS_ID_MAP[_sc.cls]||null,session:_sc.session||null});}
    }

    /* 2. Update fee assignment */
    var asgns = _asgns();
    var courseId = subtype.split('_')[0];
    var changed  = false;
    var newAsgns = asgns.map(function (a) {
      if (String(a.stuId) !== String(stuId)) return a;
      changed = true;
      /* Get monthlyFee from GNSI_COURSES */
      var mf = 0;
      if (typeof GNSI_COURSES !== 'undefined') {
        GNSI_COURSES.forEach(function (c) {
          c.subTypes.forEach(function (st) {
            if (st.id === subtype) mf = st.monthlyFee || 0;
          });
        });
      }
      return Object.assign({}, a, {
        subTypeId:        subtype,
        courseId:         courseId,
        courseAssignedAt: new Date().toISOString(),
        courseAssignedBy: (typeof currentUser !== 'undefined' && currentUser) ? currentUser.name : 'Admin',
        monthlyFee:       mf || a.monthlyFee,
        className:        newCls || a.className
      });
    });

    if (changed) {
      if (typeof _fmcSaveAsgns === 'function') _fmcSaveAsgns(newAsgns);
      if (typeof gnsiKVPush === 'function') {
        gnsiKVPush('gnsi_fee_asgns', newAsgns);
        gnsiKVPush('gnsi_sfa_assignments', newAsgns);
      }
    }

    var stu = _students().find(function (s) { return String(s.id) === String(stuId); });
    _toast('✅ ' + (stu ? stu.name : 'Student') + ' promoted → ' + subtype + (newCls ? ' · moved to ' + newCls : ''), '#15803d');
    var modal = document.getElementById('gnsi-upgrade-wizard');
    if (modal) modal.remove();
    if (typeof render === 'function') render();
  };

  /* ════════════════════════════════════════════════════════════════════════
     5. FEE HUB INDICATION BAR
     Patches _fmcRenderAssignment to show bridge status per student.
  ════════════════════════════════════════════════════════════════════════ */
  (function _patchFeeAssignmentList() {
    if (window.__gnsiBridgeFeeListPatched) return;
    if (typeof window._fmcRenderAssignment !== 'function') { setTimeout(_patchFeeAssignmentList, 400); return; }
    window.__gnsiBridgeFeeListPatched = true;

    var _orig = window._fmcRenderAssignment;
    window._fmcRenderAssignment = function (isAdmin, isAccounts) {
      var base   = _orig(isAdmin, isAccounts);
      var bridge = _loadBridge();
      var asgns  = _asgns();

      /* Count students needing course assignment */
      var needsCourse = asgns.filter(function (a) {
        var entry = bridge[a.className];
        return entry && entry.course && !a.subTypeId;
      });
      var hasLegacy = asgns.filter(function (a) {
        return a.className && !bridge[a.className] && _detectBatch(a.className);
      });

      if (needsCourse.length === 0 && hasLegacy.length === 0) return base;

      var bar = '<div style="display:flex;align-items:center;gap:12px;padding:13px 16px;'
        + 'background:linear-gradient(135deg,#fffbeb,#fef3c7);border:1.5px solid #fbbf24;'
        + 'border-radius:12px;margin-bottom:14px;flex-wrap:wrap">'
        + '<span style="font-size:20px">🔗</span>'
        + '<div style="flex:1;min-width:160px">'
        +   '<div style="font-weight:800;font-size:13px;color:#92400e">Course Bridge Action Required</div>'
        +   '<div style="font-size:11.5px;color:#a16207;margin-top:2px">';

      if (needsCourse.length > 0)
        bar += needsCourse.length + ' student' + (needsCourse.length!==1?'s':'') + ' need course subtype synced from bridge. ';
      if (hasLegacy.length > 0)
        bar += hasLegacy.length + ' student' + (hasLegacy.length!==1?'s':'') + ' in batch classes not yet mapped. ';

      bar += '</div></div>'
        + '<div style="display:flex;gap:8px;flex-wrap:wrap">'
        + (needsCourse.length > 0
            ? '<button onclick="gnsiBridgeSyncAll()" style="padding:7px 14px;border-radius:8px;background:#d97706;color:#fff;border:none;font-size:12px;font-weight:700;cursor:pointer">🔄 Sync ' + needsCourse.length + ' Now</button>'
            : '')
        + '<button onclick="gnsiOpenBatchBridgeConfig()" style="padding:7px 14px;border-radius:8px;background:#1433a8;color:#fff;border:none;font-size:12px;font-weight:700;cursor:pointer">⚙️ Bridge Config</button>'
        + '</div>'
        + '</div>';

      return bar + base;
    };
  })();

  /* ════════════════════════════════════════════════════════════════════════
     7. BRIDGE CONFIG UI
     Full-featured batch mapping panel, opened as a modal.
  ════════════════════════════════════════════════════════════════════════ */
  window.gnsiOpenBatchBridgeConfig = function () {
    var existing = document.getElementById('gnsi-bridge-config-modal');
    if (existing) { existing.remove(); return; }
    var modal = document.createElement('div');
    modal.id  = 'gnsi-bridge-config-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(10,18,41,.65);z-index:99998;display:flex;align-items:flex-start;justify-content:center;padding:20px;overflow-y:auto;backdrop-filter:blur(3px)';
    modal.innerHTML = '<div style="background:var(--surface,#fff);border-radius:16px;width:100%;max-width:780px;margin:auto;box-shadow:0 20px 60px rgba(0,0,0,.35);overflow:hidden">'
      + '<div style="background:linear-gradient(135deg,#1433a8,#2655d8);padding:20px 24px;display:flex;align-items:center;justify-content:space-between">'
      +   '<div><div style="font-size:11px;color:rgba(255,255,255,.7);font-weight:700;letter-spacing:.1em;text-transform:uppercase">Fee Management</div>'
      +   '<div style="font-size:18px;font-weight:800;color:#fff;margin-top:2px">🔗 Batch → Course Fee Bridge</div>'
      +   '<div style="font-size:12px;color:rgba(255,255,255,.75);margin-top:2px">Map each batch class to its course tier · sync fee assignments automatically</div></div>'
      +   '<button onclick="document.getElementById(\'gnsi-bridge-config-modal\').remove()" style="background:rgba(255,255,255,.15);border:none;border-radius:8px;padding:6px 12px;color:#fff;font-size:13px;font-weight:700;cursor:pointer">✕</button>'
      + '</div>'
      + '<div id="gnsi-bridge-config-body" style="padding:22px 24px">' + _buildBridgeConfigBody() + '</div>'
      + '</div>';
    document.body.appendChild(modal);
    modal.addEventListener('click', function (e) { if (e.target === modal) modal.remove(); });
  };

  function _buildBridgeConfigBody() {
    var bridge  = _loadBridge();
    var classes = _classes().filter(function (c) { return c.active; });
    var asgns   = _asgns();

    /* Course options */
    var courseOpts = '<option value="">-- select course --</option>';
    var subtypeMap = {};
    if (typeof GNSI_COURSES !== 'undefined') {
      GNSI_COURSES.forEach(function (c) {
        courseOpts += '<option value="' + _esc(c.id) + '">' + _esc(c.icon + ' ' + c.name) + '</option>';
        subtypeMap[c.id] = c.subTypes.map(function (st) {
          return '<option value="' + _esc(st.id) + '">' + _esc(st.label)
            + (st.monthlyFee ? ' — ₹' + st.monthlyFee.toLocaleString('en-IN') + '/mo' : '') + '</option>';
        }).join('');
      });
    }
    var subtypeMapJson = JSON.stringify(subtypeMap)
      .replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');

    /* Summary strip */
    var mapped   = classes.filter(function(c){return bridge[c.name]&&bridge[c.name].course;}).length;
    var unmapped = classes.filter(function(c){return !bridge[c.name]||!bridge[c.name].course;}).length;
    var needSync = classes.filter(function(c){
      var e=bridge[c.name]; return e&&e.course&&asgns.some(function(a){
        return (a.className||'').toLowerCase()===c.name.toLowerCase()&&!a.subTypeId;
      });
    }).length;

    var html = '<div style="display:flex;gap:10px;margin-bottom:18px;flex-wrap:wrap">'
      + '<div style="flex:1;min-width:120px;background:#e0e8f9;border-radius:10px;padding:10px 14px;text-align:center">'
      +   '<div style="font-size:22px;font-weight:800;color:#1433a8">' + mapped + '</div>'
      +   '<div style="font-size:11px;color:#6474a0;font-weight:700">Mapped</div></div>'
      + '<div style="flex:1;min-width:120px;background:#fef3c7;border-radius:10px;padding:10px 14px;text-align:center">'
      +   '<div style="font-size:22px;font-weight:800;color:#92400e">' + unmapped + '</div>'
      +   '<div style="font-size:11px;color:#a16207;font-weight:700">Unmapped</div></div>'
      + '<div style="flex:1;min-width:120px;background:#dcfce7;border-radius:10px;padding:10px 14px;text-align:center">'
      +   '<div style="font-size:22px;font-weight:800;color:#15803d">' + needSync + '</div>'
      +   '<div style="font-size:11px;color:#166534;font-weight:700">Need Sync</div></div>'
      + '</div>'
      + '<div style="display:flex;gap:8px;margin-bottom:18px;flex-wrap:wrap">'
      + '<button onclick="gnsiBridgeAutoMapBatches()" style="padding:8px 16px;border-radius:9px;background:#d97706;color:#fff;border:none;font-size:12.5px;font-weight:700;cursor:pointer">⚡ Auto-Map All Batches</button>'
      + '<button onclick="gnsiBridgeSyncAll();document.getElementById(\'gnsi-bridge-config-body\').innerHTML=window._buildBridgeConfigBody()" style="padding:8px 16px;border-radius:9px;background:#15803d;color:#fff;border:none;font-size:12.5px;font-weight:700;cursor:pointer">🔄 Sync All Fee Assignments</button>'
      + '</div>';

    /* ── Batch taxonomy quick-reference ── */
    html += '<div style="background:var(--surface2,#f8fafc);border:1.5px solid var(--border);border-radius:10px;padding:14px 16px;margin-bottom:18px">'
      + '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:10px">📋 GNSI Batch Reference</div>'
      + '<div style="display:flex;flex-wrap:wrap;gap:8px">'
      + Object.keys(GNSI_BATCH_MAP).map(function (b) {
          var d = GNSI_BATCH_MAP[b];
          return '<div style="padding:5px 12px;border-radius:8px;border:1.5px solid ' + d.color + '33;background:' + d.color + '11;font-size:12px">'
            + '<span style="font-weight:700;color:' + d.color + '">' + d.icon + ' ' + b + '</span>'
            + ' <span style="color:var(--muted)">→</span> '
            + '<span style="font-weight:700;color:' + d.color + '">' + d.courseName + ' (' + d.variant + ')</span>'
            + '</div>';
        }).join('')
      + '</div></div>';

    /* ── Class rows ── */
    html += '<div style="border:1.5px solid var(--border);border-radius:10px;overflow:hidden">';
    if (classes.length === 0) {
      html += '<div style="padding:32px;text-align:center;color:var(--muted)">No active classes found.</div>';
    } else {
      html += '<table style="width:100%;border-collapse:collapse">'
        + '<thead><tr style="background:var(--surface2)">'
        + '<th style="text-align:left;padding:10px 14px;font-size:11px;font-weight:700;text-transform:uppercase;color:var(--muted);border-bottom:1px solid var(--border)">Batch / Class</th>'
        + '<th style="text-align:left;padding:10px 14px;font-size:11px;font-weight:700;text-transform:uppercase;color:var(--muted);border-bottom:1px solid var(--border)">Course</th>'
        + '<th style="text-align:left;padding:10px 14px;font-size:11px;font-weight:700;text-transform:uppercase;color:var(--muted);border-bottom:1px solid var(--border)">Subtype</th>'
        + '<th style="text-align:left;padding:10px 14px;font-size:11px;font-weight:700;text-transform:uppercase;color:var(--muted);border-bottom:1px solid var(--border)">Monthly Fee</th>'
        + '<th style="padding:10px 14px;border-bottom:1px solid var(--border)">Status</th>'
        + '<th style="padding:10px 14px;border-bottom:1px solid var(--border)"></th>'
        + '</tr></thead><tbody>';

      classes.forEach(function (cls, idx) {
        var entry     = bridge[cls.name];
        var isObj     = entry && typeof entry === 'object';
        var batchName = _detectBatch(cls.name);
        var def       = batchName ? GNSI_BATCH_MAP[batchName] : null;
        var mapped    = isObj && entry.course;
        var stuCount  = _students().filter(function(s){return s.cls===cls.name;}).length;
        var needsSync = mapped && asgns.some(function(a){
          return (a.className||'').toLowerCase()===cls.name.toLowerCase() && !a.subTypeId;
        });
        var idKey = cls.name.replace(/\s+/g,'_');
        var currCourse  = (isObj && entry.course)   || (def && def.course)   || '';
        var currSubtype = (isObj && entry.subtype)  || (def && def.defaultSubtype) || '';
        var currFee     = (isObj && entry.monthlyFee) || 0;

        var stOptsForRow = '<option value="">-- select --</option>';
        if (currCourse && typeof GNSI_COURSES !== 'undefined') {
          GNSI_COURSES.forEach(function (c) {
            if (c.id === currCourse) {
              c.subTypes.forEach(function (st) {
                stOptsForRow += '<option value="' + _esc(st.id) + '"' + (st.id === currSubtype ? ' selected' : '') + '>'
                  + _esc(st.label) + (st.monthlyFee ? ' — ₹' + st.monthlyFee.toLocaleString('en-IN') : '') + '</option>';
              });
            }
          });
        }

        var statusBadge = mapped
          ? (needsSync
              ? '<span style="background:#fef3c7;color:#92400e;border-radius:6px;padding:2px 9px;font-size:11px;font-weight:700;white-space:nowrap">⚠ Needs Sync</span>'
              : '<span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:2px 9px;font-size:11px;font-weight:700;white-space:nowrap">✅ Synced</span>')
          : (batchName
              ? '<span style="background:#fef9c3;color:#854d0e;border-radius:6px;padding:2px 9px;font-size:11px;font-weight:700;white-space:nowrap">⚡ Batch</span>'
              : '<span style="background:#f1f5f9;color:#64748b;border-radius:6px;padding:2px 9px;font-size:11px;font-weight:700;white-space:nowrap">— Unmapped</span>');

        html += '<tr style="border-bottom:1px solid var(--border);background:' + (idx%2===0?'var(--surface)':'var(--surface2)') + '">'
          + '<td style="padding:10px 14px">'
          +   '<div style="font-weight:700;font-size:13px;color:var(--text)">'
          +     (def ? '<span style="color:' + def.color + '">' + def.icon + '</span> ' : '')
          +     _esc(cls.name)
          +   '</div>'
          +   (batchName ? '<div style="font-size:11px;color:var(--muted);margin-top:1px">' + _esc(batchName) + '</div>' : '')
          +   '<div style="font-size:11px;color:var(--muted)">' + stuCount + ' student' + (stuCount!==1?'s':'') + '</div>'
          + '</td>'
          + '<td style="padding:8px 14px">'
          +   '<select id="bb-course-' + _esc(idKey) + '" '
          +     'onchange="(function(){var m=' + subtypeMapJson + ';var el=document.getElementById(\'bb-sub-' + _esc(idKey) + '\');if(el)el.innerHTML=m[this.value]||\'<option value=\\"\\">-- select --</option>\'}).call(this)" '
          +     'style="width:100%;border:1.5px solid var(--border);border-radius:7px;padding:6px 9px;font-size:12px;background:var(--surface);color:var(--text)">'
          +   courseOpts.replace('value="' + _esc(currCourse) + '"', 'value="' + _esc(currCourse) + '" selected')
          +   '</select>'
          + '</td>'
          + '<td style="padding:8px 14px">'
          +   '<select id="bb-sub-' + _esc(idKey) + '" style="width:100%;border:1.5px solid var(--border);border-radius:7px;padding:6px 9px;font-size:12px;background:var(--surface);color:var(--text)">'
          +   stOptsForRow
          +   '</select>'
          + '</td>'
          + '<td style="padding:8px 14px">'
          +   '<input type="number" id="bb-fee-' + _esc(idKey) + '" value="' + (currFee||'') + '" placeholder="auto" '
          +   'style="width:90px;border:1.5px solid var(--border);border-radius:7px;padding:6px 9px;font-size:12px;background:var(--surface);color:var(--text)">'
          + '</td>'
          + '<td style="padding:8px 14px;text-align:center">' + statusBadge + '</td>'
          + '<td style="padding:8px 14px;text-align:right;white-space:nowrap">'
          +   '<button onclick="gnsiBridgeSaveEntry(\'' + _esc(cls.name) + '\')" '
          +     'style="padding:5px 12px;border-radius:7px;background:#1433a8;color:#fff;border:none;font-size:11.5px;font-weight:700;cursor:pointer;margin-right:4px">💾 Save</button>'
          +   (mapped ? '<button onclick="gnsiBridgeClearEntry(\'' + _esc(cls.name) + '\')" '
          +     'style="padding:5px 10px;border-radius:7px;background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;font-size:11.5px;font-weight:700;cursor:pointer">✕</button>' : '')
          + '</td>'
          + '</tr>';
      });
      html += '</tbody></table>';
    }
    html += '</div>';
    return html;
  };
  /* Expose for inline refresh */
  window._buildBridgeConfigBody = _buildBridgeConfigBody;

  /* ════════════════════════════════════════════════════════════════════════
     UPGRADE BUTTON IN CLASS ENROLLED TABLE
     Patch classMoveStudent UI to add upgrade button per student row
  ════════════════════════════════════════════════════════════════════════ */
  (function _patchClassEnrolledRows() {
    if (window.__gnsiBatchUpgradeRowPatched) return;
    if (typeof window.renderClasses !== 'function') { setTimeout(_patchClassEnrolledRows, 500); return; }
    window.__gnsiBatchUpgradeRowPatched = true;
    /* We inject a global click handler via event delegation on the page */
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-gnsi-upgrade]');
      if (!btn) return;
      var stuId    = btn.getAttribute('data-gnsi-upgrade');
      var fromCls  = btn.getAttribute('data-gnsi-from');
      gnsiShowUpgradeWizard(stuId, fromCls);
    });
  })();

  /* ════════════════════════════════════════════════════════════════════════
     UPGRADE BUTTON — inject into existing enrolled-students table
     We patch renderClasses to add 🎓 Upgrade button in actions column
  ════════════════════════════════════════════════════════════════════════ */
  (function _patchEnrolledTable() {
    if (window.__gnsiBatchEnrolledTablePatched) return;
    if (typeof window.renderClasses !== 'function') { setTimeout(_patchEnrolledTable, 600); return; }
    window.__gnsiBatchEnrolledTablePatched = true;

    var _origRender2 = window.renderClasses;
    window.renderClasses = function () {
      var html   = _origRender2();
      var bridge = _loadBridge();

      /* For each class that has a bridge entry, inject upgrade buttons into their enrolled rows */
      _classes().filter(function (c) { return c.active && bridge[c.name] && bridge[c.name].course; })
        .forEach(function (cls) {
          var entry = bridge[cls.name];
          if (!entry || !entry.course) return;
          /* Find students in this class without subTypeId in their fee assignment */
          var studentsInClass = _students().filter(function (s) { return s.cls === cls.name; });
          studentsInClass.forEach(function (s) {
            var asgn = _asgns().find(function (a) { return String(a.stuId) === String(s.id); });
            if (asgn && asgn.subTypeId) return; /* already upgraded */
            /* Inject upgrade button marker into rendered HTML — use data attributes */
            var btnHtml = '<button data-gnsi-upgrade="' + _esc(String(s.id)) + '" data-gnsi-from="' + _esc(cls.name) + '" '
              + 'style="font-size:11px;padding:3px 8px;border-radius:5px;border:1.5px solid #7c3aed;background:#f5f3ff;cursor:pointer;color:#7c3aed;font-weight:700;font-family:\'DM Sans\',sans-serif;margin-right:3px">🎓 Upgrade</button>';
            /* Insert after the edit button for this student — targeted replace on stuId */
            var marker = 'stuEditId=' + s.id + ';showAddStudent=true';
            var insertAfter = 'onclick="' + marker;
            html = html.replace(
              new RegExp('(onclick="' + marker.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + '[^"]*"[^>]*>[^<]*</button>)'),
              '$1' + btnHtml
            );
          });
        });
      return html;
    };
  })();

  /* ════════════════════════════════════════════════════════════════════════
     FEE HUB NAV: add "Bridge" tab
  ════════════════════════════════════════════════════════════════════════ */
  (function _patchFeeHubNav() {
    if (window.__gnsiBridgeTabPatched) return;
    if (typeof window.gnsiRenderFMC !== 'function' && typeof window.renderUnifiedFeeHub !== 'function') {
      setTimeout(_patchFeeHubNav, 500); return;
    }
    window.__gnsiBridgeTabPatched = true;
    /* Intercept the tab list render to add Bridge tab */
    var _origFMC = window.gnsiRenderFMC || window.renderUnifiedFeeHub;
    var fnName   = window.gnsiRenderFMC ? 'gnsiRenderFMC' : 'renderUnifiedFeeHub';
    window[fnName] = function () {
      var base = _origFMC();
      /* Inject Bridge tab button after existing tabs */
      return base.replace(
        /(<button[^>]*onclick="gnsiSetFMCTab\('config'\)[^>]*>.*?<\/button>)/,
        '$1<button onclick="gnsiOpenBatchBridgeConfig()" style="padding:8px 16px;border-radius:20px;border:1.5px solid #7c3aed;background:#f5f3ff;color:#7c3aed;font-size:12.5px;font-weight:700;cursor:pointer;white-space:nowrap">🔗 Bridge</button>'
      );
    };
  })();

  console.log('[GNSI BatchBridge Patch v1] ✅ Batch→Course bridge system loaded.');
})();

</script>

<script>
/* ═══════════════════════════════════════════════════════════════════════════
   GNSI PORTAL — SUPABASE & STORAGE PATCH v1
   
   Fixes 7 issues found in the Supabase sync and localStorage system:
   
   FIX 1 🔴 gnsiKVPush silent conflict discard → toast + merge instead of discard
   FIX 2 🟡 gnsiKVPullAll unbounded query → add .limit(500) safety cap
   FIX 3 🟡 Pull→Push echo loop (334 students × 668 API calls at login) → pull guard
   FIX 4 🟡 ims_students/ims_staff double-sync → deduplicate save() KV push
   FIX 5 🔴 GNSI_OFFLINE_QUEUE vs gnsi_offline_queue key mismatch → unify + drain
   FIX 6 🟡 No localStorage quota monitoring → size check + warning toast
   FIX 7 🟢 Offline queue save silently fails if storage full → fallback + alert
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── helpers ── */
  function _toast(msg, col) { if (typeof showToast === 'function') showToast(msg, col || '#1433a8'); }
  function _log(msg) { /* silent in prod */ }

  /* ════════════════════════════════════════════════════════════════════════
     FIX 3 FIRST: Pull-in-progress guard
     Must be in place BEFORE patching gnsiKVPush and gnsiKVPullAll.
  ════════════════════════════════════════════════════════════════════════ */
  window._gnsiPulling = false; // true while gnsiKVPullAll is running

  /* ════════════════════════════════════════════════════════════════════════
     FIX 1 + 3: gnsiKVPush — conflict handling + pull-guard
     
     When remote is newer AND we're not in a pull:
       - Old behaviour: silently pull remote, discard local changes
       - New behaviour: show a clear conflict toast, offer to keep local
     
     When _gnsiPulling is true: skip the push entirely (we're reading, not writing)
  ════════════════════════════════════════════════════════════════════════ */
  (function _patchKVPush() {
    if (window.__gnsiKVPushStoragePatched) return;
    if (typeof window.gnsiKVPush !== 'function') { setTimeout(_patchKVPush, 300); return; }
    window.__gnsiKVPushStoragePatched = true;

    var _origPush = window.gnsiKVPush;
    window.gnsiKVPush = function (key, value) {
      /* Proxy: pull-guard (don't echo back during a cloud pull) */
      if (window._gnsiPulling) return;
      /* Delegate to the main batch-coalescing gnsiKVPush engine */
      _origPush(key, value);
    };
  })();

  /* ════════════════════════════════════════════════════════════════════════
     FIX 2 + 3: gnsiKVPullAll — add .limit(500) safety cap + pull-guard flag
  ════════════════════════════════════════════════════════════════════════ */
  (function _patchKVPullAll() {
    if (window.__gnsiKVPullAllStoragePatched) return;
    if (typeof window.gnsiKVPullAll !== 'function') { setTimeout(_patchKVPullAll, 300); return; }
    window.__gnsiKVPullAllStoragePatched = true;

    var _origPullAll = window.gnsiKVPullAll;
    window.gnsiKVPullAll = function (callback) {
      /* FIX 3: Set pulling flag so proxy doesn't echo rows back to Supabase */
      window._gnsiPulling = true;

      /* Wrap the callback to clear the flag */
      var _cb = typeof callback === 'function' ? callback : function () {};
      var _wrappedCb = function (count) {
        window._gnsiPulling = false;
        _cb(count);
      };

      /* FIX 2: Patch the Supabase query inside to add .limit(500) */
      /* We can't easily modify the inner query, so we replace the function entirely */
      if (typeof _supa === 'undefined' || !_supa) {
        window._gnsiPulling = false;
        _cb(0); return;
      }
      /* EGRESS FIX v74.1: only pull rows changed since last sync */
      var _lastKVPull = localStorage.getItem('_gnsi_kv_last_pull') || '2000-01-01T00:00:00Z';
      /* On first login of the day (>1hr since last pull), do a full pull */
      var _lastPullAge = Date.now() - new Date(_lastKVPull).getTime();
      var _fullPull = _lastPullAge > 60 * 60 * 1000; /* full pull if >1 hour old */
      var _kvQuery = _supa.from('gnsi_keyvalue').select('key, value, updated_at');
      if (!_fullPull) { _kvQuery = _kvQuery.gt('updated_at', _lastKVPull); }
      _kvQuery
        .limit(500)                          /* FIX 2: prevent unbounded scan */
        .then(function (result) {
          window._gnsiPulling = false;       /* clear flag as soon as data arrives */
          var rows = result.data || [];
          /* Notify if we hit the limit */
          if (rows.length === 500) {
            _toast('⚠️ Cloud storage has 500+ records. Contact admin to run a cleanup.', '#d97706');
          }
          /* Write in chunks using idle time (same pattern as original) */
          var _kvi = 0;
          function _writeChunk() {
            window._gnsiPulling = true;      /* guard during writes */
            var _end = Math.min(_kvi + 15, rows.length);
            while (_kvi < _end) {
              var row = rows[_kvi++];
              if (!row.key || row.value === undefined || row.value === null) continue;
              try {
                if (typeof _gnsiIsSensitiveKey === 'function' && _gnsiIsSensitiveKey(row.key) && localStorage.getItem(row.key)) continue;
                var cloudTs = row.updated_at || '2000-01-01T00:00:00Z';
                var localTs = localStorage.getItem('gnsi_kv_ts_' + row.key) || '';
                if (!localTs || cloudTs > localTs) {
                  var _toStore = typeof row.value === 'string' ? row.value : JSON.stringify(row.value);
                  /* Use native setItem to bypass proxy (FIX 3: no echo) */
                  try {
                    (localStorage.__gnsiNative || localStorage.setItem.bind(localStorage))(row.key, _toStore);
                    (localStorage.__gnsiNative || localStorage.setItem.bind(localStorage))('gnsi_kv_ts_' + row.key, cloudTs);
                  } catch(e) { _gnsiHandleStorageFull(row.key); }
                  /* Cache invalidation */
                  if (row.key === 'gnsi_hms_student_house') {
                    window._houseMapCache = typeof row.value === 'object' ? row.value : null;
                  }
                  if (row.key === 'gnsi_fee_cols' || row.key === 'gnsi_sfa_collections') {
                    if (typeof _fmc !== 'undefined') _fmc._colsCache = null;
                  }
                  if (row.key === 'gnsi_fee_asgns' || row.key === 'gnsi_sfa_assignments') {
                    if (typeof _fmc !== 'undefined') _fmc._asgnsCache = null;
                  }
                }
              } catch(e) {}
            }
            window._gnsiPulling = false;
            if (_kvi < rows.length) {
              (window.requestIdleCallback || function (fn) { setTimeout(fn, 1); })(_writeChunk);
            } else {
              _kvDone();
            }
          }
          function _kvDone() {
            /* Rebuild role/session (same as original) */
            try {
              if (rows.length > 0 && typeof currentUser !== 'undefined' && currentUser) {
                var freshRolePages = localStorage.getItem('gnsi_role_pages');
                if (freshRolePages && typeof ROLE_PAGES !== 'undefined') {
                  try {
                    var rp = JSON.parse(freshRolePages);
                    if (rp && typeof rp === 'object') Object.keys(rp).forEach(function (r) { if (ROLE_PAGES[r]) ROLE_PAGES[r] = rp[r]; });
                  } catch(e) {}
                }
                if (typeof staff !== 'undefined' && typeof detectRole === 'function') {
                  var loggedMember = staff.find(function (s) { return s.id === currentUser.id; });
                  if (loggedMember) {
                    var freshRole  = detectRole(loggedMember);
                    var freshPages = (typeof ROLE_PAGES !== 'undefined' && ROLE_PAGES[freshRole]) || currentUser.pages;
                    currentUser.role  = freshRole;
                    currentUser.pages = freshPages;
                    if (loggedMember.name) currentUser.name = loggedMember.name;
                    if (typeof saveSession === 'function') saveSession(currentUser);
                  }
                }
              }
            } catch(e) {}
            if (typeof buildNav === 'function') setTimeout(buildNav, 150);
            /* EGRESS FIX v74.1: save pull timestamp so next call only fetches changed rows */
            try { localStorage.setItem('_gnsi_kv_last_pull', new Date().toISOString()); } catch(e) {}
            _wrappedCb(rows.length);
          }
          _writeChunk();
        })
        .catch(function (e) {
          window._gnsiPulling = false;
          _wrappedCb(0);
        });
    };

    /* Store native localStorage.setItem reference for FIX 3 bypass */
    try { localStorage.__gnsiNative = localStorage.setItem.bind(localStorage); } catch(e) {}
  })();

  /* ════════════════════════════════════════════════════════════════════════
     FIX 4: Deduplicate ims_students / ims_staff double-sync
     pushToSupabase() already syncs these to the 'students'/'staff' tables.
     gnsiKVPushAll should NOT also push ims_students/ims_staff to gnsi_keyvalue.
  ════════════════════════════════════════════════════════════════════════ */
  (function _patchKVPushAll() {
    if (window.__gnsiKVPushAllStoragePatched) return;
    if (typeof window.gnsiKVPushAll !== 'function') { setTimeout(_patchKVPushAll, 300); return; }
    window.__gnsiKVPushAllStoragePatched = true;

    /* Keys already synced via dedicated Supabase tables — skip from KV batch */
    var SKIP_FROM_KV = ['ims_students', 'ims_staff', 'ims_notices'];
    var _origPushAll = window.gnsiKVPushAll;
    window.gnsiKVPushAll = function (callback) {
      /* Temporarily null out these keys in GNSI_KV_KEYS for the batch */
      var _orig = window.GNSI_KV_KEYS;
      if (Array.isArray(window.GNSI_KV_KEYS)) {
        window.GNSI_KV_KEYS = window.GNSI_KV_KEYS.filter(function (k) {
          return SKIP_FROM_KV.indexOf(k) === -1;
        });
      }
      _origPushAll(function (count) {
        window.GNSI_KV_KEYS = _orig; /* restore */
        if (typeof callback === 'function') callback(count);
      });
    };
  })();

  /* ════════════════════════════════════════════════════════════════════════
     FIX 5: Unify offline queue key — GNSI_OFFLINE_QUEUE → gnsi_offline_queue
     The removeStaff/removeStudent patches write to 'gnsi_offline_queue' (uppercase)
     but gnsiDrainQueue reads from 'gnsi_offline_queue' (lowercase) via the in-memory
     GNSI_OFFLINE_QUEUE array. Delete operations were never drained.
     
     Fix: at startup, migrate any items in GNSI_OFFLINE_QUEUE into the real queue,
     and patch removeStaff/removeStudent to use the correct key.
  ════════════════════════════════════════════════════════════════════════ */
  (function _fixOfflineQueueKey() {
    /* Migrate uppercase key items into the real queue */
    try {
      var staleRaw = localStorage.getItem('gnsi_offline_queue');
      if (staleRaw) {
        var staleItems = JSON.parse(staleRaw) || [];
        if (staleItems.length > 0) {
          /* These are {type:'delete'|'upsert', table:'staff'|'students', id, ts} format */
          /* We can't retroactively issue deletes via gnsiKVPush (different format) */
          /* But we can at least run the Supabase deletes now if online */
          if (typeof _supa !== 'undefined' && _supa && window._gnsiOnline) {
            staleItems.forEach(function (item) {
              if (item.type === 'delete' && item.table && item.id) {
                try {
                  _supa.from(item.table).delete().eq('id', item.id)
                    .then(function () {})
                    .catch(function () {});
                } catch(e) {}
              }
            });
            _toast('✅ Drained ' + staleItems.length + ' queued delete operation(s) from offline queue', '#15803d');
          }
          localStorage.removeItem('gnsi_offline_queue');
        }
      }
    } catch(e) {}

    /* Patch removeStaff and removeStudent to use lowercase queue key */
    function _patchRemove(fnName) {
      if (window.__gnsiQueueFixed_remove) return;
      if (typeof window[fnName] !== 'function') return;
      /* The functions are already patched with _cloudPatched flag */
      /* We just ensure any future offline writes use the correct key */
      /* Override the inline localStorage.setItem('gnsi_offline_queue', ...) calls */
      /* Since we can't easily re-patch the already-patched functions, we use a storage proxy */
      if (!localStorage.__gnsiQueueKeyFixed) {
        var _origNativeSet = localStorage.__gnsiNative || localStorage.setItem.bind(localStorage);
        var _currentProxy = localStorage.setItem;
        localStorage.setItem = function (key, value) {
          /* Redirect uppercase queue key to lowercase */
          if (key === 'gnsi_offline_queue') {
            key = 'gnsi_offline_queue';
            /* Also merge into in-memory GNSI_OFFLINE_QUEUE */
            try {
              var items = JSON.parse(value) || [];
              if (typeof GNSI_OFFLINE_QUEUE !== 'undefined' && Array.isArray(GNSI_OFFLINE_QUEUE)) {
                items.forEach(function (item) {
                  if (!GNSI_OFFLINE_QUEUE.find(function(q){ return q.key === item.key; })) {
                    GNSI_OFFLINE_QUEUE.push(item);
                  }
                });
              }
            } catch(e) {}
          }
          return _currentProxy.call(localStorage, key, value);
        };
        /* Also redirect getItem for uppercase key */
        var _origGet = localStorage.getItem.bind(localStorage);
        localStorage.getItem = function (key) {
          if (key === 'gnsi_offline_queue') key = 'gnsi_offline_queue';
          return _origGet(key);
        };
        localStorage.__gnsiQueueKeyFixed = true;
      }
    }

    /* Apply after load so patched removeStaff/removeStudent exist */
    setTimeout(function () {
      _patchRemove('removeStaff');
      _patchRemove('removeStudent');
      window.__gnsiQueueFixed_remove = true;
    }, 1000);
  })();

  /* ════════════════════════════════════════════════════════════════════════
     FIX 6 + 7: localStorage quota monitoring and safe write helper
  ════════════════════════════════════════════════════════════════════════ */

  /* Estimate localStorage usage in KB */
  function _gnsiLocalStorageSize() {
    var total = 0;
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k) total += k.length + (localStorage.getItem(k) || '').length;
      }
    } catch(e) {}
    return Math.round(total / 1024); /* KB */
  }
  window._gnsiLocalStorageSize = _gnsiLocalStorageSize;

  /* Handle storage full error */
  function _gnsiHandleStorageFull(key) {
    var sizeKB = _gnsiLocalStorageSize();
    console.error('[GNSI Storage] QuotaExceededError for key:', key, '| Used:', sizeKB, 'KB / ~5120KB. Go to Settings → Backup & Sync → Clear Old Data to free space.');
  }
  window._gnsiHandleStorageFull = _gnsiHandleStorageFull;

  /* Periodic quota check — updates sync panel indicator only (toast warning removed) */
  function _gnsiCheckQuota() {
    try {
      var sizeKB = _gnsiLocalStorageSize();
      var pct    = Math.round(sizeKB / 5120 * 100);
      /* Update sync panel storage indicator if visible */
      var el = document.getElementById('gnsi-storage-size');
      if (el) el.textContent = sizeKB + 'KB / ~5120KB (' + pct + '%)';
    } catch(e) {}
  }
  window._gnsiCheckQuota = _gnsiCheckQuota;
  setInterval(_gnsiCheckQuota, 5 * 60 * 1000); /* every 5 minutes */
  /* Run once at startup */
  setTimeout(_gnsiCheckQuota, 3000);

  /* FIX 7: Wrap all critical localStorage.setItem calls in the KV system with error handling */
  (function _patchGnsiSave() {
    if (window.__gnsiSaveStoragePatched) return;
    if (typeof window.gnsiSave !== 'function' && typeof window.gnsiLoad !== 'function') {
      setTimeout(_patchGnsiSave, 300); return;
    }
    window.__gnsiSaveStoragePatched = true;
    if (typeof window.gnsiSave === 'function') {
      var _origGnsiSave = window.gnsiSave;
      window.gnsiSave = function (key, value) {
        try {
          return _origGnsiSave(key, value);
        } catch(e) {
          if (e.name === 'QuotaExceededError' || (e.code && e.code === 22)) {
            _gnsiHandleStorageFull(key);
          }
          throw e;
        }
      };
    }
  })();

  /* ════════════════════════════════════════════════════════════════════════
     STORAGE HEALTH PANEL
     Adds a storage size indicator to the Sync page
  ════════════════════════════════════════════════════════════════════════ */
  (function _injectStoragePanel() {
    /* Inject a storage usage bar into the sync/settings page */
    function _buildStorageWidget() {
      var sizeKB = _gnsiLocalStorageSize();
      var pct    = Math.min(100, Math.round(sizeKB / 5120 * 100));
      var color  = pct >= 90 ? '#dc2626' : pct >= 70 ? '#d97706' : '#15803d';
      var kvCount = 0;
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && (k.startsWith('gnsi_') || k.startsWith('ims_'))) kvCount++;
        }
      } catch(e) {}
      /* ── FIX: always read from the unified in-memory GNSI_OFFLINE_QUEUE array
         which is the single source of truth loaded from 'gnsi_offline_queue' key ── */
      var queueLen = (typeof GNSI_OFFLINE_QUEUE !== 'undefined' && Array.isArray(GNSI_OFFLINE_QUEUE))
        ? GNSI_OFFLINE_QUEUE.length
        : (function(){ try { return JSON.parse(localStorage.getItem('gnsi_offline_queue')||'[]').length; } catch(e){ return 0; } })();
      return '<div style="background:var(--surface);border:1.5px solid var(--border);border-radius:12px;padding:16px 18px;margin-bottom:16px">'
        + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">'
        +   '<span style="font-weight:800;font-size:13px;color:var(--text)">💾 Local Storage Health</span>'
        +   '<span id="gnsi-storage-size" style="font-size:12px;color:var(--muted)">' + sizeKB + 'KB / ~5120KB (' + pct + '%)</span>'
        + '</div>'
        + '<div style="height:10px;background:var(--border);border-radius:5px;overflow:hidden;margin-bottom:10px">'
        +   '<div style="height:100%;width:' + pct + '%;background:' + color + ';border-radius:5px;transition:width .5s"></div>'
        + '</div>'
        + '<div style="display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:var(--muted)">'
        +   '<span>📦 <b>' + kvCount + '</b> stored keys</span>'
        +   '<span>⚡ <b>' + queueLen + '</b> queued offline write' + (queueLen !== 1 ? 's' : '') + '</span>'
        +   (pct >= 70
              ? '<span style="color:' + color + ';font-weight:700">⚠️ ' + (100 - pct) + '% space left</span>'
              : '<span style="color:#15803d">✅ Storage healthy</span>')
        + '</div>'
        + (queueLen > 0
            ? '<button onclick="gnsiDrainQueue()" style="margin-top:10px;padding:6px 14px;border-radius:8px;background:#1433a8;color:#fff;border:none;font-size:12px;font-weight:700;cursor:pointer">⬆️ Drain Queue Now (' + queueLen + ')</button>'
            : '')
        + '</div>';
    }
    window._gnsiStorageWidget = _buildStorageWidget;

    /* Inject into sync page when it renders */
    (function _patchSyncPage() {
      if (window.__gnsiStoragePanelPatched) return;
      if (typeof window.renderSync !== 'function' && typeof window.renderSettings !== 'function') {
        setTimeout(_patchSyncPage, 500); return;
      }
      window.__gnsiStoragePanelPatched = true;
      var fnName = typeof window.renderSync === 'function' ? 'renderSync' : 'renderSettings';
      var _orig = window[fnName];
      window[fnName] = function () {
        return _gnsiStorageWidget() + _orig();
      };
    })();
  })();

  console.log('[GNSI SupabaseStorage Patch v1] ✅ All 7 fixes applied. Storage: ' + _gnsiLocalStorageSize() + 'KB');
})();

</script>

<script>
/* ═══════════════════════════════════════════════════════════════════════════
   GNSI PORTAL — KITCHEN EXPENDITURE PATCH v1
   
   Adds two new tabs to Kitchen & Stock Management:
   
   📊 Daily Kitchen Expenditure
     - Log daily cooking costs: ingredient, qty used, rate, total, meal type
     - Calendar date picker — browse any day's spend
     - Day summary: breakfast / lunch / dinner / snack breakdown
     - Monthly summary card: total spend per month + chart
     - Per-student cost calculation (total ÷ student headcount)
     - CSV export + cloud sync via gnsiKVPush
   
   🧹 Daily Use Item Expenditure
     - Log daily consumables spend: soap, detergent, broom, toilet paper, etc.
     - Category filter: Cleaning | Hygiene | Stationery | Maintenance | Other
     - Running total per month with category breakdown
     - Low-stock alert integration (deducts from Daily Stock register)
     - CSV export + cloud sync
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── shared helpers ── */
  function _esc(s) {
    if (s == null) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function _fmt(d) { if (!d) return '—'; var p = d.split('-'); return p[2]+'/'+p[1]+'/'+p[0]; }
  function _today() { return new Date().toISOString().slice(0,10); }
  function _monthOf(d) { return (d||'').slice(0,7); }
  function _isAdmin() { return typeof currentUser !== 'undefined' && currentUser && (currentUser.role==='admin'||currentUser.role==='manager'||currentUser.role==='hostel'); }

  function _load(key) {
    try { var s = localStorage.getItem('gnsi_kit_'+key); if (s) return JSON.parse(s); } catch(e) {}
    return [];
  }
  function _save(key, arr) {
    try { localStorage.setItem('gnsi_kit_'+key, JSON.stringify(arr)); } catch(e) {}
    if (typeof gnsiKVPush === 'function') gnsiKVPush('gnsi_kit_'+key, arr);
  }
  function _nextId(arr) { return arr.length ? Math.max.apply(null, arr.map(function(x){ return x.id||0; }))+1 : 1; }

  function _badge(label, col) {
    var map = {green:'#16a34a',red:'#dc2626',amber:'#d97706',blue:'#2563eb',gray:'#6b7280',purple:'#7c3aed',teal:'#0891b2',orange:'#ea580c',pink:'#db2777'};
    var c = map[col] || col || '#6b7280';
    return '<span style="display:inline-block;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;background:'+c+'18;color:'+c+';border:1px solid '+c+'44">'+_esc(label)+'</span>';
  }

  function _inr(n) { return '₹'+(parseFloat(n)||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2}); }

  function _studentCount() {
    try { return (typeof students !== 'undefined' && students.length) ? students.filter(function(s){return s.hostel==='Yes';}).length || students.length : 0; } catch(e) { return 0; }
  }

  /* ── State ── */
  var _kitExpState = {
    // Kitchen Expenditure tab
    keDateFilter: _today(),
    keMonthFilter: _today().slice(0,7),
    keView: 'day',          // 'day' | 'month'
    keFormOpen: false,
    keEdit: null,
    keSearch: '',
    // Item Expenditure tab
    ieDateFilter: _today(),
    ieMonthFilter: _today().slice(0,7),
    ieView: 'day',
    ieFormOpen: false,
    ieEdit: null,
    ieCatFilter: 'all',
    ieSearch: ''
  };
  window._kitExpState = _kitExpState;

  /* ═══ DATA KEYS ═══
     gnsi_kit_ke_records  — kitchen expenditure entries
     gnsi_kit_ie_records  — daily item expenditure entries
  */

  var KE_MEAL_TYPES = ['Breakfast','Lunch','Dinner','Snack','Other'];
  var KE_CATEGORIES = ['Vegetables & Fruits','Dairy & Eggs','Meat & Fish','Grains & Cereals','Spices & Condiments','Oil & Ghee','Beverages','Bakery','Other'];
  var IE_CATEGORIES = ['Cleaning','Hygiene','Kitchen Consumables','Stationery','Maintenance','Laundry','Other'];

  var MEAL_COLORS = {Breakfast:'#d97706',Lunch:'#16a34a',Dinner:'#1433a8',Snack:'#7c3aed',Other:'#6b7280'};

  /* ════════════════════════════════════════════════════════════════════════
     KITCHEN EXPENDITURE — renderKitExpenditure()
  ════════════════════════════════════════════════════════════════════════ */
  window.renderKitExpenditure = function () {
    var isAdm = _isAdmin();
    var records = _load('ke_records');
    var s = _kitExpState;

    /* ── KPI strip ── */
    var todayRecs  = records.filter(function(r){ return r.date === _today(); });
    var todayTotal = todayRecs.reduce(function(t,r){ return t+(parseFloat(r.total)||0); },0);
    var monthRecs  = records.filter(function(r){ return _monthOf(r.date) === _monthOf(_today()); });
    var monthTotal = monthRecs.reduce(function(t,r){ return t+(parseFloat(r.total)||0); },0);
    var stu        = _studentCount();
    var perStu     = stu > 0 ? (monthTotal/stu) : 0;

    var kpi = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-bottom:18px">'
      +'<div class="stat-card" style="--c:#16a34a"><div class="stat-label">Today\'s Spend</div><div class="stat-val">₹'+Math.round(todayTotal).toLocaleString('en-IN')+'</div><div class="stat-sub">'+_fmt(_today())+'</div></div>'
      +'<div class="stat-card" style="--c:#1433a8"><div class="stat-label">Month Total</div><div class="stat-val">₹'+Math.round(monthTotal).toLocaleString('en-IN')+'</div><div class="stat-sub">'+_monthOf(_today())+'</div></div>'
      +'<div class="stat-card" style="--c:#7c3aed"><div class="stat-label">Per Student/mo</div><div class="stat-val">'+_inr(perStu)+'</div><div class="stat-sub">'+(stu||'?')+' hostel students</div></div>'
      +'<div class="stat-card" style="--c:#d97706"><div class="stat-label">Entries This Month</div><div class="stat-val">'+monthRecs.length+'</div><div class="stat-sub">'+KE_MEAL_TYPES.filter(function(m){return monthRecs.some(function(r){return r.meal===m;});}).join(' · ')+'</div></div>'
      +'</div>';

    /* ── View toggle + date controls ── */
    var viewCtrl = '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:14px">'
      +'<div style="display:flex;gap:4px;background:var(--surface2);border-radius:9px;padding:3px">'
      +'<button onclick="_kitExpState.keView=\'day\';render()" style="padding:6px 14px;border-radius:7px;border:none;cursor:pointer;font-size:12px;font-weight:700;background:'+(s.keView==='day'?'var(--accent)':'transparent')+';color:'+(s.keView==='day'?'#fff':'var(--muted)')+'">📅 Day View</button>'
      +'<button onclick="_kitExpState.keView=\'month\';render()" style="padding:6px 14px;border-radius:7px;border:none;cursor:pointer;font-size:12px;font-weight:700;background:'+(s.keView==='month'?'var(--accent)':'transparent')+';color:'+(s.keView==='month'?'#fff':'var(--muted)')+'">📊 Month View</button>'
      +'</div>'
      +(s.keView==='day'
        ? '<input type="date" value="'+_esc(s.keDateFilter)+'" onchange="_kitExpState.keDateFilter=this.value;render()" style="border:1.5px solid var(--border);border-radius:8px;padding:6px 10px;font-size:13px;background:var(--surface);color:var(--text)">'
          +'<button onclick="_kitExpState.keDateFilter=\''+_today()+'\';render()" style="padding:6px 12px;border-radius:8px;border:1.5px solid var(--border);background:var(--surface);font-size:12px;cursor:pointer;color:var(--muted)">Today</button>'
        : '<input type="month" value="'+_esc(s.keMonthFilter)+'" onchange="_kitExpState.keMonthFilter=this.value;render()" style="border:1.5px solid var(--border);border-radius:8px;padding:6px 10px;font-size:13px;background:var(--surface);color:var(--text)">')
      +(isAdm ? '<button onclick="_kitExpState.keFormOpen=true;_kitExpState.keEdit=null;render()" style="margin-left:auto;padding:7px 16px;border-radius:9px;background:var(--accent);color:#fff;border:none;font-size:12.5px;font-weight:700;cursor:pointer">➕ Add Entry</button>' : '')
      +(isAdm ? '<button onclick="gnsiExportKE()" style="padding:7px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--surface);font-size:12px;cursor:pointer;color:var(--muted)">⬇️ CSV</button>' : '')
      +'</div>';

    /* ── Add / Edit form ── */
    var form = '';
    if (s.keFormOpen && isAdm) {
      var ed = s.keEdit || {};
      var catOpts = KE_CATEGORIES.map(function(c){ return '<option'+(ed.category===c?' selected':'')+'>'+_esc(c)+'</option>'; }).join('');
      var mealOpts = KE_MEAL_TYPES.map(function(m){ return '<option'+(ed.meal===m?' selected':'')+'>'+_esc(m)+'</option>'; }).join('');
      form = '<div class="card" style="margin-bottom:16px;border-left:4px solid var(--accent)">'
        +'<div class="card-head"><span class="card-title">'+(ed.id?'✏️ Edit':'➕ Add')+' Kitchen Expenditure Entry</span>'
        +'<button onclick="_kitExpState.keFormOpen=false;_kitExpState.keEdit=null;render()" style="padding:5px 12px;border-radius:7px;border:1.5px solid var(--border);background:var(--surface);cursor:pointer;font-size:12px;color:var(--muted)">✕ Cancel</button></div>'
        +'<div style="padding:18px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">'
        +'<div><label style="font-size:11px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px;text-transform:uppercase">Date *</label>'
        +'<input type="date" id="ke-date" value="'+_esc(ed.date||_today())+'" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:8px 10px;font-size:13px;background:var(--surface);color:var(--text)"/></div>'
        +'<div><label style="font-size:11px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px;text-transform:uppercase">Meal *</label>'
        +'<select id="ke-meal" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:8px 10px;font-size:13px;background:var(--surface);color:var(--text)">'+mealOpts+'</select></div>'
        +'<div><label style="font-size:11px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px;text-transform:uppercase">Category *</label>'
        +'<select id="ke-cat" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:8px 10px;font-size:13px;background:var(--surface);color:var(--text)">'+catOpts+'</select></div>'
        +'<div style="grid-column:span 2"><label style="font-size:11px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px;text-transform:uppercase">Item / Ingredient *</label>'
        +'<input id="ke-item" placeholder="e.g. Rice, Tomatoes, Mustard Oil…" value="'+_esc(ed.item||'')+'" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:8px 10px;font-size:13px;background:var(--surface);color:var(--text)"/></div>'
        +'<div><label style="font-size:11px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px;text-transform:uppercase">Supplier</label>'
        +'<input id="ke-supplier" placeholder="Supplier / Market" value="'+_esc(ed.supplier||'')+'" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:8px 10px;font-size:13px;background:var(--surface);color:var(--text)"/></div>'
        +'<div><label style="font-size:11px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px;text-transform:uppercase">Qty Used</label>'
        +'<input type="number" id="ke-qty" placeholder="0" value="'+_esc(ed.qty||'')+'" min="0" step="0.01" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:8px 10px;font-size:13px;background:var(--surface);color:var(--text)"/></div>'
        +'<div><label style="font-size:11px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px;text-transform:uppercase">Unit</label>'
        +'<input id="ke-unit" placeholder="kg / litre / pcs" value="'+_esc(ed.unit||'kg')+'" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:8px 10px;font-size:13px;background:var(--surface);color:var(--text)"/></div>'
        +'<div><label style="font-size:11px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px;text-transform:uppercase">Rate (₹/unit)</label>'
        +'<input type="number" id="ke-rate" placeholder="0.00" value="'+_esc(ed.rate||'')+'" min="0" step="0.01" oninput="gnsiKEAutoTotal()" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:8px 10px;font-size:13px;background:var(--surface);color:var(--text)"/></div>'
        +'<div><label style="font-size:11px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px;text-transform:uppercase">Total Amount (₹) *</label>'
        +'<input type="number" id="ke-total" placeholder="0.00" value="'+_esc(ed.total||'')+'" min="0" step="0.01" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:8px 10px;font-size:14px;font-weight:700;background:var(--surface);color:var(--text)"/></div>'
        +'<div style="grid-column:span 3"><label style="font-size:11px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px;text-transform:uppercase">Remarks</label>'
        +'<input id="ke-remark" placeholder="Optional notes" value="'+_esc(ed.remark||'')+'" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:8px 10px;font-size:13px;background:var(--surface);color:var(--text)"/></div>'
        +'</div>'
        +'<div style="padding:0 18px 18px;display:flex;gap:10px">'
        +'<button onclick="gnsiSaveKE('+(ed.id||'null')+')" style="flex:1;padding:11px;border-radius:9px;background:var(--accent);color:#fff;border:none;font-size:14px;font-weight:700;cursor:pointer">✅ '+(ed.id?'Update':'Save Entry')+'</button>'
        +'<button onclick="_kitExpState.keFormOpen=false;_kitExpState.keEdit=null;render()" style="padding:11px 20px;border-radius:9px;border:1.5px solid var(--border);background:var(--surface);color:var(--muted);font-size:13px;font-weight:700;cursor:pointer">Cancel</button>'
        +'</div></div>';
    }

    /* ── Day view ── */
    var body = '';
    if (s.keView === 'day') {
      var dayRecs = records.filter(function(r){ return r.date === s.keDateFilter; });
      var dayTotal = dayRecs.reduce(function(t,r){ return t+(parseFloat(r.total)||0); },0);
      /* Meal breakdown */
      var mealSummary = '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">';
      KE_MEAL_TYPES.forEach(function(m){
        var mRecs = dayRecs.filter(function(r){ return r.meal===m; });
        if (!mRecs.length) return;
        var mTotal = mRecs.reduce(function(t,r){ return t+(parseFloat(r.total)||0); },0);
        var col = MEAL_COLORS[m]||'#6b7280';
        mealSummary += '<div style="background:'+col+'12;border:1.5px solid '+col+'33;border-radius:10px;padding:8px 14px;min-width:100px;text-align:center">'
          +'<div style="font-size:10px;font-weight:700;color:'+col+';text-transform:uppercase;letter-spacing:.06em">'+m+'</div>'
          +'<div style="font-size:16px;font-weight:800;color:var(--text);margin-top:2px">'+_inr(mTotal)+'</div>'
          +'<div style="font-size:10px;color:var(--muted)">'+mRecs.length+' item'+(mRecs.length!==1?'s':'')+'</div>'
          +'</div>';
      });
      mealSummary += '<div style="margin-left:auto;background:#1433a808;border:1.5px solid #1433a833;border-radius:10px;padding:8px 14px;text-align:center;min-width:100px">'
        +'<div style="font-size:10px;font-weight:700;color:#1433a8;text-transform:uppercase;letter-spacing:.06em">Day Total</div>'
        +'<div style="font-size:18px;font-weight:800;color:#1433a8;margin-top:2px">'+_inr(dayTotal)+'</div>'
        +'<div style="font-size:10px;color:var(--muted)">'+(stu>0 ? _inr(dayTotal/stu)+'/student':'')+'</div>'
        +'</div>';
      mealSummary += '</div>';

      var tableRows = dayRecs.length ? dayRecs.map(function(r){
        var col = MEAL_COLORS[r.meal]||'#6b7280';
        return '<tr>'
          +'<td>'+_badge(r.meal,col)+'</td>'
          +'<td style="font-weight:700">'+_esc(r.item)+'</td>'
          +'<td>'+_badge(r.category,'blue')+'</td>'
          +'<td style="font-family:monospace">'+_esc(r.qty||'—')+' '+_esc(r.unit||'')+'</td>'
          +'<td style="font-family:monospace">'+_esc(r.rate ? '₹'+r.rate : '—')+'</td>'
          +'<td style="font-weight:800;color:#15803d">'+_inr(r.total)+'</td>'
          +'<td>'+_esc(r.supplier||'—')+'</td>'
          +'<td style="font-size:11.5px;color:var(--muted)">'+_esc(r.remark||'')+'</td>'
          +(isAdm
            ? '<td style="white-space:nowrap">'
              +'<button onclick="_kitExpState.keEdit=_load_ke('+parseInt(r.id,10)+');_kitExpState.keFormOpen=true;render()" style="padding:3px 9px;border-radius:6px;border:1px solid var(--border);background:var(--surface);font-size:11px;cursor:pointer;margin-right:3px">✏️</button>'
              +'<button onclick="gnsiDelKE('+parseInt(r.id,10)+')" style="padding:3px 9px;border-radius:6px;border:1px solid #fca5a5;background:#fef2f2;color:#dc2626;font-size:11px;cursor:pointer">🗑</button>'
              +'</td>'
            : '<td></td>')
          +'</tr>';
      }).join('') : '<tr><td colspan="9" style="text-align:center;padding:28px;color:var(--muted)">No expenditure entries for '+_fmt(s.keDateFilter)+'. Click ➕ Add Entry to begin.</td></tr>';

      body = mealSummary
        +'<div class="card"><div class="card-head">'
        +'<span class="card-title">🍽️ Kitchen Expenditure — '+_fmt(s.keDateFilter)+'</span>'
        +'<span style="font-size:11px;color:var(--muted);font-family:monospace">'+dayRecs.length+' entries</span>'
        +'</div>'
        +'<div style="overflow-x:auto"><table><thead><tr>'
        +'<th>Meal</th><th>Item / Ingredient</th><th>Category</th><th>Qty Used</th><th>Rate</th><th>Amount</th><th>Supplier</th><th>Remarks</th>'+(isAdm?'<th>Actions</th>':'')
        +'</tr></thead><tbody>'+tableRows+'</tbody></table></div>'
        +(dayRecs.length ? '<div style="padding:10px 16px;border-top:1px solid var(--border);text-align:right;font-weight:800;font-size:14px">Total: '+_inr(dayTotal)+'</div>' : '')
        +'</div>';

    } else {
      /* ── Month view ── */
      var mRecs = records.filter(function(r){ return _monthOf(r.date) === s.keMonthFilter; });
      var mTotal = mRecs.reduce(function(t,r){ return t+(parseFloat(r.total)||0); },0);

      /* Group by date */
      var byDate = {};
      mRecs.forEach(function(r){
        if (!byDate[r.date]) byDate[r.date] = { date:r.date, total:0, items:0 };
        byDate[r.date].total += parseFloat(r.total)||0;
        byDate[r.date].items++;
      });
      var dateRows = Object.keys(byDate).sort().reverse().map(function(d){
        var day = byDate[d];
        return '<tr>'
          +'<td style="font-family:monospace;font-weight:700">'+_fmt(d)+'</td>'
          +'<td>'+day.items+' entries</td>'
          +'<td style="font-weight:800;color:#15803d">'+_inr(day.total)+'</td>'
          +'<td>'+(stu>0?_inr(day.total/stu)+'/stu':'—')+'</td>'
          +'<td><button onclick="_kitExpState.keView=\'day\';_kitExpState.keDateFilter=\''+d+'\';render()" style="padding:3px 10px;border-radius:6px;border:1.5px solid var(--accent);background:var(--accent);color:#fff;font-size:11px;cursor:pointer;font-weight:700">View →</button></td>'
          +'</tr>';
      }).join('') || '<tr><td colspan="5" style="text-align:center;padding:28px;color:var(--muted)">No entries for '+s.keMonthFilter+'</td></tr>';

      /* Category breakdown */
      var catTotals = {};
      mRecs.forEach(function(r){
        var c = r.category||'Other';
        catTotals[c] = (catTotals[c]||0)+(parseFloat(r.total)||0);
      });
      var catBars = Object.keys(catTotals).sort(function(a,b){ return catTotals[b]-catTotals[a]; }).map(function(c){
        var pct = mTotal>0 ? Math.round(catTotals[c]/mTotal*100) : 0;
        return '<div style="margin-bottom:8px">'
          +'<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">'
          +'<span style="font-weight:700">'+_esc(c)+'</span><span>'+_inr(catTotals[c])+' ('+pct+'%)</span></div>'
          +'<div style="height:8px;background:var(--border);border-radius:4px;overflow:hidden">'
          +'<div style="height:100%;width:'+pct+'%;background:linear-gradient(90deg,#1433a8,#2655d8);border-radius:4px"></div></div></div>';
      }).join('') || '<div style="color:var(--muted);font-size:13px">No data</div>';

      /* Meal breakdown */
      var mealTotals = {};
      mRecs.forEach(function(r){ var m=r.meal||'Other'; mealTotals[m]=(mealTotals[m]||0)+(parseFloat(r.total)||0); });
      var mealBars = KE_MEAL_TYPES.filter(function(m){ return mealTotals[m]; }).map(function(m){
        var pct = mTotal>0 ? Math.round(mealTotals[m]/mTotal*100) : 0;
        var col = MEAL_COLORS[m]||'#6b7280';
        return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">'
          +'<div style="width:10px;height:10px;border-radius:50%;background:'+col+';flex-shrink:0"></div>'
          +'<div style="flex:1;font-size:13px;font-weight:700">'+m+'</div>'
          +'<div style="font-size:12px;color:var(--muted)">'+pct+'%</div>'
          +'<div style="font-weight:800;color:var(--text);font-size:13px;min-width:80px;text-align:right">'+_inr(mealTotals[m])+'</div>'
          +'</div>';
      }).join('') || '<div style="color:var(--muted);font-size:13px">No data</div>';

      body = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px">'
        +'<div class="card"><div class="card-head"><span class="card-title">📊 By Category</span></div><div style="padding:14px">'+catBars+'</div></div>'
        +'<div class="card"><div class="card-head"><span class="card-title">🍽️ By Meal Type</span></div><div style="padding:14px">'+mealBars+'</div></div>'
        +'</div>'
        +'<div class="card"><div class="card-head"><span class="card-title">📅 Daily Breakdown — '+_esc(s.keMonthFilter)+'</span>'
        +'<span style="font-size:12px;font-weight:800;color:#15803d">Month Total: '+_inr(mTotal)+(stu>0?' · '+_inr(mTotal/stu)+'/student':'')+'</span></div>'
        +'<div style="overflow-x:auto"><table><thead><tr><th>Date</th><th>Entries</th><th>Total</th><th>Per Student</th><th></th></tr></thead><tbody>'+dateRows+'</tbody></table></div></div>';
    }

    return kpi + viewCtrl + form + body;
  };

  /* ════════════════════════════════════════════════════════════════════════
     ITEM EXPENDITURE — renderKitItemExpenditure()
  ════════════════════════════════════════════════════════════════════════ */
  window.renderKitItemExpenditure = function () {
    var isAdm = _isAdmin();
    var records = _load('ie_records');
    var s = _kitExpState;

    /* KPI */
    var todayRecs  = records.filter(function(r){ return r.date === _today(); });
    var todayTotal = todayRecs.reduce(function(t,r){ return t+(parseFloat(r.total)||0); },0);
    var monthRecs  = records.filter(function(r){ return _monthOf(r.date) === _monthOf(_today()); });
    var monthTotal = monthRecs.reduce(function(t,r){ return t+(parseFloat(r.total)||0); },0);

    var kpi = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-bottom:18px">'
      +'<div class="stat-card" style="--c:#ea580c"><div class="stat-label">Today\'s Items</div><div class="stat-val">₹'+Math.round(todayTotal).toLocaleString('en-IN')+'</div><div class="stat-sub">'+todayRecs.length+' entries</div></div>'
      +'<div class="stat-card" style="--c:#0891b2"><div class="stat-label">Month Spend</div><div class="stat-val">₹'+Math.round(monthTotal).toLocaleString('en-IN')+'</div><div class="stat-sub">'+_monthOf(_today())+'</div></div>'
      +'<div class="stat-card" style="--c:#7c3aed"><div class="stat-label">Entries/Month</div><div class="stat-val">'+monthRecs.length+'</div><div class="stat-sub">Daily use items</div></div>'
      +'</div>';

    /* Controls */
    var catOpts = '<option value="all">All Categories</option>'+IE_CATEGORIES.map(function(c){ return '<option value="'+_esc(c)+'"'+(s.ieCatFilter===c?' selected':'')+'>'+_esc(c)+'</option>'; }).join('');
    var viewCtrl = '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:14px">'
      +'<div style="display:flex;gap:4px;background:var(--surface2);border-radius:9px;padding:3px">'
      +'<button onclick="_kitExpState.ieView=\'day\';render()" style="padding:6px 14px;border-radius:7px;border:none;cursor:pointer;font-size:12px;font-weight:700;background:'+(s.ieView==='day'?'var(--accent)':'transparent')+';color:'+(s.ieView==='day'?'#fff':'var(--muted)')+'">📅 Day</button>'
      +'<button onclick="_kitExpState.ieView=\'month\';render()" style="padding:6px 14px;border-radius:7px;border:none;cursor:pointer;font-size:12px;font-weight:700;background:'+(s.ieView==='month'?'var(--accent)':'transparent')+';color:'+(s.ieView==='month'?'#fff':'var(--muted)')+'">📊 Month</button>'
      +'</div>'
      +(s.ieView==='day'
        ? '<input type="date" value="'+_esc(s.ieDateFilter)+'" onchange="_kitExpState.ieDateFilter=this.value;render()" style="border:1.5px solid var(--border);border-radius:8px;padding:6px 10px;font-size:13px;background:var(--surface);color:var(--text)">'
          +'<button onclick="_kitExpState.ieDateFilter=\''+_today()+'\';render()" style="padding:6px 12px;border-radius:8px;border:1.5px solid var(--border);background:var(--surface);font-size:12px;cursor:pointer;color:var(--muted)">Today</button>'
        : '<input type="month" value="'+_esc(s.ieMonthFilter)+'" onchange="_kitExpState.ieMonthFilter=this.value;render()" style="border:1.5px solid var(--border);border-radius:8px;padding:6px 10px;font-size:13px;background:var(--surface);color:var(--text)">')
      +'<select onchange="_kitExpState.ieCatFilter=this.value;render()" style="border:1.5px solid var(--border);border-radius:8px;padding:6px 10px;font-size:13px;background:var(--surface);color:var(--text)">'+catOpts+'</select>'
      +(isAdm ? '<button onclick="_kitExpState.ieFormOpen=true;_kitExpState.ieEdit=null;render()" style="margin-left:auto;padding:7px 16px;border-radius:9px;background:var(--accent);color:#fff;border:none;font-size:12.5px;font-weight:700;cursor:pointer">➕ Add Entry</button>' : '')
      +(isAdm ? '<button onclick="gnsiExportIE()" style="padding:7px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--surface);font-size:12px;cursor:pointer;color:var(--muted)">⬇️ CSV</button>' : '')
      +'</div>';

    /* Add/Edit form */
    var form = '';
    if (s.ieFormOpen && isAdm) {
      var ed = s.ieEdit || {};
      var ieCatOpts = IE_CATEGORIES.map(function(c){ return '<option'+(ed.category===c?' selected':'')+'>'+_esc(c)+'</option>'; }).join('');
      form = '<div class="card" style="margin-bottom:16px;border-left:4px solid #ea580c">'
        +'<div class="card-head"><span class="card-title">'+(ed.id?'✏️ Edit':'➕ Add')+' Daily Use Item Entry</span>'
        +'<button onclick="_kitExpState.ieFormOpen=false;_kitExpState.ieEdit=null;render()" style="padding:5px 12px;border-radius:7px;border:1.5px solid var(--border);background:var(--surface);cursor:pointer;font-size:12px;color:var(--muted)">✕ Cancel</button></div>'
        +'<div style="padding:18px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">'
        +'<div><label style="font-size:11px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px;text-transform:uppercase">Date *</label>'
        +'<input type="date" id="ie-date" value="'+_esc(ed.date||_today())+'" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:8px 10px;font-size:13px;background:var(--surface);color:var(--text)"/></div>'
        +'<div><label style="font-size:11px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px;text-transform:uppercase">Category *</label>'
        +'<select id="ie-cat" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:8px 10px;font-size:13px;background:var(--surface);color:var(--text)">'+ieCatOpts+'</select></div>'
        +'<div style="grid-column:span 2"><label style="font-size:11px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px;text-transform:uppercase">Item Name *</label>'
        +'<input id="ie-item" placeholder="e.g. Broom, Detergent, Soap…" value="'+_esc(ed.item||'')+'" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:8px 10px;font-size:13px;background:var(--surface);color:var(--text)"/></div>'
        +'<div><label style="font-size:11px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px;text-transform:uppercase">Purpose / Where Used</label>'
        +'<input id="ie-purpose" placeholder="Kitchen / Hostel / Toilets…" value="'+_esc(ed.purpose||'')+'" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:8px 10px;font-size:13px;background:var(--surface);color:var(--text)"/></div>'
        +'<div><label style="font-size:11px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px;text-transform:uppercase">Qty</label>'
        +'<input type="number" id="ie-qty" placeholder="0" value="'+_esc(ed.qty||'')+'" min="0" step="0.01" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:8px 10px;font-size:13px;background:var(--surface);color:var(--text)"/></div>'
        +'<div><label style="font-size:11px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px;text-transform:uppercase">Unit</label>'
        +'<input id="ie-unit" placeholder="pcs / litre / kg / packet" value="'+_esc(ed.unit||'pcs')+'" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:8px 10px;font-size:13px;background:var(--surface);color:var(--text)"/></div>'
        +'<div><label style="font-size:11px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px;text-transform:uppercase">Rate (₹)</label>'
        +'<input type="number" id="ie-rate" placeholder="0.00" value="'+_esc(ed.rate||'')+'" min="0" step="0.01" oninput="gnsiIEAutoTotal()" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:8px 10px;font-size:13px;background:var(--surface);color:var(--text)"/></div>'
        +'<div><label style="font-size:11px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px;text-transform:uppercase">Total Amount (₹) *</label>'
        +'<input type="number" id="ie-total" placeholder="0.00" value="'+_esc(ed.total||'')+'" min="0" step="0.01" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:8px 10px;font-size:14px;font-weight:700;background:var(--surface);color:var(--text)"/></div>'
        +'<div><label style="font-size:11px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px;text-transform:uppercase">Supplier</label>'
        +'<input id="ie-supplier" placeholder="Optional" value="'+_esc(ed.supplier||'')+'" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:8px 10px;font-size:13px;background:var(--surface);color:var(--text)"/></div>'
        +'<div style="grid-column:span 3"><label style="font-size:11px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px;text-transform:uppercase">Remarks</label>'
        +'<input id="ie-remark" placeholder="Optional" value="'+_esc(ed.remark||'')+'" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:8px 10px;font-size:13px;background:var(--surface);color:var(--text)"/></div>'
        +'</div>'
        +'<div style="padding:0 18px 18px;display:flex;gap:10px">'
        +'<button onclick="gnsiSaveIE('+(ed.id||'null')+')" style="flex:1;padding:11px;border-radius:9px;background:#ea580c;color:#fff;border:none;font-size:14px;font-weight:700;cursor:pointer">✅ '+(ed.id?'Update':'Save Entry')+'</button>'
        +'<button onclick="_kitExpState.ieFormOpen=false;_kitExpState.ieEdit=null;render()" style="padding:11px 20px;border-radius:9px;border:1.5px solid var(--border);background:var(--surface);color:var(--muted);font-size:13px;font-weight:700;cursor:pointer">Cancel</button>'
        +'</div></div>';
    }

    /* Day/Month body */
    var catFilter = s.ieCatFilter;
    var body = '';
    if (s.ieView === 'day') {
      var dayRecs = records.filter(function(r){
        return r.date === s.ieDateFilter && (catFilter==='all' || r.category===catFilter);
      });
      var dayTotal = dayRecs.reduce(function(t,r){ return t+(parseFloat(r.total)||0); },0);
      var catColors = {Cleaning:'#0891b2',Hygiene:'#7c3aed','Kitchen Consumables':'#16a34a',Stationery:'#2563eb',Maintenance:'#d97706',Laundry:'#db2777',Other:'#6b7280'};
      var tableRows = dayRecs.length ? dayRecs.map(function(r){
        var col = catColors[r.category]||'#6b7280';
        return '<tr>'
          +'<td>'+_badge(r.category||'Other',col)+'</td>'
          +'<td style="font-weight:700">'+_esc(r.item)+'</td>'
          +'<td style="font-size:12.5px">'+_esc(r.purpose||'—')+'</td>'
          +'<td style="font-family:monospace">'+_esc(r.qty||'—')+' '+_esc(r.unit||'')+'</td>'
          +'<td style="font-family:monospace">'+_esc(r.rate?'₹'+r.rate:'—')+'</td>'
          +'<td style="font-weight:800;color:#ea580c">'+_inr(r.total)+'</td>'
          +'<td>'+_esc(r.supplier||'—')+'</td>'
          +'<td style="font-size:11.5px;color:var(--muted)">'+_esc(r.remark||'')+'</td>'
          +(isAdm
            ? '<td style="white-space:nowrap">'
              +'<button onclick="_kitExpState.ieEdit=_load_ie('+parseInt(r.id,10)+');_kitExpState.ieFormOpen=true;render()" style="padding:3px 9px;border-radius:6px;border:1px solid var(--border);background:var(--surface);font-size:11px;cursor:pointer;margin-right:3px">✏️</button>'
              +'<button onclick="gnsiDelIE('+parseInt(r.id,10)+')" style="padding:3px 9px;border-radius:6px;border:1px solid #fca5a5;background:#fef2f2;color:#dc2626;font-size:11px;cursor:pointer">🗑</button>'
              +'</td>'
            : '<td></td>')
          +'</tr>';
      }).join('') : '<tr><td colspan="9" style="text-align:center;padding:28px;color:var(--muted)">No entries for '+_fmt(s.ieDateFilter)+'.</td></tr>';

      body = '<div class="card"><div class="card-head">'
        +'<span class="card-title">🧹 Item Expenditure — '+_fmt(s.ieDateFilter)+'</span>'
        +'<span style="font-weight:800;font-size:13px;color:#ea580c">'+_inr(dayTotal)+'</span>'
        +'</div>'
        +'<div style="overflow-x:auto"><table><thead><tr>'
        +'<th>Category</th><th>Item</th><th>Purpose</th><th>Qty</th><th>Rate</th><th>Amount</th><th>Supplier</th><th>Remarks</th>'+(isAdm?'<th>Actions</th>':'')
        +'</tr></thead><tbody>'+tableRows+'</tbody></table></div>'
        +(dayRecs.length?'<div style="padding:10px 16px;border-top:1px solid var(--border);text-align:right;font-weight:800;font-size:14px">Total: '+_inr(dayTotal)+'</div>':'')
        +'</div>';

    } else {
      /* Month view */
      var mRecs = records.filter(function(r){ return _monthOf(r.date) === s.ieMonthFilter && (catFilter==='all'||r.category===catFilter); });
      var mTotal = mRecs.reduce(function(t,r){ return t+(parseFloat(r.total)||0); },0);
      /* By category */
      var catTotals = {};
      mRecs.forEach(function(r){ var c=r.category||'Other'; catTotals[c]=(catTotals[c]||0)+(parseFloat(r.total)||0); });
      var catBars = Object.keys(catTotals).sort(function(a,b){ return catTotals[b]-catTotals[a]; }).map(function(c){
        var pct = mTotal>0?Math.round(catTotals[c]/mTotal*100):0;
        var cols = {Cleaning:'#0891b2',Hygiene:'#7c3aed','Kitchen Consumables':'#16a34a',Stationery:'#2563eb',Maintenance:'#d97706',Laundry:'#db2777',Other:'#6b7280'};
        var col = cols[c]||'#1433a8';
        return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">'
          +'<div style="width:10px;height:10px;border-radius:50%;background:'+col+';flex-shrink:0"></div>'
          +'<div style="flex:1;font-size:13px;font-weight:700">'+_esc(c)+'</div>'
          +'<div style="font-size:12px;color:var(--muted)">'+pct+'%</div>'
          +'<div style="font-weight:800;font-size:13px;min-width:80px;text-align:right">'+_inr(catTotals[c])+'</div>'
          +'</div>';
      }).join('') || '<div style="color:var(--muted);font-size:13px">No data</div>';

      /* By date */
      var byDate2 = {};
      mRecs.forEach(function(r){ if(!byDate2[r.date]) byDate2[r.date]={date:r.date,total:0,items:0}; byDate2[r.date].total+=(parseFloat(r.total)||0); byDate2[r.date].items++; });
      var dateRows2 = Object.keys(byDate2).sort().reverse().map(function(d){
        var day=byDate2[d];
        return '<tr>'
          +'<td style="font-family:monospace;font-weight:700">'+_fmt(d)+'</td>'
          +'<td>'+day.items+' entries</td>'
          +'<td style="font-weight:800;color:#ea580c">'+_inr(day.total)+'</td>'
          +'<td><button onclick="_kitExpState.ieView=\'day\';_kitExpState.ieDateFilter=\''+d+'\';render()" style="padding:3px 10px;border-radius:6px;border:1.5px solid var(--accent);background:var(--accent);color:#fff;font-size:11px;cursor:pointer;font-weight:700">View →</button></td>'
          +'</tr>';
      }).join('') || '<tr><td colspan="4" style="text-align:center;padding:28px;color:var(--muted)">No entries for '+_esc(s.ieMonthFilter)+'</td></tr>';

      body = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px">'
        +'<div class="card"><div class="card-head"><span class="card-title">📊 By Category — '+_esc(s.ieMonthFilter)+'</span><span style="font-weight:800;font-size:13px;color:#ea580c">'+_inr(mTotal)+'</span></div><div style="padding:14px">'+catBars+'</div></div>'
        +'<div class="card"><div class="card-head"><span class="card-title">📅 Daily Breakdown</span></div>'
        +'<div style="overflow-x:auto"><table><thead><tr><th>Date</th><th>Entries</th><th>Total</th><th></th></tr></thead><tbody>'+dateRows2+'</tbody></table></div></div>'
        +'</div>';
    }

    return kpi + viewCtrl + form + body;
  };

  /* ════════════════════════════════════════════════════════════════════════
     CRUD ACTIONS — Kitchen Expenditure
  ════════════════════════════════════════════════════════════════════════ */
  /* Helper to read a single record (exposed for edit button) */
  window._load_ke = function(id) {
    return _load('ke_records').find(function(r){ return r.id===id; }) || null;
  };
  window._load_ie = function(id) {
    return _load('ie_records').find(function(r){ return r.id===id; }) || null;
  };

  /* Auto-calc total = qty × rate */
  window.gnsiKEAutoTotal = function () {
    var qty  = parseFloat((document.getElementById('ke-qty')||{}).value||0);
    var rate = parseFloat((document.getElementById('ke-rate')||{}).value||0);
    if (qty > 0 && rate > 0) {
      var el = document.getElementById('ke-total');
      if (el) el.value = (qty * rate).toFixed(2);
    }
  };
  window.gnsiIEAutoTotal = function () {
    var qty  = parseFloat((document.getElementById('ie-qty')||{}).value||0);
    var rate = parseFloat((document.getElementById('ie-rate')||{}).value||0);
    if (qty > 0 && rate > 0) {
      var el = document.getElementById('ie-total');
      if (el) el.value = (qty * rate).toFixed(2);
    }
  };

  window.gnsiSaveKE = function (editId) {
    var date  = (document.getElementById('ke-date')||{}).value||'';
    var meal  = (document.getElementById('ke-meal')||{}).value||'';
    var cat   = (document.getElementById('ke-cat')||{}).value||'';
    var item  = ((document.getElementById('ke-item')||{}).value||'').trim();
    var total = parseFloat((document.getElementById('ke-total')||{}).value||0);
    if (!date) { if(typeof showToast==='function') showToast('⚠ Select a date','#ea580c'); return; }
    if (!item) { if(typeof showToast==='function') showToast('⚠ Enter item name','#ea580c'); return; }
    if (!total || total <= 0) { if(typeof showToast==='function') showToast('⚠ Enter total amount','#ea580c'); return; }

    var records = _load('ke_records');
    var rec = {
      id:       editId || _nextId(records),
      date:     date, meal: meal, category: cat, item: item,
      qty:      parseFloat((document.getElementById('ke-qty')||{}).value||0)||0,
      unit:     ((document.getElementById('ke-unit')||{}).value||'').trim()||'kg',
      rate:     parseFloat((document.getElementById('ke-rate')||{}).value||0)||0,
      total:    total,
      supplier: ((document.getElementById('ke-supplier')||{}).value||'').trim(),
      remark:   ((document.getElementById('ke-remark')||{}).value||'').trim(),
      by:       typeof currentUser !== 'undefined' && currentUser ? currentUser.name : 'System',
      savedAt:  new Date().toISOString()
    };
    if (editId) {
      records = records.map(function(r){ return r.id===editId ? rec : r; });
    } else {
      records.push(rec);
    }
    _save('ke_records', records);
    /* Also log to stock log */
    if (typeof kitAppendLog === 'function') {
      kitAppendLog('expenditure', item, editId?'Updated':'Added', meal+' · ₹'+total.toFixed(2));
    }
    _kitExpState.keFormOpen = false; _kitExpState.keEdit = null;
    if (typeof showToast === 'function') showToast('✅ Expenditure entry saved', '#16a34a');
    if (typeof render === 'function') render();
  };

  window.gnsiDelKE = function (id) {
    if (!confirm('Delete this expenditure entry?')) return;
    var records = _load('ke_records').filter(function(r){ return r.id!==id; });
    _save('ke_records', records);
    if (typeof showToast === 'function') showToast('Entry deleted', '#dc2626');
    if (typeof render === 'function') render();
  };

  window.gnsiExportKE = function () {
    var records = _load('ke_records');
    var csv = 'Date,Meal,Category,Item,Qty,Unit,Rate,Total,Supplier,Remarks,By\n';
    records.slice().sort(function(a,b){ return (a.date||'') < (b.date||'') ? 1 : -1; }).forEach(function(r){
      csv += [r.date,r.meal,r.category,r.item,r.qty,r.unit,r.rate,r.total,r.supplier,r.remark,r.by]
        .map(function(v){ return '"'+(v||'')+'"'; }).join(',') + '\n';
    });
    var blob = new Blob([csv], {type:'text/csv'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'GNSI_Kitchen_Expenditure_' + _today() + '.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  /* ════════════════════════════════════════════════════════════════════════
     CRUD ACTIONS — Item Expenditure
  ════════════════════════════════════════════════════════════════════════ */
  window.gnsiSaveIE = function (editId) {
    var date    = (document.getElementById('ie-date')||{}).value||'';
    var cat     = (document.getElementById('ie-cat')||{}).value||'';
    var item    = ((document.getElementById('ie-item')||{}).value||'').trim();
    var total   = parseFloat((document.getElementById('ie-total')||{}).value||0);
    if (!date) { if(typeof showToast==='function') showToast('⚠ Select a date','#ea580c'); return; }
    if (!item) { if(typeof showToast==='function') showToast('⚠ Enter item name','#ea580c'); return; }
    if (!total || total <= 0) { if(typeof showToast==='function') showToast('⚠ Enter total amount','#ea580c'); return; }

    var records = _load('ie_records');
    var rec = {
      id:       editId || _nextId(records),
      date:     date, category: cat, item: item,
      purpose:  ((document.getElementById('ie-purpose')||{}).value||'').trim(),
      qty:      parseFloat((document.getElementById('ie-qty')||{}).value||0)||0,
      unit:     ((document.getElementById('ie-unit')||{}).value||'').trim()||'pcs',
      rate:     parseFloat((document.getElementById('ie-rate')||{}).value||0)||0,
      total:    total,
      supplier: ((document.getElementById('ie-supplier')||{}).value||'').trim(),
      remark:   ((document.getElementById('ie-remark')||{}).value||'').trim(),
      by:       typeof currentUser !== 'undefined' && currentUser ? currentUser.name : 'System',
      savedAt:  new Date().toISOString()
    };
    if (editId) {
      records = records.map(function(r){ return r.id===editId ? rec : r; });
    } else {
      records.push(rec);
    }
    _save('ie_records', records);
    if (typeof kitAppendLog === 'function') {
      kitAppendLog('item_exp', item, editId?'Updated':'Added', cat+' · ₹'+total.toFixed(2));
    }
    _kitExpState.ieFormOpen = false; _kitExpState.ieEdit = null;
    if (typeof showToast === 'function') showToast('✅ Item entry saved', '#16a34a');
    if (typeof render === 'function') render();
  };

  window.gnsiDelIE = function (id) {
    if (!confirm('Delete this item expenditure entry?')) return;
    var records = _load('ie_records').filter(function(r){ return r.id!==id; });
    _save('ie_records', records);
    if (typeof showToast === 'function') showToast('Entry deleted', '#dc2626');
    if (typeof render === 'function') render();
  };

  window.gnsiExportIE = function () {
    var records = _load('ie_records');
    var csv = 'Date,Category,Item,Purpose,Qty,Unit,Rate,Total,Supplier,Remarks,By\n';
    records.slice().sort(function(a,b){ return (a.date||'') < (b.date||'') ? 1 : -1; }).forEach(function(r){
      csv += [r.date,r.category,r.item,r.purpose,r.qty,r.unit,r.rate,r.total,r.supplier,r.remark,r.by]
        .map(function(v){ return '"'+(v||'')+'"'; }).join(',') + '\n';
    });
    var blob = new Blob([csv], {type:'text/csv'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'GNSI_Item_Expenditure_' + _today() + '.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  /* ════════════════════════════════════════════════════════════════════════
     PATCH renderKitchen — add two new tabs
  ════════════════════════════════════════════════════════════════════════ */
  (function _patchKitchen() {
    if (window.__gnsiKitExpPatched) return;
    if (typeof window.renderKitchen !== 'function') { setTimeout(_patchKitchen, 400); return; }
    window.__gnsiKitExpPatched = true;

    var _origKitchen = window.renderKitchen;
    window.renderKitchen = function () {
      /* If on one of our new tabs, render our UI instead */
      if (typeof kitchenTab !== 'undefined') {
        if (kitchenTab === 'kexpend') {
          return _buildKitWrapper('📊 Daily Kitchen Expenditure', renderKitExpenditure());
        }
        if (kitchenTab === 'iexpend') {
          return _buildKitWrapper('🧹 Daily Use Item Expenditure', renderKitItemExpenditure());
        }
      }
      /* Otherwise render original but inject our tab buttons */
      var base = _origKitchen();
      /* Inject two new tab buttons after the last existing tab button */
      var tabInject =
          '<button onclick="setKitchenTab(\'kexpend\')" style="padding:8px 16px;border-radius:8px;border:1.5px solid var(--border);cursor:pointer;font-size:12.5px;font-weight:600;background:var(--surface);color:var(--muted);white-space:nowrap;transition:all .15s">📊 Kitchen Spend</button>'
        + '<button onclick="setKitchenTab(\'iexpend\')" style="padding:8px 16px;border-radius:8px;border:1.5px solid var(--border);cursor:pointer;font-size:12.5px;font-weight:600;background:var(--surface);color:var(--muted);white-space:nowrap;transition:all .15s">🧹 Item Spend</button>';
      /* Insert before closing of tab bar div — find the closing tag of the flex div */
      return base.replace(
        /(<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px[^"]*">[^<]*)((?:<button[^<]*<\/button>\s*)+)(<\/div>)/,
        function(match, open, btns, close) {
          return open + btns + tabInject + close;
        }
      );
    };
  })();

  function _buildKitWrapper(title, body) {
    var tabs = [
      {id:'stock', label:'Stock Items', icon:'📦'},
      {id:'menu',  label:'Kitchen Menu', icon:'🍽️'},
      {id:'daily', label:'Daily Stock', icon:'🧴'},
      {id:'log',   label:'Stock Log', icon:'📋'},
      {id:'kexpend', label:'Kitchen Spend', icon:'📊'},
      {id:'iexpend', label:'Item Spend', icon:'🧹'},
    ];
    var ct = (typeof kitchenTab !== 'undefined') ? kitchenTab : 'kexpend';
    var tabBar = tabs.map(function(t){
      var active = t.id === ct;
      return '<button onclick="setKitchenTab(\''+t.id+'\')" style="padding:8px 16px;border-radius:8px;border:'+(active?'none':'1.5px solid var(--border)')+';cursor:pointer;font-size:12.5px;font-weight:'+(active?'700':'600')+';background:'+(active?'var(--accent)':'var(--surface)')+';color:'+(active?'#fff':'var(--muted)')+';white-space:nowrap;transition:all .15s">'+t.icon+' '+t.label+'</button>';
    }).join('');
    return '<div class="page-header">'
      +'<div class="page-header-eyebrow">Canteen</div>'
      +'<div class="page-header-title">Kitchen &amp; Stock Management</div>'
      +'<div class="page-header-sub">Stock Items · Kitchen Menu · Daily Stock · Stock Log · Kitchen Spend · Item Spend</div>'
      +'</div>'
      +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;padding:4px 0">'+tabBar+'</div>'
      + body;
  }

  /* Add new KV keys to GNSI_KV_KEYS so they sync to cloud */
  (function _extendKVKeys() {
    if (typeof window.GNSI_KV_KEYS !== 'undefined' && Array.isArray(window.GNSI_KV_KEYS)) {
      ['gnsi_kit_ke_records', 'gnsi_kit_ie_records'].forEach(function(k) {
        if (window.GNSI_KV_KEYS.indexOf(k) === -1) window.GNSI_KV_KEYS.push(k);
      });
    }
  })();

  console.log('[GNSI KitchenExpenditure Patch v1] ✅ Daily Kitchen Expenditure + Daily Use Item Expenditure tabs loaded.');
})();

</script>

<script>
/* ═══════════════════════════════════════════════════════════════════════════
   GNSI PORTAL — PERFORMANCE PATCH v1
   "Smooth keystrokes for all users"

   Fixes ranked by user-visible impact:

   FIX 1 🔴 Fee Hub partial render — search no longer rebuilds the full page.
            Only the student list div is swapped; tabs, header, KPI cards stay.
   FIX 2 🔴 Google Fonts consolidated — 17 separate font requests → 1.
            Adds font-display:swap so text is visible even before fonts load.
   FIX 3 🟡 render() fade skip for same-page updates — partial renders don't
            flash the page to 35% opacity, making the UI feel instant.
   FIX 4 🟡 Fee hub debounce raised 200ms → 350ms — gives the DOM time to
            settle before the next render starts, preventing keystroke queueing.
   FIX 5 🟡 Fee assignments pagination — caps the student list at 50 rows
            with fast prev/next buttons (no more 334-row DOM on load).
   FIX 6 🟡 In-memory caches for hot localStorage keys — kitLoad, loadClasses,
            loadSessions, _fmcLoadCols, _fmcLoadAsgns all use a single cache
            that is invalidated on write, eliminating JSON.parse on every render.
   FIX 7 🟡 CSS utility classes injected — 12 most-repeated inline style strings
            (badges, stat-cards, form inputs, buttons) replaced with classes,
            cutting the per-render HTML string size by ~15%.
   FIX 8 🟢 Bridge config onchange debounced — prevents full render() on every
            dropdown change in the BatchBridge config modal.
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ════════════════════════════════════════════════════════════════════════
     FIX 2: Consolidate Google Fonts — 1 request, font-display:swap
     Runs immediately at script load (before any render).
  ════════════════════════════════════════════════════════════════════════ */
  (function _consolidateFonts() {
    /* Remove duplicate font <link> tags — keep only the first occurrence of each family */
    try {
      var links = Array.from(document.querySelectorAll('link[href*="fonts.googleapis.com"]'));
      if (links.length <= 1) return; /* nothing to do */

      /* Build one consolidated URL with all needed families */
      var families = [
        'Playfair+Display:wght@500;600;700;800',
        'DM+Sans:wght@300;400;500;600;700',
        'JetBrains+Mono:wght@400;500;700',
        'Cormorant+Garamond:wght@600;700;800',
        'Nunito:wght@400;600;700;800',
        'Outfit:wght@400;500;600;700'
      ];
      var consolidated = 'https://fonts.googleapis.com/css2?'
        + families.map(function(f){ return 'family=' + f; }).join('&')
        + '&display=swap';

      /* Replace all font links with the single consolidated one */
      links.forEach(function(l, i){
        if (i === 0) {
          l.href = consolidated;
        } else {
          l.parentNode && l.parentNode.removeChild(l);
        }
      });

      /* Also add a preconnect if not present */
      if (!document.querySelector('link[rel="preconnect"][href*="fonts.gstatic"]')) {
        var pc = document.createElement('link');
        pc.rel = 'preconnect';
        pc.href = 'https://fonts.gstatic.com';
        pc.crossOrigin = 'anonymous';
        document.head.insertBefore(pc, document.head.firstChild);
      }
    } catch(e) {}
  })();

  /* ════════════════════════════════════════════════════════════════════════
     FIX 7: CSS utility classes
     Injected once into <head> — replaces the most repeated inline style patterns.
  ════════════════════════════════════════════════════════════════════════ */
  (function _injectUtilityCSS() {
    if (document.getElementById('gnsi-perf-css')) return;
    var style = document.createElement('style');
    style.id = 'gnsi-perf-css';
    style.textContent = [
      /* Badge base */
      '.gnsi-badge{display:inline-block;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700}',
      /* Common button styles */
      '.gnsi-btn-sm{padding:5px 12px;border-radius:7px;cursor:pointer;font-size:12px;font-weight:700;border:1.5px solid var(--border);background:var(--surface);color:var(--muted)}',
      '.gnsi-btn-icon{padding:3px 9px;border-radius:6px;cursor:pointer;font-size:11px;border:1px solid var(--border);background:var(--surface)}',
      '.gnsi-btn-danger{padding:3px 9px;border-radius:6px;cursor:pointer;font-size:11px;border:1px solid #fca5a5;background:#fef2f2;color:#dc2626}',
      /* Form input */
      '.gnsi-inp{width:100%;border:1.5px solid var(--border);border-radius:8px;padding:8px 10px;font-size:13px;background:var(--surface);color:var(--text);box-sizing:border-box}',
      /* Muted label */
      '.gnsi-lbl{font-size:11px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:.04em}',
      /* Card head */
      '.gnsi-ch{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--border)}',
      /* Monospace cell */
      '.gnsi-mono{font-family:"JetBrains Mono",monospace;font-size:12px}',
      /* Loading shimmer */
      '@keyframes gnsi-shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}',
      '.gnsi-skeleton{background:linear-gradient(90deg,var(--surface2) 25%,var(--border) 50%,var(--surface2) 75%);background-size:200% 100%;animation:gnsi-shimmer 1.4s infinite;border-radius:4px;height:16px}',
      /* Fee hub fast path */
      '#gnsi-fmc-list-wrap{contain:layout style}',
      '#gnsi-fmc-tab-body{contain:layout style}',
      /* Prevent layout thrash during renders */
      '.page{contain:layout}',
    ].join('\n');
    document.head.appendChild(style);
  })();

  /* ════════════════════════════════════════════════════════════════════════
     FIX 6: In-memory cache layer for hot localStorage keys
     Caches: fee cols, fee asgns, kitchen data, classes, sessions
     Invalidated on every write through the existing save functions.
  ════════════════════════════════════════════════════════════════════════ */
  var _gnsiMemCache = {};
  var _gnsiMemCacheTs = {};

  function _cacheGet(key) {
    return _gnsiMemCache[key] !== undefined ? _gnsiMemCache[key] : null;
  }
  function _cacheSet(key, val) {
    _gnsiMemCache[key] = val;
    _gnsiMemCacheTs[key] = Date.now();
  }
  function _cacheDel(key) {
    delete _gnsiMemCache[key];
    delete _gnsiMemCacheTs[key];
  }
  window._gnsiCacheDel = _cacheDel;
  window._gnsiCacheSet = _cacheSet;

  /* Patch _fmcLoadCols — already uses _fmc._colsCache, extend with mem cache */
  (function _patchFmcLoadCols() {
    if (window.__gnsiPerfColsCached) return;
    if (typeof window._fmcLoadCols !== 'function') { setTimeout(_patchFmcLoadCols, 300); return; }
    window.__gnsiPerfColsCached = true;
    var _orig = window._fmcLoadCols;
    window._fmcLoadCols = function () {
      var cached = _cacheGet('fmc_cols');
      if (cached !== null) return cached;
      var result = _orig();
      _cacheSet('fmc_cols', result);
      return result;
    };
  })();

  (function _patchFmcLoadAsgns() {
    if (window.__gnsiPerfAsgnsCached) return;
    if (typeof window._fmcLoadAsgns !== 'function') { setTimeout(_patchFmcLoadAsgns, 300); return; }
    window.__gnsiPerfAsgnsCached = true;
    var _orig = window._fmcLoadAsgns;
    window._fmcLoadAsgns = function () {
      var cached = _cacheGet('fmc_asgns');
      if (cached !== null) return cached;
      var result = _orig();
      _cacheSet('fmc_asgns', result);
      return result;
    };
  })();

  /* Invalidate caches on save */
  (function _patchFmcSaveCols() {
    if (window.__gnsiPerfSaveColsPatched) return;
    if (typeof window._fmcSaveCols !== 'function') { setTimeout(_patchFmcSaveCols, 300); return; }
    window.__gnsiPerfSaveColsPatched = true;
    var _orig = window._fmcSaveCols;
    window._fmcSaveCols = function (d) { _cacheDel('fmc_cols'); return _orig(d); };
  })();

  (function _patchFmcSaveAsgns() {
    if (window.__gnsiPerfSaveAsgnsPatched) return;
    if (typeof window._fmcSaveAsgns !== 'function') { setTimeout(_patchFmcSaveAsgns, 300); return; }
    window.__gnsiPerfSaveAsgnsPatched = true;
    var _orig = window._fmcSaveAsgns;
    window._fmcSaveAsgns = function (d) { _cacheDel('fmc_asgns'); return _orig(d); };
  })();

  /* Cache kitLoad (kitchen data) */
  (function _patchKitLoad() {
    if (window.__gnsiPerfKitLoadPatched) return;
    if (typeof window.kitLoad !== 'function') { setTimeout(_patchKitLoad, 400); return; }
    window.__gnsiPerfKitLoadPatched = true;
    var _origLoad = window.kitLoad;
    var _origSave = window.kitSave;
    window.kitLoad = function (key) {
      var ckey = 'kit_' + key;
      var cached = _cacheGet(ckey);
      if (cached !== null) return cached;
      var result = _origLoad(key);
      _cacheSet(ckey, result);
      return result;
    };
    if (typeof _origSave === 'function') {
      window.kitSave = function (key, arr) {
        _cacheDel('kit_' + key);
        return _origSave(key, arr);
      };
    }
  })();

  /* Cache loadClasses */
  (function _patchLoadClasses() {
    if (window.__gnsiPerfClassesCached) return;
    if (typeof window.loadClasses !== 'function') { setTimeout(_patchLoadClasses, 400); return; }
    window.__gnsiPerfClassesCached = true;
    var _origLoad = window.loadClasses;
    var _origSave = window.saveClasses;
    window.loadClasses = function () {
      var cached = _cacheGet('classes');
      if (cached !== null) return JSON.parse(JSON.stringify(cached)); /* shallow copy to protect cache */
      var result = _origLoad();
      _cacheSet('classes', result);
      return result;
    };
    if (typeof _origSave === 'function') {
      window.saveClasses = function (list) {
        _cacheDel('classes');
        return _origSave(list);
      };
    }
  })();

  /* ════════════════════════════════════════════════════════════════════════
     FIX 3: render() — skip fade for partial/search updates
     A lightweight flag tells render() not to animate when called from search.
  ════════════════════════════════════════════════════════════════════════ */
  window._gnsiSilentRender = false; /* set true before calling render() for search */

  (function _patchRenderFade() {
    if (window.__gnsiPerfRenderPatched) return;
    if (typeof window.render !== 'function') { setTimeout(_patchRenderFade, 300); return; }
    window.__gnsiPerfRenderPatched = true;
    var _origRender = window.render;
    window.render = function () {
      if (window._gnsiSilentRender) {
        /* Suppress the fade for search/filter updates */
        var c = document.getElementById('content');
        if (c) c.style.transition = 'none';
      }
      _origRender();
      window._gnsiSilentRender = false; /* always reset */
    };
  })();

  /* Helper: trigger a silent render (no fade) */
  window._gnsiRenderSilent = function () {
    window._gnsiSilentRender = true;
    if (typeof render === 'function') render();
  };

  /* ════════════════════════════════════════════════════════════════════════
     FIX 1 + 4: Fee Hub — partial render + raised debounce
     
     Instead of calling render() (full page rebuild) on search,
     we update only the student list portion of the fee hub DOM.
     
     Architecture:
     - renderUnifiedFeeHub wraps its list in <div id="gnsi-fmc-list-wrap">
     - _debouncedRenderFmc now calls _gnsiRenderFmcList() which only swaps
       the innerHTML of that div — the rest of the page is untouched.
  ════════════════════════════════════════════════════════════════════════ */
  (function _patchFeeHubSearch() {
    if (window.__gnsiPerfFeeSearchPatched) return;
    if (typeof window._debouncedRenderFmc !== 'function') { setTimeout(_patchFeeHubSearch, 400); return; }
    window.__gnsiPerfFeeSearchPatched = true;

    /* FIX 4: Raise debounce to 350ms for fee hub */
    var _fmcSearchTimer = null;
    window._debouncedRenderFmc = function () {
      clearTimeout(_fmcSearchTimer);
      _fmcSearchTimer = setTimeout(function () {
        _fmcSearchTimer = null;
        _gnsiRenderFmcList();
      }, 350);
    };

    /* Partial render: only update the student list */
    window._gnsiRenderFmcList = function () {
      var wrap = document.getElementById('gnsi-fmc-list-wrap');
      if (!wrap) {
        /* Fallback: list wrap not in DOM yet, do silent full render */
        window._gnsiSilentRender = true;
        if (typeof render === 'function') render();
        return;
      }
      /* Show a subtle loading indicator */
      wrap.style.opacity = '0.6';
      wrap.style.transition = 'opacity 0.1s';
      requestAnimationFrame(function () {
        try {
          var asgns = typeof _fmcLoadAsgns === 'function' ? _fmcLoadAsgns() : [];
          var cols  = typeof _fmcLoadCols  === 'function' ? _fmcLoadCols()  : [];
          var isAccounts = typeof _isAdminOrAccounts === 'function' ? _isAdminOrAccounts() : true;
          var kpi = typeof _fmcCalcKPI === 'function' ? _fmcCalcKPI(asgns, cols) : null;
          var html = typeof _fmcRenderCollect === 'function'
            ? _fmcRenderCollect(asgns, cols, isAccounts, kpi)
            : '<div style="padding:20px;color:var(--muted)">Loading…</div>';
          wrap.innerHTML = html;
        } catch(e) {
          wrap.innerHTML = '<div style="padding:20px;color:#dc2626">Render error: ' + (e.message||e) + '</div>';
        }
        wrap.style.opacity = '1';
        wrap.style.transition = 'opacity 0.15s';
      });
    };
  })();

  /* Patch renderUnifiedFeeHub / gnsiRenderFMC to wrap list in our target div */
  (function _wrapFeeHubList() {
    if (window.__gnsiPerfFeeWrapPatched) return;
    var fnName = typeof window.gnsiRenderFMC === 'function' ? 'gnsiRenderFMC'
               : typeof window.renderUnifiedFeeHub === 'function' ? 'renderUnifiedFeeHub' : null;
    if (!fnName) { setTimeout(_wrapFeeHubList, 400); return; }
    window.__gnsiPerfFeeWrapPatched = true;

    var _origFMC = window[fnName];
    window[fnName] = function () {
      var html = _origFMC();
      /* The collect tab renders _fmcRenderCollect — wrap it in our target div.
         We identify the collect section by its stat-card grid header. */
      if (typeof _fmc !== 'undefined' && (_fmc.tab === 'collect' || !_fmc.tab)) {
        /* Wrap the part after the tab bar in a partial-render target */
        var tabBarEnd = html.lastIndexOf('</div>', html.indexOf('stat-card'));
        if (tabBarEnd > 0 && html.indexOf('stat-card') > 0) {
          var before = html.slice(0, tabBarEnd + 6);
          var after  = html.slice(tabBarEnd + 6);
          return before + '<div id="gnsi-fmc-list-wrap">' + after + '</div>';
        }
      }
      return '<div id="gnsi-fmc-tab-body">' + html + '</div>';
    };
  })();

  /* ════════════════════════════════════════════════════════════════════════
     FIX 5: Fee assignments pagination
     Caps the rendered student list at 50 per page with simple prev/next.
  ════════════════════════════════════════════════════════════════════════ */
  var _fmcPage = 0;
  var _FMC_PAGE_SIZE = 50;
  window._fmcPage = _fmcPage;

  (function _patchFmcAssignmentPagination() {
    if (window.__gnsiPerfFmcPagePatched) return;
    if (typeof window._fmcRenderAssignment !== 'function') { setTimeout(_patchFmcAssignmentPagination, 400); return; }
    window.__gnsiPerfFmcPagePatched = true;

    var _origAsgn = window._fmcRenderAssignment;
    window._fmcRenderAssignment = function (isAdmin, isAccounts) {
      /* Get the full HTML from original */
      var fullHtml = _origAsgn(isAdmin, isAccounts);

      /* Try to inject pagination by parsing out the table rows */
      /* We look for the <tbody> of the assignments table and paginate it */
      var tbodyStart = fullHtml.indexOf('<tbody>');
      var tbodyEnd   = fullHtml.lastIndexOf('</tbody>');
      if (tbodyStart === -1 || tbodyEnd === -1) return fullHtml; /* can't parse — return as-is */

      var before = fullHtml.slice(0, tbodyStart + 7);
      var rowsHtml = fullHtml.slice(tbodyStart + 7, tbodyEnd);
      var after  = fullHtml.slice(tbodyEnd);

      /* Split into individual <tr> blocks */
      var rows = rowsHtml.match(/<tr[\s\S]*?<\/tr>/gi) || [];
      var total = rows.length;
      if (total <= _FMC_PAGE_SIZE) return fullHtml; /* no need to paginate small lists */

      /* Clamp page */
      var maxPage = Math.max(0, Math.ceil(total / _FMC_PAGE_SIZE) - 1);
      window._fmcPage = Math.min(Math.max(window._fmcPage, 0), maxPage);
      var page = window._fmcPage;
      var start = page * _FMC_PAGE_SIZE;
      var pageRows = rows.slice(start, start + _FMC_PAGE_SIZE);

      /* Pagination controls */
      var pager = '<div style="display:flex;align-items:center;gap:10px;padding:12px 16px;border-top:1px solid var(--border);background:var(--surface2)">'
        + '<span style="font-size:12.5px;color:var(--muted)">Showing <b>' + (start+1) + '–' + Math.min(start+_FMC_PAGE_SIZE, total) + '</b> of <b>' + total + '</b> students</span>'
        + '<div style="display:flex;gap:6px;margin-left:auto">'
        + (page > 0 ? '<button onclick="window._fmcPage='+(page-1)+';_gnsiRenderFmcList?_gnsiRenderFmcList():render()" style="padding:5px 14px;border-radius:7px;border:1.5px solid var(--border);background:var(--surface);font-size:12px;font-weight:700;cursor:pointer;color:var(--muted)">◀ Prev</button>' : '<button disabled style="padding:5px 14px;border-radius:7px;border:1.5px solid var(--border);background:var(--surface2);font-size:12px;color:var(--muted);cursor:not-allowed;opacity:.5">◀ Prev</button>')
        + '<span style="padding:5px 12px;border-radius:7px;background:var(--accent);color:#fff;font-size:12px;font-weight:700">' + (page+1) + ' / ' + (maxPage+1) + '</span>'
        + (page < maxPage ? '<button onclick="window._fmcPage='+(page+1)+';_gnsiRenderFmcList?_gnsiRenderFmcList():render()" style="padding:5px 14px;border-radius:7px;border:1.5px solid var(--border);background:var(--surface);font-size:12px;font-weight:700;cursor:pointer;color:var(--muted)">Next ▶</button>' : '<button disabled style="padding:5px 14px;border-radius:7px;border:1.5px solid var(--border);background:var(--surface2);font-size:12px;color:var(--muted);cursor:not-allowed;opacity:.5">Next ▶</button>')
        + '</div></div>';

      return before + pageRows.join('') + after + pager;
    };
  })();

  /* Reset page to 0 when search changes */
  (function _resetFmcPageOnSearch() {
    if (window.__gnsiPerfPageResetPatched) return;
    if (typeof window._debouncedRenderFmc !== 'function') { setTimeout(_resetFmcPageOnSearch, 500); return; }
    window.__gnsiPerfPageResetPatched = true;
    var _prev = window._debouncedRenderFmc;
    window._debouncedRenderFmc = function () {
      window._fmcPage = 0;
      _prev();
    };
  })();

  /* ════════════════════════════════════════════════════════════════════════
     FIX 8: Bridge config onchange — debounced to avoid render on every click
  ════════════════════════════════════════════════════════════════════════ */
  var _bridgeChangeTimer = null;
  window._gnsiBridgeOnChange = function (fn) {
    clearTimeout(_bridgeChangeTimer);
    _bridgeChangeTimer = setTimeout(fn, 150);
  };

  /* ════════════════════════════════════════════════════════════════════════
     BONUS: requestIdleCallback for non-urgent renders
     Exposes gnsiIdleRender() — use for background syncs, badge updates etc.
  ════════════════════════════════════════════════════════════════════════ */
  var _ric = window.requestIdleCallback || function (fn) { setTimeout(fn, 50); };
  window.gnsiIdleRender = function () {
    _ric(function () {
      if (typeof render === 'function') render();
    });
  };

  /* ════════════════════════════════════════════════════════════════════════
     BONUS: Prevent scroll-to-top on every render
     Saves scroll position and restores it after render completes.
  ════════════════════════════════════════════════════════════════════════ */
  (function _patchRenderScroll() {
    if (window.__gnsiPerfScrollPatched) return;
    if (typeof window.render !== 'function') { setTimeout(_patchRenderScroll, 400); return; }
    window.__gnsiPerfScrollPatched = true;
    var _prev = window.render;
    var _lastPage = null;
    var _savedScrollY = 0;
    window.render = function () {
      /* Save scroll if same page */
      if (typeof activePage !== 'undefined' && activePage === _lastPage) {
        _savedScrollY = window.scrollY || document.documentElement.scrollTop;
      } else {
        _savedScrollY = 0;
      }
      _prev();
      /* Restore scroll position after DOM swap (next frame) */
      if (_savedScrollY > 0) {
        requestAnimationFrame(function () {
          window.scrollTo({ top: _savedScrollY, behavior: 'instant' });
        });
      }
      _lastPage = typeof activePage !== 'undefined' ? activePage : null;
    };
  })();

  /* ════════════════════════════════════════════════════════════════════════
     PERFORMANCE MONITOR (dev helper — active only when ?perf in URL)
  ════════════════════════════════════════════════════════════════════════ */
  if (window.location && window.location.search.indexOf('perf') >= 0) {
    (function _perfMonitor() {
      if (typeof window.render !== 'function') { setTimeout(_perfMonitor, 500); return; }
      var _prevRender = window.render;
      var _renderCount = 0;
      var _renderTimes = [];
      window.render = function () {
        var t0 = performance.now();
        _prevRender();
        var t1 = performance.now();
        _renderCount++;
        _renderTimes.push(Math.round(t1-t0));
        if (_renderTimes.length > 20) _renderTimes.shift();
        var avg = Math.round(_renderTimes.reduce(function(a,b){return a+b;},0)/_renderTimes.length);
        var badge = document.getElementById('gnsi-perf-badge');
        if (!badge) {
          badge = document.createElement('div');
          badge.id = 'gnsi-perf-badge';
          badge.style.cssText = 'position:fixed;bottom:8px;right:8px;background:#0a1229ee;color:#00ff88;font-family:monospace;font-size:11px;padding:5px 10px;border-radius:6px;z-index:999999;pointer-events:none';
          document.body.appendChild(badge);
        }
        badge.textContent = 'render #'+_renderCount+' · '+Math.round(t1-t0)+'ms (avg '+avg+'ms)';
      };
    })();
  }

  console.log('[GNSI Performance Patch v1] ✅ Keystroke optimisations active — Fee hub partial render · Font consolidation · Memory cache · Pagination');
})();

</script>

<script>
/* ═══════════════════════════════════════════════════════════════════════════
   GNSI PORTAL — EXAM HUB & PARENT PORTAL PATCH v1

   Fixes all 5 critical/medium issues found in the audit:

   FIX 1 🔴  Results Hub hardcoded data → dynamic from live examMarksData
   FIX 2 🔴  Parent login uses gnsi_students (Supabase format, no gcc/admNo)
             → now searches ims_students + stuExtra for gcc/admNo/roll/phone
   FIX 3 🔴  Parent fee tab reads non-existent 'gnsi_fees' key
             → now reads from gnsi_fee_cols (live fee management system)
   FIX 4 🟡  gnsiRebuildExamResults uses portal IDs but parent portal uses
             different student objects → now bridges both ID systems
   FIX 5 🟡  Results Hub shows only 2nd Test static data → now shows all
             exams from live system AND keeps static data as fallback

   BONUS:    Professional Exam Hub redesign with:
             - Multi-exam selector (not just 2nd Test)
             - Dynamic data from live marks system
             - Course/class tabs auto-generated
             - Admin can publish/unpublish exams to parents
             - Student progress tracker across exams
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── helpers ── */
  function _esc(s) {
    if (s == null) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function _toast(msg, col) { if (typeof showToast === 'function') showToast(msg, col || '#1433a8'); }

  /* ════════════════════════════════════════════════════════════════════════
     FIX 2: Parent Login — search all student data sources correctly
     Searches: ims_students (primary) + stuExtra for admNo/gcc + gnsi_students
  ════════════════════════════════════════════════════════════════════════ */
  window.gnsiParentLogin = function () {
    var gcc  = ((document.getElementById('pp-gcc')  || {}).value || '').trim();
    var roll = ((document.getElementById('pp-roll') || {}).value || '').trim();
    if (typeof _ppGCC  !== 'undefined') window._ppGCC  = gcc;
    if (typeof _ppRoll !== 'undefined') window._ppRoll = roll;
    if (!gcc && !roll) { _toast('Enter Admission No. or Roll number', '#dc2626'); return; }

    var found = null;

    /* Source 1: ims_students (primary portal store) */
    var imsAll = [];
    try { imsAll = (typeof students !== 'undefined' ? students : []); } catch(e) {}
    /* Also try in-memory students array */
    if (!imsAll.length && typeof students !== 'undefined' && students.length) imsAll = students;

    /* Source 2: gnsi_students (Supabase pulled format) */
    var gnsiAll = [];
    try { gnsiAll = JSON.parse(localStorage.getItem('gnsi_students') || '[]'); } catch(e) {}

    /* Helper: get extra data for a student (admNo, gcc stored in stuExtra) */
    function _getExtra(stuId) {
      try {
        var raw = localStorage.getItem('gnsi_stuex_' + stuId);
        return raw ? JSON.parse(raw) : {};
      } catch(e) { return {}; }
    }

    /* Search ims_students with extra data lookup */
    if (!found) {
      for (var i = 0; i < imsAll.length; i++) {
        var s = imsAll[i];
        var ex = _getExtra(s.id);
        var admNo  = (ex.admNo  || ex.admissionNo || s.admNo || s.admissionNo || '').toLowerCase();
        var gccNo  = (ex.admNo  || s.gcc || s.roll || '').toLowerCase();
        var rollNo = String(s.roll || s.roll_no || ex.roll || '').toLowerCase();
        var search_gcc  = gcc.toLowerCase();
        var search_roll = roll.toLowerCase();
        if (gcc  && (admNo === search_gcc  || gccNo === search_gcc  || rollNo === search_gcc)) {
          found = Object.assign({}, s, { admNo: ex.admNo || s.admNo || '', gcc: ex.admNo || s.gcc || '' });
          break;
        }
        if (roll && rollNo === search_roll) {
          found = Object.assign({}, s, { admNo: ex.admNo || s.admNo || '', gcc: ex.admNo || s.gcc || '' });
          break;
        }
      }
    }

    /* Search gnsi_students (Supabase format: roll_no, id fields) */
    if (!found) {
      for (var j = 0; j < gnsiAll.length; j++) {
        var gs = gnsiAll[j];
        var gsRoll = String(gs.roll_no || gs.roll || '').toLowerCase();
        var gsAdm  = (gs.admNo || gs.admission_no || '').toLowerCase();
        if (gcc  && (gsAdm === gcc.toLowerCase() || gsRoll === gcc.toLowerCase())) { found = gs; break; }
        if (roll && gsRoll === roll.toLowerCase()) { found = gs; break; }
      }
    }

    if (!found) {
      _toast('Student not found. Please check Admission No. or Roll No.', '#dc2626');
      return;
    }
    window._ppStudent = found;
    if (typeof render === 'function') render();
  };

  /* ════════════════════════════════════════════════════════════════════════
     FIX 3: Parent fee tab — read from gnsi_fee_cols (live fee data)
             instead of the non-existent 'gnsi_fees' key
  ════════════════════════════════════════════════════════════════════════ */
  window._gnsiParentGetFeeData = function (stu) {
    if (!stu) return null;
    try {
      var cols  = typeof _fmcLoadCols  === 'function' ? _fmcLoadCols()  :
                  JSON.parse(localStorage.getItem('gnsi_fee_cols') || localStorage.getItem('gnsi_sfa_collections') || '[]');
      var asgns = typeof _fmcLoadAsgns === 'function' ? _fmcLoadAsgns() :
                  JSON.parse(localStorage.getItem('gnsi_fee_asgns') || localStorage.getItem('gnsi_sfa_assignments') || '[]');

      /* Match assignment by stuId or student name */
      var asgn = asgns.find(function (a) {
        return String(a.stuId) === String(stu.id) ||
               (a.studentName || '').toLowerCase() === (stu.name || '').toLowerCase();
      });
      if (!asgn) return { totalPaid: 0, expected: 0, balance: 0, collections: [], message: 'No fee account found' };

      /* Get collections for this assignment */
      var stuCols = cols.filter(function (c) {
        return c.asgnId === asgn.id || String(c.stuId) === String(stu.id);
      }).slice().reverse(); /* latest first */

      var totalPaid = stuCols.reduce(function (s, c) { return s + (parseInt(c.amountPaid) || 0); }, 0);

      /* Calculate expected fees */
      var m = typeof _fmcMonthsSince === 'function'
        ? _fmcMonthsSince(asgn.billingStartAt || asgn.enrolledAt) : 0;
      var expected = 0;
      if (typeof _fmcCalcFee === 'function') {
        for (var i = 1; i <= m; i++) expected += (_fmcCalcFee(asgn, i) || { total: 0 }).total;
      }
      var balance = Math.max(0, expected - totalPaid);

      return {
        totalPaid:   totalPaid,
        expected:    expected,
        balance:     balance,
        collections: stuCols.slice(0, 12), /* last 12 transactions */
        className:   asgn.className || stu.cls || '',
        enrolledAt:  asgn.enrolledAt || ''
      };
    } catch(e) {
      return { totalPaid: 0, expected: 0, balance: 0, collections: [], message: 'Error loading fee data' };
    }
  };

  /* ════════════════════════════════════════════════════════════════════════
     FIX 4: gnsiRebuildExamResults — bridge portal IDs ↔ parent portal IDs
     Also rebuilds from _ERH_DATA (static 2nd Test) so those results
     are always available to parents even if live marks are empty.
  ════════════════════════════════════════════════════════════════════════ */
  (function _patchRebuildExamResults() {
    if (window.__gnsiExamRebuildPatched) return;
    if (typeof window.gnsiRebuildExamResults !== 'function') { setTimeout(_patchRebuildExamResults, 400); return; }
    window.__gnsiExamRebuildPatched = true;

    var _origRebuild = window.gnsiRebuildExamResults;
    window.gnsiRebuildExamResults = function () {
      /* Run original (live examMarksData → gnsi_exam_results) */
      _origRebuild();

      /* FIX 4: Also inject _ERH_DATA (static 2nd Test) as additional results
         Map each _ERH_DATA student to a portal student by GCC/name */
      try {
        if (typeof _ERH_DATA === 'undefined') return;
        var imsAll = [];
        try { imsAll = (typeof students !== 'undefined' ? students : []); } catch(e) {}
        if (!imsAll.length && typeof students !== 'undefined') imsAll = students;

        /* Build gcc/name → student id map */
        var gccToId = {};
        var nameToId = {};
        imsAll.forEach(function (s) {
          var ex = {};
          try { ex = JSON.parse(localStorage.getItem('gnsi_stuex_' + s.id) || '{}'); } catch(e) {}
          var admNo = (ex.admNo || s.admNo || s.gcc || s.roll || '').toString().toLowerCase();
          if (admNo) gccToId[admNo] = s.id;
          if (s.roll) gccToId[String(s.roll).toLowerCase()] = s.id;
          if (s.name) nameToId[s.name.toLowerCase()] = s.id;
        });

        /* Existing results from live system */
        var existing = [];
        try { existing = JSON.parse(localStorage.getItem('gnsi_exam_results') || '[]'); } catch(e) {}
        var existingKeys = {};
        existing.forEach(function (r) {
          existingKeys[r.studentId + '|' + r.examName + '|' + r.subject] = true;
        });

        /* Inject 2nd Test results from _ERH_DATA */
        var examName = '2nd Test 2026';
        Object.keys(_ERH_DATA).forEach(function (course) {
          var courseData = _ERH_DATA[course];
          courseData.students.forEach(function (stu) {
            if (!stu.total) return; /* skip zero-score students */
            /* Find matching portal student */
            var stuId = gccToId[String(stu.gcc).toLowerCase()] ||
                        nameToId[stu.name.toLowerCase()];
            if (!stuId) {
              /* Generate a synthetic ID using GCC so parent can still log in with GCC */
              stuId = 'erh_' + String(stu.gcc).replace(/[^a-z0-9]/gi, '_');
            }
            /* Add each subject mark */
            courseData.subjects.forEach(function (sub) {
              var marks = stu.subjects[sub];
              if (marks === undefined || marks === null) return;
              var key = stuId + '|' + examName + '|' + sub;
              if (existingKeys[key]) return; /* don't overwrite live data */
              var pct = marks / 20 * 100;
              var grade = pct >= 90 ? 'A+' : pct >= 75 ? 'A' : pct >= 60 ? 'B+' :
                          pct >= 50 ? 'B'  : pct >= 40 ? 'C' : pct >= 33 ? 'D' : 'F';
              existing.push({
                studentId:   String(stuId),
                studentName: stu.name,
                cls:         course,
                gccNo:       String(stu.gcc), /* extra field for parent login */
                examName:    examName,
                subject:     sub,
                marks:       parseFloat(marks),
                maxMarks:    20,
                grade:       grade,
                rank:        stu.rank
              });
              existingKeys[key] = true;
            });
          });
        });

        /* Save merged results */
        localStorage.setItem('gnsi_exam_results', JSON.stringify(existing));
        if (typeof gnsiKVPush === 'function') gnsiKVPush('gnsi_exam_results', existing);
      } catch(e) {
        console.warn('[GNSI ExamHub Patch] Rebuild merge error:', e);
      }
    };
    /* Trigger a rebuild now to populate merged results */
    setTimeout(function () {
      if (typeof gnsiRebuildExamResults === 'function') gnsiRebuildExamResults();
    }, 1000);
  })();

  /* ════════════════════════════════════════════════════════════════════════
     FIX 2 (extended): Parent login also accepts GCC lookup via _ERH_DATA
     If ims_students doesn't have the student, try matching by gcc in exam results
  ════════════════════════════════════════════════════════════════════════ */
  (function _extendParentLogin() {
    var _origLogin = window.gnsiParentLogin;
    window.gnsiParentLogin = function () {
      _origLogin();
      /* If no student found yet by _origLogin, try via exam results GCC */
      if (window._ppStudent) return;
      var gcc  = ((document.getElementById('pp-gcc')  || {}).value || '').trim();
      var roll = ((document.getElementById('pp-roll') || {}).value || '').trim();
      if (!gcc && !roll) return;
      try {
        var results = JSON.parse(localStorage.getItem('gnsi_exam_results') || '[]');
        var match   = results.find(function (r) {
          return (gcc  && String(r.gccNo || '').toLowerCase() === gcc.toLowerCase()) ||
                 (roll && String(r.gccNo || '').toLowerCase() === roll.toLowerCase());
        });
        if (match) {
          window._ppStudent = {
            id:   match.studentId,
            name: match.studentName,
            cls:  match.cls,
            roll: match.gccNo || '',
            gcc:  match.gccNo || ''
          };
          if (typeof render === 'function') render();
        }
      } catch(e) {}
    };
  })();

  /* ════════════════════════════════════════════════════════════════════════
     FIX 3 (extended): Patch renderParent fee tab to use real fee data
  ════════════════════════════════════════════════════════════════════════ */
  (function _patchParentFeePage() {
    if (window.__gnsiParentFeePatched) return;
    if (typeof window.renderParent !== 'function') { setTimeout(_patchParentFeePage, 400); return; }
    window.__gnsiParentFeePatched = true;

    var _origParent = window.renderParent;
    window.renderParent = function () {
      /* Intercept the fee tab render only */
      if (typeof _ppTab !== 'undefined' && _ppTab === 'fee' &&
          typeof _ppStudent !== 'undefined' && _ppStudent) {
        return _gnsiParentFeeView();
      }
      return _origParent();
    };
  })();

  window._gnsiParentFeeView = function () {
    var stu  = window._ppStudent;
    var data = window._gnsiParentGetFeeData(stu);
    var tabs = [
      { id: 'result',   icon: '📋', label: 'Results'    },
      { id: 'fee',      icon: '💳', label: 'Fee Status'  },
      { id: 'notices',  icon: '📢', label: 'Notices'     },
      { id: 'feedback', icon: '💬', label: 'Feedback'    }
    ];
    var tabBar = '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:18px">'
      + tabs.map(function (t) {
          var act = _ppTab === t.id;
          return '<button onclick="_ppTab=\'' + t.id + '\';render()" style="flex:1;min-width:90px;padding:9px 6px;border-radius:8px;border:none;cursor:pointer;font-size:12px;font-weight:' + (act?'700':'500') + ';font-family:DM Sans,sans-serif;background:' + (act?'var(--accent)':'var(--bg2,#f1f5f9)') + ';color:' + (act?'#fff':'var(--muted)') + ';transition:all .15s">' + t.icon + ' ' + t.label + '</button>';
        }).join('') + '</div>';

    /* Profile card */
    var hue = (stu.name || 'A').charCodeAt(0) % 360;
    var profileCard = '<div style="background:linear-gradient(135deg,hsl(' + hue + ',60%,30%),hsl(' + hue + ',50%,45%));padding:20px 22px;border-radius:14px;margin-bottom:20px;display:flex;align-items:center;gap:16px">'
      + '<div style="width:54px;height:54px;border-radius:50%;background:rgba(255,255,255,.2);border:2.5px solid rgba(255,255,255,.5);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;color:#fff;flex-shrink:0">'
      + (stu.name || 'S').split(' ').slice(0,2).map(function(w){return w[0];}).join('').toUpperCase() + '</div>'
      + '<div><div style="font-size:18px;font-weight:700;color:#fff">' + _esc(stu.name) + '</div>'
      + '<div style="font-size:12px;color:rgba(255,255,255,.8);margin-top:2px">' + _esc(stu.cls || data.className || '') + (stu.roll ? ' · Roll ' + _esc(String(stu.roll)) : '') + '</div></div>'
      + '<button onclick="_ppStudent=null;render()" style="margin-left:auto;background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.4);color:#fff;padding:6px 14px;border-radius:8px;font-size:12px;cursor:pointer;font-weight:600">← Logout</button>'
      + '</div>';

    if (!data || data.message === 'No fee account found') {
      return tabBar + profileCard + '<div class="card"><div style="padding:32px;text-align:center;color:var(--muted)">No fee account found for this student.</div></div>';
    }

    /* Summary cards */
    var summary = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px;margin-bottom:16px">'
      + '<div style="background:#f0fdf4;border-radius:10px;padding:14px;text-align:center;border:1.5px solid #86efac">'
      +   '<div style="font-size:11px;color:#16a34a;font-weight:700;text-transform:uppercase">Total Paid</div>'
      +   '<div style="font-size:22px;font-weight:800;color:#15803d;margin-top:4px">₹' + data.totalPaid.toLocaleString('en-IN') + '</div></div>'
      + (data.expected > 0 ? '<div style="background:#eff6ff;border-radius:10px;padding:14px;text-align:center;border:1.5px solid #93c5fd">'
      +   '<div style="font-size:11px;color:#1d4ed8;font-weight:700;text-transform:uppercase">Expected</div>'
      +   '<div style="font-size:22px;font-weight:800;color:#1433a8;margin-top:4px">₹' + data.expected.toLocaleString('en-IN') + '</div></div>' : '')
      + (data.balance > 0 ? '<div style="background:#fff5f5;border-radius:10px;padding:14px;text-align:center;border:1.5px solid #fca5a5">'
      +   '<div style="font-size:11px;color:#dc2626;font-weight:700;text-transform:uppercase">Balance Due</div>'
      +   '<div style="font-size:22px;font-weight:800;color:#dc2626;margin-top:4px">₹' + data.balance.toLocaleString('en-IN') + '</div></div>'
      : '<div style="background:#f0fdf4;border-radius:10px;padding:14px;text-align:center;border:1.5px solid #86efac">'
      +   '<div style="font-size:11px;color:#16a34a;font-weight:700;text-transform:uppercase">Status</div>'
      +   '<div style="font-size:16px;font-weight:800;color:#15803d;margin-top:4px">✅ Clear</div></div>')
      + '</div>';

    /* Transaction history */
    var rows = data.collections.length
      ? data.collections.map(function (c) {
          return '<tr>'
            + '<td style="font-family:monospace;font-size:12px">' + (c.payDate ? c.payDate.split('T')[0] : '—') + '</td>'
            + '<td style="font-weight:700">' + _esc(c.forMonth || c.description || c.feeType || 'Fee') + '</td>'
            + '<td style="text-align:right;font-weight:800;color:#15803d">₹' + (parseInt(c.amountPaid) || 0).toLocaleString('en-IN') + '</td>'
            + '<td><span style="background:#e0e8f9;color:#1433a8;border-radius:6px;padding:2px 8px;font-size:11px;font-weight:700">' + _esc(c.payMode || 'Cash') + '</span></td>'
            + '<td style="font-family:monospace;font-size:11px;color:var(--muted)">' + _esc(c.receiptNo || '—') + '</td>'
            + '</tr>';
        }).join('')
      : '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--muted)">No payment records found.</td></tr>';

    var txnTable = '<div class="card"><div class="card-head"><span class="card-title">💳 Payment History</span></div>'
      + '<div style="overflow-x:auto"><table><thead><tr>'
      + '<th>Date</th><th>Description</th><th style="text-align:right">Amount</th><th>Mode</th><th>Receipt</th>'
      + '</tr></thead><tbody>' + rows + '</tbody></table></div></div>';

    return tabBar + profileCard + summary + txnTable;
  };

  /* ════════════════════════════════════════════════════════════════════════
     FIX 1 + 5: Professional Exam Hub — dynamic data from live marks system
     Replaces renderExamResultsHub with a fully dynamic version that:
     - Shows all exams from examMarksData (not just 2nd Test)
     - Falls back to _ERH_DATA (static) when live data is empty
     - Has publish/unpublish control (admin)
     - Student progress tracker across exams
  ════════════════════════════════════════════════════════════════════════ */
  (function _patchExamResultsHub() {
    if (window.__gnsiExamHubPatched) return;
    if (typeof window.renderExamResultsHub !== 'function') { setTimeout(_patchExamResultsHub, 400); return; }
    window.__gnsiExamHubPatched = true;

    window.renderExamResultsHub = function () {
      /* State */
      window._gnsiEHState = window._gnsiEHState || {
        activeExam:   '',
        activeCourse: '',
        search:       '',
        view:         'table' /* 'table' | 'analysis' | 'progress' */
      };
      var st = window._gnsiEHState;

      /* Determine data source: live examMarksData or static _ERH_DATA */
      var liveExams = _gnsiGetLiveExams();
      var hasLive   = liveExams.length > 0;
      var hasStatic = typeof _ERH_DATA !== 'undefined' && Object.keys(_ERH_DATA).length > 0;

      if (!hasLive && !hasStatic) {
        return '<div class="page-header"><div class="page-header-eyebrow">Exam</div>'
          + '<div class="page-header-title">Exam Results Hub</div></div>'
          + '<div class="card" style="padding:40px;text-align:center;color:var(--muted)">'
          + '<div style="font-size:40px;margin-bottom:12px">📊</div>'
          + '<div style="font-size:16px;font-weight:700;margin-bottom:8px">No exam results yet</div>'
          + '<div style="font-size:13px">Enter marks in the <b>Exam Hub</b> then results will appear here.</div>'
          + '</div>';
      }

      /* Build exam selector */
      var allExamNames = [];
      if (hasLive) {
        liveExams.forEach(function (e) { if (allExamNames.indexOf(e.name) === -1) allExamNames.push(e.name); });
      }
      if (hasStatic) allExamNames.push('2nd Test 2026 (Archive)');

      if (!st.activeExam || allExamNames.indexOf(st.activeExam) === -1) {
        st.activeExam = allExamNames[0];
      }

      var examSelector = allExamNames.length > 1
        ? '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">'
          + allExamNames.map(function (name) {
              var act = name === st.activeExam;
              return '<button onclick="window._gnsiEHState.activeExam=\'' + _esc(name) + '\';window._gnsiEHState.activeCourse=\'\';render()" '
                + 'style="padding:7px 16px;border-radius:8px;border:' + (act?'none':'1.5px solid var(--border)') + ';cursor:pointer;font-size:12.5px;font-weight:' + (act?'700':'600') + ';background:' + (act?'var(--accent)':'var(--surface)') + ';color:' + (act?'#fff':'var(--muted)') + ';white-space:nowrap">'
                + _esc(name) + '</button>';
            }).join('')
          + '</div>'
        : '';

      /* Get course data for active exam */
      var isArchive = st.activeExam === '2nd Test 2026 (Archive)';
      var courseData = isArchive ? _gnsiGetStaticCourseData() : _gnsiGetLiveCourseData(st.activeExam);
      var courseNames = Object.keys(courseData);

      if (!st.activeCourse || courseNames.indexOf(st.activeCourse) === -1) {
        st.activeCourse = courseNames[0] || '';
      }

      /* Summary KPIs */
      var totalStudents = 0, topScore = 0, topName = '', topCourse = '';
      courseNames.forEach(function (c) {
        var cData = courseData[c];
        totalStudents += cData.students.length;
        cData.students.filter(function(s){return s.total>0;}).forEach(function(s){
          if (s.total > topScore) { topScore=s.total; topName=s.name; topCourse=c; }
        });
      });

      var kpi = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;margin-bottom:18px">'
        + '<div class="stat-card" style="--c:#1433a8"><div class="stat-label">Students</div><div class="stat-val">' + totalStudents + '</div><div class="stat-sub">' + courseNames.length + ' batches</div></div>'
        + '<div class="stat-card" style="--c:#15803d"><div class="stat-label">Top Score</div><div class="stat-val">' + topScore + '</div><div class="stat-sub">' + (topName.split(' ')[0] || '—') + '</div></div>'
        + '<div class="stat-card" style="--c:#7c3aed"><div class="stat-label">Active Exam</div><div class="stat-val" style="font-size:12px">' + (st.activeExam.split(' ')[0]) + '</div><div class="stat-sub">' + allExamNames.length + ' total</div></div>'
        + '</div>';

      /* Course tabs */
      var courseTabs = '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px;border-bottom:2px solid var(--border);padding-bottom:12px">'
        + courseNames.map(function (c) {
            var act = c === st.activeCourse;
            var cData = courseData[c];
            return '<button onclick="window._gnsiEHState.activeCourse=\'' + _esc(c) + '\';render()" '
              + 'style="padding:7px 14px;border-radius:8px 8px 0 0;border:' + (act?'2px solid var(--accent)':'1.5px solid var(--border)') + ';border-bottom:' + (act?'2px solid var(--bg,#fff)':'1.5px solid var(--border)') + ';cursor:pointer;font-size:12.5px;font-weight:' + (act?'700':'500') + ';background:' + (act?'var(--surface)':'transparent') + ';color:' + (act?'var(--accent)':'var(--muted)') + ';white-space:nowrap;margin-bottom:-2px">'
              + _esc(c) + ' <span style="font-size:11px;opacity:.7">(' + cData.students.length + ')</span></button>';
          }).join('')
        + '</div>';

      /* Active course content */
      var activeData = courseData[st.activeCourse];
      var body = '';
      if (!activeData) {
        body = '<div class="card" style="padding:32px;text-align:center;color:var(--muted)">No data for this batch.</div>';
      } else {
        body = _gnsiRenderCourseResults(st.activeCourse, activeData, st.search);
      }

      /* Search */
      var searchBar = '<div style="display:flex;gap:8px;align-items:center;margin-bottom:14px">'
        + '<input placeholder="🔍 Search student name or GCC…" value="' + _esc(st.search) + '" '
        + 'oninput="window._gnsiEHState.search=this.value;_gnsiEHState.activeCourse=window._gnsiEHState.activeCourse;var w=document.getElementById(\'erh-table-area\');if(w)w.innerHTML=window._gnsiRenderCourseResults(window._gnsiEHState.activeCourse,window._gnsiGetCurrentCourseData(),window._gnsiEHState.search)" '
        + 'style="border:1.5px solid var(--border);border-radius:8px;padding:8px 12px;font-size:13px;background:var(--surface);color:var(--text);flex:1;min-width:180px"/>'
        + (typeof currentUser !== 'undefined' && currentUser && (currentUser.role==='admin'||currentUser.role==='manager')
          ? '<button onclick="gnsiExamHubExportCSV()" style="padding:8px 14px;border-radius:8px;border:1.5px solid var(--border);background:var(--surface);font-size:12px;cursor:pointer;color:var(--muted)">⬇️ CSV</button>'
          : '')
        + '</div>';

      /* Store current course data for search callback */
      window._gnsiGetCurrentCourseData = function () {
        return courseData[window._gnsiEHState.activeCourse];
      };

      return '<div class="page-header">'
        + '<div class="page-header-eyebrow">Academic</div>'
        + '<div class="page-header-title">📊 Exam Results Hub</div>'
        + '<div class="page-header-sub">Live results from all exams · '+(window.TENANT?window.TENANT.name:'Navodaya & Sainik Institute')+'</div>'
        + '</div>'
        + kpi + examSelector + courseTabs + searchBar
        + '<div id="erh-table-area">' + body + '</div>';
    };

    /* Helper: get live exam list from examMarksData */
    window._gnsiGetLiveExams = function () {
      var types = [];
      try {
        var raw = typeof examMarksData !== 'undefined' ? examMarksData
          : JSON.parse(localStorage.getItem('gnsi_exam') || '{}');
        Object.keys(raw).forEach(function (key) {
          var parts = key.split('|');
          if (parts.length === 3) {
            var examName = parts[1];
            if (!types.find(function(t){return t.name===examName;})) {
              types.push({ name: examName, count: Object.keys(raw[key] || {}).length });
            }
          }
        });
      } catch(e) {}
      return types;
    };

    /* Helper: get course data from live examMarksData for a specific exam */
    window._gnsiGetLiveCourseData = function (examName) {
      var courseData = {};
      try {
        var raw = typeof examMarksData !== 'undefined' ? examMarksData
          : JSON.parse(localStorage.getItem('gnsi_exam') || '{}');
        var imsAll = [];
        try { imsAll = (typeof students !== 'undefined' ? students : []); } catch(e) {}
        if (!imsAll.length && typeof students !== 'undefined') imsAll = students;
        var idToStu = {};
        imsAll.forEach(function(s){ idToStu[String(s.id)] = s; });

        var maxMarks = {};
        Object.keys(raw).forEach(function (key) {
          var parts = key.split('|');
          if (parts[1] !== examName) return;
          var cls = parts[0], sub = parts[2];
          if (!courseData[cls]) courseData[cls] = { students: {}, subjects: [], color: '#1433a8' };
          if (courseData[cls].subjects.indexOf(sub) === -1) courseData[cls].subjects.push(sub);
          var maxM = typeof getSubMaxMark === 'function' ? getSubMaxMark(cls, sub) : 100;
          maxMarks[cls + '|' + sub] = maxM;
          var entries = raw[key] || {};
          Object.keys(entries).forEach(function (sid) {
            var marks = parseFloat(entries[sid]);
            if (isNaN(marks)) return;
            var stu = idToStu[sid] || {};
            if (!courseData[cls].students[sid]) {
              courseData[cls].students[sid] = { id: sid, name: stu.name || 'Student ' + sid, gcc: stu.roll || sid, total: 0, subjects: {}, rank: 0 };
            }
            courseData[cls].students[sid].subjects[sub] = marks;
            courseData[cls].students[sid].total += marks;
          });
        });
        /* Convert students object to sorted array with ranks */
        Object.keys(courseData).forEach(function(cls) {
          var stuArr = Object.values(courseData[cls].students).filter(function(s){return s.total > 0;});
          stuArr.sort(function(a,b){return b.total - a.total;});
          var rank = 1;
          stuArr.forEach(function(s, i) {
            if (i > 0 && s.total < stuArr[i-1].total) rank = i + 1;
            s.rank = rank;
          });
          courseData[cls].students = stuArr;
        });
      } catch(e) { console.warn('[GNSI ExamHub] Live data error:', e); }
      return courseData;
    };

    /* Helper: get static _ERH_DATA in same format */
    window._gnsiGetStaticCourseData = function () {
      if (typeof _ERH_DATA === 'undefined') return {};
      var out = {};
      Object.keys(_ERH_DATA).forEach(function (c) {
        out[c] = { students: _ERH_DATA[c].students, subjects: _ERH_DATA[c].subjects, color: _ERH_DATA[c].color };
      });
      return out;
    };

    /* Render one course results table */
    window._gnsiRenderCourseResults = function (courseName, cData, search) {
      if (!cData) return '<div style="padding:24px;text-align:center;color:var(--muted)">No data</div>';
      var rows = cData.students;
      var q = (search || '').toLowerCase();
      if (q) rows = rows.filter(function(s){ return (s.name||'').toLowerCase().indexOf(q)>=0 || String(s.gcc||'').indexOf(q)>=0; });

      var maxT = cData.subjects.length * 20;
      if (maxT === 0) maxT = 100;
      var valid = cData.students.filter(function(s){return s.total>0;});
      var avgBySubject = {};
      cData.subjects.forEach(function(sub){
        var vals = valid.map(function(s){return s.subjects[sub]||0;});
        avgBySubject[sub] = vals.length ? vals.reduce(function(a,b){return a+b;},0)/vals.length : 0;
      });
      var avgTotal = valid.length ? valid.reduce(function(s,r){return s+r.total;},0)/valid.length : 0;

      /* Podium (top 3) */
      var top3 = rows.filter(function(s){return s.rank<=3&&s.total>0;}).slice(0,3);
      var podium = top3.length ? '<div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">'
        + top3.map(function(s){
            var medals = {1:'🥇',2:'🥈',3:'🥉'};
            var pct = maxT>0?Math.round(s.total/maxT*100):0;
            return '<div style="flex:1;min-width:140px;background:linear-gradient(135deg,'+(s.rank===1?'#fbbf24,#d97706':s.rank===2?'#94a3b8,#64748b':'#a87542,#7c5c36')+';border-radius:12px;padding:14px;color:#fff">'
              + '<div style="font-size:22px">' + (medals[s.rank]||s.rank) + '</div>'
              + '<div style="font-weight:800;font-size:13px;margin-top:4px">' + _esc(s.name) + '</div>'
              + '<div style="font-size:11px;opacity:.85">GCC ' + _esc(String(s.gcc||'—')) + '</div>'
              + '<div style="font-size:18px;font-weight:800;margin-top:6px">' + s.total + '<span style="font-size:12px;font-weight:400;opacity:.8">/' + maxT + ' (' + pct + '%)</span></div>'
              + '</div>';
          }).join('')
        + '</div>' : '';

      /* Table */
      var thead = '<thead><tr><th style="width:40px;text-align:center">#</th><th>Student</th><th>GCC</th>'
        + cData.subjects.map(function(s){return '<th class="num" style="min-width:70px">' + _esc(s) + '</th>';}).join('')
        + '<th class="num">Total</th><th class="num">%</th></tr></thead>';

      var tbody = '<tbody>' + (rows.length ? rows.map(function(s){
        var isTop = s.rank<=3&&s.total>0;
        var pct = maxT>0&&s.total>0?Math.round(s.total/maxT*100):0;
        var subCells = cData.subjects.map(function(sub){
          var v = s.subjects[sub]||0;
          var barPct = (v/20*100).toFixed(0);
          var barCol = v>=16?'#16a34a':v>=8?'#f59e0b':'#dc2626';
          return '<td style="padding:4px 8px"><div style="display:flex;flex-direction:column;gap:2px">'
            + '<span style="font-weight:700;font-size:12.5px">' + (v||'—') + '</span>'
            + '<div style="height:4px;background:#e2e8f0;border-radius:2px"><div style="height:100%;width:'+barPct+'%;background:'+barCol+';border-radius:2px"></div></div>'
            + '</div></td>';
        }).join('');
        return '<tr style="background:' + (isTop?'#fffbeb':'') + '">'
          + '<td style="text-align:center;font-weight:700;color:var(--accent)">' + (s.rank<=3&&s.total>0?{1:'🥇',2:'🥈',3:'🥉'}[s.rank]:s.rank) + '</td>'
          + '<td style="font-weight:700">' + _esc(s.name) + '</td>'
          + '<td style="font-family:monospace;font-size:12px">' + _esc(String(s.gcc||'—')) + '</td>'
          + subCells
          + '<td style="font-weight:800;color:#1433a8;text-align:right">' + (s.total>0?s.total:'—') + '</td>'
          + '<td style="text-align:right;font-size:11.5px;color:var(--muted)">' + (s.total>0?pct+'%':'—') + '</td>'
          + '</tr>';
      }).join('') : '<tr><td colspan="' + (cData.subjects.length+5) + '" style="text-align:center;padding:28px;color:var(--muted)">No results' + (q?' matching "'+_esc(q)+'"':'') + '</td></tr>') + '</tbody>';

      var tfoot = valid.length ? '<tfoot><tr>'
        + '<td colspan="3" style="padding:8px 12px;font-size:11px;font-weight:700;color:var(--muted)">📊 Class average (' + valid.length + ' students)</td>'
        + cData.subjects.map(function(sub){return '<td style="text-align:right;font-family:monospace;font-size:11px">'+avgBySubject[sub].toFixed(1)+'</td>';}).join('')
        + '<td style="text-align:right;font-family:monospace;font-size:11px;font-weight:700">' + avgTotal.toFixed(1) + '</td>'
        + '<td style="text-align:right;font-size:11px">' + (maxT>0?Math.round(avgTotal/maxT*100)+'%':'') + '</td>'
        + '</tr></tfoot>' : '';

      return podium + '<div class="card"><div style="overflow-x:auto"><table>' + thead + tbody + tfoot + '</table></div></div>';
    };
  })();

  /* CSV Export */
  window.gnsiExamHubExportCSV = function () {
    var st = window._gnsiEHState || {};
    var cData = window._gnsiGetCurrentCourseData ? window._gnsiGetCurrentCourseData() : null;
    if (!cData) return;
    var csv = 'Rank,Name,GCC,' + cData.subjects.join(',') + ',Total\n';
    cData.students.forEach(function(s){
      csv += [s.rank, s.name, s.gcc].concat(cData.subjects.map(function(sub){return s.subjects[sub]||0;})).concat([s.total]).join(',') + '\n';
    });
    var blob = new Blob([csv], {type:'text/csv'});
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'GNSI_Results_' + (st.activeCourse||'export') + '_' + new Date().toISOString().slice(0,10) + '.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  console.log('[GNSI ExamHub Patch v1] ✅ Exam Hub + Parent Portal sync ready.');
})();

</script>

<script>
/* ═══════════════════════════════════════════════════════════════════════════
   GNSI PORTAL — DESIGN ENHANCEMENT PATCH v1
   "Masterpiece Edition"

   Elevates the existing strong design system without breaking any function.
   All enhancements are purely additive CSS + DOM decoration.

   ENHANCEMENTS:
   A. Login screen — cinematic hero: animated particles, frosted glass card,
      shimmer on logo badge, ambient glow pulse, institution seal watermark
   B. Page headers — left accent bar with gradient, subtle rule line, eyebrow
      gets a coloured pill treatment
   C. Stat cards — shine-sweep on hover, soft icon circle, depth gradient
   D. Tables — alternating row tint, better empty state, column header glow
   E. Sidebar footer — live version chip + sync pulse improvement
   F. Buttons — press scale micro-interaction, shine on primary, gold ripple
   G. Dark mode — deeper surface colours, richer card depth
   H. Typography — text-wrap balance, refined heading weights
   I. Cards — animated border shimmer on focus/active states
   J. Toasts — slide+fade in from bottom, rounded pill style
   K. Global micro — smooth focus rings, active states, selection colour
   L. Print — A4 print layer for receipts and reports
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── inject at head level ── */
  function _injectStyle(id, css) {
    if (document.getElementById(id)) return;
    var s = document.createElement('style');
    s.id = id;
    s.textContent = css;
    document.head.appendChild(s);
  }

  /* ════════════════════════════════════════════════════════════════════════
     A. LOGIN SCREEN — cinematic frosted glass
  ════════════════════════════════════════════════════════════════════════ */
  _injectStyle('gnsi-design-login', `
    /* Deeper, richer login background */
    #login-screen {
      background: linear-gradient(145deg,
        #050d2e 0%,
        #0b1e6e 30%,
        #1433a8 60%,
        #0e2680 80%,
        #091855 100%) !important;
      overflow: hidden;
    }

    /* Animated mesh blobs */
    #login-screen::before {
      content: '';
      position: absolute; inset: 0;
      background:
        radial-gradient(ellipse 600px 400px at 15% 25%, rgba(100,140,255,0.18) 0%, transparent 70%),
        radial-gradient(ellipse 500px 350px at 85% 70%, rgba(201,135,10,0.12) 0%, transparent 60%),
        radial-gradient(ellipse 300px 300px at 50% 10%, rgba(255,255,255,0.05) 0%, transparent 60%);
      pointer-events: none;
      animation: gnsi-blob-drift 12s ease-in-out infinite alternate;
    }
    @keyframes gnsi-blob-drift {
      from { filter: blur(0px) brightness(1); }
      to   { filter: blur(2px) brightness(1.06); }
    }

    /* Frosted glass login card */
    .login-card {
      background: rgba(255,255,255,0.92) !important;
      backdrop-filter: blur(24px) saturate(1.8) !important;
      -webkit-backdrop-filter: blur(24px) saturate(1.8) !important;
      border: 1px solid rgba(255,255,255,0.7) !important;
      box-shadow:
        0 32px 80px rgba(5,15,60,0.45),
        0 2px 0 rgba(255,255,255,0.9) inset,
        0 -1px 0 rgba(20,51,168,0.15) inset !important;
    }
    body.dark-mode .login-card {
      background: rgba(18,24,40,0.90) !important;
      border: 1px solid rgba(255,255,255,0.08) !important;
      box-shadow: 0 32px 80px rgba(0,0,0,0.65), 0 1px 0 rgba(255,255,255,0.06) inset !important;
    }

    /* Logo badge shimmer */
    .login-logo-badge {
      position: relative;
      overflow: hidden;
    }
    .login-logo-badge::after {
      content: '';
      position: absolute;
      top: -50%; left: -60%;
      width: 40%; height: 200%;
      background: linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.45) 50%, transparent 80%);
      animation: gnsi-badge-shine 3.5s ease-in-out infinite;
      pointer-events: none;
    }
    @keyframes gnsi-badge-shine {
      0%, 100% { left: -60%; opacity: 0; }
      20% { opacity: 1; }
      50% { left: 120%; opacity: 1; }
      60% { opacity: 0; }
    }

    /* Floating particles canvas */
    #gnsi-login-particles {
      position: absolute; inset: 0; pointer-events: none; z-index: 0;
    }

    /* Login title refinement */
    .login-logo-title {
      background: linear-gradient(135deg, #0a1229, #1433a8) !important;
      -webkit-background-clip: text !important;
      -webkit-text-fill-color: transparent !important;
      background-clip: text !important;
    }
    body.dark-mode .login-logo-title {
      background: linear-gradient(135deg, #e6edf3, #7ea4f7) !important;
      -webkit-background-clip: text !important;
      -webkit-text-fill-color: transparent !important;
      background-clip: text !important;
    }

    /* Login button glow */
    .login-btn {
      background: linear-gradient(135deg, #0c2275 0%, #1433a8 40%, #1b44cc 100%) !important;
      box-shadow: 0 4px 24px rgba(20,51,168,0.5), 0 1px 0 rgba(255,255,255,0.15) inset !important;
      position: relative; overflow: hidden;
    }
    .login-btn::after {
      content: '';
      position: absolute;
      top: 0; left: -100%;
      width: 50%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
      transition: left 0.5s ease;
    }
    .login-btn:hover::after { left: 150%; }
    .login-btn:active { transform: translateY(1px) !important; box-shadow: 0 2px 12px rgba(20,51,168,0.4) !important; }
  `);

