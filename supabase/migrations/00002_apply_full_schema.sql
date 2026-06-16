-- JAAD CLOUD — Full schema (idempotent, safe to re-run)
-- Run this in Supabase Dashboard > SQL Editor
-- Or via CLI: supabase db push

-- ====================== CUSTOMERS ======================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('individual', 'company')),
  vat TEXT DEFAULT '',
  mobile TEXT DEFAULT '',
  email TEXT DEFAULT '',
  city TEXT DEFAULT '',
  address TEXT DEFAULT '',
  opening_balance DECIMAL(12,2) DEFAULT 0,
  notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id);
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- ====================== SUPPLIERS ======================
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('individual', 'company')),
  vat TEXT DEFAULT '',
  mobile TEXT DEFAULT '',
  email TEXT DEFAULT '',
  city TEXT DEFAULT '',
  address TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_suppliers_tenant ON suppliers(tenant_id);
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- ====================== ITEMS ======================
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL DEFAULT '',
  sku TEXT DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('service', 'non_stock', 'stock')),
  sales_price DECIMAL(12,2) DEFAULT 0,
  purchase_price DECIMAL(12,2) DEFAULT 0,
  taxable BOOLEAN DEFAULT TRUE,
  vat_rate DECIMAL(5,2) DEFAULT 15,
  qty DECIMAL(12,2) DEFAULT 0,
  low_stock DECIMAL(12,2) DEFAULT 0,
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_items_tenant ON items(tenant_id);
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- ====================== INVOICES ======================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('sale', 'purchase')),
  number TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  subtotal DECIMAL(12,2) DEFAULT 0,
  vat_total DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'cancelled')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id);
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- ====================== INVOICE LINES ======================
CREATE TABLE IF NOT EXISTS invoice_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  qty DECIMAL(12,2) DEFAULT 1,
  unit_price DECIMAL(12,2) DEFAULT 0,
  vat_rate DECIMAL(5,2) DEFAULT 15,
  total DECIMAL(12,2) DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice ON invoice_lines(invoice_id);
ALTER TABLE invoice_lines ENABLE ROW LEVEL SECURITY;

-- ====================== QUOTATIONS ======================
CREATE TABLE IF NOT EXISTS quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  subtotal DECIMAL(12,2) DEFAULT 0,
  vat_total DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_quotations_tenant ON quotations(tenant_id);
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;

-- ====================== RECEIPTS ======================
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  amount DECIMAL(12,2) DEFAULT 0,
  payment_method TEXT DEFAULT 'cash',
  reference TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_receipts_tenant ON receipts(tenant_id);
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- ====================== PAYMENTS ======================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  amount DECIMAL(12,2) DEFAULT 0,
  payment_method TEXT DEFAULT 'cash',
  reference TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payments(tenant_id);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- ====================== NUMBERING ======================
CREATE TABLE IF NOT EXISTS numbering (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prefix TEXT NOT NULL,
  last_number INT NOT NULL DEFAULT 0,
  UNIQUE(tenant_id, prefix)
);
ALTER TABLE numbering ENABLE ROW LEVEL SECURITY;

-- ====================== ACCOUNTS ======================
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('assets', 'liabilities', 'equity', 'revenue', 'expenses')),
  parent UUID REFERENCES accounts(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  kind TEXT DEFAULT 'posting' CHECK (kind IN ('header', 'group', 'posting')),
  cash_flow TEXT DEFAULT 'none',
  payment_enabled BOOLEAN DEFAULT FALSE,
  purpose TEXT DEFAULT '',
  locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, number)
);
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- ====================== JOURNAL ======================
CREATE TABLE IF NOT EXISTS journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted')),
  source TEXT DEFAULT '',
  source_type TEXT DEFAULT 'manual' CHECK (source_type IN ('sales_invoice', 'receipt_voucher', 'payment_voucher', 'manual')),
  source_id TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  posted_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_journal_tenant ON journal(tenant_id);
ALTER TABLE journal ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS journal_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id UUID NOT NULL REFERENCES journal(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  debit DECIMAL(12,2) DEFAULT 0,
  credit DECIMAL(12,2) DEFAULT 0,
  description TEXT DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_journal_lines_journal ON journal_lines(journal_id);
ALTER TABLE journal_lines ENABLE ROW LEVEL SECURITY;

-- ====================== TAX RATES ======================
CREATE TABLE IF NOT EXISTS tax_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL DEFAULT '',
  tax_type TEXT NOT NULL CHECK (tax_type IN ('sales', 'purchases', 'reverse_charge', 'out_of_scope')),
  rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE tax_rates ENABLE ROW LEVEL SECURITY;

-- ====================== COMPANY SETTINGS ======================
CREATE TABLE IF NOT EXISTS company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL DEFAULT '',
  name_en TEXT NOT NULL DEFAULT '',
  vat TEXT DEFAULT '',
  cr TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  city TEXT DEFAULT '',
  address TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- ====================== RLS POLICIES ======================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Users can manage own customers') THEN
    CREATE POLICY "Users can manage own customers" ON customers FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'suppliers' AND policyname = 'Users can manage own suppliers') THEN
    CREATE POLICY "Users can manage own suppliers" ON suppliers FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'items' AND policyname = 'Users can manage own items') THEN
    CREATE POLICY "Users can manage own items" ON items FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'Users can manage own invoices') THEN
    CREATE POLICY "Users can manage own invoices" ON invoices FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoice_lines' AND policyname = 'Users can manage own invoice lines') THEN
    CREATE POLICY "Users can manage own invoice lines" ON invoice_lines FOR ALL USING (invoice_id IN (SELECT id FROM invoices WHERE tenant_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quotations' AND policyname = 'Users can manage own quotations') THEN
    CREATE POLICY "Users can manage own quotations" ON quotations FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'receipts' AND policyname = 'Users can manage own receipts') THEN
    CREATE POLICY "Users can manage own receipts" ON receipts FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Users can manage own payments') THEN
    CREATE POLICY "Users can manage own payments" ON payments FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'numbering' AND policyname = 'Users can manage own numbering') THEN
    CREATE POLICY "Users can manage own numbering" ON numbering FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'accounts' AND policyname = 'Users can manage own accounts') THEN
    CREATE POLICY "Users can manage own accounts" ON accounts FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'journal' AND policyname = 'Users can manage own journal') THEN
    CREATE POLICY "Users can manage own journal" ON journal FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'journal_lines' AND policyname = 'Users can manage own journal lines') THEN
    CREATE POLICY "Users can manage own journal lines" ON journal_lines FOR ALL USING (journal_id IN (SELECT id FROM journal WHERE tenant_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tax_rates' AND policyname = 'Users can manage own tax_rates') THEN
    CREATE POLICY "Users can manage own tax_rates" ON tax_rates FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'company_settings' AND policyname = 'Users can manage own company_settings') THEN
    CREATE POLICY "Users can manage own company_settings" ON company_settings FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());
  END IF;
END $$;
