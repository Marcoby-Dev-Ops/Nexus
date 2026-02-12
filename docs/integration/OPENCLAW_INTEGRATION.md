# OpenClaw Integration Guide

Nexus integrates with **OpenClaw** (a self-hosted agent gateway) to provide secure, sandboxed AI execution capabilities. This integration allows Nexus to perform complex tasks like code execution, web research, and tool use while maintaining a strict audit trail.

## Architecture

The integration follows a **Proxy Pattern**:

1.  **Client (React)** sends a chat request to `Nexus API`.
2.  **Nexus API** (`POST /api/ai/chat`) authenticates the user.
3.  **Nexus API** proxies the request to the **OpenClaw Gateway**.
    - It injects the `user` ID to ensure session isolation.
    - It enforces the `model: openclaw:main` routing.
4.  **OpenClaw** processes the request, running any necessary tools in Docker sandboxes.
5.  **Response** is streamed back to Nexus, which:
    - Logs the interaction to PostgreSQL (`ai_messages`) for compliance.
    - Structures the metadata according to the **Model-Way Framework**.
    - Forwards the stream to the Client via Server-Sent Events (SSE).

## Configuration

To enable the integration, configure the following environment variables in `Nexus/server/.env`:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `OPENCLAW_API_URL` | URL of the OpenClaw gateway. | `http://localhost:18789/v1` |
| `OPENCLAW_API_KEY` | API key for the OpenClaw gateway. | `sk-openclaw-local` |
| `BRAVE_API_KEY` | (Optional) API key for web search capabilities (Brave Search). | |
| `PERPLEXITY_API_KEY` | (Optional) API key for Perplexity search. | |

### Autonomous Tools

OpenClaw supports several autonomous tools that can be enabled per-request or per-agent. To use these tools, the corresponding API keys must be present in OpenClaw's `.env` file and, where applicable, passed from Nexus for observability.

#### Web Research
The `web_search` tool is automatically enabled in the Model-Way Framework for the `LEARN` intent. This requires a valid `BRAVE_API_KEY` to be configured in both Nexus and OpenClaw.

> **Note:** If running in Docker/Coolify, use the internal container name (e.g., `http://openclaw:18790/v1`) to avoid public internet routing.

## API Reference

### Chat Completions

- **Endpoint**: `POST /api/ai/chat`
- **Auth**: Bearer Token (JWT)
- **Body**:
    ```json
    {
        "messages": [
            { "role": "user", "content": "Analyze this dataset..." }
        ],
        "stream": true,
        "conversationId": "uuid-optional"
    }
    ```

### Health Check

- **Endpoint**: `GET /api/ai/health`
- **Description**: Verifies connectivity to the OpenClaw Gateway.
- **Response**:
    ```json
    {
        "success": true,
        "openclaw": "connected",
        "modelWay": true
    }
    ```

### Nexus Tool Bridge (for OpenClaw plugins)

Use these endpoints from OpenClaw plugin/runtime to execute Nexus-native integration actions in a user-scoped way.

- **Catalog**: `GET /api/openclaw/tools/catalog`
- **Execute**: `POST /api/openclaw/tools/execute`
- **Auth**: `X-OpenClaw-Api-Key: <OPENCLAW_API_KEY>`
- **User Scope**: include `X-Nexus-User-Id: <nexus_user_id>`

Example execute payload:

```json
{
  "tool": "nexus_get_integration_status",
  "args": {}
}
```

Available tool names:
- `nexus_get_integration_status`
- `nexus_resolve_email_provider`
- `nexus_start_email_connection`
- `nexus_connect_imap`
- `nexus_test_integration_connection`
- `nexus_disconnect_integration`

## Model-Way Framework

Nexus enforces a structured interaction model called the **Model-Way**. Every interaction is categorized into an **Intent** and a **Phase**.

- **Intents**: `Brainstorm`, `Solve`, `Write`, `Decide`, `Learn`
- **Phases**: `Discovery`, `Synthesis`, `Decision`, `Execution`

The Nexus Proxy automatically injects this metadata into the response stream, allowing the UI to adapt its visualization (e.g., showing a "Thinking" state or a "Drafting" view).
