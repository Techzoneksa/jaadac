"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Item, InventoryMovement } from "@/lib/types";
import { toast } from "sonner";

const movementTypeLabels: Record<string, string> = {
  opening: "افتتاحي",
  purchase: "مشتريات",
  sale: "مبيعات",
  adjustment: "تسوية",
  transfer_in: "وارد تحويل",
  transfer_out: "صادر تحويل",
  manufacturing_in: "إنتاج وارد",
  manufacturing_out: "إنتاج صادر",
};

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [product, setProduct] = useState<Item | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Item>>({});

  useEffect(() => {
    fetch(`/api/inventory/products/${params.id}`)
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok || json.error) { setError(json.error || "فشل تحميل البيانات"); return; }
        setProduct(json);
        setForm(json);
        if (json.category_id) {
          fetch(`/api/inventory/categories/${json.category_id}`)
            .then((cr) => cr.json())
            .then((cj) => { if (!cj.error) setCategoryName(cj.name); })
            .catch(() => {});
        }
      })
      .catch(() => setError("فشل تحميل البيانات"))
      .finally(() => setLoading(false));
  }, [params.id]);

  useEffect(() => {
    fetch(`/api/inventory/movements?item_id=${params.id}`)
      .then(async (r) => {
        if (!r.ok) { setMovements([]); return; }
        const json = await r.json();
        setMovements(Array.isArray(json) ? json.slice(0, 5) : []);
      })
      .catch(() => setMovements([]))
      .finally(() => setMovementsLoading(false));
  }, [params.id]);

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/inventory/products/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) { toast.error(json.error); return; }
    toast.success("تم تحديث المنتج");
    setProduct(json);
    setForm(json);
    setEditing(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="text-center py-20">
        <p className="text-lg font-medium text-[#dc2626] mb-4">المنتج غير موجود</p>
        <Button variant="outline" onClick={() => router.push("/inventory/products")}>رجوع إلى المنتجات</Button>
      </div>
    );
  }

  if (!product) return null;

  const isLowStock = product.current_stock != null && product.reorder_level != null && product.current_stock <= product.reorder_level;

  if (editing) {
    return (
      <div>
        <PageHeader title="تعديل المنتج" description={product.name_ar}
          action={<Button variant="outline" onClick={() => { setEditing(false); setForm(product); }}>إلغاء</Button>} />
        <Card><CardContent className="p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1"><Label>اسم المنتج</Label><Input value={form.name_ar || ""} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} /></div>
            <div className="space-y-1"><Label>الاسم (إنجليزي)</Label><Input value={form.name_en || ""} onChange={(e) => setForm({ ...form, name_en: e.target.value })} /></div>
            <div className="space-y-1"><Label>SKU</Label><Input value={form.sku || ""} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
            <div className="space-y-1"><Label>الباركود</Label><Input value={form.barcode || ""} onChange={(e) => setForm({ ...form, barcode: e.target.value })} /></div>
            <div className="space-y-1"><Label>سعر البيع</Label><Input type="number" step="0.01" value={form.sales_price ?? ""} onChange={(e) => setForm({ ...form, sales_price: parseFloat(e.target.value) || 0 })} /></div>
            <div className="space-y-1"><Label>سعر الشراء</Label><Input type="number" step="0.01" value={form.purchase_price ?? ""} onChange={(e) => setForm({ ...form, purchase_price: parseFloat(e.target.value) || 0 })} /></div>
            <div className="space-y-1"><Label>التكلفة</Label><Input type="number" step="0.01" value={form.cost ?? ""} onChange={(e) => setForm({ ...form, cost: parseFloat(e.target.value) || 0 })} /></div>
            <div className="space-y-1"><Label>نسبة الضريبة %</Label><Input type="number" step="0.01" value={form.vat_rate ?? ""} onChange={(e) => setForm({ ...form, vat_rate: parseFloat(e.target.value) || 0 })} /></div>
            <div className="space-y-1"><Label>الوحدة</Label><Input value={form.unit || ""} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
            <div className="space-y-1"><Label>الرصيد الحالي</Label><Input type="number" value={form.current_stock ?? 0} onChange={(e) => setForm({ ...form, current_stock: parseInt(e.target.value) || 0 })} /></div>
            <div className="space-y-1"><Label>حد إعادة الطلب</Label><Input type="number" value={form.reorder_level ?? ""} onChange={(e) => setForm({ ...form, reorder_level: parseInt(e.target.value) || 0 })} /></div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={saving}>{saving ? "جار الحفظ..." : "حفظ التغييرات"}</Button>
            <Button variant="outline" onClick={() => { setEditing(false); setForm(product); }}>إلغاء</Button>
          </div>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={product.name_ar} description={product.name_en || product.sku || ""}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/inventory/products")}>طباعة</Button>
            <Button variant="outline" onClick={() => router.back()}>رجوع</Button>
            <Button onClick={() => setEditing(true)}>تعديل</Button>
          </div>
        } />

      <Card>
        <CardHeader><CardTitle>ملخص المنتج</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div><Label>الاسم</Label><p className="font-medium">{product.name_ar}</p></div>
            <div><Label>الاسم (إنجليزي)</Label><p className="font-medium">{product.name_en || "—"}</p></div>
            <div><Label>SKU</Label><p className="font-medium">{product.sku || "—"}</p></div>
            <div><Label>الباركود</Label><p className="font-medium">{product.barcode || "—"}</p></div>
            <div><Label>التصنيف</Label><p className="font-medium">{categoryName || "—"}</p></div>
            <div><Label>الوحدة</Label><p className="font-medium">{product.unit || "—"}</p></div>
            <div><Label>الحالة</Label><StatusBadge status={product.status || (product.is_active ? "active" : "inactive")} /></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>التسعير</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-4">
            <div><Label>سعر البيع</Label><p className="text-lg font-bold text-[#2563eb]">{formatCurrency(product.sales_price)}</p></div>
            <div><Label>سعر الشراء</Label><p className="text-lg font-bold">{product.purchase_price ? formatCurrency(product.purchase_price) : "—"}</p></div>
            <div><Label>التكلفة</Label><p className="text-lg font-bold">{product.cost ? formatCurrency(product.cost) : "—"}</p></div>
            <div><Label>نسبة الضريبة</Label><p className="text-lg font-bold">{product.vat_rate ?? 0}%</p></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>المخزون</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>الرصيد الحالي</Label>
              <p className={`text-lg font-bold ${isLowStock ? "text-[#dc2626]" : "text-[#2563eb]"}`}>
                {product.current_stock ?? 0}
              </p>
            </div>
            <div><Label>حد إعادة الطلب</Label><p className="text-lg font-bold">{product.reorder_level ?? 0}</p></div>
            <div><Label>تتبع المخزون</Label><p className="text-lg font-bold">{product.track_inventory ? "مفعل" : "غير مفعل"}</p></div>
          </div>
          {isLowStock && (
            <div className="mt-3 rounded-lg bg-danger/10 text-danger text-sm px-4 py-2">
              تحذير: الرصيد الحالي يساوي أو أقل من حد إعادة الطلب
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>آخر الحركات</CardTitle></CardHeader>
        <CardContent>
          {movementsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
            </div>
          ) : movements.length === 0 ? (
            <p className="text-center py-8 text-muted">لا توجد حركات مخزون لهذا المنتج بعد</p>
          ) : (
            <div className="space-y-2">
              {movements.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{movementTypeLabels[m.movement_type] || m.movement_type}</p>
                    <p className="text-xs text-muted">{formatDate(m.created_at)}</p>
                  </div>
                  <span className={`text-sm font-semibold ${m.qty > 0 ? "text-success" : "text-danger"}`}>
                    {m.qty > 0 ? "+" : ""}{m.qty}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
