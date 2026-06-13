/**
 * Service / Repository layer (Phase 1.4).
 *
 * All persistence flows through the active DataAdapter
 * (see `src/lib/adapters`). UI components should call these services rather
 * than touching the store directly — that's what lets us swap to a real
 * backend later without changing components.
 */
import { newId, nextNumber, docTotals, purchaseDocTotals, DEMO_TENANT_ID,
  type Quotation, type Invoice, type Receipt, type Payment,
  type JournalEntry, type JournalLine, type ID, type CompanySettings, type TaxSettings,
  type Numbering, type AuditLog, type State, type JournalSource,
  type InvoiceStatus, type QuotationStatus,
  type PurchaseInvoice, type PurchaseInvoiceStatus,
} from "@/lib/store";
import { getAdapter } from "@/lib/adapters";
import type { ListQueryParams } from "@/lib/contracts";
import { UsageTrackingService } from "@/lib/usage-tracking";

const now = () => new Date().toISOString();
const tenantOf = (tenantId?: ID) => tenantId || DEMO_TENANT_ID;
const adapter = () => getAdapter();

// =================== Audit ===================
export const AuditService = {
  list(tenantId?: ID) {
    const t = tenantOf(tenantId);
    return [...adapter().getState().audit_log].filter((a) => a.tenant_id === t).reverse();
  },
  log(entry: Omit<AuditLog, "id" | "created_at">) {
    const full: AuditLog = { id: newId(), created_at: now(), ...entry };
    adapter().create("audit_log", full);
  },
};

// =================== Numbering ===================
export const NumberingService = {
  next(kind: keyof Numbering, tenantId?: ID): string {
    const s = adapter().getState();
    const t = tenantOf(tenantId);
    const prefix = s.numbering[kind];
    const lists: Record<keyof Numbering, { number: string }[]> = {
      quotation: adapter().list("quotations", { tenantId: t, pageSize: 99999 }).items as any,
      invoice: adapter().list("invoices", { tenantId: t, pageSize: 99999 }).items as any,
      receipt: adapter().list("receipts", { tenantId: t, pageSize: 99999 }).items as any,
      payment: adapter().list("payments", { tenantId: t, pageSize: 99999 }).items as any,
      journal: adapter().list("journal", { tenantId: t, pageSize: 99999 }).items as any,
    };
    return nextNumber(prefix, lists[kind]);
  },
  isUnique(kind: keyof Numbering, number: string, tenantId?: ID, exceptId?: ID): boolean {
    const t = tenantOf(tenantId);
    const map: Record<keyof Numbering, "quotations" | "invoices" | "receipts" | "payments" | "journal"> = {
      quotation: "quotations", invoice: "invoices", receipt: "receipts",
      payment: "payments", journal: "journal",
    };
    const items = adapter().list(map[kind], { tenantId: t, pageSize: 99999 }).items as any[];
    return !items.some((x) => x.number === number && x.id !== exceptId);
  },
};

// =================== Validation ===================
export interface ValidationResult { ok: boolean; error?: { ar: string; en: string } }
const err = (ar: string, en: string): ValidationResult => ({ ok: false, error: { ar, en } });
const ok: ValidationResult = { ok: true };

