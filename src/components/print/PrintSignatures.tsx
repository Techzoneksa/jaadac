import React from "react";

export function PrintSignatures() {
  return (
    <div style={{ marginTop: 32, paddingTop: 16, borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-around" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: "9pt", color: "#94a3b8", margin: "0 0 32px" }}>التوقيع</p>
        <p style={{ fontSize: "9pt", color: "#1e293b", fontWeight: 600, margin: 0 }}>المستلم</p>
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: "9pt", color: "#94a3b8", margin: "0 0 32px" }}>التوقيع</p>
        <p style={{ fontSize: "9pt", color: "#1e293b", fontWeight: 600, margin: 0 }}>المحاسب</p>
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: "9pt", color: "#94a3b8", margin: "0 0 32px" }}>الختم</p>
        <p style={{ fontSize: "9pt", color: "#1e293b", fontWeight: 600, margin: 0 }}>الشركة</p>
      </div>
    </div>
  );
}
