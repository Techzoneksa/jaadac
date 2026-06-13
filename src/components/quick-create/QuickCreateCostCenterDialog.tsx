import { useState } from "react";
import { QuickCreateDialog } from "./QuickCreateDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import { useAudit } from "@/hooks/useAudit";
import { toast } from "sonner";

interface CostCenter { id: string; code: string; name_ar: string; name_en: string; active: boolean }
const STORAGE_KEY = "jaad_cost_centers_v1";

export function QuickCreateCostCenterDialog({
  open, onOpenChange, onCreated,
}: { open: boolean; onOpenChange: (v: boolean) => void; onCreated?: (c: CostCenter) => void }) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const audit = useAudit();
  const empty = { code: "", name_ar: "", name_en: "" };
  const [form, setForm] = useState(empty);
  const [addAnother, setAddAnother] = useState(false);
  const reset = () => setForm(empty);

  const handleSave = () => {
    if (!form.code.trim()) { toast.error(ar ? "الكود مطلوب" : "Code required"); return false; }
    if (!form.name_ar.trim() && !form.name_en.trim()) { toast.error(ar ? "الاسم مطلوب" : "Name required"); return false; }
    const all: CostCenter[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const created: CostCenter = { id: crypto.randomUUID(), code: form.code, name_ar: form.name_ar, name_en: form.name_en, active: true };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...all, created]));
    audit.log("cost_center.created", "cost_center", `إضافة مركز تكلفة ${form.code}`, `Created cost center ${form.code}`, created.id);
    toast.success(ar ? "تم إنشاء مركز التكلفة" : "Cost center created");
    onCreated?.(created);
    reset();
    // Force route component refresh by reloading state on next render
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
    return true;
  };

  return (
    <QuickCreateDialog
      open={open}
      onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}
      titleAr="إضافة مركز تكلفة"
      titleEn="Add cost center"
      onSave={handleSave}
      showSaveAndAddAnother
      saveAndAddAnother={addAnother}
      onSaveAndAddAnotherChange={setAddAnother}
      size="sm"
    >
      <div className="grid gap-3">
        <div className="space-y-1.5">
          <Label>{ar ? "الكود" : "Code"}</Label>
          <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>{ar ? "الاسم (عربي)" : "Name (AR)"}</Label>
          <Input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>{ar ? "الاسم (إنجليزي)" : "Name (EN)"}</Label>
          <Input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
        </div>
      </div>
    </QuickCreateDialog>
  );
}
