-- Migration: Create Callback Events Table
-- This migration creates a table to track callback events for analytics and debugging

-- Create callback_events table
CREATE TABLE IF NOT EXISTS public.callback_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_data JSONB,
    status TEXT DEFAULT 'pending',
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_callback_events_company_id ON public.callback_events(company_id);
CREATE INDEX IF NOT EXISTS idx_callback_events_user_id ON public.callback_events(user_id);
CREATE INDEX IF NOT EXISTS idx_callback_events_event_type ON public.callback_events(event_type);
CREATE INDEX IF NOT EXISTS idx_callback_events_status ON public.callback_events(status);
CREATE INDEX IF NOT EXISTS idx_callback_events_created_at ON public.callback_events(created_at);

-- Enable RLS
ALTER TABLE public.callback_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (simplified - company_id policy will be added later)
CREATE POLICY "Users can view their own callback events" ON public.callback_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own callback events" ON public.callback_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own callback events" ON public.callback_events
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own callback events" ON public.callback_events
    FOR DELETE USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_callback_events_updated_at
    BEFORE UPDATE ON public.callback_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 