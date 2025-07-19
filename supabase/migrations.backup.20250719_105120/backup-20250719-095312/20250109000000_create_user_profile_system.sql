-- Create companies/organizations table
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT,
    industry TEXT,
    size TEXT CHECK (size IN ('startup', 'small', 'medium', 'large', 'enterprise')),
    logo_url TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    first_name TEXT,
    last_name TEXT,
    display_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('owner', 'admin', 'manager', 'user')),
    department TEXT,
    job_title TEXT,
    phone TEXT,
    timezone TEXT DEFAULT 'UTC',
    preferences JSONB DEFAULT '{"theme": "system", "notifications": true, "language": "en"}',
    onboarding_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create integrations table (for tracking all available integrations)
CREATE TABLE IF NOT EXISTS public.integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL, -- 'crm', 'payment', 'email', 'automation', etc.
    description TEXT,
    icon_url TEXT,
    config_schema JSONB, -- JSON schema for configuration fields
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_integrations table (user-specific integration instances)
CREATE TABLE IF NOT EXISTS public.user_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    integration_id UUID NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
    name TEXT, -- User-defined name for this integration instance
    config JSONB DEFAULT '{}', -- Encrypted configuration data
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error', 'setup')),
    last_sync TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, integration_id, name) -- Prevent duplicate integrations per user
);

-- Create updated_at triggers
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_integrations_updated_at
    BEFORE UPDATE ON public.user_integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies
CREATE POLICY "Users can view their company" ON public.companies
    FOR SELECT USING (
        id IN (
            SELECT company_id FROM public.user_profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Company owners can update company" ON public.companies
    FOR UPDATE USING (
        id IN (
            SELECT company_id FROM public.user_profiles 
            WHERE id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (id = auth.uid());

-- RLS Policies for integrations (public read)
CREATE POLICY "Everyone can view available integrations" ON public.integrations
    FOR SELECT USING (is_active = true);

-- RLS Policies for user_integrations
CREATE POLICY "Users can view own integrations" ON public.user_integrations
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own integrations" ON public.user_integrations
    FOR ALL USING (user_id = auth.uid());

-- Create functions for common operations
CREATE OR REPLACE FUNCTION get_user_with_company(user_uuid UUID)
RETURNS TABLE(
    user_id UUID,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    display_name TEXT,
    avatar_url TEXT,
    role TEXT,
    department TEXT,
    company_name TEXT,
    company_id UUID,
    company_domain TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id,
        au.email,
        up.first_name,
        up.last_name,
        up.display_name,
        up.avatar_url,
        up.role,
        up.department,
        c.name,
        c.id,
        c.domain
    FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    LEFT JOIN public.companies c ON c.id = up.company_id
    WHERE up.id = user_uuid;
END;
$$;

-- Insert default integrations
INSERT INTO public.integrations (name, slug, category, description) VALUES
('Stripe', 'stripe', 'payment', 'Payment processing and subscription management'),
('PayPal', 'paypal', 'payment', 'Online payment processing'),
('HubSpot CRM', 'hubspot-crm', 'crm', 'Customer relationship management'),
('Salesforce', 'salesforce', 'crm', 'Enterprise CRM platform'),
('Mailchimp', 'mailchimp', 'email', 'Email marketing and automation'),
('SendGrid', 'sendgrid', 'email', 'Transactional email service'),
('Slack', 'slack', 'communication', 'Team communication and collaboration'),
('Microsoft Teams', 'microsoft-teams', 'communication', 'Enterprise communication platform'),
('Google Workspace', 'google-workspace', 'productivity', 'Cloud productivity suite'),
('Office 365', 'office-365', 'productivity', 'Microsoft productivity suite'),
('Zapier', 'zapier', 'automation', 'Workflow automation platform'),
('n8n', 'n8n', 'automation', 'Self-hosted workflow automation'),
('Twilio', 'twilio', 'communication', 'SMS and voice communication'),
('QuickBooks', 'quickbooks', 'accounting', 'Small business accounting software'),
('Xero', 'xero', 'accounting', 'Cloud-based accounting platform')
ON CONFLICT (slug) DO NOTHING; 