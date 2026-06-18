"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface JournalEntryData {
  number?: string; date?: string; description?: string; status?: string;
  lines?: Array<{ account_name?: string; debit?: number; credit?: number }>;
}

interface CompanyData {
  name_ar?: string; name_en?: string; vat?: string; cr?: string;
  phone?: string; email?: string; address?: string;
}

export default function JournalEntryPrintPage() {
  const params = useParams();
  const [data, setData] = useState<JournalEntryData | null>(null);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/journal?id=${params.id}`).then((r) => r.json()),
      fetch("/api/company-settings").then((r) => r.json()),
    ]).then(([d, c]) => { setData(d); setCompany(c); setLoading(false); }).catch(() => setLoading(false));
  }, [params.id]);

  const handlePrint = () => window.print();

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-muted">جار التحميل...</p></div>;
  if (!data) return <div className="flex items-center justify-center min-h-screen"><p className="text-danger">لم يتم العثور على القيد</p></div>;

  const f = (v?: number) => (v ?? 0).toLocaleString("ar-SA", { minimumFractionDigits: 2 });

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <div className="no-print flex justify-center p-4 border-b print:hidden">
        <button onClick={handlePrint} className="bg-[#0f172a] text-white px-6 py-2 rounded hover:bg-[#1e293b] transition-colors">طباعة</button>
      </div>
      <div className="print-document">
        <div className="flex justify-between items-start border-b-2 border-[#0f172a] pb-4 mb-6">
          <div>
            <h1 className="text-xl font-bold">{company?.name_ar || company?.name_en || ""}</h1>
            {company?.vat && <p className="text-xs text-muted">الرقم الضريبي: {company.vat}</p>}
            {company?.phone && <p className="text-xs text-muted">هاتف: {company.phone}</p>}
            {company?.address && <p className="text-xs text-muted">{company.address}</p>}
          </div>
          <div className="text-left">
            <h2 className="text-lg font-bold">قيد يومية</h2>
            <p className="text-xs text-muted">رقم: {data.number}</p>
            <p className="text-xs text-muted">تاريخ: {data.date}</p>
            <p className="text-xs text-muted">الحالة: {data.status === "posted" ? "مرحّل" : "مسودة"}</p>
          </div>
        </div>
        {data.description && <p className="mb-4 text-sm">{data.description}</p>}
        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="bg-[#f8fafc] border-y-2 border-[#0f172a]">
              <th className="px-3 py-2 text-right">الحساب</th>
              <th className="px-3 py-2 text-left">مدين</th>
              <th className="px-3 py-2 text-left">دائن</th>
            </tr>
          </thead>
          <tbody>
            {(data.lines || []).map((line, i) => (
              <tr key={i} className="border-b">
                <td className="px-3 py-2">{line.account_name}</td>
                <td className="px-3 py-2 text-left">{f(line.debit)} ر.س</td>
                <td className="px-3 py-2 text-left">{f(line.credit)} ر.س</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-8 pt-4 border-t text-xs text-muted text-center">
          <p>—— توقيع ———</p>
        </div>
      </div>
    </div>
  );
}
