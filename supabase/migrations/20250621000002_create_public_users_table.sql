-- Create the public.users table to mirror auth.users for easier relations
-- This table will be kept in sync with auth.users via triggers.

create table public.users (
  id uuid primary key,
  email text,
  -- Add other fields from auth.users you want to mirror, e.g., created_at
  created_at timestamptz default now()
);

-- Function to sync a new user from auth.users to public.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, created_at)
  values (new.id, new.email, new.created_at);
  return new;
end;
$$;

-- Trigger to call the function when a new user signs up
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to sync user deletions
create or replace function public.handle_user_delete()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  delete from public.users where id = old.id;
  return old;
end;
$$;

-- Trigger to call the function when a user is deleted
create trigger on_auth_user_deleted
  after delete on auth.users
  for each row execute procedure public.handle_user_delete(); 