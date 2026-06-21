"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface FormData {
  name_ar: string;
  name_en: string;
  type: "individual" | "company";
  vat: string;
  cr: string;
  unified_no: string;
  mobile: string;
  phone: string;
  email: string;
  city: string;
  country: string;
  district: string;
  street: string;
  building_no: string;
  additional_no: string;
  postal_code: string;
  address: string;
  project_name: string;
  contact_person: string;
  customer_number: string;
  opening_balance: number;
  notes: string;
  status: "active" | "inactive";
}

export default function NewCustomerPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: { type: "individual", status: "active", opening_balance: 0, country: "المملكة العربية السعودية" },
  });

  async function onSubmit(data: FormData) {
    setError("");
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error); return; }
    router.push("/customers");
    router.refresh();
  }

  return (
    <div>
      <PageHeader
        title="إضافة عميل"
        description="إضافة جهة اتصال جديدة"
        action={
          <Button variant="outline" onClick={() => router.back()}>رجوع</Button>
        }
      />
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--fg)" }}>البيانات الأساسية</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>الاسم (عربي) *</Label>
                  <Input {...register("name_ar", { required: "هذا الحقل مطلوب" })} />
                  {errors.name_ar && <p className="text-sm" style={{ color: "var(--danger)" }}>{errors.name_ar.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label>الاسم (إنجليزي)</Label>
                  <Input {...register("name_en")} />
                </div>
                <div className="space-y-1">
                  <Label>النوع *</Label>
                  <Select defaultValue="individual" onValueChange={(v) => setValue("type", v as FormData["type"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">فرد</SelectItem>
                      <SelectItem value="company">شركة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>رقم العميل</Label>
                  <Input {...register("customer_number")} />
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
                  <Label>المدينة</Label>
                  <Input {...register("city")} />
                </div>
                <div className="space-y-1">
                  <Label>الرصيد الافتتاحي</Label>
                  <Input type="number" step="0.01" {...register("opening_balance", { valueAsNumber: true })} />
                </div>
                <div className="space-y-1">
                  <Label>الحالة</Label>
                  <Select defaultValue="active" onValueChange={(v) => setValue("status", v as FormData["status"])}>
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
              <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--fg)" }}>العنوان الوطني</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>الدولة</Label>
                  <Input {...register("country")} />
                </div>
                <div className="space-y-1">
                  <Label>المنطقة / الحي</Label>
                  <Input {...register("district")} />
                </div>
                <div className="space-y-1">
                  <Label>الشارع</Label>
                  <Input {...register("street")} />
                </div>
                <div className="space-y-1">
                  <Label>رقم المبنى</Label>
                  <Input {...register("building_no")} />
                </div>
                <div className="space-y-1">
                  <Label>الرقم الإضافي</Label>
                  <Input {...register("additional_no")} />
                </div>
                <div className="space-y-1">
                  <Label>الرمز البريدي</Label>
                  <Input {...register("postal_code")} />
                </div>
              </div>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label>ملاحظات</Label>
              <Textarea {...register("notes")} />
            </div>

            {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "جار الحفظ..." : "حفظ"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>إلغاء</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}