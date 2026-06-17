import { createClient } from "@/lib/supabase/server";
import {
  Users, Store, Receipt, ShoppingCart, FileText, Plus, ArrowLeft,
  Banknote, TrendingUp, AlertCircle, CheckCircle2, Clock, DollarSign,
} from "lucide-react";
import Link from "next/link";
import { DashboardCharts } from "./DashboardCharts";

type RecentRow = { id: string; number?: string; name_ar?: string; name_en?: string; customer_id?: string; date?: string; total?: number; created_at?: string; status?: string; [k: string]: unknown };

export const dynamic = "force-dynamic";

const f = (n: number) => { try { return new Intl.NumberFormat("ar-SA").format(n); } catch { return String(n ?? 0); } };

const gradientMap = [
  "linear-gradient(135deg, #7c3aed, #a855f7)",
  "linear-gradient(135deg, #10b981, #34d399)",
  "linear-gradient(135deg, #f59e0b, #fbbf24)",
  "linear-gradient(135deg, #06b6d4, #22d3ee)",
  "linear-gradient(135deg, #ec4899, #f472b6)",
  "linear-gradient(135deg, #8b5cf6, #a78bfa)",
  "linear-gradient(135deg, #ef4444, #f87171)",
  "linear-gradient(135deg, #6366f1, #818cf8)",
];

