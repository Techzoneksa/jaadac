# JAAD CLOUD — Purchase Invoices Foundation

Phase 2.1.5 introduces a demo-only purchase invoices module. No backend
write logic is added; the schema is local-storage / `LocalStorageDataAdapter`
only.

## Data model

```ts
type PurchaseInvoiceStatus =
  | "draft" | "approved" | "partially_paid" | "paid" | "cancelled";

interface PurchaseInvoiceLine {
  id: ID; item_id?: ID; description: string;
  qty: number; unit_cost: number; vat_rate: number;
}

interface PurchaseInvoice {
  id: ID; tenant_id?: ID; number: string;
  supplier_id: ID; supplier_ref?: string;
  date: string; due: string;
  lines: PurchaseInvoiceLine[];
  notes?: string;
  status: PurchaseInvoiceStatus;
  paid: number;
}
```

Stored on `State.purchase_invoices` and persisted under the existing
`jaad_state_v2` localStorage key. Existing saves are merged forward
safely via the `load()` defaulting logic.

## Numbering

`PINV-NNNN`, scoped per tenant, derived through `PurchaseInvoiceService.nextNumber()`
(reuses the generic `nextNumber()` helper from the store).

## Totals

`purchaseDocTotals(lines)` returns `{ sub, vat, total }`. There is no
document-level discount on purchase invoices in this phase (line-level
unit_cost handles supplier-side discounts).

## Service

`src/lib/services/index.ts → PurchaseInvoiceService`

- `list`, `getById`, `create`, `update`, `archive`, `delete` (generic CRUD)
- `nextNumber(tenantId?)`
- `setStatus(id, status)`
- `approve(id)` — sets status `approved`
- `cancel(id)` — sets status `cancelled`
- `recordPayment(id, amount)` — increments `paid`, transitions status to
  `partially_paid` / `paid` when crossing thresholds
- `validate(p, existing?)` — bilingual validation

## Routes

- `/invoices/purchases` — list
- `/invoices/purchases/new` — create
- `/invoices/purchases/$id/edit` — edit

## Permissions

Reuses existing `invoices.view` and `invoices.create`. Sales role does
not have `invoices.create`, so the New button is hidden for them.

## Accounting

This phase intentionally does NOT auto-post a journal entry for an
approved purchase invoice. Purchase payments still flow through the
existing `Payment` voucher path (which posts a journal via
`AccountingEngine.postPayment`). A dedicated purchase-side posting will
be introduced in a later phase.

## Backend roadmap (not in this phase)

When Lovable Cloud backend writes are enabled, the equivalent schema
would be:

```sql
create table public.purchase_invoices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  number text not null,
  supplier_id uuid not null references public.suppliers(id),
  supplier_ref text,
  date date not null,
  due date not null,
  notes text,
  status text not null default 'draft',
  paid numeric(14,2) not null default 0,
  unique (tenant_id, number)
);
create table public.purchase_invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.purchase_invoices(id) on delete cascade,
  item_id uuid references public.items(id),
  description text not null,
  qty numeric(14,4) not null check (qty > 0),
  unit_cost numeric(14,4) not null check (unit_cost >= 0),
  vat_rate numeric(5,2) not null default 0
);
-- Followed by GRANT + RLS following the same tenant pattern as sales invoices.
```

These migrations are NOT applied yet. Tracking in the backend schema
plan as deferred work.

## Demo data

Three seed records in `src/lib/store.ts → initial.purchase_invoices`:

- `PINV-0001` — supplier s1, status approved
- `PINV-0002` — supplier s2, status paid
- `PINV-0003` — supplier s4, status draft

These are restored by Reset Demo and included in the localStorage
defaults.
