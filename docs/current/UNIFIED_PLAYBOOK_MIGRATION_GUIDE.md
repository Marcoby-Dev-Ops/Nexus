# 🚀 Unified Playbook System Migration Guide

## 📋 **Overview**

This guide helps you migrate from the fragmented playbook/journey/onboarding system to the new **Unified Playbook System** that consolidates all functionality into a single, clear architecture.

## 🎯 **What Changed**

### **Before (Tech Debt)**
- **3 separate systems**: OnboardingService, JourneyService, ConsolidatedPlaybookService
- **Confused terminology**: Journey vs Playbook vs Onboarding
- **Duplicate functionality**: Same features implemented 3 times
- **Multiple hooks**: useOnboardingService, useJourney, usePlaybook
- **Inconsistent APIs**: Different patterns for similar operations

### **After (Unified)**
- **1 unified system**: UnifiedPlaybookService
- **Clear concepts**: Playbook = template, Journey = instance, Onboarding = playbook type
- **Single hook**: useUnifiedPlaybook
- **Consistent API**: Same patterns for all operations
- **Backward compatibility**: Legacy exports maintained

## 🔄 **Migration Steps**

### **Step 1: Update Imports**

#### **Old Way**
```typescript
// Multiple imports
import { useOnboardingService } from '@/shared/hooks/useOnboardingService';
import { useJourney } from '@/shared/hooks/useJourney';
import { onboardingService } from '@/shared/services/OnboardingService';
import { journeyService } from '@/services/playbook/JourneyService';
```

#### **New Way**
```typescript
// Single import
import { useUnifiedPlaybook } from '@/shared/hooks/useUnifiedPlaybook';
import { unifiedPlaybookService } from '@/services/playbook/UnifiedPlaybookService';
```

### **Step 2: Update Hook Usage**

#### **Old Onboarding Hook**
```typescript
const { saveStep, getOnboardingProgress, completeOnboarding } = useOnboardingService();

// Save step
await saveStep('welcome', { data: 'value' });

// Get progress
const progress = await getOnboardingProgress('userId');
```

#### **New Unified Hook**
```typescript
const { completeStep, getOnboardingStatus, startOnboarding } = useUnifiedPlaybook({
  playbookId: 'onboarding-v1',
  autoStart: true
});

// Complete step
await completeStep('welcome-introduction', { data: 'value' });

// Get status
const status = await getOnboardingStatus();
```

### **Step 3: Update Service Usage**

#### **Old Service Calls**
```typescript
// Onboarding service
const result = await onboardingService.saveOnboardingStep(userId, stepId, data);
const status = await onboardingService.getOnboardingStatus(userId);

// Journey service
const journey = await journeyService.startPlaybook(userId, orgId, templateId);
const progress = await journeyService.getPlaybookProgress(userId, orgId, playbookId);
```

#### **New Service Calls**
```typescript
// Unified service
const result = await unifiedPlaybookService.completeStep(journeyId, stepId, data);
const status = await unifiedPlaybookService.getOnboardingStatus(userId);

// Start journey
const journey = await unifiedPlaybookService.startJourney(userId, playbookId);
const progress = await unifiedPlaybookService.getUserJourney(userId, playbookId);
```

### **Step 4: Update Component Props**

#### **Old Component**
```typescript
<OnboardingFlow 
  onStepComplete={saveStep}
  onComplete={completeOnboarding}
  progress={onboardingProgress}
/>
```

#### **New Component**
```typescript
<UnifiedPlaybookFlow 
  playbookId="onboarding-v1"
  onStepComplete={completeStep}
  onComplete={onComplete}
  progress={progressPercentage}
/>
```

## 📚 **API Reference**

### **Unified Playbook Hook**

```typescript
const {
  // State
  template,
  journey,
  loadingTemplate,
  loadingJourney,
  saving,
  error,
  currentStep,
  totalSteps,
  progressPercentage,
  isCompleted,
  isStarted,

  // Actions
  loadTemplate,
  startJourney,
  completeStep,
  updateJourney,
  pauseJourney,
  resumeJourney,
  resetJourney,
  startOnboarding,
  completeOnboardingStep,
  getOnboardingStatus,
  getJourneyAnalytics,
  clearError
} = useUnifiedPlaybook({
  playbookId: 'onboarding-v1',
  autoStart: true,
  onComplete: (journey) => console.log('Completed!', journey),
  onError: (error) => console.error('Error:', error)
});
```

### **Unified Playbook Service**

```typescript
// Template operations
await unifiedPlaybookService.getPlaybookTemplates();
await unifiedPlaybookService.getPlaybookTemplate('onboarding-v1');

// Journey operations
await unifiedPlaybookService.startJourney(userId, playbookId);
await unifiedPlaybookService.getUserJourney(userId, playbookId);
await unifiedPlaybookService.completeStep(journeyId, stepId, response);
await unifiedPlaybookService.updateJourneyProgress(journeyId, updates);

// Onboarding shortcuts
await unifiedPlaybookService.startOnboarding(userId);
await unifiedPlaybookService.completeOnboardingStep(userId, stepId, data);
await unifiedPlaybookService.getOnboardingStatus(userId);

// Analytics
await unifiedPlaybookService.getJourneyAnalytics(userId);
```

