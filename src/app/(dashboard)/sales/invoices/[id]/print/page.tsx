"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import QRCode from "qrcode";
import { encodeTLVBase64 } from "@/lib/zatca/tlv";

interface InvoiceData {
  id: string;
  number: string;
  date: string;
  status: string;
  subtotal: number;
  vat_total: number;
  total: number;
  notes?: string;
  customer_id?: string;
  customers?: { name_ar: string; vat?: string } | null;
  invoice_lines?: Array<{
    description: string;
    qty: number;
    unit_price: number;
    vat_rate: number;
    total: number;
  }>;
}

interface CompanyData {
  name_ar: string;
  name_en: string;
  vat: string;
  cr?: string;
  phone?: string;
  email?: string;
  city?: string;
  address?: string;
  logo_url?: string;
}

export default function InvoicePrintPage() {
  const params = useParams();
  const printRef = useRef<HTMLDivElement>(null);
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/invoices?id=${params.id}`).then((r) => r.json()),
      fetch("/api/company-settings").then((r) => r.json()),
    ])
      .then(([inv, comp]) => {
        setInvoice(inv);
        setCompany(comp);
        if (inv && comp) {
          const base64 = encodeTLVBase64({
            sellerName: comp.name_ar || comp.name_en,
            vatNumber: comp.vat,
            timestamp:             new Date(inv.date || Date.now()).toISOString().replace(/[-:]/g, "").slice(0, 14) + "Z",
            totalWithVat: inv.total || 0,
            vatTotal: inv.vat_total || 0,
          });
          QRCode.toDataURL(base64, { width: 120, margin: 1 }, (err, url) => {
            if (!err) setQrDataUrl(url);
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-[#64748b]">جار تحميل الفاتورة...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-[#dc2626]">لم يتم العثور على الفاتورة</p>
      </div>
    );
  }

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("ar-SA", { style: "decimal", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

  return (
    <div className="min-h-screen bg-white print:bg-white" dir="rtl">
      <div className="no-print flex justify-center p-4 border-b print:hidden">
        <button
          onClick={handlePrint}
          className="bg-[#0f172a] text-white px-6 py-2 rounded hover:bg-[#1e293b] transition-colors"
        >
          طباعة الفاتورة
        </button>
      </div>

      <div ref={printRef} className="max-w-[210mm] mx-auto p-8 print:p-4 print:m-0 print:max-w-none">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-[#0f172a] pb-4 mb-6">
          <div>
            {company?.logo_url && (
              <img src={company.logo_url} alt="شعار" className="h-16 mb-2 object-contain" />
            )}
            <h1 className="text-2xl font-bold text-[#0f172a]">{company?.name_ar || company?.name_en || "الشركة"}</h1>
            <p className="text-sm text-[#64748b]">الرقم الضريبي: {company?.vat}</p>
            {company?.cr && <p className="text-sm text-[#64748b]">السجل التجاري: {company.cr}</p>}
            {company?.phone && <p className="text-sm text-[#64748b]">هاتف: {company.phone}</p>}
            {company?.email && <p className="text-sm text-[#64748b]">بريد: {company.email}</p>}
            {company?.address && <p className="text-sm text-[#64748b]">{company.address}</p>}
          </div>
          <div className="text-left">
            <h2 className="text-xl font-bold text-[#0f172a]">فاتورة ضريبية</h2>
            <p className="text-sm text-[#64748b]">رقم: {invoice.number}</p>
            <p className="text-sm text-[#64748b]">تاريخ: {invoice.date}</p>
            {invoice.customers?.name_ar && (
              <p className="text-sm text-[#64748b]">العميل: {invoice.customers.name_ar}</p>
            )}
          </div>
        </div>

        {/* Line Items */}
        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="bg-[#f8fafc] border-y-2 border-[#0f172a]">
              <th className="px-3 py-2 text-right">البيان</th>
              <th className="px-3 py-2 text-center">الكمية</th>
              <th className="px-3 py-2 text-left">سعر الوحدة</th>
              <th className="px-3 py-2 text-left">الضريبة</th>
              <th className="px-3 py-2 text-left">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.invoice_lines || []).map((line, i) => (
              <tr key={i} className="border-b">
                <td className="px-3 py-2">{line.description}</td>
                <td className="px-3 py-2 text-center">{line.qty}</td>
                <td className="px-3 py-2 text-left">{formatCurrency(line.unit_price)}</td>
                <td className="px-3 py-2 text-left">{line.vat_rate}%</td>
                <td className="px-3 py-2 text-left">{formatCurrency(line.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals + QR */}
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <p className="text-sm">المجموع الفرعي: <span className="font-medium">{formatCurrency(invoice.subtotal)} ر.س</span></p>
            <p className="text-sm">إجمالي الضريبة: <span className="font-medium">{formatCurrency(invoice.vat_total)} ر.س</span></p>
            <p className="text-lg font-bold text-[#0f172a]">الإجمالي شامل الضريبة: {formatCurrency(invoice.total)} ر.س</p>
          </div>
          {qrDataUrl && (
            <div className="text-center">
              <img src={qrDataUrl} alt="QR" className="w-[120px] h-[120px]" />
              <p className="text-[10px] text-[#64748b] mt-1">رمز التحقق (ZATCA)</p>
            </div>
          )}
        </div>

        {invoice.notes && (
          <p className="mt-6 text-sm text-[#64748b] border-t pt-4">{invoice.notes}</p>
        )}
      </div>

      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { margin: 10mm; size: A4; }
        }
      `}</style>
    </div>
  );
}
