-- Google's Approach: Fix Auth Context and RLS Issues
-- This migration implements Google's best practices for auth and RLS

-- ====================================================================
-- STEP 1: RE-ENABLE RLS WITH PROPER POLICIES
-- ====================================================================

-- Re-enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Clean up duplicate policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Service role can access all profiles" ON public.user_profiles;

-- Create Google-style policies
CREATE POLICY "Users can access own profile" ON public.user_profiles
  FOR ALL USING (auth.uid() = id);

-- Service role bypass for admin operations
CREATE POLICY "Service role can manage all profiles" ON public.user_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- ====================================================================
-- STEP 2: CREATE AUTH CONTEXT VALIDATION FUNCTION
-- ====================================================================

-- Function to validate auth context (Google's approach)
CREATE OR REPLACE FUNCTION validate_auth_context()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Check if user exists in user_profiles
  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid()) THEN
    -- Auto-create user profile if missing (Google's approach)
    INSERT INTO public.user_profiles (id, email, role, created_at, updated_at)
    VALUES (
      auth.uid(),
      auth.jwt() ->> 'email',
      'user',
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- STEP 3: CREATE SAFE QUERY FUNCTIONS (Google's approach)
-- ====================================================================

-- Function to safely get user profile with fallback
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
  -- Validate auth context
  PERFORM validate_auth_context();
  
  -- Return user profile
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

-- Function to safely get business profile with fallback
CREATE OR REPLACE FUNCTION get_business_profile_safe(org_id UUID DEFAULT auth.uid())
RETURNS TABLE (
  id UUID,
  org_id UUID,
  company_name TEXT,
  industry TEXT,
  business_model TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Validate auth context
  PERFORM validate_auth_context();
  
  -- Return business profile if it exists
  RETURN QUERY
  SELECT 
    bp.id,
    bp.org_id,
    bp.company_name,
    bp.industry,
    bp.business_model,
    bp.created_at,
    bp.updated_at
  FROM public.business_profiles bp
  WHERE bp.org_id = org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- STEP 4: GRANT PERMISSIONS
-- ====================================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION validate_auth_context() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_profile_safe(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_business_profile_safe(UUID) TO authenticated;

-- Grant service role access
GRANT EXECUTE ON FUNCTION validate_auth_context() TO service_role;
GRANT EXECUTE ON FUNCTION get_user_profile_safe(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION get_business_profile_safe(UUID) TO service_role;

-- ====================================================================
-- STEP 5: CREATE DEBUG FUNCTION (Google's approach)
-- ====================================================================

-- Function to debug auth context
CREATE OR REPLACE FUNCTION debug_auth_context()
RETURNS TABLE (
  auth_uid UUID,
  auth_role TEXT,
  has_user_profile BOOLEAN,
  user_email TEXT,
  user_role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    auth.uid() as auth_uid,
    auth.role() as auth_role,
    EXISTS(SELECT 1 FROM public.user_profiles WHERE id = auth.uid()) as has_user_profile,
    up.email as user_email,
    up.role as user_role
  FROM public.user_profiles up
  WHERE up.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION debug_auth_context() TO authenticated;
GRANT EXECUTE ON FUNCTION debug_auth_context() TO service_role;
