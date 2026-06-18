import React from "react";
import { formatCurrency } from "./format";

interface Props {
  subtotal: number;
  vatTotal: number;
  total: number;
  discount?: number;
  paidAmount?: number;
  remaining?: number;
}

export function PrintTotals({ subtotal, vatTotal, total, discount, paidAmount, remaining }: Props) {
  return (
    <div style={{ textAlign: "left", marginTop: 16, padding: "16px 20px", borderTop: "2px solid #e2e8f0", background: "#f8fafc", borderRadius: 6 }}>
      <table style={{ width: "auto", marginLeft: "auto", borderCollapse: "collapse", fontSize: "10pt" }}>
        <tbody>
          <tr><td style={{ padding: "3px 16px 3px 0", color: "#64748b" }}>المجموع الفرعي</td><td style={{ padding: "3px 0", fontWeight: 600, color: "#1e293b" }}>{formatCurrency(subtotal)}</td></tr>
          {discount ? <tr><td style={{ padding: "3px 16px 3px 0", color: "#64748b" }}>الخصم</td><td style={{ padding: "3px 0", fontWeight: 600, color: "#dc2626" }}>-{formatCurrency(discount)}</td></tr> : null}
          <tr><td style={{ padding: "3px 16px 3px 0", color: "#64748b" }}>ضريبة القيمة المضافة</td><td style={{ padding: "3px 0", fontWeight: 600, color: "#1e293b" }}>{formatCurrency(vatTotal)}</td></tr>
          <tr style={{ borderTop: "2px solid #1e293b" }}>
            <td style={{ padding: "8px 16px 3px 0", fontWeight: 800, fontSize: "14pt", color: "#1e293b" }}>الإجمالي</td>
            <td style={{ padding: "8px 0 3px 0", fontWeight: 800, fontSize: "14pt", color: "#1e293b" }}>{formatCurrency(total)}</td>
          </tr>
          {paidAmount != null && paidAmount > 0 && (
            <>
              <tr><td style={{ padding: "3px 16px 3px 0", color: "#16a34a" }}>المدفوع</td><td style={{ padding: "3px 0", fontWeight: 600, color: "#16a34a" }}>{formatCurrency(paidAmount)}</td></tr>
              <tr><td style={{ padding: "3px 16px 3px 0", color: remaining && remaining > 0 ? "#dc2626" : "#16a34a" }}>{remaining && remaining > 0 ? "المتبقي" : "حالة الدفع"}</td><td style={{ padding: "3px 0", fontWeight: 600, color: remaining && remaining > 0 ? "#dc2626" : "#16a34a" }}>{remaining && remaining > 0 ? formatCurrency(remaining) : "مدفوعة بالكامل ✓"}</td></tr>
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}
