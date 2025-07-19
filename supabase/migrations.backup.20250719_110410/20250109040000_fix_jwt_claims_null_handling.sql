-- Fix JWT claims to properly handle NULL company_id values
-- This prevents "null" strings from being passed as UUIDs causing PostgreSQL errors

-- Create private schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS private;

-- Create the helper function in public schema instead
CREATE OR REPLACE FUNCTION public.get_company_id_from_user_id(user_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT company_id FROM public.user_profiles WHERE id = user_id LIMIT 1;
$$;

-- Update the JWT claims function to use the public function
CREATE OR REPLACE FUNCTION public.get_jwt_claims(uid uuid, email text)
RETURNS jsonb AS $$
DECLARE
  company_id uuid;
BEGIN
  -- Get the user's company_id
  SELECT public.get_company_id_from_user_id(uid) INTO company_id;

  -- Return the custom claims as a JSON object
  -- Only include org_id if company_id is not null
  IF company_id IS NOT NULL THEN
    RETURN jsonb_build_object('org_id', company_id);
  ELSE
    RETURN jsonb_build_object();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 