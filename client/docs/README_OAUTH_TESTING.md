# OAuth Integration Testing Guide

## Overview

This guide explains how to test the OAuth integration functionality for HubSpot and Microsoft 365 in the Nexus platform.

## What We've Implemented

### Backend (Server)
- ✅ **Database Migration**: Enhanced `user_integrations` table with OAuth fields
- ✅ **OAuth Services**: Base OAuth service with PKCE and state management
- ✅ **HubSpot OAuth Service**: HubSpot-specific OAuth implementation
- ✅ **Microsoft 365 OAuth Service**: Microsoft Graph API OAuth with mail sync
- ✅ **Sync Service**: Manual sync operations for all integrations
- ✅ **API Endpoints**: OAuth provider routes for starting and completing flows

### Frontend (Client)
- ✅ **OAuth Types**: Enhanced integration types with OAuth-specific fields
- ✅ **OAuth Service**: Client-side service for OAuth operations
- ✅ **OAuth Hook**: React hook for managing OAuth state
- ✅ **OAuth Components**: Integration cards, connection modal, callback page
- ✅ **Test Page**: Dedicated test page for OAuth functionality

## How to Test

### 1. Start the Backend

Make sure your backend server is running with the OAuth services:

```bash
cd server
npm start
```

### 2. Set Environment Variables

Ensure these environment variables are set in your `.env` file:

```bash
# HubSpot OAuth
HUBSPOT_CLIENT_ID=your_hubspot_client_id
HUBSPOT_CLIENT_SECRET=your_hubspot_client_secret

# Microsoft 365 OAuth
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret

# Database
DATABASE_URL=your_database_connection_string
```

### 3. Access the Test Page

Navigate to the OAuth test page in your browser:

```
http://localhost:3000/integrations/test-oauth
```

### 4. Test OAuth Flow

1. **Click "Connect OAuth"** button
2. **Choose a provider** (HubSpot CRM or Microsoft 365)
3. **Click "Connect"** to start the OAuth flow
4. **Authorize** the application on the provider's page
5. **Complete** the OAuth callback
6. **View** the connected integration in your dashboard

## Test Page Features

### OAuth Status Overview
- Total integrations count
- Connected integrations count
- Disconnected integrations count
- Error count
- Pending count

### Integration Management
- **Connect**: Start new OAuth flows
- **Disconnect**: Remove existing integrations
- **Manual Sync**: Trigger data synchronization
- **Test Connection**: Verify integration health

### Integration Details
- Provider information (HubSpot/Microsoft)
- Connection status
- Last sync timestamp
- Token expiration
- Error messages (if any)

## Expected Behavior

### Successful OAuth Flow
1. User clicks "Connect OAuth"
2. Modal opens with provider selection
3. User selects provider and clicks "Connect"
4. Browser redirects to provider's OAuth page
5. User authorizes the application
6. Browser redirects back to callback page
7. Integration is created and status shows "connected"
8. User can perform manual sync and other operations

### Error Handling
- Invalid OAuth parameters show error messages
- Failed connections display error details
- Network issues are caught and displayed
- Users can retry failed operations

## Troubleshooting

### Common Issues

1. **"Failed to start OAuth flow"**
   - Check backend server is running
   - Verify environment variables are set
   - Check browser console for detailed errors

2. **"Invalid OAuth callback parameters"**
   - Ensure OAuth state is properly stored in sessionStorage
   - Check that callback URL matches redirect URI

3. **"Integration not appearing"**
   - Check database for created integration
   - Verify OAuth callback completed successfully
   - Check browser console for API errors

### Debug Steps

1. **Check Backend Logs**
   ```bash
   cd server
   npm run dev
   ```

2. **Check Browser Console**
   - Open Developer Tools
   - Look for network requests and errors
   - Check sessionStorage for OAuth state

3. **Check Database**
   ```sql
   SELECT * FROM user_integrations WHERE integration_type = 'oauth';
   ```

## Next Steps

After successful testing:

1. **Integrate with Main Dashboard**: Add OAuth functionality to the main integrations dashboard
2. **Add More Providers**: Extend to support additional OAuth providers
3. **Enhanced Sync**: Implement automated sync scheduling
4. **Data Visualization**: Add charts and analytics for synced data
5. **Error Monitoring**: Implement comprehensive error tracking and alerting

## Architecture Notes

- **PKCE Flow**: Uses PKCE (Proof Key for Code Exchange) for enhanced security
- **State Management**: OAuth state is stored in sessionStorage for callback verification
- **Token Encryption**: Access tokens are encrypted before database storage
- **Row Level Security**: Database implements RLS for data protection
- **Service Pattern**: Follows the established service pattern used throughout Nexus

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review backend logs for detailed error information
3. Verify all environment variables are correctly set
4. Ensure database migration has been applied successfully
