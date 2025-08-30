-- Cleanup RLS Policies Migration
-- Remove RLS policies that use auth.uid() since we're not using Supabase
-- Authentication and authorization are handled at the application level

-- Disable RLS on ai_conversations table
ALTER TABLE ai_conversations DISABLE ROW LEVEL SECURITY;

-- Drop RLS policies from ai_conversations
DROP POLICY IF EXISTS "Users can view their own conversations" ON ai_conversations;
DROP POLICY IF EXISTS "Users can insert their own conversations" ON ai_conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON ai_conversations;
DROP POLICY IF EXISTS "Users can delete their own conversations" ON ai_conversations;

-- Disable RLS on ai_messages table
ALTER TABLE ai_messages DISABLE ROW LEVEL SECURITY;

-- Drop RLS policies from ai_messages
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON ai_messages;
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON ai_messages;
DROP POLICY IF EXISTS "Users can update messages in their conversations" ON ai_messages;
DROP POLICY IF EXISTS "Users can delete messages in their conversations" ON ai_messages;

-- Disable RLS on oauth_states table
ALTER TABLE oauth_states DISABLE ROW LEVEL SECURITY;

-- Drop RLS policies from oauth_states
DROP POLICY IF EXISTS "Users can manage their own oauth states" ON oauth_states;

-- Note: Authentication and authorization are handled at the application level
-- through JWT token validation and user session management
