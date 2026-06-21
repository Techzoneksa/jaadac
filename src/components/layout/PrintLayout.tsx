"use client";

import { Toaster } from "@/components/ui/sonner";

export function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div style={{ background: "#f3f4f6", minHeight: "100vh" }}>
        {children}
      </div>
      <Toaster />
    </>
  );
}