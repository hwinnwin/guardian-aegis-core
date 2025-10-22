-- detector health rpc aggregates last 24h error and rate limit telemetry
create or replace function public.detector_health_window(p_since interval default interval '24 hours')
returns table (
  error_count bigint,
  total_events bigint,
  rate_limit_hits bigint
)
language sql
security definer
as $$
  with logs as (
    select
      count(*) filter (where severity = 'error') as error_count,
      count(*) as total_events
    from public.error_logs
    where created_at >= now() - p_since
  ),
  rl as (
    select count(*) as rate_limit_hits
    from public.rate_limit_log
    where inserted_at >= now() - p_since
  )
  select
    coalesce((select error_count from logs), 0) as error_count,
    coalesce((select total_events from logs), 0) as total_events,
    coalesce((select rate_limit_hits from rl), 0) as rate_limit_hits;
$$;

grant execute on function public.detector_health_window(interval) to anon, authenticated;
