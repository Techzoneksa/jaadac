import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { PermissionGate } from "@/components/PermissionGate";
import { useStore } from "@/lib/store";
import { getAdapter, DATA_MODE } from "@/lib/adapters";
import { FutureBackendDataAdapter, PREVIEW_ENTITIES, type PreviewEntity, WRITE_RPC_METADATA, type WriteRpcKey } from "@/lib/adapters/FutureBackendDataAdapter";
import { SettingsService } from "@/lib/services";
import { useAudit } from "@/hooks/useAudit";
import { Button } from "@/components/ui/button";
import { Download, Database, Server, RefreshCw, PlugZap, AlertCircle, Cloud, ShieldCheck, Eye, Lock, Activity } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { BackendAuthSandbox } from "@/components/backend/BackendAuthSandbox";

export const Route = createFileRoute("/system-data-mode")({
  head: () => ({ meta: [{ title: "System Data Mode — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perm="settings.manage" mode="page">
      <SystemDataModePage />
    </PermissionGate>
  ),
});

function SystemDataModePage() {
  const { t, lang } = useI18n();
  const { user, tenant, session } = useAuth();
  const state = useStore((s) => s);
  const audit = useAudit();
  const adapter = getAdapter();
  const status = adapter.status;

  const counts: { key: string; label: { ar: string; en: string }; n: number }[] = [
    { key: "customers", label: { ar: "العملاء", en: "Customers" }, n: state.customers.length },
    { key: "suppliers", label: { ar: "الموردين", en: "Suppliers" }, n: state.suppliers.length },
    { key: "items", label: { ar: "المنتجات والخدمات", en: "Items" }, n: state.items.length },
    { key: "quotations", label: { ar: "عروض الأسعار", en: "Quotations" }, n: state.quotations.length },
    { key: "invoices", label: { ar: "الفواتير", en: "Invoices" }, n: state.invoices.length },
    { key: "receipts", label: { ar: "سندات القبض", en: "Receipts" }, n: state.receipts.length },
    { key: "payments", label: { ar: "سندات الصرف", en: "Payments" }, n: state.payments.length },
    { key: "accounts", label: { ar: "الحسابات", en: "Accounts" }, n: state.accounts.length },
    { key: "journal", label: { ar: "القيود", en: "Journal Entries" }, n: state.journal.length },
    { key: "tasks", label: { ar: "المهام", en: "Tasks" }, n: state.tasks.length },
    { key: "users", label: { ar: "المستخدمون", en: "Users" }, n: state.users.length },
    { key: "audit_log", label: { ar: "سجل المراجعة", en: "Audit Log" }, n: state.audit_log.length },
    { key: "document_templates", label: { ar: "نماذج المستندات", en: "Document Templates" }, n: state.document_templates.length },
    { key: "custom_fields", label: { ar: "الحقول المخصصة", en: "Custom Fields" }, n: state.custom_fields.length },
    { key: "branches", label: { ar: "الفروع", en: "Branches" }, n: state.branches.length },
    { key: "employees", label: { ar: "الموظفون", en: "Employees" }, n: state.employees.length },
    { key: "payroll_runs", label: { ar: "تشغيل الرواتب", en: "Payroll Runs" }, n: state.payroll_runs.length },
    { key: "expense_claims", label: { ar: "مطالبات المصروفات", en: "Expense Claims" }, n: state.expense_claims.length },
    { key: "announcements", label: { ar: "الإعلانات", en: "Announcements" }, n: state.announcements.length },
    { key: "internal_notes", label: { ar: "ملاحظات داخلية", en: "Internal Notes" }, n: state.internal_notes.length },
    { key: "message_templates", label: { ar: "قوالب الرسائل", en: "Message Templates" }, n: state.message_templates.length },
  ];

  const downloadSnapshot = () => {
    const snap = adapter.exportSnapshot();
    const blob = new Blob([JSON.stringify(snap, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jaad-cloud-snapshot-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    audit.log("system.snapshot_exported", "system",
      "تصدير لقطة بيانات الديمو", "Exported demo data snapshot");
    toast.success(lang === "ar" ? "تم التصدير" : "Snapshot exported");
  };

  const resetDemo = () => {
    if (!confirm(t("reset_demo_confirm"))) return;
    SettingsService.resetDemo(session?.user_id);
    audit.log("settings.demo_reset", "settings",
      "إعادة تعيين البيانات التجريبية", "Demo data reset");
    toast.success(t("saved"));
    setTimeout(() => window.location.reload(), 300);
  };

  return (
    <AppShell title={lang === "ar" ? "وضع البيانات للنظام" : "System Data Mode"}>
      <div className="max-w-4xl space-y-6">
        <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm flex gap-3">
          <AlertCircle className="size-5 text-warning shrink-0 mt-0.5" />
          <p>
            {lang === "ar"
              ? "هذه الصفحة مخصصة لتجهيز الانتقال لاحقًا من بيانات الديمو إلى قاعدة بيانات حقيقية. لم يتم ربط الباك اند بعد."
              : "This page prepares the future migration from demo data to a real database. Backend is not connected yet."}
          </p>
        </div>

        <div className="card-elevated p-5 space-y-3">
          <h2 className="font-semibold flex items-center gap-2"><Database className="size-4" />{lang === "ar" ? "وضع البيانات الحالي" : "Current Data Mode"}</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <Row k={lang === "ar" ? "الوضع" : "Mode"} v={DATA_MODE === "demo" ? (lang === "ar" ? "تجريبي — LocalStorage" : "Demo — LocalStorage") : "Backend"} />
            <Row k={lang === "ar" ? "المحوّل النشط" : "Active adapter"} v={status.name} />
            <Row k={lang === "ar" ? "حالة الباك اند" : "Backend status"} v={status.mode === "backend" && status.connected ? (lang === "ar" ? "متصل" : "Connected") : (lang === "ar" ? "غير متصل" : "Not connected")} />
            <Row k={lang === "ar" ? "مفتاح التخزين" : "Storage key"} v={status.storageKey || "—"} />
            <Row k={lang === "ar" ? "إصدار البذرة" : "Seed version"} v={status.version} />
            <Row k={lang === "ar" ? "آخر إعادة تعيين" : "Last reset"} v={status.lastResetAt ? new Date(status.lastResetAt).toLocaleString("en-US") : "—"} />
            <Row k={lang === "ar" ? "أعاد التعيين" : "Reset by"} v={status.resetBy ? (state.users.find((u) => u.id === status.resetBy)?.name || status.resetBy) : "—"} />
            <Row k={lang === "ar" ? "المؤسسة" : "Tenant"} v={tenant ? (lang === "ar" ? tenant.name_ar : tenant.name_en) : "—"} />
            <Row k={lang === "ar" ? "المستخدم" : "User"} v={user?.name || "—"} />
            <Row k={lang === "ar" ? "نقاء المحوّل" : "Adapter purity"} v={lang === "ar" ? "كتابات الواجهة تمرّ عبر الخدمات" : "UI writes routed through services"} />
          </dl>
        </div>

        <SupabaseConfigPanel />
        <AuthBootstrapPanel />
        {session?.role === "owner" && <BackendAuthSandbox />}
        <BackendAdapterReadinessPanel />
        <BackendDryRunPanel />
        {session?.role === "owner" && <BackendReadOnlyPreviewPanel />}
        <BackendWriteReadinessPanel />
        <div className="rounded-lg border border-info/30 bg-info/5 p-4 text-sm space-y-1">
          <div className="font-semibold flex items-center gap-2">
            <Cloud className="size-4" />
            {lang === "ar" ? "دليل تفعيل Supabase (Phase 2.1.3)" : "Supabase Activation Runbook (Phase 2.1.3)"}
          </div>
          <p className="text-muted-foreground text-xs">
            {lang === "ar"
              ? "تفعيل الباك اند لم يكتمل بعد. الوضع الافتراضي تجريبي والكتابة معطّلة. راجع docs/supabase-activation-runbook.md لخطوات التفعيل الآمنة (Lovable Cloud أو مشروع Supabase موجود)."
              : "Backend activation is not complete yet. Demo mode remains default and writes remain disabled. See docs/supabase-activation-runbook.md for safe activation steps (Lovable Cloud or existing Supabase project)."}
          </p>
        </div>




        <div className="card-elevated p-5">
          <h2 className="font-semibold mb-3">{lang === "ar" ? "عدد السجلات" : "Record counts"}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {counts.map((c) => (
              <div key={c.key} className="rounded-md border p-3 text-center">
                <div className="text-xs text-muted-foreground">{lang === "ar" ? c.label.ar : c.label.en}</div>
                <div className="text-2xl font-semibold mt-1">{c.n}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-elevated p-5 space-y-3">
          <h2 className="font-semibold">{lang === "ar" ? "الإجراءات" : "Actions"}</h2>
          <div className="flex flex-wrap gap-2">
            <Button onClick={downloadSnapshot}>
              <Download className="size-4 me-1" />{lang === "ar" ? "تصدير لقطة البيانات" : "Export Demo Data Snapshot"}
            </Button>
            <Button variant="outline" onClick={resetDemo}>
              <RefreshCw className="size-4 me-1" />{t("reset_demo")}
            </Button>
            <Button variant="outline" disabled title={lang === "ar" ? "غير متاح حتى يتم ربط الباك اند" : "Unavailable until backend is connected"}>
              <Server className="size-4 me-1" />{lang === "ar" ? "التبديل إلى وضع الباك اند" : "Switch to Backend Mode"}
            </Button>
            <Button variant="outline" disabled>
              <PlugZap className="size-4 me-1" />{lang === "ar" ? "اختبار الاتصال بالباك اند" : "Test Backend Connection"}
            </Button>
            <Button variant="outline" disabled>
              {lang === "ar" ? "تشغيل الترحيل" : "Run Migration"}
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 border-b py-1.5">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-medium text-end">{v}</dd>
    </div>
  );
}

function SupabaseConfigPanel() {
  const { lang } = useI18n();
  const [adapter] = useState(() => new FutureBackendDataAdapter());
  const cfg = adapter.configStatus();
  const status = adapter.status;
  const [busy, setBusy] = useState(false);

  const check = async () => {
    setBusy(true);
    try {
      const h = await adapter.health();
      const msg = lang === "ar" ? h.message.ar : h.message.en;
      (h.ok ? toast.success : toast.message)(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card-elevated p-5 space-y-3">
      <h2 className="font-semibold flex items-center gap-2">
        <Cloud className="size-4" />
        {lang === "ar" ? "إعدادات Supabase (الباك اند)" : "Supabase Configuration (Backend)"}
      </h2>
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <Row k={lang === "ar" ? "رابط Supabase مُهيّأ" : "Supabase URL configured"} v={cfg.urlConfigured ? (lang === "ar" ? "نعم" : "Yes") : (lang === "ar" ? "لا" : "No")} />
        <Row k={lang === "ar" ? "مفتاح Anon مُهيّأ" : "Anon key configured"} v={cfg.anonKeyConfigured ? (lang === "ar" ? "نعم" : "Yes") : (lang === "ar" ? "لا" : "No")} />
        <Row k={lang === "ar" ? "حزمة @supabase/supabase-js مثبتة" : "@supabase/supabase-js installed"} v={lang === "ar" ? "نعم" : "Yes"} />
        <Row k={lang === "ar" ? "ملفات الترحيل مكتشفة" : "Migration files detected"} v={lang === "ar" ? "نعم" : "Yes"} />
        <Row k={lang === "ar" ? "عدد ملفات الترحيل القابلة للتشغيل" : "Runnable migration count"} v="7" />
        <Row k={lang === "ar" ? "عدد الترحيلات المخطّطة (توثيق)" : "Planned migrations count (docs)"} v="7" />
        <Row k={lang === "ar" ? "ترحيل تجهيز المؤسسة" : "Bootstrap migration detected"} v={lang === "ar" ? "نعم (20260611120004)" : "Yes (20260611120004)"} />
        <Row k={lang === "ar" ? "حالة محوّل الباك اند" : "Backend adapter status"} v={`${status.name} · ${status.version}`} />
        <Row k={lang === "ar" ? "وضع البيانات" : "DATA_MODE"} v={DATA_MODE === "demo" ? (lang === "ar" ? "تجريبي — LocalStorage" : "demo — LocalStorage") : "backend"} />
        <Row k={lang === "ar" ? "المحوّل النشط" : "Active adapter"} v="LocalStorageDataAdapter" />
        <Row k={lang === "ar" ? "الباك اند مُفعّل" : "Backend active"} v={lang === "ar" ? "لا" : "No"} />
      </dl>
      <p className="text-xs text-muted-foreground">
        {lang === "ar" ? cfg.message.ar : cfg.message.en}
      </p>
      <div>
        <Button variant="outline" onClick={check} disabled={busy}>
          <PlugZap className="size-4 me-1" />
          {lang === "ar" ? "فحص إعدادات الباك اند" : "Check Backend Configuration"}
        </Button>
      </div>
    </div>
  );
}

function AuthBootstrapPanel() {
  const { lang } = useI18n();
  const [adapter] = useState(() => new FutureBackendDataAdapter());
  const cfg = adapter.configStatus();
  const ready = adapter.bootstrapReadiness();
  const [busy, setBusy] = useState(false);
  const [snap, setSnap] = useState<{ hasSession: boolean; userId: string | null; activeTenantId: string | null } | null>(null);

  const checkAuth = async () => {
    setBusy(true);
    try {
      const s = await adapter.sessionSnapshot();
      setSnap(s);
      toast.message(
        lang === "ar"
          ? `حالة المصادقة: ${cfg.configured ? "Supabase مُهيّأ" : "غير مُهيّأ"} — جلسة: ${s.hasSession ? "نشطة" : "لا توجد"}`
          : `Auth: ${cfg.configured ? "Supabase configured" : "Not configured"} — Session: ${s.hasSession ? "active" : "none"}`
      );
    } finally {
      setBusy(false);
    }
  };

  const checkBootstrap = () => {
    toast.message(lang === "ar" ? ready.message.ar : ready.message.en);
  };

  return (
    <div className="card-elevated p-5 space-y-3">
      <h2 className="font-semibold flex items-center gap-2">
        <ShieldCheck className="size-4" />
        {lang === "ar" ? "المصادقة وتجهيز المؤسسة" : "Auth & Tenant Bootstrap"}
      </h2>
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <Row k={lang === "ar" ? "إعدادات Supabase" : "Supabase env configured"} v={cfg.configured ? (lang === "ar" ? "نعم" : "Yes") : (lang === "ar" ? "لا" : "No")} />
        <Row k={lang === "ar" ? "عميل Supabase متاح" : "Supabase client available"} v={cfg.configured ? (lang === "ar" ? "نعم" : "Yes") : (lang === "ar" ? "لا" : "No")} />
        <Row k={lang === "ar" ? "وضع المصادقة" : "Auth mode"} v={lang === "ar" ? "مصادقة تجريبية (Mock)" : "Demo Mock Auth"} />
        <Row k={lang === "ar" ? "مصادقة الباك اند نشطة" : "Backend auth active"} v={lang === "ar" ? "لا" : "No"} />
        <Row k={lang === "ar" ? "خدمة تجهيز المؤسسة جاهزة" : "Tenant bootstrap ready"} v={ready.backendConfigured ? (lang === "ar" ? "نعم" : "Yes") : (lang === "ar" ? "مُعدّة لكن غير نشطة" : "Prepared (inactive)")} />
        <Row k="active_tenant_id" v={lang === "ar" ? "موثّقة (JWT app_metadata)" : "Documented (JWT app_metadata)"} />
        <Row k={lang === "ar" ? "RPC تجهيز المؤسسة (مخطط)" : "Bootstrap RPC planned"} v={lang === "ar" ? "نعم" : "Yes"} />
        <Row k={lang === "ar" ? "RPC تجهيز المؤسسة (ترحيل قابل للتشغيل)" : "Bootstrap RPC runnable migration"} v={lang === "ar" ? "نعم (004)" : "Yes (004)"} />
        <Row k={lang === "ar" ? "RPC المتوقّع" : "Expected RPC"} v={ready.rpcExpected} />
        <Row k={lang === "ar" ? "جلسة Supabase حالية" : "Current Supabase session"} v={snap ? (snap.hasSession ? (lang === "ar" ? "نشطة" : "Active") : (lang === "ar" ? "لا توجد" : "None")) : "—"} />
      </dl>
      <p className="text-xs text-muted-foreground">
        {lang === "ar"
          ? "هذه الأزرار للقراءة فقط ولا تُغيّر وضع البيانات ولا تكتب بيانات إنتاج."
          : "These buttons are read-only — they never switch modes or write production data."}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={checkAuth} disabled={busy}>
          <ShieldCheck className="size-4 me-1" />
          {lang === "ar" ? "فحص إعدادات المصادقة" : "Check Auth Configuration"}
        </Button>
        <Button variant="outline" onClick={checkBootstrap}>
          <PlugZap className="size-4 me-1" />
          {lang === "ar" ? "فحص جاهزية تجهيز المؤسسة" : "Check Tenant Bootstrap Readiness"}
        </Button>
      </div>
    </div>
  );
}

function BackendAdapterReadinessPanel() {
  const { lang } = useI18n();
  const [adapter] = useState(() => new FutureBackendDataAdapter());
  const cfg = adapter.configStatus();
  const [busy, setBusy] = useState(false);
  const [clientAvail, setClientAvail] = useState<boolean | null>(null);
  const [snap, setSnap] = useState<{ hasSession: boolean; activeTenantId: string | null } | null>(null);
  const [report, setReport] = useState<{ runAt: string; okCount: number; failCount: number; checks: { name: string; ok: boolean; message: { ar: string; en: string } }[] } | null>(null);

  const refresh = async () => {
    setBusy(true);
    try {
      const [avail, s] = await Promise.all([adapter.clientAvailable(), adapter.sessionSnapshot()]);
      setClientAvail(avail);
      setSnap({ hasSession: s.hasSession, activeTenantId: s.activeTenantId });
    } finally {
      setBusy(false);
    }
  };

  const runChecks = async () => {
    setBusy(true);
    try {
      const r = await adapter.runSmokeChecks();
      setReport(r);
      const msg = lang === "ar"
        ? `الفحوصات: ${r.okCount} ناجحة / ${r.failCount} فاشلة`
        : `Checks: ${r.okCount} passed / ${r.failCount} failed`;
      toast.message(msg);
    } finally {
      setBusy(false);
    }
  };

  const yes = lang === "ar" ? "نعم" : "Yes";
  const no = lang === "ar" ? "لا" : "No";

  return (
    <div className="card-elevated p-5 space-y-3">
      <h2 className="font-semibold flex items-center gap-2">
        <Server className="size-4" />
        {lang === "ar" ? "جاهزية محوّل الباك اند" : "Backend Adapter Readiness"}
      </h2>
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <Row k={lang === "ar" ? "FutureBackendDataAdapter موجود" : "FutureBackendDataAdapter exists"} v={yes} />
        <Row k={lang === "ar" ? "إعدادات Supabase صالحة" : "Supabase config valid"} v={cfg.configured ? yes : no} />
        <Row k={lang === "ar" ? "عميل Supabase متاح" : "Supabase client available"} v={clientAvail === null ? "—" : clientAvail ? yes : no} />
        <Row k={lang === "ar" ? "جلسة حالية" : "Current session detected"} v={snap ? (snap.hasSession ? yes : no) : "—"} />
        <Row k={lang === "ar" ? "مؤسسة نشطة" : "Active tenant detected"} v={snap ? (snap.activeTenantId ? yes : no) : "—"} />
        <Row k={lang === "ar" ? "وضع الباك اند نشط" : "Backend mode active"} v={no} />
        <Row k={lang === "ar" ? "فحوصات القراءة متاحة" : "Read-only smoke checks available"} v={yes} />
        <Row k={lang === "ar" ? "آخر فحص" : "Last readiness check"} v={report ? `${report.okCount}/${report.okCount + report.failCount} @ ${new Date(report.runAt).toLocaleTimeString("en-US")}` : "—"} />
      </dl>
      <p className="text-xs text-muted-foreground">
        {lang === "ar"
          ? "هذه الفحوصات للقراءة فقط — لا تُبدّل الوضع ولا تكتب بيانات ولا تنشئ مستخدمين أو مؤسسات."
          : "Read-only checks — they never switch data mode, write data, or create users/tenants."}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={refresh} disabled={busy}>
          <RefreshCw className="size-4 me-1" />
          {lang === "ar" ? "تحديث الحالة" : "Refresh Status"}
        </Button>
        <Button variant="outline" onClick={runChecks} disabled={busy}>
          <PlugZap className="size-4 me-1" />
          {lang === "ar" ? "تشغيل فحوصات قراءة الباك اند" : "Run Read-Only Backend Checks"}
        </Button>
      </div>
      {report && (
        <ul className="mt-2 divide-y rounded-md border text-sm">
          {report.checks.map((c) => (
            <li key={c.name} className="flex justify-between gap-3 px-3 py-2">
              <span className="font-mono text-xs text-muted-foreground">{c.name}</span>
              <span className={c.ok ? "text-success" : "text-destructive"}>
                {lang === "ar" ? c.message.ar : c.message.en}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BackendReadOnlyPreviewPanel() {
  const { lang } = useI18n();
  const [adapter] = useState(() => new FutureBackendDataAdapter());
  const cfg = adapter.configStatus();
  const [entity, setEntity] = useState<PreviewEntity>("customers");
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Record<string, unknown>[] | null>(null);
  const [err, setErr] = useState<{ ar: string; en: string } | null>(null);
  const [total, setTotal] = useState<number>(0);

  const labelOf = (e: PreviewEntity): string => {
    const m: Record<PreviewEntity, { ar: string; en: string }> = {
      customers: { ar: "العملاء", en: "Customers" },
      suppliers: { ar: "الموردين", en: "Suppliers" },
      items: { ar: "المنتجات والخدمات", en: "Items" },
      invoices: { ar: "الفواتير", en: "Invoices" },
      quotations: { ar: "عروض الأسعار", en: "Quotations" },
      accounts: { ar: "شجرة الحسابات", en: "Chart of Accounts" },
      audit_logs: { ar: "سجل المراجعة", en: "Audit Logs" },
    };
    return lang === "ar" ? m[e].ar : m[e].en;
  };

  const run = async () => {
    setBusy(true);
    setErr(null);
    setRows(null);
    try {
      const r = await adapter.previewEntity(entity, { pageSize: 10 });
      if (!r.ok) {
        setErr(r.error!.message);
        return;
      }
      setRows((r.data!.items as Record<string, unknown>[]) ?? []);
      setTotal(r.data!.total ?? 0);
    } finally {
      setBusy(false);
    }
  };

  const cols = rows && rows[0] ? Object.keys(rows[0]).slice(0, 5) : [];

  return (
    <div className="card-elevated p-5 space-y-3">
      <h2 className="font-semibold flex items-center gap-2">
        <Eye className="size-4" />
        {lang === "ar" ? "معاينة قراءة الباك اند (Owner فقط)" : "Backend Read-Only Preview (Owner)"}
      </h2>
      <p className="text-xs text-muted-foreground">
        {lang === "ar"
          ? "هذه المعاينة للقراءة فقط من Supabase. لا تكتب بيانات، لا تبدّل وضع البيانات، ولا تؤثر على بيانات الديمو."
          : "Read-only Supabase preview. Never writes, never switches data mode, never touches demo data."}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="border rounded-md px-2 py-1.5 text-sm bg-background"
          value={entity}
          onChange={(e) => setEntity(e.target.value as PreviewEntity)}
        >
          {PREVIEW_ENTITIES.map((e) => (
            <option key={e} value={e}>{labelOf(e)}</option>
          ))}
        </select>
        <Button variant="outline" onClick={run} disabled={busy || !cfg.configured}>
          <Eye className="size-4 me-1" />
          {lang === "ar" ? "معاينة بيانات الباك اند" : "Preview Backend Data"}
        </Button>
        {!cfg.configured && (
          <span className="text-xs text-muted-foreground">
            {lang === "ar" ? "(الباك اند غير مُهيّأ)" : "(backend not configured)"}
          </span>
        )}
      </div>
      {err && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 text-destructive text-sm p-3">
          {lang === "ar" ? err.ar : err.en}
        </div>
      )}
      {rows && rows.length === 0 && !err && (
        <div className="rounded-md border bg-muted/30 text-sm p-3">
          {lang === "ar" ? "لا توجد سجلات." : "No records."}
        </div>
      )}
      {rows && rows.length > 0 && (
        <div className="overflow-auto rounded-md border">
          <table className="w-full text-xs">
            <thead className="bg-muted/40">
              <tr>
                {cols.map((c) => (
                  <th key={c} className="text-start font-medium px-2 py-1.5">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t">
                  {cols.map((c) => (
                    <td key={c} className="px-2 py-1.5 font-mono truncate max-w-[12rem]">
                      {fmtCell((r as Record<string, unknown>)[c])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-[11px] text-muted-foreground px-2 py-1 border-t">
            {lang === "ar" ? `إجمالي: ${total}` : `Total: ${total}`}
          </div>
        </div>
      )}
    </div>
  );
}

function fmtCell(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}



function BackendWriteReadinessPanel() {
  const { lang } = useI18n();
  const [adapter] = useState(() => new FutureBackendDataAdapter());
  const cfg = adapter.configStatus();
  const meta = adapter.getWriteRpcReadinessMetadata();
  const [busy, setBusy] = useState(false);
  const [rpcReport, setRpcReport] = useState<any>(null);
  const [acctReport, setAcctReport] = useState<any>(null);
  const [numReport, setNumReport] = useState<any>(null);
  const [err, setErr] = useState<{ ar: string; en: string } | null>(null);

  const yes = lang === "ar" ? "نعم" : "Yes";
  const no  = lang === "ar" ? "لا"  : "No";
  const dash = "—";

  const runChecks = async () => {
    setBusy(true); setErr(null);
    try {
      const [w, a, n] = await Promise.all([
        adapter.getWriteRpcReadiness(),
        adapter.getAccountPurposeReadiness(),
        adapter.getNumberingReadiness(),
      ]);
      if (!w.ok && !a.ok && !n.ok) setErr(w.error!.message);
      setRpcReport(w.ok ? w.data : { error: w.error });
      setAcctReport(a.ok ? a.data : { error: a.error });
      setNumReport(n.ok ? n.data : { error: n.error });
      toast.message(lang === "ar"
        ? "تم تشغيل فحوصات جاهزية الكتابة (قراءة فقط)."
        : "Write readiness checks executed (read-only).");
    } finally { setBusy(false); }
  };

  const mappedCount = acctReport?.mapped?.length ?? null;
  const missingCount = acctReport?.missing?.length ?? null;
  const fallbackCount = acctReport?.fallback?.length ?? null;

  return (
    <div className="card-elevated p-5 space-y-3">
      <h2 className="font-semibold flex items-center gap-2">
        <Lock className="size-4" />
        {lang === "ar" ? "جاهزية كتابة الباك اند" : "Backend Write Readiness"}
      </h2>
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <Row k={lang === "ar" ? "كتابة الباك اند مُفعّلة" : "Backend writes enabled"} v={meta.writesEnabled ? yes : no} />
        <Row k={lang === "ar" ? "السماح بتنفيذ الكتابة" : "Write execution allowed"} v={no} />
        <Row k={lang === "ar" ? "ترحيل دوال الكتابة" : "Write RPC migration"} v={lang === "ar" ? "نعم (20260611120005)" : "Yes (20260611120005)"} />
        <Row k={lang === "ar" ? "ترحيل تقوية الكتابة" : "RPC hardening migration"} v={lang === "ar" ? "نعم (20260611120006)" : "Yes (20260611120006)"} />
        <Row k={lang === "ar" ? "ترحيل ربط أغراض الحسابات" : "Account purpose mapping migration"} v={lang === "ar" ? "نعم (20260611120007)" : "Yes (20260611120007)"} />
        <Row k={lang === "ar" ? "جدول ربط الأغراض" : "Mapping table"} v={meta.mappingTable} />
        <Row k={lang === "ar" ? "الأغراض المطلوبة" : "Required purposes"} v={String(meta.requiredAccountPurposes.length)} />
        <Row k={lang === "ar" ? "أغراض مرتبطة" : "Mapped purposes"} v={mappedCount === null ? dash : String(mappedCount)} />
        <Row k={lang === "ar" ? "أغراض تستخدم الرمز الافتراضي" : "Purposes using canonical fallback"} v={fallbackCount === null ? dash : String(fallbackCount)} />
        <Row k={lang === "ar" ? "أغراض مفقودة" : "Missing purposes"} v={missingCount === null ? dash : String(missingCount)} />
        <Row k={lang === "ar" ? "استراتيجية البحث عن الحساب" : "Account lookup strategy"} v={lang === "ar" ? "ربط أولًا ثم رمز افتراضي" : "Mapping-first → canonical fallback"} />
        <Row k={lang === "ar" ? "استراتيجية الترقيم" : "Numbering strategy"} v={lang === "ar" ? "جدول عدّاد مقفل لكل مؤسسة" : "Tenant-scoped locked counter"} />
        <Row k={lang === "ar" ? "ترقيم الإعدادات موجود" : "settings_numbering row"} v={numReport?.has_settings_row === undefined ? dash : (numReport.has_settings_row ? yes : no)} />
        <Row k={lang === "ar" ? "RPCs الكتابة متاحة" : "Write RPCs available"} v={rpcReport?.rpcs ? `${(rpcReport.rpcs as any[]).filter((r:any)=>r.available).length}/${(rpcReport.rpcs as any[]).length}` : dash} />
        <Row k={lang === "ar" ? "عقد الأخطاء موحّد" : "Error contract standardized"} v={yes} />
      </dl>
      <p className="text-xs text-muted-foreground">
        {lang === "ar"
          ? "زر الفحوصات للقراءة فقط — لا يستدعي أي دالة كتابة، ولا يبدّل وضع البيانات."
          : "The check button is read-only — it never invokes a write RPC and never switches data mode."}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={runChecks} disabled={busy || !cfg.configured}>
          <ShieldCheck className="size-4 me-1" />
          {lang === "ar" ? "تشغيل فحوصات جاهزية الكتابة" : "Run Write Readiness Checks"}
        </Button>
        {!cfg.configured && (
          <span className="text-xs text-muted-foreground self-center">
            {lang === "ar" ? "(الباك اند غير مُهيّأ — الفحوصات معطّلة بأمان)" : "(backend not configured — checks safely disabled)"}
          </span>
        )}
      </div>
      {err && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 text-destructive text-sm p-3">
          {lang === "ar" ? err.ar : err.en}
        </div>
      )}
      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-start font-medium px-3 py-2">{lang === "ar" ? "طريقة المحوّل" : "Adapter method"}</th>
              <th className="text-start font-medium px-3 py-2">RPC</th>
              <th className="text-start font-medium px-3 py-2">{lang === "ar" ? "الأدوار" : "Roles"}</th>
              <th className="text-start font-medium px-3 py-2">{lang === "ar" ? "الترقيم" : "Numbering"}</th>
              <th className="text-start font-medium px-3 py-2">{lang === "ar" ? "الحسابات" : "Accounts"}</th>
              <th className="text-start font-medium px-3 py-2">{lang === "ar" ? "الحالة" : "Status"}</th>
            </tr>
          </thead>
          <tbody>
            {(Object.keys(WRITE_RPC_METADATA) as WriteRpcKey[]).map((k) => {
              const m = WRITE_RPC_METADATA[k];
              return (
                <tr key={k} className="border-t">
                  <td className="px-3 py-2 font-mono">{k}</td>
                  <td className="px-3 py-2 font-mono">{m.rpcName}</td>
                  <td className="px-3 py-2">{m.requiredRoles.join(", ")}</td>
                  <td className="px-3 py-2">{m.numberingStrategy}</td>
                  <td className="px-3 py-2">{m.accountLookupStrategy}</td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5">
                      {lang === "ar" ? "معطّلة" : "disabled"} · {m.safetyStatus}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {acctReport?.checks && (
        <div className="rounded-md border overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-start font-medium px-3 py-2">{lang === "ar" ? "الغرض" : "Purpose"}</th>
                <th className="text-start font-medium px-3 py-2">{lang === "ar" ? "الحالة" : "Status"}</th>
              </tr>
            </thead>
            <tbody>
              {(acctReport.checks as any[]).map((c: any) => (
                <tr key={c.purpose} className="border-t">
                  <td className="px-3 py-2 font-mono">{c.purpose}</td>
                  <td className="px-3 py-2">
                    <span className={
                      c.status === "mapped" ? "text-success"
                      : c.status === "fallback" ? "text-warning"
                      : "text-destructive"
                    }>{c.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function BackendDryRunPanel() {
  const { lang } = useI18n();
  const [adapter] = useState(() => new FutureBackendDataAdapter());
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<import("@/lib/supabase/dry-run").DryRunReport | null>(null);

  const overallLabel = (s: string): { ar: string; en: string } => ({
    ready: { ar: "جاهز", en: "Ready" },
    needs_configuration: { ar: "يحتاج إعداد", en: "Needs configuration" },
    needs_migration: { ar: "يحتاج ترحيلات", en: "Needs migration" },
    rls_issue: { ar: "مشكلة صلاحيات/RLS", en: "Permission/RLS issue" },
    skipped_not_configured: { ar: "تم التخطي — الباك اند غير مُهيّأ", en: "Skipped — backend not configured" },
  }[s] ?? { ar: s, en: s });

  const statusColor = (s: string) =>
    s === "pass" ? "text-success"
    : s === "warn" ? "text-warning"
    : s === "fail" ? "text-destructive"
    : "text-muted-foreground";

  const run = async () => {
    setBusy(true);
    try {
      const r = await adapter.runBackendDryRun();
      if (r.ok) {
        setReport(r.data!);
        toast.message(lang === "ar"
          ? `الفحص الجاف: ${r.data!.passCount} ناجح / ${r.data!.failCount} فاشل / ${r.data!.warnCount} تحذير / ${r.data!.skippedCount} متخطّى`
          : `Dry run: ${r.data!.passCount} pass / ${r.data!.failCount} fail / ${r.data!.warnCount} warn / ${r.data!.skippedCount} skipped`);
      } else {
        toast.error(lang === "ar" ? r.error!.message.ar : r.error!.message.en);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card-elevated p-5 space-y-3">
      <h2 className="font-semibold flex items-center gap-2">
        <Activity className="size-4" />
        {lang === "ar" ? "تقرير الفحص الجاف للباك اند (Phase 2.1.2C — جاهز للتجهيز الأول)" : "Backend Dry Run Report (Phase 2.1.2C — Ready for First Bootstrap)"}
      </h2>
      <p className="text-xs text-muted-foreground">
        {lang === "ar"
          ? "Lovable Cloud مفعّل، المصادقة المُدارة جاهزة، والترحيلات السبعة مُطبَّقة. خطوة المالك التالية يدويًا: تسجيل دخول مستخدم باك اند حقيقي من BackendAuthSandbox أدناه ثم تنفيذ التجهيز الأوّل مرة واحدة. الكتابات في الواجهة لا تزال معطّلة (DATA_MODE=demo, BACKEND_WRITES_ENABLED=false)."
          : "Lovable Cloud is enabled, managed auth is ready, and all 7 migrations are applied. Operator next step (manual): sign in a real backend user from the BackendAuthSandbox below and run the first tenant bootstrap once. UI writes remain disabled (DATA_MODE=demo, BACKEND_WRITES_ENABLED=false)."}
      </p>


      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={run} disabled={busy}>
          <Activity className="size-4 me-1" />
          {lang === "ar" ? "تشغيل الفحص الجاف" : "Run Dry Run"}
        </Button>
        {report && (
          <span className="text-sm">
            {lang === "ar" ? "الحالة العامة:" : "Overall:"}{" "}
            <span className={
              report.overall === "ready" ? "text-success font-semibold"
              : report.overall === "skipped_not_configured" ? "text-muted-foreground font-semibold"
              : "text-warning font-semibold"
            }>
              {lang === "ar" ? overallLabel(report.overall).ar : overallLabel(report.overall).en}
            </span>
            <span className="text-xs text-muted-foreground ms-2">
              @ {new Date(report.runAt).toLocaleTimeString("en-US")}
            </span>
          </span>
        )}
      </div>
      {report && (
        <div className="rounded-md border overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-start font-medium px-3 py-2">{lang === "ar" ? "الفحص" : "Check"}</th>
                <th className="text-start font-medium px-3 py-2">{lang === "ar" ? "الحالة" : "Status"}</th>
                <th className="text-start font-medium px-3 py-2">{lang === "ar" ? "التفاصيل" : "Details"}</th>
                <th className="text-start font-medium px-3 py-2">{lang === "ar" ? "اقتراح الإصلاح" : "Fix"}</th>
                <th className="text-start font-medium px-3 py-2">{lang === "ar" ? "الوقت" : "At"}</th>
              </tr>
            </thead>
            <tbody>
              {report.checks.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-3 py-1.5 font-mono">{lang === "ar" ? c.label.ar : c.label.en}</td>
                  <td className={`px-3 py-1.5 font-semibold ${statusColor(c.status)}`}>{c.status}</td>
                  <td className="px-3 py-1.5">{c.details ? (lang === "ar" ? c.details.ar : c.details.en) : "—"}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">{c.fix ? (lang === "ar" ? c.fix.ar : c.fix.en) : "—"}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">{new Date(c.timestamp).toLocaleTimeString("en-US")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

