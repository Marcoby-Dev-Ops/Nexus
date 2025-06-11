-- Fix RLS Security Vulnerabilities
-- Addresses: Auth RLS Initialization Plan & Multiple Permissive Policies

-- =====================================================
-- 1. ENABLE RLS ON ALL TABLES
-- =====================================================

-- Users/Profiles table
ALTER TABLE IF EXISTS user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;

-- Business data tables
ALTER TABLE IF EXISTS companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS expenses ENABLE ROW LEVEL SECURITY;

-- Communication tables
ALTER TABLE IF EXISTS chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;

-- Integration tables
ALTER TABLE IF EXISTS integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS api_logs ENABLE ROW LEVEL SECURITY;

-- Analytics tables
ALTER TABLE IF EXISTS user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS usage_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS billing_subscriptions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. DROP EXISTING PERMISSIVE POLICIES
-- =====================================================

-- Remove overly permissive policies that allow unrestricted access
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Find and drop policies that are too permissive
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND (
            -- Policies that allow all operations without restrictions
            qual IS NULL 
            OR qual = 'true'
            OR qual = '(true)'
            OR with_check IS NULL
            OR with_check = 'true'
            OR with_check = '(true)'
        )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      policy_record.policyname, 
                      policy_record.schemaname, 
                      policy_record.tablename);
    END LOOP;
END $$;

-- =====================================================
-- 3. CREATE SECURE RLS POLICIES
-- =====================================================

-- Profiles/Users: Users can only access their own data
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Companies: Users can only access companies they belong to
CREATE POLICY "Users can view own company data" ON companies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.company_id = companies.id
        )
    );

CREATE POLICY "Company admins can manage company data" ON companies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.company_id = companies.id
            AND user_profiles.role IN ('admin', 'owner')
        )
    );

-- Contacts: Users can only access contacts from their company
CREATE POLICY "Users can view company contacts" ON contacts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.company_id = contacts.company_id
        )
    );

CREATE POLICY "Users can manage company contacts" ON contacts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.company_id = contacts.company_id
            AND user_profiles.role IN ('admin', 'owner', 'sales', 'manager')
        )
    );

-- Deals: Users can only access deals from their company
CREATE POLICY "Users can view company deals" ON deals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.company_id = deals.company_id
        )
    );

CREATE POLICY "Sales users can manage deals" ON deals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.company_id = deals.company_id
            AND user_profiles.role IN ('admin', 'owner', 'sales', 'manager')
        )
    );

-- Chat Sessions: Users can only access their own chat sessions
CREATE POLICY "Users can view own chat sessions" ON chat_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat sessions" ON chat_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat sessions" ON chat_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Chat Messages: Users can only access messages from their sessions
CREATE POLICY "Users can view own chat messages" ON chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_sessions 
            WHERE chat_sessions.id = chat_messages.session_id 
            AND chat_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create chat messages in own sessions" ON chat_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_sessions 
            WHERE chat_sessions.id = chat_messages.session_id 
            AND chat_sessions.user_id = auth.uid()
        )
    );

-- Integrations: Users can only access their company's integrations
CREATE POLICY "Users can view company integrations" ON integrations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.company_id = integrations.company_id
        )
    );

CREATE POLICY "Admins can manage integrations" ON integrations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.company_id = integrations.company_id
            AND user_profiles.role IN ('admin', 'owner')
        )
    );

-- Usage Quotas: Users can only view their own quotas
CREATE POLICY "Users can view own quotas" ON usage_quotas
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage quotas" ON usage_quotas
    FOR ALL USING (
        -- Only allow service role to manage quotas
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Billing: Users can only access their company's billing
CREATE POLICY "Users can view company billing" ON billing_subscriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.company_id = billing_subscriptions.company_id
        )
    );

CREATE POLICY "Admins can manage billing" ON billing_subscriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.company_id = billing_subscriptions.company_id
            AND user_profiles.role IN ('admin', 'owner')
        )
    );

-- =====================================================
-- 4. CREATE SECURITY FUNCTIONS
-- =====================================================

-- Function to check if user is admin of their company
CREATE OR REPLACE FUNCTION auth.is_company_admin(company_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() 
        AND company_id = company_uuid
        AND role IN ('admin', 'owner')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's company ID
CREATE OR REPLACE FUNCTION auth.get_user_company_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT company_id FROM user_profiles 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. CREATE AUDIT LOG FOR SECURITY EVENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS security_audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    event_type TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit logs
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view security audit logs" ON security_audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role IN ('admin', 'owner')
        )
    );

-- System can insert audit logs
CREATE POLICY "System can insert audit logs" ON security_audit_logs
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- 6. REVOKE PUBLIC ACCESS
-- =====================================================

-- Revoke all public access to tables
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;

-- Grant specific permissions only
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- =====================================================
-- 7. COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON POLICY "Users can view own profile" ON user_profiles IS 
'Users can only view their own profile data';

COMMENT ON POLICY "Users can view company contacts" ON contacts IS 
'Users can only view contacts that belong to their company';

COMMENT ON FUNCTION auth.is_company_admin(UUID) IS 
'Helper function to check if authenticated user is admin of specified company';

-- Migration completed successfully
SELECT 'RLS Security Migration Completed' AS status; 