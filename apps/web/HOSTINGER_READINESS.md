# JAAD CLOUD — Hostinger Readiness

> **Status:** Next.js `output: "standalone"` — Build + Start verified locally (200 OK).

## Hostinger Settings (Required)

| Setting | Value |
|---------|-------|
| Branch | `nextjs-migration` |
| Root directory | `./` |
| Framework | Next.js |
| Build command | `npm run build` |
| Output directory | `standalone` |
| Node version | 22.x |
| Package manager | npm |
| Start command | **`npm run start`** |
| Application mode | **Node.js** (not PHP) |
| Entry point (optional field) | `scripts/hostinger-start.mjs` |

## How Build Works

1. Hostinger runs `npm install` in `./` (installs old demo deps from root `package.json`)
2. Hostinger runs `npm run build` (root) → executes `node scripts/hostinger-build.mjs`
3. The build script:
   - `npm install` inside `apps/web` (Next.js dependencies)
   - `npm run build` inside `apps/web` → produces `apps/web/.next/standalone` (Next.js output: "standalone")
   - Copies `apps/web/.next/standalone` → `./standalone` (Hostinger deployment artifact)
   - Copies `apps/web/.next/static` → `./standalone/apps/web/.next/static` (static assets)
   - Copies `apps/web/public` → `./standalone/apps/web/public` (public assets, if exists)
   - Root `standalone/` is self-contained — includes all required dependencies, no `node_modules` needed at runtime

### Directory structure after build

```
./standalone/
├── apps/web/
│   ├── server.js          ← Node.js entry point (standalone)
│   └── .next/static/      ← Static chunks
└── .next/static/          ← Fallback (optional)
```

## How Start Works

`npm start` → `node scripts/hostinger-start.mjs`:

| Step | Logic |
|------|-------|
| 1 | Look for `standalone/apps/web/server.js` or `standalone/server.js` |
| 2 | **Found:** spawn `node server.js` with `PORT` and `HOSTNAME=0.0.0.0` |
| 3 | **Not found:** fallback to legacy `next start` with `NODE_PATH` (Phase 2.2.5 method) |
| 4 | `PORT` from environment or `3000` |

### Why standalone?

| Problem | Solution |
|---------|----------|
| Hostinger may not keep `apps/web/node_modules` at runtime | Standalone bundles all dependencies into `standalone/` |
| `NODE_PATH=apps/web/node_modules` was fragile | No NODE_PATH needed — standalone server.js is self-contained |
| `.next` server bundles referenced `next` internal modules | Standalone includes `node_modules` inside the bundle |
| `next start` needed Next.js CLI binary | Standalone runs directly via `node server.js` |

## Environment Variables (hPanel)

Set these in **hPanel → Hosting → Manage → Node.js → Environment variables**:

| Variable | Required? | Value |
|----------|-----------|-------|
| `DATABASE_URL` | ⏳ Phase 2.3 | Placeholder until DB provisioned |
| `NEXT_PUBLIC_APP_URL` | ⏳ Phase 2.4 | `https://prominentssa.com` |
| `SUPABASE_URL` | ✅ Root `.env` | `https://xqyhynilyorvtrfclvuv.supabase.co` |
| `SUPABASE_ANON_KEY` | ✅ Root `.env` | (from root `.env` file) |

> **Note:** `SUPABASE_URL` and `SUPABASE_ANON_KEY` support the root TanStack Start app (old demo). The Next.js app in `apps/web` does not currently use Supabase.

## Root Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `npm run build` | `node scripts/hostinger-build.mjs` | Hostinger build (standalone) |
| `npm start` | `node scripts/hostinger-start.mjs` | Hostinger start (standalone server.js) |
| `npm run dev:web` | `npm --prefix apps/web run dev` | Local Next.js dev |
| `npm run build:web` | `npm --prefix apps/web run build` | Local Next.js build |

## Entry Point Files

| File | Purpose |
|------|---------|
| `scripts/hostinger-start.mjs` | **Primary entry.** Runs standalone `server.js`, falls back to `next start` |
| `server.mjs` (root) | Legacy — kept for backwards compatibility |

## 403 Causes & Fixes Summary

| Phase | Cause | Fix Applied |
|-------|-------|-------------|
| 2.2.3 | Build completed, no Node.js server started | Documented Hostinger Node.js mode requirement |
| 2.2.4 | Start script used `apps/web` CWD — `apps/web/.next` didn't exist at runtime | Added fallback to root `.next` |
| 2.2.5 | Root `.next` server bundles referenced `next` module — NODE_PATH required | Added `NODE_PATH=apps/web/node_modules` |
| **2.2.6** | Hostinger may strip `apps/web/node_modules` at runtime; `next start` fragile | **Standalone output** — all deps bundled in `standalone/` |

## Deployment Checklist

- [x] Branch: `nextjs-migration`
- [x] Root directory: `./`
- [x] Framework: Next.js
- [x] Build command: `npm run build`
- [x] Output directory: `standalone`
- [x] Node version: 22.x
- [x] **Start command: `npm run start`**
- [x] **Application mode: Node.js**
- [x] **Entry point: `scripts/hostinger-start.mjs`**
- [ ] **Environment variables** set in hPanel (see table above)
- [ ] Restart after configuration
- [ ] Database provisioned (Phase 2.3)
- [ ] Auth configured (Phase 2.4)
- [ ] SSL enabled (auto via Let's Encrypt)

## After hPanel Configuration

1. **hPanel → Hosting → Manage → Node.js**
2. Application mode = **Node.js**
3. Output directory = **`standalone`**
4. Start command = **`npm run start`** (or Entry point = `scripts/hostinger-start.mjs`)
5. Set environment variables (see table above)
6. **Restart** the application
7. Wait 10–30 seconds, visit `https://prominentssa.com/`

If still 403: check Node.js logs in hPanel and send them here.
