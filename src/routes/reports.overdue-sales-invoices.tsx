import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ReportShell, EmptyState } from "@/components/reports/ReportShell";
import { PermissionGate } from "@/components/PermissionGate";
import { useI18n, fmtMoney } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { buildAgedInvoiceReports } from "@/lib/services/reports";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/reports/overdue-sales-invoices")({
  head: () => ({ meta: [{ title: "Overdue Sales Invoices — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perm="reports.view" mode="page">
      <Page />
    </PermissionGate>
  ),
});

function Page() {
  const { lang } = useI18n();
  const s = useStore((x) => x);
  const rows = useMemo(() => buildAgedInvoiceReports(s, { overdueOnly: true, today: "2026-06-30" }), [s]);
  const total = rows.reduce((sum, r) => sum + r.remaining, 0);

  return (
    <ReportShell
      titleAr="فواتير مبيعات متأخرة" titleEn="Overdue Sales Invoices"
      descAr="فواتير المبيعات التي تجاوزت تاريخ استحقاقها ولم تُسدد بالكامل."
      descEn="Sales invoices past their due date with outstanding balance."
    >
      {rows.length === 0 ? (
        <EmptyState message={lang === "ar" ? "لا توجد فواتير متأخرة." : "No overdue invoices."} />
      ) : (
        <>
          <div className="card-elevated p-4 mb-4 flex items-center justify-between border-destructive/30">
            <span className="text-sm font-medium">{lang === "ar" ? "إجمالي المتأخرات" : "Total overdue"}</span>
            <span className="font-mono text-lg font-bold text-destructive">{fmtMoney(total, lang)}</span>
          </div>
          <div className="card-elevated overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">{lang === "ar" ? "رقم" : "Number"}</th>
                  <th className="px-4 py-3 text-start font-medium">{lang === "ar" ? "العميل" : "Customer"}</th>
                  <th className="px-4 py-3 text-start font-medium">{lang === "ar" ? "الاستحقاق" : "Due"}</th>
                  <th className="px-4 py-3 text-end font-medium">{lang === "ar" ? "المتبقي" : "Outstanding"}</th>
                  <th className="px-4 py-3 text-end font-medium">{lang === "ar" ? "أيام التأخير" : "Days overdue"}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-2 font-mono">{r.number}</td>
                    <td className="px-4 py-2">{lang === "ar" ? r.customer_ar : r.customer_en}</td>
                    <td className="px-4 py-2">{r.due}</td>
                    <td className="px-4 py-2 text-end font-mono font-semibold">{fmtMoney(r.remaining, lang)}</td>
                    <td className="px-4 py-2 text-end">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">{r.daysOverdue}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <Link to="/receipts"><Button size="sm">{lang === "ar" ? "تسجيل سند قبض" : "Record receipt"}</Button></Link>
          </div>
        </>
      )}
    </ReportShell>
  );
}
