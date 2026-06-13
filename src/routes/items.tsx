import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n, fmtMoney } from "@/lib/i18n";
import { useStore, newId, type Item } from "@/lib/store";
import { ItemService } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { Plus, Pencil, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { PermissionGate } from "@/components/PermissionGate";
import { useAudit } from "@/hooks/useAudit";

export const Route = createFileRoute("/items")({
  head: () => ({ meta: [{ title: "Products & Services — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perm="items.view" mode="page">
      <ItemsPage />
    </PermissionGate>
  ),
});

function ItemsPage() {
  const { t, lang } = useI18n();
  const { can } = useAuth();
  const list = useStore((s) => s.items);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Item | null>(null);
  const [open, setOpen] = useState(false);
  const canManage = can("items.manage");

  const filtered = list.filter((it) =>
    (typeFilter === "all" || it.type === typeFilter) &&
    [it.name_ar, it.name_en, it.sku].filter(Boolean).some((v) => v!.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <AppShell title={t("items")} action={canManage ? <Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="size-4 me-1" />{t("new")}</Button> : null}>

      <div className="card-elevated">
        <div className="p-4 border-b flex flex-col md:flex-row gap-3">
          <Input placeholder={t("search")} value={q} onChange={(e) => setQ(e.target.value)} className="md:max-w-sm" />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="md:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("all")}</SelectItem>
              <SelectItem value="service">{t("service")}</SelectItem>
              <SelectItem value="non_stock">{t("non_stock")}</SelectItem>
              <SelectItem value="stock">{t("stock")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {filtered.length === 0 ? <EmptyState /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="text-start font-medium px-4 py-3">{t("name")}</th>
                  <th className="text-start font-medium px-4 py-3">{t("sku")}</th>
                  <th className="text-start font-medium px-4 py-3">{t("type")}</th>
                  <th className="text-end font-medium px-4 py-3">{t("sales_price")}</th>
                  <th className="text-end font-medium px-4 py-3">{t("current_qty")}</th>
                  <th className="text-start font-medium px-4 py-3">{t("status")}</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((it) => {
                  const low = it.type === "stock" && (it.qty ?? 0) <= (it.low_stock ?? 0);
                  return (
                    <tr key={it.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{lang === "ar" ? it.name_ar : it.name_en}</td>
                      <td className="px-4 py-3 font-mono text-xs">{it.sku || "—"}</td>
                      <td className="px-4 py-3">{t(it.type)}</td>
                      <td className="px-4 py-3 text-end font-mono">{fmtMoney(it.sales_price, lang)}</td>
                      <td className="px-4 py-3 text-end">
                        {it.type === "stock" ? (
                          <span className={low ? "text-destructive flex items-center justify-end gap-1" : ""}>
                            {low && <AlertTriangle className="size-3.5" />}{it.qty}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={it.status} /></td>
                      <td className="px-4 py-3 text-end">
                        {canManage && <Button size="sm" variant="ghost" onClick={() => { setEditing(it); setOpen(true); }}><Pencil className="size-4" /></Button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {canManage && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl">
            {open && <ItemForm key={editing?.id || "new"} editing={editing} onDone={() => setOpen(false)} />}
          </DialogContent>
        </Dialog>
      )}
    </AppShell>
  );
}

function ItemForm({ editing, onDone }: { editing: Item | null; onDone: () => void }) {
  const { t } = useI18n();
  const audit = useAudit();
  const [form, setForm] = useState<Item>(editing || {
    id: newId(), name_ar: "", name_en: "", type: "service", sales_price: 0, taxable: true, vat_rate: 15, status: "active",
  });
  const submit = () => {
    if (editing) {
      ItemService.update(form.id, form);
      audit.log("item.updated", "item", `تحديث المنتج ${form.name_ar}`, `Updated item ${form.name_en}`, form.id);
    } else {
      ItemService.create(form);
      audit.log("item.created", "item", `إضافة منتج ${form.name_ar}`, `Created item ${form.name_en}`, form.id);
    }
    toast.success(t("save")); onDone();
  };
  return (
    <>
      <DialogHeader><DialogTitle>{editing ? t("edit") : t("new")} — {t("items")}</DialogTitle></DialogHeader>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>{t("name")} (AR)</Label><Input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>{t("name")} (EN)</Label><Input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>{t("sku")}</Label><Input value={form.sku || ""} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
        <div className="space-y-1.5">
          <Label>{t("type")}</Label>
          <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as Item["type"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="service">{t("service")}</SelectItem>
              <SelectItem value="non_stock">{t("non_stock")}</SelectItem>
              <SelectItem value="stock">{t("stock")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label>{t("sales_price")}</Label><Input type="number" value={form.sales_price} onChange={(e) => setForm({ ...form, sales_price: +e.target.value })} /></div>
        <div className="space-y-1.5"><Label>{t("purchase_price")}</Label><Input type="number" value={form.purchase_price || 0} onChange={(e) => setForm({ ...form, purchase_price: +e.target.value })} /></div>
        <div className="flex items-center gap-3 pt-6">
          <Switch checked={form.taxable} onCheckedChange={(v) => setForm({ ...form, taxable: v })} />
          <Label>{t("taxable")}</Label>
        </div>
        <div className="space-y-1.5"><Label>{t("default_vat")} %</Label><Input type="number" value={form.vat_rate} onChange={(e) => setForm({ ...form, vat_rate: +e.target.value })} /></div>
        {form.type === "stock" && (
          <>
            <div className="space-y-1.5"><Label>{t("current_qty")}</Label><Input type="number" value={form.qty || 0} onChange={(e) => setForm({ ...form, qty: +e.target.value })} /></div>
            <div className="space-y-1.5"><Label>{t("low_stock")}</Label><Input type="number" value={form.low_stock || 0} onChange={(e) => setForm({ ...form, low_stock: +e.target.value })} /></div>
          </>
        )}
        <div className="md:col-span-2 space-y-1.5"><Label>{t("description")}</Label><Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
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
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onDone}>{t("cancel")}</Button>
        <Button onClick={submit}>{t("save")}</Button>
      </DialogFooter>
    </>
  );
}
