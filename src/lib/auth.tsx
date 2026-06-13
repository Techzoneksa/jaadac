import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { store, useStore, type UserRole, type ID, DEMO_TENANT_ID } from "@/lib/store";

export interface AuthSession {
  user_id: ID;
  tenant_id: ID;
  role: UserRole;
}

const STORAGE_KEY = "jaad_auth_v1";
const DEFAULT_SESSION: AuthSession = { user_id: "u1", tenant_id: DEMO_TENANT_ID, role: "owner" };

interface AuthCtx {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  user: ReturnType<typeof getUser>;
  tenant: ReturnType<typeof getTenant>;
  login: (email: string, _password: string) => Promise<boolean>;
  register: (name: string, email: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  switchTenant: (tenant_id: ID) => void;
  can: (perm: Permission) => boolean;
  canAny: (perms: Permission[]) => boolean;
}

const Ctx = createContext<AuthCtx | null>(null);

function getUser(session: AuthSession | null) {
  if (!session) return null;
  return store.getState().users.find((u) => u.id === session.user_id) ?? null;
}
function getTenant(session: AuthSession | null) {
  if (!session) return null;
  return store.getState().tenants.find((t) => t.id === session.tenant_id) ?? null;
}

// ===== Permissions =====
export type Permission =
  | "dashboard.view"
  | "customers.view" | "customers.manage"
  | "suppliers.view" | "suppliers.manage"
  | "items.view" | "items.manage"
  | "quotations.view" | "quotations.manage"
  | "invoices.view" | "invoices.create" | "invoices.issue"
  | "receipts.view" | "receipts.manage"
  | "payments.view" | "payments.manage"
  | "accounting.view" | "accounts.manage" | "journal.post"
  | "tasks.view" | "tasks.manage"
  | "reports.view"
  | "settings.view" | "settings.manage"
  | "users.manage"
  | "audit.view"
  | "demo.reset"
  // Phase 2.2
  | "templates.manage"
  | "custom_fields.manage"
  | "payroll.view" | "payroll.manage"
  | "employees.view" | "employees.manage"
  | "branches.view" | "branches.manage"
  | "communication.view" | "communication.manage"
  | "bulk_edit.manage"
  | "quick_actions.use"
  // Phase 2.1.6 — foundation modules
  | "sales_orders.view" | "sales_orders.manage"
  | "purchase_orders.view" | "purchase_orders.manage"
  | "purchase_invoices.view" | "purchase_invoices.manage"
  | "credit_notes.view" | "credit_notes.manage"
  | "debit_notes.view" | "debit_notes.manage"
  | "cost_centers.view" | "cost_centers.manage"
  | "inventory.view" | "inventory.manage"
  | "data_migration.view"
  | "integrations.view"
  | "templates.view"
  | "zatca.view"
  | "hr.view"
  | "fixed_assets.view" | "fixed_assets.manage"
  | "roadmap.view"
  // Phase 2.1.9 — Finance structure
  | "bank_accounts.view" | "bank_accounts.manage"
  | "projects.view" | "projects.manage"
  // Phase 2.1.14 — Taxes
  | "taxes.view" | "taxes.manage";

const ALL_PERMS: Permission[] = [
  "dashboard.view",
  "customers.view", "customers.manage",
  "suppliers.view", "suppliers.manage",
  "items.view", "items.manage",
  "quotations.view", "quotations.manage",
  "invoices.view", "invoices.create", "invoices.issue",
  "receipts.view", "receipts.manage",
  "payments.view", "payments.manage",
  "accounting.view", "accounts.manage", "journal.post",
  "tasks.view", "tasks.manage",
  "reports.view",
  "settings.view", "settings.manage",
  "users.manage", "audit.view", "demo.reset",
  "templates.manage", "custom_fields.manage",
  "payroll.view", "payroll.manage",
  "employees.view", "employees.manage",
  "branches.view", "branches.manage",
  "communication.view", "communication.manage",
  "bulk_edit.manage", "quick_actions.use",
  "sales_orders.view", "sales_orders.manage",
  "purchase_orders.view", "purchase_orders.manage",
  "purchase_invoices.view", "purchase_invoices.manage",
  "credit_notes.view", "credit_notes.manage",
  "debit_notes.view", "debit_notes.manage",
  "cost_centers.view", "cost_centers.manage",
  "inventory.view", "inventory.manage",
  "data_migration.view", "integrations.view",
  "templates.view", "zatca.view",
  "hr.view", "fixed_assets.view", "fixed_assets.manage", "roadmap.view",
  "bank_accounts.view", "bank_accounts.manage",
  "projects.view", "projects.manage",
  "taxes.view", "taxes.manage",
];

const ROLE_PERMS: Record<UserRole, Permission[]> = {
  owner: ALL_PERMS,
  accountant: [
    "dashboard.view",
    "customers.view", "suppliers.view", "items.view",
    "quotations.view",
    "invoices.view", "invoices.create", "invoices.issue",
    "receipts.view", "receipts.manage",
    "payments.view", "payments.manage",
    "accounting.view", "accounts.manage", "journal.post",
    "tasks.view", "tasks.manage",
    "reports.view", "settings.view", "audit.view",
    "templates.manage", "custom_fields.manage",
    "payroll.view", "payroll.manage",
    "employees.view",
    "branches.view",
    "communication.view", "communication.manage",
    "bulk_edit.manage", "quick_actions.use",
    // Foundation reads + accounting-side manage
    "purchase_invoices.view", "purchase_invoices.manage",
    "purchase_orders.view",
    "sales_orders.view",
    "credit_notes.view", "credit_notes.manage",
    "debit_notes.view", "debit_notes.manage",
    "cost_centers.view", "cost_centers.manage",
    "inventory.view",
    "data_migration.view", "integrations.view",
    "templates.view", "zatca.view",
    "fixed_assets.view",
    "bank_accounts.view", "bank_accounts.manage",
    "projects.view", "projects.manage",
    "taxes.view", "taxes.manage",
  ],
  sales_employee: [
    "dashboard.view",
    "customers.view", "customers.manage",
    "items.view",
    "quotations.view", "quotations.manage",
    "invoices.view", "invoices.create",
    "receipts.view",
    "tasks.view", "tasks.manage",
    "reports.view",
    "communication.view",
    "bulk_edit.manage",
    "quick_actions.use",
    "sales_orders.view", "sales_orders.manage",
    "templates.view",
    "taxes.view",
  ],
  viewer: [
    "dashboard.view",
    "customers.view", "suppliers.view", "items.view",
    "quotations.view", "invoices.view",
    "receipts.view", "payments.view",
    "accounting.view", "reports.view",
    "tasks.view", "audit.view",
    "employees.view", "branches.view",
    "payroll.view",
    "communication.view",
    "quick_actions.use",
    "sales_orders.view", "purchase_orders.view",
    "purchase_invoices.view",
    "credit_notes.view", "debit_notes.view",
    "cost_centers.view", "inventory.view",
    "data_migration.view", "integrations.view",
    "templates.view", "zatca.view",
    "hr.view", "fixed_assets.view",
    "bank_accounts.view", "projects.view",
    "taxes.view",
  ],
};

export function hasPermission(role: UserRole, perm: Permission): boolean {
  return ROLE_PERMS[role]?.includes(perm) ?? false;
}

export function rolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMS[role] ?? [];
}