export const ValidationService = {
  quotation(q: Partial<Quotation>): ValidationResult {
    if (!q.customer_id) return err("يرجى اختيار العميل", "Customer is required");
    if (!q.lines || q.lines.length === 0) return err("يرجى إضافة بند واحد على الأقل", "Please add at least one line item");
    for (const l of q.lines) {
      if (!l.qty || l.qty <= 0) return err("الكمية يجب أن تكون أكبر من صفر", "Quantity must be greater than zero");
      if (l.unit_price < 0) return err("السعر لا يمكن أن يكون سالبًا", "Price cannot be negative");
    }
    return ok;
  },
  invoice(i: Partial<Invoice>, existing?: Invoice): ValidationResult {
    if (existing && (existing.status === "official" || existing.status === "partially_paid" || existing.status === "fully_paid")) {
      return err("لا يمكن تعديل الفاتورة بعد اعتمادها", "Invoice cannot be edited after issuing");
    }
    if (!i.customer_id) return err("يرجى اختيار العميل", "Customer is required");
    if (!i.lines || i.lines.length === 0) return err("يرجى إضافة بند واحد على الأقل", "Please add at least one line item");
    for (const l of i.lines) {
      if (!l.qty || l.qty <= 0) return err("الكمية يجب أن تكون أكبر من صفر", "Quantity must be greater than zero");
      if (l.unit_price < 0) return err("السعر لا يمكن أن يكون سالبًا", "Price cannot be negative");
    }
    const totals = docTotals(i.lines, i.discount || 0);
    if (totals.total <= 0) return err("الإجمالي يجب أن يكون أكبر من صفر", "Total must be greater than zero");
    return ok;
  },
  receipt(r: Partial<Receipt>): ValidationResult {
    if (!r.customer_id) return err("يرجى اختيار العميل", "Customer is required");
    if (!r.amount || r.amount <= 0) return err("المبلغ يجب أن يكون أكبر من صفر", "Amount must be greater than zero");
    if (r.invoice_id) {
      const inv = adapter().getById("invoices", r.invoice_id);
      if (inv) {
        const totals = docTotals(inv.lines, inv.discount);
        const remaining = totals.total - inv.paid;
        if (r.amount - 0.01 > remaining) {
          return err("المبلغ يتجاوز الرصيد المتبقي للفاتورة", "Amount exceeds remaining invoice balance");
        }
      }
    }
    return ok;
  },
  payment(p: Partial<Payment>): ValidationResult {
    if (!p.supplier_id && !p.payee) return err("يرجى اختيار المورد أو المستلم", "Supplier or payee is required");
    if (!p.amount || p.amount <= 0) return err("المبلغ يجب أن يكون أكبر من صفر", "Amount must be greater than zero");
    return ok;
  },
  journal(j: Partial<JournalEntry>, existing?: JournalEntry): ValidationResult {
    if (existing && existing.status === "posted") return err("لا يمكن تعديل قيد مُرحّل", "Posted journal entry is locked");
    if (!j.lines || j.lines.length < 2) return err("القيد يحتاج إلى سطرين على الأقل", "Journal entry requires at least two lines");
    const d = j.lines.reduce((s, l) => s + (l.debit || 0), 0);
    const c = j.lines.reduce((s, l) => s + (l.credit || 0), 0);
    if (Math.abs(d - c) > 0.01) return err("إجمالي المدين يجب أن يساوي إجمالي الدائن", "Debit and credit totals must be equal");
    return ok;
  },
};

// =================== Accounting Engine ===================
export const AccountingEngine = {
  postInvoice(invoice: Invoice, tenantId?: ID): JournalEntry | null {
    const t = tenantOf(tenantId);
    const s = adapter().getState();
    if (s.journal.some((j) => j.source_type === "sales_invoice" && j.source_id === invoice.id)) return null;
    const totals = docTotals(invoice.lines, invoice.discount);
    const lines = [
      { account_id: "a1030", debit: totals.total, credit: 0, description: "AR / العميل" },
      { account_id: "a4010", debit: 0, credit: totals.afterDiscount, description: "Revenue / إيرادات" },
    ];
    if (totals.vat > 0) lines.push({ account_id: "a2020", debit: 0, credit: totals.vat, description: "VAT" });
    const je: JournalEntry = {
      id: newId(), tenant_id: t,
      number: NumberingService.next("journal", t),
      date: invoice.date, description: `اعتماد فاتورة مبيعات ${invoice.number}`,
      status: "posted", source: invoice.number,
      source_type: "sales_invoice", source_id: invoice.id,
      created_at: now(), posted_at: now(),
      lines,
    };
    adapter().create("journal", je);
    return je;
  },
  postReceipt(receipt: Receipt, tenantId?: ID): JournalEntry | null {
    const t = tenantOf(tenantId);
    const s = adapter().getState();
    if (s.journal.some((j) => j.source_type === "receipt_voucher" && j.source_id === receipt.id)) return null;
    const cashAcct = receipt.method === "cash" ? "a1010" : "a1020";
    const je: JournalEntry = {
      id: newId(), tenant_id: t,
      number: NumberingService.next("journal", t),
      date: receipt.date, description: `سند قبض ${receipt.number}`,
      status: "posted", source: receipt.number,
      source_type: "receipt_voucher", source_id: receipt.id,
      created_at: now(), posted_at: now(),
      lines: [
        { account_id: cashAcct, debit: receipt.amount, credit: 0 },
        { account_id: "a1030", debit: 0, credit: receipt.amount },
      ],
    };
    adapter().create("journal", je);
    return je;
  },
  postPayment(payment: Payment, tenantId?: ID): JournalEntry | null {
    const t = tenantOf(tenantId);
    const s = adapter().getState();
    if (s.journal.some((j) => j.source_type === "payment_voucher" && j.source_id === payment.id)) return null;
    const cashAcct = payment.method === "cash" ? "a1010" : "a1020";
    const base = payment.amount - (payment.vat_amount || 0);
    const lines = [{ account_id: "a5010", debit: base, credit: 0, description: payment.category }];
    if (payment.vat_amount && payment.vat_amount > 0) {
      lines.push({ account_id: "a2020", debit: payment.vat_amount, credit: 0, description: "VAT" });
    }
    lines.push({ account_id: cashAcct, debit: 0, credit: payment.amount, description: payment.method });
    const je: JournalEntry = {
      id: newId(), tenant_id: t,
      number: NumberingService.next("journal", t),
      date: payment.date, description: `سند صرف ${payment.number}`,
      status: "posted", source: payment.number,
      source_type: "payment_voucher", source_id: payment.id,
      created_at: now(), posted_at: now(),
      lines,
    };
    adapter().create("journal", je);
    return je;
  },
  postManual(entry: Omit<JournalEntry, "source_type"> & { source_type?: JournalSource }, tenantId?: ID): JournalEntry {
    const t = tenantOf(tenantId);
    const je: JournalEntry = {
      ...entry, tenant_id: t,
      source_type: entry.source_type || "manual",
      status: "posted",
      created_at: entry.created_at || now(),
      posted_at: now(),
    };
    adapter().create("journal", je);
    return je;
  },
};

