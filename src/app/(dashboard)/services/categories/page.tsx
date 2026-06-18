"use client";
import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { useApi } from "@/lib/hooks/use-api";
import type { ServiceCategory } from "@/lib/types";
import { RecordActionsMenu, downloadCsvAction, confirmDeleteAction } from "@/components/ui/RecordActionsMenu";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ServiceCategoriesPage() {
  const { data, loading, error, refresh } = useApi<ServiceCategory>("/api/services/categories");
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<ServiceCategory | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });

  function openAdd() { setEditItem(null); setForm({ name: "", description: "" }); setShowModal(true); }
  function openEdit(c: ServiceCategory) { setEditItem(c); setForm({ name: c.name, description: c.description || "" }); setShowModal(true); }

  async function handleSave() {
    if (!form.name.trim()) { toast.error("اسم الفئة مطلوب"); return; }
    setSaving(true);
    const url = editItem ? `/api/services/categories/${editItem.id}` : "/api/services/categories";
    const method = editItem ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) { toast.error(json.error); return; }
    toast.success(editItem ? "تم تحديث الفئة" : "تم إضافة الفئة");
    setShowModal(false);
    refresh();
  }

  const columns: Column<ServiceCategory>[] = [
    { key: "name", header: "اسم الفئة" },
    { key: "description", header: "الوصف" },
    { key: "is_active", header: "الحالة", render: (r) => r.is_active ? "نشط" : "غير نشط" },
    {
      key: "actions", header: "إجراءات",
      render: (r) => {
        const { action: deleteAction, onDelete } = confirmDeleteAction(r.id, `/api/services/categories/${r.id}`, router);
        return (
          <RecordActionsMenu actions={[
            { type: "edit", label: "تعديل", icon: <span>✏️</span>, onClick: () => openEdit(r) },
            deleteAction,
          ]} onDelete={onDelete} compact />
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader title="فئات الخدمات" description="تصنيف الخدمات غير المخزنية" action={<Button onClick={openAdd}>إضافة فئة</Button>} />
      <DataTable columns={columns} data={data} keyExtractor={(r) => r.id} isLoading={loading} error={error}
        emptyTitle="لا توجد فئات" emptyDescription="أضف فئة جديدة للبدء" searchPlaceholder="بحث عن فئة..." />
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editItem ? "تعديل الفئة" : "إضافة فئة جديدة"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1"><Label>اسم الفئة *</Label><Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="مثال: استشارات" /></div>
            <div className="space-y-1"><Label>الوصف</Label><Input value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} placeholder="وصف الفئة" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)} disabled={saving}>إلغاء</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "جار الحفظ..." : "حفظ"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
