-- JAAD CLOUD — Inventory & Services Module
-- Run this in Supabase SQL Editor

-- ====================== ALTER ITEMS ======================
ALTER TABLE items ADD COLUMN IF NOT EXISTS category_id UUID NULL;
ALTER TABLE items ADD COLUMN IF NOT EXISTS service_category_id UUID NULL;
ALTER TABLE items ADD COLUMN IF NOT EXISTS barcode TEXT DEFAULT '';
ALTER TABLE items ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT '';
ALTER TABLE items ADD COLUMN IF NOT EXISTS cost DECIMAL(12,2) DEFAULT 0;
ALTER TABLE items ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN DEFAULT true;
ALTER TABLE items ADD COLUMN IF NOT EXISTS reorder_level DECIMAL(12,2) DEFAULT 0;
ALTER TABLE items ADD COLUMN IF NOT EXISTS current_stock DECIMAL(12,2) DEFAULT 0;
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE items ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ====================== INVENTORY BRANCHES ======================
CREATE TABLE IF NOT EXISTS inventory_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT DEFAULT '',
  address TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_branches_tenant ON inventory_branches(tenant_id);
ALTER TABLE inventory_branches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own inventory_branches" ON inventory_branches
  FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());

-- ====================== INVENTORY CATEGORIES ======================
CREATE TABLE IF NOT EXISTS inventory_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES inventory_categories(id) ON DELETE SET NULL,
  description TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_categories_tenant ON inventory_categories(tenant_id);
ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own inventory_categories" ON inventory_categories
  FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());

-- ====================== SERVICE CATEGORIES ======================
CREATE TABLE IF NOT EXISTS service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_categories_tenant ON service_categories(tenant_id);
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own service_categories" ON service_categories
  FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());

-- ====================== INVENTORY MOVEMENTS ======================
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  branch_id UUID REFERENCES inventory_branches(id) ON DELETE SET NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('opening','purchase','sale','adjustment','transfer_in','transfer_out','manufacturing_in','manufacturing_out')),
  qty DECIMAL(12,2) NOT NULL DEFAULT 0,
  unit_cost DECIMAL(12,2) DEFAULT 0,
  reference_type TEXT DEFAULT '',
  reference_id TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_tenant ON inventory_movements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_item ON inventory_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_branch ON inventory_movements(branch_id);
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own inventory_movements" ON inventory_movements
  FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());

-- ====================== INVENTORY COUNTS ======================
CREATE TABLE IF NOT EXISTS inventory_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES inventory_branches(id) ON DELETE SET NULL,
  number TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','counted','posted','cancelled')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_counts_tenant ON inventory_counts(tenant_id);
ALTER TABLE inventory_counts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own inventory_counts" ON inventory_counts
  FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());

-- ====================== INVENTORY COUNT LINES ======================
CREATE TABLE IF NOT EXISTS inventory_count_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  count_id UUID NOT NULL REFERENCES inventory_counts(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  system_qty DECIMAL(12,2) DEFAULT 0,
  counted_qty DECIMAL(12,2) DEFAULT 0,
  difference_qty DECIMAL(12,2) DEFAULT 0,
  notes TEXT DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_inventory_count_lines_count ON inventory_count_lines(count_id);
ALTER TABLE inventory_count_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own inventory_count_lines" ON inventory_count_lines
  FOR ALL USING (count_id IN (SELECT id FROM inventory_counts WHERE tenant_id = auth.uid()));

-- ====================== MANUFACTURING CARDS ======================
CREATE TABLE IF NOT EXISTS manufacturing_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES items(id) ON DELETE SET NULL,
  number TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','cancelled')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_manufacturing_cards_tenant ON manufacturing_cards(tenant_id);
ALTER TABLE manufacturing_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own manufacturing_cards" ON manufacturing_cards
  FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());

-- ====================== MANUFACTURING CARD LINES ======================
CREATE TABLE IF NOT EXISTS manufacturing_card_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturing_card_id UUID NOT NULL REFERENCES manufacturing_cards(id) ON DELETE CASCADE,
  component_item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  qty DECIMAL(12,2) NOT NULL DEFAULT 0,
  cost DECIMAL(12,2) DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_manufacturing_card_lines_card ON manufacturing_card_lines(manufacturing_card_id);
ALTER TABLE manufacturing_card_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own manufacturing_card_lines" ON manufacturing_card_lines
  FOR ALL USING (manufacturing_card_id IN (SELECT id FROM manufacturing_cards WHERE tenant_id = auth.uid()));
