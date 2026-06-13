import { createFileRoute } from "@tanstack/react-router";
import { PermissionGate } from "@/components/PermissionGate";
import { ModuleFoundationPage } from "@/components/ModuleFoundationPage";
import { useI18n } from "@/lib/i18n";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/data-migration")({
  head: () => ({ meta: [{ title: "Data Migration — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perm="data_migration.view" mode="page">
      <DataMigrationPage />
    </PermissionGate>
  ),
});

function DataMigrationPage() {
  const { lang } = useI18n();
  const cards = [
    { ar: "استيراد العملاء (CSV)", en: "Import customers (CSV)" },
    { ar: "استيراد الموردين (CSV)", en: "Import suppliers (CSV)" },
    { ar: "استيراد المنتجات والخدمات (CSV)", en: "Import products & services (CSV)" },
    { ar: "استيراد الفواتير (لاحقًا)", en: "Import invoices (later)" },
    { ar: "نقل من تطبيقات أخرى", en: "Import from other apps" },
  ];
  return (
    <ModuleFoundationPage
      titleAr="نقل البيانات"
      titleEn="Data Migration"
      descAr="استيراد البيانات من ملفات CSV أو من تطبيقات محاسبة أخرى. تأسيسي — لا يتم تنفيذ استيراد حقيقي حاليًا."
      descEn="Import data from CSV files or other accounting apps. Foundation only — no real import is executed yet."
      status="foundation"
      availableNow={[
        { ar: "قائمة بطاقات الاستيراد المخطط لها", en: "Planned import card list" },
      ]}
      comingLater={[
        { ar: "محلل CSV آمن مع معاينة قبل الاستيراد", en: "Safe CSV parser with pre-import preview" },
        { ar: "خرائط حقول قابلة للتعديل", en: "Editable field mappings" },
        { ar: "تنفيذ الاستيراد عبر الباكند", en: "Backend-executed imports" },
      ]}
    >
      <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 flex items-start gap-2 text-sm">
        <AlertTriangle className="size-4 mt-0.5 text-amber-600 shrink-0" />
        <span>{lang === "ar" ? "تنبيه: العرض تجريبي / مخطط. لا يتم تنفيذ استيراد فعلي." : "Notice: demo-only / planned. No real import is executed."}</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2 mt-4">
        {cards.map((c, i) => (
          <div key={i} className="card-elevated p-4 text-sm flex items-center justify-between">
            <span>{lang === "ar" ? c.ar : c.en}</span>
            <span className="text-xs text-muted-foreground">{lang === "ar" ? "قريبًا" : "Coming soon"}</span>
          </div>
        ))}
      </div>
    </ModuleFoundationPage>
  );
}
