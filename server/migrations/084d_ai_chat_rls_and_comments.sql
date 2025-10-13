-- Migration: AI Chat RLS Policies and Comments
-- Split from 084_create_ai_chat_tables_consolidated.sql

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
