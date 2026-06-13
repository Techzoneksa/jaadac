/**
 * Phase 1.4 — Central adapter config / provider.
 *
 * UI → Service → DataAdapter (here) → underlying storage.
 *
 * Switching `DATA_MODE` to "backend" activates the placeholder adapter, which
 * intentionally throws everywhere until a real backend is wired up.
 */
import { LocalStorageDataAdapter } from "./LocalStorageDataAdapter";
import { FutureBackendDataAdapter } from "./FutureBackendDataAdapter";
import type { DataAdapter } from "./types";

export type DataMode = "demo" | "backend";

export const DATA_MODE: DataMode = "demo";

const demoAdapter = new LocalStorageDataAdapter();
const backendAdapter = new FutureBackendDataAdapter();

let active: DataAdapter = DATA_MODE === "demo" ? demoAdapter : backendAdapter;

export function getAdapter(): DataAdapter {
  return active;
}

/** Reserved — will be enabled once a real backend is connected. */
export function setAdapter(_mode: DataMode): void {
  // Switching is locked during Phase 1.4; backend is not yet connected.
  active = demoAdapter;
}

export { demoAdapter, backendAdapter };
export type { DataAdapter, AdapterStatus, MigrationSnapshot, EntityKey } from "./types";
