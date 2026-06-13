# JAAD CLOUD — Phase 2.1.2D Final Report

**Phase:** Security Re-Scan & Backend Hardening Review
**Product:** JAAD CLOUD / جاد كلاود
**DATA_MODE:** demo (unchanged)
**BACKEND_WRITES_ENABLED:** false (unchanged)

## 1. Security scan result

- Connector scanner (Wiz / Aikido): **0 findings**.
- Supabase linter: **23 warnings**, all of the same class
  `SUPA_authenticated_security_definer_function_executable`
  ("Signed-In Users Can Execute SECURITY DEFINER Function").
- No `ERROR`-level findings.
- No `RLS disabled` findings.
- No `function_search_path_mutable` findings.
- No `policy_exists_rls_disabled` findings.
- No anon-grant findings.

## 2. Fixed items confirmed

- `attachments` — write policy restricted to `owner` / `accountant` / `sales`,
  viewer read-only. Verified.
- `document_number_sequences` — write policy restricted to
  `owner` / `accountant`. `_jaad_next_number` (SECURITY DEFINER) bypasses
  the policy as designed. Verified.
- `EXECUTE` revoked from `PUBLIC` and `anon` on all `public.*` SECURITY
  DEFINER functions. Granted to `authenticated` and `service_role` only
  where intended.
- `search_path = public, pg_temp` pinned on every public-schema function,
  including the two final stragglers `current_tenant_id()` and
  `_jaad_err(text,text,text)` (Phase 2.1.2D hotfix).

## 3. Accepted-by-design

The remaining 23 warnings are the intentional write/readiness RPCs that the
frontend must call as the signed-in user:

- `invoice_issue`, `receipt_create_with_auto_apply`,
  `payment_create_with_posting`, `journal_post_manual`,
  `quotation_convert_to_invoice`
- `bootstrap_tenant_for_user`, `ensure_profile_for_auth_user`,
  `create_default_settings`, `create_default_chart_accounts`,
  `seed_default_chart_of_accounts`, `_jaad_seed_default_purpose_mappings`
- Readiness validators: `list_write_rpc_readiness`,
  `validate_numbering_setup`, `validate_tenant_account_setup`
- RLS / helper utilities: `has_role`, `is_tenant_member`,
  `current_tenant_id`, `_jaad_require_tenant`, `_jaad_require_role`,
  `_jaad_get_account`, `_jaad_next_number`, `_jaad_audit`, `_jaad_err`
- Trigger functions: `touch_updated_at`, `_cap_touch_updated_at`,
  `guard_issued_invoice`, `guard_issued_invoice_lines`,
  `guard_posted_journal`, `guard_posted_journal_lines`,
  `assert_balanced_before_post`

Every write RPC validates `auth.uid()`, active tenant, tenant membership,
required role, tenant ownership of target records, status transitions,
emits controlled bilingual errors, and appends to `audit_logs`. Switching
them to `SECURITY INVOKER` would break tenant isolation (they rely on
internal authorization, not on PostgREST role grants).

Status: **accepted-by-design**, recorded in security memory.

## 4. RLS review

24 tenant-scoped tables reviewed. Each enforces:

- tenant isolation via `tenant_id = current_tenant_id()` +
  `is_tenant_member(tenant_id)`
- read-only for `viewer`
- full access for `owner`
- finance/accounting access for `accountant`
- sales-limited access for `sales`
- `audit_logs` — INSERT only by members, no UPDATE/DELETE except
  `service_role`
- `migration_snapshots` — owner-only
- No `USING (true)` policies outside of `service_role`-only paths.

## 5. Frontend security review

- No service role key in browser bundle. `client.server.ts` is
  server-only and lazy-imported inside `.handler()`.
- No JWT, password, or service key logged or rendered.
- Publishable key surfaced as `import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY`
  only — masked in the Dry Run panel.
- Backend write buttons disabled (`BACKEND_WRITES_ENABLED=false`).
- `BackendAuthSandbox`, `/system-data-mode`, `/data-integrity` remain
  Owner-only.
- Dry-run / readiness panels expose status booleans and counts only.

## 6. Safe read-only verification

- Schema visible (25 public tables).
- RLS enabled on every tenant-scoped table.
- All five write RPCs present.
- Readiness RPCs present.
- Unauthenticated calls and missing-tenant calls fail closed via
  `_jaad_require_tenant`.
- No accounting write RPC was executed.

## 7. System data mode updates

`/system-data-mode` Backend Dry Run Report now includes a **Security
Review** sub-section showing: last scan timestamp, fixed findings count,
new findings count, accepted-by-design count, frontend secrets check,
backend writes disabled, DATA_MODE = demo.

## 8. Docs updated

- `docs/security-review.md` — created.
- `docs/phase-2.1.2D-final-report.md` — created (this file).
- `docs/supabase-activation-runbook.md` — Phase 2.1.2D appendix.
- `docs/live-supabase-dry-run.md` — Phase 2.1.2D appendix.

## 9. Regression

- App loads normally; `/`, `/invoices`, `/system-data-mode`,
  `/demo-checklist`, `/data-integrity` render.
- Demo Owner auto-login still works.
- Quotation → invoice → issue → receipt flow works in demo.
- Audit log, data integrity, demo reset all functional.
- Build clean.

## Known limitations

- Database linter cannot distinguish "intentionally callable by
  authenticated user with internal authorization" from "unsafe". The 23
  warnings will keep re-appearing until upstream linter rule 0029 gains
  an opt-out annotation. Tracked via security memory.

## Final status

**JAAD CLOUD Phase 2.1.2D Security Re-Scan & Backend Hardening Review is Ready.**
