import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/invoices")({
  head: () => ({ meta: [{ title: "Invoices — JAAD CLOUD" }] }),
  component: () => <Outlet />,
});
