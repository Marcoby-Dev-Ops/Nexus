-- Migration 113: Ensure OpenClaw system user and add integration optimizations
-- This migration ensures there's a system user for OpenClaw and adds optimizations

-- Create or ensure OpenClaw system user exists
DO $$
DECLARE
    v_openclaw_user_id VARCHAR(255) := 'openclaw-system-user';
BEGIN
    -- Check if OpenClaw system user already exists
    IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = v_openclaw_user_id) THEN
        -- Insert OpenClaw system user
        INSERT INTO user_profiles (
            user_id,
            email,
            display_name,
            metadata,
            created_at,
            updated_at
        ) VALUES (
            v_openclaw_user_id,
            'openclaw@system.local',
            'OpenClaw System',
            jsonb_build_object(
                'source', 'system',
                'system_type', 'openclaw',
                'is_system_user', true,
                'description', 'System user for OpenClaw integration'
            ),
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Created OpenClaw system user: %', v_openclaw_user_id;
    ELSE
        RAISE NOTICE 'OpenClaw system user already exists: %', v_openclaw_user_id;
    END IF;
END $$;

-- Add index for combined source and user queries
CREATE INDEX IF NOT EXISTS idx_ai_conversations_source_user 
ON ai_conversations(source, user_id);

CREATE INDEX IF NOT EXISTS idx_ai_messages_source_conversation
ON ai_messages(source, conversation_id);

-- Create a function to get conversation statistics by source
CREATE OR REPLACE FUNCTION get_conversation_stats_by_source(
    p_start_date TIMESTAMP DEFAULT NULL,
    p_end_date TIMESTAMP DEFAULT NULL
) RETURNS TABLE (
    source VARCHAR(50),
    conversation_count BIGINT,
    total_messages BIGINT,
    avg_messages_per_conversation DECIMAL(10,2),
    latest_conversation TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ac.source,
        COUNT(DISTINCT ac.id) as conversation_count,
        COUNT(am.id) as total_messages,
        ROUND(AVG(ac.message_count)::DECIMAL, 2) as avg_messages_per_conversation,
        MAX(ac.created_at) as latest_conversation
    FROM ai_conversations ac
    LEFT JOIN ai_messages am ON ac.id = am.conversation_id
    WHERE 
        (p_start_date IS NULL OR ac.created_at >= p_start_date)
        AND (p_end_date IS NULL OR ac.created_at <= p_end_date)
    GROUP BY ac.source
    ORDER BY conversation_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Create a function to cleanup old OpenClaw conversations (optional)
CREATE OR REPLACE FUNCTION cleanup_old_openclaw_conversations(
    p_older_than_days INTEGER DEFAULT 30
) RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM ai_conversations 
    WHERE source = 'openclaw' 
    AND created_at < NOW() - (p_older_than_days || ' days')::INTERVAL
    RETURNING COUNT(*) INTO v_deleted_count;
    
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a view for monitoring OpenClaw integration health
CREATE OR REPLACE VIEW openclaw_integration_health AS
SELECT 
    'conversations' as metric_type,
    COUNT(*) as total_count,
    COUNT(CASE WHEN source = 'openclaw' THEN 1 END) as openclaw_count,
    ROUND(COUNT(CASE WHEN source = 'openclaw' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 2) as openclaw_percentage
FROM ai_conversations
UNION ALL
SELECT 
    'messages' as metric_type,
    COUNT(*) as total_count,
    COUNT(CASE WHEN source = 'openclaw' THEN 1 END) as openclaw_count,
    ROUND(COUNT(CASE WHEN source = 'openclaw' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 2) as openclaw_percentage
FROM ai_messages;

-- Add comment to document the system user
COMMENT ON TABLE user_profiles IS 'User profiles including system users like OpenClaw';

-- Migration record is inserted by the migration runner