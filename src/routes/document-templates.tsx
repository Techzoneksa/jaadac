import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/lib/i18n";
import { PermissionGate } from "@/components/PermissionGate";
import { useStore } from "@/lib/store";
import type { DocumentTemplate, DocumentKind } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Plus, Copy, Archive, Eye, Star } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/document-templates")({
  head: () => ({ meta: [{ title: "Document Templates — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perm="templates.manage" mode="page">
      <DocumentTemplatesPage />
    </PermissionGate>
  ),
});

const KINDS: { key: DocumentKind; ar: string; en: string }[] = [
  { key: "quotation", ar: "عروض الأسعار", en: "Quotations" },
  { key: "invoice", ar: "فواتير المبيعات", en: "Sales Invoices" },
  { key: "receipt", ar: "سندات القبض", en: "Receipt Vouchers" },
  { key: "payment", ar: "سندات الصرف", en: "Payment Vouchers" },
];

function DocumentTemplatesPage() {
  const { t, lang } = useI18n();
  const templates = useStore((s) => s.document_templates);

  return (
    <AppShell
      title={t("document_templates")}
      action={
        <Button size="sm" disabled title={lang === "ar" ? "ديمو" : "Demo"}>
          <Plus className="size-4 me-1" />
          {t("create")}
        </Button>
      }
    >
      <Tabs defaultValue="quotation">
        <TabsList className="flex-wrap h-auto">
          {KINDS.map((k) => (
            <TabsTrigger key={k.key} value={k.key}>
              {lang === "ar" ? k.ar : k.en}
            </TabsTrigger>
          ))}
        </TabsList>
        {KINDS.map((k) => (
          <TabsContent key={k.key} value={k.key} className="mt-5">
            <TemplateList
              kind={k.key}
              templates={templates.filter((tpl) => tpl.doc_type === k.key)}
            />
          </TabsContent>
        ))}
      </Tabs>
    </AppShell>
  );
}

function TemplateList({ templates }: { kind: DocumentKind; templates: DocumentTemplate[] }) {
  const { lang } = useI18n();
  if (templates.length === 0) {
    return (
      <div className="card-elevated p-6 text-center text-sm text-muted-foreground">
        {lang === "ar" ? "لا توجد قوالب بعد" : "No templates yet"}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {templates.map((tpl) => (
        <div key={tpl.id} className="card-elevated p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-semibold">{lang === "ar" ? tpl.name_ar : tpl.name_en}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {tpl.language} · {tpl.font_size.toUpperCase()} · {tpl.header_layout}
              </div>
            </div>
            {tpl.is_default && (
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                <Star className="size-3" />
                {lang === "ar" ? "افتراضي" : "Default"}
              </span>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <ColorSwatch label="Accent" value={tpl.accent_color} />
            <ColorSwatch label="Text" value={tpl.text_color} />
            <ColorSwatch label="Header" value={tpl.table_header_color} />
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <Toggle k={lang === "ar" ? "شعار" : "Logo"} v={tpl.show_logo} />
            <Toggle k={lang === "ar" ? "ختم" : "Stamp"} v={tpl.show_stamp} />
            <Toggle k={lang === "ar" ? "توقيع" : "Signature"} v={tpl.show_signature} />
            <Toggle k={lang === "ar" ? "رقم ضريبي" : "VAT #"} v={tpl.show_vat_number} />
            <Toggle k={lang === "ar" ? "QR" : "QR"} v={tpl.show_qr} />
            <Toggle k={lang === "ar" ? "تفاصيل دفع" : "Payment details"} v={tpl.show_payment_details} />
            <Toggle k={lang === "ar" ? "خصم" : "Discount col"} v={tpl.show_discount_column} />
            <Toggle k={lang === "ar" ? "ضريبة" : "Tax col"} v={tpl.show_tax_column} />
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" variant="outline" onClick={() => toast.info(lang === "ar" ? "معاينة (ديمو)" : "Preview (demo)")}>
              <Eye className="size-3.5 me-1" />
              {lang === "ar" ? "معاينة" : "Preview"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => toast.info(lang === "ar" ? "تكرار (ديمو)" : "Duplicate (demo)")}>
              <Copy className="size-3.5 me-1" />
              {lang === "ar" ? "تكرار" : "Duplicate"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => toast.info(lang === "ar" ? "أرشفة (ديمو)" : "Archive (demo)")}>
              <Archive className="size-3.5 me-1" />
              {lang === "ar" ? "أرشفة" : "Archive"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ColorSwatch({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px]">
      <span className="size-4 rounded border" style={{ background: value }} />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

function Toggle({ k, v }: { k: string; v: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span>{k}</span>
      <span className={v ? "text-success" : "text-muted-foreground"}>{v ? "✓" : "—"}</span>
    </div>
  );
}
