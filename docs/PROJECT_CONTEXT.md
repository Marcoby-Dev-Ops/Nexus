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

*See `/docs/IMPLEMENTATION_PHILOSOPHY.md` for technical mapping of these principles into the architecture.*

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

### Frontend
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development with strict mode
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality component library
- **Zustand** - Lightweight state management
- **React Query** - Server state management
- **React Router** - Client-side routing

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **PostgreSQL** - Primary database with pgvector
- **Authentik** - Enterprise identity provider
- **BullMQ** - Job queue system
- **n8n** - Workflow automation engine

### AI & Intelligence
- **OpenAI** - Large language models
- **pgvector** - Vector similarity search
- **Memory Service** - AI context management
- **EventBus** - Event-driven architecture
- **Agent Hierarchy** - Executive → Specialist → Tool agents

### Infrastructure
- **Docker** - Containerization
- **Coolify** - Self-hosted deployment platform
- **GitHub Actions** - CI/CD
- **Husky** - Git hooks
- **Nginx** - Reverse proxy

---

## 📁 Codebase Structure

Nexus follows a **client/server architecture** with domain-driven design. The frontend is organized by business domains, while the backend provides API services.

### Client Structure (`/client`)
```
client/
├── src/
│   ├── ai/                    # AI assistants and chat
│   ├── analytics/             # Data visualization and KPIs
│   ├── automation/            # Workflow management
│   ├── business/              # Company and business logic
│   ├── ckb/                   # Common Knowledge Base
│   ├── components/            # Shared UI components
│   ├── core/                  # Domain layer (VOs, aggregates)
│   ├── dashboard/             # Main dashboard views
│   ├── integrations/          # Third-party integrations
│   ├── marketplace/           # Pulse marketplace
│   ├── pages/                 # Page components by domain
│   ├── services/              # API services
│   ├── shared/                # Design system and utilities
│   └── types/                 # TypeScript definitions
├── public/                    # Static assets
├── scripts/                   # Development utilities
└── __tests__/                 # Test files
```

### Server Structure (`/server`)
```
server/
├── routes/                    # API endpoints
├── services/                  # Business logic
├── middleware/                # Express middleware
├── database/                  # Database configuration
├── migrations/                # Database migrations
└── utils/                     # Utility functions
```

### Active Domains (20+ domains)
| Domain | Purpose | Status |
|--------|---------|--------|
| **AI** | Chat UI, agent selector, AI memory | ✅ Active |
| **Analytics** | Metric dashboards, data visualization | ✅ Active |
| **Automation** | Workflow recipes & execution | ✅ Active |
| **Business** | Company profile, FIRE Cycle health | ✅ Active |
| **CKB** | Common Knowledge Base system | ✅ Active |
| **Dashboard** | Consolidated KPI overview | ✅ Active |
| **Integrations** | OAuth flows, webhook status | ✅ Active |
| **Marketplace** | Pulse marketplace and add-ons | ✅ Active |
| **Quantum** | Quantum onboarding flows | ✅ Active |
| **Building-Blocks** | Modular component system | ✅ Active |
| **Experience** | User experience frameworks | ✅ Active |
| **Maturity** | Business maturity assessment | ✅ Active |
| **Organizations** | Multi-tenant organization management | ✅ Active |
| **Tasks** | Task and project management | ✅ Active |
| **Settings** | System configuration | ✅ Active |
| **Auth** | Authentication and RBAC | ✅ Active |
| **Admin** | Administrative functions | ✅ Active |
| **API** | API documentation and testing | ✅ Active |

### Enabled Modules
```json
{
  "sales": true,
  "finance": true, 
  "operations": true,
  "marketplace": true,
  "ckb": true
}
```

---

## 🎯 Current Status (Q1 2025)

### **✅ Completed Features**
- **Full Authentication System** - Authentik integration with OAuth 2.0/OpenID Connect
- **AI Agent System** - 3-tier agent hierarchy with memory-backed context
- **Knowledge Vault** - Document upload, embedding, and semantic search
- **Real-time Dashboard** - Live KPIs and metrics with WebSocket updates
- **Integration Framework** - OAuth flows and webhook management
- **Marketplace System** - Pulse marketplace for add-ons and integrations
- **CKB System** - Common Knowledge Base for shared business knowledge
- **Quantum Onboarding** - Advanced onboarding flows
- **Building Blocks** - Modular component system
- **Multi-tenant Architecture** - Organization-based data isolation
- **RBAC System** - Role-based access control with RLS
- **Automation Engine** - n8n integration for workflow automation

### **🚧 In Progress**
- **Advanced Analytics** - Enhanced data visualization and reporting
- **Mobile Responsiveness** - Mobile-first design improvements
- **Performance Optimization** - Bundle optimization and caching
- **Advanced AI Features** - Enhanced agent capabilities

### **📋 Planned (Q2 2025)**
- **OneDrive/SharePoint Integration** - File management interface
- **Advanced Workflow Automation** - Complex business process automation
- **Enhanced Marketplace** - More Pulse integrations and add-ons
- **Mobile App** - Native mobile application

---

## 🚀 Developer Quickstart

### Prerequisites
- Node.js 20+
- pnpm 8+
- Docker (for local development)
- PostgreSQL (or use Docker)

### Setup
```bash
# Clone the repository
git clone https://github.com/Marcoby-Dev-Ops/Nexus.git
cd Nexus

# Install all dependencies (root + client + server)
pnpm install

# Start development servers
pnpm dev:full          # Start both frontend and backend
# OR run separately:
pnpm dev               # Frontend only (client)
pnpm dev:api           # Backend only (server)

# Local database setup (optional)
pnpm supabase start    # local PostgreSQL + Studio
```

### Development Commands
```bash
# Build for production
pnpm build             # Frontend
pnpm build:api         # Backend

# Testing
pnpm test              # Frontend tests
pnpm test:api          # Backend tests

# Code quality
pnpm lint              # Frontend linting
pnpm lint:api          # Backend linting

# Database
pnpm devtools migrate --up    # Run migrations
```

### Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Configure your environment variables
# See .env.example for required variables
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
- **Implementation Philosophy**: `/docs/IMPLEMENTATION_PHILOSOPHY.md`
- **Architecture Overview**: `/docs/architecture/NEXUS_COMPLETE_OPERATING_SYSTEM.md`
- **Development Guide**: `/docs/current/development/DEVELOPMENT.md`
- **Security Policy**: `/SECURITY.md`
- **Client Documentation**: `/client/README.md`

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
- **Status:** Planned for Q2 2025
- **Notes:** Requires Azure App Registration and Microsoft Graph API integration. Will use shadcn/ui and Tailwind for frontend, with secure backend proxy for file operations.

---

*This document serves as the primary context for developers working on Nexus OS. For detailed feature and API documentation, see the `/docs` directory.*
