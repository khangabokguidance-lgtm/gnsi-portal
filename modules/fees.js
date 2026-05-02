/* GNSI PORTAL — modules/fees.js
   Pages: fees (UnifiedFeeHub), accounts, payments, coursemanage, studentfee, unifiedhub
   Also includes: gnsiFinanceInit, loadFeeConf, saveFeeConf, all fee load/save functions
   DEPENDS ON: core/utils.js, core/state.js */

function _canSeePhone(){
  if(!currentUser) return false;
  /* accounts can see phone — needed for fee collection & receipt printing */
  return currentUser.role==='admin'||currentUser.role==='manager'||currentUser.role==='accounts';
}
function _canSeeAadhar(){
  if(!currentUser) return false;
  return currentUser.role==='admin'||currentUser.role==='manager';
}
function maskAadhar(num){
  if(!num) return '';
  var s=String(num).trim().replace(/\s/g,'');
  if(!s) return '';
  if(_canSeeAadhar()) return s;
  // Show only last 4 digits: XXXX XXXX 1234
  if(s.length<=4) return 'X'.repeat(s.length);
  return 'XXXX XXXX '+s.slice(-4);
}
function _canSeeAddress(){
  if(!currentUser) return false;
  return currentUser.role==='admin'||currentUser.role==='manager';
}
function _canSeeCategory(){
  if(!currentUser) return false;
  return currentUser.role==='admin'||currentUser.role==='manager';
}
function _canSeeReligion(){
  if(!currentUser) return false;
  return currentUser.role==='admin'||currentUser.role==='manager';
}
function _canEditFees(){
  if(!currentUser) return false;
  return currentUser.role==='admin'||currentUser.role==='manager'||currentUser.role==='accounts';
}
function maskPhone(ph){
  if(!ph) return '';
  var s = String(ph).trim();
  if(!s) return '';
  if(_canSeePhone()) return s;
  // Show first 4 digits, mask the rest with X
  if(s.length<=4) return s;
  return s.substring(0,4) + 'X'.repeat(s.length-4);
}
var GNSI_SUPABASE_URL  = 'https://pwrldrngqxbvwfztxxrd.supabase.co';
var GNSI_SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3cmxkcm5ncXhidndmenR4eHJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MTc5NTUsImV4cCI6MjA5MDA5Mzk1NX0.vQi6N4s5Y_iwU1eIi4g8q_T8bW4j8mBH7BFDamAhB0Y';
/* SECURITY PATCH v3: RLS enforcement check.
   The anon key above is intentionally visible — Supabase anon keys are
   designed to be public. Protection comes entirely from Row Level Security (RLS).
   This check probes the students table at boot; if RLS is off, the query
   returns data and we show a persistent red admin warning banner. */
(function _gnsiRlsCheck(){
  document.addEventListener('DOMContentLoaded', function(){
    setTimeout(function(){
      try{
        /* SECURITY PATCH v3 (fixed): reuse _supa instead of createClient().
           Creating a second GoTrueClient with the same storage key caused:
           "Multiple GoTrueClient instances detected" warning. */
        var _c = window._supa;
        if(!_c) return;
        _c.from('students').select('id', {count:'exact', head:true}).then(function(r){
          /* If we get a count back without being logged in, RLS is not active */
          if(r && r.count !== null && r.count > 0 && !window.currentUser){
            var _b = document.getElementById('gnsi-rls-banner');
            if(!_b){
              _b = document.createElement('div');
              _b.id = 'gnsi-rls-banner';
              _b.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:999998;background:#dc2626;color:#fff;font-family:DM Sans,sans-serif;font-size:13px;font-weight:600;padding:10px 20px;text-align:center;';
              _b.innerHTML = '&#9888; SECURITY ALERT: Supabase Row Level Security is NOT enabled — student data is publicly readable. Run gnsi_rls_setup.sql immediately. <button onclick="this.parentNode.remove()" style="margin-left:12px;background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.4);color:#fff;border-radius:6px;padding:3px 10px;cursor:pointer;font-size:12px">Dismiss</button>';
              document.body.appendChild(_b);
            }
          }
        });
      }catch(e){}
    }, 3000);
  });
})();
// -- CLIENT ----------------------------------------------------
// Reuse the existing _supa client (defined later in the page) to
// avoid duplicate GoTrueClient instances. We resolve it lazily
// so it is always available by the time any function is called.
var _sb = null;
function _getSb() {
  if (_sb) return _sb;
  // Prefer the already-created global client to avoid a second instance
  if (typeof _supa !== 'undefined' && _supa) { _sb = _supa; return _sb; }
  // Fallback: create our own only if _supa hasn't been set up yet
  try {
    if (typeof supabase !== 'undefined' && supabase.createClient) {
      _sb = supabase.createClient(GNSI_SUPABASE_URL, GNSI_SUPABASE_KEY);
    }
  } catch(e) { (void 0); }
  return _sb;
}
// -- IN-MEMORY CACHE -------------------------------------------
var _cache = {
  feeConf:     null,
  admrec:      null,
  monthrec:    null,
  feeFull:     null,
  feeAdvance:  null,
  feeItems:    null,
  income:      null,
  expend:      null,
  catIncome:   null,
  catExpend:   null,
};
// -- STARTUP LOADER --------------------------------------------
async function gnsiFinanceInit() {
  var client = _getSb();
  if (!client) { (void 0); _fallbackToLocalStorage(); return; }

  /* ── SESSION-LEVEL CACHE (replaces 10-min cache) ──────────────────────
     Fetch once per login session. Every device always gets fresh data on login.
     On any save, gnsiFinanceInvalidateCache() resets this flag so next call
     fetches fresh — fixing cross-device sync where old cache blocked updates.
  ──────────────────────────────────────────────────────────────────────── */
  if (window._gnsiFinanceLoaded) {
    _fallbackToLocalStorage();
    if (typeof render === 'function') render();
    return;
  }
  window._gnsiFinanceLoaded = true;

  /* ── TENANT FIX v78: resolve school_id for all finance reads ── */
  var _finSid = (function(){
    if (window.TENANT && window.TENANT.schoolId) return window.TENANT.schoolId;
    try { var _u=JSON.parse(localStorage.getItem('gnsi_jwt_user')||'{}'); return _u.schoolId||_u.school_id||null; } catch(e){ return null; }
  })();
  try {
    /* Helper: conditionally adds .eq('school_id', sid) when a sid is available */
    function _finQ(q){ return _finSid ? q.eq('school_id', _finSid) : q; }
    var [conf, adm, mon, full, adv, items, inc, exp, cats, sfaAsgn, sfaColl] = await Promise.all([
      _finSid ? client.from('gnsi_fee_config').select('*').eq('school_id',_finSid).eq('id','default_'+_finSid).single()
              : client.from('gnsi_fee_config').select('*').eq('id','default').single(),
      _finQ(client.from('gnsi_fee_admission').select('*')).order('created_at', { ascending: true }),
      _finQ(client.from('gnsi_fee_monthly').select('*')).order('created_at', { ascending: true }),
      _finQ(client.from('gnsi_fee_full').select('*')).order('created_at', { ascending: true }),
      _finQ(client.from('gnsi_fee_advance').select('*')).order('created_at', { ascending: true }),
      _finQ(client.from('gnsi_fee_items').select('*')).order('created_at', { ascending: true }),
      _finQ(client.from('gnsi_income').select('*')).order('date', { ascending: true }),
      _finQ(client.from('gnsi_expenditure').select('*')).order('date', { ascending: true }),
      _finQ(client.from('gnsi_acct_categories').select('*')).order('type'),
      _finQ(client.from('gnsi_fee_assignments').select('*')).order('created_at', { ascending: true }),
      _finQ(client.from('gnsi_fee_collections').select('*')).order('created_at', { ascending: true }),
    ]);
    if (conf.data) {
      _cache.feeConf = {
        admissionFees:   conf.data.admission_fees   || [],
        monthlyFees:     conf.data.monthly_fees     || [],
        feeGroups:       conf.data.fee_groups       || [],
        manualFeeTypes:  conf.data.manual_fee_types || []
      };
    }
    _cache.admrec    = _toLocalAdmission(adm.data     || []);
    _cache.monthrec  = _toLocalMonthly(mon.data       || []);
    _cache.feeFull   = _toLocalFull(full.data         || []);
    _cache.feeAdvance= _toLocalAdvance(adv.data       || []);
    _cache.feeItems  = _toLocalItems(items.data       || []);
    _cache.income    = _toLocalIncome(inc.data        || []);
    _cache.expend    = _toLocalExpend(exp.data        || []);
    var allCats = cats.data || [];
    _cache.catIncome  = allCats.filter(c => c.type === 'income').map(c => c.name);
    _cache.catExpend  = allCats.filter(c => c.type === 'expenditure').map(c => c.name);
    /* -- Sync SFA data into localStorage so gnsiLoadFeeAssignments() picks it up --
       Normalise snake_case DB columns → camelCase app fields so prFeeStatus can match. -- */
    if (sfaAsgn && sfaAsgn.data && sfaAsgn.data.length) {
      try {
        var normAsgn = sfaAsgn.data.map(function(a){
          return {
            id:              a.id,
            stuId:           a.stuId          || a.stu_id          || a.student     || '',
            studentName:     a.studentName    || a.student_name    || a.name        || '',
            rollNo:          a.rollNo         || a.roll_no         || a.roll        || '',
            admNo:           a.admNo          || a.adm_no          || '',
            className:       a.className      || a.class_name      || a.cls         || '',
            subTypeId:       a.subTypeId      || a.sub_type_id     || null,
            enrolledAt:      a.enrolledAt     || a.enrolled_at     || '',
            remark:          a.remark         || '',
            createdBy:       a.createdBy      || a.created_by      || '',
            createdAt:       a.createdAt      || a.created_at      || ''
          };
        });
        localStorage.setItem('gnsi_fee_assignments', JSON.stringify(normAsgn));
      } catch(e) {}
    }
    if (sfaColl && sfaColl.data && sfaColl.data.length) {
      try {
        var normColl = sfaColl.data.map(function(c){
          return {
            id:          c.id,
            asgnId:      c.asgnId       || c.asgn_id      || c.assignId    || c.assign_id || '',
            stuId:       c.stuId        || c.stu_id        || c.student     || '',
            studentName: c.studentName  || c.student_name  || c.name        || '',
            rollNo:      c.rollNo       || c.roll_no       || c.roll        || '',
            admNo:       c.admNo        || c.adm_no        || '',
            className:   c.className    || c.class_name    || '',
            feeType:     c.feeType      || c.fee_type      || '',
            forMonth:    c.forMonth     || c.for_month     || '',
            amountPaid:  parseFloat(c.amountPaid || c.amount_paid || c.amount || 0),
            payMode:     c.payMode      || c.pay_mode      || 'Cash',
            payDate:     c.payDate      || c.pay_date      || c.date        || '',
            receiptNo:   c.receiptNo    || c.receipt_no    || c.receipt     || '',
            remark:      c.remark       || '',
            collectedBy: c.collectedBy  || c.collected_by  || '',
            createdAt:   c.createdAt    || c.created_at    || ''
          };
        });
        localStorage.setItem('gnsi_fee_collections', JSON.stringify(normColl));
      } catch(e) {}
    }
    
    /* EGRESS FIX v74.1: persist finance data to localStorage so cache survives reload */
    try {
      if (_cache.feeConf)   localStorage.setItem('ims_feeconf',              JSON.stringify(_cache.feeConf));
      if (_cache.admrec)    localStorage.setItem('ims_admrec',               JSON.stringify(_cache.admrec));
      if (_cache.monthrec)  localStorage.setItem('ims_monthrec',             JSON.stringify(_cache.monthrec));
      if (_cache.feeFull)   localStorage.setItem('gnsi_fee_full',            JSON.stringify(_cache.feeFull));
      if (_cache.feeAdvance)localStorage.setItem('gnsi_fee_advance',         JSON.stringify(_cache.feeAdvance));
      if (_cache.feeItems)  localStorage.setItem('gnsi_fee_items',           JSON.stringify(_cache.feeItems));
      if (_cache.income)    localStorage.setItem('ims_income',               JSON.stringify(_cache.income));
      if (_cache.expend)    localStorage.setItem('ims_expend',               JSON.stringify(_cache.expend));
      if (_cache.catIncome) localStorage.setItem('gnsi_acct_cats_income',    JSON.stringify(_cache.catIncome));
      if (_cache.catExpend) localStorage.setItem('gnsi_acct_cats_expenditure',JSON.stringify(_cache.catExpend));
      /* Stamp the cache timestamp — valid for 10 minutes */
      localStorage.setItem('_gnsi_fin_ts', String(Date.now()));
    } catch(e) {}
    /* FLICKER FIX v84: was 3 separate render() calls firing in quick succession
       (immediate + biodata.then + customHouses.then) = triple flash on load.
       Now: fire one immediate render, then background tasks re-render only
       if on the relevant page to avoid cascading flashes. */
    if (typeof render === 'function') render();
    // Load staff biodata in parallel (non-blocking)
    _sbdLoadFromSupabase().then(function(){
      if(typeof render==='function'&&typeof activePage!=='undefined'&&activePage==='staffbiodata') render();
    });
    // Sync custom houses — re-render only if on dashboard
    if(typeof gnsiSyncCustomHousesFromCloud === 'function'){
      gnsiSyncCustomHousesFromCloud().then(function(){
        if(typeof render==='function'&&typeof activePage!=='undefined'&&activePage==='dashboard') render();
      });
    }
  } catch(e) {
    (void 0);
    _fallbackToLocalStorage();
  }
}
// -- FINANCE CACHE INVALIDATION --------------------------------
// Call this whenever a fee record is saved/deleted so the next
// gnsiFinanceInit() call does a fresh Supabase pull instead of
// serving stale cache. EGRESS FIX v74.1
function gnsiFinanceInvalidateCache() {
  /* Reset session-level cache flag so next gnsiFinanceInit fetches fresh from Supabase.
     Called on any fee save/delete so other devices see changes immediately on next sync. */
  window._gnsiFinanceLoaded = false;
  try { localStorage.removeItem('_gnsi_fin_ts'); } catch(e) {}
}
// -- FALLBACK --------------------------------------------------
function _fallbackToLocalStorage() {
  (void 0);
  const ls = k => { try { return JSON.parse(localStorage.getItem(k)||'null'); } catch(e){ return null; } };
  _cache.feeConf    = ls('ims_feeconf') || ls('gnsi_fee_config_ls');
  _cache.admrec     = ls('ims_admrec')      || [];
  _cache.monthrec   = ls('ims_monthrec')    || [];
  _cache.feeFull    = ls('gnsi_fee_full')   || [];
  _cache.feeAdvance = ls('gnsi_fee_advance')|| [];
  _cache.feeItems   = ls('gnsi_fee_items')  || [];
  _cache.income     = ls('ims_income')      || [];
  _cache.expend     = ls('ims_expend')      || [];
  _cache.catIncome  = ls('gnsi_acct_cats_income')      || [];
  _cache.catExpend  = ls('gnsi_acct_cats_expenditure') || [];
}
// -- ROW MAPPERS (DB → app format) -----------------------------
function _toLocalAdmission(rows) {
  return rows.map(r => ({
    id: r.id, student: r.student, course: r.course,
    amountPaid: r.amount_paid, totalAmount: r.total_amount,
    receipt: r.receipt, date: r.date, remark: r.remark,
    collectedBy: r.collected_by, createdAt: r.created_at
  }));
}
function _toLocalMonthly(rows) {
  return rows.map(r => ({
    id: r.id, student: r.student, course: r.course,
    forMonth: r.for_month, tuitionFee: r.tuition_fee,
    hostelFee: r.hostel_fee, amountPaid: r.amount_paid,
    totalAmount: r.total_amount, receipt: r.receipt,
    date: r.date, remark: r.remark,
    collectedBy: r.collected_by, createdAt: r.created_at
  }));
}
function _toLocalFull(rows) {
  return rows.map(r => ({
    id: r.id, student: r.student, course: r.course,
    months: r.months, tuitionFee: r.tuition_fee,
    hostelFee: r.hostel_fee, amountPaid: r.amount_paid,
    receipt: r.receipt, date: r.date, remark: r.remark,
    collectedBy: r.collected_by, createdAt: r.created_at
  }));
}
function _toLocalAdvance(rows) {
  return rows.map(r => ({
    id: r.id, student: r.student, course: r.course,
    advanceMonths: r.advance_months, amountPaid: r.amount_paid,
    receipt: r.receipt, date: r.date, remark: r.remark,
    collectedBy: r.collected_by, createdAt: r.created_at
  }));
}
function _toLocalItems(rows) {
  return rows.map(r => ({
    id: r.id, student: r.student, itemsList: r.items_list,
    amountPaid: r.amount_paid, receipt: r.receipt,
    date: r.date, remark: r.remark,
    collectedBy: r.collected_by, createdAt: r.created_at
  }));
}
function _toLocalIncome(rows) {
  return rows.map(r => ({
    id: r.id, date: r.date, category: r.category,
    description: r.description, amount: r.amount,
    receipt: r.receipt, source: r.source, sourceId: r.source_id,
    createdAt: r.created_at
  }));
}
function _toLocalExpend(rows) {
  return rows.map(r => ({
    id: r.id, date: r.date, category: r.category,
    description: r.description, amount: r.amount,
    receipt: r.receipt, approvedBy: r.approved_by,
    createdAt: r.created_at
  }));
}
// -- FIRE-AND-FORGET SUPABASE WRITE ----------------------------
/* ── TENANT FIX v78: tables that require school_id on every write ── */
var _SB_TENANT_TABLES = {
  'gnsi_fee_config':1,'gnsi_fee_admission':1,'gnsi_fee_monthly':1,
  'gnsi_fee_full':1,'gnsi_fee_advance':1,'gnsi_fee_items':1,
  'gnsi_income':1,'gnsi_expenditure':1,'gnsi_acct_categories':1,
  'gnsi_acct_audit':1,'gnsi_staff_biodata':1
};
function _sbGetTenantId(){
  if(window.TENANT&&window.TENANT.schoolId)return window.TENANT.schoolId;
  try{var u=JSON.parse(localStorage.getItem('gnsi_jwt_user')||'{}');return u.schoolId||u.school_id||null;}catch(e){return null;}
}
function _sbWrite(table, data, operation) {
  var client = _getSb(); if (!client) return;
  var op = operation || 'upsert';
  var sid = _sbGetTenantId();
  if (sid && _SB_TENANT_TABLES[table]) {
    if (Array.isArray(data)) {
      data = data.map(function(r){ return Object.assign({school_id:sid},r); });
    } else if (data && typeof data === 'object') {
      data = Object.assign({school_id:sid}, data);
    }
  }
  (client.from(table)[op](data)).then(function(r) {
    if (r.error) (void 0);
  });
}
function _sbDelete(table, id) {
  var client = _getSb(); if (!client) return;
  var q = client.from(table).delete().eq('id', id);
  var sid = _sbGetTenantId();
  if (sid && _SB_TENANT_TABLES[table]) q = q.eq('school_id', sid);
  q.then(function(r) {
    if (r.error) (void 0);
  });
}
// -- Fee Config ------------------------------------------------
function loadFeeConf() {
  /* 1. In-memory cache (fastest) */
  if (_cache.feeConf) return _cache.feeConf;
  /* 2. localStorage fallback -- populated by saveFeeConf and KV sync */
  try {
    var _ls = localStorage.getItem('ims_feeconf') || localStorage.getItem('gnsi_fee_config_ls');
    if (_ls) {
      var _parsed = JSON.parse(_ls);
      if (_parsed && (_parsed.feeGroups || _parsed.monthlyFees)) {
        _cache.feeConf = _parsed;
        return _cache.feeConf;
      }
    }
  } catch(e) {}
  /* 3. Hardcoded defaults (first-time only, before any config saved) */
  return {
    admissionFees:[
      {id:'af1',course:'Sainik (Old)',amount:5000,description:'One-time admission fee'},
      {id:'af2',course:'Combined (New)',amount:5000,description:'One-time admission fee'},
      {id:'af3',course:'Navodaya (Old)',amount:4500,description:'One-time admission fee'},
      {id:'af4',course:'Navodaya (New)',amount:4500,description:'One-time admission fee'},
      {id:'af5',course:'Foundation V',amount:3500,description:'One-time admission fee'},
      {id:'af6',course:'Foundation IV',amount:3000,description:'One-time admission fee'},
      {id:'af7',course:'Combined (Old)',amount:5000,description:'One-time admission fee'}
    ],
    monthlyFees:[
      {id:'mf1',course:'Sainik (Old)',amount:12000,hostelAmount:5000,description:'Tuition + Hostel'},
      {id:'mf2',course:'Combined (New)',amount:12000,hostelAmount:5000,description:'Tuition + Hostel'},
      {id:'mf3',course:'Navodaya (Old)',amount:10000,hostelAmount:5000,description:'Tuition + Hostel'},
      {id:'mf4',course:'Navodaya (New)',amount:10000,hostelAmount:5000,description:'Tuition + Hostel'},
      {id:'mf5',course:'Foundation V',amount:8000,hostelAmount:4000,description:'Tuition + Hostel'},
      {id:'mf6',course:'Foundation IV',amount:7000,hostelAmount:4000,description:'Tuition + Hostel'},
      {id:'mf7',course:'Combined (Old)',amount:12000,hostelAmount:5000,description:'Tuition + Hostel'}
    ],
    /* -- Fee Groups: named bundles with a fixed amount (e.g. Science Kit, Sports Fee) -- */
    feeGroups:[],
    /* -- Manual Fee Types: custom one-off fee labels staff can pick from a dropdown -- */
    manualFeeTypes:['Miscellaneous','Late Fee','Exam Fee','Sports Fee','Library Fee','Lab Fee','Uniform','Study Material','Tour/Trip Fee','Other']
  };
}
function saveFeeConf(conf) {
  var _gnsiAllowed=['admin','manager'];
  if(!currentUser||_gnsiAllowed.indexOf(currentUser.role)<0){
    if(typeof showToast==='function')showToast('🔒 Access denied: Change fee configuration','#dc2626');
    return;
  }

  _cache.feeConf = conf;
  /* EGRESS FIX v74.1: invalidate finance cache so next load fetches fresh data */
  if (typeof gnsiFinanceInvalidateCache === 'function') gnsiFinanceInvalidateCache();
  /* -- Write to Supabase (primary) -- */
  var _fcSid = _sbGetTenantId ? _sbGetTenantId() : null;
  var _fcRow = {
    id: _fcSid ? ('default_' + _fcSid) : 'default',
    admission_fees:    conf.admissionFees    || [],
    monthly_fees:      conf.monthlyFees      || [],
    fee_groups:        conf.feeGroups        || [],
    manual_fee_types:  conf.manualFeeTypes   || [],
    updated_at: new Date().toISOString()
  };
  if (_fcSid) _fcRow.school_id = _fcSid;
  _sbWrite('gnsi_fee_config', _fcRow);
  /* -- Write to localStorage (fallback + offline resilience) -- */
  /* Uses BOTH key names so all load paths find it */
  try {
    var _serialised = JSON.stringify(conf);
    localStorage.setItem('ims_feeconf',         _serialised);
    localStorage.setItem('gnsi_fee_config_ls',  _serialised);
    localStorage.setItem('gnsi_kv_ts_ims_feeconf', new Date().toISOString());
    if(typeof gnsiKVPush==='function'){gnsiKVPush('ims_feeconf',conf);gnsiKVPush('gnsi_fee_config',conf);}
  } catch(e) { (void 0); }
  /* FIX v79: removed duplicate gnsiKVPush('ims_feeconf') -- already pushed above */
}
// -- Admission Fee Records -------------------------------------
function loadAdmissionRecords() { return _cache.admrec || []; }
function saveAdmissionRecords(records) {
  const existing = new Set((_cache.admrec||[]).map(r=>r.id));
  const incoming = new Set(records.map(r=>r.id));
  records.forEach(r => {
    _sbWrite('gnsi_fee_admission', {
      id: r.id, student: r.student, course: r.course,
      amount_paid: r.amountPaid, total_amount: r.totalAmount,
      receipt: r.receipt,
      date: r.date || new Date().toISOString().split('T')[0],
      remark: r.remark, collected_by: r.collectedBy,
      created_at: r.createdAt || new Date().toISOString()
    });
  });
  existing.forEach(id => { if (!incoming.has(id)) _sbDelete('gnsi_fee_admission', id); });
  _cache.admrec = records;
}
// -- Monthly Fee Records ---------------------------------------
function loadMonthlyRecords() { return _cache.monthrec || []; }
function saveMonthlyRecords(records) {
  const existing = new Set((_cache.monthrec||[]).map(r=>r.id));
  const incoming = new Set(records.map(r=>r.id));
  records.forEach(r => {
    _sbWrite('gnsi_fee_monthly', {
      id: r.id, student: r.student, course: r.course,
      for_month: r.forMonth, tuition_fee: r.tuitionFee,
      hostel_fee: r.hostelFee, amount_paid: r.amountPaid,
      total_amount: r.totalAmount, receipt: r.receipt,
      date: r.date || new Date().toISOString().split('T')[0],
      remark: r.remark, collected_by: r.collectedBy,
      created_at: r.createdAt || new Date().toISOString()
    });
  });
  existing.forEach(id => { if (!incoming.has(id)) _sbDelete('gnsi_fee_monthly', id); });
  _cache.monthrec = records;
}
// -- Full Payment Records --------------------------------------
function loadFullPaymentRecords() { return _cache.feeFull || []; }
function saveFullPaymentRecords(records) {
  var _gnsiAllowed=['admin','manager','accounts'];
  if(!currentUser||_gnsiAllowed.indexOf(currentUser.role)<0){
    if(typeof showToast==='function')showToast('🔒 Access denied: Save full payment records','#dc2626');
    return;
  }

  const existing = new Set((_cache.feeFull||[]).map(r=>r.id));
  const incoming = new Set(records.map(r=>r.id));
  records.forEach(r => {
    _sbWrite('gnsi_fee_full', {
      id: r.id, student: r.student, course: r.course,
      months: r.months, tuition_fee: r.tuitionFee,
      hostel_fee: r.hostelFee, amount_paid: r.amountPaid,
      receipt: r.receipt,
      date: r.date || new Date().toISOString().split('T')[0],
      remark: r.remark, collected_by: r.collectedBy,
      created_at: r.createdAt || new Date().toISOString()
    });
  });
  existing.forEach(id => { if (!incoming.has(id)) _sbDelete('gnsi_fee_full', id); });
  _cache.feeFull = records;
}
// -- Advance Fee Records ---------------------------------------
function loadAdvanceFeeRecords() { return _cache.feeAdvance || []; }
function saveAdvanceFeeRecords(records) {
  const existing = new Set((_cache.feeAdvance||[]).map(r=>r.id));
  const incoming = new Set(records.map(r=>r.id));
  records.forEach(r => {
    _sbWrite('gnsi_fee_advance', {
      id: r.id, student: r.student, course: r.course,
      advance_months: r.advanceMonths || 1,
      amount_paid: r.amountPaid, receipt: r.receipt,
      date: r.date || new Date().toISOString().split('T')[0],
      remark: r.remark, collected_by: r.collectedBy,
      created_at: r.createdAt || new Date().toISOString()
    });
  });
  existing.forEach(id => { if (!incoming.has(id)) _sbDelete('gnsi_fee_advance', id); });
  _cache.feeAdvance = records;
}
// -- Items / Provisions Records --------------------------------
function loadItemRecords() { return _cache.feeItems || []; }
function saveItemRecords(records) {
  const existing = new Set((_cache.feeItems||[]).map(r=>r.id));
  const incoming = new Set(records.map(r=>r.id));
  records.forEach(r => {
    _sbWrite('gnsi_fee_items', {
      id: r.id, student: r.student,
      items_list: r.itemsList || [],
      amount_paid: r.amountPaid, receipt: r.receipt,
      date: r.date || new Date().toISOString().split('T')[0],
      remark: r.remark, collected_by: r.collectedBy,
      created_at: r.createdAt || new Date().toISOString()
    });
  });
  existing.forEach(id => { if (!incoming.has(id)) _sbDelete('gnsi_fee_items', id); });
  _cache.feeItems = records;
}
// -- Manual Fee Records ----------------------------------------
function loadManualFeeRecords() {
  try { return JSON.parse(localStorage.getItem('gnsi_fee_manual') || '[]'); } catch(e) { return []; }
}
function saveManualFeeRecords(records) {
  var _gnsiAllowed=['admin','manager','accounts'];
  if(!currentUser||_gnsiAllowed.indexOf(currentUser.role)<0){
    if(typeof showToast==='function')showToast('🔒 Access denied: Save fee records','#dc2626');
    return;
  }

  localStorage.setItem('gnsi_fee_manual', JSON.stringify(records));
  if (typeof gnsiKVPush === 'function') gnsiKVPush('gnsi_fee_manual', records);
}
// -- Fee Group Records -----------------------------------------
function loadFeeGroupRecords() {
  try { return JSON.parse(localStorage.getItem('gnsi_fee_groups_rec') || '[]'); } catch(e) { return []; }
}
function saveFeeGroupRecords(records) {
  var _gnsiAllowed=['admin','manager','accounts'];
  if(!currentUser||_gnsiAllowed.indexOf(currentUser.role)<0){
    if(typeof showToast==='function')showToast('🔒 Access denied: Save fee group records','#dc2626');
    return;
  }

  localStorage.setItem('gnsi_fee_groups_rec', JSON.stringify(records));
  if (typeof gnsiKVPush === 'function') gnsiKVPush('gnsi_fee_groups_rec', records);
}
/* ── Student Fee-Group Assignments (per-student fee group + type mapping) ── */
function loadStuFeeAssignments() {
  try { return JSON.parse(localStorage.getItem('gnsi_stu_fg_asgn') || '[]'); } catch(e) { return []; }
}
function saveStuFeeAssignments(arr) {
  var _gnsiAllowed=['admin','manager','accounts'];
  if(!currentUser||_gnsiAllowed.indexOf(currentUser.role)<0){
    if(typeof showToast==='function')showToast('🔒 Access denied: Save student fee assignments','#dc2626');
    return;
  }

  localStorage.setItem('gnsi_stu_fg_asgn', JSON.stringify(arr));
  if (typeof gnsiKVPush === 'function') gnsiKVPush('gnsi_stu_fg_asgn', arr);
}
/* Return the assignment record for a student (or null) */
function getStuFeeAssignment(stuId) {
  return loadStuFeeAssignments().find(function(a){ return String(a.stuId)===String(stuId); }) || null;
}
/* Upsert a student assignment */
function setStuFeeAssignment(stuId, feeGroupIds, manualFeeTypes, note) {
  var arr = loadStuFeeAssignments();
  var idx = arr.findIndex(function(a){ return String(a.stuId)===String(stuId); });
  var rec = { stuId: String(stuId), feeGroupIds: feeGroupIds||[], manualFeeTypes: manualFeeTypes||[], note: note||'', updatedAt: new Date().toISOString() };
  if(idx>=0) arr[idx]=rec; else arr.push(rec);
  saveStuFeeAssignments(arr);
}
function deleteStuFeeAssignment(stuId) {
  saveStuFeeAssignments(loadStuFeeAssignments().filter(function(a){ return String(a.stuId)!==String(stuId); }));
}
// -- Income Ledger ---------------------------------------------
function loadIncomeLedger() { return _cache.income || []; }
function saveIncomeLedger(records) {
  var _gnsiAllowed=['admin','manager','accounts'];
  if(!currentUser||_gnsiAllowed.indexOf(currentUser.role)<0){
    if(typeof showToast==='function')showToast('🔒 Access denied: Save income ledger','#dc2626');
    return;
  }

  const existing = new Set((_cache.income||[]).map(r=>r.id));
  const incoming = new Set(records.map(r=>r.id));
  records.forEach(r => {
    _sbWrite('gnsi_income', {
      id: r.id,
      date: r.date || new Date().toISOString().split('T')[0],
      category: r.category || 'General',
      description: r.description || '',
      amount: r.amount || 0,
      receipt: r.receipt || '',
      source: r.source || 'manual',
      source_id: r.sourceId || '',
      created_at: r.createdAt || new Date().toISOString()
    });
  });
  existing.forEach(id => { if (!incoming.has(id)) _sbDelete('gnsi_income', id); });
  _cache.income = records;
}
// -- Expenditure Ledger ----------------------------------------
function loadExpLedger() { return _cache.expend || []; }
function saveExpLedger(records) {
  const existing = new Set((_cache.expend||[]).map(r=>r.id));
  const incoming = new Set(records.map(r=>r.id));
  records.forEach(r => {
    _sbWrite('gnsi_expenditure', {
      id: r.id,
      date: r.date || new Date().toISOString().split('T')[0],
      category: r.category || 'General',
      description: r.description || '',
      amount: r.amount || 0,
      receipt: r.receipt || '',
      approved_by: r.approvedBy || '',
      created_at: r.createdAt || new Date().toISOString()
    });
  });
  existing.forEach(id => { if (!incoming.has(id)) _sbDelete('gnsi_expenditure', id); });
  _cache.expend = records;
}
// -- Custom Account Categories ---------------------------------
function loadCustomCats(type) {
  if (type === 'income')      return _cache.catIncome  || [];
  if (type === 'expenditure') return _cache.catExpend  || [];
  return [];
}
function renderUnifiedFeeHub() {
  var role       = (typeof currentUser!=='undefined'&&currentUser) ? currentUser.role : '';
  var isAccounts = role==='accounts' || role==='admin';
  var kpi        = _fmcKPI();
  var asgns      = _fmcLoadAsgns();
  var cols       = _fmcLoadCols();
  var pc         = gnsiLoad('gnsi_pay_config') || {};
  /* ── Header ── */
  var html = '<div class="page-header">'
    + '<div class="page-header-eyebrow">GNSI · ACCOUNTS</div>'
    + '<div class="page-header-title">💳 Fee Management</div>'
    + '<div class="page-header-sub">Collect · Dues · Receipts · Setup</div>'
    + '</div>';
  /* ── KPI row ── */
  html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px">'
    + '<div class="stat-card" style="--c:#1433a8"><div class="stat-label">👥 Students</div><div class="stat-val">'+kpi.students+'</div></div>'
    + '<div class="stat-card" style="--c:#15803d"><div class="stat-label">✅ Collected</div><div class="stat-val">₹'+Math.round(kpi.collected/1000)+'K</div></div>'
    + '<div class="stat-card" style="--c:#c0291d;cursor:pointer" onclick="gnsiSetFMCTab(\'dues\')"><div class="stat-label">⏳ Dues</div><div class="stat-val">₹'+Math.round(kpi.due/1000)+'K</div><div class="stat-sub">'+kpi.overdue+' students</div></div>'
    + '<div class="stat-card" style="--c:#0891b2"><div class="stat-label">🧾 Receipts</div><div class="stat-val">'+kpi.receipts+'</div></div>'
    + '</div>';
  /* ── Tab bar: 3 work tabs + Setup group ── */
  var workTabs = [
    {id:'collect',   icon:'💰', label:'Collect Fee'},
    {id:'dues',      icon:'⏳', label:'Dues'+(kpi.overdue?' ('+kpi.overdue+')':'')},
    {id:'receipts',  icon:'🧾', label:'Receipts'},
  ];
  var setupTabs = isAccounts ? [
    {id:'students',  icon:'📋', label:'Students'},
    {id:'feesetup',  icon:'🏷️', label:'Setup'},
  ] : [];
  var activeTab = _fmc.tab === 'dashboard' || _fmc.tab === 'counter' || _fmc.tab === 'assignment' || _fmc.tab === 'online' ? 'collect' : _fmc.tab;
  html += '<div style="display:flex;gap:6px;align-items:center;margin-bottom:20px;flex-wrap:wrap">';
  workTabs.forEach(function(t) {
    var act = activeTab === t.id;
    var isAlert = t.id==='dues' && kpi.overdue>0;
    html += '<button onclick="gnsiSetFMCTab(\''+t.id+'\')" style="padding:9px 20px;border-radius:10px;border:'+(act?'none':(isAlert?'1.5px solid #fca5a5':'1.5px solid var(--border)'))+';cursor:pointer;font-weight:700;font-size:13px;background:'+(act?'#1433a8':(isAlert?'#fff5f5':'var(--surface)'))+';color:'+(act?'#fff':(isAlert?'#dc2626':'var(--muted)'))+';transition:all .15s">'+t.icon+' '+t.label+'</button>';
  });
  if(setupTabs.length) {
    html += '<div style="margin-left:auto;display:flex;gap:6px;align-items:center">';
    setupTabs.forEach(function(t) {
      var act = activeTab === t.id;
      html += '<button onclick="gnsiSetFMCTab(\''+t.id+'\')" style="padding:7px 14px;border-radius:8px;border:'+(act?'none':'1.5px dashed var(--border)')+';cursor:pointer;font-weight:700;font-size:12px;background:'+(act?'#475569':'transparent')+';color:'+(act?'#fff':'var(--muted)')+'">'+t.icon+' '+t.label+'</button>';
    });
    html += '</div>';
  }
  html += '</div>';
  /* ── Tab content ── */
  if (activeTab === 'collect') html += _fmcRenderCollect(asgns, cols, isAccounts, kpi);
  if (activeTab === 'dues')    html += _fmcRenderDues();
  if (activeTab === 'receipts')html += _fmcRenderReceipts(isAccounts);
  if (activeTab === 'students')html += _fmcRenderAssignment(isAccounts, isAccounts);
  if (activeTab === 'feesetup')html += '<div>' + _fmcRenderFeeSetup(isAccounts) + _fmcRenderClassBridge(isAccounts) + '</div>';
  if (activeTab === 'bridge')  html += _fmcRenderClassBridge(isAccounts);
  if (activeTab === 'config')  html += _fmcRenderConfig();
  if (activeTab === 'online')  html += _fmcRenderOnline(isAccounts, pc);
  return html;
}
/* ══════════════════════════════════════════════════
   NEW: Unified Collect tab — search + pay in one view
   ══════════════════════════════════════════════════ */
function _fmcRenderCollect(asgns, cols, isAccounts, kpi) {
  if (!isAccounts) return '<div class="card"><div style="padding:30px;text-align:center;color:var(--muted)">Access restricted.</div></div>';
  var curAsgn = _fmc.asgnId ? asgns.find(function(a){return a.id===_fmc.asgnId;}) : null;
  /* ── If a student is selected show their payment form ── */
  if (curAsgn) return _fmcRenderCollectForm(curAsgn, cols, isAccounts);
  /* ── Otherwise show search + student cards ── */
  var q = (_fmc.search||'').toLowerCase();
  var filtered = q.length > 0
    ? asgns.filter(function(a){
        return (a.studentName||a.name||'').toLowerCase().indexOf(q) >= 0
          || (a.rollNo||'').toLowerCase().indexOf(q) >= 0
          || (a.className||'').toLowerCase().indexOf(q) >= 0;
      })
    : asgns;
  /* Search bar */
  var html = '<div style="position:relative;margin-bottom:16px">'
    + '<span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:16px">🔍</span>'
    + '<input id="fmc-collect-search" placeholder="Search student name or GCC number…" value="'+esc(_fmc.search)+'" oninput="_fmc.search=this.value;_debouncedRenderFmc()" style="width:100%;border:2px solid '+(_fmc.search?'#1433a8':'var(--border)')+';border-radius:10px;padding:11px 14px 11px 40px;font-size:14px;background:var(--surface);color:var(--text);box-sizing:border-box;transition:border-color .15s" autofocus/>'
    + (_fmc.search ? '<button onclick="_fmc.search=\'\';render()" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;font-size:16px;cursor:pointer;color:var(--muted)">✕</button>' : '')
    + '</div>';
  if (asgns.length === 0) {
    html += '<div style="text-align:center;padding:48px 20px;background:var(--surface2);border-radius:12px;border:1.5px dashed var(--border)">'
      + '<div style="font-size:40px;margin-bottom:12px">📋</div>'
      + '<div style="font-weight:800;font-size:15px;margin-bottom:6px">No students in fee system yet</div>'
      + '<div style="font-size:13px;color:var(--muted);margin-bottom:16px">Add students first via the Students tab</div>'
      + '<button onclick="gnsiSetFMCTab(\'students\')" style="padding:9px 20px;background:#1433a8;color:#fff;border:none;border-radius:9px;font-size:13px;font-weight:700;cursor:pointer">📋 Go to Students tab</button>'
      + '</div>';
    return html;
  }
  if (q && filtered.length === 0) {
    html += '<div style="text-align:center;padding:32px;color:var(--muted)">No students found for "'+esc(q)+'"</div>';
    return html;
  }
  /* Student cards — show due amount prominently */
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px">';
  (q ? filtered : filtered.slice(0,20)).forEach(function(a) {
    var m    = _fmcMonthsSince(a.enrolledAt);
    var paid = cols.filter(function(c){return c.asgnId===a.id;}).reduce(function(s,c){return s+(parseInt(c.amountPaid)||0);},0);
    var exp  = 0; for(var i=1;i<=m;i++) exp += _fmcCalcFee(a,i).total;
    var due  = Math.max(0, exp - paid);
    var hasdue = due > 0;
    html += '<div onclick="gnsiSetFMCCounter(\''+parseInt(a.id,10)+'\')" style="background:var(--surface);border:1.5px solid '+(hasdue?'#fca5a5':'var(--border)')+';border-radius:10px;padding:14px 16px;cursor:pointer;display:flex;align-items:center;gap:12px;transition:all .15s" onmouseenter="this.style.borderColor=\'#1433a8\';this.style.boxShadow=\'0 4px 16px rgba(20,51,168,.12)\'" onmouseleave="this.style.borderColor=\''+(hasdue?'#fca5a5':'var(--border)')+'\';this.style.boxShadow=\'none\'">'
      + '<div style="width:40px;height:40px;border-radius:50%;background:'+(hasdue?'#dc2626':'#1433a8')+';color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;flex-shrink:0">'+(a.studentName||a.name||'?').charAt(0).toUpperCase()+'</div>'
      + '<div style="flex:1;min-width:0">'
      + '<div style="font-weight:800;font-size:14px">'+esc(a.studentName||a.name||'(Unknown)')+'</div>'
      + '<div style="font-size:11.5px;color:var(--muted)">'+(a.rollNo?'#'+esc(a.rollNo)+' · ':'')+esc(a.className||'--')+'</div>'
      + '</div>'
      + '<div style="text-align:right;flex-shrink:0">'
      + (hasdue
          ? '<div style="font-weight:800;color:#dc2626;font-size:14px">₹'+due.toLocaleString('en-IN')+'</div><div style="font-size:10px;color:#dc2626">due</div>'
          : '<div style="font-weight:700;color:#15803d;font-size:13px">✅ Clear</div>')
      + '</div>'
      + '</div>';
  });
  html += '</div>';
  if (!q && asgns.length > 20) {
    html += '<div style="text-align:center;padding:12px;font-size:12.5px;color:var(--muted)">Showing 20 of '+asgns.length+' students · Search to find specific student</div>';
  }
  return html;
}
/* ══════════════════════════════════════════════════
   NEW: Simplified payment form — one clean form, type selector at top
   ══════════════════════════════════════════════════ */
function _fmcRenderCollectForm(a, cols, isAccounts) {
  var m    = _fmcMonthsSince(a.enrolledAt);
  var fee  = _fmcCalcFee(a, m);
  var paid = cols.filter(function(c){return c.asgnId===a.id;}).reduce(function(s,c){return s+(parseInt(c.amountPaid)||0);},0);
  var exp  = 0; for(var i=1;i<=m;i++) exp += _fmcCalcFee(a,i).total;
  var due  = Math.max(0, exp - paid);
  var MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
  var todayStr = new Date().toISOString().split('T')[0];
  var monthOpts = '';
  for(var j=6;j>=0;j--){var d=new Date(new Date().getFullYear(),new Date().getMonth()-j,1);var ml=MONTHS[d.getMonth()]+' '+d.getFullYear();monthOpts+='<option'+(j===0?' selected':'')+'>'+ml+'</option>';}
  for(var k=1;k<=6;k++){var d2=new Date(new Date().getFullYear(),new Date().getMonth()+k,1);monthOpts+='<option>'+MONTHS[d2.getMonth()]+' '+d2.getFullYear()+'</option>';}
  var modeOpts = '<option>Cash</option><option>UPI</option><option>Bank Transfer</option><option>Cheque</option><option>DD</option>';
  var pt = _fmc.payType || 'monthly';
  /* Back + student header */
  var html = '<button onclick="_fmc.asgnId=null;_fmc.search=\'\';render()" style="display:flex;align-items:center;gap:6px;background:none;border:none;cursor:pointer;color:var(--muted);font-size:13px;font-weight:700;padding:0;margin-bottom:14px">← Back to Students</button>'
    + '<div style="background:linear-gradient(135deg,#1433a8,#2563eb);color:#fff;border-radius:12px;padding:16px 20px;margin-bottom:16px;display:flex;align-items:center;gap:14px;flex-wrap:wrap">'
    + '<div style="width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;flex-shrink:0">'+(a.studentName||a.name||'?').charAt(0).toUpperCase()+'</div>'
    + '<div style="flex:1"><div style="font-size:17px;font-weight:800">'+esc(a.studentName||a.name||'Unknown')+'</div>'
    + '<div style="font-size:12px;opacity:.8">'+(a.rollNo?'#'+esc(a.rollNo)+' · ':'')+esc(a.className||'--')+(a.admNo?' · Adm: '+esc(a.admNo):'')+'</div></div>'
    + '<div style="display:flex;gap:16px">'
    + '<div><div style="font-size:11px;opacity:.7">Paid</div><div style="font-size:18px;font-weight:800">₹'+paid.toLocaleString('en-IN')+'</div></div>'
    + '<div><div style="font-size:11px;opacity:.7">Due</div><div style="font-size:18px;font-weight:800;color:'+(due>0?'#fca5a5':'#86efac')+'">₹'+due.toLocaleString('en-IN')+'</div></div>'
    + '</div></div>';
  /* Fee type selector — pill buttons */
  var types = [
    {id:'monthly',   label:'Monthly',   color:'#1433a8'},
    {id:'admission', label:'Admission', color:'#15803d'},
    {id:'fullpay',   label:'Full Pay',  color:'#7c3aed'},
    {id:'advance',   label:'Advance',   color:'#d97706'},
    {id:'item',      label:'Item',      color:'#0891b2'},
    {id:'manual',    label:'Other',     color:'#475569'},
  ];
  html += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">';
  types.forEach(function(t){
    var sel = pt === t.id;
    html += '<button onclick="_fmc.payType=\''+t.id+'\';render()" style="padding:6px 14px;border-radius:20px;border:'+(sel?'none':'1.5px solid var(--border)')+';cursor:pointer;font-weight:700;font-size:12px;background:'+(sel?t.color:'var(--surface)')+';color:'+(sel?'#fff':'var(--muted)')+';transition:all .12s">'+t.label+'</button>';
  });
  html += '</div>';
  /* Payment form — 2-column grid */
  var inpStyle      = 'width:100%;border:1.5px solid var(--border);border-radius:8px;padding:9px 12px;font-size:13px;background:var(--surface);color:var(--text);box-sizing:border-box';
  var amountDefault = pt==='monthly'?fee.total : pt==='admission'?fee.admFee : pt==='fullpay'?(fee.total*12) : '';
  var descLabel     = pt==='monthly'?'For Month' : pt==='fullpay'?'Months Covered' : pt==='admission'?'Description' : pt==='item'?'Item Description' : 'Label / Description';
  var descId        = 'fmc-desc';
  var descContent   = pt==='monthly'
    ? '<select id="'+descId+'" style="'+inpStyle+'">'+monthOpts+'</select>'
    : '<input id="'+descId+'" placeholder="'+descLabel+'…" style="'+inpStyle+'"/>';
  /* Monthly hint */
  if (pt === 'monthly' && due > 0) {
    html += '<div style="background:#fff5f5;border:1px solid #fca5a5;border-radius:8px;padding:9px 14px;margin-bottom:12px;font-size:12.5px;color:#c0291d;font-weight:600">⚠ ₹'+due.toLocaleString('en-IN')+' outstanding — consider collecting arrears too</div>';
  }
  /* FIX #3: Full Pay breakdown so staff understand the pre-filled amount */
  if (pt === 'fullpay') {
    html += '<div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:9px 14px;margin-bottom:12px;font-size:12px;color:#5b21b6">'
      + '📋 <b>Full Pay breakdown (12 months):</b> '
      + fee.breakdown.join(' + ')
      + ' = ₹'+fee.total.toLocaleString('en-IN')+'/mo × 12 = <b>₹'+(fee.total*12).toLocaleString('en-IN')+'</b>'
      + '</div>';
  }
  html += '<div class="card"><div style="padding:18px">'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">'
    + '<div><label style="font-size:11px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px">'+descLabel+' *</label>'+descContent+'</div>'
    + '<div><label style="font-size:11px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px">Amount (₹) *</label><input type="number" id="fmc-amount" value="'+amountDefault+'" min="0" style="'+inpStyle+'"/></div>'
    + '<div><label style="font-size:11px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px">Payment Mode</label><select id="fmc-mode" style="'+inpStyle+'">'+modeOpts+'</select></div>'
    + '<div><label style="font-size:11px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px">Payment Date</label><input type="date" id="fmc-date" value="'+todayStr+'" style="'+inpStyle+'"/></div>'
    + '<div><label style="font-size:11px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px">Txn / Ref No.</label><input id="fmc-txnref" placeholder="UPI ref, cheque no…" style="'+inpStyle+'"/></div>'
    + '<div><label style="font-size:11px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px">Remarks</label><input id="fmc-remark" placeholder="Optional" style="'+inpStyle+'"/></div>'
    + '</div>'
    + '<div style="display:flex;gap:8px">'
    + '<button class="btn btn-primary" onclick="gnsiCollectFee(\''+parseInt(a.id,10)+'\',false)" style="flex:1">✅ Save & Print Receipt</button>'
    + '<button class="btn" style="background:#dcfce7;color:#15803d;border:1px solid #86efac" onclick="gnsiCollectFee(\''+parseInt(a.id,10)+'\',true)">✓ Save Only</button>'
    + '<button class="btn btn-outline" onclick="_fmc.asgnId=null;_fmc.search=\'\';render()">Cancel</button>'
    + '</div></div></div>';
  /* Recent payments for this student */
  var stuCols = cols.filter(function(c){return c.asgnId===a.id;}).slice().reverse().slice(0,8);
  if (stuCols.length) {
    html += '<div class="card" style="margin-top:12px"><div class="card-head"><span class="card-title">🗂 Payment History</span></div>'
      + '<div style="overflow-x:auto"><table><thead><tr><th>Receipt</th><th>For</th><th>Amount</th><th>Mode</th><th>Date</th><th></th></tr></thead><tbody>';
    stuCols.forEach(function(c){
      html += '<tr>'
        + '<td style="font-size:11.5px;font-weight:700">'+esc(c.receiptNo||'--')+'</td>'
        + '<td>'+esc(c.forMonth||c.description||'--')+'</td>'
        + '<td style="font-weight:700;color:#15803d">₹'+parseInt(c.amountPaid).toLocaleString('en-IN')+'</td>'
        + '<td><span style="background:#e0e8f9;color:#1433a8;border-radius:6px;padding:2px 8px;font-size:11px;font-weight:700">'+esc(c.payMode||'Cash')+'</span></td>'
        + '<td style="font-size:12px;color:var(--muted)">'+(c.payDate?new Date(c.payDate).toLocaleDateString('en-IN'):'--')+'</td>'
        + '<td><button onclick="gnsiSetFMCReceipt(\''+c.id+'\')" style="background:#fef9c3;color:#854d0e;border:1px solid #fde047;border-radius:6px;padding:3px 8px;cursor:pointer;font-size:11px;font-weight:700">🖨</button></td>'
        + '</tr>';
    });
    html += '</tbody></table></div></div>';
  }
  return html;
}
/* ── Unified collect dispatcher ── */
function gnsiCollectFee(asgnId, saveOnly) {
  var pt      = _fmc.payType || 'monthly';
  var amount  = parseInt((document.getElementById('fmc-amount')||{}).value||0);
  var mode    = (document.getElementById('fmc-mode')||{}).value || 'Cash';
  var date    = (document.getElementById('fmc-date')||{}).value  || new Date().toISOString().split('T')[0];
  var txnref  = ((document.getElementById('fmc-txnref')||{}).value||'').trim();
  var remark  = ((document.getElementById('fmc-remark')||{}).value||'').trim();
  var desc    = ((document.getElementById('fmc-desc')||{}).value||'').trim();
  if (!amount || amount <= 0) { showToast('⚠ Enter a valid amount','#ea580c'); return; }
  if (!desc && pt !== 'manual') { showToast('⚠ Enter the description / month','#ea580c'); return; }
  var typeLabels = {monthly:'Monthly Fee', admission:'Admission Fee', fullpay:'Full Payment', advance:'Advance', item:'Item Fee', manual:'Fee'};
  var prefixes   = {monthly:'MFE', admission:'ADM', fullpay:'FPY', advance:'ADV', item:'ITM', manual:'MAN'};
  var col = _fmcSaveCol(asgnId, {
    forMonth:    pt==='monthly' ? desc : (typeLabels[pt]||'Fee'),
    description: desc,
    amountPaid:  amount,
    payDate:     date,
    payMode:     mode,
    txnRef:      txnref,
    remark:      remark,
    feeType:     pt,
    admAppId:    undefined
  }, prefixes[pt]||'RCP');
  if (!col) return;
  if (!saveOnly) {
    _fmc.receiptId = col.id;
    _fmc.tab = 'receipts';
  }
  render();
}
function gnsiSetFMCTab(t) {
  /* Map old tab names to new unified names */
  var _tabMap = {counter:'collect', assignment:'students', dashboard:'collect', online:'collect'};
  _fmc.tab = _tabMap[t] || t;
  _fmc.receiptId = null;
  _fmc.search = '';
  _fmc.asgnId = null;
  render();
}
/* ============ TAB: DASHBOARD ============ */
function _fmcRenderDashboard(kpi, pc) {
  var cols  = _fmcLoadCols();
  var txns  = _fmcLoadTxns();
  var asgns = _fmcLoadAsgns();
  /* Monthly trend -- last 6 months */
  var now = new Date();
  var months = [];
  for(var i=5;i>=0;i--){
    var d=new Date(now.getFullYear(), now.getMonth()-i, 1);
    var label=(['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()])+' '+(d.getFullYear().toString().slice(-2));
    var monthKey=(['January','February','March','April','May','June','July','August','September','October','November','December'][d.getMonth()])+' '+d.getFullYear();
    var cash=cols.filter(function(c){return (c.forMonth||'').indexOf(monthKey)>=0;}).reduce(function(s,c){return s+(parseInt(c.amountPaid)||0);},0);
    var online=txns.filter(function(t){return t.status==='Success'&&(t.ts||'').indexOf(label)>=0;}).reduce(function(s,t){return s+(parseFloat(t.amount)||0);},0);
    months.push({label:label,cash:cash,online:online,total:cash+online});
  }
  var maxVal = Math.max.apply(null, months.map(function(m){return m.total;})) || 1;
  var bars = months.map(function(m){
    var cashPct = Math.round((m.cash/maxVal)*100);
    var onlinePct = Math.round((m.online/maxVal)*100);
    return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">'
      +'<div style="font-size:10px;font-weight:700;color:var(--muted);font-family:\'JetBrains Mono\',monospace">₹'+Math.round((m.total)/1000)+'K</div>'
      +'<div style="width:100%;height:100px;background:var(--surface2);border-radius:8px;overflow:hidden;display:flex;flex-direction:column;justify-content:flex-end">'
      +'<div title="Online ₹'+m.online.toLocaleString('en-IN')+'" style="width:100%;height:'+onlinePct+'%;background:#7c3aed;opacity:.85;transition:height .4s"></div>'
      +'<div title="Cash ₹'+m.cash.toLocaleString('en-IN')+'" style="width:100%;height:'+cashPct+'%;background:#1433a8;transition:height .4s"></div>'
      +'</div>'
      +'<div style="font-size:10px;color:var(--muted)">'+m.label+'</div>'
      +'</div>';
  }).join('');
  /* Top 5 collectors */
  var stuTotals = {};
  cols.forEach(function(c){ var _cn=c.studentName||c.name||'Unknown'; stuTotals[_cn]=(stuTotals[_cn]||0)+(parseInt(c.amountPaid)||0); });
  var top5=Object.keys(stuTotals).map(function(n){return{name:n,amt:stuTotals[n]};}).sort(function(a,b){return b.amt-a.amt;}).slice(0,5);
  /* Defaulters */
  var defaulters=asgns.filter(function(a){
    var m=_fmcMonthsSince(a.enrolledAt);
    var paid=cols.filter(function(c){return c.asgnId===a.id;}).reduce(function(s,c){return s+(parseInt(c.amountPaid)||0);},0);
    var exp=0; for(var i=1;i<=m;i++) exp+=_fmcCalcFee(a,i).total;
    return exp>paid;
  }).slice(0,5);
  var html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">';
  /* Collection trend chart */
  html += '<div class="card" style="grid-column:1/-1"><div class="card-head"><span class="card-title">📈 Monthly Collection Trend</span>'
    +'<div style="display:flex;gap:12px;align-items:center;font-size:11px"><span style="display:inline-flex;align-items:center;gap:4px"><span style="width:10px;height:10px;background:#1433a8;border-radius:2px;display:inline-block"></span>Cash/Bank</span>'
    +'<span style="display:inline-flex;align-items:center;gap:4px"><span style="width:10px;height:10px;background:#7c3aed;border-radius:2px;display:inline-block"></span>Online</span></div>'
    +'</div><div style="padding:16px;display:flex;gap:8px;align-items:flex-end">'+bars+'</div></div>';
  /* Top payers */
  html += '<div class="card"><div class="card-head"><span class="card-title">🏆 Top Payers</span></div><div style="padding:0 16px 12px">';
  if(top5.length){
    top5.forEach(function(s,i){
      html+='<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-soft)">'
        +'<div style="display:flex;align-items:center;gap:10px">'
        +'<div style="width:24px;height:24px;border-radius:50%;background:#1433a8;color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800">'+(i+1)+'</div>'
        +'<div style="font-size:13px;font-weight:700">'+esc(s.name)+'</div></div>'
        +'<div style="font-weight:800;color:#15803d;font-family:\'JetBrains Mono\',monospace">₹'+s.amt.toLocaleString('en-IN')+'</div></div>';
    });
  } else {
    html+='<div style="text-align:center;color:var(--muted);padding:20px">No collections yet</div>';
  }
  html+='</div></div>';
  /* Defaulters panel */
  html += '<div class="card"><div class="card-head"><span class="card-title" style="color:#c0291d">⚠️ Pending Defaulters</span>'
    +'<button onclick="gnsiSetFMCTab(\'dues\')" style="font-size:11px;background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;border-radius:6px;padding:3px 10px;cursor:pointer;font-weight:700">View All →</button>'
    +'</div><div style="padding:0 16px 12px">';
  if(defaulters.length){
    defaulters.forEach(function(a){
      var m=_fmcMonthsSince(a.enrolledAt);
      var paid=cols.filter(function(c){return c.asgnId===a.id;}).reduce(function(s,c){return s+(parseInt(c.amountPaid)||0);},0);
      var exp=0; for(var i=1;i<=m;i++) exp+=_fmcCalcFee(a,i).total;
      var due=exp-paid;
      html+='<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-soft)">'
        +'<div><div style="font-size:13px;font-weight:700">'+esc(a.studentName||a.name||'(Unknown)')+'</div>'
        +'<div style="font-size:11px;color:var(--muted)">'+esc(a.className||'--')+'</div></div>'
        +'<div style="display:flex;gap:8px;align-items:center">'
        +'<span style="font-weight:800;color:#c0291d;font-size:13px">₹'+due.toLocaleString('en-IN')+'</span>'
        +'<button onclick="gnsiSetFMCTab(\'counter\');_fmc.asgnId=\''+parseInt(a.id,10)+'\';_fmc.stuId=\''+a.stuId+'\';render()" style="font-size:11px;background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;border-radius:6px;padding:3px 8px;cursor:pointer;font-weight:700">Collect</button>'
        +'</div></div>';
    });
  } else {
    html+='<div style="text-align:center;color:#15803d;padding:20px;font-weight:700">✅ No defaulters!</div>';
  }
  html+='</div></div>';
  html+='</div>';
  /* Quick actions */
  html+='<div class="card"><div class="card-head"><span class="card-title">⚡ Quick Actions</span></div>'
    +'<div style="padding:16px;display:flex;gap:12px;flex-wrap:wrap">'
    +'<button onclick="gnsiSetFMCTab(\'counter\')" class="btn btn-primary">💰 Collect Fee</button>'
    +'<button onclick="gnsiSetFMCTab(\'assignment\')" class="btn" style="background:#e0e8f9;color:#1433a8;border:1px solid #c7d7f5">📋 Manage Assignments</button>'
    +'<button onclick="gnsiSetFMCTab(\'dues\')" class="btn" style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5">⏳ View Dues</button>'
    +'<button onclick="gnsiSetFMCTab(\'receipts\')" class="btn" style="background:#fef9c3;color:#854d0e;border:1px solid #fde047">🧾 Receipts</button>'
    +'<button onclick="gnsiSetFMCTab(\'online\')" class="btn" style="background:#f3e8ff;color:#7c3aed;border:1px solid #e9d5ff">🌐 Online Txns</button>'
    +'</div></div>';
  return html;
}
/* ============ TAB: COLLECT FEE (Counter) ============ */
function _fmcRenderCounter(isAccounts) {
  if(!isAccounts) return '<div class="card"><div style="padding:30px;text-align:center;color:var(--muted)">Accounts or Admin access required.</div></div>';
  var asgns = _fmcLoadAsgns();
  var curAsgn = _fmc.asgnId ? asgns.find(function(a){return a.id===_fmc.asgnId;}) : null;
  /* -- Student search sidebar + form -- */
  var q = (_fmc.search||'').toLowerCase();
  var filtered = asgns.filter(function(a){
    var _n=(a.studentName||a.name||'').toLowerCase(); return !q || _n.indexOf(q)>=0 || (a.className||'').toLowerCase().indexOf(q)>=0 || (a.rollNo||'').toLowerCase().indexOf(q)>=0;
  });
  var listItems = filtered.map(function(a){
    var sel = _fmc.asgnId===a.id;
    return '<div onclick="gnsiSetFMCCounter(\''+parseInt(a.id,10)+'\')" style="padding:10px 14px;cursor:pointer;border-radius:8px;background:'+(sel?'#e0e8f9':'transparent')+';border-left:3px solid '+(sel?'#1433a8':'transparent')+';margin-bottom:3px;transition:all .15s">'
      +'<div style="font-weight:'+(sel?'800':'600')+';font-size:13px;color:'+(sel?'#1433a8':'var(--text)')+'">'+esc(a.studentName||a.name||'(Unknown)')+'</div>'
      +'<div style="font-size:11px;color:var(--muted)">'+esc(a.className||'--')+(a.rollNo?' · #'+esc(a.rollNo):'')+'</div>'
      +'</div>';
  }).join('');
  var html = '<div style="display:grid;grid-template-columns:260px 1fr;gap:16px;min-height:500px">';
  /* Left: student list */
  html += '<div class="card" style="overflow:hidden">'
    +'<div class="card-head" style="border-bottom:1px solid var(--border)"><span class="card-title">👥 Students</span></div>'
    +'<div style="padding:10px"><input placeholder="🔍 Search…" value="'+esc(_fmc.search)+'" oninput="_fmc.search=this.value;_debouncedRenderFmc()" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:7px 10px;font-size:12.5px;background:var(--surface);color:var(--text);font-family:\'DM Sans\',sans-serif;box-sizing:border-box"/></div>'
    +'<div style="overflow-y:auto;max-height:480px;padding:0 10px 10px">'
    +(listItems||'<div style="text-align:center;color:var(--muted);padding:20px;font-size:13px">No students found</div>')
    +'</div></div>';
  /* Right: payment form */
  html += '<div>';
  if(!curAsgn) {
    html += '<div class="card" style="display:flex;align-items:center;justify-content:center;min-height:400px">'
      +'<div style="text-align:center;color:var(--muted)">'
      +'<div style="font-size:48px;margin-bottom:12px">💰</div>'
      +'<div style="font-size:15px;font-weight:700;margin-bottom:6px">Select a Student</div>'
      +'<div style="font-size:13px;color:var(--muted);margin-bottom:14px">Pick a name from the list on the left to start collecting fee</div>'
      +(asgns.length===0?'<div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:10px 14px;font-size:12px;color:#92400e;font-weight:600;max-width:260px">⚠️ No students enrolled yet.<br>Ask admin to add students via <b>Student List</b> tab.</div>':'')
      +'</div></div>';
  } else {
    html += _fmcRenderCounterForm(curAsgn, isAccounts);
  }
  html += '</div>';
  html += '</div>';
  return html;
}
function gnsiSetFMCCounter(asgnId) {
  _fmc.asgnId = asgnId;
  _fmc.payType = 'monthly';
  _fmc.tab = 'collect';
  render();
}
function _fmcRenderCounterForm(a, isAccounts) {
  var cols = _fmcLoadCols();
  var m    = _fmcMonthsSince(a.enrolledAt);
  var fee  = _fmcCalcFee(a, m);
  var paid = cols.filter(function(c){return c.asgnId===a.id;}).reduce(function(s,c){return s+(parseInt(c.amountPaid)||0);},0);
  var exp  = 0; for(var i=1;i<=m;i++) exp+=_fmcCalcFee(a,i).total;
  var due  = Math.max(0, exp-paid);
  var isPhase2 = a.subTypeId&&a.courseAssignedAt;
  /* Student info bar */
  var html = '<div class="card" style="margin-bottom:14px">'
    +'<div style="padding:16px;display:flex;align-items:center;gap:16px;flex-wrap:wrap">'
    +'<div style="width:48px;height:48px;border-radius:50%;background:#1433a8;color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800">'+esc((a.studentName||a.name||'?').charAt(0).toUpperCase())+'</div>'
    +'<div style="flex:1">'
    +'<div style="font-size:17px;font-weight:800">'+esc(a.studentName||a.name||'(Unknown)')+'</div>'
    +'<div style="font-size:12px;color:var(--muted)">'+esc(a.className||'--')+(a.rollNo?' · Roll #'+esc(a.rollNo):'')+(a.admNo?' · Adm: '+esc(a.admNo):'')+'</div>'
    +'</div>'
    +'<div style="display:flex;gap:12px;flex-wrap:wrap">'
    +'<div style="text-align:center"><div style="font-size:11px;color:var(--muted)">Total Paid</div><div style="font-weight:800;color:#15803d;font-size:16px">₹'+paid.toLocaleString('en-IN')+'</div></div>'
    +'<div style="text-align:center"><div style="font-size:11px;color:var(--muted)">Outstanding</div><div style="font-weight:800;color:'+(due>0?'#c0291d':'#15803d')+';font-size:16px">₹'+due.toLocaleString('en-IN')+'</div></div>'
    +'<div style="text-align:center"><div style="font-size:11px;color:var(--muted)">Phase</div><div style="font-weight:800;font-size:13px">'+(isPhase2?'<span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:2px 8px">Phase 2</span>':'<span style="background:#e0e8f9;color:#1433a8;border-radius:6px;padding:2px 8px">Phase 1</span>')+'</div></div>'
    +'</div></div></div>';
  /* Payment type tabs */
  /* Payment type tabs with tooltips explaining when to use each */
  var ptypes=[
    {id:'monthly',   label:'📅 Monthly Fee',  tip:'Regular monthly fee payment',   color:'#1433a8'},
    {id:'fullpay',   label:'💳 Full Payment', tip:'Lump-sum for multiple months',   color:'#7c3aed'},
    {id:'admission', label:'🎓 Admission Fee',tip:'One-time admission/registration',color:'#15803d'},
    {id:'advance',   label:'💰 Advance',      tip:'Payment in advance for future months', color:'#d97706'},
    {id:'item',      label:'📦 Item Fee',     tip:'Uniform, books, stationery etc.',color:'#0891b2'},
    {id:'manual',    label:'✏️ Other',        tip:'Exam fee, trip, miscellaneous',  color:'#475569'},
  ];
  html += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">';
  ptypes.forEach(function(pt){
    var sel=_fmc.payType===pt.id;
    html+='<button onclick="_fmc.payType=\''+pt.id+'\';render()" style="padding:7px 14px;border-radius:8px;border:'+(sel?'none':'1.5px solid var(--border)')+';cursor:pointer;font-weight:700;font-size:12px;background:'+(sel?pt.color:'var(--surface)')+';color:'+(sel?'#fff':'var(--muted)')+'">'+pt.label+'</button>';
  });
  html += '</div>';
  /* -- Payment forms -- */
  var MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
  var curMonth=MONTHS[new Date().getMonth()]+' '+new Date().getFullYear();
  var monthOpts='';
  for(var j=6;j>=0;j--){
    var d=new Date(new Date().getFullYear(),new Date().getMonth()-j,1);
    var ml=MONTHS[d.getMonth()]+' '+d.getFullYear();
    monthOpts+='<option value="'+ml+'"'+(j===0?' selected':'')+'>'+ml+'</option>';
  }
  for(var k=1;k<=6;k++){
    var d2=new Date(new Date().getFullYear(),new Date().getMonth()+k,1);
    var ml2=MONTHS[d2.getMonth()]+' '+d2.getFullYear();
    monthOpts+='<option value="'+ml2+'">'+ml2+'</option>';
  }
  var modeOpts='<option>Cash</option><option>UPI</option><option>Bank Transfer</option><option>Cheque</option><option>DD</option><option>Online Gateway</option>';
  var todayStr=new Date().toISOString().split('T')[0];
  html += '<div class="card"><div style="padding:18px">';
  if(_fmc.payType==='monthly'){
    var _needsCourse = !a.courseId && (typeof _fmcMonthsSince==='function' ? _fmcMonthsSince(a.billingStartAt||a.enrolledAt)>=3 : false);
    if(_needsCourse){
      html+='<div style="background:#fef9c3;border:1.5px solid #fde68a;border-radius:10px;padding:14px 16px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">'
        +'<div><div style="font-size:13px;font-weight:700;color:#854d0e">🎓 Course Assignment Required</div>'
        +'<div style="font-size:11.5px;color:#92400e;margin-top:3px">Assign course & sub-type before collecting April fee.</div></div>'
        +'<button onclick="gnsiAssignCourse(\''+parseInt(a.id,10)+'\')" style="padding:8px 14px;background:#0f2d52;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">🎯 Assign Now</button></div>';
    }
    html+='<div style="background:#e0e8f9;border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:12.5px;color:#1433a8">'
      +'💡 <b>Month '+m+'</b> fee = <b>₹'+fee.total.toLocaleString('en-IN')+'</b> ('+fee.breakdown.join(' + ')+')'+(due>0?' · <span style="color:#c0291d;font-weight:700">₹'+due.toLocaleString('en-IN')+' outstanding</span>':'')
      +'</div>'
      +'<div class="form-grid g3" style="margin-bottom:14px">'
      +'<div class="form-group"><label>For Month *</label><select id="fmc-month">'+monthOpts+'</select></div>'
      +'<div class="form-group"><label>Amount (₹) *</label><input type="number" id="fmc-amount" value="'+fee.total+'" min="0"/></div>'
      +'<div class="form-group"><label>Payment Date</label><input type="date" id="fmc-date" value="'+todayStr+'"/></div>'
      +'<div class="form-group"><label>Mode</label><select id="fmc-mode">'+modeOpts+'</select></div>'
      +'<div class="form-group"><label>Txn / Ref No.</label><input id="fmc-txnref" placeholder="UPI/Cheque ref (optional)"/></div>'
      +'<div class="form-group"><label>Remarks</label><input id="fmc-remark" placeholder="Optional"/></div>'
      +'</div>'
      +'<div class="form-actions">'
      +'<button class="btn btn-primary" onclick="gnsiSFASaveMonthly(\''+parseInt(a.id,10)+'\',false)">✅ Save &amp; Print Receipt</button>'
      +'<button class="btn" style="background:#dcfce7;color:#15803d;border:1px solid #86efac" onclick="gnsiSFASaveMonthly(\''+parseInt(a.id,10)+'\',true)">✓ Save Only</button>'
      +'<button class="btn btn-outline" onclick="_fmc.asgnId=null;render()">Cancel</button>'
      +'</div>';
  } else if(_fmc.payType==='fullpay'){
    html+='<div class="form-grid g3" style="margin-bottom:14px">'
      +'<div class="form-group"><label>Months Covered *</label><input id="fmc-fp-months" placeholder="e.g. Apr–Mar 2025-26"/></div>'
      +'<div class="form-group"><label>Total Amount (₹) *</label><input type="number" id="fmc-fp-amount" value="'+(fee.total*12)+'" min="0"/></div>'
      +'<div class="form-group"><label>Payment Date</label><input type="date" id="fmc-fp-date" value="'+todayStr+'"/></div>'
      +'<div class="form-group"><label>Mode</label><select id="fmc-fp-mode">'+modeOpts+'</select></div>'
      +'<div class="form-group"><label>Txn Ref No.</label><input id="fmc-fp-txnref" placeholder="Optional"/></div>'
      +'<div class="form-group"><label>Remarks</label><input id="fmc-fp-remark" placeholder="Optional"/></div>'
      +'</div>'
      +'<div class="form-actions"><button class="btn btn-primary" onclick="gnsiSFASaveFullPay(\''+parseInt(a.id,10)+'\')">✅ Record Full Payment</button>'
      +'<button class="btn btn-outline" onclick="_fmc.asgnId=null;render()">Cancel</button></div>';
  } else if(_fmc.payType==='admission'){
    html+='<div class="form-grid g3" style="margin-bottom:14px">'
      +'<div class="form-group"><label>Admission Fee (₹) *</label><input type="number" id="fmc-adm-amount" value="'+fee.admFee+'" min="0"/></div>'
      +'<div class="form-group"><label>Payment Date</label><input type="date" id="fmc-adm-date" value="'+todayStr+'"/></div>'
      +'<div class="form-group"><label>Mode</label><select id="fmc-adm-mode">'+modeOpts+'</select></div>'
      +'<div class="form-group"><label>Txn Ref</label><input id="fmc-adm-txnref" placeholder="Optional"/></div>'
      +'<div class="form-group"><label>Remarks</label><input id="fmc-adm-remark" placeholder="Optional"/></div>'
      +'</div>'
      +'<div class="form-actions"><button class="btn btn-primary" style="background:#15803d" onclick="gnsiSFASaveAdmission(\''+parseInt(a.id,10)+'\')">✅ Record Admission Fee</button>'
      +'<button class="btn btn-outline" onclick="_fmc.asgnId=null;render()">Cancel</button></div>';
  } else if(_fmc.payType==='advance'){
    html+='<div class="form-grid g3" style="margin-bottom:14px">'
      +'<div class="form-group"><label>Advance Amount (₹) *</label><input type="number" id="fmc-adv-amount" min="0"/></div>'
      +'<div class="form-group"><label>Advance For</label><input id="fmc-adv-for" placeholder="e.g. Next quarter"/></div>'
      +'<div class="form-group"><label>Payment Date</label><input type="date" id="fmc-adv-date" value="'+todayStr+'"/></div>'
      +'<div class="form-group"><label>Mode</label><select id="fmc-adv-mode">'+modeOpts+'</select></div>'
      +'<div class="form-group"><label>Remarks</label><input id="fmc-adv-remark" placeholder="Optional"/></div>'
      +'</div>'
      +'<div class="form-actions"><button class="btn btn-primary" style="background:#d97706" onclick="gnsiSFASaveAdvance(\''+parseInt(a.id,10)+'\')">✅ Record Advance</button>'
      +'<button class="btn btn-outline" onclick="_fmc.asgnId=null;render()">Cancel</button></div>';
  } else if(_fmc.payType==='item'){
    html+='<div class="form-grid g3" style="margin-bottom:14px">'
      +'<div class="form-group"><label>Item Description *</label><input id="fmc-itm-desc" placeholder="e.g. Uniform, Books"/></div>'
      +'<div class="form-group"><label>Amount (₹) *</label><input type="number" id="fmc-itm-amount" min="0"/></div>'
      +'<div class="form-group"><label>Payment Date</label><input type="date" id="fmc-itm-date" value="'+todayStr+'"/></div>'
      +'<div class="form-group"><label>Mode</label><select id="fmc-itm-mode">'+modeOpts+'</select></div>'
      +'<div class="form-group"><label>Remarks</label><input id="fmc-itm-remark" placeholder="Optional"/></div>'
      +'</div>'
      +'<div class="form-actions"><button class="btn btn-primary" style="background:#0891b2" onclick="gnsiSFASaveItem(\''+parseInt(a.id,10)+'\')">✅ Record Item Fee</button>'
      +'<button class="btn btn-outline" onclick="_fmc.asgnId=null;render()">Cancel</button></div>';
  } else if(_fmc.payType==='manual'){
    html+='<div class="form-grid g3" style="margin-bottom:14px">'
      +'<div class="form-group"><label>Fee Label *</label><input id="fmc-man-label" placeholder="e.g. Exam fee, Trip fee"/></div>'
      +'<div class="form-group"><label>Amount (₹) *</label><input type="number" id="fmc-man-amount" min="0"/></div>'
      +'<div class="form-group"><label>Payment Date</label><input type="date" id="fmc-man-date" value="'+todayStr+'"/></div>'
      +'<div class="form-group"><label>Mode</label><select id="fmc-man-mode">'+modeOpts+'</select></div>'
      +'<div class="form-group"><label>Remarks</label><input id="fmc-man-remark" placeholder="Optional"/></div>'
      +'</div>'
      +'<div class="form-actions"><button class="btn btn-primary" style="background:#475569" onclick="gnsiSFASaveManual(\''+parseInt(a.id,10)+'\')">✅ Record Manual Fee</button>'
      +'<button class="btn btn-outline" onclick="_fmc.asgnId=null;render()">Cancel</button></div>';
  }
  html += '</div></div>';
  /* Recent collections for this student */
  var stuCols = _fmcLoadCols().filter(function(c){return c.asgnId===a.id;}).slice().reverse().slice(0,10);
  if(stuCols.length){
    html+='<div class="card" style="margin-top:14px"><div class="card-head"><span class="card-title">🗂️ Payment History</span></div>'
      +'<div style="overflow-x:auto"><table><thead><tr><th>Receipt</th><th>Month/Desc</th><th>Amount</th><th>Mode</th><th>Date</th><th></th></tr></thead><tbody>';
    stuCols.forEach(function(c){
      html+='<tr>'
        +'<td style="font-family:\'JetBrains Mono\',monospace;font-size:12px">'+esc(c.receiptNo||'--')+'</td>'
        +'<td>'+esc(c.forMonth||c.description||'--')+'</td>'
        +'<td style="font-weight:700;color:#15803d">₹'+parseInt(c.amountPaid).toLocaleString('en-IN')+'</td>'
        +'<td><span style="background:#e0e8f9;color:#1433a8;border-radius:6px;padding:2px 8px;font-size:11px;font-weight:700">'+esc(c.payMode||'Cash')+'</span></td>'
        +'<td style="font-size:12px;color:var(--muted)">'+(c.payDate?new Date(c.payDate).toLocaleDateString('en-IN'):'--')+'</td>'
        +'<td><button onclick="gnsiSetFMCReceipt(\''+c.id+'\')" style="background:#fef9c3;color:#854d0e;border:1px solid #fde047;border-radius:6px;padding:3px 8px;cursor:pointer;font-size:11px;font-weight:700">🖨️</button></td>'
        +'</tr>';
    });
    html+='</tbody></table></div></div>';
  }
  return html;
}
function gnsiSetFMCReceipt(id){ gnsiPrintFMCReceiptPopup(id); }
function gnsiPrintFMCReceiptPopup(id){
  var cols=_fmcLoadCols(); var asgns=_fmcLoadAsgns();
  var col=cols.find(function(c){return c.id===id;});
  if(!col){ showToast('Receipt not found','#c0291d'); return; }
  var a=asgns.find(function(x){return x.id===col.asgnId;});
  var html=_fmcBuildReceiptPopupHTML(col,a);
  var pw=window.open('','_blank','width=794,height=1123,scrollbars=yes');
  if(!pw){ showToast('Popup blocked — please allow popups for this page','#c0291d'); return; }
  pw.document.open(); pw.document.write(html); pw.document.close();
  pw.onload=function(){ pw.focus(); pw.print(); };
}
/* -- Save helpers -- */
function _fmcSaveCol(asgnId, extra, prefix) {
  var asgns=_fmcLoadAsgns(); var a=asgns.find(function(x){return x.id===asgnId;});
  if(!a){alert('Assignment not found.');return null;}
  var cols=_fmcLoadCols();
  var col=Object.assign({
    id:'col_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),
    asgnId:asgnId, receiptNo:_fmcNextReceipt(prefix),
    studentName:a.studentName||a.name||'', rollNo:a.rollNo||'', admNo:a.admNo||'',
    className:a.className||'', subTypeId:a.subTypeId||null,
    collectedBy:(typeof currentUser!=='undefined'&&currentUser)?currentUser.name:'Admin',
    createdAt:new Date().toISOString()
  }, extra);
  cols.push(col);
  _fmcSaveCols(cols);
  /* Push to cloud immediately so all devices see the payment */
  if(typeof gnsiKVPush==='function'){
    gnsiKVPush('gnsi_fee_cols', cols);
    gnsiKVPush('gnsi_sfa_collections', cols);
  }
  /* Post to income ledger */
  try{
    var inc=loadIncomeLedger();
    inc.push({id:'inc_'+col.id,date:col.payDate||new Date().toISOString().split('T')[0],category:'Fee Collection',description:(col.description||col.forMonth||'Fee')+' -- '+(a.studentName||a.name||''),amount:parseInt(col.amountPaid),receipt:col.receiptNo,source:'FMC',sourceId:col.id,createdAt:new Date().toISOString()});
    saveIncomeLedger(inc);
  }catch(ex){}
  /* CM sync */
  if(a.stuId&&typeof gnsiCMSyncFeeStatus==='function') gnsiCMSyncFeeStatus(a.stuId,'Paid','monthly');
  gnsiActivity('Fee Collected', (a.studentName||a.name||'')+' ₹'+col.amountPaid, 'fees');
  if(typeof acLog==='function') acLog('Fee Collected',(a.studentName||a.name||'')+' ₹'+col.amountPaid);
  if(typeof showToast==='function') showToast('Recorded -- Receipt: '+col.receiptNo,'#15803d');
  return col;
}

/* ═══════════════════════════════════════════════════════
   PHASE-2: ASSIGN COURSE & SUB-TYPE (April onwards)
   Called from collect form when monthIdx >= 3 and no courseId
   ═══════════════════════════════════════════════════════ */
function gnsiAssignCourse(asgnId) {
  var asgns = _fmcLoadAsgns();
  var a = asgns.find(function(x){return x.id===asgnId;});
  if(!a){showToast && showToast('Assignment not found','#c0291d'); return;}
  var isRep = a.isRepeater || false;
  var disc  = isRep ? 500 : 0;
  var cfg   = (typeof FS_FEE_CONFIG!=='undefined') ? FS_FEE_CONFIG : {courses:[],subtypes:[]};
  var pick  = window._gnsiAssignPick || {courseId:null,subtype:null};
  window._gnsiAssignPick = pick;
  window._gnsiAssignId   = asgnId;

  /* v20 fix: replaced broken ''+ +'' onclick patterns with data-attributes */
  var courseBtns = cfg.courses.map(function(c){
    var sel = pick.courseId===c.id;
    var bdr = c.monthlyFees ? (c.monthlyFees.boarder-disc).toLocaleString('en-IN') : '—';
    return '<button data-gac-course="'+c.id+'" data-gac-asgn="'+asgnId+'" '
      +'style="padding:12px 10px;border-radius:10px;border:2px solid '+(sel?'#0f2d52':'#e2e8f0')+';'
      +'background:'+(sel?'#0f2d52':'#fff')+';color:'+(sel?'#fff':'#334155')+';'
      +'cursor:pointer;font-size:13px;font-weight:700;min-width:110px">'
      +c.icon+' '+c.name+'<br><small style="font-weight:400;font-size:11px">₹'+bdr+'<br>Boarder</small></button>';
  }).join('');

  var subtypeBtns = pick.courseId ? (function(){
    var c = cfg.courses.find(function(x){return x.id===pick.courseId;});
    return ['Boarder','Day Boarder','Day Scholar'].map(function(st){
      var sel = pick.subtype===st;
      var key = st.toLowerCase().replace(/\s+/g,'');
      var fee = c ? ((c.monthlyFees[key]||0)-disc) : 0;
      var icon = st==='Boarder' ? '🏠' : st==='Day Boarder' ? '🌗' : '🚌';
      return '<button data-gac-subtype="'+st+'" data-gac-asgn="'+asgnId+'" '
        +'style="padding:10px 14px;border-radius:8px;border:2px solid '+(sel?'#7c3aed':'#e2e8f0')+';'
        +'background:'+(sel?'#7c3aed':'#fff')+';color:'+(sel?'#fff':'#334155')+';'
        +'cursor:pointer;font-size:12px;font-weight:700">'
        +icon+' '+st
        +'<br><small style="font-weight:400">₹'+fee.toLocaleString('en-IN')+'/mo</small></button>';
    }).join('');
  })() : '<p style="color:#94a3b8;font-size:13px">← Select a course first</p>';

  var preview = (pick.courseId && pick.subtype) ? (function(){
    var c = cfg.courses.find(function(x){return x.id===pick.courseId;});
    var key = pick.subtype.toLowerCase().replace(/\s+/g,'');
    var fee = c ? ((c.monthlyFees[key]||0)-disc) : 0;
    return '<div style="margin-top:14px;background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:12px 16px;font-size:13px">'
      +'✅ Monthly fee from April: <b>₹'+fee.toLocaleString('en-IN')+'</b>'
      +' · '+c.name+' · '+pick.subtype
      +(isRep?'<span style="margin-left:8px;background:#faf5ff;color:#5b21b6;border-radius:4px;padding:2px 6px;font-size:11px">🔄 Repeater −₹500</span>':'')
      +'</div>';
  })() : '';

  var html = '<div id="gnsi-assign-overlay" style="position:fixed;inset:0;background:rgba(15,45,82,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px">'
    +'<div style="background:#fff;border-radius:16px;padding:28px 24px;max-width:520px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 16px 48px rgba(0,0,0,.25)">'
    +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">'
    +'<div><div style="font-size:16px;font-weight:800;color:#0f2d52">🎓 Assign Course &amp; Sub-type</div>'
    +'<div style="font-size:12px;color:#64748b;margin-top:3px">'+esc(a.studentName)+' · Fee from April</div>'
    +(isRep?'<div style="font-size:12px;color:#5b21b6;margin-top:3px">🔄 Repeater — ₹500 discount applied</div>':'')
    +'</div>'
    +'<button data-gac-close="1" style="background:#f1f5f9;border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:16px">✕</button>'
    +'</div>'
    +'<div style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px">Select Course</div>'
    +'<div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:18px">'+courseBtns+'</div>'
    +'<div style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px">Select Sub-type / Accommodation</div>'
    +'<div style="display:flex;flex-wrap:wrap;gap:10px">'+subtypeBtns+'</div>'
    +preview
    +'<div style="display:flex;gap:10px;margin-top:18px">'
    +(pick.courseId&&pick.subtype?'<button data-gac-save="'+asgnId+'" style="flex:1;padding:12px;background:#0f2d52;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer">✅ Save Course Assignment</button>':'')
    +'<button data-gac-close="1" style="padding:12px 18px;background:#f1f5f9;border:none;border-radius:10px;cursor:pointer;font-size:13px">Cancel</button>'
    +'</div></div></div>';

  var old = document.getElementById('gnsi-assign-overlay');
  if(old) old.remove();
  var div = document.createElement('div');
  div.innerHTML = html;
  document.body.appendChild(div.firstChild);
}

function gnsiAssignCourse_close() {
  var el = document.getElementById('gnsi-assign-overlay');
  if(el) el.remove();
  window._gnsiAssignPick = {};
}
/* v20 fix: delegated handler for data-gac-* buttons (replaced broken ''+ onclick patterns) */
(function(){
  document.addEventListener('click', function(e){
    var btn = e.target.closest('[data-gac-course],[data-gac-subtype],[data-gac-save],[data-gac-close]');
    if(!btn) return;
    if(btn.hasAttribute('data-gac-close')){ gnsiAssignCourse_close(); return; }
    if(btn.hasAttribute('data-gac-save')){ gnsiAssignCourse_save(btn.getAttribute('data-gac-save')); return; }
    var asgnId = btn.getAttribute('data-gac-asgn');
    if(btn.hasAttribute('data-gac-course')){
      window._gnsiAssignPick = window._gnsiAssignPick || {};
      window._gnsiAssignPick.courseId = btn.getAttribute('data-gac-course');
      window._gnsiAssignPick.subtype = null;
      gnsiAssignCourse(asgnId);
    } else if(btn.hasAttribute('data-gac-subtype')){
      window._gnsiAssignPick = window._gnsiAssignPick || {};
      window._gnsiAssignPick.subtype = btn.getAttribute('data-gac-subtype');
      gnsiAssignCourse(asgnId);
    }
  });
})();

function gnsiAssignCourse_save(asgnId) {
  var p = window._gnsiAssignPick || {};
  if(!p.courseId||!p.subtype){showToast('Select both course and sub-type','#c0291d');return;}
  var cfg    = (typeof FS_FEE_CONFIG!=='undefined') ? FS_FEE_CONFIG : {courses:[]};
  var course = cfg.courses.find(function(c){return c.id===p.courseId;});
  var skey   = p.subtype.toLowerCase().replace(/\s+/g,'');
  var asgns  = _fmcLoadAsgns();
  var idx    = asgns.findIndex(function(x){return x.id===asgnId;});
  if(idx<0){showToast('Assignment not found','#c0291d');return;}
  var disc   = asgns[idx].isRepeater ? 500 : 0;
  var mfee   = course ? Math.max(0,(course.monthlyFees[skey]||course.monthlyFees['boarder']||0)-disc) : 0;
  asgns[idx].courseId          = p.courseId;
  asgns[idx].subTypeId         = p.courseId+'_'+skey;
  asgns[idx].subtype           = p.subtype;
  asgns[idx].monthlyFee        = mfee;
  asgns[idx].courseAssignedAt  = new Date().toISOString();
  delete asgns[idx].monthlyFeeOverride;
  /* Use _fmcSaveAsgns so cloud KVPush is included */
  if(typeof _fmcSaveAsgns==='function') _fmcSaveAsgns(asgns);
  else {
    (typeof gnsiSave==='function'?gnsiSave:function(k,v){localStorage.setItem(k,JSON.stringify(v));})('gnsi_fee_asgns',asgns);
    (typeof gnsiSave==='function'?gnsiSave:function(k,v){localStorage.setItem(k,JSON.stringify(v));})('gnsi_sfa_assignments',asgns);
    if(typeof gnsiKVPush==='function'){gnsiKVPush('gnsi_fee_asgns',asgns);gnsiKVPush('gnsi_sfa_assignments',asgns);}
  }
  gnsiAssignCourse_close();
  if(typeof showToast==='function') showToast('✅ Course assigned — '+course.name+' · '+p.subtype+(disc?' (₹500 discount applied)':''),'#16a34a');
  if(typeof gnsiRenderFMC==='function') gnsiRenderFMC();
  else if(typeof renderUnifiedFeeHub==='function') renderUnifiedFeeHub();
}

function gnsiSFASaveMonthly(asgnId, saveOnly){
  /* Phase-2 gate: block if month 4+ and no course assigned */
  var _asgns = _fmcLoadAsgns();
  var _a = _asgns.find(function(x){return x.id===asgnId;});
  if(_a && !_a.courseId){
    var _mIdx = _fmcMonthsSince ? _fmcMonthsSince(_a.billingStartAt||_a.enrolledAt) : 0;
    if(_mIdx >= 3){
      if(typeof showToast==='function') showToast('🎓 Assign Course first — click the yellow banner','#d97706');
      gnsiAssignCourse(asgnId);
      return;
    }
  }
  var month=(document.getElementById('fmc-month')||{}).value||'';
  var amount=parseInt((document.getElementById('fmc-amount')||{}).value||0);
  var date=(document.getElementById('fmc-date')||{}).value||new Date().toISOString().split('T')[0];
  var mode=(document.getElementById('fmc-mode')||{}).value||'Cash';
  var txnref=(document.getElementById('fmc-txnref')||{}).value||'';
  var remark=(document.getElementById('fmc-remark')||{}).value||'';
  if(!amount||amount<=0){alert('Enter a valid amount.');return;}
  if(!month){alert('Select a month.');return;}
  /* Duplicate check */
  var existing=_fmcLoadCols().filter(function(c){return c.asgnId===asgnId&&c.forMonth===month&&c.feeType==='monthly';});
  if(existing.length&&!confirm('A monthly fee record for "'+month+'" already exists for this student. Record another payment?')) return;
  var col=_fmcSaveCol(asgnId,{forMonth:month,amountPaid:amount,payDate:date,payMode:mode,txnRef:txnref,remark:remark,feeType:'monthly',description:'Monthly fee -- '+month},'RCP');
  if(!col) return;
  if(!saveOnly){ gnsiPrintFMCReceiptPopup(col.id); }
  render();
}
function gnsiSFASaveFullPay(asgnId){
  var months=(document.getElementById('fmc-fp-months')||{}).value||'';
  var amount=parseInt((document.getElementById('fmc-fp-amount')||{}).value||0);
  var date=(document.getElementById('fmc-fp-date')||{}).value||new Date().toISOString().split('T')[0];
  var mode=(document.getElementById('fmc-fp-mode')||{}).value||'Cash';
  var txnref=(document.getElementById('fmc-fp-txnref')||{}).value||'';
  var remark=(document.getElementById('fmc-fp-remark')||{}).value||'';
  if(!amount||amount<=0){alert('Enter amount.');return;}
  if(!months){alert('Enter months covered.');return;}
  var col=_fmcSaveCol(asgnId,{forMonth:months,amountPaid:amount,payDate:date,payMode:mode,txnRef:txnref,remark:remark,feeType:'fullpay',description:'Full Payment -- '+months},'FPR');
  if(!col) return;
  gnsiPrintFMCReceiptPopup(col.id); render();
}
function gnsiSFASaveAdmission(asgnId){
  var amount=parseInt((document.getElementById('fmc-adm-amount')||{}).value||0);
  var date=(document.getElementById('fmc-adm-date')||{}).value||new Date().toISOString().split('T')[0];
  var mode=(document.getElementById('fmc-adm-mode')||{}).value||'Cash';
  var txnref=(document.getElementById('fmc-adm-txnref')||{}).value||'';
  var remark=(document.getElementById('fmc-adm-remark')||{}).value||'';
  if(!amount||amount<=0){alert('Enter amount.');return;}
  var col=_fmcSaveCol(asgnId,{forMonth:'Admission',amountPaid:amount,payDate:date,payMode:mode,txnRef:txnref,remark:remark,feeType:'admission',description:'Admission Fee'},'ADM');
  if(!col) return;
  gnsiPrintFMCReceiptPopup(col.id); render();
}
function gnsiSFASaveAdvance(asgnId){
  var amount=parseInt((document.getElementById('fmc-adv-amount')||{}).value||0);
  var forWhat=(document.getElementById('fmc-adv-for')||{}).value||'Advance';
  var date=(document.getElementById('fmc-adv-date')||{}).value||new Date().toISOString().split('T')[0];
  var mode=(document.getElementById('fmc-adv-mode')||{}).value||'Cash';
  var remark=(document.getElementById('fmc-adv-remark')||{}).value||'';
  if(!amount||amount<=0){alert('Enter amount.');return;}
  var col=_fmcSaveCol(asgnId,{forMonth:'Advance -- '+forWhat,amountPaid:amount,payDate:date,payMode:mode,remark:remark,feeType:'advance',description:'Advance -- '+forWhat},'ADV');
  if(!col) return;
  gnsiPrintFMCReceiptPopup(col.id); render();
}
function gnsiSFASaveItem(asgnId){
  var desc=(document.getElementById('fmc-itm-desc')||{}).value||'';
  var amount=parseInt((document.getElementById('fmc-itm-amount')||{}).value||0);
  var date=(document.getElementById('fmc-itm-date')||{}).value||new Date().toISOString().split('T')[0];
  var mode=(document.getElementById('fmc-itm-mode')||{}).value||'Cash';
  var remark=(document.getElementById('fmc-itm-remark')||{}).value||'';
  if(!desc){alert('Enter item description.');return;}
  if(!amount||amount<=0){alert('Enter amount.');return;}
  var col=_fmcSaveCol(asgnId,{forMonth:'Item: '+desc,amountPaid:amount,payDate:date,payMode:mode,remark:remark,feeType:'item',description:'Item: '+desc},'ITM');
  if(!col) return;
  gnsiPrintFMCReceiptPopup(col.id); render();
}
function gnsiSFASaveManual(asgnId){
  var label=(document.getElementById('fmc-man-label')||{}).value||'';
  var amount=parseInt((document.getElementById('fmc-man-amount')||{}).value||0);
  var date=(document.getElementById('fmc-man-date')||{}).value||new Date().toISOString().split('T')[0];
  var mode=(document.getElementById('fmc-man-mode')||{}).value||'Cash';
  var remark=(document.getElementById('fmc-man-remark')||{}).value||'';
  if(!label){alert('Enter fee label.');return;}
  if(!amount||amount<=0){alert('Enter amount.');return;}
  var col=_fmcSaveCol(asgnId,{forMonth:label,amountPaid:amount,payDate:date,payMode:mode,remark:remark,feeType:'manual',description:label},'MNL');
  if(!col) return;
  gnsiPrintFMCReceiptPopup(col.id); render();
}
/* ============ TAB: ASSIGNMENTS ============ */
function _fmcRenderAssignment(isAdmin, isAccounts) {
  var asgns=_fmcLoadAsgns(); var cols=_fmcLoadCols();
  var q=(_fmc.search||'').toLowerCase();
  var filtered=asgns.filter(function(a){
    var _sName=(a.studentName||a.name||'').toLowerCase();
    var matchQ=!q||_sName.indexOf(q)>=0||(a.className||'').toLowerCase().indexOf(q)>=0||(a.rollNo||'').toLowerCase().indexOf(q)>=0;
    var matchP=_fmc.filterPhase==='all'||((_fmc.filterPhase==='2')&&a.subTypeId&&a.courseAssignedAt)||((_fmc.filterPhase==='1')&&(!a.subTypeId||!a.courseAssignedAt));
    var matchC=_fmc.filterClass==='all'||a.className===_fmc.filterClass;
    return matchQ&&matchP&&matchC;
  });
  var classNames=typeof getClassNames==='function'?getClassNames():[];
  var classOpts='<option value="all">All Classes</option>'+classNames.map(function(c){return'<option value="'+esc(c)+'"'+(_fmc.filterClass===c?' selected':'')+'>'+esc(c)+'</option>';}).join('');
  /* ── Prominent search bar above Add Student ── */
  var searchBar = '<div style="background:linear-gradient(135deg,#1433a808,#2563eb06);border:2px solid #1433a822;border-radius:12px;padding:14px 16px;margin-bottom:14px">'
    + '<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">🔍 Find Student by Name or GCC No.</div>'
    + '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">'
    + '<div style="flex:1;min-width:200px;position:relative">'
    + '<span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:14px;pointer-events:none">🔍</span>'
    + '<input id="fmc-asgn-search" placeholder="Student name or GCC / Roll No…" value="'+esc(_fmc.search)+'" oninput="_fmc.search=this.value;_debouncedRenderFmc()" style="width:100%;border:2px solid '+(_fmc.search?'#1433a8':'var(--border)')+';border-radius:9px;padding:9px 12px 9px 34px;font-size:13.5px;font-weight:600;background:var(--surface);color:var(--text);box-sizing:border-box"/>'
    + '</div>'
    + (_fmc.search ? '<button onclick="_fmc.search=\'\';render()" style="padding:8px 14px;border-radius:8px;border:1.5px solid var(--border);background:var(--surface2);cursor:pointer;font-size:12px;font-weight:700;color:var(--muted)">✕ Clear</button>' : '')
    + (isAccounts ? '<button class="btn btn-primary" onclick="gnsiShowAddAssignment()" style="white-space:nowrap">➕ Add Student</button>' : '')
    + '</div>'
    + (_fmc.search
        ? '<div style="margin-top:8px;font-size:12px;color:#1433a8;font-weight:700">'+filtered.length+' result'+(filtered.length!==1?'s':'')+' for “'+esc(_fmc.search)+'”</div>'
        : '<div style="margin-top:6px;font-size:11.5px;color:var(--muted)">Type to search instantly — by student name or GCC / roll number</div>')
    + '</div>';
  var filterRow = '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px">'
    + '<span style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase">Filter:</span>'
    + '<select onchange="_fmc.filterClass=this.value;render()" style="border:1.5px solid var(--border);border-radius:8px;padding:6px 10px;font-size:12px;background:var(--surface);color:var(--text)">'+classOpts+'</select>'
    + '<select onchange="_fmc.filterPhase=this.value;render()" style="border:1.5px solid var(--border);border-radius:8px;padding:6px 10px;font-size:12px;background:var(--surface);color:var(--text)">'
    + '<option value="all">All Phases</option><option value="1">Phase 1</option><option value="2">Phase 2</option>'
    + '</select>'
    + '<span style="font-size:11.5px;color:var(--muted);margin-left:auto">'+asgns.length+' students enrolled</span>'
    + '</div>';
  var html = '<div class="card">'
    + '<div class="card-head"><span class="card-title">📋 Student Fee List</span></div>'
    + '<div style="padding:14px 16px 0">' + searchBar + filterRow + '</div>';
  if(!filtered.length){
    html+='<div style="padding:30px;text-align:center;color:var(--muted)">No students found. Add via "➕ Add Student".</div>';
  } else {
    html+='<div style="overflow-x:auto"><table><thead><tr><th>Student</th><th>Class</th><th>Phase</th><th>Course</th><th>Enrolled</th><th>Paid</th><th>Due</th><th>Actions</th></tr></thead><tbody>';
    filtered.forEach(function(a){
      var totalPaid=cols.filter(function(c){return c.asgnId===a.id;}).reduce(function(s,c){return s+(parseInt(c.amountPaid)||0);},0);
      var mn=_fmcMonthsSince(a.enrolledAt); var exp=0; for(var i=1;i<=mn;i++) exp+=_fmcCalcFee(a,i).total;
      var due=Math.max(0,exp-totalPaid);
      var isPhase2=a.subTypeId&&a.courseAssignedAt;
      /* For old SFA records: amountPaid is stored directly on the record */
      var _legacyPaid = parseFloat(a.amountPaid||0);
      /* If this record has no collection entries but has amountPaid directly, count it */
      if (_legacyPaid > 0 && totalPaid === 0) totalPaid = _legacyPaid;
      var _displayName = a.studentName || a.name || '(ID:'+a.stuId+')';
      /* For old records with status=Paid, zero out the due */
      if ((a.status==='Paid'||a.status==='Waived') && due > 0) due = 0;
      html+='<tr style="'+(due>0?'background:#fff5f5;':'')+'">'        +'<td><div style="font-weight:700">'+esc(_displayName)+'</div>'+(a.rollNo?'<div style="font-size:11px;color:var(--muted)">#'+esc(a.rollNo)+'</div>':'')+'</td>'
        +'<td>'+esc(a.className||'--')+(a.className&&gnsiClassToCourse(a.className)?'<div style="font-size:10px;color:#1433a8;font-weight:700;margin-top:2px">🔗 '+esc(gnsiClassToCourse(a.className))+'</div>':'')+'</td>'
        +'<td>'+(isPhase2?'<span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:2px 8px;font-size:11px;font-weight:700">Phase 2</span>':'<span style="background:#e0e8f9;color:#1433a8;border-radius:6px;padding:2px 8px;font-size:11px;font-weight:700">Phase 1</span>')+'</td>'
        +'<td>'+(typeof gnsiGetCourseBadge==='function'?gnsiGetCourseBadge(a.subTypeId||''):'<span style="color:var(--muted)">--</span>')+'</td>'
        +'<td style="font-size:12px;color:var(--muted)">'+(a.enrolledAt?new Date(a.enrolledAt).toLocaleDateString('en-IN'):'--')+'</td>'
        +'<td style="font-weight:700;color:#15803d">₹'+totalPaid.toLocaleString('en-IN')+'</td>'
        +'<td style="font-weight:700;color:'+(due>0?'#c0291d':'#15803d')+'">₹'+due.toLocaleString('en-IN')+'</td>'
        +'<td style="white-space:nowrap">'
        +'<button onclick="gnsiSetFMCTab(\'counter\');_fmc.asgnId=\''+parseInt(a.id,10)+'\';render()" style="background:#dcfce7;color:#15803d;border:1px solid #86efac;border-radius:6px;padding:3px 8px;cursor:pointer;font-size:11px;font-weight:700;margin-right:3px">💰 Collect</button>'
        +(isAccounts&&!isPhase2?'<button onclick="gnsiOpenAssignCourseModal(\''+parseInt(a.id,10)+'\')" style="background:#e0e8f9;color:#1433a8;border:1px solid #c7d7f5;border-radius:6px;padding:3px 8px;cursor:pointer;font-size:11px;font-weight:700;margin-right:3px">🎓 Course</button>':'')
        +(isAccounts?'<button onclick="gnsiDeleteFMCAsgn(\''+parseInt(a.id,10)+'\')" style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;border-radius:6px;padding:3px 8px;cursor:pointer;font-size:11px;font-weight:700">✕</button>':'')
        +'</td></tr>';
    });
    html+='</tbody></table></div>';
  }
  html+='</div>';
  /* Add student form (inline) */
  if(_fmc._showAddForm) html+=_fmcRenderAddForm(isAdmin, classNames);
  /* Course assign modal */
  if(_fmc._courseModalId) html+=_fmcRenderCourseModal(_fmc._courseModalId, asgns);
  return html;
}
function gnsiShowAddAssignment(){ _fmc._showAddForm=true; render(); }
function _fmcRenderAddForm(isAdmin, classNames){
  if(!isAdmin) return '';
  var q = (window._fmcAddSearch||'').toLowerCase();
  var clsOpts = '<option value="">-- Select Class *</option>'
    + classNames.map(function(c){return'<option>'+esc(c)+'</option>';}).join('');
  var stOpts = '<option value="">-- Select Course *</option>';
  if(typeof GNSI_COURSES!=='undefined') GNSI_COURSES.forEach(function(c){
    c.subTypes.forEach(function(st){
      stOpts+='<option value="'+st.id+'">'+c.icon+' '+c.name+' — '+st.label+'</option>';
    });
  });
  /* Live student search results */
  var stuList = (typeof students!=='undefined') ? students : [];
  var matches = q.length >= 1
    ? stuList.filter(function(s){
        var n=(s.name||'').toLowerCase();
        var r=(s.roll||'').toLowerCase();
        var c=(s.cls||'').toLowerCase();
        return n.indexOf(q)>=0 || r.indexOf(q)>=0 || c.indexOf(q)>=0;
      }).slice(0,8)
    : [];
  /* Already in fee system? */
  var inFee = {};
  (typeof _fmcLoadAsgns==='function' ? _fmcLoadAsgns() : []).forEach(function(a){
    if(a.stuId) inFee[String(a.stuId)]=true;
  });
  var resultsHtml = '';
  if(q.length >= 1){
    if(matches.length === 0){
      resultsHtml = '<div style="padding:10px 14px;font-size:12.5px;color:var(--muted);text-align:center">No students found for “'+esc(q)+'”</div>';
    } else {
      resultsHtml = matches.map(function(s){
        var already = !!inFee[String(s.id)];
        /* Pre-compute styles as vars to avoid quote conflicts in string concat */
        var _bg    = already ? '#f1f5f9' : '#ffffff';
        var _bdr   = already ? '#e2e8f0' : '#c7d7f5';
        var _cur   = already ? 'default' : 'pointer';
        var _avBg  = already ? '#94a3b8' : '#1433a8';
        var _nCol  = already ? '#94a3b8' : '#1e293b';
        var _click = already ? '' : 'gnsiPickFMCStudent(' + s.id + ')'
        var _badge = already
          ? '<span style="font-size:10.5px;color:#64748b;font-weight:700;background:#f1f5f9;border-radius:6px;padding:2px 8px">✅ Already added</span>'
          : '<span style="font-size:11px;color:#1433a8;font-weight:700">→ Select</span>';
        var _roll  = s.roll ? 'GCC #' + esc(s.roll) + ' · ' : '';
        return '<div'
          + ' onclick="' + _click + '"'
          + ' style="padding:10px 14px;cursor:' + _cur + ';border-radius:8px;margin:2px 4px;display:flex;align-items:center;gap:10px;background:' + _bg + ';border:1.5px solid ' + _bdr + ';transition:background .1s"'
          + '>'
          + '<div style="width:34px;height:34px;border-radius:50%;background:' + _avBg + ';color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;flex-shrink:0">' + (s.name||'?').charAt(0).toUpperCase() + '</div>'
          + '<div style="flex:1;min-width:0">'
          + '<div style="font-weight:700;font-size:13px;color:' + _nCol + '">' + esc(s.name||'') + '</div>'
          + '<div style="font-size:11px;color:#64748b">' + _roll + esc(s.cls||'--') + '</div>'
          + '</div>'
          + _badge
          + '</div>';
      }).join('');
    }
  }
  /* Selected student preview */
  var selId = window._fmcAddSelId || '';
  var selStu = selId ? stuList.find(function(s){return String(s.id)===String(selId);}) : null;
  var selPreview = selStu
    ? '<div style="background:#e0e8f9;border:1.5px solid #1433a8;border-radius:9px;padding:10px 14px;margin-bottom:12px;display:flex;align-items:center;gap:10px">'
      +'<div style="width:36px;height:36px;border-radius:50%;background:#1433a8;color:#fff;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:800;flex-shrink:0">'+(selStu.name||'?').charAt(0).toUpperCase()+'</div>'
      +'<div style="flex:1"><div style="font-weight:800;color:#1433a8;font-size:14px">'+esc(selStu.name)+'</div>'
      +'<div style="font-size:11.5px;color:#1433a8">'+(selStu.roll?'GCC #'+esc(selStu.roll)+' · ':'')+esc(selStu.cls||'--')+'</div></div>'
      +'<button onclick="gnsiClearFMCPick()" style="background:none;border:none;font-size:16px;cursor:pointer;color:#1433a8">✕</button>'
      +'</div>'
    : '';
  var inputStyle = 'width:100%;border:1.5px solid var(--border);border-radius:8px;padding:9px 12px;font-size:13px;background:var(--surface);color:var(--text);box-sizing:border-box';
  return '<div style="background:var(--surface);border:2px solid #1433a8;border-radius:12px;padding:18px 20px;margin-top:16px">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">'
    +'<div style="font-size:15px;font-weight:800;color:#1433a8">➕ Add Student to Fee System</div>'
    +'<button onclick="_fmc._showAddForm=false;window._fmcAddSearch=\'\';window._fmcAddSelId=\'\';render()" style="background:none;border:none;font-size:18px;cursor:pointer;color:var(--muted)">✕</button>'
    +'</div>'
    /* Step 1: Search */
    +'<div style="margin-bottom:12px">'
    +'<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:6px">'
    +'● Step 1 — Search Student</div>'
    +(selStu ? selPreview :
      '<div style="position:relative">'
      +'<span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:14px">🔍</span>'
      +'<input id="fmc-add-search" placeholder="Type name or GCC no…" value="'+esc(window._fmcAddSearch||'')+'" oninput="window._fmcAddSearch=this.value;_debouncedRenderFmc()" style="'+inputStyle+';padding-left:34px;font-size:13.5px" autofocus/>'
      +'</div>'
      +(resultsHtml ? '<div style="border:1.5px solid var(--border);border-radius:9px;margin-top:6px;overflow:hidden;max-height:280px;overflow-y:auto">'+resultsHtml+'</div>' : '')
    )
    +'</div>'
    /* Step 2: Class + Course (only after student selected) */
    +(selStu ?
      '<div style="margin-bottom:14px">'
      +'<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px">● Step 2 — Class &amp; Course (both required)</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">'
      +'<div><label style="font-size:11px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px">Class *</label>'
      +'<select id="fmc-add-class" onchange="fmcBridgeAutoFillOnClassChange(this.value)" style="'+inputStyle+'">'+clsOpts+'</select></div>'
      +'<div><label style="font-size:11px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px">Hostel</label>'
      +'<select id="fmc-add-hostel" style="'+inputStyle+'"><option value="No">No</option><option value="Yes">Yes</option></select></div>'
      +'<div style="grid-column:1/-1"><label style="font-size:11px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px">Course * <span style="color:#dc2626">(mandatory)</span></label>'
      +'<select id="fmc-add-subtype" style="'+inputStyle+';border-color:#1433a8">'+stOpts+'</select></div>'
      +'</div>'
      +'<input type="hidden" id="fmc-add-stu" value="'+esc(selId)+'">'
      +'<input type="hidden" id="fmc-add-name" value="'+esc(selStu.name||'')+'">'
      +'<input type="hidden" id="fmc-add-roll" value="'+esc(selStu.roll||'')+'">'
      +'<input type="hidden" id="fmc-add-date" value="'+new Date().toISOString().split('T')[0]+'">'
      +'<input type="hidden" id="fmc-add-admno" value="">'
      +'<div style="display:flex;gap:8px">'
      +'<button class="btn btn-primary" onclick="gnsiSaveFMCAddStudent()">✅ Add to Fee System</button>'
      +'<button class="btn btn-outline" onclick="_fmc._showAddForm=false;window._fmcAddSearch=\'\';window._fmcAddSelId=\'\';render()">Cancel</button>'
      +'</div>'
      +'</div>'
    : (q.length === 0
        ? '<div style="background:#f8faff;border:1.5px dashed var(--border);border-radius:9px;padding:16px;text-align:center;color:var(--muted);font-size:12.5px">🔍 Search and select a student above to continue</div>'
        : ''
      )
    )
    +'</div>';
}
function gnsiPickFMCStudent(stuId){
  window._fmcAddSelId = String(stuId);
  window._fmcAddSearch = '';
  /* Auto-fill class from student register */
  var s = (typeof students!=='undefined') ? students.find(function(x){return String(x.id)===String(stuId);}) : null;
  render();
  /* After render, auto-set class and try to auto-fill course from bridge */
  setTimeout(function(){
    if(s && s.cls){
      var cls = document.getElementById('fmc-add-class');
      if(cls) { cls.value = s.cls; fmcBridgeAutoFillOnClassChange(s.cls); }
    }
    var hostel = document.getElementById('fmc-add-hostel');
    if(hostel && s && s.hostel) hostel.value = s.hostel;
  }, 30);
}
function gnsiClearFMCPick(){
  window._fmcAddSelId = '';
  window._fmcAddSearch = '';
  render();
}
function gnsiPrefillFMCForm(stuId){
  if(!stuId||typeof students==='undefined') return;
  var s=students.find(function(x){return String(x.id)===String(stuId);}); if(!s) return;
  var n=document.getElementById('fmc-add-name'); if(n) n.value=s.name||'';
  var r=document.getElementById('fmc-add-roll'); if(r) r.value=s.roll||'';
  var c=document.getElementById('fmc-add-class'); if(c&&s.cls) c.value=s.cls;
  if(typeof stuLoadExtra==='function'){var ex=stuLoadExtra(s.id); var an=document.getElementById('fmc-add-admno'); if(an&&ex.admNo) an.value=ex.admNo;}
  if(typeof gnsiLoadClassBridge==='function'){var bridge=gnsiLoadClassBridge(); if(s.cls&&bridge[s.cls]){var sel=document.getElementById('fmc-add-subtype');if(sel)sel.value=bridge[s.cls];}}
}
function gnsiSaveFMCAddStudent(){
  var name=((document.getElementById('fmc-add-name')||{}).value||'').trim();
  var roll=((document.getElementById('fmc-add-roll')||{}).value||'').trim();
  var admNo=((document.getElementById('fmc-add-admno')||{}).value||'').trim();
  var cls=((document.getElementById('fmc-add-class')||{}).value||'').trim();
  var dt=((document.getElementById('fmc-add-date')||{}).value||'').trim()||new Date().toISOString().split('T')[0];
  var hostel=((document.getElementById('fmc-add-hostel')||{}).value||'No');
  var subtype=((document.getElementById('fmc-add-subtype')||{}).value||'').trim();
  var remark=((document.getElementById('fmc-add-remark')||{}).value||'').trim();
  var stuSel=((document.getElementById('fmc-add-stu')||{}).value||'').trim();
  if(!name){alert('Enter student name.');return;}
  if(!cls){if(typeof showToast==='function')showToast('\u26a0\ufe0f Please select a Class.','#ea580c');else alert('Select a class.');return;}
  if(!subtype){if(typeof showToast==='function')showToast('\u26a0\ufe0f Please select a Course \u2014 it is required.','#ea580c');else alert('Select a course.');return;}
  var asgns=_fmcLoadAsgns();
  if(asgns.find(function(a){return (a.studentName||a.name||'').toLowerCase()===name.toLowerCase()&&a.className===cls;})){alert('Already in fee system for this class.');return;}
  var entry={id:'sfa_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),stuId:stuSel||null,studentName:name,rollNo:roll,admNo:admNo,className:cls,hostel:hostel,enrolledAt:dt,remark:remark,subTypeId:subtype||null,courseAssignedAt:subtype?dt:null,courseAssignedBy:subtype?((typeof currentUser!=='undefined'&&currentUser)?currentUser.name:'Admin'):null,createdBy:(typeof currentUser!=='undefined'&&currentUser)?currentUser.name:'Admin',createdAt:new Date().toISOString()};
  asgns.push(entry);
  _fmcSaveAsgns(asgns);
  if(subtype&&typeof gnsiLoadCourseData==='function'){var data=gnsiLoadCourseData();if(!data[subtype])data[subtype]=[];data[subtype].push({id:'sfa_'+entry.id,stuId:stuSel||entry.id,name:name,roll:roll,admNo:admNo,remark:remark,feeStatus:'Pending',addedBy:entry.createdBy,addedAt:dt});if(typeof gnsiSaveCourseData==='function')gnsiSaveCourseData(data);}
  gnsiActivity('Fee Assignment Added', name+' ('+cls+')', 'fees');
  if(typeof acLog==='function') acLog('Fee Assignment Added',name+' ('+cls+')');
  if(typeof showToast==='function') showToast(name+' added to fee system ✅','#16a34a');
  _fmc._showAddForm=false; _fmc.tab='assignment'; render();
}
/* Alias so existing code that calls gnsiLoadClassBridge() still works */
function gnsiLoadClassBridge(){ return _fmcLoadBridge(); }
/* Called when admin picks a class in the Add Student form -- auto-fills course from bridge */
function fmcBridgeAutoFillOnClassChange(className){
  if(!className) return;
  var mapped = gnsiClassToCourse(className);
  if(!mapped) return;
  /* Mixed mode: class has per-student courses -- skip auto-fill, just notify */
  if(mapped === '__mixed__'){
    if(typeof showToast==='function') showToast('🔀 '+className+' is Mixed/Per-Student — please select the course manually','#0891b2');
    return;
  }
  var sel = document.getElementById('fmc-add-subtype');
  if(!sel) return;
  var opts = Array.from(sel.options);
  var match = opts.find(function(o){ return o.text.toLowerCase().indexOf(mapped.toLowerCase())>=0; });
  if(match){
    sel.value = match.value;
    if(typeof showToast==='function') showToast('💡 Course auto-filled from Class Bridge: '+mapped,'#1433a8');
  }
}
function gnsiDeleteFMCAsgn(id){
  if(!confirm('Remove this student from the fee assignment system? Payment records will be kept.')) return;
  var asgns=_fmcLoadAsgns().filter(function(a){return a.id!==id;});
  _fmcSaveAsgns(asgns);
  if(typeof showToast==='function') showToast('Student removed','#c0291d');
  render();
}
function gnsiOpenAssignCourseModal(id){ _fmc._courseModalId=id; render(); }
function _fmcRenderCourseModal(asgnId, asgns){
  var a=asgns.find(function(x){return x.id===asgnId;}); if(!a) return '';
  var stOpts='<option value="">-- Select Course Sub-Type --</option>';
  if(typeof GNSI_COURSES!=='undefined') GNSI_COURSES.forEach(function(c){c.subTypes.forEach(function(st){stOpts+='<option value="'+st.id+'">'+c.icon+' '+c.name+' -- '+st.icon+' '+st.label+'</option>';});});
  return '<div style="position:fixed;inset:0;background:rgba(10,18,41,0.55);z-index:9999;display:flex;align-items:center;justify-content:center">'
    +'<div style="background:var(--surface);border-radius:16px;padding:28px 32px;width:100%;max-width:440px;box-shadow:var(--shadow-lg)">'
    +'<div style="font-size:17px;font-weight:800;margin-bottom:4px">🎓 Assign Course</div>'
    +'<div style="font-size:13px;color:var(--muted);margin-bottom:16px">Student: <b>'+esc(a.studentName||a.name||'(Unknown)')+'</b> · Class: '+esc(a.className||'--')+'</div>'
    +'<div style="background:#fef9c3;border:1px solid #fde047;border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:12.5px;color:#854d0e">ℹ️ From month 3 onwards, fee = <b>Flat + Course fee</b>. First 2 months remain flat fee.</div>'
    +'<div class="form-group" style="margin-bottom:14px"><label>Course Sub-Type *</label><select id="fmc-modal-subtype" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:8px 12px;font-size:13px;background:var(--surface);color:var(--text)">'+stOpts+'</select></div>'
    +'<div class="form-group" style="margin-bottom:18px"><label>Assignment Date</label><input type="date" id="fmc-modal-date" value="'+new Date().toISOString().split('T')[0]+'" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:8px 12px;font-size:13px;background:var(--surface);color:var(--text)"/></div>'
    +'<div style="display:flex;gap:10px">'
    +'<button class="btn btn-primary" onclick="gnsiSaveFMCCourseAssign(\''+asgnId+'\')">✅ Save Assignment</button>'
    +'<button class="btn btn-outline" onclick="_fmc._courseModalId=null;render()">Cancel</button>'
    +'</div></div></div>';
}
function gnsiSaveFMCCourseAssign(asgnId){
  var st=(document.getElementById('fmc-modal-subtype')||{}).value||'';
  var dt=(document.getElementById('fmc-modal-date')||{}).value||new Date().toISOString().split('T')[0];
  if(!st){alert('Select a course sub-type.');return;}
  var asgns=_fmcLoadAsgns(); var a=asgns.find(function(x){return x.id===asgnId;});
  if(!a){alert('Assignment not found.');return;}
  a.subTypeId=st; a.courseAssignedAt=dt; a.courseAssignedBy=(typeof currentUser!=='undefined'&&currentUser)?currentUser.name:'Admin';
  _fmcSaveAsgns(asgns);
  if(typeof gnsiLoadCourseData==='function'&&typeof gnsiSaveCourseData==='function'){var data=gnsiLoadCourseData();if(!data[st])data[st]=[];var already=data[st].find(function(e){return String(e.stuId)===String(a.stuId||a.id);});if(!already){data[st].push({id:'sfa_'+a.id,stuId:a.stuId||a.id,name:a.studentName||a.name||'',roll:a.rollNo||'',admNo:a.admNo||'',remark:'Auto-assigned',feeStatus:'Pending',addedBy:a.courseAssignedBy,addedAt:dt});gnsiSaveCourseData(data);}}
  _fmc._courseModalId=null;
  gnsiActivity('Course Assigned', (a.studentName||a.name||'')+' → '+st, 'fees');
  if(typeof acLog==='function') acLog('Course Assigned',(a.studentName||a.name||'')+' → '+st);
  if(typeof showToast==='function') showToast('Course assigned ✅','#15803d');
  render();
}
/* ============ TAB: DUES ============ */
function _fmcRenderDues(){
  var asgns=_fmcLoadAsgns(); var cols=_fmcLoadCols();
  var classNames=typeof getClassNames==='function'?getClassNames():[];
  var clsOpts='<option value="all">All Classes</option>'+classNames.map(function(c){return'<option value="'+esc(c)+'"'+(_fmc.filterClass===c?' selected':'')+'>'+esc(c)+'</option>';}).join('');
  var rows=asgns.map(function(a){
    var mn=_fmcMonthsSince(a.enrolledAt); var exp=0; for(var i=1;i<=mn;i++) exp+=_fmcCalcFee(a,i).total;
    /* FIX #4: deduct scholarship (same as _fmcKPI) so dues table matches KPI strip */
    var schlDed = (typeof _gnsiGetScholarshipDeduction==='function') ? _gnsiGetScholarshipDeduction(a.stuId)*mn : 0;
    exp = Math.max(0, exp - schlDed);
    var paid=cols.filter(function(c){return c.asgnId===a.id;}).reduce(function(s,c){return s+(parseInt(c.amountPaid)||0);},0);
    return {a:a,exp:exp,paid:paid,due:Math.max(0,exp-paid),mn:mn,schlDed:schlDed};
  }).filter(function(r){
    var matchC=_fmc.filterClass==='all'||r.a.className===_fmc.filterClass;
    return matchC;
  }).sort(function(a,b){return b.due-a.due;});
  var totalDue=rows.reduce(function(s,r){return s+r.due;},0);
  var defaulters=rows.filter(function(r){return r.due>0;}).length;
  var html='<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:14px">'
    +'<select onchange="_fmc.filterClass=this.value;render()" style="border:1.5px solid var(--border);border-radius:8px;padding:7px 10px;font-size:12px;background:var(--surface);color:var(--text)">'+clsOpts+'</select>'
    +'<button onclick="gnsiExportDues()" class="btn btn-outline" style="font-size:12px">⬇️ Export CSV</button>'
    +'<div style="margin-left:auto;display:flex;gap:12px">'
    +'<div style="text-align:right"><div style="font-size:11px;color:var(--muted)">Defaulters</div><div style="font-weight:800;color:#c0291d;font-size:18px">'+defaulters+'</div></div>'
    +'<div style="text-align:right"><div style="font-size:11px;color:var(--muted)">Total Due</div><div style="font-weight:800;color:#c0291d;font-size:18px">₹'+totalDue.toLocaleString('en-IN')+'</div></div>'
    +'</div></div>';
  var hasSchol = rows.some(function(r){return r.schlDed>0;});
  html+='<div class="card"><div style="overflow-x:auto"><table><thead><tr>'
    +'<th>Student</th><th>Class</th><th>Months</th><th>Expected</th>'
    +(hasSchol?'<th>Scholarship</th>':'')
    +'<th>Paid</th><th>Due</th><th>Status</th><th>Action</th>'
    +'</tr></thead><tbody>';
  rows.forEach(function(r){
    var a=r.a;
    html+='<tr style="'+(r.due>0?'background:#fff5f5;':'')+'">'
      +'<td><div style="font-weight:700">'+esc(a.studentName||a.name||'(Unknown)')+'</div>'+(a.rollNo?'<div style="font-size:11px;color:var(--muted)">#'+esc(a.rollNo)+'</div>':'')+'</td>'
      +'<td>'+esc(a.className||'--')+'</td>'
      +'<td style="text-align:center">'+r.mn+'</td>'
      +'<td style="font-weight:700">₹'+r.exp.toLocaleString('en-IN')+'</td>'
      +(hasSchol?'<td style="font-size:12px;color:#7c3aed;font-weight:600">'+(r.schlDed>0?'−₹'+Math.round(r.schlDed).toLocaleString('en-IN'):'--')+'</td>':'')
      +'<td style="font-weight:700;color:#15803d">₹'+r.paid.toLocaleString('en-IN')+'</td>'
      +'<td style="font-weight:800;color:'+(r.due>0?'#c0291d':'#15803d')+'">₹'+r.due.toLocaleString('en-IN')+'</td>'
      +'<td>'+(r.due>0?'<span style="background:#fee2e2;color:#dc2626;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:700">⚠ Due</span>':'<span style="background:#dcfce7;color:#15803d;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:700">✅ Clear</span>')+'</td>'
      +'<td>'+(r.due>0?'<button onclick="gnsiSetFMCTab(\'counter\');_fmc.asgnId=\''+parseInt(a.id,10)+'\';render()" style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;border-radius:6px;padding:3px 8px;cursor:pointer;font-size:11px;font-weight:700">💰 Collect</button>':'--')+'</td>'
      +'</tr>';
  });
  if(!rows.length) html+='<tr><td colspan="'+(8+(hasSchol?1:0))+'" style="text-align:center;padding:24px;color:var(--muted)">No students in fee system.</td></tr>';
  html+='</tbody></table></div></div>';
  return html;
}
function gnsiExportDues(){
  showToast('⏳ Preparing Dues CSV…','#2563eb');

  var asgns=_fmcLoadAsgns(); var cols=_fmcLoadCols();
  var csv='Student,Class,Roll,Enrolled,Months,Expected,Paid,Due\n';
  asgns.forEach(function(a){
    var mn=_fmcMonthsSince(a.enrolledAt); var exp=0; for(var i=1;i<=mn;i++) exp+=_fmcCalcFee(a,i).total;
    var paid=cols.filter(function(c){return c.asgnId===a.id;}).reduce(function(s,c){return s+(parseInt(c.amountPaid)||0);},0);
    var due=Math.max(0,exp-paid);
    csv+='"'+(a.studentName||a.name||'')+'","'+esc(a.className||'')+'","'+esc(a.rollNo||'')+'","'+esc(a.enrolledAt||'')+'",'+mn+','+exp+','+paid+','+due+'\n';
  });
  var blob=new Blob([csv],{type:'text/csv'});
  var url=URL.createObjectURL(blob);
  var link=document.createElement('a'); link.href=url; link.download='GNSI_Fee_Dues_'+new Date().toISOString().split('T')[0]+'.csv';
  document.body.appendChild(link); showToast('✅ Dues CSV ready','#16a34a');
  link.click(); document.body.removeChild(link);
}
/* ============ TAB: RECEIPTS ============ */
function _fmcRenderReceipts(isAdmin){
  var cols=_fmcLoadCols(); var asgns=_fmcLoadAsgns();
  /* Print single receipt */
  if(_fmc.receiptId){
    var col=cols.find(function(c){return c.id===_fmc.receiptId;});
    if(col){ var a=asgns.find(function(x){return x.id===col.asgnId;}); return _fmcRenderReceiptPrint(col,a); }
  }
  var q=(_fmc.search||'').toLowerCase();
  var clsOpts='<option value="all">All Classes</option>';
  (typeof getClassNames==='function'?getClassNames():[]).forEach(function(c){clsOpts+='<option value="'+esc(c)+'"'+(_fmc.filterClass===c?' selected':'')+'>'+esc(c)+'</option>';});
  var modeOpts='<option value="all">All Modes</option><option>Cash</option><option>UPI</option><option>Bank Transfer</option><option>Cheque</option><option>DD</option><option>Online Gateway</option><option>Manual</option>';
  var filtered=cols.filter(function(c){
    var matchQ=!q||(c.studentName||'').toLowerCase().indexOf(q)>=0||(c.receiptNo||'').toLowerCase().indexOf(q)>=0||(c.forMonth||'').toLowerCase().indexOf(q)>=0;
    var matchC=_fmc.filterClass==='all'||c.className===_fmc.filterClass;
    var matchM=_fmc.filterMode==='all'||(c.payMode||'')=== _fmc.filterMode;
    return matchQ&&matchC&&matchM;
  }).slice().reverse();
  var html='<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:14px">'
    +'<input placeholder="🔍 Search receipt, name, month…" value="'+esc(_fmc.search)+'" oninput="_fmc.search=this.value;_debouncedRenderFmc()" style="border:1.5px solid var(--border);border-radius:8px;padding:7px 12px;font-size:13px;background:var(--surface);color:var(--text);font-family:\'DM Sans\',sans-serif;flex:1;min-width:180px"/>'
    +'<select onchange="_fmc.filterClass=this.value;render()" style="border:1.5px solid var(--border);border-radius:8px;padding:7px 10px;font-size:12px;background:var(--surface);color:var(--text)">'+clsOpts+'</select>'
    +'<select onchange="_fmc.filterMode=this.value;render()" style="border:1.5px solid var(--border);border-radius:8px;padding:7px 10px;font-size:12px;background:var(--surface);color:var(--text)">'+modeOpts+'</select>'
    +'<button onclick="gnsiExportReceipts()" class="btn btn-outline" style="font-size:12px">⬇️ Export CSV</button>'
    +'</div>';
  html+='<div class="card"><div style="overflow-x:auto"><table><thead><tr><th>Receipt No.</th><th>Student</th><th>Class</th><th>For / Description</th><th>Type</th><th>Amount</th><th>Mode</th><th>Date</th><th>Actions</th></tr></thead><tbody>';
  if(!filtered.length){
    html+='<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--muted)">No receipts found.</td></tr>';
  } else {
    filtered.forEach(function(c){
      var typeColors={monthly:'#1433a8',fullpay:'#7c3aed',admission:'#15803d',advance:'#d97706',item:'#0891b2',manual:'#475569'};
      var tc=typeColors[c.feeType]||'#6474a0';
      html+='<tr>'
        +'<td style="font-family:\'JetBrains Mono\',monospace;font-weight:700;font-size:12px">'+esc(c.receiptNo||'--')+'</td>'
        +'<td style="font-weight:700">'+esc(c.studentName)+'</td>'
        +'<td>'+esc(c.className||'--')+'</td>'
        +'<td>'+esc(c.forMonth||c.description||'--')+'</td>'
        +'<td><span style="background:'+tc+'18;color:'+tc+';border-radius:6px;padding:2px 8px;font-size:11px;font-weight:700">'+esc(c.feeType||'fee')+'</span></td>'
        +'<td style="font-weight:800;color:#15803d">₹'+parseInt(c.amountPaid).toLocaleString('en-IN')+'</td>'
        +'<td><span style="background:#e0e8f9;color:#1433a8;border-radius:6px;padding:2px 8px;font-size:11px;font-weight:700">'+esc(c.payMode||'Cash')+'</span></td>'
        +'<td style="font-size:12px;color:var(--muted)">'+(c.payDate?new Date(c.payDate).toLocaleDateString('en-IN'):'--')+'</td>'
        +'<td><button onclick="gnsiSetFMCReceipt(\''+c.id+'\')" style="background:#fef9c3;color:#854d0e;border:1px solid #fde047;border-radius:6px;padding:3px 8px;cursor:pointer;font-size:11px;font-weight:700">🖨️ Print</button>'
        +(isAdmin?'<button onclick="gnsiDeleteFMCCol(\''+c.id+'\')" style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;border-radius:6px;padding:3px 8px;cursor:pointer;font-size:11px;font-weight:700;margin-left:4px">✕</button>':'')
        +'</td></tr>';
    });
  }
  html+='</tbody></table></div></div>';
  return html;
}
function gnsiDeleteFMCCol(id){
  if(!confirm('Delete this fee record? This cannot be undone.')) return;
  var cols=_fmcLoadCols().filter(function(c){return c.id!==id;});
  _fmcSaveCols(cols);
  if(typeof showToast==='function') showToast('Record deleted','#c0291d');
  render();
}
function gnsiExportReceipts(){
  showToast('⏳ Preparing Receipts CSV…','#2563eb');

  var cols=_fmcLoadCols().slice().reverse();
  var csv='Receipt No.,Student,Class,For/Desc,Type,Amount,Mode,Ref,Date,Collected By\n';
  cols.forEach(function(c){
    csv+='"'+(c.receiptNo||'')+'","'+(c.studentName||'')+'","'+(c.className||'')+'","'+(c.forMonth||c.description||'')+'","'+(c.feeType||'')+'",'+parseInt(c.amountPaid)+',"'+(c.payMode||'')+'","'+(c.txnRef||'')+'","'+(c.payDate||'')+'","'+(c.collectedBy||'')+'"\n';
  });
  var blob=new Blob([csv],{type:'text/csv'});
  var url=URL.createObjectURL(blob);
  var link=document.createElement('a'); link.href=url; link.download='GNSI_Receipts_'+new Date().toISOString().split('T')[0]+'.csv';
  document.body.appendChild(link); showToast('✅ Receipts CSV ready','#16a34a');
  link.click(); document.body.removeChild(link);
}
function _fmcRenderReceiptPrint(col, a){
  /* Legacy path – now just shows a print button that opens the popup */
  return '<div style="display:flex;gap:10px;margin-bottom:14px">'
    +'<button onclick="_fmc.receiptId=null;render()" class="btn btn-outline">← Back</button>'
    +'<button onclick="gnsiPrintFMCReceiptPopup(\''+col.id+'\')" class="btn btn-primary">🖨️ Print Receipt (A4)</button>'
    +'</div>'
    +'<div style="max-width:620px;margin:0 auto;background:var(--surface);border:1.5px solid var(--border);border-radius:12px;padding:24px;text-align:center;color:var(--muted);font-size:14px">'
    +'<div style="font-size:40px;margin-bottom:12px">🖨️</div>'
    +'<b style="color:var(--text)">Receipt ready to print</b><br><br>'
    +'Click <b>Print Receipt (A4)</b> above to open a print-ready popup window.<br>'
    +'It will print <b>two half-page copies</b> on one A4 sheet — one for staff, one for parent.'
    +'</div>';
}
function _fmcBuildReceiptHTML(col, a){
  /* Builds ONE receipt half-copy as an HTML string */
  var now=new Date().toLocaleDateString('en-IN',{year:'numeric',month:'long',day:'numeric'});
  var isPhase2=a&&a.subTypeId&&a.courseAssignedAt;
  var typeLabels={monthly:'Monthly Fee',fullpay:'Full Payment',admission:'Admission Fee',advance:'Advance Fee',item:'Item Fee',manual:'Fee Receipt'};
  var label=typeLabels[col.feeType]||'Fee Receipt';
  var courseLine=isPhase2&&a&&a.subTypeId?'<tr><td class="lbl">Course</td><td>'+_fmcSafeText(a.subTypeId)+'</td></tr>':'';
  var remarksLine=col.remark?'<tr><td class="lbl">Remarks</td><td>'+_fmcSafeText(col.remark)+'</td></tr>':'';
  return ''
    +'<div class="receipt">'
    +'<div class="rhead">'
    +'<div class="school-name">'+(window.TENANT?window.TENANT.name:'Guidance Navodaya &amp; Sainik Institute')+'</div>'
    +'<div class="school-sub">'+(window.TENANT?window.TENANT.address+' · Est. '+window.TENANT.established:'Khangabok, Thoubal, Manipur · Est. 2016')+'</div>'
    +'<div class="doc-type">'+_fmcSafeText(label)+'</div>'
    +'<div class="meta-row">'
    +'<span>Receipt No: <b class="rcpt-no">'+_fmcSafeText(col.receiptNo||'--')+'</b></span>'
    +'<span>Date: <b>'+now+'</b></span>'
    +'</div>'
    +'</div>'
    +'<table class="rtable">'
    +'<tr><td class="lbl">Student Name</td><td class="val-b">'+_fmcSafeText(col.studentName)+'</td></tr>'
    +'<tr><td class="lbl">Adm. No.</td><td>'+_fmcSafeText(col.admNo||(a&&a.admNo)||'--')+'</td></tr>'
    +'<tr><td class="lbl">Roll / GCC No.</td><td>'+_fmcSafeText(col.rollNo||(a&&a.rollNo)||'--')+'</td></tr>'
    +'<tr><td class="lbl">Class</td><td>'+_fmcSafeText(col.className||'--')+'</td></tr>'
    +courseLine
    +'<tr><td class="lbl">For / Period</td><td class="val-b">'+_fmcSafeText(col.forMonth||col.description||'--')+'</td></tr>'
    +'<tr><td class="lbl">Payment Mode</td><td>'+_fmcSafeText(col.payMode||'Cash')+(col.txnRef?' · Ref: '+_fmcSafeText(col.txnRef):'')+'</td></tr>'
    +remarksLine
    +'<tr class="amt-row"><td>Amount Paid</td><td class="amt">&#8377;'+parseInt(col.amountPaid).toLocaleString('en-IN')+'</td></tr>'
    +'</table>'
    +'<div class="rfooter">'
    +'<span>Collected by: <b>'+_fmcSafeText(col.collectedBy||'--')+'</b></span>'
    +'<span class="auth">GNSI — Authorised Receipt</span>'
    +'</div>'
    +'</div>';
}
function _fmcSafeText(s){
  if(s==null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function _fmcBuildReceiptPopupHTML(col, a){
  var copy=_fmcBuildReceiptHTML(col,a);
  return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">'
    +'<title>Fee Receipt — '+_fmcSafeText(col.receiptNo||col.studentName)+'</title>'
    +'<link rel="preconnect" href="https://fonts.googleapis.com">'
    +'<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;700&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet">'
    +'<style>'
    +'*{margin:0;padding:0;box-sizing:border-box}'
    +'body{background:#f0f4fb;font-family:"DM Sans",sans-serif;font-size:12px;color:#1a2040}'
    +'/* ── A4 page: two half-copies stacked ── */'
    +'@page{size:A4 portrait;margin:0}'
    +'@media print{'
    +'  body{background:#fff}'
    +'  .no-print{display:none!important}'
    +'  .page{width:210mm;min-height:297mm;padding:0;box-shadow:none;background:#fff}'
    +'  .half{height:148.5mm;padding:8mm 12mm;page-break-inside:avoid}'
    +'  .divider{border:none;border-top:1.5px dashed #8a9fd4;margin:0 12mm}'
    +'}'
    +'.page{width:210mm;min-height:297mm;margin:20px auto;background:#fff;box-shadow:0 4px 32px rgba(0,0,0,.18)}'
    +'.half{height:148.5mm;padding:8mm 12mm;display:flex;flex-direction:column;gap:7px;overflow:hidden}'
    +'.divider{border:none;border-top:1.5px dashed #8a9fd4;margin:0 12mm}'
    +'.copy-label{font-size:9px;font-weight:700;letter-spacing:.08em;color:#6474a0;text-align:right;margin-bottom:2px}'
    +'.receipt{display:flex;flex-direction:column;gap:6px;height:100%}'
    +'.rhead{border-bottom:1.5px solid #c7d7f5;padding-bottom:6px;margin-bottom:4px}'
    +'.school-name{font-family:"Playfair Display",serif;font-size:16px;font-weight:800;color:#1433a8;text-align:center;line-height:1.2}'
    +'.school-sub{font-size:9px;color:#6474a0;text-align:center;margin-top:2px}'
    +'.doc-type{font-size:11px;font-weight:700;color:#1433a8;text-align:center;margin-top:4px;text-transform:uppercase;letter-spacing:.06em}'
    +'.meta-row{display:flex;justify-content:space-between;font-size:10px;color:#6474a0;margin-top:5px}'
    +'.rcpt-no{color:#1433a8;font-family:"JetBrains Mono",monospace;font-size:11px}'
    +'.rtable{width:100%;border-collapse:collapse;font-size:11px}'
    +'.rtable tr:nth-child(even){background:#f0f4fb}'
    +'.rtable td{padding:4px 8px}'
    +'.lbl{color:#6474a0;width:38%}'
    +'.val-b{font-weight:700}'
    +'.amt-row{background:#e0e8f9!important}'
    +'.amt-row td{padding:6px 8px;font-weight:800;font-size:14px}'
    +'.amt{color:#15803d}'
    +'.rfooter{display:flex;justify-content:space-between;align-items:flex-end;font-size:10px;color:#6474a0;border-top:1px dashed #c7d7f5;padding-top:6px;margin-top:auto}'
    +'.auth{color:#1433a8;font-weight:700}'
    +'.sig-line{width:90px;border-top:1px solid #1433a8;text-align:center;font-size:9px;color:#6474a0;margin-top:18px;padding-top:3px}'
    +'/* toolbar */'
    +'.toolbar{width:210mm;margin:0 auto 10px;display:flex;gap:10px;padding:8px 12mm}'
    +'.toolbar button{padding:8px 18px;border:none;border-radius:8px;cursor:pointer;font-family:"DM Sans",sans-serif;font-weight:700;font-size:13px}'
    +'.btn-print{background:#1433a8;color:#fff}'
    +'.btn-close{background:#f0f4fb;color:#3d4f80;border:1px solid #c8d4ee!important}'
    +'</style></head><body>'
    +'<div class="no-print toolbar">'
    +'<button class="btn-print" onclick="window.print()">🖨️ Print (A4 — 2 copies)</button>'
    +'<button class="btn-close" onclick="window.close()">✕ Close</button>'
    +'</div>'
    +'<div class="page">'
    +' <div class="half"><div class="copy-label">OFFICE / STAFF COPY</div>'+copy+'</div>'
    +' <hr class="divider">'
    +' <div class="half"><div class="copy-label">PARENT / STUDENT COPY</div>'+copy+'</div>'
    +'</div>'
    +'</body></html>';
}
/* ============ TAB: ONLINE PAYMENTS ============ */
function _fmcRenderOnline(isAdmin, pc) {
  var txns=_fmcLoadTxns();
  var total=txns.filter(function(t){return t.status==='Success';}).reduce(function(s,t){return s+(parseFloat(t.amount)||0);},0);
  var pending=txns.filter(function(t){return t.status==='Pending';}).length;
  var failed=txns.filter(function(t){return t.status==='Failed';}).length;
  var gatewayBanner = pc.keyId
    ?'<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:14px 16px;margin-bottom:16px;font-size:13px;color:#166534">✅ <b>'+esc(pc.provider||'Razorpay')+'</b> configured · Key: <span style="font-family:monospace;font-size:11px">'+esc(pc.keyId.substring(0,12)+'…')+'</span></div>'
    :'<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 16px;margin-bottom:16px;font-size:13px;color:#92400e">⚠️ Gateway not configured. Go to <b>Config tab → Online Payment Gateway</b> to set up <b>Razorpay</b>.</div>';
  var html='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;margin-bottom:16px">'
    +'<div class="stat-card" style="--c:#15803d"><div class="stat-label">✅ Success Total</div><div class="stat-val">₹'+Math.round(total/1000)+'K</div></div>'
    +'<div class="stat-card" style="--c:#d97706"><div class="stat-label">⏳ Pending</div><div class="stat-val">'+pending+'</div></div>'
    +'<div class="stat-card" style="--c:#c0291d"><div class="stat-label">❌ Failed</div><div class="stat-val">'+failed+'</div></div>'
    +'<div class="stat-card" style="--c:#1433a8"><div class="stat-label">📋 Total Txns</div><div class="stat-val">'+txns.length+'</div></div>'
    +'</div>'
    +gatewayBanner;
  if(isAdmin){
    html+='<div style="display:flex;gap:8px;margin-bottom:14px">'
      +'<button onclick="gnsiSimFMCPayment()" class="btn btn-outline" style="font-size:12px">🧪 Simulate Test Payment</button>'
      +'<button onclick="gnsiExportTxns()" class="btn btn-outline" style="font-size:12px">⬇️ Export CSV</button>'
      +'</div>';
  }
  html+='<div class="card"><div class="card-head"><span class="card-title">📋 Transaction Log</span></div>'
    +'<div style="overflow-x:auto"><table><thead><tr><th>Txn ID</th><th>Name</th><th>Purpose</th><th>Amount</th><th>Status</th><th>Method</th><th>Time</th>'+(isAdmin?'<th>Action</th>':'')+'</tr></thead><tbody>';
  var recent=txns.slice().reverse().slice(0,50);
  if(!recent.length){
    html+='<tr><td colspan="'+(isAdmin?8:7)+'" style="text-align:center;color:var(--muted);padding:24px">No transactions recorded</td></tr>';
  } else {
    recent.forEach(function(t){
      var sc=t.status==='Success'?'#16a34a':t.status==='Failed'?'#dc2626':'#d4a853';
      html+='<tr>'
        +'<td style="font-family:\'JetBrains Mono\',monospace;font-size:11px">'+esc(t.txnId||'--')+'</td>'
        +'<td style="font-weight:700">'+esc(t.name||'--')+'</td>'
        +'<td>'+esc(t.purpose||'--')+'</td>'
        +'<td style="font-weight:700;color:#1433a8">₹'+Number(t.amount||0).toLocaleString('en-IN')+'</td>'
        +'<td><span style="color:'+sc+';font-weight:700;font-size:12px">'+esc(t.status||'Pending')+'</span></td>'
        +'<td style="font-size:12px">'+esc(t.method||'Gateway')+'</td>'
        +'<td style="font-size:12px;color:var(--muted)">'+esc(t.ts||'--')+'</td>'
        +(isAdmin?'<td><button onclick="gnsiVerifyFMCTxn(\''+t.txnId+'\')" style="background:#e0e8f9;color:#1433a8;border:1px solid #c7d7f5;border-radius:6px;padding:3px 8px;cursor:pointer;font-size:11px;font-weight:700">Verify</button></td>':'')
        +'</tr>';
    });
  }
  html+='</tbody></table></div></div>';
  return html;
}
function gnsiSimFMCPayment(){
  var name=prompt('Student/Parent name:','Test Student'); if(!name) return;
  var amt=parseFloat(prompt('Amount (₹):','1000')||'0'); if(!amt) return;
  var purpose=prompt('Purpose:','Monthly Fee')||'Fee Payment';
  var txns=_fmcLoadTxns();
  var txnId='TXN'+Date.now().toString().slice(-8);
  txns.push({txnId:txnId,name:name,amount:amt,purpose:purpose,status:'Success',ts:new Date().toLocaleString('en-IN'),method:'Simulated'});
  _fmcSaveTxns(txns);
  if(typeof showToast==='function') showToast('Test payment recorded: '+txnId,'#16a34a');
  render();
}
function gnsiVerifyFMCTxn(txnId){
  var txns=_fmcLoadTxns();
  var t=txns.find(function(x){return x.txnId===txnId;});
  if(!t){showToast('Transaction not found','#c0291d');return;}
  var newStatus=prompt('Update status for '+txnId+':\nCurrent: '+t.status+'\n\nEnter: Success / Failed / Pending',t.status);
  if(!newStatus||['Success','Failed','Pending'].indexOf(newStatus)<0){alert('Invalid status. Use: Success, Failed, or Pending');return;}
  t.status=newStatus; t.verifiedBy=(typeof currentUser!=='undefined'&&currentUser)?currentUser.name:'Admin'; t.verifiedAt=new Date().toISOString();
  _fmcSaveTxns(txns);
  if(typeof showToast==='function') showToast('Txn '+txnId+' → '+newStatus,'#15803d');
  render();
}
function gnsiExportTxns(){
  showToast('⏳ Preparing Transactions CSV…','#2563eb');

  var txns=_fmcLoadTxns().slice().reverse();
  var csv='Txn ID,Name,Purpose,Amount,Status,Method,Time\n';
  txns.forEach(function(t){csv+='"'+(t.txnId||'')+'","'+(t.name||'')+'","'+(t.purpose||'')+'",'+Number(t.amount||0)+',"'+(t.status||'')+'","'+(t.method||'')+'","'+(t.ts||'')+'"\n';});
  var blob=new Blob([csv],{type:'text/csv'});
  var url=URL.createObjectURL(blob);
  var link=document.createElement('a'); link.href=url; link.download='GNSI_Online_Txns_'+new Date().toISOString().split('T')[0]+'.csv'; document.body.appendChild(link); showToast('✅ Transactions CSV ready','#16a34a');
  link.click(); document.body.removeChild(link);
}
/* ============ TAB: CONFIG ============ */
/* ============ TAB: CLASS BRIDGE ============
   Maps each active Class/Batch → Course type (fee tier).
   Stored cloud-synced in gnsi_class_bridge via gnsiKVPush.
   Used across Assignments, Counter, and Dues for auto-filling
   the correct fee tier when a student's class is selected.
=========================================== */
/* ── BATCH→FEE COURSE mapping (matched to CSV: BATCH column values) ── */
var _FMC_COURSES = [
  'Achiever', 'Leader', 'Champion',
  'Lakshya', 'Umeed',
  'Elite', 'Prime'
];
/* Fee summary badges per batch -- colour matches CLASS_DEFAULTS */
var _FMC_COURSE_BADGES = {
  'Achiever': {color:'#8b5cf6', label:'Combined'},
  'Leader':   {color:'#1a6b55', label:'Sainik'},
  'Champion': {color:'#0891b2', label:'Sainik'},
  'Lakshya':  {color:'#3b78c9', label:'Navodaya'},
  'Umeed':    {color:'#0e7490', label:'Navodaya'},
  'Elite':    {color:'#d4a853', label:'Foundation'},
  'Prime':    {color:'#dc2626', label:'Foundation'},
  '__mixed__':{color:'#0891b2', label:'Per-Student'}
};
/* -- GNSI_COURSES: canonical course + subtype list used across the portal --
   Each course has subTypes that carry the fee-assignment subTypeId value.
   The id values must match the prefix pattern used in gnsiGetStudentCourseInfo. -- */
var GNSI_COURSES = (function(){
  var cfg = (typeof FS_FEE_CONFIG !== 'undefined') ? FS_FEE_CONFIG : null;
  if(cfg && cfg.courses && cfg.courses.length) {
    return cfg.courses.map(function(c){
      return {
        id:   c.id,
        name: c.name,
        icon: c.icon || '📚',
        subTypes: [
          { id: c.id+'_boarder',    label: 'Boarder',     icon: '🏠', monthlyFee: c.monthlyFees ? (c.monthlyFees['boarder']    || 0) : 0 },
          { id: c.id+'_dayscholar', label: 'Day Scholar',  icon: '🚌', monthlyFee: c.monthlyFees ? (c.monthlyFees['dayscholar']  || 0) : 0 },
          { id: c.id+'_dayboarder', label: 'Day Boarder',  icon: '🔄', monthlyFee: c.monthlyFees ? (c.monthlyFees['dayboarder']  || 0) : 0 }
        ]
      };
    });
  }
  /* Fallback defaults matching GNSI's four courses (CSV: COMBINED/SAINIK/NAVODAYA/FOUNDATION) */
  return [
    { id:'combined',   name:'Combined',   icon:'🔗',  subTypes:[
        { id:'combined_boarder',    label:'Boarder',    icon:'🏠', monthlyFee:15000 },
        { id:'combined_dayscholar', label:'Day Scholar', icon:'🚌', monthlyFee:10000 },
        { id:'combined_dayboarder', label:'Day Boarder', icon:'🔄', monthlyFee:12500 }
    ]},
    { id:'sainik',     name:'Sainik',     icon:'⚔️',  subTypes:[
        { id:'sainik_boarder',    label:'Boarder',    icon:'🏠', monthlyFee:17000 },
        { id:'sainik_dayscholar', label:'Day Scholar', icon:'🚌', monthlyFee:12000 },
        { id:'sainik_dayboarder', label:'Day Boarder', icon:'🔄', monthlyFee:14500 }
    ]},
    { id:'navodaya',   name:'Navodaya',   icon:'📚',  subTypes:[
        { id:'navodaya_boarder',    label:'Boarder',    icon:'🏠', monthlyFee:15000 },
        { id:'navodaya_dayscholar', label:'Day Scholar', icon:'🚌', monthlyFee:10000 },
        { id:'navodaya_dayboarder', label:'Day Boarder', icon:'🔄', monthlyFee:12500 }
    ]},
    { id:'foundation', name:'Foundation', icon:'🌱',  subTypes:[
        { id:'foundation_boarder',    label:'Boarder',    icon:'🏠', monthlyFee:12000 },
        { id:'foundation_dayscholar', label:'Day Scholar', icon:'🚌', monthlyFee:8000  },
        { id:'foundation_dayboarder', label:'Day Boarder', icon:'🔄', monthlyFee:10000 }
    ]}
  ];
}());
function _fmcLoadBridge(){
  var raw = typeof gnsiLoad==='function' ? gnsiLoad('gnsi_class_bridge') : null;
  if(!raw){try{raw=JSON.parse(localStorage.getItem('gnsi_class_bridge'));}catch(e){}}
  return raw && typeof raw==='object' && !Array.isArray(raw) ? raw : {};
}
function _fmcSaveBridge(map){
  if(typeof gnsiKVPush==='function') gnsiKVPush('gnsi_class_bridge', map);
  else { try{localStorage.setItem('gnsi_class_bridge', JSON.stringify(map));if(typeof gnsiKVPush==='function')gnsiKVPush('gnsi_class_bridge',map);}catch(e){} }
}
/* ── AUTO-SEED bridge: maps each batch to its course on first load ──
   This runs once when the bridge is empty, so admins don't have to
   manually configure every batch→course link after CSV import.      */
(function _gnsiAutoSeedBridge(){
  try {
    var existing = _fmcLoadBridge();
    var classes  = (typeof loadClasses==='function') ? loadClasses() : (typeof CLASS_DEFAULTS!=='undefined' ? CLASS_DEFAULTS : []);
    /* Only seed if bridge is completely empty */
    if(Object.keys(existing).length > 0) return;
    var BATCH_TO_COURSE = {
      'achiever':'Achiever', 'leader':'Leader', 'champion':'Champion',
      'lakshya':'Lakshya',   'umeed':'Umeed',
      'elite':'Elite',       'prime':'Prime'
    };
    var seeded = {};
    classes.forEach(function(c){
      var bKey = (c.name||'').toLowerCase().trim();
      var mapped = BATCH_TO_COURSE[bKey];
      if(mapped) seeded[c.name] = mapped;
    });
    if(Object.keys(seeded).length > 0) {
      _fmcSaveBridge(seeded);
      console.log('[GNSI] Auto-seeded class→course bridge:', seeded);
    }
  } catch(e) { console.warn('[GNSI] Bridge seed failed:', e); }
})();
/* Public helper -- returns the mapped course name for a class, or ''
   Returns '__mixed__' for classes where students have per-student courses */
function gnsiClassToCourse(className){
  var bridge = _fmcLoadBridge();
  return bridge[className] || '';
}
/* Returns true if a class is set to Mixed/Per-Student mode */
function gnsiClassIsMixed(className){
  var bridge = _fmcLoadBridge();
  return bridge[className] === '__mixed__';
}
function _fmcRenderClassBridge(isFeeAdmin){
  var classes   = (typeof loadClasses==='function' ? loadClasses() : []).filter(function(c){return c.active;});
  var bridge    = _fmcLoadBridge();
  /* Mixed-mode classes are intentionally configured — don't count as unmapped */
  var unmapped  = classes.filter(function(c){ var v=bridge[c.name]; return !v || v===''; }).length;
  var mixed     = classes.filter(function(c){ return bridge[c.name]==='__mixed__'; }).length;
  var statusBar = unmapped > 0
    ? '<div style="display:flex;align-items:center;gap:8px;padding:10px 16px;background:#fef3c7;border:1.5px solid #fbbf24;border-radius:10px;margin-bottom:18px;font-size:12.5px;font-weight:700;color:#92400e">⚠️ '+unmapped+' class'+(unmapped>1?'es':'')+' not yet mapped — fees cannot be auto-filled for students in those batches.</div>'
    : mixed > 0
      ? '<div style="display:flex;align-items:center;gap:8px;padding:10px 16px;background:#ecfeff;border:1.5px solid #67e8f9;border-radius:10px;margin-bottom:18px;font-size:12.5px;font-weight:700;color:#0e7490">✅ All classes configured. '+mixed+' class'+(mixed>1?'es are':' is')+' set to <b>Mixed / Per-Student</b> — fees must be assigned individually.</div>'
      : '<div style="display:flex;align-items:center;gap:8px;padding:10px 16px;background:#f0fdf4;border:1.5px solid #86efac;border-radius:10px;margin-bottom:18px;font-size:12.5px;font-weight:700;color:#15803d">✅ All active classes are mapped to a course fee tier.</div>';
  var rows = '';
  if(classes.length === 0){
    rows = '<tr><td colspan="4" style="text-align:center;padding:32px;color:var(--muted);font-size:13px">No active classes found. Add classes in the <a href="#" onclick="navigate(\'classes\');return false" style="color:#1433a8;font-weight:700">Classes page</a> first.</td></tr>';
  } else {
    classes.forEach(function(cls){
      var mapped    = bridge[cls.name] || '';
      var isMixed   = mapped === '__mixed__';
      var badge     = mapped ? _FMC_COURSE_BADGES[mapped] : null;
      var badgeHTML = isMixed
        ? '<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:700;background:#ecfeff;color:#0891b2;border:1px solid #67e8f9">🔀 Per-Student</span>'
        : badge
          ? '<span style="display:inline-block;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:700;background:'+badge.color+'18;color:'+badge.color+';border:1px solid '+badge.color+'44">'+badge.label+'</span>'
          : '<span style="display:inline-block;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:700;background:#fef3c7;color:#92400e;border:1px solid #fbbf24">⚠ Not mapped</span>';
      var opts = '<option value="">-- Select Course --</option>'
        + _FMC_COURSES.map(function(c){
            return '<option value="'+esc(c)+'"'+(mapped===c?' selected':'')+'>'+esc(c)+'</option>';
          }).join('')
        + '<option value="__mixed__"'+(isMixed?' selected':'')+'>🔀 Mixed / Per-Student</option>';
      /* Row background tint for mixed classes */
      var rowBg = isMixed ? 'background:linear-gradient(90deg,#ecfeff 0%,transparent 60%);' : '';
      rows += '<tr style="border-bottom:1px solid var(--border);'+rowBg+'">'
        // Class info
        +'<td style="padding:12px 14px;vertical-align:middle">'
          +'<div style="font-weight:700;font-size:13.5px;color:var(--on-surface)">'+esc(cls.name)+'</div>'
          +(cls.section?'<div style="font-size:11px;color:var(--muted);margin-top:1px">Section: '+esc(cls.section)+'</div>':'')
          +(cls.strength?'<div style="font-size:11px;color:var(--muted)">Strength: '+cls.strength+'</div>':'')
          +(isMixed?'<div style="font-size:10.5px;color:#0891b2;margin-top:3px;font-weight:600">Each student assigned individually</div>':'')
        +'</td>'
        // Course dropdown
        +'<td style="padding:12px 14px;vertical-align:middle">'
          +'<select id="cb-sel-'+esc(cls.id||cls.name)+'" onchange="fmcBridgeSetCourse(\''+esc(cls.name)+'\',this.value)" '
            +'style="width:100%;max-width:240px;border:1.5px solid '+(isMixed?'#67e8f9':mapped?'var(--border)':'#fbbf24')+';border-radius:8px;padding:7px 10px;font-size:13px;font-family:\'DM Sans\',sans-serif;background:var(--surface);color:var(--text);cursor:pointer">'
            +opts
          +'</select>'
        +'</td>'
        // Fee badge
        +'<td style="padding:12px 14px;vertical-align:middle">'+badgeHTML+'</td>'
        // Clear
        +'<td style="padding:12px 14px;vertical-align:middle;text-align:right">'
          +(mapped?'<button onclick="fmcBridgeSetCourse(\''+esc(cls.name)+'\',\'\')" style="border:1px solid #fca5a5;background:none;border-radius:6px;padding:4px 10px;font-size:11px;color:#dc2626;cursor:pointer">✕ Clear</button>':'')
        +'</td>'
      +'</tr>';
    });
  }
  /* Timetable batch → suggested course auto-link hint */
  var ttHint = ''
    +'<div style="padding:14px 18px;background:var(--surface2);border:1.5px solid var(--border);border-radius:12px;margin-bottom:18px">'
      +'<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-family:\'JetBrains Mono\',monospace;margin-bottom:8px">💡 Course Induction Mapping Guide</div>'
      +'<div style="display:flex;flex-wrap:wrap;gap:8px">'
        +[
          {batch:'Achiever Batch',course:'Combined (New)'},
          {batch:'Leader Batch',  course:'Sainik (Old)'},
          {batch:'Champion Batch',course:'Sainik (New)'},
          {batch:'Lakshya Batch', course:'Navodaya (Old)'},
          {batch:'Umeed Batch',   course:'Navodaya (New)'},
          {batch:'Prime Batch',   course:'Foundation V'},
          {batch:'Elite Batch',   course:'Foundation IV'}
        ].map(function(h){
          var b = _FMC_COURSE_BADGES[h.course]||{color:'#64748b',label:''};
          return '<div style="padding:5px 12px;border-radius:8px;border:1px solid var(--border);background:var(--surface);font-size:12px">'
            +'<span style="font-weight:700;color:var(--on-surface)">'+h.batch+'</span>'
            +' <span style="color:var(--muted)">→</span> '
            +'<span style="font-weight:700;color:'+b.color+'">'+h.course+'</span>'
          +'</div>';
        }).join('')
      +'</div>'
    +'</div>';
  return '<div class="card" style="overflow:hidden">'
    +'<div class="card-head" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">'
      +'<div>'
        +'<span class="card-title">🔗 Class ↔ Course Fee Bridge</span>'
        +'<div style="font-size:12px;color:var(--muted);margin-top:3px">Map each active class/batch to its course fee tier. Changes sync to cloud instantly.</div>'
      +'</div>'
      +'<button onclick="fmcBridgeAutoMap()" style="padding:7px 16px;border-radius:9px;border:1.5px solid #1433a8;background:#e0e8f9;color:#1433a8;font-size:12px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">⚡ Auto-Map from Timetable</button>'
    +'</div>'
    +'<div style="padding:18px">'
      +ttHint
      +statusBar
      +'<div style="overflow-x:auto;border-radius:10px;border:1.5px solid var(--border)">'
        +'<table style="width:100%;border-collapse:collapse;min-width:520px">'
          +'<thead><tr style="background:var(--surface2)">'
            +'<th style="text-align:left;padding:10px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);border-bottom:1px solid var(--border)">Class / Batch</th>'
            +'<th style="text-align:left;padding:10px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);border-bottom:1px solid var(--border)">Mapped Course Fee Tier</th>'
            +'<th style="text-align:left;padding:10px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);border-bottom:1px solid var(--border)">Monthly Fee</th>'
            +'<th style="border-bottom:1px solid var(--border)"></th>'
          +'</tr></thead>'
          +'<tbody>'+rows+'</tbody>'
        +'</table>'
      +'</div>'
      +'<div style="margin-top:12px;font-size:11.5px;color:var(--muted)">Changes are saved immediately and synced to all devices via cloud. The mapping is used when collecting fees to auto-fill the correct fee tier for a student\'s batch. Select <b>🔀 Mixed / Per-Student</b> for classes where students belong to different courses — fees will not be auto-filled and must be assigned per student individually.</div>'
    +'</div>'
  +'</div>';
}
function fmcBridgeSetCourse(className, course){
  var bridge = _fmcLoadBridge();
  if(course) bridge[className] = course;
  else delete bridge[className];
  _fmcSaveBridge(bridge);
  if(typeof showToast==='function'){
    if(course === '__mixed__'){
      showToast('🔀 '+className+' set to Mixed/Per-Student — fees must be assigned individually', '#0891b2');
    } else {
      showToast(course ? '🔗 '+className+' → '+course+' saved' : '🔗 '+className+' mapping cleared', '#1433a8');
    }
  }
  render();
}
/* Auto-map based on known batch-name keywords matching Course Induction doc */
function fmcBridgeAutoMap(){
  var classes = (typeof loadClasses==='function' ? loadClasses() : []).filter(function(c){return c.active;});
  var bridge  = _fmcLoadBridge();
  var rules = [
    {pattern:/achiever|combined.*(new)/i,   course:'Combined (New)'},
    {pattern:/combined.*(old)/i,            course:'Combined (Old)'},
    {pattern:/leader|sainik.*(old)/i,       course:'Sainik (Old)'},
    {pattern:/champion|sainik.*(new)/i,     course:'Sainik (New)'},
    {pattern:/lakshya|navodaya.*(old)/i,    course:'Navodaya (Old)'},
    {pattern:/umeed|navodaya.*(new)/i,      course:'Navodaya (New)'},
    {pattern:/prime|foundation.*(b|v|5)/i,  course:'Foundation V'},
    {pattern:/elite|foundation.*(a|iv|4)/i, course:'Foundation IV'}
  ];
  var count = 0;
  classes.forEach(function(cls){
    for(var i=0;i<rules.length;i++){
      if(rules[i].pattern.test(cls.name)){
        bridge[cls.name] = rules[i].course;
        count++;
        break;
      }
    }
  });
  _fmcSaveBridge(bridge);
  if(typeof showToast==='function') showToast('⚡ Auto-mapped '+count+' class'+(count!==1?'es':'')+' -- review and adjust if needed','#15803d');
  render();
}
/* ── Fee Structure Editor — save & preview helpers ── */
/* Live-preview badge as admin types into any fee input */
function fmcFeeStructPreview(type, ci, val, st){
  var n = parseInt(val,10); if(isNaN(n)||n<0) return;
  if(type==='mf' && st){
    var el = document.getElementById('fse-prev-'+ci+'-'+st);
    if(el){
      var stColors = {boarder:'#1a6b55', dayscholar:'#1433a8', dayboarder:'#7c3aed'};
      var col = stColors[st]||'#64748b';
      el.innerHTML = '<span style="display:inline-block;padding:2px 10px;border-radius:20px;font-size:11.5px;font-weight:700;background:'+col+'15;color:'+col+';border:1px solid '+col+'33">₹'+n.toLocaleString('en-IN')+'/mo</span>';
    }
  }
}
/* Save all edited fee structure values to FS_FEE_CONFIG and sync to portal */
function fmcSaveFeeStructure(){
  /* Resolve the live config object — prefer in-memory FS_FEE_CONFIG, fall back to fresh load */
  var _cfg = null;
  if(typeof FS_FEE_CONFIG!=='undefined' && FS_FEE_CONFIG.courses && FS_FEE_CONFIG.courses.length) {
    _cfg = FS_FEE_CONFIG;
  } else {
    try { if(typeof fs_load==='function') _cfg = fs_load('config'); } catch(e){}
    if(!_cfg || !_cfg.courses) {
      try { _cfg = JSON.parse(localStorage.getItem('gnsi_fee_config')||'null'); } catch(e){}
    }
  }
  if(!_cfg || !_cfg.courses || !_cfg.courses.length){
    if(typeof showToast==='function') showToast('⚠️ Fee config not loaded — cannot save','#dc2626'); return;
  }
  var subtypes = ['boarder','dayscholar','dayboarder'];
  var allOk = true;
  _cfg.courses.forEach(function(c, ci){
    var elAdm = document.getElementById('fse-adm-'+ci);
    if(elAdm){ var v=parseInt(elAdm.value,10); if(!isNaN(v)&&v>=0) c.admFee=v; else allOk=false; }
    if(!c.monthlyFees) c.monthlyFees = {};
    subtypes.forEach(function(st){
      var elMf = document.getElementById('fse-mf-'+ci+'-'+st);
      if(elMf){ var v=parseInt(elMf.value,10); if(!isNaN(v)&&v>=0) c.monthlyFees[st]=v; else allOk=false; }
    });
  });
  if(!allOk){
    if(typeof showToast==='function') showToast('⚠️ Some values are invalid — check inputs','#dc2626'); return;
  }
  /* Write back into FS_FEE_CONFIG in-memory so downstream code picks it up immediately */
  if(typeof FS_FEE_CONFIG!=='undefined') {
    FS_FEE_CONFIG.courses = _cfg.courses;
  }
  /* Persist via the existing fs_saveFeeConfig path which already handles all sync correctly */
  if(typeof fs_saveFeeConfig==='function'){
    /* fs_saveFeeConfig reads from DOM ids cfg-adm-N / cfg-b-N / cfg-ds-N / cfg-db-N.
       Those don't exist here, so we inject values directly and call the persist portion only. */
    try {
      if(typeof fs_save==='function') fs_save('config', _cfg);
      else { localStorage.setItem('gnsi_fee_config', JSON.stringify(_cfg));if(typeof gnsiKVPush==='function')gnsiKVPush('gnsi_fee_config',_cfg); }
    } catch(e){}
  } else {
    /* Fallback: persist manually */
    try {
      if(typeof fs_save==='function') fs_save('config', _cfg);
      else { localStorage.setItem('gnsi_fee_config', JSON.stringify(_cfg)); if(typeof gnsiKVPush==='function') gnsiKVPush('gnsi_fee_config',_cfg); }
    } catch(e){}
  }
  /* Sync to main portal fee config (loadFeeConf / saveFeeConf store) */
  try {
    if(typeof loadFeeConf==='function' && typeof saveFeeConf==='function'){
      var _mc = loadFeeConf();
      _cfg.courses.forEach(function(c){
        (_mc.monthlyFees||[]).forEach(function(mf){
          var cn = (mf.course||'').toLowerCase();
          if(cn.indexOf(c.id)!==-1){
            if(c.monthlyFees&&c.monthlyFees.boarder!=null)    mf.amount       = c.monthlyFees.boarder;
            if(c.monthlyFees&&c.monthlyFees.dayscholar!=null) mf.hostelAmount = c.monthlyFees.dayscholar;
          }
        });
        (_mc.admissionFees||[]).forEach(function(af){
          if((af.course||'').toLowerCase().indexOf(c.id)!==-1 && c.admFee!=null) af.amount=c.admFee;
        });
      });
      saveFeeConf(_mc);
      try{ if(typeof _cache!=='undefined') _cache.feeConf=_mc; }catch(e){}
    }
  } catch(e){}
  /* Push to gnsiKV cloud store */
  try{ if(typeof gnsiKVPush==='function') gnsiKVPush('gnsi_fee_config', _cfg); }catch(e){}
  /* Update GNSI_COURSES subtype monthlyFee values so Bridge badges stay fresh */
  try {
    if(typeof GNSI_COURSES!=='undefined'){
      GNSI_COURSES.forEach(function(gc){
        var fsc = _cfg.courses.find(function(c){ return c.id===gc.id; });
        if(!fsc) return;
        gc.subTypes.forEach(function(st){
          var key = st.id.split('_')[1];
          if(fsc.monthlyFees && fsc.monthlyFees[key]!=null) st.monthlyFee = fsc.monthlyFees[key];
        });
      });
    }
  } catch(e){}
  /* Also update _FMC_COURSE_BADGES labels to reflect new amounts */
  try {
    if(typeof _FMC_COURSE_BADGES!=='undefined' && typeof _freshCfg==='undefined'){
      /* Badges are static strings; no auto-update needed — they show tier labels not live fees */
    }
  } catch(e){}
  if(typeof showToast==='function') showToast('✅ Fee structure saved & synced to cloud!','#15803d');
  render();
}
/* ══════════════════════════════════════════════════════════════════
   TAB: FEE SETUP
   Manages:
     1. Fee Groups  -- named bundles (e.g. "Science Kit ₹1 200") that
                      appear as one-click options in the counter's
                      "Fee Group" payment panel.
     2. Manual Fee Types -- label tags (e.g. "Library Fine", "Tour Fee")
                      selectable in the counter's "Manual Fee" panel.
   All data lives inside the existing loadFeeConf / saveFeeConf store
   so every other part of the portal reads the same data.
   ══════════════════════════════════════════════════════════════════ */
/* -- state -- */
var _fsEdit = null;
var _fsEditId = null;
/* -- sub-tab state for fee setup -- */
var _fseSubTab = _fseSubTab || 'groups';
var _fseAsnSearch = _fseAsnSearch || '';
var _fseAsnClsFilter = _fseAsnClsFilter || 'all';
var _fseAsnEditId = _fseAsnEditId || null; // stuId being edited
function _fmcRenderFeeSetup(isAdmin) {
  var conf = (typeof loadFeeConf==='function') ? loadFeeConf() : {};
  var fgs  = conf.feeGroups || [];
  var mfts = conf.manualFeeTypes || [];
  var cfg2 = (typeof FS_FEE_CONFIG!=='undefined') ? FS_FEE_CONFIG : null;
  var stuList = (typeof students!=='undefined') ? students : [];
  var sfaAll  = loadStuFeeAssignments();
  function fgColor(i){ var c=['#1433a8','#15803d','#be185d','#7c3aed','#d97706','#0891b2']; return c[i%c.length]; }
  /* ── KPI tiles ── */
  var assignedCount = sfaAll.filter(function(a){ return a.feeGroupIds && a.feeGroupIds.length; }).length;
  var html = '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px">'
    +'<div style="flex:1;min-width:130px;background:linear-gradient(135deg,#1433a8,#2563eb);color:#fff;border-radius:12px;padding:15px 18px">'
      +'<div style="font-size:10px;opacity:.8;margin-bottom:3px;font-weight:700;text-transform:uppercase;letter-spacing:.05em">Fee Groups</div>'
      +'<div style="font-size:28px;font-weight:900;line-height:1">'+fgs.length+'</div>'
      +'<div style="font-size:11px;opacity:.7;margin-top:3px">active bundles</div>'
    +'</div>'
    +'<div style="flex:1;min-width:130px;background:linear-gradient(135deg,#475569,#64748b);color:#fff;border-radius:12px;padding:15px 18px">'
      +'<div style="font-size:10px;opacity:.8;margin-bottom:3px;font-weight:700;text-transform:uppercase;letter-spacing:.05em">Manual Types</div>'
      +'<div style="font-size:28px;font-weight:900;line-height:1">'+mfts.length+'</div>'
      +'<div style="font-size:11px;opacity:.7;margin-top:3px">label options</div>'
    +'</div>'
    +'<div style="flex:1;min-width:130px;background:linear-gradient(135deg,#be185d,#ec4899);color:#fff;border-radius:12px;padding:15px 18px">'
      +'<div style="font-size:10px;opacity:.8;margin-bottom:3px;font-weight:700;text-transform:uppercase;letter-spacing:.05em">Students Assigned</div>'
      +'<div style="font-size:28px;font-weight:900;line-height:1">'+assignedCount+'</div>'
      +'<div style="font-size:11px;opacity:.7;margin-top:3px">of '+stuList.length+' total</div>'
    +'</div>'
    +'<div style="flex:1;min-width:130px;background:linear-gradient(135deg,#15803d,#22c55e);color:#fff;border-radius:12px;padding:15px 18px">'
      +'<div style="font-size:10px;opacity:.8;margin-bottom:3px;font-weight:700;text-transform:uppercase;letter-spacing:.05em">Course Tiers</div>'
      +'<div style="font-size:28px;font-weight:900;line-height:1">'+(cfg2&&cfg2.courses?cfg2.courses.length:0)+'</div>'
      +'<div style="font-size:11px;opacity:.7;margin-top:3px">from fee config</div>'
    +'</div>'
  +'</div>';
  /* ── Sub-tabs ── */
  var subTabs=[
    {id:'groups', label:'🏷️ Fee Groups'},
    {id:'types',  label:'✏️ Manual Fee Types'},
    {id:'assign', label:'👤 Student Assignment'},
    {id:'struct', label:'📋 Fee Structure'}
  ];
  html += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:18px;border-bottom:2px solid var(--border-soft);padding-bottom:10px">';
  subTabs.forEach(function(t){
    var active = _fseSubTab===t.id;
    html += '<button onclick="_fseSubTab=\''+t.id+'\';render()" style="padding:7px 16px;border-radius:8px;border:'+(active?'none':'1.5px solid var(--border)')+';cursor:pointer;font-weight:700;font-size:12px;font-family:\'DM Sans\',sans-serif;background:'+(active?'#1433a8':'var(--surface)')+';color:'+(active?'#fff':'var(--muted)')+';transition:all .15s">'+t.label+'</button>';
  });
  html += '</div>';
  /* ══════════════════════════════════════
     SUB-TAB: FEE GROUPS
  ══════════════════════════════════════ */
  if(_fseSubTab==='groups'){
    var fgRows = '';
    fgs.forEach(function(g, i){
      var c = fgColor(i);
      var stuAssignedCount = sfaAll.filter(function(a){ return a.feeGroupIds && a.feeGroupIds.indexOf(g.id)>=0; }).length;
      if(_fsEdit==='fg' && _fsEditId===g.id){
        fgRows += '<tr style="background:#f0f5ff">'
          +'<td style="padding:10px 14px"><input id="fse-edit-name" value="'+esc(g.name)+'" style="width:100%;border:1.5px solid var(--accent);border-radius:7px;padding:6px 10px;font-size:13px;font-family:\'DM Sans\',sans-serif;background:var(--surface);color:var(--text)"/></td>'
          +'<td style="padding:10px 14px"><input id="fse-edit-amt" type="number" min="0" value="'+Number(g.amount)+'" style="width:110px;border:1.5px solid var(--accent);border-radius:7px;padding:6px 10px;font-size:13px;font-family:\'JetBrains Mono\',monospace;background:var(--surface);color:var(--text)"/></td>'
          +'<td style="padding:10px 14px"><input id="fse-edit-desc" value="'+esc(g.description||'')+'" placeholder="Optional description" style="width:100%;border:1.5px solid var(--accent);border-radius:7px;padding:6px 10px;font-size:13px;font-family:\'DM Sans\',sans-serif;background:var(--surface);color:var(--text)"/></td>'
          +'<td style="padding:10px 14px;text-align:center;color:var(--muted);font-size:12px">'+stuAssignedCount+' students</td>'
          +'<td style="padding:10px 14px;white-space:nowrap">'
            +'<button onclick="fseUpdateFeeGroup(\''+g.id+'\')" style="background:#1433a8;color:#fff;border:none;border-radius:7px;padding:5px 12px;cursor:pointer;font-size:12px;font-weight:700;font-family:\'DM Sans\',sans-serif;margin-right:4px">✓ Save</button>'
            +'<button onclick="_fsEdit=null;_fsEditId=null;render()" style="background:var(--surface2);border:1px solid var(--border);border-radius:7px;padding:5px 10px;cursor:pointer;font-size:12px;font-family:\'DM Sans\',sans-serif">✕</button>'
          +'</td>'
        +'</tr>';
      } else {
        fgRows += '<tr style="border-bottom:1px solid var(--border-soft)">'
          +'<td style="padding:12px 14px">'
            +'<div style="display:flex;align-items:center;gap:8px">'
              +'<span style="width:9px;height:9px;border-radius:50%;background:'+c+';display:inline-block;flex-shrink:0"></span>'
              +'<span style="font-weight:700;font-size:13.5px">'+esc(g.name)+'</span>'
            +'</div>'
          +'</td>'
          +'<td style="padding:12px 14px;font-family:\'JetBrains Mono\',monospace;font-weight:800;color:'+c+';font-size:14px">&#8377;'+Number(g.amount).toLocaleString('en-IN')+'</td>'
          +'<td style="padding:12px 14px;font-size:12.5px;color:var(--muted)">'+esc(g.description||'--')+'</td>'
          +'<td style="padding:12px 14px;text-align:center">'
            +(stuAssignedCount>0
              ? '<span style="background:#dbeafe;color:#1433a8;border-radius:20px;padding:3px 10px;font-size:11.5px;font-weight:700">'+stuAssignedCount+' assigned</span>'
              : '<span style="background:var(--surface2);color:var(--muted);border-radius:20px;padding:3px 10px;font-size:11.5px">none</span>')
          +'</td>'
          +'<td style="padding:12px 14px;white-space:nowrap">'
            +(isAdmin ? '<button onclick="_fsEdit=\'fg\';_fsEditId=\''+g.id+'\';render()" style="background:var(--accent-light);color:var(--accent);border:1px solid var(--accent);border-radius:7px;padding:4px 10px;cursor:pointer;font-size:11.5px;font-weight:700;font-family:\'DM Sans\',sans-serif;margin-right:4px">&#9998; Edit</button>' : '')
            +(isAdmin ? '<button onclick="fseDeleteFeeGroup(\''+g.id+'\')" style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;border-radius:7px;padding:4px 10px;cursor:pointer;font-size:11.5px;font-weight:700;font-family:\'DM Sans\',sans-serif">&#10005; Remove</button>' : '')
          +'</td>'
        +'</tr>';
      }
    });
    var fgEmpty = '<tr><td colspan="5" style="padding:36px;text-align:center;color:var(--muted);font-size:13px">No Fee Groups yet.'+(isAdmin?' Add one using the row below. (You have full access)':' Contact Accounts or Admin to add fee groups.')+'</td></tr>';
    var fgAddRow = isAdmin
      ? '<tr style="background:#f8faff;border-top:2px solid var(--border)">'
          +'<td style="padding:12px 14px"><input id="fse-new-fg-name" placeholder="e.g. Science Kit Fee" style="width:100%;border:1.5px solid var(--border);border-radius:7px;padding:7px 10px;font-size:13px;font-family:\'DM Sans\',sans-serif;background:var(--surface);color:var(--text)"/></td>'
          +'<td style="padding:12px 14px"><input id="fse-new-fg-amt" type="number" min="0" placeholder="0" style="width:110px;border:1.5px solid var(--border);border-radius:7px;padding:7px 10px;font-size:13px;font-family:\'JetBrains Mono\',monospace;background:var(--surface);color:var(--text)"/></td>'
          +'<td style="padding:12px 14px"><input id="fse-new-fg-desc" placeholder="Optional description" style="width:100%;border:1.5px solid var(--border);border-radius:7px;padding:7px 10px;font-size:13px;font-family:\'DM Sans\',sans-serif;background:var(--surface);color:var(--text)"/></td>'
          +'<td style="padding:12px 14px"></td>'
          +'<td style="padding:12px 14px"><button onclick="fseAddFeeGroup()" style="background:#be185d;color:#fff;border:none;border-radius:7px;padding:7px 16px;cursor:pointer;font-size:13px;font-weight:700;font-family:\'DM Sans\',sans-serif;white-space:nowrap">+ Add Group</button></td>'
        +'</tr>'
      : '';
    /* ── Monthly Bundle Generator (inline in Fee Groups tab) ── */
    if(isAdmin){
      var BMCOURSES = [
        {id:'sainik',name:'Sainik',icon:'⚔️'},
        {id:'navodaya',name:'Navodaya',icon:'📚'},
        {id:'foundation',name:'Foundation',icon:'🏫'},
        {id:'combined',name:'Combined',icon:'🎨'}
      ];
      var BMSUBTYPES = [{id:'boarder',label:'🏠 Boarder'},{id:'dayscholar',label:'🚌 Day Scholar'},{id:'dayboarder',label:'🔄 Day Boarder'}];
      var BMMONTHS = ['February 2026','March 2026','April 2026','May 2026','June 2026','July 2026','August 2026','September 2026','October 2026','November 2026','December 2026','January 2027'];
      /* Fee rates from FS_FEE_CONFIG if available */
      var bmRates = {};
      if(typeof FS_FEE_CONFIG!=='undefined' && FS_FEE_CONFIG.courses){
        FS_FEE_CONFIG.courses.forEach(function(c){
          bmRates[c.id] = c.monthlyFees;
        });
      }
      /* defaults from fee structure */
      if(!bmRates.sainik)    bmRates.sainik    = {boarder:6000,dayscholar:4250,dayboarder:2500};
      if(!bmRates.navodaya)  bmRates.navodaya  = {boarder:5500,dayscholar:3750,dayboarder:2000};
      if(!bmRates.foundation)bmRates.foundation= {boarder:5500,dayscholar:3750,dayboarder:2000};
      if(!bmRates.combined)  bmRates.combined  = {boarder:6000,dayscholar:4250,dayboarder:2500};
      var bmSelCourse  = window._bmCourse  || 'navodaya';
      var bmSelSubtype = window._bmSubtype || 'boarder';
      var bmRate = (bmRates[bmSelCourse]||{})[bmSelSubtype] || 0;
      var bmCourseOpts = BMCOURSES.map(function(c){ return '<option value="'+c.id+'"'+(c.id===bmSelCourse?' selected':'')+'>'+c.icon+' '+c.name+'</option>'; }).join('');
      var bmSubOpts    = BMSUBTYPES.map(function(s){ return '<option value="'+parseInt(s.id,10)+'"'+(s.id===bmSelSubtype?' selected':'')+'>'+s.label+'</option>'; }).join('');
      var bmMonthChips = BMMONTHS.map(function(m){
        var k = 'bm2-'+m.replace(/\s/g,'_');
        return '<label style="display:inline-flex;align-items:center;gap:4px;padding:5px 10px;border:1.5px solid var(--border);border-radius:8px;cursor:pointer;font-size:11.5px;font-weight:600;background:var(--surface);margin:3px">'
          +'<input type="checkbox" id="'+k+'" checked style="accent-color:#1433a8"> '+m+'</label>';
      }).join('');
      html += '<div class="card" style="margin-bottom:16px;border:2px solid #e0e7ff">'
        +'<div class="card-head" style="background:#f0f5ff">'
          +'<div><span class="card-title" style="color:#1433a8">📦 Monthly Bundle Generator</span>'
            +'<div style="font-size:12px;color:#3b5bdb;margin-top:2px">Generate packaged monthly fee bundles (Feb 2026 – Jan 2027) that appear as one-click options at the counter</div>'
          +'</div>'
        +'</div>'
        +'<div style="padding:16px 20px">'
          +'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin-bottom:14px">'
            +'<div class="form-group" style="margin:0"><label style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--muted)">Course</label>'
              +'<select id="bm2-course" onchange="window._bmCourse=this.value;render()" style="width:100%;padding:8px 10px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;background:var(--surface);color:var(--text)">'+bmCourseOpts+'</select></div>'
            +'<div class="form-group" style="margin:0"><label style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--muted)">Sub-type</label>'
              +'<select id="bm2-subtype" onchange="window._bmSubtype=this.value;render()" style="width:100%;padding:8px 10px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;background:var(--surface);color:var(--text)">'+bmSubOpts+'</select></div>'
            +'<div class="form-group" style="margin:0"><label style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--muted)">Monthly Rate (₹)</label>'
              +'<input id="bm2-rate" type="number" value="'+bmRate+'" min="0" style="width:100%;padding:8px 10px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;font-family:\'JetBrains Mono\',monospace;font-weight:700;background:var(--surface);color:var(--text)"/></div>'
            +'<div class="form-group" style="margin:0"><label style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--muted)">Bundle Label</label>'
              +'<input id="bm2-name" value="'+(BMCOURSES.find(function(c){return c.id===bmSelCourse;})||{}).name+' '+(BMSUBTYPES.find(function(s){return s.id===bmSelSubtype;})||{}).label.replace(/^[^ ]+ /,'')+' (Feb–Jan)" style="width:100%;padding:8px 10px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;background:var(--surface);color:var(--text)"/></div>'
          +'</div>'
          +'<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin-bottom:6px">Months to Include</div>'
          +'<div>'+bmMonthChips+'</div>'
          +'<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:12px">'
            +'<button onclick="fseGenerateBundle()" style="padding:9px 20px;background:#1433a8;color:#fff;border:none;border-radius:8px;font-weight:700;font-size:13px;cursor:pointer;font-family:\'DM Sans\',sans-serif">⚡ Generate Bundle</button>'
            +'<button onclick="fseSelectBundleMonths(true)" style="padding:7px 14px;background:var(--surface2);border:1.5px solid var(--border);border-radius:7px;font-size:12px;font-weight:600;cursor:pointer">☑ All</button>'
            +'<button onclick="fseSelectBundleMonths(false)" style="padding:7px 14px;background:var(--surface2);border:1.5px solid var(--border);border-radius:7px;font-size:12px;font-weight:600;cursor:pointer">☐ None</button>'
            +'<span style="font-size:12px;color:#1433a8;font-weight:700">12 months × ₹'+bmRate.toLocaleString('en-IN')+' = ₹'+(12*bmRate).toLocaleString('en-IN')+' (if all selected)</span>'
          +'</div>'
        +'</div>'
      +'</div>';
    }
    html += '<div class="card">'
      +'<div class="card-head"><div><span class="card-title">Fee Groups</span>'
        +'<div style="font-size:12px;color:var(--muted);margin-top:2px">Named fee bundles — appear as one-click options in <b>Collect Fee → Fee Group</b>. Assign them to students in the <b>Student Assignment</b> tab.</div>'
      +'</div></div>'
      +'<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse">'
        +'<thead><tr style="background:var(--surface2);font-size:11.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em">'
          +'<th style="padding:10px 14px;text-align:left;font-weight:700">Group Name</th>'
          +'<th style="padding:10px 14px;text-align:left;font-weight:700">Amount</th>'
          +'<th style="padding:10px 14px;text-align:left;font-weight:700">Description</th>'
          +'<th style="padding:10px 14px;text-align:center;font-weight:700">Students</th>'
          +(isAdmin ? '<th style="padding:10px 14px;text-align:left;font-weight:700">Actions</th>' : '')
        +'</tr></thead>'
        +'<tbody>'+(fgRows||fgEmpty)+fgAddRow+'</tbody>'
      +'</table></div>'
    +'</div>';
  }
  /* ══════════════════════════════════════
     SUB-TAB: MANUAL FEE TYPES
  ══════════════════════════════════════ */
  if(_fseSubTab==='types'){
    var mftChips = '';
    mfts.forEach(function(t, i){
      mftChips += '<span style="display:inline-flex;align-items:center;gap:6px;background:var(--surface2);border:1.5px solid var(--border);border-radius:20px;padding:6px 14px;font-size:12.5px;font-weight:600;color:var(--text)">'
        +esc(t)
        +(isAdmin ? '<button onclick="fseRemoveManualType('+i+')" title="Remove" style="background:none;border:none;cursor:pointer;color:#dc2626;font-size:14px;line-height:1;padding:0;margin-left:2px">&#215;</button>' : '')
      +'</span>';
    });
    var mftAddRow = isAdmin
      ? '<div style="display:flex;gap:8px;align-items:center;padding:14px 16px;border-top:1px solid var(--border-soft);flex-wrap:wrap">'
          +'<input id="fse-new-mft" placeholder="New fee type name..." onkeydown="if(event.key===\'Enter\')fseAddManualType()" style="flex:1;min-width:200px;padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;font-family:\'DM Sans\',sans-serif;background:var(--surface);color:var(--text)"/>'
          +'<button onclick="fseAddManualType()" style="padding:8px 20px;background:#475569;color:#fff;border:none;border-radius:8px;font-weight:700;font-size:13px;cursor:pointer;font-family:\'DM Sans\',sans-serif">+ Add Type</button>'
        +'</div>'
      : '';
    html += '<div class="card">'
      +'<div class="card-head"><div><span class="card-title">Manual Fee Types</span>'
        +'<div style="font-size:12px;color:var(--muted);margin-top:2px">Label tags selectable in <b>Collect Fee → Manual Fee</b> counter panel</div>'
      +'</div></div>'
      +'<div style="padding:16px;display:flex;flex-wrap:wrap;gap:8px">'
        +(mftChips||'<span style="color:var(--muted);font-size:13px">No types defined.</span>')
      +'</div>'
      +mftAddRow
    +'</div>';
  }
  /* ══════════════════════════════════════
     SUB-TAB: STUDENT ASSIGNMENT
  ══════════════════════════════════════ */
  if(_fseSubTab==='assign'){
    /* -- Edit form for one student -- */
    if(_fseAsnEditId){
      var editStu = stuList.find(function(s){ return String(s.id)===String(_fseAsnEditId); });
      var existing = getStuFeeAssignment(_fseAsnEditId) || {feeGroupIds:[], manualFeeTypes:[], note:''};
      if(!editStu){
        html += '<div class="card"><div style="padding:24px;color:#dc2626;font-weight:700">Student not found.</div>'
          +'<button onclick="_fseAsnEditId=null;render()" style="margin:0 20px 20px;padding:7px 18px;border-radius:8px;border:1.5px solid var(--border);background:var(--surface);cursor:pointer;font-size:13px;font-weight:700">← Back</button></div>';
      } else {
        /* Fee group checkboxes */
        var fgChecks = '';
        if(fgs.length===0){
          fgChecks='<div style="color:var(--muted);font-size:13px;padding:8px 0">No fee groups defined yet. Add them in the <b>Fee Groups</b> tab first.</div>';
        } else {
          fgs.forEach(function(g,i){
            var checked = existing.feeGroupIds.indexOf(g.id)>=0;
            var c = fgColor(i);
            fgChecks += '<label style="display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:9px;border:1.5px solid '+(checked?c:'var(--border)')+';background:'+(checked?'#f0f5ff':'var(--surface)')+';cursor:pointer;transition:all .1s;margin-bottom:6px">'
              +'<input type="checkbox" id="fga-cb-'+g.id+'" '+(checked?'checked':'')+' style="width:16px;height:16px;accent-color:'+c+'">'
              +'<span style="width:8px;height:8px;border-radius:50%;background:'+c+';display:inline-block;flex-shrink:0"></span>'
              +'<span style="font-weight:700;font-size:13px;flex:1">'+esc(g.name)+'</span>'
              +'<span style="font-family:\'JetBrains Mono\',monospace;font-size:13px;font-weight:700;color:'+c+'">₹'+Number(g.amount).toLocaleString('en-IN')+'</span>'
            +'</label>';
          });
        }
        /* Manual fee type checkboxes */
        var mftChecks = '';
        if(mfts.length===0){
          mftChecks='<div style="color:var(--muted);font-size:13px;padding:8px 0">No manual fee types defined yet.</div>';
        } else {
          mfts.forEach(function(t){
            var checked = existing.manualFeeTypes.indexOf(t)>=0;
            mftChecks += '<label style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:20px;border:1.5px solid '+(checked?'#475569':'var(--border)')+';background:'+(checked?'#f1f5f9':'var(--surface)')+';cursor:pointer;margin:0 6px 6px 0;font-size:12.5px;font-weight:600;transition:all .1s">'
              +'<input type="checkbox" id="mft-cb-'+encodeURIComponent(t)+'" '+(checked?'checked':'')+' style="accent-color:#475569">'
              +esc(t)
            +'</label>';
          });
        }
        html += '<div class="card">'
          +'<div class="card-head">'
            +'<div><span class="card-title">Assign Fee Groups &amp; Types</span>'
              +'<div style="font-size:12px;color:var(--muted);margin-top:2px">Student: <b>'+esc(editStu.name)+'</b> &nbsp;·&nbsp; '+esc(editStu.cls||'—')+'</div>'
            +'</div>'
            +'<button onclick="_fseAsnEditId=null;render()" style="padding:7px 16px;border-radius:8px;border:1.5px solid var(--border);background:var(--surface);cursor:pointer;font-size:12px;font-weight:700;font-family:\'DM Sans\',sans-serif">← Back to List</button>'
          +'</div>'
          +'<div style="padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:24px;flex-wrap:wrap">'
            +'<div>'
              +'<div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin-bottom:10px">Fee Groups (tick to assign)</div>'
              +fgChecks
            +'</div>'
            +'<div>'
              +'<div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin-bottom:10px">Manual Fee Types (tick to allow)</div>'
              +'<div style="display:flex;flex-wrap:wrap;">'+mftChecks+'</div>'
              +'<div style="margin-top:18px">'
                +'<div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin-bottom:6px">Note / Remarks</div>'
                +'<textarea id="fga-note" rows="3" placeholder="Optional note for this student\'s fee assignment..." style="width:100%;border:1.5px solid var(--border);border-radius:9px;padding:8px 12px;font-size:13px;font-family:\'DM Sans\',sans-serif;background:var(--surface);color:var(--text);resize:vertical">'+esc(existing.note||'')+'</textarea>'
              +'</div>'
            +'</div>'
          +'</div>'
          +'<div style="padding:0 20px 20px;display:flex;gap:10px;flex-wrap:wrap">'
            +'<button onclick="fseSaveStudentAssignment(\''+_fseAsnEditId+'\')" style="padding:10px 24px;background:#1433a8;color:#fff;border:none;border-radius:9px;font-weight:700;font-size:13px;cursor:pointer;font-family:\'DM Sans\',sans-serif">💾 Save Assignment</button>'
            +(existing.feeGroupIds&&existing.feeGroupIds.length ? '<button onclick="fseSelectAllFeeGroups()" style="padding:10px 18px;background:var(--accent-light);color:var(--accent);border:1px solid var(--accent);border-radius:9px;font-weight:700;font-size:12px;cursor:pointer;font-family:\'DM Sans\',sans-serif">☑ Select All Groups</button>' : '<button onclick="fseSelectAllFeeGroups()" style="padding:10px 18px;background:var(--accent-light);color:var(--accent);border:1px solid var(--accent);border-radius:9px;font-weight:700;font-size:12px;cursor:pointer;font-family:\'DM Sans\',sans-serif">☑ Select All Groups</button>')
            +'<button onclick="fseClearStudentAssignment(\''+_fseAsnEditId+'\')" style="padding:10px 18px;background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;border-radius:9px;font-weight:700;font-size:12px;cursor:pointer;font-family:\'DM Sans\',sans-serif">✕ Clear Assignment</button>'
          +'</div>'
        +'</div>';
      }
    } else {
      /* -- Student list with assignment status -- */
      var clsArr = stuList.map(function(s){return s.cls;}).filter(function(v,i,a){return v&&a.indexOf(v)===i;}).sort();
      var clsOpts = '<option value="all">All Courses</option>'+clsArr.map(function(c){return'<option value="'+esc(c)+'"'+(_fseAsnClsFilter===c?' selected':'')+'>'+esc(c)+'</option>';}).join('');
      var filteredStus = stuList.filter(function(s){
        var q = _fseAsnSearch.toLowerCase();
        var classOk = _fseAsnClsFilter==='all'||s.cls===_fseAsnClsFilter;
        var searchOk = !q||(s.name||'').toLowerCase().includes(q)||(s.roll||'').toLowerCase().includes(q)||(s.cls||'').toLowerCase().includes(q);
        return classOk && searchOk;
      });
      var stuRows = filteredStus.map(function(s){
        var asgn = sfaAll.find(function(a){ return String(a.stuId)===String(s.id); });
        var hasFg = asgn && asgn.feeGroupIds && asgn.feeGroupIds.length>0;
        var hasMft = asgn && asgn.manualFeeTypes && asgn.manualFeeTypes.length>0;
        var fgNames = hasFg ? asgn.feeGroupIds.map(function(id){ var g=fgs.find(function(x){return x.id===id;}); return g?g.name:null; }).filter(Boolean) : [];
        var statusBadge = hasFg
          ? '<span style="background:#dcfce7;color:#15803d;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700">✓ Assigned</span>'
          : '<span style="background:#fef9c3;color:#c9870a;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700">⚠ None</span>';
        var fgPills = fgNames.slice(0,3).map(function(n,i){
          return '<span style="background:'+fgColor(i)+'18;color:'+fgColor(i)+';border-radius:6px;padding:2px 8px;font-size:11px;font-weight:700;margin-right:3px">'+esc(n)+'</span>';
        }).join('')+(fgNames.length>3?'<span style="color:var(--muted);font-size:11px">+'+( fgNames.length-3)+' more</span>':'');
        var mftCount = hasMft ? asgn.manualFeeTypes.length : 0;
        return '<tr style="border-bottom:1px solid var(--border-soft)">'
          +'<td style="padding:11px 14px"><div style="font-weight:700;font-size:13px">'+esc(s.name)+'</div><div style="font-size:11px;color:var(--muted)">Roll: '+esc(s.roll||'—')+'</div></td>'
          +'<td style="padding:11px 14px;font-size:12.5px;color:var(--muted)">'+esc(s.cls||'—')+'</td>'
          +'<td style="padding:11px 14px">'+statusBadge+'</td>'
          +'<td style="padding:11px 14px">'+(fgPills||'<span style="color:var(--muted);font-size:12px">—</span>')+'</td>'
          +'<td style="padding:11px 14px;font-size:12px;color:var(--muted)">'+(mftCount?mftCount+' types':'—')+'</td>'
          +'<td style="padding:11px 14px">'
            +(isAdmin?'<button onclick="_fseAsnEditId=\''+parseInt(s.id,10)+'\';render()" style="background:var(--accent-light);color:var(--accent);border:1px solid var(--accent);border-radius:7px;padding:5px 12px;cursor:pointer;font-size:12px;font-weight:700;font-family:\'DM Sans\',sans-serif">'+(hasFg?'✏️ Edit':'+ Assign')+'</button>':'')
          +'</td>'
        +'</tr>';
      }).join('');
      var unassignedTotal = stuList.filter(function(s){ var a=sfaAll.find(function(x){return String(x.stuId)===String(s.id);}); return !a||!a.feeGroupIds||!a.feeGroupIds.length; }).length;
      html += '<div class="card">'
        +'<div class="card-head">'
          +'<div><span class="card-title">👤 Student Fee Group Assignment</span>'
            +'<div style="font-size:12px;color:var(--muted);margin-top:2px">Assign specific fee groups &amp; manual fee types to individual students. The counter panel will show only their assigned groups.</div>'
          +'</div>'
        +'</div>'
        +(unassignedTotal>0&&(isAdmin||true) ? '<div style="margin:0 16px 0;padding:10px 14px;background:#fffbeb;border:1px solid #fde68a;border-radius:9px;font-size:12.5px;color:#c9870a;font-weight:600">⚠ <b>'+unassignedTotal+' students</b> have no fee groups assigned. Click <b>+ Assign</b> to set up their fee structure.</div><div style="height:12px"></div>' : '')
        +'<div style="padding:12px 16px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;border-bottom:1px solid var(--border-soft)">'
          +'<select onchange="_fseAsnClsFilter=this.value;render()" style="padding:7px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)">'+clsOpts+'</select>'
          +'<div class="search-wrap" style="flex:1;min-width:200px"><span class="search-icon">🔍</span><input placeholder="Search student name, roll, class..." value="'+esc(_fseAsnSearch)+'" oninput="_fseAsnSearch=this.value;_debouncedRenderFseAsn()" style="width:100%"/></div>'
          +(isAdmin||true ? '<button onclick="fseBulkAssignAll()" style="padding:8px 16px;background:#15803d;color:#fff;border:none;border-radius:8px;font-weight:700;font-size:12px;cursor:pointer;font-family:\'DM Sans\',sans-serif;white-space:nowrap">⚡ Bulk Assign All</button>' : '')
        +'</div>'
        +'<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse">'
          +'<thead><tr style="background:var(--surface2);font-size:11.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em">'
            +'<th style="padding:10px 14px;text-align:left;font-weight:700">Student</th>'
            +'<th style="padding:10px 14px;text-align:left;font-weight:700">Course</th>'
            +'<th style="padding:10px 14px;text-align:left;font-weight:700">Status</th>'
            +'<th style="padding:10px 14px;text-align:left;font-weight:700">Assigned Groups</th>'
            +'<th style="padding:10px 14px;text-align:left;font-weight:700">Fee Types</th>'
            +(isAdmin ? '<th style="padding:10px 14px;text-align:left;font-weight:700">Action</th>' : '')
          +'</tr></thead>'
          +'<tbody>'+(stuRows||'<tr><td colspan="6" style="padding:36px;text-align:center;color:var(--muted)">No students found.</td></tr>')+'</tbody>'
        +'</table></div>'
      +'</div>';
    }
  }
  /* ══════════════════════════════════════
     SUB-TAB: FEE STRUCTURE (EDITABLE)
  ══════════════════════════════════════ */
  if(_fseSubTab==='struct'){
    /* Always read freshest copy from localStorage so inputs are never blank */
    var _freshCfg = null;
    try { if(typeof fs_load==='function') _freshCfg = fs_load('config'); } catch(e){}
    if(!_freshCfg || !_freshCfg.courses || !_freshCfg.courses.length) _freshCfg = cfg2;
    if(!_freshCfg || !_freshCfg.courses || !_freshCfg.courses.length) {
      try { _freshCfg = JSON.parse(localStorage.getItem('gnsi_fee_config')||'null'); } catch(e){}
    }
    if(!_freshCfg || !_freshCfg.courses || !_freshCfg.courses.length) {
      if(typeof FS_FEE_CONFIG!=='undefined' && FS_FEE_CONFIG.courses && FS_FEE_CONFIG.courses.length) _freshCfg = FS_FEE_CONFIG;
    }
    var inputStyle = 'width:120px;border:1.5px solid var(--border);border-radius:7px;padding:6px 10px;font-size:14px;font-family:\'JetBrains Mono\',monospace;font-weight:700;background:var(--surface);color:var(--text);text-align:right';
    var structEditRows = '';
    if(_freshCfg && _freshCfg.courses && _freshCfg.courses.length) {
      var subtypes  = ['boarder','dayscholar','dayboarder'];
      var stLabels  = {boarder:'🏠 Boarder', dayscholar:'🚌 Day Scholar', dayboarder:'🔄 Day Boarder'};
      var stColors  = {boarder:'#1a6b55',    dayscholar:'#1433a8',         dayboarder:'#7c3aed'};
      _freshCfg.courses.forEach(function(c, ci){
        subtypes.forEach(function(st, si){
          var mf = c.monthlyFees ? (c.monthlyFees[st]||0) : 0;
          var af = c.admFee || 0;
          structEditRows += '<tr style="border-bottom:1px solid var(--border-soft)'+(si===2?';border-bottom:2.5px solid var(--border)':'')+'">'
            /* Course name — spans 3 rows */
            +(si===0
              ? '<td rowspan="3" style="padding:14px 16px;vertical-align:middle;border-right:1.5px solid var(--border)">'
                  +'<div style="font-weight:800;font-size:14px;color:var(--on-surface)">'+(c.icon||'')+'&nbsp;'+esc(c.name)+'</div>'
                  +'<div style="margin-top:8px;font-size:11px;color:var(--muted);font-weight:600">Admission Fee</div>'
                  +'<div style="margin-top:4px;display:flex;align-items:center;gap:6px">'
                    +'<span style="font-size:12px;font-weight:700;color:var(--muted);font-family:\'JetBrains Mono\',monospace">₹</span>'
                    +'<input type="number" min="0" step="100" id="fse-adm-'+ci+'" value="'+af+'" style="'+inputStyle+'" oninput="fmcFeeStructPreview(\'adm\','+ci+',this.value)"/>'
                  +'</div>'
                +'</td>'
              : '')
            /* Sub-type label */
            +'<td style="padding:8px 16px;font-size:13px;font-weight:700;color:'+stColors[st]+'">'
              +stLabels[st]
            +'</td>'
            /* Monthly fee input */
            +'<td style="padding:8px 16px">'
              +'<div style="display:flex;align-items:center;gap:6px">'
                +'<span style="font-size:12px;font-weight:700;color:var(--muted);font-family:\'JetBrains Mono\',monospace">₹</span>'
                +'<input type="number" min="0" step="100" id="fse-mf-'+ci+'-'+st+'" value="'+mf+'" style="'+inputStyle+'" oninput="fmcFeeStructPreview(\'mf\','+ci+',this.value,\''+st+'\')" />'
                +'<span style="font-size:11px;color:var(--muted)">/mo</span>'
              +'</div>'
            +'</td>'
            /* Preview badge */
            +'<td style="padding:8px 16px" id="fse-prev-'+ci+'-'+st+'">'
              +'<span style="display:inline-block;padding:2px 10px;border-radius:20px;font-size:11.5px;font-weight:700;background:'+stColors[st]+'15;color:'+stColors[st]+';border:1px solid '+stColors[st]+'33">₹'+mf.toLocaleString('en-IN')+'/mo</span>'
            +'</td>'
          +'</tr>';
        });
      });
    }

    var noData = !_freshCfg || !_freshCfg.courses || !_freshCfg.courses.length;
    html += '<div class="card">'
      +'<div class="card-head" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">'
        +'<div>'
          +'<span class="card-title">📋 Fee Structure</span>'
          +'<div style="font-size:12px;color:var(--muted);margin-top:3px">Edit monthly &amp; admission fees per course and sub-type. Click <b>Save Fee Structure</b> to apply — changes sync instantly across the portal.</div>'
        +'</div>'
        +(isAdmin && !noData
          ? '<button onclick="fmcSaveFeeStructure()" style="padding:8px 20px;border-radius:9px;border:none;background:#15803d;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif;box-shadow:0 2px 8px rgba(21,128,61,.25)">💾 Save Fee Structure</button>'
          : '')
      +'</div>'
      +(noData
        ? '<div style="padding:32px;text-align:center;color:var(--muted);font-size:13px">Fee structure not loaded. Check that FS_FEE_CONFIG is initialised.</div>'
        : '<div style="padding:14px 18px 6px;background:#fffbeb;border-top:1.5px solid #fde68a">'
            +'<span style="font-size:12px;color:#92400e;font-weight:700">⚠️ Changing fees here updates the master rate used for all new fee calculations across the portal. Existing receipts are not affected.</span>'
          +'</div>'
          +'<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;min-width:520px">'
            +'<thead><tr style="background:var(--surface2)">'
              +'<th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);border-bottom:1px solid var(--border)">Course</th>'
              +'<th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);border-bottom:1px solid var(--border)">Sub-type</th>'
              +'<th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);border-bottom:1px solid var(--border)">Monthly Fee</th>'
              +'<th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);border-bottom:1px solid var(--border)">Preview</th>'
            +'</tr></thead>'
            +'<tbody>'+structEditRows+'</tbody>'
          +'</table></div>'
          +'<div style="padding:14px 18px;border-top:1.5px solid var(--border-soft);display:flex;justify-content:flex-end;gap:10px">'
            +(isAdmin
              ? '<button onclick="fmcSaveFeeStructure()" style="padding:9px 24px;border-radius:9px;border:none;background:#15803d;color:#fff;font-size:13.5px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">💾 Save Fee Structure</button>'
              : '<div style="font-size:12px;color:var(--muted);padding:8px">Only Accounts admins can edit the fee structure.</div>')
          +'</div>')
    +'</div>';
  }
  return html;
}
/* -- Fee Group CRUD -- */
function fseAddFeeGroup(){
  var name = ((document.getElementById('fse-new-fg-name')||{}).value||'').trim();
  var amt  = parseFloat((document.getElementById('fse-new-fg-amt')||{}).value||0)||0;
  var desc = ((document.getElementById('fse-new-fg-desc')||{}).value||'').trim();
  if(!name){ if(typeof showToast==='function') showToast('Group name is required','#dc2626'); else alert('Group name is required.'); return; }
  if(!amt){  if(typeof showToast==='function') showToast('Amount is required','#dc2626'); else alert('Amount is required.'); return; }
  var conf = (typeof loadFeeConf==='function') ? loadFeeConf() : {};
  if(!conf.feeGroups) conf.feeGroups = [];
  if(conf.feeGroups.find(function(g){ return g.name.toLowerCase()===name.toLowerCase(); })){
    if(typeof showToast==='function') showToast('"'+name+'" already exists','#f59e0b'); else alert('A group with that name already exists.'); return;
  }
  conf.feeGroups.push({id:'fg_'+Date.now(), name:name, amount:amt, description:desc});
  if(typeof saveFeeConf==='function') saveFeeConf(conf);
  if(typeof showToast==='function') showToast('Fee Group "'+name+'" added','#15803d');
  render();
}
function fseUpdateFeeGroup(id){
  var name = ((document.getElementById('fse-edit-name')||{}).value||'').trim();
  var amt  = parseFloat((document.getElementById('fse-edit-amt')||{}).value||0)||0;
  var desc = ((document.getElementById('fse-edit-desc')||{}).value||'').trim();
  if(!name){ if(typeof showToast==='function') showToast('Name is required','#dc2626'); else alert('Name required.'); return; }
  if(!amt){  if(typeof showToast==='function') showToast('Amount is required','#dc2626'); else alert('Amount required.'); return; }
  var conf = (typeof loadFeeConf==='function') ? loadFeeConf() : {};
  var idx  = (conf.feeGroups||[]).findIndex(function(g){ return g.id===id; });
  if(idx<0) return;
  conf.feeGroups[idx] = {id:id, name:name, amount:amt, description:desc};
  if(typeof saveFeeConf==='function') saveFeeConf(conf);
  _fsEdit=null; _fsEditId=null;
  if(typeof showToast==='function') showToast('"'+name+'" updated','#15803d');
  render();
}
function fseDeleteFeeGroup(id){
  var conf = (typeof loadFeeConf==='function') ? loadFeeConf() : {};
  var g    = (conf.feeGroups||[]).find(function(x){ return x.id===id; });
  if(!g || !confirm('Remove fee group "'+g.name+'"?')) return;
  conf.feeGroups = conf.feeGroups.filter(function(x){ return x.id!==id; });
  if(typeof saveFeeConf==='function') saveFeeConf(conf);
  if(typeof showToast==='function') showToast('"'+g.name+'" removed','#64748b');
  render();
}
function fseSelectBundleMonths(sel) {
  var keys=['February_2026','March_2026','April_2026','May_2026','June_2026','July_2026','August_2026','September_2026','October_2026','November_2026','December_2026','January_2027'];
  keys.forEach(function(k){ var el=document.getElementById('bm2-'+k); if(el) el.checked=sel; });
}
function fseGenerateBundle() {
  var courseId = (document.getElementById('bm2-course')||{}).value || 'navodaya';
  var subtype  = (document.getElementById('bm2-subtype')||{}).value || 'boarder';
  var rate     = parseInt((document.getElementById('bm2-rate')||{}).value||0);
  var name     = ((document.getElementById('bm2-name')||{}).value||'').trim();
  if(!rate){ if(typeof showToast==='function') showToast('Enter monthly rate','#dc2626'); else alert('Enter monthly rate'); return; }
  if(!name){ if(typeof showToast==='function') showToast('Enter bundle name','#dc2626'); else alert('Enter bundle name'); return; }
  var MONTH_KEYS   = ['February_2026','March_2026','April_2026','May_2026','June_2026','July_2026','August_2026','September_2026','October_2026','November_2026','December_2026','January_2027'];
  var MONTH_LABELS = ['February 2026','March 2026','April 2026','May 2026','June 2026','July 2026','August 2026','September 2026','October 2026','November 2026','December 2026','January 2027'];
  var selMonths = [];
  MONTH_KEYS.forEach(function(k,i){ var el=document.getElementById('bm2-'+k); if(el&&el.checked) selMonths.push(MONTH_LABELS[i]); });
  if(!selMonths.length){ if(typeof showToast==='function') showToast('Select at least one month','#dc2626'); return; }
  var total = selMonths.length * rate;
  var subtypeLabel = subtype==='boarder'?'Boarder':subtype==='dayscholar'?'Day Scholar':'Day Boarder';
  var desc = courseId.charAt(0).toUpperCase()+courseId.slice(1)+' · '+subtypeLabel+' · '+selMonths.length+' months @ ₹'+rate.toLocaleString('en-IN')+'/mo (Feb 2026 – Jan 2027)';
  var conf = (typeof loadFeeConf==='function') ? loadFeeConf() : {};
  if(!conf.feeGroups) conf.feeGroups = [];
  var id = 'bundle_'+courseId+'_'+subtype+'_'+Date.now();
  conf.feeGroups.push({ id:id, name:name, amount:total, description:desc, _bundle:true, _courseId:courseId, _subtype:subtype, _months:selMonths, _monthlyRate:rate, _period:'Feb 2026 - Jan 2027' });
  if(typeof saveFeeConf==='function') saveFeeConf(conf);
  if(typeof showToast==='function') showToast('Bundle "'+name+'" added — ₹'+total.toLocaleString('en-IN'),'#15803d');
  render();
}
/* -- Manual Fee Type CRUD -- */
function fseAddManualType(){
  var name = ((document.getElementById('fse-new-mft')||{}).value||'').trim();
  if(!name){ if(typeof showToast==='function') showToast('Enter a fee type name','#dc2626'); else alert('Enter a fee type name.'); return; }
  var conf = (typeof loadFeeConf==='function') ? loadFeeConf() : {};
  if(!conf.manualFeeTypes) conf.manualFeeTypes = [];
  if(conf.manualFeeTypes.indexOf(name)>=0){
    if(typeof showToast==='function') showToast('"'+name+'" already exists','#f59e0b'); else alert('Already exists.'); return;
  }
  conf.manualFeeTypes.push(name);
  if(typeof saveFeeConf==='function') saveFeeConf(conf);
  if(typeof showToast==='function') showToast('"'+name+'" added','#15803d');
  render();
}
function fseRemoveManualType(idx){
  var conf = (typeof loadFeeConf==='function') ? loadFeeConf() : {};
  if(!conf.manualFeeTypes || !conf.manualFeeTypes[idx]) return;
  var name = conf.manualFeeTypes[idx];
  if(!confirm('Remove "'+name+'" from manual fee types?')) return;
  conf.manualFeeTypes.splice(idx,1);
  if(typeof saveFeeConf==='function') saveFeeConf(conf);
  if(typeof showToast==='function') showToast('"'+name+'" removed','#64748b');
  render();
}
/* ── Student Assignment Functions ── */
function fseSaveStudentAssignment(stuId) {
  var conf = (typeof loadFeeConf==='function') ? loadFeeConf() : {};
  var fgs  = conf.feeGroups || [];
  var mfts = conf.manualFeeTypes || [];
  /* Collect checked fee groups */
  var selFgIds = fgs.filter(function(g){
    var cb = document.getElementById('fga-cb-'+g.id);
    return cb && cb.checked;
  }).map(function(g){ return g.id; });
  /* Collect checked manual fee types */
  var selMfts = mfts.filter(function(t){
    var cb = document.getElementById('mft-cb-'+encodeURIComponent(t));
    return cb && cb.checked;
  });
  var note = ((document.getElementById('fga-note')||{}).value||'').trim();
  setStuFeeAssignment(stuId, selFgIds, selMfts, note);
  var stu = (typeof students!=='undefined' ? students : []).find(function(s){ return String(s.id)===String(stuId); });
  if(typeof showToast==='function') showToast('Assignment saved for '+(stu?stu.name:'student'),'#15803d');
  _fseAsnEditId = null;
  render();
}
function fseSelectAllFeeGroups() {
  var conf = (typeof loadFeeConf==='function') ? loadFeeConf() : {};
  (conf.feeGroups||[]).forEach(function(g){
    var cb = document.getElementById('fga-cb-'+g.id);
    if(cb) cb.checked = true;
  });
}
function fseClearStudentAssignment(stuId) {
  if(!confirm('Clear all fee group assignments for this student?')) return;
  deleteStuFeeAssignment(stuId);
  if(typeof showToast==='function') showToast('Assignment cleared','#64748b');
  _fseAsnEditId = null;
  render();
}
function fseBulkAssignAll() {
  var conf = (typeof loadFeeConf==='function') ? loadFeeConf() : {};
  var fgs  = conf.feeGroups || [];
  var mfts = conf.manualFeeTypes || [];
  if(!fgs.length){ if(typeof showToast==='function') showToast('No fee groups defined yet','#f59e0b'); return; }
  if(!confirm('Assign ALL fee groups and ALL manual fee types to every student? Existing assignments will be updated.')) return;
  var stuList = (typeof students!=='undefined') ? students : [];
  stuList.forEach(function(s){
    var existing = getStuFeeAssignment(s.id) || {};
    setStuFeeAssignment(s.id, fgs.map(function(g){return g.id;}), mfts, existing.note||'');
  });
  if(typeof showToast==='function') showToast('All '+stuList.length+' students assigned','#15803d');
  render();
}
function _fmcRenderConfig(){
  var pc=gnsiLoad('gnsi_pay_config')||{};
  return '<div class="card"><div class="card-head"><span class="card-title">⚙️ Online Payment Gateway Config</span></div>'
    +'<div style="padding:20px;max-width:480px">'
    +'<div class="form-group" style="margin-bottom:14px"><label>Provider</label>'
    +'<select id="fmc-cfg-provider" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:8px 12px;font-size:13px;background:var(--surface);color:var(--text)">'
    +'<option'+(pc.provider==='Razorpay'?' selected':'')+'>Razorpay</option>'
    +'<option'+(pc.provider==='PayU'?' selected':'')+'>PayU</option>'
    +'<option'+(pc.provider==='Paytm'?' selected':'')+'>Paytm</option>'
    +'</select></div>'
    +'<div class="form-group" style="margin-bottom:14px"><label>Key ID *</label><input id="fmc-cfg-keyid" value="'+esc(pc.keyId||'')+'" placeholder="rzp_live_…" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:8px 12px;font-size:13px;background:var(--surface);color:var(--text);box-sizing:border-box"/></div>'
    +'<div class="form-group" style="margin-bottom:14px"><label>Key Secret (stored locally only)</label><input type="password" id="fmc-cfg-secret" value="'+esc(pc.keySecret||'')+'" placeholder="Leave blank to keep existing" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:8px 12px;font-size:13px;background:var(--surface);color:var(--text);box-sizing:border-box"/></div>'
    +'<div class="form-group" style="margin-bottom:20px"><label>Webhook Secret (optional)</label><input id="fmc-cfg-webhook" value="'+esc(pc.webhookSecret||'')+'" placeholder="For payment verification" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:8px 12px;font-size:13px;background:var(--surface);color:var(--text);box-sizing:border-box"/></div>'
    +'<div class="form-actions"><button class="btn btn-primary" onclick="gnsiSaveFMCConfig()">✅ Save Config</button></div>'
    +'</div></div>';
}
function gnsiSaveFMCConfig(){
  var provider=(document.getElementById('fmc-cfg-provider')||{}).value||'Razorpay';
  var keyId=((document.getElementById('fmc-cfg-keyid')||{}).value||'').trim();
  var secret=((document.getElementById('fmc-cfg-secret')||{}).value||'').trim();
  var webhook=((document.getElementById('fmc-cfg-webhook')||{}).value||'').trim();
  if(!keyId){alert('Enter Key ID.');return;}
  var pc=gnsiLoad('gnsi_pay_config')||{};
  pc.provider=provider; pc.keyId=keyId;
  if(secret) pc.keySecret=secret;
  if(webhook) pc.webhookSecret=webhook;
  gnsiSave('gnsi_pay_config',pc);
  if(typeof showToast==='function') showToast('Payment gateway config saved ✅','#15803d');
  render();
}
/* ============ WIRE INTO PAGE MAP ============ */
(function(){
  /* Replace all three old page entries with the unified hub */
  function wireFMC(){
    if(typeof _PAGE_MAP==='undefined'||!_PAGE_MAP){ setTimeout(wireFMC,200); return; }
    /* fees page → always renderUnifiedFeeHub (the Fee Management Centre) */
    _PAGE_MAP['fees'] = renderUnifiedFeeHub;
    /* payments and studentfee → keep their own renderers (they have role-based logic inside) */
    /* DO NOT overwrite renderPayments/renderStudentFeeAssignment — they handle accounts redirect */
    /* v20 FIX: do NOT null _PAGE_MAP here — that caused _getPageMap() to rebuild and restore
       the stub renderFees (which shows "Loading…"), discarding the renderUnifiedFeeHub override.
       Instead also override renderFees itself so it survives any future _PAGE_MAP rebuilds. */
    renderFees = renderUnifiedFeeHub;
    
  }
  setTimeout(wireFMC, 300);
})();
/* -- Patch: sync old SFA storage keys → new unified keys on load -- */
(function(){
  try{
    /* Merge ALL legacy assignment keys into the canonical gnsi_fee_asgns key.
       Priority: gnsi_fee_asgns (newest) > gnsi_sfa_assignments > gnsi_student_fee_asgns (oldest).
       If gnsi_fee_asgns already exists we still check the other two for records that
       are missing from the canonical store (e.g. assignments made via the old SFA form). */
    var _parse = function(k){ try{ return JSON.parse(localStorage.getItem(k)||'null'); }catch(e){ return null; } };
    var canonical  = _parse('gnsi_fee_asgns');
    var fromSfa    = _parse('gnsi_sfa_assignments');
    var fromOldSfa = _parse('gnsi_student_fee_asgns');
    if (!canonical) {
      /* Nothing in canonical yet — use whichever legacy key has data */
      var seed = fromSfa || fromOldSfa;
      if (seed) localStorage.setItem('gnsi_fee_asgns', JSON.stringify(seed));
    } else {
      /* Canonical exists — merge in any records from legacy stores that are missing */
      var merged = false;
      var existingIds = {};
      canonical.forEach(function(r){ existingIds[String(r.id || r.stuId)] = true; });
      [fromSfa, fromOldSfa].forEach(function(src){
        if (!src) return;
        src.forEach(function(r){
          var key = String(r.id || r.stuId);
          if (!existingIds[key]) { canonical.push(r); existingIds[key] = true; merged = true; }
        });
      });
      if (merged) {
        localStorage.setItem('gnsi_fee_asgns', JSON.stringify(canonical));
        
      }
    }
    /* Also keep gnsi_sfa_assignments in sync (for any old code that still reads it) */
    var finalAsgns = localStorage.getItem('gnsi_fee_asgns');
    if (finalAsgns) {
      localStorage.setItem('gnsi_sfa_assignments',    finalAsgns);
      localStorage.setItem('gnsi_student_fee_asgns',  finalAsgns);
      try{var _fa=JSON.parse(finalAsgns);if(typeof gnsiKVPush==='function'){gnsiKVPush('gnsi_sfa_assignments',_fa);gnsiKVPush('gnsi_student_fee_asgns',_fa);}}catch(e){}
    }
    var oldCols=localStorage.getItem('gnsi_sfa_collections');
    var newCols=localStorage.getItem('gnsi_fee_cols');
    if(oldCols&&!newCols){localStorage.setItem('gnsi_fee_cols',oldCols);try{var _fc=JSON.parse(oldCols);if(typeof gnsiKVPush==='function')gnsiKVPush('gnsi_fee_cols',_fc);}catch(e){}}
  }catch(e){ (void 0); }
})();
/* -- Ensure new keys sync to Supabase -- */
(function(){
  if(typeof GNSI_KV_KEYS!=='undefined'){
    /* gnsi_student_fee_asgns added so old SFA data is also cloud-synced */
    ['gnsi_fee_asgns','gnsi_fee_cols','gnsi_pay_config','gnsi_payment_txns','gnsi_student_fee_asgns','gnsi_sfa_assignments'].forEach(function(k){
      if(GNSI_KV_KEYS.indexOf(k)<0) GNSI_KV_KEYS.push(k);
    });
  }
})();

/* ── ONE-TIME RECORD NORMALISATION ─────────────────────────────────────
   Runs once on page load. Reads every assignment from all legacy keys,
   normalises the shape (stuId, studentName, className, enrolledAt),
   and writes back to ALL three keys so the fix is permanent in storage.
   ────────────────────────────────────────────────────────────────────── */
(function _gnsiNormaliseAllAssignments() {
  try {
    /* Wait until students array is ready */
    function _doNorm() {
      if (typeof gnsiLoad !== 'function' || typeof gnsiSave !== 'function') return;
      if (typeof _fmcNormaliseAsgn !== 'function') return;
      var keys = ['gnsi_fee_asgns', 'gnsi_sfa_assignments', 'gnsi_student_fee_asgns'];
      var allRaw = [];
      var seenIds = {};
      /* Collect all unique records across all three keys */
      keys.forEach(function(k) {
        var arr = gnsiLoad(k) || [];
        arr.forEach(function(r) {
          var rid = String(r.id || r.studentId || '');
          if (rid && !seenIds[rid]) { seenIds[rid] = true; allRaw.push(r); }
        });
      });
      if (!allRaw.length) return;
      /* Normalise every record */
      var normalised = allRaw.map(_fmcNormaliseAsgn);
      /* Write normalised set back to all three keys */
      keys.forEach(function(k) { gnsiSave(k, normalised); });
      
    }
    /* Delay slightly to ensure students array and gnsiLoad are ready */
    if (typeof students !== 'undefined' && students.length > 0) {
      _doNorm();
    } else {
      setTimeout(_doNorm, 2000);
    }
  } catch(e) {
    (void 0);
  }
})();
</script>
<script id="gnsi-fee-compiled">
function _gnsiInitFeeComponent() {
  if (window.FeeManagement) return;
  (function (React, ReactDOM) {
  'use strict';
  const {
    useState,
    useEffect,
    useCallback,
    useMemo
  } = React;
  const esc = function (s) {
    return String(s || "").replace(/[&<>"']/g, function (c) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[c];
    });
  };
  const uid = function () {
    return "id_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
  };
  const fmtINR = function (n) {
    return "₹" + Math.round(n || 0).toLocaleString("en-IN");
  };
  const today = function () {
    return new Date().toISOString().split("T")[0];
  };
  const fmtDate = function (d) {
    return d ? new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }) : "--";
  };
  const ls = function (k, fb = []) {
    try {
      var _JSON$parse;
      return (_JSON$parse = JSON.parse(localStorage.getItem(k) || "null")) !== null && _JSON$parse !== void 0 ? _JSON$parse : fb;
    } catch {
      return fb;
    }
  };
  /* v20 fix: also push to cloud via gnsiKVPush so admission fee records
     (gnsi_adm_integrated, ims_admrec, gnsi_fee_assignments, ims_income)
     sync to Supabase immediately after save, not just on full batch push. */
  const lsSet = function (k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {}
    try {
      if (typeof gnsiKVPush === 'function') gnsiKVPush(k, v);
    } catch (e) {}
  };
  const COURSES = ["Sainik (Old)", "Sainik (New)", "Combined (New)", "Combined (Old)", "Navodaya (Old)", "Navodaya (New)", "Foundation V", "Foundation IV"];
  const DEFAULT_FEE_CONF = {
    "Sainik (Old)": {
      admission: 5000,
      monthly: 12000,
      hostel: 5000
    },
    "Sainik (New)": {
      admission: 5000,
      monthly: 12000,
      hostel: 5000
    },
    "Combined (New)": {
      admission: 5000,
      monthly: 12000,
      hostel: 5000
    },
    "Combined (Old)": {
      admission: 5000,
      monthly: 12000,
      hostel: 5000
    },
    "Navodaya (Old)": {
      admission: 4500,
      monthly: 10000,
      hostel: 5000
    },
    "Navodaya (New)": {
      admission: 4500,
      monthly: 10000,
      hostel: 5000
    },
    "Foundation V": {
      admission: 3500,
      monthly: 8000,
      hostel: 4000
    },
    "Foundation IV": {
      admission: 3000,
      monthly: 7000,
      hostel: 4000
    }
  };
  const DEFAULT_ITEMS = [{
    label: "Registration Fee",
    key: "registration",
    amount: 500
  }, {
    label: "1st Month Tuition",
    key: "tuition1",
    amount: 0
  }, {
    label: "Uniform (Set)",
    key: "uniform",
    amount: 1500
  }, {
    label: "Books & Stationery",
    key: "books",
    amount: 1000
  }, {
    label: "Exam / Test Fee",
    key: "exam",
    amount: 500
  }, {
    label: "Library Deposit",
    key: "library",
    amount: 200
  }, {
    label: "ID Card / Smart Card",
    key: "idcard",
    amount: 100
  }, {
    label: "Miscellaneous",
    key: "misc",
    amount: 0
  }];
  const ACCENT = "#1433a8";
  const ACCENT_LIGHT = "#e0e8f9";
  const GREEN = "#15803d";
  const RED = "#dc2626";
  const GOLD = "#b45309";
  const Badge = function ({
    color = ACCENT,
    bg,
    children,
    style = {}
  }) {
    return React.createElement("span", {
      style: {
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 700,
        background: bg || color + "18",
        color,
        border: `1px solid ${color}44`,
        ...style
      }
    }, children);
  };
  const Stat = function ({
    label,
    value,
    sub,
    color = ACCENT
  }) {
    return React.createElement("div", {
      style: {
        background: "#fff",
        border: "1.5px solid #e4eaf5",
        borderRadius: 12,
        padding: "14px 16px",
        borderTop: `3px solid ${color}`
      }
    }, React.createElement("div", {
      style: {
        fontSize: 11,
        color: "#4a5580",
        fontWeight: 600,
        marginBottom: 4,
        textTransform: "uppercase",
        letterSpacing: "0.06em"
      }
    }, label), React.createElement("div", {
      style: {
        fontSize: 22,
        fontWeight: 800,
        color,
        fontFamily: "'JetBrains Mono', monospace"
      }
    }, value), sub && React.createElement("div", {
      style: {
        fontSize: 11,
        color: "#8896bb",
        marginTop: 3
      }
    }, sub));
  };
  const Toast = function ({
    msg,
    color = GREEN,
    onClose
  }) {
    return React.createElement("div", {
      style: {
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        background: color,
        color: "#fff",
        padding: "12px 20px",
        borderRadius: 10,
        fontWeight: 700,
        fontSize: 13,
        boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
        display: "flex",
        alignItems: "center",
        gap: 10
      }
    }, React.createElement("span", null, msg), React.createElement("button", {
      onClick: onClose,
      style: {
        background: "none",
        border: "none",
        color: "#fff",
        cursor: "pointer",
        fontSize: 16,
        lineHeight: 1
      }
    }, "\xD7"));
  };
  const SectionHead = function ({
    icon,
    title,
    sub
  }) {
    return React.createElement("div", {
      style: {
        marginBottom: 20
      }
    }, React.createElement("div", {
      style: {
        fontSize: 11,
        color: "#4a5580",
        fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        marginBottom: 4
      }
    }, "GNSI \u2014 FINANCE"), React.createElement("div", {
      style: {
        fontSize: 24,
        fontWeight: 800,
        color: ACCENT,
        fontFamily: "'Nunito', sans-serif"
      }
    }, icon, " ", title), sub && React.createElement("div", {
      style: {
        fontSize: 13,
        color: "#4a5580",
        marginTop: 4
      }
    }, sub));
  };
  const TableWrap = function ({
    children
  }) {
    return React.createElement("div", {
      style: {
        overflowX: "auto"
      }
    }, React.createElement("table", {
      style: {
        width: "100%",
        borderCollapse: "collapse",
        fontSize: 13
      }
    }, children));
  };
  const TH = function ({
    children,
    style = {}
  }) {
    return React.createElement("th", {
      style: {
        padding: "10px 12px",
        textAlign: "left",
        background: "#f5f7fd",
        borderBottom: "1.5px solid #d0d9ef",
        fontSize: 11,
        fontWeight: 700,
        color: "#4a5580",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        whiteSpace: "nowrap",
        ...style
      }
    }, children);
  };
  const TD = function ({
    children,
    style = {}
  }) {
    return React.createElement("td", {
      style: {
        padding: "10px 12px",
        borderBottom: "1px solid #eaeff8",
        verticalAlign: "middle",
        ...style
      }
    }, children);
  };
  const Field = function ({
    label,
    children,
    style = {}
  }) {
    return React.createElement("div", {
      style: {
        ...style
      }
    }, React.createElement("label", {
      style: {
        display: "block",
        fontSize: 11,
        fontWeight: 700,
        color: "#4a5580",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        marginBottom: 5
      }
    }, label), children);
  };
  const inputStyle = {
    width: "100%",
    padding: "8px 12px",
    border: "1.5px solid #d0d9ef",
    borderRadius: 8,
    fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
    background: "#fff",
    color: "#0a1229",
    outline: "none"
  };
  const selStyle = {
    ...inputStyle
  };
  const Confirm = function ({
    msg,
    onOk,
    onCancel
  }) {
    return React.createElement("div", {
      style: {
        position: "fixed",
        inset: 0,
        background: "rgba(10,18,41,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000
      }
    }, React.createElement("div", {
      style: {
        background: "#fff",
        borderRadius: 16,
        padding: 32,
        maxWidth: 380,
        width: "90%",
        boxShadow: "0 12px 48px rgba(0,0,0,0.2)"
      }
    }, React.createElement("div", {
      style: {
        fontSize: 16,
        fontWeight: 700,
        marginBottom: 16,
        color: "#0a1229"
      }
    }, msg), React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        justifyContent: "flex-end"
      }
    }, React.createElement("button", {
      onClick: onCancel,
      style: {
        padding: "8px 18px",
        borderRadius: 8,
        border: "1.5px solid #d0d9ef",
        background: "#fff",
        cursor: "pointer",
        fontWeight: 600,
        color: "#4a5580"
      }
    }, "Cancel"), React.createElement("button", {
      onClick: onOk,
      style: {
        padding: "8px 18px",
        borderRadius: 8,
        border: "none",
        background: RED,
        color: "#fff",
        cursor: "pointer",
        fontWeight: 700
      }
    }, "Delete"))));
  };
  function AdmissionTab({
    onToast,
    onRefresh
  }) {
    const [form, setForm] = useState({
      studentName: "",
      rollNo: "",
      admNo: "ADM/" + new Date().getFullYear() + "/" + String(Math.floor(Math.random() * 9000) + 1000),
      className: "",
      hostel: "No",
      date: today(),
      payMode: "Cash",
      receiptNo: "ADM/" + Date.now().toString().slice(-6),
      remark: "",
      collectedBy: "Admin"
    });
    const [items, setItems] = useState(DEFAULT_ITEMS.map(function (i) {
      return {
        ...i
      };
    }));
    const [records, setRecords] = useState(function () {
      return ls("gnsi_adm_integrated", []);
    });
    const [showForm, setShowForm] = useState(false);
    const [viewId, setViewId] = useState(null);
    const [confirmDel, setConfirmDel] = useState(null);
    const [search, setSearch] = useState("");
    const feeConf = useMemo(function () {
      return ls("ims_feeconf", null) || {};
    }, []);
    const onClassChange = useCallback(function (cls) {
      setForm(function (f) {
        return {
          ...f,
          className: cls
        };
      });
      const conf = DEFAULT_FEE_CONF[cls] || {};
      setItems(function (prev) {
        return prev.map(function (i) {
          return i.key === "tuition1" ? {
            ...i,
            amount: conf.monthly || 0
          } : i;
        });
      });
    }, []);
    const admTotal = useMemo(function () {
      return items.reduce(function (s, i) {
        return s + (Number(i.amount) || 0);
      }, 0);
    }, [items]);
    function handleSave() {
      if (!form.studentName.trim()) {
        alert("Student name is required.");
        return;
      }
      if (!form.className) {
        alert("Please select a class.");
        return;
      }
      if (admTotal <= 0) {
        alert("Total amount cannot be zero.");
        return;
      }
      const rec = {
        id: uid(),
        type: "Admission",
        ...form,
        items: items.filter(function (i) {
          return Number(i.amount) > 0;
        }),
        totalAmount: admTotal,
        createdAt: new Date().toISOString()
      };
      const recs = ls("gnsi_adm_integrated", []);
      recs.push(rec);
      lsSet("gnsi_adm_integrated", recs);
      setRecords(recs);
      const legacy = ls("ims_admrec", []);
      legacy.push({
        id: rec.id,
        student: form.studentName,
        course: form.className,
        amountPaid: admTotal,
        totalAmount: admTotal,
        receipt: form.receiptNo,
        date: form.date,
        remark: form.remark,
        collectedBy: form.collectedBy,
        createdAt: rec.createdAt
      });
      lsSet("ims_admrec", legacy);
      const asgns = ls("gnsi_fee_assignments", []);
      const exists = asgns.find(function (a) {
        return a.admNo === form.admNo || a.studentName === form.studentName;
      });
      if (!exists) {
        asgns.push({
          id: uid(),
          stuId: rec.id,
          studentName: form.studentName,
          rollNo: form.rollNo,
          admNo: form.admNo,
          className: form.className,
          hostel: form.hostel,
          subTypeId: null,
          enrolledAt: form.date,
          admissionPaid: true,
          admissionReceiptNo: form.receiptNo,
          remark: form.remark,
          createdAt: new Date().toISOString()
        });
        lsSet("gnsi_fee_assignments", asgns);
      }
      const inc = ls("ims_income", []);
      items.filter(function (i) {
        return Number(i.amount) > 0;
      }).forEach(function (item) {
        inc.push({
          id: uid(),
          date: form.date,
          category: "Admission Fee",
          description: `${item.label} -- ${form.studentName} (${form.className})`,
          amount: Number(item.amount),
          receipt: form.receiptNo,
          source: "Admission",
          sourceId: rec.id,
          createdAt: new Date().toISOString()
        });
      });
      lsSet("ims_income", inc);
      onToast(`Admission recorded for ${form.studentName} | Receipt: ${form.receiptNo}`, GREEN);
      setShowForm(false);
      onRefresh();
      setViewId(rec.id);
    }
    function handleDelete(id) {
      const updated = records.filter(function (r) {
        return r.id !== id;
      });
      lsSet("gnsi_adm_integrated", updated);
      setRecords(updated);
      setConfirmDel(null);
      if (viewId === id) setViewId(null);
      onToast("Record deleted.", RED);
    }
    const filtered = records.filter(function (r) {
      const q = search.toLowerCase();
      return !q || (r.studentName || "").toLowerCase().includes(q) || (r.admNo || "").toLowerCase().includes(q) || (r.className || "").toLowerCase().includes(q);
    }).slice().reverse();
    const totalCollected = records.reduce(function (s, r) {
      return s + (r.totalAmount || 0);
    }, 0);
    const viewRec = viewId ? records.find(function (r) {
      return r.id === viewId;
    }) : null;
    if (viewRec) return React.createElement(ReceiptView, {
      rec: viewRec,
      onBack: function () {
        return setViewId(null);
      }
    });
    return React.createElement("div", null, React.createElement(SectionHead, {
      icon: "\uD83C\uDF93",
      title: "Admission Fee + Items",
      sub: "One unified form \u2014 admission fee broken into items so every rupee is accounted for. Auto-creates fee assignment & credits income ledger."
    }), React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
        gap: 12,
        marginBottom: 24
      }
    }, React.createElement(Stat, {
      label: "Total Admissions",
      value: records.length,
      sub: "recorded",
      color: ACCENT
    }), React.createElement(Stat, {
      label: "Total Collected",
      value: fmtINR(totalCollected),
      sub: "admission fees",
      color: GREEN
    }), React.createElement(Stat, {
      label: "This Month",
      value: records.filter(function (r) {
        return r.date && r.date.startsWith(today().slice(0, 7));
      }).length,
      sub: "this month",
      color: GOLD
    })), React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        marginBottom: 16,
        flexWrap: "wrap"
      }
    }, React.createElement("button", {
      onClick: function () {
        setShowForm(true);
        setViewId(null);
      },
      style: {
        padding: "9px 20px",
        borderRadius: 8,
        background: ACCENT,
        color: "#fff",
        border: "none",
        cursor: "pointer",
        fontWeight: 700,
        fontSize: 13
      }
    }, "\u2795 New Admission Payment"), React.createElement("input", {
      value: search,
      onChange: function (e) {
        return setSearch(e.target.value);
      },
      placeholder: "\uD83D\uDD0D Search student, class, adm no\u2026",
      style: {
        ...inputStyle,
        width: 260
      }
    })), showForm && React.createElement("div", {
      style: {
        background: "#fff",
        border: "2px solid #16a34a",
        borderRadius: 14,
        padding: 24,
        marginBottom: 24
      }
    }, React.createElement("div", {
      style: {
        fontSize: 15,
        fontWeight: 800,
        color: GREEN,
        marginBottom: 20
      }
    }, "\uD83D\uDCDD Record Admission Payment"), React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: 14,
        marginBottom: 20
      }
    }, React.createElement(Field, {
      label: "Student Name *"
    }, React.createElement("input", {
      value: form.studentName,
      onChange: function (e) {
        return setForm(function (f) {
          return {
            ...f,
            studentName: e.target.value
          };
        });
      },
      placeholder: "Full name",
      style: inputStyle
    })), React.createElement(Field, {
      label: "Adm. No."
    }, React.createElement("input", {
      value: form.admNo,
      onChange: function (e) {
        return setForm(function (f) {
          return {
            ...f,
            admNo: e.target.value
          };
        });
      },
      style: inputStyle
    })), React.createElement(Field, {
      label: "Roll No."
    }, React.createElement("input", {
      value: form.rollNo,
      onChange: function (e) {
        return setForm(function (f) {
          return {
            ...f,
            rollNo: e.target.value
          };
        });
      },
      placeholder: "Optional",
      style: inputStyle
    })), React.createElement(Field, {
      label: "Class / Course *"
    }, React.createElement("select", {
      value: form.className,
      onChange: function (e) {
        return onClassChange(e.target.value);
      },
      style: selStyle
    }, React.createElement("option", {
      value: ""
    }, "\u2014 Select \u2014"), COURSES.map(function (c) {
      return React.createElement("option", {
        key: c,
        value: c
      }, c);
    }))), React.createElement(Field, {
      label: "Hostel"
    }, React.createElement("select", {
      value: form.hostel,
      onChange: function (e) {
        return setForm(function (f) {
          return {
            ...f,
            hostel: e.target.value
          };
        });
      },
      style: selStyle
    }, React.createElement("option", null, "No"), React.createElement("option", null, "Yes"))), React.createElement(Field, {
      label: "Date"
    }, React.createElement("input", {
      type: "date",
      value: form.date,
      onChange: function (e) {
        return setForm(function (f) {
          return {
            ...f,
            date: e.target.value
          };
        });
      },
      style: inputStyle
    })), React.createElement(Field, {
      label: "Receipt No."
    }, React.createElement("input", {
      value: form.receiptNo,
      onChange: function (e) {
        return setForm(function (f) {
          return {
            ...f,
            receiptNo: e.target.value
          };
        });
      },
      style: inputStyle
    })), React.createElement(Field, {
      label: "Pay Mode"
    }, React.createElement("select", {
      value: form.payMode,
      onChange: function (e) {
        return setForm(function (f) {
          return {
            ...f,
            payMode: e.target.value
          };
        });
      },
      style: selStyle
    }, ["Cash", "UPI / GPay", "NEFT / RTGS", "Cheque", "DD", "Card"].map(function (m) {
      return React.createElement("option", {
        key: m
      }, m);
    }))), React.createElement(Field, {
      label: "Collected By"
    }, React.createElement("input", {
      value: form.collectedBy,
      onChange: function (e) {
        return setForm(function (f) {
          return {
            ...f,
            collectedBy: e.target.value
          };
        });
      },
      style: inputStyle
    })), React.createElement(Field, {
      label: "Remarks",
      style: {
        gridColumn: "span 2"
      }
    }, React.createElement("input", {
      value: form.remark,
      onChange: function (e) {
        return setForm(function (f) {
          return {
            ...f,
            remark: e.target.value
          };
        });
      },
      placeholder: "Optional",
      style: inputStyle
    }))), React.createElement("div", {
      style: {
        background: "#f8faff",
        border: "1.5px solid #d0d9ef",
        borderRadius: 10,
        padding: 16,
        marginBottom: 18
      }
    }, React.createElement("div", {
      style: {
        fontSize: 12,
        fontWeight: 800,
        color: ACCENT,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        marginBottom: 12
      }
    }, "\uD83D\uDCA1 Fee Breakdown (itemized) \u2014 each item goes to income ledger separately"), React.createElement(TableWrap, null, React.createElement("thead", null, React.createElement("tr", null, React.createElement(TH, null, "Fee Item"), React.createElement(TH, null, "Amount (\u20B9)"), React.createElement(TH, null, "Note"))), React.createElement("tbody", null, items.map(function (item, idx) {
      return React.createElement("tr", {
        key: item.key,
        style: {
          background: idx % 2 === 0 ? "#fff" : "#f8faff"
        }
      }, React.createElement(TD, null, React.createElement("span", {
        style: {
          fontWeight: 600,
          color: "#0a1229"
        }
      }, item.label)), React.createElement(TD, null, React.createElement("input", {
        type: "number",
        min: "0",
        value: item.amount,
        onChange: function (e) {
          return setItems(function (prev) {
            return prev.map(function (it, i) {
              return i === idx ? {
                ...it,
                amount: Number(e.target.value)
              } : it;
            });
          });
        },
        style: {
          ...inputStyle,
          width: 120,
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 700
        }
      })), React.createElement(TD, null, React.createElement("span", {
        style: {
          fontSize: 11,
          color: "#8896bb"
        }
      }, item.amount > 0 ? "✅ will be recorded" : "--")));
    }), React.createElement("tr", {
      style: {
        background: "#e0e8f9"
      }
    }, React.createElement(TD, null, React.createElement("span", {
      style: {
        fontWeight: 800,
        color: ACCENT
      }
    }, "TOTAL")), React.createElement(TD, null, React.createElement("span", {
      style: {
        fontWeight: 800,
        fontSize: 16,
        color: ACCENT,
        fontFamily: "'JetBrains Mono', monospace"
      }
    }, fmtINR(admTotal))), React.createElement(TD, null, React.createElement(Badge, {
      color: GREEN
    }, "Auto-credited to income")))))), React.createElement("div", {
      style: {
        display: "flex",
        gap: 10
      }
    }, React.createElement("button", {
      onClick: handleSave,
      style: {
        padding: "10px 24px",
        borderRadius: 8,
        background: ACCENT,
        color: "#fff",
        border: "none",
        cursor: "pointer",
        fontWeight: 800,
        fontSize: 13
      }
    }, "\uD83D\uDCBE Save & Generate Receipt"), React.createElement("button", {
      onClick: function () {
        return setShowForm(false);
      },
      style: {
        padding: "10px 18px",
        borderRadius: 8,
        border: "1.5px solid #d0d9ef",
        background: "#fff",
        cursor: "pointer",
        fontWeight: 600,
        color: "#4a5580"
      }
    }, "Cancel"))), React.createElement("div", {
      style: {
        background: "#fff",
        border: "1.5px solid #d0d9ef",
        borderRadius: 12,
        overflow: "hidden"
      }
    }, React.createElement("div", {
      style: {
        padding: "14px 18px",
        borderBottom: "1px solid #eaeff8",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }
    }, React.createElement("span", {
      style: {
        fontWeight: 800,
        color: ACCENT
      }
    }, "\uD83D\uDCCB Admission Records"), React.createElement("span", {
      style: {
        fontSize: 11,
        color: "#8896bb",
        fontFamily: "'JetBrains Mono', monospace"
      }
    }, filtered.length, " of ", records.length)), React.createElement(TableWrap, null, React.createElement("thead", null, React.createElement("tr", null, React.createElement(TH, null, "Date"), React.createElement(TH, null, "Student"), React.createElement(TH, null, "Class"), React.createElement(TH, null, "Adm No."), React.createElement(TH, null, "Items"), React.createElement(TH, null, "Total"), React.createElement(TH, null, "Mode"), React.createElement(TH, null, "Receipt"), React.createElement(TH, null, "Actions"))), React.createElement("tbody", null, filtered.length === 0 && React.createElement("tr", null, React.createElement(TD, {
      style: {
        textAlign: "center",
        padding: "32px",
        color: "#8896bb"
      },
      colSpan: 9
    }, "No admission records yet. Click \"New Admission Payment\" to begin.")), filtered.map(function (r) {
      return React.createElement("tr", {
        key: r.id,
        style: {
          cursor: "pointer"
        },
        onMouseEnter: function (e) {
          return e.currentTarget.style.background = "#f5f7fd";
        },
        onMouseLeave: function (e) {
          return e.currentTarget.style.background = "";
        }
      }, React.createElement(TD, {
        style: {
          fontSize: 12,
          color: "#4a5580",
          fontFamily: "'JetBrains Mono', monospace"
        }
      }, fmtDate(r.date)), React.createElement(TD, null, React.createElement("div", {
        style: {
          fontWeight: 700
        }
      }, r.studentName), r.rollNo && React.createElement("div", {
        style: {
          fontSize: 11,
          color: "#8896bb"
        }
      }, "#", r.rollNo)), React.createElement(TD, null, React.createElement(Badge, {
        color: ACCENT
      }, r.className)), React.createElement(TD, {
        style: {
          fontSize: 12,
          fontFamily: "'JetBrains Mono', monospace"
        }
      }, r.admNo), React.createElement(TD, null, React.createElement("div", {
        style: {
          display: "flex",
          flexWrap: "wrap",
          gap: 3
        }
      }, (r.items || []).map(function (it) {
        return React.createElement(Badge, {
          key: it.key,
          color: GOLD,
          style: {
            fontSize: 10
          }
        }, it.label);
      }))), React.createElement(TD, null, React.createElement("span", {
        style: {
          fontWeight: 800,
          color: GREEN,
          fontFamily: "'JetBrains Mono', monospace"
        }
      }, fmtINR(r.totalAmount))), React.createElement(TD, null, React.createElement(Badge, {
        color: "#475569"
      }, r.payMode)), React.createElement(TD, {
        style: {
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11
        }
      }, r.receiptNo), React.createElement(TD, null, React.createElement("div", {
        style: {
          display: "flex",
          gap: 5
        }
      }, React.createElement("button", {
        onClick: function () {
          return setViewId(r.id);
        },
        style: {
          padding: "4px 10px",
          borderRadius: 6,
          border: "1px solid #86efac",
          background: "#dcfce7",
          color: GREEN,
          cursor: "pointer",
          fontSize: 11,
          fontWeight: 700
        }
      }, "\uD83E\uDDFE View"), React.createElement("button", {
        onClick: function () {
          return setConfirmDel(r.id);
        },
        style: {
          padding: "4px 10px",
          borderRadius: 6,
          border: "1px solid #fca5a5",
          background: "#fee2e2",
          color: RED,
          cursor: "pointer",
          fontSize: 11,
          fontWeight: 700
        }
      }, "\uD83D\uDDD1"))));
    })))), confirmDel && React.createElement(Confirm, {
      msg: "Delete this admission record? Income ledger entries will remain.",
      onOk: function () {
        return handleDelete(confirmDel);
      },
      onCancel: function () {
        return setConfirmDel(null);
      }
    }));
  }
  function ReceiptView({
    rec,
    onBack
  }) {
    return React.createElement("div", null, React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        marginBottom: 16
      }
    }, React.createElement("button", {
      onClick: onBack,
      style: {
        padding: "8px 16px",
        borderRadius: 8,
        border: "1.5px solid #d0d9ef",
        background: "#fff",
        cursor: "pointer",
        fontWeight: 600,
        color: "#4a5580"
      }
    }, "\u2190 Back"), React.createElement("button", {
      onClick: function () {
        return window.print();
      },
      style: {
        padding: "8px 16px",
        borderRadius: 8,
        background: ACCENT,
        color: "#fff",
        border: "none",
        cursor: "pointer",
        fontWeight: 700
      }
    }, "\uD83D\uDDA8\uFE0F Print")), React.createElement("div", {
      style: {
        maxWidth: 580,
        margin: "0 auto",
        background: "#fff",
        border: "2px solid " + ACCENT,
        borderRadius: 16,
        padding: 32,
        fontFamily: "'DM Sans', sans-serif"
      }
    }, React.createElement("div", {
      style: {
        textAlign: "center",
        marginBottom: 20,
        borderBottom: "2px dashed #d0d9ef",
        paddingBottom: 16
      }
    }, React.createElement("div", {
      style: {
        fontSize: 11,
        color: "#4a5580",
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        marginBottom: 4
      }
    }, (window.TENANT?window.TENANT.name:"Guidance Navodaya & Sainik Institute")), React.createElement("div", {
      style: {
        fontSize: 20,
        fontWeight: 800,
        color: ACCENT,
        fontFamily: "'Nunito', sans-serif"
      }
    }, "ADMISSION FEE RECEIPT"), React.createElement("div", {
      style: {
        fontSize: 12,
        color: "#8896bb",
        marginTop: 4
      }
    }, "Receipt No: ", React.createElement("b", {
      style: {
        color: ACCENT,
        fontFamily: "'JetBrains Mono', monospace"
      }
    }, rec.receiptNo))), React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "6px 16px",
        marginBottom: 18,
        fontSize: 13
      }
    }, [["Student", rec.studentName], ["Adm. No.", rec.admNo], ["Class", rec.className], ["Date", fmtDate(rec.date)], ["Hostel", rec.hostel || "No"], ["Pay Mode", rec.payMode], ["Collected By", rec.collectedBy], rec.rollNo && ["Roll No.", rec.rollNo]].filter(Boolean).map(function ([k, v]) {
      return React.createElement("div", {
        key: k
      }, React.createElement("span", {
        style: {
          color: "#4a5580",
          fontSize: 11
        }
      }, k), React.createElement("div", {
        style: {
          fontWeight: 700,
          color: "#0a1229"
        }
      }, v));
    })), React.createElement("table", {
      style: {
        width: "100%",
        borderCollapse: "collapse",
        marginBottom: 12
      }
    }, React.createElement("thead", null, React.createElement("tr", {
      style: {
        background: "#f5f7fd"
      }
    }, React.createElement("th", {
      style: {
        padding: "8px 12px",
        textAlign: "left",
        fontSize: 11,
        fontWeight: 700,
        color: "#4a5580",
        textTransform: "uppercase"
      }
    }, "Fee Item"), React.createElement("th", {
      style: {
        padding: "8px 12px",
        textAlign: "right",
        fontSize: 11,
        fontWeight: 700,
        color: "#4a5580",
        textTransform: "uppercase"
      }
    }, "Amount"))), React.createElement("tbody", null, (rec.items || []).map(function (it) {
      return React.createElement("tr", {
        key: it.key,
        style: {
          borderBottom: "1px solid #eaeff8"
        }
      }, React.createElement("td", {
        style: {
          padding: "8px 12px",
          fontSize: 13
        }
      }, it.label), React.createElement("td", {
        style: {
          padding: "8px 12px",
          textAlign: "right",
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 600
        }
      }, fmtINR(it.amount)));
    }), React.createElement("tr", {
      style: {
        background: ACCENT + "11",
        fontWeight: 800
      }
    }, React.createElement("td", {
      style: {
        padding: "10px 12px",
        fontSize: 14,
        color: ACCENT
      }
    }, "TOTAL RECEIVED"), React.createElement("td", {
      style: {
        padding: "10px 12px",
        textAlign: "right",
        fontSize: 16,
        color: GREEN,
        fontFamily: "'JetBrains Mono', monospace"
      }
    }, fmtINR(rec.totalAmount))))), rec.remark && React.createElement("div", {
      style: {
        fontSize: 12,
        color: "#4a5580",
        borderTop: "1px dashed #d0d9ef",
        paddingTop: 10
      }
    }, "Remarks: ", rec.remark), React.createElement("div", {
      style: {
        textAlign: "center",
        marginTop: 24,
        paddingTop: 16,
        borderTop: "2px dashed #d0d9ef",
        fontSize: 12,
        color: "#8896bb"
      }
    }, "This is a computer-generated receipt. Valid without signature.")));
  }
  const FEE_TYPE_COLORS = {
    Admission: {
      bg: "#dcfce7",
      color: "#15803d",
      border: "#86efac"
    },
    Monthly: {
      bg: "#e0e8f9",
      color: ACCENT,
      border: "#93c5fd"
    },
    "Full Payment": {
      bg: "#f3e8ff",
      color: "#7c3aed",
      border: "#d8b4fe"
    },
    Advance: {
      bg: "#fef9c3",
      color: "#854d0e",
      border: "#fde047"
    },
    Items: {
      bg: "#ffedd5",
      color: "#9a3412",
      border: "#fdba74"
    },
    Manual: {
      bg: "#f1f5f9",
      color: "#475569",
      border: "#cbd5e1"
    }
  };
  function FeeRecordsTab({
    refreshKey
  }) {
    const [filterType, setFilterType] = useState("All");
    const [filterClass, setFilterClass] = useState("All");
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("date_desc");
    const allRecords = useMemo(function () {
      const out = [];
      ls("gnsi_adm_integrated", []).forEach(function (r) {
        out.push({
          id: r.id,
          date: r.date,
          type: "Admission",
          studentName: r.studentName,
          className: r.className,
          admNo: r.admNo,
          amount: r.totalAmount,
          receipt: r.receiptNo,
          payMode: r.payMode,
          remark: r.remark,
          collectedBy: r.collectedBy,
          items: r.items
        });
      });
      ls("ims_admrec", []).forEach(function (r) {
        if (!out.find(function (x) {
          return x.id === r.id;
        })) {
          out.push({
            id: r.id,
            date: r.date,
            type: "Admission",
            studentName: r.student,
            className: r.course,
            amount: r.amountPaid,
            receipt: r.receipt,
            remark: r.remark,
            collectedBy: r.collectedBy
          });
        }
      });
      ls("ims_monthrec", []).forEach(function (r) {
        out.push({
          id: r.id,
          date: r.date,
          type: "Monthly",
          studentName: r.student,
          className: r.course,
          amount: r.amountPaid,
          receipt: r.receipt,
          remark: r.remark || (r.forMonth ? `Month: ${r.forMonth}` : ""),
          collectedBy: r.collectedBy
        });
      });
      ls("gnsi_fee_collections", []).forEach(function (r) {
        var _r$createdAt;
        out.push({
          id: r.id,
          date: r.payDate || ((_r$createdAt = r.createdAt) === null || _r$createdAt === void 0 ? void 0 : _r$createdAt.split("T")[0]),
          type: "Monthly",
          studentName: r.studentName,
          className: r.className,
          amount: r.amountPaid,
          receipt: r.receiptNo,
          remark: r.forMonth ? `Month: ${r.forMonth}` : r.remark,
          collectedBy: r.collectedBy
        });
      });
      ls("gnsi_fee_full", []).forEach(function (r) {
        out.push({
          id: r.id,
          date: r.date,
          type: "Full Payment",
          studentName: r.student,
          className: r.course,
          amount: r.amountPaid,
          receipt: r.receipt,
          remark: r.remark,
          collectedBy: r.collectedBy
        });
      });
      ls("gnsi_fee_advance", []).forEach(function (r) {
        out.push({
          id: r.id,
          date: r.date,
          type: "Advance",
          studentName: r.student,
          className: r.course,
          amount: r.amountPaid,
          receipt: r.receipt,
          remark: r.remark,
          collectedBy: r.collectedBy
        });
      });
      ls("gnsi_fee_items", []).forEach(function (r) {
        out.push({
          id: r.id,
          date: r.date,
          type: "Items",
          studentName: r.student,
          amount: r.amountPaid,
          receipt: r.receipt,
          remark: r.remark,
          collectedBy: r.collectedBy,
          items: r.itemsList
        });
      });
      return out;
    }, [refreshKey]);
    const types = ["All", ...Object.keys(FEE_TYPE_COLORS)];
    const classes = ["All", ...COURSES];
    const filtered = useMemo(function () {
      let out = allRecords;
      if (filterType !== "All") out = out.filter(function (r) {
        return r.type === filterType;
      });
      if (filterClass !== "All") out = out.filter(function (r) {
        return r.className === filterClass;
      });
      if (search) {
        const q = search.toLowerCase();
        out = out.filter(function (r) {
          return (r.studentName || "").toLowerCase().includes(q) || (r.receipt || "").toLowerCase().includes(q) || (r.className || "").toLowerCase().includes(q);
        });
      }
      if (sortBy === "date_desc") out = [...out].sort(function (a, b) {
        return (b.date || "") > (a.date || "") ? 1 : -1;
      });
      if (sortBy === "date_asc") out = [...out].sort(function (a, b) {
        return (a.date || "") > (b.date || "") ? 1 : -1;
      });
      if (sortBy === "amount_desc") out = [...out].sort(function (a, b) {
        return (b.amount || 0) - (a.amount || 0);
      });
      if (sortBy === "name_asc") out = [...out].sort(function (a, b) {
        return (a.studentName || "") > (b.studentName || "") ? 1 : -1;
      });
      return out;
    }, [allRecords, filterType, filterClass, search, sortBy]);
    const totalFiltered = filtered.reduce(function (s, r) {
      return s + (r.amount || 0);
    }, 0);
    const byType = {};
    allRecords.forEach(function (r) {
      byType[r.type] = (byType[r.type] || 0) + (r.amount || 0);
    });
    return React.createElement("div", null, React.createElement(SectionHead, {
      icon: "\uD83D\uDCD2",
      title: "Unified Fee Ledger",
      sub: "All fee types \u2014 admission, monthly, full payment, advance, items \u2014 in one searchable, filterable register."
    }), React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: 12,
        marginBottom: 24
      }
    }, React.createElement(Stat, {
      label: "Total Records",
      value: allRecords.length,
      sub: "all types",
      color: ACCENT
    }), Object.entries(byType).map(function ([type, amt]) {
      const c = FEE_TYPE_COLORS[type] || {};
      return React.createElement(Stat, {
        key: type,
        label: type,
        value: fmtINR(amt),
        sub: "collected",
        color: c.color || ACCENT
      });
    })), React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 16,
        alignItems: "center"
      }
    }, React.createElement("input", {
      value: search,
      onChange: function (e) {
        return setSearch(e.target.value);
      },
      placeholder: "\uD83D\uDD0D Search name, receipt, class\u2026",
      style: {
        ...inputStyle,
        width: 240
      }
    }), React.createElement("select", {
      value: filterType,
      onChange: function (e) {
        return setFilterType(e.target.value);
      },
      style: {
        ...selStyle,
        width: 140
      }
    }, types.map(function (t) {
      return React.createElement("option", {
        key: t
      }, t);
    })), React.createElement("select", {
      value: filterClass,
      onChange: function (e) {
        return setFilterClass(e.target.value);
      },
      style: {
        ...selStyle,
        width: 160
      }
    }, classes.map(function (c) {
      return React.createElement("option", {
        key: c
      }, c);
    })), React.createElement("select", {
      value: sortBy,
      onChange: function (e) {
        return setSortBy(e.target.value);
      },
      style: {
        ...selStyle,
        width: 150
      }
    }, React.createElement("option", {
      value: "date_desc"
    }, "Date \u2193 (newest)"), React.createElement("option", {
      value: "date_asc"
    }, "Date \u2191 (oldest)"), React.createElement("option", {
      value: "amount_desc"
    }, "Amount \u2193"), React.createElement("option", {
      value: "name_asc"
    }, "Name A\u2013Z")), React.createElement("div", {
      style: {
        marginLeft: "auto",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 13,
        fontWeight: 700,
        color: GREEN
      }
    }, filtered.length, " records | ", fmtINR(totalFiltered))), React.createElement("div", {
      style: {
        display: "flex",
        gap: 6,
        flexWrap: "wrap",
        marginBottom: 16
      }
    }, types.map(function (t) {
      const c = FEE_TYPE_COLORS[t] || {};
      const active = filterType === t;
      return React.createElement("button", {
        key: t,
        onClick: function () {
          return setFilterType(t);
        },
        style: {
          padding: "5px 14px",
          borderRadius: 20,
          border: `1.5px solid ${active ? c.border || ACCENT : "#d0d9ef"}`,
          background: active ? c.bg || ACCENT_LIGHT : "#fff",
          color: active ? c.color || ACCENT : "#4a5580",
          cursor: "pointer",
          fontWeight: 700,
          fontSize: 12
        }
      }, t === "All" ? "All Types" : t);
    })), React.createElement("div", {
      style: {
        background: "#fff",
        border: "1.5px solid #d0d9ef",
        borderRadius: 12,
        overflow: "hidden"
      }
    }, React.createElement(TableWrap, null, React.createElement("thead", null, React.createElement("tr", null, React.createElement(TH, null, "Date"), React.createElement(TH, null, "Type"), React.createElement(TH, null, "Student"), React.createElement(TH, null, "Class"), React.createElement(TH, null, "Amount"), React.createElement(TH, null, "Receipt"), React.createElement(TH, null, "Pay Mode / Note"))), React.createElement("tbody", null, filtered.length === 0 && React.createElement("tr", null, React.createElement("td", {
      colSpan: 7,
      style: {
        textAlign: "center",
        padding: "32px",
        color: "#8896bb"
      }
    }, "No records match your filter.")), filtered.map(function (r) {
      const c = FEE_TYPE_COLORS[r.type] || {};
      return React.createElement("tr", {
        key: r.id,
        onMouseEnter: function (e) {
          return e.currentTarget.style.background = "#f5f7fd";
        },
        onMouseLeave: function (e) {
          return e.currentTarget.style.background = "";
        }
      }, React.createElement(TD, {
        style: {
          fontSize: 12,
          color: "#4a5580",
          fontFamily: "'JetBrains Mono', monospace",
          whiteSpace: "nowrap"
        }
      }, fmtDate(r.date)), React.createElement(TD, null, React.createElement("span", {
        style: {
          display: "inline-block",
          padding: "3px 10px",
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 700,
          background: c.bg || "#f1f5f9",
          color: c.color || "#475569",
          border: `1px solid ${c.border || "#cbd5e1"}`
        }
      }, r.type)), React.createElement(TD, null, React.createElement("div", {
        style: {
          fontWeight: 700,
          color: "#0a1229"
        }
      }, r.studentName || "--")), React.createElement(TD, {
        style: {
          fontSize: 12,
          color: "#4a5580"
        }
      }, r.className || "--"), React.createElement(TD, null, React.createElement("span", {
        style: {
          fontWeight: 800,
          color: GREEN,
          fontFamily: "'JetBrains Mono', monospace"
        }
      }, fmtINR(r.amount))), React.createElement(TD, {
        style: {
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          color: "#4a5580"
        }
      }, r.receipt || "--"), React.createElement(TD, {
        style: {
          fontSize: 12,
          color: "#4a5580",
          maxWidth: 200
        }
      }, r.remark || "--", r.items && React.createElement("div", {
        style: {
          marginTop: 3
        }
      }, (Array.isArray(r.items) ? r.items : []).map(function (it) {
        return React.createElement(Badge, {
          key: it.key || it.label,
          color: GOLD,
          style: {
            fontSize: 10,
            marginRight: 3
          }
        }, it.label);
      }))));
    })))));
  }
  const MONTHS_LIST = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function StudentFeeTab({
    onToast,
    onRefresh
  }) {
    const [asgns, setAsgns] = useState(function () {
      return ls("gnsi_fee_assignments", []);
    });
    const [cols, setCols] = useState(function () {
      return ls("gnsi_fee_collections", []);
    });
    const [view, setView] = useState("list");
    const [selId, setSelId] = useState(null);
    const [search, setSearch] = useState("");
    const [filterClass, setFilterClass] = useState("All");
    const [collectForm, setCollectForm] = useState({
      amount: 0,
      month: MONTHS_LIST[new Date().getMonth()] + " " + new Date().getFullYear(),
      date: today(),
      mode: "Cash",
      remark: ""
    });
    const [newForm, setNewForm] = useState({
      studentName: "",
      admNo: "",
      rollNo: "",
      className: "",
      hostel: "No",
      enrolledAt: today()
    });
    const [confirmDel, setConfirmDel] = useState(null);
    const [receiptId, setReceiptId] = useState(null);
    const admRecs = useMemo(function () {
      return ls("gnsi_adm_integrated", []);
    }, []);
    const feeConf = useCallback(function (cls) {
      const c = DEFAULT_FEE_CONF[cls] || {};
      return {
        monthly: c.monthly || 10000,
        hostel: c.hostel || 5000
      };
    }, []);
    function calcDue(a) {
      const months = Math.max(1, function () {
        if (!a.enrolledAt) return 1;
        const s = new Date(a.enrolledAt),
          n = new Date();
        return (n.getFullYear() - s.getFullYear()) * 12 + (n.getMonth() - s.getMonth()) + 1;
      }());
      const conf = feeConf(a.className);
      const monthly = conf.monthly + (a.hostel === "Yes" ? conf.hostel : 0);
      const expected = monthly * months;
      const paid = cols.filter(function (c) {
        return c.asgnId === a.id;
      }).reduce(function (s, c) {
        return s + (Number(c.amountPaid) || 0);
      }, 0);
      const adm = admRecs.find(function (r) {
        return r.admNo === a.admNo || r.studentName === a.studentName;
      });
      const admPaid = adm ? adm.totalAmount : 0;
      return {
        expected,
        paid,
        due: Math.max(0, expected - paid),
        months,
        monthly,
        admPaid
      };
    }
    function saveAsgns(arr) {
      lsSet("gnsi_fee_assignments", arr);
      setAsgns(arr);
    }
    function saveCols(arr) {
      lsSet("gnsi_fee_collections", arr);
      setCols(arr);
    }
    function handleAddStudent() {
      if (!newForm.studentName.trim() || !newForm.className) {
        alert("Name and class required.");
        return;
      }
      const rec = {
        id: uid(),
        stuId: uid(),
        ...newForm,
        subTypeId: null,
        courseAssignedAt: null,
        admissionPaid: false,
        createdAt: new Date().toISOString()
      };
      saveAsgns([...asgns, rec]);
      setNewForm({
        studentName: "",
        admNo: "",
        rollNo: "",
        className: "",
        hostel: "No",
        enrolledAt: today()
      });
      onToast(`${newForm.studentName} added to fee system`, GREEN);
      setView("list");
      onRefresh();
    }
    function handleCollect(asgnId) {
      const {
        amount,
        month,
        date,
        mode,
        remark
      } = collectForm;
      if (!amount || amount <= 0) {
        alert("Enter valid amount.");
        return;
      }
      if (!month) {
        alert("Select month.");
        return;
      }
      const a = asgns.find(function (x) {
        return x.id === asgnId;
      });
      if (!a) return;
      const col = {
        id: uid(),
        asgnId,
        receiptNo: "SFA/" + new Date().getFullYear().toString().slice(2) + "/" + String(cols.length + 1).padStart(4, "0"),
        studentName: a.studentName,
        rollNo: a.rollNo || "",
        admNo: a.admNo || "",
        className: a.className,
        forMonth: month,
        amountPaid: Number(amount),
        payMode: mode,
        payDate: date,
        remark,
        collectedBy: "Admin",
        createdAt: new Date().toISOString()
      };
      const newCols = [...cols, col];
      saveCols(newCols);
      const inc = ls("ims_income", []);
      inc.push({
        id: uid(),
        date,
        category: "Fee Collection",
        description: `Monthly fee -- ${a.studentName} (${a.className}) -- ${month}`,
        amount: Number(amount),
        receipt: col.receiptNo,
        source: "StudentFeeAssignment",
        sourceId: col.id,
        createdAt: new Date().toISOString()
      });
      lsSet("ims_income", inc);
      onToast(`Fee collected for ${a.studentName} | Receipt: ${col.receiptNo}`, GREEN);
      setReceiptId(col.id);
      setView("list");
      setSelId(null);
      onRefresh();
    }
    function deleteAsgn(id) {
      saveAsgns(asgns.filter(function (a) {
        return a.id !== id;
      }));
      setConfirmDel(null);
      onToast("Student removed from fee system.", RED);
    }
    const filtered = asgns.filter(function (a) {
      const q = search.toLowerCase();
      return (filterClass === "All" || a.className === filterClass) && (!q || (a.studentName || "").toLowerCase().includes(q) || (a.admNo || "").toLowerCase().includes(q) || (a.rollNo || "").toLowerCase().includes(q));
    });
    const totalDue = asgns.reduce(function (s, a) {
      return s + calcDue(a).due;
    }, 0);
    const totalCollected = cols.reduce(function (s, c) {
      return s + (Number(c.amountPaid) || 0);
    }, 0);
    const overdue = asgns.filter(function (a) {
      return calcDue(a).due > 0;
    }).length;
    const receiptCol = receiptId ? cols.find(function (c) {
      return c.id === receiptId;
    }) : null;
    if (receiptCol) {
      const a = asgns.find(function (x) {
        return x.id === receiptCol.asgnId;
      });
      return React.createElement("div", null, React.createElement("div", {
        style: {
          display: "flex",
          gap: 10,
          marginBottom: 16
        }
      }, React.createElement("button", {
        onClick: function () {
          return setReceiptId(null);
        },
        style: {
          padding: "8px 16px",
          borderRadius: 8,
          border: "1.5px solid #d0d9ef",
          background: "#fff",
          cursor: "pointer",
          fontWeight: 600,
          color: "#4a5580"
        }
      }, "\u2190 Back"), React.createElement("button", {
        onClick: function () {
          return window.print();
        },
        style: {
          padding: "8px 16px",
          borderRadius: 8,
          background: ACCENT,
          color: "#fff",
          border: "none",
          cursor: "pointer",
          fontWeight: 700
        }
      }, "\uD83D\uDDA8\uFE0F Print")), React.createElement("div", {
        style: {
          maxWidth: 520,
          margin: "0 auto",
          background: "#fff",
          border: "2px solid " + ACCENT,
          borderRadius: 16,
          padding: 28
        }
      }, React.createElement("div", {
        style: {
          textAlign: "center",
          borderBottom: "2px dashed #d0d9ef",
          paddingBottom: 14,
          marginBottom: 16
        }
      }, React.createElement("div", {
        style: {
          fontSize: 11,
          color: "#4a5580",
          letterSpacing: "0.15em",
          textTransform: "uppercase"
        }
      }, (window.TENANT?window.TENANT.name:"Guidance Navodaya & Sainik Institute")), React.createElement("div", {
        style: {
          fontSize: 18,
          fontWeight: 800,
          color: ACCENT
        }
      }, "MONTHLY FEE RECEIPT"), React.createElement("div", {
        style: {
          fontSize: 12,
          color: "#8896bb"
        }
      }, "Receipt: ", React.createElement("b", {
        style: {
          color: ACCENT,
          fontFamily: "'JetBrains Mono', monospace"
        }
      }, receiptCol.receiptNo))), React.createElement("div", {
        style: {
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "6px 16px",
          fontSize: 13
        }
      }, [["Student", receiptCol.studentName], ["Class", receiptCol.className], ["Adm No.", receiptCol.admNo || "--"], ["For Month", receiptCol.forMonth], ["Pay Date", fmtDate(receiptCol.payDate)], ["Pay Mode", receiptCol.payMode]].map(function ([k, v]) {
        return React.createElement("div", {
          key: k
        }, React.createElement("span", {
          style: {
            color: "#4a5580",
            fontSize: 11
          }
        }, k), React.createElement("div", {
          style: {
            fontWeight: 700
          }
        }, v));
      })), React.createElement("div", {
        style: {
          margin: "16px 0",
          padding: "12px 16px",
          background: "#e0e8f9",
          borderRadius: 10,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }
      }, React.createElement("span", {
        style: {
          fontWeight: 700,
          color: ACCENT
        }
      }, "Amount Paid"), React.createElement("span", {
        style: {
          fontSize: 20,
          fontWeight: 900,
          color: GREEN,
          fontFamily: "'JetBrains Mono', monospace"
        }
      }, fmtINR(receiptCol.amountPaid))), receiptCol.remark && React.createElement("div", {
        style: {
          fontSize: 12,
          color: "#4a5580"
        }
      }, "Remarks: ", receiptCol.remark)));
    }
    return React.createElement("div", null, React.createElement(SectionHead, {
      icon: "\uD83D\uDCB3",
      title: "Student Fee Assignment",
      sub: "Each student has a fee profile. Admission links auto-matched. Monthly dues tracked. One-click collection."
    }), React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
        gap: 12,
        marginBottom: 24
      }
    }, React.createElement(Stat, {
      label: "Students",
      value: asgns.length,
      sub: "in fee system",
      color: ACCENT
    }), React.createElement(Stat, {
      label: "Collected",
      value: fmtINR(totalCollected),
      sub: "all time",
      color: GREEN
    }), React.createElement(Stat, {
      label: "Pending Due",
      value: fmtINR(totalDue),
      sub: "estimated",
      color: RED
    }), React.createElement(Stat, {
      label: "Overdue",
      value: overdue,
      sub: "students with dues",
      color: GOLD
    })), React.createElement("div", {
      style: {
        display: "flex",
        gap: 8,
        marginBottom: 20,
        flexWrap: "wrap"
      }
    }, [["list", "👥", "Students"], ["assign", "➕", "Add Student"], ["dues", "⏳", "Pending Dues"]].map(function ([id, icon, label]) {
      return React.createElement("button", {
        key: id,
        onClick: function () {
          return setView(id);
        },
        style: {
          padding: "8px 18px",
          borderRadius: 8,
          cursor: "pointer",
          fontWeight: 700,
          fontSize: 13,
          background: view === id ? ACCENT : "#fff",
          color: view === id ? "#fff" : ACCENT,
          border: `1.5px solid ${ACCENT}`
        }
      }, icon, " ", label);
    })), view === "assign" && React.createElement("div", {
      style: {
        background: "#fff",
        border: "2px solid " + ACCENT,
        borderRadius: 14,
        padding: 24,
        marginBottom: 24
      }
    }, React.createElement("div", {
      style: {
        fontSize: 15,
        fontWeight: 800,
        color: ACCENT,
        marginBottom: 18
      }
    }, "\u2795 Add Student to Fee System"), React.createElement("div", {
      style: {
        background: "#e0e8f9",
        border: "1px solid #93c5fd",
        borderRadius: 8,
        padding: "10px 14px",
        marginBottom: 16,
        fontSize: 12,
        color: ACCENT
      }
    }, "\uD83D\uDCA1 ", React.createElement("b", null, "Tip:"), " If you already recorded an ", React.createElement("b", null, "Admission Fee"), " for this student, their admission receipt will auto-link when the Adm. No. matches."), React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: 14
      }
    }, React.createElement(Field, {
      label: "Student Name *"
    }, React.createElement("input", {
      value: newForm.studentName,
      onChange: function (e) {
        return setNewForm(function (f) {
          return {
            ...f,
            studentName: e.target.value
          };
        });
      },
      placeholder: "Full name",
      style: inputStyle
    })), React.createElement(Field, {
      label: "Admission No."
    }, React.createElement("input", {
      value: newForm.admNo,
      onChange: function (e) {
        return setNewForm(function (f) {
          return {
            ...f,
            admNo: e.target.value
          };
        });
      },
      placeholder: "Same as Admission record",
      style: inputStyle
    })), React.createElement(Field, {
      label: "Roll No."
    }, React.createElement("input", {
      value: newForm.rollNo,
      onChange: function (e) {
        return setNewForm(function (f) {
          return {
            ...f,
            rollNo: e.target.value
          };
        });
      },
      style: inputStyle
    })), React.createElement(Field, {
      label: "Class *"
    }, React.createElement("select", {
      value: newForm.className,
      onChange: function (e) {
        return setNewForm(function (f) {
          return {
            ...f,
            className: e.target.value
          };
        });
      },
      style: selStyle
    }, React.createElement("option", {
      value: ""
    }, "\u2014 Select \u2014"), COURSES.map(function (c) {
      return React.createElement("option", {
        key: c
      }, c);
    }))), React.createElement(Field, {
      label: "Hostel"
    }, React.createElement("select", {
      value: newForm.hostel,
      onChange: function (e) {
        return setNewForm(function (f) {
          return {
            ...f,
            hostel: e.target.value
          };
        });
      },
      style: selStyle
    }, React.createElement("option", null, "No"), React.createElement("option", null, "Yes"))), React.createElement(Field, {
      label: "Enrolled Date"
    }, React.createElement("input", {
      type: "date",
      value: newForm.enrolledAt,
      onChange: function (e) {
        return setNewForm(function (f) {
          return {
            ...f,
            enrolledAt: e.target.value
          };
        });
      },
      style: inputStyle
    }))), React.createElement("div", {
      style: {
        marginTop: 16,
        display: "flex",
        gap: 10
      }
    }, React.createElement("button", {
      onClick: handleAddStudent,
      style: {
        padding: "10px 24px",
        borderRadius: 8,
        background: ACCENT,
        color: "#fff",
        border: "none",
        cursor: "pointer",
        fontWeight: 800
      }
    }, "\uD83D\uDCBE Add Student"), React.createElement("button", {
      onClick: function () {
        return setView("list");
      },
      style: {
        padding: "10px 18px",
        borderRadius: 8,
        border: "1.5px solid #d0d9ef",
        background: "#fff",
        cursor: "pointer",
        fontWeight: 600,
        color: "#4a5580"
      }
    }, "Cancel"))), selId && view === "collect" && function () {
      const a = asgns.find(function (x) {
        return x.id === selId;
      });
      if (!a) return null;
      const due = calcDue(a);
      return React.createElement("div", {
        style: {
          background: "#fff",
          border: "2px solid " + GREEN,
          borderRadius: 14,
          padding: 24,
          marginBottom: 24
        }
      }, React.createElement("div", {
        style: {
          fontSize: 15,
          fontWeight: 800,
          color: GREEN,
          marginBottom: 4
        }
      }, "\uD83D\uDCB0 Collect Fee \u2014 ", a.studentName), React.createElement("div", {
        style: {
          fontSize: 12,
          color: "#4a5580",
          marginBottom: 16
        }
      }, a.className, " ", a.hostel === "Yes" ? "| Hostel" : "", " | Expected this month: ", React.createElement("b", {
        style: {
          color: ACCENT
        }
      }, fmtINR(due.monthly)), " | Balance due: ", React.createElement("b", {
        style: {
          color: RED
        }
      }, fmtINR(due.due))), React.createElement("div", {
        style: {
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
          gap: 14,
          marginBottom: 16
        }
      }, React.createElement(Field, {
        label: "Amount (\u20B9) *"
      }, React.createElement("div", {
        style: {
          display: "flex",
          gap: 6
        }
      }, React.createElement("input", {
        type: "number",
        value: collectForm.amount,
        onChange: function (e) {
          return setCollectForm(function (f) {
            return {
              ...f,
              amount: e.target.value
            };
          });
        },
        style: {
          ...inputStyle,
          fontFamily: "'JetBrains Mono', monospace"
        }
      }), React.createElement("button", {
        onClick: function () {
          return setCollectForm(function (f) {
            return {
              ...f,
              amount: due.monthly
            };
          });
        },
        style: {
          padding: "8px 10px",
          borderRadius: 6,
          border: "1px solid " + ACCENT,
          background: ACCENT_LIGHT,
          color: ACCENT,
          cursor: "pointer",
          fontWeight: 700,
          fontSize: 11,
          whiteSpace: "nowrap"
        }
      }, "Auto-fill"))), React.createElement(Field, {
        label: "For Month"
      }, React.createElement("select", {
        value: collectForm.month,
        onChange: function (e) {
          return setCollectForm(function (f) {
            return {
              ...f,
              month: e.target.value
            };
          });
        },
        style: selStyle
      }, MONTHS_LIST.map(function (m) {
        const y = new Date().getFullYear();
        return [y - 1, y, y + 1].map(function (yr) {
          return React.createElement("option", {
            key: m + yr,
            value: `${m} ${yr}`
          }, m, " ", yr);
        });
      }))), React.createElement(Field, {
        label: "Date"
      }, React.createElement("input", {
        type: "date",
        value: collectForm.date,
        onChange: function (e) {
          return setCollectForm(function (f) {
            return {
              ...f,
              date: e.target.value
            };
          });
        },
        style: inputStyle
      })), React.createElement(Field, {
        label: "Pay Mode"
      }, React.createElement("select", {
        value: collectForm.mode,
        onChange: function (e) {
          return setCollectForm(function (f) {
            return {
              ...f,
              mode: e.target.value
            };
          });
        },
        style: selStyle
      }, ["Cash", "UPI / GPay", "NEFT / RTGS", "Cheque", "DD", "Card"].map(function (m) {
        return React.createElement("option", {
          key: m
        }, m);
      }))), React.createElement(Field, {
        label: "Remarks"
      }, React.createElement("input", {
        value: collectForm.remark,
        onChange: function (e) {
          return setCollectForm(function (f) {
            return {
              ...f,
              remark: e.target.value
            };
          });
        },
        placeholder: "Optional",
        style: inputStyle
      }))), React.createElement("div", {
        style: {
          display: "flex",
          gap: 10
        }
      }, React.createElement("button", {
        onClick: function () {
          return handleCollect(selId);
        },
        style: {
          padding: "10px 24px",
          borderRadius: 8,
          background: GREEN,
          color: "#fff",
          border: "none",
          cursor: "pointer",
          fontWeight: 800
        }
      }, "\u2705 Save & Print Receipt"), React.createElement("button", {
        onClick: function () {
          setSelId(null);
          setView("list");
        },
        style: {
          padding: "10px 18px",
          borderRadius: 8,
          border: "1.5px solid #d0d9ef",
          background: "#fff",
          cursor: "pointer",
          fontWeight: 600,
          color: "#4a5580"
        }
      }, "Cancel")));
    }(), (view === "list" || view === "assign") && React.createElement(React.Fragment, null, React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        marginBottom: 14,
        flexWrap: "wrap"
      }
    }, React.createElement("input", {
      value: search,
      onChange: function (e) {
        return setSearch(e.target.value);
      },
      placeholder: "\uD83D\uDD0D Search student, adm no, roll no\u2026",
      style: {
        ...inputStyle,
        width: 250
      }
    }), React.createElement("select", {
      value: filterClass,
      onChange: function (e) {
        return setFilterClass(e.target.value);
      },
      style: {
        ...selStyle,
        width: 160
      }
    }, React.createElement("option", {
      value: "All"
    }, "All Classes"), COURSES.map(function (c) {
      return React.createElement("option", {
        key: c
      }, c);
    }))), React.createElement("div", {
      style: {
        background: "#fff",
        border: "1.5px solid #d0d9ef",
        borderRadius: 12,
        overflow: "hidden"
      }
    }, React.createElement(TableWrap, null, React.createElement("thead", null, React.createElement("tr", null, React.createElement(TH, null, "Student"), React.createElement(TH, null, "Class"), React.createElement(TH, null, "Adm. Linked?"), React.createElement(TH, null, "Monthly Fee"), React.createElement(TH, null, "Total Paid"), React.createElement(TH, null, "Due"), React.createElement(TH, null, "Actions"))), React.createElement("tbody", null, filtered.length === 0 && React.createElement("tr", null, React.createElement("td", {
      colSpan: 7,
      style: {
        textAlign: "center",
        padding: "32px",
        color: "#8896bb"
      }
    }, "No students yet. ", React.createElement("button", {
      onClick: function () {
        return setView("assign");
      },
      style: {
        color: ACCENT,
        fontWeight: 700,
        background: "none",
        border: "none",
        cursor: "pointer",
        textDecoration: "underline"
      }
    }, "Add student \u2192"))), filtered.map(function (a) {
      const due = calcDue(a);
      const adm = admRecs.find(function (r) {
        return r.admNo === a.admNo || r.studentName === a.studentName;
      });
      return React.createElement("tr", {
        key: a.id,
        onMouseEnter: function (e) {
          return e.currentTarget.style.background = "#f5f7fd";
        },
        onMouseLeave: function (e) {
          return e.currentTarget.style.background = due.due > 0 ? "#fff9f9" : "";
        },
        style: {
          background: due.due > 0 ? "#fff9f9" : ""
        }
      }, React.createElement(TD, null, React.createElement("div", {
        style: {
          fontWeight: 700
        }
      }, a.studentName), React.createElement("div", {
        style: {
          fontSize: 11,
          color: "#8896bb"
        }
      }, a.admNo && `ADM: ${a.admNo}`, " ", a.rollNo && `| #${a.rollNo}`), a.hostel === "Yes" && React.createElement(Badge, {
        color: "#7c3aed",
        style: {
          fontSize: 10
        }
      }, "Hostel")), React.createElement(TD, null, React.createElement(Badge, {
        color: ACCENT
      }, a.className || "--")), React.createElement(TD, null, adm ? React.createElement("div", null, React.createElement(Badge, {
        color: GREEN
      }, "\u2713 Linked"), React.createElement("div", {
        style: {
          fontSize: 11,
          color: "#4a5580",
          marginTop: 3
        }
      }, fmtINR(adm.totalAmount), " | ", fmtDate(adm.date))) : React.createElement(Badge, {
        color: "#94a3b8"
      }, "Not recorded")), React.createElement(TD, {
        style: {
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 700,
          color: ACCENT
        }
      }, fmtINR(due.monthly), React.createElement("span", {
        style: {
          fontSize: 10,
          color: "#8896bb",
          fontWeight: 400
        }
      }, "/mo")), React.createElement(TD, {
        style: {
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 700,
          color: GREEN
        }
      }, fmtINR(due.paid)), React.createElement(TD, null, due.due > 0 ? React.createElement("span", {
        style: {
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 800,
          color: RED
        }
      }, fmtINR(due.due)) : React.createElement(Badge, {
        color: GREEN
      }, "\u2705 Clear")), React.createElement(TD, null, React.createElement("div", {
        style: {
          display: "flex",
          gap: 5,
          flexWrap: "wrap"
        }
      }, React.createElement("button", {
        onClick: function () {
          setSelId(a.id);
          setView("collect");
          setCollectForm(function (f) {
            return {
              ...f,
              amount: due.monthly
            };
          });
        },
        style: {
          padding: "4px 10px",
          borderRadius: 6,
          border: "1px solid #86efac",
          background: "#dcfce7",
          color: GREEN,
          cursor: "pointer",
          fontSize: 11,
          fontWeight: 700
        }
      }, "\uD83D\uDCB0 Collect"), React.createElement("button", {
        onClick: function () {
          return setConfirmDel(a.id);
        },
        style: {
          padding: "4px 9px",
          borderRadius: 6,
          border: "1px solid #fca5a5",
          background: "#fee2e2",
          color: RED,
          cursor: "pointer",
          fontSize: 11,
          fontWeight: 700
        }
      }, "\uD83D\uDDD1"))));
    }))))), view === "dues" && React.createElement("div", {
      style: {
        background: "#fff",
        border: "1.5px solid #d0d9ef",
        borderRadius: 12,
        overflow: "hidden"
      }
    }, React.createElement("div", {
      style: {
        padding: "14px 18px",
        borderBottom: "1px solid #eaeff8",
        display: "flex",
        alignItems: "center",
        gap: 10
      }
    }, React.createElement("span", {
      style: {
        fontWeight: 800,
        color: RED
      }
    }, "\u23F3 Pending Dues \u2014 Students with Balance")), React.createElement(TableWrap, null, React.createElement("thead", null, React.createElement("tr", null, React.createElement(TH, null, "Student"), React.createElement(TH, null, "Class"), React.createElement(TH, null, "Months"), React.createElement(TH, null, "Expected"), React.createElement(TH, null, "Paid"), React.createElement(TH, null, "Due"), React.createElement(TH, null, "Action"))), React.createElement("tbody", null, asgns.filter(function (a) {
      return calcDue(a).due > 0;
    }).map(function (a) {
      const d = calcDue(a);
      return React.createElement("tr", {
        key: a.id,
        style: {
          background: "#fff9f9"
        }
      }, React.createElement(TD, null, React.createElement("div", {
        style: {
          fontWeight: 700
        }
      }, a.studentName), React.createElement("div", {
        style: {
          fontSize: 11,
          color: "#8896bb"
        }
      }, a.admNo)), React.createElement(TD, null, React.createElement(Badge, {
        color: ACCENT
      }, a.className)), React.createElement(TD, {
        style: {
          color: "#4a5580"
        }
      }, d.months, " mo"), React.createElement(TD, {
        style: {
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 700
        }
      }, fmtINR(d.expected)), React.createElement(TD, {
        style: {
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 700,
          color: GREEN
        }
      }, fmtINR(d.paid)), React.createElement(TD, {
        style: {
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 800,
          color: RED
        }
      }, fmtINR(d.due)), React.createElement(TD, null, React.createElement("button", {
        onClick: function () {
          setSelId(a.id);
          setView("collect");
          setCollectForm(function (f) {
            return {
              ...f,
              amount: d.monthly
            };
          });
        },
        style: {
          padding: "4px 12px",
          borderRadius: 6,
          border: "1px solid #fca5a5",
          background: "#fee2e2",
          color: RED,
          cursor: "pointer",
          fontSize: 11,
          fontWeight: 700
        }
      }, "\uD83D\uDCB0 Collect Now")));
    }), asgns.filter(function (a) {
      return calcDue(a).due > 0;
    }).length === 0 && React.createElement("tr", null, React.createElement("td", {
      colSpan: 7,
      style: {
        textAlign: "center",
        padding: "32px",
        color: GREEN,
        fontWeight: 700
      }
    }, "\u2705 No pending dues! All students are clear."))))), confirmDel && React.createElement(Confirm, {
      msg: "Remove this student from the fee system? Collection history will remain.",
      onOk: function () {
        return deleteAsgn(confirmDel);
      },
      onCancel: function () {
        return setConfirmDel(null);
      }
    }));
  }
  function FeeManagement() {
    const [tab, setTab] = useState("admission");
    const [toast, setToast] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const onToast = useCallback(function (msg, color = GREEN) {
      setToast({
        msg,
        color
      });
      setTimeout(function () {
        return setToast(null);
      }, 4000);
    }, []);
    const onRefresh = useCallback(function () {
      return setRefreshKey(function (k) {
        return k + 1;
      });
    }, []);
    const TABS = [{
      id: "admission",
      icon: "🎓",
      label: "Admission + Items"
    }, {
      id: "records",
      icon: "📒",
      label: "Fee Ledger"
    }, {
      id: "students",
      icon: "💳",
      label: "Fee Assignment"
    }];
    return React.createElement("div", {
      style: {
        fontFamily: "'DM Sans', sans-serif",
        background: "#f0f3fa",
        minHeight: "100vh",
        color: "#0a1229"
      }
    }, React.createElement("div", {
      style: {
        background: "linear-gradient(90deg, #0b1e6e 0%, #1433a8 100%)",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        gap: 20,
        height: 56,
        position: "sticky",
        top: 0,
        zIndex: 100
      }
    }, React.createElement("div", {
      style: {
        fontFamily: "'Nunito', sans-serif",
        fontWeight: 900,
        fontSize: 17,
        color: "#fff",
        letterSpacing: "0.01em"
      }
    }, "\uD83C\uDFEB GNSI Fee Management"), React.createElement("div", {
      style: {
        marginLeft: "auto",
        display: "flex",
        gap: 2
      }
    }, TABS.map(function (t) {
      return React.createElement("button", {
        key: t.id,
        onClick: function () {
          return setTab(t.id);
        },
        style: {
          padding: "8px 16px",
          borderRadius: 8,
          border: "none",
          cursor: "pointer",
          fontWeight: 700,
          fontSize: 13,
          background: tab === t.id ? "rgba(255,255,255,0.2)" : "transparent",
          color: tab === t.id ? "#fff" : "rgba(255,255,255,0.7)",
          fontFamily: "'DM Sans', sans-serif"
        }
      }, t.icon, " ", t.label);
    }))), React.createElement("div", {
      style: {
        background: "#1433a811",
        borderBottom: "1px solid #d0d9ef",
        padding: "8px 24px",
        display: "flex",
        gap: 20,
        flexWrap: "wrap",
        alignItems: "center"
      }
    }, React.createElement("span", {
      style: {
        fontSize: 12,
        color: "#4a5580"
      }
    }, "\uD83D\uDD17 ", React.createElement("b", null, "Integrated:"), " Admission \u2192 Auto-creates Fee Assignment \xA0|\xA0 Items \u2192 Credited to Income Ledger individually \xA0|\xA0 Monthly collection \u2192 Linked to Admission record")), React.createElement("div", {
      style: {
        padding: "24px 24px"
      }
    }, tab === "admission" && React.createElement(AdmissionTab, {
      onToast: onToast,
      onRefresh: onRefresh
    }), tab === "records" && React.createElement(FeeRecordsTab, {
      refreshKey: refreshKey
    }), tab === "students" && React.createElement(StudentFeeTab, {
      onToast: onToast,
      onRefresh: onRefresh
    })), toast && React.createElement(Toast, {
      msg: toast.msg,
      color: toast.color,
      onClose: function () {
        return setToast(null);
      }
    }));
  }
  window.FeeManagement = FeeManagement;
})(window.React, window.ReactDOM);
}
</script>
<script>
/* ══════════════════════════════════════════════════════
   GNSI COURSE-PATTERN AUTO-INIT  (injected patch v1)
   Seeds per-class subjects, max marks & pass marks
   from the 2026 exam pattern xlsx data.
   Only seeds if not already configured.
   ══════════════════════════════════════════════════════ */
/* FIX: declare DEFAULT arrays here so loadExamSubjects/loadExamTypes
   can safely fall back to them when called before their var-assignment
   lines execute (var assignments are not hoisted, only declarations are). */
if(typeof EXAM_TYPES_DEFAULT==='undefined')
  var EXAM_TYPES_DEFAULT=['Unit Test I','2nd Test','Unit Test II','Half-Yearly','Annual'];
if(typeof EXAM_SUBJECTS_DEFAULT==='undefined')
  var EXAM_SUBJECTS_DEFAULT=['English','Hindi','Mathematics','Science','Social Science','GK / Current Affairs','Reasoning','Computer'];
document.addEventListener('DOMContentLoaded', function gnsiInitCoursePattern(){
  /* All inline scripts parsed — load functions guaranteed to exist */
  if(typeof loadClassSubjects !== 'function'||typeof loadExamSubjects !== 'function') return;
  /* ── GNSI v65: Full subject/marks spec ── */
  var CLASS_SUBJECTS={
    /* ── Phase 1: Intake / KBT classes ── */
    'Combined Old':   ['Mathematics-I','Mathematics-II','English Grammar','Vocabulary','Reasoning','Science','GK'],
    'Combined New':   ['Mathematics-I','Mathematics-II','English Grammar','Vocabulary','Reasoning','Science','GK'],
    'Navodaya Old':   ['Meitei Mayek','Mathematics-I','Mathematics-II','English Grammar','Mental'],
    'Navodaya New':   ['Mathematics-I','Mathematics-II','English Grammar','Vocabulary','Reasoning','Science','GK'],
    'Foundation A':   ['Mathematics-I','Mathematics-II','English Grammar','Vocabulary','Reasoning','Science','GK'],
    'Foundation B':   ['Mathematics-I','Mathematics-II','English Grammar','Vocabulary','Reasoning','Science','GK'],
    /* ── Phase 2: Course classes (post-KBT) ── */
    'Sainik (Old)':   ['Mathematics-I','Mathematics-II','English Grammar','Vocabulary','Reasoning','Science','GK'],
    'Combined (New)': ['Mathematics-I','Mathematics-II','English Grammar','Vocabulary','Reasoning','Science','GK'],
    'Combined (Old)': ['Mathematics-I','Mathematics-II','English Grammar','Vocabulary','Reasoning','Science','GK'],
    'Navodaya (Old)': ['Meitei Mayek','Mathematics-I','Mathematics-II','English Grammar','Mental'],
    'Navodaya (New)': ['Mathematics-I','Mathematics-II','English Grammar','Vocabulary','Reasoning','Science','GK'],
    'Foundation V':   ['Mathematics','English Grammar','Vocabulary','Reasoning','Science','Hindi'],
    'Foundation IV':  ['Mathematics','English Grammar','Vocabulary','Reasoning','Science','Hindi']
  };
  var GLOBAL_MAX={
    'Mathematics-I':20,'Mathematics-II':20,'Mathematics':20,
    'English Grammar':10,'Vocabulary':10,'Reasoning':20,
    'Science':10,'GK':10,'Mental':20,'Hindi':10,
    'General Knowledge':10,'Meitei Mayek':10,'Mental Ability':20
  };
  var GLOBAL_MIN={
    'Mathematics-I':8,'Mathematics-II':8,'Mathematics':8,
    'English Grammar':4,'Vocabulary':4,'Reasoning':8,
    'Science':4,'GK':4,'Mental':8,'Hindi':4,'Meitei Mayek':8,
    'General Knowledge':4,'Mental Ability':8
  };
  /* Class-specific max overrides */
  var CLASS_MAX_OVERRIDES={
    'Navodaya (Old)':{'Meitei Mayek':20,'English Grammar':20},
    'Navodaya Old':  {'Meitei Mayek':20,'English Grammar':20},
    'Foundation V':  {'Mathematics':20,'English Grammar':20,'Vocabulary':20,'Reasoning':20,'Science':10,'Hindi':10},
    'Foundation IV': {'Mathematics':20,'English Grammar':20,'Vocabulary':20,'Reasoning':20,'Science':10,'Hindi':10}
  };
  /* 1. Seed per-class subjects */
  var csMap=loadClassSubjects(),csChg=false;
  Object.keys(CLASS_SUBJECTS).forEach(function(cls){
    if(!csMap[cls]||!Array.isArray(csMap[cls])||!csMap[cls].length){
      csMap[cls]=CLASS_SUBJECTS[cls];csChg=true;
    }
  });
  if(csChg)saveClassSubjects(csMap);
  /* 2. Seed global subject max marks */
  var smm=loadSubjectMaxMarks(),smmChg=false;
  Object.keys(GLOBAL_MAX).forEach(function(s){
    if(smm[s]===undefined){smm[s]=GLOBAL_MAX[s];smmChg=true;}
  });
  if(smmChg)saveSubjectMaxMarks(smm);
  /* 3. Seed global pass (min) marks */
  var smn=loadSubjectMinMarks(),smnChg=false;
  Object.keys(GLOBAL_MIN).forEach(function(s){
    if(smn[s]===undefined){smn[s]=GLOBAL_MIN[s];smnChg=true;}
  });
  if(smnChg)saveSubjectMinMarks(smn);
  /* 4. Seed per-class max mark overrides */
  var cmm=loadClassMaxMarks(),cmmChg=false;
  Object.keys(CLASS_MAX_OVERRIDES).forEach(function(cls){
    if(!cmm[cls])cmm[cls]={};
    Object.keys(CLASS_MAX_OVERRIDES[cls]).forEach(function(sub){
      if(cmm[cls][sub]===undefined){cmm[cls][sub]=CLASS_MAX_OVERRIDES[cls][sub];cmmChg=true;}
    });
  });
  if(cmmChg){localStorage.setItem('gnsi_class_maxmarks',JSON.stringify(cmm));if(typeof gnsiKVPush==='function')gnsiKVPush('gnsi_class_maxmarks',cmm);}
  /* 5. Register new subjects in the global EXAM_SUBJECTS union */
  var allSubs=[],curSubs=loadExamSubjects(),subsChg=false;
  Object.values(CLASS_SUBJECTS).forEach(function(arr){
    arr.forEach(function(s){if(allSubs.indexOf(s)<0)allSubs.push(s);});
  });
  allSubs.forEach(function(s){if(curSubs.indexOf(s)<0){curSubs.push(s);subsChg=true;}});
  if(subsChg)saveExamSubjects(curSubs);
});
/* -- SHARED PRINT WINDOW HELPER (enhanced) -- */
function rptOpenPrintWindowFull(title, subtitle, bodyHTML) {
  var w = window.open('', '_blank', 'width=960,height=820');
  if (!w) { if(typeof showToast==='function')showToast('⚠ Popup blocked. Allow popups to open PDF reports.','#d97706'); return; }
  var css = 'body{font-family:Calibri,Arial,sans-serif;background:#f4f1eb;padding:28px;color:#0a1229}'
    + '.wrap{background:#fff;border-radius:14px;padding:32px;max-width:900px;margin:0 auto;box-shadow:0 4px 32px rgba(0,0,0,0.13)}'
    + '.hdr{background:linear-gradient(135deg,#0b1e6e,#1433a8);color:#fff;border-radius:10px;padding:20px 26px;margin-bottom:24px}'
    + '.hdr h1{font-size:22px;margin:0 0 4px;font-family:"Times New Roman",serif}'
    + '.hdr p{font-size:11px;margin:0;opacity:0.82;letter-spacing:0.06em}'
    + '.section-title{font-size:16px;font-weight:700;color:#1433a8;margin:22px 0 10px;font-family:"Times New Roman",serif;border-bottom:2px solid #1433a8;padding-bottom:4px}'
    + 'table{width:100%;border-collapse:collapse;margin-bottom:18px}'
    + 'th{background:#1433a8;color:#fff;padding:9px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.08em}'
    + 'td{padding:8px 12px;border-bottom:1px solid #d0d9ef;font-size:12.5px}'
    + 'tr:nth-child(even){background:#f5f7fd}'
    + '.footer{font-size:11px;color:#6474a0;text-align:center;border-top:1px solid #d0d9ef;padding-top:12px;margin-top:16px}'
    + '.no-print{margin-bottom:16px;display:flex;gap:10px}'
    + '.sig-row{display:flex;justify-content:space-between;margin-top:48px}'
    + '.sig-box{text-align:center;border-top:1px solid #000;padding-top:6px;width:200px;font-size:12px}'
    + '@media print{.no-print{display:none!important}body{background:#fff;padding:0}.wrap{box-shadow:none;border-radius:0}}';
  w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + esc(title) + '</title><style>' + css + '</style></head><body>'
    + '<div class="wrap">'
    + '<div class="hdr"><h1>' + esc(title) + '</h1><p>' + esc(subtitle) + '</p></div>'
    + '<div class="no-print"><button onclick="window.print()" style="background:#1433a8;color:#fff;border:none;border-radius:8px;padding:10px 22px;cursor:pointer;font-weight:700;font-size:13px;font-family:Calibri,sans-serif">🖨️ Print / Save as PDF</button>'
    + '<button onclick="window.close()" style="background:#f0f4fb;color:#3d4f80;border:1px solid #c8d4ee;border-radius:8px;padding:10px 16px;cursor:pointer;font-weight:600;font-size:13px;font-family:Calibri,sans-serif">✕ Close</button></div>'
    + bodyHTML
    + '<div class="sig-row"><div class="sig-box">Prepared By</div><div class="sig-box">Head of Institute</div></div>'
    + '<div class="footer">Guidance Navodaya &amp; Sainik Institute &nbsp;|&nbsp; Khangabok Sorok Wangma, Thoubal, Manipur &nbsp;|&nbsp; Generated: ' + new Date().toLocaleString('en-IN') + '</div>'
    + '</div>');
  w.document.close();
}
</script>
<!-- ═══════════ GNSI PERIOD-SALARY × LEAVE × SUBSTITUTE INTEGRATION v1.0 ═══════════ -->
<script>
/*
  Integration layer -- wires Leave Management and Substitute Roster into
  Period Salary so the salary report reflects reality:
  1. gnsiLeaveDaysInMonth(staffName, yyyymm)
     → returns count of approved leave days that fall in the given month
  2. gnsiSubsInMonth(staffName, yyyymm)
     → returns {asAbsent, asSubstitute} counts from the Substitute Roster
  3. gnsiAutoSyncSubsToPA(date)
     → writes substitute-roster entries for `date` into the patt store
        so Period Attendance and Sub Roster are never out of sync
  4. renderSalReport() is patched to add Leave column and use unified counts
  5. renderPATab() is patched to show a Leave Alert banner for any teacher
     who has an approved leave on the selected date
  6. renderSubstitute() is patched to show a "Sync to Period Attendance" button
  7. gnsiLeaveDecision() is patched: on Approve, auto-assign substitute slots
     if leave date matches today and a sub exists in the roster
  8. Salary slip gains a Leave section
*/
/* --- 1. Leave helpers ----------------------------------------------- */
function gnsiLeaveDaysInMonth(staffName, yyyymm) {
  var leaves = (typeof gnsiLeaves === 'function') ? gnsiLeaves() : [];
  var days = 0;
  leaves.forEach(function(l) {
    if(l.status !== 'Approved') return;
    // match by name (Leave stores staffName)
    if((l.staffName || '').toLowerCase() !== staffName.toLowerCase()) return;
    var from = new Date(l.from);
    var to   = new Date(l.to);
    // iterate days in range and count those in yyyymm
    var cur = new Date(from);
    while(cur <= to) {
      var m = cur.toISOString().slice(0, 7);
      if(m === yyyymm) days++;
      cur.setDate(cur.getDate() + 1);
    }
  });
  return days;
}
function gnsiLeavesOnDate(date) {
  /* returns array of approved leave records active on `date` (YYYY-MM-DD) */
  var leaves = (typeof gnsiLeaves === 'function') ? gnsiLeaves() : [];
  return leaves.filter(function(l) {
    return l.status === 'Approved' && l.from <= date && l.to >= date;
  });
}
function gnsiLeaveStaffNamesOnDate(date) {
  return gnsiLeavesOnDate(date).map(function(l) { return l.staffName; });
}
/* --- 2. Substitute-roster helpers ---------------------------------- */
function gnsiSubsInMonth(staffName, yyyymm) {
  var subs = (typeof gnsiSubs === 'function') ? gnsiSubs() : [];
  var asAbsent = 0, asSubstitute = 0;
  subs.forEach(function(s) {
    if(!s.date || s.date.slice(0,7) !== yyyymm) return;
    if((s.absentName || '').toLowerCase() === staffName.toLowerCase()) asAbsent++;
    if((s.subName   || '').toLowerCase() === staffName.toLowerCase()) asSubstitute++;
  });
  return { asAbsent: asAbsent, asSubstitute: asSubstitute };
}
/* --- 3. Sync Substitute Roster → Period Attendance ----------------- */
function gnsiAutoSyncSubsToPA(date) {
  /* For every sub-roster entry on `date`, mark the relevant period slots
     in patt as Absent for the absent teacher, Sub (with substitute name)
     for the period. Only marks if currently Unmarked -- never overwrites. */
  var subs = (typeof gnsiSubs === 'function') ? gnsiSubs() : [];
  var daySubs = subs.filter(function(s){ return s.date === date; });
  if(!daySubs.length) return 0;
  var pa = (typeof loadPAtt === 'function') ? loadPAtt() : {};
  var periods = (typeof getAllActivePeriods === 'function') ? getAllActivePeriods() : [];
  var TTC = (typeof TT_COLS !== 'undefined') ? TT_COLS : [];
  var synced = 0;
  daySubs.forEach(function(sub) {
    periods.forEach(function(p) {
      TTC.forEach(function(c) {
        var cell = p[c.key] || {};
        if(!cell.teacher) return;
        if(cell.teacher.toLowerCase() !== (sub.absentName||'').toLowerCase()) return;
        // Only sync if period label matches (if sub.period is set)
        if(sub.period) {
          var pLabel = (p.label || p.id || '').toLowerCase();
          var subLabel = (sub.period || '').toLowerCase();
          if(subLabel && pLabel.indexOf(subLabel.split(' ')[0]) < 0 &&
             subLabel.indexOf(pLabel.split(' ')[0]) < 0) return;
        }
        var key = date + '|' + p.id + '|' + c.key;
        var existing = pa[key] || { status: '' };
        if(existing.status === '') { // only fill unmarked
          pa[key] = { status: 'S', sub: sub.subName || '' };
          synced++;
        }
      });
    });
  });
  if(synced > 0 && typeof savePAtt === 'function') {
    savePAtt(pa);
  }
  return synced;
}
/* --- 4. Patch renderSalReport -- add Leave + unified Sub columns ----- */
(function() {
  if(typeof renderSalReport !== 'function') return;
  var _orig = renderSalReport;
  renderSalReport = function() {
    var teachers = typeof getAllTeachers === 'function' ? getAllTeachers() : [];
    var pa       = typeof loadPAtt      === 'function' ? loadPAtt()      : {};
    var sc       = typeof loadSalConf   === 'function' ? loadSalConf()   : {};
    var advances = typeof loadAdvances  === 'function' ? loadAdvances()  : [];
    var periods  = typeof getAllActivePeriods === 'function' ? getAllActivePeriods() : [];
    var month    = (typeof psReportMonth !== 'undefined') ? psReportMonth : new Date().toISOString().slice(0,7);
    /* Build enhanced report with leave + sub-roster data */
    var reports = teachers.map(function(teacher) {
      var conf = sc[teacher] || { monthly: 0, subRate: 100, workDays: 26, periodsPerDay: 5 };
      var ppr  = (conf.monthly && conf.workDays && conf.periodsPerDay)
                 ? conf.monthly / (conf.workDays * conf.periodsPerDay) : 0;
      var assignedCount = 0, presentCount = 0, absentCount = 0,
          subAsOriginal = 0, subAsSubstitute = 0;
      Object.keys(pa).forEach(function(k) {
        if(!k.startsWith(month)) return;
        var parts = k.split('|'); if(parts.length < 3) return;
        var pId = parts[1], cKey = parts[2];
        var p   = periods.find(function(x){ return x.id === pId; });
        if(!p) return;
        var ttCell = p[cKey]; if(!ttCell || !ttCell.teacher) return;
        var val = pa[k] || { status: '', sub: '' };
        if(ttCell.teacher === teacher) {
          assignedCount++;
          if(val.status === 'P') presentCount++;
          else if(val.status === 'A') absentCount++;
          else if(val.status === 'S') subAsOriginal++;
        }
        if(val.status === 'S' && (val.sub || '').toLowerCase() === teacher.toLowerCase()) {
          subAsSubstitute++;
        }
      });
      /* Leave data */
      var leaveDays     = gnsiLeaveDaysInMonth(teacher, month);
      /* Sub-roster data (may differ from patt if not synced) */
      var rosterSubs    = gnsiSubsInMonth(teacher, month);
      /* Effective absent = patt absents + any leave days not already marked A/S */
      var effectiveAbsent = absentCount + subAsOriginal;
      /* Sub earning from patt (more precise) + roster bonus if patt not synced */
      var subEarning = subAsSubstitute * (conf.subRate || 100);
      var grossSalary   = conf.monthly || 0;
      var totalDeduction = effectiveAbsent * ppr;
      var advanceDeduction = advances
        .filter(function(a){ return a.staffName===teacher && !a.settled && a.date.startsWith(month); })
        .reduce(function(s,a){ return s + a.amount; }, 0);
      var netSalary = grossSalary - totalDeduction + subEarning - advanceDeduction;
      return {
        teacher: teacher, conf: conf, ppr: ppr,
        assignedCount: assignedCount, presentCount: presentCount,
        absentCount: absentCount, subAsOriginal: subAsOriginal,
        subAsSubstitute: subAsSubstitute, effectiveAbsent: effectiveAbsent,
        leaveDays: leaveDays, rosterAbsent: rosterSubs.asAbsent,
        rosterSub: rosterSubs.asSubstitute,
        grossSalary: grossSalary, ppr: ppr, subEarning: subEarning,
        totalDeduction: totalDeduction, advanceDeduction: advanceDeduction,
        netSalary: netSalary
      };
    });
    var totalGross = reports.reduce(function(s,r){ return s+r.grossSalary; }, 0);
    var totalNet   = reports.reduce(function(s,r){ return s+r.netSalary;   }, 0);
    var totalDed   = reports.reduce(function(s,r){ return s+r.totalDeduction; }, 0);
    var totalAdv   = reports.reduce(function(s,r){ return s+r.advanceDeduction; }, 0);
    var totalLeave = reports.reduce(function(s,r){ return s+r.leaveDays; }, 0);
    /* KPI cards */
    var summaryCards = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-bottom:20px">'
      +'<div class="stat-card" style="--c:#1a6b55"><div class="stat-label">Gross Payroll</div><div class="stat-val" style="font-size:26px">&#8377;'+Math.round(totalGross/1000)+'K</div><div class="stat-sub">'+teachers.length+' teachers</div></div>'
      +'<div class="stat-card" style="--c:#dc2626"><div class="stat-label">Deductions</div><div class="stat-val" style="font-size:26px">&#8377;'+Math.round(totalDed/1000)+'K</div><div class="stat-sub">Absent periods</div></div>'
      +'<div class="stat-card" style="--c:#d97706"><div class="stat-label">Leave Days</div><div class="stat-val" style="font-size:26px">'+totalLeave+'</div><div class="stat-sub">Approved this month</div></div>'
      +'<div class="stat-card" style="--c:#8b5cf6"><div class="stat-label">Advances</div><div class="stat-val" style="font-size:26px">&#8377;'+Math.round(totalAdv/1000)+'K</div></div>'
      +'<div class="stat-card" style="--c:#16a34a"><div class="stat-label">Net Payroll</div><div class="stat-val" style="font-size:26px">&#8377;'+Math.round(totalNet/1000)+'K</div><div class="stat-sub">To be disbursed</div></div>'
      +'</div>';
    /* Table rows */
    var rows = reports.map(function(r) {
      var netColor = r.netSalary < r.grossSalary*0.8 ? '#dc2626' : r.netSalary >= r.grossSalary ? '#16a34a' : '#ca8a04';
      var leaveCell = r.leaveDays > 0
        ? '<span style="background:#fef9c3;color:#854d0e;border-radius:6px;padding:2px 8px;font-size:11px;font-weight:700">'+r.leaveDays+'d</span>'
        : '<span style="color:var(--muted)">--</span>';
      var rosterCell = (r.rosterAbsent || r.rosterSub)
        ? '<span style="font-size:11px;color:#7c3aed">'+r.rosterAbsent+'↑ '+r.rosterSub+'↓</span>'
        : '<span style="color:var(--muted)">--</span>';
      return '<tr>'
        +'<td><div style="display:flex;align-items:center;gap:8px">'+(typeof avatarHTML==='function'?avatarHTML(r.teacher,28):'')
          +'<div><div style="font-weight:700;font-size:13px">'+esc(r.teacher)+'</div>'
          +'<div style="font-size:10px;color:var(--muted);font-family:\'JetBrains Mono\',monospace">&#8377;'+r.ppr.toFixed(0)+'/period</div></div></div></td>'
        +'<td style="text-align:center"><b style="font-family:\'JetBrains Mono\',monospace">'+r.presentCount+'</b><div style="font-size:10px;color:var(--muted)">of '+r.assignedCount+'</div></td>'
        +'<td style="text-align:center"><b style="color:#dc2626;font-family:\'JetBrains Mono\',monospace">'+r.effectiveAbsent+'</b></td>'
        +'<td style="text-align:center">'+leaveCell+'</td>'
        +'<td style="text-align:center">'+rosterCell+'</td>'
        +'<td style="text-align:center"><b style="color:#ca8a04;font-family:\'JetBrains Mono\',monospace">'+r.subAsSubstitute+'</b>'
          +(r.subEarning?'<div style="font-size:10px;color:#16a34a">+&#8377;'+r.subEarning.toFixed(0)+'</div>':'')+'</td>'
        +'<td style="font-family:\'JetBrains Mono\',monospace;font-size:12px;color:var(--accent);text-align:right">&#8377;'+r.grossSalary.toLocaleString()+'</td>'
        +'<td style="font-family:\'JetBrains Mono\',monospace;font-size:12px;color:#dc2626;text-align:right">-&#8377;'+r.totalDeduction.toFixed(0)+'</td>'
        +'<td style="font-family:\'JetBrains Mono\',monospace;font-size:12px;color:#8b5cf6;text-align:right">'+(r.advanceDeduction?'-&#8377;'+r.advanceDeduction.toFixed(0):'--')+'</td>'
        +'<td style="font-family:\'JetBrains Mono\',monospace;font-size:14px;font-weight:800;color:'+netColor+';text-align:right">&#8377;'+r.netSalary.toFixed(0)+'</td>'
        +'<td><button onclick="gnsiShowIntegratedSlip(\''+esc(r.teacher)+'\')" style="background:var(--accent);color:#fff;border:none;border-radius:7px;padding:5px 10px;cursor:pointer;font-size:11px;font-weight:700">&#128196; Slip</button></td>'
        +'</tr>';
    }).join('');
    /* Sync status banner */
    var syncedBanner = '<div style="background:#e0e8f9;border:1px solid #c7d7f5;border-radius:10px;padding:11px 16px;margin-bottom:16px;font-size:12.5px;color:#1433a8;display:flex;align-items:center;gap:10px">'
      +'<span style="font-size:16px">🔗</span>'
      +'<span><b>Integrated View</b> -- Leave days and Substitute Roster data are reflected in Absent and Deduction columns. '
      +'<button onclick="gnsiSyncAllSubsToPA()" style="background:#1433a8;color:#fff;border:none;border-radius:6px;padding:3px 10px;cursor:pointer;font-size:11px;font-weight:700;margin-left:6px">🔄 Sync Today\'s Subs → Period Att.</button></span>'
      +'</div>';
    return '<div style="display:flex;gap:12px;margin-bottom:18px;align-items:center;flex-wrap:wrap">'
      +'<div style="font-size:13px;color:var(--muted);font-weight:600">Month:</div>'
      +'<input type="month" value="'+month+'" onchange="psReportMonth=this.value;render()" style="background:var(--surface);border:1.5px solid var(--border);border-radius:9px;padding:8px 14px;font-size:13px;font-family:\'Nunito\',sans-serif;color:var(--text);outline:none"/>'
      +'</div>'
      + syncedBanner
      + summaryCards
      +'<div class="card"><div class="card-head"><span class="card-title">Teacher Salary Statement -- '+month+'</span>'
      +'<button onclick="gnsiExportSalaryCSV()" class="btn btn-outline" style="font-size:12px">⬇️ Export CSV</button>'
      +'</div>'
      +'<div style="overflow-x:auto"><table><thead><tr>'
      +'<th>Teacher</th><th style="text-align:center">Present</th><th style="text-align:center">Absent</th>'
      +'<th style="text-align:center">Leave<br><span style="font-size:9px;font-weight:400">Approved</span></th>'
      +'<th style="text-align:center">Roster<br><span style="font-size:9px;font-weight:400">↑absent ↓sub</span></th>'
      +'<th style="text-align:center">As Sub</th>'
      +'<th style="text-align:right">Gross</th><th style="text-align:right">Deduction</th>'
      +'<th style="text-align:right">Advance</th><th style="text-align:right">Net Salary</th><th>Slip</th>'
      +'</tr></thead><tbody>'
      +(rows||'<tr><td colspan="11" style="padding:32px;text-align:center;color:var(--muted)">No period attendance data. Mark attendance in Period Attendance tab.</td></tr>')
      +'</tbody>'
      +'<tfoot style="background:var(--surface2);font-weight:700"><tr>'
      +'<td colspan="6" style="padding:12px 16px;font-family:\'JetBrains Mono\',monospace;font-size:12px;color:var(--muted)">TOTALS</td>'
      +'<td style="padding:12px;font-family:\'JetBrains Mono\',monospace;font-size:13px;color:var(--accent);text-align:right">&#8377;'+totalGross.toLocaleString()+'</td>'
      +'<td style="padding:12px;font-family:\'JetBrains Mono\',monospace;font-size:13px;color:#dc2626;text-align:right">-&#8377;'+totalDed.toFixed(0)+'</td>'
      +'<td style="padding:12px;font-family:\'JetBrains Mono\',monospace;font-size:13px;color:#8b5cf6;text-align:right">-&#8377;'+totalAdv.toFixed(0)+'</td>'
      +'<td style="padding:12px;font-family:\'JetBrains Mono\',monospace;font-size:14px;font-weight:800;color:#16a34a;text-align:right">&#8377;'+totalNet.toFixed(0)+'</td>'
      +'<td></td>'
      +'</tr></tfoot></table></div></div>';
  };
})();
/* --- 5. Patch renderPATab -- Leave Alert banner ----------------------- */
(function(){
  if(typeof renderPATab !== 'function') return;
  var _orig = renderPATab;
  renderPATab = function(){
    var base = _orig();
    var date = (typeof psDate !== 'undefined') ? psDate : new Date().toISOString().split('T')[0];
    var onLeave = gnsiLeaveStaffNamesOnDate(date);
    if(!onLeave.length) return base;
    var banner = '<div style="background:#fef9c3;border:1.5px solid #fde047;border-radius:10px;padding:12px 16px;margin-bottom:14px;font-size:13px;color:#854d0e;display:flex;align-items:center;gap:10px">'
      +'<span style="font-size:18px">🏖️</span>'
      +'<div><b>On Approved Leave today ('+date+'):</b> '
      +onLeave.map(function(n){ return '<span style="background:#fde047;color:#854d0e;border-radius:4px;padding:1px 7px;font-weight:700;font-size:12px">'+esc(n)+'</span>'; }).join(' ')
      +'<button onclick="gnsiAutoSyncSubsToPA(\''+date+'\');render()" style="margin-left:10px;background:#854d0e;color:#fff;border:none;border-radius:6px;padding:3px 10px;cursor:pointer;font-size:11px;font-weight:700">Auto-mark Absent</button>'
      +'</div></div>';
    return banner + base;
  };
})();
/* --- 6. Patch renderSubstitute -- Sync button + Leave context -------- */
(function(){
  if(typeof renderSubstitute !== 'function') return;
  var _orig = renderSubstitute;
  renderSubstitute = function(){
    var base = _orig();
    var today = typeof gnsiToday === 'function' ? gnsiToday() : new Date().toISOString().split('T')[0];
    var onLeave = gnsiLeaveStaffNamesOnDate(today);
    var leaveBanner = onLeave.length
      ? '<div style="background:#fef9c3;border:1.5px solid #fde047;border-radius:10px;padding:11px 16px;margin-bottom:14px;font-size:12.5px;color:#854d0e">'
        +'🏖️ <b>Approved leave today:</b> '
        +onLeave.map(function(n){ return '<span style="background:#fde047;color:#854d0e;border-radius:4px;padding:1px 7px;font-weight:700;font-size:12px">'+esc(n)+'</span>'; }).join(' ')
        +' -- these teachers should have substitutes assigned.'
        +'</div>'
      : '';
    var syncBtn = '<div style="margin-bottom:12px">'
      +'<button onclick="gnsiSyncAllSubsToPA()" style="background:#1433a8;color:#fff;border:none;border-radius:8px;padding:8px 18px;cursor:pointer;font-size:12px;font-weight:700;font-family:\'DM Sans\',sans-serif">🔄 Sync Today\'s Roster → Period Attendance</button>'
      +'<span style="margin-left:10px;font-size:11px;color:var(--muted)">Marks absent teacher\'s period slots as Substituted in Period Attendance</span>'
      +'</div>';
    return leaveBanner + syncBtn + base;
  };
})();
/* --- 7. Sync helper callable from UI --------------------------------- */
function gnsiSyncAllSubsToPA(){
  var today = typeof gnsiToday === 'function' ? gnsiToday() : new Date().toISOString().split('T')[0];
  var n = gnsiAutoSyncSubsToPA(today);
  if(typeof showToast === 'function') showToast(n ? 'Synced '+n+' period slot(s) → Period Attendance ✅' : 'Nothing new to sync for today', n ? '#16a34a' : '#7a7468');
  if(typeof render === 'function') render();
}
/* --- 8. Auto-mark leave days as absent in patt ----------------------- */
function gnsiMarkLeaveAbsentInPA(staffName, fromDate, toDate) {
  /* Called when a leave is approved -- marks all period slots for those days as Absent */
  var pa      = typeof loadPAtt === 'function' ? loadPAtt() : {};
  var periods = typeof getAllActivePeriods === 'function' ? getAllActivePeriods() : [];
  var TTC     = typeof TT_COLS !== 'undefined' ? TT_COLS : [];
  var marked  = 0;
  var cur     = new Date(fromDate);
  var end     = new Date(toDate);
  while(cur <= end) {
    var dateStr = cur.toISOString().split('T')[0];
    periods.forEach(function(p) {
      TTC.forEach(function(c) {
        var cell = p[c.key] || {};
        if(!cell.teacher) return;
        if(cell.teacher.toLowerCase() !== staffName.toLowerCase()) return;
        var key = dateStr + '|' + p.id + '|' + c.key;
        if(!(pa[key] && pa[key].status)) {
          pa[key] = { status: 'A', sub: '' };
          marked++;
        }
      });
    });
    cur.setDate(cur.getDate() + 1);
  }
  if(marked && typeof savePAtt === 'function') savePAtt(pa);
  return marked;
}
/* --- 9. Patch gnsiLeaveDecision -- auto-mark PA on Approve ----------- */
(function(){
  if(typeof gnsiLeaveDecision !== 'function') return;
  var _orig = gnsiLeaveDecision;
  gnsiLeaveDecision = function(id, status){
    _orig(id, status);
    if(status !== 'Approved') return;
    var leaves = typeof gnsiLeaves === 'function' ? gnsiLeaves() : [];
    var l = leaves.find(function(x){ return x.id === id; });
    if(!l) return;
    var n = gnsiMarkLeaveAbsentInPA(l.staffName, l.from, l.to);
    if(n && typeof showToast === 'function') showToast('Auto-marked '+n+' period(s) Absent for '+l.staffName, '#d97706');
    /* Also sync sub roster if today is in range */
    var today = typeof gnsiToday === 'function' ? gnsiToday() : new Date().toISOString().split('T')[0];
    if(today >= l.from && today <= l.to) gnsiAutoSyncSubsToPA(today);
  };
})();
/* --- 10. Enhanced salary slip with Leave section ---------------------- */
function gnsiShowIntegratedSlip(teacherName) {
  var pa       = typeof loadPAtt    === 'function' ? loadPAtt()    : {};
  var sc       = typeof loadSalConf === 'function' ? loadSalConf() : {};
  var advances = typeof loadAdvances=== 'function' ? loadAdvances(): [];
  var periods  = typeof getAllActivePeriods==='function' ? getAllActivePeriods() : [];
  var month    = typeof psReportMonth !== 'undefined' ? psReportMonth : new Date().toISOString().slice(0,7);
  var conf     = sc[teacherName] || { monthly:0, subRate:100, workDays:26, periodsPerDay:5 };
  var ppr      = (conf.monthly && conf.workDays && conf.periodsPerDay) ? conf.monthly/(conf.workDays*conf.periodsPerDay) : 0;
  var assignedCount=0, presentCount=0, absentCount=0, subCovered=0, subAsSubstitute=0;
  Object.keys(pa).forEach(function(k){
    if(!k.startsWith(month)) return;
    var parts=k.split('|'); if(parts.length<3) return;
    var pId=parts[1], cKey=parts[2];
    var p=periods.find(function(x){return x.id===pId;}); if(!p) return;
    var ttCell=p[cKey]; if(!ttCell||!ttCell.teacher) return;
    var val=pa[k]||{status:'',sub:''};
    if(ttCell.teacher===teacherName){
      assignedCount++;
      if(val.status==='P') presentCount++;
      else if(val.status==='A') absentCount++;
      else if(val.status==='S') subCovered++;
    }
    if(val.status==='S' && (val.sub||'').toLowerCase()===teacherName.toLowerCase()) subAsSubstitute++;
  });
  /* Leave details */
  var approvedLeaves = (typeof gnsiLeaves==='function' ? gnsiLeaves() : [])
    .filter(function(l){ return l.status==='Approved' && (l.staffName||'').toLowerCase()===teacherName.toLowerCase() && l.from.slice(0,7)===month; });
  var leaveDays = gnsiLeaveDaysInMonth(teacherName, month);
  /* Roster subs */
  var rosterData = gnsiSubsInMonth(teacherName, month);
  var advsThisMonth = advances.filter(function(a){ return a.staffName===teacherName && !a.settled && a.date.startsWith(month); });
  var advTotal = advsThisMonth.reduce(function(s,a){ return s+a.amount; }, 0);
  var effectiveAbsent = absentCount + subCovered;
  var grossSalary = conf.monthly || 0;
  var deduction   = effectiveAbsent * ppr;
  var subEarning  = subAsSubstitute * (conf.subRate || 100);
  var netSalary   = grossSalary - deduction + subEarning - advTotal;
  var leaveRows = approvedLeaves.map(function(l){
    var days = Math.max(1, Math.round((new Date(l.to)-new Date(l.from))/86400000)+1);
    return '<div class="row"><span>'+esc(l.type)+' ('+l.from+(l.from!==l.to?' to '+l.to:'')+', '+days+'d)</span><span class="muted">Approved</span></div>';
  }).join('');
  var w = window.open('','_blank','width=720,height=900');
  if(!w){ if(typeof showToast==='function')showToast('⚠ Popup blocked. Allow popups to view salary slip.','#d97706'); return; }
  w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Salary Slip</title>'
    +'<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Nunito:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">'
    +'<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Nunito,sans-serif;padding:28px;background:#f4f1eb;color:#1c1a16}'
    +'.slip{background:#fff;border-radius:16px;padding:30px;max-width:640px;margin:0 auto;box-shadow:0 4px 24px rgba(0,0,0,.12)}'
    +'.header{background:linear-gradient(135deg,#1433a8,#1a6b55);color:#fff;border-radius:10px;padding:18px 22px;margin-bottom:22px;text-align:center}'
    +'.hdr-title{font-family:"Cormorant Garamond",serif;font-size:22px;font-weight:700}'
    +'.hdr-sub{font-size:11px;opacity:.8;letter-spacing:.1em;font-family:"JetBrains Mono",monospace}'
    +'.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e2ddd5;font-size:13px}'
    +'.row.total{border:none;border-top:2.5px solid #1433a8;padding-top:14px;margin-top:6px;font-size:16px;font-weight:800;color:#1433a8}'
    +'.section{margin:16px 0 6px;font-size:10px;font-weight:700;color:#7a7468;text-transform:uppercase;letter-spacing:.12em;font-family:"JetBrains Mono",monospace;display:flex;align-items:center;gap:8px}'
    +'.section::after{content:"";flex:1;border-top:1px solid #e2ddd5}'
    +'.deduct{color:#dc2626}.add{color:#16a34a}.muted{color:#7a7468}'
    +'.badge{display:inline-block;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700}'
    +'@media print{body{padding:0;background:#fff}.slip{box-shadow:none}.no-print{display:none}}'
    +'<\/style><\/head><body>'
    +'<div class="slip">'
    +'<div class="header">'
    +'<div class="hdr-title">GUIDANCE NAVODAYA &amp; SAINIK INSTITUTE</div>'
    +'<div class="hdr-sub">KHANGABOK SOROK WANGMA, THOUBAL, MANIPUR</div>'
    +'<div style="margin-top:8px;font-size:15px;font-weight:700">SALARY SLIP &mdash; '+month+'</div>'
    +'</div>'
    +'<div class="section">Employee Details</div>'
    +'<div class="row"><span>Teacher Name</span><b>'+teacherName+'</b></div>'
    +'<div class="row"><span>Month</span><b>'+month+'</b></div>'
    +'<div class="row"><span>Per-Period Rate</span><span style="font-family:\'JetBrains Mono\',monospace">&#8377;'+ppr.toFixed(2)+'</span></div>'
    +'<div class="section">Period Summary</div>'
    +'<div class="row"><span>Total Periods Assigned</span><b>'+assignedCount+'</b></div>'
    +'<div class="row"><span>Periods Present</span><b class="add">'+presentCount+'</b></div>'
    +'<div class="row"><span>Periods Absent (direct)</span><b class="deduct">'+absentCount+'</b></div>'
    +'<div class="row"><span>Periods Covered by Substitute</span><b class="deduct">'+subCovered+'</b></div>'
    +'<div class="row"><span>Periods Done as Substitute</span><b class="add">'+subAsSubstitute+'</b></div>'
    +'<div class="row"><span>Substitute Roster -- Absent slots</span><b class="muted">'+rosterData.asAbsent+'</b></div>'
    +'<div class="row"><span>Substitute Roster -- Sub slots</span><b class="muted">'+rosterData.asSubstitute+'</b></div>'
    +(leaveDays ? '<div class="section">Approved Leave This Month</div>'+leaveRows
      +'<div class="row"><span>Total Leave Days</span><b class="deduct">'+leaveDays+'d</b></div>' : '')
    +'<div class="section">Earnings</div>'
    +'<div class="row"><span>Gross Monthly Salary</span><b style="font-family:\'JetBrains Mono\',monospace">&#8377;'+grossSalary.toLocaleString()+'</b></div>'
    +'<div class="row"><span>Substitute Earning ('+subAsSubstitute+' &times; &#8377;'+(conf.subRate||100)+')</span><b class="add" style="font-family:\'JetBrains Mono\',monospace">+&#8377;'+subEarning.toFixed(2)+'</b></div>'
    +'<div class="section">Deductions</div>'
    +'<div class="row"><span>Absent / Substituted Periods ('+effectiveAbsent+')</span><span class="deduct" style="font-family:\'JetBrains Mono\',monospace">-&#8377;'+deduction.toFixed(2)+'</span></div>'
    +(advTotal ? advsThisMonth.map(function(a){
      return '<div class="row"><span>Advance ('+a.date+')'+(a.note?' -- '+a.note:'')+'</span><span class="deduct" style="font-family:\'JetBrains Mono\',monospace">-&#8377;'+a.amount.toLocaleString()+'</span></div>';
    }).join('') : '')
    +'<div class="row total"><span>NET SALARY</span><span style="font-family:\'JetBrains Mono\',monospace">&#8377;'+netSalary.toFixed(2)+'</span></div>'
    +'<div style="margin-top:32px;display:grid;grid-template-columns:1fr 1fr;gap:20px;padding-top:20px;border-top:1px solid #e2ddd5;font-size:11px;color:#7a7468;text-align:center">'
    +'<div style="border-top:1px solid #000;padding-top:6px">Prepared By / Accounts</div>'
    +'<div style="border-top:1px solid #000;padding-top:6px">Head of Institute</div>'
    +'</div>'
    +'<div class="no-print" style="margin-top:20px;text-align:center">'
    +'<button onclick="window.print()" style="background:#1433a8;color:#fff;border:none;border-radius:8px;padding:10px 28px;cursor:pointer;font-family:Nunito,sans-serif;font-size:14px;font-weight:700">&#128424; Print Salary Slip</button>'
    +'</div>'
    +'</div><\/body><\/html>');
  w.document.close();
}
/* --- 11. Salary CSV export ------------------------------------------- */
function gnsiExportSalaryCSV(){
  showToast('⏳ Preparing Salary CSV…','#2563eb');

  var teachers = typeof getAllTeachers === 'function' ? getAllTeachers() : [];
  var pa       = typeof loadPAtt      === 'function' ? loadPAtt()      : {};
  var sc       = typeof loadSalConf   === 'function' ? loadSalConf()   : {};
  var advances = typeof loadAdvances  === 'function' ? loadAdvances()  : [];
  var periods  = typeof getAllActivePeriods==='function' ? getAllActivePeriods() : [];
  var month    = typeof psReportMonth !== 'undefined' ? psReportMonth : new Date().toISOString().slice(0,7);
  var csv = 'Teacher,Assigned,Present,Absent,Sub Covered,As Sub,Leave Days,Roster Absent,Roster Sub,Gross,Deduction,Advance,Net\n';
  teachers.forEach(function(teacher){
    var conf=sc[teacher]||{monthly:0,subRate:100,workDays:26,periodsPerDay:5};
    var ppr=(conf.monthly&&conf.workDays&&conf.periodsPerDay)?conf.monthly/(conf.workDays*conf.periodsPerDay):0;
    var a=0,p=0,ab=0,sc2=0,ss=0;
    Object.keys(pa).forEach(function(k){
      if(!k.startsWith(month)) return;
      var parts=k.split('|'); if(parts.length<3) return;
      var pId=parts[1],cKey=parts[2];
      var per=periods.find(function(x){return x.id===pId;}); if(!per) return;
      var ttCell=per[cKey]; if(!ttCell||!ttCell.teacher) return;
      var val=pa[k]||{status:'',sub:''};
      if(ttCell.teacher===teacher){a++;if(val.status==='P')p++;else if(val.status==='A')ab++;else if(val.status==='S')sc2++;}
      if(val.status==='S'&&(val.sub||'').toLowerCase()===teacher.toLowerCase())ss++;
    });
    var lv=gnsiLeaveDaysInMonth(teacher,month);
    var rs=gnsiSubsInMonth(teacher,month);
    var eff=ab+sc2;
    var gross=conf.monthly||0;
    var ded=eff*ppr;
    var subEarn=ss*(conf.subRate||100);
    var adv=advances.filter(function(x){return x.staffName===teacher&&!x.settled&&x.date.startsWith(month);}).reduce(function(s,x){return s+x.amount;},0);
    var net=gross-ded+subEarn-adv;
    csv+='"'+teacher+'",'+a+','+p+','+ab+','+sc2+','+ss+','+lv+','+rs.asAbsent+','+rs.asSubstitute+','+gross+','+ded.toFixed(0)+','+adv+','+net.toFixed(0)+'\n';
  });
  var blob=new Blob([csv],{type:'text/csv'});
  var url=URL.createObjectURL(blob);
  var link=document.createElement('a'); link.href=url; link.download='GNSI_Salary_'+month+'.csv';
  document.body.appendChild(link); showToast('✅ Salary CSV ready','#16a34a');
  link.click(); document.body.removeChild(link);
}

</script>
<!-- ═══════════ GNSI UNIFIED SALARY SYSTEM v2.0 ═══════════ -->
<script>
/*
  GNSI Salary Register v6 \u2014 replaces Unified Staff Salary System v2.0
  Injected as self-contained module. renderStaffSalary() mounts the
  salary register HTML/CSS/JS into the page container.
*/
/* \u2500\u2500 Salary Register styles (scoped to .gnsi-sr-wrap) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
(function(){
  var SR_STYLE_ID = 'gnsi-sr-style';
  if (!document.getElementById(SR_STYLE_ID)) {
    var st = document.createElement('style');
    st.id = SR_STYLE_ID;
    st.textContent = [
      '.gnsi-sr-wrap *{box-sizing:border-box;margin:0;padding:0}',
      '.gnsi-sr-wrap{font-family:Arial,sans-serif;font-size:13px;color:var(--color-text-primary)}',
      '.gnsi-sr-wrap .hdr{background:#1B3A6B;color:#fff;padding:12px 18px;border-radius:10px 10px 0 0;display:flex;align-items:center;gap:12px}',
      '.gnsi-sr-wrap .hdr-logo{width:38px;height:38px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0}',
      '.gnsi-sr-wrap .hdr-logo span{font-size:10px;font-weight:700;color:#1B3A6B}',
      '.gnsi-sr-wrap .toolbar{display:flex;align-items:center;gap:8px;padding:9px 14px;background:var(--color-background-secondary);border-bottom:.5px solid var(--color-border-tertiary);flex-wrap:wrap}',
      '.gnsi-sr-wrap .toolbar select,.gnsi-sr-wrap .toolbar input[type=month],.gnsi-sr-wrap .toolbar input[type=search]{font-size:12px;padding:4px 7px;border:.5px solid var(--color-border-tertiary);border-radius:6px;background:var(--color-background-primary);color:var(--color-text-primary)}',
      '.gnsi-sr-wrap .btn{font-size:12px;padding:5px 11px;border:.5px solid var(--color-border-secondary);border-radius:6px;background:var(--color-background-primary);color:var(--color-text-primary);cursor:pointer;white-space:nowrap}',
      '.gnsi-sr-wrap .btn:hover{background:var(--color-background-secondary)}',
      '.gnsi-sr-wrap .btn-navy{background:#1B3A6B;color:#fff;border-color:#1B3A6B}.gnsi-sr-wrap .btn-navy:hover{background:#254e91}',
      '.gnsi-sr-wrap .btn-gold{background:#B8860B;color:#fff;border-color:#B8860B}.gnsi-sr-wrap .btn-gold:hover{background:#9a7009}',
      '.gnsi-sr-wrap .tbl-wrap{overflow-x:auto}',
      '.gnsi-sr-wrap table{width:100%;border-collapse:collapse;font-size:12px}',
      '.gnsi-sr-wrap thead tr{background:#1B3A6B;color:#fff}',
      '.gnsi-sr-wrap thead th{padding:7px 5px;text-align:center;font-weight:500;white-space:nowrap;border-right:.5px solid rgba(255,255,255,.12)}',
      '.gnsi-sr-wrap thead th.lft{text-align:left}',
      '.gnsi-sr-wrap tbody tr:nth-child(even){background:var(--color-background-secondary)}',
      '.gnsi-sr-wrap tbody tr:hover{background:#EEF4FC}',
      '.gnsi-sr-wrap td{padding:5px 5px;border-bottom:.5px solid var(--color-border-tertiary);text-align:center;vertical-align:middle}',
      '.gnsi-sr-wrap td.lft{text-align:left}',
      '.gnsi-sr-wrap .nm{font-weight:500;font-size:12px}',
      '.gnsi-sr-wrap .rb{display:inline-block;font-size:10px;padding:1px 6px;border-radius:8px;background:#E6F1FB;color:#0C447C;white-space:nowrap}',
      '.gnsi-sr-wrap .earn{color:#0C447C;font-weight:500;background:#E6F1FB}',
      '.gnsi-sr-wrap .dtot{color:#791F1F;background:#FCEBEB;font-weight:500}',
      '.gnsi-sr-wrap .nett{color:#27500A;background:#EAF3DE;font-weight:500;font-size:13px}',
      '.gnsi-sr-wrap .inp{width:65px;text-align:right;padding:3px 4px;border:.5px solid var(--color-border-tertiary);border-radius:4px;background:var(--color-background-primary);color:var(--color-text-primary);font-size:11px}',
      '.gnsi-sr-wrap .inp:focus{outline:none;border-color:#1B3A6B}',
      '.gnsi-sr-wrap .inp.ia{background:#FFFBEB;border-color:#C8960C;color:#633806}',
      '.gnsi-sr-wrap tfoot td{background:#1B3A6B;color:#fff;font-weight:500;padding:7px 5px;text-align:center}',
      '.gnsi-sr-wrap tfoot td.lft{text-align:left;padding-left:10px}',
      '.gnsi-sr-wrap .sbar{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;padding:10px 14px;background:var(--color-background-secondary);border-bottom:.5px solid var(--color-border-tertiary)}',
      '.gnsi-sr-wrap .sc{background:var(--color-background-primary);border-radius:7px;padding:8px 12px;border:.5px solid var(--color-border-tertiary)}',
      '.gnsi-sr-wrap .sc .sl{font-size:11px;color:var(--color-text-secondary);margin-bottom:2px}',
      '.gnsi-sr-wrap .sc .sv{font-size:15px;font-weight:500}',
      '.gnsi-sr-wrap .legend{display:flex;gap:12px;flex-wrap:wrap;font-size:11px;color:var(--color-text-secondary);padding:7px 14px;border-top:.5px solid var(--color-border-tertiary)}',
      '.gnsi-sr-wrap .ld{width:10px;height:10px;border-radius:2px;display:inline-block;margin-right:3px;vertical-align:middle}',
      '.gnsi-sr-wrap .slip-a4-page{display:none}',
      '.gnsi-sr-wrap .slip-half{flex:1;display:flex;flex-direction:column;padding:3mm 2mm;overflow:hidden}',
      '.gnsi-sr-wrap .slip-copy{flex:1;display:flex;flex-direction:column}',
      '.gnsi-sr-wrap .slip-copy>div{flex:1;display:flex;flex-direction:column}',
      '.gnsi-sr-wrap .slip-cutline{flex-shrink:0;border-top:1.5px dashed #aaa;padding:1.5mm 0;text-align:center;font-size:7px;color:#bbb;letter-spacing:2.5px}',
      '@media print{',
      '@page{size:A4 portrait;margin:5mm 7mm}',
      '.gnsi-sr-wrap .no-print{display:none!important}',
      '.gnsi-sr-wrap .reg-wrap{display:none}',
      '.gnsi-sr-wrap .reg-wrap.printing{display:block!important;border:none!important;border-radius:0!important}',
      '.gnsi-sr-wrap .reg-wrap.printing .hdr{border-radius:0!important}',
      '.gnsi-sr-wrap thead tr{-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#1B3A6B!important}',
      '.gnsi-sr-wrap tfoot td{-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#1B3A6B!important}',
      '.gnsi-sr-wrap .earn{-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#E6F1FB!important}',
      '.gnsi-sr-wrap .dtot{-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#FCEBEB!important}',
      '.gnsi-sr-wrap .nett{-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#EAF3DE!important}',
      '.gnsi-sr-wrap .rb{-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#E6F1FB!important}',
      '.gnsi-sr-wrap .inp{border:none;background:transparent!important;color:#000!important}',
      '.gnsi-sr-wrap .slip-a4-page.printing{display:flex!important;flex-direction:column;width:196mm;height:287mm;overflow:hidden;background:#fff;page-break-after:always;page-break-inside:avoid;margin:0 auto}',
      '.gnsi-sr-wrap .slip-a4-page.printing:last-child{page-break-after:auto}',
      '#gnsi-sr-slip-pages{display:block}',
      '}'
    ].join('\n');
    document.head.appendChild(st);
  }
})();
/* \u2500\u2500 renderStaffSalary \u2014 entry point called by portal router \u2500\u2500 */
function renderFees(){
  /* Always delegate to the unified fee hub */
  if(typeof renderUnifiedFeeHub==='function') return renderUnifiedFeeHub();
  return '<div class="page-header"><div class="page-header-title">💳 Fee Management</div></div><div style="padding:30px;text-align:center;color:var(--muted)">Loading…</div>';
}
/* -- COUNTER SEARCH: lightweight DOM-only update (no full re-render) -- */
function ctrFilterList(){
  var inp=document.getElementById('ctr-search-inp');
  var list=document.getElementById('ctr-student-list');
  if(!inp||!list)return;
  var q=(inp.value||'').toLowerCase().trim();
  var items=list.querySelectorAll('.ctr-stu-item');
  var visCount=0;
  items.forEach(function(el){
    var name=(el.dataset.name||'').toLowerCase();
    var roll=(el.dataset.roll||'').toLowerCase();
    var cls=(el.dataset.cls||'').toLowerCase();
    var adm=(el.dataset.adm||'').toLowerCase();
    var phone=(el.dataset.phone||'').toLowerCase();
    var show=!q||name.includes(q)||roll.includes(q)||cls.includes(q)||adm.includes(q)||phone.includes(q);
    el.style.display=show?'':'none';
    if(show)visCount++;
  });
  var lbl=document.getElementById('ctr-search-count');
  if(lbl) lbl.textContent=q?(visCount+' of '+students.length+' students'):'';
  /* highlight matching text in names */
  items.forEach(function(el){
    if(el.style.display==='none')return;
    var nameEl=el.querySelector('.ctr-stu-name');
    if(!nameEl)return;
    var orig=nameEl.dataset.orig||nameEl.textContent;
    nameEl.dataset.orig=orig;
    if(!q){nameEl.innerHTML=esc(orig);return;}
    var idx=orig.toLowerCase().indexOf(q);
    if(idx>=0){
      nameEl.innerHTML=esc(orig.slice(0,idx))
        +'<mark style="background:#fde68a;color:#92400e;border-radius:2px;padding:0 1px">'+esc(orig.slice(idx,idx+q.length))+'</mark>'
        +esc(orig.slice(idx+q.length));
    } else {
      nameEl.innerHTML=esc(orig);
    }
  });
}
function ctrSelectStudent(id){
  feesCounterStu=id;
  feesCounterType='monthly';
  render();
  /* scroll right panel into view on mobile */
  setTimeout(function(){var p=document.getElementById('ctr-pay-panel');if(p)p.scrollIntoView({behavior:'smooth',block:'start'});},80);
}
/* -- COUNTER TAB -- */
function renderFeeCounter(){
  var MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
  var curMonth=MONTHS[new Date().getMonth()]+' '+new Date().getFullYear();
  var selStu=students.find(function(s){return s.id==feesCounterStu;});
  var conf=loadFeeConf();
  var stuInfo=''; /* kept for compat */
  var payPanel='';
  if(selStu){
    var ex=stuLoadExtra(selStu.id);
    var courseConf=conf.monthlyFees.find(function(f){return f.course===selStu.cls;})||{amount:10000,hostelAmount:5000};
    var admConf=conf.admissionFees.find(function(f){return f.course===selStu.cls;})||{amount:5000};
    var monthlyTotal=parseInt(courseConf.amount||0)+(selStu.hostel==='Yes'?parseInt(courseConf.hostelAmount||0):0);
    /* -- SMART: override with Course Management fees if available -- */
    var _cmInfo=gnsiGetStudentCourseInfo(selStu.id);
    if(_cmInfo && _cmInfo.fees){
      if(_cmInfo.fees.monthly)  courseConf.amount=parseInt(_cmInfo.fees.monthly)||courseConf.amount;
      if(_cmInfo.fees.hostel)   courseConf.hostelAmount=parseInt(_cmInfo.fees.hostel)||courseConf.hostelAmount;
      if(_cmInfo.fees.admission) admConf.amount=parseInt(_cmInfo.fees.admission)||admConf.amount;
      monthlyTotal=parseInt(courseConf.amount||0)+(selStu.hostel==='Yes'?parseInt(courseConf.hostelAmount||0):0);
    }
    // Payment type selector
    var ptypes=[
      {id:'monthly',label:'📅 Monthly Fee',color:'#1433a8'},
      {id:'fullpay',label:'💳 Full Payment',color:'#7c3aed'},
      {id:'admission',label:'🎓 Admission Fee',color:'#16a34a'},
      {id:'advance',label:'💰 Advance Fee',color:'#d97706'},
      {id:'item',label:'📦 Items',color:'#0891b2'},
      {id:'feegroup',label:'🏷 Fee Group',color:'#be185d'},
      {id:'manual',label:'✏️ Manual Fee',color:'#475569'}
    ];
    payPanel='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">'
      +ptypes.map(function(pt){
        var sel=feesCounterType===pt.id;
        return '<button onclick="feesCounterType=\''+pt.id+'\';render()" style="padding:8px 16px;border-radius:8px;border:'+(sel?'none':'1.5px solid var(--border)')+';cursor:pointer;font-weight:700;font-size:12px;background:'+(sel?pt.color:'var(--surface)')+';color:'+(sel?'#fff':'var(--muted)')+'">'+pt.label+'</button>';
      }).join('')+'</div>';
    if(feesCounterType==='monthly'){
      var monthOpts=MONTHS.map(function(m){
        var yr=new Date().getFullYear();
        return '<option value="'+m+' '+yr+'">'+m+' '+yr+'</option>'
          +'<option value="'+m+' '+(yr+1)+'">'+m+' '+(yr+1)+'</option>';
      }).join('');
      payPanel+='<div class="form-panel" style="border-color:#1433a8">'
        +'<div class="form-title" style="color:#1433a8">📅 Collect Monthly Fee</div>'
        +'<div class="form-grid g3">'
        +'<div class="form-group"><label>For Month *</label><select id="ctr-month"><option value="'+curMonth+'">'+curMonth+'</option>'+monthOpts+'</select></div>'
        +'<div class="form-group"><label>Tuition Fee (₹)</label><input id="ctr-tuition" type="number" value="'+courseConf.amount+'" min="0"/></div>'
        +(selStu.hostel==='Yes'?'<div class="form-group"><label>Hostel Fee (₹)</label><input id="ctr-hostel" type="number" value="'+courseConf.hostelAmount+'" min="0"/></div>':'<div></div>')
        +'<div class="form-group"><label>Total Amount (₹)</label><input id="ctr-total" type="number" value="'+monthlyTotal+'" min="0"/></div>'
        +'<div class="form-group"><label>Receipt No.</label><input id="ctr-receipt" value="'+genReceiptNo('RCP')+'"/></div>'
        +'<div class="form-group"><label>Date</label><input id="ctr-date" type="date" value="'+new Date().toISOString().split('T')[0]+'"/></div>'
        +'<div class="form-group"><label>Remarks</label><input id="ctr-remark" placeholder="Optional"/></div>'
        +'</div>'
        +'<div class="form-actions">'
        +'<button class="btn btn-primary" onclick="counterSaveMonthly('+selStu.id+')">✓ Save &amp; Print Receipt</button>'
        +'<button class="btn" onclick="counterSaveMonthly('+selStu.id+',true)" style="background:#dcfce7;color:#16a34a;border:1px solid #86efac">✓ Save Only</button>'
        +'<button class="btn btn-outline" onclick="feesCounterStu=\'\';render()">Cancel</button>'
        +'</div></div>';
    } else if(feesCounterType==='fullpay'){
      payPanel+='<div class="form-panel" style="border-color:#7c3aed">'
        +'<div class="form-title" style="color:#7c3aed">💳 Full Payment Collection</div>'
        +'<div class="form-grid g3">'
        +'<div class="form-group"><label>Months Covered *</label><input id="ctr-fp-months" placeholder="e.g. April–March 2025-26"/></div>'
        +'<div class="form-group"><label>Tuition Fee (₹)</label><input id="ctr-fp-tuition" type="number" value="'+courseConf.amount+'" min="0"/></div>'
        +(selStu.hostel==='Yes'?'<div class="form-group"><label>Hostel Fee (₹)</label><input id="ctr-fp-hostel" type="number" value="'+courseConf.hostelAmount+'" min="0"/></div>':'')
        +'<div class="form-group"><label>Total Amount (₹) *</label><input id="ctr-fp-total" type="number" value="'+(monthlyTotal*12)+'" min="0"/></div>'
        +'<div class="form-group"><label>Receipt No.</label><input id="ctr-fp-receipt" value="'+genReceiptNo('FPR')+'"/></div>'
        +'<div class="form-group"><label>Date</label><input id="ctr-fp-date" type="date" value="'+new Date().toISOString().split('T')[0]+'"/></div>'
        +'<div class="form-group"><label>Remarks</label><input id="ctr-fp-remark" placeholder="Optional"/></div>'
        +'</div>'
        +'<div class="form-actions">'
        +'<button class="btn btn-primary" onclick="counterSaveFullPay('+selStu.id+')">✓ Save &amp; Print Receipt</button>'
        +'<button class="btn btn-outline" onclick="feesCounterStu=\'\';render()">Cancel</button>'
        +'</div></div>';
    } else if(feesCounterType==='admission'){
      payPanel+='<div class="form-panel" style="border-color:#16a34a">'
        +'<div class="form-title" style="color:#16a34a">🎓 Admission Fee Collection</div>'
        +'<div class="form-grid g3">'
        +'<div class="form-group"><label>Amount (₹) *</label><input id="ctr-adm-amt" type="number" value="'+admConf.amount+'" min="0"/></div>'
        +'<div class="form-group"><label>Receipt No.</label><input id="ctr-adm-receipt" value="'+genReceiptNo('ADM')+'"/></div>'
        +'<div class="form-group"><label>Date</label><input id="ctr-adm-date" type="date" value="'+new Date().toISOString().split('T')[0]+'"/></div>'
        +'<div class="form-group"><label>Remarks</label><input id="ctr-adm-remark" placeholder="Optional"/></div>'
        +'</div>'
        +'<div class="form-actions">'
        +'<button class="btn btn-primary" onclick="counterSaveAdmission('+selStu.id+')">✓ Save &amp; Print Receipt</button>'
        +'<button class="btn btn-outline" onclick="feesCounterStu=\'\';render()">Cancel</button>'
        +'</div></div>';
    } else if(feesCounterType==='advance'){
      payPanel+='<div class="form-panel" style="border-color:#d97706">'
        +'<div class="form-title" style="color:#d97706">💰 Advance Fee Collection</div>'
        +'<div class="form-grid g3">'
        +'<div class="form-group"><label>Amount (₹) *</label><input id="ctr-adv-amt" type="number" placeholder="Advance amount" min="0"/></div>'
        +'<div class="form-group"><label>For Months / Period</label><input id="ctr-adv-months" placeholder="e.g. Jan–Mar 2026"/></div>'
        +'<div class="form-group"><label>Receipt No.</label><input id="ctr-adv-receipt" value="'+genReceiptNo('ADV')+'"/></div>'
        +'<div class="form-group"><label>Date</label><input id="ctr-adv-date" type="date" value="'+new Date().toISOString().split('T')[0]+'"/></div>'
        +'<div class="form-group"><label>Remarks</label><input id="ctr-adv-remark" placeholder="Optional"/></div>'
        +'</div>'
        +'<div class="form-actions">'
        +'<button class="btn btn-primary" onclick="counterSaveAdvance('+selStu.id+')">✓ Save &amp; Print Receipt</button>'
        +'<button class="btn btn-outline" onclick="feesCounterStu=\'\';render()">Cancel</button>'
        +'</div></div>';
    } else if(feesCounterType==='item'){
      payPanel+='<div class="form-panel" style="border-color:#0891b2">'
        +'<div class="form-title" style="color:#0891b2">📦 Items / Provisions Provided</div>'
        +'<div id="ctr-items-list">'
        +'<div class="form-grid g3" id="ctr-item-row-0">'
        +'<div class="form-group"><label>Item Name</label><input id="ctr-item-name-0" placeholder="e.g. Uniform Set"/></div>'
        +'<div class="form-group"><label>Amount (₹)</label><input id="ctr-item-amt-0" type="number" placeholder="0" min="0" oninput="ctrUpdateItemTotal()"/></div>'
        +'<div class="form-group"><label>Qty</label><input id="ctr-item-qty-0" type="number" value="1" min="1" oninput="ctrUpdateItemTotal()"/></div>'
        +'</div></div>'
        +'<button onclick="ctrAddItemRow()" style="padding:6px 14px;border-radius:7px;border:1.5px dashed var(--border);background:transparent;cursor:pointer;color:var(--accent);font-weight:600;font-size:12px;margin-bottom:14px">+ Add Item</button>'
        +'<div style="display:flex;align-items:center;gap:16px;margin-bottom:14px">'
        +'<div style="font-size:14px;font-weight:700;color:var(--accent)">Total: <span id="ctr-item-total">₹0</span></div>'
        +'<div class="form-group" style="margin:0;flex:1"><label>Receipt No.</label><input id="ctr-item-receipt" value="'+genReceiptNo('ITM')+'"/></div>'
        +'<div class="form-group" style="margin:0"><label>Date</label><input id="ctr-item-date" type="date" value="'+new Date().toISOString().split('T')[0]+'"/></div>'
        +'</div>'
        +'<div class="form-actions">'
        +'<button class="btn btn-primary" onclick="counterSaveItems('+selStu.id+')">✓ Save &amp; Print Receipt</button>'
        +'<button class="btn btn-outline" onclick="feesCounterStu=\'\';render()">Cancel</button>'
        +'</div></div>';
    } else if(feesCounterType==='feegroup'){
      /* Show only fee groups assigned to this student; fall back to all if none assigned */
      var stuAsgn = (typeof getStuFeeAssignment==='function') ? getStuFeeAssignment(selStu.id) : null;
      var assignedFgIds = stuAsgn && stuAsgn.feeGroupIds && stuAsgn.feeGroupIds.length ? stuAsgn.feeGroupIds : null;
      var allFgs = conf.feeGroups || [];
      var visibleFgs = assignedFgIds ? allFgs.filter(function(g){ return assignedFgIds.indexOf(g.id)>=0; }) : allFgs;
      var hasAssignment = !!assignedFgIds;
      var fgOpts=visibleFgs.map(function(g){return'<option value="'+esc(g.id)+'" data-amt="'+g.amount+'" data-name="'+esc(g.name)+'">'+esc(g.name)+' -- ₹'+Number(g.amount).toLocaleString()+'</option>';}).join('');
      payPanel+='<div class="form-panel" style="border-color:#be185d">'
        +'<div class="form-title" style="color:#be185d">🏷 Fee Group Collection</div>'
        +(hasAssignment
          ? '<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:7px 12px;margin-bottom:12px;font-size:12px;color:#15803d;font-weight:600">✓ Showing '+visibleFgs.length+' group(s) assigned to this student</div>'
          : (allFgs.length ? '<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:7px 12px;margin-bottom:12px;font-size:12px;color:#c9870a;font-weight:600">⚠ No groups assigned to this student — showing all '+allFgs.length+' groups. Assign in <b>Fee Setup → Student Assignment</b>.</div>' : ''))
        +(visibleFgs&&visibleFgs.length
          ? '<div class="form-grid g3">'
            +'<div class="form-group"><label>Fee Group *</label><select id="ctr-fg-group" onchange="ctrFeeGroupAutoFill(this)"><option value="">-- Select Group --</option>'+fgOpts+'</select></div>'
            +'<div class="form-group"><label>Amount (₹) *</label><input id="ctr-fg-amt" type="number" placeholder="Amount" min="0"/></div>'
            +'<div class="form-group"><label>Receipt No.</label><input id="ctr-fg-receipt" value="'+genReceiptNo('FGR')+'"/></div>'
            +'<div class="form-group"><label>Date</label><input id="ctr-fg-date" type="date" value="'+new Date().toISOString().split('T')[0]+'"/></div>'
            +'<div class="form-group"><label>Remarks</label><input id="ctr-fg-remark" placeholder="Optional"/></div>'
            +'</div>'
            +'<div class="form-actions">'
            +'<button class="btn btn-primary" onclick="counterSaveFeeGroup('+selStu.id+')">✓ Save &amp; Print Receipt</button>'
            +'<button class="btn btn-outline" onclick="feesCounterStu=\'\';render()">Cancel</button>'
            +'</div>'
          : '<div style="padding:18px;text-align:center;color:var(--muted);font-size:13px">No Fee Groups available. Ask Admin to add them in <strong>Fee Setup → Fee Groups</strong> and assign to this student.</div>')
        +'</div>';
    } else if(feesCounterType==='manual'){
      /* Show only manual fee types assigned to this student; fall back to all if none assigned */
      var stuAsgnM = (typeof getStuFeeAssignment==='function') ? getStuFeeAssignment(selStu.id) : null;
      var assignedMfts = stuAsgnM && stuAsgnM.manualFeeTypes && stuAsgnM.manualFeeTypes.length ? stuAsgnM.manualFeeTypes : null;
      var allMfts = conf.manualFeeTypes || [];
      var visibleMfts = assignedMfts ? allMfts.filter(function(t){ return assignedMfts.indexOf(t)>=0; }) : allMfts;
      var hasManualAssign = !!assignedMfts;
      var mtOpts=visibleMfts.map(function(t){return'<option value="'+esc(t)+'">'+esc(t)+'</option>';}).join('');
      payPanel+='<div class="form-panel" style="border-color:#475569">'
        +'<div class="form-title" style="color:#475569">✏️ Manual Fee Collection</div>'
        +(hasManualAssign
          ? '<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:7px 12px;margin-bottom:12px;font-size:12px;color:#15803d;font-weight:600">✓ Showing '+visibleMfts.length+' type(s) assigned to this student</div>'
          : (allMfts.length ? '<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:7px 12px;margin-bottom:12px;font-size:12px;color:#c9870a;font-weight:600">⚠ No fee types assigned — showing all types. Set in <b>Fee Setup → Student Assignment</b>.</div>' : ''))
        +'<div class="form-grid g3">'
        +'<div class="form-group"><label>Fee Type *</label><select id="ctr-man-type" onchange="document.getElementById(\'ctr-man-custom-wrap\').style.display=(this.value===\'__custom__\')?\'block\':\'none\'"><option value="">-- Select Type --</option>'+mtOpts+'<option value="__custom__">+ Type custom name…</option></select></div>'
        +'<div class="form-group" id="ctr-man-custom-wrap" style="display:none"><label>Custom Fee Name *</label><input id="ctr-man-custom" placeholder="e.g. Excursion Fee"/></div>'
        +'<div class="form-group"><label>Amount (₹) *</label><input id="ctr-man-amt" type="number" placeholder="Amount" min="0"/></div>'
        +'<div class="form-group"><label>Receipt No.</label><input id="ctr-man-receipt" value="'+genReceiptNo('MNL')+'"/></div>'
        +'<div class="form-group"><label>Date</label><input id="ctr-man-date" type="date" value="'+new Date().toISOString().split('T')[0]+'"/></div>'
        +'<div class="form-group"><label>Remarks</label><input id="ctr-man-remark" placeholder="Optional"/></div>'
        +'</div>'
        +'<div class="form-actions">'
        +'<button class="btn btn-primary" onclick="counterSaveManual('+selStu.id+')">✓ Save &amp; Print Receipt</button>'
        +'<button class="btn" onclick="counterSaveManual('+selStu.id+',true)" style="background:#dcfce7;color:#16a34a;border:1px solid #86efac">✓ Save Only</button>'
        +'<button class="btn btn-outline" onclick="feesCounterStu=\'\';render()">Cancel</button>'
        +'</div>'
        +'</div>';
    }
  } // end if(selStu)
  var allRecs=[].concat(
    loadMonthlyRecords().map(function(r){return Object.assign({},r,{_type:'Monthly'});}).slice(-10),
    loadFullPaymentRecords().map(function(r){return Object.assign({},r,{_type:'Full Pay'});}).slice(-10),
    loadAdmissionRecords().map(function(r){return Object.assign({},r,{_type:'Admission'});}).slice(-10),
    loadAdvanceFeeRecords().map(function(r){return Object.assign({},r,{_type:'Advance'});}).slice(-10),
    loadItemRecords().map(function(r){return Object.assign({},r,{_type:'Items'});}).slice(-10),
    loadManualFeeRecords().map(function(r){return Object.assign({},r,{_type:r.feeType||'Manual'});}).slice(-10),
    loadFeeGroupRecords().map(function(r){return Object.assign({},r,{_type:r.groupName||'Fee Group'});}).slice(-10)
  ).sort(function(a,b){return(b.createdAt||b.date||'').localeCompare(a.createdAt||a.date||'');}).slice(0,15);
  var typeColors={'Monthly':'#1433a8','Full Pay':'#7c3aed','Admission':'#16a34a','Advance':'#d97706','Items':'#0891b2','Manual':'#475569','Fee Group':'#be185d'};
  var recentRows=allRecs.map(function(r){
    return '<tr>'
      +'<td style="font-family:\'JetBrains Mono\',monospace;font-size:11px">'+esc(r.date||'')+'</td>'
      +'<td><span style="padding:2px 8px;border-radius:12px;font-size:10.5px;font-weight:700;background:'+(typeColors[r._type]||'#64748b')+'22;color:'+(typeColors[r._type]||'#64748b')+'">'+esc(r._type)+'</span></td>'
      +'<td style="font-weight:700">'+esc(r.student||r.studentName||'--')+'</td>'
      +'<td>'+esc(r.course||r.cls||r.forMonth||'--')+'</td>'
      +'<td style="font-family:\'JetBrains Mono\',monospace;font-weight:700;color:#16a34a">₹'+(r.amountPaid||r.totalAmount||r.amount||0).toLocaleString()+'</td>'
      +'<td style="font-size:11px;color:var(--muted)">'+esc(r.receipt||'--')+'</td>'
      +'<td><button onclick="reprintAny(\''+esc(r.id||'')+'\',\''+esc(r._type)+'\')" style="background:var(--accent-light);color:var(--accent);border:1px solid var(--accent);border-radius:5px;padding:3px 8px;cursor:pointer;font-size:10.5px;font-weight:700;font-family:\'DM Sans\',sans-serif">🖨 Reprint</button></td>'
    +'</tr>';
  }).join('');
  /* Build student list items HTML (all rendered, JS hides non-matches) */
  var _feeHouseMap = gnsiGetHouseMap();   // PERF: hoist outside loop
  var stuListItems=students.length
    ? students.map(function(s){
        var ex=stuLoadExtra(s.id);
        var isSel=s.id==feesCounterStu;
        var hue=s.name.split('').reduce(function(a,c){return a+c.charCodeAt(0);},0)%360;
        var house=_feeHouseMap[String(s.id)]||ex.house||'';
        return '<div class="ctr-stu-item" data-id="'+parseInt(s.id,10)+'" data-name="'+esc(s.name)+'" data-roll="'+esc(s.roll||'')+'" data-cls="'+esc(s.cls||'')+'" data-adm="'+esc(ex.admNo||'')+'" data-phone="'+esc(maskPhone(s.phone||''))+'"'
          +' onclick="ctrSelectStudent('+parseInt(s.id,10)+')"'
          +' style="display:flex;align-items:center;gap:10px;padding:9px 14px;cursor:pointer;border-bottom:1px solid var(--border-soft);transition:background .12s;'+(isSel?'background:var(--accent-light);border-left:3px solid var(--accent);':'border-left:3px solid transparent;')+'"'
          +' onmouseenter="if('+(!isSel)+')this.style.background=\'var(--surface2)\'" onmouseleave="if('+(!isSel)+')this.style.background=\'\'">'
          +'<div style="width:32px;height:32px;border-radius:50%;background:hsl('+hue+',42%,48%);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:11px;flex-shrink:0">'
          +(s.name.trim().split(' ').slice(0,2).map(function(w){return w[0];}).join('').toUpperCase())
          +'</div>'
          +'<div style="flex:1;min-width:0">'
          +'<div class="ctr-stu-name" style="font-weight:700;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:'+(isSel?'var(--accent)':'var(--text)')+'">'+esc(s.name)+'</div>'
          +'<div style="font-size:10.5px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'
          +esc(s.cls)+(s.roll?' · #'+esc(s.roll):'')+(s.hostel==='Yes'?' · 🏠':'')+(house?' · '+house:'')
          +'</div></div>'
          +(isSel?'<span style="font-size:14px;color:var(--accent);font-weight:800;flex-shrink:0">✓</span>':'')
          +'</div>';
      }).join('')
    : '<div style="padding:24px;text-align:center;color:var(--muted);font-size:13px">No students enrolled yet.</div>';
  return '<div style="display:grid;grid-template-columns:300px 1fr;gap:20px;align-items:start">'
    // Left: smart student picker
    +'<div>'
    +'<div class="card" style="overflow:hidden">'
    +'<div class="card-head" style="padding:14px 16px">'
    +'<span class="card-title" style="font-size:15px">🖥️ Select Student</span>'
    +(selStu?'<button onclick="feesCounterStu=\'\';render()" style="font-size:11px;padding:3px 8px;border-radius:6px;border:1px solid #fca5a5;background:#fee2e2;color:#dc2626;cursor:pointer;font-weight:700;font-family:\'DM Sans\',sans-serif">✕ Clear</button>':'')
    +'</div>'
    // Search box
    +'<div style="padding:10px 12px;border-bottom:1px solid var(--border-soft);background:var(--surface2)">'
    +'<div style="position:relative">'
    +'<span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:13px;color:var(--muted2);pointer-events:none">🔍</span>'
    +'<input id="ctr-search-inp" placeholder="Search name, roll, class, adm no, phone…"'
    +' oninput="ctrFilterList()"'
    +' onkeydown="if(event.key===\'Escape\'){this.value=\'\';ctrFilterList();}"'
    +' style="width:100%;padding:8px 10px 8px 32px;border-radius:8px;border:1.5px solid var(--border);font-family:\'DM Sans\',sans-serif;font-size:12.5px;background:var(--surface);color:var(--text);outline:none"/>'
    +'</div>'
    +'<div id="ctr-search-count" style="font-size:10.5px;color:var(--accent);margin-top:4px;font-family:\'JetBrains Mono\',monospace;min-height:16px"></div>'
    +'</div>'
    // Student list (scrollable, DOM-filtered)
    +'<div id="ctr-student-list" style="max-height:360px;overflow-y:auto">'
    +stuListItems
    +'</div>'
    // Selected student info
    +(selStu
      ? (function(){
          var ex2=stuLoadExtra(selStu.id);
          var conf2=loadFeeConf();
          var cc=conf2.monthlyFees.find(function(f){return f.course===selStu.cls;})||{amount:10000,hostelAmount:5000};
          var ac=conf2.admissionFees.find(function(f){return f.course===selStu.cls;})||{amount:5000};
          var mt=parseInt(cc.amount||0)+(selStu.hostel==='Yes'?parseInt(cc.hostelAmount||0):0);
          /* SMART: override with CM fees */
          var _ci=gnsiGetStudentCourseInfo(selStu.id);
          if(_ci&&_ci.fees){
            if(_ci.fees.monthly)  mt=parseInt(_ci.fees.monthly||0)+(selStu.hostel==='Yes'?parseInt(_ci.fees.hostel||cc.hostelAmount||0):0);
            if(_ci.fees.admission) ac.amount=parseInt(_ci.fees.admission)||ac.amount;
          }
          var courseTag=_ci?('<div style="display:inline-flex;align-items:center;gap:5px;background:'+(_ci.courseColor||'var(--accent)')+'22;color:'+(_ci.courseColor||'var(--accent)')+';border:1px solid '+(_ci.courseColor||'var(--accent)')+'44;border-radius:8px;padding:2px 9px;font-size:10px;font-weight:700;margin-top:4px">'+(_ci.courseIcon||'📚')+' '+esc(_ci.courseName)+' · '+esc(_ci.subTypeLabel)+'</div>'):'';
          return '<div style="padding:12px 14px;background:var(--accent-light);border-top:2px solid var(--accent)">'
            +'<div style="font-size:11px;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:.08em;font-family:\'JetBrains Mono\',monospace;margin-bottom:6px">Selected Student</div>'
            +'<div style="font-size:14px;font-weight:800;color:var(--accent)">'+esc(selStu.name)+'</div>'
            +'<div style="font-size:11.5px;color:var(--muted);margin-top:2px">'+esc(selStu.cls)+' · '+(selStu.hostel==='Yes'?'Hostel':'Day Scholar')+(ex2.admNo?' · '+esc(ex2.admNo):'')+'</div>'
            +courseTag
            +'<div style="display:flex;gap:8px;margin-top:8px">'
            +'<div style="flex:1;background:var(--surface);border-radius:7px;padding:6px 10px;text-align:center;border:1px solid var(--border)"><div style="font-size:9px;color:var(--muted);text-transform:uppercase">Monthly</div><div style="font-size:14px;font-weight:800;color:var(--accent)">₹'+mt.toLocaleString()+'</div>'
            +(_ci&&_ci.fees&&_ci.fees.monthly?'<div style="font-size:8px;color:#16a34a;font-weight:700">✦ CM Rate</div>':'')
            +'</div>'
            +'<div style="flex:1;background:var(--surface);border-radius:7px;padding:6px 10px;text-align:center;border:1px solid var(--border)"><div style="font-size:9px;color:var(--muted);text-transform:uppercase">Admission</div><div style="font-size:14px;font-weight:800;color:#16a34a">₹'+ac.amount.toLocaleString()+'</div>'
            +(_ci&&_ci.fees&&_ci.fees.admission?'<div style="font-size:8px;color:#16a34a;font-weight:700">✦ CM Rate</div>':'')
            +'</div>'
            +((_ci&&_ci.fees&&_ci.fees.hostel&&selStu.hostel==='Yes')?'<div style="flex:1;background:var(--surface);border-radius:7px;padding:6px 10px;text-align:center;border:1px solid var(--border)"><div style="font-size:9px;color:var(--muted);text-transform:uppercase">Hostel</div><div style="font-size:14px;font-weight:800;color:#7c3aed">₹'+parseInt(_ci.fees.hostel).toLocaleString()+'</div><div style="font-size:8px;color:#16a34a;font-weight:700">✦ CM Rate</div></div>':'')
            +'</div></div>';
        })()
      : '<div style="padding:14px;text-align:center;color:var(--muted);font-size:12.5px;border-top:1px solid var(--border-soft)">👆 Click a student above to begin</div>')
    +'</div></div>'
    // Right: payment panel
    +'<div id="ctr-pay-panel">'+(selStu
      ? '<div style="background:linear-gradient(135deg,#0b1e6e,#1433a8);border-radius:var(--radius);padding:16px 20px;margin-bottom:16px;display:flex;align-items:center;gap:14px">'
        +avatarHTML(selStu.name,44)
        +'<div style="flex:1"><div style="font-size:16px;font-weight:800;color:#fff">'+esc(selStu.name)+'</div>'
        +'<div style="font-size:12px;color:rgba(255,255,255,.75);margin-top:2px">'+esc(selStu.cls)+' · '+(selStu.hostel==='Yes'?'🏠 Hostel':'Day Scholar')+(ex.admNo?' · '+esc(ex.admNo):'')+'</div>'
        +(function(){var _ci2=gnsiGetStudentCourseInfo(selStu.id);return _ci2?'<div style="display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.3);border-radius:8px;padding:2px 10px;font-size:10px;font-weight:700;color:#ffd060;margin-top:5px">'+(_ci2.courseIcon||'📚')+' '+esc(_ci2.courseName)+' -- '+esc(_ci2.subTypeLabel)+'</div>':'';}())
        +'</div>'
        +'<div style="display:flex;gap:8px"><div style="text-align:center;background:rgba(255,255,255,.15);border-radius:8px;padding:6px 12px"><div style="font-size:9px;color:rgba(255,255,255,.7);text-transform:uppercase">Monthly Due</div><div style="font-size:15px;font-weight:800;color:#ffd060">₹'+monthlyTotal.toLocaleString()+'</div></div>'
        +'<div style="text-align:center;background:rgba(255,255,255,.15);border-radius:8px;padding:6px 12px"><div style="font-size:9px;color:rgba(255,255,255,.7);text-transform:uppercase">Adm Fee</div><div style="font-size:15px;font-weight:800;color:#86efac">₹'+admConf.amount.toLocaleString()+'</div></div></div>'
        +'</div>'
        +payPanel
      : '<div class="card" style="padding:32px;text-align:center;color:var(--muted)">← Search and click a student on the left to begin collection</div>')+'</div>'
    +'</div>'
    // Recent transactions
    +'<div class="card" style="margin-top:20px">'
    +'<div class="card-head"><span class="card-title">📋 Recent Transactions</span><span style="font-family:\'JetBrains Mono\',monospace;font-size:11px;color:var(--muted)">Last 15 across all types</span></div>'
    +'<div style="overflow-x:auto"><table><thead><tr><th>Date</th><th>Type</th><th>Student</th><th>Course/Month</th><th>Amount</th><th>Receipt</th><th>Action</th></tr></thead>'
    +'<tbody>'+(recentRows||'<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--muted)">No transactions yet.</td></tr>')+'</tbody></table></div></div>';
}
function ctrAddItemRow(){
  var list=document.getElementById('ctr-items-list');
  if(!list)return;
  var rows=list.querySelectorAll('[id^=ctr-item-row-]');
  var idx=rows.length;
  var div=document.createElement('div');
  div.className='form-grid g3';
  div.id='ctr-item-row-'+idx;
  div.innerHTML='<div class="form-group"><label>Item Name</label><input id="ctr-item-name-'+idx+'" placeholder="Item"/></div>'
    +'<div class="form-group"><label>Amount (₹)</label><input id="ctr-item-amt-'+idx+'" type="number" placeholder="0" min="0" oninput="ctrUpdateItemTotal()"/></div>'
    +'<div class="form-group"><label>Qty</label><input id="ctr-item-qty-'+idx+'" type="number" value="1" min="1" oninput="ctrUpdateItemTotal()"/></div>';
  list.appendChild(div);
}
function ctrUpdateItemTotal(){
  var list=document.getElementById('ctr-items-list');
  if(!list)return;
  var rows=list.querySelectorAll('[id^=ctr-item-row-]');
  var total=0;
  rows.forEach(function(_,i){
    var amt=parseFloat((document.getElementById('ctr-item-amt-'+i)||{}).value||0)||0;
    var qty=parseInt((document.getElementById('ctr-item-qty-'+i)||{}).value||1)||1;
    total+=amt*qty;
  });
  var el=document.getElementById('ctr-item-total');
  if(el)el.textContent='₹'+total.toLocaleString();
}
function counterSaveMonthly(stuId, noprint){
  var s=students.find(function(x){return x.id==stuId;});if(!s)return;
  var ex=stuLoadExtra(s.id);
  var forMonth=((document.getElementById('ctr-month')||{}).value||'').trim();
  var tuition=parseFloat((document.getElementById('ctr-tuition')||{}).value||0)||0;
  var hostelF=parseFloat((document.getElementById('ctr-hostel')||{}).value||0)||0;
  var total=parseFloat((document.getElementById('ctr-total')||{}).value||0)||(tuition+hostelF);
  var receipt=((document.getElementById('ctr-receipt')||{}).value||genReceiptNo('RCP')).trim();
  var date=((document.getElementById('ctr-date')||{}).value||new Date().toISOString().split('T')[0]);
  var remark=((document.getElementById('ctr-remark')||{}).value||'').trim();
  if(!forMonth||!total){alert('Please fill For Month and Amount.');return;}
  var recs=loadMonthlyRecords();
  var rec={id:'mf_'+Date.now(),student:s.name,studentId:s.id,course:s.cls,hostel:s.hostel,forMonth:forMonth,tuitionFee:tuition,hostelFee:hostelF,amountPaid:total,totalAmount:total,receipt:receipt,date:date,remark:remark,collectedBy:currentUser&&currentUser.name||'Staff',createdAt:new Date().toISOString()};
  recs.push(rec);window._dashCache=null;saveMonthlyRecords(recs);
  autoCreditIncome(total,'Monthly Fee -- '+s.name+' ('+forMonth+')',date,'Monthly Fee',receipt,rec.id);
  gnsiCMSyncFeeStatus(s.id,'Paid','monthly'); /* ← CM integration */
  if(!noprint) printFeeReceipt({type:'monthly',student:s.name,cls:s.cls,hostel:s.hostel,forMonth:forMonth,tuitionFee:tuition,hostelFee:hostelF,totalAmount:total,receiptNo:receipt,date:date,collectedBy:rec.collectedBy,remarks:remark});
  feesCounterStu='';feesCounterType='monthly';alert('✅ Monthly fee saved!'+(noprint?'':' Receipt opened.'));render();
}
function counterSaveFullPay(stuId){
  var s=students.find(function(x){return x.id==stuId;});if(!s)return;
  var months=((document.getElementById('ctr-fp-months')||{}).value||'').trim();
  var tuition=parseFloat((document.getElementById('ctr-fp-tuition')||{}).value||0)||0;
  var hostelF=parseFloat((document.getElementById('ctr-fp-hostel')||{}).value||0)||0;
  var total=parseFloat((document.getElementById('ctr-fp-total')||{}).value||0)||0;
  var receipt=((document.getElementById('ctr-fp-receipt')||{}).value||genReceiptNo('FPR')).trim();
  var date=((document.getElementById('ctr-fp-date')||{}).value||new Date().toISOString().split('T')[0]);
  var remark=((document.getElementById('ctr-fp-remark')||{}).value||'').trim();
  if(!total){alert('Please enter total amount.');return;}
  var recs=loadFullPaymentRecords();
  var rec={id:'fp_'+Date.now(),student:s.name,studentId:s.id,course:s.cls,hostel:s.hostel,months:months,tuitionFee:tuition,hostelFee:hostelF,totalAmount:total,amountPaid:total,receipt:receipt,date:date,remark:remark,collectedBy:currentUser&&currentUser.name||'Staff',createdAt:new Date().toISOString()};
  recs.push(rec);saveFullPaymentRecords(recs);
  autoCreditIncome(total,'Full Payment -- '+s.name+' ('+months+')',date,'Full Payment',receipt,rec.id);
  gnsiCMSyncFeeStatus(s.id,'Paid','fullpay'); /* ← CM integration */
  printFeeReceipt({type:'fullpayment',student:s.name,cls:s.cls,hostel:s.hostel,months:months,tuitionFee:tuition,hostelFee:hostelF,totalAmount:total,receiptNo:receipt,date:date,collectedBy:rec.collectedBy,remarks:remark});
  feesCounterStu='';alert('✅ Full payment saved! Receipt opened.');render();
}
function counterSaveAdmission(stuId){
  var s=students.find(function(x){return x.id==stuId;});if(!s)return;
  var amt=parseFloat((document.getElementById('ctr-adm-amt')||{}).value||0)||0;
  var receipt=((document.getElementById('ctr-adm-receipt')||{}).value||genReceiptNo('ADM')).trim();
  var date=((document.getElementById('ctr-adm-date')||{}).value||new Date().toISOString().split('T')[0]);
  var remark=((document.getElementById('ctr-adm-remark')||{}).value||'').trim();
  if(!amt){alert('Please enter amount.');return;}
  var recs=loadAdmissionRecords();
  var rec={id:'adm_'+Date.now(),student:s.name,studentId:s.id,course:s.cls,amountPaid:amt,totalAmount:amt,receipt:receipt,date:date,remark:remark,collectedBy:currentUser&&currentUser.name||'Staff',createdAt:new Date().toISOString()};
  recs.push(rec);window._dashCache=null;window._dashCache=null;saveAdmissionRecords(recs);
  autoCreditIncome(amt,'Admission Fee -- '+s.name,date,'Admission Fee',receipt,rec.id);
  gnsiCMSyncFeeStatus(s.id,'Paid','admission'); /* ← CM integration */
  printFeeReceipt({type:'admission',student:s.name,cls:s.cls,totalAmount:amt,receiptNo:receipt,date:date,collectedBy:rec.collectedBy,remarks:remark});
  feesCounterStu='';alert('✅ Admission fee saved! Receipt opened.');render();
}
function counterSaveAdvance(stuId){
  var s=students.find(function(x){return x.id==stuId;});if(!s)return;
  var amt=parseFloat((document.getElementById('ctr-adv-amt')||{}).value||0)||0;
  var advMonths=((document.getElementById('ctr-adv-months')||{}).value||'').trim();
  var receipt=((document.getElementById('ctr-adv-receipt')||{}).value||genReceiptNo('ADV')).trim();
  var date=((document.getElementById('ctr-adv-date')||{}).value||new Date().toISOString().split('T')[0]);
  var remark=((document.getElementById('ctr-adv-remark')||{}).value||'').trim();
  if(!amt){alert('Please enter advance amount.');return;}
  var recs=loadAdvanceFeeRecords();
  var rec={id:'adv_'+Date.now(),student:s.name,studentId:s.id,course:s.cls,hostel:s.hostel,advanceMonths:advMonths,totalAmount:amt,amountPaid:amt,receipt:receipt,date:date,remark:remark,collectedBy:currentUser&&currentUser.name||'Staff',createdAt:new Date().toISOString()};
  recs.push(rec);saveAdvanceFeeRecords(recs);
  autoCreditIncome(amt,'Advance Fee -- '+s.name+(advMonths?' ('+advMonths+')':''),date,'Advance Fee',receipt,rec.id);
  gnsiCMSyncFeeStatus(s.id,'Paid','advance'); /* ← CM integration */
  printFeeReceipt({type:'advance',student:s.name,cls:s.cls,hostel:s.hostel,advanceMonths:advMonths,totalAmount:amt,receiptNo:receipt,date:date,collectedBy:rec.collectedBy,remarks:remark});
  feesCounterStu='';alert('✅ Advance fee saved! Receipt opened.');render();
}
function counterSaveItems(stuId){
  var s=students.find(function(x){return x.id==stuId;});if(!s)return;
  var list=document.getElementById('ctr-items-list');
  var rows=list?list.querySelectorAll('[id^=ctr-item-row-]'):[];
  var itemsList=[];var total=0;
  rows.forEach(function(_,i){
    var nm=((document.getElementById('ctr-item-name-'+i)||{}).value||'').trim();
    var amt=parseFloat((document.getElementById('ctr-item-amt-'+i)||{}).value||0)||0;
    var qty=parseInt((document.getElementById('ctr-item-qty-'+i)||{}).value||1)||1;
    if(nm&&amt>0) {itemsList.push({name:nm,amount:amt,qty:qty});total+=amt*qty;}
  });
  if(!itemsList.length){alert('Please add at least one item.');return;}
  var receipt=((document.getElementById('ctr-item-receipt')||{}).value||genReceiptNo('ITM')).trim();
  var date=((document.getElementById('ctr-item-date')||{}).value||new Date().toISOString().split('T')[0]);
  var recs=loadItemRecords();
  var rec={id:'itm_'+Date.now(),student:s.name,studentId:s.id,course:s.cls,itemsList:itemsList,totalAmount:total,amountPaid:total,receipt:receipt,date:date,collectedBy:currentUser&&currentUser.name||'Staff',createdAt:new Date().toISOString()};
  recs.push(rec);saveItemRecords(recs);
  autoCreditIncome(total,'Items/Provisions -- '+s.name+' ('+itemsList.map(function(it){return it.name;}).join(', ')+')',date,'Items Provided',receipt,rec.id);
  printFeeReceipt({type:'item',student:s.name,cls:s.cls,itemsList:itemsList,totalAmount:total,receiptNo:receipt,date:date,collectedBy:rec.collectedBy});
  feesCounterStu='';alert('✅ Items recorded! Receipt opened.');render();
}
function ctrFeeGroupAutoFill(sel){
  var opt=sel.options[sel.selectedIndex];
  var amt=opt&&opt.getAttribute('data-amt');
  var inp=document.getElementById('ctr-fg-amt');
  if(inp&&amt)inp.value=amt;
}
function counterSaveFeeGroup(stuId){
  var s=students.find(function(x){return x.id==stuId;});if(!s)return;
  var conf=loadFeeConf();
  var groupId=((document.getElementById('ctr-fg-group')||{}).value||'').trim();
  var group=conf.feeGroups.find(function(g){return g.id===groupId;});
  if(!groupId||!group){alert('Please select a Fee Group.');return;}
  var amt=parseFloat((document.getElementById('ctr-fg-amt')||{}).value||0)||0;
  if(!amt){alert('Amount is required.');return;}
  var receipt=((document.getElementById('ctr-fg-receipt')||{}).value||genReceiptNo('FGR')).trim();
  var date=((document.getElementById('ctr-fg-date')||{}).value||new Date().toISOString().split('T')[0]);
  var remark=((document.getElementById('ctr-fg-remark')||{}).value||'').trim();
  var recs=loadFeeGroupRecords();
  var rec={id:'fgr_'+Date.now(),student:s.name,studentId:s.id,course:s.cls,groupId:groupId,groupName:group.name,amountPaid:amt,totalAmount:amt,receipt:receipt,date:date,remark:remark,collectedBy:currentUser&&currentUser.name||'Staff',createdAt:new Date().toISOString()};
  recs.push(rec);saveFeeGroupRecords(recs);
  autoCreditIncome(amt,'Fee Group -- '+group.name+' ('+s.name+')',date,'Fee Group',receipt,rec.id);
  printFeeReceipt({type:'manual',student:s.name,cls:s.cls,feeType:group.name,totalAmount:amt,receiptNo:receipt,date:date,collectedBy:rec.collectedBy,remarks:remark});
  feesCounterStu='';feesCounterType='monthly';alert('✅ Fee Group payment saved! Receipt opened.');render();
}
function counterSaveManual(stuId, noprint){
  var s=students.find(function(x){return x.id==stuId;});if(!s)return;
  var typeVal=((document.getElementById('ctr-man-type')||{}).value||'').trim();
  var customVal=((document.getElementById('ctr-man-custom')||{}).value||'').trim();
  var feeType=typeVal==='__custom__'?customVal:typeVal;
  if(!feeType){alert('Please select or enter a fee type.');return;}
  var amt=parseFloat((document.getElementById('ctr-man-amt')||{}).value||0)||0;
  if(!amt){alert('Amount is required.');return;}
  var receipt=((document.getElementById('ctr-man-receipt')||{}).value||genReceiptNo('MNL')).trim();
  var date=((document.getElementById('ctr-man-date')||{}).value||new Date().toISOString().split('T')[0]);
  var remark=((document.getElementById('ctr-man-remark')||{}).value||'').trim();
  var recs=loadManualFeeRecords();
  var rec={id:'mnl_'+Date.now(),student:s.name,studentId:s.id,course:s.cls,feeType:feeType,amountPaid:amt,totalAmount:amt,receipt:receipt,date:date,remark:remark,collectedBy:currentUser&&currentUser.name||'Staff',createdAt:new Date().toISOString()};
  recs.push(rec);saveManualFeeRecords(recs);
  autoCreditIncome(amt,feeType+' -- '+s.name,date,feeType,receipt,rec.id);
  if(!noprint) printFeeReceipt({type:'manual',student:s.name,cls:s.cls,feeType:feeType,totalAmount:amt,receiptNo:receipt,date:date,collectedBy:rec.collectedBy,remarks:remark});
  feesCounterStu='';feesCounterType='monthly';alert('✅ Manual fee saved!'+(noprint?'':' Receipt opened.'));render();
}
function reprintAny(id, type){
  var allSources={
    'Monthly':loadMonthlyRecords,
    'Full Pay':loadFullPaymentRecords,
    'Admission':loadAdmissionRecords,
    'Advance':loadAdvanceFeeRecords,
    'Items':loadItemRecords,
    'Fee Group':loadFeeGroupRecords,
    'Manual':loadManualFeeRecords
  };
  // dynamic manual fee type names (from the type label stored on the record)
  var loader=allSources[type]||function(){return[].concat(loadManualFeeRecords(),loadFeeGroupRecords());};
  var rec=(allSources[type]?loader():loader()).find(function(r){return r.id===id;});
  if(!rec){alert('Record not found.');return;}
  var tmap={'Monthly':'monthly','Full Pay':'fullpayment','Admission':'admission','Advance':'advance','Items':'item','Fee Group':'manual','Manual':'manual'};
  printFeeReceipt(Object.assign({},rec,{type:tmap[type]||'manual',student:rec.student||rec.studentName,cls:rec.course||rec.cls,feeType:rec.feeType||rec.groupName||type,totalAmount:rec.totalAmount||rec.amountPaid}));
}
/* -- MONTHLY FEES TAB -- */
function renderMonthlyFees(){
  var conf=loadFeeConf();
  var records=loadMonthlyRecords();
  var totalCollected=records.reduce(function(s,r){return s+(r.amountPaid||0);},0);
  var confRows=conf.monthlyFees.map(function(f){
    if(feesEditMonthId===f.id){
      return '<tr style="background:var(--accent-light)">'
        +'<td><input id="mf-course-'+parseInt(f.id,10)+'" value="'+esc(f.course)+'" style="border:1px solid var(--border);border-radius:6px;padding:5px 8px;width:100%;font-family:\'DM Sans\',sans-serif;background:var(--surface);color:var(--text)"/></td>'
        +'<td><input id="mf-amt-'+parseInt(f.id,10)+'" type="number" value="'+f.amount+'" style="border:1px solid var(--border);border-radius:6px;padding:5px 8px;font-family:\'JetBrains Mono\',monospace;background:var(--surface);color:var(--text);width:100px"/></td>'
        +'<td><input id="mf-hostel-'+parseInt(f.id,10)+'" type="number" value="'+(f.hostelAmount||0)+'" style="border:1px solid var(--border);border-radius:6px;padding:5px 8px;font-family:\'JetBrains Mono\',monospace;background:var(--surface);color:var(--text);width:100px"/></td>'
        +'<td><button onclick="feeSaveMonthConf(\''+parseInt(f.id,10)+'\')" style="background:var(--accent);color:#fff;border:none;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:11px;font-weight:700;font-family:\'DM Sans\',sans-serif;margin-right:4px">✓</button><button onclick="feesEditMonthId=null;render()" style="background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:4px 10px;cursor:pointer;font-size:11px">✕</button></td></tr>';
    }
    return '<tr>'
      +'<td style="font-weight:700">'+esc(f.course)+'</td>'
      +'<td style="font-family:\'JetBrains Mono\',monospace;font-weight:700;color:var(--accent)">₹'+f.amount.toLocaleString()+'</td>'
      +'<td style="font-family:\'JetBrains Mono\',monospace;font-weight:700;color:#3b78c9">₹'+(f.hostelAmount||0).toLocaleString()+'</td>'
      +'<td><button onclick="feesEditMonthId=\''+parseInt(f.id,10)+'\';render()" style="background:var(--accent-light);color:var(--accent);border:1px solid var(--accent);border-radius:6px;padding:4px 9px;cursor:pointer;font-size:11px;font-weight:700;font-family:\'DM Sans\',sans-serif">✏</button></td>'
    +'</tr>';
  }).join('');
  var addForm='';
  if(feesMonthFormOpen){
    var mOpts=conf.monthlyFees.map(function(f){return'<option value="'+esc(f.course)+'" data-tuition="'+f.amount+'" data-hostel="'+(f.hostelAmount||0)+'">'+esc(f.course)+'</option>';}).join('');
    var stuOpts='<option value="">--</option>'+students.map(function(s){return'<option value="'+esc(s.name)+'" data-hostel="'+esc(s.hostel)+'">'+esc(s.name)+' ('+esc(s.cls)+')</option>';}).join('');
    var MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
    var curM=MONTHS[new Date().getMonth()]+' '+new Date().getFullYear();
    var monthOpts=MONTHS.flatMap(function(m){return[new Date().getFullYear(),new Date().getFullYear()+1].map(function(y){return'<option value="'+m+' '+y+'">'+m+' '+y+'</option>';});}).join('');
    addForm='<div class="form-panel" style="border-color:var(--accent)">'
      +'<div class="form-title" style="color:var(--accent)">📅 Record Monthly Fee Payment</div>'
      +'<div class="form-grid g3">'
      +'<div class="form-group"><label>Student *</label><input id="mfr-student" list="mfr-stu-list" placeholder="Student name"/><datalist id="mfr-stu-list">'+stuOpts+'</datalist></div>'
      +'<div class="form-group"><label>Course *</label><select id="mfr-course" onchange="feeAutoFillMonth(this)"><option value="">--</option>'+mOpts+'</select></div>'
      +'<div class="form-group"><label>For Month *</label><select id="mfr-month"><option value="'+curM+'">'+curM+'</option>'+monthOpts+'</select></div>'
      +'<div class="form-group"><label>Tuition Fee (₹)</label><input id="mfr-tuition" type="number" min="0"/></div>'
      +'<div class="form-group"><label>Hostel Fee (₹)</label><input id="mfr-hostel" type="number" min="0" value="0"/></div>'
      +'<div class="form-group"><label>Total Paid (₹) *</label><input id="mfr-total" type="number" min="0"/></div>'
      +'<div class="form-group"><label>Date</label><input id="mfr-date" type="date" value="'+new Date().toISOString().split('T')[0]+'"/></div>'
      +'<div class="form-group"><label>Receipt No.</label><input id="mfr-receipt" value="'+genReceiptNo('RCP')+'"/></div>'
      +'<div class="form-group"><label>Remarks</label><input id="mfr-remark" placeholder="Optional"/></div>'
      +'</div>'
      +'<div class="form-actions">'
      +'<button class="btn btn-primary" onclick="feeSaveMonthRecord(false)">💾 Save &amp; Print</button>'
      +'<button class="btn" onclick="feeSaveMonthRecord(true)" style="background:#dcfce7;color:#16a34a;border:1px solid #86efac">💾 Save Only</button>'
      +'<button class="btn btn-outline" onclick="feesMonthFormOpen=false;render()">Cancel</button>'
      +'</div></div>';
  }
  var recRows=records.slice().reverse().map(function(r){
    return '<tr>'
      +'<td style="font-size:11px;font-family:\'JetBrains Mono\',monospace">'+esc(r.date||'')+'</td>'
      +'<td><div style="font-weight:700">'+esc(r.student||'')+'</div><div style="font-size:11px;color:var(--muted)">'+esc(r.course||'')+'</div></td>'
      +'<td style="font-weight:700;color:var(--accent)">'+esc(r.forMonth||'--')+'</td>'
      +'<td style="font-family:\'JetBrains Mono\',monospace;font-size:12px">₹'+(r.tuitionFee||0).toLocaleString()+'</td>'
      +'<td style="font-family:\'JetBrains Mono\',monospace;font-size:12px">₹'+(r.hostelFee||0).toLocaleString()+'</td>'
      +'<td style="font-family:\'JetBrains Mono\',monospace;font-weight:700;color:#16a34a">₹'+(r.amountPaid||0).toLocaleString()+'</td>'
      +'<td style="font-size:11px;color:var(--muted)">'+esc(r.receipt||'--')+'</td>'
      +'<td style="white-space:nowrap">'
      +'<button onclick="reprintAny(\''+parseInt(r.id,10)+'\',\'Monthly\')" style="background:var(--accent-light);color:var(--accent);border:1px solid var(--accent);border-radius:5px;padding:3px 8px;cursor:pointer;font-size:10.5px;font-weight:700;font-family:\'DM Sans\',sans-serif;margin-right:3px">🖨</button>'
      +(canDo('del','fees')?'<button onclick="feeDeleteMonthRecord(\''+parseInt(r.id,10)+'\')" style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;border-radius:5px;padding:3px 8px;cursor:pointer;font-size:10.5px;font-weight:700;font-family:\'DM Sans\',sans-serif">✕</button>':'')
      +'</td></tr>';
  }).join('');
  /* -- Fee Groups settings panel -- */
  var isAdm=currentUser&&currentUser.role==='admin';
  var fgRows=(conf.feeGroups||[]).map(function(g){
    return '<tr>'
      +'<td style="font-weight:700">'+esc(g.name)+'</td>'
      +'<td style="font-family:\'JetBrains Mono\',monospace;font-weight:700;color:#be185d">₹'+Number(g.amount).toLocaleString()+'</td>'
      +'<td style="font-size:12px;color:var(--muted)">'+esc(g.description||'')+'</td>'
      +(isAdm?'<td><button onclick="feeDeleteFeeGroup(\''+g.id+'\')" style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;border-radius:6px;padding:4px 9px;cursor:pointer;font-size:11px;font-weight:700;font-family:\'DM Sans\',sans-serif">✕ Remove</button></td>':'<td></td>')
      +'</tr>';
  }).join('');
  var fgAddForm=isAdm?'<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;padding:14px 16px;border-top:1px solid var(--border-soft)">'
    +'<div class="form-group" style="margin:0;flex:1;min-width:160px"><label style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px">Group Name *</label><input id="fg-new-name" placeholder="e.g. Science Kit Fee" style="width:100%;padding:8px 11px;border:1.5px solid var(--border);border-radius:8px;font-family:\'DM Sans\',sans-serif;font-size:13px;background:var(--surface);color:var(--text)"/></div>'
    +'<div class="form-group" style="margin:0;flex:0 0 130px"><label style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px">Amount (₹) *</label><input id="fg-new-amt" type="number" min="0" placeholder="0" style="width:100%;padding:8px 11px;border:1.5px solid var(--border);border-radius:8px;font-family:\'JetBrains Mono\',monospace;font-size:13px;background:var(--surface);color:var(--text)"/></div>'
    +'<div class="form-group" style="margin:0;flex:1;min-width:160px"><label style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px">Description</label><input id="fg-new-desc" placeholder="Optional description" style="width:100%;padding:8px 11px;border:1.5px solid var(--border);border-radius:8px;font-family:\'DM Sans\',sans-serif;font-size:13px;background:var(--surface);color:var(--text)"/></div>'
    +'<button onclick="feeAddFeeGroup()" style="padding:9px 20px;background:#be185d;color:#fff;border:none;border-radius:8px;font-weight:700;font-size:13px;cursor:pointer;font-family:\'DM Sans\',sans-serif;white-space:nowrap">+ Add Group</button>'
    +'</div>':'';
  /* -- Manual Fee Types settings panel -- */
  var mftItems=(conf.manualFeeTypes||[]).map(function(t,i){
    return '<span style="display:inline-flex;align-items:center;gap:6px;background:var(--surface2);border:1px solid var(--border);border-radius:20px;padding:5px 12px;font-size:12px;font-weight:600">'
      +esc(t)
      +(isAdm?'<button onclick="feeRemoveManualType('+i+')" style="background:none;border:none;cursor:pointer;color:#dc2626;font-size:13px;line-height:1;padding:0" title="Remove">×</button>':'')
      +'</span>';
  }).join('');
  var mftAddForm=isAdm?'<div style="display:flex;gap:8px;align-items:center;padding:12px 16px;border-top:1px solid var(--border-soft);flex-wrap:wrap">'
    +'<input id="mft-new-name" placeholder="New fee type name…" style="flex:1;min-width:180px;padding:8px 11px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;font-family:\'DM Sans\',sans-serif;background:var(--surface);color:var(--text)" onkeydown="if(event.key===\'Enter\')feeAddManualType()"/>'
    +'<button onclick="feeAddManualType()" style="padding:9px 20px;background:#475569;color:#fff;border:none;border-radius:8px;font-weight:700;font-size:13px;cursor:pointer;font-family:\'DM Sans\',sans-serif">+ Add Type</button>'
    +'</div>':'';
  return '<div class="stat-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:20px">'
    +'<div class="stat-card" style="--c:#16a34a"><div class="stat-label">Total Collected</div><div class="stat-val">₹'+Math.round(totalCollected/1000)+'K</div><div class="stat-sub">Monthly fees</div></div>'
    +'<div class="stat-card" style="--c:#1433a8"><div class="stat-label">Transactions</div><div class="stat-val">'+records.length+'</div><div class="stat-sub">Records</div></div>'
    +'<div class="stat-card" style="--c:#d4a853"><div class="stat-label">Courses</div><div class="stat-val">'+conf.monthlyFees.length+'</div><div class="stat-sub">Fee structures</div></div>'
    +'</div>'
    +'<div class="card" style="margin-bottom:18px"><div class="card-head"><span class="card-title">Monthly Fee Structure</span></div>'
    +'<div style="overflow-x:auto"><table><thead><tr><th>Course</th><th>Tuition Fee</th><th>Hostel Fee</th><th>Edit</th></tr></thead><tbody>'+confRows+'</tbody></table></div></div>'
    +'<div style="display:flex;gap:10px;margin-bottom:16px">'
    +'<button class="btn btn-primary" onclick="feesMonthFormOpen=!feesMonthFormOpen;render()">+ Record Payment</button>'
    +'</div>'+addForm
    +'<div class="card"><div class="card-head"><span class="card-title">Monthly Fee Records</span></div>'
    +'<div style="overflow-x:auto"><table><thead><tr><th>Date</th><th>Student</th><th>Month</th><th>Tuition</th><th>Hostel</th><th>Paid</th><th>Receipt</th><th>Actions</th></tr></thead>'
    +'<tbody>'+(recRows||'<tr><td colspan="8" style="padding:32px;text-align:center;color:var(--muted)">No monthly fee records yet.</td></tr>')+'</tbody></table></div></div>'
    /* -- Fee Groups card -- */
    +'<div class="card" style="margin-top:20px">'
    +'<div class="card-head">'
    +'<span class="card-title">🏷 Fee Groups</span>'
    +'<span style="font-size:12px;color:var(--muted)">Named fee bundles selectable at the counter</span>'
    +'</div>'
    +'<div style="overflow-x:auto"><table><thead><tr><th>Group Name</th><th>Amount</th><th>Description</th>'+(isAdm?'<th>Action</th>':'')+'</tr></thead>'
    +'<tbody>'+(fgRows||'<tr><td colspan="4" style="padding:24px;text-align:center;color:var(--muted)">No Fee Groups yet.'+(isAdm?' Add one below.':' Ask Admin to add.')+'</td></tr>')+'</tbody></table></div>'
    +fgAddForm
    +'</div>'
    /* -- Manual Fee Types card -- */
    +'<div class="card" style="margin-top:20px">'
    +'<div class="card-head">'
    +'<span class="card-title">✏️ Manual Fee Types</span>'
    +'<span style="font-size:12px;color:var(--muted)">Labels available in the Manual Fee counter panel</span>'
    +'</div>'
    +'<div style="padding:14px 16px;display:flex;flex-wrap:wrap;gap:8px">'
    +(mftItems||'<span style="color:var(--muted);font-size:13px">No types defined.</span>')
    +'</div>'
    +mftAddForm
    +'</div>';
}
/* -- FULL PAYMENT TAB -- */
function renderFullPaymentFees(){
  var records=loadFullPaymentRecords();
  var total=records.reduce(function(s,r){return s+(r.totalAmount||0);},0);
  var conf=loadFeeConf();
  var addForm='';
  if(feesMonthFormOpen){
    var stuOpts='<option value="">--</option>'+students.map(function(s){return'<option value="'+esc(s.name)+'">'+esc(s.name)+' ('+esc(s.cls)+')</option>';}).join('');
    var mOpts=conf.monthlyFees.map(function(f){return'<option value="'+esc(f.course)+'">'+esc(f.course)+'</option>';}).join('');
    addForm='<div class="form-panel" style="border-color:#7c3aed">'
      +'<div class="form-title" style="color:#7c3aed">💳 Record Full Payment</div>'
      +'<div class="form-grid g3">'
      +'<div class="form-group"><label>Student *</label><input id="fpr-student" list="fpr-stu-list" placeholder="Student name"/><datalist id="fpr-stu-list">'+stuOpts+'</datalist></div>'
      +'<div class="form-group"><label>Course</label><select id="fpr-course"><option value="">--</option>'+mOpts+'</select></div>'
      +'<div class="form-group"><label>Months Covered</label><input id="fpr-months" placeholder="e.g. April–March 2025-26"/></div>'
      +'<div class="form-group"><label>Tuition Fee (₹)</label><input id="fpr-tuition" type="number" min="0"/></div>'
      +'<div class="form-group"><label>Hostel Fee (₹)</label><input id="fpr-hostel" type="number" min="0" value="0"/></div>'
      +'<div class="form-group"><label>Total Amount (₹) *</label><input id="fpr-total" type="number" min="0"/></div>'
      +'<div class="form-group"><label>Date</label><input id="fpr-date" type="date" value="'+new Date().toISOString().split('T')[0]+'"/></div>'
      +'<div class="form-group"><label>Receipt No.</label><input id="fpr-receipt" value="'+genReceiptNo('FPR')+'"/></div>'
      +'<div class="form-group"><label>Remarks</label><input id="fpr-remark" placeholder="Optional"/></div>'
      +'</div>'
      +'<div class="form-actions">'
      +'<button class="btn btn-primary" onclick="feeSaveFullPay()">💾 Save &amp; Print Receipt</button>'
      +'<button class="btn btn-outline" onclick="feesMonthFormOpen=false;render()">Cancel</button>'
      +'</div></div>';
  }
  var rows=records.slice().reverse().map(function(r){
    return '<tr>'
      +'<td style="font-size:11px;font-family:\'JetBrains Mono\',monospace">'+esc(r.date||'')+'</td>'
      +'<td style="font-weight:700">'+esc(r.student||'')+'</td>'
      +'<td>'+esc(r.course||'')+'</td>'
      +'<td style="font-size:12px;color:var(--muted)">'+esc(r.months||'--')+'</td>'
      +'<td style="font-family:\'JetBrains Mono\',monospace;font-weight:700;color:#16a34a">₹'+(r.totalAmount||0).toLocaleString()+'</td>'
      +'<td style="font-size:11px">'+esc(r.receipt||'--')+'</td>'
      +'<td style="white-space:nowrap">'
      +'<button onclick="reprintAny(\''+parseInt(r.id,10)+'\',\'Full Pay\')" style="background:#f5f3ff;color:#7c3aed;border:1px solid #c4b5fd;border-radius:5px;padding:3px 8px;cursor:pointer;font-size:10.5px;font-weight:700;font-family:\'DM Sans\',sans-serif;margin-right:3px">🖨</button>'
      +(canDo('del','fees')?'<button onclick="feeDeleteFP(\''+parseInt(r.id,10)+'\')" style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;border-radius:5px;padding:3px 8px;cursor:pointer;font-size:10.5px;font-weight:700;font-family:\'DM Sans\',sans-serif">✕</button>':'')
      +'</td></tr>';
  }).join('');
  return '<div class="stat-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:20px">'
    +'<div class="stat-card" style="--c:#7c3aed"><div class="stat-label">Total Collected</div><div class="stat-val">₹'+Math.round(total/1000)+'K</div><div class="stat-sub">Full payments</div></div>'
    +'<div class="stat-card" style="--c:#3b78c9"><div class="stat-label">Records</div><div class="stat-val">'+records.length+'</div><div class="stat-sub">Full payment records</div></div>'
    +'</div>'
    +'<div style="margin-bottom:16px"><button class="btn btn-primary" onclick="feesMonthFormOpen=!feesMonthFormOpen;render()">+ Record Full Payment</button></div>'
    +addForm
    +'<div class="card"><div class="card-head"><span class="card-title">Full Payment Records</span></div>'
    +'<div style="overflow-x:auto"><table><thead><tr><th>Date</th><th>Student</th><th>Course</th><th>Months</th><th>Amount</th><th>Receipt</th><th>Actions</th></tr></thead>'
    +'<tbody>'+(rows||'<tr><td colspan="7" style="padding:32px;text-align:center;color:var(--muted)">No full payment records yet.</td></tr>')+'</tbody></table></div></div>';
}
function feeSaveFullPay(){
  var student=((document.getElementById('fpr-student')||{}).value||'').trim();
  var course=((document.getElementById('fpr-course')||{}).value||'').trim();
  var months=((document.getElementById('fpr-months')||{}).value||'').trim();
  var tuition=parseFloat((document.getElementById('fpr-tuition')||{}).value||0)||0;
  var hostelF=parseFloat((document.getElementById('fpr-hostel')||{}).value||0)||0;
  var total=parseFloat((document.getElementById('fpr-total')||{}).value||0)||0;
  var receipt=((document.getElementById('fpr-receipt')||{}).value||genReceiptNo('FPR')).trim();
  var date=((document.getElementById('fpr-date')||{}).value||new Date().toISOString().split('T')[0]);
  var remark=((document.getElementById('fpr-remark')||{}).value||'').trim();
  if(!student||!total){alert('Student and amount required.');return;}
  var recs=loadFullPaymentRecords();
  var rec={id:'fp_'+Date.now(),student:student,course:course,months:months,tuitionFee:tuition,hostelFee:hostelF,totalAmount:total,amountPaid:total,receipt:receipt,date:date,remark:remark,collectedBy:currentUser&&currentUser.name||'Staff',createdAt:new Date().toISOString()};
  recs.push(rec);saveFullPaymentRecords(recs);
  autoCreditIncome(total,'Full Payment -- '+student+(months?' ('+months+')':''),date,'Full Payment',receipt,rec.id);
  printFeeReceipt({type:'fullpayment',student:student,cls:course,months:months,tuitionFee:tuition,hostelFee:hostelF,totalAmount:total,receiptNo:receipt,date:date,collectedBy:rec.collectedBy,remarks:remark});
  feesMonthFormOpen=false;alert('✅ Full payment saved! Receipt opened.');render();
}
function feeDeleteFP(id){if(!confirm('Delete this record?'))return;var r=loadFullPaymentRecords();saveFullPaymentRecords(r.filter(function(x){return x.id!==id;}));render();}
/* -- ADVANCE FEES TAB -- */
function renderAdvanceFees(){
  var records=loadAdvanceFeeRecords();
  var total=records.reduce(function(s,r){return s+(r.totalAmount||0);},0);
  var addForm='';
  if(feesAdvFormOpen){
    var stuOpts='<option value="">--</option>'+students.map(function(s){return'<option value="'+esc(s.name)+'" data-cls="'+esc(s.cls)+'">'+esc(s.name)+' ('+esc(s.cls)+')</option>';}).join('');
    addForm='<div class="form-panel" style="border-color:#d97706">'
      +'<div class="form-title" style="color:#d97706">💰 Record Advance Fee</div>'
      +'<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:12.5px;color:#d97706">Advance fee is credited to income immediately. It can be adjusted against future monthly fees.</div>'
      +'<div class="form-grid g3">'
      +'<div class="form-group"><label>Student *</label><input id="adv-student" list="adv-stu-list" placeholder="Student name"/><datalist id="adv-stu-list">'+stuOpts+'</datalist></div>'
      +'<div class="form-group"><label>Course / Class</label><input id="adv-course" placeholder="Course or class"/></div>'
      +'<div class="form-group"><label>Advance Amount (₹) *</label><input id="adv-amt" type="number" min="0" placeholder="Amount"/></div>'
      +'<div class="form-group"><label>For Months / Period</label><input id="adv-months" placeholder="e.g. January–March 2026"/></div>'
      +'<div class="form-group"><label>Receipt No.</label><input id="adv-receipt" value="'+genReceiptNo('ADV')+'"/></div>'
      +'<div class="form-group"><label>Date</label><input id="adv-date" type="date" value="'+new Date().toISOString().split('T')[0]+'"/></div>'
      +'<div class="form-group"><label>Remarks</label><input id="adv-remark" placeholder="Optional"/></div>'
      +'</div>'
      +'<div class="form-actions">'
      +'<button class="btn btn-primary" onclick="feeSaveAdvance()">💾 Save &amp; Print Receipt</button>'
      +'<button class="btn btn-outline" onclick="feesAdvFormOpen=false;render()">Cancel</button>'
      +'</div></div>';
  }
  var rows=records.slice().reverse().map(function(r){
    return '<tr>'
      +'<td style="font-size:11px;font-family:\'JetBrains Mono\',monospace">'+esc(r.date||'')+'</td>'
      +'<td style="font-weight:700">'+esc(r.student||'')+'</td>'
      +'<td>'+esc(r.course||'')+'</td>'
      +'<td style="font-size:12px;color:var(--muted)">'+esc(r.advanceMonths||'--')+'</td>'
      +'<td style="font-family:\'JetBrains Mono\',monospace;font-weight:700;color:#d97706">₹'+(r.totalAmount||0).toLocaleString()+'</td>'
      +'<td style="font-size:11px">'+esc(r.receipt||'--')+'</td>'
      +'<td style="white-space:nowrap">'
      +'<button onclick="reprintAny(\''+parseInt(r.id,10)+'\',\'Advance\')" style="background:#fffbeb;color:#d97706;border:1px solid #fde68a;border-radius:5px;padding:3px 8px;cursor:pointer;font-size:10.5px;font-weight:700;font-family:\'DM Sans\',sans-serif;margin-right:3px">🖨</button>'
      +(canDo('del','fees')?'<button onclick="feeDeleteAdv(\''+parseInt(r.id,10)+'\')" style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;border-radius:5px;padding:3px 8px;cursor:pointer;font-size:10.5px;font-weight:700;font-family:\'DM Sans\',sans-serif">✕</button>':'')
      +'</td></tr>';
  }).join('');
  return '<div class="stat-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:20px">'
    +'<div class="stat-card" style="--c:#d97706"><div class="stat-label">Total Advance</div><div class="stat-val">₹'+Math.round(total/1000)+'K</div><div class="stat-sub">Advance collected</div></div>'
    +'<div class="stat-card" style="--c:#3b78c9"><div class="stat-label">Records</div><div class="stat-val">'+records.length+'</div><div class="stat-sub">Advance records</div></div>'
    +'</div>'
    +'<div style="margin-bottom:16px"><button class="btn btn-primary" onclick="feesAdvFormOpen=!feesAdvFormOpen;render()">+ Record Advance Fee</button></div>'
    +addForm
    +'<div class="card"><div class="card-head"><span class="card-title">Advance Fee Records</span><span style="font-size:11px;color:var(--muted)">All auto-credited to income ledger</span></div>'
    +'<div style="overflow-x:auto"><table><thead><tr><th>Date</th><th>Student</th><th>Course</th><th>Period</th><th>Amount</th><th>Receipt</th><th>Actions</th></tr></thead>'
    +'<tbody>'+(rows||'<tr><td colspan="7" style="padding:32px;text-align:center;color:var(--muted)">No advance fee records yet.</td></tr>')+'</tbody></table></div></div>';
}
function feeSaveAdvance(){
  var student=((document.getElementById('adv-student')||{}).value||'').trim();
  var course=((document.getElementById('adv-course')||{}).value||'').trim();
  var amt=parseFloat((document.getElementById('adv-amt')||{}).value||0)||0;
  var advMonths=((document.getElementById('adv-months')||{}).value||'').trim();
  var receipt=((document.getElementById('adv-receipt')||{}).value||genReceiptNo('ADV')).trim();
  var date=((document.getElementById('adv-date')||{}).value||new Date().toISOString().split('T')[0]);
  var remark=((document.getElementById('adv-remark')||{}).value||'').trim();
  if(!student||!amt){alert('Student and amount required.');return;}
  var recs=loadAdvanceFeeRecords();
  var rec={id:'adv_'+Date.now(),student:student,course:course,advanceMonths:advMonths,totalAmount:amt,amountPaid:amt,receipt:receipt,date:date,remark:remark,collectedBy:currentUser&&currentUser.name||'Staff',createdAt:new Date().toISOString()};
  recs.push(rec);saveAdvanceFeeRecords(recs);
  autoCreditIncome(amt,'Advance Fee -- '+student+(advMonths?' ('+advMonths+')':''),date,'Advance Fee',receipt,rec.id);
  printFeeReceipt({type:'advance',student:student,cls:course,advanceMonths:advMonths,totalAmount:amt,receiptNo:receipt,date:date,collectedBy:rec.collectedBy,remarks:remark});
  feesAdvFormOpen=false;alert('✅ Advance fee saved! Receipt opened.');render();
}
function feeDeleteAdv(id){if(!confirm('Delete this record?'))return;var r=loadAdvanceFeeRecords();saveAdvanceFeeRecords(r.filter(function(x){return x.id!==id;}));render();}
/* -- ITEMS TAB -- */
function renderItemsFees(){
  var records=loadItemRecords();
  var total=records.reduce(function(s,r){return s+(r.totalAmount||0);},0);
  var addForm='';
  if(feesItemFormOpen){
    var stuOpts='<option value="">--</option>'+students.map(function(s){return'<option value="'+esc(s.name)+'">'+esc(s.name)+' ('+esc(s.cls)+')</option>';}).join('');
    addForm='<div class="form-panel" style="border-color:#0891b2">'
      +'<div class="form-title" style="color:#0891b2">📦 Record Items / Provisions</div>'
      +'<div class="form-grid g3">'
      +'<div class="form-group"><label>Student *</label><input id="itm-student" list="itm-stu-list" placeholder="Student name"/><datalist id="itm-stu-list">'+stuOpts+'</datalist></div>'
      +'<div class="form-group"><label>Date</label><input id="itm-date" type="date" value="'+new Date().toISOString().split('T')[0]+'"/></div>'
      +'<div class="form-group"><label>Receipt No.</label><input id="itm-receipt" value="'+genReceiptNo('ITM')+'"/></div>'
      +'</div>'
      +'<div style="font-size:12px;font-weight:700;color:var(--muted);margin:10px 0 6px">Items:</div>'
      +'<div id="itm-items-list">'
      +'<div class="form-grid g3" id="itm-item-row-0">'
      +'<div class="form-group"><label>Item Name</label><input id="itm-item-name-0" placeholder="e.g. Study Kit"/></div>'
      +'<div class="form-group"><label>Qty</label><input id="itm-item-qty-0" type="number" value="1" min="1" oninput="itmUpdateTotal()"/></div>'
      +'<div class="form-group"><label>Amount (₹)</label><input id="itm-item-amt-0" type="number" placeholder="0" min="0" oninput="itmUpdateTotal()"/></div>'
      +'</div></div>'
      +'<button onclick="itmAddRow()" style="padding:6px 14px;border-radius:7px;border:1.5px dashed var(--border);background:transparent;cursor:pointer;color:#0891b2;font-weight:600;font-size:12px;margin-bottom:14px">+ Add Item</button>'
      +'<div style="font-size:14px;font-weight:800;color:#0891b2;margin-bottom:14px">Total: <span id="itm-total-display">₹0</span></div>'
      +'<div class="form-actions">'
      +'<button class="btn btn-primary" onclick="feeSaveItems()">💾 Save &amp; Print Receipt</button>'
      +'<button class="btn btn-outline" onclick="feesItemFormOpen=false;render()">Cancel</button>'
      +'</div></div>';
  }
  var rows=records.slice().reverse().map(function(r){
    var items=(r.itemsList||[]).map(function(it){return esc(it.name)+'(x'+it.qty+')'}).join(', ');
    return '<tr>'
      +'<td style="font-size:11px;font-family:\'JetBrains Mono\',monospace">'+esc(r.date||'')+'</td>'
      +'<td style="font-weight:700">'+esc(r.student||'')+'</td>'
      +'<td style="font-size:11.5px;max-width:180px;overflow:hidden;text-overflow:ellipsis">'+items+'</td>'
      +'<td style="font-family:\'JetBrains Mono\',monospace;font-weight:700;color:#0891b2">₹'+(r.totalAmount||0).toLocaleString()+'</td>'
      +'<td style="font-size:11px">'+esc(r.receipt||'--')+'</td>'
      +'<td style="white-space:nowrap">'
      +'<button onclick="reprintAny(\''+parseInt(r.id,10)+'\',\'Items\')" style="background:#ecfeff;color:#0891b2;border:1px solid #a5f3fc;border-radius:5px;padding:3px 8px;cursor:pointer;font-size:10.5px;font-weight:700;font-family:\'DM Sans\',sans-serif;margin-right:3px">🖨</button>'
      +(canDo('del','fees')?'<button onclick="feeDeleteItem(\''+parseInt(r.id,10)+'\')" style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;border-radius:5px;padding:3px 8px;cursor:pointer;font-size:10.5px;font-weight:700;font-family:\'DM Sans\',sans-serif">✕</button>':'')
      +'</td></tr>';
  }).join('');
  return '<div class="stat-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:20px">'
    +'<div class="stat-card" style="--c:#0891b2"><div class="stat-label">Total Items Value</div><div class="stat-val">₹'+Math.round(total/1000)+'K</div><div class="stat-sub">Items provided</div></div>'
    +'<div class="stat-card" style="--c:#3b78c9"><div class="stat-label">Transactions</div><div class="stat-val">'+records.length+'</div><div class="stat-sub">Item records</div></div>'
    +'</div>'
    +'<div style="margin-bottom:16px"><button class="btn btn-primary" onclick="feesItemFormOpen=!feesItemFormOpen;render()">+ Record Items</button></div>'
    +addForm
    +'<div class="card"><div class="card-head"><span class="card-title">Items / Provisions Records</span></div>'
    +'<div style="overflow-x:auto"><table><thead><tr><th>Date</th><th>Student</th><th>Items</th><th>Total</th><th>Receipt</th><th>Actions</th></tr></thead>'
    +'<tbody>'+(rows||'<tr><td colspan="6" style="padding:32px;text-align:center;color:var(--muted)">No items records yet.</td></tr>')+'</tbody></table></div></div>';
}
function itmAddRow(){
  var list=document.getElementById('itm-items-list');if(!list)return;
  var rows=list.querySelectorAll('[id^=itm-item-row-]');var idx=rows.length;
  var div=document.createElement('div');div.className='form-grid g3';div.id='itm-item-row-'+idx;
  div.innerHTML='<div class="form-group"><label>Item Name</label><input id="itm-item-name-'+idx+'" placeholder="Item"/></div>'
    +'<div class="form-group"><label>Qty</label><input id="itm-item-qty-'+idx+'" type="number" value="1" min="1" oninput="itmUpdateTotal()"/></div>'
    +'<div class="form-group"><label>Amount (₹)</label><input id="itm-item-amt-'+idx+'" type="number" placeholder="0" min="0" oninput="itmUpdateTotal()"/></div>';
  list.appendChild(div);
}
function itmUpdateTotal(){
  var list=document.getElementById('itm-items-list');if(!list)return;
  var rows=list.querySelectorAll('[id^=itm-item-row-]');var total=0;
  rows.forEach(function(_,i){
    var amt=parseFloat((document.getElementById('itm-item-amt-'+i)||{}).value||0)||0;
    var qty=parseInt((document.getElementById('itm-item-qty-'+i)||{}).value||1)||1;
    total+=amt*qty;
  });
  var el=document.getElementById('itm-total-display');if(el)el.textContent='₹'+total.toLocaleString();
}
function feeSaveItems(){
  var student=((document.getElementById('itm-student')||{}).value||'').trim();
  var date=((document.getElementById('itm-date')||{}).value||new Date().toISOString().split('T')[0]);
  var receipt=((document.getElementById('itm-receipt')||{}).value||genReceiptNo('ITM')).trim();
  var list=document.getElementById('itm-items-list');
  var rows=list?list.querySelectorAll('[id^=itm-item-row-]'):[];
  var itemsList=[];var total=0;
  rows.forEach(function(_,i){
    var nm=((document.getElementById('itm-item-name-'+i)||{}).value||'').trim();
    var amt=parseFloat((document.getElementById('itm-item-amt-'+i)||{}).value||0)||0;
    var qty=parseInt((document.getElementById('itm-item-qty-'+i)||{}).value||1)||1;
    if(nm) {itemsList.push({name:nm,amount:amt,qty:qty});total+=amt*qty;}
  });
  if(!student||!itemsList.length){alert('Student and at least one item required.');return;}
  var recs=loadItemRecords();
  var rec={id:'itm_'+Date.now(),student:student,itemsList:itemsList,totalAmount:total,amountPaid:total,receipt:receipt,date:date,collectedBy:currentUser&&currentUser.name||'Staff',createdAt:new Date().toISOString()};
  recs.push(rec);saveItemRecords(recs);
  autoCreditIncome(total,'Items/Provisions -- '+student+' ('+itemsList.map(function(it){return it.name;}).join(', ')+')',date,'Items Provided',receipt,rec.id);
  printFeeReceipt({type:'item',student:student,itemsList:itemsList,totalAmount:total,receiptNo:receipt,date:date,collectedBy:rec.collectedBy});
  feesItemFormOpen=false;alert('✅ Items recorded! Receipt opened.');render();
}
function feeDeleteItem(id){if(!confirm('Delete this record?'))return;var r=loadItemRecords();saveItemRecords(r.filter(function(x){return x.id!==id;}));render();}
/* -- PATCH EXISTING HELPERS USED ABOVE -- */
function feeAutoFillMonth(sel){
  var opt=sel.options[sel.selectedIndex];
  var tuition=opt&&opt.getAttribute('data-tuition');
  var hostel=opt&&opt.getAttribute('data-hostel');
  var ti=document.getElementById('mfr-tuition');var hi=document.getElementById('mfr-hostel');var tot=document.getElementById('mfr-total');
  if(ti&&tuition)ti.value=tuition;
  if(hi&&hostel)hi.value=hostel;
  if(tot&&tuition)tot.value=parseFloat(tuition||0)+parseFloat(hostel||0);
}
function feeSaveMonthConf(id){
  var conf=loadFeeConf();
  conf.monthlyFees=conf.monthlyFees.map(function(f){
    if(f.id!==id)return f;
    return Object.assign({},f,{
      course:((document.getElementById('mf-course-'+id)||{}).value||f.course).trim(),
      amount:parseFloat((document.getElementById('mf-amt-'+id)||{}).value)||f.amount,
      hostelAmount:parseFloat((document.getElementById('mf-hostel-'+id)||{}).value)||f.hostelAmount
    });
  });
  saveFeeConf(conf);feesEditMonthId=null;render();
}
function feeSaveMonthRecord(noprint){
  var student=((document.getElementById('mfr-student')||{}).value||'').trim();
  var course=((document.getElementById('mfr-course')||{}).value||'').trim();
  var forMonth=((document.getElementById('mfr-month')||{}).value||'').trim();
  var tuition=parseFloat((document.getElementById('mfr-tuition')||{}).value||0)||0;
  var hostelF=parseFloat((document.getElementById('mfr-hostel')||{}).value||0)||0;
  var total=parseFloat((document.getElementById('mfr-total')||{}).value||0)||(tuition+hostelF);
  var receipt=((document.getElementById('mfr-receipt')||{}).value||genReceiptNo('RCP')).trim();
  var date=((document.getElementById('mfr-date')||{}).value||new Date().toISOString().split('T')[0]);
  var remark=((document.getElementById('mfr-remark')||{}).value||'').trim();
  if(!student||!forMonth||!total){alert('Student, month and amount required.');return;}
  var recs=loadMonthlyRecords();
  var rec={id:'mf_'+Date.now(),student:student,course:course,forMonth:forMonth,tuitionFee:tuition,hostelFee:hostelF,amountPaid:total,totalAmount:total,receipt:receipt,date:date,remark:remark,collectedBy:currentUser&&currentUser.name||'Staff',createdAt:new Date().toISOString()};
  recs.push(rec);window._dashCache=null;saveMonthlyRecords(recs);
  autoCreditIncome(total,'Monthly Fee -- '+student+' ('+forMonth+')',date,'Monthly Fee',receipt,rec.id);
  if(!noprint) printFeeReceipt({type:'monthly',student:student,cls:course,forMonth:forMonth,tuitionFee:tuition,hostelFee:hostelF,totalAmount:total,receiptNo:receipt,date:date,collectedBy:rec.collectedBy,remarks:remark});
  feesMonthFormOpen=false;alert('✅ Monthly fee saved!'+(noprint?'':' Receipt opened.'));render();
}
function feeDeleteMonthRecord(id){if(!confirm('Delete this record?'))return;var r=loadMonthlyRecords();window._dashCache=null;saveMonthlyRecords(r.filter(function(x){return x.id!==id;}));render();}
/* -- FEE GROUP ADMIN FUNCTIONS -- */
function feeAddFeeGroup(){
  var name=((document.getElementById('fg-new-name')||{}).value||'').trim();
  var amt=parseFloat((document.getElementById('fg-new-amt')||{}).value||0)||0;
  var desc=((document.getElementById('fg-new-desc')||{}).value||'').trim();
  if(!name){alert('Group name is required.');return;}
  if(!amt){alert('Amount is required.');return;}
  var conf=loadFeeConf();
  if(!conf.feeGroups) conf.feeGroups=[];
  conf.feeGroups.push({id:'fg_'+Date.now(),name:name,amount:amt,description:desc});
  saveFeeConf(conf);
  if(typeof showToast==='function') showToast('Fee Group "'+name+'" added','#16a34a');
  render();
}
function feeDeleteFeeGroup(id){
  if(!confirm('Remove this Fee Group?'))return;
  var conf=loadFeeConf();
  conf.feeGroups=(conf.feeGroups||[]).filter(function(g){return g.id!==id;});
  saveFeeConf(conf);render();
}
/* -- MANUAL FEE TYPE ADMIN FUNCTIONS -- */
function feeAddManualType(){
  var name=((document.getElementById('mft-new-name')||{}).value||'').trim();
  if(!name){alert('Fee type name is required.');return;}
  var conf=loadFeeConf();
  if(!conf.manualFeeTypes) conf.manualFeeTypes=[];
  if(conf.manualFeeTypes.indexOf(name)>=0){alert('This type already exists.');return;}
  conf.manualFeeTypes.push(name);
  saveFeeConf(conf);
  if(typeof showToast==='function') showToast('"'+name+'" added to Manual Fee Types','#16a34a');
  render();
}
function feeRemoveManualType(idx){
  var conf=loadFeeConf();
  if(!conf.manualFeeTypes||!conf.manualFeeTypes[idx])return;
  var name=conf.manualFeeTypes[idx];
  if(!confirm('Remove "'+name+'" from manual fee types?'))return;
  conf.manualFeeTypes.splice(idx,1);
  saveFeeConf(conf);render();
}
/* -- EXISTING ADMISSION FEE TAB (kept, refreshed receipt) -- */
function renderAdmissionFees(){
  var conf=loadFeeConf();
  var records=loadAdmissionRecords();
  var feeMap={};conf.admissionFees.forEach(function(f){feeMap[f.course]=f.amount;});
  var totalCollected=records.reduce(function(s,r){return s+(r.amountPaid||0);},0);
  var confRows=conf.admissionFees.map(function(f){
    if(feesEditAdmId===f.id){
      return '<tr style="background:var(--accent-light)">'
        +'<td><input id="af-course-'+parseInt(f.id,10)+'" value="'+esc(f.course)+'" style="border:1px solid var(--border);border-radius:6px;padding:5px 8px;font-family:\'DM Sans\',sans-serif;background:var(--surface);color:var(--text);width:100%"/></td>'
        +'<td><input id="af-amt-'+parseInt(f.id,10)+'" type="number" value="'+f.amount+'" style="border:1px solid var(--border);border-radius:6px;padding:5px 8px;font-family:\'JetBrains Mono\',monospace;background:var(--surface);color:var(--text);width:100px"/></td>'
        +'<td><input id="af-desc-'+parseInt(f.id,10)+'" value="'+esc(f.description||'')+'" style="border:1px solid var(--border);border-radius:6px;padding:5px 8px;font-family:\'DM Sans\',sans-serif;background:var(--surface);color:var(--text);width:100%"/></td>'
        +'<td style="white-space:nowrap">'
          +'<button onclick="feeSaveAdmConf(\''+parseInt(f.id,10)+'\')" style="background:var(--accent);color:#fff;border:none;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:11px;font-weight:700;font-family:\'DM Sans\',sans-serif;margin-right:4px">✓ Save</button>'
          +'<button onclick="feesEditAdmId=null;render()" style="background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:4px 10px;cursor:pointer;font-size:11px;font-family:\'DM Sans\',sans-serif">✕</button>'
        +'</td></tr>';
    }
    return '<tr>'
      +'<td style="font-weight:700">'+esc(f.course)+'</td>'
      +'<td style="font-family:\'JetBrains Mono\',monospace;font-weight:700;color:var(--accent)">₹'+f.amount.toLocaleString()+'</td>'
      +'<td style="font-size:12px;color:var(--muted)">'+esc(f.description||'')+'</td>'
      +'<td><button onclick="feesEditAdmId=\''+parseInt(f.id,10)+'\';render()" style="background:var(--accent-light);color:var(--accent);border:1px solid var(--accent);border-radius:6px;padding:4px 9px;cursor:pointer;font-size:11px;font-weight:700;font-family:\'DM Sans\',sans-serif">✏ Edit</button></td>'
    +'</tr>';
  }).join('');
  var addFormHTML='';
  if(feesAdmFormOpen){
    var opts=conf.admissionFees.map(function(f){return'<option value="'+esc(f.course)+'" data-fee="'+f.amount+'">'+esc(f.course)+' (₹'+f.amount.toLocaleString()+')</option>'}).join('');
    var stuOpts='<option value="">-- Select Student --</option>'+students.map(function(s){return'<option value="'+esc(s.name)+'">'+esc(s.name)+' ('+esc(s.cls)+')</option>'}).join('');
    addFormHTML='<div class="form-panel" style="border-color:#16a34a">'
      +'<div class="form-title" style="color:#16a34a">🎓 Record Admission Fee Payment</div>'
      +'<div class="form-grid g3">'
        +'<div class="form-group"><label>Student Name *</label><input id="adr-student" list="adr-stu-list" placeholder="Type student name..."/><datalist id="adr-stu-list">'+stuOpts+'</datalist></div>'
        +'<div class="form-group"><label>Course / Class *</label><select id="adr-course" onchange="feeAutoFillAdm(this)"><option value="">-- Select Course --</option>'+opts+'</select></div>'
        +'<div class="form-group"><label>Amount Paid (₹) *</label><input id="adr-amt" type="number" placeholder="Amount" min="0"/></div>'
        +'<div class="form-group"><label>Payment Date</label><input id="adr-date" type="date" value="'+new Date().toISOString().split('T')[0]+'"/></div>'
        +'<div class="form-group"><label>Receipt No.</label><input id="adr-receipt" value="'+genReceiptNo('ADM')+'"/></div>'
        +'<div class="form-group"><label>Remarks</label><input id="adr-remark" placeholder="Optional remarks"/></div>'
      +'</div>'
      +'<div class="form-actions"><button class="btn btn-primary" onclick="feeSaveAdmRecord()">Save &amp; Print Receipt</button><button class="btn btn-outline" onclick="feesAdmFormOpen=false;render()">Cancel</button></div>'
    +'</div>';
  }
  var recRows=records.slice().reverse().map(function(r){
    return '<tr>'
      +'<td style="font-family:\'JetBrains Mono\',monospace;font-size:11px">'+esc(r.date||'')+'</td>'
      +'<td><div style="font-weight:700">'+esc(r.student||'')+'</div><div style="font-size:11px;color:var(--muted)">'+esc(r.course||'')+'</div></td>'
      +'<td style="font-family:\'JetBrains Mono\',monospace;font-size:13px;font-weight:700;color:#16a34a">₹'+((r.amountPaid||0).toLocaleString())+'</td>'
      +'<td style="font-size:12px;color:var(--muted)">'+esc(r.receipt||'--')+'</td>'
      +'<td style="font-size:12px;color:var(--muted)">'+esc(r.remark||'--')+'</td>'
      +'<td style="white-space:nowrap">'
      +'<button onclick="reprintAny(\''+parseInt(r.id,10)+'\',\'Admission\')" style="background:#dcfce7;color:#16a34a;border:1px solid #86efac;border-radius:5px;padding:3px 8px;cursor:pointer;font-size:10.5px;font-weight:700;font-family:\'DM Sans\',sans-serif;margin-right:3px">🖨</button>'
      +(canDo('del','fees')?'<button onclick="feeDeleteAdmRecord(\''+parseInt(r.id,10)+'\')" style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;border-radius:6px;padding:4px 9px;cursor:pointer;font-size:11px;font-weight:700;font-family:\'DM Sans\',sans-serif">✕</button>':'')
      +'</td></tr>';
  }).join('');
  return '<div class="stat-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:20px">'
    +'<div class="stat-card" style="--c:#16a34a"><div class="stat-label">Total Collected</div><div class="stat-val">₹'+Math.round(totalCollected/1000)+'K</div><div class="stat-sub">Admission fees</div></div>'
    +'<div class="stat-card" style="--c:#3b78c9"><div class="stat-label">Records</div><div class="stat-val">'+records.length+'</div><div class="stat-sub">Admissions recorded</div></div>'
    +'<div class="stat-card" style="--c:#d4a853"><div class="stat-label">Courses</div><div class="stat-val">'+conf.admissionFees.length+'</div><div class="stat-sub">Fee structures</div></div>'
    +'</div>'
    +'<div class="card" style="margin-bottom:18px"><div class="card-head"><span class="card-title">📋 Admission Fee Structure</span></div>'
    +'<div style="overflow-x:auto"><table><thead><tr><th>Course</th><th>Fee</th><th>Description</th><th>Edit</th></tr></thead><tbody>'+confRows+'</tbody></table></div></div>'
    +'<div style="display:flex;gap:10px;margin-bottom:16px"><button class="btn btn-primary" onclick="feesAdmFormOpen=!feesAdmFormOpen;render()">+ Record Payment</button></div>'
    +addFormHTML
    +'<div class="card"><div class="card-head"><span class="card-title">Admission Fee Records</span></div>'
    +'<div style="overflow-x:auto"><table><thead><tr><th>Date</th><th>Student / Course</th><th>Amount</th><th>Receipt No.</th><th>Remarks</th><th>Actions</th></tr></thead>'
    +'<tbody>'+(recRows||'<tr><td colspan="6" style="padding:32px;text-align:center;color:var(--muted)">No admission fee records yet.</td></tr>')+'</tbody></table></div></div>';
}
function feeAutoFillAdm(sel){
  var opt=sel.options[sel.selectedIndex];var fee=opt&&opt.getAttribute('data-fee');
  var inp=document.getElementById('adr-amt');if(inp&&fee)inp.value=fee;
}
function feeSaveAdmConf(id){
  var conf=loadFeeConf();
  conf.admissionFees=conf.admissionFees.map(function(f){
    if(f.id!==id)return f;
    return Object.assign({},f,{
      course:((document.getElementById('af-course-'+id)||{}).value||f.course).trim(),
      amount:parseFloat((document.getElementById('af-amt-'+id)||{}).value)||f.amount,
      description:((document.getElementById('af-desc-'+id)||{}).value||f.description||'').trim()
    });
  });
  saveFeeConf(conf);feesEditAdmId=null;render();
}
function feeSaveAdmRecord(){
  var student=((document.getElementById('adr-student')||{}).value||'').trim();
  var course=((document.getElementById('adr-course')||{}).value||'').trim();
  var amt=parseFloat((document.getElementById('adr-amt')||{}).value||0)||0;
  var date=((document.getElementById('adr-date')||{}).value||new Date().toISOString().split('T')[0]);
  var receipt=((document.getElementById('adr-receipt')||{}).value||genReceiptNo('ADM')).trim();
  var remark=((document.getElementById('adr-remark')||{}).value||'').trim();
  if(!student||!amt){alert('Student name and amount required.');return;}
  var recs=loadAdmissionRecords();
  var rec={id:'adm_'+Date.now(),student:student,course:course,amountPaid:amt,totalAmount:amt,receipt:receipt,date:date,remark:remark,collectedBy:currentUser&&currentUser.name||'Staff',createdAt:new Date().toISOString()};
  recs.push(rec);window._dashCache=null;window._dashCache=null;saveAdmissionRecords(recs);
  autoCreditIncome(amt,'Admission Fee -- '+student+(course?' ('+course+')':''),date,'Admission Fee',receipt,rec.id);
  printFeeReceipt({type:'admission',student:student,cls:course,totalAmount:amt,receiptNo:receipt,date:date,collectedBy:rec.collectedBy,remarks:remark});
  feesAdmFormOpen=false;alert('✅ Admission fee saved! Receipt opened.');render();
}
function feeDeleteAdmRecord(id){if(!confirm('Delete this record?'))return;var r=loadAdmissionRecords();window._dashCache=null;saveAdmissionRecords(r.filter(function(x){return x.id!==id;}));render();}
function feeExportAdm(){
  showToast('⏳ Preparing Admission Fee CSV…','#2563eb');

  var r=loadAdmissionRecords();
  var rows=[['Date','Student','Course','Amount Paid','Receipt No.','Remarks']];
  r.forEach(function(x){rows.push([x.date||'',x.student||'',x.course||'',x.amountPaid||0,x.receipt||'',x.remark||'']);});
    showToast('✅ Admission Fee CSV ready — '+(r.length)+' rows','#16a34a');
  downloadCSV('GNSI_Admission_Fees.csv',rows);
}
/* ══════════════════════════════════════
   ACCOUNTS PAGE -- DAILY INCOME & EXPENDITURE
══════════════════════════════════════ */
function renderAccounts(){
  var tabStyle=function(t){
    return t===acctTab
      ?'padding:9px 18px;border-radius:8px;border:none;cursor:pointer;font-family:\'Nunito\',sans-serif;font-weight:700;font-size:12.5px;background:var(--accent);color:#fff'
      :'padding:9px 18px;border-radius:8px;border:1.5px solid var(--border);cursor:pointer;font-family:\'Nunito\',sans-serif;font-weight:600;font-size:12.5px;background:var(--surface);color:var(--muted)';
  };
  var isAdminAcct = currentUser && (currentUser.role==='admin');
  var tabs='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:22px">'
    +'<button style="'+tabStyle('income')+'" onclick="acctTab=\'income\';render()">📈 Daily Income</button>'
    +'<button style="'+tabStyle('expenditure')+'" onclick="acctTab=\'expenditure\';render()">📉 Daily Expenditure</button>'
    +'<button style="'+tabStyle('report')+'" onclick="acctTab=\'report\';render()">📊 Monthly Report</button>'
    +'<button style="'+tabStyle('balance')+'" onclick="acctTab=\'balance\';render()">⚖️ Balance Sheet</button>'
    +(isAdminAcct?'<button style="'+tabStyle('advanced')+';'+(acctTab==='advanced'?'background:linear-gradient(135deg,#7c3aed,#1433a8);':'border-color:#c4b5fd;color:#7c3aed;')+'" onclick="acctTab=\'advanced\';render()">🛠 Advanced Features</button>':'')
    +'</div>';
  var body='';
  if(acctTab==='income') body=renderIncomeTab();
  else if(acctTab==='expenditure') body=renderExpenditureTab();
  else if(acctTab==='report') body=renderMonthlyReport();
  else if(acctTab==='advanced'&&isAdminAcct) body=renderAccountsAdvanced();
  else body=renderBalanceSheet();
  return '<div class="page-header">'
    +'<div class="page-header-eyebrow">GNSI -- ACCOUNTS</div>'
    +'<div class="page-header-title">Accounts &amp; Finance</div>'
    +'<div class="page-header-sub">Daily income &amp; expenditure ledger · Monthly reports · Balance sheet</div>'
    +'</div>'+tabs+body;
}
/* -- INCOME TAB -- */
function renderIncomeTab(){
  var records=loadIncomeLedger();
  var INC_CATS=['Monthly Fee','Admission Fee','Full Payment','Advance Fee','Items Provided','Donation','Other'];
  var today=new Date().toISOString().split('T')[0];
  var todayInc=records.filter(function(r){return r.date===today;}).reduce(function(s,r){return s+(r.amount||0);},0);
  var totalInc=records.reduce(function(s,r){return s+(r.amount||0);},0);
  var addForm='';
  if(feesIncFormOpen){
    var catOpts=INC_CATS.map(function(c){return'<option>'+c+'</option>';}).join('');
    addForm='<div class="form-panel" style="border-color:#16a34a">'
      +'<div class="form-title" style="color:#16a34a">➕ Manual Income Entry</div>'
      +'<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:9px 12px;margin-bottom:14px;font-size:12.5px;color:#16a34a">Fee collections from the Fee Collection section are auto-credited here. Use this form for other income (donations, misc, etc.)</div>'
      +'<div class="form-grid g3">'
      +'<div class="form-group"><label>Date *</label><input id="inc-date" type="date" value="'+today+'"/></div>'
      +'<div class="form-group"><label>Category *</label><select id="inc-cat">'+catOpts+'</select></div>'
      +'<div class="form-group"><label>Amount (₹) *</label><input id="inc-amt" type="number" min="0" placeholder="Amount"/></div>'
      +'<div class="form-group" style="grid-column:1/-1"><label>Description *</label><input id="inc-desc" placeholder="Description of income"/></div>'
      +'<div class="form-group"><label>Receipt No.</label><input id="inc-receipt" placeholder="Optional"/></div>'
      +'</div>'
      +'<div class="form-actions"><button class="btn btn-primary" onclick="feeSaveIncome()">➕ Add Entry</button><button class="btn btn-outline" onclick="feesIncFormOpen=false;render()">Cancel</button></div>'
      +'</div>';
  }
  // Group by date for daily view
  var byDate={};
  records.forEach(function(r){
    var d=r.date||'Unknown';
    if(!byDate[d])byDate[d]=[];
    byDate[d].push(r);
  });
  var dates=Object.keys(byDate).sort().reverse();
  var tableRows=records.slice().sort(function(a,b){return(b.date||'').localeCompare(a.date||'');}).slice(0,100).map(function(r){
    var sourceTag=r.source==='auto'?'<span style="padding:1px 7px;border-radius:12px;font-size:9.5px;font-weight:700;background:#dcfce7;color:#16a34a">AUTO</span>':'<span style="padding:1px 7px;border-radius:12px;font-size:9.5px;font-weight:700;background:#e0e8f9;color:#1433a8">MANUAL</span>';
    return '<tr>'
      +'<td style="font-size:11px;font-family:\'JetBrains Mono\',monospace">'+esc(r.date||'')+'</td>'
      +'<td>'+sourceTag+'</td>'
      +'<td><span style="padding:2px 8px;border-radius:12px;font-size:10.5px;font-weight:700;background:#e0e8f9;color:#1433a8">'+esc(r.category||'')+'</span></td>'
      +'<td style="font-size:12.5px">'+esc(r.description||'')+'</td>'
      +'<td style="font-family:\'JetBrains Mono\',monospace;font-weight:700;color:#16a34a">₹'+(r.amount||0).toLocaleString()+'</td>'
      +'<td style="font-size:11px;color:var(--muted)">'+esc(r.receipt||'--')+'</td>'
      +'<td>'+(currentUser&&currentUser.role==='admin'?(r.source==='auto'?'<button onclick="gnsiAdminDeleteIncome(\''+parseInt(r.id,10)+'\')" style="background:#fff7ed;color:#d97706;border:1px solid #fcd34d;border-radius:5px;padding:3px 8px;cursor:pointer;font-size:10.5px;font-weight:700" title="Admin: delete auto record">⚠✕</button>':'<button onclick="gnsiAdminDeleteIncome(\''+parseInt(r.id,10)+'\')" style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;border-radius:5px;padding:3px 8px;cursor:pointer;font-size:10.5px;font-weight:700">✕</button>'):(r.source==='auto'?'<span style="font-size:10px;color:#16a34a;font-weight:600">AUTO</span>':'<span style="font-size:10px;color:var(--muted)">—</span>'))+'</td>'
    +'</tr>';
  }).join('');
  return '<div class="stat-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:20px">'
    +'<div class="stat-card" style="--c:#16a34a"><div class="stat-label">Total Income</div><div class="stat-val">₹'+Math.round(totalInc/1000)+'K</div><div class="stat-sub">All time</div></div>'
    +'<div class="stat-card" style="--c:#3b78c9"><div class="stat-label">Today\'s Income</div><div class="stat-val">₹'+todayInc.toLocaleString()+'</div><div class="stat-sub">'+today+'</div></div>'
    +'<div class="stat-card" style="--c:#d4a853"><div class="stat-label">Records</div><div class="stat-val">'+records.length+'</div><div class="stat-sub">Income entries</div></div>'
    +'<div class="stat-card" style="--c:#7c3aed"><div class="stat-label">Auto-credited</div><div class="stat-val">'+records.filter(function(r){return r.source==='auto';}).length+'</div><div class="stat-sub">From fee collection</div></div>'
    +'</div>'
    +'<div style="display:flex;gap:10px;margin-bottom:16px">'
    +(function(){var _ok=currentUser&&(currentUser.role==='admin'||currentUser.role==='manager'||currentUser.role==='accounts');return _ok?'<button class="btn btn-primary" onclick="feesIncFormOpen=!feesIncFormOpen;render()">+ Manual Entry</button>':'<span style="font-size:11.5px;color:var(--muted)">🔒 Auto-credited only</span>';})() 
    +'<button class="btn btn-outline" onclick="feeExportIncome()" style="color:#16a34a;border-color:#86efac">⬇ Export CSV</button>'
    +'</div>'+addForm
    +'<div class="card"><div class="card-head"><span class="card-title">Income Ledger</span><span style="font-family:\'JetBrains Mono\',monospace;font-size:11px;color:var(--muted)">Showing last 100 entries</span></div>'
    +'<div style="overflow-x:auto"><table><thead><tr><th>Date</th><th>Source</th><th>Category</th><th>Description</th><th>Amount</th><th>Receipt</th><th>Del</th></tr></thead>'
    +'<tbody>'+(tableRows||'<tr><td colspan="7" style="padding:32px;text-align:center;color:var(--muted)">No income entries yet. Collect fees to see auto-credited entries.</td></tr>')+'</tbody></table></div></div>';
}
function feeSaveIncome(){
  if(!currentUser||(currentUser.role!=='admin'&&currentUser.role!=='manager'&&currentUser.role!=='accounts')){
    showToast('🔒 Not authorized to add manual income','#dc2626');return;
  }
  var date=((document.getElementById('inc-date')||{}).value||new Date().toISOString().split('T')[0]);
  var cat=((document.getElementById('inc-cat')||{}).value||'Other');
  var amt=parseFloat((document.getElementById('inc-amt')||{}).value||0)||0;
  var desc=((document.getElementById('inc-desc')||{}).value||'').trim();
  var receipt=((document.getElementById('inc-receipt')||{}).value||'').trim();
  if(!desc||!amt){alert('Description and amount required.');return;}
  var blockedCats=['Monthly Fee','Admission Fee','Full Payment','Advance Fee','Items Provided'];
  if(blockedCats.indexOf(cat)!==-1){alert('\u26a0 '+cat+' income must be collected via Fee Management.\nManual entry of fee-type income is not permitted.');return;}
  var inc=loadIncomeLedger();
  inc.push({id:'inc_'+Date.now(),date:date,category:cat,description:desc,amount:amt,receipt:receipt,source:'manual',createdAt:new Date().toISOString()});
  saveIncomeLedger(inc);feesIncFormOpen=false;render();
}
function feeDeleteIncome(id){
  if(!currentUser||currentUser.role!=='admin'){showToast('🔒 Only admin can delete income records','#dc2626');return;}
  gnsiAdminDeleteIncome(id);
}
function gnsiAdminDeleteIncome(id){
  if(!currentUser||currentUser.role!=='admin'){showToast('🔒 Only admin can delete income records','#dc2626');return;}
  var records=loadIncomeLedger();
  var rec=records.find(function(r){return r.id===id;});
  if(!rec){showToast('Record not found','#d97706');return;}
  var isAuto=rec.source==='auto';
  var msg=isAuto
    ?'\u26a0 ADMIN: Auto-credited fee income. Source: '+(rec.description||'')+' | \u20b9'+(rec.amount||0).toLocaleString()+' | '+(rec.date||'')+'. Delete only on user request for error. Proceed?'
    :'Delete income: '+(rec.description||'')+' | \u20b9'+(rec.amount||0).toLocaleString()+' | '+(rec.date||'')+'. Proceed?';
  if(!confirm(msg))return;
  if(typeof acctAudit==='function')acctAudit('ADMIN DELETE INCOME','ID:'+id+' | ₹'+(rec.amount||0)+' | '+(rec.description||'')+(isAuto?' [AUTO-CREDITED]':''));
  gnsiLogFeeMonitor({type:'ADMIN_INCOME_DELETE',recordId:id,amount:rec.amount||0,description:rec.description||'',source:rec.source||'',adminName:(currentUser&&currentUser.name)||'Admin',isAutoRecord:isAuto});
  saveIncomeLedger(records.filter(function(x){return x.id!==id;}));
  showToast('✅ Income record deleted (admin action)','#dc2626');
  render();
}
function gnsiExportAttendance(){
  showToast('⏳ Preparing Attendance CSV…','#2563eb');

  /* FIX #5: Export monthly attendance for all students */
  var month = prompt('Enter month to export (YYYY-MM):') || new Date().toISOString().slice(0,7);
  if(!month.match(/^\d{4}-\d{2}$/)){showToast('Invalid format. Use YYYY-MM e.g. 2026-04','#d97706');return;}
  var rows = [['Student','Roll','Class','Date','Status']];
  var keys = Object.keys(attendance).filter(function(k){ return k.indexOf(month)===0 && k.indexOf('-T-')!==-1; });
  var statMap = {'P':'Present','A':'Absent','L':'Late','ED':'Early Dep'};
  keys.sort().forEach(function(k){
    var parts = k.split('-T-');
    if(parts.length!==2) return;
    var date = parts[0]; var stuId = parseInt(parts[1]);
    var stu = students.find(function(s){return s.id===stuId;});
    rows.push([stu?stu.name:'Unknown', stu?stu.roll||'':'', stu?stu.cls||'':'', date, statMap[attendance[k]]||attendance[k]||'']);
  });
  if(rows.length===1){showToast('No student attendance data for '+month,'#d97706');return;}
    showToast('✅ Attendance CSV ready — '+(students.length)+' rows','#16a34a');
  downloadCSV('GNSI_Attendance_'+month+'.csv', rows);
  showToast('\u2705 Attendance exported: '+(rows.length-1)+' records','#16a34a');
}
function gnsiExportStaffAttendance(){
  var month = prompt('Enter month to export (YYYY-MM):') || new Date().toISOString().slice(0,7);
  if(!month.match(/^\d{4}-\d{2}$/)){showToast('Invalid format. Use YYYY-MM','#d97706');return;}
  var rows = [['Staff','Role','Date','Status']];
  var keys = Object.keys(attendance).filter(function(k){ return k.indexOf(month)===0 && k.indexOf('-S-')!==-1; });
  var statMap = {'P':'Present','A':'Absent','L':'Late','ED':'Early Dep'};
  keys.sort().forEach(function(k){
    var parts = k.split('-S-');
    if(parts.length!==2) return;
    var date = parts[0]; var sId = parseInt(parts[1]);
    var s = staff.find(function(x){return x.id===sId;});
    rows.push([s?s.name:'Unknown', s?s.role||'':'', date, statMap[attendance[k]]||attendance[k]||'']);
  });
  if(rows.length===1){showToast('No staff attendance data for '+month,'#d97706');return;}
  downloadCSV('GNSI_Staff_Attendance_'+month+'.csv', rows);
  showToast('\u2705 Staff attendance exported: '+(rows.length-1)+' records','#16a34a');
}
function feeExportIncome(){
  showToast('⏳ Preparing Income CSV…','#2563eb');

  var r=loadIncomeLedger();
  var rows=[['Date','Source','Category','Description','Amount','Receipt']];
  r.forEach(function(x){rows.push([x.date||'',x.source||'',x.category||'',x.description||'',x.amount||0,x.receipt||'']);});
    showToast('✅ Income CSV ready — '+(r.length)+' rows','#16a34a');
  downloadCSV('GNSI_Income.csv',rows);
}
/* -- EXPENDITURE TAB -- */
function renderExpenditureTab(){
  var records=loadExpLedger();
  var EXP_CATS=['Salaries','Utilities (Electricity/Water)','Maintenance & Repair','Stationery & Supplies','Food & Provisions','Transport','Books & Materials','Equipment','Events & Functions','Miscellaneous'];
  var today=new Date().toISOString().split('T')[0];
  var todayExp=records.filter(function(r){return r.date===today;}).reduce(function(s,r){return s+(r.amount||0);},0);
  var totalExp=records.reduce(function(s,r){return s+(r.amount||0);},0);
  var addForm='';
  if(feesExpFormOpen){
    var catOpts=EXP_CATS.map(function(c){return'<option>'+c+'</option>';}).join('');
    addForm='<div class="form-panel" style="border-color:#dc2626">'
      +'<div class="form-title" style="color:#dc2626">➖ Add Expenditure Entry</div>'
      +'<div class="form-grid g3">'
      +'<div class="form-group"><label>Date *</label><input id="exp-date" type="date" value="'+today+'"/></div>'
      +'<div class="form-group"><label>Category *</label><select id="exp-cat">'+catOpts+'</select></div>'
      +'<div class="form-group"><label>Amount (₹) *</label><input id="exp-amt" type="number" min="0" placeholder="Amount"/></div>'
      +'<div class="form-group" style="grid-column:1/-1"><label>Description *</label><input id="exp-desc" placeholder="Description of expenditure"/></div>'
      +'<div class="form-group"><label>Paid To / Vendor</label><input id="exp-vendor" placeholder="Payee name"/></div>'
      +'<div class="form-group"><label>Bill / Voucher No.</label><input id="exp-bill" placeholder="Optional"/></div>'
      +'<div class="form-group"><label>Approved By</label><input id="exp-approved" placeholder="Approving authority"/></div>'
      +'</div>'
      +'<div class="form-actions"><button class="btn btn-primary" onclick="feeSaveExp()">➖ Add Entry</button><button class="btn btn-outline" onclick="feesExpFormOpen=false;render()">Cancel</button></div>'
      +'</div>';
  }
  var tableRows=records.slice().sort(function(a,b){return(b.date||'').localeCompare(a.date||'');}).slice(0,100).map(function(r){
    return '<tr>'
      +'<td style="font-size:11px;font-family:\'JetBrains Mono\',monospace">'+esc(r.date||'')+'</td>'
      +'<td><span style="padding:2px 8px;border-radius:12px;font-size:10.5px;font-weight:700;background:#fee2e2;color:#dc2626">'+esc(r.category||'')+'</span></td>'
      +'<td style="font-size:12.5px">'+esc(r.description||'')+'</td>'
      +'<td style="font-size:12px;color:var(--muted)">'+esc(r.vendor||'--')+'</td>'
      +'<td style="font-family:\'JetBrains Mono\',monospace;font-weight:700;color:#dc2626">₹'+(r.amount||0).toLocaleString()+'</td>'
      +'<td style="font-size:11px;color:var(--muted)">'+esc(r.bill||'--')+'</td>'
      +'<td>'+(canDo('del','accounts')?'<button onclick="feeDeleteExp(\''+parseInt(r.id,10)+'\')" style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;border-radius:5px;padding:3px 8px;cursor:pointer;font-size:10.5px;font-weight:700;font-family:\'DM Sans\',sans-serif">✕</button>':'')+'</td>'
    +'</tr>';
  }).join('');
  // Category breakdown
  var byCat={};records.forEach(function(r){byCat[r.category]=(byCat[r.category]||0)+(r.amount||0);});
  var catRows=Object.entries(byCat).sort(function(a,b){return b[1]-a[1];}).map(function(e){
    var pct=totalExp?Math.round(e[1]/totalExp*100):0;
    return '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">'
      +'<div style="font-size:12px;font-weight:600;min-width:170px">'+esc(e[0])+'</div>'
      +'<div style="flex:1;height:8px;background:var(--surface3);border-radius:4px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:#dc2626;border-radius:4px"></div></div>'
      +'<div style="font-family:\'JetBrains Mono\',monospace;font-size:12px;font-weight:700;color:#dc2626;min-width:80px;text-align:right">₹'+e[1].toLocaleString()+'</div>'
      +'</div>';
  }).join('');
  return '<div class="stat-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:20px">'
    +'<div class="stat-card" style="--c:#dc2626"><div class="stat-label">Total Expenditure</div><div class="stat-val">₹'+Math.round(totalExp/1000)+'K</div><div class="stat-sub">All time</div></div>'
    +'<div class="stat-card" style="--c:#d97706"><div class="stat-label">Today\'s Expense</div><div class="stat-val">₹'+todayExp.toLocaleString()+'</div><div class="stat-sub">'+today+'</div></div>'
    +'<div class="stat-card" style="--c:#3b78c9"><div class="stat-label">Records</div><div class="stat-val">'+records.length+'</div><div class="stat-sub">Expense entries</div></div>'
    +'</div>'
    +'<div style="display:flex;gap:20px;margin-bottom:20px">'
    +'<div class="card" style="flex:1"><div class="card-head"><span class="card-title">Expenditure by Category</span></div><div style="padding:16px 20px">'+(catRows||'<div style="color:var(--muted);text-align:center;padding:16px">No expenditure data</div>')+'</div></div>'
    +'</div>'
    +'<div style="display:flex;gap:10px;margin-bottom:16px">'
    +'<button class="btn btn-primary" onclick="feesExpFormOpen=!feesExpFormOpen;render()">+ Add Expenditure</button>'
    +'<button class="btn btn-outline" onclick="feeExportExp()" style="color:#dc2626;border-color:#fca5a5">⬇ Export CSV</button>'
    +'</div>'+addForm
    +'<div class="card"><div class="card-head"><span class="card-title">Expenditure Ledger</span><span style="font-family:\'JetBrains Mono\',monospace;font-size:11px;color:var(--muted)">Last 100 entries</span></div>'
    +'<div style="overflow-x:auto"><table><thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Paid To</th><th>Amount</th><th>Bill No.</th><th>Del</th></tr></thead>'
    +'<tbody>'+(tableRows||'<tr><td colspan="7" style="padding:32px;text-align:center;color:var(--muted)">No expenditure entries yet.</td></tr>')+'</tbody></table></div></div>';
}
function feeSaveExp(){
  var date=((document.getElementById('exp-date')||{}).value||new Date().toISOString().split('T')[0]);
  var cat=((document.getElementById('exp-cat')||{}).value||'Miscellaneous');
  var amt=parseFloat((document.getElementById('exp-amt')||{}).value||0)||0;
  var desc=((document.getElementById('exp-desc')||{}).value||'').trim();
  var vendor=((document.getElementById('exp-vendor')||{}).value||'').trim();
  var bill=((document.getElementById('exp-bill')||{}).value||'').trim();
  var approved=((document.getElementById('exp-approved')||{}).value||'').trim();
  if(!desc||!amt){alert('Description and amount required.');return;}
  var exp=loadExpLedger();
  exp.push({id:'exp_'+Date.now(),date:date,category:cat,description:desc,amount:amt,vendor:vendor,bill:bill,approvedBy:approved,createdAt:new Date().toISOString()});
  saveExpLedger(exp);feesExpFormOpen=false;render();
}
function feeDeleteExp(id){if(!confirm('Delete this expense entry?'))return;var r=loadExpLedger();saveExpLedger(r.filter(function(x){return x.id!==id;}));render();}
function feeExportExp(){
  showToast('⏳ Preparing Expense CSV…','#2563eb');

  var r=loadExpLedger();
  var rows=[['Date','Category','Description','Paid To','Amount','Bill No.','Approved By']];
  r.forEach(function(x){rows.push([x.date||'',x.category||'',x.description||'',x.vendor||'',x.amount||0,x.bill||'',x.approvedBy||'']);});
    showToast('✅ Expense CSV ready — '+(r.length)+' rows','#16a34a');
  downloadCSV('GNSI_Expenditure.csv',rows);
}
/* -- MONTHLY REPORT TAB -- */
var acctRptFrom='';
var acctRptTo='';
function renderMonthlyReport(){
  var today=new Date().toISOString().split('T')[0];
  var firstOfMonth=today.slice(0,8)+'01';
  var from=acctRptFrom||firstOfMonth;
  var to=acctRptTo||today;
  var incRecs=loadIncomeLedger().filter(function(r){return r.date>=from&&r.date<=to;});
  var expRecs=loadExpLedger().filter(function(r){return r.date>=from&&r.date<=to;});
  var totalInc=incRecs.reduce(function(s,r){return s+(r.amount||0);},0);
  var totalExp=expRecs.reduce(function(s,r){return s+(r.amount||0);},0);
  var surplus=totalInc-totalExp;
  // Breakdown income by category
  var incByCat={};incRecs.forEach(function(r){incByCat[r.category||'Other']=(incByCat[r.category||'Other']||0)+(r.amount||0);});
  var expByCat={};expRecs.forEach(function(r){expByCat[r.category||'Misc']=(expByCat[r.category||'Misc']||0)+(r.amount||0);});
  var incCatRows=Object.entries(incByCat).sort(function(a,b){return b[1]-a[1];}).map(function(e){
    return '<tr><td>'+esc(e[0])+'</td><td style="text-align:right;font-weight:700;color:#16a34a;font-family:\'JetBrains Mono\',monospace">₹'+e[1].toLocaleString()+'</td></tr>';
  }).join('');
  var expCatRows=Object.entries(expByCat).sort(function(a,b){return b[1]-a[1];}).map(function(e){
    return '<tr><td>'+esc(e[0])+'</td><td style="text-align:right;font-weight:700;color:#dc2626;font-family:\'JetBrains Mono\',monospace">₹'+e[1].toLocaleString()+'</td></tr>';
  }).join('');
  // Daily summary table
  var dayMap={};
  incRecs.forEach(function(r){if(!dayMap[r.date])dayMap[r.date]={inc:0,exp:0};dayMap[r.date].inc+=(r.amount||0);});
  expRecs.forEach(function(r){if(!dayMap[r.date])dayMap[r.date]={inc:0,exp:0};dayMap[r.date].exp+=(r.amount||0);});
  var dailyRows=Object.keys(dayMap).sort().map(function(d){
    var day=dayMap[d];var net=day.inc-day.exp;
    return '<tr>'
      +'<td style="font-family:\'JetBrains Mono\',monospace;font-size:12px">'+esc(d)+'</td>'
      +'<td style="color:#16a34a;font-weight:700;font-family:\'JetBrains Mono\',monospace">₹'+day.inc.toLocaleString()+'</td>'
      +'<td style="color:#dc2626;font-weight:700;font-family:\'JetBrains Mono\',monospace">₹'+day.exp.toLocaleString()+'</td>'
      +'<td style="font-weight:800;font-family:\'JetBrains Mono\',monospace;color:'+(net>=0?'#16a34a':'#dc2626')+'">₹'+net.toLocaleString()+'</td>'
    +'</tr>';
  }).join('');
  return '<div class="card" style="margin-bottom:20px">'
    +'<div class="card-head"><span class="card-title">📊 Monthly / Date Range Report</span></div>'
    +'<div style="padding:16px 20px;display:flex;gap:14px;align-items:flex-end;flex-wrap:wrap">'
    +'<div class="form-group" style="margin:0"><label>From Date</label><input type="date" value="'+from+'" onchange="acctRptFrom=this.value;render()"/></div>'
    +'<div class="form-group" style="margin:0"><label>To Date</label><input type="date" value="'+to+'" onchange="acctRptTo=this.value;render()"/></div>'
    +'<button onclick="acctRptFrom=\'\';acctRptTo=\'\';render()" style="padding:8px 16px;border-radius:8px;border:1.5px solid var(--border);background:var(--surface2);cursor:pointer;font-size:12px;font-weight:600;color:var(--muted)">Reset</button>'
    +'<button onclick="printMonthlyReport(\''+from+'\',\''+to+'\')" style="padding:8px 16px;border-radius:8px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:12px;font-weight:700">🖨 Print Report</button>'
    +'<button onclick="exportMonthlyReport(\''+from+'\',\''+to+'\')" style="padding:8px 16px;border-radius:8px;border:1.5px solid #86efac;background:#dcfce7;color:#16a34a;cursor:pointer;font-size:12px;font-weight:700">⬇ Export CSV</button>'
    +'</div></div>'
    +'<div class="stat-grid" style="margin-bottom:20px">'
    +'<div class="stat-card" style="--c:#16a34a"><div class="stat-label">Total Income</div><div class="stat-val">₹'+Math.round(totalInc/1000)+'K</div><div class="stat-sub">'+from+' to '+to+'</div></div>'
    +'<div class="stat-card" style="--c:#dc2626"><div class="stat-label">Total Expenditure</div><div class="stat-val">₹'+Math.round(totalExp/1000)+'K</div><div class="stat-sub">Same period</div></div>'
    +'<div class="stat-card" style="--c:'+(surplus>=0?'#16a34a':'#dc2626')+'"><div class="stat-label">'+(surplus>=0?'Surplus':'Deficit')+'</div><div class="stat-val">₹'+Math.abs(Math.round(surplus/1000))+'K</div><div class="stat-sub">'+(surplus>=0?'Positive balance':'Negative balance')+'</div></div>'
    +'<div class="stat-card" style="--c:#3b78c9"><div class="stat-label">Transactions</div><div class="stat-val">'+(incRecs.length+expRecs.length)+'</div><div class="stat-sub">Income+Expense records</div></div>'
    +'</div>'
    +'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;margin-bottom:20px">'
    +'<div class="card"><div class="card-head"><span class="card-title">📈 Income by Category</span></div>'
    +'<div style="overflow-x:auto;-webkit-overflow-scrolling:touch"><table><thead><tr><th>Category</th><th>Amount</th></tr></thead><tbody>'+(incCatRows||'<tr><td colspan="2" style="text-align:center;padding:20px;color:var(--muted)">No income data</td></tr>')+'<tr style="background:var(--surface2);font-weight:800"><td>TOTAL</td><td style="text-align:right;color:#16a34a;font-family:\'JetBrains Mono\',monospace">₹'+totalInc.toLocaleString()+'</td></tr></tbody></table></div></div>'
    +'<div class="card"><div class="card-head"><span class="card-title">📉 Expenditure by Category</span></div>'
    +'<div style="overflow-x:auto;-webkit-overflow-scrolling:touch"><table><thead><tr><th>Category</th><th>Amount</th></tr></thead><tbody>'+(expCatRows||'<tr><td colspan="2" style="text-align:center;padding:20px;color:var(--muted)">No expenditure data</td></tr>')+'<tr style="background:var(--surface2);font-weight:800"><td>TOTAL</td><td style="text-align:right;color:#dc2626;font-family:\'JetBrains Mono\',monospace">₹'+totalExp.toLocaleString()+'</td></tr></tbody></table></div></div>'
    +'</div>'
    +'<div class="card"><div class="card-head"><span class="card-title">Daily Summary</span></div>'
    +'<div style="overflow-x:auto"><table><thead><tr><th>Date</th><th>Income</th><th>Expenditure</th><th>Net</th></tr></thead>'
    +'<tbody>'+(dailyRows||'<tr><td colspan="4" style="padding:24px;text-align:center;color:var(--muted)">No data for selected period</td></tr>')+'</tbody></table></div></div>';
}
function printMonthlyReport(from, to){
  var incRecs=loadIncomeLedger().filter(function(r){return r.date>=from&&r.date<=to;});
  var expRecs=loadExpLedger().filter(function(r){return r.date>=from&&r.date<=to;});
  var totalInc=incRecs.reduce(function(s,r){return s+(r.amount||0);},0);
  var totalExp=expRecs.reduce(function(s,r){return s+(r.amount||0);},0);
  var surplus=totalInc-totalExp;
  var incRows=incRecs.map(function(r){return'<tr><td>'+esc(r.date||'')+'</td><td>'+esc(r.category||'')+'</td><td>'+esc(r.description||'')+'</td><td style="text-align:right;font-weight:700;color:#16a34a">₹'+(r.amount||0).toLocaleString()+'</td></tr>';}).join('');
  var expRows=expRecs.map(function(r){return'<tr><td>'+esc(r.date||'')+'</td><td>'+esc(r.category||'')+'</td><td>'+esc(r.description||'')+'</td><td style="text-align:right;font-weight:700;color:#dc2626">₹'+(r.amount||0).toLocaleString()+'</td></tr>';}).join('');
  var w=window.open('','_blank','width=800,height=900');
  w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Monthly Report</title>'
    +'<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:24px;font-size:12px}table{width:100%;border-collapse:collapse;margin-bottom:20px}th{background:#1433a8;color:#fff;padding:8px 10px;text-align:left;font-size:11px}td{padding:7px 10px;border-bottom:1px solid #e5e7eb}.section-title{font-size:14px;font-weight:800;margin:18px 0 8px;color:#1433a8;border-bottom:2px solid #1433a8;padding-bottom:4px}.total-row{background:#f0f3fa;font-weight:800}@media print{.no-print{display:none}}</style>'
    +'</head><body>'
    +'<div style="text-align:center;margin-bottom:20px;border-bottom:2px solid #1433a8;padding-bottom:14px">'
    +'<div style="font-size:16px;font-weight:800;color:#1433a8">'+(window.TENANT?window.TENANT.name.toUpperCase():'SCHOOL MANAGEMENT PORTAL')+'</div>'
    +'<div style="font-size:11px;color:#666">'+(window.TENANT?window.TENANT.address+', '+window.TENANT.city+', '+window.TENANT.state:'')+'</div>'
    +'<div style="font-size:13px;font-weight:700;margin-top:8px">Income &amp; Expenditure Report</div>'
    +'<div style="font-size:11px;color:#666">Period: '+from+' to '+to+'</div>'
    +'</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:20px">'
    +'<div style="border:1.5px solid #86efac;border-radius:8px;padding:10px;text-align:center"><div style="font-size:10px;color:#666;text-transform:uppercase">Total Income</div><div style="font-size:18px;font-weight:800;color:#16a34a">₹'+totalInc.toLocaleString()+'</div></div>'
    +'<div style="border:1.5px solid #fca5a5;border-radius:8px;padding:10px;text-align:center"><div style="font-size:10px;color:#666;text-transform:uppercase">Total Expenditure</div><div style="font-size:18px;font-weight:800;color:#dc2626">₹'+totalExp.toLocaleString()+'</div></div>'
    +'<div style="border:1.5px solid #c4b5fd;border-radius:8px;padding:10px;text-align:center"><div style="font-size:10px;color:#666;text-transform:uppercase">'+(surplus>=0?'Surplus':'Deficit')+'</div><div style="font-size:18px;font-weight:800;color:'+(surplus>=0?'#16a34a':'#dc2626')+'">₹'+Math.abs(surplus).toLocaleString()+'</div></div>'
    +'</div>'
    +'<div class="section-title">📈 Income Records</div>'
    +'<table><thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th></tr></thead><tbody>'+(incRows||'<tr><td colspan="4" style="text-align:center;padding:16px;color:#888">No income records</td></tr>')+'<tr class="total-row"><td colspan="3">TOTAL INCOME</td><td style="text-align:right;color:#16a34a">₹'+totalInc.toLocaleString()+'</td></tr></tbody></table>'
    +'<div class="section-title">📉 Expenditure Records</div>'
    +'<table><thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th></tr></thead><tbody>'+(expRows||'<tr><td colspan="4" style="text-align:center;padding:16px;color:#888">No expenditure records</td></tr>')+'<tr class="total-row"><td colspan="3">TOTAL EXPENDITURE</td><td style="text-align:right;color:#dc2626">₹'+totalExp.toLocaleString()+'</td></tr></tbody></table>'
    +'<div style="border:2px solid '+(surplus>=0?'#16a34a':'#dc2626')+';border-radius:8px;padding:14px;text-align:center;margin-top:16px">'
    +'<div style="font-size:13px;font-weight:800;color:'+(surplus>=0?'#16a34a':'#dc2626')+'">'+(surplus>=0?'NET SURPLUS':'NET DEFICIT')+': ₹'+Math.abs(surplus).toLocaleString()+'</div>'
    +'</div>'
    +'<div class="no-print" style="text-align:center;margin-top:20px"><button onclick="window.print()" style="padding:10px 28px;background:#1433a8;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer">🖨 Print Report</button></div>'
    +'</body></html>');
  w.document.close();
}
function exportMonthlyReport(from, to){
  var incRecs=loadIncomeLedger().filter(function(r){return r.date>=from&&r.date<=to;});
  var expRecs=loadExpLedger().filter(function(r){return r.date>=from&&r.date<=to;});
  var totalInc=incRecs.reduce(function(s,r){return s+(r.amount||0);},0);
  var totalExp=expRecs.reduce(function(s,r){return s+(r.amount||0);},0);
  var rows=[['GNSI Monthly Report: '+from+' to '+to],[''],['INCOME'],['Date','Source','Category','Description','Amount','Receipt']];
  incRecs.forEach(function(r){rows.push([r.date||'',r.source||'',r.category||'',r.description||'',r.amount||0,r.receipt||'']);});
  rows.push(['','','','TOTAL INCOME',totalInc,'']);
  rows.push([''],['EXPENDITURE'],['Date','Category','Description','Paid To','Amount','Bill No.']);
  expRecs.forEach(function(r){rows.push([r.date||'',r.category||'',r.description||'',r.vendor||'',r.amount||0,r.bill||'']);});
  rows.push(['','','','TOTAL EXPENDITURE',totalExp,'']);
  rows.push(['','','',totalInc>=totalExp?'NET SURPLUS':'NET DEFICIT',Math.abs(totalInc-totalExp),'']);
  downloadCSV('GNSI_Monthly_Report_'+from+'_to_'+to+'.csv',rows);
}
/* -- BALANCE SHEET -- */
function renderBalanceSheet(){
  var incRecs=loadIncomeLedger();
  var expRecs=loadExpLedger();
  var totalInc=incRecs.reduce(function(s,r){return s+(r.amount||0);},0);
  var totalExp=expRecs.reduce(function(s,r){return s+(r.amount||0);},0);
  var surplus=totalInc-totalExp;
  // Income breakdown
  var incByCat={};incRecs.forEach(function(r){incByCat[r.category||'Other']=(incByCat[r.category||'Other']||0)+(r.amount||0);});
  var expByCat={};expRecs.forEach(function(r){expByCat[r.category||'Misc']=(expByCat[r.category||'Misc']||0)+(r.amount||0);});
  // Monthly trend (last 6 months)
  var monthMap={};
  var now=new Date();
  for(var i=5;i>=0;i--){var d=new Date(now.getFullYear(),now.getMonth()-i,1);monthMap[d.toISOString().slice(0,7)]={inc:0,exp:0};}
  incRecs.forEach(function(r){var m=(r.date||'').slice(0,7);if(monthMap[m])monthMap[m].inc+=(r.amount||0);});
  expRecs.forEach(function(r){var m=(r.date||'').slice(0,7);if(monthMap[m])monthMap[m].exp+=(r.amount||0);});
  var trendRows=Object.entries(monthMap).map(function(e){
    var net=e[1].inc-e[1].exp;
    return '<tr>'
      +'<td style="font-weight:700">'+esc(e[0])+'</td>'
      +'<td style="font-family:\'JetBrains Mono\',monospace;color:#16a34a">₹'+e[1].inc.toLocaleString()+'</td>'
      +'<td style="font-family:\'JetBrains Mono\',monospace;color:#dc2626">₹'+e[1].exp.toLocaleString()+'</td>'
      +'<td style="font-family:\'JetBrains Mono\',monospace;font-weight:800;color:'+(net>=0?'#16a34a':'#dc2626')+'">₹'+net.toLocaleString()+'</td>'
    +'</tr>';
  }).join('');
  var incCatRows=Object.entries(incByCat).sort(function(a,b){return b[1]-a[1];}).map(function(e){
    return '<tr><td>'+esc(e[0])+'</td><td style="text-align:right;color:#16a34a;font-weight:700;font-family:\'JetBrains Mono\',monospace">₹'+e[1].toLocaleString()+'</td></tr>';
  }).join('');
  var expCatRows=Object.entries(expByCat).sort(function(a,b){return b[1]-a[1];}).map(function(e){
    return '<tr><td>'+esc(e[0])+'</td><td style="text-align:right;color:#dc2626;font-weight:700;font-family:\'JetBrains Mono\',monospace">₹'+e[1].toLocaleString()+'</td></tr>';
  }).join('');
  return '<div class="stat-grid" style="margin-bottom:20px">'
    +'<div class="stat-card" style="--c:#16a34a"><div class="stat-label">Total Income</div><div class="stat-val">₹'+Math.round(totalInc/1000)+'K</div><div class="stat-sub">All time</div></div>'
    +'<div class="stat-card" style="--c:#dc2626"><div class="stat-label">Total Expenditure</div><div class="stat-val">₹'+Math.round(totalExp/1000)+'K</div><div class="stat-sub">All time</div></div>'
    +'<div class="stat-card" style="--c:'+(surplus>=0?'#16a34a':'#dc2626')+'"><div class="stat-label">'+(surplus>=0?'Net Surplus':'Net Deficit')+'</div><div class="stat-val">₹'+Math.abs(Math.round(surplus/1000))+'K</div><div class="stat-sub">'+(surplus>=0?'Institution is profitable':'Needs attention')+'</div></div>'
    +'<div class="stat-card" style="--c:#3b78c9"><div class="stat-label">Total Records</div><div class="stat-val">'+(incRecs.length+expRecs.length)+'</div><div class="stat-sub">All transactions</div></div>'
    +'</div>'
    +'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;margin-bottom:20px">'
    +'<div class="card"><div class="card-head"><span class="card-title">📈 Income Sources</span></div>'
    +'<div style="overflow-x:auto;-webkit-overflow-scrolling:touch"><table><thead><tr><th>Category</th><th>Total</th></tr></thead><tbody>'+(incCatRows||'<tr><td colspan="2" style="text-align:center;padding:16px;color:var(--muted)">No data</td></tr>')+'<tr style="background:var(--surface2);font-weight:800"><td>TOTAL</td><td style="text-align:right;color:#16a34a;font-family:\'JetBrains Mono\',monospace">₹'+totalInc.toLocaleString()+'</td></tr></tbody></table></div></div>'
    +'<div class="card"><div class="card-head"><span class="card-title">📉 Expenditure Categories</span></div>'
    +'<div style="overflow-x:auto;-webkit-overflow-scrolling:touch"><table><thead><tr><th>Category</th><th>Total</th></tr></thead><tbody>'+(expCatRows||'<tr><td colspan="2" style="text-align:center;padding:16px;color:var(--muted)">No data</td></tr>')+'<tr style="background:var(--surface2);font-weight:800"><td>TOTAL</td><td style="text-align:right;color:#dc2626;font-family:\'JetBrains Mono\',monospace">₹'+totalExp.toLocaleString()+'</td></tr></tbody></table></div></div>'
    +'</div>'
    +'<div class="card"><div class="card-head"><span class="card-title">📊 6-Month Trend</span></div>'
    +'<div style="overflow-x:auto"><table><thead><tr><th>Month</th><th>Income</th><th>Expenditure</th><th>Net</th></tr></thead>'
    +'<tbody>'+trendRows+'</tbody></table></div></div>'
    +'<div style="margin-top:16px;padding:16px 20px;background:'+(surplus>=0?'#f0fdf4':'#fef2f2')+';border:2px solid '+(surplus>=0?'#86efac':'#fca5a5')+';border-radius:12px;text-align:center">'
    +'<div style="font-size:18px;font-weight:800;color:'+(surplus>=0?'#16a34a':'#dc2626')+'">'+(surplus>=0?'✅ Institution is Financially Healthy':'⚠ Expenditure Exceeds Income')+'</div>'
    +'<div style="font-size:13px;color:var(--muted);margin-top:4px">'+(surplus>=0?'Net Surplus: ₹'+surplus.toLocaleString():'Net Deficit: ₹'+Math.abs(surplus).toLocaleString())+'</div>'
    +'</div>';
}
/* --- ACCOUNTS ADVANCED FEATURES (Admin Only) -----------------
   State variables for advanced panel
---------------------------------------------------------------- */
var acctAdvSection = 'edit';        // 'edit' | 'bulkdelete' | 'categories' | 'auditlog' | 'reset'
var acctEditTarget = 'income';      // 'income' | 'expenditure'
var acctEditId     = null;          // id of record being edited
var acctBulkTarget = 'income';
var acctBulkFrom   = '';
var acctBulkTo     = '';
var acctCatTarget  = 'income';
var acctAuditLog   = [];            // in-memory audit trail for this session
/* -- Custom category storage -- backed by Supabase (see gnsiFinanceInit) -- */
/* loadCustomCats and saveCustomCats are defined in the Supabase finance module. */
/* -- Audit logger -- */
function acctAudit(action, detail){
  acctAuditLog.unshift({
    ts: new Date().toLocaleString('en-IN'),
    user: (currentUser&&currentUser.name)||'Admin',
    action: action,
    detail: detail
  });
  if(acctAuditLog.length>200) acctAuditLog.length=200;
}
/* ═══════════════════════════════════════════════════════════
   GNSI FEE MONITORING SYSTEM v1.0
   Smart detection of suspicious fee activity.
   Admin-only. Auto-flags anomalies. All deletes logged.
   ═══════════════════════════════════════════════════════════ */

var _gnsiMonitorLog    = null;
var _gnsiMonitorAlerts = null;
var GNSI_MONITOR_KEY   = 'gnsi_fee_monitor_log';
var GNSI_ALERT_KEY     = 'gnsi_fee_monitor_alerts';
var gnsiMonitorTab     = 'alerts';

function gnsiMonitorLoad(){
  if(!_gnsiMonitorLog){
    try{_gnsiMonitorLog=JSON.parse(localStorage.getItem(GNSI_MONITOR_KEY)||'[]');}
    catch(e){_gnsiMonitorLog=[];}
  }
  if(!_gnsiMonitorAlerts){
    try{_gnsiMonitorAlerts=JSON.parse(localStorage.getItem(GNSI_ALERT_KEY)||'[]');}
    catch(e){_gnsiMonitorAlerts=[];}
  }
}
function gnsiMonitorSave(){
  try{localStorage.setItem(GNSI_MONITOR_KEY,JSON.stringify(_gnsiMonitorLog));}catch(e){}
  try{localStorage.setItem(GNSI_ALERT_KEY,  JSON.stringify(_gnsiMonitorAlerts));}catch(e){}
}

function gnsiLogFeeMonitor(data){
  gnsiMonitorLoad();
  var entry=Object.assign({
    id:'fmon_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),
    ts:new Date().toISOString(),
    tsLocal:new Date().toLocaleString('en-IN'),
    user:(currentUser&&currentUser.name)||'Unknown',
    role:(currentUser&&currentUser.role)||'unknown'
  },data);
  _gnsiMonitorLog.unshift(entry);
  if(_gnsiMonitorLog.length>1000)_gnsiMonitorLog.length=1000;
  var alerts=gnsiDetectAnomalies(entry,_gnsiMonitorLog);
  alerts.forEach(function(a){_gnsiMonitorAlerts.unshift(a);});
  if(_gnsiMonitorAlerts.length>200)_gnsiMonitorAlerts.length=200;
  gnsiMonitorSave();
}

function gnsiLogFeeCollection(col){
  gnsiLogFeeMonitor({
    type:'FEE_COLLECTION',
    collectionId:col.id||'',
    stuId:col.stuId||col.studentId||'',
    stuName:col.stuName||col.studentName||'',
    amount:col.amountPaid||col.amount||0,
    feeType:col.feeType||'unknown',
    payMode:col.payMode||'Unknown',
    txnRef:col.txnRef||'',
    forMonth:col.forMonth||'',
    collectedBy:(currentUser&&currentUser.name)||'Unknown'
  });
}

function gnsiDetectAnomalies(entry,log){
  var found=[];
  var ts=new Date(entry.ts).getTime();
  var user=entry.user||'';
  var recentByUser=log.filter(function(e){
    return e.user===user&&Math.abs(new Date(e.ts).getTime()-ts)<3600000;
  });
  if(entry.type==='FEE_COLLECTION'&&(entry.amount||0)>50000){
    found.push({id:'alrt_'+Date.now()+'a',ts:new Date().toLocaleString('en-IN'),severity:'HIGH',
      rule:'LARGE_COLLECTION',resolved:false,
      message:'Large fee collection: \u20b9'+(entry.amount||0).toLocaleString()+' by '+user+' for '+(entry.stuName||entry.stuId||'?')});
  }
  if(entry.type==='FEE_COLLECTION'&&entry.stuId){
    var sameStu=recentByUser.filter(function(e){return e.type==='FEE_COLLECTION'&&e.stuId===entry.stuId;});
    if(sameStu.length>2){
      found.push({id:'alrt_'+Date.now()+'b',ts:new Date().toLocaleString('en-IN'),severity:'MEDIUM',
        rule:'DUPLICATE_COLLECTION',resolved:false,
        message:sameStu.length+' collections for same student ('+( entry.stuName||entry.stuId)+') in 1hr by '+user});
    }
  }
  var recentCols=recentByUser.filter(function(e){return e.type==='FEE_COLLECTION';});
  if(recentCols.length>30){
    found.push({id:'alrt_'+Date.now()+'c',ts:new Date().toLocaleString('en-IN'),severity:'MEDIUM',
      rule:'HIGH_FREQUENCY',resolved:false,
      message:'High-frequency: '+recentCols.length+' collections by '+user+' in past hour'});
  }
  if(entry.type&&entry.type.indexOf('ADMIN_INCOME_DELETE')===0){
    found.push({id:'alrt_'+Date.now()+'d',ts:new Date().toLocaleString('en-IN'),
      severity:entry.isAutoRecord?'HIGH':'MEDIUM',
      rule:'ADMIN_INCOME_DELETE',resolved:false,
      message:'🗑 Admin deleted income'+(entry.isAutoRecord?' [AUTO-FEE RECORD]':'')+': \u20b9'+(entry.amount||0).toLocaleString()+' | '+(entry.description||'')+' by '+(entry.adminName||user)});
  }
  if(entry.type==='ADMIN_BULK_DELETE_INCOME'||entry.type==='ADMIN_WIPE_ALL_INCOME'){
    found.push({id:'alrt_'+Date.now()+'e',ts:new Date().toLocaleString('en-IN'),severity:'CRITICAL',
      rule:'BULK_INCOME_DELETE',resolved:false,
      message:'🚨 BULK DELETE: '+(entry.count||0)+' records | \u20b9'+(entry.totalAmount||0).toLocaleString()+' wiped by '+(entry.adminName||user)});
  }
  if(entry.type==='FEE_COLLECTION'&&(entry.payMode||'').toLowerCase()==='cash'&&(entry.amount||0)>10000&&!entry.txnRef){
    found.push({id:'alrt_'+Date.now()+'f',ts:new Date().toLocaleString('en-IN'),severity:'MEDIUM',
      rule:'LARGE_CASH_NO_REF',resolved:false,
      message:'Large cash \u20b9'+(entry.amount||0).toLocaleString()+' no receipt ref by '+user});
  }
  return found;
}

function gnsiMonitorAlertCount(){
  gnsiMonitorLoad();
  return (_gnsiMonitorAlerts||[]).filter(function(a){return !a.resolved;}).length;
}

function gnsiResolveAlert(id){
  gnsiMonitorLoad();
  var a=(_gnsiMonitorAlerts||[]).find(function(x){return x.id===id;});
  if(a)a.resolved=true;
  gnsiMonitorSave();render();
}

function gnsiClearResolvedAlerts(){
  gnsiMonitorLoad();
  _gnsiMonitorAlerts=(_gnsiMonitorAlerts||[]).filter(function(a){return !a.resolved;});
  gnsiMonitorSave();render();
}

function renderFeeMonitorPanel(mini){
  gnsiMonitorLoad();
  var alerts=_gnsiMonitorAlerts||[];
  var log=(_gnsiMonitorLog||[]).slice(0,200);
  var unresolved=alerts.filter(function(a){return !a.resolved;});
  var critical=unresolved.filter(function(a){return a.severity==='CRITICAL';});
  var high=unresolved.filter(function(a){return a.severity==='HIGH';});
  var medium=unresolved.filter(function(a){return a.severity==='MEDIUM';});
  var sc={CRITICAL:'#dc2626',HIGH:'#d97706',MEDIUM:'#3b78c9',LOW:'#64748b'};
  var sb={CRITICAL:'#fef2f2',HIGH:'#fffbeb',MEDIUM:'#eff6ff',LOW:'#f8fafc'};
  var sd={CRITICAL:'#fca5a5',HIGH:'#fde68a',MEDIUM:'#93c5fd',LOW:'#e2e8f0'};
  if(mini){
    var badge=unresolved.length
      ?'<span style="background:#dc2626;color:#fff;border-radius:12px;padding:1px 8px;font-size:11px;font-weight:800;margin-left:8px">'+unresolved.length+' alerts</span>'
      :'<span style="background:#dcfce7;color:#16a34a;border-radius:12px;padding:1px 8px;font-size:11px;font-weight:700;margin-left:8px">\u2713 Clear</span>';
    var topAlert=unresolved[0]
      ?'<div style="margin-top:8px;padding:8px 12px;background:'+sb[unresolved[0].severity||'LOW']+';border:1px solid '+sd[unresolved[0].severity||'LOW']+';border-radius:8px;font-size:12px;color:'+sc[unresolved[0].severity||'LOW']+'"><b>Latest:</b> '+esc(unresolved[0].message)+'</div>'
      :'';
    return '<div style="background:var(--surface);border:1.5px solid var(--border);border-radius:14px;padding:16px 20px;margin-top:16px">'
      +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">'
      +'<span style="font-size:18px">🕵\ufe0f</span>'
      +'<span style="font-weight:800;font-size:13.5px;color:var(--text)">Fee Monitoring</span>'
      +badge
      +'<button onclick="acTab=\'feemonitor\';render()" style="margin-left:auto;padding:5px 14px;border-radius:8px;border:1.5px solid #1433a8;background:#e0e8f9;color:#1433a8;font-size:11.5px;font-weight:700;cursor:pointer">View All \u2192</button>'
      +'</div>'
      +'<div style="font-size:11.5px;color:var(--muted)">'+critical.length+' critical \u00b7 '+high.length+' high \u00b7 '+medium.length+' medium</div>'
      +topAlert
      +'</div>';
  }
  var alertRows=unresolved.concat(alerts.filter(function(a){return a.resolved;})).slice(0,50).map(function(a,i){
    var scc=sc[a.severity||'LOW'],sbc=sb[a.severity||'LOW'],sdc=sd[a.severity||'LOW'];
    return '<tr style="background:'+(i%2===0?'var(--surface)':'var(--surface2)')+'">'
      +'<td style="padding:8px 12px"><span style="padding:2px 8px;border-radius:8px;background:'+sbc+';color:'+scc+';border:1px solid '+sdc+';font-size:10.5px;font-weight:800">'+esc(a.severity||'')+'</span></td>'
      +'<td style="padding:8px 12px;font-size:11.5px;font-weight:700;color:'+scc+'">'+esc(a.rule||'')+'</td>'
      +'<td style="padding:8px 12px;font-size:12px;max-width:400px">'+esc(a.message||'')+'</td>'
      +'<td style="padding:8px 12px;font-size:10.5px;color:var(--muted)">'+esc(a.ts||'')+'</td>'
      +'<td style="padding:8px 12px">'+(a.resolved?'<span style="color:#16a34a;font-size:11px;font-weight:700">\u2713 Resolved</span>':'<button onclick="gnsiResolveAlert(\''+parseInt(a.id,10)+'\')" style="padding:3px 10px;border-radius:6px;border:1px solid #86efac;background:#dcfce7;color:#16a34a;font-size:11px;font-weight:700;cursor:pointer">Resolve</button>')+'</td>'
      +'</tr>';
  }).join('');
  var todayStr=new Date().toISOString().split('T')[0];
  var todayCols=log.filter(function(e){return (e.ts||'').startsWith(todayStr)&&e.type==='FEE_COLLECTION';});
  var todayTotal=todayCols.reduce(function(s,e){return s+(e.amount||0);},0);
  var logRows=log.slice(0,50).map(function(e,i){
    var tc=e.type&&e.type.indexOf('DELETE')!==-1?'#dc2626':e.type&&e.type.indexOf('FEE_COLLECTION')!==-1?'#16a34a':'#3b78c9';
    return '<tr style="background:'+(i%2===0?'var(--surface)':'var(--surface2)')+'">'
      +'<td style="padding:7px 10px;font-size:10.5px;color:var(--muted);white-space:nowrap">'+esc(e.tsLocal||e.ts||'')+'</td>'
      +'<td style="padding:7px 10px"><span style="padding:2px 8px;border-radius:8px;background:'+tc+'18;color:'+tc+';font-size:10px;font-weight:700">'+esc(e.type||'')+'</span></td>'
      +'<td style="padding:7px 10px;font-size:11.5px;font-weight:600">'+esc(e.user||'')+'</td>'
      +'<td style="padding:7px 10px;font-size:11.5px">'+esc(e.stuName||e.stuId||e.description||'\u2014')+'</td>'
      +'<td style="padding:7px 10px;font-size:11.5px;font-weight:700;color:#16a34a">'+(e.amount?'\u20b9'+Number(e.amount).toLocaleString():'\u2014')+'</td>'
      +'<td style="padding:7px 10px;font-size:11px;color:var(--muted)">'+esc(e.payMode||e.adminName||'')+'</td>'
      +'</tr>';
  }).join('');
  return '<div>'
    +'<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px">'
    +'<div style="padding:14px 16px;background:#dc262618;border:1.5px solid #fca5a5;border-radius:12px;text-align:center"><div style="font-size:11px;font-weight:700;color:#dc2626;text-transform:uppercase">Critical</div><div style="font-size:28px;font-weight:800;color:#dc2626">'+critical.length+'</div></div>'
    +'<div style="padding:14px 16px;background:#d9770618;border:1.5px solid #fde68a;border-radius:12px;text-align:center"><div style="font-size:11px;font-weight:700;color:#d97706;text-transform:uppercase">High</div><div style="font-size:28px;font-weight:800;color:#d97706">'+high.length+'</div></div>'
    +'<div style="padding:14px 16px;background:#16a34a18;border:1.5px solid #86efac;border-radius:12px;text-align:center"><div style="font-size:11px;font-weight:700;color:#16a34a;text-transform:uppercase">Today Collections</div><div style="font-size:28px;font-weight:800;color:#16a34a">'+todayCols.length+'</div><div style="font-size:11px;color:#16a34a">\u20b9'+todayTotal.toLocaleString()+'</div></div>'
    +'<div style="padding:14px 16px;background:#1433a818;border:1.5px solid #93c5fd;border-radius:12px;text-align:center"><div style="font-size:11px;font-weight:700;color:#1433a8;text-transform:uppercase">Log Entries</div><div style="font-size:28px;font-weight:800;color:#1433a8">'+log.length+'</div></div>'
    +'</div>'
    +'<div class="card" style="margin-bottom:16px"><div class="card-head"><span class="card-title">🚨 Suspicious Activity Alerts'+(unresolved.length?' <span style="background:#dc2626;color:#fff;border-radius:10px;padding:1px 8px;font-size:11px;margin-left:6px">'+unresolved.length+' unresolved</span>':'')+'</span>'
    +'<button onclick="gnsiClearResolvedAlerts()" style="padding:4px 12px;border-radius:7px;border:1.5px solid #86efac;background:#dcfce7;color:#16a34a;font-size:11px;font-weight:700;cursor:pointer">Clear Resolved</button>'
    +'</div><div style="overflow-x:auto"><table><thead><tr><th>Severity</th><th>Rule</th><th>Message</th><th>Time</th><th>Action</th></tr></thead>'
    +'<tbody>'+(alertRows||'<tr><td colspan="5" style="text-align:center;padding:24px;color:#16a34a;font-weight:600">\u2713 No suspicious activity detected</td></tr>')+'</tbody></table></div></div>'
    +'<div class="card"><div class="card-head"><span class="card-title">📋 Fee Activity Log</span><span style="font-size:11px;color:var(--muted)">Last 50 events</span></div>'
    +'<div style="overflow-x:auto"><table><thead><tr><th>Time</th><th>Event</th><th>User</th><th>Student/Desc</th><th>Amount</th><th>Mode/By</th></tr></thead>'
    +'<tbody>'+(logRows||'<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--muted)">No activity logged yet</td></tr>')+'</tbody></table></div></div>'
    +'</div>';
}

/* ═══════════════════════════════════════════════════════════
   INTEGRATION BRIDGE: Students <-> Admissions <-> Fee Management
   ═══════════════════════════════════════════════════════════ */

function gnsiOpenStudentFees(stuId){
  window._gnsiIntegJump={type:'student-fees',stuId:stuId};
  if(typeof navigate==='function')navigate('fees');
}
function gnsiOpenStudentProfile(stuId){
  if(typeof navigate==='function'){stuViewId=stuId;navigate('students');}
}
function gnsiOpenStudentAdmission(stuId){
  try{
    var apps=JSON.parse(localStorage.getItem('gnsi_adm_apps')||'[]');
    var app=apps.find(function(a){
      return String(a.linkedStudentId)===String(stuId)
          || String(a.stuId)===String(stuId)
          || String(a._stuId)===String(stuId);
    });
    if(app){
      /* _fromStudents synthetic app with unpaid fee: re-open fee modal */
      if(app._fromStudents && typeof admCheckFeePaid==='function' && !admCheckFeePaid(app.id)){
        window._admPayFeeAppId=String(app.id);
        if(typeof render==='function') render();
        if(typeof showToast==='function') showToast('\u26a0\ufe0f Admission Package pending \u2014 collect now','#ea580c');
        return;
      }
      window._gnsiAdmEditId=app.id;
      if(typeof navigate==='function')navigate('admissions');
      return;
    }
  }catch(e){}
  // No linked admission record -- auto-create one so the student can be found in Admissions
  try {
    var _stu = (typeof students !== 'undefined') ? students.find(function(s){ return String(s.id)===String(stuId); }) : null;
    if (_stu) {
      var _ex = (typeof stuLoadExtra==='function') ? stuLoadExtra(stuId) : {};
      var _synthApp = {
        id:            'sa_'+stuId+'_'+Date.now(),
        name:          _stu.name,
        admNo:         _ex.admNo    || '',
        dob:           _ex.dob      || '',
        gender:        _ex.gender   || '',
        blood:         _ex.blood    || '',
        father:        _ex.father   || '',
        mother:        _ex.mother   || '',
        phone:         _stu.phone   || '',
        whatsapp:      _ex.whatsapp || '',
        address:       _ex.address  || '',
        category:      _ex.category || '',
        prevSchool:    _ex.prevSchool || '',
        cls:           _stu.cls     || '',
        hostel:        _stu.hostel  || 'No',
        session:       _stu.session || '',
        status:        'Admitted',
        _fromStudents: true,
        _stuId:        _stu.id,
        createdAt:     new Date().toISOString()
      };
      var _apps2 = (typeof loadAdmApps==='function') ? loadAdmApps() : [];
      _apps2.push(_synthApp);
      if (typeof saveAdmApps==='function') saveAdmApps(_apps2);
      // Open fee modal if fee not paid, otherwise go to admissions page
      if (typeof admCheckFeePaid==='function' && !admCheckFeePaid(_synthApp.id)) {
        window._admPayFeeAppId = String(_synthApp.id);
        if (typeof render==='function') render();
        if (typeof showToast==='function') showToast('⚠️ Admission Package pending — collect now','#ea580c');
      } else {
        window._gnsiAdmEditId = _synthApp.id;
        if (typeof navigate==='function') navigate('admissions');
      }
      return;
    }
  } catch(e2) { (void 0); }
  if(typeof showToast==='function')showToast('No linked admission record found','#d97706');
}
function gnsiGetStuFeeSummary(stuId){
  try{
    var cols=typeof gnsiLoadFeeCollections==='function'?gnsiLoadFeeCollections():[];
    var stuCols=cols.filter(function(c){return String(c.stuId)===String(stuId)||String(c.studentId)===String(stuId);});
    var totalPaid=stuCols.reduce(function(s,c){return s+(c.amountPaid||c.amount||0);},0);
    return {cols:stuCols,totalPaid:totalPaid,lastPaid:stuCols.length?stuCols[stuCols.length-1]:null};
  }catch(e){return {cols:[],totalPaid:0,lastPaid:null};}
}
function gnsiRenderStuFeeWidget(stuId){
  var summary=gnsiGetStuFeeSummary(stuId);
  var totalPaid=summary.totalPaid;
  var recent=summary.cols.slice(-3).reverse().map(function(co){
    return '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid var(--border-soft)">'
      +'<div style="font-size:11px"><span style="font-weight:600;color:var(--text)">'+esc(co.feeType||'fee')+'</span> <span style="color:var(--muted)">'+esc(co.forMonth||co.description||'')+'</span></div>'
      +'<div style="font-size:11.5px;font-weight:700;color:#16a34a">\u20b9'+(co.amountPaid||co.amount||0).toLocaleString()+'</div>'
      +'</div>';
  }).join('');
  var canEdit=_canEditFees();
  return '<div style="background:linear-gradient(135deg,#f0fdf4,#dcfce755);border:1.5px solid #86efac;border-radius:12px;padding:14px 16px;margin-top:14px">'
    +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">'
    +'<span style="font-size:15px">💳</span>'
    +'<span style="font-size:12px;font-weight:800;color:#16a34a">FEE SUMMARY</span>'
    +'<span style="margin-left:auto;font-size:13px;font-weight:800;color:#16a34a">\u20b9'+totalPaid.toLocaleString()+'</span>'
    +'</div>'
    +(recent||'<div style="font-size:11.5px;color:var(--muted);text-align:center;padding:8px">No fee collections recorded</div>')
    +'<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">'
    +(canEdit?'<button onclick="gnsiOpenStudentFees('+stuId+')" style="padding:5px 12px;border-radius:7px;border:1.5px solid #16a34a;background:#dcfce7;color:#16a34a;font-size:11px;font-weight:700;cursor:pointer">💳 Collect Fee</button>':'')
    +'<button onclick="gnsiOpenStudentFees('+stuId+')" style="padding:5px 12px;border-radius:7px;border:1.5px solid var(--border);background:var(--surface2);color:var(--accent);font-size:11px;font-weight:700;cursor:pointer">📜 History</button>'
    +'<button onclick="gnsiOpenStudentAdmission('+stuId+')" style="padding:5px 12px;border-radius:7px;border:1.5px solid #d4a853;background:#fffbeb;color:#92400e;font-size:11px;font-weight:700;cursor:pointer">📋 Admission</button>'
    +'</div>'
    +'</div>';
}
(function patchStuProfileFeeWidget(){
  if(typeof buildStuProfile==='undefined'){setTimeout(patchStuProfileFeeWidget,300);return;}
  var _orig=buildStuProfile;
  buildStuProfile=function(id){
    var html=_orig(id);
    var MARKER='<div style="padding:14px 22px;background:var(--surface2);border-top:1px solid var(--border-soft);display:flex;align-items:center;gap:10px;flex-wrap:wrap">';
    var widget='<div style="padding:0 22px 18px">'+gnsiRenderStuFeeWidget(id)+'</div>';
    if(html.indexOf(MARKER)!==-1)html=html.replace(MARKER,widget+MARKER);
    return html;
  };
})();
(function patchFeeCollectionMonitor(){
  if(typeof _fmcSaveCol==='undefined'){setTimeout(patchFeeCollectionMonitor,400);return;}
  var _orig=_fmcSaveCol;
  _fmcSaveCol=function(asgnId,colData,prefix){
    var result=_orig(asgnId,colData,prefix);
    if(result){
      try{
        /* FIX #1: use _fmcLoadAsgns (unified hub store) instead of loadStuFeeAssignments
           so students enrolled via the new fee hub are found correctly in the audit log */
        var asgns=(typeof _fmcLoadAsgns==='function')?_fmcLoadAsgns():(loadStuFeeAssignments?loadStuFeeAssignments():[]);
        var asgn=asgns.find(function(a){return a.id===asgnId||a.stuId===asgnId;});
        var stuName='';
        if(asgn&&asgn.stuId&&typeof students!=='undefined'){
          var stu=students.find(function(s){return String(s.id)===String(asgn.stuId);});
          stuName=stu?stu.name:asgn.stuId;
        }
        gnsiLogFeeCollection({
          id:result.id||('col_'+Date.now()),
          stuId:asgn?asgn.stuId:asgnId,stuName:stuName,
          amountPaid:colData.amountPaid||colData.amount||0,
          feeType:colData.feeType||'fee',payMode:colData.payMode||'Unknown',
          txnRef:colData.txnRef||'',forMonth:colData.forMonth||''
        });
      }catch(e){}
    }
    return result;
  };
})();

/* -- renderAccountsAdvanced -- */
function renderAccountsAdvanced(){
  // Guard
  if(!currentUser||currentUser.role!=='admin'){
    return '<div style="padding:40px;text-align:center;color:#dc2626;font-weight:700;font-size:14px">🔒 Access denied. Admin only.</div>';
  }
  /* sub-nav */
  var sections=[
    {id:'edit',     icon:'✏️',  label:'Edit Records'},
    {id:'bulkdelete',icon:'🗑', label:'Bulk Delete'},
    {id:'categories',icon:'🏷', label:'Custom Categories'},
    {id:'auditlog', icon:'📋',  label:'Audit Log'},
    {id:'reset',    icon:'⚠️',  label:'Data Reset'}
  ];
  var subnav='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;padding:14px 18px;background:linear-gradient(135deg,#1e0a3c,#1433a8);border-radius:14px">'
    +'<div style="font-size:11px;font-weight:800;color:rgba(255,255,255,.6);letter-spacing:.1em;text-transform:uppercase;font-family:\'JetBrains Mono\',monospace;width:100%;margin-bottom:8px">🛠 Advanced Admin Controls -- Accounts Module</div>'
    +sections.map(function(s){
      var active=acctAdvSection===s.id;
      return '<button onclick="acctAdvSection=\''+parseInt(s.id,10)+'\';render()" style="padding:7px 16px;border-radius:9px;border:'+(active?'none':'1.5px solid rgba(255,255,255,.25)')+';background:'+(active?'rgba(255,255,255,.22)':'transparent')+';color:'+(active?'#fff':'rgba(255,255,255,.75)')+';font-size:12.5px;font-weight:'+(active?'800':'600')+';cursor:pointer;font-family:\'DM Sans\',sans-serif;display:flex;align-items:center;gap:6px">'+s.icon+' '+s.label+'</button>';
    }).join('')
  +'</div>';
  var body='';
  /* -- SECTION: EDIT RECORDS -- */
  if(acctAdvSection==='edit'){
    var INC_CATS=['Monthly Fee','Admission Fee','Full Payment','Advance Fee','Items Provided','Donation','Other'].concat(loadCustomCats('income'));
    var EXP_CATS=['Salaries','Utilities (Electricity/Water)','Maintenance & Repair','Stationery & Supplies','Food & Provisions','Transport','Books & Materials','Equipment','Events & Functions','Miscellaneous'].concat(loadCustomCats('expenditure'));
    /* target switcher */
    body+='<div style="display:flex;gap:8px;margin-bottom:16px">'
      +'<button onclick="acctEditTarget=\'income\';acctEditId=null;render()" style="padding:7px 18px;border-radius:8px;border:'+(acctEditTarget==='income'?'none':'1.5px solid #86efac')+';background:'+(acctEditTarget==='income'?'#16a34a':'transparent')+';color:'+(acctEditTarget==='income'?'#fff':'#16a34a')+';font-weight:700;cursor:pointer;font-size:12.5px;font-family:\'DM Sans\',sans-serif">📈 Income Records</button>'
      +'<button onclick="acctEditTarget=\'expenditure\';acctEditId=null;render()" style="padding:7px 18px;border-radius:8px;border:'+(acctEditTarget==='expenditure'?'none':'1.5px solid #fca5a5')+';background:'+(acctEditTarget==='expenditure'?'#dc2626':'transparent')+';color:'+(acctEditTarget==='expenditure'?'#fff':'#dc2626')+';font-weight:700;cursor:pointer;font-size:12.5px;font-family:\'DM Sans\',sans-serif">📉 Expenditure Records</button>'
    +'</div>';
    var isInc = acctEditTarget==='income';
    var records = isInc ? loadIncomeLedger() : loadExpLedger();
    var cats    = isInc ? INC_CATS : EXP_CATS;
    var colColor= isInc ? '#16a34a' : '#dc2626';
    /* Edit form panel */
    if(acctEditId){
      var rec = records.find(function(r){return r.id===acctEditId;});
      if(rec){
        body+='<div style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border:2px solid #fde68a;border-radius:14px;padding:20px 22px;margin-bottom:18px">'
          +'<div style="font-size:14px;font-weight:800;color:#92400e;margin-bottom:14px">✏️ Editing '+(isInc?'Income':'Expenditure')+' Record -- <code style="font-size:12px;color:#78350f">'+rec.id+'</code></div>'
          +'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px">'
          +'<div><label style="font-size:11px;font-weight:700;color:#78350f;display:block;margin-bottom:4px">Date</label><input id="adv-edit-date" type="date" value="'+(rec.date||'')+'" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid #fde68a;font-size:13px;background:#fffbeb"/></div>'
          +'<div><label style="font-size:11px;font-weight:700;color:#78350f;display:block;margin-bottom:4px">Category</label><select id="adv-edit-cat" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid #fde68a;font-size:13px;background:#fffbeb">'+cats.map(function(c){return'<option'+(c===rec.category?' selected':'')+'>'+c+'</option>';}).join('')+'</select></div>'
          +'<div><label style="font-size:11px;font-weight:700;color:#78350f;display:block;margin-bottom:4px">Amount (₹)</label><input id="adv-edit-amt" type="number" value="'+(rec.amount||0)+'" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid #fde68a;font-size:13px;background:#fffbeb"/></div>'
          +'<div style="grid-column:1/-1"><label style="font-size:11px;font-weight:700;color:#78350f;display:block;margin-bottom:4px">Description</label><input id="adv-edit-desc" value="'+esc(rec.description||'')+'" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid #fde68a;font-size:13px;background:#fffbeb"/></div>'
          +(isInc?'<div><label style="font-size:11px;font-weight:700;color:#78350f;display:block;margin-bottom:4px">Receipt No.</label><input id="adv-edit-ref" value="'+esc(rec.receipt||'')+'" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid #fde68a;font-size:13px;background:#fffbeb"/></div>'
                 :'<div><label style="font-size:11px;font-weight:700;color:#78350f;display:block;margin-bottom:4px">Paid To / Vendor</label><input id="adv-edit-ref" value="'+esc(rec.vendor||'')+'" style="width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid #fde68a;font-size:13px;background:#fffbeb"/></div>')
          +'</div>'
          +'<div style="display:flex;gap:10px;margin-top:16px">'
            +'<button onclick="acctSaveEdit()" style="padding:9px 22px;border-radius:10px;background:#d97706;color:#fff;border:none;font-size:13px;font-weight:800;cursor:pointer;font-family:\'DM Sans\',sans-serif">💾 Save Changes</button>'
            +'<button onclick="acctEditId=null;render()" style="padding:9px 18px;border-radius:10px;border:1.5px solid #fde68a;background:#fffbeb;color:#92400e;font-size:13px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">✕ Cancel</button>'
            +'<div style="margin-left:auto;font-size:11px;color:#b45309;font-family:\'JetBrains Mono\',monospace;align-self:center">Source: <b>'+(rec.source||'manual')+'</b> · Created: '+(rec.createdAt?rec.createdAt.slice(0,10):'--')+'</div>'
          +'</div>'
        +'</div>';
      }
    }
    /* Records table with Edit buttons */
    var rows = records.slice().sort(function(a,b){return(b.date||'').localeCompare(a.date||'');}).slice(0,150).map(function(r){
      var isAuto = r.source==='auto';
      return '<tr>'
        +'<td style="font-size:11px;font-family:\'JetBrains Mono\',monospace">'+esc(r.date||'')+'</td>'
        +'<td style="font-size:11px">'+(isAuto?'<span style="padding:1px 6px;border-radius:10px;font-size:9px;font-weight:700;background:#dcfce7;color:#16a34a">AUTO</span>':'<span style="padding:1px 6px;border-radius:10px;font-size:9px;font-weight:700;background:#e0e8f9;color:#1433a8">MANUAL</span>')+'</td>'
        +'<td><span style="padding:2px 7px;border-radius:10px;font-size:10px;font-weight:700;background:'+colColor+'18;color:'+colColor+'">'+esc(r.category||'')+'</span></td>'
        +'<td style="font-size:12px;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+esc(r.description||'')+'">'+esc(r.description||'')+'</td>'
        +'<td style="font-family:\'JetBrains Mono\',monospace;font-weight:700;color:'+colColor+'">₹'+(r.amount||0).toLocaleString()+'</td>'
        +'<td>'+(isInc?esc(r.receipt||'--'):esc(r.vendor||'--'))+'</td>'
        +'<td style="white-space:nowrap">'
          +'<button onclick="acctEditId=\''+parseInt(r.id,10)+'\';acctAdvSection=\'edit\';render()" style="padding:3px 9px;border-radius:6px;border:1px solid #fde68a;background:#fffbeb;color:#d97706;font-size:11px;font-weight:700;cursor:pointer;margin-right:4px;font-family:\'DM Sans\',sans-serif">✏️ Edit</button>'
          +'<button onclick="acctAdvDeleteOne(\''+parseInt(r.id,10)+'\')" style="padding:3px 8px;border-radius:6px;border:1px solid #fca5a5;background:#fee2e2;color:#dc2626;font-size:11px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">🗑</button>'
        +'</td>'
      +'</tr>';
    }).join('');
    body+='<div class="card"><div class="card-head" style="gap:10px">'
      +'<span class="card-title">'+colColor+'</span>'
      +'<span class="card-title" style="color:'+colColor+'">'+(isInc?'📈 Income':'📉 Expenditure')+' Records -- Edit Mode</span>'
      +'<span style="margin-left:auto;font-size:11px;font-family:\'JetBrains Mono\',monospace;color:var(--muted)">'+records.length+' total records</span>'
    +'</div>'
    +'<div style="padding:10px 18px 6px;background:#fffbeb;border-bottom:1px solid #fde68a;font-size:12px;color:#92400e">ℹ️ Admins can edit any record. Auto-credited records (from fee collection) can also be modified here.</div>'
    +'<div style="overflow-x:auto"><table><thead><tr><th>Date</th><th>Source</th><th>Category</th><th>Description</th><th>Amount</th><th>'+(isInc?'Receipt':'Vendor')+'</th><th>Actions</th></tr></thead>'
    +'<tbody>'+(rows||'<tr><td colspan="7" style="padding:28px;text-align:center;color:var(--muted)">No records found.</td></tr>')+'</tbody></table></div></div>';
  }
  /* -- SECTION: BULK DELETE -- */
  else if(acctAdvSection==='bulkdelete'){
    body+='<div style="background:linear-gradient(135deg,#fff5f5,#fee2e2);border:2px solid #fca5a5;border-radius:14px;padding:20px 22px;margin-bottom:16px">'
      +'<div style="font-size:15px;font-weight:800;color:#991b1b;margin-bottom:6px">⚠️ Bulk Delete -- Irreversible Action</div>'
      +'<div style="font-size:12.5px;color:#7f1d1d;line-height:1.7;margin-bottom:16px">Select a record type and date range. ALL records in that range will be permanently deleted. This cannot be undone. Auto-credited fee records will also be removed.</div>'
      +'<div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end">'
        +'<div><label style="font-size:11px;font-weight:700;color:#991b1b;display:block;margin-bottom:4px">Record Type</label>'
          +'<select id="bulk-type" style="padding:8px 12px;border-radius:8px;border:1.5px solid #fca5a5;font-size:13px;background:#fff5f5" onchange="acctBulkTarget=this.value">'
            +'<option value="income">📈 Income</option>'
            +'<option value="expenditure">📉 Expenditure</option>'
          +'</select></div>'
        +'<div><label style="font-size:11px;font-weight:700;color:#991b1b;display:block;margin-bottom:4px">From Date</label><input id="bulk-from" type="date" onchange="acctBulkFrom=this.value" style="padding:8px 10px;border-radius:8px;border:1.5px solid #fca5a5;font-size:13px;background:#fff5f5"/></div>'
        +'<div><label style="font-size:11px;font-weight:700;color:#991b1b;display:block;margin-bottom:4px">To Date</label><input id="bulk-to" type="date" onchange="acctBulkTo=this.value" style="padding:8px 10px;border-radius:8px;border:1.5px solid #fca5a5;font-size:13px;background:#fff5f5"/></div>'
        +'<button onclick="acctBulkDelete()" style="padding:9px 22px;border-radius:10px;background:#dc2626;color:#fff;border:none;font-size:13px;font-weight:800;cursor:pointer;font-family:\'DM Sans\',sans-serif">🗑 Delete Range</button>'
        +'<button onclick="acctBulkDeleteAll()" style="padding:9px 22px;border-radius:10px;background:#991b1b;color:#fff;border:none;font-size:13px;font-weight:800;cursor:pointer;font-family:\'DM Sans\',sans-serif">💥 Delete ALL Selected Type</button>'
      +'</div>'
    +'</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">'
      +'<div class="card"><div class="card-head"><span class="card-title" style="color:#16a34a">📈 Income Summary</span></div><div style="padding:14px 18px">'
        +'<div style="font-size:28px;font-weight:800;color:#16a34a;font-family:\'Playfair Display\',serif">'+loadIncomeLedger().length+'</div>'
        +'<div style="font-size:12px;color:var(--muted)">Total income records</div>'
        +'<div style="font-size:16px;font-weight:800;color:#16a34a;margin-top:8px">₹'+loadIncomeLedger().reduce(function(s,r){return s+(r.amount||0);},0).toLocaleString()+'</div>'
        +'<div style="font-size:11px;color:var(--muted)">Total amount</div>'
      +'</div></div>'
      +'<div class="card"><div class="card-head"><span class="card-title" style="color:#dc2626">📉 Expenditure Summary</span></div><div style="padding:14px 18px">'
        +'<div style="font-size:28px;font-weight:800;color:#dc2626;font-family:\'Playfair Display\',serif">'+loadExpLedger().length+'</div>'
        +'<div style="font-size:12px;color:var(--muted)">Total expenditure records</div>'
        +'<div style="font-size:16px;font-weight:800;color:#dc2626;margin-top:8px">₹'+loadExpLedger().reduce(function(s,r){return s+(r.amount||0);},0).toLocaleString()+'</div>'
        +'<div style="font-size:11px;color:var(--muted)">Total amount</div>'
      +'</div></div>'
    +'</div>';
  }
  /* -- SECTION: CUSTOM CATEGORIES -- */
  else if(acctAdvSection==='categories'){
    var incCust=loadCustomCats('income');
    var expCust=loadCustomCats('expenditure');
    var defInc=['Monthly Fee','Admission Fee','Full Payment','Advance Fee','Items Provided','Donation','Other'];
    var defExp=['Salaries','Utilities (Electricity/Water)','Maintenance & Repair','Stationery & Supplies','Food & Provisions','Transport','Books & Materials','Equipment','Events & Functions','Miscellaneous'];
    body+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">';
    // Income categories card
    body+='<div class="card"><div class="card-head"><span class="card-title" style="color:#16a34a">📈 Income Categories</span></div>'
      +'<div style="padding:14px 18px">'
        +'<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px">Default Categories</div>'
        +'<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:14px">'
          +defInc.map(function(c){return'<span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:#dcfce7;color:#16a34a;border:1px solid #86efac">'+esc(c)+'</span>';}).join('')
        +'</div>'
        +'<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px">Custom Categories ('+(incCust.length)+')</div>'
        +'<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:12px">'
          +(incCust.length?incCust.map(function(c,i){return'<span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:#e0e8f9;color:#1433a8;border:1px solid #93c5fd;display:inline-flex;align-items:center;gap:5px">'+esc(c)+'<button onclick="acctRemoveCat(\'income\','+i+')" style="background:none;border:none;cursor:pointer;color:#dc2626;font-size:12px;line-height:1;padding:0">×</button></span>';}).join(''):'<span style="font-size:12px;color:var(--muted2);font-style:italic">No custom categories yet</span>')
        +'</div>'
        +'<div style="display:flex;gap:8px">'
          +'<input id="new-inc-cat" placeholder="New income category…" style="flex:1;padding:7px 10px;border-radius:8px;border:1.5px solid #86efac;font-size:12.5px"/>'
          +'<button onclick="acctAddCat(\'income\')" style="padding:7px 14px;border-radius:8px;background:#16a34a;color:#fff;border:none;font-weight:700;cursor:pointer;font-size:12.5px;font-family:\'DM Sans\',sans-serif">+ Add</button>'
        +'</div>'
      +'</div></div>';
    // Expenditure categories card
    body+='<div class="card"><div class="card-head"><span class="card-title" style="color:#dc2626">📉 Expenditure Categories</span></div>'
      +'<div style="padding:14px 18px">'
        +'<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px">Default Categories</div>'
        +'<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:14px">'
          +defExp.map(function(c){return'<span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:#fee2e2;color:#dc2626;border:1px solid #fca5a5">'+esc(c)+'</span>';}).join('')
        +'</div>'
        +'<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px">Custom Categories ('+(expCust.length)+')</div>'
        +'<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:12px">'
          +(expCust.length?expCust.map(function(c,i){return'<span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:#fff7ed;color:#c2410c;border:1px solid #fdba74;display:inline-flex;align-items:center;gap:5px">'+esc(c)+'<button onclick="acctRemoveCat(\'expenditure\','+i+')" style="background:none;border:none;cursor:pointer;color:#dc2626;font-size:12px;line-height:1;padding:0">×</button></span>';}).join(''):'<span style="font-size:12px;color:var(--muted2);font-style:italic">No custom categories yet</span>')
        +'</div>'
        +'<div style="display:flex;gap:8px">'
          +'<input id="new-exp-cat" placeholder="New expenditure category…" style="flex:1;padding:7px 10px;border-radius:8px;border:1.5px solid #fca5a5;font-size:12.5px"/>'
          +'<button onclick="acctAddCat(\'expenditure\')" style="padding:7px 14px;border-radius:8px;background:#dc2626;color:#fff;border:none;font-weight:700;cursor:pointer;font-size:12.5px;font-family:\'DM Sans\',sans-serif">+ Add</button>'
        +'</div>'
      +'</div></div>';
    body+='</div>';
  }
  /* -- SECTION: AUDIT LOG -- */
  else if(acctAdvSection==='auditlog'){
    body+='<div class="card">'
      +'<div class="card-head"><span class="card-title">📋 Session Audit Log</span><span style="font-size:11px;font-family:\'JetBrains Mono\',monospace;color:var(--muted)">Current session only · '+acctAuditLog.length+' entries</span>'
        +'<button onclick="acctAuditLog=[];render()" style="padding:4px 12px;border-radius:7px;border:1px solid #fca5a5;background:#fee2e2;color:#dc2626;font-size:11px;font-weight:700;cursor:pointer;margin-left:auto;font-family:\'DM Sans\',sans-serif">🗑 Clear Log</button>'
      +'</div>'
      +'<div style="padding:10px 16px 6px;background:#eff6ff;border-bottom:1px solid #93c5fd;font-size:12px;color:#1e40af">ℹ️ This log tracks all account record modifications made during this admin session. It resets when the page reloads.</div>'
      +'<div style="overflow-x:auto"><table><thead><tr><th>Timestamp</th><th>Admin</th><th>Action</th><th>Detail</th></tr></thead><tbody>'
      +(acctAuditLog.length
        ?acctAuditLog.map(function(e){
          return '<tr>'
            +'<td style="font-size:11px;font-family:\'JetBrains Mono\',monospace;white-space:nowrap">'+esc(e.ts)+'</td>'
            +'<td style="font-weight:700;font-size:12px">'+esc(e.user)+'</td>'
            +'<td><span style="padding:2px 8px;border-radius:10px;font-size:10.5px;font-weight:700;background:var(--accent-light);color:var(--accent)">'+esc(e.action)+'</span></td>'
            +'<td style="font-size:12px;color:var(--muted)">'+esc(e.detail)+'</td>'
          +'</tr>';
        }).join('')
        :'<tr><td colspan="4" style="padding:28px;text-align:center;color:var(--muted)">No audit entries yet. Edit or delete records to see the log.</td></tr>'
      )+'</tbody></table></div>'
    +'</div>';
  }
  /* -- SECTION: DATA RESET -- */
  else if(acctAdvSection==='reset'){
    body+='<div style="background:linear-gradient(135deg,#fff5f5,#fee2e2);border:2px solid #fca5a5;border-radius:14px;padding:22px 24px;margin-bottom:20px">'
      +'<div style="font-size:16px;font-weight:800;color:#991b1b;margin-bottom:8px">⚠️ Danger Zone -- Complete Data Wipe</div>'
      +'<div style="font-size:13px;color:#7f1d1d;line-height:1.8;margin-bottom:18px">These actions are <b>completely irreversible</b>. All financial data will be permanently deleted. There is no undo. Use with extreme caution.</div>'
      +'<div style="display:flex;flex-direction:column;gap:12px">'
        +'<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;background:rgba(255,255,255,.6);border-radius:10px;border:1px solid #fca5a5">'
          +'<div><div style="font-size:13px;font-weight:800;color:#7f1d1d">Reset All Income Records</div><div style="font-size:11.5px;color:#991b1b;margin-top:2px">Deletes all income ledger entries. Fee collections auto-credit history will also be wiped.</div></div>'
          +'<button onclick="acctResetIncome()" style="padding:9px 20px;border-radius:9px;background:#dc2626;color:#fff;border:none;font-size:12.5px;font-weight:800;cursor:pointer;font-family:\'DM Sans\',sans-serif;flex-shrink:0;margin-left:16px">🗑 Reset Income</button>'
        +'</div>'
        +'<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;background:rgba(255,255,255,.6);border-radius:10px;border:1px solid #fca5a5">'
          +'<div><div style="font-size:13px;font-weight:800;color:#7f1d1d">Reset All Expenditure Records</div><div style="font-size:11.5px;color:#991b1b;margin-top:2px">Deletes all expenditure ledger entries permanently.</div></div>'
          +'<button onclick="acctResetExp()" style="padding:9px 20px;border-radius:9px;background:#dc2626;color:#fff;border:none;font-size:12.5px;font-weight:800;cursor:pointer;font-family:\'DM Sans\',sans-serif;flex-shrink:0;margin-left:16px">🗑 Reset Expenditure</button>'
        +'</div>'
        +'<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;background:rgba(255,255,255,.6);border-radius:10px;border:1.5px solid #dc2626">'
          +'<div><div style="font-size:14px;font-weight:800;color:#7f1d1d">💥 FULL FINANCIAL RESET</div><div style="font-size:11.5px;color:#991b1b;margin-top:2px">Wipes ALL income, expenditure, custom categories, and audit log. Starts completely fresh.</div></div>'
          +'<button onclick="acctFullReset()" style="padding:9px 20px;border-radius:9px;background:#7f1d1d;color:#fff;border:none;font-size:12.5px;font-weight:800;cursor:pointer;font-family:\'DM Sans\',sans-serif;flex-shrink:0;margin-left:16px">💥 FULL RESET</button>'
        +'</div>'
      +'</div>'
    +'</div>'
    +'<div class="card" style="padding:16px 20px">'
      +'<div style="font-size:13px;font-weight:800;color:var(--text);margin-bottom:12px">📦 Data Backup Before Reset</div>'
      +'<div style="font-size:12.5px;color:var(--muted);margin-bottom:14px">Download all financial data as CSV before performing any reset. Recommended before any destructive action.</div>'
      +'<div style="display:flex;gap:10px;flex-wrap:wrap">'
        +'<button onclick="feeExportIncome()" style="padding:9px 18px;border-radius:10px;background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;border:none;font-size:12.5px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">⬇ Export Income CSV</button>'
        +'<button onclick="feeExportExp()" style="padding:9px 18px;border-radius:10px;background:linear-gradient(135deg,#dc2626,#b91c1c);color:#fff;border:none;font-size:12.5px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">⬇ Export Expenditure CSV</button>'
        +'<button onclick="feeExportIE()" style="padding:9px 18px;border-radius:10px;background:linear-gradient(135deg,#1433a8,#0c2275);color:#fff;border:none;font-size:12.5px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">⬇ Export Full I&E CSV</button>'
      +'</div>'
    +'</div>';
  }
  return subnav+body;
}
/* -- Advanced: Save edit -- */
function acctSaveEdit(){
  if(!acctEditId)return;
  var isInc=acctEditTarget==='income';
  var records=isInc?loadIncomeLedger():loadExpLedger();
  var idx=records.findIndex(function(r){return r.id===acctEditId;});
  if(idx===-1){alert('Record not found.');return;}
  var old=records[idx];
  var date=((document.getElementById('adv-edit-date')||{}).value||old.date);
  var cat=((document.getElementById('adv-edit-cat')||{}).value||old.category);
  var amt=parseFloat((document.getElementById('adv-edit-amt')||{}).value||old.amount)||0;
  var desc=((document.getElementById('adv-edit-desc')||{}).value||old.description||'').trim();
  var ref=(document.getElementById('adv-edit-ref')||{}).value||'';
  if(!desc||!amt){alert('Description and amount are required.');return;}
  records[idx]=Object.assign({},old,{
    date:date,category:cat,amount:amt,description:desc,
    modifiedAt:new Date().toISOString(),
    modifiedBy:(currentUser&&currentUser.name)||'Admin'
  });
  if(isInc) records[idx].receipt=ref; else records[idx].vendor=ref;
  if(isInc) saveIncomeLedger(records); else saveExpLedger(records);
  acctAudit('EDIT '+(isInc?'INCOME':'EXPENSE'), 'ID:'+acctEditId+' | ₹'+old.amount+'→₹'+amt+' | '+old.category+'→'+cat);
  acctEditId=null;
  showToast('✅ Record updated successfully','#16a34a');
  render();
}
/* -- Advanced: Delete one from edit view -- */
function acctAdvDeleteOne(id){
  var isInc=acctEditTarget==='income';
  if(isInc&&(!currentUser||currentUser.role!=='admin')){showToast('🔒 Only admin can delete income records','#dc2626');return;}
  if(!confirm('Permanently delete this '+(isInc?'income':'expenditure')+' record? This cannot be undone.'))return;
  if(isInc){
    var r=loadIncomeLedger();var rec=r.find(function(x){return x.id===id;});
    saveIncomeLedger(r.filter(function(x){return x.id!==id;}));
    acctAudit('DELETE INCOME','ID:'+id+(rec?' | ₹'+rec.amount+' | '+rec.description:''));
  } else {
    var r=loadExpLedger();var rec=r.find(function(x){return x.id===id;});
    saveExpLedger(r.filter(function(x){return x.id!==id;}));
    acctAudit('DELETE EXPENSE','ID:'+id+(rec?' | ₹'+rec.amount+' | '+rec.description:''));
  }
  if(acctEditId===id)acctEditId=null;
  showToast('🗑 Record deleted','#dc2626');render();
}
/* -- Advanced: Bulk delete by date range -- */
function acctBulkDelete(){
  var type=(document.getElementById('bulk-type')||{}).value||acctBulkTarget;
  var from=(document.getElementById('bulk-from')||{}).value||'';
  var to=(document.getElementById('bulk-to')||{}).value||'';
  if(!from||!to){alert('Please select both From and To dates.');return;}
  if(from>to){alert('From date must be before To date.');return;}
  var isInc=type==='income';
  var records=isInc?loadIncomeLedger():loadExpLedger();
  var toDelete=records.filter(function(r){return r.date>=from&&r.date<=to;});
  if(toDelete.length===0){showToast('No records found in selected date range','#d97706');return;}
  if(!confirm('This will permanently delete '+toDelete.length+' '+(isInc?'income':'expenditure')+' record(s) from '+from+' to '+to+'. Proceed?'))return;
  var kept=records.filter(function(r){return!(r.date>=from&&r.date<=to);});
  if(isInc){
    if(!currentUser||currentUser.role!=='admin'){showToast('🔒 Only admin can delete income records','#dc2626');return;}
    saveIncomeLedger(kept);
    gnsiMarkLocalSave(20000); // 20s guard -- allows Supabase async deletes to commit before next fetch
    gnsiLogFeeMonitor({type:'ADMIN_BULK_DELETE_INCOME',count:toDelete.length,from:from,to:to,totalAmount:toDelete.reduce(function(s,r){return s+(r.amount||0);},0),adminName:(currentUser&&currentUser.name)||'Admin'});
  } else { saveExpLedger(kept); gnsiMarkLocalSave(20000); }
  acctAudit('BULK DELETE '+(isInc?'INCOME':'EXPENSE'),toDelete.length+' records from '+from+' to '+to+' | Total ₹'+toDelete.reduce(function(s,r){return s+(r.amount||0);},0).toLocaleString());
  showToast('🗑 Deleted '+toDelete.length+' records','#dc2626');render();
}
/* -- Advanced: Delete ALL of selected type -- */
function acctBulkDeleteAll(){
  var type=(document.getElementById('bulk-type')||{}).value||acctBulkTarget;
  var isInc=type==='income';
  var records=isInc?loadIncomeLedger():loadExpLedger();
  if(records.length===0){showToast('No records to delete','#d97706');return;}
  if(!confirm('⚠️ DANGER: This will permanently delete ALL '+records.length+' '+(isInc?'income':'expenditure')+' records. This CANNOT be undone.\n\nType "DELETE ALL" to confirm, then click OK.'))return;
  var conf=prompt('Type DELETE ALL to confirm:');
  if(conf!=='DELETE ALL'){showToast('Cancelled -- confirmation text did not match','#d97706');return;}
  var total=records.reduce(function(s,r){return s+(r.amount||0);},0);
  if(isInc){
    if(!currentUser||currentUser.role!=='admin'){showToast('🔒 Only admin can delete income records','#dc2626');return;}
    saveIncomeLedger([]);
    gnsiMarkLocalSave(20000); // 20s guard -- allows Supabase async deletes to commit before next fetch
    gnsiLogFeeMonitor({type:'ADMIN_WIPE_ALL_INCOME',count:records.length,totalAmount:total,adminName:(currentUser&&currentUser.name)||'Admin'});
  } else { saveExpLedger([]); gnsiMarkLocalSave(20000); }
  acctAudit('WIPE '+(isInc?'INCOME':'EXPENSE'),records.length+' records wiped | ₹'+total.toLocaleString());
  showToast('💥 All '+(isInc?'income':'expenditure')+' records deleted','#dc2626');render();
}
/* -- Advanced: Custom categories -- */
function acctAddCat(type){
  var inp=document.getElementById('new-'+type.slice(0,3)+'-cat');
  if(!inp)return;
  var val=(inp.value||'').trim();
  if(!val){alert('Enter a category name.');return;}
  var arr=loadCustomCats(type);
  if(arr.indexOf(val)!==-1){alert('Category already exists.');return;}
  arr.push(val);
  saveCustomCats(type,arr);
  acctAudit('ADD CATEGORY',type.toUpperCase()+': '+val);
  inp.value='';
  showToast('✅ Category "'+val+'" added','#16a34a');render();
}
function acctRemoveCat(type,idx){
  var arr=loadCustomCats(type);
  var removed=arr[idx];
  arr.splice(idx,1);
  saveCustomCats(type,arr);
  acctAudit('REMOVE CATEGORY',type.toUpperCase()+': '+removed);
  showToast('🗑 Category removed','#dc2626');render();
}
/* -- Advanced: Data resets -- */
function acctResetIncome(){
  var _gnsiAllowed=['admin'];
  if(!currentUser||_gnsiAllowed.indexOf(currentUser.role)<0){
    if(typeof showToast==='function')showToast('🔒 Access denied: Reset income ledger','#dc2626');
    return;
  }

  if(!confirm('Reset ALL income records? This is irreversible.'))return;
  var conf=prompt('Type RESET INCOME to confirm:');
  if(conf!=='RESET INCOME'){showToast('Cancelled','#d97706');return;}
  var n=loadIncomeLedger().length;
  saveIncomeLedger([]);
  gnsiMarkLocalSave(20000); // 20s guard -- allows Supabase async deletes to commit before next fetch
  acctAudit('RESET INCOME',n+' records wiped');
  showToast('🗑 All income records reset','#dc2626');render();
}
function acctResetExp(){
  if(!confirm('Reset ALL expenditure records? This is irreversible.'))return;
  var conf=prompt('Type RESET EXP to confirm:');
  if(conf!=='RESET EXP'){showToast('Cancelled','#d97706');return;}
  var n=loadExpLedger().length;
  saveExpLedger([]);
  gnsiMarkLocalSave(20000); // 20s guard -- allows Supabase async deletes to commit before next fetch
  acctAudit('RESET EXPENDITURE',n+' records wiped');
  showToast('🗑 All expenditure records reset','#dc2626');render();
}
function acctFullReset(){
  if(!confirm('⚠️ FULL FINANCIAL RESET -- ALL income, expenditure, and custom categories will be wiped. This is completely irreversible.\n\nAre you absolutely sure?'))return;
  var conf=prompt('Type FULL RESET to confirm:');
  if(conf!=='FULL RESET'){showToast('Cancelled','#d97706');return;}
  var ni=loadIncomeLedger().length,ne=loadExpLedger().length;
  saveIncomeLedger([]);saveExpLedger([]);
  gnsiMarkLocalSave(20000); // 20s guard -- allows Supabase async deletes to commit before next fetch
  localStorage.removeItem('gnsi_acct_cats_income');
  localStorage.removeItem('gnsi_acct_cats_expenditure');
  acctAuditLog=[];
  acctAudit('FULL RESET','Income:'+ni+' | Expense:'+ne+' records wiped');
  showToast('💥 Full financial reset complete','#991b1b');render();
}
function feePrintIEReport(){printMonthlyReport(new Date().toISOString().slice(0,8)+'01',new Date().toISOString().split('T')[0]);}
function feeExportIE(){
  showToast('⏳ Preparing Income-Expense CSV…','#2563eb');

  var incRecs=loadIncomeLedger();var expRecs=loadExpLedger();
  var totalIncome=incRecs.reduce(function(s,r){return s+(r.amount||0);},0);
  var totalExp=expRecs.reduce(function(s,r){return s+(r.amount||0);},0);
  var incRows=[['Date','Category','Description','Amount(Income)','Amount(Expenditure)']];
  incRecs.forEach(function(r){incRows.push([r.date||'',r.category||'',r.description||'',r.amount||0,'']);});
  expRecs.forEach(function(r){incRows.push([r.date||'',r.category||'',r.description||'','',r.amount||0]);});
  incRows.push(['','','TOTAL',totalIncome,totalExp]);
  incRows.push(['','','SURPLUS/DEFICIT',totalIncome-totalExp,'']);
    showToast('✅ Income-Expense CSV ready — '+(incRecs.length)+' rows','#16a34a');
  downloadCSV('GNSI_Income_Expenditure.csv',incRows);
}
function feeExportMonth(){
  showToast('⏳ Preparing Monthly Fee CSV…','#2563eb');

  var r=loadMonthlyRecords();
  var rows=[['Date','Student','Course','For Month','Tuition','Hostel','Total','Receipt']];
  r.forEach(function(x){rows.push([x.date||'',x.student||'',x.course||'',x.forMonth||'',x.tuitionFee||0,x.hostelFee||0,x.amountPaid||0,x.receipt||'']);});
    showToast('✅ Monthly Fee CSV ready — '+(r.length)+' rows','#16a34a');
  downloadCSV('GNSI_Monthly_Fees.csv',rows);
}
/* --- SETTINGS PAGE (password change + user management) --------*/
function renderPayments(){
  /* FIX #8: All non-admin users directed to Fee Management */ 
  if(currentUser && (currentUser.role==='accounts'||currentUser.role==='manager')){
    return '<div class="page-header"><div class="page-header-title">💳 Payments</div></div>'      +'<div style="background:#e0e8f9;border:1.5px solid #1433a8;border-radius:12px;padding:24px;text-align:center">'      +'<div style="font-size:36px;margin-bottom:12px">💳</div>'      +'<div style="font-weight:800;font-size:16px;color:#1433a8;margin-bottom:8px">Use Fee Management for all fee work</div>'      +'<div style="font-size:13px;color:#1e40af;margin-bottom:16px">Online transactions, dues, receipts and collection are all in one place.</div>'      +'<button onclick="navigate(\'fees\')" style="padding:10px 24px;background:#1433a8;color:#fff;border:none;border-radius:9px;font-size:14px;font-weight:700;cursor:pointer">→ Go to Fee Management</button>'      +'</div>';
  }
  var isAdm=currentUser&&(currentUser.role==='admin'||currentUser.role==='manager');
  var txns=gnsiLoad('gnsi_payment_txns')||[];
  var payCfg=gnsiLoad('gnsi_pay_config')||{};
  var filtered=txns.filter(function(t){
    var q=_paySearch.toLowerCase();
    var stOk=_payFilter==='all'||t.status===_payFilter;
    return stOk&&(!q||(t.student||'').toLowerCase().includes(q)||(t.txnRef||'').toLowerCase().includes(q));
  }).sort(function(a,b){return(b.date||'').localeCompare(a.date||'');});
  var total=txns.filter(function(t){return t.status==='Success';}).reduce(function(acc,t){return acc+(parseFloat(t.amount)||0);},0);
  var rows=filtered.map(function(t){
    var stCol=t.status==='Success'?'#16a34a':t.status==='Failed'?'#dc2626':'#c9870a';
    return'<tr>'
      +'<td>'+esc(t.date||'\u2014')+'</td>'
      +'<td><b>'+esc(t.student||'\u2014')+'</b></td>'
      +'<td>'+esc(t.description||'\u2014')+'</td>'
      +'<td style="text-align:right;font-weight:700">\u20b9'+(t.amount?Number(t.amount).toLocaleString('en-IN'):'\u2014')+'</td>'
      +'<td>'+esc(t.txnRef||'\u2014')+'</td>'
      +'<td><span style="color:'+stCol+';font-weight:700;font-size:11px">'+esc(t.status||'Pending')+'</span></td>'
      +(isAdm?'<td><button onclick="gnsiDelPayTxn(\''+t.id+'\')" style="background:#fef2f2;color:#dc2626;border:none;border-radius:6px;padding:3px 9px;cursor:pointer;font-size:11px;font-weight:700">\ud83d\uddd1\ufe0f</button></td>':'')
      +'</tr>';
  }).join('');
  var cfgStatus=payCfg.keyId
    ?'<span style="color:#16a34a;font-weight:700">\u2705 Configured ('+esc(payCfg.provider||'razorpay')+')</span>'
    :'<span style="color:#dc2626;font-weight:700">\u26a0\ufe0f Not configured \u2014 set up in Admin Centre</span>';
  return'<div class="card" style="margin-bottom:12px">'
    +'<div style="display:flex;gap:12px;padding:16px 20px;flex-wrap:wrap">'
    +'<div style="flex:1;background:#f0fdf4;border-radius:10px;padding:12px 16px;min-width:130px"><div style="font-size:11px;color:var(--muted)">Total Collected</div><div style="font-size:22px;font-weight:800;color:#16a34a">\u20b9'+total.toLocaleString('en-IN')+'</div></div>'
    +'<div style="flex:1;background:var(--accent-light);border-radius:10px;padding:12px 16px;min-width:130px"><div style="font-size:11px;color:var(--muted)">Total Txns</div><div style="font-size:22px;font-weight:800;color:var(--accent)">'+txns.length+'</div></div>'
    +'<div style="flex:1;background:#fef2f2;border-radius:10px;padding:12px 16px;min-width:130px"><div style="font-size:11px;color:var(--muted)">Failed</div><div style="font-size:22px;font-weight:800;color:#dc2626">'+txns.filter(function(t){return t.status==='Failed';}).length+'</div></div>'
    +'</div>'
    +'<div style="padding:0 16px 10px;font-size:13px">Gateway: '+cfgStatus+'</div>'
    +'<div class="card-head" style="border-top:1px solid var(--border)"><span class="card-title">\ud83d\udcb3 Payment Transactions</span>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
    +'<button onclick="gnsiPayPrint()" class="btn btn-outline" style="font-size:12px">\ud83d\udda8 Print</button>'
    +'<button onclick="gnsiPayExport()" class="btn btn-outline" style="font-size:12px">\u2b07 Excel</button>'
    +(isAdm?'<button onclick="gnsiAddManualPayTxn()" class="btn btn-primary">+ Manual Txn</button>':'')
    +'</div>'
    +'<div style="padding:10px 16px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">'
    +'<div style="display:flex;gap:6px">'+['all','Success','Pending','Failed'].map(function(s){return'<button onclick="_payFilter=\''+s+'\';render()" style="border-radius:20px;padding:4px 12px;font-size:11px;font-weight:700;cursor:pointer;border:1.5px solid var(--accent);background:'+(_payFilter===s?'var(--accent)':'transparent')+';color:'+(_payFilter===s?'#fff':'var(--accent)')+';margin:1px">'+s+'</button>';}).join('')+'</div>'
    +'<div class="search-wrap" style="flex:1;min-width:180px"><span class="search-icon">\ud83d\udd0d</span><input placeholder="Search student, txn ref..." value="'+esc(_paySearch)+'" oninput="_paySearch=this.value;_debouncedRenderPay()" style="width:100%"/></div>'
    +'</div>'
    +'<div style="overflow-x:auto"><table><thead><tr><th>Date</th><th>Student</th><th>Description</th><th>Amount</th><th>Txn Ref</th><th>Status</th>'+(isAdm?'<th>Del</th>':'')+'</tr></thead>'
    +'<tbody>'+(rows||'<tr><td colspan="7" style="padding:40px;text-align:center;color:var(--muted)">No payment transactions found.</td></tr>')+'</tbody></table></div></div>';
}
function gnsiPayPrint(){
  var txns=(gnsiLoad('gnsi_payment_txns')||[]).sort(function(a,b){return(b.date||'').localeCompare(a.date||'');});
  var total=txns.filter(function(t){return t.status==='Success';}).reduce(function(a,t){return a+(parseFloat(t.amount)||0);},0);
  var rows=txns.map(function(t,i){
    var c=t.status==='Success'?'#16a34a':t.status==='Failed'?'#dc2626':'#c9870a';
    return '<tr><td style="text-align:center">'+(i+1)+'</td><td>'+esc(t.date||'—')+'</td>'
      +'<td><b>'+esc(t.student||'—')+'</b></td><td>'+esc(t.description||'—')+'</td>'
      +'<td style="text-align:right;font-weight:700">₹'+(t.amount?Number(t.amount).toLocaleString('en-IN'):'—')+'</td>'
      +'<td>'+esc(t.txnRef||'—')+'</td>'
      +'<td style="color:'+c+';font-weight:700">'+esc(t.status||'Pending')+'</td>'
      +'<td>'+esc(t.method||'—')+'</td></tr>';
  }).join('');
  var body='<div class="gnsi-pg-hdr"><div class="gnsi-inst">'+(window.TENANT?window.TENANT.name+' · '+window.TENANT.city:'Guidance Navodaya & Sainik Institute · Khangabok')+'</div>'
    +'<div class="gnsi-pg-title">💳 Payment Transactions</div>'
    +'<div class="gnsi-pg-sub">Printed: '+new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})
    +' · Total Collected: ₹'+total.toLocaleString('en-IN')+'</div></div>'
    +'<table><thead><tr><th style="width:26px">#</th><th style="width:80px">Date</th><th>Student</th><th>Description</th>'
    +'<th style="width:75px;text-align:right">Amount</th><th style="width:110px">Txn Ref</th>'
    +'<th style="width:70px">Status</th><th style="width:70px">Method</th></tr></thead><tbody>'+rows+'</tbody></table>';
  gnsiPrintWindow('Payment Transactions — GNSI', body, false);
}
function gnsiPayExport(){
  showToast('⏳ Preparing Payments Excel…','#2563eb');

  var txns=(gnsiLoad('gnsi_payment_txns')||[]).sort(function(a,b){return(b.date||'').localeCompare(a.date||'');});
  var total=txns.filter(function(t){return t.status==='Success';}).reduce(function(a,t){return a+(parseFloat(t.amount)||0);},0);
  var rows=[['GNSI — Payment Transactions'],['Exported: '+new Date().toLocaleString('en-IN'),'Total Collected: ₹'+total.toLocaleString('en-IN')],[]
    ,['#','Date','Student','Description','Amount (₹)','Txn Reference','Status','Method']];
  txns.forEach(function(t,i){rows.push([i+1,t.date||'',t.student||'',t.description||'',t.amount||0,t.txnRef||'',t.status||'',t.method||'']);});
    showToast('✅ Payments Excel ready — '+(txns.length)+' rows','#16a34a');
  gnsiExportExcel('Payments_'+new Date().toISOString().slice(0,10)+'.xlsx',[{name:'Payments',rows:rows,cols:[{wch:4},{wch:12},{wch:22},{wch:28},{wch:12},{wch:18},{wch:10},{wch:12}]}]);
}
function gnsiAddManualPayTxn(){
  var stu=prompt('Student name:');if(!stu||!stu.trim())return;
  var desc=prompt('Description (e.g. Monthly Fee):');if(!desc)return;
  var amt=prompt('Amount (\u20b9):');if(!amt||isNaN(parseFloat(amt)))return;
  var ref=prompt('Txn Ref No. (optional):','MANUAL-'+Date.now())||('MANUAL-'+Date.now());
  var txns=gnsiLoad('gnsi_payment_txns')||[];
  txns.push({id:Date.now(),date:new Date().toISOString().split('T')[0],student:stu.trim(),description:desc.trim(),amount:parseFloat(amt),txnRef:ref.trim(),status:'Success',addedBy:currentUser?currentUser.name:'',addedAt:new Date().toISOString()});
  gnsiSave('gnsi_payment_txns',txns);render();showToast('Transaction added','#16a34a');
}
function gnsiDelPayTxn(id){
  if(!confirm('Delete this transaction?'))return;
  gnsiSave('gnsi_payment_txns',(gnsiLoad('gnsi_payment_txns')||[]).filter(function(x){return x.id!==id;}));render();showToast('Deleted','#64748b');
}
/* ══════════════════════════════════════════════════════════════
   █  COURSE MANAGEMENT
   ══════════════════════════════════════════════════════════════ */
var _cmEdit=null;
function _cmLoad(){return gnsiLoad('gnsi_course_defs')||[
  {id:1,name:'Sainik',code:'SAI',desc:'Sainik School Entrance Preparation',duration:'1 Year',subjects:['Mathematics','English','GK','Reasoning'],fee:0,active:true},
  {id:2,name:'Navodaya',code:'NAV',desc:'Jawahar Navodaya Vidyalaya Entrance Preparation',duration:'1 Year',subjects:['Mathematics','English','Hindi','Mental Ability'],fee:0,active:true},
  {id:3,name:'Foundation',code:'FND',desc:'Foundation Course for younger students',duration:'6 Months',subjects:['Mathematics','English','General Studies'],fee:0,active:true},
];}
function _cmSave(d){gnsiSave('gnsi_course_defs',d);}
function renderCourseManagement(){
  var isAdm=currentUser&&(currentUser.role==='admin'||currentUser.role==='manager');
  var courses=_cmLoad();
  if(_cmEdit!==null){
    var r=_cmEdit==='new'?{}:courses.find(function(x){return x.id===_cmEdit;})||{};
    var subjStr=Array.isArray(r.subjects)?r.subjects.join(', '):(r.subjects||'');
    return'<button onclick="_cmEdit=null;render()" class="btn btn-outline" style="margin-bottom:16px">\u2190 Back</button>'
      +'<div class="card"><div class="card-head"><span class="card-title">\ud83d\udcd6 '+(_cmEdit==='new'?'New Course':'Edit Course')+'</span></div>'
      +'<div style="padding:20px"><div class="form-grid g2">'
      +'<div class="form-group"><label>Course Name *</label><input id="cm-name" value="'+esc(r.name||'')+'" placeholder="e.g. Sainik, Navodaya"/></div>'
      +'<div class="form-group"><label>Short Code</label><input id="cm-code" value="'+esc(r.code||'')+'" placeholder="e.g. SAI, NAV"/></div>'
      +'<div class="form-group" style="grid-column:1/-1"><label>Description</label><input id="cm-desc" value="'+esc(r.desc||'')+'" placeholder="Course description"/></div>'
      +'<div class="form-group"><label>Duration</label><input id="cm-dur" value="'+esc(r.duration||'')+'" placeholder="e.g. 1 Year, 6 Months"/></div>'
      +'<div class="form-group"><label>Annual Fee (\u20b9)</label><input id="cm-fee" type="number" value="'+esc(String(r.fee||0))+'" placeholder="0"/></div>'
      +'<div class="form-group" style="grid-column:1/-1"><label>Subjects (comma-separated)</label><input id="cm-subj" value="'+esc(subjStr)+'" placeholder="Mathematics, English, GK..."/></div>'
      +'<div class="form-group"><label>Status</label><select id="cm-active" style="width:100%;padding:9px;border:1.5px solid var(--border);border-radius:9px;font-size:13px"><option value="1"'+(r.active||r.active===undefined?' selected':'')+'>Active</option><option value="0"'+(!r.active&&r.active!==undefined?' selected':'')+'>Inactive</option></select></div>'
      +'</div><button class="btn btn-primary" onclick="gnsiSaveCM()" style="margin-top:14px">\ud83d\udcbe Save Course</button>'
      +'</div></div>';
  }
  var cards=courses.map(function(c){
    var stuCount=(typeof students!=='undefined'?students:[]).filter(function(s){return(s.course||'').toLowerCase()===(c.name||'').toLowerCase();}).length;
    return'<div style="background:var(--surface);border:1.5px solid var(--border);border-radius:14px;padding:18px;display:flex;flex-direction:column;gap:8px">'
      +'<div style="display:flex;align-items:center;justify-content:space-between">'
      +'<div><span style="background:var(--accent);color:#fff;border-radius:8px;padding:3px 10px;font-size:11px;font-weight:700;margin-right:8px">'+esc(c.code||'')+'</span>'
      +'<span style="font-size:16px;font-weight:800;color:var(--text)">'+esc(c.name||'')+'</span></div>'
      +'<span style="background:'+(c.active?'#f0fdf4':'#fef2f2')+';color:'+(c.active?'#16a34a':'#dc2626')+';border-radius:20px;padding:2px 10px;font-size:11px;font-weight:700">'+(c.active?'Active':'Inactive')+'</span>'
      +'</div>'
      +(c.desc?'<div style="font-size:13px;color:var(--muted)">'+esc(c.desc)+'</div>':'')
      +'<div style="display:flex;gap:16px;font-size:12.5px;flex-wrap:wrap">'
      +'<span>\u23f1 '+esc(c.duration||'\u2014')+'</span>'
      +'<span>\ud83d\udcb0 \u20b9'+(c.fee?Number(c.fee).toLocaleString('en-IN'):'0')+'/yr</span>'
      +'<span>\ud83d\udc68\u200d\ud83c\udf93 '+stuCount+' students</span>'
      +'</div>'
      +(c.subjects&&c.subjects.length?'<div style="font-size:12px;color:var(--muted)">\ud83d\udcda '+(Array.isArray(c.subjects)?c.subjects.join(' \u00b7 '):esc(c.subjects))+'</div>':'')
      +(isAdm?'<div style="display:flex;gap:8px;margin-top:4px">'
        +'<button onclick="_cmEdit=\''+c.id+'\';render()" style="background:var(--accent-light);color:var(--accent);border:1px solid var(--accent);border-radius:8px;padding:4px 12px;cursor:pointer;font-size:12px;font-weight:700">\u270f\ufe0f Edit</button>'
        +'<button onclick="gnsiDelCM(\''+c.id+'\')" style="background:#fef2f2;color:#dc2626;border:1px solid #fca5a5;border-radius:8px;padding:4px 12px;cursor:pointer;font-size:12px;font-weight:700">\ud83d\uddd1\ufe0f Delete</button></div>':'')
      +'</div>';
  }).join('');
  return'<div class="card"><div class="card-head"><span class="card-title">\ud83d\udcd6 Course Management</span>'
    +(isAdm?'<button onclick="_cmEdit=\'new\';render()" class="btn btn-primary">+ New Course</button>':'')
    +'</div>'
    +'<div style="padding:16px;display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px">'
    +(cards||'<div style="grid-column:1/-1;padding:40px;text-align:center;color:var(--muted)">No courses defined.</div>')
    +'</div></div>';
}
function gnsiCMPrint(){
  var courses=_cmLoad();
  var rows=courses.map(function(c,i){
    var stuCount=(typeof students!=='undefined'?students:[]).filter(function(s){return(s.course||'').toLowerCase()===(c.name||'').toLowerCase();}).length;
    var subList=Array.isArray(c.subjects)?c.subjects.join(', '):(c.subjects||'');
    return '<tr><td style="text-align:center">'+(i+1)+'</td>'
      +'<td><b>'+esc(c.name||'—')+'</b></td><td>'+esc(c.code||'—')+'</td>'
      +'<td>'+esc(c.duration||'—')+'</td>'
      +'<td style="text-align:right">₹'+(c.fee?Number(c.fee).toLocaleString('en-IN'):'—')+'</td>'
      +'<td style="text-align:center">'+stuCount+'</td>'
      +'<td>'+(c.active!==false?'Active':'Inactive')+'</td>'
      +'<td>'+esc(subList)+'</td></tr>';
  }).join('');
  var body='<div class="gnsi-pg-hdr"><div class="gnsi-inst">'+(window.TENANT?window.TENANT.name+' · '+window.TENANT.city:'Guidance Navodaya & Sainik Institute · Khangabok')+'</div>'
    +'<div class="gnsi-pg-title">📖 Course Catalogue</div>'
    +'<div class="gnsi-pg-sub">Printed: '+new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})+' · Courses: '+courses.length+'</div></div>'
    +'<table><thead><tr><th style="width:26px">#</th><th>Course Name</th><th style="width:55px">Code</th>'
    +'<th style="width:70px">Duration</th><th style="width:70px;text-align:right">Annual Fee</th>'
    +'<th style="width:55px;text-align:center">Students</th><th style="width:55px">Status</th><th>Subjects</th></tr></thead><tbody>'+rows+'</tbody></table>';
  gnsiPrintWindow('Course Catalogue — GNSI', body, false);
}
function gnsiCMExport(){
  showToast('⏳ Preparing Course Mgmt CSV…','#2563eb');

  var courses=_cmLoad();
  var rows=[['GNSI — Course Management'],['Exported: '+new Date().toLocaleString('en-IN')],[]
    ,['#','Course Name','Code','Description','Duration','Annual Fee (₹)','Students','Status','Subjects']];
  courses.forEach(function(c,i){
    var stuCount=(typeof students!=='undefined'?students:[]).filter(function(s){return(s.course||'').toLowerCase()===(c.name||'').toLowerCase();}).length;
    var subList=Array.isArray(c.subjects)?c.subjects.join(', '):(c.subjects||'');
    rows.push([i+1,c.name||'',c.code||'',c.desc||'',c.duration||'',c.fee||0,stuCount,c.active!==false?'Active':'Inactive',subList]);
  });
    showToast('✅ Course Mgmt CSV ready — '+(courses.length)+' rows','#16a34a');
  gnsiExportExcel('Courses_'+new Date().toISOString().slice(0,10)+'.xlsx',[{name:'Courses',rows:rows,cols:[{wch:4},{wch:20},{wch:8},{wch:25},{wch:12},{wch:12},{wch:10},{wch:10},{wch:40}]}]);
}
function gnsiSaveCM(){
  var courses=_cmLoad();
  var name=((document.getElementById('cm-name')||{}).value||'');
  if(!name.trim()){showToast('Course name required','#dc2626');return;}
  var subjRaw=((document.getElementById('cm-subj')||{}).value||'');
  var subjs=subjRaw.split(',').map(function(s){return s.trim();}).filter(Boolean);
  var rec={
    id:_cmEdit==='new'?Date.now():_cmEdit,
    name:name.trim(),
    code:(((document.getElementById('cm-code')||{}).value||'').trim()),
    desc:(((document.getElementById('cm-desc')||{}).value||'').trim()),
    duration:(((document.getElementById('cm-dur')||{}).value||'').trim()),
    fee:parseFloat((document.getElementById('cm-fee')||{}).value)||0,
    subjects:subjs,
    active:((document.getElementById('cm-active')||{}).value==='1'),
    savedBy:currentUser?currentUser.name:'',savedAt:new Date().toISOString()
  };
  if(_cmEdit==='new'){courses.push(rec);}else{var idx=courses.findIndex(function(x){return x.id===_cmEdit;});if(idx>=0)courses[idx]=rec;else courses.push(rec);}
  _cmSave(courses);_cmEdit=null;render();showToast('Course saved','#16a34a');
}
function gnsiDelCM(id){
  if(!confirm('Delete this course?'))return;
  _cmSave(_cmLoad().filter(function(x){return x.id!==id;}));render();showToast('Course deleted','#64748b');
}
/* ══════════════════════════════════════════════════════════════
   █  STUDENT FEE ASSIGNMENT
   ══════════════════════════════════════════════════════════════ */
var _sfaSearch='',_sfaClassFilter='all',_sfaEditId=null;
function _sfaLoad(){
  /* Read from canonical key first, fall back to legacy keys */
  return gnsiLoad('gnsi_fee_asgns') || gnsiLoad('gnsi_sfa_assignments') || gnsiLoad('gnsi_student_fee_asgns') || [];
}
function _sfaSave(d){
  /* Write to ALL three keys so old and new code always sees the same data */
  gnsiSave('gnsi_fee_asgns', d);
  gnsiSave('gnsi_sfa_assignments', d);
  gnsiSave('gnsi_student_fee_asgns', d);
}
function renderStudentFeeAssignment(){
  /* Accounts users: use Fee Management Centre */
  if(currentUser && currentUser.role==='accounts'){
    return '<div class="page-header"><div class="page-header-title">📋 Fee Assignment</div></div>'      +'<div style="background:#e0e8f9;border:1.5px solid #1433a8;border-radius:12px;padding:24px;text-align:center">'      +'<div style="font-size:36px;margin-bottom:12px">📋</div>'      +'<div style="font-weight:800;font-size:16px;color:#1433a8;margin-bottom:8px">Use Fee Management for student fee assignments</div>'      +'<div style="font-size:13px;color:#1e40af;margin-bottom:16px">Add students, assign fee groups, and collect fees all from one place.</div>'      +'<button onclick="navigate(\'fees\')" style="padding:10px 24px;background:#1433a8;color:#fff;border:none;border-radius:9px;font-size:14px;font-weight:700;cursor:pointer">→ Go to Fee Management</button>'      +'</div>';
  }
  var isAdm=currentUser&&(currentUser.role==='admin'||currentUser.role==='manager');
  var asgns=_sfaLoad();
  var FEE_TYPES=['Monthly Fee','Full Payment','Admission Fee','Advance','Items','Manual'];
  var MONTHS=['April','May','June','July','August','September','October','November','December','January','February','March'];
  if(_sfaEditId!==null){
    var existAsgn=_sfaEditId==='new'?{}:asgns.find(function(x){return x.id===_sfaEditId;})||{};
    var stuOpts=(typeof students!=='undefined'?students:[]).map(function(s){var cl=((typeof classes!=='undefined'?classes:[]).find(function(c){return c.id===s.classId;})||{}).name||'';return'<option value="'+parseInt(s.id,10)+'"'+(existAsgn.studentId===s.id?' selected':'')+'>'+esc(s.name)+(cl?' ('+cl+')':'')+'</option>';}).join('');
    return'<button onclick="_sfaEditId=null;render()" class="btn btn-outline" style="margin-bottom:16px">\u2190 Back</button>'
      +'<div class="card"><div class="card-head"><span class="card-title">\ud83d\udcb0 '+(_sfaEditId==='new'?'Assign Fee':'Edit Assignment')+'</span></div>'
      +'<div style="padding:20px"><div class="form-grid g2">'
      +'<div class="form-group"><label>Student *</label><select id="sfa-stu" style="width:100%;padding:9px;border:1.5px solid var(--border);border-radius:9px;font-size:13px"><option value="">\u2014 Select Student \u2014</option>'+stuOpts+'</select></div>'
      +'<div class="form-group"><label>Fee Type *</label><select id="sfa-type" style="width:100%;padding:9px;border:1.5px solid var(--border);border-radius:9px;font-size:13px">'+FEE_TYPES.map(function(t){return'<option'+(existAsgn.type===t?' selected':'')+'>'+t+'</option>';}).join('')+'</select></div>'
      +'<div class="form-group"><label>Month</label><select id="sfa-month" style="width:100%;padding:9px;border:1.5px solid var(--border);border-radius:9px;font-size:13px"><option value="">\u2014</option>'+MONTHS.map(function(m){return'<option'+(existAsgn.month===m?' selected':'')+'>'+m+'</option>';}).join('')+'</select></div>'
      +'<div class="form-group"><label>Year</label><input id="sfa-year" type="number" value="'+esc(String(existAsgn.year||new Date().getFullYear()))+'" placeholder="e.g. 2025"/></div>'
      +'<div class="form-group"><label>Amount Due (\u20b9) *</label><input id="sfa-amt" type="number" value="'+esc(String(existAsgn.amountDue||''))+'" placeholder="e.g. 2000"/></div>'
      +'<div class="form-group"><label>Amount Paid (\u20b9)</label><input id="sfa-paid" type="number" value="'+esc(String(existAsgn.amountPaid||0))+'" placeholder="0"/></div>'
      +'<div class="form-group"><label>Due Date</label><input id="sfa-due" type="date" value="'+esc(existAsgn.dueDate||'')+'"/></div>'
      +'<div class="form-group"><label>Payment Date</label><input id="sfa-paydate" type="date" value="'+esc(existAsgn.payDate||'')+'"/></div>'
      +'<div class="form-group"><label>Status</label><select id="sfa-status" style="width:100%;padding:9px;border:1.5px solid var(--border);border-radius:9px;font-size:13px">'
      +'<option'+(existAsgn.status==='Pending'||!existAsgn.status?' selected':'')+'>Pending</option>'
      +'<option'+(existAsgn.status==='Paid'?' selected':'')+'>Paid</option>'
      +'<option'+(existAsgn.status==='Partial'?' selected':'')+'>Partial</option>'
      +'<option'+(existAsgn.status==='Waived'?' selected':'')+'>Waived</option>'
      +'</select></div>'
      +'<div class="form-group"><label>Remarks</label><input id="sfa-rem" value="'+esc(existAsgn.remarks||'')+'" placeholder="Optional"/></div>'
      +'</div><button class="btn btn-primary" onclick="gnsiSaveSFA()" style="margin-top:14px">\ud83d\udcbe Save Assignment</button>'
      +'</div></div>';
  }
  var filtered=asgns.filter(function(a){
    var q=_sfaSearch.toLowerCase();
    var stu=(typeof students!=='undefined'?students:[]).find(function(s){return s.id===a.studentId;})||{};
    var cl=((typeof classes!=='undefined'?classes:[]).find(function(c){return c.id===stu.classId;})||{}).name||'';
    var classOk=_sfaClassFilter==='all'||cl===_sfaClassFilter;
    return classOk&&(!q||(stu.name||'').toLowerCase().includes(q)||(a.type||'').toLowerCase().includes(q));
  }).sort(function(a,b){return(b.year||0)-(a.year||0);});
  var totalDue=asgns.reduce(function(acc,a){return acc+(parseFloat(a.amountDue)||0);},0);
  var totalPaid=asgns.reduce(function(acc,a){return acc+(parseFloat(a.amountPaid)||0);},0);
  var pending=asgns.filter(function(a){return a.status==='Pending'||a.status==='Partial';}).length;
  var clsArr=typeof classes!=='undefined'?classes:[];
  var clsOpts='<option value="all">All Classes</option>'+clsArr.map(function(c){return'<option value="'+esc(c.name)+'"'+(c.name===_sfaClassFilter?' selected':'')+'>'+esc(c.name)+'</option>';}).join('');
  var rows=filtered.map(function(a){
    var stu=(typeof students!=='undefined'?students:[]).find(function(s){return s.id===a.studentId;})||{name:'\u2014'};
    var cl=(clsArr.find(function(c){return c.id===stu.classId;})||{}).name||'\u2014';
    var balance=Math.max(0,(parseFloat(a.amountDue)||0)-(parseFloat(a.amountPaid)||0));
    var stCol=a.status==='Paid'?'#16a34a':a.status==='Waived'?'#64748b':a.status==='Partial'?'#c9870a':'#dc2626';
    return'<tr>'
      +'<td><b>'+esc(stu.name)+'</b><div style="font-size:11px;color:var(--muted)">'+esc(cl)+'</div></td>'
      +'<td>'+esc(a.type||'\u2014')+'</td>'
      +'<td>'+esc((a.month||'')+(a.year?' '+a.year:''))+'</td>'
      +'<td style="text-align:right;font-weight:700">\u20b9'+(a.amountDue?Number(a.amountDue).toLocaleString('en-IN'):'0')+'</td>'
      +'<td style="text-align:right;color:#16a34a;font-weight:700">\u20b9'+(a.amountPaid?Number(a.amountPaid).toLocaleString('en-IN'):'0')+'</td>'
      +'<td style="text-align:right;color:'+(balance>0?'#dc2626':'#16a34a')+';font-weight:700">\u20b9'+Number(balance).toLocaleString('en-IN')+'</td>'
      +'<td><span style="color:'+stCol+';font-weight:700;font-size:11px">'+esc(a.status||'Pending')+'</span></td>'
      +(isAdm?'<td><button onclick="_sfaEditId=\''+parseInt(a.id,10)+'\';render()" style="background:var(--accent-light);color:var(--accent);border:none;border-radius:6px;padding:3px 9px;cursor:pointer;font-size:11px;font-weight:700;margin-right:4px">\u270f\ufe0f</button><button onclick="gnsiDelSFA(\''+parseInt(a.id,10)+'\')" style="background:#fef2f2;color:#dc2626;border:none;border-radius:6px;padding:3px 9px;cursor:pointer;font-size:11px;font-weight:700">\ud83d\uddd1\ufe0f</button></td>':'')
      +'</tr>';
  }).join('');
  return'<div class="card" style="margin-bottom:12px">'
    +'<div style="display:flex;gap:12px;padding:16px 20px;flex-wrap:wrap">'
    +'<div style="flex:1;background:#fef2f2;border-radius:10px;padding:12px 16px;min-width:120px"><div style="font-size:11px;color:var(--muted)">Total Due</div><div style="font-size:18px;font-weight:800;color:#dc2626">\u20b9'+totalDue.toLocaleString('en-IN')+'</div></div>'
    +'<div style="flex:1;background:#f0fdf4;border-radius:10px;padding:12px 16px;min-width:120px"><div style="font-size:11px;color:var(--muted)">Total Paid</div><div style="font-size:18px;font-weight:800;color:#16a34a">\u20b9'+totalPaid.toLocaleString('en-IN')+'</div></div>'
    +'<div style="flex:1;background:#fef9c3;border-radius:10px;padding:12px 16px;min-width:120px"><div style="font-size:11px;color:var(--muted)">Pending/Partial</div><div style="font-size:18px;font-weight:800;color:#c9870a">'+pending+'</div></div>'
    +'<div style="flex:1;background:var(--accent-light);border-radius:10px;padding:12px 16px;min-width:120px"><div style="font-size:11px;color:var(--muted)">Total Assignments</div><div style="font-size:18px;font-weight:800;color:var(--accent)">'+asgns.length+'</div></div>'
    +'</div>'
    +'<div class="card-head" style="border-top:1px solid var(--border)"><span class="card-title">\ud83d\udcb0 Student Fee Assignment</span>'
    +(isAdm?'<button onclick="_sfaEditId=\'new\';render()" class="btn btn-primary">+ Assign Fee</button>':'')
    +'</div>'
    +'<div style="padding:10px 16px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">'
    +'<select onchange="_sfaClassFilter=this.value;render()" style="padding:7px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface)">'+clsOpts+'</select>'
    +'<div class="search-wrap" style="flex:1;min-width:200px"><span class="search-icon">\ud83d\udd0d</span><input placeholder="Search student, fee type..." value="'+esc(_sfaSearch)+'" oninput="_sfaSearch=this.value;_debouncedRenderSfa()" style="width:100%"/></div>'
    +'</div>'
    +'<div style="overflow-x:auto"><table><thead><tr><th>Student</th><th>Fee Type</th><th>Month/Year</th><th>Due</th><th>Paid</th><th>Balance</th><th>Status</th>'+(isAdm?'<th>Actions</th>':'')+'</tr></thead>'
    +'<tbody>'+(rows||'<tr><td colspan="8" style="padding:40px;text-align:center;color:var(--muted)">No fee assignments found.</td></tr>')+'</tbody></table></div></div>';
}
function gnsiSFAPrint(){
  var asgns=_sfaLoad().sort(function(a,b){return(b.dueDate||'').localeCompare(a.dueDate||'');});
  var totalDue=asgns.reduce(function(s,a){return s+(parseFloat(a.amountDue)||0);},0);
  var totalPaid=asgns.reduce(function(s,a){return s+(parseFloat(a.amountPaid)||0);},0);
  var rows=asgns.map(function(a,i){
    var stu=(typeof students!=='undefined'?students:[]).find(function(s){return s.id===a.studentId;})||{name:a.studentName||'—'};
    var bal=(parseFloat(a.amountDue)||0)-(parseFloat(a.amountPaid)||0);
    var stCol=a.status==='Paid'?'#16a34a':a.status==='Overdue'?'#dc2626':'#c9870a';
    return '<tr><td style="text-align:center">'+(i+1)+'</td>'
      +'<td><b>'+esc(stu.name||'—')+'</b></td><td>'+esc(stu.cls||'—')+'</td>'
      +'<td>'+esc(a.type||'—')+'</td><td>'+esc(a.month||'—')+'</td>'
      +'<td style="text-align:right">₹'+(a.amountDue?Number(a.amountDue).toLocaleString('en-IN'):'0')+'</td>'
      +'<td style="text-align:right;color:#16a34a">₹'+(a.amountPaid?Number(a.amountPaid).toLocaleString('en-IN'):'0')+'</td>'
      +'<td style="text-align:right;color:'+(bal>0?'#dc2626':'#16a34a')+';font-weight:700">₹'+Number(Math.abs(bal)).toLocaleString('en-IN')+(bal<0?' (Adv)':'')+'</td>'
      +'<td>'+esc(a.dueDate||'—')+'</td>'
      +'<td style="color:'+stCol+';font-weight:700">'+esc(a.status||'—')+'</td></tr>';
  }).join('');
  var body='<div class="gnsi-pg-hdr"><div class="gnsi-inst">'+(window.TENANT?window.TENANT.name+' · '+window.TENANT.city:'Guidance Navodaya & Sainik Institute · Khangabok')+'</div>'
    +'<div class="gnsi-pg-title">💰 Student Fee Assignment Ledger</div>'
    +'<div class="gnsi-pg-sub">Printed: '+new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})
    +' · Due: ₹'+totalDue.toLocaleString('en-IN')+' · Paid: ₹'+totalPaid.toLocaleString('en-IN')
    +' · Balance: ₹'+(totalDue-totalPaid).toLocaleString('en-IN')+'</div></div>'
    +'<table><thead><tr><th style="width:26px">#</th><th>Student</th><th style="width:55px">Class</th>'
    +'<th style="width:80px">Fee Type</th><th style="width:60px">Month</th>'
    +'<th style="width:70px;text-align:right">Due</th><th style="width:70px;text-align:right">Paid</th>'
    +'<th style="width:70px;text-align:right">Balance</th><th style="width:75px">Due Date</th>'
    +'<th style="width:60px">Status</th></tr></thead><tbody>'+rows+'</tbody>'
    +'<tfoot><tr style="background:#f0f4ff"><td colspan="5" style="padding:6px 8px;font-weight:700">TOTALS</td>'
    +'<td style="padding:6px 8px;text-align:right;font-weight:800">₹'+totalDue.toLocaleString('en-IN')+'</td>'
    +'<td style="padding:6px 8px;text-align:right;font-weight:800;color:#16a34a">₹'+totalPaid.toLocaleString('en-IN')+'</td>'
    +'<td style="padding:6px 8px;text-align:right;font-weight:800;color:#dc2626">₹'+(totalDue-totalPaid).toLocaleString('en-IN')+'</td>'
    +'<td colspan="2"></td></tr></tfoot></table>';
  gnsiPrintWindow('Fee Assignment Ledger — GNSI', body, false);
}
function gnsiSFAExport(){
  showToast('⏳ Preparing Fee Assignment CSV…','#2563eb');

  var asgns=_sfaLoad().sort(function(a,b){return(b.dueDate||'').localeCompare(a.dueDate||'');});
  var rows=[['GNSI — Student Fee Assignment Ledger'],['Exported: '+new Date().toLocaleString('en-IN')],[]
    ,['#','Student Name','Class','Fee Type','Month','Year','Amount Due (₹)','Amount Paid (₹)','Balance (₹)','Due Date','Payment Date','Status','Notes']];
  asgns.forEach(function(a,i){
    var stu=(typeof students!=='undefined'?students:[]).find(function(s){return s.id===a.studentId;})||{name:a.studentName||''};
    var bal=(parseFloat(a.amountDue)||0)-(parseFloat(a.amountPaid)||0);
    rows.push([i+1,stu.name,stu.cls||'',a.type||'',a.month||'',a.year||'',a.amountDue||0,a.amountPaid||0,bal,a.dueDate||'',a.payDate||'',a.status||'',a.notes||'']);
  });
    showToast('✅ Fee Assignment CSV ready — '+(asgns.length)+' rows','#16a34a');
  gnsiExportExcel('FeeAssignment_'+new Date().toISOString().slice(0,10)+'.xlsx',[{name:'Fee Ledger',rows:rows,cols:[{wch:4},{wch:22},{wch:8},{wch:14},{wch:10},{wch:6},{wch:12},{wch:12},{wch:12},{wch:12},{wch:12},{wch:10},{wch:25}]}]);
}
function gnsiSaveSFA(){
  var asgns=_sfaLoad();
  var stuId=parseInt(((document.getElementById('sfa-stu')||{}).value)||0);
  var type=((document.getElementById('sfa-type')||{}).value||'Monthly Fee');
  var amt=parseFloat(((document.getElementById('sfa-amt')||{}).value)||0);
  if(!stuId){showToast('Select a student','#dc2626');return;}
  if(!amt){showToast('Amount due required','#dc2626');return;}
  var rec={
    id:_sfaEditId==='new'?Date.now():_sfaEditId,
    studentId:stuId,type:type,
    month:(((document.getElementById('sfa-month')||{}).value||'').trim()),
    year:parseInt(((document.getElementById('sfa-year')||{}).value)||new Date().getFullYear()),
    amountDue:amt,
    amountPaid:parseFloat(((document.getElementById('sfa-paid')||{}).value)||0),
    dueDate:(((document.getElementById('sfa-due')||{}).value||'').trim()),
    payDate:(((document.getElementById('sfa-paydate')||{}).value||'').trim()),
    status:((document.getElementById('sfa-status')||{}).value||'Pending'),
    remarks:(((document.getElementById('sfa-rem')||{}).value||'').trim()),
    savedBy:currentUser?currentUser.name:'',savedAt:new Date().toISOString()
  };
  if(_sfaEditId==='new'){asgns.push(rec);}else{var idx=asgns.findIndex(function(x){return x.id===_sfaEditId;});if(idx>=0)asgns[idx]=rec;else asgns.push(rec);}
  _sfaSave(asgns);_sfaEditId=null;render();showToast('Fee assignment saved','#16a34a');
}
function gnsiDelSFA(id){
  if(!confirm('Delete this fee assignment?'))return;
  _sfaSave(_sfaLoad().filter(function(x){return x.id!==id;}));render();showToast('Assignment deleted','#64748b');
}
/* ══════════════════════════════════════════════════════════════
   STUB PAGES -- referenced in _getPageMap but not yet implemented
   Replace each stub with the real implementation when ready.
   ══════════════════════════════════════════════════════════════ */
(function(){
  var _stubs = [
    ['renderGrievance',         '📋', 'Grievance'],
    ['renderDiary',             '📔', 'Diary'],
    ['renderCalendar',          '📅', 'Calendar'],
    ['renderPTM',               '🤝', 'PTM'],
    ['renderLibrary',           '📚', 'Library'],
    ['renderAssets',            '🏷️',  'Assets'],
    ['renderTransport',         '🚌', 'Transport'],
    ['renderNightDuty',         '🌙', 'Night Duty'],
    ['renderDiscipline',        '⚖️',  'Discipline'],
    ['renderSickBay',           '🏥', 'Sick Bay'],
    ['renderScholarship',       '🎓', 'Scholarship'],
    ['renderAlumni',            '🎓', 'Alumni'],
    ['renderParent',            '👨‍👩‍👧', 'Parent Portal'],
    ['renderParentFeedbackAdmin','💬', 'Parent Feedback'],
    ['renderSMS',               '📱', 'SMS'],
    ['renderCompetition',       '🏆', 'Competition'],
    ['renderTwoFA',             '🔐', 'Two-Factor Auth'],
    ['renderBackup',            '💾', 'Backup'],
    ['renderPayments',          '💳', 'Payments'],
    ['renderCourseManagement',  '📖', 'Course Management'],
    ['renderStudentFeeAssignment','💰','Student Fee Assignment'],
  ];
  _stubs.forEach(function(s){
    var name=s[0], icon=s[1], label=s[2];
    if(typeof window[name]==='undefined'){
      window[name]=function(){
        return '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 20px;text-align:center">'
          +'<div style="font-size:56px;margin-bottom:16px">'+icon+'</div>'
          +'<div style="font-size:22px;font-weight:700;color:var(--text,#1e293b);margin-bottom:8px">'+label+'</div>'
          +'<div style="font-size:14px;color:var(--muted,#64748b)">This module is coming soon.</div>'
          +'</div>';
      };
    }
  });
})();
/* ══════════════════════════════════════════════════════════════
   PARENT PORTAL -- gnsiOpenParentPortal + renderParent
══════════════════════════════════════════════════════════════ */
var _ppTab = 'result';
var _ppStudent = null;
var _ppGCC  = '';
var _ppRoll = '';
function gnsiOpenParentPortal(tab) {
  _ppTab = tab || 'result';
  /* Bypass canAccess — Parent Portal is public (no login required) */
  activePage = 'parent';
  buildNav();
  var pg = PAGES.find(function(p){ return p.id === 'parent'; });
  if (pg) document.getElementById('page-title').textContent = pg.label;
  render();
}
function gnsiCloseParentPortal() {
  navigate('login');
}
function _gnsiParentGetFees(stuName){
  /* FIX #11: Get fee summary for parent portal */
  try{
    var cols=(typeof _fmcLoadCols==='function')?_fmcLoadCols():[];
    var asgns=(typeof _fmcLoadAsgns==='function')?_fmcLoadAsgns():[];
    var stu=students.find(function(s){return s.name===stuName;});
    if(!stu) return null;
    var asgn=asgns.find(function(a){return String(a.stuId)===String(stu.id);});
    if(!asgn) return null;
    var stuCols=cols.filter(function(c){return c.asgnId===asgn.id||String(c.stuId)===String(stu.id);});
    var totalPaid=stuCols.reduce(function(s,c){return s+(parseInt(c.amountPaid)||0);},0);
    var m=typeof _fmcMonthsSince==='function'?_fmcMonthsSince(asgn.billingStartAt||asgn.enrolledAt):0;
    var exp=0; for(var i=1;i<=m;i++) exp+=(typeof _fmcCalcFee==='function'?_fmcCalcFee(asgn,i).total:0);
    var balance=Math.max(0,exp-totalPaid);
    return {totalPaid:totalPaid,expected:exp,balance:balance,lastPayment:stuCols.length?stuCols[stuCols.length-1]:null,course:asgn.className||''};
  }catch(e){return null;}
}
function renderUnifiedHub() {
  var allStus = _ushGetAllStudents();
  var apps    = (typeof loadAdmApps==='function')?loadAdmApps():[];
  var feeRecs = _ushGetFeeRecords('admission').length+_ushGetFeeRecords('monthly').length;
  var unsynced= allStus.filter(function(s){return s._src==='fee';}).length;
  var pending = apps.filter(function(a){return a.status==='Applied'||a.status==='Under Review';}).length;
  var overdueStudents = allStus.filter(function(s){ var fs=_ushFeeStatus(s); return fs.overdue; });
  var totalCollected  = (typeof _fmcLoadCols==='function')?_fmcLoadCols().reduce(function(t,c){return t+(parseInt(c.amountPaid)||0);},0):0;
  var totalDue        = overdueStudents.reduce(function(t,s){ return t+_ushFeeStatus(s).due; },0);
  var stats = '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:22px">'
    +_ushStat('👥',allStus.length,'Total Students','Across all sources','#1433a8')
    +_ushStat('📋',pending,'Pending Admissions',apps.length+' total applications','#8b5cf6')
    +_ushStat('✅',_ushAmt(totalCollected),'Total Collected','All time cash + UPI','#059669')
    +_ushStat('⚠️',overdueStudents.length,'Defaulters',_ushAmt(totalDue)+' outstanding','#dc2626')
    +_ushStat('🔗',unsynced,'Fee Hub Only','Tap Sync All to merge','#f59e0b')
    +'</div>';
  /* Only show tabs relevant to the current user's role */
  var _isAdminMgr = currentUser && (currentUser.role==='admin'||currentUser.role==='manager');
  var tabs=[
    {id:'students',     icon:'👥', label:'All Students'},
    {id:'applications', icon:'📋', label:'Admissions'},
    {id:'fees',         icon:'💰', label:'Fee Records'}
  ];
  /* Only admin/manager see these legacy tabs -- accounts users use Fee Management page */
  if(_isAdminMgr){
    tabs.push({id:'payments',   icon:'🌐', label:'Online Payments'});
    tabs.push({id:'studentfee', icon:'📋', label:'Fee Assignment'});
  }
  var tabBar='<div style="display:flex;gap:0;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;box-shadow:0 1px 6px rgba(0,0,0,.07);margin-bottom:22px">'
    +tabs.map(function(t,i){
      var active=_ush.tab===t.id;
      var sep=i>0?'<div style="width:1px;background:#e2e8f0"></div>':'';
      return sep+'<div onclick="_ush.tab=\''+t.id+'\';_ush.page=0;_ush.viewId=null;_ush.search=\'\';_ushRefresh()" style="flex:1;padding:12px 18px;cursor:pointer;text-align:center;font-size:13px;font-weight:700;font-family:\'Syne\',sans-serif;'+(active?'background:#1433a8;color:#fff':'color:#64748b')+'">'+t.icon+' '+t.label+'</div>';
    }).join('')+'</div>';
  var body='';
  if(_ush.tab==='students')     body=_ushRenderStudents();
  if(_ush.tab==='applications') body=_ushRenderApplications();
  if(_ush.tab==='fees')         body=_ushRenderFees();
  if(_ush.tab==='payments')     body=(typeof renderPayments==='function'?renderPayments():'<div style="padding:30px;text-align:center;color:var(--muted)">Online Payments module not loaded.</div>');
  if(_ush.tab==='studentfee')   body=(typeof renderStudentFeeAssignment==='function'?renderStudentFeeAssignment():'<div style="padding:30px;text-align:center;color:var(--muted)">Fee Assignment module not loaded.</div>');
  return '<div style="padding:4px 0">'
    +'<div style="display:flex;align-items:center;gap:14px;margin-bottom:20px">'
    +'<div style="width:44px;height:44px;background:linear-gradient(135deg,#1433a8,#3b82f6);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px">🎓</div>'
    +'<div style="flex:1"><div style="font-family:\'Syne\',sans-serif;font-size:22px;font-weight:800;color:#0f172a">Unified Student Hub</div>'
    +'<div style="font-size:12.5px;color:#64748b;margin-top:1px">Students · Admissions · Fee Records · Online Payments · Fee Assignment -- unified</div></div>'
    +'<button onclick="_ushSyncAll()" style="padding:9px 18px;background:#f0fdf4;color:#059669;border:1.5px solid #86efac;border-radius:9px;font-family:\'DM Sans\',sans-serif;font-size:12.5px;font-weight:700;cursor:pointer">🔄 Sync All</button>'
    +'</div>'
    +stats+tabBar+body+'</div>';
}
// -- TAB: ALL STUDENTS --------------------------------------------------
function _ushRenderStudents() {
  var all=_ushGetAllStudents();
  // If counter's Cancel was clicked (feesCounterStu cleared by counter), sync collectId
  if(_ush.collectId && !feesCounterStu) { _ush.collectId=null; }
  if(_ush.collectId) return _ushRenderCollectPanel(_ush.collectId);
  if(_ush.viewId)    return _ushRenderProfile(_ush.viewId);
  var q=(_ush.search||'').toLowerCase();
  var cls=_ush.classFilter||'All';
  var classes=['All'];
  all.forEach(function(s){ if(s.cls&&classes.indexOf(s.cls)<0) classes.push(s.cls); });
  var filtered=all.filter(function(s){
    var mq=!q||(s.name||'').toLowerCase().includes(q)||(s.roll||'').toLowerCase().includes(q)||(s.admNo||'').toLowerCase().includes(q)||(s.phone||'').includes(q);
    return mq&&(cls==='All'||s.cls===cls);
  });
  var toolbar='<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:16px">'
    +'<div style="position:relative;flex:1;min-width:200px"><span style="position:absolute;left:11px;top:50%;transform:translateY(-50%);color:#94a3b8">🔍</span>'
    +'<input placeholder="Search name, roll, adm no, phone…" value="'+_ushEsc(_ush.search)+'" oninput="_ush.search=this.value;_ush.page=0;_ushRefresh()" style="width:100%;padding:9px 12px 9px 34px;border-radius:9px;border:1.5px solid #e2e8f0;font-size:13px;background:#f8fafc;box-sizing:border-box"/></div>'
    +'<select onchange="_ush.classFilter=this.value;_ush.page=0;_ushRefresh()" style="padding:9px 12px;border-radius:9px;border:1.5px solid #e2e8f0;font-size:13px;background:#f8fafc">'+classes.map(function(c){return'<option'+(c===cls?' selected':'')+'>'+_ushEsc(c)+'</option>';}).join('')+'</select>'
    +'<span style="font-size:12px;color:#94a3b8;white-space:nowrap">'+filtered.length+' students</span>'
    +'</div>';
  var start=_ush.page*_ush.PER_PAGE;
  var pg=filtered.slice(start,start+_ush.PER_PAGE);
  var rows=pg.length?pg.map(function(s){
    var fs=_ushFeeStatus(s);
    var feeBar='<div style="display:flex;align-items:center;gap:7px;min-width:110px">'
      +'<div style="flex:1;background:#f1f5f9;border-radius:4px;height:5px"><div style="height:5px;border-radius:4px;background:'+fs.col+';width:'+fs.pct+'%"></div></div>'
      +'<span style="font-size:11px;font-weight:700;color:'+fs.col+';white-space:nowrap">'+_ushEsc(fs.label)+'</span>'
      +'</div>';
    return '<tr style="border-bottom:1px solid #f1f5f9" onmouseover="this.style.background=\'#f8fafc\'" onmouseout="this.style.background=\'\'">'
      +'<td style="padding:10px 14px"><div style="display:flex;align-items:center;gap:10px">'+_ushAvatar(s.name,32)
      +'<div><div style="font-weight:700;font-size:13px;color:#1433a8;cursor:pointer;text-decoration:underline;text-underline-offset:2px" onclick="_ush.viewId=\''+s._id+'\';_ush.collectId=null;_ushRefresh()">'+_ushEsc(s.name)+'</div>'
      +'<div style="font-size:11px;color:#94a3b8;font-family:\'JetBrains Mono\',monospace">'+_ushEsc(s.admNo||s.roll||'--')+'</div></div></div></td>'
      +'<td style="padding:10px 14px;font-size:13px;color:#334155">'+_ushEsc(s.cls||'--')+'</td>'
      +'<td style="padding:10px 14px">'+feeBar+'</td>'
      +'<td style="padding:10px 14px;font-weight:700;font-size:13px;color:#059669;font-family:\'JetBrains Mono\',monospace">'+_ushAmt(fs.paid)+'</td>'
      +'<td style="padding:10px 14px">'
      +'<button onclick="_ushOpenCollect(\''+s._id+'\')" style="padding:5px 14px;background:'+(fs.overdue?'#dc2626':'#059669')+';color:#fff;border:none;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">'+(fs.overdue?'⚠️ Collect Due':'💰 Collect')+'</button>'
      +'&nbsp;<button onclick="_ush.viewId=\''+s._id+'\';_ush.collectId=null;_ushRefresh()" style="padding:5px 10px;background:#f1f5f9;color:#334155;border:1px solid #e2e8f0;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">👤</button>'
      +'</td></tr>';
  }).join(''):'<tr><td colspan="5" style="text-align:center;padding:48px;color:#94a3b8">No students found</td></tr>';
  var totalPages=Math.ceil(filtered.length/_ush.PER_PAGE)||1;
  var pager='<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-top:1px solid #f1f5f9">'
    +'<span style="font-size:12px;color:#94a3b8">Page '+(_ush.page+1)+' / '+totalPages+'</span>'
    +'<div style="display:flex;gap:8px">'
    +(_ush.page>0?'<button onclick="_ush.page--;_ushRefresh()" style="padding:7px 16px;background:#f1f5f9;color:#334155;border:1px solid #e2e8f0;border-radius:8px;font-family:\'DM Sans\',sans-serif;font-size:12px;font-weight:700;cursor:pointer">← Prev</button>':'')
    +(_ush.page<totalPages-1?'<button onclick="_ush.page++;_ushRefresh()" style="padding:7px 16px;background:#1433a8;color:#fff;border:none;border-radius:8px;font-family:\'DM Sans\',sans-serif;font-size:12px;font-weight:700;cursor:pointer">Next →</button>':'')
    +'</div></div>';
  var _ushWizardBanner = '<div style="display:flex;align-items:center;gap:14px;background:linear-gradient(135deg,#1433a822,#8b5cf611);border:1.5px solid #1433a833;border-radius:10px;padding:12px 18px;margin-bottom:16px">'+ '<div style="font-size:28px">🧙</div>'+ '<div style="flex:1">'+ '<div style="font-size:13px;font-weight:700;color:#1433a8">Admission Fee Wizard</div>'+ '<div style="font-size:12px;color:#64748b">Collect admission fee, items &amp; generate receipt in one guided flow</div>'+ '</div>'+'<button onclick="if(typeof admTabActive!==\'undefined\'){admTabActive=\'feesystem\';}if(typeof fs_activePage!==\'undefined\'){fs_activePage=\'new-admission\';fs_admWizardStep=1;fs_admWizardData={};}if(typeof navigate===\'function\'){navigate(\'admissions\');}else if(typeof render===\'function\'){render();}" style="padding:9px 18px;border-radius:8px;background:#1433a8;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif;white-space:nowrap">🧙 Launch Wizard</button>'+'</div>';
  return _ushWizardBanner + toolbar
    +'<div style="background:#fff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.05)">'
    +'<table style="width:100%;border-collapse:collapse">'
    +'<thead><tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0">'
    +['Student','Class','Fee Progress','Paid','Actions'].map(function(h){return'<th style="padding:11px 14px;text-align:left;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em">'+h+'</th>';}).join('')
    +'</tr></thead><tbody>'+rows+'</tbody></table>'+pager+'</div>';
}
// -- INLINE FEE COLLECTION PANEL -- embeds the real 7-type fee counter --
function _ushRenderCollectPanel(uid) {
  var s = _ushFindById(uid);
  if(!s) return '<p style="color:#dc2626;padding:20px">Student not found.</p>';
  // Students not in main store need sync first
  if(s._src === 'fee') {
    return '<div>'
      +'<button onclick="_ushCloseCollect()" style="padding:8px 16px;background:#f1f5f9;color:#334155;border:1px solid #e2e8f0;border-radius:8px;font-family:\'DM Sans\',sans-serif;font-size:12.5px;font-weight:700;cursor:pointer;margin-bottom:18px">← Back to Students</button>'
      +'<div style="background:#fef9c3;border:1.5px solid #fde047;border-radius:14px;padding:22px 24px;max-width:560px">'
      +'<div style="font-size:15px;font-weight:800;color:#854d0e;margin-bottom:8px">⚠️ Sync Required First</div>'
      +'<div style="font-size:13px;color:#713f12;line-height:1.6;margin-bottom:18px"><b>'+_ushEsc(s.name)+'</b> is in the Fee Hub only. Sync to the main Students register to unlock all 7 payment types (Monthly, Full Pay, Admission, Advance, Items, Fee Group, Manual) with receipt printing.</div>'
      +'<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:22px">'
      +'<button onclick="_ushPromoteToMain(\''+uid+'\')" style="padding:10px 20px;background:#854d0e;color:#fff;border:none;border-radius:9px;font-family:\'DM Sans\',sans-serif;font-size:13px;font-weight:700;cursor:pointer">⬆ Sync to Main Register</button>'
      +'<button onclick="_ushCloseCollect()" style="padding:10px 20px;background:#f1f5f9;color:#334155;border:1px solid #e2e8f0;border-radius:9px;font-family:\'DM Sans\',sans-serif;font-size:13px;font-weight:700;cursor:pointer">Cancel</button>'
      +'</div>'
      +'<div style="border-top:1.5px solid #fde047;padding-top:18px">'
      +'<div style="font-size:12px;font-weight:700;color:#854d0e;margin-bottom:10px">Quick Monthly Collect (basic -- no receipt print):</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">'
      +'<div><label style="display:block;font-size:11px;font-weight:700;color:#64748b;margin-bottom:4px">Amount (₹) *</label><input id="_ush_amt" type="number" min="1" style="width:100%;padding:8px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:14px;box-sizing:border-box"/></div>'
      +'<div><label style="display:block;font-size:11px;font-weight:700;color:#64748b;margin-bottom:4px">Mode</label><select id="_ush_mode" style="width:100%;padding:8px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px"><option>Cash</option><option>UPI</option><option>Bank Transfer</option><option>Cheque</option></select></div>'
      +'<div><label style="display:block;font-size:11px;font-weight:700;color:#64748b;margin-bottom:4px">Month</label><select id="_ush_month" style="width:100%;padding:8px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px">'+['January','February','March','April','May','June','July','August','September','October','November','December'].map(function(m){var lbl=m+' '+new Date().getFullYear();return'<option'+(m===(['January','February','March','April','May','June','July','August','September','October','November','December'][new Date().getMonth()])?' selected':'')+'>'+lbl+'</option>';}).join('')+'</select></div>'
      +'<div><label style="display:block;font-size:11px;font-weight:700;color:#64748b;margin-bottom:4px">Remark</label><input id="_ush_note" type="text" placeholder="Optional" style="width:100%;padding:8px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;box-sizing:border-box"/></div>'
      +'</div>'
      +'<button onclick="_ushSaveCollect(\''+uid+'\')" style="padding:10px 22px;background:#059669;color:#fff;border:none;border-radius:9px;font-family:\'DM Sans\',sans-serif;font-size:13px;font-weight:700;cursor:pointer">✅ Save Monthly</button>'
      +'</div></div></div>';
  }
  // Main-source student: embed the full real fee counter (all 7 types, receipts, income sync, CM sync)
  var fs = _ushFeeStatus(s);
  var counterHTML = (typeof renderFeeCounter==='function') ? renderFeeCounter() : '<div style="padding:24px;color:#dc2626">Fee counter module not loaded.</div>';
  return '<div>'
    +'<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap">'
    +'<button onclick="_ushCloseCollect()" style="padding:8px 16px;background:#f1f5f9;color:#334155;border:1px solid #e2e8f0;border-radius:8px;font-family:\'DM Sans\',sans-serif;font-size:12.5px;font-weight:700;cursor:pointer">← Back to Students</button>'
    +'<div style="flex:1;background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:10px 16px;display:flex;align-items:center;gap:14px;min-width:0;flex-wrap:wrap">'
    +_ushAvatar(s.name,32)
    +'<div style="min-width:0"><div style="font-weight:800;font-size:13.5px;color:#0f172a">'+_ushEsc(s.name)+'</div><div style="font-size:11px;color:#64748b">'+_ushEsc(s.cls||'--')+' · '+(s.hostel==='Yes'?'Boarder':'Day Scholar')+'</div></div>'
    +'<div style="margin-left:auto;display:flex;gap:16px;text-align:center;flex-shrink:0">'
    +'<div><div style="font-size:10px;color:#94a3b8;text-transform:uppercase">Paid</div><div style="font-size:15px;font-weight:800;color:#059669">'+_ushAmt(fs.paid)+'</div></div>'
    +(fs.overdue?'<div><div style="font-size:10px;color:#94a3b8;text-transform:uppercase">Due</div><div style="font-size:15px;font-weight:800;color:#dc2626">'+_ushAmt(fs.due)+'</div></div>':'<div><div style="font-size:13px;font-weight:700;color:#059669;padding-top:8px">✅ Up to date</div></div>')
    +'</div></div></div>'
    + counterHTML
    +'</div>';
}
// -- STUDENT PROFILE ----------------------------------------------------
function _ushRenderProfile(uid) {
  var all=_ushGetAllStudents();
  var s=all.find(function(x){ return x._id===uid; });
  if(!s) return '<div style="text-align:center;padding:40px;color:#94a3b8">Student not found.<br><button onclick="_ush.viewId=null;_ushRefresh()" style="margin-top:12px;padding:8px 18px;background:#f1f5f9;color:#334155;border:1px solid #e2e8f0;border-radius:8px;font-family:\'DM Sans\',sans-serif;font-size:13px;font-weight:700;cursor:pointer">← Back</button></div>';
  var admFee=_ushGetFeeRecords('admission').filter(function(r){ return (r.student||'').toLowerCase()===s.name.toLowerCase(); });
  var monFee=_ushGetFeeRecords('monthly').filter(function(r){ return (r.student||'').toLowerCase()===s.name.toLowerCase(); });
  var advFee=_ushGetFeeRecords('advance').filter(function(r){ return (r.student||'').toLowerCase()===s.name.toLowerCase(); });
  var app=(typeof loadAdmApps==='function')?loadAdmApps().find(function(a){ return (a.name||'').toLowerCase()===s.name.toLowerCase(); }):null;
  var fs=_ushFeeStatus(s);
  var hue=(s.name||'').split('').reduce(function(a,c){return a+c.charCodeAt(0);},0)%360;
  function fld(l,v){ if(!v)return''; return '<div style="margin-bottom:9px"><div style="font-size:9.5px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;font-family:\'JetBrains Mono\',monospace">'+l+'</div><div style="font-size:13px;font-weight:600;color:#0f172a;margin-top:1px">'+_ushEsc(v)+'</div></div>'; }
  function syncRow(label,ok){ return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:13px"><span>'+(ok?'✅':'⬜')+'</span><span style="color:'+(ok?'#059669':'#94a3b8')+';font-weight:'+(ok?700:400)+'">'+_ushEsc(label)+'</span></div>'; }
  function strip(label,count,total){ return '<div style="background:#f8fafc;border-radius:10px;padding:12px"><div style="font-size:11.5px;font-weight:700;color:#0f172a;margin-bottom:4px">'+label+'</div><div style="font-size:20px;font-weight:800;color:#1433a8">'+_ushAmt(total)+'</div><div style="font-size:11px;color:#64748b">'+count+' record'+(count===1?'':'s')+'</div></div>'; }
  // Monthly receipt mini-ledger
  var ledgerRows=monFee.slice().reverse().map(function(r){
    return '<tr><td style="padding:7px 12px;font-size:12px;color:#64748b;font-family:\'JetBrains Mono\',monospace">'+_ushFmt(r.date)+'</td>'
      +'<td style="padding:7px 12px;font-size:12px;color:#334155">'+_ushEsc(r.forMonth||'--')+'</td>'
      +'<td style="padding:7px 12px;font-weight:700;color:#059669;font-size:13px">'+_ushAmt(r.amount||0)+'</td>'
      +'<td style="padding:7px 12px;font-size:11px;color:#94a3b8;font-family:\'JetBrains Mono\',monospace">'+_ushEsc(r.receipt||'--')+'</td></tr>';
  }).join('');
  return '<div>'
    +'<div style="display:flex;gap:10px;align-items:center;margin-bottom:18px">'
    +'<button onclick="_ush.viewId=null;_ushRefresh()" style="padding:8px 16px;background:#f1f5f9;color:#334155;border:1px solid #e2e8f0;border-radius:8px;font-family:\'DM Sans\',sans-serif;font-size:12.5px;font-weight:700;cursor:pointer">← Back</button>'
    +'<button onclick="_ushOpenCollect(\''+uid+'\')" style="padding:8px 18px;background:'+(fs.overdue?'#dc2626':'#059669')+';color:#fff;border:none;border-radius:8px;font-family:\'DM Sans\',sans-serif;font-size:13px;font-weight:700;cursor:pointer">'+(fs.overdue?'⚠️ Collect Due Now':'💰 Collect Fee')+'</button>'
    +(s._src==='fee'?'<button onclick="_ushPromoteToMain(\''+uid+'\')" style="padding:8px 16px;background:#eff6ff;color:#1433a8;border:1.5px solid #bfdbfe;border-radius:8px;font-family:\'DM Sans\',sans-serif;font-size:12.5px;font-weight:700;cursor:pointer">⬆ Sync to Main</button>':'')
    +'</div>'
    +'<div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.07)">'
    // Header
    +'<div style="background:linear-gradient(135deg,hsl('+hue+',45%,30%),hsl('+hue+',45%,20%));padding:24px 28px;display:flex;align-items:center;gap:18px">'
    +_ushAvatar(s.name,60)
    +'<div style="flex:1"><div style="font-family:\'Syne\',sans-serif;font-size:22px;font-weight:800;color:#fff">'+_ushEsc(s.name)+'</div>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:7px">'
    +(s.cls?'<span style="padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;background:rgba(255,255,255,.2);color:#fff">'+_ushEsc(s.cls)+'</span>':'')
    +'<span style="padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;background:rgba(255,255,255,.15);color:#fff">'+(s._src==='fee'?'Fee Hub':'Main Portal')+'</span>'
    +'<span style="padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;background:rgba(255,255,255,.15);color:#fff">'+(s.hostel==='Yes'?'Boarder':'Day Scholar')+'</span>'
    +'</div></div>'
    +'<div style="text-align:right">'
    +'<div style="font-size:11px;color:rgba(255,255,255,.7);margin-bottom:2px">Total Paid</div>'
    +'<div style="font-size:26px;font-weight:800;color:#fff">'+_ushAmt(fs.paid)+'</div>'
    +(fs.overdue?'<div style="font-size:12px;font-weight:700;color:#fca5a5;margin-top:2px">Due: '+_ushAmt(fs.due)+'</div>':'<div style="font-size:12px;color:rgba(255,255,255,.6)">✅ Up to date</div>')
    +'<div style="background:rgba(255,255,255,.15);border-radius:6px;height:4px;margin-top:8px;width:120px"><div style="background:#fff;border-radius:6px;height:4px;width:'+fs.pct+'%"></div></div>'
    +'<div style="font-size:10px;color:rgba(255,255,255,.55);margin-top:2px">'+fs.pct+'% paid</div>'
    +'</div></div>'
    // Body grid
    +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0">'
    +'<div style="padding:20px;border-right:1px solid #f1f5f9"><div style="font-size:10px;font-weight:700;color:#1433a8;text-transform:uppercase;letter-spacing:.1em;font-family:\'JetBrains Mono\',monospace;margin-bottom:12px;padding-bottom:6px;border-bottom:2px solid #eff6ff">Personal</div>'
    +fld('Adm No.',s.admNo)+fld('Roll / GCC',s.roll)+fld('Date of Birth',_ushFmt(s.dob))+fld('Gender',s.gender)+fld('Blood Group',s.blood)+fld('Category',s.category)+'</div>'
    +'<div style="padding:20px;border-right:1px solid #f1f5f9"><div style="font-size:10px;font-weight:700;color:#059669;text-transform:uppercase;letter-spacing:.1em;font-family:\'JetBrains Mono\',monospace;margin-bottom:12px;padding-bottom:6px;border-bottom:2px solid #f0fdf4">Academic & Parent</div>'
    +fld('Class',s.cls)+fld('Session',s.session)+fld('Subtype',s.subtype)+fld('Father',s.father)+fld('Mother',s.mother)+fld('Phone',s.phone)+fld('Address',s.address)+'</div>'
    +'<div style="padding:20px"><div style="font-size:10px;font-weight:700;color:#8b5cf6;text-transform:uppercase;letter-spacing:.1em;font-family:\'JetBrains Mono\',monospace;margin-bottom:12px;padding-bottom:6px;border-bottom:2px solid #f5f3ff">Sync Status</div>'
    +syncRow('Main Students',s._src==='main')
    +syncRow('Fee Assignment',!!_ushGetAsgn(s))
    +syncRow('Application',!!app)
    +'</div></div>'
    // Fee strip
    +'<div style="border-top:1px solid #f1f5f9;padding:16px 20px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">'
    +strip('💳 Admission Fees',admFee.length,admFee.reduce(function(t,r){return t+(r.total||0);},0))
    +strip('📅 Monthly Fees',monFee.length,monFee.reduce(function(t,r){return t+(r.amount||0);},0))
    +strip('⏫ Advance Fees',advFee.length,advFee.reduce(function(t,r){return t+(r.amount||0);},0))
    +'</div>'
    // Mini receipt ledger
    +(monFee.length?'<div style="border-top:1px solid #f1f5f9;padding:16px 20px"><div style="font-size:11px;font-weight:700;color:#0f172a;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px">📜 Monthly Payment History</div>'
    +'<table style="width:100%;border-collapse:collapse"><thead><tr style="background:#f8fafc">'+['Date','Month','Amount','Receipt'].map(function(h){return'<th style="padding:7px 12px;text-align:left;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.05em">'+h+'</th>';}).join('')+'</tr></thead><tbody>'+ledgerRows+'</tbody></table></div>':'')
    +'</div></div>';
}
// -- TAB: APPLICATIONS --------------------------------------------------
function _ushRenderApplications() {
  var apps=(typeof loadAdmApps==='function')?loadAdmApps():[];
  var q=(_ush.search||'').toLowerCase();
  var sf=_ush.statusFilter||'All';
  var statuses=['All','Applied','Under Review','Admitted','Enrolled','Rejected','Waitlisted'];
  var statColors={Applied:'#3b78c9','Under Review':'#f59e0b',Admitted:'#8b5cf6',Enrolled:'#16a34a',Rejected:'#dc2626',Waitlisted:'#94a3b8'};
  var filtered=apps.filter(function(a){
    var mq=!q||(a.name||'').toLowerCase().includes(q)||(a.admNo||'').toLowerCase().includes(q)||(a.phone||'').includes(q);
    return mq&&(sf==='All'||a.status===sf);
  }).slice().reverse();
  var toolbar='<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:16px">'
    +'<div style="position:relative;flex:1;min-width:200px"><span style="position:absolute;left:11px;top:50%;transform:translateY(-50%);color:#94a3b8">🔍</span>'
    +'<input placeholder="Search name, adm no, phone…" value="'+_ushEsc(_ush.search)+'" oninput="_ush.search=this.value;_ushRefresh()" style="width:100%;padding:9px 12px 9px 34px;border-radius:9px;border:1.5px solid #e2e8f0;font-size:13px;background:#f8fafc;box-sizing:border-box"/></div>'
    +'<select onchange="_ush.statusFilter=this.value;_ushRefresh()" style="padding:9px 12px;border-radius:9px;border:1.5px solid #e2e8f0;font-size:13px;background:#f8fafc">'+statuses.map(function(s){return'<option'+(s===sf?' selected':'')+'>'+s+'</option>';}).join('')+'</select>'
    +'<span style="font-size:12px;color:#94a3b8;white-space:nowrap">'+filtered.length+' applications</span>'
    +'</div>';
  var rows=filtered.length?filtered.map(function(a){
    var col=statColors[a.status]||'#64748b';
    var enrolled=a.status==='Enrolled';
    return '<tr style="border-bottom:1px solid #f1f5f9" onmouseover="this.style.background=\'#f8fafc\'" onmouseout="this.style.background=\'\'">'
      +'<td style="padding:11px 14px"><div style="display:flex;align-items:center;gap:10px">'+_ushAvatar(a.name||'?',32)
      +'<div><div style="font-weight:700;font-size:13px;color:#0f172a">'+_ushEsc(a.name||'--')+'</div>'
      +'<div style="font-size:11px;color:#94a3b8;font-family:\'JetBrains Mono\',monospace">'+_ushEsc(a.admNo||'--')+'</div></div></div></td>'
      +'<td style="padding:11px 14px;font-size:13px;color:#334155">'+_ushEsc(a.cls||'--')+'</td>'
      +'<td style="padding:11px 14px">'+_ushBadge(a.status||'--',col)+'</td>'
      +'<td style="padding:11px 14px;font-size:12px;color:#64748b;font-family:\'JetBrains Mono\',monospace">'+_ushEsc(a.phone||'--')+'</td>'
      +'<td style="padding:11px 14px;font-size:12px;color:#64748b">'+_ushFmt(a.date)+'</td>'
      +'<td style="padding:11px 14px">'
      +(a.status==='Admitted'&&!enrolled?'<button onclick="_ushEnrollApp('+parseInt(a.id,10)+')" style="padding:5px 13px;background:#dcfce7;color:#16a34a;border:1.5px solid #86efac;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">✓ Enroll All</button>':'')
      +(enrolled?_ushBadge('Enrolled','#16a34a'):'')
      +'</td></tr>';
  }).join(''):'<tr><td colspan="6" style="text-align:center;padding:48px;color:#94a3b8">No applications found</td></tr>';
  return toolbar
    +'<div style="background:#fff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.05)">'
    +'<table style="width:100%;border-collapse:collapse">'
    +'<thead><tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0">'
    +['Applicant','Class','Status','Phone','Date','Action'].map(function(h){return'<th style="padding:11px 14px;text-align:left;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em">'+h+'</th>';}).join('')
    +'</tr></thead><tbody>'+rows+'</tbody></table></div>';
}
// -- TAB: FEE RECORDS (all 7 types unified) -----------------------------
function _ushRenderFees() {
  var TYPE_COLORS={Monthly:'#1433a8','Full Pay':'#7c3aed',Admission:'#16a34a',Advance:'#d97706',Items:'#0891b2','Fee Group':'#be185d',Manual:'#475569',Online:'#6366f1'};
  // Gather all records from every store
  var allRecs=[];
  function pushRecs(arr, type) {
    (arr||[]).forEach(function(r){
      allRecs.push({
        date:r.date||r.createdAt||'', student:r.student||r.studentName||'--',
        course:r.course||r.cls||r.groupName||r.feeType||r.forMonth||'--',
        amount:r.amountPaid||r.totalAmount||r.amount||0,
        receipt:r.receipt||'--', type:type, id:r.id||''
      });
    });
  }
  if(typeof loadMonthlyRecords==='function')    pushRecs(loadMonthlyRecords(),'Monthly');
  if(typeof loadFullPaymentRecords==='function') pushRecs(loadFullPaymentRecords(),'Full Pay');
  if(typeof loadAdmissionRecords==='function')  pushRecs(loadAdmissionRecords(),'Admission');
  if(typeof loadAdvanceFeeRecords==='function') pushRecs(loadAdvanceFeeRecords(),'Advance');
  if(typeof loadItemRecords==='function')       pushRecs(loadItemRecords(),'Items');
  if(typeof loadFeeGroupRecords==='function')   pushRecs(loadFeeGroupRecords(),'Fee Group');
  if(typeof loadManualFeeRecords==='function')  pushRecs(loadManualFeeRecords(),'Manual');
  // Online gateway transactions
  if(typeof _fmcLoadTxns==='function') {
    (_fmcLoadTxns()||[]).filter(function(t){return t.status==='Success';}).forEach(function(t){
      allRecs.push({date:t.ts||t.date||'',student:t.studentName||t.name||'--',course:'Online Gateway',amount:parseFloat(t.amount)||0,receipt:t.txnId||t.id||'--',type:'Online',id:t.id||''});
    });
  }
  allRecs.sort(function(a,b){return (b.date||'').localeCompare(a.date||'');});
  var q=(_ush.search||'').toLowerCase();
  var typeFilter=_ush.feeTab||'all';
  var filtered=allRecs.filter(function(r){
    var mq=!q||(r.student||'').toLowerCase().includes(q)||(r.receipt||'').toLowerCase().includes(q)||(r.course||'').toLowerCase().includes(q);
    var tf=typeFilter==='all'||r.type===typeFilter;
    return mq&&tf;
  });
  var total=filtered.reduce(function(t,r){return t+(r.amount||0);},0);
  // Type filter pills
  var types=['all','Monthly','Full Pay','Admission','Advance','Items','Fee Group','Manual','Online'];
  var pills='<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">'
    +types.map(function(t){
      var active=typeFilter===t;
      var col=TYPE_COLORS[t]||'#1433a8';
      return '<div onclick="_ush.feeTab=\''+t+'\';_ushRefresh()" style="padding:5px 14px;border-radius:20px;cursor:pointer;font-size:12px;font-weight:700;font-family:\'DM Sans\',sans-serif;'
        +(active?'background:'+col+';color:#fff':'background:'+col+'18;color:'+col+';border:1px solid '+col+'33')+'">'+t+'</div>';
    }).join('')+'</div>';
  var toolbar='<div style="display:flex;gap:10px;align-items:center;margin-bottom:12px">'
    +'<div style="position:relative;flex:1"><span style="position:absolute;left:11px;top:50%;transform:translateY(-50%);color:#94a3b8">🔍</span>'
    +'<input placeholder="Search student, receipt, course…" value="'+_ushEsc(_ush.search)+'" oninput="_ush.search=this.value;_ushRefresh()" style="width:100%;padding:9px 12px 9px 34px;border-radius:9px;border:1.5px solid #e2e8f0;font-size:13px;background:#f8fafc;box-sizing:border-box"/></div>'
    +'<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:9px;padding:9px 16px;font-size:13px;font-weight:700;color:#059669;white-space:nowrap">Total: '+_ushAmt(total)+'</div>'
    +'<span style="font-size:12px;color:#94a3b8;white-space:nowrap">'+filtered.length+' records</span>'
    +'</div>';
  var rows=filtered.length?filtered.map(function(r){
    var col=TYPE_COLORS[r.type]||'#64748b';
    return '<tr style="border-bottom:1px solid #f1f5f9" onmouseover="this.style.background=\'#f8fafc\'" onmouseout="this.style.background=\'\'">'
      +'<td style="padding:9px 14px;font-size:11px;color:#94a3b8;font-family:\'JetBrains Mono\',monospace">'+_ushEsc((r.date||'').slice(0,10))+'</td>'
      +'<td style="padding:9px 14px"><span style="padding:2px 9px;border-radius:12px;font-size:11px;font-weight:700;background:'+col+'18;color:'+col+'">'+_ushEsc(r.type)+'</span></td>'
      +'<td style="padding:9px 14px;font-weight:700;font-size:13px;color:#0f172a">'+_ushEsc(r.student)+'</td>'
      +'<td style="padding:9px 14px;font-size:12px;color:#64748b">'+_ushEsc(r.course)+'</td>'
      +'<td style="padding:9px 14px;font-weight:800;color:#059669;font-family:\'JetBrains Mono\',monospace">'+_ushAmt(r.amount)+'</td>'
      +'<td style="padding:9px 14px;font-size:11px;color:#94a3b8;font-family:\'JetBrains Mono\',monospace">'+_ushEsc(r.receipt)+'</td>'
      +'<td style="padding:9px 14px">'
      +(r.id?'<button onclick="reprintAny(\''+_ushEsc(r.id)+'\',\''+_ushEsc(r.type)+'\')" style="padding:4px 10px;background:#eff6ff;color:#1433a8;border:1px solid #bfdbfe;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">🖨 Reprint</button>':'')
      +'</td></tr>';
  }).join(''):'<tr><td colspan="7" style="text-align:center;padding:48px;color:#94a3b8">No records found</td></tr>';
  return pills+toolbar
    +'<div style="background:#fff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.05)">'
    +'<table style="width:100%;border-collapse:collapse">'
    +'<thead><tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0">'+['Date','Type','Student','Detail','Amount','Receipt',''].map(function(h){return'<th style="padding:10px 14px;text-align:left;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em">'+h+'</th>';}).join('')+'</tr></thead>'
    +'<tbody>'+rows+'</tbody></table></div>';
}
</script>
<!-- ═══════════════════════════════════════════════════════════
     GNSI FEE SYSTEM PATCH v2.0 — Auto-injected
     ═══════════════════════════════════════════════════════════ -->
<script>
/* ═══════════════════════════════════════════════════════════════════════════
   GNSI FEE SYSTEM PATCH v2.0
   Paste this <script> block just before </body> in GNSI_Portal_v60.html
   Adds / Fixes:
   01  Universal Phase I flat fee  ₹5,500 (same for all courses, months 1–2)
   02  Flat admission fee          ₹6,000 for all
   03  Admission Package counter   Admission + Dress Kit (5 items) + Prospectus
   04  Admin Dress Kit catalogue   Item names & prices set by admin in Config tab
   05  Prospectus fee type         ₹200 dedicated payment type
   06  Repeater Group              Flag, Renewal fee ₹2,000, ₹500 monthly discount
   07  Student Fee Profile tab     Month-wise history inside student profile modal
   08  Role-gated defaulter panel  Admin & Accounts only
   09  Entrance → Fee linkage      "Admit & Collect Fee" on entrance records
   10  Combined (Nav+Sai) course   Added to GNSI_COURSES with subtypes
   11  Teachers Day + extra fees   Added to manual fee type defaults
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  /* ─── PATCH CONFIG — change amounts here ────────────────────────────────── */
  var PC = {
    PHASE1_FEE:        5500,
    ADM_FEE:           6000,
    PROSPECTUS_FEE:     200,
    RENEWAL_FEE:       2000,
    REPEATER_DISCOUNT:  500,
  };
  /* ─── SAFE ESC HELPER (works even if portal esc not loaded yet) ─────────── */
  function _e(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  /* ─── TOAST (safe wrapper) ──────────────────────────────────────────────── */
  function _toast(msg, col) {
    if (typeof showToast === 'function') showToast(msg, col || '#1433a8');
    else (void 0);
  }
  /* ═══════════════════════════════════════════════════════════════════════════
     SECTION A — DATA HELPERS
  ═══════════════════════════════════════════════════════════════════════════ */
  /* ── Dress Kit ── */
  function _dressLoad() {
    try { return JSON.parse(localStorage.getItem('gnsi_patch_dress') || 'null'); } catch (e) { return null; }
  }
  function _dressSave(items) {
    localStorage.setItem('gnsi_patch_dress', JSON.stringify(items));
    if (typeof gnsiKVPush === 'function') try { gnsiKVPush('gnsi_patch_dress', items); } catch (e) {}
  }
  function _dressDefaults() {
    return [
      { id: 'dk1', name: 'Aqua T-Shirt',     price: 450, qty: 1 },
      { id: 'dk2', name: 'Blue T-Shirt',      price: 450, qty: 1 },
      { id: 'dk3', name: 'Track Suit',        price: 900, qty: 1 },
      { id: 'dk4', name: 'Track Pant',        price: 600, qty: 1 },
      { id: 'dk5', name: 'Track Suit (set 2)',price: 600, qty: 1 },
    ];
  }
  function _dressItems() { return _dressLoad() || _dressDefaults(); }
  function _dressTotal() { return _dressItems().reduce(function (s, i) { return s + i.price * i.qty; }, 0); }
  /* ── Repeater flag ── */
  function _isRepeater(stuId) {
    if (!stuId || typeof stuLoadExtra !== 'function') return false;
    var ex = stuLoadExtra(String(stuId));
    return !!(ex && (ex.isRepeater === true || ex.isRepeater === 'true'));
  }
  function _setRepeater(stuId, val) {
    if (!stuId || typeof stuLoadExtra !== 'function') return;
    var ex = stuLoadExtra(String(stuId)) || {};
    ex.isRepeater = !!val;
    if (typeof stuSaveExtra === 'function') stuSaveExtra(String(stuId), ex);
  }
  /* ─── Expose for inline HTML handlers ─────────────────────────────────── */
  window.gnsiPatchToggleRepeater = function (stuId) {
    var cur = _isRepeater(stuId);
    _setRepeater(stuId, !cur);
    _toast(cur ? 'Repeater tag removed' : 'Marked as Repeater ✅', '#854d0e');
    if (typeof render === 'function') render();
  };
  /* ═══════════════════════════════════════════════════════════════════════════
     SECTION B — OVERRIDE loadFeeConf
     Forces ₹6,000 admission across all courses, adds extra manual fee types
  ═══════════════════════════════════════════════════════════════════════════ */
  if (typeof loadFeeConf === 'function') {
    var _origLoadFeeConf = loadFeeConf;
    loadFeeConf = function () {
      var conf = _origLoadFeeConf();
      /* Force flat ₹6,000 admission for all courses */
      if (conf && Array.isArray(conf.admissionFees)) {
        conf.admissionFees = conf.admissionFees.map(function (f) {
          return Object.assign({}, f, { amount: PC.ADM_FEE });
        });
      }
      /* Ensure extra fee types exist */
      var extras = ['Teachers Day Collection', 'Annual Exam Fee', 'Test / Assessment Fee',
        'Activity Fee', 'Sports Day Fee', 'Competition Fee'];
      var mt = conf.manualFeeTypes || [];
      extras.forEach(function (t) { if (mt.indexOf(t) < 0) mt.push(t); });
      conf.manualFeeTypes = mt;
      return conf;
    };
  }
  /* ═══════════════════════════════════════════════════════════════════════════
     SECTION C — OVERRIDE _fmcCalcFee
     Phase I: universal ₹5,500 flat (ignores course)
     Phase II: apply ₹500 repeater discount
  ═══════════════════════════════════════════════════════════════════════════ */
  if (typeof _fmcCalcFee === 'function') {
    var _origCalcFee = _fmcCalcFee;
    _fmcCalcFee = function (asgn, monthIdx) {
      /* ── Phase boundary: count months from February 2026 origin ──────────
         monthIdx (1-based) is relative to the academic year start = Feb 2026.
         Phase I  = months 1–2  (February, March)  → flat ₹5,500, no course needed
         Phase II = month 3+    (April onward)       → requires subTypeId + courseAssignedAt
         If course/subtype NOT yet assigned in month 3+, keep Phase I rate until assigned.
      ──────────────────────────────────────────────────────────────────────── */
      var FEB2026 = new Date(2026, 1, 1); /* February 2026 */
      var enrollDate = asgn.enrolledAt ? new Date(asgn.enrolledAt) : FEB2026;
      /* Compute monthIdx relative to February 2026 origin */
      var originDate = (enrollDate < FEB2026) ? FEB2026 : enrollDate;
      /* For fee-calendar purposes, monthIdx passed in is already relative to enrollment.
         Re-derive calendar-based phase index from origin month. */
      var now = new Date();
      var calMonthIdx = (now.getFullYear() - originDate.getFullYear()) * 12
                        + (now.getMonth() - originDate.getMonth()) + 1;
      /* Use whichever monthIdx is passed in, but clamp phase check to calendar */
      var effectiveIdx = monthIdx || calMonthIdx;
      var isPhase2 = asgn.subTypeId && asgn.courseAssignedAt && effectiveIdx >= 3;
      /* ── Phase I: universal flat ─── */
      if (!isPhase2) {
        var admFee = PC.ADM_FEE;
        try {
          var conf = (typeof loadFeeConf === 'function') ? loadFeeConf() : {};
          var cf = (conf.admissionFees || []).find(function (f) { return f.course === asgn.className; });
          if (cf) admFee = cf.amount;
        } catch (e) {}
        var p1breakdown = ['Phase I flat ₹' + PC.PHASE1_FEE.toLocaleString('en-IN')];
        if (!asgn.subTypeId || !asgn.courseAssignedAt) {
          p1breakdown.push('⚠ Course/subtype not yet assigned — Phase I rate applied');
        }
        return {
          flat: PC.PHASE1_FEE, hostelAdd: 0, courseFee: 0,
          total: PC.PHASE1_FEE,
          breakdown: p1breakdown,
          admFee: admFee
        };
      }
      /* ── Phase II: call original, then apply repeater discount ─── */
      var result = _origCalcFee(asgn, monthIdx);
      if (_isRepeater(asgn.stuId)) {
        result.total = Math.max(0, (result.total || 0) - PC.REPEATER_DISCOUNT);
        result.breakdown = (result.breakdown || []).concat(['Repeater -₹' + PC.REPEATER_DISCOUNT]);
      }
      return result;
    };
  }
  /* ═══════════════════════════════════════════════════════════════════════════
     SECTION D — ADD Combined (Nav+Sai) to GNSI_COURSES
  ═══════════════════════════════════════════════════════════════════════════ */
  (function addCombinedCourse() {
    function inject() {
      if (typeof GNSI_COURSES === 'undefined') return;
      if (GNSI_COURSES.some(function (c) { return c.id === 'combined_navsai'; })) return;
      GNSI_COURSES.push({
        id: 'combined_navsai', name: 'Combined (Nav + Sai)', icon: '🎯',
        subTypes: [
          { id: 'combined_boarder',    label: 'Boarder',     icon: '🏠', monthlyFee: 13000 },
          { id: 'combined_dayboarder', label: 'Day Boarder', icon: '🔄', monthlyFee: 11000 },
          { id: 'combined_dayscholar', label: 'Day Scholar', icon: '🚌', monthlyFee: 9000  },
        ]
      });
    }
    inject();
    /* Retry after 1 s in case GNSI_COURSES loads late */
    setTimeout(inject, 1000);
  })();
  /* ═══════════════════════════════════════════════════════════════════════════
     SECTION E — DRESS KIT ADMIN UI (injected into Config tab)
  ═══════════════════════════════════════════════════════════════════════════ */
  window.gnsiPatchRenderDressKitAdmin = function () {
    var items = _dressItems();
    var total = _dressTotal();
    var rows = items.map(function (item, idx) {
      return '<div style="display:grid;grid-template-columns:1fr 100px 60px;gap:8px;margin-bottom:8px;align-items:center">'
        + '<input id="gnsi-dk-name-' + idx + '" value="' + _e(item.name) + '" placeholder="Item name"'
        + ' style="border:1.5px solid var(--border);border-radius:8px;padding:7px 10px;font-size:13px;background:var(--surface);color:var(--text)"/>'
        + '<input id="gnsi-dk-price-' + idx + '" type="number" value="' + item.price + '" min="0"'
        + ' style="border:1.5px solid var(--border);border-radius:8px;padding:7px 10px;font-size:13px;background:var(--surface);color:var(--text)"/>'
        + '<input id="gnsi-dk-qty-' + idx + '" type="number" value="' + item.qty + '" min="1" max="10"'
        + ' style="border:1.5px solid var(--border);border-radius:8px;padding:7px 10px;font-size:13px;background:var(--surface);color:var(--text)"/>'
        + '</div>';
    }).join('');
    return '<div class="card" style="margin-top:18px">'
      + '<div class="card-head"><span class="card-title">👕 Dress Kit Items</span>'
      + '<span style="font-size:11px;color:var(--muted)">Set per-item price — appears on Admission Package receipt</span></div>'
      + '<div style="padding:16px">'
      + '<div style="display:grid;grid-template-columns:1fr 100px 60px;gap:8px;margin-bottom:8px">'
      + '<span style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase">Item Name</span>'
      + '<span style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase">Price (₹)</span>'
      + '<span style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase">Qty</span>'
      + '</div>'
      + rows
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;padding-top:12px;border-top:1px solid var(--border)">'
      + '<div style="font-weight:800;font-size:15px">Total: <span style="color:#15803d">₹' + total.toLocaleString('en-IN') + '</span></div>'
      + '<button onclick="gnsiPatchSaveDressKit(' + items.length + ')"'
      + ' style="background:#1433a8;color:#fff;border:none;border-radius:8px;padding:8px 20px;font-size:13px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">'
      + '💾 Save Dress Kit</button>'
      + '</div></div></div>';
  };
  window.gnsiPatchSaveDressKit = function (count) {
    var items = [];
    for (var i = 0; i < count; i++) {
      var n = (document.getElementById('gnsi-dk-name-' + i) || {}).value || ('Item ' + (i + 1));
      var p = parseInt((document.getElementById('gnsi-dk-price-' + i) || {}).value) || 0;
      var q = parseInt((document.getElementById('gnsi-dk-qty-' + i) || {}).value) || 1;
      items.push({ id: 'dk' + (i + 1), name: n.trim(), price: p, qty: q });
    }
    _dressSave(items);
    _toast('Dress kit saved ✅', '#15803d');
    if (typeof render === 'function') render();
  };
  /* Inject into _fmcRenderConfig */
  if (typeof _fmcRenderConfig === 'function') {
    var _origRenderConfig = _fmcRenderConfig;
    _fmcRenderConfig = function () {
      return _origRenderConfig() + (typeof gnsiPatchRenderDressKitAdmin === 'function' ? gnsiPatchRenderDressKitAdmin() : '');
    };
  }
  /* ═══════════════════════════════════════════════════════════════════════════
     SECTION F — ADMISSION PACKAGE FORM + SAVE + PRINT RECEIPT
  ═══════════════════════════════════════════════════════════════════════════ */
  window.gnsiPatchRenderAdmPackageForm = function (asgnId) {
    var items = _dressItems();
    var dressTotal = _dressTotal();
    var grand = PC.ADM_FEE + dressTotal + PC.PROSPECTUS_FEE;
    var today = new Date().toISOString().split('T')[0];
    var modes = ['Cash', 'UPI', 'Cheque', 'NEFT/RTGS', 'DD', 'Online Gateway']
      .map(function (m) { return '<option>' + m + '</option>'; }).join('');
    var itemRows = items.map(function (it) {
      return '<tr style="border-bottom:0.5px solid #e2e8f0">'
        + '<td style="padding:5px 10px;color:#555">&nbsp;&nbsp;' + _e(it.name) + (it.qty > 1 ? ' ×' + it.qty : '') + '</td>'
        + '<td style="padding:5px 10px;text-align:right;color:#555">₹' + (it.price * it.qty).toLocaleString('en-IN') + '</td></tr>';
    }).join('');
    return '<div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:12px;padding:18px;margin-bottom:16px">'
      + '<div style="font-weight:800;font-size:15px;color:#15803d;margin-bottom:14px">🎓 Admission Package — New Student</div>'
      + '<table style="width:100%;font-size:13px;border-collapse:collapse;margin-bottom:14px">'
      + '<thead><tr style="background:#dcfce7"><th style="padding:7px 10px;text-align:left;border-radius:6px 0 0 0">Component</th><th style="padding:7px 10px;text-align:right;border-radius:0 6px 0 0">Amount (₹)</th></tr></thead>'
      + '<tbody>'
      + '<tr style="border-bottom:0.5px solid #e2e8f0"><td style="padding:7px 10px;font-weight:700">Admission Fee</td><td style="padding:7px 10px;text-align:right;font-weight:700">₹' + PC.ADM_FEE.toLocaleString('en-IN') + '</td></tr>'
      + '<tr style="border-bottom:0.5px solid #e2e8f0"><td style="padding:7px 10px;font-weight:700">Dress Kit</td><td style="padding:7px 10px;text-align:right;font-weight:700">₹' + dressTotal.toLocaleString('en-IN') + '</td></tr>'
      + itemRows
      + '<tr style="border-bottom:0.5px solid #e2e8f0"><td style="padding:7px 10px">Prospectus</td><td style="padding:7px 10px;text-align:right">₹' + PC.PROSPECTUS_FEE + '</td></tr>'
      + '<tr style="background:#fffbeb"><td style="padding:6px 10px;font-size:12px;color:#854d0e">⬆ Advance Fee</td><td style="padding:6px 10px;text-align:right;font-size:12px;color:#854d0e;font-style:italic">enter below</td></tr>'
      + '<tr style="background:#dcfce7;font-weight:800"><td style="padding:8px 10px">Package Sub-total</td><td style="padding:8px 10px;text-align:right;color:#15803d;font-size:15px">₹' + grand.toLocaleString('en-IN') + ' + Adv</td></tr>'
      + '</tbody></table>'
      + '<div class="form-grid g3" style="margin-bottom:12px">'
      + '<div class="form-group"><label>Payment Date</label><input type="date" id="gnsi-adm-date" value="' + today + '"/></div>'
      + '<div class="form-group"><label>Payment Mode</label><select id="gnsi-adm-mode">' + modes + '</select></div>'
      + '<div class="form-group"><label>Txn / Ref No.</label><input id="gnsi-adm-txn" placeholder="UPI/Cheque ref (optional)"/></div>'
      + '<div class="form-group" style="grid-column:span 3"><label>Remarks</label><input id="gnsi-adm-remark" placeholder="Optional"/></div>'
      + '</div>'
      + '<div style="background:#fffbeb;border:1.5px solid #fde047;border-radius:10px;padding:12px 14px;margin-bottom:14px">'
      + '<div style="font-size:11px;font-weight:800;color:#854d0e;text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px">\u23eb Advance Fee <span style="font-weight:400;font-size:10.5px">(optional \u2014 collected with admission package)</span></div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
      + '<div class="form-group" style="margin:0"><label>Advance Amount (\u20b9)</label><input type="number" id="gnsi-adm-adv-amount" min="0" placeholder="0 if none"/></div>'
      + '<div class="form-group" style="margin:0"><label>Advance For</label><input id="gnsi-adm-adv-for" placeholder="e.g. First month / Phase I"/></div>'
      + '</div></div>'
      + '<div class="form-actions">'
      + '<button class="btn btn-primary" style="background:#15803d" onclick="gnsiPatchSaveAdmPackage(\'' + asgnId + '\')">✅ Record &amp; Print Receipt</button>'
      + '<button class="btn btn-outline" onclick="_fmc.asgnId=null;render()">Cancel</button>'
      + '</div></div>';
  };
  window.gnsiPatchSaveAdmPackage = function (asgnId) {
    if (!asgnId) { alert('No student selected.'); return; }
    var asgns = (typeof _fmcLoadAsgns === 'function') ? _fmcLoadAsgns() : [];
    var a = asgns.find(function (x) { return x.id === asgnId; });
    if (!a) { alert('Assignment not found.'); return; }
    var date  = (document.getElementById('gnsi-adm-date') || {}).value  || new Date().toISOString().split('T')[0];
    var mode  = (document.getElementById('gnsi-adm-mode') || {}).value  || 'Cash';
    var txn   = (document.getElementById('gnsi-adm-txn')  || {}).value  || '';
    var rem   = (document.getElementById('gnsi-adm-remark')|| {}).value  || '';
    /* Advance (optional) */
    var advAmt = parseInt((document.getElementById('gnsi-adm-adv-amount') || {}).value || 0) || 0;
    var advFor = ((document.getElementById('gnsi-adm-adv-for') || {}).value || '').trim() || 'Advance';
    var items = _dressItems();
    var dressTotal = _dressTotal();
    var grand = PC.ADM_FEE + dressTotal + PC.PROSPECTUS_FEE;
    var grandWithAdv = grand + advAmt;
    var cols  = (typeof _fmcLoadCols === 'function') ? _fmcLoadCols() : [];
    var now   = new Date().toISOString();
    var byWho = (typeof currentUser !== 'undefined' && currentUser) ? (currentUser.name || 'Admin') : 'Admin';
    var rBase = (typeof _fmcNextReceipt === 'function') ? _fmcNextReceipt('ADM') : ('ADM' + Date.now());
    /* Save 3 core records */
    cols.push({ id: 'pk_adm_' + Date.now(), asgnId: asgnId, stuId: a.stuId,
      studentName: a.studentName || a.name || '', feeType: 'admission',
      feeLabel: 'Admission Fee', amountPaid: PC.ADM_FEE,
      date: date, mode: mode, txnRef: txn, remark: rem,
      receipt: rBase + '-A', collectedBy: byWho, createdAt: now, isAdmPackage: true });
    cols.push({ id: 'pk_drk_' + Date.now(), asgnId: asgnId, stuId: a.stuId,
      studentName: a.studentName || a.name || '', feeType: 'item',
      feeLabel: 'Dress Kit', itemsList: items, amountPaid: dressTotal,
      date: date, mode: mode, txnRef: txn, remark: rem,
      receipt: rBase + '-D', collectedBy: byWho, createdAt: now, isAdmPackage: true });
    cols.push({ id: 'pk_pro_' + Date.now(), asgnId: asgnId, stuId: a.stuId,
      studentName: a.studentName || a.name || '', feeType: 'manual',
      feeLabel: 'Prospectus Fee', amountPaid: PC.PROSPECTUS_FEE,
      date: date, mode: mode, txnRef: txn, remark: rem,
      receipt: rBase + '-P', collectedBy: byWho, createdAt: now, isAdmPackage: true });
    /* Save advance record if provided */
    if (advAmt > 0) {
      cols.push({ id: 'pk_adv_' + Date.now(), asgnId: asgnId, stuId: a.stuId,
        studentName: a.studentName || a.name || '', feeType: 'advance',
        feeLabel: 'Advance — ' + advFor, amountPaid: advAmt,
        date: date, mode: mode, txnRef: txn, remark: rem,
        receipt: rBase + '-V', collectedBy: byWho, createdAt: now,
        isAdmPackage: true, advanceFor: advFor });
      /* Update assignment with advancePaid */
      asgns = asgns.map(function(x){
        return x.id === asgnId ? Object.assign({}, x, { advancePaid: (x.advancePaid||0) + advAmt }) : x;
      });
      if (typeof _fmcSaveAsgns === 'function') _fmcSaveAsgns(asgns);
    }
    if (typeof _fmcSaveCols === 'function') _fmcSaveCols(cols);
    if (typeof gnsiCMSyncFeeStatus === 'function') gnsiCMSyncFeeStatus(a.stuId, 'Paid', 'admission');
    gnsiActivity('Admission Fee', (a.studentName||a.name||'')+' ₹'+grandWithAdv, 'fees');
    if (typeof acLog === 'function') acLog('Admission Package', (a.studentName || a.name || '') + ' ₹' + grandWithAdv + (advAmt > 0 ? ' (incl. Advance ₹' + advAmt + ')' : ''));
    _toast('Admission package recorded ✅' + (advAmt > 0 ? ' + Advance ₹' + advAmt.toLocaleString('en-IN') : ''), '#15803d');
    _gnsiPatchPrintAdmReceipt(a, items, date, mode, txn, rBase, grand, dressTotal, advAmt, advFor);
    if (typeof render === 'function') render();
  };
  function _gnsiPatchPrintAdmReceipt(a, items, date, mode, txn, receiptNo, grand, dressTotal, advAmt, advFor) {
    advAmt = advAmt || 0;
    advFor = advFor || '';
    var win = window.open('', '_blank', 'width=520,height=820');
    if (!win) { _toast('Allow popups to print receipt', '#dc2626'); return; }
    var dateStr = date ? new Date(date).toLocaleDateString('en-IN', {day:'2-digit',month:'long',year:'numeric'}) : new Date().toLocaleDateString('en-IN', {day:'2-digit',month:'long',year:'numeric'});
    var modeLine = _e(mode || 'Cash');
    if (txn) modeLine += ' &nbsp;<span style="font-family:monospace;font-size:11px;background:#f1f5f9;padding:2px 6px;border-radius:4px;color:#475569">' + _e(txn) + '</span>';
    /* Item rows */
    var iRows = items.map(function (it) {
      var qty = it.qty || it.quantity || 1;
      var lineAmt = it.price ? it.price * qty : (it.amount || 0);
      var desc = _e(it.name || 'Item');
      if (qty > 1) desc += ' &nbsp;<span style="color:#9ca3af;font-size:10.5px">\xd7' + qty + ' @ \u20b9' + (it.price || 0).toLocaleString('en-IN') + '</span>';
      return '<tr><td style="padding:8px 12px;font-weight:500">' + desc + '</td>'
        + '<td style="padding:8px 12px;text-align:right">\u20b9' + Number(lineAmt).toLocaleString('en-IN') + '</td></tr>';
    }).join('');
    /* Amount in words */
    function _inWords(n) {
      n = Math.round(n || 0);
      if (n === 0) return 'Zero';
      var ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
      var tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
      function h(num) {
        if (num === 0) return '';
        if (num < 20) return ones[num] + ' ';
        if (num < 100) return tens[Math.floor(num/10)] + ' ' + (num%10 ? ones[num%10] + ' ' : '');
        return ones[Math.floor(num/100)] + 'Hundred ' + (num%100 ? h(num%100) : '');
      }
      var parts = [];
      if (n >= 10000000) { parts.push(h(Math.floor(n/10000000)) + 'Crore'); n %= 10000000; }
      if (n >= 100000)   { parts.push(h(Math.floor(n/100000))   + 'Lakh');  n %= 100000; }
      if (n >= 1000)     { parts.push(h(Math.floor(n/1000))     + 'Thousand'); n %= 1000; }
      if (n > 0) parts.push(h(n));
      return parts.join(' ').replace(/\s+/g, ' ').trim() + ' Only';
    }
    var tc = '#15803d';
    win.document.write('<!DOCTYPE html><html><head><title>Admission Receipt — GNSI</title>'
      + '<style>'
      + '*{margin:0;padding:0;box-sizing:border-box}'
      + 'body{font-family:"Segoe UI",Arial,sans-serif;background:#f4f6fb;display:flex;align-items:flex-start;justify-content:center;padding:24px 12px;min-height:100vh}'
      + '.receipt{background:#fff;width:460px;border-radius:12px;box-shadow:0 4px 32px rgba(21,128,61,.13);overflow:hidden;border:1.5px solid #e5e7eb}'
      + '.banner{background:linear-gradient(135deg,#15803d 0%,#16a34acc 100%)}'
      + '.banner-top{display:flex;align-items:center;justify-content:space-between;padding:16px 20px 10px}'
      + '.school-logo{width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0}'
      + '.school-name{font-size:13.5px;font-weight:800;color:#fff;letter-spacing:.04em;text-transform:uppercase;text-align:center}'
      + '.school-addr{font-size:10px;color:rgba(255,255,255,.82);margin-top:2px;text-align:center}'
      + '.band{background:rgba(0,0,0,.18);padding:8px 20px;display:flex;align-items:center;justify-content:space-between}'
      + '.band-label{font-size:12.5px;font-weight:800;color:#fff;letter-spacing:.06em;text-transform:uppercase}'
      + '.rcpt-badge{font-size:11px;font-weight:700;color:#fff;font-family:monospace;background:rgba(255,255,255,.2);padding:3px 10px;border-radius:20px}'
      + '.meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;border-bottom:1.5px solid #e5e7eb}'
      + '.mc{padding:10px 16px;border-right:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb}'
      + '.mc:nth-child(even){border-right:none}'
      + '.mc.full{grid-column:1/-1;border-right:none}'
      + '.ml{font-size:9.5px;color:#9ca3af;text-transform:uppercase;letter-spacing:.07em;margin-bottom:3px}'
      + '.mv{font-size:13px;font-weight:700;color:#111827}'
      + '.mv.big{font-size:15px}'
      + '.mv.accent{color:'+tc+'}'
      + 'table.items{width:100%;border-collapse:collapse}'
      + 'table.items thead tr{background:#f0fdf4}'
      + 'table.items th{padding:8px 12px;font-size:10.5px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;border-bottom:1.5px solid #e5e7eb}'
      + 'table.items th:last-child,table.items td:last-child{text-align:right}'
      + 'table.items tbody tr{border-bottom:1px solid #f3f4f6}'
      + '.sub-row td{padding:5px 12px 5px 24px;color:#6b7280;font-size:11.5px}'
      + '.total-row td{padding:11px 12px;font-weight:800;font-size:14px;color:'+tc+';border-top:2px solid #bbf7d0;background:#f0fdf4}'
      + '.words{padding:10px 16px;font-size:11px;color:#6b7280;background:#f9fafb;border-top:1px dashed #e5e7eb;font-style:italic}'
      + '.foot{display:grid;grid-template-columns:1fr 1fr;border-top:1.5px solid #e5e7eb}'
      + '.fc{padding:10px 16px;border-right:1px solid #e5e7eb;font-size:11.5px}'
      + '.fc:last-child{border-right:none}'
      + '.fl{font-size:9.5px;color:#9ca3af;text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px}'
      + '.seal-zone{padding:18px 20px 14px;border-top:1.5px solid #e5e7eb;display:flex;justify-content:space-between;align-items:flex-end}'
      + '.sig{text-align:center;width:140px}'
      + '.sig-line{border-top:1.5px solid #374151;margin-bottom:5px;height:38px}'
      + '.sig-lbl{font-size:10px;color:#6b7280;font-weight:600}'
      + '.seal{width:72px;height:72px;border-radius:50%;border:2px dashed #d1d5db;display:flex;align-items:center;justify-content:center;color:#d1d5db;font-size:10px;text-align:center;padding:8px;line-height:1.3}'
      + '.tagline{text-align:center;padding:8px 16px 12px;font-size:10px;color:#9ca3af;border-top:1px dashed #e5e7eb}'
      + '.no-print{text-align:center;padding:16px}'
      + '@media print{body{background:#fff;padding:0}.receipt{box-shadow:none;border-radius:0;border:none;width:100%}.no-print{display:none}}'
      + '</style></head><body>'
      + '<div class="receipt">'
      /* Banner */
      + '<div class="banner">'
      + '<div class="banner-top">'
      + '<div class="school-logo">🎓</div>'
      + '<div style="flex:1;padding:0 12px"><div class="school-name">'+(window.TENANT?window.TENANT.name:'Guidance Navodaya &amp; Sainik Institute')+'</div><div class="school-addr">'+(window.TENANT?window.TENANT.address+' — '+window.TENANT.pincode:'Khangabok Sorok Wangma, Thoubal, Manipur — 795127')+'</div></div>'
      + '<div class="school-logo" style="font-size:18px;color:#fff;font-weight:800;background:rgba(255,255,255,.15)">GNSI</div>'
      + '</div>'
      + '<div class="band">'
      + '<span class="band-label">🎓 Admission Package Receipt</span>'
      + '<span class="rcpt-badge">' + _e(receiptNo) + '</span>'
      + '</div></div>'
      /* Meta */
      + '<div class="meta-grid">'
      + '<div class="mc"><div class="ml">Date</div><div class="mv">' + _e(dateStr) + '</div></div>'
      + '<div class="mc"><div class="ml">Payment Mode</div><div class="mv">' + modeLine + '</div></div>'
      + '<div class="mc full"><div class="ml">Student Name</div><div class="mv big">' + _e(a.studentName || a.name || '') + '</div></div>'
      + '<div class="mc"><div class="ml">Class / Course</div><div class="mv accent">' + _e(a.className || '--') + '</div></div>'
      + '<div class="mc"><div class="ml">Adm. No.</div><div class="mv">' + _e(a.admNo || '--') + '</div></div>'
      + '</div>'
      /* Items */
      + '<div style="overflow-x:auto">'
      + '<table class="items">'
      + '<thead><tr><th style="text-align:left">Description</th><th>Amount (₹)</th></tr></thead>'
      + '<tbody>'
      + '<tr><td style="padding:8px 12px;font-weight:700">Admission Fee</td><td style="padding:8px 12px;text-align:right;font-weight:700">₹' + PC.ADM_FEE.toLocaleString('en-IN') + '</td></tr>'
      + '<tr><td style="padding:8px 12px;font-weight:700">Dress Kit</td><td style="padding:8px 12px;text-align:right;font-weight:700">₹' + Number(dressTotal).toLocaleString('en-IN') + '</td></tr>'
      + iRows
      + '<tr><td style="padding:8px 12px;color:#6b7280">Prospectus Fee</td><td style="padding:8px 12px;text-align:right;color:#6b7280">₹' + PC.PROSPECTUS_FEE.toLocaleString('en-IN') + '</td></tr>'
      + (advAmt > 0 ? '<tr><td style="padding:8px 12px;color:#854d0e;font-weight:700">⬆ Advance' + (advFor ? ' — ' + _e(advFor) : '') + '</td><td style="padding:8px 12px;text-align:right;color:#854d0e;font-weight:700">₹' + Number(advAmt).toLocaleString('en-IN') + '</td></tr>' : '')
      + '<tr class="total-row"><td>TOTAL AMOUNT</td><td>₹' + Number(grand + advAmt).toLocaleString('en-IN') + '</td></tr>'
      + '</tbody></table></div>'
      /* Amount in words */
      + '<div class="words">Rupees: <b>' + _e(_inWords(grand + advAmt)) + '</b></div>'
      /* Footer */
      + '<div class="foot">'
      + '<div class="fc"><div class="fl">Collected By</div><b>' + _e((typeof currentUser !== 'undefined' && currentUser) ? (currentUser.name || 'Admin') : 'Admin') + '</b></div>'
      + '<div class="fc"><div class="fl">Admission No.</div><b>' + _e(a.admNo || '--') + '</b></div>'
      + '</div>'
      /* Signature & Seal */
      + '<div class="seal-zone">'
      + '<div class="sig"><div class="sig-line"></div><div class="sig-lbl">Student / Parent Signature</div></div>'
      + '<div class="seal">OFFICE<br>SEAL</div>'
      + '<div class="sig"><div class="sig-line"></div><div class="sig-lbl">Authorised Signatory</div></div>'
      + '</div>'
      + '<div class="tagline">This is a computer-generated receipt · '+(window.TENANT?window.TENANT.shortName+', '+window.TENANT.city:'GNSI, Khangabok')+' · Keep for your records</div>'
      + '<div class="no-print"><button onclick="window.print()" style="padding:10px 32px;background:#15803d;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">🖨 Print</button></div>'
      + '</div>'
      + '</body></html>');
    win.document.close();
  }
  /* ═══════════════════════════════════════════════════════════════════════════
     SECTION G — RENEWAL FEE FORM + SAVE
  ═══════════════════════════════════════════════════════════════════════════ */
  window.gnsiPatchRenderRenewalForm = function (a) {
    var today = new Date().toISOString().split('T')[0];
    var isRep = _isRepeater(a.stuId);
    var modes = ['Cash', 'UPI', 'Cheque', 'NEFT/RTGS', 'DD']
      .map(function (m) { return '<option>' + m + '</option>'; }).join('');
    var html = '<div style="background:#fef9c3;border:1.5px solid #fde047;border-radius:12px;padding:18px;margin-bottom:16px">'
      + '<div style="font-weight:800;font-size:15px;color:#854d0e;margin-bottom:12px">🔄 Renewal Fee — Repeater Student</div>';
    if (!isRep) {
      html += '<div style="background:#fee2e2;border:1px solid #fca5a5;border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:12.5px;color:#dc2626">'
        + '⚠ This student is not marked as a Repeater.<br>Open their Student Profile and click <b>Mark as Repeater</b> first.</div>';
    }
    html += '<div style="font-size:13px;margin-bottom:14px">'
      + 'Renewal Fee: <span style="font-weight:800;font-size:15px;color:#854d0e">₹' + PC.RENEWAL_FEE.toLocaleString('en-IN') + '</span>'
      + ' &nbsp;+&nbsp; Phase I fee (₹' + PC.PHASE1_FEE.toLocaleString('en-IN') + '/month)'
      + ' &nbsp;+&nbsp; ₹' + PC.REPEATER_DISCOUNT + ' discount on Phase II monthly</div>'
      + '<div class="form-grid g3" style="margin-bottom:12px">'
      + '<div class="form-group"><label>Payment Date</label><input type="date" id="gnsi-ren-date" value="' + today + '"/></div>'
      + '<div class="form-group"><label>Payment Mode</label><select id="gnsi-ren-mode">' + modes + '</select></div>'
      + '<div class="form-group"><label>Txn / Ref No.</label><input id="gnsi-ren-txn" placeholder="Optional"/></div>'
      + '<div class="form-group" style="grid-column:span 3"><label>Remarks</label><input id="gnsi-ren-remark" placeholder="Optional"/></div>'
      + '</div>'
      + '<div class="form-actions">'
      + '<button class="btn btn-primary" style="background:#854d0e" onclick="gnsiPatchSaveRenewal(\'' + a.id + '\')">✅ Record Renewal Fee</button>'
      + '<button class="btn btn-outline" onclick="_fmc.asgnId=null;render()">Cancel</button>'
      + '</div></div>';
    return html;
  };
  window.gnsiPatchSaveRenewal = function (asgnId) {
    var asgns = (typeof _fmcLoadAsgns === 'function') ? _fmcLoadAsgns() : [];
    var a = asgns.find(function (x) { return x.id === asgnId; });
    if (!a) { alert('Assignment not found.'); return; }
    var date = (document.getElementById('gnsi-ren-date')   || {}).value || new Date().toISOString().split('T')[0];
    var mode = (document.getElementById('gnsi-ren-mode')   || {}).value || 'Cash';
    var txn  = (document.getElementById('gnsi-ren-txn')    || {}).value || '';
    var rem  = (document.getElementById('gnsi-ren-remark') || {}).value || '';
    var cols = (typeof _fmcLoadCols === 'function') ? _fmcLoadCols() : [];
    var rNo  = (typeof _fmcNextReceipt === 'function') ? _fmcNextReceipt('REN') : ('REN' + Date.now());
    var byWho = (typeof currentUser !== 'undefined' && currentUser) ? (currentUser.name || 'Admin') : 'Admin';
    cols.push({ id: 'ren_' + Date.now(), asgnId: asgnId, stuId: a.stuId,
      studentName: a.studentName || a.name || '', feeType: 'renewal',
      feeLabel: 'Renewal Fee (Repeater)', amountPaid: PC.RENEWAL_FEE,
      date: date, mode: mode, txnRef: txn, remark: rem,
      receipt: rNo, collectedBy: byWho, createdAt: new Date().toISOString() });
    if (typeof _fmcSaveCols === 'function') _fmcSaveCols(cols);
    if (typeof acLog === 'function') acLog('Renewal Fee', (a.studentName || a.name || '') + ' ₹' + PC.RENEWAL_FEE);
    _toast('Renewal fee recorded ✅', '#854d0e');
    if (typeof render === 'function') render();
  };
  /* ═══════════════════════════════════════════════════════════════════════════
     SECTION H — OVERRIDE _fmcRenderCounterForm
     Adds Admission Package + Renewal to pay-type tab bar
     Handles our custom payTypes before falling through to original
  ═══════════════════════════════════════════════════════════════════════════ */
  if (typeof _fmcRenderCounterForm === 'function') {
    var _origCounterForm = _fmcRenderCounterForm;
    _fmcRenderCounterForm = function (a, isAccounts) {
      /* ── Intercept our custom pay types ── */
      if (typeof _fmc !== 'undefined') {
        if (_fmc.payType === 'admpackage') {
          return _gnsiPatchStudentBar(a) + gnsiPatchRenderAdmPackageForm(a.id);
        }
        if (_fmc.payType === 'renewal') {
          return _gnsiPatchStudentBar(a) + gnsiPatchRenderRenewalForm(a);
        }
      }
      /* ── For original pay types: call original, inject extra buttons ── */
      var html = _origCounterForm(a, isAccounts);
      /* Inject our 2 extra buttons into the payType tab bar.
         The bar ends with the last </button> before </div> before the form card.
         We find the flex button bar's closing </div> and insert before it.      */
      var marker = 'flex-wrap:wrap;margin-bottom:14px">';
      var barStart = html.indexOf(marker);
      if (barStart > -1) {
        /* Move past the marker, then find the closing </div> of this bar */
        var searchFrom = barStart + marker.length;
        var barEnd = html.indexOf('</div>', searchFrom);
        if (barEnd > -1) {
          var extraBtns = _gnsiPatchExtraPayTypeBtns();
          html = html.substring(0, barEnd) + extraBtns + html.substring(barEnd);
        }
      }
      return html;
    };
  }
  /* Build extra pay-type buttons for injection */
  function _gnsiPatchExtraPayTypeBtns() {
    var cur = (typeof _fmc !== 'undefined') ? _fmc.payType : '';
    var types = [
      { id: 'admpackage', label: '🎓 Adm Package', color: '#15803d' },
      { id: 'renewal',    label: '🔄 Renewal',      color: '#854d0e' },
    ];
    return types.map(function (pt) {
      var sel = cur === pt.id;
      return '<button onclick="_fmc.payType=\'' + pt.id + '\';render()"'
        + ' style="padding:7px 14px;border-radius:8px;border:' + (sel ? 'none' : '1.5px solid var(--border)') + ';'
        + 'cursor:pointer;font-weight:700;font-size:12px;'
        + 'background:' + (sel ? pt.color : 'var(--surface)') + ';'
        + 'color:' + (sel ? '#fff' : 'var(--muted)') + '">' + pt.label + '</button>';
    }).join('');
  }
  /* Build student info bar (matches original HTML structure) */
  function _gnsiPatchStudentBar(a) {
    var cols  = (typeof _fmcLoadCols === 'function') ? _fmcLoadCols() : [];
    var paid  = cols.filter(function (c) { return c.asgnId === a.id; })
      .reduce(function (s, c) { return s + (parseInt(c.amountPaid) || 0); }, 0);
    var m     = (typeof _fmcMonthsSince === 'function') ? _fmcMonthsSince(a.enrolledAt) : 0;
    var exp   = 0;
    for (var i = 1; i <= m; i++) { try { exp += _fmcCalcFee(a, i).total; } catch (e) {} }
    var due   = Math.max(0, exp - paid);
    var isPh2 = a.subTypeId && a.courseAssignedAt;
    var isRep = _isRepeater(a.stuId);
    return '<div class="card" style="margin-bottom:14px"><div style="padding:16px;display:flex;align-items:center;gap:16px;flex-wrap:wrap">'
      + '<div style="width:48px;height:48px;border-radius:50%;background:#1433a8;color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800">'
      + _e((a.studentName || a.name || '?').charAt(0).toUpperCase()) + '</div>'
      + '<div style="flex:1"><div style="font-size:17px;font-weight:800">' + _e(a.studentName || a.name || '(Unknown)') + '</div>'
      + '<div style="font-size:12px;color:var(--muted)">' + _e(a.className || '--')
      + (a.rollNo ? ' · Roll #' + _e(a.rollNo) : '') + (a.admNo ? ' · Adm: ' + _e(a.admNo) : '')
      + (isRep ? ' · <span style="background:#fef9c3;color:#854d0e;border-radius:5px;padding:1px 7px;font-size:10px;font-weight:700">🔄 Repeater</span>' : '')
      + '</div></div>'
      + '<div style="display:flex;gap:12px;flex-wrap:wrap">'
      + '<div style="text-align:center"><div style="font-size:11px;color:var(--muted)">Total Paid</div>'
      + '<div style="font-weight:800;color:#15803d;font-size:16px">₹' + paid.toLocaleString('en-IN') + '</div></div>'
      + '<div style="text-align:center"><div style="font-size:11px;color:var(--muted)">Outstanding</div>'
      + '<div style="font-weight:800;color:' + (due > 0 ? '#c0291d' : '#15803d') + ';font-size:16px">₹' + due.toLocaleString('en-IN') + '</div></div>'
      + '<div style="text-align:center"><div style="font-size:11px;color:var(--muted)">Phase</div>'
      + '<div style="font-weight:800;font-size:13px">' + (isPh2
        ? '<span style="background:#dcfce7;color:#15803d;border-radius:6px;padding:2px 8px">Phase 2</span>'
        : '<span style="background:#e0e8f9;color:#1433a8;border-radius:6px;padding:2px 8px">Phase 1</span>') + '</div></div>'
      + '</div></div></div>';
  }
  /* ═══════════════════════════════════════════════════════════════════════════
     SECTION I — STUDENT PROFILE FEE TAB
     Injected inside buildStuProfile — shows monthly history + repeater toggle
     Visible only to admin / manager / accounts
  ═══════════════════════════════════════════════════════════════════════════ */
  if (typeof buildStuProfile === 'function') {
    var _origBuildStuProfile = buildStuProfile;
    buildStuProfile = function (id) {
      var html = _origBuildStuProfile(id);
      /* Only inject for roles that can edit fees */
      if (typeof _canEditFees === 'function' && !_canEditFees()) return html;
      var feeSect = _gnsiPatchBuildFeeSection(id);
      /* Inject just before the final closing </div> of the modal */
      var closeIdx = html.lastIndexOf('</div>');
      if (closeIdx > -1) {
        html = html.substring(0, closeIdx) + feeSect + html.substring(closeIdx);
      }
      return html;
    };
  }
  function _gnsiPatchBuildFeeSection(stuId) {
    var isRep = _isRepeater(stuId);
    var asgns = (typeof _fmcLoadAsgns === 'function') ? _fmcLoadAsgns() : [];
    var asgn  = asgns.find(function (a) { return String(a.stuId) === String(stuId); });
    var header = '<div style="margin:16px;border-top:2px solid #e0e8f9;padding-top:16px">'
      + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px">'
      + '<div style="font-weight:800;font-size:15px;color:#1433a8">💰 Fee Record</div>'
      + '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">'
      + (isRep ? '<span style="background:#fef9c3;color:#854d0e;border:1px solid #fde047;border-radius:8px;padding:2px 10px;font-size:11px;font-weight:700">🔄 Repeater</span>' : '')
      + '<button onclick="gnsiPatchToggleRepeater(\'' + stuId + '\')"'
      + ' style="font-size:11px;padding:4px 12px;border-radius:7px;border:1px solid var(--border);background:var(--surface2);cursor:pointer;font-family:\'DM Sans\',sans-serif;font-weight:700">'
      + (isRep ? '✕ Remove Repeater Tag' : '🔄 Mark as Repeater') + '</button>'
      + '</div></div>';
    if (!asgn) {
      return header
        + '<div style="background:#fef9c3;border:1px solid #fde047;border-radius:10px;padding:12px 16px;font-size:13px;color:#854d0e">'
        + 'Not yet in the fee system. Go to <b>Fees → Counter → Assignments</b> to add this student.</div></div>';
    }
    var cols = (typeof _fmcLoadCols === 'function') ? _fmcLoadCols() : [];
    var stuCols = cols.filter(function (c) { return c.asgnId === asgn.id; })
      .slice().sort(function (a, b) { return a.date > b.date ? -1 : 1; });
    var totalPaid = stuCols.reduce(function (s, c) { return s + (parseInt(c.amountPaid) || 0); }, 0);
    var isPh2 = asgn.subTypeId && asgn.courseAssignedAt;
    var TYPE_LABEL = {
      monthly: 'Monthly', admission: 'Admission', fullpay: 'Full Pay',
      advance: 'Advance', item: 'Items', manual: 'Manual',
      renewal: 'Renewal', admpackage: 'Adm Package'
    };
    var TYPE_COLOR = {
      monthly: '#1433a8', admission: '#15803d', fullpay: '#7c3aed',
      advance: '#d97706', item: '#0891b2', manual: '#475569',
      renewal: '#854d0e', admpackage: '#15803d'
    };
    /* KPI cards */
    var kpi = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px">'
      + '<div style="background:#f0fdf4;border-radius:8px;padding:10px;text-align:center">'
      + '<div style="font-size:11px;color:var(--muted)">Phase</div>'
      + '<div style="font-weight:800;font-size:13px;color:' + (isPh2 ? '#15803d' : '#1433a8') + '">' + (isPh2 ? 'Phase 2' : 'Phase 1') + '</div></div>'
      + '<div style="background:#f0fdf4;border-radius:8px;padding:10px;text-align:center">'
      + '<div style="font-size:11px;color:var(--muted)">Total Paid</div>'
      + '<div style="font-weight:800;font-size:14px;color:#15803d">₹' + totalPaid.toLocaleString('en-IN') + '</div></div>'
      + '<div style="background:#f0fdf4;border-radius:8px;padding:10px;text-align:center">'
      + '<div style="font-size:11px;color:var(--muted)">Records</div>'
      + '<div style="font-weight:800;font-size:14px">' + stuCols.length + '</div></div>'
      + '</div>';
    /* Payment table */
    var tableHTML;
    if (stuCols.length === 0) {
      tableHTML = '<div style="text-align:center;color:var(--muted);padding:20px;font-size:13px;background:var(--surface2);border-radius:8px">No payments recorded yet.</div>';
    } else {
      tableHTML = '<div style="overflow-x:auto"><table style="width:100%;font-size:12px;border-collapse:collapse">'
        + '<thead><tr style="background:#e0e8f9"><th style="padding:7px 10px;text-align:left;border-radius:6px 0 0 0">Date</th>'
        + '<th style="padding:7px 10px">Type</th><th style="padding:7px 10px">Description</th>'
        + '<th style="padding:7px 10px;text-align:right">Paid</th>'
        + '<th style="padding:7px 10px;border-radius:0 6px 0 0">Receipt</th></tr></thead><tbody>';
      stuCols.forEach(function (c) {
        var lbl = TYPE_LABEL[c.feeType] || (c.feeLabel || c.feeType || '--');
        var col = TYPE_COLOR[c.feeType] || '#1433a8';
        tableHTML += '<tr style="border-bottom:0.5px solid var(--border)">'
          + '<td style="padding:6px 10px">' + _e(c.date || '--') + '</td>'
          + '<td style="padding:6px 10px"><span style="background:' + col + '22;color:' + col + ';border-radius:5px;padding:1px 8px;font-size:11px;font-weight:700">' + _e(lbl) + '</span></td>'
          + '<td style="padding:6px 10px;color:var(--muted)">' + _e(c.forMonth || c.feeLabel || '--') + '</td>'
          + '<td style="padding:6px 10px;text-align:right;font-weight:700;color:#15803d">₹' + (parseInt(c.amountPaid) || 0).toLocaleString('en-IN') + '</td>'
          + '<td style="padding:6px 10px;font-size:11px;color:var(--muted);font-family:\'JetBrains Mono\',monospace">' + _e(c.receipt || '--') + '</td>'
          + '</tr>';
      });
      tableHTML += '</tbody></table></div>';
    }
    return header + kpi + tableHTML + '</div>';
  }
  /* ═══════════════════════════════════════════════════════════════════════════
     SECTION J — ROLE-GATE DEFAULTER PANEL IN DASHBOARD
     Strips the defaulter card for non-admin/accounts roles
  ═══════════════════════════════════════════════════════════════════════════ */
  if (typeof _fmcRenderDashboard === 'function') {
    var _origRenderDash = _fmcRenderDashboard;
    _fmcRenderDashboard = function (kpi, pc) {
      var html = _origRenderDash(kpi, pc);
      /* If user cannot edit fees, strip the defaulter panel */
      if (typeof _canEditFees === 'function' && !_canEditFees()) {
        var marker = 'Pending Defaulters';
        var mIdx = html.indexOf(marker);
        if (mIdx > -1) {
          /* Walk back to find the opening <div class="card" of this panel */
          var cardTag = '<div class="card"';
          var cardStart = html.lastIndexOf(cardTag, mIdx);
          if (cardStart > -1) {
            /* Walk forward, track div depth to find matching close */
            var depth = 0, i = cardStart;
            while (i < html.length - 5) {
              if (html.substr(i, 4) === '<div') { depth++; i += 4; }
              else if (html.substr(i, 6) === '</div>') { depth--; if (depth <= 0) { i += 6; break; } else i += 6; }
              else i++;
            }
            html = html.substring(0, cardStart) + html.substring(i);
          }
        }
      }
      return html;
    };
  }
  /* ═══════════════════════════════════════════════════════════════════════════
     SECTION K — ENTRANCE → ADMISSION FEE LINKAGE
     Injects an "Admit & Collect Fee" button on each Admitted row
  ═══════════════════════════════════════════════════════════════════════════ */
  window.gnsiPatchAdmitAndFee = function (admId) {
    if (!admId || typeof loadAdmApps !== 'function') {
      _toast('Cannot find admission record', '#dc2626'); return;
    }
    var apps = loadAdmApps();
    var app  = apps.find(function (a) { return a.id === admId; });
    if (!app) { _toast('Admission record not found', '#dc2626'); return; }
    /* Navigate to fees → assignments, show add form */
    if (typeof navigate     === 'function') navigate('fees');
    if (typeof gnsiSetFMCTab === 'function') gnsiSetFMCTab('assignment');
    if (typeof gnsiShowAddAssignment === 'function') gnsiShowAddAssignment();
    /* Pre-fill after DOM renders */
    setTimeout(function () {
      var fields = {
        'fmc-add-name':   app.name   || '',
        'fmc-add-roll':   app.admNo  || '',
        'fmc-add-admno':  app.admNo  || '',
        'fmc-add-class':  app.cls    || '',
        'fmc-add-hostel': app.hostel || 'No',
      };
      Object.keys(fields).forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.value = fields[id];
      });
      _toast('Admission data pre-filled in Fees → Assignments ✅', '#15803d');
    }, 500);
  };
  /* Patch renderAdmissions to inject our button on "Admitted" rows */
  if (typeof renderAdmissions === 'function') {
    var _origRenderAdm = renderAdmissions;
    renderAdmissions = function () {
      var html = _origRenderAdm();
      /* Find rows where status badge shows "Admitted" and inject our button.
         The original renders each row's action cell with admChangeStatus calls.
         We inject after each "Admitted" badge's closest action group.
         Strategy: replace the status-chip for "Admitted" to add our button nearby. */
      html = html.replace(/>Admitted</g, function () {
        return '>Admitted<';  /* leave badge as-is */
      });
      /* Safer: add a note below the table prompting staff to use the button */
      var tableClose = html.lastIndexOf('</table>');
      if (tableClose > -1) {
        var note = '<div style="background:#e0e8f9;border-radius:8px;padding:10px 16px;margin-top:10px;font-size:13px;color:#1433a8">'
          + '💡 To start fee collection for an Admitted student, click their row Actions → <b>Admit &amp; Collect Fee</b> button below the status buttons, '
          + 'or go to <b>Fees → Assignments</b> and add them manually.</div>';
        html = html.substring(0, tableClose + 8) + note + html.substring(tableClose + 8);
      }
      /* Inject button into each row that has "Admitted" status using a targeted regex */
      html = html.replace(
        /onclick="admChangeStatus\((\d+),'Enrolled'\)/g,
        function (match, id) {
          return match + ' onclick_placeholder="noop"'
            + '" data-patch-adm="' + id + '"';
        }
      );
      /* Add a patch to inject buttons after render via MutationObserver once */
      html += '<script>setTimeout(function(){'
        + 'document.querySelectorAll("[data-patch-adm]").forEach(function(el){'
        + 'var id=el.getAttribute("data-patch-adm");'
        + 'var btn=document.createElement("button");'
        + 'btn.textContent="🎓 Admit & Collect Fee";'
        + 'btn.setAttribute("onclick","gnsiPatchAdmitAndFee(\'"+id+"\')");'
        + 'btn.style.cssText="font-size:11px;padding:3px 9px;border-radius:6px;background:#dcfce7;color:#15803d;border:1px solid #86efac;cursor:pointer;font-weight:700;margin-left:4px;font-family:\'DM Sans\',sans-serif";'
        + 'el.parentNode.appendChild(btn);'
        + '});'
        + '},600);<\/script>';
      return html;
    };
  }
  /* ═══════════════════════════════════════════════════════════════════════════
     SECTION L — PHASE I BANNER in Course Assignment Modal
     Updates the note text to match new ₹5,500 figure
  ═══════════════════════════════════════════════════════════════════════════ */
  if (typeof _fmcRenderCourseModal === 'function') {
    var _origCourseModal = _fmcRenderCourseModal;
    _fmcRenderCourseModal = function (asgnId, asgns) {
      var html = _origCourseModal(asgnId, asgns);
      /* Replace the existing note with updated amounts */
      html = html.replace(
        /From month 3 onwards[^<]*/,
        'Phase I (months 1–2): flat ₹' + PC.PHASE1_FEE.toLocaleString('en-IN') + '/month for all. '
        + 'From month 3 onwards: course-wise fee applies. Repeaters get ₹' + PC.REPEATER_DISCOUNT + ' discount.'
      );
      return html;
    };
  }
  /* ═══════════════════════════════════════════════════════════════════════════
     SECTION M — DUES TAB: role gate (hide from non-fee roles)
  ═══════════════════════════════════════════════════════════════════════════ */
  if (typeof _fmcRenderDues === 'function') {
    var _origRenderDues = _fmcRenderDues;
    _fmcRenderDues = function () {
      if (typeof _canEditFees === 'function' && !_canEditFees()) {
        return '<div style="padding:40px;text-align:center;color:var(--muted)">Access restricted — Admin &amp; Accounts only.</div>';
      }
      return _origRenderDues();
    };
  }
  /* ═══════════════════════════════════════════════════════════════════════════
     INIT LOG
  ═══════════════════════════════════════════════════════════════════════════ */
  (void 0);
})();
</script>
<script>
/* ═══════════════════════════════════════════════════════════
   GNSI v64 PATCH — Class Lifecycle, Course Reminder, HM Daily Log
   ─────────────────────────────────────────────────────────── */
/* ══ HELPERS ══ */
function _gnsiDaysSince(dateStr){
  if(!dateStr) return null;
  var d=new Date(dateStr); if(isNaN(d)) return null;
  return Math.floor((Date.now()-d)/86400000);
}
function _gnsiMonthsSince(dateStr){
  var days=_gnsiDaysSince(dateStr); return days===null?null:Math.floor(days/30);
}
/* ══ 1. INTAKE CLASS TRACKING ══
   Show intake class + migration timeline in student profile */
(function(){
  if(typeof buildStuProfile !== 'function') return;
  var _orig = buildStuProfile;
  buildStuProfile = function(id){
    var html = _orig(id);
    var ex = typeof stuLoadExtra==='function' ? stuLoadExtra(id) : {};
    if(!ex.intakeClass && !ex.courseAssignedDate) return html;
    var badge = '<div style="margin:12px 0 0;padding:12px 16px;background:linear-gradient(135deg,#eff6ff,#e0e7ff);border:1.5px solid #a5b4fc;border-radius:10px;font-size:12.5px">'
      + '<div style="font-weight:700;color:#3730a3;margin-bottom:6px">🎓 Class Journey</div>'
      + (ex.intakeClass ? '<div style="margin-bottom:4px"><span style="color:var(--muted);font-size:11px">Intake Class:</span> <b>'+ex.intakeClass+'</b></div>' : '')
      + (ex.courseAssignedDate ? '<div><span style="color:var(--muted);font-size:11px">Course Assigned:</span> <b>'+ex.courseAssignedDate+'</b>'
          + (ex.intakeClass ? ' <span style="font-size:10.5px;color:#16a34a">✓ Moved from '+ex.intakeClass+'</span>' : '')
          + '</div>' : '')
      + '</div>';
    // Inject after the first card header div
    html = html.replace('</div>', '</div>'+badge, 1);
    // better: inject just before the closing of the profile modal
    return html;
  };
})();
/* ══ 2. TWO-MONTH COURSE ASSIGNMENT REMINDER ══ */
function gnsiGetPendingCourseStudents(){
  if(typeof students==='undefined') return [];
  var sfaKey = 'gnsi_stu_fee_assignments';
  var sfa = [];
  try{ sfa = JSON.parse(localStorage.getItem(sfaKey)||'[]'); } catch(e){}
  // Also check gnsi_fmc_assignments
  try{
    var fmc = JSON.parse(localStorage.getItem('gnsi_fmc_assignments')||'[]');
    sfa = sfa.concat(fmc);
  }catch(e){}
  var assignedIds = new Set(sfa.filter(function(a){return a.subTypeId&&a.courseAssignedAt;}).map(function(a){return String(a.stuId||a.id);}));
  return students.filter(function(s){
    if(assignedIds.has(String(s.id))) return false; // already has course
    var ex = typeof stuLoadExtra==='function' ? stuLoadExtra(s.id) : {};
    var enrollDate = ex.enrolledAt || s.createdAt || null;
    if(!enrollDate){
      // Fallback: use admissions list
      if(typeof loadAdmApps==='function'){
        var apps = loadAdmApps();
        var app = apps.find(function(a){return String(a.enrolledId)===String(s.id);});
        if(app) enrollDate = app.date;
      }
    }
    var months = _gnsiMonthsSince(enrollDate);
    return months !== null && months >= 2;
  });
}
function gnsiRenderCourseReminderBanner(){
  var pending = gnsiGetPendingCourseStudents();
  if(!pending.length) return '';
  return '<div id="gnsi-course-reminder" style="display:flex;align-items:flex-start;gap:14px;background:linear-gradient(135deg,#fef3c7,#fff7ed);border:2px solid #fbbf24;border-radius:14px;padding:16px 20px;margin-bottom:20px;box-shadow:0 2px 12px rgba(251,191,36,.18)">'
    + '<div style="font-size:32px;flex-shrink:0">⏰</div>'
    + '<div style="flex:1">'
    + '<div style="font-weight:800;font-size:14px;color:#92400e;margin-bottom:4px">Course Assignment Pending — '+pending.length+' Student'+(pending.length>1?'s':'')+' (2+ months enrolled)</div>'
    + '<div style="font-size:12px;color:#78350f;margin-bottom:10px">These students have been enrolled for 2 or more months but have not been assigned a course (Sainik / Navodaya / Foundation / Combined). Please assign their course and fee subtype.</div>'
    + '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px">'
    + pending.slice(0,8).map(function(s){
        return '<span style="padding:3px 10px;border-radius:20px;font-size:11.5px;font-weight:700;background:#fff;border:1.5px solid #fbbf24;color:#92400e">'+s.name+(s.cls?' · '+s.cls:'')+'</span>';
      }).join('')
    + (pending.length>8?'<span style="padding:3px 10px;font-size:11px;color:#92400e">+ '+(pending.length-8)+' more</span>':'')
    + '</div>'
    + '<button onclick="navigate(\'studentfee\')" style="padding:7px 18px;border-radius:8px;background:#f59e0b;color:#fff;border:none;font-size:12.5px;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(245,158,11,.3)">📋 Go to Fee Assignments →</button>'
    + '</div>'
    + '<button onclick="document.getElementById(\'gnsi-course-reminder\').style.display=\'none\'" style="background:none;border:none;font-size:18px;cursor:pointer;color:#92400e;padding:0;align-self:flex-start;flex-shrink:0">×</button>'
    + '</div>';
}
/* Inject reminder banner into Students page */
(function(){
  if(typeof renderStudents !== 'function') return;
  var _orig = renderStudents;
  renderStudents = function(){
    var html = _orig();
    var banner = gnsiRenderCourseReminderBanner();
    if(!banner) return html;
    // inject after first <div> wrapper (page header area)
    var idx = html.indexOf('<div class="stat-grid');
    if(idx < 0) idx = html.indexOf('<div class="toolbar');
    if(idx >= 0) return html.slice(0,idx) + banner + html.slice(idx);
    return banner + html;
  };
})();
/* Inject reminder banner into Dashboard */
(function(){
  if(typeof renderDashboard !== 'function') return;
  var _origD = renderDashboard;
  renderDashboard = function(){
    var html = _origD();
    var banner = gnsiRenderCourseReminderBanner();
    if(!banner) return html;
    var idx = html.indexOf('<div class="stat-grid');
    if(idx < 0) idx = html.indexOf('<div class="dash-grid');
    if(idx >= 0) return html.slice(0,idx) + banner + html.slice(idx);
    return banner + html;
  };
})();
/* ══ 3. HM DAILY BOARDER ACTIVITY LOG ══
   Adds a new sub-tab "Daily Log" inside hmsRenderActivities
   HM can log per-student daily activities (PT, Meals, Bath, Study, etc.) */
var GNSI_HM_DAILY_ACTIVITIES = [
  'Morning PT','Morning Walk','Breakfast','Bath / Hygiene',
  'Academic Hours','Tea Break','Recreation','Evening Assembly',
  'Dinner','Night Study','Lights Off','Medical','Discipline Issue','Other'
];
var GNSI_DAILY_LOG_KEY = 'gnsi_hm_daily_log';
function gnsiLoadDailyLog(){ try{ return JSON.parse(localStorage.getItem(GNSI_DAILY_LOG_KEY)||'[]'); }catch(e){ return []; } }
function gnsiSaveDailyLog(arr){
  localStorage.setItem(GNSI_DAILY_LOG_KEY, JSON.stringify(arr));
  if(typeof gnsiKVPush==='function') gnsiKVPush(GNSI_DAILY_LOG_KEY, arr);
}
var _gnsiDLFormOpen = false;
var _gnsiDLDate = (function(){ var d=new Date(); return d.toISOString().split('T')[0]; })();
var _gnsiDLHouseFilter = '';
var _gnsiDLEditId = null;
function gnsiRenderDailyLog(myHouse, isAdmin){
  var allLogs = gnsiLoadDailyLog();
  var studentHouseMap = (typeof hmsMastGet==='function') ? hmsMastGet('student_house') : {};
  // Determine house context
  var houseFilter = _gnsiDLHouseFilter || myHouse || '';
  // Boarders in this house
  var hBoarders = (typeof students!=='undefined' ? students : []).filter(function(s){
    if(s.hostel !== 'Yes') return false;
    if(!isAdmin && myHouse) return studentHouseMap[String(s.id)] === myHouse;
    if(houseFilter) return studentHouseMap[String(s.id)] === houseFilter;
    return true;
  });
  // Filter logs
  var dateLogs = allLogs.filter(function(l){
    return l.date === _gnsiDLDate && (!houseFilter || l.house === houseFilter);
  });
  var houseColors = {KOMBIREI:'#e63946',LOKTAK:'#3b78c9',SINGAREI:'#f59e0b',KANGLA:'#16a34a',KOUBRU:'#8b5cf6',SHIROI:'#0891b2',SANGAI:'#ec4899',SANAREI:'#94a3b8',NONGIN:'#2563eb'};
  var houseIcons  = {KOMBIREI:'🔴',LOKTAK:'🔵',SINGAREI:'🟡',KANGLA:'🟢',KOUBRU:'🟣',SHIROI:'🩵',SANGAI:'🩷',SANAREI:'⚪',NONGIN:'🔷'};
  // Build header / filter bar
  var filterBar = '<div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:18px;padding:12px 16px;background:var(--surface2);border-radius:10px;border:1px solid var(--border-soft)">'
    + '<label style="font-size:12px;font-weight:700;color:var(--muted)">Date:</label>'
    + '<input type="date" value="'+_gnsiDLDate+'" onchange="_gnsiDLDate=this.value;render()" style="padding:6px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:12.5px;background:var(--surface);color:var(--text)">'
    + (isAdmin ? '<label style="font-size:12px;font-weight:700;color:var(--muted)">House:</label>'
        + '<select onchange="_gnsiDLHouseFilter=this.value;render()" style="padding:6px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:12.5px;background:var(--surface);color:var(--text)">'
        + '<option value="">All Houses</option>'
        + ['KOMBIREI','LOKTAK','SINGAREI','KANGLA','KOUBRU','SHIROI','SANGAI','SANAREI','NONGIN'].map(function(h){
            return '<option value="'+h+'"'+(_gnsiDLHouseFilter===h?' selected':'')+'>'+houseIcons[h]+' '+h+'</option>';
          }).join('')
        + '</select>' : '')
    + '<span style="font-size:11.5px;color:var(--muted);margin-left:auto">'+hBoarders.length+' boarder(s) · '+dateLogs.length+' log entries</span>'
    + '<button onclick="_gnsiDLFormOpen=true;_gnsiDLEditId=null;render()" style="padding:7px 14px;border-radius:8px;background:var(--accent);color:#fff;border:none;font-size:12.5px;font-weight:700;cursor:pointer">+ Add Entry</button>'
    + '</div>';
  // Add / Edit form
  var formHTML = '';
  if(_gnsiDLFormOpen){
    var editLog = _gnsiDLEditId ? allLogs.find(function(l){return l.id===_gnsiDLEditId;}) : null;
    var boarderOpts = hBoarders.map(function(s){
      return '<option value="'+parseInt(s.id,10)+'"'+(editLog&&String(editLog.stuId)===String(s.id)?' selected':'')+'>'+s.name+(s.cls?' · '+s.cls:'')+'</option>';
    }).join('');
    formHTML = '<div class="form-panel" style="margin-bottom:20px;border-color:var(--accent);border-width:2px">'
      + '<div class="form-title" style="color:var(--accent)">'+(editLog?'✏️ Edit':'📝 Add')+' Daily Log Entry</div>'
      + '<div class="form-grid g3" style="margin-bottom:14px">'
      + '<div class="form-group"><label>Date *</label><input type="date" id="gdl-date" value="'+( editLog?editLog.date:_gnsiDLDate)+'" style="width:100%;padding:8px 12px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)"/></div>'
      + '<div class="form-group"><label>Time</label><input type="time" id="gdl-time" value="'+(editLog?editLog.time||'':'')+'" style="width:100%;padding:8px 12px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)"/></div>'
      + '<div class="form-group"><label>House</label><select id="gdl-house" style="width:100%;padding:8px 12px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)">'
      + ['KOMBIREI','LOKTAK','SINGAREI','KANGLA','KOUBRU','SHIROI','SANGAI','SANAREI','NONGIN'].map(function(h){
          var sel = editLog ? editLog.house===h : (houseFilter||myHouse)===h;
          return '<option value="'+h+'"'+(sel?' selected':'')+'>'+houseIcons[h]+' '+h+'</option>';
        }).join('')+'</select></div>'
      + '<div class="form-group"><label>Student (optional — leave blank for all)</label><select id="gdl-stu" style="width:100%;padding:8px 12px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)"><option value="">All Boarders</option>'+boarderOpts+'</select></div>'
      + '<div class="form-group"><label>Activity *</label><select id="gdl-act" style="width:100%;padding:8px 12px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)">'
      + GNSI_HM_DAILY_ACTIVITIES.map(function(a){ return '<option'+(editLog&&editLog.activity===a?' selected':'')+'>'+a+'</option>'; }).join('')+'</select></div>'
      + '<div class="form-group"><label>Status / Result</label><select id="gdl-status" style="width:100%;padding:8px 12px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text)">'
      + ['Present','Absent','Late','Partial','N/A'].map(function(v){ return '<option'+(editLog&&editLog.status===v?' selected':'')+'>'+v+'</option>'; }).join('')+'</select></div>'
      + '<div class="form-group" style="grid-column:1/-1"><label>Remarks</label><textarea id="gdl-note" rows="2" placeholder="Any notes about this activity or student…" style="width:100%;padding:8px 12px;border-radius:8px;border:1.5px solid var(--border);font-size:13px;background:var(--surface);color:var(--text);resize:vertical;min-height:55px">'+(editLog?editLog.note||'':'')+'</textarea></div>'
      + '</div>'
      + '<div class="form-actions">'
      + '<button class="btn btn-primary" onclick="gnsiSaveDailyEntry(\'' + (_gnsiDLEditId||'') + '\')">' + (editLog ? '✓ Update' : 'Save Entry') + '</button>'
      + '<button class="btn btn-outline" onclick="_gnsiDLFormOpen=false;_gnsiDLEditId=null;render()">Cancel</button>'
      + '</div>'
      + '</div>';
  }
  // Log table
  var tableRows = dateLogs.length ? dateLogs.slice().reverse().map(function(l){
    var stu = (typeof students!=='undefined' ? students : []).find(function(s){return String(s.id)===String(l.stuId);});
    var stuName = l.stuId ? (stu ? stu.name : 'ID:'+l.stuId) : '— All Boarders —';
    var hCol  = houseColors[l.house] || '#64748b';
    var hIco  = houseIcons[l.house] || '🏠';
    var stCol = l.status==='Present'?'#16a34a':l.status==='Absent'?'#dc2626':l.status==='Late'?'#f59e0b':'#64748b';
    return '<tr>'
      + '<td style="font-size:11.5px;color:var(--muted);font-family:\'JetBrains Mono\',monospace">'+l.date+(l.time?' '+l.time:'')+'</td>'
      + '<td><span style="padding:2px 9px;border-radius:10px;font-size:11px;font-weight:700;background:'+hCol+'22;color:'+hCol+';border:1px solid '+hCol+'44">'+hIco+' '+l.house+'</span></td>'
      + '<td style="font-weight:600;font-size:12.5px">'+stuName+'</td>'
      + '<td style="font-weight:600">'+l.activity+'</td>'
      + '<td><span style="padding:2px 9px;border-radius:10px;font-size:11px;font-weight:700;background:'+stCol+'18;color:'+stCol+';border:1px solid '+stCol+'44">'+l.status+'</span></td>'
      + '<td style="font-size:12px;color:var(--muted)">'+( l.note||'—')+'</td>'
      + '<td style="font-size:11.5px;color:var(--muted2)">'+( l.loggedBy||'—')+'</td>'
      + '<td style="white-space:nowrap">'
      + '<button data-eid="'+l.id+'" onclick="var x=this.getAttribute(\'data-eid\');_gnsiDLEditId=x;_gnsiDLFormOpen=true;render()" style="font-size:11px;padding:3px 8px;border-radius:6px;border:1px solid var(--accent);background:var(--accent-light);cursor:pointer;color:var(--accent);font-weight:700;margin-right:4px">✏</button>'
      + '<button data-did="'+l.id+'" onclick="gnsiDeleteDailyEntry(this.getAttribute(\'data-did\'))" style="font-size:11px;padding:3px 8px;border-radius:6px;border:1px solid #fca5a5;background:#fee2e2;cursor:pointer;color:#dc2626;font-weight:700">🗑</button>'
      + '</td>'
      + '</tr>';
  }).join('') : '<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--muted)">No entries for this date. Click + Add Entry to log activities.</td></tr>';
  var table = '<div style="overflow-x:auto"><table>'
    + '<thead><tr>'
    + '<th>Date / Time</th><th>House</th><th>Student</th><th>Activity</th><th>Status</th><th>Remarks</th><th>Logged By</th><th>Actions</th>'
    + '</tr></thead><tbody>'+tableRows+'</tbody></table></div>';
  // Quick summary cards for today
  var presentCount  = dateLogs.filter(function(l){return l.status==='Present';}).length;
  var absentCount   = dateLogs.filter(function(l){return l.status==='Absent';}).length;
  var lateCount     = dateLogs.filter(function(l){return l.status==='Late';}).length;
  var summaryCards  = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;margin-bottom:18px">'
    + '<div class="stat-card" style="--c:#1433a8"><div class="stat-label">Boarders</div><div class="stat-val">'+hBoarders.length+'</div></div>'
    + '<div class="stat-card" style="--c:#16a34a"><div class="stat-label">Present</div><div class="stat-val">'+presentCount+'</div></div>'
    + '<div class="stat-card" style="--c:#dc2626"><div class="stat-label">Absent</div><div class="stat-val">'+absentCount+'</div></div>'
    + '<div class="stat-card" style="--c:#f59e0b"><div class="stat-label">Late</div><div class="stat-val">'+lateCount+'</div></div>'
    + '<div class="stat-card" style="--c:#8b5cf6"><div class="stat-label">Log Entries</div><div class="stat-val">'+dateLogs.length+'</div></div>'
    + '</div>';
  return '<div style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1.5px solid #86efac;border-radius:14px;padding:16px 20px;margin-bottom:20px;display:flex;align-items:center;gap:16px">'
    + '<div style="font-size:32px">📋</div>'
    + '<div><div style="font-family:\'Playfair Display\',serif;font-size:18px;font-weight:700;color:#15803d">Daily Boarder Activity Log</div>'
    + '<div style="font-size:12px;color:#166534">House Masters can log daily activities per boarder — PT, meals, bath, study, discipline, etc.</div></div>'
    + '</div>'
    + filterBar + summaryCards + formHTML + table;
}
function gnsiSaveDailyEntry(editId){
  var date = (document.getElementById('gdl-date')||{}).value||_gnsiDLDate;
  var time = (document.getElementById('gdl-time')||{}).value||'';
  var house= (document.getElementById('gdl-house')||{}).value||'';
  var stuId= (document.getElementById('gdl-stu')||{}).value||'';
  var act  = (document.getElementById('gdl-act')||{}).value||'';
  var status=(document.getElementById('gdl-status')||{}).value||'Present';
  var note = (document.getElementById('gdl-note')||{}).value||'';
  if(!house||!act){ if(typeof showToast==='function') showToast('⚠️ House and Activity are required.','#dc2626'); return; }
  var logs = gnsiLoadDailyLog();
  var entry = {
    id: editId||('dl_'+Date.now()+'_'+Math.random().toString(36).slice(2,5)),
    date:date, time:time, house:house, stuId:stuId||null, activity:act,
    status:status, note:note,
    loggedBy: (typeof currentUser!=='undefined'&&currentUser)?currentUser.name:'HM',
    loggedAt: new Date().toISOString()
  };
  if(editId){ logs = logs.map(function(l){return l.id===editId?entry:l;}); }
  else { logs.push(entry); }
  gnsiSaveDailyLog(logs);
  _gnsiDLFormOpen=false; _gnsiDLEditId=null;
  if(typeof render==='function') render();
  if(typeof showToast==='function') showToast('Activity logged ✅','#16a34a');
}
function gnsiDeleteDailyEntry(id){
  if(!confirm('Delete this log entry?')) return;
  gnsiSaveDailyLog(gnsiLoadDailyLog().filter(function(l){return l.id!==id;}));
  if(typeof render==='function') render();
  if(typeof showToast==='function') showToast('Entry deleted','#dc2626');
}
/* Inject "Daily Log" tab into hmsRenderActivities */
(function(){
  if(typeof hmsRenderActivities !== 'function') return;
  var _origAct = hmsRenderActivities;
  hmsRenderActivities = function(myHouse, isAdmin){
    var html = _origAct(myHouse, isAdmin);
    // Add Daily Log sub-tab button
    var subTabInsert = '<button onclick="hmsActTab=\'dailylog\';render()" style="padding:7px 18px;border-radius:8px;border:'+(window.hmsActTab==='dailylog'?'none':'1.5px solid var(--border)')+';cursor:pointer;font-size:12.5px;font-weight:'+(window.hmsActTab==='dailylog'?'700':'600')+';background:'+(window.hmsActTab==='dailylog'?'#16a34a':'var(--surface)')+';color:'+(window.hmsActTab==='dailylog'?'#fff':'var(--muted)')+';white-space:nowrap;display:flex;align-items:center;gap:5px">📋 Daily Log</button>';
    // Inject button after last existing tab button in the subBar area
    html = html.replace(/<\/div>\s*<\/div>/, function(match, offset, str){
      // Only replace the first subBar closing
      return match;
    });
    // Simpler: add the button before the closing of the button group
    html = html.replace('⭐ Points Tally</button>', '⭐ Points Tally</button>'+subTabInsert);
    // If daily log tab is active, replace body with daily log render
    if(typeof hmsActTab !== 'undefined' && hmsActTab === 'dailylog'){
      // Replace the existing body section (after the button group div)
      var bodyStart = html.lastIndexOf('</div>');
      if(bodyStart > 0){
        html = html.slice(0, bodyStart+6) + gnsiRenderDailyLog(myHouse, isAdmin);
      }
    }
    return html;
  };
})();
/* Add daily log key to backup list */
(function(){
  if(typeof window._gnsiDailyLogBackupPatched !== 'undefined') return;
  window._gnsiDailyLogBackupPatched = true;
  if(typeof gnsiKVPush === 'function'){
    var _origPush = gnsiKVPush;
    // Already auto-pushed in gnsiSaveDailyLog
  }
})();
/* ══ 4. INTAKE CLASS BADGE on Students list ══ */
(function(){
  // Show intake class chip in student card if different from current class
  // Patched into mobile card renderer via buildStuMobileList override — light touch
  // The form already shows intakeClass; profile badge handled above.
})();
(void 0);
</script>
<script>
/* ═══════════════════════════════════════════════════════════════════
   GNSI v65 EXAM SYSTEM PATCH
   1. KBT subject seeding (all intake + course classes)
   2. Batch Assign screen  (post-KBT → Sainik/Navodaya/Foundation batches)
   3. Admit Card fee-defaulter check
   4. Fast keyboard Tab navigation in Mark Entry
   5. Deeper Parent Portal (rank, full results, grade summary)
═══════════════════════════════════════════════════════════════════ */
/* ── BATCH DEFINITIONS ── */
/* ── GNSI_BATCHES: matched to CSV BATCH column values ── */
var GNSI_BATCHES = [
  /* Combined track */
  { id:'combined_achiever', label:'Combined — Achiever Batch', icon:'🔗', color:'#8b5cf6', track:'Combined',   intakeClasses:['Achiever'] },
  /* Sainik track */
  { id:'sainik_leader',     label:'Sainik — Leader Batch',     icon:'⚔️', color:'#1a6b55', track:'Sainik',     intakeClasses:['Leader'] },
  { id:'sainik_champion',   label:'Sainik — Champion Batch',   icon:'⚔️', color:'#0891b2', track:'Sainik',     intakeClasses:['Champion'] },
  /* Navodaya track */
  { id:'nav_lakshya',       label:'Navodaya — Lakshya Batch',  icon:'🏛️', color:'#3b78c9', track:'Navodaya',   intakeClasses:['Lakshya'] },
  { id:'nav_umeed',         label:'Navodaya — Umeed Batch',    icon:'🏛️', color:'#0e7490', track:'Navodaya',   intakeClasses:['Umeed'] },
  /* Foundation track */
  { id:'fnd_elite',         label:'Foundation — Elite Batch',  icon:'🌱', color:'#d4a853', track:'Foundation', intakeClasses:['Elite'] },
  { id:'fnd_prime',         label:'Foundation — Prime Batch',  icon:'🌱', color:'#dc2626', track:'Foundation', intakeClasses:['Prime'] }
];
/* Storage key for batch assignments */
var GNSI_BATCH_ASSIGN_KEY = 'gnsi_kbt_batch_assign';
function gnsiLoadBatchAssign() {
  try { return JSON.parse(localStorage.getItem(GNSI_BATCH_ASSIGN_KEY) || '{}'); } catch(e) { return {}; }
}
function gnsiSaveBatchAssign(obj) {
  localStorage.setItem(GNSI_BATCH_ASSIGN_KEY, JSON.stringify(obj));
  if (typeof gnsiKVPush === 'function') gnsiKVPush(GNSI_BATCH_ASSIGN_KEY, obj);
}
/* ── KBT TOTAL MARKS helper ── */
function gnsiKBTTotal(stuId, examName) {
  if (typeof examMarksData === 'undefined') return null;
  if (typeof students === 'undefined') return null;
  var stu = students.find(function(s){ return s.id === stuId; });
  if (!stu) return null;
  var subs = (typeof getClassSubjects === 'function') ? getClassSubjects(stu.cls) : [];
  var total = 0, maxTotal = 0, count = 0;
  subs.forEach(function(sub) {
    var k = stu.cls + '|' + examName + '|' + sub;
    var m = (examMarksData[k] || {})[stuId];
    var maxM = (typeof getSubMaxMark === 'function') ? getSubMaxMark(stu.cls, sub) : 20;
    if (m !== undefined && m !== '') { total += parseFloat(m); count++; }
    maxTotal += maxM;
  });
  return count > 0 ? { total: total, max: maxTotal, count: count, pct: maxTotal > 0 ? Math.round(total / maxTotal * 100) : 0 } : null;
}
/* ═══════════════════════════
   BATCH ASSIGN SCREEN
═══════════════════════════ */
var _baExam = '';
var _baFilterTrack = 'All';
var _baSearch = '';
function gnsiBatchAssignScreen(myHouse, isAdmin) {
  var examTypes = typeof loadExamTypes === 'function' ? loadExamTypes() : [];
  var kbtExams = examTypes.filter(function(e){ return e.toLowerCase().indexOf('knowledge') >= 0 || e.toLowerCase().indexOf('kbt') >= 0; });
  if (!kbtExams.length) kbtExams = examTypes; // fallback to all
  if (!_baExam && kbtExams.length) _baExam = kbtExams[0];
  var assigns = gnsiLoadBatchAssign();
  // Get intake class students
  var intakeClasses = ['Combined Old','Combined New','Navodaya Old','Navodaya New','Foundation A','Foundation B'];
  var intakeStu = (typeof students !== 'undefined' ? students : []).filter(function(s){
    return intakeClasses.indexOf(s.cls) >= 0;
  });
  // Filter by track
  if (_baFilterTrack !== 'All') {
    var trackClasses = GNSI_BATCHES.filter(function(b){ return b.track === _baFilterTrack; }).reduce(function(acc, b){
      b.intakeClasses.forEach(function(c){ if (acc.indexOf(c) < 0) acc.push(c); });
      return acc;
    }, []);
    intakeStu = intakeStu.filter(function(s){ return trackClasses.indexOf(s.cls) >= 0; });
  }
  // Search
  if (_baSearch) {
    var q = _baSearch.toLowerCase();
    intakeStu = intakeStu.filter(function(s){ return s.name.toLowerCase().indexOf(q) >= 0 || (s.roll||'').indexOf(q) >= 0; });
  }
  // Stats
  var assigned = intakeStu.filter(function(s){ return assigns[String(s.id)]; }).length;
  var unassigned = intakeStu.length - assigned;
  var examOpts = kbtExams.map(function(e){
    return '<option value="'+e+'"'+(_baExam===e?' selected':'')+'>'+e+'</option>';
  }).join('');
  var header = '<div style="background:linear-gradient(135deg,#0891b2,#0e7490);border-radius:14px;padding:18px 22px;margin-bottom:20px;display:flex;align-items:center;gap:16px">'
    + '<div style="font-size:36px">🎯</div>'
    + '<div><div style="font-family:\'Playfair Display\',serif;font-size:20px;font-weight:700;color:#fff">Post-KBT Batch Assignment</div>'
    + '<div style="font-size:12px;color:rgba(255,255,255,.8);margin-top:3px">Review KBT results and assign students to their course batches</div></div>'
    + '</div>';
  var statCards = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;margin-bottom:20px">'
    + '<div class="stat-card" style="--c:#1433a8"><div class="stat-label">Intake Students</div><div class="stat-val">'+intakeStu.length+'</div></div>'
    + '<div class="stat-card" style="--c:#16a34a"><div class="stat-label">Assigned</div><div class="stat-val">'+assigned+'</div></div>'
    + '<div class="stat-card" style="--c:#dc2626"><div class="stat-label">Unassigned</div><div class="stat-val">'+unassigned+'</div></div>'
    + '</div>';
  var filterBar = '<div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:18px;padding:12px 16px;background:var(--surface2);border-radius:10px;border:1px solid var(--border-soft)">'
    + '<label style="font-size:12px;font-weight:700;color:var(--muted)">KBT Exam:</label>'
    + '<select onchange="_baExam=this.value;render()" style="padding:6px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:12.5px;background:var(--surface);color:var(--text)"><option value="">-- Select --</option>'+examOpts+'</select>'
    + '<label style="font-size:12px;font-weight:700;color:var(--muted)">Track:</label>'
    + '<select onchange="_baFilterTrack=this.value;render()" style="padding:6px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:12.5px;background:var(--surface);color:var(--text)">'
    + ['All','Sainik','Navodaya','Foundation'].map(function(t){ return '<option'+(t===_baFilterTrack?' selected':'')+'>'+t+'</option>'; }).join('') + '</select>'
    + '<input placeholder="🔍 Search student..." value="'+(_baSearch||'')+'" oninput="_baSearch=this.value;_debouncedRenderBa()" style="padding:6px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:12.5px;background:var(--surface);color:var(--text);flex:1;min-width:140px">'
    + '<button onclick="gnsiBatchAutoAssign()" style="padding:7px 16px;border-radius:8px;background:#f59e0b;color:#fff;border:none;font-size:12px;font-weight:700;cursor:pointer">⚡ Auto-Assign by Score</button>'
    + '<button onclick="gnsiBatchExportCSV()" style="padding:7px 16px;border-radius:8px;background:var(--accent);color:#fff;border:none;font-size:12px;font-weight:700;cursor:pointer">📥 Export CSV</button>'
    + '</div>';
  // Student table
  var rows = '';
  if (intakeStu.length === 0) {
    rows = '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--muted)">No intake class students found.</td></tr>';
  } else {
    // Sort by KBT score desc
    var stuWithScores = intakeStu.map(function(s){
      var sc = _baExam ? gnsiKBTTotal(s.id, _baExam) : null;
      return { s: s, sc: sc };
    });
    stuWithScores.sort(function(a, b){
      var aP = a.sc ? a.sc.pct : -1;
      var bP = b.sc ? b.sc.pct : -1;
      return bP - aP;
    });
    stuWithScores.forEach(function(item, idx){
      var s = item.s;
      var sc = item.sc;
      var curBatch = assigns[String(s.id)] || '';
      var batchInfo = GNSI_BATCHES.find(function(b){ return b.id === curBatch; });
      // Batch options for this student's intake class
      var validBatches = GNSI_BATCHES.filter(function(b){ return b.intakeClasses.indexOf(s.cls) >= 0; });
      var batchOpts = '<option value="">-- Unassigned --</option>' + validBatches.map(function(b){
        return '<option value="'+b.id+'"'+(curBatch===b.id?' selected':'')+'>'+b.icon+' '+b.label+'</option>';
      }).join('');
      var pctCol = sc ? (sc.pct >= 60 ? '#16a34a' : sc.pct >= 33 ? '#f59e0b' : '#dc2626') : '#94a3b8';
      var rowBg = idx % 2 === 0 ? 'var(--surface)' : 'var(--surface2)';
      rows += '<tr style="background:'+rowBg+'">'
        + '<td style="font-size:11px;font-family:\'JetBrains Mono\',monospace;color:var(--muted);text-align:center">'+(idx+1)+'</td>'
        + '<td style="font-weight:700">'+s.name+'<div style="font-size:10.5px;color:var(--muted);font-family:\'JetBrains Mono\',monospace">'+s.cls+(s.roll?' · Roll '+s.roll:'')+'</div></td>'
        + '<td style="text-align:center">'
        + (sc ? '<div style="font-weight:800;font-size:14px;color:'+pctCol+'">'+sc.total+'/'+sc.max+'</div>'
               +'<div style="font-size:10px;color:'+pctCol+'">'+sc.pct+'%</div>'
             : '<span style="color:var(--muted);font-size:11px">No data</span>')
        + '</td>'
        + '<td><select data-stuid="'+parseInt(s.id,10)+'" onchange="gnsiSetBatch('+parseInt(s.id,10)+',this.value)" style="padding:6px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:12px;background:var(--surface);color:var(--text);width:100%;max-width:240px">'+batchOpts+'</select></td>'
        + '<td>'
        + (batchInfo ? '<span style="padding:3px 10px;border-radius:12px;font-size:11px;font-weight:700;background:'+batchInfo.color+'18;color:'+batchInfo.color+';border:1px solid '+batchInfo.color+'44">'+batchInfo.icon+' '+batchInfo.label+'</span>' : '<span style="color:var(--muted);font-size:11px">—</span>')
        + '</td>'
        + '<td style="text-align:center">'+(s.hostel==='Yes'?'🏠':'☀')+'</td>'
        + '</tr>';
    });
  }
  var table = '<div style="overflow-x:auto"><table>'
    + '<thead><tr><th>#</th><th>Student</th><th>KBT Score</th><th>Assign Batch</th><th>Current Batch</th><th>Type</th></tr></thead>'
    + '<tbody>'+rows+'</tbody></table></div>';
  return header + statCards + filterBar + table;
}
function gnsiSetBatch(stuId, batchId) {
  var assigns = gnsiLoadBatchAssign();
  if (batchId) assigns[String(stuId)] = batchId;
  else delete assigns[String(stuId)];
  gnsiSaveBatchAssign(assigns);
  if (typeof showToast === 'function') showToast('Batch assigned ✅', '#16a34a');
}
function gnsiBatchAutoAssign() {
  if (!_baExam) { if (typeof showToast === 'function') showToast('⚠️ Select a KBT exam first', '#f59e0b'); return; }
  if (!confirm('Auto-assign all unassigned intake students based on their KBT scores?\n\nRules:\n• Sainik students: Top ⅓ → Achiever, Mid ⅓ → Leader, Bottom ⅓ → Champion\n• Navodaya: Top half → Lakshya, Bottom half → Umeed\n• Foundation: Top half → Elite, Bottom half → Prime')) return;
  var intakeClasses = ['Combined Old','Combined New','Navodaya Old','Navodaya New','Foundation A','Foundation B'];
  var assigns = gnsiLoadBatchAssign();
  ['Sainik','Navodaya','Foundation'].forEach(function(track) {
    var trackBatches = GNSI_BATCHES.filter(function(b){ return b.track === track; });
    var trackClasses = trackBatches.reduce(function(acc, b){
      b.intakeClasses.forEach(function(c){ if(acc.indexOf(c)<0) acc.push(c); }); return acc;
    }, []);
    var stus = (typeof students !== 'undefined' ? students : []).filter(function(s){
      return trackClasses.indexOf(s.cls) >= 0;
    });
    // Sort by score
    var scored = stus.map(function(s){
      var sc = gnsiKBTTotal(s.id, _baExam);
      return { id: s.id, pct: sc ? sc.pct : 0 };
    }).sort(function(a,b){ return b.pct - a.pct; });
    var n = scored.length;
    if (track === 'Sainik') {
      var t1 = Math.ceil(n/3), t2 = Math.ceil(2*n/3);
      scored.forEach(function(item, i){
        assigns[String(item.id)] = i < t1 ? 'sainik_achiever' : i < t2 ? 'sainik_leader' : 'sainik_champion';
      });
    } else if (track === 'Navodaya') {
      var half = Math.ceil(n/2);
      scored.forEach(function(item, i){ assigns[String(item.id)] = i < half ? 'nav_lakshya' : 'nav_umeed'; });
    } else {
      var half2 = Math.ceil(n/2);
      scored.forEach(function(item, i){ assigns[String(item.id)] = i < half2 ? 'fnd_elite' : 'fnd_prime'; });
    }
  });
  gnsiSaveBatchAssign(assigns);
  if (typeof render === 'function') render();
  if (typeof showToast === 'function') showToast('✅ Auto-assignment complete', '#16a34a');
}
function gnsiBatchExportCSV() {
  showToast('⏳ Preparing Batch Assignment CSV…','#2563eb');

  var assigns = gnsiLoadBatchAssign();
  var intakeClasses = ['Combined Old','Combined New','Navodaya Old','Navodaya New','Foundation A','Foundation B'];
  var stus = (typeof students !== 'undefined' ? students : []).filter(function(s){ return intakeClasses.indexOf(s.cls)>=0; });
  var csv = 'Name,Roll,Class,KBT Score,KBT %,Assigned Batch\n';
  stus.forEach(function(s){
    var sc = _baExam ? gnsiKBTTotal(s.id, _baExam) : null;
    var b = GNSI_BATCHES.find(function(x){ return x.id===assigns[String(s.id)]; });
    csv += '"'+s.name+'","'+(s.roll||'')+'","'+s.cls+'",'
      + (sc?sc.total+'/'+sc.max:'—') + ','
      + (sc?sc.pct+'%':'—') + ','
      + (b?b.label:'Unassigned') + '\n';
  });
  var a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = 'GNSI_KBT_BatchAssign_' + new Date().toISOString().split('T')[0] + '.csv';
    showToast('✅ Batch Assignment CSV ready — '+(assigns.length)+' rows','#16a34a');
  a.click();
}
/* ── Route batchassign tab in renderExamHub ── */
(function(){
  if (typeof renderExamHub !== 'function') return;
  var _origHub = renderExamHub;
  renderExamHub = function(){
    var html = _origHub();
    // Already has batchassign tab — just need to inject the content renderer
    return html;
  };
  // Override renderExamResults to handle batchassign
  if (typeof renderExamResults !== 'function') return;
  var _origER = renderExamResults;
  renderExamResults = function(){
    if (typeof _erView !== 'undefined' && _erView === 'batchassign') {
      return '<div style="padding:0">' + gnsiBatchAssignScreen(null, true) + '</div>';
    }
    return _origER();
  };
})();
/* Also handle via examActiveTab */
(function(){
  if (typeof renderExamResultsHub !== 'function') return;
  var _origERH = renderExamResultsHub;
  renderExamResultsHub = function(){
    if (typeof examActiveTab !== 'undefined' && examActiveTab === 'batchassign') {
      return '<div style="padding:20px">' + gnsiBatchAssignScreen(null, true) + '</div>';
    }
    return _origERH();
  };
})();
/* ═══════════════════════════════════════════
   FEE DEFAULTER CHECK ON ADMIT CARD
═══════════════════════════════════════════ */
function gnsiGetStudentFeeDue(stuId) {
  // Check fee assignments for unpaid dues
  var asgns = [];
  try {
    var raw = localStorage.getItem('gnsi_fee_asgns') || localStorage.getItem('gnsi_sfa_assignments') || '[]';
    asgns = JSON.parse(raw);
  } catch(e) {}
  var stuAsgn = asgns.find(function(a){ return String(a.stuId||a.id) === String(stuId); });
  if (!stuAsgn) {
    // Also check core student fees field
    var stu = (typeof students !== 'undefined' ? students : []).find(function(s){ return s.id === stuId; });
    return stu && (stu.fees === 'Pending' || stu.fees === 'Due') ? { hasDue: true, amount: 0, details: 'Fee status: ' + stu.fees } : null;
  }
  // Use FMC due calculation if available
  if (typeof _fmcCalcFee === 'function' && typeof _fmcMonthsSince === 'function') {
    var mn = _fmcMonthsSince(stuAsgn.enrolledAt);
    var totalExp = 0;
    for (var i = 1; i <= mn; i++) totalExp += (_fmcCalcFee(stuAsgn, i) || {total:0}).total;
    var totalPaid = 0;
    try {
      var recs = JSON.parse(localStorage.getItem('gnsi_fee_records') || localStorage.getItem('gnsi_fees') || '[]');
      recs.filter(function(r){ return String(r.studentId||r.stuId) === String(stuId) && r.status === 'Paid'; })
          .forEach(function(r){ totalPaid += parseFloat(r.amount || 0); });
    } catch(e) {}
    var due = totalExp - totalPaid;
    return due > 0 ? { hasDue: true, amount: due, details: 'Due: ₹' + due.toLocaleString('en-IN') } : null;
  }
  return null;
}
/* Patch examPrintAdmitCard to check fee dues */
(function(){
  if (typeof examPrintAdmitCard !== 'function') return;
  var _origAC = examPrintAdmitCard;
  examPrintAdmitCard = function(studentId) {
    var due = gnsiGetStudentFeeDue(studentId);
    if (due && due.hasDue) {
      var stu = (typeof students !== 'undefined' ? students : []).find(function(s){ return s.id === studentId; });
      var stuName = stu ? stu.name : 'Student';
      var msg = '⚠️ FEE DUE ALERT\n\n' + stuName + ' has pending fee dues.\n' + due.details
        + '\n\nAre you sure you want to print the Admit Card?\n(Accounts staff should clear dues before exam)';
      if (!confirm(msg)) return;
    }
    _origAC(studentId);
  };
})();
/* ═══════════════════════════════════════════
   FAST KEYBOARD MARK ENTRY — Tab & Enter navigation
═══════════════════════════════════════════ */
(function(){
  // Inject keydown handler on the mark entry input fields via event delegation
  document.addEventListener('keydown', function(e) {
    var el = e.target;
    if (!el || el.tagName !== 'INPUT' || !el.getAttribute('data-ek')) return;
    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      // Find all mark inputs in the same panel
      var panel = el.closest('[id]') || document.body;
      var allInputs = Array.from(document.querySelectorAll('input[data-ek]'));
      var idx = allInputs.indexOf(el);
      if (idx < 0) return;
      var nextIdx = e.shiftKey ? idx - 1 : idx + 1;
      if (nextIdx >= 0 && nextIdx < allInputs.length) {
        var next = allInputs[nextIdx];
        next.focus();
        next.select();
        // Scroll into view
        next.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (nextIdx >= allInputs.length) {
        // Last input — auto-save
        if (typeof saveExamData === 'function') {
          saveExamData();
          if (typeof showToast === 'function') showToast('✅ Marks saved (end of list)', '#16a34a');
        }
      }
    }
    // Number shortcuts: typing digits goes directly to the field
    // Escape clears the current field
    if (e.key === 'Escape') {
      el.value = '';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  // Add visual focus ring to mark entry inputs
  document.addEventListener('focusin', function(e) {
    var el = e.target;
    if (!el || el.tagName !== 'INPUT' || !el.getAttribute('data-ek')) return;
    el.style.outline = '3px solid var(--accent)';
    el.style.outlineOffset = '1px';
    el.style.background = '#fffbe6';
  });
  document.addEventListener('focusout', function(e) {
    var el = e.target;
    if (!el || el.tagName !== 'INPUT' || !el.getAttribute('data-ek')) return;
    el.style.outline = '';
    el.style.background = 'var(--surface)';
  });
})();
/* ═══════════════════════════════════════════
   DEEPER PARENT PORTAL
═══════════════════════════════════════════ */
(function(){
  if (typeof renderParent !== 'function') return;
  var _origPP = renderParent;
  renderParent = function() {
    // Check if we should show enhanced result view
    if (typeof _ppTab !== 'undefined' && _ppTab === 'result' && typeof _ppStudent !== 'undefined' && _ppStudent) {
      return _gnsiEnhancedParentResult();
    }
    return _origPP();
  };
})();
function _gnsiEnhancedParentResult() {
  var stu = (typeof _ppStudent !== 'undefined') ? _ppStudent : null;
  if (!stu) return (typeof renderParent === 'function') ? '' : '';
  var exams = [];
  try { exams = JSON.parse(localStorage.getItem('gnsi_exam_results') || '[]'); } catch(e) {}
  var stuExams = exams.filter(function(e){ return String(e.studentId) === String(stu.id); });
  // Group by exam name
  var examGroups = {};
  stuExams.forEach(function(e){
    if (!examGroups[e.examName]) examGroups[e.examName] = [];
    examGroups[e.examName].push(e);
  });
  // Get all students in same class for ranking
  var classmates = (typeof students !== 'undefined' ? students : []).filter(function(s){ return s.cls === stu.cls; });
  // Get batch assignment
  var assigns = (typeof gnsiLoadBatchAssign === 'function') ? gnsiLoadBatchAssign() : {};
  var batchId = assigns[String(stu.id)];
  var batchInfo = batchId ? GNSI_BATCHES.find(function(b){ return b.id === batchId; }) : null;
  var gradeColors = {'A+':'#0a6e3f','A':'#16a34a','B+':'#1433a8','B':'#0284c7','C':'#d97706','D':'#ea580c','F':'#c0291d'};
  var examCards = Object.keys(examGroups).length ? Object.keys(examGroups).map(function(examName){
    var subjects = examGroups[examName];
    var totalObt = 0, totalMax = 0;
    subjects.forEach(function(s){ totalObt += parseFloat(s.marks||0); totalMax += parseFloat(s.maxMarks||100); });
    var pct = totalMax > 0 ? Math.round(totalObt/totalMax*100) : 0;
    var grade = pct>=90?'A+':pct>=75?'A':pct>=60?'B+':pct>=50?'B':pct>=40?'C':pct>=33?'D':'F';
    var gCol = gradeColors[grade] || '#555';
    // Rank among classmates
    var classTotals = classmates.map(function(cm){
      var cmExams = exams.filter(function(e){ return String(e.studentId)===String(cm.id) && e.examName===examName; });
      var t = cmExams.reduce(function(s,e){ return s+parseFloat(e.marks||0); }, 0);
      return { id: cm.id, total: t };
    }).sort(function(a,b){ return b.total - a.total; });
    var rank = classTotals.findIndex(function(x){ return x.id === stu.id; }) + 1;
    var subRows = subjects.map(function(sub){
      var m = parseFloat(sub.marks||0);
      var mx = parseFloat(sub.maxMarks||100);
      var sp = mx>0?Math.round(m/mx*100):0;
      var sg = sp>=90?'A+':sp>=75?'A':sp>=60?'B+':sp>=50?'B':sp>=40?'C':sp>=33?'D':'F';
      var sgCol = gradeColors[sg]||'#555';
      var barW = sp;
      var barC = sp>=60?'#16a34a':sp>=33?'#f59e0b':'#dc2626';
      return '<tr>'
        + '<td style="padding:8px 12px;font-weight:600;font-size:12.5px">'+sub.subject+'</td>'
        + '<td style="text-align:center;font-weight:800;font-family:\'JetBrains Mono\',monospace">'+m+'/'+mx+'</td>'
        + '<td style="text-align:center"><span style="padding:2px 8px;border-radius:10px;font-size:11px;font-weight:800;background:'+sgCol+'18;color:'+sgCol+';border:1px solid '+sgCol+'44">'+sg+'</span></td>'
        + '<td style="min-width:80px"><div style="height:8px;background:#e2e8f0;border-radius:4px;overflow:hidden"><div style="height:100%;width:'+barW+'%;background:'+barC+';border-radius:4px"></div></div></td>'
        + '</tr>';
    }).join('');
    return '<div style="background:var(--surface);border:1.5px solid var(--border-soft);border-radius:14px;overflow:hidden;margin-bottom:16px;box-shadow:0 2px 8px rgba(0,0,0,.06)">'
      + '<div style="background:linear-gradient(135deg,#1433a8,#3b78c9);padding:14px 18px;display:flex;align-items:center;justify-content:space-between">'
      + '<div style="color:#fff;font-weight:700;font-size:14px">'+examName+'</div>'
      + '<div style="display:flex;gap:10px;align-items:center">'
      + (rank>0?'<span style="background:rgba(255,255,255,.2);color:#fff;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:700">🏆 Rank '+rank+'/'+classmates.length+'</span>':'')
      + '<span style="background:rgba(255,255,255,.2);color:#fff;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:700">'+totalObt+'/'+totalMax+'</span>'
      + '<span style="background:'+gCol+';color:#fff;padding:3px 10px;border-radius:12px;font-size:13px;font-weight:800">'+grade+'</span>'
      + '</div></div>'
      + '<div style="overflow-x:auto"><table style="width:100%"><thead><tr style="background:#f8fafc"><th style="padding:8px 12px;text-align:left;font-size:11px;color:var(--muted)">Subject</th><th style="text-align:center;font-size:11px;color:var(--muted)">Marks</th><th style="text-align:center;font-size:11px;color:var(--muted)">Grade</th><th style="font-size:11px;color:var(--muted)">Performance</th></tr></thead><tbody>'+subRows+'</tbody></table></div>'
      + '</div>';
  }).join('') : '<div style="text-align:center;padding:32px;color:var(--muted)">No exam results available yet.</div>';
  var batchBadge = batchInfo
    ? '<div style="display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:20px;background:'+batchInfo.color+'18;border:1.5px solid '+batchInfo.color+'55;color:'+batchInfo.color+';font-weight:700;font-size:12.5px;margin-top:8px">'+batchInfo.icon+' '+batchInfo.label+'</div>'
    : '';
  var hue = (stu.name||'A').charCodeAt(0) % 360;
  var profileCard = '<div style="background:linear-gradient(135deg,hsl('+hue+',60%,30%),hsl('+hue+',50%,45%));padding:20px 22px;border-radius:14px;margin-bottom:20px;display:flex;align-items:center;gap:16px">'
    + '<div style="width:54px;height:54px;border-radius:50%;background:rgba(255,255,255,.2);border:2.5px solid rgba(255,255,255,.5);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;color:#fff;flex-shrink:0">'
    + (stu.name||'S').split(' ').slice(0,2).map(function(w){return w[0];}).join('').toUpperCase()+'</div>'
    + '<div>'
    + '<div style="font-size:18px;font-weight:700;color:#fff">'+stu.name+'</div>'
    + '<div style="font-size:12px;color:rgba(255,255,255,.8);margin-top:2px">'+stu.cls+(stu.roll?' · Roll '+stu.roll:'')+'</div>'
    + batchBadge
    + '</div>'
    + '<button onclick="_ppStudent=null;render()" style="margin-left:auto;background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.4);color:#fff;padding:6px 14px;border-radius:8px;font-size:12px;cursor:pointer;font-weight:600">← Logout</button>'
    + '</div>';
  // Tab bar for parent portal
  var tabs = [
    { id:'result', icon:'📋', label:'Results' },
    { id:'fee',    icon:'💳', label:'Fee Status' },
    { id:'notices',icon:'📢', label:'Notices' },
    { id:'feedback',icon:'💬',label:'Feedback' }
  ];
  var tabBar = '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:18px">'
    + tabs.map(function(t){
        var act = (typeof _ppTab !== 'undefined') ? _ppTab === t.id : false;
        return '<button onclick="_ppTab=\''+t.id+'\';render()" style="flex:1;min-width:90px;padding:9px 6px;border-radius:8px;border:none;cursor:pointer;font-size:12px;font-weight:'+(act?'700':'500')+';font-family:DM Sans,sans-serif;background:'+(act?'var(--accent)':'var(--bg2,#f1f5f9)')+';color:'+(act?'#fff':'var(--muted)')+';transition:all .15s">'+t.icon+' '+t.label+'</button>';
      }).join('') + '</div>';
  return tabBar + profileCard + examCards;
}
/* ── Sync batch assign key ── */
(function(){
  if (typeof _patch === 'function') {
    try { _patch('gnsiSaveBatchAssign_dummy', GNSI_BATCH_ASSIGN_KEY); } catch(e) {}
  }
})();
(void 0);
</script>
<script>
/* ═══════════════════════════════════════════════════════════════════
   GNSI v66 — ATTENDANCE RBAC + ADMIN-ONLY DELETE
   Rules:
   1. Staff Attendance → ONLY Founder (id=1) or Administrator (id=2) can mark/edit
   2. Student Attendance → All authorised roles (teacher, hostel, housemaster) can mark
      BUT House Roll Call stays restricted to HM for their house only (unchanged)
   3. "All Present / All Absent / Clear" bulk buttons → Founder + Admin only
   4. Delete ANY data system-wide → admin (id=1) ONLY
      • Students, Staff, Notices, Fees, Accounts, Exam, Classes, etc.
═══════════════════════════════════════════════════════════════════ */
/* ── Identify Founder / Admin ── */
function gnsiIsFounder() {
  return !!(currentUser && currentUser.id === 1);
}
function gnsiIsAdministrator() {
  return !!(currentUser && (currentUser.role === 'admin' || currentUser.role === 'manager'));
}
function gnsiCanMarkStaffAtt() {
  /* Only Founder (id=1) or Administrator (id=2) */
  return gnsiIsFounder() || gnsiIsAdministrator();
}
function gnsiCanMarkStudentAtt() {
  if (!currentUser) return false;
  var r = currentUser.role;
  return r === 'admin' || r === 'manager' || r === 'teacher' || r === 'hostel' || r === 'housemaster';
}
function gnsiCanDeleteAnything() {
  /* ONLY admin (Founder, id=1) */
  return gnsiIsFounder();
}
/* ── Override canDo for 'del' actions ── */
(function(){
  if (typeof canDo !== 'function') return;
  var _origCanDo = canDo;
  canDo = function(action, module) {
    if (action === 'del') {
      return gnsiCanDeleteAnything();
    }
    return _origCanDo(action, module);
  };
  (void 0);
})();
/* ── Override _examCanDelete ── */
(function(){
  if (typeof examComputePermissions !== 'function') return;
  var _origECP = examComputePermissions;
  examComputePermissions = function() {
    _origECP();
    _examCanDelete = gnsiCanDeleteAnything();
  };
})();
/* ── Staff Attendance Guard on attCycleEx ── */
(function(){
  // Wait for attCycleEx to be defined by patchAttendanceFinal
  function applyAttGuard() {
    if (typeof window.attCycleEx !== 'function') {
      setTimeout(applyAttGuard, 300);
      return;
    }
    var _origCycleEx = window.attCycleEx;
    window.attCycleEx = function(type, id) {
      if (type === 'S') {
        // Staff attendance — Founder + Admin only
        if (!gnsiCanMarkStaffAtt()) {
          if (typeof showToast === 'function') {
            showToast('🔒 Staff attendance can only be marked by Founder or Administrator', '#c0291d');
          }
          return;
        }
      } else {
        // Student attendance
        if (!gnsiCanMarkStudentAtt()) {
          if (typeof showToast === 'function') {
            showToast('🔒 You do not have permission to mark student attendance', '#c0291d');
          }
          return;
        }
      }
      _origCycleEx(type, id);
    };
    (void 0);
  }
  applyAttGuard();
})();
/* ── Guard original attCycle too (used by markAtt shim) ── */
(function(){
  if (typeof attCycle !== 'function') return;
  var _origAC = attCycle;
  attCycle = function(type, id) {
    if (type === 'S' && !gnsiCanMarkStaffAtt()) {
      if (typeof showToast === 'function') showToast('🔒 Staff attendance: Founder / Admin only', '#c0291d');
      return;
    }
    if (type === 'T' && !gnsiCanMarkStudentAtt()) {
      if (typeof showToast === 'function') showToast('🔒 No permission to mark student attendance', '#c0291d');
      return;
    }
    _origAC(type, id);
  };
})();
/* ── Guard attSetTime ── */
(function(){
  if (typeof attSetTime !== 'function') return;
  var _origAST = attSetTime;
  attSetTime = function(typeKey, id, val) {
    var type = typeKey.startsWith('S') ? 'S' : 'T';
    if (type === 'S' && !gnsiCanMarkStaffAtt()) {
      if (typeof showToast === 'function') showToast('🔒 Staff attendance: Founder / Admin only', '#c0291d');
      return;
    }
    _origAST(typeKey, id, val);
  };
})();
/* ── Guard markAll2 / clearAll2 (bulk buttons) ── */
(function(){
  if (typeof markAll2 === 'function') {
    var _origMA = markAll2;
    markAll2 = function(v) {
      var type = (typeof attTab !== 'undefined' && attTab === 'staff') ? 'S' : 'T';
      if (type === 'S' && !gnsiCanMarkStaffAtt()) {
        if (typeof showToast === 'function') showToast('🔒 Bulk staff attendance: Founder / Admin only', '#c0291d');
        return;
      }
      if (type === 'T' && !gnsiCanMarkStudentAtt()) {
        if (typeof showToast === 'function') showToast('🔒 No permission', '#c0291d');
        return;
      }
      _origMA(v);
    };
  }
  if (typeof clearAll2 === 'function') {
    var _origCA = clearAll2;
    clearAll2 = function() {
      var type = (typeof attTab !== 'undefined' && attTab === 'staff') ? 'S' : 'T';
      if (type === 'S' && !gnsiCanMarkStaffAtt()) {
        if (typeof showToast === 'function') showToast('🔒 Clear staff attendance: Founder / Admin only', '#c0291d');
        return;
      }
      _origCA();
    };
  }
  if (typeof markAll === 'function') {
    var _origM = markAll;
    markAll = function(type, v) {
      if (type === 'S' && !gnsiCanMarkStaffAtt()) {
        if (typeof showToast === 'function') showToast('🔒 Staff attendance: Founder / Admin only', '#c0291d');
        return;
      }
      _origM(type, v);
    };
  }
})();
/* ── Patch renderAttendance to hide/disable staff marking for non-authorised users ── */
(function(){
  // Re-patch renderAttendance after the existing patch to inject visual guards
  function applyRenderAttGuard() {
    if (typeof renderAttendance !== 'function') { setTimeout(applyRenderAttGuard, 400); return; }
    var _origRA = renderAttendance;
    renderAttendance = function() {
      var html = _origRA();
      // If user cannot mark staff attendance, show a lock banner on staff tab
      if ((typeof attTab === 'undefined' || attTab === 'staff') && !gnsiCanMarkStaffAtt()) {
        var lockBanner = '<div style="display:flex;align-items:center;gap:12px;background:#fef2f2;border:2px solid #fca5a5;border-radius:12px;padding:14px 18px;margin-bottom:16px">'
          + '<div style="font-size:28px">🔒</div>'
          + '<div><div style="font-weight:800;font-size:14px;color:#dc2626">Staff Attendance — Restricted Access</div>'
          + '<div style="font-size:12.5px;color:#991b1b;margin-top:3px">Staff attendance can only be marked by users with <b>Admin</b> or <b>Manager</b> role. You have view-only access.</div>'
          + '</div></div>';
        // Inject after the page header
        var insertAt = html.indexOf('<div style="display:flex;gap:12px;margin-bottom:16px');
        if (insertAt > 0) {
          html = html.slice(0, insertAt) + lockBanner + html.slice(insertAt);
        } else {
          html = lockBanner + html;
        }
      }
      return html;
    };
    (void 0);
  }
  // Run after all existing patches
  setTimeout(applyRenderAttGuard, 600);
})();
/* ── Guard system-critical delete functions directly ── */
(function(){
  /* removeStudent */
  if (typeof removeStudent === 'function') {
    var _rs = removeStudent;
    removeStudent = function(id) {
      if (!gnsiCanDeleteAnything()) {
        if (typeof showToast === 'function') showToast('🔒 Only Admin (Founder) can delete student records', '#c0291d');
        return;
      }
      _rs(id);
    };
  }
  /* removeStaff */
  if (typeof removeStaff === 'function') {
    var _rst = removeStaff;
    removeStaff = function(id) {
      if (!gnsiCanDeleteAnything()) {
        if (typeof showToast === 'function') showToast('🔒 Only Admin (Founder) can delete staff records', '#c0291d');
        return;
      }
      _rst(id);
    };
  }
  /* boarderDeleteRow */
  if (typeof boarderDeleteRow === 'function') {
    var _bdr = boarderDeleteRow;
    boarderDeleteRow = function(no) {
      if (!gnsiCanDeleteAnything()) {
        if (typeof showToast === 'function') showToast('🔒 Only Admin can delete schedule rows', '#c0291d');
        return;
      }
      _bdr(no);
    };
  }
  /* boarderResetDefault */
  if (typeof boarderResetDefault === 'function') {
    var _brst = boarderResetDefault;
    boarderResetDefault = function() {
      if (!gnsiCanDeleteAnything()) {
        if (typeof showToast === 'function') showToast('🔒 Only Admin can reset boarder schedule', '#c0291d');
        return;
      }
      _brst();
    };
  }
  /* gnsiDeleteDailyEntry (HM daily log delete) — HMs can delete their own entries, Admin deletes any */
  if (typeof gnsiDeleteDailyEntry === 'function') {
    var _gde = gnsiDeleteDailyEntry;
    gnsiDeleteDailyEntry = function(id) {
      if (!gnsiCanDeleteAnything() && !gnsiIsAdministrator()) {
        if (typeof showToast === 'function') showToast('🔒 Only Admin or Administrator can delete log entries', '#c0291d');
        return;
      }
      _gde(id);
    };
  }
})();
/* ── Guard accounts/fees bulk deletes ── */
(function(){
  // The accounts page has a "Delete ALL records" button — guard it
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('button');
    if (!btn) return;
    var txt = (btn.textContent || '').toLowerCase();
    // Catch any delete-all or clear-all type buttons not already guarded
    if ((txt.includes('delete all') || txt.includes('clear all marks') || txt.includes('reset all')) && !gnsiCanDeleteAnything()) {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (typeof showToast === 'function') showToast('🔒 Only Admin (Founder) can perform bulk delete operations', '#c0291d');
    }
  }, true); // capture phase
})();
/* ── Visual: add "🔒 Admin Only" label next to delete buttons for non-admin users ── */
(function(){
  // After each render, dim delete buttons for non-admin users
  var _origRender = typeof render === 'function' ? render : null;
  if (!_origRender) return;
  render = function() {
    _origRender();
    if (gnsiCanDeleteAnything()) return; // Founder sees everything normal
    // Find all delete-class buttons
    setTimeout(function() {
      // admDelete buttons are allowed for Administrators too (id=2)
      var isAdm = (typeof gnsiCanDeleteAdmission === 'function') && gnsiCanDeleteAdmission();
      var btns = document.querySelectorAll('.btn-danger-sm, [onclick*="removeStudent"], [onclick*="removeStaff"], [onclick*="boarderDeleteRow"], [onclick*="boarderResetDefault"]');
      btns.forEach(function(btn) {
        btn.style.opacity = '0.35';
        btn.style.pointerEvents = 'none';
        btn.title = '🔒 Admin only';
      });
      // admDelete buttons: only dim if user cannot delete admissions
      if (!isAdm) {
        document.querySelectorAll('[data-adm-del], [onclick*="admDelete"]').forEach(function(btn) {
          btn.style.opacity = '0.35';
          btn.style.pointerEvents = 'none';
          btn.title = '🔒 Founder or Administrator only';
        });
      } else {
        document.querySelectorAll('[data-adm-del]').forEach(function(btn) {
          btn.style.opacity = '';
          btn.style.pointerEvents = '';
          btn.title = 'Delete admission record';
        });
      }
    }, 50);
  };
})();
/* ── Summary toast on login to remind restricted users ── */
(function(){
  if (typeof hideLoginScreen !== 'function') return;
  var _origHLS = hideLoginScreen;
  hideLoginScreen = function() {
    _origHLS();
    setTimeout(function() {
      if (!currentUser) return;
      if (gnsiIsFounder()) {
        if (typeof showToast === 'function') showToast('👑 Welcome, Founder — Full access including Staff Attendance & Delete', '#1433a8');
      } else if (gnsiIsAdministrator()) {
        if (typeof showToast === 'function') showToast('🛡 Welcome, Administrator — Staff Attendance + Admission record delete access granted.', '#0891b2');
      } else if (currentUser.role === 'admin') {
        // Another admin-role user (if any)
        if (typeof showToast === 'function') showToast('🛡 Admin access. Staff attendance & delete operations restricted to Founder.', '#7c3aed');
      }
    }, 800);
  };
})();
(void 0);
</script>

<script>
/* ═══════════════════════════════════════════════════════════════════════════
   GNSI PORTAL v24 PATCH
   All 14 requirements — corrected and complete
   ═══════════════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

/* ─── CONFIRMED HOUSE GENDER MAPPING (REQ 12) ───────────────────────────── */
var GIRLS_HOUSES = ['KOMBIREI','SINGAREI','SANAREI'];
var BOYS_HOUSES  = ['LOKTAK','KANGLA','KOUBRU','SHIROI','SANGAI','NONGIN'];

/* ─── REQ 1: Auto Admission No. — sequential from last ──────────────────── */
window.gnsiNextAdmNo = function(){
  var apps = (typeof loadAdmApps==='function') ? loadAdmApps() : [];
  var yr   = new Date().getFullYear();
  var nums = apps.map(function(a){
    var m = (a.admNo||'').match(/GNSI\/\d+\/(\d+)/);
    return m ? parseInt(m[1],10) : 0;
  }).filter(Boolean);
  var next = nums.length ? Math.max.apply(null,nums)+1 : 1;
  return 'GNSI/'+yr+'/'+String(next).padStart(3,'0');
};
/* Override the portal's own admGenNo immediately and after DOM ready */
window.admGenNo = window.gnsiNextAdmNo;
setTimeout(function(){ window.admGenNo = window.gnsiNextAdmNo; }, 300);

/* ─── REQ 2: Auto GCC No. — max existing + 1 ────────────────────────────── */
window.gnsiNextGCCNo = function(){
  var stus = (typeof students !== 'undefined' ? students : []);
  var nums = stus.map(function(s){ return parseInt(s.roll)||0; }).filter(Boolean);
  return String(nums.length ? Math.max.apply(null,nums)+1 : 700);
};

/* ─── REQ 3: Duplicate detection ────────────────────────────────────────── */
window.gnsiCheckDuplicateAdmNo = function(admNo, excludeId){
  return (typeof loadAdmApps==='function' ? loadAdmApps() : [])
    .some(function(a){ return a.admNo===admNo && a.id!==excludeId; });
};
window.gnsiCheckDuplicateGCC = function(gcc, excludeId){
  return (typeof students !== 'undefined' ? students : [])
    .some(function(s){ return String(s.roll)===String(gcc) && s.id!==excludeId; });
};

/* ─── REQ 12: House gender validation ───────────────────────────────────── */
window.gnsiValidateHouseGender = function(house, gender){
  if(!house) return {ok:true};
  var g = (gender||'').toLowerCase();
  var isBoy  = (g==='male'||g==='m');
  var isGirl = (g==='female'||g==='f');
  if(isBoy  && GIRLS_HOUSES.indexOf(house)>=0)
    return {ok:false, msg:'⚠️ '+house+' is a Girls\' House. Boys\' Houses: '+BOYS_HOUSES.join(', ')};
  if(isGirl && BOYS_HOUSES.indexOf(house)>=0)
    return {ok:false, msg:'⚠️ '+house+' is a Boys\' House. Girls\' Houses: '+GIRLS_HOUSES.join(', ')};
  return {ok:true};
};

/* ─── REQ 13: Active session ─────────────────────────────────────────────── */
window.gnsiActiveSession = function(){
  try{
    var ss = JSON.parse(localStorage.getItem('gnsi_sessions')||'[]');
    var a  = ss.find(function(s){ return s.active; });
    return a ? a.label : '';
  }catch(e){ return ''; }
};

