# Nexus OS — Project Context for Cursor

---

**Project Name:** Nexus OS

**Description:**
Nexus OS is a modern, web-based business operating system designed for small and medium-sized businesses. It provides a modular, department-based dashboard where each core business area (Sales, Finance, Operations, etc.) gets its own workspace, analytics, and tools.

Nexus is built to:

* Centralize key business functions in one intuitive platform
* Allow departments/modules (Sales, Finance, Ops, etc.) to be added, removed, or upgraded as needed
* Embed AI-powered "Agents" that provide insights, automate tasks, and connect with 3rd party tools (like HubSpot, QuickBooks, Microsoft 365)
* Sell and provision integrated SaaS tools/add-ons (Pulse Marketplace) so users can add new capabilities instantly
* Offer a powerful Assistant Panel for each department so users can ask questions, get recommendations, and take action—all in one place

**Technology:**

* React + TypeScript (frontend)
* Tailwind CSS for UI
* shadcn/ui for modern, accessible, and modular UI components
* React Router for navigation
* Modular file structure: `/departments`, `/components`, `/pages`, `/hooks`, `/services`, etc.

**MVP Goal:**

* Build core UI scaffold: sidebar nav, dashboard, 3 department pages, Pulse Marketplace, and an Assistant Panel
* No backend or API integrations needed for first phase—focus on UX, navigation, and modularity
* All code should be clean, scalable, and ready to extend

**Design Principles:**

* Clean, professional, mobile-friendly
* Modular—easy to add new departments, agents, and features
* White-label ready (replace branding for resellers)
* Fast to demo for clients and stakeholders

**Nexus OS** is Marcoby's in-house, AI-powered "business operating system."
Think of it as a modular workspace that pulls your core operations—sales, finance, ops, and Pulse marketplace—into a single, self-hosted platform and layers intelligent assistants on top.

| Layer                       | What it does                                                                                                                        | Tech choices                                         |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **UI Shell**                | Responsive React front-end with sidebar, dark-mode, shadcn/ui components.                                                           | React 18 + TypeScript + Vite + Tailwind              |
| **Domain Modules**          | Feature-sliced dashboards for **Sales**, **Finance**, **Operations**, plus **Pulse** (marketplace / add-ons).                       | DDD folder structure; lazy-loaded routes             |
| **AI Assistants**           | Context-aware agents (chat panel, task routing) that leverage OpenRouter/GPT models, vector search, and n8n for workflow execution. | Node/Express endpoints, Supabase & Qdrant for memory |
| **Realtime Core**           | WebSocket event bus for metrics streaming, workflow sync, toast notifications.                                                      | Custom WS provider, Zustand stores                   |
| **Automation Fabric**       | n8n subflows trigger actions (e.g., create invoice, post blog) directly from agent output.                                          | n8n + custom tool routers                            |
| **Security & Multi-Tenant** | RBAC guards, tenant isolation, AES-256-GCM credential vault.                                                                        | Prisma, Authentik, Zod validation                    |
| **Dev-XP**                  | ESLint 9 flat config, Jest/Playwright tests, Storybook, Husky pre-commit compliance checks.                                         | PNPM mono-repo ready                                 |

### Why Nexus matters

1. **Single Source of Truth** – All key data and workflows live in one pane.
2. **AI on Tap** – Each department gets a purpose-built assistant that can answer, suggest, or execute.
3. **Pluggable Marketplace (Pulse)** – Drop-in integrations and add-ons you can upsell.
4. **Self-Hosted & Brandable** – Runs on your infrastructure; white-label potential.
5. **Scales with You** – Feature-sliced codebase, multi-tenant by design, automated tests/CI.

### Immediate Goals

1. **Week-1 Roadmap** (shell, nav, dark-mode, dummy chat).
2. **Week-2**: real chat → OpenRouter, basic memory, Pulse JSON feed, tests ≥ 80%.
3. **Week-3**: auth, RBAC, live metrics over WebSocket, first Pulse checkout flow.

Nexus is the spine unifying Marcoby's three pillars—**Pulse** (products), **Catalyst** (managed services), and **Nexus** (the OS itself)—into a generational, AI-first business platform.
