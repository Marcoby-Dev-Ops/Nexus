-- Fix user profile authentication issues
-- This migration adds a more permissive RLS policy for authenticated users

-- ====================================================================
-- STEP 1: ADD PERMISSIVE POLICY FOR AUTHENTICATED USERS
-- ====================================================================

-- Drop the restrictive policy that's causing issues
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;

-- Create a more permissive policy for authenticated users
CREATE POLICY "Authenticated users can read profiles" ON public.user_profiles
  FOR SELECT
  TO public
  USING (auth.role() = 'authenticated');

-- Add a policy for users to read their own profile
CREATE POLICY "Users can read own profile" ON public.user_profiles
  FOR SELECT
  TO public
  USING (
    auth.role() = 'authenticated' AND 
    auth.uid() = id
  );

-- ====================================================================
-- STEP 2: SKIP USER_ID COLUMN (NOT NEEDED)
-- ====================================================================

-- The user_profiles table uses 'id' as the primary key that references auth.users(id)
-- No separate user_id column is needed

-- ====================================================================
-- STEP 4: UPDATE TRIGGER TO SET USER_ID
-- ====================================================================

-- Update the trigger function (removed user_id reference)
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
      'owner',
      NOW(),
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- STEP 5: VERIFY POLICIES
-- ====================================================================

-- Verify all policies are in place
DO $$
BEGIN
  -- Check if the new policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_profiles' 
    AND policyname = 'Authenticated users can read profiles'
  ) THEN
    RAISE EXCEPTION 'Policy "Authenticated users can read profiles" not found';
  END IF;
  
  RAISE NOTICE 'User profile authentication policies updated successfully';
END $$; 