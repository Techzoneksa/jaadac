"use client";
import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { useApi } from "@/lib/hooks/use-api";
import type { InventoryBranch } from "@/lib/types";
import { RecordActionsMenu, downloadCsvAction, confirmDeleteAction } from "@/components/ui/RecordActionsMenu";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function BranchesPage() {
  const { data, loading, error, refresh } = useApi<InventoryBranch>("/api/inventory/branches");
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<InventoryBranch | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", address: "" });

  function openAdd() { setEditItem(null); setForm({ name: "", code: "", address: "" }); setShowModal(true); }
  function openEdit(b: InventoryBranch) { setEditItem(b); setForm({ name: b.name, code: b.code || "", address: b.address || "" }); setShowModal(true); }

  async function handleSave() {
    if (!form.name.trim()) { toast.error("اسم الفرع مطلوب"); return; }
    setSaving(true);
    const url = editItem ? `/api/inventory/branches/${editItem.id}` : "/api/inventory/branches";
    const method = editItem ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) { toast.error(json.error); return; }
    toast.success(editItem ? "تم تحديث الفرع" : "تم إضافة الفرع");
    setShowModal(false);
    refresh();
  }

  async function handleToggleActive(b: InventoryBranch) {
    const res = await fetch(`/api/inventory/branches/${b.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !b.is_active }),
    });
    if (res.ok) { toast.success(b.is_active ? "تم تعطيل الفرع" : "تم تفعيل الفرع"); refresh(); }
    else { const j = await res.json(); toast.error(j.error); }
  }

  const columns: Column<InventoryBranch>[] = [
    { key: "name", header: "اسم الفرع" },
    { key: "code", header: "الكود" },
    { key: "address", header: "العنوان" },
    { key: "is_active", header: "الحالة", render: (r) => r.is_active ? "نشط" : "غير نشط" },
    {
      key: "actions", header: "إجراءات",
      render: (r) => {
        const { action: deleteAction, onDelete } = confirmDeleteAction(r.id, `/api/inventory/branches/${r.id}`, router);
        return (
          <RecordActionsMenu actions={[
            { type: "edit", label: "تعديل", icon: <span>✏️</span>, onClick: () => openEdit(r) },
            { type: "other", label: r.is_active ? "تعطيل" : "تفعيل", icon: <span>🔄</span>, onClick: () => handleToggleActive(r) },
            deleteAction,
          ]} onDelete={onDelete} compact />
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader title="الفروع" description="إدارة فروع ومستودعات المخزون" action={<Button onClick={openAdd}>إضافة فرع</Button>} />
      <DataTable columns={columns} data={data} keyExtractor={(r) => r.id} isLoading={loading} error={error}
        emptyTitle="لا توجد فروع" emptyDescription="أضف فرعاً جديداً للبدء" searchPlaceholder="بحث عن فرع..." />
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editItem ? "تعديل الفرع" : "إضافة فرع جديد"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1"><Label>اسم الفرع *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="مثال: المستودع الرئيسي" /></div>
            <div className="space-y-1"><Label>كود الفرع</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="مثال: WH-01" /></div>
            <div className="space-y-1"><Label>العنوان</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="عنوان الفرع" /></div>
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
