# Database Service Tables Validation - UPDATED

## Overview
Comprehensive review of all database tables to identify redundancies and ensure proper service coverage. Found several redundant tables and missing documentation for newer tables.

## Validation Results

### ✅ Core Business Tables
- `companies` - Company information
- `company_members` - Company membership relationships
- `organizations` - Organization data
- `user_organizations` - User-organization relationships
- `user_profiles` - User profile information
- `user_preferences` - User preferences
- ~~`user_mappings`~~ - **REMOVED** (dropped in migration 100)

### ✅ Integration Tables
- `integrations` - Available integrations
- `user_integrations` - User integration connections
- `oauth_tokens` - OAuth token storage
- `oauth_states` - OAuth state parameters for CSRF protection

### ✅ AI & Analytics Tables
- `ai_conversations` - AI conversation tracking
- `ai_messages` - AI message history
- `ai_experts` - AI expert definitions and configurations
- `ai_expert_prompts` - Multiple prompts per expert
- `expert_switching_rules` - Rules for expert selection
- `expert_performance` - Expert performance tracking
- `thoughts` - AI-generated insights (legacy)
- `ai_insights` - AI insights (legacy)
- `analytics_events` - Analytics event tracking
- `business_metrics` - Business metric storage

### ✅ Company Knowledge Tables
- `ckb_documents` - Company knowledge base documents
- `ckb_search_logs` - Search analytics
- `ckb_storage_connections` - Storage provider connections
- ~~`company_knowledge_data`~~ - **REDUNDANT** (overlaps with ckb_documents)
- ~~`company_knowledge_vectors`~~ - **REDUNDANT** (overlaps with ckb_documents)

### ✅ Playbook Tables (Step-by-Step Plans)
- `playbook_templates` - Playbook template definitions
- `playbook_items` - Playbook step definitions
- `user_playbook_progress` - User playbook progress tracking
- `user_playbook_responses` - User playbook responses
- `playbook_knowledge_mappings` - Link playbooks to knowledge updates
- `knowledge_update_triggers` - Knowledge update automation
- `monitoring_alerts` - System monitoring and alerts

### ✅ Journey Tables (Lifecycle Tracking)
- `user_journeys` - Active journey instances
- `step_responses` - Journey step responses
- `journey_analytics` - Journey completion analytics
- `journey_context_notes` - Knowledge enhancements from journeys
- `journey_playbook_mapping` - Backward compatibility mapping
- ~~`journey_templates`~~ - **REDUNDANT** (replaced by playbook_templates)
- ~~`journey_items`~~ - **REDUNDANT** (replaced by playbook_items)
- ~~`user_journey_progress`~~ - **REDUNDANT** (replaced by user_journeys)
- ~~`user_journey_responses`~~ - **REDUNDANT** (replaced by step_responses)

### ✅ Business Data Tables
- `deals` - Business deals and opportunities
- `contacts` - Business contacts
- `personal_thoughts` - User's personal thoughts and ideas
- `quantum_business_profiles` - Quantum business profiles
- `fire_assessments` - FIRE framework assessments
- `initiative_acceptances` - Initiative acceptance tracking
- `next_best_actions` - Next best action recommendations
- `brain_tickets` - Brain ticket system
- `business_health_snapshots` - Business health tracking

### ✅ Maturity Framework Tables
- `maturity_assessments` - User maturity assessment data
- `maturity_domains` - Maturity domain definitions
- `maturity_questions` - Assessment questions

### ✅ Building Blocks Tables
- `building_blocks` - Building block definitions
- `user_building_block_implementations` - User building block implementations

## Service Coverage

