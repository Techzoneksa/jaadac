/**
 * JAAD CLOUD — Supabase session + active-tenant helpers (Phase 1.7 / 2.1.2B).
 *
 * Thin helpers around session/claims. Inactive while DATA_MODE === "demo"
 * for the main UI. Phase 2.1.2B adds a safe `selected_tenant` fallback when
 * the JWT does NOT yet carry an `active_tenant_id` custom claim — we read
 * the first row from `public.user_tenants` for the authenticated user.
 * This is preview-only and does NOT bypass RLS (the query still runs as
 * the signed-in user with their bearer token).
 */
import { getSupabaseClient, isSupabaseConfigured } from "./client";
import { getCurrentSession, getCurrentUser } from "./auth";

export type ActiveTenantClaim = string | null;
export type TenantStrategy = "jwt_claim" | "selected_fallback" | "none";

/** Returns the active_tenant_id from JWT custom claims, if present. */
export async function getActiveTenantId(): Promise<ActiveTenantClaim> {
  if (!isSupabaseConfigured()) return null;
  const r = await getCurrentSession();
  if (!r.ok || !r.data) return null;
  const session: any = r.data;
  const meta = session?.user?.app_metadata ?? {};
  const userMeta = session?.user?.user_metadata ?? {};
  return meta.active_tenant_id ?? userMeta.active_tenant_id ?? null;
}

export async function getCurrentUserId(): Promise<string | null> {
  const r = await getCurrentUser();
  if (!r.ok || !r.data) return null;
  return (r.data as any).id ?? null;
}

/**
 * Fallback resolver: when no JWT claim is present, pick the first
 * `user_tenants` row for the current user. Returns null if the user has
 * no memberships yet (e.g. before tenant bootstrap).
 */
export async function getSelectedTenantWithFallback(): Promise<{
  tenantId: string | null;
  strategy: TenantStrategy;
}> {
  if (!isSupabaseConfigured()) return { tenantId: null, strategy: "none" };
  const jwt = await getActiveTenantId();
  if (jwt) return { tenantId: jwt, strategy: "jwt_claim" };
  const userId = await getCurrentUserId();
  if (!userId) return { tenantId: null, strategy: "none" };
  const client: any = await getSupabaseClient();
  if (!client) return { tenantId: null, strategy: "none" };
  try {
    const { data, error } = await client
      .from("user_tenants")
      .select("tenant_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    if (error || !data?.tenant_id) return { tenantId: null, strategy: "none" };
    return { tenantId: data.tenant_id, strategy: "selected_fallback" };
  } catch {
    return { tenantId: null, strategy: "none" };
  }
}

export interface SessionSnapshot {
  configured: boolean;
  hasSession: boolean;
  userId: string | null;
  /** JWT-claim tenant id (null if no claim or no session). */
  activeTenantId: string | null;
  /** Resolved tenant id (jwt claim OR fallback to first user_tenants row). */
  selectedTenantId: string | null;
  tenantStrategy: TenantStrategy;
}

export async function getSessionSnapshot(): Promise<SessionSnapshot> {
  if (!isSupabaseConfigured()) {
    return {
      configured: false, hasSession: false, userId: null,
      activeTenantId: null, selectedTenantId: null, tenantStrategy: "none",
    };
  }
  const client = await getSupabaseClient();
  if (!client) {
    return {
      configured: true, hasSession: false, userId: null,
      activeTenantId: null, selectedTenantId: null, tenantStrategy: "none",
    };
  }
  const userId = await getCurrentUserId();
  const jwtTenant = await getActiveTenantId();
  let selected = jwtTenant;
  let strategy: TenantStrategy = jwtTenant ? "jwt_claim" : "none";
  if (!selected && userId) {
    const fb = await getSelectedTenantWithFallback();
    selected = fb.tenantId;
    strategy = fb.strategy;
  }
  return {
    configured: true,
    hasSession: !!userId,
    userId,
    activeTenantId: jwtTenant,
    selectedTenantId: selected,
    tenantStrategy: strategy,
  };
}

/**
 * Subscribes to Supabase auth state changes. No-op when not configured.
 * Returns an unsubscribe function.
 */
export async function onAuthChange(cb: (event: string, session: any) => void): Promise<() => void> {
  const client: any = await getSupabaseClient();
  if (!client) return () => {};
  const { data } = client.auth.onAuthStateChange(cb);
  return () => data?.subscription?.unsubscribe?.();
}
