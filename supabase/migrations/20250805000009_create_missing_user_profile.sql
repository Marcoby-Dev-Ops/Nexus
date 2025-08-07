-- Create missing user profile for the existing user (commented out - user doesn't exist)
-- INSERT INTO public.user_profiles (id, email, created_at, updated_at)
-- VALUES (
--   '7915b0c7-3358-4e6b-a31c-70b0269ce8b2',
--   'vonj@marcoby.com',
--   NOW(),
--   NOW()
-- )
-- ON CONFLICT (id) DO NOTHING;

-- Create a function to automatically create user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 