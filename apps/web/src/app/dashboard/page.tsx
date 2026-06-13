import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Users, Receipt, Banknote, BarChart3 } from "lucide-react";

const stats = [
  { title: "إجمالي العملاء", value: "—", icon: <Users className="h-5 w-5" /> },
  { title: "الفواتير النشطة", value: "—", icon: <Receipt className="h-5 w-5" /> },
  { title: "المقبوضات (شهر)", value: "—", icon: <Banknote className="h-5 w-5" /> },
  { title: "التقارير المتاحة", value: "11", icon: <BarChart3 className="h-5 w-5" /> },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">لوحة البيانات</h1>
          <p className="text-sm text-[#64748b] mt-1">نظرة عامة على النظام (بيانات تجريبية)</p>
        </div>
        <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
          Production Shell
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatCard key={s.title} title={s.title} value={s.value} icon={s.icon} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">الوحدات الجاهزة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "لوحة البيانات", status: "جاهز" },
                { name: "شاشات العرض الأساسية", status: "15 صفحة" },
                { name: "نظام التصميم", status: "مكتمل" },
                { name: "القوائم والتنقل", status: "عربي / RTL" },
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between py-1">
                  <span className="text-sm text-[#334155]">{item.name}</span>
                  <span className="text-xs text-[#64748b]">{item.status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">المراحل القادمة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "ترحيل الموديولات", phase: "Phase 2.3+" },
                { name: "قاعدة البيانات", phase: "Phase 2.3" },
                { name: "المصادقة", phase: "Phase 2.4" },
                { name: "الخدمات المحاسبية", phase: "Phase 2.5" },
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between py-1">
                  <span className="text-sm text-[#334155]">{item.name}</span>
                  <span className="text-xs font-medium text-[#2563eb]">{item.phase}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
