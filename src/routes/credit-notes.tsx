import { createFileRoute } from "@tanstack/react-router";
import { PermissionGate } from "@/components/PermissionGate";
import { ModuleFoundationPage } from "@/components/ModuleFoundationPage";

export const Route = createFileRoute("/credit-notes")({
  head: () => ({ meta: [{ title: "Credit Notes — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perm="credit_notes.view" mode="page">
      <ModuleFoundationPage
        titleAr="الإشعارات الدائنة"
        titleEn="Credit Notes"
        descAr="إشعارات دائنة لتعديل فواتير المبيعات (مرتجعات، تخفيضات). تأسيسية فقط — لا يتم إصدار قيود محاسبية أو إقرارات ضريبية في هذه المرحلة."
        descEn="Credit notes to adjust sales invoices (returns, discounts). Foundation only — no accounting entries or tax adjustments are posted at this stage."
        status="foundation"
        availableNow={[
          { ar: "هيكل صلاحيات (عرض/إدارة)", en: "Permission scaffold (view/manage)" },
          { ar: "إدراج في خريطة الوحدات", en: "Listed in module map" },
        ]}
        comingLater={[
          { ar: "ربط إشعار دائن بفاتورة أصلية", en: "Link credit note to source invoice" },
          { ar: "قيد محاسبي عكسي تلقائي", en: "Automated reversal journal entry" },
          { ar: "تأثير على إقرار ضريبة القيمة المضافة", en: "VAT return impact" },
          { ar: "توافق مع متطلبات هيئة الزكاة والضريبة", en: "ZATCA compliance" },
        ]}
      />
    </PermissionGate>
  ),
});
