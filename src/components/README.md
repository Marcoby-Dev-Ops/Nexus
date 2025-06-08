# Base UI Components

This directory contains reusable UI components for the Nexus project, built with React, TypeScript, shadcn/ui, and Tailwind CSS. Each component is accessible, theme-aware, and designed for composability.

## Directory Structure

```
components/
├── ui/           # Base UI components
├── dashboard/    # Dashboard-specific components
├── ai/          # AI-related components
├── layout/      # Layout components
└── lib/         # Shared utilities and hooks
```

## UI Components

All base UI components are now located in the `ui/` directory for better organization and maintainability.

### Button
A versatile button supporting variants, loading, and disabled states.
```tsx
import { Button } from '@/components/ui/Button';
<Button variant="primary">Click me</Button>
```

### Input
A styled input field with error and icon support.
```tsx
import { Input } from '@/components/ui/Input';
<Input placeholder="Email" error="Required" />
```

### Card
A container for grouping content, with optional header and footer.
```tsx
import { Card } from '@/components/ui/Card';
<Card header="Title" footer="Footer">Content</Card>
```

### Modal
A modal dialog for overlays and confirmations.
```tsx
import { Modal } from '@/components/ui/Modal';
<Modal open={true} onClose={() => {}}>Hello</Modal>
```

### Alert
A notification component for feedback messages.
```tsx
import { Alert } from '@/components/ui/Alert';
<Alert type="success" message="Saved!" />
```

### Avatar
A user avatar with fallback to initials.
```tsx
import { Avatar } from '@/components/ui/Avatar';
<Avatar initials="AB" />
```

### Dropdown
A dropdown menu for actions and navigation.
```tsx
import { Dropdown } from '@/components/ui/Dropdown';
<Dropdown label="Menu"><button>Item</button></Dropdown>
```

### Tooltip
A tooltip for contextual help.
```tsx
import { Tooltip } from '@/components/ui/Tooltip';
<Tooltip content="Info"><span>Hover me</span></Tooltip>
```

### Spinner
A spinner/loader for loading states.
```tsx
import { Spinner } from '@/components/ui/Spinner';
<Spinner />
```

### Tabs
A tabs component for organizing content.
```tsx
import { Tabs } from '@/components/ui/Tabs';
<Tabs tabs={[{ label: 'Tab1', content: 'Content1' }]} />
```

### Breadcrumbs
A breadcrumbs component for navigation context.
```tsx
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
<Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Page' }]} />
```

### Table
A table for displaying tabular data.
```tsx
import { Table } from '@/components/ui/Table';
<Table columns={[{ header: 'Name', accessor: 'name' }]} data={[{ name: 'Alice' }]} />
```

### Form
A form wrapper for grouping form elements with validation.
```tsx
import { Form } from '@/components/ui/Form';
<Form onSubmit={fn}><Input /></Form>
```

### Header
The Header component includes left padding (`pl-4`) for improved spacing from the left edge of the screen.
```tsx
import { Header } from '@/components/ui/Header';
<Header />
```

## Dashboard Components

The `dashboard/` directory contains components specific to the dashboard functionality:

- `Dashboard.tsx` - Main dashboard layout and orchestration
- `ActivityFeed.tsx` - Recent activity display
- `KpiCard.tsx` - Key Performance Indicator cards
- `StatsCard.tsx` - Enhanced KPI cards with additional features
- `QuickLaunchTiles.tsx` - Quick action tiles
- `MultiAgentPanel.tsx` - AI agent selection and interaction
- `PipelineChart.tsx` - Sales pipeline visualization
- `RevenueChart.tsx` - Revenue data visualization
- `SimpleBarChart.tsx` - Basic bar chart component
- `AdminHome.tsx` - Admin dashboard interface

## AI Components

The `ai/` directory contains AI-related components:

- `ExecutiveAssistant.tsx` - Main AI assistant interface
- `AssistantPanel.tsx` - AI assistant panel component

## Layout Components

The `layout/` directory contains layout-related components:

- `Sidebar.tsx` - Main navigation sidebar
- `SidebarIcon.tsx` - Sidebar navigation icons
- `theme-provider.tsx` - Theme context provider

## Best Practices

1. Use named exports for all components
2. Include TypeScript types for props
3. Add JSDoc comments for component documentation
4. Write unit tests for all components
5. Use the `@/components` path alias for imports
6. Follow the established directory structure for new components 