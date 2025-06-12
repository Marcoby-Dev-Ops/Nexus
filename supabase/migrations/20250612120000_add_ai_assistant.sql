-- Create extension for vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create ai_agents table
CREATE TABLE IF NOT EXISTS public.ai_agents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER update_ai_agents_updated_at
    BEFORE UPDATE ON public.ai_agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create ai_conversations table
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    title TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    metadata JSONB DEFAULT '{}'::jsonb
);
CREATE TRIGGER update_ai_conversations_updated_at
    BEFORE UPDATE ON public.ai_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create ai_messages table
CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);
CREATE TRIGGER update_ai_messages_updated_at
    BEFORE UPDATE ON public.ai_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create ai_action_cards table
CREATE TABLE IF NOT EXISTS public.ai_action_cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    actions JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb
);
CREATE TRIGGER update_ai_action_cards_updated_at
    BEFORE UPDATE ON public.ai_action_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create ai_action_card_events table
CREATE TABLE IF NOT EXISTS public.ai_action_card_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    action_card_id UUID NOT NULL REFERENCES public.ai_action_cards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);
CREATE TRIGGER update_ai_action_card_events_updated_at
    BEFORE UPDATE ON public.ai_action_card_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create ai_vector_documents table
CREATE TABLE IF NOT EXISTS public.ai_vector_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    document_id TEXT NOT NULL,
    content TEXT NOT NULL,
    content_embedding VECTOR(1536) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);
CREATE TRIGGER update_ai_vector_documents_updated_at
    BEFORE UPDATE ON public.ai_vector_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create ai_audit_logs table
CREATE TABLE IF NOT EXISTS public.ai_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT,
    details JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on new tables
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_action_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_action_card_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_vector_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for ai_agents
CREATE POLICY "Authenticated users can view AI agents" ON public.ai_agents
    FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Service role can manage AI agents" ON public.ai_agents
    FOR ALL USING (true);

-- RLS policies for ai_conversations
CREATE POLICY "Users can view own AI conversations" ON public.ai_conversations
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own AI conversations" ON public.ai_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own AI conversations" ON public.ai_conversations
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own AI conversations" ON public.ai_conversations
    FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for ai_messages
CREATE POLICY "Users can view own AI messages" ON public.ai_messages
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own AI messages" ON public.ai_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own AI messages" ON public.ai_messages
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own AI messages" ON public.ai_messages
    FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for ai_action_cards
CREATE POLICY "Users can view own AI action cards" ON public.ai_action_cards
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.ai_conversations ac
            WHERE ac.id = conversation_id AND ac.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can insert own AI action cards" ON public.ai_action_cards
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.ai_conversations ac
            WHERE ac.id = conversation_id AND ac.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can update own AI action cards" ON public.ai_action_cards
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.ai_conversations ac
            WHERE ac.id = conversation_id AND ac.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can delete own AI action cards" ON public.ai_action_cards
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.ai_conversations ac
            WHERE ac.id = conversation_id AND ac.user_id = auth.uid()
        )
    );

-- RLS policies for ai_action_card_events
CREATE POLICY "Users can view own AI action card events" ON public.ai_action_card_events
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own AI action card events" ON public.ai_action_card_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for ai_vector_documents
CREATE POLICY "Authenticated users can view AI vector documents" ON public.ai_vector_documents
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS policies for ai_audit_logs
CREATE POLICY "Service role can insert AI audit logs" ON public.ai_audit_logs
    FOR INSERT WITH CHECK (true);
CREATE POLICY "No users can select AI audit logs" ON public.ai_audit_logs
    FOR SELECT USING (false); 