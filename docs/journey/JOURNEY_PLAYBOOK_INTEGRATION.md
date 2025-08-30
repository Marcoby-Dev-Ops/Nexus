# Journey Playbook Integration

## Overview

This document describes the comprehensive integration between the Journey system and the Playbook system in Nexus. This integration enables journeys to leverage playbook data, building blocks, maturity frameworks, and provides a unified experience for business guidance.

## Architecture

### Core Components

1. **JourneyService** - Enhanced with playbook integration capabilities
2. **JourneyRunner** - Main component for executing journeys with split layout
3. **Step Components** - Individual journey step implementations
4. **Playbook Integration** - Links journeys to playbooks, building blocks, and maturity frameworks

### Database Schema

```sql
-- Journey Tables
journey_templates (id, title, description, playbook_id, building_blocks, maturity_framework_id)
journey_items (id, template_id, title, description, component_name, order)
user_journey_progress (id, user_id, journey_id, current_step, progress_percentage)
user_journey_responses (id, progress_id, item_id, response_data)

-- Playbook Tables (existing)
playbooks (id, name, description, building_blocks)
building_blocks (id, name, description, properties)
maturity_frameworks (id, name, levels, criteria)
user_playbook_progress (id, user_id, playbook_id, status)
user_playbook_item_responses (id, progress_id, item_id, response_data)
```

## Features

### 1. Enhanced Journey Templates

Journey templates now include:
- **Playbook Integration** - Links to existing playbooks
- **Building Blocks** - Shows which building blocks are covered
- **Maturity Frameworks** - Automatic assessment capabilities
- **Success Metrics** - Clear completion criteria
- **Prerequisites** - What's needed before starting
- **Complexity Levels** - Beginner/Intermediate/Advanced
- **Duration Estimates** - Time expectations

### 2. Split Layout UI

The JourneyRunner implements a standardized split layout:
- **Left Sidebar** - Step navigation cards with progress indicators
- **Main Content** - Current step component
- **Playbook Panel** - Integration information and context

### 3. Step-by-Step Navigation

- Visual step cards showing progress
- Clickable navigation between completed steps
- Progress indicators and completion status
- Duration estimates for each step

### 4. Data Integration

- Journey responses saved to both journey and playbook systems
- Building block updates on journey completion
- Maturity assessment integration
- Unified progress tracking

## Journey Types

### 1. Quantum Building Blocks Journey

**Purpose**: Configure the 7 fundamental building blocks of a business

**Steps**:
1. **Introduction** - Overview of quantum business model
2. **Business Identity** - Chat-based identity setup
3. **Building Blocks** - Configure each of the 7 blocks
4. **Summary** - Review and recommendations

**Playbook Integration**:
- Links to quantum business playbook
- Updates building block data
- Maturity assessment on completion

### 2. MVP Business Setup Journey

**Purpose**: Quick setup for new businesses in under 10 minutes

**Steps**:
1. **Welcome** - Introduction to MVP setup
2. **Business Units** - Select core business functions
3. **Integrations** - Set up essential tools
4. **Maturity Assessment** - 5-question business evaluation
5. **Summary** - Setup score and next steps

**Playbook Integration**:
- Links to MVP business playbook
- Integration recommendations
- Maturity level assessment

## Implementation Details

### JourneyService Enhancements

```typescript
interface JourneyTemplate {
  id: string;
  title: string;
  description: string;
  playbook_id?: string;
  building_blocks?: BuildingBlock[];
  maturity_framework_id?: string;
  estimated_duration_minutes?: number;
  complexity?: 'beginner' | 'intermediate' | 'advanced';
  prerequisites?: string[];
  success_metrics?: string[];
}

interface JourneyItem {
  id: string;
  title: string;
  description: string;
  type: 'step' | 'milestone' | 'task';
  order: number;
  component_name: string;
  estimated_duration_minutes?: number;
  is_required: boolean;
  validation_schema?: any;
  metadata?: any;
}
```

### Step Component Interface

```typescript
interface JourneyStepProps {
  stepId: string;
  stepIndex: number;
  totalSteps: number;
  isActive: boolean;
  isCompleted: boolean;
  onStepComplete: (data: any) => void;
  onStepBack: () => void;
  journeyData: Record<string, any>;
}
```

### Data Flow

1. **Journey Start**
   ```typescript
   // Load template with playbook data
   const template = await journeyService.getJourneyTemplate(journeyId);
   const items = await journeyService.getJourneyItems(journeyId);
   
   // Start progress tracking
   const progress = await journeyService.startJourney(userId, orgId, journeyId);
   ```

2. **Step Execution**
   ```typescript
   // Save step response
   await journeyService.saveJourneyStepResponse(
     userId, orgId, journeyId, stepId, stepData
   );
   
   // Update progress
   const newProgress = {
     ...progress,
     current_step: currentStep + 1,
     progress_percentage: ((currentStep + 1) / totalSteps) * 100
   };
   ```

3. **Journey Completion**
   ```typescript
   // Complete journey with maturity assessment
   const completion = await journeyService.completeJourney(
     userId, orgId, journeyId
   );
   
   // Update building blocks if applicable
   if (template.building_blocks) {
     await updateBuildingBlocks(completion.data);
   }
   ```

