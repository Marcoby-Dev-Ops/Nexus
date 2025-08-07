-- Migration: Create AI Models and User Preferences Tables
-- This migration creates the missing tables required by the assistant edge function

-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ====================================================================
-- AI MODELS TABLES
-- ====================================================================

-- AI Models table
CREATE TABLE IF NOT EXISTS public.ai_models (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    model_name TEXT UNIQUE NOT NULL,
    provider TEXT NOT NULL DEFAULT 'openai',
    base_url TEXT DEFAULT 'https://api.openai.com/v1',
    display_name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User AI Model Preferences table
CREATE TABLE IF NOT EXISTS public.user_ai_model_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ai_model_id UUID NOT NULL REFERENCES public.ai_models(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, ai_model_id)
);

-- Conversation Messages table (for logging assistant conversations)
CREATE TABLE IF NOT EXISTS public.conversation_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- ENABLE ROW LEVEL SECURITY
-- ====================================================================

ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ai_model_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- RLS POLICIES
-- ====================================================================

-- AI Models policies (read-only for all authenticated users)
CREATE POLICY "Users can view ai_models" ON public.ai_models
    FOR SELECT USING (true);

-- User AI Model Preferences policies
CREATE POLICY "Users can view own ai_model_preferences" ON public.user_ai_model_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai_model_preferences" ON public.user_ai_model_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ai_model_preferences" ON public.user_ai_model_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ai_model_preferences" ON public.user_ai_model_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- Conversation Messages policies
CREATE POLICY "Users can view own conversation_messages" ON public.conversation_messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversation_messages" ON public.conversation_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversation_messages" ON public.conversation_messages
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversation_messages" ON public.conversation_messages
    FOR DELETE USING (auth.uid() = user_id);

-- ====================================================================
-- INDEXES FOR PERFORMANCE
-- ====================================================================

CREATE INDEX IF NOT EXISTS idx_ai_models_active ON public.ai_models(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_models_provider ON public.ai_models(provider);
CREATE INDEX IF NOT EXISTS idx_user_ai_model_preferences_user_id ON public.user_ai_model_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ai_model_preferences_model_id ON public.user_ai_model_preferences(ai_model_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id ON public.conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_user_id ON public.conversation_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_created_at ON public.conversation_messages(created_at);

-- ====================================================================
-- TRIGGERS FOR UPDATED_AT
-- ====================================================================

CREATE TRIGGER update_ai_models_updated_at 
    BEFORE UPDATE ON public.ai_models 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_ai_model_preferences_updated_at 
    BEFORE UPDATE ON public.user_ai_model_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================================================
-- INSERT DEFAULT AI MODELS
-- ====================================================================

INSERT INTO public.ai_models (model_name, provider, display_name, description, is_active) VALUES
('gpt-4o-mini', 'openai', 'GPT-4o Mini', 'Fast and efficient model for most tasks', true),
('gpt-4o', 'openai', 'GPT-4o', 'Most capable model for complex tasks', true),
('gpt-3.5-turbo', 'openai', 'GPT-3.5 Turbo', 'Fast and cost-effective model', true)
ON CONFLICT (model_name) DO NOTHING; 