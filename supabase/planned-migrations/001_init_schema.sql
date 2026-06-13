-- JAAD CLOUD — Phase 1.6 initial schema (PLANNED)
-- Source of truth: docs/backend-schema-plan.md
-- NOTE: This SQL is the planned migration. It is NOT auto-applied — the app
-- still runs in demo mode (LocalStorage). To activate, move into
-- supabase/migrations/ using the Supabase migration tool once backend is enabled.

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
