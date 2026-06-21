"use client";

import React from "react";

interface Customer {
  name_ar: string;
  name_en?: string;
  type?: string;
  vat?: string;
  cr?: string;
  unified_no?: string;
  mobile?: string;
  phone?: string;
  email?: string;
  city?: string;
  country?: string;
  district?: string;
  street?: string;
  building_no?: string;
  additional_no?: string;
  postal_code?: string;
  address?: string;
  project_name?: string;
  contact_person?: string;
  customer_number?: string;
}

interface Company {
  name_ar: string;
  name_en?: string;
  vat?: string;
  cr?: string;
  unified_no?: string;
  phone?: string;
  email?: string;
  city?: string;
  country?: string;
  street?: string;
  building_no?: string;
  additional_no?: string;
  district?: string;
  postal_code?: string;
  branch_name?: string;
  address?: string;
  logo_url?: string;
  show_logo?: boolean;
  show_stamp?: boolean;
  show_bank?: boolean;
  show_amount_text?: boolean;
  show_customer_address?: boolean;
  show_customer_cr?: boolean;
  bank_footer_enabled?: boolean;
  primary_bank_name?: string;
  primary_bank_account_name?: string;
  primary_bank_account_number?: string;
  primary_bank_iban?: string;
  primary_bank_swift?: string;
  primary_bank_currency?: string;
  secondary_bank_name?: string;
  secondary_bank_account_name?: string;
  secondary_bank_account_number?: string;
  secondary_bank_iban?: string;
  secondary_bank_swift?: string;
  secondary_bank_currency?: string;
  invoice_footer_note_ar?: string;
  invoice_footer_note_en?: string;
}

interface Line {
  description: string;
  qty?: number;
  unit_price?: number;
  vat_rate?: number;
  total?: number;
  discount?: number;
  sku?: string;
  unit?: string;
  item_id?: string;
}

