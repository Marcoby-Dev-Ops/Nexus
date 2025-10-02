-- Migration: Create AI Message Attachments table
-- Description: Stores uploaded files associated with chat conversations/messages

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS ai_message_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    message_id UUID REFERENCES ai_messages(id) ON DELETE SET NULL,
    user_id VARCHAR(255) NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT,
    file_size BIGINT,
    storage_path TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_message_attachments_conversation ON ai_message_attachments(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_message_attachments_user ON ai_message_attachments(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_message_attachments_created_at ON ai_message_attachments(created_at DESC);

DO $$
BEGIN
  IF to_regproc('auth.uid') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'ai_message_attachments'
    ) THEN
      ALTER TABLE ai_message_attachments ENABLE ROW LEVEL SECURITY;

      CREATE POLICY "Users can view their attachments" ON ai_message_attachments
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM ai_conversations c
            WHERE c.id = ai_message_attachments.conversation_id
              AND c.user_id = auth.uid()::text
          )
        );

      CREATE POLICY "Users can insert attachments" ON ai_message_attachments
        FOR INSERT WITH CHECK (
          EXISTS (
            SELECT 1 FROM ai_conversations c
            WHERE c.id = ai_message_attachments.conversation_id
              AND c.user_id = auth.uid()::text
          )
        );

      CREATE POLICY "Users can update their attachments" ON ai_message_attachments
        FOR UPDATE USING (
          EXISTS (
            SELECT 1 FROM ai_conversations c
            WHERE c.id = ai_message_attachments.conversation_id
              AND c.user_id = auth.uid()::text
          )
        );

      CREATE POLICY "Users can delete their attachments" ON ai_message_attachments
        FOR DELETE USING (
          EXISTS (
            SELECT 1 FROM ai_conversations c
            WHERE c.id = ai_message_attachments.conversation_id
              AND c.user_id = auth.uid()::text
          )
        );
    END IF;
  ELSE
    RAISE NOTICE 'Skipping ai_message_attachments RLS policies because auth.uid() is unavailable.';
  END IF;
END $$;

COMMENT ON TABLE ai_message_attachments IS 'Stores user-uploaded files attached to AI chat conversations and messages.';
COMMENT ON COLUMN ai_message_attachments.storage_path IS 'Server-side storage path for the uploaded file.';
COMMENT ON COLUMN ai_message_attachments.metadata IS 'Additional metadata about the attachment (hashes, processing results, etc.).';
