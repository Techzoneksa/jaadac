-- JAAD CLOUD — Invoice payment schema alignment
-- Run in Supabase SQL Editor

-- Add invoice_id to receipts (nullable, for linking payments to invoices)
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL;

-- Add paid_amount to invoices (track partial/full payments)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(12,2) DEFAULT 0;

-- Add due_date to invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS due_date DATE;

-- Add updated_at trigger for invoices if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_invoices_updated_at'
  ) THEN
    CREATE TRIGGER set_invoices_updated_at
      BEFORE UPDATE ON invoices
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Add updated_at trigger for receipts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_receipts_updated_at'
  ) THEN
    CREATE TRIGGER set_receipts_updated_at
      BEFORE UPDATE ON receipts
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Index for invoice_id on receipts
CREATE INDEX IF NOT EXISTS idx_receipts_invoice ON receipts(invoice_id);
