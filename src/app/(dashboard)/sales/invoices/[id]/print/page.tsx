import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PrintPage } from "@/components/print/PrintPage";
import { ZATCAInvoiceTemplate } from "@/components/print/ZATCAInvoiceTemplate";
import QRCode from "qrcode";

function buildZATCATLV(sellerName: string, vatNumber: string, date: string, time: string, total: number, vatTotal: number): string {
  const tl = Math.round(total * 100).toString();
  const tv = Math.round(vatTotal * 100).toString();
  const nameBytes = Buffer.from(sellerName, "utf8");
  const vatBytes = Buffer.from(vatNumber, "utf8");
  const dateBytes = Buffer.from(date + "T" + time, "utf8");
  const tlBytes = Buffer.from(tl, "utf8");
  const tvBytes = Buffer.from(tv, "utf8");

  function tlv(tag: number, value: Buffer): string {
    const tagStr = tag.toString().padStart(2, "0");
    const lenStr = value.length.toString().padStart(2, "0");
    return tagStr + lenStr + value.toString("binary");
  }

  return tlv(1, nameBytes) + tlv(2, vatBytes) + tlv(3, dateBytes) + tlv(4, tlBytes) + tlv(5, tvBytes);
}

export default async function SalesInvoicePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div style={{ padding: "40px", textAlign: "center" }}>يرجى تسجيل الدخول</div>;

  const { data: inv } = await supabase
    .from("invoices")
    .select(`
      *,
      invoice_lines(*),
      customers!invoices_customer_id_fkey(
        name_ar, name_en, type, vat, cr, unified_no,
        mobile, phone, email, city, country, district,
        street, building_no, additional_no, postal_code,
        address, project_name, contact_person, customer_number,
        national_short_address
      )
    `)
    .eq("id", id)
    .eq("tenant_id", user.id)
    .single();

  const { data: company } = await supabase
    .from("company_settings")
    .select("*")
    .eq("tenant_id", user.id)
    .maybeSingle();

  if (!inv) return notFound();

  let qrDataUrl = inv.qr_value as string | undefined;
  if (!qrDataUrl && company?.name_ar && company?.vat && (inv.total || 0) > 0) {
    try {
      const time = (inv.issue_time as string) || new Date().toTimeString().slice(0, 8);
      const tlvData = buildZATCATLV(company.name_ar, company.vat, inv.date as string, time, inv.total || 0, inv.vat_total || 0);
      qrDataUrl = await QRCode.toDataURL(tlvData, {
        errorCorrectionLevel: "M",
        margin: 2,
        width: 140,
        color: { dark: "#1e293b", light: "#ffffff" },
      });
    } catch (e) {
      console.error("QR generation failed:", e);
    }
  }

  return (
    <PrintPage>
      <ZATCAInvoiceTemplate
        invoice={{ ...inv, qr_value: qrDataUrl }}
        company={company}
      />
    </PrintPage>
  );
}

export const dynamic = "force-dynamic";