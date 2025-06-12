# Nexus – Immediate Goals (June 2025)

> This file captures the production-readiness gaps identified on 2025-06-12.  It is the single source of truth until every task is checked off.  When a task is complete, strike it through and link the PR that closed it.

## Pillar 1 – Core Value Prop
- [ ] Implement `supervisorAgent` intent parsing + routing.
- [ ] Add specialist domain agents (Sales, Finance, Ops, Support).
- [ ] Ship executable **Action Card** system:
  - [ ] DB table `ai_action_cards` & `ai_action_card_events`.
  - [ ] FE component & modal.
  - [ ] Edge Function to execute mutations.

## Pillar 2 – Minimum Lovable Feature Set
- [ ] Unified inbox UI with streamed tokens (<2 s latency).
- [ ] Live KPI fetch via `get_business_health_score()` (replace stub).
- [ ] CRM update (HubSpot) endpoint from chat.
- [ ] Stripe invoice send flow.
- [ ] Automation Recipe engine with 5 starter templates.
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
- [ ] Badge UI: "AI Suggestion" vs "Auto-Executed".
- [ ] Sub-2-second chat token streaming.

## Pillar 6 – Reliability & Trust
- [ ] Add `ai_audit_logs` table + triggers.
- [ ] CI `rls-test` – cross-tenant isolation check.
- [ ] Health probes & uptime monitoring.
- [ ] Retire Prisma: migrate remaining services to `@supabase/supabase-js`, delete `prisma/` folder & dependencies.

## Pillar 7 – Self-Serve Growth Loop
- [ ] "Share Automation" → template marketplace MVP.
- [ ] Referral credit system (2 free seats for 90-day conversion).

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

## Right-From-Day-One Checklist
- [ ] First-run tour shows live KPI.
- [ ] Action Card changes real data within 60 s.
- [ ] Stripe webhook → queue → chat status update.
- [ ] Log entry per agent action in `ai_audit_logs`.
- [ ] Jest coverage ≥ 85 %.
- [ ] Cypress smoke spec for login / chat / action.
- [ ] Landing page headline focused on outcome.
- [ ] Pricing page payback copy.

---
**Next review:** Commit progress every Friday; update this file in the same PR. 