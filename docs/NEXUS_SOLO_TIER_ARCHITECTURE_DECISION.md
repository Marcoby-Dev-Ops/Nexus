Nexus Summary: $20 Solo Tier & Multi-Tenant Architecture Decision

Core Decision

The $20 AI Chat Solo tier will run on tier-dedicated shared infrastructure, not per-user VPSs.
	•	One or more high-performance “Solo Super-Nodes” (VPSs) are permanently reserved only for Solo users.
	•	Users are isolated at the container, storage, and identity level, not the VM level.
	•	No Workspace or Enterprise workloads ever share this infrastructure.

This protects margins, simplifies ops, and maintains security boundaries.

⸻

Why This Is the Correct Model

Economics
	•	Per-user VPSs at $20 are not viable.
	•	A dedicated high-RAM VPS (e.g., 64GB) can safely host ~30–40 Solo users.
	•	Infra cost per user ≈ $3–6 → strong margin at $20/user.

Performance
	•	Shared “beefy” nodes allow CPU/RAM bursting, delivering better UX than tiny 2GB VMs.
	•	Chat workloads are spiky; bursting handles this naturally.

Operations
	•	One environment to update and monitor via Coolify.
	•	Fewer failure domains, easier patching, simpler scaling.
	•	Clean separation from higher-value customers (DMZ effect).

⸻

Security & Trust Positioning

Externally framed as:
	•	“Dedicated Marcoby Cloud infrastructure reserved for Solo users”
	•	“Private, container-isolated AI environment”
	•	“No model training on your data—ever”

Granular mechanics are not exposed; guarantees are.

⸻

Hard Rules (Non-Negotiable)

Solo tier never allows:
	•	Custom models
	•	Extra memory/CPU
	•	Coolify access
	•	Background jobs
	•	Custom integrations
	•	Exceptions of any kind

Any request beyond limits triggers an upgrade, not a tweak.

⸻

Upgrade Path (Critical)

When a Solo user wants:
	•	More agents
	•	Custom apps
	•	Integrations
	•	Persistent workloads
	•	Compliance / RBAC
	•	API or CI/CD access

They’ve outgrown Solo.

Upgrade flow:
	•	Detach their isolated data volume
	•	Attach it to a private Workspace or BYOI node
	•	Same data, same assistant, zero reset

⸻

Architectural Insight (Key)

The Solo tier is not just an entry offer—it is a live validation environment for multi-user, multi-tenant operation.

There are only two Nexus deployment modes:

1. Gated Multi-Tenant (Solo)
	•	Single-user workspaces
	•	No cross-user visibility
	•	Private agents
	•	Hard caps
	•	Isolation by policy

2. Cooperative Multi-Tenant (Org / Enterprise)
	•	Shared workspace
	•	Role-Based Access Control (RBAC)
	•	Shared agents with scoped permissions
	•	Audit logs and governance
	•	Configurable policies

Same infrastructure. Same runtime.
Only the policy layer changes.

⸻

Strategic Implication
	•	Solo proves concurrency, isolation, and load handling in production.
	•	Enterprise is not a rewrite—just a different governance model.
	•	Nexus scales by policy, not hardware.

This positions Nexus as a real platform, not a collection of plans.

⸻

Recommended Internal Framing

Document internally as:

Nexus Deployment Modes
	•	mode=isolated → Solo
	•	mode=cooperative → Workspace / Enterprise

⸻

Bottom Line
	•	$20 Solo tier = tier-dedicated shared infrastructure
	•	Strong margins + strong UX
	•	Clean upgrade path
	•	Validates enterprise-grade multi-tenancy
	•	RBAC and governance—not hardware—are the differentiators at scale

⸻

If you want, I can also:
	•	Compress this into a 1-page architecture brief
	•	Translate it into engineering requirements
	•	Or convert it into sales / investor language

Just tell me the audience.