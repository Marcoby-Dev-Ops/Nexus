-- Pillar 8 – Metrics Instrumentation
-- Creates roll-up table for daily user activity emitted by ai_metrics_daily function

create table if not exists public.ai_metrics_daily (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  chat_messages integer not null default 0,
  actions integer not null default 0,
  created_at timestamptz not null default now(),
  constraint ai_metrics_daily_pkey primary key (user_id, date)
);

-- ─────────────────────────────────────────────────────────────
-- RLS – users see only their own rows; service role unrestricted
-- ─────────────────────────────────────────────────────────────

alter table public.ai_metrics_daily enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'ai_metrics_daily'
      and policyname = 'Users can view own metrics'
  ) then
    create policy "Users can view own metrics" on public.ai_metrics_daily
      for select using (auth.uid() = user_id);
  end if;
end $$; 