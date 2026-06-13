# Chart of Accounts — Hierarchical Tree Grid (Phase 2.1.10)

## Overview

`/accounting/chart` is now a true hierarchical **tree-grid** instead of a flat
class-grouped list. The page combines a sortable indented tree with a data
grid of accounting attributes per row.

## Top-level classes

Five system-locked headers, always present:

| Code | Arabic | English |
| --- | --- | --- |
| 1 | الأصول | Assets |
| 2 | الالتزامات | Liabilities |
| 3 | حقوق الملكية | Equity |
| 4 | الإيرادات | Revenue |
| 5 | المصروفات | Expenses |

Header rows render with a subtle class-tinted background, a folder icon, and a
bold name. They cannot be deleted.

## Hierarchy seed (demo)

The seed expands to four levels where useful, e.g. Assets → Current Assets →
Cash & cash equivalents → Cash on Hand. Each posting account carries `purpose`,
`cash_flow`, `payment_enabled`, `currency`, and `locked` attributes. IDs of
accounts referenced by existing journal entries (`a1020`, `a1030`, `a2020`,
`a4010`, `a5020`, …) are preserved.

## Columns

| Column | Source | Notes |
| --- | --- | --- |
| Account name | `name_ar` / `name_en` | Indented by `level`; folder icon for parents, dot for leaves |
| Account code | `number` | Hierarchical, e.g. `1`, `11`, `111`, `1111` |
| Cash flow | `cash_flow` | Operating / Investing / Financing / Cash / — |
| Payment enabled | `payment_enabled` | Hidden on header / group rows |
| Purpose | `purpose` | Chip tinted by class |
| Account type | `kind` | Header / Group / Posting |
| Status | `status` | Active / Inactive |
| Lock + actions | `locked`, role | Lock icon + edit / delete buttons |

## Row behavior

- **Header rows** (class) — colored background, locked, expandable.
- **Group rows** — bold-ish, expandable, may also be locked.
- **Posting rows** — selectable in journals/invoices; show purpose chips and
  the payment-enabled flag.
- **Locked rows** — show a lock icon; cannot be deleted; protected fields
  (code, class, kind, locked flag) are read-only in the editor.
- **Custom rows** — created under any non-leaf parent; fully editable.

## Search & filters

- **Search** matches code, AR name, EN name, purpose, or class. Active search
  auto-expands all matching paths.
- **Class filter** — All / Assets / Liabilities / Equity / Revenue / Expenses.
- **Posting-only** switch — hides headers and groups.
- **Expand all / Collapse all** — toolbar buttons.

## Add / edit UX

A right-side `Sheet` panel (LTR/RTL aware) — not a heavy modal. Fields:

Parent, Code*, Name AR*, Name EN, Class, Kind, Cash flow, Purpose, Currency,
Status, Payment enabled, Notes.

Validation:
- `code` and `name_ar` required.
- No duplicate `number` per tenant.
- Locked accounts: only name / notes / payment_enabled / status / currency
  editable.

## Purpose mapping

Aligns with `chart_account_purposes` canonical purposes:

`cash · bank · accounts_receivable · suppliers · inventory · fixed_assets ·
accumulated_depreciation · vat_input · vat_payable · revenue · expense ·
cost_of_sales · payroll_payable · retained_earnings · owner_equity ·
opening_balance_equity`

Each purpose renders as a chip tinted by the account's class.

## Permissions

| Role | accounts.view | accounts.manage |
| --- | --- | --- |
| Owner | ✓ | ✓ |
| Accountant | ✓ | ✓ |
| Sales | ✓ | ✗ |
| Viewer | ✓ | ✗ |

Locked accounts cannot be deleted by any role.

## Data architecture

- UI reads accounts from `useStore`.
- `src/lib/accounting/chart-tree.ts` provides `buildChartTree`,
  `flattenChartTree`, `allExpandableIds`, `ancestorIds`,
  `searchChartAccounts`, `validateAccount`.
- Mutations call `store.set(...)` with a single immutable update — same
  pattern used elsewhere in the demo.
- Backend write paths are untouched (`BACKEND_WRITES_ENABLED = false`).

## Known limitations

- No drag-to-reparent yet (move via editor instead).
- No bulk import/export (planned for later phase).
- Currency is free-text in the demo (SAR default); a managed currency
  selector lands with the multi-currency phase.
- Opening-balance editing is not exposed here; lives with the opening-balance
  workflow.
