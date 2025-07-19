-- Fix remaining missing tables
-- This addresses 404 and 406 errors for ai_company_profiles, oauth_tokens, ai_integrations_oauth, and ai_email_accounts

-- Drop and recreate ai_company_profiles table
DROP TABLE IF EXISTS public.ai_company_profiles CASCADE;
CREATE TABLE public.ai_company_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    profile_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drop and recreate oauth_tokens table
DROP TABLE IF EXISTS public.oauth_tokens CASCADE;
CREATE TABLE public.oauth_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    integration_slug TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ,
    token_type TEXT DEFAULT 'Bearer',
    scope TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, integration_slug)
);

-- Drop and recreate ai_integrations_oauth table
DROP TABLE IF EXISTS public.ai_integrations_oauth CASCADE;
CREATE TABLE public.ai_integrations_oauth (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    provider TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ,
    token_type TEXT DEFAULT 'Bearer',
    scope TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

-- Drop and recreate ai_email_accounts table
DROP TABLE IF EXISTS public.ai_email_accounts CASCADE;
CREATE TABLE public.ai_email_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    provider TEXT NOT NULL,
    email TEXT NOT NULL,
    account_data JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, provider, email)
);

-- Create indexes for all tables
CREATE INDEX idx_ai_company_profiles_user_id ON public.ai_company_profiles(user_id);
CREATE INDEX idx_ai_company_profiles_company_id ON public.ai_company_profiles(company_id);
CREATE INDEX idx_oauth_tokens_user_id ON public.oauth_tokens(user_id);
CREATE INDEX idx_oauth_tokens_integration_slug ON public.oauth_tokens(integration_slug);
CREATE INDEX idx_ai_integrations_oauth_user_id ON public.ai_integrations_oauth(user_id);
CREATE INDEX idx_ai_integrations_oauth_provider ON public.ai_integrations_oauth(provider);
CREATE INDEX idx_ai_email_accounts_user_id ON public.ai_email_accounts(user_id);
CREATE INDEX idx_ai_email_accounts_provider ON public.ai_email_accounts(provider);

-- Enable RLS on all tables
ALTER TABLE public.ai_company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_integrations_oauth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_email_accounts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ai_company_profiles
CREATE POLICY "Users can view own ai company profiles" ON public.ai_company_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai company profiles" ON public.ai_company_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ai company profiles" ON public.ai_company_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ai company profiles" ON public.ai_company_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for oauth_tokens
CREATE POLICY "Users can view own oauth tokens" ON public.oauth_tokens
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own oauth tokens" ON public.oauth_tokens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own oauth tokens" ON public.oauth_tokens
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own oauth tokens" ON public.oauth_tokens
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for ai_integrations_oauth
CREATE POLICY "Users can view own ai integrations oauth" ON public.ai_integrations_oauth
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai integrations oauth" ON public.ai_integrations_oauth
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ai integrations oauth" ON public.ai_integrations_oauth
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ai integrations oauth" ON public.ai_integrations_oauth
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for ai_email_accounts
CREATE POLICY "Users can view own ai email accounts" ON public.ai_email_accounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai email accounts" ON public.ai_email_accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ai email accounts" ON public.ai_email_accounts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ai email accounts" ON public.ai_email_accounts
    FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.ai_company_profiles TO authenticated;
GRANT ALL ON public.oauth_tokens TO authenticated;
GRANT ALL ON public.ai_integrations_oauth TO authenticated;
GRANT ALL ON public.ai_email_accounts TO authenticated;

-- Add comments
COMMENT ON TABLE public.ai_company_profiles IS 'AI-generated company profiles and data';
COMMENT ON TABLE public.oauth_tokens IS 'OAuth tokens for various integrations';
COMMENT ON TABLE public.ai_integrations_oauth IS 'OAuth tokens for AI integrations';
COMMENT ON TABLE public.ai_email_accounts IS 'Email accounts connected to AI integrations'; 