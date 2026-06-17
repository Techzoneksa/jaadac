import { createClient } from "@/lib/supabase/server";
import {
  Users, Store, Receipt, ShoppingCart, FileText, Plus, ArrowLeft,
  Banknote, TrendingUp, AlertCircle, CheckCircle2, Clock, DollarSign, Landmark,
} from "lucide-react";
import Link from "next/link";
import { DashboardCharts } from "./DashboardCharts";

export const dynamic = "force-dynamic";

const f = (n: number) => {
  try { return new Intl.NumberFormat("ar-SA").format(n); }
  catch { return String(n ?? 0); }
};

type SumResult = { total: number; vat?: number };

async function safeCount(p: unknown): Promise<number> {
  if (!p) return 0;
  try { const r = await (p as PromiseLike<{ count: number | null }>); return r.count ?? 0; }
  catch { return 0; }
}

async function safeSum(p: unknown): Promise<SumResult> {
  if (!p) return { total: 0 };
  try {
    const r = await (p as PromiseLike<{ data: unknown }>);
    const rows = ((r as { data: unknown }).data ?? []) as Array<Record<string, unknown>>;
    return {
      total: rows.reduce((s, i) => s + Number(i.total || 0), 0),
      vat: rows.reduce((s, i) => s + Number(i.vat_total || 0), 0),
    };
  } catch { return { total: 0 }; }
}

async function safeList<T>(p: unknown, def: T): Promise<T> {
  if (!p) return def;
  try { const r = await (p as PromiseLike<{ data: T }>); return r.data ?? def; }
  catch { return def; }
}

