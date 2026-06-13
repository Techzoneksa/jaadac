import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n, fmtMoney } from "@/lib/i18n";
import { useStore, newId, type Customer } from "@/lib/store";
import { CustomerService } from "@/lib/services";
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

export const Route = createFileRoute("/customers")({
  head: () => ({ meta: [{ title: "Customers — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perm="customers.view" mode="page">
      <CustomersPage />
    </PermissionGate>
  ),
});

function CustomersPage() {
  const { t, lang } = useI18n();
  const { can } = useAuth();
  const audit = useAudit();
  const allCustomers = useStore((s) => s.customers);
  const customers = useMemo(() => allCustomers.filter((c) => !c.archived), [allCustomers]);
  const invoices = useStore((s) => s.invoices);
  const receipts = useStore((s) => s.receipts);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Customer | null>(null);
  const [open, setOpen] = useState(false);
  const canManage = can("customers.manage");

  const filtered = customers.filter((c) =>
    [c.name_ar, c.name_en, c.email, c.mobile, c.vat].filter(Boolean).some((v) => v!.toLowerCase().includes(q.toLowerCase()))
  );

  const balance = (cid: string) => {
    const inv = invoices.filter((i) => i.customer_id === cid && i.status !== "draft" && i.status !== "cancelled")
      .reduce((s, i) => s + i.lines.reduce((a, l) => a + l.qty * l.unit_price * (1 + l.vat_rate / 100), 0) - i.discount, 0);
    const rec = receipts.filter((r) => r.customer_id === cid).reduce((s, r) => s + r.amount, 0);
    return inv - rec;
  };

  return (
    <AppShell
      title={t("customers")}
      action={canManage ? (
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="size-4 me-1" /> {t("new")}
        </Button>
      ) : null}
    >
      <div className="card-elevated">
        <div className="p-4 border-b flex flex-col md:flex-row gap-3 md:items-center">
          <Input placeholder={t("search")} value={q} onChange={(e) => setQ(e.target.value)} className="md:max-w-sm" />
        </div>

        {filtered.length === 0 ? (
          <EmptyState title={t("empty")} action={canManage ? <Button onClick={() => { setEditing(null); setOpen(true); }}>{t("new")}</Button> : undefined} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="text-start font-medium px-4 py-3">{t("name")}</th>
                  <th className="text-start font-medium px-4 py-3">{t("type")}</th>
                  <th className="text-start font-medium px-4 py-3">{t("mobile")}</th>
                  <th className="text-start font-medium px-4 py-3">{t("city")}</th>
                  <th className="text-end font-medium px-4 py-3">{t("current_balance")}</th>
                  <th className="text-start font-medium px-4 py-3">{t("status")}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{lang === "ar" ? c.name_ar : c.name_en}</td>
                    <td className="px-4 py-3">{t(c.type)}</td>
                    <td className="px-4 py-3">{c.mobile || "—"}</td>
                    <td className="px-4 py-3">{c.city || "—"}</td>
                    <td className="px-4 py-3 text-end font-mono">{fmtMoney(balance(c.id), lang)}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 text-end">
                      {canManage && (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => { setEditing(c); setOpen(true); }}>
                            <Pencil className="size-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => {
                            CustomerService.archive(c.id);
                            audit.log("customer.archived", "customer", `أرشفة العميل ${c.name_ar}`, `Archived customer ${c.name_en}`, c.id);
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

      {canManage && <CustomerDialog open={open} onOpenChange={setOpen} editing={editing} />}
    </AppShell>
  );
}

function CustomerDialog({ open, onOpenChange, editing }: { open: boolean; onOpenChange: (v: boolean) => void; editing: Customer | null }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        {open && <CustomerForm key={editing?.id || "new"} editing={editing} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function CustomerForm({ editing, onDone }: { editing: Customer | null; onDone: () => void }) {
  const { t } = useI18n();
  const audit = useAudit();
  const [form, setForm] = useState<Customer>(editing || {
    id: newId(), name_ar: "", name_en: "", type: "company", opening_balance: 0, status: "active",
  });

  const submit = () => {
    if (!form.name_ar && !form.name_en) { toast.error(t("name")); return; }
    if (editing) {
      CustomerService.update(form.id, form);
      audit.log("customer.updated", "customer", `تحديث العميل ${form.name_ar}`, `Updated customer ${form.name_en}`, form.id);
    } else {
      CustomerService.create(form);
      audit.log("customer.created", "customer", `إضافة عميل ${form.name_ar}`, `Created customer ${form.name_en}`, form.id);
    }
    toast.success(t("save"));
    onDone();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{editing ? t("edit") : t("new")} — {t("customer")}</DialogTitle>
      </DialogHeader>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>{t("name")} (AR)</Label>
            <Input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("name")} (EN)</Label>
            <Input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
          </div>
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
          <div className="space-y-1.5">
            <Label>{t("vat_number")}</Label>
            <Input value={form.vat || ""} onChange={(e) => setForm({ ...form, vat: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("mobile")}</Label>
            <Input value={form.mobile || ""} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("email")}</Label>
            <Input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("city")}</Label>
            <Input value={form.city || ""} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("opening_balance")}</Label>
            <Input type="number" value={form.opening_balance} onChange={(e) => setForm({ ...form, opening_balance: +e.target.value })} />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label>{t("address")}</Label>
            <Input value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label>{t("notes")}</Label>
            <Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
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
