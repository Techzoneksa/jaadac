/**
 * JAAD CLOUD Phase 2.1.9 — local-only entities used by the foundation modules
 * (Bank Accounts, Projects). These persist to localStorage and are NOT part of
 * the main store/adapter. They are demo-only and do not touch the backend.
 */

import { useSyncExternalStore } from "react";

export type ID = string;
const uid = () => Math.random().toString(36).slice(2, 10);

// =================== Bank Accounts ===================
export type BankAccountType = "bank" | "cash" | "petty_cash";

export interface BankAccount {
  id: ID;
  name_ar: string;
  name_en: string;
  type: BankAccountType;
  bank_name?: string;
  account_number?: string;
  iban?: string;
  currency: string;
  opening_balance: number;
  status: "active" | "inactive";
  notes?: string;
  created_at: string;
}

const BA_KEY = "jaad_bank_accounts_v1";

// =================== Projects ===================
export interface Project {
  id: ID;
  code: string;
  name_ar: string;
  name_en: string;
  manager?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  status: "active" | "on_hold" | "completed";
  notes?: string;
  created_at: string;
}

const PR_KEY = "jaad_projects_v1";

// =================== Shared subscribe pattern ===================
const listeners = new Set<() => void>();
function notify() { listeners.forEach((l) => l()); }

function readKey<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(key) || "[]") as T[]; } catch { return []; }
}
function writeKey<T>(key: string, value: T[]) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* noop */ }
  notify();
}

function makeSnapshotHook<T>(key: string) {
  // Cache the snapshot so getSnapshot returns the same reference until data changes.
  let cache: T[] | null = null;
  let cacheRaw: string | null = null;
  return () => useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => { listeners.delete(cb); }; },
    () => {
      if (typeof window === "undefined") return cache ?? (cache = []);
      const raw = localStorage.getItem(key) || "[]";
      if (raw !== cacheRaw) {
        cacheRaw = raw;
        try { cache = JSON.parse(raw); } catch { cache = []; }
      }
      return (cache ?? []) as T[];
    },
    () => (cache ?? []) as T[],
  );
}

// =================== BankAccountService ===================
export const BankAccountService = {
  list(): BankAccount[] { return readKey<BankAccount>(BA_KEY); },
  create(input: Omit<BankAccount, "id" | "created_at">): BankAccount {
    const full: BankAccount = { ...input, id: uid(), created_at: new Date().toISOString() };
    writeKey(BA_KEY, [...this.list(), full]);
    return full;
  },
  update(id: ID, patch: Partial<BankAccount>) {
    writeKey(BA_KEY, this.list().map((b) => (b.id === id ? { ...b, ...patch } : b)));
  },
  remove(id: ID) {
    writeKey(BA_KEY, this.list().filter((b) => b.id !== id));
  },
};
export const useBankAccounts = makeSnapshotHook<BankAccount>(BA_KEY);

// =================== ProjectService ===================
export const ProjectService = {
  list(): Project[] { return readKey<Project>(PR_KEY); },
  create(input: Omit<Project, "id" | "created_at">): Project {
    const full: Project = { ...input, id: uid(), created_at: new Date().toISOString() };
    writeKey(PR_KEY, [...this.list(), full]);
    return full;
  },
  update(id: ID, patch: Partial<Project>) {
    writeKey(PR_KEY, this.list().map((p) => (p.id === id ? { ...p, ...patch } : p)));
  },
  remove(id: ID) {
    writeKey(PR_KEY, this.list().filter((p) => p.id !== id));
  },
};
export const useProjects = makeSnapshotHook<Project>(PR_KEY);
