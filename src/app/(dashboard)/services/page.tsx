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

export default function ServicesPage() {
  const { data, loading, error, refresh } = useApi<Item>("/api/services");
  const router = useRouter();
  const [search, setSearch] = useState("");
  const filtered = data?.filter(i => !search || i.name_ar.toLowerCase().includes(search.toLowerCase()) || (i.name_en || "").toLowerCase().includes(search.toLowerCase()));

  const columns: Column<Item>[] = [
    { key: "name_ar", header: "اسم الخدمة" },
    { key: "service_category_id", header: "الفئة" },
    { key: "sales_price", header: "سعر البيع", render: (r) => `${(r.sales_price ?? 0).toLocaleString()} ر.س` },
    { key: "vat_rate", header: "الضريبة", render: (r) => `${r.vat_rate ?? 0}%` },
    { key: "status", header: "الحالة" },
    {
      key: "actions", header: "إجراءات",
      render: (r) => {
        const { action: deleteAction, onDelete } = confirmDeleteAction(r.id, `/api/services/${r.id}`, router);
        return (
          <RecordActionsMenu actions={[
            viewLinkAction(`/services/${r.id}`, router),
            editLinkAction(`/services/${r.id}`, router),
            downloadCsvAction(data, `services_${Date.now()}`, ["الاسم", "سعر البيع", "الضريبة", "الحالة"], (row) => [row.name_ar, String(row.sales_price ?? 0), String(row.vat_rate ?? 0), row.status || "active"]),
            deleteAction,
          ]} onDelete={onDelete} compact />
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader title="الخدمات" description="إدارة الخدمات غير المخزنية"
        action={<Link href="/services/new"><Button>إضافة خدمة</Button></Link>} />
      <div className="mb-4"><Input placeholder="بحث عن خدمة..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" /></div>
      <DataTable columns={columns} data={filtered} keyExtractor={(r) => r.id} isLoading={loading} error={error}
        emptyTitle="لا توجد خدمات" emptyDescription="أضف خدمة جديدة للبدء" />
    </div>
  );
}
