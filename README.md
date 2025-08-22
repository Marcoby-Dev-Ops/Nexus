# Nexus

> **Modern AI‑powered business operating system**
> built with TypeScript, React, PostgreSQL, n8n & pgvector.

Nexus helps founders and teams **see, act, and think** through real‑time insights, automated workflows, and AI advice — all wrapped in a clean, modular codebase that scales from early startup to enterprise.

> **📖 For complete project vision and development context, see [PROJECT_CONTEXT.md](./docs/current/PROJECT_CONTEXT.md).**

---

## ✨ Key Highlights

| Pillar                 | What it Delivers                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **AI Agent Hierarchy** | Executive → Specialist → Tool agents, each with memory‑backed context and dynamic tool routing.                                        |
| **Domain‑driven core** | Value Objects, Aggregates, CQRS/EventBus enforce business rules.                                                                       |
| **Feature folders**    | 9 live domains (AI, Analytics, Automation, Business, Dashboard, Integrations, Navigator, Help‑Center, Auth) — no page‑to‑page imports. |
| **Realtime‑native**    | PostgreSQL with pgvector + Edge Functions push KPI & workflow deltas straight to the UI.                                              |
| **Automation**         | Self‑hosted n8n engine with webhook queue + retry & credential rotation.                                                               |
| **Knowledge Vault**    | Upload → embed → semantic + hybrid FTS search, with **chunk metadata** for deep links.                                                 |
| **Design system**      | Tailwind + shadcn/ui, dark/light theming, Storybook a11y with axe‑core.                                                                |
| **RBAC everywhere**    | Authentik‑driven roles, `rbac.guard.ts` middleware, RLS on every table.                                                                |
| **Dev‑First DX**       | `pnpm devtools *` CLI (scaffold/validate/fix/docs), Husky hooks, 90 % test threshold.                                                  |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ 
- pnpm 8+
- Docker (for local development)
- PostgreSQL (or use Docker)

### Installation & Development

```bash
# Clone the repository
git clone https://github.com/Marcoby-Dev-Ops/Nexus.git
cd Nexus

# Install all dependencies (root + client + server)
pnpm install

# Start development servers
pnpm dev:full          # Start both frontend and backend
# OR run separately:
pnpm dev               # Frontend only (client)
pnpm dev:api           # Backend only (server)

# Local database setup (optional)
pnpm supabase start    # local PostgreSQL + Studio

# Demo: scaffold a new page & KPI widget
pnpm devtools scaffold --type=page --name=Demo
# add a KPI card and see live data in Navigator

# upload any PDF to Knowledge Vault, then ask AI:
# "Summarize the uploaded sales contract and highlight risks."
```

### Production Build

```bash
# Build frontend for production
pnpm build

# Build backend for production
pnpm build:api

# Run production build
pnpm preview
```

---

## 🧰 Tech Stack

### Frontend
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality component library
- **Zustand** - Lightweight state management
- **React Query** - Server state management
- **React Router** - Client-side routing

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **PostgreSQL** - Primary database
- **pgvector** - Vector similarity search
- **Authentik** - Identity provider
- **BullMQ** - Job queue system

### AI & Automation
- **OpenAI** - Large language models
- **n8n** - Workflow automation
- **EventBus** - Event-driven architecture
- **Memory Service** - AI context management

### Infrastructure
- **Docker** - Containerization
- **Coolify** - Self-hosted deployment platform
- **GitHub Actions** - CI/CD
- **Husky** - Git hooks

---

## 📂 Project Structure

