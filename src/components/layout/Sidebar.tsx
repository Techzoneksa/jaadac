import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Users, Truck, Package, FileText, Receipt, ArrowDownCircle, ArrowUpCircle,
  ListTree, NotebookPen, CheckSquare, BarChart3, Settings as SettingsIcon, Languages, Building2,
  FileCog, SlidersHorizontal, UserCog, MessagesSquare, GitBranch,
  ShoppingCart, ClipboardList, FilePlus, FileMinus, Boxes, Banknote, Layers,
  Database, Plug, Palette, Shield, Briefcase, HardDrive, Map, ChevronDown,
  ChevronsLeft, ChevronsRight, Landmark, FolderKanban, Contact, Calculator,
  Wallet, ScrollText, Workflow,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth, type Permission } from "@/lib/auth";
import { cn } from "@/lib/utils";

type Status = "active" | "foundation" | "planned" | "coming_soon";

interface Item {
  to: string;
  key: string;
  label_ar: string;
  label_en: string;
  icon: typeof Users;
  exact?: boolean;
  perm: Permission;
  status?: Status; // omit for "active"
}

interface Group {
  key: string;
  label_ar: string;
  label_en: string;
  items: Item[];
  defaultOpen?: boolean;
}

const GROUPS: Group[] = [
  {
    key: "dashboard", label_ar: "لوحة البيانات", label_en: "Dashboard", defaultOpen: true,
    items: [
      { to: "/", key: "dashboard", label_ar: "لوحة التحكم", label_en: "Dashboard", icon: LayoutDashboard, exact: true, perm: "dashboard.view" },
      { to: "/tasks", key: "tasks", label_ar: "المهام", label_en: "Tasks", icon: CheckSquare, perm: "tasks.view" },
      { to: "/demo-flow", key: "demo_flow", label_ar: "تدفق العرض", label_en: "Demo Flow", icon: Workflow, perm: "demo.reset" },
    ],
  },
  {
    key: "sales", label_ar: "المبيعات", label_en: "Sales",
    items: [
      { to: "/quotations", key: "quotations", label_ar: "عروض الأسعار", label_en: "Quotations", icon: FileText, perm: "quotations.view" },
      { to: "/sales-orders", key: "sales_orders", label_ar: "أوامر البيع", label_en: "Sales Orders", icon: ShoppingCart, perm: "sales_orders.view", status: "foundation" },
      { to: "/invoices/sales", key: "sales_invoices", label_ar: "فواتير المبيعات", label_en: "Sales Invoices", icon: Receipt, perm: "invoices.view" },
      { to: "/receipts", key: "receipts", label_ar: "سندات القبض", label_en: "Receipt Vouchers", icon: ArrowDownCircle, perm: "receipts.view" },
      { to: "/credit-notes", key: "credit_notes", label_ar: "الإشعارات الدائنة", label_en: "Credit Notes", icon: FilePlus, perm: "credit_notes.view", status: "foundation" },
    ],
  },
  {
    key: "purchases", label_ar: "المشتريات", label_en: "Purchases",
    items: [
      { to: "/purchase-orders", key: "purchase_orders", label_ar: "أوامر الشراء", label_en: "Purchase Orders", icon: ClipboardList, perm: "purchase_orders.view", status: "foundation" },
      { to: "/invoices/purchases", key: "purchase_invoices", label_ar: "فواتير المشتريات", label_en: "Purchase Invoices", icon: Receipt, perm: "invoices.view", status: "foundation" },
      { to: "/payments", key: "payments", label_ar: "سندات الصرف", label_en: "Payment Vouchers", icon: ArrowUpCircle, perm: "payments.view" },
      { to: "/debit-notes", key: "debit_notes", label_ar: "الإشعارات المدينة", label_en: "Debit Notes", icon: FileMinus, perm: "debit_notes.view", status: "foundation" },
    ],
  },
  {
    key: "contacts", label_ar: "العملاء والموردون", label_en: "Contacts",
    items: [
      { to: "/customers", key: "customers", label_ar: "العملاء", label_en: "Customers", icon: Users, perm: "customers.view" },
      { to: "/suppliers", key: "suppliers", label_ar: "الموردين", label_en: "Suppliers", icon: Contact, perm: "suppliers.view" },
    ],
  },
  {
    key: "catalog", label_ar: "المنتجات والمخزون", label_en: "Products & Inventory",
    items: [
      { to: "/items", key: "items", label_ar: "المنتجات والخدمات", label_en: "Products & Services", icon: Package, perm: "items.view" },
      { to: "/inventory", key: "inventory", label_ar: "نظرة على المخزون", label_en: "Inventory", icon: Boxes, perm: "inventory.view", status: "foundation" },
    ],
  },
  {
    key: "accounting", label_ar: "المحاسبة", label_en: "Accounting",
    items: [
      { to: "/accounting/journal", key: "journal_entries", label_ar: "القيود اليومية", label_en: "Journal Entries", icon: NotebookPen, perm: "accounting.view" },
      { to: "/accounting/chart", key: "chart_of_accounts", label_ar: "شجرة الحسابات", label_en: "Chart of Accounts", icon: ListTree, perm: "accounting.view" },
      { to: "/accounting/taxes", key: "taxes", label_ar: "الضرائب", label_en: "Taxes", icon: Calculator, perm: "taxes.view" },
      { to: "/bank-reconciliation", key: "bank_recon", label_ar: "التسويات البنكية", label_en: "Bank Reconciliation", icon: Banknote, perm: "accounting.view", status: "planned" },
    ],
  },
  {
    key: "finance_structure", label_ar: "البنوك والأصول والتكاليف", label_en: "Finance Structure",
    items: [
      { to: "/bank-accounts", key: "bank_accounts", label_ar: "الحسابات البنكية", label_en: "Bank Accounts", icon: Landmark, perm: "bank_accounts.view", status: "foundation" },
      { to: "/fixed-assets", key: "fixed_assets", label_ar: "الأصول الثابتة", label_en: "Fixed Assets", icon: HardDrive, perm: "fixed_assets.view", status: "foundation" },
      { to: "/cost-centers", key: "cost_centers", label_ar: "مراكز التكلفة", label_en: "Cost Centers", icon: Layers, perm: "cost_centers.view", status: "foundation" },
      { to: "/projects", key: "projects", label_ar: "المشاريع", label_en: "Projects", icon: FolderKanban, perm: "projects.view", status: "foundation" },
      { to: "/branches", key: "branches", label_ar: "الفروع", label_en: "Branches", icon: GitBranch, perm: "branches.view" },
    ],
  },
  {
    key: "hr", label_ar: "الموارد البشرية", label_en: "HR",
    items: [
      { to: "/employees", key: "employees", label_ar: "الموظفون والرواتب", label_en: "Employees & Payroll", icon: UserCog, perm: "employees.view" },
      { to: "/hr", key: "hr_overview", label_ar: "نظرة HR", label_en: "HR Overview", icon: Briefcase, perm: "hr.view", status: "planned" },
    ],
  },
  {
    key: "reports", label_ar: "التقارير", label_en: "Reports",
    items: [
      { to: "/reports", key: "reports", label_ar: "مركز التقارير", label_en: "Reports Center", icon: BarChart3, perm: "reports.view" },
    ],
  },

  {
    key: "admin", label_ar: "الإعدادات والإدارة", label_en: "Settings & Admin",
    items: [
      { to: "/settings", key: "settings", label_ar: "إعدادات الشركة", label_en: "Company Settings", icon: SettingsIcon, perm: "settings.view" },
      { to: "/document-templates", key: "document_templates", label_ar: "قوالب المستندات", label_en: "Document Templates", icon: FileCog, perm: "templates.manage" },
      { to: "/template-designer", key: "templates", label_ar: "تصميم القوالب", label_en: "Template Designer", icon: Palette, perm: "templates.view", status: "foundation" },
      { to: "/custom-fields", key: "custom_fields", label_ar: "الحقول المخصصة", label_en: "Custom Fields", icon: SlidersHorizontal, perm: "custom_fields.manage" },
      { to: "/zatca", key: "zatca", label_ar: "هيئة الزكاة", label_en: "ZATCA", icon: Shield, perm: "zatca.view", status: "foundation" },
      { to: "/communication", key: "internal_communication", label_ar: "التواصل الداخلي", label_en: "Internal Communication", icon: MessagesSquare, perm: "communication.view" },
      { to: "/audit-log", key: "audit_log", label_ar: "سجل المراجعة", label_en: "Audit Log", icon: ScrollText, perm: "audit.view" },
      { to: "/permission-check", key: "permission_check", label_ar: "فحص الصلاحيات", label_en: "Permission Check", icon: Calculator, perm: "users.manage" },
      { to: "/system-data-mode", key: "system_data_mode", label_ar: "وضع البيانات", label_en: "System Data Mode", icon: Wallet, perm: "settings.manage" },
      { to: "/data-integrity", key: "data_integrity", label_ar: "سلامة البيانات", label_en: "Data Integrity", icon: Database, perm: "audit.view" },
    ],
  },
  {
    key: "integrations", label_ar: "التكاملات والمطورون", label_en: "Integrations & Developers",
    items: [
      { to: "/integrations", key: "integrations", label_ar: "الربط", label_en: "Integrations", icon: Plug, perm: "integrations.view", status: "planned" },
      { to: "/data-migration", key: "data_migration", label_ar: "نقل البيانات", label_en: "Data Migration", icon: Database, perm: "data_migration.view", status: "foundation" },
      { to: "/product-roadmap", key: "product_roadmap", label_ar: "خارطة المنتج", label_en: "Product Roadmap", icon: Map, perm: "roadmap.view" },
    ],
  },
];

