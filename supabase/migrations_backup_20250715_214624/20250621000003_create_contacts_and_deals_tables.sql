create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  hubspotId text unique,
  "userId" uuid references public.users(id) on delete cascade,
  "companyId" uuid references public.companies(id) on delete cascade,
  email text,
  "firstName" text,
  "lastName" text,
  phone text,
  properties jsonb,
  "isPotentialVAR" boolean,
  "lastSyncedAt" timestamptz
);

create table public.deals (
  id uuid primary key default gen_random_uuid(),
  hubspotId text unique,
  name text,
  pipeline text,
  stage text,
  amount float,
  "closeDate" timestamptz,
  properties jsonb,
  "lastSyncedAt" timestamptz
); 