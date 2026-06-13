import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/lib/i18n";
import { CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { SettingsService } from "@/lib/services";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useAudit } from "@/hooks/useAudit";

export const Route = createFileRoute("/demo-checklist")({
  head: () => ({ meta: [{ title: "Demo Checklist — JAAD CLOUD" }] }),
  component: DemoChecklistPage,
});

const groups: { title: { ar: string; en: string }; items: { ar: string; en: string }[] }[] = [
  {
    title: { ar: "الوحدات الأساسية", en: "Core Modules" },
    items: [
      { ar: "لوحة التحكم", en: "Dashboard" },
      { ar: "العملاء", en: "Customers" },
      { ar: "الموردين", en: "Suppliers" },
      { ar: "المنتجات والخدمات", en: "Products & Services" },
      { ar: "عروض الأسعار", en: "Quotations" },
      { ar: "فواتير المبيعات", en: "Sales Invoices" },
      { ar: "سندات القبض", en: "Receipt Vouchers" },
      { ar: "سندات الصرف", en: "Payment Vouchers" },
    ],
  },
  {
    title: { ar: "المحاسبة", en: "Accounting" },
    items: [
      { ar: "شجرة الحسابات", en: "Chart of Accounts" },
      { ar: "القيود اليومية", en: "Journal Entries" },
      { ar: "ترحيل تلقائي للقيود", en: "Automatic Journal Posting" },
      { ar: "قفل القيود المرحّلة", en: "Posted Entries Locked" },
    ],
  },
  {
    title: { ar: "الإدارة والتقارير", en: "Management & Reports" },
    items: [
      { ar: "المهام (قائمة + لوحة)", en: "Tasks (List + Board)" },
      { ar: "التقارير الستة", en: "All 6 Reports" },
      { ar: "الإعدادات", en: "Settings" },
    ],
  },
  {
    title: { ar: "التعريب والتصميم", en: "Localization & Design" },
    items: [
      { ar: "العربية / الإنجليزية", en: "Arabic / English" },
      { ar: "RTL / LTR", en: "RTL / LTR" },
      { ar: "البيانات التجريبية السعودية", en: "Saudi Demo Data" },
      { ar: "قوالب الطباعة (فاتورة، عرض، سندات)", en: "Print Layouts (Invoice, Quote, Vouchers)" },
      { ar: "رمز QR على الفاتورة المبسطة", en: "QR Code on Simplified Tax Invoice" },
      { ar: "العملة SAR وضريبة 15%", en: "SAR Currency & 15% VAT" },
    ],
  },
  {
    title: { ar: "المرحلة 1.2 — أساس SaaS", en: "Phase 1.2 — SaaS Foundation" },
    items: [
      { ar: "بنية البيانات (Tenant، User، Role)", en: "Data architecture (Tenant, User, Role)" },
      { ar: "سياق المؤسسة الحالية", en: "Current tenant context" },
      { ar: "صفحات الدخول/التسجيل/كلمة المرور", en: "Login / Register / Forgot pages" },
      { ar: "هيكل الأدوار والصلاحيات", en: "Roles & permission structure" },
      { ar: "طبقة الخدمات (CRUD لكل وحدة)", en: "Service layer (CRUD per module)" },
      { ar: "محرك المحاسبة (AccountingEngine)", en: "Accounting engine" },
      { ar: "خدمة الترقيم المركزية", en: "Numbering service" },
      { ar: "طبقة التحقق ثنائية اللغة", en: "Bilingual validation layer" },
      { ar: "سجل المراجعة /audit-log", en: "Audit log /audit-log" },
      { ar: "إعادة تعيين البيانات التجريبية", en: "Reset demo data" },
      { ar: "حالات التحميل/الفراغ/الخطأ", en: "Loading / empty / error states" },
    ],
  },
  {
    title: { ar: "المرحلة 1.3 — الصلاحيات والمراجعة", en: "Phase 1.3 — Permissions & Audit" },
    items: [
      { ar: "مكوّن PermissionGate", en: "PermissionGate component" },
      { ar: "صفحة AccessDenied ثنائية اللغة", en: "Bilingual AccessDenied page" },
      { ar: "تصفية القائمة الجانبية حسب الصلاحيات", en: "Sidebar filtered by permissions" },
      { ar: "إخفاء أزرار الإنشاء/التعديل/الحذف عند عدم الصلاحية", en: "Hide create/edit/delete when not allowed" },
      { ar: "حماية المسارات المباشرة", en: "Direct route access protected" },
      { ar: "تكامل التحقق ValidationService", en: "ValidationService integration" },
      { ar: "تغطية شاملة لسجل المراجعة", en: "Full audit log coverage" },
      { ar: "فلاتر سجل المراجعة (إجراء/كيان/مستخدم/تاريخ)", en: "Audit filters (action/entity/user/date)" },
      { ar: "صفحة فحص الصلاحيات /permission-check", en: "Permission check page /permission-check" },
      { ar: "تسجيل أحداث المصادقة (دخول/خروج/تبديل دور)", en: "Auth events logged (login/logout/role switch)" },
      { ar: "ثبات تدفق العرض → الفاتورة → القبض → القيد", en: "Quote → Invoice → Receipt → Journal regression OK" },
    ],
  },
  {
    title: { ar: "المرحلة 1.4 — تجهيز الباك اند وطبقة المحوّل", en: "Phase 1.4 — Backend Prep & Data Adapter Layer" },
    items: [
      { ar: "تحقق إعادة التسمية إلى JAAD CLOUD", en: "Product rename verified (JAAD CLOUD)" },
      { ar: "واجهة DataAdapter", en: "DataAdapter interface" },
      { ar: "LocalStorageDataAdapter", en: "LocalStorageDataAdapter" },
      { ar: "FutureBackendDataAdapter (مكان محجوز)", en: "FutureBackendDataAdapter placeholder" },
      { ar: "موفّر/إعداد المحوّل المركزي", en: "Central adapter config/provider" },
      { ar: "الخدمات تستخدم المحوّل بدل الوصول المباشر", en: "Services use adapter (not store)" },
      { ar: "عقود TypeScript جاهزة للباك اند (ServiceResult / ValidationError / Paginated / ListQueryParams / ApiErrorShape)", en: "Backend-ready contracts (ServiceResult / ValidationError / Paginated / ListQueryParams / ApiErrorShape)" },
      { ar: "بحث/فلترة/ترقيم صفحات قياسي", en: "Standard list/search/filter/pagination" },
      { ar: "صفحة /system-data-mode", en: "/system-data-mode page" },
      { ar: "صفحة /data-integrity", en: "/data-integrity page" },
      { ar: "تصدير لقطة بيانات الديمو (JSON)", en: "Migration snapshot export (JSON)" },
      { ar: "تصلب البذرة وإعادة التعيين (seedVersion / lastResetAt / resetBy)", en: "Seed/reset hardening (seedVersion/lastResetAt/resetBy)" },
      { ar: "معالجة أخطاء موحّدة (AppError + رسائل ثنائية)", en: "Standard error handling (AppError + bilingual)" },
      { ar: "روابط داخلية في القائمة العلوية", en: "Internal navigation links in Topbar" },
      { ar: "اختبار انحدار تدفق الديمو عبر المحوّل", en: "Adapter regression test (full demo flow)" },
    ],
  },
  {
    title: { ar: "المرحلة 1.4.1 — نقاء المحوّل وتجهيز التبديل للباك اند", en: "Phase 1.4.1 — Adapter Purity & Backend-Swap Cleanup" },
    items: [
      { ar: "لا توجد كتابات store.set في صفحات الواجهة", en: "No direct store.set in UI pages" },
      { ar: "العملاء عبر CustomerService", en: "Customers use CustomerService" },
      { ar: "الموردون عبر SupplierService", en: "Suppliers use SupplierService" },
      { ar: "الأصناف عبر ItemService", en: "Items use ItemService" },
      { ar: "عروض الأسعار عبر QuotationService", en: "Quotations use QuotationService" },
      { ar: "الفواتير عبر InvoiceService", en: "Invoices use InvoiceService" },
      { ar: "سندات القبض عبر ReceiptService (مع AccountingEngine)", en: "Receipts use ReceiptService (+ AccountingEngine)" },
      { ar: "سندات الصرف عبر PaymentService (مع AccountingEngine)", en: "Payments use PaymentService (+ AccountingEngine)" },
      { ar: "المهام عبر TaskService", en: "Tasks use TaskService" },
      { ar: "القيود اليدوية عبر JournalService / AccountingEngine", en: "Journal uses JournalService / AccountingEngine" },
      { ar: "سجل المراجعة يلتقط جميع الأحداث", en: "Audit log captures all key actions" },
      { ar: "التحقق ثنائي اللغة لا يزال يعمل", en: "Bilingual validation still works" },
      { ar: "الصلاحيات لا تزال مفروضة", en: "Permissions still enforced" },
      { ar: "اختبار انحدار الديمو الكامل ناجح", en: "Full demo regression passed" },
    ],
  },
  {
    title: { ar: "المرحلة 1.5 — تخطيط مخطط الباك اند وعقود الـ API", en: "Phase 1.5 — Backend Schema & API Contract Planning" },
    items: [
      { ar: "خطة مخطط قاعدة البيانات (docs/backend-schema-plan.md)", en: "Backend schema plan (docs/backend-schema-plan.md)" },
      { ar: "نموذج الأمان متعدد المستأجرين (docs/security-permissions-plan.md)", en: "Multi-tenant security model (docs/security-permissions-plan.md)" },
      { ar: "عقود الـ API (docs/api-contracts.md)", en: "API contracts (docs/api-contracts.md)" },
      { ar: "خطة الترحيل من LocalStorage إلى Postgres (docs/migration-plan.md)", en: "Migration mapping (docs/migration-plan.md)" },
      { ar: "خطة تنفيذ FutureBackendDataAdapter (docs/backend-adapter-plan.md)", en: "Backend adapter plan (docs/backend-adapter-plan.md)" },
      { ar: "قائمة مخاطر الإنتاج", en: "Production risk checklist" },
      { ar: "ملفات التوثيق تحت docs/", en: "Documentation files under docs/" },
      { ar: "جاهزية المرحلة التالية (تنفيذ الباك اند)", en: "Next phase readiness (backend implementation)" },
    ],
  },
  {
    title: { ar: "المرحلة 1.6 — أساس Supabase للباك اند", en: "Phase 1.6 — Supabase Backend Foundation" },
    items: [
      { ar: "هيكل ملفات Supabase (config / migrations / seed)", en: "Supabase structure (config / migrations / seed)" },
      { ar: "ملف .env.example بمتغيرات وهمية", en: ".env.example with placeholders" },
      { ar: "الترحيل الأولي للمخطط (23 جدولًا)", en: "Initial schema migration (23 tables)" },
      { ar: "قيود وحمايات قاعدة البيانات (محفّزات)", en: "Database constraints & safety triggers" },
      { ar: "سياسات RLS لجميع الجداول حسب المستأجر", en: "RLS policies on all tenant-scoped tables" },
      { ar: "دوال مساعدة (current_tenant_id / is_tenant_member / has_role)", en: "Helper functions (current_tenant_id / is_tenant_member / has_role)" },
      { ar: "ملف بذرة آمن للتطوير (شركة جاد التجريبية)", en: "Safe dev seed (JAAD Demo Company)" },
      { ar: "أساس عميل Supabase (env / client / types)", en: "Supabase client foundation (env / client / types)" },
      { ar: "فحص إعدادات FutureBackendDataAdapter", en: "FutureBackendDataAdapter config check + health" },
      { ar: "حالة الباك اند في /system-data-mode", en: "Backend status on /system-data-mode" },
      { ar: "وثائق إعداد Supabase (docs/supabase-setup.md)", en: "Supabase setup docs (docs/supabase-setup.md)" },
      { ar: "اختبار انحدار الديمو بدون متغيرات Supabase", en: "Demo regression without Supabase env" },
    ],
  },
  {
    title: { ar: "المرحلة 1.6.1 — جاهزية تطبيق ترحيلات Supabase", en: "Phase 1.6.1 — Supabase Migration Application Readiness" },
    items: [
      { ar: "تحويل SQL المخطط إلى ترحيلات قابلة للتشغيل تحت supabase/migrations", en: "Planned SQL converted to runnable migrations under supabase/migrations" },
      { ar: "ترتيب الترحيلات آمن (مخطط → محفّزات → RLS)", en: "Migration order verified (schema → triggers → RLS)" },
      { ar: "التحقق من عدد الجداول (23 جدولًا)", en: "Table count verified (23 tables — line tables grouped in 1.5)" },
      { ar: "اعتمادات RLS تحقّقت قبل السياسات (الدوال المساعدة موجودة)", en: "RLS dependencies verified (helper functions present)" },
      { ar: "حزمة @supabase/supabase-js مثبتة", en: "@supabase/supabase-js installed" },
      { ar: "ظهور معلومات الترحيل في /system-data-mode", en: "Migration visibility on /system-data-mode" },
      { ar: "الوضع التجريبي لا يزال الافتراضي", en: "Demo mode still default" },
      { ar: "البناء نظيف", en: "Build clean" },
    ],
  },
  {
    title: { ar: "المرحلة 1.7 — أساس مصادقة Supabase وتجهيز المؤسسة", en: "Phase 1.7 — Supabase Auth & Tenant Bootstrap Foundation" },
    items: [
      { ar: "أغلفة مصادقة Supabase (auth.ts)", en: "Supabase auth wrappers (auth.ts)" },
      { ar: "مساعدات الجلسة (session.ts)", en: "Session helpers (session.ts)" },
      { ar: "خدمة تجهيز المؤسسة (tenant-bootstrap.ts)", en: "Tenant bootstrap service (tenant-bootstrap.ts)" },
      { ar: "SQL/RPC لتجهيز المؤسسة (planned-migrations/004)", en: "Bootstrap SQL/RPC (planned-migrations/004)" },
      { ar: "واجهة تسجيل الدخول جاهزة للباك اند", en: "Auth UI backend readiness" },
      { ar: "استراتيجية active_tenant_id موثّقة", en: "active_tenant_id strategy documented" },
      { ar: "وعي المحوّل بالمصادقة والجلسة", en: "FutureBackendDataAdapter auth/session awareness" },
      { ar: "لوحة المصادقة في /system-data-mode", en: "Auth panel on /system-data-mode" },
      { ar: "وثائق (auth-plan / tenant-bootstrap-plan)", en: "Docs (auth-plan / tenant-bootstrap-plan)" },
      { ar: "اختبار انحدار الديمو بدون متغيرات Supabase", en: "Demo regression without Supabase env" },
    ],
  },
  {
    title: { ar: "المرحلة 1.7.1 — جاهزية ترحيل تجهيز المؤسسة", en: "Phase 1.7.1 — Tenant Bootstrap Migration Readiness" },
    items: [
      { ar: "ترحيل قابل للتشغيل تحت supabase/migrations (004)", en: "Runnable migration under supabase/migrations (004)" },
      { ar: "مراجعة دالة bootstrap_tenant_for_user", en: "bootstrap_tenant_for_user RPC reviewed" },
      { ar: "دوال مساعدة (settings / chart / profile)", en: "Helper functions (settings / chart / profile)" },
      { ar: "SECURITY DEFINER + search_path آمن", en: "SECURITY DEFINER + locked search_path" },
      { ar: "تحقق auth.uid() ومنع الانتحال", en: "auth.uid() validation, no impersonation" },
      { ar: "حماية من التجهيز المكرر", en: "Duplicate bootstrap protection" },
      { ar: "ظهور الترحيل في /system-data-mode (عدد = 4)", en: "Migration visible on /system-data-mode (count = 4)" },
      { ar: "وثائق محدّثة", en: "Docs updated" },
      { ar: "الوضع التجريبي لا يزال الافتراضي", en: "Demo mode still default" },
      { ar: "البناء نظيف", en: "Build clean" },
    ],
  },
  {
    title: { ar: "المرحلة 1.8 — جاهزية محوّل الباك اند", en: "Phase 1.8 — FutureBackendDataAdapter Readiness" },
    items: [
      { ar: "مجموعات طرق المحوّل لكل وحدة", en: "Adapter method groups per domain" },
      { ar: "ربط العقد مع جداول/RPC في Supabase", en: "Supabase table/RPC contract mapping" },
      { ar: "تطبيع نتائج وأخطاء الباك اند", en: "Backend result/error normalization" },
      { ar: "مساعدات الاستعلام (pagination/sort/date/search)", en: "Query helpers (pagination/sort/date/search)" },
      { ar: "فحوصات قراءة فقط (اتصال/جلسة/مؤسسة/RLS/RPC)", en: "Read-only smoke checks (connection/session/tenant/RLS/RPC)" },
      { ar: "قسم جاهزية المحوّل في /system-data-mode", en: "Backend Adapter Readiness section on /system-data-mode" },
      { ar: "زر تشغيل فحوصات القراءة الآمنة", en: "Run Read-Only Backend Checks button" },
      { ar: "وثائق محدّثة (backend-adapter-plan / supabase-setup)", en: "Docs updated (backend-adapter-plan / supabase-setup)" },
      { ar: "الوضع التجريبي لا يزال الافتراضي", en: "Demo mode still default" },
      { ar: "البناء نظيف", en: "Build clean" },
    ],
  },
  {
    title: { ar: "المرحلة 1.9 — تنفيذ القراءة من الباك اند", en: "Phase 1.9 — Backend Read-Only Adapter" },
    items: [
      { ar: "طرق قراءة فقط لكل الكيانات الأساسية", en: "Read-only methods for all core entities" },
      { ar: "تصفية الاستعلامات حسب tenant_id", en: "Tenant-filtered queries" },
      { ar: "قسم معاينة الباك اند في /system-data-mode", en: "Backend preview section on /system-data-mode" },
      { ar: "التحقق من RLS عبر فحوصات قراءة فقط", en: "RLS verification via read-only checks" },
      { ar: "أنواع صفوف Supabase (محافظة يدويًا)", en: "Maintained Supabase row types" },
      { ar: "الكتابة لا تزال معطّلة (writes_disabled)", en: "Writes still disabled (writes_disabled)" },
      { ar: "أخطاء ثنائية اللغة للباك اند", en: "Bilingual backend errors" },
      { ar: "الوضع التجريبي لا يزال الافتراضي", en: "Demo mode remains default" },
      { ar: "وثائق محدّثة (phase-1.9-final-report)", en: "Docs updated (phase-1.9-final-report)" },
      { ar: "البناء نظيف", en: "Build clean" },
    ],
  },
  {
    title: { ar: "المرحلة 2.0 — عقود ودوال الكتابة في الباك اند", en: "Phase 2.0 — Backend Write RPC Contracts & SQL Functions" },
    items: [
      { ar: "ترحيل دوال الكتابة (20260611120005)", en: "Write RPC migration (20260611120005)" },
      { ar: "quotation_convert_to_invoice RPC", en: "quotation_convert_to_invoice RPC" },
      { ar: "invoice_issue RPC", en: "invoice_issue RPC" },
      { ar: "receipt_create_with_auto_apply RPC", en: "receipt_create_with_auto_apply RPC" },
      { ar: "payment_create_with_posting RPC", en: "payment_create_with_posting RPC" },
      { ar: "journal_post_manual RPC", en: "journal_post_manual RPC" },
      { ar: "SECURITY DEFINER + search_path آمن", en: "SECURITY DEFINER + locked search_path" },
      { ar: "تحقق المؤسسة + الدور + الملكية", en: "Tenant + role + ownership validation" },
      { ar: "سجل مراجعة لكل RPC", en: "Audit log on every RPC" },
      { ar: "ربط RPC في FutureBackendDataAdapter", en: "FutureBackendDataAdapter RPC mapping" },
      { ar: "BACKEND_WRITES_ENABLED = false", en: "BACKEND_WRITES_ENABLED = false" },
      { ar: "قسم جاهزية الكتابة في /system-data-mode", en: "Backend Write Readiness section on /system-data-mode" },
      { ar: "وثائق (backend-write-rpc-plan)", en: "Docs (backend-write-rpc-plan)" },
      { ar: "الوضع التجريبي لا يزال الافتراضي", en: "Demo mode still default" },
      { ar: "البناء نظيف", en: "Build clean" },
    ],
  },
  {
    title: { ar: "المرحلة 2.0.1 — تقوية دوال الكتابة ومراجعة الإنتاج", en: "Phase 2.0.1 — Write RPC Hardening & Production Safety Review" },
    items: [
      { ar: "مراجعة ترحيل دوال الكتابة (20260611120005)", en: "Reviewed write RPC migration (20260611120005)" },
      { ar: "ترحيل تقوية (20260611120006)", en: "Hardening migration (20260611120006)" },
      { ar: "ترقيم مقفل لكل مؤسسة (document_number_sequences)", en: "Tenant-scoped locked numbering (document_number_sequences)" },
      { ar: "بحث الحساب الدلالي (_jaad_get_account)", en: "Semantic account lookup (_jaad_get_account)" },
      { ar: "عقد أخطاء موحّد (code/message_ar/message_en)", en: "Standardized error contract (code/message_ar/message_en)" },
      { ar: "مصفوفة صلاحيات الـ RPC موثّقة", en: "RPC permission matrix documented" },
      { ar: "validate_tenant_account_setup / validate_numbering_setup / list_write_rpc_readiness", en: "validate_tenant_account_setup / validate_numbering_setup / list_write_rpc_readiness" },
      { ar: "WRITE_RPC_METADATA في المحوّل", en: "WRITE_RPC_METADATA in adapter" },
      { ar: "قسم جاهزية الكتابة محدّث في /system-data-mode", en: "Backend Write Readiness panel updated" },
      { ar: "BACKEND_WRITES_ENABLED = false", en: "BACKEND_WRITES_ENABLED = false" },
      { ar: "وثائق (phase-2.0.1-final-report)", en: "Docs (phase-2.0.1-final-report)" },
      { ar: "الوضع التجريبي لا يزال الافتراضي", en: "Demo mode still default" },
      { ar: "البناء نظيف", en: "Build clean" },
    ],
  },
  {
    title: { ar: "المرحلة 2.0.2 — ربط أغراض الحسابات وفحوصات جاهزية RPC", en: "Phase 2.0.2 — Chart Account Purpose Mapping & RPC Readiness Checks" },
    items: [
      { ar: "ترحيل chart_account_purposes (مخطط 007)", en: "chart_account_purposes migration (planned 007)" },
      { ar: "سياسات RLS لجدول الربط", en: "RLS policies for mapping table" },
      { ar: "_jaad_get_account يبدأ بالبحث في جدول الربط", en: "_jaad_get_account: mapping-first lookup" },
      { ar: "بذر/تجهيز يضيف الأغراض الافتراضية تلقائيًا", en: "Seed/bootstrap inserts default purpose mappings" },
      { ar: "9 أغراض مدعومة (cash..accounts_payable)", en: "9 purposes supported (cash..accounts_payable)" },
      { ar: "validate_tenant_account_setup (للقراءة فقط)", en: "validate_tenant_account_setup (read-only)" },
      { ar: "validate_numbering_setup (للقراءة فقط)", en: "validate_numbering_setup (read-only)" },
      { ar: "list_write_rpc_readiness (للقراءة فقط)", en: "list_write_rpc_readiness (read-only)" },
      { ar: "FutureBackendDataAdapter: getWriteRpcReadiness / getAccountPurposeReadiness / getNumberingReadiness", en: "Adapter readiness methods exposed" },
      { ar: "زر Run Write Readiness Checks في /system-data-mode", en: "Run Write Readiness Checks button on /system-data-mode" },
      { ar: "فحص أغراض الحسابات في /data-integrity", en: "Account purpose check on /data-integrity" },
      { ar: "وثائق (phase-2.0.2-final-report)", en: "Docs (phase-2.0.2-final-report)" },
      { ar: "BACKEND_WRITES_ENABLED = false", en: "BACKEND_WRITES_ENABLED = false" },
      { ar: "الوضع التجريبي لا يزال الافتراضي", en: "Demo mode still default" },
      { ar: "البناء نظيف", en: "Build clean" },
    ],
  },
  {
    title: { ar: "المرحلة 2.1 — التحقق من جاهزية الباك اند والفحص الجاف", en: "Phase 2.1 — Backend Readiness Verification & Supabase Dry Run" },
    items: [
      { ar: "التحقق من متغيرات Supabase (آمن)", en: "Supabase env verification (safe)" },
      { ar: "التحقق من ترتيب ملفات الترحيل", en: "Migration order verification" },
      { ar: "فحوصات قراءة فقط جديدة (env/conn/auth/tenant/RLS)", en: "New read-only checks (env/conn/auth/tenant/RLS)" },
      { ar: "فحص رؤية الجداول المطلوبة", en: "Required tables visibility" },
      { ar: "فحص وجود الـ RPCs المطلوبة", en: "Required RPCs existence" },
      { ar: "تجميع جاهزية الأغراض والترقيم وكتابة RPC", en: "Aggregated purpose/numbering/write RPC readiness" },
      { ar: "قسم تقرير الفحص الجاف في /system-data-mode", en: "Backend Dry Run Report panel on /system-data-mode" },
      { ar: "حالة شاملة (Ready / Needs migration / RLS issue / Skipped)", en: "Overall status (Ready / Needs migration / RLS issue / Skipped)" },
      { ar: "adapter.health / runBackendDryRun / getSchemaReadiness / getRpcReadiness / getWriteReadiness", en: "adapter.health / runBackendDryRun / getSchemaReadiness / getRpcReadiness / getWriteReadiness" },
      { ar: "تسجيل آمن (إخفاء المفاتيح، بدون JWT)", en: "Safe logging (masked keys, no JWT)" },
      { ar: "وثائق backend-readiness-checks + phase-2.1-final-report", en: "Docs backend-readiness-checks + phase-2.1-final-report" },
      { ar: "BACKEND_WRITES_ENABLED = false", en: "BACKEND_WRITES_ENABLED = false" },
      { ar: "الوضع التجريبي لا يزال الافتراضي", en: "Demo mode still default" },
      { ar: "البناء نظيف", en: "Build clean" },
    ],
  },
  {
    title: { ar: "المرحلة 2.1.1 — إنهاء ترحيل ربط أغراض الحسابات", en: "Phase 2.1.1 — Chart Account Purpose Migration Finalization" },
    items: [
      { ar: "تحويل ترحيل 007 من مخطّط إلى قابل للتشغيل", en: "Planned migration 007 converted" },
      { ar: "ملف ترحيل chart_account_purposes موجود في supabase/migrations/", en: "Runnable chart_account_purposes migration exists" },
      { ar: "ترتيب الترحيلات تم التحقق منه (001→007)", en: "Migration order verified (001→007)" },
      { ar: "تحديث اكتشاف الفحص الجاف", en: "Dry run detection updated" },
      { ar: "تحديث /system-data-mode (عدد الترحيلات + ترحيل الربط)", en: "System data mode updated (migration count + mapping)" },
      { ar: "تحديث الوثائق (phase-2.1.1-final-report)", en: "Docs updated (phase-2.1.1-final-report)" },
      { ar: "BACKEND_WRITES_ENABLED = false", en: "Backend writes still disabled" },
      { ar: "الانحدار التجريبي ناجح", en: "Demo regression passes" },
      { ar: "البناء نظيف", en: "Build clean" },
    ],
  },
  {
    title: { ar: "المرحلة 2.1.2A — تطبيق الترحيلات السبعة (تم) / يحتاج إعداد المصادقة والمؤسسة", en: "Phase 2.1.2A — 7 Migrations Applied / Needs Auth & Tenant Setup" },
    items: [
      { ar: "التحقق من VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (آمن، بدون كشف)", en: "Verify VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (safe, no exposure)" },
      { ar: "التحقق من 7 ملفات ترحيل قابلة للتشغيل بالترتيب الصحيح", en: "Verify 7 runnable migration files in correct order" },
      { ar: "عدم وجود drop/reset مدمّر أو مفاتيح service role في الواجهة", en: "No destructive drop/reset or service role in frontend" },
      { ar: "تشغيل الفحص الجاف الحي عند توفر env (اتصال/جلسة/مؤسسة/RLS/جداول/RPCs)", en: "Run live dry run when env present (conn/session/tenant/RLS/tables/RPCs)" },
      { ar: "الفحص الجاف يبلّغ Skipped بأمان عند غياب env", en: "Dry run reports Skipped safely when env missing" },
      { ar: "FutureBackendDataAdapter يعيد backend_not_configured / no_session / tenant_required / rls_denied", en: "FutureBackendDataAdapter returns backend_not_configured / no_session / tenant_required / rls_denied" },
      { ar: "وثائق live-supabase-dry-run + phase-2.1.2-final-report", en: "Docs live-supabase-dry-run + phase-2.1.2-final-report" },
      { ar: "BACKEND_WRITES_ENABLED = false", en: "Backend writes still disabled" },
      { ar: "الانحدار التجريبي ناجح", en: "Demo regression passes" },
      { ar: "البناء نظيف", en: "Build clean" },
    ],
  },
  {
    title: { ar: "المرحلة 2.1.2B — مصادقة الباك اند وتجهيز المؤسسة الأولى", en: "Phase 2.1.2B — Managed Auth & First Tenant Bootstrap" },
    items: [
      { ar: "حالة مزوّد المصادقة من Lovable Cloud مفحوصة", en: "Auth provider status checked (Lovable Cloud)" },
      { ar: "مصادقة البريد/كلمة المرور مفعّلة افتراضيًا", en: "Email/password auth enabled by default" },
      { ar: "Google OAuth اختياري (قيد التهيئة من لوحة Cloud)", en: "Google OAuth optional (configurable from Cloud)" },
      { ar: "مسار اختبار مصادقة الباك اند داخلي للمالك فقط", en: "Internal backend-auth test path (Owner only)" },
      { ar: "لا يستبدل تسجيل دخول العرض التجريبي التلقائي", en: "Mock Owner demo auto-login preserved" },
      { ar: "إنشاء جلسة مستخدم حقيقي والتحقق منها", en: "Real user session created & verified" },
      { ar: "JWT موجود ولا يُعرض في الواجهة أو السجلات", en: "JWT present but never displayed or logged" },
      { ar: "مفتاح anon فقط في العميل (لا service role)", en: "Anon key only on client (no service role)" },
      { ar: "استدعاء bootstrap_tenant_for_user عند الحاجة", en: "bootstrap_tenant_for_user callable when needed" },
      { ar: "تجهيز ينشئ مؤسسة/ملف/عضوية/دور مالك/إعدادات/شجرة حسابات/ربط أغراض", en: "Bootstrap creates tenant/profile/membership/owner role/settings/chart/purposes" },
      { ar: "استراتيجية active_tenant_id: JWT claim أو بديل المعاينة", en: "active_tenant_id strategy: JWT claim or preview fallback" },
      { ar: "بديل المعاينة يستخدم أول مؤسسة من user_tenants ويحترم RLS", en: "Preview fallback uses first user_tenants row & respects RLS" },
      { ar: "الفحص الجاف يعمل بعد المصادقة والتجهيز", en: "Dry run runs after auth & bootstrap" },
      { ar: "DATA_MODE = demo (لم يتغيّر)", en: "DATA_MODE remains demo" },
      { ar: "BACKEND_WRITES_ENABLED = false (لم يتغيّر)", en: "BACKEND_WRITES_ENABLED remains false" },
      { ar: "وثائق auth-tenant-bootstrap-runbook + phase-2.1.2B-final-report", en: "Docs auth-tenant-bootstrap-runbook + phase-2.1.2B-final-report" },
      { ar: "الانحدار التجريبي ناجح", en: "Demo regression passes" },
      { ar: "البناء نظيف", en: "Build clean" },
    ],
  },
  {
    title: { ar: "المرحلة 2.1.2C — تنفيذ تجهيز المالك الأول والفحص الجاف الحي النهائي", en: "Phase 2.1.2C — First Owner Bootstrap Execution & Final Live Dry Run" },
    items: [
      { ar: "إنشاء/تسجيل دخول أول مستخدم باك اند حقيقي (يدوي من المالك)", en: "Create/sign in first real backend user (operator action)" },
      { ar: "عدم طباعة كلمة المرور أو JWT أو أي سر", en: "No password / JWT / secrets printed" },
      { ar: "استخدام BackendAuthSandbox في /system-data-mode للتجهيز", en: "Use BackendAuthSandbox in /system-data-mode to bootstrap" },
      { ar: "استدعاء bootstrap_tenant_for_user مرة واحدة فقط", en: "bootstrap_tenant_for_user invoked exactly once" },
      { ar: "تأكيد إنشاء tenant/profile/membership/owner/settings/chart/purposes/audit", en: "Confirm tenant/profile/membership/owner/settings/chart/purposes/audit created" },
      { ar: "استراتيجية active_tenant_id: JWT claim أو selected_fallback تعمل", en: "active_tenant_id strategy: JWT claim or selected_fallback works" },
      { ar: "RLS تحترم العضوية (لا تجاوز)", en: "RLS respects membership (no bypass)" },
      { ar: "الفحص الجاف الحي يعيد PASS للاتصال/الجلسة/العضوية/الجداول/RPCs", en: "Live dry run PASS for connection/session/membership/tables/RPCs" },
      { ar: "جاهزية ربط الأغراض المحاسبية PASS", en: "Account purpose readiness PASS" },
      { ar: "جاهزية الترقيم PASS أو ملاحظة sequence كسولة آمنة", en: "Numbering readiness PASS or safe lazy-sequence note" },
      { ar: "جاهزية write RPC PASS مع بقاء التنفيذ معطّلًا", en: "Write RPC readiness PASS while execution disabled" },
      { ar: "DATA_MODE = demo (لم يتغيّر)", en: "DATA_MODE remains demo" },
      { ar: "BACKEND_WRITES_ENABLED = false (لم يتغيّر)", en: "BACKEND_WRITES_ENABLED remains false" },
      { ar: "تسجيل دخول العرض التجريبي للمالك التلقائي ما زال يعمل", en: "Mock Owner demo auto-login still works" },
      { ar: "وثائق phase-2.1.2C-final-report محدّثة", en: "Docs phase-2.1.2C-final-report updated" },
      { ar: "الانحدار التجريبي ناجح والبناء نظيف", en: "Demo regression passes and build clean" },
    ],
  },
  {
    title: { ar: "المرحلة 2.1.3 — دليل تفعيل Supabase وجاهزية البيئة", en: "Phase 2.1.3 — Supabase Activation Runbook & Environment Readiness" },
    items: [
      { ar: "إنشاء دليل تفعيل Supabase", en: "Supabase activation runbook created" },
      { ar: "توثيق خيار Lovable Cloud", en: "Lovable Cloud option documented" },
      { ar: "توثيق خيار مشروع Supabase الموجود", en: "Existing Supabase project option documented" },
      { ar: "دليل تطبيق الترحيلات السبعة بالترتيب", en: "7-migration application guide documented" },
      { ar: "قائمة فحص متغيرات البيئة", en: "Env checklist documented" },
      { ar: "قائمة فحص الأمان (no service role / masked logs)", en: "Security checklist documented (no service role / masked logs)" },
      { ar: "دليل استكشاف الأخطاء وحلولها", en: "Troubleshooting guide documented" },
      { ar: "ملاحظة دليل التفعيل في /system-data-mode", en: "Runbook note added to /system-data-mode" },
      { ar: "الوضع التجريبي لا يزال الافتراضي", en: "Demo mode still default" },
      { ar: "BACKEND_WRITES_ENABLED = false", en: "Backend writes still disabled" },
      { ar: "البناء نظيف", en: "Build clean" },
    ],
  },
  {
    title: { ar: "المرحلة 2.1.4 — مرشّح إصدار العرض التجريبي وجاهزية التقديم", en: "Phase 2.1.4 — Demo Release Candidate & Client Presentation Readiness" },
    items: [
      { ar: "صفحة تدفق العرض /demo-flow", en: "Demo flow page /demo-flow" },
      { ar: "وثيقة سيناريو العرض (docs/demo-script.md)", en: "Demo script (docs/demo-script.md)" },
      { ar: "ملخص الميزات للعميل (docs/client-feature-summary.md)", en: "Client feature summary (docs/client-feature-summary.md)" },
      { ar: "زر تصدير ملخص العرض PDF (قريبًا)", en: "Export Demo Summary PDF placeholder (coming soon)" },
      { ar: "روابط الصفحات الداخلية في قائمة المالك", en: "Internal pages reachable from Owner menu" },
      { ar: "لغة آمنة للعميل (بدون مصطلحات تقنية)", en: "Safe client language (no scary technical terms)" },
      { ar: "RTL/LTR يتبدّلان بسلاسة", en: "RTL/LTR switching smooth" },
      { ar: "الوضع التجريبي لا يزال الافتراضي", en: "Demo mode still default" },
      { ar: "BACKEND_WRITES_ENABLED = false", en: "Backend writes still disabled" },
      { ar: "البناء نظيف", en: "Build clean" },
    ],
  },
  {
    title: { ar: "المرحلة 2.2 — أساس الميزات المتقدمة للأعمال", en: "Phase 2.2 — Advanced Business Features UI Foundation" },
    items: [
      { ar: "نماذج المستندات (عرض/فاتورة/قبض/صرف)", en: "Document Templates (quote/invoice/receipt/payment)" },
      { ar: "الحقول المخصصة (نوع، نطاق، إلزامي، طباعة)", en: "Custom Fields (type, scope, required, printable)" },
      { ar: "تخصيص تسميات الأعمدة", en: "Column label customization" },
      { ar: "هوية المستندات (ألوان، خط، ختم، توقيع، علامة مائية)", en: "Document branding (colors, font, stamp, signature, watermark)" },
      { ar: "إرسال عبر البريد وواتساب (نافذة معاينة)", en: "Send via Email & WhatsApp (placeholder dialog)" },
      { ar: "مركز التقارير والتحليلات بفئات", en: "Reports & Analytics Center with categories" },
      { ar: "أساس الموظفين والرواتب ومطالبات المصروفات", en: "Employees / Payroll / Expense Claims foundation" },
      { ar: "الفروع وتعدد المؤسسات + الفريق", en: "Branches & multi-org + Team management" },
      { ar: "التواصل الداخلي (إعلانات / ملاحظات / قوالب رسائل)", en: "Internal communication (announcements / notes / message templates)" },
      { ar: "أساس التعديل المجمع (Spreadsheet)", en: "Bulk spreadsheet edit foundation" },
      { ar: "الإجراءات السريعة والبحث الفوري (Ctrl/Cmd+K)", en: "Quick Actions & Instant Search (Ctrl/Cmd+K)" },
      { ar: "صلاحيات جديدة وتصفية القائمة الجانبية", en: "New permissions + sidebar filtering" },
      { ar: "بيانات تجريبية للوحدات الجديدة", en: "Demo data for new modules" },
      { ar: "الوضع التجريبي و BACKEND_WRITES_ENABLED=false", en: "DATA_MODE=demo & BACKEND_WRITES_ENABLED=false" },
    ],
  },
  {
    title: { ar: "المرحلة 2.1.5 — صفحات إنشاء/تعديل المستندات", en: "Phase 2.1.5 — Document Create/Edit Pages UX" },
    items: [
      { ar: "صفحات إنشاء/تعديل عرض السعر", en: "Quotation create/edit pages" },
      { ar: "صفحات إنشاء/تعديل فاتورة المبيعات", en: "Sales invoice create/edit pages" },
      { ar: "قائمة فواتير المشتريات", en: "Purchase invoice list" },
      { ar: "صفحات إنشاء/تعديل فاتورة المشتريات", en: "Purchase invoice create/edit pages" },
      { ar: "إزالة النوافذ المنبثقة لإنشاء/تعديل المستندات", en: "Document create/edit modals removed" },
      { ar: "مكوّن DocumentEditorLayout قابل لإعادة الاستخدام", en: "Reusable DocumentEditorLayout component" },
      { ar: "محرّر بنود مخصّص للمشتريات (تكلفة الوحدة)", en: "Purchase line items editor (unit cost)" },
      { ar: "تنقّل القائمة الجانبية: مبيعات / مشتريات منفصلتان", en: "Sidebar: separate Sales / Purchase Invoices entries" },
      { ar: "إعادة توجيه /invoices إلى /invoices/sales", en: "/invoices redirects to /invoices/sales" },
      { ar: "الصلاحيات محفوظة (owner/accountant/sales/viewer)", en: "Permissions preserved (owner/accountant/sales/viewer)" },
      { ar: "التحقق ثنائي اللغة محفوظ", en: "Bilingual validation preserved" },
      { ar: "الفواتير المعتمدة تبقى مقفلة", en: "Issued invoices stay locked" },
      { ar: "بيانات تجريبية لفواتير المشتريات", en: "Demo data for purchase invoices" },
      { ar: "الوضع التجريبي محفوظ", en: "Demo mode preserved" },
      { ar: "BACKEND_WRITES_ENABLED = false", en: "Backend writes still disabled" },
      { ar: "البناء نظيف", en: "Build clean" },
    ],
  },
  {
    title: { ar: "المرحلة 2.1.9 — إعادة تنظيم الشريط الجانبي ونظام الإنشاء السريع", en: "Phase 2.1.9 — Sidebar Reorganization & Quick Create Modal System" },
    items: [
      { ar: "إعادة تنظيم القائمة الجانبية إلى مجموعات", en: "Sidebar reorganized into business-domain groups" },
      { ar: "أكورديون أحادي الفتح (مجموعة واحدة نشطة)", en: "Single-open accordion behavior" },
      { ar: "تمييز العنصر النشط وفتح مجموعته تلقائيًا", en: "Active item highlighted, containing group auto-expanded" },
      { ar: "وضع مصغّر مع أيقونات فقط على الديسكتوب", en: "Collapsible mini rail (icons-only) on desktop" },
      { ar: "درج جانبي على الجوال", en: "Mobile sheet drawer" },
      { ar: "وحدة الحسابات البنكية /bank-accounts", en: "Bank Accounts module /bank-accounts" },
      { ar: "وحدة المشاريع /projects", en: "Projects module /projects" },
      { ar: "نظام نوافذ الإنشاء السريع (QuickCreateDialog)", en: "Quick Create modal system (QuickCreateDialog)" },
      { ar: "إنشاء سريع: عميل، مورد، منتج", en: "Quick create: customer, supplier, item" },
      { ar: "إنشاء سريع: حساب بنكي، مركز تكلفة، مشروع، فرع", en: "Quick create: bank account, cost center, project, branch" },
      { ar: "زر إنشاء سريع في شريط العنوان", en: "Quick Create entry point in the top bar" },
      { ar: "خاصية حفظ وإضافة أخرى داخل نوافذ الإنشاء السريع", en: "Save-and-add-another option in quick-create dialogs" },
      { ar: "المستندات الكبيرة تبقى صفحات كاملة (عروض/فواتير)", en: "Heavy documents remain full pages (quotations/invoices)" },
      { ar: "صلاحيات جديدة: bank_accounts.* و projects.*", en: "New permissions: bank_accounts.* and projects.*" },
      { ar: "إخفاء أزرار الإنشاء السريع بدون صلاحية manage", en: "Quick-create buttons hidden without manage permission" },
      { ar: "حالات فارغة محسّنة لـ Bank Accounts و Projects", en: "Improved empty states for Bank Accounts & Projects" },
      { ar: "تكامل سجل المراجعة لكل إنشاء سريع", en: "Audit log integration on every quick-create" },
      { ar: "DATA_MODE = demo (لم يتغيّر)", en: "DATA_MODE remains demo" },
      { ar: "BACKEND_WRITES_ENABLED = false (لم يتغيّر)", en: "BACKEND_WRITES_ENABLED remains false" },
      { ar: "RTL / LTR يعملان", en: "RTL / LTR both work" },
      { ar: "الانحدار التجريبي ناجح", en: "Demo regression passes" },
      { ar: "البناء نظيف", en: "Build clean" },
    ],
  },
  {
    title: { ar: "المرحلة 2.1.8 — البحث الذكي والاقتراحات", en: "Phase 2.1.8 — Smart Search & Suggestions" },
    items: [
      { ar: "محدّد العملاء الذكي يعمل في عروض الأسعار وفواتير المبيعات وسندات القبض", en: "Smart customer selector active on quotations, sales invoices, receipts" },
      { ar: "محدّد الموردين الذكي يعمل في فواتير المشتريات وسندات الصرف", en: "Smart supplier selector active on purchase invoices, payments" },
      { ar: "محدّد المنتجات/الخدمات الذكي يعمل في بنود البيع والشراء", en: "Smart item selector active on sales and purchase line items" },
      { ar: "محدّد الفواتير الذكي يعمل في سند القبض", en: "Smart invoice selector active on receipt vouchers" },
      { ar: "اقتراحات آخر 6 سجلات عند الحقل الفارغ", en: "Last 6 records suggested on empty focus" },
      { ar: "تتبّع الاستخدام يخزّن العداد وآخر استخدام", en: "Usage tracking stores count + last_at" },
      { ar: "اختيار منتج/خدمة يملأ الوصف والسعر والضريبة تلقائيًا", en: "Item selection auto-fills description / price / VAT" },
      { ar: "ترتيب الفواتير غير المدفوعة أولاً في سند القبض", en: "Unpaid invoices prioritized in receipt voucher" },
      { ar: "بحث بالاسم والجوّال والإيميل والرقم الضريبي", en: "Search by name, mobile, email, VAT" },
      { ar: "تأخير زمني 220ms مع لوحة مفاتيح ودعم اللمس", en: "220ms debounce + keyboard + touch support" },
      { ar: "RTL / LTR يعملان", en: "RTL / LTR both work" },
      { ar: "إعادة تعيين العرض التجريبي تمسح تتبّع الاستخدام", en: "Demo reset clears usage tracking" },
      { ar: "DATA_MODE = demo (لم يتغيّر)", en: "DATA_MODE remains demo" },
      { ar: "BACKEND_WRITES_ENABLED = false (لم يتغيّر)", en: "BACKEND_WRITES_ENABLED remains false" },
      { ar: "البناء نظيف", en: "Build clean" },
    ],
  },
  {
    title: { ar: "المرحلة 2.1.10 — إعادة تصميم شجرة الحسابات الهرمية", en: "Phase 2.1.10 — Hierarchical Chart of Accounts Redesign" },
    items: [
      { ar: "شبكة شجرة هرمية لدليل الحسابات", en: "Hierarchical chart tree grid" },
      { ar: "توسيع/طي الصفوف يعمل", en: "Expand/collapse rows" },
      { ar: "تصنيفات رئيسية ملوّنة (الأصول/الالتزامات/حقوق الملكية/الإيرادات/المصروفات)", en: "Top-level account classes styled" },
      { ar: "ترقيم هرمي للحسابات (1 → 11 → 111 → 1111)", en: "Account code hierarchy" },
      { ar: "عمود نوع التدفق النقدي", en: "Cash flow type column" },
      { ar: "عمود تفعيل عمليات الدفع", en: "Payment enabled column" },
      { ar: "عمود الاستخدام الوظيفي مع شارات", en: "Purpose mapping column with chips" },
      { ar: "الحسابات النظامية محمية بأيقونة قفل", en: "Locked system accounts protected with lock icon" },
      { ar: "لوحة جانبية لإضافة/تعديل الحسابات", en: "Add/edit account side panel" },
      { ar: "بحث بالرقم والاسم العربي/الإنجليزي والوظيفة", en: "Search by code, AR/EN name, purpose" },
      { ar: "فلتر التصنيف وفلتر «حسابات الترحيل فقط»", en: "Class filter and posting-only filter" },
      { ar: "عدّادات (إجمالي / ترحيل / محمية / مخصصة)", en: "Summary counters" },
      { ar: "الصلاحيات محفوظة (accounting.view / accounts.manage)", en: "Permissions preserved" },
      { ar: "القيود اليومية تعمل بدون كسر", en: "Journal entries still work" },
      { ar: "DATA_MODE = demo (لم يتغيّر)", en: "DATA_MODE remains demo" },
      { ar: "BACKEND_WRITES_ENABLED = false (لم يتغيّر)", en: "BACKEND_WRITES_ENABLED remains false" },
      { ar: "البناء نظيف", en: "Build clean" },
    ],
  },
  {
    title: { ar: "المرحلة 2.1.14 — صفحة الضرائب", en: "Phase 2.1.14 — Taxes Page Foundation" },
    items: [
      { ar: "صفحة الضرائب أُضيفت تحت قسم المحاسبة", en: "Taxes page added under Accounting" },
      { ar: "عنصر القائمة الجانبية «الضرائب» يبرز عند التفعيل", en: "Taxes sidebar item highlights when active" },
      { ar: "جدول معدلات الضرائب مع بحث وفلاتر", en: "Tax rates table with search/filters" },
      { ar: "معدلات ضريبة القيمة المضافة السعودية الافتراضية", en: "Default Saudi VAT demo rates seeded" },
      { ar: "نافذة إضافة ضريبة جديدة", en: "Add tax dialog" },
      { ar: "تعديل/أرشفة الضرائب المخصصة", en: "Edit/archive custom tax rates" },
      { ar: "الضرائب النظامية محمية بقفل ولا يمكن حذفها", en: "System tax rates locked and protected" },
      { ar: "الصلاحيات (taxes.view / taxes.manage)", en: "Permissions (taxes.view / taxes.manage)" },
      { ar: "احتساب ضريبة القيمة المضافة في الفواتير لا يزال يعمل", en: "Invoice VAT calculation still works" },
      { ar: "DATA_MODE = demo (لم يتغيّر)", en: "DATA_MODE remains demo" },
      { ar: "BACKEND_WRITES_ENABLED = false (لم يتغيّر)", en: "BACKEND_WRITES_ENABLED remains false" },
      { ar: "البناء نظيف", en: "Build clean" },
    ],
  },
];


