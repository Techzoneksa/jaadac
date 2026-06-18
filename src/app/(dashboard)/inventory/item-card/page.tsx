"use client";
import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";

export default function ItemCardPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true); setErr(""); setResult(null);
    const res = await fetch(`/api/inventory/products?search=${encodeURIComponent(query)}`);
    const data = await res.json();
    setLoading(false);
    if (!res.ok || data.length === 0) { setErr("لم يتم العثور على المنتج"); return; }
    setResult(data[0]);
  }

  return (
    <div>
      <PageHeader title="بطاقة الصنف" description="استعراض بيانات المنتج والرصيد والحركة" />
      <Card className="mb-6"><CardContent className="p-4 flex gap-2 items-end">
        <div className="flex-1 space-y-1"><Label>بحث عن منتج</Label>
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="اسم المنتج أو SKU" onKeyDown={(e) => e.key === "Enter" && handleSearch()} /></div>
        <Button onClick={handleSearch} disabled={loading}><Search className="h-4 w-4 ml-1" /> بحث</Button>
      </CardContent></Card>
      {err && <p className="text-[#dc2626] text-center py-8">{err}</p>}
      {result && (
        <Card><CardContent className="p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div><Label>الاسم</Label><p className="text-lg font-bold">{result.name_ar}</p></div>
            <div><Label>SKU</Label><p>{result.sku || "—"}</p></div>
            <div><Label>الرصيد الحالي</Label><p className="text-lg font-bold text-[#2563eb]">{result.current_stock ?? 0}</p></div>
            <div><Label>سعر البيع</Label><p>{(result.sales_price ?? 0).toLocaleString()} ر.س</p></div>
            <div><Label>التكلفة</Label><p>{(result.cost ?? 0).toLocaleString()} ر.س</p></div>
            <div><Label>الوحدة</Label><p>{result.unit || "—"}</p></div>
            <div><Label>الحد الأدنى</Label><p>{result.reorder_level ?? 0}</p></div>
            <div><Label>الحالة</Label><p>{result.status === "active" ? "نشط" : "غير نشط"}</p></div>
          </div>
        </CardContent></Card>
      )}
    </div>
  );
}
