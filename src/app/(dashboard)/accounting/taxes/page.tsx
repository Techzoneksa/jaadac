"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { useApi } from "@/lib/hooks/use-api";
import type { TaxRate } from "@/lib/types";
import { RecordActionsMenu, downloadCsvAction, disabledAction, excelPlaceholderAction } from "@/components/ui/RecordActionsMenu";
import { Plus, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

const DEFAULT_TAXES = [
  { name_ar: "ضريبة القيمة المضافة ١٥٪", name_en: "VAT 15%", tax_type: "sales", rate: 15, is_system: true },
  { name_ar: "ضريبة القيمة المضافة ٠٪", name_en: "VAT 0%", tax_type: "sales", rate: 0, is_system: true },
  { name_ar: "معفاة من الضريبة", name_en: "Tax Exempt", tax_type: "sales", rate: 0, is_system: true },
  { name_ar: "خارج نطاق الضريبة", name_en: "Out of Scope", tax_type: "out_of_scope", rate: 0, is_system: true },
  { name_ar: "ضريبة المشتريات ١٥٪", name_en: "Purchases VAT 15%", tax_type: "purchases", rate: 15, is_system: true },
  { name_ar: "ضريبة المشتريات ٠٪", name_en: "Purchases VAT 0%", tax_type: "purchases", rate: 0, is_system: true },
  { name_ar: "عكس الضريبة", name_en: "Reverse Charge", tax_type: "reverse_charge", rate: 15, is_system: true },
];

export default function TaxRatesPage() {
  const { data, loading, error, refresh } = useApi<TaxRate>("/api/tax-rates");
  const router = useRouter();
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState("");

  async function seedDefaultTaxes() {
    setSeeding(true); setSeedError("");
    try {
      for (const tax of DEFAULT_TAXES) {
        await fetch("/api/tax-rates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tax),
        });
      }
      refresh();
    } catch {
      setSeedError("فشل إنشاء الضرائب الافتراضية");
    } finally {
      setSeeding(false);
    }
  }

  const typeLabels: Record<string, string> = {
    sales: "مبيعات", purchases: "مشتريات", reverse_charge: "عكس الضريبة", out_of_scope: "خارج النطاق",
  };

  const columns: Column<TaxRate>[] = [
    { key: "name_ar", header: "اسم الضريبة" },
    { key: "rate", header: "النسبة", render: (r) => `${r.rate}%` },
    { key: "tax_type", header: "النوع", render: (r) => typeLabels[r.tax_type] || r.tax_type },
    {
      key: "is_active",
      header: "الحالة",
      render: (r) => (
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full ${r.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
          {r.is_active ? "مفعل" : "معطل"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "إجراءات",
      render: (r) => (
        <RecordActionsMenu
          actions={[
            disabledAction("تحرير", undefined, undefined, "edit"),
            excelPlaceholderAction(),
            downloadCsvAction(data, "tax-rates", ["الاسم", "النسبة", "النوع", "الحالة"], (row) => [row.name_ar, `${row.rate}%`, typeLabels[row.tax_type] || row.tax_type, row.is_active ? "مفعل" : "معطل"]),
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="الضرائب"
        description="إدارة نسب وفئات الضريبة"
        action={
          <div className="flex items-center gap-2">
            <Button onClick={() => router.push("/accounting/taxes/new")}>
              <Plus className="h-4 w-4 ml-1.5" /> إضافة ضريبة
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
          <p className="text-muted font-medium mb-4">أضف أول ضريبة أو استخدم الإعدادات الافتراضية</p>
          <Button onClick={seedDefaultTaxes} disabled={seeding}>
            <RefreshCw className={`h-4 w-4 ml-1.5 ${seeding ? "animate-spin" : ""}`} />
            {seeding ? "جارٍ الإنشاء..." : "إضافة الضرائب الافتراضية"}
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
