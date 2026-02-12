# OpenClaw Nexus Tool Bridge (Production)

## Problem This Solves

Nexus has real backend integration tools (`nexus_*`) for things like checking integration status, starting Microsoft 365 OAuth, and searching inbox email. The OpenClaw assistant was not reliably surfacing/calling those tools during `/v1/chat/completions` runs, resulting in circular conversations like:

- "I can’t access the Nexus tools"
- "I need a user id"
- "Please do it manually"

This solution makes Nexus tools operational inside the assistant, end-to-end, with log evidence of tool execution.

## High-Level Design

### Components

- **Nexus API** exposes a small OpenClaw-facing interface:
  - `GET /api/openclaw/tools/catalog`
  - `POST /api/openclaw/tools/execute`
  - Guarded by `X-OpenClaw-Api-Key` and a trusted user header `X-Nexus-User-Id`.

- **OpenClaw plugin** (`nexus-toolbridge`) registers tool definitions named `nexus_*` and proxies tool execution to Nexus.

- **Dedicated OpenClaw agent** (`nexus`) runs with a minimal workspace and a narrow tool policy so it consistently calls `nexus_*` tools when asked.

### Request/Execution Flow

1. Nexus calls OpenClaw `/v1/chat/completions` with:
   - `model: "openclaw:nexus"`
   - `user: "<nexusUserId>:<conversationId>"`
2. OpenClaw routes the request to the `nexus` agent workspace.
3. The model chooses a `nexus_*` tool.
4. OpenClaw executes the tool via the `nexus-toolbridge` plugin:
   - Extracts `nexusUserId` from the OpenClaw session key (derived from the `user` field).
   - Calls Nexus `POST /api/openclaw/tools/execute` with `X-Nexus-User-Id`.
5. Nexus executes the real backend logic (DB + OAuth start endpoints) and returns results.
6. OpenClaw returns the final assistant response. The agent is required to include `TOOL_USED <toolName>`.

## Implementation Notes

### OpenClaw Agent Routing (Critical)

Nexus must route the Executive Assistant to the OpenClaw agent id `nexus`.

Implemented in `server/src/routes/ai.js`:

- `executive-assistant` → `nexus`
- OpenClaw payload now sets `model: openclaw:${openClawAgentId}` (instead of hardcoding `openclaw:main`)

### OpenClaw Tool Policy (Critical)

Non-main OpenClaw agents typically run sandboxed. Sandbox tool policy must allow `nexus_*` or tool calls will be blocked.

We enforce in OpenClaw config:

- `tools.profile = "full"`
- `tools.sandbox.tools.allow` includes `nexus_*` plus the core defaults

### Dedicated Agent Workspace (Recommended)

The `nexus` agent uses a minimal workspace:

- Path: `/data/.openclaw/workspace-nexus`
- Files:
  - `SOUL.md` (forces Nexus tools + requires `TOOL_USED`)
  - `AGENTS.md` (minimal, avoids memory/tool distractions)

This isolates the prompt from the more complex `main` workspace (which can contain unrelated instructions, memory rules, and other operational content).

## Deployment (Coolify)

### 1. Redeploy OpenClaw (openclaw-coolify)

Repo: `marcoby/openclaw-coolify`

What to verify in the refreshed container:

- Plugin exists at: `/data/.openclaw/extensions/nexus-toolbridge/`
- Config contains agent `nexus` pointing to `/data/.openclaw/workspace-nexus`
- Sandbox tool allowlist includes `nexus_*`

### 2. Redeploy Nexus

Repo: `Marcoby-Dev-Ops/Nexus`

Nexus must be updated so it routes Executive Assistant traffic to `openclaw:nexus`.

### 3. Environment Variables

At minimum:

- **Nexus API**
  - `OPENCLAW_API_KEY` must match what OpenClaw sends as `X-OpenClaw-Api-Key`.

- **OpenClaw**
  - `OPENCLAW_GATEWAY_TOKEN` (gateway auth token)
  - `NEXUS_API_URL` (defaults to `https://napi.marcoby.net` if unset)
  - Optionally: `NEXUS_OPENCLAW_API_KEY` (explicit API key for the Nexus `/api/openclaw/*` endpoints)

Recommendation:

- Keep the Nexus `OPENCLAW_API_KEY` and OpenClaw `NEXUS_OPENCLAW_API_KEY` the same value.

## Verification

### A. Verify Tool Execution via `/tools/invoke` (Deterministic)

From inside the OpenClaw container (or via `docker exec`):

```bash
curl -sS http://127.0.0.1:18790/tools/invoke \
  -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tool":"nexus_get_integration_status",
    "args":{},
    "sessionKey":"agent:main:openai-user:<NEXUS_USER_ID>:diag"
  }'
```

Expected:

- `ok:true`
- payload contains the real integration status from the Nexus DB.

### B. Verify Tool Execution via `/v1/chat/completions` (Operational)

```bash
curl -sS http://127.0.0.1:18790/v1/chat/completions \
  -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -H "x-openclaw-agent-id: nexus" \
  -d '{
    "model":"openclaw:nexus",
    "stream":false,
    "user":"<NEXUS_USER_ID>:diag-nexus",
    "messages":[{"role":"user","content":"Check my integration status."}]
  }'
```

Expected:

- Assistant includes `TOOL_USED nexus_get_integration_status`
- Assistant summarizes the tool result (connected/expired/etc).

### C. Check Logs for Tool Evidence

OpenClaw logs should include lines like:

```
[nexus-toolbridge] tool=nexus_get_integration_status userId=<...> corr=<...>
```

If tool calls are missing:

- Confirm the request is routed to agent `nexus` (model/header)
- Confirm `nexus_*` is allowed by sandbox tool policy
- Confirm plugin is loaded (`openclaw plugins list`)

