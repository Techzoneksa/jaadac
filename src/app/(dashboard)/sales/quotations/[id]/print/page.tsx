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

interface QuotationLine { description: string; qty: number; unit_price: number; vat_rate: number; total: number; }
interface QuotationDB { number: string; date: string; status: string; subtotal: number; vat_total: number; total: number; notes?: string; customer_name?: string; customers?: { name_ar?: string; name_en?: string; vat?: string; mobile?: string; email?: string; city?: string; address?: string } | null; quotation_lines?: QuotationLine[]; }

export default async function QuotationPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div className="flex items-center justify-center min-h-screen"><p className="text-red-600">يرجى تسجيل الدخول</p></div>;

  const { data: q } = await supabase
    .from("quotations")
    .select("*, quotation_lines(*), customers!quotations_customer_id_fkey(name_ar, name_en, vat, mobile, email, city, address)")
    .eq("id", id)
    .eq("tenant_id", user.id)
    .single();
  const { data: company } = await supabase.from("company_settings").select("*").eq("tenant_id", user.id).maybeSingle();
  if (!q) return notFound();

  const customer = (q as QuotationDB).customers ? {
    name: (q as QuotationDB).customers!.name_ar || (q as QuotationDB).customers!.name_en,
    vat: (q as QuotationDB).customers!.vat,
    mobile: (q as QuotationDB).customers!.mobile,
    email: (q as QuotationDB).customers!.email,
    address: (q as QuotationDB).customers!.address,
  } : null;

  const lines = ((q as QuotationDB).quotation_lines || []).map((l: QuotationLine) => ({
    description: l.description, qty: l.qty, unit_price: l.unit_price, vat_rate: l.vat_rate, total: l.total,
  }));

  return (
    <PrintPage>
      <PrintHeader company={company} title="عرض سعر" number={q.number} date={q.date} status={q.status} />
      <PrintPartyInfo label="بيانات العميل" party={customer} />
      <PrintItemsTable lines={lines} />
      <PrintTotals subtotal={q.subtotal} vatTotal={q.vat_total} total={q.total} />
      <PrintNotes notes={q.notes} />
      <PrintSignatures />
      <PrintFooter />
    </PrintPage>
  );
}

export const dynamic = "force-dynamic";
