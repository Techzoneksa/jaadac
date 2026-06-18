import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function handle<T>(fn: () => Promise<Response | T>): Promise<Response> {
  try { const r = await fn(); if (r instanceof Response) return r; return NextResponse.json(r); }
  catch (e) { console.error("API Error:", e); return NextResponse.json({ error: e instanceof Error ? e.message : "Internal server error" }, { status: 500 }); }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data, error } = await supabase.from("items").select("*").eq("id", id).eq("tenant_id", user.id).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "المنتج غير موجود" }, { status: 404 });
    return NextResponse.json(data);
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const { data, error } = await supabase.from("items").update(body).eq("id", id).eq("tenant_id", user.id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { count } = await supabase.from("invoice_lines").select("*", { count: "exact", head: true }).eq("item_id", id);
    if (count && count > 0) return NextResponse.json({ error: "لا يمكن حذف المنتج، يوجد فواتير مرتبطة به" }, { status: 400 });
    const { error } = await supabase.from("items").delete().eq("id", id).eq("tenant_id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  });
}
