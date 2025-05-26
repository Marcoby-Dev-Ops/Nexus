# Base UI Components

This directory contains reusable UI components for the Nexus project, built with React, TypeScript, shadcn/ui, and Tailwind CSS. Each component is accessible, theme-aware, and designed for composability.

## Components

### Button
A versatile button supporting variants, loading, and disabled states.
```tsx
import { Button } from './Button';
<Button variant="primary">Click me</Button>
```

### Input
A styled input field with error and icon support.
```tsx
import { Input } from './Input';
<Input placeholder="Email" error="Required" />
```

### Card
A container for grouping content, with optional header and footer.
```tsx
import { Card } from './Card';
<Card header="Title" footer="Footer">Content</Card>
```

### Modal
A modal dialog for overlays and confirmations.
```tsx
import { Modal } from './Modal';
<Modal open={true} onClose={() => {}}>Hello</Modal>
```

### Alert
A notification component for feedback messages.
```tsx
import { Alert } from './Alert';
<Alert type="success" message="Saved!" />
```

### Avatar
A user avatar with fallback to initials.
```tsx
import { Avatar } from './Avatar';
<Avatar initials="AB" />
```

### Dropdown
A dropdown menu for actions and navigation.
```tsx
import { Dropdown } from './Dropdown';
<Dropdown label="Menu"><button>Item</button></Dropdown>
```

### Tooltip
A tooltip for contextual help.
```tsx
import { Tooltip } from './Tooltip';
<Tooltip content="Info"><span>Hover me</span></Tooltip>
```

### Spinner
A spinner/loader for loading states.
```tsx
import { Spinner } from './Spinner';
<Spinner />
```

### Tabs
A tabs component for organizing content.
```tsx
import { Tabs } from './Tabs';
<Tabs tabs={[{ label: 'Tab1', content: 'Content1' }]} />
```

### Breadcrumbs
A breadcrumbs component for navigation context.
```tsx
import { Breadcrumbs } from './Breadcrumbs';
<Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Page' }]} />
```

### Table
A table for displaying tabular data.
```tsx
import Table from './Table';
<Table columns={[{ header: 'Name', accessor: 'name' }]} data={[{ name: 'Alice' }]} />
```

### Form
A form wrapper for grouping form elements with validation.
```tsx
import { Form } from './Form';
<Form onSubmit={fn}><Input /></Form>
```

### Header
The Header component now includes left padding (`pl-4`) for improved spacing from the left edge of the screen. This ensures the header content is not flush with the edge and provides a more visually appealing layout.
```tsx
import { Header } from './Header';
<Header />
``` 