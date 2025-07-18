-- Test and fix n8n_configurations table
-- This will help us understand what's happening

-- First, let's check if the table exists and what its structure is
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
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'n8n_configurations'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE '  % (%): nullable=%', 
                col_record.column_name, 
                col_record.data_type, 
                col_record.is_nullable;
        END LOOP;
    END IF;
END $$;

-- If table doesn't exist or has wrong structure, recreate it
DROP TABLE IF EXISTS public.n8n_configurations CASCADE;

CREATE TABLE public.n8n_configurations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    webhook_url TEXT,
    api_key TEXT,
    is_active BOOLEAN DEFAULT true,
    config_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint
ALTER TABLE public.n8n_configurations 
ADD CONSTRAINT fk_n8n_configurations_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes
CREATE INDEX idx_n8n_configurations_user_id ON public.n8n_configurations(user_id);
CREATE INDEX idx_n8n_configurations_is_active ON public.n8n_configurations(is_active);

-- Enable RLS
ALTER TABLE public.n8n_configurations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own n8n configurations" ON public.n8n_configurations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own n8n configurations" ON public.n8n_configurations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own n8n configurations" ON public.n8n_configurations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own n8n configurations" ON public.n8n_configurations
    FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.n8n_configurations TO authenticated;
GRANT ALL ON public.n8n_configurations TO anon;

-- Add comment
COMMENT ON TABLE public.n8n_configurations IS 'n8n workflow configurations';

-- Insert a test record
INSERT INTO public.n8n_configurations (user_id, name, webhook_url, api_key, is_active)
VALUES (
    '5f22c576-3732-48f2-89ca-08fb43ac3177'::UUID,
    'Test Configuration',
    'https://test.example.com/webhook',
    'test_api_key',
    true
);

-- Verify the insert worked
DO $$
DECLARE
    record_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO record_count FROM public.n8n_configurations;
    RAISE NOTICE 'Inserted test record. Total records: %', record_count;
END $$; 