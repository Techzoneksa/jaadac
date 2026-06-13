# Phase 2.1.2B — Auth & First Tenant Bootstrap Runbook

This runbook is the safe procedure to bring a brand-new Lovable Cloud
backend from "schema applied, no users" to "first owner signed in, first
tenant bootstrapped, RLS-respecting dry run green" — without enabling
production writes.

## Hard constraints

- `DATA_MODE` stays `demo`. The main UI does NOT route through the backend.
- `BACKEND_WRITES_ENABLED` stays `false`. No accounting write RPC is called.
- The only write the runbook performs is `bootstrap_tenant_for_user`,
  which is the documented first-tenant setup RPC.
- The JWT, anon key, password, and service-role key are never displayed,
  logged, or echoed.

## Step 1 — Verify auth providers in Lovable Cloud

1. Open Backend → Users → Auth Settings.
2. Confirm **Email / Password** is enabled (default).
3. Optional: enable **Google** via the managed provider. If Google is not
   configured, this phase reports it as *optional pending provider setup*
   and still passes.
4. Do NOT enable anonymous sign-ups.
5. Do NOT enable auto-confirm email unless explicitly requested.

## Step 2 — Create the first real user

Create the first owner user manually from Backend → Users → Invite/Add user.
Document the email; never store the password in code or migrations.

If Google OAuth is enabled, the first sign-in can be performed via
`lovable.auth.signInWithOAuth("google", ...)`. This phase keeps email/password
as the default verification path.

## Step 3 — Open the Backend Auth Sandbox

1. Sign in to the demo as Owner (mock auto-login is unchanged).
2. Navigate to `/system-data-mode`.
3. The **Backend Auth Sandbox — Phase 2.1.2B (Owner only)** panel appears.
4. Enter the real backend email + password and click **Sign in to backend**.
5. The panel shows:
   - Backend session: Active
   - Backend user id: masked
   - JWT: present (hidden)
   - active_tenant_id (JWT claim): typically *Not present* on first sign-in
   - Selected backend tenant: `—` (none yet)
   - Active tenant strategy: *None*

## Step 4 — Bootstrap the first tenant

In the same sandbox, with safe defaults pre-filled:

- Arabic name: `شركة جاد كلاود التجريبية`
- English name: `JAAD Demo Cloud Company`

Click **Bootstrap First Tenant**. This invokes `bootstrap_tenant_for_user`
and creates atomically:

- `tenants` row
- `profiles` row for the user
- `user_tenants` membership
- `user_roles` (owner)
- `settings_company`, `settings_tax`, `settings_numbering`
- Default chart of accounts (10 accounts)
- `chart_account_purposes` mappings (9 purposes)
- Initial `audit_logs` entry `tenant.bootstrap`

After bootstrap the panel auto-refreshes:

- Selected backend tenant: masked id
- Active tenant strategy: *Preview fallback (first user_tenants row)*

## Step 5 — active_tenant_id strategy

Two strategies are supported:

1. **`jwt_claim`** — the recommended production strategy. The JWT carries
   a custom claim `active_tenant_id` (in `app_metadata` or
   `user_metadata`). `public.current_tenant_id()` reads it and RLS
   policies use it as the active tenant.
2. **`selected_fallback`** — preview only. When no JWT claim is present,
   the client queries `public.user_tenants` for the signed-in user and
   uses the first row. This is RLS-safe because the query runs as the
   signed-in user with their bearer token — it cannot reveal another
   tenant's rows. It is NOT a substitute for the JWT claim in production.

Phase 2.1.2B uses the fallback for the dry run. Wiring the JWT custom
claim happens in a later phase (Phase 2.1.3+) via a server-side Auth Hook.

## Step 6 — Re-run the dry run

From `/system-data-mode`, click **Run Read-Only Backend Checks** and
**Run Write Readiness Checks**. With a signed-in user and a bootstrapped
tenant the expected result is:

- connection: pass
- auth session: pass
- tenant membership: pass (via fallback)
- schema visibility / RLS: pass
- required RPC existence: pass
- account purpose readiness: 9 mapped, 0 missing
- numbering readiness: settings row present, sequences lazy
- write RPC readiness: all 5 RPCs available, writes disabled

No accounting write RPC is executed.

## Step 7 — Sign out

Click **Sign out backend** to clear the backend session. The mock Owner
demo session is unaffected.

## Why writes remain disabled

`BACKEND_WRITES_ENABLED` controls whether the main UI is allowed to
invoke accounting write RPCs (`invoice_issue`,
`receipt_create_with_auto_apply`, `payment_create_with_posting`,
`journal_post_manual`, `quotation_convert_to_invoice`). Even with a
signed-in user, a bootstrapped tenant, and green readiness checks, the
business-side rollout (Phase 2.2+) is what flips this flag — not the
auth/bootstrap milestone.


---

## Phase 2.1.2C addendum (First Owner Bootstrap Execution)

Phase 2.1.2C requires two operator actions inside `/system-data-mode` → BackendAuthSandbox:

1. Sign in (or sign up) the first real backend user with an owner-chosen password. The AI will never invent or print credentials.
2. Click **Bootstrap First Tenant** exactly once.

Expected bootstrap result creates: tenant, profile, `user_tenants` membership, `owner` role, `settings_company`, `settings_tax`, `settings_numbering`, default chart of accounts, `chart_account_purposes` mappings, and an audit log entry.

After completion, re-run the read-only Dry Run from the same page. Membership-dependent rows flip from `needs_auth` to PASS. `DATA_MODE` stays `demo` and `BACKEND_WRITES_ENABLED` stays `false`.

---

## Phase 2.1.2C Retry note (auth.users = 0 at re-verification)

No real backend user is signed in yet. Owner must complete sign-in and Bootstrap First Tenant via `/system-data-mode` → BackendAuthSandbox before this phase can be marked Ready. DATA_MODE remains `demo`; BACKEND_WRITES_ENABLED remains `false`; no writes executed; no credentials fabricated.
