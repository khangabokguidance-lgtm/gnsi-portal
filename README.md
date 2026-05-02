# GNSI Portal — Restructured Architecture

## What Is In This Folder

These are the first extracted core files from your portal.
Your original portal still works exactly as before.
These files are the **target structure** — you migrate to them gradually.

```
gnsi-portal/
├── core/
│   ├── utils.js     ← esc(), showToast(), maskPhone(), searchDebounce() etc.
│   ├── state.js     ← currentUser, staff[], students[], ROLE_PAGES, canAccess()
│   ├── auth.js      ← doLogin(), PORTAL_USERS, hashPassword(), saveSession()
│   └── router.js    ← navigate(), render(), _getPageMap()
├── modules/         ← (empty — your page modules go here as you extract them)
├── styles/          ← (empty — your CSS goes here as you extract it)
└── patches/         ← (empty — your patch scripts go here)
```

---

## How To Use These Files Right Now

### Step 1 — Open your original portal_v11-2-6.html

Do NOT change anything yet. Just open it in your editor.

### Step 2 — Add these script tags to the `<head>` of your HTML

Find the existing `<script>` tags near the top of your HTML.
Add these BEFORE them:

```html
<!-- GNSI Core — load in this exact order -->
<script src="core/utils.js"></script>
<script src="core/state.js"></script>
<script src="core/auth.js"></script>
<script src="core/router.js"></script>
```

### Step 3 — Find and DELETE these functions from your HTML

Now that they live in the separate files, remove them from your big HTML.

**From utils.js — delete these from your HTML:**
- `function esc(s)` (line 6661)
- `function showToast(msg, color)` (line 6404)
- `function fmtDate(d)` 
- `function numWords(n)` (line 55005)
- `function maskPhone(ph)` (line 516)
- `function maskAadhar(num)` (line 491)
- `function _canSeePhone()` (line 482)
- `function _canSeeAadhar()` (line 487)
- `function _canSeeAddress()` (line 500)
- `function _canSeeCategory()` (line 504)
- `function _canSeeReligion()` (line 508)
- `function _canEditFees()` (line 512)
- `function searchDebounce()` (line 7099)
- `function setSyncStatus()` (line 6371)
- `function _safeBtoa()` (line 6395)
- `function _gnsiSignHash()` (line 28922)
- `function _legacyHash()` (line 28914)
- `function avatarHTML()` 
- `function badge()`
- `function dc(d)` and `function pc(p)`

**From state.js — delete these from your HTML:**
- `var staff = []` (line 6619)
- `var students = []` (line 6620)
- `var notices = []` (line ~6621)
- `var attendance = {}` (line ~6622)
- `var activePage = 'dashboard'` (line 6623)
- `var showAddStaff, showAddStudent, showAddNotice` (line ~6624)
- `var staffSearch, staffDept, studentSearch` (line ~6625)
- `var currentUser = null` (line 28782)
- `var ROLE_PAGES = {...}` (line 28747)
- `var ROLE_LABELS = {...}` (line 28758)
- `function detectRole()` (line 28763)
- `function _isAdminOrArunkumar()` (line 28785)
- `function _isAdminOrAccounts()` (line 28791)
- `function canAccess()` (wherever it is defined)

**From auth.js — delete these from your HTML:**
- `var PORTAL_USERS = {...}` (line 29404)
- `async function doLogin()` (line 29421)
- `async function hashPassword()` (line 28938)
- `async function verifyHashPassword()` (line 28958)
- `function getStoredHash()` 
- `async function setStoredHash()` (line 28974)
- `function verifyPassword()`
- `function defaultPassword()`
- `function gnsiCheckPasswordStrength()`
- `function hasMustChangeFlag()`
- `function setMustChangeFlag()`
- `function clearMustChangeFlag()`
- `function getUsername()`
- `function setUsername()`
- `function findStaffByUsername()`
- `var _LOCKOUT_MAX_FAILS = 5` (line 29112)
- `function isLockedOut()` (line 29167)
- `function recordLoginFail()` (line 29201)
- `function _clearLockout()` (line 29160)
- `function showLoginError()` (line 29208)
- `function gnsiGlobalRateCheck()` (line 28883)
- `function gnsiGlobalRateRecord()` (line 28896)
- `function _gnsiDeviceKey()`
- `function saveSession()` (line 28850)
- `function loadSession()` (line 28828)
- `function clearSession()`
- `function _sessionToken()`

**From router.js — delete these from your HTML:**
- `function navigate()` (line 7062)
- `function render()` (line 7121)
- `function debouncedRender()` (line 7091)
- `function searchDebounce()` (already in utils)
- `var _PAGE_MAP = null` (line 7084)
- `function _getPageMap()` (line 7085)
- `var _navRecentPages` and `function _navAddRecent()`

### Step 4 — Test

Open your portal in a browser. Log in. Test a few pages.
If something is broken, the most likely cause is a function deleted twice
or a function that was missed. Check the browser Console (F12) for error messages.

### Step 5 — Commit to Git

```bash
git add .
git commit -m "Extracted core utils, state, auth, and router into separate files"
```

---

## Next Steps (do one at a time, one per week)

1. Extract `staff.js` → move all functions from `renderStaff` onwards
2. Extract `students.js`
3. Extract `fees.js`
4. Extract `attendance.js`
5. Continue for each module

---

## Important Rules

1. **Always commit to Git before making changes** so you can go back
2. **Test after every extraction** — log in, check the affected page
3. **Never delete a function without checking where it is called first**
   - Search for the function name in your HTML before deleting it
   - If something else calls it, make sure the new file is loaded first
4. **Load order matters** — always load in this order:
   `utils.js` → `state.js` → `auth.js` → `router.js` → `modules/*.js`

---

## Files Extracted So Far

| File | Functions moved | Status |
|------|----------------|--------|
| core/utils.js | esc, showToast, fmtDate, numWords, maskPhone, maskAadhar, searchDebounce, setSyncStatus, _gnsiSignHash, _legacyHash | ✅ Done |
| core/state.js | staff[], students[], currentUser, ROLE_PAGES, detectRole, canAccess | ✅ Done |
| core/auth.js | doLogin, PORTAL_USERS, hashPassword, verifyHashPassword, setStoredHash, saveSession, loadSession, lockout system | ✅ Done |
| core/router.js | navigate, render, _getPageMap, debouncedRender | ✅ Done |
| modules/staff.js | (next to extract) | ⏳ Pending |
| modules/students.js | | ⏳ Pending |
| modules/fees.js | | ⏳ Pending |
| modules/attendance.js | | ⏳ Pending |
