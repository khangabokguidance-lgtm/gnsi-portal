/* GNSI PORTAL — patches/tenant.js
   GNSI Multi-Tenant Isolation Patch
   Injects school_id on all reads and writes for multi-school use.
   This patch was at lines ~70100-71279 of the original portal HTML. */

          }
        } catch(e) {
          _gnsiToast('⚠️ Fee collection cloud confirmation failed: ' + (e.message || ''), '#dc2626');
        }
      }, 500);
    };
  }

  /* ── 9. DATA INTEGRITY CHECKER — run on login ────────────────────────── */
  function gnsiIntegrityCheck() {
    var issues = [];
    /* Check: any queued writes still pending? */
    var q = _queueGet();
    if (q.length > 0) {
      issues.push(q.length + ' unsaved changes from a previous session are queued for sync');
      _queueFlush(); /* try to flush immediately */
    }
    /* Check: students array loaded? */
    if (typeof students === 'undefined' || !Array.isArray(students)) {
      issues.push('Students data not loaded');
    }
    /* Check: Supabase connected? */
    if (!window._supa) {
      issues.push('Supabase not connected — all saves will be local only');
    }
    if (issues.length > 0) {
      console.warn('[GNSI Integrity]', issues);
      if (!window._supa) {
        _gnsiToast('⚠️ Working offline — data saving to device only', '#f59e0b');
      }
    }
    return issues;
  }
  window.gnsiIntegrityCheck = gnsiIntegrityCheck;

  /* Run integrity check 5 seconds after load */
  setTimeout(function() {
    if (typeof currentUser !== 'undefined' && currentUser) gnsiIntegrityCheck();
  }, 5000);

  /* Expose flush for manual use */
  window.gnsiFlushWriteQueue = _queueFlush;

  console.log('[GNSI] Commercial Data Safety Patch v1.0 loaded — Students, Fees, Attendance, Income protected');

  /* ── FIX 1b: Browser back/forward support ───────────────────────────────── */
  window.addEventListener('popstate', function(e) {
    /* SECURITY: reject all navigation if not authenticated */
    if (typeof currentUser === 'undefined' || !currentUser) {
      history.replaceState(null, '', location.pathname);
      return;
    }
    if (e.state && e.state.page && typeof navigate === 'function') {
      /* Navigate without pushing another history entry */
      if(typeof canAccess === 'function' && !canAccess(e.state.page)) return;
      activePage = e.state.page;
      if(typeof buildNav === 'function') buildNav();
      var pg = (typeof PAGES !== 'undefined') ? PAGES.find(function(p){ return p.id === e.state.page; }) : null;
      var titleEl = document.getElementById('page-title');
      if(titleEl && pg) titleEl.textContent = pg.label;
      if(typeof render === 'function') render();
    }
  });
  /* On first load, read hash and navigate to it — ONLY if logged in */
  setTimeout(function() {
    /* SECURITY: never navigate via hash before authentication is confirmed */
    if (typeof currentUser === 'undefined' || !currentUser) return;
    var hash = location.hash.slice(1);
    if (hash && typeof navigate === 'function' && typeof canAccess === 'function' && canAccess(hash)) {
      navigate(hash);
    }
  }, 1200);

  /* ── FIX 3: Global skeleton helper ──────────────────────────────────────── */
  window.gnsiSkeletonTable = function(rows, cols) {
    rows = rows || 5; cols = cols || 5;
    var header = '<thead><tr>' + Array(cols).fill(
      '<th><div class="skeleton skeleton-line short" style="margin:0"></div></th>'
    ).join('') + '</tr></thead>';
    var body = Array(rows).fill(
      '<tr>' + Array(cols).fill(
        '<td><div class="skeleton skeleton-line" style="margin:0;height:12px;' +
        (Math.random() > 0.5 ? 'width:75%' : 'width:100%') + '"></div></td>'
      ).join('') + '</tr>'
    ).join('');
    return '<table style="width:100%;border-collapse:collapse">' + header +
      '<tbody>' + body + '</tbody></table>';
  };

  window.gnsiSkeletonCards = function(count) {
    count = count || 4;
    return Array(count).fill(
      '<div style="border-radius:12px;border:1px solid var(--border-soft);padding:16px;margin-bottom:10px">' +
        '<div style="display:flex;gap:10px;align-items:center;margin-bottom:12px">' +
          '<div class="skeleton skeleton-avatar"></div>' +
          '<div style="flex:1"><div class="skeleton skeleton-line" style="height:14px;margin-bottom:6px"></div>' +
          '<div class="skeleton skeleton-line short" style="height:11px;margin:0"></div></div>' +
        '</div>' +
        '<div class="skeleton skeleton-line" style="height:11px;margin-bottom:6px"></div>' +
        '<div class="skeleton skeleton-line med" style="height:11px;margin:0"></div>' +
      '</div>'
    ).join('');
  };

  /* ── FIX 4: Staff table mobile card view ────────────────────────────────── */
  /* Inject after renderStaff renders — wraps staff table in desktop/mobile split */
  var _origRenderStaff = window.renderStaff;
  if (typeof _origRenderStaff === 'function') {
    window.renderStaff = function() {
      var html = _origRenderStaff.apply(this, arguments);
      /* Replace the plain staff table with desktop+mobile layout */
      html = html.replace(
        '<div class="card"><div class="card-head"><span class="card-title">Staff Directory</span>',
        '<div class="card" id="gnsi-staff-card"><div class="card-head"><span class="card-title">Staff Directory</span>'
      );
      return html;
    };
  }

  /* Staff mobile card render — injected after table renders */
  function _gnsiRenderStaffMobile() {
    var card = document.getElementById('gnsi-staff-card');
    if (!card) return;
    if (document.getElementById('gnsi-staff-mob')) return; /* already rendered */
    var tbody = document.getElementById('staff-tbody');
    if (!tbody) return;
    /* Build mobile cards from current staff data */
    if (typeof staff === 'undefined' || !staff.length) return;
    var filtered = typeof getFilteredStaff === 'function' ? getFilteredStaff() : staff;
    if (!filtered.length) return;
    var cards = filtered.map(function(s) {
      var initial = s.name.split(' ').map(function(w){ return w[0]||''; }).join('').slice(0,2).toUpperCase();
      var hue = s.name.split('').reduce(function(a,c){ return a + c.charCodeAt(0); }, 0) % 360;
      return '<div style="border-radius:12px;border:1px solid var(--border-soft);padding:14px;margin-bottom:10px;background:var(--surface)">' +
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">' +
          '<div style="width:38px;height:38px;border-radius:50%;background:hsl('+hue+',55%,45%);color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0">'+initial+'</div>' +
          '<div style="flex:1;min-width:0">' +
            '<div style="font-weight:700;font-size:14px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(s.name)+'</div>' +
            '<div style="font-size:11px;color:var(--muted);font-family:JetBrains Mono,monospace">ID #'+parseInt(s.id,10)+'</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px">' +
          '<span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:var(--accent-light);color:var(--accent)">'+esc(s.role||'--')+'</span>' +
          '<span style="padding:3px 10px;border-radius:20px;font-size:11px;background:var(--surface2);color:var(--muted)">'+esc(s.dept||'--')+'</span>' +
          '<span style="padding:3px 10px;border-radius:20px;font-size:11px;background:'+(s.status==='Active'?'#dcfce7':'#fee2e2')+';color:'+(s.status==='Active'?'#16a34a':'#dc2626')+';font-weight:700">'+esc(s.status||'Active')+'</span>' +
        '</div>' +
        (s.phone ? '<div style="font-size:12px;color:var(--muted);margin-bottom:10px">📞 '+esc(s.phone)+'</div>' : '') +
        '<div style="display:flex;gap:6px">' +
          '<button onclick="staffEditId='+parseInt(s.id,10)+';showAddStaff=true;render()" style="flex:1;padding:8px;border-radius:8px;border:1.5px solid var(--accent);background:var(--accent-light);color:var(--accent);font-size:12px;font-weight:700;cursor:pointer">✏ Edit</button>' +
        '</div>' +
      '</div>';
    }).join('');

    var mobWrap = document.createElement('div');
    mobWrap.id = 'gnsi-staff-mob';
    mobWrap.style.cssText = 'display:none';
    mobWrap.innerHTML = cards;
    card.appendChild(mobWrap);

    /* Apply show/hide based on screen width */
    function _applyStaffLayout() {
      var tableWrap = card.querySelector('div[style*="overflow-x:auto"]') ||
                      card.querySelector('table');
      var isMobile = window.innerWidth <= 768;
      if (tableWrap) tableWrap.style.display = isMobile ? 'none' : '';
      mobWrap.style.display = isMobile ? 'block' : 'none';
    }
    _applyStaffLayout();
    window.removeEventListener('resize', window._gnsiStaffResize);
    window._gnsiStaffResize = _applyStaffLayout;
    window.addEventListener('resize', window._gnsiStaffResize);
  }

  /* Hook into render to inject staff mobile after each render */
  var _origRenderFn = window.render;
  if (typeof _origRenderFn === 'function') {
    window.render = function() {
      _origRenderFn.apply(this, arguments);
      setTimeout(_gnsiRenderStaffMobile, 80);
    };
  }

  /* ── UTILITY CSS CLASSES using spacing tokens ──────────────────────────── */
  var _utilStyle = document.createElement('style');
  _utilStyle.textContent =
    /* Spacing utilities */
    '.p-1{padding:var(--sp-1)}.p-2{padding:var(--sp-2)}.p-3{padding:var(--sp-3)}.p-4{padding:var(--sp-4)}' +
    '.px-3{padding-left:var(--sp-3);padding-right:var(--sp-3)}.px-4{padding-left:var(--sp-4);padding-right:var(--sp-4)}' +
    '.py-2{padding-top:var(--sp-2);padding-bottom:var(--sp-2)}.py-3{padding-top:var(--sp-3);padding-bottom:var(--sp-3)}' +
    '.mt-2{margin-top:var(--sp-2)}.mt-3{margin-top:var(--sp-3)}.mt-4{margin-top:var(--sp-4)}' +
    '.mb-2{margin-bottom:var(--sp-2)}.mb-3{margin-bottom:var(--sp-3)}.mb-4{margin-bottom:var(--sp-4)}' +
    '.gap-2{gap:var(--sp-2)}.gap-3{gap:var(--sp-3)}.gap-4{gap:var(--sp-4)}' +
    /* Typography utilities */
    '.text-xs{font-size:var(--text-xs)}.text-sm{font-size:var(--text-sm)}.text-base{font-size:var(--text-base)}' +
    '.text-md{font-size:var(--text-md)}.text-lg{font-size:var(--text-lg)}.text-muted{color:var(--muted)}' +
    '.text-muted2{color:var(--muted2)}.text-accent{color:var(--accent)}.font-mono{font-family:"JetBrains Mono",monospace}' +
    '.font-bold{font-weight:700}.font-semibold{font-weight:600}' +
    /* Table row hover with transition */
    'tbody tr{transition:background 0.12s ease}' +
    /* Card base using tokens */
    '.gnsi-card{background:var(--surface);border-radius:var(--radius);border:1px solid var(--border-soft);padding:var(--sp-4)}' +
    /* Form field consistent height */
    'input.gnsi-input,select.gnsi-input,textarea.gnsi-input{' +
      'padding:var(--sp-2) var(--sp-3);border-radius:var(--radius-sm);' +
      'border:1.5px solid var(--border);font-size:var(--text-base);' +
      'background:var(--surface);color:var(--text);width:100%;box-sizing:border-box}' +
    'input.gnsi-input:focus,select.gnsi-input:focus{border-color:var(--accent);outline:none}';
  document.head.appendChild(_utilStyle);

  /* ── MOBILE RESPONSIVE TABLES — Gap fix ─────────────────────────────────
     Converts wide data tables to card layout on phones (< 600px).
     Add data-label="Column Name" to each <td> for labels to appear.
  ─────────────────────────────────────────────────────────────────────────── */
  var _mobileStyle = document.createElement('style');
  _mobileStyle.textContent = `
    @media (max-width: 600px) {
      .responsive-table thead { display: none; }
      .responsive-table tbody tr {
        display: block;
        border: 1px solid var(--border-soft, rgba(0,0,0,.1));
        border-radius: 10px;
        margin-bottom: 10px;
        padding: 10px 12px;
        background: var(--surface, #fff);
      }
      .responsive-table tbody td {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 5px 0;
        border: none;
        font-size: 13px;
        border-bottom: 0.5px solid var(--border-soft, rgba(0,0,0,.06));
      }
      .responsive-table tbody td:last-child { border-bottom: none; }
      .responsive-table tbody td::before {
        content: attr(data-label);
        font-weight: 600;
        color: var(--muted, #888);
        font-size: 11px;
        flex-shrink: 0;
        margin-right: 8px;
      }
      /* Touch targets — min 44px */
      @media (hover: none) and (pointer: coarse) {
        .btn, button, .action-btn, .edit-btn, .del-btn {
          min-height: 44px;
          min-width: 44px;
        }
        input, select, textarea { min-height: 44px; }
      }
    }
  `;
  document.head.appendChild(_mobileStyle);

  /* ── RLS SETUP REMINDER — shown once to admin ────────────────────────────
     Reminds admin to enable RLS for security. Shows once, dismissible.
  ─────────────────────────────────────────────────────────────────────────── */
  function _gnsiCheckRLS() {
    if(!window._supa) return;
    if(typeof currentUser === 'undefined' || !currentUser || currentUser.role !== 'admin') return;
    if(localStorage.getItem('_gnsi_rls_dismissed')) return;
    /* Check if RLS is enabled by trying a test query pattern */
    var _banner = document.createElement('div');
    _banner.id = 'gnsi-rls-banner';
    _banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:99998;background:#1433a8;color:#fff;font-size:12.5px;padding:10px 16px;display:flex;align-items:center;gap:12px;';
    _banner.innerHTML = '<span style="flex:1">🔒 <b>Security tip:</b> Enable Supabase Row Level Security (RLS) on your tables to protect student and fee data. Go to Supabase → Table Editor → each table → Enable RLS.</span>'
      + '<button onclick="localStorage.setItem(\'_gnsi_rls_dismissed\',\'1\');this.parentElement.remove()" style="padding:5px 12px;border-radius:8px;border:1px solid rgba(255,255,255,.4);background:transparent;color:#fff;cursor:pointer;font-size:12px">Got it</button>';
    setTimeout(function() {
      if(!document.getElementById('gnsi-rls-banner')) document.body.appendChild(_banner);
    }, 15000);
  }
  setTimeout(_gnsiCheckRLS, 15000);
})();
</script>

