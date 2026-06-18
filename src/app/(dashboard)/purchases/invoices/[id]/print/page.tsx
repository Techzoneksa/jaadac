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

export default async function PurchaseInvoicePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div className="flex items-center justify-center min-h-screen"><p className="text-red-600">يرجى تسجيل الدخول</p></div>;

  const { data: inv } = await supabase
    .from("invoices")
    .select("*, invoice_lines(*), suppliers!invoices_supplier_id_fkey(name_ar, name_en, vat, mobile, email, city, address)")
    .eq("id", id)
    .eq("tenant_id", user.id)
    .single();
  const { data: company } = await supabase.from("company_settings").select("*").eq("tenant_id", user.id).maybeSingle();
  if (!inv) return notFound();

  const supplier = inv.suppliers ? {
    name: inv.suppliers.name_ar || inv.suppliers.name_en,
    vat: inv.suppliers.vat,
    mobile: inv.suppliers.mobile,
    email: inv.suppliers.email,
    address: inv.suppliers.address,
  } : null;

  return (
    <PrintPage>
      <PrintHeader company={company} title="فاتورة مشتريات" number={inv.number} date={inv.date} status={inv.status} />
      <PrintPartyInfo label="بيانات المورد" party={supplier} />
      <PrintItemsTable lines={inv.invoice_lines || []} />
      <PrintTotals subtotal={inv.subtotal} vatTotal={inv.vat_total} total={inv.total} />
      <PrintNotes notes={inv.notes} />
      <PrintSignatures />
      <PrintFooter />
    </PrintPage>
  );
}

export const dynamic = "force-dynamic";