function StatusDot({ status }: { status?: Status }) {
  if (!status || status === "active") return null;
  const cls: Record<Exclude<Status, "active">, string> = {
    foundation: "bg-blue-500",
    planned: "bg-purple-500",
    coming_soon: "bg-amber-500",
  };
  return <span className={cn("ms-auto size-1.5 rounded-full shrink-0", cls[status])} />;
}

export function SidebarContent({ onNavigate, collapsed = false }: { onNavigate?: () => void; collapsed?: boolean }) {
  const { lang, setLang, dir } = useI18n();
  const { can } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Filter to permitted items per group; hide empty groups.
  const groups = GROUPS
    .map(g => ({ ...g, items: g.items.filter(it => can(it.perm)) }))
    .filter(g => g.items.length > 0);

  // Single-open accordion: track which group is currently expanded.
  // Default: group containing the active route (else the first defaultOpen group).
  const findActiveGroup = () => {
    const active = groups.find(g =>
      g.items.some(it => it.exact ? pathname === it.to : pathname === it.to || (it.to !== "/" && pathname.startsWith(it.to + "/")))
    );
    if (active) return active.key;
    return groups.find(g => g.defaultOpen)?.key ?? groups[0]?.key ?? "";
  };
  const [openKey, setOpenKey] = useState<string>(() => findActiveGroup());
  // Auto-open the group containing the active route on navigation.
  useEffect(() => {
    const k = findActiveGroup();
    setOpenKey((cur) => (cur === k ? cur : k));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
  const toggle = (k: string) => setOpenKey((cur) => (cur === k ? "" : k));

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className={cn("h-16 flex items-center border-b border-sidebar-border shrink-0", collapsed ? "px-2 justify-center" : "gap-3 px-5")}>
        <div className="size-9 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
          <Building2 className="size-5 text-sidebar-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="leading-tight min-w-0">
            <div className="font-semibold text-sm truncate">{lang === "ar" ? "جاد كلاود" : "JAAD CLOUD"}</div>
            <div className="text-[11px] opacity-70 truncate">{lang === "ar" ? "نظام المحاسبة السحابي" : "Cloud Accounting"}</div>
          </div>
        )}
      </div>

      <nav className={cn("flex-1 overflow-y-auto py-3", collapsed ? "px-1.5" : "px-2")}>
        {groups.map(g => {
          const open = openKey === g.key;
          if (collapsed) {
            return (
              <div key={g.key} className="mb-1 space-y-0.5">
                {g.items.map(it => {
                  const active = it.exact ? pathname === it.to : pathname === it.to || (it.to !== "/" && pathname.startsWith(it.to + "/"));
                  const Icon = it.icon;
                  const label = lang === "ar" ? it.label_ar : it.label_en;
                  return (
                    <Link
                      key={it.to}
                      to={it.to as never}
                      onClick={onNavigate}
                      title={label}
                      aria-label={label}
                      className={cn(
                        "relative flex items-center justify-center size-10 mx-auto rounded-md transition-colors",
                        active
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      {it.status && it.status !== "active" && (
                        <span className={cn(
                          "absolute top-1 end-1 size-1.5 rounded-full",
                          it.status === "foundation" && "bg-blue-500",
                          it.status === "planned" && "bg-purple-500",
                          it.status === "coming_soon" && "bg-amber-500",
                        )} />
                      )}
                    </Link>
                  );
                })}
                <div className="mx-2 my-1 h-px bg-sidebar-border/60" />
              </div>
            );
          }
          return (
            <div key={g.key} className="mb-3">
              <button
                type="button"
                onClick={() => toggle(g.key)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-md text-[14px] font-semibold tracking-tight transition-colors",
                  open
                    ? "text-sidebar-foreground"
                    : "text-sidebar-foreground/85 hover:text-sidebar-foreground hover:bg-sidebar-accent/40"
                )}
              >
                <ChevronDown className={cn("size-3.5 opacity-70 transition-transform", !open && (dir === "rtl" ? "rotate-90" : "-rotate-90"))} />
                <span className="truncate">{lang === "ar" ? g.label_ar : g.label_en}</span>
              </button>
              {open && (
                <div
                  className={cn(
                    "mt-1 space-y-0.5 relative",
                    dir === "rtl" ? "pe-3 me-3 border-e border-sidebar-border/50" : "ps-3 ms-3 border-s border-sidebar-border/50"
                  )}
                >
                  {g.items.map(it => {
                    const active = it.exact ? pathname === it.to : pathname === it.to || (it.to !== "/" && pathname.startsWith(it.to + "/"));
                    const Icon = it.icon;
                    return (
                      <Link
                        key={it.to}
                        to={it.to as never}
                        onClick={onNavigate}
                        className={cn(
                          "relative flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-normal transition-colors",
                          active
                            ? "bg-sidebar-primary/15 text-sidebar-primary-foreground font-medium"
                            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                        )}
                      >
                        {active && (
                          <span
                            className={cn(
                              "absolute top-1/2 -translate-y-1/2 size-1.5 rounded-full bg-sidebar-primary",
                              dir === "rtl" ? "-end-[14px]" : "-start-[14px]"
                            )}
                          />
                        )}
                        <Icon className={cn("size-[15px] shrink-0", active ? "opacity-100" : "opacity-70")} />
                        <span className="truncate">{lang === "ar" ? it.label_ar : it.label_en}</span>
                        <StatusDot status={it.status} />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-2 shrink-0">
        <button
          onClick={() => setLang(lang === "ar" ? "en" : "ar")}
          title={lang === "ar" ? "English" : "العربية"}
          className={cn(
            "w-full flex items-center rounded-md text-sm hover:bg-sidebar-accent",
            collapsed ? "justify-center size-10" : "justify-between gap-2 px-3 py-2"
          )}
          dir={dir}
        >
          {collapsed ? (
            <Languages className="size-4" />
          ) : (
            <>
              <span className="flex items-center gap-2">
                <Languages className="size-4" />
                {lang === "ar" ? "English" : "العربية"}
              </span>
              <span className="text-xs opacity-60">{lang.toUpperCase()}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export function Sidebar({ collapsed = false, onToggle }: { collapsed?: boolean; onToggle?: () => void }) {
  const { lang, dir } = useI18n();
  return (
    <aside
      className={cn(
        "hidden md:flex flex-col shrink-0 relative transition-[width] duration-200",
        collapsed ? "w-16" : "w-64"
      )}
      style={{ borderInlineEnd: "1px solid var(--color-sidebar-border)" }}
    >
      <SidebarContent collapsed={collapsed} />
      {onToggle && (
        <button
          type="button"
          onClick={onToggle}
          aria-label={lang === "ar" ? (collapsed ? "توسيع القائمة" : "طي القائمة") : (collapsed ? "Expand sidebar" : "Collapse sidebar")}
          className="absolute top-20 -end-3 z-10 size-6 rounded-full border bg-card shadow-sm flex items-center justify-center hover:bg-muted"
        >
          {collapsed
            ? (dir === "rtl" ? <ChevronsLeft className="size-3.5" /> : <ChevronsRight className="size-3.5" />)
            : (dir === "rtl" ? <ChevronsRight className="size-3.5" /> : <ChevronsLeft className="size-3.5" />)}
        </button>
      )}
    </aside>
  );
}