<script>

/* ── School Settings save/preview (v76) ──────────────────────────────── */
function gnsiSaveSchoolSettings() {
  var g = function(id){ var el=document.getElementById(id); return el?el.value.trim():''; };
  var color = g('ss-color-hex') || g('ss-color') || '#1433a8';
  var settings = {
    name        : g('ss-name'),
    shortName   : g('ss-short'),
    principal   : g('ss-principal'),
    established : g('ss-estd'),
    regNo       : g('ss-regno'),
    portalTitle : g('ss-title'),
    address     : g('ss-addr'),
    city        : g('ss-city'),
    state       : g('ss-state'),
    pincode     : g('ss-pin'),
    phone       : g('ss-phone'),
    color       : color,
    logoUrl     : g('ss-logo')
  };
  if (!settings.name) { showToast('School name is required.','#dc2626'); return; }
  localStorage.setItem('gnsi_school_settings', JSON.stringify(settings));
  window.TENANT = Object.assign(window.TENANT||{}, settings);
  if (typeof gnsiApplyBranding === 'function') {
    gnsiApplyBranding({
      school_code    : localStorage.getItem('gnsi_active_school_code') || 'gnsi',
      school_name    : settings.name,
      short_name     : settings.shortName,
      address        : settings.address,
      city           : settings.city,
      state          : settings.state,
      pincode        : settings.pincode,
      phone          : settings.phone,
      principal      : settings.principal,
      reg_no         : settings.regNo,
      established_year: settings.established,
      primary_color  : settings.color,
      logo_url       : settings.logoUrl,
      portal_title   : settings.portalTitle
    });
  }
  if (typeof gnsiKVPush === 'function') gnsiKVPush('gnsi_school_settings', settings);
  var jwt = localStorage.getItem('gnsi_jwt_token');
  var apiUrl = window.GNSI_SERVER_URL;
  if (jwt && apiUrl) {
    fetch(apiUrl + '/api/schools/info', {
      method : 'PUT',
      headers: { 'Content-Type':'application/json', 'Authorization':'Bearer '+jwt },
      body   : JSON.stringify(settings)
    }).catch(function(){});
  }
  showToast('School settings saved ✅','#16a34a');
  if (typeof render === 'function') { window._dashCache=null; render(); }
}

