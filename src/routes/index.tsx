import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n, fmtMoney } from "@/lib/i18n";
import { useStore, docTotals } from "@/lib/store";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Receipt, FileText, ArrowDownCircle, ArrowUpCircle, Users, Truck, Package, AlertCircle,
} from "lucide-react";
import type { ReactNode } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "JAAD CLOUD — Dashboard" }],
  }),
  component: Dashboard,
});

function StatCard({ icon, label, value, accent }: { icon: ReactNode; label: string; value: string; accent?: string }) {
  return (
    <div className="card-elevated p-5">
      <div className="flex items-center justify-between">
        <div className={`size-10 rounded-lg flex items-center justify-center ${accent || "bg-accent text-accent-foreground"}`}>
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
      </div>
    </div>
  );
}

function Dashboard() {
  const { t, lang } = useI18n();
  const s = useStore((s) => s);

  const totalSales = s.invoices
    .filter((i) => i.status !== "draft" && i.status !== "cancelled")
    .reduce((sum, i) => sum + docTotals(i.lines, i.discount).total, 0);

  const unpaid = s.invoices.filter((i) => ["official", "partially_paid", "sent"].includes(i.status));
  const unpaidAmount = unpaid.reduce((sum, i) => sum + (docTotals(i.lines, i.discount).total - i.paid), 0);

  const qSent = s.quotations.filter((q) => q.status === "sent").length;
  const rTotal = s.receipts.reduce((s, r) => s + r.amount, 0);
  const pTotal = s.payments.reduce((s, p) => s + p.amount, 0);

  const recent = [
    ...s.invoices.slice(-3).map((i) => ({ type: "invoice", date: i.date, label: i.number, status: i.status, id: i.id })),
    ...s.receipts.slice(-3).map((r) => ({ type: "receipt", date: r.date, label: r.number, status: "fully_paid", id: r.id })),
    ...s.quotations.slice(-3).map((q) => ({ type: "quotation", date: q.date, label: q.number, status: q.status, id: q.id })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);

  return (
    <AppShell title={t("dashboard")}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Receipt className="size-5" />} label={t("total_sales")} value={fmtMoney(totalSales, lang)} accent="bg-primary text-primary-foreground" />
        <StatCard icon={<AlertCircle className="size-5" />} label={t("unpaid_invoices")} value={fmtMoney(unpaidAmount, lang)} accent="bg-warning/20 text-warning-foreground" />
        <StatCard icon={<FileText className="size-5" />} label={t("quotations_sent")} value={String(qSent)} />
        <StatCard icon={<ArrowDownCircle className="size-5" />} label={t("receipts")} value={fmtMoney(rTotal, lang)} accent="bg-success/15 text-success" />
        <StatCard icon={<ArrowUpCircle className="size-5" />} label={t("payments")} value={fmtMoney(pTotal, lang)} accent="bg-destructive/10 text-destructive" />
        <StatCard icon={<Users className="size-5" />} label={t("customers")} value={String(s.customers.length)} />
        <StatCard icon={<Truck className="size-5" />} label={t("suppliers")} value={String(s.suppliers.length)} />
        <StatCard icon={<Package className="size-5" />} label={t("items")} value={String(s.items.length)} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-6">
        <div className="lg:col-span-2 card-elevated p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">{t("recent_activity")}</h2>
          </div>
          <div className="divide-y">
            {recent.map((r, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{r.label}</div>
                  <div className="text-xs text-muted-foreground">{r.date}</div>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="card-elevated p-5">
          <h2 className="font-semibold mb-4">{t("alerts")}</h2>
          <div className="space-y-3">
            {unpaid.slice(0, 4).map((i) => (
              <Link key={i.id} to="/invoices" className="flex items-start gap-3 p-3 rounded-lg bg-warning/10 hover:bg-warning/15 transition">
                <AlertCircle className="size-4 text-warning-foreground mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium">{i.number}</div>
                  <div className="text-xs text-muted-foreground">{t("due_date")}: {i.due}</div>
                </div>
              </Link>
            ))}
            {s.quotations.filter((q) => q.status === "sent").slice(0, 2).map((q) => (
              <Link key={q.id} to="/quotations" className="flex items-start gap-3 p-3 rounded-lg bg-info/10 hover:bg-info/15 transition">
                <FileText className="size-4 text-info mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium">{q.number}</div>
                  <div className="text-xs text-muted-foreground">{t("expiry_date")}: {q.expiry}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-6">
        <DocList title={t("latest_invoices")} link="/invoices" items={s.invoices.slice(-5).reverse().map((i) => ({
          id: i.id, number: i.number, date: i.date, total: docTotals(i.lines, i.discount).total, status: i.status,
          name: s.customers.find((c) => c.id === i.customer_id)?.[lang === "ar" ? "name_ar" : "name_en"] || "",
        }))} />
        <DocList title={t("latest_quotations")} link="/quotations" items={s.quotations.slice(-5).reverse().map((q) => ({
          id: q.id, number: q.number, date: q.date, total: docTotals(q.lines, q.discount).total, status: q.status,
          name: s.customers.find((c) => c.id === q.customer_id)?.[lang === "ar" ? "name_ar" : "name_en"] || "",
        }))} />
      </div>
    </AppShell>
  );
}

function DocList({ title, items, link }: { title: string; link: string; items: { id: string; number: string; date: string; total: number; status: string; name: string }[] }) {
  const { lang } = useI18n();
  return (
    <div className="card-elevated p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">{title}</h2>
        <Link to={link as never} className="text-xs text-info hover:underline">→</Link>
      </div>
      <div className="divide-y">
        {items.map((it) => (
          <div key={it.id} className="py-2.5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{it.number} · {it.name}</div>
              <div className="text-xs text-muted-foreground">{it.date}</div>
            </div>
            <div className="text-end">
              <div className="text-sm font-semibold">{fmtMoney(it.total, lang)}</div>
              <StatusBadge status={it.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
