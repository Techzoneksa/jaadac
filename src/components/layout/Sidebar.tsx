"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Store, Package, Wallet, BarChart3, Settings,
  ChevronLeft, FileText, Receipt, Banknote, Network, Tags,
  ScrollText, Menu, Users,
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
    ],
  },
  {
    label: "المشتريات",
    items: [
      { label: "فواتير المشتريات", href: "/purchases/invoices", icon: <ScrollText className="h-5 w-5" /> },
    ],
  },
  {
    label: "جهات الاتصال",
    items: [
      { label: "العملاء", href: "/customers", icon: <Users className="h-5 w-5" /> },
      { label: "الموردون", href: "/suppliers", icon: <Store className="h-5 w-5" /> },
      { label: "المنتجات والخدمات", href: "/items", icon: <Package className="h-5 w-5" /> },
    ],
  },
  {
    label: "النقد والبنوك",
    items: [
      { label: "سندات القبض", href: "/cash/receipts", icon: <Banknote className="h-5 w-5" /> },
      { label: "سندات الصرف", href: "/cash/payments", icon: <Wallet className="h-5 w-5" /> },
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
    label: "الإعدادات",
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
          "flex items-center justify-center p-2.5 rounded-lg transition-all duration-150",
          isActive
            ? "bg-primary-light text-primary shadow-sm"
            : "text-muted hover:bg-[#f1f5f9] hover:text-foreground",
        )}
        title={item.label}
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
        isActive
          ? "bg-primary-light text-primary font-semibold shadow-sm"
          : "text-[#475569] hover:bg-[#f1f5f9] hover:text-[#1e293b]",
      )}
    >
      <span className={cn("shrink-0", isActive && "text-primary")}>{item.icon}</span>
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
      <p className="px-3 mb-1 text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">
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
  return (
    <>
      {collapsed ? (
        <aside className="flex flex-col border-l border-border bg-white w-16 shrink-0 z-20">
          <div className="flex items-center justify-center h-14 border-b border-border">
            <button
              onClick={onToggle}
              className="p-2 rounded-md text-muted hover:bg-[#f1f5f9] transition-colors"
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
          <div className="p-2 border-t border-border">
            <p className="text-[10px] text-center text-[#94a3b8]">v0.1</p>
          </div>
        </aside>
      ) : (
        <aside className="flex flex-col border-l border-border bg-white w-64 shrink-0 z-20">
          <div className="flex items-center justify-between h-14 px-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm shadow-sm">
                ج
              </div>
              <span className="text-lg font-bold text-primary tracking-tight">جاد كلاود</span>
            </div>
            <button
              onClick={onToggle}
              className="p-1.5 rounded-md text-muted hover:bg-[#f1f5f9] transition-colors"
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
          <div className="p-3 border-t border-border">
            <p className="text-xs text-center text-[#94a3b8]">JAAD CLOUD v0.1.0</p>
          </div>
        </aside>
      )}
    </>
  );
}
