/**
 * Phase 1.4 — LocalStorageDataAdapter
 *
 * Wraps the existing `store` (localStorage-backed) and exposes it via the
 * standard DataAdapter contract. This is the active adapter in demo mode.
 */
import { store, DEMO_TENANT_ID, type State, type ID } from "@/lib/store";
import type { ListQueryParams, PaginatedResult } from "@/lib/contracts";
import { DEFAULT_PAGE_SIZE } from "@/lib/contracts";
import type { AdapterStatus, DataAdapter, EntityKey, MigrationSnapshot } from "./types";

const STORAGE_KEY = "jaad_state_v2";
const SEED_VERSION = "1.4.0";

function matchesSearch(record: any, q: string): boolean {
  const s = q.toLowerCase();
  return Object.values(record).some((v) =>
    typeof v === "string" && v.toLowerCase().includes(s),
  );
}

export class LocalStorageDataAdapter implements DataAdapter {
  get status(): AdapterStatus {
    const meta = store.getState() as State & { _meta?: { lastResetAt?: string; resetBy?: ID } };
    return {
      mode: "demo",
      name: "LocalStorageDataAdapter",
      connected: true,
      storageKey: STORAGE_KEY,
      version: SEED_VERSION,
      lastResetAt: meta._meta?.lastResetAt,
      resetBy: meta._meta?.resetBy,
    };
  }

  subscribe(listener: () => void) {
    return store.subscribe(listener);
  }

  getState(): State {
    return store.getState();
  }

  list<K extends EntityKey>(key: K, params: ListQueryParams = {}) {
    const tenantId = params.tenantId || DEMO_TENANT_ID;
    const arr = store.getState()[key] as unknown as any[];
    if (!Array.isArray(arr)) {
      return { items: [], total: 0, page: 1, pageSize: 0 } as PaginatedResult<any>;
    }

    let items = arr.filter((x) => (x.tenant_id ?? DEMO_TENANT_ID) === tenantId);

    if (params.search) items = items.filter((x) => matchesSearch(x, params.search!));
    if (params.status && params.status !== "all") items = items.filter((x) => x.status === params.status);
    if (params.from) items = items.filter((x) => !x.date || x.date >= params.from!);
    if (params.to) items = items.filter((x) => !x.date || x.date <= params.to!);
    if (params.filters) {
      for (const [field, val] of Object.entries(params.filters)) {
        if (val === undefined || val === "" || val === "all") continue;
        items = items.filter((x) => x[field] === val);
      }
    }
    if (params.sortBy) {
      const dir = params.sortDir === "desc" ? -1 : 1;
      const f = params.sortBy;
      items = [...items].sort((a, b) => (a[f] > b[f] ? dir : a[f] < b[f] ? -dir : 0));
    }

    const total = items.length;
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? Math.max(total, DEFAULT_PAGE_SIZE);
    const start = (page - 1) * pageSize;
    const paged = pageSize >= total ? items : items.slice(start, start + pageSize);
    return { items: paged, total, page, pageSize } as PaginatedResult<any>;
  }

  getById<K extends EntityKey>(key: K, id: ID) {
    const arr = store.getState()[key] as unknown as any[];
    return Array.isArray(arr) ? (arr.find((x) => x.id === id) as any) : undefined;
  }

  create<K extends EntityKey>(key: K, record: any) {
    store.set((s) => ({ ...s, [key]: [...(s[key] as any[]), record] } as State));
  }

  update<K extends EntityKey>(key: K, id: ID, patch: any) {
    store.set((s) => ({
      ...s,
      [key]: (s[key] as any[]).map((x) => (x.id === id ? { ...x, ...patch } : x)),
    } as State));
  }

  remove<K extends EntityKey>(key: K, id: ID) {
    store.set((s) => ({
      ...s,
      [key]: (s[key] as any[]).filter((x) => x.id !== id),
    } as State));
  }

  replaceState(next: Partial<State>) {
    store.set((s) => ({ ...s, ...next }));
  }

  resetDemo(actor?: ID) {
    store.reset();
    const meta = { lastResetAt: new Date().toISOString(), resetBy: actor };
    store.set((s) => ({ ...s, _meta: meta } as any));
  }

  exportSnapshot(): MigrationSnapshot {
    return {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      productName: "JAAD CLOUD",
      productNameAr: "جاد كلاود",
      storageKey: STORAGE_KEY,
      state: JSON.parse(JSON.stringify(store.getState())),
    };
  }
}
