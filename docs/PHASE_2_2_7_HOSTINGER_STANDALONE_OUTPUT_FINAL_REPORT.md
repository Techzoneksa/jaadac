# Phase 2.2.7 — Hostinger Standalone Output Structure Fix

**Date:** 2026-06-14  
**Branch:** `nextjs-migration`  
**Commit:** `329d832` → after commit

---

## Problem

بعد تفعيل Next.js `output: "standalone"` في Phase 2.2.6، كان الـ standalone server موجودًا في `standalone/apps/web/server.js`. هذا المسار العميق قد لا تكتشفه Hostinger — فهي تحتاج entry point واضح ومباشر داخل output directory.

## Solution

إضافة wrapper file في `standalone/server.js`:

```js
import { chdir } from "node:process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const realDir = join(__dirname, "apps/web");
chdir(realDir);
await import("./apps/web/server.js");
```

ال wrapper:
1. يغير CWD إلى `standalone/apps/web/` (حيث يتوقع Next.js أن يكون)
2. يستورد `./apps/web/server.js` المسار الحقيقي
3. لا يحتاج أي تعديلات عند كل build — يُنشأ تلقائيًا

## What Changed

### 1. `scripts/hostinger-build.mjs`
- بعد نسخ standalone إلى الجذر، يكتشف `standalone/apps/web/server.js`
- ينشئ `standalone/server.js` wrapper مع CWD + import صحيح
- يستخدم `writeFileSync` (ليس template file)

### 2. `scripts/hostinger-start.mjs`
- ترتيب البحث: `standalone/server.js` أولًا، ثم `standalone/apps/web/server.js`
- عند تشغيل الـ wrapper، CWD يكون `standalone/`

### 3. `apps/web/HOSTINGER_READINESS.md`
- مُحدّث ليعكس الـ wrapper approach

## Files Changed

| File | Change |
|------|--------|
| `scripts/hostinger-build.mjs` | Added `standalone/server.js` wrapper creation |
| `scripts/hostinger-start.mjs` | Prefer `standalone/server.js` over deep path |
| `apps/web/HOSTINGER_READINESS.md` | Updated for wrapper |
| `docs/PHASE_2_2_7_HOSTINGER_STANDALONE_OUTPUT_FINAL_REPORT.md` | New |

## Structure After Fix

```
standalone/
  server.js              ← wrapper (new)
  apps/
    web/
      server.js          ← real Next.js standalone server
      .next/static/
      node_modules/
      public/
```

## Verification

| Check | Result |
|-------|--------|
| `npm run build` from root | ✅ PASS |
| `standalone/server.js` exists after build | ✅ |
| `standalone/apps/web/server.js` exists | ✅ |
| `npm start` via hostinger-start.mjs | ✅ Found wrapper at `standalone/server.js` |
| HTTP status | **200 OK** |
| Content-Length | 33,079 bytes |
| `x-powered-by` | `Next.js` |
| Ready time | 113ms |
| `apps/web` lint | ✅ No warnings |
| `apps/web` build | ✅ PASS (18 routes) |
| Static export added? | ❌ No |

## Hostinger Settings

| Setting | Value |
|---------|-------|
| Output directory | `standalone` |
| Startup file | `standalone/server.js` |
| Start command | `npm run start` |
| Application mode | Node.js |

## After Deployment

1. hPanel → Node.js → Output: `standalone`, Mode: Node.js, Start: `npm run start`
2. Restart
3. Visit `https://prominentssa.com/`
