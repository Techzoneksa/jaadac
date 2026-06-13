-- JAAD CLOUD — Phase 2.1.2A: apply all 7 runnable migrations in order
-- Files combined: 20260611120001..20260611120007. Idempotent guards used where present.

create extension if not exists "pgcrypto";

-- ============= ENUMS =============
do $$ begin create type public.app_role as enum ('owner','accountant','sales','viewer'); exception when duplicate_object then null; end $$;
do $$ begin create type public.quotation_status as enum ('draft','sent','accepted','rejected','converted','expired'); exception when duplicate_object then null; end $$;
do $$ begin create type public.invoice_status as enum ('draft','sent','official','partially_paid','fully_paid','cancelled'); exception when duplicate_object then null; end $$;
do $$ begin create type public.journal_status as enum ('draft','posted'); exception when duplicate_object then null; end $$;
do $$ begin create type public.account_type as enum ('asset','liability','equity','revenue','expense'); exception when duplicate_object then null; end $$;
do $$ begin create type public.payment_method as enum ('cash','bank','card','transfer'); exception when duplicate_object then null; end $$;
do $$ begin create type public.task_status as enum ('task_new','in_progress','completed','deferred'); exception when duplicate_object then null; end $$;
do $$ begin create type public.task_priority as enum ('low','med','high'); exception when duplicate_object then null; end $$;

-- ============= TENANTS / PROFILES / MEMBERSHIP =============
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null, name_en text not null,
  country text not null default 'SA', currency text not null default 'SAR',
  vat_number text, cr_number text,
  is_demo boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, email text, phone text, avatar_url text,
  lang text not null default 'ar',
  created_at timestamptz not null default now()
);

create table public.user_tenants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  is_default boolean not null default false,
  joined_at timestamptz not null default now(),
  unique (user_id, tenant_id)
);
create index on public.user_tenants (tenant_id);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, tenant_id, role)
);
create index on public.user_roles (tenant_id, role);

-- ============= HELPER FUNCTIONS =============
create or replace function public.current_tenant_id() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'active_tenant_id','')::uuid
$$;

create or replace function public.is_tenant_member(_tenant uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_tenants where user_id = auth.uid() and tenant_id = _tenant)
$$;

create or replace function public.has_role(_user uuid, _tenant uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user and tenant_id = _tenant and role = _role)
$$;

-- ============= BUSINESS TABLES =============
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  code text, name_ar text not null, name_en text,
  phone text, email text, vat_number text, address text,
  opening_balance numeric(14,2) not null default 0,
  notes text, archived_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz,
  created_by uuid,
  unique (tenant_id, code)
);
create index on public.customers (tenant_id, name_ar);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  code text, name_ar text not null, name_en text,
  phone text, email text, vat_number text, address text,
  opening_balance numeric(14,2) not null default 0,
  notes text, archived_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz,
  unique (tenant_id, code)
);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  sku text, name_ar text not null, name_en text,
  type text not null default 'product' check (type in ('product','service')),
  unit text,
  price numeric(14,2) not null default 0,
  cost numeric(14,2) not null default 0,
  vat_rate numeric(5,2) not null default 15,
  archived_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz,
  unique (tenant_id, sku)
);

create table public.quotations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  number text not null,
  customer_id uuid not null references public.customers(id),
  date date not null, valid_until date,
  status public.quotation_status not null default 'draft',
  discount numeric(14,2) not null default 0,
  notes text, terms text,
  converted_invoice_id uuid,
  created_at timestamptz not null default now(), updated_at timestamptz,
  created_by uuid,
  unique (tenant_id, number)
);
create index on public.quotations (tenant_id, status, date desc);

create table public.quotation_lines (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations(id) on delete cascade,
  item_id uuid references public.items(id),
  description text,
  qty numeric(14,3) not null default 1,
  unit_price numeric(14,2) not null default 0,
  discount numeric(14,2) not null default 0,
  vat_rate numeric(5,2) not null default 15
);
create index on public.quotation_lines (quotation_id);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  number text not null,
  customer_id uuid not null references public.customers(id),
  date date not null, due date,
  status public.invoice_status not null default 'draft',
  discount numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  paid numeric(14,2) not null default 0,
  notes text, terms text,
  issued_at timestamptz, cancelled_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz,
  created_by uuid,
  unique (tenant_id, number),
  check (paid >= 0), check (total >= 0), check (paid <= total)
);
create index on public.invoices (tenant_id, status, date desc);
create index on public.invoices (customer_id);

alter table public.quotations
  add constraint quotations_converted_invoice_fk
  foreign key (converted_invoice_id) references public.invoices(id) on delete set null;

create table public.invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  item_id uuid references public.items(id),
  description text,
  qty numeric(14,3) not null default 1,
  unit_price numeric(14,2) not null default 0,
  discount numeric(14,2) not null default 0,
  vat_rate numeric(5,2) not null default 15
);
create index on public.invoice_lines (invoice_id);

create table public.receipts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  number text not null,
  customer_id uuid not null references public.customers(id),
  invoice_id uuid references public.invoices(id),
  date date not null,
  amount numeric(14,2) not null check (amount > 0),
  method public.payment_method not null default 'cash',
  reference text, notes text,
  created_at timestamptz not null default now(),
  unique (tenant_id, number)
);
create index on public.receipts (invoice_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  number text not null,
  supplier_id uuid references public.suppliers(id),
  payee text, date date not null,
  amount numeric(14,2) not null check (amount > 0),
  vat_amount numeric(14,2) not null default 0,
  category text,
  method public.payment_method not null default 'cash',
  reference text, notes text,
  created_at timestamptz not null default now(),
  unique (tenant_id, number)
);

create table public.chart_accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  code text not null, name_ar text not null, name_en text,
  type public.account_type not null,
  parent_id uuid references public.chart_accounts(id),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  unique (tenant_id, code)
);

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  number text not null,
  date date not null, description text,
  status public.journal_status not null default 'draft',
  source text, source_type text not null default 'manual', source_id uuid,
  created_at timestamptz not null default now(), posted_at timestamptz,
  unique (tenant_id, number)
);
create unique index journal_entries_source_idem
  on public.journal_entries (tenant_id, source_type, source_id)
  where source_id is not null and source_type <> 'manual';

create table public.journal_entry_lines (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.journal_entries(id) on delete cascade,
  account_id uuid not null references public.chart_accounts(id),
  debit numeric(14,2) not null default 0,
  credit numeric(14,2) not null default 0,
  description text,
  check (debit >= 0 and credit >= 0),
  check (debit = 0 or credit = 0)
);
create index on public.journal_entry_lines (entry_id);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  title text not null, description text,
  assignee_id uuid references public.profiles(id),
  due_date date,
  priority public.task_priority not null default 'med',
  status public.task_status not null default 'task_new',
  created_by uuid,
  created_at timestamptz not null default now(), updated_at timestamptz
);
create index on public.tasks (tenant_id, status);

create table public.settings_company (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  name_ar text, name_en text,
  vat_number text, cr_number text,
  phone text, email text, address text, logo_url text
);

create table public.settings_tax (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  vat_rate numeric(5,2) not null default 15,
  vat_inclusive boolean not null default false,
  currency text not null default 'SAR'
);

