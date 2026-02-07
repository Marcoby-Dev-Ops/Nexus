# Environment Variables Migration

Nexus and OpenClaw use environment variables for configuration and secrets.

## Migration Steps

1. Review `.env.example` for required variables.
2. Move legacy variables to new format as needed.
3. Use OpenClaw config commands for gateway and channel setup:
   ```bash
   openclaw config set gateway.mode=local
   ```

## Common Variables

- `OPENCLAW_GATEWAY_MODE`
- `DISCORD_BOT_TOKEN`
- `TELEGRAM_BOT_TOKEN`
- `SLACK_BOT_TOKEN`

## Related Docs

- [Quickstart Guide](./QUICKSTART.md)
- [Service Layer Architecture](./SERVICE_LAYER_ARCHITECTURE.md)

---

### [ENVIRONMENT_VARIABLES_MIGRATION.md](vscode-remote://wsl/home/vonj/dev/Nexus/docs/ENVIRONMENT_VARIABLES_MIGRATION.md)

Update to clarify environment variable handling and migration.
