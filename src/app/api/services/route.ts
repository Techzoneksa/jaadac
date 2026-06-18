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
    const category_id = req.nextUrl.searchParams.get("category_id");
    const search = req.nextUrl.searchParams.get("search");
    let query = supabase.from("items").select("*").eq("tenant_id", user.id).eq("type", "service").order("name_ar");
    if (category_id) query = query.eq("service_category_id", category_id);
    if (search) query = query.or(`name_ar.ilike.%${search}%,name_en.ilike.%${search}%`);
    const { data, error } = await query;
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
    const { data, error } = await supabase.from("items").insert({ ...body, tenant_id: user.id, type: "service" }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data, { status: 201 });
  });
}
