# Nexus Developer Onboarding

## 1. Prerequisites
- Node.js (LTS)
- pnpm
- Supabase CLI (for local dev)
- Access to project .env file

## 2. Setup

```bash
pnpm install
pnpm supabase start
pnpm run dev
```

## 3. Key Concepts

- **BackendConnector:** Centralized backend health and connection logic
- **DataService:** Unified data fetching with caching and error handling
- **Hooks:** Use `useDataService`, `useNotifications`, etc. for all data access
- **Error Boundaries:** Use `BackendErrorBoundary` to catch backend errors

## 4. Health Monitoring

- Health checks are logged to the `service_health_logs` table in Supabase.
- View logs in the Supabase Admin Console or with SQL.

## 5. Extending the System

- To add a new data source, create a new integration and add a hook in `useDataService`.
- For new health checks, update `backendConnector.ts`.

## 6. Troubleshooting

- Use the Connection Status Indicator in the UI.
- Check `service_health_logs` for backend issues.
- See `docs/BACKEND_CONNECTION_GUIDE.md` for more. 