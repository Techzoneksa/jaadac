# JAAD CLOUD — Backend Write RPC Plan (Phase 2.0)

All critical backend writes are encapsulated in Postgres RPC functions.
The application never writes through ad-hoc client `insert/update` for these
flows — it calls the RPC. RPCs are `SECURITY DEFINER` with a locked
`search_path = public, pg_temp` and `GRANT EXECUTE TO authenticated`.

## Status

- Migration: `supabase/migrations/20260611120005_write_rpc_functions.sql`
- Adapter flag: `BACKEND_WRITES_ENABLED = false`
- UI invocation: **none yet** — adapter write methods return
  `writes_disabled` and include the planned `rpcName` in `error.details`.

## Common safety contract

Every write RPC performs, in order:
1. `auth.uid()` must be present (else `unauthenticated`).
2. `current_tenant_id()` (from JWT `active_tenant_id`) must be present.
3. `is_tenant_member(tenant)` must be true.
4. `has_role(uid, tenant, required_role)` or `has_role(uid, tenant, 'owner')`.
5. Target document must belong to the active tenant.
6. Business state must be valid (status transitions, balance, lines).
7. Run all DML in a single statement transaction (atomic).
8. Write an `audit_logs` row (bilingual description).
9. Return a structured `jsonb` `{ ok, ..., error? }`.

Errors are raised with stable codes:
| Code      | Meaning                                |
| --------- | -------------------------------------- |
| `28000`   | unauthenticated / no active tenant     |
| `42501`   | not_tenant_member / forbidden_role / cross_tenant |
| `P0002`   | record not found                       |
| `22023`   | invalid state / value                  |
| `23505`   | duplicate / already-issued / converted |
| `23514`   | unbalanced / empty entry / no lines    |

## RPC contracts

### `quotation_convert_to_invoice(_quotation_id uuid) → jsonb`
- Role: `sales` (or `owner`)
- Validates: quotation in this tenant, status ∈ {accepted, sent},
  not already converted.
- Creates draft invoice + copies lines, recalculates total.
- Marks quotation `converted` and stores `converted_invoice_id`.
- Returns `{ ok, invoice_id, invoice_number }`.
- Audit: `quotation.convert`.

### `invoice_issue(_invoice_id uuid) → jsonb`
- Role: `accountant` (or `owner`)
- Validates: tenant, status ∈ {draft, sent}, not already issued, has lines,
  chart accounts `1200` (AR), `4000` (Revenue), `2300` (VAT payable) exist.
- Locks invoice as `official` with `issued_at = now()`.
- Creates posted journal entry; duplicate-prevented via the
  `(tenant_id, source_type, source_id)` unique index on
  `journal_entries`.
- Returns `{ ok, invoice_id, status, journal_entry_id }`.
- Audit: `invoice.issue`.

### `receipt_create_with_auto_apply(_customer_id, _amount, _method, _invoice_id, _reference, _notes) → jsonb`
- Role: `accountant`
- Validates: amount > 0, customer in tenant; if `_invoice_id`, the invoice
  belongs to the tenant + customer and amount ≤ remaining.
- Creates receipt; if invoice linked, increments `paid` and recomputes
  invoice status (`partially_paid` or `fully_paid`).
- Posts journal: Dr Cash/Bank (`1000`/`1100`), Cr AR (`1200`).
- Returns `{ ok, receipt_id, receipt_number, invoice_status?, journal_entry_id }`.
- Audit: `receipt.create`.

### `payment_create_with_posting(_amount, _supplier_id, _payee, _vat_amount, _method, _category, _account_code, _notes, _reference) → jsonb`
- Role: `accountant`
- Validates: amount > 0, supplier (if any) in tenant.
- Creates payment; posts journal: Dr Expense (`_account_code`),
  Dr Input VAT (`1300`) if applicable, Cr Cash/Bank.
- Returns `{ ok, payment_id, payment_number, journal_entry_id }`.
- Audit: `payment.create`.

### `journal_post_manual(_entry_id uuid) → jsonb`
- Role: `accountant`
- Validates: entry in tenant, status = `draft`, debit == credit, non-zero.
- Sets status `posted` and `posted_at`.
- Returns `{ ok, journal_entry_id, status }`.
- Audit: `journal.post_manual`.

## Why writes remain disabled

1. RPCs have not been executed against a populated tenant yet.
2. Auth, tenant claim, and role membership flows are still in the foundation
   stage (Phase 1.7) — production sessions don't carry `active_tenant_id`
   until tenant bootstrap is wired into login.
3. The UI is still mounted on the LocalStorage demo adapter.

## Next phase checklist

