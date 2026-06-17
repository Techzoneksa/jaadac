"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (i: Record<string, unknown>) => void;
}

export function QuickAddItem({ open, onOpenChange, onCreated }: Props) {
  const [nameAr, setNameAr] = useState("");
  const [type, setType] = useState("service");
  const [price, setPrice] = useState("0");
  const [vatRate, setVatRate] = useState("15");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  function reset() {
    setNameAr(""); setType("service"); setPrice("0"); setVatRate("15"); setErr("");
  }

  async function handleSave() {
    if (!nameAr.trim()) { setErr("اسم المنتج/الخدمة مطلوب"); return; }
    setSaving(true); setErr("");
    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name_ar: nameAr, type, sales_price: Number(price), purchase_price: 0,
        taxable: true, vat_rate: Number(vatRate), status: "active",
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) { setErr(json.error || "فشل إنشاء المنتج"); return; }
    toast.success("تم إضافة المنتج واختياره");
    onCreated(json);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>إضافة منتج/خدمة جديد</DialogTitle>
          <DialogDescription>أدخل بيانات المنتج أو الخدمة</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1">
            <Label>الاسم *</Label>
            <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="اسم المنتج" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>النوع</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="service">خدمة</SelectItem>
                  <SelectItem value="non_stock">منتج (غير مخزون)</SelectItem>
                  <SelectItem value="stock">منتج (مخزون)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>السعر</Label>
              <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>نسبة الضريبة %</Label>
            <Input type="number" step="0.01" value={vatRate} onChange={(e) => setVatRate(e.target.value)} />
          </div>
          {err && <p className="text-sm text-[#dc2626]">{err}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>إلغاء</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "جار الحفظ..." : "حفظ"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