### ✅ Fully Supported Services
- **CompanyKnowledgeService** - Uses `ckb_documents`, `ckb_search_logs`, `ckb_storage_connections`
- **QuantumBusinessService** - Uses `quantum_business_profiles`
- **JourneyService** - Uses journey lifecycle tracking (`user_journeys`, `step_responses`, `journey_analytics`, `journey_context_notes`)
- **MaturityFrameworkService** - Uses `maturity_assessments`, `maturity_domains`, `maturity_questions`
- **PlaybookService** - Uses `playbook_templates`, `playbook_items`, `user_playbook_progress`, `user_playbook_responses`
- **BuildingBlocksService** - Uses `building_blocks`, `user_building_block_implementations`
- **FireInitiativeAcceptanceService** - Uses `initiative_acceptances`
- **NextBestActionService** - Uses `next_best_actions`
- **AIChatService** - Uses `ai_conversations`, `ai_messages`
- **AIExpertService** - Uses `ai_experts`, `ai_expert_prompts`, `expert_switching_rules`, `expert_performance`
- **DashboardService** - Uses `deals`, `contacts`, `personal_thoughts`, `business_health_snapshots`
- **OAuthService** - Uses `oauth_tokens`, `oauth_states`

### Sample Data Inserted
- **6 maturity domains** (Sales, Marketing, Operations, Finance, Leadership, People & Culture)
- **3 building blocks** (Sales Automation, Lead Scoring, Email Marketing)
- **3 playbook templates** (Business Onboarding, Sales Setup, Marketing Foundation)
- **7 AI experts** (Assistant, Identity, Revenue, Cash, Delivery, People, Knowledge, Systems)

## Redundancy Analysis

### ⚠️ Identified Redundancies
1. **Legacy Journey Tables**: Old journey template tables replaced by playbook system
2. **Knowledge Base Tables**: `company_knowledge_data` and `company_knowledge_vectors` overlap with `ckb_documents`
3. **AI Tables**: `thoughts` and `ai_insights` are legacy tables that may overlap with `ai_conversations`

### 🔧 Recommended Actions
1. **Remove Legacy Journey Tables**: `journey_templates`, `journey_items`, `user_journey_progress`, `user_journey_responses`
2. **Consolidate Knowledge Tables**: Migrate data from `company_knowledge_data`/`company_knowledge_vectors` to `ckb_documents`
3. **Review AI Tables**: Determine if `thoughts` and `ai_insights` are still needed
4. **Update Service References**: Ensure all services use the correct table names

### 📋 System Architecture
- **Playbooks**: Step-by-step plans that should be carried out by users to complete business tasks
- **Journeys**: Track the lifecycle of playbook execution (progress, responses, analytics)
- **Relationship**: Playbooks define the plan, Journeys track the execution

## Database Schema Features

### Indexes Created
- Performance indexes on all foreign keys
- Composite indexes for common query patterns
- Vector similarity indexes for semantic search
- GIN indexes for JSONB and array columns

### Constraints & Validation
- Foreign key constraints with CASCADE deletion
- Check constraints for data validation
- Unique constraints where appropriate

### Triggers
- Automatic `updated_at` timestamp updates
- Conversation metadata updates
- OAuth state cleanup

## Migration History
- **Migration 080**: Added missing service tables
- **Migration 084**: Created AI chat tables
- **Migration 088**: Unified playbook/journey system
- **Migration 093**: Added OAuth states table
- **Migration 096**: Created user functions
- **Migration 098**: Created AI experts system
- **Migration 100**: Simplified user management (removed user_mappings)
- **Migration 101**: Created personal thoughts table
- **Migration 102**: Created dashboard tables (deals, contacts)

## Validation Status: ⚠️ NEEDS CLEANUP

The database schema has grown significantly with some redundancies. While all services have the tables they need, there are legacy tables that should be removed to maintain a clean schema.

### Next Steps
1. **Remove redundant tables** identified in the analysis
2. **Migrate data** from legacy tables to current tables
3. **Update service references** to use correct table names
4. **Add RLS policies** for multi-tenant security
5. **Monitor performance** and add additional indexes as needed

## Table Relationships

### Playbook → Journey Flow
1. **PlaybookService** creates `playbook_templates` and `playbook_items` (step-by-step plans)
2. **JourneyService** creates `user_journeys` when a playbook is started
3. **JourneyService** tracks progress via `step_responses` and `journey_analytics`
4. **JourneyService** captures insights via `journey_context_notes`

### Data Flow
```
playbook_templates → user_journeys → step_responses → journey_analytics
     ↓                    ↓              ↓              ↓
playbook_items → journey_context_notes → knowledge updates
```
