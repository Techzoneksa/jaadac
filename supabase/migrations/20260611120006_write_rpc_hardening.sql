-- JAAD CLOUD — Phase 2.0.1 — Write RPC Hardening & Production Safety Review
-- Tightens numbering, account lookup, and the error contract for the write
-- RPCs introduced in 20260611120005. Writes remain disabled in the UI
-- (BACKEND_WRITES_ENABLED = false in FutureBackendDataAdapter).

-- ============= 1) Tenant-scoped numbering counters =============
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

-- Atomic, per-(tenant,doc_type,year) sequential numbering. Uses row-level
-- locking (FOR UPDATE) inside the function so concurrent callers serialize
-- on the same counter row without colliding on the unique number index.
create or replace function public._jaad_next_number(_tenant uuid, _kind text)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare
  _prefix text; _y int := extract(year from now())::int;
  _next bigint;
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
  do update set last_value = public.document_number_sequences.last_value + 1,
                updated_at = now()
  returning last_value into _next;

  return _prefix || _y::text || '-' || lpad(_next::text, 5, '0');
end $$;

-- ============= 2) Semantic account lookup =============
-- Canonical chart codes per purpose. Falls back gracefully and raises a
-- controlled `missing_account:<purpose>` error when no candidate is found.
create or replace function public._jaad_get_account(_tenant uuid, _purpose text)
returns uuid language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  _codes text[];
  _id uuid;
begin
  _codes := case _purpose
    when 'cash'                then array['1000']
    when 'bank'                then array['1100']
    when 'accounts_receivable' then array['1200']
    when 'vat_input'           then array['1300']
    when 'vat_payable'         then array['2300']
    when 'revenue'             then array['4000']
    when 'expense'             then array['5000']
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

-- ============= 3) Read-only readiness helpers =============
create or replace function public.validate_numbering_setup(_tenant uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare _row public.settings_numbering%rowtype; _ok boolean;
begin
  if not public.is_tenant_member(_tenant) then
    return jsonb_build_object('ok',false,'error','not_tenant_member');
  end if;
  select * into _row from public.settings_numbering where tenant_id=_tenant;
  _ok := found;
  return jsonb_build_object(
    'ok', _ok,
    'has_settings_row', _ok,
    'strategy', 'tenant_scoped_sequence_table',
    'table', 'document_number_sequences',
    'doc_types', jsonb_build_array('quotation','invoice','receipt','payment','journal')
  );
end $$;

create or replace function public.validate_tenant_account_setup(_tenant uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  _purposes text[] := array['cash','bank','accounts_receivable','vat_input','vat_payable','revenue','expense'];
  _p text; _missing text[] := '{}';
  _id uuid;
begin
  if not public.is_tenant_member(_tenant) then
    return jsonb_build_object('ok',false,'error','not_tenant_member');
  end if;
  foreach _p in array _purposes loop
    begin
      _id := public._jaad_get_account(_tenant, _p);
    exception when others then
      _missing := array_append(_missing, _p);
    end;
  end loop;
  return jsonb_build_object(
    'ok', array_length(_missing,1) is null,
    'purposes', to_jsonb(_purposes),
    'missing', to_jsonb(_missing)
  );
end $$;

create or replace function public.list_write_rpc_readiness()
returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select jsonb_build_object(
    'ok', true,
    'rpcs', jsonb_build_array(
      jsonb_build_object('name','quotation_convert_to_invoice','roles', jsonb_build_array('owner','accountant','sales')),
      jsonb_build_object('name','invoice_issue',               'roles', jsonb_build_array('owner','accountant')),
      jsonb_build_object('name','receipt_create_with_auto_apply','roles', jsonb_build_array('owner','accountant')),
      jsonb_build_object('name','payment_create_with_posting',   'roles', jsonb_build_array('owner','accountant')),
      jsonb_build_object('name','journal_post_manual',           'roles', jsonb_build_array('owner','accountant'))
    ),
    'numbering_strategy', 'tenant_scoped_sequence_table',
    'account_lookup_strategy', 'semantic_purpose_via__jaad_get_account',
    'writes_enabled_default', false
  );
$$;

revoke all on function public.validate_numbering_setup(uuid)        from public;
revoke all on function public.validate_tenant_account_setup(uuid)   from public;
revoke all on function public.list_write_rpc_readiness()            from public;
grant execute on function public.validate_numbering_setup(uuid)      to authenticated;
grant execute on function public.validate_tenant_account_setup(uuid) to authenticated;
grant execute on function public.list_write_rpc_readiness()          to authenticated;

-- ============= 4) Re-issue write RPCs with hardened account lookup
-- and stable JSON error envelope. Signatures unchanged; existing GRANTs apply.

-- helper: build a structured error envelope (never raised, returned as data)
create or replace function public._jaad_err(_code text, _ar text, _en text)
returns jsonb language sql immutable as $$
  select jsonb_build_object('ok', false, 'error',
    jsonb_build_object('code', _code, 'message_ar', _ar, 'message_en', _en));
$$;

-- 4.1 quotation_convert_to_invoice
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

  return jsonb_build_object('ok',true,'data',
    jsonb_build_object('invoice_id',_inv_id,'invoice_number',_inv_number));
end $$;

-- 4.2 invoice_issue
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

  return jsonb_build_object('ok',true,'data',
    jsonb_build_object('invoice_id',_inv.id,'status','official','journal_entry_id',_je_id));
end $$;

-- 4.3 receipt_create_with_auto_apply
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

-- 4.4 payment_create_with_posting
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

-- 4.5 journal_post_manual
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
  return jsonb_build_object('ok',true,'data',
    jsonb_build_object('journal_entry_id',_je.id,'status','posted'));
end $$;
