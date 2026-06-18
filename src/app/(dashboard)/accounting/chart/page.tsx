"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import type { Account } from "@/lib/types";
import {
  ChevronLeft, ChevronDown, Search, Plus, Lock, Download,
  RefreshCw, FolderOpen, FolderClosed, Hash, Landmark,
  TrendingUp, DollarSign, FileText, AlertCircle, X,
  Check, Ban, Pencil, Trash2, Eye, Database,
} from "lucide-react";
import { useRouter } from "next/navigation";

const TYPE_STYLES: Record<string, { bg: string; iconBg: string; label: string; icon: React.ReactNode }> = {
  assets:     { bg: "#f0f4ff", iconBg: "#6366f1", label: "الأصول", icon: <Landmark className="h-4 w-4 text-white" /> },
  liabilities:{ bg: "#fff0f4", iconBg: "#ec4899", label: "الالتزامات", icon: <FileText className="h-4 w-4 text-white" /> },
  equity:    { bg: "#fffbeb", iconBg: "#f59e0b", label: "حقوق الملكية", icon: <DollarSign className="h-4 w-4 text-white" /> },
  revenue:   { bg: "#f0fdf4", iconBg: "#10b981", label: "الإيرادات", icon: <TrendingUp className="h-4 w-4 text-white" /> },
  expenses:  { bg: "#f1f5f9", iconBg: "#3b82f6", label: "المصروفات", icon: <Hash className="h-4 w-4 text-white" /> },
};

const TYPE_LABELS: Record<string, string> = {
  assets: "أصول", liabilities: "التزامات", equity: "حقوق ملكية", revenue: "إيرادات", expenses: "مصروفات",
};

const CASH_FLOW_LABELS: Record<string, string> = {
  operating: "تشغيلي", investing: "استثماري", financing: "تمويلي", cash: "نقدي", none: "—",
};

const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  "النقد وما يعادله": "النقد وما يعادله",
  "العملاء": "العملاء",
  "الموردين": "الموردين",
  "القيمة المضافة": "القيمة المضافة",
  "المصروفات العامة والإدارية": "المصروفات العامة والإدارية",
  "رأس المال": "رأس المال",
  "الأرباح المحتجزة": "الأرباح المحتجزة",
};

function buildTree(accounts: Account[]): Account[] {
  const map = new Map<string, Account>();
  const roots: Account[] = [];
  for (const a of accounts) { a.children = []; map.set(a.id, a); }
  for (const a of accounts) {
    if (a.parent && map.has(a.parent)) map.get(a.parent)!.children!.push(a);
    else roots.push(a);
  }
  return roots.sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));
}

function getLevel(num: string): number {
  const trimmed = num.replace(/[^0-9]/g, "");
  return trimmed.length;
}

function getIcon(acc: Account, expanded: boolean): React.ReactNode {
  const ts = TYPE_STYLES[acc.type];
  if (acc.kind === "header" || acc.kind === "group" || (acc.children && acc.children.length > 0)) {
    return (
      <div className="flex h-6 w-6 items-center justify-center rounded-md shrink-0" style={{ backgroundColor: ts?.iconBg || "#6366f1" }}>
        {expanded ? <FolderOpen className="h-3.5 w-3.5 text-white" /> : <FolderClosed className="h-3.5 w-3.5 text-white" />}
      </div>
    );
  }
  return (
    <div className="flex h-6 w-6 items-center justify-center rounded-md shrink-0" style={{ backgroundColor: ts?.iconBg || "#94a3b8" }}>
      <Hash className="h-3.5 w-3.5 text-white" />
    </div>
  );
}

