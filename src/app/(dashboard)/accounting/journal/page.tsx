"use client";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { useApi } from "@/lib/hooks/use-api";
import type { JournalEntry } from "@/lib/types";
import { useRouter } from "next/navigation";
import { RecordActionsMenu, viewLinkAction, printLinkAction, downloadCsvAction, futureAction } from "@/components/ui/RecordActionsMenu";
import { Pencil, ArrowLeftRight, Trash2 } from "lucide-react";

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
            futureAction("تحرير", <Pencil className="h-4 w-4" />),
            printLinkAction(`/accounting/journal/${r.id}/print`, router),
            downloadCsvAction(data, "journal", ["الرقم", "التاريخ", "البيان", "الحالة"], (row) => [row.number, row.date, row.description, row.status === "posted" ? "مرحّل" : "مسودة"]),
            futureAction("ترحيل", <ArrowLeftRight className="h-4 w-4" />),
            { label: "حذف", icon: <Trash2 className="h-4 w-4" />, onClick: () => {}, disabled: true, variant: "danger" },
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
