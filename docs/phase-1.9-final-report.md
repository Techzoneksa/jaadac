# JAAD CLOUD — Phase 1.9 Final Report

**Status: JAAD CLOUD Phase 1.9 Backend Read-Only Adapter Implementation is Ready ✅**

## Scope
Implement safe, read-only Supabase data access in `FutureBackendDataAdapter` for all core entities, without switching the live app to backend mode and without enabling any writes.

## Read-only adapter methods implemented
All methods are tenant-scoped (`tenant_id = active_tenant_id` from JWT) and rely on RLS:

| Domain | List | Get | Notes |
|---|---|---|---|
| tenants | — | `tenants_current` | Reads the active tenant row |
| profiles | — | `profile_current` | Reads `profiles` row for `auth.uid()` |
| customers | ✅ | ✅ | search on name/code |
| suppliers | ✅ | ✅ | search on name/code |
| items | ✅ | ✅ | search on name/code |
| quotations | ✅ | ✅ | get includes `lines:quotation_lines(*)` |
| invoices | ✅ | ✅ | get includes `lines:invoice_lines(*)` |
| receipts | ✅ | ✅ | sorted by date desc |
| payments | ✅ | ✅ | sorted by date desc |
| chart_accounts | ✅ | ✅ | sorted by code asc |
| journal_entries | ✅ | ✅ | get includes `lines:journal_entry_lines(*)` |
| tasks | ✅ | ✅ | search on title/description |
| settings_company | get | — | singleton per tenant |
| settings_tax | get | — | singleton per tenant |
| settings_numbering | get | — | singleton per tenant |
| audit_logs | ✅ | — | sorted by `created_at` desc |
| reports.* | guarded | — | RPCs not deployed yet → `not_implemented` |

All write methods (`*_create`, `*_update`, `*_remove`, `invoices_issue`, `quotations_convertToInvoice`, `receipts_createWithAutoApply`, `payments_createWithPosting`, `journal_postManual`, `audit_append`, settings updates) return a uniform `writes_disabled` `ServiceResult` error with a bilingual message.

## Backend preview mode
Added an **Owner-only** "Backend Read-Only Preview" section to `/system-data-mode`:
- Entity selector: `customers`, `suppliers`, `items`, `invoices`, `quotations`, `accounts`, `audit_logs`.
- Calls `adapter.previewEntity(entity, { pageSize: 10 })`.
- Renders rows in a compact table (first 5 columns) with bilingual empty / error states.
- Disabled when Supabase env is missing; shows friendly hint instead of throwing.
- Never writes, never switches `DATA_MODE`, never touches the LocalStorage demo store.

## RLS verification
Read access is gated by three preconditions inside `getReadContext()`:
1. `isSupabaseConfigured()` — env present.
2. `getSessionSnapshot().hasSession` — active Supabase session.
3. `getSessionSnapshot().activeTenantId` — JWT `app_metadata.active_tenant_id`.
Failures surface as `permission_denied` with bilingual messages (401 / 403). The existing smoke-check report in `BackendAdapterReadinessPanel` already covers connection, session, tenant membership, an RLS read probe, and the bootstrap RPC existence.

The service-role key is **never** referenced from the client.

## Supabase type updates
`src/lib/supabase/types.ts` now exports hand-maintained row types for: `tenants`, `profiles`, `user_tenants`, `user_roles`, `customers`, `suppliers`, `items`, `quotations`, `quotation_lines`, `invoices`, `invoice_lines`, `receipts`, `payments`, `chart_accounts`, `journal_entries`, `journal_entry_lines`, `tasks`, `settings_company`, `settings_tax`, `settings_numbering`, `audit_logs`, plus an aggregated `Database` map.

## System data mode updates
- New panel: `BackendReadOnlyPreviewPanel` (Owner gate via `session.role === "owner"`).
- Adapter version bumped to `0.3.0-read-only`.
- `health()` now returns `ok: true` when read context resolves, otherwise the bilingual reason from the precondition that failed.

## Docs updated
- `docs/phase-1.9-final-report.md` (this file)
- `docs/backend-adapter-plan.md` (appended Phase 1.9 section)
- `docs/supabase-setup.md` (read-only preview note)

## Demo regression results (no Supabase env)
| Check | Result |
|---|---|
| App loads | ✅ |
| `DATA_MODE === "demo"` | ✅ |
| Mock Owner auto-login | ✅ |
| Dashboard | ✅ |
| Quotation → Invoice → Issue → Receipt | ✅ |
| Audit log | ✅ |
| Data integrity | ✅ |
| System data mode | ✅ |
| Backend preview → friendly "not configured" | ✅ |
| Demo reset | ✅ |
| Build | ✅ |

## Known limitations
- Reports RPCs are not deployed yet; report methods return `not_implemented`.
- Row types are hand-maintained until a real Supabase project is linked and types are regenerated.
- No write path is implemented yet — that lands in a later phase.

**JAAD CLOUD Phase 1.9 Backend Read-Only Adapter Implementation is Ready ✅**
