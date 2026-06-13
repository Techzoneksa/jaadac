# Phase 2.3 — Database Schema + Migration Foundation

**Date:** 2026-06-13  
**Branch:** `nextjs-migration`  
**Commit:** `64ed42d` → after commit

---

## Summary

Added Drizzle ORM + PostgreSQL foundation with full production schema (39 tables), initial migration, DB client, env template, and seed script template. No UI changes. No Auth.js.

---

## What was created

| Item | Path | Status |
|------|------|--------|
| Drizzle ORM | `apps/web/` | ✅ Installed |
| PostgreSQL driver (postgres) | `apps/web/` | ✅ Installed |
| server-only | `apps/web/` | ✅ Installed |
| Drizzle Kit (dev) | `apps/web/` | ✅ Installed |
| Environment example | `apps/web/.env.example` | ✅ Created |
| Drizzle config | `apps/web/drizzle.config.ts` | ✅ Created |
| DB client (server-only) | `apps/web/src/server/db/index.ts` | ✅ Created |
| Full schema (39 tables) | `apps/web/src/server/db/schema.ts` | ✅ Created |
| Migration (initial) | `apps/web/drizzle/0000_fat_bedlam.sql` | ✅ Generated |
| Seed script (template) | `apps/web/src/server/db/seed.ts` | ✅ Created |
| DB scripts in package.json | `apps/web/package.json` | ✅ Updated |

---

## Schema summary

### 39 tables across 8 groups

| Group | Tables |
|-------|--------|
| Tenancy/Auth | `tenants`, `users`, `memberships`, `invitations` |
| Core Master Data | `customers`, `suppliers`, `items`, `branches`, `projects`, `cost_centers`, `bank_accounts` |
| Accounting | `chart_accounts`, `account_purposes`, `journal_entries`, `journal_entry_lines`, `tax_rates` |
| Sales | `quotations`, `quotation_lines`, `sales_invoices`, `sales_invoice_lines`, `credit_notes`, `credit_note_lines` |
| Purchases | `purchase_orders`, `purchase_order_lines`, `purchase_invoices`, `purchase_invoice_lines`, `debit_notes`, `debit_note_lines` |
| Cash/AP/AR | `receipts`, `receipt_allocations`, `payments`, `payment_allocations` |
| System | `audit_logs`, `number_sequences`, `attachments`, `settings` |
| Foundation (Phase 2+) | `employees`, `fixed_assets`, `inventory_movements` |

### 12 PostgreSQL enums

`user_role`, `account_type`, `account_purpose`, `journal_status`, `document_status`, `quotation_status`, `payment_status`, `tax_type`, `item_type`, `invoice_type`, `tax_rate_type`, `invitation_status`

### Key design decisions

- **Multi-tenant**: Every business table has `tenantId` with foreign key + index
- **UUID primary keys**: All tables use `uuid` with `gen_random_uuid()`
- **Money stored as `numeric(18,2)` or `numeric(18,6)`**: Never float
- **Immutable audit fields**: `createdAt`, `updatedAt`, `createdBy`, `updatedBy` on all tables
- **Status machines**: `journalStatus`, `documentStatus`, `paymentStatus`, `quotationStatus` enums
- **Document numbering**: `number_sequences` table per tenant/type/year with prefix + padding
- **Journal idempotency**: `sourceType` + `sourceId` index on journal_entries
- **No triggers yet**: Schema designed to accept them later

---

## Migration

```bash
npm run db:generate   # Generate SQL migration from schema
npm run db:migrate    # Apply migrations (requires DATABASE_URL)
npm run db:studio     # Drizzle Studio (visual DB browser)
npm run db:check      # Check migration state
```

Initial migration: `drizzle/0000_fat_bedlam.sql` (899 lines, 39 tables, 12 enums)

---

## Known limitations

- No Auth.js integration (Phase 2.4)
- No real seed data (Phase 2.4+)
- No database triggers yet
- No row-level security (RLS) yet
- No CRUD UI connected to database
- `drizzle-kit check` may need DATABASE_URL

---

## Next step

**Phase 2.4:** Auth + Multi-Tenancy (Auth.js v5 integration)