- [ ] Run all five RPCs against a seeded backend tenant.
- [ ] Verify role + cross-tenant rejection.
- [ ] Wire `BACKEND_WRITES_ENABLED` through env (not a constant) gated by
      an owner-only toggle in `/system-data-mode`.
- [ ] Implement adapter write methods to call `client.rpc(rpcName, args)`
      and map `mapSupabaseError` to bilingual `ApiErrorShape`.
- [ ] Add owner-only "Backend Write Test" panel that uses ephemeral fixtures.

## Phase 2.0.1 — Hardening (writes still disabled)

Hardening migration: `supabase/migrations/20260611120006_write_rpc_hardening.sql`.

### Numbering
- New table `public.document_number_sequences (tenant_id, doc_type, year, last_value)`.
- `_jaad_next_number` now uses `INSERT ... ON CONFLICT DO UPDATE ... RETURNING last_value`, which atomically serializes concurrent callers on the counter row. The existing `(tenant_id, number)` unique indexes remain a defence-in-depth check.

### Account lookup
- `_jaad_get_account(tenant, purpose)` resolves accounts by semantic purpose:
  `cash`, `bank`, `accounts_receivable`, `vat_input`, `vat_payable`, `revenue`, `expense`.
- Raises `missing_account:<purpose>` instead of silently posting to a wrong account.
- `invoice_issue` / `receipt_create_with_auto_apply` / `payment_create_with_posting` now resolve every account via the helper.
- Canonical chart codes used as defaults: 1000 cash, 1100 bank, 1200 AR, 1300 input VAT, 2300 VAT payable, 4000 revenue, 5000 expense.

### Error contract
- All RPCs return a stable envelope `{ ok, data?, error? }` with bilingual messages and a stable code (`not_found`, `invalid_status`, `duplicate_operation`, `overpayment`, `missing_account`, `unbalanced_journal`, `validation_failed`, `permission_denied`).

### Permission matrix
| RPC | Roles (owner always allowed) |
| --- | --- |
| `quotation_convert_to_invoice`   | sales |
| `invoice_issue`                  | accountant |
| `receipt_create_with_auto_apply` | accountant |
| `payment_create_with_posting`    | accountant |
| `journal_post_manual`            | accountant |

### Read-only readiness helpers
- `list_write_rpc_readiness()`
- `validate_numbering_setup(tenant)`
- `validate_tenant_account_setup(tenant)`

## Phase 2.0.2 — Account purpose mapping & readiness checks

Mapping migration: `supabase/planned-migrations/007_chart_account_purposes.sql`
(runnable copy pending Lovable Cloud activation).

### chart_account_purposes
| Column | Notes |
| --- | --- |
| `id uuid pk` | |
| `tenant_id uuid` | FK `tenants(id) on delete cascade` |
| `purpose text` | one of 9 allowed values (CHECK) |
| `account_id uuid` | FK `chart_accounts(id) on delete restrict` |
| `created_at / updated_at` | trigger keeps `updated_at` fresh |

Unique `(tenant_id, purpose)`. RLS: tenant-member SELECT, owner+accountant ALL.

Allowed purposes:
`cash`, `bank`, `accounts_receivable`, `vat_input`, `vat_payable`,
`revenue`, `expense`, `inventory`, `accounts_payable`.

### `_jaad_get_account(tenant, purpose)`
1. Lookup in `chart_account_purposes`.
2. Fallback to canonical codes (1000 cash, 1100 bank, 1200 AR, 2100 AP,
   1300 input VAT, 2300 VAT payable, 4000 revenue, 5000 expense, 1400 inventory).
3. Raise `missing_account:<purpose>` (`P0002`).

### Seed / bootstrap
- `_jaad_seed_default_purpose_mappings(tenant)` is idempotent.
- The migration loops over existing tenants once to backfill mappings.
- `bootstrap_tenant_for_user` now seeds mappings as part of provisioning.

### Read-only readiness RPCs (Phase 2.0.2 updates)
- `validate_tenant_account_setup(tenant)` — returns mapped / fallback /
  missing arrays plus a structured `checks[]` and a JSON envelope
  `{ ok, warnings, errors }`.
- `validate_numbering_setup(tenant)` — reports `settings_numbering`
  presence and lazily-created `document_number_sequences` rows.
- `list_write_rpc_readiness()` — reports per-RPC availability via
  `to_regprocedure` plus the current numbering / account lookup strategy.

These three RPCs are pure reads and are the only ones called by the
adapter's `getWriteRpcReadiness` / `getAccountPurposeReadiness` /
`getNumberingReadiness` methods. Writes remain disabled.

## Phase 2.1.1
- Mapping migration is now runnable
  (`supabase/migrations/20260611120007_chart_account_purposes_readiness.sql`).
  Backend writes remain disabled until a later phase.
