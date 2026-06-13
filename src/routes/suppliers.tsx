import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/lib/i18n";
import { useStore, newId, type Supplier } from "@/lib/store";
import { SupplierService } from "@/lib/services";
import { useAuth } from "@/lib/auth";
import { PermissionGate } from "@/components/PermissionGate";
import { useAudit } from "@/hooks/useAudit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { Plus, Pencil, Archive } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/suppliers")({
  head: () => ({ meta: [{ title: "Suppliers — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perm="suppliers.view" mode="page">
      <SuppliersPage />
    </PermissionGate>
  ),
});

function SuppliersPage() {
  const { t, lang } = useI18n();
  const { can } = useAuth();
  const audit = useAudit();
  const allSuppliers = useStore((s) => s.suppliers);
  const list = useMemo(() => allSuppliers.filter((c) => !c.archived), [allSuppliers]);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [open, setOpen] = useState(false);
  const canManage = can("suppliers.manage");

  const filtered = list.filter((c) =>
    [c.name_ar, c.name_en, c.email, c.mobile, c.vat].filter(Boolean).some((v) => v!.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <AppShell
      title={t("suppliers")}
      action={canManage ? (
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="size-4 me-1" /> {t("new")}
        </Button>
      ) : null}
    >
      <div className="card-elevated">
        <div className="p-4 border-b">
          <Input placeholder={t("search")} value={q} onChange={(e) => setQ(e.target.value)} className="md:max-w-sm" />
        </div>
        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="text-start font-medium px-4 py-3">{t("name")}</th>
                  <th className="text-start font-medium px-4 py-3">{t("type")}</th>
                  <th className="text-start font-medium px-4 py-3">{t("vat_number")}</th>
                  <th className="text-start font-medium px-4 py-3">{t("mobile")}</th>
                  <th className="text-start font-medium px-4 py-3">{t("city")}</th>
                  <th className="text-start font-medium px-4 py-3">{t("status")}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{lang === "ar" ? c.name_ar : c.name_en}</td>
                    <td className="px-4 py-3">{t(c.type)}</td>
                    <td className="px-4 py-3 font-mono text-xs">{c.vat || "—"}</td>
                    <td className="px-4 py-3">{c.mobile || "—"}</td>
                    <td className="px-4 py-3">{c.city || "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 text-end">
                      {canManage && (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => { setEditing(c); setOpen(true); }}>
                            <Pencil className="size-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => {
                            SupplierService.archive(c.id);
                            audit.log("supplier.archived", "supplier", `أرشفة المورد ${c.name_ar}`, `Archived supplier ${c.name_en}`, c.id);
                            toast.success(t("archive"));
                          }}>
                            <Archive className="size-4" />
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {canManage && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl">
            {open && <SupplierForm key={editing?.id || "new"} editing={editing} onDone={() => setOpen(false)} />}
          </DialogContent>
        </Dialog>
      )}
    </AppShell>
  );
}

function SupplierForm({ editing, onDone }: { editing: Supplier | null; onDone: () => void }) {
  const { t } = useI18n();
  const audit = useAudit();
  const [form, setForm] = useState<Supplier>(editing || {
    id: newId(), name_ar: "", name_en: "", type: "company", status: "active",
  });
  const submit = () => {
    if (!form.name_ar && !form.name_en) { toast.error(t("name")); return; }
    if (editing) {
      SupplierService.update(form.id, form);
      audit.log("supplier.updated", "supplier", `تحديث المورد ${form.name_ar}`, `Updated supplier ${form.name_en}`, form.id);
    } else {
      SupplierService.create(form);
      audit.log("supplier.created", "supplier", `إضافة مورد ${form.name_ar}`, `Created supplier ${form.name_en}`, form.id);
    }
    toast.success(t("save"));
    onDone();
  };
  return (
    <>
      <DialogHeader><DialogTitle>{editing ? t("edit") : t("new")} — {t("supplier")}</DialogTitle></DialogHeader>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>{t("name")} (AR)</Label><Input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>{t("name")} (EN)</Label><Input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} /></div>
        <div className="space-y-1.5">
          <Label>{t("type")}</Label>
          <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as "individual" | "company" })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">{t("individual")}</SelectItem>
              <SelectItem value="company">{t("company")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label>{t("vat_number")}</Label><Input value={form.vat || ""} onChange={(e) => setForm({ ...form, vat: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>{t("mobile")}</Label><Input value={form.mobile || ""} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>{t("email")}</Label><Input value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>{t("city")}</Label><Input value={form.city || ""} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
        <div className="space-y-1.5">
          <Label>{t("status")}</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as "active" | "inactive" })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">{t("active")}</SelectItem>
              <SelectItem value="inactive">{t("inactive")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2 space-y-1.5"><Label>{t("address")}</Label><Input value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
        <div className="md:col-span-2 space-y-1.5"><Label>{t("notes")}</Label><Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onDone}>{t("cancel")}</Button>
        <Button onClick={submit}>{t("save")}</Button>
      </DialogFooter>
    </>
  );
}
