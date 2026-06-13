"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  FileText,
  Receipt,
  ShoppingCart,
  Banknote,
  Wallet,
  BookOpen,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronDown,
  Network,
  Tags,
  ScrollText,
  Building2,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { label: "لوحة البيانات", href: "/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
  {
    label: "المبيعات",
    href: "#",
    icon: <ShoppingCart className="h-5 w-5" />,
    children: [
      { label: "عروض الأسعار", href: "/sales/quotations", icon: <FileText className="h-4 w-4" /> },
      { label: "فواتير المبيعات", href: "/sales/invoices", icon: <Receipt className="h-4 w-4" /> },
    ],
  },
  {
    label: "المشتريات",
    href: "#",
    icon: <Store className="h-5 w-5" />,
    children: [
      { label: "فواتير المشتريات", href: "/purchases/invoices", icon: <ScrollText className="h-4 w-4" /> },
    ],
  },
  {
    label: "العملاء والموردون",
    href: "#",
    icon: <Users className="h-5 w-5" />,
    children: [
      { label: "العملاء", href: "/customers", icon: <Building2 className="h-4 w-4" /> },
      { label: "الموردون", href: "/suppliers", icon: <Store className="h-4 w-4" /> },
    ],
  },
  { label: "المنتجات والخدمات", href: "/items", icon: <Package className="h-5 w-5" /> },
  {
    label: "النقد والبنوك",
    href: "#",
    icon: <Wallet className="h-5 w-5" />,
    children: [
      { label: "سندات القبض", href: "/cash/receipts", icon: <Banknote className="h-4 w-4" /> },
      { label: "سندات الصرف", href: "/cash/payments", icon: <Wallet className="h-4 w-4" /> },
    ],
  },
  {
    label: "المحاسبة",
    href: "#",
    icon: <BookOpen className="h-5 w-5" />,
    children: [
      { label: "شجرة الحسابات", href: "/accounting/chart", icon: <Network className="h-4 w-4" /> },
      { label: "قيود اليومية", href: "/accounting/journal", icon: <ScrollText className="h-4 w-4" /> },
      { label: "الضرائب", href: "/accounting/taxes", icon: <Tags className="h-4 w-4" /> },
    ],
  },
  { label: "التقارير", href: "/reports", icon: <BarChart3 className="h-5 w-5" /> },
  { label: "الإعدادات", href: "/settings", icon: <Settings className="h-5 w-5" /> },
];

function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const isActive = hasChildren
    ? item.children!.some((c) => pathname === c.href)
    : pathname === item.href;

  if (collapsed && hasChildren) {
    return null;
  }

  if (collapsed) {
    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center justify-center p-3 rounded-lg transition-colors",
          isActive
            ? "bg-blue-100 text-blue-700"
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-700",
        )}
        title={item.label}
      >
        {item.icon}
      </Link>
    );
  }

  return (
    <div>
      {hasChildren ? (
        <>
          <button
            onClick={() => setOpen(!open)}
            className={cn(
              "flex items-center w-full gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              isActive
                ? "bg-blue-100 text-blue-700"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700",
            )}
          >
            {item.icon}
            <span className="flex-1 text-right">{item.label}</span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
          </button>
          {open && (
            <div className="mr-6 mt-1 space-y-1">
              {item.children!.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                    pathname === child.href
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-700",
                  )}
                >
                  {child.icon}
                  <span>{child.label}</span>
                </Link>
              ))}
            </div>
          )}
        </>
      ) : (
        <Link
          href={item.href}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
            isActive
              ? "bg-blue-100 text-blue-700 font-medium"
              : "text-gray-500 hover:bg-gray-100 hover:text-gray-700",
          )}
        >
          {item.icon}
          <span>{item.label}</span>
        </Link>
      )}
    </div>
  );
}

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <aside
      className={cn(
        "flex flex-col border-l border-gray-200 bg-white transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!collapsed && (
          <span className="text-lg font-bold text-blue-700">جاد كلاود</span>
        )}
        <button
          onClick={onToggle}
          className="p-1 rounded-md text-gray-400 hover:bg-gray-100"
        >
          <ChevronLeft className={cn("h-5 w-5 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} collapsed={collapsed} />
        ))}
      </nav>
    </aside>
  );
}
