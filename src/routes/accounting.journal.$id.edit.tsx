import { createFileRoute, notFound, useParams } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PermissionGate } from "@/components/PermissionGate";
import { useStore } from "@/lib/store";
import { JournalEditor } from "@/components/accounting/JournalEditor";

export const Route = createFileRoute("/accounting/journal/$id/edit")({
  head: () => ({ meta: [{ title: "Edit Journal Entry — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perm="journal.post" mode="page">
      <EditPage />
    </PermissionGate>
  ),
  notFoundComponent: () => {
    const { id } = useParams({ from: "/accounting/journal/$id/edit" });
    return <AppShell title="Not Found"><p className="text-sm">Journal {id} not found.</p></AppShell>;
  },
});

function EditPage() {
  const { id } = Route.useParams();
  const journal = useStore((s) => s.journal.find((j) => j.id === id));
  if (!journal) throw notFound();
  return <JournalEditor mode="edit" initial={journal} />;
}
