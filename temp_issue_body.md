This issue serves as a central tracker for the ongoing review of the Nexus application, focusing on preparing it for consumer release. The review process involves examining each page, domain, and feature to identify:
* What is essential for the **MVP**.
* What can be **deferred** and potentially hidden.
* What should be **archived**.

Detailed findings, categorizations, and clean-up recommendations are being documented in `docs/review_notes.md`. This document will be continuously updated and serves as the checklist for consumer readiness.

[Link to review_notes.md on GitHub](https://github.com/Marcoby-Dev-Ops/Nexus/blob/main/docs/review_notes.md)

**Initial observations already documented include:**
* `ChatMessage.tsx` (Core chat message display)
* `ChatWelcome.tsx` (Chat greeting and suggestions)
* `server/src/routes/ai.js` (Core AI backend logic and integration with OpenClaw)
* `docs/ARCHITECTURE_AND_PHILOSOPHY.md` (Foundational system design)
* `docs/PROJECT_CONTEXT.md` (Project domain configuration)
* `docs/current/ENGINEERING_STATUS.md` (Engineering health snapshot)

Additionally, during the last push, GitHub reported **15 vulnerabilities** (7 high, 5 moderate, 3 low) on the default branch. It is highly recommended to investigate these vulnerabilities as part of the consumer readiness process.
[Link to GitHub Security tab for Nexus](https://github.com/Marcoby-Dev-Ops/Nexus/security/dependabot)