# JAAD CLOUD — Phase 2.0.1 Final Report
## Write RPC Hardening & Production Safety Review

### RPC migration reviewed
- `supabase/migrations/20260611120005_write_rpc_functions.sql` — reviewed; safe, ordered, schema-compatible.
- Five write RPCs + four `_jaad_*` helpers confirmed (`SECURITY DEFINER`, locked `search_path`, `EXECUTE` to `authenticated` only).

### Numbering hardening
- New migration: `supabase/migrations/20260611120006_write_rpc_hardening.sql`.
- New table `public.document_number_sequences (tenant_id, doc_type, year, last_value)`.
- `_jaad_next_number` rewritten to use `INSERT ... ON CONFLICT DO UPDATE ... RETURNING last_value`, which serializes concurrent callers on the same counter row → no duplicate numbers per `(tenant, doc_type, year)`.
- Prefixes still sourced from `settings_numbering`. Existing `(tenant_id, number)` unique constraints remain a final guard.

### Account lookup hardening
- New helper `_jaad_get_account(tenant, purpose)` for purposes: `cash`, `bank`, `accounts_receivable`, `vat_input`, `vat_payable`, `revenue`, `expense`.
- Raises stable `missing_account:<purpose>` rather than silently posting to wrong account.
- `invoice_issue`, `receipt_create_with_auto_apply`, `payment_create_with_posting` all re-issued to use the helper; `payment_create_with_posting`'s `_account_code` parameter is now optional and falls back to `expense`.
- Canonical code dependency (`1000/1100/1200/1300/2300/4000/5000`) documented in this report and in `backend-write-rpc-plan.md`.

### Error contract updates
- Every RPC now returns a stable JSON envelope:
  - success: `{ ok: true, data: {...} }`
  - failure: `{ ok: false, error: { code, message_ar, message_en } }`
- Stable codes: `tenant_required`, `permission_denied`, `not_found`, `invalid_status`, `duplicate_operation`, `unbalanced_journal`, `overpayment`, `missing_account`, `validation_failed`.
- Raw DB errors (unique-violation on journal source) captured and translated to `duplicate_operation`.
- Authorization helpers (`_jaad_require_tenant`/`_jaad_require_role`) still raise SQLSTATE for early reject — they are intercepted by the adapter's `mapSupabaseError`.

### Permission matrix
| RPC | Roles (owner is implicit fallback) |
| --- | --- |
| `quotation_convert_to_invoice`   | owner, accountant, sales |
| `invoice_issue`                  | owner, accountant |
| `receipt_create_with_auto_apply` | owner, accountant |
| `payment_create_with_posting`    | owner, accountant |
| `journal_post_manual`            | owner, accountant |
Owner fallback confirmed in `_jaad_require_role` (passes when the user holds either the requested role *or* `owner`).

### Readiness helpers (read-only)
- `list_write_rpc_readiness()` → declarative RPC catalogue + strategies.
- `validate_numbering_setup(tenant)` → confirms `settings_numbering` row and reports strategy.
- `validate_tenant_account_setup(tenant)` → returns `{ ok, purposes, missing[] }`.
All `SECURITY DEFINER`, `EXECUTE` granted to `authenticated`, tenant-membership checked.

### FutureBackendDataAdapter metadata updates
- New `WRITE_RPC_METADATA` map exposes per-RPC `{ rpcName, requiredRoles, writesEnabled:false, safetyStatus:"hardened", numberingStrategy:"tenant_scoped_sequence_table", accountLookupStrategy }`.
- `BACKEND_WRITES_ENABLED` remains `false`.
- All write methods continue to return `writes_disabled`.

### System data mode updates
- Backend Write Readiness panel rewritten to show:
  - both migrations detected,
  - numbering & account-lookup strategies,
  - error contract status,
  - readiness-helper availability,
  - a permission matrix table per RPC.
- Still no test-write button.

### Docs updated
- `docs/backend-write-rpc-plan.md` (extended with hardening section).
- `docs/supabase-setup.md` (Phase 2.0.1 entry).
- `docs/phase-2.0.1-final-report.md` (this file).

### Demo regression results
- App loads with no Supabase env.
- `DATA_MODE === "demo"`, `BACKEND_WRITES_ENABLED === false`.
- Mock Owner auto-login, dashboard, quotation → invoice → issue → receipt, audit log, data integrity, system data mode, demo reset — all unchanged.
- Backend write readiness panel still shows "disabled" for every RPC.

### Build result
Build clean.

### Known limitations
- RPCs still have not been executed against a real backend tenant; hardening is structural, not battle-tested.
- Numbering yearly reset is based on `extract(year from now())` in server TZ — a tenant TZ setting would be more correct.
- Account purposes still map to canonical codes; a future `chart_account_purposes` mapping table would let tenants customise.
- `_jaad_err` builds a JSON envelope but `_jaad_require_tenant`/`_jaad_require_role` continue to `RAISE` — by design (early exit before any DML).

### Final status
**JAAD CLOUD Phase 2.0.1 Write RPC Hardening & Production Safety Review is Ready.**
