-- JAAD CLOUD — ZATCA Invoice Fields Phase
-- Idempotent — safe to re-run

-- ====================== CUSTOMERS — ZATCA ADDRESS & TAX FIELDS ======================
ALTER TABLE customers ADD COLUMN IF NOT EXISTS cr TEXT DEFAULT '';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS unified_no TEXT DEFAULT '';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'المملكة العربية السعودية';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS district TEXT DEFAULT '';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS street TEXT DEFAULT '';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS building_no TEXT DEFAULT '';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS additional_no TEXT DEFAULT '';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS postal_code TEXT DEFAULT '';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS project_name TEXT DEFAULT '';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS contact_person TEXT DEFAULT '';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_number TEXT DEFAULT '';

-- ====================== COMPANY SETTINGS — FULL ZATCA FIELDS ======================
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'المملكة العربية السعودية';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS street TEXT DEFAULT '';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS building_no TEXT DEFAULT '';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS additional_no TEXT DEFAULT '';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS district TEXT DEFAULT '';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS postal_code TEXT DEFAULT '';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS branch_name TEXT DEFAULT '';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS unified_no TEXT DEFAULT '';

-- ====================== COMPANY SETTINGS — INVOICE TEMPLATE SETTINGS ======================
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS show_logo BOOLEAN DEFAULT TRUE;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS show_stamp BOOLEAN DEFAULT TRUE;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS show_bank BOOLEAN DEFAULT TRUE;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS show_amount_text BOOLEAN DEFAULT TRUE;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS show_customer_address BOOLEAN DEFAULT TRUE;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS show_customer_cr BOOLEAN DEFAULT TRUE;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS invoice_template TEXT DEFAULT 'standard';

-- ====================== COMPANY SETTINGS — BANK FOOTER ======================
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS bank_footer_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS primary_bank_name TEXT DEFAULT '';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS primary_bank_account_name TEXT DEFAULT '';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS primary_bank_account_number TEXT DEFAULT '';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS primary_bank_iban TEXT DEFAULT '';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS primary_bank_swift TEXT DEFAULT '';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS primary_bank_currency TEXT DEFAULT 'SAR';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS secondary_bank_name TEXT DEFAULT '';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS secondary_bank_account_name TEXT DEFAULT '';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS secondary_bank_account_number TEXT DEFAULT '';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS secondary_bank_iban TEXT DEFAULT '';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS secondary_bank_swift TEXT DEFAULT '';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS secondary_bank_currency TEXT DEFAULT 'SAR';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS invoice_footer_note_ar TEXT DEFAULT '';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS invoice_footer_note_en TEXT DEFAULT '';

-- ====================== INVOICES — ZATCA FIELDS ======================
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS qr_value TEXT DEFAULT '';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS issue_time TIME DEFAULT CURRENT_TIME;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS branch_name TEXT DEFAULT '';

-- ====================== QUOTATIONS — FIX STATUS CONSTRAINT ======================
ALTER TABLE quotations DROP CONSTRAINT IF EXISTS quotations_status_check;
ALTER TABLE quotations ADD CONSTRAINT quotations_status_check
  CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'converted', 'cancelled'));

-- ====================== INVOICE_LINES — ENRICHED FOR ZATCA ======================
ALTER TABLE invoice_lines ADD COLUMN IF NOT EXISTS item_id UUID REFERENCES items(id) ON DELETE SET NULL;
ALTER TABLE invoice_lines ADD COLUMN IF NOT EXISTS sku TEXT DEFAULT '';
ALTER TABLE invoice_lines ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT '';
ALTER TABLE invoice_lines ADD COLUMN IF NOT EXISTS discount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE invoice_lines ADD COLUMN IF NOT EXISTS taxable_amount DECIMAL(12,2) DEFAULT 0;

-- ====================== QUOTATION LINES TABLE ======================
CREATE TABLE IF NOT EXISTS quotation_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  qty DECIMAL(12,2) DEFAULT 1,
  unit_price DECIMAL(12,2) DEFAULT 0,
  vat_rate DECIMAL(5,2) DEFAULT 15,
  total DECIMAL(12,2) DEFAULT 0,
  discount DECIMAL(12,2) DEFAULT 0,
  taxable_amount DECIMAL(12,2) DEFAULT 0,
  sku TEXT DEFAULT '',
  unit TEXT DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_quotation_lines_quotation ON quotation_lines(quotation_id);
ALTER TABLE quotation_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own quotation_lines" ON quotation_lines
  FOR ALL USING (quotation_id IN (SELECT id FROM quotations WHERE tenant_id = auth.uid()));

-- Add RLS for invoice_lines
ALTER TABLE invoice_lines ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoice_lines' AND policyname = 'Users can manage own invoice_lines') THEN
    CREATE POLICY "Users can manage own invoice_lines" ON invoice_lines
      FOR ALL USING (invoice_id IN (SELECT id FROM invoices WHERE tenant_id = auth.uid()));
  END IF;
END $$;