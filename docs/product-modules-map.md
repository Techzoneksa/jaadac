# JAAD CLOUD — Product Modules Map

Phase 2.1.6 introduces a clear classification across all product modules.

## Status legend
- **Active** — fully implemented and usable in demo today.
- **Foundation** — scaffolded UI, permissions, and (sometimes) light local-only data; intentionally lacks deep business logic.
- **Planned** — placeholder card / page only; future phase.
- **Coming Soon** — visible in roadmap but no UI surface yet.
- **Requires Backend** — needs production backend writes (currently disabled).

## Sections

### Overview
- Dashboard — Active
- Tasks — Active

### Sales
- Customers — Active
- Products & Services — Active
- Quotations — Active
- Sales Orders — Foundation
- Sales Invoices — Active
- Receipts — Active

### Purchases
- Suppliers — Active
- Purchase Orders — Foundation
- Purchase Invoices — Foundation
- Payments — Active

### Invoicing
- Sales Invoices — Active
- Purchase Invoices — Foundation
- Credit Notes — Foundation
- Debit Notes — Foundation

### Accounting
- Chart of Accounts — Active
- Journal Entries — Active
- Cost Centers — Foundation (local-only CRUD)
- Bank Reconciliation — Planned

### Inventory
- Inventory (Locations / Delivery & Receipt Notes / Stock Count tabs) — Foundation

### Reports
- Reports — Active
- Reports Center — Active

### Data & Integrations
- Data Migration (CSV import scaffolds) — Foundation
- Integrations (Zid / Salla / Foodics cards) — Planned
- Template Designer (color preview) — Foundation
- ZATCA (Phase 1 readiness + Phase 2 placeholder) — Foundation

### Future Modules
- HR / Payroll — Planned
- Fixed Assets — Foundation
- Employees & Payroll (legacy demo) — Active
- Businesses & Branches — Active
- Internal Communication — Active

### Settings & Admin
- Document Templates — Active
- Custom Fields — Active
- Product Roadmap (Owner) — Active
- Settings — Active

## Routes added (Phase 2.1.6)
`/sales-orders`, `/purchase-orders`, `/credit-notes`, `/debit-notes`,
`/cost-centers`, `/bank-reconciliation`, `/inventory`, `/data-migration`,
`/integrations`, `/template-designer`, `/zatca`, `/hr`, `/fixed-assets`,
`/product-roadmap`.

## Permissions added
`sales_orders.{view,manage}`, `purchase_orders.{view,manage}`,
`purchase_invoices.{view,manage}`, `credit_notes.{view,manage}`,
`debit_notes.{view,manage}`, `cost_centers.{view,manage}`,
`inventory.{view,manage}`, `data_migration.view`, `integrations.view`,
`templates.view`, `zatca.view`, `hr.view`, `fixed_assets.view`,
`roadmap.view`.

Roles:
- **Owner** — everything.
- **Accountant** — accounting/invoices/purchases/reports/ZATCA/fixed-assets foundation.
- **Sales** — sales + customers + sales orders.
- **Viewer** — read-only across foundation modules.
