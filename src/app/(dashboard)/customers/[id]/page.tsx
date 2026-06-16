"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<Customer>();

  useEffect(() => {
    fetch(`/api/customers?id=${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        reset(data);
        setLoading(false);
      })
      .catch(() => { setError("فشل تحميل البيانات"); setLoading(false); });
  }, [params.id, reset]);

  async function onSubmit(data: Customer) {
    setError("");
    const res = await fetch(`/api/customers?id=${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error); return; }
    router.push("/customers");
    router.refresh();
  }

  if (loading) return <p className="text-center py-8 text-[#64748b]">جار التحميل...</p>;

  return (
    <div>
      <PageHeader title="تعديل العميل" description="تحديث بيانات جهة الاتصال"
        action={<Button variant="outline" onClick={() => router.back()}>رجوع</Button>} />
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>الاسم (عربي) *</Label>
                <Input {...register("name_ar", { required: true })} />
              </div>
              <div className="space-y-1">
                <Label>الاسم (إنجليزي)</Label>
                <Input {...register("name_en")} />
              </div>
              <div className="space-y-1">
                <Label>النوع</Label>
                <Select onValueChange={(v) => setValue("type", v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">فرد</SelectItem>
                    <SelectItem value="company">شركة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>الرقم الضريبي</Label>
                <Input {...register("vat")} />
              </div>
              <div className="space-y-1">
                <Label>رقم الجوال</Label>
                <Input {...register("mobile")} />
              </div>
              <div className="space-y-1">
                <Label>البريد الإلكتروني</Label>
                <Input type="email" {...register("email")} />
              </div>
              <div className="space-y-1">
                <Label>المدينة</Label>
                <Input {...register("city")} />
              </div>
              <div className="space-y-1">
                <Label>الرصيد الافتتاحي</Label>
                <Input type="number" step="0.01" {...register("opening_balance", { valueAsNumber: true })} />
              </div>
              <div className="space-y-1">
                <Label>الحالة</Label>
                <Select onValueChange={(v) => setValue("status", v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="inactive">غير نشط</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>العنوان</Label>
                <Textarea {...register("address")} />
              </div>
            </div>
            {error && <p className="text-sm text-[#dc2626]">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "جار الحفظ..." : "حفظ التغييرات"}</Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>إلغاء</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
