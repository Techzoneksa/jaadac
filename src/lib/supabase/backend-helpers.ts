/**
 * JAAD CLOUD — Phase 1.8 — Backend operation result helpers.
 *
 * Centralized helpers for the FutureBackendDataAdapter so future real
 * Supabase calls always return normalized ServiceResult<T> + AppError shapes,
 * with consistent pagination/sorting/date-range/search composition.
 *
 * These helpers do NOT activate the backend. They are pure utilities that
 * become useful once `DATA_MODE === "backend"` and a Supabase client is
 * available. While the app runs in demo mode, none of them are invoked from
 * the UI.
 */
import type {
  ApiErrorShape,
  ListQueryParams,
  PaginatedResult,
  ServiceResult,
} from "@/lib/contracts";
import { DEFAULT_PAGE_SIZE, errResult, okResult } from "@/lib/contracts";
import { AppError } from "@/lib/errors";
import { isSupabaseConfigured, getSupabaseClient } from "./client";
import { getSessionSnapshot } from "./session";

// ---------- Guards ----------

export function requireBackendConfigured(): AppError | null {
  if (isSupabaseConfigured()) return null;
  return new AppError(
    "adapter_unavailable",
    {
      ar: "الباك اند غير مُهيّأ — يعمل التطبيق في الوضع التجريبي.",
      en: "Backend not configured — the app is running in demo mode.",
    },
    503,
  );
}

export async function requireSession(): Promise<AppError | null> {
  const cfg = requireBackendConfigured();
  if (cfg) return cfg;
  const snap = await getSessionSnapshot();
  if (!snap.hasSession) {
    return new AppError(
      "permission_denied",
      { ar: "لا توجد جلسة مستخدم.", en: "No active user session." },
      401,
    );
  }
  return null;
}

export async function requireTenant(): Promise<AppError | null> {
  const sess = await requireSession();
  if (sess) return sess;
  const snap = await getSessionSnapshot();
  if (!snap.activeTenantId) {
    return new AppError(
      "permission_denied",
      {
        ar: "لم يتم تحديد المؤسسة النشطة.",
        en: "No active tenant selected.",
      },
      403,
    );
  }
  return null;
}

// ---------- Error mapping ----------

/**
 * Map a Supabase PostgrestError-like object into an AppError with a
 * bilingual message. Conservative — unknown codes fall back to "unknown".
 */
export function mapSupabaseError(err: unknown): AppError {
  const e = err as { code?: string; message?: string; details?: unknown } | null;
  const raw = e?.message ?? "Unknown error";
  const code = e?.code ?? "";

  // PostgREST / Postgres common codes
  if (code === "PGRST116") {
    return new AppError(
      "not_found",
      { ar: "السجل غير موجود.", en: "Record not found." },
      404,
      e?.details,
    );
  }
  if (code === "23505") {
    return new AppError(
      "duplicate_number",
      { ar: "قيمة مكررة (انتهاك تفرّد).", en: "Duplicate value (unique violation)." },
      409,
      e?.details,
    );
  }
  if (code === "42501" || code === "PGRST301") {
    return new AppError(
      "permission_denied",
      { ar: "تم رفض الوصول بواسطة سياسات الأمان.", en: "Access denied by security policies." },
      403,
      e?.details,
    );
  }
  if (code === "23503") {
    return new AppError(
      "validation_failed",
      { ar: "مرجع غير صالح (مفتاح أجنبي).", en: "Invalid reference (foreign key)." },
      400,
      e?.details,
    );
  }
  return new AppError(
    "unknown",
    { ar: `خطأ في الباك اند: ${raw}`, en: `Backend error: ${raw}` },
    500,
    e?.details,
  );
}

/**
 * Normalize a Supabase `{ data, error }` tuple to ServiceResult<T>.
 */
export function normalizeSupabaseResult<T>(res: { data: T | null; error: unknown }): ServiceResult<T> {
  if (res.error) {
    const app = mapSupabaseError(res.error);
    const api: ApiErrorShape = {
      code: app.code,
      message: app.bilingual,
      status: app.status,
      details: app.details,
    };
    return errResult<T>(api);
  }
  if (res.data === null || res.data === undefined) {
    return errResult<T>({
      code: "not_found",
      message: { ar: "لا توجد بيانات.", en: "No data returned." },
      status: 404,
    });
  }
  return okResult<T>(res.data);
}

// ---------- Query builders ----------

