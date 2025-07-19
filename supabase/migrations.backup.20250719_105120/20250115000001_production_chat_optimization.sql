-- Production Chat Optimization Migration
-- Adds licensing, quotas, usage tracking, and performance optimizations

-- User licenses table for subscription management
CREATE TABLE IF NOT EXISTS public.user_licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    tier TEXT NOT NULL CHECK (tier IN ('free', 'pro', 'enterprise', 'custom')),
    status TEXT NOT NULL CHECK (status IN ('active', 'suspended', 'expired')) DEFAULT 'active',
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, org_id)
);

-- Add unique constraint on user_id if it doesn't exist (for the INSERT statement)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_licenses_user_id_unique' 
        AND conrelid = 'public.user_licenses'::regclass
    ) THEN
        ALTER TABLE public.user_licenses ADD CONSTRAINT user_licenses_user_id_unique UNIQUE (user_id);
    END IF;
END $$;

-- Usage tracking table for billing and analytics
CREATE TABLE IF NOT EXISTS public.chat_usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Daily counters
    messages_sent INTEGER DEFAULT 0,
    ai_requests_made INTEGER DEFAULT 0,
    files_uploaded INTEGER DEFAULT 0,
    tokens_used INTEGER DEFAULT 0,
    
    -- Cost tracking
    estimated_cost_usd DECIMAL(10,4) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, org_id, date)
);

-- Add missing columns to existing chat_usage_tracking table if they don't exist
ALTER TABLE public.chat_usage_tracking ADD COLUMN IF NOT EXISTS messages_sent INTEGER DEFAULT 0;
ALTER TABLE public.chat_usage_tracking ADD COLUMN IF NOT EXISTS ai_requests_made INTEGER DEFAULT 0;
ALTER TABLE public.chat_usage_tracking ADD COLUMN IF NOT EXISTS files_uploaded INTEGER DEFAULT 0;
ALTER TABLE public.chat_usage_tracking ADD COLUMN IF NOT EXISTS tokens_used INTEGER DEFAULT 0;
ALTER TABLE public.chat_usage_tracking ADD COLUMN IF NOT EXISTS estimated_cost_usd DECIMAL(10,4) DEFAULT 0;

