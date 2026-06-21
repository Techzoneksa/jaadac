import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function handle<T>(fn: () => Promise<Response | T>): Promise<Response> {
  try { const r = await fn(); if (r instanceof Response) return r; return NextResponse.json(r); }
  catch (e) { console.error("API Error:", e); return NextResponse.json({ error: e instanceof Error ? e.message : "Internal server error" }, { status: 500 }); }
}

const INVOICE_UPDATE_COLUMNS = ["date", "status", "notes", "customer_id", "supplier_id", "due_date", "discount", "paid_amount", "subtotal", "vat_total", "total"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const safe: Record<string, unknown> = {};
    for (const key of INVOICE_UPDATE_COLUMNS) {
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
    return NextResponse.json(data);
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: inv, error } = await supabase
      .from("invoices")
      .select(`
        *,
        invoice_lines(*),
        customers!invoices_customer_id_fkey(
          name_ar, name_en, type, vat, cr, unified_no,
          mobile, phone, email, city, country, district,
          street, building_no, additional_no, postal_code,
          address, project_name, contact_person, customer_number
        )
      `)
      .eq("id", id)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data: company } = await supabase
      .from("company_settings")
      .select("*")
      .eq("tenant_id", user.id)
      .maybeSingle();

    const { data: payments } = await supabase
      .from("receipts")
      .select("*")
      .eq("invoice_id", id)
      .order("created_at", { ascending: false });

    return NextResponse.json({ ...inv, payments: payments || [], company });
  });
}