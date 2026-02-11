# Nexus Design System 🎨

> **Consistency Score Target:** 8.5+/10

## Overview

The Nexus Design System ensures consistent UX/UI patterns across our React/TypeScript application. This system is enforced through automated analysis and provides clear guidelines for developers.

## 🎯 Design Tokens

### Colors

Use design tokens instead of hardcoded colors:

```tsx
// ✅ Correct - Using design tokens
<div className="bg-primary text-primary-foreground">
<div className="bg-secondary text-secondary-foreground">
<div className="bg-muted text-muted-foreground">
<div className="bg-card text-foreground">

// ❌ Incorrect - Hardcoded colors
<div className="bg-blue-600 text-white">
<div className="bg-gray-100 text-gray-900">
```

### Spacing System

Use standardized spacing values:

```tsx
// ✅ Correct - Standard spacing
<div className="p-4 space-y-4">    // Small
<div className="p-6 space-y-6">    // Medium  
<div className="p-8 space-y-8">    // Large

// ❌ Incorrect - Non-standard spacing
<div className="p-3 space-y-5">
<div className="p-7 space-y-9">
```

## 🧩 Standardized Components

### Loading States

Always use the standardized `Spinner` component:

```tsx
import { Spinner } from '@/components/ui/Spinner';

// ✅ Correct
<Spinner size={16} className="text-primary" />

// ❌ Incorrect - Custom spinner
<div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
```

### Loading Patterns

Use `LoadingStates` for consistent loading experiences:

```tsx
import { LoadingStates } from '@/components/patterns/LoadingStates';

// Button loading
{isLoading ? <LoadingStates.Spinner size={16} /> : 'Submit'}

// Page loading
<LoadingStates.PageLoader message="Loading dashboard..." />

// Chat typing
<LoadingStates.TypingDots />
```

### Error Handling

Use design tokens for error states:

```tsx
// ✅ Correct
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>Something went wrong</AlertDescription>
</Alert>

// ❌ Incorrect
<div className="bg-red-100 text-red-800 p-4">
  Error message
</div>
```

### Data Display

Prefer standardized components:

```tsx
// ✅ Correct - Using Card component
<Card className="p-6">
  <CardHeader>
    <CardTitle>Dashboard Stats</CardTitle>
  </CardHeader>
  <CardContent>
    {/* content */}
  </CardContent>
</Card>

// ❌ Incorrect - Manual card styling
<div className="rounded-xl border border-gray-200 p-6 shadow-lg">
  {/* content */}
</div>
```

## 📐 Layout Patterns

### Page Structure

Use consistent page layouts:

```tsx
// Standard page template
<div className="min-h-screen bg-gradient-to-br from-background to-muted">
  <div className="p-8 space-y-8">
    <PageHeader title="Page Title" />
    <PageContent>
      {/* page content */}
    </PageContent>
  </div>
</div>
```

### Grid Systems

Use standardized grid patterns:

```tsx
// ✅ Correct - Standard grid
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
  {items.map(item => <Card key={item.id}>{item}</Card>)}
</div>

// ❌ Incorrect - Inconsistent spacing
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
```

## 🎨 Component Guidelines

### Button States

```tsx
// Loading state
<Button disabled={isLoading}>
  {isLoading ? <Spinner size={16} className="mr-2" /> : null}
  {isLoading ? 'Loading...' : 'Submit'}
</Button>
```

### Form Patterns

```tsx
// Consistent form styling
<div className="space-y-6">
  <div className="space-y-2">
    <Label htmlFor="email">Email</Label>
    <Input 
      id="email" 
      type="email" 
      placeholder="Enter your email"
      className="w-full"
    />
  </div>
</div>
```

## 🔍 Consistency Checking

### Automated Analysis

Run consistency checks regularly:

```bash
# Analyze current consistency
npm run analyze:consistency

# Apply automated fixes
npm run fix:consistency

# Check in CI/CD
npm run test:consistency
```

### Consistency Scores

- **9.0-10.0:** Excellent consistency
- **8.0-8.9:** Good consistency  
- **7.0-7.9:** Acceptable consistency
- **Below 7.0:** Needs improvement

### Common Issues to Avoid

1. **Hardcoded Colors**
   ```tsx
   // ❌ Don't do this
   className="bg-blue-600 text-white"
   
   // ✅ Do this instead
   className="bg-primary text-primary-foreground"
   ```

2. **Custom Spinners**
   ```tsx
   // ❌ Don't do this
   <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
   
   // ✅ Do this instead
   <Spinner size={16} />
   ```

3. **Non-standard Spacing**
   ```tsx
   // ❌ Don't do this
   className="p-3 space-y-5"
   
   // ✅ Do this instead
   className="p-4 space-y-4"
   ```

## 🚀 Development Workflow

### Before Committing

1. Run `npm run analyze:consistency`
2. Fix any high/medium priority issues
3. Ensure score is 7.0+ before pushing

### Code Review Checklist

- [ ] Uses design tokens instead of hardcoded colors
- [ ] Uses standardized components (`Spinner`, `Card`, etc.)
- [ ] Follows spacing system (p-4, p-6, p-8)
- [ ] Consistent error handling patterns
- [ ] Proper loading state implementations

### ESLint Integration

The project includes ESLint rules to catch consistency issues:

```json
{
  "rules": {
    "no-restricted-syntax": [
      "error",
      {
        "selector": "Literal[value=/bg-(blue|red|green|yellow|purple|indigo|gray)-\\d+/]",
        "message": "Use design tokens instead of hardcoded colors"
      }
    ]
  }
}
```

## 📚 Resources

- [Consistency Analysis Script](../../client/scripts/analyze-consistency.cjs)
- [Automated Fix Script](../../client/scripts/fix-consistency.cjs)
- [Component Library](../../client/src/shared/components/ui/)
- [Design Patterns](../../client/src/shared/components/patterns/)

---

**Remember:** Consistency is key to a professional, maintainable codebase. When in doubt, check the design system! 🎯 
