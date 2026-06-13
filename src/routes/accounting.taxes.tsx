import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, Lock, Pencil, Archive, RotateCcw, Trash2, Percent, X } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PermissionGate } from "@/components/PermissionGate";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useStore, type TaxRate, type TaxType, type TaxUsage } from "@/lib/store";
import { TaxRateService } from "@/lib/services";
import { useAudit } from "@/hooks/useAudit";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/accounting/taxes")({
  head: () => ({ meta: [{ title: "Taxes — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perm="taxes.view" mode="page">
      <TaxesPage />
    </PermissionGate>
  ),
});

const TAX_TYPES: TaxType[] = ["sales", "purchases", "reverse_charge", "out_of_scope"];
const USAGES: TaxUsage[] = ["sales", "purchases", "both"];

const TYPE_TONE: Record<TaxType, string> = {
  sales: "bg-success/15 text-success",
  purchases: "bg-info/15 text-info",
  reverse_charge: "bg-warning/20 text-warning-foreground",
  out_of_scope: "bg-muted text-muted-foreground",
};

function typeLabel(t: TaxType, lang: "ar" | "en") {
  const labels: Record<TaxType, { ar: string; en: string }> = {
    sales: { ar: "مبيعات", en: "Sales" },
    purchases: { ar: "مشتريات", en: "Purchases" },
    reverse_charge: { ar: "احتساب عكسي", en: "Reverse Charge" },
    out_of_scope: { ar: "غير خاضع", en: "Out of Scope" },
  };
  return labels[t][lang];
}
function usageLabel(u: TaxUsage, lang: "ar" | "en") {
  const labels: Record<TaxUsage, { ar: string; en: string }> = {
    sales: { ar: "المبيعات", en: "Sales" },
    purchases: { ar: "المشتريات", en: "Purchases" },
    both: { ar: "الكل", en: "Both" },
  };
  return labels[u][lang];
}

function TaxesPage() {
  const { t, lang } = useI18n();
  const { can } = useAuth();
  const canManage = can("taxes.manage");
  const audit = useAudit();

  // subscribe to changes
  useStore((s) => s.tax_rates);
  const all = TaxRateService.list();

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TaxType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const [editing, setEditing] = useState<TaxRate | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TaxRate | null>(null);

  const filtered = useMemo(() => {
    let list = all;
    if (typeFilter !== "all") list = list.filter((r) => r.tax_type === typeFilter);
    if (statusFilter !== "all")
      list = list.filter((r) => (statusFilter === "active" ? r.is_active : !r.is_active));
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.name_ar.toLowerCase().includes(q) ||
          r.name_en.toLowerCase().includes(q) ||
          (r.description_ar ?? "").toLowerCase().includes(q) ||
          (r.description_en ?? "").toLowerCase().includes(q),
      );
    }
    // System first, then by type, then rate desc
    return [...list].sort((a, b) => {
      if (!!b.is_system !== !!a.is_system) return b.is_system ? 1 : -1;
      if (a.tax_type !== b.tax_type) return a.tax_type.localeCompare(b.tax_type);
      return b.rate - a.rate;
    });
  }, [all, query, typeFilter, statusFilter]);

  const counts = useMemo(() => ({
    total: all.length,
    active: all.filter((r) => r.is_active).length,
    system: all.filter((r) => r.is_system).length,
    custom: all.filter((r) => !r.is_system).length,
  }), [all]);

  const addAction = canManage ? (
    <Button size="sm" onClick={() => setCreating(true)}>
      <Plus className="size-4 me-1" /> {t("create")}
    </Button>
  ) : null;

  return (
    <AppShell title={t("taxes")} action={addAction}>
      {/* Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Counter label={lang === "ar" ? "إجمالي" : "Total"} value={counts.total} />
        <Counter label={lang === "ar" ? "نشطة" : "Active"} value={counts.active} tone="success" />
        <Counter label={lang === "ar" ? "نظامية" : "System"} value={counts.system} tone="info" />
        <Counter label={lang === "ar" ? "مخصصة" : "Custom"} value={counts.custom} tone="warning" />
      </div>

      {/* Filters */}
      <div className="card-elevated p-3 mb-3 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute top-1/2 -translate-y-1/2 start-2 size-4 text-muted-foreground" />
          <Input
            placeholder={lang === "ar" ? "بحث بالاسم أو الوصف…" : "Search by name or description…"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="ps-8"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{lang === "ar" ? "كل الأنواع" : "All types"}</SelectItem>
            {TAX_TYPES.map((tt) => (
              <SelectItem key={tt} value={tt}>{typeLabel(tt, lang)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{lang === "ar" ? "كل الحالات" : "All statuses"}</SelectItem>
            <SelectItem value="active">{lang === "ar" ? "نشطة" : "Active"}</SelectItem>
            <SelectItem value="inactive">{lang === "ar" ? "غير نشطة" : "Inactive"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="card-elevated overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <Th>{lang === "ar" ? "الاسم العربي" : "Arabic Name"}</Th>
              <Th>{lang === "ar" ? "الاسم الإنجليزي" : "English Name"}</Th>
              <Th>{lang === "ar" ? "النوع" : "Type"}</Th>
              <Th align="end">{lang === "ar" ? "المعدل" : "Rate"}</Th>
              <Th>{lang === "ar" ? "الوصف" : "Description"}</Th>
              <Th>{lang === "ar" ? "الحالة" : "Status"}</Th>
              <Th>{lang === "ar" ? "مستخدمة في" : "Used In"}</Th>
              <Th>{lang === "ar" ? "النظام" : "System"}</Th>
              <Th align="end">{lang === "ar" ? "إجراءات" : "Actions"}</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                {lang === "ar" ? "لا توجد ضرائب مطابقة" : "No matching tax rates"}
              </td></tr>
            ) : filtered.map((r) => (
              <tr key={r.id} className="border-t border-border/50">
                <td className="px-4 py-3 font-medium">{r.name_ar}</td>
                <td className="px-4 py-3">{r.name_en}</td>
                <td className="px-4 py-3">
                  <Badge className={cn("font-normal", TYPE_TONE[r.tax_type])}>
                    {typeLabel(r.tax_type, lang)}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-end font-mono tabular-nums">{r.rate}%</td>
                <td className="px-4 py-3 text-muted-foreground max-w-[280px] truncate">
                  {lang === "ar" ? r.description_ar : r.description_en}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={r.is_active ? "default" : "secondary"} className="font-normal">
                    {r.is_active
                      ? (lang === "ar" ? "نشطة" : "Active")
                      : (lang === "ar" ? "غير نشطة" : "Inactive")}
                  </Badge>
                </td>
                <td className="px-4 py-3">{usageLabel(r.used_in, lang)}</td>
                <td className="px-4 py-3">
                  {r.is_system ? (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Lock className="size-3.5" />
                      {lang === "ar" ? "محمية" : "Locked"}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-end">
                  <div className="inline-flex gap-1">
                    {canManage && (
                      <Button variant="ghost" size="sm" onClick={() => setEditing(r)} title={lang === "ar" ? "تعديل" : "Edit"}>
                        <Pencil className="size-4" />
                      </Button>
                    )}
                    {canManage && !r.is_system && (
                      r.is_active ? (
                        <Button variant="ghost" size="sm" onClick={() => {
                          TaxRateService.archive(r.id);
                          audit.log("taxes.archive", "tax_rate", `أرشفة ضريبة: ${r.name_ar}`, `Archived tax: ${r.name_en}`, r.id);
                          toast.success(lang === "ar" ? "تمت الأرشفة" : "Archived");
                        }} title={lang === "ar" ? "أرشفة" : "Archive"}>
                          <Archive className="size-4" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => {
                          TaxRateService.update(r.id, { is_active: true });
                          audit.log("taxes.restore", "tax_rate", `تفعيل ضريبة: ${r.name_ar}`, `Reactivated tax: ${r.name_en}`, r.id);
                          toast.success(lang === "ar" ? "تم التفعيل" : "Reactivated");
                        }} title={lang === "ar" ? "تفعيل" : "Reactivate"}>
                          <RotateCcw className="size-4" />
                        </Button>
                      )
                    )}
                    {canManage && !r.is_system && (
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(r)} title={lang === "ar" ? "حذف" : "Delete"}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        {lang === "ar"
          ? "ملاحظة: الضرائب النظامية (ضريبة القيمة المضافة 15% للمبيعات والمشتريات، صفر/معفى/غير خاضع/احتساب عكسي) محمية ولا يمكن حذفها."
          : "Note: System tax rates (Saudi VAT 15% sales/purchases, zero/exempt/out-of-scope/reverse charge) are locked and cannot be deleted."}
      </p>

      {/* Create / Edit dialog */}
      {(creating || editing) && (
        <TaxDialog
          initial={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSave={(payload, id) => {
            if (id) {
              TaxRateService.update(id, payload);
              audit.log("taxes.update", "tax_rate", `تعديل ضريبة: ${payload.name_ar}`, `Updated tax: ${payload.name_en}`, id);
              toast.success(lang === "ar" ? "تم الحفظ" : "Saved");
            } else {
              if (TaxRateService.isDuplicateName(payload.name_ar, payload.name_en)) {
                toast.error(lang === "ar" ? "اسم مكرر" : "Duplicate name");
                return false;
              }
              const rec = TaxRateService.create(payload);
              audit.log("taxes.create", "tax_rate", `إضافة ضريبة: ${rec.name_ar}`, `Created tax: ${rec.name_en}`, rec.id);
              toast.success(lang === "ar" ? "تمت الإضافة" : "Created");
            }
            return true;
          }}
        />
      )}

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{lang === "ar" ? "حذف الضريبة؟" : "Delete tax rate?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {lang === "ar"
                ? `سيتم حذف "${deleteTarget?.name_ar ?? ""}" نهائيًا. هذا الإجراء لا يمكن التراجع عنه.`
                : `"${deleteTarget?.name_en ?? ""}" will be permanently removed. This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (deleteTarget) {
                const ok = TaxRateService.remove(deleteTarget.id);
                if (ok) {
                  audit.log("taxes.delete", "tax_rate", `حذف ضريبة: ${deleteTarget.name_ar}`, `Deleted tax: ${deleteTarget.name_en}`, deleteTarget.id);
                  toast.success(lang === "ar" ? "تم الحذف" : "Deleted");
                } else {
                  toast.error(lang === "ar" ? "لا يمكن حذف ضريبة نظامية" : "System tax cannot be deleted");
                }
              }
              setDeleteTarget(null);
            }}>{t("confirm")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

function Counter({ label, value, tone }: { label: string; value: number; tone?: "success" | "info" | "warning" }) {
  const toneCls =
    tone === "success" ? "text-success" :
    tone === "info" ? "text-info" :
    tone === "warning" ? "text-warning-foreground" : "";
  return (
    <div className="card-elevated p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("text-2xl font-semibold tabular-nums", toneCls)}>{value}</div>
    </div>
  );
}

function Th({ children, align = "start" }: { children: React.ReactNode; align?: "start" | "end" }) {
  return <th className={cn("px-4 py-3 font-medium", align === "end" ? "text-end" : "text-start")}>{children}</th>;
}

function TaxDialog({
  initial, onClose, onSave,
}: {
  initial: TaxRate | null;
  onClose: () => void;
  onSave: (payload: Omit<TaxRate, "id" | "created_at" | "updated_at" | "is_system">, id?: string) => boolean;
}) {
  const { t, lang } = useI18n();
  const isSystem = !!initial?.is_system;

  const [name_ar, setNameAr] = useState(initial?.name_ar ?? "");
  const [name_en, setNameEn] = useState(initial?.name_en ?? "");
  const [tax_type, setTaxType] = useState<TaxType>(initial?.tax_type ?? "sales");
  const [rate, setRate] = useState<number>(initial?.rate ?? 15);
  const [description_ar, setDescAr] = useState(initial?.description_ar ?? "");
  const [description_en, setDescEn] = useState(initial?.description_en ?? "");
  const [used_in, setUsedIn] = useState<TaxUsage>(initial?.used_in ?? "sales");
  const [is_active, setIsActive] = useState<boolean>(initial?.is_active ?? true);
  const [notes, setNotes] = useState(initial?.notes ?? "");

  function submit() {
    if (!name_ar.trim()) return toast.error(lang === "ar" ? "الاسم العربي مطلوب" : "Arabic name required");
    if (!name_en.trim()) return toast.error(lang === "ar" ? "الاسم الإنجليزي مطلوب" : "English name required");
    if (rate < 0 || rate > 100) return toast.error(lang === "ar" ? "المعدل يجب أن يكون بين 0 و 100" : "Rate must be 0-100");

    const ok = onSave({
      name_ar: name_ar.trim(),
      name_en: name_en.trim(),
      tax_type,
      rate: Number(rate),
      description_ar: description_ar.trim() || undefined,
      description_en: description_en.trim() || undefined,
      used_in,
      is_active,
      notes: notes.trim() || undefined,
    }, initial?.id);
    if (ok) onClose();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Percent className="size-4" />
            {initial
              ? (lang === "ar" ? "تعديل ضريبة" : "Edit tax rate")
              : (lang === "ar" ? "إضافة ضريبة" : "Add tax rate")}
            {isSystem && (
              <Badge variant="secondary" className="font-normal gap-1">
                <Lock className="size-3" /> {lang === "ar" ? "نظامية" : "System"}
              </Badge>
            )}
          </DialogTitle>
          {isSystem && (
            <DialogDescription>
              {lang === "ar"
                ? "هذه ضريبة نظامية — يمكن تعديل الوصف والملاحظات والتفعيل فقط."
                : "System tax — only description, notes and active state can be edited."}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <Field label={lang === "ar" ? "الاسم العربي" : "Arabic name"} required>
            <Input value={name_ar} onChange={(e) => setNameAr(e.target.value)} disabled={isSystem} />
          </Field>
          <Field label={lang === "ar" ? "الاسم الإنجليزي" : "English name"} required>
            <Input value={name_en} onChange={(e) => setNameEn(e.target.value)} disabled={isSystem} />
          </Field>
          <Field label={lang === "ar" ? "النوع" : "Type"} required>
            <Select value={tax_type} onValueChange={(v) => setTaxType(v as TaxType)} disabled={isSystem}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TAX_TYPES.map((tt) => <SelectItem key={tt} value={tt}>{typeLabel(tt, lang)}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label={lang === "ar" ? "المعدل %" : "Rate %"} required>
            <Input
              type="number" min={0} max={100} step="0.01"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value || "0"))}
              disabled={isSystem}
            />
          </Field>
          <Field label={lang === "ar" ? "الوصف بالعربي" : "Arabic description"}>
            <Input value={description_ar} onChange={(e) => setDescAr(e.target.value)} />
          </Field>
          <Field label={lang === "ar" ? "الوصف بالإنجليزي" : "English description"}>
            <Input value={description_en} onChange={(e) => setDescEn(e.target.value)} />
          </Field>
          <Field label={lang === "ar" ? "مستخدمة في" : "Used in"}>
            <Select value={used_in} onValueChange={(v) => setUsedIn(v as TaxUsage)} disabled={isSystem}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {USAGES.map((u) => <SelectItem key={u} value={u}>{usageLabel(u, lang)}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label={lang === "ar" ? "نشطة" : "Active"}>
            <div className="flex items-center h-9">
              <Switch checked={is_active} onCheckedChange={setIsActive} />
            </div>
          </Field>
          <div className="col-span-2">
            <Field label={lang === "ar" ? "ملاحظات" : "Notes"}>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            <X className="size-4 me-1" /> {t("cancel")}
          </Button>
          <Button onClick={submit}>{t("save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-muted-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
    </div>
  );
}
