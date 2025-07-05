# Module Cleanup Analysis Report

Generated: 2025-06-28T03:47:33.203Z

## 🗑️ Unused Dependencies
These packages can likely be removed:

- `class-variance-authority`
- `@radix-ui/react-tabs`

## 📁 Potentially Unused Files
These files appear to be empty or redundant:

- `src/components/ai/AdvancedAIShowcase.tsx` (Empty/minimal file, 1 bytes)
- `src/components/integrations/HubSpotIntegrationSetup.tsx` (Empty/minimal file, 1 bytes)
- `src/components/integrations/index.ts` (Empty/minimal file, 78 bytes)
- `src/contexts/ThemeContext.tsx` (Empty/minimal file, 1 bytes)
- `src/lib/ai/tools/paypal.ts` (Empty/minimal file, 313 bytes)
- `src/lib/core/prisma.ts` (Empty/minimal file, 486 bytes)
- `src/lib/services/domainAnalysis_service.ts` (Empty/minimal file, 339 bytes)
- `src/lib/utils/utils.ts` (Empty/minimal file, 661 bytes)
- `src/pages/Nexus.tsx` (Empty/minimal file, 340 bytes)
- `src/pages/departments/operations/index.ts` (Empty/minimal file, 256 bytes)
- `src/pages/settings/ProfileSettings.tsx` (Empty/minimal file, 185 bytes)
- `src/types/markdown-overrides.d.ts` (Empty/minimal file, 97 bytes)
- `src/types/react-window-overrides.d.ts` (Empty/minimal file, 78 bytes)
- `src/vite-env.d.ts` (Empty/minimal file, 38 bytes)

**Potential space savings:** 2.8KB

## 🧹 Cleanup Commands

Remove unused dependencies:
```bash
npm uninstall class-variance-authority @radix-ui/react-tabs
```

## 📊 Bundle Impact Analysis

After cleanup, you should see:
- Faster `npm install` times
- Reduced bundle size
- Cleaner dependency tree
- Less maintenance overhead

## ✅ Safe to Remove

These are confirmed safe to remove:
- `shadcn` and `shadcn-ui` (CLI tools, not runtime dependencies)
- `pino-pretty` (not used in production logging)
- `@radix-ui/react-tabs` (using custom Tabs component)
- `class-variance-authority` (using custom styling approach)
