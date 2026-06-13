import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n, fmtMoney } from "@/lib/i18n";
import { useStore, docTotals } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { Plus, Pencil } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { PermissionGate } from "@/components/PermissionGate";

export const Route = createFileRoute("/invoices/sales/")({
  head: () => ({ meta: [{ title: "Sales Invoices — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perm="invoices.view" mode="page">
      <SalesInvoicesPage />
    </PermissionGate>
  ),
});

function SalesInvoicesPage() {
  const { t, lang } = useI18n();
  const { can } = useAuth();
  const list = useStore((s) => s.invoices);
  const customers = useStore((s) => s.customers);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [q, setQ] = useState("");
  const canCreate = can("invoices.create");

  const filtered = list.filter((x) =>
    (statusFilter === "all" || x.status === statusFilter) &&
    [x.number, customers.find((c) => c.id === x.customer_id)?.name_ar, customers.find((c) => c.id === x.customer_id)?.name_en]
      .filter(Boolean).some((v) => v!.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <AppShell
      title={t("sales_invoices")}
      action={
        canCreate ? (
          <Button asChild>
            <Link to="/invoices/sales/new">
              <Plus className="size-4 me-1" />{t("new_sales_invoice")}
            </Link>
          </Button>
        ) : null
      }
    >
      <div className="card-elevated">
        <div className="p-4 border-b flex flex-col md:flex-row gap-3">
          <Input placeholder={t("search")} value={q} onChange={(e) => setQ(e.target.value)} className="md:max-w-sm" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="md:w-52"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("all")}</SelectItem>
              {["draft", "sent", "official", "partially_paid", "fully_paid", "cancelled"].map((s) => <SelectItem key={s} value={s}>{t(s)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {filtered.length === 0 ? <EmptyState /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">{t("number")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("customer")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("date")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("due_date")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("total")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("paid")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("remaining")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("status")}</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((x) => {
                  const cust = customers.find((c) => c.id === x.customer_id);
                  const totals = docTotals(x.lines, x.discount);
                  const remaining = totals.total - x.paid;
                  return (
                    <tr key={x.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono font-medium">{x.number}</td>
                      <td className="px-4 py-3">{cust ? (lang === "ar" ? cust.name_ar : cust.name_en) : "—"}</td>
                      <td className="px-4 py-3">{x.date}</td>
                      <td className="px-4 py-3">{x.due}</td>
                      <td className="px-4 py-3 text-end font-mono">{fmtMoney(totals.total, lang)}</td>
                      <td className="px-4 py-3 text-end font-mono text-success">{fmtMoney(x.paid, lang)}</td>
                      <td className="px-4 py-3 text-end font-mono">{fmtMoney(remaining, lang)}</td>
                      <td className="px-4 py-3"><StatusBadge status={x.status} /></td>
                      <td className="px-4 py-3 text-end whitespace-nowrap">
                        {canCreate && (
                          <Button asChild size="sm" variant="ghost">
                            <Link to="/invoices/sales/$id/edit" params={{ id: x.id }}>
                              <Pencil className="size-4" />
                            </Link>
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
