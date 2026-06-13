# JAAD CLOUD — Backend Schema Plan (Phase 1.5)

Target: PostgreSQL (Lovable Cloud / Supabase). All business tables are tenant-scoped via `tenant_id uuid not null` and protected by RLS.

## Conventions
- PK: `id uuid primary key default gen_random_uuid()`.
- Audit columns on every business table: `created_at timestamptz default now()`, `updated_at timestamptz`, `created_by uuid`, `archived boolean default false`.
- Soft delete = `archived = true`; hard delete reserved for service_role.
- Money: `numeric(14,2)`. Quantity: `numeric(14,3)`. VAT rate: `numeric(5,2)`.
- ISO date strings → `date` / `timestamptz`.
- Indexes: `(tenant_id)`, `(tenant_id, created_at desc)`, plus per-table specifics below.
- Every state change writes an `audit_logs` row.

## Tables

### 1. `tenants`
Purpose: organization / company entity.
Fields: `id`, `name_ar`, `name_en`, `country` default `'SA'`, `currency` default `'SAR'`, `vat_number`, `cr_number`, `created_at`.
Indexes: `(name_en)`.
No `tenant_id` (root entity). Soft-archivable.
Audit: tenant.created, tenant.updated.

### 2. `users`
Auth identity. Source: `auth.users` (Supabase managed) + `public.profiles`.
`profiles`: `id uuid pk references auth.users(id)`, `full_name`, `email`, `phone`, `avatar_url`, `lang` default `'ar'`, `created_at`.
No `tenant_id` (user can belong to many).

### 3. `user_tenants`
Purpose: membership of a user in a tenant + role.
Fields: `id`, `user_id` fk profiles, `tenant_id` fk tenants, `role app_role not null`, `is_default boolean`, `joined_at`.
Unique: `(user_id, tenant_id)`. Index `(tenant_id, role)`.

### 4. `app_role` (enum) + `user_roles` (separate, security-definer pattern)
Per project memory rule: roles stored in a separate table, never on profile.
`app_role`: `'owner' | 'accountant' | 'sales' | 'viewer'`.
`user_roles`: `(id, user_id, tenant_id, role)` unique `(user_id, tenant_id, role)`. Used by `public.has_role(uid, tenant, role)` security-definer fn.

### 5. `permissions` (static reference)
Code-defined permission map per role; no table needed unless customizable. Reserved table: `role_permissions(role app_role, permission text)`.

### 6. `customers`
`id, tenant_id, code, name_ar, name_en, phone, email, vat_number, address, opening_balance numeric(14,2), notes, archived, created_at, updated_at`.
Unique: `(tenant_id, code)`. Index `(tenant_id, name_ar)`, `(tenant_id, name_en)`.
Soft-archive. Audit on CUD.

### 7. `suppliers`
Mirror of customers; same shape.

### 8. `items`
`id, tenant_id, sku, name_ar, name_en, type ('product'|'service'), unit, price numeric(14,2), cost numeric(14,2), vat_rate numeric(5,2) default 15, archived`.
Unique: `(tenant_id, sku)`.

### 9. `quotations`
`id, tenant_id, number text not null, customer_id fk, date, valid_until, status ('draft'|'sent'|'accepted'|'rejected'|'converted'|'expired'), discount numeric(14,2), notes, terms, converted_invoice_id fk invoices null`.
Unique: `(tenant_id, number)`. Index `(tenant_id, status, date desc)`.

### 10. `quotation_lines`
`id, quotation_id fk on delete cascade, item_id fk null, description, qty numeric(14,3), unit_price numeric(14,2), discount numeric(14,2), vat_rate numeric(5,2)`. Index `(quotation_id)`.

### 11. `invoices`
`id, tenant_id, number, customer_id, date, due, status ('draft'|'sent'|'official'|'partially_paid'|'fully_paid'|'cancelled'), discount, paid numeric(14,2) default 0, notes, terms, issued_at, cancelled_at`.
Unique: `(tenant_id, number)`. Index `(tenant_id, status, date desc)`, `(customer_id)`.
Edit lock at status ∈ {official, partially_paid, fully_paid, cancelled}.

### 12. `invoice_lines`
Same shape as `quotation_lines` with `invoice_id`. Cascade delete only while draft.

### 13. `receipts`
`id, tenant_id, number, customer_id, invoice_id null, date, amount, method ('cash'|'bank'|'card'|'transfer'), reference, notes`.
Unique: `(tenant_id, number)`. Index `(invoice_id)`.

### 14. `payments`
`id, tenant_id, number, supplier_id null, payee text null, date, amount, vat_amount numeric(14,2), category text, method, reference, notes`.
Unique: `(tenant_id, number)`.

### 15. `chart_accounts`
`id, tenant_id, code text, name_ar, name_en, type ('asset'|'liability'|'equity'|'revenue'|'expense'), parent_id self-fk null, archived`.
Unique: `(tenant_id, code)`.

### 16. `journal_entries`
`id, tenant_id, number, date, description, status ('draft'|'posted'), source text, source_type ('manual'|'sales_invoice'|'receipt_voucher'|'payment_voucher'), source_id uuid null, created_at, posted_at`.
Unique: `(tenant_id, number)`, `(source_type, source_id)` partial when not null (idempotency).
Posted entries are immutable.

### 17. `journal_entry_lines`
`id, entry_id fk cascade, account_id fk chart_accounts, debit numeric(14,2) default 0, credit numeric(14,2) default 0, description`.
Constraint: `(debit = 0 OR credit = 0)`. App-level: sum(debit) = sum(credit) per entry.

### 18. `tasks`
`id, tenant_id, title, description, assignee_id fk profiles null, due_date, priority ('low'|'med'|'high'), status ('task_new'|'in_progress'|'completed'|'deferred'), created_by`.

### 19. `settings_company` (one row per tenant)
`tenant_id pk fk, name_ar, name_en, vat_number, cr_number, phone, email, address, logo_url`.

### 20. `settings_tax`
`tenant_id pk, vat_rate numeric(5,2) default 15, vat_inclusive boolean default false, currency text default 'SAR'`.

### 21. `settings_numbering`
`tenant_id pk, quotation text, invoice text, receipt text, payment text, journal text` (prefixes).

### 22. `audit_logs`
`id, tenant_id, user_id, action text, entity_type text, entity_id uuid null, description_ar, description_en, created_at`.
Index `(tenant_id, created_at desc)`, `(entity_type, entity_id)`.
Append-only (no UPDATE/DELETE policy except service_role).

### 23. `attachments` (placeholder)
`id, tenant_id, entity_type, entity_id, storage_path, mime, size_bytes, uploaded_by, created_at`. Bucket: `attachments/{tenant_id}/...`.

### 24. `migration_snapshots` (placeholder)
`id, tenant_id, schema_version int, exported_at, payload jsonb`. Service_role only.

## Delete / archive policy
- Customers, suppliers, items, accounts → archive only.
- Quotations → delete allowed if status ∈ {draft, rejected, expired}.
- Invoices → cancel (status = cancelled); never hard-delete after issue.
- Receipts/payments → reversal entry only (no edit/delete after post).
- Journal entries → posted = immutable; draft = editable/deletable.
- Tasks → hard-delete allowed.
- Audit logs → append-only.