export default async function DashboardPage() {
  let supabase;
  let uid: string | undefined;

  try {
    supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    uid = user?.id;
  } catch {
    // Auth or env failed — render dashboard with zeros
  }

  const [cc, sc, si, pi, ri, rc, rs, ps] = await Promise.all([
    safeCount(uid ? supabase!.from("customers").select("*", { count: "exact", head: true }).eq("tenant_id", uid) : null),
    safeCount(uid ? supabase!.from("suppliers").select("*", { count: "exact", head: true }).eq("tenant_id", uid) : null),
    safeSum(uid ? supabase!.from("invoices").select("total,vat_total", { count: "exact", head: false }).eq("tenant_id", uid).eq("type", "sale") : null),
    safeSum(uid ? supabase!.from("invoices").select("total", { count: "exact", head: false }).eq("tenant_id", uid).eq("type", "purchase") : null),
    safeList<Array<Record<string, unknown>>>(
      uid ? supabase!.from("invoices").select("id,number,customer_id,date,total,status").eq("tenant_id", uid).order("created_at", { ascending: false }).limit(6) : null,
      [],
    ),
    safeList<Array<Record<string, unknown>>>(
      uid ? supabase!.from("customers").select("id,name_ar,name_en,created_at").eq("tenant_id", uid).order("created_at", { ascending: false }).limit(4) : null,
      [],
    ),
    safeSum(uid ? supabase!.from("receipts").select("amount", { count: "exact", head: false }).eq("tenant_id", uid) : null),
    safeSum(uid ? supabase!.from("payments").select("amount", { count: "exact", head: false }).eq("tenant_id", uid) : null),
  ]);

  const statCards = [
    { label: "إجمالي الإيرادات", value: f(si.total), subtitle: "مجموع فواتير المبيعات", icon: DollarSign, gradient: "linear-gradient(135deg, #7c3aed, #a855f7)" },
    { label: "فواتير المبيعات", value: f(si.total > 0 ? si.total : (si.vat || 0) > 0 ? si.total : cc), subtitle: `عدد الفواتير: ${f(ri.length || 0)}`, icon: Receipt, gradient: "linear-gradient(135deg, #10b981, #34d399)" },
    { label: "فواتير المشتريات", value: f(pi.total), subtitle: `عدد الفواتير: ${f(pi.total > 0 ? pi.total : 0)}`, icon: ShoppingCart, gradient: "linear-gradient(135deg, #f59e0b, #fbbf24)" },
    { label: "العملاء", value: f(cc), subtitle: "إجمالي العملاء المسجلين", icon: Users, gradient: "linear-gradient(135deg, #06b6d4, #22d3ee)" },
    { label: "الموردون", value: f(sc), subtitle: "إجمالي الموردين المسجلين", icon: Store, gradient: "linear-gradient(135deg, #ec4899, #f472b6)" },
    { label: "المقبوضات", value: f(rs.total), subtitle: "إجمالي المقبوضات", icon: Banknote, gradient: "linear-gradient(135deg, #8b5cf6, #a78bfa)" },
    { label: "المدفوعات", value: f(ps.total), subtitle: "إجمالي المدفوعات", icon: Landmark, gradient: "linear-gradient(135deg, #ef4444, #f87171)" },
    { label: "ضريبة VAT", value: f(si.vat || 0), subtitle: "ضريبة القيمة المضافة المستحقة", icon: TrendingUp, gradient: "linear-gradient(135deg, #6366f1, #818cf8)" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-2">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight" style={{ color: "var(--fg)" }}>
            لوحة التحكم
          </h1>
          <p className="text-sm mt-1.5" style={{ color: "var(--text-muted)" }}>
            نظرة شاملة على أداء المنشأة
          </p>
        </div>
        <Link
          href="/sales/invoices/new"
          className="group inline-flex items-center gap-2.5 h-11 px-5 rounded-2xl text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97]"
          style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
        >
          <Plus className="h-4 w-4 transition-transform group-hover:scale-110" />
          فاتورة جديدة
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="group relative overflow-hidden rounded-2xl border p-5 transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5"
              style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
            >
              <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ background: s.gradient }}
              />
              <div className="relative">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm"
                    style={{ background: s.gradient }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                    style={{
                      backgroundColor: "var(--success-soft)",
                      color: "var(--success)",
                    }}
                  >
                    <span className="status-dot" style={{ backgroundColor: "var(--success)" }} />
                    هذا الشهر
                  </span>
                </div>
                <p className="text-[26px] font-bold tracking-tight leading-tight" style={{ color: "var(--fg)" }}>
                  {s.value}
                </p>
                <p className="text-sm font-medium mt-1.5" style={{ color: "var(--fg)" }}>
                  {s.label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted-light)" }}>
                  {s.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts + Alerts */}
      <div className="grid gap-5 xl:grid-cols-4">
        <div className="xl:col-span-3">
          <DashboardCharts />
        </div>
        <div
          className="rounded-2xl border p-5"
          style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-2.5 mb-5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ backgroundColor: "var(--primary-soft)" }}
            >
              <AlertCircle className="h-4 w-4" style={{ color: "var(--primary)" }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>التنبيهات</h2>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>آخر المستجدات</p>
            </div>
          </div>
          <div className="space-y-2.5">
            <div
              className="flex items-center gap-3 p-3 rounded-xl transition-colors"
              style={{ backgroundColor: "var(--surface)" }}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--warning-soft)" }}>
                <Clock className="h-4 w-4" style={{ color: "var(--warning)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--fg)" }}>فواتير غير مدفوعة</p>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>تأكد من حالة الفواتير</p>
              </div>
            </div>
            <div
              className="flex items-center gap-3 p-3 rounded-xl transition-colors"
              style={{ backgroundColor: "var(--surface)" }}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--success-soft)" }}>
                <CheckCircle2 className="h-4 w-4" style={{ color: "var(--success)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--fg)" }}>النظام يعمل بكفاءة</p>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>جميع الخدمات نشطة</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Recent invoices */}
        <div
          className="rounded-2xl border p-5"
          style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ backgroundColor: "var(--primary-soft)" }}
              >
                <Receipt className="h-4 w-4" style={{ color: "var(--primary)" }} />
              </div>
              <div>
                <h2 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>آخر الفواتير</h2>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>أحدث 6 فواتير</p>
              </div>
            </div>
            {ri.length > 0 && (
              <Link
                href="/sales/invoices"
                className="inline-flex items-center gap-1 text-xs font-medium transition-colors"
                style={{ color: "var(--primary)" }}
              >
                عرض الكل <ArrowLeft className="h-3 w-3" />
              </Link>
            )}
          </div>
          {ri.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl mb-4"
                style={{ backgroundColor: "var(--surface)" }}
              >
                <FileText className="h-7 w-7" style={{ color: "var(--text-muted-light)" }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>لا توجد فواتير بعد</p>
              <p className="text-xs mt-1 mb-4" style={{ color: "var(--text-muted)" }}>قم بإنشاء أول فاتورة</p>
              <Link
                href="/sales/invoices/new"
                className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
                style={{ color: "var(--primary)" }}
              >
                <Plus className="h-4 w-4" />
                إنشاء فاتورة
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              {ri.map((inv: Record<string, unknown>) => (
                <div
                  key={inv.id as string}
                  className="flex items-center justify-between py-2.5 px-3 rounded-xl transition-colors -mx-3"
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--surface)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
                      style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
                    >
                      {String(inv.number || "FT").slice(-3)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--fg)" }}>
                        {String(inv.number || "—")}
                      </p>
                      <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                        {String(inv.date || "—")}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold shrink-0 mr-3" style={{ color: "var(--fg)" }}>
                    {inv.total ? `${f(Number(inv.total))} ر.س` : "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent customers */}
        <div
          className="rounded-2xl border p-5"
          style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ backgroundColor: "var(--success-soft)" }}
              >
                <Users className="h-4 w-4" style={{ color: "var(--success)" }} />
              </div>
              <div>
                <h2 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>أحدث العملاء</h2>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>آخر 4 عملاء جدد</p>
              </div>
            </div>
            {rc.length > 0 && (
              <Link
                href="/customers"
                className="inline-flex items-center gap-1 text-xs font-medium transition-colors"
                style={{ color: "var(--primary)" }}
              >
                عرض الكل <ArrowLeft className="h-3 w-3" />
              </Link>
            )}
          </div>
          {rc.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl mb-4"
                style={{ backgroundColor: "var(--surface)" }}
              >
                <Users className="h-7 w-7" style={{ color: "var(--text-muted-light)" }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>لا يوجد عملاء بعد</p>
              <p className="text-xs mt-1 mb-4" style={{ color: "var(--text-muted)" }}>قم بإضافة أول عميل</p>
              <Link
                href="/customers/new"
                className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
                style={{ color: "var(--primary)" }}
              >
                <Plus className="h-4 w-4" />
                إضافة عميل
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              {rc.map((c: Record<string, unknown>) => {
                const name = String(c.name_ar || c.name_en || "?");
                return (
                  <div
                    key={c.id as string}
                    className="flex items-center gap-3 py-2.5 px-3 rounded-xl transition-colors -mx-3"
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--surface)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
                      style={{ background: "linear-gradient(135deg, #10b981, #34d399)" }}
                    >
                      {name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--fg)" }}>
                        {name}
                      </p>
                      <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                        {c.created_at ? new Date(c.created_at as string).toLocaleDateString("ar-SA") : "—"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
