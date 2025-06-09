# 🚀 Google Analytics Integration Setup Guide

## Quick Setup (30 minutes to real data)

### **Step 1: Google Cloud Console Setup**

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**
2. **Create/Select Project**: 
   - Create new project: "Nexus Analytics Integration"
3. **Enable APIs**:
   ```
   - Google Analytics Reporting API
   - Google Analytics Data API
   ```
4. **Create OAuth 2.0 Credentials**:
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - Authorized redirect URIs:
     ```
     http://localhost:5174/integrations/google-analytics/callback
     https://yourdomain.com/integrations/google-analytics/callback
     ```

### **Step 2: Environment Configuration**

Add to your `.env` file:
```env
# Google Analytics Integration
VITE_GOOGLE_CLIENT_ID=your_client_id_here
VITE_GOOGLE_CLIENT_SECRET=your_client_secret_here
```

### **Step 3: Database Migration**

Run the migration to create integration tables:
```bash
npx supabase db push
```

### **Step 4: Update Integration Component**

Replace the simulation in `IntegrationSetupModal.tsx` with real Google Analytics connection:

```typescript
// In the OAuth step, replace simulation with:
import { googleAnalyticsService } from '@/lib/services/googleAnalyticsService';

const handleOAuthFlow = async () => {
  try {
    const authUrl = await googleAnalyticsService.initializeOAuth();
    window.location.href = authUrl; // Real OAuth redirect
  } catch (error) {
    setErrorMessage('Failed to start Google Analytics authorization');
  }
};
```

### **Step 5: Create OAuth Callback Handler**

Create `src/pages/GoogleAnalyticsCallback.tsx`:
```typescript
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { googleAnalyticsService } from '@/lib/services/googleAnalyticsService';

export const GoogleAnalyticsCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      
      if (code) {
        try {
          await googleAnalyticsService.exchangeCodeForTokens(code);
          navigate('/integrations?success=google-analytics');
        } catch (error) {
          navigate('/integrations?error=google-analytics');
        }
      }
    };

    handleCallback();
  }, []);

  return <div>Connecting Google Analytics...</div>;
};
```

### **Step 6: Test Real Data**

1. **Start your dev server**: `npm run dev`
2. **Go to integrations page**: `http://localhost:5174/integrations`
3. **Click "Connect" on Google Analytics**
4. **Complete OAuth flow**
5. **Verify real data appears**

## **Expected Results**

After setup, you'll see **real data** like:
- ✅ **Actual user counts** from your website
- ✅ **Real traffic sources** (Google, Direct, etc.)
- ✅ **Live visitor count**
- ✅ **Top performing pages**
- ✅ **Conversion events**

## **Troubleshooting**

### Common Issues:

1. **"Invalid Client" Error**:
   - Check your OAuth client ID/secret
   - Verify redirect URI matches exactly

2. **"Insufficient Permissions"**:
   - Ensure you have Google Analytics access
   - Check you're using GA4 (not Universal Analytics)

3. **"No Data Returned"**:
   - Verify your GA4 property has data
   - Check date range (last 30 days)

### Debug Mode:

Add to your component for debugging:
```typescript
console.log('GA Service Status:', {
  isAuthenticated: googleAnalyticsService.isAuthenticated(),
  config: localStorage.getItem('ga4_config')
});
```

## **Next Integration: Slack**

Once Google Analytics is working, Slack is next:
- Similar OAuth flow
- Webhook support for real-time data
- Team collaboration insights

**Timeline**: Google Analytics (today) → Slack (next week) → CRM (week 3) 