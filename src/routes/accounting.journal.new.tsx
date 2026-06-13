import { createFileRoute } from "@tanstack/react-router";
import { PermissionGate } from "@/components/PermissionGate";
import { JournalEditor } from "@/components/accounting/JournalEditor";

export const Route = createFileRoute("/accounting/journal/new")({
  head: () => ({ meta: [{ title: "Create Journal Entry — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perm="journal.post" mode="page">
      <JournalEditor mode="new" />
    </PermissionGate>
  ),
});
