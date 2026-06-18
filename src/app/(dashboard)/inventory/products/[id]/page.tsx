"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Item } from "@/lib/types";
import { toast } from "sonner";

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { register, handleSubmit, setValue, reset, watch, formState: { isSubmitting } } = useForm<Item>();

  useEffect(() => {
    fetch(`/api/inventory/products/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        reset(data);
        setLoading(false);
      })
      .catch(() => { setError("فشل تحميل البيانات"); setLoading(false); });
  }, [params.id, reset]);

  async function onSubmit(data: Item) {
    const res = await fetch(`/api/inventory/products/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) { toast.error(json.error); return; }
    toast.success("تم تحديث المنتج");
    router.push("/inventory/products");
    router.refresh();
  }

  if (loading) return <p className="text-center py-8 text-[#64748b]">جار التحميل...</p>;
  if (error) return <p className="text-center py-8 text-[#dc2626]">{error}</p>;

  return (
    <div>
      <PageHeader title="بطاقة المنتج" description="عرض وتعديل بيانات المنتج" action={<Button variant="outline" onClick={() => router.back()}>رجوع</Button>} />
      <Card><CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1"><Label>اسم المنتج *</Label><Input {...register("name_ar", { required: true })} /></div>
            <div className="space-y-1"><Label>الاسم (إنجليزي)</Label><Input {...register("name_en")} /></div>
            <div className="space-y-1"><Label>SKU</Label><Input {...register("sku")} /></div>
            <div className="space-y-1"><Label>سعر البيع</Label><Input type="number" step="0.01" {...register("sales_price", { valueAsNumber: true })} /></div>
            <div className="space-y-1"><Label>سعر الشراء</Label><Input type="number" step="0.01" {...register("purchase_price", { valueAsNumber: true })} /></div>
            <div className="space-y-1"><Label>التكلفة</Label><Input type="number" step="0.01" {...register("cost", { valueAsNumber: true })} /></div>
            <div className="space-y-1"><Label>الرصيد الحالي</Label><p className="text-lg font-bold">{watch("current_stock") ?? 0}</p></div>
            <div className="space-y-1"><Label>نسبة الضريبة %</Label><Input type="number" step="0.01" {...register("vat_rate", { valueAsNumber: true })} /></div>
            <div className="space-y-1"><Label>الحالة</Label>
              <Select onValueChange={(v) => setValue("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="inactive">غير نشط</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "جار الحفظ..." : "حفظ التغييرات"}</Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>إلغاء</Button>
          </div>
        </form>
      </CardContent></Card>
    </div>
  );
}
