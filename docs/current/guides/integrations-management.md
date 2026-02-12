# Integrations Management

The Nexus integrations management experience is served at:

- `/integrations`
- `/integrations/manage`
- `/integrations/marketplace`

All three routes render the same page so users always land on the connector manager.

## Purpose

This page is where a user grants, reviews, and revokes third-party access for Nexus so Nexus can act on the user's behalf.

## What Users Can Do

- See available connectors and whether each one is connected.
- Start OAuth for supported providers (for example Microsoft 365).
- Disconnect existing integrations.
- Return to the integrations callback flow at `/integrations/oauth/callback` after provider consent.

## Email-First Connection Flow

For conversational setup, users can provide their work email in chat.

- Nexus resolves provider from domain MX records.
- If provider supports OAuth (Microsoft 365 or Google Workspace), Nexus starts that OAuth flow.
- If provider does not support OAuth yet, Nexus routes to manual IMAP/SMTP fallback workflow.

### IMAP Fallback in Chat

When fallback is needed, chat prompts for an IMAP app password and optional overrides.

Supported reply format:

- `password=YOUR_APP_PASSWORD`
- Optional overrides in the same message:
  - `host=imap.example.com`
  - `port=993`
  - `username=you@example.com`
  - `ssl=true`

## Data Model Expectations

Connected services are expected to be stored in:

- `user_integrations`
- `oauth_tokens`

Connection status should be represented as `active` or `connected` for connected accounts.
