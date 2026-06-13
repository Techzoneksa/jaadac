import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ReportShell, EmptyState, DateRangeFilter } from "@/components/reports/ReportShell";
import { PermissionGate } from "@/components/PermissionGate";
import { useI18n, fmtMoney } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { buildProfitLossReport } from "@/lib/services/reports";

const DEFAULTS = { from: "2026-01-01", to: "2026-06-30" };

export const Route = createFileRoute("/reports/profit-loss")({
  head: () => ({ meta: [{ title: "Profit & Loss — JAAD CLOUD" }] }),
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
  const report = useMemo(() => buildProfitLossReport(s, range), [s, range]);
  const isEmpty = report.revenue.length === 0 && report.expenses.length === 0;

  return (
    <ReportShell
      titleAr="الأرباح والخسائر" titleEn="Profit & Loss"
      descAr="الإيرادات والمصروفات وصافي الدخل للفترة المختارة."
      descEn="Revenues, expenses, and net income for the selected period."
      filters={<DateRangeFilter from={range.from} to={range.to} onChange={setRange} />}
    >
      {isEmpty ? <EmptyState onClear={() => setRange(DEFAULTS)} /> : (
        <div className="grid md:grid-cols-2 gap-4">
          <Section title={lang === "ar" ? "الإيرادات" : "Revenue"} rows={report.revenue} total={report.totalRevenue} totalLabel={lang === "ar" ? "إجمالي الإيرادات" : "Total revenue"} />
          <Section title={lang === "ar" ? "المصروفات" : "Expenses"} rows={report.expenses} total={report.totalExpenses} totalLabel={lang === "ar" ? "إجمالي المصروفات" : "Total expenses"} />
          <div className="md:col-span-2 card-elevated p-4 flex items-center justify-between">
            <span className="text-sm font-semibold">{lang === "ar" ? "صافي الدخل" : "Net Income"}</span>
            <span className={`text-lg font-bold font-mono ${report.netIncome >= 0 ? "text-success" : "text-destructive"}`}>{fmtMoney(report.netIncome, lang)}</span>
          </div>
        </div>
      )}
    </ReportShell>
  );
}

function Section({ title, rows, total, totalLabel }: { title: string; rows: { account_id: string; name_ar: string; name_en: string; amount: number }[]; total: number; totalLabel: string }) {
  const { lang } = useI18n();
  return (
    <div className="card-elevated overflow-hidden">
      <div className="px-4 py-3 border-b font-semibold text-sm">{title}</div>
      <table className="w-full text-sm">
        <tbody className="divide-y">
          {rows.map((r) => (
            <tr key={r.account_id}>
              <td className="px-4 py-2">{lang === "ar" ? r.name_ar : r.name_en}</td>
              <td className="px-4 py-2 text-end font-mono">{fmtMoney(r.amount, lang)}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={2} className="px-4 py-6 text-center text-muted-foreground text-xs">{lang === "ar" ? "لا توجد بنود" : "No items"}</td></tr>
          )}
        </tbody>
        <tfoot>
          <tr className="bg-muted/40 font-semibold">
            <td className="px-4 py-2">{totalLabel}</td>
            <td className="px-4 py-2 text-end font-mono">{fmtMoney(total, lang)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
