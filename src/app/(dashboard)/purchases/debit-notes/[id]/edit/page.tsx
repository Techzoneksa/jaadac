"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Save, AlertCircle, ArrowRight } from "lucide-react";

interface FormData { date: string; status: string; notes: string; supplier_name: string; }

export default function EditDebitNotePage() {
  const router = useRouter(); const params = useParams();
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  const [error, setError] = useState(""); const [doc, setDoc] = useState<Record<string, unknown> | null>(null);
  const { register, handleSubmit, reset } = useForm<FormData>({ defaultValues: { date: "", status: "draft", notes: "", supplier_name: "" } });

  useEffect(() => {
    fetch(`/api/debit-notes?id=${params.id}`).then((r) => r.json()).then((data) => {
      if (data.error) { setError(data.error); setLoading(false); return; }
      setDoc(data); reset({ date: data.date || "", status: data.status || "draft", notes: data.notes || "", supplier_name: data.supplier_name || "" }); setLoading(false);
    }).catch(() => { setError("فشل تحميل البيانات"); setLoading(false); });
  }, [params.id, reset]);

  async function onSubmit(data: FormData) {
    setSaving(true); setError("");
    try {
      const res = await fetch(`/api/debit-notes?id=${params.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "فشل الحفظ"); return; }
      router.push(`/purchases/debit-notes/${params.id}`);
    } catch { setError("تعذر الاتصال بالخادم"); } finally { setSaving(false); }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--text-muted)" }} /></div>;
  if (error && !doc) return <div className="flex flex-col items-center justify-center py-20 text-center"><AlertCircle className="h-8 w-8 mb-3" style={{ color: "var(--danger)" }} /><p style={{ color: "var(--danger)" }}>{error}</p><Button variant="outline" className="mt-4" onClick={() => router.back()}>رجوع</Button></div>;

  const lines = (doc?.lines || doc?.debit_note_lines || []) as Array<Record<string, unknown>>;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={doc?.number ? `تعديل إشعار مدين #${doc.number}` : "تعديل إشعار مدين"} action={<Button variant="outline" onClick={() => router.back()}><ArrowRight className="h-4 w-4 ml-1" /> رجوع</Button>} />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="rounded-2xl border p-5" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--fg)" }}>معلومات الإشعار</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5"><Label className="text-xs font-medium">المورد</Label><Input {...register("supplier_name")} className="h-10 rounded-xl" /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium">التاريخ</Label><Input type="date" {...register("date")} className="h-10 rounded-xl" /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium">الحالة</Label>
              <select {...register("status")} className="flex h-10 w-full rounded-xl border px-3 text-sm" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)" }}>
                <option value="draft">مسودة</option><option value="posted">مرحّل</option><option value="cancelled">ملغي</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5 mt-4"><Label className="text-xs font-medium">ملاحظات</Label><Textarea {...register("notes")} className="rounded-xl" rows={3} /></div>
        </div>
        <div className="rounded-2xl border p-5" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--fg)" }}>البنود</h3>
          {lines.length === 0 ? <p className="text-sm" style={{ color: "var(--text-muted)" }}>لا توجد بنود</p> : (
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr style={{ borderBottom: "1px solid var(--border)" }}><th className="py-2 text-right font-medium" style={{ color: "var(--text-muted)" }}>البيان</th><th className="py-2 text-center font-medium" style={{ color: "var(--text-muted)" }}>الكمية</th><th className="py-2 text-left font-medium" style={{ color: "var(--text-muted)" }}>السعر</th><th className="py-2 text-left font-medium" style={{ color: "var(--text-muted)" }}>الإجمالي</th></tr></thead>
              <tbody>{lines.map((l, i) => (<tr key={i} style={{ borderBottom: "1px solid var(--border)" }}><td className="py-2">{String(l.description || "—")}</td><td className="py-2 text-center">{String(l.qty ?? "—")}</td><td className="py-2 text-left">{Number(l.unit_price || 0).toLocaleString()}</td><td className="py-2 text-left">{Number(l.total || 0).toLocaleString()}</td></tr>))}</tbody>
            </table></div>
          )}
          <p className="text-xs mt-3" style={{ color: "var(--text-muted-light)" }}>تعديل البنود سيتم في المرحلة التالية</p>
        </div>
        <div className="rounded-2xl border p-5 text-left space-y-1" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
          <p className="text-lg font-bold" style={{ color: "var(--fg)" }}>الإجمالي: {Number(doc?.total || 0).toLocaleString()} ر.س</p>
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
