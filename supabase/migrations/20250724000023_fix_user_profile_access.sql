-- Fix user profile access issues
-- This migration ensures users can access their profiles and creates missing profile records

-- ====================================================================
-- STEP 1: CREATE MISSING USER PROFILES
-- ====================================================================

-- Function to create user profile if missing
CREATE OR REPLACE FUNCTION create_user_profile_if_missing()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user profile exists
  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = NEW.id) THEN
    -- Create user profile
    INSERT INTO public.user_profiles (
      id,
      email,
      role,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.email,
      'user',
      NOW(),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create user profiles
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
CREATE TRIGGER create_user_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile_if_missing();

-- ====================================================================
-- STEP 2: FIX RLS POLICIES FOR USER_PROFILES
-- ====================================================================

-- Drop conflicting policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can access own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow users to read their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.user_profiles;

-- Create clean, simple policies
CREATE POLICY "Users can read own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Service role bypass for admin operations
CREATE POLICY "Service role can manage all profiles" ON public.user_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- ====================================================================
-- STEP 3: CREATE MISSING PROFILES FOR EXISTING USERS
-- ====================================================================

-- Insert missing user profiles for existing users
INSERT INTO public.user_profiles (
  id,
  email,
  role,
  created_at,
  updated_at
)
SELECT 
  au.id,
  au.email,
  'user',
  au.created_at,
  NOW()
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_profiles up WHERE up.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- STEP 4: GRANT PROPER PERMISSIONS
-- ====================================================================

-- Grant authenticated users access to user_profiles
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;

-- Grant service role full access
GRANT ALL ON public.user_profiles TO service_role;

-- ====================================================================
-- STEP 5: CREATE HELPER FUNCTION FOR SAFE PROFILE ACCESS
-- ====================================================================

-- Function to safely get user profile with auto-creation
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
  
  -- Create profile if missing
  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = user_id) THEN
    INSERT INTO public.user_profiles (
      id,
      email,
      role,
      created_at,
      updated_at
    ) VALUES (
      user_id,
      auth.jwt() ->> 'email',
      'user',
      NOW(),
      NOW()
    );
  END IF;
  
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_profile_safe(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_profile_safe(UUID) TO service_role; 