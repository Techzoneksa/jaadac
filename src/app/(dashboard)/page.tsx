import { createClient } from "@/lib/supabase/server";

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
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function DashboardPage() {
  const [customerCount, supplierCount, invoiceCount, purchaseCount, recentInvoices, recentCustomers] = await Promise.all([
    fetchCount("customers"),
    fetchCount("suppliers"),
    fetchCount("invoices"),
    fetchCount("purchase_invoices"),
    fetchRecent("invoices", "id,number,customer_id,date,total,status"),
    fetchRecent("customers"),
  ]);

  const f = (n: number) => new Intl.NumberFormat("ar-SA").format(n);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">لوحة التحكم</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "العملاء", value: f(customerCount), color: "bg-blue-500" },
          { label: "الموردون", value: f(supplierCount), color: "bg-green-500" },
          { label: "فواتير المبيعات", value: f(invoiceCount), color: "bg-purple-500" },
          { label: "فواتير المشتريات", value: f(purchaseCount), color: "bg-orange-500" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                <span className="text-lg font-bold text-white">{stat.value}</span>
              </div>
              <div>
                <p className="text-sm text-muted">{stat.label}</p>
                <p className="text-xl font-bold">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">آخر الفواتير</h2>
          {recentInvoices.length === 0 ? (
            <p className="text-sm text-muted">لا توجد فواتير بعد</p>
          ) : (
            <ul className="space-y-2">
              {recentInvoices.map((inv: any) => (
                <li key={inv.id} className="flex items-center justify-between text-sm">
                  <span>{inv.number}</span>
                  <span>{inv.total ? f(inv.total) : "—"}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">أحدث العملاء</h2>
          {recentCustomers.length === 0 ? (
            <p className="text-sm text-muted">لا يوجد عملاء بعد</p>
          ) : (
            <ul className="space-y-2">
              {recentCustomers.map((c: any) => (
                <li key={c.id} className="text-sm">{c.name_ar || c.name_en}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
