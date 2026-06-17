"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";

interface JournalEntryData {
  number?: string; date?: string; description?: string; status?: string;
  lines?: Array<{ account_name?: string; debit?: number; credit?: number }>;
}

export default function JournalEntryPrintPage() {
  const params = useParams();
  const [data, setData] = useState<JournalEntryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/journal?id=${params.id}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  const handlePrint = () => window.print();

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-[#64748b]">جار التحميل...</p></div>;
  if (!data) return <div className="flex items-center justify-center min-h-screen"><p className="text-[#dc2626]">لم يتم العثور على القيد</p></div>;

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <div className="no-print flex justify-center p-4 border-b print:hidden">
        <button onClick={handlePrint} className="bg-[#0f172a] text-white px-6 py-2 rounded hover:bg-[#1e293b] transition-colors">طباعة</button>
      </div>
      <div className="max-w-[210mm] mx-auto p-8 print:p-4">
        <div className="border-b-2 border-[#0f172a] pb-4 mb-6">
          <h1 className="text-2xl font-bold text-[#0f172a]">قيد يومية</h1>
          <p className="text-sm text-[#64748b]">رقم: {data.number}</p>
          <p className="text-sm text-[#64748b]">تاريخ: {data.date}</p>
          <p className="text-sm text-[#64748b]">الحالة: {data.status === "posted" ? "مرحّل" : "مسودة"}</p>
        </div>
        {data.description && <p className="mb-4 text-sm text-[#64748b]">{data.description}</p>}
        <table className="w-full text-sm mb-6">
          <thead><tr className="bg-[#f8fafc] border-y-2 border-[#0f172a]">
            <th className="px-3 py-2 text-right">الحساب</th>
            <th className="px-3 py-2 text-left">مدين</th>
            <th className="px-3 py-2 text-left">دائن</th>
          </tr></thead>
          <tbody>
            {(data.lines || []).map((line, i) => (
              <tr key={i} className="border-b">
                <td className="px-3 py-2">{line.account_name}</td>
                <td className="px-3 py-2 text-left">{line.debit?.toLocaleString()} ر.س</td>
                <td className="px-3 py-2 text-left">{line.credit?.toLocaleString()} ر.س</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <style>{`@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } @page { margin: 10mm; size: A4; } }`}</style>
    </div>
  );
}
