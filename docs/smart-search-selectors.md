# Smart Search & Recent Suggestions — Phase 2.1.8

## Overview
Phase 2.1.8 replaces flat `<Select>` dropdowns with smart AJAX-style search
comboboxes on document forms. Empty searches surface the user's
most-recently / most-frequently used records as suggestions.

All persistence flows through the existing service / adapter layer. No
backend writes are introduced. `DATA_MODE` remains `demo` and
`BACKEND_WRITES_ENABLED` remains `false`.

## Components

| Component | Used For |
|-----------|----------|
| `SmartEntityCombobox` | Generic, reusable shell (debounce, keyboard nav, suggestion header, RTL/LTR). |
| `SmartCustomerSelect` | Customer pickers across quotations, invoices, receipts. |
| `SmartSupplierSelect` | Supplier pickers across purchase invoices and payment vouchers. |
| `SmartItemSelect` | Product / service picker inside line-item editors (sales + purchase). Auto-fills description, unit price/cost, VAT %. |
| `SmartInvoiceSelect` | Invoice picker for receipts (unpaid-first ordering) and any future settlement flows. |

All wrappers live under `src/components/smart-select/`.

## Service layer

`src/lib/services/smart-search.ts`:
- `CustomerSearchService.searchSmart(query, options)`
- `SupplierSearchService.searchSmart(query, options)`
- `ItemSearchService.searchSmart(query, options)`
- `InvoiceSearchService.searchSmart(query, options)` (supports `customerId` filter + `unpaidFirst`)

Adapter purity is preserved: UI → Smart wrapper → `*SearchService` →
`CustomerService` / etc. → `getAdapter()` → `LocalStorageDataAdapter` →
store. UI components never call `useStore.setState` directly.

## Usage tracking

`src/lib/usage-tracking.ts` exposes `UsageTrackingService`:
- `recordSelection(entity, id)` — called by every smart wrapper when a value is chosen.
- `getSuggestions(entity, limit)` — ordered by `(count desc, last_at desc)`.
- `reset()` — wired into `SettingsService.resetDemo()` so demo reset clears it.
- `exportSnapshot()` / `importSnapshot()` — future-ready hooks for migration snapshot include.

Storage key: `jaad.usage_tracking.v1` in `localStorage`. No PII is recorded
— only entity ids, counts, and timestamps.

## Fallback logic

When usage tracking has no data for an entity type, smart selectors fall
back to the most-recently created/updated records (sorted on the natural
list order). For invoice selectors with `unpaidFirst`, unpaid +
partially-paid invoices float to the top regardless of usage tracking.

## Search fields

| Entity | Search fields |
|--------|---------------|
| Customer | name (AR/EN), mobile, email, VAT |
| Supplier | name (AR/EN), mobile, email, VAT |
| Item | name (AR/EN), SKU, description, type |
| Invoice | number, date, status, amount; optional customer filter |

## UX

- Debounce 220 ms before result query runs.
- Max 6 suggestions when query is empty, max 10 results when searching.
- Keyboard: ArrowUp/Down, Enter to select, Escape to close.
- Selected value shown with primary + secondary line in the trigger.
- Clear button (× icon) hides when `allowClear={false}` (required fields).
- RTL/LTR follow the active language via `useI18n().dir`.

## Permissions

Smart selectors honour the existing per-page permission gates. The
underlying services read from the same `CustomerService` /
`SupplierService` / etc. lists already filtered by tenant. No new
permission keys were added.

## Forms updated

- `QuotationEditor` — customer field.
- `SalesInvoiceEditor` — customer field.
- `PurchaseInvoiceEditor` — supplier field.
- `LineItemsEditor` (sales lines) — item field.
- `PurchaseLineItemsEditor` (purchase lines) — item field.
- `ReceiptForm` (`/receipts`) — customer + related-invoice fields.
- `PaymentForm` (`/payments`) — supplier field.

## Known limitations

- Searches are synchronous over the demo dataset. The service surface is
  shaped so it can be promisified later without changing call sites.
- Sales orders, credit notes, and debit notes are still foundation
  modules — they will pick up smart selectors automatically when those
  editors are built.
- Usage tracking is per-browser (localStorage). Sharing usage across
  devices requires a backend table; the snapshot helpers are ready for it.

## Future backend readiness

Replace each `*SearchService.searchSmart()` body with a `fetch()` call to
a future read endpoint. The combobox already debounces and tolerates
async (loading spinner). Usage tracking can be flipped to a real table
by switching the storage implementation behind `UsageTrackingService`.
