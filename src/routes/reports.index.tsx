import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PermissionGate } from "@/components/PermissionGate";
import { useI18n, fmtMoney } from "@/lib/i18n";
import { useStore, docTotals } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Search, CheckCircle2, Clock, Sparkles, Layers,
  TrendingUp, ShoppingCart, ShoppingBag, Receipt as ReceiptIcon,
  Boxes, Users as UsersIcon, FolderKanban, FileBarChart, Wallet,
} from "lucide-react";

export const Route = createFileRoute("/reports/")({
  head: () => ({
    meta: [
      { title: "Reports Center — JAAD CLOUD" },
      { name: "description", content: "JAAD CLOUD central reports hub for financials, sales, purchases, taxes, inventory and projects." },
    ],
  }),
  component: () => (
    <PermissionGate perm="reports.view" mode="page">
      <ReportsCenter />
    </PermissionGate>
  ),
});

type Status = "available" | "foundation" | "coming_soon";
type CategoryKey =
  | "financial" | "sales" | "purchases" | "tax"
  | "inventory" | "cost_project" | "payroll" | "management";

interface ReportItem {
  key: string;
  titleAr: string; titleEn: string;
  descAr: string; descEn: string;
  category: CategoryKey;
  status: Status;
  to?: string;          // internal route when available/foundation
  permission?: string;  // optional gating beyond reports.view
  isNew?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}

const CATEGORIES: { key: CategoryKey; ar: string; en: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "financial",    ar: "التقارير المالية",                      en: "Financial",          icon: TrendingUp },
  { key: "sales",        ar: "تقارير المبيعات",                       en: "Sales",              icon: ShoppingCart },
  { key: "purchases",    ar: "تقارير المشتريات",                      en: "Purchases",          icon: ShoppingBag },
  { key: "tax",          ar: "تقارير الضرائب",                        en: "Tax",                icon: ReceiptIcon },
  { key: "inventory",    ar: "تقارير المخزون",                        en: "Inventory",          icon: Boxes },
  { key: "cost_project", ar: "مراكز التكلفة والمشاريع",                en: "Cost Centers & Projects", icon: FolderKanban },
  { key: "payroll",      ar: "الرواتب والموظفين",                     en: "Payroll & HR",       icon: UsersIcon },
  { key: "management",   ar: "تقارير الإدارة",                        en: "Management",         icon: Wallet },
];

