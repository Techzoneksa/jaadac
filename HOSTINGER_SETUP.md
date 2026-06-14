# Hostinger hPanel Setup — JAAD CLOUD

All code is correct. The 403 is caused by **hPanel configuration**, not the build.

## Required Settings

| Setting | Value |
|---------|-------|
| Application root | `./` |
| Startup file | `standalone/server.js` |
| Node.js version | `22.x` |

## Steps

1. **hPanel → Hosting → Manage → Node.js**
2. Click **"Create Application"** (or edit the existing one)
3. **Application root:** `./` (not `public_html/`)
4. **Startup file:** `standalone/server.js`
5. **Node.js version:** `22.x`
6. Click **Save**
7. Click **Restart**
8. Wait **30 seconds**
9. Open `https://prominentssa.com/`

## If still 403

- **hPanel → Hosting → Manage → Node.js → Error Logs**
- Copy the raw error log and paste it here

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Application root set to `public_html/` | Change to `./` |
| Startup file left empty or wrong path | Set to `standalone/server.js` |
| Node version below 22.x | Change to `22.x` |
| Domain not bound to Node.js app | In Node.js settings, ensure domain `prominentssa.com` is assigned |
| Old `.htaccess` in `public_html/` blocking requests | Rename or remove it |
