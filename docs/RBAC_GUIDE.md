# RBAC Guide

Nexus uses Role-Based Access Control (RBAC) to manage agent permissions and secure actions.

## Key Concepts

- **Roles:** Define access levels for agents and users.
- **Permissions:** Control which actions agents can perform.
- **Integration:** RBAC is enforced in agent workflows and channel routing via OpenClaw.

## Configuration

- Roles and permissions are configured in `config/rbac.yaml`.
- Agents check RBAC before executing actions or accessing sensitive data.

## Example

```yaml
roles:
  - name: admin
    permissions: [all]
  - name: user
    permissions: [read, schedule, message]
```

## Related Docs

- [Service Layer Architecture](./SERVICE_LAYER_ARCHITECTURE.md)
- [Developer Guide](./DEVELOPER_GUIDE.md)

---
For full docs, visit [https://docs.openclaw.ai/rbac](https://docs.openclaw.ai/rbac)
