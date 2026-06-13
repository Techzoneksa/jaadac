/**
 * JAAD CLOUD — Phase 2.1
 * Backend Readiness Verification & Supabase Dry Run.
 *
 * Read-only orchestrator that aggregates env, connection, auth, tenant,
 * RLS, schema, RPC, and write-readiness checks. NEVER writes data.
 * Returns a structured report consumable by /system-data-mode.
 */
import { isSupabaseConfigured, getSupabaseClient } from "./client";
import { readSupabaseEnv } from "./env";
import { getSessionSnapshot } from "./session";
import { mapSupabaseError, runReadOnlySmokeChecks } from "./backend-helpers";

export type DryRunStatus = "pass" | "fail" | "skipped" | "warn";

export interface DryRunCheck {
  id: string;
  label: { ar: string; en: string };
  status: DryRunStatus;
  details?: { ar: string; en: string };
  fix?: { ar: string; en: string };
  timestamp: string;
  data?: unknown;
}

export type OverallStatus =
  | "ready"
  | "needs_configuration"
  | "needs_migration"
  | "rls_issue"
  | "skipped_not_configured";

export interface DryRunReport {
  overall: OverallStatus;
  configured: boolean;
  runAt: string;
  passCount: number;
  failCount: number;
  warnCount: number;
  skippedCount: number;
  checks: DryRunCheck[];
}

/** Required tenant-scoped tables (Phase 1.6.1 schema). */
export const REQUIRED_TABLES = [
  "tenants", "profiles", "user_tenants", "user_roles",
  "customers", "suppliers", "items",
  "quotations", "quotation_lines",
  "invoices", "invoice_lines",
  "receipts", "payments",
  "chart_accounts", "chart_account_purposes",
  "journal_entries", "journal_entry_lines",
  "tasks", "settings_company", "settings_tax", "settings_numbering",
  "audit_logs", "attachments",
  "document_number_sequences",
] as const;

/** Required RPCs (bootstrap + write + readiness). */
export const REQUIRED_RPCS = [
  "bootstrap_tenant_for_user",
  "quotation_convert_to_invoice",
  "invoice_issue",
  "receipt_create_with_auto_apply",
  "payment_create_with_posting",
  "journal_post_manual",
  "list_write_rpc_readiness",
  "validate_numbering_setup",
  "validate_tenant_account_setup",
] as const;

function nowIso() { return new Date().toISOString(); }

function check(
  id: string,
  label: DryRunCheck["label"],
  status: DryRunStatus,
  details?: DryRunCheck["details"],
  fix?: DryRunCheck["fix"],
  data?: unknown,
): DryRunCheck {
  return { id, label, status, details, fix, data, timestamp: nowIso() };
}

const TXT = (ar: string, en: string) => ({ ar, en });

/** Mask a secret to "abcd…wxyz" for safe console logging. */
export function maskSecret(s: string | null | undefined): string {
  if (!s) return "—";
  if (s.length <= 8) return "•".repeat(s.length);
  return `${s.slice(0, 4)}…${s.slice(-4)} (len=${s.length})`;
}

/**
 * Developer-safe debug log: only ever prints masked / non-sensitive values.
 * Never logs anon key, service role, JWT, or PII.
 */
export function safeLogConfig(): void {
  const env = readSupabaseEnv();
  // eslint-disable-next-line no-console
  console.info("[jaad-cloud:dry-run] supabase env", {
    configured: env.ok,
    urlHost: env.ok ? safeHost(env.url) : null,
    anonKey: env.ok ? maskSecret(env.anonKey) : "—",
  });
}

function safeHost(url: string): string {
  try { return new URL(url).host; } catch { return "invalid-url"; }
}

