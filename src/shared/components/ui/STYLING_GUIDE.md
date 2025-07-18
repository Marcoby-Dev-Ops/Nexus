# Nexus Styling Guide

This guide provides comprehensive documentation for the reusable styling system used throughout the Nexus application. Follow these patterns to ensure consistency across all components.

## Overview

The Nexus styling system is built on:
- **shadcn/ui design tokens** for semantic color management
- **Tailwind CSS** for utility-first styling
- **TypeScript** for type-safe styling APIs
- **Reusable components** to ensure consistency

## Quick Start

```tsx
import { Button, IconButton, StatusBadge, cn, getButtonClasses } from '@/components/ui';

// Use semantic tokens instead of hardcoded colors
// ❌ Don't do this:
<button className="bg-blue-600 hover:bg-blue-700 text-white">

// ✅ Do this:
<Button variant="primary">Click me</Button>
// or
<button className={getButtonClasses('primary')}>Click me</button>
```

## Core Principles

### 1. Use Semantic Color Tokens
Always use semantic color tokens that automatically adapt to light/dark themes:

```tsx
// ❌ Hardcoded colors
className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"

// ✅ Semantic tokens
className="bg-secondary text-secondary-foreground"
```

### 2. Prefer Reusable Components
Use the provided UI components instead of custom styling:

```tsx
// ❌ Custom button styling
<button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">

// ✅ Reusable Button component
<Button variant="primary">Click me</Button>
```

### 3. Use Styling Utilities
For custom components, use the provided styling utilities:

```tsx
import { getButtonClasses, getCardClasses, cn } from '@/components/ui';

const CustomButton = ({ className, ...props }) => (
  <button 
    className={cn(getButtonClasses('secondary'), className)} 
    {...props} 
  />
);
```

## Available Components

### Button
Standard button with multiple variants and sizes:

```tsx
import { Button } from '@/components/ui';

<Button variant="primary" size="lg">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>
<Button variant="outline">Outlined</Button>
```

### IconButton
Specialized button for icons:

```tsx
import { IconButton } from '@/components/ui';

<IconButton 
  icon={<SettingsIcon />}
  tooltip="Settings"
  variant="secondary"
  size="icon"
/>
```

### StatusBadge
Consistent status indicators:

```tsx
import { StatusBadge } from '@/components/ui';

<StatusBadge status="success" icon={<CheckIcon />}>
  Completed
</StatusBadge>
<StatusBadge status="error">Failed</StatusBadge>
<StatusBadge status="warning">Pending</StatusBadge>
```

### Card
Consistent card layouts:

```tsx
import { Card } from '@/components/ui';

<Card 
  header="Card Title"
  footer="Card Footer"
  onClick={handleClick} // Makes it interactive
  className="custom-class"
>
  Card content
</Card>
```

## Styling Utilities

### getButtonClasses()
Generate consistent button classes:

```tsx
import { getButtonClasses } from '@/components/ui';

const classes = getButtonClasses('primary', 'lg', 'custom-class');
```

### getCardClasses()
Generate consistent card classes:

```tsx
import { getCardClasses } from '@/components/ui';

const classes = getCardClasses('elevated', true); // elevated + interactive
```

### cn()
Utility for merging Tailwind classes:

```tsx
import { cn } from '@/components/ui';

const classes = cn(
  'base-classes',
  condition && 'conditional-classes',
  props.className
);
```

## Color System

### Semantic Tokens
Use these instead of hardcoded colors:

| Token | Usage |
|-------|-------|
| `bg-background` | Main background |
| `text-foreground` | Main text |
| `bg-card` | Card backgrounds |
| `text-card-foreground` | Card text |
| `bg-primary` | Primary actions |
| `text-primary-foreground` | Primary action text |
| `bg-secondary` | Secondary actions |
| `text-secondary-foreground` | Secondary action text |
| `bg-muted` | Muted backgrounds |
| `text-muted-foreground` | Muted text |
| `bg-accent` | Accent backgrounds |
| `text-accent-foreground` | Accent text |
| `border-border` | Default borders |
| `border-input` | Input borders |
| `focus-visible:ring-ring` | Focus rings |

### Status Colors
For status indicators:

```tsx
// Available status variants
'success' | 'error' | 'warning' | 'info' | 'neutral'

// Usage
<StatusBadge status="success">Online</StatusBadge>
<div className="text-green-600 dark:text-green-400">Success text</div>
```

## Interactive Elements

### Hover States
Use consistent hover patterns:

```tsx
// Cards
className="hover:bg-accent/50 hover:shadow-lg transition-all duration-200"

// Buttons (already built into Button components)
className="hover:bg-primary/90"

// Interactive tiles
className="hover:bg-accent/50 hover:scale-[1.02] transition-all duration-200"
```

### Focus States
Use consistent focus patterns:

```tsx
className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
```

## Migration Guide

### Replacing Hardcoded Buttons

```tsx
// ❌ Before
<button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
  Click me
</button>

// ✅ After
<Button variant="primary">Click me</Button>
```

### Replacing Hardcoded Colors

```tsx
// ❌ Before
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">

// ✅ After
<div className="bg-card text-card-foreground">
```

### Replacing Icon Buttons

```tsx
// ❌ Before
<button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600">
  <SettingsIcon className="w-5 h-5" />
</button>

// ✅ After
<IconButton icon={<SettingsIcon className="w-5 h-5" />} tooltip="Settings" />
```

## Best Practices

1. **Always use semantic tokens** for colors
2. **Prefer components over custom styling**
3. **Use utilities for one-off customizations**
4. **Test in both light and dark themes**
5. **Follow the established size scales**
6. **Use consistent spacing patterns**
7. **Apply interactive states consistently**

## Examples

### Complete Button Pattern
```tsx
import { Button, IconButton } from '@/components/ui';
import { PlusIcon, SettingsIcon } from 'lucide-react';

function ActionBar() {
  return (
    <div className="flex items-center gap-2">
      <Button variant="primary" size="lg">
        Create New
      </Button>
      <Button variant="secondary">
        Save Draft
      </Button>
      <IconButton 
        icon={<SettingsIcon />}
        tooltip="Settings"
        variant="ghost"
      />
    </div>
  );
}
```

### Complete Card Pattern
```tsx
import { Card, StatusBadge } from '@/components/ui';

function ProjectCard({ project }) {
  return (
    <Card 
      header={
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{project.name}</h3>
          <StatusBadge status={project.status}>
            {project.statusText}
          </StatusBadge>
        </div>
      }
      onClick={() => navigate(`/projects/${project.id}`)}
      className="hover:scale-[1.02]"
    >
      <p className="text-muted-foreground">{project.description}</p>
    </Card>
  );
}
```

This system ensures visual consistency, better maintainability, and automatic theme adaptation across the entire application. 