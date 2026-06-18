"use client";

import { Toaster } from "@/components/ui/sonner";

export function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
        {children}
      </div>
      <Toaster />
    </>
  );
}
