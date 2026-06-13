# تقرير مشروع JAAD CLOUD / جاد كلاود
## التقرير الكامل المفصل بالعربية — من الصفر حتى اليوم

> **تاريخ التقرير:** 13 يونيو 2026
> **حالة المشروع:** جاهز كنظام محاسبي تجريبي (Demo SaaS) كامل، وجاهز للتفعيل على Lovable Cloud في أي لحظة.
> **وضع البيانات الحالي:** `DATA_MODE = "demo"` — `BACKEND_WRITES_ENABLED = false`

---

## 1) نظرة عامة على المشروع

**JAAD CLOUD / جاد كلاود** هو نظام محاسبي سحابي سعودي، ثنائي اللغة (عربي RTL + إنجليزي LTR)، مصمم بأسلوب SaaS احترافي. يغطي دورة المحاسبة الكاملة:

- المبيعات (عروض أسعار، فواتير، إشعارات دائنة).
- المشتريات (أوامر شراء، فواتير مشتريات، إشعارات مدينة).
- الخزينة (إيصالات قبض، سندات صرف، حسابات بنكية، تسويات).
- المحاسبة (شجرة حسابات هرمية، قيود يومية يدوية، ضرائب VAT).
- التقارير (مالية، مبيعات، مشتريات، ضرائب، عملاء، موردين، عمر ديون).
- HR / موظفين / مشاريع / مراكز تكلفة / فروع (أساسات جاهزة).
- ZATCA Phase 1 (QR code + الحقول النظامية).
- صلاحيات حسب الدور (Owner / Accountant / Sales / Viewer).
- سجل تدقيق (Audit Log) لكل عملية حساسة.

### التقنيات المستخدمة
| الطبقة | التقنية |
|---|---|
| Framework | TanStack Start v1 (React 19 + Vite 7) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| State | Zustand + React Query |
| Routing | File-based routing من TanStack Router |
| Backend (مخطط) | Lovable Cloud (Supabase) — RLS + RPC |
| Backend (حالي) | LocalStorageDataAdapter — كل البيانات في المتصفح |
| i18n | نظام ترجمة مخصص داخلي، دعم RTL كامل |
| Auth | Mock Auth (Owner تلقائي) + جاهزية كاملة لـ Supabase Auth |

---

## 2) الخط الزمني — من الصفر حتى اليوم

### 🔵 المرحلة 1.5 — البنية الأساسية
- إنشاء هيكل المشروع، الـ AppShell، الـ Sidebar، الـ Topbar.
- نظام ترجمة AR/EN كامل مع RTL تلقائي.
- تعريف الـ Data Adapter Pattern (LocalStorage + FutureBackend).
- إنشاء أول Store (Zustand) مع بيانات تجريبية كاملة.
- صفحة Dashboard أولية.

### 🔵 المرحلة 1.6 — المبيعات والفواتير
- عروض الأسعار (Quotations) كاملة.
- فواتير المبيعات (Sales Invoices).
- تحويل عرض السعر إلى فاتورة.
- إصدار الفاتورة (Issue) → ترحيل تلقائي لقيد محاسبي.
- إيصالات قبض مع توزيع تلقائي (Auto-apply) على الفواتير.

### 🔵 المرحلة 1.6.1 — تحسينات ZATCA Phase 1
- إضافة QR Code (TLV) للفواتير.
- حقول الفاتورة الضريبية المبسطة.

### 🔵 المرحلة 1.7 — Supabase Auth & Tenant Bootstrap Foundation
- ملفات Auth آمنة (signUp/signIn/signOut/session).
- مخطط RPC `bootstrap_tenant_for_user` (ذرّي).
- صفحات تسجيل دخول / تسجيل / إعادة تعيين كلمة المرور.
- استراتيجية `active_tenant_id` عبر `app_metadata`.

