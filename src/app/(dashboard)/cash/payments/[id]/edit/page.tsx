"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { MoneyDisplay } from "@/components/ui/MoneyDisplay";

type PaymentData = Record<string, unknown> & {
  number?: string; date?: string; amount?: number; payment_method?: string; status?: string; notes?: string;
};

export default function EditPaymentPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<PaymentData | null>(null);

  useEffect(() => {
    fetch(`/api/payments?id=${params.id}`)
      .then((r) => r.json())
      .then((data) => { setPayment(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  if (loading) return <p className="text-center py-8 text-[#64748b]">جار التحميل...</p>;
  if (!payment) return <p className="text-center py-8 text-[#dc2626]">لم يتم العثور على السند</p>;

  return (
    <div>
      <PageHeader title={`تعديل سند صرف #${payment.number}`}
        action={<Button variant="outline" onClick={() => router.back()}>رجوع</Button>} />
      <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-4 mb-4 text-center">
        تحرير قيد التطوير
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-4 sm:grid-cols-3 mb-4">
            <div><Label>الرقم</Label><p className="font-medium">{payment.number}</p></div>
            <div><Label>التاريخ</Label><p className="font-medium">{payment.date}</p></div>
            <div><Label>المبلغ</Label><p className="font-medium"><MoneyDisplay amount={payment.amount ?? 0} /></p></div>
            <div><Label>طريقة الدفع</Label><p className="font-medium">{payment.payment_method}</p></div>
            <div><Label>الحالة</Label><p className="font-medium">{payment.status}</p></div>
          </div>
          {payment.notes && <p className="text-sm text-[#64748b]">{payment.notes}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
