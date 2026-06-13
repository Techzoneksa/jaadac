/**
 * Lightweight, demo-safe usage tracking for smart selectors (Phase 2.1.8).
 *
 * Records the last time and total count an entity (customer / supplier /
 * item / invoice) was selected in a form, so smart selectors can show
 * "recent / most-used" suggestions when the search field is empty.
 *
 * Storage: localStorage only. No backend writes. Reset with demo reset.
 * The snapshot helpers let the existing migration export pick this up later
 * without requiring a backend table now.
 */

export type TrackedEntity = "customer" | "supplier" | "item" | "invoice";

export interface UsageRecord {
  id: string;
  count: number;
  last_at: string; // ISO
}

type UsageMap = Record<TrackedEntity, Record<string, UsageRecord>>;

const STORAGE_KEY = "jaad.usage_tracking.v1";

function emptyMap(): UsageMap {
  return { customer: {}, supplier: {}, item: {}, invoice: {} };
}

function read(): UsageMap {
  if (typeof window === "undefined") return emptyMap();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyMap();
    const parsed = JSON.parse(raw) as Partial<UsageMap>;
    return { ...emptyMap(), ...parsed };
  } catch {
    return emptyMap();
  }
}

function write(map: UsageMap) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota errors */
  }
}

export const UsageTrackingService = {
  recordSelection(entity: TrackedEntity, id: string) {
    if (!id) return;
    const map = read();
    const slot = map[entity] || {};
    const prev = slot[id];
    slot[id] = {
      id,
      count: (prev?.count || 0) + 1,
      last_at: new Date().toISOString(),
    };
    map[entity] = slot;
    write(map);
  },

  /** Returns ids ordered by (count desc, last_at desc). */
  getSuggestions(entity: TrackedEntity, limit = 6): string[] {
    const slot = read()[entity] || {};
    return Object.values(slot)
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return b.last_at.localeCompare(a.last_at);
      })
      .slice(0, limit)
      .map((r) => r.id);
  },

  getRecord(entity: TrackedEntity, id: string): UsageRecord | undefined {
    return read()[entity]?.[id];
  },

  /** Reset all usage tracking (used by demo reset). */
  reset() {
    if (typeof window === "undefined") return;
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
  },

  /** Snapshot helpers — future-ready for migration export. */
  exportSnapshot(): UsageMap {
    return read();
  },
  importSnapshot(map: Partial<UsageMap>) {
    write({ ...emptyMap(), ...map });
  },
};
