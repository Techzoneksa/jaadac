/**
 * JAAD CLOUD — Supabase browser client (Phase 1.6, lazy + safe).
 *
 * Returns `null` when env vars are missing instead of throwing, so demo mode
 * keeps working even without a backend configured.
 */
import { readSupabaseEnv } from "./env";

type AnySupabaseClient = unknown;
let _client: AnySupabaseClient | null = null;

export async function getSupabaseClient(): Promise<AnySupabaseClient | null> {
  if (_client) return _client;
  const env = readSupabaseEnv();
  if (!env.ok) return null;
  try {
    // Dynamic import via variable path so the type system does not require
    // @supabase/supabase-js to be installed in Phase 1.6 (demo-only mode).
    const pkg = "@supabase/supabase-js";
    const mod: any = await import(/* @vite-ignore */ pkg).catch(() => null);
    if (!mod?.createClient) return null;
    _client = mod.createClient(env.url, env.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
    return _client;
  } catch {
    return null;
  }
}

export function isSupabaseConfigured(): boolean {
  return readSupabaseEnv().ok;
}
