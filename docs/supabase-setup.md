# JAAD CLOUD — Supabase Setup (Phase 1.6 → 1.6.1)

This document describes the planned Supabase backend for JAAD CLOUD. The app
still runs in demo mode by default; migrations are ready but not executed
inside this sandbox.

## Files

- `supabase/config.toml` — local Supabase CLI config.
- `supabase/migrations/` — **runnable source of truth**:
  - `20260611120001_init_schema.sql`
  - `20260611120002_triggers_safety.sql`
  - `20260611120003_rls_policies.sql`
- `supabase/planned-migrations/` — same SQL kept as documentation.
- `supabase/seed.sql` — JAAD Demo Company tenant, default chart of accounts,
  settings, sample customers / suppliers / items.
- `.env.example` — placeholders only.
- `src/lib/supabase/env.ts`, `client.ts`, `types.ts` — safe client foundation.
- `src/lib/adapters/FutureBackendDataAdapter.ts` — config check + health.

## Tables (23)

tenants, profiles, user_tenants, user_roles, customers, suppliers, items,
quotations, quotation_lines, invoices, invoice_lines, receipts, payments,
chart_accounts, journal_entries, journal_entry_lines, tasks,
settings_company, settings_tax, settings_numbering, audit_logs, attachments,
migration_snapshots.

The 24th item from the Phase 1.5 plan was a reserved `role_permissions`
reference table that the plan itself marked optional; roles are enforced via
the `app_role` enum + `user_roles` + `has_role()` function.

## Migration order (each file is self-contained)

1. **init_schema** — `pgcrypto`, enums, all tables, indexes, FKs, check
   constraints, **helper functions** (`current_tenant_id`, `is_tenant_member`,
   `has_role`), GRANTs.
2. **triggers_safety** — posted-journal lock, issued-invoice lock,
   balanced-entry assertion, `updated_at` touch.
3. **rls_policies** — enable RLS + role-based policies on all tenant-scoped
   tables.

## Idempotency safety

- `create extension if not exists`.
- Enums in `do $$ … exception when duplicate_object`.
- `create or replace function` for all helpers and trigger functions.
- Named unique indexes (e.g. `journal_entries_source_idem`).
- No `drop` statements anywhere.

## Helper functions

- `public.current_tenant_id()` — reads `active_tenant_id` from JWT claims.
- `public.is_tenant_member(_tenant uuid)` — `security definer` membership.
- `public.has_role(_user, _tenant, _role)` — `security definer` role check.

## RLS pattern

Enabled on every tenant-scoped table. Pattern:
- `SELECT` to any member of the tenant.
- `WRITE` to owner + accountant (+ sales for customer-facing modules).
- Settings tables: owner-only.
- `audit_logs`: append-only by members; readable by owner/accountant.
- `migration_snapshots`: owner-only.

## Env variables

| Variable | Where | Required for |
|---|---|---|
| `VITE_SUPABASE_URL` | client | backend mode |
| `VITE_SUPABASE_ANON_KEY` | client | backend mode |
| `SUPABASE_SERVICE_ROLE_KEY` | server-only | admin/server fns |
| `SUPABASE_JWT_SECRET` | server-only | claim verification |

Demo mode does not need any of them.

## Local run steps

> Supabase CLI is required on the developer machine. The Lovable sandbox
> does not ship the CLI — migrations are ready but not executed here.

```bash
# 1. Start local stack
supabase start

# 2. List discovered migrations
supabase migration list

# 3. Apply migrations + seed (DESTRUCTIVE: resets local DB)
supabase db reset

# 4. Build the frontend
npm run build
```

## What is intentionally NOT connected yet

- `DATA_MODE` remains `demo`; `LocalStorageDataAdapter` stays active.
- `FutureBackendDataAdapter` only reports status; all data ops throw
  `adapter_unavailable` with a bilingual message.
- No `auth.users` migration; no real user provisioning.
- No realtime, no edge functions, no storage uploads.

