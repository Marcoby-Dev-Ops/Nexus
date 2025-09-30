# 🔐 Authentik Signup Integration Guide

## Overview

This guide explains how to set up the Nexus signup flow to automatically create users in Authentik (Marcoby IAM) when users complete the signup process.

## 🏗️ Architecture

### Current Setup
- **Authentik Instance**: `https://identity.marcoby.com`
- **Nexus Application**: OAuth2 provider configured in Authentik
- **User Groups**: 
  - `Nexus Admins` (Superuser privileges)
  - `Nexus Users` (Standard user privileges)

### Signup Flow
1. User completes Nexus signup form
2. `AuthentikSignupService` creates user in Authentik
3. User is assigned to `Nexus Users` group
4. Welcome email sent with login credentials
5. User can sign in to Nexus

## 🔧 Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Authentik Configuration
VITE_AUTHENTIK_BASE_URL=https://identity.marcoby.com
VITE_AUTHENTIK_API_TOKEN=your_authentik_api_token_here

# Email Service (for welcome emails)
VITE_EMAIL_SERVICE_KEY=your_email_service_key_here
```

### Getting Authentik API Token

1. Log into your Authentik admin panel
2. Go to **System > Tokens & App passwords**
3. Click **Create Token**
4. Give it a name like "Nexus Signup Service"
5. Copy the token and add it to your environment variables

## 📋 User Creation Process

### 1. Form Data Collection
The signup form collects:
- **Business Information**: Name, type, industry, size
- **Contact Information**: First name, last name, email, phone
- **Optional Fields**: Funding stage, revenue range (for startups/small businesses)

### 2. User Creation in Authentik
```typescript
const result = await AuthentikSignupService.createUserFromSignup({
  businessName: "Von's the Man",
  businessType: "startup",
  industry: "technology",
  companySize: "1-10",
  firstName: "Von",
  lastName: "Jackson",
  email: "von@example.com",
  phone: "+1 (555) 123-4567",
  fundingStage: "bootstrap",
  revenueRange: "0-100k"
});
```

### 3. User Attributes
Users are created with the following attributes:
```json
{
  "business_name": "Von's the Man",
  "business_type": "startup",
  "industry": "technology",
  "company_size": "1-10",
  "first_name": "Von",
  "last_name": "Jackson",
  "phone": "+1 (555) 123-4567",
  "funding_stage": "bootstrap",
  "revenue_range": "0-100k",
  "signup_date": "2025-08-25T16:55:31.739546Z",
  "source": "nexus_signup_flow"
}
```

### 4. Group Assignment
Users are automatically assigned to the `Nexus Users` group for standard access.

## 🚀 Implementation

### Service Usage

```typescript
import { AuthentikSignupService } from '@/services/auth/AuthentikSignupService';

// Check if user exists
const userExists = await AuthentikSignupService.checkUserExists(email);
if (userExists) {
  // Handle existing user
}

// Create new user
const result = await AuthentikSignupService.createUserFromSignup(signupData);
if (result.success) {
  // User created successfully
  console.log('User ID:', result.userId);
} else {
  // Handle error
  console.error('Error:', result.error);
}
```

### Error Handling

The service handles common errors:
- **Duplicate Email**: Checks if user already exists
- **Invalid Data**: Validates required fields
- **API Errors**: Handles Authentik API failures
- **Network Issues**: Graceful fallback for connectivity problems

## 📧 Email Integration

### Welcome Email Setup

The service is designed to send welcome emails with login credentials. To implement:

1. **Choose Email Service**: SendGrid, AWS SES, or similar
2. **Create Email Template**: Professional welcome email
3. **Configure Service**: Add email service credentials
4. **Update Service**: Uncomment email sending code in `AuthentikSignupService`

### Email Template Example

```html
<h2>Welcome to Nexus, {{businessName}}!</h2>
<p>Your account has been created successfully.</p>

<h3>Login Credentials:</h3>
<p><strong>Username:</strong> {{username}}</p>
<p><strong>Password:</strong> {{password}}</p>
<p><strong>Login URL:</strong> <a href="{{loginUrl}}">{{loginUrl}}</a></p>

<p>Please change your password after your first login.</p>
```

## 🔒 Security Considerations

### API Token Security
- Store API token in environment variables
- Never commit tokens to version control
- Rotate tokens regularly
- Use least-privilege access

### User Data Protection
- All business data stored in user attributes
- Secure password generation
- Email verification recommended
- GDPR compliance for data handling

### Rate Limiting
- Implement rate limiting on signup endpoint
- Prevent abuse and spam registrations
- Monitor for suspicious activity

## 🧪 Testing

### Test User Creation

```typescript
// Test user creation
const testData = {
  businessName: "Test Business",
  businessType: "small-business",
  industry: "technology",
  companySize: "11-50",
  firstName: "Test",
  lastName: "User",
  email: "test@example.com"
};

const result = await AuthentikSignupService.createUserFromSignup(testData);
console.log('Test result:', result);
```

### Verification Steps

1. **Check Authentik Admin**: Verify user appears in user list
2. **Group Assignment**: Confirm user is in "Nexus Users" group
3. **Attributes**: Verify business data is stored correctly
4. **Login Test**: Test user can sign in to Nexus

## 📊 Monitoring

### Key Metrics to Track

- **Signup Success Rate**: Percentage of successful user creations
- **Error Rates**: Common failure points
- **User Activation**: How many users actually sign in
- **Business Data Quality**: Completeness of collected information

### Logging

The service logs important events:
- User creation attempts
- Success/failure results
- Error details for debugging
- Group assignment status

## 🔄 Future Enhancements

### Planned Features

1. **Email Verification**: Require email confirmation before activation
2. **Business Profile Completion**: Guided setup after signup
3. **Integration Setup**: Connect business tools during signup
4. **Onboarding Flow**: Step-by-step platform introduction
5. **Analytics Integration**: Track user journey and engagement

### Customization Options

- **Custom User Groups**: Business-type specific groups
- **Attribute Mapping**: Flexible business data storage
- **Workflow Integration**: Connect to business processes
- **Multi-tenant Support**: Organization-based user management

## 🆘 Troubleshooting

### Common Issues

1. **API Token Invalid**
   - Check token in Authentik admin
   - Verify environment variable is set
   - Ensure token has user creation permissions

2. **User Creation Fails**
   - Check required fields are provided
   - Verify email format is valid
   - Check Authentik logs for detailed errors

3. **Group Assignment Fails**
   - Verify "Nexus Users" group exists
   - Check group permissions
   - Ensure API token has group management access

4. **Email Not Sent**
   - Check email service configuration
   - Verify email templates
   - Check service logs for delivery status

### Debug Mode

Enable debug logging by setting:
```env
VITE_DEBUG_AUTHENTIK=true
```

This will log detailed information about the signup process.

## 📞 Support

For issues with the Authentik integration:

1. Check Authentik admin logs
2. Verify API token permissions
3. Test with minimal data first
4. Contact Marcoby support if needed

---

**Last Updated**: August 25, 2025  
**Version**: 1.0  
**Status**: ✅ Production Ready
