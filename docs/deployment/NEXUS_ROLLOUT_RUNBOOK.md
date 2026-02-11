# Nexus Rollout Runbook (Marcoby)

## Purpose
This runbook defines the end-to-end process for provisioning a new Nexus customer instance through Marcoby, from order intake to user handoff.

## Scope
- Order submitted through Marcoby (Pulse)
- VPS allocation and baseline provisioning
- OpenClaw deployment
- Nexus backend/frontend deployment
- Reverse proxy + TLS configuration
- User provisioning through Marcoby Identity
- Customer handoff and post-launch validation

## Roles
- Sales/CS: validates customer requirements before order submission
- Provisioning Ops: server allocation, base hardening, deployment orchestration
- Platform Ops: OpenClaw/Nexus config, health checks, monitoring
- IAM Admin: Marcoby Identity user/org setup and access verification
- Support: handoff communication and first-24-hour follow-up

## Provisioning Model
Use a hybrid inventory model:
- Keep a warm pool of ready VPS hosts (OS + baseline hardening only)
- Assign from warm pool when available
- Purchase/provision on-demand when pool is depleted

Recommended default server profile:
- 4 vCPU
- 8 GB RAM
- 120-160 GB NVMe
- KVM virtualization
- Ubuntu 22.04/24.04 LTS

## Phase 1: Before Submitting Order to Marcoby
The following must be collected and validated before the order is submitted:

1. Customer and contract data
- Legal customer/org name
- Billing contact and technical contact
- Selected plan/tier and billing term
- Approved SLA/support tier

2. Tenant configuration data
- Primary domain or subdomain strategy
- Region/data residency requirement
- Expected user count and workload profile
- Required integrations (if any)

3. Identity and access prerequisites
- Marcoby Identity organization reference (new or existing)
- Initial admin user email for invite
- SSO requirements (if enterprise)

4. Compliance and policy
- Security/compliance constraints documented
- Backup retention requirement confirmed
- Incident and escalation contacts confirmed

5. Financial readiness
- Payment status successful in Pulse
- Internal order status set to `Ready for Provisioning`

Exit criteria:
- All fields complete
- Payment captured
- Internal provisioning ticket created

## Phase 2: What Marcoby Does When an Order Is Received

1. Intake automation
- Pulse order webhook creates provisioning ticket
- Order gets unique internal ID
- Ticket status set to `Queued`

2. Triage and assignment
- Validate payment + required fields
- Assign owner in Provisioning Ops
- Set provisioning SLA clock start time

3. Capacity decision
- Check warm-pool inventory by region/plan
- If available: reserve VPS and attach order ID
- If unavailable: purchase/provision new VPS and attach order ID

4. Status transitions
- `Queued` -> `Provisioning` -> `Validation` -> `Live` (or `Blocked`)

## Phase 3: New Server Setup (VPS Baseline)

1. Provision host
- Deploy Ubuntu LTS image
- Assign hostname using naming convention (example: `nexus-<org>-<env>`)
- Register asset in inventory (IP, provider ID, renewal date, order ID)

2. Secure baseline
- Create admin user and disable password SSH login
- Configure SSH keys
- Enable firewall (allow 22, 80, 443; restrict 22 by source where possible)
- Install fail2ban and set ban policy
- Apply OS updates and reboot if needed
- Configure timezone and NTP

3. Operational baseline
- Install Docker and Docker Compose plugin
- Configure log rotation
- Configure backup target and schedule
- Install monitoring/alerting agent

4. Readiness gate
- Run `scripts/nexus-preflight.sh`
- Require minimum result: `WARN` with no hard failures for go-live prep

Exit criteria:
- Host hardened
- Monitoring + backup active
- Preflight passes minimum threshold

## Phase 4: OpenClaw Setup

1. Deploy OpenClaw service
- Deploy `openclaw-coolify` stack (or Marcoby standard OpenClaw deployment)
- Configure API key (`OPENCLAW_API_KEY`)
- Expose endpoint internally or via secured public URL

2. Validate OpenClaw
- Health endpoint responds
- Auth key works
- Test tool execution in sandbox mode

3. Record configuration
- Save `OPENCLAW_API_URL` and key reference in secret manager
- Link OpenClaw instance to order record

Exit criteria:
- OpenClaw healthy and reachable from Nexus backend

## Phase 5: Nexus Setup (Backend + Frontend)

1. Deploy backend
- Configure required env vars (DB, auth, OpenClaw, model providers, app settings)
- Run migrations if required
- Validate `/health` endpoint

2. Deploy frontend
- Configure API base URL and auth settings
- Build/deploy frontend
- Validate home/login load over HTTPS

3. Configure reverse proxy and TLS
- Configure domain routing:
  - `app.<tenant-domain>` -> Nexus frontend
  - `api.<tenant-domain>` -> Nexus backend (or path-based route)
- Issue TLS certs (Let's Encrypt or managed cert)
- Force HTTPS + HSTS per policy
- Verify CORS/cookie/session behavior

4. Smoke tests
- Frontend reachable
- Backend API reachable
- Frontend-to-backend requests succeed
- Core AI/OpenClaw call succeeds

Exit criteria:
- Stack fully reachable over HTTPS
- Smoke tests pass

## Phase 6: User Setup (Marcoby Identity)

1. Tenant identity prep
- Create or map Marcoby Identity organization
- Confirm tenant metadata mapping

2. Admin user provisioning
- Invite initial tenant admin user
- Assign required role/group mapping for Nexus access
- Validate login and token claims

3. Access verification
- Confirm user lands in correct Nexus tenant context
- Confirm role-based access behaves as expected

Exit criteria:
- Initial tenant admin can sign in and use Nexus instance

## Phase 7: Customer Handoff

1. Send launch email
- Nexus URL
- Login instructions (Marcoby Identity)
- Initial admin invite instructions
- Support channel + SLA response times

2. Operational closure
- Mark ticket `Live`
- Record deployment metadata and runbook checklist
- Schedule 24-hour and 7-day follow-up checks

## Post-Launch Validation Checklist
- Uptime monitors active for frontend + backend + OpenClaw
- Alert routes configured
- Backup job success confirmed
- TLS cert validity verified
- Audit logs and access logs available

## Failure and Rollback Policy
- If deployment fails before handoff: rebuild host from baseline image and redeploy
- If service health degrades within first 24 hours:
  - Open incident
  - Roll back to previous known-good release/config
  - Notify customer with incident status and ETA
- Document root cause and prevention action in incident notes

## SLA Targets (Suggested)
- Warm-pool provisioning: <= 2 hours from paid order
- On-demand host provisioning: <= 6 hours from paid order
- Critical post-launch incident first response: <= 30 minutes

## Order State Machine (Reference)
- `Ready for Provisioning`
- `Queued`
- `Provisioning`
- `Validation`
- `Live`
- `Blocked` (missing data/dependency)
- `Incident` (post-go-live issue)