```
Nexus/
├── client/                    # Frontend application
│   ├── src/                   # Source code
│   │   ├── core/              # Domain layer (VOs, aggregates, EventBus)
│   │   ├── services/          # Application services (one folder per domain)
│   │   ├── pages/             # UI & controllers (one folder per domain)
│   │   ├── shared/            # Design system, hooks, stores, utils
│   │   ├── hooks/             # Custom React hooks
│   │   ├── types/             # TypeScript type definitions
│   │   └── app/               # App shell & routing
│   ├── public/                # Static assets
│   ├── scripts/               # Development utilities & test scripts
│   ├── __tests__/             # Test files
│   ├── cypress/               # E2E tests
│   ├── test/                  # Additional test utilities
│   ├── coverage/              # Test coverage reports
│   ├── .storybook/            # Storybook configuration
│   ├── package.json           # Frontend dependencies
│   ├── vite.config.ts         # Vite configuration
│   ├── tsconfig.json          # TypeScript configuration
│   ├── tailwind.config.ts     # Tailwind CSS configuration
│   ├── jest.config.ts         # Jest test configuration
│   ├── cypress.config.ts      # Cypress E2E configuration
│   └── README.md              # Client documentation
├── server/                    # Backend API
│   ├── routes/                # API routes
│   ├── services/              # Business logic
│   ├── middleware/            # Express middleware
│   ├── database/              # Database configuration
│   ├── migrations/            # Database migrations
│   └── ...
├── docs/                      # Documentation
├── scripts/                   # Build and deployment scripts
├── package.json               # Root workspace configuration
├── pnpm-workspace.yaml        # Workspace configuration
├── docker-compose.yml         # Docker configuration
├── docker-compose.ai.yml      # AI services configuration
├── docker-compose.postgres.yml # Database configuration
├── coolify.json              # Deployment configuration
├── Dockerfile                # Docker build configuration
├── .env                      # Environment variables
├── .env.example              # Environment template
├── nginx.conf                # Nginx configuration
├── authentik-nexus-theme.css # Authentik theme
├── database.config.local.json # Local database config
└── README.md                 # Project documentation
```

### Active Domains

| Domain | Location | Purpose |
|--------|----------|---------|
| **AI** | `client/src/pages/ai` | Chat UI, agent selector, AI memory hooks |
| **Analytics** | `client/src/pages/analytics` | Metric dashboards, data‑warehouse views |
| **Automation** | `client/src/pages/automation` | Workflow recipes & execution status |
| **Business** | `client/src/pages/business` | Company profile, FIRE Cycle health |
| **Dashboard** | `client/src/pages/dashboard` | Consolidated KPI overview |
| **Integrations** | `client/src/pages/integrations` | OAuth flows, webhook status, credentials |
| **Navigator** | `client/src/pages/navigator` | Live KPI sparklines & alerts |
| **Help Center** | `client/src/pages/help-center` | File upload & Knowledge Vault search |
| **Auth** | `client/src/pages/auth` | Login, profile, RBAC management |

---

## 🧱 Core Architecture

### Domain Layer
- **Value Objects:** `Money`, `Identity`, etc. — immutable & validated
- **Aggregates:** `Company`, `User`, etc. Mutations emit domain events
- **EventBus:** In‑memory publisher; services subscribe to events
- **CQRS:** Commands mutate, Queries read; repositories wrap PostgreSQL

### Realtime System
```
ai_kpi_snapshots → Realtime → useNavigatorMetrics → Navigator UI
workflow_executions → Realtime → useWorkflowStateSync → Automation UI
```

### AI Agent System
- **3‑Tier Agents**: Executive → Department Specialist → Tool agent
- **Memory-backed context**: Facts + thoughts + dialogue
- **Smart tool routing**: Dynamic agent selection based on context
- **Navigator integration**: Live KPIs, alerts & agent hints

### Knowledge Vault
1. Upload PDF/DOC/TXT → PostgreSQL Storage
2. `embed_document` Edge Function extracts & chunks text, embeds, stores `heading_path` for deep links
3. Hybrid search: pgvector similarity × FTS rank

---

## 🔒 Security & Permissions

### Authentication
- **Authentik Integration**: Enterprise-grade identity provider
- **OAuth 2.0/OpenID Connect**: Secure authentication flows
- **Multi-Factor Authentication (MFA)**: Enhanced account security

### Authorization
- **Role-Based Access Control (RBAC)**: Granular permissions
- **Row-Level Security (RLS)**: Database-level access control
- **Permission Hooks**: `usePermission` hook gates UI components

