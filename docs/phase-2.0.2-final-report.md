# JAAD CLOUD — Phase 2.0.2 Final Report

**Phase:** Chart Account Purpose Mapping & RPC Readiness Checks
**Status:** Ready
**Backend writes:** still disabled (`BACKEND_WRITES_ENABLED = false`)
**Data mode:** `demo` (unchanged)

## 1. Migration file created
- `supabase/planned-migrations/007_chart_account_purposes.sql`
  - `chart_account_purposes` table + `unique (tenant_id, purpose)` + check
    constraint enumerating the 9 allowed purposes.
  - GRANTs to `authenticated` and `service_role`; RLS enabled.
  - Policies: `cap_member_select`, `cap_owner_accountant_write`.
  - `updated_at` trigger.
  - `_jaad_seed_default_purpose_mappings(tenant)` helper.
  - Replaces `_jaad_get_account` with mapping-first lookup.
  - Replaces `validate_tenant_account_setup`, `validate_numbering_setup`,
    `list_write_rpc_readiness` with structured JSON envelope.
  - Replaces `bootstrap_tenant_for_user` to seed default purpose mappings.

> The runnable copy under `supabase/migrations/` will be added when Lovable
> Cloud is enabled (the migration tool is currently unavailable). The
> `planned-migrations` copy is the source of truth in the meantime.

## 2. Account purpose mapping behavior
9 purposes: `cash`, `bank`, `accounts_receivable`, `vat_input`, `vat_payable`,
`revenue`, `expense`, `inventory`, `accounts_payable`. Each tenant can override
the account chosen per purpose. Lookup order:

1. `chart_account_purposes` for `(tenant_id, purpose)`.
2. Canonical code fallback (kept for demo/default tenants only).
3. Otherwise raise `missing_account:<purpose>` with `errcode='P0002'`.

## 3. `_jaad_get_account` updates
- Mapping-first lookup.
- Controlled canonical fallback (codes: 1000 cash, 1100 bank, 1200 AR,
  2100 AP, 1300 input VAT, 2300 VAT payable, 4000 revenue, 5000 expense,
  1400 inventory).
- Never silently posts to a wrong account.

## 4. Seed / bootstrap updates
- `bootstrap_tenant_for_user` calls `_jaad_seed_default_purpose_mappings`
  after the default chart accounts are created (and also on the `reused`
  branch — idempotent).
- The migration's tail loop seeds mappings for every existing tenant once,
  so older seed data (`supabase/seed.sql`) gets covered automatically.

## 5. Readiness RPCs added
- `validate_tenant_account_setup(tenant) → jsonb { ok, purposes, mapped[],
  fallback[], missing[], checks[], warnings[], errors[] }`
- `validate_numbering_setup(tenant) → jsonb { ok, has_settings_row,
  doc_types[], missing_sequences[], checks[], warnings[], errors[] }`
- `list_write_rpc_readiness() → jsonb { ok, rpcs[{name, available, roles}],
  numbering_strategy, account_lookup_strategy, mapping_table,
  writes_enabled_default, warnings[], errors[] }`
- All three are read-only and tenant-member-gated.

## 6. FutureBackendDataAdapter readiness updates
- Adapter version bumped to `0.5.0-purpose-mapping`.
- `REQUIRED_ACCOUNT_PURPOSES` static (9 purposes).
- `getWriteRpcReadinessMetadata()` — pure metadata, no network.
- `getWriteRpcReadiness()` → `list_write_rpc_readiness` RPC.
- `getAccountPurposeReadiness()` → `validate_tenant_account_setup` RPC.
- `getNumberingReadiness()` → `validate_numbering_setup` RPC.
- All three return `not_configured` when backend env is missing, and
  `permission_denied` when there is no session / active tenant — they NEVER
  call a write RPC.

## 7. System data mode updates (`/system-data-mode`)
- **Backend Write Readiness** panel now shows: mapping table, required
  purposes count, mapped / fallback / missing counts, settings_numbering
  presence, write RPCs available count.
- Adds **Run Write Readiness Checks** button (read-only, safe when backend
  is not configured).
- Renders per-purpose status table after a check run.

## 8. Data integrity updates (`/data-integrity`)
- Added local equivalent: "Default account purposes available (purpose
  mapping equivalent)" — passes when canonical codes for each purpose exist
  in the demo chart of accounts; warns/fails otherwise. Does not break
  existing demo data.

## 9. Docs updated
- `docs/backend-write-rpc-plan.md` — Phase 2.0.2 section.
- `docs/supabase-setup.md` — mapping table + readiness RPC notes.
- `docs/phase-2.0.2-final-report.md` — this file.

## 10. Demo regression
Without Supabase env (default state):
- App loads, `DATA_MODE === "demo"`, `BACKEND_WRITES_ENABLED === false`.
- Mock Owner auto-login works.
- Dashboard, quotations → invoice → issue → receipt flow all work on
  the LocalStorage adapter.
- Audit log, data integrity (with new check), system data mode work.
- "Run Write Readiness Checks" stays safely disabled with the
  "backend not configured" notice.
- Demo reset works.

## 11. Build result
Auto-typecheck + build on save; no new errors. Source builds clean.

## 12. Known limitations
- The runnable migration file under `supabase/migrations/` cannot be created
  in this session (the migration tool is unavailable until Lovable Cloud is
  enabled). The planned migration is shipped at
  `supabase/planned-migrations/007_chart_account_purposes.sql` and will be
  applied verbatim once Cloud is enabled.
- No backend write is ever invoked from the UI. The readiness functions
  exist as plain Postgres functions; they will only return real data once
  the migration is applied to a live Supabase project.

## Final status
**JAAD CLOUD Phase 2.0.2 Chart Account Purpose Mapping & RPC Readiness
Checks is Ready.**
