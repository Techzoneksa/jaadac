"use client";
import React from "react";
import { getStatusLabel } from "@/lib/format";

interface CompanyInfo {
  name_ar?: string;
  name_en?: string;
  vat?: string;
  cr?: string;
  phone?: string;
  email?: string;
  address?: string;
  logo_url?: string;
}

interface Props {
  company: CompanyInfo | null;
  title: string;
  number: string;
  date: string;
  status?: string;
  showQR?: boolean;
}

export function PrintHeader({ company, title, number, date, status, showQR }: Props) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #1e293b", paddingBottom: "24px", marginBottom: "24px" }}>
      <div>
        <h1 style={{ fontSize: "18pt", fontWeight: 800, color: "#1e293b", margin: 0 }}>{company?.name_ar || ""}</h1>
        {company?.name_en && <p style={{ fontSize: "9pt", color: "#64748b", margin: "2px 0 8px" }}>{company.name_en}</p>}
        {company?.vat && <p style={{ fontSize: "9pt", color: "#475569", margin: "1px 0" }}>الرقم الضريبي: {company.vat}</p>}
        {company?.cr && <p style={{ fontSize: "9pt", color: "#475569", margin: "1px 0" }}>سجل تجاري: {company.cr}</p>}
        {company?.phone && <p style={{ fontSize: "9pt", color: "#475569", margin: "1px 0" }}>هاتف: {company.phone}</p>}
        {company?.email && <p style={{ fontSize: "9pt", color: "#475569", margin: "1px 0" }}>بريد: {company.email}</p>}
        {company?.address && <p style={{ fontSize: "9pt", color: "#475569", margin: "1px 0" }}>{company.address}</p>}
      </div>
      <div style={{ textAlign: "left" }}>
        <h2 style={{ fontSize: "16pt", fontWeight: 700, color: "#1e293b", margin: "0 0 8px" }}>{title}</h2>
        <p style={{ fontSize: "10pt", color: "#475569", margin: "2px 0" }}>رقم: {number}</p>
        <p style={{ fontSize: "10pt", color: "#475569", margin: "2px 0" }}>تاريخ: {date}</p>
        {status && <p style={{ fontSize: "10pt", color: "#475569", margin: "2px 0" }}>الحالة: {getStatusLabel(status)}</p>}
        {showQR && (
          <div style={{ marginTop: 12, textAlign: "center" }}>
            <div style={{ display: "inline-block", border: "1px solid #e2e8f0", borderRadius: 4, padding: 4, background: "#fff" }}>
              <svg width="60" height="60" viewBox="0 0 100 100" fill="#1e293b"><rect x="0" y="0" width="20" height="20" /><rect x="30" y="0" width="20" height="20" /><rect x="60" y="0" width="20" height="20" /><rect x="0" y="30" width="20" height="20" /><rect x="40" y="30" width="10" height="10" /><rect x="60" y="30" width="20" height="20" /><rect x="0" y="60" width="20" height="20" /><rect x="30" y="60" width="20" height="20" /><rect x="60" y="60" width="20" height="20" /><rect x="20" y="20" width="10" height="10" /><rect x="70" y="70" width="10" height="10" /></svg>
            </div>
            <p style={{ fontSize: "7pt", color: "#94a3b8", margin: "2px 0 0" }}>ZATCA QR</p>
          </div>
        )}
      </div>
    </div>
  );
}
