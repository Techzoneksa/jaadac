"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (s: Record<string, unknown>) => void;
}

export function QuickAddSupplier({ open, onOpenChange, onCreated }: Props) {
  const [nameAr, setNameAr] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [vat, setVat] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  function reset() {
    setNameAr(""); setMobile(""); setEmail(""); setVat(""); setAddress(""); setErr("");
  }

  async function handleSave() {
    if (!nameAr.trim()) { setErr("اسم المورد مطلوب"); return; }
    setSaving(true); setErr("");
    const res = await fetch("/api/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name_ar: nameAr, mobile, email, vat, address, type: "individual", status: "active" }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) { setErr(json.error || "فشل إنشاء المورد"); return; }
    toast.success("تم إضافة المورد واختياره");
    onCreated(json);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>إضافة مورد جديد</DialogTitle>
          <DialogDescription>أدخل بيانات المورد الأساسية</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1">
            <Label>اسم المورد *</Label>
            <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="الاسم" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>الجوال</Label>
              <Input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="05xxxxxxxx" />
            </div>
            <div className="space-y-1">
              <Label>البريد الإلكتروني</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>الرقم الضريبي</Label>
              <Input value={vat} onChange={(e) => setVat(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>العنوان</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
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
