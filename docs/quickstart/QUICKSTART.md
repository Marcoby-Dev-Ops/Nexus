# Quickstart Guide

Welcome to Nexus, your personal assistant platform for actionable intelligence and automation.

## Prerequisites

- Node.js 22+ (Bun supported)
- [OpenClaw](https://github.com/openclaw/openclaw) installed

## Setup

1. Clone Nexus:
   ```bash
   git clone https://github.com/your-org/nexus.git
   cd nexus
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Configure OpenClaw gateway:
   ```bash
   openclaw config set gateway.mode=local
   ```

4. Start Nexus:
   ```bash
   pnpm dev
   ```

## Connect Channels

- Use OpenClaw to connect messaging, voice, and web channels.
- See [OpenClaw Channel Docs](https://docs.openclaw.ai/channels) for details.

## Next Steps

- [Developer Guide](./DEVELOPER_GUIDE.md)
- [Service Layer Architecture](./SERVICE_LAYER_ARCHITECTURE.md)
- [Project Overview](./PROJECT_OVERVIEW.md)

---
For full docs, visit [https://docs.openclaw.ai/quickstart](https://docs.openclaw.ai/quickstart)



