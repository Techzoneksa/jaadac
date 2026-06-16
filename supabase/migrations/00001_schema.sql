-- JAAD CLOUD — Core database schema
-- Run this in Supabase SQL Editor

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

-- ====================== ENABLE RLS ======================
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- ====================== RLS POLICIES ======================
CREATE POLICY "Users can manage own customers" ON customers
  FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Users can manage own suppliers" ON suppliers
  FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Users can manage own items" ON items
  FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Users can manage own invoices" ON invoices
  FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Users can manage own invoice lines" ON invoice_lines
  FOR ALL USING (invoice_id IN (SELECT id FROM invoices WHERE tenant_id = auth.uid()));

CREATE POLICY "Users can manage own quotations" ON quotations
  FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Users can manage own receipts" ON receipts
  FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Users can manage own payments" ON payments
  FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());

-- ====================== AUTO-INCREMENT NUMBERING ======================
CREATE TABLE IF NOT EXISTS numbering (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prefix TEXT NOT NULL,
  last_number INT NOT NULL DEFAULT 0,
  UNIQUE(tenant_id, prefix)
);

CREATE POLICY "Users can manage own numbering" ON numbering
  FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());
