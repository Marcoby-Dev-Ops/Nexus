# Nexus Admin: Health Monitoring & Troubleshooting

## 1. Viewing Health Logs

- Go to Supabase Admin Console > Table Editor > `service_health_logs`
- Filter by `service_name`, `status`, or `checked_at` as needed

## 2. Example Queries

- Recent errors:
  ```sql
  select * from service_health_logs where status != 'healthy' order by checked_at desc limit 20;
  ```
- Uptime by service (last 24h):
  ```sql
  select service_name, count(*) filter (where status = 'healthy')::float / count(*) * 100 as uptime_percent
  from service_health_logs
  where checked_at > now() - interval '24 hours'
  group by service_name;
  ```

## 3. Setting Up Alerts

- Use Supabase webhooks, n8n, or Zapier to trigger alerts on unhealthy status.
- Example: Scheduled function checks for recent unhealthy logs and sends a Slack/email alert.

## 4. Troubleshooting

- If a service is repeatedly unhealthy, check error messages in the logs.
- Use the frontend Connection Status Indicator for real-time status.
- See `docs/BACKEND_CONNECTION_GUIDE.md` for more. 