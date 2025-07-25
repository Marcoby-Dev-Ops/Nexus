-- Fix user_profiles infinite recursion by using policy inheritance
-- This migration removes conflicting policies and applies the standard inheritance system

-- ====================================================================
-- STEP 1: CLEAN UP CONFLICTING POLICIES
-- ====================================================================

-- Drop all existing policies on user_profiles that are causing conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can access own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can read own profile by user_id" ON public.user_profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Service role can access all profiles" ON public.user_profiles;

-- ====================================================================
-- STEP 2: CREATE SIMPLE, CLEAN POLICIES FOR USER_PROFILES
-- ====================================================================

-- Since user_profiles uses 'id' instead of 'user_id', we need custom policies
-- Simple SELECT policy - users can read their own profile
CREATE POLICY "user_profiles_select_policy" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Simple INSERT policy - users can insert their own profile
CREATE POLICY "user_profiles_insert_policy" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Simple UPDATE policy - users can update their own profile
CREATE POLICY "user_profiles_update_policy" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Service role bypass for admin operations
CREATE POLICY "user_profiles_service_role_policy" ON public.user_profiles
    FOR ALL USING (auth.role() = 'service_role');

-- ====================================================================
-- STEP 3: VERIFY POLICIES
-- ====================================================================

-- Verify that we have clean, non-conflicting policies
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'user_profiles';
    
    RAISE NOTICE 'User profiles table now has % policies', policy_count;
    
    -- List all policies for verification
    FOR policy_record IN 
        SELECT policyname, cmd, qual 
        FROM pg_policies 
        WHERE tablename = 'user_profiles'
    LOOP
        RAISE NOTICE 'Policy: % - Command: % - Condition: %', 
                    policy_record.policyname, 
                    policy_record.cmd, 
                    policy_record.qual;
    END LOOP;
END $$;

-- ====================================================================
-- STEP 4: GRANT PROPER PERMISSIONS
-- ====================================================================

-- Grant authenticated users access to user_profiles
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;

-- Grant service role full access
GRANT ALL ON public.user_profiles TO service_role;

-- ====================================================================
-- STEP 5: CREATE SAFE PROFILE ACCESS FUNCTION
-- ====================================================================

-- Function to safely get user profile without recursion
CREATE OR REPLACE FUNCTION get_user_profile_safe(user_id UUID DEFAULT auth.uid())
RETURNS TABLE (
  id UUID,
  email TEXT,
  role TEXT,
  company_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Return user profile directly without recursive calls
  RETURN QUERY
  SELECT 
    up.id,
    up.email,
    up.role,
    up.company_id,
    up.created_at,
    up.updated_at
  FROM public.user_profiles up
  WHERE up.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_profile_safe(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_profile_safe(UUID) TO service_role; 