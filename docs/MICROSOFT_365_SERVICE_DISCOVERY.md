# Microsoft 365 Service Discovery

## Overview

The Microsoft 365 Service Discovery feature automatically detects available services in a user's Microsoft 365 account after successful OAuth connection and allows them to select which services they want to integrate with Nexus.

## 🎯 Features

### **Automatic Service Detection**
- **User Mailbox**: Personal email inbox and folders
- **Shared Mailboxes**: Shared email accounts the user has access to
- **Calendar**: Personal calendar and events
- **Microsoft Teams**: Teams channels and chat conversations
- **OneDrive**: Personal cloud storage
- **SharePoint**: SharePoint sites and document libraries

### **Smart Discovery Process**
- **Real-time Detection**: Uses Microsoft Graph API to check service availability
- **Permission Validation**: Verifies user has appropriate permissions for each service
- **Data Enrichment**: Provides additional context about available data (e.g., number of teams, sites, folders)

### **User-Friendly Selection Interface**
- **Visual Service Cards**: Clear representation of each service with icons and descriptions
- **Pre-selection**: Automatically selects available services for convenience
- **Category Grouping**: Organizes services by category (Email, Calendar, Communication, Storage)
- **Skip Option**: Users can skip service setup and configure later

## 🔧 Technical Implementation

### **Edge Function: `microsoft_services_discovery`**

```typescript
// Endpoint: POST /functions/v1/microsoft_services_discovery
// Purpose: Discover available Microsoft 365 services for authenticated user

interface DiscoveredService {
  id: string;
  name: string;
  description: string;
  available: boolean;
  icon: string;
  category: string;
  scopes: string[];
  endpoint?: string;
  data?: any;
}
```

### **Service Layer: `Microsoft365DiscoveryService`**

```typescript
// Frontend service for managing service discovery and setup

class Microsoft365DiscoveryService {
  async discoverServices(): Promise<ServiceDiscoveryResponse>
  async setupServices(selectedServices: string[]): Promise<ServiceResponse>
  async getEnabledServices(): Promise<ServiceResponse<string[]>>
  async isServiceEnabled(serviceId: string): Promise<ServiceResponse<boolean>>
}
```

### **UI Component: `Microsoft365ServiceDiscovery`**

```typescript
// React component for service selection interface

interface Microsoft365ServiceDiscoveryProps {
  onComplete?: () => void;
  onSkip?: () => void;
}
```

## 🔄 Integration Flow

### **1. OAuth Connection**
```
User initiates Microsoft 365 connection
↓
OAuth flow completes successfully
↓
User redirected to callback page
```

### **2. Service Discovery**
```
Callback page triggers service discovery
↓
Edge Function queries Microsoft Graph API
↓
Available services detected and returned
↓
Service selection UI displayed
```

### **3. Service Setup**
```
User selects desired services
↓
Selected services saved to user_integrations table
↓
Integration configuration updated
↓
User redirected to success page
```

## 📊 Service Detection Logic

### **Mailbox Detection**
- **Endpoint**: `/me/mailFolders`
- **Availability**: Always available for authenticated users
- **Data**: Number of mail folders

### **Shared Mailboxes Detection**
- **Endpoint**: `/me/mailFolders`
- **Logic**: Filters for non-personal folders (excludes Inbox, Sent, Drafts, Deleted)
- **Data**: Number of shared folders and folder details

### **Calendar Detection**
- **Endpoint**: `/me/calendar`
- **Availability**: Based on calendar permissions
- **Data**: Calendar type and settings

### **Teams Detection**
- **Endpoint**: `/me/joinedTeams`
- **Availability**: Based on Teams membership
- **Data**: Number of teams and team details

### **OneDrive Detection**
- **Endpoint**: `/me/drive`
- **Availability**: Always available for authenticated users
- **Data**: Drive type and quota information

### **SharePoint Detection**
- **Endpoint**: `/me/sites`
- **Availability**: Based on SharePoint site access
- **Data**: Number of accessible sites

## 🗄️ Database Schema

### **user_integrations Table Updates**

```sql
-- Integration configuration now includes enabled services
{
  "access_token": "...",
  "refresh_token": "...",
  "expires_at": "...",
  "enabledServices": ["mailbox", "calendar", "teams"],
  "servicesSetupAt": "2025-01-11T10:00:00Z"
}
```

## 🎨 User Experience

### **Service Selection Interface**