const REPORTS: ReportItem[] = [
  // Financial
  { key: "profit-loss",      titleAr: "الأرباح والخسائر",     titleEn: "Profit & Loss",        descAr: "الإيرادات والمصروفات وصافي الدخل", descEn: "Revenues, expenses, net income", category: "financial", status: "available",  to: "/reports/profit-loss", icon: TrendingUp, isNew: true },
  { key: "balance-sheet",    titleAr: "الميزانية العمومية",   titleEn: "Balance Sheet",        descAr: "الأصول والالتزامات وحقوق الملكية", descEn: "Assets, liabilities, equity",     category: "financial", status: "available",  to: "/reports/balance-sheet" },
  { key: "cash-flow",        titleAr: "التدفق النقدي",        titleEn: "Cash Flow",            descAr: "حركة النقد التشغيلية والاستثمارية والتمويلية", descEn: "Operating, investing, financing", category: "financial", status: "available", to: "/reports/cash-flow" },
  { key: "trial-balance",    titleAr: "ميزان المراجعة",        titleEn: "Trial Balance",        descAr: "أرصدة جميع الحسابات للفترة",       descEn: "Account balances for the period", category: "financial", status: "available", to: "/reports/trial-balance" },
  { key: "general-ledger",   titleAr: "دفتر الأستاذ العام",   titleEn: "General Ledger",       descAr: "حركات حساب معين عبر الفترة",       descEn: "Detailed account movements",      category: "financial", status: "available", to: "/reports/general-ledger" },
  { key: "account-statement",titleAr: "كشف الحساب",            titleEn: "Account Statement",    descAr: "كشف تفصيلي لحساب واحد",            descEn: "Single-account detailed statement", category: "financial", status: "foundation", to: "/reports/account-statement" },

  // Sales
  { key: "sales-by-customer",  titleAr: "المبيعات حسب العميل",     titleEn: "Sales by Customer",     descAr: "ملخص المبيعات لكل عميل",          descEn: "Per-customer sales summary",         category: "sales", status: "available",  to: "/reports/sales-by-customer", icon: UsersIcon },
  { key: "sales-by-product",   titleAr: "المبيعات حسب المنتج/الخدمة", titleEn: "Sales by Product/Service", descAr: "أعلى المنتجات والخدمات مبيعًا",  descEn: "Top selling products and services", category: "sales", status: "available", to: "/reports/sales-by-product" },
  { key: "sales-by-project",   titleAr: "المبيعات حسب المشروع",     titleEn: "Sales by Project",      descAr: "تأسيسي — يربط لاحقًا بالمشاريع",    descEn: "Foundation — wired to projects later", category: "sales", status: "foundation", },
  { key: "sales-by-cost-center", titleAr: "المبيعات حسب مركز التكلفة", titleEn: "Sales by Cost Center", descAr: "تأسيسي — يربط لاحقًا بمراكز التكلفة", descEn: "Foundation — cost-center linkage later", category: "sales", status: "foundation" },
  { key: "unpaid-sales-invoices",  titleAr: "فواتير مبيعات غير مدفوعة", titleEn: "Unpaid Sales Invoices",  descAr: "الفواتير المعتمدة المستحقة",      descEn: "Issued invoices with balance",     category: "sales", status: "available", to: "/reports/unpaid-sales-invoices" },
  { key: "overdue-sales-invoices", titleAr: "فواتير مبيعات متأخرة",   titleEn: "Overdue Sales Invoices", descAr: "فواتير تجاوزت تاريخ الاستحقاق",    descEn: "Invoices past their due date",     category: "sales", status: "available", to: "/reports/overdue-sales-invoices" },

  // Purchases
  { key: "purchases-by-supplier", titleAr: "المشتريات حسب المورد",      titleEn: "Purchases by Supplier",    descAr: "تأسيسي — ملخص حسب المورد",       descEn: "Foundation — supplier breakdown", category: "purchases", status: "foundation" },
  { key: "purchases-by-product",  titleAr: "المشتريات حسب المنتج/الخدمة", titleEn: "Purchases by Product/Service", descAr: "تأسيسي — تحليل بنود الشراء",   descEn: "Foundation — purchase line analysis", category: "purchases", status: "foundation" },
  { key: "purchase-invoice-statement", titleAr: "كشف فواتير المشتريات", titleEn: "Purchase Invoice Statement", descAr: "تأسيسي — قائمة فواتير الشراء",  descEn: "Foundation — purchase invoice list", category: "purchases", status: "foundation" },
  { key: "unpaid-purchase-invoices",   titleAr: "فواتير مشتريات غير مدفوعة", titleEn: "Unpaid Purchase Invoices",  descAr: "تأسيسي — مدفوعات مستحقة",   descEn: "Foundation — outstanding payables", category: "purchases", status: "foundation" },
  { key: "overdue-purchase-invoices",  titleAr: "فواتير مشتريات متأخرة",     titleEn: "Overdue Purchase Invoices", descAr: "تأسيسي — فواتير شراء متأخرة", descEn: "Foundation — overdue payables",   category: "purchases", status: "foundation" },

  // Tax
  { key: "vat",                titleAr: "تقرير ضريبة القيمة المضافة", titleEn: "VAT Report",        descAr: "ضريبة المدخلات والمخرجات للفترة",  descEn: "Input and output VAT for the period", category: "tax", status: "available", to: "/reports/vat" },
  { key: "vat-detailed",       titleAr: "تقرير الضريبة المفصل",       titleEn: "VAT Detailed Report", descAr: "تأسيسي — تحليل سطر سطر",          descEn: "Foundation — line-by-line detail",  category: "tax", status: "foundation" },
  { key: "tax-summary",        titleAr: "ملخص الضرائب",               titleEn: "Tax Summary",        descAr: "تأسيسي — ملخص شامل للضرائب",      descEn: "Foundation — comprehensive summary", category: "tax", status: "foundation" },

  // Inventory
  { key: "inventory-movement",          titleAr: "حركة المخزون",            titleEn: "Inventory Movement",          descAr: "قريبًا",                        descEn: "Coming soon",                       category: "inventory", status: "coming_soon" },
  { key: "inventory-movement-warehouse", titleAr: "حركة المخزون حسب المستودع", titleEn: "Inventory Movement by Warehouse", descAr: "قريبًا",                        descEn: "Coming soon",                       category: "inventory", status: "coming_soon" },
  { key: "monthly-inventory-summary",   titleAr: "الملخص الشهري للمخزون",    titleEn: "Monthly Inventory Summary",   descAr: "قريبًا",                        descEn: "Coming soon",                       category: "inventory", status: "coming_soon" },

  // Cost Centers & Projects
  { key: "revenue-by-cost-center",  titleAr: "الإيرادات حسب مركز التكلفة", titleEn: "Revenue by Cost Center", descAr: "تأسيسي",                       descEn: "Foundation",                       category: "cost_project", status: "foundation" },
  { key: "expenses-by-cost-center", titleAr: "المصروفات حسب مركز التكلفة", titleEn: "Expenses by Cost Center", descAr: "تأسيسي",                       descEn: "Foundation",                       category: "cost_project", status: "foundation" },
  { key: "revenue-by-project",      titleAr: "الإيرادات حسب المشروع",      titleEn: "Revenue by Project",      descAr: "تأسيسي",                       descEn: "Foundation",                       category: "cost_project", status: "foundation" },
  { key: "expenses-by-project",     titleAr: "المصروفات حسب المشروع",      titleEn: "Expenses by Project",     descAr: "تأسيسي",                       descEn: "Foundation",                       category: "cost_project", status: "foundation" },

  // Payroll & HR
  { key: "payroll-summary",   titleAr: "ملخص الرواتب",      titleEn: "Payroll Summary",   descAr: "قريبًا",                          descEn: "Coming soon",                       category: "payroll", status: "coming_soon", permission: "hr.view" },
  { key: "employee-statement",titleAr: "كشف حساب موظف",     titleEn: "Employee Statement",descAr: "قريبًا",                          descEn: "Coming soon",                       category: "payroll", status: "coming_soon", permission: "hr.view" },
  { key: "employee-claims",   titleAr: "مطالبات الموظفين",  titleEn: "Employee Claims",   descAr: "قريبًا",                          descEn: "Coming soon",                       category: "payroll", status: "coming_soon", permission: "hr.view" },

  // Management
  { key: "management-pdf",     titleAr: "تقارير الإدارة PDF",  titleEn: "Management PDF Reports", descAr: "قريبًا",                       descEn: "Coming soon",                       category: "management", status: "coming_soon" },
  { key: "cash-forecast",      titleAr: "التوقعات النقدية",    titleEn: "Cash Forecast",          descAr: "تأسيسي",                       descEn: "Foundation",                        category: "management", status: "foundation" },
  { key: "business-health",    titleAr: "ملخص صحة الأعمال",   titleEn: "Business Health Summary", descAr: "تأسيسي",                       descEn: "Foundation",                        category: "management", status: "foundation" },
];

