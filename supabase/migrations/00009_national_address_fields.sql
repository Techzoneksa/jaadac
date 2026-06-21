-- JAAD CLOUD — National Address Fields
-- Idempotent — safe to re-run

-- ====================== COMPANY SETTINGS — NATIONAL SHORT ADDRESS ======================
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS national_short_address TEXT DEFAULT '';

-- ====================== CUSTOMERS — NATIONAL SHORT ADDRESS ======================
ALTER TABLE customers ADD COLUMN IF NOT EXISTS national_short_address TEXT DEFAULT '';