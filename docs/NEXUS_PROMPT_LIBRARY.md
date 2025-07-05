# 🚀 Nexus Ultimate Prompt Library (Build-From-Scratch Edition)

---

## Universal Department Structure: THINK → SEE → ACT

Every department module in Nexus now follows a universal structure to maximize clarity, enablement, and action:

- **Analysis (THINK):** Automated and on-demand analysis of department performance, trends, and diagnostics. (KPIs, charts, summaries)
- **Advice (SEE):** AI-powered recommendations, prioritized actions, and strategic guidance. (Next Best Actions, improvement suggestions)
- **Resources (ACT):** Curated playbooks, templates, product/service info, and enablement materials. (Knowledge cards, tools, templates)

All department modules must implement these three tabs/sections, ensuring every user can THINK (understand), SEE (get advice), and ACT (take action) in a consistent, empowering way.

---

## Global Instructions (Apply to Every Prompt)
- **Acceptance Criteria:** List for every ticket.
- **Design System:** Use only approved components/tokens ([see docs/architecture/DESIGN_SYSTEM.md](architecture/DESIGN_SYSTEM.md)).
- **Testing:** Unit, integration, and a11y tests required.
- **Documentation:** Update Storybook, in-code JSDoc, and user docs.
- **Review:** All code reviewed for security, performance, and design compliance.
- **Security:** No secrets in code, enforce RBAC, audit logs, and data separation.
- **CI/CD:** All PRs must pass lint, test, and a11y checks.
- **Error Boundaries:** All major UI modules (esp. dashboards) must implement error boundaries for graceful failure.
- **Widget Analytics:** All dashboards and key widgets must include event tracking for usage and actions.

---

## Phase 1: Foundation & MVP (0–3 Months)

### 1. Unified Navigation/UI

> **Prompt:**  
> Build a modular, mobile-first sidebar and topbar layout in React/TypeScript using shadcn/ui. Add theme support, accessibility (WCAG 2.1), and dynamic department pages. Include global search and user profile menu.
>
> **Acceptance Criteria:**  
> - Responsive/adaptive layout  
> - Navigation items are config-driven  
> - Uses only design tokens  
> - Keyboard accessible, ARIA labels  
> - Unit/integration/a11y tests  
> - Storybook/docs updated

---

### 2. Dashboard (KPI, Activity, AI Briefing)

> **Prompt:**  
> Build a customizable dashboard with real-time KPI cards, activity feed, and an "AI Daily Briefing" widget. Widgets must be pluggable and animated with Framer Motion.
>
> **Acceptance Criteria:**  
> - All UI uses ContentCard and LoadingStates  
> - Widget order/visibility customizable  
> - AI Briefing updates daily, dismissible  
> - Follows design tokens  
> - a11y and test coverage  
> - Storybook updated
> - Dashboard-specific onboarding and empty states for new users
> - Lazy loading/code-splitting for heavy dashboard widgets
> - Widget-level analytics/event tracking (usage, dismissals, actions)
> - Error boundaries for all dashboard widgets (graceful UI degradation)
> - Dashboard personalization by user role/department

---

### 3. Department Modules (Sales, Finance, Operations)

> **Prompt:**  
> Scaffold Sales, Finance, and Operations modules with:
> - **THINK:** Analysis tab (KPI grid, workflow/task panel, AI summaries)
> - **SEE:** Advice tab (AI suggestions, actionable recommendations, prioritized actions)
> - **ACT:** Resources tab (playbooks, product/service info, templates, enablement materials)
> All layouts must use standardized PageTemplates and ContentCard.
>
> **Acceptance Criteria:**  
> - UnifiedDepartmentPage and departmentConfigs used  
> - Tabs: Analysis, Advice, Resources present in every department  
> - AI suggestions actionable (1-click) in Advice tab  
> - All forms validated, standardized error display  
> - Department configs/docs updated  
> - Tests + Storybook

---

### 4. My Workspace

