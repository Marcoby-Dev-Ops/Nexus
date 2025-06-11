# Nexus Color Guidelines

## Brand Color System

Nexus uses a cohesive color system based on the core brand color `#006837` (dark green). This document outlines how to use colors consistently throughout the application.

## Color Palette

### Primary Colors
- **Primary**: `#006837` - Main brand color (dark green)
- **Secondary**: `#00a651` - Secondary brand color (medium green)
- **Tertiary**: `#008f4c` - Tertiary brand color (alternative green)
- **Dark**: `#00331b` - Very dark green for accents and backgrounds
- **Dark Alt**: `#013a1f` - Alternative dark green

### Accent Colors
- **Blue**: `#007aff` - Accent blue for highlights and CTAs

### Neutral Colors
- **Black**: `#000000` - Pure black
- **Gray 950**: `#111111` - Nearly black
- **Gray 900**: `#1a1a1a` - Very dark gray
- **Gray 800**: `#232323` - Darker gray
- **Gray 700**: `#272727` - Dark gray
- **Gray 200**: `#e4f0ec` - Very light green/gray
- **Gray 100**: `#f5f9f5` - Off-white with green tint
- **White**: `#ffffff` - Pure white

## Using Colors in the Codebase

### Tailwind Usage

All colors should be accessed via Tailwind utility classes that use our CSS variables:

```jsx
// DO THIS
<button className="bg-brand-primary text-white">Submit</button>
<div className="bg-brand-gray-100 text-brand-gray-900">Content</div>

// NOT THIS
<button className="bg-[#006837] text-[#ffffff]">Submit</button>
<div style={{ backgroundColor: '#f5f9f5', color: '#1a1a1a' }}>Content</div>
```

### CSS Variable Usage

When direct CSS is needed, use CSS variables rather than hex values:

```css
/* DO THIS */
.my-component {
  background-color: hsl(var(--primary));
  color: hsl(var(--foreground));
}

/* NOT THIS */
.my-component {
  background-color: #006837;
  color: #1a1a1a;
}
```

### Chart & Visualization Colors

For data visualizations, import the `chartColors` utility:

```jsx
import { chartColors } from '@/lib/chartColors';

// For single-series charts
<BarChart data={data}>
  <Bar dataKey="value" fill={chartColors.primary} />
</BarChart>

// For multi-series charts
<BarChart data={data}>
  {series.map((item, index) => (
    <Bar 
      key={item.name}
      dataKey={item.key} 
      fill={chartColors.categorical[index % chartColors.categorical.length]} 
    />
  ))}
</BarChart>
```

## Semantic Color Usage

### Contextual Colors

Use appropriate semantic colors for context:

| Context | Color Class | Usage |
|---------|-------------|-------|
| Success | `text-success`, `bg-success` | Confirmations, completed actions |
| Error | `text-destructive`, `bg-destructive` | Errors, destructive actions |
| Warning | `text-warning`, `bg-warning` | Warnings, cautionary information |
| Info | `text-primary`, `bg-primary` | Information, neutral notifications |

### Accessibility Considerations

- Always ensure sufficient color contrast (WCAG AA minimum)
- Don't rely solely on color to convey information
- Use our `text-primary-foreground` for text on colored backgrounds
- Test in both light and dark mode

## Dark Mode

The color system automatically handles dark mode via the `dark:` variant:

```jsx
<div className="bg-card dark:bg-card text-foreground dark:text-foreground">
  Content that works in both modes
</div>
```

## Consistency Script

We maintain a `fix-consistency.cjs` script that automatically fixes common color inconsistencies:

```bash
node scripts/fix-consistency.cjs
```

When adding new components, run this script to ensure your colors match our guidelines.

## Color Reference

You can see a live reference of all brand colors in the `ColorPalette` component:

```jsx
import ColorPalette from '@/components/ui/ColorPalette';

// In your component
<ColorPalette />
``` 