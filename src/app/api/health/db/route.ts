import { NextResponse } from "next/server";

const TABLES = [
  "customers", "suppliers", "items", "invoices", "invoice_lines",
  "quotations", "receipts", "payments", "accounts", "journal",
  "tax_rates", "company_settings",
] as const;

interface TableResult {
  status: string;
  code?: string;
  message?: string;
  hint?: string;
}

function classifyError(body: { code?: string; message?: string; hint?: string; details?: string }): string {
  const m = (body.message || "").toLowerCase();
  if (m.includes("does not exist") || m.includes("relation") || m.includes("could not find")) return "MISSING";
  if (m.includes("permission") || m.includes("policy") || m.includes("not allowed") || m.includes("violates row-level security")) return "RLS_DENIED";
  if (body.code === "42P01") return "MISSING";
  if (body.code === "42501") return "RLS_DENIED";
  if (body.code === "28P01" || m.includes("invalid api key")) return "INVALID_KEY";
  return "UNKNOWN_DB_ERROR";
}

export async function GET() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const srKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

  const supabaseUrlExists = rawUrl.startsWith("https://");
  const supabaseKeyExists = rawKey.length > 10;
  const projectRef = rawUrl ? rawUrl.replace("https://", "").split(".")[0] : "";

  const legacyVars: string[] = [];
  if (process.env.SUPABASE_PROJECT_ID) legacyVars.push("SUPABASE_PROJECT_ID");
  if (process.env.SUPABASE_PUBLISHABLE_KEY) legacyVars.push("SUPABASE_PUBLISHABLE_KEY");
  if (process.env.VITE_SUPABASE_PROJECT_ID) legacyVars.push("VITE_SUPABASE_PROJECT_ID");
  if (process.env.VITE_SUPABASE_URL) legacyVars.push("VITE_SUPABASE_URL");
  if (process.env.VITE_SUPABASE_PUBLISHABLE_KEY) legacyVars.push("VITE_SUPABASE_PUBLISHABLE_KEY");
  const legacyProjectRefs: string[] = [];
  for (const v of ["SUPABASE_PROJECT_ID", "VITE_SUPABASE_PROJECT_ID"]) {
    const val = process.env[v];
    if (val && val !== projectRef) legacyProjectRefs.push(`${v}=${val}`);
  }

  let restReachable = false;
  let restStatus = "";
  let restBody: Record<string, unknown> = {};
  const tables: Record<string, TableResult> = {};
  let overallAuthStatus = "";

  try {
    const url = new URL("/rest/v1/", rawUrl);
    url.searchParams.set("select", "id");
    url.searchParams.set("limit", "1");
    const resp = await fetch(url.toString(), {
      headers: { apikey: rawKey, Authorization: `Bearer ${rawKey}` },
    });
    restReachable = true;
    restStatus = `${resp.status} ${resp.statusText}`;
    if (resp.status === 200) {
      overallAuthStatus = "ANON_OK";
    } else if (resp.status === 401) {
      overallAuthStatus = "ANON_UNAUTHORIZED";
      try { restBody = await resp.json(); } catch { /* ignore */ }
    } else if (resp.status === 406) {
      overallAuthStatus = "ANON_OK_EMPTY";
    } else {
      overallAuthStatus = `ANON_HTTP_${resp.status}`;
    }
  } catch (e) {
    restReachable = false;
    restStatus = e instanceof Error ? e.message : "Unknown network error";
    overallAuthStatus = "NETWORK_ERROR";
  }

  for (const table of TABLES) {
    try {
      const resp = await fetch(new URL(`/rest/v1/${table}?select=id&limit=1`, rawUrl).toString(), {
        headers: { apikey: rawKey, Authorization: `Bearer ${rawKey}` },
      });
      if (resp.status === 200 || resp.status === 406) {
        tables[table] = { status: "OK" };
      } else {
        let body: Record<string, unknown> = {};
        try { body = await resp.json(); } catch { /* ignore */ }
        const msg = typeof body.message === "string" ? body.message : "";
        const hint = typeof body.hint === "string" ? body.hint : "";
        const code = typeof body.code === "string" ? body.code : String(resp.status);
        const category = classifyError({ code, message: msg, hint });
        tables[table] = { status: category, code, message: msg, hint: body.hint as string | undefined };
      }
    } catch (e) {
      tables[table] = { status: "NETWORK_ERROR", message: e instanceof Error ? e.message : "Unknown" };
    }
  }

  const okCount = Object.values(tables).filter((t) => t.status === "OK").length;
  const missingCount = Object.values(tables).filter((t) => t.status === "MISSING").length;
  const rlsCount = Object.values(tables).filter((t) => t.status === "RLS_DENIED").length;

  const overall =
    !supabaseUrlExists ? "NO_SUPABASE_URL" :
    !supabaseKeyExists ? "NO_ANON_KEY" :
    overallAuthStatus === "NETWORK_ERROR" ? "NETWORK_ERROR" :
    overallAuthStatus === "ANON_UNAUTHORIZED" ? "INVALID_KEY" :
    missingCount === TABLES.length ? "ALL_TABLES_MISSING" :
    missingCount > 0 ? "SOME_TABLES_MISSING" :
    rlsCount === TABLES.length ? "ALL_RLS_DENIED" :
    okCount === TABLES.length ? "HEALTHY" :
    "PARTIAL";

  return NextResponse.json({
    status: overall,
    env: {
      supabaseUrlExists,
      supabaseKeyExists,
      projectRef,
      siteUrl: siteUrl || "(not set)",
      hasLegacyLovableEnv: legacyVars.length > 0,
      legacyVars,
      legacyProjectRefMismatches: legacyProjectRefs,
      hasConflictingSupabaseEnv: legacyProjectRefs.length > 0,
      serviceRoleKeyExists: srKey.length > 10,
    },
    rest: {
      reachable: restReachable,
      httpStatus: restStatus,
      authMode: overallAuthStatus,
    },
    tables,
    summary: {
      total: TABLES.length,
      ok: okCount,
      missing: missingCount,
      rlsDenied: rlsCount,
      errors: TABLES.length - okCount,
    },
  });
}
