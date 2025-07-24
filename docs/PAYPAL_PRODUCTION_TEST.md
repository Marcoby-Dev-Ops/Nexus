# 🚀 PayPal Production OAuth Test

## **Production Checklist**

### **✅ Environment Variables**
- [ ] `VITE_PAYPAL_ENV=live`
- [ ] `PAYPAL_ENV=live`
- [ ] `VITE_PAYPAL_CLIENT_ID` = Live Client ID from PayPal Developer Dashboard
- [ ] `PAYPAL_CLIENT_ID` = Live Client ID (in Supabase Edge Functions)
- [ ] `PAYPAL_CLIENT_SECRET` = Live Client Secret (in Supabase Edge Functions)

### **✅ PayPal Developer Dashboard**
- [ ] App configured for "Live" environment
- [ ] Redirect URI: `https://kqclbpimkraenvbffnpk.supabase.co/functions/v1/paypal_oauth_callback`
- [ ] OAuth scopes: `openid profile https://uri.paypal.com/services/paypalattributes`
- [ ] App is active and approved

### **✅ Supabase Edge Functions**
- [ ] `paypal_oauth_callback` function deployed
- [ ] `paypal_refresh_token` function deployed
- [ ] Environment variables set in Supabase Dashboard

## **🧪 Production Test Steps**

### **1. Test OAuth Flow**
1. **Go to your Nexus app**
2. **Navigate to Integrations → PayPal**
3. **Click "Connect PayPal"**
4. **Complete the OAuth flow** with your live PayPal account
5. **Verify the integration** is stored in the database

### **2. Check Edge Function Logs**
```bash
# Check PayPal OAuth callback logs
npx supabase functions logs paypal_oauth_callback

# Check PayPal refresh token logs
npx supabase functions logs paypal_refresh_token
```

### **3. Verify Database Integration**
```sql
-- Check if user integration was created
SELECT ui.*, i.name as integration_name 
FROM user_integrations ui 
JOIN integrations i ON ui.integration_id = i.id 
WHERE i.slug = 'paypal' AND ui.user_id = 'YOUR_USER_ID';
```

### **4. Test API Calls**
After successful OAuth, test that your app can:
- [ ] Fetch PayPal user info
- [ ] Access PayPal transactions
- [ ] Refresh tokens when needed

## **🔍 Production vs Sandbox Differences**

| Feature | Sandbox | Production |
|---------|---------|------------|
| Environment | Test | Live |
| Transactions | Fake | Real |
| Credentials | Test App | Live App |
| Dashboard | developer.paypal.com | developer.paypal.com |
| API Base | api.sandbox.paypal.com | api.paypal.com |
| OAuth URL | https://www.sandbox.paypal.com | https://www.paypal.com |

## **🚨 Production Security Considerations**

1. **Keep production credentials secure**
2. **Never commit live credentials to version control**
3. **Use environment variables for all credentials**
4. **Monitor Edge Function logs for any issues**
5. **Set up proper error handling and monitoring**

## **📞 Common Production Issues**

| Issue | Solution |
|-------|----------|
| "Invalid client_id" | Verify you're using Live credentials, not Sandbox |
| "Redirect URI mismatch" | Ensure redirect URI is exactly correct in PayPal Dashboard |
| "Account not verified" | Complete PayPal Business account verification |
| "App not approved" | Contact PayPal support if app needs approval |

## **🎯 Expected Production Flow**

1. **User clicks "Connect PayPal"**
2. **Redirects to live PayPal** (https://www.paypal.com)
3. **User authorizes with live PayPal account**
4. **PayPal redirects to your Edge Function**
5. **Edge Function exchanges code for live tokens**
6. **Live tokens stored in database**
7. **Integration shows as connected**

## **🔧 Troubleshooting Production Issues**

### **If OAuth fails:**
1. **Check Edge Function logs** for detailed error messages
2. **Verify PayPal Developer Dashboard** configuration
3. **Ensure all environment variables** are set correctly
4. **Test with a different PayPal account** if needed

### **If tokens expire:**
1. **Check refresh token logic** in your app
2. **Verify refresh token** is stored correctly
3. **Test token refresh** manually if needed

## **📋 Final Production Checklist**

- [ ] PayPal Business account verified
- [ ] Live app created in PayPal Developer Dashboard
- [ ] Redirect URI configured correctly
- [ ] Environment variables set in Supabase
- [ ] Edge Functions deployed with production config
- [ ] OAuth flow tested with live account
- [ ] Integration data stored in database
- [ ] API calls working with live data
- [ ] Error handling and monitoring in place 