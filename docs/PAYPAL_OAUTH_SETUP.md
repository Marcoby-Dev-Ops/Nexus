# 🔐 PayPal OAuth Setup Guide

## 🚨 Current Issue
The PayPal integration is failing with "Invalid client_id parameter" because the PayPal OAuth credentials are not configured.

## 📋 Prerequisites
1. PayPal Developer Account (https://developer.paypal.com/)
2. Access to PayPal Developer Dashboard
3. Supabase project with Edge Functions enabled

## 🛠️ Step-by-Step Setup

### **1. Create PayPal App**

1. **Login to PayPal Developer Dashboard**
   - Go to https://developer.paypal.com/
   - Sign in with your PayPal account

2. **Create New App**
   - Navigate to "My Apps & Credentials"
   - Click "Create App"
   - Enter app name: "Nexus Business Intelligence"
   - Select "Business" account type
   - Click "Create App"

3. **Configure OAuth Settings**
   - In your app settings, go to "OAuth Settings"
   - Add redirect URI: `https://kqclbpimkraenvbffnpk.supabase.co/functions/v1/paypal_oauth_callback`
   - Save changes

### **2. Get Credentials**

1. **Copy Client ID and Secret**
   - From your PayPal app dashboard, copy:
     - **Client ID** (starts with `AQ...`)
     - **Client Secret** (starts with `EF...`)

2. **Environment Configuration**
   - Update your `.env` file with real credentials:

```bash
# Frontend (Vite) - Client-side safe
VITE_PAYPAL_CLIENT_ID=AQE...your_actual_client_id_here
VITE_PAYPAL_ENV=sandbox

# Backend (Supabase) - Server-side
PAYPAL_CLIENT_ID=AQE...your_actual_client_id_here
PAYPAL_CLIENT_SECRET=EF...your_actual_client_secret_here
PAYPAL_ENV=sandbox
```

### **3. Environment Configuration**

Replace the placeholder values in your `.env` file:

```bash
# Current (placeholder values)
VITE_PAYPAL_CLIENT_ID=your_paypal_client_id_here
VITE_PAYPAL_ENV=sandbox
PAYPAL_CLIENT_ID=your_paypal_client_id_here
PAYPAL_CLIENT_SECRET=your_paypal_client_secret_here
PAYPAL_ENV=sandbox

# Replace with actual values from PayPal Developer Dashboard
VITE_PAYPAL_CLIENT_ID=AQE...your_actual_client_id
VITE_PAYPAL_ENV=sandbox
PAYPAL_CLIENT_ID=AQE...your_actual_client_id
PAYPAL_CLIENT_SECRET=EF...your_actual_client_secret
PAYPAL_ENV=sandbox
```

### **4. Deploy Edge Functions**

After updating credentials, redeploy the PayPal Edge Functions:

```bash
# Deploy PayPal OAuth callback function
npx supabase functions deploy paypal_oauth_callback

# Deploy PayPal token refresh function
npx supabase functions deploy paypal_refresh_token

# Deploy PayPal sync function
npx supabase functions deploy paypal_sync
```

### **5. Test Configuration**

1. **Restart Development Server**
   ```bash
   pnpm run dev
   ```

2. **Test PayPal Connection**
   - Go to Integrations page
   - Click "Connect PayPal"
   - Should redirect to PayPal OAuth without "Invalid client_id" error

## 🔧 Troubleshooting

### **Common Issues**

1. **"Invalid client_id parameter"**
   - ✅ **Solution**: Replace placeholder values with actual PayPal credentials
   - ✅ **Check**: Ensure `VITE_PAYPAL_CLIENT_ID` is set correctly

2. **"Redirect URI mismatch"**
   - ✅ **Solution**: Verify redirect URI in PayPal Developer Dashboard matches exactly
   - ✅ **Check**: `https://kqclbpimkraenvbffnpk.supabase.co/functions/v1/paypal_oauth_callback`

3. **"Environment mismatch"**
   - ✅ **Solution**: Ensure `PAYPAL_ENV` is set to `sandbox` for testing
   - ✅ **Production**: Change to `live` when ready for production

### **Environment Variables Checklist**

```bash
# ✅ Required for Frontend
VITE_PAYPAL_CLIENT_ID=AQE...actual_client_id
VITE_PAYPAL_ENV=sandbox

# ✅ Required for Backend (Edge Functions)
PAYPAL_CLIENT_ID=AQE...actual_client_id
PAYPAL_CLIENT_SECRET=EF...actual_client_secret
PAYPAL_ENV=sandbox
```

## 🚀 Production Setup

When ready for production:

1. **Switch to Live Environment**
   ```bash
   PAYPAL_ENV=live
   VITE_PAYPAL_ENV=live
   ```

2. **Update Redirect URI**
   - Change to production Supabase URL
   - Update in PayPal Developer Dashboard

3. **Deploy Edge Functions**
   ```bash
   npx supabase functions deploy --project-ref kqclbpimkraenvbffnpk
   ```

## 📞 Support

If you need help:
1. Check PayPal Developer Dashboard for app status
2. Verify environment variables are set correctly
3. Check Supabase Edge Function logs for errors
4. Contact PayPal Developer Support if needed

---

**Next Steps**: After setting up credentials, test the PayPal integration to ensure OAuth flow works correctly. 