## UI Components

### JourneyRunner

The main component that orchestrates journey execution:

```typescript
<JourneyRunner 
  onComplete={(journeyData) => {
    // Handle journey completion
    navigate('/dashboard');
  }}
  onBack={() => navigate('/journey-intake')}
/>
```

### Step Components

Each step is implemented as a separate component:

```typescript
// Example: MVP Welcome Step
export default function MVPWelcomeStep({ onStepComplete, onStepBack }: JourneyStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Welcome to MVP Setup</h2>
        <p className="text-muted-foreground">
          Quick setup to get your business running with Nexus
        </p>
      </div>
      
      {/* Step content */}
      
      <div className="flex justify-between">
        <Button variant="outline" onClick={onStepBack}>
          Back
        </Button>
        <Button onClick={() => onStepComplete({ completed: true })}>
          Continue
        </Button>
      </div>
    </div>
  );
}
```

## Configuration

### Adding New Journeys

1. **Create Journey Template**
   ```typescript
   const NEW_JOURNEY_TEMPLATE: JourneyTemplate = {
     id: 'new-journey',
     title: 'New Journey',
     description: 'Description of the journey',
     playbook_id: 'related-playbook-id',
     estimated_duration_minutes: 30,
     complexity: 'beginner',
     prerequisites: ['prerequisite-1', 'prerequisite-2'],
     success_metrics: ['metric-1', 'metric-2']
   };
   ```

2. **Create Journey Items**
   ```typescript
   function generateNewJourneyItems(): JourneyItem[] {
     return [
       {
         id: 'step-1',
         title: 'Step 1',
         description: 'Description of step 1',
         type: 'step',
         order: 1,
         component_name: 'Step1Component',
         estimated_duration_minutes: 5,
         is_required: true
       }
       // ... more steps
     ];
   }
   ```

3. **Create Step Component**
   ```typescript
   export default function Step1Component(props: JourneyStepProps) {
     // Implementation
   }
   ```

4. **Register in JourneyService**
   ```typescript
   // In JourneyService.ts
   async getJourneyTemplate(templateId: string) {
     if (templateId === 'new-journey') {
       return this.createResponse(NEW_JOURNEY_TEMPLATE);
     }
     // ... other templates
   }
   ```

5. **Add to JourneyRunner**
   ```typescript
   // In JourneyRunner.tsx
   import Step1Component from './steps/Step1Component';
   
   // In renderStepComponent()
   case 'Step1Component':
     return <Step1Component {...stepProps} />;
   ```

## Testing

### Manual Testing Checklist

- [ ] Journey loads correctly with template and items
- [ ] Step navigation works (forward/back)
- [ ] Step data is saved correctly
- [ ] Progress tracking updates properly
- [ ] Journey completion triggers maturity assessment
- [ ] Building blocks are updated on completion
- [ ] Playbook integration panel displays correctly
- [ ] Split layout works on different screen sizes

### Automated Testing

```typescript
describe('JourneyRunner', () => {
  it('should load journey template and items', async () => {
    // Test implementation
  });
  
  it('should save step responses', async () => {
    // Test implementation
  });
  
  it('should complete journey with maturity assessment', async () => {
    // Test implementation
  });
});
```

## Performance Considerations

1. **Lazy Loading** - Step components are loaded on demand
2. **Caching** - Journey templates and items are cached
3. **Progress Persistence** - Progress is saved incrementally
4. **Optimistic Updates** - UI updates immediately, syncs in background

## Security

1. **User Authorization** - Only authorized users can access journeys
2. **Data Validation** - All step data is validated before saving
3. **Progress Isolation** - Users can only access their own progress
4. **Audit Trail** - All journey activities are logged

## Future Enhancements

1. **Advanced Maturity Frameworks** - Industry-specific assessments
2. **Journey Templates** - User-created journey templates
3. **Collaboration** - Team-based journey completion
4. **Analytics** - Journey completion analytics and insights
5. **Automation** - Automatic journey recommendations based on business data

## Troubleshooting

### Common Issues

1. **Journey not loading**
   - Check if journey template exists
   - Verify user permissions
   - Check network connectivity

2. **Step data not saving**
   - Verify validation schema
   - Check database connectivity
   - Review error logs

3. **Progress not updating**
   - Check progress calculation logic
   - Verify state management
   - Review component lifecycle

### Debug Mode

Enable debug mode to see detailed logs:

```typescript
// In development
const DEBUG_MODE = process.env.NODE_ENV === 'development';

if (DEBUG_MODE) {
  console.log('Journey data:', journeyData);
  console.log('Progress:', progress);
}
```

## Conclusion

The Journey Playbook Integration provides a powerful, unified system for business guidance. It combines the structured approach of journeys with the rich data and insights of playbooks, creating a comprehensive business development platform.

The split layout design ensures users always know where they are in the journey while providing rich context from the playbook system. The modular step component architecture makes it easy to add new journeys and customize existing ones.

This integration represents a significant step forward in making business guidance more accessible, personalized, and effective.
