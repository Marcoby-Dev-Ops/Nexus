# Nexus MVP Build Plan

**Date:** January 2026
**Purpose:** Strip the bloated codebase down to a focused MVP
**Branch:** `claude/codebase-analysis-1xBuf`

---

## Executive Summary

Nexus started as an ambitious AI-powered business operating system but grew bloated through AI-assisted development. This document outlines the plan to rebuild it as a focused MVP around one core insight:

> **"I want to talk to an AI about my business, but the AI doesn't know anything about my business."**

---

## Table of Contents

1. [The Problem & Solution](#1-the-problem--solution)
2. [Current Codebase State](#2-current-codebase-state)
3. [MVP Definition](#3-mvp-definition)
4. [What to Keep vs Delete](#4-what-to-keep-vs-delete)
5. [Technical Architecture](#5-technical-architecture)
6. [Database Schema](#6-database-schema)
7. [AI Function Calling Design](#7-ai-function-calling-design)
8. [Build Sequence](#8-build-sequence)
9. [File Structure (Target)](#9-file-structure-target)

---

## 1. The Problem & Solution

### Origin Story
The founder was using ChatGPT's advanced voice mode for brainstorming business ideas. The limitation: the AI had no access to actual business data. Every conversation required manually copying data, downloading screenshots, and explaining context.

### Core Value Proposition
**An AI that already knows your business, so you can just talk to it.**

### Framework: See → Think → Act
| Stage | Description | MVP Implementation |
|-------|-------------|-------------------|
| **SEE** | Understand what's happening in your business | AI fetches and explains your data when asked |
| **THINK** | Reason about what to do | AI analyzes patterns and suggests actions |
| **ACT** | Execute decisions | AI provides clear next steps (manual execution in Phase 1) |

---

## 2. Current Codebase State

### Overall Metrics
| Metric | Value |
|--------|-------|
| Total Files | 1,260+ TypeScript/JavaScript |
| Frontend Components | 123 page components |
| Backend Endpoints | 101+ across 21 route modules |
| Database Migrations | 35 files |
| Test Coverage | ~1.6% (18 test files) |
| Security Vulnerabilities | 38 (per GitHub Dependabot) |

### Directory Structure
```
/Nexus
├── /client                    # React frontend (Vite + TypeScript)
│   ├── /src
│   │   ├── /components       # 36 domain folders (BLOATED)
│   │   ├── /pages            # 123 page components (BLOATED)
│   │   ├── /services         # API services + ServiceRegistry
│   │   ├── /core             # Auth, integrations, AI
│   │   ├── /shared           # Reusable components
│   │   └── /stores           # Zustand stores
│   └── package.json
│
├── /server                    # Node.js backend (Express)
│   ├── /routes               # 21 route modules
│   ├── /services             # Business logic
│   ├── /migrations           # 35 SQL migration files
│   ├── /integrations         # n8n workflows
│   └── server.js             # Entry point
│
├── /docs                      # 50+ documentation files
├── /config                    # Docker, Postgres configs
└── docker-compose.yml
```

### What's Working (Keep)
| Component | Status | Location |
|-----------|--------|----------|
| Authentik Auth | ✅ Solid | `/server/routes/oauth.js`, `/client/src/core/auth/` |
| PostgreSQL + pgvector | ✅ Solid | `/server/migrations/`, `/config/postgres/` |
| OAuth Flows | ✅ Exists | `/server/routes/oauth.js` |
| OpenAI Service | ✅ Basic | `/server/routes/chat.js`, `/client/src/lib/ai/` |
| React + Vite | ✅ Solid | `/client/vite.config.ts` |
| Docker Setup | ✅ Solid | `/docker-compose.yml` |
| Rate Limiting | ✅ Solid | `/server/src/middleware/rateLimit.js` |
| Logger Utility | ✅ Exists | `/server/src/utils/logger.js` |

### What's Broken/Problematic
| Issue | Severity | Detail |
|-------|----------|--------|
| 1.6% test coverage | Critical | 18 tests for 1,260+ files |
| CI/CD disabled | Critical | Import checks commented out in workflows |
| 78+ console.log | Medium | Should use logger utility |
| Mixed JS/TS backend | Medium | No clear migration strategy |
| Feature bloat | High | 30+ half-finished modules |
| 38 vulnerabilities | High | npm dependencies need updating |

### Existing OAuth Providers (Already Configured)
```javascript
// From /server/routes/oauth.js
{
  authentik: { ... },      // ✅ Primary auth
  google: { ... },         // ✅ Google Analytics
  google_analytics: { ... }, // ✅ Analytics specific
  hubspot: { ... },        // ✅ CRM/Deals
  paypal: { ... },         // ✅ Payments (alternative to Stripe)
  microsoft: { ... },      // ✅ Microsoft 365
  slack: { ... },          // ✅ Team communication
  'google-workspace': { ... } // ✅ Gmail/Calendar/Drive
}
```

**Missing:** Stripe (recommended to add), QuickBooks

---

## 3. MVP Definition

### What MVP Does
1. **Connect 2-3 data sources** via OAuth
   - Stripe or PayPal (revenue/payments)
   - HubSpot (deals/contacts)
   - Google Analytics (traffic)

2. **AI chat that queries real data**
   - "How's my revenue this month?"
   - "What deals are stuck in my pipeline?"
   - "Which marketing channel is working?"

3. **AI suggests clear actions**
   - "Consider following up with Acme Corp - no contact in 18 days"
   - "Your conversion rate dropped - here's why"
   - User executes manually (no automation yet)

### What MVP Does NOT Include
| Feature | Why Not |
|---------|---------|
| Complex dashboards | AI is the interface |
| Workflow automation | Phase 2 |
| Multi-user / teams | Start single-user |
| 15 integrations | Start with 2-3 |
| Department modules | Over-engineered |
| Journey mapping | Not core |
| Maturity assessments | Not core |
| Marketplace | Way too early |
| Mobile app | Web first |

### User Experience (Simple)
```
1. Sign up (via Authentik)
2. Connect 2-3 data sources (OAuth)
3. Wait for initial sync (~30 seconds)
4. Start talking to AI about your business
```

---

## 4. What to Keep vs Delete

### Server (Mostly Keep)
```
/server
├── server.js                    # KEEP - entry point
├── /src
│   ├── /middleware
│   │   ├── errorHandler.js      # KEEP
│   │   ├── rateLimit.js         # KEEP
│   │   └── auth.js              # KEEP (if exists)
│   ├── /utils
│   │   └── logger.js            # KEEP
│   ├── /database
│   │   └── migrate.js           # KEEP
│   └── /routes
│       ├── db.js                # KEEP
│       ├── chat.js              # KEEP + ENHANCE
│       ├── me.js                # KEEP
│       └── ...                  # REVIEW EACH
├── /routes
│   ├── oauth.js                 # KEEP + ADD STRIPE
│   ├── ai-gateway.js            # KEEP
│   └── ...                      # REVIEW EACH
├── /migrations                  # KEEP ALL
└── /services                    # REVIEW - keep core services
```

### Client (Major Cleanup)

#### DELETE (Archive to /archive)
```
/client/src/pages/
├── admin/                    # DELETE - over-engineered
├── analytics/                # DELETE - AI replaces this
├── automation/               # DELETE - Phase 2
├── business/                 # DELETE - over-engineered
├── departments/              # DELETE - over-engineered
├── entrepreneur/             # DELETE - unclear purpose
├── experience/               # DELETE
├── fire-cycle/               # DELETE
├── hype/                     # DELETE
├── identity/                 # DELETE - over-engineered
├── journey/                  # DELETE
├── knowledge/                # DELETE - Phase 2
├── marketplace/              # DELETE
├── maturity/                 # DELETE
├── mobile/                   # DELETE
├── onboarding/               # SIMPLIFY drastically
└── organization/             # DELETE

/client/src/components/
├── admin/                    # DELETE
├── analytics/                # DELETE
├── automation/               # DELETE
├── brain/                    # DELETE
├── business/                 # DELETE
├── departments/              # DELETE
├── entrepreneur/             # DELETE
├── execution/                # DELETE
├── experience/               # DELETE
├── fire-cycle/               # DELETE
├── help-center/              # DELETE
├── hype/                     # DELETE
├── identity/                 # DELETE
├── journey/                  # DELETE
├── knowledge/                # DELETE
├── marketplace/              # DELETE
├── maturity/                 # DELETE
├── mobile/                   # DELETE
├── onboarding/               # SIMPLIFY
└── organization/             # DELETE
```

#### KEEP
```
/client/src/
├── /core
│   ├── /auth/                # KEEP - Authentik integration
│   └── /integrations/        # KEEP - OAuth connector base
├── /components
│   ├── /ui/                  # KEEP - base UI components
│   ├── /chat/                # KEEP + ENHANCE
│   └── /integrations/        # KEEP - connection UI
├── /shared
│   ├── /components/ui/       # KEEP
│   └── /hooks/               # KEEP useful ones
├── /stores
│   └── useAuthStore.ts       # KEEP
├── /services
│   └── ApiManager.ts         # KEEP
├── App.tsx                   # SIMPLIFY
└── main.tsx                  # KEEP
```

#### BUILD NEW
```
/client/src/
├── /pages
│   ├── Dashboard.tsx         # NEW - just chat + integration status
│   ├── Integrations.tsx      # NEW - connect accounts
│   └── Settings.tsx          # NEW - minimal settings
├── /components
│   ├── Chat.tsx              # NEW - main chat interface
│   ├── Message.tsx           # NEW - message bubble
│   ├── ActionCard.tsx        # NEW - suggested action display
│   └── IntegrationCard.tsx   # NEW - connection status
└── /hooks
    ├── useChat.ts            # NEW - chat state
    └── useIntegrations.ts    # NEW - integration state
```

---

## 5. Technical Architecture

### System Overview
```
┌─────────────────────────────────────────────────────────────────┐
│                      CHAT INTERFACE                              │
│                  (React + TypeScript)                            │
└─────────────────────────────────────────────────────────────────┘
                            │
                    POST /api/chat/message
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AI BRAIN                                    │
│              (OpenAI with Function Calling)                      │
│                                                                  │
│   User asks question                                             │
│         ↓                                                        │
│   AI decides what data it needs                                  │
│         ↓                                                        │
│   Calls function (get_revenue, get_deals, etc.)                 │
│         ↓                                                        │
│   Receives data from database                                    │
│         ↓                                                        │
│   Formulates response with insights + actions                    │
└─────────────────────────────────────────────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │  Stripe  │ │  HubSpot │ │ Analytics│
        │ (money)  │ │ (deals)  │ │ (traffic)│
        └──────────┘ └──────────┘ └──────────┘
              │             │             │
              └─────────────┼─────────────┘
                            ▼
                    ┌──────────────┐
                    │  PostgreSQL  │
                    │  + pgvector  │
                    └──────────────┘
```

### Data Flow
```
1. User connects Stripe via OAuth
2. Background job syncs last 30 days of transactions
3. Data stored in business_metrics table
4. User asks: "How's revenue this month?"
5. AI calls get_revenue_metrics function
6. Function queries business_metrics table
7. AI receives: [{date, amount, customer}, ...]
8. AI responds: "You made $14,200 from 23 transactions..."
9. AI suggests: "Your top customer hasn't ordered in 3 weeks"
```

---

## 6. Database Schema

### Core Tables (MVP)
```sql
-- Users (simplified from existing)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    authentik_id TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Integration connections
CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'stripe' | 'hubspot' | 'analytics' | 'paypal'
    credentials JSONB NOT NULL, -- encrypted OAuth tokens
    last_sync TIMESTAMPTZ,
    sync_status TEXT DEFAULT 'pending', -- 'pending' | 'syncing' | 'synced' | 'error'
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, type)
);

-- Unified metrics from all integrations
CREATE TABLE business_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    source TEXT NOT NULL, -- which integration
    metric_type TEXT NOT NULL, -- 'revenue' | 'deal' | 'traffic' | 'contact'
    value NUMERIC,
    timestamp TIMESTAMPTZ NOT NULL,
    metadata JSONB, -- flexible for source-specific data
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_metrics_user_time ON business_metrics(user_id, timestamp DESC);
CREATE INDEX idx_metrics_type ON business_metrics(user_id, metric_type);
CREATE INDEX idx_metrics_source ON business_metrics(user_id, source);

-- Chat conversations
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT, -- auto-generated from first message
    messages JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_user ON conversations(user_id, updated_at DESC);

-- Semantic search (using existing pgvector)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(1536), -- OpenAI ada-002
    source_type TEXT, -- 'metric' | 'conversation' | 'note'
    source_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_embeddings_vector ON embeddings
    USING ivfflat (embedding vector_cosine_ops);
```

### Migration Strategy
- Keep existing migrations as-is
- Add new MVP tables via new migration file
- Don't modify existing tables yet

---

## 7. AI Function Calling Design

### System Prompt
```
You are a business intelligence assistant with access to real-time business data.

Your job:
1. Answer questions using actual numbers from the user's connected systems
2. Identify patterns, trends, and anomalies
3. Suggest 2-3 concrete, actionable next steps

Guidelines:
- Always cite the time range and data source
- Be conversational but data-driven
- When suggesting actions, be specific (names, amounts, dates)
- If data is missing or incomplete, say so clearly
```

### Available Functions
```javascript
const FUNCTIONS = [
  {
    name: 'get_revenue_metrics',
    description: 'Get revenue/payment data from Stripe or PayPal',
    parameters: {
      type: 'object',
      properties: {
        start_date: { type: 'string', description: 'ISO date (YYYY-MM-DD)' },
        end_date: { type: 'string', description: 'ISO date (YYYY-MM-DD)' },
        granularity: { type: 'string', enum: ['day', 'week', 'month'] }
      },
      required: ['start_date', 'end_date']
    }
  },
  {
    name: 'get_deal_pipeline',
    description: 'Get sales deals/opportunities from HubSpot',
    parameters: {
      type: 'object',
      properties: {
        stage: { type: 'string', description: 'Filter by deal stage' },
        min_value: { type: 'number', description: 'Minimum deal value' },
        stale_days: { type: 'number', description: 'Deals with no activity in N days' }
      }
    }
  },
  {
    name: 'get_contacts',
    description: 'Get contacts/customers from HubSpot',
    parameters: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['customer', 'lead', 'all'] },
        limit: { type: 'number', description: 'Max results to return' }
      }
    }
  },
  {
    name: 'get_traffic_data',
    description: 'Get website traffic from Google Analytics',
    parameters: {
      type: 'object',
      properties: {
        start_date: { type: 'string' },
        end_date: { type: 'string' },
        metrics: {
          type: 'array',
          items: { type: 'string', enum: ['sessions', 'users', 'pageviews', 'bounce_rate'] }
        },
        dimensions: {
          type: 'array',
          items: { type: 'string', enum: ['source', 'medium', 'page', 'country'] }
        }
      },
      required: ['start_date', 'end_date']
    }
  },
  {
    name: 'compare_periods',
    description: 'Compare metrics between two time periods',
    parameters: {
      type: 'object',
      properties: {
        metric_type: { type: 'string', enum: ['revenue', 'deals', 'traffic'] },
        period1_start: { type: 'string' },
        period1_end: { type: 'string' },
        period2_start: { type: 'string' },
        period2_end: { type: 'string' }
      },
      required: ['metric_type', 'period1_start', 'period1_end', 'period2_start', 'period2_end']
    }
  },
  {
    name: 'semantic_search',
    description: 'Search across all business data using natural language',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Natural language search query' },
        sources: {
          type: 'array',
          items: { type: 'string', enum: ['metrics', 'conversations', 'all'] }
        }
      },
      required: ['query']
    }
  }
];
```

### Example Conversation Flow
```
User: "How's my business doing?"

AI thinks: I should get an overview. Let me check revenue and deals.

AI calls: get_revenue_metrics({
  start_date: "2026-01-01",
  end_date: "2026-01-28",
  granularity: "week"
})

AI calls: get_deal_pipeline({})

AI receives:
- Revenue: $47,200 across 4 weeks
- 12 open deals worth $85,000 total
- 3 deals stale > 14 days

AI responds:
"Here's your January snapshot:

**Revenue:** $47,200 so far this month
- Week 1: $12,100
- Week 2: $14,300
- Week 3: $11,200
- Week 4 (partial): $9,600

You're on track for ~$52K if the pace holds.

**Pipeline:** 12 open deals worth $85,000
- 3 deals haven't had activity in 2+ weeks

**Suggested actions:**
1. Follow up on the 3 stale deals - that's $23K at risk
2. Week 3 dipped 22% - worth investigating why
3. You're 2 deals away from your best month ever"
```

---

## 8. Build Sequence

### Week 1: Foundation
| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | Archive bloated client code | Clean `/archive` folder |
| 2 | Add Stripe OAuth config | Working OAuth flow |
| 3 | Build Stripe sync service | Data in `business_metrics` |
| 4 | Create MVP database migration | New tables ready |
| 5 | Basic chat endpoint (no function calling) | Echo responses working |

### Week 2: AI Brain
| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | Implement function calling | AI can call functions |
| 2 | Build `get_revenue_metrics` | Revenue queries work |
| 3 | Build `get_deal_pipeline` | Deal queries work |
| 4 | Add HubSpot OAuth + sync | Second integration |
| 5 | Test full conversation flow | End-to-end working |

### Week 3: UI + Polish
| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | Build Chat.tsx component | Basic chat UI |
| 2 | Build Message + ActionCard | Rich responses |
| 3 | Build Integrations page | Connection management |
| 4 | Add Google Analytics | Third integration |
| 5 | Edge cases + error handling | Production ready |

### Post-MVP (Phase 2)
- One-click actions (send email, create task)
- Proactive insights (AI messages you)
- Voice interface
- More integrations
- Team features

---

## 9. File Structure (Target)

### After Cleanup
```
/nexus
├── /client
│   ├── /src
│   │   ├── /components
│   │   │   ├── /ui              # Base components (Button, Input, etc.)
│   │   │   ├── Chat.tsx         # Main chat interface
│   │   │   ├── Message.tsx      # Chat message bubble
│   │   │   ├── ActionCard.tsx   # Suggested action card
│   │   │   └── IntegrationCard.tsx
│   │   ├── /pages
│   │   │   ├── Dashboard.tsx    # Chat + status (main page)
│   │   │   ├── Integrations.tsx # Connect accounts
│   │   │   ├── Settings.tsx     # User settings
│   │   │   └── Login.tsx        # Auth page
│   │   ├── /core
│   │   │   └── /auth            # Authentik (keep existing)
│   │   ├── /hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useChat.ts
│   │   │   └── useIntegrations.ts
│   │   ├── /services
│   │   │   └── api.ts           # API client
│   │   ├── /stores
│   │   │   └── authStore.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.ts
│
├── /server
│   ├── server.js                # Entry point
│   ├── /src
│   │   ├── /routes
│   │   │   ├── chat.js          # Chat endpoint
│   │   │   ├── integrations.js  # OAuth + sync
│   │   │   └── me.js            # User profile
│   │   ├── /services
│   │   │   ├── openai.js        # Function calling logic
│   │   │   ├── stripe.js        # Stripe API wrapper
│   │   │   ├── hubspot.js       # HubSpot API wrapper
│   │   │   ├── analytics.js     # GA API wrapper
│   │   │   └── sync.js          # Background sync jobs
│   │   ├── /database
│   │   │   ├── migrate.js
│   │   │   └── queries.js       # SQL query builders
│   │   ├── /middleware
│   │   │   ├── auth.js
│   │   │   ├── rateLimit.js
│   │   │   └── errorHandler.js
│   │   └── /utils
│   │       └── logger.js
│   ├── /routes
│   │   └── oauth.js             # OAuth configs
│   ├── /migrations
│   │   └── xxx_mvp_tables.sql
│   └── package.json
│
├── /archive                      # Old bloated code (keep for reference)
│   ├── /client-pages
│   └── /client-components
│
├── /docs
│   ├── MVP_BUILD_PLAN.md        # This document
│   └── CODEBASE_ANALYSIS_REPORT.md
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Environment Variables

```bash
# .env.example

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/nexus

# Auth (Authentik)
AUTHENTIK_CLIENT_ID=
AUTHENTIK_CLIENT_SECRET=
AUTHENTIK_DOMAIN=https://identity.marcoby.com

# AI
OPENAI_API_KEY=sk-...

# Integrations
STRIPE_CLIENT_ID=
STRIPE_CLIENT_SECRET=

HUBSPOT_CLIENT_ID=
HUBSPOT_CLIENT_SECRET=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# App
SESSION_SECRET=
NODE_ENV=development
PORT=3001
```

---

## Success Metrics

### MVP Launch Criteria
- [ ] User can sign up via Authentik
- [ ] User can connect at least 1 integration
- [ ] Data syncs successfully
- [ ] User can ask questions and get data-driven answers
- [ ] AI suggests relevant actions
- [ ] No critical errors in happy path

### Post-Launch Metrics
- Time to first insight (< 5 minutes from signup)
- Questions answered per session
- Action suggestions clicked/copied
- Return usage (daily/weekly active)

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| OAuth complexity | Start with Stripe only, add others incrementally |
| Token refresh failures | Implement robust refresh logic with alerts |
| API rate limits | Queue requests, cache aggressively |
| AI hallucinations | Always show source data alongside AI response |
| Empty data state | Clear messaging + sample data option |

---

## Next Steps

1. **Get buy-in on this plan** - Review and adjust as needed
2. **Start Week 1** - Archive bloat, add Stripe OAuth
3. **Daily check-ins** - Track progress against build sequence
4. **Ship MVP** - Target: 3 weeks from start

---

*Document created: January 2026*
*Last updated: January 2026*
