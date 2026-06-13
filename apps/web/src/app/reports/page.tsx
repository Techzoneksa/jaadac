import { ModulePageTemplate } from "@/components/shared/ModulePageTemplate";

const reportList = [
  { name: "ميزان المراجعة" },
  { name: "الميزانية العمومية" },
  { name: "قائمة الدخل" },
  { name: "التدفقات النقدية" },
  { name: "دفتر الأستاذ العام" },
  { name: "كشف حساب" },
  { name: "المبيعات حسب العميل" },
  { name: "المبيعات حسب المنتج" },
  { name: "الفواتير المتأخرة" },
  { name: "الفواتير غير المدفوعة" },
  { name: "تقرير ضريبة القيمة المضافة" },
];

export default function ReportsPage() {
  return (
    <ModulePageTemplate
      title="مركز التقارير"
      description="التقارير المالية والإدارية"
      status="placeholder"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {reportList.map((r) => (
          <div key={r.name} className="flex items-center justify-between rounded-lg border border-[#e2e8f0] bg-white px-4 py-3">
            <span className="text-sm text-[#334155]">{r.name}</span>
            <span className="text-xs text-[#94a3b8]">قريبًا</span>
          </div>
        ))}
      </div>
    </ModulePageTemplate>
  );
}
