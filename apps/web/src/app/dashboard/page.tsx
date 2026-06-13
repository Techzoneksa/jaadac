import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">لوحة البيانات</h1>
        <span className="text-sm text-gray-500">JAAD CLOUD — Production Shell</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "المبيعات اليوم", value: "—" },
          { title: "الفواتير النشطة", value: "—" },
          { title: "العملاء", value: "—" },
          { title: "رصيد البنك", value: "—" },
        ].map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500 font-normal">{stat.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-8 text-center text-gray-500">
          <p className="text-lg">سيتم ترحيل لوحة البيانات في المرحلة القادمة</p>
          <p className="text-sm mt-2">هذا الـ shell الإنتاجي جاهز لاستقبال الموديولات المحاسبية</p>
        </CardContent>
      </Card>
    </div>
  );
}
