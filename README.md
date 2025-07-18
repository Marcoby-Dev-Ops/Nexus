# Nexus

> **The AI-First Business Operating System**

Nexus is the unified, AI-powered operating system for modern business—uniting every department, workflow, and insight in a single, intuitive platform. It empowers startups and enterprises alike to operate smarter, automate more, and grow faster—with daily value, actionable intelligence, and scalable workflows.

---

## 🚀 North Star Vision

- **Unified Experience:** Every function, one platform, no silos.
- **AI-First:** Embedded intelligence and automations in every workflow.
- **Modular/Extensible:** Add/remove features, customize, and scale.
- **Enterprise-Ready:** Security, compliance, and reliability from day one.
- **Startup-Friendly:** Easy onboarding, fast value, fair pricing.
- **Continuous Improvement:** Learns and gets better with every user (data flywheel).
- **Trinity Architecture:** THINK (brainstorm/collaborate), SEE (analyze/understand), ACT (automate/execute).

**Read the full vision and execution plan:** [docs/NEXUS_VISION_EXECUTION_PLAN.md](./docs/NEXUS_VISION_EXECUTION_PLAN.md)

---

## 🗺️ Phased Roadmap (2025 Edition)

1. **Foundation & MVP:** Unified navigation, dashboard, department modules, AI assistant, onboarding, secure multi-tenant backend.
2. **Feature Depth & Extensibility:** Deepen department features, launch marketplace, expand integrations, add customization and advanced security.
3. **Enterprise & Scale:** Horizontal scaling, advanced analytics, app store, global support, certifications.
4. **Continuous Learning:** Progressive AI, community templates, global expansion, and retention features.

---

## Project Structure

```
Nexus/
├── src/                 # App source code, organized by domain (see below)
├── public/              # Static assets (images, favicon, etc.)
├── supabase/            # Supabase config, migrations, and edge functions
├── docs/                # 📚 All project documentation
├── scripts/             # Utility and automation scripts (setup, migrations, etc.)
├── archive/             # Archived/legacy code and resources
├── __tests__/           # Unit and integration tests
├── dist/                # Build output (production-ready files)
├── node_modules/        # Installed npm dependencies
├── backups/             # Database or project backups
├── .github/             # GitHub workflows, issue templates, etc.
├── .env                 # Environment variables
└── ...                  # Config files (tsconfig.json, vite.config.ts, etc.)
```

### Domain-Driven Structure

- Each top-level directory in `src/` represents a business domain (e.g., `ai/`, `analytics/`, `user/`, `workspace/`, etc.).
- Each domain contains its own `components/`, `features/`, `hooks/`, `lib/`, and `pages/` subdirectories as needed.
- Shared, reusable UI and logic live in `src/shared/` (e.g., `src/shared/components/ui/`).
- App shell, config, and global types are in `src/app/`, `src/config/`, `src/constants/`, etc.

#### Example:
```
src/
  ai/
    components/
    features/
    hooks/
    lib/
    pages/
  user/
    components/
    ...
  shared/
    components/
      ui/
    lib/
    ...
  ...
```

### Migration Rationale

- **Why:** To improve maintainability, scalability, and clarity as the codebase grows.
- **How:** All business logic, UI, and features are grouped by domain. Shared code is centralized. Legacy folders like `features/`, `services/`, etc. have been migrated or removed.
- **Result:** Faster onboarding, easier refactoring, and clear ownership of code.

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Run tests
pnpm test

# Build for production
pnpm run build
```

## Documentation

- **[Nexus Vision & Execution Plan](docs/NEXUS_VISION_EXECUTION_PLAN.md)** - North Star, roadmap, and execution strategy
- **[Project Overview](docs/PROJECT_OVERVIEW.md)** - High-level architecture and goals
- **[Testing Guide](docs/testing/TESTING_CHECKLIST.md)** - Comprehensive testing system
- **[Deployment](docs/deployment/DEPLOYMENT.md)** - Production deployment instructions
- **[API Documentation](docs/api.md)** - Backend API reference

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Functions)
- **Testing**: Jest, Testing Library, Cypress (E2E)
- **Build**: Vite, ESLint, TypeScript
- **CI/CD**: GitHub Actions, Codecov

---

## Why Nexus?

- **Single Source of Truth** – All key data and workflows in one pane
- **AI on Tap** – Each department gets a purpose-built assistant
- **Pluggable Marketplace** – Add integrations and features instantly
- **Self-Hosted & Brandable** – Runs on your infrastructure; white-label potential
- **Scales with You** – Feature-sliced codebase, multi-tenant by design, automated tests/CI

---

## The Trinity: THINK / SEE / ACT

- **THINK:** Brainstorm, collaborate, capture ideas (Personal/Team/Org memory)
- **SEE:** Analyze, understand, get real-time insights (Dashboards, analytics, AI)
- **ACT:** Automate, execute, optimize (Workflows, automations, integrations)
- **Continuous Learning:** Every action and insight feeds back into the system, making Nexus smarter for all users (data flywheel).

---

**Ready to build the future of business? Start with the [Nexus Vision & Execution Plan](docs/NEXUS_VISION_EXECUTION_PLAN.md).**

## 🛠️ **Development**

| Command | Description |
|---------|-------------|
| `pnpm run dev` | Start development server |
| `pnpm run build` | Build for production |
| `pnpm run preview` | Preview production build |
| `pnpm test` | Run tests |
| `pnpm run test:coverage` | Run tests with coverage |
| `pnpm run lint` | Check code quality |
| `pnpm run type-check` | TypeScript validation |

## 🤝 **Contributing**

1. Create a feature branch
2. Make your changes
3. Run tests: `pnpm test`
4. Check linting: `pnpm run lint`
5. Submit a pull request

All PRs automatically run through our CI/CD pipeline with tests, linting, and security checks.

## 📄 **License**

See [LICENSE](docs/LICENSE) for details. 