# Phase 2.2.1 — Hostinger Root Directory Constraint Fix

**Date:** 2026-06-13  
**Branch:** `nextjs-migration`  
**Commit:** `6316649` → after commit

---

## Problem

Hostinger locks `Root directory` to `./`. Cannot be changed to `apps/web`.  
Previous deployment tried to build the old TanStack/Vite demo from root as if it were Next.js, causing build failure.

## Solution

1. **Root `package.json`** — Added Hostinger-compatible scripts while preserving all old demo scripts
2. **`scripts/hostinger-build.mjs`** — Build script that:
   - Installs `apps/web` dependencies (`npm install`)
   - Builds Next.js (`npm run build`)
   - Copies `apps/web/.next` → `./.next` for Hostinger detection

## Files Changed

| File | Change |
|------|--------|
| `package.json` (root) | Added `build`, `start`, `dev:web`, `build:web` scripts; renamed old `build` → `demo:build` |
| `scripts/hostinger-build.mjs` | **New** — Hostinger build orchestrator |
| `apps/web/HOSTINGER_READINESS.md` | Updated with root constraint docs |

## Design Decisions

- **No npm workspaces** — Avoids lockfile conflict with old demo. Root lockfile represents frozen demo only.
- **Old demo scripts preserved** — `dev`, `demo:build`, `preview`, `lint`, `format` all unchanged
- **Root `.next` excluded from git** — Already in `.gitignore` line 30
- **`outputFileTracingRoot`** — Already configured in `next.config.ts` for monorepo lockfile

## Verification

| Check | Result |
|-------|--------|
| `npm run build` from root | ✅ Builds Next.js, copies `.next` to root |
| Root `.next/BUILD_ID` exists | ✅ |
| `apps/web` standalone build | ✅ Typecheck, lint, build all pass |
| Old demo scripts preserved | ✅ `dev`, `demo:build`, `preview` unchanged |
| `.next` in root `.gitignore` | ✅ Line 30 |

## Hostinger Settings

```json
{
  "branch": "nextjs-migration",
  "rootDirectory": "./",
  "framework": "Next.js",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "nodeVersion": "22.x"
}
```

## Next Step

- Set environment variables in Hostinger dashboard (JWT_SECRET, DATABASE_URL, etc.)
- Restart app, test login, capture error log
- Phase 2.4: Auth + Multi-Tenancy
