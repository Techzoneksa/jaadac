import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function handle<T>(fn: () => Promise<Response | T>): Promise<Response> {
  try { const r = await fn(); if (r instanceof Response) return r; return NextResponse.json(r); }
  catch (e) { console.error("API Error:", e); return NextResponse.json({ error: e instanceof Error ? e.message : "Internal server error" }, { status: 500 }); }
}

export async function GET(req: Request) {
  return handle(async () => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const typeFilter = searchParams.get("type") || "";
    const statusFilter = searchParams.get("status") || "";

    let query = supabase
      .from("accounts")
      .select("*")
      .eq("tenant_id", user.id);

    if (search) {
      query = query.or(`number.ilike.%${search}%,name_ar.ilike.%${search}%,name_en.ilike.%${search}%`);
    }

    if (typeFilter && typeFilter !== "all") {
      query = query.eq("type", typeFilter);
    }

    if (statusFilter && statusFilter !== "all") {
      if (statusFilter === "system") {
        query = query.eq("is_system", true);
      } else {
        query = query.eq("status", statusFilter);
      }
    }

    const { data, error } = await query.order("number", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    delete body.id;
    delete body.tenant_id;
    delete body.created_at;

    // Nullify empty parent
    if (body.parent === "" || body.parent === "none") body.parent = null;

    const { data, error } = await supabase
      .from("accounts")
      .insert({ ...body, tenant_id: user.id })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data, { status: 201 });
  });
}
