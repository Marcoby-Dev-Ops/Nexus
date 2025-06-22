# Nexus – Immediate Goals (June 2025)

> This file captures the production-readiness gaps identified on 2025-06-12.  It is the single source of truth until every task is checked off.  When a task is complete, strike it through and link the PR that closed it.

## Pillar 1 – Core Value Prop

- [ ] Implement `supervisorAgent` intent parsing + routing.
- [ ] Add specialist domain agents (Sales, Finance, Ops, Support).
- [x] ~~Ship executable **Action Card** system:~~
  - [x] ~~DB table `ai_action_cards` & `ai_action_card_events`.~~
  - [x] ~~FE component & modal.~~
  - [x] ~~Edge Function to execute mutations.~~

Chat v2 (Claude-style UX)

- [x] ~~Streaming composer with markdown preview & code-block copy.~~ (PR 2 – Chat v2)
- [ ] Context chips with "explain source" drawer.
- [x] ~~Slash-command autocomplete for Action Cards (`/create-task`, ...)~~.

## Pillar 2 – Minimum Lovable Feature Set

- [ ] Unified inbox UI with streamed tokens (<2 s latency).
- [x] ~~Finance dashboard wired to live PayPal KPIs~~ (PR #??)
- [ ] Live KPI fetch via `get_business_health_score()` (replace stub) – _broader metric still pending_
- [ ] CRM update (HubSpot) endpoint from chat.
- [ ] Stripe invoice send flow.
- [ ] Automation Recipe engine with 5 starter templates.
- [ ] Workspace storage connectors (OneDrive, Google Drive, Dropbox) with OAuth & sync badge.
- [x] ~~Settings pages scaffold – `/settings/profile`, `/settings/security`, `/settings/integrations`~~ (PR #??)  
  - ~~Passkey registration flow still **In Progress** on Security page~~
- [ ] Automation Recipes page (rename AI Hub) with top 5 templates & empty-state prompt.
- [ ] One-click PDF / Email weekly health report.

## Pillar 3 – 10-min Onboarding

- [ ] QuickBooks OAuth + sync.
- [ ] Sample data seeding + templated goals.
- [ ] Guided "first action" tour.

## Pillar 4 – Pricing & Packaging

- [ ] Pricing page UI with ROI copy.
- [ ] Seat & plan enforcement in backend middleware.
- [ ] Growth-tier entitlements (roles, premium GPT, webhooks).

## Pillar 5 – Brand & UX

- [ ] Sidebar → department navigation polish.
- [x] ~~Badge UI: "AI Suggestion" vs "Auto-Executed".~~
- [x] ~~Sub-2-second chat token streaming.~~ (Chat v2 live)
- [ ] Route table driven navigation & Breadcrumbs (remove dead links).
- [ ] Data Warehouse theme refactor (remove hard-coded Tailwind colors).
- [ ] Merge Analytics into Data Warehouse nav group.
- [x] ~~Feature flag Pulse Marketplace until ≥3 templates.~~

## Pillar 6 – Reliability & Trust

- [x] ~~Add `ai_audit_logs` table + triggers.~~
- [x] ~~CI `rls-test` – cross-tenant isolation check.~~  
    _Completed via MCP tools – see [AI chat log](#) for details._
- [x] ~~Health probes & uptime monitoring (`/healthz` route).~~  
    _Edge Function deployed via MCP tools – see [AI chat log](#) for details._
- [ ] Retire Prisma: migrate remaining services to `@supabase/supabase-js`, delete `prisma/` folder & dependencies.

## Pillar 7 – Self-Serve Growth Loop

- [ ] "Share Automation" → template marketplace MVP.
- [ ] Referral credit system (2 free seats for 90-day conversion).
- [ ] Integration learning engine (upload OpenAPI or URL → generate `service.ts` + DB blueprint).

## Pillar 8 – Metrics Instrumentation

- [ ] Track **time-to-first-action**, **actions / org / week**, **active seats / org**, **churn cohorts**.
- [ ] Surface metrics in admin analytics dashboard.

## Pillar 9 – Cost Discipline

- [x] ~~Downgrade default embeddings to `text-embedding-3-small` (1536 dims, chunk 500/50).~~
- [x] ~~Default model to `o3-mini-high`; escalate to `o3` only for final responses.~~
- [x] ~~Add embedding cache to avoid duplicate calls.~~

## Pillar 10 – Support & Success

- [ ] Intercom/Crisp in-app chat with 24 h SLA.
- [ ] Public roadmap & changelog pages.
- [ ] Quarterly "AI Strategy" webinar signup flow.

## Next-Up Roadmap (Top 5 | target lock-in by 2025-06-20)

1. ✅ **COMPLETED** Passkey registration + authentication UI on `/settings/security` (Edge Functions wired)
2. ✅ **COMPLETED** Slash-command autocomplete for Action Cards in Chat v2 composer  
   • ✅ Created dedicated `SlashCommandMenu` component with keyboard navigation
   • ✅ Integrated with `StreamingComposer` for seamless UX
   • ✅ Added comprehensive test coverage (Jest + Cypress)
3. ▢ **[Paused]** Unified inbox (`/inbox`) – email sync currently blocked; revisit after base connectors are stable.
4. Flesh out `/settings/integrations` with additional OAuth flows (QuickBooks MVP) and sync badges.  
   • PayPal connector ✅ shipped – QuickBooks next
5. Deliver CRM (HubSpot) update & Stripe invoice send flows via Action Cards.

---

## Right-From-Day-One Checklist

- [ ] First-run tour shows live KPI.
- [ ] Action Card changes real data within 60 s.
- [ ] Stripe webhook → queue → chat status update.
- [ ] Log entry per agent action in `ai_audit_logs`.
- [ ] Jest coverage ≥ 85 %.
- [ ] Cypress smoke spec for login / chat / action.
- [ ] Landing page headline focused on outcome.
- [ ] Pricing page payback copy.

## Page Status (Snapshot – 2025-06-13)

| Page / Route | Status |
|--------------|--------|
| `/` (Chat v2) | **Fully Developed** – streaming composer, markdown preview, token streaming live |
| `/settings/profile` | **Fully Developed** – profile update form live |
| `/settings/security` | **Fully Developed** – passkey registration & authentication flows complete |
| `/settings/integrations` | **Fully Developed** – OAuth connectors list, PayPal live |
| `/settings` index & nav | **In Progress** |
| `/inbox` (Unified Inbox) | **Blocked** – email sync failing; placeholder data only (re-evaluate after July 1) |
| `/automation-recipes` (AI Hub rename) | **In Progress** – template list & empty-state pending |
| `/pricing` | **Missing** – needs copy & ROI section |
| `/healthz` | **Fully Developed** – uptime probes active |
| Landing pages (`/`, `/roadmap`, `/changelog`) | Core landing **Fully Developed**; roadmap/changelog **Missing** |

---

## Feature Status (Snapshot – 2025-06-13)

### Fully Developed

- Action Card execution system (DB, modal, Edge Function)
- Streaming chat composer with markdown preview & code-block copy
- Sub-2-second token streaming on Chat v2
- AI audit logs & RLS cross-tenant guard
- Health probes (`/healthz`) & uptime monitoring
- Embedding downgrade & cache (cost discipline)
- PayPal finance connector & live KPI ingestion
- **Passkey registration & authentication flows** (security settings) ✅
- **Slash-command autocomplete for Action Cards** with dedicated menu component ✅

### In Progress

- Context chips with "explain source" drawer (Chat v2)
- Unified inbox UI with streamed tokens
- Automation Recipes page & starter templates
- Settings route scaffolding (profile, security, integrations)
- Growth-tier entitlements (roles, premium GPT, webhooks)
- Referral credit system & marketplace sharing loop
- Metrics instrumentation (time-to-first-action, churn cohorts, etc.)

### Missing / Planned

- Live KPI fetch via `get_business_health_score()`
- CRM & Stripe action flows (invoice send, webhook queue update)
- QuickBooks, OneDrive/Drive/Dropbox OAuth connectors
- Guided first-run tour & sample data seeding
- Pricing & packaging enforcement middleware
- Intercom/Crisp in-app chat with SLA
- Public roadmap & changelog pages
- PDF/email weekly health report
- Integration learning engine (OpenAPI → `service.ts` generator)

---
**Next review:** Commit progress every Friday; update this file in the same PR. 