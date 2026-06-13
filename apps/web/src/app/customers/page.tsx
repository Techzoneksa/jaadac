"use client";

import { ModulePageTemplate } from "@/components/shared/ModulePageTemplate";
import { DataTable } from "@/components/ui/DataTable";

const columns = [
  { key: "name", header: "الاسم" },
  { key: "phone", header: "الجوال" },
  { key: "email", header: "البريد الإلكتروني" },
  { key: "status", header: "الحالة" },
];

export default function CustomersPage() {
  return (
    <ModulePageTemplate
      title="العملاء"
      description="إدارة جهات الاتصال من العملاء"
      status="placeholder"
    >
      <DataTable
        columns={columns}
        data={[]}
        keyExtractor={() => ""}
        emptyTitle="لا يوجد عملاء بعد"
        emptyDescription="سيتم ترحيل بيانات العملاء من الديمو في المرحلة القادمة"
        onSearch={() => {}}
      />
    </ModulePageTemplate>
  );
}
