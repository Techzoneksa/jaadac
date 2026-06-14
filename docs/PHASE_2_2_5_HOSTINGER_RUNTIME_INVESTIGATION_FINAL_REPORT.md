# Phase 2.2.5 — Hostinger Runtime Investigation

**Date:** 2026-06-13  
**Branch:** `nextjs-migration`  
**Commit:** `27aa1e7` → after commit

---

## Root Cause (Confirmed)

The `.next` directory was built inside `apps/web/`. Its server bundles reference modules from `apps/web/node_modules`. When Hostinger runs `npm start`, it may only have root `.next` available (not `apps/web/.next`), because:

- Build produces `apps/web/.next`
- Build script copies to `./.next`
- Hostinger may preserve only the output directory (`.next`) at runtime

When `next start` runs from root with `./.next`, the server bundle `_document.js` requires `next/dist/compiled/next-server/pages.runtime.prod.js`. Node.js module resolution fails because `next` is not in root `node_modules` — it's in `apps/web/node_modules`.

**Solution:** Set `NODE_PATH=apps/web/node_modules` so Node.js finds Next.js internals.

## What Changed

### New: `server.mjs` (root)

Direct Node.js entry point for Hostinger:
- Detects which `.next` directory exists (root or apps/web)
- Sets `NODE_PATH` to `apps/web/node_modules`
- Uses `process.execPath` for security (no shell)
- Passes `PORT` from environment

### Modified: `scripts/hostinger-start.mjs`

Same logic as `server.mjs`:
- Fallback detection: root `.next` vs `apps/web/.next`
- `NODE_PATH` resolution for module lookup
- Removed `shell: true` (security fix)

### Modified: `package.json` (root)

`"start": "node server.mjs"` — direct entry point, no npm subprocess

## Files Changed

| File | Change |
|------|--------|
| `server.mjs` | **New** — root Node.js entry point |
| `scripts/hostinger-start.mjs` | Updated: fallback logic, NODE_PATH, process.execPath |
| `package.json` (root) | `start` → `node server.mjs` |
| `apps/web/HOSTINGER_READINESS.md` | Updated with NODE_PATH explanation |

## Verification

| Check | Result |
|-------|--------|
| `npm run build` from root | ✅ PASS |
| `npm start` (via `node server.mjs`) | ✅ **200 OK** (dashboard: 33 kB) |
| With only root `.next` (Hostinger scenario) | ✅ **200 OK** |
| No shell deprecation warning | ✅ `process.execPath` used |
| `apps/web` lint | ✅ No warnings |
| `apps/web` build | ✅ PASS |
| Static export added? | ❌ **No** — server mode preserved |
| Old demo modified? | ❌ **No** |

## Hostinger Final Settings

| Setting | Value |
|---------|-------|
| Branch | `nextjs-migration` |
| Root directory | `./` |
| Framework | Next.js |
| Build command | `npm run build` |
| Output directory | `.next` |
| Start command | **`npm run start`** |
| Application mode | **Node.js** (not PHP) |
| Entry point | `server.mjs` (if field exists) |
| Node version | 22.x |

## After Deployment

1. Go to **hPanel → Hosting → Manage → Node.js**
2. Set **Application mode = Node.js**
3. Set **Start command = `npm run start`**
4. **Restart** the application
5. Visit `https://prominentssa.com/`

If still 403: copy the error log from Hostinger hPanel and send it.
