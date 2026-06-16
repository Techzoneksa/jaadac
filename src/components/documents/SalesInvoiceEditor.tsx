import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DocumentEditorLayout, DocumentSection } from "@/components/documents/DocumentEditorLayout";
import { LineItemsEditor } from "@/components/LineItemsEditor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SmartCustomerSelect } from "@/components/smart-select";
import { StatusBadge } from "@/components/StatusBadge";
import { useI18n, fmtMoney } from "@/lib/i18n";
import { useStore, newId, docTotals, type Invoice, type InvoiceStatus } from "@/lib/store";
import { InvoiceService, NumberingService, ValidationService } from "@/lib/services";
import { useAudit } from "@/hooks/useAudit";
import { toast } from "sonner";
import { Save, Send, Stamp, Printer, ArrowDownCircle } from "lucide-react";

export function SalesInvoiceEditor({ editing }: { editing: Invoice | null }) {
  const { t, lang } = useI18n();
  const router = useRouter();
  const audit = useAudit();
  const customers = useStore((s) => s.customers);

  const [form, setForm] = useState<Invoice>(
    editing || {
      id: newId(),
      number: NumberingService.next("invoice"),
      customer_id: customers[0]?.id || "",
      date: new Date().toISOString().slice(0, 10),
      due: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      lines: [{ id: newId(), description: "", qty: 1, unit_price: 0, vat_rate: 15 }],
      discount: 0,
      status: "draft",
      paid: 0,
    },
  );

  const locked = !!editing && (editing.status === "official" || editing.status === "fully_paid" || editing.status === "partially_paid");
  const totals = docTotals(form.lines, form.discount);
  const remaining = totals.total - form.paid;

  const save = () => {
    if (locked) { toast.error(t("err_locked")); return false; }
    const v = ValidationService.invoice(form, editing ?? undefined);
    if (!v.ok) { toast.error(lang === "ar" ? v.error!.ar : v.error!.en); return false; }
    if (editing) {
      InvoiceService.update(form.id, form);
      audit.log("invoice.updated", "sales_invoice", `تحديث الفاتورة ${form.number}`, `Updated invoice ${form.number}`, form.id);
    } else {
      InvoiceService.create(form);
      audit.log("invoice.created", "sales_invoice", `إنشاء فاتورة ${form.number}`, `Created invoice ${form.number}`, form.id);
    }
    toast.success(t("saved"));
    router.push("/invoices/sales");
    return true;
  };

  const issue = () => {
    if (!editing) { toast.error(lang === "ar" ? "احفظ أولاً" : "Save first"); return; }
    const je = InvoiceService.issue(form);
    audit.log("invoice.issue", "sales_invoice", `اعتماد الفاتورة ${form.number}`, `Issued invoice ${form.number}`, form.id);
    setForm({ ...form, status: "official" });
    if (je) {
      toast.success(`${je.number} ${t("posted")}`);
      audit.log("journal.auto_posted", "journal_entry", `ترحيل تلقائي ${je.number} عن فاتورة ${form.number}`, `Auto-posted ${je.number} for invoice ${form.number}`, je.id);
    } else toast.success(t("official"));
  };

  const sendToCustomer = () => {
    if (!editing) { toast.error(lang === "ar" ? "احفظ أولاً" : "Save first"); return; }
    InvoiceService.send(form.id);
    setForm({ ...form, status: "sent" });
    audit.log("invoice.sent", "sales_invoice", `إرسال الفاتورة ${form.number}`, `Sent invoice ${form.number}`, form.id);
    toast.success(t("sent"));
  };

  const actions = (
    <>
      {editing && form.status === "draft" && (
        <Button size="sm" variant="outline" onClick={sendToCustomer}>
          <Send className="size-4 me-1" />{t("send_to_customer")}
        </Button>
      )}
      {editing && (form.status === "draft" || form.status === "sent") && (
        <Button size="sm" variant="outline" onClick={issue}>
          <Stamp className="size-4 me-1" />{t("issue")}
        </Button>
      )}
      {editing && (form.status === "official" || form.status === "partially_paid") && (
        <Button size="sm" variant="outline" asChild>
          <Link href="/receipts"><ArrowDownCircle className="size-4 me-1" />{t("record_payment")}</Link>
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
      title={editing ? `${t("edit_sales_invoice")} — ${form.number}` : t("new_sales_invoice")}
      backTo="/invoices/sales"
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
              <StatusBadge status={form.status} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{t("customer")}</Label>
            <SmartCustomerSelect
              value={form.customer_id}
              onChange={(id) => setForm({ ...form, customer_id: id || "" })}
              disabled={locked}
              allowClear={false}
            />
          </div>
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
        <fieldset disabled={locked} className="contents">
          <LineItemsEditor
            lines={form.lines}
            setLines={(l) => setForm({ ...form, lines: l })}
            discount={form.discount}
            setDiscount={(d) => setForm({ ...form, discount: d })}
          />
        </fieldset>
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
            <Label>{t("terms")}</Label>
            <Textarea value={form.terms || ""} onChange={(e) => setForm({ ...form, terms: e.target.value })} rows={3} disabled={locked} />
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
