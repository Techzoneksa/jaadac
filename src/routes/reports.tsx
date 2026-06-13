import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports — JAAD CLOUD" }] }),
  component: () => <Outlet />,
});
