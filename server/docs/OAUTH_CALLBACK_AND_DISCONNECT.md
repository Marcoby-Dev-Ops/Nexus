# OAuth Callback & Disconnect Flow

## Overview

This document describes how the OAuth callback and integration disconnect flows work,
including support for assistant-initiated OAuth where browser `sessionStorage` is unavailable.

## OAuth Callback

### Two Callback Endpoints

| Endpoint | When Used |
|---|---|
| `POST /api/oauth/:provider/callback` | UI-initiated flow (sessionStorage has provider info) |
| `POST /api/oauth/callback` | Assistant-initiated flow (no sessionStorage) |

### How It Works

1. **OAuth start** (`GET /api/oauth/:provider/start`) creates a random `state` value and
   stores `{ state, codeVerifier, userId, integrationSlug, redirectUri, expiresAt }` in the
   server-side `oauthStates` map.

2. The user authorizes with the OAuth provider, which redirects to
   `/integrations/oauth/callback?code=...&state=...`.

3. **Frontend** (`OAuthCallbackPage.tsx`) checks `sessionStorage` for `oauth_provider`,
   `oauth_state`, and `oauth_user_id`:
   - **If present** (UI-initiated): calls `POST /api/oauth/{provider}/callback` with
     `{ code, state, userId, redirectUri }`.
   - **If absent** (assistant-initiated): calls `POST /api/oauth/callback` with
     `{ code, state, redirectUri }`. The server resolves the provider from `oauthStates`
     using the `state` parameter.

4. The server exchanges the authorization code for tokens, fetches user info, persists
   credentials to `user_integrations` and `oauth_tokens`, and returns a success response.

### Key Files

- Server endpoint: `server/src/routes/oauth.js` (lines 1046-1411)
- Frontend callback: `client/src/pages/integrations/OAuthCallbackPage.tsx`

## Integration Disconnect

### Endpoint

`POST /api/oauth/disconnect/:integrationId`

### Request Body

```json
{
  "userId": "<canonical-user-id>",
  "confirm": "DISCONNECT"
}
```

The `confirm` field is required when `REQUIRE_SENSITIVE_ACTION_CONFIRM=true` is set in the
server environment.

### What It Cleans Up

1. `oauth_tokens` — deletes the row matching `(user_id, integration_slug)`
2. `user_integrations` — deletes the row by `id`
3. Records an `integration_disconnected` audit event

### Frontend Flow

`IntegrationMarketplacePage.tsx` → `handleDisconnectIntegration()`:

1. Resolves the canonical user ID via `resolveCanonicalUserId()` (same as the connect and
   fetch flows).
2. Queries `user_integrations` with the canonical user ID to find the record.
3. Calls `POST /api/oauth/disconnect/:id` with `{ userId, confirm: 'DISCONNECT' }`.
4. Refreshes the connected integrations list on success.

### Key Files

- Server endpoint: `server/src/routes/oauth.js` (lines 1475-1526)
- Frontend handler: `client/src/pages/integrations/IntegrationMarketplacePage.tsx`

## Token Renewal

### Server Endpoint

`POST /api/oauth/refresh`

```json
{
  "provider": "microsoft",
  "refreshToken": "<refresh-token>"
}
```

Returns a new `access_token`, `refresh_token`, and `expires_at`.

### Client-Side Auto-Refresh

`OAuthTokenService.ts` provides automatic token refresh:

- `getTokenForProvider()` checks `expires_at` and calls `refreshToken()` if expired.
- `validateToken()` attempts refresh before marking a token as expired.
- Provider-specific refresh methods (Microsoft, Google, HubSpot) call `POST /api/oauth/refresh`.

All providers have `tokenUrl` configured for refresh in the server OAuth config.

## Tests

Server-side tests: `server/__tests__/oauth-callback-disconnect.test.js`

Run with:
```bash
node --test __tests__/oauth-callback-disconnect.test.js
```