function gnsiPreviewSchoolSettings() {
  var g = function(id){ var el=document.getElementById(id); return el?el.value.trim():''; };
  var name  = g('ss-name')  || 'School Name';
  var short = g('ss-short') || 'SCH';
  var color = g('ss-color-hex') || g('ss-color') || '#1433a8';
  var logo  = g('ss-logo')  || '';
  var sbTitle = document.querySelector('.sb-logo-title');
  var topInst = document.querySelector('.topbar-inst');
  if (sbTitle) sbTitle.textContent = short;
  if (topInst) topInst.textContent = name;
  var styleEl = document.getElementById('gnsi-brand-colors');
  if (!styleEl) { styleEl=document.createElement('style'); styleEl.id='gnsi-brand-colors'; document.head.appendChild(styleEl); }
  styleEl.textContent = ':root{--accent:'+color+';--accent-mid:'+color+'}.ls-btn{background:'+color+'!important}.sb-logo{background:'+color+'!important}.nav-btn.active{border-left-color:'+color+'!important}';
  if (logo) {
    var logoImg = document.querySelector('#ls-logo-wrap img');
    if (logoImg) logoImg.src = logo;
  }
  showToast('Preview applied — save to make permanent','#1433a8');
}

document.addEventListener('change', function(e){
  if (e.target && e.target.id === 'ss-color') {
    var hex = document.getElementById('ss-color-hex');
    if (hex) hex.value = e.target.value;
  }
  if (e.target && e.target.id === 'ss-color-hex') {
    var picker = document.getElementById('ss-color');
    if (picker && /^#[0-9a-fA-F]{6}$/.test(e.target.value)) picker.value = e.target.value;
  }
});

(function(){
  try {
    var saved = JSON.parse(localStorage.getItem('gnsi_school_settings')||'null');
    if (saved && saved.name) {
      window.TENANT = Object.assign(window.TENANT||{}, saved);
    }
  } catch(e){}
})();

</script>
</body>
</html>

<script>
/* ── GNSI SaaS API — embedded directly so it always loads ── */
const GNSI_API = (function() {
  const BASE_URL = window.GNSI_SERVER_URL || 'http://localhost:3000';
  let _token = localStorage.getItem('gnsi_jwt_token') || null;
  let _user  = null;
  try { const s = localStorage.getItem('gnsi_jwt_user'); if(s) _user = JSON.parse(s); } catch(e) {}

  async function _fetch(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (_token) headers['Authorization'] = 'Bearer ' + _token;
    const res = await fetch(BASE_URL + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    if (res.status === 401) {
      _token = null; _user = null;
      localStorage.removeItem('gnsi_jwt_token'); localStorage.removeItem('gnsi_jwt_user');
      if (typeof showToast === 'function') showToast('Session expired. Please log in again.', '#dc2626');
      setTimeout(function() { location.reload(); }, 2000);
      throw new Error('Session expired');
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'API error');
    return data;
  }

  async function login(schoolCode, username, password) {
    const data = await _fetch('POST', '/api/auth/login', { schoolCode, username, password });
    _token = data.token; _user = data.user;
    localStorage.setItem('gnsi_jwt_token', _token);
    localStorage.setItem('gnsi_jwt_user', JSON.stringify(_user));
    return data;
  }

  function logout() { _token = null; _user = null; localStorage.removeItem('gnsi_jwt_token'); localStorage.removeItem('gnsi_jwt_user'); }
  function getUser()    { return _user; }
  function getToken()   { return _token; }
  function isLoggedIn() { return !!_token && !!_user; }

  setInterval(function() { if (_token) _fetch('POST', '/api/auth/refresh').then(function(d){ _token = d.token; localStorage.setItem('gnsi_jwt_token', _token); }).catch(function(){}); }, 7*60*60*1000);

  return {
    login, logout, getUser, getToken, isLoggedIn, fetch: _fetch,
    students: {
      list:   (p={}) => _fetch('GET', '/api/students?' + new URLSearchParams(p)),
      get:    (id)   => _fetch('GET', '/api/students/' + id),
      create: (s,e)  => _fetch('POST', '/api/students', {student:s, extra:e}),
      update: (id,s,e) => _fetch('PUT', '/api/students/' + id, {student:s, extra:e}),
      delete: (id)   => _fetch('DELETE', '/api/students/' + id),
    },
    fees: {
      collections: (p={}) => _fetch('GET', '/api/fees/collections?' + new URLSearchParams(p)),
      collect: (p) => _fetch('POST', '/api/fees/collect', p),
      dues:    ()  => _fetch('GET', '/api/fees/dues'),
      summary: (id)=> _fetch('GET', '/api/fees/summary/' + id),
    },
    attendance: {
      get:     (d,t) => _fetch('GET', '/api/attendance?date='+d+'&type='+t),
      mark:    (p)   => _fetch('POST', '/api/attendance/mark', p),
      markAll: (p)   => _fetch('POST', '/api/attendance/mark-all', p),
    },
    staff: {
      list:   ()     => _fetch('GET', '/api/staff'),
      get:    (id)   => _fetch('GET', '/api/staff/' + id),
      create: (d)    => _fetch('POST', '/api/staff', d),
      update: (id,d) => _fetch('PUT', '/api/staff/' + id, d),
    },
    backup: {
      list:    ()        => _fetch('GET', '/api/backup/list'),
      restore: (date)    => _fetch('GET', '/api/backup/restore/' + date),
      save:    (data, sz)=> _fetch('POST', '/api/backup/save', {data, sizeKb:sz}),
    },
    school: { info: () => _fetch('GET', '/api/schools/info') }
  };
})();
window.GNSI_API = GNSI_API;
window.GNSI_SERVER_URL = 'https://gnsi-saas-production.up.railway.app';
console.log('[GNSI] SaaS API ready. Server:', window.GNSI_SERVER_URL);
</script>

<script>
/* ══════════════════════════════════════════════════════════════
   GNSI White-Label Branding System
   
   After server login, applies the school's own branding:
   - School name
   - Portal title
   - Location
   - Primary colour
   - Logo URL
   
   Each school configures their branding in gnsi_schools table.
   ══════════════════════════════════════════════════════════════ */
(function() {

  /* Apply branding to all elements */
  function gnsiApplyBranding(brand) {
    if (!brand) return;

    var name     = brand.name     || brand.school_name || '';
    var short    = brand.short_name || name.split(' ').map(function(w){return w[0];}).join('').slice(0,4).toUpperCase();
    var location = brand.location  || '';
    var title    = brand.portal_title || (name + ' Management Portal');
    var color    = brand.primary_color || '#1433a8';
    var logoUrl  = brand.logo_url  || '';

    /* ── Login screen ── */
    var lsPname = document.querySelector('.ls-pname');
    var lsPinst = document.querySelector('.ls-pinst');
    var lsSub   = document.querySelector('.ls-sub');
    var lsDes   = document.getElementById('ls-des');

    if (lsPname) lsPname.innerHTML = title.replace(' Management Portal','<br>Portal');
    if (lsPinst) lsPinst.innerHTML = name + (location ? '<br>' + location : '');
    if (lsSub)   lsSub.textContent = 'Sign in to ' + title;
    if (lsDes)   lsDes.style.display = 'none'; /* hide GNSI founder credit */

    /* ── Sidebar logo ── */
    var sbTitle = document.querySelector('.sb-logo-title');
    if (sbTitle) sbTitle.textContent = short;

    /* ── Topbar ── */
    var topbarInst = document.querySelector('.topbar-inst');
    if (topbarInst) topbarInst.textContent = name;

    document.querySelectorAll('.cert-ribbon-inst').forEach(function(el){
      el.textContent = name + (brand.established ? ' · Est. ' + brand.established : '');
    });

    /* ── Certificate generator form defaults ── */
    var cv5Inst = document.getElementById('gnsiCv5FInst');
    if (cv5Inst && cv5Inst.value.indexOf('GUIDANCE') === 0) cv5Inst.value = name.toUpperCase();
    var cv5Addr = document.getElementById('gnsiCv5FAddr');
    if (cv5Addr && cv5Addr.value.indexOf('Khangabok') === 0 && brand.address) cv5Addr.value = brand.address + (brand.city ? ', ' + brand.city : '') + (brand.state ? ', ' + brand.state : '') + (brand.pincode ? '-' + brand.pincode : '');

    var awFooter = document.getElementById('aw-footer-inst');
    if (awFooter) awFooter.textContent = name;

    /* ── Hide GNSI-specific anniversary decorations for other tenants ── */
    var _isGnsi = !brand.school_code || brand.school_code === 'gnsi';
    document.querySelectorAll('.ten-years-banner, #ls-ann, #mini-ten, .topbar-badge, .ten-years-badge').forEach(function(el){
      el.style.display = _isGnsi ? '' : 'none';
    });
    if (!_isGnsi) {
      /* Also hide the loading overlay ticker and 10-year badge */
      var annEl = document.getElementById('ls-ann');
      if (annEl) annEl.style.display = 'none';
    }

    /* ── Certificate / admit card elements ── */
    document.querySelectorAll('#cert-inst-name').forEach(function(el){ el.textContent = name; });
    document.querySelectorAll('#cert-inst-addr').forEach(function(el){ el.textContent = (brand.address || '') + (brand.pincode ? ' -- ' + brand.pincode : ''); });
    document.querySelectorAll('#cert-inst-contact').forEach(function(el){
      var web   = brand.website || brand.portal_url || '';
      var email = brand.email   || '';
      el.innerHTML = (web ? '📞 ' + web : '') + (web && email ? ' &nbsp;·&nbsp; ' : '') + (email ? '✉ ' + email : '');
    });

    /* ── Page title ── */
    document.title = title;

    /* ── Primary colour override ── */
    if (color && color !== '#1433a8') {
      var styleEl = document.createElement('style');
      styleEl.id  = 'gnsi-brand-colors';
      styleEl.textContent =
        ':root { --accent: ' + color + '; --accent-mid: ' + color + '; }' +
        '.ls-btn { background: ' + color + ' !important; }' +
        '.sb-logo { background: ' + color + ' !important; }' +
        '.nav-btn.active { border-left-color: ' + color + ' !important; }';
      document.head.appendChild(styleEl);
    }

    /* ── Logo image ── */
    if (logoUrl) {
      var logoImg = document.querySelector('#ls-logo-wrap img');
      if (logoImg) logoImg.src = logoUrl;
      var sbLogoImg = document.querySelector('.sb-logo img');
      if (sbLogoImg) sbLogoImg.src = logoUrl;
    }

    /* Store branding for re-renders */
    try {
      localStorage.setItem('gnsi_school_brand', JSON.stringify(brand));
    } catch(e) {}

    console.log('[GNSI] Branding applied for:', name);
  }

  /* Fetch branding from server after login */
  async function gnsiLoadBranding(schoolCode) {
    if (!window.GNSI_SERVER_URL || !schoolCode) return;
    try {
      var token = localStorage.getItem('gnsi_jwt_token');
      var res = await fetch(window.GNSI_SERVER_URL + '/api/schools/info', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!res.ok) return;
      var data = await res.json();
      if (data.school) gnsiApplyBranding(data.school);
    } catch(e) {
      console.log('[GNSI] Branding fetch failed:', e.message);
    }
  }

  /* Restore branding on page reload */
  try {
    var saved = localStorage.getItem('gnsi_school_brand');
    var savedUser = localStorage.getItem('gnsi_jwt_user');
    if (saved && savedUser) {
      var brand = JSON.parse(saved);
      var user  = JSON.parse(savedUser);
      /* Only apply if not GNSI school */
      if (user.schoolCode && user.schoolCode !== 'gnsi') {
        setTimeout(function() { gnsiApplyBranding(brand); }, 500);
      }
    }
  } catch(e) {}

  /* Hook into server login to apply branding after login */
  /* AUTH v2.0: branding hook preserved but uses currentUser instead of gnsi_jwt_user */
  var _origDoLoginBrand = window.doLogin;
  window.doLogin = async function() {
    if (typeof _origDoLoginBrand === 'function') {
      await _origDoLoginBrand.apply(this, arguments);
    }
    /* After login, apply branding if a non-gnsi school */
    setTimeout(async function() {
      try {
        var user = (typeof currentUser !== 'undefined' && currentUser) ? currentUser : null;
        if (user && user.schoolCode && user.schoolCode !== 'gnsi') {
          await gnsiLoadBranding(user.schoolCode);
          if (typeof render === 'function') { window._dashCache = null; render(); }
        }
      } catch(e) {}
    }, 1500);
  };

  /* Make branding function globally available */
  window.gnsiApplyBranding  = gnsiApplyBranding;
  window.gnsiLoadBranding   = gnsiLoadBranding;

  /* ── Intercept doLogin to use server when school code is non-gnsi ── */
  /* AUTH v2.0: for school code 'gnsi', always use our local doLogin directly */
  var _origDoLoginSaaS = window.doLogin;
  window.doLogin = async function() {
    var scEl = document.getElementById('login-school-code');
    var unEl = document.getElementById('login-username');
    var pwEl = document.getElementById('login-pass');

    var schoolCode = scEl ? scEl.value.trim().toLowerCase() : 'gnsi';
    var username   = unEl ? unEl.value.trim() : '';
    var password   = pwEl ? pwEl.value : '';

    /* Always use local login for gnsi school code */
    if (!schoolCode || schoolCode === 'gnsi' || !username || !password) {
      if (typeof _origDoLoginSaaS === 'function') await _origDoLoginSaaS.apply(this, arguments);
      return;
    }

    /* Show loading */
    var btn = document.querySelector('.ls-btn');
    var errEl = document.getElementById('login-error');
    if (btn) { btn.textContent = 'Signing in…'; btn.disabled = true; }
    if (errEl) { errEl.style.display = 'none'; }

    try {
      var res = await fetch(window.GNSI_SERVER_URL + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolCode, username, password })
      });

      var data = await res.json();

      if (btn) { btn.textContent = 'Sign In →'; btn.disabled = false; }

      if (!res.ok) {
        /* Server login failed — try local login for gnsi school */
        if (schoolCode === 'gnsi') {
          if (typeof _origDoLoginSaaS === 'function') _origDoLoginSaaS();
        } else {
          if (errEl) { errEl.textContent = data.error || 'Login failed.'; errEl.style.display = 'block'; }
        }
        return;
      }

      /* Save token */
      localStorage.setItem('gnsi_jwt_token', data.token);
      localStorage.setItem('gnsi_jwt_user', JSON.stringify(data.user));

      /* Map server user to portal currentUser */
      currentUser = {
        id:        data.user.id,
        name:      data.user.name,
        role:      data.user.role,
        staffRole: data.user.role,
        pages:     (typeof ROLE_PAGES !== 'undefined' ? (ROLE_PAGES[data.user.role] || ROLE_PAGES['staff'] || []) : []),
        schoolCode: data.user.schoolCode,
        schoolName: data.user.schoolName,
        fromServer: true
      };

      if (typeof saveSession === 'function') saveSession(currentUser);
      if (typeof hideLoginScreen === 'function') hideLoginScreen();
      if (typeof initApp === 'function') initApp();
      if (typeof _gnsiRunPostLoginSync === 'function') _gnsiRunPostLoginSync();

      /* Apply branding for non-GNSI schools */
      if (schoolCode !== 'gnsi') {
        setTimeout(async function() {
          await gnsiLoadBranding(schoolCode);
          if (typeof render === 'function') { window._dashCache = null; render(); }
        }, 1000);
      }

      /* Force dashboard re-render after data loads */
      setTimeout(function() { if (typeof render === 'function') { window._dashCache = null; render(); } }, 3000);

    } catch(e) {
      if (btn) { btn.textContent = 'Sign In →'; btn.disabled = false; }
      /* Network error — fall back to local login */
      if (typeof _origDoLoginSaaS === 'function') _origDoLoginSaaS();
    }
  };

})();
</script>
</script>

