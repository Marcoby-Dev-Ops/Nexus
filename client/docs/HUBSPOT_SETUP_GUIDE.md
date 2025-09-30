# HubSpot Integration Setup Guide

## Overview
This guide will help you set up real HubSpot integration to replace the mock data with live HubSpot CRM data.

## Prerequisites
- HubSpot account (free or paid)
- Access to HubSpot Developer Portal

## Step 1: Create HubSpot Developer App

### 1.1 Access HubSpot Developer Portal
1. Go to [HubSpot Developer Portal](https://developers.hubspot.com/)
2. Sign in with your HubSpot account
3. Navigate to "Apps" > "Create app"

### 1.2 Configure App Settings
1. **App Name**: `Nexus CRM Integration`
2. **App Description**: `Nexus CRM integration for unified client management`
3. **App Type**: Choose "Custom app"

### 1.3 Configure OAuth Settings
1. Go to "Auth" > "OAuth"
2. **Client ID**: Copy this value (you'll need it for environment variables)
3. **Client Secret**: Copy this value (you'll need it for environment variables)
4. **Redirect URLs**: Add the following:
   ```
   http://localhost:5173/integrations/hubspot/callback
   https://nexus.marcoby.com/integrations/hubspot/callback
   ```

### 1.4 Configure Scopes
Add the following scopes to your app:
- `contacts` - Contact access
- `crm.objects.contacts.read` - Read contact data
- `crm.objects.contacts.write` - Write contact data
- `crm.objects.companies.read` - Read company data
- `crm.objects.companies.write` - Write company data
- `crm.objects.deals.read` - Read deal data
- `crm.objects.deals.write` - Write deal data
- `crm.schemas.contacts.read` - Read contact schemas
- `crm.schemas.companies.read` - Read company schemas
- `crm.schemas.deals.read` - Read deal schemas

## Step 2: Configure Environment Variables

### 2.1 Local Development
Create or update your `.env.local` file:
```bash
# HubSpot Configuration
VITE_HUBSPOT_CLIENT_ID=your_hubspot_client_id_here
VITE_HUBSPOT_CLIENT_SECRET=your_hubspot_client_secret_here
HUBSPOT_CLIENT_ID=your_hubspot_client_id_here
HUBSPOT_CLIENT_SECRET=your_hubspot_client_secret_here
```

### 2.2 Production Environment
Add these environment variables to your production environment:
- `VITE_HUBSPOT_CLIENT_ID`
- `VITE_HUBSPOT_CLIENT_SECRET`
- `HUBSPOT_CLIENT_ID`
- `HUBSPOT_CLIENT_SECRET`

## Step 3: Test the Integration

### 3.1 Connect HubSpot
1. Navigate to `/integrations` in your Nexus application
2. Find HubSpot in the integrations list
3. Click "Connect"
4. Complete the OAuth flow with your HubSpot account

### 3.2 Verify Data Sync
1. After connection, navigate to `/integrations/client-intelligence`
2. Click "Populate from Integrations"
3. Check that real HubSpot data appears in the unified clients module

## Step 4: Troubleshooting

### Common Issues

#### "Invalid client_id or redirect_uri"
- Verify your HubSpot app redirect URLs match exactly
- Check that environment variables are properly set
- Ensure you're using the correct client ID and secret

#### "No data synced"
- Verify OAuth scopes are properly configured
- Check that your HubSpot account has contacts/companies/deals
- Review the sync logs in the browser console

#### "OAuth flow fails"
- Ensure your HubSpot app is properly configured
- Check that redirect URLs are accessible
- Verify environment variables are loaded correctly

## Step 5: Data Verification

### Expected Data Structure
After successful integration, you should see:
- **Contacts**: Real HubSpot contacts with names, emails, companies
- **Companies**: Real HubSpot companies with industry, size, revenue
- **Deals**: Real HubSpot deals with amounts, stages, close dates
- **Unified Profiles**: AI-generated unified client profiles with insights

### Data Refresh
- Data syncs automatically every 24 hours
- Manual sync available via "Populate from Integrations" button
- Real-time updates for new contacts/companies/deals

## Security Notes
- Never commit HubSpot credentials to version control
- Use environment variables for all sensitive data
- Regularly rotate HubSpot app credentials
- Monitor OAuth token expiration and refresh

## Support
If you encounter issues:
1. Check the browser console for error messages
2. Verify HubSpot app configuration
3. Review environment variable setup
4. Check Supabase logs for sync errors
