-- +mig up
create or replace view public.department_metrics_view as
select
  'operations'::text as department,
  jsonb_build_object(
      'score', 72,
      'updatedAt', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      'kpis', (
        select jsonb_agg(row_to_json(t))
        from (
          /* Deployment frequency is # of deals (deploys) created in last 30 days.
             Delta = current 30-day window minus previous 30-day window. */
          select
            'deploy_frequency' as id,
            'Deployment Frequency' as label,
            (
              select count(*)
              from public.deal d
              where d.created_at >= now() - interval '30 days'
            )::int as value,
            (
              select count(*)
              from public.deal d
              where d.created_at >= now() - interval '60 days'
                and d.created_at <  now() - interval '30 days'
            )::int as prev_value,
            (
              (
                select count(*)
                from public.deal d
                where d.created_at >= now() - interval '30 days'
              ) - (
                select count(*)
                from public.deal d
                where d.created_at >= now() - interval '60 days'
                  and d.created_at <  now() - interval '30 days'
              )
            )::int as delta,
            array[]::int[] as history
          ) t
      )
  ) as state;

comment on view public.department_metrics_view is 'Aggregated KPI snapshot per department (operations MVP)';

-- +mig down
DROP VIEW IF EXISTS public.department_metrics_view; 