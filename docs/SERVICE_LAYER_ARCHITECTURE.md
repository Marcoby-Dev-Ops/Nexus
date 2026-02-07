# Service Layer Architecture

Nexus’s service layer coordinates agent reasoning, action execution, and channel routing via OpenClaw.

## Core Components

- **Agent Engine:** Handles reasoning, planning, and action execution.
- **Channel Router:** Uses OpenClaw for multi-channel messaging and voice.
- **Automation Services:** Schedule and trigger workflows.
- **RBAC:** Role-based access control for agent actions.

## Integration Points

- OpenClaw SDK for agent orchestration and channel plugins.
- Extensible via custom tools and skills.

## Architecture Diagram

<!-- Add diagram link or image if available -->

## Related Docs

- [Developer Guide](./DEVELOPER_GUIDE.md)
- [RBAC Guide](./RBAC_GUIDE.md)

---