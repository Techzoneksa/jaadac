import { createFileRoute } from "@tanstack/react-router";
import { PermissionGate } from "@/components/PermissionGate";
import { ModuleFoundationPage } from "@/components/ModuleFoundationPage";
import { useI18n } from "@/lib/i18n";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";

interface CostCenter { id: string; code: string; name_ar: string; name_en: string; active: boolean }

export const Route = createFileRoute("/cost-centers")({
  head: () => ({ meta: [{ title: "Cost Centers — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perm="cost_centers.view" mode="page">
      <CostCentersPage />
    </PermissionGate>
  ),
});

const STORAGE_KEY = "jaad_cost_centers_v1";

function CostCentersPage() {
  const { lang } = useI18n();
  const [items, setItems] = useState<CostCenter[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
  });
  const [form, setForm] = useState({ code: "", name_ar: "", name_en: "" });

  const persist = (next: CostCenter[]) => {
    setItems(next);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const add = () => {
    if (!form.code.trim() || !(form.name_ar.trim() || form.name_en.trim())) return;
    persist([...items, { id: crypto.randomUUID(), code: form.code, name_ar: form.name_ar, name_en: form.name_en, active: true }]);
    setForm({ code: "", name_ar: "", name_en: "" });
  };
  const remove = (id: string) => persist(items.filter(x => x.id !== id));

  return (
    <ModuleFoundationPage
      titleAr="مراكز التكلفة"
      titleEn="Cost Centers"
      descAr="إدارة مراكز التكلفة الأساسية (الكود، الاسم، الحالة). يتم حفظها محليًا للعرض التجريبي فقط."
      descEn="Manage basic cost centers (code, name, status). Stored locally for demo purposes only."
      status="foundation"
      availableNow={[
        { ar: "إضافة وحذف مراكز التكلفة", en: "Add and remove cost centers" },
        { ar: "تخزين محلي ضمن المتصفح", en: "Local browser storage" },
      ]}
      comingLater={[
        { ar: "ربط القيود المحاسبية بمراكز التكلفة", en: "Link journal entries to cost centers" },
        { ar: "تقارير محاسبة التكاليف الكاملة", en: "Full cost accounting reports" },
        { ar: "موازنات وتحليل الانحرافات", en: "Budgets and variance analysis" },
      ]}
    >
      <div className="card-elevated p-5 space-y-4">
        <h3 className="text-sm font-semibold">
          {lang === "ar" ? "إضافة مركز تكلفة (ديمو)" : "Add cost center (demo)"}
        </h3>
        <div className="grid gap-2 md:grid-cols-4">
          <Input placeholder={lang === "ar" ? "الكود" : "Code"} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <Input placeholder={lang === "ar" ? "الاسم (ع)" : "Name (AR)"} value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
          <Input placeholder={lang === "ar" ? "Name (EN)" : "Name (EN)"} value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
          <Button onClick={add}><Plus className="size-4 me-1" />{lang === "ar" ? "إضافة" : "Add"}</Button>
        </div>
        {items.length > 0 && (
          <table className="w-full text-sm mt-2">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-start font-medium">{lang === "ar" ? "الكود" : "Code"}</th>
                <th className="px-3 py-2 text-start font-medium">{lang === "ar" ? "الاسم" : "Name"}</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-3 py-2">{c.code}</td>
                  <td className="px-3 py-2">{lang === "ar" ? c.name_ar || c.name_en : c.name_en || c.name_ar}</td>
                  <td className="px-3 py-2 text-end">
                    <Button size="sm" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="size-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </ModuleFoundationPage>
  );
}
