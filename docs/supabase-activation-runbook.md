# Supabase Activation Runbook (Phase 2.1.3)

Safe, step-by-step guide for activating Supabase / Lovable Cloud for
JAAD CLOUD (جاد كلاود). Documentation only — running this runbook does
**not** enable backend writes and does **not** switch the app out of
demo mode. Phase 2.1.2 Retry runs after activation.

---

## Pre-flight invariants (must remain true throughout)

- `DATA_MODE` stays `demo`.
- `BACKEND_WRITES_ENABLED` stays `false`.
- Service role key is **never** placed in frontend code, env, or logs.
- Anon key and JWT values are **masked** in any log or UI surface.
- No destructive SQL (`DROP`, `TRUNCATE`, `supabase db reset`) is run
  against any project that contains real data.

---

## Option A — Lovable Cloud (recommended)

1. In Lovable, open the project and enable **Lovable Cloud**.
2. Wait for the integration to provision a Supabase project. Lovable
   injects these env variables automatically:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - (server-only) `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`
3. Confirm the app still loads on `/` and the mock Owner auto-login
   works. `DATA_MODE` must still display `demo` on `/system-data-mode`.
4. Apply the 7 runnable migrations (see section below). Lovable Cloud
   typically applies any migration files under `supabase/migrations/`
   automatically on enable; verify in the Cloud UI.
5. Run **Phase 2.1.2 Retry** — open `/system-data-mode` → Backend Dry
   Run Report → **Run Dry Run**.
6. Do **not** flip `DATA_MODE` or `BACKEND_WRITES_ENABLED`.

## Option B — Existing Supabase project

1. Create or open the target Supabase project.
2. Copy the project URL and the **anon (publishable) key** only.
   - Project Settings → API → `Project URL`
   - Project Settings → API → `Project API keys` → `anon` `public`
3. Add the env variables to the Lovable project secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. **Never** add the `service_role` key to the frontend. If a future
   server function needs it, store it as `SUPABASE_SERVICE_ROLE_KEY`
   (server-only) — but Phase 2.1.x does not require it.
5. Apply the 7 runnable migrations (see below).
6. Verify migration status:
   ```
   supabase migration list
   ```
7. Run **Phase 2.1.2 Retry** from `/system-data-mode`.

---

## Migration application guide

Apply in this exact order:

| # | File | Purpose |
|---|------|---------|
| 1 | `20260611120001_init_schema.sql` | Core tables (tenants, users, customers, items, quotations, invoices, receipts, payments, accounts, journal, audit_log, etc.) |
| 2 | `20260611120002_triggers_safety.sql` | `updated_at` triggers, defensive constraints |
| 3 | `20260611120003_rls_policies.sql` | Enables RLS + tenant-scoped policies on every public table |
| 4 | `20260611120004_tenant_bootstrap.sql` | `bootstrap_tenant`, `set_active_tenant`, membership helpers |
| 5 | `20260611120005_write_rpc_functions.sql` | Write RPC contracts (not yet activated by UI) |
| 6 | `20260611120006_write_rpc_hardening.sql` | Numbering hardening, account lookup hardening, permission matrix |
| 7 | `20260611120007_chart_account_purposes_readiness.sql` | `chart_account_purposes` mapping table + readiness RPCs (`validate_tenant_account_setup`, `validate_numbering_setup`, `list_write_rpc_readiness`) |

Order matters because each migration depends on objects created earlier:
RLS (3) references tables from init (1); bootstrap (4) seeds rows under
RLS (3); write RPCs (5) call helpers from 1–4; hardening (6) replaces
functions from 5; purposes/readiness (7) builds on accounts from 1 and
helpers from 4–6.

Apply with:

```
supabase db push          # apply pending migrations to the linked project
supabase migration list   # read-only verification
```

**Do NOT run** on a project with real data:
- `supabase db reset`
- `DROP TABLE`, `DROP SCHEMA`
- `TRUNCATE`
- Any migration that begins with destructive DDL — none of the 7 do; if
  a future migration does, gate it behind an explicit manual confirmation.

How to verify migrations applied:
- `supabase migration list` shows all 7 as applied.
- On `/system-data-mode`, run the dry run — the per-check table should
  show `pass` for `chart_account_purposes`, readiness RPCs, and the
  24 schema table probes.

---

## Environment checklist

