"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import type { Supplier } from "@/lib/types";
import { QuickAddSupplier } from "@/components/quick-add/QuickAddSupplier";

const $$num = (p: string) => p + String(Date.now());

interface FormData {
  date: string;
  supplier_id: string;
  amount: number;
  payment_method: string;
  reference: string;
  notes: string;
  status: string;
}

export default function NewPaymentPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showAddSupplier, setShowAddSupplier] = useState(false);

  const { register, handleSubmit, setValue, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: { date: new Date().toISOString().slice(0, 10), payment_method: "cash", status: "draft" },
  });

  useEffect(() => {
    fetch("/api/suppliers")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setSuppliers(d); })
      .catch(() => {});
  }, []);

  async function onSubmit(data: FormData) {
    setError("");
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, number: $$num("PAY-") }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error); return; }
    router.push("/cash/payments");
    router.refresh();
  }

  return (
    <div>
      <PageHeader title="سند صرف جديد" description="تسجيل سند صرف"
        action={<Button variant="outline" onClick={() => router.back()}>رجوع</Button>} />
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>التاريخ *</Label>
                <Input type="date" {...register("date", { required: true })} />
              </div>
              <div className="space-y-1">
                <Label>المورد *</Label>
                <Select onValueChange={(v) => { if (v === "__new__") setShowAddSupplier(true); else setValue("supplier_id", v); }}>
                  <SelectTrigger><SelectValue placeholder="اختر مورداً" /></SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name_ar}</SelectItem>
                    ))}
                    <SelectItem value="__new__" className="text-[#2563eb] font-medium border-t border-[#e2e8f0]">
                      + إضافة مورد جديد
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>المبلغ *</Label>
                <Input type="number" step="0.01" {...register("amount", { required: true, valueAsNumber: true })} />
              </div>
              <div className="space-y-1">
                <Label>طريقة الدفع</Label>
                <Select defaultValue="cash" onValueChange={(v) => setValue("payment_method", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">نقداً</SelectItem>
                    <SelectItem value="bank">بنك</SelectItem>
                    <SelectItem value="check">شيك</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>رقم المرجع</Label>
                <Input {...register("reference")} />
              </div>
              <div className="space-y-1">
                <Label>الحالة</Label>
                <Select defaultValue="draft" onValueChange={(v) => setValue("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">مسودة</SelectItem>
                    <SelectItem value="confirmed">مؤكد</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>ملاحظات</Label>
                <Textarea {...register("notes")} />
              </div>
            </div>
            {error && <p className="text-sm text-[#dc2626]">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "جار الحفظ..." : "حفظ"}</Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>إلغاء</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <QuickAddSupplier open={showAddSupplier} onOpenChange={setShowAddSupplier}
        onCreated={(s) => { setSuppliers((prev) => [...prev, s as unknown as Supplier]); setValue("supplier_id", s.id); }} />
    </div>
  );
}
