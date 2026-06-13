# JAAD CLOUD — Frozen Demo Baseline Release Notes

## Release

| Field | Value |
|-------|-------|
| **Release Name** | `JAAD CLOUD Frozen Demo Baseline` |
| **Tag** | `v0.1.0-demo-baseline` |
| **Branch** | `phase-1-migration-audit` |
| **Commit** | `40b428a` → Final: _(see below)_ |
| **Date** | 2026-06-13 |
| **Status** | 🟢 Frozen — Demo Only |

---

## Summary

This is the first frozen baseline release of JAAD CLOUD, a bilingual (AR/EN) demo SaaS accounting system built on TanStack Start. The release captures the complete state of the application after all Phase 2 development was completed. The project is now frozen for demo presentation.

---

## Included Modules

| Module | Status |
|--------|--------|
| Dashboard | ✅ |
| Customers | ✅ Full CRUD |
| Suppliers | ✅ Full CRUD |
| Products & Services | ✅ Full CRUD |
| Quotations | ✅ Create, edit, issue, convert to invoice |
| Sales Invoices | ✅ Create, edit, issue |
| Purchase Invoices | ✅ Create, edit |
| Receipts | ✅ Create with auto-apply |
| Payments | ✅ Create with posting |
| Chart of Accounts | ✅ Hierarchical tree with drag-and-drop |
| Manual Journal | ✅ Full-page editor |
| Taxes | ✅ 8 Saudi VAT rates |
| Reports Center | ✅ 11 financial reports |
| Audit Log | ✅ |
| Demo Checklist | ✅ 23 items |
| System Data Mode | ✅ |
| Permissions | ✅ 4 roles |
| Document Templates | ✅ 4 print templates |
| Command Palette | ✅ Ctrl+K |
| Quick Create | ✅ |
| Smart Select | ✅ Entity combo boxes |
| RTL/LTR | ✅ Full bilingual |

---

## Technical Status

| Check | Result |
|-------|--------|
| Build | ✅ PASS (2248 client modules + 279 SSR modules) |
| TypeScript | ✅ PASS (0 errors, strict mode) |
| Lint | ⚠️ 4167 prettier formatting errors (0 code errors) |
| Secrets scan | ✅ PASS (no secrets tracked) |
| `DATA_MODE` | `"demo"` (locked) |
| `BACKEND_WRITES_ENABLED` | `false` (locked) |
| Active adapter | `LocalStorageDataAdapter` |
| Backend adapter | `FutureBackendDataAdapter` (read-only) |
| Supabase client | Installed and configured (disabled in demo mode) |
| Git branch | `phase-1-migration-audit` |
| GitHub | `https://github.com/Techzoneksa/jaadcloud.git` |

---

## Known Limitations

1. **Demo only** — Not production-ready. All data is LocalStorage.
2. **No real auth** — Mock Owner auto-login. No Supabase user created yet.
3. **Backend writes disabled** — `FutureBackendDataAdapter` returns `writes_disabled` for all mutations.
4. **TaxRate selector not tied** — Invoice line items use a numeric `vat_rate` field, not the `TaxRate` table.
5. **Credit Notes / Debit Notes** — List view only (no create/edit/issue flow).
6. **Sales Orders / Purchase Orders** — List view only.
7. **Foundation pages** — Inventory, Fixed Assets, Bank Reconciliation are placeholders.
8. **Prettier formatting** — 4167 formatting issues (auto-fixable, no code errors).
9. **Large vendor chunk** — Main JS bundle is 677kB (197kB gzip) — can be optimized later.
10. **Not deployed** — No Vercel, Netlify, or Hostinger deployment.

---

## Next Planned Direction

After demo presentation and stakeholder feedback:

1. **Next.js migration** — Convert from TanStack Start to Next.js App Router
2. **Node.js 22.x** — Server runtime
3. **Hostinger deployment** — Via GitHub Actions
4. **Backend activation** — Switch `DATA_MODE`, enable writes, create first user
5. **Real auth** — Supabase Auth or NextAuth.js

These steps will be executed as separate independent decisions after the demo.
