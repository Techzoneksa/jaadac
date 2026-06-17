"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

type CreditNoteData = Record<string, unknown> & {
  number?: string; date?: string; customer_name?: string; total?: number; status?: string; notes?: string;
};

export default function CreditNoteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [cn, setCn] = useState<CreditNoteData | null>(null);

  useEffect(() => {
    fetch(`/api/credit-notes?id=${params.id}`)
      .then((r) => r.json())
      .then((data) => { setCn(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  if (loading) return <p className="text-center py-8 text-[#64748b]">جار التحميل...</p>;
  if (!cn) return <p className="text-center py-8 text-[#dc2626]">لم يتم العثور على إشعار الدائن</p>;

  return (
    <div>
      <PageHeader title={`إشعار دائن #${cn.number}`} description={`تاريخ: ${cn.date}`}
        action={<div className="flex gap-2"><Button variant="outline" onClick={() => router.push(`/sales/credit-notes/${params.id}/print`)}>طباعة</Button><Button variant="outline" onClick={() => router.back()}>رجوع</Button></div>} />
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-4 sm:grid-cols-3 mb-4">
            <div><Label>الرقم</Label><p className="font-medium">{cn.number}</p></div>
            <div><Label>التاريخ</Label><p className="font-medium">{cn.date}</p></div>
            <div><Label>العميل</Label><p className="font-medium">{cn.customer_name}</p></div>
            <div><Label>الإجمالي</Label><p className="font-medium">{cn.total?.toLocaleString()} ر.س</p></div>
            <div><Label>الحالة</Label><p className="font-medium">{cn.status}</p></div>
          </div>
          {cn.notes && <p className="text-sm text-[#64748b]">{cn.notes}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
