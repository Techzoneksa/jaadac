# JAAD CLOUD — Security Review

Snapshot of backend security posture after Phase 2.1.2D.

## Scanners

| Scanner | Findings | Notes |
|---|---|---|
| Connector (Wiz / Aikido) | 0 | clean |
| Supabase linter | 23 warn | all `0029_authenticated_security_definer_function_executable` — accepted-by-design |
| Supabase Lov | 0 | clean |

## Fixed in 2.1.2C → 2.1.2D

- `attachments` write policy: owner/accountant/sales; viewer read-only.
- `document_number_sequences` write policy: owner/accountant only; the
  `_jaad_next_number` SECURITY DEFINER path is the normal numbering route.
- All public-schema SECURITY DEFINER functions: `EXECUTE` revoked from
  `PUBLIC` and `anon`; granted to `authenticated` + `service_role` as
  appropriate.
- `search_path = public, pg_temp` pinned on every public-schema function
  (including `current_tenant_id`, `_jaad_err`).

## Accepted-by-design

`SUPA_authenticated_security_definer_function_executable` — see
`docs/phase-2.1.2D-final-report.md` §3 for the full list. Each function
performs internal `auth.uid()` / tenant / role / ownership checks and
writes to `audit_logs`. Removing the `authenticated` grant would break the
intended client RPC path.

## RLS posture

- 24 tenant-scoped tables, all RLS-enabled.
- Tenant isolation enforced via `current_tenant_id()` + `is_tenant_member()`.
- Role-tiered writes (owner > accountant > sales > viewer).
- `audit_logs`: append-only by members; admin reads via `service_role`.
- `migration_snapshots`: owner-only.

## Frontend

- Service role key never bundled.
- No JWT / password / key logging.
- Backend writes gated by `BACKEND_WRITES_ENABLED=false`.
- DATA_MODE remains `demo`.

## Remaining recommendations

- Add per-function annotation (when upstream linter supports it) to
  silence rule 0029 for the documented accepted-by-design RPCs.
- When DATA_MODE flips to `backend`, re-run a full read/write dry-run
  with a non-owner test user to confirm role-tiered failures behave as
  expected.
