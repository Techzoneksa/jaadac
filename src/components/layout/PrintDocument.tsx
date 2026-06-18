import type React from "react";

interface PrintDocumentProps {
  children: React.ReactNode;
  onPrint?: () => void;
}

export function PrintDocument({ children, onPrint }: PrintDocumentProps) {
  return (
    <div className="print-page">
      <div className="no-print print-toolbar">
        <button onClick={onPrint || (() => window.print())} className="print-btn">
          طباعة المستند
        </button>
      </div>
      <div className="print-document">
        {children}
      </div>
    </div>
  );
}
