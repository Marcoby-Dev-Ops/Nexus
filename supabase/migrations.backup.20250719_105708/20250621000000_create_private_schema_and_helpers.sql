create schema if not exists private;

create or replace function private.get_company_id_from_user_id(user_id uuid)
returns uuid
language sql
security definer
stable
as $$
  select company_id from public.user_profiles where id = user_id;
$$; 