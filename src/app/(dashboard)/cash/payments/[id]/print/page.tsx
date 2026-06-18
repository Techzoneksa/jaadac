import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PrintPage } from "@/components/print/PrintPage";
import { PrintHeader } from "@/components/print/PrintHeader";
import { PrintPartyInfo } from "@/components/print/PrintPartyInfo";
import { PrintNotes } from "@/components/print/PrintNotes";
import { PrintSignatures } from "@/components/print/PrintSignatures";
import { PrintFooter } from "@/components/print/PrintFooter";
import { formatCurrency } from "@/components/print/format";

export default async function PaymentPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div className="flex items-center justify-center min-h-screen"><p className="text-red-600">يرجى تسجيل الدخول</p></div>;

  const { data: p } = await supabase
    .from("payments")
    .select("*, suppliers!payments_supplier_id_fkey(name_ar, name_en, vat)")
    .eq("id", id)
    .eq("tenant_id", user.id)
    .single();
  const { data: company } = await supabase.from("company_settings").select("*").eq("tenant_id", user.id).maybeSingle();
  if (!p) return notFound();

  const supplier = p.suppliers ? { name: p.suppliers.name_ar || p.suppliers.name_en, vat: p.suppliers.vat } : null;

  return (
    <PrintPage>
      <PrintHeader company={company} title="سند صرف" number={p.number} date={p.date} status={p.status} />
      <PrintPartyInfo label="بيانات المورد" party={supplier} />
      <div style={{ margin: "20px 0", padding: 24, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, textAlign: "center" }}>
        <p style={{ fontSize: "8pt", color: "#64748b", margin: "0 0 4px" }}>المبلغ</p>
        <p style={{ fontSize: "22pt", fontWeight: 800, color: "#1e293b", margin: 0 }}>{formatCurrency(p.amount)}</p>
        <p style={{ fontSize: "10pt", color: "#64748b", marginTop: 6 }}>طريقة الدفع: {p.payment_method}</p>
      </div>
      <PrintNotes notes={p.notes} />
      <PrintSignatures />
      <PrintFooter />
    </PrintPage>
  );
}

export const dynamic = "force-dynamic";
