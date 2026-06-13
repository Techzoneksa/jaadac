import { useState } from "react";
import { QuickCreateDialog } from "./QuickCreateDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { CustomerService } from "@/lib/services";
import { newId } from "@/lib/store";
import type { Customer } from "@/lib/store";
import { useAudit } from "@/hooks/useAudit";
import { toast } from "sonner";

export function QuickCreateCustomerDialog({
  open, onOpenChange, onCreated,
}: { open: boolean; onOpenChange: (v: boolean) => void; onCreated?: (c: Customer) => void }) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const audit = useAudit();
  const empty: Customer = {
    id: newId(), name_ar: "", name_en: "", type: "company",
    opening_balance: 0, status: "active",
  };
  const [form, setForm] = useState<Customer>(empty);
  const [addAnother, setAddAnother] = useState(false);

  const reset = () => setForm({ ...empty, id: newId() });

  const handleSave = () => {
    if (!form.name_ar.trim() && !form.name_en.trim()) {
      toast.error(ar ? "الاسم مطلوب" : "Name is required");
      return false;
    }
    CustomerService.create(form);
    audit.log("customer.created", "customer", `إضافة عميل ${form.name_ar || form.name_en}`, `Created customer ${form.name_en || form.name_ar}`, form.id);
    toast.success(ar ? "تم إنشاء العميل" : "Customer created");
    onCreated?.(form);
    reset();
    return true;
  };

  return (
    <QuickCreateDialog
      open={open}
      onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}
      titleAr="إضافة عميل سريع"
      titleEn="Quick add customer"
      descAr="حقول أساسية فقط. يمكن إكمال البيانات لاحقًا من صفحة العملاء."
      descEn="Essential fields only. Complete details later from the Customers page."
      onSave={handleSave}
      showSaveAndAddAnother
      saveAndAddAnother={addAnother}
      onSaveAndAddAnotherChange={setAddAnother}
      size="md"
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>{ar ? "الاسم (عربي)" : "Name (AR)"}</Label>
          <Input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>{ar ? "الاسم (إنجليزي)" : "Name (EN)"}</Label>
          <Input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>{ar ? "النوع" : "Type"}</Label>
          <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as Customer["type"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">{ar ? "فرد" : "Individual"}</SelectItem>
              <SelectItem value="company">{ar ? "شركة" : "Company"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{ar ? "الجوال" : "Mobile"}</Label>
          <Input value={form.mobile || ""} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>{ar ? "البريد" : "Email"}</Label>
          <Input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>{ar ? "الرقم الضريبي" : "VAT #"}</Label>
          <Input value={form.vat || ""} onChange={(e) => setForm({ ...form, vat: e.target.value })} />
        </div>
      </div>
    </QuickCreateDialog>
  );
}
