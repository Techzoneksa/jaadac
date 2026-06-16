import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "sale";
  const id = url.searchParams.get("id");

  if (id) {
    const { data, error } = await supabase
      .from("invoices")
      .select("*, invoice_lines(*)")
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

  const mapped = data.map((r: any) => ({
    ...r,
    customer_name: r.customers?.name_ar || r.suppliers?.name_ar || "",
  }));

  return NextResponse.json(mapped);
}

export async function POST(req: Request) {
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
      .insert(lines.map((l: any) => ({ ...l, invoice_id: data.id })));

    if (linesError) return NextResponse.json({ error: linesError.message }, { status: 400 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const { lines, ...body } = await req.json();

  const { data, error } = await supabase
    .from("invoices")
    .update(body)
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
        .insert(lines.map((l: any) => ({ ...l, invoice_id: id })));
      if (linesError) return NextResponse.json({ error: linesError.message }, { status: 400 });
    }
  }

  return NextResponse.json(data);
}
