# Nexus OS Onboarding System

A comprehensive onboarding flow that allows users to connect their own n8n instances and configure their Nexus workspace.

## Overview

The onboarding system provides a guided setup experience for new Nexus users, including:

- Welcome and introduction
- Optional n8n instance connection
- Department configuration
- Completion and entry into main application

## Components

### Core Components

#### `OnboardingFlow.tsx`
Main onboarding component with step-by-step progress flow.

```tsx
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';

<OnboardingFlow
  onComplete={() => console.log('Onboarding complete')}
  className="custom-styles"
/>
```

#### `N8nConnectionSetup.tsx`
Specialized component for connecting user's n8n instance.

```tsx
import { N8nConnectionSetup } from './components/onboarding/N8nConnectionSetup';

<N8nConnectionSetup
  onComplete={(config) => console.log('n8n configured:', config)}
  onSkip={() => console.log('n8n skipped')}
/>
```

#### `AppWithOnboarding.tsx`
App wrapper that conditionally shows onboarding or main app.

```tsx
import { AppWithOnboarding } from './components/layout/AppWithOnboarding';

<AppWithOnboarding>
  <YourMainApp />
</AppWithOnboarding>
```

### Service Layer

#### `userN8nConfig.ts`
Service for managing user-specific n8n configurations.

```typescript
import { userN8nConfigService } from './lib/userN8nConfig';

// Get current user's configuration
const config = await userN8nConfigService.getCurrentUserConfig();

// Save new configuration
const success = await userN8nConfigService.saveUserConfig({
  baseUrl: 'https://n8n.example.com',
  apiKey: 'n8n_api_key',
  instanceName: 'My Instance',
  isActive: true
});

// Test connection
const result = await userN8nConfigService.testConnection(baseUrl, apiKey);
```

#### `n8nOnboardingManager.ts`
Orchestrates the onboarding flow and step management.

```typescript
import { n8nOnboardingManager } from './lib/n8nOnboardingManager';

// Get current state
const state = await n8nOnboardingManager.getOnboardingState();

// Complete a step
await n8nOnboardingManager.completeStep('n8n-connection');

// Subscribe to changes
const unsubscribe = n8nOnboardingManager.subscribe((state) => {
  console.log('Onboarding state updated:', state);
});
```

### React Hooks

#### `useOnboarding()`
Main hook for onboarding state and actions.

```typescript
import { useOnboarding } from './lib/useOnboarding';

function MyComponent() {
  const {
    onboardingState,
    needsOnboarding,
    isLoading,
    userN8nConfig,
    hasN8nConfig,
    completeOnboarding,
    testN8nConnection
  } = useOnboarding();

  return (
    <div>
      {needsOnboarding ? 'Show onboarding' : 'Show main app'}
    </div>
  );
}
```

#### `useN8nConfigStatus()`
Hook specifically for n8n configuration status.

```typescript
import { useN8nConfigStatus } from './lib/useOnboarding';

function N8nStatus() {
  const { config, isConfigured, refreshConfig } = useN8nConfigStatus();

  return (
    <div>
      {isConfigured ? `Connected to ${config?.instanceName}` : 'Not configured'}
    </div>
  );
}
```

#### `useShowOnboarding()`
Simple hook to determine if onboarding should be displayed.

```typescript
import { useShowOnboarding } from './lib/useOnboarding';

function App() {
  const { shouldShow, isLoading } = useShowOnboarding();

  if (isLoading) return <Loading />;
  if (shouldShow) return <OnboardingFlow />;
  return <MainApp />;
}
```

## Integration Guide

### Basic Integration

1. **Wrap your app with the onboarding wrapper:**

```tsx
// App.tsx
import { AppWithOnboarding } from './components/layout/AppWithOnboarding';
import { YourMainApp } from './YourMainApp';

export default function App() {
  return (
    <AppWithOnboarding>
      <YourMainApp />
    </AppWithOnboarding>
  );
}
```

2. **The wrapper automatically handles showing onboarding vs main app based on user state.**

### Advanced Integration

For more control over the onboarding flow:

```tsx
// CustomApp.tsx
import { useOnboarding } from './lib/useOnboarding';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';

export default function CustomApp() {
  const { needsOnboarding, isLoading, completeOnboarding } = useOnboarding();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (needsOnboarding) {
    return (
      <OnboardingFlow
        onComplete={() => {
          completeOnboarding();
          // Custom completion logic
        }}
      />
    );
  }

  return <YourMainApp />;
}
```

