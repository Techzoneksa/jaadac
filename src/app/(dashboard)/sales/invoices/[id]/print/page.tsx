"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import QRCode from "qrcode";
import { encodeTLVBase64 } from "@/lib/zatca/tlv";

interface InvoiceData {
  id: string; number: string; date: string; status: string;
  subtotal: number; vat_total: number; total: number; notes?: string;
  customer_id?: string;
  customers?: { name_ar: string; vat?: string } | null;
  invoice_lines?: Array<{ description: string; qty: number; unit_price: number; vat_rate: number; total: number }>;
}

interface CompanyData {
  name_ar: string; name_en: string; vat: string; cr?: string;
  phone?: string; email?: string; city?: string; address?: string; logo_url?: string;
}

export default function InvoicePrintPage() {
  const params = useParams();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/invoices?id=${params.id}`).then((r) => r.json()),
      fetch("/api/company-settings").then((r) => r.json()),
    ]).then(([inv, comp]) => {
      setInvoice(inv); setCompany(comp);
      if (inv && comp) {
        const base64 = encodeTLVBase64({
          sellerName: comp.name_ar || comp.name_en,
          vatNumber: comp.vat,
          timestamp: new Date(inv.date || Date.now()).toISOString().replace(/[-:]/g, "").slice(0, 14) + "Z",
          totalWithVat: inv.total || 0,
          vatTotal: inv.vat_total || 0,
        });
        QRCode.toDataURL(base64, { width: 120, margin: 1 }, (err, url) => { if (!err) setQrDataUrl(url); });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [params.id]);

  const handlePrint = () => window.print();

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-muted">جار تحميل الفاتورة...</p></div>;
  if (!invoice) return <div className="flex items-center justify-center min-h-screen"><p className="text-danger">لم يتم العثور على الفاتورة</p></div>;

  const f = (v: number) => new Intl.NumberFormat("ar-SA", { minimumFractionDigits: 2 }).format(v);

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <div className="no-print flex justify-center p-4 border-b print:hidden">
        <button onClick={handlePrint} className="bg-[#0f172a] text-white px-6 py-2 rounded hover:bg-[#1e293b] transition-colors">طباعة الفاتورة</button>
      </div>
      <div className="print-document">
        <div className="flex justify-between items-start border-b-2 border-[#0f172a] pb-4 mb-6">
          <div>
            {company?.logo_url && <img src={company.logo_url} alt="شعار" className="h-16 mb-2 object-contain" />}
            <h1 className="text-xl font-bold">{company?.name_ar || company?.name_en || "الشركة"}</h1>
            <p className="text-xs text-muted">الرقم الضريبي: {company?.vat}</p>
            {company?.cr && <p className="text-xs text-muted">السجل التجاري: {company.cr}</p>}
            {company?.phone && <p className="text-xs text-muted">هاتف: {company.phone}</p>}
            {company?.email && <p className="text-xs text-muted">بريد: {company.email}</p>}
            {company?.address && <p className="text-xs text-muted">{company.address}</p>}
          </div>
          <div className="text-left">
            <h2 className="text-lg font-bold">فاتورة ضريبية</h2>
            <p className="text-xs text-muted">رقم: {invoice.number}</p>
            <p className="text-xs text-muted">تاريخ: {invoice.date}</p>
            <p className="text-xs text-muted">الحالة: {invoice.status}</p>
          </div>
        </div>
        {invoice.customers?.name_ar && (
          <div className="mb-4">
            <p className="text-sm font-medium">العميل: {invoice.customers.name_ar}</p>
            {invoice.customers.vat && <p className="text-xs text-muted">الرقم الضريبي: {invoice.customers.vat}</p>}
          </div>
        )}
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
                <td className="px-3 py-2 text-left">{f(line.unit_price)}</td>
                <td className="px-3 py-2 text-left">{line.vat_rate}%</td>
                <td className="px-3 py-2 text-left">{f(line.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <p className="text-sm">المجموع الفرعي: <span className="font-medium">{f(invoice.subtotal)} ر.س</span></p>
            <p className="text-sm">إجمالي الضريبة: <span className="font-medium">{f(invoice.vat_total)} ر.س</span></p>
            <p className="text-lg font-bold">الإجمالي شامل الضريبة: {f(invoice.total)} ر.س</p>
          </div>
          {qrDataUrl && (
            <div className="text-center">
              <img src={qrDataUrl} alt="QR" className="w-[120px] h-[120px]" />
              <p className="text-[10px] text-muted mt-1">رمز التحقق (ZATCA)</p>
            </div>
          )}
        </div>
        {invoice.notes && <p className="mt-6 text-sm text-muted border-t pt-4">{invoice.notes}</p>}
        <div className="mt-8 pt-4 border-t text-xs text-muted text-center">
          <p>—— توقيع ———</p>
        </div>
      </div>
    </div>
  );
}
