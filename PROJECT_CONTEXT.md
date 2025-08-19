# Nexus OS — Project Context for Cursor

> **TL;DR:** Nexus OS is a self-hosted, modular business operating system with department-based dashboards, AI assistants, and a Pulse marketplace for instant add-ons. Built as a "Tool as a Skill-Bridge" that enables entrepreneurs to execute their vision without mastering every domain.

---

## 🎯 Core Philosophy: "Tool as a Skill-Bridge"

Nexus transforms from a reporting tool into a **business command center** where users don't just see their business - they can run it. The platform serves as a "skill-bridge" that enables entrepreneurs to execute their vision without mastering every domain.

### The Complete Action Loop
```
Insight → Next Best Action → Execution → Journaled Learning → Sharper Insight
   ↓           ↓              ↓              ↓                ↓
"Revenue    "Send follow-   Automated    "This worked    "Optimize for
dropped"    up emails"      execution    → +$15K"        next quarter"
```

*See `/docs/current/IMPLEMENTATION_PHILOSOPHY.md` for technical mapping of these principles into the architecture.*

### Key Principles:
1. **Clarity First** - Every feature makes it obvious what to do next
2. **Delegation by Design** - Easily hand off tasks to team members or AI agents
3. **Role-Centric Structure** - See business through clear functional units
4. **Integrated Intelligence** - All tools in one hub for context switching
5. **Immediate Value** - 10-minute onboarding with real insights and actionable recommendations

---

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

---

## 🏗️ Technology Stack

**Frontend:**
- React + TypeScript
- Tailwind CSS for styling
- shadcn/ui for modern, accessible components
- React Router for navigation

**Architecture:**
- Domain-driven design (each business domain gets its own directory)
- Modular file structure: `/departments`, `/components`, `/pages`, `/hooks`, `/services`
- Shared components in `src/shared/`

---

## 📁 Codebase Structure

The Nexus codebase is organized by **domain**. Each top-level directory in `src/` represents a business domain (e.g., `ai/`, `analytics/`, `user/`, `workspace/`, etc.).

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
- **How:** All business logic, UI, and features are grouped by domain. Shared code is centralized.
- **Result:** Faster onboarding, easier refactoring, and clear ownership of code.

---

## 🎯 MVP Goals (Current Focus)

### **Week-1 Roadmap**
- [x] Shell, navigation, dark-mode
- [x] Dummy chat interface
- [x] Basic dashboard structure

### **Week-2 Roadmap**
- [ ] Real chat → OpenRouter integration
- [ ] Basic memory system
- [ ] Pulse JSON feed
- [ ] Tests ≥ 80% coverage

### **Week-3 Roadmap**
- [ ] Authentication system
- [ ] Basic RBAC
- [ ] Live metrics over WebSocket
- [ ] First Pulse checkout flow

---

## 🚫 Out of Scope (MVP)

### **Backend & Integrations**
- Full API integrations (focus on UI/UX first)
- Complex backend services
- Advanced analytics and reporting
- Multi-tenant architecture

### **Advanced Features**
- Advanced RBAC beyond basic user/role management
- Complex workflow automation
- Advanced AI agent orchestration
- Enterprise SSO integration

### **Infrastructure**
- Production deployment automation
- Advanced monitoring and alerting
- Performance optimization
- Scalability features

---

## 🚀 Developer Quickstart

### Setup
```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

### Development Commands
```bash
# Lint code
pnpm lint

# Run tests
pnpm test

# Type checking
pnpm type-check

# Storybook (UI components)
pnpm storybook
```

### Environment Setup
```bash
# Copy environment template
cp env.example .env

# Configure your environment variables
# See env.example for required variables
```

---

## 🎯 Why Nexus Matters

1. **Single Source of Truth** – All key data and workflows live in one pane.
2. **AI on Tap** – Each department gets a purpose-built assistant that can answer, suggest, or execute.
3. **Pluggable Marketplace (Pulse)** – Drop-in integrations and add-ons you can upsell.
4. **Self-Hosted & Brandable** – Runs on your infrastructure; white-label potential.
5. **Scales with You** – Feature-sliced codebase, multi-tenant by design, automated tests/CI.

---

## 🔗 Strategic Context

Nexus is the spine unifying Marcoby's three pillars:
- **Pulse** (products) - Marketplace and integrations
- **Catalyst** (managed services) - Professional services
- **Nexus** (the OS itself) - The business operating system

---

## 📚 Documentation

- **Complete Documentation**: `/docs/` directory
- **Implementation Philosophy**: `/docs/current/IMPLEMENTATION_PHILOSOPHY.md`
- **Architecture Overview**: `/docs/architecture/NEXUS_COMPLETE_OPERATING_SYSTEM.md`
- **Development Guide**: `/docs/current/development/DEVELOPMENT.md`

---

## 🚀 Coming Soon

### OneDrive & SharePoint File Interface
- **Description:** Users will be able to connect their own Microsoft accounts to browse, download, and (optionally) manage files from both OneDrive and SharePoint directly within Nexus.
- **Authentication:** Per-user Microsoft OAuth (Microsoft Identity Platform). Tokens stored securely in backend.
- **Features (MVP):**
  - Connect/disconnect Microsoft account
  - Browse files/folders (OneDrive & SharePoint)
  - Download files with progress indicators
  - Basic file management (rename, move, delete)
  - Role-based permissions and advanced sharing options
- **Status:** Planned, not yet implemented
- **Notes:** Requires Azure App Registration and Microsoft Graph API integration. Will use shadcn/ui and Tailwind for frontend, with secure backend proxy for file operations.

---

*This document serves as the primary context for developers working on Nexus OS. For detailed feature and API documentation, see the `/docs` directory.*
