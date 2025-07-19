create table public.ai_llm_registry (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    provider text not null,
    model_id text not null,
    display_name text not null,
    description text,
    metadata jsonb,
    company_id uuid references public.companies (id) on delete cascade
);

create unique index on public.ai_llm_registry (company_id, provider, model_id);

comment on table public.ai_llm_registry is
'Registry for Large Language Models, storing non-sensitive metadata.';

alter table public.ai_llm_registry enable row level security;

create policy "Users can view models for their own company"
on public.ai_llm_registry for select
to authenticated
using (company_id = (select private.get_company_id_from_user_id(auth.uid())));

create policy "System can manage registry"
on public.ai_llm_registry for all
using (true)
with check (true); 