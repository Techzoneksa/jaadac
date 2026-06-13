# JAAD CLOUD — Supabase Auth Plan (Phase 1.7)

## Goal
Prepare Supabase Auth integration without switching the app away from demo mode.

## Wrapper module: `src/lib/supabase/auth.ts`
Safe wrappers around Supabase Auth that always return a typed
`AuthResult<T>` instead of throwing:

- `signUpWithEmail(email, password)`
- `signInWithEmail(email, password)`
- `signOut()`
- `getCurrentSession()`
- `getCurrentUser()`
- `refreshSession()`
- `authConfigStatus()` — bilingual readiness probe

If `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is missing, every wrapper
returns `{ ok: false, code: "not_configured", error: { ar, en } }`. Demo mode
never touches these wrappers.

## Session helpers: `src/lib/supabase/session.ts`
- `getCurrentUserId()`
- `getActiveTenantId()` — reads `app_metadata.active_tenant_id` from JWT
- `getSessionSnapshot()` — `{ configured, hasSession, userId, activeTenantId }`
- `onAuthChange(cb)` — Supabase auth subscription (no-op when not configured)

## Demo-mode safety
- The mock `AuthProvider` continues to drive `useAuth()`.
- Wrappers are not imported by any route/component today.
- Login page shows a friendly bilingual "Backend not configured" hint when a
  user explicitly tries backend auth while env is missing.

## Known limitations
- Real signup is not yet wired to the UI.
- Email confirmation, magic links, OAuth, and password reset are not yet
  implemented (planned in Phase 1.8).

## Phase 1.7.1 update
- The bootstrap RPC is now a runnable migration: `supabase/migrations/20260611120004_tenant_bootstrap.sql`.
- All helper functions are `SECURITY DEFINER` with `SET search_path = public, pg_temp`.
- `bootstrap_tenant_for_user` validates `auth.uid() = p_user_id` to prevent impersonation, and short-circuits when the caller already owns a tenant with the same `name_en` (returns `reused: true`).
