# Nexus Deployment Guide for Coolify

## Prerequisites

1. **Supabase Database**: Ensure your Supabase project is set up and running
2. **Environment Variables**: Configure all required environment variables
3. **GitHub Repository**: Code should be pushed to GitHub for Coolify deployment

## Required Environment Variables

Add these environment variables in your Coolify deployment configuration:

### Core Configuration (Required)
```bash
VITE_POSTGRES_URL=postgresql://postgres:postgres@localhost:5433/vector_db
VITE_POSTGRES_HOST=localhost
VITE_POSTGRES_PORT=5433
VITE_POSTGRES_DB=vector_db
VITE_POSTGRES_USER=postgres
VITE_POSTGRES_PASSWORD=postgres
```

### Stripe Configuration (Required for billing features)
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key
VITE_STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### Optional Integrations
```bash
# HubSpot CRM
VITE_HUBSPOT_API_URL=https://api.hubspot.com

# Google Services
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret

# Microsoft Teams
VITE_MS_TEAMS_CLIENT_ID=your_ms_teams_client_id
VITE_MS_TEAMS_CLIENT_SECRET=your_ms_teams_client_secret
VITE_MS_TEAMS_TENANT_ID=your_ms_teams_tenant_id
VITE_MS_TEAMS_REDIRECT_URI=https://your-domain.com/integrations/teams/callback

# Slack
VITE_SLACK_CLIENT_ID=your_slack_client_id
```

## Coolify Deployment Steps

1. **Connect GitHub Repository**
   - In Coolify, create a new application
   - Connect your GitHub repository: `your-username/nexus`
   - Select the main branch for deployment

2. **Configure Build Settings**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Node Version: `20`

3. **Set Environment Variables**
   - Add all the required environment variables listed above
   - Ensure production values are used (not test/development keys)

4. **Configure Domain**
   - Set up your custom domain in Coolify
   - Enable SSL certificate (Let's Encrypt)

5. **Deploy**
   - Trigger the initial deployment
   - Monitor build logs for any issues

## Pre-Deployment Checklist

- [ ] All TypeScript errors resolved
- [ ] Environment variables configured
- [ ] Supabase database migrations applied
- [ ] Stripe webhooks configured
- [ ] Domain and SSL configured
- [ ] Build process tested locally

## Production Optimizations

The Dockerfile includes:
- Multi-stage build for smaller image size
- Nginx configuration for SPA routing
- Static asset caching
- Security headers
- Gzip compression
- Health checks

## Monitoring and Maintenance

- Monitor application logs in Coolify
- Set up uptime monitoring
- Configure backup strategies for Supabase
- Monitor Stripe webhook delivery
- Review performance metrics

## Support

For deployment issues:
1. Check Coolify build logs
2. Verify environment variables
3. Test Supabase connectivity
4. Validate Stripe configuration 