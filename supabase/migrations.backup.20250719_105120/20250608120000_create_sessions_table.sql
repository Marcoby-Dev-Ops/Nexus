-- Create chat_sessions table for enhanced session tracking
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    total_messages INTEGER DEFAULT 0,
    total_agents_used INTEGER DEFAULT 0,
    primary_department TEXT,
    session_outcome TEXT CHECK (session_outcome IN ('resolved', 'escalated', 'abandoned', 'ongoing')),
    satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_session_id ON public.chat_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON public.chat_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_outcome ON public.chat_sessions(session_outcome);

-- Create updated_at trigger for chat_sessions
CREATE TRIGGER update_chat_sessions_updated_at
    BEFORE UPDATE ON public.chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- Chat sessions policies
CREATE POLICY "Users can view own sessions" ON public.chat_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON public.chat_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON public.chat_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON public.chat_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Create user_analytics view for insights
CREATE OR REPLACE VIEW public.user_chat_analytics AS
SELECT 
    cs.user_id,
    COUNT(DISTINCT cs.session_id) as total_sessions,
    COUNT(cm.id) as total_messages,
    COUNT(DISTINCT cm.metadata->>'agent_id') as unique_agents_used,
    AVG(cs.total_messages) as avg_messages_per_session,
    AVG(cs.satisfaction_score) as avg_satisfaction,
    MODE() WITHIN GROUP (ORDER BY cs.primary_department) as most_used_department,
    cs.created_at::date as date
FROM public.chat_sessions cs
LEFT JOIN public.conversations conv ON conv.user_id = cs.user_id
LEFT JOIN public.chat_messages cm ON cm.conversation_id = conv.id
WHERE cs.created_at >= NOW() - INTERVAL '30 days'
GROUP BY cs.user_id, cs.created_at::date
ORDER BY cs.created_at DESC;

-- Grant permissions for the view
GRANT SELECT ON public.user_chat_analytics TO authenticated; 