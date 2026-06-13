import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/quotations")({
  head: () => ({ meta: [{ title: "Quotations — JAAD CLOUD" }] }),
  component: () => <Outlet />,
});
