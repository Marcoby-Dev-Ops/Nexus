# 🚀 Nexus — Final 2025 Q3 Architecture Snapshot

| Layer                     | What Lives Here                                           | Key Highlights                                                                                                                          |
| ------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Core Domain Layer**     | `src/core/**` – value objects, aggregates, CQRS/events    | *Money*, *Identity*, *AggregateRoot* enforce invariants; `EventBus` wires domain events to application services. Event replay supported. |
| **Application Services**  | `src/services/**`                                         | Thin orchestration around aggregates + external APIs; all DB access will move through repositories.                                     |
| **Feature Domains**       | `src/pages/**` + twin `src/services/**` folders           | 9 live domains (AI, Analytics, Automation, Business, Dashboard, Integrations, Navigator, Help‑Center, Auth). Zero page‑to‑page imports. |
| **Shared Layer**          | `src/shared/**`                                           | Design system (Tailwind + shadcn/ui), hooks (Realtime, RBAC), Zustand stores, utilities.                                                |
| **Realtime & Automation** | Supabase Realtime channels, n8n workflows, Edge Functions | `ai_kpi_snapshots`, `workflow_executions` push live deltas → Navigator; n8n self‑hosted with webhook queue + retry.                     |
| **Knowledge Vault**       | Supabase Storage + pgvector                               | `embed_document` Edge fn chunks & embeds; hybrid vector + FTS search via `vector_facts`. Deep-linkable chunks, resumable uploads.       |
| **Security**              | RBAC guard → Supabase RLS                                 | Roles (Admin, Owner, Manager, User, Read‑only); permission sets table for custom roles; helper `company_id()` in RLS policies.          |
| **Dev‑Tooling**           | `@marcoby/devtools` CLI, Husky, CI                        | Validate, fix, scaffold, docs, permission‑audit, import-graph. Jest 90 % threshold; Storybook a11y with axe‑core; coverage to Slack.    |

---

## 🔑 Architectural Principles

1. **Feature‑based folders, shared center‑of‑gravity.**
   All UI, logic, and tests live with their feature; cross‑feature talk happens only through `/shared` or service contracts.

2. **Event‑driven & realtime‑native.**
   Domain events publish to `EventBus` → Edge Functions → UI. Navigator, dashboards, and alerts stay live without polling.

3. **DDD purity (pragmatic).**
   Aggregates own rules, services orchestrate, repositories shield DB. Event replay and audit built-in.

4. **Security-first.**
   RBAC enforced at API and DB layers; permission sets enable custom roles; RLS policies use concise helpers.

5. **Dev experience.**
   CLI tools, CI checks, and Storybook a11y keep codebase healthy and onboarding fast.

---

> This document is the north star for contributors, auditors, and future architects. For a visual diagram, printable PDF, or more details on any layer, see the rest of the `docs/` folder or ask the team. 