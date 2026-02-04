-- Migration: AI Conversations and Messages Tables
-- Split from 084_create_ai_chat_tables_consolidated.sql

-- Ensure pgcrypto is available for gen_random_uuid
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- AI Conversations - High-level conversation metadata and context for AI chat sessions
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL DEFAULT 'Untitled Conversation',
    model VARCHAR(100) DEFAULT 'zai/glm-4.7',
    system_prompt TEXT,
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    message_count INTEGER NOT NULL DEFAULT 0 CHECK (message_count >= 0),
    total_tokens INTEGER NOT NULL DEFAULT 0 CHECK (total_tokens >= 0),
    total_cost NUMERIC(12,4) NOT NULL DEFAULT 0,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    context JSONB NOT NULL DEFAULT '{}'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- AI Messages - Individual messages within conversations with enhanced metadata
CREATE TABLE IF NOT EXISTS ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add foreign key link to user_profiles.user_id when the constraint is missing.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_ai_conversations_user'
          AND conrelid = 'ai_conversations'::regclass
    ) THEN
        ALTER TABLE ai_conversations
        ADD CONSTRAINT fk_ai_conversations_user
        FOREIGN KEY (user_id)
        REFERENCES user_profiles(user_id)
        ON DELETE CASCADE;
    END IF;
END $$;
