# JAAD CLOUD — Phase 2.1.1 Final Report

**Phase:** Chart Account Purpose Migration Finalization
**Status:** Ready ✅

## Runnable migration created
- `supabase/migrations/20260611120007_chart_account_purposes_readiness.sql`
- Promoted verbatim from `supabase/planned-migrations/007_chart_account_purposes.sql`
  (header re-stamped for Phase 2.1.1; body unchanged so the SQL contract stays
  identical to the reviewed planned migration).

### Contents verified
- `chart_account_purposes` table with `tenant_id`, `account_id`, `purpose`,
  `unique (tenant_id, purpose)`, and supporting indexes.
- RLS enabled with tenant-scoped read policy and owner/accountant write
  policies (via `has_role`).
- `_jaad_get_account` rewritten as mapping-first with canonical fallback and
  `missing_account:<purpose>` controlled error.
- Default purpose seeding helper `_jaad_seed_default_purpose_mappings` and
  bootstrap integration retained.
- Readiness RPCs present: `validate_tenant_account_setup`,
  `validate_numbering_setup`, `list_write_rpc_readiness`.
- No destructive `DROP` statements; idempotent (`CREATE … IF NOT EXISTS`,
  `CREATE OR REPLACE`).

## Planned migration retained
- `supabase/planned-migrations/007_chart_account_purposes.sql` kept as
  documentation; header marked **DOCUMENTATION ONLY (superseded by Phase
  2.1.1)** with a pointer to the runnable file.

## Migration order
1. `20260611120001_init_schema.sql`
2. `20260611120002_triggers_safety.sql`
3. `20260611120003_rls_policies.sql`
4. `20260611120004_tenant_bootstrap.sql`
5. `20260611120005_write_rpc_functions.sql`
6. `20260611120006_write_rpc_hardening.sql`
7. **`20260611120007_chart_account_purposes_readiness.sql`** ← new

Migration 007 depends only on objects created in 001 (`tenants`,
`chart_accounts`, `app_role`), 003 (`has_role`), 004 (`bootstrap_tenant_for_user`),
and 005/006 (`_jaad_*` helpers + write RPCs it amends).

## Dry run detection updates
- `src/lib/supabase/dry-run.ts` already probes `chart_account_purposes` and
  the three readiness RPCs (added in Phase 2.1) — once migration 007 is
  applied the probes flip from `fail`/`warn` to `pass` automatically. No
  code change required.

## System Data Mode updates
- Runnable migration count: **4 → 7**.
- Planned migration count label clarified as documentation copy: **7**.
- Backend Write Readiness row updated:
  `Account purpose mapping migration → Yes (20260611120007)` (previously
  "Yes (planned 007)").

## Docs updated
- `docs/supabase-setup.md` — Phase 2.1.1 note added; planned vs runnable list
  refreshed.
- `docs/backend-readiness-checks.md` — fix table entry for migration 007 now
  points at runnable file.
- `docs/backend-write-rpc-plan.md` — mapping migration marked runnable.

## Demo regression
- App loads without Supabase env; `DATA_MODE = demo`,
  `BACKEND_WRITES_ENABLED = false`.
- Owner mock auto-login, dashboard, quotation → invoice → issue → receipt,
  audit log, data integrity, system data mode, dry run (reports
  `skipped_not_configured`), and demo reset all behave as in Phase 2.1.

## Build
- Build clean (no schema or TS regressions; only data/docs changes plus two
  string updates in `/system-data-mode`).

## Known limitations
- Migrations are still not auto-applied inside this sandbox — they must be
  run via `supabase db reset` on a configured Supabase project before the
  dry run can flip to `ready`.
- UI writes remain intentionally disabled (`BACKEND_WRITES_ENABLED = false`).

## Final status
**JAAD CLOUD Phase 2.1.1 Chart Account Purpose Migration Finalization is Ready.**
