# JAAD CLOUD / جاد كلاود

**Demo SaaS Accounting System** — Frozen Demo Baseline

> ⚠️ This is a **demo-only** build. Not production-ready. Backend writes are disabled. All data is in LocalStorage.

---

## Current Technology

| Layer | Technology |
|-------|-----------|
| Meta-framework | TanStack Start v1 |
| UI | React 19 |
| Build | Vite 7 |
| Styling | Tailwind v4 + shadcn/ui |
| Data (active) | LocalStorage (Demo Mode) |
| Data (future) | Supabase (configured, disabled) |
| Languages | Arabic / English (RTL) |

> **Note:** This is NOT Next.js. A future migration to Next.js + Node.js 22.x + Hostinger is planned.

---

## Quick Start

```bash
# Install
npm install

# Development
npm run dev

# Build
npm run build

# Type check (no script in package.json — run directly)
npx tsc --noEmit
```

---

## Environment

- `.env.example` — template with placeholder values only (no real keys)
- `.env` — local config (not tracked by git). Contains Supabase URL and anon key for the connected project.
- **Never commit `.env`** to any repository.

---

## Data Mode

| Setting | Value |
|---------|-------|
| `DATA_MODE` | `"demo"` |
| `BACKEND_WRITES_ENABLED` | `false` |
| Active adapter | `LocalStorageDataAdapter` |
| Backend adapter | `FutureBackendDataAdapter` (read-only) |

All data is stored in your browser's LocalStorage. No external database is required to run the demo.

---

## Included Modules

| Module | Status |
|--------|--------|
| Dashboard | ✅ Full |
| Customers | ✅ Full CRUD |
| Suppliers | ✅ Full CRUD |
| Products & Services | ✅ Full CRUD |
| Quotations | ✅ Create, edit, issue, convert to invoice |
| Sales Invoices | ✅ Create, edit, issue |
| Purchase Invoices | ✅ Create, edit |
| Receipts | ✅ Create with auto-apply |
| Payments | ✅ Create with posting |
| Chart of Accounts | ✅ Hierarchical tree |
| Manual Journal | ✅ Full-page editor |
| Taxes | ✅ 8 Saudi VAT rates |
| Reports Center | ✅ 11 reports (TB, BS, P&L, CF, GL, AR, Sales, VAT, etc.) |
| Audit Log | ✅ Working |
| Demo Checklist | ✅ 23 items |
| System Data Mode | ✅ Backend readiness panel |
| Permissions | ✅ 4 roles (owner, accountant, sales, viewer) |
| Document Templates | ✅ 4 print templates |
| Command Palette | ✅ Ctrl+K |
| Quick Create | ✅ Menu + dialogs |
| RTL/LTR | ✅ Full bilingual |

---

## Limitations

- ❌ No backend writes — all mutations are LocalStorage only
- ❌ No real user authentication — mock Owner auto-login
- ❌ Supabase is configured but not actively used in demo mode
- ❌ Credit Notes / Debit Notes / Sales Orders / Purchase Orders — list view only (no full editors yet)
- ❌ TaxRate selector not fully integrated into invoice line items
- ❌ Inventory, Fixed Assets, Bank Reconciliation — foundation pages only
- ❌ Not deployed to production (no Hostinger / Vercel / Netlify)

---

## GitHub

- Repository: `https://github.com/Techzoneksa/jaadcloud.git`
- Active branch: `phase-1-migration-audit`
- Tag: `v0.1.0-demo-baseline`
- **Do not merge to main until the Next.js migration is planned.**

---

## Future Direction

1. ✅ **Phase 1** — Freeze, audit, push baseline (current)
2. 🎯 **Phase 2** — Demo presentation & stakeholder feedback
3. 🔄 **Phase 3** — Migrate to Next.js + Node.js 22.x + Hostinger
4. 🚀 **Phase 4** — Activate backend, real auth, production deployment