### 🔵 المرحلة 1.7.1 — Tenant Bootstrap Migration Readiness
- ترحيل قاعدة البيانات `004_tenant_bootstrap.sql` جاهز للتنفيذ.
- مراجعة أمنية كاملة (SECURITY DEFINER + search_path مغلق + REVOKE/GRANT).

### 🔵 المرحلة 1.8 — Permissions System
- نظام صلاحيات كامل قائم على الأدوار.
- `PermissionGate` component يحمي الصفحات والأزرار.
- 4 أدوار: Owner, Accountant, Sales, Viewer.

### 🔵 المرحلة 1.9 — Audit Log
- سجل تدقيق لكل عملية حساسة (إصدار/قبض/صرف/ترحيل).
- صفحة `/audit-log` لاستعراض كل العمليات.

### 🔵 المرحلة 2.0 — Backend Write RPC Contracts
- 5 RPC جاهزة:
  - `quotation_convert_to_invoice`
  - `invoice_issue`
  - `receipt_create_with_auto_apply`
  - `payment_create_with_posting`
  - `journal_post_manual`
- كلها `SECURITY DEFINER` + RLS-aware + ذرّية + Audit-logged.
- `BACKEND_WRITES_ENABLED = false` — لا توجد عمليات كتابة فعلية بعد.

### 🔵 المراحل 2.0.1 / 2.0.2 — Hardening
- تحصين الـ RPC.
- ربط جدول `chart_account_purposes`.

### 🔵 المراحل 2.1 → 2.1.9 — Foundations
- Quick Create Modals (إضافة عميل/مورد/صنف/بنك/مشروع/مركز تكلفة/فرع بسرعة).
- Smart Search Selectors (بحث ذكي عن العميل/المورد/الصنف/الحساب/الفاتورة).
- Document Editor Layout موحد (عروض أسعار / فواتير مبيعات / فواتير مشتريات).
- Sidebar Architecture (إعادة تنظيم القوائم).
- Module Foundations: HR, Inventory, Fixed Assets, Bank Reconciliation, Projects.
- Supabase Activation Runbook (دليل تفعيل خطوة بخطوة).
- Dry-run Tools للتأكد من جاهزية الـ Backend بدون أي كتابة.

### 🟢 المرحلة 2.1.10 — Hierarchical Chart of Accounts ✅
- إعادة تصميم شجرة الحسابات بالكامل.
- 4 مستويات: Class → Group → Sub-group → Posting.
- Tree-grid مع expand/collapse + بحث ذكي.
- 16 Purpose قياسي (purposes) للحسابات.
- حسابات النظام مقفلة (locked) ضد الحذف/التعديل.
- محرر جانبي (Sheet) للإضافة والتعديل.

### 🟢 المرحلة 2.1.12 — Reports Center ✅
- مركز تقارير احترافي (`/reports`).
- 11 تقرير جاهز:
  - الميزانية العمومية، قائمة الدخل، التدفقات النقدية.
  - ميزان المراجعة، دفتر الأستاذ العام، كشف حساب.
  - تقرير الضرائب (VAT).
  - المبيعات حسب العميل/الصنف.
  - الفواتير غير المدفوعة / المتأخرة.
- `ReportShell` موحد + فلاتر + بحث + بطاقات KPI.

### 🟢 المرحلة 2.1.13 — Full-Page Manual Journal Editor ✅
- محرر قيود يومية بصفحة كاملة (بدل المودال القديم).
- Grid بـ 14 عمود (وصف، حساب، عملة، سعر صرف، مدين/دائن محلي و SAR، ضريبة، مركز تكلفة...).
- التحقق التلقائي من توازن القيد (Debit = Credit).
- Save Draft / Save & Post.
- القيود المرحّلة مقفلة (read-only) مع شارة واضحة.

### 🟢 المرحلة 2.1.14 — Taxes Page Foundation ✅ (الأحدث)
- صفحة جديدة `/accounting/taxes`.
- جدول ضرائب كامل: نوع، نسبة، نطاق استخدام، حالة.
- 8 معدلات VAT سعودية مُعرّفة كنظامية (مقفلة):
  - مبيعات: 15% / 0% / إعفاء.
  - مشتريات: 15% / 0% / إعفاء.
  - Out of Scope.
  - Reverse Charge 15%.
