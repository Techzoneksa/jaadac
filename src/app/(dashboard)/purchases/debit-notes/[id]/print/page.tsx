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

export default async function DebitNotePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div className="flex items-center justify-center min-h-screen"><p className="text-red-600">يرجى تسجيل الدخول</p></div>;

  const { data: dn } = await supabase
    .from("debit_notes")
    .select("*, debit_note_lines(*), suppliers!debit_notes_supplier_id_fkey(name_ar, name_en, vat)")
    .eq("id", id)
    .eq("tenant_id", user.id)
    .single();
  const { data: company } = await supabase.from("company_settings").select("*").eq("tenant_id", user.id).maybeSingle();
  if (!dn) return notFound();

  const supplier = dn.suppliers ? { name: dn.suppliers.name_ar || dn.suppliers.name_en, vat: dn.suppliers.vat } : null;
  const lines = (dn.debit_note_lines || []).map((l: { description: string; qty: number; unit_price: number; vat_rate: number; total: number }) => ({
    description: l.description, qty: l.qty, unit_price: l.unit_price, vat_rate: l.vat_rate, total: l.total,
  }));

  return (
    <PrintPage>
      <PrintHeader company={company} title="إشعار مدين" number={dn.number} date={dn.date} status={dn.status} />
      <PrintPartyInfo label="بيانات المورد" party={supplier} />
      <PrintItemsTable lines={lines} />
      <PrintTotals subtotal={dn.subtotal} vatTotal={dn.vat_total} total={dn.total} />
      <PrintNotes notes={dn.notes} />
      <PrintSignatures />
      <PrintFooter />
    </PrintPage>
  );
}

export const dynamic = "force-dynamic";
