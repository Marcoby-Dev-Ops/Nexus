-- Standardize Schema Migration
-- Convert camelCase columns to snake_case for consistency

-- Function to safely rename columns
CREATE OR REPLACE FUNCTION safe_rename_column(
    tbl_name TEXT,
    old_column_name TEXT,
    new_column_name TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    -- Check if table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = safe_rename_column.tbl_name
    ) THEN
        RAISE NOTICE 'Table % does not exist, skipping column rename', tbl_name;
        RETURN FALSE;
    END IF;
    
    -- Check if old column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = safe_rename_column.tbl_name
        AND column_name = safe_rename_column.old_column_name
    ) THEN
        RAISE NOTICE 'Column %.% does not exist, skipping rename', tbl_name, old_column_name;
        RETURN FALSE;
    END IF;
    
    -- Check if new column already exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = safe_rename_column.tbl_name
        AND column_name = safe_rename_column.new_column_name
    ) THEN
        RAISE NOTICE 'Column %.% already exists, skipping rename', tbl_name, new_column_name;
        RETURN FALSE;
    END IF;
    
    -- Rename the column
    EXECUTE format('ALTER TABLE %I RENAME COLUMN %I TO %I', 
                   tbl_name, old_column_name, new_column_name);
    RAISE NOTICE 'Successfully renamed column %.% to %.%', 
                 tbl_name, old_column_name, tbl_name, new_column_name;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Standardize contacts table columns
SELECT safe_rename_column('contacts', 'companyId', 'company_id');
SELECT safe_rename_column('contacts', 'userId', 'user_id');
SELECT safe_rename_column('contacts', 'firstName', 'first_name');
SELECT safe_rename_column('contacts', 'lastName', 'last_name');
SELECT safe_rename_column('contacts', 'hubspotId', 'hubspot_id');
SELECT safe_rename_column('contacts', 'isPotentialVAR', 'is_potential_var');
SELECT safe_rename_column('contacts', 'lastSyncedAt', 'last_synced_at');

-- Standardize deals table columns
SELECT safe_rename_column('deals', 'companyId', 'company_id');
SELECT safe_rename_column('deals', 'userId', 'user_id');
SELECT safe_rename_column('deals', 'hubspotId', 'hubspot_id');
SELECT safe_rename_column('deals', 'closeDate', 'close_date');
SELECT safe_rename_column('deals', 'lastSyncedAt', 'last_synced_at');

-- Standardize companies table columns
SELECT safe_rename_column('companies', 'hubspotId', 'hubspot_id');

-- Update the contacts policy to use the new column name (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contacts') THEN
        DROP POLICY IF EXISTS "Users can view company contacts" ON contacts;
        CREATE POLICY "Users can view company contacts" ON contacts
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_profiles.id = auth.uid() 
                    AND user_profiles.company_id = contacts.company_id
                )
            );
    ELSE
        RAISE NOTICE 'Table contacts does not exist, skipping policy creation';
    END IF;
END $$;

-- Update the deals policy to use the new column name (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'deals') THEN
        DROP POLICY IF EXISTS "Users can view company deals" ON deals;
        CREATE POLICY "Users can view company deals" ON deals
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_profiles.id = auth.uid() 
                    AND user_profiles.company_id = deals.company_id
                )
            );
    ELSE
        RAISE NOTICE 'Table deals does not exist, skipping policy creation';
    END IF;
END $$;

-- Clean up helper function
DROP FUNCTION IF EXISTS safe_rename_column(TEXT, TEXT, TEXT); 