import { createFileRoute } from "@tanstack/react-router";
import { PermissionGate } from "@/components/PermissionGate";
import { ModuleFoundationPage } from "@/components/ModuleFoundationPage";
import { useI18n } from "@/lib/i18n";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/template-designer")({
  head: () => ({ meta: [{ title: "Template Designer — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perm="templates.view" mode="page">
      <TemplateDesignerPage />
    </PermissionGate>
  ),
});

function TemplateDesignerPage() {
  const { lang } = useI18n();
  const [color, setColor] = useState("#2563eb");
  return (
    <ModuleFoundationPage
      titleAr="تصميم قوالب الفواتير"
      titleEn="Invoice Template Designer"
      descAr="معاينة سريعة لقالب الفاتورة. تأسيسي — لا يوجد محرك قوالب كامل بعد."
      descEn="Quick invoice template preview. Foundation only — no full template engine yet."
      status="foundation"
      availableNow={[
        { ar: "معاينة لون أساسي للقالب", en: "Primary color preview" },
        { ar: "أماكن مخصصة للشعار والختم", en: "Logo & stamp placeholders" },
      ]}
      comingLater={[
        { ar: "محرر سحب وإفلات كامل", en: "Full drag-and-drop editor" },
        { ar: "قوالب متعددة لكل مؤسسة", en: "Multiple templates per tenant" },
        { ar: "حقول مخصصة في القالب", en: "Custom fields in templates" },
      ]}
    >
      <div className="card-elevated p-5 space-y-4">
        <div className="flex items-center gap-3">
          <label className="text-sm">{lang === "ar" ? "اللون الأساسي" : "Primary color"}</label>
          <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-20 h-9 p-1" />
        </div>
        <div className="rounded-md border p-6 bg-white text-black" dir="ltr">
          <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: `3px solid ${color}` }}>
            <div className="size-16 rounded bg-slate-100 flex items-center justify-center text-xs text-slate-500">LOGO</div>
            <div className="text-end">
              <div className="text-xl font-bold" style={{ color }}>INVOICE</div>
              <div className="text-xs text-slate-500">#INV-2026-00001</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs mb-3">
            <div><div className="text-slate-500">Customer</div><div>Sample Customer Ltd.</div></div>
            <div><div className="text-slate-500">Date</div><div>2026-06-13</div></div>
            <div><div className="text-slate-500">Due</div><div>2026-06-28</div></div>
          </div>
          <table className="w-full text-xs">
            <thead style={{ background: `${color}15`, color }}>
              <tr>
                <th className="text-start p-2">Description</th>
                <th className="text-end p-2">Qty</th>
                <th className="text-end p-2">Price</th>
                <th className="text-end p-2">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b"><td className="p-2">Consulting hours</td><td className="text-end p-2">10</td><td className="text-end p-2">200</td><td className="text-end p-2">2,000</td></tr>
              <tr className="border-b"><td className="p-2">Setup fee</td><td className="text-end p-2">1</td><td className="text-end p-2">500</td><td className="text-end p-2">500</td></tr>
            </tbody>
          </table>
          <div className="mt-3 flex justify-between items-end">
            <div className="size-20 border border-dashed border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400">STAMP</div>
            <div className="text-end text-xs space-y-1">
              <div>Subtotal: 2,500</div>
              <div>VAT 15%: 375</div>
              <div className="font-bold" style={{ color }}>Total: 2,875</div>
            </div>
          </div>
        </div>
      </div>
    </ModuleFoundationPage>
  );
}
