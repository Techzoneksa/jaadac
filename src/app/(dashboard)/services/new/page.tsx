"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useApi } from "@/lib/hooks/use-api";
import type { ServiceCategory } from "@/lib/types";
import { toast } from "sonner";

export default function NewServicePage() {
  const router = useRouter();
  const { data: categories } = useApi<ServiceCategory>("/api/services/categories");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name_ar: "", name_en: "", service_category_id: "",
    sales_price: "0", purchase_price: "0", vat_rate: "15",
    description: "", status: "active",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name_ar.trim()) { toast.error("اسم الخدمة مطلوب"); return; }
    setSaving(true);
    const body = {
      name_ar: form.name_ar, name_en: form.name_en,
      service_category_id: form.service_category_id || null,
      type: "service", sales_price: Number(form.sales_price),
      purchase_price: Number(form.purchase_price), vat_rate: Number(form.vat_rate),
      taxable: true, notes: form.description, status: form.status,
      is_active: form.status === "active", track_inventory: false,
    };
    const res = await fetch("/api/services", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) { toast.error(json.error); return; }
    toast.success("تم إضافة الخدمة");
    router.push("/services");
    router.refresh();
  }

  return (
    <div>
      <PageHeader title="إضافة خدمة جديدة" description="أدخل بيانات الخدمة" action={<Button variant="outline" onClick={() => router.back()}>رجوع</Button>} />
      <Card><CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1"><Label>اسم الخدمة *</Label><Input value={form.name_ar} onChange={(e) => setForm({...form, name_ar: e.target.value})} placeholder="اسم الخدمة" /></div>
            <div className="space-y-1"><Label>الاسم (إنجليزي)</Label><Input value={form.name_en} onChange={(e) => setForm({...form, name_en: e.target.value})} /></div>
            <div className="space-y-1"><Label>فئة الخدمة</Label>
              <Select value={form.service_category_id} onValueChange={(v) => setForm({...form, service_category_id: v})}>
                <SelectTrigger><SelectValue placeholder="اختر فئة" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="بدون">بدون</SelectItem>
                  {categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>سعر البيع</Label><Input type="number" step="0.01" value={form.sales_price} onChange={(e) => setForm({...form, sales_price: e.target.value})} /></div>
            <div className="space-y-1"><Label>سعر الشراء</Label><Input type="number" step="0.01" value={form.purchase_price} onChange={(e) => setForm({...form, purchase_price: e.target.value})} /></div>
            <div className="space-y-1"><Label>نسبة الضريبة %</Label><Input type="number" step="0.01" value={form.vat_rate} onChange={(e) => setForm({...form, vat_rate: e.target.value})} /></div>
            <div className="space-y-1 sm:col-span-2"><Label>الوصف</Label><Input value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} placeholder="وصف الخدمة" /></div>
            <div className="space-y-1"><Label>الحالة</Label>
              <Select value={form.status} onValueChange={(v) => setForm({...form, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="inactive">غير نشط</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>{saving ? "جار الحفظ..." : "حفظ"}</Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>إلغاء</Button>
          </div>
        </form>
      </CardContent></Card>
    </div>
  );
}