create table public.settings_numbering (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  quotation text not null default 'Q-',
  invoice text not null default 'INV-',
  receipt text not null default 'RV-',
  payment text not null default 'PV-',
  journal text not null default 'JE-'
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid references public.profiles(id),
  action text not null,
  entity_type text, entity_id uuid,
  description_ar text, description_en text,
  created_at timestamptz not null default now()
);
create index on public.audit_logs (tenant_id, created_at desc);
create index on public.audit_logs (entity_type, entity_id);

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  entity_type text not null, entity_id uuid not null,
  storage_path text not null, mime text, size_bytes bigint,
  uploaded_by uuid,
  created_at timestamptz not null default now()
);

create table public.migration_snapshots (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  schema_version int not null,
  exported_at timestamptz not null default now(),
  payload jsonb not null
);

-- ============= GRANTS =============
do $$
declare t text;
begin
  for t in select unnest(array[
    'tenants','profiles','user_tenants','user_roles',
    'customers','suppliers','items',
    'quotations','quotation_lines','invoices','invoice_lines',
    'receipts','payments',
    'chart_accounts','journal_entries','journal_entry_lines',
    'tasks','settings_company','settings_tax','settings_numbering',
    'audit_logs','attachments','migration_snapshots'
  ]) loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
end $$;

-- ============================================================================
-- FILE 2: triggers/safety
-- ============================================================================
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

do $$
declare t text;
begin
  for t in select unnest(array['tenants','customers','suppliers','items','quotations','invoices','tasks']) loop
    execute format('create trigger trg_%1$s_touch before update on public.%1$I
      for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

create or replace function public.guard_posted_journal() returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' and old.status = 'posted' then
    if new.status <> 'posted' or new.date <> old.date or new.number <> old.number
       or coalesce(new.description,'') <> coalesce(old.description,'') then
      raise exception 'posted_locked: journal entry is posted and immutable';
    end if;
  end if;
  if tg_op = 'DELETE' and old.status = 'posted' then
    raise exception 'posted_locked: cannot delete a posted journal entry';
  end if;
  return case when tg_op='DELETE' then old else new end;
end $$;
create trigger trg_journal_guard before update or delete on public.journal_entries
  for each row execute function public.guard_posted_journal();

create or replace function public.guard_posted_journal_lines() returns trigger language plpgsql as $$
declare st public.journal_status;
begin
  select status into st from public.journal_entries where id = coalesce(new.entry_id, old.entry_id);
  if st = 'posted' then
    raise exception 'posted_locked: cannot modify lines of a posted journal entry';
  end if;
  return case when tg_op='DELETE' then old else new end;
end $$;
create trigger trg_journal_lines_guard before insert or update or delete on public.journal_entry_lines
  for each row execute function public.guard_posted_journal_lines();

create or replace function public.assert_balanced_before_post() returns trigger language plpgsql as $$
declare d numeric(14,2); c numeric(14,2);
begin
  if new.status='posted' and coalesce(old.status,'draft') <> 'posted' then
    select coalesce(sum(debit),0), coalesce(sum(credit),0) into d,c
      from public.journal_entry_lines where entry_id = new.id;
    if d <> c or d = 0 then
      raise exception 'unbalanced_entry: debit=% credit=%', d, c;
    end if;
    new.posted_at := now();
  end if;
  return new;
end $$;
create trigger trg_journal_balance before update on public.journal_entries
  for each row execute function public.assert_balanced_before_post();

create or replace function public.guard_issued_invoice() returns trigger language plpgsql as $$
begin
  if old.status in ('official','partially_paid','fully_paid','cancelled') then
    if new.total <> old.total or new.discount <> old.discount
       or new.customer_id <> old.customer_id or new.date <> old.date
       or new.number <> old.number then
      raise exception 'edit_locked: invoice is issued and core fields are locked';
    end if;
  end if;
  return new;
end $$;
create trigger trg_invoice_guard before update on public.invoices
  for each row execute function public.guard_issued_invoice();

create or replace function public.guard_issued_invoice_lines() returns trigger language plpgsql as $$
declare st public.invoice_status;
begin
  select status into st from public.invoices where id = coalesce(new.invoice_id, old.invoice_id);
  if st <> 'draft' then
    raise exception 'edit_locked: cannot modify lines of an issued invoice';
  end if;
  return case when tg_op='DELETE' then old else new end;
end $$;
create trigger trg_invoice_lines_guard before insert or update or delete on public.invoice_lines
  for each row execute function public.guard_issued_invoice_lines();

-- ============================================================================
-- FILE 3: RLS policies
-- ============================================================================
alter table public.profiles enable row level security;
create policy profiles_self_select on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_self_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

alter table public.tenants enable row level security;
create policy tenants_member_select on public.tenants for select to authenticated using (public.is_tenant_member(id));
create policy tenants_owner_update on public.tenants for update to authenticated
  using (public.has_role(auth.uid(), id, 'owner'))
  with check (public.has_role(auth.uid(), id, 'owner'));

alter table public.user_tenants enable row level security;
create policy ut_select on public.user_tenants for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), tenant_id, 'owner'));
create policy ut_owner_write on public.user_tenants for all to authenticated
  using (public.has_role(auth.uid(), tenant_id, 'owner'))
  with check (public.has_role(auth.uid(), tenant_id, 'owner'));

alter table public.user_roles enable row level security;
create policy ur_select on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), tenant_id, 'owner'));
create policy ur_owner_write on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(), tenant_id, 'owner'))
  with check (public.has_role(auth.uid(), tenant_id, 'owner'));

do $$
declare t text;
begin
  for t in select unnest(array[
    'customers','suppliers','items','quotations','quotation_lines',
    'invoices','invoice_lines','receipts','payments',
    'chart_accounts','journal_entries','journal_entry_lines',
    'tasks','settings_company','settings_tax','settings_numbering',
    'attachments','migration_snapshots','audit_logs'
  ]) loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

create policy customers_select on public.customers for select to authenticated using (public.is_tenant_member(tenant_id));
create policy customers_write on public.customers for all to authenticated
  using (public.has_role(auth.uid(),tenant_id,'owner') or public.has_role(auth.uid(),tenant_id,'accountant') or public.has_role(auth.uid(),tenant_id,'sales'))
  with check (public.has_role(auth.uid(),tenant_id,'owner') or public.has_role(auth.uid(),tenant_id,'accountant') or public.has_role(auth.uid(),tenant_id,'sales'));

create policy suppliers_select on public.suppliers for select to authenticated using (public.is_tenant_member(tenant_id));
create policy suppliers_write on public.suppliers for all to authenticated
  using (public.has_role(auth.uid(),tenant_id,'owner') or public.has_role(auth.uid(),tenant_id,'accountant'))
  with check (public.has_role(auth.uid(),tenant_id,'owner') or public.has_role(auth.uid(),tenant_id,'accountant'));

create policy items_select on public.items for select to authenticated using (public.is_tenant_member(tenant_id));
create policy items_write on public.items for all to authenticated
  using (public.has_role(auth.uid(),tenant_id,'owner') or public.has_role(auth.uid(),tenant_id,'accountant'))
  with check (public.has_role(auth.uid(),tenant_id,'owner') or public.has_role(auth.uid(),tenant_id,'accountant'));

