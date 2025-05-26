# API Reference

This document provides an overview of the main API endpoints and data models for Nexus OS. For implementation details, see the backend code in `server/`.

## Base URL
- Local: `http://localhost:4000`

## Health Check
- `GET /health`
  - Returns: `{ status: 'ok' }`

## Conversations API
- `GET /conversations` — List all conversations
- `POST /conversations` — Create a new conversation
- `GET /conversations/:id` — Get a specific conversation
- `PUT /conversations/:id` — Update a conversation
- `DELETE /conversations/:id` — Delete a conversation

### Conversation Model
```
{
  id: string;
  title: string;
  messages: Array<{ sender: string; text: string; timestamp: string }>;
  createdAt: string;
  updatedAt: string;
}
```

## Authentication (Planned)
- OAuth2, JWT, and session-based authentication endpoints (coming soon)

## Other Planned APIs
- User management
- Module marketplace
- Finance, sales, and operations data endpoints

---

For more details, see the backend implementation in `server/src/routes/` and the Prisma schema in `server/prisma/schema.prisma`. 