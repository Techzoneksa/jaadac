"use client";
import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency } from "@/lib/format";
import { Search, Package } from "lucide-react";
import type { Item } from "@/lib/types";
import Link from "next/link";

export default function ItemCardPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Item[]>([]);
  const [selected, setSelected] = useState<Item | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [focused, setFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focused && !query && !selected) {
      fetch("/api/inventory/products?limit=10")
        .then(async (r) => { if (r.ok) { const json = await r.json(); setResults(Array.isArray(json) ? json.slice(0, 10) : []); } })
        .catch(() => {});
    }
  }, [focused, query, selected]);

  useEffect(() => {
    if (query.length >= 3) {
      const timer = setTimeout(() => {
        setLoading(true);
        fetch(`/api/inventory/products?search=${encodeURIComponent(query)}`)
          .then(async (r) => { if (r.ok) { const json = await r.json(); setResults(Array.isArray(json) ? json : []); } })
          .catch(() => setResults([]))
          .finally(() => { setLoading(false); setSearched(true); });
      }, 300);
      return () => clearTimeout(timer);
    } else if (query.length === 0) {
      setResults([]);
      setSearched(false);
    }
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setFocused(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function selectProduct(p: Item) {
    setSelected(p);
    setResults([]);
    setQuery("");
    setFocused(false);
  }

  const isLowStock = selected?.current_stock != null && selected?.reorder_level != null && selected.current_stock <= selected.reorder_level;

  if (selected) {
    return (
      <div>
        <PageHeader title={selected.name_ar} description={selected.name_en || selected.sku || ""}
          action={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSelected(null)}>بحث جديد</Button>
              <Button variant="outline" asChild><Link href="/inventory/products">عرض كل المنتجات</Link></Button>
              <Button asChild><Link href="/inventory/products">إضافة منتج</Link></Button>
            </div>
          } />
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardContent className="p-6 space-y-3">
              <h3 className="font-semibold text-sm text-muted">معلومات المنتج</h3>
              <div><Label>الاسم</Label><p className="font-medium">{selected.name_ar}</p></div>
              {selected.name_en && <div><Label>الاسم (إنجليزي)</Label><p className="font-medium">{selected.name_en}</p></div>}
              <div><Label>SKU</Label><p className="font-medium">{selected.sku || "—"}</p></div>
              <div><Label>الوحدة</Label><p className="font-medium">{selected.unit || "—"}</p></div>
              <div><Label>الحالة</Label><StatusBadge status={selected.status || (selected.is_active ? "active" : "inactive")} /></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-3">
              <h3 className="font-semibold text-sm text-muted">التسعير</h3>
              <div><Label>سعر البيع</Label><p className="text-lg font-bold text-[#2563eb]">{formatCurrency(selected.sales_price)}</p></div>
              <div><Label>التكلفة</Label><p className="text-lg font-bold">{selected.cost ? formatCurrency(selected.cost) : "—"}</p></div>
              <div><Label>الضريبة</Label><p className="text-lg font-bold">{selected.vat_rate ?? 0}%</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-3">
              <h3 className="font-semibold text-sm text-muted">المخزون</h3>
              <div>
                <Label>الرصيد الحالي</Label>
                <p className={`text-lg font-bold ${isLowStock ? "text-[#dc2626]" : "text-[#2563eb]"}`}>{selected.current_stock ?? 0}</p>
              </div>
              <div><Label>حد إعادة الطلب</Label><p className="text-lg font-bold">{selected.reorder_level ?? 0}</p></div>
              <div><Label>تتبع المخزون</Label><p className="text-lg font-bold">{selected.track_inventory ? "مفعل" : "غير مفعل"}</p></div>
              {isLowStock && (
                <div className="rounded-lg bg-danger/10 text-danger text-sm px-3 py-2">رصيد منخفض</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="بطاقة الصنف" description="ابحث عن منتج لعرض بياناته"
        action={
          <div className="flex gap-2">
            <Button variant="outline" asChild><Link href="/inventory/products">عرض كل المنتجات</Link></Button>
            <Button asChild><Link href="/inventory/products">إضافة منتج</Link></Button>
          </div>
        } />

      <div ref={searchRef} className="relative mb-6">
        <Card><CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-light" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              placeholder="ابحث عن منتج (3 أحرف أو أكثر)..."
              className="pr-9" />
          </div>
        </CardContent></Card>

        {focused && results.length > 0 && (
          <Card className="absolute z-10 w-full mt-1 shadow-lg max-h-80 overflow-y-auto">
            <CardContent className="p-2">
              {results.map((p) => (
                <button
                  key={p.id}
                  onClick={() => selectProduct(p)}
                  className="w-full flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-surface text-right transition-colors">
                  <div>
                    <p className="text-sm font-medium">{p.name_ar}</p>
                    <p className="text-xs text-muted">{p.sku || "—"}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold">{p.current_stock ?? 0}</p>
                    <p className="text-xs text-muted">{formatCurrency(p.sales_price)}</p>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {!query && !selected && (
        <div className="text-center py-20">
          <div className="h-16 w-16 rounded-2xl bg-primary-soft text-primary flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8" />
          </div>
          <p className="text-lg font-medium text-foreground">ابحث عن منتج لعرض بطاقة الصنف</p>
          <p className="text-sm text-muted mt-1">ابدأ بالكتابة في حقل البحث أعلاه</p>
        </div>
      )}

      {searched && results.length === 0 && query.length >= 3 && (
        <p className="text-center py-8 text-muted">لا توجد نتائج مطابقة للبحث</p>
      )}
    </div>
  );
}