// =================== Generic CRUD helpers (adapter-backed) ===================
function crud<K extends keyof State>(key: K) {
  type Item = State[K] extends Array<infer U> ? U : never;
  return {
    list(tenantId?: ID): Item[] {
      return adapter().list(key, { tenantId: tenantOf(tenantId), pageSize: 99999 }).items as Item[];
    },
    query(params: ListQueryParams = {}) {
      return adapter().list(key, { tenantId: tenantOf(params.tenantId), ...params });
    },
    getById(id: ID): Item | undefined {
      return adapter().getById(key, id) as Item | undefined;
    },
    create(record: Item) { adapter().create(key, record as any); },
    update(id: ID, patch: Partial<Item>) { adapter().update(key, id, patch as any); },
    archive(id: ID) {
      adapter().update(key, id, { archived: true, status: "inactive" } as any);
    },
    delete(id: ID) { adapter().remove(key, id); },
  };
}

export const CustomerService = crud("customers");
export const SupplierService = crud("suppliers");
export const ItemService = crud("items");
export const AccountService = crud("accounts");

// =================== Phase 2.1.14 — Tax Rates ===================
import type { TaxRate, TaxType } from "@/lib/store";

export const TaxRateService = {
  list(tenantId?: ID): TaxRate[] {
    const t = tenantOf(tenantId);
    return (adapter().getState().tax_rates as TaxRate[]).filter((r) => (r.tenant_id ?? t) === t);
  },
  active(tenantId?: ID): TaxRate[] {
    return TaxRateService.list(tenantId).filter((r) => r.is_active);
  },
  getById(id: ID): TaxRate | undefined {
    return adapter().getById("tax_rates", id) as TaxRate | undefined;
  },
  create(input: Omit<TaxRate, "id" | "created_at" | "updated_at" | "is_system">, tenantId?: ID): TaxRate {
    const t = tenantOf(tenantId);
    const rec: TaxRate = {
      ...input,
      id: newId(),
      tenant_id: t,
      is_system: false,
      created_at: now(),
      updated_at: now(),
    };
    adapter().create("tax_rates", rec as any);
    return rec;
  },
  update(id: ID, patch: Partial<TaxRate>): void {
    const current = TaxRateService.getById(id);
    if (!current) return;
    if (current.is_system) {
      // System rates: only allow toggling is_active + notes + description tweaks
      const safe: Partial<TaxRate> = {};
      if (typeof patch.is_active === "boolean") safe.is_active = patch.is_active;
      if (typeof patch.notes === "string") safe.notes = patch.notes;
      if (typeof patch.description_ar === "string") safe.description_ar = patch.description_ar;
      if (typeof patch.description_en === "string") safe.description_en = patch.description_en;
      adapter().update("tax_rates", id, { ...safe, updated_at: now() } as any);
      return;
    }
    adapter().update("tax_rates", id, { ...patch, updated_at: now() } as any);
  },
  archive(id: ID): void {
    const current = TaxRateService.getById(id);
    if (!current) return;
    adapter().update("tax_rates", id, { is_active: false, updated_at: now() } as any);
  },
  remove(id: ID): boolean {
    const current = TaxRateService.getById(id);
    if (!current || current.is_system) return false;
    adapter().remove("tax_rates", id);
    return true;
  },
  getDefaultSalesTax(tenantId?: ID): TaxRate | undefined {
    return TaxRateService.active(tenantId).find((r) => r.tax_type === "sales" && r.rate === 15)
      ?? TaxRateService.active(tenantId).find((r) => r.tax_type === "sales");
  },
  getDefaultPurchaseTax(tenantId?: ID): TaxRate | undefined {
    return TaxRateService.active(tenantId).find((r) => r.tax_type === "purchases" && r.rate === 15)
      ?? TaxRateService.active(tenantId).find((r) => r.tax_type === "purchases");
  },
  isDuplicateName(name_ar: string, name_en: string, tenantId?: ID, exceptId?: ID): boolean {
    const list = TaxRateService.list(tenantId);
    const a = name_ar.trim().toLowerCase();
    const e = name_en.trim().toLowerCase();
    return list.some((r) => r.id !== exceptId && (
      r.name_ar.trim().toLowerCase() === a || r.name_en.trim().toLowerCase() === e
    ));
  },
  countsByType(tenantId?: ID): Record<TaxType, number> {
    const list = TaxRateService.list(tenantId);
    return {
      sales: list.filter((r) => r.tax_type === "sales").length,
      purchases: list.filter((r) => r.tax_type === "purchases").length,
      reverse_charge: list.filter((r) => r.tax_type === "reverse_charge").length,
      out_of_scope: list.filter((r) => r.tax_type === "out_of_scope").length,
    };
  },
};

