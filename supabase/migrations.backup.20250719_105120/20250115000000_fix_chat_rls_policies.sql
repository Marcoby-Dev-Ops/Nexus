-- Drop existing policies to recreate them with better logic
DROP POLICY IF EXISTS "Users can view own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.chat_messages;

-- Recreate chat messages policies with improved logic
-- Allow users to view messages from conversations they own
CREATE POLICY "Users can view messages from own conversations" ON public.chat_messages
    FOR SELECT USING (
        auth.uid() = user_id 
        OR 
        conversation_id IN (
            SELECT id FROM public.conversations WHERE user_id = auth.uid()
        )
    );

-- Allow users to insert messages into their own conversations
CREATE POLICY "Users can insert messages into own conversations" ON public.chat_messages
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        AND 
        conversation_id IN (
            SELECT id FROM public.conversations WHERE user_id = auth.uid()
        )
    );

-- Allow users to update their own messages
CREATE POLICY "Users can update own messages" ON public.chat_messages
    FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own messages
CREATE POLICY "Users can delete own messages" ON public.chat_messages
    FOR DELETE USING (auth.uid() = user_id);

-- Also improve conversation policies for better access
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can insert own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON public.conversations;

-- Recreate conversation policies
CREATE POLICY "Users can view own conversations" ON public.conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON public.conversations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON public.conversations
    FOR DELETE USING (auth.uid() = user_id);

-- Add a function to help with conversation access checks
CREATE OR REPLACE FUNCTION public.user_can_access_conversation(conversation_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.conversations 
        WHERE id = conversation_uuid AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant usage on the function
GRANT EXECUTE ON FUNCTION public.user_can_access_conversation(UUID) TO authenticated; 