interface Props {
  invoice: {
    number: string;
    date: string;
    due_date?: string;
    status?: string;
    subtotal?: number;
    vat_total?: number;
    total?: number;
    discount?: number;
    paid_amount?: number;
    notes?: string;
    qr_value?: string;
    branch_name?: string;
    issue_time?: string;
    customers?: Customer | null;
    invoice_lines?: Line[];
    payments?: Array<{ id: string; amount: number; payment_method: string; date: string; number: string }>;
  };
  company: Company | null;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

function numberToArabicWords(num: number): string {
  const units = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "six", "سبعة", "ثمانية", "تسعة", "عشرة",
    "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "sixteen", "سبعة عشر", "ثمانية عشر", "تسعة عشر"];
  const tens = ["", "", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
  const hundreds = ["", "مئة", "مئتان", "ثلاثمئة", "أربعمئة", "خمسمئة", "ستسمئة", "سبعمئة", "ثمانمئة", "تسعمئة"];

  if (num === 0) return "صفر";
  if (num >= 1000000) return numberToArabicWords(Math.floor(num / 1000000)) + " مليون و" + numberToArabicWords(num % 1000000);

  const thousands = Math.floor(num / 1000);
  const remainder = num % 1000;

  let result = "";
  if (thousands > 0) {
    result += thousands === 1 ? "ألف" : thousands === 2 ? "ألفان" : numberToArabicWords(thousands) + " آلاف";
    if (remainder > 0) result += " و";
  }
  if (remainder > 0) {
    if (remainder < 20) result += units[remainder];
    else if (remainder < 100) {
      const tens_digit = Math.floor(remainder / 10);
      const ones_digit = remainder % 10;
      result += units[ones_digit] ? units[ones_digit] + " و" + tens[tens_digit] : tens[tens_digit];
    } else {
      const hundreds_digit = Math.floor(remainder / 100);
      const rest = remainder % 100;
      result += hundreds[hundreds_digit];
      if (rest > 0) result += " و" + numberToArabicWords(rest);
    }
  }
  return result;
}

export function ZATCAInvoiceTemplate({ invoice, company }: Props) {
  const customer = invoice.customers;
  const lines = invoice.invoice_lines || [];
  const isPaid = (invoice.paid_amount || 0) >= (invoice.total || 0) && (invoice.total || 0) > 0;
  const statusLabel = isPaid ? "مدفوعة بالكامل / Fully Paid" : invoice.status === "draft" ? "مسودة / Draft" : invoice.status === "cancelled" ? "ملغية / Cancelled" : "";

  const companyAddress = [
    company?.building_no ? `مبنى ${company.building_no}` : "",
    company?.street ? `شارع ${company.street}` : "",
    company?.district ? `حي ${company.district}` : "",
    company?.city || "",
    company?.postal_code ? `ص.ب ${company.postal_code}` : "",
  ].filter(Boolean).join("، ");

  const customerAddress = customer ? [
    customer.building_no ? `مبنى ${customer.building_no}` : "",
    customer.street ? `شارع ${customer.street}` : "",
    customer.district ? `حي ${customer.district}` : "",
    customer.city || "",
    customer.postal_code ? `رمز بريدي ${customer.postal_code}` : "",
    customer.country || "",
  ].filter(Boolean).join("، ") : "";

  return (
    <div className="invoice-print-area" style={{ fontFamily: "'IBM Plex Sans Arabic', Arial, sans-serif", direction: "rtl", color: "#1e293b", fontSize: "11px", lineHeight: "1.5", maxWidth: "210mm", margin: "0 auto", background: "#fff", padding: "16mm 18mm" }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "3px solid #1e293b", paddingBottom: "16px", marginBottom: "16px" }}>
        <div style={{ flex: 1 }}>
          {(company?.show_logo !== false && company?.logo_url) && (
            <div style={{ marginBottom: "8px" }}>
              <img src={company.logo_url} alt="شعار المنشأة" style={{ maxHeight: "70px", maxWidth: "180px", objectFit: "contain" }} />
            </div>
          )}
          <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>{company?.name_ar || "اسم المنشأة"}</h1>
          {company?.name_en && <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 6px" }}>{company.name_en}</p>}
          {company?.vat && <p style={{ fontSize: "10px", color: "#475569", margin: "1px 0" }}><strong>الرقم الضريبي:</strong> {company.vat}</p>}
          {company?.cr && <p style={{ fontSize: "10px", color: "#475569", margin: "1px 0" }}><strong>السجل التجاري:</strong> {company.cr}</p>}
          {company?.unified_no && <p style={{ fontSize: "10px", color: "#475569", margin: "1px 0" }}><strong>الرقم الموحد:</strong> {company.unified_no}</p>}
          {company?.phone && <p style={{ fontSize: "10px", color: "#475569", margin: "1px 0" }}><strong>هاتف:</strong> {company.phone}</p>}
          {company?.email && <p style={{ fontSize: "10px", color: "#475569", margin: "1px 0" }}><strong>بريد:</strong> {company.email}</p>}
          {companyAddress && <p style={{ fontSize: "10px", color: "#475569", margin: "1px 0" }}>{companyAddress}</p>}
          {company?.branch_name && <p style={{ fontSize: "10px", color: "#475569", margin: "1px 0" }}><strong>الفرع:</strong> {company.branch_name}</p>}
        </div>

        <div style={{ textAlign: "center", minWidth: "200px" }}>
          <div style={{ background: "#1e293b", color: "#fff", padding: "12px 20px", borderRadius: "4px", marginBottom: "12px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 4px" }}>Tax Invoice</h2>
            <p style={{ fontSize: "14px", fontWeight: 600, margin: 0 }}>فاتورة ضريبية</p>
          </div>
          <p style={{ fontSize: "11px", color: "#475569", margin: "3px 0" }}><strong>رقم الفاتورة:</strong> {invoice.number}</p>
          <p style={{ fontSize: "11px", color: "#475569", margin: "3px 0" }}><strong>تاريخ:</strong> {invoice.date}</p>
          {invoice.issue_time && <p style={{ fontSize: "10px", color: "#64748b", margin: "2px 0" }}>{invoice.issue_time}</p>}
          {invoice.branch_name && <p style={{ fontSize: "10px", color: "#64748b", margin: "2px 0" }}><strong>الفرع:</strong> {invoice.branch_name}</p>}
          <p style={{ fontSize: "11px", color: "#475569", margin: "3px 0" }}><strong>صفحة:</strong> 1 من 1</p>
          {statusLabel && (
            <div style={{ marginTop: "8px", padding: "4px 12px", borderRadius: "4px", background: isPaid ? "#16a34a" : "#64748b", color: "#fff", fontSize: "11px", fontWeight: 600, display: "inline-block" }}>
              {statusLabel}
            </div>
          )}
        </div>
      </div>

      {/* CUSTOMER INFO */}
      {customer && (
        <div style={{ marginBottom: "16px", border: "1px solid #e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
          <div style={{ background: "#f1f5f9", padding: "8px 12px", borderBottom: "1px solid #e2e8f0", fontWeight: 700, fontSize: "11px", color: "#334155" }}>
            بيانات العميل / Customer Information
          </div>
          <div style={{ padding: "10px 12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <div>
              <span style={{ color: "#64748b", fontSize: "10px" }}>الاسم / Name: </span>
              <span style={{ fontWeight: 600, fontSize: "11px" }}>{customer.name_ar}</span>
              {customer.name_en && <span style={{ color: "#64748b", fontSize: "10px" }}> / {customer.name_en}</span>}
            </div>
            {customer.vat && (company?.show_customer_cr !== false) && (
              <div>
                <span style={{ color: "#64748b", fontSize: "10px" }}>الرقم الضريبي / VAT: </span>
                <span style={{ fontWeight: 600, fontSize: "11px" }}>{customer.vat}</span>
              </div>
            )}
            {customer.cr && (company?.show_customer_cr !== false) && (
              <div>
                <span style={{ color: "#64748b", fontSize: "10px" }}>السجل التجاري / CR: </span>
                <span style={{ fontWeight: 600, fontSize: "11px" }}>{customer.cr}</span>
              </div>
            )}
            {customer.customer_number && (
              <div>
                <span style={{ color: "#64748b", fontSize: "10px" }}>رقم العميل: </span>
                <span style={{ fontWeight: 600, fontSize: "11px" }}>{customer.customer_number}</span>
              </div>
            )}
            {(customer.mobile || customer.phone) && (
              <div>
                <span style={{ color: "#64748b", fontSize: "10px" }}>الجوال / Mobile: </span>
                <span style={{ fontWeight: 600, fontSize: "11px" }}>{customer.mobile || customer.phone}</span>
              </div>
            )}
            {customer.email && (
              <div>
                <span style={{ color: "#64748b", fontSize: "10px" }}>البريد / Email: </span>
                <span style={{ fontWeight: 600, fontSize: "11px" }}>{customer.email}</span>
              </div>
            )}
            {customer.project_name && (
              <div>
                <span style={{ color: "#64748b", fontSize: "10px" }}>اسم المشروع: </span>
                <span style={{ fontWeight: 600, fontSize: "11px" }}>{customer.project_name}</span>
              </div>
            )}
            {(company?.show_customer_address !== false) && customerAddress && (
              <div style={{ gridColumn: "1 / -1" }}>
                <span style={{ color: "#64748b", fontSize: "10px" }}>العنوان / Address: </span>
                <span style={{ fontWeight: 600, fontSize: "11px" }}>{customerAddress}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ITEMS TABLE */}
      <div style={{ marginBottom: "16px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px", tableLayout: "fixed" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "2px solid #1e293b" }}>
              <th style={{ padding: "8px 6px", textAlign: "center", fontWeight: 700, color: "#334155", width: "5%" }}>#</th>
              <th style={{ padding: "8px 6px", textAlign: "right", fontWeight: 700, color: "#334155" }}>وصف البند / Item Description</th>
              <th style={{ padding: "8px 6px", textAlign: "center", fontWeight: 700, color: "#334155", width: "7%" }}>الوحدة<br/><span style={{ fontWeight: 400, fontSize: "9px" }}>Unit</span></th>
              <th style={{ padding: "8px 6px", textAlign: "center", fontWeight: 700, color: "#334155", width: "7%" }}>الكمية<br/><span style={{ fontWeight: 400, fontSize: "9px" }}>Qty</span></th>
              <th style={{ padding: "8px 6px", textAlign: "left", fontWeight: 700, color: "#334155", width: "12%" }}>سعر الوحدة<br/><span style={{ fontWeight: 400, fontSize: "9px" }}>Unit Price</span></th>
              <th style={{ padding: "8px 6px", textAlign: "left", fontWeight: 700, color: "#334155", width: "12%" }}>قبل الضريبة<br/><span style={{ fontWeight: 400, fontSize: "9px" }}>Before VAT</span></th>
              <th style={{ padding: "8px 6px", textAlign: "center", fontWeight: 700, color: "#334155", width: "7%" }}>ضريبة %<br/><span style={{ fontWeight: 400, fontSize: "9px" }}>VAT %</span></th>
              <th style={{ padding: "8px 6px", textAlign: "left", fontWeight: 700, color: "#334155", width: "10%" }}>مبلغ الضريبة<br/><span style={{ fontWeight: 400, fontSize: "9px" }}>VAT Amt</span></th>
              <th style={{ padding: "8px 6px", textAlign: "left", fontWeight: 700, color: "#334155", width: "12%" }}>الإجمالي شامل<br/><span style={{ fontWeight: 400, fontSize: "9px" }}>Total SAR</span></th>
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>لا توجد بنود</td></tr>
            ) : lines.map((l, i) => {
              const qty = l.qty || 0;
              const unit_price = l.unit_price || 0;
              const vat_rate = l.vat_rate || 0;
              const total = l.total || 0;
              const taxable_amount = qty * unit_price;
              const vat_amount = taxable_amount * vat_rate / 100;
              return (
                <tr key={i} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "6px", textAlign: "center", color: "#94a3b8" }}>{i + 1}</td>
                  <td style={{ padding: "6px", textAlign: "right", color: "#1e293b" }}>
                    {l.description}
                    {l.sku && <span style={{ display: "block", fontSize: "9px", color: "#94a3b8" }}>SKU: {l.sku}</span>}
                  </td>
                  <td style={{ padding: "6px", textAlign: "center", color: "#1e293b" }}>{l.unit || "وحدة"}</td>
                  <td style={{ padding: "6px", textAlign: "center", color: "#1e293b" }}>{qty}</td>
                  <td style={{ padding: "6px", textAlign: "left", color: "#1e293b" }}>{formatCurrency(unit_price)}</td>
                  <td style={{ padding: "6px", textAlign: "left", color: "#1e293b" }}>{formatCurrency(taxable_amount)}</td>
                  <td style={{ padding: "6px", textAlign: "center", color: "#1e293b" }}>{vat_rate}%</td>
                  <td style={{ padding: "6px", textAlign: "left", color: "#1e293b" }}>{formatCurrency(vat_amount)}</td>
                  <td style={{ padding: "6px", textAlign: "left", fontWeight: 600, color: "#1e293b" }}>{formatCurrency(total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* TOTALS + QR ROW */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        {/* Notes */}
        <div style={{ flex: 1, marginLeft: "20px" }}>
          {invoice.notes && (
            <div style={{ border: "1px solid #e2e8f0", borderRadius: "4px", padding: "8px 10px" }}>
              <p style={{ fontSize: "10px", fontWeight: 700, color: "#334155", margin: "0 0 4px" }}>ملاحظات / Notes:</p>
              <p style={{ fontSize: "10px", color: "#475569", margin: 0 }}>{invoice.notes}</p>
            </div>
          )}
          {/* Signatures */}
          <div style={{ display: "flex", gap: "20px", marginTop: "16px" }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "10px", color: "#64748b", margin: "0 0 20px" }}>توقيع المستلم / Receiver Signature:</p>
              <div style={{ borderBottom: "1px solid #1e293b", height: "30px" }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "10px", color: "#64748b", margin: "0 0 20px" }}>توقيع البائع / Seller Signature:</p>
              <div style={{ borderBottom: "1px solid #1e293b", height: "30px" }} />
            </div>
          </div>
        </div>

        {/* Totals Box */}
        <div style={{ minWidth: "220px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "4px", padding: "12px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
            <tbody>
              <tr><td style={{ padding: "4px 8px", color: "#64748b" }}>الإجمالي بدون ضريبة<br /><span style={{ fontSize: "9px" }}>Total Excl. VAT</span></td><td style={{ padding: "4px 8px", textAlign: "left", fontWeight: 600 }}>{formatCurrency(invoice.subtotal || 0)}</td></tr>
              {(invoice.discount || 0) > 0 && <tr style={{ color: "#dc2626" }}><td style={{ padding: "4px 8px" }}>الخصم / Discount</td><td style={{ padding: "4px 8px", textAlign: "left", fontWeight: 600 }}>-{formatCurrency(invoice.discount || 0)}</td></tr>}
              <tr><td style={{ padding: "4px 8px", color: "#64748b" }}>ضريبة القيمة المضافة 15%<br /><span style={{ fontSize: "9px" }}>VAT 15%</span></td><td style={{ padding: "4px 8px", textAlign: "left", fontWeight: 600 }}>{formatCurrency(invoice.vat_total || 0)}</td></tr>
              <tr style={{ borderTop: "2px solid #1e293b" }}><td style={{ padding: "8px 8px 4px", fontWeight: 800, fontSize: "13px" }}>الإجمالي شامل الضريبة<br /><span style={{ fontSize: "9px" }}>Total Incl. VAT (SAR)</span></td><td style={{ padding: "8px 8px 4px", textAlign: "left", fontWeight: 800, fontSize: "13px" }}>{formatCurrency(invoice.total || 0)}</td></tr>
            </tbody>
          </table>
          {company?.show_amount_text !== false && (
            <div style={{ marginTop: "8px", padding: "6px 8px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "3px", fontSize: "10px", color: "#475569", textAlign: "center" }}>
              فقط {numberToArabicWords(Math.round(invoice.total || 0))} ريال سعودي
              <br />
              <span style={{ fontSize: "9px", color: "#94a3b8" }}>Only {Math.round(invoice.total || 0)} Saudi Riyals</span>
            </div>
          )}
        </div>
      </div>

      {/* QR CODE */}
      {invoice.qr_value && (
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <div style={{ display: "inline-block", border: "2px solid #1e293b", borderRadius: "4px", padding: "8px", background: "#fff" }}>
            <img src={`data:image/png;base64,${invoice.qr_value}`} alt="QR Code" style={{ width: "120px", height: "120px" }} />
          </div>
          <p style={{ fontSize: "9px", color: "#94a3b8", margin: "4px 0 0" }}>رمز الاستجابة السريعة / ZATCA QR Code</p>
        </div>
      )}

      {/* BANK FOOTER */}
      {company?.bank_footer_enabled && (company?.primary_bank_name || company?.secondary_bank_name) && (
        <div style={{ borderTop: "2px solid #1e293b", paddingTop: "12px", marginTop: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px" }}>
            {/* Bank Details */}
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "#1e293b", margin: "0 0 8px" }}>بيانات البنك / Bank Details:</p>
              <div style={{ display: "grid", gap: "4px", fontSize: "10px" }}>
                {company.primary_bank_name && (
                  <>
                    <p style={{ margin: 0, color: "#334155" }}><strong>{company.primary_bank_name}</strong></p>
                    <p style={{ margin: 0, color: "#64748b" }}>Account Name: {company.primary_bank_account_name || "-"}</p>
                    <p style={{ margin: 0, color: "#64748b" }}>A/C No: {company.primary_bank_account_number || "-"}</p>
                    {company.primary_bank_iban && <p style={{ margin: 0, color: "#64748b" }}>IBAN: {company.primary_bank_iban}</p>}
                    {company.primary_bank_swift && <p style={{ margin: 0, color: "#64748b" }}>SWIFT: {company.primary_bank_swift}</p>}
                    <p style={{ margin: 0, color: "#64748b" }}>Currency: {company.primary_bank_currency || "SAR"}</p>
                  </>
                )}
                {company.secondary_bank_name && (
                  <>
                    <p style={{ margin: "4px 0 0", color: "#334155" }}><strong>{company.secondary_bank_name}</strong></p>
                    <p style={{ margin: 0, color: "#64748b" }}>Account Name: {company.secondary_bank_account_name || "-"}</p>
                    <p style={{ margin: 0, color: "#64748b" }}>A/C No: {company.secondary_bank_account_number || "-"}</p>
                    {company.secondary_bank_iban && <p style={{ margin: 0, color: "#64748b" }}>IBAN: {company.secondary_bank_iban}</p>}
                    {company.secondary_bank_swift && <p style={{ margin: 0, color: "#64748b" }}>SWIFT: {company.secondary_bank_swift}</p>}
                    <p style={{ margin: 0, color: "#64748b" }}>Currency: {company.secondary_bank_currency || "SAR"}</p>
                  </>
                )}
              </div>
            </div>
            {/* Footer Notes */}
            <div style={{ flex: 1, textAlign: "left" }}>
              {(company.invoice_footer_note_ar || company.invoice_footer_note_en) && (
                <p style={{ fontSize: "10px", color: "#64748b", margin: 0 }}>
                  {company.invoice_footer_note_ar}
                  {company.invoice_footer_note_ar && company.invoice_footer_note_en && <br />}
                  {company.invoice_footer_note_en}
                </p>
              )}
              <div style={{ marginTop: "8px", fontSize: "10px", color: "#94a3b8" }}>
                {company?.phone && <span>هاتف: {company.phone}</span>}
                {company?.email && <span style={{ marginRight: "12px" }}>بريد: {company.email}</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAID STAMP */}
      {isPaid && (
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%) rotate(-15deg)", pointerEvents: "none" }}>
          <div style={{ border: "4px solid #16a34a", borderRadius: "8px", padding: "12px 24px", opacity: 0.3 }}>
            <span style={{ fontSize: "48px", fontWeight: 800, color: "#16a34a" }}>PAID / مدفوعة</span>
          </div>
        </div>
      )}
    </div>
  );
}