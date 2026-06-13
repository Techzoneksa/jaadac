# JAAD CLOUD — Phase 2.0 Final Report
## Backend Write RPC Contracts & SQL Functions

### Write RPC migration
- `supabase/migrations/20260611120005_write_rpc_functions.sql` (timestamped, runnable).
- Mirror: `supabase/planned-migrations/005_write_rpc_functions.sql`.

### RPC functions added
- `_jaad_require_tenant()`, `_jaad_require_role(role)`, `_jaad_next_number(tenant, kind)`, `_jaad_audit(...)` — internal safety helpers.
- `quotation_convert_to_invoice(uuid) → jsonb`
- `invoice_issue(uuid) → jsonb`
- `receipt_create_with_auto_apply(...) → jsonb`
- `payment_create_with_posting(...) → jsonb`
- `journal_post_manual(uuid) → jsonb`

### RPC safety behavior
- `SECURITY DEFINER` with `SET search_path = public, pg_temp`.
- `EXECUTE` revoked from PUBLIC, granted only to `authenticated`.
  No frontend service-role key usage.
- Inside every RPC: `auth.uid()` check, JWT `active_tenant_id` check,
  `is_tenant_member` check, `has_role` check (role + `owner`),
  cross-tenant rejection, status-transition validation.
- Atomic per call. Audit log written for every successful path.
- Idempotency: invoice→journal protected by the existing
  `journal_entries (tenant_id, source_type, source_id)` unique index;
  quotation conversion blocked by `converted_invoice_id is not null`;
  invoice issue blocked by `issued_at is not null`.
- All errors raise stable SQLSTATE codes (see backend-write-rpc-plan).

### FutureBackendDataAdapter write mapping
- Adapter exports `BACKEND_WRITES_ENABLED = false` and `WRITE_RPC_MAP`.
- The five mapped methods now embed their RPC name in the disabled response:
  `quotations_convertToInvoice`, `invoices_issue`, `receipts_createWithAutoApply`,
  `payments_createWithPosting`, `journal_postManual`.
- All other write methods continue to return generic `writes_disabled`.
- No write path is reachable from the UI.

### System data mode updates
- New **Backend Write Readiness** panel on `/system-data-mode` showing
  migration detection, `BACKEND_WRITES_ENABLED`, RPC mapping table, and the
  per-RPC `disabled` badge. No test-write button is rendered.

### Docs updated
- `docs/backend-write-rpc-plan.md` (new)
- `docs/phase-2.0-final-report.md` (this file)
- `docs/backend-adapter-plan.md` / `docs/supabase-setup.md` updated to point
  at the write-RPC migration and the disabled write flag.

### Demo regression results
- App loads with no Supabase env.
- `DATA_MODE === "demo"`, `BACKEND_WRITES_ENABLED === false`.
- Mock Owner auto-login, dashboard, quotation → invoice → issue → receipt,
  audit log, data integrity, system data mode, demo reset — all unaffected.
- Backend preview panel still read-only. Write readiness panel shows
  "disabled" everywhere.

### Build result
Build clean.

### Known limitations
- RPCs have not been executed against a real backend tenant yet — they are
  reviewed and runnable, not battle-tested.
- `_jaad_next_number` uses a count-based fallback; production use should
  prefer a proper per-tenant sequence to avoid collisions under concurrency.
- Chart-of-accounts lookups assume canonical codes
  (`1000/1100/1200/1300/2300/4000/5000`); a future phase will source codes
  from `settings_company` mapping.
- VAT-payable account is optional — if missing, the line is skipped rather
  than failing the entire issue.

### Final status
**JAAD CLOUD Phase 2.0 Backend Write RPC Contracts & SQL Functions is Ready.**
