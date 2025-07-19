create table public.ai_integrations_oauth (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null references public.companies(id) on delete cascade,
    provider text not null,
    access_token_vault_id text not null,
    refresh_token_vault_id text not null,
    expires_at timestamptz not null,
    status text not null default 'active',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint uq_company_provider unique (company_id, provider)
);

alter table public.ai_integrations_oauth enable row level security;

create policy "Users can view their own company's oauth integrations"
on public.ai_integrations_oauth for select
using (company_id = private.get_company_id_from_user_id(auth.uid()));

create policy "Users can insert oauth integrations for their own company"
on public.ai_integrations_oauth for insert
with check (company_id = private.get_company_id_from_user_id(auth.uid()));

create policy "Users can update their own company's oauth integrations"
on public.ai_integrations_oauth for update
using (company_id = private.get_company_id_from_user_id(auth.uid())); 