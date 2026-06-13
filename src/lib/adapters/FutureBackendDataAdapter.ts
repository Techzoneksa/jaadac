/**
 * Phase 1.9 — FutureBackendDataAdapter (read-only Supabase implementation).
 *
 * READ methods now perform real Supabase queries when:
 *   - the env is configured AND
 *   - there is an authenticated session AND
 *   - the JWT carries an `active_tenant_id` claim.
 *
 * All queries are tenant-scoped via `tenant_id` and rely on RLS for security.
 * WRITE methods remain disabled — they return a bilingual `writes_disabled`
 * error. The app continues to run in `DATA_MODE === "demo"` by default; the
 * backend adapter is never wired into the live UI in Phase 1.9 — it is only
 * exercised by the Owner-only "Backend Read-Only Preview" panel in
 * /system-data-mode.
 */
import type { State, ID } from "@/lib/store";
import type { ListQueryParams, ServiceResult, PaginatedResult } from "@/lib/contracts";
import { errResult, okResult, DEFAULT_PAGE_SIZE } from "@/lib/contracts";
import { AppError, ERRORS } from "@/lib/errors";
import { readSupabaseEnv, supabaseEnvStatus } from "@/lib/supabase/env";
import { isSupabaseConfigured, getSupabaseClient } from "@/lib/supabase/client";
import { getSessionSnapshot, type SessionSnapshot } from "@/lib/supabase/session";
import { bootstrapReadiness, bootstrapTenantForCurrentUser, type BootstrapInput } from "@/lib/supabase/tenant-bootstrap";
import {
  runReadOnlySmokeChecks,
  type SmokeReport,
  requireBackendConfigured,
  mapSupabaseError,
} from "@/lib/supabase/backend-helpers";
import { runBackendDryRun, REQUIRED_TABLES, REQUIRED_RPCS, type DryRunReport } from "@/lib/supabase/dry-run";
import type {
  AuditLogRow,
  ChartAccountRow,
  CustomerRow,
  InvoiceLineRow,
  InvoiceRow,
  ItemRow,
  JournalEntryLineRow,
  JournalEntryRow,
  PaymentRow,
  ProfileRow,
  QuotationLineRow,
  QuotationRow,
  ReceiptRow,
  SettingsCompanyRow,
  SettingsNumberingRow,
  SettingsTaxRow,
  SupplierRow,
  TaskRow,
  TenantRow,
} from "@/lib/supabase/types";
import type { AdapterStatus, DataAdapter, EntityKey, MigrationSnapshot } from "./types";

type Inert<T = never> = ServiceResult<T>;

/**
 * Phase 2.0 — Backend writes are intentionally disabled. RPC functions exist
 * in supabase/migrations/20260611120005_write_rpc_functions.sql but the UI
 * MUST NOT call them yet. Flipping this flag requires explicit phase sign-off.
 */
export const BACKEND_WRITES_ENABLED = false as const;

/** Canonical mapping from adapter write method → Postgres RPC name. */
export const WRITE_RPC_MAP = {
  quotations_convertToInvoice:   "quotation_convert_to_invoice",
  invoices_issue:                "invoice_issue",
  receipts_createWithAutoApply:  "receipt_create_with_auto_apply",
  payments_createWithPosting:    "payment_create_with_posting",
  journal_postManual:            "journal_post_manual",
} as const;
export type WriteRpcKey = keyof typeof WRITE_RPC_MAP;

/** Phase 2.0.1 — Per-RPC hardening metadata. */
export interface WriteRpcMetadata {
  rpcName: string;
  requiredRoles: ReadonlyArray<"owner" | "accountant" | "sales" | "viewer">;
  writesEnabled: boolean;
  safetyStatus: "hardened" | "draft";
  numberingStrategy: "tenant_scoped_sequence_table" | "count_based";
  accountLookupStrategy: "semantic_purpose" | "hardcoded_code" | "n/a";
}

