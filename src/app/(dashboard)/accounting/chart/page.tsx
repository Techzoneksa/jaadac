"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { useApi } from "@/lib/hooks/use-api";
import type { Account } from "@/lib/types";
import { useRouter } from "next/navigation";
import { RecordActionsMenu, downloadCsvAction, viewLinkAction, disabledAction, excelPlaceholderAction } from "@/components/ui/RecordActionsMenu";
import { Eye, Pencil, Plus, RefreshCw } from "lucide-react";

const DEFAULT_ACCOUNTS = [
  { number: "1000", name_ar: "الأصول", type: "assets", kind: "header" },
  { number: "1100", name_ar: "النقدية والبنوك", type: "assets", kind: "group" },
  { number: "1110", name_ar: "الصندوق", type: "assets", kind: "posting" },
  { number: "1120", name_ar: "البنك - جاري", type: "assets", kind: "posting" },
  { number: "1200", name_ar: "الحسابات المدينة", type: "assets", kind: "group" },
  { number: "1210", name_ar: "عملاء", type: "assets", kind: "posting", purpose: "receivables" },
  { number: "2000", name_ar: "الخصوم", type: "liabilities", kind: "header" },
  { number: "2100", name_ar: "الحسابات الدائنة", type: "liabilities", kind: "group" },
  { number: "2110", name_ar: "موردون", type: "liabilities", kind: "posting", purpose: "payables" },
  { number: "2200", name_ar: "الضرائب المستحقة", type: "liabilities", kind: "posting" },
  { number: "3000", name_ar: "حقوق الملكية", type: "equity", kind: "header" },
  { number: "3100", name_ar: "رأس المال", type: "equity", kind: "posting" },
  { number: "4000", name_ar: "الإيرادات", type: "revenue", kind: "header" },
  { number: "4100", name_ar: "إيرادات المبيعات", type: "revenue", kind: "posting" },
  { number: "5000", name_ar: "المصروفات", type: "expenses", kind: "header" },
  { number: "5100", name_ar: "المصروفات العمومية", type: "expenses", kind: "posting" },
];

export default function ChartOfAccountsPage() {
  const { data, loading, error, refresh } = useApi<Account>("/api/accounts");
  const router = useRouter();
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState("");

  async function seedDefaultAccounts() {
    setSeeding(true); setSeedError("");
    try {
      for (const acc of DEFAULT_ACCOUNTS) {
        await fetch("/api/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(acc),
        });
      }
      refresh();
    } catch {
      setSeedError("فشل إنشاء الحسابات الافتراضية");
    } finally {
      setSeeding(false);
    }
  }

  const typeLabels: Record<string, string> = {
    assets: "أصول", liabilities: "خصوم", equity: "حقوق ملكية",
    revenue: "إيرادات", expenses: "مصروفات",
  };

  const columns: Column<Account>[] = [
    { key: "number", header: "الرمز" },
    { key: "name_ar", header: "اسم الحساب" },
    { key: "type", header: "النوع", render: (r) => typeLabels[r.type] || r.type },
    {
      key: "status",
      header: "الحالة",
      render: (r) => (
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full ${r.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
          {r.status === "active" ? "نشط" : "غير نشط"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "إجراءات",
      render: (r) => (
        <RecordActionsMenu
          actions={[
            viewLinkAction(`/accounting/journal?account_id=${r.id}`, router),
            disabledAction("تحرير", <Pencil className="h-4 w-4" />, undefined, "edit"),
            excelPlaceholderAction(),
            downloadCsvAction(data, "accounts", ["الرمز", "اسم الحساب", "النوع", "الحالة"], (row) => [row.number, row.name_ar, typeLabels[row.type] || row.type, row.status === "active" ? "نشط" : "غير نشط"]),
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="شجرة الحسابات"
        description="دليل الحسابات المحاسبي"
        action={
          <div className="flex items-center gap-2">
            <Button onClick={() => router.push("/accounting/journal/new")}>
              <Plus className="h-4 w-4 ml-1.5" /> إضافة حساب
            </Button>
          </div>
        }
      />

      {seedError && (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: "var(--danger-soft)", color: "var(--danger)" }}>
          {seedError}
        </div>
      )}

      {data?.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-muted font-medium mb-4">ابدأ بإضافة أول حساب أو إنشاء شجرة افتراضية</p>
          <Button onClick={seedDefaultAccounts} disabled={seeding}>
            <RefreshCw className={`h-4 w-4 ml-1.5 ${seeding ? "animate-spin" : ""}`} />
            {seeding ? "جارٍ الإنشاء..." : "إنشاء شجرة حسابات افتراضية"}
          </Button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(r) => r.id}
        isLoading={loading}
        error={error}
      />
    </div>
  );
}
