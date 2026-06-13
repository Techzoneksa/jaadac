import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { PermissionGate } from "@/components/PermissionGate";
import { PurchaseInvoiceEditor } from "@/components/documents/PurchaseInvoiceEditor";
import { useStore } from "@/lib/store";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/invoices/purchases/$id/edit")({
  head: () => ({ meta: [{ title: "Edit Purchase Invoice — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perm="invoices.create" mode="page">
      <EditWrapper />
    </PermissionGate>
  ),
});

function EditWrapper() {
  const { id } = useParams({ from: "/invoices/purchases/$id/edit" });
  const { t } = useI18n();
  const editing = useStore((s) => s.purchase_invoices.find((p) => p.id === id) || null);
  if (!editing) {
    return (
      <AppShell title={t("not_found")}>
        <div className="card-elevated p-8 text-center space-y-3">
          <p className="text-muted-foreground">{t("empty")}</p>
          <Button asChild><Link to="/invoices/purchases">{t("back")}</Link></Button>
        </div>
      </AppShell>
    );
  }
  return <PurchaseInvoiceEditor editing={editing} />;
}