async function probeTable(client: any, table: string): Promise<DryRunCheck> {
  const label = TXT(`جدول ${table}`, `Table ${table}`);
  try {
    const { error } = await client.from(table).select("id", { count: "exact", head: true }).limit(0);
    if (!error) return check(`schema.table.${table}`, label, "pass", TXT("الجدول مرئي عبر RLS.", "Table visible via RLS."));
    const e = error as { code?: string; message?: string };
    const msg = e.message ?? "";
    // Missing table / relation
    if (/relation .* does not exist/i.test(msg) || e.code === "42P01") {
      return check(`schema.table.${table}`, label, "fail",
        TXT("الجدول غير موجود.", "Table missing."),
        TXT("نفّذ ترحيلات قاعدة البيانات (init_schema).",
            "Apply database migrations (init_schema)."));
    }
    if (e.code === "42501" || e.code === "PGRST301") {
      return check(`schema.table.${table}`, label, "warn",
        TXT("الوصول مرفوض بواسطة RLS.", "RLS denied access."),
        TXT("تأكد من عضوية المستخدم في المؤسسة.", "Ensure user is a member of the active tenant."));
    }
    const app = mapSupabaseError(error);
    return check(`schema.table.${table}`, label, "fail", app.bilingual);
  } catch (e) {
    const app = mapSupabaseError(e);
    return check(`schema.table.${table}`, label, "fail", app.bilingual);
  }
}

async function probeRpc(client: any, rpcName: string): Promise<DryRunCheck> {
  const label = TXT(`دالة ${rpcName}`, `RPC ${rpcName}`);
  try {
    // Call with empty/invalid args. If RPC exists, Postgres rejects with a
    // function-level error (still proves existence). If not deployed,
    // PostgREST returns PGRST202 / "Could not find the function".
    const { error } = await client.rpc(rpcName, {});
    if (!error) {
      return check(`rpc.${rpcName}`, label, "pass",
        TXT("الدالة قابلة للنداء.", "RPC reachable."));
    }
    const e = error as { code?: string; message?: string };
    const msg = e.message ?? "";
    if (e.code === "PGRST202" || /Could not find the function/i.test(msg)) {
      return check(`rpc.${rpcName}`, label, "fail",
        TXT("الدالة غير منشورة.", "RPC not deployed."),
        TXT("طبّق ترحيلات الكتابة + التقوية.", "Apply write + hardening migrations."));
    }
    return check(`rpc.${rpcName}`, label, "pass",
      TXT("الدالة موجودة (رفضت المدخلات).", "RPC exists (rejected input)."));
  } catch (e) {
    const app = mapSupabaseError(e);
    return check(`rpc.${rpcName}`, label, "fail", app.bilingual);
  }
}

