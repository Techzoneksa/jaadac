# JAAD CLOUD — Client Feature Summary

Plain-language summary of what JAAD CLOUD (جاد كلاود) delivers today
and what is on the roadmap. Suitable for client-facing handouts.

## Ready today

### Bilingual experience
- Full Arabic and English UI, instant switching, RTL/LTR aware.
- All documents, lists, reports, and messages are bilingual.

### Sales cycle
- **Quotations** — auto-numbering, line items, VAT 15%, totals,
  Draft → Sent → Accepted / Rejected workflow, print preview.
- **Sales Invoices** — created from scratch or from accepted
  quotations in one click. Issuing locks the document and posts
  accounting automatically.
- **Receipt Vouchers** — record customer payments, link to invoices,
  update balances.
- **Payment Vouchers** — record supplier payments and expenses with
  automatic journals.

### Master data
- **Customers** — contact info, balances, transaction history.
- **Suppliers** — contact info, balances, payment history.
- **Products & Services** — unified catalog with pricing, units,
  VAT rate.

### Accounting
- **Chart of Accounts** — Saudi-aligned defaults, extendable.
- **Journal Entries** — every issued invoice / receipt / payment
  posts a balanced, locked entry automatically.
- **Account purposes mapping** — backend-ready foundation that
  removes hardcoded account codes per tenant.

### Reporting
- Sales report, VAT report, receipts and payments reports.
- **Reports Center** with categories (Sales, VAT, AR, AP, Payroll,
  Inventory, etc.) — current reports wired, future reports stubbed.

### Operations
- **Tasks** — internal task tracking.
- **Roles & Permissions** — Owner, Accountant, Sales, Viewer, plus
  granular permissions per module.
- **Audit Log** — every sensitive action records who / when / what.
- **Data Integrity Checks** — internal page validating numbering,
  balances, and links.

### Cloud-activation readiness
- 7 runnable database migrations prepared (schema, triggers, RLS,
  bootstrap, write RPCs, hardening, account purpose mapping).
- Read-only diagnostic suite verifies the backend before any switch.
- Activation is a configuration step, not a rebuild.

## Coming later (on roadmap, intentionally not in current demo)

- Live cloud activation on the client's environment.
- Advanced reports (cash flow projection, aging, custom dashboards).
- Customizable document templates (logo, stamp, signature, colors,
  per-document layouts).
- Custom fields per document and per line.
- Sending documents via Email / WhatsApp.
- Payroll, Employees, Expense claims.
- Branches and multi-organization production mode.
- Team management and internal communication.
- Bulk spreadsheet edit and quick command palette enhancements.

## Why this matters for the buyer

- **Saudi-ready out of the box** — VAT 15%, Arabic-first, SAR.
- **Accountant-grade discipline** — auto-posting, locked entries,
  audit log, role-based access.
- **Future-proof** — cloud activation, multi-tenant isolation, and
  advanced features sit on a foundation that is already wired and
  reviewed, not promised.
- **Zero rebuild risk** — going live does not change the UI or the
  way users work.
