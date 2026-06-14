# Phase 2.2.3 — Hostinger 403 Runtime Deployment Diagnosis

**Date:** 2026-06-13  
**Branch:** `nextjs-migration`  
**Commit:** `d1d2f1f` → after commit

---

## Current Status

| Step | Result |
|------|--------|
| Hostinger build | ✅ PASS |
| Visit `https://jaadscloud.com/` | ❌ **403 Forbidden** |
| Local `npm run build` from root | ✅ PASS |
| Local `npm run start` from root | ✅ **200 OK** (content served) |
| `apps/web` lint | ✅ No warnings |
| `apps/web` build | ✅ PASS (18 routes) |

## Root Cause (Diagnosis)

Local build + start returns 200. Hostinger returns 403. The difference:

- **Locally:** `npm start` runs → `next start` from `apps/web/` → serves app on port 3000
- **Hostinger:** Build completes → `.next` copied to root → **Node.js server likely not started**

### Likely Scenario

1. Hostinger runs `npm run build` ✅ (creates `apps/web/.next`, copies to `./.next`)
2. Hostinger tries to serve the app
3. If the **Node.js server is not running**, Hostinger falls back to static file serving
4. The `.next/` directory has no `index.html` at root → web server returns **403 Forbidden**
5. Or: the Node.js server starts but crashes silently (wrong CWD, missing deps, port conflict)

### What Works Locally

```bash
# From repo root — both commands work:
npm run build    # → builds Next.js + copies .next to root
npm run start    # → next start from apps/web (port 3000, 200 OK)
```

## Hostinger Settings to Fix

The critical setting missing is the **Start command**. In Hostinger hPanel:

1. **Navigate:** hPanel → Hosting → Manage → Node.js (or Advanced → Node.js)
2. **Verify:** Application mode = **Node.js** (not PHP)
3. **Set Start command:** `npm run start`
4. **Save and Restart** the application (not just redeploy)

### Required Hostinger Settings

| Setting | Value |
|---------|-------|
| Branch | `nextjs-migration` |
| Root directory | `./` |
| Framework | Next.js |
| Build command | `npm run build` |
| Output directory | `.next` |
| Node version | 22.x |
| Start command | **`npm run start`** (explicit) |

## If Start Command Not Available

Some Hostinger plans do not support Node.js runtime. Options:

### Option A — Configure Node.js runtime (recommended)
- Set Application mode to Node.js
- Set start command to `npm run start`
- This should resolve 403 immediately

### Option B — Static export (temporary workaround)
- Add `output: "export"` to `next.config.ts`
- Changes output to `out/` served as static HTML
- **Works now** (no Auth/DB yet)
- **Breaks** when Server Actions/API routes are added
- Only recommended for the current pre-Auth phase

### Option C — VPS or Cloud App Hosting
- Full Node.js runtime support
- Proper `next start` handling
- Recommended for production (Phase 3)

## Recommendation

1. First try: Set Start command to `npm run start` in Hostinger hPanel
2. If no Node.js settings exist → use **Option B (static export)** temporarily
3. Plan for VPS or App Hosting upgrade before Phase 2.4 (Auth)

## Files Updated

| File | Change |
|------|--------|
| `apps/web/HOSTINGER_READINESS.md` | Added 403 diagnosis, Node.js runtime settings, options |

## Verification

| Check | Result |
|-------|--------|
| `npm run build` from root | ✅ PASS |
| `npm start` from root (local) | ✅ 200 OK |
| `apps/web` lint | ✅ No warnings |
| `apps/web` build | ✅ 18 routes |
| Root `.next` structure | ✅ Matches `apps/web/.next` |
