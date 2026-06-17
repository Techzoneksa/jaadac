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

interface Receipt {
  id: string;
  number: string;
  date: string;
  customer_name: string;
  amount: number;
  status: string;
}

export default function ReceiptsPage() {
  const { data, loading, error } = useApi<Receipt>("/api/receipts");
  const router = useRouter();

  const columns: Column<Receipt>[] = [
    { key: "number", header: "الرقم" },
    { key: "date", header: "التاريخ" },
    { key: "customer_name", header: "العميل" },
    { key: "status", header: "الحالة", render: (r) => <StatusBadge status={r.status} /> },
    { key: "amount", header: "المبلغ", render: (r) => <MoneyDisplay amount={r.amount} /> },
    {
      key: "actions",
      header: "إجراءات",
      render: (r) => {
        const { action: deleteAction, onDelete } = confirmDeleteAction(r.id, "/api/receipts", router);
        return (
          <RecordActionsMenu
            actions={[
              viewLinkAction(`/cash/receipts/${r.id}`, router),
              editLinkAction(`/cash/receipts/${r.id}/edit`, router),
              printLinkAction(`/cash/receipts/${r.id}/print`, router),
              pdfLinkAction(`/cash/receipts/${r.id}/print`),
              excelPlaceholderAction(),
              downloadCsvAction(data, "receipts", ["الرقم","التاريخ","العميل","الحالة","المبلغ"], (row: Receipt) => [row.number,row.date,row.customer_name,row.status,String(row.amount)]),
              futureAction("ربط بفاتورة", <Ban className="h-4 w-4" />),
              cancelAction(),
              deleteAction,
            ]}
            onDelete={onDelete}
            deleteConfirmTitle="تأكيد الحذف"
            deleteConfirmMessage="هل أنت متأكد من حذف سند القبض؟"
            compact
          />
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="سندات القبض"
        action={
          <Link href="/cash/receipts/new">
            <Button>سند قبض جديد</Button>
          </Link>
        }
      />
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(r) => r.id}
        isLoading={loading}
        error={error}
        emptyTitle="لا توجد سندات قبض"
      />
    </div>
  );
}
