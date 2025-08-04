# Nexus OS — Project Context for Cursor

---

> **Note:** For detailed feature and API documentation, see the [`/docs`](./docs) directory. Each major module and API will have its own markdown file for easy reference and contribution.

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

## Codebase Structure

The Nexus codebase is organized by **domain**. Each top-level directory in `src/` represents a business domain (e.g., `ai/`, `analytics/`, `user/`, `workspace/`, etc.).

Each domain contains its own `components/`, `features/`, `hooks/`, `lib/`, and `pages/` subdirectories as needed. Shared, reusable UI and logic live in `src/shared/` (e.g., `src/shared/components/ui/`).

### Example Structure

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

## Coming Soon

### OneDrive & SharePoint File Interface
- **Description:** Users will be able to connect their own Microsoft accounts to browse, download, and (optionally) manage files from both OneDrive and SharePoint directly within Nexus.
- **Authentication:** Per-user Microsoft OAuth (Microsoft Identity Platform). Tokens stored securely in backend.
- **Features (MVP):**
  - Connect/disconnect Microsoft account
  - Browse files/folders (OneDrive & SharePoint)
  - Download files
- **Planned Extensions:**
  - Upload, delete, rename, move, preview, and search files
  - Support for both OneDrive (personal) and SharePoint (site libraries) in a unified UI
  - Role-based permissions and advanced sharing options
- **Status:** Planned, not yet implemented
- **Notes:** Requires Azure App Registration and Microsoft Graph API integration. Will use shadcn/ui and Tailwind for frontend, with secure backend proxy for file operations.