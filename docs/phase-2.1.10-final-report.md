# Phase 2.1.10 — Hierarchical Chart of Accounts Redesign — Final Report

## Chart redesign result
Replaced the flat 2-column chart view with a sticky-header tree-grid at
`/accounting/chart`. Header / group / posting rows are visually distinct, and
the whole experience is RTL/LTR aware. JAAD CLOUD identity preserved — no
Wafeq/competitor styling copied.

## Hierarchical tree result
Four-level seed (Class → Group → Sub-group → Posting). `buildChartTree` +
`flattenChartTree` + `openIds` set drive expand/collapse. Active search
auto-expands every matching path.

## Columns result
Account name (indented + folder/dot icon), Code, Cash flow, Payment enabled,
Purpose chip, Account type, Status, Lock + actions.

## Locked system account result
Locked rows carry the `locked: true` flag, show a `Lock` icon, and the editor
gates the protected fields (code, class, kind). Delete is rejected with a
toast for any locked row.

## Add/edit UX result
Right-side `Sheet` (not a heavy dialog). Pre-fills `type` and `cash_flow`
from the chosen parent. Validation: required code/name, no duplicate code.

## Search/filter result
Text search (code / AR / EN / purpose / class), class dropdown, posting-only
switch, expand-all / collapse-all toolbar buttons.

## Purpose mapping result
All 16 canonical purposes wired into the editor and rendered as class-tinted
chips. Aligns with `chart_account_purposes`.

## Permissions result
`accounting.view` gates the page. `accounts.manage` gates the
add/edit/delete actions. Locked accounts are protected for every role.

## Services/data updates
- Extended `Account` type with `kind`, `cash_flow`, `payment_enabled`,
  `purpose`, `currency`, `locked`, `notes`.
- Added `src/lib/accounting/chart-tree.ts` with helpers.
- Expanded demo seed to a realistic Saudi-friendly hierarchy while
  preserving every account ID that the demo journal entries reference.

## System/checklist updates
- `/demo-checklist` extended with the Phase 2.1.10 group.
- Docs: `docs/chart-of-accounts-redesign.md`,
  `docs/phase-2.1.10-final-report.md`.

## Demo regression result
- Dashboard, quotations, invoices (sales/purchases), receipts, payments,
  journal entries unchanged — all reference the preserved account IDs.
- Demo reset still seeds the new hierarchy.

## Build result
TypeScript: clean. No new lint warnings introduced.

## Known limitations
- No drag-to-reparent (move via editor).
- No CSV/PDF export from this page yet.
- Currency is free-text (SAR default).
- Opening-balance edits remain in the opening-balance workflow.

## Final status
**JAAD CLOUD Phase 2.1.10 Hierarchical Chart of Accounts Redesign is Ready.**
