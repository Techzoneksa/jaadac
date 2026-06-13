import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n, fmtMoney } from "@/lib/i18n";
import { useStore, newId, nextNumber, type Payment } from "@/lib/store";
import { PaymentService } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/EmptyState";
import { PaymentPrint } from "@/components/DocumentPrint";
import { Plus, Paperclip, Eye, Printer, Download, Send } from "lucide-react";
import { SmartSupplierSelect } from "@/components/smart-select";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { PermissionGate } from "@/components/PermissionGate";
import { useAudit } from "@/hooks/useAudit";

export const Route = createFileRoute("/payments")({
  head: () => ({ meta: [{ title: "Payment Vouchers — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perm="payments.view" mode="page">
      <PaymentsPage />
    </PermissionGate>
  ),
});

function PaymentsPage() {
  const { t, lang } = useI18n();
  const { can } = useAuth();
  const list = useStore((s) => s.payments);
  const suppliers = useStore((s) => s.suppliers);
  const [open, setOpen] = useState(false);
  const [viewing, setViewing] = useState<Payment | null>(null);
  const [q, setQ] = useState("");
  const canManage = can("payments.manage");

  const filtered = list.filter((p) => {
    const sup = suppliers.find((s) => s.id === p.supplier_id);
    return [p.number, p.payee, p.category, sup?.name_ar, sup?.name_en].filter(Boolean)
      .some((v) => v!.toLowerCase().includes(q.toLowerCase()));
  });

  return (
    <AppShell title={t("payments")} action={canManage ? <Button onClick={() => setOpen(true)}><Plus className="size-4 me-1" />{t("new")}</Button> : null}>
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
                  <th className="px-4 py-3 text-start font-medium">{t("payee")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("category")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("payment_method")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("amount")}</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((p) => {
                  const sup = suppliers.find((s) => s.id === p.supplier_id);
                  return (
                    <tr key={p.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono font-medium">{p.number}</td>
                      <td className="px-4 py-3">{p.date}</td>
                      <td className="px-4 py-3">{sup ? (lang === "ar" ? sup.name_ar : sup.name_en) : (p.payee || "—")}</td>
                      <td className="px-4 py-3">{p.category}</td>
                      <td className="px-4 py-3">{t(p.method)}</td>
                      <td className="px-4 py-3 text-end font-mono text-destructive">{fmtMoney(p.amount, lang)}</td>
                      <td className="px-4 py-3 text-end">
                        <Button size="sm" variant="ghost" onClick={() => setViewing(p)}><Eye className="size-4" /></Button>
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
            {open && <PaymentForm onDone={() => setOpen(false)} />}
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
                <Button size="sm" variant="outline" disabled><Send className="size-4 me-1" />{t("send_to_supplier")}</Button>
              </div>
              <PaymentPrint p={viewing} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function PaymentForm({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const audit = useAudit();
  const suppliers = useStore((s) => s.suppliers);
  const payments = useStore((s) => s.payments);
  const [form, setForm] = useState<Payment>({
    id: newId(), number: nextNumber("PV", payments),
    supplier_id: suppliers[0]?.id, date: new Date().toISOString().slice(0, 10),
    category: "المشتريات", method: "bank_transfer", amount: 0,
  });

  const submit = () => {
    if (!form.amount || form.amount <= 0) { toast.error(t("err_amount_positive")); return; }
    if (!form.supplier_id && !form.payee) { toast.error(t("err_supplier_required")); return; }
    const result = PaymentService.createWithPosting(form);
    audit.log("payment.created", "payment_voucher", `إنشاء سند صرف ${form.number}`, `Created payment ${form.number}`, form.id);
    if (result.journal) audit.log("journal.auto_posted", "journal_entry", `ترحيل تلقائي لسند صرف ${form.number}`, `Auto-posted journal for payment ${form.number}`, result.journal.id);
    toast.success(t("saved")); onDone();
  };

  return (
    <>
      <DialogHeader><DialogTitle>{t("new")} — {t("payments")}</DialogTitle></DialogHeader>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>{t("number")}</Label><Input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>{t("date")}</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
        <div className="col-span-2 space-y-1.5">
          <Label>{t("supplier")} / {t("payee")}</Label>
          <SmartSupplierSelect
            value={form.supplier_id}
            onChange={(id) => setForm({ ...form, supplier_id: id })}
          />
        </div>
        {!form.supplier_id && (
          <div className="col-span-2 space-y-1.5"><Label>{t("payee")}</Label><Input value={form.payee || ""} onChange={(e) => setForm({ ...form, payee: e.target.value })} /></div>
        )}
        <div className="space-y-1.5"><Label>{t("category")}</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
        <div className="space-y-1.5">
          <Label>{t("payment_method")}</Label>
          <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v as Payment["method"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["cash", "bank_transfer", "card", "other"].map((m) => <SelectItem key={m} value={m}>{t(m)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label>{t("amount")}</Label><Input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: +e.target.value })} /></div>
        <div className="space-y-1.5"><Label>{t("vat_amount")}</Label><Input type="number" min="0" step="0.01" value={form.vat_amount || 0} onChange={(e) => setForm({ ...form, vat_amount: +e.target.value })} /></div>
        <div className="col-span-2 space-y-1.5"><Label>{t("notes")}</Label><Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        <div className="col-span-2">
          <Button variant="outline" size="sm" disabled><Paperclip className="size-4 me-1" />{t("attachment")}</Button>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onDone}>{t("cancel")}</Button>
        <Button onClick={submit}>{t("save")}</Button>
      </DialogFooter>
    </>
  );
}
