"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Save, AlertCircle, ArrowRight } from "lucide-react";
import type { Customer } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

export default function EditSalesInvoicePage() {
  const router = useRouter(); const params = useParams();
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [invoice, setInvoice] = useState<Record<string, unknown> | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("draft");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/invoices?id=${params.id}`).then((r) => r.json()),
      fetch("/api/customers").then((r) => r.json()),
    ]).then(([invData, custData]) => {
      if (invData.error) { setError(invData.error); setLoading(false); return; }
      setInvoice(invData);
      setCustomerId(invData.customer_id || "");
      setDate(invData.date || "");
      setStatus(invData.status || "draft");
      setNotes(invData.notes || "");
      if (Array.isArray(custData)) setCustomers(custData);
      setLoading(false);
    }).catch(() => { setError("فشل تحميل البيانات"); setLoading(false); });
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const res = await fetch(`/api/invoices/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id: customerId || null, date, status, notes }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "فشل الحفظ"); return; }
      router.push(`/sales/invoices/${params.id}`);
    } catch { setError("تعذر الاتصال بالخادم"); } finally { setSaving(false); }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--text-muted)" }} /></div>;
  if (error && !invoice) return <div className="flex flex-col items-center justify-center py-20 text-center"><AlertCircle className="h-8 w-8 mb-3" style={{ color: "var(--danger)" }} /><p style={{ color: "var(--danger)" }}>{error}</p><Button variant="outline" className="mt-4" onClick={() => router.back()}>رجوع</Button></div>;

  const lines = (invoice?.invoice_lines || []) as Array<Record<string, unknown>>;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={invoice?.number ? `تعديل فاتورة #${invoice.number}` : "تعديل فاتورة"} action={<Button variant="outline" onClick={() => router.back()}><ArrowRight className="h-4 w-4 ml-1" /> رجوع</Button>} />
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-2xl border p-5" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--fg)" }}>معلومات الفاتورة</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">العميل</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger><SelectValue placeholder="اختر عميلاً" /></SelectTrigger>
                <SelectContent>
                  {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name_ar}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-medium">التاريخ</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-10 rounded-xl" /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium">الحالة</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">مسودة</SelectItem>
                  <SelectItem value="confirmed">مؤكدة</SelectItem>
                  <SelectItem value="cancelled">ملغية</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5 mt-4"><Label className="text-xs font-medium">ملاحظات</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="rounded-xl" rows={3} /></div>
        </div>
        <div className="rounded-2xl border p-5" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--fg)" }}>البنود</h3>
          {lines.length === 0 ? <p className="text-sm" style={{ color: "var(--text-muted)" }}>لا توجد بنود</p> : (
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr style={{ borderBottom: "1px solid var(--border)" }}><th className="py-2 text-right font-medium" style={{ color: "var(--text-muted)" }}>البيان</th><th className="py-2 text-center font-medium" style={{ color: "var(--text-muted)" }}>الكمية</th><th className="py-2 text-left font-medium" style={{ color: "var(--text-muted)" }}>السعر</th><th className="py-2 text-left font-medium" style={{ color: "var(--text-muted)" }}>الإجمالي</th></tr></thead>
              <tbody>{lines.map((l, i) => (<tr key={i} style={{ borderBottom: "1px solid var(--border)" }}><td className="py-2">{String(l.description || "—")}</td><td className="py-2 text-center">{String(l.qty ?? "—")}</td><td className="py-2 text-left">{formatCurrency(l.unit_price as number)}</td><td className="py-2 text-left">{formatCurrency(l.total as number)}</td></tr>))}</tbody>
            </table></div>
          )}
          <p className="text-xs mt-3" style={{ color: "var(--text-muted-light)" }}>تعديل البنود سيتم في المرحلة التالية</p>
        </div>
        <div className="rounded-2xl border p-5 text-left space-y-1" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>المجموع الفرعي: <span className="font-medium" style={{ color: "var(--fg)" }}>{formatCurrency(invoice?.subtotal as number)}</span></p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>الضريبة: <span className="font-medium" style={{ color: "var(--fg)" }}>{formatCurrency(invoice?.vat_total as number)}</span></p>
          <p className="text-lg font-bold" style={{ color: "var(--fg)" }}>الإجمالي: {formatCurrency(invoice?.total as number)}</p>
        </div>
        {error && <div className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: "var(--danger-soft)", color: "var(--danger)" }}><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>إلغاء</Button>
          <Button type="submit" disabled={saving} className="h-11 px-6 rounded-2xl">{saving ? <><Loader2 className="h-4 w-4 animate-spin ml-2" />جار الحفظ...</> : <><Save className="h-4 w-4 ml-2" />حفظ التعديلات</>}</Button>
        </div>
      </form>
    </div>
  );
}
