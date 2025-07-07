-- Fix JWT claims to properly handle NULL company_id values
-- This prevents "null" strings from being passed as UUIDs causing PostgreSQL errors

create or replace function public.get_jwt_claims(uid uuid, email text)
returns jsonb as $$
declare
  company_id uuid;
begin
  -- Get the user's company_id
  select private.get_company_id_from_user_id(uid) into company_id;

  -- Return the custom claims as a JSON object
  -- Only include org_id if company_id is not null
  if company_id is not null then
    return jsonb_build_object('org_id', company_id);
  else
    return jsonb_build_object();
  end if;
end;
$$ language plpgsql security definer;

-- Also update the helper function to be more explicit about NULL handling
create or replace function private.get_company_id_from_user_id(user_id uuid)
returns uuid
language sql
security definer
stable
as $$
  select company_id from public.user_profiles where id = user_id limit 1;
$$; 