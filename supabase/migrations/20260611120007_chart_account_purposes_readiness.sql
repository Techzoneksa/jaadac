-- JAAD CLOUD — Phase 2.1.1 — Chart Account Purpose Mapping & RPC Readiness (runnable)
-- Runnable migration promoted from planned-migrations/007_chart_account_purposes.sql.
-- Source of truth: this file. Planned copy retained as documentation.
-- Depends on: 001 init_schema, 003 rls_policies, 004 tenant_bootstrap, 005 write_rpc_functions, 006 write_rpc_hardening.

-- ============================================================================
-- 1) chart_account_purposes table
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

-- ============================================================================
-- 2) Default mapping seeder (canonical codes as defaults; idempotent)
-- ============================================================================
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

-- Seed for existing tenants (idempotent)
do $$ declare r record; begin
  for r in select id from public.tenants loop
    perform public._jaad_seed_default_purpose_mappings(r.id);
  end loop;
end $$;

-- ============================================================================
-- 3) _jaad_get_account — mapping-first, controlled fallback
-- ============================================================================
create or replace function public._jaad_get_account(_tenant uuid, _purpose text)
returns uuid language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  _id uuid;
  _codes text[];
begin
  select account_id into _id
    from public.chart_account_purposes
   where tenant_id=_tenant and purpose=_purpose
   limit 1;
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

-- ============================================================================
-- 4) Readiness helpers (mapping-aware, JSON envelope)
-- ============================================================================
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

-- ============================================================================
-- 5) bootstrap_tenant_for_user — also seeds default purpose mappings
-- ============================================================================
create or replace function public.bootstrap_tenant_for_user(
  p_user_id  uuid,
  p_name_ar  text,
  p_name_en  text,
  p_currency text default 'SAR',
  p_vat_rate numeric default 0.15,
  p_locale   text default 'ar'
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_tenant_id uuid; v_caller uuid; v_existing uuid;
begin
  if p_user_id is null then raise exception 'p_user_id is required'; end if;
  if coalesce(trim(p_name_en),'')='' or coalesce(trim(p_name_ar),'')='' then
    raise exception 'tenant name (ar/en) is required';
  end if;
  v_caller := auth.uid();
  if v_caller is null then raise exception 'auth.uid() is required to bootstrap a tenant'; end if;
  if v_caller <> p_user_id then raise exception 'caller cannot bootstrap a tenant for another user'; end if;

  select t.id into v_existing
    from public.tenants t
    join public.user_roles ur on ur.tenant_id=t.id and ur.user_id=p_user_id and ur.role='owner'::public.app_role
   where t.name_en = p_name_en limit 1;
  if v_existing is not null then
    perform public._jaad_seed_default_purpose_mappings(v_existing);
    return jsonb_build_object('tenant_id', v_existing, 'ok', true, 'reused', true);
  end if;

  insert into public.tenants (name_ar, name_en, default_currency, locale)
  values (p_name_ar, p_name_en, p_currency, p_locale)
  returning id into v_tenant_id;

  perform public.ensure_profile_for_auth_user(p_user_id, coalesce(p_name_en, p_name_ar));
  insert into public.user_tenants (user_id, tenant_id) values (p_user_id, v_tenant_id) on conflict do nothing;
  insert into public.user_roles  (user_id, tenant_id, role)
  values (p_user_id, v_tenant_id, 'owner'::public.app_role) on conflict do nothing;

  perform public.create_default_settings(v_tenant_id, p_vat_rate, p_currency, p_locale);
  perform public.create_default_chart_accounts(v_tenant_id);
  perform public._jaad_seed_default_purpose_mappings(v_tenant_id);

  insert into public.audit_logs (tenant_id, user_id, action, entity_type, description_ar, description_en)
  values (v_tenant_id, p_user_id, 'tenant.bootstrap', 'tenant',
          'تجهيز المؤسسة الأولية + ربط أغراض الحسابات',
          'Initial tenant bootstrap + account purpose mappings');

  return jsonb_build_object('tenant_id', v_tenant_id, 'ok', true, 'reused', false);
end $$;
