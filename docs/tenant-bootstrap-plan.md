# JAAD CLOUD — Tenant Bootstrap Plan (Phase 1.7)

## Goal
After a real Supabase signup, atomically provision a brand-new tenant for
the new user with sane defaults.

## Components

### Service: `src/lib/supabase/tenant-bootstrap.ts`
- `bootstrapReadiness()` — reports demo-mode, backend-config, RPC name, and
  whether the bootstrap can run now.
- `bootstrapTenantForCurrentUser(input)` — refuses to run while
  `DATA_MODE === "demo"`. Otherwise calls the RPC.

### RPC: `bootstrap_tenant_for_user(p_user_id, p_name_ar, p_name_en, p_currency, p_vat_rate, p_locale)`
Defined as a planned migration in
`supabase/planned-migrations/004_tenant_bootstrap.sql`. When backend mode is
activated, it will be applied to the live project.

Atomic steps performed by the RPC:
1. `tenants` row
2. `profiles` row (idempotent)
3. `user_tenants` membership
4. `user_roles` — owner
5. `tenant_settings` — VAT 15%, SAR, locale
6. `numbering_settings` — INV-/QUO-/REC-/PAY-
7. Default chart of accounts (via `seed_default_chart_of_accounts`)
8. Initial `audit_logs` entry: `tenant.bootstrap`

Returns `{ tenant_id, ok: true }`.

## active_tenant_id strategy
- Stored on `auth.users.app_metadata.active_tenant_id` (server-set only).
- `current_tenant_id()` SQL helper reads it from `auth.jwt()`.
- Switching organizations triggers a privileged endpoint that updates
  `app_metadata`, then the client calls `refreshSession()` to get a new JWT.
- If the claim is missing, `current_tenant_id()` returns NULL and RLS denies
  access — UI forces a tenant picker.

## Demo-mode safety
- Bootstrap never runs in demo mode.
- The mock owner / demo tenant remain untouched.
- The system-data-mode page exposes a read-only readiness probe.

## Known limitations
- Privileged "set active tenant" endpoint is not implemented yet (Phase 1.8).
- Per-tenant locale switching at signup is set once, not editable from the
  bootstrap step.

## Phase 1.7.1 — runnable migration

- File: `supabase/migrations/20260611120004_tenant_bootstrap.sql`
- Mirrors `supabase/planned-migrations/004_tenant_bootstrap.sql` (kept as documentation).

### Functions
| Function | Purpose |
| --- | --- |
| `bootstrap_tenant_for_user(p_user_id, p_name_ar, p_name_en, p_currency, p_vat_rate, p_locale)` | Atomic tenant bootstrap. Returns `{ tenant_id, ok, reused }`. |
| `create_default_settings(tenant_id, vat_rate, currency, locale)` | Inserts tenant_settings + numbering_settings. |
| `create_default_chart_accounts(tenant_id)` | Alias of `seed_default_chart_of_accounts`. |
| `ensure_profile_for_auth_user(user_id, full_name)` | Idempotent profile row insert. |

### Security assumptions
- `SECURITY DEFINER` with `SET search_path = public, pg_temp` on every function.
- `EXECUTE` granted to `authenticated` only; revoked from `public`.
- Caller identity verified via `auth.uid() = p_user_id`.
- Duplicate bootstrap returns the existing tenant instead of inserting again.

### How it will be used later
1. User completes Supabase signup → confirmed session.
2. Client calls `bootstrapTenantForCurrentUser({ tenant_name_ar, tenant_name_en, ... })`.
3. Service routes through Supabase `rpc("bootstrap_tenant_for_user", ...)`.
4. Edge function / admin job sets `app_metadata.active_tenant_id` and the client refreshes its session.

### Why it does not run in demo mode
`bootstrapTenantForCurrentUser` checks `DATA_MODE === "demo"` first and returns `{ reason: "demo_mode" }`. The runnable migration is harmless in demo mode because no UI calls the RPC and Supabase is not connected.
