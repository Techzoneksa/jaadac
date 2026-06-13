# JAAD CLOUD — Sidebar Architecture (Phase 2.1.9)

Status: Active · Lang: AR / EN · Last update: 2026-06-13

## Goals

- Cleaner, grouped navigation that follows business domains, not technical files.
- Single-open accordion to reduce visual clutter.
- Clear status indicators (Active / Foundation / Planned).
- Same structure for desktop, tablet (collapsible mini rail), and mobile (drawer).
- Permission-aware: groups hide entirely when the user has no items inside them.

## Group structure

| # | Group (EN) | Group (AR) | Active items | Foundation / Planned |
|---|---|---|---|---|
| 1 | Dashboard | لوحة البيانات | Dashboard, Tasks, Demo Flow (Owner) | — |
| 2 | Sales | المبيعات | Quotations, Sales Invoices, Receipts | Sales Orders, Credit Notes |
| 3 | Purchases | المشتريات | Payments | Purchase Orders, Purchase Invoices, Debit Notes |
| 4 | Contacts | العملاء والموردون | Customers, Suppliers | — |
| 5 | Products & Inventory | المنتجات والمخزون | Products & Services | Inventory |
| 6 | Accounting | المحاسبة | Chart of Accounts, Journal Entries | Bank Reconciliation |
| 7 | Finance Structure | البنوك والأصول والتكاليف | Branches | Bank Accounts, Fixed Assets, Cost Centers, Projects |
| 8 | HR | الموارد البشرية | Employees & Payroll | HR Overview |
| 9 | Reports | التقارير | Reports, Reports Center | — |
| 10 | Settings & Admin | الإعدادات والإدارة | Company Settings, Document Templates, Custom Fields, Communication, Audit Log, Permission Check, System Data Mode, Data Integrity | Template Designer, ZATCA |
| 11 | Integrations & Developers | التكاملات والمطورون | Product Roadmap (Owner) | Integrations, Data Migration |

## Interaction behavior

- **Accordion:** clicking a group header toggles it. Opening one group automatically collapses the previously open one (single-open mode).
- **Active route:** the group containing the current route is auto-expanded on every navigation. The active item is highlighted with the sidebar-primary color.
- **Mini rail (desktop / tablet):** the chevron handle on the sidebar edge collapses the sidebar to a 64px rail with icons only. Status dots remain visible. Hovering an icon shows a tooltip.
- **Mobile:** the rail/drawer toggle is the topbar menu button. Below 768px the sidebar is rendered as a Sheet drawer that closes on navigation.
- **RTL/LTR:** chevrons and toggle handles mirror automatically based on `dir`.

## Status indicator legend

| Color | Meaning |
|---|---|
| (none) | Active production module |
| Blue dot | Foundation (UI ready, demo-only) |
| Purple dot | Planned |
| Amber dot | Coming Soon |

## Implementation notes

- All entries live in `src/components/layout/Sidebar.tsx` (`GROUPS` array).
- Filtering: `GROUPS.map(g => g.items.filter(can))`. Groups with zero permitted items are hidden entirely.
- Single-open state lives in `openKey: string` plus a `useEffect` that recomputes the desired open group on `pathname` change.
- Persisted collapse state lives in `localStorage.jaad.sidebar.collapsed` (managed by `AppShell`).

## Out of scope (kept for later phases)

- Search-as-you-type inside the sidebar.
- Pinning favorites / recent pages.
- Drag-to-reorder groups.
- Per-user sidebar customization.
