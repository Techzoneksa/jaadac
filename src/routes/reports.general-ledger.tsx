import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ReportShell, EmptyState, DateRangeFilter } from "@/components/reports/ReportShell";
import { PermissionGate } from "@/components/PermissionGate";
import { useI18n, fmtMoney } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { buildGeneralLedger } from "@/lib/services/reports";

const DEFAULTS = { from: "2026-01-01", to: "2026-06-30" };

export const Route = createFileRoute("/reports/general-ledger")({
  head: () => ({ meta: [{ title: "General Ledger — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perm="reports.view" mode="page">
      <Page />
    </PermissionGate>
  ),
});

function Page() {
  const { lang } = useI18n();
  const s = useStore((x) => x);
  const postingAccounts = useMemo(() => s.accounts.filter((a) => a.kind === "posting"), [s.accounts]);
  const [accountId, setAccountId] = useState(postingAccounts[0]?.id ?? "");
  const [range, setRange] = useState(DEFAULTS);
  const rows = useMemo(() => accountId ? buildGeneralLedger(s, accountId, range) : [], [s, accountId, range]);

  return (
    <ReportShell
      titleAr="دفتر الأستاذ العام" titleEn="General Ledger"
      descAr="جميع الحركات المرحّلة على حساب معيّن خلال الفترة."
      descEn="All posted entries for a selected account within the period."
      filters={
        <>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">{lang === "ar" ? "الحساب" : "Account"}</label>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="h-9 rounded-md border bg-background px-2 text-sm min-w-[16rem]">
              {postingAccounts.map((a) => (
                <option key={a.id} value={a.id}>{a.number} — {lang === "ar" ? a.name_ar : a.name_en}</option>
              ))}
            </select>
          </div>
          <DateRangeFilter from={range.from} to={range.to} onChange={setRange} />
        </>
      }
    >
      {rows.length === 0 ? <EmptyState onClear={() => setRange(DEFAULTS)} /> : (
        <div className="card-elevated overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-start font-medium">{lang === "ar" ? "التاريخ" : "Date"}</th>
                <th className="px-4 py-3 text-start font-medium">{lang === "ar" ? "القيد" : "Entry"}</th>
                <th className="px-4 py-3 text-start font-medium">{lang === "ar" ? "الوصف" : "Description"}</th>
                <th className="px-4 py-3 text-end font-medium">{lang === "ar" ? "مدين" : "Debit"}</th>
                <th className="px-4 py-3 text-end font-medium">{lang === "ar" ? "دائن" : "Credit"}</th>
                <th className="px-4 py-3 text-end font-medium">{lang === "ar" ? "الرصيد" : "Balance"}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r, i) => (
                <tr key={i}>
                  <td className="px-4 py-2">{r.date}</td>
                  <td className="px-4 py-2 font-mono text-xs">{r.je_number}</td>
                  <td className="px-4 py-2">{r.description}</td>
                  <td className="px-4 py-2 text-end font-mono">{r.debit > 0 ? fmtMoney(r.debit, lang) : "—"}</td>
                  <td className="px-4 py-2 text-end font-mono">{r.credit > 0 ? fmtMoney(r.credit, lang) : "—"}</td>
                  <td className="px-4 py-2 text-end font-mono font-semibold">{fmtMoney(r.balance, lang)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ReportShell>
  );
}
