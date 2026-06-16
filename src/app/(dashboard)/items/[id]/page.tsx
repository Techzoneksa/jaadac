"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import type { Item } from "@/lib/types";

export default function EditItemPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { register, handleSubmit, setValue, reset, watch, formState: { isSubmitting } } = useForm<Item>();

  useEffect(() => {
    fetch(`/api/items?id=${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        reset(data);
        setLoading(false);
      })
      .catch(() => { setError("فشل تحميل البيانات"); setLoading(false); });
  }, [params.id, reset]);

  const itemType = watch("type");

  async function onSubmit(data: Item) {
    setError("");
    const res = await fetch(`/api/items?id=${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error); return; }
    router.push("/items");
    router.refresh();
  }

  if (loading) return <p className="text-center py-8 text-[#64748b]">جار التحميل...</p>;

  return (
    <div>
      <PageHeader title="تعديل الصنف" description="تحديث بيانات الصنف"
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
                <Label>رمز الصنف (SKU)</Label>
                <Input {...register("sku")} />
              </div>
              <div className="space-y-1">
                <Label>النوع</Label>
                <Select onValueChange={(v) => setValue("type", v as Item["type"])}>
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
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "جار الحفظ..." : "حفظ التغييرات"}</Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>إلغاء</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
