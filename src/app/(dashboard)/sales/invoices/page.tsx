"use client";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { MoneyDisplay } from "@/components/ui/MoneyDisplay";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useApi } from "@/lib/hooks/use-api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RecordActionsMenu, viewLinkAction, editLinkAction, printLinkAction, downloadCsvAction, confirmDeleteAction, futureAction, pdfLinkAction, excelPlaceholderAction } from "@/components/ui/RecordActionsMenu";
import { DollarSign } from "lucide-react";

function f(v: number) { return v.toLocaleString("en-US", { minimumFractionDigits: 2 }); }

interface InvoiceRec {
  id: string;
  number: string;
  date: string;
  customer_name: string;
  total: number;
  paid_amount?: number;
  status: string;
}

function ActionsCell({ record }: { record: InvoiceRec }) {
  const router = useRouter();
  const deleteConfig = confirmDeleteAction(record.id, "/api/invoices", router);
  const isFullyPaid = (record.paid_amount || 0) >= record.total;
  const actions = [
    viewLinkAction(`/sales/invoices/${record.id}`, router),
    editLinkAction(`/sales/invoices/${record.id}/edit`, router),
    printLinkAction(`/sales/invoices/${record.id}/print`, router),
    pdfLinkAction(`/sales/invoices/${record.id}/print`),
    excelPlaceholderAction(),
    { type: "other" as const, label: isFullyPaid ? "مدفوعة" : "تسجيل دفعة", icon: <DollarSign className="h-4 w-4" />, onClick: () => router.push(`/sales/invoices/${record.id}`), disabled: isFullyPaid },
    downloadCsvAction(
      [record], `invoice-${record.number}`,
      ["الرقم", "التاريخ", "العميل", "الإجمالي", "المدفوع", "المتبقي", "الحالة"],
      (r) => [r.number, r.date, r.customer_name, String(r.total), String(r.paid_amount || 0), String(Math.max(0, r.total - (r.paid_amount || 0))), r.status],
    ),
    deleteConfig.action,
  ];
  return <RecordActionsMenu actions={actions} onDelete={deleteConfig.onDelete} compact />;
}

const columns: Column<InvoiceRec>[] = [
  { key: "number", header: "الرقم" },
  { key: "date", header: "التاريخ" },
  { key: "customer_name", header: "العميل" },
  { key: "total", header: "الإجمالي", render: (r) => <MoneyDisplay amount={r.total} /> },
  { key: "paid_amount", header: "المدفوع", render: (r) => <span style={{ color: "#16a34a" }}>{(r.paid_amount || 0) > 0 ? `${f(r.paid_amount || 0)} ر.س` : "—"}</span> },
  { key: "remaining", header: "المتبقي", render: (r) => { const rem = Math.max(0, r.total - (r.paid_amount || 0)); return <span style={{ color: rem > 0 ? "#dc2626" : "#16a34a" }}>{rem > 0 ? `${f(rem)} ر.س` : "✓ مدفوعة"}</span>; } },
  { key: "status", header: "الحالة", render: (r) => <StatusBadge status={r.status} /> },
  { key: "actions", header: "إجراءات", render: (r) => <ActionsCell record={r} /> },
];

export default function SalesInvoicesPage() {
  const { data, loading, error } = useApi<InvoiceRec>("/api/invoices?type=sale");
  const router = useRouter();
  return (
    <div>
      <PageHeader title="فواتير المبيعات" action={<Link href="/sales/invoices/new"><Button>فاتورة جديدة</Button></Link>} />
      <DataTable columns={columns} data={data} keyExtractor={(r) => r.id} isLoading={loading} error={error} emptyTitle="لا توجد فواتير مبيعات" />
    </div>
  );
}
