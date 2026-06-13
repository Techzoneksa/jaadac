import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/invoices/")({
  beforeLoad: () => {
    throw redirect({ to: "/invoices/sales" });
  },
});