export const QuotationService = {
  ...crud("quotations"),
  setStatus(id: ID, status: QuotationStatus) {
    adapter().update("quotations", id, { status } as any);
  },
  send(id: ID) { adapter().update("quotations", id, { status: "sent" } as any); },
  accept(id: ID) { adapter().update("quotations", id, { status: "accepted" } as any); },
  reject(id: ID) { adapter().update("quotations", id, { status: "rejected" } as any); },
  convertToInvoice(q: Quotation, tenantId?: ID): Invoice {
    const t = tenantOf(tenantId);
    const id = newId();
    const number = NumberingService.next("invoice", t);
    const date = new Date().toISOString().slice(0, 10);
    const due = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    const inv: Invoice = {
      id, tenant_id: t, number, customer_id: q.customer_id, date, due,
      lines: q.lines.map((l) => ({ ...l, id: newId() })),
      discount: q.discount, notes: q.notes, terms: q.terms,
      status: "draft", paid: 0,
    };
    adapter().create("invoices", inv);
    adapter().update("quotations", q.id, { status: "converted", converted_invoice_id: id } as any);
    return inv;
  },
};

export const InvoiceService = {
  ...crud("invoices"),
  setStatus(id: ID, status: InvoiceStatus) {
    adapter().update("invoices", id, { status } as any);
  },
  send(id: ID) { adapter().update("invoices", id, { status: "sent" } as any); },
  cancel(id: ID) { adapter().update("invoices", id, { status: "cancelled" } as any); },
  issue(inv: Invoice, tenantId?: ID): JournalEntry | null {
    adapter().update("invoices", inv.id, { status: "official" } as any);
    return AccountingEngine.postInvoice({ ...inv, status: "official" }, tenantId);
  },
};

