create table ops_action_queue (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null,
  kpi_key       text not null,
  action_slug   text not null,
  requested_by  uuid not null,
  status        text default 'queued',
  output        jsonb,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table ops_action_queue enable row level security;

create policy "org-scope" on ops_action_queue
  using ( 
    org_id = (current_setting('request.jwt.claims',true)::jsonb)->>'org_id'::uuid
    AND (current_setting('request.jwt.claims',true)::jsonb)->>'org_id' IS NOT NULL
    AND (current_setting('request.jwt.claims',true)::jsonb)->>'org_id' != 'null'
  ); 