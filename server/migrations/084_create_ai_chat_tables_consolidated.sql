-- Migration: Create AI Chat Tables (Consolidated)
-- Description: Creates complete AI chat system with conversations, messages, and enhanced features

-- Ensure pgcrypto is available for gen_random_uuid
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- AI Conversations - High-level conversation metadata and context for AI chat sessions
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL DEFAULT 'Untitled Conversation',
    model VARCHAR(100) DEFAULT 'gpt-4',
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

-- Create comprehensive indexes
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_created_at ON ai_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_archived ON ai_conversations(is_archived);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_created_at ON ai_messages(created_at);

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_ai_conversations_updated_at ON ai_conversations;
CREATE TRIGGER update_ai_conversations_updated_at
    BEFORE UPDATE ON ai_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_messages_updated_at ON ai_messages;
CREATE TRIGGER update_ai_messages_updated_at
    BEFORE UPDATE ON ai_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to update conversation metadata
CREATE OR REPLACE FUNCTION update_ai_conversation_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Update conversation's message count and last activity
  UPDATE ai_conversations 
  SET 
    message_count = (
      SELECT COUNT(*) 
      FROM ai_messages 
      WHERE conversation_id = NEW.conversation_id
    ),
    updated_at = NOW(),
    metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{last_activity}',
      to_jsonb(NOW())
    )
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update conversation metadata
DROP TRIGGER IF EXISTS trigger_update_ai_conversation_metadata ON ai_messages;
CREATE TRIGGER trigger_update_ai_conversation_metadata
  AFTER INSERT OR UPDATE ON ai_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_conversation_metadata();

-- Create function to estimate tokens (rough approximation)
CREATE OR REPLACE FUNCTION estimate_tokens(text_content TEXT)
RETURNS INTEGER AS $$
BEGIN
  -- Rough estimation: 4 characters ≈ 1 token
  RETURN CEIL(LENGTH(text_content) / 4.0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add Row Level Security (RLS) policies if auth.uid() function is available
DO $$ 
BEGIN
  IF to_regproc('auth.uid') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'ai_conversations' 
        AND policyname = 'Users can view their own conversations'
    ) THEN
      ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "Users can view their own conversations" ON ai_conversations
        FOR SELECT USING (auth.uid()::text = user_id);

      CREATE POLICY "Users can insert their own conversations" ON ai_conversations
        FOR INSERT WITH CHECK (auth.uid()::text = user_id);

      CREATE POLICY "Users can update their own conversations" ON ai_conversations
        FOR UPDATE USING (auth.uid()::text = user_id);

      CREATE POLICY "Users can delete their own conversations" ON ai_conversations
        FOR DELETE USING (auth.uid()::text = user_id);
    END IF;
  ELSE
    RAISE NOTICE 'Skipping ai_conversations RLS policies because auth.uid() is unavailable.';
  END IF;
END $$;

DO $$ 
BEGIN
  IF to_regproc('auth.uid') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'ai_messages' 
        AND policyname = 'Users can view messages in their conversations'
    ) THEN
      ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "Users can view messages in their conversations" ON ai_messages
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM ai_conversations 
            WHERE ai_conversations.id = ai_messages.conversation_id 
              AND ai_conversations.user_id = auth.uid()::text
          )
        );

      CREATE POLICY "Users can insert messages in their conversations" ON ai_messages
        FOR INSERT WITH CHECK (
          EXISTS (
            SELECT 1 FROM ai_conversations 
            WHERE ai_conversations.id = ai_messages.conversation_id 
              AND ai_conversations.user_id = auth.uid()::text
          )
        );

      CREATE POLICY "Users can update messages in their conversations" ON ai_messages
        FOR UPDATE USING (
          EXISTS (
            SELECT 1 FROM ai_conversations 
            WHERE ai_conversations.id = ai_messages.conversation_id 
              AND ai_conversations.user_id = auth.uid()::text
          )
        );

      CREATE POLICY "Users can delete messages in their conversations" ON ai_messages
        FOR DELETE USING (
          EXISTS (
            SELECT 1 FROM ai_conversations 
            WHERE ai_conversations.id = ai_messages.conversation_id 
              AND ai_conversations.user_id = auth.uid()::text
          )
        );
    END IF;
  ELSE
    RAISE NOTICE 'Skipping ai_messages RLS policies because auth.uid() is unavailable.';
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON TABLE ai_conversations IS 'Stores AI conversation metadata and configuration';
COMMENT ON COLUMN ai_conversations.metadata IS 'JSON object containing conversation metadata like total_tokens, context_length, etc.';
COMMENT ON TABLE ai_messages IS 'Stores individual AI chat messages with enhanced metadata';
COMMENT ON COLUMN ai_messages.metadata IS 'JSON object containing message metadata like tokens, model, streaming status, etc.';


