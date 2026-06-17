"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";

interface InvoiceData {
  number?: string; date?: string; status?: string; subtotal?: number;
  vat_total?: number; total?: number; notes?: string;
  suppliers?: { name_ar?: string } | null;
  invoice_lines?: Array<{ description?: string; qty?: number; unit_price?: number; total?: number }>;
}

export default function PurchaseInvoicePrintPage() {
  const params = useParams();
  const [data, setData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/invoices?id=${params.id}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  const handlePrint = () => window.print();

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-[#64748b]">جار التحميل...</p></div>;
  if (!data) return <div className="flex items-center justify-center min-h-screen"><p className="text-[#dc2626]">لم يتم العثور على الفاتورة</p></div>;

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <div className="no-print flex justify-center p-4 border-b print:hidden">
        <button onClick={handlePrint} className="bg-[#0f172a] text-white px-6 py-2 rounded hover:bg-[#1e293b] transition-colors">طباعة</button>
      </div>
      <div className="max-w-[210mm] mx-auto p-8 print:p-4">
        <div className="border-b-2 border-[#0f172a] pb-4 mb-6">
          <h1 className="text-2xl font-bold text-[#0f172a]">فاتورة مشتريات</h1>
          <p className="text-sm text-[#64748b]">رقم: {data.number}</p>
          <p className="text-sm text-[#64748b]">تاريخ: {data.date}</p>
          {data.suppliers?.name_ar && <p className="text-sm text-[#64748b]">المورد: {data.suppliers.name_ar}</p>}
        </div>
        <table className="w-full text-sm mb-6">
          <thead><tr className="bg-[#f8fafc] border-y-2 border-[#0f172a]">
            <th className="px-3 py-2 text-right">البيان</th>
            <th className="px-3 py-2 text-center">الكمية</th>
            <th className="px-3 py-2 text-left">سعر الوحدة</th>
            <th className="px-3 py-2 text-left">الإجمالي</th>
          </tr></thead>
          <tbody>
            {(data.invoice_lines || []).map((line, i) => (
              <tr key={i} className="border-b">
                <td className="px-3 py-2">{line.description}</td>
                <td className="px-3 py-2 text-center">{line.qty}</td>
                <td className="px-3 py-2 text-left">{line.unit_price?.toLocaleString()}</td>
                <td className="px-3 py-2 text-left">{line.total?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-left space-y-1">
          <p className="text-sm">المجموع الفرعي: <span className="font-medium">{data.subtotal?.toLocaleString()} ر.س</span></p>
          <p className="text-sm">الضريبة: <span className="font-medium">{data.vat_total?.toLocaleString()} ر.س</span></p>
          <p className="text-lg font-bold text-[#0f172a]">الإجمالي: {data.total?.toLocaleString()} ر.س</p>
        </div>
        {data.notes && <p className="mt-6 text-sm text-[#64748b] border-t pt-4">{data.notes}</p>}
      </div>
      <style>{`@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } @page { margin: 10mm; size: A4; } }`}</style>
    </div>
  );
}