function AccountRow({
  acc, depth, expanded, onToggle, onEdit, onAddChild, onToggleStatus, onDelete, searchActive,
}: {
  acc: Account; depth: number; expanded: Set<string>; onToggle: (id: string) => void;
  onEdit: (a: Account) => void; onAddChild: (a: Account) => void;
  onToggleStatus: (a: Account) => void; onDelete: (a: Account) => void; searchActive: boolean;
}) {
  const hasChildren = acc.children && acc.children.length > 0;
  const isExpanded = expanded.has(acc.id);
  const isSystem = acc.is_system || acc.locked;
  const ts = TYPE_STYLES[acc.type];
  const level = getLevel(acc.number);

  return (
    <>
      <tr className="border-b border-border transition-colors hover:bg-[#f8fafc]">
        <td className="px-3 py-2.5 text-xs font-mono" style={{ paddingRight: `${12 + depth * 20}px` }}>
          <div className="flex items-center gap-1.5">
            {hasChildren ? (
              <button onClick={() => onToggle(acc.id)} className="p-0.5 rounded hover:bg-gray-200 transition-colors">
                {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted" /> : <ChevronLeft className="h-3.5 w-3.5 text-muted" />}
              </button>
            ) : <span className="w-5" />}
            <span className="font-mono text-xs text-muted">{acc.number}</span>
          </div>
        </td>
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-2">
            {getIcon(acc, isExpanded)}
            <span className="text-sm font-medium">{acc.name_ar}</span>
            {isSystem && <span title="حساب نظامي"><Lock className="h-3 w-3 text-amber-500 shrink-0" /></span>}
          </div>
        </td>
        <td className="px-3 py-2.5 text-xs text-muted">{CASH_FLOW_LABELS[acc.cash_flow || "none"] || "—"}</td>
        <td className="px-3 py-2.5 text-center">
          {acc.payment_enabled ? (
            <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
              <Check className="h-3 w-3" /> نعم
            </span>
          ) : (
            <span className="text-xs text-muted">—</span>
          )}
        </td>
        <td className="px-3 py-2.5">
          {acc.expense_claim_category ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700">
              {acc.expense_claim_category}
            </span>
          ) : (
            <span className="text-xs text-muted">—</span>
          )}
        </td>
        <td className="px-3 py-2.5">
          <span className="text-xs" style={{ color: ts?.iconBg || "#94a3b8" }}>{TYPE_LABELS[acc.type] || acc.type}</span>
        </td>
        <td className="px-3 py-2.5">
          {isSystem ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
              <Lock className="h-3 w-3" /> نظامي
            </span>
          ) : (
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full ${acc.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {acc.status === "active" ? "نشط" : "غير نشط"}
            </span>
          )}
        </td>
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-1">
            <button onClick={() => onEdit(acc)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="تعديل">
              <Pencil className="h-3.5 w-3.5 text-muted" />
            </button>
            <button onClick={() => onAddChild(acc)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="إضافة حساب فرعي">
              <Plus className="h-3.5 w-3.5 text-muted" />
            </button>
            {!isSystem && (
              <button onClick={() => onToggleStatus(acc)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title={acc.status === "active" ? "تعطيل" : "تفعيل"}>
                {acc.status === "active" ? <Ban className="h-3.5 w-3.5 text-muted" /> : <Check className="h-3.5 w-3.5 text-green-600" />}
              </button>
            )}
            {!isSystem && (
              <button onClick={() => onDelete(acc)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="حذف">
                <Trash2 className="h-3.5 w-3.5 text-red-400" />
              </button>
            )}
          </div>
        </td>
      </tr>
      {hasChildren && isExpanded && (
        acc.children!.map((child) => (
          <AccountRow
            key={child.id}
            acc={child}
            depth={depth + 1}
            expanded={expanded}
            onToggle={onToggle}
            onEdit={onEdit}
            onAddChild={onAddChild}
            onToggleStatus={onToggleStatus}
            onDelete={onDelete}
            searchActive={searchActive}
          />
        ))
      )}
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-x-auto shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-[#f8fafc]">
            {["رقم الحساب", "اسم الحساب", "التدفق النقدي", "دفع", "مطالبات", "النوع", "الحالة", "إجراءات"].map((h) => (
              <th key={h} className="px-4 py-3.5 text-right font-semibold text-muted text-xs uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 8 }).map((_, i) => (
            <tr key={i} className="border-b border-border">
              {Array.from({ length: 8 }).map((_, j) => (
                <td key={j} className="px-4 py-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ChartOfAccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["1", "2", "3", "4", "5"]));
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [parentAccount, setParentAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState({
    number: "", name_ar: "", name_en: "", type: "assets" as string,
    kind: "posting" as string, parent: "" as string,
    cash_flow: "none" as string, payment_enabled: false,
    expense_claim_category: "" as string, status: "active" as string, notes: "",
  });
  const [saving, setSaving] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const fetchAccounts = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/accounts?${params.toString()}`);
      const data = await res.json();
      if (data.error) { setError(data.error); setAccounts([]); }
      else setAccounts(data);
    } catch { setError("فشل تحميل البيانات"); setAccounts([]); }
    finally { setLoading(false); }
  }, [search, typeFilter, statusFilter]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const tree = useMemo(() => buildTree(accounts), [accounts]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    const all = new Set<string>();
    const collect = (list: Account[]) => { for (const a of list) { all.add(a.id); if (a.children) collect(a.children); } };
    collect(tree);
    setExpanded(all);
  };

  const collapseAll = () => { const s = new Set<string>(); ["1","2","3","4","5"].forEach((id) => s.add(id)); setExpanded(s); };

  // Seed default accounts
  const seedAccounts = async () => {
    setSeeding(true); setSeedError("");
    try {
      const res = await fetch("/api/accounts/seed", { method: "POST" });
      const data = await res.json();
      if (data.error) { setSeedError(data.error); return; }
      await fetchAccounts();
      expandAll();
    } catch { setSeedError("فشل إنشاء الحسابات الافتراضية"); }
    finally { setSeeding(false); }
  };

  // Open add modal
  const openAdd = (parent?: Account) => {
    setEditAccount(null);
    setParentAccount(parent || null);
    setFormData({
      number: parent ? `${parent.number}${Math.floor(Math.random() * 90 + 10)}` : "",
      name_ar: "", name_en: "", type: parent?.type || "assets",
      kind: "posting", parent: parent?.id || "",
      cash_flow: "none", payment_enabled: false,
      expense_claim_category: "", status: "active", notes: "",
    });
    setModalOpen(true);
  };

  // Open edit modal
  const openEdit = (acc: Account) => {
    setEditAccount(acc);
    setParentAccount(null);
    setFormData({
      number: acc.number, name_ar: acc.name_ar, name_en: acc.name_en || "",
      type: acc.type, kind: acc.kind || "posting",
      parent: acc.parent || "", cash_flow: acc.cash_flow || "none",
      payment_enabled: acc.payment_enabled || false,
      expense_claim_category: acc.expense_claim_category || "",
      status: acc.status, notes: acc.notes || "",
    });
    setModalOpen(true);
  };

  // Save account (create or update)
  const saveAccount = async () => {
    if (!formData.number.trim() || !formData.name_ar.trim()) return;
    setSaving(true);
    try {
      const body = { ...formData };
      if (body.parent === "") (body as any).parent = null;
      if (editAccount) {
        const res = await fetch(`/api/accounts/${editAccount.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
        const data = await res.json();
        if (data.error) { setSeedError(data.error); setSaving(false); return; }
      } else {
        const res = await fetch("/api/accounts", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
        const data = await res.json();
        if (data.error) { setSeedError(data.error); setSaving(false); return; }
      }
      setModalOpen(false);
      await fetchAccounts();
    } catch { setSeedError("فشل الحفظ"); }
    finally { setSaving(false); }
  };

  // Toggle active/inactive
  const toggleStatus = async (acc: Account) => {
    const newStatus = acc.status === "active" ? "inactive" : "active";
    try {
      const res = await fetch(`/api/accounts/${acc.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.error) { setSeedError(data.error); return; }
      await fetchAccounts();
    } catch { setSeedError("فشل تغيير الحالة"); }
  };

  // Delete account
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true); setDeleteError("");
    try {
      const res = await fetch(`/api/accounts/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) { setDeleteError(data.error); setDeleting(false); return; }
      setDeleteTarget(null);
      await fetchAccounts();
    } catch { setDeleteError("فشل الحذف"); }
    finally { setDeleting(false); }
  };

  // CSV export
  const exportCsv = () => {
    const headers = ["رقم الحساب", "اسم الحساب", "النوع", "التدفق النقدي", "تفعيل الدفع", "الحالة", "نظامي", "ملاحظات"];
    const rows = accounts.map((a) => [
      a.number, a.name_ar, TYPE_LABELS[a.type] || a.type,
      CASH_FLOW_LABELS[a.cash_flow || "none"], a.payment_enabled ? "نعم" : "لا",
      a.status, a.is_system || a.locked ? "نعم" : "لا", a.notes || "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "chart-of-accounts.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const hasAccounts = accounts.length > 0;
  const filteredAccounts = accounts;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="شجرة الحسابات"
        description="دليل الحسابات المحاسبي"
        count={hasAccounts ? accounts.length : undefined}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            {hasAccounts && (
              <Button variant="outline" onClick={exportCsv}>
                <Download className="h-4 w-4 ml-1.5" /> تصدير CSV
              </Button>
            )}
            <Button onClick={() => openAdd()}>
              <Plus className="h-4 w-4 ml-1.5" /> إضافة حساب
            </Button>
          </div>
        }
      />

      {seedError && (
        <div className="rounded-xl px-4 py-3 text-sm bg-red-50 text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" /> {seedError}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-light" />
          <input
            type="text" placeholder="ابحث برقم الحساب أو الاسم..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-white pr-9 pl-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute left-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-gray-100">
              <X className="h-3.5 w-3.5 text-muted" />
            </button>
          )}
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-9 rounded-lg border border-border bg-white px-3 text-sm"
        >
          <option value="all">جميع الأنواع</option>
          <option value="assets">الأصول</option>
          <option value="liabilities">الالتزامات</option>
          <option value="equity">حقوق الملكية</option>
          <option value="revenue">الإيرادات</option>
          <option value="expenses">المصروفات</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-lg border border-border bg-white px-3 text-sm"
        >
          <option value="all">جميع الحالات</option>
          <option value="active">نشط</option>
          <option value="inactive">غير نشط</option>
          <option value="system">نظامي</option>
        </select>

        {hasAccounts && (
          <>
            <Button variant="outline" size="sm" onClick={expandAll} title="توسيع الكل">
              <FolderOpen className="h-4 w-4 ml-1" /> توسيع الكل
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll} title="طي الكل">
              <FolderClosed className="h-4 w-4 ml-1" /> طي الكل
            </Button>
          </>
        )}
      </div>

      {/* Empty state */}
      {!loading && !hasAccounts && !error && (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-border bg-card">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 mb-4">
            <Database className="h-8 w-8 text-purple-500" />
          </div>
          <h3 className="text-lg font-bold">لا توجد شجرة حسابات بعد</h3>
          <p className="text-sm mt-2 mb-6 max-w-md" style={{ color: "var(--text-muted)" }}>
            ابدأ بإنشاء شجرة حسابات سعودية افتراضية مناسبة للفواتير والضريبة والتقارير، أو أضف حسابًا يدويًا.
          </p>
          <div className="flex items-center gap-3">
            <Button onClick={seedAccounts} disabled={seeding}>
              <RefreshCw className={`h-4 w-4 ml-1.5 ${seeding ? "animate-spin" : ""}`} />
              {seeding ? "جارٍ الإنشاء..." : "إنشاء شجرة حسابات افتراضية"}
            </Button>
            <Button variant="outline" onClick={() => openAdd()}>
              <Plus className="h-4 w-4 ml-1.5" /> إضافة حساب يدويًا
            </Button>
          </div>
        </div>
      )}

      {/* Seed button when accounts exist but user might want to add the full tree */}
      {hasAccounts && !loading && !search && typeFilter === "all" && statusFilter === "all" && (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={seedAccounts} disabled={seeding}>
            <RefreshCw className={`h-4 w-4 ml-1 ${seeding ? "animate-spin" : ""}`} />
            {seeding ? "جارٍ الإنشاء..." : "إنشاء شجرة افتراضية كاملة"}
          </Button>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-border bg-card">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 mb-3">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <p className="text-sm font-medium text-red-700">{error}</p>
          <Button variant="outline" className="mt-4" onClick={fetchAccounts}>إعادة المحاولة</Button>
        </div>
      )}

      {/* Table */}
      {loading && <LoadingSkeleton />}

      {!loading && hasAccounts && (
        <div className="rounded-xl border border-border bg-card overflow-x-auto shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-[#f8fafc]">
                <th className="px-4 py-3.5 text-right font-semibold text-muted text-xs uppercase tracking-wider">رقم الحساب</th>
                <th className="px-4 py-3.5 text-right font-semibold text-muted text-xs uppercase tracking-wider">اسم الحساب</th>
                <th className="px-4 py-3.5 text-right font-semibold text-muted text-xs uppercase tracking-wider">التدفق النقدي</th>
                <th className="px-4 py-3.5 text-center font-semibold text-muted text-xs uppercase tracking-wider">تفعيل الدفع</th>
                <th className="px-4 py-3.5 text-right font-semibold text-muted text-xs uppercase tracking-wider">مطالبات المصروفات</th>
                <th className="px-4 py-3.5 text-right font-semibold text-muted text-xs uppercase tracking-wider">نوع الحساب</th>
                <th className="px-4 py-3.5 text-right font-semibold text-muted text-xs uppercase tracking-wider">الحالة</th>
                <th className="px-4 py-3.5 text-center font-semibold text-muted text-xs uppercase tracking-wider">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {tree.map((acc) => (
                <AccountRow
                  key={acc.id}
                  acc={acc}
                  depth={0}
                  expanded={expanded}
                  onToggle={toggleExpand}
                  onEdit={openEdit}
                  onAddChild={openAdd}
                  onToggleStatus={toggleStatus}
                  onDelete={setDeleteTarget}
                  searchActive={!!search}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold">{editAccount ? "تعديل حساب" : parentAccount ? `إضافة حساب فرعي لـ ${parentAccount.name_ar}` : "إضافة حساب"}</h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">رقم الحساب *</label>
                  <input type="text" value={formData.number} onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    className="h-9 w-full rounded-lg border border-border bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">النوع *</label>
                  <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="h-9 w-full rounded-lg border border-border bg-white px-3 text-sm">
                    <option value="assets">أصول</option>
                    <option value="liabilities">التزامات</option>
                    <option value="equity">حقوق ملكية</option>
                    <option value="revenue">إيرادات</option>
                    <option value="expenses">مصروفات</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">اسم الحساب *</label>
                <input type="text" value={formData.name_ar} onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                  className="h-9 w-full rounded-lg border border-border bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">التصنيف</label>
                  <select value={formData.kind} onChange={(e) => setFormData({ ...formData, kind: e.target.value })}
                    className="h-9 w-full rounded-lg border border-border bg-white px-3 text-sm">
                    <option value="header">رئيسي</option>
                    <option value="group">مجموعة</option>
                    <option value="posting">نهائي</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">التدفق النقدي</label>
                  <select value={formData.cash_flow} onChange={(e) => setFormData({ ...formData, cash_flow: e.target.value })}
                    className="h-9 w-full rounded-lg border border-border bg-white px-3 text-sm">
                    <option value="none">بدون</option>
                    <option value="operating">تشغيلي</option>
                    <option value="investing">استثماري</option>
                    <option value="financing">تمويلي</option>
                    <option value="cash">نقدي</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">الحالة</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="h-9 w-full rounded-lg border border-border bg-white px-3 text-sm">
                    <option value="active">نشط</option>
                    <option value="inactive">غير نشط</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">الحساب الأب</label>
                  <select value={formData.parent} onChange={(e) => setFormData({ ...formData, parent: e.target.value })}
                    className="h-9 w-full rounded-lg border border-border bg-white px-3 text-sm">
                    <option value="">لا يوجد (أصل)</option>
                    {accounts.filter((a) => a.id !== editAccount?.id).map((a) => (
                      <option key={a.id} value={a.id}>{a.number} - {a.name_ar}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={formData.payment_enabled} onChange={(e) => setFormData({ ...formData, payment_enabled: e.target.checked })} className="rounded" />
                  تفعيل عمليات الدفع
                </label>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">إظهار في مطالبات المصروفات</label>
                <select value={formData.expense_claim_category} onChange={(e) => setFormData({ ...formData, expense_claim_category: e.target.value })}
                  className="h-9 w-full rounded-lg border border-border bg-white px-3 text-sm">
                  <option value="">بدون</option>
                  {Object.entries(EXPENSE_CATEGORY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">ملاحظات</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm h-20 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20" />
              </div>
            </div>
            <div className="flex items-center justify-between p-5 border-t">
              <Button variant="outline" onClick={() => setModalOpen(false)}>إلغاء</Button>
              <Button onClick={saveAccount} disabled={saving || !formData.number.trim() || !formData.name_ar.trim()}>
                {saving ? "جارٍ الحفظ..." : editAccount ? "حفظ التعديلات" : "إضافة الحساب"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setDeleteTarget(null); setDeleteError(""); }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 mx-auto mb-3">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold mb-1">حذف الحساب</h3>
              <p className="text-sm text-muted mb-1">هل أنت متأكد من حذف الحساب</p>
              <p className="text-sm font-bold">{deleteTarget.number} - {deleteTarget.name_ar}؟</p>
              <p className="text-xs text-muted mt-2">هذا الإجراء لا يمكن التراجع عنه.</p>
              {deleteError && <p className="text-sm text-red-600 mt-2">{deleteError}</p>}
            </div>
            <div className="flex items-center justify-center gap-3 p-5 border-t">
              <Button variant="outline" onClick={() => { setDeleteTarget(null); setDeleteError(""); }}>إلغاء</Button>
              <Button onClick={confirmDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white">
                {deleting ? "جارٍ الحذف..." : "تأكيد الحذف"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
