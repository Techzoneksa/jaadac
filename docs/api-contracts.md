# JAAD CLOUD — API Contracts (Phase 1.5)

Transport: TanStack `createServerFn` (app-internal) + server routes under `/api/public/*` (webhooks only). All responses follow `ServiceResult<T>` from `src/lib/contracts.ts`:

```ts
{ ok: true, data: T } | { ok: false, error: ApiErrorShape, validation?: ValidationError[] }
```

Common headers: bearer attached automatically by `attachSupabaseAuth`. Active tenant via JWT claim `active_tenant_id`. All list endpoints accept `ListQueryParams` (`search, status, from, to, sortBy, sortDir, page, pageSize, filters`). All write endpoints emit an `audit_logs` row.

Permission codes referenced below match `docs/security-permissions-plan.md`.

---

## Auth

| Method | Endpoint | Body | Response | Errors | Perm | Audit |
|---|---|---|---|---|---|---|
| POST | `auth.login` | `{email,password}` | `{session,user,tenants[]}` | invalid_credentials | public | auth.login |
| POST | `auth.register` | `{email,password,full_name}` | `{user}` | email_taken, weak_password | public | auth.register |
| POST | `auth.logout` | – | `{ok:true}` | – | authenticated | auth.logout |
| POST | `auth.forgot` | `{email}` | `{ok:true}` | – | public | auth.password_reset_requested |
| GET | `auth.me` | – | `{user,profile,memberships[]}` | unauthorized | authenticated | – |
| POST | `auth.selectTenant` | `{tenant_id}` | `{active_tenant_id, role}` | not_member | authenticated | auth.tenant_switch |

## Tenants

| Method | Endpoint | Body | Response | Perm | Audit |
|---|---|---|---|---|---|
| GET | `tenants.list` | – | `Tenant[]` | authenticated | – |
| GET | `tenants.current` | – | `Tenant` | member | – |
| PATCH | `tenants.updateSettings` | `{company?,tax?,numbering?}` | `Tenant` | owner | tenant.settings_updated |

## Customers / Suppliers / Items (same shape)
- `customers.list(params)` → `PaginatedResult<Customer>` — read perm
- `customers.get(id)` → `Customer` — read perm
- `customers.create(payload)` → `Customer` — write perm — audit `customer.created`
- `customers.update(id, patch)` → `Customer` — write perm — audit `customer.updated`
- `customers.archive(id)` → `{ok:true}` — write perm — audit `customer.archived`

Validation errors: `required_field`, `duplicate_code`, `invalid_vat_number`.

## Quotations

| Endpoint | Body | Perm | Audit | Notes |
|---|---|---|---|---|
| `quotations.list` | params | read | – | |
| `quotations.get` | `{id}` | read | – | |
| `quotations.create` | Quotation draft | sales+ | quotation.created | status=draft |
| `quotations.update` | `{id,patch}` | sales+ | quotation.updated | block when status≠draft |
| `quotations.send` | `{id}` | sales+ | quotation.sent | status→sent |
| `quotations.accept` | `{id}` | sales+ | quotation.accepted | |
| `quotations.reject` | `{id}` | sales+ | quotation.rejected | |
| `quotations.convertToInvoice` | `{id}` | sales+ | quotation.converted + invoice.created | returns `{invoice}` |

## Invoices

| Endpoint | Body | Perm | Audit |
|---|---|---|---|
| `invoices.list` | params | read | – |
| `invoices.get` | `{id}` | read | – |
| `invoices.create` | Invoice draft | sales+ | invoice.created |
| `invoices.updateDraft` | `{id,patch}` | sales+ | invoice.updated |
| `invoices.send` | `{id}` | sales+ | invoice.sent |
| `invoices.issue` | `{id}` | accountant+ | invoice.issued + journal.posted (idempotent) |
| `invoices.cancel` | `{id,reason}` | accountant+ | invoice.cancelled + journal.reversed |
| `invoices.printData` | `{id}` | read | – |

Errors: `edit_after_issue`, `duplicate_number`, `total_must_be_positive`.

## Receipts

| Endpoint | Body | Perm | Audit |
|---|---|---|---|
| `receipts.list` | params | read | – |
| `receipts.get` | `{id}` | read | – |
| `receipts.create` | Receipt | accountant+ | receipt.created + invoice.updated (paid/status) + journal.posted |

Errors: `amount_exceeds_balance`.

## Payments
`payments.list / get / create` — accountant+, audit `payment.created` + `journal.posted`.

## Accounting

| Endpoint | Perm | Audit |
|---|---|---|
| `accounts.list/get/create/update/archive` | accountant+ | account.* |
| `journal.list/get` | read | – |
| `journal.createManual` | accountant+ | journal.created (draft) |
| `journal.post` | accountant+ | journal.posted |

Errors: `unbalanced_entry`, `posted_locked`, `duplicate_source` (when auto-post hits same source).

## Tasks
`tasks.list/get/create/update/changeStatus/complete` — assignee or owner+; audit `task.*`.

## Reports
Read-only, role-filtered:
- `reports.sales(params)`
- `reports.unpaidInvoices(params)`
- `reports.receipts(params)`
- `reports.payments(params)`
- `reports.items(params)`
- `reports.customerBalances(params)`

## Audit
- `audit.list(params)` — filters: `action, entity_type, user_id, from, to`. Owner/accountant only.

## System
- `system.dataIntegrity()` → integrity report (counts, orphans, unbalanced entries). owner+
- `system.exportSnapshot()` → `MigrationSnapshot` (service-role). owner only.
- `system.health()` → `{ok, version, mode, schemaVersion}` — public.

## Webhook routes (server routes under `/api/public/*`)
- `POST /api/public/webhooks/payments` — signature-verified, idempotent.
- `POST /api/public/webhooks/email-status` — bounce/complaint tracking.
