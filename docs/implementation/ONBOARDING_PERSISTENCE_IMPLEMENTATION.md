# Onboarding Persistence Implementation

## Overview

This implementation ensures that onboarding steps are properly saved to the database and can be recovered on page reload or browser restart. It provides a robust, user-friendly experience with multiple fallback mechanisms.

## 🎯 Key Features

### 1. **Database Persistence**
- Each step saves data to `user_onboarding_steps` table
- Uses proper database helper functions (`upsertOne`, `selectData`)
- Handles step completion tracking
- Supports step skipping with data preservation

### 2. **Progress Recovery**
- Automatically loads saved progress on component mount
- Determines current step based on completed steps
- Restores all form data from previous steps
- Shows loading states during recovery

### 3. **LocalStorage Backup**
- Saves progress to localStorage as backup
- Fallback mechanism if database is unavailable
- Automatic cleanup after successful completion
- Timestamp tracking for last save

### 4. **Error Handling & Resilience**
- Graceful degradation if database save fails
- User notifications for save status
- Continues onboarding even with save failures
- Comprehensive error logging

### 5. **User Experience Enhancements**
- Loading states with progress indicators
- Save status indicators in header
- Toast notifications for save success/failure
- Automatic recovery from interruptions

## 🏗️ Architecture

### Database Schema

```sql
-- User onboarding steps table
CREATE TABLE user_onboarding_steps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    step_id TEXT NOT NULL,
    step_data JSONB,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, step_id)
);
```

### Component Structure

```
AppWithOnboarding
├── Progress Recovery (useEffect)
│   ├── Database Load (fetchProgress)
│   ├── Step Data Load (loadSavedStepData)
│   └── localStorage Fallback
├── Step Navigation
│   ├── handleNext (save + advance)
│   ├── handleSkip (save + advance)
│   └── handleBack (local only)
├── Data Persistence
│   ├── Database Save (saveStep)
│   ├── localStorage Backup
│   └── Progress Tracking
└── Error Handling
    ├── Save Failure Recovery
    ├── Loading States
    └── User Notifications
```

### Data Flow

1. **Component Mount**
   ```
   User loads page → Check database → Load saved steps → Restore progress
   ```

2. **Step Completion**
   ```
   User completes step → Save to database → Save to localStorage → Advance step
   ```

3. **Error Recovery**
   ```
   Database fails → Use localStorage → Show warning → Continue onboarding
   ```

## 🔧 Implementation Details

### 1. **Step Data Saving**

```typescript
const handleNext = useCallback(async (data: Record<string, unknown>) => {
  // Save to database
  const success = await saveStep(stepId, {
    ...data,
    userId: user.id
  });

  // Save to localStorage as backup
  saveToLocalStorage(updatedData, currentStep + 1);

  // Update local state
  setOnboardingData(updatedData);
  setCurrentStep(prev => prev + 1);
}, [user?.id, currentStep, steps, saveStep, completeStep]);
```

### 2. **Progress Recovery**

```typescript
useEffect(() => {
  const loadSavedProgress = async () => {
    // Load from database
    const savedSteps = await loadSavedStepData(user.id);
    
    if (savedSteps) {
      setOnboardingData(savedSteps);
      // Determine current step
      const lastCompletedIndex = steps.findIndex(step => 
        !completedStepIds.includes(step.id)
      );
      setCurrentStep(lastCompletedIndex);
    } else {
      // Fallback to localStorage
      const localData = loadFromLocalStorage();
      if (localData) {
        setOnboardingData(localData.data);
        setCurrentStep(localData.step);
      }
    }
  };
}, [user?.id]);
```

### 3. **LocalStorage Management**

