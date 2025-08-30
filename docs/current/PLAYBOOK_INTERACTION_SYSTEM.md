# Playbook Interaction System

## Overview

The Playbook Interaction System provides a comprehensive, standardized way for users to view, track, and complete playbooks in Nexus. This system replaces the legacy onboarding system and provides a unified experience for all playbook types.

## Key Features

### 1. **Complete Playbook Visibility**
- View all playbook items with their current status
- See progress percentages and completion summaries
- Understand dependencies between items
- Track required vs optional items

### 2. **Smart Status Tracking**
- **Completed**: Items that have been finished
- **In Progress**: Items that are currently available to work on
- **Blocked**: Items that require previous items to be completed first
- **Pending**: Items waiting to be unlocked

### 3. **Resume Capability**
- Automatically identify the next item to complete
- Save progress and return later
- Track completion timestamps
- Maintain response data for completed items

### 4. **Progress Calculation**
- Real-time progress percentage based on required items
- Visual progress indicators
- Completion summaries with detailed statistics

## Database Schema

### Core Tables

#### `playbook_templates`
- Stores playbook definitions
- Contains metadata like name, description, category, version

#### `playbook_items`
- Individual steps/tasks within a playbook
- Includes order, requirements, validation schemas
- Supports different item types (process, template, checklist, etc.)

#### `user_playbook_progress`
- Tracks overall playbook progress per user
- Stores status, percentage, start/completion dates

#### `user_playbook_responses`
- Records individual item completions
- Stores response data and completion timestamps

## Service Layer

### ConsolidatedPlaybookService

The main service providing playbook interaction functionality:

#### `getPlaybookDetails(userId, playbookName)`
Returns comprehensive playbook information including:
- Playbook metadata
- All items with completion status
- Progress summary
- Next available item

#### `completePlaybookItem(userId, playbookId, itemId, responseData)`
Completes a specific playbook item:
- Records the response
- Updates progress calculations
- Returns next item information
- Handles playbook completion

#### `getActivePlaybook(userId)`
Gets the user's currently active playbook for resumption

#### `recalculatePlaybookProgress(userId, playbookId)`
Private method that recalculates overall progress after item completion

## React Components

### PlaybookViewer

A comprehensive React component that provides the complete playbook interaction experience:

#### Features
- **Progress Dashboard**: Visual progress bar and statistics
- **Item List**: All playbook items with status indicators
- **Interactive Actions**: Start/complete items with forms
- **Status Icons**: Visual indicators for different states
- **Responsive Design**: Works on all device sizes

#### Props
```typescript
interface PlaybookViewerProps {
  playbookName: string;
  onItemComplete?: (itemId: string, responseData: any) => void;
  onPlaybookComplete?: () => void;
}
```

#### Usage
```tsx
<PlaybookViewer
  playbookName="Nexus Business Onboarding Journey"
  onItemComplete={(itemId, data) => console.log('Item completed:', itemId)}
  onPlaybookComplete={() => alert('Playbook completed!')}
/>
```

## Status Logic

### Item Status Determination

1. **Completed**: Item has a `completed_at` timestamp in `user_playbook_responses`
2. **In Progress**: 
   - First item (order_index = 1) is always available
   - Subsequent items require all previous required items to be completed
3. **Blocked**: Previous required items are not completed
4. **Pending**: Default state for items not yet available

### Progress Calculation

Progress is calculated based on required items only:
```
Progress Percentage = (Completed Required Items / Total Required Items) × 100
```

## Implementation Example

### Setting Up Onboarding as First Playbook

1. **Auto-assignment on signup**:
```typescript
// In signup flow
const playbookService = new ConsolidatedPlaybookService();
await playbookService.assignOnboardingPlaybookToUser(userId);
```

2. **Display in dashboard**:
```tsx
<PlaybookViewer
  playbookName="Nexus Business Onboarding Journey"
  onPlaybookComplete={() => {
    // Navigate to main dashboard
    navigate('/dashboard');
  }}
/>
```

3. **Resume functionality**:
```typescript
// Check for active playbook
const activePlaybook = await playbookService.getActivePlaybook(userId);
if (activePlaybook) {
  // Show playbook viewer with current progress
}
```

## Benefits

### For Users
- **Clear Progress**: Always know where they stand
- **Resume Anywhere**: Pick up where they left off
- **Visual Feedback**: Intuitive status indicators
- **Flexible Completion**: Work at their own pace

### For Developers
- **Unified System**: One system for all playbook types
- **Reusable Components**: Standard UI components
- **Type Safety**: Full TypeScript support
- **Extensible**: Easy to add new playbook types

### For Business
- **Standardized Experience**: Consistent across all playbooks
- **Better Completion Rates**: Clear progress tracking
- **Reduced Support**: Self-service playbook completion
- **Data Insights**: Track completion patterns

## Migration from Legacy System

The system includes migration tools to move from the old onboarding system:

1. **Data Migration**: Scripts to transfer existing onboarding data
2. **Service Updates**: Enhanced services with backward compatibility
3. **UI Integration**: New components that work with existing pages
4. **Gradual Rollout**: Can be deployed alongside existing system

## Future Enhancements

### Planned Features
- **Validation Schemas**: JSON schema validation for item responses
- **Conditional Logic**: Dynamic item availability based on responses
- **Time Tracking**: Track time spent on each item
- **Collaboration**: Multi-user playbook completion
- **Templates**: Reusable playbook templates
- **Analytics**: Detailed completion analytics

### Integration Points
- **AI Insights**: Connect completed playbooks to AI recommendations
- **Workflow Automation**: Trigger actions on playbook completion
- **Notification System**: Reminders for incomplete playbooks
- **Gamification**: Achievement badges and progress rewards

## Testing

### Test Page
A dedicated test page (`PlaybookTestPage`) demonstrates all functionality:
- Complete playbook viewing
- Item completion workflow
- Progress tracking
- Error handling

### Database Testing
Scripts for testing playbook assignment and completion:
- `test-onboarding-playbook-assignment.js`
- `migrate-onboarding-to-playbooks.js`

## Conclusion

The Playbook Interaction System provides a robust, scalable foundation for all playbook-based workflows in Nexus. It standardizes the user experience while providing the flexibility needed for different types of playbooks. The system is designed to grow with the platform and support increasingly complex business processes.