## Phase 1.7.1 — Tenant bootstrap migration
- New file: `supabase/migrations/20260611120004_tenant_bootstrap.sql`.
- Applies four functions (`bootstrap_tenant_for_user`, `create_default_settings`, `create_default_chart_accounts`, `ensure_profile_for_auth_user`) plus an alias for the chart-of-accounts seeder.
- Order: runs after `003_rls_policies.sql`; depends on schema (tenants, profiles, user_tenants, user_roles, tenant_settings, numbering_settings, accounts, audit_logs) and on the `app_role` enum.
- Re-run safe (`CREATE OR REPLACE`).

## Phase 1.8 — Adapter contract wiring
- `src/lib/supabase/backend-helpers.ts` (new) — guard helpers, error mapper,
  result normalizer, list query composer, and five read-only smoke checks.
- `FutureBackendDataAdapter` (v0.2.0-contract-ready) exposes documented
  method groups per domain with explicit Supabase table/RPC mapping in
  JSDoc. All methods remain INERT in demo mode.
- `/system-data-mode` gains a **Backend Adapter Readiness** panel with a
  "Run Read-Only Backend Checks" button. The button never switches modes
  and never writes data.


## Phase 1.9 note

The `FutureBackendDataAdapter` is now read-only-implemented but still NOT wired into the live UI; `DATA_MODE` remains `demo`. To exercise reads against your Supabase project, open `/system-data-mode` as Owner and use the "Backend Read-Only Preview" section. Writes remain disabled until a later phase.

## Phase 2.0 — Write RPC migration

Runnable migration: `supabase/migrations/20260611120005_write_rpc_functions.sql`.
Adds `quotation_convert_to_invoice`, `invoice_issue`,
`receipt_create_with_auto_apply`, `payment_create_with_posting`, and
`journal_post_manual`, plus internal `_jaad_*` helpers. All `SECURITY DEFINER`
with `search_path = public, pg_temp`. `EXECUTE` granted to `authenticated`
only. Writes are NOT enabled from the app
(`BACKEND_WRITES_ENABLED = false`).

## Phase 2.0.1 — Write RPC hardening migration

Runnable migration: `supabase/migrations/20260611120006_write_rpc_hardening.sql`.
Adds `document_number_sequences`, `_jaad_get_account`, the readiness helpers
`list_write_rpc_readiness` / `validate_numbering_setup` /
`validate_tenant_account_setup`, an `_jaad_err` envelope builder, and re-issues
the five write RPCs with the new contract. Writes remain disabled
(`BACKEND_WRITES_ENABLED = false`).

## Phase 2.0.2 — Chart account purpose mapping
- New table `chart_account_purposes (tenant_id, purpose, account_id)` decouples
  RPCs from hardcoded chart codes. RLS: tenant members may read; owners and
  accountants may write.
- `_jaad_get_account` is now mapping-first with a controlled canonical-code
  fallback. Missing accounts raise `missing_account:<purpose>` (P0002).
- `bootstrap_tenant_for_user` and the migration both seed default mappings
  via `_jaad_seed_default_purpose_mappings(tenant)`.
- Readiness RPCs (`validate_tenant_account_setup`, `validate_numbering_setup`,
  `list_write_rpc_readiness`) return a structured JSON envelope and are
  called from the Backend Write Readiness panel.

## Phase 2.1 — Backend readiness verification & dry run
- New orchestrator `src/lib/supabase/dry-run.ts` and adapter method
  `FutureBackendDataAdapter.runBackendDryRun()` aggregate env, connection,
  session, tenant, RLS, schema, RPC, and write-readiness checks. All
  read-only.
- New **Backend Dry Run Report** panel on `/system-data-mode` shows overall
  status (Ready / Needs configuration / Needs migration / RLS issue /
  Skipped) and a per-check table with bilingual fix suggestions.
- See `docs/backend-readiness-checks.md` for the full check matrix.
- Writes remain disabled (`BACKEND_WRITES_ENABLED = false`).

## Phase 2.1.1 — Chart account purpose migration finalized
- Promoted planned migration 007 to runnable:
  `supabase/migrations/20260611120007_chart_account_purposes_readiness.sql`.
- Planned copy (`supabase/planned-migrations/007_chart_account_purposes.sql`)
  retained as documentation only.
- Runnable migration count is now **7**. The dry run probes for
  `chart_account_purposes` and the readiness RPCs flip to `pass` once the
  migration is applied (`supabase db reset`).
- Writes remain disabled (`BACKEND_WRITES_ENABLED = false`).