create policy quotations_select on public.quotations for select to authenticated using (public.is_tenant_member(tenant_id));
create policy quotations_write on public.quotations for all to authenticated
  using (public.has_role(auth.uid(),tenant_id,'owner') or public.has_role(auth.uid(),tenant_id,'accountant') or public.has_role(auth.uid(),tenant_id,'sales'))
  with check (public.has_role(auth.uid(),tenant_id,'owner') or public.has_role(auth.uid(),tenant_id,'accountant') or public.has_role(auth.uid(),tenant_id,'sales'));

create policy qlines_select on public.quotation_lines for select to authenticated
  using (exists (select 1 from public.quotations q where q.id=quotation_id and public.is_tenant_member(q.tenant_id)));
create policy qlines_write on public.quotation_lines for all to authenticated
  using (exists (select 1 from public.quotations q where q.id=quotation_id and
    (public.has_role(auth.uid(),q.tenant_id,'owner') or public.has_role(auth.uid(),q.tenant_id,'accountant') or public.has_role(auth.uid(),q.tenant_id,'sales'))))
  with check (exists (select 1 from public.quotations q where q.id=quotation_id and
    (public.has_role(auth.uid(),q.tenant_id,'owner') or public.has_role(auth.uid(),q.tenant_id,'accountant') or public.has_role(auth.uid(),q.tenant_id,'sales'))));

create policy invoices_select on public.invoices for select to authenticated using (public.is_tenant_member(tenant_id));
create policy invoices_write on public.invoices for all to authenticated
  using (public.has_role(auth.uid(),tenant_id,'owner') or public.has_role(auth.uid(),tenant_id,'accountant') or public.has_role(auth.uid(),tenant_id,'sales'))
  with check (public.has_role(auth.uid(),tenant_id,'owner') or public.has_role(auth.uid(),tenant_id,'accountant') or public.has_role(auth.uid(),tenant_id,'sales'));

create policy ilines_select on public.invoice_lines for select to authenticated
  using (exists (select 1 from public.invoices i where i.id=invoice_id and public.is_tenant_member(i.tenant_id)));
create policy ilines_write on public.invoice_lines for all to authenticated
  using (exists (select 1 from public.invoices i where i.id=invoice_id and
    (public.has_role(auth.uid(),i.tenant_id,'owner') or public.has_role(auth.uid(),i.tenant_id,'accountant') or public.has_role(auth.uid(),i.tenant_id,'sales'))))
  with check (exists (select 1 from public.invoices i where i.id=invoice_id and
    (public.has_role(auth.uid(),i.tenant_id,'owner') or public.has_role(auth.uid(),i.tenant_id,'accountant') or public.has_role(auth.uid(),i.tenant_id,'sales'))));

create policy receipts_select on public.receipts for select to authenticated using (public.is_tenant_member(tenant_id));
create policy receipts_write on public.receipts for all to authenticated
  using (public.has_role(auth.uid(),tenant_id,'owner') or public.has_role(auth.uid(),tenant_id,'accountant'))
  with check (public.has_role(auth.uid(),tenant_id,'owner') or public.has_role(auth.uid(),tenant_id,'accountant'));

create policy payments_select on public.payments for select to authenticated using (public.is_tenant_member(tenant_id));
create policy payments_write on public.payments for all to authenticated
  using (public.has_role(auth.uid(),tenant_id,'owner') or public.has_role(auth.uid(),tenant_id,'accountant'))
  with check (public.has_role(auth.uid(),tenant_id,'owner') or public.has_role(auth.uid(),tenant_id,'accountant'));

create policy accounts_select on public.chart_accounts for select to authenticated using (public.is_tenant_member(tenant_id));
create policy accounts_write on public.chart_accounts for all to authenticated
  using (public.has_role(auth.uid(),tenant_id,'owner') or public.has_role(auth.uid(),tenant_id,'accountant'))
  with check (public.has_role(auth.uid(),tenant_id,'owner') or public.has_role(auth.uid(),tenant_id,'accountant'));

create policy journal_select on public.journal_entries for select to authenticated using (public.is_tenant_member(tenant_id));
create policy journal_write on public.journal_entries for all to authenticated
  using (public.has_role(auth.uid(),tenant_id,'owner') or public.has_role(auth.uid(),tenant_id,'accountant'))
  with check (public.has_role(auth.uid(),tenant_id,'owner') or public.has_role(auth.uid(),tenant_id,'accountant'));

create policy jlines_select on public.journal_entry_lines for select to authenticated
  using (exists (select 1 from public.journal_entries j where j.id=entry_id and public.is_tenant_member(j.tenant_id)));
create policy jlines_write on public.journal_entry_lines for all to authenticated
  using (exists (select 1 from public.journal_entries j where j.id=entry_id and
    (public.has_role(auth.uid(),j.tenant_id,'owner') or public.has_role(auth.uid(),j.tenant_id,'accountant'))))
  with check (exists (select 1 from public.journal_entries j where j.id=entry_id and
    (public.has_role(auth.uid(),j.tenant_id,'owner') or public.has_role(auth.uid(),j.tenant_id,'accountant'))));

create policy tasks_select on public.tasks for select to authenticated using (public.is_tenant_member(tenant_id));
create policy tasks_write on public.tasks for all to authenticated
  using (public.has_role(auth.uid(),tenant_id,'owner') or public.has_role(auth.uid(),tenant_id,'accountant') or public.has_role(auth.uid(),tenant_id,'sales'))
  with check (public.has_role(auth.uid(),tenant_id,'owner') or public.has_role(auth.uid(),tenant_id,'accountant') or public.has_role(auth.uid(),tenant_id,'sales'));

do $$
declare t text;
begin
  for t in select unnest(array['settings_company','settings_tax','settings_numbering']) loop
    execute format($f$create policy %1$s_select on public.%1$I for select to authenticated
      using (public.is_tenant_member(tenant_id))$f$, t);
    execute format($f$create policy %1$s_write on public.%1$I for all to authenticated
      using (public.has_role(auth.uid(), tenant_id, 'owner'))
      with check (public.has_role(auth.uid(), tenant_id, 'owner'))$f$, t);
  end loop;
end $$;

create policy audit_select on public.audit_logs for select to authenticated
  using (public.has_role(auth.uid(),tenant_id,'owner') or public.has_role(auth.uid(),tenant_id,'accountant'));
create policy audit_insert on public.audit_logs for insert to authenticated
  with check (public.is_tenant_member(tenant_id) and user_id = auth.uid());

create policy attachments_select on public.attachments for select to authenticated using (public.is_tenant_member(tenant_id));
create policy attachments_write on public.attachments for all to authenticated
  using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id));

create policy snaps_owner on public.migration_snapshots for all to authenticated
  using (public.has_role(auth.uid(),tenant_id,'owner'))
  with check (public.has_role(auth.uid(),tenant_id,'owner'));

