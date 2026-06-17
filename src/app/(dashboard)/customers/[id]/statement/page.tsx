"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function CustomerStatementPage() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<{ customer?: Record<string, unknown>; invoices?: unknown[]; receipts?: unknown[]; balance?: number } | null>(null);

  useEffect(() => {
    fetch(`/api/customers/statement?id=${params.id}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError("فشل تحميل كشف الحساب"); setLoading(false); });
  }, [params.id]);

  if (loading) return <p className="text-center py-8 text-[#64748b]">جار التحميل...</p>;
  if (error) return <p className="text-center py-8 text-[#dc2626]">{error}</p>;
  if (!data) return <p className="text-center py-8 text-[#dc2626]">لا توجد بيانات</p>;

  return (
    <div>
      <PageHeader title="كشف حساب عميل" description={data.customer?.name_ar as string} />
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-4 sm:grid-cols-2 mb-6">
            <div><Label>العميل</Label><p className="font-medium">{data.customer?.name_ar as string}</p></div>
            <div><Label>الرصيد</Label><p className="font-medium">{data.balance?.toLocaleString()} ر.س</p></div>
          </div>
          {(data.invoices?.length ?? 0) > 0 && (
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-[#f8fafc]">
                  <th className="px-4 py-2 text-right">الرقم</th>
                  <th className="px-4 py-2 text-right">التاريخ</th>
                  <th className="px-4 py-2 text-right">المبلغ</th>
                </tr></thead>
                <tbody>
                  {(data.invoices as Array<{ number?: string; date?: string; total?: number }>).map((inv, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-4 py-2">{inv.number}</td>
                      <td className="px-4 py-2">{inv.date}</td>
                      <td className="px-4 py-2">{inv.total?.toLocaleString()} ر.س</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {(data.receipts?.length ?? 0) > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-[#f8fafc]">
                  <th className="px-4 py-2 text-right">رقم السند</th>
                  <th className="px-4 py-2 text-right">التاريخ</th>
                  <th className="px-4 py-2 text-right">المبلغ</th>
                </tr></thead>
                <tbody>
                  {(data.receipts as Array<{ number?: string; date?: string; amount?: number }>).map((r, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-4 py-2">{r.number}</td>
                      <td className="px-4 py-2">{r.date}</td>
                      <td className="px-4 py-2">{r.amount?.toLocaleString()} ر.س</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
