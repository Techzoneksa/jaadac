"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

type DebitNoteData = Record<string, unknown> & {
  number?: string; date?: string; supplier_name?: string; total?: number; status?: string; notes?: string;
};

export default function EditDebitNotePage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [dn, setDn] = useState<DebitNoteData | null>(null);

  useEffect(() => {
    fetch(`/api/debit-notes?id=${params.id}`)
      .then((r) => r.json())
      .then((data) => { setDn(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  if (loading) return <p className="text-center py-8 text-[#64748b]">جار التحميل...</p>;
  if (!dn) return <p className="text-center py-8 text-[#dc2626]">لم يتم العثور على إشعار المدين</p>;

  return (
    <div>
      <PageHeader title={`تعديل إشعار مدين #${dn.number}`}
        action={<Button variant="outline" onClick={() => router.back()}>رجوع</Button>} />
      <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-4 mb-4 text-center">
        تحرير قيد التطوير
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-4 sm:grid-cols-3 mb-4">
            <div><Label>الرقم</Label><p className="font-medium">{dn.number}</p></div>
            <div><Label>التاريخ</Label><p className="font-medium">{dn.date}</p></div>
            <div><Label>المورد</Label><p className="font-medium">{dn.supplier_name}</p></div>
            <div><Label>الإجمالي</Label><p className="font-medium">{dn.total?.toLocaleString()} ر.س</p></div>
            <div><Label>الحالة</Label><p className="font-medium">{dn.status}</p></div>
          </div>
          {dn.notes && <p className="text-sm text-[#64748b]">{dn.notes}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
