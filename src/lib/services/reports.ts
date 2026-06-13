/**
 * Phase 2.1.12 — Report builders.
 *
 * Pure read-only helpers that compute report rows from store data.
 * No backend writes, no mutation. Adapter-pure: components call these
 * via hooks/selectors, never touch store directly.
 */
import { docTotals, type State, type Invoice, type JournalEntry, type Account } from "@/lib/store";

export interface DateRange { from?: string; to?: string }

const inRange = (d: string, r: DateRange) => {
  if (r.from && d < r.from) return false;
  if (r.to && d > r.to) return false;
  return true;
};

// ----------------- Profit & Loss -----------------
export interface PLRow { account_id: string; name_ar: string; name_en: string; amount: number }
export interface PLReport {
  revenue: PLRow[]; expenses: PLRow[];
  totalRevenue: number; totalExpenses: number; netIncome: number;
}

export function buildProfitLossReport(s: State, range: DateRange = {}): PLReport {
  const accMap = new Map(s.accounts.map((a) => [a.id, a] as const));
  const rev = new Map<string, number>();
  const exp = new Map<string, number>();

  for (const j of s.journal) {
    if (j.status !== "posted") continue;
    if (!inRange(j.date, range)) continue;
    for (const l of j.lines) {
      const a = accMap.get(l.account_id);
      if (!a) continue;
      if (a.type === "revenue") {
        rev.set(a.id, (rev.get(a.id) || 0) + (l.credit - l.debit));
      } else if (a.type === "expenses") {
        exp.set(a.id, (exp.get(a.id) || 0) + (l.debit - l.credit));
      }
    }
  }

  const toRows = (m: Map<string, number>): PLRow[] =>
    Array.from(m.entries()).map(([id, amount]) => {
      const a = accMap.get(id)!;
      return { account_id: id, name_ar: a.name_ar, name_en: a.name_en, amount };
    }).filter((r) => Math.abs(r.amount) > 0.001);

  const revenue = toRows(rev);
  const expenses = toRows(exp);
  const totalRevenue = revenue.reduce((s, r) => s + r.amount, 0);
  const totalExpenses = expenses.reduce((s, r) => s + r.amount, 0);
  return { revenue, expenses, totalRevenue, totalExpenses, netIncome: totalRevenue - totalExpenses };
}

// ----------------- Trial Balance -----------------
export interface TBRow { account_id: string; number: string; name_ar: string; name_en: string; debit: number; credit: number }
export function buildTrialBalanceReport(s: State, range: DateRange = {}): { rows: TBRow[]; totalDebit: number; totalCredit: number } {
  const accMap = new Map(s.accounts.map((a) => [a.id, a] as const));
  const totals = new Map<string, { debit: number; credit: number }>();

  for (const j of s.journal) {
    if (j.status !== "posted") continue;
    if (!inRange(j.date, range)) continue;
    for (const l of j.lines) {
      const t = totals.get(l.account_id) || { debit: 0, credit: 0 };
      t.debit += l.debit; t.credit += l.credit;
      totals.set(l.account_id, t);
    }
  }

  const rows: TBRow[] = Array.from(totals.entries()).map(([id, t]) => {
    const a = accMap.get(id);
    if (!a) return null;
    return { account_id: id, number: a.number, name_ar: a.name_ar, name_en: a.name_en, debit: t.debit, credit: t.credit };
  }).filter((r): r is TBRow => !!r && (Math.abs(r.debit) > 0.001 || Math.abs(r.credit) > 0.001))
    .sort((a, b) => a.number.localeCompare(b.number));

  return {
    rows,
    totalDebit: rows.reduce((s, r) => s + r.debit, 0),
    totalCredit: rows.reduce((s, r) => s + r.credit, 0),
  };
}

