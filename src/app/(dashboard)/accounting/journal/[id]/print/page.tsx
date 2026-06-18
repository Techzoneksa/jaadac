import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PrintPage } from "@/components/print/PrintPage";
import { PrintHeader } from "@/components/print/PrintHeader";
import { PrintNotes } from "@/components/print/PrintNotes";
import { PrintSignatures } from "@/components/print/PrintSignatures";
import { PrintFooter } from "@/components/print/PrintFooter";
import { formatCurrency } from "@/components/print/format";

export default async function JournalEntryPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div className="flex items-center justify-center min-h-screen"><p className="text-red-600">يرجى تسجيل الدخول</p></div>;

  const { data: je } = await supabase
    .from("journal")
    .select("number,date,description,status")
    .eq("id", id)
    .eq("tenant_id", user.id)
    .single();
  const { data: lines } = await supabase
    .from("journal_lines")
    .select("account_id,debit,credit")
    .eq("journal_id", id);
  const { data: company } = await supabase.from("company_settings").select("*").eq("tenant_id", user.id).maybeSingle();

  if (!je) return notFound();

  let linesWithAccounts: Array<{ account_name: string; debit: number; credit: number }> = [];
  if (lines?.length) {
    const { data: accounts } = await supabase.from("accounts").select("id,name_ar").in("id", lines.map(l => l.account_id));
    const accMap = new Map(accounts?.map(a => [a.id, a.name_ar]) || []);
    linesWithAccounts = lines.map(l => ({ account_name: accMap.get(l.account_id) || "—", debit: l.debit, credit: l.credit }));
  }

  const totalDebit = linesWithAccounts.reduce((s, l) => s + l.debit, 0);
  const totalCredit = linesWithAccounts.reduce((s, l) => s + l.credit, 0);

  return (
    <PrintPage>
      <PrintHeader company={company} title="قيد يومية" number={je.number} date={je.date} status={je.status === "posted" ? "مرحّل" : "مسودة"} />
      {je.description && <p style={{ marginBottom: 16, fontSize: "10pt", color: "#475569" }}>{je.description}</p>}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9pt", marginBottom: 20 }}>
        <thead>
          <tr style={{ background: "#f1f5f9", borderBottom: "2px solid #e2e8f0" }}>
            <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: "#475569" }}>الحساب</th>
            <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, color: "#475569", width: "25%" }}>مدين</th>
            <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, color: "#475569", width: "25%" }}>دائن</th>
          </tr>
        </thead>
        <tbody>
          {linesWithAccounts.length === 0 ? (
            <tr><td colSpan={3} style={{ padding: 20, textAlign: "center", color: "#94a3b8" }}>لا توجد بنود</td></tr>
          ) : linesWithAccounts.map((l, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #e2e8f0" }}>
              <td style={{ padding: "7px 10px", color: "#1e293b" }}>{l.account_name}</td>
              <td style={{ padding: "7px 10px", textAlign: "left", color: "#1e293b", fontWeight: l.debit ? 600 : 400 }}>{l.debit ? formatCurrency(l.debit) : "—"}</td>
              <td style={{ padding: "7px 10px", textAlign: "left", color: "#1e293b", fontWeight: l.credit ? 600 : 400 }}>{l.credit ? formatCurrency(l.credit) : "—"}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ borderTop: "2px solid #1e293b", fontWeight: 700 }}>
            <td style={{ padding: "8px 10px", color: "#1e293b" }}>الإجمالي</td>
            <td style={{ padding: "8px 10px", textAlign: "left", color: "#1e293b" }}>{formatCurrency(totalDebit)}</td>
            <td style={{ padding: "8px 10px", textAlign: "left", color: "#1e293b" }}>{formatCurrency(totalCredit)}</td>
          </tr>
        </tfoot>
      </table>
      <PrintSignatures />
      <PrintFooter />
    </PrintPage>
  );
}

export const dynamic = "force-dynamic";