export const WRITE_RPC_METADATA: Record<WriteRpcKey, WriteRpcMetadata> = {
  quotations_convertToInvoice: {
    rpcName: "quotation_convert_to_invoice",
    requiredRoles: ["owner", "accountant", "sales"],
    writesEnabled: false,
    safetyStatus: "hardened",
    numberingStrategy: "tenant_scoped_sequence_table",
    accountLookupStrategy: "n/a",
  },
  invoices_issue: {
    rpcName: "invoice_issue",
    requiredRoles: ["owner", "accountant"],
    writesEnabled: false,
    safetyStatus: "hardened",
    numberingStrategy: "tenant_scoped_sequence_table",
    accountLookupStrategy: "semantic_purpose",
  },
  receipts_createWithAutoApply: {
    rpcName: "receipt_create_with_auto_apply",
    requiredRoles: ["owner", "accountant"],
    writesEnabled: false,
    safetyStatus: "hardened",
    numberingStrategy: "tenant_scoped_sequence_table",
    accountLookupStrategy: "semantic_purpose",
  },
  payments_createWithPosting: {
    rpcName: "payment_create_with_posting",
    requiredRoles: ["owner", "accountant"],
    writesEnabled: false,
    safetyStatus: "hardened",
    numberingStrategy: "tenant_scoped_sequence_table",
    accountLookupStrategy: "semantic_purpose",
  },
  journal_postManual: {
    rpcName: "journal_post_manual",
    requiredRoles: ["owner", "accountant"],
    writesEnabled: false,
    safetyStatus: "hardened",
    numberingStrategy: "tenant_scoped_sequence_table",
    accountLookupStrategy: "n/a",
  },
};

const WRITES_DISABLED_ERR = {
  code: "writes_disabled",
  message: {
    ar: "وضع الباك اند للقراءة فقط في هذه المرحلة — الكتابة معطّلة.",
    en: "Backend mode is read-only in this phase — writes are disabled.",
  },
  status: 501,
} as const;

function writesDisabled<T = never>(rpcName?: string): ServiceResult<T> {
  return {
    ok: false,
    error: { ...WRITES_DISABLED_ERR, details: rpcName ? { rpcName, enabled: BACKEND_WRITES_ENABLED } : undefined },
  } as ServiceResult<T>;
}

function notConfigured<T = never>(): ServiceResult<T> {
  const e = requireBackendConfigured();
  if (e) return errResult<T>({ code: e.code, message: e.bilingual, status: e.status });
  return errResult<T>({
    code: "not_implemented",
    message: {
      ar: "وضع الباك اند غير مُفعّل في هذه المرحلة.",
      en: "Backend mode is not activated yet.",
    },
    status: 501,
  });
}

// ─── shared read context ───────────────────────────────────────────────
interface ReadContext {
  client: any;
  tenantId: string;
}

async function getReadContext(): Promise<ServiceResult<ReadContext>> {
  if (!isSupabaseConfigured()) return notConfigured();
  const client = await getSupabaseClient();
  if (!client) {
    return errResult({
      code: "adapter_unavailable",
      message: {
        ar: "تعذّر تحميل عميل Supabase.",
        en: "Supabase client could not be loaded.",
      },
      status: 503,
    });
  }
  const snap = await getSessionSnapshot();
  if (!snap.hasSession) {
    return errResult({
      code: "permission_denied",
      message: { ar: "لا توجد جلسة مستخدم نشطة.", en: "No active user session." },
      status: 401,
    });
  }
  if (!snap.activeTenantId) {
    return errResult({
      code: "permission_denied",
      message: {
        ar: "لم يتم تحديد المؤسسة النشطة (active_tenant_id).",
        en: "No active tenant selected (active_tenant_id missing).",
      },
      status: 403,
    });
  }
  return okResult({ client, tenantId: snap.activeTenantId });
}

