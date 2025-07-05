# Library Directory Reorganization Plan

## Current State
The `src/lib` directory currently has 47+ files in its root, making it difficult to navigate and maintain.

## Proposed Structure

```
src/lib/
├── core/                    # Core system functionality
│   ├── supabase.ts         # Move from root
│   ├── database.types.ts   # Move from root
│   ├── environment.ts      # Move from root
│   ├── prisma.ts          # Move from root
│   └── config/
│       ├── chartColors.ts
│       └── styles.ts
│
├── auth/                    # Authentication & authorization
│   ├── unifiedAuthService.ts
│   ├── SupabaseProvider.tsx
│   └── userN8nConfig.ts
│
├── ai/                      # AI & ML functionality (already exists)
│   ├── insights.ts
│   ├── modelManager.ts
│   ├── contextualRAG.ts         # Move from root
│   ├── expertPromptEngine.ts    # Move from root
│   ├── multiModalIntelligence.ts # Move from root
│   ├── progressiveLearning.ts   # Move from root
│   ├── aiAgentWithTools.ts      # Move from root
│   ├── agentRegistry.ts         # Move from root
│   ├── nexusAIOrchestrator.ts   # Move from root
│   └── tools/
│
├── integrations/            # Integration management (already exists)
│   ├── hubspot/
│   ├── apiDocAnalyzer.ts
│   ├── hubspotIntegration.ts
│   ├── integrationDataAggregator.ts  # Move from root
│   ├── integrationIntelligence.ts    # Move from root
│   ├── centralizedAppsOrchestrator.ts # Move from root
│   └── docs/
│       ├── README_GOOGLE_ANALYTICS_SETUP.md
│       ├── integration-consistency-review.md
│       └── integration-workflow-best-practices.md
│
├── automation/              # Workflow & automation
│   ├── n8n/
│   │   ├── n8nService.ts           # Move from root
│   │   ├── n8nWorkflowBuilder.ts   # Move from root
│   │   ├── mcpN8nIntegration.ts    # Move from root
│   │   ├── n8nOnboardingManager.ts # Move from root
│   │   ├── useN8n.ts              # Move from root
│   │   └── README_N8N_INTEGRATION.md
│   ├── businessProcessMining.ts    # Move from root
│   └── intelligentSystemEvolution.ts # Move from root
│
├── business/                # Business logic & analytics
│   ├── analytics/
│   │   ├── businessHealthKPIs.ts   # Move from root
│   │   └── contextualExamples.ts   # Move from root
│   ├── health/
│   └── insights/
│
├── services/                # External service integrations (already exists)
│   └── [current service files]
│
├── hooks/                   # React hooks (already exists)
│   └── [current hook files]
│
├── stores/                  # State management (already exists)
│   └── [current store files]
│
├── contexts/                # React contexts (already exists)
│   └── [current context files]
│
├── types/                   # TypeScript types (already exists)
│   └── [current type files]
│
├── utils/                   # Utility functions (already exists)
│   ├── utils.ts            # Move from root
│   ├── storageUtils.ts     # Move from root
│   └── passkey.ts
│
├── security/                # Security utilities (already exists)
│   ├── index.ts
│   ├── logger.ts
│   ├── secureStorage.ts
│   └── security.ts         # Move from root (rename to avoid conflict)
│
├── constants/               # Constants & configuration (already exists)
│   └── [current constant files]
│
├── ui/                      # UI-specific utilities
│   ├── featureRegistry.tsx # Move from root
│   └── components/
│
└── onboarding/              # Onboarding specific
    └── useOnboarding.ts     # Move from root
```

## Migration Steps

### Phase 1: Create Directory Structure
1. Create new directories: `core/`, `auth/`, `automation/`, `business/`, `ui/`, `onboarding/`
2. Create subdirectories as needed

### Phase 2: Move Core Files
1. Move database and configuration files to `core/`
2. Move authentication files to `auth/`
3. Update import paths in moved files

### Phase 3: Move AI & ML Files
1. Move AI-related files to `ai/`
2. Update import paths

### Phase 4: Move Integration Files
1. Move integration files to `integrations/`
2. Move documentation to `integrations/docs/`
3. Update import paths

### Phase 5: Move Automation Files
1. Create `automation/n8n/` structure
2. Move n8n-related files
3. Move process mining files
4. Update import paths

### Phase 6: Move Business Logic
1. Move business analytics files to `business/`
2. Organize by subdomain
3. Update import paths

### Phase 7: Move UI & Utility Files
1. Move UI-specific files to `ui/`
2. Move remaining utilities to appropriate directories
3. Update import paths

### Phase 8: Update All Imports
1. Search and replace import paths across the codebase
2. Update any barrel exports (`index.ts` files)
3. Test that all imports work correctly

## Benefits

1. **Better Organization** - Related files are grouped together
2. **Easier Navigation** - Clear directory structure
3. **Improved Maintainability** - Easier to find and modify related code
4. **Better Scalability** - New files have clear homes
5. **Team Productivity** - Developers can find code faster
6. **Import Clarity** - Import paths indicate file purpose

## Considerations

1. **Breaking Changes** - All import paths will need updating
2. **Git History** - Use `git mv` to preserve file history
3. **CI/CD** - May need to update build scripts
4. **Documentation** - Update any documentation referencing file paths
5. **Team Coordination** - Should be done in a dedicated PR to avoid conflicts

## Implementation Priority

**High Priority** (Phase 1-3):
- Core infrastructure files
- Authentication files  
- AI/ML files (most actively developed)

**Medium Priority** (Phase 4-6):
- Integration files
- Automation files
- Business logic files

**Low Priority** (Phase 7-8):
- UI utilities
- Final cleanup and testing 