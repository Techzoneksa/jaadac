import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PermissionGate } from "@/components/PermissionGate";
import { StatusChip, type ModuleStatus } from "@/components/ModuleFoundationPage";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/product-roadmap")({
  head: () => ({ meta: [{ title: "Product Roadmap — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perm="roadmap.view" mode="page">
      <RoadmapPage />
    </PermissionGate>
  ),
});

interface Mod { ar: string; en: string; status: ModuleStatus; to?: string }

const ACTIVE: Mod[] = [
  { ar: "لوحة التحكم",    en: "Dashboard",        status: "active", to: "/" },
  { ar: "العملاء",        en: "Customers",         status: "active", to: "/customers" },
  { ar: "الموردين",        en: "Suppliers",         status: "active", to: "/suppliers" },
  { ar: "المنتجات والخدمات", en: "Products & Services", status: "active", to: "/items" },
  { ar: "عروض الأسعار",   en: "Quotations",        status: "active", to: "/quotations" },
  { ar: "فواتير المبيعات", en: "Sales Invoices",    status: "active", to: "/invoices/sales" },
  { ar: "سندات القبض",     en: "Receipt Vouchers",  status: "active", to: "/receipts" },
  { ar: "سندات الصرف",    en: "Payment Vouchers",  status: "active", to: "/payments" },
  { ar: "شجرة الحسابات",  en: "Chart of Accounts", status: "active", to: "/accounting/chart" },
  { ar: "القيود اليومية",  en: "Journal Entries",   status: "active", to: "/accounting/journal" },
  { ar: "التقارير",        en: "Reports",           status: "active", to: "/reports" },
  { ar: "المهام",          en: "Tasks",             status: "active", to: "/tasks" },
  { ar: "الإعدادات",       en: "Settings",          status: "active", to: "/settings" },
  { ar: "سجل التدقيق",     en: "Audit Log",         status: "active", to: "/audit-log" },
  { ar: "الصلاحيات",       en: "Permissions",       status: "active", to: "/permission-check" },
  { ar: "تدفق العرض",      en: "Demo Flow",         status: "active", to: "/demo-flow" },
];

const FOUNDATION: Mod[] = [
  { ar: "فواتير المشتريات", en: "Purchase Invoices", status: "foundation", to: "/invoices/purchases" },
  { ar: "أوامر البيع",       en: "Sales Orders",       status: "foundation", to: "/sales-orders" },
  { ar: "أوامر الشراء",      en: "Purchase Orders",    status: "foundation", to: "/purchase-orders" },
  { ar: "الإشعارات الدائنة", en: "Credit Notes",       status: "foundation", to: "/credit-notes" },
  { ar: "الإشعارات المدينة", en: "Debit Notes",        status: "foundation", to: "/debit-notes" },
  { ar: "مراكز التكلفة",     en: "Cost Centers",       status: "foundation", to: "/cost-centers" },
  { ar: "إدارة المخزون",     en: "Inventory",          status: "foundation", to: "/inventory" },
  { ar: "نقل البيانات",      en: "Data Migration",     status: "foundation", to: "/data-migration" },
  { ar: "تصميم القوالب",     en: "Template Designer",  status: "foundation", to: "/template-designer" },
  { ar: "ربط هيئة الزكاة",   en: "ZATCA Integration",  status: "foundation", to: "/zatca" },
  { ar: "الأصول الثابتة",    en: "Fixed Assets",       status: "foundation", to: "/fixed-assets" },
];

const PLANNED: Mod[] = [
  { ar: "الموارد البشرية",   en: "HR / Payroll",       status: "planned", to: "/hr" },
  { ar: "التسويات البنكية",  en: "Bank Reconciliation", status: "planned", to: "/bank-reconciliation" },
  { ar: "الربط (زد/سلة/فودكس)", en: "Integrations (Zid/Salla/Foodics)", status: "planned", to: "/integrations" },
];

const COMING: Mod[] = [
  { ar: "مخزون متقدم وتكلفة كاملة",          en: "Advanced inventory & full costing", status: "coming_soon" },
  { ar: "محاسبة المشتريات الكاملة",           en: "Full purchase accounting",          status: "coming_soon" },
  { ar: "تقارير محاسبة التكاليف",            en: "Cost accounting reports",           status: "coming_soon" },
  { ar: "أكثر من 40 تقريرًا متخصصًا",          en: "40+ specialized reports",           status: "coming_soon" },
  { ar: "إرسال بريد/واتساب فعلي",             en: "Real email / WhatsApp sending",     status: "coming_soon" },
  { ar: "ربط زد/سلة/فودكس الفعلي",            en: "Live Zid/Salla/Foodics integration", status: "coming_soon" },
  { ar: "ربط هيئة الزكاة المرحلة الثانية",    en: "ZATCA Phase 2 e-invoicing",         status: "coming_soon" },
  { ar: "محرك رواتب كامل",                    en: "Full payroll engine",               status: "coming_soon" },
  { ar: "احتساب إهلاك الأصول الثابتة",        en: "Fixed asset depreciation engine",   status: "coming_soon" },
  { ar: "تشغيل إنتاجي متعدد المؤسسات",        en: "Multi-org production operations",    status: "requires_backend" },
];

function Section({ title_ar, title_en, items }: { title_ar: string; title_en: string; items: Mod[] }) {
  const { lang } = useI18n();
  return (
    <div className="card-elevated p-5">
      <h2 className="text-sm font-semibold mb-3">{lang === "ar" ? title_ar : title_en}</h2>
      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
        {items.map((m, i) => {
          const inner = (
            <div className="border rounded-md p-3 flex items-center justify-between gap-2 text-sm hover:bg-muted/40 transition-colors">
              <span>{lang === "ar" ? m.ar : m.en}</span>
              <StatusChip status={m.status} />
            </div>
          );
          return m.to ? (
            <a key={i} href={m.to}>{inner}</a>
          ) : (
            <div key={i}>{inner}</div>
          );
        })}
      </div>
    </div>
  );
}

function RoadmapPage() {
  const { lang } = useI18n();
  return (
    <AppShell title={lang === "ar" ? "خارطة طريق المنتج" : "Product Roadmap"}>
      <div className="space-y-4 max-w-6xl">
        <p className="text-sm text-muted-foreground">
          {lang === "ar"
            ? "نظرة شاملة على وحدات JAAD CLOUD: المتاح الآن، التأسيسي، المخطط، والقادم. هذه صفحة داخلية لمالك المؤسسة."
            : "Full view of JAAD CLOUD modules: active now, foundation, planned, and coming. Owner-only internal page."}
        </p>
        <Section title_ar="نشط الآن" title_en="Active now" items={ACTIVE} />
        <Section title_ar="تأسيسي الآن" title_en="Foundation now" items={FOUNDATION} />
        <Section title_ar="مخطط" title_en="Planned" items={PLANNED} />
        <Section title_ar="قادم لاحقًا" title_en="Coming later" items={COMING} />
      </div>
    </AppShell>
  );
}
