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

## 🎯 Core Philosophy: "Tool as a Skill-Bridge"

Nexus transforms from a reporting tool into a **business command center** where users don't just see their business - they can run it. The platform serves as a "skill-bridge" that enables entrepreneurs to execute their vision without mastering every domain.

### The Complete Action Loop
```
Insight → Next Best Action → Execution → Journaled Learning → Sharper Insight
   ↓           ↓              ↓              ↓                ↓
"Revenue    "Send follow-   Automated    "This worked    "Optimize for
dropped"    up emails"      execution    → +$15K"        next quarter"
```

### Key Principles:
1. **Clarity First** - Every feature makes it obvious what to do next
2. **Delegation by Design** - Easily hand off tasks to team members or AI agents
3. **Role-Centric Structure** - See business through clear functional units
4. **Integrated Intelligence** - All tools in one hub for context switching
5. **Immediate Value** - 10-minute onboarding with real insights and actionable recommendations

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

## 🚀 Success Formula

### **First 5 minutes = Hook**
- Real insights appear instantly
- "3 deals at risk worth $45K"
- One-click action execution
- **Target**: User sees immediate value

### **First week = Trust**
- Accurate, contextual guidance
- Cross-platform intelligence
- Measurable business impact
- **Target**: User relies on Nexus for decisions

### **First month = Habit**
- Decision journal shows progress
- "Sales closed rate improved 12%"
- System learns and adapts
- **Target**: User can't imagine running business without Nexus

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

### Planned UX Track: Familiar + Distinct

Goal: make Nexus feel immediately familiar (ChatGPT/Gemini patterns) while clearly branded and system-aware.

Current and near-term plan:
1. **Nexus Signature Layer**: subtle branded composer signature and identity cues.
2. **Enterprise Density Pass**: tighter typography and spacing for production readability.
3. **Context Chips (Planned)**: live context indicators under composer (company/projects/knowledge).
4. **Agent Activity Timeline (Planned)**: visual states for single and multi-agent orchestration.
5. **Show Mode Motion (Planned)**: state-driven visual emphasis for demos with reduced-motion compliance.

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

---

# Project Overview

Nexus is evolving into a personal assistant platform focused on actionable intelligence and reasoning. The core architecture leverages OpenClaw for agent orchestration, channel connectivity, and automation.

## Assistant Paradigm

- **Contextual Reasoning:** Agents understand user context and intent.
- **Actionable Intelligence:** Nexus not only analyzes information but acts on it—scheduling, messaging, automating tasks.
- **Integration:** OpenClaw provides robust channel support and agent SDKs.

## Architecture Highlights

- Modular agent framework (OpenClaw SDK)
- Multi-channel routing (Telegram, Discord, Slack, etc.)
- Extensible skills/tools
- Secure configuration and RBAC

## Next Steps

- [Quickstart Guide](https://docs.openclaw.ai/quickstart)
- [Developer Guide](https://docs.openclaw.ai/developer-guide)
- [Service Layer Architecture](./SERVICE_LAYER_ARCHITECTURE.md)

---
For more, see [https://docs.openclaw.ai/](https://docs.openclaw.ai/)
