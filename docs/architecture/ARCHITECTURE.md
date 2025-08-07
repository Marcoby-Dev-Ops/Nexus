# �� Nexus — Final 2025 Q3 Architecture Snapshot

**Last Updated**: August 6, 2025  
**Status**: Production-ready infrastructure, needs business data integration  

| Layer                     | What Lives Here                                           | Key Highlights                                                                                                                          |
| ------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Core Domain Layer**     | `src/core/**` – value objects, aggregates, CQRS/events    | *Money*, *Identity*, *AggregateRoot* enforce invariants; `EventBus` wires domain events to application services. Event replay supported. |
| **Application Services**  | `src/services/**`                                         | Thin orchestration around aggregates + external APIs; **NEEDS CLEANUP** - mixed patterns, some direct DB calls. Service layer standardization in progress. |
| **Feature Domains**       | `src/pages/**` + twin `src/services/**` folders           | 9 live domains (AI, Analytics, Automation, Business, Dashboard, Integrations, Navigator, Help‑Center, Auth). Zero page‑to‑page imports. **Department modules scaffolded, need business logic**. |
| **Shared Layer**          | `src/shared/**`                                           | Design system (Tailwind + shadcn/ui), hooks (Realtime, RBAC), Zustand stores, utilities. **Production-ready**. |
| **Realtime & Automation** | Supabase Realtime channels, n8n workflows, Edge Functions | `ai_kpi_snapshots`, `workflow_executions` push live deltas → Navigator; n8n self‑hosted with webhook queue + retry. **Infrastructure complete, needs real data sources**. |
| **Knowledge Vault**       | Supabase Storage + pgvector                               | `embed_document` Edge fn chunks & embeds; hybrid vector + FTS search via `vector_facts`. Deep-linkable chunks, resumable uploads. **AI systems fully functional**. |
| **Security**              | RBAC guard → Supabase RLS                                 | Roles (Admin, Owner, Manager, User, Read‑only); permission sets table for custom roles; helper `company_id()` in RLS policies. **Production-ready**. |
| **Dev‑Tooling**           | `@marcoby/devtools` CLI, Husky, CI                        | Validate, fix, scaffold, docs, permission‑audit, import-graph. Jest 90 % threshold; Storybook a11y with axe‑core; coverage to Slack. **Production-ready**. |

---

## 🔑 Architectural Principles

1. **Feature‑based folders, shared center‑of‑gravity.**
   All UI, logic, and tests live with their feature; cross‑feature talk happens only through `/shared` or service contracts.

2. **Event‑driven & realtime‑native.**
   Domain events publish to `EventBus` → Edge Functions → UI. Navigator, dashboards, and alerts stay live without polling.

3. **DDD purity (pragmatic).**
   Aggregates own rules, services orchestrate, repositories shield DB. Event replay and audit built-in.

4. **Security-first.**
   RBAC enforced at API and DB layers; permission sets enable custom roles; RLS policies use concise helpers.

5. **Dev experience.**
   CLI tools, CI checks, and Storybook a11y keep codebase healthy and onboarding fast.

---

## 📊 **Implementation Status by Layer**

### ✅ **Production-Ready Layers**
- **Core Domain Layer**: 100% complete
- **Shared Layer**: 100% complete  
- **Security**: 100% complete
- **Dev-Tooling**: 100% complete
- **Knowledge Vault**: 100% complete (AI systems)

### ⚠️ **Needs Enhancement Layers**
- **Application Services**: 70% complete - needs standardization and cleanup
- **Feature Domains**: 50% complete - department modules need business logic
- **Realtime & Automation**: 80% complete - infrastructure ready, needs real data sources

### 🔄 **Current Focus Areas**
1. **Service Layer Cleanup** - Standardize application services architecture
2. **Business Data Integration** - Connect real data sources to replace mock data
3. **Department Module Business Logic** - Add functional workflows to department dashboards

---

## 🎯 **Architecture-Driven Priorities**

### **Immediate (This Week)**
- [ ] **Service Layer Standardization** - Align with Application Services patterns
- [ ] **Real Data Integration** - Connect business data sources to Knowledge Vault
- [ ] **Department Business Logic** - Implement functional workflows in Feature Domains

### **Short Term (Next 2 Weeks)**
- [ ] **Event-Driven Integration** - Ensure all data flows through EventBus
- [ ] **Security Enhancement** - Strengthen RBAC and RLS policies
- [ ] **Performance Optimization** - Optimize Realtime & Automation layer

### **Medium Term (Next Month)**
- [ ] **Advanced AI Features** - Expand Knowledge Vault capabilities
- [ ] **Enterprise Features** - Add multi-organization support
- [ ] **Advanced Analytics** - Enhance real-time dashboard capabilities

---

> This document is the north star for contributors, auditors, and future architects. For a visual diagram, printable PDF, or more details on any layer, see the rest of the `docs/` folder or ask the team. 