### Data Protection
- **Encryption at Rest**: Sensitive data encryption
- **Encryption in Transit**: TLS/SSL for all communications
- **API Rate Limiting**: Protection against abuse

---

## 🛠️ Development Workflow

### Available Commands

| Command | Description |
|---------|-------------|
| `pnpm dev:full` | Start both frontend and backend |
| `pnpm dev` | Start frontend only |
| `pnpm dev:api` | Start backend only |
| `pnpm build` | Build frontend for production |
| `pnpm build:api` | Build backend for production |
| `pnpm test` | Run frontend tests |
| `pnpm test:api` | Run backend tests |
| `pnpm lint` | Lint frontend code |
| `pnpm lint:api` | Lint backend code |

### Development Tools

| Command | Description |
|---------|-------------|
| `pnpm devtools validate staged` | ESLint + TS + custom rules (staged) |
| `pnpm devtools fix all` | Auto‑fix lint & format |
| `pnpm devtools scaffold --type=page --name=Foo` | Generate feature boilerplate |
| `pnpm devtools docs --format=md` | Regenerate docs under `/docs` |
| `pnpm devtools test --coverage` | Jest with 90 % threshold |
| `pnpm devtools migrate --up` | Run DB migrations |

### Quality Assurance
- **Pre-commit hooks**: Validate → test automatically
- **CI/CD**: Full repo validation plus dependency analysis
- **Test coverage**: 90% threshold enforced
- **Type safety**: Strict TypeScript configuration

---

## 🖥️ Performance

### Frontend Optimization
- **Route-level code-splitting**: Dynamic imports for heavy widgets
- **IntersectionObserver**: Pauses off-screen realtime widgets
- **Virtualized tables**: Efficient rendering for large datasets
- **Bundle analysis**: Monitored in CI via performance-audit

### Backend Optimization
- **Connection pooling**: Efficient database connections
- **Caching strategies**: Redis for session and data caching
- **Query optimization**: Indexed queries and efficient joins
- **Rate limiting**: API protection and abuse prevention

---

## 🚀 Deployment

### Local Development
```bash
# Start all services
docker-compose up -d

# Run migrations
pnpm devtools migrate --up

# Start development servers
pnpm dev:full
```

### Production Deployment
```bash
# Build and deploy with Coolify
# Configuration in coolify.json

# Or manual deployment
docker build -t nexus .
docker run -p 3000:3000 nexus
```

### Environment Configuration
- Copy `.env.example` to `.env`
- Configure database connections
- Set up Authentik integration
- Configure AI service keys

---

## 🛣️ Roadmap (Q3 → Q4 2025)

| Priority | Item | Status |
|----------|------|--------|
| P1 | Repository pattern implementation | In Progress |
| P2 | Permission audit & import graph scripts | Planned |
| P3 | Agent memory optimization | Planned |
| P4 | Navigator cache for cold-start trends | Planned |
| P5 | Mobile-first responsive design | Planned |

---

## 🤝 Contributing

### Development Process
1. Fork the repository
2. Create a feature branch
3. Use `pnpm devtools scaffold` for new features
4. Follow Conventional Commits
5. Ensure all tests pass
6. Submit a pull request

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration
- **Prettier**: Consistent formatting
- **Tests**: 90% coverage required
- **Documentation**: TSDoc for public APIs

### Pull Request Requirements
- ✅ All tests passing
- ✅ No TypeScript errors
- ✅ ESLint passes
- ✅ Coverage threshold met
- ✅ Documentation updated

---

## 📚 Documentation

- **[PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md)** - Complete project vision and context
- **[SECURITY.md](./SECURITY.md)** - Security policy and vulnerability reporting
- **[docs/](./docs/)** - Architecture and API documentation
- **[client/README.md](./client/README.md)** - Frontend-specific documentation

---

## 📜 License

MIT © 2025 Marcoby LLC. See `LICENSE` for details. 