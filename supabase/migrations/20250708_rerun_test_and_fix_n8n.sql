DO $$
DECLARE
    table_exists BOOLEAN;
    col_count INTEGER;
    col_record RECORD;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'n8n_configurations'
    ) INTO table_exists;

    RAISE NOTICE 'Table n8n_configurations exists: %', table_exists;

    IF table_exists THEN
        -- Count columns
        SELECT COUNT(*) INTO col_count
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'n8n_configurations';

        RAISE NOTICE 'Number of columns: %', col_count;

        -- List all columns
        RAISE NOTICE 'Columns:';
        FOR col_record IN
            SELECT column_name, data_type, is_nullable FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'n8n_configurations'
        LOOP
            RAISE NOTICE '  % (%): nullable=%', col_record.column_name, col_record.data_type, col_record.is_nullable;
        END LOOP;

        -- Optionally, insert a test record (example)
        INSERT INTO n8n_configurations (id, user_id, instance_name, base_url, api_key, is_active, created_at, updated_at)
        VALUES (gen_random_uuid(), gen_random_uuid(), 'Test Instance', 'https://example.com', 'testkey', true, now(), now())
        ON CONFLICT DO NOTHING;

        -- Count total records
        PERFORM COUNT(*) FROM n8n_configurations;
        RAISE NOTICE 'Inserted test record. Total records: %', (SELECT COUNT(*) FROM n8n_configurations);
    END IF;
END $$; 