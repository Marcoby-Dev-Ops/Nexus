-- Security Foundation Migration
-- This ensures every table has proper security from the start

-- Enable RLS on all customer data tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_thoughts ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Customer data isolation policies
CREATE POLICY "user_profiles_isolation" ON user_profiles
FOR ALL USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "user_licenses_isolation" ON user_licenses
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.stripe_customer_id = user_licenses.stripe_customer_id
  )
);

CREATE POLICY "conversations_isolation" ON conversations
FOR ALL USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "messages_isolation" ON messages
FOR ALL USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "thoughts_isolation" ON personal_thoughts
FOR ALL USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "usage_isolation" ON usage_tracking
FOR ALL USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

-- Secure integrations table with encryption
CREATE TABLE IF NOT EXISTS secure_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    integration_type TEXT NOT NULL CHECK (integration_type IN ('crm', 'email', 'calendar', 'finance', 'communication')),
    integration_name TEXT NOT NULL,
    encrypted_credentials TEXT NOT NULL, -- AES-256 encrypted
    permissions JSONB NOT NULL DEFAULT '[]',
    data_retention_days INTEGER DEFAULT 30,
    last_sync TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Security constraints
    CONSTRAINT unique_user_integration UNIQUE (user_id, integration_type, integration_name),
    CONSTRAINT valid_permissions CHECK (jsonb_typeof(permissions) = 'array')
);

-- RLS for integrations
ALTER TABLE secure_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "integrations_isolation" ON secure_integrations
FOR ALL USING (auth.uid() = user_id);

-- Audit logging table
CREATE TABLE IF NOT EXISTS security_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    event_type TEXT NOT NULL,
    event_details JSONB NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Security event types
    CONSTRAINT valid_event_type CHECK (
        event_type IN (
            'login', 'logout', 'data_access', 'integration_added', 
            'integration_removed', 'permission_change', 'data_export',
            'suspicious_activity', 'failed_login', 'data_modification'
        )
    )
);

-- RLS for audit log (only admins and the user can see their own logs)
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_log_user_access" ON security_audit_log
FOR SELECT USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

-- Function to log security events automatically
CREATE OR REPLACE FUNCTION log_security_event(
    p_user_id UUID,
    p_event_type TEXT,
    p_event_details JSONB DEFAULT '{}'::JSONB,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO security_audit_log (
        user_id, event_type, event_details, ip_address, user_agent
    ) VALUES (
        p_user_id, p_event_type, p_event_details, p_ip_address, p_user_agent
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically log data access
CREATE OR REPLACE FUNCTION audit_data_access() RETURNS TRIGGER AS $$
BEGIN
    -- Log any SELECT operations on sensitive tables
    IF TG_OP = 'SELECT' THEN
        PERFORM log_security_event(
            auth.uid(),
            'data_access',
            jsonb_build_object(
                'table', TG_TABLE_NAME,
                'operation', TG_OP,
                'timestamp', NOW()
            )
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to sensitive tables
CREATE TRIGGER audit_conversations_access
    AFTER SELECT ON conversations
    FOR EACH ROW EXECUTE FUNCTION audit_data_access();

CREATE TRIGGER audit_messages_access
    AFTER SELECT ON messages
    FOR EACH ROW EXECUTE FUNCTION audit_data_access();

-- Data encryption functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to encrypt sensitive data
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(
    data TEXT,
    encryption_key TEXT
) RETURNS TEXT AS $$
BEGIN
    RETURN encode(
        pgp_sym_encrypt(data, encryption_key, 'compress-algo=1, cipher-algo=aes256'),
        'base64'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrypt sensitive data
CREATE OR REPLACE FUNCTION decrypt_sensitive_data(
    encrypted_data TEXT,
    encryption_key TEXT
) RETURNS TEXT AS $$
BEGIN
    RETURN pgp_sym_decrypt(
        decode(encrypted_data, 'base64'),
        encryption_key
    );
EXCEPTION
    WHEN others THEN
        RETURN NULL; -- Return NULL if decryption fails
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Data retention policy function
CREATE OR REPLACE FUNCTION cleanup_old_data() RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Clean up old audit logs (keep 1 year)
    DELETE FROM security_audit_log 
    WHERE created_at < NOW() - INTERVAL '1 year';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Clean up old usage tracking (keep 2 years)
    DELETE FROM usage_tracking 
    WHERE created_at < NOW() - INTERVAL '2 years';
    
    -- Log cleanup activity
    PERFORM log_security_event(
        NULL,
        'data_cleanup',
        jsonb_build_object(
            'deleted_audit_logs', deleted_count,
            'cleanup_date', NOW()
        )
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule automatic cleanup (run daily)
SELECT cron.schedule('data-cleanup', '0 2 * * *', 'SELECT cleanup_old_data();');

-- Create security configuration table
CREATE TABLE IF NOT EXISTS security_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key TEXT UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    is_encrypted BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Insert default security configurations
INSERT INTO security_config (config_key, config_value, is_encrypted) VALUES
('password_policy', '{"min_length": 12, "require_uppercase": true, "require_numbers": true, "require_symbols": true}', false),
('session_timeout', '{"hours": 24}', false),
('max_failed_logins', '{"attempts": 5, "lockout_minutes": 30}', false),
('data_retention', '{"default_days": 2555, "audit_logs_days": 365}', false),
('encryption_strength', '{"algorithm": "AES-256", "key_rotation_days": 90}', false);

-- Enable RLS on security config
ALTER TABLE security_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "security_config_admin_only" ON security_config
FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Create indexes for performance and security
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_audit_user_time 
ON security_audit_log (user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_audit_event_type 
ON security_audit_log (event_type, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_secure_integrations_user 
ON secure_integrations (user_id, is_active);

-- Comments for documentation
COMMENT ON TABLE security_audit_log IS 'Comprehensive audit trail for all security-relevant events';
COMMENT ON TABLE secure_integrations IS 'Encrypted storage for third-party integration credentials';
COMMENT ON FUNCTION log_security_event IS 'Standardized security event logging function';
COMMENT ON FUNCTION encrypt_sensitive_data IS 'AES-256 encryption for sensitive data fields';
COMMENT ON FUNCTION decrypt_sensitive_data IS 'Secure decryption with error handling'; 