export const ReceiptService = {
  ...crud("receipts"),
  createWithAutoApply(r: Receipt, tenantId?: ID): {
    receipt: Receipt; invoiceNumber: string | null; fullyPaid: boolean; journal: JournalEntry | null;
  } {
    const t = tenantOf(tenantId);
    const full: Receipt = { ...r, tenant_id: t };
    adapter().create("receipts", full);
    let invoiceNumber: string | null = null;
    let fullyPaid = false;
    if (full.invoice_id) {
      const inv = adapter().getById("invoices", full.invoice_id) as Invoice | undefined;
      if (inv) {
        invoiceNumber = inv.number;
        const totals = docTotals(inv.lines, inv.discount);
        const paid = inv.paid + full.amount;
        const status: InvoiceStatus = paid >= totals.total - 0.01 ? "fully_paid" : "partially_paid";
        if (status === "fully_paid") fullyPaid = true;
        adapter().update("invoices", inv.id, { paid, status } as any);
      }
    }
    const journal = AccountingEngine.postReceipt(full, t);
    return { receipt: full, invoiceNumber, fullyPaid, journal };
  },
};

export const PaymentService = {
  ...crud("payments"),
  createWithPosting(p: Payment, tenantId?: ID): { payment: Payment; journal: JournalEntry | null } {
    const t = tenantOf(tenantId);
    const full: Payment = { ...p, tenant_id: t };
    adapter().create("payments", full);
    const journal = AccountingEngine.postPayment(full, t);
    return { payment: full, journal };
  },
};

// =================== Purchase Invoices (Phase 2.1.5 — demo-only foundation) ===================
export const PurchaseInvoiceService = {
  ...crud("purchase_invoices"),
  nextNumber(tenantId?: ID): string {
    const t = tenantOf(tenantId);
    const list = adapter().list("purchase_invoices", { tenantId: t, pageSize: 99999 }).items as { number: string }[];
    return nextNumber("PINV", list);
  },
  setStatus(id: ID, status: PurchaseInvoiceStatus) {
    adapter().update("purchase_invoices", id, { status } as any);
  },
  approve(id: ID) { adapter().update("purchase_invoices", id, { status: "approved" } as any); },
  cancel(id: ID) { adapter().update("purchase_invoices", id, { status: "cancelled" } as any); },
  recordPayment(id: ID, amount: number) {
    const cur = adapter().getById("purchase_invoices", id) as PurchaseInvoice | undefined;
    if (!cur) return;
    const totals = purchaseDocTotals(cur.lines);
    const paid = Math.min(totals.total, (cur.paid || 0) + amount);
    const status: PurchaseInvoiceStatus =
      paid >= totals.total - 0.01 ? "paid" : "partially_paid";
    adapter().update("purchase_invoices", id, { paid, status } as any);
  },
  validate(p: Partial<PurchaseInvoice>, existing?: PurchaseInvoice): ValidationResult {
    if (existing && (existing.status === "approved" || existing.status === "paid" || existing.status === "partially_paid")) {
      // approved+ documents only allow status changes / payment recording; core fields locked
    }
    if (!p.supplier_id) return err("يرجى اختيار المورد", "Supplier is required");
    if (!p.lines || p.lines.length === 0) return err("يرجى إضافة بند واحد على الأقل", "Please add at least one line item");
    for (const l of p.lines) {
      if (!l.qty || l.qty <= 0) return err("الكمية يجب أن تكون أكبر من صفر", "Quantity must be greater than zero");
      if (l.unit_cost < 0) return err("التكلفة لا يمكن أن تكون سالبة", "Cost cannot be negative");
      if (l.vat_rate < 0) return err("الضريبة لا يمكن أن تكون سالبة", "VAT cannot be negative");
    }
    return ok;
  },
};

export const TaskService = {
  ...crud("tasks"),
  changeStatus(id: ID, status: "task_new" | "in_progress" | "completed" | "deferred") {
    adapter().update("tasks", id, { status } as any);
  },
  complete(id: ID) { adapter().update("tasks", id, { status: "completed" } as any); },
};

export interface JournalLineValidation {
  index: number;
  ok: boolean;
  error?: { ar: string; en: string };
}
export interface JournalLinesValidation {
  ok: boolean;
  lines: JournalLineValidation[];
  totalDebit: number;
  totalCredit: number;
  balanced: boolean;
  meaningfulLines: number;
}

