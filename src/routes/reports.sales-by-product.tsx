import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ReportShell, EmptyState, DateRangeFilter } from "@/components/reports/ReportShell";
import { PermissionGate } from "@/components/PermissionGate";
import { useI18n, fmtMoney } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { buildSalesByProductReport } from "@/lib/services/reports";

const DEFAULTS = { from: "2026-01-01", to: "2026-06-30" };

export const Route = createFileRoute("/reports/sales-by-product")({
  head: () => ({ meta: [{ title: "Sales by Product — JAAD CLOUD" }] }),
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
  const rows = useMemo(() => buildSalesByProductReport(s, range), [s, range]);

  return (
    <ReportShell
      titleAr="المبيعات حسب المنتج أو الخدمة" titleEn="Sales by Product/Service"
      descAr="أعلى المنتجات والخدمات مبيعًا خلال الفترة."
      descEn="Top selling products and services for the selected period."
      filters={<DateRangeFilter from={range.from} to={range.to} onChange={setRange} />}
    >
      {rows.length === 0 ? <EmptyState onClear={() => setRange(DEFAULTS)} /> : (
        <div className="card-elevated overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-start font-medium">{lang === "ar" ? "البند" : "Item"}</th>
                <th className="px-4 py-3 text-end font-medium">{lang === "ar" ? "الكمية" : "Qty"}</th>
                <th className="px-4 py-3 text-end font-medium">{lang === "ar" ? "الإيرادات" : "Revenue"}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r) => (
                <tr key={r.item_id}>
                  <td className="px-4 py-2">{lang === "ar" ? r.name_ar : r.name_en}</td>
                  <td className="px-4 py-2 text-end font-mono">{r.qty}</td>
                  <td className="px-4 py-2 text-end font-mono font-semibold">{fmtMoney(r.revenue, lang)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ReportShell>
  );
}
