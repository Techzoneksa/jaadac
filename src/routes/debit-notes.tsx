import { createFileRoute } from "@tanstack/react-router";
import { PermissionGate } from "@/components/PermissionGate";
import { ModuleFoundationPage } from "@/components/ModuleFoundationPage";

export const Route = createFileRoute("/debit-notes")({
  head: () => ({ meta: [{ title: "Debit Notes — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perm="debit_notes.view" mode="page">
      <ModuleFoundationPage
        titleAr="الإشعارات المدينة"
        titleEn="Debit Notes"
        descAr="إشعارات مدينة لتعديل فواتير المشتريات. تأسيسية فقط — لا توجد قيود محاسبية أو تأثير ضريبي في هذه المرحلة."
        descEn="Debit notes to adjust purchase invoices. Foundation only — no accounting entries or tax effects are posted at this stage."
        status="foundation"
        availableNow={[
          { ar: "هيكل صلاحيات (عرض/إدارة)", en: "Permission scaffold (view/manage)" },
        ]}
        comingLater={[
          { ar: "ربط إشعار مدين بفاتورة شراء", en: "Link debit note to purchase invoice" },
          { ar: "قيود محاسبية عكسية", en: "Automated reversal entries" },
          { ar: "تأثير على ضريبة المدخلات", en: "Input-VAT impact" },
        ]}
      />
    </PermissionGate>
  ),
});
