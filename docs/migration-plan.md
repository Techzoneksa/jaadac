# JAAD CLOUD — Migration Plan (Phase 1.5)

Source: `LocalStorageDataAdapter` (`localStorage` key `jaad-cloud-state`).
Target: PostgreSQL schema in `docs/backend-schema-plan.md`.
Tool: `system.exportSnapshot()` → `MigrationSnapshot{ schemaVersion, exportedAt, productName, productNameAr, storageKey, state }`.

## Order of import (respecting FKs)
1. `tenants`
2. `profiles` + `user_tenants` + `user_roles`
3. `settings_company`, `settings_tax`, `settings_numbering`
4. `chart_accounts` (parents before children — two-pass)
5. `customers`, `suppliers`, `items`
6. `quotations` → `quotation_lines`
7. `invoices` → `invoice_lines`
8. `receipts`
9. `payments`
10. `journal_entries` → `journal_entry_lines`
11. `tasks`
12. `audit_logs` (last; preserves history)

## Field mappings

| Local state key | Target table | Transform / risk |
|---|---|---|
| `tenants[]` | `tenants` | preserve `id` (uuid) — verify uniqueness |
| `users[]` | `profiles` (+ create `auth.users` via admin) | password not migrated; trigger reset email |
| `user_tenants[]` | `user_tenants` + `user_roles` | split role into `user_roles.role` |
| `company` | `settings_company` (1 row per tenant) | flatten current single-tenant shape |
| `tax` | `settings_tax` | same |
| `numbering` | `settings_numbering` | same |
| `customers[]` | `customers` | map `opening_balance` numeric; default `code` if missing |
| `suppliers[]` | `suppliers` | same |
| `items[]` | `items` | ensure `vat_rate` defaults to 15 |
| `quotations[]` + `lines` | `quotations` + `quotation_lines` | line ids regenerated; preserve `converted_invoice_id` |
| `invoices[]` + `lines` | `invoices` + `invoice_lines` | recompute totals server-side; verify `paid ≤ total` |
| `receipts[]` | `receipts` | verify `invoice_id` exists |
| `payments[]` | `payments` | preserve `vat_amount` |
| `accounts[]` | `chart_accounts` | resolve `parent_id` in pass 2 |
| `journal[]` + lines | `journal_entries` + `journal_entry_lines` | enforce debit=credit; preserve `source_type/id` for idempotency |
| `tasks[]` | `tasks` | map `assignee_id` to `profiles.id` |
| `audit_log[]` | `audit_logs` | bulk insert with `created_at` preserved |

## Relationships to preserve
- Customer → Quotations/Invoices/Receipts.
- Invoice → Receipts (`invoice_id`), Journal (`source_type='sales_invoice', source_id`).
- Quotation → Invoice (`converted_invoice_id`).
- Receipt/Payment → Journal (source_type/id).
- Chart account parent self-ref (two-pass).

## Risks
- Duplicate document numbers across re-imports → enforce unique `(tenant_id, number)`; fail-fast.
- Orphan FK (deleted customer with invoices) → pre-flight integrity scan (`system.dataIntegrity`).
- Floating-point drift in totals → recompute via `docTotals` server-side.
- Mixed timezones in `date` strings → assume tenant TZ (default `Asia/Riyadh`), store `date` as `date` not `timestamptz`.
- Auth migration: users get reset-password emails; document for the customer.
- Demo data accidentally imported into production → `MigrationSnapshot.productName` + tenant flag `is_demo` gating.

## Cutover steps
1. Freeze writes in UI (banner, disable mutations).
2. `system.exportSnapshot()` → store JSON.
3. Provision backend tables + RLS + grants.
4. Import in declared order inside a single transaction per table set.
5. Run `system.dataIntegrity()` post-import; reconcile.
6. Flip `DATA_MODE = 'backend'` and re-test demo regression flow.
7. Keep snapshot JSON for rollback for ≥ 30 days.
