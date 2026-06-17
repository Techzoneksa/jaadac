"use client";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { useApi } from "@/lib/hooks/use-api";
import type { Account } from "@/lib/types";
import { useRouter } from "next/navigation";
import { RecordActionsMenu, downloadCsvAction, futureAction, excelPlaceholderAction } from "@/components/ui/RecordActionsMenu";
import { Eye, Pencil } from "lucide-react";

export default function ChartOfAccountsPage() {
  const { data, loading } = useApi<Account>("/api/accounts");
  const router = useRouter();

  const columns: Column<Account>[] = [
    { key: "number", header: "الرمز" },
    { key: "name_ar", header: "اسم الحساب" },
    { key: "type", header: "النوع" },
    { key: "status", header: "الحالة", render: (r) => (r.status === "active" ? "نشط" : "غير نشط") },
    {
      key: "actions",
      header: "إجراءات",
      render: () => (
        <RecordActionsMenu
          actions={[
            futureAction("عرض", <Eye className="h-4 w-4" />),
            futureAction("تحرير", <Pencil className="h-4 w-4" />),
            excelPlaceholderAction(),
            downloadCsvAction(data, "accounts", ["الرمز", "اسم الحساب", "النوع", "الحالة"], (row) => [row.number, row.name_ar, row.type, row.status === "active" ? "نشط" : "غير نشط"]),
          ]}
          compact
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="شجرة الحسابات" description="دليل الحسابات المحاسبي" />
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(r) => r.id}
        isLoading={loading}
        emptyTitle="لا توجد حسابات"
        emptyDescription="قم بإضافة الحسابات المحاسبية"
      />
    </div>
  );
}
