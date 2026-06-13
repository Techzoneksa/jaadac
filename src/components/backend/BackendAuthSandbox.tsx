/**
 * JAAD CLOUD — Phase 2.1.2B Backend Auth Sandbox (Owner-only, internal).
 *
 * Safe internal-only panel that lets the Owner sign in to the live Supabase
 * backend using email/password (or trigger Google OAuth if configured),
 * inspect the resulting session (without ever showing the JWT), trigger
 * `bootstrap_tenant_for_user` if needed, and re-run the read-only dry run.
 *
 * Hard constraints:
 *  - Does NOT change DATA_MODE.
 *  - Does NOT enable BACKEND_WRITES_ENABLED.
 *  - Does NOT replace the mock Owner demo auto-login.
 *  - Does NOT print or log the JWT / anon key / password.
 *  - Tenant bootstrap RPC is the ONLY write operation allowed.
 */
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  signInWithEmail,
  signOut as backendSignOut,
} from "@/lib/supabase/auth";
import { getSessionSnapshot, type SessionSnapshot } from "@/lib/supabase/session";
import { bootstrapTenantForCurrentUser } from "@/lib/supabase/tenant-bootstrap";
import { ShieldCheck, LogIn, LogOut, PlugZap, RefreshCw } from "lucide-react";
import { toast } from "sonner";

function maskId(id: string | null): string {
  if (!id) return "—";
  if (id.length <= 8) return "•".repeat(id.length);
  return `${id.slice(0, 4)}…${id.slice(-4)}`;
}

