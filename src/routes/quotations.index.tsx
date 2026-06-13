import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n, fmtMoney } from "@/lib/i18n";
import { useStore, docTotals, type Quotation } from "@/lib/store";
import { QuotationService } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { Plus, Eye, Pencil, Printer, Send, FileCheck, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { QuotationPrint } from "@/components/DocumentPrint";
import { useAuth } from "@/lib/auth";
import { PermissionGate } from "@/components/PermissionGate";
import { useAudit } from "@/hooks/useAudit";

export const Route = createFileRoute("/quotations/")({
  head: () => ({ meta: [{ title: "Quotations — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perm="quotations.view" mode="page">
      <QuotationsListPage />
    </PermissionGate>
  ),
});

function QuotationsListPage() {
  const { t, lang } = useI18n();
  const { can } = useAuth();
  const list = useStore((s) => s.quotations);
  const customers = useStore((s) => s.customers);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [q, setQ] = useState("");
  const [viewing, setViewing] = useState<Quotation | null>(null);
  const canManage = can("quotations.manage");

  const filtered = list.filter((x) =>
    (statusFilter === "all" || x.status === statusFilter) &&
    [x.number, customers.find((c) => c.id === x.customer_id)?.name_ar, customers.find((c) => c.id === x.customer_id)?.name_en]
      .filter(Boolean).some((v) => v!.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <AppShell
      title={t("quotations")}
      action={
        canManage ? (
          <Button asChild>
            <Link to="/quotations/new">
              <Plus className="size-4 me-1" />
              {t("new_quotation")}
            </Link>
          </Button>
        ) : null
      }
    >
      <div className="card-elevated">
        <div className="p-4 border-b flex flex-col md:flex-row gap-3">
          <Input placeholder={t("search")} value={q} onChange={(e) => setQ(e.target.value)} className="md:max-w-sm" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="md:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("all")}</SelectItem>
              {["draft", "sent", "accepted", "rejected", "converted"].map((s) => <SelectItem key={s} value={s}>{t(s)}</SelectItem>)}
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
                  <th className="px-4 py-3 text-start font-medium">{t("expiry_date")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("total")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("status")}</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((x) => {
                  const cust = customers.find((c) => c.id === x.customer_id);
                  const totals = docTotals(x.lines, x.discount);
                  return (
                    <tr key={x.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono font-medium">{x.number}</td>
                      <td className="px-4 py-3">{cust ? (lang === "ar" ? cust.name_ar : cust.name_en) : "—"}</td>
                      <td className="px-4 py-3">{x.date}</td>
                      <td className="px-4 py-3">{x.expiry}</td>
                      <td className="px-4 py-3 text-end font-mono">{fmtMoney(totals.total, lang)}</td>
                      <td className="px-4 py-3"><StatusBadge status={x.status} /></td>
                      <td className="px-4 py-3 text-end whitespace-nowrap">
                        <Button size="sm" variant="ghost" onClick={() => setViewing(x)}><Eye className="size-4" /></Button>
                        {canManage && (
                          <Button asChild size="sm" variant="ghost">
                            <Link to="/quotations/$id/edit" params={{ id: x.id }}><Pencil className="size-4" /></Link>
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

      <Dialog open={!!viewing} onOpenChange={(v) => !v && setViewing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {viewing && <QuotationView q={viewing} onClose={() => setViewing(null)} />}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function QuotationView({ q, onClose }: { q: Quotation; onClose: () => void }) {
  const { t } = useI18n();
  const { can } = useAuth();
  const audit = useAudit();
  const canManage = can("quotations.manage");
  const canInvoice = can("invoices.create");

  const setStatus = (status: Quotation["status"]) => {
    QuotationService.setStatus(q.id, status);
    audit.log(`quotation.${status}`, "quotation", `تحديث حالة العرض ${q.number} إلى ${status}`, `Quotation ${q.number} → ${status}`, q.id);
    toast.success(t(status));
  };

  const convertToInvoice = () => {
    const inv = QuotationService.convertToInvoice(q);
    audit.log("quotation.converted", "quotation", `تحويل العرض ${q.number} إلى فاتورة ${inv.number}`, `Converted quotation ${q.number} → invoice ${inv.number}`, q.id);
    audit.log("invoice.created", "sales_invoice", `إنشاء فاتورة ${inv.number} من عرض`, `Created invoice ${inv.number} from quotation`, inv.id);
    toast.success(`${t("convert_to_invoice")}: ${inv.number}`);
    onClose();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-3">{q.number} <StatusBadge status={q.status} /></DialogTitle>
      </DialogHeader>
      <div className="flex flex-wrap gap-2 mb-4">
        {canManage && q.status === "draft" && <Button size="sm" variant="outline" onClick={() => setStatus("sent")}><Send className="size-4 me-1" />{t("send_to_customer")}</Button>}
        {canManage && q.status === "sent" && <Button size="sm" variant="outline" onClick={() => setStatus("accepted")}><FileCheck className="size-4 me-1" />{t("accepted")}</Button>}
        {canInvoice && q.status === "accepted" && <Button size="sm" onClick={convertToInvoice}><ArrowRight className="size-4 me-1" />{t("convert_to_invoice")}</Button>}
        <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="size-4 me-1" />{t("print")}</Button>
      </div>
      <QuotationPrint q={q} />
    </>
  );
}