export async function runBackendDryRun(): Promise<DryRunReport> {
  const runAt = nowIso();
  const configured = isSupabaseConfigured();
  safeLogConfig();

  if (!configured) {
    const c = check("env.configured", TXT("إعدادات Supabase", "Supabase env"),
      "skipped",
      TXT("لم تُضبط VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.",
          "VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set."),
      TXT("أضف المتغيرات في .env ثم أعد تشغيل البناء.",
          "Add the variables in .env then rebuild."));
    return {
      overall: "skipped_not_configured", configured: false, runAt,
      passCount: 0, failCount: 0, warnCount: 0, skippedCount: 1,
      checks: [c],
    };
  }

  const checks: DryRunCheck[] = [
    check("env.configured", TXT("إعدادات Supabase", "Supabase env"), "pass",
      TXT("تم اكتشاف الإعدادات.", "Env detected.")),
  ];

  // 1. Connection + smoke
  const smoke = await runReadOnlySmokeChecks();
  for (const sc of smoke.checks) {
    checks.push(check(`smoke.${sc.name}`, TXT(sc.name, sc.name),
      sc.ok ? "pass" : "fail", sc.message,
      sc.ok ? undefined : TXT("راجع وثائق الإعداد.", "See setup docs.")));
  }

  const client = await getSupabaseClient();
  const snap = await getSessionSnapshot();

  if (!client) {
    return finalize(runAt, configured, checks);
  }

  // 2. Schema visibility / required tables (only when session+tenant present,
  //    otherwise RLS denies and yields misleading "warn" rows).
  if (snap.hasSession && snap.activeTenantId) {
    for (const t of REQUIRED_TABLES) {
      // eslint-disable-next-line no-await-in-loop
      checks.push(await probeTable(client, t));
    }
  } else {
    checks.push(check("schema.tables", TXT("فحوصات مرئية الجداول", "Table visibility checks"),
      "skipped",
      TXT("تتطلب جلسة ومؤسسة نشطة.", "Requires an authenticated session and active tenant.")));
  }

  // 3. RPC existence (does not require RLS)
  for (const rpc of REQUIRED_RPCS) {
    // eslint-disable-next-line no-await-in-loop
    checks.push(await probeRpc(client, rpc));
  }

  // 4. Readiness RPCs payload (only if tenant present)
  if (snap.hasSession && snap.activeTenantId) {
    try {
      const { data, error } = await (client as any).rpc("validate_tenant_account_setup", { _tenant: snap.activeTenantId });
      if (error) {
        const app = mapSupabaseError(error);
        checks.push(check("readiness.purposes", TXT("جاهزية أغراض الحسابات", "Account purpose readiness"), "fail", app.bilingual));
      } else {
        const missing = Array.isArray((data as any)?.missing) ? (data as any).missing.length : 0;
        checks.push(check("readiness.purposes", TXT("جاهزية أغراض الحسابات", "Account purpose readiness"),
          missing === 0 ? "pass" : "warn",
          missing === 0
            ? TXT("كل الأغراض متاحة.", "All purposes resolvable.")
            : TXT(`${missing} غرض مفقود.`, `${missing} purpose(s) missing.`),
          missing === 0 ? undefined : TXT("اضبط الربط في chart_account_purposes.", "Configure chart_account_purposes mappings."),
          data));
      }
    } catch (e) {
      const app = mapSupabaseError(e);
      checks.push(check("readiness.purposes", TXT("جاهزية أغراض الحسابات", "Account purpose readiness"), "fail", app.bilingual));
    }

    try {
      const { data, error } = await (client as any).rpc("validate_numbering_setup", { _tenant: snap.activeTenantId });
      if (error) {
        const app = mapSupabaseError(error);
        checks.push(check("readiness.numbering", TXT("جاهزية الترقيم", "Numbering readiness"), "fail", app.bilingual));
      } else {
        checks.push(check("readiness.numbering", TXT("جاهزية الترقيم", "Numbering readiness"), "pass",
          TXT("نظام الترقيم جاهز.", "Numbering setup OK."), undefined, data));
      }
    } catch (e) {
      const app = mapSupabaseError(e);
      checks.push(check("readiness.numbering", TXT("جاهزية الترقيم", "Numbering readiness"), "fail", app.bilingual));
    }

    try {
      const { data, error } = await (client as any).rpc("list_write_rpc_readiness", {});
      if (error) {
        const app = mapSupabaseError(error);
        checks.push(check("readiness.write_rpcs", TXT("جاهزية دوال الكتابة", "Write RPC readiness"), "fail", app.bilingual));
      } else {
        checks.push(check("readiness.write_rpcs", TXT("جاهزية دوال الكتابة", "Write RPC readiness"), "pass",
          TXT("القائمة متاحة (الكتابة لا تزال معطّلة في الواجهة).",
              "Listing available (UI writes remain disabled)."), undefined, data));
      }
    } catch (e) {
      const app = mapSupabaseError(e);
      checks.push(check("readiness.write_rpcs", TXT("جاهزية دوال الكتابة", "Write RPC readiness"), "fail", app.bilingual));
    }
  }

  return finalize(runAt, configured, checks);
}

function finalize(runAt: string, configured: boolean, checks: DryRunCheck[]): DryRunReport {
  const passCount = checks.filter(c => c.status === "pass").length;
  const failCount = checks.filter(c => c.status === "fail").length;
  const warnCount = checks.filter(c => c.status === "warn").length;
  const skippedCount = checks.filter(c => c.status === "skipped").length;

  let overall: OverallStatus = "ready";
  if (!configured) overall = "skipped_not_configured";
  else if (checks.some(c => c.status === "fail" && c.id.startsWith("schema.table."))) overall = "needs_migration";
  else if (checks.some(c => c.status === "fail" && c.id.startsWith("rpc."))) overall = "needs_migration";
  else if (checks.some(c => c.status === "warn" && c.id.startsWith("schema.table."))) overall = "rls_issue";
  else if (failCount > 0) overall = "needs_configuration";

  return { overall, configured, runAt, passCount, failCount, warnCount, skippedCount, checks };
}
