"use client";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { useApi } from "@/lib/hooks/use-api";
import type { JournalEntry } from "@/lib/types";
import { useRouter } from "next/navigation";
import { RecordActionsMenu, viewLinkAction, printLinkAction, pdfLinkAction, downloadCsvAction, futureAction, excelPlaceholderAction, disabledAction } from "@/components/ui/RecordActionsMenu";
import { Pencil, ArrowLeftRight } from "lucide-react";

export default function JournalPage() {
  const { data, loading } = useApi<JournalEntry>("/api/journal");
  const router = useRouter();

  const columns: Column<JournalEntry>[] = [
    { key: "number", header: "الرقم" },
    { key: "date", header: "التاريخ" },
    { key: "description", header: "البيان" },
    { key: "status", header: "الحالة", render: (r) => (r.status === "posted" ? "مرحّل" : "مسودة") },
    {
      key: "actions",
      header: "إجراءات",
      render: (r) => (
        <RecordActionsMenu
          actions={[
            viewLinkAction(`/accounting/journal/${r.id}`, router),
            futureAction("تحرير", <Pencil className="h-4 w-4" />, "edit"),
            printLinkAction(`/accounting/journal/${r.id}/print`, router),
            pdfLinkAction(`/accounting/journal/${r.id}/print`),
            excelPlaceholderAction(),
            downloadCsvAction(data, "journal", ["الرقم", "التاريخ", "البيان", "الحالة"], (row) => [row.number, row.date, row.description, row.status === "posted" ? "مرحّل" : "مسودة"]),
            futureAction("ترحيل", <ArrowLeftRight className="h-4 w-4" />, "post"),
            disabledAction("حذف", <ArrowLeftRight className="h-4 w-4" />, "الحذف غير متاح للقيود المرحّلة", "delete"),
          ]}
          compact
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="قيود اليومية" description="تسجيل القيود المحاسبية" />
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(r) => r.id}
        isLoading={loading}
        emptyTitle="لا توجد قيود"
        emptyDescription="أضف قيداً جديداً"
      />
    </div>
  );
}
