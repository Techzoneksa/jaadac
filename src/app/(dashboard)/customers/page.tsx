"use client";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useApi } from "@/lib/hooks/use-api";
import type { Customer } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RecordActionsMenu, viewLinkAction, editLinkAction, downloadCsvAction, confirmDeleteAction, pdfLinkAction, excelPlaceholderAction } from "@/components/ui/RecordActionsMenu";
import { FileText, ScrollText, HandCoins } from "lucide-react";

export default function CustomersPage() {
  const { data, loading, error } = useApi<Customer>("/api/customers");
  const router = useRouter();

  const columns: Column<Customer>[] = [
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
        const { action: deleteAction, onDelete } = confirmDeleteAction(r.id, "/api/customers", router);
        return (
          <RecordActionsMenu
            actions={[
              viewLinkAction(`/customers/${r.id}`, router),
              editLinkAction(`/customers/${r.id}`, router),
              { label: "إنشاء فاتورة", icon: <FileText className="h-4 w-4" />, onClick: () => router.push(`/sales/invoices/new?customerId=${r.id}`) },
              { label: "إنشاء عرض سعر", icon: <FileText className="h-4 w-4" />, onClick: () => router.push(`/sales/quotations/new?customerId=${r.id}`) },
              { label: "سند قبض", icon: <HandCoins className="h-4 w-4" />, onClick: () => router.push(`/cash/receipts/new?customerId=${r.id}`) },
              { label: "كشف حساب", icon: <ScrollText className="h-4 w-4" />, onClick: () => router.push(`/customers/${r.id}/statement`) },
              pdfLinkAction(`/customers/${r.id}`),
              excelPlaceholderAction(),
              downloadCsvAction(data, "customers", ["الاسم (عربي)", "الاسم (إنجليزي)", "النوع", "الجوال", "البريد الإلكتروني", "المدينة", "الحالة"], (row) => [row.name_ar, row.name_en, row.type, row.mobile || "", row.email || "", row.city || "", row.status]),
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
      <PageHeader
        title="العملاء"
        description="إدارة جهات اتصال العملاء"
        action={<Link href="/customers/new"><Button>إضافة عميل</Button></Link>}
      />
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(r) => r.id}
        isLoading={loading}
        error={error}
        emptyTitle="لا يوجد عملاء"
        emptyDescription="أضف عميلاً جديداً للبدء"
        searchPlaceholder="بحث عن عميل..."
      />
    </div>
  );
}
