"use client";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { MoneyDisplay } from "@/components/ui/MoneyDisplay";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useApi } from "@/lib/hooks/use-api";
import { useRouter } from "next/navigation";
import { RecordActionsMenu, viewLinkAction, editLinkAction, printLinkAction, pdfLinkAction, excelPlaceholderAction, downloadCsvAction, confirmDeleteAction, futureAction, cancelAction, disabledAction } from "@/components/ui/RecordActionsMenu";
import Link from "next/link";
import { Ban, XCircle } from "lucide-react";

interface PORec {
  id: string;
  number: string;
  date: string;
  supplier_name: string;
  total: number;
  status: string;
}

export default function PurchaseOrdersPage() {
  const { data, loading, error } = useApi<PORec>("/api/purchase-orders");
  const router = useRouter();

  const columns: Column<PORec>[] = [
    { key: "number", header: "الرقم" },
    { key: "date", header: "التاريخ" },
    { key: "supplier_name", header: "المورد" },
    { key: "status", header: "الحالة", render: (r) => <StatusBadge status={r.status} /> },
    { key: "total", header: "الإجمالي", render: (r) => <MoneyDisplay amount={r.total} /> },
    {
      key: "actions",
      header: "إجراءات",
      render: (r) => {
        const { action: deleteAction, onDelete } = confirmDeleteAction(r.id, "/api/purchase-orders", router);
        return (
          <RecordActionsMenu
            actions={[
              viewLinkAction(`/purchases/orders/${r.id}`, router),
              editLinkAction(`/purchases/orders/${r.id}/edit`, router),
              printLinkAction(`/purchases/orders/${r.id}/print`, router),
              pdfLinkAction(`/purchases/orders/${r.id}/print`),
              excelPlaceholderAction(),
              downloadCsvAction(data, "orders", ["الرقم","التاريخ","المورد","الحالة","الإجمالي"], (row: PORec) => [row.number,row.date,row.supplier_name,row.status,String(row.total)]),
              futureAction("تحويل إلى فاتورة", <Ban className="h-4 w-4" />, "convert"),
              disabledAction("اعتماد", <XCircle className="h-4 w-4" />, undefined, "approve"),
              cancelAction(),
              deleteAction,
            ]}
            onDelete={onDelete}
            deleteConfirmTitle="تأكيد الحذف"
            deleteConfirmMessage="هل أنت متأكد من حذف أمر الشراء؟"
            compact
          />
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="أوامر الشراء"
        action={
          <Link href="/purchases/orders/new">
            <Button>أمر شراء جديد</Button>
          </Link>
        }
      />
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(r) => r.id}
        isLoading={loading}
        error={error}
        emptyTitle="لا توجد أوامر شراء"
      />
    </div>
  );
}
