# Backend Connection Guide

**Last Updated**: August 6, 2025  
**Status**: Implementation in progress - Foundation complete, needs standardization  
**Related Documents**: 
- `docs/architecture/ARCHITECTURE.md` - Architectural patterns
- `docs/development/API_SERVICE_CLEANUP_PLAN.md` - Service layer cleanup
- `docs/MASTER_TODO_LIST.md` - Implementation priorities

This guide explains how to properly connect to backend data sources in the Nexus application using the new centralized backend connection system.

## Overview

The backend connection system provides:
- **Centralized Connection Management**: All backend services are managed through a single connector
- **Health Monitoring**: Real-time monitoring of backend service health
- **Error Handling**: Consistent error handling and retry logic
- **Caching**: Built-in caching for improved performance
- **Type Safety**: Full TypeScript support

## Current Implementation Status

### ✅ **Completed Components**
- **BackendConnector**: Core service for managing backend connections
- **DataService**: High-level data fetching with caching
- **React Hooks**: Pre-built hooks for common patterns
- **Error Boundaries**: Graceful error handling

### ⚠️ **Needs Standardization**
- **Service Layer**: Mixed patterns, some direct DB calls still exist
- **Component Integration**: Some components still use direct Supabase calls
- **Hook Usage**: Inconsistent adoption of centralized hooks

### 🔄 **In Progress**
- **API Service Layer Cleanup**: Standardizing service architecture
- **Mock Data Replacement**: Connecting to real business data sources
- **Department Module Integration**: Adding business logic to department dashboards

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Hooks   │    │  BackendConnector │    │  Backend Services│
│                 │    │                  │    │                 │
│ • useDataService│◄──►│ • Health Monitoring│◄──►│ • Supabase      │
│ • useBackendConn│    │ • Retry Logic    │    │ • Edge Functions │
│ • useNotifications│   │ • Error Handling │    │ • AI Services    │
│ • useInboxItems │    │ • Authentication │    │ • N8N Automation│
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Core Services

### 1. BackendConnector (`src/lib/core/backendConnector.ts`)

The central service that manages all backend connections.

```typescript
import { backendConnector } from '@/lib/core/backendConnector';

// Check system health
const isHealthy = backendConnector.isSystemHealthy();

// Get all services
const services = backendConnector.getServices();

// Make authenticated request
const data = await backendConnector.request('supabase', '/users', {
  method: 'GET'
});
```

### 2. DataService (`src/lib/services/dataService.ts`)

Provides high-level data fetching with caching and error handling.

```typescript
import { dataService } from '@/lib/services/dataService';

// Fetch from Supabase
const users = await dataService.fetchFromSupabase('users', 'select=*');

// Fetch from Edge Functions
const metrics = await dataService.fetchFromEdgeFunction('dashboard-metrics', { userId });

// Fetch from AI Chat
const response = await dataService.fetchFromAIChat('Hello', 'conv-123');
```

## React Hooks

### 1. useBackendConnector

Provides access to backend service health and status.

```typescript
import { useBackendConnector } from '@/lib/hooks/useBackendConnector';

function MyComponent() {
  const { services, isSystemHealthy, isLoading, error, refreshHealth } = useBackendConnector();
  
  return (
    <div>
      <p>System Healthy: {isSystemHealthy ? 'Yes' : 'No'}</p>
      {services.map(service => (
        <div key={service.name}>
          {service.name}: {service.isConnected ? 'Online' : 'Offline'}
        </div>
      ))}
    </div>
  );
}
```

### 2. useDataService

Generic hook for data fetching with caching and error handling.

```typescript
import { useDataService } from '@/lib/hooks/useDataService';

function MyComponent() {
  const { data, loading, error, refetch } = useDataService(
    async () => {
      // Your custom data fetching logic
      return await fetch('/api/custom-data');
    },
    {
      enabled: true,
      refetchInterval: 30000, // Refetch every 30 seconds
      cacheTime: 60000 // Cache for 1 minute
    }
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>{JSON.stringify(data)}</div>;
}
```

### 3. Specific Data Hooks

Pre-built hooks for common data fetching patterns.

```typescript
import { 
  useNotifications, 
  useInboxItems, 
  useDashboardMetrics,
  useUserProfile,
  useUserIntegrations,
  useBusinessHealth
} from '@/lib/hooks/useDataService';

function Dashboard() {
  const { data: notifications, loading, error } = useNotifications(10);
  const { data: inboxItems } = useInboxItems({ is_read: false }, 20);
  const { data: metrics } = useDashboardMetrics();
  
  return (
    <div>
      {/* Your dashboard content */}
    </div>
  );
}
```

## Error Handling

### 1. BackendErrorBoundary

Catches and handles backend connection errors gracefully.

```typescript
import { BackendErrorBoundary } from '@/components/ui/BackendErrorBoundary';

function App() {
  return (
    <BackendErrorBoundary>
      <YourApp />
    </BackendErrorBoundary>
  );
}
```

