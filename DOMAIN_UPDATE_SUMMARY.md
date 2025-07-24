# 🔄 Domain Configuration Update Summary

## 📋 **Overview**
Updated the Nexus codebase to use `nexus.marcoby.net` for development while maintaining `nexus.marcoby.com` for production.

## 🎯 **Domain Strategy**
- **Development**: `nexus.marcoby.net`
- **Production**: `nexus.marcoby.com`
- **Local**: `localhost:5173`

## 📁 **Files Updated**

### 🔧 **Environment Configuration**
- **`.env`**: Updated all domain references to use `nexus.marcoby.net`
  - `VITE_NEXT_PUBLIC_APP_URL=https://nexus.marcoby.net`
  - `NEXT_PUBLIC_APP_URL=https://nexus.marcoby.net`
  - `MICROSOFT_REDIRECT_URI=https://nexus.marcoby.net/integrations/microsoft/callback`
  - `GOOGLE_REDIRECT_URI=https://nexus.marcoby.net/integrations/google/callback`

### 🔐 **Supabase Configuration**
- **`supabase/config.toml`**: Updated auth configuration
  - `site_url = "https://nexus.marcoby.net"`
  - Added both domains to `additional_redirect_urls`

### 🌐 **CORS & API Configuration**
- **`supabase/functions/_shared/cors.ts`**: Updated allowed origins
- **`supabase/functions/api-manager/index.ts`**: Updated CORS headers
- **`supabase/functions/check-user-integrations/index.ts`**: Updated fallback URL
- **`supabase/functions/ai-rag-assessment-chat/index.ts`**: Updated HTTP-Referer

### 🔗 **OAuth Integrations**
- **`src/domains/integrations/lib/hubspot/config.ts`**: Updated redirect URI
- **`src/domains/integrations/lib/hubspot/app-config.ts`**: Updated redirect URI
- **`supabase/functions/microsoft-graph-oauth-callback/index.ts`**: Updated fallback redirect

### 📄 **SEO & Public Files**
- **`scripts/generate-sitemap.cjs`**: Updated base URL
- **`scripts/generate-robots.cjs`**: Updated sitemap URL
- **`public/sitemap.xml`**: Updated all URLs
- **`public/robots.txt`**: Updated sitemap reference

### 🧪 **Testing & CI/CD**
- **`.github/workflows/lighthouse-ci.yml`**: Updated test URLs

## 🔄 **Next Steps Required**

### 1. **OAuth Provider Updates**
You'll need to update the OAuth provider dashboards to include the new domain:

#### **Microsoft Azure Portal**
- Add: `https://nexus.marcoby.net/integrations/microsoft/callback`

#### **Google Cloud Console**
- Add: `https://nexus.marcoby.net/integrations/google/callback`

#### **HubSpot Developer Portal**
- Add: `https://nexus.marcoby.net/integrations/hubspot/callback`

### 2. **DNS Configuration**
Ensure `nexus.marcoby.net` points to your Coolify instance.

### 3. **SSL Certificate**
Set up SSL certificate for `nexus.marcoby.net` in Coolify.

### 4. **Environment Variables**
Update your Coolify deployment environment variables:
```bash
VITE_NEXT_PUBLIC_APP_URL=https://nexus.marcoby.net
NEXT_PUBLIC_APP_URL=https://nexus.marcoby.net
MICROSOFT_REDIRECT_URI=https://nexus.marcoby.net/integrations/microsoft/callback
GOOGLE_REDIRECT_URI=https://nexus.marcoby.net/integrations/google/callback
```

## ✅ **Verification Checklist**

- [ ] DNS resolves `nexus.marcoby.net` to your server
- [ ] SSL certificate is installed for `nexus.marcoby.net`
- [ ] OAuth providers updated with new redirect URIs
- [ ] Coolify environment variables updated
- [ ] Application deploys successfully to `nexus.marcoby.net`
- [ ] Authentication flow works on new domain
- [ ] OAuth integrations work on new domain
- [ ] All links and redirects work correctly

## 🚨 **Important Notes**

1. **Production vs Development**: Keep `nexus.marcoby.com` for production deployments
2. **OAuth Credentials**: Update both development and production redirect URIs in OAuth provider dashboards
3. **Environment Variables**: Ensure Coolify has the correct environment variables for the new domain
4. **Testing**: Test all authentication flows on the new domain before going live

## 📚 **Related Documentation**
- [OAuth Configuration Guide](./docs/OAUTH_CONFIGURATION_GUIDE.md)
- [OAuth Troubleshooting](./docs/OAUTH_TROUBLESHOOTING.md)
- [Coolify Deployment Guide](./docs/deployment/COOLIFY_DEPLOYMENT_GUIDE.md) 