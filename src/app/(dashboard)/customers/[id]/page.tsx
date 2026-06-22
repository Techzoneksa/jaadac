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
import { MapPin, ShieldCheck } from "lucide-react";

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { register, handleSubmit, setValue, reset, formState: { isSubmitting } } = useForm<Customer>();

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

  if (loading) return <p className="text-center py-8" style={{ color: "var(--text-muted)" }}>جار التحميل...</p>;

  return (
    <div>
      <PageHeader title="تعديل العميل" description="تحديث بيانات جهة الاتصال"
        action={<Button variant="outline" onClick={() => router.back()}>رجوع</Button>} />
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--fg)" }}>البيانات الأساسية</h3>
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
                  <Select onValueChange={(v) => setValue("type", v as Customer["type"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">فرد</SelectItem>
                      <SelectItem value="company">شركة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>الجوال</Label>
                  <Input {...register("mobile")} />
                </div>
                <div className="space-y-1">
                  <Label>الهاتف</Label>
                  <Input {...register("phone")} />
                </div>
                <div className="space-y-1">
                  <Label>البريد الإلكتروني</Label>
                  <Input type="email" {...register("email")} />
                </div>
                <div className="space-y-1">
                  <Label>جهة الاتصال</Label>
                  <Input {...register("contact_person")} />
                </div>
                <div className="space-y-1">
                  <Label>الرصيد الافتتاحي</Label>
                  <Input type="number" step="0.01" {...register("opening_balance", { valueAsNumber: true })} />
                </div>
                <div className="space-y-1">
                  <Label>الحالة</Label>
                  <Select onValueChange={(v) => setValue("status", v as Customer["status"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="inactive">غير نشط</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--fg)" }}>البيانات الضريبية والتجارية</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>الرقم الضريبي (VAT)</Label>
                  <Input {...register("vat")} />
                </div>
                <div className="space-y-1">
                  <Label>السجل التجاري (CR)</Label>
                  <Input {...register("cr")} />
                </div>
                <div className="space-y-1">
                  <Label>الرقم الموحد</Label>
                  <Input {...register("unified_no")} />
                </div>
                <div className="space-y-1">
                  <Label>اسم المشروع</Label>
                  <Input {...register("project_name")} />
                </div>
              </div>
            </div>

            <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-4 w-4" style={{ color: "var(--primary)" }} />
                <h3 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>العنوان الوطني</h3>
              </div>
              <div className="space-y-5">
                <div className="flex items-end justify-between">
                  <div className="space-y-1 flex-1">
                    <Label>العنوان المختصر</Label>
                    <Input {...register("national_short_address")} placeholder="مثال: JEDB1234" />
                  </div>
                  <div className="ml-4">
                    <Button type="button" variant="outline" size="sm" disabled className="h-10 rounded-xl" title="سيتم ربط خدمة العنوان الوطني لاحقًا">
                      <ShieldCheck className="h-4 w-4 ml-1" />التحقق من العنوان الوطني
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label>الدولة</Label>
                    <Input {...register("country")} />
                  </div>
                  <div className="space-y-1">
                    <Label>المدينة</Label>
                    <Input {...register("city")} />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label>الحي / المنطقة</Label>
                    <Input {...register("district")} />
                  </div>
                  <div className="space-y-1">
                    <Label>الشارع</Label>
                    <Input {...register("street")} />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label>رقم المبنى</Label>
                    <Input {...register("building_no")} />
                  </div>
                  <div className="space-y-1">
                    <Label>الرقم الإضافي</Label>
                    <Input {...register("additional_no")} />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label>الرمز البريدي</Label>
                    <Input {...register("postal_code")} />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label>ملاحظات</Label>
              <Textarea {...register("notes")} />
            </div>

            {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}
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