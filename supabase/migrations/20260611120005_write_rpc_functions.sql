-- JAAD CLOUD — Phase 2.0 — Backend Write RPC Functions
-- These RPCs encapsulate the few critical write workflows in a tenant-safe,
-- role-safe, audit-safe way. They are NOT invoked from the production UI yet:
-- the app still runs in DATA_MODE=demo and the FutureBackendDataAdapter has
-- BACKEND_WRITES_ENABLED=false. Enable only after end-to-end backend testing.

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

create or replace function public._jaad_audit(
  _tenant uuid, _action text, _entity text, _entity_id uuid, _ar text, _en text
) returns void language sql security definer set search_path = public, pg_temp as $$
  insert into public.audit_logs (tenant_id, user_id, action, entity_type, entity_id, description_ar, description_en)
  values (_tenant, auth.uid(), _action, _entity, _entity_id, _ar, _en);
$$;

-- 1) quotation_convert_to_invoice
create or replace function public.quotation_convert_to_invoice(_quotation_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare _tenant uuid; _q public.quotations%rowtype; _inv_id uuid; _inv_number text; _total numeric(14,2):=0;
begin
  _tenant := public._jaad_require_tenant();
  perform public._jaad_require_role('sales'::public.app_role);
  select * into _q from public.quotations where id=_quotation_id;
  if not found then raise exception 'quotation_not_found' using errcode='P0002'; end if;
  if _q.tenant_id <> _tenant then raise exception 'cross_tenant' using errcode='42501'; end if;
  if _q.status not in ('accepted','sent') then raise exception 'quotation_not_convertible:%', _q.status using errcode='22023'; end if;
  if _q.converted_invoice_id is not null then raise exception 'already_converted' using errcode='23505'; end if;

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

  return jsonb_build_object('ok',true,'invoice_id',_inv_id,'invoice_number',_inv_number);
end $$;

-- 2) invoice_issue
create or replace function public.invoice_issue(_invoice_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare _tenant uuid; _inv public.invoices%rowtype; _je_id uuid;
        _ar_acc uuid; _rev_acc uuid; _vat_acc uuid;
        _subtotal numeric(14,2):=0; _vat numeric(14,2):=0; _lc int;
begin
  _tenant := public._jaad_require_tenant();
  perform public._jaad_require_role('accountant'::public.app_role);
  select * into _inv from public.invoices where id=_invoice_id;
  if not found then raise exception 'invoice_not_found' using errcode='P0002'; end if;
  if _inv.tenant_id <> _tenant then raise exception 'cross_tenant' using errcode='42501'; end if;
  if _inv.status not in ('draft','sent') then raise exception 'invoice_not_issuable:%', _inv.status using errcode='22023'; end if;
  if _inv.issued_at is not null then raise exception 'already_issued' using errcode='23505'; end if;
  select count(*) into _lc from public.invoice_lines where invoice_id=_inv.id;
  if _lc=0 then raise exception 'invoice_has_no_lines' using errcode='23514'; end if;

  select coalesce(sum(qty*unit_price - discount),0),
         coalesce(sum((qty*unit_price - discount)*vat_rate/100.0),0)
    into _subtotal,_vat from public.invoice_lines where invoice_id=_inv.id;

  select id into _ar_acc  from public.chart_accounts where tenant_id=_tenant and code='1200' limit 1;
  select id into _rev_acc from public.chart_accounts where tenant_id=_tenant and code='4000' limit 1;
  select id into _vat_acc from public.chart_accounts where tenant_id=_tenant and code='2300' limit 1;
  if _ar_acc is null or _rev_acc is null then raise exception 'chart_accounts_missing' using errcode='P0002'; end if;

  _je_id := gen_random_uuid();
  insert into public.journal_entries (id, tenant_id, number, date, description, status, source, source_type, source_id, posted_at)
  values (_je_id,_tenant,public._jaad_next_number(_tenant,'journal'),current_date,
          'Sales invoice '||_inv.number,'posted','sales_invoice','sales_invoice',_inv.id, now());

  insert into public.journal_entry_lines (entry_id, account_id, debit, credit, description)
  values (_je_id,_ar_acc, _subtotal+_vat, 0,'AR — '||_inv.number);
  insert into public.journal_entry_lines (entry_id, account_id, debit, credit, description)
  values (_je_id,_rev_acc, 0, _subtotal,'Revenue — '||_inv.number);
  if _vat>0 and _vat_acc is not null then
    insert into public.journal_entry_lines (entry_id, account_id, debit, credit, description)
    values (_je_id,_vat_acc, 0, _vat,'VAT payable — '||_inv.number);
  end if;

  update public.invoices set status='official', issued_at=now(), total=_subtotal+_vat, updated_at=now() where id=_inv.id;
  perform public._jaad_audit(_tenant,'invoice.issue','invoice',_inv.id,
    'إصدار فاتورة '||_inv.number,'Invoice issued '||_inv.number);

  return jsonb_build_object('ok',true,'invoice_id',_inv.id,'status','official','journal_entry_id',_je_id);
exception when unique_violation then
  raise exception 'duplicate_journal_source' using errcode='23505';
end $$;

-- 3) receipt_create_with_auto_apply
create or replace function public.receipt_create_with_auto_apply(
  _customer_id uuid, _amount numeric,
  _method public.payment_method default 'cash',
  _invoice_id uuid default null, _reference text default null, _notes text default null
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare _tenant uuid; _rcpt_id uuid; _rcpt_no text;
        _inv public.invoices%rowtype; _remaining numeric(14,2); _new_paid numeric(14,2);
        _new_status public.invoice_status; _cash_acc uuid; _ar_acc uuid; _je_id uuid;
begin
  _tenant := public._jaad_require_tenant();
  perform public._jaad_require_role('accountant'::public.app_role);
  if _amount is null or _amount<=0 then raise exception 'invalid_amount' using errcode='22023'; end if;
  perform 1 from public.customers where id=_customer_id and tenant_id=_tenant;
  if not found then raise exception 'customer_not_found' using errcode='P0002'; end if;

  if _invoice_id is not null then
    select * into _inv from public.invoices where id=_invoice_id;
    if not found or _inv.tenant_id<>_tenant or _inv.customer_id<>_customer_id then
      raise exception 'invoice_not_found_or_mismatch' using errcode='P0002'; end if;
    _remaining := _inv.total - _inv.paid;
    if _amount > _remaining then raise exception 'amount_exceeds_remaining' using errcode='22023'; end if;
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

  select id into _cash_acc from public.chart_accounts where tenant_id=_tenant and code= case _method
    when 'cash' then '1000' else '1100' end limit 1;
  select id into _ar_acc   from public.chart_accounts where tenant_id=_tenant and code='1200' limit 1;
  if _cash_acc is not null and _ar_acc is not null then
    _je_id := gen_random_uuid();
    insert into public.journal_entries (id, tenant_id, number, date, description, status, source, source_type, source_id, posted_at)
    values (_je_id,_tenant,public._jaad_next_number(_tenant,'journal'),current_date,
            'Receipt '||_rcpt_no,'posted','receipt','receipt',_rcpt_id, now());
    insert into public.journal_entry_lines (entry_id, account_id, debit, credit, description)
    values (_je_id,_cash_acc,_amount,0,'Cash/Bank — '||_rcpt_no);
    insert into public.journal_entry_lines (entry_id, account_id, debit, credit, description)
    values (_je_id,_ar_acc,0,_amount,'AR — '||_rcpt_no);
  end if;

  perform public._jaad_audit(_tenant,'receipt.create','receipt',_rcpt_id,
    'سند قبض '||_rcpt_no,'Receipt '||_rcpt_no);

  return jsonb_build_object('ok',true,'receipt_id',_rcpt_id,'receipt_number',_rcpt_no,
                            'invoice_status', coalesce(_new_status::text,null),
                            'journal_entry_id',_je_id);
end $$;

-- 4) payment_create_with_posting
create or replace function public.payment_create_with_posting(
  _amount numeric, _supplier_id uuid default null, _payee text default null,
  _vat_amount numeric default 0, _method public.payment_method default 'cash',
  _category text default null, _account_code text default '5000',
  _notes text default null, _reference text default null
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare _tenant uuid; _p_id uuid; _p_no text; _je_id uuid;
        _exp_acc uuid; _vat_in_acc uuid; _cash_acc uuid;
begin
  _tenant := public._jaad_require_tenant();
  perform public._jaad_require_role('accountant'::public.app_role);
  if _amount is null or _amount<=0 then raise exception 'invalid_amount' using errcode='22023'; end if;
  if _supplier_id is not null then
    perform 1 from public.suppliers where id=_supplier_id and tenant_id=_tenant;
    if not found then raise exception 'supplier_not_found' using errcode='P0002'; end if;
  end if;

  _p_no := public._jaad_next_number(_tenant,'payment');
  _p_id := gen_random_uuid();
  insert into public.payments (id, tenant_id, number, supplier_id, payee, date, amount, vat_amount, category, method, reference, notes)
  values (_p_id,_tenant,_p_no,_supplier_id,_payee,current_date,_amount,coalesce(_vat_amount,0),_category,_method,_reference,_notes);

  select id into _exp_acc    from public.chart_accounts where tenant_id=_tenant and code=_account_code limit 1;
  select id into _vat_in_acc from public.chart_accounts where tenant_id=_tenant and code='1300' limit 1;
  select id into _cash_acc   from public.chart_accounts where tenant_id=_tenant and code= case _method when 'cash' then '1000' else '1100' end limit 1;

  if _exp_acc is not null and _cash_acc is not null then
    _je_id := gen_random_uuid();
    insert into public.journal_entries (id, tenant_id, number, date, description, status, source, source_type, source_id, posted_at)
    values (_je_id,_tenant,public._jaad_next_number(_tenant,'journal'),current_date,
            'Payment '||_p_no,'posted','payment','payment',_p_id, now());
    insert into public.journal_entry_lines (entry_id, account_id, debit, credit, description)
    values (_je_id,_exp_acc, _amount-coalesce(_vat_amount,0),0,'Expense — '||_p_no);
    if coalesce(_vat_amount,0)>0 and _vat_in_acc is not null then
      insert into public.journal_entry_lines (entry_id, account_id, debit, credit, description)
      values (_je_id,_vat_in_acc,_vat_amount,0,'Input VAT — '||_p_no);
    end if;
    insert into public.journal_entry_lines (entry_id, account_id, debit, credit, description)
    values (_je_id,_cash_acc,0,_amount,'Cash/Bank — '||_p_no);
  end if;

  perform public._jaad_audit(_tenant,'payment.create','payment',_p_id,
    'سند صرف '||_p_no,'Payment '||_p_no);

  return jsonb_build_object('ok',true,'payment_id',_p_id,'payment_number',_p_no,'journal_entry_id',_je_id);
end $$;

-- 5) journal_post_manual
create or replace function public.journal_post_manual(_entry_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare _tenant uuid; _je public.journal_entries%rowtype; _dr numeric(14,2); _cr numeric(14,2);
begin
  _tenant := public._jaad_require_tenant();
  perform public._jaad_require_role('accountant'::public.app_role);
  select * into _je from public.journal_entries where id=_entry_id;
  if not found then raise exception 'journal_not_found' using errcode='P0002'; end if;
  if _je.tenant_id <> _tenant then raise exception 'cross_tenant' using errcode='42501'; end if;
  if _je.status <> 'draft' then raise exception 'journal_not_draft:%', _je.status using errcode='22023'; end if;
  select coalesce(sum(debit),0), coalesce(sum(credit),0) into _dr,_cr
    from public.journal_entry_lines where entry_id=_je.id;
  if _dr <> _cr then raise exception 'unbalanced_entry' using errcode='23514'; end if;
  if _dr = 0 then raise exception 'empty_entry' using errcode='23514'; end if;
  update public.journal_entries set status='posted', posted_at=now() where id=_je.id;
  perform public._jaad_audit(_tenant,'journal.post_manual','journal_entry',_je.id,
    'ترحيل قيد يدوي '||_je.number,'Manual journal posted '||_je.number);
  return jsonb_build_object('ok',true,'journal_entry_id',_je.id,'status','posted');
end $$;

-- GRANTS
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
