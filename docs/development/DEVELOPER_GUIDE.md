# Developer Guide

Nexus is built for extensibility and automation, leveraging OpenClaw for agent orchestration and channel integration.

## Development Workflow

- Use Bun or Node.js for scripts and tests.
- Run `pnpm dev` for local development.
- Use OpenClaw SDK for agent logic and channel plugins.

## Code Structure

- Agents: `/src/agents`
- Channel integrations: `/src/channels` (OpenClaw core + extensions)
- Service layer: `/src/services`
- Utilities: `/src/utils`

## Adding Skills & Tools

- Extend agent capabilities via OpenClaw plugin SDK.
- Add new tools in `/src/tools` and register with agent logic.

## Testing

- Use Vitest for unit and integration tests.
- Coverage: `pnpm test:coverage`

## Useful Links

- [OpenClaw SDK Reference](https://docs.openclaw.ai/sdk)
- [Service Layer Architecture](./SERVICE_LAYER_ARCHITECTURE.md)
- [RBAC Guide](./RBAC_GUIDE.md)

---

For full docs, visit [https://docs.openclaw.ai/developer-guide](https://docs.openclaw.ai/developer-guide)