### Department Page Integration

Add n8n configuration check to department pages:

```tsx
// DepartmentPage.tsx
import { useN8nConfigStatus } from './lib/useOnboarding';
import { N8nConnectionSetup } from './components/onboarding/N8nConnectionSetup';

export default function DepartmentPage() {
  const { isConfigured } = useN8nConfigStatus();

  if (!isConfigured) {
    return (
      <div className="p-6">
        <h2>Connect n8n to unlock AI features</h2>
        <N8nConnectionSetup
          onComplete={(config) => window.location.reload()}
          onSkip={() => console.log('User skipped n8n setup')}
        />
      </div>
    );
  }

  return <DepartmentContent />;
}
```

## Configuration Storage

The system uses a **database-first** approach with localStorage fallback:

### Primary Storage (Supabase Database)
- User n8n configurations stored in `n8n_configurations` table
- Row Level Security (RLS) ensures user data isolation
- Automatic backups and persistence across devices
- Real-time synchronization across browser sessions

### Database Schema
```sql
CREATE TABLE n8n_configurations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    instance_name TEXT,
    base_url TEXT NOT NULL,
    api_key TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Fallback Storage (localStorage)
- Used when database operations fail
- Provides offline functionality
- Automatically syncs to database when connection is restored

### Migration Applied
Run the following command to apply the database migration:
```bash
npx supabase db push
```

## Onboarding Steps

1. **Welcome** (required)
   - Introduction to Nexus OS
   - Overview of features

2. **n8n Connection** (optional)
   - URL and API key input
   - Connection testing
   - Configuration storage

3. **Department Setup** (required)
   - Configure business departments
   - Set up department-specific features

4. **Complete** (required)
   - Final confirmation
   - Entry into main application

## Customization

### Adding New Steps

Add steps to the onboarding manager:

```typescript
// In n8nOnboardingManager.ts
private steps: OnboardingStep[] = [
  // ... existing steps
  {
    id: 'custom-step',
    title: 'Custom Configuration',
    description: 'Set up custom features',
    completed: false,
    required: true
  }
];
```

Then add the corresponding UI in `OnboardingFlow.tsx`:

```tsx
{currentStepId === 'custom-step' && (
  <CustomStepComponent onComplete={() => handleStepComplete('custom-step')} />
)}
```

### Styling

All components use Tailwind CSS with dark mode support. Customize by:

1. **Overriding component props:**
```tsx
<OnboardingFlow className="custom-background" />
```

2. **Extending the design system:**
```css
.onboarding-custom {
  @apply bg-gradient-to-r from-purple-400 to-pink-400;
}
```

### Validation

Add custom validation to n8n connection:

```typescript
// In userN8nConfig.ts, extend testConnection method
const customValidation = await yourCustomValidation(baseUrl, apiKey);
if (!customValidation.valid) {
  return { success: false, error: customValidation.error };
}
```

## Testing

### Manual Testing

1. Clear localStorage: `localStorage.clear()`
2. Refresh the app
3. Onboarding should appear
4. Test each step of the flow

### Reset Onboarding

```typescript
import { n8nOnboardingManager } from './lib/n8nOnboardingManager';

// Reset for testing
await n8nOnboardingManager.resetOnboarding();
```

### Test n8n Connection

```typescript
import { userN8nConfigService } from './lib/userN8nConfig';

const result = await userN8nConfigService.testConnection(
  'https://your-n8n-instance.com',
  'your-api-key'
);

console.log('Connection test:', result);
```

## Security Considerations

1. **API Key Storage**: Currently stored in localStorage. In production, consider more secure storage options.

2. **Connection Testing**: Validates n8n instances before saving configurations.

3. **User Isolation**: Each user's configuration is isolated by user ID.

4. **CORS**: Ensure your n8n instance allows requests from your Nexus domain.

## Troubleshooting

### Common Issues

1. **Onboarding Not Showing**
   - Check localStorage for existing onboarding state
   - Ensure user is authenticated

2. **n8n Connection Failed**
   - Verify n8n instance URL is accessible
   - Check API key permissions
   - Confirm CORS settings

3. **Configuration Not Persisting**
   - Check browser localStorage quota
   - Verify user authentication

### Debug Mode

Enable debug logging:

```typescript
// Add to your app initialization
localStorage.setItem('nexus_debug', 'true');
```

This will log detailed information about onboarding state changes and configuration loading. 