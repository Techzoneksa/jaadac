"use client";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

export default function InventoryMovementsPage() {
  return (
    <div>
      <PageHeader title="حركة المخزون" description="سجل حركات المخزون من مشتريات ومبيعات وجرد وتحويل" />
      <Card><CardContent className="p-12 text-center text-[#64748b]">
        <p className="text-lg font-medium mb-2">حركة المخزون</p>
        <p className="text-sm">هذه الميزة قادمة في التحديث القادم (Inventory-2)</p>
      </CardContent></Card>
    </div>
  );
}
