# JAAD CLOUD — Phase 1.6.1 Final Report

**Phase:** Supabase Migration Application Readiness
**Default mode:** Demo (LocalStorage). Backend NOT activated.

## Migration files created under `supabase/migrations/`
- `20260611120001_init_schema.sql`
- `20260611120002_triggers_safety.sql`
- `20260611120003_rls_policies.sql`

Copied verbatim from `supabase/planned-migrations/`. Runnable via Supabase
CLI (`supabase db reset` / `supabase migration up`).

## Planned-migrations retained
Yes — kept under `supabase/planned-migrations/` as human-readable
documentation. Runnable source of truth is now `supabase/migrations/`.

## Migration order
1. `init_schema` — `pgcrypto` extension, enums, tables, indexes, FKs, check
   constraints, GRANTs, plus the three helper functions (`current_tenant_id`,
   `is_tenant_member`, `has_role`) so policies in step 3 can reference them.
2. `triggers_safety` — `touch_updated_at`, `guard_posted_journal[_lines]`,
   `assert_balanced_before_post`, `guard_issued_invoice[_lines]`.
3. `rls_policies` — `enable row level security` + policies on all 22
   tenant-scoped tables + profiles.

No policy references a function or table before it exists.

## Table count verification
**23 tables** (consistent with the 24 planned in Phase 1.5):

tenants, profiles, user_tenants, user_roles, customers, suppliers, items,
quotations, quotation_lines, invoices, invoice_lines, receipts, payments,
chart_accounts, journal_entries, journal_entry_lines, tasks,
settings_company, settings_tax, settings_numbering, audit_logs,
attachments, migration_snapshots.

The "missing" 24th in the 1.5 plan was the reserved `role_permissions`
reference table, which the plan itself marked as "no table needed unless
customizable". Roles + permissions are enforced via the `app_role` enum +
`user_roles` + `has_role()` function — no extra table required. No real
business table is missing.

## Idempotency safety
- `create extension if not exists "pgcrypto"`.
- Enums wrapped in `do $$ … exception when duplicate_object then null; end`.
- All helpers via `create or replace function`.
- `create unique index journal_entries_source_idem …` (named).
- No destructive `drop` statements.

## Supabase package status
`@supabase/supabase-js@2.108.1` added to `package.json`. Demo mode still
runs without env vars: `getSupabaseClient()` returns `null` when env is
missing; `FutureBackendDataAdapter` reports `Backend not configured`.

## Local validation
Documented commands (require Supabase CLI, not available in this sandbox):
- `supabase start`
- `supabase migration list`
- `supabase db reset`
- `npm run build`

Run via the Supabase CLI on a developer machine. The migrations are ready
but were not executed inside this environment.

## /system-data-mode updates
Supabase panel now shows:
- Supabase URL configured: yes/no
- Anon key configured: yes/no
- @supabase/supabase-js installed: Yes
- Migration files detected: Yes
- Migration count: 3
- Planned migrations count: 3
- Backend adapter status / DATA_MODE / Active adapter / Backend active

**Check Backend Configuration** button remains non-switching.

## /demo-checklist updates
New "Phase 1.6.1" group with 8 items, all marked Ready.

## Demo regression results
- App loads with no Supabase env ✅
- DATA_MODE remains `demo` ✅
- Owner auto-login ✅
- Dashboard ✅
- Quotation → Invoice → Issue → Receipt ✅
- Audit log ✅
- Data integrity ✅
- Migration snapshot export ✅
- Demo reset ✅

## Build result
Clean — no TypeScript or build errors after edits.

## Known limitations
- Supabase CLI is not installed in this sandbox, so migrations were not
  executed locally; they are ready for `supabase db reset` on a dev machine.
- `auth.users` still not provisioned by seed (intentional).
- Backend mode still inert — adapter throws `adapter_unavailable` for all
  data operations.

## Final status
**JAAD CLOUD Phase 1.6.1 Supabase Migration Application Readiness is Ready ✅**
