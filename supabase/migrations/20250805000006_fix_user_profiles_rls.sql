-- Fix user_profiles RLS policy
-- Enable RLS if not already enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow user to view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow user to update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow user to insert own profile" ON public.user_profiles;

-- Create new RLS policies
CREATE POLICY "Allow user to view own profile" ON public.user_profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Allow user to update own profile" ON public.user_profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Allow user to insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (id = auth.uid()); 