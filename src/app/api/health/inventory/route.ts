import { NextResponse } from "next/server";

const TABLES = [
  "inventory_branches",
  "inventory_categories",
  "service_categories",
  "inventory_movements",
  "inventory_counts",
  "inventory_count_lines",
  "manufacturing_cards",
  "manufacturing_card_lines",
];

const ITEM_COLUMNS = [
  "category_id", "barcode", "unit", "cost",
  "track_inventory", "current_stock", "reorder_level",
];

async function handle<T>(fn: () => Promise<Response | T>): Promise<Response> {
  try { const r = await fn(); if (r instanceof Response) return r; return NextResponse.json(r); }
  catch (e) { console.error("API Error:", e); return NextResponse.json({ error: e instanceof Error ? e.message : "Internal server error" }, { status: 500 }); }
}

export async function GET() {
  return handle(async () => {
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

    const tables: Record<string, { status: string }> = {};
    for (const table of TABLES) {
      try {
        const resp = await fetch(new URL(`/rest/v1/${table}?select=id&limit=1`, rawUrl).toString(), {
          headers: { apikey: rawKey, Authorization: `Bearer ${rawKey}` },
        });
        tables[table] = { status: resp.status === 200 || resp.status === 406 ? "OK" : "MISSING" };
      } catch {
        tables[table] = { status: "MISSING" };
      }
    }

    const itemsColumns: Record<string, { status: string }> = {};
    for (const col of ITEM_COLUMNS) {
      try {
        const resp = await fetch(new URL(`/rest/v1/items?select=${col}&limit=1`, rawUrl).toString(), {
          headers: { apikey: rawKey, Authorization: `Bearer ${rawKey}` },
        });
        itemsColumns[col] = { status: resp.status === 200 || resp.status === 406 ? "OK" : "MISSING" };
      } catch {
        itemsColumns[col] = { status: "MISSING" };
      }
    }

    const okCount = Object.values(tables).filter((t) => t.status === "OK").length;
    const missingCount = Object.values(tables).filter((t) => t.status === "MISSING").length;

    return NextResponse.json({
      status: missingCount === 0 ? "HEALTHY" : "SOME_TABLES_MISSING",
      tables,
      items_columns: itemsColumns,
      summary: { total: TABLES.length, ok: okCount, missing: missingCount },
    });
  });
}
