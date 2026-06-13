# JAAD CLOUD — Phase 2.1.3 Final Report

**Supabase Activation Runbook & Environment Readiness Guide**

## Runbook created

- `docs/supabase-activation-runbook.md` — comprehensive activation
  guide with two paths, migration application steps, env + security
  checklists, and a troubleshooting table.
- `docs/phase-2.1.3-final-report.md` — this report.

## Activation options documented

- **Option A — Lovable Cloud**: enable integration → env injected
  automatically → verify demo mode intact → apply migrations → run
  Phase 2.1.2 Retry. No writes enabled.
- **Option B — Existing Supabase project**: collect anon key + URL →
  add as `VITE_SUPABASE_*` → never expose service role → apply 7
  migrations → run Phase 2.1.2 Retry. No writes enabled.

## Migration guide documented

Exact 7-file order with per-migration purpose, ordering rationale,
verification commands (`supabase db push`, `supabase migration list`),
and explicit warning against destructive commands on production data.

## Env checklist documented

9 items covering env presence, anon-only restriction, demo-mode
preservation, write-disabled preservation, client init, dry run
reachability, and absence of UI write buttons.

## Security checklist documented

8 items: no committed secrets, no service-role in frontend, no JWT
logging, masked anon key, writes disabled until RLS verified, tenant
isolation verification, `SECURITY DEFINER` on write RPCs, no broad
`TO anon` grants on auth-only tables.

## Troubleshooting documented

12 symptom → cause → safe-fix rows covering env, URL/key validity,
missing migrations (tables and RPCs), `chart_account_purposes` mapping,
write readiness, auth/tenant/membership gaps, RLS denials, and stale
preview builds.

## System data mode update

Added an informational note panel (no action button, no mode switch)
below the Backend Write Readiness panel pointing to
`docs/supabase-activation-runbook.md` and confirming demo mode + writes
disabled.

## Demo checklist update

Added **Phase 2.1.3** group with 11 items covering runbook creation,
both activation options, migration guide, env/security/troubleshooting
checklists, system data mode note, demo default, writes disabled, build
clean.

## Regression result

- App loads on `/`, mock Owner auto-login OK
- `DATA_MODE = demo`, `BACKEND_WRITES_ENABLED = false`
- Dashboard, quotation → invoice → issue → receipt, audit log, data
  integrity, system data mode, demo reset — all OK
- Dry run still safely reports `skipped_not_configured` without env

## Build result

Clean.

## Known limitations

- Runbook is documentation only; no live verification was executed.
- Lovable Cloud is still not enabled in this workspace; Supabase env
  variables are still absent. Phase 2.1.2 remains
  **Skipped — Needs Env** until either Cloud is enabled or env vars
  are provided for an existing project.

## Final status

**JAAD CLOUD Phase 2.1.3 Supabase Activation Runbook & Environment
Readiness Guide is Ready.**
