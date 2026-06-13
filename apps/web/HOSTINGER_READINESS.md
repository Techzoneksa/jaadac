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
| Start command | **`npm run start`** (set in hPanel) |
| Application mode | **Node.js** (not PHP) |
| Entry point (if field exists) | `server.mjs` |

## How Build Works

1. Hostinger runs `npm install` in `./` (installs old demo deps from root `package.json`)
2. Hostinger runs `npm run build` (root) → executes `node scripts/hostinger-build.mjs`
3. The script:
   - Runs `npm install` inside `apps/web` (Next.js dependencies)
   - Runs `npm run build` inside `apps/web` (Next.js production build → `apps/web/.next`)
   - Copies `apps/web/.next` → `./.next` (Hostinger detects output at root level)
4. Root `.next` is the deployment artifact — `apps/web/.next` may or may not persist at runtime

## How Start Works

`npm start` → `node server.mjs` (at root):

| Step | Logic |
|------|-------|
| 1 | Check if `apps/web/.next` exists at runtime |
| 2 | **If yes:** run `next start` from `apps/web/` (uses `apps/web/.next`) |
| 3 | **If no (Hostinger scenario):** run `next start` from `./` with `NODE_PATH=apps/web/node_modules` (uses `./.next`) |
| 4 | `PORT` from environment or `3000` |
| 5 | Uses `process.execPath` (no shell) for security |

### Why NODE_PATH?

The `.next` directory was built inside `apps/web/`. Its server bundles reference `next` internals from `apps/web/node_modules`. When running from root with `./.next`, Node's module resolver cannot find `next` because it's in `apps/web/node_modules`, not in root. Setting `NODE_PATH=apps/web/node_modules` tells Node to look there.

## Root Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `npm run build` | `node scripts/hostinger-build.mjs` | Hostinger build |
| `npm start` | `node server.mjs` | Hostinger start (**use this in hPanel**) |
| `npm run dev:web` | `npm --prefix apps/web run dev` | Local Next.js dev |
| `npm run build:web` | `npm --prefix apps/web run build` | Local Next.js build |

## Entry Point Files

| File | Purpose |
|------|---------|
| `server.mjs` (root) | **Primary entry.** Set as Start command (`npm run start`) or Entry point (`server.mjs`) |
| `scripts/hostinger-start.mjs` | Same logic as `server.mjs`, used when running via npm |

## 403 Diagnosis History

The 403 occurred because:

1. **Phase 2.2.3:** Hostinger wasn't starting the Node.js server after build
2. **Phase 2.2.4:** Start script added but used `apps/web` CWD — worked locally but on Hostinger `apps/web/.next` may not exist at runtime
3. **Phase 2.2.5 (this fix):** Start script now handles both scenarios:
   - If only root `.next` exists → uses `NODE_PATH` to resolve modules from `apps/web/node_modules`
   - Works locally and on Hostinger

## Deployment Checklist

- [x] Branch set to `nextjs-migration`
- [x] Root directory set to `./`
- [x] Framework set to Next.js
- [x] Build command: `npm run build`
- [x] Output directory: `.next`
- [x] Node version: 22.x
- [x] **Start command: `npm run start`** ✅
- [x] **Application mode: Node.js** ✅
- [x] **server.mjs at root** ✅
- [ ] Environment variables configured
- [ ] Database provisioned
- [ ] Auth configured
- [ ] SSL enabled (auto via Let's Encrypt)

## After Deployment

1. hPanel → Hosting → Manage → Node.js
2. Application mode = **Node.js**
3. Start command = **`npm run start`** or Entry point = **`server.mjs`**
4. **Restart** the application
5. Visit `https://erp.jaadsa.com/`

If still 403: send Hostinger error logs from hPanel.
