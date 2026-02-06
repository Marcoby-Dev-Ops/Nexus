-- Migration 114: Fix triggers on tables missing updated_at column
-- user_organizations and company_members have triggers that set NEW.updated_at
-- but the tables don't have an updated_at column, causing runtime errors on UPDATE.
-- personal_thoughts has a column named 'updatedat' (no underscore) but the trigger
-- function sets 'updated_at' (with underscore).

-- Fix 1: Add updated_at to user_organizations
ALTER TABLE user_organizations
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Fix 2: Add updated_at to company_members
ALTER TABLE company_members
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Fix 3: Add updated_at alias column to personal_thoughts so the trigger works.
-- The table has 'updatedat' (no underscore), add 'updated_at' (with underscore)
-- so both naming conventions work.
ALTER TABLE personal_thoughts
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Fix 4: Change user_subscriptions default plan_id from nonexistent 'free' to 'explorer'
-- Migration 111 set DEFAULT 'free' but the seeded plans are: explorer, assistant, professional, enterprise
ALTER TABLE user_subscriptions
ALTER COLUMN plan_id SET DEFAULT 'explorer';
