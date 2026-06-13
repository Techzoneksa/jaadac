# JAAD CLOUD — FutureBackendDataAdapter Implementation Plan (Phase 1.5)

Current state: `src/lib/adapters/FutureBackendDataAdapter.ts` throws `not_implemented` everywhere. This document specifies, per method, the backend call to make once the real backend is connected.

Transport: `createServerFn` from `@tanstack/react-start` with `requireSupabaseAuth` middleware. Adapter calls server fns through a thin RPC wrapper; never calls Supabase from the browser directly.

All methods return / throw using `src/lib/errors.ts` (`AppError` with bilingual messages).

| Adapter method | Server fn / endpoint | Response | Errors | Permission | Notes |
|---|---|---|---|---|---|
| `status` | `system.health` | `AdapterStatus` | – | public | cached 30s |
| `subscribe(listener)` | Supabase Realtime channels per entity OR poll | unsubscribe fn | – | – | start with polling+invalidate; realtime in later phase |
| `getState()` | n/a (deprecate for backend) | – | `not_supported` | – | UI must use `list/getById` |
| `list(key, params)` | `<entity>.list(params)` | `PaginatedResult<T>` | `unauthorized, permission_denied` | per-entity read | server-side filter/sort/page |
| `getById(key, id)` | `<entity>.get({id})` | `T \| undefined` | `not_found` | per-entity read | |
| `create(key, record)` | `<entity>.create(payload)` | `T` | `validation, duplicate_*, permission_denied` | per-entity write | server returns canonical row |
| `update(key, id, patch)` | `<entity>.update({id,patch})` | `T` | `edit_locked, validation` | per-entity write | |
| `remove(key, id)` | `<entity>.archive({id})` or `delete` | `{ok:true}` | `permission_denied, has_dependents` | per-entity write | archive preferred |
| `replaceState(next)` | – | – | `not_supported` | – | replaced by `system.importSnapshot` (service-role, owner) |
| `resetDemo(actor)` | `system.resetDemoTenant` | `{ok:true}` | `not_in_demo_mode` | owner | only on demo tenants |
| `exportSnapshot()` | `system.exportSnapshot` | `MigrationSnapshot` | `permission_denied` | owner | service-role on server |

## Pagination
- Default `pageSize = 25` (from contracts).
- Server uses `range(from,to)` + `count: 'exact'` to populate `PaginatedResult.total`.

## Error handling
- HTTP/Supabase errors → mapped in a `mapError(err)` helper to `AppError` codes:
  `PGRST116 → not_found`, `23505 → duplicate_number/duplicate_code`, `42501/RLS → permission_denied`, network → `network_error`, else → `internal_error`.
- All errors include `{ar,en}` messages; UI shows via existing toast.

## Permission handling
- Enforced server-side by RLS + `has_role` checks inside server fns.
- Adapter does not re-check; surfaces `permission_denied` to UI which already uses `PermissionGate`.

## Offline / demo fallback
- The adapter does not silently fall back to LocalStorage. Mode switch is explicit through `setAdapter`.
- Optional: read-only cache via TanStack Query (`staleTime`, `gcTime`) — not the adapter's responsibility.

## Realtime (deferred)
- `subscribe` initially: TanStack Query `invalidateQueries` on mutation; polling every 30s for `invoices/journal`.
- Later: Supabase Realtime channels filtered by `tenant_id`.

## Idempotency
- `invoices.issue`, `receipts.create`, `payments.create` rely on DB unique `(source_type, source_id)` on `journal_entries`. Server fns are idempotent on retry.

## What this phase does NOT implement
- Actual `fetch` / Supabase calls.
- Realtime subscriptions.
- Optimistic updates.
- Conflict resolution for concurrent edits.

---

## Phase 1.8 — Contract-Ready Adapter

`FutureBackendDataAdapter` (v0.2.0-contract-ready) now exposes typed,
documented method groups for every domain. All methods are INERT in demo
mode — they return `ServiceResult` with a bilingual `adapter_unavailable`
(or `not_implemented`) error. The adapter never silently falls back to
LocalStorage data.

### Method groups → Supabase mapping