function ReportsCenter() {
  const { lang } = useI18n();
  const { can } = useAuth();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<CategoryKey | "all">("all");
  const [status, setStatus] = useState<Status | "all">("all");
  const s = useStore((s) => s);

  // KPI snapshot
  const kpis = useMemo(() => {
    const totalRevenue = s.invoices
      .filter((i) => i.status !== "draft" && i.status !== "cancelled")
      .reduce((sum, i) => sum + docTotals(i.lines, i.discount).total, 0);
    const outstanding = s.invoices
      .filter((i) => ["official", "partially_paid"].includes(i.status))
      .reduce((sum, i) => sum + (docTotals(i.lines, i.discount).total - i.paid), 0);
    const vat = s.invoices
      .filter((i) => i.status !== "draft" && i.status !== "cancelled")
      .reduce((sum, i) => sum + docTotals(i.lines, i.discount).vat, 0);
    const payments = s.payments.reduce((sum, p) => sum + p.amount, 0);
    return { totalRevenue, outstanding, vat, payments };
  }, [s.invoices, s.payments]);

  // Permission filtering
  const allowedReports = useMemo(
    () => REPORTS.filter((r) => !r.permission || can(r.permission as never)),
    [can],
  );

  // Filter
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allowedReports.filter((r) => {
      if (cat !== "all" && r.category !== cat) return false;
      if (status !== "all" && r.status !== status) return false;
      if (!q) return true;
      const blob = `${r.titleAr} ${r.titleEn} ${r.descAr} ${r.descEn} ${r.category}`.toLowerCase();
      return blob.includes(q);
    });
  }, [allowedReports, query, cat, status]);

  // Grouped
  const grouped = useMemo(() => {
    const map = new Map<CategoryKey, ReportItem[]>();
    for (const r of filtered) {
      const arr = map.get(r.category) || [];
      arr.push(r); map.set(r.category, arr);
    }
    return map;
  }, [filtered]);

  const mostUsed = useMemo(
    () => allowedReports.filter((r) => ["profit-loss", "vat", "unpaid-sales-invoices", "cash-flow"].includes(r.key)),
    [allowedReports],
  );

  return (
    <AppShell title={lang === "ar" ? "التقارير" : "Reports"}>
      <div className="space-y-6">
        {/* Header */}
        <header className="space-y-2">
          <div className="flex items-center gap-2">
            <FileBarChart className="size-5 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">
              {lang === "ar" ? "مركز التقارير" : "Reports Center"}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-3xl">
            {lang === "ar"
              ? "مركز شامل لمتابعة أداء أعمالك، الفواتير، الضرائب، المحاسبة، المخزون، والمشاريع."
              : "A central place to track business performance, invoices, taxes, accounting, inventory, and projects."}
          </p>
        </header>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label={lang === "ar" ? "الإيرادات" : "Revenue"} value={fmtMoney(kpis.totalRevenue, lang)} />
          <KpiCard label={lang === "ar" ? "ذمم مدينة" : "Outstanding A/R"} value={fmtMoney(kpis.outstanding, lang)} />
          <KpiCard label={lang === "ar" ? "ضريبة مستحقة" : "VAT Output"} value={fmtMoney(kpis.vat, lang)} />
          <KpiCard label={lang === "ar" ? "المدفوعات" : "Payments"} value={fmtMoney(kpis.payments, lang)} />
        </div>

        {/* Search + Filters */}
        <div className="card-elevated p-3 flex flex-col gap-3">
          <div className="relative">
            <Search className="size-4 absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={lang === "ar" ? "ابحث في التقارير…" : "Search reports…"}
              className="w-full h-10 rounded-md border bg-background ps-9 pe-3 text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <FilterChip active={cat === "all"} onClick={() => setCat("all")}>
              <Layers className="size-3.5" /> {lang === "ar" ? "كل الفئات" : "All categories"}
            </FilterChip>
            {CATEGORIES.map((c) => (
              <FilterChip key={c.key} active={cat === c.key} onClick={() => setCat(c.key)}>
                <c.icon className="size-3.5" /> {lang === "ar" ? c.ar : c.en}
              </FilterChip>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <StatusChip active={status === "all"} onClick={() => setStatus("all")}>{lang === "ar" ? "الكل" : "All"}</StatusChip>
            <StatusChip active={status === "available"} onClick={() => setStatus("available")} tone="success">{lang === "ar" ? "متاح" : "Available"}</StatusChip>
            <StatusChip active={status === "foundation"} onClick={() => setStatus("foundation")} tone="info">{lang === "ar" ? "تأسيسي" : "Foundation"}</StatusChip>
            <StatusChip active={status === "coming_soon"} onClick={() => setStatus("coming_soon")} tone="muted">{lang === "ar" ? "قريبًا" : "Coming Soon"}</StatusChip>
          </div>
        </div>

        {/* Pinned: Most used */}
        {cat === "all" && status === "all" && !query && mostUsed.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <Sparkles className="size-4 text-primary" />
              {lang === "ar" ? "الأكثر استخدامًا" : "Most used"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {mostUsed.map((r) => <ReportCard key={r.key} r={r} />)}
            </div>
          </section>
        )}

        {/* Categories */}
        {filtered.length === 0 ? (
          <div className="card-elevated p-10 text-center">
            <p className="text-sm font-medium">{lang === "ar" ? "لا توجد تقارير مطابقة" : "No matching reports"}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {lang === "ar" ? "جرّب تغيير البحث أو الفلاتر." : "Try a different search term or filter."}
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => { setQuery(""); setCat("all"); setStatus("all"); }}>
              {lang === "ar" ? "مسح الفلاتر" : "Clear filters"}
            </Button>
          </div>
        ) : (
          CATEGORIES.filter((c) => grouped.has(c.key)).map((c) => {
            const items = grouped.get(c.key)!;
            return (
              <section key={c.key}>
                <h2 className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-foreground">
                  <c.icon className="size-4 text-primary" />
                  {lang === "ar" ? c.ar : c.en}
                  <span className="text-xs font-normal text-muted-foreground">({items.length})</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((r) => <ReportCard key={r.key} r={r} />)}
                </div>
              </section>
            );
          })
        )}
      </div>
    </AppShell>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-elevated p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold mt-1 font-mono">{value}</div>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button" onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 h-8 rounded-full border text-xs transition-colors ${
        active ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted text-foreground border-border"
      }`}
    >{children}</button>
  );
}

function StatusChip({ active, onClick, children, tone }: { active: boolean; onClick: () => void; children: React.ReactNode; tone?: "success" | "info" | "muted" }) {
  const toneClass = !active
    ? "bg-background hover:bg-muted border-border"
    : tone === "success" ? "bg-success/15 text-success border-success/30"
    : tone === "info"    ? "bg-primary/15 text-primary border-primary/30"
    : tone === "muted"   ? "bg-muted text-muted-foreground border-border"
    : "bg-foreground text-background border-foreground";
  return (
    <button type="button" onClick={onClick}
      className={`inline-flex items-center gap-1 px-3 h-8 rounded-full border text-xs transition-colors ${toneClass}`}>
      {children}
    </button>
  );
}

function ReportCard({ r }: { r: ReportItem }) {
  const { lang } = useI18n();
  const Icon = r.icon ?? FileBarChart;
  const isOpenable = (r.status === "available" || r.status === "foundation") && r.to;
  return (
    <div className="card-elevated p-4 flex flex-col gap-3 hover:border-primary/40 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <div className="size-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Icon className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="font-medium text-sm leading-tight">{lang === "ar" ? r.titleAr : r.titleEn}</div>
            <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{lang === "ar" ? r.descAr : r.descEn}</div>
          </div>
        </div>
        <StatusBadge status={r.status} isNew={r.isNew} />
      </div>
      <div className="mt-auto">
        {isOpenable ? (
          <Link to={r.to as never}>
            <Button size="sm" variant="outline" className="w-full">
              {lang === "ar" ? "فتح التقرير" : "Open report"}
            </Button>
          </Link>
        ) : (
          <Button size="sm" variant="outline" disabled className="w-full">
            {lang === "ar" ? "قريبًا" : "Coming soon"}
          </Button>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status, isNew }: { status: Status; isNew?: boolean }) {
  const { lang } = useI18n();
  const map = {
    available:  { ar: "متاح", en: "Available", cls: "bg-success/10 text-success border-success/20", Icon: CheckCircle2 },
    foundation: { ar: "تأسيسي", en: "Foundation", cls: "bg-primary/10 text-primary border-primary/20", Icon: Layers },
    coming_soon:{ ar: "قريبًا", en: "Coming Soon", cls: "bg-muted text-muted-foreground border-border", Icon: Clock },
  }[status];
  return (
    <div className="flex flex-col items-end gap-1 shrink-0">
      <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border ${map.cls}`}>
        <map.Icon className="size-3" />{lang === "ar" ? map.ar : map.en}
      </span>
      {isNew && (
        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
          <Sparkles className="size-3" />{lang === "ar" ? "جديد" : "New"}
        </span>
      )}
    </div>
  );
}
