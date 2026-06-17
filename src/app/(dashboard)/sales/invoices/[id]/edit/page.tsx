"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

type InvoiceData = Record<string, unknown> & {
  number?: string; date?: string; status?: string; subtotal?: number;
  vat_total?: number; total?: number; notes?: string;
  invoice_lines?: Array<{ description?: string; qty?: number; unit_price?: number; total?: number }>;
};

export default function EditSalesInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);

  useEffect(() => {
    fetch(`/api/invoices?id=${params.id}`)
      .then((r) => r.json())
      .then((data) => { setInvoice(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  if (loading) return <p className="text-center py-8 text-[#64748b]">جار التحميل...</p>;
  if (!invoice) return <p className="text-center py-8 text-[#dc2626]">لم يتم العثور على الفاتورة</p>;

  return (
    <div>
      <PageHeader title={`تعديل فاتورة #${invoice.number}`}
        action={<Button variant="outline" onClick={() => router.back()}>رجوع</Button>} />
      <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-4 mb-4 text-center">
        تحرير قيد التطوير
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-4 sm:grid-cols-3 mb-4">
            <div><Label>الرقم</Label><p className="font-medium">{invoice.number}</p></div>
            <div><Label>التاريخ</Label><p className="font-medium">{invoice.date}</p></div>
            <div><Label>الحالة</Label><p className="font-medium">{invoice.status}</p></div>
          </div>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-[#f8fafc]">
                <th className="px-4 py-2 text-right">الصنف</th>
                <th className="px-4 py-2 text-right">الكمية</th>
                <th className="px-4 py-2 text-right">سعر الوحدة</th>
                <th className="px-4 py-2 text-right">الإجمالي</th>
              </tr></thead>
              <tbody>
                {(invoice.invoice_lines || []).map((l, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-4 py-2">{l.description}</td>
                    <td className="px-4 py-2">{l.qty}</td>
                    <td className="px-4 py-2">{l.unit_price?.toLocaleString()} ر.س</td>
                    <td className="px-4 py-2">{l.total?.toLocaleString()} ر.س</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-left space-y-1">
            <p className="text-sm">المجموع الفرعي: {invoice.subtotal?.toLocaleString()} ر.س</p>
            <p className="text-sm">الضريبة: {invoice.vat_total?.toLocaleString()} ر.س</p>
            <p className="text-lg font-bold">الإجمالي: {invoice.total?.toLocaleString()} ر.س</p>
          </div>
          {invoice.notes && <p className="mt-4 text-sm text-[#64748b]">{invoice.notes}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