### 2. Connection Status Indicator

Shows real-time health status of backend services.

```typescript
import { ConnectionStatusIndicator } from '@/components/ui/ConnectionStatusIndicator';

function Header() {
  return (
    <header>
      <ConnectionStatusIndicator showDetails={false} />
    </header>
  );
}
```

## Best Practices

### 1. Always Use Error Boundaries

Wrap your components with `BackendErrorBoundary` to handle connection errors gracefully.

```typescript
function MyPage() {
  return (
    <BackendErrorBoundary>
      <div>
        {/* Your page content */}
      </div>
    </BackendErrorBoundary>
  );
}
```

### 2. Check System Health Before Making Requests

```typescript
function MyComponent() {
  const { isSystemHealthy } = useBackendConnector();
  const { data, loading, error } = useDataService(
    async () => await fetchData(),
    { enabled: isSystemHealthy } // Only fetch when system is healthy
  );
}
```

### 3. Use Specific Hooks for Common Patterns

Instead of creating custom data fetching logic, use the pre-built hooks:

```typescript
// ✅ Good - Use specific hooks
const { data: notifications } = useNotifications(10);

// ❌ Bad - Don't create custom logic for common patterns
const { data: notifications } = useDataService(
  () => fetch('/api/notifications'),
  { refetchInterval: 30000 }
);
```

### 4. Handle Loading and Error States

```typescript
function MyComponent() {
  const { data, loading, error, refetch } = useNotifications(5);

  if (loading) {
    return <div>Loading notifications...</div>;
  }

  if (error) {
    return (
      <div>
        <p>Error loading notifications: {error.message}</p>
        <button onClick={refetch}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      {data?.map(notification => (
        <div key={notification.id}>{notification.message}</div>
      ))}
    </div>
  );
}
```

### 5. Use Caching Appropriately

```typescript
// For frequently changing data
const { data: notifications } = useNotifications(10); // Auto-refreshes every 30s

// For static data
const { data: userProfile } = useUserProfile(); // No auto-refresh

// For custom data with specific caching
const { data: customData } = useDataService(
  async () => await fetchCustomData(),
  { 
    refetchInterval: 60000, // Refresh every minute
    cacheTime: 300000 // Cache for 5 minutes
  }
);
```

## Migration Guide

### From Direct Supabase Calls

**Before:**
```typescript
const { data, error } = await supabase
  .from('notifications')
  .select('*')
  .eq('user_id', userId);
```

**After:**
```typescript
const { data, loading, error } = useNotifications(10);
```

### From Custom Fetch Calls

**Before:**
```typescript
const response = await fetch('/api/notifications');
const data = await response.json();
```

**After:**
```typescript
const { data, loading, error } = useDataService(
  () => fetch('/api/notifications').then(res => res.json()),
  { refetchInterval: 30000 }
);
```

## Troubleshooting

### Common Issues

1. **Session Fetch Errors**
   - Check if backend services are healthy
   - Verify authentication state
   - Check network connectivity

2. **Data Not Loading**
   - Ensure the user is authenticated
   - Check if the specific service is connected
   - Verify the data fetching logic

3. **Connection Timeouts**
   - The system automatically retries with exponential backoff
   - Check network connectivity
   - Verify backend service health

### Debugging

1. **Check Service Health**
   ```typescript
   const { services } = useBackendConnector();
   console.log('Service Status:', services);
   ```

2. **Monitor Connection Status**
   ```typescript
   const { isSystemHealthy, error } = useBackendConnector();
   console.log('System Healthy:', isSystemHealthy);
   console.log('Connection Error:', error);
   ```

3. **Check Cache Status**
   ```typescript
   const cacheStats = dataService.getCacheStats();
   console.log('Cache Stats:', cacheStats);
   ```

## Performance Optimization

1. **Use Caching**: The system automatically caches responses
2. **Enable Refetch Intervals**: For real-time data
3. **Check Health Before Requests**: Avoid unnecessary requests when services are down
4. **Use Specific Hooks**: Pre-built hooks are optimized for common patterns

## Security

1. **Authentication**: All requests are automatically authenticated
2. **Error Handling**: Sensitive error information is filtered
3. **Request Validation**: All requests are validated before sending
4. **Session Management**: Automatic session refresh and retry logic

## Next Steps

### Immediate Priorities (This Week)
- [ ] **Complete Service Layer Standardization** - Follow patterns in this guide
- [ ] **Replace Mock Data** - Use DataService patterns for real business data
- [ ] **Migrate Components** - Replace direct Supabase calls with centralized hooks

### Short Term (Next 2 Weeks)
- [ ] **Add New Data Sources** - Extend BackendConnector for CRM/financial integrations
- [ ] **Enhance Error Handling** - Implement comprehensive error boundaries
- [ ] **Performance Optimization** - Optimize caching and refetch strategies

This backend connection system provides a robust, scalable foundation for connecting to all backend data sources in the Nexus application. 