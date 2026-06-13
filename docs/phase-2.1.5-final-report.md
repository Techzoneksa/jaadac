# JAAD CLOUD — Phase 2.1.5 Final Report

**Phase:** Document Create/Edit Pages UX Refactor
**Product:** JAAD CLOUD / جاد كلاود
**DATA_MODE:** demo (unchanged)
**BACKEND_WRITES_ENABLED:** false (unchanged)

## Routes added

- `/quotations/new`, `/quotations/$id/edit`
- `/invoices/sales` (list), `/invoices/sales/new`, `/invoices/sales/$id/edit`
- `/invoices/purchases` (list), `/invoices/purchases/new`, `/invoices/purchases/$id/edit`
- `/invoices` now redirects to `/invoices/sales`
- `src/routes/quotations.tsx` and `src/routes/invoices.tsx` converted
  into pathless layout files (each renders `<Outlet />`); their original
  list bodies moved to `*.index.tsx` siblings.

## Modals replaced

- Quotation create/edit dialog → full page editor.
- Sales invoice create/edit dialog → full page editor.
- Purchase invoices: no modal existed; created full-page editor from the
  start.
- Quotation **View** modal preserved on the list page (view-only is
  outside the scope of the no-modal-for-create/edit rule).

## Quotation page result

`QuotationEditor` covers number, status, customer, dates, line items
(via `LineItemsEditor`), notes, terms, and totals. Actions: Save Draft,
Save, Send to customer, Mark accepted, Convert to sales invoice (jumps
to the new sales-invoice edit page), Preview, Print. Convert delegates
to the existing `QuotationService.convertToInvoice` to keep workflow
parity with the previous modal.

## Sales invoice page result

`SalesInvoiceEditor` covers number, status, customer, date, due date,
line items, notes, terms, plus a Totals Summary (Total / Paid / Remaining)
in edit mode. Actions: Save Draft, Save, Send to customer, Issue
(auto-posts the journal via `InvoiceService.issue`), Record Payment
(deep-links to /receipts), Print. Issued/partially-paid/fully-paid
invoices are read-only via a `locked` flag wired through `disabled`
props on every input and a `fieldset` around the line editor.

## Purchase invoice foundation result

Demo-only foundation:

- Types: `PurchaseInvoice`, `PurchaseInvoiceLine`, `PurchaseInvoiceStatus`.
- Store: `State.purchase_invoices` + safe merge in `load()` + three demo
  seed records.
- Helper: `purchaseDocTotals(lines)`.
- Service: `PurchaseInvoiceService` (CRUD, `nextNumber`, `setStatus`,
  `approve`, `cancel`, `recordPayment`, `validate`).
- UI: list page, create page, edit page, plus a purchase-flavored line
  editor with `unit_cost`.
- Approved/partially_paid/paid invoices are read-only (lock rules).
- No backend writes. No accounting auto-post yet (documented as
  deferred — `docs/purchase-invoices-foundation.md`).

## Components created

- `src/components/documents/DocumentEditorLayout.tsx` —
  `DocumentEditorLayout` + `DocumentSection` shells.
- `src/components/documents/PurchaseLineItemsEditor.tsx`
- `src/components/documents/QuotationEditor.tsx`
- `src/components/documents/SalesInvoiceEditor.tsx`
- `src/components/documents/PurchaseInvoiceEditor.tsx`

Existing `LineItemsEditor` reused for quotation + sales invoice. Further
extraction (HeaderActions, PartyCard, DatesCard, NotesTerms, PreviewPanel)
intentionally deferred — see "Known limitations".

## Services / data added

- `purchaseDocTotals` in `src/lib/store.ts`.
- `PurchaseInvoiceService` in `src/lib/services/index.ts`.
- `State.purchase_invoices` field + seed + safe migration in `load()`.
- `StatusBadge` styles for `approved` and `paid`.
- i18n keys: `sales_invoices`, `purchase_invoices`, `new_quotation`,
  `edit_quotation`, `new_sales_invoice`, `edit_sales_invoice`,
  `new_purchase_invoice`, `edit_purchase_invoice`, `save_draft`, `back`,
  `approve`, `approved`, `record_payment`, `supplier_invoice_ref`,
  `unit_cost`, `document_info`, `party_info`, `dates`, `line_items`,
  `totals_summary`, `notes_terms`, `attachments_placeholder`, `not_found`.
- Sidebar: replaced single `Invoices` entry with `Sales Invoices` +
  `Purchase Invoices` entries.

## Permissions / validation status

- No new permissions added. Reused: `quotations.view`/`manage`,
  `invoices.view`/`create`/`issue`.
- `PermissionGate` guards each new/edit page.
- Validation: `ValidationService.quotation`, `ValidationService.invoice`
  (existing) and `PurchaseInvoiceService.validate` (new) — all bilingual.
- Locked-after-issue / locked-after-approve rules enforced at the form
  level via `disabled` props.

## System / checklist updates

- `/demo-checklist` gained a Phase 2.1.5 group with 16 items.
- `/system-data-mode` not touched in this phase (no backend changes).
- Data integrity / migration snapshot will pick up the new
  `purchase_invoices` array automatically through the generic adapter
  state path.

## Demo regression

- App loads normally on `/`, `/quotations`, `/invoices`,
  `/invoices/sales`, `/invoices/purchases`.
- DATA_MODE remains `demo`.
- BACKEND_WRITES_ENABLED remains `false`.
- Mock Owner demo auto-login still works.
- Quotation → invoice → issue → receipt flow works in demo via the new
  page (Convert button deep-links to the new sales-invoice edit page).
- Issued invoices remain locked (every input disabled, save rejected).
- Receipt flow untouched — still applies via existing `ReceiptService`.
- Purchase invoice create / approve / record-payment works in demo.
- Audit log, data integrity, /system-data-mode, demo reset all still
  functional.
- RTL/LTR switching unaffected (uses the same `useI18n` provider).

## Build result

Clean. New routes return HTTP 200 from the dev server; no TypeScript
errors after the store schema extension.

## Known limitations

- The View dialog on the quotations list is preserved as a view-only
  modal (allowed per spec — only create/edit modals were forbidden).
- Reusable component set is deliberately small: `DocumentEditorLayout`,
  `DocumentSection`, per-document editor, per-document line editor.
  Smaller sub-components (`DocumentHeaderActions`, `DocumentPartyCard`,
  `DocumentDatesCard`, `DocumentNotesTerms`, `DocumentPreviewPanel`)
  were deferred to avoid over-abstraction — the editor components are
  short enough that extraction would hurt readability.
- Purchase invoices have no auto journal posting on approve. Payment
  posting still flows through the existing `Payment` voucher path.
- "Record Payment" uses `window.prompt` as a placeholder; replace with a
  proper dialog when the purchase payments module ships.
- No backend table for purchase invoices yet. Migration outline lives in
  `docs/purchase-invoices-foundation.md` under "Backend roadmap".

## Final status

**JAAD CLOUD Phase 2.1.5 Document Create/Edit Pages UX Refactor is Ready.**
