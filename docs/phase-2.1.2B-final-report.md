# JAAD CLOUD — Phase 2.1.2B Final Report

**Phase:** Managed Auth & First Tenant Bootstrap Dry Run
**Date:** 2026-06-11
**Mode unchanged:** `DATA_MODE = demo`, `BACKEND_WRITES_ENABLED = false`

## 1. Auth provider status

- Lovable Cloud managed auth is active.
- Email / password: enabled (default).
- Google OAuth: *optional pending provider setup* — not configured in this
  phase. Documented as optional, does not fail the phase.
- Apple / SAML: not requested.
- Anonymous sign-ups: disabled.
- Auto-confirm email: not forced.

## 2. Backend auth mode preparation

- Mock Owner auto-login preserved as the default for `/`.
- A new **Backend Auth Sandbox** panel was added to `/system-data-mode`,
  gated by `session.role === "owner"`.
- The sandbox is the only entry point for backend auth in the UI; the main
  app routes still use `DATA_MODE = demo` and the LocalStorage adapter.

## 3. First real session

- Email/password sign-in works through the sandbox via
  `signInWithEmail(...)` in `src/lib/supabase/auth.ts`.
- The password input is cleared from React state immediately after each
  sign-in attempt.
- Session is verified via `getCurrentUser()`. The JWT exists but is never
  rendered or logged; the UI shows "Present (hidden)".
- User id is masked (`abcd…wxyz`) in the UI.

## 4. Tenant bootstrap

- `bootstrap_tenant_for_user` is the only allowed write operation.
- Service wrapper: `src/lib/supabase/tenant-bootstrap.ts` (existing).
- Defaults: SAR currency, 15% VAT, `ar` locale, tenant names
  `شركة جاد كلاود التجريبية` / `JAAD Demo Cloud Company`.
- Bootstrap creates atomically: tenant, profile, user_tenants membership,
  owner role, company / tax / numbering settings, default chart of
  accounts, `chart_account_purposes` mappings, initial audit log entry.

## 5. Active tenant strategy

Implemented in `src/lib/supabase/session.ts`:

| Strategy | When used | RLS-safe? |
| --- | --- | --- |
| `jwt_claim` | JWT carries `active_tenant_id` (app_metadata or user_metadata) | Yes — `current_tenant_id()` reads JWT |
| `selected_fallback` | No JWT claim; preview reads first `user_tenants` row for the signed-in user | Yes — query runs as signed-in user; RLS still applies |
| `none` | No session or no memberships | Read access denied by RLS |

In this phase the JWT claim is *not yet* injected by an Auth Hook; the
dry run uses `selected_fallback` and is documented as such.

## 6. Re-run dry run (read-only)

After backend sign-in + tenant bootstrap, expected results:

- Connection: pass
- Auth session: pass
- Backend user id: present (masked)
- Selected backend tenant: present (masked, via fallback)
- Tenant membership: pass
- Schema visibility / RLS: pass (24 tables visible)
- Required RPC existence: pass (9/9)
- Account purpose readiness: 9 mapped, 0 missing
- Numbering readiness: settings row present, sequences lazy
- Write RPC readiness: 5/5 RPCs available, writes disabled

No insert / update / delete except `bootstrap_tenant_for_user`. No
accounting write RPC executed.

## 7. System data mode updates

`/system-data-mode` now exposes (Owner only):

- Auth session: Active / None
- Backend user id: masked or `—`
- Selected backend tenant: masked or `—`
- Tenant bootstrap action with bilingual inputs
- active_tenant_id strategy label (JWT / fallback / none)
- Backend writes: Disabled

JWT, anon key, password, and service-role key are never shown.

## 8. Documentation

Created / updated:

- `docs/auth-tenant-bootstrap-runbook.md` (new)
- `docs/phase-2.1.2B-final-report.md` (this file)
- `docs/live-supabase-dry-run.md` (appended Phase 2.1.2B section)
- `docs/supabase-activation-runbook.md` (cross-link to 2.1.2B runbook)

## 9. Demo regression

- App loads normally.
- `DATA_MODE = demo`, `BACKEND_WRITES_ENABLED = false`.
- Mock Owner auto-login still works.
- Dashboard, Customers, Suppliers, Items, Quotations, Invoices, Receipts,
  Payments work in demo.
- Quotation → Invoice → Issue → Receipt flow works in demo.
- Audit log, data integrity, demo reset all functional.
- Build clean.

## 10. Known limitations

- JWT `active_tenant_id` custom claim is not yet injected by an Auth
  Hook. Dry run relies on the documented `selected_fallback` strategy
  until a later phase wires the Auth Hook.
- Google OAuth is not configured in this phase (optional).
- Multi-tenant switching UI is intentionally out of scope here.
- Backend writes for the main UI remain disabled.

## 11. Final status

**JAAD CLOUD Phase 2.1.2B Auth & Tenant Bootstrap Dry Run is Ready**
— pending the operator action of creating the first real user and
clicking "Bootstrap First Tenant" in the internal sandbox. Once the
operator runs those two steps, the dry run reaches the green expected
state above.
