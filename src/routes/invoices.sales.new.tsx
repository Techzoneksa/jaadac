import { createFileRoute } from "@tanstack/react-router";
import { PermissionGate } from "@/components/PermissionGate";
import { SalesInvoiceEditor } from "@/components/documents/SalesInvoiceEditor";

export const Route = createFileRoute("/invoices/sales/new")({
  head: () => ({ meta: [{ title: "New Sales Invoice — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perm="invoices.create" mode="page">
      <SalesInvoiceEditor editing={null} />
    </PermissionGate>
  ),
});
