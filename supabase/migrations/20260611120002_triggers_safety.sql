-- JAAD CLOUD — Phase 1.6 safety triggers (PLANNED)
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

-- 1. Posted journal entries immutable
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

-- 2. Balanced check before posting
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

-- 3. Issued invoices locked
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
