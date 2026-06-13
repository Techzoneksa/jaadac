import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ReportShell, EmptyState, DateRangeFilter } from "@/components/reports/ReportShell";
import { PermissionGate } from "@/components/PermissionGate";
import { useI18n, fmtMoney } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { buildVatReport } from "@/lib/services/reports";

const DEFAULTS = { from: "2026-01-01", to: "2026-06-30" };

export const Route = createFileRoute("/reports/vat")({
  head: () => ({ meta: [{ title: "VAT Report — JAAD CLOUD" }] }),
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
  const r = useMemo(() => buildVatReport(s, range), [s, range]);
  const isEmpty = r.outputVat === 0 && r.inputVat === 0;

  return (
    <ReportShell
      titleAr="تقرير ضريبة القيمة المضافة" titleEn="VAT Report"
      descAr="ملخص ضريبة المخرجات والمدخلات وصافي الضريبة للفترة."
      descEn="Output VAT, input VAT, and net VAT summary for the period."
      filters={<DateRangeFilter from={range.from} to={range.to} onChange={setRange} />}
    >
      {isEmpty ? <EmptyState onClear={() => setRange(DEFAULTS)} /> : (
        <div className="grid md:grid-cols-2 gap-3">
          <Box label={lang === "ar" ? "قاعدة المبيعات" : "Sales base"} value={r.salesBase} muted />
          <Box label={lang === "ar" ? "قاعدة المشتريات" : "Purchase base"} value={r.purchaseBase} muted />
          <Box label={lang === "ar" ? "ضريبة المخرجات" : "Output VAT"} value={r.outputVat} />
          <Box label={lang === "ar" ? "ضريبة المدخلات" : "Input VAT"} value={r.inputVat} />
          <div className="md:col-span-2 card-elevated p-4 flex items-center justify-between border-primary/40">
            <span className="text-sm font-semibold">{lang === "ar" ? "صافي الضريبة المستحقة" : "Net VAT payable"}</span>
            <span className={`font-mono text-lg font-bold ${r.netVat >= 0 ? "text-destructive" : "text-success"}`}>{fmtMoney(r.netVat, lang)}</span>
          </div>
        </div>
      )}
    </ReportShell>
  );
}

function Box({ label, value, muted }: { label: string; value: number; muted?: boolean }) {
  const { lang } = useI18n();
  return (
    <div className={`card-elevated p-4 ${muted ? "opacity-80" : ""}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold mt-1 font-mono">{fmtMoney(value, lang)}</div>
    </div>
  );
}
