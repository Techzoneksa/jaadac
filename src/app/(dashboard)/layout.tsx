"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Toaster } from "@/components/ui/sonner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPrint = pathname?.split("/").includes("print");

  if (isPrint) {
    return <><div className="print-document">{children}</div><Toaster /></>;
  }

  return <><AppShell>{children}</AppShell><Toaster /></>;
}
