import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function handle<T>(fn: () => Promise<Response | T>): Promise<Response> {
  try { const r = await fn(); if (r instanceof Response) return r; return NextResponse.json(r); }
  catch (e) { console.error("API Error:", e); return NextResponse.json({ error: e instanceof Error ? e.message : "Internal server error" }, { status: 500 }); }
}

type CNLineInput = { credit_note_id: string; description: string; qty: number; unit_price: number; vat_rate: number; total: number };

export async function GET(req: NextRequest) {
  return handle(async () => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (id) {
      const { data, error } = await supabase.from("credit_notes").select("*, credit_note_lines(*)").eq("id", id).single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data);
    }
    const { data, error } = await supabase
      .from("credit_notes")
      .select("*, customers!credit_notes_customer_id_fkey(name_ar)")
      .eq("tenant_id", user.id)
      .order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const mapped = (data as Record<string, unknown>[]).map((r) => ({
      ...r, customer_name: (r.customers as Record<string, unknown> | null)?.name_ar || "",
    }));
    return NextResponse.json(mapped);
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { lines, ...body } = await req.json();
    const { data, error } = await supabase.from("credit_notes").insert({ ...body, tenant_id: user.id }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (lines?.length) {
      const { error: linesError } = await supabase.from("credit_note_lines").insert(lines.map((l: CNLineInput) => ({ ...l, credit_note_id: data.id })));
      if (linesError) return NextResponse.json({ error: linesError.message }, { status: 400 });
    }
    return NextResponse.json(data, { status: 201 });
  });
}
