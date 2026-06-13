import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/accounting/journal")({
  head: () => ({ meta: [{ title: "Journal Entries — JAAD CLOUD" }] }),
  component: () => <Outlet />,
});
