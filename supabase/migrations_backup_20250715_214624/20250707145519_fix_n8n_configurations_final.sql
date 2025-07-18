-- Fix n8n_configurations table to match application expectations
-- This matches the structure expected by userN8nConfig.ts and N8nConnectionSetup.tsx

-- Drop the existing table if it has wrong structure
DROP TABLE IF EXISTS public.n8n_configurations CASCADE;

-- Recreate n8n_configurations table with the exact structure expected by the app
CREATE TABLE public.n8n_configurations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    instance_name TEXT,
    base_url TEXT NOT NULL,
    api_key TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
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

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_n8n_configurations_updated_at
    BEFORE UPDATE ON public.n8n_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.n8n_configurations IS 'n8n workflow configurations for user instances'; 