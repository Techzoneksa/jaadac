"use client";

import { useState } from "react";
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

interface FormData {
  name_ar: string; name_en: string; type: "individual" | "company";
  vat: string; mobile: string; email: string; city: string; address: string;
  notes: string; status: "active" | "inactive";
}

export default function NewSupplierPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: { type: "individual", status: "active" },
  });

  async function onSubmit(data: FormData) {
    setError("");
    const res = await fetch("/api/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error); return; }
    router.push("/suppliers");
    router.refresh();
  }

  return (
    <div>
      <PageHeader title="إضافة مورد" description="إضافة جهة اتصال مورد جديدة"
        action={<Button variant="outline" onClick={() => router.back()}>رجوع</Button>} />
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>الاسم (عربي) *</Label>
                <Input {...register("name_ar", { required: "هذا الحقل مطلوب" })} />
                {errors.name_ar && <p className="text-sm text-[#dc2626]">{errors.name_ar.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>الاسم (إنجليزي)</Label>
                <Input {...register("name_en")} />
              </div>
              <div className="space-y-1">
                <Label>النوع *</Label>
                <Select defaultValue="individual" onValueChange={(v) => setValue("type", v as any)}>
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
                <Label>الحالة</Label>
                <Select defaultValue="active" onValueChange={(v) => setValue("status", v as any)}>
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
    </div>
  );
}
