"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export default function EditQuotationPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [quotation, setQuotation] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/quotations?id=${params.id}`)
      .then((r) => r.json())
      .then((data) => { setQuotation(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  if (loading) return <p className="text-center py-8 text-[#64748b]">جار التحميل...</p>;
  if (!quotation) return <p className="text-center py-8 text-[#dc2626]">لم يتم العثور على عرض السعر</p>;

  return (
    <div>
      <PageHeader title={`عرض سعر #${quotation.number}`} description={`تاريخ: ${quotation.date}`}
        action={<Button variant="outline" onClick={() => router.back()}>رجوع</Button>} />
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-4 sm:grid-cols-3 mb-4">
            <div><Label>الرقم</Label><p className="font-medium">{quotation.number}</p></div>
            <div><Label>التاريخ</Label><p className="font-medium">{quotation.date}</p></div>
            <div><Label>الحالة</Label><p className="font-medium">{quotation.status}</p></div>
          </div>
          <div className="text-left space-y-1">
            <p className="text-sm">المجموع الفرعي: {quotation.subtotal?.toLocaleString()} ر.س</p>
            <p className="text-sm">الضريبة: {quotation.vat_total?.toLocaleString()} ر.س</p>
            <p className="text-lg font-bold">الإجمالي: {quotation.total?.toLocaleString()} ر.س</p>
          </div>
          {quotation.notes && <p className="mt-4 text-sm text-[#64748b]">{quotation.notes}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