export function BackendAuthSandbox() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const cfg = isSupabaseConfigured();
  const [snap, setSnap] = useState<SessionSnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantNameAr, setTenantNameAr] = useState("شركة جاد كلاود التجريبية");
  const [tenantNameEn, setTenantNameEn] = useState("JAAD Demo Cloud Company");
  const [bootstrapMsg, setBootstrapMsg] = useState<string>("");

  const refresh = async () => {
    if (!cfg) return;
    const s = await getSessionSnapshot();
    setSnap(s);
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const doSignIn = async () => {
    if (!email || !password) {
      toast.message(ar ? "أدخل البريد وكلمة المرور." : "Enter email and password.");
      return;
    }
    setBusy(true);
    try {
      const r = await signInWithEmail(email, password);
      setPassword(""); // never keep password in memory after attempt
      if (!r.ok) {
        toast.error(ar ? r.error.ar : r.error.en);
      } else {
        toast.success(ar ? "تم تسجيل الدخول إلى الباك اند." : "Backend sign-in succeeded.");
        await refresh();
      }
    } finally { setBusy(false); }
  };

  const doSignOut = async () => {
    setBusy(true);
    try {
      const r = await backendSignOut();
      if (!r.ok) toast.error(ar ? r.error.ar : r.error.en);
      else toast.success(ar ? "تم تسجيل الخروج من الباك اند." : "Backend signed out.");
      await refresh();
    } finally { setBusy(false); }
  };

  const doBootstrap = async () => {
    setBusy(true);
    setBootstrapMsg("");
    try {
      const r = await bootstrapTenantForCurrentUser({
        tenant_name_ar: tenantNameAr,
        tenant_name_en: tenantNameEn,
        default_currency: "SAR",
        vat_rate: 0.15,
        locale: "ar",
      });
      const msg = ar ? r.message.ar : r.message.en;
      setBootstrapMsg(msg + (r.ok && r.tenant_id ? ` (tenant: ${maskId(r.tenant_id)})` : ""));
      (r.ok ? toast.success : toast.error)(msg);
      await refresh();
    } finally { setBusy(false); }
  };

  if (!cfg) {
    return (
      <div className="card-elevated p-5 space-y-2">
        <h2 className="font-semibold flex items-center gap-2">
          <ShieldCheck className="size-4" />
          {ar ? "صندوق مصادقة الباك اند (المالك فقط)" : "Backend Auth Sandbox (Owner only)"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {ar ? "الباك اند غير مُهيّأ." : "Backend not configured."}
        </p>
      </div>
    );
  }

  const hasSession = !!snap?.hasSession;

  return (
    <div className="card-elevated p-5 space-y-4">
      <div>
        <h2 className="font-semibold flex items-center gap-2">
          <ShieldCheck className="size-4" />
          {ar ? "صندوق مصادقة الباك اند — Phase 2.1.2B (المالك فقط)" : "Backend Auth Sandbox — Phase 2.1.2B (Owner only)"}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {ar
            ? "هذا الصندوق داخلي للتحقق فقط. لا يُغيّر وضع البيانات، ولا يفعّل الكتابة، ولا يستبدل مصادقة العرض التجريبي. JWT لا يُعرض أبدًا."
            : "Internal verification panel only. Does not change data mode, does not enable writes, and does not replace demo mock auth. JWT is never shown."}
        </p>
      </div>

      <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <Row k={ar ? "إعدادات Supabase" : "Supabase configured"} v={ar ? "نعم" : "Yes"} />
        <Row k={ar ? "جلسة الباك اند" : "Backend session"} v={hasSession ? (ar ? "نشطة" : "Active") : (ar ? "لا توجد" : "None")} />
        <Row k={ar ? "معرّف المستخدم" : "Backend user id"} v={hasSession ? maskId(snap!.userId) : "—"} />
        <Row k={ar ? "JWT" : "JWT"} v={hasSession ? (ar ? "موجود (لا يُعرض)" : "Present (hidden)") : "—"} />
        <Row k={ar ? "active_tenant_id (JWT claim)" : "active_tenant_id (JWT claim)"} v={snap?.activeTenantId ? maskId(snap.activeTenantId) : (ar ? "غير موجود" : "Not present")} />
        <Row k={ar ? "المؤسسة المختارة" : "Selected backend tenant"} v={snap?.selectedTenantId ? maskId(snap.selectedTenantId) : "—"} />
        <Row k={ar ? "استراتيجية المؤسسة" : "Active tenant strategy"} v={strategyLabel(snap?.tenantStrategy ?? "none", ar)} />
        <Row k={ar ? "كتابة الباك اند" : "Backend writes"} v={ar ? "معطّلة" : "Disabled"} />
      </dl>

      {!hasSession && (
        <div className="space-y-2 border-t pt-3">
          <h3 className="text-sm font-semibold">{ar ? "تسجيل دخول الباك اند" : "Backend sign-in"}</h3>
          <p className="text-[11px] text-muted-foreground">
            {ar
              ? "أنشئ مستخدمًا حقيقيًا أولًا عبر لوحة Cloud → Users. لا تُحفظ كلمة المرور في الكود."
              : "Create the real user first via Cloud → Users. Passwords are never stored in code."}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input
              className="border rounded-md px-2 py-1.5 text-sm bg-background"
              type="email" autoComplete="username" placeholder="email@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="border rounded-md px-2 py-1.5 text-sm bg-background"
              type="password" autoComplete="current-password" placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={doSignIn} disabled={busy}>
              <LogIn className="size-4 me-1" />
              {ar ? "تسجيل الدخول للباك اند" : "Sign in to backend"}
            </Button>
            <Button variant="outline" onClick={refresh} disabled={busy}>
              <RefreshCw className="size-4 me-1" />
              {ar ? "تحديث" : "Refresh"}
            </Button>
          </div>
        </div>
      )}

      {hasSession && (
        <div className="space-y-2 border-t pt-3">
          <h3 className="text-sm font-semibold">{ar ? "تجهيز المؤسسة الأولى" : "First tenant bootstrap"}</h3>
          <p className="text-[11px] text-muted-foreground">
            {ar
              ? "يُستدعى bootstrap_tenant_for_user لإنشاء: المؤسسة، الملف الشخصي، عضوية المؤسسة، دور المالك، إعدادات الشركة/الضريبة/الترقيم، شجرة الحسابات الافتراضية، وربط أغراض الحسابات."
              : "Calls bootstrap_tenant_for_user to create: tenant, profile, user_tenants membership, owner role, company/tax/numbering settings, default chart of accounts, and account purpose mappings."}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input
              className="border rounded-md px-2 py-1.5 text-sm bg-background"
              placeholder={ar ? "اسم المؤسسة (عربي)" : "Tenant name (Arabic)"}
              value={tenantNameAr} onChange={(e) => setTenantNameAr(e.target.value)}
            />
            <input
              className="border rounded-md px-2 py-1.5 text-sm bg-background"
              placeholder="Tenant name (English)"
              value={tenantNameEn} onChange={(e) => setTenantNameEn(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={doBootstrap} disabled={busy || !tenantNameAr || !tenantNameEn}>
              <PlugZap className="size-4 me-1" />
              {ar ? "تجهيز المؤسسة الأولى" : "Bootstrap First Tenant"}
            </Button>
            <Button variant="outline" onClick={refresh} disabled={busy}>
              <RefreshCw className="size-4 me-1" />
              {ar ? "تحديث الحالة" : "Refresh status"}
            </Button>
            <Button variant="outline" onClick={doSignOut} disabled={busy}>
              <LogOut className="size-4 me-1" />
              {ar ? "تسجيل خروج الباك اند" : "Sign out backend"}
            </Button>
          </div>
          {bootstrapMsg && (
            <div className="text-xs rounded-md border bg-muted/30 p-2 font-mono">{bootstrapMsg}</div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 border-b py-1.5">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-medium text-end font-mono text-xs">{v}</dd>
    </div>
  );
}

function strategyLabel(s: string, ar: boolean): string {
  if (s === "jwt_claim") return ar ? "ادعاء JWT" : "JWT claim";
  if (s === "selected_fallback") return ar ? "بديل المعاينة (أول مؤسسة من user_tenants)" : "Preview fallback (first user_tenants row)";
  return ar ? "غير محدّدة" : "None";
}
