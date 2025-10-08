# Supabase to Authentik Migration Plan

## Overview
This document outlines the migration strategy for moving Nexus authentication from Supabase to Authentik.

## Current State

### Supabase Setup
- **Project**: Nexus (kqclbpimkraenvbffnpk)
- **Users**: 1 active user (vonj@marcoby.com)
- **Schema**: 100+ tables with complex business logic
- **Auth Tables**: 
  - `auth.users` - Core user authentication
  - `public.user_profiles` - Extended user profile data
  - `public.companies` - Organization management
  - `public.company_members` - User-company relationships

### Authentik Setup ✅ COMPLETE
- **Instance**: https://identity.marcoby.com
- **Application**: "Nexus" (ID: 6f82f08b-a21c-4c82-b2dc-3b92f16301bb)
- **OAuth Provider**: "Nexus OAuth2 Provider" (ID: 1) ✅ CONFIGURED
- **Groups**: 
  - "Nexus Admins" (ID: 52959) - Superuser privileges
  - "Nexus Users" (ID: 27972) - Standard user privileges
- **Users**: 
  - **vonj** (User ID: 4) - Email: vonj@marcoby.com - Authentik system admin
  - **Status**: ✅ Ready for Nexus integration with proper group memberships

### Nexus Application URLs
- **Development**: http://localhost:5173
- **Production**: https://nexus.marcoby.com
- **Callback URLs**: 
  - `http://localhost:5173/auth/callback`
  - `https://nexus.marcoby.com/auth/callback`

## Migration Steps

### ✅ Completed
1. **Authentik Application Created**
   - Name: Nexus
   - Slug: nexus
   - Description: Business Intelligence and Client Management Platform

2. **Groups Created**
   - Nexus Admins (superuser privileges)
   - Nexus Users (standard privileges)

3. **User Setup Complete**
   - Clean user account: vonj@marcoby.com
   - System admin privileges
   - No email conflicts
   - Ready for Nexus integration

4. **User Group Assignment Complete**
   - vonj added to appropriate groups
   - Permissions and access verified

5. **OAuth Configuration Guide Created**
   - Detailed OAuth2 provider setup instructions
   - Client configuration examples with specific URLs
   - Security considerations and troubleshooting

6. **OAuth Provider Setup Complete** ✅
   - OAuth2/OpenID Provider created and configured
   - Provider linked to Nexus application
   - Redirect URIs configured for both environments
   - Launch URL set to development environment

7. **Codebase Integration Files Created** ✅
   - Authentik OAuth client configuration (`src/lib/authentik.ts`)
   - Authentik authentication service (`src/core/auth/AuthentikAuthService.ts`)
   - Authentik auth context (`src/shared/contexts/AuthentikAuthContext.tsx`)
   - OAuth callback component (`src/pages/admin/AuthentikAuthCallback.tsx`)
   - Environment variables updated
   - Comprehensive code migration guide created

8. **OAuth Credentials Obtained** ✅
   - Client ID: v6FYo8pTUpSsFRKAoyyOugzA8mMH4H9UupzHffXs
   - Client Secret: Configured in environment
   - Environment variables updated with real credentials

### 🔄 Next Steps
9. **Test OAuth Authentication Flow**
   - Start development server
   - Test login flow with vonj@marcoby.com
   - Verify OAuth callback handling
   - Test session management

### 📋 Remaining Tasks
10. **Code Migration Implementation**
    - Update App.tsx to use AuthentikAuthProvider
    - Update login components to use OAuth flow
    - Update route configuration for new callback
    - Update hooks usage throughout the application

11. **Database Schema Updates**
    - Add Authentik user ID mapping
    - Update foreign key relationships
    - Migrate existing user data

12. **Testing & Validation**
    - Test authentication flow
    - Verify user permissions
    - Test group-based access control

## Technical Implementation

### Authentication Flow
```
User Login → Authentik OAuth2 → Nexus App → JWT Token → User Session
```

### Required Changes
1. **Frontend**: Update auth provider to use Authentik
2. **Backend**: Replace Supabase auth with Authentik JWT validation
3. **Database**: Add `authentik_user_id` field to user tables
4. **API**: Update user management endpoints

### Data Migration Scripts
- Export Supabase user data
- Map to Authentik user IDs
- Update database references
- Verify data integrity

## Security Considerations
- Maintain existing RLS policies
- Update API authentication
- Secure token handling
- Audit trail preservation

## Rollback Plan
- Keep Supabase auth active during transition
- Gradual user migration
- Feature flag for auth provider
- Quick rollback capability

## Timeline
- **Week 1**: ✅ Complete user setup and group assignment
- **Week 2**: ✅ Application configuration and OAuth setup
- **Week 3**: 🔄 Code migration and testing
- **Week 4**: Production deployment and validation

## Success Criteria
- [ ] All users can authenticate via Authentik
- [ ] Group-based permissions working
- [ ] No data loss during migration
- [ ] Performance maintained or improved
- [ ] Security policies enforced

## Documentation
- **Migration Plan**: `docs/current/authentik-migration-plan.md`
- **OAuth Configuration**: `docs/current/authentik-oauth-config.md`
- **Code Migration Guide**: `docs/current/authentik-code-migration-guide.md`

## Created Files
- `src/lib/authentik.ts` - OAuth client configuration
- `src/core/auth/AuthentikAuthService.ts` - Authentication service
- `src/shared/contexts/AuthentikAuthContext.tsx` - Auth context
- `src/pages/admin/AuthentikAuthCallback.tsx` - OAuth callback component
- Updated `.env` with Authentik configuration variables

## Current Status: Ready for Testing
All infrastructure is in place. The next step is to test the OAuth authentication flow with the real credentials.
