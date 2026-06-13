# JAAD CLOUD — Document Create/Edit Pages UX

Phase 2.1.5 replaces the cramped modal dialogs for creating/editing
documents (quotations, sales invoices, purchase invoices) with full
dedicated pages.

## Routes

| Page                          | Route                              |
| ----------------------------- | ---------------------------------- |
| Quotations list               | `/quotations`                      |
| New quotation                 | `/quotations/new`                  |
| Edit quotation                | `/quotations/$id/edit`             |
| Sales invoices list           | `/invoices/sales`                  |
| New sales invoice             | `/invoices/sales/new`              |
| Edit sales invoice            | `/invoices/sales/$id/edit`         |
| Purchase invoices list        | `/invoices/purchases`              |
| New purchase invoice          | `/invoices/purchases/new`          |
| Edit purchase invoice         | `/invoices/purchases/$id/edit`     |
| `/invoices`                   | redirects → `/invoices/sales`      |

`src/routes/quotations.tsx` and `src/routes/invoices.tsx` are now
layout-only files that render `<Outlet />`. The list pages moved to
`*.index.tsx` siblings; create/edit live in their own sibling files.

## Shared building blocks

- `src/components/documents/DocumentEditorLayout.tsx`
  Page shell: title + Back button + action buttons + content grid.
- `src/components/documents/DocumentEditorLayout.tsx` → `DocumentSection`
  Card section with a small uppercase section title.
- `src/components/LineItemsEditor.tsx` (existing) — quotation / sales
  invoice line editor (unit_price + discount).
- `src/components/documents/PurchaseLineItemsEditor.tsx` — purchase line
  editor (unit_cost, no document discount).
- `src/components/documents/QuotationEditor.tsx` — quotation form body.
- `src/components/documents/SalesInvoiceEditor.tsx` — sales invoice form
  body, with locked-after-issue rules.
- `src/components/documents/PurchaseInvoiceEditor.tsx` — purchase invoice
  form body, with approved/paid lock rules.

Each editor accepts `editing: T | null` and handles both "new" and
"edit" modes from a single component.

## Page layout

```
+-------------------------------------------------------------+
| Title                                  [Back] [Send]        |
|                                        [Issue] [Print]      |
|                                        [Save Draft] [Save]  |
+-------------------------------------------------------------+
| DOCUMENT INFORMATION                                        |
|   Number   Status   Customer/Supplier                       |
+-------------------------------------------------------------+
| DATES        |  PARTY INFORMATION (purchase)                |
|   Date / Due |    Supplier select                           |
+-------------------------------------------------------------+
| LINE ITEMS                                                  |
|   [LineItemsEditor / PurchaseLineItemsEditor]               |
+-------------------------------------------------------------+
| TOTALS SUMMARY (edit mode only)                             |
|   Total | Paid | Remaining                                  |
+-------------------------------------------------------------+
| NOTES & TERMS                                               |
|   Notes textarea | Terms textarea / Attachment placeholder  |
+-------------------------------------------------------------+
```

Responsive: collapses to single column under `md`. RTL/LTR aware via the
existing `useI18n` provider.

## Permissions

Reuses existing `Permission` enum — no new permissions needed:

| Role        | Quotations    | Sales invoices         | Purchase invoices    |
| ----------- | ------------- | ---------------------- | -------------------- |
| owner       | full          | full + issue           | full + approve       |
| accountant  | full          | full + issue           | full + approve       |
| sales       | full          | create/edit (no issue) | view only (no create) |
| viewer      | view/print    | view/print             | view/print           |

Each page wraps the editor in `<PermissionGate>` so unauthorized users
land on the bilingual AccessDenied component.

## Validation

Uses the existing `ValidationService` (quotation, invoice) and a new
`PurchaseInvoiceService.validate` for purchase invoices. Errors surface
as bilingual toasts. Locked documents (issued sales invoices, approved
purchase invoices) reject saves with `err_locked`.

## Known limitations

- Quotation/sales-invoice list uses a "View" dialog that still embeds
  the print preview. That is a view-only modal, kept by design; the
  task only forbids create/edit modals.
- The reusable component set covers the practical surface area
  (`DocumentEditorLayout`, `DocumentSection`, per-document editor +
  per-document line editor). Further extraction
  (`DocumentHeaderActions`, `DocumentPartyCard`, `DocumentDatesCard`,
  `DocumentNotesTerms`, `DocumentPreviewPanel`) was deferred — the
  current shape stays small and avoids over-abstraction.
- Purchase invoice "Record Payment" uses `window.prompt` as a
  lightweight placeholder; a dedicated payment dialog will land with the
  purchase payments module.
