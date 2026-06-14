# Hostinger Fix — Manual Step Required

All code is correct. The only remaining issue is a **single hPanel setting**.

## Change in hPanel

**hPanel → Hosting → Manage → Node.js → Edit Application**

| Field | From | To |
|-------|------|----|
| Output Directory | `.next` | `standalone` |

Then click **Save** → **Restart**.

## Why

The build produces `standalone/` (with `server.js` inside). But Hostinger was told to look for `.next` as the output directory. It finds nothing there → 403.

## Verification after fix

1. hPanel shows Output Directory = `standalone`
2. Restart
3. Visit `https://jaadscloud.com/` → should return **200 OK**

## No code changes needed

- `npm run build` produces `standalone/` ✅
- `standalone/server.js` exists ✅
- `standalone/apps/web/server.js` exists ✅
- `npm start` works locally (200 OK) ✅
- Root `package.json` has `"type": "module"` ✅
- `.nvmrc` has `22` ✅