async function readList<T>(
  table: string,
  params?: ListQueryParams,
  opts?: { searchable?: string[]; defaultSort?: { by: string; dir: "asc" | "desc" }; select?: string; tenantFilter?: boolean },
): Promise<ServiceResult<PaginatedResult<T>>> {
  const ctx = await getReadContext();
  if (!ctx.ok) return errResult(ctx.error!);
  try {
    const page = Math.max(1, params?.page ?? 1);
    const size = Math.max(1, params?.pageSize ?? DEFAULT_PAGE_SIZE);
    const from = (page - 1) * size;
    const to = from + size - 1;
    let q = ctx.data!.client.from(table).select(opts?.select ?? "*", { count: "exact" });
    if (opts?.tenantFilter !== false) q = q.eq("tenant_id", ctx.data!.tenantId);
    if (params?.status) q = q.eq("status", params.status);
    if (params?.from && opts?.defaultSort?.by) q = q.gte(opts.defaultSort.by, params.from);
    if (params?.to && opts?.defaultSort?.by) q = q.lte(opts.defaultSort.by, params.to);
    if (params?.search && opts?.searchable?.length) {
      const expr = opts.searchable.map((c) => `${c}.ilike.%${params.search}%`).join(",");
      q = q.or(expr);
    }
    const by = params?.sortBy ?? opts?.defaultSort?.by;
    if (by) q = q.order(by, { ascending: (params?.sortDir ?? opts?.defaultSort?.dir ?? "desc") === "asc" });
    q = q.range(from, to);
    const { data, error, count } = await q;
    if (error) {
      const app = mapSupabaseError(error);
      return errResult({ code: app.code, message: app.bilingual, status: app.status, details: app.details });
    }
    return okResult<PaginatedResult<T>>({
      items: (data ?? []) as T[],
      total: count ?? (data?.length ?? 0),
      page,
      pageSize: size,
    });
  } catch (e) {
    const app = mapSupabaseError(e);
    return errResult({ code: app.code, message: app.bilingual, status: app.status });
  }
}

async function readOne<T>(table: string, id: ID, select = "*"): Promise<ServiceResult<T>> {
  const ctx = await getReadContext();
  if (!ctx.ok) return errResult(ctx.error!);
  try {
    const { data, error } = await ctx.data!.client
      .from(table)
      .select(select)
      .eq("tenant_id", ctx.data!.tenantId)
      .eq("id", id)
      .maybeSingle();
    if (error) {
      const app = mapSupabaseError(error);
      return errResult({ code: app.code, message: app.bilingual, status: app.status });
    }
    if (!data) {
      return errResult({
        code: "not_found",
        message: { ar: "السجل غير موجود.", en: "Record not found." },
        status: 404,
      });
    }
    return okResult<T>(data as T);
  } catch (e) {
    const app = mapSupabaseError(e);
    return errResult({ code: app.code, message: app.bilingual, status: app.status });
  }
}

async function readSingleton<T>(table: string): Promise<ServiceResult<T>> {
  const ctx = await getReadContext();
  if (!ctx.ok) return errResult(ctx.error!);
  try {
    const { data, error } = await ctx.data!.client
      .from(table)
      .select("*")
      .eq("tenant_id", ctx.data!.tenantId)
      .maybeSingle();
    if (error) {
      const app = mapSupabaseError(error);
      return errResult({ code: app.code, message: app.bilingual, status: app.status });
    }
    if (!data) {
      return errResult({
        code: "not_found",
        message: { ar: "لا توجد إعدادات.", en: "No settings configured." },
        status: 404,
      });
    }
    return okResult<T>(data as T);
  } catch (e) {
    const app = mapSupabaseError(e);
    return errResult({ code: app.code, message: app.bilingual, status: app.status });
  }
}

// ─── preview entities (Owner-only UI surface) ──────────────────────────
export const PREVIEW_ENTITIES = [
  "customers",
  "suppliers",
  "items",
  "invoices",
  "quotations",
  "accounts",
  "audit_logs",
] as const;
export type PreviewEntity = (typeof PREVIEW_ENTITIES)[number];

const PREVIEW_CONFIG: Record<PreviewEntity, { table: string; searchable: string[]; defaultSort: { by: string; dir: "asc" | "desc" } }> = {
  customers:  { table: "customers",       searchable: ["name_ar", "name_en", "code"], defaultSort: { by: "created_at", dir: "desc" } },
  suppliers:  { table: "suppliers",       searchable: ["name_ar", "name_en", "code"], defaultSort: { by: "created_at", dir: "desc" } },
  items:      { table: "items",           searchable: ["name_ar", "name_en", "code"], defaultSort: { by: "created_at", dir: "desc" } },
  invoices:   { table: "invoices",        searchable: ["number"],                     defaultSort: { by: "date",       dir: "desc" } },
  quotations: { table: "quotations",      searchable: ["number"],                     defaultSort: { by: "date",       dir: "desc" } },
  accounts:   { table: "chart_accounts",  searchable: ["code", "name_ar", "name_en"], defaultSort: { by: "code",       dir: "asc"  } },
  audit_logs: { table: "audit_logs",      searchable: ["action", "entity"],           defaultSort: { by: "created_at", dir: "desc" } },
};