const iconMap = [
  <DollarSign key="rev" className="h-6 w-6" />,
  <Receipt key="sale" className="h-6 w-6" />,
  <ShoppingCart key="pur" className="h-6 w-6" />,
  <Users key="cust" className="h-6 w-6" />,
  <Store key="supp" className="h-6 w-6" />,
  <Banknote key="rec" className="h-6 w-6" />,
  <TrendingUp key="pay" className="h-6 w-6" />,
  <DollarSign key="vat" className="h-6 w-6" />,
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const uid = user?.id;

  const [customerCount, supplierCount, saleStats, purchaseStats, recentInvoices, recentCustomers, receiptStats, paymentStats] = await Promise.allSettled([
    uid ? supabase.from("customers").select("*", { count: "exact", head: true }).eq("tenant_id", uid).then((r) => r.count ?? 0) : Promise.resolve(0),
    uid ? supabase.from("suppliers").select("*", { count: "exact", head: true }).eq("tenant_id", uid).then((r) => r.count ?? 0) : Promise.resolve(0),
    uid ? supabase.from("invoices").select("total,vat_total", { count: "exact", head: false }).eq("tenant_id", uid).eq("type", "sale").then((r) => ({ count: r.count ?? 0, total: (r.data ?? []).reduce((s, i) => s + Number(i.total || 0), 0), vat: (r.data ?? []).reduce((s, i) => s + Number(i.vat_total || 0), 0) })) : Promise.resolve({ count: 0, total: 0, vat: 0 }),
    uid ? supabase.from("invoices").select("total", { count: "exact", head: false }).eq("tenant_id", uid).eq("type", "purchase").then((r) => ({ count: r.count ?? 0, total: (r.data ?? []).reduce((s, i) => s + Number(i.total || 0), 0) })) : Promise.resolve({ count: 0, total: 0 }),
    uid ? supabase.from("invoices").select("id,number,customer_id,date,total,status").eq("tenant_id", uid).order("created_at", { ascending: false }).limit(6).then((r) => (r.data ?? []) as RecentRow[]) : Promise.resolve([] as RecentRow[]),
    uid ? supabase.from("customers").select("id,name_ar,name_en,created_at").eq("tenant_id", uid).order("created_at", { ascending: false }).limit(4).then((r) => (r.data ?? []) as RecentRow[]) : Promise.resolve([] as RecentRow[]),
    uid ? supabase.from("receipts").select("amount", { count: "exact", head: false }).eq("tenant_id", uid).then((r) => ({ count: r.count ?? 0, total: (r.data ?? []).reduce((s, i) => s + Number((i as { amount: number }).amount || 0), 0) })) : Promise.resolve({ count: 0, total: 0 }),
    uid ? supabase.from("payments").select("amount", { count: "exact", head: false }).eq("tenant_id", uid).then((r) => ({ count: r.count ?? 0, total: (r.data ?? []).reduce((s, i) => s + Number((i as { amount: number }).amount || 0), 0) })) : Promise.resolve({ count: 0, total: 0 }),
  ]);

  const v = <T,>(r: PromiseSettledResult<T>, def: T) => r.status === "fulfilled" ? r.value : def;

  const statCards = [
    { label: "إجمالي الإيرادات", value: f(v(saleStats, { count: 0, total: 0, vat: 0 }).total), subtitle: "مجموع فواتير المبيعات", iconIdx: 0, trend: { value: "+12.5%", positive: true } },
    { label: "فواتير المبيعات", value: f(v(saleStats, { count: 0, total: 0, vat: 0 }).count), subtitle: "إجمالي عدد فواتير المبيعات", iconIdx: 1, trend: { value: `${v(saleStats, { count: 0, total: 0, vat: 0 }).count > 0 ? "+" : ""}${f(v(saleStats, { count: 0, total: 0, vat: 0 }).count)}`, positive: true } },
    { label: "فواتير المشتريات", value: f(v(purchaseStats, { count: 0, total: 0 }).count), subtitle: `المجموع: ${f(v(purchaseStats, { count: 0, total: 0 }).total)} ر.س`, iconIdx: 2, trend: { value: `${f(v(purchaseStats, { count: 0, total: 0 }).total > 0 ? v(purchaseStats, { count: 0, total: 0 }).total : 0)} ر.س`, positive: false } },
    { label: "العملاء", value: f(v(customerCount, 0)), subtitle: "إجمالي العملاء المسجلين", iconIdx: 3, trend: { value: v(customerCount, 0) > 0 ? `+${f(v(customerCount, 0))}` : "0", positive: v(customerCount, 0) > 0 } },
    { label: "الموردون", value: f(v(supplierCount, 0)), subtitle: "إجمالي الموردين المسجلين", iconIdx: 4, trend: { value: v(supplierCount, 0) > 0 ? `+${f(v(supplierCount, 0))}` : "0", positive: v(supplierCount, 0) > 0 } },
    { label: "المقبوضات", value: f(v(receiptStats, { count: 0, total: 0 }).count), subtitle: `المجموع: ${f(v(receiptStats, { count: 0, total: 0 }).total)} ر.س`, iconIdx: 5, trend: { value: `${f(v(receiptStats, { count: 0, total: 0 }).count > 0 ? v(receiptStats, { count: 0, total: 0 }).count : 0)}`, positive: v(receiptStats, { count: 0, total: 0 }).count > 0 } },
    { label: "المدفوعات", value: f(v(paymentStats, { count: 0, total: 0 }).count), subtitle: `المجموع: ${f(v(paymentStats, { count: 0, total: 0 }).total)} ر.س`, iconIdx: 6, trend: { value: `${f(v(paymentStats, { count: 0, total: 0 }).count > 0 ? v(paymentStats, { count: 0, total: 0 }).count : 0)}`, positive: false } },
    { label: "ضريبة VAT", value: f(v(saleStats, { count: 0, total: 0, vat: 0 }).vat), subtitle: "ضريبة القيمة المضافة المستحقة", iconIdx: 7, trend: { value: v(saleStats, { count: 0, total: 0, vat: 0 }).vat > 0 ? `${f(v(saleStats, { count: 0, total: 0, vat: 0 }).vat)} ر.س` : "0", positive: true } },
  ];

  const ri = v(recentInvoices, [] as RecentRow[]);
  const rc = v(recentCustomers, [] as RecentRow[]);

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--fg)" }}>لوحة التحكم</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>نظرة شاملة على أداء المنشأة</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/sales/invoices/new"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-medium text-white transition-all duration-200 hover:shadow-md active:scale-[0.97]"
            style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
          >
            <Plus className="h-4 w-4" />
            فاتورة جديدة
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <div
            key={stat.label}
            className="group relative overflow-hidden rounded-2xl border p-5 transition-all duration-200 hover:shadow-elevated card-hover"
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--border)",
            }}
          >
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{ background: gradientMap[i % gradientMap.length] }}
            />
            <div className="relative">
              <div className="flex items-start justify-between mb-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
                  style={{ background: gradientMap[i % gradientMap.length] }}
                >
                  {iconMap[i % iconMap.length]}
                </div>
                {stat.trend && (
                  <div
                    className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: stat.trend.positive ? "var(--success-soft)" : "var(--danger-soft)",
                      color: stat.trend.positive ? "var(--success)" : "var(--danger)",
                    }}
                  >
                    <span>{stat.trend.value}</span>
                  </div>
                )}
              </div>
              <p className="text-2xl font-bold tracking-tight" style={{ color: "var(--fg)" }}>
                {stat.value}
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                {stat.label}
              </p>
              {stat.subtitle && (
                <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted-light)" }}>
                  {stat.subtitle}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Charts + Alerts Row */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Charts area */}
        <div className="lg:col-span-2">
          <DashboardCharts />
        </div>

        {/* Alerts */}
        <div
          className="rounded-2xl border p-5"
          style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5" style={{ color: "var(--primary)" }} />
            <h2 className="text-base font-semibold" style={{ color: "var(--fg)" }}>التنبيهات</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "var(--surface)" }}>
              <Clock className="h-5 w-5 shrink-0" style={{ color: "var(--warning)" }} />
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>فواتير غير مدفوعة</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>تأكد من حالة الفواتير</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "var(--surface)" }}>
              <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: "var(--success)" }} />
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>النظام يعمل بكفاءة</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>جميع الخدمات نشطة</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Row */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Recent Invoices */}
        <div
          className="rounded-2xl border p-5"
          style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5" style={{ color: "var(--primary)" }} />
              <h2 className="text-base font-semibold" style={{ color: "var(--fg)" }}>آخر الفواتير</h2>
            </div>
            {ri.length > 0 && (
              <Link
                href="/sales/invoices"
                className="text-xs font-medium flex items-center gap-1 transition-colors"
                style={{ color: "var(--primary)" }}
              >
                عرض الكل <ArrowLeft className="h-3 w-3" />
              </Link>
            )}
          </div>
          {ri.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <FileText className="h-12 w-12 mb-3" style={{ color: "var(--text-muted-light)" }} />
              <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>لا توجد فواتير بعد</p>
              <p className="text-xs mt-1 mb-4" style={{ color: "var(--text-muted)" }}>قم بإنشاء أول فاتورة</p>
              <Link
                href="/sales/invoices/new"
                className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
                style={{ color: "var(--primary)" }}
              >
                <Plus className="h-4 w-4" />
                إنشاء فاتورة
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              {ri.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between py-2.5 px-3 rounded-xl transition-colors -mx-3"
                  style={{ backgroundColor: "transparent" }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--surface)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-9 w-9 rounded-xl flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
                    >
                      {inv.number?.slice(-3) || "FT"}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>{inv.number || "—"}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{inv.date || "—"}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
                    {inv.total ? `${f(inv.total)} ر.س` : "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Customers */}
        <div
          className="rounded-2xl border p-5"
          style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" style={{ color: "var(--success)" }} />
              <h2 className="text-base font-semibold" style={{ color: "var(--fg)" }}>أحدث العملاء</h2>
            </div>
            {rc.length > 0 && (
              <Link
                href="/customers"
                className="text-xs font-medium flex items-center gap-1 transition-colors"
                style={{ color: "var(--primary)" }}
              >
                عرض الكل <ArrowLeft className="h-3 w-3" />
              </Link>
            )}
          </div>
          {rc.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Users className="h-12 w-12 mb-3" style={{ color: "var(--text-muted-light)" }} />
              <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>لا يوجد عملاء بعد</p>
              <p className="text-xs mt-1 mb-4" style={{ color: "var(--text-muted)" }}>قم بإضافة أول عميل</p>
              <Link
                href="/customers/new"
                className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
                style={{ color: "var(--primary)" }}
              >
                <Plus className="h-4 w-4" />
                إضافة عميل
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              {rc.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-xl transition-colors -mx-3"
                  style={{ backgroundColor: "transparent" }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--surface)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <div
                    className="h-9 w-9 rounded-xl flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #10b981, #34d399)" }}
                  >
                    {(c.name_ar || "?").charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>{c.name_ar || c.name_en}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {c.created_at ? new Date(c.created_at).toLocaleDateString("ar-SA") : "—"}
                    </p>
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
