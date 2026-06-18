import React from "react";

interface Party {
  name?: string;
  vat?: string;
  mobile?: string;
  email?: string;
  address?: string;
}

interface Props {
  label: string;
  party: Party | null;
}

export function PrintPartyInfo({ label, party }: Props) {
  if (!party || !party.name) return null;
  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 6, padding: "12px 16px", marginBottom: 20, background: "#f8fafc" }}>
      <p style={{ fontSize: "9pt", fontWeight: 700, color: "#64748b", margin: "0 0 6px" }}>{label}</p>
      <p style={{ fontSize: "11pt", fontWeight: 600, color: "#1e293b", margin: "2px 0" }}>{party.name}</p>
      {party.vat && <p style={{ fontSize: "9pt", color: "#475569", margin: "1px 0" }}>الرقم الضريبي: {party.vat}</p>}
      {party.mobile && <p style={{ fontSize: "9pt", color: "#475569", margin: "1px 0" }}>جوال: {party.mobile}</p>}
      {party.email && <p style={{ fontSize: "9pt", color: "#475569", margin: "1px 0" }}>بريد: {party.email}</p>}
      {party.address && <p style={{ fontSize: "9pt", color: "#475569", margin: "1px 0" }}>عنوان: {party.address}</p>}
    </div>
  );
}
