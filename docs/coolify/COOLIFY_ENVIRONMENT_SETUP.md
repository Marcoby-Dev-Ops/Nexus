# Coolify Environment Variables Setup

This guide explains how to configure environment variables in Coolify for both the client and server applications.

## Client Application Environment Variables

Set these environment variables in your Coolify client application:

### Required Variables
```bash
# API Configuration
VITE_API_URL=https://your-server-app.coolify.app
VITE_API_BASE_URL=https://your-server-app.coolify.app

# Authentication
VITE_AUTHENTIK_CLIENT_ID=your_authentik_client_id
VITE_AUTHENTIK_BASE_URL=https://your-authentik-instance.com

# Environment
NODE_ENV=production
VITE_DEV=false
```

### Optional Variables
```bash
# AI Services (if using client-side AI)
VITE_OPENAI_API_KEY=sk-...
VITE_OPENROUTER_API_KEY=sk-or-v1-...

# Google Services
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
VITE_GOOGLE_PLACES_API_KEY=your_google_places_key
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret

# Stripe (if using payments)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_STRIPE_WEBHOOK_SECRET=whsec_...

# Integrations
VITE_HUBSPOT_CLIENT_ID=your_hubspot_client_id
VITE_HUBSPOT_CLIENT_SECRET=your_hubspot_client_secret
VITE_SLACK_CLIENT_ID=your_slack_client_id
VITE_PAYPAL_CLIENT_ID=your_paypal_client_id
VITE_PAYPAL_ENV=sandbox

# App Configuration
VITE_APP_VERSION=1.0.0
VITE_BASE_URL=https://your-client-app.coolify.app
```

## Server Application Environment Variables

Set these environment variables in your Coolify server application:

### Required Variables
```bash
# Server Configuration
API_PORT=3001
NODE_ENV=production

# Database Configuration
DATABASE_URL=postgresql://username:password@host:5432/database_name
DB_HOST=your_db_host
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# Authentication
AUTHENTIK_CLIENT_ID=your_authentik_client_id
AUTHENTIK_BASE_URL=https://your-authentik-instance.com
AUTHENTIK_CLIENT_SECRET=your_authentik_client_secret

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h
```

### AI Services Configuration
```bash
# OpenAI
OPENAI_API_KEY=sk-...

# OpenRouter
OPENROUTER_API_KEY=sk-or-v1-...

# Local AI (if using local models)
LOCAL_OPENAI_URL=http://localhost:8000
LOCAL_API_KEY=sk-local
```

### Optional Variables
```bash
# CORS Configuration
FRONTEND_URL=https://your-client-app.coolify.app

# Google Services
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Integrations
HUBSPOT_CLIENT_ID=your_hubspot_client_id
HUBSPOT_CLIENT_SECRET=your_hubspot_client_secret
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_ENV=sandbox

# Monitoring
SENTRY_DSN=your_sentry_dsn
```

## Coolify Setup Instructions

### 1. Create Applications in Coolify

1. **Client Application**:
   - Source: Your GitHub repository
   - Build Command: `cd client && npm install && npm run build`
   - Start Command: `cd client && npm run preview`
   - Port: 4173 (Vite preview port)

2. **Server Application**:
   - Source: Your GitHub repository  
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && npm start`
   - Port: 3001

### 2. Set Environment Variables

1. Go to each application in Coolify
2. Navigate to "Environment Variables" section
3. Add the variables listed above for each application
4. Make sure to use the correct values for your environment

### 3. Database Setup

1. Create a PostgreSQL database in Coolify or use an external one
2. Set the `DATABASE_URL` and related database variables in the server app
3. Ensure the database is accessible from your server application

### 4. Network Configuration

1. **Client → Server Communication**:
   - Set `VITE_API_URL` in client to point to your server app URL
   - Ensure CORS is properly configured in server

2. **External Services**:
   - Configure Authentik OAuth settings
   - Set up any external API keys (OpenAI, Google, etc.)

### 5. Health Checks

1. **Server Health Check**: `GET /health`
2. **Client Health Check**: `GET /`

## Environment Variable Priority

The applications use the following priority for environment variables:

1. **Client**: `import.meta.env.VITE_*` (Vite environment)
2. **Server**: `process.env.*` (Node.js environment)
3. **Fallbacks**: Default values defined in the code

## Security Notes

- Never commit sensitive environment variables to your repository
- Use Coolify's environment variable management for all secrets
- Regularly rotate API keys and secrets
- Use different keys for development and production environments

## Troubleshooting

### Common Issues

1. **Client can't connect to server**:
   - Check `VITE_API_URL` is correct
   - Verify CORS settings in server
   - Ensure server is running and accessible

2. **Database connection issues**:
   - Verify `DATABASE_URL` format
   - Check database credentials
   - Ensure database is accessible from server

3. **Authentication problems**:
   - Verify Authentik configuration
   - Check OAuth redirect URLs
   - Ensure client and server use same Authentik instance

### Debugging

1. Check application logs in Coolify
2. Use the `/health` endpoint to verify server status
3. Check browser console for client-side errors
4. Verify environment variables are loaded correctly

## Example Coolify Configuration

### Client App Environment
```bash
NODE_ENV=production
VITE_API_URL=https://nexus-server.your-domain.com
VITE_AUTHENTIK_CLIENT_ID=nexus-client
VITE_AUTHENTIK_BASE_URL=https://auth.your-domain.com
VITE_DEV=false
```

### Server App Environment
```bash
NODE_ENV=production
API_PORT=3001
DATABASE_URL=postgresql://nexus_user:password@db.your-domain.com:5432/nexus_db
AUTHENTIK_CLIENT_ID=nexus-client
AUTHENTIK_BASE_URL=https://auth.your-domain.com
AUTHENTIK_CLIENT_SECRET=your_secret
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=sk-...
OPENROUTER_API_KEY=sk-or-v1-...
FRONTEND_URL=https://nexus.your-domain.com
```
