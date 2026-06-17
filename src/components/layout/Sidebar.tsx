"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Package, BarChart3, Settings,
  ChevronLeft, FileText, Receipt, Banknote, Network, Tags,
  ScrollText, Menu, Users, Store, ShoppingCart, LogOut,
  CreditCard, ArrowLeftRight, Building2,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "الرئيسية",
    items: [{ label: "لوحة البيانات", href: "/", icon: <LayoutDashboard className="h-5 w-5" /> }],
  },
  {
    label: "المبيعات",
    items: [
      { label: "عروض الأسعار", href: "/sales/quotations", icon: <FileText className="h-5 w-5" /> },
      { label: "فواتير المبيعات", href: "/sales/invoices", icon: <Receipt className="h-5 w-5" /> },
      { label: "إشعارات دائنة", href: "/sales/credit-notes", icon: <CreditCard className="h-5 w-5" /> },
      { label: "سندات القبض", href: "/cash/receipts", icon: <Banknote className="h-5 w-5" /> },
      { label: "العملاء", href: "/customers", icon: <Users className="h-5 w-5" /> },
    ],
  },
  {
    label: "المشتريات",
    items: [
      { label: "فواتير المشتريات", href: "/purchases/invoices", icon: <ScrollText className="h-5 w-5" /> },
      { label: "أوامر الشراء", href: "/purchases/orders", icon: <ShoppingCart className="h-5 w-5" /> },
      { label: "إشعارات مدينة", href: "/purchases/debit-notes", icon: <ArrowLeftRight className="h-5 w-5" /> },
      { label: "سندات الصرف", href: "/cash/payments", icon: <Building2 className="h-5 w-5" /> },
      { label: "الموردون", href: "/suppliers", icon: <Store className="h-5 w-5" /> },
    ],
  },
  {
    label: "المخزون والخدمات",
    items: [
      { label: "المنتجات والخدمات", href: "/items", icon: <Package className="h-5 w-5" /> },
    ],
  },
  {
    label: "المحاسبة",
    items: [
      { label: "شجرة الحسابات", href: "/accounting/chart", icon: <Network className="h-5 w-5" /> },
      { label: "قيود اليومية", href: "/accounting/journal", icon: <ScrollText className="h-5 w-5" /> },
      { label: "الضرائب", href: "/accounting/taxes", icon: <Tags className="h-5 w-5" /> },
    ],
  },
  {
    label: "التقارير",
    items: [
      { label: "مركز التقارير", href: "/reports", icon: <BarChart3 className="h-5 w-5" /> },
    ],
  },
  {
    label: "النظام",
    items: [
      { label: "الإعدادات", href: "/settings", icon: <Settings className="h-5 w-5" /> },
    ],
  },
];

function NavItemLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname();
  const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

  if (collapsed) {
    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center justify-center p-2.5 rounded-xl transition-all duration-150 relative group",
          isActive && "",
        )}
        style={{
          background: isActive ? "var(--sidebar-active)" : "transparent",
          color: isActive ? "#ffffff" : "var(--sidebar-muted)",
        }}
        title={item.label}
        onMouseEnter={(e) => {
          if (!isActive) e.currentTarget.style.background = "var(--sidebar-hover)";
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.background = "transparent";
        }}
      >
        {isActive && (
          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full bg-white/60" />
        )}
        {item.icon}
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group relative",
        isActive ? "font-medium" : "",
      )}
      style={{
        background: isActive ? "var(--sidebar-active)" : "transparent",
        color: isActive ? "#ffffff" : "var(--sidebar-muted)",
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = "var(--sidebar-hover)";
        if (!isActive) e.currentTarget.style.color = "var(--sidebar-text)";
      }}
      onMouseLeave={(e) => {
        if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--sidebar-muted)"; }
      }}
    >
      {isActive && (
        <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full bg-white/60" />
      )}
      <span className="shrink-0">{item.icon}</span>
      <span>{item.label}</span>
    </Link>
  );
}

function NavGroupSection({ group, collapsed }: { group: NavGroup; collapsed: boolean }) {
  if (collapsed) {
    return (
      <div className="space-y-1">
        {group.items.map((item) => (
          <NavItemLink key={item.href} item={item} collapsed={true} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <p
        className="px-3 mb-1.5 text-xs font-semibold tracking-wider uppercase"
        style={{ color: "var(--sidebar-muted)" }}
      >
        {group.label}
      </p>
      <div className="space-y-0.5">
        {group.items.map((item) => (
          <NavItemLink key={item.href} item={item} collapsed={false} />
        ))}
      </div>
    </div>
  );
}

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
    }
    router.push("/login");
  }

  return (
    <>
      {collapsed ? (
        <aside
          className="flex flex-col w-16 shrink-0 z-30 border-l"
          style={{ backgroundColor: "var(--sidebar-bg)", borderColor: "var(--sidebar-border)" }}
        >
          <div
            className="flex items-center justify-center h-16"
            style={{ borderBottom: "1px solid var(--sidebar-border)" }}
          >
            <button
              onClick={onToggle}
              className="p-2 rounded-xl transition-colors"
              style={{ color: "var(--sidebar-muted)" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--sidebar-hover)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              title="توسيع القائمة"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto p-2 space-y-3 py-4">
            {navGroups.map((group) => (
              <NavGroupSection key={group.label} group={group} collapsed={true} />
            ))}
          </nav>
          <div
            className="py-2"
            style={{ borderTop: "1px solid var(--sidebar-border)" }}
          >
            <button
              onClick={handleLogout}
              className="flex items-center justify-center p-2.5 rounded-xl transition-all duration-150 w-full"
              style={{ color: "var(--sidebar-muted)" }}
              title="تسجيل الخروج"
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--sidebar-hover)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
          <div className="p-2 pb-3">
            <p className="text-[10px] text-center" style={{ color: "var(--sidebar-muted)" }}>v0.1</p>
          </div>
        </aside>
      ) : (
        <aside
          className="flex flex-col w-64 shrink-0 z-30 border-l"
          style={{ backgroundColor: "var(--sidebar-bg)", borderColor: "var(--sidebar-border)" }}
        >
          {/* Logo */}
          <div
            className="flex items-center justify-between h-16 px-4"
            style={{ borderBottom: "1px solid var(--sidebar-border)" }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center font-bold text-sm"
                style={{
                  background: "var(--sidebar-active)",
                  color: "#ffffff",
                }}
              >
                ج
              </div>
              <div>
                <span
                  className="text-base font-bold tracking-tight block"
                  style={{ color: "var(--sidebar-text)" }}
                >
                  جاد كلاود
                </span>
                <span className="text-[10px]" style={{ color: "var(--sidebar-muted)" }}>
                  نظام المحاسبة السحابي
                </span>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: "var(--sidebar-muted)" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--sidebar-hover)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              title="طي القائمة"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
            {navGroups.map((group) => (
              <NavGroupSection key={group.label} group={group} collapsed={false} />
            ))}
          </nav>

          {/* Bottom */}
          <div style={{ borderTop: "1px solid var(--sidebar-border)" }}>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 mx-3 my-2 rounded-xl text-sm transition-all duration-150 w-[calc(100%-1.5rem)]"
              style={{ color: "var(--sidebar-muted)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--sidebar-hover)"; e.currentTarget.style.color = "var(--sidebar-text)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--sidebar-muted)"; }}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
          <div className="p-3 pb-4">
            <p className="text-xs text-center" style={{ color: "var(--sidebar-muted)" }}>
              JAAD CLOUD v0.1.0
            </p>
          </div>
        </aside>
      )}
    </>
  );
}
