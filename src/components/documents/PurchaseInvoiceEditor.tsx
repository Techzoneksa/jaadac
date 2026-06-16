import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DocumentEditorLayout, DocumentSection } from "@/components/documents/DocumentEditorLayout";
import { PurchaseLineItemsEditor } from "@/components/documents/PurchaseLineItemsEditor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SmartSupplierSelect } from "@/components/smart-select";
import { StatusBadge } from "@/components/StatusBadge";
import { useI18n, fmtMoney } from "@/lib/i18n";
import { useStore, newId, purchaseDocTotals, type PurchaseInvoice, type PurchaseInvoiceStatus } from "@/lib/store";
import { PurchaseInvoiceService } from "@/lib/services";
import { useAudit } from "@/hooks/useAudit";
import { toast } from "sonner";
import { Save, FileCheck, ArrowUpCircle, Printer } from "lucide-react";

export function PurchaseInvoiceEditor({ editing }: { editing: PurchaseInvoice | null }) {
  const { t, lang } = useI18n();
  const router = useRouter();
  const audit = useAudit();
  const suppliers = useStore((s) => s.suppliers);

  const [form, setForm] = useState<PurchaseInvoice>(
    editing || {
      id: newId(),
      number: PurchaseInvoiceService.nextNumber(),
      supplier_id: suppliers[0]?.id || "",
      date: new Date().toISOString().slice(0, 10),
      due: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      lines: [{ id: newId(), description: "", qty: 1, unit_cost: 0, vat_rate: 15 }],
      status: "draft",
      paid: 0,
    },
  );

  const locked =
    !!editing &&
    (editing.status === "approved" ||
      editing.status === "partially_paid" ||
      editing.status === "paid");
  const totals = purchaseDocTotals(form.lines);
  const remaining = totals.total - form.paid;

  const save = () => {
    if (locked) { toast.error(t("err_locked")); return false; }
    const v = PurchaseInvoiceService.validate(form, editing ?? undefined);
    if (!v.ok) { toast.error(lang === "ar" ? v.error!.ar : v.error!.en); return false; }
    if (editing) {
      PurchaseInvoiceService.update(form.id, form);
      audit.log("purchase_invoice.updated", "purchase_invoice", `تحديث فاتورة مشتريات ${form.number}`, `Updated purchase invoice ${form.number}`, form.id);
    } else {
      PurchaseInvoiceService.create(form);
      audit.log("purchase_invoice.created", "purchase_invoice", `إنشاء فاتورة مشتريات ${form.number}`, `Created purchase invoice ${form.number}`, form.id);
    }
    toast.success(t("saved"));
    router.push("/invoices/purchases");
    return true;
  };

  const approve = () => {
    if (!editing) { toast.error(lang === "ar" ? "احفظ أولاً" : "Save first"); return; }
    PurchaseInvoiceService.approve(form.id);
    setForm({ ...form, status: "approved" });
    audit.log("purchase_invoice.approved", "purchase_invoice", `اعتماد فاتورة مشتريات ${form.number}`, `Approved purchase invoice ${form.number}`, form.id);
    toast.success(t("approved"));
  };

  const recordPayment = () => {
    const amountStr = window.prompt(lang === "ar" ? `المبلغ (المتبقي ${remaining.toFixed(2)})` : `Amount (remaining ${remaining.toFixed(2)})`);
    const amount = Number(amountStr);
    if (!amount || amount <= 0) return;
    PurchaseInvoiceService.recordPayment(form.id, amount);
    const updated = PurchaseInvoiceService.getById(form.id);
    if (updated) setForm(updated);
    audit.log("purchase_invoice.payment", "purchase_invoice", `دفعة لفاتورة المشتريات ${form.number}`, `Payment recorded for purchase invoice ${form.number}`, form.id);
    toast.success(t("saved"));
  };

  const actions = (
    <>
      {editing && form.status === "draft" && (
        <Button size="sm" variant="outline" onClick={approve}>
          <FileCheck className="size-4 me-1" />{t("approve")}
        </Button>
      )}
      {editing && (form.status === "approved" || form.status === "partially_paid") && (
        <Button size="sm" variant="outline" onClick={recordPayment}>
          <ArrowUpCircle className="size-4 me-1" />{t("record_payment")}
        </Button>
      )}
      {editing && (
        <Button size="sm" variant="outline" onClick={() => window.print()}>
          <Printer className="size-4 me-1" />{t("print")}
        </Button>
      )}
      {!locked && (
        <>
          <Button size="sm" variant="outline" onClick={save}>
            <Save className="size-4 me-1" />{t("save_draft")}
          </Button>
          <Button size="sm" onClick={save}>{editing ? t("save") : t("create")}</Button>
        </>
      )}
    </>
  );

  return (
    <DocumentEditorLayout
      title={editing ? `${t("edit_purchase_invoice")} — ${form.number}` : t("new_purchase_invoice")}
      backTo="/invoices/purchases"
      actions={actions}
    >
      <DocumentSection title={t("document_info")}>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>{t("number")}</Label>
            <Input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} disabled={locked} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("status")}</Label>
            <div className="flex items-center h-9 px-3 rounded-md border bg-muted/30">
              <StatusBadge status={form.status as PurchaseInvoiceStatus} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{t("supplier_invoice_ref")}</Label>
            <Input value={form.supplier_ref || ""} onChange={(e) => setForm({ ...form, supplier_ref: e.target.value })} disabled={locked} />
          </div>
        </div>
      </DocumentSection>

      <DocumentSection title={t("party_info")}>
        <div className="space-y-1.5">
          <Label>{t("supplier")}</Label>
          <SmartSupplierSelect
            value={form.supplier_id}
            onChange={(id) => setForm({ ...form, supplier_id: id || "" })}
            disabled={locked}
            allowClear={false}
          />
        </div>
      </DocumentSection>

      <DocumentSection title={t("dates")}>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>{t("date")}</Label>
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} disabled={locked} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("due_date")}</Label>
            <Input type="date" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} disabled={locked} />
          </div>
        </div>
      </DocumentSection>

      <DocumentSection title={t("line_items")}>
        <PurchaseLineItemsEditor
          lines={form.lines}
          setLines={(l) => setForm({ ...form, lines: l })}
          disabled={locked}
        />
      </DocumentSection>

      {editing && (
        <DocumentSection title={t("totals_summary")}>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <Stat label={t("total")} value={fmtMoney(totals.total, lang)} />
            <Stat label={t("paid")} value={fmtMoney(form.paid, lang)} className="text-success" />
            <Stat label={t("remaining")} value={fmtMoney(remaining, lang)} />
          </div>
        </DocumentSection>
      )}

      <DocumentSection title={t("notes_terms")}>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>{t("notes")}</Label>
            <Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} disabled={locked} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("attachment")}</Label>
            <div className="h-[88px] flex items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
              {t("attachments_placeholder")}
            </div>
          </div>
        </div>
      </DocumentSection>
    </DocumentEditorLayout>
  );
}

function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="card-elevated p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-xl font-mono font-semibold mt-1 ${className ?? ""}`}>{value}</div>
    </div>
  );
}
