"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency, getPaymentMethodLabel } from "@/lib/format";

type ReceiptData = Record<string, unknown> & {
  number?: string; date?: string; amount?: number; payment_method?: string; status?: string; notes?: string;
};

export default function EditReceiptPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  useEffect(() => {
    fetch(`/api/receipts?id=${params.id}`)
      .then((r) => r.json())
      .then((data) => { setReceipt(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  if (loading) return <p className="text-center py-8 text-[#64748b]">جار التحميل...</p>;
  if (!receipt) return <p className="text-center py-8 text-[#dc2626]">لم يتم العثور على السند</p>;

  return (
    <div>
      <PageHeader title={`سند قبض #${receipt.number}`}
        action={<Button variant="outline" onClick={() => router.back()}>رجوع</Button>} />
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-4 sm:grid-cols-3 mb-4">
            <div><Label>الرقم</Label><p className="font-medium">{receipt.number}</p></div>
            <div><Label>التاريخ</Label><p className="font-medium">{receipt.date}</p></div>
            <div><Label>المبلغ</Label><p className="font-medium">{formatCurrency(receipt.amount ?? 0)}</p></div>
            <div><Label>طريقة الدفع</Label><p className="font-medium">{getPaymentMethodLabel(receipt.payment_method || "")}</p></div>
            <div><Label>الحالة</Label><p className="font-medium"><StatusBadge status={receipt.status || ""} /></p></div>
          </div>
          {receipt.notes && <p className="text-sm text-[#64748b]">{receipt.notes}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
