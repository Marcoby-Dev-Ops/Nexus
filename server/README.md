# Nexus Server

This directory contains the backend API for Nexus, built with Node.js, TypeScript, Express, and PostgreSQL (via Prisma ORM). All backend logic, database models, and API endpoints will be developed here.

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js (for local development)

### Setup
1. Copy `.env.example` to `.env` and update credentials as needed.
2. Run `docker-compose up --build` to start the API and database.
3. Run `npx prisma migrate dev` inside the container to apply migrations.

### Development
- API runs on `http://localhost:4000`
- Health check: `GET /health`
- Conversation API: `GET/POST/PUT/DELETE /conversations`

### Scripts
- `npm run dev` — Start in development mode
- `npm run build` — Build TypeScript
- `npm start` — Start production build
- `npm run lint` — Lint code

### Prisma
- Edit `prisma/schema.prisma` for models
- Run `npx prisma generate` after changes

### Database
- PostgreSQL runs in Docker on port 5432
- Data is persisted in the `nexus-db-data` volume

---
See the main project README for overall architecture. 