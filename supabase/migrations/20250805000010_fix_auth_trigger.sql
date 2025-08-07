-- Drop the trigger we tried to create (it won't exist but just in case)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create a function that can be called to ensure user profile exists
CREATE OR REPLACE FUNCTION public.ensure_user_profile(user_id uuid DEFAULT auth.uid())
RETURNS void AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, created_at, updated_at)
  SELECT 
    u.id,
    u.email,
    NOW(),
    NOW()
  FROM auth.users u
  WHERE u.id = user_id
  AND NOT EXISTS (
    SELECT 1 FROM public.user_profiles up WHERE up.id = u.id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.ensure_user_profile TO authenticated; 