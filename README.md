# Nexus

> **Modern AI‑powered business operating system**
> built with TypeScript, React, PostgreSQL, OpenClaw & pgvector.

Nexus helps founders and teams **see, act, and think** through real‑time insights, automated workflows, and structured AI collaboration — all self-hosted on your own infrastructure.

> **📖 This is a Self-Hosted System.**
> Your Data. Your Keys. Your Rules.
>
> See **[ARCHITECTURE_AND_PHILOSOPHY.md](./docs/ARCHITECTURE_AND_PHILOSOPHY.md)** for our "Model-Way" framework and system design.

---

## ✨ Key Highlights

| Pillar | What it Delivers |
| :--- | :--- |
| **Agentic AI** | Integrated with **OpenClaw** for safe, sandboxed execution of code and tools. |
| **The Model-Way** | Implementation of Intent-based workflows (Brainstorm, Solve, Decide) rather than unstructured chat. |
| **Auditable Memory** | Every thought and action is recorded in **PostgreSQL** (`ai_messages`) for full compliance. |
| **Realtime‑Native** | Edge Functions push KPI & workflow deltas straight to the UI. |

| **Knowledge Vault** | Upload → embed → semantic search with **pgvector**. |
| **RBAC Everywhere** | **Authentik**‑driven roles, `rbac.guard.ts` middleware, RLS on every table. |

---

## 🚀 Quick Start (Coolify)

Nexus is designed to be deployed via **Coolify** as a composite stack.

### Prerequisites
- A Coolify instance (v4+)
- A domain configured in Coolify
- OpenRouter API Key (for Gemini 2.5 Flash)

### Deployment
1.  **Clone** this repository into your Coolify project.
2.  **Configure** Environment Variables (see `.env.example`).
    - `OPENROUTER_API_KEY`: Your model provider key.
    - `POSTGRES_URL`: Connection string to the `vector_db`.
3.  **Deploy**. Coolify will build the Docker container and start the services.

### OpenClaw Integration (Required)
Nexus relies on **OpenClaw** for its agentic capabilities.

1.  Deploy **openclaw-coolify** (see its README).
2.  In Nexus Environment Variables, set:
    - `OPENCLAW_API_URL`: URL of your OpenClaw instance (e.g., `http://openclaw:18790/v1` or public URL).
    - `OPENCLAW_API_KEY`: Your OpenClaw API Key (default: `sk-openclaw-local`).

### Local Development (Hybrid)
To develop locally while connected to your self-hosted infrastructure:

```bash
# 1. Install dependencies
pnpm install

# 2. Start the Frontend & API (Hot Reload)
pnpm dev:full

# 3. Ensure OpenClaw is running (Port 18790)
# (See openclaw-coolify repo for running the agent runtime)
```

---

## 🧰 Tech Stack

### Frontend
- **React 19** - Concurrent features
- **TypeScript** - Strict type safety
- **Vite** - Lightning fast HMR
- **Tailwind + shadcn/ui** - Professional design system

### Backend & Data
- **Node.js + Express** - API Layer
- **PostgreSQL + pgvector** - Relational Data + Semantic Search
- **Authentik** - Identity Provider (OIDC)

### AI & Agents
- **OpenClaw** - Self-hosted Agent Gateway & Runtime (Required).
- **Google Gemini 2.5 Flash** - Primary reasoning model (via OpenRouter).
- **PostgreSQL Audit** - Permanent conversation logs.
- **Model-Way Framework** - Structured intent-based interaction (Brainstorm, Solve, Decide).

---

## 📂 Project Structure

```bash
Nexus/
├── client/                    # React 19 Application
│   ├── src/pages/ai           # "Model-Way" Chat Interface
│   ├── src/core/              # Domain Layer (VOs, Aggregates)
├── server/                    # Node.js API
│   ├── routes/ai.js           # Chat Endpoints (Audit + Proxy to OpenClaw)
│   ├── database/              # PostgreSQL Connection & Migrations
├── docs/                      # Documentation
│   ├── ARCHITECTURE_AND_PHILOSOPHY.md # MUST READ: System Design
├── docker-compose.yml         # Container Definition
└── coolify.json              # Deployment Config
```

---

## 🛣️ 2026 Roadmap

| Priority | Item | Status |
| :--- | :--- | :--- |
| **P1** | **OpenClaw Integration** | ✅ Complete |
| **P2** | **"Model-Way" UI Components** (Intent Pickers) | 🚧 In Progress |
| **P3** | **Voice Mode** (Realtime Audio) | Planned |
| **P4** | **Multi-Tenant Isolation** | Planned |
| **P5** | **Familiar + Distinct Chat UX** (Nexus signature + responsive motion layer) | 🚧 In Progress |

---

## Documentation

- **[ARCHITECTURE_AND_PHILOSOPHY.md](./docs/ARCHITECTURE_AND_PHILOSOPHY.md)** - The core "Model-Way" philosophy.
- **[PROJECT_CONTEXT.md](./docs/PROJECT_CONTEXT.md)** - Vision and goals.
- **[ENGINEERING_STATUS.md](./docs/current/ENGINEERING_STATUS.md)** - Current development cycle status.
- **[SECURITY_AUDIT_REPORT.md](./docs/compliance/SECURITY_AUDIT_REPORT.md)** - Security and compliance snapshot.

---

## 📜 License

MIT © 2026 Marcoby LLC. See `LICENSE` for details.

what up phantom