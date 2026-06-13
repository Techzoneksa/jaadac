import { createFileRoute } from "@tanstack/react-router";
import { PermissionGate } from "@/components/PermissionGate";
import { QuotationEditor } from "@/components/documents/QuotationEditor";

export const Route = createFileRoute("/quotations/new")({
  head: () => ({ meta: [{ title: "New Quotation — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perm="quotations.manage" mode="page">
      <QuotationEditor editing={null} />
    </PermissionGate>
  ),
});
