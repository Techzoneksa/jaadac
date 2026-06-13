import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { PermissionGate } from "@/components/PermissionGate";
import { SalesInvoiceEditor } from "@/components/documents/SalesInvoiceEditor";
import { useStore } from "@/lib/store";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/invoices/sales/$id/edit")({
  head: () => ({ meta: [{ title: "Edit Sales Invoice — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perm="invoices.create" mode="page">
      <EditWrapper />
    </PermissionGate>
  ),
});

function EditWrapper() {
  const { id } = useParams({ from: "/invoices/sales/$id/edit" });
  const { t } = useI18n();
  const editing = useStore((s) => s.invoices.find((i) => i.id === id) || null);
  if (!editing) {
    return (
      <AppShell title={t("not_found")}>
        <div className="card-elevated p-8 text-center space-y-3">
          <p className="text-muted-foreground">{t("empty")}</p>
          <Button asChild><Link to="/invoices/sales">{t("back")}</Link></Button>
        </div>
      </AppShell>
    );
  }
  return <SalesInvoiceEditor editing={editing} />;
}
