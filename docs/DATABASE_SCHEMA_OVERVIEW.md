# JAAD CLOUD — Database Schema Overview

## Stack

- **Database:** PostgreSQL
- **ORM:** Drizzle ORM (type-safe, SQL-like)
- **Driver:** `postgres` (lightweight, no ORM lock-in)
- **Migration:** Drizzle Kit (`drizzle-kit`)

## Why Drizzle ORM?

- SQL-like syntax — predictable, no hidden magic
- Zero-cost abstractions — no query builder overhead
- Type-safe — full TypeScript inference
- Lightweight migration tooling
- Works with any PostgreSQL driver
- Great for accounting queries (complex joins, aggregations)

## Schema Groups

### 1. Tenancy / Auth (4 tables)
`tenants`, `users`, `memberships`, `invitations`

Multi-tenant foundation. Each organization is a `tenant`. Users belong to tenants via `memberships` with a role. Invitations are tracked with expiry.

### 2. Core Master Data (7 tables)
`customers`, `suppliers`, `items`, `branches`, `projects`, `cost_centers`, `bank_accounts`

Business entities shared across modules. All scoped to tenant.

### 3. Accounting (5 tables)
`chart_accounts`, `account_purposes`, `journal_entries`, `journal_entry_lines`, `tax_rates`

Double-entry accounting engine. Journal entries are immutable once posted. Reversals create new entries referencing the original.

### 4. Sales (6 tables)
`quotations`, `quotation_lines`, `sales_invoices`, `sales_invoice_lines`, `credit_notes`, `credit_note_lines`

Full sales cycle: Quotation → Invoice → Credit Note. Each document has header + lines structure.

### 5. Purchases (6 tables)
`purchase_orders`, `purchase_order_lines`, `purchase_invoices`, `purchase_invoice_lines`, `debit_notes`, `debit_note_lines`

Full purchasing cycle: Purchase Order → Invoice → Debit Note.

### 6. Cash / AP / AR (4 tables)
`receipts`, `receipt_allocations`, `payments`, `payment_allocations`

Cash receipt and payment tracking with allocation to invoices.

### 7. System (4 tables)
`audit_logs`, `number_sequences`, `attachments`, `settings`

Cross-cutting concerns: auditing, document numbering, file attachments, tenant settings.

### 8. Foundation — Phase 2+ (3 tables)
`employees`, `fixed_assets`, `inventory_movements`

Placeholder tables for features planned in later phases.

## Multi-Tenant Strategy

- Every business table has `tenant_id` column
- Foreign key to `tenants.id`
- Indexed for query performance
- Application-layer tenant isolation (Row-Level Security later)

## Accounting Immutability Strategy

- Posted journal entries cannot be modified
- Reversals create new entries (not UPDATE/DELETE)
- `reversalOfId` links reversal to original entry
- `sourceType` + `sourceId` for idempotency
- Status machine: `draft → posted → voided` or `draft → posted → reversed`

## Identifiers

- UUID primary keys (`gen_random_uuid()`)
- Document numbers are application-generated via `number_sequences`
- Account codes unique per tenant

## Numeric Precision

| Field | Precision | Scale | Used For |
|-------|-----------|-------|----------|
| Money | 18 | 2 | Amounts, totals, balances |
| Unit | 18 | 6 | Unit price, quantity, exchange rate |
| Percent | 5 | 2 | Discount %, tax rate % |

## Environments

```env
# .env.local (real connection — not tracked)
DATABASE_URL="postgresql://user:password@host:5432/jaadcloud?sslmode=require"

# .env.example (template — tracked)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
```

## Migration Commands

```bash
npm run db:generate   # Generate SQL from schema changes
npm run db:migrate    # Apply pending migrations
npm run db:studio     # Launch Drizzle Studio (GUI)
npm run db:check      # Verify migration state
npm run db:seed       # Seed demo data (requires real DB)
```

## What is NOT implemented yet

- Auth.js integration (Phase 2.4)
- Row-Level Security (RLS)
- Database triggers (auto-update `updatedAt`, audit logging)
- Full-text search indexes
- Real seed data
- Connection pooling config (for Hostinger)
- CI/CD migration automation