## 🔧 **Legacy Compatibility**

### **Backward Compatible Exports**

The following legacy exports are maintained for backward compatibility:

```typescript
// Legacy hooks (now use unified system internally)
export const useOnboardingService = (options) => useUnifiedPlaybook({ ...options, playbookId: 'onboarding-v1' });
export const useJourney = (playbookId, options) => useUnifiedPlaybook({ ...options, playbookId });
export const usePlaybook = (playbookId, options) => useUnifiedPlaybook({ ...options, playbookId });

// Legacy services (now use unified service internally)
export const playbookService = unifiedPlaybookService;
export const journeyService = unifiedPlaybookService;
```

### **Legacy Method Mapping**

```typescript
// Old method names still work
const { saveStep, saveOnboardingStep, getOnboardingProgress, completeOnboarding } = useOnboardingService();

// These map to new methods:
saveStep → completeStep
saveOnboardingStep → completeOnboardingStep
getOnboardingProgress → getOnboardingStatus
completeOnboarding → completeStep
```

## 🗂️ **Database Schema Changes**

### **New Tables**
```sql
-- User journeys (active instances)
CREATE TABLE user_journeys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  playbook_id TEXT NOT NULL,
  status TEXT CHECK (status IN ('not_started', 'in_progress', 'completed', 'paused')),
  current_step INTEGER DEFAULT 1,
  total_steps INTEGER NOT NULL,
  progress_percentage REAL DEFAULT 0,
  step_responses JSONB,
  metadata JSONB,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Step responses
CREATE TABLE step_responses (
  id TEXT PRIMARY KEY,
  journey_id TEXT NOT NULL REFERENCES user_journeys(id),
  step_id TEXT NOT NULL,
  response JSONB NOT NULL,
  completed_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);
```

### **Migration Scripts**
```sql
-- Migrate existing onboarding data
INSERT INTO user_journeys (id, user_id, playbook_id, status, current_step, total_steps, progress_percentage, step_responses, created_at, updated_at)
SELECT 
  'onboarding-' || user_id,
  user_id,
  'onboarding-v1',
  CASE WHEN onboarding_completed THEN 'completed' ELSE 'in_progress' END,
  COALESCE(current_step, 1),
  5, -- Total onboarding steps
  COALESCE(progress_percentage, 0),
  onboarding_data,
  created_at,
  updated_at
FROM user_onboarding_steps;
```

## 🧪 **Testing**

### **Update Test Files**

#### **Old Test**
```typescript
import { useOnboardingService } from '@/shared/hooks/useOnboardingService';
import { onboardingService } from '@/shared/services/OnboardingService';

jest.spyOn(onboardingService, 'saveOnboardingStep').mockResolvedValueOnce({
  success: true,
  data: { stepId: 'welcome', completed: true }
});
```

#### **New Test**
```typescript
import { useUnifiedPlaybook } from '@/shared/hooks/useUnifiedPlaybook';
import { unifiedPlaybookService } from '@/services/playbook/UnifiedPlaybookService';

jest.spyOn(unifiedPlaybookService, 'completeStep').mockResolvedValueOnce({
  success: true,
  data: { id: 'journey-1', currentStep: 2, status: 'in_progress' }
});
```

## 🚨 **Breaking Changes**

### **Removed APIs**
- `OnboardingService.saveOnboardingStep()` → Use `UnifiedPlaybookService.completeStep()`
- `JourneyService.startPlaybook()` → Use `UnifiedPlaybookService.startJourney()`
- `useOnboardingProgress` hook → Use `useUnifiedPlaybook`

### **Changed Method Names**
- `saveStep` → `completeStep`
- `getOnboardingProgress` → `getOnboardingStatus`
- `startPlaybook` → `startJourney`

### **Changed Data Structures**
- Onboarding data now stored in `user_journeys` table
- Step responses stored in `step_responses` table
- Progress calculated from journey state

## 📈 **Benefits After Migration**

1. **Reduced Complexity**: One system instead of three
2. **Consistent API**: Same patterns for all operations
3. **Better Performance**: Single service, optimized queries
4. **Easier Testing**: One hook to test instead of multiple
5. **Clearer Concepts**: No more confusion between playbook/journey/onboarding
6. **Future-Proof**: Unified architecture for new features

## 🆘 **Need Help?**

If you encounter issues during migration:

1. **Check the legacy compatibility exports** - they should work as drop-in replacements
2. **Review the API reference** - all methods are documented above
3. **Look at existing examples** - check how other components have been migrated
4. **Create a test branch** - migrate one component at a time
5. **Ask for help** - the unified system is designed to be simpler, not harder

## ✅ **Migration Checklist**

- [ ] Update imports to use unified services
- [ ] Replace old hooks with useUnifiedPlaybook
- [ ] Update service method calls
- [ ] Update component props and event handlers
- [ ] Update test files
- [ ] Verify backward compatibility works
- [ ] Test onboarding flow end-to-end
- [ ] Update documentation
- [ ] Remove old service imports (optional)

---

**Remember**: The unified system is designed to be **simpler and more intuitive** than the old fragmented system. If something feels more complicated, you're probably doing it wrong - check the examples above!
