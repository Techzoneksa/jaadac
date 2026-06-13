# JAAD CLOUD — Phase 1.6 Final Report

**Phase:** Supabase Backend Foundation
**Product:** JAAD CLOUD / جاد كلاود
**Default mode:** Demo (LocalStorage). Backend NOT activated.

## Supabase files added
- `supabase/config.toml`
- `supabase/migrations/` (managed; empty in 1.6)
- `supabase/planned-migrations/001_init_schema.sql`
- `supabase/planned-migrations/002_triggers_safety.sql`
- `supabase/planned-migrations/003_rls_policies.sql`
- `supabase/seed.sql`
- `.env.example` (placeholders only)

## Tables implemented (23)
tenants, profiles, user_tenants, user_roles, customers, suppliers, items,
quotations, quotation_lines, invoices, invoice_lines, receipts, payments,
chart_accounts, journal_entries, journal_entry_lines, tasks,
settings_company, settings_tax, settings_numbering, audit_logs, attachments,
migration_snapshots.

## Constraints / triggers added
- Unique document numbers per tenant (5 docs).
- `invoices` check: `paid >= 0`, `total >= 0`, `paid <= total`.
- `journal_entry_lines` check: `(debit=0 OR credit=0)` and non-negative.
- Idempotency unique index for journal source.
- Triggers: `guard_posted_journal`, `guard_posted_journal_lines`,
  `assert_balanced_before_post`, `guard_issued_invoice`,
  `guard_issued_invoice_lines`, `touch_updated_at`.

## RLS policies added
Enabled on all 19 tenant-scoped tables + profiles, tenants, user_tenants,
user_roles. Role matrix per `docs/security-permissions-plan.md` (owner,
accountant, sales, viewer). Audit logs append-only; snapshots owner-only.

## Helper functions
`current_tenant_id()`, `is_tenant_member()`, `has_role()` — all with
`security definer` + locked `search_path` (avoid recursive RLS).

## Seed strategy
`supabase/seed.sql` inserts the demo tenant (`JAAD Demo Company` /
`شركة جاد التجريبية`), default settings, default chart of accounts, and
sample customers / suppliers / items. No `auth.users`, no passwords.

## Supabase client foundation
- `src/lib/supabase/env.ts` — bilingual env validation, never throws.
- `src/lib/supabase/client.ts` — lazy dynamic import; returns `null` if not
  configured or if the package is not installed.
- `src/lib/supabase/types.ts` — placeholder `Database` types.

## FutureBackendDataAdapter changes
- `configStatus()` — reports URL/anon key/configured flags + bilingual message.
- `health()` — async; returns `{ ok, configured, message }` without throwing.
- All data ops throw `AppError("adapter_unavailable", …)` with bilingual
  message when backend isn't configured.
- `DATA_MODE` default unchanged → demo. `LocalStorageDataAdapter` remains active.

## System page updates (`/system-data-mode`)
- New "Supabase configuration" panel:
  - Supabase URL configured: yes/no
  - Anon key configured: yes/no
  - Backend adapter status (mode / name / version)
  - Data mode: Demo LocalStorage
  - Active adapter: LocalStorageDataAdapter
  - Backend active: no
- New safe button: **Check Backend Configuration** — runs `health()` and
  toasts the bilingual result. Does NOT switch data mode.

## Demo regression results
With no Supabase env present:
- App loads normally ✅
- Owner auto-login works ✅
- Dashboard renders ✅
- Quotation → Invoice flow works ✅
- Invoice issue creates the journal entry ✅
- Receipt updates invoice + journal ✅
- Audit log captures actions ✅
- `/data-integrity` works ✅
- Migration snapshot export works ✅
- Demo reset works ✅

## Known limitations
- Planned migrations live under `supabase/planned-migrations/` (not
  auto-applied). `supabase/migrations/` is reserved for the platform tool.
- `@supabase/supabase-js` is not installed; `getSupabaseClient()` returns
  `null` until the package and env vars are in place.
- No `auth.users` provisioning, no edge functions, no realtime.
- Demo mode still uses LocalStorage — no real backend writes happen yet.

## Final readiness status
**JAAD CLOUD Phase 1.6 Supabase Backend Foundation is Ready ✅**
