import { createFileRoute } from "@tanstack/react-router";
import { PermissionGate } from "@/components/PermissionGate";
import { ModuleFoundationPage } from "@/components/ModuleFoundationPage";
import { useI18n } from "@/lib/i18n";
import { Users, Wallet, CalendarOff, FileSignature } from "lucide-react";

export const Route = createFileRoute("/hr")({
  head: () => ({ meta: [{ title: "Human Resources — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perm="hr.view" mode="page">
      <HRPage />
    </PermissionGate>
  ),
});

function HRPage() {
  const { lang } = useI18n();
  const cards = [
    { Icon: Users,         ar: "إدارة الموظفين",  en: "Employees" },
    { Icon: Wallet,        ar: "إدارة الرواتب",   en: "Payroll" },
    { Icon: CalendarOff,   ar: "الإجازات",        en: "Leaves" },
    { Icon: FileSignature, ar: "عقود التوظيف",   en: "Employment Contracts" },
  ];
  return (
    <ModuleFoundationPage
      titleAr="الموارد البشرية"
      titleEn="Human Resources"
      descAr="وحدة الموارد البشرية مخطط لها لمرحلة لاحقة. لا يتم احتساب رواتب أو ترحيل قيود حاليًا."
      descEn="HR module is planned for a later phase. No payroll calculation or accounting posting is performed yet."
      status="planned"
      availableNow={[
        { ar: "خريطة الوحدات الفرعية", en: "Sub-module map" },
      ]}
      comingLater={[
        { ar: "محرك رواتب كامل مع البدلات والاستقطاعات", en: "Full payroll engine (allowances, deductions)" },
        { ar: "ترحيل قيود الرواتب تلقائيًا", en: "Auto-posting payroll journals" },
        { ar: "إدارة الإجازات والحضور", en: "Leaves & attendance management" },
        { ar: "أرشيف عقود التوظيف الرقمية", en: "Digital employment contracts archive" },
      ]}
    >
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {cards.map(c => (
          <div key={c.en} className="card-elevated p-4 text-sm flex items-center gap-3">
            <div className="size-10 rounded-md bg-muted flex items-center justify-center"><c.Icon className="size-5" /></div>
            <div>
              <div className="font-medium">{lang === "ar" ? c.ar : c.en}</div>
              <div className="text-xs text-muted-foreground">{lang === "ar" ? "قريبًا" : "Coming soon"}</div>
            </div>
          </div>
        ))}
      </div>
    </ModuleFoundationPage>
  );
}
