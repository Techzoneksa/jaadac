import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function handle<T>(fn: () => Promise<Response | T>): Promise<Response> {
  try { const r = await fn(); if (r instanceof Response) return r; return NextResponse.json(r); }
  catch (e) { console.error("API Error:", e); return NextResponse.json({ error: e instanceof Error ? e.message : "Internal server error" }, { status: 500 }); }
}

type InvoiceRow = Record<string, unknown> & { customers?: { name_ar: string } | null; suppliers?: { name_ar: string } | null };
type InvoiceLineInput = { invoice_id: string; description: string; qty: number; unit_price: number; vat_rate: number; total: number };

export async function GET(req: NextRequest) {
  return handle(async () => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "sale";
    const id = url.searchParams.get("id");

    if (id) {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, invoice_lines(*), customers!invoices_customer_id_fkey(name_ar), suppliers!invoices_supplier_id_fkey(name_ar)")
        .eq("id", id)
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data);
    }

    const { data, error } = await supabase
      .from("invoices")
      .select(type === "sale"
        ? "*, customers!invoices_customer_id_fkey(name_ar)"
        : "*, suppliers!invoices_supplier_id_fkey(name_ar)"
      )
      .eq("tenant_id", user.id)
      .eq("type", type)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const mapped = (data as InvoiceRow[]).map((r) => ({
      ...r,
      customer_name: r.customers?.name_ar || r.suppliers?.name_ar || "",
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

    const { data, error } = await supabase
      .from("invoices")
      .insert({ ...body, tenant_id: user.id })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    if (lines?.length) {
      const { error: linesError } = await supabase
        .from("invoice_lines")
        .insert(lines.map((l: InvoiceLineInput) => ({ ...l, invoice_id: data.id })));

      if (linesError) return NextResponse.json({ error: linesError.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  });
}

const UPDATE_ALLOWED = ["date", "status", "notes", "customer_id", "supplier_id", "due_date", "subtotal", "vat_total", "total", "paid_amount"];

export async function PUT(req: NextRequest) {
  return handle(async () => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const { lines, ...body } = await req.json();

    // Only allow known columns
    const safe: Record<string, unknown> = {};
    for (const key of UPDATE_ALLOWED) {
      if (key in body) safe[key] = body[key];
    }

    const { data, error } = await supabase
      .from("invoices")
      .update(safe)
      .eq("id", id)
      .eq("tenant_id", user.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    if (lines) {
      await supabase.from("invoice_lines").delete().eq("invoice_id", id);
      if (lines.length) {
        const { error: linesError } = await supabase
          .from("invoice_lines")
          .insert(lines.map((l: InvoiceLineInput) => ({ ...l, invoice_id: id })));
        if (linesError) return NextResponse.json({ error: linesError.message }, { status: 400 });
      }
    }

    return NextResponse.json(data);
  });
}
