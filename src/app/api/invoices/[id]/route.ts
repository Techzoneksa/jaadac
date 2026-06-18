import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function handle<T>(fn: () => Promise<Response | T>): Promise<Response> {
  try { const r = await fn(); if (r instanceof Response) return r; return NextResponse.json(r); }
  catch (e) { console.error("API Error:", e); return NextResponse.json({ error: e instanceof Error ? e.message : "Internal server error" }, { status: 500 }); }
}

const INVOICE_UPDATE_COLUMNS = ["date", "status", "notes", "customer_id", "supplier_id", "due_date"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    // Only allow known columns — strip customer_name/supplier_name etc.
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

    // Fetch invoice + lines + customer/supplier info + receipts (payments)
    const { data: inv, error } = await supabase
      .from("invoices")
      .select("*, invoice_lines(*), customers!invoices_customer_id_fkey(name_ar, name_en, vat, mobile, email, city, address), suppliers!invoices_supplier_id_fkey(name_ar, name_en, vat, mobile, email, city, address)")
      .eq("id", id)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Fetch related receipts (payments)
    const { data: payments } = await supabase
      .from("receipts")
      .select("*")
      .eq("invoice_id", id)
      .order("created_at", { ascending: false });

    return NextResponse.json({ ...inv, payments: payments || [] });
  });
}