<script>
// ── GNSI Storage Guardian ────────────────────────────────────────────────
(function() {
  try {
    var tsKeys = Object.keys(localStorage).filter(function(k){ return k.startsWith('gnsi_kv_ts_'); });
    tsKeys.forEach(function(k){ localStorage.removeItem(k); });
    if (tsKeys.length > 0) console.log('[GNSI] Cleared ' + tsKeys.length + ' timestamp cache keys');
    if (JSON.stringify(localStorage).length > 3000000) {
      Object.keys(localStorage).filter(function(k){ return k.startsWith('gnsi_role_'); }).forEach(function(k){ localStorage.removeItem(k); });
    }
    var _orig = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function(k, v) {
      try { _orig(k, v); } catch(e) {
        Object.keys(localStorage).filter(function(x){ return x.startsWith('gnsi_kv_ts_') || x.startsWith('gnsi_role_'); }).forEach(function(x){ localStorage.removeItem(x); });
        try { _orig(k, v); } catch(e2) {}
      }
      if (k === 'ims_students' || k === 'ims_staff' || k === 'ims_notices') {
        try {
          if (k === 'ims_students') window.students = JSON.parse(v) || [];
          if (k === 'ims_staff')    window.staff    = JSON.parse(v) || [];
          if (k === 'ims_notices')  window.notices  = JSON.parse(v) || [];
          if (typeof window.render === 'function' && window.activePage === 'dashboard') { window._dashCache = null; window.render(); }
        } catch(ex) {}
      }
    };
  } catch(e) {}
  setTimeout(function() {
    try {
      var s = (typeof students !== 'undefined' ? students : []);
      var st = (typeof staff !== 'undefined' ? staff : []);
      var changed = false;
      if (s&&s.length>0&&window.students&&window.students.length===0){window.students=s;changed=true;}
      if (st&&st.length>0&&window.staff&&window.staff.length===0){window.staff=st;changed=true;}
      if (changed){window._dashCache=null;if(typeof window.render==='function')window.render();}
    } catch(e) {}
  }, 3000);
})();
</script>

