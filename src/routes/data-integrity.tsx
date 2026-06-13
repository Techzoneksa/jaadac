import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/lib/i18n";
import { PermissionGate } from "@/components/PermissionGate";
import { useStore, DEMO_TENANT_ID, docTotals } from "@/lib/store";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

export const Route = createFileRoute("/data-integrity")({
  head: () => ({ meta: [{ title: "Data Integrity — JAAD CLOUD" }] }),
  component: () => (
    <PermissionGate perms={["audit.view", "accounting.view"]} mode="page">
      <DataIntegrityPage />
    </PermissionGate>
  ),
});

type CheckStatus = "pass" | "warning" | "fail";

interface Check {
  name: { ar: string; en: string };
  status: CheckStatus;
  details: { ar: string; en: string };
  fix: { ar: string; en: string };
}

function DataIntegrityPage() {
  const { t, lang } = useI18n();
  const s = useStore((x) => x);

  const checks = useMemo<Check[]>(() => {
    const out: Check[] = [];
    const allRecords: { type: string; arr: any[] }[] = [
      { type: "customers", arr: s.customers }, { type: "suppliers", arr: s.suppliers },
      { type: "items", arr: s.items }, { type: "quotations", arr: s.quotations },
      { type: "invoices", arr: s.invoices }, { type: "receipts", arr: s.receipts },
      { type: "payments", arr: s.payments }, { type: "accounts", arr: s.accounts },
      { type: "journal", arr: s.journal }, { type: "tasks", arr: s.tasks },
    ];

    // 1) tenant_id on every record
    const missingTenant = allRecords.flatMap((g) => g.arr.filter((x) => !x.tenant_id).map((x) => `${g.type}:${x.id}`));
    out.push({
      name: { ar: "كل السجلات تحمل tenant_id", en: "Every record has tenant_id" },
      status: missingTenant.length === 0 ? "pass" : "fail",
      details: {
        ar: missingTenant.length ? `سجلات بدون tenant_id: ${missingTenant.length}` : "كل السجلات سليمة",
        en: missingTenant.length ? `Records missing tenant_id: ${missingTenant.length}` : "All records have a tenant_id",
      },
      fix: { ar: "أعد تعيين البيانات التجريبية أو حدّث السجلات يدويًا.", en: "Reset demo data or patch records manually." },
    });

    // 2) current tenant exists
    const tenantOk = !!s.tenants.find((t) => t.id === DEMO_TENANT_ID);
    out.push({
      name: { ar: "المؤسسة الحالية موجودة", en: "Current tenant exists" },
      status: tenantOk ? "pass" : "fail",
      details: { ar: tenantOk ? "موجودة" : "غير موجودة", en: tenantOk ? "Present" : "Missing" },
      fix: { ar: "أعد تعيين البيانات التجريبية.", en: "Reset demo data." },
    });

    // 3) settings exist
    const settingsOk = !!s.company && !!s.tax && !!s.numbering;
    out.push({
      name: { ar: "إعدادات النظام موجودة", en: "Required settings exist" },
      status: settingsOk ? "pass" : "fail",
      details: { ar: settingsOk ? "كل الإعدادات موجودة" : "إعدادات ناقصة", en: settingsOk ? "All settings present" : "Missing settings" },
      fix: { ar: "افتح الإعدادات وأكمل الحقول المطلوبة.", en: "Open Settings and fill required fields." },
    });

    // 4) invoices reference valid customers
    const badInvCust = s.invoices.filter((i) => !s.customers.find((c) => c.id === i.customer_id));
    out.push({
      name: { ar: "كل فاتورة لها عميل صحيح", en: "Every invoice has a valid customer" },
      status: badInvCust.length === 0 ? "pass" : "fail",
      details: { ar: `فواتير بمراجع تالفة: ${badInvCust.length}`, en: `Invoices with broken references: ${badInvCust.length}` },
      fix: { ar: "حدّث العميل أو احذف الفاتورة.", en: "Update the customer or remove the invoice." },
    });

    // 5) quotations reference valid customers
    const badQ = s.quotations.filter((q) => !s.customers.find((c) => c.id === q.customer_id));
    out.push({
      name: { ar: "كل عرض سعر له عميل صحيح", en: "Every quotation has a valid customer" },
      status: badQ.length === 0 ? "pass" : "fail",
      details: { ar: `عروض تالفة: ${badQ.length}`, en: `Broken quotations: ${badQ.length}` },
      fix: { ar: "حدّث العميل أو احذف العرض.", en: "Update the customer or remove the quote." },
    });

    // 6) receipts with invoice_id reference existing invoices
    const badR = s.receipts.filter((r) => r.invoice_id && !s.invoices.find((i) => i.id === r.invoice_id));
    out.push({
      name: { ar: "سندات القبض المرتبطة بفواتير موجودة", en: "Linked receipts reference existing invoices" },
      status: badR.length === 0 ? "pass" : "fail",
      details: { ar: `سندات تالفة: ${badR.length}`, en: `Orphan receipts: ${badR.length}` },
      fix: { ar: "اربط السند بفاتورة موجودة أو احذفه.", en: "Re-link or remove the receipt." },
    });

    // 7) payments have supplier or payee
    const badP = s.payments.filter((p) => !p.supplier_id && !p.payee);
    out.push({
      name: { ar: "كل سند صرف له مورد أو مستلم", en: "Every payment has supplier/payee" },
      status: badP.length === 0 ? "pass" : "fail",
      details: { ar: `سندات بلا جهة: ${badP.length}`, en: `Payments without payee: ${badP.length}` },
      fix: { ar: "أضف المورد أو اسم المستلم.", en: "Set supplier or payee." },
    });

    // 8) journal balanced
    const unbalanced = s.journal.filter((j) => {
      const d = j.lines.reduce((a, l) => a + (l.debit || 0), 0);
      const c = j.lines.reduce((a, l) => a + (l.credit || 0), 0);
      return Math.abs(d - c) > 0.01;
    });
    out.push({
      name: { ar: "كل القيود متوازنة (مدين = دائن)", en: "Every journal entry is balanced" },
      status: unbalanced.length === 0 ? "pass" : "fail",
      details: { ar: `قيود غير متوازنة: ${unbalanced.length}`, en: `Unbalanced entries: ${unbalanced.length}` },
      fix: { ar: "افتح القيد وأعد ضبط المدين والدائن.", en: "Open the entry and rebalance." },
    });

    // 9) auto-journal source points to existing doc
    const sourceMap: Record<string, any[]> = {
      sales_invoice: s.invoices, receipt_voucher: s.receipts, payment_voucher: s.payments,
    };
    const brokenSource = s.journal.filter((j) =>
      j.source_type && j.source_type !== "manual" && j.source_id &&
      !(sourceMap[j.source_type] || []).find((x) => x.id === j.source_id)
    );
    out.push({
      name: { ar: "كل قيد تلقائي يشير إلى مستند موجود", en: "Auto journal source points to existing document" },
      status: brokenSource.length === 0 ? "pass" : "warning",
      details: { ar: `قيود تالفة المصدر: ${brokenSource.length}`, en: `Broken auto-journal links: ${brokenSource.length}` },
      fix: { ar: "احذف القيد التلقائي أو أعد إنشاء المستند.", en: "Remove the auto entry or restore the source." },
    });

    // 10) duplicate document numbers per tenant
    const dupGroups: { kind: string; n: string }[] = [];
    const checkDup = (kind: string, arr: { number: string; tenant_id?: string }[]) => {
      const seen = new Map<string, number>();
      arr.forEach((x) => {
        const key = `${x.tenant_id || DEMO_TENANT_ID}:${x.number}`;
        seen.set(key, (seen.get(key) || 0) + 1);
      });
      seen.forEach((n, k) => { if (n > 1) dupGroups.push({ kind, n: k }); });
    };
    checkDup("invoice", s.invoices); checkDup("quotation", s.quotations);
    checkDup("receipt", s.receipts); checkDup("payment", s.payments); checkDup("journal", s.journal);
    out.push({
      name: { ar: "لا أرقام مستندات مكررة", en: "No duplicate document numbers" },
      status: dupGroups.length === 0 ? "pass" : "fail",
      details: { ar: `أرقام مكررة: ${dupGroups.length}`, en: `Duplicates: ${dupGroups.length}` },
      fix: { ar: "غيّر الرقم اليدوي أو استخدم الترقيم التلقائي.", en: "Renumber manually or use auto numbering." },
    });

    // 11) invoice paid <= total
    const overpaid = s.invoices.filter((i) => i.paid - 0.01 > docTotals(i.lines, i.discount).total);
    out.push({
      name: { ar: "المدفوع لا يتجاوز إجمالي الفاتورة", en: "Invoice paid does not exceed total" },
      status: overpaid.length === 0 ? "pass" : "fail",
      details: { ar: `فواتير متجاوزة: ${overpaid.length}`, en: `Overpaid invoices: ${overpaid.length}` },
      fix: { ar: "راجع سندات القبض المرتبطة.", en: "Review linked receipts." },
    });

    // 12) VAT not negative
    const negVat = s.payments.filter((p) => (p.vat_amount || 0) < 0);
    out.push({
      name: { ar: "قيم الضريبة غير سالبة", en: "VAT amounts are not negative" },
      status: negVat.length === 0 ? "pass" : "fail",
      details: { ar: `سندات بضريبة سالبة: ${negVat.length}`, en: `Negative-VAT payments: ${negVat.length}` },
      fix: { ar: "صحّح قيمة الضريبة.", en: "Correct the VAT value." },
    });

    // 13) Account purpose readiness (local equivalent of chart_account_purposes)
    const PURPOSE_CODES: { purpose: string; codes: string[] }[] = [
      { purpose: "cash", codes: ["1000", "1010"] },
      { purpose: "bank", codes: ["1100", "1020"] },
      { purpose: "accounts_receivable", codes: ["1200", "1030"] },
      { purpose: "accounts_payable", codes: ["2100", "2010"] },
      { purpose: "vat_input", codes: ["1300"] },
      { purpose: "vat_payable", codes: ["2300", "2020"] },
      { purpose: "revenue", codes: ["4000", "4010"] },
      { purpose: "expense", codes: ["5000", "5010", "5020"] },
      { purpose: "inventory", codes: ["1400", "1040"] },
    ];
    const missingPurposes = PURPOSE_CODES.filter(
      (p) => !s.accounts.some((a) => p.codes.includes(a.number)),
    ).map((p) => p.purpose);
    out.push({
      name: { ar: "أغراض الحسابات الافتراضية متوفرة (مكافئ ربط الأغراض)", en: "Default account purposes available (purpose mapping equivalent)" },
      status: missingPurposes.length === 0 ? "pass" : missingPurposes.length <= 2 ? "warning" : "fail",
      details: {
        ar: missingPurposes.length === 0 ? "كل الأغراض الافتراضية مغطّاة" : `أغراض غير مغطّاة: ${missingPurposes.join(", ")}`,
        en: missingPurposes.length === 0 ? "All default purposes covered" : `Uncovered purposes: ${missingPurposes.join(", ")}`,
      },
      fix: { ar: "أضف الحسابات المفقودة في شجرة الحسابات.", en: "Add missing accounts in the Chart of Accounts." },
    });

    return out;
  }, [s]);

  const totals = checks.reduce(
    (a, c) => ((a[c.status] = (a[c.status] || 0) + 1), a),
    { pass: 0, warning: 0, fail: 0 } as Record<CheckStatus, number>,
  );

  return (
    <AppShell title={lang === "ar" ? "سلامة البيانات" : "Data Integrity"}>
      <div className="max-w-4xl space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Tile label={lang === "ar" ? "ناجحة" : "Pass"} n={totals.pass} tone="success" />
          <Tile label={lang === "ar" ? "تحذير" : "Warning"} n={totals.warning} tone="warning" />
          <Tile label={lang === "ar" ? "فشل" : "Fail"} n={totals.fail} tone="destructive" />
        </div>
        <div className="card-elevated divide-y">
          {checks.map((c, i) => (
            <div key={i} className="p-4 flex gap-4 items-start">
              <StatusIcon s={c.status} />
              <div className="flex-1 min-w-0">
                <div className="font-medium">{lang === "ar" ? c.name.ar : c.name.en}</div>
                <div className="text-xs text-muted-foreground mt-1">{lang === "ar" ? c.details.ar : c.details.en}</div>
                {c.status !== "pass" && (
                  <div className="text-xs mt-1.5">
                    <span className="text-muted-foreground">{lang === "ar" ? "اقتراح: " : "Suggestion: "}</span>
                    {lang === "ar" ? c.fix.ar : c.fix.en}
                  </div>
                )}
              </div>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                c.status === "pass" ? "bg-success/10 text-success border-success/30"
                : c.status === "warning" ? "bg-warning/10 text-warning border-warning/30"
                : "bg-destructive/10 text-destructive border-destructive/30"
              }`}>
                {c.status === "pass" ? (lang === "ar" ? "ناجح" : "Pass") :
                 c.status === "warning" ? (lang === "ar" ? "تحذير" : "Warning") :
                 (lang === "ar" ? "فشل" : "Fail")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function Tile({ label, n, tone }: { label: string; n: number; tone: "success" | "warning" | "destructive" }) {
  const cls = tone === "success" ? "text-success border-success/30 bg-success/5"
    : tone === "warning" ? "text-warning border-warning/30 bg-warning/5"
    : "text-destructive border-destructive/30 bg-destructive/5";
  return (
    <div className={`rounded-lg border p-4 text-center ${cls}`}>
      <div className="text-xs uppercase tracking-wide opacity-80">{label}</div>
      <div className="text-3xl font-semibold mt-1">{n}</div>
    </div>
  );
}

function StatusIcon({ s }: { s: CheckStatus }) {
  if (s === "pass") return <CheckCircle2 className="size-5 text-success shrink-0 mt-0.5" />;
  if (s === "warning") return <AlertTriangle className="size-5 text-warning shrink-0 mt-0.5" />;
  return <XCircle className="size-5 text-destructive shrink-0 mt-0.5" />;
}