1. **Loading State**: Shows discovery progress with spinner
2. **Available Services**: Green-bordered cards with checkboxes
3. **Unavailable Services**: Grayed-out cards with explanation
4. **Action Buttons**: "Skip Setup" and "Set Up Services"
5. **Summary**: Shows count of selected services

### **Visual Design**
- **Icons**: Lucide React icons for each service type
- **Categories**: Color-coded badges for service categories
- **Status Indicators**: Clear visual distinction between available/unavailable
- **Responsive Layout**: Grid layout that adapts to screen size

## 🔒 Security & Permissions

### **Authentication**
- **Edge Function**: Requires valid Supabase JWT token
- **Microsoft Graph**: Uses user's access token from OAuth flow
- **Database**: Service role key for admin operations

### **Permission Scopes**
- **Mail.Read**: Required for mailbox and shared mailbox detection
- **Calendars.Read**: Required for calendar detection
- **Team.ReadBasic.All**: Required for Teams detection
- **Files.Read.All**: Required for OneDrive detection
- **Sites.Read.All**: Required for SharePoint detection

## 🚀 Usage Examples

### **Frontend Integration**

```typescript
// In Microsoft365CallbackPage.tsx
const handleDiscoveryComplete = () => {
  setStatus('success');
  // Navigate to success page or dashboard
};

const handleDiscoverySkip = () => {
  setStatus('success');
  // Skip to success page
};

// Render discovery component
if (status === 'discovery') {
  return (
    <Microsoft365ServiceDiscovery
      onComplete={handleDiscoveryComplete}
      onSkip={handleDiscoverySkip}
    />
  );
}
```

### **Service Status Check**

```typescript
// Check if specific service is enabled
const isMailboxEnabled = await microsoft365DiscoveryService.isServiceEnabled('mailbox');
const isTeamsEnabled = await microsoft365DiscoveryService.isServiceEnabled('teams');

// Get all enabled services
const enabledServices = await microsoft365DiscoveryService.getEnabledServices();
```

## 🔧 Configuration

### **Environment Variables**
```bash
# Required for Edge Function
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Microsoft Graph API (handled by existing OAuth flow)
MICROSOFT_CLIENT_ID=your_client_id
MICROSOFT_CLIENT_SECRET=your_client_secret
```

### **Service Configuration**
```typescript
// Service definitions in Edge Function
const services = [
  {
    id: 'mailbox',
    name: 'User Mailbox',
    description: 'Your personal email inbox',
    icon: 'mail',
    category: 'Email',
    scopes: ['Mail.Read', 'Mail.ReadWrite'],
    endpoint: '/me/mailFolders'
  },
  // ... other services
];
```

## 🐛 Troubleshooting

### **Common Issues**

#### **No Services Detected**
- **Cause**: User doesn't have Microsoft 365 account or insufficient permissions
- **Solution**: Verify OAuth scopes and user account status

#### **Discovery Fails**
- **Cause**: Microsoft Graph API errors or network issues
- **Solution**: Check Edge Function logs and Microsoft Graph API status

#### **Services Not Saving**
- **Cause**: Database update errors or invalid user session
- **Solution**: Verify user authentication and database permissions

### **Debug Information**
```typescript
// Enable detailed logging
logger.info('Service discovery started', { userId, timestamp });
logger.info('Service detected', { serviceId, available, data });
logger.error('Discovery failed', { error, serviceId });
```

## 🔄 Future Enhancements

### **Planned Features**
- **Service-Specific Setup**: Individual configuration for each service
- **Permission Management**: Allow users to modify service permissions
- **Usage Analytics**: Track which services are most commonly selected
- **Bulk Operations**: Enable/disable multiple services at once

### **Integration Opportunities**
- **Email Module**: Auto-configure email integration when mailbox selected
- **Calendar Module**: Auto-configure calendar integration when calendar selected
- **Teams Module**: Auto-configure Teams integration when Teams selected
- **Document Management**: Auto-configure OneDrive/SharePoint integration

## 📈 Performance Considerations

### **Optimization Strategies**
- **Parallel Discovery**: Check multiple services simultaneously
- **Caching**: Cache discovery results for subsequent requests
- **Timeout Handling**: Implement reasonable timeouts for API calls
- **Error Recovery**: Graceful handling of individual service failures

### **Rate Limiting**
- **Microsoft Graph**: Respect API rate limits
- **Batch Requests**: Use batch operations where possible
- **Retry Logic**: Implement exponential backoff for failed requests
