import { createFileRoute } from "@tanstack/react-router";
import { PermissionGate } from "@/components/PermissionGate";
import { ModuleFoundationPage } from "@/components/ModuleFoundationPage";

export const Route = createFileRoute("/bank-reconciliation")({
  head: () => ({ meta: [{ title: "Bank Reconciliation — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perm="accounting.view" mode="page">
      <ModuleFoundationPage
        titleAr="التسويات البنكية"
        titleEn="Bank Reconciliation"
        descAr="مطابقة كشوفات البنك مع القيود المحاسبية. التسوية اليدوية والمؤتمتة قيد التخطيط."
        descEn="Reconcile bank statements with accounting entries. Manual and automated reconciliation are planned."
        status="planned"
        availableNow={[
          { ar: "خانة في خريطة الوحدات", en: "Slot in the module map" },
        ]}
        comingLater={[
          { ar: "استيراد كشف حساب CSV/OFX", en: "Import statements (CSV/OFX)" },
          { ar: "مطابقة يدوية للحركات", en: "Manual transaction matching" },
          { ar: "مطابقة مؤتمتة بقواعد ذكية", en: "Automated rule-based matching" },
          { ar: "تكامل مع موجزات البنوك", en: "Bank feed integrations" },
        ]}
      />
    </PermissionGate>
  ),
});
