# 🔐 OAuth Troubleshooting Guide

## 🚨 Common OAuth Errors

### **"invalid client_id or redirect_uri" Error**

This error occurs when the OAuth configuration doesn't match what's expected by the OAuth provider.

## 🔍 **Diagnosis Steps**

### **1. Check Environment Variables**

Verify all OAuth credentials are properly configured:

```bash
# Check if these are set correctly
echo $VITE_MICROSOFT_CLIENT_ID
echo $VITE_GOOGLE_CLIENT_ID
echo $VITE_HUBSPOT_CLIENT_ID
echo $VITE_PAYPAL_CLIENT_ID
echo $VITE_SLACK_CLIENT_ID
```

### **2. Verify Redirect URIs**

Each OAuth provider expects specific redirect URIs. Check these match:

#### **Microsoft 365**
- **Expected**: `https://nexus.marcoby.com/integrations/microsoft/callback`
- **Current**: `http://localhost:5173/integrations/microsoft/callback`

#### **Google**
- **Expected**: `https://nexus.marcoby.com/integrations/google/callback`
- **Current**: `https://kqclbpimkraenvbffnpk.supabase.co/auth/v1/callback`

#### **HubSpot**
- **Expected**: `https://nexus.marcoby.com/integrations/hubspot/callback`
- **Current**: ✅ Correct

#### **PayPal**
- **Expected**: `https://kqclbpimkraenvbffnpk.supabase.co/functions/v1/paypal_oauth_callback`
- **Current**: ✅ Correct

## 🛠️ **Fix Instructions**

### **1. Update Environment Variables**

Update your `.env` file with the correct redirect URIs:

```bash
# Microsoft 365
MICROSOFT_REDIRECT_URI=https://nexus.marcoby.com/integrations/microsoft/callback

# Google
GOOGLE_REDIRECT_URI=https://nexus.marcoby.com/integrations/google/callback

# Slack (if you have credentials)
VITE_SLACK_CLIENT_ID=your_actual_slack_client_id
SLACK_CLIENT_ID=your_actual_slack_client_id
SLACK_CLIENT_SECRET=your_actual_slack_client_secret
```

### **2. Update OAuth Provider Dashboards**

#### **Microsoft Azure Portal**
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to "Azure Active Directory" → "App registrations"
3. Find your app (Client ID: `985c4c24-faa8-4865-912d-2d67b2a16a6c`)
4. Go to "Authentication"
5. Add redirect URI: `https://nexus.marcoby.com/integrations/microsoft/callback`
6. Save changes

#### **Google Cloud Console**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to "APIs & Services" → "Credentials"
3. Find your OAuth 2.0 Client ID
4. Add redirect URI: `https://nexus.marcoby.com/integrations/google/callback`
5. Save changes

#### **Slack App Settings**
1. Go to [Slack API Apps](https://api.slack.com/apps)
2. Create or find your app
3. Go to "OAuth & Permissions"
4. Add redirect URI: `https://nexus.marcoby.com/integrations/slack/callback`
5. Save changes

### **3. Test Each Integration**

After updating, test each integration:

```bash
# Test Microsoft 365
curl -I "https://nexus.marcoby.com/integrations/microsoft/callback"

# Test Google
curl -I "https://nexus.marcoby.com/integrations/google/callback"

# Test HubSpot
curl -I "https://nexus.marcoby.com/integrations/hubspot/callback"
```

## 🔧 **Quick Fix Script**

Run this script to update your environment variables:

```bash
#!/bin/bash

# Backup current .env
cp .env .env.backup

# Update redirect URIs
sed -i 's|MICROSOFT_REDIRECT_URI=http://localhost:5173/integrations/microsoft/callback|MICROSOFT_REDIRECT_URI=https://nexus.marcoby.com/integrations/microsoft/callback|g' .env
sed -i 's|GOOGLE_REDIRECT_URI=https://kqclbpimkraenvbffnpk.supabase.co/auth/v1/callback|GOOGLE_REDIRECT_URI=https://nexus.marcoby.com/integrations/google/callback|g' .env

echo "✅ Environment variables updated"
echo "⚠️  Remember to update OAuth provider dashboards"
```

## 🚨 **Emergency Fixes**

### **If you need to test locally:**

```bash
# For local development, use localhost redirects
MICROSOFT_REDIRECT_URI=http://localhost:5173/integrations/microsoft/callback
GOOGLE_REDIRECT_URI=http://localhost:5173/integrations/google/callback
```

### **If you need to disable an integration temporarily:**

Comment out the problematic integration in your code:

```typescript
// Temporarily disable Slack integration
// const slackSetup = <SlackSetup />;
```

## 📞 **Support**

If you're still experiencing issues:

1. **Check browser console** for specific error messages
2. **Verify network requests** in browser dev tools
3. **Check OAuth provider logs** for detailed error information
4. **Test with a simple OAuth flow** to isolate the issue

## 🔒 **Security Notes**

- Never commit real OAuth credentials to version control
- Use environment variables for all sensitive data
- Regularly rotate OAuth client secrets
- Monitor OAuth callback URLs for security 