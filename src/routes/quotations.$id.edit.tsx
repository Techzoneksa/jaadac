import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { PermissionGate } from "@/components/PermissionGate";
import { QuotationEditor } from "@/components/documents/QuotationEditor";
import { useStore } from "@/lib/store";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/quotations/$id/edit")({
  head: () => ({ meta: [{ title: "Edit Quotation — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perm="quotations.manage" mode="page">
      <EditWrapper />
    </PermissionGate>
  ),
});

function EditWrapper() {
  const { id } = useParams({ from: "/quotations/$id/edit" });
  const { t } = useI18n();
  const editing = useStore((s) => s.quotations.find((q) => q.id === id) || null);
  if (!editing) {
    return (
      <AppShell title={t("not_found")}>
        <div className="card-elevated p-8 text-center space-y-3">
          <p className="text-muted-foreground">{t("empty")}</p>
          <Button asChild><Link to="/quotations">{t("back")}</Link></Button>
        </div>
      </AppShell>
    );
  }
  return <QuotationEditor editing={editing} />;
}
