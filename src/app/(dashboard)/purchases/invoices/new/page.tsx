"use client";

import { useState, useEffect } from "react";

const $$num = (p: string) => p + String(Date.now());
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";
import type { Supplier, Item } from "@/lib/types";

interface LineItem {
  key: string; item_id: string; description: string;
  qty: number; unit_price: number; vat_rate: number;
}

export default function NewPurchaseInvoicePage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineItem[]>([
    { key: "1", item_id: "", description: "", qty: 1, unit_price: 0, vat_rate: 15 },
  ]);

  useEffect(() => {
    fetch("/api/suppliers").then((r) => r.json()).then(setSuppliers).catch(() => {});
    fetch("/api/items").then((r) => r.json()).then(setItems).catch(() => {});
  }, []);

  function addLine() {
    setLines([...lines, { key: Date.now().toString(), item_id: "", description: "", qty: 1, unit_price: 0, vat_rate: 15 }]);
  }

  function removeLine(key: string) {
    if (lines.length <= 1) return;
    setLines(lines.filter((l) => l.key !== key));
  }

  function updateLine(key: string, field: keyof LineItem, value: string | number) {
    setLines(lines.map((l) => {
      if (l.key !== key) return l;
      const updated = { ...l, [field]: value };
      if (field === "item_id") {
        const item = items.find((i) => i.id === value);
        if (item) {
          updated.description = item.name_ar;
          updated.unit_price = item.purchase_price || 0;
          updated.vat_rate = item.vat_rate;
        }
      }
      return updated;
    }));
  }

  const subtotal = lines.reduce((s, l) => s + l.qty * l.unit_price, 0);
  const vatTotal = lines.reduce((s, l) => s + l.qty * l.unit_price * l.vat_rate / 100, 0);
  const total = subtotal + vatTotal;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supplierId) { setError("الرجاء اختيار المورد"); return; }
    if (!lines.length || !lines[0].description) { setError("الرجاء إضافة صنف واحد على الأقل"); return; }
    setSaving(true);
    setError("");
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "purchase", number: $$num("PINV-"), date,
        supplier_id: supplierId, subtotal, vat_total: vatTotal, total,
        notes, status: "draft",
        lines: lines.map((l) => { const { key: $k, ...r } = l; void $k; return r; }),
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) { setError(json.error); return; }
    router.push("/purchases/invoices");
    router.refresh();
  }

  return (
    <div>
      <PageHeader title="فاتورة مشتريات جديدة" description="إنشاء فاتورة مشتريات"
        action={<Button variant="outline" onClick={() => router.back()}>رجوع</Button>} />
      <form onSubmit={handleSubmit}>
        <Card className="mb-4">
          <CardContent className="p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <Label>التاريخ *</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>المورد *</Label>
                <Select onValueChange={setSupplierId}>
                  <SelectTrigger><SelectValue placeholder="اختر مورداً" /></SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name_ar}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">الأصناف</h3>
              <Button type="button" variant="outline" size="sm" onClick={addLine}>
                <Plus className="h-4 w-4 ml-1" /> إضافة صنف
              </Button>
            </div>
            <div className="space-y-2">
              {lines.map((line) => (
                <div key={line.key} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-1">
                    <Select value={line.item_id} onValueChange={(v) => updateLine(line.key, "item_id", v)}>
                      <SelectTrigger><SelectValue placeholder="اختر صنفاً" /></SelectTrigger>
                      <SelectContent>
                        {items.map((item) => (
                          <SelectItem key={item.id} value={item.id}>{item.name_ar}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-40 space-y-1">
                    <Input placeholder="الوصف" value={line.description}
                      onChange={(e) => updateLine(line.key, "description", e.target.value)} />
                  </div>
                  <div className="w-20 space-y-1">
                    <Input type="number" min="1" value={line.qty}
                      onChange={(e) => updateLine(line.key, "qty", Number(e.target.value))} />
                  </div>
                  <div className="w-28 space-y-1">
                    <Input type="number" step="0.01" value={line.unit_price}
                      onChange={(e) => updateLine(line.key, "unit_price", Number(e.target.value))} />
                  </div>
                  <div className="w-20 space-y-1">
                    <Input type="number" step="0.01" value={line.vat_rate}
                      onChange={(e) => updateLine(line.key, "vat_rate", Number(e.target.value))} />
                  </div>
                  <div className="w-28 pt-1 text-left font-medium">
                    {(line.qty * line.unit_price).toLocaleString()} ر.س
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeLine(line.key)}
                    className="mt-1 text-[#dc2626]">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardContent className="p-6">
            <div className="space-y-1">
              <Label>ملاحظات</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardContent className="p-6">
            <div className="space-y-1 text-left">
              <p className="text-sm text-[#64748b]">المجموع الفرعي: <span className="font-medium">{subtotal.toLocaleString()} ر.س</span></p>
              <p className="text-sm text-[#64748b]">الضريبة: <span className="font-medium">{vatTotal.toLocaleString()} ر.س</span></p>
              <p className="text-lg font-bold">الإجمالي: {total.toLocaleString()} ر.س</p>
            </div>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-[#dc2626] mb-4">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>{saving ? "جار الحفظ..." : "حفظ الفاتورة"}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>إلغاء</Button>
        </div>
      </form>
    </div>
  );
}
