-- Migration: Add company-based RLS policy for callback_events
-- This migration adds the complex RLS policy that references user_profiles.company_id
-- It runs after the company_id column is added to user_profiles

-- Drop the simple policy first
DROP POLICY IF EXISTS "Users can view their own callback events" ON public.callback_events;

-- Create the comprehensive policy that includes company-based access
CREATE POLICY "Users can view their own callback events" ON public.callback_events
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.company_id = callback_events.company_id
        )
    );

-- Add service role policy for admin access
CREATE POLICY "Service role can manage all callback events" ON public.callback_events
    FOR ALL USING (auth.role() = 'service_role');

-- Add comment for documentation
COMMENT ON POLICY "Users can view their own callback events" ON public.callback_events IS 
    'Users can view callback events they created or events for their company'; 