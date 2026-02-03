/**
 * API base URL helper.
 *
 * Best practice: prefer same-origin API calls ("/api/*") and let the reverse proxy
 * route requests to the backend. This avoids CORS and simplifies cookies/OAuth.
 *
 * If you intentionally want cross-origin API calls, set:
 *   - VITE_FORCE_CROSS_ORIGIN_API=true
 *   - VITE_API_URL=https://napi.example.com
 */
export function getApiBaseUrl(): string {
  const forceCrossOrigin = import.meta.env.VITE_FORCE_CROSS_ORIGIN_API === 'true';
  if (!forceCrossOrigin) return '';
  return import.meta.env.VITE_API_URL || '';
}
