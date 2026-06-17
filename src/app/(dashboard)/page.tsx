import { createClient } from "@/lib/supabase/server";
import { Users, Store, Receipt, ShoppingCart, FileText, Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";

type RecentRow = { id: string; number?: string; name_ar?: string; name_en?: string; customer_id?: string; date?: string; total?: number; created_at?: string; status?: string; [k: string]: unknown };

export const dynamic = "force-dynamic";

const f = (n: number) => { try { return new Intl.NumberFormat("ar-SA").format(n); } catch { return String(n ?? 0); } };

async function safeQuery<T>(fn: () => Promise<T>, def: T): Promise<T> {
  try { return await fn(); } catch { return def; }
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const uid = user?.id;

  const [customerCount, supplierCount, saleStats, purchaseStats, recentInvoices, recentCustomers] = await Promise.allSettled([
    uid ? supabase.from("customers").select("*", { count: "exact", head: true }).eq("tenant_id", uid).then((r) => r.count ?? 0) : Promise.resolve(0),
    uid ? supabase.from("suppliers").select("*", { count: "exact", head: true }).eq("tenant_id", uid).then((r) => r.count ?? 0) : Promise.resolve(0),
    uid ? supabase.from("invoices").select("total", { count: "exact", head: false }).eq("tenant_id", uid).eq("type", "sale").then((r) => ({ count: r.count ?? 0, total: (r.data ?? []).reduce((s, i) => s + Number(i.total || 0), 0) })) : Promise.resolve({ count: 0, total: 0 }),
    uid ? supabase.from("invoices").select("total", { count: "exact", head: false }).eq("tenant_id", uid).eq("type", "purchase").then((r) => ({ count: r.count ?? 0, total: (r.data ?? []).reduce((s, i) => s + Number(i.total || 0), 0) })) : Promise.resolve({ count: 0, total: 0 }),
    uid ? supabase.from("invoices").select("id,number,customer_id,date,total,status").eq("tenant_id", uid).order("created_at", { ascending: false }).limit(5).then((r) => (r.data ?? []) as RecentRow[]) : Promise.resolve([] as RecentRow[]),
    uid ? supabase.from("customers").select("id,name_ar,name_en,created_at").eq("tenant_id", uid).order("created_at", { ascending: false }).limit(5).then((r) => (r.data ?? []) as RecentRow[]) : Promise.resolve([] as RecentRow[]),
  ]);

  const v = <T,>(r: PromiseSettledResult<T>, def: T) => r.status === "fulfilled" ? r.value : def;
  const cc = v(customerCount, 0);
  const sc = v(supplierCount, 0);
  const si = v(saleStats, { count: 0, total: 0 });
  const pi = v(purchaseStats, { count: 0, total: 0 });
  const ri = v(recentInvoices, [] as RecentRow[]);
  const rc = v(recentCustomers, [] as RecentRow[]);

  const statCards = [
    {
      label: "العملاء", icon: Users, count: cc, detail: "إجمالي العملاء المسجلين",
      color: "bg-blue-50 text-blue-600", ring: "ring-blue-100",
      link: { href: "/customers", text: "عرض العملاء" },
    },
    {
      label: "الموردون", icon: Store, count: sc, detail: "إجمالي الموردين المسجلين",
      color: "bg-emerald-50 text-emerald-600", ring: "ring-emerald-100",
      link: { href: "/suppliers", text: "عرض الموردين" },
    },
    {
      label: "فواتير المبيعات", icon: Receipt, count: si.count, total: si.total, detail: "إجمالي المبيعات",
      color: "bg-violet-50 text-violet-600", ring: "ring-violet-100",
      link: { href: "/sales/invoices", text: "عرض الفواتير" },
    },
    {
      label: "فواتير المشتريات", icon: ShoppingCart, count: pi.count, total: pi.total, detail: "إجمالي المشتريات",
      color: "bg-amber-50 text-amber-600", ring: "ring-amber-100",
      link: { href: "/purchases/invoices", text: "عرض الفواتير" },
    },
  ];

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
          return (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className={`h-12 w-12 rounded-xl ${stat.color} flex items-center justify-center ring-1 ${stat.ring}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-2xl font-bold text-foreground">{f(stat.count)}</span>
              </div>
              <div className="mt-3">
                <p className="text-sm font-medium text-foreground">{stat.label}</p>
                <p className="text-xs text-muted mt-0.5">{stat.detail}</p>
                {"total" in stat && stat.total !== undefined && (
                  <p className="text-sm font-semibold text-foreground mt-1">{f(stat.total)} ر.س</p>
                )}
              </div>
              <div className="mt-2">
                <Link href={stat.link.href} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-dark transition-colors">
                  {stat.link.text} <ArrowLeft className="h-3 w-3" />
                </Link>
              </div>
            </div>
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
          {ri.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="h-12 w-12 text-[#cbd5e1] mb-3" />
              <p className="text-sm font-medium text-foreground">لا توجد فواتير بعد</p>
              <p className="text-xs text-muted mt-1 mb-4">قم بإنشاء أول فاتورة</p>
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
              {ri.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-[#f8fafc] transition-colors -mx-3">
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
          {rc.length === 0 ? (
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
              {rc.map((c) => (
                <div key={c.id} className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-[#f8fafc] transition-colors -mx-3">
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
