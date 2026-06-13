# JAAD CLOUD — Hostinger Readiness

> **Note:** Deployment to Hostinger is NOT yet configured. This document captures expected settings.

## Framework

- **Framework:** Next.js
- **Node version:** 22.x (LTS)
- **Build command:** `npm run build` (from `apps/web/`)
- **Start command:** `npm start` (Next.js built-in server)
- **Output directory:** `.next/` (default)

## Environment Variables (Future)

| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@host:5432/jaadcloud` |
| `AUTH_SECRET` | Auth.js encryption key | (generate via `openssl rand -base64 32`) |
| `AUTH_URL` | Public app URL | `https://jaadcloud.com` |
| `NEXT_PUBLIC_APP_URL` | Client-side app URL | `https://jaadcloud.com` |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Support contact | `support@jaadcloud.com` |

## GitHub Integration

- **Production branch:** `main` (future)
- **Staging branch:** `staging` (future)
- **Current active branch:** `nextjs-migration`
- **Auto-deploy:** Via Hostinger GitHub integration (not yet configured)

## Build & Deploy Notes

1. Ensure `apps/web/package.json` is in the deployment root or configure Hostinger to use `apps/web` as base directory
2. Set environment variables in Hostinger dashboard (never in `.env` committed to repo)
3. SSL will be auto-provisioned via Let's Encrypt
4. Rollback available via Hostinger deployment history

## Not Yet Ready

- ❌ No database configured
- ❌ No Auth configured
- ❌ No environment variables set on Hostinger
- ❌ Hostinger GitHub integration not connected
- ❌ Domain not configured
