-- Migration 112: Add OpenClaw integration support to AI conversations
-- This migration adds support for storing OpenClaw conversations in Nexus

-- Add source column to ai_conversations to track conversation origin
ALTER TABLE ai_conversations 
ADD COLUMN IF NOT EXISTS source VARCHAR(50) NOT NULL DEFAULT 'nexus',
ADD COLUMN IF NOT EXISTS external_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS platform_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Add source column to ai_messages for consistency
ALTER TABLE ai_messages 
ADD COLUMN IF NOT EXISTS source VARCHAR(50) NOT NULL DEFAULT 'nexus',
ADD COLUMN IF NOT EXISTS external_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS platform_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Add index for efficient source-based queries
CREATE INDEX IF NOT EXISTS idx_ai_conversations_source ON ai_conversations(source);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_external_id ON ai_conversations(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_messages_source ON ai_messages(source);
CREATE INDEX IF NOT EXISTS idx_ai_messages_external_id ON ai_messages(external_id) WHERE external_id IS NOT NULL;

-- Add check constraint for valid source values (only if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ai_conversations_source_check') THEN
        ALTER TABLE ai_conversations 
        ADD CONSTRAINT ai_conversations_source_check 
        CHECK (source IN ('nexus', 'openclaw', 'api', 'webhook', 'import'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ai_messages_source_check') THEN
        ALTER TABLE ai_messages 
        ADD CONSTRAINT ai_messages_source_check 
        CHECK (source IN ('nexus', 'openclaw', 'api', 'webhook', 'import'));
    END IF;
END $$;

-- Create a function to insert OpenClaw conversation
CREATE OR REPLACE FUNCTION create_openclaw_conversation(
    p_user_id VARCHAR(255),
    p_external_conversation_id VARCHAR(255),
    p_title VARCHAR(255) DEFAULT 'OpenClaw Conversation',
    p_model VARCHAR(100) DEFAULT 'openclaw',
    p_system_prompt TEXT DEFAULT NULL,
    p_initial_context JSONB DEFAULT '{}'::jsonb,
    p_platform_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
    v_conversation_id UUID;
BEGIN
    -- Insert the conversation
    INSERT INTO ai_conversations (
        user_id,
        external_id,
        title,
        model,
        system_prompt,
        context,
        source,
        platform_metadata,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_external_conversation_id,
        p_title,
        p_model,
        p_system_prompt,
        p_initial_context,
        'openclaw',
        p_platform_metadata,
        NOW(),
        NOW()
    ) RETURNING id INTO v_conversation_id;
    
    RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql;

-- Create a function to insert OpenClaw messages
CREATE OR REPLACE FUNCTION add_openclaw_message(
    p_conversation_id UUID,
    p_external_message_id VARCHAR(255),
    p_role VARCHAR(20),
    p_content TEXT,
    p_platform_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
    v_message_id UUID;
BEGIN
    -- Validate role
    IF p_role NOT IN ('user', 'assistant', 'system') THEN
        RAISE EXCEPTION 'Invalid role: %. Must be user, assistant, or system.', p_role;
    END IF;
    
    -- Insert the message
    INSERT INTO ai_messages (
        conversation_id,
        external_id,
        role,
        content,
        source,
        platform_metadata,
        created_at,
        updated_at
    ) VALUES (
        p_conversation_id,
        p_external_message_id,
        p_role,
        p_content,
        'openclaw',
        p_platform_metadata,
        NOW(),
        NOW()
    ) RETURNING id INTO v_message_id;
    
    -- Update conversation metadata
    UPDATE ai_conversations 
    SET 
        message_count = message_count + 1,
        updated_at = NOW(),
        messages = messages || jsonb_build_object(
            'id', v_message_id,
            'role', p_role,
            'content', p_content,
            'created_at', NOW()
        )
    WHERE id = p_conversation_id;
    
    RETURN v_message_id;
END;
$$ LANGUAGE plpgsql;

-- Create a function to sync an entire OpenClaw conversation
CREATE OR REPLACE FUNCTION sync_openclaw_conversation(
    p_user_id VARCHAR(255),
    p_external_conversation_id VARCHAR(255),
    p_title VARCHAR(255),
    p_messages JSONB,  -- Array of messages: [{"id": "msg1", "role": "user", "content": "Hello", "created_at": "..."}, ...]
    p_model VARCHAR(100) DEFAULT 'openclaw',
    p_system_prompt TEXT DEFAULT NULL,
    p_platform_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
    v_conversation_id UUID;
    v_message JSONB;
    v_message_id UUID;
BEGIN
    -- Check if conversation already exists
    SELECT id INTO v_conversation_id 
    FROM ai_conversations 
    WHERE external_id = p_external_conversation_id AND source = 'openclaw';
    
    IF v_conversation_id IS NULL THEN
        -- Create new conversation
        v_conversation_id := create_openclaw_conversation(
            p_user_id,
            p_external_conversation_id,
            p_title,
            p_model,
            p_system_prompt,
            '{}'::jsonb,  -- initial context
            p_platform_metadata
        );
    END IF;
    
    -- Add each message
    FOR v_message IN SELECT * FROM jsonb_array_elements(p_messages)
    LOOP
        -- Check if message already exists
        IF NOT EXISTS (
            SELECT 1 FROM ai_messages 
            WHERE external_id = v_message->>'id' 
            AND source = 'openclaw'
            AND conversation_id = v_conversation_id
        ) THEN
            -- Insert the message
            v_message_id := add_openclaw_message(
                v_conversation_id,
                v_message->>'id',
                v_message->>'role',
                v_message->>'content',
                jsonb_build_object(
                    'external_created_at', v_message->>'created_at',
                    'platform_metadata', p_platform_metadata
                )
            );
        END IF;
    END LOOP;
    
    -- Update conversation title if provided and different
    IF p_title IS NOT NULL AND p_title != 'Untitled Conversation' THEN
        UPDATE ai_conversations 
        SET title = p_title, updated_at = NOW()
        WHERE id = v_conversation_id AND title = 'Untitled Conversation';
    END IF;
    
    RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql;

-- Create a view for OpenClaw conversations
CREATE OR REPLACE VIEW openclaw_conversations AS
SELECT 
    ac.id,
    ac.external_id,
    ac.user_id,
    ac.title,
    ac.model,
    ac.system_prompt,
    ac.message_count,
    ac.total_tokens,
    ac.total_cost,
    ac.is_archived,
    ac.context,
    ac.platform_metadata,
    ac.created_at,
    ac.updated_at,
    jsonb_agg(
        jsonb_build_object(
            'id', am.id,
            'external_id', am.external_id,
            'role', am.role,
            'content', am.content,
            'created_at', am.created_at,
            'platform_metadata', am.platform_metadata
        ) ORDER BY am.created_at
    ) AS messages
FROM ai_conversations ac
LEFT JOIN ai_messages am ON ac.id = am.conversation_id
WHERE ac.source = 'openclaw'
GROUP BY ac.id, ac.external_id, ac.user_id, ac.title, ac.model, ac.system_prompt,
         ac.message_count, ac.total_tokens, ac.total_cost, ac.is_archived,
         ac.context, ac.platform_metadata, ac.created_at, ac.updated_at;

-- Add comment to document the new columns
COMMENT ON COLUMN ai_conversations.source IS 'Source of the conversation: nexus, openclaw, api, webhook, or import';
COMMENT ON COLUMN ai_conversations.external_id IS 'External ID from the source platform (e.g., OpenClaw conversation ID)';
COMMENT ON COLUMN ai_conversations.platform_metadata IS 'Platform-specific metadata for the conversation';
COMMENT ON COLUMN ai_messages.source IS 'Source of the message: nexus, openclaw, api, webhook, or import';
COMMENT ON COLUMN ai_messages.external_id IS 'External ID from the source platform (e.g., OpenClaw message ID)';
COMMENT ON COLUMN ai_messages.platform_metadata IS 'Platform-specific metadata for the message';

-- Migration record is inserted by the migration runner