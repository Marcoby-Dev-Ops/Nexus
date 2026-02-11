# Coolify Environment Variables - Quick Reference

## Essential Variables for Production

### Client App (Frontend)
```bash
# Required
VITE_API_URL=https://your-server-app.coolify.app
VITE_AUTHENTIK_CLIENT_ID=your_authentik_client_id
VITE_AUTHENTIK_BASE_URL=https://your-authentik-instance.com
NODE_ENV=production

# Optional
VITE_OPENAI_API_KEY=sk-...
VITE_OPENROUTER_API_KEY=sk-or-v1-...
```

### Server App (Backend)
```bash
# Required
API_PORT=3001
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
AUTHENTIK_CLIENT_ID=your_authentik_client_id
AUTHENTIK_BASE_URL=https://your-authentik-instance.com
AUTHENTIK_CLIENT_SECRET=your_secret
JWT_SECRET=your_jwt_secret

# AI Services
OPENAI_API_KEY=sk-...
OPENROUTER_API_KEY=sk-or-v1-...
LOCAL_OPENAI_URL=http://localhost:8000
LOCAL_API_KEY=sk-local

# CORS
FRONTEND_URL=https://your-client-app.coolify.app
```

## Database Configuration
```bash
# PostgreSQL (Coolify managed or external)
DATABASE_URL=postgresql://username:password@host:5432/database_name
DB_HOST=your_db_host
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
```

## Authentication Setup
```bash
# Authentik OAuth
AUTHENTIK_CLIENT_ID=nexus-client
AUTHENTIK_BASE_URL=https://auth.your-domain.com
AUTHENTIK_CLIENT_SECRET=your_client_secret

# JWT
JWT_SECRET=your_secure_jwt_secret_key
JWT_EXPIRES_IN=24h
```

## AI Services
```bash
# OpenAI
OPENAI_API_KEY=sk-...

# OpenRouter (alternative to OpenAI)
OPENROUTER_API_KEY=sk-or-v1-...

# Local AI (if running local models)
LOCAL_OPENAI_URL=http://localhost:8000
LOCAL_API_KEY=sk-local
```

## Network Configuration
```bash
# Client → Server communication
VITE_API_URL=https://your-server-app.coolify.app

# CORS settings
FRONTEND_URL=https://your-client-app.coolify.app
```

## Health Check Endpoints
- **Server**: `GET /health`
- **Client**: `GET /`

## Common Issues & Solutions

### 1. Client can't connect to server
- Check `VITE_API_URL` points to correct server URL
- Verify server is running and accessible
- Check CORS configuration in server

### 2. Database connection fails
- Verify `DATABASE_URL` format
- Check database credentials
- Ensure database is accessible from server

### 3. Authentication doesn't work
- Verify Authentik configuration
- Check OAuth redirect URLs
- Ensure client and server use same Authentik instance

### 4. AI services not working
- Check API keys are valid
- Verify API keys are set in correct app (client vs server)
- Check API service status

## Environment Variable Priority

1. **Coolify Environment Variables** (highest priority)
2. **Local .env files** (development only)
3. **Default values** (lowest priority)

## Security Checklist

- [ ] All sensitive variables are set in Coolify (not in code)
- [ ] Different API keys for dev/prod environments
- [ ] Strong JWT secrets
- [ ] Secure database credentials
- [ ] HTTPS URLs for production
- [ ] CORS properly configured
