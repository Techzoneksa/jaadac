import React from "react";

interface Props {
  notes?: string | null;
}

export function PrintNotes({ notes }: Props) {
  if (!notes) return null;
  return (
    <div style={{ marginTop: 16, padding: "12px 0", borderTop: "1px solid #e2e8f0" }}>
      <p style={{ fontSize: "8pt", fontWeight: 700, color: "#64748b", margin: "0 0 4px" }}>ملاحظات</p>
      <p style={{ fontSize: "9pt", color: "#475569", margin: 0, whiteSpace: "pre-wrap" }}>{notes}</p>
    </div>
  );
}
