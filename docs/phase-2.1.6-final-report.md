# JAAD CLOUD — Phase 2.1.6 Final Report

**Phase:** Product Modules Navigation & Roadmap Alignment

## What changed

### Sidebar / module organization
- Sidebar rebuilt with collapsible, permission-filtered groups:
  Overview · Sales · Purchases · Invoicing · Accounting · Inventory ·
  Reports · Data & Integrations · Future Modules · Settings & Admin.
- Each foundation/planned item shows a colored status dot (blue =
  foundation, purple = planned, amber = coming-soon).
- Active route auto-expands its parent group.
- Empty groups (no permissions) hide entirely.

### Active modules confirmed
Dashboard, Customers, Suppliers, Items, Quotations, Sales Invoices,
Receipts, Payments, Chart of Accounts, Journal Entries, Reports,
Reports Center, Tasks, Settings, Audit Log, Permission Check, Demo Flow.

### Foundation modules added
`/sales-orders`, `/purchase-orders`, `/credit-notes`, `/debit-notes`,
`/cost-centers` (with local-only CRUD), `/inventory` (tabs:
locations / delivery & receipt notes / stock count), `/data-migration`,
`/template-designer` (live color preview), `/zatca` (Phase 1/2 tabs),
`/fixed-assets`.

### Planned / coming-soon modules added
`/hr`, `/bank-reconciliation`, `/integrations` (Zid / Salla / Foodics
cards, no secrets, no API calls).

### Product roadmap page
`/product-roadmap` — Owner-only, groups every module by status
(Active / Foundation / Planned / Coming later) with bilingual labels
and status chips.

### Shared component
`src/components/ModuleFoundationPage.tsx` — bilingual title, description,
status chip, "Available now" and "Coming later" lists, footer note.
Used by every new placeholder page for consistency.

### Permissions updated
Added: `sales_orders.*`, `purchase_orders.*`, `purchase_invoices.*`,
`credit_notes.*`, `debit_notes.*`, `cost_centers.*`, `inventory.*`,
`data_migration.view`, `integrations.view`, `templates.view`,
`zatca.view`, `hr.view`, `fixed_assets.view`, `roadmap.view`.

Role grants:
- Owner — all.
- Accountant — purchase invoices, foundation reads for accounting-side
  modules, ZATCA, fixed assets foundation.
- Sales — sales orders + templates view.
- Viewer — read-only across all foundation modules.

`PermissionGate` works unchanged. Sidebar filters by `can(perm)`.

### System / checklist updates
- `/system-data-mode` and `/demo-checklist` — no schema change needed;
  Phase 2.1.6 group of items is documented here and in
  `docs/product-modules-map.md`.
- `DATA_MODE` remains `demo`.
- `BACKEND_WRITES_ENABLED` remains `false`.

### Docs updated
- `docs/product-modules-map.md` — new
- `docs/product-roadmap.md` — new
- `docs/phase-2.1.6-final-report.md` — this file

## Demo regression
- App loads normally.
- Demo Owner auto-login works.
- Quotation → invoice → issue → receipt flow still works.
- Existing reports work.
- Audit log works.
- Data integrity works.
- System data mode works.
- Demo reset works.
- New foundation/roadmap pages render and respect permissions.
- RTL/LTR toggle works (groups + items relocalize).

## Build
Clean. Only new files added under `src/routes/*` and
`src/components/ModuleFoundationPage.tsx`; `src/components/layout/Sidebar.tsx`
rewritten; `src/lib/auth.tsx` extended (permissions only).
No backend migrations.

## Known limitations
- Foundation pages intentionally have no business logic beyond
  cost-centers local CRUD and template-color preview.
- Credit / debit notes do NOT post accounting reversals.
- Integrations do NOT make any external calls and do NOT store secrets.
- ZATCA Phase 2 is placeholder only.
- HR, payroll, depreciation, and bank reconciliation are pre-implementation.
- Sidebar groups use simple expand/collapse (no shadcn `<SidebarProvider>`
  refactor) to preserve the existing AppShell layout.

## Final status

**JAAD CLOUD Phase 2.1.6 Product Modules Navigation & Roadmap Alignment is Ready.**
