# 🔐 OAuth Configuration Guide

## 🚨 "Invalid client_id or redirect_uri" Error Fix

This error occurs when OAuth providers can't validate your application credentials. Here's how to fix it:

### **🔧 Quick Fixes Applied**

#### **1. Environment Variables Fixed**
- ✅ Added `VITE_GOOGLE_CLIENT_SECRET` for frontend access
- ✅ Updated `GOOGLE_REDIRECT_URI` to production URL
- ✅ Updated `MICROSOFT_REDIRECT_URI` to production URL
- ✅ Fixed redirect URIs in code to use production URLs

#### **2. Code Updates Made**
- ✅ Microsoft 365 Setup: Uses production redirect URI
- ✅ Microsoft 365 Callback: Uses production redirect URI  
- ✅ Microsoft Teams Service: Uses production redirect URI
- ✅ Google OAuth: Uses production redirect URI

### **🎯 Provider-Specific Setup**

#### **Google OAuth**
1. **Google Cloud Console Setup**:
   - Go to https://console.cloud.google.com/
   - Select your project
   - Navigate to "APIs & Services" > "Credentials"
   - Edit your OAuth 2.0 Client ID
   - Add authorized redirect URIs:
     ```
     https://nexus.marcoby.com/integrations/google/callback
     https://nexus.marcoby.com/integrations/google-analytics/callback
     https://nexus.marcoby.com/integrations/google-workspace/callback
     ```

2. **Environment Variables**:
   ```bash
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_REDIRECT_URI=https://nexus.marcoby.com/integrations/google/callback
   ```

#### **Microsoft OAuth**
1. **Azure Portal Setup**:
   - Go to https://portal.azure.com/
   - Navigate to "Azure Active Directory" > "App registrations"
   - Select your app
   - Go to "Authentication"
   - Add redirect URIs:
     ```
     https://nexus.marcoby.com/integrations/microsoft/callback
     ```

2. **Environment Variables**:
   ```bash
   VITE_MICROSOFT_CLIENT_ID=your_microsoft_client_id
   MICROSOFT_CLIENT_ID=your_microsoft_client_id
   MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
   MICROSOFT_REDIRECT_URI=https://nexus.marcoby.com/integrations/microsoft/callback
   ```

#### **PayPal OAuth**
1. **PayPal Developer Setup**:
   - Go to https://developer.paypal.com/
   - Navigate to "My Apps & Credentials"
   - Edit your app
   - Add redirect URI:
     ```
     https://kqclbpimkraenvbffnpk.supabase.co/functions/v1/paypal_oauth_callback
     ```

2. **Environment Variables**:
   ```bash
   VITE_PAYPAL_CLIENT_ID=your_paypal_client_id
   VITE_PAYPAL_ENV=sandbox
   PAYPAL_CLIENT_ID=your_paypal_client_id
   PAYPAL_CLIENT_SECRET=your_paypal_client_secret
   PAYPAL_ENV=sandbox
   ```

#### **HubSpot OAuth**
1. **HubSpot Developer Setup**:
   - Go to https://developers.hubspot.com/
   - Navigate to "Apps" > "Create app"
   - Configure OAuth settings
   - Add redirect URI:
     ```
     https://nexus.marcoby.com/integrations/hubspot/callback
     ```

2. **Environment Variables**:
   ```bash
   VITE_HUBSPOT_CLIENT_ID=your_hubspot_client_id
   HUBSPOT_CLIENT_ID=your_hubspot_client_id
   HUBSPOT_CLIENT_SECRET=your_hubspot_client_secret
   ```

#### **Slack OAuth**
1. **Slack App Setup**:
   - Go to https://api.slack.com/apps
   - Create new app
   - Configure OAuth & Permissions
   - Add redirect URI:
     ```
     https://nexus.marcoby.com/integrations/slack/callback
     ```

2. **Environment Variables**:
   ```bash
   VITE_SLACK_CLIENT_ID=your_slack_client_id
   SLACK_CLIENT_ID=your_slack_client_id
   SLACK_CLIENT_SECRET=your_slack_client_secret
   ```

### **🔍 Troubleshooting Steps**

#### **1. Check Environment Variables**
```bash
# Verify all required variables are set
echo $VITE_GOOGLE_CLIENT_ID
echo $VITE_MICROSOFT_CLIENT_ID
echo $VITE_PAYPAL_CLIENT_ID
echo $VITE_HUBSPOT_CLIENT_ID
echo $VITE_SLACK_CLIENT_ID
```

#### **2. Verify Redirect URIs**
- Ensure redirect URIs in provider dashboards match your environment
- Check for trailing slashes or protocol mismatches
- Verify domain names are correct

#### **3. Check Client IDs**
- Ensure client IDs are copied correctly from provider dashboards
- Verify no extra spaces or characters
- Check that you're using the correct environment (sandbox vs production)

#### **4. Test Individual Integrations**
```bash
# Test Google OAuth
curl "https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&response_type=code&scope=openid%20email%20profile"

# Test Microsoft OAuth  
curl "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&response_type=code&scope=openid%20profile%20email"
```

### **🚀 Common Solutions**

#### **Solution 1: Redirect URI Mismatch**
- **Problem**: Redirect URI in code doesn't match provider dashboard
- **Fix**: Update provider dashboard with correct redirect URI

#### **Solution 2: Client ID Issues**
- **Problem**: Using wrong client ID or environment
- **Fix**: Verify you're using the correct client ID for your environment

#### **Solution 3: Environment Variables**
- **Problem**: Missing or incorrect environment variables
- **Fix**: Ensure all required variables are set in `.env` file

#### **Solution 4: Domain Issues**
- **Problem**: Using localhost in production or wrong domain
- **Fix**: Update all redirect URIs to use production domain

### **📋 Checklist**

- [ ] All environment variables are set correctly
- [ ] Redirect URIs match between code and provider dashboards
- [ ] Client IDs are copied correctly from provider dashboards
- [ ] Using correct environment (sandbox vs production)
- [ ] Domain names are correct and consistent
- [ ] No trailing slashes in redirect URIs
- [ ] Protocol matches (https vs http)

### **🆘 Still Having Issues?**

If you're still getting the "invalid client_id or redirect_uri" error:

1. **Check the browser console** for specific error messages
2. **Verify the exact integration** that's failing
3. **Test with a simple OAuth flow** first
4. **Check provider logs** for detailed error information
5. **Verify your app is properly configured** in the provider dashboard

### **📞 Support**

For additional help:
- Check provider-specific documentation
- Review OAuth 2.0 specification
- Test with provider's OAuth playground tools
- Contact provider support if needed 