- دايلوج إضافة/تعديل ضريبة مخصصة مع تحقق كامل.
- صلاحيات: `taxes.view` + `taxes.manage`.

### 🔵 المرحلة 2.2 — Full RTL Polish
- مراجعة RTL لكل الصفحات والمكونات.
- إصلاح الأيقونات والاتجاهات.
- محاذاة الجداول والـ Sticky headers في الاتجاهين.

---

## 3) الوحدات الجاهزة الآن (Ready Modules)

### المحاسبة
- ✅ شجرة حسابات هرمية (4 مستويات + 16 purpose).
- ✅ محرر قيود يومية بصفحة كاملة.
- ✅ صفحة ضرائب (8 VAT سعودية افتراضية).
- ✅ مراكز تكلفة، مشاريع، فروع.
- ✅ Audit Log كامل.

### المبيعات
- ✅ عروض أسعار + تحويل لفاتورة.
- ✅ فواتير مبيعات + Issue + ZATCA QR.
- ✅ إيصالات قبض + Auto-apply.
- ✅ إشعارات دائنة (Credit Notes).

### المشتريات
- ✅ أوامر شراء (Purchase Orders).
- ✅ فواتير مشتريات.
- ✅ سندات صرف.
- ✅ إشعارات مدينة (Debit Notes).

### النظام
- ✅ Demo Checklist (`/demo-checklist`) — كل المراحل موثقة.
- ✅ Demo Flow (`/demo-flow`) — سيناريو تجريبي كامل.
- ✅ Data Integrity (`/data-integrity`).
- ✅ System Data Mode (`/system-data-mode`).
- ✅ Permission Check (`/permission-check`).
- ✅ Product Roadmap (`/product-roadmap`).
- ✅ Command Palette (Ctrl+K).
- ✅ Quick Create Menu.

### Backend (مُجهز ولم يُفعّل)
- ✅ 7 migrations جاهزة في `supabase/planned-migrations/`.
- ✅ 5 RPC للكتابة (Issue / Convert / Receipt / Payment / Journal Post).
- ✅ Auth wrappers + Tenant Bootstrap RPC.
- ✅ RLS Policies جاهزة لكل الجداول.
- ✅ `chart_account_purposes` mapping table.

---

## 4) القيود المحفوظة (Constraints)

| القيد | الحالة |
|---|---|
| `DATA_MODE` | `"demo"` (محفوظ) |
| `BACKEND_WRITES_ENABLED` | `false` (محفوظ) |
| Backend writes | لا توجد عمليات كتابة فعلية |
| Hardcoded secrets | ❌ ممنوع، وفعليًا لا يوجد |
| Service-role key في الواجهة | ❌ ممنوع |
| RLS على كل جدول public | ✅ مخطط بالكامل |
| GRANT على كل جدول public | ✅ مخطط بالكامل |
| RTL كامل | ✅ |
| ثنائية اللغة (AR/EN) | ✅ |

---

## 5) الإحصائيات

| العنصر | العدد |
|---|---|
| Routes (صفحات) | ~70 |
| React Components | ~120 |
| Documentation files | 50+ ملف |
| Planned SQL Migrations | 7 |
| Write RPCs | 5 |
| User Roles | 4 |
| Default VAT Rates (سعودية) | 8 |
| Reports جاهزة | 11 |
| Chart of Accounts Levels | 4 |
| Account Purposes | 16 |
| Phases مكتملة | 22 مرحلة |

---

## 6) خريطة الملفات الرئيسية

