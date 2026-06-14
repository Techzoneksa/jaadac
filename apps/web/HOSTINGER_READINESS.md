# JAAD CLOUD — Hostinger Readiness

> **Status:** Next.js `output: "standalone"` — wrapper at `standalone/server.js`, verified locally (200 OK).

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
| Startup file (if field exists) | `standalone/server.js` |

## Directory Structure After Build

```
./standalone/
├── server.js              ← Wrapper entry point (creates this file)
├── apps/web/
│   ├── server.js          ← Real Next.js standalone server
│   ├── .next/static/      ← Static chunks
│   ├── node_modules/      ← Bundled dependencies
│   └── public/            ← Public assets
└── .next/static/          ← Fallback
```

## How Build Works

1. Hostinger runs `npm install` in `./`
2. Hostinger runs `npm run build` → `node scripts/hostinger-build.mjs`
3. Build script:
   - `npm install` inside `apps/web`
   - `npm run build` inside `apps/web` → `apps/web/.next/standalone/`
   - Copies `apps/web/.next/standalone` → `./standalone/`
   - Copies `apps/web/.next/static` → `./standalone/apps/web/.next/static/`
   - Copies `apps/web/public` → `./standalone/apps/web/public/`
   - **Creates `./standalone/server.js`** — wrapper that:
     1. Changes CWD to `standalone/apps/web/`
     2. Imports and runs the real server
4. Root `standalone/` is fully self-contained

## How Start Works

`npm start` → `node scripts/hostinger-start.mjs`:

| Step | Logic |
|------|-------|
| 1 | Look for `standalone/server.js` (wrapper) |
| 2 | **Found:** spawn `node server.js` with CWD=`standalone/`, PORT, HOSTNAME |
| 3 | **Not found:** look for `standalone/apps/web/server.js` (direct) |
| 4 | **Not found either:** fallback to legacy `next start` with NODE_PATH |
| 5 | `PORT` from environment or `3000` |

### Why wrapper at `standalone/server.js`?

Hostinger expects a clear, shallow entry point. `standalone/apps/web/server.js` is nested too deep — some Hostinger configurations may not find it. The wrapper at `standalone/server.js`:

- Is a single, discoverable file at the output root
- Properly sets CWD before loading the real server
- Handles relative paths correctly

## Environment Variables (hPanel)

| Variable | Required? | Value |
|----------|-----------|-------|
| `DATABASE_URL` | ⏳ Phase 2.3 | Placeholder |
| `NEXT_PUBLIC_APP_URL` | ⏳ Phase 2.4 | `https://jaadscloud.com` |
| `SUPABASE_URL` | ✅ | From root `.env` |
| `SUPABASE_ANON_KEY` | ✅ | From root `.env` |

## Root Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `npm run build` | `node scripts/hostinger-build.mjs` | Hostinger build (standalone + wrapper) |
| `npm start` | `node scripts/hostinger-start.mjs` | Hostinger start (wrapper first, fallback) |
| `npm run dev:web` | `npm --prefix apps/web run dev` | Local Next.js dev |
| `npm run build:web` | `npm --prefix apps/web run build` | Local Next.js build |

## 403 History

| Phase | Fix |
|-------|-----|
| 2.2.3 | Documented Node.js mode requirement |
| 2.2.4 | Added root `.next` fallback |
| 2.2.5 | Added NODE_PATH for module resolution |
| 2.2.6 | Switched to `output: "standalone"` |
| **2.2.7** | Added `standalone/server.js` wrapper for clean Hostinger entry point |

## Deployment Checklist

- [x] Branch: `nextjs-migration`
- [x] Root directory: `./`
- [x] Framework: Next.js
- [x] Build command: `npm run build`
- [x] Output directory: `standalone`
- [x] Node version: 22.x
- [x] **Start command: `npm run start`**
- [x] **Application mode: Node.js**
- [x] **Startup file: `standalone/server.js`** (if field exists)
- [ ] **Environment variables** set in hPanel
- [ ] Restart after configuration

## After hPanel Configuration

1. **hPanel → Hosting → Manage → Node.js**
2. Application mode = **Node.js**
3. Output directory = **`standalone`**
4. Start command = **`npm run start`** (or Startup file = `standalone/server.js`)
5. Set environment variables
6. **Restart** the application
7. Visit `https://jaadscloud.com/`

If still 403: check Node.js logs in hPanel and send them here.
