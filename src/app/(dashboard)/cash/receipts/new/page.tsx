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
import type { Customer } from "@/lib/types";
import { QuickAddCustomer } from "@/components/quick-add/QuickAddCustomer";

const $$num = (p: string) => p + String(Date.now());

interface FormData {
  date: string;
  customer_id: string;
  amount: number;
  payment_method: string;
  reference: string;
  notes: string;
  status: string;
}

export default function NewReceiptPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showAddCustomer, setShowAddCustomer] = useState(false);

  const { register, handleSubmit, setValue, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: { date: new Date().toISOString().slice(0, 10), payment_method: "cash", status: "draft" },
  });

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setCustomers(d); })
      .catch(() => {});
  }, []);

  async function onSubmit(data: FormData) {
    setError("");
    const res = await fetch("/api/receipts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, number: $$num("RCP-") }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error); return; }
    router.push("/cash/receipts");
    router.refresh();
  }

  return (
    <div>
      <PageHeader title="سند قبض جديد" description="تسجيل سند قبض"
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
                <Label>العميل *</Label>
                <Select onValueChange={(v) => { if (v === "__new__") setShowAddCustomer(true); else setValue("customer_id", v); }}>
                  <SelectTrigger><SelectValue placeholder="اختر عميلاً" /></SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name_ar}</SelectItem>
                    ))}
                    <SelectItem value="__new__" className="text-[#2563eb] font-medium border-t border-[#e2e8f0]">
                      + إنشاء عميل جديد
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
      <QuickAddCustomer open={showAddCustomer} onOpenChange={setShowAddCustomer}
        onCreated={(c) => { setCustomers((prev) => [...prev, c as unknown as Customer]); setValue("customer_id", c.id); }} />
    </div>
  );
}