// ----------------- Balance Sheet -----------------
export interface BSReport {
  assets: PLRow[]; liabilities: PLRow[]; equity: PLRow[];
  totalAssets: number; totalLiabilities: number; totalEquity: number; netIncome: number;
}
export function buildBalanceSheetReport(s: State, asOf?: string): BSReport {
  const range: DateRange = { to: asOf };
  const accMap = new Map(s.accounts.map((a) => [a.id, a] as const));
  const bal = new Map<string, number>();
  for (const j of s.journal) {
    if (j.status !== "posted") continue;
    if (!inRange(j.date, range)) continue;
    for (const l of j.lines) {
      const a = accMap.get(l.account_id);
      if (!a) continue;
      const delta = a.type === "assets" || a.type === "expenses" ? (l.debit - l.credit) : (l.credit - l.debit);
      bal.set(l.account_id, (bal.get(l.account_id) || 0) + delta);
    }
  }
  const collect = (type: Account["type"]): PLRow[] =>
    Array.from(bal.entries())
      .filter(([id]) => accMap.get(id)?.type === type)
      .map(([id, amount]) => {
        const a = accMap.get(id)!;
        return { account_id: id, name_ar: a.name_ar, name_en: a.name_en, amount };
      })
      .filter((r) => Math.abs(r.amount) > 0.001);

  const assets = collect("assets");
  const liabilities = collect("liabilities");
  const equity = collect("equity");
  const pl = buildProfitLossReport(s, range);
  const totalAssets = assets.reduce((s, r) => s + r.amount, 0);
  const totalLiabilities = liabilities.reduce((s, r) => s + r.amount, 0);
  const totalEquity = equity.reduce((s, r) => s + r.amount, 0) + pl.netIncome;
  return { assets, liabilities, equity, totalAssets, totalLiabilities, totalEquity, netIncome: pl.netIncome };
}

// ----------------- Cash Flow (simple direct) -----------------
export interface CFReport { operating: number; investing: number; financing: number; netChange: number; }
export function buildCashFlowReport(s: State, range: DateRange = {}): CFReport {
  const accMap = new Map(s.accounts.map((a) => [a.id, a] as const));
  const cashAccounts = new Set(s.accounts.filter((a) => a.purpose === "cash" || a.purpose === "bank").map((a) => a.id));
  let operating = 0, investing = 0, financing = 0;
  for (const j of s.journal) {
    if (j.status !== "posted") continue;
    if (!inRange(j.date, range)) continue;
    for (const l of j.lines) {
      if (!cashAccounts.has(l.account_id)) continue;
      const cashDelta = l.debit - l.credit;
      // Classify by the counter-account categories on the same JE
      for (const counter of j.lines) {
        if (counter.account_id === l.account_id) continue;
        const a = accMap.get(counter.account_id);
        if (!a) continue;
        const portion = (counter.debit + counter.credit);
        const totalCounter = j.lines.filter((x) => x.account_id !== l.account_id).reduce((s, x) => s + x.debit + x.credit, 0) || 1;
        const share = cashDelta * (portion / totalCounter);
        if (a.cash_flow === "investing") investing += share;
        else if (a.cash_flow === "financing") financing += share;
        else operating += share;
      }
    }
  }
  return { operating, investing, financing, netChange: operating + investing + financing };
}

// ----------------- VAT -----------------
export interface VATReport { outputVat: number; inputVat: number; netVat: number; salesBase: number; purchaseBase: number; }
export function buildVatReport(s: State, range: DateRange = {}): VATReport {
  let outputVat = 0, inputVat = 0, salesBase = 0, purchaseBase = 0;
  for (const inv of s.invoices) {
    if (inv.status === "draft" || inv.status === "cancelled") continue;
    if (!inRange(inv.date, range)) continue;
    const t = docTotals(inv.lines, inv.discount);
    outputVat += t.vat; salesBase += t.afterDiscount;
  }
  for (const p of s.payments) {
    if (!inRange(p.date, range)) continue;
    inputVat += p.vat_amount || 0;
    purchaseBase += p.amount - (p.vat_amount || 0);
  }
  return { outputVat, inputVat, netVat: outputVat - inputVat, salesBase, purchaseBase };
}

