# 🚀 Onboarding Journey Integration

## Overview

Onboarding is now fully integrated into the unified journey system. Instead of separate onboarding services and components, all onboarding flows are handled through the standard journey infrastructure.

## Architecture

### Unified Journey System
- **JourneyService**: Main service for all journey operations
- **JourneyIntakeService**: Handles journey discovery and intake
- **JourneyType**: Includes `'onboarding'` category for starter journeys

### Onboarding Journey Types

#### 1. Business Identity Setup
- **ID**: `business-identity-setup`
- **Duration**: 15-30 minutes
- **Purpose**: Define vision, mission, and value proposition
- **Component**: Uses existing `IdentitySetupChat` through journey system

#### 2. Quantum Building Blocks Setup
- **ID**: `quantum-building-blocks`
- **Duration**: 30-60 minutes
- **Purpose**: Configure the 7 fundamental business building blocks
- **Component**: Uses existing `QuantumOnboardingFlow` through journey system

#### 3. Business Profile Completion
- **ID**: `business-profile-completion`
- **Duration**: 10-20 minutes
- **Purpose**: Complete business profile with industry and goals
- **Component**: Uses standard journey intake flow

## Benefits

### ✅ Unified Experience
- Single journey system for all business development
- Consistent UI/UX across onboarding and growth journeys
- Unified recommendation engine

### ✅ Simplified Architecture
- No duplicate services or components
- Single source of truth for journey types
- Easier maintenance and updates

### ✅ Smart Prioritization
- New users automatically see onboarding journeys first
- Building blocks completion rate influences recommendations
- Progressive journey discovery as business matures

## Implementation

### Journey Discovery
```typescript
// Onboarding journeys are automatically prioritized for new users
const getJourneysForMaturityLevel = (level: string) => {
  if (level === 'startup' || blocksCompletionRate < 0.5) {
    return allJourneys.filter(journey => journey.category === 'onboarding');
  }
  // ... other maturity levels
};
```

### Navigation
```typescript
// All journeys use the same navigation pattern
const handleJourneyStart = (journeyId: string) => {
  navigate(`/journey-intake?journey=${journeyId}`);
};
```

### Intent Recognition
```typescript
// JourneyIntakeService recognizes onboarding keywords
if (message.includes('identity') || message.includes('vision')) {
  suggestedJourneyTypes.push('business-identity-setup');
}
```

## Migration Notes

- Removed separate `OnboardingJourneyService`
- Existing onboarding components remain but are accessed through journey system
- All onboarding flows now use unified journey intake and progress tracking
- Building blocks setup is now a standard journey type with special prioritization
