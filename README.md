# Nexus

> **Modern AI‑powered business operating system**
> built with TypeScript, React, PostgreSQL, n8n & pgvector.

Nexus helps founders and teams **see, act, and think** through real‑time insights, automated workflows, and AI advice — all wrapped in a clean, modular codebase that scales from early startup to enterprise.

> **📖 For complete project vision and development context, see [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md).**

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

## 🚀 5‑Minute Quick Start

```bash
pnpm i                      # install deps
pnpm supabase start         # local PostgreSQL + Studio
pnpm dev                    # Vite + Storybook tunnel

# demo: scaffold a new page & KPI widget
pnpm devtools scaffold --type=page --name=Demo
# add a KPI card and see live data in Navigator

# upload any PDF to Knowledge Vault, then ask AI:
# "Summarize the uploaded sales contract and highlight risks."
```

---

## 🧰 Tech Stack (High Level)

```
Frontend  : React 19 · TypeScript · Tailwind CSS · shadcn/ui
Backend   : PostgreSQL · pgvector · Auth · Realtime
AI        : OpenAI · pgvector · Memory Service (facts/thoughts/context)
Automation: n8n · BullMQ · EventBus · Edge Webhooks
Infra     : Docker · CI (GitHub Actions) · Husky + lint‑staged
```

---

## 📂 Monorepo Layout (feature‑first)

```text
├─ src/
│  ├─ core/          # Domain layer (VOs, aggregates, EventBus)
│  ├─ services/      # Application services (one folder per domain)
│  ├─ pages/         # UI & controllers (one folder per domain)
│  ├─ shared/        # Design system, hooks, stores, utils
│  └─ app/           # App shell & routing
├─ supabase/         # Edge Functions, SQL, storage rules
├─ devtools/         # @marcoby/devtools source
└─ docs/             # Auto‑generated architecture & API docs
```

<details>
<summary>Active Domains</summary>

| Folder               | Purpose                                  |
| -------------------- | ---------------------------------------- |
| `pages/ai`           | Chat UI, agent selector, AI memory hooks |
| `pages/analytics`    | Metric dashboards, data‑warehouse views  |
| `pages/automation`   | Workflow recipes & execution status      |
| `pages/business`     | Company profile, FIRE Cycle health       |
| `pages/dashboard`    | Consolidated KPI overview                |
| `pages/integrations` | OAuth flows, webhook status, credentials |
| `pages/navigator`    | Live KPI sparklines & alerts             |
| `pages/help-center`  | File upload & Knowledge Vault search     |
| `pages/auth`         | Login, profile, RBAC management          |

</details>

---

## 🧱 Core Domain Layer

* **Value Objects:** `Money`, `Identity`, … — immutable & validated.
* **Aggregates:** `Company`, `User`, etc. Mutations emit domain events.
* **EventBus:** In‑memory publisher; Edge Functions & services subscribe.
* **CQRS:** Commands mutate, Queries read (queries in progress); repositories wrap PostgreSQL.

---

## 📡 Realtime & Agent System

```
ai_kpi_snapshots → Realtime → useNavigatorMetrics → Navigator UI
workflow_executions → Realtime → useWorkflowStateSync → Automation UI
```

* **3‑Tier Agents**: Executive → Department Specialist → Tool agent.
* Agents get **memory‑backed context** (facts + thoughts + dialogue) and smart tool routing.
* **Navigator** surfaces live KPIs, alerts & agent hints without polling.

---

## 📁 Knowledge Vault Flow

1. Upload PDF/DOC/TXT → PostgreSQL Storage.
2. `embed_document` Edge Function extracts & chunks text, embeds, stores `heading_path` for deep links.
3. Hybrid search: pgvector similarity × FTS rank.

---

## 🔒 Security & Permissions

* PostgreSQL Auth + Authentik SSO.
* RBAC roles & permission sets; `usePermission` hook gates UI.
* Row‑level security on every table via `company_id()` helper.

---

## 🛠️ Developer Workflow

| Command                                         | Description                         |
| ----------------------------------------------- | ----------------------------------- |
| `pnpm devtools validate staged`                 | ESLint + TS + custom rules (staged) |
| `pnpm devtools fix all`                         | Auto‑fix lint & format              |
| `pnpm devtools scaffold --type=page --name=Foo` | Generate feature boilerplate        |
| `pnpm devtools docs --format=md`                | Regenerate docs under `/docs`       |
| `pnpm devtools test --coverage`                 | Jest with 90 % threshold            |
| `pnpm devtools migrate --up`                    | Run DB migrations                   |

Pre‑commit runs **validate → test**; CI repeats on full repo plus **madge** & **permission‑audit**.

---

## 🖥️ Performance

* Route‑level code‑splitting & dynamic import of heavy widgets.
* `IntersectionObserver` pauses off‑screen realtime widgets.
* Virtualized tables for large data sets.
* Bundle size monitored in CI via `performance-audit` (coming Q4).

---

## 🛣️ Roadmap (Q3 → Q4 2025)

| Priority | Item                                                                      |
| -------- | ------------------------------------------------------------------------- |
| P1       | Wrap remaining service → DB calls in repositories; finish query handlers. |
| P2       | Ship **permission‑audit** & **import‑graph** scripts in CI.               |
| P3       | Agent **memory optimization** – vector recall & extended cache TTL.       |
| P4       | Add `ai_kpi_snapshots_cache` for Navigator cold‑start trend lines.        |
| P5       | Mobile‑first polish & responsive analytics widgets.                       |

---

## 🤝 Contributing

Fork → branch → `pnpm devtools scaffold` → commit with Conventional Commits. PR must pass CI (coverage, circular deps, permission audit).

---

## 📜 License

MIT © 2025 Marcoby LLC. See `LICENSE` for details. 