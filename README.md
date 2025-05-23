# Nexus OS

**Nexus OS** is a modern, modular, AI-powered business operating system for small and medium-sized businesses. It centralizes your core operations—Sales, Finance, Operations, and more—into a single, intuitive platform, with intelligent assistants and a pluggable marketplace for instant extensibility.

---

## 🚀 What is Nexus OS?
Nexus OS is your all-in-one business workspace. It provides:
- **Department-based dashboards** for Sales, Finance, Operations, and more
- **AI-powered Assistants** for every department, ready to answer, suggest, and automate
- **Pulse Marketplace** for drop-in SaaS integrations and add-ons
- **Self-hosted, white-label ready** platform for full control and branding

Nexus is designed to be:
- **Modular**: Add, remove, or upgrade departments and features as your business grows
- **Extensible**: Integrate with 3rd party tools (HubSpot, QuickBooks, Microsoft 365, etc.)
- **AI-first**: Built-in agents provide insights, automate tasks, and connect workflows
- **Scalable**: Multi-tenant, secure, and ready for teams of any size

---

## ✨ Features
- **Unified Dashboard**: See all your business metrics and workflows in one place
- **Department Modules**: Feature-sliced dashboards for Sales, Finance, Operations, and more
- **AI Assistants**: Context-aware chat panels and task routing for every department
- **Pulse Marketplace**: Instantly add new SaaS tools and integrations
- **Realtime Core**: WebSocket event bus for live metrics, sync, and notifications
- **Automation Fabric**: Trigger actions and workflows directly from AI output
- **Security & Multi-Tenant**: RBAC, tenant isolation, and secure credential vault
- **Modern UI/UX**: Responsive, accessible, and themeable (dark mode, shadcn/ui, Tailwind)

---

## 🏗️ Architecture & Tech Stack
| Layer                       | What it does                                                                                                                        | Tech choices                                         |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **UI Shell**                | Responsive React front-end with sidebar, dark-mode, shadcn/ui components.                                                           | React 19 + TypeScript + Vite + Tailwind              |
| **Domain Modules**          | Feature-sliced dashboards for **Sales**, **Finance**, **Operations**, plus **Pulse** (marketplace / add-ons).                       | DDD folder structure; lazy-loaded routes             |
| **AI Assistants**           | Context-aware agents (chat panel, task routing) that leverage OpenRouter/GPT models, vector search, and n8n for workflow execution. | Node/Express endpoints, Supabase & Qdrant for memory |
| **Realtime Core**           | WebSocket event bus for metrics streaming, workflow sync, toast notifications.                                                      | Custom WS provider, Zustand stores                   |
| **Automation Fabric**       | n8n subflows trigger actions (e.g., create invoice, post blog) directly from agent output.                                          | n8n + custom tool routers                            |
| **Security & Multi-Tenant** | RBAC guards, tenant isolation, AES-256-GCM credential vault.                                                                        | Prisma, Authentik, Zod validation                    |
| **Dev-XP**                  | ESLint 9 flat config, Jest/Playwright tests, Storybook, Husky pre-commit compliance checks.                                         | PNPM mono-repo ready                                 |

---

## 🛠️ Getting Started
1. **Clone the repo:**
   ```bash
   git clone https://github.com/your-org/nexus.git
   cd nexus
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Run the app:**
   ```bash
   npm run dev
   ```
4. **Open in your browser:**
   Visit [http://localhost:5173](http://localhost:5173)

---

## 🧩 Design Principles
- **Clean, professional, mobile-friendly**
- **Modular**—easy to add new departments, agents, and features
- **White-label ready** (replace branding for resellers)
- **Fast to demo** for clients and stakeholders
- **Accessible** and themeable (dark mode, responsive)

---

## 💡 Why Nexus?
- **Single Source of Truth** – All key data and workflows in one pane
- **AI on Tap** – Each department gets a purpose-built assistant
- **Pluggable Marketplace** – Drop-in integrations and add-ons
- **Self-Hosted & Brandable** – Full control, white-label potential
- **Scales with You** – Feature-sliced codebase, multi-tenant by design

---

Nexus is the backbone unifying Marcoby's three pillars—**Pulse** (products), **Catalyst** (managed services), and **Nexus** (the OS itself)—into a generational, AI-first business platform.
