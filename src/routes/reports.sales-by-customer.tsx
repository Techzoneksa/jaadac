import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ReportShell, EmptyState, DateRangeFilter } from "@/components/reports/ReportShell";
import { PermissionGate } from "@/components/PermissionGate";
import { useI18n, fmtMoney } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { buildSalesByCustomerReport } from "@/lib/services/reports";

const DEFAULTS = { from: "2026-01-01", to: "2026-06-30" };

export const Route = createFileRoute("/reports/sales-by-customer")({
  head: () => ({ meta: [{ title: "Sales by Customer — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perm="reports.view" mode="page">
      <Page />
    </PermissionGate>
  ),
});

function Page() {
  const { lang } = useI18n();
  const s = useStore((x) => x);
  const [range, setRange] = useState(DEFAULTS);
  const rows = useMemo(() => buildSalesByCustomerReport(s, range), [s, range]);

  return (
    <ReportShell
      titleAr="المبيعات حسب العميل" titleEn="Sales by Customer"
      descAr="ملخص المبيعات والذمم لكل عميل خلال الفترة."
      descEn="Per-customer sales and outstanding balances for the period."
      filters={<DateRangeFilter from={range.from} to={range.to} onChange={setRange} />}
    >
      {rows.length === 0 ? <EmptyState onClear={() => setRange(DEFAULTS)} /> : (
        <div className="card-elevated overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-start font-medium">{lang === "ar" ? "العميل" : "Customer"}</th>
                <th className="px-4 py-3 text-end font-medium">{lang === "ar" ? "عدد الفواتير" : "Invoices"}</th>
                <th className="px-4 py-3 text-end font-medium">{lang === "ar" ? "الإجمالي" : "Total"}</th>
                <th className="px-4 py-3 text-end font-medium">{lang === "ar" ? "المسدد" : "Paid"}</th>
                <th className="px-4 py-3 text-end font-medium">{lang === "ar" ? "المتبقي" : "Outstanding"}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r) => (
                <tr key={r.customer_id}>
                  <td className="px-4 py-2">{lang === "ar" ? r.name_ar : r.name_en}</td>
                  <td className="px-4 py-2 text-end">{r.count}</td>
                  <td className="px-4 py-2 text-end font-mono">{fmtMoney(r.total, lang)}</td>
                  <td className="px-4 py-2 text-end font-mono">{fmtMoney(r.paid, lang)}</td>
                  <td className="px-4 py-2 text-end font-mono font-semibold">{fmtMoney(r.outstanding, lang)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ReportShell>
  );
}
