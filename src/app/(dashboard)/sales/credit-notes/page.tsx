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
import { CheckCircle } from "lucide-react";

interface CNRec {
  id: string;
  number: string;
  date: string;
  customer_name: string;
  total: number;
  status: string;
}

const columns: Column<CNRec>[] = [
  { key: "number", header: "الرقم" },
  { key: "date", header: "التاريخ" },
  { key: "customer_name", header: "العميل" },
  { key: "status", header: "الحالة", render: (r) => <StatusBadge status={r.status} /> },
  { key: "total", header: "الإجمالي", render: (r) => <MoneyDisplay amount={r.total} /> },
  { key: "actions", header: "إجراءات", render: (r) => <ActionsCell record={r} /> },
];

function ActionsCell({ record }: { record: CNRec }) {
  const router = useRouter();
  const deleteConfig = confirmDeleteAction(record.id, "/api/credit-notes", router);
  const actions = [
    viewLinkAction(`/sales/credit-notes/${record.id}`, router),
    editLinkAction(`/sales/credit-notes/${record.id}/edit`, router),
    printLinkAction(`/sales/credit-notes/${record.id}/print`, router),
    pdfLinkAction(`/sales/credit-notes/${record.id}/print`),
    excelPlaceholderAction(),
    downloadCsvAction(
      [record],
      `credit-note-${record.number}`,
      ["الرقم", "التاريخ", "العميل", "الإجمالي", "الحالة"],
      (r) => [r.number, r.date, r.customer_name, String(r.total), r.status],
    ),
    futureAction("إصدار", <CheckCircle className="h-4 w-4" />, "issue"),
    cancelAction(),
    deleteConfig.action,
  ];
  return <RecordActionsMenu actions={actions} onDelete={deleteConfig.onDelete} compact />;
}

export default function CreditNotesPage() {
  const { data, loading, error } = useApi<CNRec>("/api/credit-notes");
  const router = useRouter();
  return (
    <div>
      <PageHeader
        title="إشعارات دائنة"
        action={
          <Link href="/sales/credit-notes/new">
            <Button>إشعار دائن جديد</Button>
          </Link>
        }
      />
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(r) => r.id}
        isLoading={loading}
        error={error}
        emptyTitle="لا توجد إشعارات دائنة"
      />
    </div>
  );
}
