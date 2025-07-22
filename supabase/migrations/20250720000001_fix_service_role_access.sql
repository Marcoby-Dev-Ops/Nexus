-- Fix service role access to user_integrations table
-- This migration addresses the 403 error by granting proper table privileges
-- The service role policies already exist, but table privileges are missing

-- Grant table privileges to service_role
GRANT ALL PRIVILEGES ON TABLE public.user_integrations TO service_role;

-- Also grant privileges to integrations table for completeness
GRANT ALL PRIVILEGES ON TABLE public.integrations TO service_role;

-- Grant privileges to any integration data tables that might exist
-- This covers tables like integration_ninjarmm_device_data and similar

-- Grant privileges to integration_ninjarmm_device_data if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'integration_ninjarmm_device_data') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.integration_ninjarmm_device_data TO service_role';
    END IF;
END $$;

-- Grant privileges to integration_webhooks if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'integration_webhooks') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.integration_webhooks TO service_role';
    END IF;
END $$;

-- Grant privileges to integration_data if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'integration_data') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.integration_data TO service_role';
    END IF;
END $$;

-- Grant privileges to integration_sync_logs if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'integration_sync_logs') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.integration_sync_logs TO service_role';
    END IF;
END $$; 