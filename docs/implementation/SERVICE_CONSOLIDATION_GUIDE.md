# Service Consolidation Guide

## Overview

This document outlines the service consolidation effort to create a clean, maintainable codebase by eliminating duplications and merging related functionality.

## 🎯 Goals

- **Reduce Complexity**: Fewer services to maintain
- **Improve Performance**: Shared caching and optimization
- **Consistent APIs**: Unified interfaces across domains
- **Better Testing**: Consolidated test suites
- **Clear Boundaries**: Better separation of concerns

## 📋 Consolidation Status

### ✅ **Completed Consolidations**

#### 1. **User Services** → `src/services/core/UserService.ts`
**Merged Services:**
- `src/services/business/UserService.ts`
- `src/services/auth/UserProfileService.ts`
- `src/services/business/userProfileService.ts`

**New Unified API:**
```typescript
// Auth operations
await userService.getAuthProfile(userId)
await userService.upsertAuthProfile(userId, data)

// Business operations
await userService.getBusinessProfile(userId)
await userService.updateBusinessProfile(userId, data)

// Company operations
await userService.getCompanyProfile(companyId)
await userService.updateCompanyProfile(companyId, data)
await userService.createCompanyProfile(data)
```

#### 2. **Analytics Services** → `src/services/core/AnalyticsService.ts`
**Merged Services:**
- `src/services/AnalyticsService.ts` (Integration analytics)
- `src/services/analytics/analyticsService.ts` (General analytics + Google Analytics)

**New Unified API:**
```typescript
// Integration analytics
await analyticsService.getUserIntegrationAnalytics(userId)
await analyticsService.getUserDataSources(userId)
await analyticsService.getDataUsageByCategory(userId)

// General analytics
await analyticsService.trackEvent(event)
await analyticsService.getUserEvents(userId)
await analyticsService.getAnalyticsMetrics(userId)

// Google Analytics
await analyticsService.getGoogleAnalyticsData(config, propertyId, dateRange)
await analyticsService.getGoogleWorkspaceUsage(config)
```

#### 3. **AI Insights Services** → `src/services/ai/AIInsightsService.ts`
**Merged Services:**
- `src/services/ai/advancedAIRecommendationEngine.ts` (AI recommendations)
- `src/services/PredictiveInsightsService.ts` (Predictive insights)

**New Unified API:**
```typescript
// AI Recommendations
await aiInsightsService.getRecommendations(context)
await aiInsightsService.generateRecommendation(context)

// Predictive Insights
await aiInsightsService.getPredictiveInsights(context)
await aiInsightsService.generatePredictiveInsight(context)

// Unified Insights (combines both)
await aiInsightsService.getUnifiedInsights(context)
```

#### 4. **Company Services** → `src/services/core/CompanyService.ts`
**Merged Services:**
- `src/services/business/CompanyService.ts`
- `src/services/business/CompanyProvisioningService.ts`

**New Unified API:**
```typescript
// Company CRUD operations
await companyService.get(companyId)
await companyService.create(companyData)
await companyService.update(companyId, updates)
await companyService.delete(companyId)

// Company provisioning
await companyService.ensureCompanyAssociation(userId, options)
await companyService.getOrCreateCompany(userId)

// Company management
await companyService.getCompanyWithDetails(companyId)
await companyService.getCompanyHealth(companyId)
```

#### 5. **Financial Services** → `src/services/core/FinancialService.ts`
**Merged Services:**
- `src/services/business/financialDataService.ts`
- `src/services/business/BillingService.ts`

**New Unified API:**
```typescript
// Financial data operations
await financialService.storeFinancialData(data)
await financialService.getFinancialData(userId, filters)
await financialService.calculateFinancialMetrics(userId, date)
await financialService.getFinancialHealthScore(userId)

// Billing operations
await financialService.getBillingStatus(userId)
await financialService.getUsageBilling(userId, period)
await financialService.createCustomerPortalSession(userId)
financialService.getPaymentLinks()
```

#### 6. **Notification Services** → `src/services/core/NotificationService.ts`
**Merged Services:**
- `src/services/business/NotificationService.ts`

**New Unified API:**
```typescript
// Notification operations
await notificationService.sendNotification(userId, notification)
await notificationService.sendBulkNotification(userIds, notification)
await notificationService.markAsRead(notificationId)
await notificationService.markAllAsRead(userId)
await notificationService.getUnreadCount(userId)

// Notification management
await notificationService.getNotificationsByCategory(userId, category)
await notificationService.getNotificationsByPriority(userId, priority)
await notificationService.subscribeToChannel(userId, channel, settings)
await notificationService.unsubscribeFromChannel(userId, channel)

// Specialized notifications
await notificationService.sendSystemNotification(message, category)
await notificationService.sendUrgentNotification(userId, title, message)
await notificationService.sendBillingNotification(userId, title, message)
await notificationService.sendSecurityNotification(userId, title, message)
await notificationService.sendIntegrationNotification(userId, title, message)

// Statistics and cleanup
await notificationService.getNotificationStats(userId)
await notificationService.deleteExpiredNotifications()
```

### 🔄 **Pending Consolidations**

