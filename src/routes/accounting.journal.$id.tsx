import { createFileRoute, Link, notFound, useParams } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PermissionGate } from "@/components/PermissionGate";
import { useI18n, fmtMoney } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { ArrowLeft, ArrowRight, Pencil } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/accounting/journal/$id")({
  head: () => ({ meta: [{ title: "Journal Entry — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perm="accounting.view" mode="page">
      <ViewPage />
    </PermissionGate>
  ),
  notFoundComponent: () => {
    const { id } = useParams({ from: "/accounting/journal/$id" });
    return <AppShell title="Not Found"><p className="text-sm">Journal {id} not found.</p></AppShell>;
  },
});

function ViewPage() {
  const { id } = Route.useParams();
  const { lang, dir } = useI18n();
  const { can } = useAuth();
  const journal = useStore((s) => s.journal.find((j) => j.id === id));
  const accounts = useStore((s) => s.accounts);
  if (!journal) throw notFound();

  const totalD = journal.lines.reduce((s, l) => s + l.debit, 0);
  const totalC = journal.lines.reduce((s, l) => s + l.credit, 0);
  const BackIcon = dir === "rtl" ? ArrowRight : ArrowLeft;
  const canEdit = can("journal.post") && journal.status === "draft";

  return (
    <AppShell
      title={lang === "ar" ? `عرض قيد ${journal.number}` : `Journal ${journal.number}`}
      action={canEdit ? (
        <Link to="/accounting/journal/$id/edit" params={{ id: journal.id }}>
          <Button size="sm"><Pencil className="size-4 me-1" />{lang === "ar" ? "تعديل" : "Edit"}</Button>
        </Link>
      ) : null}
    >
      <div className="space-y-4">
        <Link to="/accounting/journal" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <BackIcon className="size-4" />{lang === "ar" ? "العودة للقائمة" : "Back to list"}
        </Link>

        <div className="card-elevated p-4 grid sm:grid-cols-4 gap-3">
          <Info label={lang === "ar" ? "رقم القيد" : "Number"} value={journal.number} mono />
          <Info label={lang === "ar" ? "التاريخ" : "Date"} value={journal.date} />
          <Info label={lang === "ar" ? "الحالة" : "Status"} value={<StatusBadge status={journal.status} />} />
          <Info label={lang === "ar" ? "المصدر" : "Source"} value={journal.source || journal.source_type || "—"} />
          <div className="sm:col-span-4">
            <Info label={lang === "ar" ? "الوصف" : "Description"} value={journal.description} />
          </div>
        </div>

        <div className="card-elevated overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-start font-medium">{lang === "ar" ? "الحساب" : "Account"}</th>
                <th className="px-4 py-3 text-start font-medium">{lang === "ar" ? "الوصف" : "Description"}</th>
                <th className="px-4 py-3 text-end font-medium">{lang === "ar" ? "مدين" : "Debit"}</th>
                <th className="px-4 py-3 text-end font-medium">{lang === "ar" ? "دائن" : "Credit"}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {journal.lines.map((l, i) => {
                const a = accounts.find((x) => x.id === l.account_id);
                return (
                  <tr key={i}>
                    <td className="px-4 py-2">{a ? `${a.number} — ${lang === "ar" ? a.name_ar : a.name_en}` : "—"}</td>
                    <td className="px-4 py-2 text-muted-foreground">{l.description || "—"}</td>
                    <td className="px-4 py-2 text-end font-mono">{l.debit ? fmtMoney(l.debit, lang) : "—"}</td>
                    <td className="px-4 py-2 text-end font-mono">{l.credit ? fmtMoney(l.credit, lang) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-muted/40 font-semibold">
                <td className="px-4 py-2" colSpan={2}>{lang === "ar" ? "الإجمالي" : "Total"}</td>
                <td className="px-4 py-2 text-end font-mono">{fmtMoney(totalD, lang)}</td>
                <td className="px-4 py-2 text-end font-mono">{fmtMoney(totalC, lang)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </AppShell>
  );
}

function Info({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-sm font-medium mt-0.5 ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}
