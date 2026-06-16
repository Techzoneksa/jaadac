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
  name_ar: string; name_en: string; sku: string;
  type: "service" | "non_stock" | "stock";
  sales_price: number; purchase_price: number;
  taxable: boolean; vat_rate: number; qty: number; low_stock: number;
}

export default function NewItemPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: { type: "service", sales_price: 0, purchase_price: 0, vat_rate: 15, taxable: true, qty: 0, low_stock: 0 },
  });

  const itemType = watch("type");

  async function onSubmit(data: FormData) {
    setError("");
    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error); return; }
    router.push("/items");
    router.refresh();
  }

  return (
    <div>
      <PageHeader title="إضافة صنف" description="إضافة صنف أو خدمة جديدة"
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
                <Label>رمز الصنف (SKU)</Label>
                <Input {...register("sku")} />
              </div>
              <div className="space-y-1">
                <Label>النوع *</Label>
                <Select defaultValue="service" onValueChange={(v) => setValue("type", v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="service">خدمة</SelectItem>
                    <SelectItem value="non_stock">غير مخزون</SelectItem>
                    <SelectItem value="stock">مخزون</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>سعر البيع</Label>
                <Input type="number" step="0.01" {...register("sales_price", { valueAsNumber: true })} />
              </div>
              <div className="space-y-1">
                <Label>سعر الشراء</Label>
                <Input type="number" step="0.01" {...register("purchase_price", { valueAsNumber: true })} />
              </div>
              <div className="space-y-1">
                <Label>نسبة الضريبة %</Label>
                <Input type="number" step="0.01" {...register("vat_rate", { valueAsNumber: true })} />
              </div>
              {itemType === "stock" && (
                <>
                  <div className="space-y-1">
                    <Label>الكمية</Label>
                    <Input type="number" step="0.01" {...register("qty", { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-1">
                    <Label>الحد الأدنى</Label>
                    <Input type="number" step="0.01" {...register("low_stock", { valueAsNumber: true })} />
                  </div>
                </>
              )}
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
