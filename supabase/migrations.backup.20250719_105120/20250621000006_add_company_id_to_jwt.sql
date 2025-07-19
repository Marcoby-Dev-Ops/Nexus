-- Supabase Auth will call this function to get custom claims for a user's JWT.
create or replace function public.get_jwt_claims(uid uuid, email text)
returns jsonb as $$
declare
  company_id uuid;
begin
  -- Get the user's company_id
  select private.get_company_id_from_user_id(uid) into company_id;

  -- Return the custom claims as a JSON object
  return jsonb_build_object(
    'org_id', company_id
  );
end;
$$ language plpgsql security definer;

-- Grant execute permission to the authenticated role
grant execute on function public.get_jwt_claims(uuid, text) to authenticated; 