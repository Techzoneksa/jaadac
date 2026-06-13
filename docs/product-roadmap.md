# JAAD CLOUD — Product Roadmap

See live roadmap inside the app at `/product-roadmap` (Owner only).

## Active now
Dashboard · Customers · Suppliers · Products & Services · Quotations ·
Sales Invoices · Receipts · Payments · Chart of Accounts · Journal Entries ·
Reports · Tasks · Settings · Audit Log · Permissions · Demo Flow.

## Foundation now
Purchase Invoices · Sales Orders · Purchase Orders · Credit Notes ·
Debit Notes · Cost Centers · Inventory · Data Migration ·
Template Designer · ZATCA · Fixed Assets.

## Planned
HR / Payroll · Bank Reconciliation · Integrations (Zid / Salla / Foodics).

## Coming later
- Advanced inventory & full costing
- Full purchase accounting
- Cost accounting reports
- 40+ specialized reports
- Real email / WhatsApp sending
- Live Zid / Salla / Foodics integrations
- ZATCA Phase 2 e-invoicing
- Full payroll engine
- Fixed asset depreciation engine
- Multi-organization production operations

## Why heavy modules are deferred
- They require backend writes which are intentionally disabled
  (`BACKEND_WRITES_ENABLED = false`, `DATA_MODE = demo`).
- ZATCA Phase 2 requires formal compliance setup, certificates, and
  third-party clearance — out of scope until that infrastructure is in place.
- Payroll, depreciation, and inventory costing require deep accounting
  flows that should not be shipped half-built.
- Integrations require OAuth flows and secret storage; placeholders only.

## What was intentionally NOT implemented this phase
- No real CSV import execution.
- No external API calls to Zid / Salla / Foodics.
- No credit/debit note accounting reversals.
- No payroll engine, no depreciation, no bank feeds.
- No new backend migrations (schema unchanged).
