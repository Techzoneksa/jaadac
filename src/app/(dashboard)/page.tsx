import { createClient } from "@/lib/supabase/server";
import { Users, Store, Receipt, ShoppingCart, FileText, Plus } from "lucide-react";
import Link from "next/link";

type RecentRow = { id: string; number?: string; name_ar?: string; name_en?: string; customer_id?: string; date?: string; total?: number; created_at?: string; status?: string; [k: string]: unknown };

export const dynamic = "force-dynamic";

async function fetchCount(table: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;
    const { count } = await supabase.from(table).select("*", { count: "exact", head: true }).eq("tenant_id", user.id);
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function fetchRecent(table: string, cols = "id,name_ar,name_en,created_at") {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase.from(table).select(cols).eq("tenant_id", user.id).order("created_at", { ascending: false }).limit(5);
    return (data ?? []) as unknown as RecentRow[];
  } catch {
    return [];
  }
}

async function getDashboardData() {
  try {
    const [customerCount, supplierCount, invoiceCount, purchaseCount, recentInvoices, recentCustomers] = await Promise.all([
      fetchCount("customers"),
      fetchCount("suppliers"),
      fetchCount("invoices"),
      fetchCount("invoices").catch(() => 0),
      fetchRecent("invoices", "id,number,customer_id,date,total,status"),
      fetchRecent("customers"),
    ]);
    return { customerCount, supplierCount, invoiceCount, purchaseCount, recentInvoices, recentCustomers };
  } catch {
    return { customerCount: 0, supplierCount: 0, invoiceCount: 0, purchaseCount: 0, recentInvoices: [], recentCustomers: [] };
  }
}

const statCards = [
  { label: "العملاء", key: "customers", icon: Users, href: "/customers/new", color: "bg-blue-50 text-blue-600", ring: "ring-blue-100" },
  { label: "الموردون", key: "suppliers", icon: Store, href: "/suppliers/new", color: "bg-emerald-50 text-emerald-600", ring: "ring-emerald-100" },
  { label: "فواتير المبيعات", key: "invoices", icon: Receipt, href: "/sales/invoices/new", color: "bg-violet-50 text-violet-600", ring: "ring-violet-100" },
  { label: "فواتير المشتريات", key: "purchases", icon: ShoppingCart, href: "/purchases/invoices/new", color: "bg-amber-50 text-amber-600", ring: "ring-amber-100" },
];

export default async function DashboardPage() {
  const { customerCount, supplierCount, invoiceCount, purchaseCount, recentInvoices, recentCustomers } = await getDashboardData();

  const counts: Record<string, number> = {
    customers: customerCount,
    suppliers: supplierCount,
    invoices: invoiceCount,
    purchases: purchaseCount,
  };

  const f = (n: number) => new Intl.NumberFormat("ar-SA").format(n);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">لوحة التحكم</h1>
          <p className="text-sm text-muted mt-1">نظرة عامة على أداء المنشأة</p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const count = counts[stat.key];
          return (
            <Link key={stat.key} href={stat.href} className="stat-card block">
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm h-full">
                <div className="flex items-start justify-between">
                  <div className={`h-12 w-12 rounded-xl ${stat.color} flex items-center justify-center ring-1 ${stat.ring}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-2xl font-bold text-foreground">{f(count)}</span>
                </div>
                <div className="mt-3">
                  <p className="text-sm font-medium text-foreground">{stat.label}</p>
                  <p className="text-xs text-muted mt-0.5">
                    إجمالي {stat.label === "العملاء" ? "العملاء" : stat.label === "الموردون" ? "الموردين" : "الفواتير"}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold text-foreground">آخر الفواتير</h2>
            </div>
          </div>
          {recentInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="h-12 w-12 text-[#cbd5e1] mb-3" />
              <p className="text-sm font-medium text-foreground">لا توجد فواتير بعد</p>
              <p className="text-xs text-muted mt-1 mb-4">قم بإنشاء أول فاتورة مبيعات</p>
              <Link
                href="/sales/invoices/new"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
              >
                <Plus className="h-4 w-4" />
                إنشاء فاتورة
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentInvoices.map((inv, idx) => (
                <div key={inv.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-[#f8fafc] transition-colors -mx-3" style={{ animationDelay: `${idx * 50}ms` }}>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary-50 text-primary flex items-center justify-center text-xs font-bold">
                      {inv.number?.slice(-3) || "FT"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{inv.number || "—"}</p>
                      <p className="text-xs text-muted">{inv.date || "—"}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{inv.total ? `${f(inv.total)} ر.س` : "—"}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-600" />
              <h2 className="text-base font-semibold text-foreground">أحدث العملاء</h2>
            </div>
          </div>
          {recentCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="h-12 w-12 text-[#cbd5e1] mb-3" />
              <p className="text-sm font-medium text-foreground">لا يوجد عملاء بعد</p>
              <p className="text-xs text-muted mt-1 mb-4">قم بإضافة أول عميل</p>
              <Link
                href="/customers/new"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
              >
                <Plus className="h-4 w-4" />
                إضافة عميل
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              {recentCustomers.map((c, idx) => (
                <div key={c.id} className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-[#f8fafc] transition-colors -mx-3" style={{ animationDelay: `${idx * 50}ms` }}>
                  <div className="h-8 w-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold">
                    {(c.name_ar || "?").charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{c.name_ar || c.name_en}</p>
                    <p className="text-xs text-muted">{c.created_at ? new Date(c.created_at).toLocaleDateString("ar-SA") : "—"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
