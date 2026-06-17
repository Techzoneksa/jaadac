"use client";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useApi } from "@/lib/hooks/use-api";
import type { Supplier } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RecordActionsMenu, viewLinkAction, editLinkAction, downloadCsvAction, confirmDeleteAction } from "@/components/ui/RecordActionsMenu";
import { FileText, ScrollText, HandCoins, ShoppingCart } from "lucide-react";

export default function SuppliersPage() {
  const { data, loading, error } = useApi<Supplier>("/api/suppliers");
  const router = useRouter();

  const columns: Column<Supplier>[] = [
    { key: "name_ar", header: "الاسم (عربي)" },
    { key: "name_en", header: "الاسم (إنجليزي)" },
    { key: "type", header: "النوع" },
    { key: "mobile", header: "الجوال" },
    { key: "email", header: "البريد الإلكتروني" },
    { key: "city", header: "المدينة" },
    { key: "status", header: "الحالة", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "actions",
      header: "إجراءات",
      render: (r) => {
        const { action: deleteAction, onDelete } = confirmDeleteAction(r.id, "/api/suppliers", router);
        return (
          <RecordActionsMenu
            actions={[
              viewLinkAction(`/suppliers/${r.id}`, router),
              editLinkAction(`/suppliers/${r.id}`, router),
              { label: "إنشاء فاتورة مشتريات", icon: <FileText className="h-4 w-4" />, onClick: () => router.push(`/purchases/invoices/new?supplierId=${r.id}`) },
              { label: "إنشاء أمر شراء", icon: <ShoppingCart className="h-4 w-4" />, onClick: () => router.push(`/purchases/orders/new?supplierId=${r.id}`) },
              { label: "سند صرف", icon: <HandCoins className="h-4 w-4" />, onClick: () => router.push(`/cash/payments/new?supplierId=${r.id}`) },
              { label: "كشف حساب", icon: <ScrollText className="h-4 w-4" />, onClick: () => router.push(`/suppliers/${r.id}/statement`) },
              downloadCsvAction(data, "suppliers", ["الاسم (عربي)", "الاسم (إنجليزي)", "النوع", "الجوال", "البريد الإلكتروني", "المدينة", "الحالة"], (row) => [row.name_ar, row.name_en, row.type, row.mobile || "", row.email || "", row.city || "", row.status]),
              deleteAction,
            ]}
            onDelete={onDelete}
            compact
          />
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader title="الموردون" description="إدارة جهات اتصال الموردين"
        action={<Link href="/suppliers/new"><Button>إضافة مورد</Button></Link>} />
      <DataTable columns={columns} data={data} keyExtractor={(r) => r.id}
        isLoading={loading} error={error}
        emptyTitle="لا يوجد موردون" emptyDescription="أضف مورداً جديداً للبدء"
        searchPlaceholder="بحث عن مورد..." />
    </div>
  );
}
