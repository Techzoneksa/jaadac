-- JAAD CLOUD — Phase A: Purchase Orders, Credit Notes, Debit Notes
-- Idempotent — safe to re-run

-- ====================== PURCHASE ORDERS ======================
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  subtotal DECIMAL(12,2) DEFAULT 0,
  vat_total DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'converted', 'cancelled')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_tenant ON purchase_orders(tenant_id);
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS purchase_order_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  qty DECIMAL(12,2) DEFAULT 1,
  unit_price DECIMAL(12,2) DEFAULT 0,
  vat_rate DECIMAL(5,2) DEFAULT 15,
  total DECIMAL(12,2) DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_po_lines_order ON purchase_order_lines(purchase_order_id);
ALTER TABLE purchase_order_lines ENABLE ROW LEVEL SECURITY;

-- ====================== CREDIT NOTES ======================
CREATE TABLE IF NOT EXISTS credit_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  subtotal DECIMAL(12,2) DEFAULT 0,
  vat_total DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'cancelled')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_credit_notes_tenant ON credit_notes(tenant_id);
ALTER TABLE credit_notes ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS credit_note_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_note_id UUID NOT NULL REFERENCES credit_notes(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  qty DECIMAL(12,2) DEFAULT 1,
  unit_price DECIMAL(12,2) DEFAULT 0,
  vat_rate DECIMAL(5,2) DEFAULT 15,
  total DECIMAL(12,2) DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_cn_lines_note ON credit_note_lines(credit_note_id);
ALTER TABLE credit_note_lines ENABLE ROW LEVEL SECURITY;

-- ====================== DEBIT NOTES ======================
CREATE TABLE IF NOT EXISTS debit_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  subtotal DECIMAL(12,2) DEFAULT 0,
  vat_total DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'cancelled')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_debit_notes_tenant ON debit_notes(tenant_id);
ALTER TABLE debit_notes ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS debit_note_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debit_note_id UUID NOT NULL REFERENCES debit_notes(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  qty DECIMAL(12,2) DEFAULT 1,
  unit_price DECIMAL(12,2) DEFAULT 0,
  vat_rate DECIMAL(5,2) DEFAULT 15,
  total DECIMAL(12,2) DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_dn_lines_note ON debit_note_lines(debit_note_id);
ALTER TABLE debit_note_lines ENABLE ROW LEVEL SECURITY;

-- ====================== COMPANY SETTINGS EXTRA COLUMNS ======================
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS cr TEXT DEFAULT '';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT '';

-- ====================== RLS POLICIES ======================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'purchase_orders' AND policyname = 'Users can manage own purchase_orders') THEN
    CREATE POLICY "Users can manage own purchase_orders" ON purchase_orders FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'purchase_order_lines' AND policyname = 'Users can manage own po_lines') THEN
    CREATE POLICY "Users can manage own po_lines" ON purchase_order_lines FOR ALL USING (purchase_order_id IN (SELECT id FROM purchase_orders WHERE tenant_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'credit_notes' AND policyname = 'Users can manage own credit_notes') THEN
    CREATE POLICY "Users can manage own credit_notes" ON credit_notes FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'credit_note_lines' AND policyname = 'Users can manage own cn_lines') THEN
    CREATE POLICY "Users can manage own cn_lines" ON credit_note_lines FOR ALL USING (credit_note_id IN (SELECT id FROM credit_notes WHERE tenant_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'debit_notes' AND policyname = 'Users can manage own debit_notes') THEN
    CREATE POLICY "Users can manage own debit_notes" ON debit_notes FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'debit_note_lines' AND policyname = 'Users can manage own dn_lines') THEN
    CREATE POLICY "Users can manage own dn_lines" ON debit_note_lines FOR ALL USING (debit_note_id IN (SELECT id FROM debit_notes WHERE tenant_id = auth.uid()));
  END IF;
END $$;