<script>
/* ══════════════════════════════════════════════════════════════════════════
   GNSI MULTI-TENANT ISOLATION PATCH  (v75)
   
   What this patch does:
     1. gnsiTenantWipe()     — clears all school-specific data from
                               localStorage when switching schools
     2. Hooks into doLogin   — calls wipe before loading a new school
     3. Injects school_id    — adds .eq('school_id', …) to gnsiKVPullAll
                               and gnsiKVPushAll / gnsiKVPush
     4. Realtime filter fix  — adds school_id filter to KV subscription
     5. Brand cache guard    — validates cached brand matches current JWT
   ══════════════════════════════════════════════════════════════════════════ */
(function() {
  'use strict';

  /* ── 0. CONSTANTS ─────────────────────────────────────────────────────── */
  var ACTIVE_SCHOOL_KEY  = 'gnsi_active_school_code';
  var BRAND_CACHE_KEY    = 'gnsi_school_brand';

  /* Keys that must NEVER be wiped (auth, device prefs, rate-limiting) */
  var PRESERVE_KEYS = {
    'gnsi_jwt_token'       : 1,
    'gnsi_jwt_user'        : 1,
    'gnsi_dark_mode'       : 1,
    'gnsi_pwa_dismissed'   : 1,
    'gnsi_cmd_hint_shown'  : 1,
    'gnsi_ai_api_key'      : 1,
    'gnsi_push_enabled'    : 1,
    'gnsi_fcm_server_key'  : 1,
    'gnsi_active_school_code': 1
  };

  /* Prefixes of keys that must NEVER be wiped (device-level) */
  var PRESERVE_PREFIXES = [
    'gnsi_glb_lk_',
    'gnsi_pwd_',
    'gnsi_uname_',
    'gnsi_lkout_',
    'gnsi_reset_',
    'gnsi_pwd_must_change_',
    'gnsi_pwd_changed_'
  ];

  function _shouldPreserve(key) {
    if (PRESERVE_KEYS[key]) return true;
    for (var i = 0; i < PRESERVE_PREFIXES.length; i++) {
      if (key.indexOf(PRESERVE_PREFIXES[i]) === 0) return true;
    }
    return false;
  }

  /* ── 1. TENANT WIPE ───────────────────────────────────────────────────── */
  function gnsiTenantWipe(reason) {
    reason = reason || 'school_change';
    try {
      var toRemove = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!k) continue;
        if (_shouldPreserve(k)) continue;
        if (
          k.indexOf('ims_')  === 0 ||
          k.indexOf('gnsi_') === 0 ||
          k.indexOf('GNSI_') === 0 ||
          k.indexOf('_gnsi_') === 0
        ) {
          toRemove.push(k);
        }
      }
      toRemove.forEach(function(k) { localStorage.removeItem(k); });
      console.log('[GNSI-Tenant] Wipe complete (' + reason + '). Removed ' + toRemove.length + ' keys.');
    } catch(e) {
      console.warn('[GNSI-Tenant] Wipe error:', e);
    }
  }
  window.gnsiTenantWipe = gnsiTenantWipe;

  /* ── 2. HOOK INTO doLogin ─────────────────────────────────────────────── */
  function _patchDoLogin() {
    var _origDoLogin = window.doLogin;
    if (typeof _origDoLogin !== 'function') {
      setTimeout(_patchDoLogin, 200);
      return;
    }
    window.doLogin = async function() {
      var scEl = document.getElementById('login-school-code');
      var incomingCode = scEl ? scEl.value.trim().toLowerCase() : 'gnsi';
      var prevCode = localStorage.getItem(ACTIVE_SCHOOL_KEY) || '';
      var schoolChanging = prevCode && prevCode !== incomingCode;
      if (schoolChanging) {
        console.log('[GNSI-Tenant] School changed: ' + prevCode + ' → ' + incomingCode + '. Wiping localStorage.');
        gnsiTenantWipe('school_switch');
      }
      localStorage.setItem(ACTIVE_SCHOOL_KEY, incomingCode);
      /* FIX: must await — _origDoLogin is async; not awaiting it caused the
         login spinner to freeze permanently (Promise returned, never resolved) */
      return await _origDoLogin.apply(this, arguments);
    };
    console.log('[GNSI-Tenant] doLogin patched.');
  }

  function _clearKVTimestamps() {
    var toRemove = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && (k === 'gnsi_kv_bulk_ts' || k.indexOf('gnsi_kv_ts_') === 0)) {
        toRemove.push(k);
      }
    }
    toRemove.forEach(function(k) { localStorage.removeItem(k); });
    console.log('[GNSI-Tenant] Cleared ' + toRemove.length + ' KV timestamps → full pull on next sync.');
  }

  function _patchPostLoginSync() {
    var _orig = window._gnsiRunPostLoginSync;
    if (typeof _orig !== 'function') {
      setTimeout(_patchPostLoginSync, 300);
      return;
    }
    window._gnsiRunPostLoginSync = function() {
      _clearKVTimestamps();
      return _orig.apply(this, arguments);
    };
    console.log('[GNSI-Tenant] _gnsiRunPostLoginSync patched.');
  }

  /* ── 3. INJECT school_id INTO KV QUERIES ─────────────────────────────── */
  function _getSchoolId() {
    if (window.TENANT && window.TENANT.schoolId) return window.TENANT.schoolId;
    try {
      var u = JSON.parse(localStorage.getItem('gnsi_jwt_user') || '{}');
      return u.schoolId || u.school_id || null;
    } catch(e) { return null; }
  }

  function _patchKVFunctions() {
    var _origPull = window.gnsiKVPullAll;
    if (typeof _origPull === 'function') {
      window.gnsiKVPullAll = function(callback) {
        var sid = _getSchoolId();
        if (!sid || !window._supa) {
          return _origPull.apply(this, arguments);
        }
        var sinceTs = localStorage.getItem('gnsi_kv_bulk_ts') || '1970-01-01T00:00:00.000Z';
        window._supa.from('gnsi_keyvalue')
          .select('key, value, updated_at')
          .eq('school_id', sid)
          .gte('updated_at', sinceTs)
          .then(function(result) {
            var rows = result.data || [];
            var now = new Date().toISOString();
            rows.forEach(function(row) {
              if (!row.key || row.value === undefined || row.value === null) return;
              var cloudTs = row.updated_at || '2000-01-01T00:00:00Z';
              var localTs = localStorage.getItem('gnsi_kv_ts_' + row.key) || '';
              if (!localTs || cloudTs > localTs) {
                var toStore = typeof row.value === 'string' ? row.value : JSON.stringify(row.value);
                try {
                  localStorage.setItem(row.key, toStore);
                  localStorage.setItem('gnsi_kv_ts_' + row.key, cloudTs);
                } catch(e) {}
              }
            });
            if (rows.length > 0) localStorage.setItem('gnsi_kv_bulk_ts', now);
            if (typeof callback === 'function') callback(rows.length);
          })
          .catch(function(e) {
            console.warn('[GNSI-Tenant] KVPull error — falling back:', e);
            _origPull.apply(window, [callback]);
          });
      };
      console.log('[GNSI-Tenant] gnsiKVPullAll patched with school_id filter.');
    }

    function _patchFlushBatch() {
      var _origFlush = window._gnsiKVFlushBatch;
      if (typeof _origFlush !== 'function') { setTimeout(_patchFlushBatch, 400); return; }
      if (_origFlush._tenantPatched) return;
      window._gnsiKVFlushBatch = function() {
        var sid = _getSchoolId();
        if (!sid || !window._gnsiKVPending) {
          return _origFlush.apply(this, arguments);
        }
        var pending = window._gnsiKVPending;
        var keys = Object.keys(pending);
        if (!keys.length) return;
        var rows = keys.map(function(k) {
          return { school_id: sid, key: k, value: pending[k].value, updated_at: pending[k].ts };
        });
        window._gnsiKVPending = {};
        if (!window._supa) return;
        var chunks = [], size = 200;
        for (var i = 0; i < rows.length; i += size) chunks.push(rows.slice(i, i+size));
        chunks.forEach(function(chunk) {
          window._supa.from('gnsi_keyvalue')
            .upsert(chunk, { onConflict: 'school_id,key' })
            .catch(function(e){ console.warn('[GNSI-Tenant] KV flush error:', e); });
        });
      };
      window._gnsiKVFlushBatch._tenantPatched = true;
      console.log('[GNSI-Tenant] _gnsiKVFlushBatch patched with school_id.');
    }
    setTimeout(_patchFlushBatch, 600);
  }

  /* ── 4. REALTIME school_id filter ────────────────────────────────────── */
  function _patchRealtime() {
    function _waitForSupa() {
      if (!window._supa) { setTimeout(_waitForSupa, 500); return; }
      var _origChannel = window._supa.channel.bind(window._supa);
      window._supa.channel = function(name, opts) {
        var ch = _origChannel(name, opts);
        var _origOn = ch.on.bind(ch);
        ch.on = function(event, config, callback) {
          if (
            event === 'postgres_changes' &&
            config && config.table === 'gnsi_keyvalue' &&
            !config.filter
          ) {
            var sid = _getSchoolId();
            if (sid) {
              config.filter = 'school_id=eq.' + sid;
              console.log('[GNSI-Tenant] Realtime gnsi_keyvalue filter injected:', config.filter);
            }
          }
          return _origOn(event, config, callback);
        };
        return ch;
      };
      console.log('[GNSI-Tenant] Realtime channel wrapper installed.');
    }
    _waitForSupa();
  }

  /* ── 5. BRAND CACHE GUARD + window.TENANT ────────────────────────────── */
  function _guardBrandCache() {
    try {
      var raw = localStorage.getItem(BRAND_CACHE_KEY);
      if (!raw) return;
      var brand = JSON.parse(raw);
      var currentCode = localStorage.getItem(ACTIVE_SCHOOL_KEY) || 'gnsi';
      if (brand.school_code && brand.school_code !== currentCode) {
        localStorage.removeItem(BRAND_CACHE_KEY);
        console.log('[GNSI-Tenant] Stale brand cache cleared (' + brand.school_code + ' ≠ ' + currentCode + ').');
      }
    } catch(e) {}
  }

  function _patchApplyBranding() {
    var _orig = window.gnsiApplyBranding;
    if (typeof _orig !== 'function') { setTimeout(_patchApplyBranding, 300); return; }
    window.gnsiApplyBranding = function(brand) {
      if (brand && !brand.school_code) {
        brand.school_code = localStorage.getItem(ACTIVE_SCHOOL_KEY) || 'gnsi';
      }
      if (brand) {
        window.TENANT = {
          schoolId    : brand.school_id        || brand.id || null,
          code        : brand.school_code       || 'gnsi',
          name        : brand.school_name       || brand.name || 'Guidance Navodaya & Sainik Institute',
          shortName   : brand.short_name        || 'GNSI',
          address     : brand.address           || 'Khangabok Sorok Wangma, Thoubal, Manipur',
          city        : brand.city              || 'Thoubal',
          state       : brand.state             || 'Manipur',
          pincode     : brand.pincode           || '795138',
          phone       : brand.phone             || '',
          principal   : brand.principal         || '',
          regNo       : brand.reg_no            || 'Regd: 25 of 2016-17',
          established : brand.established_year  || '2016',
          color       : brand.primary_color     || '#1433a8',
          logoUrl     : brand.logo_url          || '',
          portalTitle : brand.portal_title      || (brand.name || 'GNSI') + ' Management Portal'
        };
        console.log('[GNSI-Tenant] window.TENANT populated for:', window.TENANT.name);
      }
      return _orig.apply(this, arguments);
    };
    console.log('[GNSI-Tenant] gnsiApplyBranding patched → window.TENANT.');
  }

  /* ── 6. INIT ──────────────────────────────────────────────────────────── */
  window.TENANT = window.TENANT || {
    schoolId    : null,
    code        : 'gnsi',
    name        : 'Guidance Navodaya & Sainik Institute',
    shortName   : 'GNSI',
    address     : 'Khangabok Sorok Wangma, Thoubal, Manipur',
    city        : 'Thoubal',
    state       : 'Manipur',
    pincode     : '795138',
    phone       : '',
    principal   : '',
    regNo       : 'Regd: 25 of 2016-17',
    established : '2016',
    color       : '#1433a8',
    logoUrl     : '',
    portalTitle : 'GNSI Management Portal'
  };


  /* ── 6a. PATCH loadFromSupabase — add school_id to all SELECT queries ── */
  function _patchLoadFromSupabase() {
    function _doIt() {
      var _orig = window.loadFromSupabase;
      if (typeof _orig !== 'function') { setTimeout(_doIt, 300); return; }
      if (_orig._tenantPatched) return;
      window.loadFromSupabase = function(callback) {
        var sid = _getSchoolId();
        if (!sid || !window._supa) { return _orig.apply(this, arguments); }
        window.setSyncStatus && window.setSyncStatus('loading');
        var staffP    = window._supa.from('staff').select('*').eq('school_id', sid).order('id');
        var studentP  = window._supa.from('students').select('*, classes(name)').eq('school_id', sid).order('id');
        var noticeP   = window._supa.from('notices').select('*').eq('school_id', sid).eq('is_archived', false).order('notice_date', {ascending:false});
        var feeP      = window._supa.from('fee_payments').select('*').eq('school_id', sid);
        var attP      = window._supa.from('attendance_staff').select('*').eq('school_id', sid);
        Promise.all([staffP, studentP, noticeP, feeP, attP]).then(function(results) {
          var staffR  = results[0], studentR = results[1], noticeR = results[2],
              feeR    = results[3], attR     = results[4];
          if (staffR.data)  { window.staff    = staffR.data;   try{/* [SUPABASE-ONLY] localStorage write removed: ims_staff */}catch(e){} }
          if (studentR.data){ window.students = studentR.data; try{/* [SUPABASE-ONLY] localStorage write removed: ims_students */}catch(e){} }
          if (noticeR.data) { window.notices  = noticeR.data;  try{/* [SUPABASE-ONLY] localStorage write removed: ims_notices */}catch(e){} }
          if (feeR.data)    { try{localStorage.setItem('ims_feepayments', JSON.stringify(feeR.data));}catch(e){} }
          if (attR.data)    { try{localStorage.setItem('ims_att_staff',   JSON.stringify(attR.data));}catch(e){} }
          window.setSyncStatus && window.setSyncStatus('success');
          if (typeof callback === 'function') callback();
          if (typeof window.render === 'function') { window._dashCache = null; window.render(); }
          console.log('[GNSI-Tenant] loadFromSupabase filtered for school_id:', sid);
        }).catch(function(e) {
          console.warn('[GNSI-Tenant] Filtered load failed, falling back:', e);
          _orig.apply(window, [callback]);
        });
      };
      window.loadFromSupabase._tenantPatched = true;
      console.log('[GNSI-Tenant] loadFromSupabase patched with school_id filter.');
    }
    setTimeout(_doIt, 500);
  }

  /* ── 6b. PATCH write queries — inject school_id into upserts/inserts ─── */
  function _patchStaffStudentWrites() {
    // Patch _supa.from() to auto-inject school_id on INSERT/UPSERT for key tables
    var TENANT_TABLES = {
      'staff': 1, 'students': 1, 'notices': 1,
      'fee_payments': 1, 'attendance_staff': 1,
      'student_attendance': 1, 'period_attendance': 1,
      'gnsi_student_extra': 1, 'gnsi_reports': 1,
      'gnsi_backups': 1, 'gnsi_staff_credentials': 1,
      /* ── TENANT FIX v78: finance + biodata tables added ── */
      'gnsi_fee_config': 1, 'gnsi_fee_admission': 1, 'gnsi_fee_monthly': 1,
      'gnsi_fee_full': 1, 'gnsi_fee_advance': 1, 'gnsi_fee_items': 1,
      'gnsi_income': 1, 'gnsi_expenditure': 1, 'gnsi_acct_categories': 1,
      'gnsi_acct_audit': 1, 'gnsi_staff_biodata': 1
    };
    function _waitForSupa() {
      if (!window._supa) { setTimeout(_waitForSupa, 500); return; }
      if (window._supa._tenantFromPatched) return;
      var _origFrom = window._supa.from.bind(window._supa);
      window._supa.from = function(table) {
        var builder = _origFrom(table);
        if (!TENANT_TABLES[table]) return builder;
        // Wrap upsert
        var _origUpsert = builder.upsert ? builder.upsert.bind(builder) : null;
        if (_origUpsert) {
          builder.upsert = function(data, opts) {
            var sid = _getSchoolId();
            if (sid) {
              if (Array.isArray(data)) {
                data = data.map(function(r) { return Object.assign({school_id: sid}, r); });
              } else if (data && typeof data === 'object') {
                data = Object.assign({school_id: sid}, data);
              }
            }
            return _origUpsert(data, opts);
          };
        }
        // Wrap insert
        var _origInsert = builder.insert ? builder.insert.bind(builder) : null;
        if (_origInsert) {
          builder.insert = function(data, opts) {
            var sid = _getSchoolId();
            if (sid) {
              if (Array.isArray(data)) {
                data = data.map(function(r) { return Object.assign({school_id: sid}, r); });
              } else if (data && typeof data === 'object') {
                data = Object.assign({school_id: sid}, data);
              }
            }
            return _origInsert(data, opts);
          };
        }
        return builder;
      };
      window._supa._tenantFromPatched = true;
      console.log('[GNSI-Tenant] _supa.from() patched — school_id auto-injected on writes for:', Object.keys(TENANT_TABLES).join(', '));
    }
    setTimeout(_waitForSupa, 600);
  }

  document.addEventListener('DOMContentLoaded', function() {
    _guardBrandCache();
    _patchDoLogin();
    _patchPostLoginSync();
    _patchApplyBranding();
    _patchKVFunctions();
    _patchRealtime();
    _patchLoadFromSupabase();
    _patchStaffStudentWrites();
    console.log('[GNSI-Tenant] Multi-tenant isolation patch loaded ✓');
    /* ── TENANT FIX v78: RLS hints for newly covered tables ──────────────
       Run this SQL in Supabase SQL editor to enforce DB-level isolation
       for the finance and biodata tables now covered by school_id writes:

       ALTER TABLE gnsi_fee_config       ADD COLUMN IF NOT EXISTS school_id TEXT;
       ALTER TABLE gnsi_fee_admission    ADD COLUMN IF NOT EXISTS school_id TEXT;
       ALTER TABLE gnsi_fee_monthly      ADD COLUMN IF NOT EXISTS school_id TEXT;
       ALTER TABLE gnsi_fee_full         ADD COLUMN IF NOT EXISTS school_id TEXT;
       ALTER TABLE gnsi_fee_advance      ADD COLUMN IF NOT EXISTS school_id TEXT;
       ALTER TABLE gnsi_fee_items        ADD COLUMN IF NOT EXISTS school_id TEXT;
       ALTER TABLE gnsi_income           ADD COLUMN IF NOT EXISTS school_id TEXT;
       ALTER TABLE gnsi_expenditure      ADD COLUMN IF NOT EXISTS school_id TEXT;
       ALTER TABLE gnsi_acct_categories  ADD COLUMN IF NOT EXISTS school_id TEXT;
       ALTER TABLE gnsi_acct_audit       ADD COLUMN IF NOT EXISTS school_id TEXT;
       ALTER TABLE gnsi_staff_biodata    ADD COLUMN IF NOT EXISTS school_id TEXT;

       -- Then enable RLS and create policies on each:
       -- (repeat this block for each table above)
       ALTER TABLE gnsi_fee_admission ENABLE ROW LEVEL SECURITY;
       DROP POLICY IF EXISTS "tenant_rw" ON gnsi_fee_admission;
       CREATE POLICY "tenant_rw" ON gnsi_fee_admission
         FOR ALL TO anon USING (school_id = current_setting('app.school_id', true))
         WITH CHECK (school_id = current_setting('app.school_id', true));
    ─────────────────────────────────────────────────────────────────────── */
  });

})();
</script>
