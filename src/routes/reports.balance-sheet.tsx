import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ReportShell, EmptyState } from "@/components/reports/ReportShell";
import { PermissionGate } from "@/components/PermissionGate";
import { useI18n, fmtMoney } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { buildBalanceSheetReport } from "@/lib/services/reports";

const DEFAULT_ASOF = "2026-06-30";

export const Route = createFileRoute("/reports/balance-sheet")({
  head: () => ({ meta: [{ title: "Balance Sheet — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perm="reports.view" mode="page">
      <Page />
    </PermissionGate>
  ),
});

function Page() {
  const { lang } = useI18n();
  const s = useStore((x) => x);
  const [asOf, setAsOf] = useState(DEFAULT_ASOF);
  const r = useMemo(() => buildBalanceSheetReport(s, asOf), [s, asOf]);
  const isEmpty = r.assets.length === 0 && r.liabilities.length === 0 && r.equity.length === 0;

  return (
    <ReportShell
      titleAr="الميزانية العمومية" titleEn="Balance Sheet"
      descAr="الأصول والالتزامات وحقوق الملكية حتى تاريخ معين."
      descEn="Assets, liabilities, and equity as of the selected date."
      filters={
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">{lang === "ar" ? "حتى تاريخ" : "As of"}</label>
          <input type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} className="h-9 rounded-md border bg-background px-2 text-sm" />
        </div>
      }
    >
      {isEmpty ? <EmptyState onClear={() => setAsOf(DEFAULT_ASOF)} /> : (
        <div className="grid md:grid-cols-3 gap-4">
          <Block title={lang === "ar" ? "الأصول" : "Assets"} rows={r.assets} total={r.totalAssets} />
          <Block title={lang === "ar" ? "الالتزامات" : "Liabilities"} rows={r.liabilities} total={r.totalLiabilities} />
          <Block title={lang === "ar" ? "حقوق الملكية" : "Equity"} rows={r.equity} extra={{ label: lang === "ar" ? "صافي الدخل (الفترة)" : "Net income (period)", value: r.netIncome }} total={r.totalEquity} />
        </div>
      )}
    </ReportShell>
  );
}

function Block({ title, rows, total, extra }: { title: string; rows: { account_id: string; name_ar: string; name_en: string; amount: number }[]; total: number; extra?: { label: string; value: number } }) {
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
          {extra && (
            <tr><td className="px-4 py-2 italic">{extra.label}</td><td className="px-4 py-2 text-end font-mono">{fmtMoney(extra.value, lang)}</td></tr>
          )}
        </tbody>
        <tfoot>
          <tr className="bg-muted/40 font-semibold">
            <td className="px-4 py-2">{lang === "ar" ? "الإجمالي" : "Total"}</td>
            <td className="px-4 py-2 text-end font-mono">{fmtMoney(total, lang)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
