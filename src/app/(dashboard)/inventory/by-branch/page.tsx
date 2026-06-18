"use client";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

export default function InventoryByBranchPage() {
  return (
    <div>
      <PageHeader title="المخزون حسب الفروع" description="عرض المخزون موزعاً على الفروع والمستودعات" />
      <Card><CardContent className="p-12 text-center text-[#64748b]">
        <p className="text-lg font-medium mb-2">المخزون حسب الفروع</p>
        <p className="text-sm">هذه الميزة قادمة في التحديث القادم (Inventory-2)</p>
      </CardContent></Card>
    </div>
  );
}
