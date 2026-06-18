"use client";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { useApi } from "@/lib/hooks/use-api";
import type { TaxRate } from "@/lib/types";
import { RecordActionsMenu, downloadCsvAction, excelPlaceholderAction, disabledAction } from "@/components/ui/RecordActionsMenu";
import { Eye, Pencil } from "lucide-react";

export default function TaxesPage() {
  const { data, loading } = useApi<TaxRate>("/api/tax-rates");

  const columns: Column<TaxRate>[] = [
    { key: "name_ar", header: "الاسم" },
    { key: "rate", header: "النسبة", render: (r) => `${r.rate}%` },
    { key: "tax_type", header: "النوع" },
    { key: "is_active", header: "الحالة", render: (r) => (r.is_active ? "نشط" : "غير نشط") },
    {
      key: "actions",
      header: "إجراءات",
      render: () => (
        <RecordActionsMenu
          actions={[
            disabledAction("عرض", <Eye className="h-4 w-4" />, undefined, "view"),
            disabledAction("تحرير", <Pencil className="h-4 w-4" />, undefined, "edit"),
            excelPlaceholderAction(),
            downloadCsvAction(data, "taxes", ["الاسم", "النسبة", "النوع", "الحالة"], (row) => [row.name_ar, String(row.rate), row.tax_type, row.is_active ? "نشط" : "غير نشط"]),
          ]}
          compact
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="الضرائب" description="إعدادات الضرائب" />
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(r) => r.id}
        isLoading={loading}
        emptyTitle="لا توجد ضرائب"
      />
    </div>
  );
}
