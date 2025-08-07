# 🔧 PayPal OAuth Troubleshooting Guide

## 🚨 **Current Issues & Solutions**

### **Issue 1: "Invalid client_id parameter" Error**

**Cause**: PayPal OAuth credentials not properly configured or redirect URI mismatch.

**Solutions**:

1. **Verify PayPal Developer Dashboard Configuration**:
   - Go to https://developer.paypal.com/
   - Navigate to "My Apps & Credentials"
   - Select your PayPal app
   - Go to "OAuth Settings"
   - **Add this exact redirect URI**:
     ```
     https://kqclbpimkraenvbffnpk.supabase.co/functions/v1/paypal_oauth_callback
     ```
   - **Ensure environment is set to "Live"** (since your `.env` has `PAYPAL_ENV=live`)

2. **Check Environment Variables**:
   ```bash
   # Your current .env configuration (✅ Correct)
   VITE_PAYPAL_CLIENT_ID=AaQNTYbHVp4MtQ2MTG2Yu0ettQHuoFrUV-w4l4qs6k3A-tx0tD_qc0f59ely7902AOoYMpTzs8t3-YlX
   VITE_PAYPAL_ENV=live
   PAYPAL_CLIENT_ID=AaQNTYbHVp4MtQ2MTG2Yu0ettQHuoFrUV-w4l4qs6k3A-tx0tD_qc0f59ely7902AOoYMpTzs8t3-YlX
   PAYPAL_CLIENT_SECRET=EJcmFwolmBVRwAaxjaQLDmNenYwaHQISSHPdcMxwISbjcpijDZ_Gt3hfSUjBfPAG09Xvo3iwo7LCVFRk
   PAYPAL_ENV=live
   ```

### **Issue 2: "Redirect URI mismatch" Error**

**Cause**: The redirect URI in PayPal Developer Dashboard doesn't match the one in your OAuth request.

**Solution**:
1. **In PayPal Developer Dashboard**, ensure the redirect URI is exactly:
   ```
   https://kqclbpimkraenvbffnpk.supabase.co/functions/v1/paypal_oauth_callback
   ```
2. **No trailing slashes** or extra characters
3. **Case sensitive** - must match exactly

### **Issue 3: Edge Function Environment Variables**

**Cause**: Supabase Edge Functions don't have access to PayPal credentials.

**Solution**:
1. **Go to Supabase Dashboard**: https://supabase.com/dashboard/project/kqclbpimkraenvbffnpk
2. **Navigate to Settings → Edge Functions**
3. **Add these environment variables**:
   ```
   PAYPAL_CLIENT_ID=AaQNTYbHVp4MtQ2MTG2Yu0ettQHuoFrUV-w4l4qs6k3A-tx0tD_qc0f59ely7902AOoYMpTzs8t3-YlX
   PAYPAL_CLIENT_SECRET=EJcmFwolmBVRwAaxjaQLDmNenYwaHQISSHPdcMxwISbjcpijDZ_Gt3hfSUjBfPAG09Xvo3iwo7LCVFRk
   PAYPAL_ENV=live
   ```

### **Issue 4: OAuth Flow Configuration**

**Cause**: OAuth scopes or parameters not properly configured.

**Solution**:
The OAuth URL should be:
```
https://www.paypal.com/signin/authorize?response_type=code&client_id=YOUR_CLIENT_ID&scope=openid%20profile%20https://uri.paypal.com/services/paypalattributes&redirect_uri=https://kqclbpimkraenvbffnpk.supabase.co/functions/v1/paypal_oauth_callback&state=YOUR_STATE
```

## 🧪 **Testing Steps**

### **Step 1: Test OAuth Flow**
1. **Open the test page**: `test-paypal-oauth.html`
2. **Click "Test PayPal OAuth"**
3. **Check debug information** for any errors
4. **Complete the PayPal authorization** in the popup

### **Step 2: Check Edge Function Logs**
1. **Go to Supabase Dashboard**
2. **Navigate to Edge Functions → paypal_oauth_callback**
3. **Check the logs** for any errors or debugging information

### **Step 3: Verify Database Integration**
```sql
-- Check if PayPal integration exists
SELECT * FROM integrations WHERE slug = 'paypal';

-- Check if user integrations are being created
SELECT ui.*, i.name as integration_name 
FROM user_integrations ui 
JOIN integrations i ON ui.integration_id = i.id 
WHERE i.slug = 'paypal';
```

## 🔍 **Debugging Checklist**

### **Frontend Issues**:
- [ ] `VITE_PAYPAL_CLIENT_ID` is set correctly
- [ ] `VITE_PAYPAL_ENV` is set to `live`
- [ ] OAuth popup opens without errors
- [ ] Redirect URI matches exactly

### **Backend Issues**:
- [ ] `PAYPAL_CLIENT_ID` is set in Supabase Edge Functions
- [ ] `PAYPAL_CLIENT_SECRET` is set in Supabase Edge Functions
- [ ] `PAYPAL_ENV` is set to `live` in Supabase Edge Functions
- [ ] Edge Function logs show successful token exchange
- [ ] User integration is stored in database

### **PayPal Developer Dashboard**:
- [ ] App is configured for "Live" environment
- [ ] Redirect URI is exactly: `https://kqclbpimkraenvbffnpk.supabase.co/functions/v1/paypal_oauth_callback`
- [ ] OAuth settings are saved
- [ ] App is active and not in development mode

## 🚀 **Quick Fix Commands**

```bash
# Deploy updated Edge Functions
npx supabase functions deploy paypal_oauth_callback
npx supabase functions deploy paypal_refresh_token

# Check Edge Function logs
npx supabase functions logs paypal_oauth_callback

# Test the OAuth flow
open test-paypal-oauth.html
```

## 📞 **Common Error Messages & Solutions**

| Error Message | Cause | Solution |
|---------------|-------|----------|
| "Invalid client_id parameter" | Wrong client ID or environment | Verify PayPal Developer Dashboard configuration |
| "Redirect URI mismatch" | Redirect URI doesn't match | Add exact redirect URI to PayPal app |
| "Missing PayPal credentials" | Edge Function env vars not set | Add PayPal credentials to Supabase Edge Functions |
| "PayPal integration not found" | Database issue | Check integrations table for PayPal entry |
| "Popup blocked" | Browser security | Allow popups for the site |

## 🎯 **Expected Flow**

1. **User clicks "Connect PayPal"**
2. **OAuth popup opens** with PayPal authorization
3. **User authorizes** the application
4. **PayPal redirects** to Edge Function
5. **Edge Function exchanges** code for tokens
6. **Tokens are stored** in user_integrations table
7. **Popup closes** and shows success message
8. **Integration status** updates in the app

## 🔧 **If Still Not Working**

1. **Check Supabase Edge Function logs** for detailed error messages
2. **Verify PayPal Developer Dashboard** configuration
3. **Test with the provided test page** (`test-paypal-oauth.html`)
4. **Check browser console** for any JavaScript errors
5. **Verify all environment variables** are set correctly

## 📋 **Environment Variables Checklist**

```bash
# Frontend (.env)
VITE_PAYPAL_CLIENT_ID=AaQNTYbHVp4MtQ2MTG2Yu0ettQHuoFrUV-w4l4qs6k3A-tx0tD_qc0f59ely7902AOoYMpTzs8t3-YlX ✅
VITE_PAYPAL_ENV=live ✅

# Backend (Supabase Edge Functions)
PAYPAL_CLIENT_ID=AaQNTYbHVp4MtQ2MTG2Yu0ettQHuoFrUV-w4l4qs6k3A-tx0tD_qc0f59ely7902AOoYMpTzs8t3-YlX ✅
PAYPAL_CLIENT_SECRET=EJcmFwolmBVRwAaxjaQLDmNenYwaHQISSHPdcMxwISbjcpijDZ_Gt3hfSUjBfPAG09Xvo3iwo7LCVFRk ✅
PAYPAL_ENV=live ✅
``` 