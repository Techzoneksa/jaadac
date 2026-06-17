"use client";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { MoneyDisplay } from "@/components/ui/MoneyDisplay";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useApi } from "@/lib/hooks/use-api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RecordActionsMenu, viewLinkAction, editLinkAction, printLinkAction, downloadCsvAction, confirmDeleteAction, futureAction, pdfLinkAction, excelPlaceholderAction, cancelAction } from "@/components/ui/RecordActionsMenu";
import { FileText } from "lucide-react";

interface InvoiceRec {
  id: string;
  number: string;
  date: string;
  customer_name: string;
  total: number;
  status: string;
}

const columns: Column<InvoiceRec>[] = [
  { key: "number", header: "الرقم" },
  { key: "date", header: "التاريخ" },
  { key: "customer_name", header: "العميل" },
  { key: "status", header: "الحالة", render: (r) => <StatusBadge status={r.status} /> },
  { key: "total", header: "الإجمالي", render: (r) => <MoneyDisplay amount={r.total} /> },
  { key: "actions", header: "إجراءات", render: (r) => <ActionsCell record={r} /> },
];

function ActionsCell({ record }: { record: InvoiceRec }) {
  const router = useRouter();
  const deleteConfig = confirmDeleteAction(record.id, "/api/invoices", router);
  const actions = [
    viewLinkAction(`/sales/invoices/${record.id}`, router),
    editLinkAction(`/sales/invoices/${record.id}/edit`, router),
    printLinkAction(`/sales/invoices/${record.id}/print`, router),
    pdfLinkAction(`/sales/invoices/${record.id}/print`),
    excelPlaceholderAction(),
    downloadCsvAction(
      [record],
      `invoice-${record.number}`,
      ["الرقم", "التاريخ", "العميل", "الإجمالي", "الحالة"],
      (r) => [r.number, r.date, r.customer_name, String(r.total), r.status],
    ),
    futureAction("تسجيل قبض", <FileText className="h-4 w-4" />),
    cancelAction(),
    deleteConfig.action,
  ];
  return <RecordActionsMenu actions={actions} onDelete={deleteConfig.onDelete} compact />;
}

export default function SalesInvoicesPage() {
  const { data, loading, error } = useApi<InvoiceRec>("/api/invoices?type=sale");
  const router = useRouter();
  return (
    <div>
      <PageHeader
        title="فواتير المبيعات"
        action={
          <Link href="/sales/invoices/new">
            <Button>فاتورة جديدة</Button>
          </Link>
        }
      />
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(r) => r.id}
        isLoading={loading}
        error={error}
        emptyTitle="لا توجد فواتير مبيعات"
      />
    </div>
  );
}
