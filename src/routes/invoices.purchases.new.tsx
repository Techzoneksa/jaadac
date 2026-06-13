import { createFileRoute } from "@tanstack/react-router";
import { PermissionGate } from "@/components/PermissionGate";
import { PurchaseInvoiceEditor } from "@/components/documents/PurchaseInvoiceEditor";

export const Route = createFileRoute("/invoices/purchases/new")({
  head: () => ({ meta: [{ title: "New Purchase Invoice — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perm="invoices.create" mode="page">
      <PurchaseInvoiceEditor editing={null} />
    </PermissionGate>
  ),
});
