# Phase 2.1.12 — Final Report

**Status:** JAAD CLOUD Phase 2.1.12 Reports Center Redesign & Report Library Foundation is **Ready**.

## What shipped

- New `/reports` Reports Center with category tabs, search, status filters, KPI snapshot, and a "Most used" pinned section.
- 11 dedicated report pages with a consistent `ReportShell` layout (breadcrumb, header, filter bar, disabled Export/Print).
- Pure report builders in `src/lib/services/reports.ts` (P&L, Balance Sheet, Cash Flow, Trial Balance, General Ledger, VAT, Sales by Customer/Product, Aged invoices).
- Empty-state, search, filters, and permission-aware card visibility.
- Old `/reports-center` route removed; sidebar and command-palette links updated.

## Constraints respected

- `DATA_MODE = demo`, `BACKEND_WRITES_ENABLED = false` — unchanged.
- No backend writes, no schema changes, no secrets.
- No edits to existing accounting / journal validation / invoice flows.
- Reports are read-only, adapter-pure.

## Known limitations

- Foundation/Coming-soon cards intentionally do not open new pages — labeled clearly.
- PDF Export and Print are placeholders.
- Sales by Project / Cost Center, and purchase-side reports, ship as foundation cards until project & purchase-invoice domains expose the required linkage.
- Cash Flow classification is heuristic-based on counter-account `cash_flow` tag.
