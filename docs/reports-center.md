# JAAD CLOUD — Reports Center

The Reports Center (route `/reports`) is the single hub for all
financial, operational, and tax reports. It is read-only, demo-safe,
and operates entirely from the active DataAdapter (no backend writes).

## Categories

- **Financial** — Profit & Loss, Balance Sheet, Cash Flow, Trial Balance, General Ledger, Account Statement
- **Sales** — Sales by Customer / Product / Project / Cost Center, Unpaid & Overdue Sales Invoices
- **Purchases** — Purchases by Supplier / Product, Purchase Invoice Statement, Unpaid & Overdue Purchase Invoices
- **Tax** — VAT Report, VAT Detailed, Tax Summary
- **Inventory** — Inventory Movement, By Warehouse, Monthly Summary
- **Cost Centers & Projects** — Revenue / Expenses by Cost Center & Project
- **Payroll & HR** — Payroll Summary, Employee Statement, Employee Claims
- **Management** — Management PDF, Cash Forecast, Business Health Summary

## Statuses

- **Available** — fully implemented and routed to a dedicated report page
- **Foundation** — UI scaffold exists; uses safe demo data where possible, otherwise placeholder. Calculations and richer filters land in later phases.
- **Coming Soon** — disabled card, no route opened

## Available report pages

`/reports/profit-loss`, `/reports/balance-sheet`, `/reports/cash-flow`,
`/reports/trial-balance`, `/reports/general-ledger`,
`/reports/account-statement`, `/reports/vat`,
`/reports/sales-by-customer`, `/reports/sales-by-product`,
`/reports/unpaid-sales-invoices`, `/reports/overdue-sales-invoices`.

## Architecture

```
UI route (/reports/*) → ReportShell → buildXxxReport()
                                      ↓
                              useStore (read-only)
                                      ↓
                            LocalStorageDataAdapter
```

All report builders live in `src/lib/services/reports.ts` as pure
functions over the in-memory store snapshot. UI components never
mutate state. Builders accept a `DateRange` (`{ from?, to? }`) and
return typed rows.

## Demo data

Reports compute from existing demo data (invoices, receipts,
payments, journal entries, accounts, customers, items, suppliers).
Default fiscal range is **2026-01-01 → 2026-06-30** in SAR with VAT
at 15%.

## Export / Print

Export and print are exposed in every report header but disabled in
this phase — labeled "Export coming soon" / "Print coming soon".
Implementation lands in a later phase that handles PDF rendering.

## Permissions

`reports.view` gates the whole reports tree. Payroll/HR reports are
additionally gated by `hr.view`. Cards the user can't access are
hidden from the grid entirely.

## Empty states

Every report page shows a consistent empty state with a "Clear
filters" action when filters return no rows, and a "Create invoice"
or "Record receipt" CTA on receivables reports when relevant.
