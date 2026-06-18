import React from "react";
import { PrintButton } from "@/components/layout/PrintButton";

interface Props {
  children: React.ReactNode;
}

export function PrintPage({ children }: Props) {
  return (
    <div className="print-page">
      <div className="no-print print-toolbar"><PrintButton /></div>
      <div className="print-document" style={{ fontFamily: "Arial, sans-serif", direction: "rtl" }}>
        {children}
      </div>
    </div>
  );
}
