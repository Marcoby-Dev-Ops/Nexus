# Nexus Offer and Beta Operations Plan

## Purpose
Define how Nexus is sold, provisioned, tenant-mapped, and supported so Marcoby can launch publicly and onboard beta testers with predictable operations.

## Outcomes
- Customers can subscribe without manual billing back-and-forth
- Every customer is mapped to the correct Nexus instance
- Support is operational from day one
- Beta cohort is onboarded with clear goals, limits, and feedback loops

## 1) Commercial Offer Structure

### Plans (Recommended)
- `Solo`: low-seat, low-intensity use
- `Team`: multi-user standard production usage
- `Enterprise`: high-seat/high-compliance/custom SLA

### Plan Metadata (required in catalog)
- Included seats
- Max seats before forced upgrade
- AI usage policy (soft/hard limits)
- Support tier and SLA
- Region options
- Backup retention policy

### Billing Lifecycle
- Subscription states: `trialing`, `active`, `past_due`, `grace_period`, `suspended`, `canceled`
- Policy:
  - `active` and `grace_period` -> service remains available
  - `past_due` -> customer notices + restricted admin warnings
  - `suspended` -> login blocked except billing/admin recovery path
  - `canceled` -> deprovision workflow starts per retention policy

## 2) Pre-Order Data Required
Capture these before creating provisioning work:
- company/legal name
- primary technical contact + billing contact
- plan selected and term
- target region
- `planned_users_30d`
- `planned_users_180d`
- `peak_concurrent_users`
- `ai_intensity` (low/medium/high)
- required integrations
- domain strategy (`tenant.marcoby.com` vs custom domain)
- initial admin user email(s)

## 3) Order-to-Activation System

### Event Flow
1. Customer purchases in Pulse.
2. Pulse emits webhook (`order_paid`).
3. Provisioning service creates records:
- `subscription`
- `tenant`
- `provisioning_job`
4. Capacity engine picks server tier from sizing matrix.
5. Provisioning pipeline deploys OpenClaw + Nexus + routing.
6. Identity pipeline invites admin user and assigns tenant roles.
7. Activation email is sent with URL + login path.
8. Monitoring + support ownership attaches to tenant.

### Required Internal States
- `order_received`
- `payment_verified`
- `queued_for_provisioning`
- `provisioning`
- `validation`
- `awaiting_customer_action` (if DNS/identity needed)
- `active`
- `blocked`
- `incident`

## 4) Tenant-to-Instance Mapping Model
Store and enforce mapping explicitly:

Core fields:
- `tenant_id`
- `subscription_id`
- `instance_id`
- `instance_url`
- `api_url`
- `identity_org_id`
- `status`
- `plan`
- `region`

Routing rules:
- Login token includes tenant/org claim.
- Router resolves claim -> `instance_url`.
- Any mismatch between user claim and tenant mapping is rejected.
- Admin tools can rebind tenant to new instance during migration.

## 5) Capacity and Scaling Policy (Multi-User)

### Initial Sizing Matrix
- 1-25 users: 4 vCPU / 8 GB / 160 GB NVMe
- 26-75 users: 6 vCPU / 16 GB / 240 GB NVMe
- 76-150 users: 8 vCPU / 24 GB / 320 GB NVMe
- 151-300 users: 12 vCPU / 32 GB / 480 GB NVMe
- 300+ users: split architecture (separate DB + app scaling)

### Scale Triggers
- CPU > 70% sustained for 15+ min
- RAM > 75% sustained for 15+ min
- disk usage > 80%
- p95 API latency above SLO for 3 intervals
- queue delay > 2x baseline

### Scale Actions
- Event 1: vertical scale one tier
- Repeat saturation within 14 days: split services
- enterprise growth pattern: preemptive migration plan

## 6) Day-1 Support Operating Model

### Support Channels
- In-app support form
- Email support alias
- Priority channel for enterprise/beta-critical incidents

### Severity Definition
- `SEV1`: platform unavailable/security incident
- `SEV2`: major feature degradation, no workaround
- `SEV3`: partial issue with workaround
- `SEV4`: questions/enhancements

### Response Targets (Suggested)
- SEV1: 30 min first response
- SEV2: 2 hours
- SEV3: 1 business day
- SEV4: 2 business days

### Required Runbooks
- restore from backup
- TLS/DNS recovery
- OpenClaw outage fallback
- tenant move to new server
- billing suspension/reactivation

## 7) Beta Program Design

### Beta Cohort
- Target 10-25 organizations
- Mix by size:
  - 40% small teams
  - 40% mid teams
  - 20% heavier/advanced users

### Beta Offer
- Fixed beta term (example: 60-90 days)
- discounted or free access with explicit limits
- clear statement that features/support are evolving

### Beta Admission Checklist
- use case aligned with Nexus focus
- minimum weekly usage commitment
- agrees to feedback cadence and interviews
- has technical contact for fast issue resolution

### Beta Success Metrics
- activation rate (first login + setup complete)
- weekly active users per tenant
- 4-week retention
- incident volume per tenant
- feature adoption (core workflow completion)
- conversion intent to paid after beta

## 8) Launch Announcement Readiness Checklist
- offer page with plan definitions and beta CTA
- legal terms/privacy/support policy linked
- subscription + webhook flow tested in sandbox
- provisioning dry-run completed end-to-end
- identity invite/login tested across at least 3 tenants
- monitoring + alerting live before first public signups
- support rota published internally
- incident comms template prepared

## 9) Minimum Data Model (Implementation Starter)
- `subscriptions`
- `tenants`
- `instances`
- `tenant_instance_bindings`
- `provisioning_jobs`
- `support_tickets`
- `incident_events`
- `audit_log`

## 10) 30-Day Execution Plan
1. Week 1
- finalize plans, limits, and SLA text
- define webhook contract and provisioning states
- publish onboarding + support templates

2. Week 2
- implement subscription -> provisioning automation
- implement tenant-instance binding service
- run internal test orders end-to-end

3. Week 3
- onboard first 3-5 beta tenants
- validate scale triggers and support workflow
- fix onboarding friction fast

4. Week 4
- expand to full beta cohort
- review metrics and incident patterns
- finalize paid launch adjustments

## Related Docs
- `docs/deployment/NEXUS_ROLLOUT_RUNBOOK.md`
- `docs/deployment/DEPLOYMENT.md`
- `docs/deployment/PRODUCTION_DEPLOYMENT_GUIDE.md`
