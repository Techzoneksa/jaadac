"use client";
import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { useApi } from "@/lib/hooks/use-api";
import type { Item } from "@/lib/types";
import { RecordActionsMenu, viewLinkAction, editLinkAction, downloadCsvAction, confirmDeleteAction } from "@/components/ui/RecordActionsMenu";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ProductsPage() {
  const { data, loading, error, refresh } = useApi<Item>("/api/inventory/products");
  const router = useRouter();
  const [search, setSearch] = useState("");
  const filtered = data?.filter(i => !search || i.name_ar.toLowerCase().includes(search.toLowerCase()) || (i.sku || "").toLowerCase().includes(search.toLowerCase()));

  const columns: Column<Item>[] = [
    { key: "name_ar", header: "اسم المنتج" },
    { key: "sku", header: "SKU" },
    { key: "category_id", header: "الفئة" },
    { key: "unit", header: "الوحدة" },
    { key: "current_stock", header: "الرصيد", render: (r) => r.current_stock?.toLocaleString() ?? "0" },
    { key: "sales_price", header: "سعر البيع", render: (r) => `${(r.sales_price ?? 0).toLocaleString()} ر.س` },
    { key: "status", header: "الحالة" },
    {
      key: "actions", header: "إجراءات",
      render: (r) => {
        const { action: deleteAction, onDelete } = confirmDeleteAction(r.id, `/api/inventory/products/${r.id}`, router);
        return (
          <RecordActionsMenu actions={[
            viewLinkAction(`/inventory/products/${r.id}`, router),
            editLinkAction(`/inventory/products/${r.id}`, router),
            { type: "movement", label: "حركة الصنف", icon: <span>📦</span>, onClick: () => router.push(`/inventory/movements?item_id=${r.id}`) },
            downloadCsvAction(data, `products_${Date.now()}`, ["الاسم", "SKU", "سعر البيع", "الرصيد", "الحالة"], (row) => [row.name_ar, row.sku || "", String(row.sales_price ?? 0), String(row.current_stock ?? 0), row.status || "active"]),
            deleteAction,
          ]} onDelete={onDelete} compact />
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader title="المنتجات" description="إدارة المنتجات المخزنية"
        action={<Link href="/inventory/products/new"><Button>إضافة منتج</Button></Link>} />
      <div className="mb-4 flex gap-2">
        <Input placeholder="بحث عن منتج..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
      </div>
      <DataTable columns={columns} data={filtered} keyExtractor={(r) => r.id} isLoading={loading} error={error}
        emptyTitle="لا توجد منتجات" emptyDescription="أضف منتجاً جديداً للبدء" searchPlaceholder="بحث..." />
    </div>
  );
}
