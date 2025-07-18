-- Migration: Standardize schema for business data tables
-- 1. Rename tables to canonical, lowercase, plural, snake_case names
ALTER TABLE IF EXISTS "Contact" RENAME TO contacts;
ALTER TABLE IF EXISTS "Deal" RENAME TO deals;
ALTER TABLE IF EXISTS "Email" RENAME TO emails;
ALTER TABLE IF EXISTS "Task" RENAME TO tasks;
ALTER TABLE IF EXISTS "Note" RENAME TO notes;
ALTER TABLE IF EXISTS "Ticket" RENAME TO tickets;
ALTER TABLE IF EXISTS "VARLead" RENAME TO var_leads;
ALTER TABLE IF EXISTS "User" RENAME TO users;
ALTER TABLE IF EXISTS "Company" RENAME TO companies;

-- 2. Rename columns to snake_case (example for contacts; repeat for others as needed)
ALTER TABLE IF EXISTS contacts RENAME COLUMN "UserId" TO user_id;
ALTER TABLE IF EXISTS contacts RENAME COLUMN "CompanyId" TO company_id;
ALTER TABLE IF EXISTS contacts RENAME COLUMN "FirstName" TO first_name;
ALTER TABLE IF EXISTS contacts RENAME COLUMN "LastName" TO last_name;
ALTER TABLE IF EXISTS contacts RENAME COLUMN "IsPotentialVAR" TO is_potential_var;
ALTER TABLE IF EXISTS contacts RENAME COLUMN "LastSyncedAt" TO last_synced_at;
ALTER TABLE IF EXISTS contacts RENAME COLUMN "HubspotId" TO hubspot_id;

ALTER TABLE IF EXISTS deals RENAME COLUMN "CloseDate" TO close_date;
ALTER TABLE IF EXISTS deals RENAME COLUMN "LastSyncedAt" TO last_synced_at;
ALTER TABLE IF EXISTS deals RENAME COLUMN "HubspotId" TO hubspot_id;

-- 3. Add standard columns to all canonical tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['contacts','deals','emails','tasks','notes','tickets','var_leads','users','companies']
  LOOP
    EXECUTE format('ALTER TABLE IF EXISTS %I ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT gen_random_uuid()', tbl);
    EXECUTE format('ALTER TABLE IF EXISTS %I ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()', tbl);
    EXECUTE format('ALTER TABLE IF EXISTS %I ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()', tbl);
    EXECUTE format('ALTER TABLE IF EXISTS %I ADD COLUMN IF NOT EXISTS raw_json JSONB DEFAULT ''{}''', tbl);
  END LOOP;
END$$;

-- 4. Drop/merge obvious duplicates (example: drop Contact, Deal, etc. if still exist)
DROP TABLE IF EXISTS "Contact" CASCADE;
DROP TABLE IF EXISTS "Deal" CASCADE;
DROP TABLE IF EXISTS "Email" CASCADE;
DROP TABLE IF EXISTS "Task" CASCADE;
DROP TABLE IF EXISTS "Note" CASCADE;
DROP TABLE IF EXISTS "Ticket" CASCADE;
DROP TABLE IF EXISTS "VARLead" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS "Company" CASCADE; 