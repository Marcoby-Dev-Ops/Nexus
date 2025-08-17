-- Nexus Database Migration Script for pgvector 17
-- This script migrates the schema from Supabase to standalone pgvector

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public" VERSION '0.8.0';
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create auth schema and tables (simplified for local dev)
CREATE SCHEMA IF NOT EXISTS auth;

-- Core user management tables
CREATE TABLE IF NOT EXISTS auth.users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email text UNIQUE NOT NULL,
    encrypted_password text,
    email_confirmed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean DEFAULT false,
    confirmed_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    phone text,
    phone_confirmed_at timestamp with time zone,
    confirmation_token text,
    email_change_token_new text,
    recovery_token text
);

-- User profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name text,
    last_name text,
    avatar_url text,
    company_id uuid,
    role text DEFAULT 'user',
    preferences jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    onboarding_completed boolean DEFAULT false,
    subscription_tier text DEFAULT 'free',
    last_active_at timestamp with time zone DEFAULT now()
);

-- Companies table
CREATE TABLE IF NOT EXISTS public.companies (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    industry text,
    size text,
    website text,
    logo_url text,
    owner_id uuid REFERENCES auth.users(id),
    status text DEFAULT 'active',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    settings jsonb DEFAULT '{}',
    subscription_plan text DEFAULT 'free',
    max_users integer DEFAULT 5
);

-- Company members
CREATE TABLE IF NOT EXISTS public.company_members (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    role text DEFAULT 'member',
    joined_at timestamp with time zone DEFAULT now(),
    permissions jsonb DEFAULT '{}',
    UNIQUE(company_id, user_id)
);

-- Integrations table
CREATE TABLE IF NOT EXISTS public.integrations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    type text NOT NULL,
    description text,
    config_schema jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- User integrations
CREATE TABLE IF NOT EXISTS public.user_integrations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    integration_id uuid REFERENCES public.integrations(id) ON DELETE CASCADE,
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    config jsonb DEFAULT '{}',
    status text DEFAULT 'active',
    last_sync_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    metadata jsonb DEFAULT '{}'
);

-- Tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    status text DEFAULT 'pending',
    priority text DEFAULT 'medium',
    due_date timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    tags text[],
    assigned_to uuid REFERENCES auth.users(id)
);

-- Thoughts table with vector support
CREATE TABLE IF NOT EXISTS public.thoughts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    content text NOT NULL,
    title text,
    category text,
    tags text[],
    is_public boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    embedding vector(1536)
);

-- Documents table with vector support
CREATE TABLE IF NOT EXISTS public.documents (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    title text NOT NULL,
    content text,
    file_url text,
    file_type text,
    file_size integer,
    tags text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    embedding vector(1536)
);

-- AI Models table
CREATE TABLE IF NOT EXISTS public.ai_models (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    provider text NOT NULL,
    model_type text NOT NULL,
    config jsonb DEFAULT '{}',
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- User AI Model Preferences
CREATE TABLE IF NOT EXISTS public.user_ai_model_preferences (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    model_id uuid REFERENCES public.ai_models(id) ON DELETE CASCADE,
    preferences jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, model_id)
);

-- Analytics Events
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    event_type text NOT NULL,
    event_data jsonb DEFAULT '{}',
    session_id text,
    created_at timestamp with time zone DEFAULT now()
);

-- Callback Events
CREATE TABLE IF NOT EXISTS public.callback_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    event_type text NOT NULL,
    payload jsonb DEFAULT '{}',
    status text DEFAULT 'pending',
    processed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- OAuth Tokens
