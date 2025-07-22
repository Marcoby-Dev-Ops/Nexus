-- Migration: Create audit_logs table for tracking integration activities
-- This table is needed for compliance, debugging, and monitoring integration activities

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    integration TEXT NOT NULL,
    action TEXT NOT NULL,
    details JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update audit logs" ON public.audit_logs
    FOR UPDATE USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_integration ON public.audit_logs(integration);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp);

-- Add comments for documentation
COMMENT ON TABLE public.audit_logs IS 'Audit trail for integration activities and user actions';
COMMENT ON COLUMN public.audit_logs.integration IS 'Integration identifier (e.g., microsoft, google, hubspot)';
COMMENT ON COLUMN public.audit_logs.action IS 'Action performed (e.g., oauth_initiated, oauth_completed, token_refreshed)';
COMMENT ON COLUMN public.audit_logs.details IS 'JSON object containing additional details about the action'; 