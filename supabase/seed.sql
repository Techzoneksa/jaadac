-- JAAD CLOUD — local/dev seed (Phase 1.6)
-- Safe to run only against an EMPTY local Supabase. No real users, no passwords.

insert into public.tenants (id, name_ar, name_en, country, currency, is_demo)
values ('00000000-0000-0000-0000-000000000001',
        'شركة جاد التجريبية', 'JAAD Demo Company', 'SA', 'SAR', true)
on conflict (id) do nothing;

-- Default settings
insert into public.settings_company (tenant_id, name_ar, name_en)
values ('00000000-0000-0000-0000-000000000001', 'شركة جاد التجريبية', 'JAAD Demo Company')
on conflict (tenant_id) do nothing;

insert into public.settings_tax (tenant_id) values
  ('00000000-0000-0000-0000-000000000001')
on conflict (tenant_id) do nothing;

insert into public.settings_numbering (tenant_id) values
  ('00000000-0000-0000-0000-000000000001')
on conflict (tenant_id) do nothing;

-- Minimal chart of accounts
insert into public.chart_accounts (tenant_id, code, name_ar, name_en, type) values
  ('00000000-0000-0000-0000-000000000001','1000','النقدية','Cash','asset'),
  ('00000000-0000-0000-0000-000000000001','1100','البنك','Bank','asset'),
  ('00000000-0000-0000-0000-000000000001','1200','العملاء','Accounts Receivable','asset'),
  ('00000000-0000-0000-0000-000000000001','2100','الموردين','Accounts Payable','liability'),
  ('00000000-0000-0000-0000-000000000001','2300','ضريبة القيمة المضافة المستحقة','VAT Payable','liability'),
  ('00000000-0000-0000-0000-000000000001','3000','رأس المال','Capital','equity'),
  ('00000000-0000-0000-0000-000000000001','4000','إيرادات المبيعات','Sales Revenue','revenue'),
  ('00000000-0000-0000-0000-000000000001','5000','مصروفات عامة','General Expenses','expense')
on conflict (tenant_id, code) do nothing;

-- Sample customers / suppliers / items (no real PII)
insert into public.customers (tenant_id, code, name_ar, name_en) values
  ('00000000-0000-0000-0000-000000000001','C-001','عميل تجريبي 1','Demo Customer 1'),
  ('00000000-0000-0000-0000-000000000001','C-002','عميل تجريبي 2','Demo Customer 2')
on conflict (tenant_id, code) do nothing;

insert into public.suppliers (tenant_id, code, name_ar, name_en) values
  ('00000000-0000-0000-0000-000000000001','S-001','مورد تجريبي 1','Demo Supplier 1')
on conflict (tenant_id, code) do nothing;

insert into public.items (tenant_id, sku, name_ar, name_en, type, unit, price, cost) values
  ('00000000-0000-0000-0000-000000000001','SKU-001','منتج تجريبي','Demo Product','product','pcs', 100, 60),
  ('00000000-0000-0000-0000-000000000001','SKU-002','خدمة تجريبية','Demo Service','service','hr', 150, 0)
on conflict (tenant_id, sku) do nothing;
