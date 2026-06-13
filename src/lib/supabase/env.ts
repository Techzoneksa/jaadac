/**
 * JAAD CLOUD — Supabase env validation (Phase 1.6).
 *
 * Demo mode must NOT crash when env vars are missing. This module returns
 * `{ ok: false }` and the UI shows a friendly bilingual "Backend not
 * configured" state — never an exception.
 */
export interface SupabaseEnvOk {
  ok: true;
  url: string;
  anonKey: string;
}
export interface SupabaseEnvMissing {
  ok: false;
  missing: string[];
  message: { ar: string; en: string };
}
export type SupabaseEnv = SupabaseEnvOk | SupabaseEnvMissing;

export function readSupabaseEnv(): SupabaseEnv {
  const url =
    (import.meta as any).env?.VITE_SUPABASE_URL ||
    (import.meta as any).env?.SUPABASE_URL ||
    "";
  const anonKey =
    (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
    (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
    "";

  const missing: string[] = [];
  if (!url) missing.push("VITE_SUPABASE_URL");
  if (!anonKey) missing.push("VITE_SUPABASE_ANON_KEY");

  if (missing.length) {
    return {
      ok: false,
      missing,
      message: {
        ar: "الباك اند غير مُهيّأ. يعمل التطبيق في الوضع التجريبي.",
        en: "Backend not configured. The app is running in demo mode.",
      },
    };
  }
  return { ok: true, url, anonKey };
}

export const supabaseEnvStatus = () => {
  const e = readSupabaseEnv();
  return {
    urlConfigured: e.ok || !e.missing.includes("VITE_SUPABASE_URL"),
    anonKeyConfigured: e.ok || !e.missing.includes("VITE_SUPABASE_ANON_KEY"),
    configured: e.ok,
  };
};
