import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PrintPage } from "@/components/print/PrintPage";
import { PrintHeader } from "@/components/print/PrintHeader";
import { PrintPartyInfo } from "@/components/print/PrintPartyInfo";
import { PrintNotes } from "@/components/print/PrintNotes";
import { PrintSignatures } from "@/components/print/PrintSignatures";
import { PrintFooter } from "@/components/print/PrintFooter";
import { formatCurrency } from "@/components/print/format";

export default async function ReceiptPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div className="flex items-center justify-center min-h-screen"><p className="text-red-600">يرجى تسجيل الدخول</p></div>;

  const { data: r } = await supabase
    .from("receipts")
    .select("*, customers!receipts_customer_id_fkey(name_ar, name_en, vat)")
    .eq("id", id)
    .eq("tenant_id", user.id)
    .single();
  const { data: company } = await supabase.from("company_settings").select("*").eq("tenant_id", user.id).maybeSingle();
  if (!r) return notFound();

  const customer = r.customers ? { name: r.customers.name_ar || r.customers.name_en, vat: r.customers.vat } : null;

  return (
    <PrintPage>
      <PrintHeader company={company} title="سند قبض" number={r.number} date={r.date} status={r.status} />
      <PrintPartyInfo label="بيانات العميل" party={customer} />
      <div style={{ margin: "20px 0", padding: 24, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, textAlign: "center" }}>
        <p style={{ fontSize: "8pt", color: "#64748b", margin: "0 0 4px" }}>المبلغ</p>
        <p style={{ fontSize: "22pt", fontWeight: 800, color: "#1e293b", margin: 0 }}>{formatCurrency(r.amount)}</p>
        <p style={{ fontSize: "10pt", color: "#64748b", marginTop: 6 }}>طريقة الدفع: {r.payment_method}</p>
      </div>
      <PrintNotes notes={r.notes} />
      <PrintSignatures />
      <PrintFooter />
    </PrintPage>
  );
}

export const dynamic = "force-dynamic";
