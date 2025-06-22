alter table public.companies add column if not exists "hubspotId" text;
create index if not exists "companies_hubspotId_idx" on public.companies ("hubspotId");
alter table public.companies add constraint "companies_hubspotId_unique" unique ("hubspotId");

alter table public.contacts add column if not exists "hubspotId" text;
create index if not exists "contacts_hubspotId_idx" on public.contacts ("hubspotId");
alter table public.contacts add constraint "contacts_hubspotId_unique" unique ("hubspotId");

alter table public.deals add column if not exists "hubspotId" text;
create index if not exists "deals_hubspotId_idx" on public.deals ("hubspotId");
alter table public.deals add constraint "deals_hubspotId_unique" unique ("hubspotId"); 