import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ReportShell, EmptyState, DateRangeFilter } from "@/components/reports/ReportShell";
import { PermissionGate } from "@/components/PermissionGate";
import { useI18n, fmtMoney } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { buildCashFlowReport } from "@/lib/services/reports";

const DEFAULTS = { from: "2026-01-01", to: "2026-06-30" };

export const Route = createFileRoute("/reports/cash-flow")({
  head: () => ({ meta: [{ title: "Cash Flow — JAAD CLOUD" }] }),
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
  const r = useMemo(() => buildCashFlowReport(s, range), [s, range]);
  const isEmpty = r.operating === 0 && r.investing === 0 && r.financing === 0;

  return (
    <ReportShell
      titleAr="التدفق النقدي" titleEn="Cash Flow"
      descAr="حركة النقد خلال الفترة موزعة على التشغيل والاستثمار والتمويل."
      descEn="Cash movements split across operating, investing, and financing activities."
      filters={<DateRangeFilter from={range.from} to={range.to} onChange={setRange} />}
    >
      {isEmpty ? <EmptyState onClear={() => setRange(DEFAULTS)} /> : (
        <div className="grid md:grid-cols-2 gap-3">
          <Row label={lang === "ar" ? "الأنشطة التشغيلية" : "Operating activities"} value={r.operating} />
          <Row label={lang === "ar" ? "الأنشطة الاستثمارية" : "Investing activities"} value={r.investing} />
          <Row label={lang === "ar" ? "الأنشطة التمويلية" : "Financing activities"} value={r.financing} />
          <Row label={lang === "ar" ? "صافي التغير في النقد" : "Net change in cash"} value={r.netChange} highlight />
        </div>
      )}
    </ReportShell>
  );
}

function Row({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  const { lang } = useI18n();
  return (
    <div className={`card-elevated p-4 flex items-center justify-between ${highlight ? "md:col-span-2 border-primary/40" : ""}`}>
      <span className={`text-sm ${highlight ? "font-semibold" : ""}`}>{label}</span>
      <span className={`font-mono ${highlight ? "text-lg font-bold" : ""} ${value >= 0 ? "text-success" : "text-destructive"}`}>{fmtMoney(value, lang)}</span>
    </div>
  );
}
