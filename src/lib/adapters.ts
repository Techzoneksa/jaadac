import { store, type State, type ID } from "./store";
import type { PaginatedResult, ListQueryParams } from "./contracts";

export interface DataAdapter {
  getState(): State;
  create<K extends keyof State>(key: K, item: State[K] extends Array<infer U> ? U : never): void;
  list<K extends keyof State>(key: K, params?: ListQueryParams): PaginatedResult<State[K] extends Array<infer U> ? U : never>;
  getById<K extends keyof State>(key: K, id: ID): (State[K] extends Array<infer U> ? U : never) | undefined;
  update<K extends keyof State>(key: K, id: ID, patch: Partial<State[K] extends Array<infer U> ? U : never>): void;
  remove<K extends keyof State>(key: K, id: ID): void;
  replaceState(partial: Partial<State>): void;
  resetDemo(actor?: ID): void;
}

class LocalStorageAdapter implements DataAdapter {
  getState(): State {
    return store.getState();
  }

  create<K extends keyof State>(key: K, item: State[K] extends Array<infer U> ? U : never): void {
    store.set((s) => {
      const arr = [...(s[key] as any[]), item];
      return { ...s, [key]: arr };
    });
  }

  list<K extends keyof State>(key: K, params?: ListQueryParams): PaginatedResult<State[K] extends Array<infer U> ? U : never> {
    const all = store.getState()[key] as any[];
    let filtered = all;
    if (params?.tenantId) {
      filtered = filtered.filter((item: any) => !item.tenant_id || item.tenant_id === params.tenantId);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter((item: any) =>
        Object.values(item).some((v: any) => String(v).toLowerCase().includes(q))
      );
    }
    if (params?.status) {
      filtered = filtered.filter((item: any) => item.status === params.status);
    }
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? (filtered.length || 25);
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);
    return { items, total: filtered.length, page, pageSize };
  }

  getById<K extends keyof State>(key: K, id: ID): (State[K] extends Array<infer U> ? U : never) | undefined {
    const arr = store.getState()[key] as any[];
    return arr.find((item: any) => item.id === id) as any;
  }

  update<K extends keyof State>(key: K, id: ID, patch: Partial<State[K] extends Array<infer U> ? U : never>): void {
    store.set((s) => {
      const arr = [...(s[key] as any[])];
      const idx = arr.findIndex((item: any) => item.id === id);
      if (idx !== -1) arr[idx] = { ...arr[idx], ...patch };
      return { ...s, [key]: arr };
    });
  }

  remove<K extends keyof State>(key: K, id: ID): void {
    store.set((s) => {
      const arr = (s[key] as any[]).filter((item: any) => item.id !== id);
      return { ...s, [key]: arr };
    });
  }

  replaceState(partial: Partial<State>): void {
    store.set((s) => ({ ...s, ...partial }));
  }

  resetDemo(actor?: ID): void {
    store.reset();
  }
}

let instance: DataAdapter | null = null;

export function getAdapter(): DataAdapter {
  if (!instance) instance = new LocalStorageAdapter();
  return instance;
}
