# JAAD CLOUD — Hostinger Readiness

> **Status:** Hostinger Cloud Node.js hosting. Build + Start verified locally (200 OK).

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
| Start command | **`npm run start`** (set in hPanel) |
| Application mode | **Node.js** (not PHP) |

## How Build Works

1. Hostinger runs `npm install` in `./` (installs old demo deps from root `package.json`)
2. Hostinger runs `npm run build` (root) → executes `node scripts/hostinger-build.mjs`
3. The script:
   - Runs `npm install` inside `apps/web` (Next.js dependencies)
   - Runs `npm run build` inside `apps/web` (Next.js production build → `apps/web/.next`)
   - Copies `apps/web/.next` → `./.next` (Hostinger detects output at root level)
4. Hostinger runs `npm start` → `node scripts/hostinger-start.mjs`
5. The start script spawns `next start` from `apps/web/` on `$PORT || 3000`

## How Start Works

`scripts/hostinger-start.mjs`:
- Changes working directory to `apps/web/`
- Reads `$PORT` from environment (Hostinger sets this) or defaults to `3000`
- Spawns `npm run start -p $PORT` → `next start`
- Passes through all stdio for logging
- Handles SIGTERM/SIGINT for graceful shutdown

## 403 Was Caused By

Hostinger Cloud Node.js requires an explicit start command. The previous `npm --prefix apps/web run start` syntax may not have been properly executed by Hostinger's process manager. The new `node scripts/hostinger-start.mjs` script provides:
- Explicit CWD to `apps/web/`
- Proper PORT env passthrough
- Clear logging for debugging

## Root Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `npm run build` | `node scripts/hostinger-build.mjs` | Hostinger build |
| `npm start` | `node scripts/hostinger-start.mjs` | Hostinger start |
| `npm run dev:web` | `npm --prefix apps/web run dev` | Local Next.js dev |
| `npm run build:web` | `npm --prefix apps/web run build` | Local Next.js build |
| `npm run demo:build` | `vite build` | Old demo build |
| `npm run dev` | `vite dev` | Old demo dev |

## Environment Variables (Set in Hostinger Dashboard)

| Variable | Purpose | Status |
|----------|---------|--------|
| `PORT` | Server port (auto-set by Hostinger) | ✅ Auto |
| `NODE_ENV` | Environment | Set to `production` |
| `DATABASE_URL` | PostgreSQL connection | ❌ Phase 2.3+ |
| `DIRECT_URL` | Direct DB connection | ❌ Phase 2.3+ |
| `JWT_SECRET` | Auth token secret | ❌ Phase 2.4 |
| `AUTH_SECRET` | Auth.js encryption | ❌ Phase 2.4 |
| `AUTH_URL` | Public app URL | ❌ Phase 2.4 |
| `NEXT_PUBLIC_APP_URL` | Client-side app URL | ❌ Phase 2.4 |

## Deployment Checklist

- [x] Branch set to `nextjs-migration`
- [x] Root directory set to `./`
- [x] Framework set to Next.js
- [x] Build command: `npm run build`
- [x] Output directory: `.next`
- [x] Node version: 22.x
- [x] **Start command: `npm run start`** ✅
- [x] **Application mode: Node.js** ✅
- [ ] Environment variables configured
- [ ] Database provisioned
- [ ] Auth configured
- [ ] SSL enabled (auto via Let's Encrypt)

## Known Limitations

- First build may be slower (installs deps in `apps/web`)
- Two `package-lock.json` files exist — handled via `outputFileTracingRoot`
- Old demo not deployable (different framework)
- Not using static export — full Next.js server runtime
- Not using VPS — Hostinger Cloud Node.js hosting
