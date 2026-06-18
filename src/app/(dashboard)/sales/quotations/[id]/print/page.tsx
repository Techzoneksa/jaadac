"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface QuotationData {
  number?: string; date?: string; status?: string; subtotal?: number;
  vat_total?: number; total?: number; notes?: string;
  customers?: { name_ar?: string; vat?: string } | null;
  quotation_lines?: Array<{ description?: string; qty?: number; unit_price?: number; vat_rate?: number; total?: number }>;
}

interface CompanyData {
  name_ar?: string; name_en?: string; vat?: string; cr?: string;
  phone?: string; email?: string; city?: string; address?: string;
}

export default function QuotationPrintPage() {
  const params = useParams();
  const [data, setData] = useState<QuotationData | null>(null);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/quotations?id=${params.id}`).then((r) => r.json()),
      fetch("/api/company-settings").then((r) => r.json()),
    ]).then(([d, c]) => { setData(d); setCompany(c); setLoading(false); }).catch(() => setLoading(false));
  }, [params.id]);

  const handlePrint = () => window.print();

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-muted">جار التحميل...</p></div>;
  if (!data) return <div className="flex items-center justify-center min-h-screen"><p className="text-danger">لم يتم العثور على عرض السعر</p></div>;

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
            {company?.cr && <p className="text-xs text-muted">السجل التجاري: {company.cr}</p>}
            {company?.phone && <p className="text-xs text-muted">هاتف: {company.phone}</p>}
            {company?.address && <p className="text-xs text-muted">{company.address}</p>}
          </div>
          <div className="text-left">
            <h2 className="text-lg font-bold">عرض سعر</h2>
            <p className="text-xs text-muted">رقم: {data.number}</p>
            <p className="text-xs text-muted">تاريخ: {data.date}</p>
            <p className="text-xs text-muted">الحالة: {data.status}</p>
          </div>
        </div>
        {data.customers?.name_ar && (
          <div className="mb-4">
            <p className="text-sm font-medium">العميل: {data.customers.name_ar}</p>
            {data.customers.vat && <p className="text-xs text-muted">الرقم الضريبي: {data.customers.vat}</p>}
          </div>
        )}
        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="bg-[#f8fafc] border-y-2 border-[#0f172a]">
              <th className="px-3 py-2 text-right">البيان</th>
              <th className="px-3 py-2 text-center">الكمية</th>
              <th className="px-3 py-2 text-left">سعر الوحدة</th>
              <th className="px-3 py-2 text-left">ضريبة</th>
              <th className="px-3 py-2 text-left">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {(data.quotation_lines || []).map((line, i) => (
              <tr key={i} className="border-b">
                <td className="px-3 py-2">{line.description}</td>
                <td className="px-3 py-2 text-center">{line.qty}</td>
                <td className="px-3 py-2 text-left">{f(line.unit_price)}</td>
                <td className="px-3 py-2 text-left">{line.vat_rate != null ? `${line.vat_rate}%` : "—"}</td>
                <td className="px-3 py-2 text-left">{f(line.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-left space-y-1">
          <p className="text-sm">المجموع الفرعي: <span className="font-medium">{f(data.subtotal)} ر.س</span></p>
          <p className="text-sm">الضريبة: <span className="font-medium">{f(data.vat_total)} ر.س</span></p>
          <p className="text-lg font-bold">الإجمالي: {f(data.total)} ر.س</p>
        </div>
        {data.notes && <p className="mt-6 text-sm text-muted border-t pt-4">{data.notes}</p>}
        <div className="mt-8 pt-4 border-t text-xs text-muted text-center">
          <p>—— توقيع ———</p>
        </div>
      </div>
    </div>
  );
}
