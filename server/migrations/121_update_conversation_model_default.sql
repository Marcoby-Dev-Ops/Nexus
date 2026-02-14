-- Migration: Update Default Conversation Model
-- Updates the default value for the 'model' column in 'ai_conversations' table
-- Changes default from 'gpt-4' to 'default' to indicate it hasn't been resolved yet.
-- Also updates existing records where model is 'gpt-4' to 'default' to clean up historical data.

ALTER TABLE ai_conversations ALTER COLUMN model SET DEFAULT 'default';

UPDATE ai_conversations SET model = 'default' WHERE model = 'gpt-4';
