"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isPrintRoute, setIsPrintRoute] = useState(false);

  useEffect(() => {
    setIsPrintRoute(pathname?.includes("/print") ?? false);
  }, [pathname]);

  if (isPrintRoute) {
    return <>{children}</>;
  }

  return <><AppShell>{children}</AppShell><Toaster /></>;
}
