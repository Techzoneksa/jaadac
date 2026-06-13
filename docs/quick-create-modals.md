# JAAD CLOUD — Quick Create Modals (Phase 2.1.9)

Status: Active · Demo-only · Last update: 2026-06-13

## What this is

A reusable popup pattern for **simple master-data creation** so the user does not have to navigate to a list page just to add one customer/supplier/item/etc. Heavy accounting documents (quotations, invoices, purchase invoices, etc.) intentionally **do not** use this — they remain on full pages.

## Full page vs. quick-create — rule

| Stays on a full page | Lives in a quick-create modal |
|---|---|
| Quotations (create/edit) | Customer |
| Sales Invoices (create/edit) | Supplier |
| Purchase Invoices (create/edit) | Product / Service |
| Purchase Orders | Bank Account |
| Reports, Reports Center | Cost Center |
| Settings pages | Project |
| Chart of Accounts | Branch |
| Journal Entries main page | (future) Quick employee, fixed asset, custom field |
| Bank Accounts list / Fixed Assets list | |
| Projects / Branches index pages | |

## Components

- **`QuickCreateDialog`** — the shared shell. Owns title/description, footer buttons (Cancel / Save), the optional **Save and add another** checkbox, and the size variants (`sm` / `md` / `lg`). It does not own the form fields — the caller passes them as children.
- **`QuickCreateMenu`** — the topbar entry point. Renders a "Quick Create" dropdown grouped by *Contacts / Catalog / Finance / Structure*. Items are hidden when the user lacks the `.manage` permission for that entity.
- **`QuickCreateCustomerDialog`**
- **`QuickCreateSupplierDialog`**
- **`QuickCreateItemDialog`**
- **`QuickCreateBankAccountDialog`**
- **`QuickCreateCostCenterDialog`**
- **`QuickCreateProjectDialog`**
- **`QuickCreateBranchDialog`**

All variants accept an optional `onCreated(entity)` callback so a caller (e.g. an invoice editor) can auto-select the freshly-created record.

## Behavior contract

- Bilingual labels AR / EN.
- Inline `sonner` toast on success and on validation failure.
- Audit log entry on every successful create (`AuditService.log`).
- **Service-layer only writes** — dialogs never mutate the store directly. They call `CustomerService.create`, `BankAccountService.create`, etc.
- **Save and add another:** when checked, the dialog stays open and resets the form. When unchecked, it closes on success.
- Permission-gated at the menu level (entries removed for users without `.manage`).

## Permissions

| Quick-create variant | Required permission |
|---|---|
| Customer | `customers.manage` |
| Supplier | `suppliers.manage` |
| Item | `items.manage` |
| Bank Account | `bank_accounts.manage` |
| Cost Center | `cost_centers.manage` |
| Project | `projects.manage` |
| Branch | `branches.manage` |

## Data destinations

| Variant | Storage |
|---|---|
| Customer / Supplier / Item / Branch | Main store (`src/lib/store.ts`) via existing services |
| Bank Account | Local-only (`jaad_bank_accounts_v1`) via `BankAccountService` |
| Project | Local-only (`jaad_projects_v1`) via `ProjectService` |
| Cost Center | Local-only (`jaad_cost_centers_v1`) — also written by the existing `/cost-centers` page |

No backend writes in this phase. `BACKEND_WRITES_ENABLED` remains `false`.

## Known limitations

- Quick-create dialogs do not yet appear inline inside the document editors (quotation/invoice). Adding "+ New customer" to the in-form pickers is queued for the next phase.
- Bank-account quick-create persists locally only; no live bank feeds.
- Fixed-asset and employee quick-create variants are deferred (full pages are still the entry).
