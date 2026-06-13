# Live Supabase Dry Run (Phase 2.1.2)

Read-only verification of the real Supabase backend. Never executes writes
and never enables `BACKEND_WRITES_ENABLED`. The app stays in demo mode.

## Required environment variables

| Variable | Scope | Notes |
| -------- | ----- | ----- |
| `VITE_SUPABASE_URL` | Client | Project URL (public). |
| `VITE_SUPABASE_ANON_KEY` | Client | Publishable anon key. |

Service-role keys are **never** read on the client. Values are masked in
logs (`abcd…wxyz`).

If either variable is missing the live dry run is marked **Skipped — Needs
Env** and the app continues normally on `DATA_MODE=demo`.

## Migration source of truth

`supabase/migrations/` — 7 runnable files, applied in order:

1. `20260611120001_init_schema.sql`
2. `20260611120002_triggers_safety.sql`
3. `20260611120003_rls_policies.sql`
4. `20260611120004_tenant_bootstrap.sql`
5. `20260611120005_write_rpc_functions.sql`
6. `20260611120006_write_rpc_hardening.sql`
7. `20260611120007_chart_account_purposes_readiness.sql`

`supabase/planned-migrations/` is documentation only.

## Checks performed (read-only)

- Env presence (masked)
- Supabase client availability
- `auth.getSession()` exists
- Active tenant claim present
- Tenant membership row exists
- 24 `schema.table` HEAD probes (no rows fetched)
- 9 `rpc.*` existence probes (detect `PGRST202`)
- `validate_tenant_account_setup`
- `validate_numbering_setup`
- `list_write_rpc_readiness`

No `INSERT` / `UPDATE` / `DELETE`. No write RPC execution.

## Status interpretation

| Overall | Meaning | Action |
| ------- | ------- | ------ |
| `ready` | All probes passed | OK to proceed to read activation phase |
| `skipped_not_configured` | Env missing | Configure `VITE_SUPABASE_*` |
| `needs_auth` | No session | Sign in to a Supabase user |
| `needs_tenant` | No tenant claim | Bootstrap tenant membership |
| `needs_migration` | Table/RPC missing | Apply pending migrations |
| `rls_issue` | Permission denied with valid session | Review RLS policies |

## Applying migrations later (out of scope for 2.1.2)

```
supabase db push           # apply pending migrations
supabase migration list    # read-only verification
```

Never run `supabase db reset` against a production project.

## Why backend mode stays disabled

Phase 2.1.2 only **observes**. Flipping `DATA_MODE` to `backend` or
`BACKEND_WRITES_ENABLED` to `true` is deferred to a later phase after the
dry run reports `ready` against a real environment with applied
migrations and seeded tenants.

---

## Phase 2.1.2B Addendum — Managed Auth & First Tenant Bootstrap

After applying the 7 migrations (Phase 2.1.2A) the dry run reports
`Needs Auth/Tenant Setup`. Phase 2.1.2B closes that gap via the
**Backend Auth Sandbox** on `/system-data-mode` (Owner only):

1. Owner signs into the live backend (email/password). JWT is created
   but never displayed.
2. `bootstrap_tenant_for_user` is invoked once. It creates tenant,
   profile, owner role, settings, chart of accounts, and account purpose
   mappings atomically.
3. Active tenant resolution:
   - If JWT carries `active_tenant_id` → strategy `jwt_claim`.
   - Otherwise the client reads the first row from `user_tenants` for the
     signed-in user → strategy `selected_fallback` (RLS-respecting,
     preview-only).
4. The read-only dry run is re-run and reports green for connection,
   auth session, tenant membership, schema/RLS visibility, RPC
   existence, account purpose readiness, numbering readiness, and write
   RPC readiness — while `BACKEND_WRITES_ENABLED` stays `false`.

Reference: `docs/auth-tenant-bootstrap-runbook.md`,
`docs/phase-2.1.2B-final-report.md`.


---

## Phase 2.1.2C live dry run expectations

After the operator completes the first sign-in + tenant bootstrap, the live read-only dry run should report:

- Supabase connection: PASS
- Auth session: PASS
- Active tenant: PASS (`jwt_claim` if claim present, else `selected_fallback` from `user_tenants`)
- Tenant membership: PASS (RLS respected, not bypassed)
- Schema/table visibility: PASS
- RLS read access: PASS
- Required RPCs present: PASS
- Account purpose readiness: PASS
- Numbering readiness: PASS (sequences created lazily on first real use is safe)
- Write RPC readiness: PASS while execution stays disabled

No INSERT/UPDATE/DELETE except the one-time `bootstrap_tenant_for_user` call. Accounting write RPCs are never invoked in this phase.

## Phase 2.1.2D appendix

Security re-scan run. Connector scanners clean. Supabase linter reports 23 warnings, all of class `0029_authenticated_security_definer_function_executable`, recorded as accepted-by-design (see `docs/security-review.md` and `docs/phase-2.1.2D-final-report.md`). DATA_MODE remains `demo`; BACKEND_WRITES_ENABLED remains `false`.

---

## Phase 2.1.2C Retry note (auth.users = 0 at re-verification)

No real backend user is signed in yet. Owner must complete sign-in and Bootstrap First Tenant via `/system-data-mode` → BackendAuthSandbox before this phase can be marked Ready. DATA_MODE remains `demo`; BACKEND_WRITES_ENABLED remains `false`; no writes executed; no credentials fabricated.
