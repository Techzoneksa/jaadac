import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ReportShell, EmptyState, DateRangeFilter } from "@/components/reports/ReportShell";
import { PermissionGate } from "@/components/PermissionGate";
import { useI18n, fmtMoney } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { buildTrialBalanceReport } from "@/lib/services/reports";

const DEFAULTS = { from: "2026-01-01", to: "2026-06-30" };

export const Route = createFileRoute("/reports/trial-balance")({
  head: () => ({ meta: [{ title: "Trial Balance — JAAD CLOUD" }] }),
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
  const r = useMemo(() => buildTrialBalanceReport(s, range), [s, range]);

  return (
    <ReportShell
      titleAr="ميزان المراجعة" titleEn="Trial Balance"
      descAr="إجماليات المدين والدائن لكل حساب خلال الفترة."
      descEn="Total debit and credit per account for the selected period."
      filters={<DateRangeFilter from={range.from} to={range.to} onChange={setRange} />}
    >
      {r.rows.length === 0 ? <EmptyState onClear={() => setRange(DEFAULTS)} /> : (
        <div className="card-elevated overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-start font-medium">{lang === "ar" ? "رقم" : "Code"}</th>
                <th className="px-4 py-3 text-start font-medium">{lang === "ar" ? "الحساب" : "Account"}</th>
                <th className="px-4 py-3 text-end font-medium">{lang === "ar" ? "مدين" : "Debit"}</th>
                <th className="px-4 py-3 text-end font-medium">{lang === "ar" ? "دائن" : "Credit"}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {r.rows.map((row) => (
                <tr key={row.account_id}>
                  <td className="px-4 py-2 font-mono text-xs">{row.number}</td>
                  <td className="px-4 py-2">{lang === "ar" ? row.name_ar : row.name_en}</td>
                  <td className="px-4 py-2 text-end font-mono">{row.debit > 0 ? fmtMoney(row.debit, lang) : "—"}</td>
                  <td className="px-4 py-2 text-end font-mono">{row.credit > 0 ? fmtMoney(row.credit, lang) : "—"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-muted/40 font-semibold">
                <td className="px-4 py-2" colSpan={2}>{lang === "ar" ? "الإجمالي" : "Total"}</td>
                <td className="px-4 py-2 text-end font-mono">{fmtMoney(r.totalDebit, lang)}</td>
                <td className="px-4 py-2 text-end font-mono">{fmtMoney(r.totalCredit, lang)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </ReportShell>
  );
}
