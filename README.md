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
├── src/                 # React application source
├── public/              # Static assets
├── supabase/           # Database migrations & functions
├── docs/               # 📚 All project documentation
├── .github/workflows/  # CI/CD automation
└── [config files]     # TypeScript, Vite, Jest, etc.
```

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
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
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm test` | Run tests |
| `npm run test:coverage` | Run tests with coverage |
| `npm run lint` | Check code quality |
| `npm run type-check` | TypeScript validation |

## 🤝 **Contributing**

1. Create a feature branch
2. Make your changes
3. Run tests: `npm test`
4. Check linting: `npm run lint`
5. Submit a pull request

All PRs automatically run through our CI/CD pipeline with tests, linting, and security checks.

## 📄 **License**

See [LICENSE](docs/LICENSE) for details.

Yes, the database is fully set up to handle assessment responses and scoring.

Here's a summary of what's in place:

1.  **Storage Tables**:
    *   `AssessmentQuestion`: Stores the questions, their types (`multiple-choice`, `text`, etc.), and what category they belong to.
    *   `AssessmentCategory`: Defines the categories for the questions and includes a `weight` for calculating weighted scores.
    *   `AssessmentResponse`: This is where each response from a user is stored. Crucially, it has a `value` field for the answer itself and a `score` field to hold the calculated score for that specific answer.

2.  **Scoring and Summary Tables**:
    *   `AssessmentCategoryScore`: This table holds the aggregated score for each category, for each company.
    *   `AssessmentSummary`: This table stores the final, overall assessment score for a company.

3.  **Automatic Scoring Logic**:
    *   There's a database function that automatically recalculates the category and overall scores every time an assessment response is added, updated, or deleted. This ensures the scores are always up-to-date.

So, when a user submits an assessment, the responses are saved, immediately scored, and the overall and category-specific scores are updated automatically. 