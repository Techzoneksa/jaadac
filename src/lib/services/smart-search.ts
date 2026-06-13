/**
 * Smart AJAX-style search services (Phase 2.1.8).
 *
 * These services power the smart selector components (customer, supplier,
 * item, invoice). They read through the existing service / adapter layer so
 * swapping the data source later (real backend) requires no UI changes.
 *
 * Each `searchSmart()` returns a synchronous result for the local demo
 * adapter but is shaped so it can be promisified later for a real API.
 */

import { docTotals, type Customer, type Supplier, type Item, type Invoice, type Account } from "@/lib/store";
import {
  CustomerService, SupplierService, ItemService, InvoiceService, JournalService,
} from "@/lib/services";

import { UsageTrackingService, type TrackedEntity } from "@/lib/usage-tracking";

export interface SmartSearchOptions {
  tenantId?: string;
  limit?: number;
}

export interface SmartSuggestionMeta {
  source: "frequent" | "recent" | "fallback";
}

function norm(v: string | undefined | null): string {
  return (v || "").toString().toLowerCase().trim();
}

function matchesAny(haystacks: (string | undefined | null)[], q: string): boolean {
  if (!q) return true;
  const needle = norm(q);
  return haystacks.some((h) => norm(h).includes(needle));
}

/** Order a list using usage-tracking suggestions first, then fallback. */
function withSuggestions<T extends { id: string }>(
  entity: TrackedEntity,
  list: T[],
  limit: number,
  fallbackSort: (a: T, b: T) => number,
): { items: T[]; meta: SmartSuggestionMeta } {
  const ids = UsageTrackingService.getSuggestions(entity, limit);
  if (ids.length === 0) {
    return {
      items: [...list].sort(fallbackSort).slice(0, limit),
      meta: { source: "fallback" },
    };
  }
  const byId = new Map(list.map((x) => [x.id, x]));
  const ordered = ids.map((id) => byId.get(id)).filter(Boolean) as T[];
  const remaining = list.filter((x) => !ids.includes(x.id));
  remaining.sort(fallbackSort);
  return {
    items: [...ordered, ...remaining].slice(0, limit),
    meta: { source: "frequent" },
  };
}

// =============== Customer ===============
export const CustomerSearchService = {
  searchSmart(query: string, opts: SmartSearchOptions = {}) {
    const limit = opts.limit ?? 10;
    const all = CustomerService.list(opts.tenantId).filter((c) => c.status !== "inactive" && !c.archived);
    if (!query.trim()) {
      return withSuggestions<Customer>("customer", all, opts.limit ?? 6, (a, b) =>
        (b.name_en || "").localeCompare(a.name_en || ""),
      );
    }
    const results = all
      .filter((c) => matchesAny([c.name_ar, c.name_en, c.mobile, c.email, c.vat], query))
      .slice(0, limit);
    return { items: results, meta: { source: "fallback" as const } };
  },
};

// =============== Supplier ===============
export const SupplierSearchService = {
  searchSmart(query: string, opts: SmartSearchOptions = {}) {
    const limit = opts.limit ?? 10;
    const all = SupplierService.list(opts.tenantId).filter((s) => s.status !== "inactive" && !s.archived);
    if (!query.trim()) {
      return withSuggestions<Supplier>("supplier", all, opts.limit ?? 6, (a, b) =>
        (b.name_en || "").localeCompare(a.name_en || ""),
      );
    }
    const results = all
      .filter((s) => matchesAny([s.name_ar, s.name_en, s.mobile, s.email, s.vat], query))
      .slice(0, limit);
    return { items: results, meta: { source: "fallback" as const } };
  },
};

// =============== Item / Service ===============
export const ItemSearchService = {
  searchSmart(query: string, opts: SmartSearchOptions = {}) {
    const limit = opts.limit ?? 10;
    const all = ItemService.list(opts.tenantId).filter((i) => i.status !== "inactive");
    if (!query.trim()) {
      return withSuggestions<Item>("item", all, opts.limit ?? 6, (a, b) =>
        (b.name_en || "").localeCompare(a.name_en || ""),
      );
    }
    const results = all
      .filter((i) => matchesAny([i.name_ar, i.name_en, i.sku, i.description, i.type], query))
      .slice(0, limit);
    return { items: results, meta: { source: "fallback" as const } };
  },
};

// =============== Invoice ===============
export interface InvoiceSearchOptions extends SmartSearchOptions {
  customerId?: string;
  /** Prefer unpaid / partially paid invoices when query is empty. */
  unpaidFirst?: boolean;
}

export interface InvoiceSearchRow {
  invoice: Invoice;
  total: number;
  remaining: number;
}

export const InvoiceSearchService = {
  searchSmart(query: string, opts: InvoiceSearchOptions = {}) {
    const limit = opts.limit ?? 10;
    let all = InvoiceService.list(opts.tenantId)
      .filter((i) => i.status !== "draft" && i.status !== "cancelled");
    if (opts.customerId) all = all.filter((i) => i.customer_id === opts.customerId);

    const enrich = (inv: Invoice): InvoiceSearchRow => {
      const t = docTotals(inv.lines, inv.discount);
      return { invoice: inv, total: t.total, remaining: t.total - (inv.paid || 0) };
    };

    if (!query.trim()) {
      const rows = all.map(enrich);
      if (opts.unpaidFirst) {
        rows.sort((a, b) => {
          const ua = a.remaining > 0.01 ? 0 : 1;
          const ub = b.remaining > 0.01 ? 0 : 1;
          if (ua !== ub) return ua - ub;
          return (b.invoice.date || "").localeCompare(a.invoice.date || "");
        });
        return {
          items: rows.slice(0, opts.limit ?? 6),
          meta: { source: "fallback" as const },
        };
      }
      const ids = UsageTrackingService.getSuggestions("invoice", opts.limit ?? 6);
      if (ids.length > 0) {
        const byId = new Map(rows.map((r) => [r.invoice.id, r]));
        const ordered = ids.map((id) => byId.get(id)).filter(Boolean) as InvoiceSearchRow[];
        const rest = rows
          .filter((r) => !ids.includes(r.invoice.id))
          .sort((a, b) => (b.invoice.date || "").localeCompare(a.invoice.date || ""));
        return {
          items: [...ordered, ...rest].slice(0, opts.limit ?? 6),
          meta: { source: "frequent" as const },
        };
      }
      rows.sort((a, b) => (b.invoice.date || "").localeCompare(a.invoice.date || ""));
      return { items: rows.slice(0, opts.limit ?? 6), meta: { source: "fallback" as const } };
    }

    const q = query.toLowerCase();
    const rows = all
      .filter((i) => matchesAny([i.number, i.date, i.status, String(docTotals(i.lines, i.discount).total)], q))
      .map(enrich)
      .slice(0, limit);
    return { items: rows, meta: { source: "fallback" as const } };
  },
};

// =============== Account (Phase 2.1.13) ===============


export const AccountSearchService = {
  searchSmart(query: string, opts: SmartSearchOptions = {}) {
    const limit = opts.limit ?? 10;
    const all = JournalService.getPostingAccounts(opts.tenantId);
    if (!query.trim()) {
      return withSuggestions<Account>("item", all, opts.limit ?? 8, (a, b) =>
        a.number.localeCompare(b.number),
      );
    }
    const results = all
      .filter((a) => matchesAny([a.number, a.name_ar, a.name_en, a.purpose, a.type], query))
      .sort((a, b) => a.number.localeCompare(b.number))
      .slice(0, limit);
    return { items: results, meta: { source: "fallback" as const } };
  },
};
