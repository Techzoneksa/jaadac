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

interface Payment {
  id: string;
  number: string;
  date: string;
  supplier_name: string;
  amount: number;
  status: string;
}

export default function PaymentsPage() {
  const { data, loading, error } = useApi<Payment>("/api/payments");
  const router = useRouter();

  const columns: Column<Payment>[] = [
    { key: "number", header: "الرقم" },
    { key: "date", header: "التاريخ" },
    { key: "supplier_name", header: "المورد" },
    { key: "status", header: "الحالة", render: (r) => <StatusBadge status={r.status} /> },
    { key: "amount", header: "المبلغ", render: (r) => <MoneyDisplay amount={r.amount} /> },
    {
      key: "actions",
      header: "إجراءات",
      render: (r) => {
        const { action: deleteAction, onDelete } = confirmDeleteAction(r.id, "/api/payments", router);
        return (
          <RecordActionsMenu
            actions={[
              viewLinkAction(`/cash/payments/${r.id}`, router),
              editLinkAction(`/cash/payments/${r.id}/edit`, router),
              printLinkAction(`/cash/payments/${r.id}/print`, router),
              pdfLinkAction(`/cash/payments/${r.id}/print`),
              excelPlaceholderAction(),
              downloadCsvAction(data, "payments", ["الرقم","التاريخ","المورد","الحالة","المبلغ"], (row: Payment) => [row.number,row.date,row.supplier_name,row.status,String(row.amount)]),
              futureAction("ربط بفاتورة مشتريات", <Ban className="h-4 w-4" />, "link"),
              cancelAction(),
              deleteAction,
            ]}
            onDelete={onDelete}
            deleteConfirmTitle="تأكيد الحذف"
            deleteConfirmMessage="هل أنت متأكد من حذف سند الصرف؟"
            compact
          />
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="سندات الصرف"
        action={
          <Link href="/cash/payments/new">
            <Button>سند صرف جديد</Button>
          </Link>
        }
      />
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(r) => r.id}
        isLoading={loading}
        error={error}
        emptyTitle="لا توجد سندات صرف"
      />
    </div>
  );
}