| Group | Methods | Future target |
| --- | --- | --- |
| Tenants | `tenants_current`, `tenants_bootstrap`, `bootstrapReadiness` | `public.tenants`, RPC `bootstrap_tenant_for_user` |
| Session | `sessionSnapshot`, `clientAvailable` | `auth.getSession()`, `auth.getUser()` |
| Customers | `customers_list/get/create/update/remove` | `public.customers` |
| Suppliers | `suppliers_*` | `public.suppliers` |
| Items | `items_*` | `public.items` |
| Quotations | `quotations_*`, `quotations_convertToInvoice` | `public.quotations` + `quotation_lines`; RPC `quotation_convert_to_invoice` |
| Invoices | `invoices_*`, `invoices_issue`, `invoices_cancel` | `public.invoices` + `invoice_lines`; RPC `invoice_issue`, `invoice_cancel` |
| Receipts | `receipts_*`, `receipts_createWithAutoApply` | `public.receipts`; RPC `receipt_create_with_auto_apply` |
| Payments | `payments_*`, `payments_createWithPosting` | `public.payments`; RPC `payment_create_with_posting` |
| Chart of Accounts | `accounts_*` | `public.accounts` |
| Journal | `journal_list/get`, `journal_postManual` | `public.journal_entries` + lines; RPC `journal_post_manual` |
| Tasks | `tasks_*` | `public.tasks` |
| Settings | `settings_getCompany/Tax/Numbering`, updaters | `public.tenant_settings`, `public.numbering_settings` |
| Audit | `audit_list`, `audit_append` | `public.audit_logs` |
| Reports | `reports_vatSummary/arAging/apAging/profitLoss/cashflow/topCustomers` | `report_*` RPCs |
| System | `system_dataIntegrity`, `system_exportSnapshot`, `health` | `system_*` RPCs |

### Backend result normalization (`src/lib/supabase/backend-helpers.ts`)

- `requireBackendConfigured`, `requireSession`, `requireTenant` — guard
  helpers returning `AppError | null`.
- `mapSupabaseError` — PostgREST/Postgres → `AppError` (handles `PGRST116`
  not-found, `23505` unique violation, `42501`/`PGRST301` RLS, `23503`
  FK).
- `normalizeSupabaseResult` — `{ data, error }` → `ServiceResult<T>`.
- `buildListQuery`, `applyPagination`, `applySorting`, `applyDateRange`,
  `applySearch`, `applyFilters`, `toPaginated` — compose Supabase
  list queries from `ListQueryParams`.

### Read-only smoke checks

`runReadOnlySmokeChecks()` runs five non-mutating probes:

1. `supabase.connection` — client initializes.
2. `auth.session` — current session detected.
3. `tenant.membership` — `active_tenant_id` present in JWT.
4. `rls.read_access` — `HEAD` count probe on `public.tenants` (no rows
   read, no writes).
5. `rpc.bootstrap_tenant_for_user` — RPC reachability check via NULL
   args (function raises `p_user_id is required`, proving existence
   without writing).

When Supabase is not configured every check returns a `not configured`
result without touching the network.

### Why backend mode is still disabled

- `DATA_MODE` remains `"demo"`. The active adapter is
  `LocalStorageDataAdapter`.
- No production credentials or service-role keys are present in this
  sandbox.
- The auth UI / tenant bootstrap RPC must be wired to a real Supabase
  project before any write path can be exercised.

### Next phase requirements

- Phase 1.9: Implement at least one read group (likely customers) against
  a real Supabase project, behind a feature flag.
- Add `attachSupabaseAuth` middleware and a server-fn surface.
- Wire `auth.signInWithEmail` to the login page.
- Begin replacing `LocalStorageDataAdapter` reads behind a per-domain
  toggle.


## Phase 1.9 — Read-only implementation

- `FutureBackendDataAdapter` now executes real Supabase reads when env + session + active tenant are present.
- All write methods return `writes_disabled` (bilingual).
- Owner-only "Backend Read-Only Preview" panel on `/system-data-mode` exercises: customers, suppliers, items, invoices, quotations, accounts, audit_logs.
- Tenant scoping is enforced via `eq("tenant_id", activeTenantId)` and RLS.
- Service role key is never used in the client.

## Phase 2.0 — Write RPC mapping (writes still disabled)

The adapter now exports `BACKEND_WRITES_ENABLED = false` and `WRITE_RPC_MAP`:

| Adapter method                  | Postgres RPC                       |
| ------------------------------- | ---------------------------------- |
| `quotations_convertToInvoice`   | `quotation_convert_to_invoice`     |
| `invoices_issue`                | `invoice_issue`                    |
| `receipts_createWithAutoApply`  | `receipt_create_with_auto_apply`   |
| `payments_createWithPosting`    | `payment_create_with_posting`      |
| `journal_postManual`            | `journal_post_manual`              |

All write methods still return `writes_disabled`; the mapped methods include
`{ rpcName, enabled: false }` in `error.details`. See
`docs/backend-write-rpc-plan.md`.

## Phase 2.1 — Adapter readiness API
`FutureBackendDataAdapter` exposes:
- `runBackendDryRun(): ServiceResult<DryRunReport>` — full read-only suite.
- `getSchemaReadiness()` / `getRpcReadiness()` — required-table /
  required-RPC subsets wrapped in a `DryRunReport`.
- `getWriteReadiness()` — aggregates `WRITE_RPC_METADATA` +
  `list_write_rpc_readiness` RPC result; `writesEnabled` is always `false`
  in this phase.
- `health()` unchanged.
All methods are inert in demo mode and return `ServiceResult` envelopes.
