"use client";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { MoneyDisplay } from "@/components/ui/MoneyDisplay";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useApi } from "@/lib/hooks/use-api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RecordActionsMenu, viewLinkAction, editLinkAction, printLinkAction, downloadCsvAction, confirmDeleteAction, futureAction, toastAction, pdfLinkAction, excelPlaceholderAction } from "@/components/ui/RecordActionsMenu";
import { Copy, ArrowLeftRight } from "lucide-react";

interface Quotation {
  id: string;
  number: string;
  date: string;
  customer_name: string;
  total: number;
  status: string;
}

const columns: Column<Quotation>[] = [
  { key: "number", header: "الرقم" },
  { key: "date", header: "التاريخ" },
  { key: "customer_name", header: "العميل" },
  { key: "status", header: "الحالة", render: (r) => <StatusBadge status={r.status} /> },
  { key: "total", header: "الإجمالي", render: (r) => <MoneyDisplay amount={r.total} /> },
  { key: "actions", header: "إجراءات", render: (r) => <ActionsCell record={r} /> },
];

function ActionsCell({ record }: { record: Quotation }) {
  const router = useRouter();
  const deleteConfig = confirmDeleteAction(record.id, "/api/quotations", router);
  const actions = [
    viewLinkAction(`/sales/quotations/${record.id}`, router),
    editLinkAction(`/sales/quotations/${record.id}/edit`, router),
    printLinkAction(`/sales/quotations/${record.id}/print`, router),
    pdfLinkAction(`/sales/quotations/${record.id}/print`),
    excelPlaceholderAction(),
    downloadCsvAction(
      [record],
      `quotation-${record.number}`,
      ["الرقم", "التاريخ", "العميل", "الإجمالي", "الحالة"],
      (r) => [r.number, r.date, r.customer_name, String(r.total), r.status],
    ),
    toastAction("تحويل إلى فاتورة", <ArrowLeftRight className="h-4 w-4" />, "سيتم تفعيله قريبًا", "convert"),
    futureAction("نسخ", <Copy className="h-4 w-4" />, "copy"),
    deleteConfig.action,
  ];
  return <RecordActionsMenu actions={actions} onDelete={deleteConfig.onDelete} compact />;
}

export default function QuotationsPage() {
  const { data, loading, error } = useApi<Quotation>("/api/quotations");
  const router = useRouter();
  return (
    <div>
      <PageHeader
        title="عروض الأسعار"
        action={
          <Link href="/sales/quotations/new">
            <Button>عرض سعر جديد</Button>
          </Link>
        }
      />
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(r) => r.id}
        isLoading={loading}
        error={error}
        emptyTitle="لا توجد عروض أسعار"
      />
    </div>
  );
}
