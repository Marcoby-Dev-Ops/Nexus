-- Create n8n_configurations table
CREATE TABLE IF NOT EXISTS public.n8n_configurations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    instance_name TEXT,
    base_url TEXT NOT NULL,
    api_key TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create updated_at trigger
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

-- Add RLS policies
ALTER TABLE public.n8n_configurations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own configurations
CREATE POLICY "Users can view own n8n configurations" ON public.n8n_configurations
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own configurations
CREATE POLICY "Users can insert own n8n configurations" ON public.n8n_configurations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own configurations
CREATE POLICY "Users can update own n8n configurations" ON public.n8n_configurations
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own configurations
CREATE POLICY "Users can delete own n8n configurations" ON public.n8n_configurations
    FOR DELETE USING (auth.uid() = user_id);
