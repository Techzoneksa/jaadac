-- JAAD CLOUD — Phase 1.6 RLS policies (PLANNED)
-- Source: docs/security-permissions-plan.md

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

-- customers (owner/accountant/sales)
create policy customers_select on public.customers for select to authenticated using (public.is_tenant_member(tenant_id));
create policy customers_write on public.customers for all to authenticated
  using (public.has_role(auth.uid(),tenant_id,'owner') or public.has_role(auth.uid(),tenant_id,'accountant') or public.has_role(auth.uid(),tenant_id,'sales'))
  with check (public.has_role(auth.uid(),tenant_id,'owner') or public.has_role(auth.uid(),tenant_id,'accountant') or public.has_role(auth.uid(),tenant_id,'sales'));

-- suppliers / items (owner/accountant)
create policy suppliers_select on public.suppliers for select to authenticated using (public.is_tenant_member(tenant_id));
create policy suppliers_write on public.suppliers for all to authenticated
  using (public.has_role(auth.uid(),tenant_id,'owner') or public.has_role(auth.uid(),tenant_id,'accountant'))
  with check (public.has_role(auth.uid(),tenant_id,'owner') or public.has_role(auth.uid(),tenant_id,'accountant'));

create policy items_select on public.items for select to authenticated using (public.is_tenant_member(tenant_id));
create policy items_write on public.items for all to authenticated
  using (public.has_role(auth.uid(),tenant_id,'owner') or public.has_role(auth.uid(),tenant_id,'accountant'))
  with check (public.has_role(auth.uid(),tenant_id,'owner') or public.has_role(auth.uid(),tenant_id,'accountant'));

-- quotations + lines
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

-- invoices + lines
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

-- receipts / payments (owner/accountant)
create policy receipts_select on public.receipts for select to authenticated using (public.is_tenant_member(tenant_id));
create policy receipts_write on public.receipts for all to authenticated
  using (public.has_role(auth.uid(),tenant_id,'owner') or public.has_role(auth.uid(),tenant_id,'accountant'))
  with check (public.has_role(auth.uid(),tenant_id,'owner') or public.has_role(auth.uid(),tenant_id,'accountant'));

create policy payments_select on public.payments for select to authenticated using (public.is_tenant_member(tenant_id));
create policy payments_write on public.payments for all to authenticated
  using (public.has_role(auth.uid(),tenant_id,'owner') or public.has_role(auth.uid(),tenant_id,'accountant'))
  with check (public.has_role(auth.uid(),tenant_id,'owner') or public.has_role(auth.uid(),tenant_id,'accountant'));

-- accounting
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

-- tasks
create policy tasks_select on public.tasks for select to authenticated using (public.is_tenant_member(tenant_id));
create policy tasks_write on public.tasks for all to authenticated
  using (public.has_role(auth.uid(),tenant_id,'owner') or public.has_role(auth.uid(),tenant_id,'accountant') or public.has_role(auth.uid(),tenant_id,'sales'))
  with check (public.has_role(auth.uid(),tenant_id,'owner') or public.has_role(auth.uid(),tenant_id,'accountant') or public.has_role(auth.uid(),tenant_id,'sales'));

-- settings (owner only)
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

-- audit_logs (insert by member; read owner/accountant; no update/delete)
create policy audit_select on public.audit_logs for select to authenticated
  using (public.has_role(auth.uid(),tenant_id,'owner') or public.has_role(auth.uid(),tenant_id,'accountant'));
create policy audit_insert on public.audit_logs for insert to authenticated
  with check (public.is_tenant_member(tenant_id) and user_id = auth.uid());

-- attachments
create policy attachments_select on public.attachments for select to authenticated using (public.is_tenant_member(tenant_id));
create policy attachments_write on public.attachments for all to authenticated
  using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id));

-- migration_snapshots (owner only)
create policy snaps_owner on public.migration_snapshots for all to authenticated
  using (public.has_role(auth.uid(),tenant_id,'owner'))
  with check (public.has_role(auth.uid(),tenant_id,'owner'));
