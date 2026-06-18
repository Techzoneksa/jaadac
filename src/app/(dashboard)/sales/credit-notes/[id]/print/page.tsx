import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PrintPage } from "@/components/print/PrintPage";
import { PrintHeader } from "@/components/print/PrintHeader";
import { PrintPartyInfo } from "@/components/print/PrintPartyInfo";
import { PrintItemsTable } from "@/components/print/PrintItemsTable";
import { PrintTotals } from "@/components/print/PrintTotals";
import { PrintNotes } from "@/components/print/PrintNotes";
import { PrintSignatures } from "@/components/print/PrintSignatures";
import { PrintFooter } from "@/components/print/PrintFooter";

export default async function CreditNotePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div className="flex items-center justify-center min-h-screen"><p className="text-red-600">يرجى تسجيل الدخول</p></div>;

  const { data: cn } = await supabase
    .from("credit_notes")
    .select("*, credit_note_lines(*), customers!credit_notes_customer_id_fkey(name_ar, name_en, vat)")
    .eq("id", id)
    .eq("tenant_id", user.id)
    .single();
  const { data: company } = await supabase.from("company_settings").select("*").eq("tenant_id", user.id).maybeSingle();
  if (!cn) return notFound();

  const customer = cn.customers ? { name: cn.customers.name_ar || cn.customers.name_en, vat: cn.customers.vat } : null;
  const lines = (cn.credit_note_lines || []).map((l: { description: string; qty: number; unit_price: number; vat_rate: number; total: number }) => ({
    description: l.description, qty: l.qty, unit_price: l.unit_price, vat_rate: l.vat_rate, total: l.total,
  }));

  return (
    <PrintPage>
      <PrintHeader company={company} title="إشعار دائن" number={cn.number} date={cn.date} status={cn.status} />
      <PrintPartyInfo label="بيانات العميل" party={customer} />
      <PrintItemsTable lines={lines} />
      <PrintTotals subtotal={cn.subtotal} vatTotal={cn.vat_total} total={cn.total} />
      <PrintNotes notes={cn.notes} />
      <PrintSignatures />
      <PrintFooter />
    </PrintPage>
  );
}

export const dynamic = "force-dynamic";
