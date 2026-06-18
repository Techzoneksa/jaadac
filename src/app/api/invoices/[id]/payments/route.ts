import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function handle<T>(fn: () => Promise<Response | T>): Promise<Response> {
  try { const r = await fn(); if (r instanceof Response) return r; return NextResponse.json(r); }
  catch (e) { console.error("API Error:", e); return NextResponse.json({ error: e instanceof Error ? e.message : "Internal server error" }, { status: 500 }); }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const invoiceId = (await params).id;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { amount, payment_method, date, notes } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "المبلغ غير صالح" }, { status: 400 });
    }

    // Get invoice
    const { data: inv, error: invErr } = await supabase
      .from("invoices")
      .select("id, total, paid_amount, status, customer_id, number, tenant_id")
      .eq("id", invoiceId)
      .eq("tenant_id", user.id)
      .single();

    if (invErr || !inv) {
      return NextResponse.json({ error: "الفاتورة غير موجودة" }, { status: 404 });
    }

    if (inv.status === "cancelled") {
      return NextResponse.json({ error: "لا يمكن الدفع لفاتورة ملغية" }, { status: 400 });
    }

    const currentPaid = Number(inv.paid_amount || 0);
    const total = Number(inv.total || 0);
    const remaining = total - currentPaid;

    if (amount > remaining) {
      return NextResponse.json({ error: `المبلغ يتجاوز المتبقي (${remaining.toFixed(2)} ر.س)` }, { status: 400 });
    }

    const newPaid = currentPaid + amount;

    // Create receipt
    const receiptNumber = `RCP-${Date.now()}`;
    const { data: receipt, error: rcpErr } = await supabase
      .from("receipts")
      .insert({
        tenant_id: user.id,
        customer_id: inv.customer_id,
        invoice_id: invoiceId,
        number: receiptNumber,
        date: date || new Date().toISOString().slice(0, 10),
        amount,
        payment_method: payment_method || "cash",
        notes: notes || `دفعة للفاتورة #${inv.number}`,
        status: "confirmed",
      })
      .select()
      .single();

    if (rcpErr) {
      return NextResponse.json({ error: rcpErr.message }, { status: 400 });
    }

    // Update invoice paid_amount and status
    const newStatus = newPaid >= total ? "confirmed" : inv.status;

    const { error: updErr } = await supabase
      .from("invoices")
      .update({ paid_amount: newPaid, status: newStatus })
      .eq("id", invoiceId)
      .eq("tenant_id", user.id);

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 400 });
    }

    return NextResponse.json({
      receipt,
      invoice_id: invoiceId,
      paid_amount: newPaid,
      remaining: total - newPaid,
      is_fully_paid: newPaid >= total,
    }, { status: 201 });
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const invoiceId = (await params).id;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("receipts")
      .select("*, customers(name_ar)")
      .eq("invoice_id", invoiceId)
      .eq("tenant_id", user.id)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  });
}

export const dynamic = "force-dynamic";