```typescript
const STORAGE_KEYS = {
  ONBOARDING_DATA: 'nexus-onboarding-data',
  CURRENT_STEP: 'nexus-onboarding-current-step',
  LAST_SAVED: 'nexus-onboarding-last-saved'
};

const saveToLocalStorage = useCallback((data, step) => {
  localStorage.setItem(STORAGE_KEYS.ONBOARDING_DATA, JSON.stringify(data));
  localStorage.setItem(STORAGE_KEYS.CURRENT_STEP, step.toString());
  localStorage.setItem(STORAGE_KEYS.LAST_SAVED, new Date().toISOString());
}, []);
```

## 📊 API Endpoints

### GET /api/onboarding/saved-steps

Retrieves saved step data for a user.

**Request:**
```json
{
  "userId": "user-id"
}
```

**Response:**
```json
{
  "data": [
    {
      "step_id": "welcome",
      "step_data": { "firstName": "John", "lastName": "Doe" },
      "completed_at": "2024-01-01T00:00:00Z"
    }
  ],
  "error": null
}
```

## 🧪 Testing

### Test Coverage

- ✅ Step data saving to database
- ✅ localStorage backup functionality
- ✅ Progress recovery from database
- ✅ localStorage fallback on database failure
- ✅ Error handling and user notifications
- ✅ Step completion tracking
- ✅ Data cleanup after completion

### Running Tests

```bash
# Run onboarding persistence tests
pnpm test __tests__/onboarding/OnboardingPersistence.test.tsx

# Run all onboarding tests
pnpm test __tests__/onboarding/
```

## 🚀 Usage

### For Developers

1. **Step Components**: Ensure your step component passes data to `onNext`:
   ```typescript
   const handleComplete = () => {
     onNext({
       userProfile: { firstName, lastName },
       companyProfile: { name, industry }
     });
   };
   ```

2. **Data Structure**: Use consistent data structure across steps:
   ```typescript
   interface StepData {
     userProfile?: any;
     companyProfile?: any;
     foundationalKnowledge?: any;
     [key: string]: any;
   }
   ```

### For Users

1. **Automatic Saving**: Progress is saved automatically after each step
2. **Recovery**: If you close the browser, your progress will be restored
3. **Notifications**: You'll see save status in the header and toast notifications
4. **Error Handling**: If there are issues, you can continue and data will be saved locally

## 🔍 Monitoring & Debugging

### Logging

The implementation includes comprehensive logging:

```typescript
logger.info('Saving onboarding step', { stepId, userId, dataKeys });
logger.info('Restored onboarding progress', { currentStep, completedSteps });
logger.warn('Failed to save to localStorage', { error });
```

### Debug Information

- Save timestamps in header
- Console logs for save operations
- Error details in browser console
- localStorage inspection for debugging

## 🔄 Migration & Deployment

### Database Migration

Ensure the required tables exist:

```bash
# Apply onboarding tables migration
pnpm supabase db push

# Or manually run the SQL
psql -h your-db-host -U postgres -d postgres -f scripts/apply-onboarding-migration.sql
```

### Environment Variables

No additional environment variables required. Uses existing database configuration.

## 📈 Performance Considerations

- **Lazy Loading**: Step data is loaded only when needed
- **Efficient Queries**: Uses indexed database queries
- **Minimal localStorage**: Only essential data is stored locally
- **Debounced Saves**: Prevents excessive database writes

## 🔒 Security

- **RLS Policies**: Database access controlled by Row Level Security
- **User Isolation**: Users can only access their own onboarding data
- **Data Validation**: All data is validated before saving
- **Secure Storage**: Sensitive data not stored in localStorage

## 🎯 Success Metrics

- **Completion Rate**: Users complete onboarding without losing progress
- **Recovery Rate**: Successfully restore progress after interruption
- **Error Rate**: Minimal save failures and graceful error handling
- **User Satisfaction**: Smooth, uninterrupted onboarding experience

## 🔮 Future Enhancements

1. **Real-time Sync**: WebSocket-based real-time progress sync
2. **Offline Support**: Full offline onboarding with sync when online
3. **Progress Analytics**: Track onboarding completion patterns
4. **A/B Testing**: Test different onboarding flows
5. **Mobile Optimization**: Enhanced mobile onboarding experience
