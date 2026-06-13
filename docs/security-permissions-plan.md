# JAAD CLOUD — Security & Permissions Plan (Phase 1.5)

## Identity & tenancy
- Identity: Supabase `auth.users` + `public.profiles`.
- Membership: `user_tenants(user_id, tenant_id, role)`.
- Active tenant: stored in JWT custom claim `active_tenant_id` (set on tenant switch via server fn). Server-side policies read it via `auth.jwt() ->> 'active_tenant_id'`.
- Roles in dedicated `user_roles` table; checked through SECURITY DEFINER `public.has_role(_user uuid, _tenant uuid, _role app_role)` to avoid recursive RLS.

## Role matrix

| Capability | owner | accountant | sales | viewer |
|---|---|---|---|---|
| Tenant settings | ✓ | – | – | – |
| Users & roles | ✓ | – | – | – |
| Customers CRUD | ✓ | ✓ | ✓ | read |
| Suppliers CRUD | ✓ | ✓ | – | read |
| Items CRUD | ✓ | ✓ | read | read |
| Quotations CRUD/send | ✓ | ✓ | ✓ | read |
| Invoice draft | ✓ | ✓ | ✓ | read |
| Invoice issue/cancel | ✓ | ✓ | – | – |
| Receipts | ✓ | ✓ | – | read |
| Payments | ✓ | ✓ | – | read |
| Chart of accounts | ✓ | ✓ | – | read |
| Journal manual/post | ✓ | ✓ | – | read |
| Tasks | ✓ | ✓ | ✓ | read |
| Reports | ✓ | ✓ | sales-only | read |
| Audit log | ✓ | ✓ | – | – |
| Demo reset / data mode | ✓ | – | – | – |

## RLS pattern (every business table)

```sql
alter table public.<t> enable row level security;

create policy "<t>_select_member"
  on public.<t> for select to authenticated
  using (tenant_id = (auth.jwt() ->> 'active_tenant_id')::uuid
         and exists (select 1 from public.user_tenants
                     where user_id = auth.uid() and tenant_id = <t>.tenant_id));

create policy "<t>_write_role"
  on public.<t> for insert to authenticated
  with check (tenant_id = (auth.jwt() ->> 'active_tenant_id')::uuid
              and (public.has_role(auth.uid(), tenant_id, 'owner')
                   or public.has_role(auth.uid(), tenant_id, 'accountant')
                   or public.has_role(auth.uid(), tenant_id, '<extra>')));
-- analogous update / delete policies; archive flag preferred over delete.
```

Grants (mandatory, public-schema):
```
grant select, insert, update on public.<t> to authenticated;
grant all on public.<t> to service_role;
```

## Tenant-scoped invariants
- Document numbers: unique per `(tenant_id, number)` via DB constraint AND issued by `NumberingService` in a transaction.
- No cross-tenant FK traversal: every fk target is filtered by RLS on its own table.
- Audit logs: insert by authenticated for own tenant; no update/delete except service_role.
- Posted journal entries: trigger blocks UPDATE/DELETE when `status = 'posted'`.
- Invoice immutability after issue: trigger blocks line edits when status ≠ 'draft'.

## Sensitive operations (server-only)
- Tenant create, user invite, role grant: `createServerFn` + `requireSupabaseAuth` + `has_role(..., 'owner')`.
- Migration snapshot export/import: service_role inside server fn; only callable by owner.
- Demo reset: only in demo mode; disabled when `DATA_MODE = 'backend'`.

## Auth events
Logged via `audit_logs`: `auth.login`, `auth.logout`, `auth.tenant_switch`, `auth.role_changed`, `auth.password_reset_requested`.
