"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

type JournalEntryData = Record<string, unknown> & {
  number?: string; date?: string; description?: string; status?: string;
  lines?: Array<{ account_name?: string; debit?: number; credit?: number }>;
};

export default function JournalEntryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [entry, setEntry] = useState<JournalEntryData | null>(null);

  useEffect(() => {
    fetch(`/api/journal?id=${params.id}`)
      .then((r) => r.json())
      .then((data) => { setEntry(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  if (loading) return <p className="text-center py-8 text-[#64748b]">جار التحميل...</p>;
  if (!entry) return <p className="text-center py-8 text-[#dc2626]">لم يتم العثور على القيد</p>;

  return (
    <div>
      <PageHeader title={`قيد #${entry.number}`} description={`تاريخ: ${entry.date}`}
        action={<div className="flex gap-2"><Button variant="outline" onClick={() => router.push(`/accounting/journal/${params.id}/print`)}>طباعة</Button><Button variant="outline" onClick={() => router.back()}>رجوع</Button></div>} />
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-4 sm:grid-cols-3 mb-4">
            <div><Label>الرقم</Label><p className="font-medium">{entry.number}</p></div>
            <div><Label>التاريخ</Label><p className="font-medium">{entry.date}</p></div>
            <div><Label>الحالة</Label><p className="font-medium">{entry.status === "posted" ? "مرحّل" : "مسودة"}</p></div>
          </div>
          {entry.description && <p className="mb-4 text-sm text-[#64748b]">{entry.description}</p>}
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-[#f8fafc]">
                <th className="px-4 py-2 text-right">الحساب</th>
                <th className="px-4 py-2 text-right">مدين</th>
                <th className="px-4 py-2 text-right">دائن</th>
              </tr></thead>
              <tbody>
                {(entry.lines || []).map((l, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-4 py-2">{l.account_name}</td>
                    <td className="px-4 py-2">{l.debit?.toLocaleString()} ر.س</td>
                    <td className="px-4 py-2">{l.credit?.toLocaleString()} ر.س</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
