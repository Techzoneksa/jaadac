import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown, ChevronLeft, ChevronRight, Lock, Plus, Search,
  ListTree, Folder, Hash, Pencil, Trash2, X, ChevronsDownUp, ChevronsUpDown,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PermissionGate } from "@/components/PermissionGate";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useStore, store, newId, DEMO_TENANT_ID, type Account, type AccountClass, type AccountKind, type CashFlowType, type AccountPurpose } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  buildChartTree, flattenChartTree, allExpandableIds, ancestorIds,
  searchChartAccounts, validateAccount,
} from "@/lib/accounting/chart-tree";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/accounting/chart")({
  head: () => ({ meta: [{ title: "Chart of Accounts — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perm="accounting.view" mode="page">
      <ChartPage />
    </PermissionGate>
  ),
});

const CLASSES: AccountClass[] = ["assets", "liabilities", "equity", "revenue", "expenses"];

const CLASS_TONE: Record<AccountClass, { row: string; chip: string; dot: string }> = {
  assets:      { row: "bg-info/[0.06]",        chip: "bg-info/15 text-info",                dot: "bg-info" },
  liabilities: { row: "bg-warning/[0.07]",     chip: "bg-warning/20 text-warning-foreground", dot: "bg-warning" },
  equity:      { row: "bg-accent/[0.30]",      chip: "bg-accent text-accent-foreground",     dot: "bg-foreground/50" },
  revenue:     { row: "bg-success/[0.07]",     chip: "bg-success/15 text-success",          dot: "bg-success" },
  expenses:    { row: "bg-destructive/[0.06]", chip: "bg-destructive/15 text-destructive",  dot: "bg-destructive" },
};

const PURPOSES: AccountPurpose[] = [
  "cash","bank","accounts_receivable","suppliers","inventory","fixed_assets",
  "accumulated_depreciation","vat_input","vat_payable","revenue","expense",
  "cost_of_sales","payroll_payable","retained_earnings","owner_equity","opening_balance_equity",
];
const CASHFLOWS: CashFlowType[] = ["operating","investing","financing","cash","none"];
const KINDS: AccountKind[] = ["header","group","posting"];

// ------------------------------- Page ----------------------------------------

function ChartPage() {
  const { t, lang, dir } = useI18n();
  const { can } = useAuth();
  const canManage = can("accounts.manage");
  const accounts = useStore((s) => s.accounts);

  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState<AccountClass | "all">("all");
  const [postingOnly, setPostingOnly] = useState(false);
  const [openIds, setOpenIds] = useState<Set<string>>(() =>
    new Set(accounts.filter((a) => !a.parent).map((a) => a.id)),
  );
  const [editing, setEditing] = useState<Account | null>(null);
  const [creating, setCreating] = useState<{ parentId?: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);

  // Filter pipeline.
  const filtered = useMemo(() => {
    let list = accounts;
    if (classFilter !== "all") list = list.filter((a) => a.type === classFilter);
    if (postingOnly) list = list.filter((a) => (a.kind ?? "posting") === "posting");
    if (query.trim()) {
      const matches = searchChartAccounts(list, query);
      // Expand to include all ancestors so the tree path is visible.
      const keep = new Set(matches.map((m) => m.id));
      for (const m of matches) ancestorIds(accounts, m.id).forEach((id) => keep.add(id));
      list = accounts.filter((a) => keep.has(a.id));
    }
    return list;
  }, [accounts, classFilter, postingOnly, query]);

  const tree = useMemo(() => buildChartTree(filtered), [filtered]);
  const effectiveOpen = useMemo(() => {
    if (!query.trim()) return openIds;
    // Auto-open everything during active search.
    return new Set(allExpandableIds(tree));
  }, [openIds, query, tree]);
  const rows = useMemo(() => flattenChartTree(tree, effectiveOpen), [tree, effectiveOpen]);

  // Summary counters (from full accounts list — unaffected by filters).
  const counters = useMemo(() => {
    const total = accounts.length;
    const posting = accounts.filter((a) => (a.kind ?? "posting") === "posting").length;
    const locked = accounts.filter((a) => a.locked).length;
    const custom = accounts.filter((a) => !a.locked).length;
    return { total, posting, locked, custom };
  }, [accounts]);

  const toggle = (id: string) =>
    setOpenIds((cur) => { const n = new Set(cur); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const expandAll = () => setOpenIds(new Set(allExpandableIds(buildChartTree(accounts))));
  const collapseAll = () => setOpenIds(new Set());

  // ----- Save / delete handlers (single source of truth on the store) -------
  const saveAccount = (draft: Partial<Account>, editingId?: string) => {
    const v = validateAccount(draft, accounts, editingId);
    if (!v.ok) {
      toast.error(v.error === "duplicate" ? t("coa_error_duplicate_code") : t("coa_error_required"));
      return false;
    }
    store.set((s) => {
      if (editingId) {
        const original = s.accounts.find((a) => a.id === editingId);
        if (!original) return s;
        // Locked accounts: preserve code/class/kind/locked flag; allow name/notes/purpose toggles.
        const merged: Account = original.locked
          ? { ...original,
              name_ar: draft.name_ar ?? original.name_ar,
              name_en: draft.name_en ?? original.name_en,
              notes: draft.notes,
              payment_enabled: draft.payment_enabled ?? original.payment_enabled,
              status: draft.status ?? original.status,
              currency: draft.currency ?? original.currency,
            }
          : { ...original, ...draft } as Account;
        return { ...s, accounts: s.accounts.map((a) => (a.id === editingId ? merged : a)) };
      }
      const acct: Account = {
        id: newId(),
        tenant_id: DEMO_TENANT_ID,
        number: draft.number!.trim(),
        name_ar: draft.name_ar!.trim(),
        name_en: (draft.name_en ?? "").trim(),
        type: (draft.type as AccountClass) ?? "assets",
        parent: draft.parent,
        status: draft.status ?? "active",
        kind: draft.kind ?? "posting",
        cash_flow: draft.cash_flow,
        payment_enabled: draft.payment_enabled,
        purpose: draft.purpose,
        currency: draft.currency ?? "SAR",
        notes: draft.notes,
        locked: false,
      };
      return { ...s, accounts: [...s.accounts, acct] };
    });
    toast.success(t("saved_successfully"));
    return true;
  };

  const handleDelete = (a: Account) => {
    if (a.locked) { toast.error(t("coa_error_locked")); return; }
    // Cascade-safe: refuse if has children.
    if (accounts.some((c) => c.parent === a.id)) {
      toast.error(t("coa_error_locked"));
      return;
    }
    store.set((s) => ({ ...s, accounts: s.accounts.filter((x) => x.id !== a.id) }));
    toast.success(t("saved_successfully"));
    setDeleteTarget(null);
  };

  // ============================================================ render
  return (
    <AppShell
      title={t("chart_of_accounts")}
      action={
        canManage && (
          <Button onClick={() => setCreating({})} className="gap-2">
            <Plus className="size-4" /> {t("coa_add_account")}
          </Button>
        )
      }
    >
      {/* Summary counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Counter label={t("coa_count_total")} value={counters.total} icon={<ListTree className="size-4" />} />
        <Counter label={t("coa_count_posting")} value={counters.posting} icon={<Hash className="size-4" />} />
        <Counter label={t("coa_count_locked")} value={counters.locked} icon={<Lock className="size-4" />} />
        <Counter label={t("coa_count_custom")} value={counters.custom} icon={<Folder className="size-4" />} />
      </div>

      {/* Toolbar */}
      <div className="card-elevated p-3 mb-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className={cn("absolute top-1/2 -translate-y-1/2 size-4 text-muted-foreground", dir === "rtl" ? "end-3" : "start-3")} />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("coa_search_placeholder")}
            className={cn(dir === "rtl" ? "pe-9" : "ps-9")}
          />
        </div>
        <Select value={classFilter} onValueChange={(v) => setClassFilter(v as AccountClass | "all")}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder={t("coa_filter_class")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("coa_filter_all_classes")}</SelectItem>
            {CLASSES.map((c) => <SelectItem key={c} value={c}>{t(c)}</SelectItem>)}
          </SelectContent>
        </Select>
        <label className="flex items-center gap-2 text-sm text-muted-foreground select-none">
          <Switch checked={postingOnly} onCheckedChange={setPostingOnly} />
          {t("coa_posting_only")}
        </label>
        <div className="ms-auto flex gap-1.5">
          <Button variant="outline" size="sm" onClick={expandAll} className="gap-1.5">
            <ChevronsUpDown className="size-3.5" /> {t("coa_expand_all")}
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll} className="gap-1.5">
            <ChevronsDownUp className="size-3.5" /> {t("coa_collapse_all")}
          </Button>
        </div>
      </div>

      {/* Tree grid */}
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 sticky top-0 z-10">
              <tr className="text-muted-foreground">
                <th className="text-start font-medium px-3 py-2.5 w-[28%]">{t("coa_account_name")}</th>
                <th className="text-start font-medium px-3 py-2.5 w-[10%]">{t("coa_account_code")}</th>
                <th className="text-start font-medium px-3 py-2.5 w-[12%]">{t("coa_cash_flow")}</th>
                <th className="text-start font-medium px-3 py-2.5 w-[10%]">{t("coa_payment_enabled")}</th>
                <th className="text-start font-medium px-3 py-2.5 w-[16%]">{t("coa_purpose")}</th>
                <th className="text-start font-medium px-3 py-2.5 w-[10%]">{t("coa_account_type")}</th>
                <th className="text-start font-medium px-3 py-2.5 w-[8%]">{t("coa_status")}</th>
                <th className="text-end font-medium px-3 py-2.5 w-[6%]"></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={8} className="text-center text-muted-foreground py-12">{t("coa_no_results")}</td></tr>
              )}
              {rows.map((node) => {
                const a = node.account;
                const isClass = (a.kind ?? "posting") === "header";
                const isGroup = (a.kind ?? "posting") === "group";
                const tone = CLASS_TONE[a.type];
                const open = effectiveOpen.has(a.id);
                const padStart = 12 + node.level * 22;
                return (
                  <tr
                    key={a.id}
                    className={cn(
                      "border-t transition-colors hover:bg-muted/30",
                      isClass && cn(tone.row, "font-semibold"),
                      isGroup && "bg-muted/[0.18]",
                      a.status === "inactive" && "opacity-55",
                    )}
                  >
                    {/* Name + tree controls */}
                    <td className="px-3 py-2.5" style={dir === "rtl" ? { paddingInlineStart: padStart } : { paddingInlineStart: padStart }}>
                      <div className="flex items-center gap-2 min-w-0">
                        {node.hasChildren ? (
                          <button
                            type="button"
                            onClick={() => toggle(a.id)}
                            aria-label={open ? "collapse" : "expand"}
                            className="shrink-0 size-5 rounded hover:bg-muted flex items-center justify-center"
                          >
                            {open
                              ? <ChevronDown className="size-3.5" />
                              : (dir === "rtl" ? <ChevronLeft className="size-3.5" /> : <ChevronRight className="size-3.5" />)}
                          </button>
                        ) : <span className="inline-block size-5 shrink-0" />}
                        {node.hasChildren
                          ? <Folder className={cn("size-4 shrink-0", isClass ? tone.chip.split(" ")[1] : "text-muted-foreground")} />
                          : <span className={cn("size-1.5 rounded-full shrink-0", tone.dot)} />}
                        <span className="truncate">{lang === "ar" ? a.name_ar : (a.name_en || a.name_ar)}</span>
                        {node.hasChildren && <span className="text-[11px] text-muted-foreground shrink-0">({node.childCount})</span>}
                      </div>
                    </td>
                    {/* Code */}
                    <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{a.number}</td>
                    {/* Cash flow */}
                    <td className="px-3 py-2.5">
                      {a.cash_flow && a.cash_flow !== "none" ? (
                        <Badge variant="outline" className="font-normal text-xs">{t(`coa_cf_${a.cash_flow}`)}</Badge>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    {/* Payment enabled */}
                    <td className="px-3 py-2.5">
                      {isClass || isGroup ? <span className="text-muted-foreground">—</span> : (
                        <span className={cn("text-xs", a.payment_enabled ? "text-success" : "text-muted-foreground")}>
                          {a.payment_enabled ? "✓ " + t("coa_yes") : t("coa_no")}
                        </span>
                      )}
                    </td>
                    {/* Purpose */}
                    <td className="px-3 py-2.5">
                      {a.purpose
                        ? <Badge className={cn("font-normal", tone.chip, "border-0")}>{t(`coa_purpose_${a.purpose}`)}</Badge>
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                    {/* Account type */}
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">
                      {t(`coa_kind_${a.kind ?? "posting"}`)}
                    </td>
                    {/* Status */}
                    <td className="px-3 py-2.5">
                      <span className={cn("text-xs", a.status === "active" ? "text-success" : "text-muted-foreground")}>
                        {a.status === "active" ? t("coa_active") : t("coa_inactive")}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        {a.locked && (
                          <span title={t("coa_locked")} className="text-muted-foreground">
                            <Lock className="size-3.5" />
                          </span>
                        )}
                        {canManage && !isClass && (
                          <Button variant="ghost" size="icon" className="size-7" onClick={() => setEditing(a)} aria-label={t("edit")}>
                            <Pencil className="size-3.5" />
                          </Button>
                        )}
                        {canManage && !a.locked && (
                          <Button variant="ghost" size="icon" className="size-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(a)} aria-label={t("delete")}>
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit side panel */}
      <AccountFormSheet
        open={!!editing || !!creating}
        editing={editing}
        defaultParent={creating?.parentId}
        accounts={accounts}
        onClose={() => { setEditing(null); setCreating(null); }}
        onSave={(draft) => {
          const ok = saveAccount(draft, editing?.id);
          if (ok) { setEditing(null); setCreating(null); }
        }}
      />

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete")} — {deleteTarget?.name_ar}</AlertDialogTitle>
            <AlertDialogDescription>
              {lang === "ar"
                ? "هل أنت متأكد من حذف هذا الحساب؟ هذه العملية لا يمكن التراجع عنها."
                : "Are you sure you want to delete this account? This cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

// ----- Sub-components --------------------------------------------------------

function Counter({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="card-elevated px-4 py-3 flex items-center justify-between">
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xl font-semibold tabular-nums">{value}</div>
      </div>
      <span className="size-9 rounded-md bg-muted/50 flex items-center justify-center text-muted-foreground">{icon}</span>
    </div>
  );
}

function AccountFormSheet({
  open, editing, defaultParent, accounts, onClose, onSave,
}: {
  open: boolean;
  editing: Account | null;
  defaultParent?: string;
  accounts: Account[];
  onClose: () => void;
  onSave: (draft: Partial<Account>) => void;
}) {
  const { t, lang, dir } = useI18n();
  const [draft, setDraft] = useState<Partial<Account>>({});
  // Reset draft whenever the panel target changes.
  useMemoReset(open, editing, defaultParent, accounts, setDraft);

  const isEdit = !!editing;
  const locked = !!editing?.locked;
  const parentOptions = accounts
    .filter((a) => (a.kind ?? "posting") !== "posting" && a.id !== editing?.id)
    .sort((a, b) => a.number.localeCompare(b.number, "en", { numeric: true }));

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side={dir === "rtl" ? "left" : "right"} className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? t("coa_edit_account") : t("coa_add_account")}</SheetTitle>
          <SheetDescription>
            {locked
              ? (lang === "ar" ? "حساب نظام محمي. بعض الحقول غير قابلة للتعديل." : "Protected system account. Some fields are read-only.")
              : (lang === "ar" ? "أدخل تفاصيل الحساب." : "Enter the account details.")}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-3 mt-5">
          <Field label={t("coa_parent")}>
            <Select
              value={draft.parent ?? "__none"}
              onValueChange={(v) => setDraft((d) => ({ ...d, parent: v === "__none" ? undefined : v }))}
              disabled={locked}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">— —</SelectItem>
                {parentOptions.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.number} · {lang === "ar" ? p.name_ar : p.name_en || p.name_ar}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t("coa_account_code") + " *"}>
              <Input value={draft.number ?? ""} disabled={locked} onChange={(e) => setDraft((d) => ({ ...d, number: e.target.value }))} />
            </Field>
            <Field label={t("coa_account_class")}>
              <Select value={draft.type ?? "assets"} onValueChange={(v) => setDraft((d) => ({ ...d, type: v as AccountClass }))} disabled={locked}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CLASSES.map((c) => <SelectItem key={c} value={c}>{t(c)}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label={t("coa_account_name") + " (AR) *"}>
            <Input value={draft.name_ar ?? ""} onChange={(e) => setDraft((d) => ({ ...d, name_ar: e.target.value }))} />
          </Field>
          <Field label={t("coa_account_name") + " (EN)"}>
            <Input value={draft.name_en ?? ""} onChange={(e) => setDraft((d) => ({ ...d, name_en: e.target.value }))} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t("coa_account_type")}>
              <Select value={draft.kind ?? "posting"} onValueChange={(v) => setDraft((d) => ({ ...d, kind: v as AccountKind }))} disabled={locked}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{KINDS.map((k) => <SelectItem key={k} value={k}>{t(`coa_kind_${k}`)}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label={t("coa_cash_flow")}>
              <Select value={draft.cash_flow ?? "none"} onValueChange={(v) => setDraft((d) => ({ ...d, cash_flow: v as CashFlowType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CASHFLOWS.map((c) => <SelectItem key={c} value={c}>{t(`coa_cf_${c}`)}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>

          <Field label={t("coa_purpose")}>
            <Select
              value={draft.purpose ?? "__none"}
              onValueChange={(v) => setDraft((d) => ({ ...d, purpose: v === "__none" ? undefined : (v as AccountPurpose) }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">— —</SelectItem>
                {PURPOSES.map((p) => <SelectItem key={p} value={p}>{t(`coa_purpose_${p}`)}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t("coa_currency")}>
              <Input value={draft.currency ?? "SAR"} onChange={(e) => setDraft((d) => ({ ...d, currency: e.target.value }))} />
            </Field>
            <Field label={t("coa_status")}>
              <Select value={draft.status ?? "active"} onValueChange={(v) => setDraft((d) => ({ ...d, status: v as Account["status"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t("coa_active")}</SelectItem>
                  <SelectItem value="inactive">{t("coa_inactive")}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <label className="flex items-center justify-between text-sm py-2">
            <span>{t("coa_payment_enabled")}</span>
            <Switch checked={!!draft.payment_enabled} onCheckedChange={(v) => setDraft((d) => ({ ...d, payment_enabled: v }))} />
          </label>

          <Field label={t("coa_notes")}>
            <Input value={draft.notes ?? ""} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))} />
          </Field>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}><X className="size-4 me-1" />{t("cancel")}</Button>
          <Button onClick={() => onSave(draft)}>{t("save")}</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

// Reset the draft when the sheet target changes (open + editing identity).
function useMemoReset(
  open: boolean,
  editing: Account | null,
  defaultParent: string | undefined,
  accounts: Account[],
  setDraft: (d: Partial<Account>) => void,
) {
  // Recompute on identity changes only.
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setDraft({ ...editing });
    } else {
      const parent = defaultParent ? accounts.find((a) => a.id === defaultParent) : undefined;
      setDraft({
        type: parent?.type ?? "assets",
        parent: defaultParent,
        status: "active",
        kind: "posting",
        cash_flow: parent?.cash_flow ?? "operating",
        currency: "SAR",
        payment_enabled: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing?.id, defaultParent]);
}
