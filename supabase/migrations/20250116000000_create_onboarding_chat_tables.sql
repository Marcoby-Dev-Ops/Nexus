-- Migration for Chat-Based Onboarding System
-- Adds tables to support conversational onboarding with Alex (Executive Assistant)

-- Create onboarding_conversations table for tracking onboarding chat sessions
CREATE TABLE IF NOT EXISTS public.onboarding_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
    current_step INTEGER DEFAULT 0,
    total_steps INTEGER DEFAULT 6,
    
    -- Onboarding data collected through conversation
    collected_data JSONB DEFAULT '{}',
    
    -- Conversation metadata
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create onboarding_messages table for storing conversation history
CREATE TABLE IF NOT EXISTS public.onboarding_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.onboarding_conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Message details
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'message' CHECK (message_type IN ('message', 'introduction', 'data-collected', 'relationship-building')),
    
    -- Step context
    step_id TEXT,
    step_number INTEGER,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_onboarding_progress table to track progress
CREATE TABLE IF NOT EXISTS public.user_onboarding_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Progress tracking
    onboarding_completed BOOLEAN DEFAULT false,
    onboarding_started_at TIMESTAMPTZ,
    onboarding_completed_at TIMESTAMPTZ,
    
    -- Step completion tracking
    steps_completed JSONB DEFAULT '[]',
    current_step TEXT DEFAULT 'introduction',
    
    -- Collected onboarding data
    business_context JSONB DEFAULT '{}',
    role_context JSONB DEFAULT '{}',
    goals_context JSONB DEFAULT '{}',
    working_style JSONB DEFAULT '{}',
    
    -- Assistant personality adaptation
    preferred_communication_style TEXT DEFAULT 'adaptive' CHECK (preferred_communication_style IN ('professional', 'friendly', 'adaptive')),
    
    -- Analytics
    total_onboarding_time_minutes INTEGER DEFAULT 0,
    conversation_turns INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_onboarding_conversations_user_id ON public.onboarding_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_conversations_session_id ON public.onboarding_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_conversations_status ON public.onboarding_conversations(status);

CREATE INDEX IF NOT EXISTS idx_onboarding_messages_conversation_id ON public.onboarding_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_messages_user_id ON public.onboarding_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_messages_created_at ON public.onboarding_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_onboarding_progress_user_id ON public.user_onboarding_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_progress_completed ON public.user_onboarding_progress(onboarding_completed);

-- Create triggers for updated_at
CREATE TRIGGER update_onboarding_conversations_updated_at
    BEFORE UPDATE ON public.onboarding_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_onboarding_progress_updated_at
    BEFORE UPDATE ON public.user_onboarding_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.onboarding_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_onboarding_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for onboarding_conversations
CREATE POLICY "Users can view own onboarding conversations" ON public.onboarding_conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding conversations" ON public.onboarding_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding conversations" ON public.onboarding_conversations
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for onboarding_messages
CREATE POLICY "Users can view own onboarding messages" ON public.onboarding_messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding messages" ON public.onboarding_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_onboarding_progress
CREATE POLICY "Users can view own onboarding progress" ON public.user_onboarding_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding progress" ON public.user_onboarding_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding progress" ON public.user_onboarding_progress
    FOR UPDATE USING (auth.uid() = user_id);

-- Add onboarding-related fields to existing user_profiles table if not present
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS onboarding_chat_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS executive_assistant_introduced BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS preferred_ai_personality TEXT DEFAULT 'adaptive' CHECK (preferred_ai_personality IN ('professional', 'friendly', 'adaptive')),
ADD COLUMN IF NOT EXISTS onboarding_context JSONB DEFAULT '{}';

-- Function to check if user needs onboarding
CREATE OR REPLACE FUNCTION public.user_needs_onboarding(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    profile_exists BOOLEAN := false;
    onboarding_completed BOOLEAN := false;
BEGIN
    -- Check if user profile exists and onboarding is completed
    SELECT 
        (up.id IS NOT NULL) as profile_exists_check,
        COALESCE(up.onboarding_completed, false) as onboarding_check
    INTO profile_exists, onboarding_completed
    FROM public.user_profiles up
    WHERE up.id = user_uuid;
    
    -- If no profile exists, or onboarding not completed, they need onboarding
    RETURN NOT profile_exists OR NOT onboarding_completed;
END;
$$;

-- Function to complete onboarding
CREATE OR REPLACE FUNCTION public.complete_user_onboarding(
    user_uuid UUID,
    onboarding_data JSONB DEFAULT '{}'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update user profile to mark onboarding as completed
    INSERT INTO public.user_profiles (
        id,
        onboarding_completed,
        onboarding_chat_completed,
        executive_assistant_introduced,
        onboarding_context,
        updated_at
    ) VALUES (
        user_uuid,
        true,
        true,
        true,
        onboarding_data,
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        onboarding_completed = true,
        onboarding_chat_completed = true,
        executive_assistant_introduced = true,
        onboarding_context = onboarding_data,
        updated_at = NOW();
    
    -- Update onboarding progress record
    INSERT INTO public.user_onboarding_progress (
        user_id,
        onboarding_completed,
        onboarding_completed_at,
        updated_at
    ) VALUES (
        user_uuid,
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        onboarding_completed = true,
        onboarding_completed_at = NOW(),
        updated_at = NOW();
    
    RETURN true;
END;
$$; 