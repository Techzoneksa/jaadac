/**
 * Phase 1.4 — DataAdapter interface.
 *
 * Persistence-agnostic contract every storage backend must implement.
 * UI never imports an adapter directly; services route through the active
 * adapter exposed by `src/lib/adapters/index.ts`.
 */
import type { State, ID } from "@/lib/store";
import type { ListQueryParams, PaginatedResult } from "@/lib/contracts";

export type EntityKey = keyof State;

export interface AdapterStatus {
  mode: "demo" | "backend";
  name: string;
  connected: boolean;
  storageKey?: string;
  version: string;
  lastResetAt?: string;
  resetBy?: ID;
}

export interface DataAdapter {
  readonly status: AdapterStatus;

  /** Subscribe to underlying data changes (UI reactivity). */
  subscribe(listener: () => void): () => void;

  /** Snapshot full state. */
  getState(): State;

  /** Generic list / search / paginate over an array entity. */
  list<K extends EntityKey>(
    key: K,
    params?: ListQueryParams,
  ): PaginatedResult<State[K] extends Array<infer U> ? U : never>;

  getById<K extends EntityKey>(
    key: K,
    id: ID,
  ): (State[K] extends Array<infer U> ? U : never) | undefined;

  create<K extends EntityKey>(
    key: K,
    record: State[K] extends Array<infer U> ? U : never,
  ): void;

  update<K extends EntityKey>(
    key: K,
    id: ID,
    patch: Partial<State[K] extends Array<infer U> ? U : never>,
  ): void;

  remove<K extends EntityKey>(key: K, id: ID): void;

  /** Replace entire state (used by reset / restore-from-snapshot). */
  replaceState(next: Partial<State>): void;

  /** Reset to the seeded demo data. */
  resetDemo(actor?: ID): void;

  /** Export a backend-seeding snapshot. */
  exportSnapshot(): MigrationSnapshot;
}

export interface MigrationSnapshot {
  schemaVersion: number;
  exportedAt: string;
  productName: string;
  productNameAr: string;
  storageKey: string;
  state: State;
}
