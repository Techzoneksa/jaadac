import React from "react";
import { formatCurrency } from "./format";

interface Line {
  description: string;
  qty?: number;
  unit_price?: number;
  vat_rate?: number;
  total?: number;
}

interface Props {
  lines: Line[];
}

export function PrintItemsTable({ lines }: Props) {
  const hasVatCol = lines.some((l) => l.vat_rate !== undefined && l.vat_rate !== null);

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9pt", marginBottom: 20 }}>
      <thead>
        <tr style={{ background: "#f1f5f9", borderBottom: "2px solid #e2e8f0" }}>
          <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: "#475569", width: "5%" }}>#</th>
          <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: "#475569" }}>البيان</th>
          <th style={{ padding: "8px 10px", textAlign: "center", fontWeight: 700, color: "#475569", width: "10%" }}>الكمية</th>
          <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, color: "#475569", width: "15%" }}>سعر الوحدة</th>
          {hasVatCol && <th style={{ padding: "8px 10px", textAlign: "center", fontWeight: 700, color: "#475569", width: "8%" }}>الضريبة</th>}
          <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, color: "#475569", width: "17%" }}>الإجمالي</th>
        </tr>
      </thead>
      <tbody>
        {lines.length === 0 ? (
          <tr><td colSpan={hasVatCol ? 6 : 5} style={{ padding: 20, textAlign: "center", color: "#94a3b8" }}>لا توجد بنود</td></tr>
        ) : lines.map((l, i) => (
          <tr key={i} style={{ borderBottom: "1px solid #e2e8f0" }}>
            <td style={{ padding: "7px 10px", textAlign: "right", color: "#94a3b8" }}>{i + 1}</td>
            <td style={{ padding: "7px 10px", textAlign: "right", color: "#1e293b" }}>{l.description}</td>
            <td style={{ padding: "7px 10px", textAlign: "center", color: "#1e293b" }}>{l.qty ?? "—"}</td>
            <td style={{ padding: "7px 10px", textAlign: "left", color: "#1e293b" }}>{l.unit_price != null ? formatCurrency(l.unit_price) : "—"}</td>
            {hasVatCol && <td style={{ padding: "7px 10px", textAlign: "center", color: "#1e293b" }}>{l.vat_rate != null ? `${l.vat_rate}%` : "—"}</td>}
            <td style={{ padding: "7px 10px", textAlign: "left", fontWeight: 600, color: "#1e293b" }}>{l.total != null ? formatCurrency(l.total) : "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
