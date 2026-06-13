# JAAD CLOUD — Phase 1.5 Final Report

Product: **JAAD CLOUD / جاد كلاود**
Scope: Backend schema, API contracts, security model, migration mapping, adapter plan, risks.
Backend connection: **not performed** (planning only, per scope).

## Docs created
- `docs/backend-schema-plan.md` — 24 tables, conventions, indexes, delete/archive rules.
- `docs/security-permissions-plan.md` — RLS pattern, role matrix, tenant invariants.
- `docs/api-contracts.md` — `ServiceResult`-shaped contracts for every UI flow.
- `docs/migration-plan.md` — LocalStorage → Postgres mapping + import order + risks.
- `docs/backend-adapter-plan.md` — per-method plan for `FutureBackendDataAdapter`.
- `docs/phase-1.5-final-report.md` — this file.

## Schema plan summary
All V1 entities mapped to tenant-scoped Postgres tables with `numeric(14,2)` money, `numeric(14,3)` quantity, UUID PKs, soft-archive defaults, append-only audit, idempotent journal entries via `(source_type, source_id)` unique index, posted-entry immutability via trigger.

## API contracts summary
TanStack `createServerFn` for all app-internal endpoints; `/api/public/*` reserved for verified webhooks. Every response is `ServiceResult<T>`; lists return `PaginatedResult<T>`; validation returns bilingual `ValidationError[]`. Endpoint groups: auth, tenants, customers, suppliers, items, quotations, invoices, receipts, payments, accounting (accounts + journal), tasks, reports, audit, system.

## Migration plan summary
Snapshot exported via `system.exportSnapshot()` from `LocalStorageDataAdapter`. Import order: tenants → profiles/memberships → settings → chart accounts → customers/suppliers/items → quotations → invoices → receipts → payments → journal → tasks → audit. Two-pass for self-referential chart accounts. Pre-flight + post-import integrity scan via `/data-integrity`.

## Security plan summary
Roles in dedicated `user_roles` table (per project rule), accessed via SECURITY DEFINER `has_role()` to avoid recursive RLS. Every business table: select policy = tenant membership; write policy = role check. Mandatory `GRANT` block per table for `authenticated` + `service_role`. Active tenant via JWT claim. Posted journal + issued invoices locked at DB-trigger level.

## Backend adapter plan summary
`FutureBackendDataAdapter` will route every method to a typed server fn, map errors with a single `mapError()` helper, paginate with `range + count:'exact'`, defer realtime in favor of TanStack Query invalidation, and refuse silent demo fallback.

## Main production risks (see migration-plan + security-plan)
- Tenant data leakage if RLS missing on any table — mitigation: required `enable RLS + GRANTs` checklist per migration.
- Duplicate document numbers under concurrency — mitigation: `(tenant_id, number)` unique + numbering in transaction.
- Unbalanced journal entries — mitigation: app + DB trigger checks.
- Invoice edits after issue — mitigation: status trigger.
- Receipt overpayment — mitigation: server-side balance check.
- Role bypass via direct routes — mitigation: RLS + server-fn `has_role` gate (UI `PermissionGate` is UX only).
- Migration FK orphans — mitigation: pre-flight + post-import integrity scan.
- Timezone drift — mitigation: store `date` as `date`, default tenant TZ `Asia/Riyadh`.
- VAT rounding — mitigation: `numeric(14,2)` + server-side `docTotals`.
- Demo vs production confusion — mitigation: `is_demo` tenant flag + `DATA_MODE` lock.

## Known limitations
- No real backend code written; this phase is documentation only.
- Realtime, optimistic updates, and conflict resolution deferred.
- Password migration requires user-facing reset flow (no plaintext migration).
- Attachments and migration snapshots are placeholder tables.

## Phase 1.5 readiness
**JAAD CLOUD Phase 1.5 Backend Schema & API Contract Planning is Ready ✅**
