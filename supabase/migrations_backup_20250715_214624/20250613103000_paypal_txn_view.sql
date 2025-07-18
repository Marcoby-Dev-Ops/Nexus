-- Materialized view & helper functions for PayPal transaction queries

-- =====================================================================
-- Materialized View: mv_paypal_txns
-- =====================================================================
create materialized view if not exists public.mv_paypal_txns as
select
  org_id,
  (value ->> 'txn_id')              as txn_id,
  (value ->> 'currency')            as currency,
  ((value ->> 'amount')::numeric)   as amount,
  captured_at
from public.ai_kpi_snapshots
where kpi_id = 'paypal_revenue';

-- Index for fast org/time queries
create index if not exists idx_mv_paypal_txns_org_time on public.mv_paypal_txns(org_id, captured_at desc);

-- =====================================================================
-- Refresh helper (lighter than full refresh)
-- =====================================================================
create or replace function public.refresh_mv_paypal_txns()
returns void
language plpgsql security definer
as $$
begin
  refresh materialized view concurrently public.mv_paypal_txns;
end;
$$;

grant execute on function public.refresh_mv_paypal_txns() to anon, authenticated;

-- =====================================================================
-- RPC function for LLM tool consumption
-- =====================================================================
create or replace function public.rpc_list_paypal_txns(p_org uuid, p_limit int default 100)
returns setof public.mv_paypal_txns
language sql security definer
as $$
  select *
  from public.mv_paypal_txns
  where org_id = p_org
  order by captured_at desc
  limit greatest(1, p_limit);
$$;

grant execute on function public.rpc_list_paypal_txns(uuid, int) to anon, authenticated; 