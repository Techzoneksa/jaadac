"use client";
import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { useApi } from "@/lib/hooks/use-api";
import type { InventoryCategory } from "@/lib/types";
import { RecordActionsMenu, downloadCsvAction, confirmDeleteAction } from "@/components/ui/RecordActionsMenu";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function InventoryCategoriesPage() {
  const { data, loading, error, refresh } = useApi<InventoryCategory>("/api/inventory/categories");
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<InventoryCategory | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });

  function openAdd() { setEditItem(null); setForm({ name: "", description: "" }); setShowModal(true); }
  function openEdit(c: InventoryCategory) { setEditItem(c); setForm({ name: c.name, description: c.description || "" }); setShowModal(true); }

  async function handleSave() {
    if (!form.name.trim()) { toast.error("اسم الفئة مطلوب"); return; }
    setSaving(true);
    const url = editItem ? `/api/inventory/categories/${editItem.id}` : "/api/inventory/categories";
    const method = editItem ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) { toast.error(json.error); return; }
    toast.success(editItem ? "تم تحديث الفئة" : "تم إضافة الفئة");
    setShowModal(false);
    refresh();
  }

  const columns: Column<InventoryCategory>[] = [
    { key: "name", header: "اسم الفئة" },
    { key: "description", header: "الوصف" },
    { key: "is_active", header: "الحالة", render: (r) => r.is_active ? "نشط" : "غير نشط" },
    {
      key: "actions", header: "إجراءات",
      render: (r) => {
        const { action: deleteAction, onDelete } = confirmDeleteAction(r.id, `/api/inventory/categories/${r.id}`, router);
        return (
          <RecordActionsMenu actions={[
            { type: "edit", label: "تعديل", icon: <span>✏️</span>, onClick: () => openEdit(r) },
            deleteAction,
          ]} onDelete={onDelete} compact />
        );
      },
    },
  ];

  const isDbInitError = error && (error.includes("تهيئة") || error.includes("migrations") || error.includes("schema cache") || error.includes("does not exist"));

  return (
    <div>
      <PageHeader title="فئات المنتجات" description="تصنيف المنتجات المخزنية" action={<Button onClick={openAdd}>إضافة فئة</Button>} />
      {isDbInitError ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <div className="h-12 w-12 rounded-xl bg-warning/10 text-warning flex items-center justify-center mx-auto mb-3">
            <span className="text-xl font-bold">!</span>
          </div>
          <p className="text-sm font-medium text-foreground mb-2">لم يتم تهيئة قاعدة بيانات المخزون بعد</p>
          <p className="text-xs text-muted mb-6">الرجاء تطبيق التحديثات أولاً.</p>
          <Button onClick={() => router.push("/api/health/inventory")}>تحديث قاعدة البيانات</Button>
        </div>
      ) : (
        <DataTable columns={columns} data={data} keyExtractor={(r) => r.id} isLoading={loading} error={error}
          emptyTitle="لا توجد فئات" emptyDescription="أضف فئة جديدة للبدء" searchPlaceholder="بحث عن فئة..." />
      )}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editItem ? "تعديل الفئة" : "إضافة فئة جديدة"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1"><Label>اسم الفئة *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="مثال: مواد خام" /></div>
            <div className="space-y-1"><Label>الوصف</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="وصف الفئة" /></div>
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
