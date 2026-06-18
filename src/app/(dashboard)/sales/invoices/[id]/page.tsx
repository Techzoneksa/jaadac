"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { toast } from "sonner";
import { getStatusLabel, getPaymentMethodLabel, formatCurrency } from "@/lib/format";

type InvoiceData = Record<string, unknown> & {
  number?: string; date?: string; status?: string; subtotal?: number;
  vat_total?: number; total?: number; paid_amount?: number; notes?: string;
  customer_id?: string;
  customers?: { name_ar?: string; vat?: string; mobile?: string; email?: string } | null;
  invoice_lines?: Array<{ description?: string; qty?: number; unit_price?: number; total?: number }>;
  payments?: Array<{ id: string; amount: number; payment_method: string; date: string; number: string }>;
};

export default function InvoiceViewPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [payDate, setPayDate] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [paySaving, setPaySaving] = useState(false);

  function loadInvoice() {
    setLoading(true);
    fetch(`/api/invoices/${params.id}`)
      .then((r) => r.json())
      .then((data) => { setInvoice(data); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => { loadInvoice(); }, [params.id]);

  const total = Number(invoice?.total || 0);
  const paid = Number(invoice?.paid_amount || 0);
  const remaining = Math.max(0, total - paid);
  const isFullyPaid = paid >= total && total > 0;
  const isDraft = invoice?.status === "draft";

  async function handleFullPayment() {
    setPayAmount(String(remaining));
    setPayDate(new Date().toISOString().slice(0, 10));
    setShowPayment(true);
  }

  async function handlePartialPayment() {
    setPayAmount("");
    setPayDate(new Date().toISOString().slice(0, 10));
    setShowPayment(true);
  }

  async function submitPayment() {
    const amount = Number(payAmount);
    if (!amount || amount <= 0) { toast.error("المبلغ غير صالح"); return; }
    if (amount > remaining) { toast.error(`المبلغ يتجاوز المتبقي (${formatCurrency(remaining)})`); return; }
    setPaySaving(true);
    const res = await fetch(`/api/invoices/${params.id}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, payment_method: payMethod, date: payDate, notes: payNotes }),
    });
    const json = await res.json();
    setPaySaving(false);
    if (!res.ok) { toast.error(json.error); return; }
    toast.success(isFullyPaid || json.is_fully_paid ? "تم دفع الفاتورة بالكامل" : "تم تسجيل الدفعة");
    setShowPayment(false);
    loadInvoice();
  }

  if (loading) return <p className="text-center py-8" style={{ color: "var(--text-muted)" }}>جار التحميل...</p>;
  if (!invoice) return <p className="text-center py-8" style={{ color: "var(--danger)" }}>لم يتم العثور على الفاتورة</p>;

  const payments = (invoice?.payments || []) as Array<{ id: string; amount: number; payment_method: string; date: string; number: string }>;

  return (
    <div className="space-y-6">
      <PageHeader title={`فاتورة #${invoice.number}`} description={`تاريخ: ${invoice.date}`}
        action={
          <div className="flex gap-2 flex-wrap">
            {!isDraft && !isFullyPaid && remaining > 0 && <Button onClick={handleFullPayment}>دفع كامل</Button>}
            {!isDraft && !isFullyPaid && remaining > 0 && <Button variant="outline" onClick={handlePartialPayment}>دفع جزئي</Button>}
            <Button variant="outline" onClick={() => router.push(`/sales/invoices/${params.id}/print`)}>طباعة</Button>
            <Button variant="outline" onClick={() => router.push(`/sales/invoices/${params.id}/edit`)}>تعديل</Button>
            <Button variant="outline" onClick={() => router.back()}>رجوع</Button>
          </div>
        } />
      <div className="grid gap-6 sm:grid-cols-2">
        <Card><CardContent className="p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>رقم الفاتورة</Label><p className="font-medium">{invoice.number}</p></div>
            <div><Label>التاريخ</Label><p className="font-medium">{invoice.date}</p></div>
            <div><Label>الحالة</Label><p className="font-medium"><StatusBadge status={invoice.status || ""} /></p></div>
            <div><Label>العميل</Label><p className="font-medium">{invoice.customers?.name_ar || "—"}</p></div>
            {invoice.customers?.vat && <div><Label>الرقم الضريبي</Label><p className="font-medium">{invoice.customers.vat}</p></div>}
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-6">
          <h3 className="font-semibold mb-3">حالة الدفع</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span>إجمالي الفاتورة</span><span className="font-medium">{formatCurrency(total)}</span></div>
            <div className="flex justify-between text-sm"><span>المدفوع</span><span className="font-medium" style={{ color: "#16a34a" }}>{formatCurrency(paid)}</span></div>
            <div className="flex justify-between text-sm font-bold"><span>المتبقي</span><span style={{ color: remaining > 0 ? "#dc2626" : "#16a34a" }}>{formatCurrency(remaining)}</span></div>
            {isFullyPaid && <p className="text-sm font-bold" style={{ color: "#16a34a" }}>✓ مدفوعة بالكامل</p>}
          </div>
        </CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle className="text-base">البنود</CardTitle></CardHeader><CardContent className="p-0">
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="border-b" style={{ backgroundColor: "var(--surface)" }}>
            <th className="px-4 py-2.5 text-right font-medium" style={{ color: "var(--text-muted)" }}>البيان</th>
            <th className="px-4 py-2.5 text-center font-medium" style={{ color: "var(--text-muted)" }}>الكمية</th>
            <th className="px-4 py-2.5 text-left font-medium" style={{ color: "var(--text-muted)" }}>سعر الوحدة</th>
            <th className="px-4 py-2.5 text-left font-medium" style={{ color: "var(--text-muted)" }}>الإجمالي</th>
          </tr></thead>
          <tbody>{(invoice.invoice_lines || []).map((l, i) => (
            <tr key={i} className="border-b"><td className="px-4 py-2.5">{l.description}</td><td className="px-4 py-2.5 text-center">{l.qty}</td><td className="px-4 py-2.5 text-left">{formatCurrency(l.unit_price || 0)}</td><td className="px-4 py-2.5 text-left">{formatCurrency(l.total || 0)}</td></tr>
          ))}</tbody>
        </table></div>
      </CardContent></Card>
      <div className="text-left space-y-1 px-1">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>المجموع الفرعي: <span className="font-medium" style={{ color: "var(--fg)" }}>{formatCurrency(invoice.subtotal || 0)}</span></p>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>الضريبة: <span className="font-medium" style={{ color: "var(--fg)" }}>{formatCurrency(invoice.vat_total || 0)}</span></p>
        <p className="text-lg font-bold" style={{ color: "var(--fg)" }}>الإجمالي: {formatCurrency(total)}</p>
      </div>
      {invoice.notes && <Card><CardContent className="p-4"><p className="text-sm" style={{ color: "var(--text-muted)" }}>{invoice.notes}</p></CardContent></Card>}
      <Card><CardHeader><CardTitle className="text-base">المدفوعات</CardTitle></CardHeader><CardContent>
        {payments.length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: "var(--text-muted)" }}>لا توجد دفعات مسجلة لهذه الفاتورة</p>
        ) : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b" style={{ backgroundColor: "var(--surface)" }}>
              <th className="px-4 py-2.5 text-right font-medium" style={{ color: "var(--text-muted)" }}>رقم السند</th>
              <th className="px-4 py-2.5 text-right font-medium" style={{ color: "var(--text-muted)" }}>التاريخ</th>
              <th className="px-4 py-2.5 text-left font-medium" style={{ color: "var(--text-muted)" }}>المبلغ</th>
              <th className="px-4 py-2.5 text-right font-medium" style={{ color: "var(--text-muted)" }}>طريقة الدفع</th>
            </tr></thead>
            <tbody>{payments.map((p, i) => (
              <tr key={i} className="border-b">
                <td className="px-4 py-2.5">{p.number}</td>
                <td className="px-4 py-2.5">{p.date}</td>
                <td className="px-4 py-2.5 text-left font-medium" style={{ color: "#16a34a" }}>{formatCurrency(p.amount)}</td>
                <td className="px-4 py-2.5">{getPaymentMethodLabel(p.payment_method)}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </CardContent></Card>
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>تسجيل دفعة</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1"><Label>المبلغ *</Label><Input type="number" step="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder={String(remaining)} /></div>
            <div className="space-y-1"><Label>طريقة الدفع</Label>
              <Select value={payMethod} onValueChange={setPayMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">نقدًا</SelectItem>
                  <SelectItem value="bank">تحويل بنكي</SelectItem>
                  <SelectItem value="transfer">تحويل</SelectItem>
                  <SelectItem value="card">بطاقة</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>التاريخ</Label><Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} /></div>
            <div className="space-y-1"><Label>ملاحظات</Label><Input value={payNotes} onChange={(e) => setPayNotes(e.target.value)} /></div>
            {remaining > 0 && <p className="text-sm" style={{ color: "var(--text-muted)" }}>المتبقي: {formatCurrency(remaining)}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayment(false)} disabled={paySaving}>إلغاء</Button>
            <Button onClick={submitPayment} disabled={paySaving}>{paySaving ? "جار الحفظ..." : "تسجيل الدفعة"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