## 🏗️ New Service Architecture

```
src/services/
├── core/                    # ✅ Consolidated core services
│   ├── UserService.ts      # Unified user management
│   ├── AnalyticsService.ts # Unified analytics
│   └── index.ts           # Core service exports
├── ai/                     # AI-specific services
│   ├── AIInsightsService.ts # ✅ Consolidated AI insights
│   ├── AIService.ts        # Core AI operations
│   └── nexusUnifiedBrain.ts # Brain operations
├── business/               # Business domain services
│   └── [other business services]
└── integrations/           # Integration services
    └── [integration services]
```

## 📚 Migration Guide

### For Developers

#### 1. **Update Imports**
```typescript
// ❌ Old way (multiple imports)
import { UserService } from '@/services/business/UserService';
import { UserProfileService } from '@/services/auth/UserProfileService';
import { AnalyticsService } from '@/services/AnalyticsService';

// ✅ New way (single consolidated import)
import { userService, analyticsService } from '@/services/core';
```

#### 2. **Update Service Usage**
```typescript
// ❌ Old way (inconsistent APIs)
const userProfile = await userService.getUserProfile(userId);
const authProfile = await authService.getProfile(userId);
const analytics = await analyticsService.getIntegrationAnalytics(userId);

// ✅ New way (unified APIs)
const userProfile = await userService.getAuthProfile(userId);
const businessProfile = await userService.getBusinessProfile(userId);
const analytics = await analyticsService.getUserIntegrationAnalytics(userId);
```

#### 3. **Update Type Imports**
```typescript
// ❌ Old way (multiple type sources)
import type { UserProfile } from '@/services/business/UserService';
import type { AnalyticsEvent } from '@/services/analytics/analyticsService';

// ✅ New way (single source)
import type { UserProfile, AnalyticsEvent } from '@/services/core';
```

### For Components

#### 1. **Update Service Hooks**
```typescript
// ❌ Old way
const { data: userProfile } = useQuery(['user', userId], () => 
  userService.getUserProfile(userId)
);

// ✅ New way
const { data: userProfile } = useQuery(['user', userId], () => 
  userService.getAuthProfile(userId)
);
```

#### 2. **Update Type Definitions**
```typescript
// ❌ Old way
interface Props {
  user: UserProfile; // From old service
}

// ✅ New way
import type { UserProfile } from '@/services/core';

interface Props {
  user: UserProfile; // From consolidated service
}
```

## 🔧 Development Workflow

### Adding New Features

1. **Use Consolidated Services**: Always use the new consolidated services for new features
2. **Follow Unified APIs**: Use the standardized API patterns established in consolidated services
3. **Update Documentation**: Keep this guide updated as new consolidations are completed

### Refactoring Existing Code

1. **Identify Old Service Usage**: Use the migration helpers to identify old service usage
2. **Update Imports**: Replace old service imports with consolidated service imports
3. **Update API Calls**: Replace old API calls with new unified API calls
4. **Test Thoroughly**: Ensure all functionality works with the new services
5. **Remove Old Code**: Once migration is complete, remove old service files

### Migration Helpers

```typescript
import { isServiceMigrated, getMigrationInfo } from '@/services/core';

// Check if a service has been migrated
if (isServiceMigrated('src/services/business/UserService.ts')) {
  console.log('Service has been migrated');
}

// Get migration information
const migrationInfo = getMigrationInfo('src/services/business/UserService.ts');
console.log(migrationInfo);
// Output: { status: 'CONSOLIDATED', newService: 'src/services/core/UserService.ts', migrationDate: '2024-01-17' }
```

## 🧪 Testing Strategy

### Unit Tests
- Test each consolidated service independently
- Ensure all old functionality is preserved
- Test new unified APIs

### Integration Tests
- Test service interactions
- Test data flow between services
- Test error handling

### Migration Tests
- Test that old API calls still work (if backward compatibility is maintained)
- Test that new API calls work correctly
- Test that data is consistent between old and new services

## 📊 Benefits Achieved

### Before Consolidation
- **3 User Services** with overlapping functionality
- **2 Analytics Services** with different APIs
- **2 AI Insights Services** with similar purposes
- **Inconsistent APIs** across related services
- **Duplicate Code** and maintenance overhead

### After Consolidation
- **1 Unified User Service** with clear separation of concerns
- **1 Unified Analytics Service** with comprehensive functionality
- **1 Unified AI Insights Service** combining recommendations and predictions
- **Consistent APIs** following established patterns
- **Reduced Complexity** and improved maintainability

## 🚀 Next Steps

1. **Complete Remaining Consolidations**: Finish consolidating company, financial, and notification services
2. **Update All Components**: Migrate all components to use consolidated services
3. **Remove Old Services**: Clean up old service files after full migration
4. **Performance Optimization**: Optimize consolidated services for better performance
5. **Documentation Updates**: Keep documentation current with service changes

## 📞 Support

For questions about the consolidation effort:
- Check this documentation first
- Review the migration helpers in `src/services/core/index.ts`
- Look at the consolidated service implementations for examples
- Create an issue if you encounter problems during migration