export const ALL_PERMISSIONS = ALL_PERMS;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setSession(JSON.parse(raw));
        return;
      }
    } catch {}
    setSession(DEFAULT_SESSION);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SESSION));
  }, []);

  useStore((s) => s.users.length + s.tenants.length);

  const persist = (s: AuthSession | null) => {
    setSession(s);
    if (typeof window === "undefined") return;
    if (s) localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    else localStorage.removeItem(STORAGE_KEY);
  };

  const logAudit = (action: string, ar: string, en: string, s: AuthSession) => {
    import("@/lib/services").then(({ AuditService }) =>
      AuditService.log({
        tenant_id: s.tenant_id, user_id: s.user_id,
        action, entity_type: "auth",
        description_ar: ar, description_en: en,
      })
    );
  };

  const login: AuthCtx["login"] = async (email) => {
    const u = store.getState().users.find((x) => x.email.toLowerCase() === email.toLowerCase());
    const s = u
      ? { user_id: u.id, tenant_id: u.tenant_id || DEMO_TENANT_ID, role: u.role }
      : DEFAULT_SESSION;
    persist(s);
    logAudit("auth.login", `تسجيل دخول ${email}`, `Login ${email}`, s);
    return true;
  };

  const register: AuthCtx["register"] = async () => {
    persist(DEFAULT_SESSION);
    return true;
  };

  const logout = () => {
    if (session) logAudit("auth.logout", "تسجيل خروج", "Logout", session);
    persist(null);
  };
  const switchRole = (role: UserRole) => {
    if (!session) return;
    const next = { ...session, role };
    persist(next);
    logAudit("auth.role_switched", `تبديل الدور إلى ${role}`, `Switched role to ${role}`, next);
  };
  const switchTenant = (tenant_id: ID) => {
    if (!session) return;
    const next = { ...session, tenant_id };
    persist(next);
    logAudit("auth.tenant_switched", "تبديل المؤسسة", "Switched organization", next);
  };

  const user = getUser(session);
  const tenant = getTenant(session);
  const can = (perm: Permission) => (session ? hasPermission(session.role, perm) : false);

  const value: AuthCtx = {
    session,
    isAuthenticated: !!session,
    isDemoMode: true,
    user,
    tenant,
    login, register, logout, switchRole, switchTenant,
    can,
    canAny: (perms) => perms.some(can),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// ===== Toast helper for denied actions =====
export async function notifyDenied(lang: "ar" | "en" = "ar") {
  const { toast } = await import("sonner");
  toast.error(
    lang === "ar"
      ? "ليس لديك صلاحية لتنفيذ هذا الإجراء"
      : "You do not have permission to perform this action"
  );
}
