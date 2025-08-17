# 🔐 OAuth Integration Guide

## 📋 Overview

This guide covers OAuth 2.0 integration setup, configuration, and troubleshooting for all supported providers in Nexus.

## 🎯 Supported Providers

- **Microsoft 365** (Teams, Outlook, OneDrive, SharePoint)
- **Google Workspace** (Gmail, Calendar, Drive, Analytics)
- **PayPal** (Transactions, Payouts, Balance)
- **HubSpot** (Contacts, Companies, Deals)
- **Slack** (Messages, Channels, Users)

---

## 🚀 Quick Setup

### **Environment Variables**

```bash
# Microsoft 365
VITE_MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
MICROSOFT_REDIRECT_URI=https://nexus.marcoby.com/integrations/microsoft/callback

# Google Workspace
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://nexus.marcoby.com/integrations/google/callback

# PayPal
VITE_PAYPAL_CLIENT_ID=your_paypal_client_id
VITE_PAYPAL_ENV=sandbox
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_ENV=sandbox

# HubSpot
VITE_HUBSPOT_CLIENT_ID=your_hubspot_client_id
HUBSPOT_CLIENT_ID=your_hubspot_client_id
HUBSPOT_CLIENT_SECRET=your_hubspot_client_secret

# Slack
VITE_SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret
```

---

## 🔧 Provider-Specific Setup

### **Microsoft 365**

#### **Azure Portal Setup**
1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to "Azure Active Directory" > "App registrations"
3. Select your app
4. Go to "Authentication"
5. Add redirect URIs:
   ```
   https://nexus.marcoby.com/integrations/microsoft/callback
   ```

#### **Required Scopes**
- `User.Read` - Basic profile access
- `Mail.Read` - Email access
- `Calendars.Read` - Calendar access
- `Files.Read` - OneDrive access
- `Team.ReadBasic.All` - Teams access

### **Google Workspace**

#### **Google Cloud Console Setup**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to "APIs & Services" > "Credentials"
4. Edit your OAuth 2.0 Client ID
5. Add authorized redirect URIs:
   ```
   https://nexus.marcoby.com/integrations/google/callback
   https://nexus.marcoby.com/integrations/google-analytics/callback
   https://nexus.marcoby.com/integrations/google-workspace/callback
   ```

#### **Required APIs**
- Google Drive API
- Gmail API
- Google Calendar API
- Google Analytics API

### **PayPal**

#### **PayPal Developer Setup**
1. Go to [PayPal Developer](https://developer.paypal.com/)
2. Navigate to "My Apps & Credentials"
3. Edit your app
4. Add redirect URI:
   ```
   https://kqclbpimkraenvbffnpk.supabase.co/functions/v1/paypal_oauth_callback
   ```

### **HubSpot**

#### **HubSpot Developer Setup**
1. Go to [HubSpot Developer](https://developers.hubspot.com/)
2. Navigate to "Apps" > "Create app"
3. Configure OAuth settings
4. Add redirect URI:
   ```
   https://nexus.marcoby.com/integrations/hubspot/callback
   ```

### **Slack**

#### **Slack App Setup**
1. Go to [Slack API Apps](https://api.slack.com/apps)
2. Create or find your app
3. Go to "OAuth & Permissions"
4. Add redirect URI:
   ```
   https://nexus.marcoby.com/integrations/slack/callback
   ```

---

## 🚨 Troubleshooting

### **Common Errors**

#### **"invalid client_id or redirect_uri" Error**

This error occurs when OAuth configuration doesn't match provider expectations.

**Diagnosis Steps:**

1. **Check Environment Variables**
   ```bash
   echo $VITE_MICROSOFT_CLIENT_ID
   echo $VITE_GOOGLE_CLIENT_ID
   echo $VITE_HUBSPOT_CLIENT_ID
   echo $VITE_PAYPAL_CLIENT_ID
   echo $VITE_SLACK_CLIENT_ID
   ```

2. **Verify Redirect URIs**
   - Microsoft: `https://nexus.marcoby.com/integrations/microsoft/callback`
   - Google: `https://nexus.marcoby.com/integrations/google/callback`
   - HubSpot: `https://nexus.marcoby.com/integrations/hubspot/callback`
   - PayPal: `https://kqclbpimkraenvbffnpk.supabase.co/functions/v1/paypal_oauth_callback`

#### **"Access Denied" Error**

Usually caused by insufficient scopes or incorrect app configuration.

**Solutions:**
1. Verify required scopes are added to OAuth app
2. Check app permissions in provider dashboard
3. Ensure app is properly configured for production

#### **"Redirect URI Mismatch" Error**

The redirect URI in your code doesn't match the one configured in the OAuth provider.

**Fix:**
1. Update provider dashboard with correct redirect URI
2. Ensure environment variables use production URLs
3. Test redirect URI accessibility

### **Testing Integrations**

```bash
# Test Microsoft 365
curl -I "https://nexus.marcoby.com/integrations/microsoft/callback"

# Test Google
curl -I "https://nexus.marcoby.com/integrations/google/callback"

# Test HubSpot
curl -I "https://nexus.marcoby.com/integrations/hubspot/callback"
```

---

## 🔒 Security Best Practices

### **Credential Management**
- Store secrets in environment variables, never in code
- Use different client IDs for development and production
- Rotate client secrets regularly
- Use HTTPS for all OAuth callbacks

### **Token Security**
- Store refresh tokens securely in database
- Implement automatic token refresh
- Handle token expiration gracefully
- Log authentication events for security

### **Error Handling**
- Don't expose sensitive data in error messages
- Implement proper retry logic
- Log authentication failures securely
- Provide user-friendly error messages

---

## 📊 Integration Status

### **✅ Production Ready**
- Microsoft 365 (Teams, Outlook, OneDrive)
- PayPal (Transactions, Payouts)
- HubSpot (Contacts, Companies, Deals)

### **🔄 In Development**
- Google Workspace (Gmail, Calendar, Drive)
- Slack (Messages, Channels)

### **📋 Planned**
- GitHub (Repositories, Issues)
- Zendesk (Tickets, Users)
- Notion (Pages, Databases)

---

## 🎯 Next Steps

1. **Complete Google Workspace** integration
2. **Add GitHub** OAuth support
3. **Implement Slack** messaging integration
4. **Enhance security** with additional validation
5. **Add monitoring** for integration health

This unified OAuth system provides secure, scalable integration with any OAuth 2.0 provider while maintaining consistent patterns across all integrations.
