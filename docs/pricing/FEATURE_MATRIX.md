# Nexus Subscription Tiers

| Capability | Free (Starter) | Pro (Growth) | Enterprise (Scale) |
|------------|----------------|--------------|--------------------|
| Messages / day | 20 | 500 | 2,000 (pooled) |
| AI Agents | Executive Agent | + Finance, Operations, Sales Agents | All Agents + Custom Fine-Tuned Agents |
| File Uploads | 5 / day | 50 / day | 200 / day |
| Streaming Responses | – | ✓ | ✓ |
| Business Health Score | Read-only (24 h delay) | Real-time | Real-time + Historical Trend API |
| Maturity Analytics | – (locked teaser) | Basic Insights | Full Breakdown + Industry Benchmarks |
| Onboarding Wizard | Self-serve | Priority Chat Support | Dedicated Success Engineer |
| Integrations | CSV import, Slack | + HubSpot, Stripe, Google Analytics | All Pro + Custom Webhooks, SSO (SAML/SCIM) |
| Automation Flows | Pre-built Templates | Custom n8n Flows (5 active) | Unlimited + Managed Flows |
| Data Retention | 7 days | 90 days | 365 days + BYO-Storage |
| Seats Included | 1 | 5 | 25 (volume pricing >25) |
| Add-on Message Packs | $9 per +100 msgs | $7 per +500 msgs | $5 per +1,000 msgs |
| Support | Community Forum | 8×5 Email/Chat | 24×7 Priority + SLA |

## Pricing Rationale & Market Fit

* **Target buyer** – SMB and lower-mid-market teams that need actionable insights without an analyst head-count.
* **Pro $49 /mo** – Sits inside the self-serve "swipe a card" comfort zone (< $60). Direct benchmarks: Baremetrics Startup $49, Databox Professional $135, ChartMogul entry tier $100.
* **Enterprise from $199 /mo** – Low enough for procurement fast-track, yet leaves head-room for volume pricing (seats >25, higher message caps, premium support). Comparable mid-market analytics plans range $299–$1k +/mo.
* **Price-signals trust** – Staying above ~$39 avoids the "too cheap to be serious" perception common in analytics tooling.
* **Future levers** – Usage modifiers (extra messages, seats), advanced modules, and annual billing (-16 %) give room to scale ARPA without re-platforming.

## Upgrade Path & Scaling

1. **Free ➜ Pro** – When a solo founder or small team exceeds 20 daily messages or needs Finance/Sales agents, the app prompts to upgrade.  Billing moves to the Pro recurring price (`$49/mo`).  Seats can be added at $9 / extra user.
2. **Pro ➜ Enterprise** – When a company approaches 500 daily messages **or** requests SSO / custom integrations, an in-app banner surfaces the Enterprise trial (`$199/mo`, volume pricing after 25 seats).
3. **Add-Ons** – Any tier can purchase one-time message packs ⚡ via existing Stripe one-time prices.  Packs apply instantly and do **not** expire.

## Hooks for Free Users

* Executive Agent unlimited for the 1st week (then 20 msgs/day).  
* Business Health Score (delayed) shows "Upgrade for real-time".  
* Slack integration posts a weekly summary with a "Pro unlock" call-to-action.  
* Dashboard badges (Pro, Enterprise features) appear greyed-out but clickable → opens upgrade modal.

## License Growth inside Nexus

* **Seat Management** – Admins can add users; app calls Stripe `update_subscription` to increment quantity.  
* **Usage Alerts** – When 80 % of message quota is reached, notify admin + link to purchase Add-On or upgrade tier.  
* **Department Expansion** – Enabling a new department (e.g., Marketing) auto-suggests the next tier if advanced agents required.

_Note: All quotas & pricing in USD; EU/UK pricing auto-calculated via Stripe tax regions._ 