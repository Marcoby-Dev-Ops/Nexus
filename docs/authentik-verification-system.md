# Authentik User Verification System

## Overview

This document describes the new Authentik-based user verification system that replaces the old Supabase-based email verification system.

## Key Changes

### 1. **Authentication Provider Migration**
- **Before**: Supabase Auth with custom email verification
- **After**: Authentik OAuth2 with built-in email verification

### 2. **Verification Flow**
- **Before**: Custom email verification with database flags
- **After**: Authentik handles email verification automatically

### 3. **User Status Tracking**
- **Before**: `email_confirmed_at`, `confirmed_at` fields in database
- **After**: `email_verified` field from Authentik user info

## Architecture

### Core Components

#### 1. **AuthentikUserVerificationService**
```typescript
// Location: src/core/auth/AuthentikUserVerificationService.ts
// Purpose: Central service for all verification operations

interface UserVerificationStatus {
  emailVerified: boolean;        // From Authentik user info
  accountActive: boolean;        // Authentik handles account status
  profileComplete: boolean;      // Based on profile data completeness
  verificationLevel: 'none' | 'basic' | 'full';
  verificationMethod: 'authentik' | 'manual' | 'pending';
}
```

#### 2. **useAuthentikVerification Hook**
```typescript
// Location: src/shared/hooks/useAuthentikVerification.ts
// Purpose: React hook for easy verification management

const {
  verificationStatus,
  isEmailVerified,
  isProfileComplete,
  isFullyVerified,
  requestEmailVerification,
  // ... other methods
} = useAuthentikVerification();
```

#### 3. **Updated Onboarding Flow**
```typescript
// Location: src/shared/components/layout/AppWithOnboarding.tsx
// Purpose: Updated verification step in onboarding

// Now checks Authentik verification status instead of Supabase
const result = await authentikUserVerificationService.getUserVerificationStatus(user.id);
```

## Verification Process

### 1. **Email Verification**
1. User clicks "Verify Email" button
2. System redirects to Authentik OAuth flow
3. Authentik handles email verification
4. User returns with verified status

### 2. **Profile Completion**
1. System checks if user has required profile fields
2. Required: `email`, `name`
3. Optional: `given_name`, `family_name`
4. At least one optional field must be present

### 3. **Account Status**
1. Authentik manages account activation
2. System assumes account is active if user can authenticate
3. No manual account activation required

## Integration Points

### 1. **Onboarding Flow**
- Updated `AuthVerificationStep` to use Authentik verification
- Removed Supabase-specific verification checks
- Added profile completion validation

### 2. **EmailNotVerified Page**
- Updated to redirect to Authentik for verification
- Removed old email verification logic
- Added proper error handling

### 3. **User Context**
- Updated to work with Authentik user data
- Removed Supabase auth dependencies
- Added verification status tracking

## Migration Guide

### For Developers

#### 1. **Replace Old Verification Checks**
```typescript
// OLD (Supabase)
const isVerified = !!user.email_confirmed_at && !!user.confirmed_at;

// NEW (Authentik)
const { isFullyVerified } = useAuthentikVerification();
```

#### 2. **Update Verification Requests**
```typescript
// OLD (Supabase)
await supabase.auth.resend({ type: 'signup' });

// NEW (Authentik)
const result = await requestEmailVerification();
if (result.success && result.url) {
  window.location.href = result.url;
}
```

#### 3. **Check Verification Status**
```typescript
// OLD (Supabase)
const { data: user } = await supabase.auth.getUser();

// NEW (Authentik)
const { verificationStatus } = useAuthentikVerification();
```

### For Administrators

#### 1. **Authentik Configuration**
- Ensure email verification is enabled in Authentik
- Configure email templates in Authentik
- Set up proper redirect URIs

#### 2. **User Management**
- Users are now managed through Authentik
- Email verification happens automatically
- No manual verification required

## Benefits

### 1. **Simplified Architecture**
- Single source of truth for authentication
- No duplicate verification systems
- Consistent user experience

### 2. **Better Security**
- Authentik handles security best practices
- Built-in protection against common attacks
- Centralized security management

### 3. **Improved User Experience**
- Seamless OAuth flow
- Automatic email verification
- No manual intervention required

## Troubleshooting

### Common Issues

#### 1. **Verification Status Not Updating**
- Check if Authentik session is valid
- Verify user ID mapping is correct
- Ensure Authentik user info includes `email_verified`

#### 2. **Redirect Loop**
- Check Authentik redirect URI configuration
- Verify OAuth state management
- Ensure proper error handling

#### 3. **Profile Incomplete**
- Check required fields in Authentik user info
- Verify profile data is being saved correctly
- Ensure proper validation logic

### Debug Steps

1. **Check Authentik Session**
```typescript
const session = await authentikAuthService.getSession();
console.log('Authentik session:', session);
```

2. **Verify User Info**
```typescript
const userInfo = session.session.user;
console.log('User info:', userInfo);
console.log('Email verified:', userInfo.email_verified);
```

3. **Check Verification Status**
```typescript
const status = await authentikUserVerificationService.getUserVerificationStatus(userId);
console.log('Verification status:', status);
```

## Future Enhancements

### 1. **Additional Verification Methods**
- Phone number verification
- Two-factor authentication
- Social login verification

### 2. **Advanced Profile Validation**
- Custom validation rules
- Business-specific requirements
- Compliance checks

### 3. **Verification Analytics**
- Verification success rates
- User journey tracking
- Performance metrics

## Conclusion

The new Authentik-based verification system provides a more robust, secure, and user-friendly approach to user verification. By leveraging Authentik's built-in capabilities, we've simplified the architecture while improving the overall user experience.

For questions or issues, please refer to the troubleshooting section or contact the development team.