CREATE TABLE IF NOT EXISTS public.oauth_tokens (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    integration_id uuid REFERENCES public.integrations(id) ON DELETE CASCADE,
    access_token text,
    refresh_token text,
    token_type text,
    expires_at timestamp with time zone,
    scope text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Environment Config
CREATE TABLE IF NOT EXISTS public.environment_config (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    key text UNIQUE NOT NULL,
    value text,
    description text,
    is_secret boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_company_id ON public.user_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_company_members_company_id ON public.company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_members_user_id ON public.company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_user_integrations_user_id ON public.user_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_integrations_company_id ON public.user_integrations(company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_company_id ON public.tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_thoughts_user_id ON public.thoughts(user_id);
CREATE INDEX IF NOT EXISTS idx_thoughts_company_id ON public.thoughts(company_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_company_id ON public.documents(company_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);

-- Create vector indexes
CREATE INDEX IF NOT EXISTS idx_thoughts_embedding ON public.thoughts USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_documents_embedding ON public.documents USING ivfflat (embedding vector_cosine_ops);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_integrations_updated_at BEFORE UPDATE ON public.user_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_thoughts_updated_at BEFORE UPDATE ON public.thoughts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_oauth_tokens_updated_at BEFORE UPDATE ON public.oauth_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_callback_events_updated_at BEFORE UPDATE ON public.callback_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_environment_config_updated_at BEFORE UPDATE ON public.environment_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Vector search functions
CREATE OR REPLACE FUNCTION match_documents(
    query_embedding vector(1536),
    match_count int DEFAULT 5,
    filter jsonb DEFAULT '{}'
)
RETURNS TABLE (
    id uuid,
    title text,
    content text,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id,
        d.title,
        d.content,
        1 - (d.embedding <=> query_embedding) as similarity
    FROM public.documents d
    WHERE d.embedding IS NOT NULL
    ORDER BY d.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION match_thoughts(
    query_embedding vector(1536),
    match_count int DEFAULT 5,
    filter jsonb DEFAULT '{}'
)
RETURNS TABLE (
    id uuid,
    title text,
    content text,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        t.title,
        t.content,
        1 - (t.embedding <=> query_embedding) as similarity
    FROM public.thoughts t
    WHERE t.embedding IS NOT NULL
    ORDER BY t.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Insert default data
INSERT INTO public.integrations (name, type, description, config_schema) VALUES
('OpenAI', 'ai', 'OpenAI API integration', '{"api_key": "string", "model": "string"}'),
('Anthropic', 'ai', 'Anthropic Claude API integration', '{"api_key": "string", "model": "string"}'),
('HubSpot', 'crm', 'HubSpot CRM integration', '{"api_key": "string", "portal_id": "string"}'),
('Slack', 'communication', 'Slack workspace integration', '{"bot_token": "string", "app_token": "string"}')
ON CONFLICT DO NOTHING;

INSERT INTO public.ai_models (name, provider, model_type, config) VALUES
('gpt-4', 'OpenAI', 'chat', '{"max_tokens": 4096, "temperature": 0.7}'),
('gpt-3.5-turbo', 'OpenAI', 'chat', '{"max_tokens": 4096, "temperature": 0.7}'),
('claude-3-opus', 'Anthropic', 'chat', '{"max_tokens": 4096, "temperature": 0.7}'),
('claude-3-sonnet', 'Anthropic', 'chat', '{"max_tokens": 4096, "temperature": 0.7}')
ON CONFLICT DO NOTHING;

-- Create a default admin user (password: admin123)
INSERT INTO auth.users (id, email, encrypted_password, is_super_admin, confirmed_at) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'admin@nexus.local', crypt('admin123', gen_salt('bf')), true, now())
ON CONFLICT DO NOTHING;

-- Create default company
INSERT INTO public.companies (id, name, description, owner_id) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Nexus Development', 'Development company for Nexus platform', '550e8400-e29b-41d4-a716-446655440000')
ON CONFLICT DO NOTHING;

-- Create admin user profile
INSERT INTO public.user_profiles (id, user_id, first_name, last_name, company_id, role, onboarding_completed) VALUES
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Admin', 'User', '550e8400-e29b-41d4-a716-446655440001', 'admin', true)
ON CONFLICT DO NOTHING;

-- Add admin to company
INSERT INTO public.company_members (company_id, user_id, role) VALUES
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'owner')
ON CONFLICT DO NOTHING;
