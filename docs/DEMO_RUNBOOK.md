# دليل التشغيل — JAAD CLOUD Demo Runbook

---

## المتطلبات

- **Node.js** v18+ (يوصى بـ v22.x)
- **npm** v9+
- متصفح حديث (Chrome, Firefox, Edge)

---

## خطوات التشغيل

### 1. تحميل المشروع

```bash
git clone https://github.com/Techzoneksa/jaadcloud.git
cd jaadcloud
git checkout phase-1-migration-audit
```

### 2. تثبيت الاعتمادات

```bash
npm install
```

> 473 packages سيتم تثبيتها.

### 3. تشغيل الخادم التطويري

```bash
npm run dev
```

> سيفتح المتصفح تلقائيًا على `http://localhost:3000`
>
> في حال عدم فتح المتصفح، افتح الرابط يدويًا.

### 4. استعراض النظام

- سجّل الدخول تلقائيًا كـ **Owner**
- ابدأ من Dashboard
- استخدم القائمة الجانبية للتنقل

---

## إعادة ضبط بيانات الديمو

بيانات الديمو مخزنة في **LocalStorage** في المتصفح.

لإعادة الضبط:

### الطريقة 1: عبر المتصفح

1. افتح أدوات المطور (F12)
2. اذهب إلى Application → Local Storage
3. امسح جميع المدخلات الخاصة بـ `jaadcloud` أو `app`
4. حدّث الصفحة (F5)

### الطريقة 2: عبر واجهة النظام

1. اذهب إلى `System → Demo Checklist`
2. استخدم خيار إعادة تعيين البيانات (إذا كان متاحًا)

### الطريقة 3: عبر الـ Console

```js
// في Console المتصفح
localStorage.clear();
location.reload();
```

---

## أين توجد...

| المكون | المسار |
|--------|--------|
| Demo Checklist | `System → Demo Checklist` في الشريط الجانبي |
| System Data Mode | `System → System Data Mode` |
| Audit Log | `System → Audit Log` |
| Backend Sandbox | `System → System Data Mode` (أسفل الصفحة) |

---

## المشاكل المحتملة

### Build فشل

```bash
npm run build
```

إذا ظهر خطأ:
- تأكد من `npm install`
- امسح `node_modules` وأعد التثبيت: `rm -rf node_modules && npm install`
- إذا استمرت المشكلة، تحقق من إصدار Node.js

### الشاشة بيضاء / الخطأ: "This page didn't load"

- امسح LocalStorage (طريقة 3 أعلاه)
- أعد تحميل الصفحة
- إذا استمرت المشكلة، شغّل `npm run build` وتحقق من الأخطاء

### لا تظهر القائمة الجانبية

- صغر حجم الشاشة؟ القائمة قد تكون مصغرة تلقائيًا
- ابحث عن زر ☰ في أعلى اليمين

### localStorage مشكلة

- localStorage يمكن أن يمتلئ. امسح بيانات التصفح بالكامل للموقع
- أو استخدم وضع التصفح الخاص (Incognito) للعرض

---

## ما لا يجب فعله أثناء العرض

- ❌ لا تفتح أدوات المطور (F12) أمام العميل
- ❌ لا تظهر الكود المصدري
- ❌ لا تغير `DATA_MODE` في الملفات
- ❌ لا تحاول تسجيل الدخول بـ Supabase (غير مفعل)
- ❌ لا تفتح `.env` أمام العميل
- ❌ لا تعدل routes أو UI أثناء العرض
- ❌ لا تقل أن النظام "إنتاجي" أو "جاهز للاستخدام الفعلي"
- ❌ لا تنقر على "Bootstrap Tenant" في Backend Sandbox أثناء العرض

---

## بعد العرض

1. اشرح للعميل أن هذه نسخة تجريبية
2. دون ملاحظات العميل
3. ارجع إلى الفريق للمناقشة
4. الخطوة التالية: تحويل إلى Next.js + تفعيل الباكند