> **Prompt:**  
> Create a "My Workspace" hub with recents, pins/favorites, quick actions, AI-powered "Next Best Action," a calendar widget (today's meetings/events), an email/inbox widget (recent communications), predictive/proactive alerts, a business education engine/learning feed, and emotional engagement features (success banners, milestone celebrations, supportive guidance).
>
> **Acceptance Criteria:**  
> - Recents/pins update in real-time  
> - Quick actions trigger workflows and automations  
> - AI panel is context-aware and provides actionable, personalized insights  
> - **Calendar widget** shows today's meetings, events, and deadlines. Integrates with Google/Outlook or internal calendar. Supports quick actions (join, view, add event). Real-time updates and error handling required.  
> - **Email/Inbox widget** displays recent emails/messages, highlights unread/important communications. Integrates with Gmail/Outlook or internal messaging. Supports quick actions (reply, mark as read, open in inbox). Real-time updates and error handling required.  
> - **Predictive/Proactive Alerts:** AI-driven alerts and warnings (risk, opportunity, anomaly detection). Users receive real-time, actionable alerts with context and recommended actions.  
> - **Business Education Engine / Learning Feed:** Contextual business tips, explanations, and improvement suggestions, tailored to user role/department. Updated regularly and visible in workspace/dashboard.  
> - **Emotional Engagement:** System celebrates wins, encourages progress, and fosters team unity (success banners, milestone celebrations, supportive guidance).  
> - **Personal Productivity Trinity (THINK/SEE/ACT):**
>     - **THINK:** Users can capture and organize ideas, notes, and brainstorms. Quick capture, idea board, and linking to tasks/projects.
>     - **SEE:** Unified overview/home page with real-time insights, AI-powered summaries, and actionable intelligence. Widgets for calendar, tasks, ideas, and AI insights. Personalized, customizable dashboard.
>     - **ACT:** Automate and execute tasks, schedule events, trigger workflows, and leverage quick actions. Integrate with external services and use the executive assistant for natural language actions.
> - **Unified Search & Command Bar:** Global search across tasks, events, ideas, files, and messages. Command palette for quick actions and navigation.
> - **Automations & Smart Suggestions:** Automated routines, smart reminders, and AI-driven next best actions. Proactive alerts and workflow triggers.
> - **Notifications & Reminders:** Multi-channel, context-aware, and actionable.
> - **Data Portability & Privacy:** Export/import, privacy controls, and compliance.
> - **Mobile & Offline Support:** Responsive design and offline access for key data.
> - Follows design system  
> - Tests/docs

---

### 5. AI Assistant

> **Prompt:**  
> Integrate an AI chat/assistant with:  
> - Contextual chat  
> - "Next best action" shortcuts  
> - Workflow triggers  
> - Natural language business query: Users can ask any business question about data, metrics, or processes and receive clear, actionable answers in natural language.  
> Support @mentions and (optionally) voice input.
>
> **Acceptance Criteria:**  
> - Works on every page  
> - 2+ automations per department  
> - Keyboard and screen-reader accessible  
> - **Natural language business query**: Users can ask the assistant any business question and receive actionable, accurate answers.  
> - Includes sample inputs/outputs in docs  
> - Tests/Storybook

---

### 6. Onboarding & Help

> **Prompt:**  
> Implement progressive onboarding: checklist, contextual tips, user journey tracking. Add help panel with searchable guides and video links.
>
> **Acceptance Criteria:**  
> - New users see onboarding checklist  
> - Tips/guide popups are context-aware  
> - User progress tracked and persisted  
> - Docs/Storybook/screenshots

---

### 7. Authentication & RBAC

> **Prompt:**  
> Add SSO/OAuth, multi-tenant support, and RBAC (roles: Admin, Member, Viewer). Scaffold admin UI for managing users/roles/tenants.
>
> **Acceptance Criteria:**  
> - Roles enforce all protected routes  
> - Admin UI lists users, invites, removes, edits roles  
> - Tests for permission logic  
> - User/role docs updated

---

### 8. API Gateway & DB

> **Prompt:**  
> Scaffold API gateway (REST or GraphQL) with versioning, audit logging, and multi-tenant user/org/department schemas.
>
> **Acceptance Criteria:**  
> - API versioning works  
> - Audit logs written/readable  
> - Multi-tenant separation tested  
> - Prisma/ORM types match docs

---

### 9. CI/CD & Observability

> **Prompt:**  
> Implement CI/CD pipeline (lint, test, deploy), set up Sentry/error logging, and basic uptime/health endpoints.
>
> **Acceptance Criteria:**  
> - All PRs require tests to pass  
> - Logs visible in admin panel  
> - Health endpoints monitored  
> - Docs/screenshots

---

### 10. Accessibility (a11y)

> **Prompt:**  
> Audit all flows for a11y, add keyboard navigation, ARIA labels, high-contrast support, and write a11y tests for each page.
>
> **Acceptance Criteria:**  
> - All critical flows pass Axe or pa11y  
> - Keyboard/reader nav demoable  
> - a11y docs/screenshots

---

### 11. i18n

> **Prompt:**  
> Add language files, language picker, and scaffold UI copy for future multi-language support.
>
> **Acceptance Criteria:**  
> - Language switcher visible  
> - All UI copy pulled from i18n files  
> - Docs/screenshots

---

### 12. GDPR/Data Export

> **Prompt:**  
> Add endpoints for user/org data export and deletion. Ensure compliance with GDPR data requests.
>
> **Acceptance Criteria:**  
> - API endpoints documented  
> - Tests for export/delete flows  
> - Legal/compliance docs updated

---

## Phase 2+: Feature Depth, Integrations, Extensibility

- Repeat above format for:
  - **Sales CRM:** Pipeline, deals, integrations (HubSpot, Salesforce, etc.)
  - **Finance:** Invoicing, QBO/Xero, expense management
  - **Operations:** Task/project builder, n8n automations
  - **Marketplace:** App discovery, install/uninstall, billing
  - **Integration SDK:** For 3rd party apps
  - **Theme Builder:** Custom themes, branding
  - **Advanced AI:** RAG, LLM prompt engineering, cross-department insights

---

## Refactor & Review Prompts

> **Prompt:**  
> Refactor all legacy [module] pages to use standardized [component/layout]. Audit for hardcoded color/spacing; replace with design tokens. Add missing unit/integration tests, update Storybook, and review for a11y/performance/security.

> **Acceptance Criteria:**  
> - No hardcoded styles remain  
> - All new code covered by tests  
> - All flows pass a11y and perf check  
> - PR reviewed and merged

---

## General "Review" Prompt

> **Prompt:**  
> Review [PR/feature] for:
> - Security (no secrets, XSS, injection)
> - Performance (no slow renders/queries)
> - Design compliance (design tokens, system components)
> - a11y (screen reader, keyboard, contrast)
> Add code comments and requested changes as needed.

---

## Sample Inputs/Outputs (For Complex Features)

> **Prompt:**  
> For the Marketplace integration, show an example of an app install flow input/output, including app metadata, permission request, and UI feedback on success/failure.

---

## Continuous Improvement & Retrospective

> **Prompt:**  
> After each phase, run a retro:  
> - What went well?  
> - What could be improved?  
> - Update prompt library and process accordingly.

---

## How to Use

- Copy each prompt as a ticket/epic in your PM tool.
- Attach acceptance criteria and docs links.
- Require all contributors to follow the checklist.
- Review and update after each major release.

---

**This is your "build Nexus from zero to Fortune 500" master prompt library. If you want department-specific, workflow-specific, or integration-specific prompt sets, just ask—I can generate those instantly, tailored to your roadmap.**

**This is how you build the best business OS—end to end, with no ambiguity, no tech debt, and no missed requirements.**

### Future Phases: Advanced Automation & Intelligence

> **Prompt:**  
> Implement autonomous operations: The system can recommend and, with approval, implement optimizations across departments autonomously. Includes self-optimizing business processes and automated inter-departmental coordination.
>
> **Acceptance Criteria:**  
> - System can identify and recommend optimizations across departments  
> - With user approval, system can implement changes  
> - Self-optimizing workflows and automated coordination are demonstrable  
> - Security, audit, and rollback mechanisms in place  
> - Tests/docs 