// ----------------- Sales by Customer -----------------
export interface SalesByCustomerRow { customer_id: string; name_ar: string; name_en: string; count: number; total: number; paid: number; outstanding: number; }
export function buildSalesByCustomerReport(s: State, range: DateRange = {}): SalesByCustomerRow[] {
  const map = new Map<string, SalesByCustomerRow>();
  for (const inv of s.invoices) {
    if (inv.status === "draft" || inv.status === "cancelled") continue;
    if (!inRange(inv.date, range)) continue;
    const c = s.customers.find((c) => c.id === inv.customer_id);
    if (!c) continue;
    const total = docTotals(inv.lines, inv.discount).total;
    const row = map.get(c.id) || { customer_id: c.id, name_ar: c.name_ar, name_en: c.name_en, count: 0, total: 0, paid: 0, outstanding: 0 };
    row.count += 1; row.total += total; row.paid += inv.paid; row.outstanding += (total - inv.paid);
    map.set(c.id, row);
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

// ----------------- Sales by Product -----------------
export interface SalesByProductRow { item_id: string; name_ar: string; name_en: string; qty: number; revenue: number; }
export function buildSalesByProductReport(s: State, range: DateRange = {}): SalesByProductRow[] {
  const map = new Map<string, SalesByProductRow>();
  for (const inv of s.invoices) {
    if (inv.status === "draft" || inv.status === "cancelled") continue;
    if (!inRange(inv.date, range)) continue;
    for (const l of inv.lines) {
      const item = s.items.find((i) => i.id === l.item_id);
      const id = l.item_id || "_freeform";
      const name_ar = item?.name_ar ?? l.description ?? "—";
      const name_en = item?.name_en ?? l.description ?? "—";
      const row = map.get(id) || { item_id: id, name_ar, name_en, qty: 0, revenue: 0 };
      row.qty += l.qty;
      row.revenue += l.qty * l.unit_price;
      map.set(id, row);
    }
  }
  return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
}

// ----------------- Aged invoices -----------------
export interface AgedInvoiceRow { id: string; number: string; customer_ar: string; customer_en: string; date: string; due: string; total: number; paid: number; remaining: number; daysOverdue: number; }
export function buildAgedInvoiceReports(s: State, opts: { overdueOnly?: boolean; today?: string } = {}): AgedInvoiceRow[] {
  const today = opts.today ?? new Date().toISOString().slice(0, 10);
  const rows: AgedInvoiceRow[] = [];
  for (const inv of s.invoices) {
    if (!["official", "partially_paid"].includes(inv.status)) continue;
    const c = s.customers.find((c) => c.id === inv.customer_id);
    const total = docTotals(inv.lines, inv.discount).total;
    const remaining = total - inv.paid;
    if (remaining <= 0.001) continue;
    const dueDate = new Date(inv.due);
    const todayDate = new Date(today);
    const daysOverdue = Math.floor((todayDate.getTime() - dueDate.getTime()) / 86400000);
    if (opts.overdueOnly && daysOverdue <= 0) continue;
    rows.push({
      id: inv.id, number: inv.number,
      customer_ar: c?.name_ar ?? "—", customer_en: c?.name_en ?? "—",
      date: inv.date, due: inv.due, total, paid: inv.paid, remaining,
      daysOverdue: Math.max(0, daysOverdue),
    });
  }
  return rows.sort((a, b) => b.daysOverdue - a.daysOverdue);
}

// ----------------- General Ledger -----------------
export interface GLRow { date: string; je_number: string; description: string; account_id: string; debit: number; credit: number; balance: number; }
export function buildGeneralLedger(s: State, accountId: string, range: DateRange = {}): GLRow[] {
  const rows: GLRow[] = [];
  let bal = 0;
  const sorted = [...s.journal].filter((j) => j.status === "posted").sort((a, b) => a.date.localeCompare(b.date));
  for (const j of sorted) {
    if (!inRange(j.date, range)) continue;
    for (const l of j.lines) {
      if (l.account_id !== accountId) continue;
      bal += (l.debit - l.credit);
      rows.push({ date: j.date, je_number: j.number, description: l.description || j.description, account_id: l.account_id, debit: l.debit, credit: l.credit, balance: bal });
    }
  }
  return rows;
}