- [ ] `VITE_SUPABASE_URL` is set
- [ ] `VITE_SUPABASE_ANON_KEY` is set
- [ ] Only the **anon** key is in the frontend (no `service_role`)
- [ ] `DATA_MODE` shows `demo` on `/system-data-mode`
- [ ] `BACKEND_WRITES_ENABLED` shows `false`
- [ ] Supabase client initializes without console errors
- [ ] `/system-data-mode` shows "Live Supabase configured: yes"
- [ ] Dry run starts and reports per-check results
- [ ] No write button or write RPC is reachable from the UI

## Security checklist

- [ ] No real secret is committed to git
- [ ] `service_role` key never appears in frontend code, env, or logs
- [ ] JWT values are never logged
- [ ] Anon key is masked when logged (e.g. `abcd…wxyz`)
- [ ] Backend writes remain disabled until RLS is verified
- [ ] Tenant isolation is verified before any production data switch
- [ ] All write RPCs are `SECURITY DEFINER` with explicit tenant checks
- [ ] No `TO anon` grants on auth-only tables

---

## Troubleshooting guide

| Symptom | Likely cause | Safe fix |
|---------|--------------|----------|
| Dry run reports `backend_not_configured` | `VITE_SUPABASE_*` missing | Add env vars (Option A or B) |
| `Invalid URL` on client init | Wrong `VITE_SUPABASE_URL` | Copy URL exactly from Supabase → Project Settings → API |
| `JWT invalid` / `Invalid API key` | Anon key wrong, or service-role key pasted by mistake | Re-copy the **anon public** key only |
| Dry run reports `needs_migration` for a table | Migrations 1–7 not applied | `supabase db push` |
| Dry run reports `PGRST202` for an RPC | Migration 5/6/7 not applied | Apply remaining migrations |
| `chart_account_purposes` probe fails | Migration 7 not applied | Apply `20260611120007_chart_account_purposes_readiness.sql` |
| Write readiness check fails | Tenant has no account purpose mapping | Run `validate_tenant_account_setup` manually; map missing purposes |
| Dry run reports `needs_auth` | No Supabase session | Sign in to a Supabase user, then re-run |
| Dry run reports `needs_tenant` | No `active_tenant_id` claim | Call `set_active_tenant(<id>)` after `bootstrap_tenant` |
| RLS read denied with valid session | User has no `tenant_members` row | Insert membership row via admin (SQL editor) |
| Dry run reports `rls_issue` for one table only | Missing or too-narrow policy on that table | Review RLS policy; do not widen with `TO anon` blindly |
| App breaks after enabling Cloud | Stale build referencing missing vars | Hard refresh / redeploy preview |

---

## What comes after this runbook

When the environment is configured and migrations applied, run the
already-prepared prompt:

> JAAD CLOUD — Phase 2.1.2 Retry — Live Supabase Dry Run & Migration
> Verification

Only after that returns **Ready** do we plan Phase 2.1.4 (live read
activation behind a feature flag). Backend writes remain disabled
through all of Phase 2.1.x.

---

## Cross-reference — Phase 2.1.2B

Once env is configured (Phase 2.1.3) and the 7 migrations are applied
(Phase 2.1.2A), follow **`docs/auth-tenant-bootstrap-runbook.md`** to
create the first real user, bootstrap the first tenant, and re-run the
dry run. That runbook is the only documented path that performs a write
operation (`bootstrap_tenant_for_user`) before
`BACKEND_WRITES_ENABLED` is flipped on in a later phase.


---

## Phase 2.1.2C — first owner activation

Final manual step on top of the activation runbook:

1. Open `/system-data-mode` as the Owner.
2. In **BackendAuthSandbox**, sign in / sign up the first real backend user (owner-chosen password — never logged).
3. Click **Bootstrap First Tenant** once.
4. Click **Run Dry Run**; all rows should turn green.

`DATA_MODE` remains `demo` and `BACKEND_WRITES_ENABLED` remains `false`. Main UI writes stay disconnected from the backend until a dedicated production flip in Phase 2.2.

## Phase 2.1.2D appendix

Security re-scan run. Connector scanners clean. Supabase linter reports 23 warnings, all of class `0029_authenticated_security_definer_function_executable`, recorded as accepted-by-design (see `docs/security-review.md` and `docs/phase-2.1.2D-final-report.md`). DATA_MODE remains `demo`; BACKEND_WRITES_ENABLED remains `false`.

---

## Phase 2.1.2C Retry note (auth.users = 0 at re-verification)

No real backend user is signed in yet. Owner must complete sign-in and Bootstrap First Tenant via `/system-data-mode` → BackendAuthSandbox before this phase can be marked Ready. DATA_MODE remains `demo`; BACKEND_WRITES_ENABLED remains `false`; no writes executed; no credentials fabricated.
