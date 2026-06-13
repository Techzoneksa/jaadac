# JAAD CLOUD — Advanced Business Features UI Foundation (Phase 2.2)

Status: **Foundation only — demo/local**. No backend writes are connected.

## Scope

Phase 2.2 adds UI-level foundations for advanced business features inspired by
modern accounting platforms, while keeping the existing accounting core (Phase
1.x and the read-only Supabase work in Phase 1.6 → 2.1.1) untouched.

| Area | Status | Notes |
|---|---|---|
| Document Templates | UI foundation + seed data | List/preview/duplicate/archive buttons toast as demo |
| Custom Fields | UI foundation + seed data | Listed; not yet wired into create/edit forms |
| Column Label Customization | Schema only (`DocumentTemplate.column_labels`) | UI editor not yet built |
| Document Branding | Per-template fields (colors, font, watermark, language) | Preview pending |
| Send via Email/WhatsApp | `SendDocumentDialog` placeholder | Shows "Sending is not connected yet" — no API calls |
| Reports & Analytics Center | `/reports-center` with 10 categories | 6 existing reports stay functional; rest are "Coming soon" |
| Employees & Payroll | `/employees` (3 tabs) | Demo employees, payroll runs, expense claims |
| Branches & Team | `/branches` (3 tabs) | Branches, current org, team |
| Internal Communication | `/communication` | Announcements, notes (foundation), message templates |
| Bulk Spreadsheet Edit | Permission added (`bulk_edit.manage`) | Editor UI not yet built |
| Quick Actions / Instant Search | `CommandPalette` (Ctrl/Cmd+K) | Mounted in Topbar globally |

## Non-goals

- No backend write activation (`BACKEND_WRITES_ENABLED` remains `false`).
- No real email/WhatsApp integration.
- No POS, no e-commerce.
- No payroll posting or WPS bank flow.
- No new business logic touching the existing accounting core.

## Data model (in `src/lib/store.ts`)

New entities under `State`:

- `document_templates: DocumentTemplate[]`
- `custom_fields: CustomField[]`
- `branches: Branch[]`
- `employees: Employee[]`
- `payroll_runs: PayrollRun[]`
- `expense_claims: ExpenseClaim[]`
- `announcements: Announcement[]`
- `internal_notes: InternalNote[]`
- `message_templates: MessageTemplate[]`

`load()` seeds new arrays from `initial` when an older `jaad_state_v2`
snapshot is found in `localStorage`, so existing users keep their data and
get the new entities without a reset.

## Permissions (in `src/lib/auth.tsx`)

Added: `templates.manage`, `custom_fields.manage`, `payroll.view`,
`payroll.manage`, `employees.view`, `employees.manage`, `branches.view`,
`branches.manage`, `communication.view`, `communication.manage`,
`bulk_edit.manage`, `quick_actions.use`.

Role mapping summary:

| Capability | owner | accountant | sales | viewer |
|---|---|---|---|---|
| templates.manage | ✓ | ✓ | – | – |
| custom_fields.manage | ✓ | ✓ | – | – |
| payroll.view/manage | ✓ | ✓ | – | view |
| employees.view | ✓ | ✓ | – | view |
| employees.manage | ✓ | – | – | – |
| branches.view | ✓ | ✓ | – | view |
| branches.manage | ✓ | – | – | – |
| communication.view | ✓ | ✓ | ✓ | ✓ |
| communication.manage | ✓ | ✓ | – | – |
| bulk_edit.manage | ✓ | ✓ | ✓ | – |
| quick_actions.use | ✓ | ✓ | ✓ | ✓ |

## Navigation

Sidebar grouped under a new "Advanced" divider:

- Document Templates (`/document-templates`)
- Custom Fields (`/custom-fields`)
- Reports & Analytics Center (`/reports-center`)
- Employees & Payroll (`/employees`)
- Businesses & Branches (`/branches`)
- Internal Communication (`/communication`)

Each entry is gated by the matching permission so the menu stays clean per role.

## Quick Actions / Instant Search

`src/components/CommandPalette.tsx` mounts globally via the Topbar. Ctrl/Cmd+K
or clicking the search input opens a cmdk-based palette that:

- Shows quick actions filtered by the current user's permissions.
- Globally searches customers, suppliers, items, quotations, invoices,
  receipts, payments and tasks, respecting each entity's `*.view` permission.
- Navigates via TanStack Router (no `window.location`).

## Deferred for later phases

- Editor UIs for templates / custom fields / column labels.
- Real spreadsheet bulk editor (currently permission + plan only).
- Wiring custom field values into document create/edit forms and print.
- Real send-via-email / WhatsApp connectors and secret management.
- Branch-level accounting and inter-branch entries.
- Real invitations, role grants, deactivation flows.
- Full implementation of the remaining "Coming soon" reports.
