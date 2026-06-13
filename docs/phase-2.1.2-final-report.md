# JAAD CLOUD — Phase 2.1.2A Final Report

**Apply Supabase Migrations Safely & Re-run Live Dry Run**

## Pre-apply safety result

- Lovable Cloud connected ✅
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`: configured ✅
- Service role key never used from the frontend ✅
- `DATA_MODE = demo`, `BACKEND_WRITES_ENABLED = false` ✅
- 7 runnable migration files present in `supabase/migrations/` ✅
- Database empty before apply (0 tables, 0 functions) ✅

## Migration apply result

All 7 migrations applied as a single safe, ordered migration through the
Lovable Cloud migration tool (no `psql` writes, no destructive resets, no
secrets printed):

1. `20260611120001_init_schema.sql`
2. `20260611120002_triggers_safety.sql`
3. `20260611120003_rls_policies.sql`
4. `20260611120004_tenant_bootstrap.sql`
5. `20260611120005_write_rpc_functions.sql`
6. `20260611120006_write_rpc_hardening.sql`
7. `20260611120007_chart_account_purposes_readiness.sql`

Outcome: **success** — no errors.

## Tables / functions / RPC verification

| Object              | Count / present |
| ------------------- | --------------- |
| `public` tables     | 25              |
| RLS-enabled tables  | 25 / 25         |
| RLS policies        | 48              |
| Triggers            | 13              |
| Functions           | 30              |
| `document_number_sequences` | present |
| `chart_account_purposes`    | present |
| RPC `validate_tenant_account_setup` | present |
| RPC `validate_numbering_setup`      | present |
| RPC `list_write_rpc_readiness`      | present |
| RPC `invoice_issue`, `quotation_convert_to_invoice`, `receipt_create_with_auto_apply`, `payment_create_with_posting`, `journal_post_manual` | all present |

No service-role key was exposed to the frontend.

## Dry run result after migration

| Probe                           | Result        |
| ------------------------------- | ------------- |
| Supabase connection              | pass          |
| Auth session                     | no_session    |
| Active tenant claim              | needs_auth    |
| Tenant membership                | needs_auth    |
| Schema table visibility          | pass (25 tables) |
| RLS read access                  | needs_auth (RLS enforced; no signed-in user) |
| Required RPC existence           | pass (all 9 readiness + write RPCs) |
| Account purpose readiness        | needs_auth (RPC present; needs tenant context) |
| Numbering readiness              | needs_auth (RPC present; needs tenant context) |
| Write RPC readiness              | pass (mapping_first_then_canonical_fallback) |

No insert/update/delete attempted. No write RPC executed.

## Current backend status

- Schema: **ready**
- Triggers & RLS: **ready**
- Read RPCs (`list_write_rpc_readiness`, `validate_*`): **ready**
- Write RPCs: **defined and guarded by `_jaad_require_tenant` / `_jaad_require_role`**, not invoked by the UI
- Auth / first owner / tenant bootstrap: **not yet performed** (no user has signed in, no tenant exists)

## DATA_MODE status

`DATA_MODE = demo` — unchanged.

## BACKEND_WRITES_ENABLED status

`BACKEND_WRITES_ENABLED = false` — unchanged. The
`FutureBackendDataAdapter` remains read-only.

## Demo regression

- App loads on `/`, mock Owner auto-login OK
- `/customers`, `/suppliers`, all main sections load without errors
- Quotation → Invoice → Issue → Receipt (demo): OK
- Audit log, data integrity, system data mode, demo reset: OK
- Backend Dry Run panel now reports the post-migration state

## Build

Clean.

## Known limitations

- **No auth user / tenant yet.** Auth-dependent probes (`auth session`,
  `tenant claim`, `tenant membership`, mapping-aware readiness) cannot
  reach `pass` until a user signs in and `bootstrap_tenant_for_user` is
  invoked. This is the Phase 2.1.2B scope (auth + tenant setup), not
  this phase.
- **Linter warnings (51 total)** were reported after apply, dominated by:
  - `Function Search Path Mutable` on a handful of helper functions
    (`current_tenant_id`, `touch_updated_at`, the trigger guards). They
    do not lack `SET search_path` in the migrations except for these
    helpers; remediation is a non-functional follow-up.
  - `Public Can Execute SECURITY DEFINER Function` on the readiness +
    write RPCs. The write RPCs are still guarded internally by
    `_jaad_require_tenant` / `_jaad_require_role` so they fail closed
    without an authenticated tenant claim. Tightening `EXECUTE` away
    from `public` is a hardening follow-up.
  - Auth-config warnings (OTP expiry, leaked-password protection,
    Postgres patch level) are project-wide Cloud settings, not from
    this migration.
- Demo mode remains the only data path users interact with.

## Final status

**JAAD CLOUD Phase 2.1.2A Migration Apply Needs Auth/Tenant Setup.**

Schema, triggers, RLS, and all RPCs are live and verified read-only.
The next discrete step is Phase 2.1.2B: wire managed auth (Google +
email/password), call `bootstrap_tenant_for_user` for the first
real user, and re-run the dry run to advance to **Ready**.
