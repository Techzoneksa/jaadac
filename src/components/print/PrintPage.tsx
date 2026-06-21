"use client";

import React from "react";
import { Printer, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Props {
  children: React.ReactNode;
  backHref?: string;
}

export function PrintPage({ children, backHref }: Props) {
  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", padding: "24px" }}>
      <div className="print-toolbar" style={{ display: "flex", justifyContent: "center", gap: "12px", padding: "0 0 24px 0", flexWrap: "wrap" }}>
        {backHref && (
          <Link href={backHref}>
            <button className="print-btn" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "10px", fontSize: "14px", fontWeight: 600, color: "#fff", background: "#475569", border: "none", cursor: "pointer" }}>
              <ArrowRight className="h-4 w-4" /> رجوع
            </button>
          </Link>
        )}
        <button onClick={() => window.print()} className="print-btn" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 24px", borderRadius: "10px", fontSize: "14px", fontWeight: 600, color: "#fff", background: "#0f172a", border: "none", cursor: "pointer", boxShadow: "0 2px 8px rgba(15, 23, 42, 0.15)" }}>
          <Printer className="h-4 w-4" /> طباعة الفاتورة
        </button>
        <button onClick={() => window.print()} className="print-btn" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 24px", borderRadius: "10px", fontSize: "14px", fontWeight: 600, color: "#fff", background: "#16a34a", border: "none", cursor: "pointer", boxShadow: "0 2px 8px rgba(15, 23, 42, 0.15)" }}>
          حفظ PDF
        </button>
      </div>
      <div className="print-document" style={{ width: "210mm", minHeight: "297mm", margin: "0 auto", background: "#fff", boxShadow: "0 20px 60px rgba(15, 23, 42, 0.18)", borderRadius: "4px", overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}