export class FutureBackendDataAdapter implements DataAdapter {
  // ─────────────────────────────────────────── Status ────
  get status(): AdapterStatus {
    const env = supabaseEnvStatus();
    return {
      mode: "backend",
      name: "FutureBackendDataAdapter",
      connected: false, // never the active app adapter in Phase 1.9
      version: env.configured ? "0.5.0-purpose-mapping" : "0.0.0-unconfigured",
    };
  }

  configStatus() {
    const env = readSupabaseEnv();
    return {
      urlConfigured: env.ok || !env.missing.includes("VITE_SUPABASE_URL"),
      anonKeyConfigured: env.ok || !env.missing.includes("VITE_SUPABASE_ANON_KEY"),
      configured: env.ok,
      message: env.ok
        ? { ar: "تم اكتشاف إعدادات الباك اند.", en: "Backend configuration detected." }
        : env.message,
    };
  }

  // ─────────────────────────────────────── Session / health ──
  async sessionSnapshot(): Promise<SessionSnapshot> { return getSessionSnapshot(); }
  async runSmokeChecks(): Promise<SmokeReport> { return runReadOnlySmokeChecks(); }

  async clientAvailable(): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    const c = await getSupabaseClient();
    return !!c;
  }

  // ─────────────────────────────── Phase 2.0.2 — Readiness ─────────
  /** Required account purposes (kept in sync with chart_account_purposes). */
  static readonly REQUIRED_ACCOUNT_PURPOSES = [
    "cash","bank","accounts_receivable","vat_input","vat_payable",
    "revenue","expense","inventory","accounts_payable",
  ] as const;

  /** Adapter-side metadata — does not touch the network. */
  getWriteRpcReadinessMetadata() {
    return {
      writesEnabled: BACKEND_WRITES_ENABLED,
      writeExecutionAllowed: false,
      requiredAccountPurposes: [...FutureBackendDataAdapter.REQUIRED_ACCOUNT_PURPOSES],
      mappingTable: "chart_account_purposes",
      rpcs: Object.entries(WRITE_RPC_METADATA).map(([k, m]) => ({
        adapterMethod: k,
        rpcName: m.rpcName,
        requiredRoles: [...m.requiredRoles],
        safetyStatus: m.safetyStatus,
        numberingStrategy: m.numberingStrategy,
        accountLookupStrategy: m.accountLookupStrategy,
      })),
    };
  }

  async getWriteRpcReadiness(): Promise<ServiceResult<any>> {
    return this.callReadinessRpc("list_write_rpc_readiness", {});
  }
  async getAccountPurposeReadiness(): Promise<ServiceResult<any>> {
    return this.callReadinessRpc("validate_tenant_account_setup", { _tenant: "__active__" });
  }
  async getNumberingReadiness(): Promise<ServiceResult<any>> {
    return this.callReadinessRpc("validate_numbering_setup", { _tenant: "__active__" });
  }

  private async callReadinessRpc(rpcName: string, args: Record<string, unknown>): Promise<ServiceResult<any>> {
    if (!isSupabaseConfigured()) return notConfigured();
    const client = await getSupabaseClient();
    if (!client) {
      return errResult({
        code: "adapter_unavailable",
        message: { ar: "تعذّر تحميل عميل Supabase.", en: "Supabase client could not be loaded." },
        status: 503,
      });
    }
    const snap = await getSessionSnapshot();
    if (!snap.hasSession) {
      return errResult({
        code: "permission_denied",
        message: { ar: "لا توجد جلسة مستخدم نشطة.", en: "No active user session." },
        status: 401,
      });
    }
    let rpcArgs = args;
    if ("_tenant" in args && args._tenant === "__active__") {
      if (!snap.activeTenantId) {
        return errResult({
          code: "permission_denied",
          message: { ar: "لم يتم تحديد المؤسسة النشطة.", en: "No active tenant selected." },
          status: 403,
        });
      }
      rpcArgs = { ...args, _tenant: snap.activeTenantId };
    }
    try {
      const { data, error } = await (client as any).rpc(rpcName, rpcArgs);
      if (error) {
        const app = mapSupabaseError(error);
        return errResult({ code: app.code, message: app.bilingual, status: app.status });
      }
      return okResult(data);
    } catch (e) {
      const app = mapSupabaseError(e);
      return errResult({ code: app.code, message: app.bilingual, status: app.status });
    }
  }

  async health(): Promise<{ ok: boolean; configured: boolean; message: { ar: string; en: string } }> {
    const cfg = this.configStatus();
    if (!cfg.configured) return { ok: false, configured: false, message: cfg.message };
    const ctx = await getReadContext();
    if (!ctx.ok) {
      return { ok: false, configured: true, message: ctx.error!.message };
    }
    return {
      ok: true,
      configured: true,
      message: {
        ar: "الباك اند جاهز للقراءة فقط (Phase 1.9).",
        en: "Backend is ready in read-only mode (Phase 1.9).",
      },
    };
  }

  // ──────────────────────── Phase 2.1 — Dry Run ────────────────────────
  /** Full read-only dry-run report (env, conn, auth, tenant, schema, RPCs, readiness). */
  async runBackendDryRun(): Promise<ServiceResult<DryRunReport>> {
    try {
      const report = await runBackendDryRun();
      return okResult(report);
    } catch (e) {
      const app = mapSupabaseError(e);
      return errResult({ code: app.code, message: app.bilingual, status: app.status });
    }
  }

  /** Required-table availability subset of the dry run. */
  async getSchemaReadiness(): Promise<ServiceResult<{ required: string[]; report: DryRunReport }>> {
    const r = await this.runBackendDryRun();
    if (!r.ok) return errResult(r.error!);
    return okResult({ required: [...REQUIRED_TABLES], report: r.data! });
  }

  /** Required-RPC availability subset of the dry run. */
  async getRpcReadiness(): Promise<ServiceResult<{ required: string[]; report: DryRunReport }>> {
    const r = await this.runBackendDryRun();
    if (!r.ok) return errResult(r.error!);
    return okResult({ required: [...REQUIRED_RPCS], report: r.data! });
  }

  /** Aggregated write readiness (delegates to hardening RPC + metadata). */
  async getWriteReadiness(): Promise<ServiceResult<{ writesEnabled: boolean; metadata: ReturnType<FutureBackendDataAdapter["getWriteRpcReadinessMetadata"]>; rpcReport?: unknown }>> {
    const meta = this.getWriteRpcReadinessMetadata();
    const r = await this.getWriteRpcReadiness();
    return okResult({
      writesEnabled: BACKEND_WRITES_ENABLED,
      metadata: meta,
      rpcReport: r.ok ? r.data : { error: r.error },
    });
  }


  // ─────────────────────────────────────── Preview helper ──
  /** Owner-only safe read used by /system-data-mode preview panel. */
  async previewEntity(entity: PreviewEntity, params?: ListQueryParams): Promise<ServiceResult<PaginatedResult<unknown>>> {
    const cfg = PREVIEW_CONFIG[entity];
    if (!cfg) {
      return errResult({
        code: "validation_failed",
        message: { ar: "كيان غير مدعوم.", en: "Unsupported entity." },
        status: 400,
      });
    }
    const p = { pageSize: 10, ...params } as ListQueryParams;
    return readList(cfg.table, p, { searchable: cfg.searchable, defaultSort: cfg.defaultSort });
  }

  // ─────────────────────────────────────── Tenants ─────────
  async tenants_current(): Promise<ServiceResult<TenantRow>> {
    const ctx = await getReadContext();
    if (!ctx.ok) return errResult(ctx.error!);
    return readOne<TenantRow>("tenants", ctx.data!.tenantId);
  }
  async tenants_bootstrap(input: BootstrapInput) { return bootstrapTenantForCurrentUser(input); }
  bootstrapReadiness() { return bootstrapReadiness(); }

  // ─────────────────────────────────────── Profile ─────────
  async profile_current(): Promise<ServiceResult<ProfileRow>> {
    const ctx = await getReadContext();
    if (!ctx.ok) return errResult(ctx.error!);
    try {
      const snap = await getSessionSnapshot();
      const { data, error } = await ctx.data!.client
        .from("profiles").select("*").eq("id", snap.userId).maybeSingle();
      if (error) {
        const app = mapSupabaseError(error);
        return errResult({ code: app.code, message: app.bilingual, status: app.status });
      }
      if (!data) return errResult({ code: "not_found", message: { ar: "الملف الشخصي غير موجود.", en: "Profile not found." }, status: 404 });
      return okResult<ProfileRow>(data as ProfileRow);
    } catch (e) {
      const app = mapSupabaseError(e);
      return errResult({ code: app.code, message: app.bilingual });
    }
  }

  // ─────────────────────────────────────── Customers ───────
  async customers_list(p?: ListQueryParams) {
    return readList<CustomerRow>("customers", p, PREVIEW_CONFIG.customers);
  }
  async customers_get(id: ID) { return readOne<CustomerRow>("customers", id); }
  async customers_create() { return writesDisabled(); }
  async customers_update() { return writesDisabled(); }
  async customers_remove() { return writesDisabled(); }

  // ─────────────────────────────────────── Suppliers ───────
  async suppliers_list(p?: ListQueryParams) {
    return readList<SupplierRow>("suppliers", p, PREVIEW_CONFIG.suppliers);
  }
  async suppliers_get(id: ID) { return readOne<SupplierRow>("suppliers", id); }
  async suppliers_create() { return writesDisabled(); }
  async suppliers_update() { return writesDisabled(); }
  async suppliers_remove() { return writesDisabled(); }

  // ─────────────────────────────────────── Items ───────────
  async items_list(p?: ListQueryParams) {
    return readList<ItemRow>("items", p, PREVIEW_CONFIG.items);
  }
  async items_get(id: ID) { return readOne<ItemRow>("items", id); }
  async items_create() { return writesDisabled(); }
  async items_update() { return writesDisabled(); }
  async items_remove() { return writesDisabled(); }

  // ─────────────────────────────────────── Quotations ──────
  async quotations_list(p?: ListQueryParams) {
    return readList<QuotationRow>("quotations", p, PREVIEW_CONFIG.quotations);
  }
  async quotations_get(id: ID) {
    return readOne<QuotationRow & { lines: QuotationLineRow[] }>(
      "quotations", id, "*, lines:quotation_lines(*)",
    );
  }
  async quotations_create() { return writesDisabled(); }
  async quotations_update() { return writesDisabled(); }
  async quotations_remove() { return writesDisabled(); }
  async quotations_convertToInvoice() { return writesDisabled(WRITE_RPC_MAP.quotations_convertToInvoice); }

  // ─────────────────────────────────────── Invoices ────────
  async invoices_list(p?: ListQueryParams) {
    return readList<InvoiceRow>("invoices", p, PREVIEW_CONFIG.invoices);
  }
  async invoices_get(id: ID) {
    return readOne<InvoiceRow & { lines: InvoiceLineRow[] }>(
      "invoices", id, "*, lines:invoice_lines(*)",
    );
  }
  async invoices_create() { return writesDisabled(); }
  async invoices_update() { return writesDisabled(); }
  async invoices_issue() { return writesDisabled(WRITE_RPC_MAP.invoices_issue); }
  async invoices_cancel() { return writesDisabled(); }

  // ─────────────────────────────────────── Receipts ────────
  async receipts_list(p?: ListQueryParams) {
    return readList<ReceiptRow>("receipts", p, { searchable: ["number"], defaultSort: { by: "date", dir: "desc" } });
  }
  async receipts_get(id: ID) { return readOne<ReceiptRow>("receipts", id); }
  async receipts_create() { return writesDisabled(); }
  async receipts_createWithAutoApply() { return writesDisabled(WRITE_RPC_MAP.receipts_createWithAutoApply); }

  // ─────────────────────────────────────── Payments ────────
  async payments_list(p?: ListQueryParams) {
    return readList<PaymentRow>("payments", p, { searchable: ["number"], defaultSort: { by: "date", dir: "desc" } });
  }
  async payments_get(id: ID) { return readOne<PaymentRow>("payments", id); }
  async payments_create() { return writesDisabled(); }
  async payments_createWithPosting() { return writesDisabled(WRITE_RPC_MAP.payments_createWithPosting); }

  // ─────────────────────────────────── Chart of Accounts ───
  async accounts_list(p?: ListQueryParams) {
    return readList<ChartAccountRow>("chart_accounts", p, PREVIEW_CONFIG.accounts);
  }
  async accounts_get(id: ID) { return readOne<ChartAccountRow>("chart_accounts", id); }
  async accounts_create() { return writesDisabled(); }
  async accounts_update() { return writesDisabled(); }

  // ─────────────────────────────────────── Journal ─────────
  async journal_list(p?: ListQueryParams) {
    return readList<JournalEntryRow>("journal_entries", p, { searchable: ["number", "description"], defaultSort: { by: "date", dir: "desc" } });
  }
  async journal_get(id: ID) {
    return readOne<JournalEntryRow & { lines: JournalEntryLineRow[] }>(
      "journal_entries", id, "*, lines:journal_entry_lines(*)",
    );
  }
  async journal_postManual() { return writesDisabled(WRITE_RPC_MAP.journal_postManual); }

  // ─────────────────────────────────────── Tasks ───────────
  async tasks_list(p?: ListQueryParams) {
    return readList<TaskRow>("tasks", p, { searchable: ["title", "description"], defaultSort: { by: "created_at", dir: "desc" } });
  }
  async tasks_get(id: ID) { return readOne<TaskRow>("tasks", id); }
  async tasks_create() { return writesDisabled(); }
  async tasks_update() { return writesDisabled(); }
  async tasks_remove() { return writesDisabled(); }

  // ─────────────────────────────────────── Settings ────────
  async settings_getCompany()   { return readSingleton<SettingsCompanyRow>("settings_company"); }
  async settings_updateCompany() { return writesDisabled(); }
  async settings_getTax()       { return readSingleton<SettingsTaxRow>("settings_tax"); }
  async settings_updateTax()    { return writesDisabled(); }
  async settings_getNumbering() { return readSingleton<SettingsNumberingRow>("settings_numbering"); }
  async settings_updateNumbering() { return writesDisabled(); }

  // ─────────────────────────────────────── Audit Logs ──────
  async audit_list(p?: ListQueryParams) {
    return readList<AuditLogRow>("audit_logs", p, PREVIEW_CONFIG.audit_logs);
  }
  async audit_append() { return writesDisabled(); }

  // ─────────────────────────────────────── Reports ─────────
  // Read-only basic queries — guarded; full RPC implementations come later.
  async reports_vatSummary(_p?: ListQueryParams): Promise<Inert> { return notConfigured(); }
  async reports_arAging(_p?: ListQueryParams): Promise<Inert> { return notConfigured(); }
  async reports_apAging(_p?: ListQueryParams): Promise<Inert> { return notConfigured(); }
  async reports_profitLoss(_p?: ListQueryParams): Promise<Inert> { return notConfigured(); }
  async reports_cashflow(_p?: ListQueryParams): Promise<Inert> { return notConfigured(); }
  async reports_topCustomers(_p?: ListQueryParams): Promise<Inert> { return notConfigured(); }

  // ─────────────────────────────────────── System ──────────
  async system_dataIntegrity(): Promise<Inert> { return notConfigured(); }
  async system_exportSnapshot(): Promise<Inert> { return notConfigured(); }

  // ─────────────────────────────────────── DataAdapter ─────
  private notConfiguredOrNotReady(): AppError {
    const e = requireBackendConfigured();
    return e ?? ERRORS.notImplemented();
  }
  subscribe(): () => void { return () => {}; }
  getState(): State { throw this.notConfiguredOrNotReady(); }
  list<K extends EntityKey>(_key: K, _params?: ListQueryParams): never { throw this.notConfiguredOrNotReady(); }
  getById(): never { throw this.notConfiguredOrNotReady(); }
  create(): never { throw this.notConfiguredOrNotReady(); }
  update(): never { throw this.notConfiguredOrNotReady(); }
  remove(): never { throw this.notConfiguredOrNotReady(); }
  replaceState(): never { throw this.notConfiguredOrNotReady(); }
  resetDemo(_actor?: ID): never { throw this.notConfiguredOrNotReady(); }
  exportSnapshot(): MigrationSnapshot { throw this.notConfiguredOrNotReady(); }
}
