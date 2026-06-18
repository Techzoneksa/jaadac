import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function handle<T>(fn: () => Promise<Response | T>): Promise<Response> {
  try { const r = await fn(); if (r instanceof Response) return r; return NextResponse.json(r); }
  catch (e) { console.error("API Error:", e); return NextResponse.json({ error: e instanceof Error ? e.message : "Internal server error" }, { status: 500 }); }
}

const QTN_COLUMNS = ["date", "status", "notes", "customer_id", "subtotal", "vat_total", "total", "lines", "tenant_id", "number"];

function pickBody(body: Record<string, unknown>, insert?: boolean): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const key of QTN_COLUMNS) {
    if (key in body && key !== "tenant_id") safe[key] = body[key];
    if (key === "tenant_id" && insert) safe.tenant_id = body.tenant_id;
  }
  return safe;
}

type QtnRow = Record<string, unknown> & { customers?: { name_ar: string } | null };

export async function GET(req: NextRequest) {
  return handle(async () => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = req.nextUrl.searchParams.get("id");

    if (id) {
      const { data, error } = await supabase
        .from("quotations")
        .select("*")
        .eq("id", id)
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data);
    }

    const { data, error } = await supabase
      .from("quotations")
      .select("*, customers!quotations_customer_id_fkey(name_ar)")
      .eq("tenant_id", user.id)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const mapped = (data as QtnRow[]).map((r) => ({
      ...r,
      customer_name: r.customers?.name_ar || "",
    }));

    return NextResponse.json(mapped);
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { data, error } = await supabase
      .from("quotations")
      .insert({ ...pickBody(body, true), tenant_id: user.id })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data, { status: 201 });
  });
}

export async function PUT(req: NextRequest) {
  return handle(async () => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const body = await req.json();
    const { data, error } = await supabase
      .from("quotations")
      .update(pickBody(body))
      .eq("id", id)
      .eq("tenant_id", user.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  });
}
