-- Create Environment Config Table Migration
-- This migration creates the environment_config table that is referenced in the seed demo data migration

-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create environment_config table
CREATE TABLE IF NOT EXISTS public.environment_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on key for faster lookups
CREATE INDEX IF NOT EXISTS idx_environment_config_key ON public.environment_config(key);

-- Add RLS policy for environment_config table
ALTER TABLE public.environment_config ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role full access
CREATE POLICY "Service role can manage environment config" ON public.environment_config
    FOR ALL USING (auth.role() = 'service_role');

-- Create policy to allow authenticated users to read environment config
CREATE POLICY "Authenticated users can read environment config" ON public.environment_config
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create trigger to update updated_at column
CREATE TRIGGER update_environment_config_updated_at
    BEFORE UPDATE ON public.environment_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 