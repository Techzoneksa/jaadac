"use client";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { MoneyDisplay } from "@/components/ui/MoneyDisplay";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useApi } from "@/lib/hooks/use-api";
import { useRouter } from "next/navigation";
import { RecordActionsMenu, viewLinkAction, editLinkAction, printLinkAction, pdfLinkAction, excelPlaceholderAction, downloadCsvAction, confirmDeleteAction, futureAction, cancelAction } from "@/components/ui/RecordActionsMenu";
import Link from "next/link";
import { Ban } from "lucide-react";

interface PurchaseRec {
  id: string;
  number: string;
  date: string;
  supplier_name: string;
  total: number;
  status: string;
}

export default function PurchasesInvoicesPage() {
  const { data, loading, error } = useApi<PurchaseRec>("/api/invoices?type=purchase");
  const router = useRouter();

  const columns: Column<PurchaseRec>[] = [
    { key: "number", header: "الرقم" },
    { key: "date", header: "التاريخ" },
    { key: "supplier_name", header: "المورد" },
    { key: "status", header: "الحالة", render: (r) => <StatusBadge status={r.status} /> },
    { key: "total", header: "الإجمالي", render: (r) => <MoneyDisplay amount={r.total} /> },
    {
      key: "actions",
      header: "إجراءات",
      render: (r) => {
        const { action: deleteAction, onDelete } = confirmDeleteAction(r.id, "/api/invoices", router);
        return (
          <RecordActionsMenu
            actions={[
              viewLinkAction(`/purchases/invoices/${r.id}`, router),
              editLinkAction(`/purchases/invoices/${r.id}/edit`, router),
              printLinkAction(`/purchases/invoices/${r.id}/print`, router),
              pdfLinkAction(`/purchases/invoices/${r.id}/print`),
              excelPlaceholderAction(),
              downloadCsvAction(data, "invoices", ["الرقم","التاريخ","المورد","الحالة","الإجمالي"], (row: PurchaseRec) => [row.number,row.date,row.supplier_name,row.status,String(row.total)]),
              futureAction("تسجيل سند صرف", <Ban className="h-4 w-4" />, "record-payment"),
              cancelAction(),
              deleteAction,
            ]}
            onDelete={onDelete}
            deleteConfirmTitle="تأكيد الحذف"
            deleteConfirmMessage="هل أنت متأكد من حذف فاتورة المشتريات؟"
            compact
          />
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="فواتير المشتريات"
        action={
          <Link href="/purchases/invoices/new">
            <Button>فاتورة مشتريات جديدة</Button>
          </Link>
        }
      />
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(r) => r.id}
        isLoading={loading}
        error={error}
        emptyTitle="لا توجد فواتير مشتريات"
      />
    </div>
  );
}
