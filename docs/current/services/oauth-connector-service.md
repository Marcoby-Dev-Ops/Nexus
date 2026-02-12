# OAuth Connector Service (Running Service)

This service is required for Marcoby-managed Microsoft OAuth onboarding.

## Service Name

- `identity-connect-bridge`

## Host and Domain

- Runs on the Authentik host.
- Public domain: `https://identity.marcoby.com`
- Routed path prefix: `/connect/`

## Why It Exists

It provides a central, Marcoby-operated OAuth broker so customer Nexus instances can connect Microsoft 365 without each customer deploying their own Microsoft enterprise app.

## Public Endpoints

- `GET /connect/microsoft/start`
- `GET /connect/microsoft/callback`

`/start` receives tenant return details and sends users to Microsoft consent.  
`/callback` receives Microsoft `code/state` and forwards users back to the originating Nexus instance callback URL.

## Required Environment Variables

- `MICROSOFT_CLIENT_ID`
- `MICROSOFT_CLIENT_SECRET`
- `MICROSOFT_REDIRECT_URI` (if set, should match `https://identity.marcoby.com/connect/microsoft/callback`)

## Nexus API Integration

Nexus server OAuth route uses:

- `CONNECT_BROKER_BASE_URL` (default `https://identity.marcoby.com`)

When provider is Microsoft, `/api/oauth/microsoft/start` should redirect through:

- `https://identity.marcoby.com/connect/microsoft/start`

## Email-First Provider Detection

Nexus now supports email-first connector routing via:

- `POST /api/oauth/email-provider/resolve`

Request body:

- `{ "email": "user@company.com" }`

Behavior:

- Performs MX lookup on the email domain.
- Infers provider (`microsoft`, `google_workspace`, or manual IMAP fallback).
- Returns recommended workflow:
  - `oauth` for supported providers
  - `imap_manual` for unsupported/non-OAuth providers

## IMAP Connector Endpoint

For non-OAuth providers, Nexus supports direct IMAP credential onboarding:

- `POST /api/oauth/imap/connect`

Required body fields:

- `email`
- `host`
- `port`
- `username`
- `password`
- `useSSL` (optional, default `true`)

Behavior:

- Attempts real IMAP login (`LOGIN`) against the provided host/port.
- On success, upserts connection into `user_integrations` with `integration_name = 'custom_imap'`.

## Operational Checks

1. `GET https://identity.marcoby.com/connect/microsoft/start?...` returns a 302 to Microsoft login.
2. OAuth callback returns to tenant callback URL with `code` and `state`.
3. Nexus API callback endpoint successfully exchanges token and writes:
   - `user_integrations`
   - `oauth_tokens`

## Failure Patterns

- `AADSTS900144` usually means missing `client_id` in broker authorize call.
- `AADSTS50011` means redirect URI mismatch in Entra app registration.
- `invalid_client` means client secret mismatch or expired secret.