-- Performance optimization: Add indexes for chat_messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_user 
ON public.chat_messages(conversation_id, user_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at 
ON public.chat_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_recent 
ON public.chat_messages(user_id, created_at DESC);

-- Performance optimization: Add indexes for conversations
CREATE INDEX IF NOT EXISTS idx_conversations_user_updated 
ON public.conversations(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_agent_id 
ON public.conversations(agent_id);

-- Performance optimization: Add indexes for usage tracking
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_date 
ON public.chat_usage_tracking(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_usage_tracking_org_date 
ON public.chat_usage_tracking(org_id, date DESC) WHERE org_id IS NOT NULL;

-- Performance optimization: Add indexes for licenses
CREATE INDEX IF NOT EXISTS idx_user_licenses_user_status 
ON public.user_licenses(user_id, status);

CREATE INDEX IF NOT EXISTS idx_user_licenses_org_status 
ON public.user_licenses(org_id, status) WHERE org_id IS NOT NULL;

-- RLS Policies for user_licenses
ALTER TABLE public.user_licenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own licenses" ON public.user_licenses;
CREATE POLICY "Users can view their own licenses" ON public.user_licenses
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own licenses" ON public.user_licenses;
CREATE POLICY "Users can update their own licenses" ON public.user_licenses
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for chat_usage_tracking
ALTER TABLE public.chat_usage_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own usage" ON public.chat_usage_tracking;
CREATE POLICY "Users can view their own usage" ON public.chat_usage_tracking
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own usage" ON public.chat_usage_tracking;
CREATE POLICY "Users can update their own usage" ON public.chat_usage_tracking
    FOR ALL USING (auth.uid() = user_id);

-- Add conversation length limits with a function
CREATE OR REPLACE FUNCTION check_conversation_length()
RETURNS TRIGGER AS $$
DECLARE
    message_count INTEGER;
    user_tier TEXT DEFAULT 'free';
    max_length INTEGER DEFAULT 50;
BEGIN
    -- Get user's tier
    SELECT tier INTO user_tier
    FROM public.user_licenses
    WHERE user_id = NEW.user_id AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Set max length based on tier
    CASE user_tier
        WHEN 'pro' THEN max_length := 200;
        WHEN 'enterprise' THEN max_length := 1000;
        WHEN 'custom' THEN max_length := 2000;
        ELSE max_length := 50;
    END CASE;
    
    -- Count existing messages in conversation
    SELECT COUNT(*) INTO message_count
    FROM public.chat_messages
    WHERE conversation_id = NEW.conversation_id;
    
    -- Check if limit would be exceeded
    IF message_count >= max_length THEN
        RAISE EXCEPTION 'Conversation length limit of % messages reached for % tier', max_length, user_tier;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for conversation length limits
DROP TRIGGER IF EXISTS trigger_check_conversation_length ON public.chat_messages;
CREATE TRIGGER trigger_check_conversation_length
    BEFORE INSERT ON public.chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION check_conversation_length();

-- Function to clean up old usage data (for data retention)
CREATE OR REPLACE FUNCTION cleanup_old_usage_data()
RETURNS void AS $$
BEGIN
    -- Delete usage tracking data older than 2 years
    DELETE FROM public.chat_usage_tracking
    WHERE date < CURRENT_DATE - INTERVAL '2 years';
    
    -- Delete expired licenses
    DELETE FROM public.user_licenses
    WHERE status = 'expired' AND expires_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers for new tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_licenses_updated_at
    BEFORE UPDATE ON public.user_licenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_tracking_updated_at
    BEFORE UPDATE ON public.chat_usage_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default free licenses for existing users
INSERT INTO public.user_licenses (user_id, tier, status)
SELECT DISTINCT u.id, 'free', 'active'
FROM auth.users u
LEFT JOIN public.user_licenses ul ON u.id = ul.user_id
WHERE ul.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Add message pagination function for better performance
CREATE OR REPLACE FUNCTION get_messages_paginated(
    conversation_id_param UUID,
    limit_param INTEGER DEFAULT 50,
    offset_param INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    role TEXT,
    content TEXT,
    created_at TIMESTAMPTZ,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cm.id,
        cm.role,
        cm.content,
        cm.created_at,
        cm.metadata
    FROM public.chat_messages cm
    WHERE cm.conversation_id = conversation_id_param
      AND cm.user_id = auth.uid()
    ORDER BY cm.created_at DESC
    LIMIT limit_param
    OFFSET offset_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_messages_paginated TO authenticated;

-- Add a view for user statistics
CREATE OR REPLACE VIEW user_chat_stats AS
SELECT 
    u.id as user_id,
    ul.tier,
    ul.status as license_status,
    COALESCE(today.messages_sent, 0) as messages_today,
    COALESCE(today.ai_requests_made, 0) as ai_requests_today,
    COALESCE(week.total_messages, 0) as messages_this_week,
    COALESCE(week.total_cost, 0) as cost_this_week,
    COALESCE(conv_count.total, 0) as total_conversations
FROM auth.users u
LEFT JOIN public.user_licenses ul ON u.id = ul.user_id AND ul.status = 'active'
LEFT JOIN public.chat_usage_tracking today ON u.id = today.user_id AND today.date = CURRENT_DATE
LEFT JOIN (
    SELECT 
        user_id,
        SUM(messages_sent) as total_messages,
        SUM(estimated_cost_usd) as total_cost
    FROM public.chat_usage_tracking
    WHERE date >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY user_id
) week ON u.id = week.user_id
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(*) as total
    FROM public.conversations
    GROUP BY user_id
) conv_count ON u.id = conv_count.user_id;

-- RLS for the view
ALTER VIEW user_chat_stats SET (security_invoker = on);

COMMENT ON TABLE public.user_licenses IS 'User subscription licenses and tiers';
COMMENT ON TABLE public.chat_usage_tracking IS 'Daily usage tracking for billing and analytics';
COMMENT ON FUNCTION check_conversation_length() IS 'Enforces conversation length limits based on user tier';
COMMENT ON FUNCTION get_messages_paginated(UUID, INTEGER, INTEGER) IS 'Paginated message retrieval for better performance';
COMMENT ON VIEW user_chat_stats IS 'Aggregated user statistics for dashboard display'; 