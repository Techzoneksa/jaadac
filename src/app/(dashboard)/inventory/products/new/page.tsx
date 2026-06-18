"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useApi } from "@/lib/hooks/use-api";
import type { InventoryBranch, InventoryCategory } from "@/lib/types";
import { toast } from "sonner";

export default function NewProductPage() {
  const router = useRouter();
  const { data: branches } = useApi<InventoryBranch>("/api/inventory/branches");
  const { data: categories } = useApi<InventoryCategory>("/api/inventory/categories");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name_ar: "", name_en: "", sku: "", barcode: "", unit: "قطعة",
    category_id: "", sales_price: "0", purchase_price: "0", cost: "0",
    vat_rate: "15", track_inventory: "true", qty: "0", reorder_level: "0",
    status: "active", branch_id: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name_ar.trim()) { toast.error("اسم المنتج مطلوب"); return; }
    setSaving(true);
    const body = {
      name_ar: form.name_ar, name_en: form.name_en, sku: form.sku, barcode: form.barcode,
      unit: form.unit, category_id: form.category_id || null,
      type: form.track_inventory === "true" ? "stock" : "non_stock",
      sales_price: Number(form.sales_price), purchase_price: Number(form.purchase_price),
      cost: Number(form.cost), vat_rate: Number(form.vat_rate),
      track_inventory: form.track_inventory === "true",
      qty: Number(form.qty), reorder_level: Number(form.reorder_level),
      current_stock: Number(form.qty), status: form.status, is_active: form.status === "active",
    };
    const res = await fetch("/api/inventory/products", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) { toast.error(json.error); return; }
    toast.success("تم إضافة المنتج");
    router.push("/inventory/products");
    router.refresh();
  }

  return (
    <div>
      <PageHeader title="إضافة منتج جديد" description="أدخل بيانات المنتج المخزني" action={<Button variant="outline" onClick={() => router.back()}>رجوع</Button>} />
      <Card><CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1"><Label>اسم المنتج *</Label><Input value={form.name_ar} onChange={(e) => setForm({...form, name_ar: e.target.value})} placeholder="اسم المنتج" /></div>
            <div className="space-y-1"><Label>الاسم (إنجليزي)</Label><Input value={form.name_en} onChange={(e) => setForm({...form, name_en: e.target.value})} /></div>
            <div className="space-y-1"><Label>SKU</Label><Input value={form.sku} onChange={(e) => setForm({...form, sku: e.target.value})} /></div>
            <div className="space-y-1"><Label>الباركود</Label><Input value={form.barcode} onChange={(e) => setForm({...form, barcode: e.target.value})} /></div>
            <div className="space-y-1"><Label>الفئة</Label>
              <Select value={form.category_id} onValueChange={(v) => setForm({...form, category_id: v})}>
                <SelectTrigger><SelectValue placeholder="اختر فئة" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="بدون">بدون</SelectItem>
                  {categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>وحدة القياس</Label>
              <Select value={form.unit} onValueChange={(v) => setForm({...form, unit: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="قطعة">قطعة</SelectItem>
                  <SelectItem value="كجم">كجم</SelectItem>
                  <SelectItem value="لتر">لتر</SelectItem>
                  <SelectItem value="متر">متر</SelectItem>
                  <SelectItem value="كرتون">كرتون</SelectItem>
                  <SelectItem value="حزمة">حزمة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>سعر البيع</Label><Input type="number" step="0.01" value={form.sales_price} onChange={(e) => setForm({...form, sales_price: e.target.value})} /></div>
            <div className="space-y-1"><Label>سعر الشراء</Label><Input type="number" step="0.01" value={form.purchase_price} onChange={(e) => setForm({...form, purchase_price: e.target.value})} /></div>
            <div className="space-y-1"><Label>التكلفة</Label><Input type="number" step="0.01" value={form.cost} onChange={(e) => setForm({...form, cost: e.target.value})} /></div>
            <div className="space-y-1"><Label>نسبة الضريبة %</Label><Input type="number" step="0.01" value={form.vat_rate} onChange={(e) => setForm({...form, vat_rate: e.target.value})} /></div>
            <div className="space-y-1"><Label>تتبع المخزون</Label>
              <Select value={form.track_inventory} onValueChange={(v) => setForm({...form, track_inventory: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">نعم</SelectItem>
                  <SelectItem value="false">لا</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.track_inventory === "true" && (
              <>
                <div className="space-y-1"><Label>الرصيد الافتتاحي</Label><Input type="number" step="0.01" value={form.qty} onChange={(e) => setForm({...form, qty: e.target.value})} /></div>
                <div className="space-y-1"><Label>حد إعادة الطلب</Label><Input type="number" step="0.01" value={form.reorder_level} onChange={(e) => setForm({...form, reorder_level: e.target.value})} /></div>
              </>
            )}
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
