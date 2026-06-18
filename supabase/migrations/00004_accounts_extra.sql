-- JAAD CLOUD — Add missing columns to accounts table
-- Idempotent — safe to re-run

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS expense_claim_category TEXT DEFAULT '';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE;

-- Update locked to is_system for accounts that already exist
UPDATE accounts SET is_system = locked WHERE locked = TRUE AND is_system IS NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_accounts_tenant ON accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_accounts_parent ON accounts(parent);

-- RLS already exists from migration 00002
