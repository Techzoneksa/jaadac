"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";

interface QuotationData {
  number?: string; date?: string; status?: string; subtotal?: number;
  vat_total?: number; total?: number; notes?: string;
}

export default function QuotationPrintPage() {
  const params = useParams();
  const [data, setData] = useState<QuotationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/quotations?id=${params.id}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  const handlePrint = () => window.print();

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-[#64748b]">جار التحميل...</p></div>;
  if (!data) return <div className="flex items-center justify-center min-h-screen"><p className="text-[#dc2626]">لم يتم العثور على عرض السعر</p></div>;

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <div className="no-print flex justify-center p-4 border-b print:hidden">
        <button onClick={handlePrint} className="bg-[#0f172a] text-white px-6 py-2 rounded hover:bg-[#1e293b] transition-colors">طباعة</button>
      </div>
      <div className="max-w-[210mm] mx-auto p-8 print:p-4">
        <div className="border-b-2 border-[#0f172a] pb-4 mb-6">
          <h1 className="text-2xl font-bold text-[#0f172a]">عرض سعر</h1>
          <p className="text-sm text-[#64748b]">رقم: {data.number}</p>
          <p className="text-sm text-[#64748b]">تاريخ: {data.date}</p>
          <p className="text-sm text-[#64748b]">الحالة: {data.status}</p>
        </div>
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
