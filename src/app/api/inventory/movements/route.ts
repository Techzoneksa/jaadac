import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function handle<T>(fn: () => Promise<Response | T>): Promise<Response> {
  try { const r = await fn(); if (r instanceof Response) return r; return NextResponse.json(r); }
  catch (e) { console.error("API Error:", e); return NextResponse.json({ error: e instanceof Error ? e.message : "Internal server error" }, { status: 500 }); }
}

export async function GET(req: NextRequest) {
  return handle(async () => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const item_id = req.nextUrl.searchParams.get("item_id");
    const branch_id = req.nextUrl.searchParams.get("branch_id");
    const movement_type = req.nextUrl.searchParams.get("movement_type");
    const limitParam = req.nextUrl.searchParams.get("limit");

    let query = supabase.from("inventory_movements").select("*").eq("tenant_id", user.id)
      .order("created_at", { ascending: false });
    if (item_id) query = query.eq("item_id", item_id);
    if (branch_id) query = query.eq("branch_id", branch_id);
    if (movement_type) query = query.eq("movement_type", movement_type);
    if (limitParam) query = query.limit(parseInt(limitParam));

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  });
}
