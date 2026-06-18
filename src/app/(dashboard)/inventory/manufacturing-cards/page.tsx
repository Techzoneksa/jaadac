"use client";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ManufacturingCardsPage() {
  return (
    <div>
      <PageHeader title="بطاقات التصنيع" description="إدارة بطاقات التصنيع للمنتجات المصنعة" action={<Button disabled>إضافة بطاقة تصنيع</Button>} />
      <Card><CardContent className="p-12 text-center text-[#64748b]">
        <p className="text-lg font-medium mb-2">بطاقات التصنيع</p>
        <p className="text-sm">هذه الميزة قادمة في التحديث القادم (Inventory-2)</p>
      </CardContent></Card>
    </div>
  );
}
