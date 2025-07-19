-- Migration: Create service_health_logs table for backend health logging
create table if not exists service_health_logs (
  id uuid primary key default gen_random_uuid(),
  service_name text not null,
  status text not null, -- 'healthy', 'unhealthy', etc.
  latency_ms integer,
  error_message text,
  checked_at timestamptz not null default now()
); 