export type QueryBuilder = {
  select: (...a: unknown[]) => QueryBuilder;
  eq: (k: string, v: unknown) => QueryBuilder;
  gte: (k: string, v: unknown) => QueryBuilder;
  lte: (k: string, v: unknown) => QueryBuilder;
  or: (s: string) => QueryBuilder;
  order: (k: string, opts?: { ascending?: boolean }) => QueryBuilder;
  range: (a: number, b: number) => QueryBuilder;
  ilike: (k: string, v: string) => QueryBuilder;
  [k: string]: unknown;
};

export interface BuildListOptions {
  /** Columns that can be searched with the `search` param. */
  searchableColumns?: string[];
  /** Default sort column when params.sortBy is missing. */
  defaultSortBy?: string;
  /** Default sort direction when params.sortDir is missing. */
  defaultSortDir?: "asc" | "desc";
  /** Date column used by from/to filters. */
  dateColumn?: string;
}

export function applyPagination(q: QueryBuilder, params?: ListQueryParams): QueryBuilder {
  const page = Math.max(1, params?.page ?? 1);
  const size = Math.max(1, params?.pageSize ?? DEFAULT_PAGE_SIZE);
  const from = (page - 1) * size;
  const to = from + size - 1;
  return q.range(from, to);
}

export function applySorting(
  q: QueryBuilder,
  params?: ListQueryParams,
  defaults?: { by?: string; dir?: "asc" | "desc" },
): QueryBuilder {
  const by = params?.sortBy ?? defaults?.by;
  if (!by) return q;
  const dir = params?.sortDir ?? defaults?.dir ?? "desc";
  return q.order(by, { ascending: dir === "asc" });
}

export function applyDateRange(q: QueryBuilder, column: string, params?: ListQueryParams): QueryBuilder {
  let out = q;
  if (params?.from) out = out.gte(column, params.from);
  if (params?.to) out = out.lte(column, params.to);
  return out;
}

export function applySearch(q: QueryBuilder, params?: ListQueryParams, cols?: string[]): QueryBuilder {
  if (!params?.search || !cols?.length) return q;
  const expr = cols.map((c) => `${c}.ilike.%${params.search}%`).join(",");
  return q.or(expr);
}

export function applyFilters(q: QueryBuilder, params?: ListQueryParams): QueryBuilder {
  let out = q;
  if (params?.status) out = out.eq("status", params.status);
  if (params?.tenantId) out = out.eq("tenant_id", params.tenantId);
  if (params?.filters) {
    for (const [k, v] of Object.entries(params.filters)) {
      if (v !== undefined && v !== null && v !== "") out = out.eq(k, v);
    }
  }
  return out;
}

/**
 * Compose select + filters + search + date range + sorting + pagination on
 * a Supabase query for a tenant-scoped table.
 */
export function buildListQuery(
  table: QueryBuilder,
  params?: ListQueryParams,
  opts?: BuildListOptions,
): QueryBuilder {
  let q = table.select("*", { count: "exact" } as unknown);
  q = applyFilters(q, params);
  q = applyDateRange(q, opts?.dateColumn ?? "created_at", params);
  q = applySearch(q, params, opts?.searchableColumns);
  q = applySorting(q, params, { by: opts?.defaultSortBy, dir: opts?.defaultSortDir });
  q = applyPagination(q, params);
  return q;
}

export function toPaginated<T>(rows: T[], total: number, params?: ListQueryParams): PaginatedResult<T> {
  return {
    items: rows,
    total,
    page: Math.max(1, params?.page ?? 1),
    pageSize: Math.max(1, params?.pageSize ?? DEFAULT_PAGE_SIZE),
  };
}

// ---------- Read-only smoke checks ----------

export interface SmokeCheck {
  name: string;
  ok: boolean;
  message: { ar: string; en: string };
  details?: unknown;
}

export interface SmokeReport {
  configured: boolean;
  runAt: string;
  checks: SmokeCheck[];
  okCount: number;
  failCount: number;
}

function notConfiguredCheck(name: string): SmokeCheck {
  return {
    name,
    ok: false,
    message: { ar: "الباك اند غير مُهيّأ.", en: "Backend not configured." },
  };
}

export async function checkSupabaseConnection(): Promise<SmokeCheck> {
  const name = "supabase.connection";
  if (!isSupabaseConfigured()) return notConfiguredCheck(name);
  const client = await getSupabaseClient();
  if (!client) {
    return {
      name,
      ok: false,
      message: {
        ar: "تعذّر تحميل عميل Supabase.",
        en: "Supabase client could not be initialized.",
      },
    };
  }
  return {
    name,
    ok: true,
    message: { ar: "تم تحميل عميل Supabase.", en: "Supabase client initialized." },
  };
}

