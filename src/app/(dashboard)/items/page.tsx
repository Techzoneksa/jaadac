"use client";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { useApi } from "@/lib/hooks/use-api";
import type { Item } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RecordActionsMenu, viewLinkAction, editLinkAction, downloadCsvAction, confirmDeleteAction, futureAction, pdfLinkAction, excelPlaceholderAction } from "@/components/ui/RecordActionsMenu";
import { ArrowLeftRight, FileText } from "lucide-react";

export default function ItemsPage() {
  const { data, loading, error } = useApi<Item>("/api/items");
  const router = useRouter();

  const columns: Column<Item>[] = [
    { key: "name_ar", header: "الاسم (عربي)" },
    { key: "sku", header: "SKU" },
    { key: "type", header: "النوع" },
    { key: "sales_price", header: "سعر البيع", render: (r) => `${r.sales_price.toLocaleString()} ر.س` },
    { key: "qty", header: "الكمية" },
    { key: "taxable", header: "خاضع للضريبة", render: (r) => (r.taxable ? "نعم" : "لا") },
    {
      key: "actions",
      header: "إجراءات",
      render: (r) => {
        const { action: deleteAction, onDelete } = confirmDeleteAction(r.id, "/api/items", router);
        return (
          <RecordActionsMenu
            actions={[
              viewLinkAction(`/items/${r.id}`, router),
              editLinkAction(`/items/${r.id}`, router),
              { type: "movement", label: "حركة الصنف", icon: <ArrowLeftRight className="h-4 w-4" />, onClick: () => router.push(`/items/${r.id}/movements`) },
              pdfLinkAction(`/items/${r.id}`),
              excelPlaceholderAction(),
                futureAction("إنشاء فاتورة بهذا الصنف", <FileText className="h-4 w-4" />, "create-invoice"),
              downloadCsvAction(data, "items", ["الاسم (عربي)", "SKU", "النوع", "سعر البيع", "الكمية", "خاضع للضريبة"], (row) => [row.name_ar, row.sku || "", row.type, String(row.sales_price), String(row.qty ?? 0), row.taxable ? "نعم" : "لا"]),
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
      <PageHeader title="الأصناف" description="إدارة الأصناف والخدمات"
        action={<Link href="/items/new"><Button>إضافة صنف</Button></Link>} />
      <DataTable columns={columns} data={data} keyExtractor={(r) => r.id}
        isLoading={loading} error={error}
        emptyTitle="لا توجد أصناف" emptyDescription="أضف صنفاً جديداً للبدء"
        searchPlaceholder="بحث عن صنف..." />
    </div>
  );
}
