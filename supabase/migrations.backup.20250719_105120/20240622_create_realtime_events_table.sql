-- Migration: Create realtime_events table for real-time event emission
create table if not exists public.realtime_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  entity text not null,
  entity_id text not null,
  company_id text not null,
  payload jsonb,
  created_at timestamptz default now()
);

-- Index for efficient subscription by company and entity
do $$
begin
  if not exists (select 1 from pg_indexes where tablename = 'realtime_events' and indexname = 'realtime_events_company_entity_idx') then
    create index realtime_events_company_entity_idx on public.realtime_events (company_id, entity, created_at desc);
  end if;
end$$; 