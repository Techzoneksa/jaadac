// Hierarchical chart-of-accounts helpers.
// Pure functions over the existing `Account` model; no store mutation here.

import type { Account, AccountClass } from "@/lib/store";

export interface ChartNode {
  account: Account;
  level: number;
  children: ChartNode[];
  childCount: number;
  hasChildren: boolean;
}

const CLASS_ORDER: Record<AccountClass, number> = {
  assets: 1, liabilities: 2, equity: 3, revenue: 4, expenses: 5,
};

/** Build a tree from a flat account list. Sorts by class, then by `number`. */
export function buildChartTree(accounts: Account[]): ChartNode[] {
  const byId = new Map<string, ChartNode>();
  for (const a of accounts) {
    byId.set(a.id, { account: a, level: 0, children: [], childCount: 0, hasChildren: false });
  }
  const roots: ChartNode[] = [];
  for (const node of byId.values()) {
    const parentId = node.account.parent;
    if (parentId && byId.has(parentId)) {
      byId.get(parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  const sortNodes = (list: ChartNode[], level: number) => {
    list.sort((a, b) => {
      const ca = CLASS_ORDER[a.account.type] ?? 99;
      const cb = CLASS_ORDER[b.account.type] ?? 99;
      if (ca !== cb) return ca - cb;
      return a.account.number.localeCompare(b.account.number, "en", { numeric: true });
    });
    for (const n of list) {
      n.level = level;
      n.childCount = n.children.length;
      n.hasChildren = n.children.length > 0;
      sortNodes(n.children, level + 1);
    }
  };
  sortNodes(roots, 0);
  return roots;
}

/** Depth-first flatten — respects `openIds`: a closed parent omits its descendants. */
export function flattenChartTree(roots: ChartNode[], openIds: Set<string>): ChartNode[] {
  const out: ChartNode[] = [];
  const walk = (node: ChartNode) => {
    out.push(node);
    if (node.hasChildren && openIds.has(node.account.id)) {
      for (const c of node.children) walk(c);
    }
  };
  for (const r of roots) walk(r);
  return out;
}

/** All node IDs that have children — used by "Expand all". */
export function allExpandableIds(roots: ChartNode[]): string[] {
  const out: string[] = [];
  const walk = (n: ChartNode) => { if (n.hasChildren) { out.push(n.account.id); n.children.forEach(walk); } };
  roots.forEach(walk);
  return out;
}

/** Ancestor IDs for a node — used to auto-expand on search match. */
export function ancestorIds(accounts: Account[], id: string): string[] {
  const byId = new Map(accounts.map(a => [a.id, a] as const));
  const out: string[] = [];
  let cur = byId.get(id)?.parent;
  while (cur) {
    out.push(cur);
    cur = byId.get(cur)?.parent;
  }
  return out;
}

/** Search across code, AR/EN name, and purpose. Case-insensitive. */
export function searchChartAccounts(accounts: Account[], q: string): Account[] {
  const term = q.trim().toLowerCase();
  if (!term) return accounts;
  return accounts.filter((a) =>
    a.number.toLowerCase().includes(term) ||
    a.name_ar.toLowerCase().includes(term) ||
    (a.name_en ?? "").toLowerCase().includes(term) ||
    (a.purpose ?? "").toLowerCase().includes(term) ||
    a.type.toLowerCase().includes(term),
  );
}

export interface ValidationResult { ok: boolean; error?: string; }

/** Validate before upsert. */
export function validateAccount(
  draft: Partial<Account>,
  all: Account[],
  editingId?: string,
): ValidationResult {
  if (!draft.number?.trim() || !draft.name_ar?.trim()) return { ok: false, error: "required" };
  const duplicate = all.some(
    (a) => a.id !== editingId && a.number.trim() === draft.number!.trim(),
  );
  if (duplicate) return { ok: false, error: "duplicate" };
  return { ok: true };
}

export function isLocked(a: Account): boolean { return !!a.locked; }
export function isPosting(a: Account): boolean { return (a.kind ?? "posting") === "posting"; }
