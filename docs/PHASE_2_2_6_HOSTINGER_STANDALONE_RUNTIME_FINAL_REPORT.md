# Phase 2.2.6 — Hostinger Next.js Standalone Runtime Fix

**Date:** 2026-06-14  
**Branch:** `nextjs-migration`  
**Commit:** `40a5a114` → after commit

---

## Root Cause (Final)

بعد 4 محاولات سابقة (2.2.3 → 2.2.4 → 2.2.5 → الآن 2.2.6)، تبين أن Hostinger Cloud Node.js قد لا يحتفظ بـ `apps/web/node_modules` في runtime. جميع الحلول السابقة (NODE_PATH, fallback CWD) كانت تعتمد على وجود مجلد `apps/web` كامل مع `node_modules`، وهذا غير مضمون.

الحل النهائي: **Next.js `output: "standalone"`** ينتج مجلدًا مكتفيًا ذاتيًا (`standalone/`) يحتوي على:

- `server.js` — خادم Node.js جاهز
- `node_modules/` مضمنة داخل الـ bundle (كل التبعيات المطلوبة)
- `static/` — ملفات الـ assets الثابتة

لا يحتاج `apps/web/node_modules` ولا `apps/web/.next` ولا `next` CLI في runtime.

## What Changed

### 1. `apps/web/next.config.ts`
- أضيف `output: "standalone"` مع الحفاظ على `outputFileTracingRoot`

### 2. `scripts/hostinger-build.mjs` (معاد بالكامل)
- بعد build Next.js، ينسخ `apps/web/.next/standalone` → `./standalone`
- ينسخ `apps/web/.next/static` → `./standalone/apps/web/.next/static`
- ينسخ `apps/web/public` → `./standalone/apps/web/public` (إن وجد)
- يتحقق من وجود `server.js` (في `standalone/apps/web/server.js` أو `standalone/server.js`)
- يخرج بـ error إذا `server.js` غير موجود

### 3. `scripts/hostinger-start.mjs` (معاد بالكامل)
- يبحث عن `standalone/apps/web/server.js` أو `standalone/server.js`
- إذا وجد: يشغّل `node server.js` مع `PORT` و `HOSTNAME=0.0.0.0`
- إذا لم يجد: fallback إلى الطريقة القديمة (next start + NODE_PATH)
- تم إزالة `SCRIPT_NAME` warning (غير مطلوب في standalone)

### 4. `apps/web/HOSTINGER_READINESS.md` (مُحدّث)
- Output directory تغير من `.next` إلى `standalone`
- كل التوثيق يعكس الـ standalone approach
- إعدادات Hostinger النهائية محدثة

## Files Changed

| File | Change |
|------|--------|
| `apps/web/next.config.ts` | Added `output: "standalone"` |
| `scripts/hostinger-build.mjs` | Rewritten — copies standalone to root |
| `scripts/hostinger-start.mjs` | Rewritten — runs standalone server.js |
| `apps/web/HOSTINGER_READINESS.md` | Updated for standalone |

## Verification

| Check | Result |
|-------|--------|
| `npm run build` from root | Build succeeds, standalone folder created |
| `npm start` (via hostinger-start.mjs) | Standalone server.js found and launched |
| HTTP status | **200 OK** |
| Static assets served | ✅ |
| `standalone/` directory exists | ✅ |
| `standalone/apps/web/server.js` exists | ✅ |
| `standalone/apps/web/.next/static` exists | ✅ |
| Fallback (no standalone) works | ✅ `next start` fallback activated |
| `apps/web` lint | ✅ No warnings |
| `apps/web` build | ✅ PASS |
| Static export added? | ❌ **No** — server mode preserved |
| Old demo modified? | ❌ **No** |

## Hostinger Final Settings

| Setting | Value |
|---------|-------|
| Branch | `nextjs-migration` |
| Root directory | `./` |
| Framework | Next.js |
| Build command | `npm run build` |
| Output directory | **`standalone`** |
| Node version | 22.x |
| Start command | **`npm run start`** |
| Application mode | **Node.js** (not PHP) |
| Entry point | `scripts/hostinger-start.mjs` |

## Why output directory changed to `standalone`

كان Hostinger يتوقع `.next` كـ output directory (إعداد سابق). الآن standalone ينتج مجلد `standalone/` في الجذر. بما أن Hostinger يستخدم output directory لتحديد القطع الأثرية للنشر، والأفضل ضبطه على `standalone` (حيث `server.js` موجود).

لو Hostinger لا يقبل `standalone` كـ output directory (يقبل `.next` فقط)، الإعدادات لا تتغير كثيرًا — يمكن ترك `.next` كـ output وضمان أن `standalone/` يُنسخ إلى الجذر أيضًا. لكن الأفضل استخدام `standalone`.

## After Deployment

1. **hPanel → Hosting → Manage → Node.js**
2. Application mode = **Node.js**
3. Output directory = **`standalone`**
4. Start command = **`npm run start`** (أو Entry point = `scripts/hostinger-start.mjs`)
5. **Restart** the application
6. Visit `https://jaadscloud.com/`

If still 403: check Node.js error logs in hPanel and send them here.
