import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n, fmtMoney } from "@/lib/i18n";
import { useStore, newId, nextNumber, type Receipt } from "@/lib/store";
import { ReceiptService } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/EmptyState";
import { ReceiptPrint } from "@/components/DocumentPrint";
import { Plus, Eye, Printer, Download, Send } from "lucide-react";
import { SmartCustomerSelect, SmartInvoiceSelect } from "@/components/smart-select";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { PermissionGate } from "@/components/PermissionGate";
import { useAudit } from "@/hooks/useAudit";

export const Route = createFileRoute("/receipts")({
  head: () => ({ meta: [{ title: "Receipt Vouchers — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perm="receipts.view" mode="page">
      <ReceiptsPage />
    </PermissionGate>
  ),
});

function ReceiptsPage() {
  const { t, lang } = useI18n();
  const { can } = useAuth();
  const list = useStore((s) => s.receipts);
  const customers = useStore((s) => s.customers);
  const [open, setOpen] = useState(false);
  const [viewing, setViewing] = useState<Receipt | null>(null);
  const [q, setQ] = useState("");
  const canManage = can("receipts.manage");

  const filtered = list.filter((r) => {
    const c = customers.find((x) => x.id === r.customer_id);
    return [r.number, c?.name_ar, c?.name_en, r.bank_ref].filter(Boolean).some((v) => v!.toLowerCase().includes(q.toLowerCase()));
  });

  return (
    <AppShell title={t("receipts")} action={canManage ? <Button onClick={() => setOpen(true)}><Plus className="size-4 me-1" />{t("new")}</Button> : null}>
      <div className="card-elevated">
        <div className="p-4 border-b">
          <Input placeholder={t("search")} value={q} onChange={(e) => setQ(e.target.value)} className="md:max-w-sm" />
        </div>
        {filtered.length === 0 ? <EmptyState /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">{t("number")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("date")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("customer")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("related_invoice")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("payment_method")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("amount")}</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((r) => {
                  const c = customers.find((c) => c.id === r.customer_id);
                  return (
                    <tr key={r.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono font-medium">{r.number}</td>
                      <td className="px-4 py-3">{r.date}</td>
                      <td className="px-4 py-3">{c ? (lang === "ar" ? c.name_ar : c.name_en) : "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.invoice_id || "—"}</td>
                      <td className="px-4 py-3">{t(r.method)}</td>
                      <td className="px-4 py-3 text-end font-mono text-success">{fmtMoney(r.amount, lang)}</td>
                      <td className="px-4 py-3 text-end">
                        <Button size="sm" variant="ghost" onClick={() => setViewing(r)}><Eye className="size-4" /></Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {canManage && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-xl">
            {open && <ReceiptForm onDone={() => setOpen(false)} />}
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={!!viewing} onOpenChange={(v) => !v && setViewing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {viewing && (
            <>
              <DialogHeader><DialogTitle>{viewing.number}</DialogTitle></DialogHeader>
              <div className="flex flex-wrap gap-2 mb-4">
                <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="size-4 me-1" />{t("print")}</Button>
                <Button size="sm" variant="outline" disabled><Download className="size-4 me-1" />{t("download_pdf")}</Button>
                <Button size="sm" variant="outline" disabled><Send className="size-4 me-1" />{t("send_to_customer")}</Button>
              </div>
              <ReceiptPrint r={viewing} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function ReceiptForm({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const audit = useAudit();
  const customers = useStore((s) => s.customers);
  const receipts = useStore((s) => s.receipts);
  const [form, setForm] = useState<Receipt>({
    id: newId(), number: nextNumber("RV", receipts),
    customer_id: customers[0]?.id || "", date: new Date().toISOString().slice(0, 10),
    method: "bank_transfer", amount: 0,
  });

  const submit = () => {
    if (!form.customer_id) { toast.error(t("err_customer_required")); return; }
    if (!form.amount || form.amount <= 0) { toast.error(t("err_amount_positive")); return; }
    const result = ReceiptService.createWithAutoApply(form);
    const linkedInvoiceNumber = result.invoiceNumber;
    audit.log("receipt.created", "receipt_voucher",
      `إنشاء سند قبض ${form.number}${linkedInvoiceNumber ? ` لفاتورة ${linkedInvoiceNumber}` : ""}`,
      `Created receipt ${form.number}${linkedInvoiceNumber ? ` for invoice ${linkedInvoiceNumber}` : ""}`,
      form.id);
    if (linkedInvoiceNumber) audit.log("receipt.linked", "sales_invoice", `ربط ${form.number} بفاتورة ${linkedInvoiceNumber}`, `Linked ${form.number} to invoice ${linkedInvoiceNumber}`, form.invoice_id);
    if (result.fullyPaid) audit.log("invoice.fully_paid", "sales_invoice", `سداد كامل لفاتورة ${linkedInvoiceNumber}`, `Invoice ${linkedInvoiceNumber} fully paid`, form.invoice_id);
    if (result.journal) audit.log("journal.auto_posted", "journal_entry", `ترحيل تلقائي لسند قبض ${form.number}`, `Auto-posted journal for receipt ${form.number}`, result.journal.id);
    toast.success(t("saved")); onDone();
  };





  return (
    <>
      <DialogHeader><DialogTitle>{t("new")} — {t("receipts")}</DialogTitle></DialogHeader>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>{t("number")}</Label><Input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>{t("date")}</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
        <div className="col-span-2 space-y-1.5">
          <Label>{t("customer")}</Label>
          <SmartCustomerSelect
            value={form.customer_id}
            onChange={(id) => setForm({ ...form, customer_id: id || "", invoice_id: undefined })}
            allowClear={false}
          />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>{t("related_invoice")}</Label>
          <SmartInvoiceSelect
            value={form.invoice_id}
            customerId={form.customer_id}
            unpaidFirst
            onChange={(id) => setForm({ ...form, invoice_id: id })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t("payment_method")}</Label>
          <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v as Receipt["method"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["cash", "bank_transfer", "card", "other"].map((m) => <SelectItem key={m} value={m}>{t(m)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label>{t("amount")}</Label><Input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: +e.target.value })} /></div>
        <div className="col-span-2 space-y-1.5"><Label>{t("bank_ref")}</Label><Input value={form.bank_ref || ""} onChange={(e) => setForm({ ...form, bank_ref: e.target.value })} /></div>
        <div className="col-span-2 space-y-1.5"><Label>{t("notes")}</Label><Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onDone}>{t("cancel")}</Button>
        <Button onClick={submit}>{t("save")}</Button>
      </DialogFooter>
    </>
  );
}