export const JournalService = {
  ...crud("journal"),
  createManual(je: JournalEntry, tenantId?: ID): JournalEntry {
    const t = tenantOf(tenantId);
    const full: JournalEntry = {
      ...je, tenant_id: t, status: "draft",
      source_type: je.source_type || "manual",
      created_at: je.created_at || now(),
    };
    adapter().create("journal", full);
    return full;
  },
  createManualDraft(je: JournalEntry, tenantId?: ID): JournalEntry {
    return JournalService.createManual(je, tenantId);
  },
  updateManualDraft(id: ID, patch: Partial<JournalEntry>): JournalEntry | null {
    const existing = adapter().getById("journal", id);
    if (!existing) return null;
    if (existing.status === "posted") return existing; // locked
    const next: JournalEntry = { ...existing, ...patch, status: "draft" };
    adapter().update("journal", id, next);
    return next;
  },
  postManual(je: JournalEntry, tenantId?: ID): JournalEntry {
    const existing = adapter().getById("journal", je.id);
    if (existing) {
      if (existing.status === "posted") return existing; // duplicate guard
      const posted: JournalEntry = {
        ...existing, ...je,
        source_type: je.source_type || existing.source_type || "manual",
        status: "posted", posted_at: now(),
      };
      adapter().update("journal", je.id, posted);
      return posted;
    }
    return AccountingEngine.postManual(je, tenantId);
  },
  getPostingAccounts(tenantId?: ID) {
    const t = tenantOf(tenantId);
    return adapter().getState().accounts
      .filter((a) => (!a.tenant_id || a.tenant_id === t) && a.kind === "posting" && a.status === "active");
  },
  validateJournalLines(lines: JournalLine[]): JournalLinesValidation {
    const lineResults: JournalLineValidation[] = lines.map((l, index) => {
      const debit = +l.debit || 0;
      const credit = +l.credit || 0;
      if (debit > 0 && credit > 0) {
        return { index, ok: false, error: { ar: "لا يمكن أن يحوي السطر مدين ودائن معًا", en: "Line cannot have both debit and credit" } };
      }
      if (debit === 0 && credit === 0) {
        return { index, ok: false, error: { ar: "أدخل قيمة مدين أو دائن", en: "Enter a debit or credit value" } };
      }
      if (!l.account_id) {
        return { index, ok: false, error: { ar: "اختر الحساب", en: "Select an account" } };
      }
      return { index, ok: true };
    });
    const totalDebit = lines.reduce((s, l) => s + (+l.debit || 0), 0);
    const totalCredit = lines.reduce((s, l) => s + (+l.credit || 0), 0);
    const meaningfulLines = lines.filter((l) => (+l.debit || 0) > 0 || (+l.credit || 0) > 0).length;
    const balanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;
    const ok = lineResults.every((r) => r.ok) && balanced && meaningfulLines >= 2;
    return { ok, lines: lineResults, totalDebit, totalCredit, balanced, meaningfulLines };
  },
};


export const TenantService = {
  list: () => adapter().getState().tenants,
  getById: (id: ID) => adapter().getState().tenants.find((t) => t.id === id),
};

// =================== Settings ===================
export const SettingsService = {
  company: () => adapter().getState().company,
  tax: () => adapter().getState().tax,
  numbering: () => adapter().getState().numbering,
  updateCompany: (c: CompanySettings) => adapter().replaceState({ company: c }),
  updateTax: (t: TaxSettings) => adapter().replaceState({ tax: t }),
  updateNumbering: (n: Numbering) => adapter().replaceState({ numbering: n }),
  resetDemo: (actor?: ID) => {
    // Also clear smart-selector usage tracking when demo is reset.
    UsageTrackingService.reset();
    return adapter().resetDemo(actor);
  },
};

// =================== Reports ===================
export const ReportService = {
  sales(tenantId?: ID) {
    return InvoiceService.list(tenantId);
  },
  unpaid(tenantId?: ID) {
    return ReportService.sales(tenantId).filter((i) => i.status !== "fully_paid" && i.status !== "cancelled");
  },
  customerBalances(tenantId?: ID) {
    const t = tenantOf(tenantId);
    const customers = CustomerService.list(t);
    const invoices = InvoiceService.list(t);
    return customers.map((c) => {
      const invs = invoices.filter((i) => i.customer_id === c.id);
      const due = invs.reduce((sum, i) => {
        const tot = docTotals(i.lines, i.discount).total;
        return sum + (tot - i.paid);
      }, 0);
      return { customer: c, balance: c.opening_balance + due };
    });
  },
};

// =================== Smart Search (Phase 2.1.8) — re-exports ===================
export {
  CustomerSearchService,
  SupplierSearchService,
  ItemSearchService,
  InvoiceSearchService,
  AccountSearchService,
} from "./smart-search";

export { UsageTrackingService } from "@/lib/usage-tracking";
