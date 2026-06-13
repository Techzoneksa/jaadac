# JAAD CLOUD — Backend Readiness Checks (Phase 2.1)

Read-only diagnostic suite that validates the Supabase foundation without
touching data or enabling writes. Orchestrator lives in
`src/lib/supabase/dry-run.ts` and is surfaced through
`FutureBackendDataAdapter.runBackendDryRun()` and the **Backend Dry Run
Report** panel on `/system-data-mode`.

## Status codes per check

| Status   | Meaning                                                    |
| -------- | ---------------------------------------------------------- |
| pass     | Check succeeded.                                           |
| warn     | Reachable but degraded (e.g. RLS denial, missing mapping). |
| fail     | Backend cannot satisfy the check (e.g. missing RPC/table). |
| skipped  | Prerequisite missing (no env, no session, no tenant).      |

## Overall status

- **ready** — every required table/RPC reachable, no fails.
- **needs_configuration** — env present but smoke checks fail.
- **needs_migration** — at least one required table or RPC missing.
- **rls_issue** — required tables exist but RLS denied access.
- **skipped_not_configured** — `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` absent.

## Checks performed

1. `env.configured` — both env vars present.
2. `smoke.supabase.connection` — JS client loads.
3. `smoke.auth.session` — authenticated session detected.
4. `smoke.tenant.membership` — `active_tenant_id` claim in JWT.
5. `smoke.rls.read_access` — HEAD probe on `tenants`.
6. `smoke.rpc.bootstrap_tenant_for_user` — RPC reachable.
7. `schema.table.<name>` — HEAD probe per required table (24 tables).
8. `rpc.<name>` — existence probe per required RPC (9 RPCs).
9. `readiness.purposes` — `validate_tenant_account_setup`.
10. `readiness.numbering` — `validate_numbering_setup`.
11. `readiness.write_rpcs` — `list_write_rpc_readiness`.

## Required tables (24)

tenants, profiles, user_tenants, user_roles, customers, suppliers, items,
quotations, quotation_lines, invoices, invoice_lines, receipts, payments,
chart_accounts, chart_account_purposes, journal_entries,
journal_entry_lines, tasks, settings_company, settings_tax,
settings_numbering, audit_logs, attachments, document_number_sequences.

## Required RPCs (9)

bootstrap_tenant_for_user, quotation_convert_to_invoice, invoice_issue,
receipt_create_with_auto_apply, payment_create_with_posting,
journal_post_manual, list_write_rpc_readiness, validate_numbering_setup,
validate_tenant_account_setup.

## Interpretation cheat sheet

| Symptom                                                  | Likely cause                              | Fix                                            |
| -------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------- |
| `schema.table.* = fail` ("relation does not exist")      | Migration 001 not applied                 | `supabase db reset` (or apply migrations).     |
| `schema.table.* = warn` (RLS denied)                     | User has no membership row                | Call `bootstrap_tenant_for_user`.              |
| `rpc.* = fail` (PGRST202)                                | Migration 005/006/007 not applied         | Apply the missing migration.                   |
| `readiness.purposes.warn` with N missing                 | `chart_account_purposes` not seeded       | Re-run bootstrap or seed mappings.             |
| `skipped_not_configured`                                 | No `.env` values                          | Configure `VITE_SUPABASE_*` and rebuild.       |

## Safe logging contract

`safeLogConfig()` is the only place that prints config to the console.
It NEVER logs:
- anon key (only `len=<n>` + first/last 4 chars masked)
- service role key
- JWT
- user IDs, tenant IDs, emails
It logs only: `{ configured, urlHost, anonKey: "abcd…wxyz" }`.

## Writes still disabled

`BACKEND_WRITES_ENABLED = false`. The dry run NEVER calls a write RPC
(`quotation_convert_to_invoice`, `invoice_issue`,
`receipt_create_with_auto_apply`, `payment_create_with_posting`,
`journal_post_manual`). It only verifies they exist via
`list_write_rpc_readiness` and the read-only `rpc.*` probes (called with
empty args — a non-existent RPC returns PGRST202; an existing one rejects
input or runs without producing side effects on the readiness listing).

## Phase 2.1.1 update
- Migration 007 (`chart_account_purposes` + readiness RPCs) is now runnable
  at `supabase/migrations/20260611120007_chart_account_purposes_readiness.sql`.
- Fix column in the cheat sheet for "missing table `chart_account_purposes`"
  or "missing RPC `validate_*` / `list_write_rpc_readiness`" → apply
  migration 20260611120007.