```
src/
├── routes/                     # كل الصفحات (file-based routing)
│   ├── accounting.chart.tsx    # شجرة الحسابات
│   ├── accounting.journal.*    # القيود اليومية (list/new/view/edit)
│   ├── accounting.taxes.tsx    # الضرائب ⭐ الأحدث
│   ├── quotations.*            # عروض الأسعار
│   ├── invoices.sales.*        # فواتير المبيعات
│   ├── invoices.purchases.*    # فواتير المشتريات
│   ├── receipts.tsx            # إيصالات القبض
│   ├── payments.tsx            # سندات الصرف
│   ├── reports.*               # 11 تقرير + Reports Center
│   └── auth.*                  # تسجيل دخول/تسجيل/إعادة تعيين
├── components/
│   ├── accounting/JournalEditor.tsx
│   ├── documents/              # محررات المستندات
│   ├── smart-select/           # السلكتورات الذكية
│   ├── quick-create/           # نوافذ الإنشاء السريع
│   ├── reports/ReportShell.tsx
│   └── layout/                 # AppShell / Sidebar / Topbar
├── lib/
│   ├── adapters/               # LocalStorage + FutureBackend
│   ├── services/               # الـ Business Logic
│   ├── supabase/               # Auth + Bootstrap + Dry-run
│   ├── accounting/chart-tree.ts
│   ├── store.ts                # Zustand store
│   ├── auth.tsx                # Permissions
│   └── i18n.tsx                # الترجمة
└── integrations/supabase/      # auto-generated (لا تُعدّل)

supabase/
├── migrations/                 # ملفات Supabase الرسمية
└── planned-migrations/         # 7 ملفات SQL جاهزة للتنفيذ

docs/                           # 50+ ملف توثيق لكل مرحلة
```

---

## 7) خارطة الطريق القادمة (Roadmap)

1. **تفعيل Lovable Cloud** (تشغيل الـ Backend الفعلي).
2. **ربط Tax-Rate Selector** بسطور الفواتير (المرحلة 2.1.15).
3. **ZATCA Phase 2** (الفوترة الإلكترونية بـ XML + التوقيع).
4. **HR / Payroll** كامل (الرواتب، البدلات، نهاية الخدمة).
5. **Bank Reconciliation** فعلي (مطابقة بنكية تلقائية).
6. **Data Migration Tools** (استيراد من Excel/CSV).
7. **Mobile Responsiveness** كامل.
8. **Production Auth** (OAuth + Email confirmation + Password reset).
9. **Multi-tenant Switching** (تبديل المنشآت).
10. **Reports Export** (PDF + Excel).

---

## 8) كيف تُشغّل المشروع محليًا

```bash
bun install
bun run dev
# الافتتاحية على http://localhost:5173
# تلقائيًا Mock Owner مسجّل دخوله
```

كل البيانات مخزّنة في `localStorage`. لإعادة التهيئة: زر **Demo Reset** في `/system-data-mode`.

---

## 9) ملفات التقارير المرجعية

كل مرحلة لها ملف تقرير نهائي مفصل في `docs/`:

- `docs/phase-1.5-final-report.md` … `docs/phase-2.2-final-report.md`
- `docs/product-roadmap.md`
- `docs/product-modules-map.md`
- `docs/security-permissions-plan.md`
- `docs/backend-schema-plan.md`
- `docs/supabase-activation-runbook.md`
- `docs/client-feature-summary.md`

---

## 10) الحالة النهائية

> ✅ **JAAD CLOUD جاهز بالكامل كنظام محاسبي تجريبي احترافي (Demo SaaS).**
>
> ✅ **كل البنية التحتية للـ Backend مُخطّطة ومجهزة للتفعيل في أي لحظة.**
>
> ✅ **22 مرحلة مكتملة + توثيق كامل لكل مرحلة.**
>
> ✅ **لا توجد أي أسرار مكشوفة، ولا أي كتابة فعلية على Backend.**

---

**ملف المشروع الكامل (ZIP):** `jaad-cloud-project.zip`
**تقرير إنجليزي مفصل:** `JAAD-CLOUD-PROJECT-REPORT.md`
**هذا الملف:** `JAAD-CLOUD-تقرير-مفصل-بالعربي.md`
