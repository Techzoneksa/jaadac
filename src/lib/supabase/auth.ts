/**
 * JAAD CLOUD — Supabase Auth wrappers (Phase 1.7).
 *
 * Safe, demo-friendly wrappers around Supabase Auth. If env is missing or the
 * client cannot load, every function returns a bilingual "Backend not
 * configured" error instead of throwing.
 *
 * NOTE: These wrappers are NOT wired into the app yet — DATA_MODE remains
 * "demo" and the mock AuthProvider continues to drive the UI.
 */
import { getSupabaseClient, isSupabaseConfigured } from "./client";

export type BilingualMessage = { ar: string; en: string };
export type AuthResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: BilingualMessage; code: "not_configured" | "client_unavailable" | "auth_error" };

const NOT_CONFIGURED: BilingualMessage = {
  ar: "الباك اند غير مُهيّأ — لا يمكن استخدام مصادقة Supabase الآن.",
  en: "Backend not configured — Supabase auth is unavailable.",
};

const CLIENT_UNAVAILABLE: BilingualMessage = {
  ar: "تعذّر تحميل عميل Supabase.",
  en: "Supabase client could not be loaded.",
};

async function withClient<T>(fn: (client: any) => Promise<T>): Promise<AuthResult<T>> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONFIGURED, code: "not_configured" };
  const client = await getSupabaseClient();
  if (!client) return { ok: false, error: CLIENT_UNAVAILABLE, code: "client_unavailable" };
  try {
    const data = await fn(client);
    return { ok: true, data };
  } catch (e: any) {
    return {
      ok: false,
      code: "auth_error",
      error: {
        ar: `فشل عملية المصادقة: ${e?.message ?? "خطأ غير معروف"}`,
        en: `Auth operation failed: ${e?.message ?? "Unknown error"}`,
      },
    };
  }
}

export async function signUpWithEmail(email: string, password: string) {
  return withClient(async (c: any) => {
    const { data, error } = await c.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  });
}

export async function signInWithEmail(email: string, password: string) {
  return withClient(async (c: any) => {
    const { data, error } = await c.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  });
}

export async function signOut() {
  return withClient(async (c: any) => {
    const { error } = await c.auth.signOut();
    if (error) throw error;
    return true;
  });
}

export async function getCurrentSession() {
  return withClient(async (c: any) => {
    const { data, error } = await c.auth.getSession();
    if (error) throw error;
    return data.session ?? null;
  });
}

export async function getCurrentUser() {
  return withClient(async (c: any) => {
    const { data, error } = await c.auth.getUser();
    if (error) throw error;
    return data.user ?? null;
  });
}

export async function refreshSession() {
  return withClient(async (c: any) => {
    const { data, error } = await c.auth.refreshSession();
    if (error) throw error;
    return data.session ?? null;
  });
}

export function authConfigStatus() {
  return {
    configured: isSupabaseConfigured(),
    message: isSupabaseConfigured()
      ? { ar: "إعدادات مصادقة Supabase متوفرة.", en: "Supabase auth configuration available." }
      : NOT_CONFIGURED,
  };
}
