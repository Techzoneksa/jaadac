import { useState } from "react";
import { QuickCreateDialog } from "./QuickCreateDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { useAudit } from "@/hooks/useAudit";
import { ProjectService, type Project } from "@/lib/quick-create/local-entities";
import { toast } from "sonner";

export function QuickCreateProjectDialog({
  open, onOpenChange, onCreated,
}: { open: boolean; onOpenChange: (v: boolean) => void; onCreated?: (p: Project) => void }) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const audit = useAudit();
  const empty: Omit<Project, "id" | "created_at"> = { code: "", name_ar: "", name_en: "", manager: "", start_date: "", end_date: "", budget: 0, status: "active", notes: "" };
  const [form, setForm] = useState(empty);
  const [addAnother, setAddAnother] = useState(false);
  const reset = () => setForm(empty);

  const handleSave = () => {
    if (!form.code.trim()) { toast.error(ar ? "كود المشروع مطلوب" : "Project code required"); return false; }
    if (!form.name_ar.trim() && !form.name_en.trim()) { toast.error(ar ? "الاسم مطلوب" : "Name required"); return false; }
    const created = ProjectService.create(form);
    audit.log("project.created", "project", `إضافة مشروع ${form.code}`, `Created project ${form.code}`, created.id);
    toast.success(ar ? "تم إنشاء المشروع" : "Project created");
    onCreated?.(created);
    reset();
    return true;
  };

  return (
    <QuickCreateDialog
      open={open}
      onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}
      titleAr="إضافة مشروع"
      titleEn="Add project"
      onSave={handleSave}
      showSaveAndAddAnother
      saveAndAddAnother={addAnother}
      onSaveAndAddAnotherChange={setAddAnother}
      size="md"
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>{ar ? "الكود" : "Code"}</Label>
          <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>{ar ? "الحالة" : "Status"}</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Project["status"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">{ar ? "نشط" : "Active"}</SelectItem>
              <SelectItem value="on_hold">{ar ? "متوقف مؤقتًا" : "On hold"}</SelectItem>
              <SelectItem value="completed">{ar ? "مكتمل" : "Completed"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{ar ? "الاسم (عربي)" : "Name (AR)"}</Label>
          <Input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>{ar ? "الاسم (إنجليزي)" : "Name (EN)"}</Label>
          <Input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>{ar ? "مدير المشروع" : "Project manager"}</Label>
          <Input value={form.manager} onChange={(e) => setForm({ ...form, manager: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>{ar ? "الميزانية" : "Budget"}</Label>
          <Input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: +e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>{ar ? "تاريخ البداية" : "Start date"}</Label>
          <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>{ar ? "تاريخ النهاية" : "End date"}</Label>
          <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
        </div>
      </div>
    </QuickCreateDialog>
  );
}
