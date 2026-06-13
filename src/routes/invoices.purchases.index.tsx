import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n, fmtMoney } from "@/lib/i18n";
import { useStore, purchaseDocTotals } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { Plus, Pencil } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { PermissionGate } from "@/components/PermissionGate";

export const Route = createFileRoute("/invoices/purchases/")({
  head: () => ({ meta: [{ title: "Purchase Invoices — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perm="invoices.view" mode="page">
      <PurchaseInvoicesPage />
    </PermissionGate>
  ),
});

function PurchaseInvoicesPage() {
  const { t, lang } = useI18n();
  const { can } = useAuth();
  const list = useStore((s) => s.purchase_invoices);
  const suppliers = useStore((s) => s.suppliers);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [q, setQ] = useState("");
  const canCreate = can("invoices.create");

  const filtered = list.filter((x) =>
    (statusFilter === "all" || x.status === statusFilter) &&
    [x.number, suppliers.find((s) => s.id === x.supplier_id)?.name_ar, suppliers.find((s) => s.id === x.supplier_id)?.name_en]
      .filter(Boolean).some((v) => v!.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <AppShell
      title={t("purchase_invoices")}
      action={
        canCreate ? (
          <Button asChild>
            <Link to="/invoices/purchases/new">
              <Plus className="size-4 me-1" />{t("new_purchase_invoice")}
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
              {["draft", "approved", "partially_paid", "paid", "cancelled"].map((s) => (
                <SelectItem key={s} value={s}>{t(s === "paid" ? "fully_paid" : s)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {filtered.length === 0 ? <EmptyState /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">{t("number")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("supplier")}</th>
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
                  const sup = suppliers.find((s) => s.id === x.supplier_id);
                  const totals = purchaseDocTotals(x.lines);
                  const remaining = totals.total - x.paid;
                  return (
                    <tr key={x.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono font-medium">{x.number}</td>
                      <td className="px-4 py-3">{sup ? (lang === "ar" ? sup.name_ar : sup.name_en) : "—"}</td>
                      <td className="px-4 py-3">{x.date}</td>
                      <td className="px-4 py-3">{x.due}</td>
                      <td className="px-4 py-3 text-end font-mono">{fmtMoney(totals.total, lang)}</td>
                      <td className="px-4 py-3 text-end font-mono text-success">{fmtMoney(x.paid, lang)}</td>
                      <td className="px-4 py-3 text-end font-mono">{fmtMoney(remaining, lang)}</td>
                      <td className="px-4 py-3"><StatusBadge status={x.status === "paid" ? "fully_paid" : x.status} /></td>
                      <td className="px-4 py-3 text-end whitespace-nowrap">
                        {canCreate && (
                          <Button asChild size="sm" variant="ghost">
                            <Link to="/invoices/purchases/$id/edit" params={{ id: x.id }}>
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