export async function checkAuthSession(): Promise<SmokeCheck> {
  const name = "auth.session";
  if (!isSupabaseConfigured()) return notConfiguredCheck(name);
  const snap = await getSessionSnapshot();
  return {
    name,
    ok: snap.hasSession,
    message: snap.hasSession
      ? { ar: "تم اكتشاف جلسة نشطة.", en: "Active session detected." }
      : { ar: "لا توجد جلسة حالية.", en: "No active session." },
    details: { userId: snap.userId },
  };
}

export async function checkTenantMembership(): Promise<SmokeCheck> {
  const name = "tenant.membership";
  if (!isSupabaseConfigured()) return notConfiguredCheck(name);
  const snap = await getSessionSnapshot();
  if (!snap.hasSession) {
    return {
      name,
      ok: false,
      message: { ar: "لا توجد جلسة.", en: "No session." },
    };
  }
  return {
    name,
    ok: !!snap.activeTenantId,
    message: snap.activeTenantId
      ? { ar: "تم تحديد المؤسسة النشطة.", en: "Active tenant detected." }
      : {
          ar: "لا توجد مؤسسة نشطة في JWT.",
          en: "No active_tenant_id in JWT claims.",
        },
    details: { activeTenantId: snap.activeTenantId },
  };
}

export async function checkRlsReadAccess(): Promise<SmokeCheck> {
  const name = "rls.read_access";
  if (!isSupabaseConfigured()) return notConfiguredCheck(name);
  const client = (await getSupabaseClient()) as unknown as {
    from: (t: string) => QueryBuilder;
  } | null;
  if (!client) return notConfiguredCheck(name);
  try {
    // Read-only HEAD-style probe on tenants. Safe: returns no rows when no
    // membership exists, and never writes.
    const probe = await (client.from("tenants").select("id", {
      count: "exact",
      head: true,
    } as unknown) as unknown as Promise<{ error: unknown; count: number | null }>);
    if (probe.error) {
      const app = mapSupabaseError(probe.error);
      return { name, ok: false, message: app.bilingual, details: app.details };
    }
    return {
      name,
      ok: true,
      message: {
        ar: "وصول قراءة آمن عبر RLS.",
        en: "RLS read access works.",
      },
      details: { count: probe.count ?? 0 },
    };
  } catch (e) {
    const app = mapSupabaseError(e);
    return { name, ok: false, message: app.bilingual };
  }
}

export async function checkBootstrapRpcExists(): Promise<SmokeCheck> {
  const name = "rpc.bootstrap_tenant_for_user";
  if (!isSupabaseConfigured()) return notConfiguredCheck(name);
  const client = (await getSupabaseClient()) as unknown as {
    rpc: (fn: string, args: Record<string, unknown>) => Promise<{ error: unknown }>;
  } | null;
  if (!client) return notConfiguredCheck(name);
  try {
    // Intentionally call with all-NULL args. The function will raise
    // `p_user_id is required`, which proves it exists without writing data.
    const res = await client.rpc("bootstrap_tenant_for_user", {
      p_user_id: null,
      p_name_ar: null,
      p_name_en: null,
    });
    const err = res.error as { code?: string; message?: string } | null;
    if (!err) {
      // Shouldn't reach here with NULL args; treat as ok if it did.
      return {
        name,
        ok: true,
        message: { ar: "تم اكتشاف الدالة.", en: "RPC detected." },
      };
    }
    const msg = err.message ?? "";
    if (/p_user_id is required/i.test(msg)) {
      return {
        name,
        ok: true,
        message: { ar: "الدالة موجودة (رفضت المدخلات الفارغة).", en: "RPC exists (rejected null input)." },
      };
    }
    // 404-style "function does not exist"
    if (/Could not find the function/i.test(msg) || err.code === "PGRST202") {
      return {
        name,
        ok: false,
        message: { ar: "الدالة غير موجودة.", en: "RPC not deployed." },
      };
    }
    // Any other error still proves the function is reachable.
    return {
      name,
      ok: true,
      message: { ar: "الدالة موجودة.", en: "RPC reachable." },
      details: { code: err.code, message: msg },
    };
  } catch (e) {
    const app = mapSupabaseError(e);
    return { name, ok: false, message: app.bilingual };
  }
}

export async function runReadOnlySmokeChecks(): Promise<SmokeReport> {
  const configured = isSupabaseConfigured();
  const checks: SmokeCheck[] = [];
  checks.push(await checkSupabaseConnection());
  checks.push(await checkAuthSession());
  checks.push(await checkTenantMembership());
  checks.push(await checkRlsReadAccess());
  checks.push(await checkBootstrapRpcExists());
  const okCount = checks.filter((c) => c.ok).length;
  return {
    configured,
    runAt: new Date().toISOString(),
    checks,
    okCount,
    failCount: checks.length - okCount,
  };
}
