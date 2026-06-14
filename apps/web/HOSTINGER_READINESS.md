# JAAD CLOUD — Hostinger Readiness

> **Status:** Hostinger Cloud Node.js hosting. Verified: `npm run build && npm start` → 200 OK.

## Hostinger Settings (Required)

| Setting | Value |
|---------|-------|
| Branch | `nextjs-migration` |
| Root directory | `./` |
| Framework | Next.js |
| Build command | `npm run build` |
| Output directory | `.next` |
| Node version | 22.x |
| Package manager | npm |
| Start command | **`npm run start`** |
| Application mode | **Node.js** (not PHP) |
| Entry point (optional field) | `scripts/hostinger-start.mjs` |

## How Build Works

1. Hostinger runs `npm install` in `./` (installs old demo deps from root `package.json`)
2. Hostinger runs `npm run build` (root) → executes `node scripts/hostinger-build.mjs`
3. The build script:
   - Runs `npm install` inside `apps/web` (Next.js dependencies)
   - Runs `npm run build` inside `apps/web` (Next.js production build → `apps/web/.next`)
   - Copies `apps/web/.next` → `./.next` (Hostinger detects output at root level)
4. Root `.next` is the deployment artifact — `apps/web/.next` may or may not persist at runtime

## How Start Works

`npm start` → `node scripts/hostinger-start.mjs` (or set Entry point to `scripts/hostinger-start.mjs` directly):

| Step | Logic |
|------|-------|
| 1 | Check if `apps/web/.next` exists at runtime |
| 2 | **If yes:** run `next start` from `apps/web/` (uses `apps/web/.next`) |
| 3 | **If no (Hostinger scenario after build):** run `next start` from `./` with `NODE_PATH=apps/web/node_modules` (uses `./.next`) |
| 4 | `PORT` from environment or `3000` |
| 5 | Uses `process.execPath` (no shell) |

### Why NODE_PATH?

The `.next` directory was built inside `apps/web/`. Its server bundles reference `next` internals from `apps/web/node_modules`. When running from root with `./.next`, Node.js module resolver cannot find `next` because it's in `apps/web/node_modules`, not in root. Setting `NODE_PATH=apps/web/node_modules` tells Node to look there.

## Environment Variables (hPanel)

Set these in **hPanel → Hosting → Manage → Node.js → Environment variables**:

| Variable | Required? | Value |
|----------|-----------|-------|
| `DATABASE_URL` | ⏳ Phase 2.3 | Placeholder until DB provisioned |
| `NEXT_PUBLIC_APP_URL` | ✅ Now | `https://prominentssa.com` |
| `SUPABASE_URL` | ✅ Root `.env` | `https://xqyhynilyorvtrfclvuv.supabase.co` |
| `SUPABASE_ANON_KEY` | ✅ Root `.env` | (from root `.env` file) |

> **Note:** `SUPABASE_URL` and `SUPABASE_ANON_KEY` support the root TanStack Start app (old demo). The Next.js app in `apps/web` does not currently use Supabase.

## Root Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `npm run build` | `node scripts/hostinger-build.mjs` | Hostinger build |
| `npm start` | `node scripts/hostinger-start.mjs` | Hostinger start (**use this in hPanel**) |
| `npm run dev:web` | `npm --prefix apps/web run dev` | Local Next.js dev |
| `npm run build:web` | `npm --prefix apps/web run build` | Local Next.js build |

## Entry Point Files

| File | Purpose |
|------|---------|
| `scripts/hostinger-start.mjs` | **Primary entry.** Set as Start command (`npm run start`) or Entry point |
| `server.mjs` (root) | Legacy — same logic as above, kept for backwards compatibility |

## 403 Causes & Fixes

| Phase | Cause | Fix Applied |
|-------|-------|-------------|
| 2.2.3 | Build completed, no Node.js server started | Documented Hostinger Node.js mode requirement |
| 2.2.4 | Start script used `apps/web` CWD — `apps/web/.next` didn't exist at runtime | Added fallback to root `.next` |
| 2.2.5 | Root `.next` server bundles referenced `next` module from `apps/web/node_modules` — not found when running from root | Added `NODE_PATH=apps/web/node_modules` |
| **Now** | `package.json` `start` was `node server.mjs` — confusing; `server.mjs` had same logic but name suggested TanStack | Changed to `node scripts/hostinger-start.mjs` |

## Deployment Checklist

- [x] Branch: `nextjs-migration`
- [x] Root directory: `./`
- [x] Framework: Next.js
- [x] Build command: `npm run build`
- [x] Output directory: `.next`
- [x] Node version: 22.x
- [x] **Start command: `npm run start`**
- [x] **Application mode: Node.js**
- [x] **Entry point: `scripts/hostinger-start.mjs`** (if field exists)
- [ ] **Environment variables** set in hPanel (see table above)
- [ ] Restart after configuration
- [ ] Database provisioned (Phase 2.3)
- [ ] Auth configured (Phase 2.4)
- [ ] SSL enabled (auto via Let's Encrypt)

## After hPanel Configuration

1. **hPanel → Hosting → Manage → Node.js**
2. Application mode = **Node.js**
3. Start command = **`npm run start`** (or Entry point = `scripts/hostinger-start.mjs`)
4. Set environment variables (see table above)
5. **Restart** the application
6. Wait 10–30 seconds, visit `https://prominentssa.com/`

If still 403: check Node.js logs in hPanel and send them here.
