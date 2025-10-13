-- Migration: AI Chat Functions
-- Split from 084_create_ai_chat_tables_consolidated.sql

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
