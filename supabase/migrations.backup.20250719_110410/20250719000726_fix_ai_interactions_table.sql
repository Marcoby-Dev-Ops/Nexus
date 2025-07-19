-- Create ai_interactions table
CREATE TABLE IF NOT EXISTS public.ai_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID,
    conversation_id UUID,
    interaction_type TEXT NOT NULL,
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    tokens_used INTEGER DEFAULT 0,
    cost_usd NUMERIC(10,6) DEFAULT 0,
    processing_time_ms INTEGER,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_interactions_user_id ON public.ai_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_company_id ON public.ai_interactions(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_conversation_id ON public.ai_interactions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_created_at ON public.ai_interactions(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_status ON public.ai_interactions(status);

-- Enable RLS
ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ai_interactions
CREATE POLICY "Users can view their own ai_interactions" ON public.ai_interactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ai_interactions" ON public.ai_interactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ai_interactions" ON public.ai_interactions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ai_interactions" ON public.ai_interactions
    FOR DELETE USING (auth.uid() = user_id);

-- Admin policy for viewing all interactions
CREATE POLICY "Admins can view all ai_interactions" ON public.ai_interactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );
