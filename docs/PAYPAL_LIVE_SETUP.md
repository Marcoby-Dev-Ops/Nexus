# 🔐 PayPal Live Mode Setup Guide

## 🚨 **Current Issue Fixed**
Your PayPal integration was configured for **sandbox mode** but you want to connect to your **live PayPal account**. This guide will help you complete the setup.

## ✅ **What's Already Fixed**

1. **Environment Variables Updated**:
   - `VITE_PAYPAL_ENV=live` ✅
   - `PAYPAL_ENV=live` ✅
   - Your PayPal Client ID and Secret are already configured ✅

2. **Frontend Code Updated**:
   - PayPal OAuth will now redirect to `https://www.paypal.com` (live) instead of sandbox ✅

## 🔧 **Manual Steps Required**

### **Step 1: Update Supabase Edge Function Environment Variables**

1. **Go to Supabase Dashboard**:
   - Visit: https://supabase.com/dashboard/project/kqclbpimkraenvbffnpk
   - Navigate to **Settings** → **Edge Functions**

2. **Update Environment Variables**:
   ```
   PAYPAL_ENV=live
   PAYPAL_CLIENT_ID=AaQNTYbHVp4MtQ2MTG2Yu0ettQHuoFrUV-w4l4qs6k3A-tx0tD_qc0f59ely7902AOoYMpTzs8t3-YlX
   PAYPAL_CLIENT_SECRET=EJcmFwolmBVRwAaxjaQLDmNenYwaHQISSHPdcMxwISbjcpijDZ_Gt3hfSUjBfPAG09Xvo3iwo7LCVFRk
   ```

### **Step 2: Update PayPal Developer Dashboard**

1. **Go to PayPal Developer Dashboard**:
   - Visit: https://developer.paypal.com/
   - Sign in with your PayPal account

2. **Update Your App Settings**:
   - Navigate to "My Apps & Credentials"
   - Select your PayPal app
   - Go to "OAuth Settings"
   - **IMPORTANT**: Change the environment from "Sandbox" to "Live"
   - Update redirect URI to use live environment:
     ```
     https://kqclbpimkraenvbffnpk.supabase.co/functions/v1/paypal_oauth_callback
     ```

3. **Get Live Credentials**:
   - Copy the **Live Client ID** (starts with `AQ...`)
   - Copy the **Live Client Secret** (starts with `EF...`)
   - Update your `.env` file with these live credentials

### **Step 3: Update Environment Variables**

Update your `.env` file with the live credentials:

```bash
# Frontend (Vite)
VITE_PAYPAL_CLIENT_ID=AQ...your_live_client_id_here
VITE_PAYPAL_ENV=live

# Backend (Supabase)
PAYPAL_CLIENT_ID=AQ...your_live_client_id_here
PAYPAL_CLIENT_SECRET=EF...your_live_client_secret_here
PAYPAL_ENV=live
```

### **Step 4: Redeploy Edge Functions**

Run these commands to redeploy the PayPal Edge Functions:

```bash
# Deploy PayPal OAuth callback function
npx supabase functions deploy paypal_oauth_callback

# Deploy PayPal token refresh function
npx supabase functions deploy paypal_refresh_token

# Deploy PayPal sync function
npx supabase functions deploy paypal_sync
```

### **Step 5: Restart Development Server**

```bash
pnpm run dev
```

## 🔍 **Testing the Setup**

1. **Test PayPal Connection**:
   - Go to your Nexus app
   - Navigate to Integrations → PayPal
   - Click "Connect PayPal"
   - Should redirect to live PayPal (not sandbox)

2. **Verify Environment**:
   - The OAuth URL should be: `https://www.paypal.com/signin/authorize`
   - Not: `https://www.sandbox.paypal.com/signin/authorize`

## 🚨 **Important Notes**

### **Live vs Sandbox Differences**:

| Feature | Sandbox | Live |
|---------|---------|------|
| Environment | Test | Production |
| Transactions | Fake | Real |
| Credentials | Test App | Live App |
| Dashboard | developer.paypal.com | developer.paypal.com |
| API Base | api.sandbox.paypal.com | api.paypal.com |

### **Security Considerations**:
- ✅ Live credentials have access to real money
- ✅ Keep your live credentials secure
- ✅ Never commit live credentials to version control
- ✅ Use environment variables for all credentials

## 🔧 **Troubleshooting**

### **Common Issues**:

1. **"Invalid client_id" Error**:
   - ✅ **Solution**: Ensure you're using live credentials from PayPal Developer Dashboard
   - ✅ **Check**: Verify `PAYPAL_ENV=live` in both frontend and backend

2. **"Redirect URI mismatch"**:
   - ✅ **Solution**: Update redirect URI in PayPal Developer Dashboard to match exactly
   - ✅ **Check**: `https://kqclbpimkraenvbffnpk.supabase.co/functions/v1/paypal_oauth_callback`

3. **Still redirecting to sandbox**:
   - ✅ **Solution**: Clear browser cache and restart development server
   - ✅ **Check**: Verify all environment variables are set to `live`

### **Environment Variables Checklist**:

```bash
# ✅ Required for Frontend
VITE_PAYPAL_CLIENT_ID=AQ...live_client_id
VITE_PAYPAL_ENV=live

# ✅ Required for Backend (Edge Functions)
PAYPAL_CLIENT_ID=AQ...live_client_id
PAYPAL_CLIENT_SECRET=EF...live_client_secret
PAYPAL_ENV=live
```

## 🎯 **Next Steps**

After completing this setup:

1. **Test the Integration**: Try connecting PayPal again
2. **Monitor Transactions**: Check that real transaction data is being synced
3. **Update Documentation**: Update any internal docs to reflect live mode
4. **Monitor Logs**: Keep an eye on Supabase logs for any issues

## 📞 **Support**

If you encounter issues:

1. **Check Supabase Logs**: Monitor Edge Function logs for errors
2. **Verify Credentials**: Double-check all environment variables
3. **Test in Browser**: Check browser console for any JavaScript errors
4. **Contact Support**: If issues persist, check PayPal Developer documentation

---

**✅ You're now ready to connect to your live PayPal account!** 