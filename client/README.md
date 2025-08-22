# Nexus Client

This is the frontend client for the Nexus platform.

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

# Run e2e tests
pnpm test:e2e
```

## Structure

- `src/` - Source code
  - `components/` - React components
  - `pages/` - Page components
  - `shared/` - Shared utilities and components
  - `hooks/` - Custom React hooks
  - `services/` - API services
  - `types/` - TypeScript type definitions

- `public/` - Static assets
- `__tests__/` - Test files
- `cypress/` - E2E tests

## Configuration

- `vite.config.ts` - Vite configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `jest.config.ts` - Jest test configuration
