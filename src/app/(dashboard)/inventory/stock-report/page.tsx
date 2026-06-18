"use client";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function StockReportPage() {
  return (
    <div>
      <PageHeader title="كشف المخزون" description="تقرير شامل للمخزون حسب المنتجات والفروع" action={<Button disabled>تصدير CSV</Button>} />
      <Card><CardContent className="p-12 text-center text-[#64748b]">
        <p className="text-lg font-medium mb-2">كشف المخزون</p>
        <p className="text-sm">هذه الميزة قادمة في التحديث القادم (Inventory-2)</p>
      </CardContent></Card>
    </div>
  );
}
