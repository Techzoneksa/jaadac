# JAAD CLOUD — Bank Accounts Foundation (Phase 2.1.9)

Status: Foundation · Demo-only · Last update: 2026-06-13

## Purpose

Give the business a structured place to define its bank, cash, and petty-cash accounts ahead of full bank-reconciliation work. This phase only covers the master-data side — no live bank feeds, no automatic reconciliation engine, no journal posting from bank accounts.

## Route

`/bank-accounts` — gated by `bank_accounts.view`.
Create / edit / delete actions require `bank_accounts.manage`.

## Data model (local-only)

`src/lib/quick-create/local-entities.ts → BankAccount`

| Field | Type | Notes |
|---|---|---|
| `id` | string | uid |
| `name_ar`, `name_en` | string | bilingual name |
| `type` | `bank` \| `cash` \| `petty_cash` | controls which extra fields are enabled |
| `bank_name` | string? | only for `bank` |
| `account_number` | string? | only for `bank` |
| `iban` | string? | placeholder, no validation |
| `currency` | string | defaults to `SAR` |
| `opening_balance` | number | demo, shown as "Balance (demo)" |
| `status` | `active` \| `inactive` | |
| `notes` | string? | |
| `created_at` | ISO string | server timestamp not used |

Persistence: `localStorage` key `jaad_bank_accounts_v1`. **Not** part of `src/lib/store.ts` so existing demo reset is untouched. Records are user-scoped to the browser only.

## Services

- `BankAccountService.list()` — read all
- `BankAccountService.create(input)` — adds + emits change
- `BankAccountService.update(id, patch)`
- `BankAccountService.remove(id)`
- `useBankAccounts()` — `useSyncExternalStore` hook for reactive reads

## UI

- List page (`src/routes/bank-accounts.tsx`) with table: name · type · bank · currency · balance · status · row actions.
- Empty state with primary action button.
- Page-level "+ Bank account" button + Quick-Create dialog reused from the topbar Quick Create menu.

## Permissions

| Permission | Role assignments |
|---|---|
| `bank_accounts.view` | Owner, Accountant, Viewer |
| `bank_accounts.manage` | Owner, Accountant |

Sales role: no access (no bank-account responsibility).

## Out of scope (later phases)

- Linking receipts (RV-xxxx) and payments (PV-xxxx) to a chosen bank account.
- Posting bank-account opening balances into the chart of accounts.
- Live bank feeds / Open Banking integrations.
- Bank reconciliation engine.
- Multi-currency balance conversion.
- Tenant scoping (currently per-browser, no `tenant_id`).
