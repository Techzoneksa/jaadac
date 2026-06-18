import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function handle<T>(fn: () => Promise<Response | T>): Promise<Response> {
  try { const r = await fn(); if (r instanceof Response) return r; return NextResponse.json(r); }
  catch (e) { console.error("API Error:", e); return NextResponse.json({ error: e instanceof Error ? e.message : "Internal server error" }, { status: 500 }); }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    // Remove fields that shouldn't be updated directly
    delete body.id;
    delete body.tenant_id;
    delete body.created_at;

    // Check account ownership
    const { data: existing } = await supabase.from("accounts").select("id,tenant_id,is_system").eq("id", id).single();
    if (!existing) return NextResponse.json({ error: "Account not found" }, { status: 404 });
    if (existing.tenant_id !== user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Prevent changing is_system from API
    delete body.is_system;
    delete body.locked;

    const { data, error } = await supabase.from("accounts").update(body).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    // Check existence and ownership
    const { data: existing } = await supabase.from("accounts").select("id,tenant_id,is_system,locked").eq("id", id).single();
    if (!existing) return NextResponse.json({ error: "Account not found" }, { status: 404 });
    if (existing.tenant_id !== user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (existing.is_system || existing.locked) return NextResponse.json({ error: "Cannot delete a system/locked account" }, { status: 403 });

    // Check if account has children
    const { count: childCount } = await supabase.from("accounts").select("id", { count: "exact", head: true }).eq("parent", id);
    if (childCount && childCount > 0) return NextResponse.json({ error: "Cannot delete an account with sub-accounts. Move or delete them first." }, { status: 400 });

    // Check if account has journal entries
    const { count: jlCount } = await supabase.from("journal_lines").select("id", { count: "exact", head: true }).eq("account_id", id);
    if (jlCount && jlCount > 0) return NextResponse.json({ error: "Cannot delete an account with journal entries" }, { status: 400 });

    const { error } = await supabase.from("accounts").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  });
}
