import { useState, useEffect } from "react";
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
import { useI18n } from "@/lib/i18n";
import { useStore, newId, type Quotation, type QuotationStatus } from "@/lib/store";
import { QuotationService, NumberingService, ValidationService } from "@/lib/services";
import { useAudit } from "@/hooks/useAudit";
import { toast } from "sonner";
import { Save, Send, FileCheck, ArrowRight, Printer, Eye } from "lucide-react";

export function QuotationEditor({ editing }: { editing: Quotation | null }) {
  const { t, lang } = useI18n();
  const router = useRouter();
  const audit = useAudit();
  const customers = useStore((s) => s.customers);

  const [form, setForm] = useState<Quotation>(
    editing || {
      id: newId(),
      number: NumberingService.next("quotation"),
      customer_id: customers[0]?.id || "",
      date: "",
      expiry: "",
      lines: [{ id: newId(), description: "", qty: 1, unit_price: 0, vat_rate: 15 }],
      discount: 0,
      status: "draft",
    },
  );

  useEffect(() => {
    if (!editing) {
      setForm((f) => f.date ? f : { ...f, date: new Date().toISOString().slice(0, 10), expiry: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10) });
    }
  }, [editing]);

  const save = (afterSave?: () => void) => {
    const v = ValidationService.quotation(form);
    if (!v.ok) { toast.error(lang === "ar" ? v.error!.ar : v.error!.en); return false; }
    if (editing) {
      QuotationService.update(form.id, form);
      audit.log("quotation.updated", "quotation", `تحديث عرض السعر ${form.number}`, `Updated quotation ${form.number}`, form.id);
    } else {
      QuotationService.create(form);
      audit.log("quotation.created", "quotation", `إنشاء عرض سعر ${form.number}`, `Created quotation ${form.number}`, form.id);
    }
    toast.success(t("saved"));
    if (afterSave) afterSave();
    else router.push("/quotations");
    return true;
  };

  const setStatus = (status: QuotationStatus) => {
    if (!editing) {
      toast.error(lang === "ar" ? "احفظ أولاً" : "Save first");
      return;
    }
    QuotationService.setStatus(form.id, status);
    setForm({ ...form, status });
    audit.log(`quotation.${status}`, "quotation", `تحديث حالة العرض ${form.number} إلى ${status}`, `Quotation ${form.number} → ${status}`, form.id);
    toast.success(t(status));
  };

  const convert = () => {
    if (!save(() => {})) return;
    const inv = QuotationService.convertToInvoice(form);
    audit.log("quotation.converted", "quotation", `تحويل العرض ${form.number} إلى فاتورة ${inv.number}`, `Converted quotation ${form.number} → invoice ${inv.number}`, form.id);
    audit.log("invoice.created", "sales_invoice", `إنشاء فاتورة ${inv.number} من عرض`, `Created invoice ${inv.number} from quotation`, inv.id);
    toast.success(`${t("convert_to_invoice")}: ${inv.number}`);
    router.push("/invoices/sales/" + inv.id + "/edit");
  };

  const actions = (
    <>
      {editing && form.status === "draft" && (
        <Button size="sm" variant="outline" onClick={() => setStatus("sent")}>
          <Send className="size-4 me-1" />{t("send_to_customer")}
        </Button>
      )}
      {editing && form.status === "sent" && (
        <Button size="sm" variant="outline" onClick={() => setStatus("accepted")}>
          <FileCheck className="size-4 me-1" />{t("accepted")}
        </Button>
      )}
      {editing && form.status === "accepted" && (
        <Button size="sm" variant="outline" onClick={convert}>
          <ArrowRight className="size-4 me-1" />{t("convert_to_invoice")}
        </Button>
      )}
      {editing && (
        <>
          <Button size="sm" variant="outline" asChild>
            <Link href="/quotations" onClick={() => setTimeout(() => window.print(), 200)}>
              <Eye className="size-4 me-1" />{t("preview")}
            </Link>
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer className="size-4 me-1" />{t("print")}
          </Button>
        </>
      )}
      <Button size="sm" variant="outline" onClick={() => save()}>
        <Save className="size-4 me-1" />{t("save_draft")}
      </Button>
      <Button size="sm" onClick={() => save()}>
        {editing ? t("save") : t("create")}
      </Button>
    </>
  );

  return (
    <DocumentEditorLayout
      title={editing ? `${t("edit_quotation")} — ${form.number}` : t("new_quotation")}
      backTo="/quotations"
      actions={actions}
    >
      <DocumentSection title={t("document_info")}>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>{t("number")}</Label>
            <Input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
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
              allowClear={false}
            />
          </div>
        </div>
      </DocumentSection>

      <DocumentSection title={t("dates")}>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>{t("date")}</Label>
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("expiry_date")}</Label>
            <Input type="date" value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })} />
          </div>
        </div>
      </DocumentSection>

      <DocumentSection title={t("line_items")}>
        <LineItemsEditor
          lines={form.lines}
          setLines={(l) => setForm({ ...form, lines: l })}
          discount={form.discount}
          setDiscount={(d) => setForm({ ...form, discount: d })}
        />
      </DocumentSection>

      <DocumentSection title={t("notes_terms")}>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>{t("notes")}</Label>
            <Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("terms")}</Label>
            <Textarea value={form.terms || ""} onChange={(e) => setForm({ ...form, terms: e.target.value })} rows={3} />
          </div>
        </div>
      </DocumentSection>
    </DocumentEditorLayout>
  );
}