function DemoChecklistPage() {
  const { t, lang } = useI18n();
  const { can } = useAuth();
  const audit = useAudit();
  const resetAction = can("demo.reset") ? (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm"><RefreshCw className="size-4 me-1" />{t("reset_demo")}</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("reset_demo")}</AlertDialogTitle>
          <AlertDialogDescription>{t("reset_demo_confirm")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={() => {
            audit.log("settings.demo_reset", "settings", "إعادة تعيين البيانات التجريبية", "Demo data reset");
            SettingsService.resetDemo();
            toast.success(t("saved"));
            setTimeout(() => window.location.reload(), 300);
          }}>
            {t("confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ) : null;
  return (
    <AppShell title={t("demo_checklist")} action={resetAction}>
      <div className="max-w-3xl space-y-6">
        <p className="text-muted-foreground text-sm">{t("demo_checklist_desc")}</p>
        {groups.map((g) => (
          <div key={g.title.en} className="card-elevated p-5">
            <h2 className="font-semibold mb-3">{lang === "ar" ? g.title.ar : g.title.en}</h2>
            <ul className="divide-y">
              {g.items.map((it) => (
                <li key={it.en} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-5 text-success shrink-0" />
                    <span className="text-sm">{lang === "ar" ? it.ar : it.en}</span>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
                    {t("ready")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
