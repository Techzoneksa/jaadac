import { createFileRoute } from "@tanstack/react-router";
import { PermissionGate } from "@/components/PermissionGate";
import { ModuleFoundationPage } from "@/components/ModuleFoundationPage";

export const Route = createFileRoute("/fixed-assets")({
  head: () => ({ meta: [{ title: "Fixed Assets — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perm="fixed_assets.view" mode="page">
      <ModuleFoundationPage
        titleAr="الأصول الثابتة"
        titleEn="Fixed Assets"
        descAr="سجل الأصول الثابتة وجدول الإهلاك. تأسيسي — لا يتم احتساب إهلاك أو ترحيل قيود حاليًا."
        descEn="Fixed asset register and depreciation schedule. Foundation only — no depreciation or journal posting is computed yet."
        status="foundation"
        availableNow={[
          { ar: "خانة في خريطة الوحدات", en: "Slot in module map" },
        ]}
        comingLater={[
          { ar: "سجل أصول كامل (تكلفة، تاريخ شراء، عمر إنتاجي)", en: "Full asset register (cost, purchase date, useful life)" },
          { ar: "جداول إهلاك متعددة (قسط ثابت / متناقص)", en: "Depreciation schedules (straight-line / declining)" },
          { ar: "ترحيل قيود الإهلاك الشهري تلقائيًا", en: "Automated monthly depreciation entries" },
          { ar: "تتبع الاستبعاد وإعادة التقييم", en: "Disposal & revaluation tracking" },
        ]}
      />
    </PermissionGate>
  ),
});
