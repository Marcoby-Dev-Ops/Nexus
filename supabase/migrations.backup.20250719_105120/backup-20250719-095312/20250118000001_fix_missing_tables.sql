-- Fix Missing Tables Migration
-- Resolves 404 errors for component_usages and 400 errors for companies table

-- Create component_usages table for tracking component usage analytics
CREATE TABLE IF NOT EXISTS public.component_usages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    component_name TEXT NOT NULL,
    location TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    usage_count INTEGER DEFAULT 1,
    performance_metrics JSONB DEFAULT '{}',
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_component_usages_component_name ON public.component_usages(component_name);
CREATE INDEX IF NOT EXISTS idx_component_usages_location ON public.component_usages(location);
CREATE INDEX IF NOT EXISTS idx_component_usages_timestamp ON public.component_usages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_component_usages_user_id ON public.component_usages(user_id);
CREATE INDEX IF NOT EXISTS idx_component_usages_company_id ON public.component_usages(company_id);

-- Enable RLS
ALTER TABLE public.component_usages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for component_usages
CREATE POLICY "Users can view their own component usage" ON public.component_usages
    FOR SELECT USING (
        user_id = auth.uid() OR
        company_id IN (
            SELECT company_id FROM public.user_profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own component usage" ON public.component_usages
    FOR INSERT WITH CHECK (
        user_id = auth.uid() OR
        company_id IN (
            SELECT company_id FROM public.user_profiles 
            WHERE id = auth.uid()
        )
    );

-- Ensure companies table has all required columns
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS address JSONB DEFAULT '{}';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS client_base_description TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS hubspotId TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS business_phone TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS duns_number TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS employee_count INTEGER;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS founded TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS headquarters TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS social_profiles TEXT[];
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS specialties TEXT[];
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS followers_count INTEGER;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS microsoft_365 JSONB;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS business_licenses JSONB;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS inventory_management_system TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS fiscal_year_end TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS growth_stage TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS key_metrics JSONB;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS mrr DECIMAL(10,2);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS burn_rate DECIMAL(10,2);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS cac DECIMAL(10,2);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS gross_margin DECIMAL(5,2);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS csat DECIMAL(5,2);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS avg_deal_cycle_days INTEGER;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS avg_first_response_mins INTEGER;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS on_time_delivery_pct DECIMAL(5,2);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS website_visitors_month INTEGER;

-- Create indexes for companies table
CREATE INDEX IF NOT EXISTS idx_companies_hubspotId ON public.companies(hubspotId);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON public.companies(industry);
CREATE INDEX IF NOT EXISTS idx_companies_size ON public.companies(size);
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON public.companies(created_at DESC);

-- Ensure companies table has proper constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'companies_hubspotId_unique' 
        AND conrelid = 'public.companies'::regclass
    ) THEN
        ALTER TABLE public.companies ADD CONSTRAINT companies_hubspotId_unique UNIQUE (hubspotId);
    END IF;
END $$;

-- Add updated_at trigger for component_usages
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_component_usages_updated_at
    BEFORE UPDATE ON public.component_usages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.component_usages TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.component_usages IS 'Tracks usage analytics for UI components and features';
COMMENT ON COLUMN public.component_usages.component_name IS 'Name of the component being tracked';
COMMENT ON COLUMN public.component_usages.location IS 'Page or location where component was used';
COMMENT ON COLUMN public.component_usages.performance_metrics IS 'JSON object containing performance data'; 