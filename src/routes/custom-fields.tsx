import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/lib/i18n";
import { PermissionGate } from "@/components/PermissionGate";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/custom-fields")({
  head: () => ({ meta: [{ title: "Custom Fields — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perm="custom_fields.manage" mode="page">
      <CustomFieldsPage />
    </PermissionGate>
  ),
});

function CustomFieldsPage() {
  const { t, lang } = useI18n();
  const fields = useStore((s) => s.custom_fields);

  return (
    <AppShell
      title={t("custom_fields")}
      action={
        <Button size="sm" onClick={() => toast.info(lang === "ar" ? "إضافة حقل (ديمو)" : "Add field (demo)")}>
          <Plus className="size-4 me-1" />{t("create")}
        </Button>
      }
    >
      <div className="card-elevated overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-start font-medium">{lang === "ar" ? "التسمية (عربي)" : "Label (AR)"}</th>
              <th className="px-4 py-3 text-start font-medium">{lang === "ar" ? "التسمية (إنجليزي)" : "Label (EN)"}</th>
              <th className="px-4 py-3 text-start font-medium">{lang === "ar" ? "المفتاح" : "Key"}</th>
              <th className="px-4 py-3 text-start font-medium">{lang === "ar" ? "النوع" : "Type"}</th>
              <th className="px-4 py-3 text-start font-medium">{lang === "ar" ? "النطاق" : "Applies to"}</th>
              <th className="px-4 py-3 text-center font-medium">{lang === "ar" ? "إلزامي" : "Required"}</th>
              <th className="px-4 py-3 text-center font-medium">{lang === "ar" ? "للطباعة" : "Printable"}</th>
              <th className="px-4 py-3 text-start font-medium">{t("status")}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {fields.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-6 text-center text-muted-foreground">{t("empty")}</td></tr>
            )}
            {fields.map((f) => (
              <tr key={f.id}>
                <td className="px-4 py-2">{f.label_ar}</td>
                <td className="px-4 py-2">{f.label_en}</td>
                <td className="px-4 py-2 font-mono text-xs">{f.field_key}</td>
                <td className="px-4 py-2">{f.type}</td>
                <td className="px-4 py-2">{f.applies_to}</td>
                <td className="px-4 py-2 text-center">{f.required ? "✓" : "—"}</td>
                <td className="px-4 py-2 text-center">{f.printable ? "✓" : "—"}</td>
                <td className="px-4 py-2">{t(f.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        {lang === "ar"
          ? "الحقول المخصصة أساس فقط؛ لا تظهر بعد في نماذج إنشاء المستندات الفعلية."
          : "Foundation only — fields are not yet wired into document forms."}
      </p>
    </AppShell>
  );
}
