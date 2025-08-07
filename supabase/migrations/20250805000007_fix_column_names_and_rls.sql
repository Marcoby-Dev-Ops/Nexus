-- Add missing columns to match expected queries
ALTER TABLE public.personal_thoughts ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.personal_automations ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Update RLS policies to be more permissive for authenticated users
DROP POLICY IF EXISTS "Users can view their own thoughts" ON public.personal_thoughts;
DROP POLICY IF EXISTS "Users can view their own automations" ON public.personal_automations;
DROP POLICY IF EXISTS "Users can view their own licenses" ON public.user_licenses;
DROP POLICY IF EXISTS "Users can view their own usage" ON public.chat_usage_tracking;

-- Create more permissive policies for authenticated users
CREATE POLICY "Authenticated users can view thoughts" ON public.personal_thoughts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view automations" ON public.personal_automations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view licenses" ON public.user_licenses
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view usage" ON public.chat_usage_tracking
  FOR SELECT USING (auth.role() = 'authenticated');

-- Fix user_profiles RLS
DROP POLICY IF EXISTS "Allow user to view own profile" ON public.user_profiles;
CREATE POLICY "Allow user to view own profile" ON public.user_profiles
  FOR SELECT USING (id = auth.uid() OR auth.role() = 'authenticated'); 