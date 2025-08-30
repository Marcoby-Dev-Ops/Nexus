# Nexus Developer Onboarding Guide

> Welcome to Nexus! This guide will get you up and running fast, with everything you need for a smooth first day.

---

## 🚦 Quick Checklist (First 10 Minutes)

- [ ] **Clone the repo:**
  ```bash
  git clone <repo-url>
  cd Nexus
  ```
- [ ] **Install dependencies:**
  ```bash
  npm install
  ```
- [ ] **Copy and configure environment variables:**
  ```bash
  cp .env.example .env
  # Fill in required secrets (see below)
  ```
- [ ] **Start the dev server:**
  ```bash
  pnpm dev
  ```
- [ ] **Run tests:**
  ```bash
  npm test
  ```
- [ ] **Check code quality:**
  ```bash
  npm run lint
  npm run type-check
  ```
- [ ] **Open the app:**
  - Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Prerequisites
- Node.js (v18+ recommended)
- npm (v9+ recommended)
- Git
- Docker (for some integrations, optional)
- Access to required secrets (see `.env.example`)

---

## 🔑 Environment Variables
- Copy `.env.example` to `.env` and fill in:
  - Supabase URL and anon key
  - Microsoft/Google OAuth credentials (if working on integrations)
  - Stripe, n8n, and other service keys as needed
- Ask a team lead if you're missing any secrets

---

## 🏗️ Project Structure
- `src/` — React app source
- `supabase/` — DB migrations, Edge Functions
- `docs/` — All documentation
- `public/` — Static assets

---

## 🧪 Testing & Quality
- Run all tests: `npm test`
- Check coverage: `npm run test:coverage`
- Lint: `npm run lint`
- Type-check: `npm run type-check`
- E2E: `npm run cypress` (if enabled)

---

## 🆘 Troubleshooting
- **Common issues:**
  - Missing env vars: double-check `.env`
  - Port in use: stop other dev servers
  - DB errors: check Supabase project status
- **Still stuck?**
  - Ask in #dev-help or ping your onboarding buddy

---

## 📚 Key Docs & Links
- [Project Overview](./PROJECT_OVERVIEW.md)
- [Unified Architecture](./UNIFIED_ARCHITECTURE.md)
- [Business Setup](./MARCOBY_BUSINESS_SETUP.md)
- [Sustainable Dev Prompts](./sustainable-development-prompts.md)
- [Microsoft 365 Integration](./MICROSOFT_365_INTEGRATION_MIGRATION.md)

---

## 🤝 Who to Ask
- **Onboarding Buddy:** [Name/Slack]
- **Tech Lead:** [Name/Slack]
- **Product Manager:** [Name/Slack]

---

Welcome aboard! We're excited to build the future of business intelligence with you 🚀 