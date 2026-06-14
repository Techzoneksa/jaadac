# Phase 2.2.4 — Hostinger Cloud Node.js Runtime Fix

**Date:** 2026-06-13  
**Branch:** `nextjs-migration`  
**Commit:** `7a9573f` → after commit

---

## Context

- **Hosting:** Hostinger **Cloud** Node.js (not VPS, not static)
- **Problem:** Build ✅, 403 at runtime — server not starting
- **Root cause:** Hostinger needs explicit start command that runs from `apps/web/` with proper `$PORT` handling

## What Changed

### New file: `scripts/hostinger-start.mjs`

Node.js start script that:
- Changes CWD to `apps/web/`
- Uses `$PORT` from environment (Hostinger sets this) or defaults to `3000`
- Spawns `next start` with proper logging
- Handles SIGTERM/SIGINT

### Modified: `package.json` (root)

Changed `start` from `npm --prefix apps/web run start` to `node scripts/hostinger-start.mjs`

The previous `--prefix` syntax may not have been properly handled by Hostinger's process manager. The new script provides:
- Explicit directory resolution via `path.join`
- PORT environment passthrough
- Clear startup logging
- Process signal handling

## Files Changed

| File | Change |
|------|--------|
| `scripts/hostinger-start.mjs` | **New** — Node.js start script for Hostinger |
| `package.json` (root) | `start` → `node scripts/hostinger-start.mjs` |
| `apps/web/HOSTINGER_READINESS.md` | Updated with start script details |

## Verification

| Check | Result |
|-------|--------|
| `npm run build` from root | ✅ PASS (18 routes) |
| `npm start` from root | ✅ **200 OK** (33 kB content) |
| `apps/web` lint | ✅ No warnings |
| `apps/web` build | ✅ PASS |
| Static export added? | ❌ **No** — server mode preserved |
| Application mode | Node.js (not PHP) |

## Local Test Result

```bash
> npm start
> node scripts/hostinger-start.mjs

  JAAD CLOUD — Hostinger Start Script
  App directory: .../apps/web
  Port: 3000
  Node: v24.15.0

# curl -I http://localhost:3000 → 200 OK
```

## Hostinger Final Settings

| Setting | Value |
|---------|-------|
| Branch | `nextjs-migration` |
| Root directory | `./` |
| Framework | Next.js |
| Build command | `npm run build` |
| Output directory | `.next` |
| Start command | **`npm run start`** |
| Application mode | **Node.js** |
| Node version | 22.x |

## After Deployment

1. Set **Start command** to `npm run start` in Hostinger hPanel
2. Ensure **Application mode** = **Node.js** (not PHP)
3. Click **Restart** (not just redeploy)
4. Visit `https://prominentssa.com/`
5. If still 403, send Hostinger error logs
