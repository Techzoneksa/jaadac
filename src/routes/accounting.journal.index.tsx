import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n, fmtMoney } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { Plus, Eye, Pencil } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { PermissionGate } from "@/components/PermissionGate";

export const Route = createFileRoute("/accounting/journal/")({
  head: () => ({ meta: [{ title: "Journal Entries — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perm="accounting.view" mode="page">
      <JournalListPage />
    </PermissionGate>
  ),
});

function JournalListPage() {
  const { t, lang } = useI18n();
  const { can } = useAuth();
  const journal = useStore((s) => s.journal);
  const canPost = can("journal.post");

  return (
    <AppShell
      title={t("journal_entries")}
      action={canPost ? (
        <Link to="/accounting/journal/new">
          <Button><Plus className="size-4 me-1" />{lang === "ar" ? "إنشاء قيد" : "Create Journal Entry"}</Button>
        </Link>
      ) : null}
    >
      <div className="card-elevated">
        {journal.length === 0 ? <EmptyState /> : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-start font-medium">{t("number")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("date")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("description")}</th>
                <th className="px-4 py-3 text-end font-medium">{t("debit")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("status")}</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y">
              {journal.map((j) => {
                const total = j.lines.reduce((s, l) => s + l.debit, 0);
                return (
                  <tr key={j.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono font-medium">{j.number}</td>
                    <td className="px-4 py-3">{j.date}</td>
                    <td className="px-4 py-3">{j.description}</td>
                    <td className="px-4 py-3 text-end font-mono">{fmtMoney(total, lang)}</td>
                    <td className="px-4 py-3"><StatusBadge status={j.status} /></td>
                    <td className="px-4 py-3 text-end">
                      <div className="flex items-center justify-end gap-1">
                        <Link to="/accounting/journal/$id" params={{ id: j.id }}>
                          <Button size="sm" variant="ghost" title={lang === "ar" ? "عرض" : "View"}><Eye className="size-4" /></Button>
                        </Link>
                        {j.status === "draft" && canPost && (
                          <Link to="/accounting/journal/$id/edit" params={{ id: j.id }}>
                            <Button size="sm" variant="ghost" title={lang === "ar" ? "تعديل" : "Edit"}><Pencil className="size-4" /></Button>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  );
}
