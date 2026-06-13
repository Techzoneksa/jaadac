# Taxes Page Foundation (Phase 2.1.14)

## Route
- `/accounting/taxes` — full Taxes management page.
- Sidebar: **Accounting → Journal Entries / Chart of Accounts / Taxes**.
- Page title: **الضرائب / Taxes**.

## Data Model
New entity `tax_rates` in `State` (demo / LocalStorage only):

```ts
TaxRate = {
  id, tenant_id?,
  name_ar, name_en,
  tax_type: "sales" | "purchases" | "reverse_charge" | "out_of_scope",
  rate: number, // 0..100
  description_ar?, description_en?,
  used_in: "sales" | "purchases" | "both",
  is_system?: boolean,
  is_active: boolean,
  notes?, created_at?, updated_at?
}
```

Seeded with Saudi VAT defaults (all `is_system: true`):
- VAT on Sales 15%, Zero-rated Exports, Exempt Sales
- Out of Scope
- VAT on Purchases 15%, Zero-rated Purchases, Exempt Purchases
- Reverse Charge 15%

## Service
`TaxRateService` exposes:
- `list / active / getById`
- `create / update / archive / remove`
- `getDefaultSalesTax / getDefaultPurchaseTax`
- `isDuplicateName / countsByType`

System rates: only `is_active`, `notes`, and descriptions are editable; `remove()` returns `false`.

UI → `TaxRateService` → `getAdapter()` (LocalStorageDataAdapter) → store.

## Permissions
- `taxes.view` — Owner, Accountant, Sales, Viewer
- `taxes.manage` — Owner, Accountant

`PermissionGate perm="taxes.view" mode="page"` gates the route; action buttons hide for non-managers.

## Invoice / Item Integration (foundation)
- Current invoice/item forms continue to use the existing `vat_rate` numeric field — backward compatible, totals unchanged.
- `TaxRateService.active()` is now available so future iterations can wire a tax-rate selector that fills `vat_rate` automatically without breaking existing journals or reports.

## Known Limitations
- Tax-rate selector inside invoice / quotation / purchase line editors not yet wired (foundation only).
- No ZATCA Phase 2 integration in this phase.
- Backend writes remain disabled (`DATA_MODE = "demo"`, `BACKEND_WRITES_ENABLED = false`).
