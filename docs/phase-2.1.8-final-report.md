# Phase 2.1.8 — Smart AJAX Search & Recent Suggestions — Final Report

## Smart selector components added
- `SmartEntityCombobox` (reusable shell)
- `SmartCustomerSelect`, `SmartSupplierSelect`, `SmartItemSelect`, `SmartInvoiceSelect`

All under `src/components/smart-select/`, exported through
`@/components/smart-select`.

## Customer search result
Live filter by name (AR/EN), mobile, email, VAT number. Empty input
shows last 6 selected (or recent fallback). Frequent items badged.
Applied to: quotations, sales invoices, receipt vouchers.

## Supplier search result
Live filter by name, mobile, email, VAT. Empty input shows last 6
suppliers. Applied to: purchase invoices, payment vouchers.

## Item search result
Live filter by name, SKU, description, type. Type/price/VAT badges in
results. Selecting auto-fills description, unit price/cost, VAT %, and
`item_id`. Applied to sales and purchase line-item editors.

## Invoice search result
Live filter by number, date, status, amount; optional customer filter.
Receipt voucher uses `unpaidFirst` ordering. Each row shows invoice
number, customer, date, status badge, remaining amount.

## Usage tracking result
`src/lib/usage-tracking.ts` stores `{ count, last_at }` per entity in
localStorage. Wired into `SettingsService.resetDemo()`. Snapshot
export/import helpers included.

## Forms updated
QuotationEditor · SalesInvoiceEditor · PurchaseInvoiceEditor ·
LineItemsEditor · PurchaseLineItemsEditor · ReceiptForm · PaymentForm.

## Services updated
- New: `CustomerSearchService`, `SupplierSearchService`,
  `ItemSearchService`, `InvoiceSearchService`, `UsageTrackingService`.
- Re-exported via `src/lib/services/index.ts`.
- Adapter purity preserved (no direct `useStore.setState` from UI).

## Permissions / RTL status
- Existing per-page `PermissionGate`s unchanged; selectors only read
  data the page is already allowed to read.
- Combobox passes `dir` to the popover content; RTL/LTR both work.
- Mobile friendly via Popover (no fixed dialog).

## Demo regression result
- DATA_MODE remains `demo`.
- BACKEND_WRITES_ENABLED remains `false`.
- Quotation → Invoice → Receipt → Journal flow unchanged.
- Demo reset additionally clears usage tracking.

## Build result
Type-checks clean after removing dead `Select` / unused imports in the
six updated forms.

## Known limitations
- Search is synchronous over demo data; promisified later for backend.
- Sales orders / credit notes / debit notes are still foundation pages.
- Usage tracking is per-browser only until backend snapshot is wired.

## Final status
**JAAD CLOUD Phase 2.1.8 Smart AJAX Search & Recent Suggestions is Ready.**
