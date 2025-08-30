-- Enhanced Chat Schema Migration
-- Updates existing ai_messages and ai_conversations tables with additional features

-- Add any missing columns to ai_conversations table
DO $$ 
BEGIN
  -- Add metadata column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ai_conversations' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE ai_conversations ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add any missing columns to ai_messages table
DO $$ 
BEGIN
  -- Add any missing columns here if needed
  -- The table already has all the required columns
END $$;

-- Add any missing indexes for ai_conversations (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_ai_conversations_archived ON ai_conversations(is_archived);

-- Add any missing indexes for ai_messages (only if they don't exist)
-- All required indexes already exist

-- Add RLS policies for ai_conversations (only if not already present)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_conversations' AND policyname = 'Users can view their own conversations'
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
END $$;

-- Add RLS policies for ai_messages (only if not already present)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_messages' AND policyname = 'Users can view messages in their conversations'
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
END $$;

-- Create function to update conversation metadata (replace if exists)
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

-- Create trigger to automatically update conversation metadata (drop and recreate)
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

-- Add comments for documentation
COMMENT ON TABLE ai_conversations IS 'Stores AI conversation metadata and configuration';
COMMENT ON COLUMN ai_conversations.metadata IS 'JSON object containing conversation metadata like total_tokens, context_length, etc.';
COMMENT ON TABLE ai_messages IS 'Stores individual AI chat messages with enhanced metadata';
COMMENT ON COLUMN ai_messages.metadata IS 'JSON object containing message metadata like tokens, model, streaming status, etc.';
