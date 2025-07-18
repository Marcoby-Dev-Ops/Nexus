# AI Domain Flattening Plan

## Current Issues
- Deep nesting with unclear organization
- Scattered components across multiple directories
- Complex import paths
- Inconsistent file organization

## Proposed Flattened Structure

```
src/domains/ai/
├── components/           # All UI components
│   ├── core/            # Core AI components
│   ├── chat/            # Chat interface components
│   ├── advanced/        # Advanced AI features
│   └── index.ts         # Central export
├── hooks/               # All React hooks
├── services/            # All service classes
├── lib/                 # Core libraries and utilities
├── pages/               # All page components
├── types/               # TypeScript type definitions
└── utils/               # Utility functions
```

## Migration Tasks

### 1. Consolidate Components
- Move all components from nested directories to `components/`
- Organize by category (core, chat, advanced)
- Update all import paths

### 2. Consolidate Services
- Move all service files to `services/`
- Remove nested service directories
- Update imports and exports

### 3. Consolidate Hooks
- Move all hooks to `hooks/`
- Remove nested hook directories
- Update imports

### 4. Consolidate Types
- Create `types/` directory
- Move type definitions from scattered locations
- Centralize type exports

### 5. Update Import Paths
- Update all import statements throughout the codebase
- Ensure consistent import patterns
- Update index files

## Benefits
- Simpler import paths
- Better discoverability
- Consistent organization
- Easier maintenance
- Reduced complexity

## Implementation Priority
1. High: Components and hooks (most used)
2. Medium: Services and lib files
3. Low: Documentation and utilities 