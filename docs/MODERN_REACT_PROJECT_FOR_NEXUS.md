---
name: "Nexus — Frontend (React + TypeScript + Vite)"
description: "A tailored frontend development guide for the Nexus repository (client/), aligned to our tooling and conventions (pnpm, Vite, path aliases, api-client helpers, Tailwind, Vitest)."
category: "Frontend Framework"
author: "Nexus Team"
authorUrl: "https://github.com/Marcoby-Dev-Ops/Nexus"
tags: ["react", "typescript", "vite", "frontend", "spa", "pnpm"]
lastUpdated: "2025-10-01"
---

# Nexus Frontend Development Guide

This document adapts a modern React + TypeScript + Vite template to the Nexus codebase. The active frontend package lives under `client/` in this monorepo/workspace and uses pnpm.

## Project Overview

The `client/` app is a Vite + React 18 + TypeScript Single Page Application optimized for developer productivity and fast builds. We use Tailwind for styling, Vitest for unit tests, and several shared services under `client/src/shared/` and `client/src/lib/`.

## Tech Stack

 - Frontend Framework: React (19+) + TypeScript
- Build Tool: Vite
- Package manager: pnpm (workspace)
- State management: small stores (Zustand) and local context; Redux Toolkit when global predictability is required
- Routing: react-router-dom (v6)
- Styling: Tailwind CSS (see `client/tailwind.config.ts`)
- HTTP / DB helpers: `client/src/lib/api-client.ts` helpers (`selectData`, `insertOne`, ...)
 - Testing: Jest (primary in current client scripts) + Testing Library. Vitest is available in the repo and is a good option for new tests.
- Code quality: ESLint + Prettier; repo may use Husky for pre-commit hooks

## Important repo conventions

- The frontend package is `client/` — run client tasks with pnpm filter: `pnpm --filter client <script>` from repo root.
 - Use the repo path aliases declared in `client/tsconfig.json` (examples: `@/lib/*`, `@/shared/*`, `@/hooks/*`, `@/components/*`). Prefer these explicit aliases rather than assuming a single catch-all `@/*` mapping.
- Prefer dynamic imports for heavy AI or ML modules so the main bundle stays small.
- Use `client/src/lib/api-client.ts` for DB/API access. The helper functions sometimes accept an options object instead of positional args; check the function signature before calling.
- Keep in-memory caches short-lived (for UI speed only). Persisted store data belongs in the server or client-side persistent storage explicitly.

## Project Structure (client)

```
client/
├── public/
├── src/
│   ├── components/
│   ├── pages/
│   ├── lib/                # api-client, database wrappers, ai helpers
│   ├── shared/             # shared services, hooks, types
│   ├── styles/
│   ├── main.tsx
│   └── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Developer setup (quick)

From repo root:

```bash
# Install workspace deps once
pnpm install

# Start the client dev server
pnpm --filter client dev

# Run client tests
pnpm --filter client test
```

If you need to work only inside the client package you can `cd client` and run `pnpm install` there, but workspace installs are preferred.

## Environment variables

The client reads env vars with Vite's `import.meta.env`. Example variables we use in `client`:

```env
VITE_API_URL=https://api.mycompany.internal
VITE_APP_TITLE=Nexus Client
VITE_ENABLE_MOCK=false
```

Keep secrets out of repository files; use deployment tooling or local .env files ignored by git.

## Component development

- Use function components and hooks.
- Provide explicit props interfaces and export components as named exports.
- File and component names follow PascalCase.
- Keep components focused; move shared logic to `shared/hooks` or `shared/services`.

Example button (repo-friendly):

```tsx
// client/src/components/ui/Button.tsx
import React from 'react';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  onClick,
  children,
}) => (
  <button
    data-variant={variant}
    data-size={size}
    disabled={disabled}
    onClick={onClick}
    className="px-3 py-1 rounded"
  >
    {children}
  </button>
);
```

## State management

- For small local/global state, prefer Zustand stores under `client/src/shared/stores` (lightweight and simple).
- For complex flows (forms, optimistic updates, normalized data), use Redux Toolkit and keep slices modular.

## API / Database access

- Use helpers from `client/src/lib/api-client.ts` for query/insert/update operations. These helpers wrap our server API and database access patterns and return ApiResponse objects of shape `{ success, data?, error?, status? }`.
- Always handle the `error`/`success` return and avoid throwing raw errors to the UI.

selectData usage examples (supported forms)

```ts
// Old positional signature
const result = await selectData('chat_messages', '*', { conversation_id: conversationId });

// New object signature with paging
const result = await selectData({
  table: 'chat_messages',
  columns: '*',
  filters: { conversation_id: conversationId },
  limit: 25,
  offset: 0,
});
```

Note: Do not pass a fourth positional options object to `selectData(table, columns, filters, options)` — that form is not supported and was a common source of errors. Use the object form when you need `limit`/`offset` or other options.

Quick ApiClient example (preferred over direct axios usage in this repo):

```ts
import { ApiClient } from '@/lib/api-client';

const client = new ApiClient({ baseUrl: '' });
const response = await client.post('/api/db/insert', { table: 'chat_messages', data: { ... } });
if (!response.success) {
  // handle error: response.error
}
```

## Testing

- Tests run with Vitest. From repo root: `pnpm --filter client test`.
- Favor unit tests for utilities and small components and integration tests for pages and key flows.

Example unit test:

```tsx
// client/tests/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renders', () => {
    render(<Button variant="primary">Click</Button>);
    expect(screen.getByText('Click')).toBeInTheDocument();
  });

  it('calls onClick', () => {
    const cb = vi.fn();
    render(<Button variant="primary" onClick={cb}>Go</Button>);
    fireEvent.click(screen.getByText('Go'));
    expect(cb).toHaveBeenCalledTimes(1);
  });
});
```

## Performance and bundle size

- Use lazy/dynamic imports for large modules (AI, heavy visualization libs).
- Keep dependencies audited; use Vite's `optimizeDeps` if you need to pre-bundle large dependencies.
- Split vendor chunks in `vite.config.ts` only when necessary.

## Vite configuration (notes)

The client `vite.config.ts` already handles React plugin and path aliasing. Keep these in mind when adding new libraries.

Example optimizations in `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
});
```

## Common pitfalls

- Using absolute imports without the `@/` alias will break TS resolution in the client.
- Inconsistent `selectData` call shapes — check `client/src/lib/api-client.ts` and follow its current signature.
- In-memory caches in production code only improve UI latency; they don't persist across reloads.

## Linting / Type checking

Run these from repo root (preferred) or inside `client/` as needed. Because many scripts live in `client/package.json`, prefer the client filter form which targets the package directly:

```bash
# run the client's lint and type-check scripts
pnpm --filter client lint
pnpm --filter client type-check

# run client tests
pnpm --filter client test
```

Note: the root `package.json` includes convenience scripts (for example `dev` that cd's into `client`), but not necessarily `lint`/`type-check` at root — check `client/package.json` for the authoritative script names.

## Adding new features - checklist

- Add types to `client/src/shared/types` when introducing domain objects
- Add unit tests for new logic and components
- Use `@/` path alias; avoid relative import chains across many directories
- Lazy-load heavy modules
- Keep API calls in `lib`/`shared/services`, not directly from components

---

If you'd like, I can:
- Replace the earlier `FRONTEND_DEVELOPMENT_GUIDE.md` with this file as the canonical guide
- Run type/lint checks and fix remaining errors from earlier edits
- Create example tests or storybook stories for components

Tell me which follow-up you'd like next.