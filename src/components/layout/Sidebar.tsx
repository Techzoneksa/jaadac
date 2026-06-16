"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Package, BarChart3, Settings,
  ChevronLeft, FileText, Receipt, Banknote, Network, Tags,
  ScrollText, Menu, Users, Store, ShoppingCart, LogOut,
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
      { label: "سندات القبض", href: "/cash/receipts", icon: <Banknote className="h-5 w-5" /> },
      { label: "العملاء", href: "/customers", icon: <Users className="h-5 w-5" /> },
    ],
  },
  {
    label: "المشتريات",
    items: [
      { label: "فواتير المشتريات", href: "/purchases/invoices", icon: <ScrollText className="h-5 w-5" /> },
      { label: "سندات الصرف", href: "/cash/payments", icon: <ShoppingCart className="h-5 w-5" /> },
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

const sidebarBg = "#0f172a";
const activeBg = "rgba(255,255,255,0.14)";
const hoverBg = "rgba(255,255,255,0.08)";
const textColor = "#ffffff";
const mutedText = "rgba(255,255,255,0.6)";

function NavItemLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname();
  const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

  if (collapsed) {
    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center justify-center p-2.5 rounded-lg transition-all duration-150",
          isActive
            ? "shadow-sm"
            : "",
        )}
        style={{
          color: isActive ? textColor : mutedText,
          backgroundColor: isActive ? activeBg : "transparent",
        }}
        title={item.label}
        onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = hoverBg; }}
        onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = "transparent"; }}
      >
        {item.icon}
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group",
        isActive ? "font-medium" : "",
      )}
      style={{
        color: isActive ? textColor : mutedText,
        backgroundColor: isActive ? activeBg : "transparent",
      }}
      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = hoverBg; }}
      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = "transparent"; }}
    >
      <span className="shrink-0" style={{ color: isActive ? textColor : mutedText }}>{item.icon}</span>
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
        className="px-3 mb-1 text-xs font-medium tracking-wide"
        style={{ color: mutedText }}
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
          className="flex flex-col w-16 shrink-0 z-20"
          style={{ backgroundColor: sidebarBg }}
        >
          <div
            className="flex items-center justify-center h-14"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
          >
            <button
              onClick={onToggle}
              className="p-2 rounded-md transition-colors"
              style={{ color: mutedText }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverBg}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              title="توسيع القائمة"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto p-2 space-y-3 py-3">
            {navGroups.map((group) => (
              <NavGroupSection key={group.label} group={group} collapsed={true} />
            ))}
          </nav>
          <div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center p-2.5 rounded-lg transition-all duration-150 w-full"
              style={{ color: mutedText }}
              title="تسجيل الخروج"
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverBg}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
          <div
            className="p-2"
            style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
          >
            <p className="text-[10px] text-center" style={{ color: mutedText }}>v0.1</p>
          </div>
        </aside>
      ) : (
        <aside
          className="flex flex-col w-64 shrink-0 z-20"
          style={{ backgroundColor: sidebarBg }}
        >
          <div
            className="flex items-center justify-between h-14 px-4"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm"
                style={{
                  backgroundColor: "rgba(255,255,255,0.15)",
                  color: textColor,
                }}
              >
                ج
              </div>
              <span
                className="text-lg font-bold tracking-tight"
                style={{ color: textColor }}
              >
                جاد كلاود
              </span>
            </div>
            <button
              onClick={onToggle}
              className="p-1.5 rounded-md transition-colors"
              style={{ color: mutedText }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverBg}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              title="طي القائمة"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
            {navGroups.map((group) => (
              <NavGroupSection key={group.label} group={group} collapsed={false} />
            ))}
          </nav>
          <div
            style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
          >
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 mx-3 rounded-lg text-sm transition-all duration-150 w-[calc(100%-1.5rem)]"
              style={{ color: mutedText }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverBg}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
          <div
            className="p-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
          >
            <p
              className="text-xs text-center"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              JAAD CLOUD v0.1.0
            </p>
          </div>
        </aside>
      )}
    </>
  );
}
