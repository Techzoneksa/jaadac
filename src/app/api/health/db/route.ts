import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TABLES = [
  "customers", "suppliers", "items", "invoices", "invoice_lines",
  "quotations", "receipts", "payments", "accounts", "journal",
  "tax_rates", "company_settings",
] as const;

export async function GET() {
  let supabaseUrl = false;
  let supabaseKey = false;
  let projectRef = "";
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    supabaseUrl = url.startsWith("https://");
    supabaseKey = key.length > 10;
    projectRef = url ? url.replace("https://", "").split(".")[0] : "";
  } catch { /* env check failed silently */ }

  let authOk = false;
  let authError = "";
  let tables: Record<string, string> = {};

  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr) {
      authError = authErr.message;
    } else if (!user) {
      authError = "No authenticated user";
    } else {
      authOk = true;
      for (const table of TABLES) {
        try {
          const { error } = await supabase.from(table).select("id", { count: "exact", head: true }).limit(1);
          if (error) {
            if (error.message.includes("does not exist") || error.message.includes("relation")) {
              tables[table] = "MISSING";
            } else if (error.message.includes("permission") || error.message.includes("policy")) {
              tables[table] = "RLS_DENIED";
            } else {
              tables[table] = `ERROR: ${error.message}`;
            }
          } else {
            tables[table] = "OK";
          }
        } catch (e) {
          tables[table] = `CRASH: ${e instanceof Error ? e.message : "Unknown"}`;
        }
      }
    }
  } catch (e) {
    authError = e instanceof Error ? e.message : "Unknown error creating client";
  }

  const missingTables = Object.entries(tables).filter(([, s]) => s !== "OK").map(([t]) => t);
  const overall = !supabaseUrl ? "NO_SUPABASE_URL" :
    !supabaseKey ? "NO_ANON_KEY" :
    !authOk ? "AUTH_FAILED" :
    missingTables.length === TABLES.length ? "ALL_TABLES_MISSING" :
    missingTables.length > 0 ? "SOME_TABLES_MISSING" :
    "HEALTHY";

  return NextResponse.json({
    status: overall,
    env: { supabaseUrl: supabaseUrl, supabaseKey: supabaseKey, projectRef },
    auth: { ok: authOk, error: authError },
    tables,
    summary: {
      total: TABLES.length,
      ok: Object.values(tables).filter((s) => s === "OK").length,
      missing: missingTables.length,
    },
  });
}
