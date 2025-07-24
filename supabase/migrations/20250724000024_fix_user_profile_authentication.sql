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
  USING (
    auth.role() = 'authenticated' AND 
    (
      auth.uid() = id OR 
      auth.uid() IN (
        SELECT user_id FROM user_profiles WHERE id = auth.uid()
      )
    )
  );

-- Add a policy for users to read their own profile by user_id
CREATE POLICY "Users can read own profile by user_id" ON public.user_profiles
  FOR SELECT
  TO public
  USING (
    auth.role() = 'authenticated' AND 
    auth.uid() = user_id
  );

-- ====================================================================
-- STEP 2: ENSURE USER_PROFILES HAS USER_ID COLUMN
-- ====================================================================

-- Add user_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN user_id UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Update existing profiles to have user_id = id
UPDATE public.user_profiles 
SET user_id = id 
WHERE user_id IS NULL;

-- ====================================================================
-- STEP 3: ADD INDEX FOR BETTER PERFORMANCE
-- ====================================================================

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);

-- ====================================================================
-- STEP 4: UPDATE TRIGGER TO SET USER_ID
-- ====================================================================

-- Update the trigger function to also set user_id
CREATE OR REPLACE FUNCTION create_user_profile_if_missing()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user profile exists
  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = NEW.id) THEN
    -- Create user profile
    INSERT INTO public.user_profiles (
      id,
      user_id,
      email,
      role,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.id, -- user_id = id for existing users
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