-- ============================================================================
-- FILE 4: tenant bootstrap (function bodies reference legacy schema names;
-- created with CREATE OR REPLACE — PL/pgSQL does not validate table refs at
-- creation time, only at runtime. Functions are not invoked in this phase.)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.seed_default_chart_of_accounts(p_tenant_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF p_tenant_id IS NULL THEN RAISE EXCEPTION 'p_tenant_id is required'; END IF;
  INSERT INTO public.chart_accounts (tenant_id, code, name_ar, name_en, type)
  VALUES
    (p_tenant_id, '1000', 'النقدية',               'Cash',         'asset'),
    (p_tenant_id, '1100', 'البنوك',                'Bank',         'asset'),
    (p_tenant_id, '1200', 'العملاء',               'Receivables',  'asset'),
    (p_tenant_id, '1300', 'ضريبة المدخلات',        'VAT Input',    'asset'),
    (p_tenant_id, '1400', 'المخزون',               'Inventory',    'asset'),
    (p_tenant_id, '2100', 'الموردون',              'Payables',     'liability'),
    (p_tenant_id, '2300', 'ضريبة القيمة المضافة',  'VAT Payable',  'liability'),
    (p_tenant_id, '3000', 'حقوق الملكية',         'Equity',       'equity'),
    (p_tenant_id, '4000', 'الإيرادات',             'Revenue',      'revenue'),
    (p_tenant_id, '5000', 'المصروفات',             'Expenses',     'expense')
  ON CONFLICT DO NOTHING;
END; $$;

CREATE OR REPLACE FUNCTION public.create_default_chart_accounts(p_tenant_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp
AS $$ SELECT public.seed_default_chart_of_accounts(p_tenant_id); $$;

CREATE OR REPLACE FUNCTION public.create_default_settings(
  p_tenant_id uuid,
  p_vat_rate  numeric DEFAULT 0.15,
  p_currency  text    DEFAULT 'SAR',
  p_locale    text    DEFAULT 'ar'
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_tenant_id IS NULL THEN RAISE EXCEPTION 'p_tenant_id is required'; END IF;
  INSERT INTO public.settings_tax (tenant_id, vat_rate, currency)
  VALUES (p_tenant_id, p_vat_rate*100, p_currency)
  ON CONFLICT (tenant_id) DO NOTHING;
  INSERT INTO public.settings_numbering (tenant_id) VALUES (p_tenant_id)
  ON CONFLICT (tenant_id) DO NOTHING;
END; $$;

CREATE OR REPLACE FUNCTION public.ensure_profile_for_auth_user(
  p_user_id uuid, p_full_name text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_user_id IS NULL THEN RAISE EXCEPTION 'p_user_id is required'; END IF;
  INSERT INTO public.profiles (id, full_name) VALUES (p_user_id, p_full_name)
  ON CONFLICT (id) DO NOTHING;
END; $$;

CREATE OR REPLACE FUNCTION public.bootstrap_tenant_for_user(
  p_user_id  uuid,
  p_name_ar  text,
  p_name_en  text,
  p_currency text DEFAULT 'SAR',
  p_vat_rate numeric DEFAULT 0.15,
  p_locale   text DEFAULT 'ar'
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_tenant_id uuid;
  v_caller    uuid;
  v_existing  uuid;
BEGIN
  IF p_user_id IS NULL THEN RAISE EXCEPTION 'p_user_id is required'; END IF;
  IF coalesce(trim(p_name_en), '') = '' OR coalesce(trim(p_name_ar), '') = '' THEN
    RAISE EXCEPTION 'tenant name (ar/en) is required';
  END IF;

  v_caller := auth.uid();
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'auth.uid() is required to bootstrap a tenant';
  END IF;
  IF v_caller <> p_user_id THEN
    RAISE EXCEPTION 'caller cannot bootstrap a tenant for another user';
  END IF;

  SELECT t.id INTO v_existing
  FROM public.tenants t
  JOIN public.user_roles ur
    ON ur.tenant_id = t.id AND ur.user_id = p_user_id AND ur.role = 'owner'::app_role
  WHERE t.name_en = p_name_en
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('tenant_id', v_existing, 'ok', true, 'reused', true);
  END IF;

  INSERT INTO public.tenants (name_ar, name_en, currency)
  VALUES (p_name_ar, p_name_en, p_currency)
  RETURNING id INTO v_tenant_id;

  PERFORM public.ensure_profile_for_auth_user(p_user_id, COALESCE(p_name_en, p_name_ar));

  INSERT INTO public.user_tenants (user_id, tenant_id)
  VALUES (p_user_id, v_tenant_id) ON CONFLICT DO NOTHING;

  INSERT INTO public.user_roles (user_id, tenant_id, role)
  VALUES (p_user_id, v_tenant_id, 'owner'::app_role) ON CONFLICT DO NOTHING;

  PERFORM public.create_default_settings(v_tenant_id, p_vat_rate, p_currency, p_locale);
  PERFORM public.create_default_chart_accounts(v_tenant_id);

  INSERT INTO public.audit_logs (tenant_id, user_id, action, entity_type, description_ar, description_en)
  VALUES (v_tenant_id, p_user_id, 'tenant.bootstrap', 'tenant',
          'تجهيز المؤسسة الأولية', 'Initial tenant bootstrap');

  RETURN jsonb_build_object('tenant_id', v_tenant_id, 'ok', true, 'reused', false);
END; $$;

REVOKE ALL ON FUNCTION public.bootstrap_tenant_for_user(uuid, text, text, text, numeric, text) FROM public;
GRANT EXECUTE ON FUNCTION public.bootstrap_tenant_for_user(uuid, text, text, text, numeric, text) TO authenticated;
REVOKE ALL ON FUNCTION public.create_default_settings(uuid, numeric, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.create_default_settings(uuid, numeric, text, text) TO authenticated;
REVOKE ALL ON FUNCTION public.create_default_chart_accounts(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.create_default_chart_accounts(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.ensure_profile_for_auth_user(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.ensure_profile_for_auth_user(uuid, text) TO authenticated;

-- ============================================================================
-- FILE 5: write RPC functions
-- ============================================================================
create or replace function public._jaad_require_tenant()
returns uuid language plpgsql stable security definer set search_path = public, pg_temp as $$
declare _u uuid; _t uuid;
begin
  _u := auth.uid();
  if _u is null then raise exception 'unauthenticated' using errcode='28000'; end if;
  _t := public.current_tenant_id();
  if _t is null then raise exception 'no_active_tenant' using errcode='28000'; end if;
  if not public.is_tenant_member(_t) then raise exception 'not_tenant_member' using errcode='42501'; end if;
  return _t;
end $$;

create or replace function public._jaad_require_role(_role public.app_role)
returns void language plpgsql stable security definer set search_path = public, pg_temp as $$
declare _t uuid;
begin
  _t := public._jaad_require_tenant();
  if not (public.has_role(auth.uid(),_t,_role) or public.has_role(auth.uid(),_t,'owner'::public.app_role)) then
    raise exception 'forbidden_role:%', _role using errcode='42501';
  end if;
end $$;

create or replace function public._jaad_audit(
  _tenant uuid, _action text, _entity text, _entity_id uuid, _ar text, _en text
) returns void language sql security definer set search_path = public, pg_temp as $$
  insert into public.audit_logs (tenant_id, user_id, action, entity_type, entity_id, description_ar, description_en)
  values (_tenant, auth.uid(), _action, _entity, _entity_id, _ar, _en);
$$;

create or replace function public._jaad_next_number(_tenant uuid, _kind text)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare _prefix text; _seq int; _y text;
begin
  select case _kind
    when 'invoice'   then coalesce(invoice,'INV-')
    when 'receipt'   then coalesce(receipt,'RV-')
    when 'payment'   then coalesce(payment,'PV-')
    when 'journal'   then coalesce(journal,'JE-')
    when 'quotation' then coalesce(quotation,'Q-')
  end into _prefix from public.settings_numbering where tenant_id=_tenant;
  _prefix := coalesce(_prefix, upper(left(_kind,3))||'-');
  _y := to_char(now(),'YYYY');
  case _kind
    when 'invoice'   then select count(*)+1 into _seq from public.invoices         where tenant_id=_tenant;
    when 'receipt'   then select count(*)+1 into _seq from public.receipts         where tenant_id=_tenant;
    when 'payment'   then select count(*)+1 into _seq from public.payments         where tenant_id=_tenant;
    when 'journal'   then select count(*)+1 into _seq from public.journal_entries  where tenant_id=_tenant;
    when 'quotation' then select count(*)+1 into _seq from public.quotations       where tenant_id=_tenant;
  end case;
  return _prefix || _y || '-' || lpad(_seq::text,5,'0');
end $$;

-- placeholder write RPCs replaced by hardened versions in FILE 6/7. Keeping
-- minimal stubs here would shadow the harder versions, so we skip directly to
-- FILE 6 hardening which redefines them.

-- ============================================================================
-- FILE 6: write RPC hardening (document_number_sequences + _jaad_get_account
-- + hardened write RPCs with JSON error envelope)
-- ============================================================================
create table if not exists public.document_number_sequences (
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  doc_type   text not null check (doc_type in ('quotation','invoice','receipt','payment','journal')),
  year       int  not null,
  last_value bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (tenant_id, doc_type, year)
);
grant select, insert, update, delete on public.document_number_sequences to authenticated;
grant all on public.document_number_sequences to service_role;
alter table public.document_number_sequences enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='document_number_sequences' and policyname='dns_member_select') then
    create policy dns_member_select on public.document_number_sequences for select
      to authenticated using (public.is_tenant_member(tenant_id));
  end if;
end $$;

create or replace function public._jaad_next_number(_tenant uuid, _kind text)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare _prefix text; _y int := extract(year from now())::int; _next bigint;
begin
  select case _kind
    when 'invoice'   then coalesce(invoice,'INV-')
    when 'receipt'   then coalesce(receipt,'RV-')
    when 'payment'   then coalesce(payment,'PV-')
    when 'journal'   then coalesce(journal,'JE-')
    when 'quotation' then coalesce(quotation,'Q-')
  end into _prefix from public.settings_numbering where tenant_id = _tenant;
  _prefix := coalesce(_prefix, upper(left(_kind,3)) || '-');

  insert into public.document_number_sequences (tenant_id, doc_type, year, last_value)
  values (_tenant, _kind, _y, 1)
  on conflict (tenant_id, doc_type, year)
  do update set last_value = public.document_number_sequences.last_value + 1, updated_at = now()
  returning last_value into _next;

  return _prefix || _y::text || '-' || lpad(_next::text, 5, '0');
end $$;

create or replace function public._jaad_err(_code text, _ar text, _en text)
returns jsonb language sql immutable as $$
  select jsonb_build_object('ok', false, 'error',
    jsonb_build_object('code', _code, 'message_ar', _ar, 'message_en', _en));
$$;

-- ============================================================================
-- FILE 7: chart_account_purposes + final hardened RPCs and readiness helpers
-- ============================================================================
create table if not exists public.chart_account_purposes (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  purpose     text not null,
  account_id  uuid not null references public.chart_accounts(id) on delete restrict,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (tenant_id, purpose),
  check (purpose in (
    'cash','bank','accounts_receivable','vat_input','vat_payable',
    'revenue','expense','inventory','accounts_payable'
  ))
);

grant select, insert, update, delete on public.chart_account_purposes to authenticated;
grant all on public.chart_account_purposes to service_role;

alter table public.chart_account_purposes enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='chart_account_purposes' and policyname='cap_member_select') then
    create policy cap_member_select on public.chart_account_purposes for select
      to authenticated using (public.is_tenant_member(tenant_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='chart_account_purposes' and policyname='cap_owner_accountant_write') then
    create policy cap_owner_accountant_write on public.chart_account_purposes for all
      to authenticated
      using (public.has_role(auth.uid(), tenant_id, 'owner'::public.app_role)
          or public.has_role(auth.uid(), tenant_id, 'accountant'::public.app_role))
      with check (public.has_role(auth.uid(), tenant_id, 'owner'::public.app_role)
               or public.has_role(auth.uid(), tenant_id, 'accountant'::public.app_role));
  end if;
end $$;

create or replace function public._cap_touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists trg_cap_touch on public.chart_account_purposes;
create trigger trg_cap_touch before update on public.chart_account_purposes
  for each row execute function public._cap_touch_updated_at();

create or replace function public._jaad_seed_default_purpose_mappings(_tenant uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  _pairs constant text[][] := array[
    array['cash','1000'], array['bank','1100'],
    array['accounts_receivable','1200'], array['accounts_payable','2100'],
    array['vat_input','1300'], array['vat_payable','2300'],
    array['revenue','4000'], array['expense','5000'],
    array['inventory','1400']
  ];
  _row text[]; _acc uuid;
begin
  if _tenant is null then return; end if;
  foreach _row slice 1 in array _pairs loop
    select id into _acc from public.chart_accounts
     where tenant_id=_tenant and code=_row[2] limit 1;
    if _acc is not null then
      insert into public.chart_account_purposes (tenant_id, purpose, account_id)
      values (_tenant, _row[1], _acc)
      on conflict (tenant_id, purpose) do nothing;
    end if;
  end loop;
end $$;

revoke all on function public._jaad_seed_default_purpose_mappings(uuid) from public;
grant execute on function public._jaad_seed_default_purpose_mappings(uuid) to authenticated, service_role;

create or replace function public._jaad_get_account(_tenant uuid, _purpose text)
returns uuid language plpgsql stable security definer set search_path = public, pg_temp as $$
declare _id uuid; _codes text[];
begin
  select account_id into _id from public.chart_account_purposes
   where tenant_id=_tenant and purpose=_purpose limit 1;
  if _id is not null then return _id; end if;

  _codes := case _purpose
    when 'cash'                then array['1000']
    when 'bank'                then array['1100']
    when 'accounts_receivable' then array['1200']
    when 'accounts_payable'    then array['2100']
    when 'vat_input'           then array['1300']
    when 'vat_payable'         then array['2300']
    when 'revenue'             then array['4000']
    when 'expense'             then array['5000']
    when 'inventory'           then array['1400']
    else array[]::text[]
  end;
  if array_length(_codes,1) is null then
    raise exception 'missing_account:%', _purpose using errcode='P0002';
  end if;
  select id into _id from public.chart_accounts
   where tenant_id=_tenant and code = any(_codes) limit 1;
  if _id is null then
    raise exception 'missing_account:%', _purpose using errcode='P0002';
  end if;
  return _id;
end $$;

-- hardened write RPCs (final versions)
create or replace function public.quotation_convert_to_invoice(_quotation_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare _tenant uuid; _q public.quotations%rowtype; _inv_id uuid; _inv_number text; _total numeric(14,2):=0;
begin
  _tenant := public._jaad_require_tenant();
  perform public._jaad_require_role('sales'::public.app_role);
  select * into _q from public.quotations where id=_quotation_id;
  if not found then return public._jaad_err('not_found','عرض السعر غير موجود','Quotation not found'); end if;
  if _q.tenant_id <> _tenant then return public._jaad_err('permission_denied','وصول عبر مؤسسات','Cross-tenant access'); end if;
  if _q.status not in ('accepted','sent') then return public._jaad_err('invalid_status','حالة عرض السعر لا تسمح بالتحويل','Quotation status not convertible'); end if;
  if _q.converted_invoice_id is not null then return public._jaad_err('duplicate_operation','تم تحويل عرض السعر مسبقًا','Quotation already converted'); end if;
  _inv_number := public._jaad_next_number(_tenant,'invoice');
  _inv_id := gen_random_uuid();
  insert into public.invoices (id, tenant_id, number, customer_id, date, status, discount, total, notes, terms, created_by)
  values (_inv_id, _tenant, _inv_number, _q.customer_id, current_date, 'draft', _q.discount, 0, _q.notes, _q.terms, auth.uid());
  insert into public.invoice_lines (invoice_id, item_id, description, qty, unit_price, discount, vat_rate)
  select _inv_id, item_id, description, qty, unit_price, discount, vat_rate
  from public.quotation_lines where quotation_id=_q.id;
  select coalesce(sum((qty*unit_price - discount)*(1+vat_rate/100.0)),0) into _total
  from public.invoice_lines where invoice_id=_inv_id;
  update public.invoices set total=_total - _q.discount where id=_inv_id;
  update public.quotations set status='converted', converted_invoice_id=_inv_id, updated_at=now() where id=_q.id;
  perform public._jaad_audit(_tenant,'quotation.convert','quotation',_q.id,
    'تحويل عرض سعر إلى فاتورة '||_inv_number,'Quotation converted to invoice '||_inv_number);
  return jsonb_build_object('ok',true,'data',jsonb_build_object('invoice_id',_inv_id,'invoice_number',_inv_number));
end $$;

create or replace function public.invoice_issue(_invoice_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare _tenant uuid; _inv public.invoices%rowtype; _je_id uuid;
        _ar_acc uuid; _rev_acc uuid; _vat_acc uuid;
        _subtotal numeric(14,2):=0; _vat numeric(14,2):=0; _lc int;
begin
  _tenant := public._jaad_require_tenant();
  perform public._jaad_require_role('accountant'::public.app_role);
  select * into _inv from public.invoices where id=_invoice_id;
  if not found then return public._jaad_err('not_found','الفاتورة غير موجودة','Invoice not found'); end if;
  if _inv.tenant_id <> _tenant then return public._jaad_err('permission_denied','وصول عبر مؤسسات','Cross-tenant access'); end if;
  if _inv.status not in ('draft','sent') then return public._jaad_err('invalid_status','حالة الفاتورة لا تسمح بالإصدار','Invoice not issuable'); end if;
  if _inv.issued_at is not null then return public._jaad_err('duplicate_operation','الفاتورة مُصدَرة مسبقًا','Invoice already issued'); end if;
  select count(*) into _lc from public.invoice_lines where invoice_id=_inv.id;
  if _lc=0 then return public._jaad_err('validation_failed','الفاتورة بلا بنود','Invoice has no lines'); end if;
  select coalesce(sum(qty*unit_price - discount),0),
         coalesce(sum((qty*unit_price - discount)*vat_rate/100.0),0)
    into _subtotal,_vat from public.invoice_lines where invoice_id=_inv.id;
  begin
    _ar_acc  := public._jaad_get_account(_tenant,'accounts_receivable');
    _rev_acc := public._jaad_get_account(_tenant,'revenue');
  exception when others then
    return public._jaad_err('missing_account','الحسابات المطلوبة غير موجودة','Required chart accounts missing');
  end;
  if _vat > 0 then
    begin _vat_acc := public._jaad_get_account(_tenant,'vat_payable');
    exception when others then
      return public._jaad_err('missing_account','حساب ضريبة المبيعات غير موجود','VAT payable account missing');
    end;
  end if;
  _je_id := gen_random_uuid();
  begin
    insert into public.journal_entries (id, tenant_id, number, date, description, status, source, source_type, source_id, posted_at)
    values (_je_id,_tenant,public._jaad_next_number(_tenant,'journal'),current_date,
            'Sales invoice '||_inv.number,'posted','sales_invoice','sales_invoice',_inv.id, now());
  exception when unique_violation then
    return public._jaad_err('duplicate_operation','تم ترحيل قيد لهذه الفاتورة مسبقًا','Journal already posted for this invoice');
  end;
  insert into public.journal_entry_lines (entry_id, account_id, debit, credit, description)
  values (_je_id,_ar_acc, _subtotal+_vat, 0,'AR — '||_inv.number);
  insert into public.journal_entry_lines (entry_id, account_id, debit, credit, description)
  values (_je_id,_rev_acc, 0, _subtotal,'Revenue — '||_inv.number);
  if _vat>0 then
    insert into public.journal_entry_lines (entry_id, account_id, debit, credit, description)
    values (_je_id,_vat_acc, 0, _vat,'VAT payable — '||_inv.number);
  end if;
  update public.invoices set status='official', issued_at=now(), total=_subtotal+_vat, updated_at=now() where id=_inv.id;
  perform public._jaad_audit(_tenant,'invoice.issue','invoice',_inv.id,
    'إصدار فاتورة '||_inv.number,'Invoice issued '||_inv.number);
  return jsonb_build_object('ok',true,'data',jsonb_build_object('invoice_id',_inv.id,'status','official','journal_entry_id',_je_id));
end $$;

create or replace function public.receipt_create_with_auto_apply(
  _customer_id uuid, _amount numeric,
  _method public.payment_method default 'cash',
  _invoice_id uuid default null, _reference text default null, _notes text default null
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare _tenant uuid; _rcpt_id uuid; _rcpt_no text;
        _inv public.invoices%rowtype; _new_paid numeric(14,2);
        _new_status public.invoice_status; _cash_acc uuid; _ar_acc uuid; _je_id uuid;
begin
  _tenant := public._jaad_require_tenant();
  perform public._jaad_require_role('accountant'::public.app_role);
  if _amount is null or _amount<=0 then return public._jaad_err('validation_failed','المبلغ غير صالح','Invalid amount'); end if;
  perform 1 from public.customers where id=_customer_id and tenant_id=_tenant;
  if not found then return public._jaad_err('not_found','العميل غير موجود','Customer not found'); end if;
  if _invoice_id is not null then
    select * into _inv from public.invoices where id=_invoice_id;
    if not found or _inv.tenant_id<>_tenant or _inv.customer_id<>_customer_id then
      return public._jaad_err('not_found','الفاتورة غير موجودة أو لا تطابق العميل','Invoice not found or mismatched'); end if;
    if _amount > (_inv.total - _inv.paid) then return public._jaad_err('overpayment','المبلغ يتجاوز المتبقي','Amount exceeds remaining'); end if;
  end if;
  _rcpt_no := public._jaad_next_number(_tenant,'receipt');
  _rcpt_id := gen_random_uuid();
  insert into public.receipts (id, tenant_id, number, customer_id, invoice_id, date, amount, method, reference, notes)
  values (_rcpt_id,_tenant,_rcpt_no,_customer_id,_invoice_id,current_date,_amount,_method,_reference,_notes);
  if _invoice_id is not null then
    _new_paid := _inv.paid + _amount;
    _new_status := case when _new_paid >= _inv.total then 'fully_paid'::public.invoice_status
                        else 'partially_paid'::public.invoice_status end;
    update public.invoices set paid=_new_paid, status=_new_status, updated_at=now() where id=_inv.id;
  end if;
  begin
    _cash_acc := public._jaad_get_account(_tenant, case when _method='cash' then 'cash' else 'bank' end);
    _ar_acc   := public._jaad_get_account(_tenant,'accounts_receivable');
  exception when others then
    return public._jaad_err('missing_account','الحسابات المطلوبة غير موجودة','Required chart accounts missing');
  end;
  _je_id := gen_random_uuid();
  insert into public.journal_entries (id, tenant_id, number, date, description, status, source, source_type, source_id, posted_at)
  values (_je_id,_tenant,public._jaad_next_number(_tenant,'journal'),current_date,
          'Receipt '||_rcpt_no,'posted','receipt','receipt',_rcpt_id, now());
  insert into public.journal_entry_lines (entry_id, account_id, debit, credit, description)
  values (_je_id,_cash_acc,_amount,0,'Cash/Bank — '||_rcpt_no);
  insert into public.journal_entry_lines (entry_id, account_id, debit, credit, description)
  values (_je_id,_ar_acc,0,_amount,'AR — '||_rcpt_no);
  perform public._jaad_audit(_tenant,'receipt.create','receipt',_rcpt_id,
    'سند قبض '||_rcpt_no,'Receipt '||_rcpt_no);
  return jsonb_build_object('ok',true,'data',
    jsonb_build_object('receipt_id',_rcpt_id,'receipt_number',_rcpt_no,
                       'invoice_status', coalesce(_new_status::text,null),
                       'journal_entry_id',_je_id));
end $$;

create or replace function public.payment_create_with_posting(
  _amount numeric, _supplier_id uuid default null, _payee text default null,
  _vat_amount numeric default 0, _method public.payment_method default 'cash',
  _category text default null, _account_code text default null,
  _notes text default null, _reference text default null
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare _tenant uuid; _p_id uuid; _p_no text; _je_id uuid;
        _exp_acc uuid; _vat_in_acc uuid; _cash_acc uuid;
begin
  _tenant := public._jaad_require_tenant();
  perform public._jaad_require_role('accountant'::public.app_role);
  if _amount is null or _amount<=0 then return public._jaad_err('validation_failed','المبلغ غير صالح','Invalid amount'); end if;
  if _supplier_id is not null then
    perform 1 from public.suppliers where id=_supplier_id and tenant_id=_tenant;
    if not found then return public._jaad_err('not_found','المورد غير موجود','Supplier not found'); end if;
  end if;
  _p_no := public._jaad_next_number(_tenant,'payment');
  _p_id := gen_random_uuid();
  insert into public.payments (id, tenant_id, number, supplier_id, payee, date, amount, vat_amount, category, method, reference, notes)
  values (_p_id,_tenant,_p_no,_supplier_id,_payee,current_date,_amount,coalesce(_vat_amount,0),_category,_method,_reference,_notes);
  begin
    if _account_code is not null then
      select id into _exp_acc from public.chart_accounts where tenant_id=_tenant and code=_account_code limit 1;
      if _exp_acc is null then raise exception 'missing_account:expense'; end if;
    else
      _exp_acc := public._jaad_get_account(_tenant,'expense');
    end if;
    _cash_acc := public._jaad_get_account(_tenant, case when _method='cash' then 'cash' else 'bank' end);
    if coalesce(_vat_amount,0) > 0 then
      _vat_in_acc := public._jaad_get_account(_tenant,'vat_input');
    end if;
  exception when others then
    return public._jaad_err('missing_account','الحسابات المطلوبة غير موجودة','Required chart accounts missing');
  end;
  _je_id := gen_random_uuid();
  insert into public.journal_entries (id, tenant_id, number, date, description, status, source, source_type, source_id, posted_at)
  values (_je_id,_tenant,public._jaad_next_number(_tenant,'journal'),current_date,
          'Payment '||_p_no,'posted','payment','payment',_p_id, now());
  insert into public.journal_entry_lines (entry_id, account_id, debit, credit, description)
  values (_je_id,_exp_acc, _amount-coalesce(_vat_amount,0),0,'Expense — '||_p_no);
  if coalesce(_vat_amount,0)>0 then
    insert into public.journal_entry_lines (entry_id, account_id, debit, credit, description)
    values (_je_id,_vat_in_acc,_vat_amount,0,'Input VAT — '||_p_no);
  end if;
  insert into public.journal_entry_lines (entry_id, account_id, debit, credit, description)
  values (_je_id,_cash_acc,0,_amount,'Cash/Bank — '||_p_no);
  perform public._jaad_audit(_tenant,'payment.create','payment',_p_id,
    'سند صرف '||_p_no,'Payment '||_p_no);
  return jsonb_build_object('ok',true,'data',
    jsonb_build_object('payment_id',_p_id,'payment_number',_p_no,'journal_entry_id',_je_id));
end $$;

create or replace function public.journal_post_manual(_entry_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare _tenant uuid; _je public.journal_entries%rowtype; _dr numeric(14,2); _cr numeric(14,2);
begin
  _tenant := public._jaad_require_tenant();
  perform public._jaad_require_role('accountant'::public.app_role);
  select * into _je from public.journal_entries where id=_entry_id;
  if not found then return public._jaad_err('not_found','القيد غير موجود','Journal entry not found'); end if;
  if _je.tenant_id <> _tenant then return public._jaad_err('permission_denied','وصول عبر مؤسسات','Cross-tenant access'); end if;
  if _je.status <> 'draft' then return public._jaad_err('invalid_status','حالة القيد لا تسمح بالترحيل','Journal not draft'); end if;
  select coalesce(sum(debit),0), coalesce(sum(credit),0) into _dr,_cr
    from public.journal_entry_lines where entry_id=_je.id;
  if _dr = 0 then return public._jaad_err('validation_failed','القيد فارغ','Empty journal entry'); end if;
  if _dr <> _cr then return public._jaad_err('unbalanced_journal','القيد غير متوازن','Unbalanced journal'); end if;
  update public.journal_entries set status='posted', posted_at=now() where id=_je.id;
  perform public._jaad_audit(_tenant,'journal.post_manual','journal_entry',_je.id,
    'ترحيل قيد يدوي '||_je.number,'Manual journal posted '||_je.number);
  return jsonb_build_object('ok',true,'data',jsonb_build_object('journal_entry_id',_je.id,'status','posted'));
end $$;

-- GRANTS for write RPCs
revoke all on function public.quotation_convert_to_invoice(uuid) from public;
revoke all on function public.invoice_issue(uuid) from public;
revoke all on function public.receipt_create_with_auto_apply(uuid, numeric, public.payment_method, uuid, text, text) from public;
revoke all on function public.payment_create_with_posting(numeric, uuid, text, numeric, public.payment_method, text, text, text, text) from public;
revoke all on function public.journal_post_manual(uuid) from public;
grant execute on function public.quotation_convert_to_invoice(uuid) to authenticated;
grant execute on function public.invoice_issue(uuid) to authenticated;
grant execute on function public.receipt_create_with_auto_apply(uuid, numeric, public.payment_method, uuid, text, text) to authenticated;
grant execute on function public.payment_create_with_posting(numeric, uuid, text, numeric, public.payment_method, text, text, text, text) to authenticated;
grant execute on function public.journal_post_manual(uuid) to authenticated;

-- Readiness helpers (mapping-aware)
create or replace function public.validate_tenant_account_setup(_tenant uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  _purposes text[] := array[
    'cash','bank','accounts_receivable','vat_input','vat_payable',
    'revenue','expense','inventory','accounts_payable'
  ];
  _p text;
  _mapped text[] := '{}'; _fallback text[] := '{}'; _missing text[] := '{}';
  _checks jsonb := '[]'::jsonb;
  _has_map boolean; _id uuid;
begin
  if not public.is_tenant_member(_tenant) then
    return jsonb_build_object('ok',false,'error','not_tenant_member',
      'checks','[]'::jsonb,'warnings','[]'::jsonb,'errors',to_jsonb(array['not_tenant_member']));
  end if;
  foreach _p in array _purposes loop
    select exists(select 1 from public.chart_account_purposes
                   where tenant_id=_tenant and purpose=_p) into _has_map;
    if _has_map then
      _mapped := array_append(_mapped, _p);
      _checks := _checks || jsonb_build_array(jsonb_build_object('purpose',_p,'status','mapped'));
    else
      begin
        _id := public._jaad_get_account(_tenant,_p);
        _fallback := array_append(_fallback, _p);
        _checks := _checks || jsonb_build_array(jsonb_build_object('purpose',_p,'status','fallback'));
      exception when others then
        _missing := array_append(_missing,_p);
        _checks := _checks || jsonb_build_array(jsonb_build_object('purpose',_p,'status','missing'));
      end;
    end if;
  end loop;
  return jsonb_build_object(
    'ok', array_length(_missing,1) is null,
    'purposes', to_jsonb(_purposes),
    'mapped',   to_jsonb(_mapped),
    'fallback', to_jsonb(_fallback),
    'missing',  to_jsonb(_missing),
    'checks',   _checks,
    'warnings', case when array_length(_fallback,1) is null then '[]'::jsonb
                     else to_jsonb(array['using_canonical_fallback']) end,
    'errors',   case when array_length(_missing,1) is null then '[]'::jsonb
                     else to_jsonb(_missing) end
  );
end $$;

create or replace function public.validate_numbering_setup(_tenant uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  _row public.settings_numbering%rowtype;
  _has boolean;
  _docs text[] := array['quotation','invoice','receipt','payment','journal'];
  _d text; _missing_seq text[] := '{}'; _exists boolean;
begin
  if not public.is_tenant_member(_tenant) then
    return jsonb_build_object('ok',false,'error','not_tenant_member',
      'checks','[]'::jsonb,'warnings','[]'::jsonb,'errors',to_jsonb(array['not_tenant_member']));
  end if;
  select * into _row from public.settings_numbering where tenant_id=_tenant;
  _has := found;
  foreach _d in array _docs loop
    select exists(select 1 from public.document_number_sequences
                   where tenant_id=_tenant and doc_type=_d) into _exists;
    if not _exists then _missing_seq := array_append(_missing_seq,_d); end if;
  end loop;
  return jsonb_build_object(
    'ok', _has,
    'has_settings_row', _has,
    'strategy','tenant_scoped_sequence_table',
    'table','document_number_sequences',
    'doc_types', to_jsonb(_docs),
    'missing_sequences', to_jsonb(_missing_seq),
    'checks', jsonb_build_array(
      jsonb_build_object('name','settings_numbering_row','ok',_has),
      jsonb_build_object('name','document_number_sequences_initialised',
                         'ok', array_length(_missing_seq,1) is null,
                         'detail','sequences are created lazily on first use')),
    'warnings', case when array_length(_missing_seq,1) is null then '[]'::jsonb
                     else to_jsonb(array['sequences_not_initialised_yet']) end,
    'errors',   case when _has then '[]'::jsonb else to_jsonb(array['missing_settings_numbering']) end
  );
end $$;

create or replace function public.list_write_rpc_readiness()
returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select jsonb_build_object(
    'ok', true,
    'rpcs', jsonb_build_array(
      jsonb_build_object('name','quotation_convert_to_invoice','available',
        to_regprocedure('public.quotation_convert_to_invoice(uuid)') is not null,
        'roles', jsonb_build_array('owner','accountant','sales')),
      jsonb_build_object('name','invoice_issue','available',
        to_regprocedure('public.invoice_issue(uuid)') is not null,
        'roles', jsonb_build_array('owner','accountant')),
      jsonb_build_object('name','receipt_create_with_auto_apply','available',
        to_regprocedure('public.receipt_create_with_auto_apply(uuid,numeric,public.payment_method,uuid,text,text)') is not null,
        'roles', jsonb_build_array('owner','accountant')),
      jsonb_build_object('name','payment_create_with_posting','available',
        to_regprocedure('public.payment_create_with_posting(numeric,uuid,text,numeric,public.payment_method,text,text,text,text)') is not null,
        'roles', jsonb_build_array('owner','accountant')),
      jsonb_build_object('name','journal_post_manual','available',
        to_regprocedure('public.journal_post_manual(uuid)') is not null,
        'roles', jsonb_build_array('owner','accountant'))
    ),
    'numbering_strategy', 'tenant_scoped_sequence_table',
    'account_lookup_strategy', 'mapping_first_then_canonical_fallback',
    'mapping_table', 'chart_account_purposes',
    'writes_enabled_default', false,
    'warnings', '[]'::jsonb,
    'errors',   '[]'::jsonb
  );
$$;

revoke all on function public.validate_numbering_setup(uuid)        from public;
revoke all on function public.validate_tenant_account_setup(uuid)   from public;
revoke all on function public.list_write_rpc_readiness()            from public;
grant execute on function public.validate_numbering_setup(uuid)      to authenticated;
grant execute on function public.validate_tenant_account_setup(uuid) to authenticated;
grant execute on function public.list_write_rpc_readiness()          to authenticated;